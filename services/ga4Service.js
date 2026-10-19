import { google } from 'googleapis';
import { classifyGoogleError } from './googleAuth.js';

const calcDiff = (curr, prev) => {
  if (prev === 0 || !prev) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 10000) / 100;
};

const formatDuration = (seconds) => {
  const s = Math.round(Number(seconds) || 0);
  const mins = Math.floor(s / 60);
  const remSecs = s % 60;
  return `${mins}m ${remSecs}s`;
};

const cleanPropertyId = (propId) => {
  const str = String(propId || '').trim();
  return str.startsWith('properties/') ? str : `properties/${str}`;
};

/**
 * Fetch GA4 Overview report comparing current period vs previous period
 */
export const getGA4Overview = async ({
  auth,
  propertyId,
  startDate,
  endDate,
  prevStartDate,
  prevEndDate,
}) => {
  if (!auth) {
    throw new Error('Not authenticated with Google');
  }
  if (!propertyId) {
    throw new Error('GA4 Property ID is required');
  }

  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
  const property = cleanPropertyId(propertyId);

  // 1. Current period report by channel
  const currentReq = analyticsdata.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'averageSessionDuration' },
        { name: 'engagementRate' },
        { name: 'activeUsers' },
      ],
    },
  });

  // 2. Previous period report by channel (if date range provided)
  const prevReq = (prevStartDate && prevEndDate)
    ? analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: prevStartDate, endDate: prevEndDate }],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'newUsers' },
            { name: 'averageSessionDuration' },
            { name: 'engagementRate' },
            { name: 'activeUsers' },
          ],
        },
      }).catch((e) => {
        console.warn('GA4 previous period query warning:', e.message);
        return { data: { rows: [] } };
      })
    : Promise.resolve({ data: { rows: [] } });

  const [currentRes, prevRes] = await Promise.all([currentReq, prevReq]);

  const cRows = currentRes.data.rows || [];
  const pRows = prevRes.data.rows || [];

  // Parse current period totals
  let totalSessions = 0;
  let totalUsers = 0;
  let activeUsers = 0;
  let newUsers = 0;
  let organicSessions = 0;
  let directSessions = 0;
  let referralSessions = 0;
  let paidSessions = 0;
  let weightedDurationSec = 0;
  let weightedEngagementRate = 0;

  const channelMap = new Map();

  cRows.forEach((r) => {
    const channel = r.dimensionValues?.[0]?.value || 'Unassigned';
    const sessions = parseInt(r.metricValues?.[0]?.value || '0', 10);
    const users = parseInt(r.metricValues?.[1]?.value || '0', 10);
    const nu = parseInt(r.metricValues?.[2]?.value || '0', 10);
    const avgDuration = parseFloat(r.metricValues?.[3]?.value || '0');
    const engRate = parseFloat(r.metricValues?.[4]?.value || '0');
    const au = parseInt(r.metricValues?.[5]?.value || '0', 10);

    totalSessions += sessions;
    totalUsers += users;
    activeUsers += au;
    newUsers += nu;
    weightedDurationSec += avgDuration * sessions;
    weightedEngagementRate += engRate * sessions;

    const lower = channel.toLowerCase();
    if (lower.includes('organic search') || lower === 'organic') {
      organicSessions += sessions;
    } else if (lower.includes('direct')) {
      directSessions += sessions;
    } else if (lower.includes('referral')) {
      referralSessions += sessions;
    } else if (lower.includes('paid search') || lower.includes('cpc') || lower.includes('paid')) {
      paidSessions += sessions;
    }

    channelMap.set(channel, {
      channel,
      currentSessions: sessions,
      currentUsers: users,
      currentNewUsers: nu,
      currentDuration: avgDuration,
      currentEngagementRate: engRate,
      previousSessions: 0,
      previousUsers: 0,
    });
  });

  // Parse previous period totals
  let prevTotalSessions = 0;
  let prevTotalUsers = 0;
  let prevActiveUsers = 0;
  let prevNewUsers = 0;
  let prevOrganicSessions = 0;
  let prevDirectSessions = 0;
  let prevReferralSessions = 0;
  let prevPaidSessions = 0;
  let prevWeightedDurationSec = 0;
  let prevWeightedEngagementRate = 0;

  pRows.forEach((r) => {
    const channel = r.dimensionValues?.[0]?.value || 'Unassigned';
    const sessions = parseInt(r.metricValues?.[0]?.value || '0', 10);
    const users = parseInt(r.metricValues?.[1]?.value || '0', 10);
    const nu = parseInt(r.metricValues?.[2]?.value || '0', 10);
    const avgDuration = parseFloat(r.metricValues?.[3]?.value || '0');
    const engRate = parseFloat(r.metricValues?.[4]?.value || '0');
    const au = parseInt(r.metricValues?.[5]?.value || '0', 10);

    prevTotalSessions += sessions;
    prevTotalUsers += users;
    prevActiveUsers += au;
    prevNewUsers += nu;
    prevWeightedDurationSec += avgDuration * sessions;
    prevWeightedEngagementRate += engRate * sessions;

    const lower = channel.toLowerCase();
    if (lower.includes('organic search') || lower === 'organic') {
      prevOrganicSessions += sessions;
    } else if (lower.includes('direct')) {
      prevDirectSessions += sessions;
    } else if (lower.includes('referral')) {
      prevReferralSessions += sessions;
    } else if (lower.includes('paid search') || lower.includes('cpc') || lower.includes('paid')) {
      prevPaidSessions += sessions;
    }

    const item = channelMap.get(channel) || {
      channel,
      currentSessions: 0,
      currentUsers: 0,
      currentNewUsers: 0,
      currentDuration: 0,
      currentEngagementRate: 0,
    };
    item.previousSessions = sessions;
    item.previousUsers = users;
    channelMap.set(channel, item);
  });

  const avgDurationCurrent = totalSessions > 0 ? Math.round(weightedDurationSec / totalSessions) : 0;
  const avgDurationPrev = prevTotalSessions > 0 ? Math.round(prevWeightedDurationSec / prevTotalSessions) : 0;

  const engagementRateCurrent = totalSessions > 0 ? (weightedEngagementRate / totalSessions) * 100 : 0;
  const engagementRatePrev = prevTotalSessions > 0 ? (prevWeightedEngagementRate / prevTotalSessions) * 100 : 0;

  // Build structured channel acquisition list
  const channelAcquisition = Array.from(channelMap.values())
    .map((c) => ({
      channel: c.channel,
      currentSessions: c.currentSessions,
      previousSessions: c.previousSessions,
      diffSessions: calcDiff(c.currentSessions, c.previousSessions),
      currentUsers: c.currentUsers,
      currentNewUsers: c.currentNewUsers,
      engagementRate: (c.currentEngagementRate * 100).toFixed(1) + '%',
      avgDuration: formatDuration(c.currentDuration),
    }))
    .sort((a, b) => b.currentSessions - a.currentSessions);

  return {
    source: 'Google Analytics 4',
    propertyId,
    dateRange: { startDate, endDate, prevStartDate, prevEndDate },
    hasData: cRows.length > 0,
    totalRows: cRows.length,

    // KPI Summary Metrics
    overall: {
      current: totalSessions,
      previous: prevTotalSessions,
      diffPct: calcDiff(totalSessions, prevTotalSessions),
      improvement: totalSessions >= prevTotalSessions,
      label: 'Total Website Visits (Sessions)',
    },
    totalUsers: {
      current: totalUsers,
      previous: prevTotalUsers,
      diffPct: calcDiff(totalUsers, prevTotalUsers),
      improvement: totalUsers >= prevTotalUsers,
      label: 'Total Users',
    },
    activeUsers: {
      current: activeUsers,
      previous: prevActiveUsers,
      diffPct: calcDiff(activeUsers, prevActiveUsers),
      improvement: activeUsers >= prevActiveUsers,
      label: 'Active Users',
    },
    organic: {
      current: organicSessions,
      previous: prevOrganicSessions,
      diffPct: calcDiff(organicSessions, prevOrganicSessions),
      improvement: organicSessions >= prevOrganicSessions,
      label: 'Organic Search Sessions',
    },
    direct: {
      current: directSessions,
      previous: prevDirectSessions,
      diffPct: calcDiff(directSessions, prevDirectSessions),
      improvement: directSessions >= prevDirectSessions,
      label: 'Direct Visits',
    },
    referral: {
      current: referralSessions,
      previous: prevReferralSessions,
      diffPct: calcDiff(referralSessions, prevReferralSessions),
      improvement: referralSessions >= prevReferralSessions,
      label: 'Referral Visits',
    },
    organicNewUsers: {
      current: newUsers,
      previous: prevNewUsers,
      diffPct: calcDiff(newUsers, prevNewUsers),
      improvement: newUsers >= prevNewUsers,
      label: 'Organic New Users',
    },
    timeOnSiteOrganic: {
      current: formatDuration(avgDurationCurrent),
      previous: formatDuration(avgDurationPrev),
      currentSeconds: avgDurationCurrent,
      previousSeconds: avgDurationPrev,
      diffPct: calcDiff(avgDurationCurrent, avgDurationPrev),
      improvement: avgDurationCurrent >= avgDurationPrev,
      label: 'Average Engagement Duration',
    },
    engagementRate: {
      current: engagementRateCurrent.toFixed(1) + '%',
      previous: engagementRatePrev.toFixed(1) + '%',
      currentValue: engagementRateCurrent,
      previousValue: engagementRatePrev,
      diffPct: Math.round((engagementRateCurrent - engagementRatePrev) * 100) / 100,
      improvement: engagementRateCurrent >= engagementRatePrev,
      label: 'Engagement Rate',
    },

    channelAcquisition,
  };
};

