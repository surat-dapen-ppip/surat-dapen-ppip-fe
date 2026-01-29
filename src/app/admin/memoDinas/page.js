/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { Button, DatePicker, Form, message, Modal, Select, Space, Spin, Upload, Row, Col } from 'antd';
import { MdCheck, MdClear, MdDrafts, MdOutlineAltRoute, MdOutlineDocumentScanner, MdOutlineKeyboardReturn, MdUpload } from 'react-icons/md';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { getTemplateNameSurat, getTemplateSuratByUid, getTypeNameSurat } from '@/services/messageTemplate';
import { getNatures } from '@/services/natures';
import { getPriorities } from '@/services/priorities';
import dynamic from 'next/dynamic';
import { useLayoutContext } from '@/hooks/useLayoutContext';
import { GetCurrentDateInISOFormat, GetPositionName } from '@/utils/utility';
import { checkMessageAvailability, createMessage, getMessageCounter } from '@/services/message';
import { getUsers } from '@/services/users';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { debounce } from 'lodash';
const RichEditComponent = dynamic(() => import('@/components/richEditor'), { ssr: false });

export default function pageMemoDinas() {
    const router = useRouter()
    const { role, recipientUID, name, fetchCount } = useLayoutContext();
    const [FormMessage] = Form.useForm()
    const [messageClassification, setMessageClassification] = useState(2)

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
        if (loadingSubmit) {
            return
        }
        setLoadingSubmit(true)
        FormMessage.resetFields()
        setCurrentDocument("")
        setTriggerReset(!triggerReset)
        setIsModalResetOpen(false)
        setTimeout(() => {
            setLoadingSubmit(false)
        }, 300)
    }

    const handleConfirmSubmit = () => {
        if (loadingSubmit) {
            return
        }
        setLoadingSubmit(true)
        setIsModalSubmitOpen(false)
        setMessageStatus(41)
        setTimeout(() => {
            FormMessage.submit()
        }, 500)
    }

    const handleConfirmDraft = () => {
        if (loadingSubmit) {
            return
        }
        setLoadingSubmit(true)
        setIsModalDraftOpen(false)
        setMessageStatus(3)
        setTimeout(() => {
            FormMessage.submit()
        }, 500)
    }


    const [counterMessage, setMessageCounter] = useState(0)
    const fetchCounter = useCallback(async () => {
        const response = await getMessageCounter(2)
        if (response) {
            setMessageCounter(response.data)
            FormMessage.setFieldValue("EventNumber", response.data)
            return response.data
        } else {
            return -1
        }
    }, [FormMessage])


    const [triggerSave, setTriggerSave] = useState(false)
    const [triggerReset, setTriggerReset] = useState(false)
    const [currentDocument, setCurrentDocument] = useState("")
    const [messageStatus, setMessageStatus] = useState(0)

    const [optionType, setOptionType] = useState([])
    const [optionTemplate, setOptionTemplate] = useState([])

    const fetchTypeName = async () => {
        const response = await getTypeNameSurat(2);
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
        const response = await getTemplateNameSurat(typeName, 2);
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

    const handleOnSaveComplete = debounce(async (content) => {
        if (!loadingSubmit) {
            setLoadingSubmit(true); // Start loading spinner
        }
        let data = FormMessage.getFieldsValue()
        let date = GetCurrentDateInISOFormat()

        let eventNumber = parseInt(data['EventNumber'])
        let eventNumberSub = data['EventNumberSub']

        data['MessageNumberIterMemo'] = parseInt(eventNumber)
        data['EventNumberMemo'] = "" + eventNumber

        if (eventNumberSub === undefined) {
            data['EventNumberSubMemo'] = ""
        } else {
            data['EventNumberSubMemo'] = "" + eventNumberSub
        }

        data.Date = date
        data.MessageContent = content

        let listRecipient = []
        let listRecipientUID = []

        let listCC = []
        let listCCUID = []

        data.MessageClassification = 2
        data.MessageStatus = messageStatus
        data.TemplateUID = data?.TemplateObject?.value

        data.Drafter = name
        data.DrafterUID = recipientUID

        data.Approver = data.ApproverObject?.label
        data.ApproverUID = data.ApproverObject?.value

        data.Reviewer = data.ReviewerObject?.label
        data.ReviewerUID = data.ReviewerObject?.value

        data.RecipientObject?.forEach(item => {
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
            const mediaUIDs = await handleUploadFile()
            data.ListMedia = mediaUIDs || ""

            await createMessage(data)
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
    }, 300)

    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [fileList, setFileList] = useState([]);

    const handleUploadFile = async () => {
        if (fileList.length === 0) {
            setLoadingSubmit(false)
            return null
        }

        try {
            // Upload all files in parallel
            const uploadPromises = fileList.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file.originFileObj);
                
                const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/mediaS3`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                return response.data?.data?.UID;
            });

            const uids = await Promise.all(uploadPromises);
            message.success(`${fileList.length} file berhasil diupload`);
            
            // Return comma-separated UIDs
            return uids.join(',');
        } catch (error) {
            message.error('Gagal mengupload file');
            throw error;
        }
    };


    // Handle file selection and validation
    const handleChangeFile = ({ fileList }) => {
        if (fileList.length > 3) {
            message.warning('Maksimal 3 file yang dapat diupload');
            setFileList(fileList.slice(0, 3));
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


    const handleFinishSubmission = debounce(async () => {
        try {
            const data = FormMessage.getFieldsValue()
            const isAvailable = await handleCheckEventAvailability(data.EventNumber, data.EventNumberSub)
            if (isAvailable) {
                setTriggerSave(!triggerSave)
            } else {
                var counterBefore = data.EventNumber
                var counterAfter = await fetchCounter()
                message.warning("Nomor agenda " + counterBefore + " sudah terdaftar, nomor agenda akan di update menjadi " + counterAfter)
                setLoadingSubmit(false)
            }
        } catch (error) {
            message.error("Terjadi kesalahan saat memvalidasi data")
            setLoadingSubmit(false)
        }
    }, 300)

    const handleFinishFailed = () => {
        setLoadingSubmit(false)
    }


    const [dataUser, setDataUser] = useState([])
    const fetchUser = async () => {
        const response = await getUsers()
        if (response) {
            setDataUser(response.data)
        }
    }



    const handleCheckEventAvailability = async (eventNumber, eventNumberSub) => {
        if (eventNumberSub == undefined) {
            eventNumberSub = ""
        }
        const response = await checkMessageAvailability(eventNumber, eventNumberSub, 2)
        if (response) {
            if (response.data.isAvailable) {
                return true
            }
        }
        return false
    }

    useEffect(() => {
        fetchCounter()
        fetchTypeName()
        fetchNature()
        fetchPriority()
        fetchUser()
    }, [fetchCounter])



    return (
        <main>
            <div className="flex p-3 bg-white shadow-sm rounded flex-col space-y-5 w-auto fixed top-1/2 -translate-y-1/2 right-0 shadow-lg z-50">
                <div 
                    className={`bg-white flex items-center flex-col p-2 font-semibold rounded border border-yellow-400 text-yellow-400 shadow-md ${
                        loadingSubmit 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-yellow-100 cursor-pointer'
                    }`}
                    onClick={!loadingSubmit ? handleDraft : undefined}
                >
                    <MdDrafts className="mb-2 text-sm" />
                    <div className="text-xs">
                        Draft
                    </div>
                </div>

                <div 
                    className={`bg-white flex items-center flex-col p-2 font-semibold rounded border border-red-400 text-red-400 shadow-md ${
                        loadingSubmit 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-red-100 cursor-pointer'
                    }`}
                    onClick={!loadingSubmit ? handleReset : undefined}
                >
                    <MdClear className="mb-2 text-sm" />
                    <div className="text-xs">
                        Batal
                    </div>
                </div>

                <div 
                    className={`bg-white flex items-center flex-col p-2 font-semibold rounded border border-green-400 text-green-400 shadow-md ${
                        loadingSubmit 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-green-100 cursor-pointer'
                    }`}
                    onClick={!loadingSubmit ? handleSubmit : undefined}
                >
                    <MdOutlineDocumentScanner className="mb-2 text-sm" />
                    <div className="text-xs">
                        Submit
                    </div>
                </div>
            </div>

            <h2 className="text-xl text-gray-700 font-semibold">
                Memo Dinas
            </h2>

            <Spin spinning={loadingSubmit} tip="Sedang memproses, mohon tunggu...">

                <div className='w-full'>
                    <div className="p-6 bg-white shadow-sm rounded mt-5 w-[90%]">
                        <h2 className="text-md font-semibold mb-5 text-gray-700">Detail Surat</h2>
                        <hr className="mb-8 bg-gray-300"></hr>
                        <Form
                            layout='horizontal'
                            labelCol={{ span: 5 }}
                            colon={false}
                            form={FormMessage}
                            onFinish={handleFinishSubmission}
                            onFinishFailed={handleFinishFailed}
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
                                            className="text-sm p-3 block w-30 border-0 bg-gray-50 rounded text-black placeholder-gray-300"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
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
                                            placeholder="Pilih Jenis Surat"
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
                                            placeholder="Pilih Template Surat"
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
                                            placeholder="Pilih Sifat Surat"
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
                                            placeholder="Pilih Prioritas Surat"
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
                                            options={dataUser?.map((record) => {
                                                return {
                                                    value: record.UID,
                                                    label: record.Name + " | " + (GetPositionName(record.PositionID) + " " + record.Organization?.Name)
                                                }
                                            })}
                                            placeholder="Pilih Reviewer Surat"
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
                                            placeholder="Pilih Approver Surat"
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
                                            placeholder="Pilih Tujuan Surat"
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
                                            placeholder="Pilih CC Surat"
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
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}></Col>
                            </Row>

                            {/* Upload Surat */}
                            <Row gutter={[24, 16]}>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label={"Lampiran"}
                                        name={"ListMedia"}
                                    >
                                        <Upload
                                            fileList={fileList}
                                            onChange={handleChangeFile}
                                            beforeUpload={beforeUpload}
                                            maxCount={3} // Restrict to 3 files maximum
                                            multiple={true} // Enable multiple file selection
                                            accept=".pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png"
                                            onRemove={(file) => {
                                                setFileList((prevList) => prevList.filter((item) => item.uid !== file.uid));
                                            }}
                                        >
                                            <Button icon={<MdUpload />}>Pilih File (Maks. 3)</Button>
                                        </Upload>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}></Col>
                            </Row>
                        </Form>
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
                            <button 
                                className="flex-1 bg-red-500 text-white py-3 rounded font-semibold"
                                onClick={handleCancelSubmit}
                            >
                                Batal
                            </button>

                            <button 
                                className={`flex-1 bg-green-500 text-white py-3 rounded font-semibold ${loadingSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={handleConfirmSubmit}
                                disabled={loadingSubmit}
                            >
                                Simpan
                            </button>
                        </div>
                    </Modal>


                    <Modal
                        open={isModalResetOpen}
                        title="Batal"
                        footer={false}
                        onCancel={handleCancelReset}
                        maskClosable={false}
                    >
                        <div className='font-semibold text-gray-700 mb-5 mt-5'>
                            Apakah anda yakin untuk membatalkan surat ini ?
                        </div>


                        <div className="flex space-x-3">
                            <button className="flex-1 bg-red-500 text-white py-3 rounded font-semibold"
                                onClick={handleCancelReset}
                            >
                                Batal
                            </button>

                            <button 
                                className={`flex-1 bg-green-500 text-white py-3 rounded font-semibold ${loadingSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={handleConfirmReset}
                                disabled={loadingSubmit}
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
                            <button 
                                className="flex-1 bg-red-500 text-white py-3 rounded font-semibold"
                                onClick={handleCancelDraft}
                            >
                                Batal
                            </button>

                            <button 
                                className={`flex-1 bg-green-500 text-white py-3 rounded font-semibold ${loadingSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={handleConfirmDraft}
                                disabled={loadingSubmit}
                            >
                                Simpan Draft
                            </button>
                        </div>
                    </Modal>
                </div>
            </Spin>
        </main >
    )
}