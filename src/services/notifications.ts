import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { getFirebaseMessaging } from './firebase';
import { NotificationPayload } from '@/types';

class NotificationService {
  private messaging = getFirebaseMessaging();
  private notificationCallbacks: ((payload: NotificationPayload) => void)[] = [];
  private badgeCount = 0;

  async requestPermission(): Promise<string | null> {
    if (!this.messaging) {
      console.warn('Firebase Messaging not supported in this environment');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        const currentToken = await getToken(this.messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });
        
        if (currentToken) {
          console.log('FCM Registration Token:', currentToken);
          localStorage.setItem('fcm_token', currentToken);
          return currentToken;
        } else {
          console.log('No registration token available.');
        }
      } else {
        console.log('Unable to get permission to notify.');
      }
    } catch (error) {
      console.error('An error occurred while retrieving token:', error);
    }
    
    return null;
  }

  setupMessageListener(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload: MessagePayload) => {
      console.log('Message received. ', payload);
      
      const notificationData: NotificationPayload = {
        orderId: payload.data?.orderId || '',
        title: payload.notification?.title || 'New Order',
        body: payload.notification?.body || 'You have a new order',
        data: payload.data,
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

  initializeBadgeCount(): void {
    const stored = localStorage.getItem('notification_badge_count');
    this.badgeCount = stored ? parseInt(stored, 10) : 0;
  }

  async sendTokenToServer(token: string): Promise<void> {
    try {
      const response = await fetch('/api/admin/fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ fcm_token: token }),
      });

      if (!response.ok) {
        throw new Error('Failed to send token to server');
      }
    } catch (error) {
      console.error('Error sending token to server:', error);
    }
  }
}

export const notificationService = new NotificationService();
