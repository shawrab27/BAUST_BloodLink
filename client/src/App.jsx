import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppLayout from './components/layout/AppLayout';
import GuestBanner from './components/GuestBanner';
import { AuthProvider, useAuth } from './context/AuthContext';

// Screen imports
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import CompleteProfileScreen from './screens/auth/CompleteProfileScreen';
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
 * FullScreenSpinner — Branded loading splash screen shown during auth verification.
 */
function FullScreenSpinner({ message = 'Verifying session...' }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden"
      id="auth-loading-spinner"
    >
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <img
          src="/emblem.png"
          alt="BAUST BloodLink"
          className="h-16 w-auto object-contain animate-pulse"
        />
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-body-md font-semibold text-on-surface-variant">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * ProtectedRoute — Ensures only authenticated users can access the child route.
 * While checking auth, renders FullScreenSpinner.
 * If unauthenticated, redirects to /login preserving the requested location.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullScreenSpinner message="Verifying session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * AdminRoute — Ensures only authenticated Administrator users can access the admin dashboard.
 * If not authenticated, redirects to /login.
 * If authenticated but non-admin, safely redirects to /feed.
 */
function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullScreenSpinner message="Verifying administrative clearance..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdmin = user && (user.userType === 'Admin' || user.role === 'Admin');
  if (!isAdmin) {
    return <Navigate to="/feed" replace />;
  }

  return children;
}

/**
 * PublicRoute — For login / register screens.
 * If user is already authenticated, redirects to /admin (if admin) or /feed.
 */
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <FullScreenSpinner message="Checking authentication..." />;
  }

  if (isAuthenticated) {
    const isAdmin = user && (user.userType === 'Admin' || user.role === 'Admin');
    return <Navigate to={isAdmin ? '/admin' : '/feed'} replace />;
  }

  return children;
}

/**
 * RootRedirect — Handles "/" path.
 * Renders spinner while checking auth; redirects to /admin (if admin) or /feed if logged in, /login if not.
 */
function RootRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <FullScreenSpinner message="Loading BAUST BloodLink..." />;
  }

  if (isAuthenticated) {
    const isAdmin = user && (user.userType === 'Admin' || user.role === 'Admin');
    return <Navigate to={isAdmin ? '/admin' : '/feed'} replace />;
  }

  return <Navigate to="/login" replace />;
}

/**
 * AppRoutes — Internal routing component with Auth state access.
 */
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* ── Root redirect ──────────────────────────────────────────────── */}
      <Route path="/" element={<RootRedirect />} />

      {/* ── Public Auth routes (redirect to /feed or /admin if already logged in) ─ */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <ErrorBoundary section="Login">
              <LoginScreen />
            </ErrorBoundary>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <ErrorBoundary section="Register">
              <RegisterScreen />
            </ErrorBoundary>
          </PublicRoute>
        }
      />

      {/* ─── Complete Profile — accessible to any authenticated user (Guest or Verified) */}
      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute>
            <ErrorBoundary section="Complete Profile">
              <CompleteProfileScreen />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      {/* ── Admin routes (protected by AdminRoute) ────────────────────── */}
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <ErrorBoundary section="Admin Panel">
              <AppLayout user={user} isAdmin={true} notificationCount={0}>
                <Routes>
                  <Route index element={<AdminDashboardScreen />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </AppLayout>
            </ErrorBoundary>
          </AdminRoute>
        }
      />

      {/* ── Main app routes (protected by default) ─────────────────────── */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <>
              <GuestBanner />
              <AppLayout user={user} notificationCount={0}>
                <Routes>
                  {/* Feed */}
                  <Route
                    path="feed"
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
                          <Link to="/feed" className="btn-primary" id="notfound-go-home">
                            <span className="material-symbols-outlined text-[18px]">home</span>
                            Go to Feed
                          </Link>
                        </div>
                      </div>
                    }
                  />
                </Routes>
              </AppLayout>
            </>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
