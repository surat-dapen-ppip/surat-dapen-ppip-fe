/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { Form, Input, message, Modal, Select, Spin, Row, Col } from 'antd';
import { MdArrowBack, MdClearAll, MdOutlineDocumentScanner} from 'react-icons/md';
import { Suspense, useEffect, useState } from 'react';
import { getTemplateNameSurat, getTemplateSuratByUid, getTypeNameSurat } from '@/services/messageTemplate';
import { getNatures } from '@/services/natures';
import { getPriorities } from '@/services/priorities';
import dynamic from 'next/dynamic';
import { useLayoutContext } from '@/hooks/useLayoutContext';
import { GetCurrentDateInISOFormat, GetCurrentMonthInRoman, GetPositionName, ZeroPad } from '@/utils/utility';
import { approveMessage, getMessageByUid } from '@/services/message';
import { getUserByUid, getUsers } from '@/services/users';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import moment from 'moment';
import { createMessageRevision } from '@/services/messageRevision';
import { getMediaByUid } from '@/services/media';

import QRCodeStyling from "qr-code-styling";
import { createMessageRejection } from '@/services/messageRejection';

const RichEditSignatureMemoComponent = dynamic(() => import('@/components/richEditSignatureMemo'), { ssr: false });
const RichEditComponent = dynamic(() => import('@/components/richEditor'), { ssr: false });
const RichEditReadOnlyComponent = dynamic(() => import('@/components/richEditReadOnly'), { ssr: false });
const RichEditSignatureComponent = dynamic(() => import('@/components/richEditSignature'), { ssr: false });

