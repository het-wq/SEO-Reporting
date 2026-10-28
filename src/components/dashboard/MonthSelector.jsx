import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  ChevronDown,
  Check,
  Loader2,
  Calendar,
  Sparkles,
  ArrowRight,
  GitCompare,
  SlidersHorizontal,
} from 'lucide-react';
import { useReport } from '@/context/ReportContext';
import { MONTH_ABBR, MONTH_NAMES, computeComparisonRange, formatDate } from '@/utils/dateUtils';
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
  const [activeTab, setActiveTab] = useState(
    filterType === 'month_wise' ? 'month' : filterType === 'date_wise' ? 'custom' : 'presets'
  );
  const containerRef = useRef(null);

  // Year being viewed in the month picker
  const [viewYear, setViewYear] = useState(2026);
  const [customStart, setCustomStart] = useState(dateRangeInfo?.startDate || '');
  const [customEnd, setCustomEnd] = useState(dateRangeInfo?.endDate || '');

  // Comparison configuration state
  const [comparisonEnabled, setComparisonEnabled] = useState(
    filterParams?.comparisonEnabled !== false
  );
  const [comparisonMode, setComparisonMode] = useState(
    filterParams?.comparisonMode || 'previous_period'
  );
  const [compareStart, setCompareStart] = useState(filterParams?.compareStartDate || '');
  const [compareEnd, setCompareEnd] = useState(filterParams?.compareEndDate || '');

  // Sync inputs with dateRangeInfo when it updates
  useEffect(() => {
    if (dateRangeInfo) {
      setCustomStart(dateRangeInfo.startDate || '');
      setCustomEnd(dateRangeInfo.endDate || '');
      if (dateRangeInfo.comparisonEnabled !== undefined) {
        setComparisonEnabled(Boolean(dateRangeInfo.comparisonEnabled));
      }
      if (dateRangeInfo.comparisonMode) {
        setComparisonMode(dateRangeInfo.comparisonMode);
      }
      if (dateRangeInfo.prevStartDate && !compareStart) {
        setCompareStart(dateRangeInfo.prevStartDate);
      }
      if (dateRangeInfo.prevEndDate && !compareEnd) {
        setCompareEnd(dateRangeInfo.prevEndDate);
      }
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

  // Preview the calculated comparison range dynamically
  const activeStartDate = activeTab === 'custom' && customStart ? customStart : (dateRangeInfo?.startDate || '');
  const activeEndDate = activeTab === 'custom' && customEnd ? customEnd : (dateRangeInfo?.endDate || '');

  const comparisonPreview = useMemo(() => {
    if (!activeStartDate || !activeEndDate) return null;
    return computeComparisonRange({
      startDate: activeStartDate,
      endDate: activeEndDate,
      comparisonEnabled,
      comparisonMode,
      compareStartDate: compareStart,
      compareEndDate: compareEnd,
    });
  }, [activeStartDate, activeEndDate, comparisonEnabled, comparisonMode, compareStart, compareEnd]);

  const handleSelectPreset = (presetId) => {
    setDateFilter(presetId, {
      comparisonEnabled,
      comparisonMode,
      compareStartDate: compareStart,
      compareEndDate: compareEnd,
    });
    setIsOpen(false);
  };

  const handleSelectMonth = (monthIndex) => {
    const padM = String(monthIndex + 1).padStart(2, '0');
    setDateFilter('month_wise', {
      month: `${viewYear}-${padM}`,
      comparisonEnabled,
      comparisonMode,
      compareStartDate: compareStart,
      compareEndDate: compareEnd,
    });
    setIsOpen(false);
  };

  const handleApplyCustom = (e) => {
    if (e) e.preventDefault();
    if (!customStart || !customEnd) return;
    setDateFilter('date_wise', {
      startDate: customStart,
      endDate: customEnd,
      comparisonEnabled,
      comparisonMode,
      compareStartDate: compareStart,
      compareEndDate: compareEnd,
    });
    setIsOpen(false);
  };

  const handleApplyAll = () => {
    if (activeTab === 'custom') {
      handleApplyCustom();
    } else if (activeTab === 'presets') {
      setDateFilter(filterType, {
        comparisonEnabled,
        comparisonMode,
        compareStartDate: compareStart,
        compareEndDate: compareEnd,
      });
      setIsOpen(false);
    } else {
      setDateFilter('month_wise', {
        ...filterParams,
        comparisonEnabled,
        comparisonMode,
        compareStartDate: compareStart,
        compareEndDate: compareEnd,
      });
      setIsOpen(false);
    }
  };

  // Determine current active display string
  const currentLabel = dateRangeInfo?.label || 'Last 28 Days';
  const comparisonTag = dateRangeInfo?.comparisonEnabled
    ? dateRangeInfo.comparisonMode === 'previous_year'
      ? 'YoY'
      : dateRangeInfo.comparisonMode === 'custom'
        ? 'Custom'
        : 'Prior'
    : 'No Compare';

  return (
    <div className={cn('relative inline-block', className)} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Select reporting date range and comparison"
        className={cn(
          'flex items-center gap-2 h-9 px-3 rounded-md border text-sm font-medium transition-colors shadow-xs cursor-pointer',
          'bg-white hover:bg-slate-50 border-slate-200 text-slate-800',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14532D]',
          isOpen && 'border-[#14532D] ring-2 ring-emerald-100'
        )}
      >
        <CalendarDays className="h-4 w-4 text-[#14532D] shrink-0" />
        <span className="font-semibold text-slate-900 whitespace-nowrap">
          {currentLabel}
        </span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60 hidden sm:inline-block">
          {comparisonTag}
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
          aria-label="Date Range and Comparison Selector"
          className="absolute right-0 top-full mt-1.5 z-50 w-84 sm:w-96 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {/* Tabs header */}
          <div className="flex border-b border-slate-100 pb-2 mb-3 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={cn(
                'flex-1 py-1 px-2 text-xs font-semibold rounded-md transition-colors text-center cursor-pointer',
                activeTab === 'presets'
                  ? 'bg-emerald-50 text-[#14532D]'
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
                  ? 'bg-emerald-50 text-[#14532D]'
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
                  ? 'bg-emerald-50 text-[#14532D]'
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
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer',
                      isActive
                        ? 'bg-emerald-50/80 border border-emerald-200'
                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-900">{p.label}</span>
                        {p.id === 'last_28_days' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-100 text-[#14532D]">
                            <Sparkles className="h-2.5 w-2.5" /> Best for SEO
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.subtitle}</p>
                    </div>
                    {isActive && <Check className="h-4 w-4 text-[#14532D] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 2: Month Grid */}
          {activeTab === 'month' && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
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
                          ? 'bg-[#14532D] text-white font-bold shadow-xs'
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
            <div className="space-y-2 mb-2">
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
            </div>
          )}

          {/* COMPARISON OPTION SECTION */}
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 select-none">
                <input
                  type="checkbox"
                  checked={comparisonEnabled}
                  onChange={(e) => setComparisonEnabled(e.target.checked)}
                  className="h-3.5 w-3.5 rounded text-[#14532D] focus:ring-[#14532D] border-slate-300 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <GitCompare className="h-3.5 w-3.5 text-[#14532D]" />
                  Comparison Options
                </span>
              </label>

              {comparisonEnabled && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#14532D] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  {comparisonMode === 'previous_year' ? 'YoY' : comparisonMode === 'custom' ? 'Custom' : 'Prior Period'}
                </span>
              )}
            </div>

            {comparisonEnabled ? (
              <div className="space-y-2">
                {/* Comparison mode selection pills */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-lg text-center">
                  <button
                    type="button"
                    onClick={() => setComparisonMode('previous_period')}
                    className={cn(
                      'py-1 px-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer',
                      comparisonMode === 'previous_period'
                        ? 'bg-white text-[#14532D] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    Previous Period
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparisonMode('previous_year')}
                    className={cn(
                      'py-1 px-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer',
                      comparisonMode === 'previous_year'
                        ? 'bg-white text-[#14532D] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    Previous Year (YoY)
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparisonMode('custom')}
                    className={cn(
                      'py-1 px-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer',
                      comparisonMode === 'custom'
                        ? 'bg-white text-[#14532D] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    Custom Dates
                  </button>
                </div>

                {/* Custom Comparison Range Inputs */}
                {comparisonMode === 'custom' && (
                  <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Compare Start</label>
                      <Input
                        type="date"
                        value={compareStart}
                        onChange={(e) => setCompareStart(e.target.value)}
                        className="text-xs h-7.5 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Compare End</label>
                      <Input
                        type="date"
                        value={compareEnd}
                        onChange={(e) => setCompareEnd(e.target.value)}
                        className="text-xs h-7.5 bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Live comparison range preview badge */}
                <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200/80">
                  <span className="truncate">
                    Prior: <strong className="text-slate-800">{comparisonPreview?.prevStartDate || '...'} → {comparisonPreview?.prevEndDate || '...'}</strong>
                  </span>
                  <span className="text-[#14532D] font-semibold shrink-0 ml-1 text-[10px] uppercase">
                    {comparisonMode === 'previous_year' ? 'YoY' : comparisonMode === 'custom' ? 'Custom' : 'Prior'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 py-1 italic bg-slate-50 px-2 rounded border border-slate-100">
                Comparison disabled — viewing current period performance only.
              </div>
            )}

            {/* Apply Range & Comparison Button */}
            <Button
              type="button"
              onClick={handleApplyAll}
              size="sm"
              className="w-full text-xs font-semibold cursor-pointer bg-[#14532D] hover:bg-[#1B6B45] text-white mt-1 shadow-xs"
            >
              Apply Range &amp; Comparison
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
