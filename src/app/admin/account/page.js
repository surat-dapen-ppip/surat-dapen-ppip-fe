/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { changePasswordUser } from "@/services/users";
import { Button, Col, Form, Input, message, Modal, Row, Space } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FiKey } from "react-icons/fi";

export default function pageHistory() {
    const [isChangePassword, setIsChangePassword] = useState(false)
    const [formChangePassword] = Form.useForm()


    const handleFinishChangePassword = async () => {
        if (typeof window != "undefined") {
            const values = formChangePassword.getFieldsValue()
            const userUID = window.localStorage.getItem('UserUID')

            try {
                await changePasswordUser(userUID, values);
                setIsChangePassword(false)

                formChangePassword.resetFields()

                message.success("Kata sandi berhasil diganti")
            } catch (error) {
                message.error("Kata sandi lama anda tidak sesuai")
            }
        }

    }

    const handleCancelChangePassword = () => {
        formChangePassword.resetFields();
        setIsChangePassword(false)
    }

    return (
        <main>
            <div className="flex justify-between">
                <h2 className="text-xl text-gray-700 font-semibold">
                    Pengaturan Akun
                </h2>

            </div>

            <Row gutter={20} className="mt-5">
                <Col lg={6}>
                    <div className="p-5 bg-white rounded-md border cursor-pointer"
                        onClick={() => {
                            setIsChangePassword(true)
                        }}
                    >

                        <div
                            className="flex items-centered "
                        >
                            <FiKey style={{
                                color: '#374152',
                                fontSize: '48px',
                                marginLeft: 'auto',
                                marginRight: 'auto',
                            }} />
                        </div>
                        <h2 className="text-center text-base text-gray-700 font-semibold  mt-3"
                        >
                            Ubah Kata Sandi
                        </h2>
                    </div>
                </Col>
            </Row>


            <Modal
                open={isChangePassword}
                title="Ubah Kata Sandi"
                footer={false}
                onCancel={() => {
                    setIsChangePassword(false)
                }}
                maskClosable={false}
            >

                <Form
                    form={formChangePassword}
                    onFinish={handleFinishChangePassword}
                    layout="vertical"
                >
                    <Form.Item
                        name={"OldPassword"}
                        label={"Kata Sandi Lama"}
                        rules={[
                            {
                                required: true,
                                message: 'Harap isi kata sandi lama anda',
                            }
                        ]}
                    >
                        <Input.Password size="large" placeholder="Masukan kata sandi lama anda"></Input.Password>
                    </Form.Item>

                    <hr className="mb-5 mt-2"></hr>

                    <Form.Item
                        name={"NewPassword"}
                        label={"Kata Sandi Baru"}
                        rules={[
                            {
                                required: true,
                                message: 'Harap isi kata sandi baru anda',
                            },
                            {
                                min: 6,
                                message: 'Kata sandi minimal harus terdiri dari 6 karakter',
                            }
                        ]}
                    >
                        <Input.Password size="large" placeholder="Masukan kata sandi baru anda"></Input.Password>
                    </Form.Item>

                    <Form.Item
                        name="RePassword"
                        label="Ulangi Kata Sandi Baru"
                        dependencies={['NewPassword']}
                        hasFeedback
                        rules={[
                            {
                                required: true,
                                message: 'Harap ulangi kata sandi baru!',
                            },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('NewPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Kata sandi tidak cocok!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password size="large" placeholder="Masukan kata sandi baru anda" />
                    </Form.Item>

                    <Space>
                        <div
                            onClick={handleCancelChangePassword}
                            className="bg-red-500 p-3 font-semibold text-white rounded"
                        >
                            Batal
                        </div>
                        <button
                            className="bg-green-500 p-3 font-semibold text-white rounded"
                        >
                            Simpan
                        </button>
                    </Space>

                </Form>

            </Modal>

        </main>
    )
}