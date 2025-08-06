import { NotificationPayload } from '@/types';

declare global {
  interface Window {
    OneSignal: any;
  }
}

class NotificationService {
  private notificationCallbacks: ((payload: NotificationPayload) => void)[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load OneSignal SDK
      if (!window.OneSignal) {
        await this.loadOneSignalSDK();
      }

      await window.OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
        serviceWorkerParam: { scope: '/push/onesignal/' },
        serviceWorkerPath: 'OneSignalSDKWorker.js',
        notificationClickHandlerMatch: 'origin',
        notificationClickHandlerAction: 'focus',
        allowLocalhostAsSecureOrigin: true,
      });

      this.isInitialized = true;
      this.setupMessageListener();
      console.log('OneSignal initialized successfully');
    } catch (error) {
      console.error('OneSignal initialization failed:', error);
    }
  }

  private loadOneSignalSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load OneSignal SDK'));
      document.head.appendChild(script);
    });
  }

  async requestPermission(): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        
        // Get the OneSignal subscription ID (player ID)
        const subscription = await window.OneSignal.getUserId();
        if (subscription) {
          console.log('OneSignal Subscription ID:', subscription);
          localStorage.setItem('onesignal_user_id', subscription);
          return subscription;
        } else {
          console.log('No OneSignal subscription ID available.');
        }
      } else {
        console.log('Unable to get permission to notify.');
      }
    } catch (error) {
      console.error('An error occurred while requesting permission:', error);
    }
    
    return null;
  }

  setupMessageListener(): void {
    if (!this.isInitialized || !window.OneSignal) return;

    window.OneSignal.on('notificationClick', (event: any) => {
      console.log('OneSignal notification clicked:', event);
      
      const notification = event.notification;
      const notificationData: NotificationPayload = {
        orderId: notification.additionalData?.orderId || '',
        title: notification.title || 'New Order',
        body: notification.body || 'You have a new order',
        data: notification.additionalData || {},
      };
      
      this.playNotificationSound();
      this.notificationCallbacks.forEach(callback => callback(notificationData));
    });
  }

  private playNotificationSound(): void {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.log('Could not play notification sound:', error);
      });
    } catch (error) {
      console.log('Error creating audio:', error);
    }
  }

  onNotification(callback: (payload: NotificationPayload) => void): () => void {
    this.notificationCallbacks.push(callback);
    
    return () => {
      const index = this.notificationCallbacks.indexOf(callback);
      if (index > -1) {
        this.notificationCallbacks.splice(index, 1);
      }
    };
  }

  toggleSound(enabled: boolean): void {
    localStorage.setItem('notification_sound', enabled.toString());
  }

  isSoundEnabled(): boolean {
    const stored = localStorage.getItem('notification_sound');
    return stored === null ? true : stored === 'true';
  }

  // Method to clear badge, sends a message to the service worker
  async clearBadge(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.active) {
        registration.active.postMessage({ type: 'CLEAR_BADGE' });
      }
    } catch (error) {
      console.error('Failed to send clear badge message to service worker:', error);
    }
  }

  async sendTokenToServer(userId: string): Promise<void> {
    try {
      const response = await fetch('/api/admin/onesignal-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ onesignal_user_id: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send OneSignal user ID to server');
      }
    } catch (error) {
      console.error('Error sending OneSignal user ID to server:', error);
    }
  }
}

export const notificationService = new NotificationService();
