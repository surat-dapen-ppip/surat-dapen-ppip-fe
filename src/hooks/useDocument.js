"use client"

import { createContext, useState, useContext, useRef } from 'react';

const DocumentContext = createContext();

export const DocumentProvider = ({ children }) => {
  const [currentDocument, setCurrentDocument] = useState(null);
  const richEditRef = useRef(null); 

  const handleOpen = (inputDocument) => {
    if (typeof window !== 'undefined') {
      if (richEditRef?.current && inputDocument) {
        richEditRef?.current.openDocument(inputDocument, "DocumentName", 4);
        setTimeout(() =>{
          var subDocument = richEditRef?.current.selection.activeSubDocument;
          var position = subDocument.length - 1;
          subDocument.insertText(position, ' '); 
        },1000)
      }
    }

  };

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      if (richEditRef?.current) {
        richEditRef.current.saveDocument(4);
      }
    }
  };

  


  return (
    <DocumentContext.Provider value={
      {
        currentDocument,
        setCurrentDocument,
        handleOpen,
        handleSave,
        richEditRef,
      }
    }>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocumentContext = () => useContext(DocumentContext);
