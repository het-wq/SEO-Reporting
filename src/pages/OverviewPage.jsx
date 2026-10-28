import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe, Search, Smartphone, Tag, TrendingUp, TrendingDown,
  Lightbulb, Target, Clock, CalendarClock, AlertTriangle, KeyRound,
  Link2, CheckCircle2, Calendar, Layers, ExternalLink, ArrowRight, ListChecks,
} from 'lucide-react';
import SectionCard from '@/components/dashboard/SectionCard';
import MetricBox from '@/components/MetricBox';
import ComparisonBarChart from '@/components/charts/ComparisonBarChart';
import NoReportData from '@/components/dashboard/NoReportData';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { useReport } from '@/context/ReportContext';
import { getGoogleAuthUrl } from '@/services/liveSeoApi';
import {
  getStoredBacklinks,
  calculateBacklinkStats,
  BACKLINK_CATEGORIES,
} from '@/lib/backlinksData';
import {
  getStoredActivities,
  calculateActivityStats,
  ACTIVITY_CATEGORIES,
} from '@/lib/activitiesData';

export default function OverviewPage({ onNavigate }) {
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

  // Backlinks & SEO Activities State for Overview Section
  const [backlinks, setBacklinks] = useState(() => getStoredBacklinks());
  const [activities, setActivities] = useState(() => getStoredActivities());
  const [overviewTab, setOverviewTab] = useState('backlinks'); // 'backlinks' | 'activities'
  const [overviewCategoryView, setOverviewCategoryView] = useState('all'); // 'all' | 'active'

  useEffect(() => {
    const handleBacklinksUpdate = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setBacklinks(e.detail);
      } else {
        setBacklinks(getStoredBacklinks());
      }
    };
    const handleActivitiesUpdate = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setActivities(e.detail);
      } else {
        setActivities(getStoredActivities());
      }
    };
    window.addEventListener('backlinks-updated', handleBacklinksUpdate);
    window.addEventListener('activities-updated', handleActivitiesUpdate);
    window.addEventListener('storage', handleBacklinksUpdate);
    window.addEventListener('storage', handleActivitiesUpdate);
    return () => {
      window.removeEventListener('backlinks-updated', handleBacklinksUpdate);
      window.removeEventListener('activities-updated', handleActivitiesUpdate);
      window.removeEventListener('storage', handleBacklinksUpdate);
      window.removeEventListener('storage', handleActivitiesUpdate);
    };
  }, []);

  const {
    total: totalBacklinks,
    live: liveBacklinks,
    inProgress: inProgressBacklinks,
    planned: plannedBacklinks,
    avgDa: backlinkAvgDa,
    categoryCards: backlinkCategoryCards,
  } = useMemo(() => calculateBacklinkStats(backlinks), [backlinks]);

  const {
    total: totalActivities,
    completed: completedActivities,
    inProgress: inProgressActivities,
    planned: plannedActivities,
    categoryCards: activityCategoryCards,
  } = useMemo(() => calculateActivityStats(activities), [activities]);

  const currentCategoryCards = overviewTab === 'backlinks' ? backlinkCategoryCards : activityCategoryCards;

  const activeCategoriesCount = useMemo(
    () => currentCategoryCards.filter((c) => c.count > 0).length,
    [currentCategoryCards]
  );

  const displayedCategoryCards = useMemo(() => {
    if (overviewCategoryView === 'active') {
      return currentCategoryCards.filter((c) => c.count > 0);
    }
    return currentCategoryCards;
  }, [currentCategoryCards, overviewCategoryView]);

  const topBacklinks = useMemo(() => {
    return [...backlinks]
      .sort((a, b) => (Number(b.da) || 0) - (Number(a.da) || 0))
      .slice(0, 5);
  }, [backlinks]);

  const recentActivities = useMemo(() => {
    return [...activities].slice(0, 5);
  }, [activities]);

  const handleNavigateToActivities = () => {
    if (onNavigate) {
      onNavigate('seo-activities');
    } else {
      window.dispatchEvent(new CustomEvent('navigate-to-page', { detail: 'seo-activities' }));
    }
  };

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
            currentColor="#14532D"
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
            currentColor="#14532D"
            previousLabel={prevLabel}
            currentLabel={curLabel}
          />
        </SectionCard>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: BACKLINKS & SEO ACTIVITIES (User requested showcase on Overview)  */}
      {/* ========================================================================= */}
      <SectionCard
        icon={overviewTab === 'backlinks' ? Link2 : ListChecks}
        iconClassName={overviewTab === 'backlinks' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}
        title="SEO Activities & Backlinks Submissions"
        subtitle={`${totalBacklinks} Total Backlinks • ${totalActivities} Recorded SEO Campaigns & Tasks`}
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={handleNavigateToActivities}
            className="h-8 text-xs gap-1.5 font-semibold text-slate-800 hover:text-slate-950 bg-white hover:bg-slate-50 border-slate-200 shadow-2xs cursor-pointer"
          >
            <span>Manage in SEO Activities</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        }
      >
        {/* Primary Tab Switcher & View Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-200/80">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/90 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setOverviewTab('backlinks')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                overviewTab === 'backlinks'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>Backlink Submissions ({totalBacklinks})</span>
            </button>
            <button
              type="button"
              onClick={() => setOverviewTab('activities')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                overviewTab === 'activities'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListChecks className="h-3.5 w-3.5" />
              <span>SEO Activities ({totalActivities})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              {activeCategoriesCount} Active of {currentCategoryCards.length} Categories
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setOverviewCategoryView('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  overviewCategoryView === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({currentCategoryCards.length})
              </button>
              <button
                type="button"
                onClick={() => setOverviewCategoryView('active')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  overviewCategoryView === 'active'
                    ? overviewTab === 'backlinks'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'bg-white text-blue-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Only ({activeCategoriesCount})
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic KPI Strip */}
        {overviewTab === 'backlinks' ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center sm:text-left">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Total Backlinks</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{totalBacklinks}</span>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 text-center sm:text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider block">Live / Indexed</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 hidden sm:inline" />
              </div>
              <span className="text-xl font-bold text-emerald-900 mt-1 block">{liveBacklinks}</span>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 text-center sm:text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-blue-800 uppercase tracking-wider block">In Progress</span>
                <Clock className="h-3.5 w-3.5 text-blue-600 hidden sm:inline" />
              </div>
              <span className="text-xl font-bold text-blue-900 mt-1 block">{inProgressBacklinks}</span>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 text-center sm:text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-amber-800 uppercase tracking-wider block">Planned</span>
                <Calendar className="h-3.5 w-3.5 text-amber-600 hidden sm:inline" />
              </div>
              <span className="text-xl font-bold text-amber-900 mt-1 block">{plannedBacklinks}</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center sm:text-left col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Average DA</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                {backlinkAvgDa !== '—' ? `DA ${backlinkAvgDa}` : '—'}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center sm:text-left">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Total Activities</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{totalActivities}</span>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 text-center sm:text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider block">Completed</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 hidden sm:inline" />
              </div>
              <span className="text-xl font-bold text-emerald-900 mt-1 block">{completedActivities}</span>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 text-center sm:text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-blue-800 uppercase tracking-wider block">In Progress</span>
                <Clock className="h-3.5 w-3.5 text-blue-600 hidden sm:inline" />
              </div>
              <span className="text-xl font-bold text-blue-900 mt-1 block">{inProgressActivities}</span>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 text-center sm:text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-amber-800 uppercase tracking-wider block">Planned</span>
                <Calendar className="h-3.5 w-3.5 text-amber-600 hidden sm:inline" />
              </div>
              <span className="text-xl font-bold text-amber-900 mt-1 block">{plannedActivities}</span>
            </div>
          </div>
        )}

        {/* Category Breakdown Boxes (No graph, box view with number and name) */}
        <div className="pt-2">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className={`h-4 w-4 ${overviewTab === 'backlinks' ? 'text-emerald-600' : 'text-blue-600'}`} />
              {overviewTab === 'backlinks' ? 'Backlink Categories Breakdown' : 'SEO Activity Categories Breakdown'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {displayedCategoryCards.map((cat) => (
              <div
                key={cat.name}
                onClick={handleNavigateToActivities}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between select-none relative group ${
                  cat.count > 0
                    ? overviewTab === 'backlinks'
                      ? 'border-emerald-200/90 bg-white hover:border-emerald-400 hover:shadow-xs'
                      : 'border-blue-200/90 bg-white hover:border-blue-400 hover:shadow-xs'
                    : 'border-slate-200/70 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                }`}
                title={`Click to view ${cat.name} in SEO Activities`}
              >
                {cat.count > 0 && (
                  <span
                    className={`absolute top-2 right-2 h-2 w-2 rounded-full ${
                      overviewTab === 'backlinks' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                  />
                )}
                <p
                  className={`text-2xl font-black tracking-tight ${
                    cat.count > 0
                      ? overviewTab === 'backlinks'
                        ? 'text-emerald-600'
                        : 'text-blue-600'
                      : 'text-slate-400'
                  }`}
                >
                  {cat.count}
                </p>
                <p
                  className={`text-[11px] font-semibold mt-1.5 leading-tight line-clamp-2 ${
                    cat.count > 0
                      ? 'text-slate-800 group-hover:text-slate-950 font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  {cat.name}
                </p>
              </div>
            ))}
          </div>

          {displayedCategoryCards.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-xs">
              No categories have active entries in this view. Switch to &quot;All&quot; to view all available categories.
            </div>
          )}
        </div>

        {/* Dynamic Table Preview */}
        {overviewTab === 'backlinks' && topBacklinks.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Top Authority Backlink Placements
              </span>
              <button
                type="button"
                onClick={handleNavigateToActivities}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer inline-flex items-center gap-1"
              >
                <span>View all backlinks ({totalBacklinks})</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="rounded-lg border border-slate-200 overflow-x-auto bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 text-xs">
                    <TableHead className="w-14">Status</TableHead>
                    <TableHead>Referring Source &amp; Anchor</TableHead>
                    <TableHead className="w-40">Category</TableHead>
                    <TableHead className="w-20 text-center">DA</TableHead>
                    <TableHead className="w-24 text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topBacklinks.map((b) => (
                    <TableRow key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <TableCell>
                        {b.status === 'Live / Indexed' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : b.status === 'In Progress' ? (
                          <Clock className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Calendar className="h-4 w-4 text-amber-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <a
                            href={b.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-blue-600 hover:underline text-xs inline-flex items-center gap-1 break-all"
                          >
                            <span>{b.sourceUrl}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                          {b.anchorText && (
                            <p className="text-[11px] text-slate-500">
                              Anchor: <span className="font-medium text-slate-700">&ldquo;{b.anchorText}&rdquo;</span>
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] font-medium text-slate-700 border-slate-200">
                          {b.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {b.da !== null && b.da !== undefined ? (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold ${
                            b.da >= 80
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : b.da >= 50
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            DA {b.da}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono text-right">{b.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {overviewTab === 'activities' && recentActivities.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent SEO Activities &amp; Tasks
              </span>
              <button
                type="button"
                onClick={handleNavigateToActivities}
                className="text-xs text-blue-700 hover:text-blue-800 font-semibold cursor-pointer inline-flex items-center gap-1"
              >
                <span>View all activities ({totalActivities})</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="rounded-lg border border-slate-200 overflow-x-auto bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 text-xs">
                    <TableHead className="w-14">Status</TableHead>
                    <TableHead>Activity &amp; Notes</TableHead>
                    <TableHead className="w-40">Category</TableHead>
                    <TableHead className="w-20 text-center">Priority</TableHead>
                    <TableHead className="w-24 text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivities.map((a) => (
                    <TableRow key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      <TableCell>
                        {a.status === 'Completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : a.status === 'In Progress' ? (
                          <Clock className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Calendar className="h-4 w-4 text-amber-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900 text-xs">{a.title}</p>
                          {a.notes && <p className="text-[11px] text-slate-500">{a.notes}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] font-medium text-slate-700 border-slate-200">
                          {a.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={a.priority === 'High' ? 'danger' : a.priority === 'Medium' ? 'warning' : 'secondary'}
                          className="text-[11px] font-medium"
                        >
                          {a.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono text-right">{a.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </SectionCard>

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
