import axiosInstance from "@/utils/axiosIstance";


export const getUsers = async () => {
  try {
    const response = await axiosInstance.get('/Users');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getUserByUid = async (uid) => {
  try {
    const response = await axiosInstance.get(`/Users/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createUser = async (UserData) => {
  try {
    const response = await axiosInstance.post('/Users', UserData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateUser = async (uid, UserData) => {
  try {
    const response = await axiosInstance.put(`/Users/${uid}`, UserData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const changePasswordUser = async (uid, PasswordData) => {
  try {
    const response = await axiosInstance.put(`/Users/${uid}/_changePassword`, PasswordData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteUser = async (uid) => {
  try {
    const response = await axiosInstance.delete(`/Users/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
