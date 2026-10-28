import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Search,
  Sparkles,
  Filter,
  Plus,
  Trash2,
  Check,
  Save,
  Layers,
  RefreshCw,
  X,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import SectionCard from '@/components/dashboard/SectionCard';
import MetricBox from '@/components/MetricBox';
import ComparisonBarChart from '@/components/charts/ComparisonBarChart';
import NoReportData from '@/components/dashboard/NoReportData';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useReport } from '@/context/ReportContext';
import {
  getApiConfig,
  saveBrandAndNonBrandKeywords,
} from '@/services/liveSeoApi';

const TAB_LABELS = { all: 'All Devices', desktop: 'Desktop', mobile: 'Mobile' };

const DEFAULT_BRAND_TERMS = [
  'boulder decision',
  'boulder decisions',
  'boulderdecision',
  'boulderdecisions',
  'boulder decisions analytics',
];

function BrandTabPanel({ data, prevLabel, curLabel }) {
  if (!data) return null;

  const rows = [
    { label: 'Brand Clicks', m: data.brandClicks || { current: 0, previous: 0, diffPct: 0 } },
    { label: 'Non-Brand Clicks', m: data.nonBrandClicks || { current: 0, previous: 0, diffPct: 0 } },
    { label: 'Brand Impressions', m: data.brandImpressions || { current: 0, previous: 0, diffPct: 0 } },
    { label: 'Non-Brand Impressions', m: data.nonBrandImpressions || { current: 0, previous: 0, diffPct: 0 } },
  ];

  const clicksChartData = [
    { name: 'Brand Clicks', previous: data.brandClicks?.previous || 0, current: data.brandClicks?.current || 0 },
    { name: 'Non-Brand Clicks', previous: data.nonBrandClicks?.previous || 0, current: data.nonBrandClicks?.current || 0 },
  ];

  const impressionsChartData = [
    { name: 'Brand Impr.', previous: data.brandImpressions?.previous || 0, current: data.brandImpressions?.current || 0 },
    { name: 'Non-Brand Impr.', previous: data.nonBrandImpressions?.previous || 0, current: data.nonBrandImpressions?.current || 0 },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {rows.map((r) => (
          <MetricBox
            key={r.label}
            title={r.label}
            value={(r.m.current || 0).toLocaleString()}
            previousValue={(r.m.previous || 0).toLocaleString()}
            diff={r.m.diffPct || 0}
          />
        ))}
      </div>
      <p className="text-xs text-slate-400">Clicks and impressions are shown separately to avoid scaling distortion.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <ComparisonBarChart
          data={clicksChartData}
          currentColor="#14532D"
          height={260}
          previousLabel={prevLabel}
          currentLabel={curLabel}
        />
        <ComparisonBarChart
          data={impressionsChartData}
          currentColor="#14532D"
          height={260}
          previousLabel={prevLabel}
          currentLabel={curLabel}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Metric</TableHead>
            <TableHead className="text-right">{prevLabel}</TableHead>
            <TableHead className="text-right">{curLabel}</TableHead>
            <TableHead className="text-right">Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const flat = (r.m.diffPct || 0) === 0;
            const improved = (r.m.diffPct || 0) > 0;
            return (
              <TableRow key={r.label}>
                <TableCell className="font-semibold text-slate-900">{r.label}</TableCell>
                <TableCell className="text-right text-slate-600">{(r.m.previous || 0).toLocaleString()}</TableCell>
                <TableCell className="text-right font-bold text-slate-900">{(r.m.current || 0).toLocaleString()}</TableCell>
                <TableCell className={`text-right font-semibold ${flat ? 'text-slate-500' : improved ? 'text-emerald-600' : 'text-red-600'}`}>
                  {(r.m.diffPct || 0) > 0 ? '+' : ''}{r.m.diffPct || 0}%
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default function BrandQueriesPage() {
  const { report, loading, selectedPeriod, previousPeriod, comparisonLabel, loadLiveReport } = useReport();
  const [queryTab, setQueryTab] = useState('brand');

  // Classifier management state
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [activeKeywordTab, setActiveKeywordTab] = useState('brand'); // 'brand' | 'nonBrand'
  const [singleKeyword, setSingleKeyword] = useState('');
  const [bulkKeywordsText, setBulkKeywordsText] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [keywordSearch, setKeywordSearch] = useState('');

  // Local active rules lists
  const [brandTerms, setBrandTerms] = useState(DEFAULT_BRAND_TERMS);
  const [nonBrandTerms, setNonBrandTerms] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'

  // Initialize keyword lists from saved config or report
  useEffect(() => {
    const cfg = getApiConfig();
    if (cfg.brandKeywords) {
      const parsed = cfg.brandKeywords.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (parsed.length > 0) setBrandTerms(parsed);
    } else if (report?.brandQueries?.brandTerms?.length) {
      setBrandTerms(report.brandQueries.brandTerms);
    }

    if (cfg.nonBrandKeywords) {
      const parsed = cfg.nonBrandKeywords.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      setNonBrandTerms(parsed);
    } else if (report?.brandQueries?.nonBrandTerms?.length) {
      setNonBrandTerms(report.brandQueries.nonBrandTerms);
    }
  }, [report]);

  // Bulk add detection counter
  const detectedBulkKeywords = useMemo(() => {
    return bulkKeywordsText
      .split(/[\n,]+/)
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 1);
  }, [bulkKeywordsText]);

  // Handle single keyword addition
  const handleAddSingleKeyword = (e) => {
    if (e) e.preventDefault();
    const clean = singleKeyword.trim().toLowerCase();
    if (!clean) return;

    if (activeKeywordTab === 'brand') {
      if (!brandTerms.includes(clean)) {
        setBrandTerms((prev) => [...prev, clean]);
        // Remove from nonBrand if it was there
        setNonBrandTerms((prev) => prev.filter((k) => k !== clean));
        setIsDirty(true);
      }
    } else {
      if (!nonBrandTerms.includes(clean)) {
        setNonBrandTerms((prev) => [...prev, clean]);
        // Remove from brand if it was there
        setBrandTerms((prev) => prev.filter((k) => k !== clean));
        setIsDirty(true);
      }
    }
    setSingleKeyword('');
  };

  // Handle bulk add
  const handleAddBulkKeywords = () => {
    if (detectedBulkKeywords.length === 0) return;

    if (activeKeywordTab === 'brand') {
      const newTerms = Array.from(new Set([...brandTerms, ...detectedBulkKeywords]));
      setBrandTerms(newTerms);
      setNonBrandTerms((prev) => prev.filter((k) => !detectedBulkKeywords.includes(k)));
    } else {
      const newTerms = Array.from(new Set([...nonBrandTerms, ...detectedBulkKeywords]));
      setNonBrandTerms(newTerms);
      setBrandTerms((prev) => prev.filter((k) => !detectedBulkKeywords.includes(k)));
    }

    setBulkKeywordsText('');
    setIsBulkOpen(false);
    setIsDirty(true);
  };

  // Handle delete keyword
  const handleDeleteKeyword = (termToDelete, type) => {
    if (type === 'brand') {
      setBrandTerms((prev) => prev.filter((t) => t !== termToDelete));
    } else {
      setNonBrandTerms((prev) => prev.filter((t) => t !== termToDelete));
    }
    setIsDirty(true);
  };

  // Clear all in active tab
  const handleClearTab = (type) => {
    if (window.confirm(`Are you sure you want to clear all ${type === 'brand' ? 'branded' : 'non-branded'} keywords?`)) {
      if (type === 'brand') {
        setBrandTerms([]);
      } else {
        setNonBrandTerms([]);
      }
      setIsDirty(true);
    }
  };

  // Reset to default brand terms
  const handleResetDefaults = () => {
    if (window.confirm('Reset branded keywords to Boulder Decision defaults?')) {
      setBrandTerms(DEFAULT_BRAND_TERMS);
      setNonBrandTerms([]);
      setIsDirty(true);
    }
  };

  // Save changes & trigger live reclassification
  const handleSaveAndReclassify = async () => {
    setSaveStatus('saving');
    try {
      saveBrandAndNonBrandKeywords({
        brandKeywords: brandTerms,
        nonBrandKeywords: nonBrandTerms,
      });

      // Reload live report with updated brand and non-brand rules
      if (loadLiveReport) {
        await loadLiveReport(true);
      }

      setIsDirty(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save keywords:', err);
      setSaveStatus('idle');
      alert('Failed to save keyword settings: ' + err.message);
    }
  };

  // Quick classify action from queries table
  const handleQuickAddAsBrand = async (queryText) => {
    const clean = String(queryText).trim().toLowerCase();
    if (!clean) return;
    const updatedBrand = Array.from(new Set([...brandTerms, clean]));
    const updatedNonBrand = nonBrandTerms.filter((k) => k !== clean);

    setBrandTerms(updatedBrand);
    setNonBrandTerms(updatedNonBrand);

    saveBrandAndNonBrandKeywords({
      brandKeywords: updatedBrand,
      nonBrandKeywords: updatedNonBrand,
    });

    if (loadLiveReport) {
      await loadLiveReport(true);
    }
  };

  const handleQuickMoveToNonBrand = async (queryText) => {
    const clean = String(queryText).trim().toLowerCase();
    if (!clean) return;
    const updatedNonBrand = Array.from(new Set([...nonBrandTerms, clean]));
    const updatedBrand = brandTerms.filter((k) => k !== clean);

    setBrandTerms(updatedBrand);
    setNonBrandTerms(updatedNonBrand);

    saveBrandAndNonBrandKeywords({
      brandKeywords: updatedBrand,
      nonBrandKeywords: updatedNonBrand,
    });

    if (loadLiveReport) {
      await loadLiveReport(true);
    }
  };

  if (loading && !report) return <Skeleton className="h-96" />;
  if (!report || !report.brandQueries) return <NoReportData />;

  const { brandQueries } = report;
  const prevLabel = previousPeriod?.label || 'Previous Period';
  const curLabel = selectedPeriod?.label || 'Selected Period';

  const topBrandQueries = brandQueries.topBrandQueries || [];
  const topNonBrandQueries = brandQueries.topNonBrandQueries || [];

  // Filtered keyword pills based on search inside manager
  const activeList = activeKeywordTab === 'brand' ? brandTerms : nonBrandTerms;
  const filteredActiveList = activeList.filter((k) =>
    k.toLowerCase().includes(keywordSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* SECTION 1: KEYWORD CLASSIFIER & MANAGEMENT HUB */}
      <div className="rounded-xl border border-violet-200/80 bg-linear-to-b from-white to-violet-50/30 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-violet-600 text-white shadow-xs">
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Brand vs Non-Brand Keyword Classifier
                </h2>
                {isDirty && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px] font-semibold animate-pulse">
                    Unsaved Changes
                  </Badge>
                )}
                {saveStatus === 'saved' && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                    <Check className="h-3 w-3" /> Saved &amp; Classified
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage brand matching terms and explicit non-branded keywords directly from this main page.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsManagerOpen((prev) => !prev)}
              className="gap-1.5 bg-white text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-50 shadow-xs cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-violet-600" />
              {isManagerOpen ? 'Hide Keyword Options' : 'Manage Keywords'}
              {isManagerOpen ? (
                <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              )}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSaveAndReclassify}
              disabled={saveStatus === 'saving'}
              className={`gap-1.5 text-xs font-semibold shadow-xs cursor-pointer ${
                isDirty
                  ? 'bg-violet-600 hover:bg-violet-700 text-white ring-2 ring-violet-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Saving &amp; Reclassifying...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save &amp; Reclassify
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quick summary metrics */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-slate-200/60">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700">Active Classification:</span>
            <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 font-semibold text-[11px] border border-violet-200">
              {brandTerms.length} Branded Rules
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px] border border-emerald-200">
              {nonBrandTerms.length} Explicit Non-Brand
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600">
              {brandQueries.totalRowsAnalyzed
                ? `${brandQueries.totalRowsAnalyzed.toLocaleString()} search queries classified dynamically`
                : 'Dynamic query classifier active'}
            </span>
          </div>

          <div className="text-slate-500 text-[11px]">
            {isDirty ? (
              <span className="text-amber-600 font-medium">Click "Save &amp; Reclassify" to apply changes</span>
            ) : (
              <span className="text-slate-400">All queries categorized with active rules</span>
            )}
          </div>
        </div>

        {/* EXPANDABLE KEYWORD MANAGER PANEL */}
        {isManagerOpen && (
          <div className="pt-3 border-t border-slate-200 space-y-4 animate-in fade-in-0 duration-150">
            {/* Tabs for Branded vs Non-Branded */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveKeywordTab('brand')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeKeywordTab === 'brand'
                      ? 'bg-white text-violet-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🏷️ Branded Keywords ({brandTerms.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveKeywordTab('nonBrand')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeKeywordTab === 'nonBrand'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌐 Non-Branded Keywords ({nonBrandTerms.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBulkOpen((prev) => !prev)}
                  className="gap-1.5 text-xs bg-white text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5 text-blue-600" />
                  {isBulkOpen ? 'Hide Bulk Add' : 'Bulk Add Keywords'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleClearTab(activeKeywordTab)}
                  className="gap-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Tab
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetDefaults}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  title="Reset to default brand terms"
                >
                  Reset Defaults
                </Button>
              </div>
            </div>

            {/* BULK ADD FORM */}
            {isBulkOpen && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 animate-in fade-in-0 duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Layers className="h-4 w-4 text-blue-600" />
                    <span>
                      Bulk Add {activeKeywordTab === 'brand' ? 'Branded' : 'Non-Branded'} Keywords
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {detectedBulkKeywords.length} valid keywords detected
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={bulkKeywordsText}
                  onChange={(e) => setBulkKeywordsText(e.target.value)}
                  placeholder="Paste multiple keywords separated by commas or new lines (e.g. boulder decisions, boulder analytics, marketing roi)..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono"
                />

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Keywords will be automatically trimmed, lowercase normalized, and deduplicated.
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBulkKeywordsText('');
                        setIsBulkOpen(false);
                      }}
                      className="text-xs bg-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddBulkKeywords}
                      disabled={detectedBulkKeywords.length === 0}
                      className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add {detectedBulkKeywords.length} Keywords
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* SINGLE KEYWORD INPUT & SEARCH */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <form onSubmit={handleAddSingleKeyword} className="sm:col-span-8 flex gap-2">
                <Input
                  type="text"
                  value={singleKeyword}
                  onChange={(e) => setSingleKeyword(e.target.value)}
                  placeholder={`Add single ${activeKeywordTab === 'brand' ? 'brand keyword (e.g. boulder decision)' : 'non-brand keyword (e.g. data consulting)'}...`}
                  className="text-xs bg-white h-9"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!singleKeyword.trim()}
                  className="shrink-0 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Keyword
                </Button>
              </form>

              <div className="sm:col-span-4 relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  value={keywordSearch}
                  onChange={(e) => setKeywordSearch(e.target.value)}
                  placeholder="Filter keywords below..."
                  className="text-xs bg-white pl-8 h-9"
                />
              </div>
            </div>

            {/* KEYWORD PILLS / TAGS */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 min-h-24">
              <div className="flex flex-wrap gap-2 items-center">
                {filteredActiveList.map((term) => (
                  <span
                    key={term}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors shadow-2xs ${
                      activeKeywordTab === 'brand'
                        ? 'bg-violet-50 text-violet-800 border-violet-200 hover:bg-violet-100/70'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
                    }`}
                  >
                    <span>"{term}"</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteKeyword(term, activeKeywordTab)}
                      className="p-0.5 text-slate-400 hover:text-red-600 rounded cursor-pointer transition-colors"
                      title={`Delete "${term}"`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                {filteredActiveList.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-2">
                    {keywordSearch
                      ? 'No matching keywords found in filter.'
                      : `No ${activeKeywordTab === 'brand' ? 'branded' : 'non-branded'} keywords configured yet. Type above or click Bulk Add.`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>
                Tip: Search queries containing any <strong>Branded Keyword</strong> will be categorized under Brand metrics, unless overridden by an explicit Non-Brand keyword.
              </span>
              {isDirty && (
                <span className="font-semibold text-amber-600">
                  ⚠️ Unsaved modifications pending.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: BRANDED VS NON-BRANDED PERFORMANCE METRICS */}
      <SectionCard
        icon={Tag}
        title="Branded vs Non-Branded Performance"
        subtitle={comparisonLabel || `${curLabel} vs ${prevLabel}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs text-violet-700 bg-violet-50/50 border-violet-200">
              Live Search Console Analysis
            </Badge>
          </div>
        }
      >
        <Tabs defaultValue="all">
          <TabsList>
            {Object.entries(TAB_LABELS).map(([key, label]) => (
              <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
            ))}
          </TabsList>
          {Object.keys(TAB_LABELS).map((key) => (
            <TabsContent key={key} value={key}>
              <BrandTabPanel
                data={brandQueries[key]}
                prevLabel={prevLabel}
                curLabel={curLabel}
              />
            </TabsContent>
          ))}
        </Tabs>
      </SectionCard>

      {/* SECTION 3: SEARCH QUERY CLASSIFICATION TABLE WITH 1-CLICK CATEGORIZATION */}
      <SectionCard
        icon={Search}
        title="Search Query Classification Table"
        subtitle="Live search query ranking and engagement filtered by active brand matching rules"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setQueryTab('brand')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                queryTab === 'brand'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🏷️ Top Brand Queries ({topBrandQueries.length})
            </button>
            <button
              type="button"
              onClick={() => setQueryTab('nonBrand')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                queryTab === 'nonBrand'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🌐 Top Non-Brand Queries ({topNonBrandQueries.length})
            </button>
          </div>

          <span className="text-xs text-slate-500">
            Click <strong>+ Add to Brand</strong> or <strong>Move to Non-Brand</strong> to reclassify directly from the table.
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Query</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">Avg Position</TableHead>
              <TableHead className="text-right">Classifier Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(queryTab === 'brand' ? topBrandQueries : topNonBrandQueries).map((q, i) => {
              const isMarkedBrand = brandTerms.some((t) => q.query.toLowerCase().includes(t));
              return (
                <TableRow key={q.query} className="hover:bg-slate-50/70">
                  <TableCell className="text-center text-xs text-slate-400">{i + 1}</TableCell>
                  <TableCell className="font-semibold text-slate-900">{q.query}</TableCell>
                  <TableCell className="text-right font-bold text-slate-900">{q.clicks.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-slate-600">{q.impressions.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-slate-600">{q.ctr}</TableCell>
                  <TableCell className="text-right font-semibold text-slate-800">{q.position}</TableCell>
                  <TableCell className="text-right">
                    {queryTab === 'nonBrand' ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAddAsBrand(q.query)}
                        className="h-7 text-[11px] px-2 text-violet-700 bg-violet-50/70 border-violet-200 hover:bg-violet-100 cursor-pointer"
                        title="Add this query to Brand keywords"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        + Add to Brand
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickMoveToNonBrand(q.query)}
                        className="h-7 text-[11px] px-2 text-emerald-700 bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                        title="Move this query to Non-Brand"
                      >
                        <ArrowRightLeft className="h-3 w-3 mr-1" />
                        Move to Non-Brand
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {(queryTab === 'brand' ? topBrandQueries : topNonBrandQueries).length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-sm">
                  No queries found in this classification.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
