import React, { useMemo, useState, useEffect } from 'react';
import {
  ListChecks,
  Plus,
  Search,
  ExternalLink,
  Download,
  BarChart3,
  CheckCircle2,
  Clock,
  Calendar,
  Trash2,
  Filter,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  CheckSquare,
  Square,
  X,
  FileSpreadsheet,
  Upload,
  Link2,
  ShieldCheck,
  Globe,
  Layers,
  Award,
} from 'lucide-react';
import SectionCard from '@/components/dashboard/SectionCard';
import NoReportData from '@/components/dashboard/NoReportData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useReport } from '@/context/ReportContext';
import { exportToCsv } from '@/lib/csvExport';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import BulkImportActivities from '@/components/seo/BulkImportActivities';
import BulkImportBacklinks from '@/components/seo/BulkImportBacklinks';
import {
  BACKLINK_CATEGORIES,
  BACKLINK_STATUSES,
  BACKLINKS_STORAGE_KEY,
  DEFAULT_BACKLINKS,
  getStoredBacklinks,
  saveStoredBacklinks,
  calculateBacklinkStats,
} from '@/lib/backlinksData';

import {
  ACTIVITY_CATEGORIES,
  INITIAL_ACTIVITIES,
  ACTIVITIES_STORAGE_KEY,
  getStoredActivities,
  saveStoredActivities,
  calculateActivityStats,
} from '@/lib/activitiesData';

const STORAGE_KEY = ACTIVITIES_STORAGE_KEY;

export const CATEGORIES = ACTIVITY_CATEGORIES;

