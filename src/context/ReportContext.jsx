import React, { createContext, useCallback, useContext, useEffect, useRef, useState, useMemo } from 'react';
import {
  fetchDashboardLiveReport,
  fetchIntegrationsStatus,
  checkBackendHealth,
  getApiConfig,
} from '@/services/liveSeoApi';
import {
  calculateDateRanges,
  formatPeriod,
} from '@/utils/dateUtils';

const ReportContext = createContext(null);

export function ReportProvider({ children }) {
  // Default to standard industry 28-day reporting period for live API reporting
  const [filterType, setFilterType] = useState('last_28_days');
  const [filterParams, setFilterParams] = useState({
    month: '2026-10',
    startDate: '',
    endDate: '',
    comparisonEnabled: true,
    comparisonMode: 'previous_period', // 'previous_period' | 'previous_year' | 'custom' | 'none'
    compareStartDate: '',
    compareEndDate: '',
  });

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [integrations, setIntegrations] = useState([]);
  const [backendHealth, setBackendHealth] = useState({ status: 'unknown' });

  // Compute precise date range with matching prior comparison period
  const dateRangeInfo = useMemo(() => {
    return calculateDateRanges(filterType, filterParams);
  }, [filterType, filterParams]);

  // Active request tracking to prevent race conditions
  const activeRequestRef = useRef(0);

  // Selected & Previous period descriptors for UI compatibility
  const selectedPeriod = useMemo(() => ({
    label: dateRangeInfo.label,
    periodLabel: dateRangeInfo.periodLabel,
    startDate: dateRangeInfo.startDate,
    endDate: dateRangeInfo.endDate,
    year: parseInt(dateRangeInfo.startDate.split('-')[0], 10),
    month: parseInt(dateRangeInfo.startDate.split('-')[1], 10),
  }), [dateRangeInfo]);

  const previousPeriod = useMemo(() => ({
    label: dateRangeInfo.comparisonEnabled ? dateRangeInfo.prevPeriodLabel : 'No comparison',
    startDate: dateRangeInfo.comparisonEnabled ? dateRangeInfo.prevStartDate : '',
    endDate: dateRangeInfo.comparisonEnabled ? dateRangeInfo.prevEndDate : '',
    enabled: Boolean(dateRangeInfo.comparisonEnabled),
    mode: dateRangeInfo.comparisonMode,
  }), [dateRangeInfo]);

  const comparisonLabel = useMemo(() => {
    if (!dateRangeInfo.comparisonEnabled) {
      return `${dateRangeInfo.label} (${dateRangeInfo.startDate} – ${dateRangeInfo.endDate})`;
    }
    const modeTag = dateRangeInfo.comparisonMode === 'previous_year'
      ? 'YoY'
      : dateRangeInfo.comparisonMode === 'custom'
        ? 'Custom'
        : 'Prior';
    return `${dateRangeInfo.label} (${dateRangeInfo.startDate} – ${dateRangeInfo.endDate}) vs (${dateRangeInfo.prevStartDate} – ${dateRangeInfo.prevEndDate}) [${modeTag}]`;
  }, [dateRangeInfo]);

  // Load integrations telemetry
  const loadIntegrations = useCallback(async () => {
    try {
      const data = await fetchIntegrationsStatus();
      if (data?.integrations) setIntegrations(data.integrations);
      const health = await checkBackendHealth();
      setBackendHealth(health);
    } catch (e) {
      console.warn('Could not load integrations status:', e.message);
    }
  }, []);

  // Fetch unified live API report from backend
  const loadLiveReport = useCallback(async (isRefresh = false) => {
    const requestId = ++activeRequestRef.current;
    setLoading(true);
    setError(null);

    try {
      const liveData = await fetchDashboardLiveReport({
        startDate: dateRangeInfo.startDate,
        endDate: dateRangeInfo.endDate,
        prevStartDate: dateRangeInfo.comparisonEnabled ? dateRangeInfo.prevStartDate : undefined,
        prevEndDate: dateRangeInfo.comparisonEnabled ? dateRangeInfo.prevEndDate : undefined,
        periodLabel: dateRangeInfo.label,
        previousPeriodLabel: dateRangeInfo.comparisonEnabled ? dateRangeInfo.prevPeriodLabel : 'No comparison',
        forceRefresh: isRefresh,
      });

      if (requestId === activeRequestRef.current) {
        setReport(liveData);
      }
    } catch (err) {
      if (requestId === activeRequestRef.current) {
        console.error('Failed to load live SEO report:', err);
        setError({
          message: err.message || 'Failed to fetch live data from SEO APIs',
          status: err.status || 'error',
          actionUrl: err.actionUrl || null,
          actionLabel: err.actionLabel || null,
        });
        setReport(null);
      }
    } finally {
      if (requestId === activeRequestRef.current) {
        setLoading(false);
      }
    }
  }, [dateRangeInfo]);

  // Load report when date range changes
  useEffect(() => {
    loadLiveReport();
    loadIntegrations();
  }, [loadLiveReport, loadIntegrations]);

  // Change period or filter parameters
  const setDateFilter = useCallback((type, params = {}) => {
    setFilterType(type);
    if (Object.keys(params).length > 0) {
      setFilterParams((prev) => ({ ...prev, ...params }));
    }
  }, []);

  // Backward compatibility method for month selection
  const selectPeriod = useCallback((periodInput) => {
    if (!periodInput) return;
    if (typeof periodInput === 'string') {
      const match = periodInput.match(/^(\d{4})-(0?[1-9]|1[0-2])$/);
      if (match) {
        setDateFilter('month_wise', { month: periodInput });
        return;
      }
    }
    if (periodInput.year && periodInput.month) {
      const padM = String(periodInput.month).padStart(2, '0');
      setDateFilter('month_wise', { month: `${periodInput.year}-${padM}` });
    }
  }, [setDateFilter]);

  const refresh = useCallback(async () => {
    await loadIntegrations();
    await loadLiveReport(true);
  }, [loadIntegrations, loadLiveReport]);

  const value = {
    report,
    hasReportData: Boolean(report && (report.traffic?.hasData || report.searchConsole?.hasData)),
    isLive: true,
    clientName: report?.client || getApiConfig()?.selectedAccountName || 'Boulder Decision',
    loading,
    error,
    dateRangeInfo,
    selectedPeriod,
    previousPeriod,
    comparisonLabel,
    filterType,
    filterParams,
    setDateFilter,
    selectPeriod,
    refresh,
    loadLiveReport,
    integrations,
    backendHealth,
    availablePeriods: [
      { key: 'last_28_days', label: 'Last 28 Days (Recommended)', type: 'preset' },
      { key: 'last_14_days', label: 'Last 14 Days', type: 'preset' },
      { key: 'last_7_days', label: 'Last 7 Days', type: 'preset' },
      { key: 'last_30_days', label: 'Last 30 Days', type: 'preset' },
    ],
  };

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
}

export function useReport() {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error('useReport must be used within a ReportProvider');
  return ctx;
}
