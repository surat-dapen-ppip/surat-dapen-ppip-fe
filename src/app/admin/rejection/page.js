/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { Col, Form, Modal, Row, Select, Space, Spin } from 'antd';
import { MdArrowBack } from 'react-icons/md';
import { Suspense, useEffect, useState } from 'react';
import { getTemplateNameSurat, getTemplateSuratByUid, getTypeNameSurat } from '@/services/messageTemplate';
import { getNatures } from '@/services/natures';
import { getPriorities } from '@/services/priorities';
import dynamic from 'next/dynamic';
import { useLayoutContext } from '@/hooks/useLayoutContext';
import { GetCurrentDateInISOFormat, GetPositionName } from '@/utils/utility';
import { getUsers } from '@/services/users';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import moment from 'moment';
import { getMessageRejection } from '@/services/messageRejection';
import { getMediaByUid } from '@/services/media';
import { getMessageByUid } from '@/services/message';

const RichEditReadOnlyComponent = dynamic(() => import('@/components/richEditReadOnly'), { ssr: false });


export default function pageRejection() {
    const router = useRouter()
    const [UID, setUID] = useState("");
    const [dataMessage, setDataMessage] = useState()
    const [dataMessageRejection, setDataMessageRejection] = useState([])

    const { role, recipientUID, name, fetchCount } = useLayoutContext();
    const [FormMessage] = Form.useForm()
    const [messageClassification, setMessageClassification] = useState()

    const [isModalResetOpen, setIsModalResetOpen] = useState(false)
    const [isModalSubmitOpen, setIsModalSubmitOpen] = useState(false)

    const handleReset = () => { setIsModalResetOpen(true) }
    const handleSubmit = () => { setIsModalSubmitOpen(true) }

    const handleCancelReset = () => { setIsModalResetOpen(false) }
    const handleCancelSubmit = () => { setIsModalSubmitOpen(false) }

    const handleConfirmReset = () => {
        router.push("/admin/daftarSurat")
    }

    const handleConfirmSubmit = () => {
        setMessageStatus(41)
        setTimeout(() => {
            FormMessage.submit()
        }, 300)
        setIsModalSubmitOpen(false)
    }


    const fetchMessage = async (uid) => {
        const response = await getMessageByUid(uid)
        if (response) {
            setDataMessage(response.data)
            setMessageClassification(response.data.MessageClassification)
        }
        return response.data
    }

    const fetchMessageRejection = async (uid) => {
        const response = await getMessageRejection(uid)
        if (response) {
            setDataMessageRejection(response.data)
        }
        return response.data
    }

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
        if (response) {
            setMessageClassification(response.data.MessageClassification)
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
        fetchNature()
        fetchPriority()
        fetchUser()


        if (typeof window !== 'undefined') {
            // Access query parameters from the URL
            const urlParams = new URLSearchParams(window.location.search);
            const uid = urlParams.get('uid');

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
                }else{
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


                const selectedReviewer = optionUser.filter(option => data.ReviewerUID?.split(",").includes(option.value));
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

                fetchTemplateName(data.TypeUID, data.MessageClassification)

            }


            fetchMessageRejection(uid)
            handleMessage()
            setUID(uid)
        }
    }, [])



    return (
        <main>
            <div class="flex p-3 bg-white shadow-sm rounded flex-col space-y-5 w-auto fixed top-1/2 -translate-y-1/2 right-0 shadow-lg z-50">
                <div className="bg-white flex items-center flex-col p-2 font-semibold rounded border border-blue-400 hover:bg-blue-100 text-blue-400 cursor-pointer shadow-md"
                    onClick={handleReset}
                >
                    <MdArrowBack className="mb-2 text-sm" />
                    <div className="text-xs">
                        Kembali
                    </div>
                </div>
            </div>

            <h2 className="text-xl text-gray-700 font-semibold">
                Surat ditolak
            </h2>

            <Spin spinning={false} tip="Sedang memproses, mohon tunggu...">

                <Row gutter={30}>
                    <Col lg={18}>
                        <div class="p-6 bg-white shadow-sm rounded mt-5"
                            style={{
                                width: '100%'
                            }}
                        >
                            <h2 className="text-md font-semibold mb-5 text-gray-700">Detail Surat</h2>
                            <hr className="mb-8 bg-gray-300"></hr>
                            <Form
                                layout='horizontal'
                                labelCol={{ span: 7 }}
                                colon={false}
                                form={FormMessage}
                            >

                                <div className="grid grid-cols-2 gap-20">
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
                                </div>

                                {/* No. Agenda and Tanggal */}
                                <div className="grid grid-cols-2 gap-20">
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
                                            disabled
                                        />
                                    </Form.Item>

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
                                </div>

                                {/* No. Surat and Sifat Surat */}
                                <div className="grid grid-cols-2 gap-20">
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
                                </div>


                                {/* Judul */}
                                <Form.Item
                                    label="Judul Surat"
                                    labelCol={{ span: 3 }}
                                    name={"Title"}
                                    rules={[{ required: true, message: 'Tolong masukan Judul Surat' }]}
                                >
                                    <input
                                        type="text"
                                        placeholder="Input Judul Surat Masuk"
                                        className="text-sm p-3 border-0 bg-gray-50 rounded  text-black placeholder-gray-300 w-full ml-2"
                                        disabled
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Reviewer Surat"
                                    labelCol={{ span: 3 }}
                                    name={"ReviewerObject"}
                                    rules={[{ required: true, message: 'Tolong masukan Reviewer Surat' }]}
                                >
                                    <Select
                                        mode='multiple'
                                        labelInValue
                                        options={dataUser?.map((record) => {
                                            return {
                                                value: record.UID,
                                                label: record.Name + " | " + (GetPositionName(record.PositionID) + " " + record.Organization?.Name)
                                            }
                                        })}
                                        disabled
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Approver Surat"
                                    labelCol={{ span: 3 }}
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
                                        className="mb-3  ml-2 single"
                                        disabled
                                    />
                                </Form.Item>


                                {/* Tujuan */}
                                <Form.Item
                                    label="Tujuan Surat"
                                    labelCol={{ span: 3 }}
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
                                        className="mb-3  ml-2"
                                        disabled
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="CC Surat"
                                    labelCol={{ span: 3 }}
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
                                        className="mb-3  ml-2"
                                        disabled
                                    />
                                </Form.Item>



                                {/* Keterangan */}
                                <Form.Item
                                    label={"Keterangan"}
                                    labelCol={{ span: 3 }}
                                    name={"Information"}
                                >
                                    <input
                                        type="text"
                                        placeholder="Input Keterangan Surat"
                                        className="text-sm p-3 border-0 bg-gray-50 rounded  text-black placeholder-gray-300 w-full ml-2"
                                        disabled
                                    />
                                </Form.Item>
                            </Form>

                            <div className='ml-3'>
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




                        <div class="p-6 bg-white shadow-sm rounded mt-5">
                            <Suspense fallback={<div>Loading...</div>}>
                                 <RichEditReadOnlyComponent
                                    currentDocument={currentDocument}
                                    setCurrentDocument={setCurrentDocument}
                                />
                            </Suspense>
                        </div>
                    </Col>
                    <Col lg={6}>
                        <div className='font-semibold text-lg mt-4'>
                            Catatan
                        </div>
                        {dataMessageRejection?.map((record) => (
                            <div className='bg-white rounded p-3 mt-3 text-xs ' key={record.UID}>
                                <div>
                                    <table>
                                        <tr>
                                            <td className='font-semibold'>Dari</td>
                                            <td className='px-3'>:</td>
                                            <td>{record.FromUserName}</td>
                                        </tr>
                                        <tr>
                                            <td className='font-semibold'>Tanggal</td>
                                            <td className='px-3'>:</td>
                                            <td>{moment(record.Date).format('YYYY-MM-DD')}</td>
                                        </tr>
                                        <tr>
                                            <td className='font-semibold'>Pesan</td>
                                            <td className='px-3'>:</td>
                                            <td>{record.Content}</td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </Col>
                </Row>


                <Modal
                    open={isModalSubmitOpen}
                    title="Submit Revisi"
                    footer={false}
                    onCancel={handleCancelSubmit}
                    maskClosable={false}
                >
                    <div className='font-semibold text-gray-700 mb-5 mt-5'>
                        Apakah anda yakin untuk mengirim surat yang telah direvisi  ?
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
                    title="Kembali"
                    footer={false}
                    onCancel={handleCancelReset}
                    maskClosable={false}
                >
                    <div className='font-semibold text-gray-700 mb-5 mt-5'>
                        Apakah anda yakin untuk kembali ke Daftar Surat ?
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
            </Spin>
        </main >
    )
}