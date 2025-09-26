"use client"

import { useEffect, useRef } from 'react';
import { useDocumentContext } from '@/hooks/useDocument';
import 'devextreme/dist/css/dx.light.css';
import 'devexpress-richedit/dist/dx.richedit.css';
import { create, createOptions, ViewType, RichEditUnit } from 'devexpress-richedit';


export default function RichEditComponent () {

  const {
    richEditRef,
    setCurrentDocument
  } = useDocumentContext()
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (richEditRef.current) {
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
        options.readOnly = false;
        options.width = '100%';
        options.height = '800px';

        const richEditor = create(document.getElementById("richEdit"), options);

        richEditor.events.saving.addHandler(function (s, e) {
          setCurrentDocument(e.base64);
          e.handled = true;
        });

        richEditRef.current = richEditor
      }
    }
  }, []);


  return <div>
    <div ref={richEditRef} id='richEdit'></div>;
  </div>
};

