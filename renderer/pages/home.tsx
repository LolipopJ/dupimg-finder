import { Button, Popconfirm, Space, Table, type TableColumnsType } from "antd";
import Head from "next/head";
import { useState } from "react";

import type { IndexRecord } from "../interfaces";
import {
  addIndexRecord,
  refreshIndexRecord,
  removeIndexRecord,
  updateIndexRecord,
} from "../lib/features/indexRecord/indexRecordSlice";
import { useAppDispatch, useAppSelector } from "../lib/hooks";

export default function HomePage() {
  const [updateIndexRecordLoading, setUpdateIndexRecordLoading] =
    useState<boolean>(false);

  const indexRecord = useAppSelector((state) => state.indexRecord.value);
  const dispatch = useAppDispatch();

  const onRefreshIndex = () => {
    dispatch(refreshIndexRecord());
  };

  const onAddIndex = () => {
    window.electronApi.selectDirectory().then((res) => {
      dispatch(addIndexRecord(res.filePaths));
    });
  };

  const onRemoveIndex = (paths: IndexRecord["path"][]) => {
    dispatch(removeIndexRecord(paths));
  };

  const onUpdateIndex = (paths?: IndexRecord["path"][]) => {
    setUpdateIndexRecordLoading(true);
    dispatch(updateIndexRecord(paths));
    setUpdateIndexRecordLoading(false);
  };

  const indexRecordTableColumns: TableColumnsType<IndexRecord> = [
    {
      key: "path",
      title: "Path",
      dataIndex: "path",
    },
    {
      key: "lastUpdated",
      title: "Last Updated",
      dataIndex: "lastUpdated",
    },
    {
      key: "action",
      title: "Action",
      render: (value, record) => {
        return (
          <>
            <Button
              type="link"
              size="small"
              onClick={() => onUpdateIndex([record.path])}
              loading={updateIndexRecordLoading}
            >
              UPDATE
            </Button>
            <Popconfirm
              title="Confirm to remove this index directory?"
              onConfirm={() => onRemoveIndex([record.path])}
            >
              <Button
                type="link"
                danger
                size="small"
                disabled={updateIndexRecordLoading}
              >
                DELETE
              </Button>
            </Popconfirm>
          </>
        );
      },
    },
  ];

  return (
    <>
      <Head>
        <title>Home - Dupimg Finder</title>
      </Head>
      <div>
        <Space>
          <Button onClick={onRefreshIndex}>REFRESH</Button>
          <Button onClick={onAddIndex}>ADD INDEX</Button>
          <Popconfirm
            title="Confirm to update all index? This may take a long time."
            onConfirm={() => onUpdateIndex()}
          >
            <Button type="primary" loading={updateIndexRecordLoading}>
              UPDATE ALL INDEX
            </Button>
          </Popconfirm>
        </Space>
        <Table
          columns={indexRecordTableColumns}
          dataSource={indexRecord}
          rowKey="path"
        />
      </div>
    </>
  );
}
