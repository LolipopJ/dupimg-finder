import { SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  InputNumber,
  Space,
  Table,
  type TableColumnsType,
  type TableColumnType,
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
  updateDupCheckResRecord,
} from "../lib/features/dupCheck/dupCheckResSlice";
import { useAppDispatch, useAppSelector } from "../lib/hooks";

export default function SearchPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [threshold, setThreshold] = useState<number>(98.5);
  const [sameDir, setSameDir] = useState<boolean>(true);

  const dupCheckRes = useAppSelector((state) => state.dupCheckRes.value);
  const dispatch = useAppDispatch();

  const onSearchDupImg = () => {
    setLoading(true);
    window.efficientIRApi.searchDupImg({ threshold, sameDir });
  };

  useEffect(() => {
    const cleanupSpawnStdout = window.ipc.on(
      SpawnEvents.SPAWN_STDOUT,
      (data: string, options: SpawnOptions) => {
        if (options.key !== EfficientIREvents.SEARCH_DUP_IMG) return;

        try {
          const parsedRes: DupCheckRes[] = JSON.parse(data);
          const parsedResRecord: DupCheckResRecord[] = parsedRes.map((res) => {
            return {
              ...res,
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

  const onOpenImage = async (path: string) => {
    const error = await window.electronApi.openFile(path);
    if (error) {
      console.error(`Open file \`${path}\` failed:`, error);
    }
  };

  const renderImagePath: TableColumnType<DupCheckResRecord>["render"] = (
    value,
    record,
  ) => {
    // const isPathA = value === record.path_a;
    // const [currentFileStat, otherFileStat] = isPathA
    //   ? [record.fileA, record.fileB]
    //   : [record.fileB, record.fileA];
    // const isOlder = currentFileStat.birthtimeMs < otherFileStat.birthtimeMs;
    // const isBigger = currentFileStat.size > otherFileStat.size;
    return (
      <div>
        <a onClick={() => onOpenImage(value)}>{value}</a>
        {/* {isOlder ? <small>older</small> : null}
        {isBigger ? <small>bigger</small> : null} */}
      </div>
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
            onChange={(v) => setThreshold(v)}
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
          rowKey="key"
          scroll={{ x: true }}
          loading={loading}
        />
      </div>
    </>
  );
}
