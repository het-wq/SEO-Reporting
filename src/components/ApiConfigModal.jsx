import React, { useState, useEffect } from 'react';
import { Terminal, ShieldAlert, CheckCircle2, RefreshCw, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getApiConfig, saveApiConfig, checkBackendHealth, getGoogleAuthUrl, fetchGscSites } from '@/services/seoApi';

export default function ApiConfigModal({ isOpen, onClose, onConfigSaved, activeError }) {
  const [config, setConfig] = useState({
    endpointUrl: 'http://localhost:5001',
    ga4PropertyId: '516707960',
    gscSiteUrl: '',
    apiToken: '',
    googleConnected: false,
  });

  const [backendStatus, setBackendStatus] = useState({ configured: false, hasToken: false, status: 'checking' });
  const [sites, setSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [oauthError, setOauthError] = useState('');

  const loadStatus = async () => {
    const health = await checkBackendHealth();
    setBackendStatus(health);

    const currentConfig = getApiConfig();
    setConfig(currentConfig);

    if (health.hasToken || currentConfig.apiToken) {
      loadSites(currentConfig.apiToken);
    }
  };

  const loadSites = async (token) => {
    setLoadingSites(true);
    try {
      const siteList = await fetchGscSites(token);
      setSites(siteList);
      if (siteList.length > 0 && !config.gscSiteUrl) {
        setConfig((prev) => ({ ...prev, gscSiteUrl: siteList[0].siteUrl }));
      }
    } catch (e) {
      console.warn('Could not list GSC sites:', e);
    } finally {
      setLoadingSites(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setSaveStatus('');
      setOauthError('');
    }
  }, [isOpen]);

  const handleConnectGoogle = async () => {
    try {
      setOauthError('');
      const data = await getGoogleAuthUrl();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setOauthError(err.message || 'Failed to start Google OAuth');
    }
  };

  const handleSave = () => {
    saveApiConfig(config);
    setSaveStatus('Settings saved successfully!');
    if (onConfigSaved) onConfigSaved(config);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const isConnected = backendStatus.hasToken || Boolean(config.apiToken);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-lg p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <Terminal className="h-4 w-4" />
            </div>
            <DialogTitle>Google API Configuration</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Connection status card */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Badge variant={isConnected ? 'success' : 'destructive'} className="py-1 px-2.5 gap-1.5 font-medium">
                {isConnected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                <span>{isConnected ? 'Account Connected' : 'Not Connected'}</span>
              </Badge>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleConnectGoogle}
                className="bg-white gap-2 font-medium"
              >
                <img
                  src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                  alt="Google"
                  width="14"
                  height="14"
                />
                <span>{isConnected ? 'Reconnect Google' : 'Connect with Google'}</span>
              </Button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Google OAuth 2.0 retrieves authenticated data directly from your verified Google Search Console and GA4 properties.
            </p>
            {oauthError && <p className="text-xs text-red-600 font-medium">{oauthError}</p>}
          </div>

          {/* Cloud API Enable Notice */}
          {activeError && activeError.includes('has not been used in project') && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                <ShieldAlert className="h-4 w-4" />
                <span>Action Needed in Google Cloud Console</span>
              </div>
              <p className="text-xs text-amber-700">
                Enable the following APIs in project <strong>554369952704</strong>:
              </p>
              <div className="flex flex-col gap-1.5 pt-1">
                <a
                  href="https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=554369952704"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-blue-700 underline flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3 w-3" /> Enable Google Search Console API
                </a>
                <a
                  href="https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview?project=554369952704"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-blue-700 underline flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3 w-3" /> Enable Google Analytics Data API
                </a>
              </div>
            </div>
          )}

          {/* GSC Property */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">Search Console Property</label>
              {sites.length > 0 && (
                <button
                  type="button"
                  onClick={() => loadSites(config.apiToken)}
                  disabled={loadingSites}
                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingSites ? 'animate-spin' : ''}`} /> Refresh
                </button>
              )}
            </div>

            {sites.length > 0 ? (
              <select
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-xs outline-none focus:ring-1 focus:ring-blue-500"
                value={config.gscSiteUrl}
                onChange={(e) => setConfig({ ...config, gscSiteUrl: e.target.value })}
              >
                <option value="">Select a verified site...</option>
                {sites.map((s) => (
                  <option key={s.siteUrl} value={s.siteUrl}>
                    {s.siteUrl} ({s.permissionLevel || 'Verified'})
                  </option>
                ))}
              </select>
            ) : (
              <Input
                type="text"
                placeholder="e.g. sc-domain:yourdomain.com or https://yourdomain.com/"
                value={config.gscSiteUrl}
                onChange={(e) => setConfig({ ...config, gscSiteUrl: e.target.value })}
              />
            )}
            <p className="text-[11px] text-slate-400">Search Console property URL or Domain prefix</p>
          </div>

          {/* GA4 Property ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Google Analytics 4 Property ID</label>
            <Input
              type="text"
              placeholder="e.g. 516707960"
              value={config.ga4PropertyId}
              onChange={(e) => setConfig({ ...config, ga4PropertyId: e.target.value })}
            />
            <p className="text-[11px] text-slate-400">Numerical GA4 property identifier</p>
          </div>

          {saveStatus && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{saveStatus}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSave}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
