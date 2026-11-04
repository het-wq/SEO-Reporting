import { BACKEND_BASE } from '@/lib/backendBase';

const STORAGE_KEY = 'seo_api_config';

export const defaultConfig = {
  endpointUrl: BACKEND_BASE,
  ga4PropertyId: '',
  gscSiteUrl: 'https://boulderdecisions.com/',
  gbpLocationId: '',
  gbpLocationName: '',
  googleAdsCustomerId: '',
  googleAdsDeveloperToken: '',
  brandKeywords: 'Boulder Decision, Boulder Decisions, boulderdecision, boulderdecisions, boulder decisions',
  nonBrandKeywords: '',
  apiToken: '',
  googleConnected: false,
  selectedAccountId: 'default',
  selectedAccountName: 'Boulder Decision',
  savedAccounts: [],
};

const KEYWORDS_STORAGE_KEY = 'seo_account_keywords_map';

export const getAccountKeywordsMap = () => {
  try {
    const raw = localStorage.getItem(KEYWORDS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse account keywords map:', e);
  }
  return {};
};

export const saveAccountKeywords = (accountId, { brandKeywords, nonBrandKeywords }) => {
  if (!accountId) return;
  try {
    const map = getAccountKeywordsMap();
    map[accountId] = {
      brandKeywords: Array.isArray(brandKeywords) ? brandKeywords.join(', ') : (brandKeywords || ''),
      nonBrandKeywords: Array.isArray(nonBrandKeywords) ? nonBrandKeywords.join(', ') : (nonBrandKeywords || ''),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(KEYWORDS_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save account keywords map:', e);
  }
};

/**
 * Derives appropriate brand search keywords for an account based on its name, property, or site URL.
 * Never produces Boulder Decision keywords unless the account is actually Boulder Decision.
 */
export const deriveBrandKeywords = (account) => {
  if (!account) return 'Boulder Decision, Boulder Decisions, boulderdecision, boulderdecisions, boulder decisions';

  const name = typeof account === 'string' ? account : (account.accountName || account.name || '');
  const prop = typeof account === 'object' ? (account.propertyName || '') : '';
  const site = typeof account === 'object' ? (account.gscSiteUrl || '') : '';

  const hasNonBoulderName =
    (name && !name.toLowerCase().includes('boulder') && !/^\d+$/.test(name.trim()) && name.toLowerCase() !== 'connected account') ||
    (prop && !prop.toLowerCase().includes('boulder') && !/^\d+$/.test(prop.trim()));

  const isBoulder =
    !hasNonBoulderName &&
    (name.toLowerCase().includes('boulder') ||
     prop.toLowerCase().includes('boulder') ||
     site.toLowerCase().includes('boulder'));

  if (isBoulder) {
    return 'Boulder Decision, Boulder Decisions, boulderdecision, boulderdecisions, boulder decisions';
  }

  const terms = new Set();

  if (name) {
    const clean = name.replace(/^accounts\//, '').trim();
    if (clean && !/^\d+$/.test(clean) && clean.toLowerCase() !== 'connected account' && clean.toLowerCase() !== 'default') {
      terms.add(clean);
      const parts = clean.split(/[\s\-_|:]+/).filter((p) => p.length > 2);
      if (parts.length > 1) {
        terms.add(parts.join(' '));
        terms.add(parts.join(''));
      }
    }
  }

  if (prop) {
    const clean = prop.replace(/^properties\//, '').trim();
    if (clean && !/^\d+$/.test(clean)) {
      terms.add(clean);
      const parts = clean.split(/[\s\-_|:]+/).filter((p) => p.length > 2);
      if (parts.length > 1) {
        terms.add(parts.join(' '));
        terms.add(parts.join(''));
      }
    }
  }

  if (site) {
    const cleanDomain = site
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^sc-domain:/, '')
      .replace(/\/.*$/, '')
      .replace(/^www\./, '');

    const domainBase = cleanDomain.split('.')[0];
    if (domainBase && domainBase.length > 2) {
      terms.add(domainBase);
      const spaced = domainBase.replace(/[-_]/g, ' ');
      if (spaced !== domainBase) {
        terms.add(spaced);
      }
    }
  }

  if (terms.size === 0) {
    return name && !/^\d+$/.test(name) ? name : (prop || 'Brand');
  }

  return Array.from(terms).join(', ');
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
      // Migrate away from legacy Atlanta/Appliance demo values or misconfigured boulder domain
      if (parsed.gscSiteUrl && (parsed.gscSiteUrl.includes('appliancecareofatlanta') || parsed.gscSiteUrl.includes('boulderdecision.com') || parsed.gscSiteUrl.startsWith('sc-domain:boulderdecision'))) {
        parsed.gscSiteUrl = 'https://boulderdecisions.com/';
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

/**
 * Fetch account keywords directly from database on backend
 */
export const fetchAccountKeywordsFromDb = async ({ accountId, propertyId, siteUrl, accountName } = {}) => {
  try {
    const params = new URLSearchParams();
    if (accountId) params.set('accountId', accountId);
    if (propertyId) params.set('propertyId', propertyId);
    if (siteUrl) params.set('siteUrl', siteUrl);
    if (accountName) params.set('accountName', accountName);

    const res = await fetch(`${BACKEND_BASE}/api/integrations/account-keywords?${params.toString()}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('fetchAccountKeywordsFromDb error:', err.message);
  }
  return null;
};

/**
 * Save account keywords directly to database on backend
 */
export const saveAccountKeywordsToDb = async ({
  accountId,
  accountName,
  propertyName,
  ga4PropertyId,
  gscSiteUrl,
  brandKeywords,
  nonBrandKeywords,
}) => {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/integrations/account-keywords`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        accountId,
        accountName,
        propertyName,
        ga4PropertyId,
        gscSiteUrl,
        brandKeywords,
        nonBrandKeywords,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('saveAccountKeywordsToDb error:', err.message);
  }
  return null;
};

export const saveBrandAndNonBrandKeywords = ({
  brandKeywords,
  nonBrandKeywords,
  accountId,
  accountName,
  ga4PropertyId,
  gscSiteUrl,
}) => {
  const current = getApiConfig();
  const targetAccId = accountId || current.selectedAccountId || 'default';
  const targetAccName = accountName || current.selectedAccountName || 'Connected Account';

  const bStr =
    brandKeywords !== undefined
      ? (Array.isArray(brandKeywords) ? brandKeywords.join(', ') : brandKeywords)
      : current.brandKeywords;
  const nbStr =
    nonBrandKeywords !== undefined
      ? (Array.isArray(nonBrandKeywords) ? nonBrandKeywords.join(', ') : nonBrandKeywords)
      : current.nonBrandKeywords;

  // 1. Save to local storage cache map
  saveAccountKeywords(targetAccId, { brandKeywords: bStr, nonBrandKeywords: nbStr });

  // 2. Persist to server database!
  saveAccountKeywordsToDb({
    accountId: targetAccId,
    accountName: targetAccName,
    propertyName: targetAccName,
    ga4PropertyId: ga4PropertyId !== undefined ? ga4PropertyId : current.ga4PropertyId,
    gscSiteUrl: gscSiteUrl !== undefined ? gscSiteUrl : current.gscSiteUrl,
    brandKeywords: bStr,
    nonBrandKeywords: nbStr,
  });

  const updated = {
    ...current,
    brandKeywords: bStr,
    nonBrandKeywords: nbStr,
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
  clientId,
  clientName,
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
        clientId,
        startDate,
        endDate,
        prevStartDate: prevStartDate || undefined,
        prevEndDate: prevEndDate || undefined,
        propertyId: cfg.ga4PropertyId,
        siteUrl: cfg.gscSiteUrl,
        clientName: clientName || cfg.selectedAccountName || undefined,
        brandTerms: effectiveBrandTerms,
        nonBrandTerms: effectiveNonBrandTerms,
        locationId: cfg.gbpLocationId || undefined,
        locationName: cfg.gbpLocationName || undefined,
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
      gbpLocations: [],
      gbpAccounts: [],
      error: err.message,
    };
  }
};

/**
 * Switches the active connected account, saving GA4 Property ID, Search Console URL,
 * GBP Location ID, and per-account brand/non-brand keywords to sync data across the entire dashboard.
 */
export const switchConnectedAccount = (account) => {
  if (!account) return getApiConfig();
  const current = getApiConfig();
  const accountId = account.id || account.ga4PropertyId || account.gscSiteUrl || 'custom';
  const accountName = account.accountName || account.name || 'Connected Account';

  // Check if this account already has saved keywords in the map
  const map = getAccountKeywordsMap();
  const savedForAccount = map[accountId];

  let brandKeywords = '';
  let nonBrandKeywords = '';

  const isCurrentBoulder =
    accountName.toLowerCase().includes('boulder') ||
    (account.propertyName && account.propertyName.toLowerCase().includes('boulder')) ||
    (account.gscSiteUrl && account.gscSiteUrl.toLowerCase().includes('boulder'));

  if (savedForAccount && savedForAccount.brandKeywords) {
    brandKeywords = savedForAccount.brandKeywords;
    nonBrandKeywords = savedForAccount.nonBrandKeywords || '';
  } else if (account.brandKeywords && !(!isCurrentBoulder && account.brandKeywords.toLowerCase().includes('boulder'))) {
    brandKeywords = account.brandKeywords;
    nonBrandKeywords = account.nonBrandKeywords || '';
  } else {
    brandKeywords = deriveBrandKeywords(account);
    nonBrandKeywords = '';
  }

  const updates = {
    selectedAccountId: accountId,
    selectedAccountName: accountName,
    ga4PropertyId: account.ga4PropertyId !== undefined ? account.ga4PropertyId : current.ga4PropertyId,
    gscSiteUrl: account.gscSiteUrl !== undefined ? account.gscSiteUrl : current.gscSiteUrl,
    gbpLocationId: account.gbpLocationId !== undefined ? account.gbpLocationId : (current.gbpLocationId || ''),
    gbpLocationName: account.gbpLocationName !== undefined ? account.gbpLocationName : (current.gbpLocationName || ''),
    brandKeywords,
    nonBrandKeywords,
  };

  saveAccountKeywords(accountId, { brandKeywords, nonBrandKeywords });

  saveAccountKeywordsToDb({
    accountId,
    accountName,
    propertyName: account.propertyName || accountName,
    ga4PropertyId: updates.ga4PropertyId,
    gscSiteUrl: updates.gscSiteUrl,
    brandKeywords,
    nonBrandKeywords,
  });

  return saveApiConfig(updates);
};

/**
 * Fetch Google Ads overview metrics, campaigns, keywords, and daily trends
 */
export const fetchGoogleAdsOverview = async ({
  startDate,
  endDate,
  prevStartDate,
  prevEndDate,
  customerId,
  developerToken,
  accountName,
} = {}) => {
  const cfg = getApiConfig();
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  if (prevStartDate) params.set('prevStartDate', prevStartDate);
  if (prevEndDate) params.set('prevEndDate', prevEndDate);
  if (customerId || cfg.googleAdsCustomerId) params.set('customerId', customerId || cfg.googleAdsCustomerId);
  if (developerToken || cfg.googleAdsDeveloperToken) params.set('developerToken', developerToken || cfg.googleAdsDeveloperToken);
  params.set('accountName', accountName || cfg.selectedAccountName || 'Boulder Decision');

  const res = await fetch(`${BACKEND_BASE}/api/google-ads/overview?${params.toString()}`, {
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `HTTP ${res.status}: Failed to fetch Google Ads overview`);
  }
  return await res.json();
};

/**
 * Test Google Ads API connection
 */
export const testGoogleAdsConnection = async (extraParams = {}) => {
  const cfg = getApiConfig();
  const res = await fetch(`${BACKEND_BASE}/api/google-ads/test`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({
      customerId: cfg.googleAdsCustomerId,
      developerToken: cfg.googleAdsDeveloperToken,
      ...extraParams,
    }),
  });
  return await res.json();
};

/**
 * Multi-Client API Services
 */

export const fetchClientsApi = async () => {
  const res = await fetch(`${BACKEND_BASE}/api/clients`, {
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch clients');
  const data = await res.json();
  return data.clients || [];
};

export const createClientApi = async ({ name, website_url, domain }) => {
  const res = await fetch(`${BACKEND_BASE}/api/clients`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ name, website_url, domain }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to create client');
  }
  return await res.json();
};

export const updateClientApi = async (clientId, updates) => {
  const res = await fetch(`${BACKEND_BASE}/api/clients/${clientId}`, {
    method: 'PUT',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to update client');
  }
  return await res.json();
};

export const deleteClientApi = async (clientId) => {
  const res = await fetch(`${BACKEND_BASE}/api/clients/${clientId}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to deactivate client');
  return await res.json();
};

export const fetchClientPropertiesApi = async (clientId) => {
  const res = await fetch(`${BACKEND_BASE}/api/clients/${clientId}/properties`, {
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch client properties');
  const data = await res.json();
  return data.properties || [];
};

export const mapClientPropertyApi = async (clientId, { property_type, property_id, property_name, google_connection_id }) => {
  const res = await fetch(`${BACKEND_BASE}/api/clients/${clientId}/properties`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ property_type, property_id, property_name, google_connection_id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Failed to map property');
  }
  return await res.json();
};

export const unmapClientPropertyApi = async (clientId, propertyId) => {
  const res = await fetch(`${BACKEND_BASE}/api/clients/${clientId}/properties/${encodeURIComponent(propertyId)}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to unmap property');
  return await res.json();
};

export const fetchStoredGoogleConnectionsApi = async () => {
  const res = await fetch(`${BACKEND_BASE}/api/clients/connections/all`, {
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch Google connections');
  const data = await res.json();
  return data.connections || [];
};

export const fetchClientKeywordsApi = async (clientId) => {
  const res = await fetch(`${BACKEND_BASE}/api/clients/${clientId}/keywords`, {
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch keywords');
  const data = await res.json();
  return data.keywords || [];
};

export const addClientKeywordApi = async (clientId, keywordData) => {
  const res = await fetch(`${BACKEND_BASE}/api/clients/${clientId}/keywords`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(keywordData),
  });
  if (!res.ok) throw new Error('Failed to add keyword');
  return await res.json();
};

export const fetchClientBrandTermsApi = async (clientId) => {
  const res = await fetch(`${BACKEND_BASE}/api/clients/${clientId}/brand-terms`, {
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch brand terms');
  const data = await res.json();
  return data.brandTerms || [];
};

export const saveClientBrandTermsApi = async (clientId, terms) => {
  const res = await fetch(`${BACKEND_BASE}/api/clients/${clientId}/brand-terms`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ terms }),
  });
  if (!res.ok) throw new Error('Failed to save brand terms');
  return await res.json();
};

export const fetchClientSeoActivitiesApi = async (clientId) => {
  const res = await fetch(`${BACKEND_BASE}/api/clients/${clientId}/seo-activities`, {
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch SEO activities');
  const data = await res.json();
  return data.activities || [];
};

export const addClientSeoActivityApi = async (clientId, activityData) => {
  const res = await fetch(`${BACKEND_BASE}/api/clients/${clientId}/seo-activities`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(activityData),
  });
  if (!res.ok) throw new Error('Failed to add activity');
  return await res.json();
};

export const fetchClientBacklinksApi = async (clientId) => {
  const res = await fetch(`${BACKEND_BASE}/api/clients/${clientId}/backlinks`, {
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch backlinks');
  const data = await res.json();
  return data.backlinks || [];
};

export const addClientBacklinkApi = async (clientId, backlinkData) => {
  const res = await fetch(`${BACKEND_BASE}/api/clients/${clientId}/backlinks`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(backlinkData),
  });
  if (!res.ok) throw new Error('Failed to add backlink');
  return await res.json();
};


