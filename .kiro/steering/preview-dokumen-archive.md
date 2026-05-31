---
inclusion: manual
---

# Pola Preview Dokumen — Referensi dari `src/app/admin/archive/ArchivePageClient.js`

Catatan ini merangkum cara kerja preview dokumen PDF pada halaman Archive supaya bisa direplikasi di menu lain (misal `suratMasuk`, `suratKeluar`, `inbox`, dll.). Pakai sebagai panduan implementasi standar.

## 1. Dependensi yang Wajib Ada

```js
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import axios from 'axios';
import { MdClose } from 'react-icons/md';
import { formatCurrentWIBTimestamp } from '@/utils/utility';
```

Catatan:
- `pdf-lib` + `@pdf-lib/fontkit` dipakai untuk menambah watermark sebelum download.
- `@react-pdf-viewer/core` dipakai untuk render preview di modal.
- Worker pakai CDN: `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`.

## 2. State yang Diperlukan

```js
const [viewPdfModalVisible, setViewPdfModalVisible] = useState(false);
const [pdfBlobUrl, setPdfBlobUrl] = useState(null);            // URL untuk preview (tanpa watermark)
const [watermarkedPdfUrl, setWatermarkedPdfUrl] = useState(null); // URL untuk download (sudah watermark)
const [downloading, setDownloading] = useState(false);          // loading saat fetch + bikin watermark
const [isDownloadInProgress, setIsDownloadInProgress] = useState(false);
const [currentDocumentData, setCurrentDocumentData] = useState(null); // metadata dokumen aktif
const [errorMessage, setErrorMessage] = useState('');
```

## 3. Alur Preview

1. User klik/double-click item dokumen → panggil `handleViewDocument(item)`.
2. Ambil detail dokumen via service (di archive: `getDocumentByUid(uid)`), set `currentDocumentData`, buka modal (`setViewPdfModalVisible(true)`).
3. Panggil `fetchPdf(MediaUID)` untuk:
   - GET blob PDF dari `${NEXT_PUBLIC_PUBLIC_URL}/mediaS3/${mediaUid}` (`responseType: 'blob'`).
   - Buat object URL untuk preview → `setPdfBlobUrl`.
   - Load font Ubuntu (`https://pdf-lib.js.org/assets/ubuntu/Ubuntu-R.ttf`), embed via `fontkit`.
   - Tambah watermark ke semua halaman, save → buat object URL untuk download → `setWatermarkedPdfUrl`.

### Snippet `handleViewDocument`

```js
const handleViewDocument = async (document) => {
    try {
        const docUid = document.UID || document.uid;
        if (!docUid) throw new Error('Cannot view document: missing UID');

        const docResponse = await getDocumentByUid(docUid); // ganti service sesuai menu
        if (docResponse && docResponse.data) {
            setCurrentDocumentData(docResponse.data);
            setViewPdfModalVisible(true);
            await fetchPdf(docResponse.data.MediaUID);
        }
    } catch (error) {
        console.error('Error viewing document:', error);
        setErrorMessage('Failed to view document. Please try again.');
    }
};
```

### Snippet `fetchPdf` (preview + watermark untuk download)

