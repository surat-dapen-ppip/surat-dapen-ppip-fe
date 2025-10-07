/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { Button, DatePicker, Form, Input, message, Modal, Select, Space, Spin, Upload } from 'antd';
import { MdArrowBack, MdCheck, MdClear, MdDrafts, MdOutlineAltRoute, MdOutlineDocumentScanner, MdOutlineKeyboardReturn, MdUpload } from 'react-icons/md';
import { Suspense, useEffect, useState } from 'react';
import { getTemplateNameSurat, getTemplateSuratByUid, getTypeNameSurat } from '@/services/messageTemplate';
import { getNatures } from '@/services/natures';
import { getPriorities } from '@/services/priorities';
import dynamic from 'next/dynamic';
import { useLayoutContext } from '@/hooks/useLayoutContext';
import { GetCurrentDateInISOFormat, GetPositionName } from '@/utils/utility';
import { approveMessage, createMessage, getMessageByUid, updateMessage } from '@/services/message';
import { getUsers } from '@/services/users';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import moment from 'moment';
import { createMessageRevision } from '@/services/messageRevision';
import { getMediaByUid } from '@/services/media';

import { Viewer, Worker } from '@react-pdf-viewer/core';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export default function pageDraft() {
    const router = useRouter()
    const [UID, setUID] = useState("");
    const [dataMessage, setDataMessage] = useState()

    const { role, recipientUID, name, fetchCount } = useLayoutContext();
    const [FormMessage] = Form.useForm()


    const fetchMessage = async (uid) => {
        const response = await getMessageByUid(uid)
        if (response) {
            setDataMessage(response.data)
        }
        return response.data
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

    const handleFinishSubmission = async () => {
        // do nothing
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
    const [watermarkedPdfUrl, setWatermarkedPdfUrl] = useState(null);

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

    const fetchMedia = async () => {
        const response = await getMediaByUid(dataMessage?.ArchivedMediaUID)
        if (response) {
            setDataMedia(response.data)
        }
    }

    const fetchPdf = async () => {
        try {
            if (typeof window !== 'undefined') {
                setDownloading(true);
                const response = await axios.get(API_URL + "/mediaS3/" + dataMessage?.ArchivedMediaUID, {
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

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (dataMessage?.ArchivedMediaUID != "") {
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


                const selectedReviewer = optionUser.find(option => option.value === data.ReviewerUID);
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
                Lihat Surat
            </h2>

            <Spin spinning={loadingSubmit} tip="Sedang memproses, mohon tunggu...">
                <div class="p-6 bg-white shadow-sm rounded mt-5"
                    style={{
                        width: '93%'
                    }}
                >
                    <h2 className="text-md font-semibold mb-5 text-gray-700">Detail Surat</h2>
                    <hr className="mb-8 bg-gray-300"></hr>
                    <Form
                        layout='horizontal'
                        labelCol={{ span: 7 }}
                        colon={false}
                        form={FormMessage}
                        onFinish={handleFinishSubmission}
                    >
                        <div className="grid grid-cols-2 gap-20">
                            <Space.Compact>
                                <Form.Item
                                    label={"No. Agenda"}
                                    name={"EventNumber"}
                                    labelCol={{ span: 11 }}
                                    rules={[{ required: true, message: 'No Agenda' }]}
                                >
                                    <Input
                                        type="number"
                                        placeholder="No Agenda"
                                        className="text-sm p-3 block w-full border-0 bg-gray-50 rounded text-black placeholder-gray-300 w-full"
                                        disabled
                                    />
                                </Form.Item>
                                <Form.Item
                                    name={"EventNumberSub"}
                                >
                                    <Input
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
                                        fetchTemplateName(value);
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
                            <Input
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
                                labelInValue
                                options={dataUser?.map((record) => {
                                    return {
                                        value: record.UID,
                                        label: record.Name + " | " + (GetPositionName(record.PositionID) + " " + record.Organization?.Name)
                                    }
                                })}
                                className="mb-3 ml-2 single"
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
                            <Input
                                type="text"
                                placeholder="Input Keterangan Surat"
                                className="text-sm p-3 border-0 bg-gray-50 rounded  text-black placeholder-gray-300 w-full ml-2"
                                disabled
                            />
                        </Form.Item>
                    </Form>
                </div>

                <div class="p-6 bg-white shadow-sm rounded mt-5">
                    {/* <CustomEditor /> */}
                    <div className="p-6 bg-white shadow-sm rounded mt-5">
                        {pdfBlobUrl ? (
                            <>
                                <button
                                    className={'p-3 text-sm font-semibold ' + (downloading ? "bg-gray-100 text-gray-300" : "bg-blue-100")}
                                    onClick={handleDownload}
                                    disabled={downloading}
                                >
                                    {downloading ? "Downloading..." : "Download Arsip Surat Keluar "}
                                </button>
                                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                                    <div style={{ height: '750px' }}>
                                        <Viewer fileUrl={pdfBlobUrl} />
                                    </div>
                                </Worker>
                            </>
                        ) : (
                            <p>{dataMedia == null ? (<>Tidak ada</>) : (<>Loading File....</>)}</p>
                        )}
                    </div>
                </div>
            </Spin>
        </main >
    )
}