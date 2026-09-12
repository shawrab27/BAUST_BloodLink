import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * Topbar — Fixed 72px application header.
 *
 * Logo: official-logo.png (BAUST BloodLink logo with transparent background).
 * Rendered directly on the frosted glass header — NO white or black background
 * wrapper on the image. PNG transparency renders natively on glass surface.
 *
 * Left corner: Logo image only (the PNG already contains "BAUST BloodLink" +
 * "DONATE • CONNECT • SAVE LIVES" as built-in text — no duplicate HTML text).
 */
function Topbar({ user: propUser = null, notificationCount = 0, isAdmin = false }) {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const user = propUser || authUser;
  const [profileOpen, setProfileOpen] = useState(false);
  const [lang, setLang] = useState('EN');

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [liveUnreadCount, setLiveUnreadCount] = useState(notificationCount || 4);
  const [notificationsList, setNotificationsList] = useState([]);

  // Fetch notifications and unread count periodically (10s)
  useEffect(() => {
    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/notifications?limit=6', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setLiveUnreadCount(data.unreadCount ?? 0);
            setNotificationsList(data.notifications || []);
          }
        }
      } catch {
        // Fallback gracefully
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setLiveUnreadCount(0);
      setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Ignored
    }
  };

  return (
    <header className="topbar">
      <div className="max-w-[1440px] h-full mx-auto px-margin flex items-center justify-between">

        {/* ── LEFT: Official Logo — transparent PNG floating on glass ── */}
        <Link
          to="/"
          className="flex items-center hover:opacity-90 transition-opacity flex-shrink-0"
          aria-label="BAUST BloodLink Home"
          id="topbar-logo-link"
        >
          <img
            src="/official-logo.png"
            alt="BAUST BloodLink — Donate, Connect, Save Lives"
            className="h-[56px] w-auto object-contain"
            style={{
              background: 'transparent',
              filter: 'none',
              mixBlendMode: 'normal',
            }}
          />
        </Link>

        {/* ── RIGHT: Controls ── */}
        <div className="flex items-center gap-space-md">

          {/* Quick Emergency Call Badge */}
          <a
            href="tel:+8801769660000"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/20 transition"
            title="BAUST Emergency Hotline"
          >
            <span className="material-symbols-outlined text-[16px]">call</span>
            <span>Hotline: +880 1769-660000</span>
          </a>

          {/* Language Toggle */}
          <div className="flex items-center bg-surface-container-lowest/80 border border-outline-variant/40 rounded-full p-0.5 shadow-sm">
            <button
              className={`px-space-sm py-1 rounded-full text-label-md font-semibold transition-all ${
                lang === 'EN'
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setLang('EN')}
              id="topbar-lang-en"
            >
              EN
            </button>
            <button
              className={`px-space-sm py-1 rounded-full text-label-md font-semibold transition-all ${
                lang === 'BN'
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setLang('BN')}
              id="topbar-lang-bn"
            >
              BN
            </button>
          </div>

          {/* Notification Bell + Flyout */}
          <div className="relative">
            <button
              className="relative p-2 rounded-full bg-surface-container-lowest/70 border border-primary/20 text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all"
              onClick={() => setNotificationsOpen((o) => !o)}
              aria-label="View notifications"
              id="topbar-notifications-btn"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {liveUnreadCount > 0 && (
                <span className="notification-badge">
                  {liveUnreadCount > 9 ? '9+' : liveUnreadCount}
                </span>
              )}
            </button>

            {/* Notification Flyout */}
            {notificationsOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-modal shadow-2xl rounded-2xl border border-primary/25 py-3 z-[60] animate-fade-in text-left"
                id="topbar-notifications-flyout"
              >
                <div className="px-4 py-2 border-b border-outline-variant/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">notifications</span>
                    <span className="font-bold text-sm text-on-surface">Campus Alerts</span>
                    {liveUnreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                        {liveUnreadCount} unread
                      </span>
                    )}
                  </div>
                  {liveUnreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[320px] overflow-y-auto divide-y divide-outline-variant/20 text-xs">
                  {notificationsList.length === 0 ? (
                    <div className="p-6 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-[32px] text-outline mb-1">
                        notifications_off
                      </span>
                      <p className="text-xs">No notifications yet</p>
                    </div>
                  ) : (
                    notificationsList.map((notif) => (
                      <div
                        key={notif._id}
                        className={`p-3 hover:bg-primary/[0.03] transition flex items-start gap-2.5 ${
                          !notif.isRead ? 'bg-primary/[0.04]' : ''
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[18px] mt-0.5 ${
                            notif.type === 'EmergencySOS' ? 'text-primary' : 'text-primary'
                          }`}
                        >
                          {notif.type === 'EmergencySOS' ? 'crisis_alert' : 'info'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-on-surface truncate">{notif.title}</p>
                          <p className="text-on-surface-variant line-clamp-2 mt-0.5">{notif.message}</p>
                          <span className="text-[10px] text-outline block mt-1">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 pt-2.5 border-t border-outline-variant/20 text-center">
                  <Link
                    to="/emergency"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1"
                  >
                    <span>Go to Emergency SOS Cockpit</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar + Flyout */}
          <div className="relative flex items-center pl-space-xs">
            <button
              className="relative rounded-full p-0.5 ring-2 ring-primary/40 ring-offset-2 ring-offset-surface hover:ring-primary transition-all"
              onClick={() => setProfileOpen((o) => !o)}
              aria-label="Open profile menu"
              id="topbar-profile-btn"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || 'Profile'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-on-primary-container">
                    account_circle
                  </span>
                </div>
              )}
            </button>

            {/* Flyout dropdown */}
            {profileOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-56 glass-modal shadow-glass-lg py-2 z-[60] animate-fade-in"
                id="topbar-profile-flyout"
              >
                {user ? (
                  <>
                    <div className="px-4 py-3 border-b border-outline-variant/40">
                      <p className="text-label-lg font-semibold text-on-surface truncate">
                        {user.name || 'User'}
                      </p>
                      <p className="text-body-sm text-on-surface-variant truncate">
                        {user.institutionalId || ''}
                      </p>
                      <span className="blood-group-chip mt-1 inline-block">
                        {user.bloodGroup || '—'}
                      </span>
                    </div>
                    <ProfileMenuItem icon="person" label="My Profile" to="/profile" onClick={() => setProfileOpen(false)} />
                    <ProfileMenuItem icon="settings" label="Settings" to="/profile/settings" onClick={() => setProfileOpen(false)} />
                    {user.userType === 'Admin' && (
                      <ProfileMenuItem
                        icon="admin_panel_settings"
                        label="Admin Panel"
                        to="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="text-primary"
                      />
                    )}
                    <div className="border-t border-outline-variant/40 mt-1 pt-1">
                      <ProfileMenuItem
                        icon="logout"
                        label="Sign Out"
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                          navigate('/login');
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <ProfileMenuItem icon="login" label="Sign In" to="/login" onClick={() => setProfileOpen(false)} />
                    <ProfileMenuItem icon="person_add" label="Register" to="/register" onClick={() => setProfileOpen(false)} />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click-outside backdrop */}
      {(profileOpen || notificationsOpen) && (
        <div
          className="fixed inset-0 z-[55]"
          onClick={() => {
            setProfileOpen(false);
            setNotificationsOpen(false);
          }}
        />
      )}
    </header>
  );
}

function ProfileMenuItem({ icon, label, to, onClick, className = '' }) {
  const content = (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-space-sm px-4 py-2.5 text-label-lg text-on-surface hover:bg-surface-container transition-all ${className}`}
      id={`profile-menu-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{icon}</span>
      {label}
    </button>
  );
  if (to) return <Link to={to}>{content}</Link>;
  return content;
}

export default Topbar;
