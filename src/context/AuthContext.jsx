import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured, getSupabaseConfig, saveSupabaseConfig } from '@/lib/supabase';
import { setCookie, deleteCookie, getCookie } from '@/services/liveSeoApi';

const AuthContext = createContext(null);

const GUEST_STORAGE_KEY = 'seo_guest_auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured());
  const [config, setConfig] = useState(getSupabaseConfig());

  // Check guest/demo login fallback
  const checkGuestUser = () => {
    try {
      const guest = localStorage.getItem(GUEST_STORAGE_KEY);
      if (guest) {
        return JSON.parse(guest);
      }
    } catch (e) {
      // ignore
    }
    return null;
  };

  // Initialize auth listener
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      setLoading(true);

      if (supabase) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (!error && data?.session) {
            if (mounted) {
              setSession(data.session);
              setUser(data.session.user);
              setCookie('supabase_auth_active', 'true', 365);
            }
          } else {
            const guest = checkGuestUser();
            if (guest && mounted) {
              setUser(guest);
            }
          }
        } catch (err) {
          console.warn('Supabase getSession error:', err.message);
          const guest = checkGuestUser();
          if (guest && mounted) setUser(guest);
        }
      } else {
        // Fallback to guest if configured
        const guest = checkGuestUser();
        if (guest && mounted) setUser(guest);
      }

      if (mounted) setLoading(false);
    }

    initAuth();

    // Setup realtime auth state change listener if supabase client is active
    let subscription = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user || null);

        if (newSession) {
          setCookie('supabase_auth_active', 'true', 365);
          localStorage.removeItem(GUEST_STORAGE_KEY);
        } else {
          deleteCookie('supabase_auth_active');
        }
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [config.anonKey, config.url]);

  // Sign up with Supabase
  const signUp = useCallback(async ({ email, password, fullName }) => {
    if (!supabase) {
      throw new Error('Supabase is not configured yet. Please enter your Supabase Project Anon Key.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
      },
    });

    if (error) throw error;
    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user);
      setCookie('supabase_auth_active', 'true', 365);
    }
    return data;
  }, []);

  // Sign in with Supabase
  const signIn = useCallback(async ({ email, password }) => {
    if (!supabase) {
      throw new Error('Supabase is not configured yet. Please enter your Supabase Project Anon Key.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user);
      setCookie('supabase_auth_active', 'true', 365);
    }
    return data;
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
    setUser(null);
    setSession(null);
    deleteCookie('supabase_auth_active');
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }, []);

  // Password reset request
  const resetPassword = useCallback(async (email) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Please supply your API keys.');
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
    return data;
  }, []);

  // Resend signup confirmation email
  const resendConfirmationEmail = useCallback(async (email) => {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
    return data;
  }, []);

  // Update Supabase credentials from UI
  const updateSupabaseKeys = useCallback((url, key) => {
    saveSupabaseConfig(url, key);
    const updated = getSupabaseConfig();
    setConfig(updated);
    setIsConfigured(isSupabaseConfigured());
    // Force reload client
    window.location.reload();
  }, []);

  // Guest / Demo mode login
  const loginAsGuest = useCallback((demoEmail = 'admin@boulderdecisions.com') => {
    const guestUser = {
      id: 'guest-' + Date.now(),
      email: demoEmail,
      user_metadata: {
        full_name: 'Agency Admin',
      },
      isGuest: true,
    };
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestUser));
    } catch (e) {
      // ignore
    }
    setUser(guestUser);
    setCookie('supabase_auth_active', 'true', 365);
  }, []);

  const value = {
    user,
    session,
    loading,
    isConfigured,
    config,
    signUp,
    signIn,
    signOut,
    resetPassword,
    resendConfirmationEmail,
    updateSupabaseKeys,
    loginAsGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
