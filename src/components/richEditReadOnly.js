"use client";

import { useEffect, useRef, useState } from 'react';
import 'devextreme/dist/css/dx.light.css';
import 'devexpress-richedit/dist/dx.richedit.css';
import { create, createOptions, ViewType, RichEditUnit } from 'devexpress-richedit';

export default function RichEditReadOnlyComponent({
  currentDocument,
  setCurrentDocument,
  triggerSave,
  triggerReset,
  onSaveComplete,
}) {
  const richEditRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Track the save process

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

      options.readOnly = true;
      options.width = '100%';
      options.height = '600px';

      const richEditor = create(document.getElementById("richEdit"), options);

      richEditor.events.saving.addHandler(function (s, e) {
        setIsSaving(true); // Set saving state
        setCurrentDocument(e.base64); // Update currentDocument
        e.handled = true;
      });

      richEditor.events.documentLoaded.addHandler(function (s, e) {
        setTimeout(() => {
          const subDocument = richEditor.selection.activeSubDocument;
          const position = subDocument.length - 1;
          subDocument.insertText(position, ' ');
        }, 200);
      });

      richEditRef.current = richEditor;
      setIsEditorReady(true);
    }
  }, [isEditorReady]);

  useEffect(() => {
    if (isEditorReady && currentDocument) {
      richEditRef.current.openDocument(currentDocument, "DocumentName", 4);
      setTimeout(() => {
        richEditRef.current.exportToBase64(function (documentAsBase64) {
          // onSaveComplete(documentAsBase64);
          console.log("sdsds",documentAsBase64);
          
        });
      }, 5000);
    }
  }, [isEditorReady, currentDocument]);

  useEffect(() => {
    if (isEditorReady && triggerSave) {
      richEditRef.current.saveDocument();
    }
  }, [isEditorReady, triggerSave]);

  // Watch for `currentDocument` update after saving
  useEffect(() => {
    if (isSaving) {
      onSaveComplete(); // Notify parent only after `currentDocument` has been updated
      setIsSaving(false); // Reset saving state
    }
  }, [currentDocument, isSaving, onSaveComplete]); // Ensure this effect only runs when `currentDocument` updates


  useEffect(()=>{
    if (isEditorReady) {
      richEditRef.current.newDocument();
      setTimeout(() => {
        const subDocument = richEditRef.current.selection.activeSubDocument;
        const position = subDocument.length - 1;
        subDocument.insertText(position, ' ');
      }, 200);
    }
  },[triggerReset])
  return (
    <div>
      <div ref={richEditRef} id="richEdit"></div>
    </div>
  );
}
