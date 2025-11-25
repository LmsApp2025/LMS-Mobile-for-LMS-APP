// In: new-client/utils/axios.instance.ts

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URI } from './uri';
import { router } from 'expo-router';

const axiosInstance = axios.create({
  baseURL: SERVER_URI,
});

let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url?.includes('/refresh')) {
        return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          // Fix: Ensure headers exist before assigning
          if(!originalRequest.headers) originalRequest.headers = {};
          originalRequest.headers['access-token'] = token;
          return axiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
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

        if (!newAccessToken || !newRefreshToken) {
            throw new Error("Server did not return new tokens");
        }

        // Securely store the new tokens
        await AsyncStorage.setItem('access_token', newAccessToken);
        await AsyncStorage.setItem('refresh_token', newRefreshToken);
        
        // Set the new token on the original request's header
        axiosInstance.defaults.headers.common['access-token'] = newAccessToken;
        
        //originalRequest.headers['access-token'] = newAccessToken;
        // Fix for Axios Header handling:
        // Ensure we set the header on the original request object correctly
        // We explicitly overwrite the header property
        if(!originalRequest.headers) originalRequest.headers = {};
        originalRequest.headers['access-token'] = newAccessToken;
        
        processQueue(null, newAccessToken);
        
        // Retry the original request
        return axiosInstance(originalRequest);

      } catch (refreshError: any) {
        console.log("Session refresh failed:", refreshError.response?.data || refreshError.message);

        processQueue(refreshError, null);
        
        if (refreshError.response?.status === 400 || refreshError.response?.status === 401) {
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
