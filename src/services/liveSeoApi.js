import { BACKEND_BASE } from '@/lib/backendBase';

const STORAGE_KEY = 'seo_api_config';

export const defaultConfig = {
  endpointUrl: BACKEND_BASE,
  ga4PropertyId: '',
  gscSiteUrl: 'https://boulderdecisions.com/',
  brandKeywords: 'Boulder Decision,Boulder Decisions,boulderdecision,boulderdecisions,boulder decisions',
  nonBrandKeywords: '',
  apiToken: '',
  googleConnected: false,
  selectedAccountId: 'default',
  selectedAccountName: 'Boulder Decision',
  savedAccounts: [],
};

export const getCookie = (name) => {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  } catch (e) {
    // ignore
  }
  return null;
};

export const setCookie = (name, value, days = 365) => {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    // ignore
  }
};

export const deleteCookie = (name) => {
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  } catch (e) {
    // ignore
  }
};

export const getApiConfig = () => {
  let isCookieLoggedIn = Boolean(getCookie('seo_logged_in') || getCookie('seo_auth_tokens'));
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
      return {
        ...defaultConfig,
        ...parsed,
        googleConnected: parsed.googleConnected || isCookieLoggedIn,
      };
    }
  } catch (e) {
    console.error('Failed to load api config:', e);
  }
  return { ...defaultConfig, googleConnected: isCookieLoggedIn };
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

export const saveBrandAndNonBrandKeywords = ({ brandKeywords, nonBrandKeywords }) => {
  const current = getApiConfig();
  const updated = {
    ...current,
    ...(brandKeywords !== undefined ? {
      brandKeywords: Array.isArray(brandKeywords) ? brandKeywords.join(',') : brandKeywords
    } : {}),
    ...(nonBrandKeywords !== undefined ? {
      nonBrandKeywords: Array.isArray(nonBrandKeywords) ? nonBrandKeywords.join(',') : nonBrandKeywords
    } : {}),
  };
  return saveApiConfig(updated);
};

const getHeaders = () => {
  const cfg = getApiConfig();
  const headers = { 'Content-Type': 'application/json' };
  if (cfg.apiToken) {
    headers['Authorization'] = `Bearer ${cfg.apiToken}`;
  }
  const tokenCookie = getCookie('seo_auth_tokens');
  if (tokenCookie) {
    headers['x-auth-tokens'] = tokenCookie;
  }
  return headers;
};

export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/health`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.hasToken) {
        setCookie('seo_logged_in', 'true', 365);
        saveApiConfig({ googleConnected: true });
      }
      return data;
    }
  } catch {
    // Backend offline
  }
  return { status: 'offline', configured: false, hasToken: false };
};

export const getGoogleAuthUrl = async () => {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/auth/google/url`, {
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to generate Google OAuth URL');
    }
    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error('Backend API server is offline (http://localhost:5001). Please run "npm run dev" to start both the backend server and frontend.');
    }
    throw err;
  }
};

export const disconnectGoogleAuth = async () => {
  try {
    await fetch(`${BACKEND_BASE}/api/integrations/disconnect`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (e) {
    console.warn('Disconnect error:', e.message);
  }
  deleteCookie('seo_auth_tokens');
  deleteCookie('seo_logged_in');
  saveApiConfig({ apiToken: '', googleConnected: false });
};

export const fetchIntegrationsStatus = async () => {
  const res = await fetch(`${BACKEND_BASE}/api/integrations/status`, {
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch integrations status`);
  const data = await res.json();
  if (data?.authStatus?.authenticated) {
    setCookie('seo_logged_in', 'true', 365);
    saveApiConfig({ googleConnected: true });
  }
  return data;
};

export const testIntegrationConnection = async (providerId, extraParams = {}) => {
  const cfg = getApiConfig();
  const res = await fetch(`${BACKEND_BASE}/api/integrations/test`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
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
  const res = await fetch(`${BACKEND_BASE}/api/search-console/sites`, {
    headers: getHeaders(),
    credentials: 'include',
  });
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
  brandTerms,
  nonBrandTerms,
}) => {
  const cfg = getApiConfig();
  const effectiveBrandTerms = brandTerms !== undefined
    ? (Array.isArray(brandTerms) ? brandTerms : String(brandTerms).split(',').map((s) => s.trim()).filter(Boolean))
    : (cfg.brandKeywords ? cfg.brandKeywords.split(',').map((s) => s.trim()).filter(Boolean) : undefined);

  const effectiveNonBrandTerms = nonBrandTerms !== undefined
    ? (Array.isArray(nonBrandTerms) ? nonBrandTerms : String(nonBrandTerms).split(',').map((s) => s.trim()).filter(Boolean))
    : (cfg.nonBrandKeywords ? cfg.nonBrandKeywords.split(',').map((s) => s.trim()).filter(Boolean) : undefined);

  try {
    const res = await fetch(`${BACKEND_BASE}/api/dashboard/live-report`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        startDate,
        endDate,
        prevStartDate: prevStartDate || undefined,
        prevEndDate: prevEndDate || undefined,
        propertyId: cfg.ga4PropertyId,
        siteUrl: cfg.gscSiteUrl,
        clientName: cfg.selectedAccountName || undefined,
        brandTerms: effectiveBrandTerms,
        nonBrandTerms: effectiveNonBrandTerms,
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
  } catch (err) {
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      const offlineErr = new Error('Backend API server is offline (cannot reach http://localhost:5001). Please run "npm run dev" to start both the server and frontend.');
      offlineErr.status = 'backend_offline';
      throw offlineErr;
    }
    throw err;
  }
};

/**
 * Fetch all discovered Google accounts, GA4 properties, and Search Console sites
 */
export const fetchGoogleAccounts = async () => {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/integrations/google-accounts`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `HTTP ${res.status}: Failed to fetch Google accounts`);
    }
    return await res.json();
  } catch (err) {
    console.warn('fetchGoogleAccounts warning:', err.message);
    return {
      authenticated: false,
      accounts: [],
      ga4Accounts: [],
      gscSites: [],
      error: err.message,
    };
  }
};

/**
 * Switches the active connected account, saving GA4 Property ID, Search Console URL,
 * and account identifiers to sync data across the entire dashboard.
 */
export const switchConnectedAccount = (account) => {
  if (!account) return getApiConfig();
  const current = getApiConfig();
  const updates = {
    selectedAccountId: account.id || account.ga4PropertyId || account.gscSiteUrl || 'custom',
    selectedAccountName: account.accountName || account.name || 'Connected Account',
    ga4PropertyId: account.ga4PropertyId !== undefined ? account.ga4PropertyId : current.ga4PropertyId,
    gscSiteUrl: account.gscSiteUrl !== undefined ? account.gscSiteUrl : current.gscSiteUrl,
  };
  if (account.brandKeywords) {
    updates.brandKeywords = account.brandKeywords;
  }
  return saveApiConfig(updates);
};
