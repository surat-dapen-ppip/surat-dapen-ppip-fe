import axiosInstance from "@/utils/axiosIstance";


export const getMessageEvents = async (messageUID) => {
  try {
    const response = await axiosInstance.get('/events', {
      params:{
        messageUID : messageUID
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMessageEventByUid = async (uid) => {
  try {
    const response = await axiosInstance.get(`/events/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createMessageEvent = async (MessageEventData) => {
  try {
    const response = await axiosInstance.post('/events', MessageEventData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateMessageEvent = async (uid, MessageEventData) => {
  try {
    const response = await axiosInstance.put(`/events/${uid}`, MessageEventData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteMessageEvent = async (uid) => {
  try {
    const response = await axiosInstance.delete(`/events/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
