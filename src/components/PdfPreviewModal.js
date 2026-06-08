'use client'

import { useEffect, useState } from 'react';
import axios from 'axios';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { MdClose } from 'react-icons/md';
import { formatCurrentWIBTimestamp } from '@/utils/utility';

/**
 * Reusable PDF Preview Modal.
 *
 * Props:
 * - open (bool)        : visibility of modal
 * - onClose (fn)       : close handler
 * - mediaUid (string)  : MediaUID to fetch from `${NEXT_PUBLIC_PUBLIC_URL}/mediaS3/{uid}`
 * - filename (string)  : displayed title and download filename
 */
export default function PdfPreviewModal({ open, onClose, mediaUid, filename }) {
    const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
    const [watermarkedPdfUrl, setWatermarkedPdfUrl] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [isDownloadInProgress, setIsDownloadInProgress] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const cleanupUrls = () => {
        setPdfBlobUrl((prev) => {
            if (prev) {
                try { window.URL.revokeObjectURL(prev); } catch (e) { /* noop */ }
            }
            return null;
        });
        setWatermarkedPdfUrl((prev) => {
            if (prev) {
                try { window.URL.revokeObjectURL(prev); } catch (e) { /* noop */ }
            }
            return null;
        });
    };

    useEffect(() => {
        if (!open || !mediaUid) {
            return undefined;
        }

        let cancelled = false;
        const API_URL = process.env.NEXT_PUBLIC_PUBLIC_URL;

        const fetchPdf = async () => {
            try {
                setErrorMessage('');
                setDownloading(true);

                const response = await axios.get(`${API_URL}/mediaS3/${mediaUid}`, {
                    responseType: 'blob',
                });

                if (cancelled) return;

                const previewUrl = window.URL.createObjectURL(new Blob([response.data]));
                if (cancelled) {
                    window.URL.revokeObjectURL(previewUrl);
                    return;
                }
                setPdfBlobUrl(previewUrl);

                // Build watermarked version for download
                const fontUrl = 'https://pdf-lib.js.org/assets/ubuntu/Ubuntu-R.ttf';
                const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());
                const pdfBytes = await response.data.arrayBuffer();

                const pdfDoc = await PDFDocument.load(pdfBytes);
                pdfDoc.registerFontkit(fontkit);
                const customFont = await pdfDoc.embedFont(fontBytes);

                const pages = pdfDoc.getPages();
                const textSize = 10;
                const borderPadding = 10;
                const username = window.localStorage.getItem('Name');
                const downloadTimestamp = formatCurrentWIBTimestamp();

                const watermarkText = [
                    "",
                    "Dana Pensiun PPIP - PUSRI",
                    "Downloaded by:",
                    username || '-',
                    "Downloaded at:",
                    downloadTimestamp,
                ];

                pages.forEach((page) => {
                    const { height } = page.getSize();
                    const boxWidth = 200;
                    const boxHeight = watermarkText.length * (textSize + 5) + borderPadding * 2;
                    const boxX = 100;
                    const boxY = height - boxHeight - 100;

                    page.drawRectangle({
                        x: boxX,
                        y: boxY,
                        width: boxWidth,
                        height: boxHeight,
                        borderWidth: 1,
                        borderColor: rgb(1, 0, 0),
                        opacity: 0.4,
                        rotate: degrees(5),
                    });

                    page.drawText("CONFIDENTAL DOCUMENT", {
                        x: boxX + borderPadding,
                        y: boxY + boxHeight - borderPadding - textSize,
                        size: 12,
                        font: customFont,
                        color: rgb(1, 0, 0),
                        opacity: 0.4,
                        rotate: degrees(5),
                    });

                    watermarkText.forEach((line, index) => {
                        page.drawText(line || '', {
                            x: boxX + borderPadding,
                            y: boxY + boxHeight - borderPadding - textSize * (index + 2),
                            size: textSize,
                            font: customFont,
                            color: rgb(1, 0, 0),
                            opacity: 0.4,
                            rotate: degrees(5),
                        });
                    });
                });

                const modifiedPdfBytes = await pdfDoc.save();
                if (cancelled) return;

                const modifiedPdfBlob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
                const modifiedPdfUrl = window.URL.createObjectURL(modifiedPdfBlob);
                setWatermarkedPdfUrl(modifiedPdfUrl);
            } catch (error) {
                console.error('Error loading PDF preview:', error);
                if (!cancelled) {
                    setErrorMessage('Gagal memuat PDF. Silakan coba lagi.');
                }
            } finally {
                if (!cancelled) {
                    setDownloading(false);
                }
            }
        };

        fetchPdf();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, mediaUid]);

    // Cleanup object URLs when modal closes
    useEffect(() => {
        if (!open) {
            cleanupUrls();
            setErrorMessage('');
            setIsDownloadInProgress(false);
        }
    }, [open]);

    const handleDownload = () => {
        if (typeof window === 'undefined') return;
        if (!watermarkedPdfUrl) return;

        setIsDownloadInProgress(true);
        const link = document.createElement('a');
        link.href = watermarkedPdfUrl;
        link.setAttribute('download', filename || 'document.pdf');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);

        setTimeout(() => setIsDownloadInProgress(false), 500);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-lg p-6 w-[90%] h-[90%] max-w-5xl relative flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold truncate pr-4">
                        {filename || 'Document Viewer'}
                    </h3>
                    <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700"
                        onClick={onClose}
                        aria-label="Tutup preview"
                    >
                        <MdClose size={24} />
                    </button>
                </div>
                <div className="flex-1 overflow-auto">
                    {downloading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                            <span className="ml-3">Loading PDF...</span>
                        </div>
                    ) : errorMessage ? (
                        <div className="flex justify-center items-center h-full text-red-500">
                            {errorMessage}
                        </div>
                    ) : pdfBlobUrl ? (
                        <div style={{ marginTop: '8px' }}>
                            <button
                                type="button"
                                className={'p-3 text-sm font-semibold rounded ' + (isDownloadInProgress || !watermarkedPdfUrl ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-blue-100 hover:bg-blue-200')}
                                onClick={handleDownload}
                                disabled={downloading || isDownloadInProgress || !watermarkedPdfUrl}
                            >
                                <span className="flex items-center justify-center">
                                    {isDownloadInProgress ? 'Menyiapkan download...' : 'Download Lampiran'}
                                    {isDownloadInProgress && (
                                        <span className="ml-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    )}
                                </span>
                            </button>
                            <h3 className="mt-3 mb-2 text-sm font-medium text-gray-700">PDF Preview:</h3>
                            <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                                <div style={{ border: '1px solid rgba(0, 0, 0, 0.3)', height: '750px' }}>
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
    );
}
