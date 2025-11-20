/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { Button, Form, message, Modal, Popconfirm, Select, Spin, Upload, Row, Col, Space } from 'antd';
import { MdDelete, MdDrafts, MdDownload, MdInsertDriveFile, MdOutlineDocumentScanner,MdRestoreFromTrash, MdUpload } from 'react-icons/md';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { getTemplateNameSurat, getTemplateSuratByUid, getTypeNameSurat } from '@/services/messageTemplate';
import { getNatures } from '@/services/natures';
import { getPriorities } from '@/services/priorities';
import dynamic from 'next/dynamic';
import { useLayoutContext } from '@/hooks/useLayoutContext';
import { GetCurrentDateInISOFormat, GetPositionName } from '@/utils/utility';
import { checkMessageAvailability, getMessageByUid, getMessageCounter, updateMessage } from '@/services/message';
import { getUsers } from '@/services/users';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import moment from 'moment';
import { getMediaByUid } from '@/services/media';
import { debounce } from 'lodash';

const RichEditComponent = dynamic(() => import('@/components/richEditor'), { ssr: false });

export default function pageDraft() {
    const router = useRouter()
    const [UID, setUID] = useState("");
    const [dataMessage, setDataMessage] = useState()
    const [isLoadingData, setIsLoadingData] = useState(true)

    const { role, recipientUID, name, fetchCount } = useLayoutContext();
    const [FormMessage] = Form.useForm()
    const [messageClassification, setMessageClassification] = useState()

    const [isModalDraftOpen, setIsModalDraftOpen] = useState(false)
    const [isModalResetOpen, setIsModalResetOpen] = useState(false)
    const [isModalSubmitOpen, setIsModalSubmitOpen] = useState(false)

    const handleDraft = () => { setIsModalDraftOpen(true) }
    const handleReset = () => { setIsModalResetOpen(true) }
    const handleSubmit = () => { setIsModalSubmitOpen(true) }

    const handleCancelDraft = () => { setIsModalDraftOpen(false) }
    const handleCancelReset = () => { setIsModalResetOpen(false) }
    const handleCancelSubmit = () => { setIsModalSubmitOpen(false) }

    const handleConfirmReset = () => {
        FormMessage.resetFields()
        setCurrentDocument("")
        setTriggerReset(!triggerReset)
        setIsModalResetOpen(false)
    }

    const handleConfirmSubmit = () => {
        setMessageStatus(41)
        setTimeout(() => {
            FormMessage.submit()
        }, 300)
        setIsModalSubmitOpen(false)
    }

    const handleConfirmDraft = () => {
        setMessageStatus(3)
        setTimeout(() => {
            FormMessage.submit()
        }, 300)
        setIsModalDraftOpen(false)
    }

    const fetchMessage = async (uid) => {
        try {
            const response = await getMessageByUid(uid)
            if (response && response.data) {
                setMessageClassification(response.data.MessageClassification)
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

    const fetchTypeName = async (messageClassification) => {
        const response = await getTypeNameSurat(messageClassification);
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
            setOptionTemplate(response.data.map((item) => {
                return {
                    label: item.TemplateName,
                    value: item.UID
                }
            }))
        }
    }

    const fetchTemplate = async (uid) => {
        const response = await getTemplateSuratByUid(uid)
        setMessageClassification(response.data.MessageClassification)
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

    const handleOnSaveComplete = debounce(async (content) => {
        setLoadingSubmit(true); // Start loading spinner
        let data = FormMessage.getFieldsValue()
        let date = GetCurrentDateInISOFormat()

        let eventNumber = parseInt(data['EventNumber'])
        let eventNumberSub = data['EventNumberSub']

        if (messageClassification == 1) {
            data['MessageNumberIterKeluar'] = parseInt(eventNumber)
            data['EventNumberKeluar'] = "" + eventNumber

            if (eventNumberSub === undefined) {
                data['EventNumberSubKeluar'] = ""
            } else {
                data['EventNumberSubKeluar'] = "" + eventNumberSub
            }
        } else {
            data['MessageNumberIterMemo'] = parseInt(eventNumber)
            data['EventNumberMemo'] = "" + eventNumber

            if (eventNumberSub === undefined) {
                data['EventNumberSubMemo'] = ""
            } else {
                data['EventNumberSubMemo'] = "" + eventNumberSub
            }
        }


        data.Date = date
        data.MessageContent = content

        let listRecipient = []
        let listRecipientUID = []

        let listCC = []
        let listCCUID = []

        let listReviewer = []
        let listReviewerUID = []

        data.MessageClassification = messageClassification
        data.MessageStatus = messageStatus
        data.TemplateUID = data.TemplateObject.value

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

        data.ReviewerObject?.forEach(item => {
            listReviewer.push(item.label)
            listReviewerUID.push(item.value)
        });
        data.Reviewer = listReviewer.join(',');
        data.ReviewerUID = listReviewerUID.join(',');

        try {
            const uploadedUIDs = await handleUploadFile()

            // Merge existing ListMedia (string or array) with newly uploaded UIDs
            let existingList = []
            if (Array.isArray(dataMessage?.ListMedia)) {
                existingList = dataMessage.ListMedia
            } else if (typeof dataMessage?.ListMedia === 'string' && dataMessage.ListMedia !== '') {
                existingList = dataMessage.ListMedia.split(',').filter(uid => uid.trim() !== '')
            }

            // Filter out removed UIDs from existing list
            const remainingUIDs = existingList.filter(uid => !removedMediaUIDs.includes(uid));

            // Combine remaining existing UIDs with newly uploaded UIDs
            const combinedUIDs = [...remainingUIDs, ...(uploadedUIDs || [])].filter(Boolean)

            data.ListMedia = combinedUIDs.join(",")

            await updateMessage(UID, data)
            setFileList([])
            setRemovedMediaUIDs([])

            fetchCount(role, recipientUID, 0)

            FormMessage.resetFields()
            message.success("Proses Berhasil")
            router.push("/admin/daftarSurat")
        } catch (error) {
            message.error("Proses Gagal")
        } finally {
            setLoadingSubmit(false); // Stop loading spinner
        }
    }, 300)

    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [fileList, setFileList] = useState([]);

    const handleUploadFile = async () => {
        if (fileList.length === 0) {
            return []
        }

        try {
            // Upload all selected files (up to maxCount)
            const uploadPromises = fileList.map(async (fileItem) => {
                const formData = new FormData();
                formData.append('file', fileItem.originFileObj);
                const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/mediaS3`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });


                return response.data?.data?.UID;
            })

            const uids = await Promise.all(uploadPromises)
            message.success('Attachment uploaded successfully');
            return uids.filter(Boolean)
        } catch (error) {
            message.error('Failed to upload Attachment');
            throw error;
        }
    };


    // Handle file selection and validation
    const handleChangeFile = ({ fileList }) => {
        // Check total files (existing + new)
        const totalFiles = dataMediaList.length - removedMediaUIDs.length + fileList.length;
        if (totalFiles > 3) {
            message.warning('Maksimal 3 file yang dapat diupload (termasuk file yang sudah ada)');
            setFileList(fileList.slice(0, Math.max(0, 3 - (dataMediaList.length - removedMediaUIDs.length))));
        } else {
            setFileList(fileList);
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

    const handleCheckEventAvailability = async (eventNumber, eventNumberSub) => {
        if (eventNumberSub == undefined) {
            eventNumberSub = ""
        }
        const response = await checkMessageAvailability(eventNumber, eventNumberSub, dataMessage?.MessageClassification)
        if (response) {
            if (response.data.isAvailable) {
                return true
            }
        }
        return false
    }

    const [counterMessage, setMessageCounter] = useState(0)
    const fetchCounter = async () => {
        const response = await getMessageCounter(dataMessage?.MessageClassification)
        if (response) {
            setMessageCounter(response.data)
            FormMessage.setFieldValue("EventNumber", response.data)
            return response.data
        }else{
            return -1
        }
    }

    const handleFinishSubmission = debounce(async () => {
        const data = FormMessage.getFieldsValue()
        const isAvailable = await handleCheckEventAvailability(data.EventNumber, data.EventNumberSub)
        
        let eventNumber = ""
        if(dataMessage?.MessageClassification == 1){
            eventNumber = dataMessage?.EventNumberKeluar
        }
        else if(dataMessage?.MessageClassification == 2){
            eventNumber = dataMessage?.EventNumberMemo
        }

        if(eventNumber == ""){
            message.warning("Gagal melakukan pengecekan nomor surat")
        }

        if (
            isAvailable ||
            (data.EventNumber == eventNumber)
        ) {
            setTriggerSave(!triggerSave)
        } else {
            var counterBefore = data.EventNumber
            var counterAfter = await fetchCounter()
            message.warning("Nomor agenda " + counterBefore + " sudah terdaftar, nomor agenda akan di update menjadi " + counterAfter)
        }
    }, 300)


    const [dataUser, setDataUser] = useState([])
    const fetchUser = async () => {
        const response = await getUsers()
        if (response) {
            setDataUser(response.data)
        }
    }

    const API_URL = process.env.NEXT_PUBLIC_PUBLIC_URL
    const [dataMediaList, setDataMediaList] = useState([])
    const [downloading, setDownloading] = useState({})
    const [removedMediaUIDs, setRemovedMediaUIDs] = useState([])

    const handleRemoveMedia = (mediaUID) => {
        // Add to removed list
        setRemovedMediaUIDs(prev => [...prev, mediaUID]);
        // Remove from display list
        setDataMediaList(prev => prev.filter(media => media.UID !== mediaUID));
        message.success('File berhasil dihapus dari daftar');
    };

    const handleDownload = async (mediaUID, mediaName) => {
        try {
            setDownloading(prev => ({ ...prev, [mediaUID]: true }));
            const response = await axios.get(API_URL + "/mediaS3/" + mediaUID, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', mediaName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            setDownloading(prev => ({ ...prev, [mediaUID]: false }));
        } catch (error) {
            message.error('Failed to download file');
            setDownloading(prev => ({ ...prev, [mediaUID]: false }));
        }
    };

    const fetchMediaList = useCallback(async () => {
        try {
            let mediaUIDs = []
            
            // Handle both string and array formats
            if (Array.isArray(dataMessage?.ListMedia)) {
                mediaUIDs = dataMessage.ListMedia.filter(Boolean)
            } else if (typeof dataMessage?.ListMedia === 'string' && dataMessage.ListMedia !== '') {
                // Split by comma to handle multiple UIDs in string format
                mediaUIDs = dataMessage.ListMedia.split(',').filter(uid => uid.trim() !== '')
            }

            if (mediaUIDs.length === 0) {
                setDataMediaList([])
                return
            }

            // Fetch all media details
            const mediaPromises = mediaUIDs.map(async (uid) => {
                try {
                    const response = await getMediaByUid(uid.trim())
                    return response?.data || null
                } catch (error) {
                    console.error(`Failed to fetch media ${uid}:`, error)
                    return null
                }
            })

            const mediaData = await Promise.all(mediaPromises)
            setDataMediaList(mediaData.filter(Boolean))
        } catch (error) {
            console.error('Failed to fetch media list:', error)
            setDataMediaList([])
        }
    }, [dataMessage])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (dataMessage?.ListMedia && 
                (Array.isArray(dataMessage.ListMedia) ? dataMessage.ListMedia.length > 0 : dataMessage.ListMedia !== "")) {
                fetchMediaList()
            } else {
                setDataMediaList([])
            }
        }
    }, [dataMessage, fetchMediaList]);


    useEffect(() => {
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
                    } else {
                        FormMessage.setFieldValue('EventNumber', data.EventNumberMemo)
                        FormMessage.setFieldValue('EventNumberSub', data.EventNumberSubMemo)
                    }

                    fetchTypeName(data.MessageClassification)
                    const responseUser = await getUsers()
                    const responseTemplateName = await getTemplateNameSurat(data.TypeUID, data.MessageClassification)

                    const optionUser = responseUser.data?.map((record) => {
                        return {
                            value: record.UID,
                            label: record.Name + " | " + (GetPositionName(record.PositionID) + " " + record.Organization?.Name)
                        }
                    })

                    const optionTemplateName = responseTemplateName.data.map((item) => {
                        return {
                            label: item.TemplateName,
                            value: item.UID
                        }
                    })

                    setOptionTemplate(optionTemplateName)


                    const selectedReviewer = optionUser.filter(option => data.ReviewerUID?.split(",").includes(option.value));
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

                    fetchTemplateName(data.TypeUID, messageClassification)
                    
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
            <div className="flex p-3 bg-white shadow-sm rounded flex-col space-y-5 w-auto fixed top-1/2 -translate-y-1/2 right-0 shadow-lg z-50">
                <div className="bg-white flex items-center flex-col p-2 font-semibold rounded border border-yellow-400 hover:bg-yellow-100 text-yellow-400 cursor-pointer shadow-md"
                    onClick={handleDraft}
                >
                    <MdDrafts className="mb-2 text-sm" />
                    <div className="text-xs">
                        Draft
                    </div>
                </div>

                <div className="bg-white flex items-center flex-col p-2 font-semibold rounded border border-red-400 hover:bg-red-100 text-red-400 cursor-pointer shadow-md"
                    onClick={handleReset}
                >
                    <MdRestoreFromTrash className="mb-2 text-sm" />
                    <div className="text-xs">
                        Hapus
                    </div>
                </div>

                <div className="bg-white flex items-center flex-col p-2 font-semibold rounded border border-green-400 hover:bg-green-100 text-green-400 cursor-pointer shadow-md"
                    onClick={handleSubmit}
                >
                    <MdOutlineDocumentScanner className="mb-2 text-sm" />
                    <div className="text-xs">
                        Submit
                    </div>
                </div>
            </div>

            <h2 className="text-xl text-gray-700 font-semibold">
                Draft Surat
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
                                            fetchTemplateName(value, messageClassification);
                                        }}
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
                                <Form.Item
                                    label={"Lampiran Baru"}
                                    name={"ListMedia"}
                                >
                                    <Upload
                                        fileList={fileList}
                                        onChange={handleChangeFile}
                                        beforeUpload={beforeUpload}
                                        maxCount={3}
                                        multiple={true}
                                        accept=".pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png"
                                        onRemove={(file) => {
                                            setFileList((prevList) => prevList.filter((item) => item.uid !== file.uid));
                                        }}
                                    >
                                        <Button icon={<MdUpload />}>Pilih File Baru (Maks. 3 total)</Button>
                                    </Upload>
                                    <p className="text-xs text-gray-500 mt-2">
                                        File yang sudah ada: {dataMediaList.length - removedMediaUIDs.length} | 
                                        File baru: {fileList.length} | 
                                        Total: {dataMediaList.length - removedMediaUIDs.length + fileList.length}/3
                                    </p>
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}></Col>
                        </Row>
                    </Form>
                    {/* Lampiran Section */}
                    <Row gutter={[24, 16]} className="mt-5">
                        <Col xs={24}>
                            <div className="ml-10">
                                <h3 className="text-sm font-semibold mb-3 text-gray-700">
                                    File yang Sudah Diupload ({dataMediaList.length}):
                                </h3>
                                {dataMediaList.length > 0 ? (
                                    <div className="space-y-2">
                                        {dataMediaList.map((media, index) => (
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
                                                            File {index + 1} dari {dataMediaList.length}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        type="primary"
                                                        icon={<MdDownload />}
                                                        onClick={() => handleDownload(media.UID, media.Name)}
                                                        loading={downloading[media.UID]}
                                                        disabled={downloading[media.UID]}
                                                        size="small"
                                                    >
                                                        {downloading[media.UID] ? 'Downloading...' : 'Download'}
                                                    </Button>
                                                    <Popconfirm
                                                        title="Hapus file"
                                                        description="Apakah Anda yakin ingin menghapus file ini?"
                                                        onConfirm={() => handleRemoveMedia(media.UID)}
                                                        okText="Ya"
                                                        cancelText="Tidak"
                                                    >
                                                        <Button
                                                            danger
                                                            icon={<MdDelete />}
                                                            size="small"
                                                        >
                                                            Hapus
                                                        </Button>
                                                    </Popconfirm>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Tidak ada lampiran yang sudah diupload</p>
                                )}
                            </div>
                        </Col>
                    </Row>
                </div>




                <div className="p-6 bg-white shadow-sm rounded mt-5 w-[90%]">
                    <Suspense fallback={<div>Loading...</div>}>
                        <RichEditComponent
                            currentDocument={currentDocument}
                            setCurrentDocument={setCurrentDocument}
                            onSaveComplete={handleOnSaveComplete}
                            triggerSave={triggerSave}
                            triggerReset={triggerReset}
                            messageClassification={messageClassification}
                        />
                    </Suspense>
                </div>


                <Modal
                    open={isModalSubmitOpen}
                    title="Submit"
                    footer={false}
                    onCancel={handleCancelSubmit}
                    maskClosable={false}
                >
                    <div className='font-semibold text-gray-700 mb-5 mt-5'>
                        Apakah anda yakin untuk mengirim surat ini ?
                    </div>


                    <div className="flex space-x-3">
                        <button className="flex-1 bg-red-500 text-white py-3 rounded font-semibold"
                            onClick={handleCancelSubmit}
                        >
                            Batal
                        </button>

                        <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold"
                            onClick={handleConfirmSubmit}
                        >
                            Simpan
                        </button>
                    </div>
                </Modal>


                <Modal
                    open={isModalResetOpen}
                    title="Hapus"
                    footer={false}
                    onCancel={handleCancelReset}
                    maskClosable={false}
                >
                    <div className='font-semibold text-gray-700 mb-5 mt-5'>
                        Apakah anda yakin untuk menghapus draft surat ini ?
                    </div>


                    <div className="flex space-x-3">
                        <button className="flex-1 bg-red-500 text-white py-3 rounded font-semibold"
                            onClick={handleCancelReset}
                        >
                            Batal
                        </button>

                        <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold"
                            onClick={handleConfirmReset}
                        >
                            Konfirmasi
                        </button>
                    </div>
                </Modal>

                <Modal
                    open={isModalDraftOpen}
                    title="Draft"
                    footer={false}
                    onCancel={handleCancelDraft}
                    maskClosable={false}
                >
                    <div className='font-semibold text-gray-700 mb-5 mt-5'>
                        Apakah anda yakin untuk menyimpan surat ini sebagai draft?
                    </div>


                    <div className="flex space-x-3">
                        <button className="flex-1 bg-red-500 text-white py-3 rounded font-semibold"
                            onClick={handleCancelDraft}
                        >
                            Batal
                        </button>

                        <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold"
                            onClick={handleConfirmDraft}
                        >
                            Simpan Draft
                        </button>
                    </div>
                </Modal>
            </Spin>
        </main >
    )
}