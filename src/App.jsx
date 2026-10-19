import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TrafficSection from './components/TrafficSection';
import SearchConsoleSection from './components/SearchConsoleSection';
import KeywordsSection from './components/KeywordsSection';
import ApiConfigModal from './components/ApiConfigModal';
import { fetchLiveSeoData, getApiConfig, saveApiConfig, checkBackendHealth, getGoogleAuthUrl, fetchGscSites } from './services/seoApi';
import { calculateDateRanges } from './utils/dateUtils';
import { AlertCircle, CheckCircle2, ShieldAlert, ExternalLink, Link2, Settings, ArrowRight } from 'lucide-react';
import './App.css';

export default function App() {
  const [filterType, setFilterType] = useState('last_14_days');
  const [filterParams, setFilterParams] = useState({ month: '2026-10', startDate: '', endDate: '' });
  const [dateRangeInfo, setDateRangeInfo] = useState(null);

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Re-calculate date range when filter changes
  useEffect(() => {
    const info = calculateDateRanges(filterType, filterParams);
    setDateRangeInfo(info);
  }, [filterType, filterParams]);

  // Handle OAuth callback from URL params
  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const authStatus = params.get('auth');
        const token = params.get('access_token');
        if (authStatus === 'success' && token) {
          const cfg = getApiConfig();
          const updated = { ...cfg, apiToken: token, googleConnected: true };
          saveApiConfig(updated);
          setIsConnected(true);

          // Sync token to backend
          try {
            await fetch('http://localhost:5001/api/auth/set-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access_token: token }),
            });
          } catch (e) {
            console.warn('Backend token sync error:', e);
          }

          // Fetch verified sites
          try {
            const sites = await fetchGscSites(token);
            if (sites && sites.length > 0 && !cfg.gscSiteUrl) {
              updated.gscSiteUrl = sites[0].siteUrl;
              saveApiConfig(updated);
            }
          } catch (e) {
            console.warn('Could not auto-list sites:', e);
          }

          setSuccessToast('Google Account connected successfully!');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        console.error('Error handling auth redirect', err);
      }
    };

    handleAuthRedirect();
  }, []);

  // Check connection status on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const health = await checkBackendHealth();
      const cfg = getApiConfig();
      const connected = health.hasToken || Boolean(cfg.apiToken);
      setIsConnected(connected);
    };
    checkAuth();
  }, []);

  // Fetch report data whenever connection or date range changes
  const loadData = async () => {
    if (!dateRangeInfo) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetchLiveSeoData(dateRangeInfo);
      setIsConnected(res.connected);
      if (res.error) {
        setErrorMessage(res.error);
      }
      setReport(res.data);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to fetch live API data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dateRangeInfo) {
      loadData();
    }
  }, [dateRangeInfo, isConnected]);

  const handleConfigSaved = () => {
    loadData();
  };

  const handleStartGoogleOAuth = async () => {
    try {
      const data = await getGoogleAuthUrl();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      setErrorMessage(e.message);
    }
  };

  const cfg = getApiConfig();
  const siteName = cfg.gscSiteUrl ? cfg.gscSiteUrl.replace('sc-domain:', '') : 'Mama Jan';

  return (
    <div className="app-container">
      <Header
        reportData={report}
        siteName={siteName}
        onOpenApiSettings={() => setIsModalOpen(true)}
        isConnected={isConnected}
        isLoading={isLoading}
        onRefresh={loadData}
        filterType={filterType}
        onFilterTypeChange={(type) => setFilterType(type)}
        filterParams={filterParams}
        onFilterParamsChange={(params) => setFilterParams(params)}
        dateRangeInfo={dateRangeInfo}
      />

      <main className="dashboard-content">
        {/* Success toast */}
        {successToast && (
          <div className="success-alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: '16px' }}
            >
              ×
            </button>
          </div>
        )}

        {/* Action required alert for enabling Google Cloud APIs */}
        {errorMessage && errorMessage.includes('has not been used in project') && (
          <div className="api-cloud-notice-card">
            <div className="notice-card-header">
              <ShieldAlert size={18} className="text-warning" />
              <h3>Action Needed in Google Cloud Console</h3>
            </div>
            <p>
              Your Google OAuth authorization succeeded! To query live Search Console & GA4 data,
              please enable the APIs for your project (<strong>554369952704</strong>):
            </p>
            <div className="notice-links-row">
              <a
                href="https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=554369952704"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary action-link"
              >
                <ExternalLink size={14} />
                <span>1. Enable Google Search Console API</span>
              </a>
              <a
                href="https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview?project=554369952704"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary action-link"
              >
                <ExternalLink size={14} />
                <span>2. Enable Google Analytics Data API</span>
              </a>
            </div>
            <span className="notice-footer-text">
              After clicking Enable on Google Cloud, wait ~1 minute and click the Refresh button in the top right.
            </span>
          </div>
        )}

        {/* Generic error banner */}
        {errorMessage && !errorMessage.includes('has not been used in project') && (
          <div className="error-alert">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Not connected state */}
        {!isConnected && (
          <div className="not-connected-hero">
            <div className="hero-icon-box">
              <Link2 size={36} />
            </div>
            <h2>Connect Google API</h2>
            <p>
              All demo/PDF data has been removed. Connect your Google account to fetch live metrics directly
              from Google Search Console and Google Analytics 4.
            </p>
            <div className="hero-btn-row">
              <button className="btn btn-primary hero-btn" onClick={handleStartGoogleOAuth}>
                <img
                  src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                  alt="Google"
                  width="16"
                  height="16"
                />
                <span>Connect with Google</span>
              </button>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(true)}>
                <Settings size={15} />
                <span>Configure Properties</span>
              </button>
            </div>
          </div>
        )}

        {/* Connected state & live report */}
        {isConnected && (
          <>
            {isLoading && !report ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Querying Google Search Console & GA4 live data...</p>
              </div>
            ) : (
              <div className="sections-container">
                {/* 01. Google Analytics 4 Traffic */}
                {report?.gaOverview && (
                  <TrafficSection
                    gaOverview={report.gaOverview}
                    periodName={dateRangeInfo?.periodLabel}
                    prevPeriodName={dateRangeInfo?.prevPeriodLabel}
                  />
                )}

                {/* 02. Google Search Console Overview */}
                {report?.gscOverview && (
                  <SearchConsoleSection
                    gscOverview={report.gscOverview}
                    deviceTraffic={report.deviceTraffic}
                    periodName={dateRangeInfo?.periodLabel}
                    prevPeriodName={dateRangeInfo?.prevPeriodLabel}
                  />
                )}

                {/* 04. Top Performing Keywords from live Search Console */}
                {report?.topKeywords && report.topKeywords.length > 0 && (
                  <KeywordsSection
                    topKeywords={report.topKeywords}
                    periodName={dateRangeInfo?.label}
                  />
                )}

                {/* Property configuration helper if neither GSC nor GA4 returned data yet */}
                {!report?.gscOverview && !report?.gaOverview && !isLoading && (
                  <div className="empty-properties-card">
                    <h3>No Property Data Loaded Yet</h3>
                    <p>
                      Enter your Search Console Site URL (e.g. <code>sc-domain:yourdomain.com</code>)
                      and GA4 Property ID (e.g. <code>516707960</code>) in API Settings.
                    </p>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                      <Settings size={15} />
                      <span>Configure Properties in API Settings</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* API Configuration Modal */}
      <ApiConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfigSaved={handleConfigSaved}
        activeError={errorMessage}
      />
    </div>
  );
}
