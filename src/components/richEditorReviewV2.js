"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import "devextreme/dist/css/dx.light.css";
import "devexpress-richedit/dist/dx.richedit.css";
import { message, Spin } from "antd";


const RichEditorReviewV2 = forwardRef(({
    getCurrentDocument,
    getMessageClassification,
    onSaveComplete,
    onUpdateDocument,
    isOpen,
}, ref) => {

    const [isLoading, setIsLoading] = useState(false);
    const richEditRef = useRef(null);

    useImperativeHandle(ref, () => ({
        triggerSaveReview: handleSave,
        triggerUpdateReview: handleUpdate
    }));

    function isEmptyOrWhitespace(textMessage) {
        return !textMessage || textMessage.trim() === '';
    }

    function isTagRequired(textMessage, messageClassification) {
        let requiredTags = ""
        if (messageClassification == 1) {
            requiredTags = ["[NO_SURAT]", "[TGL_SURAT]"];
        } else if (messageClassification == 2) {
            requiredTags = ["[NO_SURAT]", "[TTD]", "[TGL_SURAT]"];
        } else {
            return false
        }
        return requiredTags.every(tag => textMessage.includes(tag));
    }

    function getMessageError(messageClassification) {
        let errorMessage = ""
        if (messageClassification == 1) {
            errorMessage = "Tolong lengkapi FLAG [NO_SURAT] dan [TGL_SURAT]"
        } else if (messageClassification == 2) {
            errorMessage = "Tolong lengkapi FLAG [NO_SURAT], [TTD] dan [TGL_SURAT]"
        }
        message.error(errorMessage)
    }

    const handleSave = useCallback(() => {
        try {
            const textMessage = richEditRef.current.document.getText();
            if (isEmptyOrWhitespace(textMessage)) {
                message.error("Template is empty or only whitespace characters")
            }

            if (isTagRequired(textMessage, getMessageClassification())) {
                richEditRef.current.exportToBase64(function (documentAsBase64) {
                    onSaveComplete(documentAsBase64)
                });
            } else {
                getMessageError(getMessageClassification())
            }
        } catch (error) {
            console.log(error)
        }
    }, [onSaveComplete])

    const handleUpdate = useCallback(() => {
        try {
            const textMessage = richEditRef.current.document.getText();
            if (isEmptyOrWhitespace(textMessage)) {
                message.error("Template is empty or only whitespace characters")
            }

            if (isTagRequired(textMessage, getMessageClassification())) {
                richEditRef.current.exportToBase64(function (documentAsBase64) {
                    onUpdateDocument(documentAsBase64)
                });
            } else {
                getMessageError(getMessageClassification())
            }
        } catch (error) {
            console.log(error)
        }
    }, [onUpdateDocument])

    useEffect(() => {
        if (typeof window !== "undefined" && isOpen) {
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

                options.downloadPdfEnabled = true;
                options.downloadDocxEnabled = false;
                options.downloadRtfEnabled = false;

                options.readOnly = false;
                options.width = '100%';
                options.height = '600px';

                const richEditor = create(document.getElementById("richEditReview"), options);
                richEditor.openDocument(getCurrentDocument(), "DocumentName", 4);
                richEditRef.current = richEditor;
                setIsLoading(false);
            }
            init();
        }

    }, [isOpen]);


    return (
        <Spin spinning={isLoading} tip="Sedang membuka dokumen mohon tunggu...">
            <div>
                <div id="richEditReview"></div>
            </div>
        </Spin>
    );
});

RichEditorReviewV2.displayName = "RichEditorReviewV2";
export default RichEditorReviewV2;
