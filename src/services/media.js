import axiosInstance from "@/utils/axiosIstance";


export const getMedia = async () => {
  try {
    const response = await axiosInstance.get('/media');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMediaByUid = async (uid) => {
  try {
    const response = await axiosInstance.get(`/media/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createMedia = async (MediaData) => {
  try {
    const response = await axiosInstance.post('/media', MediaData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateMedia = async (uid, MediaData) => {
  try {
    const response = await axiosInstance.put(`/media/${uid}`, MediaData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteMedia = async (uid) => {
  try {
    const response = await axiosInstance.delete(`/media/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
