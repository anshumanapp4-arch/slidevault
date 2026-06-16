'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setToken, clearToken } from '@/lib/api';

const AuthContext = createContext(null);

/**
 * AuthProvider wraps the app and provides authentication state and methods.
 * On mount, it attempts to restore the session by calling /api/auth/me.
 * Also captures OAuth tokens from URL parameters after OAuth redirect.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount + capture OAuth token from URL
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Check for OAuth token in URL (redirected from backend after OAuth login)
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const oauthToken = params.get('oauth_token');
          if (oauthToken) {
            // Store the token for future API calls
            setToken(oauthToken);
            // Clean up the URL (remove token from address bar)
            window.history.replaceState({}, '', window.location.pathname);
          }
        }

        const { data } = await api.get('/api/auth/me');
        if (data.success) {
          setUser(data.user);
        }
      } catch (error) {
        // Not authenticated — that's fine
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    if (data.success) {
      // Store token for cross-domain auth fallback
      if (data.token) {
        setToken(data.token);
      }
      setUser(data.user);
    }
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/api/auth/register', { name, email, password });
    if (data.success) {
      // Store token for cross-domain auth fallback
      if (data.token) {
        setToken(data.token);
      }
      setUser(data.user);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      // Ignore logout errors
    }
    clearToken();
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context.
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
