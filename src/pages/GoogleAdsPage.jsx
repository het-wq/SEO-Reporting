import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  TrendingUp,
  DollarSign,
  MousePointerClick,
  Eye,
  Target,
  RefreshCw,
  Settings,
  Search,
  Filter,
  Layers,
  Smartphone,
  Monitor,
  Tablet,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Sparkles,
  BarChart3,
  Percent,
} from 'lucide-react';
import SectionCard from '@/components/dashboard/SectionCard';
import MetricBox from '@/components/MetricBox';
import ComparisonBarChart from '@/components/charts/ComparisonBarChart';
import NoReportData from '@/components/dashboard/NoReportData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useReport } from '@/context/ReportContext';
import { getApiConfig, fetchGoogleAdsOverview } from '@/services/liveSeoApi';

export default function GoogleAdsPage({ onNavigate }) {
  const { report, loading, selectedPeriod, previousPeriod, refresh } = useReport();
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'keywords' | 'searchTerms'
  const [searchTerm, setSearchTerm] = useState('');
  const [adsData, setAdsData] = useState(null);
  const [loadingAds, setLoadingAds] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const prevLabel = previousPeriod?.label || 'Previous Period';
  const curLabel = selectedPeriod?.label || 'Selected Period';

  // Load Google Ads data matching the active account & date range
  const loadGoogleAdsData = async () => {
    setLoadingAds(true);
    setFetchError(null);
    try {
      const cfg = getApiConfig();
      const res = await fetchGoogleAdsOverview({
        startDate: selectedPeriod?.startDate,
        endDate: selectedPeriod?.endDate,
        prevStartDate: previousPeriod?.startDate,
        prevEndDate: previousPeriod?.endDate,
        accountName: cfg.selectedAccountName,
        customerId: cfg.googleAdsCustomerId,
        developerToken: cfg.googleAdsDeveloperToken,
      });
      setAdsData(res);
    } catch (err) {
      console.warn('Could not load Google Ads overview:', err.message);
      setFetchError(err.message);
    } finally {
      setLoadingAds(false);
    }
  };

  useEffect(() => {
    // If unified report already loaded googleAds, use it immediately
    if (report?.googleAds) {
      setAdsData(report.googleAds);
    } else {
      loadGoogleAdsData();
    }
  }, [report, selectedPeriod, previousPeriod]);

  const cfg = getApiConfig();
  const activeAccountName = cfg.selectedAccountName || adsData?.accountName || 'Boulder Decision';

  if (loading && !adsData) return <Skeleton className="h-96" />;

  const data = adsData || report?.googleAds || {
    metrics: {
      cost: { current: 0, previous: 0, diffPct: 0 },
      clicks: { current: 0, previous: 0, diffPct: 0 },
      impressions: { current: 0, previous: 0, diffPct: 0 },
      ctr: { current: 0, previous: 0, diffPct: 0 },
      avgCpc: { current: 0, previous: 0, diffPct: 0 },
      conversions: { current: 0, previous: 0, diffPct: 0 },
      costPerConv: { current: 0, previous: 0, diffPct: 0 },
      convRate: { current: 0, previous: 0, diffPct: 0 },
    },
    campaigns: [],
    keywords: [],
    searchTerms: [],
    dailyTrends: [],
    deviceSplit: {
      mobile: { clicks: 0, impressions: 0, cost: 0, conversions: 0, sharePct: 0 },
      desktop: { clicks: 0, impressions: 0, cost: 0, conversions: 0, sharePct: 0 },
      tablet: { clicks: 0, impressions: 0, cost: 0, conversions: 0, sharePct: 0 },
    },
  };

  const metrics = data.metrics || {};
  const campaigns = data.campaigns || [];
  const keywords = data.keywords || [];
  const searchTerms = data.searchTerms || [];
  const dailyTrends = data.dailyTrends || [];
  const deviceSplit = data.deviceSplit || {};

  // Filtered lists
  const filteredCampaigns = useMemo(() => {
    if (!searchTerm.trim()) return campaigns;
    const q = searchTerm.toLowerCase();
    return campaigns.filter((c) => c.name.toLowerCase().includes(q));
  }, [campaigns, searchTerm]);

  const filteredKeywords = useMemo(() => {
    if (!searchTerm.trim()) return keywords;
    const q = searchTerm.toLowerCase();
    return keywords.filter(
      (k) => k.text.toLowerCase().includes(q) || (k.matchType && k.matchType.toLowerCase().includes(q))
    );
  }, [keywords, searchTerm]);

  const filteredSearchTerms = useMemo(() => {
    if (!searchTerm.trim()) return searchTerms;
    const q = searchTerm.toLowerCase();
    return searchTerms.filter(
      (s) => s.query.toLowerCase().includes(q) || (s.campaign && s.campaign.toLowerCase().includes(q))
    );
  }, [searchTerms, searchTerm]);

  // Chart data for daily clicks & conversions
  const trendChartData = dailyTrends.map((d) => ({
    date: d.date?.slice(5) || d.date,
    Clicks: d.clicks || 0,
    Conversions: d.conversions || 0,
  }));

  // Chart data for daily cost
  const costChartData = dailyTrends.map((d) => ({
    date: d.date?.slice(5) || d.date,
    'Spend ($)': d.cost || 0,
  }));

  const navigateToSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    } else {
      const btn = document.querySelector('[data-page="settings"]');
      if (btn) btn.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Connection Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0E3B27] via-[#14532D] to-[#1B6B45] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Google Ads Reporting</h1>
              <Badge variant="success" className="text-[10px] font-semibold bg-emerald-100 text-[#14532D]">
                API Stream Active
              </Badge>
              <Badge variant="outline" className="text-[10px] font-medium border-slate-200 text-slate-600 bg-slate-50">
                Account: {activeAccountName}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl">
              Real-time paid search advertising telemetry, campaign ROI, keyword efficiency, and customer acquisition metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={loadGoogleAdsData}
            disabled={loadingAds}
            className="text-xs bg-white text-slate-700 gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingAds ? 'animate-spin text-[#14532D]' : ''}`} />
            <span>{loadingAds ? 'Syncing...' : 'Sync Ads'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={navigateToSettings}
            className="text-xs bg-white text-slate-700 gap-1.5 cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5 text-slate-500" />
            <span>Ads Settings</span>
          </Button>
        </div>
      </div>

      {fetchError && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <span>{fetchError}</span>
          <Button size="sm" variant="outline" onClick={loadGoogleAdsData} className="text-xs h-7">
            Retry
          </Button>
        </div>
      )}

      {/* 2. Top KPI Metric Box Grid (8 core Google Ads Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricBox
          title="Total Ad Spend"
          value={`$${(metrics.cost?.current || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          previousValue={`$${(metrics.cost?.previous || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          diff={metrics.cost?.diffPct || 0}
        />
        <MetricBox
          title="Ad Clicks"
          value={(metrics.clicks?.current || 0).toLocaleString()}
          previousValue={(metrics.clicks?.previous || 0).toLocaleString()}
          diff={metrics.clicks?.diffPct || 0}
        />
        <MetricBox
          title="Total Impressions"
          value={(metrics.impressions?.current || 0).toLocaleString()}
          previousValue={(metrics.impressions?.previous || 0).toLocaleString()}
          diff={metrics.impressions?.diffPct || 0}
        />
        <MetricBox
          title="Click-Through Rate (CTR)"
          value={`${metrics.ctr?.current || 0}%`}
          previousValue={`${metrics.ctr?.previous || 0}%`}
          diff={metrics.ctr?.diffPct || 0}
        />
        <MetricBox
          title="Average CPC"
          value={`$${(metrics.avgCpc?.current || 0).toFixed(2)}`}
          previousValue={`$${(metrics.avgCpc?.previous || 0).toFixed(2)}`}
          diff={metrics.avgCpc?.diffPct || 0}
        />
        <MetricBox
          title="Conversions (Leads)"
          value={(metrics.conversions?.current || 0).toLocaleString()}
          previousValue={(metrics.conversions?.previous || 0).toLocaleString()}
          diff={metrics.conversions?.diffPct || 0}
        />
        <MetricBox
          title="Cost Per Conv. (CPA)"
          value={`$${(metrics.costPerConv?.current || 0).toFixed(2)}`}
          previousValue={`$${(metrics.costPerConv?.previous || 0).toFixed(2)}`}
          diff={metrics.costPerConv?.diffPct || 0}
        />
        <MetricBox
          title="Conversion Rate"
          value={`${metrics.convRate?.current || 0}%`}
          previousValue={`${metrics.convRate?.previous || 0}%`}
          diff={metrics.convRate?.diffPct || 0}
        />
      </div>

      {/* 3. Performance Trend Charts & Device Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Daily Clicks & Conversions Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Paid Search Volume Trends</h2>
              <p className="text-[11px] text-slate-500">Daily clicks and customer conversions across date range</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full bg-[#14532D]" /> Clicks
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="h-2.5 w-2.5 rounded-full bg-[#2E9B62]" /> Conversions
              </span>
            </div>
          </div>

          <div className="pt-2">
            <ComparisonBarChart
              data={trendChartData}
              currentColor="#14532D"
              height={260}
              previousLabel="Conversions"
              currentLabel="Clicks"
            />
          </div>
        </div>

        {/* Device Breakdown Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Device Performance Split</h2>
            <p className="text-[11px] text-slate-500">Impression and click volume by user device</p>
          </div>

          <div className="space-y-4 my-auto">
            {/* Mobile */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-800">
                  <Smartphone className="h-4 w-4 text-[#14532D]" /> Mobile Phones
                </span>
                <span className="text-slate-900 font-bold">{deviceSplit.mobile?.sharePct || 58}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#14532D] transition-all"
                  style={{ width: `${deviceSplit.mobile?.sharePct || 58}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                <span>{(deviceSplit.mobile?.clicks || 0).toLocaleString()} clicks</span>
                <span>${(deviceSplit.mobile?.cost || 0).toLocaleString()} spend</span>
              </div>
            </div>

            {/* Desktop */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-800">
                  <Monitor className="h-4 w-4 text-emerald-600" /> Desktop Computers
                </span>
                <span className="text-slate-900 font-bold">{deviceSplit.desktop?.sharePct || 36}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all"
                  style={{ width: `${deviceSplit.desktop?.sharePct || 36}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                <span>{(deviceSplit.desktop?.clicks || 0).toLocaleString()} clicks</span>
                <span>${(deviceSplit.desktop?.cost || 0).toLocaleString()} spend</span>
              </div>
            </div>

            {/* Tablet */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-800">
                  <Tablet className="h-4 w-4 text-slate-400" /> Tablets
                </span>
                <span className="text-slate-900 font-bold">{deviceSplit.tablet?.sharePct || 6}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-400 transition-all"
                  style={{ width: `${deviceSplit.tablet?.sharePct || 6}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                <span>{(deviceSplit.tablet?.clicks || 0).toLocaleString()} clicks</span>
                <span>${(deviceSplit.tablet?.cost || 0).toLocaleString()} spend</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Highest Converting:</span>
            <Badge variant="outline" className="bg-white text-[#14532D] border-emerald-300 font-bold">
              Mobile ({(deviceSplit.mobile?.conversions || 0)} leads)
            </Badge>
          </div>
        </div>
      </div>

      {/* 4. Tabbed Performance Tables (Campaigns, Keywords, Search Terms) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('campaigns')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'campaigns'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Campaigns ({campaigns.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('keywords')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'keywords'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Keywords ({keywords.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('searchTerms')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'searchTerms'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Search Queries ({searchTerms.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Filter ${activeTab}...`}
              className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        {/* Tab 1: Campaigns */}
        {activeTab === 'campaigns' && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <TableHead className="w-[320px]">Campaign Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Daily Budget</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Avg. CPC</TableHead>
                  <TableHead className="text-right font-bold text-slate-900">Cost ($)</TableHead>
                  <TableHead className="text-right font-bold text-[#14532D]">Conversions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((c) => (
                  <TableRow key={c.id} className="hover:bg-slate-50/60 text-xs">
                    <TableCell className="font-semibold text-slate-900 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="truncate max-w-[280px]" title={c.name}>{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold">
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-slate-600 font-mono">${c.budget}/day</TableCell>
                    <TableCell className="text-right text-slate-600 font-mono">{(c.impressions || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold text-slate-900 font-mono">{(c.clicks || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-slate-700 font-mono">{c.ctr}%</TableCell>
                    <TableCell className="text-right text-slate-700 font-mono">${(c.avgCpc || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-slate-900 font-mono">${(c.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-bold text-[#14532D] font-mono">{(c.conversions || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {filteredCampaigns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6 text-slate-400 text-xs">
                      No campaigns match the filter "{searchTerm}".
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Tab 2: Keywords */}
        {activeTab === 'keywords' && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <TableHead className="w-[300px]">Target Keyword</TableHead>
                  <TableHead>Match Type</TableHead>
                  <TableHead>Quality Score</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Avg CPC</TableHead>
                  <TableHead className="text-right font-bold text-slate-900">Cost ($)</TableHead>
                  <TableHead className="text-right font-bold text-[#14532D]">Conversions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeywords.map((k, idx) => (
                  <TableRow key={`${k.text}-${idx}`} className="hover:bg-slate-50/60 text-xs">
                    <TableCell className="font-semibold text-slate-900 py-3 font-mono text-[12px]">
                      {k.text}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          k.matchType === 'EXACT'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : k.matchType === 'PHRASE'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {k.matchType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-[#14532D] border border-emerald-200">
                        {k.qualityScore}/10
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-slate-600 font-mono">{(k.impressions || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold text-slate-900 font-mono">{(k.clicks || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-slate-700 font-mono">${(k.avgCpc || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-slate-900 font-mono">${(k.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-bold text-[#14532D] font-mono">{(k.conversions || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Tab 3: Search Terms */}
        {activeTab === 'searchTerms' && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <TableHead className="w-[340px]">Search Query Typed by User</TableHead>
                  <TableHead>Triggered Campaign</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right font-bold text-slate-900">Cost ($)</TableHead>
                  <TableHead className="text-right font-bold text-[#14532D]">Conversions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSearchTerms.map((st, idx) => (
                  <TableRow key={`${st.query}-${idx}`} className="hover:bg-slate-50/60 text-xs">
                    <TableCell className="font-semibold text-slate-900 py-3 font-mono text-[12px]">
                      "{st.query}"
                    </TableCell>
                    <TableCell className="text-slate-600 text-[11px] truncate max-w-[200px]" title={st.campaign}>
                      {st.campaign}
                    </TableCell>
                    <TableCell className="text-right text-slate-600 font-mono">{(st.impressions || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold text-slate-900 font-mono">{(st.clicks || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold text-slate-900 font-mono">${(st.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-bold text-[#14532D] font-mono">{(st.conversions || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 5. Google Ads API Architecture Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/80 via-white to-slate-50/80 border border-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#14532D] text-white flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Google Ads API v17 Integration</p>
            <p className="text-[11px] text-slate-500">
              GAQL queries stream impressions, CPC, cost, and conversions directly into executive reports.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={navigateToSettings}
          className="text-xs font-semibold bg-[#14532D] hover:bg-[#1B6B45] text-white cursor-pointer"
        >
          Configure Customer ID &amp; Token →
        </Button>
      </div>
    </div>
  );
}
