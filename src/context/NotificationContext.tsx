import React, { createContext, useContext, useState, useCallback } from 'react';

export type NotificationType =
  | 'invite-received'
  | 'invite-accepted'
  | 'invite-declined'
  | 'invite-expired'
  | 'connection-error'
  | 'success'
  | 'info'
  | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // in milliseconds, 0 = permanent
  data?: Record<string, any>; // Custom data (e.g., inviteId for invite notifications)
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string; // Returns notification ID
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>): string => {
    const id = `${Date.now()}-${Math.random()}`;
    const newNotification: Notification = { ...notification, id };

    setNotifications((prev) => {
      const updated = [...prev, newNotification];
      // Keep max 3 notifications
      if (updated.length > 3) {
        return updated.slice(-3);
      }
      return updated;
    });

    // Auto-remove if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification, clearNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
