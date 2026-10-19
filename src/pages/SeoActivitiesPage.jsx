import React, { useMemo, useState } from 'react';
import { ListChecks, Search, ExternalLink, Download, BarChart3 } from 'lucide-react';
import SectionCard from '@/components/dashboard/SectionCard';
import NoReportData from '@/components/dashboard/NoReportData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useReport } from '@/context/ReportContext';
import { exportToCsv } from '@/lib/csvExport';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const COLORS = ['#2563eb', '#7c3aed', '#0ea5e9', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#db2777', '#4f46e5', '#65a30d'];

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export default function SeoActivitiesPage() {
  const { report, loading, selectedPeriod } = useReport();
  const [search, setSearch] = useState('');

  const curLabel = selectedPeriod?.label || report?.period || 'Selected Month';

  const allPosts = useMemo(() => {
    if (!report || !report.seoActivities) return [];
    const { onsiteBlogPosts = [], offsiteBlogPosts = [] } = report.seoActivities;
    return [
      ...onsiteBlogPosts.map((url) => ({ url, type: 'On-site blog' })),
      ...offsiteBlogPosts.map((url) => ({ url, type: 'Guest / off-site' })),
    ];
  }, [report]);

  const filteredPosts = useMemo(
    () => allPosts.filter((p) => p.url.toLowerCase().includes(search.toLowerCase())),
    [allPosts, search]
  );

  if (loading && !report) return <Skeleton className="h-96" />;
  if (!report) return <NoReportData />;

  const { offPageActivities = [] } = report.seoActivities || {};

  const handleExport = () => {
    exportToCsv(`seo-activities-${curLabel.replace(/\s+/g, '-').toLowerCase()}`,
      filteredPosts.map((p) => ({ URL: p.url, Type: p.type }))
    );
  };

  return (
    <div className="space-y-6">
      <SectionCard
        icon={ListChecks}
        title="Content Published This Month"
        subtitle={`${curLabel} - ${allPosts.length} posts across owned and off-site channels`}
        actions={
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 bg-white">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        }
      >
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead className="w-40">Source</TableHead>
              <TableHead className="w-32">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.map((p) => (
              <TableRow key={p.url}>
                <TableCell>
                  <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline break-all">
                    {p.url}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </TableCell>
                <TableCell className="text-sm text-slate-600">{hostnameOf(p.url)}</TableCell>
                <TableCell>
                  <Badge variant={p.type === 'On-site blog' ? 'info' : 'secondary'}>{p.type}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {filteredPosts.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-500">No posts match "{search}".</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard icon={BarChart3} iconClassName="bg-emerald-50 text-emerald-600" title="Off-Page Activities" subtitle={`${curLabel} submission counts by activity type`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {offPageActivities.map((a) => (
            <div key={a.type} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-center">
              <p className="text-2xl font-bold text-slate-900">{a.count}</p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">{a.type}</p>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={offPageActivities} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#64748b' }} angle={-35} textAnchor="end" interval={0} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={32} />
            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {offPageActivities.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>
  );
}
