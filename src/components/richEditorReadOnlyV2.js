"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import 'devextreme/dist/css/dx.light.css';
import 'devexpress-richedit/dist/dx.richedit.css';
import { Spin } from 'antd';

const RichEditorReadOnlyV2 = forwardRef(({
    getCurrentDocument,
    isOpen,
}, ref) => {
    const [isLoading, setIsLoading] = useState(false);
    const richEditRef = useRef(null);

    useImperativeHandle(ref, () => ({}));

    useEffect(() => {
        if (typeof window !== 'undefined' && isOpen) {
            setIsLoading(true);
            const init = async () => {
                const richEditModule = await import("devexpress-richedit");
                const { create, createOptions, ViewType, RichEditUnit } = richEditModule;

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

                options.downloadPdfEnabled = true; // Enable only PDF downloads
                options.downloadDocxEnabled = false; // Disable DOCX downloads
                options.downloadRtfEnabled = false; // Disable RTF downloads

                options.readOnly = true;
                options.width = '100%';
                options.height = '600px';

                const richEditor = create(document.getElementById("richEditReadOnly"), options);
                richEditor.openDocument(getCurrentDocument(), "DocumentName", 4);
                richEditRef.current = richEditor;
                setIsLoading(false);
            }
            init()
        }
    }, [isOpen]);

    return (
        <div>
            <Spin spinning={isLoading} tip="Sedang membuka dokumen mohon tunggu...">
                <div>
                    <div id="richEditReadOnly"></div>
                </div>
            </Spin>

        </div>
    );
});

RichEditorReadOnlyV2.displayName = "RichEditorReadOnlyV2";
export default RichEditorReadOnlyV2;
