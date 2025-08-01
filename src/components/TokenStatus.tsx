import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const TokenStatus: React.FC = () => {
  const { firebaseUser, refreshToken } = useAuth();
  const [tokenAge, setTokenAge] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!firebaseUser) return;

    const updateTokenAge = async () => {
      try {
        const tokenResult = await firebaseUser.getIdTokenResult();
        const now = Date.now();
        const age = now - new Date(tokenResult.authTime).getTime();
        setTokenAge(age);
      } catch (error) {
        console.error('Error getting token age:', error);
      }
    };

    // Update immediately
    updateTokenAge();

    // Update every minute
    const interval = setInterval(updateTokenAge, 60000);

    return () => clearInterval(interval);
  }, [firebaseUser]);

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshToken();
      toast.success('Session refreshed successfully');
      setTokenAge(0); // Reset age after refresh
    } catch (error) {
      console.error('Manual refresh failed:', error);
      toast.error('Failed to refresh session');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!firebaseUser) return null;

  const tokenAgeMinutes = Math.floor(tokenAge / (1000 * 60));
  const isTokenOld = tokenAgeMinutes > 45; // Show warning after 45 minutes
  const isTokenExpiring = tokenAgeMinutes > 55; // Show urgent warning after 55 minutes

  return (
    <div className="flex items-center space-x-2 text-xs">
      {isTokenExpiring ? (
        <AlertCircle className="h-4 w-4 text-red-500" />
      ) : isTokenOld ? (
        <AlertCircle className="h-4 w-4 text-yellow-500" />
      ) : (
        <Shield className="h-4 w-4 text-green-500" />
      )}
      
      <span className={`${
        isTokenExpiring ? 'text-red-600' : 
        isTokenOld ? 'text-yellow-600' : 
        'text-green-600'
      }`}>
        Session: {tokenAgeMinutes}min
      </span>

      <button
        onClick={handleManualRefresh}
        disabled={isRefreshing}
        className={`p-1 rounded hover:bg-gray-100 ${isRefreshing ? 'animate-spin' : ''}`}
        title="Refresh session"
      >
        <RefreshCw className="h-3 w-3 text-gray-500" />
      </button>
    </div>
  );
};

export default TokenStatus;