import React from 'react';
import { Link2, Settings, CheckCircle2, ShieldCheck } from 'lucide-react';
import SectionCard from '@/components/dashboard/SectionCard';
import MetricBox from '@/components/MetricBox';
import NoReportData from '@/components/dashboard/NoReportData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useReport } from '@/context/ReportContext';

const METRIC_LABELS = {
  domainAuthority: 'Domain Authority (DA)',
  pageAuthority: 'Page Authority (PA)',
  totalBacklinks: 'Total Backlinks',
  referringDomains: 'Referring Domains',
  dofollow: 'Dofollow Links',
  nofollow: 'Nofollow Links',
  openPageRank: 'OpenPageRank Score',
};

export default function BacklinksPage() {
  const { report, loading, selectedPeriod, previousPeriod, comparisonLabel } = useReport();

  if (loading && !report) return <Skeleton className="h-96" />;
  if (!report) return <NoReportData />;

  const backlinks = report.backlinks || { configured: false };
  const prevLabel = previousPeriod?.label || 'Previous Period';
  const curLabel = selectedPeriod?.label || 'Selected Period';

  const navigateToSettings = () => {
    const navBtn = document.querySelector('[data-page="settings"]');
    if (navBtn) navBtn.click();
  };

  return (
    <div className="space-y-6">
      <SectionCard
        icon={Link2}
        title="Backlinks & Domain Authority"
        subtitle={`${curLabel} vs ${prevLabel} - External link intelligence`}
        actions={
          <Badge variant={backlinks.configured ? 'success' : 'outline'} className="text-xs">
            {backlinks.configured ? `Connected: ${backlinks.provider}` : 'Provider Setup Required'}
          </Badge>
        }
      >
        {backlinks.configured && backlinks.hasMetrics ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
              {Object.entries(backlinks.metrics).map(([key, m]) => (
                <MetricBox
                  key={key}
                  title={METRIC_LABELS[key] || key}
                  value={typeof m.current === 'number' ? m.current.toLocaleString() : m.current}
                  previousValue={typeof m.previous === 'number' ? m.previous.toLocaleString() : m.previous}
                  diff={m.diffPct || 0}
                />
              ))}
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
                {Object.entries(backlinks.metrics).map(([key, m]) => (
                  <TableRow key={key}>
                    <TableCell className="font-semibold text-slate-900">{METRIC_LABELS[key] || key}</TableCell>
                    <TableCell className="text-right text-slate-600">{m.previous}</TableCell>
                    <TableCell className="text-right font-bold text-slate-900">{m.current}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">
                      {m.diffPct > 0 ? '+' : ''}{m.diffPct}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none my-2">
            <CardContent className="py-10 px-6 max-w-2xl mx-auto text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto ring-8 ring-blue-50/60">
                <Link2 className="h-7 w-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">
                  Backlink Provider Integration Required
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
                  Google APIs (GA4 and Search Console) do not provide external third-party Domain Authority scores or third-party web backlink indexes. Live backlink tracking requires connecting an external provider API.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white border border-slate-200 text-left space-y-2 text-xs">
                <p className="font-semibold text-slate-800">Supported Link Intelligence Providers:</p>
                <ul className="space-y-1.5 text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span><strong>Moz API v2:</strong> Supplies Domain Authority (DA), Page Authority (PA), and linking domain metrics.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span><strong>OpenPageRank API:</strong> Free page rank decimal scores for domain authority benchmarking.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span><strong>DataForSEO Backlinks API:</strong> Complete backlink index with referring pages, anchors, and dofollow/nofollow distributions.</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <Button size="sm" onClick={navigateToSettings} className="gap-1.5 text-xs font-semibold">
                  <Settings className="h-3.5 w-3.5" />
                  <span>Configure Backlink Provider in Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </SectionCard>
    </div>
  );
}
