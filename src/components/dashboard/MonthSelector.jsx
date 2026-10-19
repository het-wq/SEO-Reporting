import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarDays,
  ChevronDown,
  Check,
  Loader2,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useReport } from '@/context/ReportContext';
import { MONTH_ABBR, MONTH_NAMES } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PRESETS = [
  { id: 'last_28_days', label: 'Last 28 Days', subtitle: 'Recommended for Live SEO' },
  { id: 'last_14_days', label: 'Last 14 Days', subtitle: 'Recent two-week performance' },
  { id: 'last_7_days', label: 'Last 7 Days', subtitle: 'Past week trend' },
  { id: 'last_30_days', label: 'Last 30 Days', subtitle: 'Full monthly window' },
];

export default function MonthSelector({ className }) {
  const {
    dateRangeInfo,
    filterType,
    filterParams,
    setDateFilter,
    loading,
  } = useReport();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(filterType === 'month_wise' ? 'month' : filterType === 'date_wise' ? 'custom' : 'presets');
  const containerRef = useRef(null);

  // Year being viewed in the month picker
  const [viewYear, setViewYear] = useState(2026);
  const [customStart, setCustomStart] = useState(dateRangeInfo?.startDate || '');
  const [customEnd, setCustomEnd] = useState(dateRangeInfo?.endDate || '');

  // Keep custom inputs synced with dateRangeInfo
  useEffect(() => {
    if (dateRangeInfo) {
      setCustomStart(dateRangeInfo.startDate);
      setCustomEnd(dateRangeInfo.endDate);
    }
  }, [dateRangeInfo]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectPreset = (presetId) => {
    setDateFilter(presetId);
    setIsOpen(false);
  };

  const handleSelectMonth = (monthIndex) => {
    const padM = String(monthIndex + 1).padStart(2, '0');
    setDateFilter('month_wise', { month: `${viewYear}-${padM}` });
    setIsOpen(false);
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    setDateFilter('date_wise', { startDate: customStart, endDate: customEnd });
    setIsOpen(false);
  };

  // Determine current active display string
  const currentLabel = dateRangeInfo?.label || 'Last 28 Days';

  return (
    <div className={cn('relative inline-block', className)} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Select reporting date range"
        className={cn(
          'flex items-center gap-2 h-9 px-3 rounded-md border text-sm font-medium transition-colors shadow-xs cursor-pointer',
          'bg-white hover:bg-slate-50 border-slate-200 text-slate-800',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
          isOpen && 'border-blue-500 ring-2 ring-blue-100'
        )}
      >
        <CalendarDays className="h-4 w-4 text-blue-600 shrink-0" />
        <span className="font-semibold text-slate-900 whitespace-nowrap">
          {currentLabel}
        </span>

        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
        ) : (
          <ChevronDown
            className={cn('h-3.5 w-3.5 text-slate-500 transition-transform', isOpen && 'rotate-180')}
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Date Range Selector"
          className="absolute right-0 top-full mt-1.5 z-50 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-3 shadow-xl animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {/* Tabs header */}
          <div className="flex border-b border-slate-100 pb-2 mb-3 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={cn(
                'flex-1 py-1 px-2 text-xs font-semibold rounded-md transition-colors text-center cursor-pointer',
                activeTab === 'presets'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              Presets
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('month')}
              className={cn(
                'flex-1 py-1 px-2 text-xs font-semibold rounded-md transition-colors text-center cursor-pointer',
                activeTab === 'month'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={cn(
                'flex-1 py-1 px-2 text-xs font-semibold rounded-md transition-colors text-center cursor-pointer',
                activeTab === 'custom'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              Custom Dates
            </button>
          </div>

          {/* TAB 1: Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-1">
              {PRESETS.map((p) => {
                const isActive = filterType === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer',
                      isActive
                        ? 'bg-blue-50/80 border border-blue-200'
                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-900">{p.label}</span>
                        {p.id === 'last_28_days' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                            <Sparkles className="h-2.5 w-2.5" /> Best for SEO
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.subtitle}</p>
                    </div>
                    {isActive && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 2: Month Grid */}
          {activeTab === 'month' && (
            <div>
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Month</span>
                <div className="flex items-center gap-1">
                  {[2025, 2026].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setViewYear(yr)}
                      className={cn(
                        'px-2 py-0.5 text-xs font-semibold rounded cursor-pointer',
                        viewYear === yr ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                      )}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {MONTH_NAMES.map((name, idx) => {
                  const padM = String(idx + 1).padStart(2, '0');
                  const isSelected = filterType === 'month_wise' && filterParams.month === `${viewYear}-${padM}`;

                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleSelectMonth(idx)}
                      className={cn(
                        'py-2 px-2 text-xs font-medium rounded-md text-center transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                      )}
                    >
                      {MONTH_ABBR[idx]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Custom Range */}
          {activeTab === 'custom' && (
            <form onSubmit={handleApplyCustom} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="text-xs h-8"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">End Date</label>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="text-xs h-8"
                    required
                  />
                </div>
              </div>
              <Button type="submit" size="sm" className="w-full text-xs font-semibold">
                Apply Custom Range
              </Button>
            </form>
          )}

          {/* Footer info: shows current period and prior comparison period */}
          {dateRangeInfo && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="truncate">Prior: <strong className="text-slate-700">{dateRangeInfo.prevStartDate} → {dateRangeInfo.prevEndDate}</strong></span>
              <span className="text-blue-600 font-medium shrink-0 ml-1">Live Comparison</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
