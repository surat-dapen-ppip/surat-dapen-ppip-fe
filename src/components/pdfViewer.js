"use client";

import { useState } from 'react';
import { Spin } from 'antd';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

/**
 * PDF Viewer component that uses react-pdf
 * @param {Object} props Component props
 * @param {string} props.fileUrl URL to the PDF file
 */
export default function PdfViewer({ fileUrl }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if the URL is a blob URL
  const isBlobUrl = fileUrl && typeof fileUrl === 'string' && fileUrl.startsWith('blob:');

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setIsLoading(false);
  }

  function onDocumentLoadError(error) {
    console.error('Error loading PDF:', error);
    // We'll suppress the error message since the PDF might still be visible
    // Just log the error to console for debugging
    setIsLoading(false);
  }

  function changePage(offset) {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  return (
    <div className="pdf-viewer-container">
      {isLoading && (
        <div className="flex justify-center items-center" style={{ height: '100px' }}>
          <Spin tip="Loading PDF..." />
        </div>
      )}

      {/* Only show error if explicitly set and no pages loaded */}
      {error && !numPages && (
        <div className="flex justify-center items-center text-red-500" style={{ height: '100px' }}>
          {error}
        </div>
      )}
      
      <div className="flex flex-col items-center" style={{ 
        border: '1px solid rgba(0, 0, 0, 0.3)',
        width: '100%',
        minHeight: '750px',
        padding: '20px',
        backgroundColor: '#f5f5f5'
      }}>
        {fileUrl && (
          <Document
            file={isBlobUrl ? { url: fileUrl } : fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<Spin tip="Loading PDF..." />}
            options={{
              cMapPacked: false
            }}
          >
          <Page 
            pageNumber={pageNumber} 
            renderTextLayer={true}
            renderAnnotationLayer={true}
            width={typeof window !== 'undefined' ? (window.innerWidth > 1000 ? 800 : window.innerWidth - 100) : 800}
          />
          </Document>
        )}

        {!isLoading && numPages > 0 && (
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={previousPage}
              disabled={pageNumber <= 1}
              className={`px-4 py-2 rounded ${pageNumber <= 1 ? 'bg-gray-300' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              Previous
            </button>
            <p>
              Page {pageNumber} of {numPages}
            </p>
            <button
              onClick={nextPage}
              disabled={pageNumber >= numPages}
              className={`px-4 py-2 rounded ${pageNumber >= numPages ? 'bg-gray-300' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}