import { getAuth, getAuthStatus, classifyGoogleError } from './googleAuth.js';
import { google } from 'googleapis';
import { getBacklinksOverview } from './backlinksService.js';
import { getLocalSeoOverview } from './localSeoService.js';
import { getAiVisibilityOverview } from './aiVisibilityService.js';
import { parseBrandTerms } from './brandAnalysisService.js';

// Records last successful check timestamps and statuses
const integrationTelemetry = {
  ga4: { lastFetch: null, latestDataDate: null, status: 'unverified', error: null },
  gsc: { lastFetch: null, latestDataDate: null, status: 'unverified', error: null },
  localSeo: { lastFetch: null, status: 'unverified', error: null },
  backlinks: { lastFetch: null, status: 'unverified', error: null },
  aiVisibility: { lastFetch: null, status: 'unverified', error: null },
};

export const updateTelemetry = (provider, updates) => {
  if (integrationTelemetry[provider]) {
    integrationTelemetry[provider] = {
      ...integrationTelemetry[provider],
      ...updates,
      lastFetch: updates.lastFetch || new Date().toISOString(),
    };
  }
};

/**
 * Returns overall integrations status across all data providers
 */
export const getAllIntegrationsStatus = async (req) => {
  let authStatus = { configured: false, authenticated: false, authType: 'none' };
  try {
    authStatus = getAuthStatus();
  } catch (err) {
    console.warn('Error reading auth status:', err.message);
  }

  const ga4PropId = process.env.GA4_PROPERTY_ID || '516707960';
  const gscSiteUrl = process.env.GSC_SITE_URL || 'sc-domain:appliancecareofatlanta.com';
  let brandTerms = ['appliance care of atlanta', 'appliance care', 'appliancecare'];
  try {
    brandTerms = parseBrandTerms();
  } catch (err) {
    console.warn('Error parsing brand terms:', err.message);
  }

  // 1. Google Analytics 4
  const ga4Status = {
    id: 'ga4',
    name: 'Google Analytics 4 (GA4)',
    category: 'Website Analytics',
    propertyId: ga4PropId,
    configured: Boolean(ga4PropId && authStatus.configured),
    authenticated: authStatus.authenticated,
    authType: authStatus.authType,
    status: authStatus.authenticated
      ? (integrationTelemetry.ga4.status === 'connected' ? 'connected' : integrationTelemetry.ga4.status)
      : 'missing_credentials',
    lastFetch: integrationTelemetry.ga4.lastFetch,
    latestDataDate: integrationTelemetry.ga4.latestDataDate,
    errorMessage: integrationTelemetry.ga4.error,
    actionUrl: integrationTelemetry.ga4.actionUrl || null,
    actionLabel: integrationTelemetry.ga4.actionLabel || null,
  };

  // 2. Google Search Console
  const gscStatus = {
    id: 'gsc',
    name: 'Google Search Console (GSC)',
    category: 'Search Performance',
    siteUrl: gscSiteUrl,
    configured: Boolean(gscSiteUrl && authStatus.configured),
    authenticated: authStatus.authenticated,
    authType: authStatus.authType,
    status: authStatus.authenticated
      ? (integrationTelemetry.gsc.status === 'connected' ? 'connected' : integrationTelemetry.gsc.status)
      : 'missing_credentials',
    lastFetch: integrationTelemetry.gsc.lastFetch,
    latestDataDate: integrationTelemetry.gsc.latestDataDate,
    errorMessage: integrationTelemetry.gsc.error,
    actionUrl: integrationTelemetry.gsc.actionUrl || null,
    actionLabel: integrationTelemetry.gsc.actionLabel || null,
  };

  // 3. Brand Matching Engine
  const brandStatus = {
    id: 'brand',
    name: 'Brand vs Non-Brand Query Classifier',
    category: 'Search Intelligence',
    configured: true,
    brandTerms,
    status: 'configured',
    source: 'Dynamic calculation from Search Console queries',
  };

  // 4. Local SEO Provider
  let localSeo = { configured: false, provider: 'Local Rank Tracker', supportedProviders: [] };
  try {
    localSeo = await getLocalSeoOverview();
  } catch (e) {
    console.warn('Could not inspect local SEO status:', e.message);
  }
  const localSeoStatus = {
    id: 'localSeo',
    name: 'Local SEO & Geo-Grid Rank Tracker',
    category: 'Local Search',
    configured: Boolean(localSeo?.configured),
    provider: localSeo?.provider || 'BrightLocal / Google Business Profile',
    status: localSeo?.configured ? 'connected' : 'not_configured',
    lastFetch: integrationTelemetry.localSeo.lastFetch,
    description: localSeo?.description || 'Local rank tracker integration',
    supportedProviders: localSeo?.supportedProviders || [],
  };

  // 5. Backlink Provider
  let backlinks = { configured: false, provider: 'Backlink Provider', supportedProviders: [] };
  try {
    backlinks = await getBacklinksOverview();
  } catch (e) {
    console.warn('Could not inspect backlinks status:', e.message);
  }
  const backlinksStatus = {
    id: 'backlinks',
    name: 'Backlinks & Authority Provider',
    category: 'Link Intelligence',
    configured: Boolean(backlinks?.configured),
    provider: backlinks?.provider || 'Moz / Ahrefs / SEMrush',
    status: backlinks?.configured ? 'connected' : 'not_configured',
    lastFetch: integrationTelemetry.backlinks.lastFetch,
    description: backlinks?.description || 'Backlink tracking integration',
    supportedProviders: backlinks?.supportedProviders || [],
  };

  // 6. AI Search Visibility Provider
  let aiVis = { configured: false, provider: 'AI Visibility Provider', supportedProviders: [] };
  try {
    aiVis = await getAiVisibilityOverview();
  } catch (e) {
    console.warn('Could not inspect AI visibility status:', e.message);
  }
  const aiVisibilityStatus = {
    id: 'aiVisibility',
    name: 'AI Search Visibility & Citations',
    category: 'AI Overviews & LLM Search',
    configured: Boolean(aiVis?.configured),
    provider: aiVis?.provider || 'Perplexity / AI Engine',
    status: aiVis?.configured ? 'connected' : 'not_configured',
    lastFetch: integrationTelemetry.aiVisibility.lastFetch,
    description: aiVis?.description || 'AI visibility tracking integration',
    supportedProviders: aiVis?.supportedProviders || [],
  };

  return {
    authStatus,
    integrations: [ga4Status, gscStatus, brandStatus, localSeoStatus, backlinksStatus, aiVisibilityStatus],
  };
};

