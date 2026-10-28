import React, { useMemo, useState, useEffect } from 'react';
import {
  KeyRound,
  Search,
  Download,
  Upload,
  Plus,
  ArrowUpDown,
  BookmarkCheck,
  Globe,
  Trash2,
  ExternalLink,
  Check,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import SectionCard from '@/components/dashboard/SectionCard';
import NoReportData from '@/components/dashboard/NoReportData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useReport } from '@/context/ReportContext';
import { exportToCsv } from '@/lib/csvExport';
import ImportClientKeywordsModal from '@/components/keywords/ImportClientKeywordsModal';
import AddKeywordModal from '@/components/keywords/AddKeywordModal';

const STORAGE_KEY = 'boulder_client_target_keywords';

const RANGE_OPTIONS = [
  { value: 'all', label: 'All positions' },
  { value: '1-3', label: 'Top 3 (Pos 1-3)' },
  { value: '4-10', label: 'Top 10 (Pos 4-10)' },
  { value: '11+', label: 'Page 2+ (Pos 11+)' },
  { value: 'unranked', label: 'Unranked / Tracking' },
];

const DEFAULT_CLIENT_KEYWORDS = [
  { id: 'ck-1', keyword: 'ux ui optimization atlanta', targetUrl: 'https://boulderdecisions.com/services' },
  { id: 'ck-2', keyword: 'ai consultants atlanta', targetUrl: 'https://boulderdecisions.com/ai' },
  { id: 'ck-3', keyword: 'google search console date picker bug', targetUrl: 'https://boulderdecisions.com/blog' },
  { id: 'ck-4', keyword: 'boulder decision', targetUrl: 'https://boulderdecisions.com/' },
  { id: 'ck-5', keyword: 'boulder decisions analytics', targetUrl: 'https://boulderdecisions.com/about' },
  { id: 'ck-6', keyword: 'decision intelligence consulting', targetUrl: 'https://boulderdecisions.com/services' },
  { id: 'ck-7', keyword: 'enterprise analytics strategy', targetUrl: 'https://boulderdecisions.com/services' },
  { id: 'ck-8', keyword: 'executive decision analytics playbook', targetUrl: 'https://boulderdecisions.com/blog' },
  { id: 'ck-9', keyword: 'shortlist platforms that visualize topic clusters and show where supporting', targetUrl: 'https://boulderdecisions.com/blog' },
];

export default function KeywordRankingsPage() {
  const { report, loading, selectedPeriod } = useReport();
  const [activeTab, setActiveTab] = useState('seo'); // 'seo' | 'client'

  // SEO table states
  const [seoSearch, setSeoSearch] = useState('');
  const [seoRange, setSeoRange] = useState('all');
  const [seoSortField, setSeoSortField] = useState('clicks');
  const [seoSortAsc, setSeoSortAsc] = useState(false);

  // Client table states
  const [clientSearch, setClientSearch] = useState('');
  const [clientRange, setClientRange] = useState('all');
  const [clientSortField, setClientSortField] = useState('clicks');
  const [clientSortAsc, setClientSortAsc] = useState(false);

  // Modals & Feedback
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Persistent Client Keywords
  const [clientKeywords, setClientKeywords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_CLIENT_KEYWORDS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clientKeywords));
    } catch (e) {
      console.warn('Failed to persist client keywords:', e);
    }
  }, [clientKeywords]);

  const showToast = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  const curLabel = selectedPeriod?.label || 'Selected Period';
  const gscKeywords = report?.keywordRankings || [];

  // GSC Lookup Map
  const gscMap = useMemo(() => {
    const map = new Map();
    gscKeywords.forEach((k) => {
      if (k.keyword) {
        map.set(k.keyword.trim().toLowerCase(), k);
      }
    });
    return map;
  }, [gscKeywords]);

  // Enriched Client Keywords
  const enrichedClientKeywords = useMemo(() => {
    return clientKeywords.map((item) => {
      const lower = (item.keyword || '').trim().toLowerCase();
      const gsc = gscMap.get(lower);

      const pos = gsc?.position ?? (item.position !== undefined ? item.position : null);
      const clicks = gsc?.clicks ?? (item.clicks !== undefined ? item.clicks : 0);
      const impressions = gsc?.impressions ?? (item.impressions !== undefined ? item.impressions : 0);
      const ctr = gsc?.ctr || item.ctr || (impressions > 0 ? `${((clicks / impressions) * 100).toFixed(2)}%` : '0.00%');

      let status = 'Tracking';
      if (pos !== null && pos !== undefined) {
        if (pos <= 3.0) status = 'Top 3';
        else if (pos <= 10.0) status = 'Top 10';
        else status = 'Position 21+';
      } else if (item.tier) {
        status = item.tier;
      }

      return {
        ...item,
        position: pos,
        clicks,
        impressions,
        ctr,
        status,
        isLiveSynced: Boolean(gsc),
      };
    });
  }, [clientKeywords, gscMap]);

  // Filtered SEO rows (Left Side)
  const filteredSeo = useMemo(() => {
    let rows = gscKeywords.filter((k) =>
      (k.keyword || '').toLowerCase().includes(seoSearch.toLowerCase())
    );

    if (seoRange === '1-3') rows = rows.filter((k) => k.position !== null && k.position <= 3.0);
    if (seoRange === '4-10') rows = rows.filter((k) => k.position !== null && k.position > 3.0 && k.position <= 10.0);
    if (seoRange === '11+') rows = rows.filter((k) => k.position !== null && k.position > 10.0);

    rows = [...rows].sort((a, b) => {
      let aVal = a[seoSortField];
      let bVal = b[seoSortField];
      if (seoSortField === 'position') {
        return seoSortAsc ? aVal - bVal : bVal - aVal;
      }
      return seoSortAsc ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
    });

    return rows;
  }, [gscKeywords, seoSearch, seoRange, seoSortField, seoSortAsc]);

  // Filtered Client rows (Right Side)
  const filteredClient = useMemo(() => {
    let rows = enrichedClientKeywords.filter((k) =>
      (k.keyword || '').toLowerCase().includes(clientSearch.toLowerCase())
    );

    if (clientRange === '1-3') rows = rows.filter((k) => k.position !== null && k.position <= 3.0);
    if (clientRange === '4-10') rows = rows.filter((k) => k.position !== null && k.position > 3.0 && k.position <= 10.0);
    if (clientRange === '11+') rows = rows.filter((k) => k.position !== null && k.position > 10.0);
    if (clientRange === 'unranked') rows = rows.filter((k) => k.position === null || k.position === undefined);

    rows = [...rows].sort((a, b) => {
      let aVal = a[clientSortField];
      let bVal = b[clientSortField];

      if (clientSortField === 'position') {
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        return clientSortAsc ? aVal - bVal : bVal - aVal;
      }
      return clientSortAsc ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
    });

    return rows;
  }, [enrichedClientKeywords, clientSearch, clientRange, clientSortField, clientSortAsc]);

  // KPI summaries for active tabs
  const seoSummary = useMemo(() => {
    const total = gscKeywords.length;
    const top3 = gscKeywords.filter((k) => k.position !== null && k.position <= 3).length;
    const top10 = gscKeywords.filter((k) => k.position !== null && k.position <= 10).length;
    const totalClicks = gscKeywords.reduce((sum, k) => sum + (Number(k.clicks) || 0), 0);
    return { total, top3, top10, totalClicks };
  }, [gscKeywords]);

  const clientSummary = useMemo(() => {
    const total = enrichedClientKeywords.length;
    const synced = enrichedClientKeywords.filter((k) => k.isLiveSynced).length;
    const top10 = enrichedClientKeywords.filter((k) => k.position !== null && k.position <= 10).length;
    const totalClicks = enrichedClientKeywords.reduce((sum, k) => sum + (Number(k.clicks) || 0), 0);
    return { total, synced, top10, totalClicks };
  }, [enrichedClientKeywords]);

  // Sort togglers
  const toggleSeoSort = (field) => {
    if (seoSortField === field) setSeoSortAsc((p) => !p);
    else { setSeoSortField(field); setSeoSortAsc(field === 'position'); }
  };

  const toggleClientSort = (field) => {
    if (clientSortField === field) setClientSortAsc((p) => !p);
    else { setClientSortField(field); setClientSortAsc(field === 'position'); }
  };

  // CSV Export Handlers
  const handleExportSeo = () => {
    exportToCsv(
      `seo-keyword-rankings-${curLabel.replace(/\s+/g, '-').toLowerCase()}`,
      filteredSeo.map((k, i) => ({
        Rank: i + 1,
        'Search Query / Keyword': k.keyword,
        'Avg Position': k.position,
        Clicks: k.clicks,
        Impressions: k.impressions,
        CTR: k.ctr,
        Tier: k.status,
      }))
    );
    showToast('Exported SEO Keyword Rankings CSV.');
  };

  const handleExportClient = () => {
    exportToCsv(
      `client-keyword-rankings-${curLabel.replace(/\s+/g, '-').toLowerCase()}`,
      filteredClient.map((k, i) => ({
        Rank: i + 1,
        'Search Query / Keyword': k.keyword,
        'Avg Position': k.position !== null && k.position !== undefined ? k.position : '—',
        Clicks: k.clicks ?? 0,
        Impressions: k.impressions ?? 0,
        CTR: k.ctr ?? '0.00%',
        Tier: k.status || 'Tracking',
        ...(k.targetUrl ? { 'Target URL': k.targetUrl } : {}),
      }))
    );
    showToast('Exported Client Keywords CSV.');
  };

  // Client Keyword Mutations
  const handleImportKeywords = (newKeywords, mode = 'append') => {
    if (mode === 'replace') {
      setClientKeywords(newKeywords);
      showToast(`Replaced client list with ${newKeywords.length} keywords.`);
    } else {
      const existingMap = new Set(clientKeywords.map((k) => k.keyword.toLowerCase().trim()));
      const uniqueNew = newKeywords.filter((k) => !existingMap.has(k.keyword.toLowerCase().trim()));
      setClientKeywords((prev) => [...prev, ...uniqueNew]);
      showToast(`Imported ${uniqueNew.length} client keywords (${newKeywords.length - uniqueNew.length} duplicates skipped).`);
    }
  };

  const handleAddSingleKeyword = (kw) => {
    const exists = clientKeywords.some((k) => k.keyword.toLowerCase().trim() === kw.keyword.toLowerCase().trim());
    if (exists) {
      showToast(`"${kw.keyword}" is already in your client keywords list.`);
      return;
    }
    setClientKeywords((prev) => [kw, ...prev]);
    showToast(`Added "${kw.keyword}" to client keywords.`);
  };

  const handleDeleteClientKeyword = (id) => {
    setClientKeywords((prev) => prev.filter((k) => k.id !== id));
    showToast('Removed keyword from client list.');
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset client keywords list to default set?')) {
      setClientKeywords(DEFAULT_CLIENT_KEYWORDS);
      showToast('Reset to default client keywords.');
    }
  };

  if (loading && !report) return <Skeleton className="h-96" />;
  if (!report || !report.keywordRankings) return <NoReportData />;

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-medium">{feedbackMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg('')}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer font-bold px-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#14532D]" />
            Keyword Rankings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {curLabel} &bull; Switch between live Google Search Console query rankings and Client Target Keywords.
          </p>
        </div>
      </div>

      {/* Modern Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`flex items-center gap-2.5 px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'seo'
              ? 'border-[#14532D] text-[#14532D] bg-emerald-50/60 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <Globe className={`h-4 w-4 ${activeTab === 'seo' ? 'text-[#14532D]' : 'text-slate-400'}`} />
          <span>SEO Keyword Rankings</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'seo' ? 'bg-[#14532D] text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {gscKeywords.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('client')}
          className={`flex items-center gap-2.5 px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'client'
              ? 'border-[#14532D] text-[#14532D] bg-emerald-50/60 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <BookmarkCheck className={`h-4 w-4 ${activeTab === 'client' ? 'text-[#14532D]' : 'text-slate-400'}`} />
          <span>Client Keywords</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'client' ? 'bg-[#14532D] text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {clientKeywords.length}
          </span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: SEO Keyword Rankings View                                    */}
      {/* =================================================================== */}
      {activeTab === 'seo' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Total Search Queries</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{seoSummary.total.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400">Live from Search Console</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Top 3 Rankings</span>
              <span className="text-xl font-bold text-emerald-600 mt-1 block">{seoSummary.top3}</span>
              <span className="text-[10px] text-slate-400">Prime visibility (Pos 1-3)</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Top 10 Rankings</span>
              <span className="text-xl font-bold text-[#14532D] mt-1 block">{seoSummary.top10}</span>
              <span className="text-[10px] text-slate-400">Page 1 results (Pos 1-10)</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Total Search Clicks</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{seoSummary.totalClicks.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400">Organic clicks in period</span>
            </div>
          </div>

          {/* Full Width Table Card */}
          <SectionCard
            icon={Globe}
            title="SEO Keyword Rankings"
            subtitle={`Live Google Search Console queries (${filteredSeo.length} of ${gscKeywords.length})`}
            actions={
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[11px] text-[#14532D] bg-emerald-50/60 border-emerald-200 hidden sm:inline-flex">
                  Search Console
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSeo}
                  className="gap-1.5 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm"
                >
                  <Download className="h-3.5 w-3.5 text-[#14532D]" /> Export CSV
                </Button>
              </div>
            }
          >
            {/* Search and Position Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search SEO queries..."
                  value={seoSearch}
                  onChange={(e) => setSeoSearch(e.target.value)}
                  className="pl-8 text-xs h-9"
                />
              </div>
              <Select value={seoRange} onChange={(e) => setSeoRange(e.target.value)} className="sm:w-48 text-xs h-9">
                {RANGE_OPTIONS.filter((o) => o.value !== 'unranked').map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-slate-200 overflow-x-auto bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 text-xs">
                    <TableHead className="w-12 text-center text-xs">#</TableHead>
                    <TableHead className="text-xs">Search Query / Keyword</TableHead>
                    <TableHead className="w-28 text-right text-xs">
                      <button
                        type="button"
                        onClick={() => toggleSeoSort('position')}
                        className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        Avg Position <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="w-24 text-right text-xs">
                      <button
                        type="button"
                        onClick={() => toggleSeoSort('clicks')}
                        className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        Clicks <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="w-28 text-right text-xs">
                      <button
                        type="button"
                        onClick={() => toggleSeoSort('impressions')}
                        className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        Impressions <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="w-24 text-right text-xs">CTR</TableHead>
                    <TableHead className="w-24 text-center text-xs">Tier</TableHead>
                    <TableHead className="w-20 text-center text-xs">Track</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSeo.map((k, i) => {
                    const isAlreadyTracked = clientKeywords.some(
                      (ck) => ck.keyword.toLowerCase().trim() === k.keyword.toLowerCase().trim()
                    );

                    return (
                      <TableRow key={k.keyword} className="hover:bg-slate-50/70 transition-colors text-xs">
                        <TableCell className="text-center text-slate-400 font-mono text-[11px]">{i + 1}</TableCell>
                        <TableCell className="font-semibold text-slate-900" title={k.keyword}>
                          {k.keyword}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">{k.position}</TableCell>
                        <TableCell className="text-right text-slate-700 font-semibold">{k.clicks.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-slate-600">{k.impressions.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-slate-600 font-mono text-[11px]">{k.ctr}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={k.position <= 3 ? 'success' : k.position <= 10 ? 'default' : 'secondary'}
                            className="font-normal text-[10px] px-2 py-0.5"
                          >
                            {k.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {isAlreadyTracked ? (
                            <span className="text-[10px] text-emerald-700 font-medium inline-flex items-center gap-0.5">
                              <Check className="h-2.5 w-2.5" /> Tracked
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddSingleKeyword({
                                id: `kw-from-gsc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                                keyword: k.keyword,
                                source: 'gsc_promote',
                              })}
                              className="text-[11px] font-bold text-[#14532D] hover:text-[#1B6B45] hover:bg-emerald-50 px-2 py-0.5 rounded cursor-pointer transition-colors"
                              title="Add to Client Keywords list"
                            >
                              + Track
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredSeo.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-xs text-slate-500">
                        No SEO search queries found matching your filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="pt-2 text-[11px] text-slate-400">
              Showing {filteredSeo.length} of {gscKeywords.length} live SEO queries
            </div>
          </SectionCard>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: Client Keywords View                                         */}
      {/* =================================================================== */}
      {activeTab === 'client' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Target Client Keywords</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{clientSummary.total}</span>
              <span className="text-[10px] text-slate-400">Tracked in client portfolio</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Live GSC Synced</span>
              <span className="text-xl font-bold text-emerald-600 mt-1 block">{clientSummary.synced} / {clientSummary.total}</span>
              <span className="text-[10px] text-slate-400">Ranking in Search Console</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Client in Top 10</span>
              <span className="text-xl font-bold text-[#14532D] mt-1 block">{clientSummary.top10}</span>
              <span className="text-[10px] text-slate-400">Page 1 target keywords</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Target Organic Clicks</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{clientSummary.totalClicks.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400">Clicks generated on target list</span>
            </div>
          </div>

          {/* Full Width Table Card */}
          <SectionCard
            icon={BookmarkCheck}
            title="Client Keywords"
            subtitle={`Client target list (${filteredClient.length} of ${clientKeywords.length}) \u2022 Synced with live GSC rankings`}
            actions={
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsImportModalOpen(true)}
                  className="gap-1.5 text-xs font-semibold bg-white border-emerald-200 text-[#14532D] hover:bg-emerald-50 cursor-pointer shadow-sm"
                >
                  <Upload className="h-3.5 w-3.5" /> Import CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportClient}
                  className="gap-1.5 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" /> Export CSV
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  className="gap-1.5 text-xs font-semibold bg-[#14532D] hover:bg-[#1B6B45] text-white cursor-pointer shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Keyword
                </Button>
              </div>
            }
          >
            {/* Search and Position Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search client keywords..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-8 text-xs h-9"
                />
              </div>
              <Select value={clientRange} onChange={(e) => setClientRange(e.target.value)} className="sm:w-48 text-xs h-9">
                {RANGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-slate-200 overflow-x-auto bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 text-xs">
                    <TableHead className="w-12 text-center text-xs">#</TableHead>
                    <TableHead className="text-xs">Search Query / Keyword</TableHead>
                    <TableHead className="w-28 text-right text-xs">
                      <button
                        type="button"
                        onClick={() => toggleClientSort('position')}
                        className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        Avg Position <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="w-24 text-right text-xs">
                      <button
                        type="button"
                        onClick={() => toggleClientSort('clicks')}
                        className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        Clicks <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="w-28 text-right text-xs">
                      <button
                        type="button"
                        onClick={() => toggleClientSort('impressions')}
                        className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        Impressions <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="w-24 text-right text-xs">CTR</TableHead>
                    <TableHead className="w-24 text-center text-xs">Tier</TableHead>
                    <TableHead className="w-16 text-center text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClient.map((k, i) => (
                    <TableRow key={k.id || k.keyword} className="hover:bg-slate-50/70 transition-colors text-xs">
                      <TableCell className="text-center text-slate-400 font-mono text-[11px]">{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900" title={k.keyword}>{k.keyword}</span>
                            {k.isLiveSynced ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                GSC Synced
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                                Target Only
                              </span>
                            )}
                          </div>
                          {k.targetUrl && (
                            <a
                              href={k.targetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-slate-400 hover:text-[#14532D] inline-flex items-center gap-1 mt-0.5"
                              title={k.targetUrl}
                            >
                              <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                              <span>{k.targetUrl.replace(/^https?:\/\//, '')}</span>
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {k.position !== null && k.position !== undefined ? k.position : '\u2014'}
                      </TableCell>
                      <TableCell className="text-right text-slate-700 font-semibold">
                        {(k.clicks ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-slate-600">
                        {(k.impressions ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-slate-600 font-mono text-[11px]">
                        {k.ctr || '0.00%'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            k.position !== null && k.position <= 3
                              ? 'success'
                              : k.position !== null && k.position <= 10
                              ? 'default'
                              : k.position !== null
                              ? 'secondary'
                              : 'outline'
                          }
                          className="font-normal text-[10px] px-2 py-0.5"
                        >
                          {k.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteClientKeyword(k.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove keyword"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredClient.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-xs text-slate-500">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-slate-700">No client keywords found.</p>
                          <p className="text-[11px] text-slate-400">
                            Click &quot;Import CSV&quot; to upload your client list or &quot;Add Keyword&quot; to add one.
                          </p>
                          <div className="pt-2 flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsImportModalOpen(true)}
                              className="gap-1.5 text-xs bg-white text-[#14532D] border-emerald-200"
                            >
                              <Upload className="h-3.5 w-3.5" /> Import CSV
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setIsAddModalOpen(true)}
                              className="gap-1.5 text-xs bg-[#14532D] text-white"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add Keyword
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Quick reset & count footer */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Showing {filteredClient.length} of {clientKeywords.length} client target keywords</span>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="hover:text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                title="Reset to default initial keywords"
              >
                <RotateCcw className="h-3 w-3" /> Reset Defaults
              </button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* CSV Import Modal */}
      <ImportClientKeywordsModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportKeywords}
      />

      {/* Add Single Keyword Modal */}
      <AddKeywordModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddSingleKeyword}
      />
    </div>
  );
}