export default function pageReview() {
    const router = useRouter()
    const [UID, setUID] = useState("");
    const [dataMessage, setDataMessage] = useState()

    const [currentMessageStatus, setCurrentMessageStatus] = useState()
    const [messageClassification, setMessageClassification] = useState()

    const [contentQR, setContentQR] = useState("");
    const [signatureDocument, setSignatureDocument] = useState("");
    const [messageNumberDocument, setMessageNumberDocument] = useState("")

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (contentQR != "") {
                const qrCode = new QRCodeStyling({
                    width: 80,
                    height: 80,
                    image:
                        process.env.NEXT_PUBLIC_HOST_URL + "/logo-ppip.svg",
                    dotsOptions: {
                        color: "black",
                        type: "rounded"
                    },
                    imageOptions: {
                        crossOrigin: "anonymous",
                        margin: 2,
                        imageSize: 0.3
                    }
                });

                qrCode.update({
                    data: contentQR
                });

                // Convert Blob to Base64
                qrCode.getRawData("png").then((blob) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setSignatureDocument(reader.result); // Base64 string
                    };
                    reader.readAsDataURL(blob);
                });
            }
        }

    }, [contentQR]);


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
    const handleApprove = () => {
        setTriggerUpdate(!triggerUpdate)
        setLoadingSubmit(true);
        setTimeout(() => {
            if (messageClassification == 1) {
                setIsModalApproveSuratKeluarOpen(true)
            } else {
                setIsModalApproveMemoOpen(true)
            }
            setTriggerSignature(!triggerSignature)
            setLoadingSubmit(false);
        }, 5000)

    }
    const handleRevision = () => { setIsModalRevisionOpen(true) }
    const handleReject = () => { setIsModalRejectOpen(true) }

    const handleCancelBack = () => { setIsModalBackOpen(false) }
    const handleCancelApprove = () => {
        if (messageClassification == 1) {
            setIsModalApproveSuratKeluarOpen(false)
        } else {
            setIsModalApproveMemoOpen(false)
        }
    }
    const handleCancelRevision = () => { setIsModalRevisionOpen(false) }
    const handleCancelReject = () => { setIsModalRejectOpen(false) }

    const handleConfirmBack = () => {
        router.push("/admin/daftarSurat")
    }

    const handleConfirmRevision = () => {
        setMessageStatus(5)
        setTimeout(() => {
            FormRevision.submit()
        }, 300)
        setIsModalRevisionOpen(false)
    }

    const handleConfirmRejection = () => {
        setMessageStatus(6)
        setTimeout(() => {
            FormRejection.submit()
        }, 300)
        setIsModalRevisionOpen(false)
    }

    const fetchMessage = async (uid) => {
        const response = await getMessageByUid(uid)
        if (response) {
            setDataMessage(response.data)
        }
        return response.data
    }

    const [triggerSaveReview, setTriggerSaveReview] = useState(false)
    const [triggerSaveApprove, setTriggerSaveApprove] = useState(false)
    const [triggerUpdate, setTriggerUpdate] = useState(false)
    const [triggerReset, setTriggerReset] = useState(false)
    const [triggerSignature, setTriggerSignature] = useState(false)

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

    const fetchTemplateName = async (typeName) => {
        const response = await getTemplateNameSurat(typeName);
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
            setLoadingSubmit(false); // Stop loading spinner
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

    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [fileList, setFileList] = useState([]);

    const handleFinishSubmission = async () => {}

    const handleFinishRejection = async () => {
        setLoadingSubmit(true);
        let data = FormRejection.getFieldsValue()
        data.MessageUID = UID
        data.FromUserUID = recipientUID
        data.FromUserName = name;

        try {
            await createMessageRejection(data)
            message.success("Proses Berhasil")
            router.push("/admin/daftarSurat")
        } catch (error) {
            message.error("Proses Gagal")
        } finally {
            setLoadingSubmit(false);
        }
    }


    const handleFinishRevision = async () => {
        setLoadingSubmit(true);
        let data = FormRevision.getFieldsValue()
        data.MessageUID = UID
        data.FromUserUID = recipientUID
        data.FromUserName = name;

        try {
            await createMessageRevision(data)
            message.success("Proses Berhasil")
            router.push("/admin/daftarSurat")
        } catch (error) {
            message.error("Proses Gagal")
        } finally {
            setLoadingSubmit(false);
        }
    }

    const handleFinishApprove = async () => {
        if (typeof window !== 'undefined') {
            if (currentMessageStatus == 41) {
                setTriggerSaveReview(!triggerSaveReview)
            } else if (currentMessageStatus == 42) {
                setTriggerSaveApprove(!triggerSaveApprove)
            } else {
                message.error('You are not allowed to perform this action')
            }
        }

    }


    const [dataUser, setDataUser] = useState([])
    const fetchUser = async () => {
        const response = await getUsers()
        if (response) {
            setDataUser(response.data)
        }
    }

    const API_URL = process.env.NEXT_PUBLIC_PUBLIC_URL
    const [dataMedia, setDataMedia] = useState()
    const [downloading, setDownloading] = useState(false)
    const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

    const handleDownload = () => {
        if (pdfBlobUrl) {
            const link = document.createElement('a');
            link.href = pdfBlobUrl;
            link.setAttribute('download', dataMedia.Name);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        }
    };

    const fetchMedia = async () => {
        const response = await getMediaByUid(dataMessage?.ListMedia)
        if (response) {
            setDataMedia(response.data)
        }
    }

    const fetchPdf = async () => {
        try {
            setDownloading(true);
            const response = await axios.get(API_URL + "/mediaS3/" + dataMessage?.ListMedia, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setPdfBlobUrl(url);
        } catch (error) {
            console.error('Error downloading file:', error);
        }
        setDownloading(false);
    };

    const getMessageCodeByUser = async (UID) => {
        const response = await getUserByUid(UID)
        if (response) {
            return response.data?.Organization?.MessageCode
        }
        return ""
    }

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (dataMessage?.ListMedia != "") {
                fetchMedia()
                fetchPdf();
            } else {
                setDataMedia(null)
                setPdfBlobUrl(null)
            }
        }

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

            const handleMessage = async () => {
                const data = await fetchMessage(uid)

                setCurrentMessageStatus(data.MessageStatus)
                setMessageClassification(data.MessageClassification)


                const userUID = window.localStorage.getItem('UserUID')
                const messageCode = await getMessageCodeByUser(userUID)

                const today = new Date(); // Get the current date and time
                const currentYear = today.getFullYear(); // Extract the full year
                const currentMonth = String(today.getMonth() + 1).padStart(2, '0');

                if (data.MessageClassification == 1) {
                    setMessageNumberDocument(ZeroPad(data.EventNumberKeluar) + data.EventNumberSubKeluar + "-PSPIP-SDK-"+ messageCode +"-"+currentMonth +currentYear)
                } else {
                    setMessageNumberDocument(ZeroPad(data.EventNumberMemo) + data.EventNumberSubMemo + "-PSPIP-SDI-"+ messageCode +"-"+currentMonth +currentYear)
                }

                setContentQR(data.UID)

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

                const optionTemplateName = [
                    { label: data.TemplateUID, value: data.TemplateUID }
                ]


                const selectedReviewer = data.ReviewerUID?.split(",").map(uid => 
                    optionUser.find(option => option.value === uid)
                )
                const selectedApprover = optionUser.find(option => option.value === data.ApproverUID);
                const selectedCC = optionUser.filter(option => data.CCUID?.split(",").includes(option.value));
                const selectedRecipient = optionUser.filter(option => data.RecipientUID?.split(",").includes(option.value));
                const selectedTemplate = optionTemplateName.find(option => option.label === data.TemplateUID)

                FormMessage.setFieldValue('ReviewerObject', selectedReviewer)
                FormMessage.setFieldValue('ApproverObject', selectedApprover)
                FormMessage.setFieldValue('CCObject', selectedCC)
                FormMessage.setFieldValue('RecipientObject', selectedRecipient)
                FormMessage.setFieldValue('TemplateObject', selectedTemplate)

                setTimeout(() => {
                    setCurrentDocument(data.MessageContent)
                }, 300)

                fetchTemplateName(data.TypeUID)
            }
            handleMessage()
            setUID(uid)
        }
    }, [])



    return (
        <main>
            <h2 className="text-xl text-gray-700 font-semibold">
                Review Surat
            </h2>

            <Spin spinning={loadingSubmit} tip="Sedang memproses, mohon tunggu...">
                <div className="flex p-3 bg-white shadow-sm rounded flex-col space-y-5 w-auto fixed top-1/2 -translate-y-1/2 right-0 shadow-lg z-50">
                    <div className="bg-white flex items-center flex-col p-2 font-semibold rounded border border-blue-400 hover:bg-blue-100 text-blue-400 cursor-pointer shadow-md"
                        onClick={handleBack}
                    >
                        <MdArrowBack className="mb-2 text-sm" />
                        <div className="text-xs">
                            Kembali
                        </div>
                    </div>

                    <div className="bg-white flex items-center flex-col p-2 font-semibold rounded border border-yellow-400 hover:bg-yellow-100 text-yellow-400 cursor-pointer shadow-md"
                        onClick={handleRevision}
                    >
                        <MdOutlineDocumentScanner className="mb-2 text-sm" />
                        <div className="text-xs">
                            Revisi
                        </div>
                    </div>

                    <div className="bg-white flex items-center flex-col p-2 font-semibold rounded border border-red-400 hover:bg-red-100 text-red-400 cursor-pointer shadow-md"
                        onClick={handleReject}
                    >
                        <MdClearAll className="mb-2 text-sm" />
                        <div className="text-xs">
                            Tolak
                        </div>
                    </div>

                    <div className="bg-white flex items-center flex-col p-2 font-semibold rounded border border-green-400 hover:bg-green-100 text-green-400 cursor-pointer shadow-md"
                        onClick={handleApprove}
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
                    <div className='ml-10'>
                        {pdfBlobUrl ? (
                            <>
                                <button
                                    className={'p-3 text-sm font-semibold ' + (downloading ? "bg-gray-100 text-gray-300" : "bg-blue-100")}
                                    onClick={handleDownload}
                                    disabled={downloading}
                                >
                                    {downloading ? "Downloading..." : "Download Lampiran"}
                                </button>
                            </>
                        ) : (
                            <p>{dataMedia == null ? (<>Tidak ada lampiran</>) : (<>Loading File....</>)}</p>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-white shadow-sm rounded mt-5 w-[90%]">
                    <Suspense fallback={<div>Loading...</div>}>
                        <RichEditComponent
                            currentDocument={currentDocument}
                            setCurrentDocument={setCurrentDocument}
                            onSaveComplete={handleOnReviewerSaveComplete}
                            triggerSave={triggerSaveReview}
                            triggerUpdate={triggerUpdate}
                            triggerReset={triggerReset}
                            messageClassification={messageClassification}
                            isReviewerEnabled={true}
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

                        <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold"
                            onClick={handleConfirmRevision}
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
                    width={currentMessageStatus == 42 ? 1200 : 800}
                    style={{
                        top: '10px'
                    }}
                >
                    <div className='font-semibold text-gray-700 mb-5 mt-5'>
                        Apakah anda yakin untuk menyetujui surat ini untuk dikirimkan  ?
                    </div>

                    {
                        currentMessageStatus == 42 ?
                            (
                                <Suspense fallback={<div>Loading...</div>}>
                                    <RichEditSignatureMemoComponent
                                        currentDocument={currentDocument}
                                        setCurrentDocument={setCurrentDocument}
                                        onSaveComplete={handleOnSaveComplete}
                                        triggerSave={triggerSaveApprove}
                                        triggerSignature={triggerSignature}
                                        setTriggerSignature={setTriggerSignature}
                                        messageClassification={messageClassification}
                                        signatureDocument={signatureDocument}
                                        messageNumberDocument={messageNumberDocument}
                                    />
                                </Suspense>
                            ) :
                            null
                    }


                    <div className="flex space-x-3">
                        <button className="flex-1 bg-red-500 text-white py-3 rounded font-semibold"
                            onClick={handleCancelApprove}
                        >
                            Batal
                        </button>

                        <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold"
                            onClick={handleFinishApprove}
                        >
                            Konfirmasi
                        </button>
                    </div>
                </Modal>

                <Modal
                    open={isModalApproveSuratKeluarOpen}
                    title="Approve Surat"
                    footer={false}
                    onCancel={handleCancelApprove}
                    maskClosable={false}
                    width={currentMessageStatus == 42 ? 1200 : 800}
                    style={{
                        top: '10px'
                    }}
                >
                    <div className='font-semibold text-gray-700 mb-5 mt-5'>
                        Apakah anda yakin untuk menyetujui surat ini untuk dikirimkan  ?
                    </div>


                    {
                        currentMessageStatus == 42 ?
                            (
                                <Suspense fallback={<div>Loading...</div>}>
                                    <RichEditSignatureComponent
                                        currentDocument={currentDocument}
                                        setCurrentDocument={setCurrentDocument}
                                        onSaveComplete={handleOnSaveComplete}
                                        triggerSave={triggerSaveApprove}
                                        triggerSignature={triggerSignature}
                                        setTriggerSignature={setTriggerSignature}
                                        messageClassification={messageClassification}
                                        signatureDocument={signatureDocument}
                                        messageNumberDocument={messageNumberDocument}
                                    />
                                </Suspense>
                            ) :
                            null
                    }


                    <div className="flex space-x-3">
                        <button className="flex-1 bg-red-500 text-white py-3 rounded font-semibold"
                            onClick={handleCancelApprove}
                        >
                            Batal
                        </button>

                        <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold"
                            onClick={handleFinishApprove}
                        >
                            Konfirmasi
                        </button>
                    </div>
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

                        <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold"
                            onClick={handleConfirmRejection}
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