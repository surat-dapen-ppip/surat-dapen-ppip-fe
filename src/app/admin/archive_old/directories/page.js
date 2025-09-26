'use client'

import { createFile, createFolder, createShareFileOtherFolder, createShareFileOtherFolderSuratMasuk, createShareFilePublic, createShareFolderPermission, createShareFolderPublic, DeleteFile, deleteFolder, DeleteShareFileOtherFolder, DeleteShareFilePublic, DeleteShareFolderPermission, DeleteShareFolderPublic, getAllFolders, getDownloadFile, getDownloadFileSuratMasuk, getFileByFolder, getFileByFolderSuratMasuk, getFolderTree, getHistory, getShareFileOtherFolder, getShareFilePublic, getShareFolderPermission, getShareFolderPublic } from "@/services/archive-old";
import { getUsers } from "@/services/users";
import { Form, message, Modal, Popconfirm, Select, Space, Spin, Table, Tree } from "antd";
import { useEffect, useState } from "react";
import { MdContentCopy, MdDelete, MdFolder, MdFolderCopy, MdOutlineFolder, MdPeople, MdPeopleOutline, MdScreenShare, MdShare } from "react-icons/md";


const transformData = (data) => {
  return data.map((item) => ({
    title: item.name,
    key: item.uid,
    children: item.children ? transformData(item.children) : [],
  }));
};

const buildHierarchy = (data) => {
  // const parentMap = new Map();
  // const tree = [];

  // data.forEach((item) => {
  //   parentMap.set(item.id, { ...item, children: [] });
  // });

  // data.forEach((item) => {
  //   if (item.parent_id && parentMap.has(item.parent_id)) {
  //     parentMap.get(item.parent_id).children.push(parentMap.get(item.id));
  //   } else {
  //     tree.push(parentMap.get(item.id));
  //   }
  // });

  // return tree;
  // const buildHierarchy = (data) => {
  const parentMap = new Map();
  const childSet = new Set();

  data.forEach((item) => {
    parentMap.set(item.id, { ...item, children: [] });
  });

  data.forEach((item) => {
    if (item.parent_id && parentMap.has(item.parent_id)) {
      parentMap.get(item.parent_id).children.push(parentMap.get(item.id));
      childSet.add(item.id);
    }
  });

  return data.filter(item => !childSet.has(item.id)).map(item => parentMap.get(item.id));
  // };
};


