import {
  FolderAddOutlined,
  MoreOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import {
  Button,
  Dropdown,
  Popconfirm,
  Space,
  Table,
  type TableColumnsType,
} from "antd";
import Head from "next/head";
import { useState } from "react";

import type { IndexRecord } from "../interfaces";
import {
  addIndexRecord,
  removeIndexRecord,
  updateIndexRecord,
  type UpdateIndexRecordPayload,
} from "../lib/features/config/configSlice";
import { useAppDispatch, useAppSelector } from "../lib/hooks";

export default function HomePage() {
  const [updateIndexRecordLoading, setUpdateIndexRecordLoading] =
    useState<boolean>(false);

  const indexRecord = useAppSelector((state) => state.config.indexRecord);
  const dispatch = useAppDispatch();

  const onAddIndex = () => {
    window.electronApi.selectDirectory().then((res) => {
      dispatch(addIndexRecord(res.filePaths));
    });
  };

  const onRemoveIndex = (paths: IndexRecord["path"][]) => {
    dispatch(removeIndexRecord(paths));
  };

  const onUpdateIndex = ({
    dirs,
    checkMeta,
  }: UpdateIndexRecordPayload = {}) => {
    setUpdateIndexRecordLoading(true);
    dispatch(updateIndexRecord({ dirs, checkMeta }));
    setUpdateIndexRecordLoading(false);
  };

  const indexRecordTableColumns: TableColumnsType<IndexRecord> = [
    {
      key: "path",
      title: "Path",
      dataIndex: "path",
      render: (value) => (
        <a title={value} onClick={() => window.electronApi.openFile(value)}>
          {value}
        </a>
      ),
    },
    {
      key: "lastUpdated",
      title: "Last Updated",
      dataIndex: "lastUpdated",
      render: (value) => value ?? "Never",
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
              onClick={() => onUpdateIndex({ dirs: [record.path] })}
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
        <title>Indexes - Dupimg Finder</title>
      </Head>
      <div>
        <Space className="mb-4 w-full justify-end">
          <Button onClick={onAddIndex} icon={<FolderAddOutlined />}>
            ADD INDEX
          </Button>
          <Dropdown.Button
            type="primary"
            onClick={() => onUpdateIndex()}
            icon={<MoreOutlined />}
            menu={{
              items: [
                {
                  key: "update",
                  label: "Update All Existing Index",
                  onClick: () => onUpdateIndex({ checkMeta: true }),
                },
              ],
            }}
            loading={updateIndexRecordLoading}
          >
            <SyncOutlined />
            UPDATE ALL INDEX
          </Dropdown.Button>
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
