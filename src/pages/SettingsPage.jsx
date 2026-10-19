import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
  Link2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Search,
  Globe,
  Tag,
  MapPin,
  Sparkles,
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
            className="gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
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
              <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
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
                Authentication Mode: <span className="font-mono text-blue-700 font-bold uppercase">{authStatus?.authType || 'OAuth 2.0'}</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                OAuth Client ID: {authStatus?.clientId || '554369952704...'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isGoogleConnected ? (
                <Button onClick={handleStartGoogleOAuth} className="gap-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white">
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

          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60 text-xs text-amber-900 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <ExternalLink className="h-3.5 w-3.5 text-amber-700" /> Required Google Cloud APIs (Project 554369952704):
            </p>
            <p className="text-amber-800">
              Ensure both APIs are enabled in your Google Cloud Console for live data queries:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href="https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview?project=554369952704"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-white px-2.5 py-1 rounded border border-amber-300 hover:bg-amber-100"
              >
                1. Google Analytics Data API (analyticsdata.googleapis.com) <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=554369952704"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-white px-2.5 py-1 rounded border border-amber-300 hover:bg-amber-100"
              >
                2. Google Search Console API (searchconsole.googleapis.com) <ExternalLink className="h-3 w-3" />
              </a>
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
                <Globe className="h-4 w-4 text-blue-600" />
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
                placeholder="e.g. 516707960"
                value={config.ga4PropertyId}
                onChange={(e) => setConfig((prev) => ({ ...prev, ga4PropertyId: e.target.value }))}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">Appliance Care of Atlanta default property: <strong>516707960</strong></p>
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">Search Console Site URL</label>
              <Input
                placeholder="e.g. sc-domain:appliancecareofatlanta.com"
                value={config.gscSiteUrl}
                onChange={(e) => setConfig((prev) => ({ ...prev, gscSiteUrl: e.target.value }))}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">Domain property or full URL prefix (e.g. https://...)</p>
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
              <Tag className="h-4 w-4 text-violet-600" />
              <CardTitle className="text-sm font-bold text-slate-900">Brand vs Non-Brand Keyword Classifier</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Brand Matching Terms (comma-separated, case-insensitive)
              </label>
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

        {/* Card 4: Local SEO Provider */}
        <Card className="border-slate-200 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-bold text-slate-900">Local SEO & Geo-Grid Tracker</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px]">BrightLocal / GBP</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-xs text-slate-600 leading-relaxed">
              Google Maps 3x3 ranking maps require a local rank tracking provider API. Local organic search queries from Google Search Console are actively displayed in the Keyword Rankings tab.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runTest('localSeo')}
              className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100"
            >
              <span>Check Local SEO Status</span>
            </Button>
          </CardContent>
        </Card>

        {/* Card 5: Backlink Intelligence Provider */}
        <Card className="border-slate-200 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-bold text-slate-900">Backlinks & Authority Provider</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px]">Moz / OpenPageRank</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-xs text-slate-600 leading-relaxed">
              External link counts and Domain Authority (DA) require a backlink provider API (Moz API, OpenPageRank, or DataForSEO). Configure credentials in .env to enable live metrics.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runTest('backlinks')}
              className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100"
            >
              <span>Check Backlinks Status</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
