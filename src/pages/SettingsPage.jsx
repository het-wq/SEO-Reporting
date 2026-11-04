import React, { useState, useEffect, useMemo } from 'react';
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
  Megaphone,
  Trash2,
  Edit2,
  ExternalLink,
  Layers,
  X,
  AlertCircle,
  Link2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
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
  deriveBrandKeywords,
  fetchAccountKeywordsFromDb,
  saveBrandAndNonBrandKeywords,
  testGoogleAdsConnection,
  fetchClientsApi,
  createClientApi,
  updateClientApi,
  deleteClientApi,
  fetchClientPropertiesApi,
  mapClientPropertyApi,
  unmapClientPropertyApi,
  fetchStoredGoogleConnectionsApi,
  fetchClientBrandTermsApi,
  saveClientBrandTermsApi,
} from '@/services/liveSeoApi';
import { useReport } from '@/context/ReportContext';
import { useClient } from '@/context/ClientContext';

export default function SettingsPage() {
  const { refresh: refreshDashboard, backendHealth } = useReport();
  const { clients, selectedClientId, switchClient, refreshClients } = useClient();

  const [activeTab, setActiveTab] = useState('clients');
  const [config, setConfig] = useState(getApiConfig());
  const [integrationsData, setIntegrationsData] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Google Accounts discovery state
  const [googleAccountsData, setGoogleAccountsData] = useState({
    authenticated: false,
    accounts: [],
    ga4Accounts: [],
    gscSites: [],
    gbpLocations: [],
    gbpAccounts: [],
    gbpRequiresReauth: false,
    userProfile: null,
    ga4Error: null,
    gscError: null,
    gbpError: null,
  });
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [storedConnections, setStoredConnections] = useState([]);

  // Multi-Client Management state
  const [clientList, setClientList] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    website_url: '',
    domain: '',
  });

  // Property Mapping state
  const [mappingClientId, setMappingClientId] = useState(selectedClientId || '');
  const [mappingGa4PropId, setMappingGa4PropId] = useState('');
  const [mappingGscSiteUrl, setMappingGscSiteUrl] = useState('');
  const [clientPropertiesList, setClientPropertiesList] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Brand Terms Settings state
  const [brandClientId, setBrandClientId] = useState(selectedClientId || '');
  const [clientBrandTerms, setClientBrandTerms] = useState([]);
  const [newBrandTermInput, setNewBrandTermInput] = useState('');
  const [savingBrandTerms, setSavingBrandTerms] = useState(false);

  // Testing connection states: providerId -> { testing: boolean, result: object | null }
  const [testResults, setTestResults] = useState({});
  const [manualGa4, setManualGa4] = useState(false);
  const [manualGsc, setManualGsc] = useState(false);
  const [manualGbp, setManualGbp] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync active mapping & brand client with global selectedClientId
  useEffect(() => {
    if (selectedClientId) {
      setMappingClientId(selectedClientId);
      setBrandClientId(selectedClientId);
    }
  }, [selectedClientId]);

  // Load clients list
  const loadClientList = async () => {
    setLoadingClients(true);
    try {
      const data = await fetchClientsApi();
      setClientList(data);
    } catch (e) {
      console.warn('Failed to load clients list in settings:', e);
    } finally {
      setLoadingClients(false);
    }
  };

  // Load Google accounts and stored connections
  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const [data, connections] = await Promise.all([
        fetchGoogleAccounts().catch(() => ({})),
        fetchStoredGoogleConnectionsApi().catch(() => []),
      ]);
      setGoogleAccountsData(data || {});
      setStoredConnections(connections || []);
    } catch (e) {
      console.warn('Failed to load Google accounts:', e);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Load properties for selected mapping client
  const loadPropertiesForClient = async (cId) => {
    if (!cId) return;
    setLoadingProperties(true);
    try {
      const props = await fetchClientPropertiesApi(cId);
      setClientPropertiesList(props);
      const ga4 = props.find((p) => p.property_type === 'GA4');
      const gsc = props.find((p) => p.property_type === 'GSC');
      if (ga4) setMappingGa4PropId(ga4.property_id);
      else setMappingGa4PropId('');
      if (gsc) setMappingGscSiteUrl(gsc.property_id);
      else setMappingGscSiteUrl('');
    } catch (e) {
      console.warn('Failed to load client properties:', e);
    } finally {
      setLoadingProperties(false);
    }
  };

  // Load brand terms for selected brand client
  const loadBrandTermsForClient = async (cId) => {
    if (!cId) return;
    try {
      const terms = await fetchClientBrandTermsApi(cId);
      if (Array.isArray(terms) && terms.length > 0) {
        setClientBrandTerms(terms.map((t) => (typeof t === 'string' ? t : t.term)));
      } else {
        const found = clientList.find((c) => c.id === cId) || clients.find((c) => c.id === cId);
        const derived = deriveBrandKeywords({ accountName: found?.name, siteUrl: found?.website_url });
        setClientBrandTerms(derived.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
      }
    } catch (e) {
      console.warn('Failed to load brand terms:', e);
    }
  };

  useEffect(() => {
    if (mappingClientId) {
      loadPropertiesForClient(mappingClientId);
    }
  }, [mappingClientId]);

  useEffect(() => {
    if (brandClientId) {
      loadBrandTermsForClient(brandClientId);
    }
  }, [brandClientId]);

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await fetchIntegrationsStatus();
      setIntegrationsData(data);
      await Promise.all([loadClientList(), loadAccounts()]);
    } catch (e) {
      console.warn('Failed to load integrations status:', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // 1. CLIENT MANAGEMENT HANDLERS
  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!newClientForm.name.trim()) return;

    try {
      await createClientApi(newClientForm);
      showToast(`Client "${newClientForm.name}" created successfully!`);
      setShowAddClientModal(false);
      setNewClientForm({ name: '', website_url: '', domain: '' });
      await loadClientList();
      refreshClients();
    } catch (err) {
      alert('Failed to create client: ' + err.message);
    }
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    if (!editingClient || !editingClient.name.trim()) return;

    try {
      await updateClientApi(editingClient.id, {
        name: editingClient.name,
        website_url: editingClient.website_url,
        domain: editingClient.domain,
        status: editingClient.status,
      });
      showToast(`Client "${editingClient.name}" updated!`);
      setShowEditClientModal(false);
      setEditingClient(null);
      await loadClientList();
      refreshClients();
      refreshDashboard();
    } catch (err) {
      alert('Failed to update client: ' + err.message);
    }
  };

  const handleDeleteClient = async (client) => {
    if (window.confirm(`Are you sure you want to deactivate client "${client.name}"?`)) {
      try {
        await deleteClientApi(client.id);
        showToast(`Client "${client.name}" deactivated.`);
        await loadClientList();
        refreshClients();
      } catch (err) {
        alert('Failed to deactivate client: ' + err.message);
      }
    }
  };

  // 2. PROPERTY MAPPING HANDLERS
  const handleSavePropertyMapping = async () => {
    if (!mappingClientId) {
      alert('Please select a client to map properties.');
      return;
    }

    try {
      const promises = [];
      if (mappingGa4PropId) {
        promises.push(
          mapClientPropertyApi(mappingClientId, {
            property_type: 'GA4',
            property_id: mappingGa4PropId.trim(),
            property_name: `GA4 (${mappingGa4PropId.trim()})`,
          })
        );
      }
      if (mappingGscSiteUrl) {
        promises.push(
          mapClientPropertyApi(mappingClientId, {
            property_type: 'GSC',
            property_id: mappingGscSiteUrl.trim(),
            property_name: `GSC (${mappingGscSiteUrl.trim()})`,
          })
        );
      }

      await Promise.all(promises);
      showToast('Google properties mapped and saved successfully!');
      await loadPropertiesForClient(mappingClientId);
      refreshDashboard();
    } catch (err) {
      alert('Failed to save property mappings: ' + err.message);
    }
  };

  const handleUnmapProperty = async (propertyId) => {
    if (window.confirm(`Unmap property ${propertyId}?`)) {
      try {
        await unmapClientPropertyApi(mappingClientId, propertyId);
        showToast(`Property ${propertyId} unmapped.`);
        await loadPropertiesForClient(mappingClientId);
        refreshDashboard();
      } catch (err) {
        alert('Failed to unmap property: ' + err.message);
      }
    }
  };

  // 3. BRAND TERMS HANDLERS
  const handleAddBrandTerm = (e) => {
    if (e) e.preventDefault();
    const clean = newBrandTermInput.trim().toLowerCase();
    if (!clean) return;
    if (!clientBrandTerms.includes(clean)) {
      setClientBrandTerms([...clientBrandTerms, clean]);
    }
    setNewBrandTermInput('');
  };

  const handleDeleteBrandTerm = (termToRemove) => {
    setClientBrandTerms(clientBrandTerms.filter((t) => t !== termToRemove));
  };

  const handleSaveBrandTerms = async () => {
    if (!brandClientId) return;
    setSavingBrandTerms(true);
    try {
      await saveClientBrandTermsApi(brandClientId, clientBrandTerms);
      showToast('Brand terms saved to database!');
      refreshDashboard();
    } catch (err) {
      alert('Failed to save brand terms: ' + err.message);
    } finally {
      setSavingBrandTerms(false);
    }
  };

  const handleResetBrandDefaults = () => {
    const found = clientList.find((c) => c.id === brandClientId) || clients.find((c) => c.id === brandClientId);
    if (!found) return;
    if (window.confirm(`Reset brand keywords to ${found.name} defaults?`)) {
      const derived = deriveBrandKeywords({ accountName: found.name, siteUrl: found.website_url });
      setClientBrandTerms(derived.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
    }
  };

  // 4. GOOGLE OAUTH
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

  // 5. TEST INTEGRATION CONNECTIONS
  const runTest = async (providerId, extraParams = {}) => {
    setTestResults((prev) => ({
      ...prev,
      [providerId]: { testing: true, result: null },
    }));

    try {
      let result;
      if (providerId === 'googleAds') {
        result = await testGoogleAdsConnection(extraParams);
      } else {
        result = await testIntegrationConnection(providerId, extraParams);
      }

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
          result: { success: false, message: err.message || 'Connection test failed' },
        },
      }));
    }
  };

  const authStatus = integrationsData?.authStatus;
  const isGoogleConnected = authStatus?.authenticated || backendHealth?.hasToken;
  const hasDiscoveredGa4 = googleAccountsData.ga4Accounts?.some((a) => a.properties?.length > 0);
  const hasDiscoveredGsc = (googleAccountsData.gscSites || []).length > 0;
  const hasDiscoveredGbp = (googleAccountsData.gbpLocations || []).length > 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#14532D]" />
            <span>Multi-Client Settings &amp; Integrations</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage clients, Google OAuth connections, property mappings, and brand keyword classification rules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStatus}
            disabled={loadingStatus}
            className="gap-1.5 text-xs bg-white cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingStatus ? 'animate-spin text-[#14532D]' : ''}`} />
            <span>Refresh Telemetry</span>
          </Button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Settings Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full bg-slate-100 p-1 rounded-xl gap-1">
          <TabsTrigger value="clients" className="text-xs font-semibold gap-1.5 cursor-pointer data-[state=active]:bg-white data-[state=active]:text-[#14532D] data-[state=active]:shadow-xs">
            <Building2 className="h-3.5 w-3.5" />
            <span>Clients</span>
          </TabsTrigger>
          <TabsTrigger value="connections" className="text-xs font-semibold gap-1.5 cursor-pointer data-[state=active]:bg-white data-[state=active]:text-[#14532D] data-[state=active]:shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Google OAuth</span>
          </TabsTrigger>
          <TabsTrigger value="mapping" className="text-xs font-semibold gap-1.5 cursor-pointer data-[state=active]:bg-white data-[state=active]:text-[#14532D] data-[state=active]:shadow-xs">
            <Globe className="h-3.5 w-3.5" />
            <span>Property Mapping</span>
          </TabsTrigger>
          <TabsTrigger value="brands" className="text-xs font-semibold gap-1.5 cursor-pointer data-[state=active]:bg-white data-[state=active]:text-[#14532D] data-[state=active]:shadow-xs">
            <Tag className="h-3.5 w-3.5" />
            <span>Brand Keywords</span>
          </TabsTrigger>
          <TabsTrigger value="providers" className="text-xs font-semibold gap-1.5 cursor-pointer data-[state=active]:bg-white data-[state=active]:text-[#14532D] data-[state=active]:shadow-xs">
            <Megaphone className="h-3.5 w-3.5" />
            <span>SEO &amp; Ads APIs</span>
          </TabsTrigger>
        </TabsList>

        {/* =================================================================== */}
        {/* TAB 1: CLIENT MANAGEMENT                                           */}
        {/* =================================================================== */}
        <TabsContent value="clients" className="mt-4 space-y-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Client Management</span>
                    <Badge variant="outline" className="bg-emerald-50 text-[#14532D] border-emerald-300 text-[10px]">
                      {clientList.length || clients.length} Clients Active
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure client organizations, domains, websites, and reporting profiles.
                  </p>
                </div>
                <Button
                  onClick={() => setShowAddClientModal(true)}
                  className="gap-1.5 text-xs font-semibold bg-[#14532D] hover:bg-[#1B6B45] text-white cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add New Client</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Website URL</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(clientList.length > 0 ? clientList : clients).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#14532D]" />
                          <span>{c.name}</span>
                          {c.id === selectedClientId && (
                            <Badge className="bg-[#14532D] text-white text-[9px] px-1.5 py-0">Current</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={c.website_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#14532D] hover:underline inline-flex items-center gap-1 font-mono"
                        >
                          {c.website_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-600">{c.domain || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={c.status !== false ? 'success' : 'secondary'} className="text-[10px]">
                          {c.status !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingClient(c);
                              setShowEditClientModal(true);
                            }}
                            className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                            title="Edit Client"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClient(c)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            title="Deactivate Client"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =================================================================== */}
        {/* TAB 2: GOOGLE OAUTH CONNECTIONS                                    */}
        {/* =================================================================== */}
        <TabsContent value="connections" className="mt-4 space-y-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 text-[#14532D] flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">Google OAuth &amp; Service Authentication</CardTitle>
                    <p className="text-xs text-slate-500">
                      OAuth 2.0 connects Google Search Console, Google Analytics 4, and Business Profile APIs with encrypted token storage.
                    </p>
                  </div>
                </div>
                <Badge variant={isGoogleConnected ? 'success' : 'secondary'} className="text-xs font-semibold">
                  {isGoogleConnected ? 'Google Connected' : 'Not Connected'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    {isGoogleConnected ? 'Google Cloud API Session' : 'Connect Google Cloud Account'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isGoogleConnected
                      ? googleAccountsData.userProfile?.email
                        ? `Authenticated as ${googleAccountsData.userProfile.email}. Refresh tokens are encrypted server-side with AES-256-GCM.`
                        : 'Authenticated. Login session saved in secure cookies for multi-client data retrieval.'
                      : 'Authenticate with Google to grant access to Search Console and GA4 properties for client assignment.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isGoogleConnected ? (
                    <Button onClick={handleStartGoogleOAuth} className="gap-2 text-xs font-semibold bg-[#14532D] hover:bg-[#1B6B45] text-white">
                      <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="h-4 w-4" />
                      <span>Connect with Google</span>
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={handleStartGoogleOAuth} className="gap-1.5 text-xs bg-white text-slate-700">
                        <RotateCcw className="h-3.5 w-3.5" /> <span>Connect Another Account</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDisconnect} className="gap-1.5 text-xs text-red-600 hover:bg-red-50 border-red-200">
                        <LogOut className="h-3.5 w-3.5" /> <span>Disconnect</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Database Connections Table */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Stored Google Connections (Database: google_connections)
                </h4>
                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                  {storedConnections.length > 0 ? (
                    <div className="space-y-2">
                      {storedConnections.map((conn) => (
                        <div key={conn.id} className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-200 text-xs">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            <div>
                              <p className="font-semibold text-slate-900">{conn.google_email}</p>
                              <p className="text-[10px] text-slate-400">ID: {conn.id}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-emerald-50 text-[#14532D] border-emerald-300 text-[10px]">
                            {conn.status ? 'Active / Encrypted' : 'Inactive'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      {isGoogleConnected
                        ? `Connected Google account active (${googleAccountsData.userProfile?.email || 'Live Session'}). Properties can be mapped below.`
                        : 'No Google connections stored in database. Click "Connect with Google" above.'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =================================================================== */}
        {/* TAB 3: PROPERTY MAPPING (MULTI-CLIENT)                              */}
        {/* =================================================================== */}
        <TabsContent value="mapping" className="mt-4 space-y-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#14532D]" />
                <span>Google Property Mapping (client_google_properties)</span>
              </CardTitle>
              <p className="text-xs text-slate-500">
                Map Google Analytics 4 properties and Google Search Console sites to individual clients.
              </p>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              {/* Client Selection for Mapping */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">1. Select Client</label>
                  <select
                    value={mappingClientId}
                    onChange={(e) => setMappingClientId(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-900 shadow-2xs outline-none focus:ring-1 focus:ring-[#14532D]"
                  >
                    {(clientList.length > 0 ? clientList : clients).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.domain || 'no domain'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">2. Assign GA4 Property</label>
                  {hasDiscoveredGa4 ? (
                    <select
                      value={mappingGa4PropId}
                      onChange={(e) => setMappingGa4PropId(e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-mono text-slate-900 shadow-2xs outline-none focus:ring-1 focus:ring-[#14532D]"
                    >
                      <option value="">Choose discovered GA4 property...</option>
                      {googleAccountsData.ga4Accounts.map((acc) => (
                        <optgroup key={acc.accountId} label={`Account: ${acc.accountName}`}>
                          {acc.properties.map((p) => (
                            <option key={p.propertyId} value={p.propertyId}>
                              {p.propertyName} ({p.propertyId})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  ) : (
                    <Input
                      placeholder="e.g. 516707960"
                      value={mappingGa4PropId}
                      onChange={(e) => setMappingGa4PropId(e.target.value)}
                      className="font-mono text-xs"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">3. Assign Search Console Site</label>
                  {hasDiscoveredGsc ? (
                    <select
                      value={mappingGscSiteUrl}
                      onChange={(e) => setMappingGscSiteUrl(e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-mono text-slate-900 shadow-2xs outline-none focus:ring-1 focus:ring-[#14532D]"
                    >
                      <option value="">Choose verified site URL...</option>
                      {googleAccountsData.gscSites.map((s) => (
                        <option key={s.siteUrl} value={s.siteUrl}>
                          {s.siteUrl}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      placeholder="e.g. sc-domain:example.com"
                      value={mappingGscSiteUrl}
                      onChange={(e) => setMappingGscSiteUrl(e.target.value)}
                      className="font-mono text-xs"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSavePropertyMapping}
                  className="gap-1.5 text-xs font-semibold bg-[#14532D] hover:bg-[#1B6B45] text-white cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Property Mapping</span>
                </Button>
              </div>

              {/* Current Properties for Selected Client Table */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Active Property Mappings for Selected Client
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Property Identifier / Site URL</TableHead>
                      <TableHead>Display Label</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientPropertiesList.length > 0 ? (
                      clientPropertiesList.map((p) => (
                        <TableRow key={p.id || p.property_id}>
                          <TableCell>
                            <Badge className={p.property_type === 'GA4' ? 'bg-blue-600 text-white' : 'bg-emerald-700 text-white'}>
                              {p.property_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold text-slate-800">{p.property_id}</TableCell>
                          <TableCell className="text-xs text-slate-600">{p.property_name || p.property_id}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-emerald-50 text-[#14532D] border-emerald-300 text-[10px]">
                              Mapped &amp; Active
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnmapProperty(p.property_id)}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                              title="Unmap Property"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-slate-400 text-xs">
                          No properties explicitly mapped for this client yet. Assign GA4 and Search Console above.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =================================================================== */}
        {/* TAB 4: CLIENT BRAND KEYWORD RULES                                   */}
        {/* =================================================================== */}
        <TabsContent value="brands" className="mt-4 space-y-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[#14532D]" />
                    <span>Client Brand Terms (client_brand_terms)</span>
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Terms that define branded searches for each client. Search Console queries matching these terms are classified as branded.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700 mr-1">Client:</label>
                  <select
                    value={brandClientId}
                    onChange={(e) => setBrandClientId(e.target.value)}
                    className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-900 shadow-2xs outline-none focus:ring-1 focus:ring-[#14532D]"
                  >
                    {(clientList.length > 0 ? clientList : clients).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Add Brand Term Form */}
              <form onSubmit={handleAddBrandTerm} className="flex gap-2">
                <Input
                  placeholder="Enter brand term or spelling variation (e.g. acme, acme corp)..."
                  value={newBrandTermInput}
                  onChange={(e) => setNewBrandTermInput(e.target.value)}
                  className="text-xs"
                />
                <Button type="submit" size="sm" className="bg-[#14532D] hover:bg-[#1B6B45] text-white font-semibold gap-1 shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Term</span>
                </Button>
              </form>

              {/* Brand Terms Badges */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Configured Brand Terms ({clientBrandTerms.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleResetBrandDefaults}
                    className="text-[11px] text-[#14532D] hover:underline font-semibold cursor-pointer"
                  >
                    Reset to Defaults
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {clientBrandTerms.map((term) => (
                    <span
                      key={term}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-emerald-300 text-emerald-950 shadow-2xs"
                    >
                      <span>{term}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteBrandTerm(term)}
                        className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                  {clientBrandTerms.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No brand terms added yet. Add terms above.</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={handleSaveBrandTerms}
                  disabled={savingBrandTerms}
                  className="gap-1.5 text-xs font-semibold bg-[#14532D] hover:bg-[#1B6B45] text-white cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{savingBrandTerms ? 'Saving...' : 'Save Brand Terms to Database'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =================================================================== */}
        {/* TAB 5: THIRD-PARTY SEO & ADS INTEGRATIONS                           */}
        {/* =================================================================== */}
        <TabsContent value="providers" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Local SEO & Google Business Profile */}
            <Card className="border-slate-200 shadow-xs flex flex-col justify-between md:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#14532D]" />
                    <CardTitle className="text-sm font-bold text-slate-900">Google Business Profile Performance</CardTitle>
                  </div>
                  <Badge variant={isGoogleConnected ? 'success' : 'secondary'} className="text-[10px]">
                    {isGoogleConnected ? 'API Active' : 'Login Required'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <p className="text-xs text-slate-600">
                  Google Business Profile Performance API delivers real customer telemetry on Google Maps impressions, Search impressions, website visits, phone calls, and direction clicks.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Input
                      placeholder="e.g. locations/1234567890"
                      value={config.gbpLocationId || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, gbpLocationId: e.target.value }))}
                      className="font-mono text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Location resource name or ID</p>
                  </div>
                  <div>
                    <Input
                      placeholder="Business Name (e.g. Boulder Decisions)"
                      value={config.gbpLocationName || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, gbpLocationName: e.target.value }))}
                      className="text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Display name for Local SEO reports</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runTest('localSeo', { locationId: config.gbpLocationId, locationName: config.gbpLocationName })}
                  disabled={testResults.localSeo?.testing || !isGoogleConnected}
                  className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 cursor-pointer"
                >
                  {testResults.localSeo?.testing ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                  <span>Test Google Business Profile Connection</span>
                </Button>
              </CardContent>
            </Card>

            {/* Google Ads Reporting API */}
            <Card className="border-slate-200 shadow-xs flex flex-col justify-between md:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-[#14532D]" />
                    <CardTitle className="text-sm font-bold text-slate-900">Google Ads Reporting API (v17)</CardTitle>
                  </div>
                  <Badge variant={isGoogleConnected ? 'success' : 'secondary'} className="text-[10px]">
                    {isGoogleConnected ? 'API Available' : 'Login Required'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <p className="text-xs text-slate-600">
                  Google Ads API streams live advertising telemetry including paid impressions, ad spend, CPC, conversions, campaign ROI, and search query triggers.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Google Ads Customer ID</label>
                    <Input
                      placeholder="e.g. 123-456-7890 or 1234567890"
                      value={config.googleAdsCustomerId || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, googleAdsCustomerId: e.target.value }))}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Developer Token (Optional)</label>
                    <Input
                      placeholder="Developer token from Google Ads API Center"
                      value={config.googleAdsDeveloperToken || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, googleAdsDeveloperToken: e.target.value }))}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runTest('googleAds', { customerId: config.googleAdsCustomerId, developerToken: config.googleAdsDeveloperToken })}
                  disabled={testResults.googleAds?.testing || !isGoogleConnected}
                  className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 cursor-pointer"
                >
                  {testResults.googleAds?.testing ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                  <span>Test Google Ads API Connection</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Client Modal Dialog */}
      <Dialog open={showAddClientModal} onOpenChange={setShowAddClientModal}>
        <DialogContent onClose={() => setShowAddClientModal(false)} className="max-w-md p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-[#14532D]">
                <Building2 className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">Add New Client</DialogTitle>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateClient} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Client Name *</label>
              <Input
                placeholder="e.g. Acme Corporation"
                value={newClientForm.name}
                onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Website URL</label>
              <Input
                placeholder="e.g. https://acmecorp.com/"
                value={newClientForm.website_url}
                onChange={(e) => setNewClientForm({ ...newClientForm, website_url: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Domain (optional)</label>
              <Input
                placeholder="e.g. acmecorp.com"
                value={newClientForm.domain}
                onChange={(e) => setNewClientForm({ ...newClientForm, domain: e.target.value })}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddClientModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-[#14532D] hover:bg-[#1B6B45] text-white font-semibold">
                Create Client
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Client Modal Dialog */}
      <Dialog open={showEditClientModal} onOpenChange={setShowEditClientModal}>
        <DialogContent onClose={() => setShowEditClientModal(false)} className="max-w-md p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-[#14532D]">
                <Edit2 className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">Edit Client</DialogTitle>
            </div>
          </DialogHeader>

          {editingClient && (
            <form onSubmit={handleUpdateClient} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Client Name *</label>
                <Input
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Website URL</label>
                <Input
                  value={editingClient.website_url || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, website_url: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Domain</label>
                <Input
                  value={editingClient.domain || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, domain: e.target.value })}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowEditClientModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-[#14532D] hover:bg-[#1B6B45] text-white font-semibold">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
