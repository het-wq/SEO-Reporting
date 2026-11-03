import { getAuth, getAuthStatus, classifyGoogleError } from './googleAuth.js';
import { google } from 'googleapis';
import { getBacklinksOverview } from './backlinksService.js';
import { getLocalSeoOverview, listGbpLocations } from './localSeoService.js';
import { getAiVisibilityOverview } from './aiVisibilityService.js';
import { parseBrandTerms } from './brandAnalysisService.js';
import { listGscSites } from './gscService.js';

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

  const ga4PropId = process.env.GA4_PROPERTY_ID || '';
  const gscSiteUrl = process.env.GSC_SITE_URL || 'https://boulderdecisions.com/';
  let brandTerms = ['boulder decision', 'boulder decisions', 'boulderdecision', 'boulderdecisions', 'boulder decisions'];
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

    const siteUrl = req?.body?.siteUrl || process.env.GSC_SITE_URL || 'https://boulderdecisions.com/';

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
    const locationId = req?.body?.locationId || null;
    const locationName = req?.body?.locationName || null;
    const res = await getLocalSeoOverview({ locationId, locationName, req });
    const isSuccess = Boolean(res.connected && !res.requiresReauth);
    return {
      success: isSuccess,
      status: res.status,
      message: res.requiresReauth
        ? (res.description || 'Google Business Profile permissions required. Please re-authorize your Google Account to grant Business Profile management permissions.')
        : res.connected
        ? `Connected: ${res.provider} (${res.location?.title || res.location?.name || 'Active'})`
        : (res.description || res.error || 'Google Business Profile connection test failed. Please check your Location ID or re-authorize.'),
      instructions: res.instructions,
      actionLabel: res.actionLabel,
      actionUrl: res.actionUrl,
      location: res.location,
      availableLocations: res.availableLocations || [],
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

/**
 * Derives appropriate brand search keywords for an account based on its name, property, or site URL.
 * Never produces Boulder Decision keywords unless the account is actually Boulder Decision.
 */
export const deriveAccountBrandKeywords = ({ accountName, propertyName, siteUrl }) => {
  const hasNonBoulderName =
    (accountName && !accountName.toLowerCase().includes('boulder') && !/^\d+$/.test(accountName.trim())) ||
    (propertyName && !propertyName.toLowerCase().includes('boulder') && !/^\d+$/.test(propertyName.trim()));

  const isBoulder =
    !hasNonBoulderName &&
    ((accountName && accountName.toLowerCase().includes('boulder')) ||
     (propertyName && propertyName.toLowerCase().includes('boulder')) ||
     (siteUrl && siteUrl.toLowerCase().includes('boulder')));

  if (isBoulder) {
    return 'Boulder Decision, Boulder Decisions, boulderdecision, boulderdecisions, boulder decisions';
  }

  const terms = new Set();

  if (accountName) {
    const clean = accountName.replace(/^accounts\//, '').trim();
    if (clean && !/^\d+$/.test(clean)) {
      terms.add(clean);
      const parts = clean.split(/[\s\-_|:]+/).filter((p) => p.length > 2);
      if (parts.length > 1) {
        terms.add(parts.join(' '));
        terms.add(parts.join(''));
      }
    }
  }

  if (propertyName) {
    const clean = propertyName.replace(/^properties\//, '').trim();
    if (clean && !/^\d+$/.test(clean)) {
      terms.add(clean);
      const parts = clean.split(/[\s\-_|:]+/).filter((p) => p.length > 2);
      if (parts.length > 1) {
        terms.add(parts.join(' '));
        terms.add(parts.join(''));
      }
    }
  }

  if (siteUrl) {
    const cleanDomain = siteUrl
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
    return accountName && !/^\d+$/.test(accountName) ? accountName : (propertyName || 'Brand');
  }

  return Array.from(terms).join(', ');
};

/**
 * Retrieve discovered Google Analytics accounts, GA4 properties, Search Console sites,
 * Google Business Profile locations, and unified account profiles for the authenticated Google user.
 */
export const getGoogleAccounts = async (req) => {
  const auth = getAuth(req);
  if (!auth) {
    return {
      authenticated: false,
      message: 'Not authenticated with Google',
      accounts: [],
      ga4Accounts: [],
      gscSites: [],
      gbpLocations: [],
      gbpAccounts: [],
      userProfile: null,
    };
  }

  let userProfile = null;
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth });
    const uRes = await oauth2.userinfo.get();
    if (uRes?.data) {
      userProfile = {
        email: uRes.data.email || null,
        name: uRes.data.name || null,
        picture: uRes.data.picture || null,
      };
    }
  } catch {
    // Scope might not include userinfo on existing tokens, ignore
  }

  let ga4Accounts = [];
  let ga4Error = null;
  try {
    const analyticsadmin = google.analyticsadmin({ version: 'v1beta', auth });
    const res = await analyticsadmin.accountSummaries.list({ pageSize: 200 });
    const summaries = res.data?.accountSummaries || [];
    ga4Accounts = summaries.map((acc) => ({
      accountId: acc.account ? acc.account.replace(/^accounts\//, '') : '',
      accountName: acc.displayName || 'Google Analytics Account',
      properties: (acc.propertySummaries || []).map((p) => ({
        propertyId: p.property ? p.property.replace(/^properties\//, '') : '',
        propertyName: p.displayName || 'GA4 Property',
        propertyType: p.propertyType,
      })),
    }));
  } catch (err) {
    ga4Error = classifyGoogleError(err, 'Google Analytics Admin');
  }

  let gscSites = [];
  let gscError = null;
  try {
    const rawSites = await listGscSites(auth);
    gscSites = (rawSites || []).map((s) => ({
      siteUrl: s.siteUrl,
      permissionLevel: s.permissionLevel || 'Verified',
    }));
  } catch (err) {
    gscError = classifyGoogleError(err, 'Google Search Console');
  }

  let gbpLocations = [];
  let gbpAccounts = [];
  let gbpRequiresReauth = false;
  let gbpError = null;
  try {
    const gbpRes = await listGbpLocations(req, auth);
    gbpLocations = (gbpRes.locations || []).map((loc) => ({
      name: loc.name,
      title: loc.title || 'Business Location',
      websiteUri: loc.websiteUri || null,
      phoneNumbers: loc.phoneNumbers || null,
      storefrontAddress: loc.storefrontAddress || null,
    }));
    gbpAccounts = gbpRes.accounts || [];
    gbpRequiresReauth = Boolean(gbpRes.requiresReauth);
    if (!gbpRes.success && gbpRes.error) {
      gbpError = gbpRes.classified || { message: gbpRes.error };
    }
  } catch (err) {
    gbpError = classifyGoogleError(err, 'Google Business Profile');
  }

  // Construct unified accounts list
  const accounts = [];
  const matchedGscUrls = new Set();

  const normalizeDomain = (str) => {
    return (str || '')
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^sc-domain:/, '')
      .replace(/\/.*$/, '')
      .replace(/^www\./, '');
  };

  // Helper to find matching GBP location
  const findMatchingGbp = (nameOrDomain) => {
    if (!nameOrDomain || !gbpLocations.length) return null;
    const target = normalizeDomain(nameOrDomain);
    return gbpLocations.find((loc) => {
      const titleNorm = normalizeDomain(loc.title);
      const webNorm = normalizeDomain(loc.websiteUri);
      return (
        (titleNorm && target && (titleNorm.includes(target) || target.includes(titleNorm))) ||
        (webNorm && target && (webNorm.includes(target) || target.includes(webNorm)))
      );
    });
  };

  // 1. From GA4 Properties
  for (const acc of ga4Accounts) {
    for (const prop of acc.properties) {
      const propNorm = normalizeDomain(prop.propertyName);
      const accNorm = normalizeDomain(acc.accountName);

      // Try finding matching GSC site
      let matchedGsc = gscSites.find((s) => {
        const sNorm = normalizeDomain(s.siteUrl);
        return (
          (sNorm && propNorm && (sNorm.includes(propNorm) || propNorm.includes(sNorm))) ||
          (sNorm && accNorm && (sNorm.includes(accNorm) || accNorm.includes(sNorm)))
        );
      });

      // If this account actually is Boulder Decision and no GSC site matched by domain, match boulderdecisions.com
      const isAccBoulder =
        acc.accountName?.toLowerCase().includes('boulder') ||
        prop.propertyName?.toLowerCase().includes('boulder');

      if (!matchedGsc && isAccBoulder && gscSites.length > 0) {
        matchedGsc = gscSites.find((s) => s.siteUrl.toLowerCase().includes('boulder')) || gscSites[0];
      }

      if (matchedGsc) {
        matchedGscUrls.add(matchedGsc.siteUrl);
      }

      const matchedGbp =
        findMatchingGbp(prop.propertyName) ||
        findMatchingGbp(acc.accountName) ||
        (matchedGsc ? findMatchingGbp(matchedGsc.siteUrl) : null);

      const brandKeywords = deriveAccountBrandKeywords({
        accountName: acc.accountName,
        propertyName: prop.propertyName,
        siteUrl: matchedGsc?.siteUrl || '',
      });

      accounts.push({
        id: `ga4-${prop.propertyId}`,
        name: `${acc.accountName} - ${prop.propertyName}`,
        accountName: acc.accountName,
        propertyName: prop.propertyName,
        ga4PropertyId: prop.propertyId,
        gscSiteUrl: matchedGsc ? matchedGsc.siteUrl : '',
        gbpLocationId: matchedGbp ? matchedGbp.name : '',
        gbpLocationName: matchedGbp ? matchedGbp.title : '',
        brandKeywords,
        source: matchedGsc ? 'matched' : 'ga4',
      });
    }
  }

  // 2. From unmatched GSC Sites
  for (const site of gscSites) {
    if (!matchedGscUrls.has(site.siteUrl)) {
      const cleanName = site.siteUrl
        .replace(/^https?:\/\//, '')
        .replace(/^sc-domain:/, '')
        .replace(/\/.*$/, '');

      const siteNorm = normalizeDomain(site.siteUrl);
      const matchedGbp = findMatchingGbp(site.siteUrl);

      // Find matching GA4 if any
      let matchedGa4PropId = '';
      for (const acc of ga4Accounts) {
        for (const prop of acc.properties) {
          const propNorm = normalizeDomain(prop.propertyName);
          if (propNorm && siteNorm && (propNorm.includes(siteNorm) || siteNorm.includes(propNorm))) {
            matchedGa4PropId = prop.propertyId;
            break;
          }
        }
        if (matchedGa4PropId) break;
      }

      const brandKeywords = deriveAccountBrandKeywords({
        accountName: cleanName,
        propertyName: site.siteUrl,
        siteUrl: site.siteUrl,
      });

      accounts.push({
        id: `gsc-${encodeURIComponent(site.siteUrl)}`,
        name: cleanName,
        accountName: cleanName,
        propertyName: site.siteUrl,
        ga4PropertyId: matchedGa4PropId,
        gscSiteUrl: site.siteUrl,
        gbpLocationId: matchedGbp ? matchedGbp.name : '',
        gbpLocationName: matchedGbp ? matchedGbp.title : '',
        brandKeywords,
        source: 'gsc',
      });
    }
  }

  // 3. Always include default configured account if accounts list is empty or doesn't have Boulder Decision
  const hasBoulder = accounts.some(
    (a) => a.accountName?.toLowerCase().includes('boulder') || a.gscSiteUrl?.toLowerCase().includes('boulder')
  );
  if (!hasBoulder) {
    accounts.unshift({
      id: 'default-boulder-decision',
      name: 'Boulder Decision',
      accountName: 'Boulder Decision',
      propertyName: 'Boulder Decision Web',
      ga4PropertyId: process.env.GA4_PROPERTY_ID || '516707960',
      gscSiteUrl: process.env.GSC_SITE_URL || 'https://boulderdecisions.com/',
      gbpLocationId: process.env.GOOGLE_BUSINESS_LOCATION_ID || '',
      gbpLocationName: 'Boulder Decisions',
      brandKeywords: 'Boulder Decision, Boulder Decisions, boulderdecision, boulderdecisions, boulder decisions',
      source: 'default',
    });
  }

  return {
    authenticated: true,
    userProfile,
    accounts,
    ga4Accounts,
    gscSites,
    gbpLocations,
    gbpAccounts,
    gbpRequiresReauth,
    ga4Error,
    gscError,
    gbpError,
  };
};
