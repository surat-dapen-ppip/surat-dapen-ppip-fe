"use client";

import { useEffect, useRef, useState } from 'react';
import 'devextreme/dist/css/dx.light.css';
import 'devexpress-richedit/dist/dx.richedit.css';
import { create, createOptions, ViewType, RichEditUnit } from 'devexpress-richedit';
import { message } from 'antd';

export default function RichEditReviewComponent({
  currentDocument,
  setCurrentDocument,
  triggerSave,
  triggerReset,
  triggerUpdate,
  onSaveComplete,
  messageClassification,
  isReviewerEnabled
}) {
  const richEditRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isEditorReady) {
      const options = createOptions();
      options.bookmarks.color = '#ff0000';
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
      options.exportUrl = 'https://siteurl.com/api/';
      options.exportFormats = ['pdf'];

      options.downloadPdfEnabled = true; // Enable only PDF downloads
      options.downloadDocxEnabled = false; // Disable DOCX downloads
      options.downloadRtfEnabled = false; // Disable RTF downloads

      options.readOnly = false;
      options.width = '100%';
      options.height = '600px';

      const richEditor = create(document.getElementById("richEdit"), options);
      richEditRef.current = richEditor;

      setIsEditorReady(true);
      setIsAbleSave(true)
    }
  }, [isEditorReady]);

  useEffect(() => {
    if (isEditorReady && currentDocument) {
      if (currentDocument !== "blank") {
        richEditRef.current.openDocument(currentDocument, "DocumentName", 4);
        setTimeout(() => {
          const subDocument = richEditRef.current.selection.activeSubDocument;
          const position = subDocument.length - 1;
          subDocument.insertText(position, ' ');
        }, 500);
      } else {
        richEditRef.current.newDocument();
      }

      if(isReviewerEnabled != true){
        setCurrentDocument("blank");
      }
      
    }
  }, [isEditorReady, currentDocument]);



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

        function checkString(inputString, messageClassification) {
          let requiredTags = ""

          if (messageClassification == 1) {
            requiredTags = ["[NO_SURAT]", "[TGL_SURAT]"];
          } else if (messageClassification == 2) {
            requiredTags = ["[NO_SURAT]", "[TTD]", "[TGL_SURAT]"];
          } else {
            return false
          }
          return requiredTags.every(tag => inputString.includes(tag));
        }

        function getErrorMessage(messageClassification) {
          let errorMessage = ""
          if (messageClassification == 1) {
            errorMessage = "Tolong lengkapi FLAG [NO_SURAT] dan [TGL_SURAT]"
          } else if (messageClassification == 2) {
            errorMessage = "Tolong lengkapi FLAG [NO_SURAT], [TTD] dan [TGL_SURAT]"
          }
          message.error(errorMessage)
        }


        if (checkString(textMessage, messageClassification)) {
          richEditRef.current.exportToBase64(function (documentAsBase64) {
            onSaveComplete(documentAsBase64);
          });
        } else {
          getErrorMessage(messageClassification)
        }
      } catch (error) {
        console.log(error)
      }

      setIsAbleSave(true); // Reset saving state
    }
  }, [triggerSave])


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

        function checkString(inputString, messageClassification) {
          let requiredTags = ""

          if (messageClassification == 1) {
            requiredTags = ["[NO_SURAT]", "[TGL_SURAT]"];
          } else if (messageClassification == 2) {
            requiredTags = ["[NO_SURAT]", "[TTD]", "[TGL_SURAT]"];
          } else {
            return false
          }
          return requiredTags.every(tag => inputString.includes(tag));
        }

        function getErrorMessage(messageClassification) {
          let errorMessage = ""
          if (messageClassification == 1) {
            errorMessage = "Tolong lengkapi FLAG [NO_SURAT] dan [TGL_SURAT]"
          } else if (messageClassification == 2) {
            errorMessage = "Tolong lengkapi FLAG [NO_SURAT], [TTD] dan [TGL_SURAT]"
          }
          message.error(errorMessage)
        }


        if (checkString(textMessage, messageClassification)) {
          richEditRef.current.exportToBase64(function (documentAsBase64) {
            setCurrentDocument(documentAsBase64)
          });
        } else {
          getErrorMessage(messageClassification)
        }
      } catch (error) {
        console.log(error)
      }

      setIsAbleSave(true); // Reset saving state
    }
  }, [triggerUpdate])

  return (
    <div>
      <div ref={richEditRef} id="richEdit"></div>
    </div>
  );
}
