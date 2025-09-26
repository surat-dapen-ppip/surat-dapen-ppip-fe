"use client"

import { getReport } from "@/services/message";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import CryptoJS from 'crypto-js';

export default function Dashboard() {
    // Dynamically load the AmChartComponent to prevent SSR issues
    const ChartUsage = dynamic(() => import("../../components/chartUsage"), { ssr: false });

    const [gridValue, setGridValue] = useState({})


    const fetchDashboardGridValue = async (roleID, recipientUID, messageClassification) => {
        if (typeof window !== 'undefined') {
            if (roleID == 0) {
                recipientUID = ""
            }

            const response = await getReport(recipientUID, messageClassification)
            if (response) {
                setGridValue(response.data)
            }
        }
    }



    useEffect(() => {
        if (typeof window !== 'undefined') {
            const recipientUID = window.localStorage.getItem('UserUID')
            const currentRoleID = window.localStorage.getItem('RoleID');

            let roleID = 0
            for (let i = 0; i <= 2; i++) {
                if (CryptoJS.HmacMD5(i, 'EE_MENCRET') == currentRoleID) {
                    roleID = i
                    break;
                }
            }

            fetchDashboardGridValue(roleID, recipientUID, 0)
        }

    }, [])

    return (
        <div className="flex-1 p-2">

            {/* Chart and Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart */}
                <div className="bg-white p-6 rounded-lg shadow-lg col-span-2">
                    <h2 className="text-xl font-semibold mb-4 text-black">Grafik Surat</h2>
                    <div className="relative">
                        {/* You can replace this with a chart component later */}
                        <div className="p-3 bg-gray-100 rounded-lg">
                            <ChartUsage />
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 text-black">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <p className="text-gray-500 text-sm">Total Surat Masuk</p>
                        <h3 className="text-3xl font-bold mt-5">
                            {gridValue?.CountSuratMasuk}
                        </h3>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <p className="text-gray-500 text-sm">Total Surat Keluar</p>
                        <h3 className="text-3xl font-bold mt-5">
                            {gridValue?.CountSuratKeluar}
                        </h3>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <p className="text-gray-500 text-sm">Total Memo Dinas</p>
                        <h3 className="text-3xl font-bold mt-5">
                            {gridValue?.CountMemoDinas}
                        </h3>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <p className="text-gray-500 text-sm">Menunggu Approval</p>
                        <h3 className="text-3xl font-bold mt-5">
                            {gridValue?.CountMenungguApproval}
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    );
}