/**
 * Fetch daily traffic trends for charting
 */
export const getGA4TrafficTrends = async ({
  auth,
  propertyId,
  startDate,
  endDate,
}) => {
  if (!auth || !propertyId) return [];

  try {
    const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
    const property = cleanPropertyId(propertyId);

    const response = await analyticsdata.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'screenPageViews' },
        ],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      },
    });

    const rows = response.data.rows || [];
    return rows.map((r) => {
      const rawDate = r.dimensionValues?.[0]?.value || '';
      // rawDate is YYYYMMDD
      const formattedDate = rawDate.length === 8
        ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
        : rawDate;

      return {
        date: formattedDate,
        sessions: parseInt(r.metricValues?.[0]?.value || '0', 10),
        activeUsers: parseInt(r.metricValues?.[1]?.value || '0', 10),
        newUsers: parseInt(r.metricValues?.[2]?.value || '0', 10),
        pageViews: parseInt(r.metricValues?.[3]?.value || '0', 10),
      };
    });
  } catch (err) {
    console.error('GA4 traffic trends error:', err.message);
    return [];
  }
};

/**
 * Fetch top landing pages performance from GA4
 */
export const getGA4LandingPages = async ({
  auth,
  propertyId,
  startDate,
  endDate,
  limit = 25,
}) => {
  if (!auth || !propertyId) return [];

  try {
    const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
    const property = cleanPropertyId(propertyId);

    let response;
    try {
      response = await analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'landingPagePlusQueryString' }],
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'newUsers' },
            { name: 'averageSessionDuration' },
            { name: 'engagementRate' },
          ],
          limit,
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        },
      });
    } catch {
      // Fallback to landingPage dimension if landingPagePlusQueryString not supported
      response = await analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'landingPage' }],
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'newUsers' },
            { name: 'averageSessionDuration' },
            { name: 'engagementRate' },
          ],
          limit,
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        },
      });
    }

    const rows = response.data.rows || [];
    return rows.map((r) => {
      const page = r.dimensionValues?.[0]?.value || '/';
      const sessions = parseInt(r.metricValues?.[0]?.value || '0', 10);
      const activeUsers = parseInt(r.metricValues?.[1]?.value || '0', 10);
      const nu = parseInt(r.metricValues?.[2]?.value || '0', 10);
      const duration = parseFloat(r.metricValues?.[3]?.value || '0');
      const engRate = parseFloat(r.metricValues?.[4]?.value || '0');

      return {
        page,
        sessions,
        activeUsers,
        newUsers: nu,
        duration: formatDuration(duration),
        engagementRate: (engRate * 100).toFixed(1) + '%',
      };
    });
  } catch (err) {
    console.error('GA4 landing pages error:', err.message);
    return [];
  }
};
