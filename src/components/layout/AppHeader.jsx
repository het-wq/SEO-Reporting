import React from 'react';
import { Menu, RefreshCw, Download, Printer, ChevronRight, AlertCircle, LogOut } from 'lucide-react';
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
import { useAuth } from '@/context/AuthContext';

export default function AppHeader({ pageTitle, onOpenMobileSidebar, onExportCsv }) {
  const { comparisonLabel, loading, error, refresh, clientName } = useReport();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-[#EEF0EC] bg-white/90 backdrop-blur-md print:hidden">
      <div className="px-4 sm:px-7 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 text-[#6B7280] hover:bg-[#F3F4F1] rounded-full cursor-pointer transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
              <span className="font-medium">{clientName || 'Boulder Decision'}</span>
              <ChevronRight className="h-3 w-3 text-[#9CA3AF]" />
              <span className="font-semibold text-[#111827]">{pageTitle}</span>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap mt-0.5">
              <h1 className="text-xl font-bold text-[#111827] tracking-tight truncate leading-tight">
                {pageTitle}
              </h1>
              {comparisonLabel && (
                <Badge
                  variant="outline"
                  className="hidden lg:inline-flex bg-[#E3F4EA] text-[#1B6B45] border-transparent font-semibold text-xs px-3 py-0.5 rounded-full"
                >
                  {comparisonLabel}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <MonthSelector />

          <Button
            variant="outline"
            size="icon"
            onClick={refresh}
            disabled={loading}
            title="Refresh report data"
            className="h-9 w-9 rounded-full border border-[#EEF0EC] bg-white text-[#111827] hover:bg-[#F3F4F1] shadow-donezo"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#14532D]' : 'text-[#6B7280]'}`} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="gap-2 rounded-full bg-[#14532D] hover:bg-[#0E3B27] text-white px-4 h-9 shadow-donezo font-semibold text-xs cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl border-[#EEF0EC] shadow-donezo-md p-1.5">
              {onExportCsv && (
                <DropdownMenuItem onSelect={onExportCsv} className="rounded-xl text-xs font-semibold cursor-pointer">
                  <Download className="h-3.5 w-3.5 mr-2 text-[#14532D]" /> Export CSV
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => window.print()} className="rounded-xl text-xs font-semibold cursor-pointer">
                <Printer className="h-3.5 w-3.5 mr-2 text-[#14532D]" /> Print / Save as PDF
              </DropdownMenuItem>
              {!onExportCsv && (
                <>
                  <DropdownMenuSeparator className="bg-[#F3F4F1]" />
                  <p className="px-2.5 py-1 text-[11px] text-[#9CA3AF]">CSV export is available on table pages</p>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-gradient-to-br from-[#E3F4EA] to-[#D1EBDC] text-[#14532D] hover:opacity-90 border border-[#6CC59A]/30 cursor-pointer shadow-donezo"
                title="Account menu"
              >
                <span className="text-xs font-bold uppercase tracking-tight">
                  {(user?.name || user?.user_metadata?.full_name || user?.email || 'BD').slice(0, 2)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-[#EEF0EC] shadow-donezo-md">
              <div className="px-2.5 py-2 space-y-1">
                <p className="text-xs font-bold text-[#111827] truncate">
                  {user?.name || user?.user_metadata?.full_name || 'Agency Admin'}
                </p>
                <p className="text-[11px] text-[#6B7280] truncate font-medium">
                  {user?.email || 'admin@boulderdecisions.com'}
                </p>
                <div className="pt-1">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold px-2 py-0.5 bg-[#E3F4EA] text-[#1B6B45] border-transparent rounded-full"
                  >
                    Administrator
                  </Badge>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-[#F3F4F1]" />
              <DropdownMenuItem
                onSelect={() => signOut()}
                className="text-[#D93636] focus:text-[#B91C1C] focus:bg-[#FDECEC] cursor-pointer text-xs font-semibold rounded-xl"
              >
                <LogOut className="h-3.5 w-3.5 mr-2" />
                Sign Out
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
