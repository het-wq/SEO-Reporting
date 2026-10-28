import React from 'react';
import MetricBox from './MetricBox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Monitor, Smartphone, Tablet } from 'lucide-react';

export default function SearchConsoleSection({ gscOverview, deviceTraffic, periodName, prevPeriodName }) {
  if (!gscOverview) return null;

  return (
    <Card className="border border-slate-200/80 bg-white/50 backdrop-blur-xs shadow-xs mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-emerald-50 text-[#14532D]">
            <Search className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold text-slate-900">
            Google Search Console Overview
          </CardTitle>
        </div>
        <Badge variant="outline" className="font-normal text-slate-500 bg-slate-50">
          {periodName} vs {prevPeriodName}
        </Badge>
      </CardHeader>

      <CardContent className="pt-5 space-y-6">
        {/* Core KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {gscOverview.map((item) => (
            <MetricBox
              key={item.key}
              title={item.label}
              value={item.current?.toLocaleString ? item.current.toLocaleString() : item.current}
              previousValue={item.previous?.toLocaleString ? item.previous.toLocaleString() : item.previous}
              diff={item.diff}
              improvement={item.improvement}
              invertColor={item.invertColor}
              subtitle={
                item.key === 'position'
                  ? 'Average ranking position'
                  : item.key === 'ctr'
                  ? 'Click-Through Rate'
                  : 'Total organic impressions & clicks'
              }
            />
          ))}
        </div>

        {/* Device breakdown cards */}
        {deviceTraffic && deviceTraffic.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Device Breakdown (Organic Search)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {deviceTraffic.map((d) => (
                <div
                  key={d.device}
                  className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-medium text-slate-800 text-sm">
                      {d.device.toLowerCase() === 'desktop' ? (
                        <Monitor className="h-4 w-4 text-slate-500" />
                      ) : d.device.toLowerCase() === 'mobile' ? (
                        <Smartphone className="h-4 w-4 text-slate-500" />
                      ) : (
                        <Tablet className="h-4 w-4 text-slate-500" />
                      )}
                      <span>{d.device}</span>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-base font-bold text-slate-900">{d.current.toLocaleString()} clicks</span>
                    {d.impressions !== undefined && (
                      <span className="text-slate-500">{d.impressions.toLocaleString()} imp</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
