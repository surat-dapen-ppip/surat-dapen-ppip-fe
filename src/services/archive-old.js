import axiosInstance from "@/utils/axiosIstance";

export const getFolderTree = async () => {
   let user =  localStorage.getItem("UserUID")
    try {
        const response = await axiosInstance.get('/archive/folder/tree?user='+user);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getAllFolders = async () => {
    try {
        const response = await axiosInstance.get('/archive/folder');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const createFolder = async (data) => {
    try {
        const response = await axiosInstance.post('/archive/folder',data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const deleteFolder = async (uid) => {
    try {
        const response = await axiosInstance.delete(`/archive/folder/${uid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getFileByFolder = async (uid) => {
    try {
        const response = await axiosInstance.get(`/archive/upload/folder/${uid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
export const getFileByUID = async (uid) => {
    try {
        const response = await axiosInstance.get(`/archive/upload/${uid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const DeleteFile = async (uid) => {
    try {
        const response = await axiosInstance.delete(`/archive/upload/${uid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const createFile = async (data) => {
    try {
        const response = await axiosInstance.post('/archive/upload',data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getDownloadFile = async (uid,userUid) => {
    try {
        const response = await axiosInstance.get(`/archive/download/${uid}?user=${userUid}`,{
            responseType: 'blob',
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const createShareFileOtherFolder = async (data) => {
    try {
        const response = await axiosInstance.post('/archive/upload/shared',data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getShareFileOtherFolder = async (uid) => {
    try {
        const response = await axiosInstance.get(`/archive/upload/shared/${uid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const DeleteShareFileOtherFolder = async (uid) => {
    try {
        const response = await axiosInstance.delete(`/archive/upload/shared/${uid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const createShareFilePublic = async (data) => {
    try {
        const response = await axiosInstance.post('/archive/download-link',data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getShareFilePublic = async (uid) => {
    try {
        const response = await axiosInstance.get(`/archive/download-link/${uid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const DeleteShareFilePublic = async (uid) => {
    try {
        const response = await axiosInstance.delete(`/archive/download-link/${uid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getShareFilePublicVerify = async (link) => {
    try {
        const response = await axiosInstance.get(`/archive/download-link/link/${link}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};


export const createShareFolderPermission = async (data) => {
    try {
        const response = await axiosInstance.post('/archive/folder/share',data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getShareFolderPermission = async (uid) => {
    try {
        const response = await axiosInstance.get(`/archive/folder/share/${uid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const DeleteShareFolderPermission = async (uid) => {
    try {
        const response = await axiosInstance.delete(`/archive/folder/share/${uid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};



export const createShareFolderPublic = async (data) => {
    try {
        const response = await axiosInstance.post('/share',data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getShareFolderPublic = async (uid) => {
    try {
        const response = await axiosInstance.get(`/share/${uid}`);
        // const response = await axiosInstance.get(`/share/${uid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const DeleteShareFolderPublic = async (uid) => {
    try {
        const response = await axiosInstance.delete(`/share/${uid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getShareFolderPublicVerify = async (link) => {
    try {
        const response = await axiosInstance.get(`/share/public/${link}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getHistory = async (uid) => {
    try {
        const response = await axiosInstance.get(`/archive/history/${uid}`);
        // const response = await axiosInstance.get(`/share/${uid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getFileByFolderSuratMasuk = async (user_uid,folder_uid) => {
    try {
        const response = await axiosInstance.get(`/archive/upload/message/${user_uid}/0?folder_uid=${folder_uid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getDownloadFileSuratMasuk = async (uid,userUid) => {
    try {
        const response = await axiosInstance.get(`/archive/download/in-message/${uid}?user=${userUid}`,{
            responseType: 'blob',
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const createShareFileOtherFolderSuratMasuk = async (data) => {
    try {
        const response = await axiosInstance.post('/archive/upload/shared/in-message',data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};