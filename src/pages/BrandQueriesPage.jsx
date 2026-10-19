import React, { useState } from 'react';
import { Tag, Search, Sparkles, Filter } from 'lucide-react';
import SectionCard from '@/components/dashboard/SectionCard';
import MetricBox from '@/components/MetricBox';
import ComparisonBarChart from '@/components/charts/ComparisonBarChart';
import NoReportData from '@/components/dashboard/NoReportData';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useReport } from '@/context/ReportContext';

const TAB_LABELS = { all: 'All Devices', desktop: 'Desktop', mobile: 'Mobile' };

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
          currentColor="#7c3aed"
          height={260}
          previousLabel={prevLabel}
          currentLabel={curLabel}
        />
        <ComparisonBarChart
          data={impressionsChartData}
          currentColor="#7c3aed"
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
  const { report, loading, selectedPeriod, previousPeriod, comparisonLabel } = useReport();
  const [queryTab, setQueryTab] = useState('brand');

  if (loading && !report) return <Skeleton className="h-96" />;
  if (!report || !report.brandQueries) return <NoReportData />;

  const { brandQueries } = report;

  const prevLabel = previousPeriod?.label || 'Previous Period';
  const curLabel = selectedPeriod?.label || 'Selected Period';

  const brandTerms = brandQueries.brandTerms || ['Appliance Care of Atlanta', 'Appliance Care'];
  const topBrandQueries = brandQueries.topBrandQueries || [];
  const topNonBrandQueries = brandQueries.topNonBrandQueries || [];

  return (
    <div className="space-y-6">
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
        {/* Brand matching keywords configuration badge */}
        <div className="mb-5 p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 flex-wrap">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-violet-600" /> Active Brand Matching Rules:
            </span>
            {brandTerms.map((term) => (
              <Badge key={term} variant="secondary" className="font-mono text-[11px] bg-white border border-slate-200 text-slate-800">
                "{term}"
              </Badge>
            ))}
          </div>
          <span className="text-slate-500">
            {brandQueries.totalRowsAnalyzed ? `${brandQueries.totalRowsAnalyzed.toLocaleString()} search queries classified dynamically` : 'Dynamic query classifier active'}
          </span>
        </div>

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

      {/* Top Brand vs Non-Brand Queries Breakdown Tables */}
      <SectionCard
        icon={Search}
        title="Search Query Classification Table"
        subtitle="Live search query ranking and engagement filtered by brand matching rule"
      >
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setQueryTab('brand')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              queryTab === 'brand' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Top Brand Queries ({topBrandQueries.length})
          </button>
          <button
            type="button"
            onClick={() => setQueryTab('nonBrand')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              queryTab === 'nonBrand' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Top Non-Brand Queries ({topNonBrandQueries.length})
          </button>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {(queryTab === 'brand' ? topBrandQueries : topNonBrandQueries).map((q, i) => (
              <TableRow key={q.query}>
                <TableCell className="text-center text-xs text-slate-400">{i + 1}</TableCell>
                <TableCell className="font-semibold text-slate-900">{q.query}</TableCell>
                <TableCell className="text-right font-bold text-slate-900">{q.clicks.toLocaleString()}</TableCell>
                <TableCell className="text-right text-slate-600">{q.impressions.toLocaleString()}</TableCell>
                <TableCell className="text-right text-slate-600">{q.ctr}</TableCell>
                <TableCell className="text-right font-semibold text-slate-800">{q.position}</TableCell>
              </TableRow>
            ))}
            {(queryTab === 'brand' ? topBrandQueries : topNonBrandQueries).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500 text-sm">
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