export default function PageDirectories() {

  // const router = useRouter();

  const [userUID, setUserUID] = useState("")

  const [folderTree, setFolderTree] = useState([])
  const [folders, setFolders] = useState([])
  const [users, setUsers] = useState([])
  const [treeKeyExpend, setTreeKeyExpend] = useState("02c268da-5d32-4718-baec-679869b23df4")
  const [selectFolderUID, setSelectFolderUID] = useState("02c268da-5d32-4718-baec-679869b23df4")
  const [selectFolder, setSelectFolder] = useState({
    uid: "",
    name: ""
  })
  const [selectDataFile, setselectDataFile] = useState({
    uid: "",
    name_file: "",
    folder_uid: "",
  })

  const [dataFiles, setDataFiles] = useState([])
  const [dataShareOtherFolder, setDataShareOtherFolder] = useState([])
  const [dataShareFolderPermission, setDataShareFolderPermission] = useState([])
  const [dataSharePublic, setDataSharePublic] = useState([])
  const [dataShareFolderPublic, setDataShareFolderPublic] = useState([])
  const [dataHistory, setDataHistory] = useState([])

  const [showModalCreateFolder, setShowModalCreateFolder] = useState(false)
  const [showModalUploadFile, setShowModalUploadFile] = useState(false)
  const [showModalShareFileOtherFolder, setShowModalShareFileOtherFolder] = useState(false)
  const [showModalShareFilePublic, setShowModalShareFilePublic] = useState(false)
  const [showModalShareFolderPermission, setShowModalShareFolderPermission] = useState(false)
  const [showModalShareFolderPublic, setShowModalShareFolderPublic] = useState(false)
  const [showModalHistory, setShowModalHistory] = useState(false)
  const [FormFolder] = Form.useForm()
  const [FormFile] = Form.useForm()
  const [FormShareOtherFolder] = Form.useForm()
  const [FormShareFolderPermission] = Form.useForm()
  const [loadingSubmitFolder, setLoadingSubmitFolder] = useState(true)
  const [loadingSubmitFile, setLoadingSubmitFile] = useState(false)

  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]); // Simpan file yang dipilih
  };

  const [showConfirmationDeleteFolder, setShowConfirmationDeleteFolder] = useState(true)

  const fetchFolderTree = async () => {
    const response = await getFolderTree()
    if (response) {
      if (response.data.length > 0) {
        setSelectFolder(response.data[0])
        setSelectFolderUID(response.data[0].uid)
        setTreeKeyExpend(response.data[0].uid)
      }
      setFolderTree(transformData(buildHierarchy(response.data)))
      return response.data
    } else {
      return -1
    }
  }
  const fetchAllFolders = async () => {
    const response = await getAllFolders()
    if (response) {
      setFolders(response.data)
      return response.data
    } else {
      return -1
    }
  }
  const fetchAllUsers = async () => {
    const response = await getUsers()
    if (response) {
      setUsers(response.data)
      return response.data
    } else {
      return -1
    }
  }

  useEffect(() => {
    if (loadingSubmitFolder) {
      if (typeof window != "undefined") {
        setUserUID(localStorage.getItem("UserUID"))
        fetchFolderTree()
        fetchAllFolders()
        fetchAllUsers()
        setTimeout(() => {
          setLoadingSubmitFolder(false)
        }, 1000);
      }
    }
  }, [loadingSubmitFolder])



  const fetchFile = async () => {
    let response
    if (["SURAT MASUK"].includes(selectFolder.name)) {
      response = await getFileByFolderSuratMasuk(userUID, selectFolderUID)
    } else {
      response = await getFileByFolder(selectFolderUID)
    }
    if (response) {
      setDataFiles(response.data)
      return response.data
    } else {
      return -1
    }
  }

  useEffect(() => {
    setTimeout(() => {
      fetchFile()
    }, 500);
  }, [selectFolderUID, selectFolder])


  const handleOnSelect = (selectedKeys, info) => {
    setSelectFolderUID(info.node.key)
    setSelectFolder({
      uid: info.node.key,
      name: info.node.title
    })
  }

  const handleHideCreateFolder = () => {
    setShowModalCreateFolder(false)
    FormFolder.resetFields()
  }
  const handleShowCreateFolder = () => {
    setShowModalCreateFolder(true)
  }

  const handleSubmissionFolder = async () => {
    if (typeof window != "undefined") {
      let data = FormFolder.getFieldsValue()
      let userUid = localStorage.getItem("UserUID")
      let body_data = {}
      if (data.parent_id == undefined) {
        body_data = {
          name: data.name,
          user: userUid
        }
      } else {
        body_data = {
          name: data.name,
          parent_id: data.parent_id.value,
          user: userUid
        }
      }
      try {
        await createFolder(body_data)
        setLoadingSubmitFolder(true)
        handleHideCreateFolder()
        message.success("Berhasil membuat Folder")
      } catch (error) {
        message.error("Gagal membuat folder")
      }
    }
  }

  const handleShowConfirmDeleteFolder = () => {
    setShowConfirmationDeleteFolder(true)
  }
  const handleCancelConfirmDeleteFolder = () => {
    setShowConfirmationDeleteFolder(false)
  }

  const handleDeleteFolder = async () => {
    try {
      await deleteFolder(selectFolderUID)
      setLoadingSubmitFolder(true)
      // setSelectFolderUID("")
      message.success("Berhasil menghapus Folder")
    } catch (error) {
      message.error("Gagal menghapus folder")
    }
  }


  const handleHideUploadFile = () => {
    setShowModalUploadFile(false)
    FormFile.resetFields()
  }
  const handleShowUploadFile = () => {
    setShowModalUploadFile(true)
  }

  const handleSubmissionFile = async () => {
    if (typeof window != "undefined") {
      let userUid = localStorage.getItem("UserUID")
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user", userUid);
      formData.append("folder_uid", selectFolderUID);
      formData.append("type_document", "general");
      handleHideUploadFile()
      setLoadingSubmitFile(true)
      try {
        await createFile(formData)
        fetchFile()
        setTimeout(() => {
          setLoadingSubmitFile(false)
        }, 1000);
        message.success("Berhasil mengunggah file")
      } catch (error) {
        message.error("Gagal mengunggah file")
        setTimeout(() => {
          setLoadingSubmitFile(false)
        }, 1000);
      }
    }
  }

  const handleDeleteFile = async (uid) => {
    setLoadingSubmitFile(true)
    try {
      await DeleteFile(uid)
      fetchFile()
      setLoadingSubmitFile(false)
      message.success("Berhasil menghapus file")
    } catch (error) {
      setLoadingSubmitFile(false)
      message.error("Gagal menghapus file")
    }
  }

  const handleDownloadFile = async (record) => {
    if (typeof window != "undefined") {
      setLoadingSubmitFile(true)
      let userUid = localStorage.getItem("UserUID")
      try {
        let response
        if (selectFolder.name === "SURAT MASUK") {
          response = await getDownloadFileSuratMasuk(record.uid, userUid)
        } else {
          if (selectDataFile.type_document === "general") {
            response = await getDownloadFile(record.uid, userUid)
          } else {
            response = await getDownloadFileSuratMasuk(record.uid, userUid)
          }
        }

        const url = window.URL.createObjectURL(new Blob([response]));
        const link = window.document.createElement('a');
        link.href = url;
        if (selectFolder.name === "SURAT MASUK") {
          link.download = record.name_file + ".pdf";
        } else {
          if (selectDataFile.type_document === "general") {
            link.download = record.name_file;
          } else {
            link.download = record.name_file + ".pdf";
          }
        }
        link.click();

        fetchFile()
        message.success("Berhasil download file")
        setLoadingSubmitFile(false)
        return response.data
      } catch (error) {
        setLoadingSubmitFile(false)
        message.error("Gagal download file")
      }
    }
  }

  const columns = [
    {
      title: <div style={{ textAlign: 'center' }}>Nama Dokumen</div>,
      dataIndex: 'name_file',
      key: 'name_file',
      render: (text) => <a>{text}</a>,
    },
    {
      title: <div style={{ textAlign: 'center' }}>Tanggal Upload</div>,
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (text) => FormatDate(text)
    },
    {
      title: <div style={{ textAlign: 'center' }}>Action</div>,
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <button onClick={() => handleDownloadFile(record)}>Unduh</button>
          <button onClick={() => handleShowHistory(record)}>Riwayat</button>
          {
            selectFolderUID === record.folder_uid && (
              <>
                <button onClick={() => handleShowOtherFolder(record)}>Salin</button>
                {
                  !["SURAT MASUK", "SURAT KELUAR", "MEMO DINAS"].includes(selectFolder.name) && (
                    <>
                      <Popconfirm
                        title="Hapus File ini"
                        description="Apakah kamu yakin hapus file ini"
                        onConfirm={() => handleDeleteFile(record.uid)}
                        onCancel={() => { }}
                        okText="Ya, Yakin"
                        cancelText="Batal"
                      >
                        <button >
                          Hapus
                        </button>
                      </Popconfirm>
                    </>
                  )
                }
              </>
            )
          }
        </Space>
      ),
    },
  ];


  const handleHideShareOtherFolder = () => {
    setShowModalShareFileOtherFolder(false)
    // FormFile.resetFields()
  }
  const handleShowOtherFolder = (record) => {
    setShowModalShareFileOtherFolder(true)
    setselectDataFile(record)
  }

  const handleSubmissionShareOtherFolder = async () => {
    let data = FormShareOtherFolder.getFieldsValue()
    try {
      setLoadingSubmitFolder(true)
      if (selectFolder.name === 'SURAT MASUK') {
        await createShareFileOtherFolderSuratMasuk({
          uid: selectDataFile.uid,
          name_file: selectDataFile.name_file,
          type_document: "surat masuk",
          folder_uid_shared: data.folder_uid.value,
          folder_uid: selectFolderUID
        })
      } else {
        await createShareFileOtherFolder({
          archive_upload_uid: selectDataFile.uid,
          folder_uid: data.folder_uid.value
        })
      }
      fetchShareOtherFolder()
      FormShareOtherFolder.resetFields()
      message.success("Berhasil membuat Folder")
    } catch (error) {
      message.error("Gagal membuat folder")
    }
  }

  const fetchShareOtherFolder = async () => {
    const response = await getShareFileOtherFolder(selectDataFile.uid)
    if (response) {
      setDataShareOtherFolder(response.data)
      return response.data
    } else {
      return -1
    }
  }

  useEffect(() => {
    if (selectDataFile.uid !== "") {
      fetchShareOtherFolder()
    }
  }, [selectDataFile])

  const handleDeleteShareOtherFolder = async (uid) => {
    setLoadingSubmitFolder(true)
    try {
      await DeleteShareFileOtherFolder(uid)
      fetchShareOtherFolder()
      message.success("Berhasil menghapus share")
    } catch (error) {
      message.error("Gagal menghapus share")
    }
  }

  const handleHideSharePublic = () => {
    setShowModalShareFilePublic(false)
    // FormFile.resetFields()
  }
  const handleShowSharePublic = (record) => {
    setShowModalShareFilePublic(true)
    setselectDataFile(record)
  }

  const handleSubmissionShareFilePublic = async () => {
    if (typeof window != "undefined") {
      let userUid = localStorage.getItem("UserUID")
      try {
        setLoadingSubmitFolder(true)
        await createShareFilePublic({
          archive_upload_uid: selectDataFile.uid,
          shared_by: userUid
        })
        fetchShareFilePublic()
        message.success("Berhasil membuat berbagi link")
      } catch (error) {
        message.error("Gagal membuat berbagi link")
      }
    }
  }

  const fetchShareFilePublic = async () => {
    const response = await getShareFilePublic(selectFolderUID)
    if (response) {
      setDataSharePublic(response.data)
      return response.data
    } else {
      return -1
    }
  }

  useEffect(() => {
    if (selectDataFile.uid !== "") {
      fetchShareFilePublic()
    }
  }, [selectDataFile])

  const handleDeleteSharePublic = async (uid) => {
    setLoadingSubmitFolder(true)
    try {
      await DeleteShareFilePublic(uid)
      fetchShareFilePublic()
      message.success("Berhasil menghapus share link")
    } catch (error) {
      message.error("Gagal menghapus share link")
    }
  }

  const handleHideShareFolderPermission = () => {
    setShowModalShareFolderPermission(false)
    // FormFile.resetFields()
  }
  const handleShowFolderPermission = () => {
    setShowModalShareFolderPermission(true)
    fetchShareFolderPermission()
  }

  const handleSubmissionShareFolderPermission = async () => {
    let data = FormShareFolderPermission.getFieldsValue()
    try {
      // setLoadingSubmitFolder(true)
      await createShareFolderPermission({
        user_uid: data.user_uid.value,
        folder_uid: selectFolderUID
      })
      fetchShareFolderPermission()
      FormShareFolderPermission.resetFields()
      message.success("Berhasil membuat Folder")
    } catch (error) {
      message.error("Gagal membuat folder")
    }
  }

  const fetchShareFolderPermission = async () => {
    const response = await getShareFolderPermission(selectFolderUID)
    if (response) {
      setDataShareFolderPermission(response.data)
      return response.data
    } else {
      return -1
    }
  }

  const handleDeleteShareFolderPermission = async (uid) => {
    setLoadingSubmitFolder(true)
    try {
      await DeleteShareFolderPermission(uid)
      fetchShareFolderPermission()
      message.success("Berhasil menghapus share")
    } catch (error) {
      message.error("Gagal menghapus share")
    }
  }


  const handleHideShareFolderPublic = () => {
    setShowModalShareFolderPublic(false)
    // FormFile.resetFields()
  }
  const handleShowShareFolderPublic = (record) => {
    setShowModalShareFolderPublic(true)
    fetchShareFolderPublic()
  }

  const handleSubmissionShareFolderPublic = async () => {
    if (typeof window != "undefined") {
      let userUid = localStorage.getItem("UserUID")
      try {
        await createShareFolderPublic({
          folder_uid: selectFolderUID,
          shared_by: userUid
        })
        fetchShareFolderPublic()
        message.success("Berhasil membuat berbagi link")
      } catch (error) {
        message.error("Gagal membuat berbagi link")
      }
    }
  }

  const fetchShareFolderPublic = async () => {
    const response = await getShareFolderPublic(selectFolderUID)
    if (response) {
      setDataSharePublic(response.data)
      return response.data
    } else {
      return -1
    }
  }

  const handleDeleteShareFolderPublic = async (uid) => {
    setLoadingSubmitFolder(true)
    try {
      await DeleteShareFolderPublic(uid)
      fetchShareFolderPublic()
      message.success("Berhasil menghapus share link")
    } catch (error) {
      message.error("Gagal menghapus share link")
    }
  }

  const handleHideHistory = () => {
    setShowModalHistory(false)
    // FormFile.resetFields()
  }
  const handleShowHistory = (record) => {
    setShowModalHistory(true)
    fetchHistory(record)
  }

  const fetchHistory = async (record) => {
    const response = await getHistory(record.uid)
    if (response) {
      setDataHistory(response.data)
      return response.data
    } else {
      return -1
    }
  }

  return (
    <main>
      <div className="flex justify-between">
        <h2 className="text-xl text-gray-700 font-semibold">
          Arsip
        </h2>
      </div>

      <Spin spinning={loadingSubmitFolder} tip="Sedang memproses, mohon tunggu...">
        <Spin spinning={loadingSubmitFile} tip="Sedang memproses, mohon tunggu...">
          <div className="mt-3">
            <div className="flex flex-row items-start gap-6 md:gap-8">
              <div className="w-1/4 bg-white">
                <div className="flex flex-row space-x-2 p-2">
                  {
                    ["09e9032f-0aed-46db-808d-45b0b86c5659", "d87b3b33-d54f-4bcc-9735-7a84ce0f8f64", "a9fe68b3-4a2e-4eab-98bf-349cf47e103c", "b05ad18a-c8dc-411c-bf62-59a8750d93d7"].includes(userUID) && (
                      <button className="text-sm my-2 border-gray-500 border p-2 rounded text-gray-500" onClick={handleShowCreateFolder}>
                        <div className="flex items-center">
                          <MdOutlineFolder size={15} />
                          <span className="text-xs">
                            Tambah Folder
                          </span>
                        </div>
                      </button>
                    )
                  }
                </div>
                <hr className="border-gray-100" />
                {
                  folderTree.length > 0 && (
                    <Tree
                      className="p-3"
                      defaultExpandedKeys={[treeKeyExpend]}
                      showLine
                      defaultSelectedKeys={[selectFolderUID]}
                      onSelect={handleOnSelect}
                      treeData={folderTree}
                    />
                  )
                }
              </div>
              <div className="bg-white p-2 w-3/4">
                <div className="flex flex-row spaxe-x-2 items-center text-gray-500 bg-gray-100 p-2">
                  <MdFolder className="mr-2"></MdFolder>
                  <span>{selectFolder.name}</span>
                </div>
                <div className="flex flex-row space-x-2 p-2">

                  {
                    (selectFolderUID !== "" && ["09e9032f-0aed-46db-808d-45b0b86c5659", "d87b3b33-d54f-4bcc-9735-7a84ce0f8f64", "a9fe68b3-4a2e-4eab-98bf-349cf47e103c", "b05ad18a-c8dc-411c-bf62-59a8750d93d7"].includes(userUID)) && (

                      !["SURAT MASUK", "SURAT KELUAR", "MEMO DINAS"].includes(selectFolder.name) && (
                        <>
                          <div className="flex flex-row space-x-2 border-r" >
                            <Popconfirm
                              title="Hapus Folder ini"
                              description="Apakah kamu yakin hapus folder ini"
                              onConfirm={handleDeleteFolder}
                              onCancel={handleCancelConfirmDeleteFolder}
                              okText="Ya, Yakin"
                              cancelText="Batal"
                            >
                              <button className="text-sm my-2  p-2 rounded text-gray-500" onClick={handleShowConfirmDeleteFolder}>
                                <div className="flex items-center">
                                  <MdDelete size={15} />
                                  <span className="text-xs">
                                    Hapus Folder
                                  </span>
                                </div>
                              </button>
                            </Popconfirm>
                            <button className="p-2 my-2 text-gray-500 text-xs" onClick={handleShowFolderPermission}>
                              <div className="flex items-center">
                                <MdScreenShare size={15} />
                                <span className="text-xs">
                                  Mapping User
                                </span>
                              </div>
                            </button>
                            <button className="p-2 my-2 text-xs text-gray-500" onClick={handleShowShareFolderPublic}>
                              <div className="flex items-center">
                                <MdShare size={15} />
                                <span className="text-xs">
                                  Berbagi folder ke publik
                                </span>
                              </div>
                            </button>
                          </div>
                          <button className="bg-gray-500 p-2 my-2 rounded text-white font-semibold text-xs" onClick={handleShowUploadFile}>
                            Tambahkan Arsip
                          </button>
                        </>
                      )
                    )
                  }
                </div>
                {
                  ["SURAT MASUK", "SURAT KELUAR", "MEMO DINAS"].includes(selectFolder.name) ?
                    <Table columns={columns} dataSource={dataFiles} pagination={true} />
                    :
                    <Table columns={columns} dataSource={dataFiles} pagination={false} />

                }
              </div>
            </div>
          </div>

          <Modal
            open={showModalCreateFolder}
            title="Create New"
            footer={false}
            onCancel={handleHideCreateFolder}
            maskClosable={false}
          >
            <Form
              layout='horizontal'
              form={FormFolder}
              onFinish={handleSubmissionFolder}
            >
              <Form.Item
                label="Nama Folder"
                name={"name"}
                rules={[{ required: true, message: 'Tolong masukan nama folder' }]}
              >
                <input
                  type="text"
                  placeholder="masukan nama folder"
                  className="text-sm p-3 border-0 bg-gray-100 rounded  text-black placeholder-gray-300 w-full ml-2"
                />
              </Form.Item>
              <Form.Item
                label="Folder Utama"
                name={"parent_id"}
              >
                <Select
                  labelInValue
                  optionFilterProp="label"
                  showSearch
                  placeholder={"Masukan folder utama"}
                  options={folders?.map((record) => {
                    return {
                      value: record.id,
                      label: record.name
                    }
                  })}
                  className="mb-3 ml-2 single bg-gray-100"
                />
              </Form.Item>

              <div className="flex justify-end">
                <div className="flex space-x-3">
                  <button className="flex-1 bg-red-500 text-white py-3 rounded font-semibold min-w-20"
                    onClick={handleHideCreateFolder}
                  >
                    Batal
                  </button>

                  <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold min-w-20"
                    htmlType="submit"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </Form>
          </Modal>

          <Modal
            open={showModalUploadFile}
            title="Upload File"
            footer={false}
            onCancel={handleHideUploadFile}
            maskClosable={false}
          >
            <Form
              layout='horizontal'
              form={FormFile}
              onFinish={handleSubmissionFile}
            >
              <Form.Item
                // label="file"
                name={"file"}
                rules={[{ required: true, message: 'Tolong masukan file' }]}
              >
                <input
                  type="file"
                  placeholder="masukan file"
                  onChange={handleFileChange}
                  className="text-sm p-2 border-0 bg-gray-100 rounded  text-black placeholder-gray-300 w-full ml-2"
                  accept="application/pdf"
                />
              </Form.Item>

              <div className="flex justify-end">
                <div className="flex space-x-3">
                  <button className="flex-1 bg-red-500 text-white py-3 rounded font-semibold min-w-20"
                    htmlType="button" onClick={handleHideUploadFile}
                  >
                    Batal
                  </button>

                  <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold min-w-20"
                    htmlType="submit"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </Form>
          </Modal>
        </Spin>
      </Spin>

      <Modal
        open={showModalShareFileOtherFolder}
        title="Salin file ke folder lain"
        footer={false}
        onCancel={handleHideShareOtherFolder}
        maskClosable={false}
      >
        <Form
          layout='horizontal'
          form={FormShareOtherFolder}
          onFinish={handleSubmissionShareOtherFolder}
        >
          <Form.Item
            name={"folder_uid"}
            required={true}
          >
            <Select
              labelInValue
              optionFilterProp="label"
              showSearch
              placeholder={"Masukan folder utama"}
              options={folders?.map((record) => {
                return {
                  value: record.uid,
                  label: record.name
                }
              })}
              className="mb-3 ml-2 single bg-gray-100"
            />
          </Form.Item>
          <div className="flex justify-end">
            <div className="flex space-x-3">
              <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold min-w-20"
                htmlType="submit"
              >
                Simpan
              </button>
            </div>
          </div>
        </Form>

        <hr className="my-2" />
        <div>
          <div className="text-md font-bold mb-3">Daftar salinan ke folder lain</div>
          {
            dataShareOtherFolder?.map((item, index) => (
              selectFolderUID != item.folder_uid && (
                <div key={index} className="bg-slate-100 rounded p-2 flex justify-between items-center">
                  <div className="flex flex-row space-x-2 items-center">
                    <MdFolderCopy />
                    <div>{item.folder_name}</div>
                  </div>
                  <button onClick={() => handleDeleteShareOtherFolder(item.uid)} className="border border-red-500 text-red-500 p-2 rounded"> Hapus </button>
                </div>

              )
            ))
          }
        </div>
      </Modal>

      <Modal
        open={showModalShareFilePublic}
        title="Berbagi file ke Publik"
        footer={false}
        onCancel={handleHideSharePublic}
        maskClosable={false}
      >

        <div className="flex justify-start">
          <div className="flex space-x-3">
            <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold min-w-20"
              type="button"
              onClick={() => handleSubmissionShareFilePublic()}
            >
              Buat Link
            </button>
          </div>
        </div>

        <hr className="my-2" />
        <div>
          <div className="text-md font-bold mb-3">Daftar berbagi ke folder lain</div>
          {
            dataSharePublic?.map((item, index) => (
              <div key={index} className="bg-slate-100 rounded p-2 flex justify-between items-center">
                <div className="cursor-pointer text-xs" onClick={() => navigator.clipboard.writeText(`${location.origin}/download/${item.link}`)}>{location.origin}/download/{item.link}</div>
                <button onClick={() => handleDeleteSharePublic(item.uid)} className="border border-red-500 text-red-500 p-2 rounded"> Hapus </button>
              </div>


            ))
          }
        </div>
      </Modal>

      <Modal
        open={showModalShareFolderPermission}
        title="Mapping User ke user lain"
        footer={false}
        onCancel={handleHideShareFolderPermission}
        maskClosable={false}
      >
        <Form
          layout='horizontal'
          form={FormShareFolderPermission}
          onFinish={handleSubmissionShareFolderPermission}
        >
          <Form.Item
            name={"user_uid"}
            required={true}
          >
            <Select
              labelInValue
              optionFilterProp="label"
              showSearch
              placeholder={"Pilih user"}
              options={users?.map((record) => {
                return {
                  value: record.UID,
                  label: record.Name + ' | ' + record.Username
                }
              })}
              className="mb-3 ml-2 single bg-gray-100"
            />
          </Form.Item>
          <div className="flex justify-end">
            <div className="flex space-x-3">
              <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold min-w-20"
                htmlType="submit"
              >
                Simpan
              </button>
            </div>
          </div>
        </Form>

        <hr className="my-2" />
        <div>
          <div className="text-md font-bold mb-3">Daftar salinan ke user lain</div>
          {
            dataShareFolderPermission?.map((item, index) => (
              item.status_owner !== 'yes' && (
                <div key={index} className="bg-slate-100 rounded p-2 flex justify-between items-center">
                  <div className="flex flex-col" >
                    <div className="text-sm font-semibold flex flex-row items-center space-x-3" > <MdPeopleOutline /> <span> {item.username} - {item.name} </span></div>
                    <div className="text-xs text-gray-400">{item.user_uid}</div>
                  </div>
                  <button onClick={() => handleDeleteShareFolderPermission(item.uid)} className="border border-red-500 text-red-500 p-2 rounded"> Hapus </button>
                </div>

              )
            ))
          }
        </div>
      </Modal>

      <Modal
        open={showModalShareFolderPublic}
        title="Berbagi Folder ke Publik"
        footer={false}
        onCancel={handleHideShareFolderPublic}
        maskClosable={false}
      >

        <div className="flex justify-start">
          <div className="flex space-x-3">
            <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold min-w-20"
              type="button"
              onClick={() => handleSubmissionShareFolderPublic()}
            >
              Buat Link
            </button>
          </div>
        </div>

        <hr className="my-2" />
        <div>
          <div className="text-md font-bold mb-3">Daftar berbagi link ke publik</div>
          {
            dataSharePublic?.map((item, index) => (
              <div key={index} className="bg-slate-100 rounded p-2 flex justify-between items-center">
                <div className="cursor-pointer text-xs" onClick={() => navigator.clipboard.writeText(`${location.origin}/download/${item.link}`)}>{location.origin}/download/{item.link}</div>
                <button onClick={() => handleDeleteShareFolderPublic(item.uid)} className="border border-red-500 text-red-500 p-2 rounded"> Hapus </button>
              </div>


            ))
          }
        </div>
      </Modal>

      <Modal
        open={showModalHistory}
        title="Riwayat Unduh dan Unggah pada Dokumen tersebut"
        footer={false}
        onCancel={handleHideHistory}
        maskClosable={false}
      >

        <hr className="my-2" />
        <div className="flex flex-col space-y-2">
          {
            dataHistory?.map((item, index) => (
              <div key={index} className="bg-slate-100 rounded p-2 flex-row justify-between items-center">
                <div className="text-sm text-blue-500">{item.action} - {item.name} </div>
                <div className="text-xs text-gray-500" >{FormatDate(item.created_at)}</div>
              </div>
            ))
          }
        </div>
      </Modal>

    </main>
  )
}

const FormatDate = (isoDate) => {
  const date = new Date(isoDate);

  const formattedDate = date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  return formattedDate
};