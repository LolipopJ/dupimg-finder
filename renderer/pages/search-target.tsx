import {
  ClockCircleOutlined,
  ExportOutlined,
  FileImageOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Button,
  Image,
  InputNumber,
  Popover,
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
  FileStats,
  SearchDupRes,
  SearchDupResRecord,
  SpawnOptions,
} from "../interfaces";
import {
  setSearchDupResValue,
  updateSearchDupResFileStats,
} from "../lib/features/searchDup/searchDupResSlice";
import { useAppDispatch, useAppSelector } from "../lib/hooks";

const DEFAULT_MATCH_N = 5;

export default function SearchTargetPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [targetImagePath, setTargetImagePath] = useState<string>();
  const [targetImageStats, setTargetImageStats] = useState<FileStats>({});
  const [matchN, setMatchN] = useState<number>(DEFAULT_MATCH_N);

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
            const [file] = window.nodeApi.getFilesStats([res.path]);
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

        setLoading(false);
      },
    );

    return () => {
      cleanupSpawnStdout();
    };
  }, [dispatch]);

  const onSearchDupImg = async () => {
    const selectFileRes = await window.electronApi.selectImage();
    if (!selectFileRes.canceled) {
      setLoading(true);

      const path = selectFileRes.filePaths[0];
      setTargetImagePath(path);

      const [stats] = window.nodeApi.getFilesStats([path]);
      setTargetImageStats(stats ?? { isDeleted: true });

      window.efficientIRApi.searchDupImgOfTarget(path, { matchN });
    }
  };

  const onOpenImage = async (path: string) => {
    const error = await window.electronApi.openFile(path);
    if (error) {
      console.error(`Open file \`${path}\` failed:`, error);

      dispatch(
        updateSearchDupResFileStats({ path, stats: { isDeleted: true } }),
      );
      window.nodeApi.updateFileStatsCache(path, null);
    }
    return error;
  };

  const renderImagePath: TableColumnType<SearchDupResRecord>["render"] = (
    value,
    record,
  ) => {
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
        <a
          className={`block ${isDeleted ? "!line-through" : ""}`}
          data-path={value}
          onClick={(e) => {
            e.stopPropagation();
            e.currentTarget.classList.add("link--visited");
            onOpenImage(value);
          }}
        >
          {renderedFilename}
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

  const searchDupResTableColumns: TableColumnsType<SearchDupResRecord> = [
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
        return renderImagePreview(record.path);
      },
    },
    {
      key: "similarity",
      title: "Similarity",
      dataIndex: "sim",
      align: "center",
      className: "align-top",
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
        <title>Search Duplicate Images of Target - Dupimg Finder</title>
      </Head>
      <div>
        <Space className="mb-4 w-full justify-end">
          <InputNumber
            value={matchN}
            onChange={(v) => setMatchN(v ?? DEFAULT_MATCH_N)}
            min={1}
            step={1}
            addonBefore="Match most similar"
            addonAfter="images"
            disabled={loading}
          />
          <Popover
            trigger={targetImagePath ? ["hover"] : []}
            title="Current selected image"
            overlayClassName="preview-image-card"
            content={() => {
              if (!targetImagePath) return null;
              return (
                <>
                  <div className="mb-2">{targetImagePath}</div>
                  <div>{renderImagePreview(targetImagePath)}</div>
                </>
              );
            }}
          >
            <Button
              type="primary"
              onClick={onSearchDupImg}
              icon={<ExportOutlined />}
              loading={loading}
            >
              SELECT TARGET IMAGE
            </Button>
          </Popover>
        </Space>
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
