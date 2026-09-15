import { NavLink, useLocation } from 'react-router-dom';

/**
 * BottomTabBar — Fixed bottom navigation bar for mobile devices (<768px).
 *
 * Provides instant 1-handed thumb-reachable navigation during emergencies:
 * 1. Feed (newspaper)
 * 2. Blood Hub (water_drop)
 * 3. Emergency SOS (e911_emergency) — Highlighted center trigger
 * 4. Helpline (medical_services)
 * 5. Profile (account_circle)
 */
function BottomTabBar() {
  const location = useLocation();

  const tabs = [
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
      label: 'SOS',
      icon: 'e911_emergency',
      to: '/emergency',
      iconFill: true,
      isEmergency: true,
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
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.07)] z-40 flex items-center justify-around px-1"
      aria-label="Mobile Navigation"
      id="mobile-bottom-tabbar"
    >
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? location.pathname === tab.to
          : location.pathname.startsWith(tab.to);

        if (tab.isEmergency) {
          return (
            <NavLink
              key={tab.id}
              to={tab.to}
              id={`mobile-tab-${tab.id}`}
              className={`flex flex-col items-center justify-center -mt-4 group relative focus:outline-none`}
              aria-label="Emergency SOS Cockpit"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 ${
                  isActive
                    ? 'bg-rose-600 text-white ring-4 ring-rose-200 shadow-rose-600/40'
                    : 'bg-primary text-white hover:bg-rose-700 ring-2 ring-white shadow-primary/30'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[24px] animate-pulse"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  {tab.icon}
                </span>
              </div>
              <span
                className={`text-[10px] font-black uppercase tracking-wider mt-0.5 ${
                  isActive ? 'text-primary font-black' : 'text-slate-600'
                }`}
              >
                {tab.label}
              </span>
            </NavLink>
          );
        }

        return (
          <NavLink
            key={tab.id}
            to={tab.to}
            end={tab.exact}
            id={`mobile-tab-${tab.id}`}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[56px] ${
              isActive ? 'text-primary font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[22px] transition-transform active:scale-90"
                style={tab.iconFill && isActive ? { fontVariationSettings: '"FILL" 1' } : {}}
              >
                {tab.icon}
              </span>
              {isActive && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary" />
              )}
            </div>
            <span className="text-[10px] leading-tight mt-0.5 tracking-tight">
              {tab.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default BottomTabBar;
