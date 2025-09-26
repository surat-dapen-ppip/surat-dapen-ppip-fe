"use client"
import { Form, Input, message } from 'antd'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import CryptoJS from 'crypto-js';
import { useEffect } from 'react'
import { useLayoutContext } from '@/hooks/useLayoutContext';

export default function LoginPage() {
    const { handleAuth } = useLayoutContext();

    const router = useRouter()
    const [FormLogin] = Form.useForm()


    const handleLogin = async () => {
        const data = FormLogin.getFieldsValue()
        console.log(data)
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_PUBLIC_URL}/login`, data);
            if (response.data) {
                if (typeof window !== 'undefined') {
                    const user = response.data.data
                    window.localStorage.setItem("Username", user.Username)
                    window.localStorage.setItem("UserUID", user.UID)
                    window.localStorage.setItem("RoleID", CryptoJS.HmacMD5(user.RoleID, 'EE_MENCRET'))
                    window.localStorage.setItem("Name", user.Name)
                    window.localStorage.setItem("Token", user.Token)

                    handleAuth()
                    setTimeout(() => {
                        router.push("/admin")
                    }, 300)
                }

            }
            message.success('Login successfully!');
        } catch (error) {
            message.error('Username or Password is incorrect');
        }
    }

    const handleIsLogin = async () => {
        if (typeof window !== 'undefined') {
            const recipientUID = window.localStorage.getItem('UserUID');
            const currentRoleID = window.localStorage.getItem('RoleID');

            if (recipientUID != undefined && currentRoleID != undefined) {
                router.push('/admin')
            }
        }
    }

    useEffect(() => {
        handleIsLogin()
    }, [])

    return (
        <div className="flex h-screen">
            {/* Left section for login */}


            <div className="w-1/2 flex flex-col justify-center items-center bg-white p-10">

                {/* Logo */}
                <div className="flex justify-center absolute top-10">
                    <img src="/logo-ppip.jpg" width='150px'></img>
                </div>

                {/* Sign In Form */}

                <div className="w-full max-w-xs">

                    <h2 className="text-3xl mb-1 text-gray-700 font-semibold text-center">Surat</h2>
                    <h2 className="text-lg mb-1 text-gray-400 text-center">Dana Pensiun PPIP </h2>
                    {/* <h2 className="text-sm mb-6 text-gray-300 font-semibold text-center">Or create <span className="text-blue-400 ">an account</span></h2> */}
                    <div className="space-y-4 mt-7">

                        <Form
                            form={FormLogin}
                            layout='vertical'
                            onFinish={handleLogin}
                        >
                            <Form.Item
                                label="Username / Badge"
                                name={"Username"}
                                rules={[{ required: true, message: 'Please input Username' }]}
                            >
                                <Input
                                    size='large'
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none text-gray-700 text-sm"
                                />
                            </Form.Item>
                            <Form.Item
                                label="Password"
                                name={"Password"}
                                rules={[{ required: true, message: 'Please input Password' }]}
                            >
                                <Input.Password
                                    size='large'
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none text-gray-700 text-sm"
                                />
                            </Form.Item>

                            <button
                                htmlType="submit"
                                className="mt-5 w-full bg-blue-900 text-white py-3 rounded-lg font-semibold text-lg"
                            >
                                Masuk
                            </button>
                        </Form>


                    </div>
                </div>
            </div>

            {/* Right section for illustration */}
            <div className="w-1/2 bg-blue-50 flex items-center justify-center">
            </div>
        </div>
    )
}
