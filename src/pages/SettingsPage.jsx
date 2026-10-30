import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
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
  Building2,
  Plus,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  getApiConfig,
  saveApiConfig,
  getGoogleAuthUrl,
  disconnectGoogleAuth,
  fetchIntegrationsStatus,
  testIntegrationConnection,
  fetchGoogleAccounts,
  switchConnectedAccount,
} from '@/services/liveSeoApi';
import { useReport } from '@/context/ReportContext';

export default function SettingsPage() {
  const { refresh: refreshDashboard, backendHealth } = useReport();

  const [config, setConfig] = useState(getApiConfig());
  const [integrationsData, setIntegrationsData] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [accountSwitchedNotice, setAccountSwitchedNotice] = useState(null);

  // Google Accounts discovery state
  const [googleAccountsData, setGoogleAccountsData] = useState({
    authenticated: false,
    accounts: [],
    ga4Accounts: [],
    gscSites: [],
    userProfile: null,
    ga4Error: null,
    gscError: null,
  });
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [manualGa4, setManualGa4] = useState(false);
  const [manualGsc, setManualGsc] = useState(false);

  // Custom account profile modal state
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [customAccountForm, setCustomAccountForm] = useState({
    name: '',
    ga4PropertyId: '',
    gscSiteUrl: '',
    brandKeywords: '',
  });

  // Testing connection states: providerId -> { testing: boolean, result: object | null }
  const [testResults, setTestResults] = useState({});

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const data = await fetchGoogleAccounts();
      setGoogleAccountsData(data);

      // Auto-match or select if none selected
      const currentConfig = getApiConfig();
      const allAccounts = [
        ...(data.accounts || []),
        ...(currentConfig.savedAccounts || []),
      ];

      if (allAccounts.length > 0) {
        const match = allAccounts.find(
          (a) =>
            a.id === currentConfig.selectedAccountId ||
            (a.ga4PropertyId && a.ga4PropertyId === currentConfig.ga4PropertyId) ||
            (a.gscSiteUrl && a.gscSiteUrl === currentConfig.gscSiteUrl)
        );

        if (match && currentConfig.selectedAccountId !== match.id) {
          const updated = saveApiConfig({
            selectedAccountId: match.id,
            selectedAccountName: match.accountName || match.name,
          });
          setConfig(updated);
        }
      }
    } catch (e) {
      console.warn('Failed to load Google accounts:', e);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await fetchIntegrationsStatus();
      setIntegrationsData(data);
      if (data?.authStatus?.authenticated || backendHealth?.hasToken) {
        await loadAccounts();
      }
    } catch (e) {
      console.warn('Failed to load integrations status:', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
    loadAccounts();
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

  // Switch account from master dropdown
  const handleAccountChange = (selectedId) => {
    if (selectedId === '__add_new__') {
      setShowAddAccountModal(true);
      return;
    }

    const allAccounts = [
      ...(googleAccountsData.accounts || []),
      ...(config.savedAccounts || []),
    ];

    const account = allAccounts.find((a) => a.id === selectedId);
    if (!account) return;

    const newConfig = switchConnectedAccount(account);
    setConfig(newConfig);
    setAccountSwitchedNotice(
      `Connected data stream switched to "${account.accountName || account.name}". Live dashboard refreshed.`
    );
    setTimeout(() => setAccountSwitchedNotice(null), 5000);
    refreshDashboard();
  };

  // Switch GA4 Property from GA4 Card
  const handleGa4PropertyChange = (propId) => {
    if (propId === '__manual__') {
      setManualGa4(true);
      return;
    }
    const updated = saveApiConfig({ ...config, ga4PropertyId: propId });
    setConfig(updated);
    refreshDashboard();
  };

  // Switch GSC Site from Search Console Card
  const handleGscSiteChange = (siteUrl) => {
    if (siteUrl === '__manual__') {
      setManualGsc(true);
      return;
    }
    const updated = saveApiConfig({ ...config, gscSiteUrl: siteUrl });
    setConfig(updated);
    refreshDashboard();
  };

  // Add custom account profile
  const handleSaveCustomAccount = (e) => {
    e.preventDefault();
    if (!customAccountForm.name.trim()) return;

    const newAcc = {
      id: `custom-${Date.now()}`,
      name: customAccountForm.name.trim(),
      accountName: customAccountForm.name.trim(),
      propertyName: customAccountForm.name.trim(),
      ga4PropertyId: customAccountForm.ga4PropertyId.trim(),
      gscSiteUrl: customAccountForm.gscSiteUrl.trim(),
      brandKeywords: customAccountForm.brandKeywords.trim() || customAccountForm.name.trim(),
      source: 'custom',
    };

    const updatedSaved = [...(config.savedAccounts || []), newAcc];
    const updatedConfig = {
      ...config,
      savedAccounts: updatedSaved,
      selectedAccountId: newAcc.id,
      selectedAccountName: newAcc.name,
      ga4PropertyId: newAcc.ga4PropertyId || config.ga4PropertyId,
      gscSiteUrl: newAcc.gscSiteUrl || config.gscSiteUrl,
      brandKeywords: newAcc.brandKeywords || config.brandKeywords,
    };

    setConfig(updatedConfig);
    saveApiConfig(updatedConfig);
    setShowAddAccountModal(false);
    setCustomAccountForm({ name: '', ga4PropertyId: '', gscSiteUrl: '', brandKeywords: '' });
    setAccountSwitchedNotice(`Saved and connected to custom account "${newAcc.name}".`);
    setTimeout(() => setAccountSwitchedNotice(null), 5000);
    refreshDashboard();
  };

  const authStatus = integrationsData?.authStatus;
  const isGoogleConnected = authStatus?.authenticated || backendHealth?.hasToken;

  const allCombinedAccounts = [
    ...(googleAccountsData.accounts || []),
    ...(config.savedAccounts || []),
  ];

  const activeSelectedAccountId =
    config.selectedAccountId ||
    allCombinedAccounts.find(
      (a) =>
        (a.ga4PropertyId && a.ga4PropertyId === config.ga4PropertyId) ||
        (a.gscSiteUrl && a.gscSiteUrl === config.gscSiteUrl)
    )?.id ||
    '';

  const activeAccountObj = allCombinedAccounts.find((a) => a.id === activeSelectedAccountId) || {
    name: config.selectedAccountName || 'Boulder Decision',
    accountName: config.selectedAccountName || 'Boulder Decision',
    ga4PropertyId: config.ga4PropertyId,
    gscSiteUrl: config.gscSiteUrl,
  };

  const hasDiscoveredGa4 =
    googleAccountsData.ga4Accounts?.length > 0 &&
    googleAccountsData.ga4Accounts.some((a) => a.properties?.length > 0);

  const hasDiscoveredGsc = googleAccountsData.gscSites?.length > 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">API Integrations &amp; Data Sources</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage live API connections, Google accounts, and multi-account data streaming.
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

      {/* SECTION 1: Google Account Authentication & Account Switcher */}
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
          {/* Connection Status Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs font-semibold text-slate-800">
                {isGoogleConnected ? 'Google Cloud API Authorization' : 'Google Account Connection'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isGoogleConnected
                  ? googleAccountsData.userProfile?.email
                    ? `Authenticated as ${googleAccountsData.userProfile.email}. Login session active in cookies for live data syncing.`
                    : 'Authenticated. Login session saved in cookies for live data syncing.'
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

          {/* Connected Accounts Selection Dropdown Option (Displayed when Google Account is Connected) */}
          {isGoogleConnected && (
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/70 via-white to-slate-50/60 p-4 space-y-3.5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#14532D] text-white flex items-center justify-center shadow-xs">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                      <span>Connected Google Accounts &amp; Data Stream</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-[#14532D]">
                        Active Stream
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Switch which account connects to the dashboard to update GA4 traffic, Search Console, and rankings.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadAccounts}
                    disabled={loadingAccounts}
                    className="h-7 px-2.5 text-[11px] font-medium bg-white border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 cursor-pointer"
                    title="Reload accounts from Google Cloud"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingAccounts ? 'animate-spin text-[#14532D]' : ''}`} />
                    <span>{loadingAccounts ? 'Syncing...' : 'Sync Accounts'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddAccountModal(true)}
                    className="h-7 px-2.5 text-[11px] font-medium bg-white border-slate-200 text-[#14532D] hover:bg-emerald-50 gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>New Account</span>
                  </Button>
                </div>
              </div>

              {/* Account Dropdown */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Select Account (Data connects based on selected account)
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {allCombinedAccounts.length} {allCombinedAccounts.length === 1 ? 'account' : 'accounts'} available
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={activeSelectedAccountId}
                    onChange={(e) => handleAccountChange(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 shadow-xs outline-none focus:ring-2 focus:ring-[#14532D]/20 focus:border-[#14532D] transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select an account from the list...</option>
                    {googleAccountsData.accounts?.length > 0 && (
                      <optgroup label="Discovered Google Accounts & Properties">
                        {googleAccountsData.accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} — GA4: {acc.ga4PropertyId || 'None'} • GSC: {acc.gscSiteUrl || 'None'}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {config.savedAccounts?.length > 0 && (
                      <optgroup label="Custom Configured Accounts">
                        {config.savedAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            ★ {acc.name} — GA4: {acc.ga4PropertyId || 'None'} • GSC: {acc.gscSiteUrl || 'None'}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    <option value="__add_new__">+ Configure New Account Profile...</option>
                  </select>
                </div>
              </div>

              {/* Active Account Overview Badges */}
              {activeAccountObj && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-emerald-100">
                  <div className="p-2 rounded-lg bg-white border border-slate-200/80 shadow-xs flex flex-col justify-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Account</span>
                    <span className="text-xs font-bold text-slate-900 truncate" title={activeAccountObj.accountName || activeAccountObj.name}>
                      {activeAccountObj.accountName || activeAccountObj.name || 'Boulder Decision'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200/80 shadow-xs flex flex-col justify-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Connected GA4 Property</span>
                    <span className="text-xs font-mono font-semibold text-emerald-800 truncate" title={config.ga4PropertyId || 'Not specified'}>
                      {config.ga4PropertyId || 'Not specified'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200/80 shadow-xs flex flex-col justify-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Connected Search Console</span>
                    <span className="text-xs font-mono font-semibold text-emerald-800 truncate" title={config.gscSiteUrl || 'Not specified'}>
                      {config.gscSiteUrl || 'Not specified'}
                    </span>
                  </div>
                </div>
              )}

              {accountSwitchedNotice && (
                <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#14532D] shrink-0" />
                  <span>{accountSwitchedNotice}</span>
                </div>
              )}
            </div>
          )}
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
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">GA4 Property</label>
                {hasDiscoveredGa4 && (
                  <button
                    type="button"
                    onClick={() => setManualGa4(!manualGa4)}
                    className="text-[11px] text-[#14532D] hover:underline font-medium cursor-pointer"
                  >
                    {manualGa4 ? 'Select from list' : 'Enter ID manually'}
                  </button>
                )}
              </div>

              {!manualGa4 && hasDiscoveredGa4 ? (
                <select
                  value={config.ga4PropertyId}
                  onChange={(e) => handleGa4PropertyChange(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-mono text-slate-900 shadow-xs outline-none focus:ring-1 focus:ring-[#14532D] cursor-pointer"
                >
                  <option value="">Select a GA4 property from connected account...</option>
                  {googleAccountsData.ga4Accounts.map((acc) => (
                    <optgroup key={acc.accountId} label={`Account: ${acc.accountName}`}>
                      {acc.properties.map((prop) => (
                        <option key={prop.propertyId} value={prop.propertyId}>
                          {prop.propertyName} (ID: {prop.propertyId})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="__manual__">Enter Custom Property ID manually...</option>
                </select>
              ) : (
                <Input
                  placeholder="e.g. 516707960"
                  value={config.ga4PropertyId}
                  onChange={(e) => setConfig((prev) => ({ ...prev, ga4PropertyId: e.target.value }))}
                  className="font-mono text-xs"
                />
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                GA4 numeric Property ID. Website traffic and conversion metrics sync from this property.
              </p>
            </div>

            {googleAccountsData.ga4Error?.actionUrl && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <p className="font-semibold">{googleAccountsData.ga4Error.message}</p>
                <a
                  href={googleAccountsData.ga4Error.actionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline text-[#14532D] block cursor-pointer"
                >
                  {googleAccountsData.ga4Error.actionLabel || 'Enable in Google Cloud Console'} →
                </a>
              </div>
            )}

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
              className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 cursor-pointer"
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
                {hasDiscoveredGsc && (
                  <button
                    type="button"
                    onClick={() => setManualGsc(!manualGsc)}
                    className="text-[11px] text-[#14532D] hover:underline font-medium cursor-pointer"
                  >
                    {manualGsc ? 'Select from list' : 'Enter URL manually'}
                  </button>
                )}
              </div>

              {!manualGsc && hasDiscoveredGsc ? (
                <select
                  value={config.gscSiteUrl}
                  onChange={(e) => handleGscSiteChange(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-mono text-slate-900 shadow-xs outline-none focus:ring-1 focus:ring-[#14532D] cursor-pointer"
                >
                  <option value="">Select a verified site URL from connected account...</option>
                  {googleAccountsData.gscSites.map((site) => (
                    <option key={site.siteUrl} value={site.siteUrl}>
                      {site.siteUrl} ({site.permissionLevel || 'Verified'})
                    </option>
                  ))}
                  <option value="__manual__">Enter Custom Site URL manually...</option>
                </select>
              ) : (
                <Input
                  placeholder="e.g. https://boulderdecisions.com/ or sc-domain:boulderdecisions.com"
                  value={config.gscSiteUrl}
                  onChange={(e) => setConfig((prev) => ({ ...prev, gscSiteUrl: e.target.value }))}
                  className="font-mono text-xs"
                />
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                Search Console site URL (e.g. https://boulderdecisions.com/ or sc-domain:boulderdecisions.com).
              </p>
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
              className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 cursor-pointer"
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
                {config.brandKeywords !== 'Boulder Decision,Boulder Decisions,boulderdecision,boulderdecisions,boulder decisions' && (
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, brandKeywords: 'Boulder Decision,Boulder Decisions,boulderdecision,boulderdecisions,boulder decisions' }))}
                    className="text-[11px] text-[#14532D] hover:text-[#1B6B45] underline font-medium cursor-pointer"
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
              className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 cursor-pointer"
            >
              {testResults.localSeo?.testing ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              <span>Test Google Business Profile Connection</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Add Custom Account Modal */}
      <Dialog open={showAddAccountModal} onOpenChange={setShowAddAccountModal}>
        <DialogContent onClose={() => setShowAddAccountModal(false)} className="max-w-md p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-[#14532D]">
                <Building2 className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">Configure Account Profile</DialogTitle>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveCustomAccount} className="space-y-4 py-2">
            <p className="text-xs text-slate-500">
              Save a custom client account profile to quickly switch GA4 and Search Console data streams from the account dropdown.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Account / Client Name *</label>
              <Input
                placeholder="e.g. Acme Corp or Boulder Decision"
                value={customAccountForm.name}
                onChange={(e) => setCustomAccountForm({ ...customAccountForm, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">GA4 Property ID</label>
              <Input
                placeholder="e.g. 516707960"
                value={customAccountForm.ga4PropertyId}
                onChange={(e) => setCustomAccountForm({ ...customAccountForm, ga4PropertyId: e.target.value })}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Search Console Site URL</label>
              <Input
                placeholder="e.g. https://example.com/ or sc-domain:example.com"
                value={customAccountForm.gscSiteUrl}
                onChange={(e) => setCustomAccountForm({ ...customAccountForm, gscSiteUrl: e.target.value })}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Brand Keywords (optional)</label>
              <Input
                placeholder="e.g. Acme, Acme Corp"
                value={customAccountForm.brandKeywords}
                onChange={(e) => setCustomAccountForm({ ...customAccountForm, brandKeywords: e.target.value })}
                className="font-mono text-xs"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddAccountModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-[#14532D] hover:bg-[#1B6B45] text-white font-semibold">
                Save &amp; Connect Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
