import axiosInstance from "@/utils/axiosIstance";


export const getMessages = async (userUID, keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory) => {
  try {
    const response = await axiosInstance.get('/messages', {
      params: {
        userUID: userUID,
        messageSender: MessageSender,
        messageClassification: MessageCategory,
        messageNumber: MessageNumber,
        orderByDate: MessageOrder,
        keyword: keyword,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const checkMessageAvailability = async (eventNumber, eventNumberSub, messageClassification) => {
  try {
    const response = await axiosInstance.get('/messageMaster/eventNumberAvailability', {
      params: {
        eventNumber: eventNumber,
        eventNumberSub: eventNumberSub,
        messageClassification: messageClassification
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMessagesByUser = async (status, userUID) => {
  try {
    const response = await axiosInstance.get('/messageMaster/byUser', {
      params: {
        status: status,
        userUID: userUID,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const countMessagesByUser = async (status, userUID) => {
  try {
    const response = await axiosInstance.get('/messageMaster/countByUser', {
      params: {
        status: status,
        userUID: userUID,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const getMessagesForApprover = async (status, userUID) => {
  try {
    const response = await axiosInstance.get('/messageMaster/forApprover', {
      params: {
        status: status,
        userUID: userUID,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const countMessagesForApprover = async (status, userUID) => {
  try {
    const response = await axiosInstance.get('/messageMaster/countForApprover', {
      params: {
        status: status,
        userUID: userUID,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const getMessagesForReviewer = async (status, userUID) => {
  try {
    const response = await axiosInstance.get('/messageMaster/forReviewer', {
      params: {
        status: status,
        userUID: userUID,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMessagesForDrafterCC = async (status, userUID) => {
  try {
    const response = await axiosInstance.get('/messageMaster/forDrafterCC', {
      params: {
        status: status,
        userUID: userUID,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const countMessagesForDrafterCC = async (status, userUID) => {
  try {
    const response = await axiosInstance.get('/messageMaster/countForDrafterCC', {
      params: {
        status: status,
        userUID: userUID,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const countMessagesForReviewer = async (status, userUID) => {
  try {
    const response = await axiosInstance.get('/messageMaster/countForReviewer', {
      params: {
        status: status,
        userUID: userUID,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const getMessagesForUser = async (status, userUID) => {
  try {
    const response = await axiosInstance.get('/messageMaster/forUser', {
      params: {
        status: status,
        userUID: userUID,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const countMessagesForUser = async (status, userUID) => {
  try {
    const response = await axiosInstance.get('/messageMaster/countForUser', {
      params: {
        status: status,
        userUID: userUID,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMessagesOnlyUser = async (status, userUID) => {
  try {
    const response = await axiosInstance.get('/messageMaster/onlyUser', {
      params: {
        status: status,
        userUID: userUID,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const countMessagesOnlyUser = async (status, userUID) => {
  try {
    const response = await axiosInstance.get('/messageMaster/countOnlyUser', {
      params: {
        status: status,
        userUID: userUID,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const getMessagesBothUser = async (status, userUID, statusSecondary, category, title, startDate, endDate) => {
  try {
    const response = await axiosInstance.get('/messageMaster/bothUser', {
      params: {
        status: status,
        userUID: userUID,
        statusSecondary: statusSecondary,
        category: category,
        title: title,
        startDate: startDate,
        endDate: endDate,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const countMessagesBothUser = async (status, userUID, statusSecondary) => {
  try {
    const response = await axiosInstance.get('/messageMaster/countBothUser', {
      params: {
        status: status,
        userUID: userUID,
        statusSecondary: statusSecondary
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};



export const getMessageCounter = async (messageClassification) => {
  try {
    const response = await axiosInstance.get('/messagesCounter', {
      params:{
        messageClassification: messageClassification
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const getChartReport = async () => {
  try {
    const response = await axiosInstance.get('/report/chart');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const getReport = async (recipientUID, classification) => {
  try {
    const response = await axiosInstance.get('/report', {
      params: {
        recipientUID: recipientUID,
        messageClassification: classification,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getCountInbox = async (recipientUID, classification) => {
  try {
    const response = await axiosInstance.get('/report/countInbox', {
      params: {
        recipientUID: recipientUID,
        messageClassification: classification,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getCountHistory = async (recipientUID, isAdmin) => {
  try {
    const response = await axiosInstance.get('/report/countHistory', {
      params: {
        recipientUID: recipientUID,
        isAdmin: isAdmin
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getHistory = async (userUID, keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory, isAdmin) => {
  try {
    const response = await axiosInstance.get('/history', {
      params: {
        userUID: userUID,
        messageSender: MessageSender,
        messageClassification: MessageCategory,
        messageNumber: MessageNumber,
        orderByDate: MessageOrder,
        keyword: keyword,
        isAdmin: isAdmin
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
export const getHistoryNoStatus = async (userUID, keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory) => {
  try {
    const response = await axiosInstance.get('/history/noStatus', {
      params: {
        userUID: userUID,
        recipientUID: MessageSender,
        messageClassification: MessageCategory,
        messageNumber: MessageNumber,
        orderByDate: MessageOrder,
        keyword: keyword,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMessageByUid = async (uid) => {
  try {
    const response = await axiosInstance.get(`/messages/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getArchiveMessage = async (archived, keyword, MessageNumber, MessageSender, MessageOrder, MessageCategory) => {
  try {
    const response = await axiosInstance.get(`/messageMaster/archived`, {
      params:{
        archived: archived,
        recipientUID: MessageSender,
        messageClassification: MessageCategory,
        messageNumber: MessageNumber,
        orderByDate: MessageOrder,
        keyword: keyword,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createMessage = async (MessageData) => {
  try {
    const response = await axiosInstance.post('/messages', MessageData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createMessageArchive = async (MessageData) => {
  try {
    const response = await axiosInstance.post('/messageMaster/archived', MessageData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const approveMessage = async (uid, userUID, content, messageNumber, date, externalSender) => {
  try {
    const response = await axiosInstance.post('/messages/approve/' + uid, {
      UserUID: userUID,
      Content: content,
      MessageNumber: messageNumber,
      Date: date,
      ExternalSender: externalSender
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const rejectMessage = async (uid) => {
  try {
    const response = await axiosInstance.post('/messages/reject/' + uid);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateMessage = async (uid, MessageData) => {
  try {
    const response = await axiosInstance.put(`/messages/${uid}`, MessageData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateMessageProccessed = async (uid) => {
  try {
    const response = await axiosInstance.put(`/messages/${uid}/processed`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteMessage = async (uid) => {
  try {
    const response = await axiosInstance.delete(`/messages/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
