import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { signInWithProvider, firebaseLogout } from '../config/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bloodlink_user') || localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('bloodlink_token') || localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stores the URL a Guest tried to visit before being redirected to /complete-profile
  const pendingRedirectRef = useRef(null);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function persistSession(jwtToken, userData) {
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('bloodlink_token', jwtToken);
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('bloodlink_user', JSON.stringify(userData));
    localStorage.setItem('user', JSON.stringify(userData));
  }

  // Logout handler
  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bloodlink_token');
    localStorage.removeItem('bloodlink_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    pendingRedirectRef.current = null;
    await firebaseLogout();
  }, []);

  // Fetch current user from server on load if token exists (with 2s fail-fast timeout)
  const fetchCurrentUser = useCallback(async (authToken) => {
    if (!authToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        signal: controller.signal,
      }).catch((err) => {
        if (err.name === 'AbortError') return null;
        throw err;
      });
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('bloodlink_user', JSON.stringify(data.user));
        localStorage.setItem('user', JSON.stringify(data.user));
      } else if (res && (res.status === 401 || res.status === 403)) {
        logout();
      }
    } catch (err) {
      console.warn('[Auth] Session verification skipped:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchCurrentUser(token);
  }, [token, fetchCurrentUser]);

  // ── Local credential login ───────────────────────────────────────────────────
  const login = async ({ institutionalId, password, fcmToken }) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionalId: institutionalId.trim().toUpperCase(),
          password,
          fcmToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data.message || data.error || 'Failed to sign in.';
        setError(errorMessage);
        return { success: false, error: errorMessage, errors: data.errors };
      }

      persistSession(data.token, data.user);
      return { success: true, user: data.user };
    } catch {
      const message = 'Unable to reach the server. Please check your network connection.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // ── OAuth social login ───────────────────────────────────────────────────────
  /**
   * socialLogin: triggers a Firebase OAuth popup then calls POST /api/auth/oauth
   * to create/retrieve a Guest account and get a JWT.
   *
   * Provider: 'google' | 'facebook' | 'github'
   */
  const socialLogin = async (providerName) => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get OAuth credentials from Firebase
      const providerData = await signInWithProvider(providerName);

      // Step 2: Exchange with our backend for a JWT
      const res = await fetch('/api/auth/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerData),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.message || 'Social login failed. Please try again.';
        setError(message);
        return { success: false, error: message };
      }

      persistSession(data.token, data.user);
      return { success: true, user: data.user, isGuest: data.user?.isGuest || data.user?.accountStatus === 'Guest' };
    } catch (err) {
      // Handle Firebase popup closed by user
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setError(null);
        return { success: false, error: 'Sign-in cancelled.' };
      }
      const message = err?.message || 'Social login failed. Please try again.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // ── Complete profile (Guest → Verified upgrade) ──────────────────────────────
  /**
   * completeProfile: submits campus details for a Guest user.
   * Updates the SAME User document server-side (not a new account).
   * Re-issues a new JWT with accountStatus: 'Verified'.
   */
  const completeProfile = async (formData) => {
    setIsLoading(true);
    setError(null);

    try {
      const currentToken = token || localStorage.getItem('bloodlink_token') || localStorage.getItem('token');
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.message || data.error || 'Failed to complete profile.';
        setError(message);
        return { success: false, error: message, errors: data.errors };
      }

      // Re-issue the JWT — now has accountStatus: 'Verified'
      persistSession(data.token, data.user);

      const redirect = pendingRedirectRef.current;
      pendingRedirectRef.current = null;
      return { success: true, user: data.user, redirectTo: redirect };
    } catch {
      const message = 'Unable to reach the server. Please check your network connection.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // ── Register ─────────────────────────────────────────────────────────────────
  const register = async (formData) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data.message || data.error || 'Failed to create account.';
        setError(errorMessage);
        return { success: false, error: errorMessage, errors: data.errors };
      }

      persistSession(data.token, data.user);
      return { success: true, user: data.user };
    } catch {
      const message = 'Unable to reach the server. Please check your network connection.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // ── Update local user state ───────────────────────────────────────────────────
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('bloodlink_user', JSON.stringify(updatedUser));
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // ── Store redirect intent for post-profile-completion ─────────────────────────
  const setPendingRedirect = (url) => {
    pendingRedirectRef.current = url;
  };

  const isGuest = !!user && (user.accountStatus === 'Guest' || user.isGuest === true);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.userType === 'Admin',
        isGuest,
        isLoading,
        error,
        login,
        socialLogin,
        completeProfile,
        register,
        logout,
        updateUser,
        setPendingRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
