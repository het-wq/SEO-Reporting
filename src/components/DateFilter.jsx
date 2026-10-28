import React, { useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export const FILTER_OPTIONS = [
  { id: 'last_7_days', label: 'Last 7 Days' },
  { id: 'last_14_days', label: 'Last 14 Days' },
  { id: 'last_28_days', label: 'Last 28 Days' },
  { id: 'last_30_days', label: 'Last 30 Days' },
  { id: 'month_wise', label: 'Month Wise' },
  { id: 'date_wise', label: 'Date Wise (Custom)' },
];

const MONTHS_LIST = [
  { value: '2026-10', label: 'October 2026' },
  { value: '2026-09', label: 'September 2026' },
  { value: '2026-08', label: 'August 2026' },
  { value: '2026-07', label: 'July 2026' },
  { value: '2026-06', label: 'June 2026' },
  { value: '2026-05', label: 'May 2026' },
];

export default function DateFilter({
  filterType,
  onFilterTypeChange,
  filterParams,
  onFilterParamsChange,
  dateRangeInfo,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedOption = FILTER_OPTIONS.find((o) => o.id === filterType) || FILTER_OPTIONS[1];

  const handleSelectType = (typeId) => {
    onFilterTypeChange(typeId);
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 flex-wrap relative">
        {/* Dropdown trigger */}
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-white font-medium text-slate-800"
          >
            <Calendar className="h-4 w-4 text-slate-500" />
            <span>{selectedOption.label}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </Button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-52 rounded-lg border border-slate-200 bg-white shadow-lg p-1.5 z-50 animate-in fade-in-0 zoom-in-95">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Period
              </div>
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors cursor-pointer text-left ${
                    filterType === opt.id
                      ? 'bg-emerald-50 text-[#14532D] font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  onClick={() => handleSelectType(opt.id)}
                >
                  <span>{opt.label}</span>
                  {filterType === opt.id && <Check className="h-4 w-4 text-[#14532D]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Month Picker when 'month_wise' is selected */}
        {filterType === 'month_wise' && (
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-800 shadow-xs outline-none focus:ring-1 focus:ring-[#14532D]"
            value={filterParams.month || '2026-10'}
            onChange={(e) => onFilterParamsChange({ ...filterParams, month: e.target.value })}
          >
            {MONTHS_LIST.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        )}

        {/* Custom date inputs when 'date_wise' is selected */}
        {filterType === 'date_wise' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2.5 h-9">
              <span className="text-xs text-slate-500 font-medium">From</span>
              <input
                type="date"
                className="text-xs bg-transparent outline-none text-slate-800"
                value={filterParams.startDate || dateRangeInfo?.startDate || ''}
                onChange={(e) =>
                  onFilterParamsChange({ ...filterParams, startDate: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2.5 h-9">
              <span className="text-xs text-slate-500 font-medium">To</span>
              <input
                type="date"
                className="text-xs bg-transparent outline-none text-slate-800"
                value={filterParams.endDate || dateRangeInfo?.endDate || ''}
                onChange={(e) =>
                  onFilterParamsChange({ ...filterParams, endDate: e.target.value })
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Date comparison badge */}
      {dateRangeInfo && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Badge variant="outline" className="font-normal text-slate-700 bg-slate-50/50">
            {dateRangeInfo.startDate} &rarr; {dateRangeInfo.endDate}
          </Badge>
          {dateRangeInfo.comparisonEnabled ? (
            <span className="text-[11px] text-slate-400">vs {dateRangeInfo.prevStartDate} &rarr; {dateRangeInfo.prevEndDate}</span>
          ) : (
            <span className="text-[11px] text-slate-400">(Current only)</span>
          )}
        </div>
      )}
    </div>
  );
}
