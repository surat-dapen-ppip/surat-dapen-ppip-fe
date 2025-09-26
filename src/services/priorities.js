import axiosInstance from "@/utils/axiosIstance";


export const getPriorities = async () => {
  try {
    const response = await axiosInstance.get('/priorities');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getPriorityByUid = async (uid) => {
  try {
    const response = await axiosInstance.get(`/priorities/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createPriority = async (PriorityData) => {
  try {
    const response = await axiosInstance.post('/priorities', PriorityData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updatePriority = async (uid, PriorityData) => {
  try {
    const response = await axiosInstance.put(`/priorities/${uid}`, PriorityData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deletePriority = async (uid) => {
  try {
    const response = await axiosInstance.delete(`/priorities/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
