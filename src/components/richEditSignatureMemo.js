"use client";

import { useEffect, useRef, useState } from "react";
import "devextreme/dist/css/dx.light.css";
import "devexpress-richedit/dist/dx.richedit.css";
import {
  create,
  createOptions,
  ViewType,
  RichEditUnit,
  RichEditClientCommand,
} from "devexpress-richedit";
import { message, Spin } from "antd";

export default function RichEditSignatureMemoComponent({
  currentDocument,
  setCurrentDocument,
  signatureDocument,
  messageNumberDocument,
  messageClassification,
  triggerSave,
  triggerSignature,
  onSaveComplete
}) {
  const [loadingGenerate, setLoadingGenerate] = useState(false)

  const richEditRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isAbleSave, setIsAbleSave] = useState()

  useEffect(() => {
    if (typeof window !== "undefined" && !isEditorReady) {
      const options = createOptions();
      options.bookmarks.color = "#ff0000";
      options.confirmOnLosingChanges.enabled = false;
      options.fields.updateFieldsBeforePrint = true;
      options.fields.updateFieldsOnPaste = true;
      options.mailMerge.activeRecord = 2;
      options.mailMerge.viewMergedData = true;
      options.bookmarks.visibility = true;

      options.unit = RichEditUnit.Inch;
      options.view.viewType = ViewType.PrintLayout;
      options.view.simpleViewSettings.paddings = {
        left: 15,
        top: 15,
        right: 15,
        bottom: 15,
      };
      options.exportUrl = "https://siteurl.com/api/";
      options.exportFormats = ["pdf"];

      options.downloadPdfEnabled = true; // Enable only PDF downloads
      options.downloadDocxEnabled = false; // Disable DOCX downloads
      options.downloadRtfEnabled = false; // Disable RTF downloads

      options.readOnly = false;
      options.width = "100%";
      options.height = "600px";

      const richEditor = create(document.getElementById("richEditSignatureMemo"), options);
      richEditRef.current = richEditor;
      setIsEditorReady(true);
      setIsAbleSave(true)
    }
  }, [isEditorReady]);



  useEffect(() => {
    if (isEditorReady && currentDocument) {
      if (currentDocument !== "blank") {
        richEditRef.current.openDocument(currentDocument, "DocumentName", 4);
      }
    }
  }, [isEditorReady, currentDocument]);


  useEffect(() => {
    setTimeout(() => {
      if (isEditorReady && messageNumberDocument) {
        setLoadingGenerate(true)
        if (messageNumberDocument) {
          richEditRef.current._native.core.searchManager.replaceAll("[NO_SURAT]", messageNumberDocument, true)
        }

        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0'); // Get the day (with leading zero)
        const monthIndex = today.getMonth(); // Get the month index (0-indexed)
        const year = today.getFullYear(); // Get the full year

        // Array of Indonesian month names
        const monthNamesIndonesian = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        // Get the month name in Indonesian
        const month = monthNamesIndonesian[monthIndex];

        // Format the date
        const formattedDate = `${day} ${month} ${year}`;

        richEditRef.current._native.core.searchManager.replaceAll("[TGL_SURAT]", formattedDate, true)
        richEditRef.current._native.core.searchManager.findAll("[TTD]", true)
        setTimeout(() => {
          const listOfSignatureIndex = richEditRef.current._native.core.searchManager.foundIntervals
          const subDocument = richEditRef.current.selection.activeSubDocument;

          listOfSignatureIndex.map((record) => {
            subDocument.insertPicture(record.start, signatureDocument);
          })
          richEditRef.current._native.core.searchManager.replaceAll("[TTD]", " ", true)
          setLoadingGenerate(false)
        }, 2000)
      }

    }, 1000)


  }, [isEditorReady, triggerSignature])


  useEffect(() => {
    if (isAbleSave) {
      // progress the saving state
      setIsAbleSave(false);

      try {
        const textMessage = richEditRef.current.document.getText()

        function isEmptyOrWhitespace(str) {
          return !str || str.trim() === '';
        }

        if (isEmptyOrWhitespace(textMessage)) {
          message.error("Template is empty or only whitespace characters")
        }

        richEditRef.current.exportToBase64(function (documentAsBase64) {
          onSaveComplete(documentAsBase64);
        });


      } catch (error) {
        console.log(error)
      }

      setIsAbleSave(true); // Reset saving state
    }
  }, [triggerSave])


  return (
    <Spin spinning={loadingGenerate} tip="Sedang menggenerate signature, mohon tunggu...">
      <div>

        <div ref={richEditRef} id="richEditSignatureMemo"></div>


      </div>
    </Spin>
  );
}
