import React from 'react';
import MetricBox from './MetricBox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';

export default function TrafficSection({ gaOverview, periodName, prevPeriodName }) {
  if (!gaOverview) return null;

  return (
    <Card className="border border-slate-200/80 bg-white/50 backdrop-blur-xs shadow-xs mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-emerald-50 text-[#14532D]">
            <Globe className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold text-slate-900">
            Website Traffic (Google Analytics 4 Overview)
          </CardTitle>
        </div>
        <Badge variant="outline" className="font-normal text-slate-500 bg-slate-50">
          {periodName} vs {prevPeriodName}
        </Badge>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {gaOverview.map((item) => (
            <MetricBox
              key={item.key}
              title={item.label}
              value={item.current?.toLocaleString ? item.current.toLocaleString() : item.current}
              previousValue={item.previous?.toLocaleString ? item.previous.toLocaleString() : item.previous}
              diff={item.diff}
              subtitle={item.key === 'time_on_site' ? 'Avg session duration' : 'Total recorded sessions'}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
