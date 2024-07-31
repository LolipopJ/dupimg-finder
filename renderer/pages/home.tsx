import { Button, Popconfirm, Space, Table, type TableColumnsType } from "antd";
import Head from "next/head";

import type { IndexRecord } from "../interfaces";
import {
  addIndexRecord,
  removeIndexRecord,
} from "../lib/features/indexRecord/indexRecordSlice";
import { useAppDispatch, useAppSelector } from "../lib/hooks";

export default function HomePage() {
  const indexRecord = useAppSelector((state) => state.indexRecord.value);
  const dispatch = useAppDispatch();

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
          <Popconfirm
            title="Confirm to remove this path?"
            onConfirm={() => dispatch(removeIndexRecord([record.path]))}
          >
            <Button type="link" size="small">
              DELETE
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  const onAddIndex = () => {
    window.electronApi.selectDirectory().then((res) => {
      dispatch(addIndexRecord(res.filePaths));
    });
  };

  return (
    <>
      <Head>
        <title>Home - Dupimg Finder</title>
      </Head>
      <div>
        <Space>
          <Button onClick={onAddIndex}>ADD INDEX</Button>
          <Button type="primary">UPDATE INDEX</Button>
        </Space>
        <Table
          columns={indexRecordTableColumns}
          dataSource={indexRecord}
          rowKey="path"
        ></Table>
      </div>
    </>
  );
}
