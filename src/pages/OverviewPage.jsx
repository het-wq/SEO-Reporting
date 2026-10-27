import React from 'react';
import {
  Globe, Search, Smartphone, Tag, TrendingUp, TrendingDown,
  Lightbulb, Target, Clock, CalendarClock, AlertTriangle, KeyRound,
} from 'lucide-react';
import SectionCard from '@/components/dashboard/SectionCard';
import MetricBox from '@/components/MetricBox';
import ComparisonBarChart from '@/components/charts/ComparisonBarChart';
import NoReportData from '@/components/dashboard/NoReportData';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useReport } from '@/context/ReportContext';
import { getGoogleAuthUrl } from '@/services/liveSeoApi';

export default function OverviewPage() {
  const { report, loading, selectedPeriod, previousPeriod, comparisonLabel } = useReport();

  if (loading && !report) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!report) {
    return <NoReportData />;
  }

  const { traffic, searchConsole, brandQueries, deviceClicks, executiveInsights, sources } = report;

  const ga4Source = sources?.ga4;
  const gscSource = sources?.gsc;
  const isAnyLiveConnected = Boolean(ga4Source?.connected || gscSource?.connected);
  const hasAuthError = !isAnyLiveConnected && Boolean(ga4Source?.error || gscSource?.error);

  const prevLabel = previousPeriod?.label || 'Previous Period';
  const curLabel = selectedPeriod?.label || 'Selected Period';

  const kpis = [
    { key: 'overall', label: 'Total Website Visits', m: traffic?.overall || { current: 0, previous: 0, diffPct: 0 } },
    { key: 'organic', label: 'Organic Visits', m: traffic?.organic || { current: 0, previous: 0, diffPct: 0 } },
    { key: 'direct', label: 'Direct Visits', m: traffic?.direct || { current: 0, previous: 0, diffPct: 0 } },
    { key: 'newUsers', label: 'Organic New Users', m: traffic?.organicNewUsers || { current: 0, previous: 0, diffPct: 0 } },
    { key: 'clicks', label: 'GSC Clicks', m: searchConsole?.clicks || { current: 0, previous: 0, diffPct: 0 } },
    { key: 'impressions', label: 'Search Impressions', m: searchConsole?.impressions || { current: 0, previous: 0, diffPct: 0 } },
    {
      key: 'ctr',
      label: 'Average CTR',
      m: {
        current: searchConsole?.avgCtr?.currentText || `${Number(searchConsole?.avgCtr?.current || 0).toFixed(2)}%`,
        previous: searchConsole?.avgCtr?.previousText || `${Number(searchConsole?.avgCtr?.previous || 0).toFixed(2)}%`,
        diffPct: searchConsole?.avgCtr?.diffPct ?? 0,
      },
    },
    {
      key: 'position',
      label: 'Average Position',
      m: {
        current: searchConsole?.avgPosition?.currentText || (searchConsole?.avgPosition?.current || 0).toFixed(1),
        previous: searchConsole?.avgPosition?.previousText || (searchConsole?.avgPosition?.previous || 0).toFixed(1),
        diffPct: searchConsole?.avgPosition?.diffPct ?? 0,
        improvement: searchConsole?.avgPosition?.improvement,
      },
      invertColor: true,
    },
  ];

  const trafficChartData = [
    { name: 'Overall', previous: traffic?.overall?.previous || 0, current: traffic?.overall?.current || 0 },
    { name: 'Organic', previous: traffic?.organic?.previous || 0, current: traffic?.organic?.current || 0 },
    { name: 'Direct', previous: traffic?.direct?.previous || 0, current: traffic?.direct?.current || 0 },
    { name: 'New Users', previous: traffic?.organicNewUsers?.previous || 0, current: traffic?.organicNewUsers?.current || 0 },
  ];

  const gscChartData = [
    { name: 'Clicks', previous: searchConsole?.clicks?.previous || 0, current: searchConsole?.clicks?.current || 0 },
    { name: 'Impressions', previous: searchConsole?.impressions?.previous || 0, current: searchConsole?.impressions?.current || 0 },
  ];

  const deviceChartData = [
    { name: 'Desktop', previous: deviceClicks?.desktop?.previous || 0, current: deviceClicks?.desktop?.current || 0 },
    { name: 'Mobile', previous: deviceClicks?.mobile?.previous || 0, current: deviceClicks?.mobile?.current || 0 },
  ];

  const brandChartData = [
    { name: 'Brand Clicks', previous: brandQueries?.all?.brandClicks?.previous || 0, current: brandQueries?.all?.brandClicks?.current || 0 },
    { name: 'Non-Brand Clicks', previous: brandQueries?.all?.nonBrandClicks?.previous || 0, current: brandQueries?.all?.nonBrandClicks?.current || 0 },
  ];

  return (
    <div className="space-y-6">
      {hasAuthError && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/95 p-4 shadow-sm text-amber-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-amber-900">Google API Authorization or Permission Required</h3>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                {gscSource?.error?.includes('permission') || ga4Source?.error?.includes('permission')
                  ? `Your connected Google account does not have permission for Google Search Console property "${gscSource?.siteUrl || 'https://boulderdecisions.com/'}" or GA4 property "${ga4Source?.propertyId || 'Boulder Decision GA4'}". Please ensure your Google account is added as a user or owner in GSC/GA4.`
                  : `Unable to fetch live metrics: ${gscSource?.error || ga4Source?.error || 'Authentication credentials required'}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={async () => {
                try {
                  const data = await getGoogleAuthUrl();
                  if (data.url) window.location.href = data.url;
                } catch (e) {
                  alert(e.message || 'Failed to start Google OAuth');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-600 text-white hover:bg-amber-700 shadow-sm transition-colors cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Switch / Reconnect Account
            </button>
          </div>
        </div>
      )}

      <SectionCard
        icon={TrendingUp}
        title="Performance at a Glance"
        subtitle={comparisonLabel || `${curLabel} vs ${prevLabel}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[11px] font-medium ${
                isAnyLiveConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isAnyLiveConnected ? 'Live APIs Connected' : 'Google Authorization Needed'}
            </Badge>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {kpis.map((k) => (
            <MetricBox
              key={k.key}
              title={k.label}
              value={typeof k.m.current === 'number' ? k.m.current.toLocaleString() : k.m.current}
              previousValue={typeof k.m.previous === 'number' ? k.m.previous.toLocaleString() : k.m.previous}
              diff={k.m.diffPct}
              improvement={k.m.improvement}
              invertColor={k.invertColor}
              subtitle={k.key === 'position' ? (k.m.improvement ? 'Ranking position improved' : 'Ranking position dropped') : undefined}
            />
          ))}
        </div>

        {traffic?.timeOnSiteOrganic && (
          <div className="mt-4 flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
            <div className="h-9 w-9 rounded-md bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500">Organic Engagement Duration (Time on Site)</p>
              <p className="text-sm text-slate-900">
                <span className="font-semibold">{traffic.timeOnSiteOrganic.previous}</span>
                <span className="text-slate-400 mx-1.5">→</span>
                <span className="font-semibold">{traffic.timeOnSiteOrganic.current}</span>
              </p>
            </div>
            <Badge variant={traffic.timeOnSiteOrganic.improvement ? 'success' : 'secondary'} className="font-medium">
              <TrendingUp className="h-3 w-3" /> {traffic.timeOnSiteOrganic.diffPct > 0 ? '+' : ''}{traffic.timeOnSiteOrganic.diffPct}%
            </Badge>
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          icon={Globe}
          title="Website Traffic Comparison"
          subtitle="Google Analytics 4 - Sessions & User Acquisition"
        >
          <ComparisonBarChart
            data={trafficChartData}
            previousLabel={prevLabel}
            currentLabel={curLabel}
          />
        </SectionCard>

        <SectionCard
          icon={Search}
          title="Search Clicks & Impressions"
          subtitle="Google Search Console - Impressions run on a separate scale"
        >
          <div className="grid grid-cols-2 gap-4">
            <ComparisonBarChart
              data={[gscChartData[0]]}
              height={260}
              previousLabel={prevLabel}
              currentLabel={curLabel}
            />
            <ComparisonBarChart
              data={[gscChartData[1]]}
              height={260}
              previousLabel={prevLabel}
              currentLabel={curLabel}
            />
          </div>
        </SectionCard>

        <SectionCard
          icon={Smartphone}
          title="Device-Based Search Clicks"
          subtitle="Google Search Console - Desktop vs Mobile Clicks"
        >
          <ComparisonBarChart
            data={deviceChartData}
            currentColor="#0ea5e9"
            previousLabel={prevLabel}
            currentLabel={curLabel}
          />
        </SectionCard>

        <SectionCard
          icon={Tag}
          title="Brand vs Non-Brand Performance (All Devices)"
          subtitle="Calculated dynamically from live Search Console search queries"
        >
          <ComparisonBarChart
            data={brandChartData}
            currentColor="#7c3aed"
            previousLabel={prevLabel}
            currentLabel={curLabel}
          />
        </SectionCard>
      </div>

      {executiveInsights && (
        <SectionCard icon={Lightbulb} iconClassName="bg-amber-50 text-amber-600" title="Performance Insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Performance Highlights (Live API Trends)</p>
              <ul className="space-y-1.5">
                {(executiveInsights.hits || []).map((h, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-4 mb-2">Measured Observations</p>
              <ul className="space-y-1.5">
                {(executiveInsights.observations || []).map((h, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <TrendingDown className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Analysis Hypotheses</p>
              <ul className="space-y-1.5">
                {(executiveInsights.hypotheses || []).map((h, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              {executiveInsights.googleUpdate && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5">
                  <CalendarClock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    <span className="font-semibold">{executiveInsights.googleUpdate.name}</span>:
                    {' '}{executiveInsights.googleUpdate.status}.
                  </p>
                </div>
              )}
            </div>
          </div>

          {executiveInsights.octoberPriorities && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" /> Next SEO Priorities
              </p>
              <ol className="space-y-1.5 list-decimal list-inside">
                {executiveInsights.octoberPriorities.map((p, i) => (
                  <li key={i} className="text-sm text-slate-700">{p}</li>
                ))}
              </ol>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
