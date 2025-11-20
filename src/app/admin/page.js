"use client"
import dynamic from "next/dynamic"

export default function Dashboard() {
    // Dynamically load the AmChartComponent to prevent SSR issues
    const ChartUsage = dynamic(() => import("../../components/chartUsage"), { ssr: false });
    return (
        <div className="flex-1 p-2">

            {/* Chart and Summary */}
            <div className="grid">
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
            </div>
        </div>
    );
}
