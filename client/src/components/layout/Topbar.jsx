import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

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
function Topbar({ user = null, notificationCount = 0, isAdmin = false }) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [lang, setLang] = useState('EN');

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
          {/*
           * The logo PNG already has a transparent background.
           * DO NOT add any background color, border, or shadow to this image.
           * object-contain preserves aspect ratio without cropping.
           * mix-blend-mode: normal ensures it renders on the glass without darkening.
           */}
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

          {/* Notification Bell */}
          <button
            className="relative p-2 rounded-full bg-surface-container-lowest/70 border border-primary/20 text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all"
            onClick={() => navigate('/notifications')}
            aria-label="View notifications"
            id="topbar-notifications-btn"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {notificationCount > 0 && (
              <span className="notification-badge">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

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
                        onClick={() => { setProfileOpen(false); navigate('/login'); }}
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
      {profileOpen && (
        <div className="fixed inset-0 z-[55]" onClick={() => setProfileOpen(false)} />
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
