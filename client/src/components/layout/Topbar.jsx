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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [lang, setLang] = useState('EN');

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

  const isUserAdmin = isAdmin || (user && (user.userType === 'Admin' || user.role === 'Admin'));

  const navLinks = [
    ...(isUserAdmin ? [{ id: 'admin', label: 'Admin Command', icon: 'shield_person', to: '/admin', iconFill: true, isAdminItem: true }] : []),
    { id: 'feed', label: 'Feed', icon: 'newspaper', to: '/feed' },
    { id: 'blood-hub', label: 'Blood Hub', icon: 'water_drop', to: '/blood-hub', iconFill: true },
    { id: 'emergency', label: 'Emergency SOS', icon: 'e911_emergency', to: '/emergency', iconFill: true, isEmergency: true },
    { id: 'helpline', label: 'Helpline', icon: 'medical_services', to: '/helpline' },
    { id: 'profile', label: 'Profile', icon: 'account_circle', to: '/profile', iconFill: true },
  ];

  return (
    <>
      <header className="topbar">
        <div className="max-w-[1440px] h-full mx-auto px-3 sm:px-margin flex items-center justify-between">

          {/* ── LEFT: Hamburger Menu (<768px) + Official Logo Brand Header ── */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger Button (Mobile Only) */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-xl text-slate-700 hover:text-primary hover:bg-slate-100 transition-colors focus:outline-none flex items-center justify-center min-w-[44px] min-h-[44px]"
              aria-label="Open navigation menu"
              id="topbar-hamburger-btn"
            >
              <span className="material-symbols-outlined text-[26px]">menu</span>
            </button>

            {/* Logo Link */}
            <Link
              to={isUserAdmin ? '/admin' : '/feed'}
              className="flex items-center gap-2 sm:gap-3 hover:opacity-95 transition-all flex-shrink-0 group"
              aria-label="BAUST BloodLink Home"
              id="topbar-logo-link"
            >
              <img
                src="/emblem.png"
                alt="BAUST BloodLink Logo"
                className="h-[36px] sm:h-[44px] w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-lg sm:text-[22px] leading-tight font-black tracking-tight">
                  <span className="brand-baust">
                    BAUST
                  </span>
                  <span className="brand-bloodlink">
                    BloodLink
                  </span>
                </div>
                <div className="hidden xs:flex items-center gap-1 mt-0.5">
                  <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[8.5px] sm:text-[9.5px] font-bold tracking-wider text-primary uppercase">
                    DONATE • CONNECT • SAVE LIVES
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* ── RIGHT: Controls ── */}
          <div className="flex items-center gap-2 sm:gap-space-md">

            {/* Admin Command Header Shortcut (Visible on Desktop / Tablet for Admins) */}
            {isUserAdmin && (
              <Link
                to="/admin"
                id="topbar-admin-shortcut-btn"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-400/30 text-xs font-bold transition shadow-xs hover:scale-105"
                title="Open Admin Command Center"
              >
                <span className="material-symbols-outlined text-[16px]">shield_person</span>
                <span className="hidden sm:inline">Admin Command</span>
              </Link>
            )}

            {/* Language Toggle */}
            <div className="flex items-center bg-surface-container-lowest/80 border border-outline-variant/40 rounded-full p-0.5 shadow-sm">
              <button
                className={`px-2 sm:px-space-sm py-1 rounded-full text-xs sm:text-label-md font-semibold transition-all ${
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
                className={`px-2 sm:px-space-sm py-1 rounded-full text-xs sm:text-label-md font-semibold transition-all ${
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
                        className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
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
                      {isUserAdmin && (
                        <ProfileMenuItem
                          icon="shield_person"
                          label="Admin Command Center"
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="text-amber-700 font-bold bg-amber-500/10 border-l-2 border-amber-500"
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

        {/* Click-outside backdrop for flyouts */}
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

      {/* ── MOBILE SLIDE-IN NAVIGATION DRAWER (<768px) ── */}
      {mobileDrawerOpen && (
        <>
          {/* Dark Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[75] animate-fade-in"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sidebar */}
          <aside
            className="md:hidden fixed inset-y-0 left-0 w-72 max-w-[82vw] bg-white z-[80] shadow-2xl flex flex-col justify-between border-r border-slate-200 animate-slide-right overflow-y-auto"
            id="mobile-navigation-drawer"
            aria-label="Mobile Navigation Drawer"
          >
            <div>
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/emblem.png"
                    alt="BAUST BloodLink Logo"
                    className="h-9 w-auto object-contain drop-shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-1 font-black text-lg leading-tight">
                      <span className="brand-baust">BAUST</span>
                      <span className="brand-bloodlink">BloodLink</span>
                    </div>
                    <span className="text-[9px] font-bold tracking-wider text-primary uppercase block mt-0.5">
                      Campus Life Network
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors focus:outline-none"
                  aria-label="Close navigation drawer"
                  id="mobile-drawer-close-btn"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Drawer Nav Items */}
              <nav className="p-3 space-y-1" aria-label="Mobile Primary Navigation">
                {navLinks.map((item) => (
                  <Link
                    key={item.id}
                    to={item.to}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                      item.isEmergency
                        ? 'bg-rose-50 text-primary border border-rose-200/70 font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-primary'
                    }`}
                    id={`mobile-drawer-nav-${item.id}`}
                  >
                    <span
                      className={`material-symbols-outlined text-[22px] ${
                        item.isEmergency ? 'text-primary animate-pulse' : 'text-slate-500'
                      }`}
                      style={item.iconFill ? { fontVariationSettings: '"FILL" 1' } : {}}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {item.isEmergency && (
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-wider">
                        CRISIS
                      </span>
                    )}
                  </Link>
                ))}

                {/* Admin Link if Admin */}
                {user?.userType === 'Admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-slate-800 bg-amber-50 border border-amber-200/60 hover:bg-amber-100/80 transition-all"
                    id="mobile-drawer-nav-admin"
                  >
                    <span className="material-symbols-outlined text-[22px] text-amber-700">
                      admin_panel_settings
                    </span>
                    <span>Admin Panel</span>
                  </Link>
                )}
              </nav>
            </div>

            {/* Drawer User Footer */}
            <div className="p-4 border-t border-slate-200/80 bg-slate-50/70">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name || 'User'}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm">
                        {user.bloodGroup || (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-on-surface truncate">{user.name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user.department || user.institutionalId || ''}</p>
                    </div>
                    <span className="blood-group-chip text-[11px] px-2 py-0.5">
                      {user.bloodGroup || '—'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-200/80 hover:bg-rose-100 hover:text-primary text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    id="mobile-drawer-logout-btn"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm"
                  >
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold"
                  >
                    <span>Register New Account</span>
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </>
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
