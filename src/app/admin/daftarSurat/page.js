"use client"
import { useLayoutContext } from "@/hooks/useLayoutContext";
import { countMessagesBothUser, countMessagesByUser, countMessagesForApprover, countMessagesForDrafterCC, countMessagesForReviewer, countMessagesForUser, countMessagesOnlyUser, getMessages, getMessagesBothUser, getMessagesByUser, getMessagesForApprover, getMessagesForDrafterCC, getMessagesForReviewer, getMessagesForUser, getMessagesOnlyUser } from "@/services/message";
import { Table, Tabs } from "antd";
import moment from "moment";
/* eslint-disable react-hooks/rules-of-hooks */
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ContentTabs = ({
    dataSource,
    isDraft,
    isApprove,
    isRevised,
    isReview,
    isRejection
}) => {
    const router = useRouter()

    return <Table
        columns={[
            {
                title: 'Judul',
                dataIndex: 'Title',
            },
            {
                title: 'Kategori',
                render: (_, record) => {
                    return (
                        <div>
                            {record.MessageClassification === 1 ? 'Surat Keluar' : ''}
                            {record.MessageClassification === 2 ? 'Memo Dinas' : ''}
                        </div>
                    )
                }
            },
            {
                title: 'Sifat',
                dataIndex: 'nature_name',
            },
            {
                title: 'Prioritas',
                dataIndex: 'priority_name',
            },
            {
                title: 'Tanggal Buat',
                render: (_, record) => {
                    return <div>
                        {moment(record.CreatedAt).format('YYYY-MM-DD')}
                    </div>
                }
            },
            {
                title: 'Action',
                render: (_, record) => {
                    return (
                        <>
                            <button
                                className="text-xs font-semibold px-3 py-1 bg-gray-100 rounded"
                                onClick={() => {
                                    if (isDraft) {
                                        router.push("/admin/draft?uid=" + record.UID)
                                    } else if (isApprove) {
                                        router.push("/admin/approve?uid=" + record.UID)
                                    } else if (isRevised) {
                                        router.push("/admin/revision?uid=" + record.UID)
                                    } else if (isReview) {
                                        router.push("/admin/review?uid=" + record.UID)
                                    } else if (isRejection) {
                                        router.push("/admin/rejection?uid=" + record.UID)
                                    } else {
                                        router.push("/admin/view?uid=" + record.UID)
                                    }
                                }}
                            >
                                Lihat
                            </button>
                        </>
                    )
                }
            }
        ]}
        dataSource={dataSource}
    />
}


