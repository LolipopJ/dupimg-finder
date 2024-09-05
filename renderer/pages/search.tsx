import {
  ClockCircleOutlined,
  FileImageOutlined,
  SearchOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Form,
  FormProps,
  InputNumber,
  Space,
  Switch,
  Table,
  type TableColumnsType,
  type TableColumnType,
  Tooltip,
} from "antd";
import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";

import ImagePreview from "../components/image-preview";
import { DEFAULT_SEARCH_DUP_PAIRS_OPTIONS } from "../constants";
import { EfficientIREvents, SpawnEvents } from "../enums";
import type {
  SearchDupPairsRes,
  SearchDupPairsResRecord,
  SpawnOptions,
} from "../interfaces";
import type { SearchDupPairsOptions } from "../interfaces";
import {
  addIgnoredRecord,
  removeIgnoredRecord,
  setSearchDupPairsResValue,
  updateSearchDupPairsResFileStats,
} from "../lib/features/searchDupPairs/searchDupPairsResSlice";
import { useAppDispatch, useAppSelector } from "../lib/hooks";

const CUSTOM_SEARCH_DUP_PAIRS_OPTIONS_KEY = "custom-search-dup-pairs-options";

export default function SearchPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [hideIgnoredPairs, setHideIgnoredPairs] = useState<boolean>(true);
  const [
    searchDupPairsResExpandedRowKeys,
    setSearchDupPairsResExpandedRowKeys,
  ] = useState<string[]>([]);

  const searchDupPairsRes = useAppSelector(
    (state) => state.searchDupPairsRes.value,
  );
  const ignoredSearchDupPairs = useAppSelector(
    (state) => state.searchDupPairsRes.ignored,
  );
  const dispatch = useAppDispatch();

  const filteredSearchDupPairsRes = useMemo(() => {
    if (hideIgnoredPairs) {
      return searchDupPairsRes.filter((pair) => {
        const { path_a, path_b } = pair;
        return !ignoredSearchDupPairs?.[path_a]?.[path_b];
      });
    }

    return searchDupPairsRes;
  }, [searchDupPairsRes, ignoredSearchDupPairs, hideIgnoredPairs]);

  useEffect(() => {
    const cleanupSpawnStdout = window.ipc.on(
      SpawnEvents.SPAWN_STDOUT,
      // @ts-expect-error: override using defined types
      (data: string, options: SpawnOptions) => {
        if (options.key !== EfficientIREvents.SEARCH_DUP_PAIRS) return;

        try {
          const parsedRes: SearchDupPairsRes[] = JSON.parse(data);
          const parsedResRecord: SearchDupPairsResRecord[] = parsedRes.map(
            (res) => {
              const [fileA, fileB] = window.electronApi.getFilesStats([
                res.path_a,
                res.path_b,
              ]);
              return {
                ...res,
                fileA: fileA ? fileA : { isDeleted: true },
                fileB: fileB ? fileB : { isDeleted: true },
                key: `${res.path_a}-${res.path_b}`,
              };
            },
          );
          dispatch(setSearchDupPairsResValue(parsedResRecord));
        } catch (error) {
          console.error("Resolve search duplicate images failed:", error);
        }
      },
    );
    const cleanupSpawnFinished = window.ipc.on(
      SpawnEvents.SPAWN_FINISHED,
      // @ts-expect-error: override using defined types
      (code: number, options: SpawnOptions) => {
        if (options.key !== EfficientIREvents.SEARCH_DUP_PAIRS) return;

        setLoading(false);
      },
    );

    return () => {
      cleanupSpawnStdout();
      cleanupSpawnFinished();
    };
  }, [dispatch]);

  const initialSearchDupPairsOptions: SearchDupPairsOptions =
    window.storeApi.getValue(CUSTOM_SEARCH_DUP_PAIRS_OPTIONS_KEY) ??
    DEFAULT_SEARCH_DUP_PAIRS_OPTIONS;

  const onSearchDupPairs: FormProps<SearchDupPairsOptions>["onFinish"] = (
    options,
  ) => {
    setLoading(true);

    window.storeApi.setValue(CUSTOM_SEARCH_DUP_PAIRS_OPTIONS_KEY, options);

    window.efficientIRApi.searchDupPairs(options);
  };

  const renderImagePreviewWithErrorHandler = useCallback(
    (path: string, innerChildren?: React.ReactNode) => {
      const onImageOutdated = async (path: string) => {
        dispatch(
          updateSearchDupPairsResFileStats({
            path,
            stats: { isDeleted: true },
          }),
        );
        window.electronApi.updateFileStatsCache(path, null);
      };

      return (
        <ImagePreview
          path={path}
          onDelete={(error) => {
            if (!error) onImageOutdated(path);
          }}
          onOpen={(error) => {
            if (error) onImageOutdated(path);
            document
              .querySelectorAll(`a[data-path='${encodeURIComponent(path)}']`)
              .forEach((element) => {
                element.classList.add("link--visited");
              });
          }}
          onReveal={(error) => {
            if (error) onImageOutdated(path);
          }}
        >
          {innerChildren}
        </ImagePreview>
      );
    },
    [dispatch],
  );

  const renderImagePath = useCallback<
    NonNullable<TableColumnType<SearchDupPairsResRecord>["render"]>
  >(
    (value, record) => {
      const { path_a, path_b, fileA, fileB } = record;
      const isPathA = value === path_a;

      const [currentFileStat, otherFileStat] = isPathA
        ? [fileA, fileB]
        : [fileB, fileA];
      const isDeleted = currentFileStat.isDeleted;
      const isEarlier =
        currentFileStat.birthtime && otherFileStat.birthtime
          ? currentFileStat.birthtime < otherFileStat.birthtime
          : false;
      const isLarger =
        currentFileStat.size && otherFileStat.size
          ? currentFileStat.size > otherFileStat.size
          : false;

      //#region get the equal part between filenames
      const pathA = path_a.replaceAll("\\", "/");
      const pathB = path_b.replaceAll("\\", "/");

      const fileDirA = pathA.substring(0, pathA.lastIndexOf("/") + 1);
      const fileDirB = pathB.substring(0, pathB.lastIndexOf("/") + 1);
      const currentFileDir = isPathA ? fileDirA : fileDirB;

      const filenameA = pathA.substring(pathA.lastIndexOf("/") + 1);
      const filenameB = pathB.substring(pathB.lastIndexOf("/") + 1);
      const currentFilename = isPathA ? filenameA : filenameB;

      let filenameEqualPart = "";
      let filenameEqualPartLastIndex = 0;
      while (
        filenameA[filenameEqualPartLastIndex] ===
          filenameB[filenameEqualPartLastIndex] &&
        filenameEqualPartLastIndex < filenameA.length &&
        filenameEqualPartLastIndex < filenameB.length
      ) {
        filenameEqualPart += filenameA[filenameEqualPartLastIndex];
        filenameEqualPartLastIndex += 1;
      }
      const currentFilenameDiffPart = currentFilename.substring(
        filenameEqualPartLastIndex,
      );

      const renderedFilename = (
        <>
          {currentFileDir}
          <strong>{filenameEqualPart}</strong>
          {currentFilenameDiffPart}
        </>
      );
      //#endregion

      return (
        <div>
          {renderImagePreviewWithErrorHandler(
            value,
            <a
              className={`block${isDeleted ? " !line-through" : ""}`}
              data-path={encodeURIComponent(value)}
              onClick={(e) => e.stopPropagation()}
            >
              {renderedFilename}
            </a>,
          )}
          <div className="mt-1 select-none">
            <Space>
              {isDeleted ? (
                <Tooltip title="Unable to fetch this image file, please consider updating index">
                  <WarningOutlined /> Outdated
                </Tooltip>
              ) : null}
              {isEarlier ? (
                <Tooltip title="This image file was created earlier">
                  <ClockCircleOutlined /> Earlier
                </Tooltip>
              ) : null}
              {isLarger ? (
                <Tooltip title="This image file's size is larger">
                  <FileImageOutlined /> Larger
                </Tooltip>
              ) : null}
            </Space>
          </div>
        </div>
      );
    },
    [renderImagePreviewWithErrorHandler],
  );

  const searchDupPairsResTableColumns: TableColumnsType<SearchDupPairsResRecord> =
    useMemo(
      () => [
        {
          key: "pathA",
          title: "Image A",
          dataIndex: "path_a",
          render: renderImagePath,
        },
        {
          key: "pathB",
          title: "Image B",
          dataIndex: "path_b",
          render: renderImagePath,
        },
        {
          key: "similarity",
          title: "Similarity",
          dataIndex: "sim",
          align: "center",
          render: (value) => {
            return (
              <span className="similarity-percent">
                {Number(value).toFixed(2)}
              </span>
            );
          },
          defaultSortOrder: "descend",
          sorter: (a, b) => a.sim - b.sim,
        },
        {
          key: "actions",
          title: "Actions",
          align: "end",
          render: (_, record) => {
            const { path_a, path_b } = record;
            const isIgnored = !!ignoredSearchDupPairs?.[path_a]?.[path_b];
            return (
              <Space onClick={(e) => e.stopPropagation()}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    if (isIgnored) {
                      dispatch(
                        removeIgnoredRecord({ pathA: path_a, pathB: path_b }),
                      );
                    } else {
                      dispatch(
                        addIgnoredRecord({ pathA: path_a, pathB: path_b }),
                      );
                    }
                  }}
                  danger={isIgnored}
                >
                  {isIgnored ? "IGNORED" : "IGNORE"}
                </Button>
              </Space>
            );
          },
        },
      ],
      [dispatch, ignoredSearchDupPairs, renderImagePath],
    );

  return (
    <>
      <Head>
        <title>Search Duplicate Images - Dupimg Finder</title>
      </Head>
      <div>
        <Form<SearchDupPairsOptions>
          name="search-dup-pairs-options"
          initialValues={initialSearchDupPairsOptions}
          onFinish={onSearchDupPairs}
          colon={false}
          className="flex"
        >
          <Space className="mr-2 items-start">
            <Form.Item className="w-32">
              <Switch
                value={hideIgnoredPairs}
                onChange={(checked) => setHideIgnoredPairs(checked)}
                checkedChildren={"HIDE IGNORED"}
                unCheckedChildren={"SHOW IGNORED"}
              />
            </Form.Item>
          </Space>
          <Space className="ml-auto items-start">
            <Form.Item name="sameDir" valuePropName="checked">
              <Checkbox className="select-none" disabled={loading}>
                Compare images of same directory
              </Checkbox>
            </Form.Item>
            <Form.Item
              name="threshold"
              className="w-52"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value) {
                      return Promise.reject(
                        new Error("Please enter similarity threshold"),
                      );
                    }
                    if (value > 100 || value < 70) {
                      return Promise.reject(
                        new Error(
                          "Similarity threshold should between 70 and 100",
                        ),
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                min={70}
                max={100}
                step={0.1}
                precision={1}
                addonBefore={
                  <Tooltip title=">= 95% is recommended">
                    <span className="select-none">{"Similarity >="}</span>
                  </Tooltip>
                }
                addonAfter={<span className="select-none">%</span>}
                disabled={loading}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
                loading={loading}
              >
                START SEARCH
              </Button>
            </Form.Item>
          </Space>
        </Form>
        <Table
          columns={searchDupPairsResTableColumns}
          dataSource={filteredSearchDupPairsRes}
          loading={loading}
          rowKey="key"
          scroll={{ x: true }}
          expandable={{
            expandedRowKeys: searchDupPairsResExpandedRowKeys,
            expandRowByClick: true,
            onExpand: (expanded, record) => {
              if (expanded) {
                setSearchDupPairsResExpandedRowKeys([record.key]);
              } else {
                setSearchDupPairsResExpandedRowKeys([]);
              }
            },
            expandedRowRender: (record) => {
              const { path_a, path_b } = record;
              return (
                <Space className="items-start" classNames={{ item: "flex-1" }}>
                  {renderImagePreviewWithErrorHandler(path_a)}
                  {renderImagePreviewWithErrorHandler(path_b)}
                </Space>
              );
            },
            // rowExpandable: (record) =>
            //   !record.fileA.isDeleted && !record.fileB.isDeleted,
          }}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            defaultPageSize: 20,
          }}
        />
      </div>
    </>
  );
}
