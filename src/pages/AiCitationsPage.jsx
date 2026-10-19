import React from 'react';
import { Sparkles, Bot, Settings, CheckCircle2 } from 'lucide-react';
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

export default function AiCitationsPage() {
  const { report, loading, selectedPeriod, previousPeriod, comparisonLabel } = useReport();

  if (loading && !report) return <Skeleton className="h-96" />;
  if (!report) return <NoReportData />;

  const aiCitations = report.aiCitations || { configured: false };
  const prevLabel = previousPeriod?.label || 'Previous Period';
  const curLabel = selectedPeriod?.label || 'Selected Period';

  const navigateToSettings = () => {
    const navBtn = document.querySelector('[data-page="settings"]');
    if (navBtn) navBtn.click();
  };

  return (
    <div className="space-y-6">
      <SectionCard
        icon={Sparkles}
        iconClassName="bg-violet-50 text-violet-600"
        title="AI Search Visibility & Citations"
        subtitle={`${curLabel} vs ${prevLabel} - LLM engine tracking`}
        actions={
          <Badge variant={aiCitations.configured ? 'success' : 'outline'} className="text-xs">
            {aiCitations.configured ? `Connected: ${aiCitations.provider}` : 'Provider Setup Required'}
          </Badge>
        }
      >
        {aiCitations.configured ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">Connected to {aiCitations.provider}.</p>
          </div>
        ) : (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none my-2">
            <CardContent className="py-10 px-6 max-w-2xl mx-auto text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mx-auto ring-8 ring-violet-50/60">
                <Sparkles className="h-7 w-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">
                  AI Search Visibility Provider Integration Required
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
                  Tracking AI citations across Google AI Overviews, Perplexity AI, and ChatGPT Search requires an active AI search visibility provider API. No provider API key is currently configured.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white border border-slate-200 text-left space-y-2 text-xs">
                <p className="font-semibold text-slate-800">Supported AI Search Tracking Options:</p>
                <ul className="space-y-1.5 text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                    <span><strong>Perplexity Search API:</strong> Queries live Perplexity AI citations and grounded web sources for Appliance Care of Atlanta.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                    <span><strong>DataForSEO LLM Mentions:</strong> Automated brand citation monitoring across ChatGPT, Google Gemini, and Claude.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                    <span><strong>Google Search Console:</strong> Track conversational, question-based search queries in the Search Console queries tab.</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <Button size="sm" onClick={navigateToSettings} className="gap-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white">
                  <Settings className="h-3.5 w-3.5" />
                  <span>Configure AI Visibility Provider in Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </SectionCard>
    </div>
  );
}
