import axiosInstance from "@/utils/axiosIstance";


export const getTemplateSurat = async () => {
  try {
    const response = await axiosInstance.get('/messageTemplates');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTypeNameSurat = async (messageClassification) => {
  try {
    const response = await axiosInstance.get('/messageMaster/typeName',{
      params:{
        message_classification: messageClassification
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTemplateNameSurat = async (typeName, messageClassification) => {
  try {
    const response = await axiosInstance.get('/messageMaster/templateName',{
      params:{
        typeName: typeName,
        messageClassification: messageClassification
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTemplateCodeByUid = async (templateUID) => {
  try {
    const response = await axiosInstance.get(`/messageTemplates/code/${templateUID}`);
    return response.data.data || "";
  } catch (error) {
    return ""
  }
};


export const getTemplateSuratByUid = async (uid) => {
  try {
    const response = await axiosInstance.get(`/messageTemplates/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createTemplateSurat = async (TemplateSuratData) => {
  try {
    const response = await axiosInstance.post('/messageTemplates', TemplateSuratData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateTemplateSurat = async (uid, TemplateSuratData) => {
  try {
    const response = await axiosInstance.put(`/messageTemplates/${uid}`, TemplateSuratData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteTemplateSurat = async (uid) => {
  try {
    const response = await axiosInstance.delete(`/messageTemplates/${uid}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
