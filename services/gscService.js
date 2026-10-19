import { google } from 'googleapis';

const calcDiff = (curr, prev) => {
  if (prev === 0 || !prev) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 10000) / 100;
};

/**
 * Fetch Google Search Console Performance overview comparing current and previous period
 */
export const getGscPerformance = async ({
  auth,
  siteUrl,
  startDate,
  endDate,
  prevStartDate,
  prevEndDate,
}) => {
  if (!auth) throw new Error('Not authenticated with Google');
  if (!siteUrl) throw new Error('Search Console siteUrl is required');

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const currentReq = searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['date'],
    },
  });

  const prevReq = (prevStartDate && prevEndDate)
    ? searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: prevStartDate,
          endDate: prevEndDate,
          dimensions: ['date'],
        },
      }).catch((e) => {
        console.warn('GSC previous period query warning:', e.message);
        return { data: { rows: [] } };
      })
    : Promise.resolve({ data: { rows: [] } });

  const [currentRes, prevRes] = await Promise.all([currentReq, prevReq]);

  const cRows = currentRes.data.rows || [];
  const pRows = prevRes.data.rows || [];

  const clicks = cRows.reduce((acc, r) => acc + (r.clicks || 0), 0);
  const impressions = cRows.reduce((acc, r) => acc + (r.impressions || 0), 0);
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  // Weighted position by impressions
  const weightedPosition = impressions > 0
    ? cRows.reduce((acc, r) => acc + ((r.position || 0) * (r.impressions || 0)), 0) / impressions
    : (cRows.length > 0 ? cRows.reduce((acc, r) => acc + (r.position || 0), 0) / cRows.length : 0);

  const prevClicks = pRows.reduce((acc, r) => acc + (r.clicks || 0), 0);
  const prevImpressions = pRows.reduce((acc, r) => acc + (r.impressions || 0), 0);
  const prevCtr = prevImpressions > 0 ? (prevClicks / prevImpressions) * 100 : 0;
  const prevWeightedPosition = prevImpressions > 0
    ? pRows.reduce((acc, r) => acc + ((r.position || 0) * (r.impressions || 0)), 0) / prevImpressions
    : (pRows.length > 0 ? pRows.reduce((acc, r) => acc + (r.position || 0), 0) / pRows.length : 0);

  const diffPos = Math.round((prevWeightedPosition - weightedPosition) * 10) / 10;

  const dailyTrends = cRows
    .map((r) => ({
      date: r.keys?.[0] || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: ((r.ctr || 0) * 100).toFixed(2),
      position: Math.round((r.position || 0) * 10) / 10,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    source: 'Google Search Console',
    siteUrl,
    dateRange: { startDate, endDate, prevStartDate, prevEndDate },
    hasData: cRows.length > 0,
    clicks: {
      current: clicks,
      previous: prevClicks,
      diffPct: calcDiff(clicks, prevClicks),
      improvement: clicks >= prevClicks,
      label: 'Search Clicks',
    },
    impressions: {
      current: impressions,
      previous: prevImpressions,
      diffPct: calcDiff(impressions, prevImpressions),
      improvement: impressions >= prevImpressions,
      label: 'Search Impressions',
    },
    avgCtr: {
      current: Math.round(ctr * 100) / 100,
      previous: Math.round(prevCtr * 100) / 100,
      currentText: `${ctr.toFixed(2)}%`,
      previousText: `${prevCtr.toFixed(2)}%`,
      diffPct: Math.round((ctr - prevCtr) * 100) / 100,
      improvement: ctr >= prevCtr,
      label: 'Average CTR',
    },
    avgPosition: {
      current: Math.round(weightedPosition * 10) / 10,
      previous: Math.round(prevWeightedPosition * 10) / 10,
      currentText: (weightedPosition > 0 ? weightedPosition.toFixed(1) : '0.0'),
      previousText: (prevWeightedPosition > 0 ? prevWeightedPosition.toFixed(1) : '0.0'),
      diffPct: diffPos,
      // For position, lower is better (improvement = current < previous)
      improvement: weightedPosition > 0 && prevWeightedPosition > 0 ? weightedPosition <= prevWeightedPosition : null,
      label: 'Average Position',
      invertColor: true,
    },
    dailyTrends,
  };
};

/**
 * Fetch top search queries from Search Console
 */
export const getGscQueries = async ({
  auth,
  siteUrl,
  startDate,
  endDate,
  rowLimit = 250,
}) => {
  if (!auth || !siteUrl) return [];

  const searchconsole = google.searchconsole({ version: 'v1', auth });
  const res = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit,
    },
  });

  const rows = res.data.rows || [];
  return rows.map((row) => {
    const keyword = row.keys?.[0] || '';
    const pos = Math.round((row.position || 0) * 10) / 10;
    return {
      keyword,
      position: pos,
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: ((row.ctr || 0) * 100).toFixed(2) + '%',
      ctrNum: Math.round((row.ctr || 0) * 10000) / 100,
      status: pos <= 3 ? 'Top 3' : pos <= 10 ? 'Top 10' : pos <= 20 ? 'Top 20' : 'Position 21+',
      tier: pos <= 3 ? 'top3' : pos <= 10 ? 'top10' : 'pos11plus',
    };
  });
};

