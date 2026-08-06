import axiosInstance from "@/utils/axiosIstance";

export const getNotifications = async (userUID, unreadOnly) => {
  try {
    const response = await axiosInstance.get('/notifications', {
      params: {
        userUID: userUID,
        unreadOnly: unreadOnly,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getNotificationCount = async (userUID) => {
  try {
    const response = await axiosInstance.get('/notifications/count', {
      params: {
        userUID: userUID,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markAllNotificationsRead = async (userUID) => {
  try {
    const response = await axiosInstance.put('/notifications/read-all', {}, {
      params: {
        userUID: userUID,
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markNotificationRead = async (uid) => {
  try {
    const response = await axiosInstance.put(`/notifications/${uid}/read`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
