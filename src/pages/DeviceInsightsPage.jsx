import React from 'react';
import { Smartphone, Monitor, Tablet } from 'lucide-react';
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

export default function DeviceInsightsPage() {
  const { report, loading, selectedPeriod, previousPeriod, comparisonLabel } = useReport();

  if (loading && !report) return <Skeleton className="h-96" />;
  if (!report || !report.deviceClicks) return <NoReportData />;

  const { deviceClicks } = report;

  const prevLabel = previousPeriod?.label || 'Previous Period';
  const curLabel = selectedPeriod?.label || 'Selected Period';

  const chartData = [
    { name: 'Desktop', previous: deviceClicks.desktop?.previous || 0, current: deviceClicks.desktop?.current || 0 },
    { name: 'Mobile', previous: deviceClicks.mobile?.previous || 0, current: deviceClicks.mobile?.current || 0 },
  ];

  if (deviceClicks.tablet && (deviceClicks.tablet.current > 0 || deviceClicks.tablet.previous > 0)) {
    chartData.push({
      name: 'Tablet',
      previous: deviceClicks.tablet.previous || 0,
      current: deviceClicks.tablet.current || 0,
    });
  }

  const maxCurrent = Math.max(
    deviceClicks.desktop?.current || 0,
    deviceClicks.mobile?.current || 0,
    deviceClicks.tablet?.current || 0,
    1
  );

  const deviceList = [
    { label: 'Desktop', m: deviceClicks.desktop || { current: 0, previous: 0, diffPct: 0 }, icon: Monitor },
    { label: 'Mobile', m: deviceClicks.mobile || { current: 0, previous: 0, diffPct: 0 }, icon: Smartphone },
  ];

  if (deviceClicks.tablet && (deviceClicks.tablet.current > 0 || deviceClicks.tablet.previous > 0)) {
    deviceList.push({ label: 'Tablet', m: deviceClicks.tablet, icon: Tablet });
  }

  return (
    <div className="space-y-6">
      <SectionCard
        icon={Smartphone}
        title="Device Insights"
        subtitle={`Search Console clicks by device - ${comparisonLabel || `${curLabel} vs ${prevLabel}`}`}
        actions={
          <Badge variant="outline" className="text-xs text-blue-700 bg-blue-50/50 border-blue-200">
            Source: Search Console (Device Dimension)
          </Badge>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
          <MetricBox
            title="Desktop Clicks"
            value={(deviceClicks.desktop?.current || 0).toLocaleString()}
            previousValue={(deviceClicks.desktop?.previous || 0).toLocaleString()}
            diff={deviceClicks.desktop?.diffPct || 0}
          />
          <MetricBox
            title="Mobile Clicks"
            value={(deviceClicks.mobile?.current || 0).toLocaleString()}
            previousValue={(deviceClicks.mobile?.previous || 0).toLocaleString()}
            diff={deviceClicks.mobile?.diffPct || 0}
          />
        </div>
        <ComparisonBarChart
          data={chartData}
          height={300}
          currentColor="#14532D"
          previousLabel={prevLabel}
          currentLabel={curLabel}
        />
      </SectionCard>

      <SectionCard icon={Monitor} title="Device Share Comparison">
        <div className="space-y-4 mb-6">
          {deviceList.map(({ label, m, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="w-16 text-sm font-medium text-slate-700">{label}</span>
              <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={label === 'Mobile' ? 'h-full bg-red-400 rounded-full' : 'h-full bg-[#14532D] rounded-full'}
                  style={{ width: `${Math.min(100, ((m.current || 0) / maxCurrent) * 100)}%` }}
                />
              </div>
              <span className="w-16 text-right text-sm font-semibold text-slate-900">{(m.current || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device Category</TableHead>
              <TableHead className="text-right">{prevLabel} Clicks</TableHead>
              <TableHead className="text-right">{curLabel} Clicks</TableHead>
              <TableHead className="text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deviceList.map(({ label, m }) => {
              const improved = (m.diffPct || 0) > 0;
              const flat = (m.diffPct || 0) === 0;
              return (
                <TableRow key={label}>
                  <TableCell className="font-semibold text-slate-900">{label}</TableCell>
                  <TableCell className="text-right text-slate-600">{(m.previous || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold text-slate-900">{(m.current || 0).toLocaleString()}</TableCell>
                  <TableCell className={`text-right font-semibold ${flat ? 'text-slate-500' : improved ? 'text-emerald-600' : 'text-red-600'}`}>
                    {(m.diffPct || 0) > 0 ? '+' : ''}{m.diffPct || 0}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
