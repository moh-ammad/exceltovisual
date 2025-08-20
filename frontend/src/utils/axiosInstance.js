// utils/axiosInstance.js

import axios from 'axios';
import { BASE_URL } from './apisPaths';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response) {
      switch (response.status) {
        case 401:
          console.warn('Unauthorized. Redirecting to login...');
          window.location.href = '/login';
          break;
        case 500:
          console.error('Server error. Please try again later.');
          break;
        default:
          console.error('API Error:', response.statusText);
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timed out. Please try again.');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