/**
 * Execute a REAL backend test connection request for a specific provider
 */
export const testIntegration = async (providerId, req) => {
  const auth = getAuth(req);
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // End date 3 days ago for reliable data availability
  const end = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);

  const startDate = formatDate(start);
  const endDate = formatDate(end);

  const startTime = Date.now();

  if (providerId === 'ga4') {
    if (!auth) {
      updateTelemetry('ga4', { status: 'missing_credentials', error: 'Not authenticated with Google' });
      return {
        success: false,
        status: 'missing_credentials',
        message: 'Google authorization is missing. Please click "Connect with Google".',
      };
    }

    const propId = req?.body?.propertyId || process.env.GA4_PROPERTY_ID || '516707960';
    const cleanPropId = propId.startsWith('properties/') ? propId : `properties/${propId}`;

    try {
      const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
      const res = await analyticsdata.properties.runReport({
        property: cleanPropId,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
          dimensions: [{ name: 'date' }],
          limit: 10,
        },
      });

      const rowCount = res.data?.rows?.length || 0;
      const latency = Date.now() - startTime;
      const latestDate = rowCount > 0 ? res.data.rows[res.data.rows.length - 1].dimensionValues[0].value : null;

      const resultStatus = rowCount > 0 ? 'connected' : 'connected_no_data';
      updateTelemetry('ga4', {
        status: resultStatus,
        latestDataDate: latestDate,
        error: null,
        actionUrl: null,
        actionLabel: null,
      });

      return {
        success: true,
        status: resultStatus,
        latencyMs: latency,
        rowCount,
        latestDataDate: latestDate,
        message:
          rowCount > 0
            ? `Successfully connected to GA4 Property ${propId}! Retrieved ${rowCount} days of verified data in ${latency}ms.`
            : `Connected to GA4 Property ${propId}, but no events were found for ${startDate} to ${endDate}.`,
      };
    } catch (err) {
      const classified = classifyGoogleError(err, 'Google Analytics 4');
      updateTelemetry('ga4', {
        status: classified.status,
        error: classified.message,
        actionUrl: classified.actionUrl,
        actionLabel: classified.actionLabel,
      });

      return {
        success: false,
        ...classified,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  if (providerId === 'gsc') {
    if (!auth) {
      updateTelemetry('gsc', { status: 'missing_credentials', error: 'Not authenticated with Google' });
      return {
        success: false,
        status: 'missing_credentials',
        message: 'Google authorization is missing. Please click "Connect with Google".',
      };
    }

    const siteUrl = req?.body?.siteUrl || process.env.GSC_SITE_URL || 'sc-domain:appliancecareofatlanta.com';

    try {
      const searchconsole = google.searchconsole({ version: 'v1', auth });
      const res = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['date'],
          rowLimit: 10,
        },
      });

      const rowCount = res.data?.rows?.length || 0;
      const latency = Date.now() - startTime;
      const latestDate = rowCount > 0 ? res.data.rows[res.data.rows.length - 1].keys[0] : null;

      const resultStatus = rowCount > 0 ? 'connected' : 'connected_no_data';
      updateTelemetry('gsc', {
        status: resultStatus,
        latestDataDate: latestDate,
        error: null,
        actionUrl: null,
        actionLabel: null,
      });

      return {
        success: true,
        status: resultStatus,
        latencyMs: latency,
        rowCount,
        latestDataDate: latestDate,
        message:
          rowCount > 0
            ? `Successfully connected to Search Console site ${siteUrl}! Retrieved ${rowCount} days of verified data in ${latency}ms.`
            : `Connected to Search Console site ${siteUrl}, but no search data was recorded between ${startDate} and ${endDate}.`,
      };
    } catch (err) {
      const classified = classifyGoogleError(err, 'Google Search Console');
      updateTelemetry('gsc', {
        status: classified.status,
        error: classified.message,
        actionUrl: classified.actionUrl,
        actionLabel: classified.actionLabel,
      });

      return {
        success: false,
        ...classified,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  if (providerId === 'backlinks') {
    const res = await getBacklinksOverview();
    return {
      success: res.configured,
      status: res.status,
      message: res.configured ? `Connected to ${res.provider}` : res.description,
      instructions: res.instructions,
    };
  }

  if (providerId === 'localSeo') {
    const res = await getLocalSeoOverview();
    return {
      success: res.configured,
      status: res.status,
      message: res.configured ? `Connected to ${res.provider}` : res.description,
      instructions: res.instructions,
    };
  }

  if (providerId === 'aiVisibility') {
    const res = await getAiVisibilityOverview();
    return {
      success: res.configured,
      status: res.status,
      message: res.configured ? `Connected to ${res.provider}` : res.description,
      instructions: res.instructions,
    };
  }

  return { success: false, message: `Unknown provider: ${providerId}` };
};
