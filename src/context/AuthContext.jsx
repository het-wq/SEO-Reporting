import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setCookie, deleteCookie, getCookie } from '@/services/liveSeoApi';

const AuthContext = createContext(null);

const STORAGE_AUTH_KEY = 'seo_simple_auth_user';

// Default admin credentials (can be overridden via environment variables)
const DEFAULT_ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@boulderdecisions.com').toLowerCase();
const DEFAULT_ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from local storage or cookie
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_AUTH_KEY);
      const isCookieActive = getCookie('seo_logged_in') === 'true';

      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } else if (isCookieActive) {
        // Fallback user if cookie was set
        const defaultUser = {
          id: 'admin-default',
          email: DEFAULT_ADMIN_EMAIL,
          name: 'Agency Admin',
          role: 'Administrator',
        };
        setUser(defaultUser);
        localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(defaultUser));
      }
    } catch (e) {
      console.warn('Failed to load session:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Simple Sign In
  const signIn = useCallback(async ({ email, password, rememberMe = true }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail) {
      throw new Error('Please enter your email address or username.');
    }
    if (!cleanPass) {
      throw new Error('Please enter your password.');
    }

    // Flexible credential validation:
    // 1. Matches configured admin credentials or simple 'admin'
    // 2. Or valid email/username format with password >= 4 characters
    const isMatchingDefaultAdmin =
      (cleanEmail === DEFAULT_ADMIN_EMAIL || cleanEmail === 'admin') &&
      (cleanPass === DEFAULT_ADMIN_PASSWORD || cleanPass === 'admin' || cleanPass === 'admin123');

    const isValidFormat = (cleanEmail.includes('@') || cleanEmail.length >= 3) && cleanPass.length >= 4;

    if (!isMatchingDefaultAdmin && !isValidFormat) {
      throw new Error('Invalid credentials. Password must be at least 4 characters.');
    }

    // Create session user
    const username = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
    const formattedName =
      cleanEmail === DEFAULT_ADMIN_EMAIL || cleanEmail === 'admin'
        ? 'Agency Admin'
        : username.charAt(0).toUpperCase() + username.slice(1);

    const sessionUser = {
      id: 'usr-' + Date.now(),
      email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@boulderdecisions.com`,
      name: formattedName,
      role: 'Administrator',
      loggedInAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(sessionUser));
      if (rememberMe) {
        localStorage.setItem('seo_remembered_email', cleanEmail);
        setCookie('seo_logged_in', 'true', 365);
      } else {
        localStorage.removeItem('seo_remembered_email');
        setCookie('seo_logged_in', 'true', 1);
      }
    } catch (e) {
      console.warn('Storage warning:', e);
    }

    setUser(sessionUser);
    return { user: sessionUser };
  }, []);

  // Simple Sign Out
  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_AUTH_KEY);
      localStorage.removeItem('seo_guest_auth');
      deleteCookie('seo_logged_in');
      deleteCookie('supabase_auth_active');
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    signIn,
    signOut,
    defaultAdminCredentials: {
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD,
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
