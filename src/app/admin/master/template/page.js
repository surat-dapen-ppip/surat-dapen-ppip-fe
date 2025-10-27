"use client"

/* eslint-disable react-hooks/rules-of-hooks */
import { createTemplateSurat, deleteTemplateSurat, getTemplateNameSurat, getTemplateSurat, getTemplateSuratByUid, getTypeNameSurat, updateTemplateSurat } from "@/services/messageTemplate"
import { AutoComplete, Col, Form, Input, message, Modal, Popconfirm, Row, Select, Table } from "antd"
import { Suspense, useEffect, useState } from "react"
import { GetBaseTemplate } from '@/utils/messageUtil';
import dynamic from 'next/dynamic'

const RichEditTemplateComponent = dynamic(() => import('@/components/richEditorTemplate'), { ssr: false });

const ModalTemplate = ({
    UID,
    isModalOpen,
    setIsModalOpen,
    eventName,
    fetchTemplateSurat,
    formTemplateSurat,
}) => {

    const [triggerSave, setTriggerSave] = useState(false)
    const [currentDocument, setCurrentDocument] = useState("")

    const [optionType, setOptionType] = useState([])
    const [optionTemplate, setOptionTemplate] = useState([])

    const [messageClassification, setMessageClassification] = useState()

    const handleOnSaveComplete = (param) => {
        const asyncHandler = async (content) => {
            let data = formTemplateSurat.getFieldsValue()
            data['Content'] = content
            try {
                if (eventName == "Tambah") {
                    await createTemplateSurat(data)
                } else {
                    await updateTemplateSurat(UID, data)
                }
                message.success("Proses Berhasil")
                formTemplateSurat.resetFields()
                setIsModalOpen(false)
            } catch (error) {
                message.error("Surat dengan tipe surat dan template surat sudah ada, mohon untuk menggunakan label nama template surat lain")
            }
            fetchTemplateSurat()
        }
        asyncHandler(param)
    }

    const handleTriggerForm = () => {
        setMessageClassification(formTemplateSurat.getFieldValue('MessageClassification'))
        setTimeout(()=>{
            setTriggerSave(!triggerSave)
        },350)
    }

    const handleCancel = () => {
        formTemplateSurat.resetFields()
        setIsModalOpen(false)
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
                    value: item.TemplateName
                }
            }))
        }
    }


    useEffect(() => {
        fetchTypeName()
        if (UID != "" && UID != "create" && UID != undefined) {
            const asyncHandler = async () => {
                const response = await getTemplateSuratByUid(UID)
                formTemplateSurat.setFieldValue('MessageClassification', response.data.MessageClassification)
                formTemplateSurat.setFieldValue('TypeName', response.data.TypeName)
                formTemplateSurat.setFieldValue('TemplateName', response.data.TemplateName)
                formTemplateSurat.setFieldValue('TemplateCode', response.data.TemplateCode)
                setMessageClassification(response.data.MessageClassification)
                setTimeout(() => {
                    setCurrentDocument(response.data.Content)
                }, 600)
            }

            asyncHandler()
        } else if (UID == "create") {
            setTimeout(() => {
                setCurrentDocument(GetBaseTemplate())
            }, 600)
        }
    }, [isModalOpen, UID])


    return (
        <Modal
            maskClosable={false}
            open={isModalOpen}
            footer={false}
            title={
                (
                    <h2 className="font-semibold text-lg text-gray-700">
                        {eventName} Data Template Surat
                    </h2>
                )
            }
            onCancel={handleCancel}
            width={1200}
            style={{
                top: '10px'
            }}
        >
            <Form
                form={formTemplateSurat}
                layout="vertical"
                onFinish={handleTriggerForm}
            >
                <Row gutter={20}>
                    <Col lg={6}>
                        <Form.Item
                            label={"Jenis Surat"}
                            name={'MessageClassification'}
                            rules={[{ required: true, message: 'Tolong masukkan Jenis Surat' }]}
                        >

                            <Select
                                size="large"
                                placeholder="Pilih Jenis Surat"
                                options={[
                                    {label:'Surat Keluar', value:1},
                                    {label:'Memo Dinas', value:2}
                                ]}
                            />
                        </Form.Item>
                    </Col>
                    <Col lg={6}>
                        <Form.Item
                            label={"Tipe Surat"}
                            name={'TypeName'}
                            rules={[{ required: true, message: 'Tolong masukkan Tipe Template Surat' }]}
                        >

                            <AutoComplete
                                popupMatchSelectWidth={500}
                                size="large"
                                options={optionType}
                                placeholder="Masukan Label Tipe Surat"
                                onSelect={(item, _) => {
                                    fetchTemplateName(item)
                                    formTemplateSurat.setFieldValue('TemplateName', null)
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col lg={6}>
                        <Form.Item
                            label={"Template Surat"}
                            name={'TemplateName'}
                            rules={[{ required: true, message: 'Tolong masukkan Nama Template Surat' }]}
                        >
                            <AutoComplete
                                placeholder="Masukan Nama Template"
                                popupMatchSelectWidth={500}
                                size="large"
                                options={optionTemplate}
                            />
                        </Form.Item>
                    </Col>
                    <Col lg={6}>
                        <Form.Item
                            label={"Kode Template"}
                            name={'TemplateCode'}
                            rules={[{ required: true, message: 'Tolong masukkan Kode Template' }]}
                        >
                            <AutoComplete
                                placeholder="Misal : SDI, EDR, INS, KET, LDS"
                                size="large"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Suspense fallback={<div>Loading...</div>}>
                    <RichEditTemplateComponent
                        currentDocument={currentDocument}
                        setCurrentDocument={setCurrentDocument}
                        onSaveComplete={handleOnSaveComplete}
                        triggerSave={triggerSave}
                        form={formTemplateSurat}
                        messageClassification={messageClassification}
                    />
                </Suspense>




                <div className="flex justify-end mt-5">
                    <div className="text-sm text-white bg-red-300 p-3 rounded font-semibold mr-3 cursor-pointer"
                        onClick={handleCancel}
                    >
                        Batal
                    </div>
                    <button className="text-sm text-white bg-gray-400 p-3 rounded font-semibold"
                        htmlType="submit"
                    >
                        Submit
                    </button>
                </div>
            </Form>
        </Modal>
    )
}

export default function pageTemplate() {
    const [UID, setUID] = useState("")

    const [formTemplateSurat] = Form.useForm()

    const [dataTemplate, setDataTemplate] = useState()
    const [isModalOpen, setIsModalOpen] = useState()
    const [eventName, setEventName] = useState()

    const handleCreate = () => {
        setUID('create')
        setEventName("Tambah")
        setIsModalOpen(true)
        formTemplateSurat.resetFields()
    }

    const handleUpdate = (record) => {
        setUID(record.UID)
        setEventName("Update")
        setIsModalOpen(true)
    }


    const fetchTemplateSurat = async () => {
        const response = await getTemplateSurat()
        if (response) {
            setDataTemplate(response.data)
        }
    }

    const handleDelete = async (uid) => {
        try {
            await deleteTemplateSurat(uid)
            message.success("Proses Berhasil")
        } catch (error) {
            message.error("Proses Gagal")
        }
        fetchTemplateSurat()
    }


    const columns = [
        {
            title: 'Jenis Surat',
            dataIndex: 'MessageClassification',
            width: 120,
            render: (_,record) => {

                function getClassification(messageClassification){
                    if (messageClassification == 1){
                        return (
                            <div className="font-xs text-white bg-blue-500 text-center p-2">Surat Keluar</div>
                        )
                    }else{
                        return (
                            <div className="font-xs text-white bg-green-500 text-center p-2">Memo Dinas</div>
                        )
                    }
                }

                return (
                    <div>
                        {getClassification(record.MessageClassification)}
                    </div>
                )
            }
        },
        {
            title: 'Tipe Surat',
            dataIndex: 'TypeName',
            key: 'TypeName',
        },
        {
            title: 'Template Surat',
            dataIndex: 'TemplateName',
            key: 'TemplateName',
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            width: '200px',
            render: (_, record) => {
                return (
                    <div>
                        <button className="bg-gray-200 text-black text-md font-semibold rounded p-2 mr-2"
                            onClick={() => {
                                handleUpdate(record)
                            }}
                        >
                            Update
                        </button>
                        <Popconfirm
                            title="Delete Item"
                            description="Are you sure to delete this ?"
                            onConfirm={() => {
                                handleDelete(record.UID)
                            }}
                            okText="Yes"
                            cancelText="No"
                        >
                            <button className="bg-red-300 text-black text-md font-semibold rounded p-2">
                                Delete
                            </button>
                        </Popconfirm>

                    </div>
                )
            }
        },
    ];


    useEffect(() => {
        fetchTemplateSurat()
    }, [])

    return (
        <main>
            <div className="flex justify-between">
                <h2 className="text-xl text-gray-700 font-semibold">
                    Template Surat
                </h2>


                <button className="text-sm text-white bg-gray-400 p-3 rounded font-semibold"
                    onClick={handleCreate}
                >
                    Tambah Data
                </button>
            </div>

            <div className="p-6 bg-white shadow-sm rounded mt-5">
                <Table dataSource={dataTemplate} columns={columns} />
            </div>

            <ModalTemplate
                UID={UID}
                setUID={setUID}
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                eventName={eventName}
                setEventName={setEventName}
                fetchTemplateSurat={fetchTemplateSurat}
                formTemplateSurat={formTemplateSurat}
            />
        </main>
    )
}