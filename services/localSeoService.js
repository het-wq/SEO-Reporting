/**
 * Local SEO & Google Business Profile Performance Service
 * Connects with Google Business Profile Performance API (businessprofileperformance.googleapis.com)
 * and Google My Business APIs to retrieve live local Google Maps & Search metrics.
 */

import { getAuth, classifyGoogleError } from './googleAuth.js';

// Format YYYY-MM-DD to { year, month, day }
const parseDate = (dStr) => {
  if (!dStr) return null;
  const parts = dStr.split('-').map(Number);
  if (parts.length === 3) {
    return { year: parts[0], month: parts[1], day: parts[2] };
  }
  return null;
};

// Calculate % change and improvement
const calcDiff = (cur, prev) => {
  const current = Number(cur) || 0;
  const previous = Number(prev) || 0;
  if (previous === 0) {
    return {
      current,
      previous,
      diffPct: current > 0 ? 100 : 0,
      improvement: current >= previous,
    };
  }
  const pct = Math.round(((current - previous) / previous) * 1000) / 10;
  return {
    current,
    previous,
    diffPct: pct,
    improvement: pct >= 0,
  };
};

/**
 * Lists GBP accounts and locations for the authenticated user
 */
export const listGbpLocations = async (req, customAuth = null) => {
  const auth = customAuth || getAuth(req);
  if (!auth) {
    return { success: false, authenticated: false, error: 'Google Account not connected' };
  }

  try {
    // 1. Fetch Accounts
    const accRes = await auth.request({
      url: 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
    });

    const accounts = accRes.data?.accounts || [];
    if (!accounts.length) {
      return { success: true, authenticated: true, accounts: [], locations: [] };
    }

    // 2. Fetch Locations for each account
    const allLocations = [];
    for (const acc of accounts) {
      try {
        const locRes = await auth.request({
          url: `https://mybusinessbusinessinformation.googleapis.com/v1/${acc.name}/locations`,
          params: {
            readMask: 'name,title,storeCode,phoneNumbers,websiteUri,metadata,storefrontAddress',
          },
        });
        const locs = locRes.data?.locations || [];
        allLocations.push(...locs);
      } catch (locErr) {
        console.warn(`Could not load locations for account ${acc.name}:`, locErr.message);
      }
    }

    return {
      success: true,
      authenticated: true,
      accounts,
      locations: allLocations,
    };
  } catch (err) {
    const classified = classifyGoogleError(err, 'Google Business Profile API');
    return {
      success: false,
      authenticated: true,
      requiresReauth: classified.status === 'scope_insufficient',
      classified,
      error: err.message,
    };
  }
};

/**
 * Queries Google Business Profile Performance API for daily metrics
 */
const fetchPerformanceMetrics = async (auth, locationResourceName, startDate, endDate) => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return null;

  const url = `https://businessprofileperformance.googleapis.com/v1/${locationResourceName}:fetchMultiDailyMetricsTimeSeries`;

  const dailyMetrics = [
    'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
    'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
    'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
    'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
    'CALL_CLICKS',
    'WEBSITE_CLICKS',
    'BUSINESS_DIRECTION_REQUESTS',
  ];

  const params = new URLSearchParams();
  dailyMetrics.forEach((m) => params.append('dailyMetrics', m));
  params.set('dailyRange.start_date.year', String(start.year));
  params.set('dailyRange.start_date.month', String(start.month));
  params.set('dailyRange.start_date.day', String(start.day));
  params.set('dailyRange.end_date.year', String(end.year));
  params.set('dailyRange.end_date.month', String(end.month));
  params.set('dailyRange.end_date.day', String(end.day));

  const res = await auth.request({
    url: `${url}?${params.toString()}`,
  });

  return res.data;
};

/**
 * Parse multiDailyMetricTimeSeries response
 */
