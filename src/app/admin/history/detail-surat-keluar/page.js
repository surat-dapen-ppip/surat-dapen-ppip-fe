/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { Form, Select, Table, Tabs, Row, Col } from 'antd';
import { Suspense, useEffect, useState } from 'react';
import { getTemplateNameSurat, getTemplateSuratByUid, getTypeNameSurat } from '@/services/messageTemplate';
import { getNatures } from '@/services/natures';
import { getPriorities } from '@/services/priorities';
import dynamic from 'next/dynamic';
import { GetEventIDName, GetPositionName, GetSubmitIDName } from '@/utils/utility';
import { getMessageByUid, } from '@/services/message';
import { getUsers } from '@/services/users';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import moment from 'moment';
import { getMediaByUid } from '@/services/media';
import { getMessageEvents } from '@/services/messageEvent';

const RichEditReadOnlyComponent = dynamic(() => import('@/components/richEditReadOnly'), { ssr: false });

export default function pageDetailSuratKeluar() {
    const router = useRouter()
    const [UID, setUID] = useState("");
    const [dataMessage, setDataMessage] = useState()
    const [dataMessageEvent, setDataMessageEvent] = useState([])
    const [dataUser, setDataUser] = useState([])

    const [FormMessage] = Form.useForm()

    const [currentDocument, setCurrentDocument] = useState("")

    const [optionType, setOptionType] = useState([])
    const [optionTemplate, setOptionTemplate] = useState([])
    const [optionNature, setOptionNature] = useState([])
    const [optionPriority, setOptionPriority] = useState([])

    const API_URL = process.env.NEXT_PUBLIC_PUBLIC_URL
    const [dataMedia, setDataMedia] = useState()
    const [downloading, setDownloading] = useState(false)
    const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

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
                const responseTemplateName = await getTemplateNameSurat(data.TypeUID)

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
            <Tabs defaultActiveKey="1" items={tabsContent} size="lg" />
        </main >
    )
}