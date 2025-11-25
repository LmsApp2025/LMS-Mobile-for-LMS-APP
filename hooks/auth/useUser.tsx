// In new-client/hooks/auth/useUser.tsx

import { useState, useEffect, useCallback } from "react";
import axiosInstance from '@/utils/axios.instance';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function useUser() {
  const [loading, setLoading] = useState(true); // Start with loading = true
  const [user, setUser] = useState<User | undefined>(undefined);
  
  const fetchUser = useCallback(async () => {
    // When we start a fetch, always set loading to true
    setLoading(true); 
    try {
      // The axiosInstance will automatically try to refresh the token if the access token is expired.
      // If BOTH tokens are invalid, it will throw an error which we catch below.
      const res = await axiosInstance.get(`/me-student`); // The '/api/v1' is already in the instance's baseURL
      
      // If the request is successful, we have a valid user.
      setUser(res.data.user);

    } catch (error: any) {
      console.log("useUser hook fetch failed:", error.response?.data?.message || error.message);
      // If fetching fails for any reason (401, network error, etc.), clear the user.
      setUser(undefined); 
      // It's also a good idea to clear out potentially invalid tokens from storage
      await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
    } finally {
      // CRITICAL FIX: Only set loading to false AFTER the entire process (success or fail) is complete.
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { loading, user, refetch: fetchUser };
}
