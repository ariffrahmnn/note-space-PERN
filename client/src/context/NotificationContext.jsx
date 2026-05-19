// client/src/context/NotificationContext.jsx
// Context terpisah dari AuthContext — tidak merusak yang sudah ada

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext.jsx';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuth } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuth) return;
    setLoading(true);
    try {
      const { data } = await axios.get('/api/notifications');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('fetchNotifications error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuth]);

  // Poll setiap 30 detik saat user login
  useEffect(() => {
    if (!isAuth) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [isAuth, fetchNotifications]);

  const respond = async (notifId, action) => {
    await axios.post(`/api/notifications/${notifId}/respond`, { action });
    // Update state lokal tanpa re-fetch
    setNotifications(prev =>
      prev.map(n => n.id === notifId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await axios.patch('/api/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, loading,
      respond, markAllRead, refetch: fetchNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
