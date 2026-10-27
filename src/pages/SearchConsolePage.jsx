import React from 'react';
import { Search, HelpCircle, ExternalLink, Globe } from 'lucide-react';
import SectionCard from '@/components/dashboard/SectionCard';
import MetricBox from '@/components/MetricBox';
import ComparisonBarChart from '@/components/charts/ComparisonBarChart';
import NoReportData from '@/components/dashboard/NoReportData';
import { Tooltip } from '@/components/ui/tooltip';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useReport } from '@/context/ReportContext';

const DEFINITIONS = {
  Clicks: 'The number of times a user clicked through to the website from a Google search result.',
  Impressions: 'The number of times a link to the website appeared in Google search results.',
  'Average CTR': 'Click-Through Rate: clicks divided by impressions - the share of searchers who clicked.',
  'Average Position': "The website's average ranking position in Google search results. Lower numbers mean a higher (better) ranking.",
};

function MetricLabel({ label }) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <Tooltip content={DEFINITIONS[label]} side="top">
        <HelpCircle className="h-3 w-3 text-slate-400 cursor-help" />
      </Tooltip>
    </span>
  );
}

export default function SearchConsolePage() {
  const { report, loading, selectedPeriod, previousPeriod, comparisonLabel } = useReport();

  if (loading && !report) return <Skeleton className="h-96" />;
  if (!report || !report.searchConsole) return <NoReportData />;

  const { searchConsole } = report;

  const prevLabel = previousPeriod?.label || 'Previous Period';
  const curLabel = selectedPeriod?.label || 'Selected Period';

  const metrics = [
    { label: 'Clicks', m: searchConsole.clicks || { current: 0, previous: 0, diffPct: 0 }, fmt: (v) => Number(v || 0).toLocaleString() },
    { label: 'Impressions', m: searchConsole.impressions || { current: 0, previous: 0, diffPct: 0 }, fmt: (v) => Number(v || 0).toLocaleString() },
    {
      label: 'Average CTR',
      m: searchConsole.avgCtr || { current: 0, previous: 0, diffPct: 0 },
      fmt: () => searchConsole.avgCtr?.currentText || `${Number(searchConsole.avgCtr?.current || 0).toFixed(2)}%`,
      prevFmt: () => searchConsole.avgCtr?.previousText || `${Number(searchConsole.avgCtr?.previous || 0).toFixed(2)}%`,
    },
    {
      label: 'Average Position',
      m: searchConsole.avgPosition || { current: 0, previous: 0, diffPct: 0 },
      fmt: () => searchConsole.avgPosition?.currentText || Number(searchConsole.avgPosition?.current || 0).toFixed(1),
      prevFmt: () => searchConsole.avgPosition?.previousText || Number(searchConsole.avgPosition?.previous || 0).toFixed(1),
      invert: true,
    },
  ];

  const chartData = [
    { name: 'Clicks', previous: searchConsole.clicks?.previous || 0, current: searchConsole.clicks?.current || 0 },
    { name: 'Impressions', previous: searchConsole.impressions?.previous || 0, current: searchConsole.impressions?.current || 0 },
  ];

  const landingPages = searchConsole.landingPages || [];

  return (
    <div className="space-y-6">
      <SectionCard
        icon={Search}
        title="Google Search Console Performance"
        subtitle={comparisonLabel || `${curLabel} vs ${prevLabel}`}
        actions={
          <Badge variant="outline" className="text-xs text-blue-700 bg-blue-50/50 border-blue-200">
            Source: Search Console ({searchConsole.siteUrl || 'Configured Site'})
          </Badge>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
          {metrics.map((item) => (
            <MetricBox
              key={item.label}
              title={<MetricLabel label={item.label} />}
              value={item.fmt(item.m.current)}
              previousValue={item.prevFmt ? item.prevFmt() : item.fmt(item.m.previous)}
              diff={item.m.diffPct}
              improvement={item.m.improvement}
              invertColor={item.invert}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 mb-2">Clicks and impressions are displayed on separate scales for optimal visual clarity.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ComparisonBarChart
            data={[chartData[0]]}
            height={280}
            previousLabel={prevLabel}
            currentLabel={curLabel}
          />
          <ComparisonBarChart
            data={[chartData[1]]}
            height={280}
            previousLabel={prevLabel}
            currentLabel={curLabel}
          />
        </div>
      </SectionCard>

      <SectionCard icon={Search} title="Detailed Search Console Metrics">
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
            {metrics.map((item) => (
              <TableRow key={item.label}>
                <TableCell className="font-medium text-slate-900"><MetricLabel label={item.label} /></TableCell>
                <TableCell className="text-right text-slate-600">{item.prevFmt ? item.prevFmt() : item.fmt(item.m.previous)}</TableCell>
                <TableCell className="text-right font-semibold text-slate-900">{item.fmt(item.m.current)}</TableCell>
                <TableCell className={`text-right font-semibold ${item.m.improvement ? 'text-emerald-600' : item.m.improvement === null ? 'text-slate-500' : 'text-red-600'}`}>
                  {item.m.diffPct > 0 ? '+' : ''}{item.m.diffPct}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      {landingPages.length > 0 && (
        <SectionCard icon={Globe} title="Top Landing Pages (Search Console)" subtitle="Most visited URLs from Google Organic Search results">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page URL</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Avg Position</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {landingPages.map((p) => (
                <TableRow key={p.page}>
                  <TableCell className="font-mono text-xs text-slate-800 max-w-md truncate">
                    <a href={p.page} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                      <span>{p.page}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                    </a>
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900">{p.clicks.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-slate-600">{p.impressions.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-slate-600">{p.ctr}</TableCell>
                  <TableCell className="text-right font-medium text-slate-800">{p.position}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      )}
    </div>
  );
}
