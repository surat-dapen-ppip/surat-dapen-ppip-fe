/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { useEffect, useRef, useState } from 'react'
import { Button, Form, Modal, Select, Table, Tabs, DatePicker, message, Space, Input, Spin, Row, Col } from 'antd';
import { MdClear, MdDownload, MdInsertDriveFile, MdOutlineAltRoute, MdOutlineDocumentScanner, MdOutlineKeyboardReturn, MdVisibility } from 'react-icons/md';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import moment from 'moment'
import CryptoJS from 'crypto-js';

import { getMessageByUid, updateMessageProccessed } from '@/services/message';
import { getUsers } from '@/services/users';
import { GetEventIDName, GetPositionName, GetSubmitIDName, formatCurrentWIBTimestamp } from '@/utils/utility';
import { getNatures } from '@/services/natures';
import { getPriorities } from '@/services/priorities';
import { createMessageEvent, getMessageEvents } from '@/services/messageEvent';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getMediaByUid } from '@/services/media';
import Draggable from 'react-draggable';
import { useLayoutContext } from '@/hooks/useLayoutContext';
import PdfPreviewModal from '@/components/PdfPreviewModal';
import '../suratMasuk/suratMasuk.css';

import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const isPdfFile = (name) => typeof name === 'string' && name.toLowerCase().endsWith('.pdf');


