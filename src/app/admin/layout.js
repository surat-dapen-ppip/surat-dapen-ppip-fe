"use client";

import Dropdown from '@/components/dropdown';
import SidebarDropdown from '@/components/sidebarDropdown';
import Link from 'next/link';
import Image from 'next/image';
import { MdArchive, MdMenu, MdClose, MdNotifications, MdOutlineAllInbox, MdOutlineMail, MdOutlineQueryBuilder, MdOutlineSettings, MdSettings, MdSpaceDashboard, MdSwitchAccount, MdPanTool, MdBuild } from "react-icons/md";
import { useRouter } from 'next/navigation';
import { useLayoutContext } from '@/hooks/useLayoutContext';
import { useState, useEffect } from 'react';

export default function Layout({ children }) {
    const router = useRouter()
    const { role, name, countInbox, countHistory, countDaftarSurat,  handleLogout } = useLayoutContext();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check if the screen is mobile
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Initial check
        checkIfMobile();

        // Add event listener
        window.addEventListener('resize', checkIfMobile);

        // Cleanup
        return () => {
            window.removeEventListener('resize', checkIfMobile);
        };
    }, []);

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMobile && sidebarOpen && !event.target.closest('.sidebar-container')) {
                setSidebarOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMobile, sidebarOpen]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden bg-white p-3 flex justify-between items-center shadow-md">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-gray-700 text-2xl focus:outline-none"
                >
                    {sidebarOpen ? <MdClose /> : <MdMenu />}
                </button>
                <div className="flex justify-center">
                    <Image src="/logo-ppip.jpg" width={60} height={60} alt="Logo" />
                </div>
                <div className="flex items-center">
                    <Image
                        src="https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                        alt="User Avatar"
                        className="rounded-full"
                        width={32}
                        height={32}
                    />
                </div>
            </div>

            {/* Sidebar */}
            <aside
                className={`sidebar-container bg-white shadow-lg z-30 pr-3 ${isMobile ? 'fixed top-0 left-0 h-full transition-all duration-300 ease-in-out' : 'w-64'} ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}
                style={{ width: isMobile ? '50%' : 'auto' }}
            >
                <div className="flex flex-col h-full">
                    <div className="flex flex-col items-center mt-6">
                        {/* Mobile close button */}
                        {isMobile && (
                            <div className="self-end px-4 mb-2">
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="text-gray-700 text-2xl focus:outline-none"
                                >
                                    <MdClose />
                                </button>
                            </div>
                        )}
                        <div className="flex justify-center">
                            <Image src="/logo-ppip.jpg" width={100} height={100} alt="Logo" />
                        </div>
                        <ul className="mt-10 w-full overflow-y-auto">
                            <li>
                                <Link href="/admin" onClick={() => isMobile && setSidebarOpen(false)}>
                                    <div className="flex items-center py-3 pl-4 md:pl-6 hover:bg-gray-50">
                                        <MdSpaceDashboard className="text-gray-400" />
                                        <span className="ml-4 text-sm font-semibold text-gray-700">Dashboard</span>
                                    </div>
                                </Link>
                            </li>
                            <li>
                                <SidebarDropdown
                                    options={[
                                        // { href: "/admin/master/template", label: "Template Surat", hidden: role != "0" ? true : false},
                                        { href: "/admin/suratKeluar", label: "Surat Keluar" },
                                        { href: "/admin/suratMasuk", label: "Surat Masuk", hidden: role != "0" ? true : false },
                                        { href: "/admin/memoDinas", label: "Memo Dinas" },
                                        { href: "/admin/daftarSurat", label: (
                                            <div className="flex items-center">
                                                <span>Daftar Surat</span>
                                                <div className='text-xs ml-2 bg-blue-100 px-2 py-1 rounded-full font-semibold'>{countDaftarSurat}</div>
                                            </div>
                                        )},
                                        { href: "/admin/archive/suratKeluar", label: "Arsip Surat Keluar", hidden: role != "0" ? true : false },
                                    ]}
                                    title={(
                                        <div className="flex items-center">
                                            <MdOutlineMail className="text-gray-400" />
                                            <span className="ml-4 text-sm font-semibold text-gray-700">Penciptaan Surat</span>
                                        </div>
                                    )}
                                    onItemClick={() => isMobile && setSidebarOpen(false)}
                                />
                            </li>
                            <li>
                                <Link href="/admin/inbox" onClick={() => isMobile && setSidebarOpen(false)}>
                                    <div className="flex items-center py-3 pl-4 md:pl-6 hover:bg-gray-50">
                                        <MdOutlineAllInbox className="text-gray-400" />
                                        <div className="ml-4 text-sm font-semibold text-gray-700 flex items-center">
                                            <span>Inbox</span>
                                            <div className='text-xs ml-2 bg-blue-100 px-2 py-1 rounded-full'>{countInbox}</div>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                            <li>
                                <Link href="/admin/history" onClick={() => isMobile && setSidebarOpen(false)}>
                                    <div className="flex items-center py-3 pl-4 md:pl-6 hover:bg-gray-50">
                                        <MdOutlineQueryBuilder className="text-gray-400" />
                                        <div className="ml-4 text-sm font-semibold text-gray-700 flex items-center">
                                            <span>History</span>
                                            <div className='text-xs ml-2 bg-blue-100 px-2 py-1 rounded-full'>{countHistory}</div>
                                        </div>
                                    </div>
                                </Link>
                            </li>

                            <li>
                                <Link href="/admin/archive" onClick={() => isMobile && setSidebarOpen(false)}>
                                    <div className="flex items-center py-3 pl-4 md:pl-6 hover:bg-gray-50">
                                        <MdArchive className="text-gray-400" />
                                        <div className="ml-4 text-sm font-semibold text-gray-700">
                                            Arsip
                                        </div>
                                    </div>
                                </Link>
                            </li>
                            {role == 0 && (
                                <li>
                                    <SidebarDropdown
                                        options={[
                                            { href: "/admin/manageUser/organisasi", label: "Organisasi" },
                                            { href: "/admin/manageUser", label: "User" },
                                        ]}
                                        title={(
                                            <div className="flex items-center">
                                                <MdSwitchAccount className="text-gray-400" />
                                                <span className="ml-4 text-sm font-semibold text-gray-700">Manajemen User</span>
                                            </div>
                                        )}
                                        onItemClick={() => isMobile && setSidebarOpen(false)}
                                    />
                                </li>
                            )}
                            {role == 0 && (
                                <li>
                                    <SidebarDropdown
                                        options={[
                                            { href: "/admin/master/ketanggapan", label: "Prioritas" },
                                            { href: "/admin/master/sifat", label: "Sifat" },
                                            { href: "/admin/master/template", label: "Template" },
                                        ]}
                                        title={(
                                            <div className="flex items-center">
                                                <MdOutlineSettings className="text-gray-400" />
                                                <span className="ml-4 text-sm font-semibold text-gray-700">Master Data</span>
                                            </div>
                                        )}
                                        onItemClick={() => isMobile && setSidebarOpen(false)}
                                    />
                                </li>
                            )}
                            <li>
                                <Link href="/admin/tools" onClick={() => isMobile && setSidebarOpen(false)}>
                                    <div className="flex items-center py-3 pl-4 md:pl-6 hover:bg-gray-50">
                                        <MdBuild className="text-gray-400" />
                                        <div className="ml-4 text-sm font-semibold text-gray-700">
                                            Tools
                                        </div>
                                    </div>
                                </Link>
                            </li>
                            <li>
                                <Link href="/admin/account" onClick={() => isMobile && setSidebarOpen(false)}>
                                    <div className="flex items-center py-3 pl-4 md:pl-6 hover:bg-gray-50">
                                        <MdSettings className="text-gray-400" />
                                        <div className="ml-4 text-sm font-semibold text-gray-700">
                                            Pengaturan Akun
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div
                        onClick={() => {
                            handleLogout()
                        }}
                        className='font-semibold text-sm bg-gray-100 mx-4 md:mx-10 my-4 p-3 text-center rounded cursor-pointer mt-auto'
                    >
                        Logout
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Desktop Header */}
                <div className="hidden md:flex justify-between items-center p-3 bg-white shadow-sm">
                    <div className="flex items-center space-x-4">
                        {/* Empty space for alignment */}
                    </div>
                    <div className="flex items-center space-x-2">
                        <button className="relative text-gray-300 text-xl">
                            <MdNotifications />
                        </button>
                        <div className="flex items-center space-x-2 text-gray-700">
                            <span className="font-semibold text-sm ml-3 mr-1">{name}</span>
                            <Image
                                src="https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                                alt="User Avatar"
                                className="rounded-full"
                                width={32}
                                height={32}
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 md:p-8 overflow-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}