/**
 * Fetch top landing pages from Search Console
 */
export const getGscPages = async ({
  auth,
  siteUrl,
  startDate,
  endDate,
  rowLimit = 100,
}) => {
  if (!auth || !siteUrl) return [];

  const searchconsole = google.searchconsole({ version: 'v1', auth });
  const res = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit,
    },
  });

  const rows = res.data.rows || [];
  return rows.map((row) => ({
    page: row.keys?.[0] || '',
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: ((row.ctr || 0) * 100).toFixed(2) + '%',
    position: Math.round((row.position || 0) * 10) / 10,
  }));
};

/**
 * Fetch device breakdown from Search Console (Desktop, Mobile, Tablet)
 */
export const getGscDevices = async ({
  auth,
  siteUrl,
  startDate,
  endDate,
  prevStartDate,
  prevEndDate,
}) => {
  if (!auth || !siteUrl) {
    return {
      desktop: { current: 0, previous: 0, diffPct: 0 },
      mobile: { current: 0, previous: 0, diffPct: 0 },
      tablet: { current: 0, previous: 0, diffPct: 0 },
    };
  }

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const currentReq = searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['device'],
    },
  });

  const prevReq = (prevStartDate && prevEndDate)
    ? searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: prevStartDate,
          endDate: prevEndDate,
          dimensions: ['device'],
        },
      }).catch(() => ({ data: { rows: [] } }))
    : Promise.resolve({ data: { rows: [] } });

  const [currentRes, prevRes] = await Promise.all([currentReq, prevReq]);

  const cRows = currentRes.data.rows || [];
  const pRows = prevRes.data.rows || [];

  const mapDevice = (rows, devName) => {
    const row = rows.find((r) => (r.keys?.[0] || '').toUpperCase() === devName.toUpperCase());
    return {
      clicks: row?.clicks || 0,
      impressions: row?.impressions || 0,
      ctr: row?.ctr ? (row.ctr * 100).toFixed(2) + '%' : '0.00%',
      position: row?.position ? Math.round(row.position * 10) / 10 : 0,
    };
  };

  const desktopCurr = mapDevice(cRows, 'DESKTOP');
  const desktopPrev = mapDevice(pRows, 'DESKTOP');

  const mobileCurr = mapDevice(cRows, 'MOBILE');
  const mobilePrev = mapDevice(pRows, 'MOBILE');

  const tabletCurr = mapDevice(cRows, 'TABLET');
  const tabletPrev = mapDevice(pRows, 'TABLET');

  return {
    desktop: {
      current: desktopCurr.clicks,
      previous: desktopPrev.clicks,
      diffPct: calcDiff(desktopCurr.clicks, desktopPrev.clicks),
      improvement: desktopCurr.clicks >= desktopPrev.clicks,
      impressions: desktopCurr.impressions,
      prevImpressions: desktopPrev.impressions,
      diffImpressions: calcDiff(desktopCurr.impressions, desktopPrev.impressions),
    },
    mobile: {
      current: mobileCurr.clicks,
      previous: mobilePrev.clicks,
      diffPct: calcDiff(mobileCurr.clicks, mobilePrev.clicks),
      improvement: mobileCurr.clicks >= mobilePrev.clicks,
      impressions: mobileCurr.impressions,
      prevImpressions: mobilePrev.impressions,
      diffImpressions: calcDiff(mobileCurr.impressions, mobilePrev.impressions),
    },
    tablet: {
      current: tabletCurr.clicks,
      previous: tabletPrev.clicks,
      diffPct: calcDiff(tabletCurr.clicks, tabletPrev.clicks),
      improvement: tabletCurr.clicks >= tabletPrev.clicks,
      impressions: tabletCurr.impressions,
      prevImpressions: tabletPrev.impressions,
      diffImpressions: calcDiff(tabletCurr.impressions, tabletPrev.impressions),
    },
  };
};

/**
 * List verified sites in the authenticated user's Search Console
 */
export const listGscSites = async (auth) => {
  if (!auth) throw new Error('Not authenticated with Google');
  const searchconsole = google.searchconsole({ version: 'v1', auth });
  const response = await searchconsole.sites.list();
  return response.data.siteEntry || [];
};
