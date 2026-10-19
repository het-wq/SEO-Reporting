import React, { useMemo, useState } from 'react';
import { KeyRound, Search, Download, ArrowUpDown, Info } from 'lucide-react';
import SectionCard from '@/components/dashboard/SectionCard';
import NoReportData from '@/components/dashboard/NoReportData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useReport } from '@/context/ReportContext';
import { exportToCsv } from '@/lib/csvExport';

const RANGE_OPTIONS = [
  { value: 'all', label: 'All positions' },
  { value: '1-3', label: 'Top 3 (Positions 1-3)' },
  { value: '4-10', label: 'Top 10 (Positions 4-10)' },
  { value: '11+', label: 'Page 2+ (Position 11+)' },
];

export default function KeywordRankingsPage() {
  const { report, loading, selectedPeriod } = useReport();
  const [search, setSearch] = useState('');
  const [range, setRange] = useState('all');
  const [sortField, setSortField] = useState('clicks');
  const [sortAsc, setSortAsc] = useState(false);

  const curLabel = selectedPeriod?.label || 'Selected Period';

  const keywords = report?.keywordRankings || [];

  const filtered = useMemo(() => {
    let rows = keywords.filter((k) => (k.keyword || '').toLowerCase().includes(search.toLowerCase()));

    if (range === '1-3') rows = rows.filter((k) => k.position <= 3.0);
    if (range === '4-10') rows = rows.filter((k) => k.position > 3.0 && k.position <= 10.0);
    if (range === '11+') rows = rows.filter((k) => k.position > 10.0);

    rows = [...rows].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'position') {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return sortAsc ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
    });

    return rows;
  }, [keywords, search, range, sortField, sortAsc]);

  if (loading && !report) return <Skeleton className="h-96" />;
  if (!report || !report.keywordRankings) return <NoReportData />;

  const handleExport = () => {
    exportToCsv(
      `keyword-rankings-${curLabel.replace(/\s+/g, '-').toLowerCase()}`,
      filtered.map((k, i) => ({
        Rank: i + 1,
        Keyword: k.keyword,
        'Average Position': k.position,
        Clicks: k.clicks,
        Impressions: k.impressions,
        CTR: k.ctr,
        Tier: k.status,
      }))
    );
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(field === 'position'); // Default to ascending for position (1 is best)
    }
  };

  return (
    <SectionCard
      icon={KeyRound}
      title="Keyword Performance & Search Rankings"
      subtitle={`${curLabel} - Live Google Search Console queries and ranking metrics`}
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-blue-700 bg-blue-50/50 border-blue-200">
            Source: Google Search Console
          </Badge>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 bg-white">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      }
    >
      <div className="mb-4 p-3 rounded-lg bg-blue-50/60 border border-blue-100 flex items-start gap-2 text-xs text-blue-900 leading-relaxed">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p>
          <strong>Ranking Metric Note:</strong> The position shown represents the <strong>average ranking position</strong> in Google search results across all impressions for the selected reporting period.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search queries and keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>
        <Select value={range} onChange={(e) => setRange(e.target.value)} className="sm:w-56 text-sm">
          {RANGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>

      <div className="rounded-md border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Search Query / Keyword</TableHead>
              <TableHead className="w-32 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('position')}
                  className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  Avg Position <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead className="w-28 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('clicks')}
                  className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  Clicks <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead className="w-32 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('impressions')}
                  className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  Impressions <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead className="w-24 text-right">CTR</TableHead>
              <TableHead className="w-28 text-center">Tier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((k, i) => (
              <TableRow key={k.keyword}>
                <TableCell className="text-center text-xs text-slate-400">{i + 1}</TableCell>
                <TableCell className="font-semibold text-slate-900">{k.keyword}</TableCell>
                <TableCell className="text-right font-bold text-slate-900">{k.position}</TableCell>
                <TableCell className="text-right text-slate-700 font-semibold">{k.clicks.toLocaleString()}</TableCell>
                <TableCell className="text-right text-slate-600">{k.impressions.toLocaleString()}</TableCell>
                <TableCell className="text-right text-slate-600">{k.ctr}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={k.position <= 3 ? 'success' : k.position <= 10 ? 'default' : 'secondary'}
                    className="font-normal text-[11px]"
                  >
                    {k.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-sm text-slate-500">
                  {keywords.length === 0
                    ? 'No search queries recorded for this period in Search Console.'
                    : 'No queries match your search filter.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
}
