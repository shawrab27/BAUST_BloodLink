import Topbar from './Topbar';
import Sidebar from './Sidebar';

/**
 * AppLayout — Master 1440px desktop layout shell.
 *
 * Structure:
 *   - Fixed 72px Topbar (identical on every screen)
 *   - Fixed 260px Sidebar
 *   - Main content area: padding-left 260px, padding-top 72px
 *   - Ambient WebGL canvas background (subtle ruby fluid shader)
 *   - Admin routes receive .admin-layout class override via isAdmin prop
 */
function AppLayout({ children, user = null, notificationCount = 0, isAdmin = false }) {
  return (
    <div className={`min-h-screen bg-background ${isAdmin ? 'admin-layout' : ''}`}>
      {/* Topbar */}
      <Topbar user={user} notificationCount={notificationCount} isAdmin={isAdmin} />

      {/* Sidebar */}
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
    </div>
  );
}

export default AppLayout;
