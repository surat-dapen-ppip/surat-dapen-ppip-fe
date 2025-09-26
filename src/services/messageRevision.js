import axiosInstance from "@/utils/axiosIstance";


export const getMessageRevision = async (messageUID) => {
  try {
    const response = await axiosInstance.get('/messageRevision',{
      params:{
        messageUID: messageUID
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMessageRevisionByUid = async (uid) => {
  try {
    const response = await axiosInstance.get(`/messageRevision/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createMessageRevision = async (MessageRevisionData) => {
  try {
    const response = await axiosInstance.post('/messageRevision', MessageRevisionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateMessageRevision = async (uid, MessageRevisionData) => {
  try {
    const response = await axiosInstance.put(`/messageRevision/${uid}`, MessageRevisionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteMessageRevision = async (uid) => {
  try {
    console.log(uid)
    const response = await axiosInstance.delete(`/messageRevision/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
