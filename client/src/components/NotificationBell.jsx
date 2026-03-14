import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnread(res.data.unread);
      }
    } catch { /* user not logged in — fail silently */ }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 15 seconds for new notifications
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = async () => {
    setOpen(v => !v);
    if (!open && unread > 0) {
      try {
        await axios.post('/notifications/read');
        setUnread(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch {}
    }
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        title="Notifications"
      >
        <i className={`ri-notification-3-${unread > 0 ? 'fill text-red-500' : 'line text-gray-600'} text-xl`}></i>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
            {unread === 0 && notifications.length > 0 && (
              <span className="text-xs text-gray-400">All caught up ✓</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <i className="ri-notification-off-line text-3xl mb-2"></i>
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs mt-1">When someone likes your pin, you'll see it here!</p>
              </div>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${!n.read ? 'bg-red-50/50' : ''}`}
                >
                  {/* Liker avatar */}
                  <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden bg-gray-200 border-2 border-white shadow-sm">
                    {n.likerProfileImage ? (
                      <img src={`http://localhost:3000/images/uploads/${n.likerProfileImage}`} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        {n.likerUsername?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-800 leading-snug">
                      <span className="font-semibold text-gray-900">@{n.likerUsername}</span>{' '}
                      {n.type === 'like' ? 'liked your pin' : 'interacted with your pin'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>

                  {/* Post thumbnail */}
                  {n.postImage && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img src={`http://localhost:3000/images/uploads/${n.postImage}`} className="w-full h-full object-cover" alt="" />
                    </div>
                  )}

                  {/* Unread dot */}
                  {!n.read && <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