```js
const fetchPdf = async (mediaUid) => {
    if (!mediaUid) {
        setErrorMessage('Document has no associated media file');
        return;
    }
    const API_URL = process.env.NEXT_PUBLIC_PUBLIC_URL;
    try {
        setDownloading(true);
        const response = await axios.get(`${API_URL}/mediaS3/${mediaUid}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        setPdfBlobUrl(url);

        // --- watermark untuk versi download ---
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
                x: boxX, y: boxY, width: boxWidth, height: boxHeight,
                borderWidth: 1, borderColor: rgb(1, 0, 0),
                opacity: 0.4, rotate: degrees(5),
            });

            page.drawText("CONFIDENTAL DOCUMENT", {
                x: boxX + borderPadding,
                y: boxY + boxHeight - borderPadding - textSize,
                size: 12, font: customFont, color: rgb(1, 0, 0),
                opacity: 0.4, rotate: degrees(5),
            });

            watermarkText.forEach((line, index) => {
                page.drawText(line, {
                    x: boxX + borderPadding,
                    y: boxY + boxHeight - borderPadding - textSize * (index + 2),
                    size: textSize, font: customFont, color: rgb(1, 0, 0),
                    opacity: 0.4, rotate: degrees(5),
                });
            });
        });

        const modifiedPdfBytes = await pdfDoc.save();
        const modifiedPdfBlob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        setWatermarkedPdfUrl(window.URL.createObjectURL(modifiedPdfBlob));
    } catch (error) {
        setPdfBlobUrl(null);
        setErrorMessage('Failed to download PDF file. Please try again.');
    } finally {
        setDownloading(false);
    }
};
```

### Snippet `handleDownload`

```js
const handleDownload = () => {
    if (typeof window === 'undefined') return;
    if (!watermarkedPdfUrl) return;

    setIsDownloadInProgress(true);
    const link = document.createElement('a');
    link.href = watermarkedPdfUrl;
    link.setAttribute('download', currentDocumentData?.Filename || 'document.pdf');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);

    setTimeout(() => setIsDownloadInProgress(false), 500);
};
```

## 4. Markup Modal Preview

```jsx
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
                        setWatermarkedPdfUrl(null);
                    }}
                >
                    <MdClose size={24} />
                </button>
            </div>
            <div className="h-[calc(100%-60px)] overflow-auto">
                {downloading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
                        <span className="ml-3">Loading PDF...</span>
                    </div>
                ) : pdfBlobUrl ? (
                    <div style={{ marginTop: '20px' }}>
                        <button
                            className={'p-3 text-sm font-semibold ' + (isDownloadInProgress ? 'bg-gray-100 text-gray-300' : 'bg-blue-100')}
                            onClick={handleDownload}
                            disabled={downloading || isDownloadInProgress}
                        >
                            <span className="flex items-center justify-center">
                                {isDownloadInProgress ? 'Menyiapkan download...' : 'Download Lampiran'}
                                {isDownloadInProgress && (
                                    <span className="ml-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                )}
                            </span>
                        </button>
                        <h3>PDF Preview:</h3>
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
)}
```

## 5. Catatan Adaptasi untuk Menu Lain

- **Sumber dokumen**: ganti `getDocumentByUid` dengan service yang relevan (`getMessageByUid`, dsb.) tetapi pastikan ada `MediaUID` (atau properti setara) untuk dipanggil ke `/mediaS3/{uid}`.
- **Filename**: pakai field yang tersedia di payload (`Filename`, `AttachmentName`, `Subject + .pdf`, dll.) saat set `download` attribute.
- **Cleanup**: saat menutup modal, sebaiknya `URL.revokeObjectURL(pdfBlobUrl)` dan `URL.revokeObjectURL(watermarkedPdfUrl)` untuk mencegah memory leak; minimal reset `setPdfBlobUrl(null)` dan `setWatermarkedPdfUrl(null)`.
- **File non-PDF**: implementasi ini hanya menangani PDF. Untuk attachment lain (docx, gambar), perlu pengecekan MIME / ekstensi sebelum render `Viewer`.
- **Endpoint**: pastikan `NEXT_PUBLIC_PUBLIC_URL` sudah diset di `.env`. Endpoint `/mediaS3/{uid}` mengembalikan blob biner.
- **Identitas watermark**: `username` diambil dari `localStorage.getItem('Name')`, timestamp dari `formatCurrentWIBTimestamp()`.
- **Error UX**: pakai `errorMessage` untuk menampilkan pesan gagal; di archive masih `setErrorMessage` saja, bisa diganti toast jika menu target sudah pakai toast.
- **Worker**: pakai CDN unpkg `pdfjs-dist@3.11.174`; pastikan versi konsisten dengan `@react-pdf-viewer/core` yang terinstall di `package.json`.

## 6. Checklist Saat Replikasi

- [ ] Tambah import (`pdf-lib`, `fontkit`, `@react-pdf-viewer/core`, css-nya, axios, MdClose, `formatCurrentWIBTimestamp`).
- [ ] Tambah 6 state preview (`viewPdfModalVisible`, `pdfBlobUrl`, `watermarkedPdfUrl`, `downloading`, `isDownloadInProgress`, `currentDocumentData`).
- [ ] Tambah handler `handleViewDocument`, `fetchPdf`, `handleDownload`.
- [ ] Hubungkan trigger preview pada baris/aksi list dokumen.
- [ ] Render modal preview di akhir JSX.
- [ ] Verifikasi env `NEXT_PUBLIC_PUBLIC_URL` tersedia.
- [ ] Pastikan service ambil detail dokumen mengembalikan `MediaUID` + `Filename`.
