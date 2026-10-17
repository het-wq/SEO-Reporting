import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TrafficSection from './components/TrafficSection';
import SearchConsoleSection from './components/SearchConsoleSection';
import KeywordsSection from './components/KeywordsSection';
import ApiConfigModal from './components/ApiConfigModal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchLiveSeoData, getApiConfig, saveApiConfig, checkBackendHealth, getGoogleAuthUrl, fetchGscSites } from '@/services/seoApi';
import { calculateDateRanges } from '@/utils/dateUtils';
import { AlertCircle, CheckCircle2, ShieldAlert, ExternalLink, Link2, Settings } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Success toast */}
        {successToast && (
          <div className="mb-5 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-2xs">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast('')}
              className="text-emerald-600 hover:text-emerald-800 text-base font-bold cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Action required alert for enabling Google Cloud APIs */}
        {errorMessage && errorMessage.includes('has not been used in project') && (
          <Card className="mb-6 border-amber-200 bg-amber-50/70 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-sm font-semibold text-amber-900">
                  Action Needed in Google Cloud Console
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-xs text-amber-800 leading-relaxed">
                Your Google OAuth authorization succeeded! To query live Search Console & GA4 data,
                please enable the APIs for your project (<strong>554369952704</strong>):
              </p>
              <div className="flex flex-wrap gap-2.5 pt-1">
                <Button variant="outline" size="sm" asChild className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100/50">
                  <a
                    href="https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=554369952704"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1 text-amber-700" />
                    <span>1. Enable Google Search Console API</span>
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100/50">
                  <a
                    href="https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview?project=554369952704"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1 text-amber-700" />
                    <span>2. Enable Google Analytics Data API</span>
                  </a>
                </Button>
              </div>
              <p className="text-[11px] text-amber-700/80">
                After clicking Enable on Google Cloud, wait ~1 minute and click the Refresh button in the top right.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Generic error banner */}
        {errorMessage && !errorMessage.includes('has not been used in project') && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-2xs">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Not connected hero state */}
        {!isConnected && (
          <Card className="max-w-xl mx-auto my-12 text-center p-8 border-slate-200 shadow-sm">
            <CardContent className="space-y-4 p-0">
              <div className="h-14 w-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Link2 className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">Connect Google API</h2>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Connect your Google account to fetch live metrics directly from Google Search Console and Google Analytics 4.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button variant="default" onClick={handleStartGoogleOAuth} className="gap-2">
                  <img
                    src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                    alt="Google"
                    width="16"
                    height="16"
                  />
                  <span>Connect with Google</span>
                </Button>
                <Button variant="outline" onClick={() => setIsModalOpen(true)} className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Configure Properties</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connected state & live report */}
        {isConnected && (
          <>
            {isLoading && !report ? (
              <div className="py-24 text-center space-y-3">
                <div className="h-8 w-8 rounded-full border-3 border-blue-600 border-t-transparent animate-spin mx-auto" />
                <p className="text-sm text-slate-500 font-medium">Querying Google Search Console & GA4 live data...</p>
              </div>
            ) : (
              <div className="space-y-6">
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
                  <Card className="max-w-md mx-auto my-12 text-center border-dashed border-slate-300 p-8 shadow-none">
                    <CardContent className="space-y-3 p-0">
                      <h3 className="text-base font-semibold text-slate-900">No Property Data Loaded Yet</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Enter your Search Console Site URL (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">sc-domain:yourdomain.com</code>)
                        and GA4 Property ID (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">516707960</code>) in API Settings.
                      </p>
                      <Button variant="default" size="sm" onClick={() => setIsModalOpen(true)} className="gap-2 mt-2">
                        <Settings className="h-4 w-4" />
                        <span>Configure Properties in API Settings</span>
                      </Button>
                    </CardContent>
                  </Card>
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
