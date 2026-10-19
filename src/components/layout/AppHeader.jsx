import React from 'react';
import { Menu, RefreshCw, Download, Printer, ChevronRight, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import MonthSelector from '@/components/dashboard/MonthSelector';
import { useReport } from '@/context/ReportContext';

export default function AppHeader({ pageTitle, onOpenMobileSidebar, onExportCsv }) {
  const { comparisonLabel, loading, error, refresh } = useReport();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md print:hidden">
      <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="md:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Appliance Care of Atlanta</span>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-slate-700">{pageTitle}</span>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap mt-0.5">
              <h1 className="text-lg font-bold text-slate-900 leading-tight truncate">{pageTitle}</h1>
              {comparisonLabel && (
                <Badge variant="outline" className="hidden lg:inline-flex bg-slate-50 text-slate-700 border-slate-200 font-medium text-xs">
                  {comparisonLabel}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <MonthSelector />

          <Button
            variant="outline"
            size="icon"
            onClick={refresh}
            disabled={loading}
            title="Refresh report data"
            className="h-9 w-9 bg-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 bg-white">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {onExportCsv && (
                <DropdownMenuItem onSelect={onExportCsv}>
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => window.print()}>
                <Printer className="h-3.5 w-3.5" /> Print / Save as PDF
              </DropdownMenuItem>
              {!onExportCsv && (
                <>
                  <DropdownMenuSeparator />
                  <p className="px-2 py-1 text-[11px] text-slate-400">CSV export is available on table pages</p>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-slate-100">
                <User className="h-4 w-4 text-slate-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <p className="px-2 py-1.5 text-xs text-slate-500">Signed in as <span className="font-medium text-slate-700">Agency Admin</span></p>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setSelectedId((id) => id)}>
                Appliance Care of Atlanta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {error && (
        <div className="px-4 sm:px-6 pb-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />
              <span>{typeof error === 'object' ? error.message : error}</span>
            </div>
            {error?.actionUrl && (
              <a
                href={error.actionUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold underline text-red-800 hover:text-red-950 inline-flex items-center gap-1"
              >
                {error.actionLabel || 'Fix in Google Cloud Console'} →
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
