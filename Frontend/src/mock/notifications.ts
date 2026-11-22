import { apiClient } from '../services/apiClient';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'alert';
  relatedApplicationId?: string;
  actionUrl?: string;
}

const STORAGE_KEY = 'goveaseai_notifications';

function getStoredNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read notifications from storage:', err);
  }
  return [];
}

function saveStoredNotifications(notifs: NotificationItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
  } catch (err) {
    console.error('Failed to write notifications to storage:', err);
  }
}

export const INITIAL_MOCK_NOTIFICATIONS: NotificationItem[] = [];

export const notificationService = {
  getNotifications(userId: string): NotificationItem[] {
    // Sync live notifications from PostgreSQL API
    apiClient.get<NotificationItem[]>('/notifications').then((res) => {
      if (res.ok && Array.isArray(res.data)) {
        saveStoredNotifications(res.data);
        window.dispatchEvent(new CustomEvent('govease_notifications_updated', { detail: res.data }));
      }
    }).catch((err) => {
      console.warn('Failed to sync notifications from API:', err);
    });

    return getStoredNotifications().filter((n) => n.userId === userId);
  },

  getUnreadCount(userId: string): number {
    return this.getNotifications(userId).filter((n) => !n.read).length;
  },

  markAsRead(notificationId: string): void {
    const notifs = getStoredNotifications();
    const index = notifs.findIndex((n) => n.id === notificationId);
    if (index !== -1) {
      notifs[index].read = true;
      saveStoredNotifications(notifs);
    }

    apiClient.put(`/notifications/${notificationId}/read`).catch(() => {});
  },

  markAllAsRead(userId: string): void {
    const notifs = getStoredNotifications();
    notifs.forEach((n) => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
    saveStoredNotifications(notifs);

    apiClient.put('/notifications/read-all').catch(() => {});
  }
};
