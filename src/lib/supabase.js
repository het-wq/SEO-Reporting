import { createClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'supabase_project_url';
const STORAGE_ANON_KEY = 'supabase_anon_key';

// Default project URL from user's Supabase dashboard
const DEFAULT_SUPABASE_URL = 'https://qtmoxaxonpimodwpemiy.supabase.co';

export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  let localUrl = null;
  let localKey = null;

  try {
    localUrl = localStorage.getItem(STORAGE_URL_KEY);
    localKey = localStorage.getItem(STORAGE_ANON_KEY);
  } catch (e) {
    // Ignore storage errors
  }

  const url = (envUrl && envUrl.trim()) || localUrl || DEFAULT_SUPABASE_URL;
  const anonKey = (envKey && envKey.trim()) || localKey || '';

  return { url, anonKey };
};

export const saveSupabaseConfig = (url, anonKey) => {
  try {
    if (url) localStorage.setItem(STORAGE_URL_KEY, url.trim());
    if (anonKey) localStorage.setItem(STORAGE_ANON_KEY, anonKey.trim());
    // Re-initialize client
    supabase = createSupabaseClient(url || DEFAULT_SUPABASE_URL, anonKey);
    return true;
  } catch (e) {
    console.error('Failed to save Supabase config:', e);
    return false;
  }
};

const createSupabaseClient = (url, key) => {
  if (!url || !key) return null;
  try {
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    return null;
  }
};

const { url: initialUrl, anonKey: initialKey } = getSupabaseConfig();
export let supabase = createSupabaseClient(initialUrl, initialKey);

export const isSupabaseConfigured = () => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && anonKey.length > 10);
};
