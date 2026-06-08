/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { createMessage, getMessageCounter } from "@/services/message"
import { getNatures } from "@/services/natures"
import { getPriorities } from "@/services/priorities"
import { getUsers } from "@/services/users"
import { GetPositionName } from "@/utils/utility"
import { Form, DatePicker, Select, message, Button, Upload, Spin, Space, Row, Col } from "antd"
import axios from "axios"
import { useEffect, useState } from "react"
import { MdUpload } from "react-icons/md"

import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

import { useLayoutContext } from "@/hooks/useLayoutContext"

// Custom styles for responsive form
import './suratMasuk.css'

export default function pageSuratMasuk() {
    const { role, recipientUID, fetchCount } = useLayoutContext();
    const [loadingSubmit, setLoadingSubmit] = useState(false);

    const [FormMessage] = Form.useForm()

    const [dataUser, setDataUser] = useState([])
    const [dataNature, setDataNature] = useState([])
    const [dataPriority, setDataPriority] = useState([])

    const [counterMessage, setMessageCounter] = useState(0)
    const fetchCounter = async () => {
        const response = await getMessageCounter(0)
        if (response) {
            setMessageCounter(response.data)
            FormMessage.setFieldValue("EventNumber", response.data)
        }
    }


    // upload section component
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [pdfUrl, setPdfUrl] = useState(null);

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
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Handle file selection and validation
    const handleChange = ({ fileList }) => {
        // Check if fileList is empty (file was removed/cleared)
        if (fileList.length === 0) {
            // Clean up the object URL to avoid memory leaks
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
            setFileList([]);
            setPdfUrl(null);
            return;
        }

        const file = fileList[0]?.originFileObj;
        if (file) {
            // Clean up previous URL if it exists
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
            setFileList(fileList.slice(-1)); // Only keep the last file (single file upload)
            const fileUrl = URL.createObjectURL(file); // Create a URL for the PDF preview
            setPdfUrl(fileUrl);
        }
    };

    // Validate file type and size before uploading
    const beforeUpload = (file) => {
        const isPDF = file.type === 'application/pdf';
        if (!isPDF) {
            message.error('Hanya dapat mengupload file PDF');
            return Upload.LIST_IGNORE;
        }

        const isSizeValid = file.size / 1024 / 1024 < 10; // Max size is 10MB
        if (!isSizeValid) {
            message.error('Ukuran file maksimal adalah 10MB');
            return Upload.LIST_IGNORE;
        }

        return isPDF && isSizeValid;
    };

    // End of component upload

    // Lampiran section
    const [lampiranList, setLampiranList] = useState([]);

    const handleUploadLampiran = async () => {
        if (lampiranList.length === 0) {
            return null;
        }

        try {
            const uploadPromises = lampiranList.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file.originFileObj);

                const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/mediaS3`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                return response.data?.data?.UID;
            });

            const uids = await Promise.all(uploadPromises);
            return uids.join(',');
        } catch (error) {
            message.error('Gagal mengupload lampiran');
            throw error;
        }
    };

    const handleChangeLampiran = ({ fileList: newFileList }) => {
        if (newFileList.length > 3) {
            message.warning('Maksimal 3 file yang dapat diupload');
            setLampiranList(newFileList.slice(0, 3));
        } else {
            setLampiranList(newFileList);
        }
    };

    const beforeUploadLampiran = (file) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png'
        ];

        const isTypeValid = allowedTypes.includes(file.type);
        if (!isTypeValid) {
            message.error('Hanya dapat mengupload file PDF, Word, Excel, atau gambar (JPEG/PNG)');
            return Upload.LIST_IGNORE;
        }

        const isSizeValid = file.size / 1024 / 1024 < 10;
        if (!isSizeValid) {
            message.error('Ukuran file maksimal adalah 10MB');
            return Upload.LIST_IGNORE;
        }

        return isTypeValid && isSizeValid;
    };

    // End of lampiran section



    const fetchUser = async () => {
        const response = await getUsers()
        if (response) {
            setDataUser(response.data)
        }
    }

    const fetchNature = async () => {
        const response = await getNatures()
        if (response) {
            setDataNature(response.data)
        }
    }

    const fetchPriority = async () => {
        const response = await getPriorities()
        if (response) {
            setDataPriority(response.data)
        }
    }

    const handleFinish = async () => {
        setLoadingSubmit(true); // Start loading spinner

        let data = FormMessage.getFieldsValue()

        let eventNumber = data['EventNumber']
        let eventNumberSub = data['EventNumberSub']

        data['MessageNumberIterMasuk'] = parseInt(eventNumber)
        data['EventNumberMasuk'] = "" + eventNumber

        if (eventNumberSub === undefined) {
            data['EventNumberSubMasuk'] = ""
        } else {
            data['EventNumberSubMasuk'] = "" + eventNumberSub
        }



        let listRecipient = []
        let listRecipientUID = []

        data.Date = data.Date.format("YYYY-MM-DDT00:00:00Z");

        data.RecipientUID.forEach(item => {
            listRecipient.push(item.label)
            listRecipientUID.push(item.value)
        });

        data.Recipient = listRecipient.join(',');
        data.RecipientUID = listRecipientUID.join(',');

        try {
            // First try to upload the file
            const media = await handleUpload();
            if (!media || !media.data || !media.data.UID) {
                throw new Error('Invalid media response');
            }

            // Set the media UID in the form data
            data.ListMedia = media.data.UID;

            // Upload lampiran jika ada
            const lampiranUIDs = await handleUploadLampiran();
            if (lampiranUIDs) {
                data.MessageContentMediaUID = lampiranUIDs;
            }

            // Then create the message
            await createMessage(data);

            // Clean up the object URL to avoid memory leaks
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }

            // Reset form state
            setFileList([]);
            setLampiranList([]);
            setPdfUrl(null);
            fetchCount(role, recipientUID, 0);
            FormMessage.resetFields();

            message.success("Proses Berhasil");
        } catch (error) {
            console.error('Form submission error:', error);

            // Show more specific error messages
            if (error.message && error.message.includes('File')) {
                message.error(`Upload gagal: ${error.message}`);
            } else if (error.response && error.response.data && error.response.data.message) {
                message.error(`Proses Gagal: ${error.response.data.message}`);
            } else {
                message.error(`Proses Gagal: ${error.message || 'Unknown error'}`);
            }
        } finally {
            setLoadingSubmit(false); // Stop loading spinner
        }


    }

    useEffect(() => {
        fetchUser();
        fetchNature();
        fetchPriority();
        fetchCounter();
    }, []) // eslint-disable-line react-hooks/exhaustive-deps


    return (
        <main>

            <h2 className="text-xl text-gray-700 font-semibold">
                Surat Masuk
            </h2>

            <Spin spinning={loadingSubmit} tip="Sedang memproses, mohon tunggu...">

                <div className="p-4 md:p-6 bg-white rounded mt-5 w-full max-w-7xl">
                    <h2 className="text-md font-semibold mb-5 text-gray-700">Detail Surat</h2>
                    <hr className="mb-8 bg-gray-300"></hr>
                    <Form
                        form={FormMessage}
                        layout='horizontal'
                        labelCol={{ span: 5 }}
                        className="responsive-form"
                        colon={false}
                        onFinish={handleFinish}
                    >
                        {/* No. Agenda and Tanggal */}
                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                <Space.Compact>
                                    <Form.Item
                                        label={"No. Agenda"}
                                        name={"EventNumber"}
                                        labelCol={{ span: 11 }}
                                        rules={[{ required: true, message: 'No Agenda' }]}
                                    >
                                        <input
                                            type="number"
                                            placeholder="No Agenda"
                                            className="text-sm p-3 block w-full border-0 bg-gray-50 rounded text-black placeholder-gray-300 w-full"
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name={"EventNumberSub"}
                                    >
                                        <input
                                            type="text"
                                            placeholder="Sub No."
                                            className="text-sm p-3 block w-full border-0 bg-gray-50 rounded text-black placeholder-gray-300 w-full"
                                        />
                                    </Form.Item>
                                </Space.Compact>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label={"Tanggal Surat"}
                                    name={"Date"}
                                    rules={[{ required: true, message: 'Tolong masukan Tanggal Surat' }]}
                                >
                                    <DatePicker className="w-full single" />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* No. Surat and Sifat Surat */}
                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="No. Surat"
                                    name={"MessageNumberMasuk"}
                                    rules={[{ required: true, message: 'Tolong masukan Nomor Surat' }]}
                                >
                                    <input
                                        type="text"
                                        placeholder="Input Nomor Surat Masuk"
                                        className="text-sm p-3 block w-full border-0 bg-gray-50 rounded text-black placeholder-gray-300"
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Sifat Surat"
                                    name={"NatureUID"}
                                    rules={[{ required: true, message: 'Tolong masukan Sifat Surat' }]}
                                >
                                    <Select
                                        options={dataNature?.map((record) => (
                                            {
                                                label: record.Name,
                                                value: record.UID
                                            }
                                        ))}
                                        className="mb-3 w-full single"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Asal Surat and Ketanggapan */}
                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Asal Surat"
                                    name={"ExternalSender"}
                                    rules={[{ required: true, message: 'Tolong masukan Asal Surat' }]}
                                >
                                    <input
                                        type="text"
                                        placeholder="Input PT/Organisasi Pengirim"
                                        className="text-sm p-3 block w-full border-0 bg-gray-50 rounded text-black placeholder-gray-300"
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Prioritas"
                                    name={"PriorityUID"}
                                    rules={[{ required: true, message: 'Tolong masukan Prioritas' }]}
                                >
                                    <Select
                                        options={dataPriority?.map((record) => (
                                            {
                                                label: record.Name,
                                                value: record.UID
                                            }
                                        ))}
                                        className="mb-3 w-full single"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Judul */}
                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Judul Surat"
                                    name={"Title"}
                                    rules={[{ required: true, message: 'Tolong masukan Judul Surat' }]}
                                >
                                    <input
                                        type="text"
                                        placeholder="Input Judul Surat Masuk"
                                        className="text-sm p-3 border-0 bg-gray-50 rounded text-black placeholder-gray-300 w-full"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}></Col>
                        </Row>

                        {/* Tujuan */}
                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Tujuan Surat"
                                    name={"RecipientUID"}
                                    rules={[{ required: true, message: 'Tolong masukan Tujuan Surat' }]}
                                >
                                    <Select
                                        mode="multiple"
                                        options={dataUser?.map((record) => {
                                            return {
                                                value: record.UID,
                                                label: record.Name + " | " + (GetPositionName(record.PositionID) + " " + record.Organization?.Name)
                                            }
                                        })}
                                        labelInValue={true}
                                        className="mb-3 w-full"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}></Col>
                        </Row>

                        {/* Keterangan */}
                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label={"Keterangan"}
                                    name={"Information"}
                                >
                                    <input
                                        type="text"
                                        placeholder="Input Keterangan Surat"
                                        className="text-sm p-3 border-0 bg-gray-50 rounded text-black placeholder-gray-300 w-full"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}></Col>
                        </Row>

                        {/* Upload Surat */}
                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                {/* Upload Surat */}
                                <Form.Item
                                    label={"Upload Surat"}
                                    name={"ListMedia"}
                                    rules={[{ required: true, message: 'Tolong Upload Surat' }]}
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
                            </Col>
                            <Col xs={24} md={12}></Col>
                        </Row>

                        {/* Lampiran */}
                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label={"Lampiran"}
                                    name={"ListMediaLampiran"}
                                >
                                    <Upload
                                        fileList={lampiranList}
                                        onChange={handleChangeLampiran}
                                        beforeUpload={beforeUploadLampiran}
                                        maxCount={3}
                                        multiple={true}
                                        accept=".pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png"
                                        onRemove={(file) => {
                                            setLampiranList((prev) => prev.filter((item) => item.uid !== file.uid));
                                        }}
                                    >
                                        <Button icon={<MdUpload />}>Pilih File (Maks. 3)</Button>
                                    </Upload>
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}></Col>
                            <Col xs={24}>
                                <div className="flex justify-end">
                                    <button className="px-4 py-2 bg-blue-900 text-white font-semibold rounded-md hover:bg-blue-700">
                                        Kirim Surat
                                    </button>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </div>

                <Row gutter={[24, 16]}>
                    <Col xs={24} md={12}>
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
                    </Col>
                    <Col xs={24} md={12}></Col>
                </Row>
            </Spin>
        </main >
    )
}