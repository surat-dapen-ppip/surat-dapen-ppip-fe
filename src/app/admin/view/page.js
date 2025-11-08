/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { Form, message, Select, Spin, Upload, Row, Col, Button } from 'antd';
import { Suspense, useEffect, useState } from 'react';
import { getTemplateNameSurat, getTemplateSuratByUid, getTypeNameSurat } from '@/services/messageTemplate';
import { getNatures } from '@/services/natures';
import { getPriorities } from '@/services/priorities';
import dynamic from 'next/dynamic';
import { useLayoutContext } from '@/hooks/useLayoutContext';
import { GetCurrentDateInISOFormat, GetPositionName } from '@/utils/utility';
import { getMessageByUid, updateMessage } from '@/services/message';
import { getUsers } from '@/services/users';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import moment from 'moment';
import { getMediaByUid } from '@/services/media';
import { MdDownload, MdInsertDriveFile } from 'react-icons/md';

const RichEditReadOnlyComponent = dynamic(() => import('@/components/richEditReadOnly'), { ssr: false });


export default function pageDraft() {
    const router = useRouter()
    const [UID, setUID] = useState("");
    const [dataMessage, setDataMessage] = useState()
    const [isLoadingData, setIsLoadingData] = useState(true)

    const { role, recipientUID, name, fetchCount } = useLayoutContext();
    const [FormMessage] = Form.useForm()


    const fetchMessage = async (uid) => {
        try {
            const response = await getMessageByUid(uid)
            if (response && response.data) {
                setDataMessage(response.data)
                return response.data
            } else {
                return null
            }
        } catch (error) {
            console.error("Error fetching message:", error)
            return null
        }
    }

    const [triggerSave, setTriggerSave] = useState(false)
    const [triggerReset, setTriggerReset] = useState(false)
    const [currentDocument, setCurrentDocument] = useState("")
    const [messageStatus, setMessageStatus] = useState(0)

    const [optionType, setOptionType] = useState([])
    const [optionTemplate, setOptionTemplate] = useState([])

    const fetchTypeName = async () => {
        const response = await getTypeNameSurat();
        if (response) {
            setOptionType(response.data.map((item) => {
                return {
                    label: item,
                    value: item
                }
            }))
        }
    }

    const fetchTemplateName = async (typeName, messageClassification) => {
        const response = await getTemplateNameSurat(typeName, messageClassification);
        if (response) {
            return response.data.map((item) => {
                return {
                    label: item.TemplateName,
                    value: item.UID
                }
            })
        }
        return []
    }

    const fetchTemplate = async (uid) => {
        const response = await getTemplateSuratByUid(uid)
        if (response) {
            setTimeout(() => {
                setCurrentDocument(response.data.Content)
            }, 200)
        }
    }

    const [optionNature, setOptionNature] = useState([])
    const [optionPriority, setOptionPriority] = useState([])

    const fetchNature = async () => {
        const response = await getNatures()
        if (response) {
            setOptionNature(
                response.data?.map((record) => (
                    {
                        label: record.Name,
                        value: record.UID
                    }
                ))
            )
        }
    }

    const fetchPriority = async () => {
        const response = await getPriorities()
        if (response) {
            setOptionPriority(
                response.data?.map((record) => (
                    {
                        label: record.Name,
                        value: record.UID
                    }
                ))
            )
        }
    }

    const handleOnSaveComplete = async () => {
        setLoadingSubmit(true); // Start loading spinner
        let data = FormMessage.getFieldsValue()
        let date = GetCurrentDateInISOFormat()

        data.Date = date
        data.MessageContent = currentDocument

        let listRecipient = []
        let listRecipientUID = []

        let listCC = []
        let listCCUID = []

        data.MessageClassification = 1
        data.MessageStatus = messageStatus
        data.TemplateUID = data.TemplateObject.label

        data.Drafter = name
        data.DrafterUID = recipientUID

        data.Approver = data.ApproverObject.label
        data.ApproverUID = data.ApproverObject.value

        data.Reviewer = data.ReviewerObject.label
        data.ReviewerUID = data.ReviewerObject.value

        data.RecipientObject.forEach(item => {
            listRecipient.push(item.label)
            listRecipientUID.push(item.value)
        });
        data.Recipient = listRecipient.join(',');
        data.RecipientUID = listRecipientUID.join(',');

        data.CCObject?.forEach(item => {
            listCC.push(item.label)
            listCCUID.push(item.value)
        });
        data.CC = listCC.join(',');
        data.CCUID = listCCUID.join(',');

        try {
            const media = await handleUploadFile()
            let mediaUID = ""
            if (media != null) {
                mediaUID = media.data.UID
            }

            await updateMessage(UID, data)
            setFileList([])

            fetchCount(role, recipientUID, 0)

            FormMessage.resetFields()
            message.success("Proses Berhasil")
            router.push("/admin/daftarSurat")
        } catch (error) {
            message.error("Proses Gagal")
        } finally {
            setLoadingSubmit(false); // Stop loading spinner
        }
        setTriggerSave(false);
    }

    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [fileList, setFileList] = useState([]);

    const handleUploadFile = async () => {
        if (fileList.length === 0) {
            setLoadingSubmit(false)
            return null
        }

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
            message.success('Attachment uploaded successfully');
            return response.data
        } catch (error) {
            message.error('Failed to upload Attachment');
            throw error;
        }
    };


    // Handle file selection and validation
    const handleChangeFile = ({ fileList }) => {
        const file = fileList[0]?.originFileObj;
        if (file) {
            setFileList(fileList.slice(-1)); // Only keep the last file (single file upload)
        }
    };

    // Validate file type and size before uploading
    const beforeUpload = (file) => {
        const isPdf = file.type === 'application/pdf';
        if (!isPdf) {
            message.error('Hanya dapat mengupload file PDF');
            return Upload.LIST_IGNORE; // Ignore non-PDF files
        }
        const isSizeValid = file.size / 1024 / 1024 < 10; // Size check in MB
        if (!isSizeValid) {
            message.error('Ukuran file maksimal adalah 10MB');
            return Upload.LIST_IGNORE; // Ignore files larger than 10MB
        }
        return isPdf && isSizeValid;
    };

    const handleFinishSubmission = async () => {}

    const [dataUser, setDataUser] = useState([])
    const fetchUser = async () => {
        const response = await getUsers()
        if (response) {
            setDataUser(response.data)
        }
    }

    const API_URL = process.env.NEXT_PUBLIC_PUBLIC_URL
    const [mediaList, setMediaList] = useState([])
    const [downloadingStates, setDownloadingStates] = useState({})

    const handleDownload = async (mediaUID, fileName) => {
        try {
            setDownloadingStates(prev => ({ ...prev, [mediaUID]: true }));
            
            const response = await axios.get(`${API_URL}/mediaS3/${mediaUID}`, {
                responseType: 'blob',
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            message.success(`File ${fileName} berhasil didownload`);
        } catch (error) {
            console.error('Error downloading file:', error);
            message.error(`Gagal mendownload file ${fileName}`);
        } finally {
            setDownloadingStates(prev => ({ ...prev, [mediaUID]: false }));
        }
    };

    const fetchMediaList = async () => {
        if (!dataMessage?.ListMedia || dataMessage.ListMedia === "") {
            setMediaList([]);
            return;
        }

        try {
            // Split UIDs by comma
            const mediaUIDs = dataMessage.ListMedia.split(',').filter(uid => uid.trim() !== '');
            
            // Fetch all media details
            const mediaPromises = mediaUIDs.map(async (uid) => {
                try {
                    const response = await getMediaByUid(uid.trim());
                    if (response && response.data) {
                        return response.data;
                    }
                    return null;
                } catch (error) {
                    console.error(`Error fetching media ${uid}:`, error);
                    return null;
                }
            });

            const results = await Promise.all(mediaPromises);
            const validMedia = results.filter(media => media !== null);
            setMediaList(validMedia);
        } catch (error) {
            console.error('Error fetching media list:', error);
            setMediaList([]);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            fetchMediaList();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataMessage]);


    useEffect(() => {
        fetchTypeName()
        fetchNature()
        fetchPriority()
        fetchUser()


        if (typeof window !== 'undefined') {
            // Access query parameters from the URL
            const urlParams = new URLSearchParams(window.location.search);
            const uid = urlParams.get('uid');

            if (!uid) {
                // No UID provided, redirect to daftarSurat
                message.info('Surat tidak ditemukan')
                router.push("/admin/daftarSurat")
                return
            }

            const handleMessage = async () => {
                try {
                    setIsLoadingData(true)
                    const data = await fetchMessage(uid)

                    if (!data) {
                        // Data not found, redirect to daftarSurat
                        message.info('Data surat tidak ditemukan')
                        router.push("/admin/daftarSurat")
                        return
                    }

                    FormMessage.setFieldValue('TypeUID', data.TypeUID)
                    FormMessage.setFieldValue('Title', data.Title)
                    FormMessage.setFieldValue('Date', moment(data.Date))
                    FormMessage.setFieldValue('NatureUID', data.NatureUID)
                    FormMessage.setFieldValue('PriorityUID', data.PriorityUID)
                    FormMessage.setFieldValue('Information', data.Information)

                    if (data.MessageClassification == 1) {
                        FormMessage.setFieldValue('EventNumber', data.EventNumberKeluar)
                        FormMessage.setFieldValue('EventNumberSub', data.EventNumberSubKeluar)
                    }else{
                        FormMessage.setFieldValue('EventNumber', data.EventNumberMemo)
                        FormMessage.setFieldValue('EventNumberSub', data.EventNumberSubMemo)
                    }

                    const responseUser = await getUsers()

                    const optionUser = responseUser.data?.map((record) => {
                        return {
                            value: record.UID,
                            label: record.Name + " | " + (GetPositionName(record.PositionID) + " " + record.Organization?.Name)
                        }
                    })

                    const optionTemplateName = await fetchTemplateName(data.TypeUID, data.MessageClassification)

                    const selectedReviewer = data.ReviewerUID?.split(",").map(uid => 
                        optionUser.find(option => option.value === uid)
                    )
                    const selectedApprover = optionUser.find(option => option.value === data.ApproverUID);
                    const selectedCC = optionUser.filter(option => data.CCUID?.split(",").includes(option.value));
                    const selectedRecipient = optionUser.filter(option => data.RecipientUID?.split(",").includes(option.value));
                    const selectedTemplate = optionTemplateName.find(option => option.value === data.TemplateUID)

                    FormMessage.setFieldValue('ReviewerObject', selectedReviewer)
                    FormMessage.setFieldValue('ApproverObject', selectedApprover)
                    FormMessage.setFieldValue('CCObject', selectedCC)
                    FormMessage.setFieldValue('RecipientObject', selectedRecipient)
                    FormMessage.setFieldValue('TemplateObject', selectedTemplate)

                    setTimeout(() => {
                        setCurrentDocument(data.MessageContent)
                    }, 300)

                    fetchTemplateName(data.TypeUID)
                    
                    setIsLoadingData(false)
                } catch (error) {
                    console.error("Error loading message:", error)
                    message.info('Gagal memuat data surat')
                    setIsLoadingData(false)
                    router.push("/admin/daftarSurat")
                }
            }

            handleMessage()
            setUID(uid)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])



    if (isLoadingData) {
        return (
            <main>
                <div className="flex items-center justify-center min-h-screen">
                    <Spin size="small" tip="Memuat data surat...">
                        <div className="p-20"></div>
                    </Spin>
                </div>
            </main>
        )
    }

    return (
        <main>
            <h2 className="text-xl text-gray-700 font-semibold">
                Lihat Surat
            </h2>

            <Spin spinning={loadingSubmit} tip="Sedang memproses, mohon tunggu...">
                <div className="p-6 bg-white shadow-sm rounded mt-5 w-[90%]">
                    <h2 className="text-md font-semibold mb-5 text-gray-700">Detail Surat</h2>
                    <hr className="mb-8 bg-gray-300"></hr>
                                            <Form
                            layout='horizontal'
                            labelCol={{ span: 5 }}
                            colon={false}
                            form={FormMessage}
                            onFinish={handleFinishSubmission}
                        >
                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label={"No. Agenda"}
                                    name={"EventNumber"}
                                    className="w-full"
                                    rules={[{ required: true, message: 'No Agenda' }]}
                                >
                                    <input
                                        type="number"
                                        placeholder="No Agenda"
                                        className="text-sm p-3 block w-full border-0 bg-gray-50 rounded text-black placeholder-gray-300"
                                        disabled
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name={"EventNumberSub"}
                                    label="Sub No. Agenda"
                                    className="w-full"
                                >
                                    <input
                                        type="text"
                                        placeholder="Sub No."
                                        className="text-sm p-3 block w-full border-0 bg-gray-50 rounded text-black placeholder-gray-300"
                                        disabled
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* No. Agenda and Tanggal */}
                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Jenis Surat"
                                    name={'TypeUID'}
                                    rules={[{ required: true, message: 'Tolong masukan Jenis Surat' }]}
                                >
                                    <Select
                                        options={optionType}
                                        className="mb-3 w-full single"
                                        onSelect={(value, _) => {
                                            fetchTemplateName(value);
                                        }}
                                        disabled
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Template Surat"
                                    name={'TemplateObject'}
                                    rules={[{ required: true, message: 'Tolong masukan Template Surat' }]}
                                >
                                    <Select
                                        labelInValue
                                        options={optionTemplate}
                                        className="mb-3 w-full single"
                                        onSelect={(option) => {
                                            fetchTemplate(option.value)
                                        }}
                                        disabled
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* No. Surat and Sifat Surat */}
                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Sifat Surat"
                                    name={"NatureUID"}
                                    rules={[{ required: true, message: 'Tolong masukan Sifat Surat' }]}
                                >
                                    <Select
                                        options={optionNature}
                                        className="mb-3 w-full single"
                                        disabled
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Prioritas"
                                    name={"PriorityUID"}
                                    rules={[{ required: true, message: 'Tolong masukan Prioritas Surat' }]}
                                >
                                    <Select
                                        options={optionPriority}
                                        className="mb-3 w-full single"
                                        disabled
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
                                        placeholder="Input Judul Surat"
                                        className="text-sm p-3 border-0 bg-gray-50 rounded text-black placeholder-gray-300 w-full"
                                        disabled
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}></Col>
                        </Row>

                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Reviewer Surat"
                                    name={"ReviewerObject"}
                                    rules={[{ required: true, message: 'Tolong masukan Reviewer Surat' }]}
                                >
                                    <Select
                                        labelInValue
                                        mode="multiple"
                                        options={dataUser?.map((record) => {
                                            return {
                                                value: record.UID,
                                                label: record.Name + " | " + (GetPositionName(record.PositionID) + " " + record.Organization?.Name)
                                            }
                                        })}
                                        disabled
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}></Col>
                        </Row>

                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Approver Surat"
                                    name={"ApproverObject"}
                                    rules={[{ required: true, message: 'Tolong masukan Approver Surat' }]}
                                >
                                    <Select
                                        labelInValue
                                        options={dataUser?.map((record) => {
                                            return {
                                                value: record.UID,
                                                label: record.Name + " | " + (GetPositionName(record.PositionID) + " " + record.Organization?.Name)
                                            }
                                        })}
                                        className="mb-3 single"
                                        disabled
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
                                    name={"RecipientObject"}
                                    rules={[{ required: true, message: 'Tolong masukan Tujuan Surat' }]}
                                >
                                    <Select
                                        labelInValue
                                        mode="multiple"
                                        options={dataUser?.map((record) => {
                                            return {
                                                value: record.UID,
                                                label: record.Name + " | " + (GetPositionName(record.PositionID) + " " + record.Organization?.Name)
                                            }
                                        })}
                                        className="mb-3"
                                        disabled
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}></Col>
                        </Row>

                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="CC Surat"
                                    name={"CCObject"}
                                >
                                    <Select
                                        labelInValue
                                        mode="multiple"
                                        options={dataUser?.map((record) => {
                                            return {
                                                value: record.UID,
                                                label: record.Name + " | " + (GetPositionName(record.PositionID) + " " + record.Organization?.Name)
                                            }
                                        })}
                                        className="mb-3"
                                        disabled
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
                                        placeholder="Input Keterangan"
                                        className="text-sm p-3 border-0 bg-gray-50 rounded text-black placeholder-gray-300 w-full"
                                        disabled
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}></Col>
                        </Row>
                    </Form>
                    
                    {/* Lampiran Section */}
                    <Row gutter={[24, 16]} className="mt-5">
                        <Col xs={24} md={12}>
                            <div className="ml-10">
                                <h3 className="text-sm font-semibold mb-3 text-gray-700">Lampiran:</h3>
                                {mediaList.length > 0 ? (
                                    <div className="space-y-2">
                                        {mediaList.map((media, index) => (
                                            <div 
                                                key={media.UID} 
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center space-x-3 flex-1">
                                                    <MdInsertDriveFile className="text-blue-500 text-xl flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-700 truncate">
                                                            {media.Name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            File {index + 1} dari {mediaList.length}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="primary"
                                                    icon={<MdDownload />}
                                                    onClick={() => handleDownload(media.UID, media.Name)}
                                                    loading={downloadingStates[media.UID]}
                                                    disabled={downloadingStates[media.UID]}
                                                    size="small"
                                                    className="flex-shrink-0"
                                                >
                                                    {downloadingStates[media.UID] ? 'Downloading...' : 'Download'}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Tidak ada lampiran</p>
                                )}
                            </div>
                        </Col>
                    </Row>
                </div>




                <div className="p-6 bg-white shadow-sm rounded mt-5 w-[90%]">
                    <Suspense fallback={<div>Loading...</div>}>
                        <RichEditReadOnlyComponent
                            currentDocument={currentDocument}
                            setCurrentDocument={setCurrentDocument}
                            onSaveComplete={handleOnSaveComplete}
                            triggerSave={triggerSave}
                            triggerReset={triggerReset}
                        />
                    </Suspense>
                </div>
            </Spin>
        </main >
    )
}