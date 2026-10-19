import React, { useState, useEffect } from 'react';
import { X, Check, Save, Terminal, Info, ExternalLink, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { getApiConfig, saveApiConfig, checkBackendHealth, getGoogleAuthUrl, fetchGscSites } from '../services/seoApi';

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

  if (!isOpen) return null;

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
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Terminal size={18} className="modal-icon" />
            <h3 className="modal-title">Live API Configuration</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Status banner */}
          <div className="google-auth-card">
            <div className="google-auth-header">
              <div className="google-auth-status">
                {isConnected ? (
                  <span className="badge-connected">
                    <CheckCircle2 size={15} /> Google Account Connected
                  </span>
                ) : (
                  <span className="badge-disconnected">
                    <ShieldAlert size={15} /> Google Account Not Connected
                  </span>
                )}
              </div>

              <button
                type="button"
                className="btn btn-secondary google-btn"
                onClick={handleConnectGoogle}
              >
                <img
                  src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                  alt="Google"
                  width="16"
                  height="16"
                />
                <span>{isConnected ? 'Reconnect Google' : 'Connect with Google'}</span>
              </button>
            </div>

            <p className="auth-hint">
              OAuth 2.0 uses your Google Cloud Client ID & Secret to query live Search Console and GA4 metrics.
            </p>
            {oauthError && <div className="oauth-error-text">{oauthError}</div>}
          </div>

          {/* Cloud API Enablement Notice if encountered */}
          {activeError && activeError.includes('has not been used in project') && (
            <div className="api-enable-notice">
              <div className="notice-title">
                <ShieldAlert size={16} /> Action Required in Google Cloud Console
              </div>
              <p>One or more APIs need to be enabled for your project (<strong>554369952704</strong>):</p>
              <div className="enable-links">
                <a
                  href="https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=554369952704"
                  target="_blank"
                  rel="noreferrer"
                  className="enable-link"
                >
                  <ExternalLink size={13} /> Enable Google Search Console API
                </a>
                <a
                  href="https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview?project=554369952704"
                  target="_blank"
                  rel="noreferrer"
                  className="enable-link"
                >
                  <ExternalLink size={13} /> Enable Google Analytics Data API
                </a>
              </div>
              <span className="notice-sub">After clicking Enable, wait 1-2 minutes and click Refresh.</span>
            </div>
          )}

          {/* GSC Site Selection */}
          <div className="form-group" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Google Search Console Property</label>
              {sites.length > 0 && (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => loadSites(config.apiToken)}
                  disabled={loadingSites}
                >
                  <RefreshCw size={12} className={loadingSites ? 'spinning' : ''} /> Refresh properties
                </button>
              )}
            </div>

            {sites.length > 0 ? (
              <select
                className="form-input"
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
              <input
                type="text"
                className="form-input"
                placeholder="e.g. sc-domain:mamajanrocks.com or https://mamajanmusic.com/"
                value={config.gscSiteUrl}
                onChange={(e) => setConfig({ ...config, gscSiteUrl: e.target.value })}
              />
            )}
            <span className="form-help">Enter your exact property URL or Domain (e.g. sc-domain:yourdomain.com)</span>
          </div>

          {/* GA4 Property ID */}
          <div className="form-group">
            <label className="form-label">Google Analytics 4 Property ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 516707960 or properties/516707960"
              value={config.ga4PropertyId}
              onChange={(e) => setConfig({ ...config, ga4PropertyId: e.target.value })}
            />
            <span className="form-help">From GA4 Admin &gt; Property Details (e.g. 516707960)</span>
          </div>

          {saveStatus && <div className="save-success-msg"><Check size={14} /> {saveStatus}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={15} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
