import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL, // Use your environment variable for the base URL
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Retrieve the token from localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;