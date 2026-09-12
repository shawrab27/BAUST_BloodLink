import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bloodlink_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('bloodlink_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Logout handler
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bloodlink_token');
    localStorage.removeItem('bloodlink_user');
  }, []);

  // Fetch current user from server on load if token exists
  const fetchCurrentUser = useCallback(async (authToken) => {
    if (!authToken) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('bloodlink_user', JSON.stringify(data.user));
      } else {
        logout();
      }
    } catch {
      console.warn('[Auth] Error verifying session token');
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchCurrentUser(token);
  }, [token, fetchCurrentUser]);

  // Login handler
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

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('bloodlink_token', data.token);
      localStorage.setItem('bloodlink_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch {
      const message = 'Unable to reach the server. Please check your network connection.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // Register handler
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

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('bloodlink_token', data.token);
      localStorage.setItem('bloodlink_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch {
      const message = 'Unable to reach the server. Please check your network connection.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile / availability in local state
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('bloodlink_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.userType === 'Admin',
        isLoading,
        error,
        login,
        register,
        logout,
        updateUser,
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
