"use client"
// hooks/useLayoutContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CryptoJS from 'crypto-js';
import { countMessagesForApprover, countMessagesForReviewer, getCountHistory, getCountInbox } from '@/services/message';

const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [recipientUID, setRecipientUID] = useState("")
  const [name, setName] = useState("");
  const [countInbox, setCountInbox] = useState(0);
  const [countHistory, setCountHistory] = useState(0);
  const [countDaftarSurat, setCountDaftarSurat] = useState(0);

  const fetchCount = async (roleID, recipientUID, classification) => {
    if (typeof window !== 'undefined') {
      const responseCI = await getCountInbox(recipientUID, classification);
      if (responseCI) {
        setCountInbox(responseCI.data);
      }

      const rNeedReview = await countMessagesForReviewer(41, recipientUID)
      const rNeedApprove = await countMessagesForApprover(42, recipientUID)
      setCountDaftarSurat((rNeedReview.data || 0) + (rNeedApprove.data || 0));


      if (roleID == 0) {
        const responseCH = await getCountHistory(recipientUID, "true");
        if (responseCH) {
          setCountHistory(responseCH.data);
        }
      } else {
        const responseCH = await getCountHistory(recipientUID);
        if (responseCH) {
          setCountHistory(responseCH.data);
        }
      }

    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      setRole("");
      setRecipientUID("");
      setName("")
      setCountHistory(0)
      setCountInbox(0)
    }
    router.push("/");
  };

  const handleAuth = async () => {
    if (typeof window !== 'undefined') {
      const recipientUID = window.localStorage.getItem('UserUID');
      const currentRoleID = window.localStorage.getItem('RoleID');
      const name = window.localStorage.getItem('Name')
      let roleID = 0;
      for (let i = 0; i <= 2; i++) {
        console.log(currentRoleID)
        if (CryptoJS.HmacMD5(i, 'EE_MENCRET') == currentRoleID) {
          console.log(i)
          roleID = i;
          setRole(i);
          break;
        }

        if (i == 2) {
          router.push("/");
        }
      }
      setRecipientUID(recipientUID);
      setName(name);

      fetchCount(roleID, recipientUID, 0);
    }
  }

  useEffect(() => {
    handleAuth()
  }, []);

  return (
    <LayoutContext.Provider
      value={{
        role,
        recipientUID,
        name,
        countInbox,
        countHistory,
        countDaftarSurat,
        fetchCount,
        handleLogout,
        handleAuth,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

// Custom hook to use the Layout context
export const useLayoutContext = () => useContext(LayoutContext);
