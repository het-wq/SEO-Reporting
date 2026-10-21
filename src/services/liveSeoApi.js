import { BACKEND_BASE } from '@/lib/backendBase';

const STORAGE_KEY = 'seo_api_config';

export const defaultConfig = {
  endpointUrl: BACKEND_BASE,
  ga4PropertyId: '',
  gscSiteUrl: 'https://boulderdecisions.com/',
  brandKeywords: 'Boulder Decision,Boulder Decisions,boulderdecision,boulderdecisions,boulder decisions',
  apiToken: '',
  googleConnected: false,
};

export const getApiConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate away from legacy Atlanta/Appliance demo values
      if (parsed.gscSiteUrl && (parsed.gscSiteUrl.includes('appliancecareofatlanta') || parsed.gscSiteUrl.includes('boulderdecision.com'))) {
        parsed.gscSiteUrl = defaultConfig.gscSiteUrl;
      }
      if (parsed.brandKeywords && parsed.brandKeywords.toLowerCase().includes('appliance care')) {
        parsed.brandKeywords = defaultConfig.brandKeywords;
      }
      return { ...defaultConfig, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load api config:', e);
  }
  return defaultConfig;
};

export const saveApiConfig = (newConfig) => {
  try {
    const current = getApiConfig();
    const updated = { ...current, ...newConfig };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save api config:', e);
  }
  return newConfig;
};

const getHeaders = () => {
  const cfg = getApiConfig();
  const headers = { 'Content-Type': 'application/json' };
  if (cfg.apiToken) {
    headers['Authorization'] = `Bearer ${cfg.apiToken}`;
  }
  return headers;
};

export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/health`);
    if (res.ok) return await res.json();
  } catch {
    // Backend offline
  }
  return { status: 'offline', configured: false, hasToken: false };
};

export const getGoogleAuthUrl = async () => {
  const res = await fetch(`${BACKEND_BASE}/api/auth/google/url`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to generate Google OAuth URL');
  }
  return data;
};

export const disconnectGoogleAuth = async () => {
  try {
    await fetch(`${BACKEND_BASE}/api/integrations/disconnect`, { method: 'POST' });
  } catch (e) {
    console.warn('Disconnect error:', e.message);
  }
  saveApiConfig({ apiToken: '', googleConnected: false });
};

export const fetchIntegrationsStatus = async () => {
  const res = await fetch(`${BACKEND_BASE}/api/integrations/status`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch integrations status`);
  return await res.json();
};

export const testIntegrationConnection = async (providerId, extraParams = {}) => {
  const cfg = getApiConfig();
  const res = await fetch(`${BACKEND_BASE}/api/integrations/test`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      providerId,
      propertyId: cfg.ga4PropertyId,
      siteUrl: cfg.gscSiteUrl,
      ...extraParams,
    }),
  });
  return await res.json();
};

export const fetchGscSites = async () => {
  const res = await fetch(`${BACKEND_BASE}/api/search-console/sites`, { headers: getHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to fetch Search Console sites');
  }
  const data = await res.json();
  return data.sites || [];
};

/**
 * Fetch unified live report for the entire dashboard
 */
export const fetchDashboardLiveReport = async ({
  startDate,
  endDate,
  prevStartDate,
  prevEndDate,
  periodLabel,
  previousPeriodLabel,
  forceRefresh = false,
}) => {
  const cfg = getApiConfig();
  const res = await fetch(`${BACKEND_BASE}/api/dashboard/live-report`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
      propertyId: cfg.ga4PropertyId,
      siteUrl: cfg.gscSiteUrl,
      brandTerms: cfg.brandKeywords ? cfg.brandKeywords.split(',') : undefined,
      periodLabel,
      previousPeriodLabel,
      forceRefresh,
    }),
  });

  const body = await res.json();
  if (!res.ok) {
    const err = new Error(body.message || body.error || `HTTP ${res.status}`);
    err.status = body.status;
    err.actionUrl = body.actionUrl;
    err.actionLabel = body.actionLabel;
    throw err;
  }
  return body;
};
