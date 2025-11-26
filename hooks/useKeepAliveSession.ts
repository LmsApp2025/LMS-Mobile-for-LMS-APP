// hooks/useKeepAliveSession.ts
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SERVER_URI } from '@/utils/uri';

export default function useKeepAliveSession() {
  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            // This silent call triggers the request interceptor → forces refresh
            await axios.get(`${SERVER_URI}/me-student`, {
              headers: { 'refresh-token': refreshToken },
              timeout: 8000,
            });
          } catch (err) {
            // Expected if tokens are expired — will be handled by interceptor
            console.log("Session keep-alive check complete");
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);
}