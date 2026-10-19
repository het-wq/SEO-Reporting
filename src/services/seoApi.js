export * from './liveSeoApi';

import {
  getApiConfig,
  checkBackendHealth,
  fetchDashboardLiveReport,
} from './liveSeoApi';

/**
 * Backward compatibility wrapper for old single-page views
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

  try {
    const report = await fetchDashboardLiveReport(dateRangeInfo);
    return {
      connected: true,
      data: {
        ...report,
        gscOverview: report.searchConsole ? [
          { key: 'clicks', label: 'Clicks', current: report.searchConsole.clicks?.current ?? 0, previous: report.searchConsole.clicks?.previous ?? 0, diff: report.searchConsole.clicks?.diffPct ?? 0, unit: '', invertColor: false },
          { key: 'impressions', label: 'Impressions', current: report.searchConsole.impressions?.current ?? 0, previous: report.searchConsole.impressions?.previous ?? 0, diff: report.searchConsole.impressions?.diffPct ?? 0, unit: '', invertColor: false },
          { key: 'ctr', label: 'Avg CTR', current: report.searchConsole.avgCtr?.currentText || '0.00%', previous: report.searchConsole.avgCtr?.previousText || '0.00%', diff: report.searchConsole.avgCtr?.diffPct ?? 0, unit: '', invertColor: false },
          { key: 'position', label: 'Avg Position', current: parseFloat(report.searchConsole.avgPosition?.currentText || 0), previous: parseFloat(report.searchConsole.avgPosition?.previousText || 0), diff: report.searchConsole.avgPosition?.diffPct ?? 0, unit: '', invertColor: true },
        ] : null,
        topKeywords: (report.keywordRankings || []).map((k) => ({
          keyword: k.keyword,
          ranking: k.position,
          clicks: k.clicks,
          impressions: k.impressions,
          ctr: k.ctr,
          status: k.status,
          change: '0',
        })),
        deviceTraffic: [
          { device: 'Desktop', current: report.deviceClicks?.desktop?.current ?? 0, previous: report.deviceClicks?.desktop?.previous ?? 0, diff: report.deviceClicks?.desktop?.diffPct ?? 0 },
          { device: 'Mobile', current: report.deviceClicks?.mobile?.current ?? 0, previous: report.deviceClicks?.mobile?.previous ?? 0, diff: report.deviceClicks?.mobile?.diffPct ?? 0 },
        ],
        gaOverview: report.traffic ? [
          { key: 'overall', label: 'Overall Traffic (Sessions)', current: report.traffic.overall?.current ?? 0, previous: report.traffic.overall?.previous ?? 0, diff: report.traffic.overall?.diffPct ?? 0 },
          { key: 'organic', label: 'Organic Traffic', current: report.traffic.organic?.current ?? 0, previous: report.traffic.organic?.previous ?? 0, diff: report.traffic.organic?.diffPct ?? 0 },
          { key: 'direct', label: 'Direct Traffic', current: report.traffic.direct?.current ?? 0, previous: report.traffic.direct?.previous ?? 0, diff: report.traffic.direct?.diffPct ?? 0 },
          { key: 'organic_new_users', label: 'Organic New Users', current: report.traffic.organicNewUsers?.current ?? 0, previous: report.traffic.organicNewUsers?.previous ?? 0, diff: report.traffic.organicNewUsers?.diffPct ?? 0 },
          { key: 'time_on_site', label: 'Time on site (Avg Duration)', current: report.traffic.timeOnSiteOrganic?.current || '0m 0s', previous: report.traffic.timeOnSiteOrganic?.previous || '0m 0s', diff: report.traffic.timeOnSiteOrganic?.diffPct ?? 0 },
        ] : null,
      },
      error: null,
    };
  } catch (err) {
    return {
      connected: isConnected,
      data: null,
      error: err.message,
    };
  }
};
