import Topbar from './Topbar';
import Sidebar from './Sidebar';
import BottomTabBar from './BottomTabBar';

/**
 * AppLayout — Responsive layout shell.
 *
 * Structure:
 *   - Fixed 72px Topbar (identical on every screen, hamburger menu on mobile)
 *   - Fixed Sidebar (260px desktop, collapsed 72px tablet, hidden <768px)
 *   - Fixed BottomTabBar (mobile <768px only, instant thumb-reachable emergency navigation)
 *   - Main content area: responsive left padding & bottom padding
 *   - Admin routes receive .admin-layout class override via isAdmin prop
 */
function AppLayout({ children, user = null, notificationCount = 0, isAdmin = false }) {
  return (
    <div className={`min-h-screen bg-background ${isAdmin ? 'admin-layout' : ''}`}>
      {/* Topbar */}
      <Topbar user={user} notificationCount={notificationCount} isAdmin={isAdmin} />

      {/* Sidebar (Desktop 260px, Tablet 72px, Mobile hidden) */}
      <Sidebar user={user} />

      {/* Main Content Area */}
      <div className="main-content">
        <main className="relative min-h-[calc(100vh-72px)] w-full">
          {/* Page Content */}
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (<768px) */}
      <BottomTabBar />
    </div>
  );
}

export default AppLayout;