const CHART_COLORS = ['#14532D', '#16a34a', '#1B6B45', '#2E9B62', '#d97706', '#dc2626', '#0891b2', '#db2777', '#22c55e', '#65a30d'];

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export default function SeoActivitiesPage() {
  const { report, loading, selectedPeriod } = useReport();

  // Search and filters for written activities
  const [activitiesSearch, setActivitiesSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Form and bulk entry state for SEO Activities
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [entryMode, setEntryMode] = useState('manual'); // 'manual' | 'import'
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'On-Page SEO',
    status: 'Completed',
    priority: 'High',
    date: new Date().toISOString().split('T')[0],
    targetUrl: 'https://boulderdecisions.com/',
    notes: '',
  });

  // Load activities from localStorage with helper
  const [activities, setActivities] = useState(() => getStoredActivities());

  // Save activities to localStorage
  useEffect(() => {
    saveStoredActivities(activities);
  }, [activities]);

  useEffect(() => {
    const handleActivitiesUpdate = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setActivities(e.detail);
      }
    };
    window.addEventListener('activities-updated', handleActivitiesUpdate);
    return () => window.removeEventListener('activities-updated', handleActivitiesUpdate);
  }, []);

  const handleToggleEntry = (mode) => {
    if (isEntryOpen && entryMode === mode) {
      setIsEntryOpen(false);
    } else {
      setEntryMode(mode);
      setIsEntryOpen(true);
    }
  };

  const handleBulkImport = (newActivities, mode) => {
    if (mode === 'replace') {
      setActivities(newActivities);
      setNotification({
        type: 'success',
        message: `Successfully replaced activities with ${newActivities.length} items from CSV.`,
      });
    } else {
      setActivities((prev) => [...newActivities, ...prev]);
      setNotification({
        type: 'success',
        message: `Successfully imported ${newActivities.length} SEO activities from CSV!`,
      });
    }
    setIsEntryOpen(false);
    setActivitiesSearch('');
    setStatusFilter('All');
    setCategoryFilter('All');
  };

  const handleAddActivity = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newActivity = {
      id: `act-${Date.now()}`,
      title: formData.title.trim(),
      category: formData.category,
      status: formData.status,
      priority: formData.priority,
      date: formData.date || new Date().toISOString().split('T')[0],
      targetUrl: formData.targetUrl.trim(),
      notes: formData.notes.trim(),
    };

    setActivities((prev) => [newActivity, ...prev]);
    setNotification({
      type: 'success',
      message: 'New SEO activity added successfully.',
    });
    setFormData({
      title: '',
      category: 'On-Page SEO',
      status: 'Completed',
      priority: 'High',
      date: new Date().toISOString().split('T')[0],
      targetUrl: 'https://boulderdecisions.com/',
      notes: '',
    });
    setIsEntryOpen(false);
  };

  const handleDeleteActivity = (id) => {
    if (window.confirm('Delete this SEO activity entry?')) {
      setActivities((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleToggleStatus = (id) => {
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const nextStatus =
            a.status === 'Completed' ? 'In Progress' : a.status === 'In Progress' ? 'Planned' : 'Completed';
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
  };

  // Filtered activities list
  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      const matchSearch =
        !activitiesSearch ||
        a.title.toLowerCase().includes(activitiesSearch.toLowerCase()) ||
        a.notes.toLowerCase().includes(activitiesSearch.toLowerCase()) ||
        (a.targetUrl && a.targetUrl.toLowerCase().includes(activitiesSearch.toLowerCase()));

      const matchStatus = statusFilter === 'All' || a.status === statusFilter;
      const matchCategory = categoryFilter === 'All' || a.category === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [activities, activitiesSearch, statusFilter, categoryFilter]);

  // Activity Statistics & Dynamic Category Boxes
  const {
    total: totalCount,
    completed: completedCount,
    inProgress: inProgressCount,
    planned: plannedCount,
    categoryCards: allActivityCategoryCards,
  } = useMemo(() => calculateActivityStats(activities), [activities]);

  const [activityBoxView, setActivityBoxView] = useState('all'); // 'all' | 'active'
  const activeActivityCategoriesCount = useMemo(
    () => allActivityCategoryCards.filter((c) => c.count > 0).length,
    [allActivityCategoryCards]
  );
  const displayedActivityCategoryCards = useMemo(() => {
    if (activityBoxView === 'active') {
      return allActivityCategoryCards.filter((c) => c.count > 0);
    }
    return allActivityCategoryCards;
  }, [allActivityCategoryCards, activityBoxView]);

  const curLabel = selectedPeriod?.label || report?.period || 'Selected Month';

  // Export custom activities to CSV
  const handleExportActivitiesCsv = () => {
    exportToCsv(
      `seo-activities-log-${curLabel.replace(/\s+/g, '-').toLowerCase()}`,
      filteredActivities.map((a) => ({
        Date: a.date,
        Title: a.title,
        Category: a.category,
        Status: a.status,
        Priority: a.priority,
        TargetURL: a.targetUrl || '',
        Notes: a.notes || '',
      }))
    );
  };

  // =========================================================================
  // BACKLINKS & OFF-PAGE SUBMISSIONS STATE
  // =========================================================================
  const [backlinks, setBacklinks] = useState(() => getStoredBacklinks());

  useEffect(() => {
    saveStoredBacklinks(backlinks);
  }, [backlinks]);

  useEffect(() => {
    const handleBacklinksUpdate = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setBacklinks(e.detail);
      }
    };
    window.addEventListener('backlinks-updated', handleBacklinksUpdate);
    return () => window.removeEventListener('backlinks-updated', handleBacklinksUpdate);
  }, []);

  const [backlinksSearch, setBacklinksSearch] = useState('');
  const [backlinkStatusFilter, setBacklinkStatusFilter] = useState('All');
  const [backlinkCategoryFilter, setBacklinkCategoryFilter] = useState('All');

  // Backlink entry drawer states
  const [isBacklinkEntryOpen, setIsBacklinkEntryOpen] = useState(false);
  const [backlinkEntryMode, setBacklinkEntryMode] = useState('manual'); // 'manual' | 'import'
  const [backlinkNotification, setBacklinkNotification] = useState(null);

  const [backlinkFormData, setBacklinkFormData] = useState({
    sourceUrl: '',
    targetUrl: 'https://boulderdecisions.com/',
    anchorText: '',
    category: 'Guest Post',
    da: '',
    status: 'Live / Indexed',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleToggleBacklinkEntry = (mode) => {
    if (isBacklinkEntryOpen && backlinkEntryMode === mode) {
      setIsBacklinkEntryOpen(false);
    } else {
      setBacklinkEntryMode(mode);
      setIsBacklinkEntryOpen(true);
    }
  };

  const handleAddBacklink = (e) => {
    e.preventDefault();
    if (!backlinkFormData.sourceUrl.trim()) return;

    const parsedDa = parseInt(String(backlinkFormData.da).replace(/[^0-9]/g, ''), 10);

    const newBacklink = {
      id: `bl-${Date.now()}`,
      sourceUrl: backlinkFormData.sourceUrl.trim(),
      targetUrl: backlinkFormData.targetUrl.trim() || 'https://boulderdecisions.com/',
      anchorText: backlinkFormData.anchorText.trim() || 'Boulder Decision',
      category: backlinkFormData.category,
      da: !isNaN(parsedDa) ? parsedDa : null,
      status: backlinkFormData.status,
      date: backlinkFormData.date || new Date().toISOString().split('T')[0],
      notes: backlinkFormData.notes.trim(),
    };

    setBacklinks((prev) => [newBacklink, ...prev]);
    setBacklinkNotification({
      type: 'success',
      message: 'New backlink submission logged successfully.',
    });
    setBacklinkFormData({
      sourceUrl: '',
      targetUrl: 'https://boulderdecisions.com/',
      anchorText: '',
      category: 'Guest Post',
      da: '',
      status: 'Live / Indexed',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsBacklinkEntryOpen(false);
  };

  const handleBulkImportBacklinks = (newItems, mode) => {
    if (mode === 'replace') {
      setBacklinks(newItems);
      setBacklinkNotification({
        type: 'success',
        message: `Successfully replaced backlinks list with ${newItems.length} items from CSV.`,
      });
    } else {
      setBacklinks((prev) => [...newItems, ...prev]);
      setBacklinkNotification({
        type: 'success',
        message: `Successfully imported ${newItems.length} backlinks from CSV!`,
      });
    }
    setIsBacklinkEntryOpen(false);
    setBacklinksSearch('');
    setBacklinkStatusFilter('All');
    setBacklinkCategoryFilter('All');
  };

  const handleDeleteBacklink = (id) => {
    if (window.confirm('Delete this backlink record?')) {
      setBacklinks((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const handleToggleBacklinkStatus = (id) => {
    setBacklinks((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const next =
            b.status === 'Live / Indexed'
              ? 'In Progress'
              : b.status === 'In Progress'
              ? 'Planned'
              : 'Live / Indexed';
          return { ...b, status: next };
        }
        return b;
      })
    );
  };

  const handleExportBacklinksCsv = () => {
    exportToCsv(
      `backlinks-submissions-${curLabel.replace(/\s+/g, '-').toLowerCase()}`,
      filteredBacklinks.map((b) => ({
        Date: b.date,
        'Source URL': b.sourceUrl,
        'Target Page URL': b.targetUrl,
        'Anchor Text': b.anchorText,
        Category: b.category,
        DA: b.da !== null ? b.da : '',
        Status: b.status,
        Notes: b.notes || '',
      }))
    );
  };

  // Filtered Backlinks
  const filteredBacklinks = useMemo(() => {
    return backlinks.filter((b) => {
      const matchSearch =
        !backlinksSearch ||
        b.sourceUrl.toLowerCase().includes(backlinksSearch.toLowerCase()) ||
        b.targetUrl.toLowerCase().includes(backlinksSearch.toLowerCase()) ||
        b.anchorText.toLowerCase().includes(backlinksSearch.toLowerCase()) ||
        (b.notes && b.notes.toLowerCase().includes(backlinksSearch.toLowerCase()));

      const matchStatus = backlinkStatusFilter === 'All' || b.status === backlinkStatusFilter;
      const matchCategory = backlinkCategoryFilter === 'All' || b.category === backlinkCategoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [backlinks, backlinksSearch, backlinkStatusFilter, backlinkCategoryFilter]);

  // Backlink Statistics & Dynamic Category Boxes
  const {
    total: totalBacklinks,
    live: liveBacklinks,
    inProgress: inProgressBacklinks,
    planned: plannedBacklinks,
    avgDa,
    categoryCards: allCategoryCards,
  } = useMemo(() => calculateBacklinkStats(backlinks), [backlinks]);

  const [backlinkBoxView, setBacklinkBoxView] = useState('all'); // 'all' | 'active'
  const activeCategoriesCount = useMemo(
    () => allCategoryCards.filter((c) => c.count > 0).length,
    [allCategoryCards]
  );
  const displayedCategoryCards = useMemo(() => {
    if (backlinkBoxView === 'active') {
      return allCategoryCards.filter((c) => c.count > 0);
    }
    return allCategoryCards;
  }, [allCategoryCards, backlinkBoxView]);

  // Content Published Table State
  const [contentSearch, setContentSearch] = useState('');
  const allPosts = useMemo(() => {
    if (!report || !report.seoActivities) return [];
    const { onsiteBlogPosts = [], offsiteBlogPosts = [] } = report.seoActivities;
    return [
      ...onsiteBlogPosts.map((url) => ({ url, type: 'On-site blog' })),
      ...offsiteBlogPosts.map((url) => ({ url, type: 'Guest / off-site' })),
    ];
  }, [report]);

  const filteredPosts = useMemo(
    () => allPosts.filter((p) => p.url.toLowerCase().includes(contentSearch.toLowerCase())),
    [allPosts, contentSearch]
  );

  if (loading && !report) return <Skeleton className="h-96" />;
  if (!report) return <NoReportData />;

  return (
    <div className="space-y-6">
      {/* SECTION 1: Activity Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Activities</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Recorded campaigns</p>
        </div>
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-emerald-800 uppercase tracking-wider">Completed</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{completedCount}</p>
          <p className="text-[11px] text-emerald-700/80 mt-0.5">Shipped & deployed</p>
        </div>
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-emerald-800 uppercase tracking-wider">In Progress</p>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{inProgressCount}</p>
          <p className="text-[11px] text-emerald-700/80 mt-0.5">Currently active</p>
        </div>
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-amber-800 uppercase tracking-wider">Planned</p>
            <Calendar className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-1">{plannedCount}</p>
          <p className="text-[11px] text-amber-700/80 mt-0.5">Upcoming pipeline</p>
        </div>
      </div>

      {/* SECTION 2: SEO Execution Log & Write Activities */}
      <SectionCard
        icon={ListChecks}
        title="SEO Activities & Execution Log"
        subtitle="Record, track, and report on-page, technical, content, and local SEO initiatives"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 shadow-2xs">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleToggleEntry('manual')}
                className={`h-7 px-3 text-xs font-semibold gap-1.5 transition-all cursor-pointer ${
                  isEntryOpen && entryMode === 'manual'
                    ? 'bg-[#14532D] text-white hover:bg-[#1B6B45] shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Manual Entry</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleToggleEntry('import')}
                className={`h-7 px-3 text-xs font-semibold gap-1.5 transition-all cursor-pointer ${
                  isEntryOpen && entryMode === 'import'
                    ? 'bg-[#14532D] text-white hover:bg-[#1B6B45] shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>Bulk Import (CSV)</span>
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportActivitiesCsv}
              className="h-8 gap-1.5 text-xs bg-white text-slate-700 border-slate-200 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
        }
      >
        {notification && (
          <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {isEntryOpen && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/20 p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1 hidden sm:inline">
                  Select Mode:
                </span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setEntryMode('manual')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      entryMode === 'manual'
                        ? 'bg-[#14532D] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Option 1: Manual Entry</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode('import')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      entryMode === 'import'
                        ? 'bg-[#14532D] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Option 2: Bulk Import (CSV)</span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEntryOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {entryMode === 'import' ? (
              <BulkImportActivities onImport={handleBulkImport} onCancel={() => setIsEntryOpen(false)} />
            ) : (
              <form onSubmit={handleAddActivity} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Activity Title *</label>
                    <Input
                      required
                      placeholder="e.g., Optimized core landing page H1 & meta tags"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Target Page URL</label>
                    <Input
                      placeholder="https://boulderdecisions.com/services"
                      value={formData.targetUrl}
                      onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                      className="text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full text-xs h-9 rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full text-xs h-9 rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                    >
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Planned">Planned</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Impact</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full text-xs h-9 rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Date Completed / Target</label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="text-xs bg-white h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Implementation Details & Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Details about what was changed, queries targeted, and rationale..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full text-xs rounded-md border border-slate-300 bg-white p-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#14532D]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEntryOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="gap-1.5 text-xs bg-[#14532D] hover:bg-[#1B6B45] text-white">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Save Activity</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 self-start">
            {['All', 'Completed', 'In Progress', 'Planned'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === s ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-1 sm:max-w-md justify-end">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs h-9 rounded-md border border-slate-300 bg-white px-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#14532D] shrink-0"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search activities..."
                value={activitiesSearch}
                onChange={(e) => setActivitiesSearch(e.target.value)}
                className="pl-8 text-xs bg-white h-9"
              />
            </div>
          </div>
        </div>

        {/* Activities Table */}
        <div className="rounded-lg border border-slate-200 overflow-x-auto bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 text-xs">
                <TableHead className="w-16">Status</TableHead>
                <TableHead>Activity &amp; Notes</TableHead>
                <TableHead className="w-36">Category</TableHead>
                <TableHead className="w-24">Impact</TableHead>
                <TableHead className="w-28">Date</TableHead>
                <TableHead className="w-16 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((a) => (
                <TableRow key={a.id} className="hover:bg-slate-50/70 transition-colors">
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(a.id)}
                      className="inline-flex items-center cursor-pointer"
                      title="Click to toggle status"
                    >
                      {a.status === 'Completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : a.status === 'In Progress' ? (
                        <Clock className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Calendar className="h-4 w-4 text-amber-500" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900 text-xs sm:text-sm leading-tight">{a.title}</p>
                      {a.notes && <p className="text-xs text-slate-500 leading-normal">{a.notes}</p>}
                      {a.targetUrl && (
                        <a
                          href={a.targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#14532D] hover:underline mt-0.5"
                        >
                          <span>{a.targetUrl}</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px] font-medium text-slate-700 border-slate-200">
                      {a.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={a.priority === 'High' ? 'danger' : a.priority === 'Medium' ? 'warning' : 'secondary'}
                      className="text-[11px] font-medium"
                    >
                      {a.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">{a.date}</TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteActivity(a.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete activity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}

              {filteredActivities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-500 text-xs">
                    No SEO activities found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Category Breakdown Boxes (No graph, box view with number and name) */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-emerald-600" />
                Category Breakdown ({totalCount} Total Activities)
              </span>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {activeActivityCategoriesCount} Active of {allActivityCategoryCards.length} Categories
              </span>
              {categoryFilter !== 'All' && (
                <span className="text-[11px] font-semibold text-[#14532D] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Filtered: {categoryFilter}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setActivityBoxView('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activityBoxView === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({allActivityCategoryCards.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActivityBoxView('active')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activityBoxView === 'active'
                      ? 'bg-white text-[#14532D] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active Only ({activeActivityCategoriesCount})
                </button>
              </div>

              {categoryFilter !== 'All' && (
                <button
                  type="button"
                  onClick={() => setCategoryFilter('All')}
                  className="text-xs text-[#14532D] hover:text-[#1B6B45] font-semibold cursor-pointer underline ml-1"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {displayedActivityCategoryCards.map((cat) => {
              const isSelected = categoryFilter === cat.name;
              return (
                <div
                  key={cat.name}
                  onClick={() => setCategoryFilter(isSelected ? 'All' : cat.name)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between select-none relative group ${
                    isSelected
                      ? 'border-[#14532D] bg-emerald-50 ring-2 ring-emerald-500/30 shadow-xs'
                      : cat.count > 0
                      ? 'border-emerald-200/90 bg-white hover:border-emerald-400 hover:shadow-xs'
                      : 'border-slate-200/70 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                  }`}
                  title={`Click to filter activities by ${cat.name}`}
                >
                  {cat.count > 0 && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500" />
                  )}
                  <p
                    className={`text-2xl font-black tracking-tight ${
                      isSelected
                        ? 'text-emerald-700'
                        : cat.count > 0
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {cat.count}
                  </p>
                  <p
                    className={`text-[11px] font-semibold mt-1.5 leading-tight line-clamp-2 ${
                      isSelected
                        ? 'text-emerald-950 font-bold'
                        : cat.count > 0
                        ? 'text-slate-800'
                        : 'text-slate-500'
                    }`}
                  >
                    {cat.name}
                  </p>
                </div>
              );
            })}
          </div>

          {displayedActivityCategoryCards.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-xs">
              No activities found in this view. Switch to &quot;All&quot; to view all categories.
            </div>
          )}
        </div>
      </SectionCard>

      {/* SECTION 3: Content Published Table */}
      <SectionCard
        icon={Tag}
        title="Content Published This Month"
        subtitle={`${curLabel} - ${allPosts.length} posts across owned and off-site channels`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportToCsv(
                `content-published-${curLabel.replace(/\s+/g, '-').toLowerCase()}`,
                allPosts.map((p) => ({ URL: p.url, Source: hostnameOf(p.url), Type: p.type }))
              )
            }
            className="gap-1.5 text-xs bg-white"
          >
            <Download className="h-3.5 w-3.5" /> Export Content CSV
          </Button>
        }
      >
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search posts..."
            value={contentSearch}
            onChange={(e) => setContentSearch(e.target.value)}
            className="pl-8 text-xs bg-white"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead>URL</TableHead>
              <TableHead className="w-40">Source</TableHead>
              <TableHead className="w-32">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.map((p) => (
              <TableRow key={p.url}>
                <TableCell>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[#14532D] hover:underline break-all"
                  >
                    {p.url}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </TableCell>
                <TableCell className="text-sm text-slate-600">{hostnameOf(p.url)}</TableCell>
                <TableCell>
                  <Badge variant={p.type === 'On-site blog' ? 'info' : 'secondary'}>{p.type}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {filteredPosts.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                  No posts match &quot;{contentSearch}&quot;.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>

      {/* ===================================================================== */}
      {/* SECTION 4: BACKLINKS & OFF-PAGE SUBMISSIONS (User requested section)  */}
      {/* ===================================================================== */}
      <SectionCard
        icon={Link2}
        iconClassName="bg-emerald-50 text-emerald-600"
        title="Backlinks & Off-Page Submissions Log"
        subtitle={`${curLabel} - Record, track, and import backlink outreach, citations, and editorial placements`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* 2 Clear Options: Manual and Importing */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 shadow-2xs">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleToggleBacklinkEntry('manual')}
                className={`h-7 px-3 text-xs font-semibold gap-1.5 transition-all cursor-pointer ${
                  isBacklinkEntryOpen && backlinkEntryMode === 'manual'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Manual Entry</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleToggleBacklinkEntry('import')}
                className={`h-7 px-3 text-xs font-semibold gap-1.5 transition-all cursor-pointer ${
                  isBacklinkEntryOpen && backlinkEntryMode === 'import'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>Bulk Import (CSV)</span>
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportBacklinksCsv}
              className="h-8 gap-1.5 text-xs bg-white text-slate-700 border-slate-200 shadow-2xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
        }
      >
        {/* Backlinks Notification Toast */}
        {backlinkNotification && (
          <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{backlinkNotification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setBacklinkNotification(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Backlinks KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center sm:text-left">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Total Backlinks</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{totalBacklinks}</span>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 text-center sm:text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider block">Live / Indexed</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 hidden sm:inline" />
            </div>
            <span className="text-xl font-bold text-emerald-900 mt-1 block">{liveBacklinks}</span>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 text-center sm:text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider block">In Progress</span>
              <Clock className="h-3.5 w-3.5 text-emerald-600 hidden sm:inline" />
            </div>
            <span className="text-xl font-bold text-emerald-900 mt-1 block">{inProgressBacklinks}</span>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 text-center sm:text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-amber-800 uppercase tracking-wider block">Planned</span>
              <Calendar className="h-3.5 w-3.5 text-amber-600 hidden sm:inline" />
            </div>
            <span className="text-xl font-bold text-amber-900 mt-1 block">{plannedBacklinks}</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center sm:text-left col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Average DA</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">
              {avgDa !== '—' ? `DA ${avgDa}` : '—'}
            </span>
          </div>
        </div>

        {/* 2-Option Entry Drawer: Manual vs Bulk Import */}
        {isBacklinkEntryOpen && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/20 p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1 hidden sm:inline">
                  Backlink Entry Mode:
                </span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setBacklinkEntryMode('manual')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      backlinkEntryMode === 'manual'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Option 1: Manual Entry</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBacklinkEntryMode('import')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      backlinkEntryMode === 'import'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Option 2: Bulk Import (CSV)</span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBacklinkEntryOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {backlinkEntryMode === 'import' ? (
              <BulkImportBacklinks
                onImport={handleBulkImportBacklinks}
                onCancel={() => setIsBacklinkEntryOpen(false)}
              />
            ) : (
              <form onSubmit={handleAddBacklink} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Source Referring URL *</label>
                    <Input
                      required
                      placeholder="e.g., https://clutch.co/profile/boulder-decision"
                      value={backlinkFormData.sourceUrl}
                      onChange={(e) => setBacklinkFormData({ ...backlinkFormData, sourceUrl: e.target.value })}
                      className="text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Target Page on Your Site</label>
                    <Input
                      placeholder="https://boulderdecisions.com/services"
                      value={backlinkFormData.targetUrl}
                      onChange={(e) => setBacklinkFormData({ ...backlinkFormData, targetUrl: e.target.value })}
                      className="text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Anchor Text</label>
                    <Input
                      placeholder="e.g., Boulder Decision Analytics"
                      value={backlinkFormData.anchorText}
                      onChange={(e) => setBacklinkFormData({ ...backlinkFormData, anchorText: e.target.value })}
                      className="text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Category</label>
                    <select
                      value={backlinkFormData.category}
                      onChange={(e) => setBacklinkFormData({ ...backlinkFormData, category: e.target.value })}
                      className="w-full text-xs h-9 rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    >
                      {BACKLINK_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Domain Authority (DA)</label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="e.g., 85"
                      value={backlinkFormData.da}
                      onChange={(e) => setBacklinkFormData({ ...backlinkFormData, da: e.target.value })}
                      className="text-xs bg-white h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Status</label>
                    <select
                      value={backlinkFormData.status}
                      onChange={(e) => setBacklinkFormData({ ...backlinkFormData, status: e.target.value })}
                      className="w-full text-xs h-9 rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    >
                      {BACKLINK_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Acquired / Submitted Date</label>
                    <Input
                      type="date"
                      value={backlinkFormData.date}
                      onChange={(e) => setBacklinkFormData({ ...backlinkFormData, date: e.target.value })}
                      className="text-xs bg-white h-9"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Notes &amp; Outreach Context</label>
                    <Input
                      placeholder="e.g., High-authority B2B directory profile listing with follow attribute"
                      value={backlinkFormData.notes}
                      onChange={(e) => setBacklinkFormData({ ...backlinkFormData, notes: e.target.value })}
                      className="text-xs bg-white h-9"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsBacklinkEntryOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Save Backlink</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Filter bar for Backlinks */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 self-start">
            {['All', 'Live / Indexed', 'In Progress', 'Planned'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setBacklinkStatusFilter(s)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  backlinkStatusFilter === s ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-1 sm:max-w-md justify-end">
            <select
              value={backlinkCategoryFilter}
              onChange={(e) => setBacklinkCategoryFilter(e.target.value)}
              className="text-xs h-9 rounded-md border border-slate-300 bg-white px-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600 shrink-0"
            >
              <option value="All">All Categories</option>
              {BACKLINK_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search backlinks, URLs, anchors..."
                value={backlinksSearch}
                onChange={(e) => setBacklinksSearch(e.target.value)}
                className="pl-8 text-xs bg-white h-9"
              />
            </div>
          </div>
        </div>

        {/* Backlinks Table */}
        <div className="rounded-lg border border-slate-200 overflow-x-auto bg-white mb-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 text-xs">
                <TableHead className="w-16">Status</TableHead>
                <TableHead>Backlink Source &amp; Anchor Text</TableHead>
                <TableHead className="w-36">Category</TableHead>
                <TableHead className="w-20 text-center">DA</TableHead>
                <TableHead className="w-28">Date</TableHead>
                <TableHead className="w-16 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBacklinks.map((b) => (
                <TableRow key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => handleToggleBacklinkStatus(b.id)}
                      className="inline-flex items-center cursor-pointer"
                      title="Click to toggle status"
                    >
                      {b.status === 'Live / Indexed' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : b.status === 'In Progress' ? (
                        <Clock className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Calendar className="h-4 w-4 text-amber-500" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <a
                          href={b.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[#14532D] hover:underline text-xs sm:text-sm inline-flex items-center gap-1 break-all"
                        >
                          <span>{b.sourceUrl}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {b.anchorText && (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            Anchor: &ldquo;{b.anchorText}&rdquo;
                          </span>
                        )}
                        {b.targetUrl && (
                          <span className="text-[11px] text-slate-400">
                            &rarr; {b.targetUrl.replace(/^https?:\/\//, '')}
                          </span>
                        )}
                      </div>

                      {b.notes && <p className="text-[11px] text-slate-500">{b.notes}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px] font-medium text-slate-700 border-slate-200">
                      {b.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {b.da !== null && b.da !== undefined ? (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        b.da >= 80
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : b.da >= 50
                          ? 'bg-emerald-50 text-[#14532D] border border-emerald-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        DA {b.da}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">{b.date}</TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteBacklink(b.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete backlink"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}

              {filteredBacklinks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-500 text-xs">
                    No backlink submissions found matching your filters. Click &quot;Bulk Import (CSV)&quot; or &quot;Manual Entry&quot; to log new links.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Category Breakdown Boxes (No graph, box view with number and name) */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-emerald-600" />
                Category Breakdown ({totalBacklinks} Total Submissions)
              </span>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {activeCategoriesCount} Active of {allCategoryCards.length} Categories
              </span>
              {backlinkCategoryFilter !== 'All' && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Filtered: {backlinkCategoryFilter}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setBacklinkBoxView('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    backlinkBoxView === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({allCategoryCards.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBacklinkBoxView('active')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    backlinkBoxView === 'active'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active Only ({activeCategoriesCount})
                </button>
              </div>

              {backlinkCategoryFilter !== 'All' && (
                <button
                  type="button"
                  onClick={() => setBacklinkCategoryFilter('All')}
                  className="text-xs text-[#14532D] hover:text-[#1B6B45] font-semibold cursor-pointer underline ml-1"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {displayedCategoryCards.map((cat) => {
              const isSelected = backlinkCategoryFilter === cat.name;
              return (
                <div
                  key={cat.name}
                  onClick={() => setBacklinkCategoryFilter(isSelected ? 'All' : cat.name)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between select-none relative group ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/30 shadow-xs'
                      : cat.count > 0
                      ? 'border-emerald-200/90 bg-white hover:border-emerald-400 hover:shadow-xs'
                      : 'border-slate-200/70 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                  }`}
                  title={`Click to filter backlinks by ${cat.name}`}
                >
                  {cat.count > 0 && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500" />
                  )}
                  <p
                    className={`text-2xl font-black tracking-tight ${
                      isSelected
                        ? 'text-emerald-700'
                        : cat.count > 0
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {cat.count}
                  </p>
                  <p
                    className={`text-[11px] font-semibold mt-1.5 leading-tight line-clamp-2 ${
                      isSelected
                        ? 'text-emerald-950 font-bold'
                        : cat.count > 0
                        ? 'text-slate-800'
                        : 'text-slate-500'
                    }`}
                  >
                    {cat.name}
                  </p>
                </div>
              );
            })}
          </div>

          {displayedCategoryCards.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-xs">
              No categories have active submissions yet. Switch to &quot;All&quot; to view all available submission categories.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
