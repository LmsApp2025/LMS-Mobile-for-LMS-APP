// In: hooks/auth/useUser.tsx

import { useState, useEffect, useCallback } from "react";
import axiosInstance from '@/utils/axios.instance';

// This is a simplified state management approach for this specific problem.
// It allows us to manually trigger and await a user refetch.
let _refetchUser: () => Promise<void>;

export const forceUserRefetch = async () => {
  if (_refetchUser) {
    await _refetchUser();
  }
};

export default function useUser() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | undefined>(undefined);
  
  const fetchUser = useCallback(async () => {
    setLoading(true); 
    try {
      const res = await axiosInstance.get(`/me-student`);
      setUser(res.data.user);
    } catch (error: any) {
      setUser(undefined); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    _refetchUser = fetchUser; // Assign the function to our global-like variable
    fetchUser(); // Fetch on initial mount

    return () => { // Cleanup
      _refetchUser = async () => {};
    };
  }, [fetchUser]);

  return { loading, user, refetch: fetchUser };
}