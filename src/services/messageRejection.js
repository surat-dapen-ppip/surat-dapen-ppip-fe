import axiosInstance from "@/utils/axiosIstance";


export const getMessageRejection = async (messageUID) => {
  try {
    const response = await axiosInstance.get('/messageRejection',{
      params:{
        messageUID: messageUID
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMessageRejectionByUid = async (uid) => {
  try {
    const response = await axiosInstance.get(`/messageRejection/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createMessageRejection = async (MessageRejectionData) => {
  try {
    const response = await axiosInstance.post('/messageRejection', MessageRejectionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateMessageRejection = async (uid, MessageRejectionData) => {
  try {
    const response = await axiosInstance.put(`/messageRejection/${uid}`, MessageRejectionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteMessageRejection = async (uid) => {
  try {
    console.log(uid)
    const response = await axiosInstance.delete(`/messageRejection/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
