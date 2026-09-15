import { NavLink, useLocation } from 'react-router-dom';

/**
 * Sidebar — Fixed 260px frosted glass navigation panel.
 *
 * Matches Stitch screen "BAUST BloodLink - Desktop Home Feed" sidebar exactly:
 * - Feed (newspaper icon) — active state: crimson gradient pill
 * - Blood Hub (water_drop icon, filled)
 * - Emergency SOS (e911_emergency icon, filled, pulsing red ping indicator)
 * - Helpline (medical_services icon)
 * - Profile (account_circle icon, filled)
 *
 * Admin sidebar overrides: dark slate background (via .admin-layout parent class)
 */
function Sidebar({ user = null }) {
  const location = useLocation();

  const isAdmin = user && (user.userType === 'Admin' || user.role === 'Admin');

  const navItems = [
    ...(isAdmin
      ? [
          {
            id: 'admin',
            label: 'Admin Command',
            icon: 'shield_person',
            to: '/admin',
            iconFill: true,
            isAdmin: true,
          },
        ]
      : []),
    {
      id: 'feed',
      label: 'Feed',
      icon: 'newspaper',
      to: '/feed',
      exact: true,
    },
    {
      id: 'blood-hub',
      label: 'Blood Hub',
      icon: 'water_drop',
      to: '/blood-hub',
      iconFill: true,
    },
    {
      id: 'emergency',
      label: 'Emergency',
      icon: 'e911_emergency',
      to: '/emergency',
      iconFill: true,
    },
    {
      id: 'helpline',
      label: 'Helpline',
      icon: 'medical_services',
      to: '/helpline',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'account_circle',
      to: '/profile',
      iconFill: true,
    },
  ];

  const isGuest = user && (user.accountStatus === 'Guest' || user.isGuest === true);

  return (
    <aside className="sidebar" id="main-sidebar" aria-label="Main navigation">
      <div className="flex flex-col gap-space-xs">
        <nav className="flex flex-col gap-1.5" aria-label="Primary navigation">
          {navItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.exact}
                id={`sidebar-nav-${item.id}`}
                title={item.label}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-space-sm justify-center lg:justify-start">
                  <span
                    className={`material-symbols-outlined text-[22px] transition-colors shrink-0 ${
                      isActive
                        ? 'text-white'
                        : 'text-primary group-hover:text-primary'
                    }`}
                    style={item.iconFill ? { fontVariationSettings: '"FILL" 1' } : {}}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`text-label-lg font-semibold tracking-wide hidden lg:inline ${
                      isActive ? 'text-white font-bold' : ''
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                {/* Active indicator dot (desktop only) */}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff] hidden lg:inline-block shrink-0" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom: User info strip */}
      {user && (
        <div className="border-t border-outline-variant/40 pt-space-sm mt-space-sm">
          {/* Desktop full view */}
          <div className="hidden lg:flex items-center justify-between px-2 py-2">
            <div className="min-w-0">
              <p className="text-label-lg font-semibold text-on-surface truncate leading-none">
                {isGuest ? (user.name || 'Guest Explorer') : (user.name || 'Unknown')}
              </p>
              <p className="text-label-sm text-on-surface-variant truncate mt-0.5">
                {isGuest ? 'Guest Access' : `${user.department || ''} · ${user.userType || ''}`}
              </p>
            </div>
            {isAdmin ? (
              <span className="ml-auto flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30 uppercase tracking-wider">
                Admin
              </span>
            ) : isGuest ? (
              <span className="ml-auto flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Guest
              </span>
            ) : (
              <span className="blood-group-chip ml-auto flex-shrink-0 text-[10px] px-1.5">
                {user.bloodGroup || '—'}
              </span>
            )}
          </div>

          {/* Tablet icon-only user avatar */}
          <div className="flex lg:hidden items-center justify-center p-1" title={user.name || 'User Profile'}>
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-primary font-black text-xs ring-2 ring-primary/20">
              {user.bloodGroup || (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
