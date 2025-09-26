/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import { getOrganizations } from "@/services/organizations";
import { createUser, deleteUser, getUsers, updateUser } from "@/services/users";
import { Form, message, Modal, Popconfirm, Select, Table } from "antd";
import { useEffect, useState } from "react";

export default function pageUser() {
    const [UID, setUID] = useState(null)

    const [dataUser, setDataUser] = useState()
    const [dataOrganization, setDataOrganization] = useState()

    const [isModalOpen, setIsModalOpen] = useState()
    const [eventName, setEventName] = useState()

    const [formUser] = Form.useForm()


    const fetchUser = async () => {
        const response = await getUsers()
        if (response) {
            setDataUser(response.data)
        }
    }

    const fetchOrganization = async () => {
        const response = await getOrganizations()
        if (response) {
            setDataOrganization(response.data)
        }
    }

    const handleFinish = async () => {
        let data = formUser.getFieldsValue()
        try {
            if (eventName == "Tambah") {
                await createUser(data)
            } else {
                await updateUser(UID, data)
            }
            message.success("Proses Berhasil")
        } catch (error) {
            message.error("Proses Gagal")
        }
        setIsModalOpen(false)
        formUser.resetFields()
        fetchUser()

    }

    const handleDelete = async (uid) => {
        try {
            await deleteUser(uid)
            message.success("Proses Berhasil")
        } catch (error) {
            message.error("Proses Gagal")
        }
        fetchUser()
    }

    const handleCancel = () => {
        formUser.resetFields()
        setIsModalOpen(false);
        setEventName("")
    }


    const columns = [
        {
            title: 'Username',
            dataIndex: 'Username',
            key: 'Username',
        },
        {
            title: 'Nama User',
            dataIndex: 'Name',
            key: 'Name',
        },
        {
            title: 'Organisasi',
            key: 'OrganizationName',
            render: (_, record) => {
                return (
                    <>
                        {record.Organization?.Name}
                    </>
                )
            }
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

                                formUser.setFieldValue("Username", record.Username)
                                formUser.setFieldValue("Name", record.Name)
                                formUser.setFieldValue("RoleID", record.RoleID)
                                formUser.setFieldValue("PositionID", record.PositionID)
                                formUser.setFieldValue("OrganizationUID", record.OrganizationUID)

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
        fetchOrganization()
        fetchUser()
    }, [])

    return (
        <main>
            <div className="flex justify-between">
                <h2 className="text-xl text-gray-700 font-semibold">
                    Users
                </h2>


                <button className="text-sm text-white bg-gray-400 p-3 rounded font-semibold"
                    onClick={() => {
                        setEventName("Tambah")
                        formUser.resetFields()
                        setIsModalOpen(true);
                    }}
                >
                    Tambah Data
                </button>
            </div>

            <div className="p-6 bg-white shadow-sm rounded mt-5">
                <Table dataSource={dataUser} columns={columns} />
            </div>

            <Modal
                open={isModalOpen}
                footer={false}
                title={
                    (
                        <h2 className="font-semibold text-lg text-gray-700">
                            {eventName} Data User
                        </h2>
                    )
                }
                onCancel={handleCancel}
                maskClosable={false}
            >
                <Form
                    form={formUser}
                    onFinish={handleFinish}
                    layout="vertical"
                >
                    <Form.Item
                        label={"Username"}
                        name={'Username'}
                        rules={[{ required: true, message: 'Tolong masukkan username' }]}
                    >
                        <input
                            type="text"
                            placeholder="Input Username"
                            className="text-sm p-3 block w-full border-0 bg-gray-50 rounded text-black placeholder-gray-300 w-full"
                        />
                    </Form.Item>
                    <Form.Item
                        label={"Password"}
                        name={'Password'}
                        rules={[{ required: true, message: 'Tolong masukkan password' }]}
                    >
                        <input
                            type="text"
                            placeholder="Input Password"
                            className="text-sm p-3 block w-full border-0 bg-gray-50 rounded text-black placeholder-gray-300 w-full"
                        />
                    </Form.Item>

                    <Form.Item
                        label={"Nama Pengguna"}
                        name={'Name'}
                        rules={[{ required: true, message: 'Tolong masukkan nama pengguna' }]}
                    >
                        <input
                            type="text"
                            placeholder="Input Username"
                            className="text-sm p-3 block w-full border-0 bg-gray-50 rounded text-black placeholder-gray-300 w-full"
                        />
                    </Form.Item>

                    <Form.Item
                        label={"Jabatan"}
                        name={'PositionID'}
                        rules={[{ required: true, message: 'Tolong masukkan jabatan pengguna' }]}
                    >
                        <Select
                            placeholder="Pilih Jabatan"
                            options={[
                                { label: 'Direktur', value: 1 },
                                { label: 'Kepala Bidang', value: 2 },
                                { label: 'Staf / Pegawai', value: 3 }
                            ]}
                        ></Select>
                    </Form.Item>

                    <Form.Item
                        label={"Role Akun"}
                        name={'RoleID'}
                        rules={[{ required: true, message: 'Tolong masukkan role pengguna' }]}
                    >
                        <Select
                            placeholder="Pilih Role"
                            options={[
                                { label: 'Sekretaris ', value: 0 },
                                { label: 'Pengguna', value: 1 },
                            ]}
                        ></Select>
                    </Form.Item>

                    <Form.Item
                        label={"Organisasi"}
                        name={'OrganizationUID'}
                        rules={[{ required: true, message: 'Tolong masukkan organisasi pengguna' }]}
                    >
                        <Select
                            placeholder="Pilih Organisasi"
                            options={dataOrganization?.map((record) => (
                                {
                                    label: record.Name,
                                    value: record.UID
                                }
                            ))}
                        ></Select>
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