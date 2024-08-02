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
  Table,
  type TableColumnsType,
  type TableColumnType,
  Tooltip,
} from "antd";
import Head from "next/head";
import { useEffect, useState } from "react";

import { EfficientIREvents, SpawnEvents } from "../enums";
import type {
  DupCheckRes,
  DupCheckResRecord,
  SpawnOptions,
} from "../interfaces";
import {
  setDupCheckResValue,
  updateDupCheckResFileStats,
} from "../lib/features/dupCheck/dupCheckResSlice";
import { useAppDispatch, useAppSelector } from "../lib/hooks";

const DEFAULT_THRESHOLD = 98.5;

export default function SearchPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [threshold, setThreshold] = useState<number>(DEFAULT_THRESHOLD);
  const [sameDir, setSameDir] = useState<boolean>(true);
  const [dupCheckResExpandedRowKeys, setDupCheckResExpandedRowKeys] = useState<
    string[]
  >([]);

  const dupCheckRes = useAppSelector((state) => state.dupCheckRes.value);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const cleanupSpawnStdout = window.ipc.on(
      SpawnEvents.SPAWN_STDOUT,
      // @ts-expect-error: override using defined types
      (data: string, options: SpawnOptions) => {
        if (options.key !== EfficientIREvents.SEARCH_DUP_IMG) return;

        try {
          const parsedRes: DupCheckRes[] = JSON.parse(data);
          const parsedResRecord: DupCheckResRecord[] = parsedRes.map((res) => {
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
          });
          dispatch(setDupCheckResValue(parsedResRecord));
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

  const onOpenImage = async (path: string) => {
    const error = await window.electronApi.openFile(path);
    if (error) {
      console.error(`Open file \`${path}\` failed:`, error);

      dispatch(
        updateDupCheckResFileStats({ path, stats: { isDeleted: true } }),
      );
      window.nodeApi.updateFileStatsCache(path, null);
    }
    return error;
  };

  const renderImagePath: TableColumnType<DupCheckResRecord>["render"] = (
    value,
    record,
  ) => {
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
  };

  const renderImagePreview = (path: string) => {
    return (
      <Image
        src={`media://${path}`}
        alt={path}
        className="cursor-pointer rounded-md"
        preview={false}
        onClick={() => onOpenImage(path)}
      />
    );
  };

  const dupCheckResTableColumns: TableColumnsType<DupCheckResRecord> = [
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
      render: (value) => (
        <span>
          {Number(value).toFixed(2)} <small>%</small>
        </span>
      ),
      defaultSortOrder: "descend",
      sorter: (a, b) => a.sim - b.sim,
    },
  ];

  return (
    <>
      <Head>
        <title>Search Duplicate Images - Dupimg Finder</title>
      </Head>
      <div>
        <Space className="mb-4 w-full justify-end">
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
        <Table
          columns={dupCheckResTableColumns}
          dataSource={dupCheckRes}
          loading={loading}
          rowKey="key"
          scroll={{ x: true }}
          expandable={{
            expandedRowKeys: dupCheckResExpandedRowKeys,
            expandRowByClick: true,
            onExpand: (expanded, record) => {
              if (expanded) {
                setDupCheckResExpandedRowKeys([record.key]);
              } else {
                setDupCheckResExpandedRowKeys([]);
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
