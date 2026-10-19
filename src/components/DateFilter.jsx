import React, { useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

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
    <div className="date-filter-wrapper">
      <div className="date-filter-main">
        {/* Dropdown trigger */}
        <div className="dropdown-container">
          <button
            type="button"
            className="date-filter-trigger"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Calendar size={15} className="date-icon" />
            <span className="selected-filter-label">{selectedOption.label}</span>
            <ChevronDown size={14} className="dropdown-arrow" />
          </button>

          {isDropdownOpen && (
            <div className="filter-dropdown-menu">
              <div className="dropdown-header">Filter Option</div>
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`dropdown-item ${filterType === opt.id ? 'active' : ''}`}
                  onClick={() => handleSelectType(opt.id)}
                >
                  <span>{opt.label}</span>
                  {filterType === opt.id && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Month Picker when 'month_wise' is selected */}
        {filterType === 'month_wise' && (
          <div className="inline-selector">
            <select
              className="month-select"
              value={filterParams.month || '2026-10'}
              onChange={(e) => onFilterParamsChange({ ...filterParams, month: e.target.value })}
            >
              {MONTHS_LIST.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date pickers when 'date_wise' is selected */}
        {filterType === 'date_wise' && (
          <div className="custom-date-inputs">
            <div className="date-input-wrap">
              <label>From</label>
              <input
                type="date"
                className="date-input"
                value={filterParams.startDate || dateRangeInfo?.startDate || ''}
                onChange={(e) =>
                  onFilterParamsChange({ ...filterParams, startDate: e.target.value })
                }
              />
            </div>
            <div className="date-input-wrap">
              <label>To</label>
              <input
                type="date"
                className="date-input"
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
        <div className="date-range-badge">
          <span className="range-current">{dateRangeInfo.startDate} &rarr; {dateRangeInfo.endDate}</span>
          <span className="range-comparison">vs {dateRangeInfo.prevStartDate} &rarr; {dateRangeInfo.prevEndDate}</span>
        </div>
      )}
    </div>
  );
}
