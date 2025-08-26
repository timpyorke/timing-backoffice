import React, { useState } from 'react';
import { safeStorage } from '@/utils/safeStorage';
import { useAuth } from '@/contexts/AuthContext';
import TokenStatus from '@/components/TokenStatus';

import { 
  User, 
  Settings as SettingsIcon,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

const Settings: React.FC = () => {
  const { user } = useAuth();
  // Notifications removed

  // Load existing settings from localStorage
  const loadSettingsFromStorage = () => {
    try {
      const savedSettings = safeStorage.getItem('app_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return {
          notificationVolume: parsed.notificationVolume || 0.5,
          showOrderNotifications: parsed.showOrderNotifications ?? true,
          showStatusUpdateNotifications: parsed.showStatusUpdateNotifications ?? true,
          autoRefreshInterval: Number(parsed.autoRefreshInterval ?? 30),
        };
      }
    } catch (error) {
      console.error('Failed to parse saved settings:', error);
    }
    // Return default settings if no saved settings found
    return {
      notificationVolume: 0.5,
      showOrderNotifications: true,
      showStatusUpdateNotifications: true,
      autoRefreshInterval: 30,
    };
  };

  const [settings, setSettings] = useState(() => ({
    ...loadSettingsFromStorage(),
    soundEnabled: false
  }));

  // Sync sound enabled state when it changes from the hook
  // Notifications removed

  // Load settings on component mount and when needed
  React.useEffect(() => {
    const storedSettings = loadSettingsFromStorage();
    console.log('Loading settings from storage:', storedSettings);
    setSettings(prev => ({
      ...prev,
      ...storedSettings
    }));
  }, []);

  // Debug: Log settings changes
  React.useEffect(() => {
    console.log('Settings state updated:', settings);
  }, [settings]);

  // Notifications removed

  // Notifications removed

  const handleSaveSettings = () => {
    console.log('Saving settings:', settings);
    
    // Save settings to localStorage
    safeStorage.setItem('app_settings', JSON.stringify(settings));
    
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('settingsChanged', { 
      detail: settings 
    }));
    
    toast.success('Settings saved successfully');
    
    // Verify settings were saved correctly
    const savedSettings = safeStorage.getItem('app_settings');
    console.log('Settings saved to localStorage:', savedSettings);
  };

  // Notifications removed

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <SettingsIcon className="h-8 w-8 text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Profile */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            User Profile
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                {user?.name || 'Not provided'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                {user?.email}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md capitalize">
                {user?.role || 'Staff'}
              </div>
            </div>
               {/* Token Status */}
              <TokenStatus />
          </div>
        </div>

        {/* Notification Settings removed */}

        {/* App Settings */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <SettingsIcon className="h-5 w-5 mr-2" />
            App Settings
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auto Refresh Interval (seconds)
              </label>
              <select
                value={settings.autoRefreshInterval.toString()}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value, 10);
                  console.log('Auto refresh interval changed from', settings.autoRefreshInterval, 'to:', newValue);
                  setSettings(prev => ({ 
                    ...prev, 
                    autoRefreshInterval: newValue
                  }));
                }}
                className="input"
              >
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
                <option value={0}>Disabled</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Current value: {settings.autoRefreshInterval}
              </div>
            </div>

            {/* Notification volume removed */}
          </div>
        </div>

        {/* System Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            System Information
          </h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">App Version:</span>
              <span className="text-gray-900">1.0.0</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span className="text-gray-900">{new Date().toLocaleDateString()}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Browser:</span>
              <span className="text-gray-900">{navigator.userAgent.split(' ')[0]}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Platform:</span>
              <span className="text-gray-900">{navigator.platform}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          className="btn-primary flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>Save Settings</span>
        </button>
      </div>

      {/* Help text removed */}
    </div>
  );
};

export default Settings;
