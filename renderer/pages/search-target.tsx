import {
  ClockCircleOutlined,
  ExportOutlined,
  FileImageOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  FormProps,
  InputNumber,
  Popover,
  Space,
  Table,
  type TableColumnsType,
  type TableColumnType,
  Tooltip,
} from "antd";
import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";

import ImagePreview from "../components/image-preview";
import { DEFAULT_SEARCH_DUP_OPTIONS } from "../constants";
import { EfficientIREvents, SpawnEvents } from "../enums";
import type {
  FileStats,
  SearchDupOptions,
  SearchDupRes,
  SearchDupResRecord,
  SpawnOptions,
} from "../interfaces";
import {
  setSearchDupResValue,
  updateSearchDupResFileStats,
} from "../lib/features/searchDup/searchDupResSlice";
import { useAppDispatch, useAppSelector } from "../lib/hooks";

const CUSTOM_SEARCH_DUP_OPTIONS_KEY = "custom-search-dup-options";

export default function SearchTargetPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [targetImagePath, setTargetImagePath] = useState<string>();
  const [targetImageStats, setTargetImageStats] = useState<FileStats>({});

  const searchDupRes = useAppSelector((state) => state.searchDupRes.value);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const cleanupSpawnStdout = window.ipc.on(
      SpawnEvents.SPAWN_STDOUT,
      // @ts-expect-error: override using defined types
      (data: string, options: SpawnOptions) => {
        if (options.key !== EfficientIREvents.SEARCH_DUP_IMG_OF_TARGET) return;

        try {
          const parsedRes: SearchDupRes[] = JSON.parse(data);
          const parsedResRecord: SearchDupResRecord[] = parsedRes.map((res) => {
            const [file] = window.electronApi.getFilesStats([res.path]);
            return {
              ...res,
              file: file ? file : { isDeleted: true },
              key: res.path,
            };
          });
          dispatch(setSearchDupResValue(parsedResRecord));
        } catch (error) {
          console.error(
            "Resolve search duplicate images of target failed:",
            error,
          );
        }
      },
    );
    const cleanupSpawnFinished = window.ipc.on(
      SpawnEvents.SPAWN_FINISHED,
      // @ts-expect-error: override using defined types
      (code: number, options: SpawnOptions) => {
        if (options.key !== EfficientIREvents.SEARCH_DUP_IMG_OF_TARGET) return;

        setLoading(false);
      },
    );

    return () => {
      cleanupSpawnStdout();
      cleanupSpawnFinished();
    };
  }, [dispatch]);

  const initialSearchDupOptions: SearchDupOptions =
    window.storeApi.getValue(CUSTOM_SEARCH_DUP_OPTIONS_KEY) ??
    DEFAULT_SEARCH_DUP_OPTIONS;

  const onSearchDupImg: FormProps<SearchDupOptions>["onFinish"] = async (
    options,
  ) => {
    const selectFileRes = await window.electronApi.selectImage();
    if (!selectFileRes.canceled) {
      setLoading(true);

      const path = selectFileRes.filePaths[0];
      setTargetImagePath(path);

      const [stats] = window.electronApi.getFilesStats([path]);
      setTargetImageStats(stats ?? { isDeleted: true });

      window.storeApi.setValue(CUSTOM_SEARCH_DUP_OPTIONS_KEY, options);

      window.efficientIRApi.searchDupImgOfTarget(path, options);
    }
  };

  const renderImagePreviewWithErrorHandler = useCallback(
    (path: string, innerChildren?: React.ReactNode) => {
      const onImageOutdated = async (path: string) => {
        dispatch(
          updateSearchDupResFileStats({ path, stats: { isDeleted: true } }),
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
              .querySelector(`a[data-path='${encodeURIComponent(path)}']`)
              ?.classList.add("link--visited");
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
    NonNullable<TableColumnType<SearchDupResRecord>["render"]>
  >(
    (value, record) => {
      const renderedFilename = String(value).replaceAll("\\", "/");

      const isDeleted = record.file.isDeleted;
      const isEarlier =
        record.file.birthtime && targetImageStats.birthtime
          ? record.file.birthtime < targetImageStats.birthtime
          : false;
      const isLarger =
        record.file.size && targetImageStats.size
          ? record.file.size > targetImageStats.size
          : false;

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
    [renderImagePreviewWithErrorHandler, targetImageStats],
  );

  const searchDupResTableColumns: TableColumnsType<SearchDupResRecord> =
    useMemo(
      () => [
        {
          key: "path",
          title: "Image",
          dataIndex: "path",
          className: "align-top",
          render: renderImagePath,
        },
        {
          key: "preview",
          title: "Preview",
          width: "50%",
          render: (_, record) => {
            return renderImagePreviewWithErrorHandler(record.path);
          },
        },
        {
          key: "similarity",
          title: "Similarity",
          dataIndex: "sim",
          align: "center",
          className: "align-top",
          render: (value) => (
            <span className="similarity-percent">
              {Number(value).toFixed(2)}
            </span>
          ),
          defaultSortOrder: "descend",
          sorter: (a, b) => a.sim - b.sim,
        },
      ],
      [renderImagePath, renderImagePreviewWithErrorHandler],
    );

  return (
    <>
      <Head>
        <title>Search Duplicate Images of Target - Dupimg Finder</title>
      </Head>
      <div>
        <Form<SearchDupOptions>
          name="search-dup-options"
          initialValues={initialSearchDupOptions}
          onFinish={onSearchDupImg}
          colon={false}
          className="flex"
        >
          <Space className="ml-auto items-start">
            <Form.Item
              name="matchN"
              className="w-72"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || value < 1) {
                      return Promise.reject(
                        new Error("Please enter match count"),
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                min={1}
                step={1}
                addonBefore={
                  <span className="select-none">Match most similar</span>
                }
                addonAfter={<span className="select-none">images</span>}
                disabled={loading}
              />
            </Form.Item>
            <Popover
              trigger={targetImagePath ? ["hover"] : []}
              title="Target image"
              overlayClassName="preview-image-card"
              content={() => {
                if (!targetImagePath) return null;
                return (
                  <div>
                    <code className="mb-2">{targetImagePath}</code>
                    {renderImagePreviewWithErrorHandler(targetImagePath)}
                  </div>
                );
              }}
            >
              <Button
                type="primary"
                htmlType="submit"
                icon={<ExportOutlined />}
                loading={loading}
              >
                SELECT TARGET IMAGE
              </Button>
            </Popover>
          </Space>
        </Form>
        <Table
          columns={searchDupResTableColumns}
          dataSource={searchDupRes}
          loading={loading}
          rowKey="key"
          scroll={{ x: true }}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            defaultPageSize: 10,
          }}
        />
      </div>
    </>
  );
}
