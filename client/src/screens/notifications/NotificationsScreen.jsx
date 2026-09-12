import { useState, useEffect, useCallback } from 'react';
import EmptyState from '../../components/common/EmptyState';
import MessengerView from './MessengerView';

function NotificationsScreen() {
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'messages'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('bloodlink_token');
      if (!token) return;

      const res = await fetch('/api/notifications?limit=25', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 7000); // 7s auto-refresh
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('bloodlink_token');
      if (!token) return;

      const res = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  return (
    <div className="page-wrapper max-w-[1140px] mx-auto pb-16">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="section-heading">
            <span className="material-symbols-outlined text-[26px] text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>
              notifications
            </span>
            Notifications &amp; Direct Messenger
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Real-time emergency blood alerts, donation matches, and 1-on-1 donor coordination
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">notifications</span>
            <span>Alerts &amp; Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-primary font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'messages'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            <span>Direct Messenger</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: NOTIFICATIONS ─────────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="glass-panel rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest/60">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-on-surface">Campus Activity &amp; Urgent Alerts</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary text-white">
                  {unreadCount} Unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="divide-y divide-outline-variant/20 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-on-surface-variant">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon="notifications_none"
                  title="No notifications"
                  description="You're all caught up! Real-time emergency requisitions and campus alerts will arrive here."
                />
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-4 flex items-start gap-3 transition-colors ${
                    !notif.isRead ? 'bg-primary/[0.04]' : 'hover:bg-surface-container/40'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      notif.type === 'EmergencySOS'
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {notif.type === 'EmergencySOS'
                        ? 'crisis_alert'
                        : notif.type === 'DonationMatch'
                        ? 'bloodtype'
                        : 'notifications'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-on-surface truncate">{notif.title}</h4>
                      <span className="text-[11px] text-on-surface-variant flex-shrink-0">
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{notif.message}</p>

                    {notif.metadata?.bloodGroup && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="blood-group-chip text-[10px]">
                          Target: {notif.metadata.bloodGroup}
                        </span>
                        {notif.metadata?.hospital && (
                          <span className="text-[11px] text-on-surface-variant">
                            Facility: {notif.metadata.hospital}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-outline-variant/30 bg-surface-container-lowest text-center">
            <p className="text-[11px] text-on-surface-variant flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[13px] text-primary">sync</span>
              Notifications auto-refresh every 7 seconds via campus channel.
            </p>
          </div>
        </div>
      )}

      {/* ─── TAB 2: DIRECT MESSENGER ─────────────────────────────────────── */}
      {activeTab === 'messages' && <MessengerView />}
    </div>
  );
}

export default NotificationsScreen;
