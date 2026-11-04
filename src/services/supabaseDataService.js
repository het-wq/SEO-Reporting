import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Service to interact with Supabase multi-client tables:
 * - clients
 * - client_keywords
 * - brand_keywords
 * - non_brand_keywords
 * - seo_activities
 * - backlink_activities
 */

// -----------------------------------------------------------------------------
// 1. CLIENTS
// -----------------------------------------------------------------------------
export const fetchSupabaseClients = async () => {
  if (!isSupabaseConfigured() || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      console.warn('fetchSupabaseClients error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('fetchSupabaseClients exception:', err.message);
    return [];
  }
};

export const fetchClientBySlug = async (slug) => {
  if (!isSupabaseConfigured() || !supabase || !slug) return null;
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
};

// -----------------------------------------------------------------------------
// 2. CLIENT KEYWORDS
// -----------------------------------------------------------------------------
export const fetchClientKeywordsByClientId = async (clientId) => {
  if (!isSupabaseConfigured() || !supabase || !clientId) return [];
  try {
    const { data, error } = await supabase
      .from('client_keywords')
      .select('*')
      .eq('client_id', clientId)
      .order('current_position', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('fetchClientKeywordsByClientId error:', err.message);
    return [];
  }
};

export const addClientKeywordInSupabase = async (clientId, keywordData) => {
  if (!isSupabaseConfigured() || !supabase || !clientId) return null;
  const { data, error } = await supabase
    .from('client_keywords')
    .insert([{ client_id: clientId, ...keywordData }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

// -----------------------------------------------------------------------------
// 3. BRAND & NON-BRAND KEYWORDS
// -----------------------------------------------------------------------------
export const fetchBrandKeywordsByClientId = async (clientId) => {
  if (!isSupabaseConfigured() || !supabase || !clientId) return [];
  try {
    const { data, error } = await supabase
      .from('brand_keywords')
      .select('*')
      .eq('client_id', clientId)
      .order('keyword', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('fetchBrandKeywordsByClientId error:', err.message);
    return [];
  }
};

export const fetchNonBrandKeywordsByClientId = async (clientId) => {
  if (!isSupabaseConfigured() || !supabase || !clientId) return [];
  try {
    const { data, error } = await supabase
      .from('non_brand_keywords')
      .select('*')
      .eq('client_id', clientId)
      .order('keyword', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('fetchNonBrandKeywordsByClientId error:', err.message);
    return [];
  }
};

// -----------------------------------------------------------------------------
// 4. SEO ACTIVITIES
// -----------------------------------------------------------------------------
export const fetchSeoActivitiesByClientId = async (clientId) => {
  if (!isSupabaseConfigured() || !supabase || !clientId) return [];
  try {
    const { data, error } = await supabase
      .from('seo_activities')
      .select('*')
      .eq('client_id', clientId)
      .order('activity_date', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('fetchSeoActivitiesByClientId error:', err.message);
    return [];
  }
};

export const addSeoActivityInSupabase = async (clientId, activityData) => {
  if (!isSupabaseConfigured() || !supabase || !clientId) return null;
  const { data, error } = await supabase
    .from('seo_activities')
    .insert([{ client_id: clientId, ...activityData }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

// -----------------------------------------------------------------------------
// 5. BACKLINK AND OFF-PAGE ACTIVITIES
// -----------------------------------------------------------------------------
export const fetchBacklinkActivitiesByClientId = async (clientId) => {
  if (!isSupabaseConfigured() || !supabase || !clientId) return [];
  try {
    const { data, error } = await supabase
      .from('backlink_activities')
      .select('*')
      .eq('client_id', clientId)
      .order('published_date', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('fetchBacklinkActivitiesByClientId error:', err.message);
    return [];
  }
};

export const addBacklinkActivityInSupabase = async (clientId, backlinkData) => {
  if (!isSupabaseConfigured() || !supabase || !clientId) return null;
  const { data, error } = await supabase
    .from('backlink_activities')
    .insert([{ client_id: clientId, ...backlinkData }])
    .select()
    .single();
  if (error) throw error;
  return data;
};
