import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ReportProvider, useReport } from '@/context/ReportContext';
import { saveApiConfig, setCookie } from '@/services/liveSeoApi';
import Sidebar, { NAV_ITEMS } from '@/components/layout/Sidebar';
import AppHeader from '@/components/layout/AppHeader';

import AuthPage from '@/pages/AuthPage';
import OverviewPage from '@/pages/OverviewPage';
import TrafficPage from '@/pages/TrafficPage';
import SearchConsolePage from '@/pages/SearchConsolePage';
import DeviceInsightsPage from '@/pages/DeviceInsightsPage';
import BrandQueriesPage from '@/pages/BrandQueriesPage';
import KeywordRankingsPage from '@/pages/KeywordRankingsPage';
import LocalSeoPage from '@/pages/LocalSeoPage';
import SeoActivitiesPage from '@/pages/SeoActivitiesPage';
import SettingsPage from '@/pages/SettingsPage';

import './App.css';

const PAGES = {
  overview: OverviewPage,
  traffic: TrafficPage,
  'search-console': SearchConsolePage,
  'device-insights': DeviceInsightsPage,
  'brand-queries': BrandQueriesPage,
  keywords: KeywordRankingsPage,
  'local-seo': LocalSeoPage,
  'seo-activities': SeoActivitiesPage,
  settings: SettingsPage,
};

function DashboardShell() {
  const [activePage, setActivePage] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { refresh } = useReport();

  // Handle Google OAuth callback parameters (?auth=success&access_token=...)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const token = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const expiryDate = urlParams.get('expiry_date');

    if (authStatus === 'success' && token) {
      const tokensObj = {
        access_token: token,
        refresh_token: refreshToken || undefined,
        expiry_date: expiryDate ? Number(expiryDate) : undefined,
      };
      setCookie('seo_auth_tokens', JSON.stringify(tokensObj), 365);
      setCookie('seo_logged_in', 'true', 365);
      saveApiConfig({ apiToken: token, googleConnected: true });
      window.history.replaceState({}, document.title, window.location.pathname);
      refresh();
    } else if (authStatus === 'error') {
      const msg = urlParams.get('message') || 'Authentication failed';
      console.error('Google OAuth error:', msg);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refresh]);

  const ActivePageComponent = PAGES[activePage] || OverviewPage;
  const pageTitle = NAV_ITEMS.find((n) => n.key === activePage)?.label || 'Overview';

  return (
    <div className="min-h-screen flex bg-slate-50/50 font-sans">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <AppHeader pageTitle={pageTitle} onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
          <ActivePageComponent />
        </main>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-3 font-sans">
        <div className="h-9 w-9 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading Boulder Decision Dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <ReportProvider>
      <DashboardShell />
    </ReportProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
