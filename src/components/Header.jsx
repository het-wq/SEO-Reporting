import React from 'react';
import { RefreshCw, Settings, CheckCircle2, AlertCircle } from 'lucide-react';
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
    <header className="dashboard-header">
      <div className="header-brand">
        <div className="brand-logo-badge">SEO</div>
        <div>
          <h1 className="header-title">{siteName || reportData?.client || 'Live SEO'} Dashboard</h1>
          <p className="header-subtitle">
            Google Search Console & Google Analytics 4 Performance Review
          </p>
        </div>
      </div>

      <div className="header-controls">
        {/* Connection status indicator */}
        <div className={`data-source-badge ${isConnected ? 'api-badge' : 'disconnected-badge'}`}>
          {isConnected ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          <span>{isConnected ? 'Google API Connected' : 'Not Connected'}</span>
        </div>

        {/* Dynamic Date Filter (last 7 days, 14 days, month wise, date wise) */}
        <DateFilter
          filterType={filterType}
          onFilterTypeChange={onFilterTypeChange}
          filterParams={filterParams}
          onFilterParamsChange={onFilterParamsChange}
          dateRangeInfo={dateRangeInfo}
        />

        {/* Refresh button */}
        <button
          className="btn btn-secondary icon-btn"
          onClick={onRefresh}
          title="Refresh Data from Google API"
          disabled={isLoading || !isConnected}
        >
          <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
        </button>

        {/* API Settings button */}
        <button
          className="btn btn-primary"
          onClick={onOpenApiSettings}
          title="Configure Google Search Console & GA4 Properties"
        >
          <Settings size={15} />
          <span>API Settings</span>
        </button>
      </div>
    </header>
  );
}
