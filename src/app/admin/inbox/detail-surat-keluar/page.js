/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import {Button, Form, message, Modal, Select, Spin, Table, Tabs, Row, Col} from 'antd';
import {MdClear, MdDownload, MdInsertDriveFile, MdOutlineAltRoute, MdOutlineDocumentScanner, MdOutlineKeyboardReturn } from 'react-icons/md';
import { Suspense, useEffect, useRef, useState } from 'react';
import { getTemplateNameSurat, getTemplateSuratByUid, getTypeNameSurat } from '@/services/messageTemplate';
import { getNatures } from '@/services/natures';
import { getPriorities } from '@/services/priorities';
import dynamic from 'next/dynamic';
import { useLayoutContext } from '@/hooks/useLayoutContext';
import { GetEventIDName, GetPositionName, GetSubmitIDName, formatCurrentWIBTimestamp } from '@/utils/utility';
import { getMessageByUid, updateMessageProccessed } from '@/services/message';
import { getUsers } from '@/services/users';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import moment from 'moment';
import { getMediaByUid } from '@/services/media';
import Draggable from 'react-draggable';
import { createMessageEvent, getMessageEvents } from '@/services/messageEvent';
import CryptoJS from 'crypto-js';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
// import PdfViewer from '@/components/pdfViewer';

const RichEditReadOnlyComponent = dynamic(() => import('@/components/richEditReadOnly'), { ssr: false });


