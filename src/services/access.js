import axiosInstance from "@/utils/axiosIstance";

/**
 * Get access entries for an archive directory
 * @param {string} uid - Directory UID
 * @returns {Promise<Object>} AccessList response
 */
export const getDirectoryAccess = async (uid) => {
  try {
    const response = await axiosInstance.get(`/archive/access/directory/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get access entries for an archive document
 * @param {string} uid - Document UID
 * @returns {Promise<Object>} AccessList response
 */
export const getDocumentAccess = async (uid) => {
  try {
    const response = await axiosInstance.get(`/archive/access/document/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

