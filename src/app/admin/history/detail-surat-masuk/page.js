/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { useEffect, useRef, useState } from 'react'
import { Form, Select, Table, Tabs, DatePicker, message, Row, Col } from 'antd';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import moment from 'moment'


import { Viewer, Worker } from '@react-pdf-viewer/core';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { getMessageByUid, updateMessageProccessed } from '@/services/message';
import { getUsers } from '@/services/users';
import { GetEventIDName, GetPositionName, GetSubmitIDName } from '@/utils/utility';
import { getNatures } from '@/services/natures';
import { getPriorities } from '@/services/priorities';
import { createMessageEvent, getMessageEvents } from '@/services/messageEvent';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getMediaByUid } from '@/services/media';
import Draggable from 'react-draggable';


export default function pageDetailSuratMasuk() {
    const router = useRouter()
    const [UID, setUID] = useState("");
    const API_URL = process.env.NEXT_PUBLIC_PUBLIC_URL

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

                const username = window.localStorage.getItem('Name')


                const watermarkText = [
                    "",
                    "PT DAPEN PPIP",
                    "Downloaded by:",
                    username,
                ];

                pages.forEach((page) => {
                    const { width, height } = page.getSize();

                    // Determine the size of the text box
                    const boxWidth = 200;
                    const boxHeight = watermarkText.length * (textSize + 5) + borderPadding * 2;

                    const boxX = 100;
                    const boxY = height - 100;

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
                        y: boxY + boxHeight - borderPadding - textSize * (0 + 1),
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

    const handleAcc = () => { setIsModalAccOpen(true) }
    const handleReject = () => { setIsModalRejectOpen(true) }
    const handleDisposition = () => { setIsModalDispositionOpen(true) }
    const handleForward = () => { setIsModalForwardOpen(true) }
    const handleSubmit = () => { setIsModalSubmitOpen(true) }

    const handleCancelAcc = () => { setIsModalAccOpen(false) }
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
        if(typeof window !== 'undefined'){
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

    const handleMessageEvent = async (FormEvent, eventID) => {

        if (typeof window !== 'undefined') {
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
                FormMessage.setFieldValue('MessageNumber', data.MessageNumberMasuk)
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
        }

    }, [dataMessage]);

    const handleFinishAcc = async () => {
        if (typeof window !== 'undefined') {
            let data = {}
            data.EventID = 4
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
                <div className="w-[90%]">
                    <div className="p-6 bg-white shadow-sm rounded mt-3">
                        <Form
                            form={FormMessage}
                            layout='horizontal'
                            labelCol={{ span: 5 }}
                            colon={false}
                        >
                            {/* No. Agenda and Tanggal */}
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
                                    <Row>
                                        <Col span={12}>
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
                                        <Col span={12}>
                                            <Form.Item
                                                label={"Tanggal Surat"}
                                                name={"Date"}
                                            >
                                                <DatePicker disabled className="w-full single" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
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
                                            placeholder="Input Judul Surat"
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
                                            disabled
                                            type="text"
                                            placeholder="Input Keterangan"
                                            className="text-sm p-3 border-0 bg-gray-50 rounded text-black placeholder-gray-300 w-full"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}></Col>
                            </Row>
                        </Form>
                    </div>


                    <div className="p-6 bg-white shadow-sm rounded mt-5 w-[90%]">
                        {/* <CustomEditor /> */}
                        <div className="p-6 bg-white shadow-sm rounded mt-5">
                            {pdfBlobUrl ? (
                                <>
                                    <button
                                        className={'p-3 text-sm font-semibold ' + (downloading ? "bg-gray-100 text-gray-300" : "bg-blue-100")}
                                        onClick={handleDownload}
                                        disabled={downloading}
                                    >
                                        {downloading ? "Downloading..." : "Download Lampiran"}
                                    </button>
                                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                                        <div style={{ height: '750px' }}>
                                            <Viewer fileUrl={pdfBlobUrl} />
                                        </div>
                                    </Worker>
                                </>
                            ) : (
                                <p>{dataMedia == null ? (<>Tidak ada lampiran</>) : (<>Loading File....</>)}</p>
                            )}
                        </div>
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
    ];


    return (
        <main>
            <Tabs defaultActiveKey="1" items={tabsContent} size="lg" />
        </main >
    )
}