export default function pageDetailSuratKeluar() {
    const router = useRouter()
    const [UID, setUID] = useState("");

    const [dataMessage, setDataMessage] = useState()
    const [dataMessageEvent, setDataMessageEvent] = useState([])
    const [dataUser, setDataUser] = useState([])

    const [isModalRejectOpen, setIsModalRejectOpen] = useState(false)
    const [isModalDispositionOpen, setIsModalDispositionOpen] = useState(false)
    const [isModalForwardOpen, setIsModalForwardOpen] = useState(false)
    const [isModalSubmitOpen, setIsModalSubmitOpen] = useState(false)

    const {fetchCount } = useLayoutContext();

    const [optionType, setOptionType] = useState([])
    const [optionTemplate, setOptionTemplate] = useState([])
    const [optionNature, setOptionNature] = useState([])
    const [optionPriority, setOptionPriority] = useState([])

    const [FormMessage] = Form.useForm()
    const [FormDisposition] = Form.useForm()
    const [FormForward] = Form.useForm()
    const [FormSubmit] = Form.useForm()

    const [disabled, setDisabled] = useState(true);
    const [bounds, setBounds] = useState({
        left: 0,
        top: 0,
        bottom: 0,
        right: 0,
    });
    const draggleRef = useRef(null);
    const [currentDocument, setCurrentDocument] = useState("")


    const API_URL = process.env.NEXT_PUBLIC_PUBLIC_URL
    const [mediaList, setMediaList] = useState([])
    const [downloadingStates, setDownloadingStates] = useState({})

    const onStart = (_event, uiData) => {
        const { clientWidth, clientHeight } = window.document.documentElement;
        const targetRect = draggleRef.current?.getBoundingClientRect();
        if (!targetRect) {
            return;
        }
        setBounds({
            left: -targetRect.left + uiData.x,
            right: clientWidth - (targetRect.right - uiData.x),
            top: -targetRect.top + uiData.y,
            bottom: clientHeight - (targetRect.bottom - uiData.y),
        });
    };


    const fetchMessage = async (uid) => {
        const response = await getMessageByUid(uid)
        if (response) {
            setDataMessage(response.data)
        }
        return response.data
    }

    const fetchMessageEvent = async (uid) => {
        const response = await getMessageEvents(uid)
        if (response) {
            setDataMessageEvent(response.data)
        }
    }

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

    const fetchUser = async () => {
        const response = await getUsers()
        if (response) {
            setDataUser(response.data)
        }
    }

    const handleDownload = async (mediaUID, fileName) => {
        try {
            setDownloadingStates(prev => ({ ...prev, [mediaUID]: true }));
            
            const ext = fileName.split('.').pop()?.toLowerCase();

            if (ext === 'pdf') {
                if (typeof window === 'undefined') return;

                const response = await axios.get(`${API_URL}/mediaS3/${mediaUID}`, {
                    responseType: 'blob',
                });

                const fontUrl = 'https://pdf-lib.js.org/assets/ubuntu/Ubuntu-R.ttf';
                const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());
                const pdfBytes = await response.data.arrayBuffer();

                const pdfDoc = await PDFDocument.load(pdfBytes);
                pdfDoc.registerFontkit(fontkit);
                const customFont = await pdfDoc.embedFont(fontBytes);

                const pages = pdfDoc.getPages();
                const textSize = 10;
                const borderPadding = 10;
                const username = window.localStorage.getItem('Name');
                const downloadTimestamp = formatCurrentWIBTimestamp();

                const watermarkText = [
                    "",
                    "Dana Pensiun PPIP",
                    "Downloaded by:",
                    username || '-',
                    "Downloaded at:",
                    downloadTimestamp,
                ];

                pages.forEach((page) => {
                    const { width, height } = page.getSize();
                    const boxWidth = 200;
                    const boxHeight = watermarkText.length * (textSize + 5) + borderPadding * 2;
                    const boxX = 100;
                    const boxY = height - 100;

                    page.drawRectangle({
                        x: boxX,
                        y: boxY,
                        width: boxWidth,
                        height: boxHeight,
                        borderWidth: 1,
                        borderColor: rgb(1, 0, 0),
                        opacity: 0.4,
                        rotate: degrees(5)
                    });

                    page.drawText("CONFIDENTAL DOCUMENT", {
                        x: boxX + borderPadding,
                        y: boxY + boxHeight - borderPadding - textSize * (0 + 1),
                        size: 12,
                        font: customFont,
                        color: rgb(1, 0, 0),
                        opacity: 0.4,
                        rotate: degrees(5)
                    });

                    watermarkText.forEach((line, index) => {
                        page.drawText(line || '', {
                            x: boxX + borderPadding,
                            y: boxY + boxHeight - borderPadding - textSize * (index + 2),
                            size: textSize,
                            font: customFont,
                            color: rgb(1, 0, 0),
                            opacity: 0.4,
                            rotate: degrees(5)
                        });
                    });
                });

                const modifiedPdfBytes = await pdfDoc.save();
                const modifiedPdfBlob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
                const modifiedPdfUrl = window.URL.createObjectURL(modifiedPdfBlob);

                const link = document.createElement('a');
                link.href = modifiedPdfUrl;
                link.setAttribute('download', fileName || 'document.pdf');
                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);

                setTimeout(() => {
                    window.URL.revokeObjectURL(modifiedPdfUrl);
                }, 1000);

                message.success(`File ${fileName} berhasil didownload`);
            } else {
                // Non-PDF fallback
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
            }
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

    const handleReject = () => { setIsModalRejectOpen(true) }
    const handleDisposition = () => { setIsModalDispositionOpen(true) }
    const handleForward = () => { setIsModalForwardOpen(true) }
    const handleSubmit = () => { setIsModalSubmitOpen(true) }

    const handleCancelReject = () => { setIsModalRejectOpen(false) }
    const handleCancelDisposition = () => {
        setIsModalDispositionOpen(false)
        FormDisposition.resetFields()
    }
    const handleCancelForward = () => {
        setIsModalForwardOpen(false)
        FormForward.resetFields()
    }
    const handleCancelSubmit = () => {
        setIsModalSubmitOpen(false)
        FormSubmit.resetFields()
    }


    useEffect(() => {
        fetchTypeName()
        fetchNature()
        fetchPriority()
        fetchUser()


        if (typeof window !== 'undefined') {
            // Access query parameters from the URL
            const urlParams = new URLSearchParams(window.location.search);
            const uid = urlParams.get('uid');
            fetchMessageEvent(uid)

            const handleMessage = async () => {
                const data = await fetchMessage(uid)
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    const [loadingSubmit, setLoadingSubmit] = useState(false)
    const handleMessageEvent = async (FormEvent, eventID) => {
        if (typeof window !== 'undefined') {
            setLoadingSubmit(true); // Start loading spinner
            setIsModalDispositionOpen(false)
            setIsModalForwardOpen(false)
            setIsModalRejectOpen(false)
            setIsModalSubmitOpen(false)

            let data = FormEvent.getFieldsValue()
            console.log(data)
            let ListUserUID = []
            let ListUserName = []

            data.ListUserUID?.forEach(item => {
                ListUserName.push(item.label)
                ListUserUID.push(item.value)
            });

            data.ListUserName = ListUserName.join(',');
            data.ListUserUID = ListUserUID.join(',');
            data.EventID = eventID
            data.MessageUID = UID
            data.FromUserUID = window.localStorage.getItem('UserUID')
            data.FromUserName = window.localStorage.getItem('Name')

            try {
                await createMessageEvent(data)
                await updateMessageProccessed(UID)


                const userUID = window.localStorage.getItem('UserUID')
                const currentRoleID = window.localStorage.getItem('RoleID');

                let roleID = 0
                for (let i = 0; i <= 2; i++) {
                    if (CryptoJS.HmacMD5(i, 'EE_MENCRET') == currentRoleID) {
                        roleID = i
                        break;
                    }
                }

                await fetchCount(roleID, userUID)
                setLoadingSubmit(false)

                message.success("Proses Berhasil")
            } catch (error) {
                message.error("Proses Gagal")
                console.log(error)
            }

            if (eventID == 1) {
                setIsModalDispositionOpen(false)
            } else if (eventID == 2) {
                setIsModalForwardOpen(false)
            } else if (eventID == 3) {
                setIsModalSubmitOpen(false)
            }
            router.push("/admin/inbox")
        }
    }

    const handleFinishReject = async () => {
        if (typeof window !== 'undefined') {
            let data = {}
            data.EventID = 5
            data.MessageUID = UID
            data.FromUserUID = window.localStorage.getItem('UserUID')
            data.FromUserName = window.localStorage.getItem('Name')

            try {
                await createMessageEvent(data)
                await updateMessageProccessed(UID)

                message.success("Proses Berhasil")
            } catch (error) {
                message.error("Proses Gagal")
            }

            router.push("/admin/inbox")
        }
    }



    const tabsContent = [
        {
            key: '1',
            label: (
                <h2 className="text-lg font-semibold text-gray-700">Detail Surat</h2>
            ),
            children: (
                <div>
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
                            />
                        </Suspense>
                    </div>
                </div>
            )
        },
        {
            key: '2',
            label: (
                <h2 className="text-lg font-semibold text-gray-700">Tindak Lanjut</h2>
            ),
            children: (
                <div className="p-6 bg-white shadow-sm rounded mt-3 w-[90%]">
                    <Table
                        dataSource={dataMessageEvent}
                        columns={[
                            {
                                title: 'Timestamp',
                                render: (_, record) => {
                                    return (
                                        <>
                                            {moment(record.CreatedAt).format("YYYY-MM-DD HH:mm:ss")}
                                        </>
                                    )
                                }
                            },
                            {
                                title: 'Keterangan',
                                render: (_, record) => {
                                    return (
                                        <>
                                            {GetEventIDName(record.EventID) == "disubmit" ? GetSubmitIDName(record.SubmitID) : GetEventIDName(record.EventID)}
                                        </>
                                    )
                                }
                            },
                            {
                                title: 'Kepada',
                                dataIndex: 'ListUserName',
                                key: 'ListUserName',
                            },
                            {
                                title: 'Catatan',
                                dataIndex: 'Notes',
                                key: 'Notes',
                            }
                        ]}
                    />
                </div>
            ),
        },
        {
            key: '3',
            label: <h2 className="text-lg font-semibold text-gray-700">History</h2>,
            children:             <div className="p-6 bg-white shadow-sm rounded mt-3 w-[90%]">
                <Table
                    dataSource={dataMessageEvent}
                    columns={[
                        {
                            title: 'Timestamp',
                            render: (_, record) => {
                                return (
                                    <>
                                        {moment(record.CreatedAt).format("YYYY-MM-DD HH:mm:ss")}
                                    </>
                                )
                            }
                        },
                        {
                            title: 'Status',
                            render: (_, record) => {
                                return (
                                    <>
                                        {GetEventIDName(record.EventID)}
                                    </>
                                )
                            }
                        },
                        {
                            title: 'Oleh',
                            dataIndex: 'FromUserName',
                            key: 'FromUserName',
                        },
                    ]}
                />
            </div>,
        },
    ]

    return (
        <main>
            <Spin spinning={loadingSubmit} tip="Sedang memproses, mohon tunggu...">
                <div className="p-3 bg-white shadow-sm rounded flex-col space-y-5 w-auto fixed top-1/2 -translate-y-1/2 right-0 shadow-lg z-50">
                    <div className="bg-white flex items-center flex-col p-2 font-semibold rounded border border-red-400 hover:bg-red-100 text-red-400 cursor-pointer shadow-md"
                        onClick={handleReject}
                    >
                        <MdClear className="mb-2 text-sm" />
                        <div className="text-xs">
                            Tolak
                        </div>
                    </div>

                    <div className="bg-white flex items-center flex-col p-2 font-semibold rounded border border-blue-400 hover:bg-blue-100 text-blue-400 cursor-pointer shadow-md"
                        onClick={handleDisposition}
                    >
                        <MdOutlineAltRoute className="mb-2 text-sm" />
                        <div className="text-xs">
                            Disposisi
                        </div>
                    </div>


                    <div className="bg-white flex items-center flex-col p-2 font-semibold rounded border border-gray-400 hover:bg-gray-100 text-gray-400 cursor-pointer shadow-md"
                        onClick={handleForward}
                    >
                        <MdOutlineKeyboardReturn className="mb-2 text-sm" />
                        <div className="text-xs">
                            Alihkan
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

                <Tabs defaultActiveKey="1" items={tabsContent} size="lg" />


                <Modal
                    open={isModalRejectOpen}
                    title={
                        <div
                            style={{
                                width: '100%',
                                cursor: 'move',
                            }}
                            onMouseOver={() => {
                                if (disabled) {
                                    setDisabled(false);
                                }
                            }}
                            onMouseOut={() => {
                                setDisabled(true);
                            }}
                            onFocus={() => { }}
                            onBlur={() => { }}
                        >
                            <h2 className="text-gray-700 text-lg font-semibold">
                                Tolak
                            </h2>
                        </div>
                    }
                    maskClosable={false}
                    footer={false}
                    onCancel={handleCancelReject}
                    modalRender={(modal) => (
                        <Draggable
                            disabled={disabled}
                            bounds={bounds}
                            nodeRef={draggleRef}
                            onStart={(event, uiData) => onStart(event, uiData)}
                        >
                            <div ref={draggleRef}>{modal}</div>
                        </Draggable>
                    )}
                >
                    <div className='font-semibold text-gray-700 mb-5 mt-5'>
                        Apakah anda yakin untuk menolak Surat ini ?
                        <div className='font-normal'>
                            Pesan akan masuk ke dalam Arsip Histori sebagai Surat yang Ditolak.
                        </div>
                    </div>


                    <div className="flex space-x-3">
                        <button className="flex-1 bg-red-500 text-white py-3 rounded font-semibold"
                            onClick={handleCancelReject}
                        >
                            Batal
                        </button>

                        <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold"
                            onClick={() => {
                                handleFinishReject()
                            }}
                        >
                            Simpan
                        </button>
                    </div>
                </Modal>


                <Modal
                    open={isModalDispositionOpen}
                    title={
                        <div
                            style={{
                                width: '100%',
                                cursor: 'move',
                            }}
                            onMouseOver={() => {
                                if (disabled) {
                                    setDisabled(false);
                                }
                            }}
                            onMouseOut={() => {
                                setDisabled(true);
                            }}
                            onFocus={() => { }}
                            onBlur={() => { }}
                        >
                            <h2 className="text-gray-700 text-lg font-semibold">
                                Disposisi
                            </h2>
                        </div>
                    }
                    maskClosable={false}
                    footer={false}
                    onCancel={handleCancelDisposition}
                    modalRender={(modal) => (
                        <Draggable
                            disabled={disabled}
                            bounds={bounds}
                            nodeRef={draggleRef}
                            onStart={(event, uiData) => onStart(event, uiData)}
                        >
                            <div ref={draggleRef}>{modal}</div>
                        </Draggable>
                    )}
                >
                    <Form
                        layout='vertical'
                        form={FormDisposition}
                        onFinish={() => {
                            handleMessageEvent(FormDisposition, 1)
                        }}
                    >
                        <Form.Item
                            name={"ListUserUID"}
                            label={"Disposisi ke"}
                            rules={[{ required: true, message: 'Please input disposition' }]}
                        >
                            <Select
                                mode="multiple"
                                labelInValue={true}
                                options={dataUser?.map((record) => {
                                    return {
                                        value: record.UID,
                                        label: record.Name + " | " + (GetPositionName(record.PositionID) + " " + record.Organization?.Name)
                                    }
                                })}
                                className="mb-3"
                            />
                        </Form.Item>


                        <Form.Item
                            name={"notes"}
                            label={"Catatan"}
                            className='mt-3'
                        >
                            <textarea className="text-sm p-3 block w-full border-0 bg-gray-50 rounded shadow-sm text-black placeholder-gray-300">

                            </textarea>
                        </Form.Item>
                    </Form>
                    <div className="flex space-x-3">
                        <button className="flex-1 bg-red-500 text-white py-3 rounded font-semibold"
                            onClick={handleCancelDisposition}
                        >
                            Batal
                        </button>

                        <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold"
                            onClick={() => {
                                FormDisposition.submit()
                            }}
                        >
                            Simpan
                        </button>
                    </div>
                </Modal>


                <Modal
                    open={isModalForwardOpen}
                    title={
                        <div
                            style={{
                                width: '100%',
                                cursor: 'move',
                            }}
                            onMouseOver={() => {
                                if (disabled) {
                                    setDisabled(false);
                                }
                            }}
                            onMouseOut={() => {
                                setDisabled(true);
                            }}
                            onFocus={() => { }}
                            onBlur={() => { }}
                        >
                            <h2 className="text-gray-700 text-lg font-semibold">
                                Alihkan
                            </h2>
                        </div>
                    }
                    maskClosable={false}
                    footer={false}
                    onCancel={handleCancelForward}
                    modalRender={(modal) => (
                        <Draggable
                            disabled={disabled}
                            bounds={bounds}
                            nodeRef={draggleRef}
                            onStart={(event, uiData) => onStart(event, uiData)}
                        >
                            <div ref={draggleRef}>{modal}</div>
                        </Draggable>
                    )}
                >
                    <Form
                        form={FormForward}
                        layout='vertical'
                        onFinish={() => {
                            handleMessageEvent(FormForward, 2)
                        }}
                    >
                        <Form.Item
                            name={"ListUserUID"}
                            label={"Dialihkan ke"}
                            rules={[{ required: true, message: 'Please input forward to' }]}

                        >
                            <Select
                                mode="multiple"
                                labelInValue={true}
                                options={dataUser?.map((record) => {
                                    return {
                                        value: record.UID,
                                        label: record.Name + " | " + (GetPositionName(record.PositionID) + " " + record.Organization?.Name)
                                    }
                                })}
                                className="mb-3"
                            />
                        </Form.Item>

                        <Form.Item
                            name={"Notes"}
                            label={"Catatan"}
                            className='mt-3'
                        >
                            <textarea className="text-sm p-3 block w-full border-0 bg-gray-50 rounded shadow-sm text-black placeholder-gray-300">

                            </textarea>
                        </Form.Item>
                    </Form>
                    <div className="flex space-x-3">
                        <button className="flex-1 bg-red-500 text-white py-3 rounded font-semibold"
                            onClick={handleCancelForward}
                        >
                            Batal
                        </button>

                        <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold"
                            onClick={() => {
                                FormForward.submit()
                            }}
                        >
                            Simpan
                        </button>
                    </div>
                </Modal>


                <Modal
                    open={isModalSubmitOpen}
                    title={
                        <div
                            style={{
                                width: '100%',
                                cursor: 'move',
                            }}
                            onMouseOver={() => {
                                if (disabled) {
                                    setDisabled(false);
                                }
                            }}
                            onMouseOut={() => {
                                setDisabled(true);
                            }}
                            onFocus={() => { }}
                            onBlur={() => { }}
                        >
                            <h2 className="text-gray-700 text-lg font-semibold">
                                Submit
                            </h2>
                        </div>
                    }
                    maskClosable={false}
                    footer={false}
                    onCancel={handleCancelSubmit}
                    modalRender={(modal) => (
                        <Draggable
                            disabled={disabled}
                            bounds={bounds}
                            nodeRef={draggleRef}
                            onStart={(event, uiData) => onStart(event, uiData)}
                        >
                            <div ref={draggleRef}>{modal}</div>
                        </Draggable>
                    )}
                >
                    <Form
                        form={FormSubmit}
                        layout='vertical'
                        onFinish={() => {
                            handleMessageEvent(FormSubmit, 3)
                        }}
                    >

                        <Form.Item
                            name={"Notes"}
                            label={"Catatan"}
                            className='mt-3'
                        >
                            <textarea className="text-sm p-3 block w-full border-0 bg-gray-50 rounded shadow-sm text-black placeholder-gray-300">

                            </textarea>
                        </Form.Item>
                    </Form>
                    <div className="flex space-x-3">
                        <button className="flex-1 bg-red-500 text-white py-3 rounded font-semibold"
                            onClick={handleCancelSubmit}
                        >
                            Batal
                        </button>

                        <button className="flex-1 bg-green-500 text-white py-3 rounded font-semibold"
                            onClick={() => {
                                FormSubmit.submit()
                            }}
                        >
                            Simpan
                        </button>
                    </div>
                </Modal>
            </Spin>
        </main >
    )
}