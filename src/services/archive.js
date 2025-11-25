import axiosInstance from "@/utils/axiosIstance";

// Directory Management Functions

/**
 * Create a new directory
 * @param {Object} data - Directory data
 * @param {string} data.pathname - Directory name
 * @param {string} [data.parent_uid] - Parent directory UID (optional for root directories)
 * @param {string} data.owner_uid - Owner user UID
 * @returns {Promise<Object>} Created directory
 */
export const createDirectory = async (data) => {
    try {
        const response = await axiosInstance.post('/archive/directory', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Get all directories
 * @returns {Promise<Object>} List of all directories
 */
export const getAllDirectories = async () => {
    try {
        const response = await axiosInstance.get('/archive/directory');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Get directory tree structure
 * @returns {Promise<Object>} Directory tree structure
 */
export const getDirectoryTree = async () => {
    try {
        const response = await axiosInstance.get('/archive/directory/tree');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Get child directories
 * @param {string} [parentUid] - Parent directory UID (optional for root directories)
 * @returns {Promise<Object>} List of child directories
 */
export const getChildDirectories = async (parentUid = '', ownerUID) => {
    try {
        const response = await axiosInstance.get('/archive/directory/children', {
            params: {
                parent_uid: parentUid,
                owner_uid: ownerUID
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Get directory by UID
 * @param {string} uid - Directory UID
 * @returns {Promise<Object>} Directory details
 */
export const getDirectoryByUid = async (uid, ownerUID) => {
    try {
        const response = await axiosInstance.get(`/archive/directory/${uid}`, {
            params: {
                owner_uid: ownerUID
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getDirectoryInfoByUid = async (uid) => {
    try {
        const response = await axiosInstance.get(`/archive/directory/_info/${uid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Update directory
 * @param {string} uid - Directory UID
 * @param {Object} data - Directory data
 * @param {string} data.pathname - New directory name
 * @returns {Promise<Object>} Updated directory
 */
export const updateDirectory = async (uid, data) => {
    try {
        const response = await axiosInstance.put(`/archive/directory/${uid}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Delete directory
 * @param {string} uid - Directory UID
 * @returns {Promise<Object>} Success response
 */
export const deleteDirectory = async (uid) => {
    try {
        const response = await axiosInstance.delete(`/archive/directory/${uid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Document Management Functions

/**
 * Create a new document with file upload
 * @param {File} file - File to upload
 * @param {string} [filename] - Optional filename (will use file.name if not provided)
 * @param {string} [parent_uid] - Parent directory UID (optional for root)
 * @param {string} owner_uid - Owner user UID
 * @param {string[]} [viewerUserUids] - Optional viewer user UID list
 * @param {string[]} [viewerOrganizationUids] - Optional viewer organization UID list
 * @returns {Promise<Object>} Created document
 */
export const createDocument = async (file, filename, parent_uid, owner_uid, viewerUserUids, viewerOrganizationUids) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        if (filename) {
            formData.append('filename', filename);
        }
        
        if (parent_uid) {
            formData.append('parent_uid', parent_uid);
        }
        
        // Owner UID is required
        formData.append('owner_uid', owner_uid);

        if (viewerUserUids && viewerUserUids.length > 0) {
            formData.append('viewer_user_uids', JSON.stringify(viewerUserUids));
        }

        if (viewerOrganizationUids && viewerOrganizationUids.length > 0) {
            formData.append('viewer_organization_uids', JSON.stringify(viewerOrganizationUids));
        }
        
        const response = await axiosInstance.post('/archive/document', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};


/**
 * Get documents by parent UID and owner UID
 * @param {string} [parentUID] - Parent directory UID (optional for root)
 * @param {string} [ownerUID] - Owner user UID (optional)
 * @returns {Promise<Object>} List of documents
 */
export const getDocuments = async (parentUID, ownerUID) => {
    try {
        const response = await axiosInstance.get(`/archive/document`, {
            params:{
                parent_uid: parentUID || null,
                owner_uid: ownerUID || null
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};


/**
 * Get document by UID
 * @param {string} uid - Document UID
 * @returns {Promise<Object>} Document details
 */
export const getDocumentByUid = async (uid) => {
    try {
        const response = await axiosInstance.get(`/archive/document/${uid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Update document
 * @param {string} uid - Document UID
 * @param {Object} data - Document data
 * @param {string} data.filename - New document filename
 * @returns {Promise<Object>} Updated document
 */
export const updateDocument = async (uid, data) => {
    try {
        const response = await axiosInstance.put(`/archive/document/${uid}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Delete document
 * @param {string} uid - Document UID
 * @returns {Promise<Object>} Success response
 */
export const deleteDocument = async (uid) => {
    try {
        const response = await axiosInstance.delete(`/archive/document/${uid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Get document by media UID
 * @param {string} mediaUid - Media UID
 * @returns {Promise<Object>} Document details
 */
export const getDocumentByMediaUid = async (mediaUid) => {
    try {
        const response = await axiosInstance.get(`/archive/document/media/${mediaUid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