export default function pageDetailSuratMasuk() {
    const router = useRouter()
    const [UID, setUID] = useState("");
    const API_URL = process.env.NEXT_PUBLIC_PUBLIC_URL
    const { fetchCount } = useLayoutContext();

    const [FormMessage] = Form.useForm()
    const [FormDisposition] = Form.useForm()
    const [FormForward] = Form.useForm()
    const [FormSubmit] = Form.useForm()

    const [isModalAccOpen, setIsModalAccOpen] = useState(false)
    const [isModalRejectOpen, setIsModalRejectOpen] = useState(false)
    const [isModalDispositionOpen, setIsModalDispositionOpen] = useState(false)
    const [isModalForwardOpen, setIsModalForwardOpen] = useState(false)
    const [isModalSubmitOpen, setIsModalSubmitOpen] = useState(false)

    const [dataMessage, setDataMessage] = useState("")
    const [dataMedia, setDataMedia] = useState(null)
    const [dataMessageEvent, setDataMessageEvent] = useState([])
    const [dataUser, setDataUser] = useState([])
    const [dataNature, setDataNature] = useState([])
    const [dataPriority, setDataPriority] = useState([])

    const [downloading, setDownloading] = useState(false)
    const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
    const [watermarkedPdfUrl, setWatermarkedPdfUrl] = useState(null);

    // Lampiran state (MessageContentMediaUID - additional attachments)
    const [lampiranMediaList, setLampiranMediaList] = useState([])
    const [downloadingStates, setDownloadingStates] = useState({})
    const [previewMedia, setPreviewMedia] = useState(null)

    const handlePreviewLampiran = (mediaUID, fileName) => {
        setPreviewMedia({ uid: mediaUID, name: fileName });
    };

    const handleClosePreviewLampiran = () => setPreviewMedia(null);

    const handleDownloadLampiran = async (mediaUID, fileName) => {
        if (typeof window === 'undefined') return;
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

    const fetchLampiranMediaList = async (listMedia) => {
        if (!listMedia || listMedia === "") {
            setLampiranMediaList([]);
            return;
        }

        try {
            const mediaUIDs = listMedia.split(',').filter(uid => uid.trim() !== '');

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
            setLampiranMediaList(validMedia);
        } catch (error) {
            console.error('Error fetching lampiran media list:', error);
            setLampiranMediaList([]);
        }
    };


    const [disabled, setDisabled] = useState(true);
    const [bounds, setBounds] = useState({
        left: 0,
        top: 0,
        bottom: 0,
        right: 0,
    });
    const draggleRef = useRef(null);

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


    const fetchPdf = async () => {
        try {
            if (typeof window !== 'undefined') {
                setDownloading(true);
                const response = await axios.get(API_URL + "/mediaS3/" + dataMessage?.ListMedia, {
                    responseType: 'blob',
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                setPdfBlobUrl(url);

                const fontUrl = 'https://pdf-lib.js.org/assets/ubuntu/Ubuntu-R.ttf';
                const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());
                const pdfBytes = await response.data.arrayBuffer();

                // Load the PDF
                const pdfDoc = await PDFDocument.load(pdfBytes);
                pdfDoc.registerFontkit(fontkit);

                // Embed the custom font
                const customFont = await pdfDoc.embedFont(fontBytes);

                // Add watermark to each page
                const pages = pdfDoc.getPages();
                const textSize = 10; // Font size for the text
                const borderPadding = 10; // Padding inside the border box

                const username = window.localStorage.getItem('Name');
                const downloadTimestamp = formatCurrentWIBTimestamp();

                const watermarkText = [
                    "",
                    "Dana Pensiun PPIP - PUSRI",
                    "Downloaded by:",
                    username || '-',
                    "Downloaded at:",
                    downloadTimestamp,
                ];

                pages.forEach((page) => {
                    const { width, height } = page.getSize();

                    // Determine the size of the text box
                    const boxWidth = 200;
                    const boxHeight = watermarkText.length * (textSize + 5) + borderPadding * 2;

                    const boxX = 100;
                    const boxY = height - boxHeight - 100;

                    // Draw the border box
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
                        y: boxY + boxHeight - borderPadding - textSize,
                        size: 12,
                        font: customFont,
                        color: rgb(1, 0, 0),
                        opacity: 0.4,
                        rotate: degrees(5)
                    });

                    // Add the watermark text inside the box
                    watermarkText.forEach((line, index) => {
                        page.drawText(line, {
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

                setWatermarkedPdfUrl(modifiedPdfUrl);
            }
        } catch (error) {
            console.error('Error downloading file:', error);
        }
        setDownloading(false);
    };



    const fetchMessage = async (uid) => {
        const response = await getMessageByUid(uid)
        if (response) {
            setDataMessage(response.data)
        }
        return response.data
    }

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

    const fetchMessageEvent = async (uid) => {
        const response = await getMessageEvents(uid)
        if (response) {
            setDataMessageEvent(response.data)
        }
    }

    const fetchMedia = async () => {
        const response = await getMediaByUid(dataMessage?.ListMedia)
        if (response) {
            setDataMedia(response.data)
        }
    }

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

    const handleDownload = () => {
        if (typeof window !== 'undefined') {
            if (watermarkedPdfUrl) {
                const link = document.createElement('a');
                link.href = watermarkedPdfUrl;
                link.setAttribute('download', dataMedia.Name);
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
            }
        }
    };

    const [loadingSubmit, setLoadingSubmit] = useState(false)
    const handleMessageEvent = async (FormEvent, eventID) => {

        if (typeof window !== 'undefined') {
            setLoadingSubmit(true); // Start loading spinner

            setIsModalDispositionOpen(false)
            setIsModalAccOpen(false)
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

    useEffect(() => {
        fetchUser()
        fetchNature()
        fetchPriority()

        if (typeof window !== 'undefined') {
            // Access query parameters from the URL
            const urlParams = new URLSearchParams(window.location.search);
            const uid = urlParams.get('uid');

            const handleMessage = async () => {
                const data = await fetchMessage(uid)
                FormMessage.setFieldValue('EventNumber', data.EventNumberMasuk)
                FormMessage.setFieldValue('EventNumberSub', data.EventNumberSubMasuk)
                FormMessage.setFieldValue('Date', moment(data.Date))
                FormMessage.setFieldValue('NatureUID', data.NatureUID)
                FormMessage.setFieldValue('MessageNumberMasuk', data.MessageNumberMasuk)
                FormMessage.setFieldValue('ExternalSender', data.ExternalSender)
                FormMessage.setFieldValue('PriorityUID', data.PriorityUID)
                FormMessage.setFieldValue('Title', data.Title)
                FormMessage.setFieldValue('RecipientUID', data.RecipientUID?.split(","))
                FormMessage.setFieldValue('Information', data.Information)
            }

            fetchMessageEvent(uid)

            handleMessage()
            setUID(uid)
        }
    }, [])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (dataMessage?.ListMedia != "") {
                fetchMedia()
                fetchPdf();
            } else {
                setDataMedia(null)
                setPdfBlobUrl(null)
            }

            // Fetch lampiran (MessageContentMediaUID) list whenever dataMessage changes
            fetchLampiranMediaList(dataMessage?.MessageContentMediaUID)
        }

    }, [dataMessage]);


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

            setIsModalAccOpen(false)
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
                <div className="w-full max-w-7xl">
                    <div className="p-4 md:p-6 bg-white shadow-sm rounded mt-3">
                        <h2 className="text-md font-semibold mb-5 text-gray-700">Detail Surat</h2>
                        <hr className="mb-8 bg-gray-300"></hr>
                        <Form
                            form={FormMessage}
                            layout='horizontal'
                            labelCol={{ span: 5 }}
                            className="responsive-form"
                            colon={false}
                        >
                            {/* No. Agenda and Tanggal */}
                            <Row gutter={[24, 16]}>
                                <Col xs={24} md={12}>
                                    <Space.Compact>
                                        <Form.Item
                                            label={"No. Agenda"}
                                            name={"EventNumber"}
                                            labelCol={{ span: 11 }}
                                        >
                                            <input
                                                type="number"
                                                placeholder="No Agenda"
                                                className="text-sm p-3 block w-full border-0 bg-gray-50 rounded text-black placeholder-gray-300 w-full"
                                                disabled
                                            />
                                        </Form.Item>
                                        <Form.Item
                                            name={"EventNumberSub"}
                                        >
                                            <input
                                                type="text"
                                                placeholder="Sub No."
                                                className="text-sm p-3 block w-full border-0 bg-gray-50 rounded text-black placeholder-gray-300 w-full"
                                                disabled
                                            />
                                        </Form.Item>
                                    </Space.Compact>

                                </Col>

                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label={"Tanggal Surat"}
                                        name={"Date"}
                                    >
                                        <DatePicker disabled className="w-full single" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            {/* No. Surat and Sifat Surat */}
                            <Row gutter={[24, 16]}>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="No. Surat"
                                        name={"MessageNumber"}
                                    >
                                        <input
                                            disabled
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
                                    >
                                        <Select
                                            disabled
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
                                    >
                                        <input
                                            disabled
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
                                    >
                                        <Select
                                            disabled
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
                                    >
                                        <input
                                            disabled
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
                                    >
                                        <Select
                                            disabled
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
                                            disabled
                                            type="text"
                                            placeholder="Input Keterangan Surat"
                                            className="text-sm p-3 border-0 bg-gray-50 rounded text-black placeholder-gray-300 w-full"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}></Col>
                            </Row>
                        </Form>
                    </div>


                    <div className="p-4 md:p-6 bg-white shadow-sm rounded mt-5">
                        {/* <CustomEditor /> */}
                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                <div>
                                    {pdfBlobUrl ? (
                                        <>
                                            <button
                                                className={'p-3 text-sm font-semibold ' + (downloading ? "bg-gray-100 text-gray-300" : "bg-blue-100")}
                                                onClick={handleDownload}
                                                disabled={downloading}
                                            >
                                                {downloading ? "Downloading..." : "Download Lampiran"}
                                            </button>
                                            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                                                <div
                                                    style={{
                                                        border: '1px solid rgba(0, 0, 0, 0.3)',
                                                        height: '750px',
                                                    }}
                                                >
                                                    <Viewer fileUrl={pdfBlobUrl} />
                                                </div>
                                            </Worker>
                                        </>
                                    ) : (
                                        <p>{dataMedia == null ? (<>Tidak ada lampiran</>) : (<>Loading File....</>)}</p>
                                    )}
                                </div>
                            </Col>
                            <Col xs={24} md={12}></Col>
                        </Row>
                    </div>

                    {/* Lampiran Section (MessageContentMediaUID) */}
                    <div className="p-4 md:p-6 bg-white shadow-sm rounded mt-5">
                        <h3 className="text-md font-semibold mb-3 text-gray-700">Lampiran</h3>
                        <hr className="mb-5 bg-gray-300"></hr>
                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                {lampiranMediaList.length > 0 ? (
                                    <div className="space-y-2">
                                        {lampiranMediaList.map((media, index) => (
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
                                                            File {index + 1} dari {lampiranMediaList.length}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 flex-shrink-0">
                                                    {isPdfFile(media.Name) && (
                                                        <Button
                                                            icon={<MdVisibility />}
                                                            onClick={() => handlePreviewLampiran(media.UID, media.Name)}
                                                            size="small"
                                                        >
                                                            Preview
                                                        </Button>
                                                    )}
                                                    <Button
                                                        type="primary"
                                                        icon={<MdDownload />}
                                                        onClick={() => handleDownloadLampiran(media.UID, media.Name)}
                                                        loading={downloadingStates[media.UID]}
                                                        disabled={downloadingStates[media.UID]}
                                                        size="small"
                                                    >
                                                        {downloadingStates[media.UID] ? 'Downloading...' : 'Download'}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Tidak ada lampiran</p>
                                )}
                            </Col>
                            <Col xs={24} md={12}></Col>
                        </Row>
                    </div>
                </div>
            ),
        },
        {
            key: '2',
            label: (
                <h2 className="text-lg font-semibold text-gray-700">Tindak Lanjut</h2>
            ),
            children: (
                <div className="p-4 md:p-6 bg-white shadow-sm rounded mt-3 w-full max-w-7xl">

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
            children: <div className="p-4 md:p-6 bg-white shadow-sm rounded mt-3 w-full max-w-7xl">

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
    ];


    return (
        <main>
            <Spin spinning={loadingSubmit} tip="Sedang memproses, mohon tunggu...">
                <div className="p-3 bg-white shadow-sm rounded flex-col space-y-5 w-auto fixed top-1/2 -translate-y-1/2 right-0 shadow-lg z-50">
                    {/* <div className="bg-white flex items-center flex-col p-2 font-semibold rounded border border-green-400 hover:bg-green-100 text-green-400 cursor-pointer shadow-md"
                    onClick={handleAcc}
                >
                    <MdCheck className="mb-2 text-sm" />
                    <div className="text-xs">
                        Terima
                    </div>
                </div> */}

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

            <PdfPreviewModal
                open={!!previewMedia}
                onClose={handleClosePreviewLampiran}
                mediaUid={previewMedia?.uid}
                filename={previewMedia?.name}
            />

        </main >
    )
}