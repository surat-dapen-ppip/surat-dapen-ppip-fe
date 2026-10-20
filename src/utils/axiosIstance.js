import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL, // Use your environment variable for the base URL
});

axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('Token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const userUid = localStorage.getItem('UserUID') || localStorage.getItem('user_uid');
    if (userUid && !config.headers['user_uid']) {
      config.headers['user_uid'] = userUid;
    }
  }
  return config;
});

export default axiosInstance;