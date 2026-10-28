import React, { useState } from 'react';
import {
  MapPin,
  Settings,
  ExternalLink,
  KeyRound,
  CheckCircle2,
  Phone,
  Navigation,
  Globe,
  Search,
  Eye,
  RotateCcw,
  Sparkles,
  Smartphone,
  Monitor,
  TrendingUp,
} from 'lucide-react';
import SectionCard from '@/components/dashboard/SectionCard';
import NoReportData from '@/components/dashboard/NoReportData';
import MetricBox from '@/components/MetricBox';
import ComparisonBarChart from '@/components/charts/ComparisonBarChart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useReport } from '@/context/ReportContext';
import { getGoogleAuthUrl } from '@/services/liveSeoApi';

export default function LocalSeoPage() {
  const { report, loading, selectedPeriod, previousPeriod } = useReport();
  const [reauthorizing, setReauthorizing] = useState(false);

  if (loading && !report) return <Skeleton className="h-96" />;
  if (!report) return <NoReportData />;

  const localSeo = report.localSeo || { configured: false, connected: false };
  const prevLabel = previousPeriod?.label || 'Previous Period';
  const curLabel = selectedPeriod?.label || 'Selected Period';

  const navigateToSettings = () => {
    const navBtn = document.querySelector('[data-page="settings"]');
    if (navBtn) navBtn.click();
  };

  const navigateToKeywords = () => {
    const navBtn = document.querySelector('[data-page="keywords"]');
    if (navBtn) navBtn.click();
  };

  const handleStartGoogleOAuth = async () => {
    try {
      setReauthorizing(true);
      const data = await getGoogleAuthUrl();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      alert(e.message || 'Failed to start Google OAuth flow');
      setReauthorizing(false);
    }
  };

  const metrics = localSeo.metrics || {
    totalImpressions: { current: 0, previous: 0, diffPct: 0, improvement: null },
    mapsImpressions: { current: 0, previous: 0, diffPct: 0, improvement: null },
    searchImpressions: { current: 0, previous: 0, diffPct: 0, improvement: null },
    websiteClicks: { current: 0, previous: 0, diffPct: 0, improvement: null },
    callClicks: { current: 0, previous: 0, diffPct: 0, improvement: null },
    directionRequests: { current: 0, previous: 0, diffPct: 0, improvement: null },
  };

  const deviceSplit = localSeo.deviceSplit || {
    desktopMaps: 0,
    desktopSearch: 0,
    mobileMaps: 0,
    mobileSearch: 0,
  };

  const location = localSeo.location || {};

  // Format daily trends for ComparisonBarChart
  const chartData = (localSeo.dailyTrends || []).map((t) => ({
    date: t.date?.slice(5) || t.date,
    'Maps & Search Views': t.impressions || 0,
    'Customer Actions': (t.websiteClicks || 0) + (t.callClicks || 0) + (t.directionRequests || 0),
  }));

  const totalDeviceViews =
    (deviceSplit.desktopMaps || 0) +
    (deviceSplit.mobileMaps || 0) +
    (deviceSplit.desktopSearch || 0) +
    (deviceSplit.mobileSearch || 0) || 1;

  const totalActions =
    (metrics.websiteClicks?.current || 0) +
    (metrics.callClicks?.current || 0) +
    (metrics.directionRequests?.current || 0) || 1;

  return (
    <div className="space-y-6">
      {/* 1. STATE: Re-authorization Required (Google Business Profile API added to project) */}
      {localSeo.requiresReauth && (
        <Card className="border-2 border-emerald-300 bg-emerald-50/50 shadow-sm animate-in fade-in-0 duration-200">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-[#14532D] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">
                      Google Business Profile Performance API Detected
                    </h3>
                    <Badge variant="success" className="text-[10px]">
                      Cloud API Active
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                    You have enabled the <strong>Google Business Profile Performance API</strong> in your Google Cloud Project. To grant your active login session permissions to stream live Google Maps views, calls, and direction clicks, please re-authorize with Google.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  onClick={handleStartGoogleOAuth}
                  disabled={reauthorizing}
                  className="bg-[#14532D] hover:bg-[#1B6B45] text-white gap-2 text-xs font-semibold shadow-xs"
                >
                  <img
                    src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                    alt="Google"
                    className="h-4 w-4"
                  />
                  <span>{reauthorizing ? 'Connecting...' : 'Re-authorize Google Account'}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigateToSettings}
                  className="text-xs bg-white text-slate-700"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Settings</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. STATE: Connected & Streaming Metrics */}
      {localSeo.connected && (
        <div className="space-y-6 animate-in fade-in-0 duration-150">
          {/* Main Section Header Card */}
          <SectionCard
            icon={MapPin}
            title="Google Business Profile & Local Search Visibility"
            subtitle={`${curLabel} vs ${prevLabel} - Real-time metrics from Google Maps & Search profile`}
            actions={
              <div className="flex items-center gap-2 flex-wrap">
                {location.title && (
                  <Badge variant="outline" className="text-xs font-medium text-slate-700 bg-white">
                    📍 {location.title}
                  </Badge>
                )}
                <Badge variant="success" className="text-xs">
                  Connected: Google Business Profile API
                </Badge>
              </div>
            }
          >
            {/* 5 KPI Metric Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              <MetricBox
                title="Google Maps Impressions"
                value={metrics.mapsImpressions?.current?.toLocaleString() || '0'}
                previousValue={metrics.mapsImpressions?.previous?.toLocaleString() || '0'}
                diff={metrics.mapsImpressions?.diffPct}
                improvement={metrics.mapsImpressions?.improvement}
                subtitle="Views on Google Maps app & web"
              />
              <MetricBox
                title="Google Search Impressions"
                value={metrics.searchImpressions?.current?.toLocaleString() || '0'}
                previousValue={metrics.searchImpressions?.previous?.toLocaleString() || '0'}
                diff={metrics.searchImpressions?.diffPct}
                improvement={metrics.searchImpressions?.improvement}
                subtitle="Knowledge Panel search views"
              />
              <MetricBox
                title="Website Clicks"
                value={metrics.websiteClicks?.current?.toLocaleString() || '0'}
                previousValue={metrics.websiteClicks?.previous?.toLocaleString() || '0'}
                diff={metrics.websiteClicks?.diffPct}
                improvement={metrics.websiteClicks?.improvement}
                subtitle="Visitors routed from Profile"
              />
              <MetricBox
                title="Customer Phone Calls"
                value={metrics.callClicks?.current?.toLocaleString() || '0'}
                previousValue={metrics.callClicks?.previous?.toLocaleString() || '0'}
                diff={metrics.callClicks?.diffPct}
                improvement={metrics.callClicks?.improvement}
                subtitle="Call button clicks on profile"
              />
              <MetricBox
                title="Direction Requests"
                value={metrics.directionRequests?.current?.toLocaleString() || '0'}
                previousValue={metrics.directionRequests?.previous?.toLocaleString() || '0'}
                diff={metrics.directionRequests?.diffPct}
                improvement={metrics.directionRequests?.improvement}
                subtitle="Route requests to business"
              />
            </div>
          </SectionCard>

          {/* Daily Trends Chart */}
          {chartData.length > 0 && (
            <SectionCard
              icon={TrendingUp}
              title="Daily Business Profile Visibility & Customer Actions"
              subtitle="Daily profile impressions on Maps/Search vs customer actions"
            >
              <ComparisonBarChart
                data={chartData}
                bars={[
                  { dataKey: 'Maps & Search Views', name: 'Profile Views', color: '#14532D' },
                  { dataKey: 'Customer Actions', name: 'Customer Actions', color: '#1B6B45' },
                ]}
                valueFormatter={(v) => Number(v || 0).toLocaleString()}
              />
            </SectionCard>
          )}

          {/* 2 Breakdown Cards: Platform & Interactions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Platform & Device Distribution */}
            <Card className="border-slate-200 shadow-xs bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-[#14532D]" />
                    <CardTitle className="text-sm font-bold text-slate-900">
                      Platform &amp; Device Split
                    </CardTitle>
                  </div>
                  <span className="text-xs text-slate-400">Google Telemetry</span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-slate-500" /> Mobile Maps
                    </span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {(deviceSplit.mobileMaps || 0).toLocaleString()} (
                      {Math.round(((deviceSplit.mobileMaps || 0) / totalDeviceViews) * 100)}%)
                    </span>
                  </div>
                  <Progress value={Math.round(((deviceSplit.mobileMaps || 0) / totalDeviceViews) * 100)} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-slate-500" /> Mobile Search
                    </span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {(deviceSplit.mobileSearch || 0).toLocaleString()} (
                      {Math.round(((deviceSplit.mobileSearch || 0) / totalDeviceViews) * 100)}%)
                    </span>
                  </div>
                  <Progress value={Math.round(((deviceSplit.mobileSearch || 0) / totalDeviceViews) * 100)} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <Monitor className="h-3.5 w-3.5 text-slate-500" /> Desktop Search
                    </span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {(deviceSplit.desktopSearch || 0).toLocaleString()} (
                      {Math.round(((deviceSplit.desktopSearch || 0) / totalDeviceViews) * 100)}%)
                    </span>
                  </div>
                  <Progress value={Math.round(((deviceSplit.desktopSearch || 0) / totalDeviceViews) * 100)} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <Monitor className="h-3.5 w-3.5 text-slate-500" /> Desktop Maps
                    </span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {(deviceSplit.desktopMaps || 0).toLocaleString()} (
                      {Math.round(((deviceSplit.desktopMaps || 0) / totalDeviceViews) * 100)}%)
                    </span>
                  </div>
                  <Progress value={Math.round(((deviceSplit.desktopMaps || 0) / totalDeviceViews) * 100)} />
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Customer Actions Breakdown */}
            <Card className="border-slate-200 shadow-xs bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-[#14532D]" />
                    <CardTitle className="text-sm font-bold text-slate-900">
                      Customer Actions Breakdown
                    </CardTitle>
                  </div>
                  <span className="text-xs text-slate-400">Total: {totalActions.toLocaleString()}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-[#14532D]" /> Website Clicks
                    </span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {(metrics.websiteClicks?.current || 0).toLocaleString()} (
                      {Math.round(((metrics.websiteClicks?.current || 0) / totalActions) * 100)}%)
                    </span>
                  </div>
                  <Progress value={Math.round(((metrics.websiteClicks?.current || 0) / totalActions) * 100)} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <Navigation className="h-3.5 w-3.5 text-emerald-700" /> Direction Requests
                    </span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {(metrics.directionRequests?.current || 0).toLocaleString()} (
                      {Math.round(((metrics.directionRequests?.current || 0) / totalActions) * 100)}%)
                    </span>
                  </div>
                  <Progress value={Math.round(((metrics.directionRequests?.current || 0) / totalActions) * 100)} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-emerald-800" /> Phone Calls
                    </span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {(metrics.callClicks?.current || 0).toLocaleString()} (
                      {Math.round(((metrics.callClicks?.current || 0) / totalActions) * 100)}%)
                    </span>
                  </div>
                  <Progress value={Math.round(((metrics.callClicks?.current || 0) / totalActions) * 100)} />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Action Conversion Rate:</span>
                  <span className="font-bold text-[#14532D]">
                    {Math.round(
                      (totalActions / (metrics.totalImpressions?.current || 1)) * 1000
                    ) / 10}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Connected Profile Details */}
          <Card className="border-slate-200 shadow-xs bg-slate-50/50">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-100 text-[#14532D] flex items-center justify-center font-bold shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{location.title || 'Boulder Decisions'}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate max-w-md">
                    {location.name || 'Verified Google Business Location'} • API: businessprofileperformance.googleapis.com
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://business.google.com/locations"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#14532D] hover:underline font-semibold bg-white border border-emerald-200 px-3 py-1.5 rounded-lg shadow-2xs"
                >
                  <span>Google Business Profile Manager</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. STATE: Location Setup Needed or Not Connected */}
      {!localSeo.connected && !localSeo.requiresReauth && (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none my-2">
          <CardContent className="py-10 px-6 max-w-2xl mx-auto text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-emerald-50 text-[#14532D] flex items-center justify-center mx-auto ring-8 ring-emerald-50/60">
              <MapPin className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">
                {localSeo.locationSetupNeeded
                  ? 'Google Business Profile Connected'
                  : 'Google Business Profile Performance & Local SEO'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
                {localSeo.description ||
                  'The Google Business Profile Performance API retrieves real customer interactions (Google Maps impressions, Search impressions, website visits, phone calls, and direction requests) directly from your verified Google Business Profile.'}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white border border-slate-200 text-left space-y-2 text-xs">
              <p className="font-semibold text-slate-800">Supported Local Data Sources:</p>
              <ul className="space-y-1.5 text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#14532D] shrink-0" />
                  <span>
                    <strong>Google Business Profile Performance API:</strong> Live telemetry on Google Maps impressions, Search profile views, calls, and directions.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#14532D] shrink-0" />
                  <span>
                    <strong>Google Search Console:</strong> Verified organic search rankings for local business queries are actively tracked.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#14532D] shrink-0" />
                  <span>
                    <strong>BrightLocal API v4:</strong> Automates local 3x3 geo-grid ranking scans across targeted service areas.
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <Button
                onClick={handleStartGoogleOAuth}
                className="gap-2 text-xs font-semibold bg-[#14532D] hover:bg-[#1B6B45] text-white"
              >
                <img
                  src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                  alt="Google"
                  className="h-4 w-4"
                />
                <span>Connect Google Business Profile</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={navigateToSettings}
                className="gap-1.5 text-xs font-semibold bg-white text-slate-700"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Configure in Settings</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={navigateToKeywords}
                className="gap-1.5 text-xs bg-white text-slate-700"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>View Local Search Queries</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
