import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useTokenRefresh = () => {
  const { refreshToken, firebaseUser } = useAuth();

  const handleTokenRefresh = useCallback(async () => {
    try {
      if (!firebaseUser) {
        throw new Error('No authenticated user found');
      }

      await refreshToken();
      toast.success('Session refreshed successfully');
    } catch (error) {
      console.error('Token refresh failed:', error);
      toast.error('Failed to refresh session. Please login again.');
      // Redirect to login page
      window.location.href = '/login';
    }
  }, [refreshToken, firebaseUser]);

  const checkTokenExpiration = useCallback(async () => {
    try {
      if (!firebaseUser) {
        return false;
      }

      // Get token result with auth time
      const tokenResult = await firebaseUser.getIdTokenResult();
      const now = Date.now();
      const tokenAge = now - new Date(tokenResult.authTime).getTime();
      
      // If token is older than 50 minutes, refresh it
      const FIFTY_MINUTES = 50 * 60 * 1000;
      if (tokenAge > FIFTY_MINUTES) {
        console.log('Token is getting old, refreshing...');
        await handleTokenRefresh();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return false;
    }
  }, [firebaseUser, handleTokenRefresh]);

  return {
    handleTokenRefresh,
    checkTokenExpiration,
    isAuthenticated: !!firebaseUser,
  };
};