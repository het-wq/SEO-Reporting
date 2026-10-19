const getBackendBase = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5001';
    }
    return ''; // On Vercel, use relative paths to route to serverless functions
  }
  return 'http://localhost:5001';
};

const BACKEND_BASE = getBackendBase();

const defaultConfig = {
  endpointUrl: BACKEND_BASE,
  ga4PropertyId: '516707960', // Prefilled with user's active property
  gscSiteUrl: '',
  apiToken: '',
  googleConnected: false,
};

export const getApiConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultConfig, ...JSON.parse(saved) };
  } catch (e) {
    console.error('Failed to load api config', e);
  }
  return defaultConfig;
};

export const saveApiConfig = (newConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
  } catch (e) {
    console.error('Failed to save api config', e);
  }
};

export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/health`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Backend offline
  }
  return { status: 'offline', configured: false, hasToken: false };
};

export const getGoogleAuthUrl = async () => {
  const res = await fetch(`${BACKEND_BASE}/api/auth/google/url`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to generate Google OAuth URL');
  }
  return await res.json();
};

export const fetchGscSites = async (token = null) => {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_BASE}/api/gsc/sites`, { headers });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch Search Console sites');
  }
  const data = await res.json();
  return data.sites || [];
};

/**
 * Fetch purely LIVE SEO data from Google Search Console & GA4
 * NO demo / mock data
 */
export const fetchLiveSeoData = async (dateRangeInfo) => {
  const config = getApiConfig();
  const health = await checkBackendHealth();

  const isConnected = health.hasToken || Boolean(config.apiToken);

  if (!isConnected) {
    return {
      connected: false,
      data: null,
      error: 'Please connect your Google Account to view live SEO reporting data.',
    };
  }

  const { startDate, endDate, prevStartDate, prevEndDate, label, periodLabel } = dateRangeInfo;

  const headers = { 'Content-Type': 'application/json' };
  if (config.apiToken) headers['Authorization'] = `Bearer ${config.apiToken}`;

  let gscData = null;
  let ga4Data = null;
  let gscError = null;
  let ga4Error = null;

  // 1. Fetch Google Search Console data if siteUrl is configured
  if (config.gscSiteUrl) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/gsc/report`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          siteUrl: config.gscSiteUrl,
          startDate,
          endDate,
          prevStartDate,
          prevEndDate,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        gscError = body.error || `HTTP ${res.status}`;
      } else {
        gscData = body;
      }
    } catch (e) {
      gscError = e.message;
    }
  }

  // 2. Fetch GA4 data if propertyId is configured
  if (config.ga4PropertyId) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/ga4/report`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          propertyId: config.ga4PropertyId,
          startDate,
          endDate,
          prevStartDate,
          prevEndDate,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        ga4Error = body.error || `HTTP ${res.status}`;
      } else {
        ga4Data = body;
      }
    } catch (e) {
      ga4Error = e.message;
    }
  }

  // Build the live report object
  const report = {
    connected: true,
    client: config.gscSiteUrl ? config.gscSiteUrl.replace('sc-domain:', '') : 'Google Property',
    periodLabel: periodLabel || `${startDate} - ${endDate}`,
    dateRange: { startDate, endDate, prevStartDate, prevEndDate },

    // GSC Overview
    gscOverview: gscData ? [
      { key: 'clicks', label: 'Clicks', current: gscData.clicks ?? 0, previous: gscData.prevClicks ?? 0, diff: gscData.diffClicks ?? 0, unit: '', invertColor: false },
      { key: 'impressions', label: 'Impressions', current: gscData.impressions ?? 0, previous: gscData.prevImpressions ?? 0, diff: gscData.diffImpressions ?? 0, unit: '', invertColor: false },
      { key: 'ctr', label: 'Avg CTR', current: gscData.ctr || '0.00%', previous: gscData.prevCtr || '0.00%', diff: gscData.diffCtr ?? 0, unit: '', invertColor: false },
      { key: 'position', label: 'Avg Position', current: parseFloat(gscData.position || 0), previous: parseFloat(gscData.prevPosition || 0), diff: gscData.diffPosition ?? 0, unit: '', invertColor: true },
    ] : null,

    // Top Keywords from live Search Console
    topKeywords: gscData?.topKeywords || [],

    // Device breakdown
    deviceTraffic: gscData?.deviceTraffic || [],

    // GA4 Overview
    gaOverview: ga4Data ? [
      { key: 'overall', label: 'Overall Traffic (Sessions)', current: ga4Data.overall ?? 0, previous: ga4Data.prevOverall ?? 0, diff: ga4Data.diffOverall ?? 0 },
      { key: 'organic', label: 'Organic Traffic', current: ga4Data.organic ?? 0, previous: ga4Data.prevOrganic ?? 0, diff: ga4Data.diffOrganic ?? 0 },
      { key: 'direct', label: 'Direct Traffic', current: ga4Data.direct ?? 0, previous: ga4Data.prevDirect ?? 0, diff: ga4Data.diffDirect ?? 0 },
      { key: 'organic_new_users', label: 'Organic New Users', current: ga4Data.organicNewUsers ?? 0, previous: ga4Data.prevOrganicNewUsers ?? 0, diff: ga4Data.diffOrganicNewUsers ?? 0 },
      { key: 'time_on_site', label: 'Time on site (Avg Duration)', current: ga4Data.timeOnSite || '0m 0s', previous: ga4Data.prevTimeOnSite || '0m 0s', diff: ga4Data.diffTimeOnSite ?? 0 },
    ] : null,

    gscError,
    ga4Error,
  };

  return {
    connected: true,
    data: report,
    error: gscError || ga4Error || null,
  };
};
