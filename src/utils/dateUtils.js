/**
 * Date and reporting period utilities for SEO Reporting Dashboard.
 * Provides safe month arithmetic (preventing off-by-one errors and 30-day approximations),
 * month parsing, and comparison period calculation.
 */

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const MONTH_NAME_TO_INDEX = MONTH_NAMES.reduce((acc, name, idx) => {
  acc[name.toLowerCase()] = idx;
  return acc;
}, {});

const MONTH_ABBR_TO_INDEX = MONTH_ABBR.reduce((acc, abbr, idx) => {
  acc[abbr.toLowerCase()] = idx;
  return acc;
}, {});

/**
 * Format year and month (1-12) into a standard Period object.
 * @param {number} year e.g. 2026
 * @param {number} month 1-12 (1 = January, 12 = December)
 */
export function formatPeriod(year, month) {
  const y = Number(year);
  const m = Number(month);
  if (!y || isNaN(y) || !m || isNaN(m) || m < 1 || m > 12) {
    return null;
  }
  const monthIndex = m - 1;
  const monthName = MONTH_NAMES[monthIndex];
  const monthAbbr = MONTH_ABBR[monthIndex];
  const padMonth = String(m).padStart(2, '0');

  return {
    year: y,
    month: m, // 1-12
    monthIndex, // 0-11
    monthName,
    monthAbbr,
    label: `${monthName} ${y}`, // e.g. "September 2026"
    shortLabel: `${monthAbbr} ${y}`, // e.g. "Sep 2026"
    key: `${y}-${padMonth}`, // e.g. "2026-09"
    idString: `${monthAbbr.toLowerCase()}-${y}`, // e.g. "sep-2026"
  };
}

/**
 * Parse any period representation (string, YYYY-MM, ID, or object) into a Period object.
 * Examples:
 *   "September 2026" -> { year: 2026, month: 9, ... }
 *   "2026-09" -> { year: 2026, month: 9, ... }
 *   "boulder-decision-sep-2026" -> { year: 2026, month: 9, ... }
 *   { year: 2026, month: 9 } -> { year: 2026, month: 9, ... }
 */
export function parsePeriod(input) {
  if (!input) return null;

  if (typeof input === 'object') {
    if (input.key && input.monthName && input.year && input.month) {
      return input;
    }
    const year = input.year || input.y;
    const month = input.month || (input.monthIndex !== undefined ? input.monthIndex + 1 : null);
    if (year && month) return formatPeriod(year, month);
  }

  const str = String(input).trim();

  // YYYY-MM pattern
  const ymMatch = str.match(/^(\d{4})[-/](0?[1-9]|1[0-2])$/);
  if (ymMatch) {
    return formatPeriod(parseInt(ymMatch[1], 10), parseInt(ymMatch[2], 10));
  }

  // "September 2026" or "Sep 2026"
  const monthYearMatch = str.match(/([a-zA-Z]+)[,\s_-]+(\d{4})/);
  if (monthYearMatch) {
    const rawMonth = monthYearMatch[1].toLowerCase();
    const year = parseInt(monthYearMatch[2], 10);
    const monthIndex = MONTH_NAME_TO_INDEX[rawMonth] ?? MONTH_ABBR_TO_INDEX[rawMonth];
    if (monthIndex !== undefined && !isNaN(year)) {
      return formatPeriod(year, monthIndex + 1);
    }
  }

  // "2026 September" or "2026-Sep"
  const yearMonthMatch = str.match(/(\d{4})[,\s_-]+([a-zA-Z]+)/);
  if (yearMonthMatch) {
    const year = parseInt(yearMonthMatch[1], 10);
    const rawMonth = yearMonthMatch[2].toLowerCase();
    const monthIndex = MONTH_NAME_TO_INDEX[rawMonth] ?? MONTH_ABBR_TO_INDEX[rawMonth];
    if (monthIndex !== undefined && !isNaN(year)) {
      return formatPeriod(year, monthIndex + 1);
    }
  }

  return null;
}

/**
 * Calculates the preceding calendar month using safe integer arithmetic.
 * January 2027 -> December 2026
 * October 2026 -> September 2026
 * September 2026 -> August 2026
 */
export function getPreviousPeriod(periodInput) {
  const current = parsePeriod(periodInput);
  if (!current) return null;

  let prevMonth = current.month - 1;
  let prevYear = current.year;

  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }

  return formatPeriod(prevYear, prevMonth);
}

/**
 * Calculates the following calendar month using safe integer arithmetic.
 */
export function getNextPeriod(periodInput) {
  const current = parsePeriod(periodInput);
  if (!current) return null;

  let nextMonth = current.month + 1;
  let nextYear = current.year;

  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  return formatPeriod(nextYear, nextMonth);
}

/**
 * Formats a comparison period string.
 * Example: formatPeriodComparison("September 2026") => "September 2026 vs August 2026"
 * Example: formatPeriodComparison("January 2027") => "January 2027 vs December 2026"
 */
export function formatPeriodComparison(currentInput, previousInput = null) {
  const current = parsePeriod(currentInput);
  if (!current) return '';
  const previous = previousInput ? parsePeriod(previousInput) : getPreviousPeriod(current);
  if (!previous) return current.label;
  return `${current.label} vs ${previous.label}`;
}

/**
 * Calculates percentage change between two values safely.
 * Returns null if previous or current is missing/null/undefined.
 * Returns 0 if both are equal.
 * Returns 100 or -100 if previous is zero.
 */
