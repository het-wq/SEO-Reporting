import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Search,
  Globe,
  Tag,
  MapPin,
  Save,
  Check,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import SectionCard from '@/components/dashboard/SectionCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  getApiConfig,
  saveApiConfig,
  getGoogleAuthUrl,
  disconnectGoogleAuth,
  fetchIntegrationsStatus,
  testIntegrationConnection,
} from '@/services/liveSeoApi';
import { useReport } from '@/context/ReportContext';

export default function SettingsPage() {
  const { refresh: refreshDashboard, backendHealth } = useReport();

  const [config, setConfig] = useState(getApiConfig());
  const [integrationsData, setIntegrationsData] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Testing connection states: providerId -> { testing: boolean, result: object | null }
  const [testResults, setTestResults] = useState({});

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await fetchIntegrationsStatus();
      setIntegrationsData(data);
    } catch (e) {
      console.warn('Failed to load integrations status:', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSaveConfig = () => {
    saveApiConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    refreshDashboard();
  };

  const handleStartGoogleOAuth = async () => {
    try {
      const data = await getGoogleAuthUrl();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert(e.message || 'Failed to start Google OAuth flow');
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect your Google account?')) {
      await disconnectGoogleAuth();
      await loadStatus();
      refreshDashboard();
    }
  };

  const runTest = async (providerId, extraParams = {}) => {
    setTestResults((prev) => ({
      ...prev,
      [providerId]: { testing: true, result: null },
    }));

    try {
      const result = await testIntegrationConnection(providerId, extraParams);
      setTestResults((prev) => ({
        ...prev,
        [providerId]: { testing: false, result },
      }));
      await loadStatus();
      if (result.success) {
        refreshDashboard();
      }
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: {
          testing: false,
          result: { success: false, message: err.message },
        },
      }));
    }
  };

  const authStatus = integrationsData?.authStatus;
  const isGoogleConnected = authStatus?.authenticated || backendHealth?.hasToken;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">API Integrations & Data Sources</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage live API connections, Google OAuth credentials, and data freshness telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStatus}
            disabled={loadingStatus}
            className="gap-1.5 text-xs bg-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </Button>
          <Button
            size="sm"
            onClick={handleSaveConfig}
            className="gap-1.5 text-xs font-semibold bg-[#14532D] hover:bg-[#1B6B45] text-white"
          >
            {saveSuccess ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            <span>{saveSuccess ? 'Saved!' : 'Save Properties'}</span>
          </Button>
        </div>
      </div>

      {/* SECTION 1: Google Account Authentication */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-emerald-50 text-[#14532D] flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Google Cloud Authentication</CardTitle>
                <p className="text-xs text-slate-500">Provides read-only access to Google Search Console and GA4 properties</p>
              </div>
            </div>
            <Badge variant={isGoogleConnected ? 'success' : 'secondary'} className="text-xs font-semibold">
              {isGoogleConnected ? 'Google Account Connected' : 'Not Connected'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs font-semibold text-slate-800">
                {isGoogleConnected ? 'Google Cloud API Authorization' : 'Google Account Connection'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isGoogleConnected
                  ? 'Authenticated. Login session saved in cookies for live data syncing.'
                  : 'Connect your authorized Google account to view live Search Console and GA4 metrics.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isGoogleConnected ? (
                <Button onClick={handleStartGoogleOAuth} className="gap-2 text-xs font-semibold bg-[#14532D] hover:bg-[#1B6B45] text-white">
                  <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="h-4 w-4" />
                  <span>Connect with Google</span>
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleStartGoogleOAuth} className="gap-1.5 text-xs bg-white text-slate-700">
                    <RotateCcw className="h-3.5 w-3.5" /> <span>Re-authorize</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDisconnect} className="gap-1.5 text-xs text-red-600 hover:bg-red-50 border-red-200">
                    <LogOut className="h-3.5 w-3.5" /> <span>Disconnect</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: Data Source Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Google Analytics 4 */}
        <Card className="border-slate-200 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#14532D]" />
                <CardTitle className="text-sm font-bold text-slate-900">Google Analytics 4 (GA4)</CardTitle>
              </div>
              <Badge variant={isGoogleConnected ? 'success' : 'secondary'} className="text-[10px]">
                {isGoogleConnected ? 'Authenticated' : 'Login Required'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">GA4 Property ID</label>
              <Input
                placeholder="e.g. 123456789"
                value={config.ga4PropertyId}
                onChange={(e) => setConfig((prev) => ({ ...prev, ga4PropertyId: e.target.value }))}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">Boulder Decision GA4 numeric Property ID (from Google Analytics Admin)</p>
            </div>

            {testResults.ga4 && (
              <div className={`p-2.5 rounded text-xs ${testResults.ga4.result?.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                <p className="font-semibold">{testResults.ga4.result?.message}</p>
                {testResults.ga4.result?.actionUrl && (
                  <a href={testResults.ga4.result.actionUrl} target="_blank" rel="noreferrer" className="underline font-bold block mt-1">
                    {testResults.ga4.result.actionLabel || 'Enable in Google Cloud Console'} →
                  </a>
                )}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => runTest('ga4', { propertyId: config.ga4PropertyId })}
              disabled={testResults.ga4?.testing || !isGoogleConnected}
              className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100"
            >
              {testResults.ga4?.testing ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              <span>Test GA4 Connection</span>
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: Google Search Console */}
        <Card className="border-slate-200 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-sm font-bold text-slate-900">Google Search Console</CardTitle>
              </div>
              <Badge variant={isGoogleConnected ? 'success' : 'secondary'} className="text-[10px]">
                {isGoogleConnected ? 'Authenticated' : 'Login Required'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Search Console Site URL</label>
                {config.gscSiteUrl !== 'https://boulderdecisions.com/' && (
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, gscSiteUrl: 'https://boulderdecisions.com/' }))}
                    className="text-[11px] text-[#14532D] hover:text-[#1B6B45] underline font-medium"
                  >
                    Set to https://boulderdecisions.com/
                  </button>
                )}
              </div>
              <Input
                placeholder="e.g. https://boulderdecisions.com/ or sc-domain:boulderdecisions.com"
                value={config.gscSiteUrl}
                onChange={(e) => setConfig((prev) => ({ ...prev, gscSiteUrl: e.target.value }))}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">Boulder Decisions site URL (e.g. https://boulderdecisions.com/ or sc-domain:boulderdecisions.com)</p>
            </div>

            {testResults.gsc && (
              <div className={`p-2.5 rounded text-xs ${testResults.gsc.result?.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                <p className="font-semibold">{testResults.gsc.result?.message}</p>
                {testResults.gsc.result?.actionUrl && (
                  <a href={testResults.gsc.result.actionUrl} target="_blank" rel="noreferrer" className="underline font-bold block mt-1">
                    {testResults.gsc.result.actionLabel || 'Enable in Google Cloud Console'} →
                  </a>
                )}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => runTest('gsc', { siteUrl: config.gscSiteUrl })}
              disabled={testResults.gsc?.testing || !isGoogleConnected}
              className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100"
            >
              {testResults.gsc?.testing ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              <span>Test Search Console Connection</span>
            </Button>
          </CardContent>
        </Card>

        {/* Card 3: Brand vs Non-Brand Matching Rules */}
        <Card className="border-slate-200 shadow-xs md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-[#14532D]" />
              <CardTitle className="text-sm font-bold text-slate-900">Brand vs Non-Brand Keyword Classifier</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Brand Matching Terms (comma-separated, case-insensitive)
                </label>
                {config.brandKeywords?.toLowerCase()?.includes('appliance') && (
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, brandKeywords: 'Boulder Decision,Boulder Decisions,boulderdecision,boulderdecisions,boulder decisions' }))}
                    className="text-[11px] text-[#14532D] hover:text-[#1B6B45] underline font-medium"
                  >
                    Reset to Boulder Decisions
                  </button>
                )}
              </div>
              <Input
                value={config.brandKeywords}
                onChange={(e) => setConfig((prev) => ({ ...prev, brandKeywords: e.target.value }))}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Queries in Search Console matching any of these terms are classified as <strong>Brand Queries</strong>; all others are classified as <strong>Non-Brand Queries</strong>. This dynamically calculates Brand vs Non-Brand clicks, impressions, and CTR without PDF dependencies.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Local SEO & Google Business Profile Performance */}
        <Card className="border-slate-200 shadow-xs flex flex-col justify-between md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#14532D]" />
                <CardTitle className="text-sm font-bold text-slate-900">
                  Google Business Profile Performance API &amp; Local SEO
                </CardTitle>
              </div>
              <Badge variant={isGoogleConnected ? 'success' : 'secondary'} className="text-[10px]">
                {isGoogleConnected ? 'API Active' : 'Login Required'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-xs text-slate-600 leading-relaxed">
              Google Business Profile Performance API (<code>businessprofileperformance.googleapis.com</code>) delivers real customer telemetry on Google Maps impressions, Search impressions, website visits, phone calls, and direction clicks directly to the Local SEO tab.
            </p>

            {testResults.localSeo && (
              <div
                className={`p-2.5 rounded text-xs ${
                  testResults.localSeo.result?.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                <p className="font-semibold">{testResults.localSeo.result?.message}</p>
                {testResults.localSeo.result?.actionLabel && (
                  <button
                    type="button"
                    onClick={handleStartGoogleOAuth}
                    className="underline font-bold block mt-1 cursor-pointer"
                  >
                    {testResults.localSeo.result.actionLabel} →
                  </button>
                )}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => runTest('localSeo')}
              disabled={testResults.localSeo?.testing}
              className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100"
            >
              {testResults.localSeo?.testing ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              <span>Test Google Business Profile Connection</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
