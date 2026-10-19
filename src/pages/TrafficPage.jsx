import React from 'react';
import { Globe, TrendingUp, TrendingDown, Clock, BarChart3, Users } from 'lucide-react';
import SectionCard from '@/components/dashboard/SectionCard';
import MetricBox from '@/components/MetricBox';
import ComparisonBarChart from '@/components/charts/ComparisonBarChart';
import NoReportData from '@/components/dashboard/NoReportData';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useReport } from '@/context/ReportContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function TrafficPage() {
  const { report, loading, selectedPeriod, previousPeriod, comparisonLabel } = useReport();

  if (loading && !report) return <Skeleton className="h-96" />;
  if (!report || !report.traffic) return <NoReportData />;

  const { traffic } = report;

  const prevLabel = previousPeriod?.label || 'Previous Period';
  const curLabel = selectedPeriod?.label || 'Selected Period';

  const rows = [
    { label: 'Total Website Traffic (Sessions)', m: traffic.overall || { current: 0, previous: 0, diffPct: 0 } },
    { label: 'Organic Search Traffic', m: traffic.organic || { current: 0, previous: 0, diffPct: 0 } },
    { label: 'Direct Visits', m: traffic.direct || { current: 0, previous: 0, diffPct: 0 } },
    { label: 'Organic New Users', m: traffic.organicNewUsers || { current: 0, previous: 0, diffPct: 0 } },
  ];

  const chartData = rows.map((r) => ({
    name: r.label.replace(' (Sessions)', '').replace('Website ', ''),
    previous: r.m.previous || 0,
    current: r.m.current || 0,
  }));

  const channelAcquisition = traffic.channelAcquisition || [];
  const dailyTrends = traffic.dailyTrends || [];

  return (
    <div className="space-y-6">
      <SectionCard
        icon={Globe}
        title="Website Traffic Overview"
        subtitle={`${curLabel} vs ${prevLabel} - Google Analytics 4`}
        actions={
          <Badge variant="outline" className="text-xs text-blue-700 bg-blue-50/50 border-blue-200">
            Source: GA4 Property {traffic.propertyId || '516707960'}
          </Badge>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
          {rows.map((r) => (
            <MetricBox
              key={r.label}
              title={r.label}
              value={r.m.current ? r.m.current.toLocaleString() : '0'}
              previousValue={r.m.previous ? r.m.previous.toLocaleString() : '0'}
              diff={r.m.diffPct}
            />
          ))}
        </div>
        <ComparisonBarChart
          data={chartData}
          height={300}
          previousLabel={prevLabel}
          currentLabel={curLabel}
        />
      </SectionCard>

      {/* Engagement Duration & Rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard icon={Clock} iconClassName="bg-violet-50 text-violet-600" title="Organic Engagement Duration">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                <p className="text-xs text-slate-500 mb-1">{prevLabel}</p>
                <p className="text-2xl font-bold text-slate-900">{traffic.timeOnSiteOrganic?.previous || '0m 0s'}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4 bg-white">
                <p className="text-xs text-slate-500 mb-1">{curLabel}</p>
                <p className="text-2xl font-bold text-slate-900">{traffic.timeOnSiteOrganic?.current || '0m 0s'}</p>
              </div>
            </div>
            <Badge variant={traffic.timeOnSiteOrganic?.improvement ? 'success' : 'secondary'} className="text-sm px-3 py-1.5 font-semibold self-start sm:self-center">
              {traffic.timeOnSiteOrganic?.diffPct > 0 ? '+' : ''}{traffic.timeOnSiteOrganic?.diffPct || 0}% change
            </Badge>
          </div>
        </SectionCard>

        <SectionCard icon={Users} iconClassName="bg-emerald-50 text-emerald-600" title="User Engagement Rate">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                <p className="text-xs text-slate-500 mb-1">{prevLabel}</p>
                <p className="text-2xl font-bold text-slate-900">{traffic.engagementRate?.previous || '0.0%'}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4 bg-white">
                <p className="text-xs text-slate-500 mb-1">{curLabel}</p>
                <p className="text-2xl font-bold text-slate-900">{traffic.engagementRate?.current || '0.0%'}</p>
              </div>
            </div>
            <Badge variant={traffic.engagementRate?.improvement ? 'success' : 'secondary'} className="text-sm px-3 py-1.5 font-semibold self-start sm:self-center">
              {traffic.engagementRate?.diffPct > 0 ? '+' : ''}{traffic.engagementRate?.diffPct || 0}%
            </Badge>
          </div>
        </SectionCard>
      </div>

      {/* Daily Traffic Trends Chart */}
      {dailyTrends.length > 0 && (
        <SectionCard icon={BarChart3} title="Daily Traffic Trend" subtitle="Daily sessions and active users over the reporting period">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyTrends} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="sessions" stroke="#2563eb" strokeWidth={2} name="Sessions" dot={false} />
              <Line type="monotone" dataKey="activeUsers" stroke="#10b981" strokeWidth={2} name="Active Users" dot={false} />
              <Line type="monotone" dataKey="newUsers" stroke="#8b5cf6" strokeWidth={1.5} name="New Users" strokeDasharray="3 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>
      )}

      {/* Traffic Acquisition by Channel Table */}
      <SectionCard icon={Globe} title="Traffic Acquisition by Channel" subtitle="Detailed breakdown from Google Analytics 4 sessionDefaultChannelGroup">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Channel Group</TableHead>
              <TableHead className="text-right">{prevLabel} Sessions</TableHead>
              <TableHead className="text-right">{curLabel} Sessions</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead className="text-right">Total Users</TableHead>
              <TableHead className="text-right">New Users</TableHead>
              <TableHead className="text-right">Engagement Rate</TableHead>
              <TableHead className="text-right">Avg Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channelAcquisition.map((ch) => {
              const improved = ch.diffSessions > 0;
              const flat = ch.diffSessions === 0;
              return (
                <TableRow key={ch.channel}>
                  <TableCell className="font-semibold text-slate-900">{ch.channel}</TableCell>
                  <TableCell className="text-right text-slate-600">{ch.previousSessions.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold text-slate-900">{ch.currentSessions.toLocaleString()}</TableCell>
                  <TableCell className={`text-right font-semibold ${flat ? 'text-slate-500' : improved ? 'text-emerald-600' : 'text-red-600'}`}>
                    {ch.diffSessions > 0 ? '+' : ''}{ch.diffSessions}%
                  </TableCell>
                  <TableCell className="text-right text-slate-600">{ch.currentUsers.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-slate-600">{ch.currentNewUsers.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-slate-600">{ch.engagementRate}</TableCell>
                  <TableCell className="text-right text-slate-600">{ch.avgDuration}</TableCell>
                </TableRow>
              );
            })}
            {channelAcquisition.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500 text-sm">
                  No channel traffic recorded for this period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
