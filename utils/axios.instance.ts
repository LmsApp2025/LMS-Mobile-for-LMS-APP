// utils/axios.instance.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URI } from './uri';
import { router } from 'expo-router';

const axiosInstance = axios.create({
  baseURL: SERVER_URI,
  timeout: 15000,
});

// Global flag to prevent multiple refreshes
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

// PREVENTIVE REFRESH: Always refresh token when making any request if access token is missing/expired
axiosInstance.interceptors.request.use(
  async (config) => {
    let accessToken = await AsyncStorage.getItem('access_token');
    const refreshToken = await AsyncStorage.getItem('refresh_token');

    // If we have a refresh token but no access token → force refresh first
    if (refreshToken && !accessToken) {
      if (isRefreshing) {
        // Wait for ongoing refresh
        await new Promise((resolve) => {
          failedQueue.push({ resolve, reject: () => {} });
        });
        accessToken = await AsyncStorage.getItem('access_token');
      } else {
        try {
          isRefreshing = true;
          const refreshResponse = await axios.get(`${SERVER_URI}/refresh`, {
            headers: { 'refresh-token': refreshToken }
          });

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;

          await AsyncStorage.setItem('access_token', newAccessToken);
          if (newRefreshToken) {
            await AsyncStorage.setItem('refresh_token', newRefreshToken);
          }

          accessToken = newAccessToken;
          processQueue(null, newAccessToken);
        } catch (err) {
          processQueue(err, null);
          await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
          router.replace('/(routes)/login');
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }
    }

    if (accessToken) {
      config.headers['access-token'] = accessToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Standard 401 handling (fallback)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
        router.replace('/(routes)/login');
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.get(`${SERVER_URI}/refresh`, {
          headers: { 'refresh-token': refreshToken }
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;

        await AsyncStorage.setItem('access_token', newAccessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('refresh_token', newRefreshToken);
        }

        originalRequest.headers['access-token'] = newAccessToken;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
        router.replace('/(routes)/login');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;