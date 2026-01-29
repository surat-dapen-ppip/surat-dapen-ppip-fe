/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { Button, Form, Input, message, Modal, Select, Spin, Row, Col } from 'antd';
import { MdArrowBack, MdClearAll, MdDownload, MdInsertDriveFile, MdOutlineDocumentScanner } from 'react-icons/md';
import { Suspense, useEffect, useState, useRef } from 'react';
import { getTemplateCodeByUid, getTemplateNameSurat, getTypeNameSurat } from '@/services/messageTemplate';
import { getNatures } from '@/services/natures';
import { getPriorities } from '@/services/priorities';
import { useLayoutContext } from '@/hooks/useLayoutContext';
import { GetCurrentDateInISOFormat, GetPositionName, ZeroPad } from '@/utils/utility';
import { approveMessage, getMessageByUid } from '@/services/message';
import { getUserByUid, getUsers } from '@/services/users';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import moment from 'moment';
import { createMessageRevision } from '@/services/messageRevision';
import { getMediaByUid } from '@/services/media';
import { createMessageRejection } from '@/services/messageRejection';
import { debounce } from 'lodash';
import RichEditorSignatureMemoV2 from '@/components/richEditorSignatureMemoV2';
import RichEditorReviewV2 from '@/components/richEditorReviewV2';
import RichEditorSignatureV2 from '@/components/richEditorSignatureV2';

