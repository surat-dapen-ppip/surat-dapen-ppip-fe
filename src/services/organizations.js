import axiosInstance from "@/utils/axiosIstance";


export const getOrganizations = async () => {
  try {
    const response = await axiosInstance.get('/organizations');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getOrganizationByUid = async (uid) => {
  try {
    const response = await axiosInstance.get(`/organizations/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createOrganization = async (organizationData) => {
  try {
    const response = await axiosInstance.post('/organizations', organizationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateOrganization = async (uid, organizationData) => {
  try {
    const response = await axiosInstance.put(`/organizations/${uid}`, organizationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteOrganization = async (uid) => {
  try {
    console.log(uid)
    const response = await axiosInstance.delete(`/organizations/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
