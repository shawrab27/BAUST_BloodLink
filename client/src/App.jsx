import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppLayout from './components/layout/AppLayout';

// Screen imports
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import FeedScreen from './screens/feed/FeedScreen';
import BloodHubScreen from './screens/blood-hub/BloodHubScreen';
import SearchDonorsScreen from './screens/blood-hub/SearchDonorsScreen';
import RequestBloodScreen from './screens/blood-hub/RequestBloodScreen';
import EmergencySosScreen from './screens/emergency/EmergencySosScreen';
import HelplineScreen from './screens/helpline/HelplineScreen';
import ProfileScreen from './screens/profile/ProfileScreen';
import NotificationsScreen from './screens/notifications/NotificationsScreen';
import AdminDashboardScreen from './screens/admin/AdminDashboardScreen';

/**
 * App — Root application with BrowserRouter and section-level ErrorBoundaries.
 *
 * Requirement: Each major route section (Feed, Blood Hub, Emergency SOS, Admin)
 * must be wrapped in its own ErrorBoundary so one broken component cannot
 * blank the entire application.
 *
 * Phase 2 will replace the static `user` prop with real JWT auth context.
 */

// Placeholder user for Phase 1 layout testing (replaced by AuthContext in Phase 2)
const PLACEHOLDER_USER = null; // null = not logged in

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Auth routes (no sidebar/topbar) ─────────────────────────────── */}
        <Route
          path="/login"
          element={
            <ErrorBoundary section="Login">
              <LoginScreen />
            </ErrorBoundary>
          }
        />
        <Route
          path="/register"
          element={
            <ErrorBoundary section="Register">
              <RegisterScreen />
            </ErrorBoundary>
          }
        />

        {/* ── Admin routes (blue+red theme override) ───────────────────────── */}
        <Route
          path="/admin/*"
          element={
            <ErrorBoundary section="Admin Panel">
              <AppLayout user={PLACEHOLDER_USER} isAdmin={true} notificationCount={0}>
                <Routes>
                  <Route index element={<AdminDashboardScreen />} />
                  {/* Phase 6 will add sub-routes for each admin section */}
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </AppLayout>
            </ErrorBoundary>
          }
        />

        {/* ── Main app routes (standard 72px topbar + 260px sidebar) ───────── */}
        <Route
          path="/*"
          element={
            <AppLayout user={PLACEHOLDER_USER} notificationCount={0}>
              <Routes>
                {/* Feed */}
                <Route
                  index
                  element={
                    <ErrorBoundary section="Feed">
                      <FeedScreen />
                    </ErrorBoundary>
                  }
                />

                {/* Blood Hub */}
                <Route
                  path="blood-hub"
                  element={
                    <ErrorBoundary section="Blood Hub">
                      <BloodHubScreen />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="blood-hub/search"
                  element={
                    <ErrorBoundary section="Donor Search">
                      <SearchDonorsScreen />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="blood-hub/request"
                  element={
                    <ErrorBoundary section="Blood Request">
                      <RequestBloodScreen />
                    </ErrorBoundary>
                  }
                />

                {/* Emergency SOS */}
                <Route
                  path="emergency"
                  element={
                    <ErrorBoundary section="Emergency SOS">
                      <EmergencySosScreen />
                    </ErrorBoundary>
                  }
                />

                {/* Helpline */}
                <Route
                  path="helpline"
                  element={
                    <ErrorBoundary section="Helpline">
                      <HelplineScreen />
                    </ErrorBoundary>
                  }
                />

                {/* Profile */}
                <Route
                  path="profile/*"
                  element={
                    <ErrorBoundary section="Profile">
                      <ProfileScreen />
                    </ErrorBoundary>
                  }
                />

                {/* Notifications & Messenger */}
                <Route
                  path="notifications"
                  element={
                    <ErrorBoundary section="Notifications">
                      <NotificationsScreen />
                    </ErrorBoundary>
                  }
                />

                {/* 404 fallback */}
                <Route
                  path="*"
                  element={
                    <div className="page-wrapper">
                      <div className="error-state min-h-[60vh]">
                        <span className="material-symbols-outlined text-[64px] text-on-surface-variant">
                          search_off
                        </span>
                        <div>
                          <h1 className="text-headline-lg font-bold text-on-surface">Page Not Found</h1>
                          <p className="text-body-md text-on-surface-variant mt-2">
                            The page you're looking for doesn't exist.
                          </p>
                        </div>
                        <a href="/" className="btn-primary" id="notfound-go-home">
                          <span className="material-symbols-outlined text-[18px]">home</span>
                          Go to Feed
                        </a>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </AppLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
