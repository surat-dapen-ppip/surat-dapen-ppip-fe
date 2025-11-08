/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import { createMessage, createMessageArchive, getArchiveMessage, getMessages } from "@/services/message";
import { Button, Form, message, Modal, Select, Space, Spin, Table, Upload } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

import moment from "moment";
import { MdClear, MdSearch, MdUpload } from "react-icons/md";
import { getUsers } from "@/services/users";
import axios from "axios";

export default function pageHistory() {
    const router = useRouter()

    const [dataMessage, setDataMessage] = useState()
    const [dataUser, setDataUser] = useState()

    const [optionOrderBy, setOptionOrderBy] = useState([
        { value: 'ASC', label: 'Terlama' },
        { value: 'DESC', label: 'Terbaru' }
    ])

    const [keyword, setKeyword] = useState("")
    const [MessageNumber, setMessageNumber] = useState("")
    const [MessageSender, setMessageSender] = useState("")
    const [MessageOrder, setMessageOrder] = useState("")
    const [MessageCategory, setMessageCategory] = useState("")

    const handleSearch = async () => {
        await fetchMessage(keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory)
    }

    const handleSelectUser = async (value) => {
        setMessageSender(value)
        await fetchMessage(keyword, MessageNumber, value, MessageOrder, MessageCategory)
    }

    const handleDiselectUser = async () => {
        setMessageSender("")
        await fetchMessage(keyword, MessageNumber, "", MessageOrder, MessageCategory)
    }

    const handleSelectOrderBy = async (value) => {
        setMessageOrder(value)
        await fetchMessage(keyword, MessageNumber, MessageSender, value, MessageCategory)
    }

    const handleDiselectOrderBy = async () => {
        setMessageOrder("")
        await fetchMessage(keyword, MessageNumber, MessageSender, "", MessageCategory)
    }

    const handleSelectCategory = async (value) => {
        setMessageCategory(value)
        await fetchMessage(keyword, MessageNumber, MessageSender, MessageOrder, value)
    }

    const handleDeselectCategory = async () => {
        setMessageCategory("")
        await fetchMessage(keyword, MessageNumber, MessageSender, MessageOrder, "")
    }


    const handleKeyPress = async (e) => {
        if (e.key === 'Enter') {
            await fetchMessage(keyword, MessageNumber)
        }
    }
    const fetchMessage = async (keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory) => {
        if (typeof window !== 'undefined') {
            const archived = true
            const response = await getArchiveMessage(archived, keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory)
            if (response) {
                setDataMessage(response.data)
            }
        }

    }

    const fetchUser = async () => {
        const response = await getUsers()
        if (response) {
            setDataUser(response.data)
        }
    }

    const columns = [
        {
            title: 'No Surat',
            render: (_, record) => {
                return <div>
                    {record.MessageClassification == 0 ? record.MessageNumberMasuk : null}
                    {record.MessageClassification == 1 ? record.MessageNumberKeluar : null}
                    {record.MessageClassification == 2 ? record.MessageNumberMemo : null}
                </div>
            }
        },
        {
            title: 'Judul',
            dataIndex: 'Title',
            key: 'Title',
        },
        {
            title: 'Pengirim',
            dataIndex: 'ExternalSender',
            key: 'ExternalSender',
        },
        {
            title: 'Sifat',
            dataIndex: 'nature_name',
            key: 'nature_name',
        },
        {
            title: 'Prioritas',
            dataIndex: 'priority_name',
            key: 'priority_name',
        },
        {
            title: 'Tanggal Surat',
            dataIndex: 'Date',
            key: 'Date',
            render: (_, record) => {
                return <div>
                    {moment(record.Date).format('YYYY-MM-DD')}
                </div>
            }
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: (_, record) => {
                return (
                    <div
                        onClick={() => {
                            router.push("/admin/archive/suratKeluar/detail?uid=" + record.UID)
                        }}
                        className="p-1 text-gray-700 bg-white border border-gray-300 shadow-md rounded text-center font-semibold text-md cursor-pointer">
                        Buka
                    </div>
                )
            }
        },
    ];


    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [formArchive] = Form.useForm()
    const [optionArchive, setOptionArchive] = useState([])
    const [isCreateArchive, setIsCreateArchive] = useState(false)
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [pdfUrl, setPdfUrl] = useState(null);

    const handleOpenCreateArchive = () => {
        fetchArchiveOption()
        formArchive.resetFields()
        setFileList([])
        setPdfUrl(null)

        setIsCreateArchive(true)
    }

    const handleCloseCreateArchive = () => {
        setIsCreateArchive(false)
    }

    const handleFinishArchive = async () => {
        setLoadingSubmit(true); // Start loading spinner
        setIsCreateArchive(false);

        let data = formArchive.getFieldsValue()


        try {
            const media = await handleUpload()
            data.ArchivedMediaUID = media.data.UID
            data.ListMedia = null

            await createMessageArchive(data)
            setFileList([])
            setPdfUrl(null)
            fetchMessage(keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory)

            fetchArchiveOption()
            formArchive.resetFields()
            message.success("Proses Berhasil")
        } catch (error) {
            message.error("Proses Gagal")
        } finally {
            
            setLoadingSubmit(false); // Stop loading spinner
        }
    }

    const fetchArchiveOption = async () => {
        const archived = false
        const response = await getArchiveMessage(archived)

        if(response?.data == null || response?.data == undefined){
            setOptionArchive([])
        }else{
            setOptionArchive(
                response.data.map((item) => ({
                    label: item.MessageNumberKeluar,
                    value: item.UID
                })
            ))
        }
    }

    const handleUpload = async () => {
        if (fileList.length === 0) {
            message.error('Please select a PDF file before uploading.');
            return;
        }

        setLoading(true);

        // Create a FormData object to hold the file
        const formData = new FormData();
        formData.append('file', fileList[0].originFileObj); // The file to upload

        try {
            // Make a POST request to your Go backend
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/mediaS3`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Success response
            //message.success('Attachment uploaded successfully');
            return response.data
        } catch (error) {
            //message.error('Failed to upload Attachment');
            //console.log(error)
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Handle file selection and validation
    const handleChange = ({ fileList }) => {
        const file = fileList[0]?.originFileObj;
        if (file) {
            setFileList(fileList.slice(-1)); // Only keep the last file (single file upload)
            const fileUrl = URL.createObjectURL(file); // Create a URL for the PDF preview
            setPdfUrl(fileUrl);
        }
    };

    // Validate file type and size before uploading
    const beforeUpload = (file) => {
        // Allowed file types
        const allowedTypes = [
            'application/pdf',             // PDF
            'application/msword',          // Word (.doc)
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word (.docx)
            'application/vnd.ms-excel',    // Excel (.xls)
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel (.xlsx)
            'image/jpeg',                  // JPEG images
            'image/png'                    // PNG images
        ];

        // Check if file type is allowed
        const isTypeValid = allowedTypes.includes(file.type);
        if (!isTypeValid) {
            message.error('Hanya dapat mengupload file PDF, Word, Excel, atau gambar (JPEG/PNG)');
            return Upload.LIST_IGNORE; // Ignore files with unsupported types
        }

        // Size check (in MB)
        const isSizeValid = file.size / 1024 / 1024 < 10; // Max size is 10MB
        if (!isSizeValid) {
            message.error('Ukuran file maksimal adalah 10MB');
            return Upload.LIST_IGNORE; // Ignore files larger than 10MB
        }

        return isTypeValid && isSizeValid;
    };

    


    useEffect(() => {
        fetchUser()
        fetchMessage()
    }, [])

    return (
        <main>
            <div className="flex justify-between">
                <h2 className="text-xl text-gray-700 font-semibold">
                    Arsip Surat Keluar
                </h2>

                <button className="bg-gray-500 p-3 rounded text-white font-semibold"
                    onClick={handleOpenCreateArchive}
                >
                    Tambahkan Arsip
                </button>
            </div>

            <Spin spinning={loadingSubmit} tip="Sedang memproses, mohon tunggu...">

                <div className="p-6 bg-white shadow-sm rounded mt-5">
                    <div className="flex justify-between">
                        <div>
                            <Space>
                                <div className="bg-gray-100 p-1 rounded mb-3"
                                >
                                    <input className="rounded text-sm p-2 bg-gray-100" placeholder="Cari Nomor Surat..."
                                        value={MessageNumber}
                                        onChange={(e) => {
                                            setMessageNumber(e.target.value)
                                        }}
                                        onKeyDown={handleKeyPress}
                                        style={{
                                            width: '150px'
                                        }}
                                    />
                                    <button
                                        className="pl-1 pr-1"
                                        onClick={handleSearch}
                                    ><MdSearch className="text-lg top-1 relative" /></button>
                                    <button
                                        className="pl-3 pr-3"
                                        onClick={() => {
                                            setMessageNumber("")
                                            fetchMessage(keyword, "", MessageSender, MessageOrder, MessageCategory)
                                        }}
                                    ><MdClear className="text-lg top-1 relative" /></button>
                                </div>
                                <div className="bg-gray-100 p-1 rounded mb-3">
                                    <input className="rounded text-sm p-2 bg-gray-100" placeholder="Cari Judul..."
                                        value={keyword}
                                        onChange={(e) => {
                                            setKeyword(e.target.value)
                                        }}
                                        onKeyDown={handleKeyPress}
                                    />
                                    <button
                                        className="pl-3 pr-3"
                                        onClick={handleSearch}
                                    ><MdSearch className="text-lg top-1 relative" /></button>
                                    <button
                                        className="pl-3 pr-3"
                                        onClick={() => {
                                            setKeyword("")
                                            fetchMessage("", MessageNumber, MessageSender, MessageOrder, MessageCategory)
                                        }}
                                    ><MdClear className="text-lg top-1 relative" /></button>
                                </div>
                            </Space>
                        </div>

                        <div>
                            <Space>
                                <div
                                    className="rounded select-filter mt-3"
                                >
                                    <Select
                                        options={optionOrderBy}
                                        onChange={handleSelectOrderBy}
                                        onClear={handleDiselectOrderBy}
                                        allowClear
                                        placeholder={"Order By"}
                                    />
                                </div>
                            </Space>
                        </div>
                    </div>
                    <Table dataSource={dataMessage} columns={columns} />
                </div>

                <Modal
                    title="Tambahkan Arsip"
                    open={isCreateArchive}
                    footer={false}
                    onCancel={handleCloseCreateArchive}
                >
                    <Form
                        form={formArchive}
                        onFinish={handleFinishArchive}
                    >
                        <Form.Item
                            label="Surat"
                            name={"UID"}
                            rules={[{ required: true, message: 'Tolong Pilih Surat' }]}
                        >
                            <Select
                                options={optionArchive}
                            ></Select>
                        </Form.Item>
                        <Form.Item
                            label={"Upload Surat"}
                            name={"ListMedia"}
                            rules={[{ required: true, message: 'Tolong Upload Surat Yang Sudah di Stempel' }]}
                        >
                            <Upload
                                fileList={fileList}
                                onChange={handleChange}
                                beforeUpload={beforeUpload}
                                maxCount={1} // Restrict to single file
                                accept=".pdf" // Only accept PDF files
                            >
                                <Button icon={<MdUpload />}>Select File</Button>
                            </Upload>
                        </Form.Item>

                        <div>
                        <div>
                            {pdfUrl && (
                                <div style={{ marginTop: '20px' }}>
                                    <h3>PDF Preview:</h3>
                                    <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                                        <div
                                            style={{
                                                border: '1px solid rgba(0, 0, 0, 0.3)',
                                                height: '750px',
                                            }}
                                        >
                                            <Viewer fileUrl={pdfUrl} />
                                        </div>
                                    </Worker>
                                </div>
                            )}
                        </div>
                        </div>

                        <div className="flex space-x-3">
                            <div className="flex-1 bg-red-500 text-white py-3 rounded font-semibold cursor-pointer text-center"
                                onClick={handleCloseCreateArchive}
                            >
                                Batal
                            </div>

                            <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold">
                                Simpan
                            </button>
                        </div>
                    </Form>


                </Modal>
            </Spin>
        </main>
    )
}