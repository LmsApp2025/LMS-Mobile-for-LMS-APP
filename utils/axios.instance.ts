// In: new-client/utils/axios.instance.ts

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URI } from './uri';
import { router } from 'expo-router';

const axiosInstance = axios.create({
  baseURL: SERVER_URI,
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

// Request Interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    const accessToken = await AsyncStorage.getItem('access_token');
    if (accessToken) {
      // Send tokens in headers for mobile app
      config.headers['access-token'] = accessToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url?.includes('/refresh')) {
        return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/refresh')) {

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
        .then(token => {
          originalRequest.headers['access-token'] = token;
          return axiosInstance(originalRequest);
        })
        .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
          

        // Use a separate, clean axios instance for the refresh call
        const refreshResponse = await axios.get(`${SERVER_URI}/refresh`, {
          headers: { 
            'refresh-token': refreshToken,
            //'Content-Type': 'application/json' 
          },
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;

        // if (!newAccessToken) {
        //     throw new Error("Server did not return new tokens");
        // }

        // Securely store the new tokens
        await AsyncStorage.setItem('access_token', newAccessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('refresh_token', newRefreshToken);      
        }
        

        axiosInstance.defaults.headers.common['access-token'] = newAccessToken;
        originalRequest.headers['access-token'] = newAccessToken;

        // if (!originalRequest.headers) {
        //     originalRequest.headers = {};
        // }

        // // Handle Axios v1.x+ AxiosHeaders object vs older plain objects
        // if (originalRequest.headers.set && typeof originalRequest.headers.set === 'function') {
        //     originalRequest.headers.set('access-token', newAccessToken);
        // } else {
        //     originalRequest.headers['access-token'] = newAccessToken;
        // }
        
        processQueue(null, newAccessToken);
        
        // Retry the original request
        return axiosInstance(originalRequest);

      } catch (refreshError: any) {
        //console.log("Session refresh failed:", refreshError.response?.data || refreshError.message);
        processQueue(refreshError, null);
        
        // Only logout on definitive auth failures (400/401/403)
        // This prevents logout on network errors (500/Timeout)
        const status = refreshError.response?.status;
        if (status === 401 || status === 403 || !refreshError.response) {
            await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
            router.replace("/(routes)/login"); 
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
