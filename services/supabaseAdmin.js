import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://qtmoxaxonpimodwpemiy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient = null;

export const getSupabaseAdmin = () => {
  if (supabaseClient) return supabaseClient;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return supabaseClient;
  } catch (err) {
    console.warn('Failed to initialize server-side Supabase client:', err.message);
    return null;
  }
};
