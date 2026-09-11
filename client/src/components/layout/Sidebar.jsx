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

  const navItems = [
    {
      id: 'feed',
      label: 'Feed',
      icon: 'newspaper',
      to: '/',
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
      pulse: true,           // Emergency always shows pulsing ping
      pingLabel: 'LIVE',
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
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-space-sm">
                  <span
                    className={`material-symbols-outlined text-[20px] transition-colors ${
                      isActive
                        ? 'text-white'
                        : item.pulse
                        ? 'text-primary animate-pulse'
                        : 'text-primary group-hover:text-primary'
                    }`}
                    style={item.iconFill ? { fontVariationSettings: '"FILL" 1' } : {}}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`text-label-lg font-semibold tracking-wide ${
                      isActive ? 'text-white font-bold' : ''
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                {/* Active indicator dot */}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
                )}

                {/* Emergency live ping (always visible, not just when active) */}
                {!isActive && item.pulse && (
                  <span className="h-2.5 w-2.5 rounded-full bg-primary animate-ping shadow-[0_0_8px_rgba(184,0,53,0.6)]" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom: User info strip */}
      {user && (
        <div className="border-t border-outline-variant/40 pt-space-sm mt-space-sm">
          <div className="flex items-center gap-space-sm px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[16px] text-on-primary-container"
                style={{ fontVariationSettings: '"FILL" 1' }}>
                account_circle
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-label-lg font-semibold text-on-surface truncate leading-none">
                {user.name || 'Unknown'}
              </p>
              <p className="text-label-sm text-on-surface-variant truncate mt-0.5">
                {user.department || ''} · {user.userType || ''}
              </p>
            </div>
            <span className="blood-group-chip ml-auto flex-shrink-0 text-[10px] px-1.5">
              {user.bloodGroup || '—'}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
