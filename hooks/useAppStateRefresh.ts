// hooks/useAppStateRefresh.ts
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import axiosInstance from '@/utils/axios.instance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URI } from '@/utils/uri';

export default function useAppStateRefresh() {
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const accessToken = await AsyncStorage.getItem('access_token');
        const refreshToken = await AsyncStorage.getItem('refresh_token');

        if (accessToken && refreshToken) {
          try {
            // Silent refresh on app resume
            await axiosInstance.get('/me-student');
            // If this succeeds → tokens are still valid
          } catch (error: any) {
            // If 401 → interceptor will auto-refresh
            console.log("Auto-refresh triggered on app resume");
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);
}