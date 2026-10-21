import React from 'react';
import { Menu, RefreshCw, Download, Printer, ChevronRight, User, AlertCircle, LogOut } from 'lucide-react';
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
  const { comparisonLabel, loading, error, refresh } = useReport();
  const { user, signOut } = useAuth();

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
              <span>Boulder Decision</span>
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
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-violet-100/80 text-violet-800 hover:bg-violet-200/80 border border-violet-200 cursor-pointer shadow-xs"
                title="Account menu"
              >
                <span className="text-xs font-bold uppercase">
                  {(user?.user_metadata?.full_name || user?.email || 'AD').slice(0, 2)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-xl">
              <div className="px-2 py-1.5 space-y-0.5">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.user_metadata?.full_name || 'Agency Admin'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user?.email || 'admin@boulderdecisions.com'}
                </p>
                <div className="pt-1">
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-semibold px-1.5 py-0.2 ${
                      user?.isGuest
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {user?.isGuest ? 'Demo Admin' : 'Supabase Authenticated'}
                  </Badge>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => signOut()}
                className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer text-xs font-semibold"
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
