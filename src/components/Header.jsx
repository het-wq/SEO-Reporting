import React from 'react';
import { RefreshCw, Settings, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DateFilter from './DateFilter';

export default function Header({
  reportData,
  onOpenApiSettings,
  isConnected,
  isLoading,
  onRefresh,
  filterType,
  onFilterTypeChange,
  filterParams,
  onFilterParamsChange,
  dateRangeInfo,
  siteName,
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-sm shadow-xs">
            SEO
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {siteName || reportData?.client || 'Live SEO'} Dashboard
            </h1>
            <p className="text-xs text-slate-500">
              Google Search Console & Google Analytics 4 Performance Review
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Connection status badge */}
          <Badge variant={isConnected ? 'success' : 'destructive'} className="py-1 px-2.5 gap-1.5 font-medium">
            {isConnected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
            <span>{isConnected ? 'API Connected' : 'Not Connected'}</span>
          </Badge>

          {/* Date Filter */}
          <DateFilter
            filterType={filterType}
            onFilterTypeChange={onFilterTypeChange}
            filterParams={filterParams}
            onFilterParamsChange={onFilterParamsChange}
            dateRangeInfo={dateRangeInfo}
          />

          {/* Refresh button */}
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            title="Refresh Data from Google API"
            disabled={isLoading || !isConnected}
            className="h-9 w-9 bg-white"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Settings button */}
          <Button
            variant="default"
            size="default"
            onClick={onOpenApiSettings}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            <span>API Settings</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