export function calculatePercentageChange(current, previous) {
  if (previous === null || previous === undefined || previous === '' || isNaN(Number(previous))) {
    return null;
  }
  if (current === null || current === undefined || current === '' || isNaN(Number(current))) {
    return null;
  }
  const curr = Number(current);
  const prev = Number(previous);

  if (prev === 0) {
    if (curr === 0) return 0;
    return curr > 0 ? 100 : -100;
  }

  const diff = ((curr - prev) / prev) * 100;
  return Math.round(diff * 100) / 100;
}

/**
 * Formats percentage display.
 */
export function formatPercentage(diff, { showPlus = true } = {}) {
  if (diff === null || diff === undefined || isNaN(diff)) {
    return 'N/A';
  }
  const num = Number(diff);
  if (num === 0) return '0.0%';
  const prefix = num > 0 && showPlus ? '+' : '';
  return `${prefix}${num.toFixed(1)}%`;
}

/**
 * Date range utilities for SettingsPage / Live API connection
 * Formats dates as YYYY-MM-DD
 */
export const formatDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addDays = (d, days) => {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Get date range with matching prior comparison period for live Search Console & GA4
 */
export const calculateDateRanges = (filterType = 'last_28_days', params = {}) => {
  const now = new Date();
  // Anchor to 3 days ago to guarantee complete Google Search Console and GA4 data availability
  const anchor = addDays(now, -3);

  if (filterType === 'last_7_days') {
    const end = anchor;
    const start = addDays(end, -6);
    const prevEnd = addDays(start, -1);
    const prevStart = addDays(prevEnd, -6);
    return {
      label: 'Last 7 Days',
      startDate: formatDate(start),
      endDate: formatDate(end),
      prevStartDate: formatDate(prevStart),
      prevEndDate: formatDate(prevEnd),
      periodLabel: `${formatDate(start)} to ${formatDate(end)}`,
      prevPeriodLabel: `${formatDate(prevStart)} to ${formatDate(prevEnd)}`,
    };
  }

  if (filterType === 'last_14_days') {
    const end = anchor;
    const start = addDays(end, -13);
    const prevEnd = addDays(start, -1);
    const prevStart = addDays(prevEnd, -13);
    return {
      label: 'Last 14 Days',
      startDate: formatDate(start),
      endDate: formatDate(end),
      prevStartDate: formatDate(prevStart),
      prevEndDate: formatDate(prevEnd),
      periodLabel: `${formatDate(start)} to ${formatDate(end)}`,
      prevPeriodLabel: `${formatDate(prevStart)} to ${formatDate(prevEnd)}`,
    };
  }

  if (filterType === 'last_28_days') {
    const end = anchor;
    const start = addDays(end, -27);
    const prevEnd = addDays(start, -1);
    const prevStart = addDays(prevEnd, -27);
    return {
      label: 'Last 28 Days',
      startDate: formatDate(start),
      endDate: formatDate(end),
      prevStartDate: formatDate(prevStart),
      prevEndDate: formatDate(prevEnd),
      periodLabel: `${formatDate(start)} to ${formatDate(end)}`,
      prevPeriodLabel: `${formatDate(prevStart)} to ${formatDate(prevEnd)}`,
    };
  }

  if (filterType === 'last_30_days') {
    const end = anchor;
    const start = addDays(end, -29);
    const prevEnd = addDays(start, -1);
    const prevStart = addDays(prevEnd, -29);
    return {
      label: 'Last 30 Days',
      startDate: formatDate(start),
      endDate: formatDate(end),
      prevStartDate: formatDate(prevStart),
      prevEndDate: formatDate(prevEnd),
      periodLabel: `${formatDate(start)} to ${formatDate(end)}`,
      prevPeriodLabel: `${formatDate(prevStart)} to ${formatDate(prevEnd)}`,
    };
  }

  if (filterType === 'month_wise') {
    const monthStr = params.month || '2026-10';
    const [yearStr, mStr] = monthStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(mStr, 10) - 1;

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    const prevStart = new Date(year, month - 1, 1);
    const prevEnd = new Date(year, month, 0);

    const currentMonthName = `${MONTH_NAMES[month]} ${year}`;
    const prevMonthName = `${MONTH_NAMES[prevStart.getMonth()]} ${prevStart.getFullYear()}`;

    return {
      label: currentMonthName,
      startDate: formatDate(start),
      endDate: formatDate(end),
      prevStartDate: formatDate(prevStart),
      prevEndDate: formatDate(prevEnd),
      periodLabel: currentMonthName,
      prevPeriodLabel: prevMonthName,
    };
  }

  if (filterType === 'date_wise') {
    const startStr = params.startDate || formatDate(addDays(anchor, -13));
    const endStr = params.endDate || formatDate(anchor);

    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const prevEnd = addDays(start, -1);
    const prevStart = addDays(prevEnd, -(diffDays - 1));

    return {
      label: `Custom: ${startStr} to ${endStr}`,
      startDate: startStr,
      endDate: endStr,
      prevStartDate: formatDate(prevStart),
      prevEndDate: formatDate(prevEnd),
      periodLabel: `${startStr} to ${endStr}`,
      prevPeriodLabel: `${formatDate(prevStart)} to ${formatDate(prevEnd)} (${diffDays}d prior)`,
    };
  }

  return calculateDateRanges('last_14_days');
};
