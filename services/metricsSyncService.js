import { getSupabaseAdmin } from './supabaseAdmin.js';

/**
 * Service to store and retrieve GA4 & GSC daily reporting metrics in Supabase.
 * Fulfills Requirement 8: Data Synchronization, Caching & Database Persistence.
 */

/**
 * Upsert GA4 daily traffic metrics into ga4_daily_metrics table
 */
export const syncGa4DailyMetrics = async ({ clientId, propertyId, dailyTrends = [] }) => {
  if (!clientId || !propertyId || !Array.isArray(dailyTrends) || dailyTrends.length === 0) {
    return;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    const rows = dailyTrends.map((item) => ({
      client_id: clientId,
      property_id: propertyId,
      date: item.date,
      sessions: parseInt(item.sessions || item.organic || 0, 10),
      total_users: parseInt(item.totalUsers || item.users || 0, 10),
      new_users: parseInt(item.newUsers || item.organicNewUsers || 0, 10),
      conversions: parseFloat(item.conversions || 0),
      organic_sessions: parseInt(item.organic || item.organicSessions || 0, 10),
      engagement_rate: parseFloat(item.engagementRate || 0),
    }));

    const { error } = await supabase
      .from('ga4_daily_metrics')
      .upsert(rows, { onConflict: 'client_id, property_id, date' });

    if (error) {
      console.warn('syncGa4DailyMetrics upsert warning:', error.message);
    }
  } catch (err) {
    console.warn('syncGa4DailyMetrics exception:', err.message);
  }
};

/**
 * Upsert GSC daily query performance into gsc_daily_metrics table
 */
export const syncGscDailyMetrics = async ({ clientId, propertyId, queries = [], startDate }) => {
  if (!clientId || !propertyId || !Array.isArray(queries) || queries.length === 0) {
    return;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    const recordDate = startDate || new Date().toISOString().slice(0, 10);
    // Limit to top 200 queries per sync to avoid huge payload timeouts
    const rows = queries.slice(0, 200).map((q) => ({
      client_id: clientId,
      property_id: propertyId,
      date: recordDate,
      query: q.query || q.keys?.[0] || 'unknown',
      page: q.page || q.targetUrl || '/',
      clicks: parseInt(q.clicks || 0, 10),
      impressions: parseInt(q.impressions || 0, 10),
      ctr: parseFloat(q.ctr || 0),
      position: parseFloat(q.position || 0),
    }));

    const { error } = await supabase
      .from('gsc_daily_metrics')
      .upsert(rows, { onConflict: 'client_id, property_id, date, query, page' });

    if (error) {
      console.warn('syncGscDailyMetrics upsert warning:', error.message);
    }
  } catch (err) {
    console.warn('syncGscDailyMetrics exception:', err.message);
  }
};

/**
 * Retrieve cached GA4 metrics from Supabase when Google API is offline or quota exceeded
 */
export const getStoredGa4Metrics = async ({ clientId, propertyId, startDate, endDate }) => {
  if (!clientId) return null;
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  try {
    let query = supabase
      .from('ga4_daily_metrics')
      .select('*')
      .eq('client_id', clientId);

    if (propertyId) query = query.eq('property_id', propertyId);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query.order('date', { ascending: true });
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (e) {
    console.warn('getStoredGa4Metrics query error:', e.message);
  }
  return null;
};
