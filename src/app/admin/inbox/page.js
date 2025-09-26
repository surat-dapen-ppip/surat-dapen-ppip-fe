/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import { getMessages } from "@/services/message";
import { Select, Space, Table } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CryptoJS from 'crypto-js'

import moment from "moment";
import { MdClear, MdSearch } from "react-icons/md";
import { getUsers } from "@/services/users";
import { useLayoutContext } from "@/hooks/useLayoutContext";

export default function pageHistory() {
    const router = useRouter()
    const {fetchCount} = useLayoutContext();

    const [dataMessage, setDataMessage] = useState()
    const [dataUser, setDataUser] = useState()

    const [optionOrderBy, setOptionOrderBy] = useState([
        { value: 'ASC', label: 'Terlama' },
        { value: 'DESC', label: 'Terbaru' }
    ])
    const [optionCategory, setOptionCategory] = useState([
        { value: 0, label: 'Surat Masuk' },
        { value: 1, label: 'Surat Keluar' },
        { value: 2, label: 'Memo Dinas' },
    ])

    const [keyword, setKeyword] = useState("")
    const [MessageNumber, setMessageNumber] = useState("")
    const [MessageSender, setMessageSender] = useState("")
    const [MessageOrder, setMessageOrder] = useState("")
    const [MessageCategory, setMessageCategory] = useState("")

    const handleSearch = async () => {
        await fetchMessage(keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory)
    }

    const handleSelectOrderBy = async (value) => {
        setMessageOrder(value)
        await fetchMessage(keyword, MessageNumber, MessageSender, value, MessageCategory)
    }

    const handleDiselectOrderBy = async () => {
        setMessageOrder("")
        await fetchMessage(keyword, MessageNumber, MessageSender, "", MessageCategory)
    }

    const handleSelectCategory = async (value) => {
        setMessageCategory(value)
        await fetchMessage(keyword, MessageNumber, MessageSender, MessageOrder, value)
    }

    const handleDeselectCategory = async () => {
        setMessageCategory("")
        await fetchMessage(keyword, MessageNumber, MessageSender, MessageOrder, "")
    }


    const handleKeyPress = async (e) => {
        if (e.key === 'Enter') {
            await fetchMessage(keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory)
        }
    }
    const fetchMessage = async (keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory) => {
        if (typeof window !== 'undefined') {
            const userUID = window.localStorage.getItem('UserUID')

            const response = await getMessages(userUID, keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory)
            if (response) {
                setDataMessage(response.data)
            }
        }

    }

    const fetchUser = async () => {
        const response = await getUsers()
        if (response) {
            setDataUser(response.data)
        }
    }

    const columns = [
        {
            title: 'No Surat',
            render: (_, record) => {
                return <div>
                    {record.MessageClassification == 0 ? record.MessageNumberMasuk : null}
                    {record.MessageClassification == 1 ? record.MessageNumberKeluar : null}
                    {record.MessageClassification == 2 ? record.MessageNumberMemo : null}
                </div>
            }
        },
        {
            title: 'Judul',
            dataIndex: 'Title',
            key: 'Title',
        },
        {
            title: 'Pengirim',
            dataIndex: 'ExternalSender',
            key: 'ExternalSender',
        },
        {
            title: 'Sifat',
            dataIndex: 'nature_name',
            key: 'nature_name',
        },
        {
            title: 'Prioritas',
            dataIndex: 'priority_name',
            key: 'priority_name',
        },
        {
            title: 'Tanggal Surat',
            dataIndex: 'Date',
            key: 'Date',
            render: (_, record) => {
                return <div>
                    {moment(record.Date).format('YYYY-MM-DD')}
                </div>
            }
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: (_, record) => {
                return (
                    <div
                        onClick={() => {
                            if (record.MessageClassification == 0) {
                                router.push("/admin/inbox/detail-surat-masuk?uid=" + record.UID)
                            } else {
                                router.push("/admin/inbox/detail-surat-keluar?uid=" + record.UID)
                            }

                        }}
                        className="p-1 text-gray-700 bg-white border border-gray-300 shadow-md rounded text-center font-semibold text-md cursor-pointer">
                        Buka
                    </div>
                )
            }
        },
    ];


    useEffect(() => {
        fetchUser()
        fetchMessage()

    }, [])


    const stateRef = useRef({
        keyword,
        MessageNumber,
        MessageSender,
        MessageOrder,
        MessageCategory,
    });
    

    useEffect(() => {
        stateRef.current = { keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory };
    }, [keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory]);


    useEffect(() => {
        const interval = setInterval(
            async () => {
                const { keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory } = stateRef.current;
                await fetchMessage(keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory);

                const userUID = window.localStorage.getItem('UserUID')
                const currentRoleID = window.localStorage.getItem('RoleID');

                let roleID = 0
                for (let i = 0; i <= 2; i++) {
                    if (CryptoJS.HmacMD5(i, 'EE_MENCRET') == currentRoleID) {
                        roleID = i
                        break;
                    }
                }

                await fetchCount(roleID, userUID)
            }, 
        10000);

        return () => clearInterval(interval);
    }, []);


    return (
        <main>
            <div className="flex justify-between">
                <h2 className="text-xl text-gray-700 font-semibold">
                    Inbox
                </h2>
                <div className="select-filter rounded mt-2">

                    <Select
                        options={optionCategory}
                        onChange={handleSelectCategory}
                        onClear={handleDeselectCategory}
                        allowClear
                        placeholder={"Pilih Kategori Surat"}
                    />
                </div>
            </div>

            <div className="p-6 bg-white shadow-sm rounded mt-5">
                <div className="flex justify-between">
                    <div>
                        <Space>
                            <div className="bg-gray-100 p-1 rounded mb-3"
                            >
                                <input className="rounded text-sm p-2 bg-gray-100" placeholder="Cari Nomor Surat..."
                                    value={MessageNumber}
                                    onChange={(e) => {
                                        setMessageNumber(e.target.value)
                                    }}
                                    onKeyDown={handleKeyPress}
                                    style={{
                                        width: '150px'
                                    }}
                                />
                                <button
                                    className="pl-1 pr-1"
                                    onClick={handleSearch}
                                ><MdSearch className="text-lg top-1 relative" /></button>
                                <button
                                    className="pl-3 pr-3"
                                    onClick={() => {
                                        setMessageNumber("")
                                        fetchMessage(keyword, "", MessageSender, MessageOrder, MessageCategory)
                                    }}
                                ><MdClear className="text-lg top-1 relative" /></button>
                            </div>
                            <div className="bg-gray-100 p-1 rounded mb-3">
                                <input className="rounded text-sm p-2 bg-gray-100" placeholder="Cari Judul..."
                                    value={keyword}
                                    onChange={(e) => {
                                        setKeyword(e.target.value)
                                    }}
                                    onKeyDown={handleKeyPress}
                                />
                                <button
                                    className="pl-3 pr-3"
                                    onClick={handleSearch}
                                ><MdSearch className="text-lg top-1 relative" /></button>
                                <button
                                    className="pl-3 pr-3"
                                    onClick={() => {
                                        setKeyword("")
                                        fetchMessage("", MessageNumber, MessageSender, MessageOrder, MessageCategory)
                                    }}
                                ><MdClear className="text-lg top-1 relative" /></button>
                            </div>

                            <div className="bg-gray-100 p-1 rounded mb-3">
                                <input className="rounded text-sm p-2 bg-gray-100" placeholder="Cari Pengirim..."
                                    value={MessageSender}
                                    onChange={(e) => {
                                        setMessageSender(e.target.value)
                                    }}
                                    onKeyDown={handleKeyPress}
                                />
                                <button
                                    className="pl-3 pr-3"
                                    onClick={handleSearch}
                                ><MdSearch className="text-lg top-1 relative" /></button>
                                <button
                                    className="pl-3 pr-3"
                                    onClick={() => {
                                        setMessageSender("")
                                        fetchMessage(keyword, MessageNumber, "", MessageOrder, MessageCategory)
                                    }}
                                ><MdClear className="text-lg top-1 relative" /></button>
                            </div>
                        </Space>
                    </div>

                    <div>
                        <Space>
                            <div
                                className="rounded select-filter mt-3"
                            >
                                <Select
                                    options={optionOrderBy}
                                    onChange={handleSelectOrderBy}
                                    onClear={handleDiselectOrderBy}
                                    allowClear
                                    placeholder={"Order By"}
                                />
                            </div>
                        </Space>
                    </div>
                </div>
                <Table dataSource={dataMessage} columns={columns} />
            </div>
        </main>
    )
}