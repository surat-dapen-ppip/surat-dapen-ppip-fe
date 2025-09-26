'use client'

import { useState, useEffect, useCallback } from 'react';
import {
    getDocuments,
    createDocument,
    getChildDirectories,
    getDirectoryByUid,
    deleteDirectory,
    createDirectory,
    updateDirectory,
    deleteDocument,
    updateDocument,
    getDocumentByUid
} from '@/services/archive';
import { MdOutlineUpload, MdEdit, MdDelete, MdFolder, MdFolderOpen, MdArrowBack, MdInsertDriveFile, MdAdd, MdRefresh, MdClose } from 'react-icons/md';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import axios from 'axios';

export default function ArchivePage() {
    const [documents, setDocuments] = useState([]);
    const [folders, setFolders] = useState([]);
    const [currentFolder, setCurrentFolder] = useState('');
    const [folderHistory, setFolderHistory] = useState([]);
    const [folderBreadcrumb, setFolderBreadcrumb] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [file, setFile] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [selectedItem, setSelectedItem] = useState(null);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [editName, setEditName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [viewPdfModalVisible, setViewPdfModalVisible] = useState(false);
    const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [watermarkedPdfUrl, setWatermarkedPdfUrl] = useState(null);
    const [currentDocumentData, setCurrentDocumentData] = useState(null);

    // Fetch directories and documents on component mount
    useEffect(() => {
        const initializeArchive = async () => {
            const ownerUid = localStorage.getItem('UserUID');
            try {
                setIsLoading(true);
                // Get the root directories first
                const dirResponse = await getChildDirectories("", ownerUid);
                if (dirResponse && dirResponse.data) {
                    setFolders(dirResponse.data);
                    setCurrentFolder('');
                    setFolderHistory(['']);
                    updateBreadcrumb('');
                }
            } catch (error) {
                console.error('Error initializing archive:', error);
                setErrorMessage('Failed to load folders. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        initializeArchive();
    }, []);

    const fetchFolderContents = useCallback(async () => {
        setIsLoading(true);
        // Get user UID from localStorage
        const ownerUid = localStorage.getItem('UserUID');

        try {
            // Fetch subdirectories

            const dirResponse = await getChildDirectories(currentFolder, ownerUid);
            if (dirResponse && dirResponse.data) {
                console.log('Folders received:', dirResponse.data);
                // Ensure each folder has a UID property
                const foldersWithUIDs = dirResponse.data.map(folder => {
                    if (!folder.UID && folder.uid) {
                        return { ...folder, UID: folder.uid };
                    } else if (!folder.uid && folder.UID) {
                        return { ...folder, uid: folder.UID };
                    }
                    return folder;
                });
                setFolders(foldersWithUIDs);
            }

            // Fetch documents in this folder
            try {

                // Use getDocuments service instead of direct axios call
                const docResponse = await getDocuments(currentFolder, ownerUid);
                if (docResponse && docResponse.data) {
                    console.log('Documents received:', docResponse.data);
                    setDocuments(docResponse.data);
                } else {
                    setDocuments([]);
                }
            } catch (docError) {
                console.error('Error fetching documents:', docError);
                setDocuments([]);
            }
        } catch (error) {
            console.error('Error fetching folder contents:', error);
            setErrorMessage('Failed to load folder contents. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [currentFolder, setIsLoading, setFolders, setDocuments, setErrorMessage]);

    // Fetch documents and subdirectories when current folder changes
    useEffect(() => {
        if (currentFolder === null) return;
        const fetcher = async () => {
            await fetchFolderContents();
        }
        fetcher()
    }, [currentFolder, fetchFolderContents]);

    // Update breadcrumb when current folder changes
    const updateBreadcrumb = async (folderId) => {
        if (!folderId) {
            // Root folder
            setFolderBreadcrumb([{ uid: '', Pathname: 'Root' }]);
            return;
        }

        try {
            const path = [];
            let currentId = folderId;

            while (currentId) {
                let ownerUID = localStorage.getItem('UserUID');

                const folderResponse = await getDirectoryByUid(currentId, ownerUID);
                if (folderResponse && folderResponse.data) {
                    const folder = folderResponse.data;
                    path.unshift({ uid: folder.uid, Pathname: folder.Pathname });
                    currentId = folder.parent_uid;
                } else {
                    break;
                }
            }

            // Add root at the beginning
            path.unshift({ uid: '', Pathname: 'Root' });
            setFolderBreadcrumb(path);
        } catch (error) {
            console.error('Error updating breadcrumb:', error);
        }
    };

    const navigateToFolder = async (folder) => {
        try {
            const folderId = folder.uid || folder.UID;
            console.log('Navigating to folder:', folder, 'with ID:', folderId);

            if (!folderId) {
                console.error('Folder is missing UID:', folder);
                setErrorMessage('Cannot navigate to folder: missing identifier');
                return;
            }

            setCurrentFolder(folderId);
            setFolderHistory(prev => [...prev, folderId]);
            await updateBreadcrumb(folderId);
        } catch (error) {
            console.error('Error navigating to folder:', error);
            setErrorMessage('Failed to navigate to folder. Please try again.');
        }
    };

    const navigateBack = () => {
        if (folderHistory.length > 1) {
            const newHistory = [...folderHistory];
            newHistory.pop(); // Remove current folder
            const previousFolder = newHistory[newHistory.length - 1];
            setCurrentFolder(previousFolder);
            setFolderHistory(newHistory);
            updateBreadcrumb(previousFolder);
        }
    };

    const handleDoubleClick = (item, type) => {
        if (type === 'folder') {
            navigateToFolder(item);
        } else if (type === 'document') {
            handleViewDocument(item);
        }
    };

    const handleViewDocument = async (document) => {
        try {
            const docUid = document.UID || document.uid;
            if (!docUid) {
                throw new Error('Cannot view document: missing UID');
            }

            // Get document details by UID
            const docResponse = await getDocumentByUid(docUid);
            if (docResponse && docResponse.data) {
                console.log('Document details:', docResponse.data);
                setCurrentDocumentData(docResponse.data);

                // Set selected item and show modal
                setSelectedItem(docUid);
                setViewPdfModalVisible(true);

                // Fetch PDF file using MediaUID
                await fetchPdf(docResponse.data.MediaUID);
            }
        } catch (error) {
            console.error('Error viewing document:', error);
            setErrorMessage('Failed to view document. Please try again.');
        }
    };

    const handleDownload = () => {
        if (typeof window !== 'undefined') {
            if (watermarkedPdfUrl) {
                const link = document.createElement('a');
                link.href = watermarkedPdfUrl;
                link.setAttribute('download', currentDocumentData.Filename);
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
            }
        }
    };

    const fetchPdf = async (mediaUid) => {
        if (!mediaUid) {
            setErrorMessage('Document has no associated media file');
            return;
        }

        const API_URL = process.env.NEXT_PUBLIC_PUBLIC_URL;
        try {
            setDownloading(true);
            const response = await axios.get(`${API_URL}/mediaS3/${mediaUid}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setPdfBlobUrl(url);


            const fontUrl = 'https://pdf-lib.js.org/assets/ubuntu/Ubuntu-R.ttf';
            const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());
            const pdfBytes = await response.data.arrayBuffer();

            // Load the PDF
            const pdfDoc = await PDFDocument.load(pdfBytes);
            pdfDoc.registerFontkit(fontkit);

            // Embed the custom font
            const customFont = await pdfDoc.embedFont(fontBytes);

            // Add watermark to each page
            const pages = pdfDoc.getPages();
            const textSize = 10; // Font size for the text
            const borderPadding = 10; // Padding inside the border box

            const username = window.localStorage.getItem('Name')


            const watermarkText = [
                "",
                "Dana Pensiun PPIP",
                "Downloaded by:",
                username,
            ];

            pages.forEach((page) => {
                const { width, height } = page.getSize();

                // Determine the size of the text box
                const boxWidth = 200;
                const boxHeight = watermarkText.length * (textSize + 5) + borderPadding * 2;

                const boxX = 100;
                const boxY = height - 100;

                // Draw the border box
                page.drawRectangle({
                    x: boxX,
                    y: boxY,
                    width: boxWidth,
                    height: boxHeight,
                    borderWidth: 1,
                    borderColor: rgb(1, 0, 0),
                    opacity: 0.4,
                    rotate: degrees(5)
                });

                page.drawText("CONFIDENTAL DOCUMENT", {
                    x: boxX + borderPadding,
                    y: boxY + boxHeight - borderPadding - textSize * (0 + 1),
                    size: 12,
                    font: customFont,
                    color: rgb(1, 0, 0),
                    opacity: 0.4,
                    rotate: degrees(5)
                });

                // Add the watermark text inside the box
                watermarkText.forEach((line, index) => {
                    page.drawText(line, {
                        x: boxX + borderPadding,
                        y: boxY + boxHeight - borderPadding - textSize * (index + 2),
                        size: textSize,
                        font: customFont,
                        color: rgb(1, 0, 0),
                        opacity: 0.4,
                        rotate: degrees(5)
                    });
                });
            });

            const modifiedPdfBytes = await pdfDoc.save();
            const modifiedPdfBlob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
            const modifiedPdfUrl = window.URL.createObjectURL(modifiedPdfBlob);

            setWatermarkedPdfUrl(modifiedPdfUrl);
        } catch (error) {
            setPdfBlobUrl(null);
            console.log(error)
            setErrorMessage('Failed to download PDF file. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const handleUploadClick = () => {
        document.getElementById('fileInput').click();
    };

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setFile(e.target.files[0]);
            handleUpload(e.target.files[0]);
        }
    };

    const handleUpload = async (file) => {
        if (!file) return;

        setIsUploading(true);
        setErrorMessage('');

        try {
            // Get user UID from localStorage
            const ownerUid = localStorage.getItem('UserUID');
            if (!ownerUid) {
                throw new Error('User not authenticated');
            }

            // Upload to current folder
            await createDocument(file, file.name, currentFolder, ownerUid);
            await fetchFolderContents();
            // Refresh documents in the current folder
            // In a real implementation, you would fetch the updated documents
            setErrorMessage('File uploaded successfully!');
        } catch (error) {
            console.error('Error uploading document:', error);
            setErrorMessage('Failed to upload file. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            setErrorMessage('Folder name cannot be empty.');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');

        try {
            // Get user UID from localStorage
            const ownerUid = localStorage.getItem('UserUID');
            if (!ownerUid) {
                throw new Error('User not authenticated');
            }

            const response = await createDirectory({
                pathname: newFolderName, // API expects lowercase pathname
                parent_uid: currentFolder || null,
                owner_uid: ownerUid
            });

            if (response && response.data) {
                console.log('New folder created:', response.data);

                // Refresh the folder contents
                const dirResponse = await getChildDirectories(currentFolder, ownerUid);
                if (dirResponse && dirResponse.data) {
                    console.log('Folders received after create:', dirResponse.data);
                    // Ensure each folder has a UID property
                    const foldersWithUIDs = dirResponse.data.map(folder => {
                        // Check if this is the newly created folder
                        if (folder.Pathname === newFolderName) {
                            console.log('Found newly created folder:', folder);
                        }

                        if (!folder.UID && folder.uid) {
                            return { ...folder, UID: folder.uid };
                        } else if (!folder.uid && folder.UID) {
                            return { ...folder, uid: folder.UID };
                        }
                        return folder;
                    });
                    setFolders(foldersWithUIDs);
                }
                setShowNewFolderModal(false);
                setNewFolderName('');
                setErrorMessage('Folder created successfully!');
            }
        } catch (error) {
            console.error('Error creating folder:', error);
            setErrorMessage('Failed to create folder. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (item, type, e) => {
        if (e) e.stopPropagation();

        console.log('Edit item:', item);
        const itemUid = item.UID || item.uid;
        if (!itemUid) {
            console.error('Item missing UID:', item);
            setErrorMessage('Cannot edit this item: missing identifier');
            return;
        }

        setEditItem({ ...item, type, uid: itemUid });
        setEditName(type === 'folder' ? item.Pathname : (item.Filename || item.filename));
        setShowEditModal(true);
    };

    const handleEditSave = async () => {
        if (!editName.trim()) {
            setErrorMessage('Name cannot be empty.');
            return;
        }

        // Refresh documents using getDocuments service
        const ownerUid = localStorage.getItem('UserUID');

        setIsLoading(true);
        setErrorMessage('');

        try {
            if (editItem.type === 'folder') {
                console.log('Updating directory with UID:', editItem.uid);
                if (!editItem.uid) {
                    throw new Error('Cannot update directory: missing UID');
                }
                await updateDirectory(editItem.uid, { pathname: editName }); // API expects lowercase pathname

                // Refresh folders
                const dirResponse = await getChildDirectories(currentFolder, ownerUid);
                if (dirResponse && dirResponse.data) {
                    console.log('Folders received after update:', dirResponse.data);
                    // Ensure each folder has a UID property
                    const foldersWithUIDs = dirResponse.data.map(folder => {
                        if (!folder.UID && folder.uid) {
                            return { ...folder, UID: folder.uid };
                        } else if (!folder.uid && folder.UID) {
                            return { ...folder, uid: folder.UID };
                        }
                        return folder;
                    });
                    setFolders(foldersWithUIDs);
                }
            } else {
                await updateDocument(editItem.uid, { filename: editName });
                const docResponse = await getDocuments(currentFolder, ownerUid);
                if (docResponse && docResponse.data) {
                    setDocuments(docResponse.data);
                }
            }

            setShowEditModal(false);
            setEditItem(null);
            setEditName('');
            setErrorMessage('Item updated successfully!');
        } catch (error) {
            console.error('Error updating item:', error);
            setErrorMessage('Failed to update item. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = async (item, type, e) => {
        if (e) e.stopPropagation();

        if (!confirm(`Are you sure you want to delete this ${type}?`)) {
            return;
        }

        const ownerUid = localStorage.getItem('UserUID');

        setIsLoading(true);
        setErrorMessage('');

        try {
            if (type === 'folder') {
                const folderUid = item.UID || item.uid;
                console.log('Deleting folder with UID:', folderUid, 'Item:', item);

                if (!folderUid) {
                    throw new Error('Cannot delete folder: missing UID');
                }

                await deleteDirectory(folderUid);

                // Refresh folders
                const dirResponse = await getChildDirectories(currentFolder, ownerUid);
                if (dirResponse && dirResponse.data) {
                    console.log('Folders received after delete:', dirResponse.data);
                    // Ensure each folder has a UID property
                    const foldersWithUIDs = dirResponse.data.map(folder => {
                        if (!folder.UID && folder.uid) {
                            return { ...folder, UID: folder.uid };
                        } else if (!folder.uid && folder.UID) {
                            return { ...folder, uid: folder.UID };
                        }
                        return folder;
                    });
                    setFolders(foldersWithUIDs);
                }
            } else {
                const docUid = item.UID || item.uid;
                if (!docUid) {
                    throw new Error('Cannot delete document: missing UID');
                }

                await deleteDocument(docUid);

                // Refresh documents using getDocuments service
                const docResponse = await getDocuments(currentFolder, ownerUid);
                if (docResponse && docResponse.data) {
                    // Check if response.data is an array
                    if (Array.isArray(docResponse.data)) {
                        setDocuments(docResponse.data);
                    } else if (docResponse.data.data && Array.isArray(docResponse.data.data)) {
                        // Some APIs wrap the data in a data property
                        setDocuments(docResponse.data.data);
                    } else {
                        console.error('Unexpected document response format:', docResponse.data);
                        setDocuments([]);
                    }
                } else {
                    setDocuments([]);
                }
            }

            setErrorMessage(`${type === 'folder' ? 'Folder' : 'Document'} deleted successfully!`);
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            setErrorMessage(`Failed to delete ${type}. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter documents based on search query
    const filteredDocuments = documents.filter(doc => {
        const filename = (doc.Filename || doc.filename || '').toLowerCase();
        const description = (doc.Description || doc.description || '').toLowerCase();
        return filename.includes(searchQuery.toLowerCase()) || description.includes(searchQuery.toLowerCase());
    });

    return (
        <div className="container mx-auto">
            <h1 className="text-2xl font-bold mb-6">Arsip Dokumen</h1>

            <div className="bg-white rounded-lg shadow p-4">
                {/* Breadcrumb and navigation */}
                <div className="flex items-center mb-4 space-x-2">
                    {folderHistory.length > 1 && (
                        <button
                            onClick={navigateBack}
                            className="p-2 rounded-full hover:bg-gray-100"
                            title="Go back"
                            disabled={isLoading}
                        >
                            <MdArrowBack />
                        </button>
                    )}

                    <div className="flex items-center space-x-2 overflow-x-auto">
                        {folderBreadcrumb.map((item, index) => (
                            <div key={item.uid || 'root'} className="flex items-center whitespace-nowrap">
                                {index > 0 && <span className="mx-1 text-gray-400">/</span>}
                                <span
                                    className={`cursor-pointer hover:text-blue-500 ${currentFolder === item.uid ? 'font-semibold' : ''}`}
                                    onClick={() => {
                                        const newHistory = folderHistory.slice(0, folderHistory.indexOf(item.uid) + 1);
                                        if (newHistory.length === 0) newHistory.push('');
                                        setFolderHistory(newHistory);
                                        setCurrentFolder(item.uid);
                                        updateBreadcrumb(item.uid);
                                    }}
                                >
                                    {item.Pathname}
                                </span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={async () => {
                            await fetchFolderContents();
                        }}
                        className="ml-auto p-2 rounded-full hover:bg-gray-100"
                        title="Refresh"
                        disabled={isLoading}
                    >
                        <MdRefresh />
                    </button>
                </div>

                {/* Error/success message */}
                {errorMessage && (
                    <div className={`mb-4 p-3 rounded ${errorMessage.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {errorMessage}
                    </div>
                )}

                {/* Upload button and search */}
                <div className="mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex space-x-2">
                        <button
                            onClick={handleUploadClick}
                            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
                            disabled={isLoading || isUploading}
                        >
                            <MdOutlineUpload className="mr-2" />
                            {isUploading ? 'Uploading...' : 'Upload PDF'}
                        </button>

                        <button
                            onClick={() => setShowNewFolderModal(true)}
                            className="bg-green-500 text-white px-4 py-2 rounded flex items-center"
                            disabled={isLoading}
                        >
                            <MdAdd className="mr-2" /> New Folder
                        </button>
                    </div>

                    <input
                        type="file"
                        id="fileInput"
                        className="hidden"
                        accept="application/pdf"
                        onChange={handleFileChange}
                    />
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        {/* Folder grid view */}
                        {folders.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold mb-2">Folders</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {folders.map((folder) => (
                                        <div
                                            key={folder.uid || folder.UID}
                                            className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedItem === (folder.uid || folder.UID) ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                                            onClick={() => setSelectedItem(folder.uid || folder.UID)}
                                            onDoubleClick={() => handleDoubleClick(folder, 'folder')}
                                        >
                                            <div className="text-yellow-500 mb-2">
                                                <MdFolder size={48} />
                                            </div>
                                            <div className="text-center text-sm truncate w-full" title={folder.Pathname}>
                                                {folder.Pathname}
                                            </div>
                                            {selectedItem === (folder.uid || folder.UID) && (
                                                <div className="flex mt-2 space-x-2">
                                                    <button
                                                        className="text-green-500 hover:text-green-700 p-1"
                                                        onClick={(e) => handleEditClick(folder, 'folder', e)}
                                                    >
                                                        <MdEdit size={16} />
                                                    </button>
                                                    <button
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                        onClick={(e) => handleDeleteClick(folder, 'folder', e)}
                                                    >
                                                        <MdDelete size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Files section */}
                        {filteredDocuments.length > 0 ? (
                            <div>
                                <h2 className="text-lg font-semibold mb-2">Files</h2>
                                {viewMode === 'grid' ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {filteredDocuments.map((doc) => (
                                            <div
                                                key={doc.UID || doc.uid}
                                                className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedItem === (doc.UID || doc.uid) ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                                                onClick={() => setSelectedItem(doc.UID || doc.uid)}
                                                onDoubleClick={() => handleDoubleClick(doc, 'document')}
                                            >
                                                <div className="text-red-500 mb-2">
                                                    <MdInsertDriveFile size={48} />
                                                </div>
                                                <div className="text-center text-sm truncate w-full" title={doc.Filename || doc.filename}>
                                                    {doc.Filename || doc.filename}
                                                </div>
                                                {selectedItem === (doc.UID || doc.uid) && (
                                                    <div className="flex mt-2 space-x-2">
                                                        <button
                                                            className="text-green-500 hover:text-green-700 p-1"
                                                            onClick={(e) => handleEditClick(doc, 'document', e)}
                                                        >
                                                            <MdEdit size={16} />
                                                        </button>
                                                        <button
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                            onClick={(e) => handleDeleteClick(doc, 'document', e)}
                                                        >
                                                            <MdDelete size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">File Name</th>
                                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                                                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {filteredDocuments.map((doc) => (
                                                    <tr
                                                        key={doc.UID || doc.uid}
                                                        className={`hover:bg-blue-50 cursor-pointer ${selectedItem === (doc.UID || doc.uid) ? 'bg-blue-100' : ''}`}
                                                        onClick={() => setSelectedItem(doc.UID || doc.uid)}
                                                        onDoubleClick={() => handleDoubleClick(doc, 'document')}
                                                    >
                                                        <td className="px-6 py-4 text-blue-600 flex items-center">
                                                            <MdInsertDriveFile className="mr-2 text-red-500" />
                                                            {doc.Filename || doc.filename}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {doc.Description || doc.description || ''}
                                                        </td>
                                                        <td className="px-6 py-4 flex justify-center space-x-2">
                                                            <button
                                                                className="text-green-500 hover:text-green-700"
                                                                onClick={(e) => handleEditClick(doc, 'document', e)}
                                                            >
                                                                <MdEdit size={20} />
                                                            </button>
                                                            <button
                                                                className="text-red-500 hover:text-red-700"
                                                                onClick={(e) => handleDeleteClick(doc, 'document', e)}
                                                            >
                                                                <MdDelete size={20} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Pagination */}
                                {filteredDocuments.length > 10 && (
                                    <div className="mt-4 flex justify-end">
                                        <div className="flex space-x-1">
                                            <button className="px-3 py-1 border rounded text-gray-500 hover:bg-gray-100">Previous</button>
                                            <button className="px-3 py-1 border rounded bg-blue-500 text-white">1</button>
                                            <button className="px-3 py-1 border rounded text-gray-500 hover:bg-gray-100">Next</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                {folders.length === 0 ? 'This folder is empty.' : 'No files in this folder.'}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* New Folder Modal */}
            {showNewFolderModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Buat Folder Baru</h3>
                        <input
                            type="text"
                            placeholder="Folder Name"
                            className="border rounded px-4 py-2 w-full mb-4"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 border rounded text-gray-500 hover:bg-gray-100"
                                onClick={() => {
                                    setShowNewFolderModal(false);
                                    setNewFolderName('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                onClick={handleCreateFolder}
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">
                            {editItem?.type === 'folder' ? 'Edit Nama Folder' : 'Edit Nama Dokumen'}
                        </h3>
                        <input
                            type="text"
                            placeholder="Name"
                            className="border rounded px-4 py-2 w-full mb-4"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 border rounded text-gray-500 hover:bg-gray-100"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditItem(null);
                                    setEditName('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                onClick={handleEditSave}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Viewer Modal */}
            {viewPdfModalVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-[90%] h-[90%] max-w-5xl relative">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                {currentDocumentData?.Filename || 'Document Viewer'}
                            </h3>
                            <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => {
                                    setViewPdfModalVisible(false);
                                    setPdfBlobUrl(null);
                                }}
                            >
                                <MdClose size={24} />
                            </button>
                        </div>
                        <div className="h-[calc(100%-60px)] overflow-auto">
                            {downloading ? (
                                <div className="flex justify-center items-center h-full">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                                    <span className="ml-3">Loading PDF...</span>
                                </div>
                            ) : pdfBlobUrl ? (
                                <div style={{ marginTop: '20px' }}>
                                    <button
                                        className={'p-3 text-sm font-semibold ' + (downloading ? "bg-gray-100 text-gray-300" : "bg-blue-100")}
                                        onClick={handleDownload}
                                        disabled={downloading}
                                    >
                                        {downloading ? "Downloading..." : "Download Lampiran"}
                                    </button>
                                    <h3>PDF Preview:</h3>
                                    <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                                        <div
                                            style={{
                                                border: '1px solid rgba(0, 0, 0, 0.3)',
                                                height: '750px',
                                            }}
                                        >
                                            <Viewer fileUrl={pdfBlobUrl} />
                                        </div>
                                    </Worker>
                                </div>
                            ) : (
                                <div className="flex justify-center items-center h-full text-red-500">
                                    Failed to load PDF. Please try again.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}