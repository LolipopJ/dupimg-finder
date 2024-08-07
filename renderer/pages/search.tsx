import {
  ClockCircleOutlined,
  FileImageOutlined,
  SearchOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Image,
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

import { EfficientIREvents, SpawnEvents } from "../enums";
import type {
  SearchDupPairsRes,
  SearchDupPairsResRecord,
  SpawnOptions,
} from "../interfaces";
import {
  addIgnoredRecord,
  removeIgnoredRecord,
  setSearchDupPairsResValue,
  updateSearchDupPairsResFileStats,
} from "../lib/features/searchDupPairs/searchDupPairsResSlice";
import { useAppDispatch, useAppSelector } from "../lib/hooks";

const DEFAULT_THRESHOLD = 98.5;

export default function SearchPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [hideIgnoredPairs, setHideIgnoredPairs] = useState<boolean>(true);
  const [threshold, setThreshold] = useState<number>(DEFAULT_THRESHOLD);
  const [sameDir, setSameDir] = useState<boolean>(true);
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
        if (options.key !== EfficientIREvents.SEARCH_DUP_IMG) return;

        try {
          const parsedRes: SearchDupPairsRes[] = JSON.parse(data);
          const parsedResRecord: SearchDupPairsResRecord[] = parsedRes.map(
            (res) => {
              const [fileA, fileB] = window.nodeApi.getFilesStats([
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

        setLoading(false);
      },
    );

    return () => {
      cleanupSpawnStdout();
    };
  }, [dispatch]);

  const onSearchDupImg = () => {
    setLoading(true);
    window.efficientIRApi.searchDupImg({ threshold, sameDir });
  };

  const onOpenImage = useCallback(
    async (path: string) => {
      const error = await window.electronApi.openFile(path);
      if (error) {
        console.error(`Open file \`${path}\` failed:`, error);

        dispatch(
          updateSearchDupPairsResFileStats({
            path,
            stats: { isDeleted: true },
          }),
        );
        window.nodeApi.updateFileStatsCache(path, null);
      }
      return error;
    },
    [dispatch],
  );

  const renderImagePreview = useCallback(
    (path: string) => {
      return (
        <Image
          src={`media://${path}`}
          alt={path}
          className="cursor-pointer rounded-md"
          preview={false}
          onClick={() => onOpenImage(path)}
        />
      );
    },
    [onOpenImage],
  );

  const renderImagePath = useCallback<
    NonNullable<TableColumnType<SearchDupPairsResRecord>["render"]>
  >(
    (value, record) => {
      const isPathA = value === record.path_a;
      const [currentFileStat, otherFileStat] = isPathA
        ? [record.fileA, record.fileB]
        : [record.fileB, record.fileA];

      const isDeleted = currentFileStat.isDeleted;
      const isEarlier =
        currentFileStat.birthtime && otherFileStat.birthtime
          ? currentFileStat.birthtime < otherFileStat.birthtime
          : false;
      const isLarger =
        currentFileStat.size && otherFileStat.size
          ? currentFileStat.size > otherFileStat.size
          : false;

      return (
        <div>
          <a
            className={`block ${isDeleted ? "!line-through" : ""}`}
            data-path={value}
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.classList.add("link--visited");
              onOpenImage(value);
            }}
          >
            {value}
          </a>
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
    [onOpenImage],
  );

  const searchDupPairsResTableColumns: TableColumnsType<SearchDupPairsResRecord> =
    [
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
            <span>
              {Number(value).toFixed(2)} <small>%</small>
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
    ];

  return (
    <>
      <Head>
        <title>Search Duplicate Images - Dupimg Finder</title>
      </Head>
      <div>
        <div className="mb-4 flex align-middle">
          <Space className="mr-2">
            <Switch
              value={hideIgnoredPairs}
              onChange={(checked) => setHideIgnoredPairs(checked)}
              checkedChildren={"HIDE IGNORED"}
              unCheckedChildren={"SHOW IGNORED"}
            />
          </Space>
          <Space className="ml-auto">
            <Checkbox
              checked={sameDir}
              onChange={(e) => setSameDir(e.target.checked)}
            >
              Compare images of same directory
            </Checkbox>
            <InputNumber
              value={threshold}
              onChange={(v) => setThreshold(v ?? DEFAULT_THRESHOLD)}
              min={70}
              max={100}
              step={0.1}
              precision={1}
              addonBefore="Similarity >="
              addonAfter="%"
              disabled={loading}
            />
            <Button
              type="primary"
              onClick={onSearchDupImg}
              icon={<SearchOutlined />}
              loading={loading}
            >
              START SEARCH
            </Button>
          </Space>
        </div>
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
              return (
                <Space>
                  {renderImagePreview(record.path_a)}
                  {renderImagePreview(record.path_b)}
                </Space>
              );
            },
            rowExpandable: (record) =>
              !record.fileA.isDeleted && !record.fileB.isDeleted,
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
