import React from 'react';
import { MapPin, Settings, ExternalLink, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import SectionCard from '@/components/dashboard/SectionCard';
import NoReportData from '@/components/dashboard/NoReportData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useReport } from '@/context/ReportContext';

export default function LocalSeoPage() {
  const { report, loading, selectedPeriod, previousPeriod, comparisonLabel } = useReport();

  if (loading && !report) return <Skeleton className="h-96" />;
  if (!report) return <NoReportData />;

  const localSeo = report.localSeo || { configured: false };
  const prevLabel = previousPeriod?.label || 'Previous Period';
  const curLabel = selectedPeriod?.label || 'Selected Period';

  const navigateToSettings = () => {
    const navBtn = document.querySelector('[data-page="settings"]');
    if (navBtn) navBtn.click();
  };

  const navigateToKeywords = () => {
    const navBtn = document.querySelector('[data-page="keywords"]');
    if (navBtn) navBtn.click();
  };

  return (
    <div className="space-y-6">
      <SectionCard
        icon={MapPin}
        title="Local SEO & Google Maps Visibility"
        subtitle={`${curLabel} vs ${prevLabel} - Local rank tracking and business profile`}
        actions={
          <Badge variant={localSeo.configured ? 'success' : 'outline'} className="text-xs">
            {localSeo.configured ? `Connected: ${localSeo.provider}` : 'Provider Setup Required'}
          </Badge>
        }
      >
        {localSeo.configured ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">Connected to {localSeo.provider}.</p>
            {/* If local grids exist from provider, render them */}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none my-2">
            <CardContent className="py-10 px-6 max-w-2xl mx-auto text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-50 text-[#14532D] flex items-center justify-center mx-auto ring-8 ring-emerald-50/60">
                <MapPin className="h-7 w-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">
                  Local Rank Tracking Provider Integration Required
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
                  Google Maps 3x3 local geo-grid ranking maps require a specialized local SERP rank tracker API (such as BrightLocal, Local Falcon, or DataForSEO Maps SERP API). Google Business Profile APIs provide profile call and direction insights, but do not generate geo-coordinate grid rank data.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white border border-slate-200 text-left space-y-2 text-xs">
                <p className="font-semibold text-slate-800">Supported Integration Options:</p>
                <ul className="space-y-1.5 text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#14532D] shrink-0" />
                    <span><strong>BrightLocal API v4:</strong> Automates local 3x3 geo-grid ranking scans across targeted service areas.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#14532D] shrink-0" />
                    <span><strong>Google Business Profile API:</strong> Direct telemetry on Google Maps profile views, phone calls, and direction clicks.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#14532D] shrink-0" />
                    <span><strong>Google Search Console:</strong> Verified organic search rankings for local business queries are available right now.</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <Button size="sm" onClick={navigateToSettings} className="gap-1.5 text-xs font-semibold">
                  <Settings className="h-3.5 w-3.5" />
                  <span>Configure Local Provider in Settings</span>
                </Button>
                <Button variant="outline" size="sm" onClick={navigateToKeywords} className="gap-1.5 text-xs bg-white text-slate-700">
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>View Local Search Queries</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </SectionCard>
    </div>
  );
}