export default function pageReview() {
    const router = useRouter()
    const [UID, setUID] = useState("");

    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true)

    const [currentDocument, setCurrentDocument] = useState("")
    const [currentMessageStatus, setCurrentMessageStatus] = useState()
    const [messageClassification, setMessageClassification] = useState()
    const [messageNumberDocument, setMessageNumberDocument] = useState("")

    const { role, recipientUID, name, fetchCount } = useLayoutContext();
    const [FormMessage] = Form.useForm()
    const [FormRevision] = Form.useForm()
    const [FormRejection] = Form.useForm()

    const [isModalApproveSuratKeluarOpen, setIsModalApproveSuratKeluarOpen] = useState(false)
    const [isModalApproveMemoOpen, setIsModalApproveMemoOpen] = useState(false)
    const [isModalBackOpen, setIsModalBackOpen] = useState(false)
    const [isModalRevisionOpen, setIsModalRevisionOpen] = useState(false)
    const [isModalRejectOpen, setIsModalRejectOpen] = useState(false)

    const handleBack = () => { setIsModalBackOpen(true) }
    const handleApprove = async () => {
        if (loadingSubmit) {
            return
        }
        setLoadingSubmit(true);
        triggerEditorReviewUpdate();
        setTimeout(() => {
            if (messageClassification == 1) {
                setIsModalApproveSuratKeluarOpen(true)
            } else {
                setIsModalApproveMemoOpen(true)
            }
            setLoadingSubmit(false);
        }, 5000)

    }
    const handleRevision = () => { setIsModalRevisionOpen(true) }
    const handleReject = () => { setIsModalRejectOpen(true) }
    const handleCancelRevision = () => { setIsModalRevisionOpen(false) }
    const handleCancelReject = () => { setIsModalRejectOpen(false) }
    const handleCancelBack = () => { setIsModalBackOpen(false) }
    const handleCancelApprove = () => {
        if (messageClassification == 1) {
            setIsModalApproveSuratKeluarOpen(false)
        } else {
            setIsModalApproveMemoOpen(false)
        }
    }
    const handleConfirmBack = () => {
        router.push("/admin/daftarSurat")
    }
    const handleConfirmRevision = () => {
        if (loadingSubmit) {
            return
        }
        setTimeout(() => {
            FormRevision.submit()
        }, 300)
        setIsModalRevisionOpen(false)
    }

    const handleConfirmRejection = () => {
        if (loadingSubmit) {
            return
        }
        setTimeout(() => {
            FormRejection.submit()
        }, 300)
        setIsModalRejectOpen(false)
    }

    const fetchMessage = async (uid) => {
        try {
            const response = await getMessageByUid(uid)
            if (response && response.data) {
                if (response.data?.ListMedia) {
                    fetchMediaList(response.data?.ListMedia)
                }
                return response.data
            } else {
                return null
            }
        } catch (error) {
            console.error("Error fetching message:", error)
            return null
        }
    }

    const fetchTypeName = async () => {
        const response = await getTypeNameSurat();
        if (response) {
            return response.data.map((item) => {
                return {
                    label: item,
                    value: item
                }
            })
        }
        return []
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

    const handleOnReviewerSaveComplete = async (content) => {
        setLoadingSubmit(true); // Start loading spinner
        try {
            if (typeof window !== 'undefined') {
                const userUID = window.localStorage.getItem('UserUID')

                try {
                    await approveMessage(UID, userUID, content)
                    message.success("Proses Berhasil")
                    router.push("/admin/daftarSurat")
                } catch (error) {
                    message.error("Proses Gagal")
                } finally {
                    setLoadingSubmit(false);
                }
            }
            fetchCount(role, recipientUID, 0)
        } catch (error) {
            message.error("Proses Gagal")
        } finally {
            setLoadingSubmit(false);
        }
    }

    const handleOnSaveComplete = async (content) => {
        setLoadingSubmit(true); // Start loading spinner
        try {
            if (typeof window !== 'undefined') {
                const userUID = window.localStorage.getItem('UserUID')
                const userName = window.localStorage.getItem('Name')
                const dateNow = GetCurrentDateInISOFormat()

                try {
                    await approveMessage(UID, userUID, content, messageNumberDocument, dateNow, userName)
                    message.success("Proses Berhasil")
                    router.push("/admin/daftarSurat")
                } catch (error) {
                    message.error("Proses Gagal")
                } finally {
                    setLoadingSubmit(false);
                }
            }
            fetchCount(role, recipientUID, 0)
        } catch (error) {
            message.error("Proses Gagal")
        } finally {
            setLoadingSubmit(false); // Stop loading spinner
        }
    }

    const handleOnUpdateDocument = (content) => {
        try {
            setCurrentDocument(content)

        } catch (error) {
            message.error("Proses Gagal")
        }
    }

    const handleFinishRejection = debounce(async () => {
        try {
            setLoadingSubmit(true);
            let data = FormRejection.getFieldsValue()
            data.MessageUID = UID
            data.FromUserUID = recipientUID
            data.FromUserName = name;

            await createMessageRejection(data)
            message.success("Proses Berhasil")
            router.push("/admin/daftarSurat")
        } catch (error) {
            message.error("Proses Gagal")
        } finally {
            setLoadingSubmit(false);
        }
    }, 300)


    const handleFinishRevision = debounce(async () => {
        try {
            setLoadingSubmit(true);
            let data = FormRevision.getFieldsValue()
            data.MessageUID = UID
            data.FromUserUID = recipientUID
            data.FromUserName = name;

            await createMessageRevision(data)
            message.success("Proses Berhasil")
            router.push("/admin/daftarSurat")
        } catch (error) {
            message.error("Proses Gagal")
        } finally {
            setLoadingSubmit(false);
        }
    }, 300)

    const handleFinishApprove = debounce(async () => {
        if (loadingSubmit) {
            return
        }

        try {
            setLoadingSubmit(true)
            if (typeof window !== 'undefined') {
                if (currentMessageStatus == 41) {
                    triggerEditorReviewSave()
                } else if (currentMessageStatus == 42) {
                    if (messageClassification == 1) {
                        triggerEditorSKSave()
                    } else if (messageClassification == 2) {
                        triggerEditorMemoSave()
                    }
                } else {
                    message.error('You are not allowed to perform this action')
                }
            }
        } catch (error) {
            console.log(error);
            message.error('Terjadi kesalahan saat memproses approval')
        } finally {
            setLoadingSubmit(false)
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
    const [mediaList, setMediaList] = useState([])
    const [downloadingStates, setDownloadingStates] = useState({})

    const handleDownload = async (mediaUID, fileName) => {
        if (typeof window !== 'undefined') {
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
        }
    };

    const fetchMediaList = async (listMedia) => {
        if (listMedia || listMedia === "") {
            setMediaList([]);
            return;
        }

        try {
            // Split UIDs by comma
            const mediaUIDs = listMedia.split(',').filter(uid => uid.trim() !== '');

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

    const getMessageCodeByUser = async (UID) => {
        const response = await getUserByUid(UID)
        if (response) {
            return response.data?.Organization?.MessageCode
        }
        return ""
    }


    useEffect(() => {
        fetchTypeName()
        fetchNature()
        fetchPriority()
        fetchUser()

        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const uid = urlParams.get('uid');

            if (!uid) {
                message.info('Surat tidak ditemukan')
                router.push("/admin/daftarSurat")
                return
            }

            const handleMessage = async (uid) => {
                try {
                    setIsLoadingData(true)
                    const data = await fetchMessage(uid)

                    if (!data) {
                        message.info('Data surat tidak ditemukan')
                        console.log(data)
                        // router.push("/admin/daftarSurat")
                        return
                    }

                    setCurrentDocument(data.MessageContent)
                    setCurrentMessageStatus(data.MessageStatus)
                    setMessageClassification(data.MessageClassification)

                    const userUID = window.localStorage.getItem('UserUID')
                    const messageCode = await getMessageCodeByUser(userUID)
                    const templateCode = await getTemplateCodeByUid(data.TemplateUID)

                    const today = new Date(); // Get the current date and time
                    const currentYear = today.getFullYear().toString().slice(-2); // Extract the last two digits of the year
                    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');

                    if (data.MessageClassification == 1) {
                        setMessageNumberDocument(ZeroPad(data.EventNumberKeluar) + data.EventNumberSubKeluar + "-PSPIP" + "-" + templateCode + "-" + messageCode + "-" + currentMonth + currentYear)
                    } else {
                        setMessageNumberDocument(ZeroPad(data.EventNumberMemo) + data.EventNumberSubMemo + "-PSPIP-" + templateCode + "-" + messageCode + "-" + currentMonth + currentYear)
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

                    setIsLoadingData(false)
                } catch (error) {
                    console.error("Error loading message:", error)
                    message.info('Gagal memuat data surat')
                    setIsLoadingData(false)
                }
            }
            handleMessage(uid)
            setUID(uid)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    const getCurrentDocument = () => {
        return currentDocument
    }

    const getMessageClassification = () => {
        return messageClassification
    }

    const getMessageNumberDocument = () => {
        return messageNumberDocument
    }

    const editorRefSK = useRef(null);
    const editorRefMemo = useRef(null);
    const editorRefReview = useRef(null);

    const triggerEditorSKSave = () => {
        if (editorRefSK.current) {
            editorRefSK.current.triggerSaveSK();
        }
    };

    const triggerEditorMemoSave = () => {
        if (editorRefMemo.current) {
            editorRefMemo.current.triggerSaveMemo();
        }
    };

    const triggerEditorReviewSave = () => {
        if (editorRefReview.current) {
            editorRefReview.current.triggerSaveReview();
        }
    };

    const triggerEditorReviewUpdate = () => {
        if (editorRefReview.current) {
            editorRefReview.current.triggerUpdateReview();
        }
    };

    if (isLoadingData) {
        return (
            <main>
                <div className="flex items-center justify-center min-h-screen">
                    <Spin size="large" tip="Memuat data surat...">
                        <div className="p-20"></div>
                    </Spin>
                </div>
            </main>
        )
    }

    return (
        <main>
            {/* Lock Screen Overlay */}
            {loadingSubmit && (isModalApproveMemoOpen || isModalApproveSuratKeluarOpen) && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100vw',
                        height: '100vh'
                    }}
                >
                    <div className="bg-white rounded-lg p-8 shadow-2xl flex flex-col items-center space-y-4">
                        <Spin size="large" />
                        <div className="text-lg font-semibold text-gray-800">
                            Sedang memproses approval...
                        </div>
                        <div className="text-sm text-gray-600">
                            Mohon tunggu, jangan tutup halaman ini
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-xl text-gray-700 font-semibold">
                Review Surat
            </h2>

            <Spin spinning={loadingSubmit} tip="Sedang memproses, mohon tunggu...">
                <div className="flex p-3 bg-white shadow-sm rounded flex-col space-y-5 w-auto fixed top-1/2 -translate-y-1/2 right-0 shadow-lg z-50">
                    <div
                        className={`bg-white flex items-center flex-col p-2 font-semibold rounded border border-blue-400 text-blue-400 shadow-md ${loadingSubmit ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100 cursor-pointer'}`}
                        onClick={!loadingSubmit ? handleBack : undefined}
                    >
                        <MdArrowBack className="mb-2 text-sm" />
                        <div className="text-xs">
                            Kembali
                        </div>
                    </div>

                    <div
                        className={`bg-white flex items-center flex-col p-2 font-semibold rounded border border-yellow-400 text-yellow-400 shadow-md ${loadingSubmit ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-100 cursor-pointer'}`}
                        onClick={!loadingSubmit ? handleRevision : undefined}
                    >
                        <MdOutlineDocumentScanner className="mb-2 text-sm" />
                        <div className="text-xs">
                            Revisi
                        </div>
                    </div>

                    <div
                        className={`bg-white flex items-center flex-col p-2 font-semibold rounded border border-red-400 text-red-400 shadow-md ${loadingSubmit ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100 cursor-pointer'}`}
                        onClick={!loadingSubmit ? handleReject : undefined}
                    >
                        <MdClearAll className="mb-2 text-sm" />
                        <div className="text-xs">
                            Tolak
                        </div>
                    </div>

                    <div
                        className={`bg-white flex items-center flex-col p-2 font-semibold rounded border border-green-400 text-green-400 shadow-md ${loadingSubmit ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-100 cursor-pointer'}`}
                        onClick={!loadingSubmit ? handleApprove : undefined}
                    >
                        <MdOutlineDocumentScanner className="mb-2 text-sm" />
                        <div className="text-xs">
                            Approve
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white shadow-sm rounded mt-5 w-[90%]">
                    <h2 className="text-md font-semibold mb-5 text-gray-700">Detail Surat</h2>
                    <hr className="mb-8 bg-gray-300"></hr>
                    <Form
                        layout='horizontal'
                        labelCol={{ span: 5 }}
                        colon={false}
                        form={FormMessage}
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
                                        className="mb-3 w-full single"
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
                                        className="mb-3 w-full single"
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
                        <RichEditorReviewV2
                            ref={editorRefReview}
                            getCurrentDocument={getCurrentDocument}
                            getMessageClassification={getMessageClassification}
                            onSaveComplete={handleOnReviewerSaveComplete}
                            onUpdateDocument={handleOnUpdateDocument}
                            isOpen={true}
                        />
                    </Suspense>
                </div>


                <Modal
                    open={isModalRevisionOpen}
                    title="Revisi Surat"
                    footer={false}
                    onCancel={handleCancelRevision}
                    maskClosable={false}
                >
                    <div className='font-semibold text-gray-700 mb-5 mt-5'>
                        Apakah anda yakin untuk meminta revisi pada surat ini  ?
                    </div>

                    <Form
                        form={FormRevision}
                        layout='vertical'
                        onFinish={handleFinishRevision}
                    >
                        <Form.Item
                            label="Catatan"
                            name="Content"
                        >
                            <Input.TextArea></Input.TextArea>
                        </Form.Item>
                    </Form>

                    <div className="flex space-x-3">
                        <button className="flex-1 bg-red-500 text-white py-3 rounded font-semibold"
                            onClick={handleCancelRevision}
                        >
                            Batal
                        </button>

                        <button
                            className={`flex-1 bg-green-500 text-white py-3 rounded font-semibold ${loadingSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleConfirmRevision}
                            disabled={loadingSubmit}
                        >
                            Konfirmasi
                        </button>
                    </div>
                </Modal>

                <Modal
                    open={isModalApproveMemoOpen}
                    title="Approve Surat"
                    footer={false}
                    onCancel={handleCancelApprove}
                    maskClosable={false}
                    closable={!loadingSubmit}
                    width={currentMessageStatus == 42 ? 1200 : 800}
                    style={{
                        top: '10px'
                    }}
                    destroyOnHidden={true}
                >
                    <div className='font-semibold text-gray-700 mb-5 mt-5'>
                        Apakah anda yakin untuk menyetujui surat ini untuk dikirimkan  ?
                    </div>


                    <div className="flex space-x-3">
                        <button className="flex-1 bg-red-500 text-white py-3 rounded font-semibold"
                            onClick={handleCancelApprove}
                            disabled={loadingSubmit}
                        >
                            Batal
                        </button>

                        <button
                            className={`flex-1 bg-green-500 text-white py-3 rounded font-semibold ${loadingSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleFinishApprove}
                            disabled={loadingSubmit}
                        >
                            {loadingSubmit ? 'Memproses...' : 'Konfirmasi'}
                        </button>
                    </div>

                    {
                        currentMessageStatus == 42 ?
                            (
                                <Suspense fallback={<div>Loading...</div>}>
                                    <RichEditorSignatureMemoV2
                                        ref={editorRefMemo}
                                        getCurrentDocument={getCurrentDocument}
                                        getMessageNumberDocument={getMessageNumberDocument}
                                        onSaveComplete={handleOnSaveComplete}
                                        isOpen={isModalApproveMemoOpen}
                                    />
                                </Suspense>
                            ) :
                            null
                    }
                </Modal>

                <Modal
                    open={isModalApproveSuratKeluarOpen}
                    title="Approve Surat"
                    footer={false}
                    onCancel={handleCancelApprove}
                    maskClosable={false}
                    closable={!loadingSubmit}
                    width={currentMessageStatus == 42 ? 1200 : 800}
                    style={{
                        top: '10px'
                    }}
                    destroyOnHidden={true}
                >
                    <div className='font-semibold text-gray-700 mb-5 mt-5'>
                        Apakah anda yakin untuk menyetujui surat ini untuk dikirimkan  ?
                    </div>

                    <div className="flex space-x-3 mb-5">
                        <button className="flex-1 bg-red-500 text-white py-3 rounded font-semibold"
                            onClick={handleCancelApprove}
                            disabled={loadingSubmit}
                        >
                            Batal
                        </button>

                        <button
                            className={`flex-1 bg-green-500 text-white py-3 rounded font-semibold ${loadingSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleFinishApprove}
                            disabled={loadingSubmit}
                            htmlType='submit'
                        >
                            {loadingSubmit ? 'Memproses...' : 'Konfirmasi'}
                        </button>
                    </div>

                    {
                        currentMessageStatus == 42 ?
                            (
                                <Suspense fallback={<div>Loading...</div>}>
                                    <RichEditorSignatureV2
                                        ref={editorRefSK}
                                        getCurrentDocument={getCurrentDocument}
                                        getMessageNumberDocument={getMessageNumberDocument}
                                        onSaveComplete={handleOnSaveComplete}
                                        isOpen={isModalApproveSuratKeluarOpen}
                                    />
                                </Suspense>
                            ) : ""
                    }


                </Modal>


                <Modal
                    open={isModalRejectOpen}
                    title="Tolak Surat"
                    footer={false}
                    onCancel={handleCancelReject}
                    maskClosable={false}
                >
                    <div className='font-semibold text-gray-700 mb-5 mt-5'>
                        Apakah anda yakin untuk menolak surat ini untuk dikirimkan  ?
                    </div>
                    <Form
                        form={FormRejection}
                        layout='vertical'
                        onFinish={handleFinishRejection}
                    >
                        <Form.Item
                            label="Catatan"
                            name="Content"
                        >
                            <Input.TextArea></Input.TextArea>
                        </Form.Item>
                    </Form>

                    <div className="flex space-x-3">
                        <button className="flex-1 bg-red-500 text-white py-3 rounded font-semibold"
                            onClick={handleCancelReject}
                        >
                            Batal
                        </button>

                        <button
                            className={`flex-1 bg-green-500 text-white py-3 rounded font-semibold ${loadingSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleConfirmRejection}
                            disabled={loadingSubmit}
                        >
                            Konfirmasi
                        </button>
                    </div>
                </Modal>

                <Modal
                    open={isModalBackOpen}
                    title="Kembali"
                    footer={false}
                    onCancel={handleCancelBack}
                    maskClosable={false}
                >
                    <div className='font-semibold text-gray-700 mb-5 mt-5'>
                        Apakah anda yakin untuk kembali ke Daftar Surat ?
                    </div>


                    <div className="flex space-x-3">
                        <button className="flex-1 bg-red-500 text-white py-3 rounded font-semibold"
                            onClick={handleCancelBack}
                        >
                            Batal
                        </button>

                        <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold"
                            onClick={handleConfirmBack}
                        >
                            Konfirmasi
                        </button>
                    </div>
                </Modal>
            </Spin>
        </main >
    )
}
