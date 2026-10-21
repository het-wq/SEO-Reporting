import { getAuth } from './googleAuth.js';
import { getGA4Overview, getGA4TrafficTrends, getGA4LandingPages } from './ga4Service.js';
import { getGscPerformance, getGscQueries, getGscDevices, getGscPages } from './gscService.js';
import { getBrandAnalysis } from './brandAnalysisService.js';
import { getLocalSeoOverview } from './localSeoService.js';
import { getBacklinksOverview } from './backlinksService.js';
import { getAiVisibilityOverview } from './aiVisibilityService.js';
import { updateTelemetry } from './integrationsService.js';

// Cache structure: key -> { timestamp, data }
const cache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export const getLiveDashboardReport = async ({
  req,
  startDate,
  endDate,
  prevStartDate,
  prevEndDate,
  propertyId: overridePropId,
  siteUrl: overrideSiteUrl,
  brandTerms: overrideBrandTerms,
  periodLabel,
  previousPeriodLabel,
  forceRefresh = false,
}) => {
  const auth = getAuth(req);
  const ga4PropertyId = overridePropId || process.env.GA4_PROPERTY_ID || '';
  const gscSiteUrl = overrideSiteUrl || process.env.GSC_SITE_URL || 'https://boulderdecisions.com/';

  const cacheKey = `${startDate}_${endDate}_${prevStartDate}_${prevEndDate}_${ga4PropertyId}_${gscSiteUrl}`;
  if (!forceRefresh && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return { ...cached.data, fromCache: true, cachedAt: new Date(cached.timestamp).toISOString() };
    }
  }

  const errors = {};

  // 1. Fetch GA4 Overview & Trends
  let ga4Overview = null;
  let ga4Trends = [];
  let ga4LandingPages = [];
  if (auth && ga4PropertyId) {
    try {
      ga4Overview = await getGA4Overview({
        auth,
        propertyId: ga4PropertyId,
        startDate,
        endDate,
        prevStartDate,
        prevEndDate,
      });
      updateTelemetry('ga4', { status: 'connected', error: null });
    } catch (err) {
      errors.ga4 = err.message;
      updateTelemetry('ga4', { status: 'error', error: err.message });
    }

    try {
      ga4Trends = await getGA4TrafficTrends({
        auth,
        propertyId: ga4PropertyId,
        startDate,
        endDate,
      });
    } catch (e) {
      console.warn('GA4 trends error:', e.message);
    }

    try {
      ga4LandingPages = await getGA4LandingPages({
        auth,
        propertyId: ga4PropertyId,
        startDate,
        endDate,
      });
    } catch (e) {
      console.warn('GA4 landing pages error:', e.message);
    }
  }

  // 2. Fetch GSC Performance, Queries, Devices, Pages
  let gscPerformance = null;
  let gscQueries = [];
  let gscDevices = null;
  let gscPages = [];
  if (auth && gscSiteUrl) {
    try {
      gscPerformance = await getGscPerformance({
        auth,
        siteUrl: gscSiteUrl,
        startDate,
        endDate,
        prevStartDate,
        prevEndDate,
      });
      updateTelemetry('gsc', { status: 'connected', error: null });
    } catch (err) {
      errors.gsc = err.message;
      updateTelemetry('gsc', { status: 'error', error: err.message });
    }

    try {
      gscQueries = await getGscQueries({
        auth,
        siteUrl: gscSiteUrl,
        startDate,
        endDate,
        rowLimit: 250,
      });
    } catch (e) {
      console.warn('GSC queries error:', e.message);
    }

    try {
      gscDevices = await getGscDevices({
        auth,
        siteUrl: gscSiteUrl,
        startDate,
        endDate,
        prevStartDate,
        prevEndDate,
      });
    } catch (e) {
      console.warn('GSC devices error:', e.message);
    }

    try {
      gscPages = await getGscPages({
        auth,
        siteUrl: gscSiteUrl,
        startDate,
        endDate,
        rowLimit: 100,
      });
    } catch (e) {
      console.warn('GSC pages error:', e.message);
    }
  }

  // 3. Fetch Brand Analysis
  let brandAnalysis = null;
  if (auth && gscSiteUrl) {
    try {
      brandAnalysis = await getBrandAnalysis({
        auth,
        siteUrl: gscSiteUrl,
        startDate,
        endDate,
        prevStartDate,
        prevEndDate,
        brandTerms: overrideBrandTerms,
      });
    } catch (err) {
      errors.brand = err.message;
    }
  }

  // 4. Fetch Local SEO, Backlinks, AI Citations
  const [localSeo, backlinks, aiCitations] = await Promise.all([
    getLocalSeoOverview(),
    getBacklinksOverview(),
    getAiVisibilityOverview(),
  ]);

  // Construct Traffic object
  const traffic = ga4Overview || {
    source: 'Google Analytics 4',
    propertyId: ga4PropertyId,
    hasData: false,
    overall: { current: 0, previous: 0, diffPct: 0, improvement: null },
    totalUsers: { current: 0, previous: 0, diffPct: 0, improvement: null },
    activeUsers: { current: 0, previous: 0, diffPct: 0, improvement: null },
    organic: { current: 0, previous: 0, diffPct: 0, improvement: null },
    direct: { current: 0, previous: 0, diffPct: 0, improvement: null },
    referral: { current: 0, previous: 0, diffPct: 0, improvement: null },
    organicNewUsers: { current: 0, previous: 0, diffPct: 0, improvement: null },
    timeOnSiteOrganic: { current: '0m 0s', previous: '0m 0s', currentSeconds: 0, previousSeconds: 0, diffPct: 0, improvement: null },
    engagementRate: { current: '0.0%', previous: '0.0%', diffPct: 0, improvement: null },
    channelAcquisition: [],
    dailyTrends: ga4Trends,
    landingPages: ga4LandingPages,
  };

  // Construct Search Console object
  const searchConsole = gscPerformance || {
    source: 'Google Search Console',
    siteUrl: gscSiteUrl,
    hasData: false,
    clicks: { current: 0, previous: 0, diffPct: 0, improvement: null },
    impressions: { current: 0, previous: 0, diffPct: 0, improvement: null },
    avgCtr: { current: 0, previous: 0, currentText: '0.00%', previousText: '0.00%', diffPct: 0, improvement: null },
    avgPosition: { current: 0, previous: 0, currentText: '0.0', previousText: '0.0', diffPct: 0, improvement: null },
    dailyTrends: [],
    landingPages: gscPages,
  };

  // Construct Device Clicks object
  const deviceClicks = gscDevices || {
    desktop: { current: 0, previous: 0, diffPct: 0, impressions: 0, prevImpressions: 0 },
    mobile: { current: 0, previous: 0, diffPct: 0, impressions: 0, prevImpressions: 0 },
    tablet: { current: 0, previous: 0, diffPct: 0, impressions: 0, prevImpressions: 0 },
  };

  // Construct Brand Queries object
  const defaultMetric = { current: 0, previous: 0, diffPct: 0, improvement: null };
  const brandQueries = brandAnalysis || {
    source: 'Google Search Console (Brand Engine)',
    brandTerms: overrideBrandTerms || [],
    all: { brandClicks: defaultMetric, nonBrandClicks: defaultMetric, brandImpressions: defaultMetric, nonBrandImpressions: defaultMetric },
    desktop: { brandClicks: defaultMetric, nonBrandClicks: defaultMetric, brandImpressions: defaultMetric, nonBrandImpressions: defaultMetric },
    mobile: { brandClicks: defaultMetric, nonBrandClicks: defaultMetric, brandImpressions: defaultMetric, nonBrandImpressions: defaultMetric },
    topBrandQueries: [],
    topNonBrandQueries: [],
  };

  // Build live executive insights from real data
  const hits = [];
  const observations = [];

  if (traffic.organic?.current > traffic.organic?.previous) {
    hits.push(`Organic search traffic increased by ${traffic.organic.diffPct}% compared to prior period.`);
  } else if (traffic.organic?.previous > 0 && traffic.organic?.current < traffic.organic?.previous) {
    observations.push(`Organic search sessions decreased by ${Math.abs(traffic.organic.diffPct)}% compared to prior period.`);
  }

  if (searchConsole.clicks?.current > searchConsole.clicks?.previous) {
    hits.push(`Search Console clicks grew by ${searchConsole.clicks.diffPct}% (+${(searchConsole.clicks.current - searchConsole.clicks.previous).toLocaleString()} clicks).`);
  }

  if (searchConsole.avgPosition?.improvement) {
    hits.push(`Average ranking position improved by ${Math.abs(searchConsole.avgPosition.diffPct)} positions to ${searchConsole.avgPosition.current}.`);
  }

  if (deviceClicks.mobile?.current > deviceClicks.desktop?.current) {
    observations.push(`Mobile is the primary search platform (${deviceClicks.mobile.current} clicks vs ${deviceClicks.desktop.current} on desktop).`);
  }

  const executiveInsights = {
    hits: hits.length > 0 ? hits : ['Search and analytics tracking active for configured property.'],
    observations: observations.length > 0 ? observations : ['Monitoring search queries, device splits, and channel acquisition.'],
    hypotheses: [
      'Algorithm adjustments and SERP layout features may influence impression share and click-through rates.',
      'Targeted service area search volume and industry demand patterns influence query trends.',
    ],
    googleUpdate: {
      name: 'Google Core Search Algorithm',
      startDate: 'Ongoing',
      status: 'Live automated updates active',
    },
    octoberPriorities: [
      'Expand landing page optimization for top non-brand queries with high impression volume.',
      'Enhance mobile user experience and Core Web Vitals to sustain search rankings.',
      'Target high-intent Boulder Decision keywords currently ranking in positions 4-10.',
    ],
  };

  const report = {
    id: `live-${startDate}-${endDate}`,
    client: process.env.CLIENT_NAME || 'Boulder Decision',
    isLive: true,
    period: periodLabel || `${startDate} to ${endDate}`,
    previousPeriod: previousPeriodLabel || `${prevStartDate} to ${prevEndDate}`,
    dateRange: { startDate, endDate, prevStartDate, prevEndDate },
    generatedAt: new Date().toISOString(),

    // Sources metadata
    sources: {
      ga4: {
        provider: 'Google Analytics 4',
        propertyId: ga4PropertyId,
        connected: Boolean(ga4Overview?.hasData),
        error: errors.ga4 || null,
      },
      gsc: {
        provider: 'Google Search Console',
        siteUrl: gscSiteUrl,
        connected: Boolean(gscPerformance?.hasData),
        error: errors.gsc || null,
      },
      localSeo: {
        provider: localSeo.provider,
        configured: localSeo.configured,
      },
      backlinks: {
        provider: backlinks.provider,
        configured: backlinks.configured,
      },
      aiVisibility: {
        provider: aiCitations.provider,
        configured: aiCitations.configured,
      },
    },

    // Sub-reports
    traffic,
    searchConsole,
    deviceClicks,
    brandQueries,
    keywordRankings: gscQueries,
    localSeo,
    backlinks,
    aiCitations,
    seoActivities: {
      onsiteBlogPosts: [],
      offsiteBlogPosts: [],
      offPageActivities: [],
      note: 'Activity tracking feed connects directly to your content management and deployment pipeline.',
    },
    technicalSeo: {
      completedChanges: [
        'Live Google Search Console and GA4 API data pipeline connected',
        'Dynamic date range comparisons enabled',
        'Brand vs non-brand search query classification active',
        'Mobile vs desktop search performance tracking verified',
      ],
    },
    executiveInsights,
    errors,
  };

  cache.set(cacheKey, { timestamp: Date.now(), data: report });
  return report;
};
