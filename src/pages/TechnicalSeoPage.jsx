import React from 'react';
import { Wrench, CheckCircle2 } from 'lucide-react';
import SectionCard from '@/components/dashboard/SectionCard';
import NoReportData from '@/components/dashboard/NoReportData';
import { Skeleton } from '@/components/ui/skeleton';
import { useReport } from '@/context/ReportContext';

export default function TechnicalSeoPage() {
  const { report, loading, selectedPeriod } = useReport();

  if (loading && !report) return <Skeleton className="h-96" />;
  if (!report) return <NoReportData />;

  const curLabel = selectedPeriod?.label || report?.period || 'Selected Month';
  const { completedChanges = [] } = report.technicalSeo || {};

  return (
    <SectionCard
      icon={Wrench}
      title="Technical SEO - Changes Completed"
      subtitle={`${curLabel} - ${completedChanges.length} on-page and technical fixes shipped`}
    >
      <ol className="relative border-l border-slate-200 ml-2 space-y-5">
        {completedChanges.map((change, i) => (
          <li key={i} className="ml-5">
            <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            </span>
            <p className="text-sm text-slate-800">{change}</p>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