const parseTimeSeriesData = (data) => {
  const seriesList = data?.multiDailyMetricTimeSeries || [];
  const metricsTotals = {
    desktopMaps: 0,
    desktopSearch: 0,
    mobileMaps: 0,
    mobileSearch: 0,
    websiteClicks: 0,
    callClicks: 0,
    directionRequests: 0,
  };

  const datesMap = {};

  seriesList.forEach((item) => {
    const metricType = item.dailyMetric;
    const datedValues = item.dailyMetricTimeSeries?.timeSeries?.datedValues || [];

    datedValues.forEach((dv) => {
      const val = Number(dv.value) || 0;
      const d = dv.date;
      const dateKey = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;

      if (!datesMap[dateKey]) {
        datesMap[dateKey] = {
          date: dateKey,
          desktopMaps: 0,
          desktopSearch: 0,
          mobileMaps: 0,
          mobileSearch: 0,
          mapsImpressions: 0,
          searchImpressions: 0,
          impressions: 0,
          websiteClicks: 0,
          callClicks: 0,
          directionRequests: 0,
        };
      }

      if (metricType === 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS') {
        metricsTotals.desktopMaps += val;
        datesMap[dateKey].desktopMaps += val;
        datesMap[dateKey].mapsImpressions += val;
        datesMap[dateKey].impressions += val;
      } else if (metricType === 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH') {
        metricsTotals.desktopSearch += val;
        datesMap[dateKey].desktopSearch += val;
        datesMap[dateKey].searchImpressions += val;
        datesMap[dateKey].impressions += val;
      } else if (metricType === 'BUSINESS_IMPRESSIONS_MOBILE_MAPS') {
        metricsTotals.mobileMaps += val;
        datesMap[dateKey].mobileMaps += val;
        datesMap[dateKey].mapsImpressions += val;
        datesMap[dateKey].impressions += val;
      } else if (metricType === 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH') {
        metricsTotals.mobileSearch += val;
        datesMap[dateKey].mobileSearch += val;
        datesMap[dateKey].searchImpressions += val;
        datesMap[dateKey].impressions += val;
      } else if (metricType === 'WEBSITE_CLICKS') {
        metricsTotals.websiteClicks += val;
        datesMap[dateKey].websiteClicks += val;
      } else if (metricType === 'CALL_CLICKS') {
        metricsTotals.callClicks += val;
        datesMap[dateKey].callClicks += val;
      } else if (metricType === 'BUSINESS_DIRECTION_REQUESTS') {
        metricsTotals.directionRequests += val;
        datesMap[dateKey].directionRequests += val;
      }
    });
  });

  const mapsTotal = metricsTotals.desktopMaps + metricsTotals.mobileMaps;
  const searchTotal = metricsTotals.desktopSearch + metricsTotals.mobileSearch;
  const impressionsTotal = mapsTotal + searchTotal;

  const dailyTrends = Object.values(datesMap).sort((a, b) => a.date.localeCompare(b.date));

  return {
    totals: {
      ...metricsTotals,
      mapsImpressions: mapsTotal,
      searchImpressions: searchTotal,
      totalImpressions: impressionsTotal,
    },
    dailyTrends,
  };
};

/**
 * Main Overview Resolver for Local SEO & Google Business Profile Performance
 */
