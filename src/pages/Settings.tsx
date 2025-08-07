import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import TokenStatus from '@/components/TokenStatus';

import { 
  User, 
  Bell, 
  Volume2, 
  VolumeX, 
  Smartphone,
  Settings as SettingsIcon,
  Save,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { 
    permission, 
    userId, 
    requestPermission, 
    soundEnabled, 
    toggleSound 
  } = useNotifications();

  // Load existing settings from localStorage
  const loadSettingsFromStorage = () => {
    try {
      const savedSettings = localStorage.getItem('app_settings');
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
    soundEnabled: soundEnabled
  }));

  // Sync sound enabled state when it changes from the hook
  React.useEffect(() => {
    setSettings(prev => ({ ...prev, soundEnabled }));
  }, [soundEnabled]);

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

  const handleSoundToggle = () => {
    const newSoundEnabled = !settings.soundEnabled;
    setSettings(prev => ({ ...prev, soundEnabled: newSoundEnabled }));
    toggleSound(newSoundEnabled);
    toast.success(`Sound notifications ${newSoundEnabled ? 'enabled' : 'disabled'}`);
  };

  const handleRequestNotifications = async () => {
    try {
      const token = await requestPermission();
      if (token) {
        toast.success('Notification permissions granted!');
      } else {
        toast.error('Failed to get notification permissions');
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
      toast.error('Failed to request notification permissions');
    }
  };

  const handleSaveSettings = () => {
    console.log('Saving settings:', settings);
    
    // Save settings to localStorage
    localStorage.setItem('app_settings', JSON.stringify(settings));
    
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('settingsChanged', { 
      detail: settings 
    }));
    
    toast.success('Settings saved successfully');
    
    // Verify settings were saved correctly
    const savedSettings = localStorage.getItem('app_settings');
    console.log('Settings saved to localStorage:', savedSettings);
  };

  const getNotificationStatus = () => {
    switch (permission) {
      case 'granted':
        return { color: 'text-green-600', text: 'Enabled', icon: Bell };
      case 'denied':
        return { color: 'text-red-600', text: 'Blocked', icon: AlertCircle };
      default:
        return { color: 'text-yellow-600', text: 'Not Requested', icon: AlertCircle };
    }
  };

  const notificationStatus = getNotificationStatus();

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

        {/* Notification Settings */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
          </h2>
          
          <div className="space-y-4">
            {/* Notification Permission Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <notificationStatus.icon className={`h-5 w-5 mr-2 ${notificationStatus.color}`} />
                <span className="text-sm font-medium">Push Notifications</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${notificationStatus.color}`}>
                  {notificationStatus.text}
                </span>
                {permission !== 'granted' && (
                  <button
                    onClick={handleRequestNotifications}
                    className="btn-primary text-xs px-2 py-1"
                  >
                    Enable
                  </button>
                )}
              </div>
            </div>

            {/* OneSignal User ID Info */}
            {userId && (
              <div className="p-3 bg-blue-50 rounded-md">
                <div className="flex items-center mb-2">
                  <Smartphone className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-900">OneSignal User ID</span>
                </div>
                <div className="text-xs text-blue-700 font-mono bg-blue-100 p-2 rounded break-all">
                  {userId.substring(0, 50)}...
                </div>
              </div>
            )}

            {/* Sound Settings */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {settings.soundEnabled ? (
                  <Volume2 className="h-5 w-5 text-gray-600 mr-2" />
                ) : (
                  <VolumeX className="h-5 w-5 text-gray-600 mr-2" />
                )}
                <span className="text-sm font-medium">Sound Alerts</span>
              </div>
              <button
                onClick={handleSoundToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.soundEnabled ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Notification Types */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">New Order Notifications</span>
                <button
                  onClick={() => setSettings(prev => ({ 
                    ...prev, 
                    showOrderNotifications: !prev.showOrderNotifications 
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showOrderNotifications ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showOrderNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Status Update Notifications</span>
                <button
                  onClick={() => setSettings(prev => ({ 
                    ...prev, 
                    showStatusUpdateNotifications: !prev.showStatusUpdateNotifications 
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showStatusUpdateNotifications ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showStatusUpdateNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notification Volume
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.notificationVolume}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  notificationVolume: parseFloat(e.target.value) 
                }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Silent</span>
                <span>{Math.round(settings.notificationVolume * 100)}%</span>
                <span>Loud</span>
              </div>
            </div>
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

      {/* Help Text */}
      <div className="card p-4 bg-blue-50 border-blue-200">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Notification Setup</p>
            <p>
              To receive push notifications for new orders, make sure to enable notifications 
              when prompted. If you've already denied permissions, you can re-enable them in 
              your browser settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;