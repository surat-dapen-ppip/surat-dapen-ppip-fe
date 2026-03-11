"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import "devextreme/dist/css/dx.light.css";
import "devexpress-richedit/dist/dx.richedit.css";
import { message, Spin } from "antd";
import QRCodeStyling from "qr-code-styling";


const RichEditorSignatureV2 = forwardRef(({
    getCurrentDocument,
    getMessageNumberDocument,
    getCurrentMessageRemark,
    onSaveComplete,
    isOpen,
}, ref) => {

    const [isLoading, setIsLoading] = useState(false);
    const richEditRef = useRef(null);

    useImperativeHandle(ref, () => ({
        triggerSaveSK: handleSave
    }));

    const generateQR = async (messageNumberDocument) => {
        const qr = new QRCodeStyling({
            width: 80,
            height: 80,
            image:
                process.env.NEXT_PUBLIC_HOST_URL + "/logo-ppip.svg",
            dotsOptions: {
                color: "black",
                type: "rounded"
            },
            imageOptions: {
                crossOrigin: "anonymous",
                margin: 2,
                imageSize: 0.3
            }
        });

        qr.update({
            data: messageNumberDocument
        });

        const blob = await qr.getRawData("png");

        const base64QR = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Gagal membaca data QR"));
            reader.readAsDataURL(blob);
        });

        return base64QR;
    }

    const handleSave = useCallback(() => {
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
            alert('Terdapat kesalahan saat menyimpan dokumen')
        }
    }, [onSaveComplete])

    useEffect(() => {
        if (typeof window !== "undefined" && isOpen) {
            setIsLoading(true);

            const init = async () => {
                const richEditModule = await import("devexpress-richedit");
                const { create, createOptions, ViewType, RichEditUnit } = richEditModule;

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

                options.downloadPdfEnabled = true;
                options.downloadDocxEnabled = false;
                options.downloadRtfEnabled = false;

                options.readOnly = false;
                options.width = "100%";
                options.height = "600px";

                const fetchQr = async () => {
                    const qrCode = await generateQR(getMessageNumberDocument());
                    return qrCode;
                }

                const richEditor = create(document.getElementById("richEditSignature"), options);
                richEditor.events.documentLoaded.addHandler(function () {
                    fetchQr().then((qrCode) => {
                        richEditor.document.images.createFloating(0, {
                            base64: qrCode,
                            actualSize: {
                                width: 1500,
                                height: 1500
                            },
                            horizontalPosition: {
                                relativeTo: 5,
                                position: -1000,
                            },
                            verticalPosition: {
                                relativeTo: 5,
                                position: -2000,
                            },
                            wrapSide: 1,
                            wrapType: 5
                        })

                        richEditor._native.core.searchManager.replaceAll("[NO_SURAT]", getMessageNumberDocument(), true)
                        richEditor._native.core.searchManager.replaceAll("[TUJUAN_EKSTERNAL]", getCurrentMessageRemark(), true)

                        const today = new Date();
                        const day = String(today.getDate()).padStart(2, '0');
                        const monthIndex = today.getMonth();
                        const year = today.getFullYear();
                        const monthNamesIndonesian = [
                            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                        ];
                        const month = monthNamesIndonesian[monthIndex];
                        const formattedDate = `${day} ${month} ${year}`;
                        richEditor._native.core.searchManager.replaceAll("[TGL_SURAT]", formattedDate, true)
                    })
                });
                richEditor.openDocument(getCurrentDocument(), "DocumentName", 4);
                richEditRef.current = richEditor;
                setIsLoading(false);
            }
            init()
        }

    }, [isOpen]);


    return (
        <Spin spinning={isLoading} tip="Sedang menggenerate signature, mohon tunggu...">
            <div>
                <div id="richEditSignature"></div>
            </div>
        </Spin>
    );
});

RichEditorSignatureV2.displayName = "RichEditorSignatureV2";
export default RichEditorSignatureV2;
