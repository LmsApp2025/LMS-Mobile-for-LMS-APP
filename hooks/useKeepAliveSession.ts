// hooks/useKeepAliveSession.ts
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import axiosInstance from '@/utils/axios.instance';

export default function useKeepAliveSession() {
  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        try {
          // This call does NOTHING special
          // It just triggers the axiosInstance request interceptor
          // → Which will automatically detect missing/expired access token
          // → And trigger the refresh flow silently
          await axiosInstance.get('/me-student');
          console.log("Session keep-alive: tokens refreshed");
        } catch (error) {
          // Expected if tokens are expired — interceptor handles logout
          console.log("Session expired or refresh failed — logging out");
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);
}