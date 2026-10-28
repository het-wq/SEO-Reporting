import React from 'react';
import {
  Link2,
  AlertCircle,
  ExternalLink,
  Settings,
  Calendar,
  RotateCcw,
  ServerOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useReport } from '@/context/ReportContext';
import { getGoogleAuthUrl } from '@/services/liveSeoApi';

export default function NoReportData({ customMessage }) {
  const {
    dateRangeInfo,
    selectedPeriod,
    error,
    refresh,
    backendHealth,
  } = useReport();

  const handleStartOAuth = async () => {
    try {
      const data = await getGoogleAuthUrl();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert(e.message || 'Failed to start Google OAuth');
    }
  };

  const handleNavigateToSettings = () => {
    const navBtn = document.querySelector('[data-page="settings"]');
    if (navBtn) navBtn.click();
  };

  // 1. Case: Specific error returned by Google
  const errorObj = typeof error === 'object' ? error : { message: error };
  const isApiDisabled = errorObj?.status === 'api_not_enabled' || errorObj?.message?.includes('not been used in project');

  if (isApiDisabled) {
    return (
      <Card className="border-amber-300 bg-amber-50/70 shadow-xs my-6 max-w-xl mx-auto">
        <CardContent className="py-8 px-6 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-900">Google Cloud API Enablement Required</h3>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              {errorObj.message || 'Please enable Google Search Console and Google Analytics Data API in Google Cloud Console.'}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-2.5">
            {errorObj.actionUrl && (
              <Button asChild size="sm" className="bg-amber-700 hover:bg-amber-800 text-white gap-1.5 text-xs font-semibold">
                <a href={errorObj.actionUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{errorObj.actionLabel || 'Enable in Google Cloud Console'}</span>
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5 text-xs bg-white text-slate-700">
              <RotateCcw className="h-3.5 w-3.5" /> <span>Check Again</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 2. Case: Backend API server is offline
  const isBackendOffline = errorObj?.status === 'backend_offline' || backendHealth?.status === 'offline';
  if (isBackendOffline) {
    return (
      <Card className="border-red-200 bg-red-50/60 shadow-xs my-8 max-w-lg mx-auto">
        <CardContent className="py-9 px-6 text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto ring-8 ring-red-50">
            <ServerOff className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Backend API Server Offline (Port 5001)
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Cannot connect to the backend server at <code className="bg-white px-1.5 py-0.5 rounded border border-red-200 text-red-700">http://localhost:5001</code>.
              Please start both servers with <code className="bg-white px-1.5 py-0.5 rounded border border-red-200 text-red-700 font-semibold">npm run dev</code> in your terminal.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="gap-1.5 text-xs bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> <span>Retry Connection</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 3. Case: Not connected to Google
  if (!backendHealth.hasToken) {
    return (
      <Card className="border-dashed border-2 border-slate-200 bg-white shadow-none my-8 max-w-lg mx-auto">
        <CardContent className="py-10 px-6 text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto ring-8 ring-blue-50/60">
            <Link2 className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              Connect Google Account for Live Data
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              This dashboard fetches live metrics directly from Google Analytics 4 and Google Search Console APIs.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <Button
              onClick={handleStartOAuth}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs font-semibold"
            >
              <img
                src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                alt="Google"
                className="h-4 w-4"
              />
              <span>Connect with Google</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNavigateToSettings}
              className="gap-1.5 text-xs text-slate-700 bg-white"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>API Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 3. Case: Connected but no rows found for selected date range
  return (
    <Card className="border-dashed border-2 border-slate-200 bg-slate-50/60 shadow-none my-6 max-w-lg mx-auto">
      <CardContent className="py-10 px-6 text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
          <Calendar className="h-6 w-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900">
          No Activity Recorded for {selectedPeriod?.label || 'Selected Period'}
        </h3>

        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          {customMessage ||
            `The connected Google Search Console and GA4 properties recorded zero visits or search queries between ${dateRangeInfo?.startDate} and ${dateRangeInfo?.endDate}.`}
        </p>

        <div className="pt-2 flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5 text-xs bg-white text-slate-700">
            <RotateCcw className="h-3.5 w-3.5" /> <span>Retry Fetch</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleNavigateToSettings} className="gap-1.5 text-xs bg-white text-slate-700">
            <Settings className="h-3.5 w-3.5" /> <span>Verify Property Settings</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
