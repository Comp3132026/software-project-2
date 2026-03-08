import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { notificationsAPI } from '../utils/api';

export default function NotificationsModal({ groupId, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [groupId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const notifRes = await notificationsAPI.getAll();
      setNotifications(notifRes.data);

      if (groupId) {
        const histRes = await notificationsAPI.getHistory(groupId);
        setHistory(histRes.data);
      }

      // Mark all as read
      await notificationsAPI.markAllRead();
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
    setLoading(false);
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
    return d.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Notifications - matching wireframe image 3 */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                <h3 className="font-semibold text-lg">Notification</h3>
                <span className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Frequency +
                </span>
              </div>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {notifications.slice(0, 10).map((n) => (
                  <div key={n._id} className="bg-gray-200 p-3 rounded">
                    <p className="text-sm">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(n.createdAt)}</p>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-gray-500 text-sm">No notifications</p>
                )}
              </div>
            </div>

            {/* History Log - matching wireframe image 3 */}
            <div>
              <h3 className="font-semibold text-lg mb-4">History Log</h3>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {history.slice(0, 10).map((h) => (
                  <div key={h._id} className="bg-gray-200 p-3 rounded">
                    <p className="text-sm">{h.action}</p>
                    {h.details && <p className="text-xs text-gray-600">{h.details}</p>}
                    <p className="text-xs text-gray-500 mt-1">{formatTime(h.createdAt)}</p>
                  </div>
                ))}
                {history.length === 0 && <p className="text-gray-500 text-sm">No history</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
