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
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['access-token'] = token;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error("No refresh token available");

        // Use a separate, clean axios instance for the refresh call
        const refreshAxios = axios.create();
        const res = await refreshAxios.get(`${SERVER_URI}/refresh`, {
          headers: { 'refresh-token': refreshToken },
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = res.data;

        // Securely store the new tokens
        await AsyncStorage.setItem('access_token', newAccessToken);
        await AsyncStorage.setItem('refresh_token', newRefreshToken);
        
        // Set the new token on the original request's header
        axiosInstance.defaults.headers.common['access-token'] = newAccessToken;
        originalRequest.headers['access-token'] = newAccessToken;
        
        processQueue(null, newAccessToken);
        
        // Retry the original request
        return axiosInstance(originalRequest);

      } catch (refreshError: any) {
        console.log("Session refresh failed. Logging out.");
        processQueue(refreshError, null);
        
        // Clear out invalid tokens
        await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
        
        // Redirect to the start of the app flow
        router.replace("/(routes)/onboarding"); 
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { SERVER_URI } from './uri';
// import { router } from 'expo-router';

// const axiosInstance = axios.create({
//   baseURL: SERVER_URI,
// });

// let isRefreshing = false;
// let failedQueue: any[] = [];

// const processQueue = (error: any, token: string | null = null) => {
//   failedQueue.forEach(prom => {
//     if (error) {
//       prom.reject(error);
//     } else {
//       prom.resolve(token);
//     }
//   });
//   failedQueue = [];
// };

// axiosInstance.interceptors.request.use(
//   async (config) => {
//     const accessToken = await AsyncStorage.getItem('access_token');
//     if (accessToken) {
//       config.headers['access-token'] = accessToken;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         }).then(token => {
//           originalRequest.headers['access-token'] = token;
//           return axiosInstance(originalRequest);
//         });
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {
//         const refreshToken = await AsyncStorage.getItem('refresh_token');
//         if (!refreshToken) throw new Error("No refresh token");

//         const refreshAxios = axios.create();
//         const res = await refreshAxios.get(`${SERVER_URI}/refresh`, {
//           headers: { 'refresh-token': refreshToken },
//         });

//         const { accessToken, refreshToken: newRefreshToken } = res.data;
        
//         await AsyncStorage.setItem('access_token', accessToken);
//         await AsyncStorage.setItem('refresh_token', newRefreshToken);
        
//         // THE CRITICAL FIX: Update the header for the request being retried.
//         originalRequest.headers['access-token'] = accessToken;
        
//         processQueue(null, accessToken);
//         return axiosInstance(originalRequest); // Now this request has the new token

//       } catch (refreshError: any) {
//         processQueue(refreshError, null);
//         console.log("Session refresh failed. Logging out.");
//         await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
//         router.replace("/(routes)/login");
//         return Promise.reject(refreshError);
//       } finally {
//         isRefreshing = false;
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;
