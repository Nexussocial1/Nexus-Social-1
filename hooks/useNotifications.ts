import { useState, useEffect, useCallback } from 'react';
import { Notification } from '../types';

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'invite',
    actorName: 'Idris Adamu',
    actorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Idris',
    message: 'invited you to follow a profile. You recently liked their post.',
    timestamp: 'about an hour ago',
    isRead: false,
  },
  {
    id: 'n2',
    type: 'system',
    actorName: 'Ray William Johnson',
    actorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ray',
    message: 'Your round-up of activity is ready to view.',
    timestamp: '5 hours ago',
    isRead: false
  },
  {
    id: 'n3',
    type: 'like',
    actorName: 'Sarah Jenkins',
    actorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    message: 'resonated with your recent transmission.',
    timestamp: '2h ago',
    isRead: true,
    link: '/post/1'
  }
];

export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const storageKey = `nexus_notifications_${userId}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setNotifications(JSON.parse(saved));
    } else {
      setNotifications(INITIAL_NOTIFICATIONS);
      localStorage.setItem(storageKey, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
  }, [storageKey]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }, [storageKey]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }));
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }, [storageKey]);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }, [storageKey]);

  const turnOffNotifications = useCallback(() => {
    // Logic for turning off notifications globally or for specific types
    console.log("Muting neural notification frequencies...");
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    turnOffNotifications
  };
};
