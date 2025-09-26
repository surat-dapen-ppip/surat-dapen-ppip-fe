import axiosInstance from "@/utils/axiosIstance";


export const getNatures = async () => {
  try {
    const response = await axiosInstance.get('/natures');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getNatureByUid = async (uid) => {
  try {
    const response = await axiosInstance.get(`/natures/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createNature = async (NatureData) => {
  try {
    const response = await axiosInstance.post('/natures', NatureData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateNature = async (uid, NatureData) => {
  try {
    const response = await axiosInstance.put(`/natures/${uid}`, NatureData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteNature = async (uid) => {
  try {
    const response = await axiosInstance.delete(`/natures/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
