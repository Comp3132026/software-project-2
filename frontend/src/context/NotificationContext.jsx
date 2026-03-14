import { createContext, useContext, useState, useEffect } from 'react';
import { notificationsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [frequency, setFrequency] = useState(() => {
    return localStorage.getItem('notification_frequency') || '1h';
  });

  const saveFrequency = async (value) => {
    setFrequency(value);
    localStorage.setItem('notification_frequency', value);

    try {
      await notificationsAPI.updateFrequency(value);
      toast.success('Notification frequency updated!');
    } catch (err) {
      toast.error('Failed to save notification frequency');
    }
  };

  // load once user logged in
  const loadNotifications = async () => {
    if (!user) {
      return;
    } // safety check

    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  // Safe load when user logs in
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    loadNotifications();
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        loading,
        reloadNotifications: loadNotifications,
        frequency,
        setFrequency: saveFrequency,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

