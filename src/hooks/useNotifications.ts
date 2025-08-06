import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/notifications';
import { NotificationPayload } from '@/types';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    setPermission(Notification.permission);
    
    const setupNotifications = async () => {
      await notificationService.initialize();
      const oneSignalUserId = await notificationService.requestPermission();
      if (oneSignalUserId) {
        setUserId(oneSignalUserId);
        await notificationService.sendTokenToServer(oneSignalUserId);
      }
    };

    if (Notification.permission === 'granted') {
      setupNotifications();
    }

    const unsubscribe = notificationService.onNotification((payload) => {
      setNotifications(prev => [payload, ...prev.slice(0, 49)]);
      setUnreadCount(prev => prev + 1);
    });


    return unsubscribe;
  }, []);

  const requestPermission = useCallback(async () => {
    await notificationService.initialize();
    const result = await notificationService.requestPermission();
    setPermission(Notification.permission);
    if (result) {
      setUserId(result);
      await notificationService.sendTokenToServer(result);
    }
    return result;
  }, []);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
    notificationService.clearBadge();
    setBadgeCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    notificationService.clearBadge();
    setBadgeCount(0);
  }, []);

  const toggleSound = useCallback((enabled: boolean) => {
    notificationService.toggleSound(enabled);
  }, []);

  return {
    permission,
    userId,
    notifications,
    unreadCount,
    badgeCount,
    requestPermission,
    markAsRead,
    clearNotifications,
    toggleSound,
    soundEnabled: notificationService.isSoundEnabled(),
  };
};