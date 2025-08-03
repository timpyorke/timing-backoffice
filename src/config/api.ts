// API Configuration
export interface ApiConfig {
  baseUrl: string;
  wsUrl: string;
}

export const API_CONFIG: Record<string, ApiConfig> = {
  development: {
    baseUrl: 'http://localhost:8000',
    wsUrl: 'ws://localhost:8000'
  },
  production: {
    baseUrl: 'https://your-api.com',
    wsUrl: 'wss://your-api.com'
  }
};

export const getApiConfig = (): ApiConfig => {
  const env = import.meta.env.MODE || 'development';
  return API_CONFIG[env] || API_CONFIG.development;
};

// Environment variables
export const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || API_CONFIG.development.baseUrl;
};

export const getWebSocketUrl = (): string => {
  const baseUrl = getApiBaseUrl();
  // Convert HTTP URL to WebSocket URL
  return baseUrl.replace(/^http/, 'ws').replace('/api', '');
};