export const getLocalSeoOverview = async ({
  startDate = '2026-10-01',
  endDate = '2026-10-24',
  prevStartDate = '2026-09-01',
  prevEndDate = '2026-09-24',
  req = null,
  auth: customAuth = null,
} = {}) => {
  const auth = customAuth || getAuth(req);
  const brightLocalKey = process.env.BRIGHTLOCAL_API_KEY;
  const configuredLocationId = process.env.GOOGLE_BUSINESS_LOCATION_ID;

  // 1. If BrightLocal API is configured, return BrightLocal
  if (brightLocalKey) {
    return {
      configured: true,
      connected: true,
      provider: 'BrightLocal',
      status: 'connected',
      description: 'BrightLocal Local Rank Tracker API',
      grids: [],
    };
  }

  // 2. If Google Auth is present, attempt Google Business Profile Performance API
  if (auth) {
    try {
      const locationRes = await listGbpLocations(req, auth);

      // If scope grant is needed (current token lacks business.manage)
      if (locationRes.requiresReauth) {
        return {
          configured: true,
          connected: false,
          requiresReauth: true,
          provider: 'Google Business Profile Performance API',
          status: 'reauth_required',
          title: 'Google Business Profile Authorization Required',
          description:
            'The Google Business Profile Performance API is enabled in your Google Cloud Project. Please re-authorize your Google Account to grant Business Profile permissions to your session.',
          actionLabel: 'Re-authorize Google Account',
          cloudApiEnabled: true,
          location: null,
          metrics: {
            totalImpressions: { current: 0, previous: 0, diffPct: 0, improvement: null },
            mapsImpressions: { current: 0, previous: 0, diffPct: 0, improvement: null },
            searchImpressions: { current: 0, previous: 0, diffPct: 0, improvement: null },
            websiteClicks: { current: 0, previous: 0, diffPct: 0, improvement: null },
            callClicks: { current: 0, previous: 0, diffPct: 0, improvement: null },
            directionRequests: { current: 0, previous: 0, diffPct: 0, improvement: null },
          },
          dailyTrends: [],
        };
      }

      // If locations found or explicitly configured
      const targetLocation =
        (locationRes.locations && locationRes.locations.length > 0 && locationRes.locations[0]) ||
        (configuredLocationId ? { name: configuredLocationId.startsWith('locations/') ? configuredLocationId : `locations/${configuredLocationId}`, title: 'Boulder Decisions' } : null);

      if (targetLocation && targetLocation.name) {
        try {
          const [curMetricsRaw, prevMetricsRaw] = await Promise.all([
            fetchPerformanceMetrics(auth, targetLocation.name, startDate, endDate),
            fetchPerformanceMetrics(auth, targetLocation.name, prevStartDate, prevEndDate),
          ]);

          const curParsed = parseTimeSeriesData(curMetricsRaw);
          const prevParsed = parseTimeSeriesData(prevMetricsRaw);

          return {
            configured: true,
            connected: true,
            provider: 'Google Business Profile Performance API',
            status: 'connected',
            location: {
              name: targetLocation.name,
              title: targetLocation.title || 'Boulder Decisions',
              websiteUri: targetLocation.websiteUri || 'https://boulderdecisions.com/',
              phoneNumbers: targetLocation.phoneNumbers || null,
              storefrontAddress: targetLocation.storefrontAddress || null,
            },
            metrics: {
              totalImpressions: calcDiff(curParsed.totals.totalImpressions, prevParsed.totals.totalImpressions),
              mapsImpressions: calcDiff(curParsed.totals.mapsImpressions, prevParsed.totals.mapsImpressions),
              searchImpressions: calcDiff(curParsed.totals.searchImpressions, prevParsed.totals.searchImpressions),
              websiteClicks: calcDiff(curParsed.totals.websiteClicks, prevParsed.totals.websiteClicks),
              callClicks: calcDiff(curParsed.totals.callClicks, prevParsed.totals.callClicks),
              directionRequests: calcDiff(curParsed.totals.directionRequests, prevParsed.totals.directionRequests),
            },
            deviceSplit: curParsed.totals,
            dailyTrends: curParsed.dailyTrends,
            availableLocations: locationRes.locations || [],
            cloudApiEnabled: true,
          };
        } catch (perfErr) {
          console.warn('Google Business Profile Performance API error:', perfErr.message);
          const classified = classifyGoogleError(perfErr, 'Google Business Profile Performance API');

          return {
            configured: true,
            connected: false,
            provider: 'Google Business Profile Performance API',
            status: classified.status,
            error: perfErr.message,
            classified,
            cloudApiEnabled: true,
            location: targetLocation,
            metrics: {
              totalImpressions: { current: 0, previous: 0, diffPct: 0, improvement: null },
              mapsImpressions: { current: 0, previous: 0, diffPct: 0, improvement: null },
              searchImpressions: { current: 0, previous: 0, diffPct: 0, improvement: null },
              websiteClicks: { current: 0, previous: 0, diffPct: 0, improvement: null },
              callClicks: { current: 0, previous: 0, diffPct: 0, improvement: null },
              directionRequests: { current: 0, previous: 0, diffPct: 0, improvement: null },
            },
            dailyTrends: [],
          };
        }
      }

      // Google Account is connected and API is enabled, but no verified location found yet
      return {
        configured: true,
        connected: true,
        provider: 'Google Business Profile Performance API',
        status: 'connected',
        locationSetupNeeded: true,
        title: 'Google Business Profile Connected',
        description:
          'Google Business Profile Performance API is active. No business location was automatically discovered for this Google login. Specify your Location ID in Settings or link your business profile.',
        cloudApiEnabled: true,
        availableLocations: locationRes.locations || [],
        accounts: locationRes.accounts || [],
        metrics: {
          totalImpressions: { current: 0, previous: 0, diffPct: 0, improvement: null },
          mapsImpressions: { current: 0, previous: 0, diffPct: 0, improvement: null },
          searchImpressions: { current: 0, previous: 0, diffPct: 0, improvement: null },
          websiteClicks: { current: 0, previous: 0, diffPct: 0, improvement: null },
          callClicks: { current: 0, previous: 0, diffPct: 0, improvement: null },
          directionRequests: { current: 0, previous: 0, diffPct: 0, improvement: null },
        },
        dailyTrends: [],
      };
    } catch (authErr) {
      console.warn('Error verifying GBP status:', authErr.message);
    }
  }

  // 3. Fallback: Not configured
  return {
    configured: false,
    connected: false,
    provider: 'Google Business Profile / Local SEO',
    status: 'not_configured',
    title: 'Local SEO Rank Tracking & Business Profile Setup',
    description:
      'Connect your Google Account to view live Google Business Profile performance metrics (Google Maps impressions, Search impressions, website clicks, direction requests, and phone calls).',
    instructions: [
      'Connect your authorized Google account to view live Search Console, GA4, and Google Business Profile performance.',
      'To view live local ranking grids, configure BRIGHTLOCAL_API_KEY in your environment or Settings.',
      'Search Console local query performance is available under the Keyword Rankings section.',
    ],
    supportedProviders: ['Google Business Profile Performance API', 'BrightLocal API'],
  };
};
