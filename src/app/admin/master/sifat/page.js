/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import { createNature, deleteNature, getNatures, updateNature } from "@/services/natures";
import { Form, message, Modal, Popconfirm, Table } from "antd";
import { useEffect, useState } from "react";

export default function pageSifat() {
    const [UID, setUID] = useState("")

    const [dataNature, setDataNature] = useState()
    const [isModalOpen, setIsModalOpen] = useState()
    const [eventName, setEventName] = useState()

    const [formNature] = Form.useForm()


    const fetchNature = async () => {
        const response = await getNatures()
        if (response) {
            setDataNature(response.data)
        }
    }

    const handleFinish = async () => {
        let data = formNature.getFieldsValue()
        try {
            if (eventName == "Tambah") {
                await createNature(data)
            } else {
                await updateNature(UID, data)
            }
            message.success("Proses Berhasil")
        } catch (error) {
            message.error("Proses Gagal")
        }
        setIsModalOpen(false)
        formNature.resetFields()
        fetchNature()
    }

    const handleDelete = async (uid) => {
        try {
            await deleteNature(uid)
            message.success("Proses Berhasil")
        } catch (error) {
            message.error("Proses Gagal")
        }
        fetchNature()
    }

    const handleCancel = () => {
        formNature.resetFields()
        setIsModalOpen(false);
        setEventName("")
    }


    const columns = [
        {
            title: 'Nama Sifat',
            dataIndex: 'Name',
            key: 'Name',
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
                                setEventName("Update")
                                setUID(record.UID)
                                formNature.setFieldValue("Name", record.Name)
                                setTimeout(() => {
                                    setIsModalOpen(true)
                                }, 200)
                            }}
                        >
                            Update
                        </button>
                        <Popconfirm
                            title="Delete Item"
                            description="Are you sure to delete this ?"
                            onConfirm={()=>{
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
        fetchNature()
    }, [])

    return (
        <main>
            <div className="flex justify-between">
                <h2 className="text-xl text-gray-700 font-semibold">
                    Master Sifat
                </h2>


                <button className="text-sm text-white bg-gray-400 p-3 rounded font-semibold"
                    onClick={() => {
                        setEventName("Tambah")
                        formNature.resetFields()
                        setIsModalOpen(true);
                    }}
                >
                    Tambah Data
                </button>
            </div>

            <div className="p-6 bg-white shadow-sm rounded mt-5">
                <Table dataSource={dataNature} columns={columns} />
            </div>

            <Modal
                open={isModalOpen}
                footer={false}
                title={
                    (
                        <h2 className="font-semibold text-lg text-gray-700">
                            {eventName} Data Sifat
                        </h2>
                    )
                }
                onCancel={handleCancel}
                maskClosable={false}
            >
                <Form
                    form={formNature}
                    layout="vertical"
                    onFinish={handleFinish}
                >
                    <Form.Item
                        label={"Nama Sifat"}
                        name={'Name'}
                        rules={[{ required: true, message: 'Tolong masukkan nama sifat' }]}
                    >
                        <input
                            type="text"
                            placeholder="Input Nama Sifat"
                            className="text-sm p-3 block w-full border-0 bg-gray-50 rounded text-black placeholder-gray-300 w-full"
                        />
                    </Form.Item>


                    <div className="flex justify-end">
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
        </main>
    )
}