export default function pageDaftarSurat() {
    const router = useRouter()
    const { role, recipientUID, name, fetchCount } = useLayoutContext();

    const [selectedKeyTabs, setSelectedKeyTabs] = useState("3")
    const [userUID, setUserUID] = useState("")

    const [cDraft, setCDraft] = useState(0)
    const [cWaitingReview, setCWaitingReview] = useState(0)
    const [cNeedReview, setCNeedReview] = useState(0)
    const [cWaitingApproval, setCWaitingApproval] = useState(0)
    const [cNeedApproval, setCNeedApproval] = useState(0)
    const [cApproved, setCApproved] = useState(0)
    const [cRevised, setCRevised] = useState(0)
    const [cRejected, setCRejected] = useState(0)


    const [dataDraft, setDataDraft] = useState([])
    const [dataWaitingReview, setDataWaitingReview] = useState([])
    const [dataNeedReview, setDataNeedReview] = useState([])
    const [dataWaitingApproval, setDataWaitingApproval] = useState([])
    const [dataNeedApproval, setDataNeedApproval] = useState([])
    const [dataApproved, setDataApproved] = useState([])
    const [dataRevised, setDataRevised] = useState([])
    const [dataRejected, setDataRejected] = useState([])


    const fetchCountDaftar = async (recipientUID) => {
        const rDraft = await countMessagesOnlyUser(3, recipientUID)
        const rWaitingReview = await countMessagesForDrafterCC(41, recipientUID)
        const rNeedReview = await countMessagesForReviewer(41, recipientUID)
        const rWaitingApprove = await countMessagesForDrafterCC(42, recipientUID)
        const rNeedApprove = await countMessagesForApprover(42, recipientUID)
        const rApproved = await countMessagesBothUser(2, recipientUID, 1)
        const rRevised = await countMessagesOnlyUser(5, recipientUID)
        const rRejected = await countMessagesBothUser(6, recipientUID)

        setCDraft(rDraft.data)
        setCWaitingReview(rWaitingReview.data)
        setCNeedReview(rNeedReview.data)
        setCWaitingApproval(rWaitingApprove.data)
        setCNeedApproval(rNeedApprove.data)
        setCApproved(rApproved.data)
        setCRevised(rRevised.data)
        setCRejected(rRejected.data)
    }

    const fetchMessage = async (KeyTabs, userUID) => {
        const selectedKeyTabs = parseInt(KeyTabs.replace("a", ""))

        if (KeyTabs == '3') {
            const response = await getMessagesOnlyUser(selectedKeyTabs, userUID)
            setDataDraft(response.data)
        } else if (KeyTabs == '41') {
            const response = await getMessagesForDrafterCC(selectedKeyTabs, userUID)
            setDataWaitingReview(response.data)
        } else if (KeyTabs == '41a') {
            const response = await getMessagesForReviewer(selectedKeyTabs, userUID)
            setDataNeedReview(response.data)
        } else if (KeyTabs == '42') {
            const response = await getMessagesForDrafterCC(selectedKeyTabs, userUID)
            setDataWaitingApproval(response.data)
        } else if (KeyTabs == '42a') {
            const response = await getMessagesForApprover(selectedKeyTabs, userUID)
            setDataNeedApproval(response.data)
        } else if (KeyTabs == '2') {
            const response = await getMessagesBothUser(selectedKeyTabs, userUID, 1)
            setDataApproved(response.data)
        } else if (KeyTabs == '5') {
            const response = await getMessagesOnlyUser(selectedKeyTabs, userUID)
            setDataRevised(response.data)
        } else if (KeyTabs == '6') {
            const response = await getMessagesBothUser(selectedKeyTabs, userUID)
            setDataRejected(response.data)
        } else {
            return
        }
    }


    useEffect(() => {
        if (typeof window !== 'undefined') {
            const userUID = window.localStorage.getItem('UserUID')
            fetchMessage(selectedKeyTabs, userUID)
            fetchCountDaftar(userUID)
        }
    }, [selectedKeyTabs])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const userUID = window.localStorage.getItem('UserUID')
            fetchCountDaftar(userUID)
        }

    }, [])




    const tabsContent = [
        {
            key: '3',
            label: (
                <h2 className="text-sm font-semibold text-gray-700">Draft
                    ({cDraft})
                </h2>
            ),
            children: (
                <div>
                    <ContentTabs
                        dataSource={dataDraft}
                        isDraft={true}
                    />
                </div>
            )
        },
        {
            key: '41',
            label: (
                <h2 className="text-sm font-semibold text-gray-700">Menunggu Review
                    ({cWaitingReview})
                </h2>
            ),
            children: (
                <div>
                    <ContentTabs
                        dataSource={dataWaitingReview}
                    />
                </div>
            )
        },
        {
            key: '41a',
            label: (
                <h2 className=
                    {"text-sm font-semibold" + (cNeedReview > 0 ? " bg-blue-800 text-white py-1 px-2 rounded" : " text-gray-700")}
                >Membutuhkan Review
                    ({cNeedReview})
                </h2>
            ),
            children: (
                <div>
                    <ContentTabs
                        dataSource={dataNeedReview}
                        isReview={true}
                    />
                </div>
            )
        },
        {
            key: '42',
            label: (
                <h2 className="text-sm font-semibold text-gray-700">Menunggu Persetujuan
                    ({cWaitingApproval})
                </h2>
            ),
            children: (
                <div>
                    <ContentTabs
                        dataSource={dataWaitingApproval}
                    />
                </div>
            )
        },
        {
            key: '42a',
            label: (
                <h2 className=
                    {"text-sm font-semibold" + (cNeedApproval > 0 ? " bg-blue-800 text-white py-1 px-2 rounded" : " text-gray-700")}
                >Membutuhkan  Persetujuan
                    ({cNeedApproval})
                </h2>
            ),
            children: (
                <div>
                    <ContentTabs
                        dataSource={dataNeedApproval}
                        isReview={true}
                    />
                </div>
            )
        },
        {
            key: '2',
            label: (
                <h2 className="text-sm font-semibold text-gray-700">Disetujui
                    ({cApproved})
                </h2>
            ),
            children: (
                <div>
                    <ContentTabs
                        dataSource={dataApproved}
                    />
                </div>
            )
        },
        {
            key: '5',
            label: (
                <h2 className="text-sm font-semibold text-gray-700">Direvisi
                    ({cRevised})
                </h2>
            ),
            children: (
                <div>
                    <ContentTabs
                        dataSource={dataRevised}
                        isRevised={true}
                    />
                </div>
            )
        },
        {
            key: '6',
            label: (
                <h2 className="text-sm font-semibold text-gray-700">Ditolak
                    ({cRejected})
                </h2>
            ),
            children: (
                <div>
                    <ContentTabs
                        dataSource={dataRejected}
                        isRejection={true}
                    />
                </div>
            )
        }
    ]

    return (
        <main>
            <Tabs
                defaultActiveKey="3"
                items={tabsContent}
                size="lg"
                onChange={(activeKey) => {
                    setSelectedKeyTabs(activeKey)
                }}
            />
        </main>
    )
}