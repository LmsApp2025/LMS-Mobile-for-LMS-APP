import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URI } from './uri';
import { router } from 'expo-router';

const axiosInstance = axios.create({
  baseURL: SERVER_URI,
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = [];

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

// Request Interceptor: Simply attaches the token
axiosInstance.interceptors.request.use(
  async (config) => {
    const accessToken = await AsyncStorage.getItem('access_token');
    if (accessToken) {
      config.headers['access-token'] = accessToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handles the Refresh Logic
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loops
    if (originalRequest.url?.includes('/refresh')) {
        return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (!originalRequest.headers) originalRequest.headers = {};
          // Robust header setting
          if (originalRequest.headers.set && typeof originalRequest.headers.set === 'function') {
             originalRequest.headers.set('access-token', token);
          } else {
             originalRequest.headers['access-token'] = token;
          }
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

        // Separate instance for refresh
        const refreshResponse = await axios.get(`${SERVER_URI}/refresh`, {
          headers: { 
            'refresh-token': refreshToken,
          },
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;

        if (!newAccessToken) throw new Error("Failed to receive tokens");

        await AsyncStorage.setItem('access_token', newAccessToken);
        await AsyncStorage.setItem('refresh_token', newRefreshToken);
        
        // Update default headers
        axiosInstance.defaults.headers.common['access-token'] = newAccessToken;
        
        // Update the FAILED request's headers explicitly
        if (!originalRequest.headers) originalRequest.headers = {};
        
        // IMPORTANT: Handle Axios header object variations
        if (originalRequest.headers.set && typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('access-token', newAccessToken);
        } else {
            originalRequest.headers['access-token'] = newAccessToken;
        }
        
        processQueue(null, newAccessToken);
        
        return axiosInstance(originalRequest);

      } catch (refreshError: any) {
        processQueue(refreshError, null);
        
        // Only logout on definitive auth failure
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