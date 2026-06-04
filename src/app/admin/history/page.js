/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import { exportHistory, getHistory, getHistoryNoStatus, getMessages } from "@/services/message";
import { Button, DatePicker, message, Select, Space, Table } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CryptoJS from 'crypto-js';

import moment from "moment";
import { MdClear, MdRefresh, MdSearch } from "react-icons/md";
import { getUsers } from "@/services/users";
import { GetPositionName } from "@/utils/utility";
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
    const [dateRange, setDateRange] = useState(null)
    const [exporting, setExporting] = useState(false)

    const formatDateRange = (range) => {
        if (!range?.[0] || !range?.[1]) return { startDate: undefined, endDate: undefined }
        return {
            startDate: range[0].format('YYYY-MM-DD'),
            endDate: range[1].format('YYYY-MM-DD'),
        }
    }

    const handleSearch = async () => {
        const { startDate, endDate } = formatDateRange(dateRange)
        await fetchMessage(keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory, startDate, endDate)
    }

    const handleSelectOrderBy = async (value) => {
        setMessageOrder(value)
        const { startDate, endDate } = formatDateRange(dateRange)
        await fetchMessage(keyword, MessageNumber, MessageSender, value, MessageCategory, startDate, endDate)
    }

    const handleDiselectOrderBy = async () => {
        setMessageOrder("")
        const { startDate, endDate } = formatDateRange(dateRange)
        await fetchMessage(keyword, MessageNumber, MessageSender, "", MessageCategory, startDate, endDate)
    }

    const handleSelectCategory = async (value) => {
        setMessageCategory(value)
        const { startDate, endDate } = formatDateRange(dateRange)
        await fetchMessage(keyword, MessageNumber, MessageSender, MessageOrder, value, startDate, endDate)
    }

    const handleDeselectCategory = async () => {
        setMessageCategory("")
        const { startDate, endDate } = formatDateRange(dateRange)
        await fetchMessage(keyword, MessageNumber, MessageSender, MessageOrder, "", startDate, endDate)
    }

    const handleDateRangeChange = async (dates) => {
        setDateRange(dates)
        const { startDate, endDate } = formatDateRange(dates)
        await fetchMessage(keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory, startDate, endDate)
    }

    const handleKeyPress = async (e) => {
        if (e.key === 'Enter') {
            const { startDate, endDate } = formatDateRange(dateRange)
            await fetchMessage(keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory, startDate, endDate)
        }
    }

    const fetchMessage = async (keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory, startDate, endDate) => {
        if (typeof window !== 'undefined') {
            const currentRoleID = window.localStorage.getItem('RoleID');
            let roleID = 0
            for (let i = 0; i <= 2; i++) {
                if (CryptoJS.HmacMD5(i, 'EE_MENCRET') == currentRoleID) {
                    roleID = i
                    break;
                }
            }

            const userUID = window.localStorage.getItem('UserUID')
            if (roleID != 0) {
                const response = await getHistory(userUID, keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory, undefined, startDate, endDate)
                if (response) {
                    setDataMessage(response.data)
                }
            } else {
                const response = await getHistory(userUID, keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory, "true", startDate, endDate)

                if (response) {
                    setDataMessage(response.data)
                }
            }
        }
    }

    const handleExport = async () => {
        if (typeof window === 'undefined') return

        try {
            setExporting(true)
            const currentRoleID = window.localStorage.getItem('RoleID');
            let roleID = 0
            for (let i = 0; i <= 2; i++) {
                if (CryptoJS.HmacMD5(i, 'EE_MENCRET') == currentRoleID) {
                    roleID = i
                    break;
                }
            }

            const userUID = window.localStorage.getItem('UserUID')
            const { startDate, endDate } = formatDateRange(dateRange)
            const response = roleID != 0
                ? await exportHistory(userUID, keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory, undefined, startDate, endDate)
                : await exportHistory(userUID, keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory, "true", startDate, endDate)

            const disposition = response.headers['content-disposition']
            let filename = 'history.xlsx'
            if (disposition) {
                const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
                if (match?.[1]) {
                    filename = match[1].replace(/['"]/g, '')
                }
            }

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            message.error('Gagal mengekspor data history')
        } finally {
            setExporting(false)
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
                            if(record.MessageClassification == 0){
                                router.push("/admin/history/detail-surat-masuk?uid=" + record.UID)
                            }else{
                                router.push("/admin/history/detail-surat-keluar?uid=" + record.UID)
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
        fetchMessage()
        fetchUser()
    }, [])

    const stateRef = useRef({
        keyword,
        MessageNumber,
        MessageSender,
        MessageOrder,
        MessageCategory,
        dateRange,
    });
    

    useEffect(() => {
        stateRef.current = { keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory, dateRange };
    }, [keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory, dateRange]);


    useEffect(() => {
        const interval = setInterval(
            async () => {
                const { keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory, dateRange } = stateRef.current;
                const { startDate, endDate } = formatDateRange(dateRange);
                await fetchMessage(keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory, startDate, endDate);
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
                    History
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
                                        const { startDate, endDate } = formatDateRange(dateRange)
                                        fetchMessage(keyword, "", MessageSender, MessageOrder, MessageCategory, startDate, endDate)
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
                                        const { startDate, endDate } = formatDateRange(dateRange)
                                        fetchMessage("", MessageNumber, MessageSender, MessageOrder, MessageCategory, startDate, endDate)
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
                                        const { startDate, endDate } = formatDateRange(dateRange)
                                        fetchMessage(keyword, MessageNumber, "", MessageOrder, MessageCategory, startDate, endDate)
                                    }}
                                ><MdClear className="text-lg top-1 relative" /></button>
                            </div>
                            <div className="bg-gray-100 p-1 rounded mb-3">
                                <DatePicker.RangePicker
                                    className="bg-gray-100"
                                    value={dateRange}
                                    onChange={handleDateRangeChange}
                                    format="YYYY-MM-DD"
                                    placeholder={['Tanggal awal', 'Tanggal akhir']}
                                    size="large"
                                />
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
                            <Button
                                loading={exporting}
                                onClick={handleExport}
                                size="large"
                                type="primary"
                            >
                                Export
                            </Button>
                        </Space>
                    </div>
                </div>
                <Table dataSource={dataMessage} columns={columns} />
            </div>
        </main>
    )
}