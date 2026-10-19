/**
 * Date range utilities for SEO reporting
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
 * Get date range with matching prior comparison period
 * @param {string} filterType - 'last_7_days' | 'last_14_days' | 'last_28_days' | 'last_30_days' | 'month_wise' | 'date_wise'
 * @param {object} params - { month: 'YYYY-MM', startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 */
export const calculateDateRanges = (filterType, params = {}) => {
  // Use today as anchor (or 2 days ago if GSC latency offset is preferred)
  const now = new Date();
  // Standard anchor: yesterday
  const anchor = addDays(now, -1);

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
    const monthStr = params.month || '2026-10'; // e.g. '2026-10'
    const [yearStr, mStr] = monthStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(mStr, 10) - 1;

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0); // last day of month

    // Prior month
    const prevStart = new Date(year, month - 1, 1);
    const prevEnd = new Date(year, month, 0);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthName = `${monthNames[month]} ${year}`;
    const prevMonthName = `${monthNames[prevStart.getMonth()]} ${prevStart.getFullYear()}`;

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

  // Default fallback to Last 14 Days
  return calculateDateRanges('last_14_days');
};
