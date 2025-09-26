/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import { createOrganization, deleteOrganization, getOrganizations, updateOrganization } from "@/services/organizations";
import { Form, message, Modal, Popconfirm, Table } from "antd";
import { useEffect, useState } from "react";

export default function pageOrganisasi() {
    const [UID, setUID] = useState("")
    const [dataOrganization, setDataOrganization] = useState()
    const [isModalOpen, setIsModalOpen] = useState()
    const [eventName, setEventName] = useState()

    const [formOrganization] = Form.useForm()


    const fetchOrganization = async () => {
        const response = await getOrganizations()
        if (response) {
            setDataOrganization(response.data)
        }
    }

    const handleFinish = async () => {
        let data = formOrganization.getFieldsValue()
        try {
            if (eventName == "Tambah") {
                await createOrganization(data)
            } else {
                await updateOrganization(UID, data)
            }
            message.success("Proses Berhasil")
        } catch (error) {
            message.error("Proses Gagal")
        }
        setIsModalOpen(false)
        formOrganization.resetFields()
        fetchOrganization()

    }

    const handleCancel= () => {
        formOrganization.resetFields()
        setIsModalOpen(false);
        setEventName("")
    }

    const handleDelete = async (uid) => {
        try {
            await deleteOrganization(uid)
            message.success("Proses Berhasil")
        } catch (error) {
            message.error("Proses Gagal")
        }
        fetchOrganization()
    }


    const columns = [
        {
            title: 'Nama Organisasi',
            dataIndex: 'Name',
            key: 'Name',
        },
        {
            title: 'Kode Surat',
            dataIndex: 'MessageCode',
            key: 'MessageCode',
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
                                formOrganization.setFieldValue("Name", record.Name)
                                formOrganization.setFieldValue("MessageCode", record.MessageCode)
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
        fetchOrganization()
    }, [])

    return (
        <main>
            <div className="flex justify-between">
                <h2 className="text-xl text-gray-700 font-semibold">
                    Organisasi
                </h2>


                <button className="text-sm text-white bg-gray-400 p-3 rounded font-semibold"
                    onClick={() => {
                        setEventName("Tambah")
                        setIsModalOpen(true);
                    }}
                >
                    Tambah Data
                </button>
            </div>

            <div className="p-6 bg-white shadow-sm rounded mt-5">
                <Table dataSource={dataOrganization} columns={columns} />
            </div>

            <Modal
                open={isModalOpen}
                footer={false}
                title={
                    (
                        <h2 className="font-semibold text-lg text-gray-700">
                            {eventName} Data Organisasi
                        </h2>
                    )
                }
                onCancel={handleCancel}
                maskClosable={false}
            >
                <Form
                    form={formOrganization}
                    layout="vertical"
                    onFinish={handleFinish}
                >
                    <Form.Item
                        label={"Nama Organisasi"}
                        name={'Name'}
                        rules={[{ required: true, message: 'Tolong masukkan nama organisasi' }]}
                    >
                        <input
                            type="text"
                            placeholder="Input Nama Organisasi"
                            className="text-sm p-3 block w-full border-0 bg-gray-50 rounded text-black placeholder-gray-300 w-full"
                        />
                    </Form.Item>

                    <Form.Item
                        label={"Kode Surat"}
                        name={'MessageCode'}
                        rules={[{ required: true, message: 'Tolong masukkan kode surat' }]}
                    >
                        <input
                            type="text"
                            placeholder="Input Kode Surat"
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