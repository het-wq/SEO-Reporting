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

const STORAGE_KEY = 'boulder_custom_seo_activities';

const CATEGORIES = [
  'On-Page SEO',
  'Technical SEO',
  'Content & Blog',
  'Local SEO',
  'Link Building',
  'Conversion & UX',
  'Keyword Strategy',
  'General SEO',
];

const INITIAL_ACTIVITIES = [
  {
    id: 'act-1',
    title: 'Migrated Search Console property to https://boulderdecisions.com/ and audited indexing',
    category: 'Technical SEO',
    status: 'Completed',
    priority: 'High',
    date: '2026-10-21',
    targetUrl: 'https://boulderdecisions.com/',
    notes: 'Configured verified domain property, validated sitemaps, and verified clean crawl indexation.',
  },
  {
    id: 'act-2',
    title: 'Updated title tags and meta descriptions for core analytics & decision consulting pages',
    category: 'On-Page SEO',
    status: 'Completed',
    priority: 'High',
    date: '2026-10-18',
    targetUrl: 'https://boulderdecisions.com/',
    notes: 'Integrated target terms into H1 and meta title tags based on verified Search Console queries.',
  },
  {
    id: 'act-3',
    title: 'Implemented dynamic Brand vs Non-Brand keyword classification engine',
    category: 'On-Page SEO',
    status: 'Completed',
    priority: 'Medium',
    date: '2026-10-15',
    targetUrl: 'https://boulderdecisions.com/',
    notes: 'Segmented search queries to isolate brand query performance from organic discovery traffic.',
  },
  {
    id: 'act-4',
    title: 'Core Web Vitals mobile performance optimization (LCP & CLS review)',
    category: 'Technical SEO',
    status: 'In Progress',
    priority: 'High',
    date: '2026-10-22',
    targetUrl: 'https://boulderdecisions.com/',
    notes: 'Auditing third-party scripts, lazy loading assets, and optimizing delivery formats across mobile layouts.',
  },
  {
    id: 'act-5',
    title: 'Local SEO citation sync and Google Business Profile update',
    category: 'Local SEO',
    status: 'Planned',
    priority: 'Medium',
    date: '2026-10-25',
    targetUrl: 'https://boulderdecisions.com/',
    notes: 'Synchronizing NAP (Name, Address, Phone) consistency across local business directories.',
  },
];

const CHART_COLORS = ['#2563eb', '#7c3aed', '#0ea5e9', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#db2777', '#4f46e5', '#65a30d'];

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

  // Form and bulk entry state (2 options: 'manual' or 'import')
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

  // Load activities from localStorage
  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load saved activities:', e);
    }
    return INITIAL_ACTIVITIES;
  });

  // Save activities to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    } catch (e) {
      console.warn('Failed to persist activities:', e);
    }
  }, [activities]);

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
    // Clear filters so user sees imported items immediately
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

  // Statistics
  const totalCount = activities.length;
  const completedCount = activities.filter((a) => a.status === 'Completed').length;
  const inProgressCount = activities.filter((a) => a.status === 'In Progress').length;
  const plannedCount = activities.filter((a) => a.status === 'Planned').length;

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

  // Existing Content Published table state
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

  const { offPageActivities = [] } = report.seoActivities || {};

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
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-blue-800 uppercase tracking-wider">In Progress</p>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-1">{inProgressCount}</p>
          <p className="text-[11px] text-blue-700/80 mt-0.5">Currently active</p>
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
            {/* 2 Clear Options: Manual and Importing */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 shadow-2xs">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleToggleEntry('manual')}
                className={`h-7 px-3 text-xs font-semibold gap-1.5 transition-all cursor-pointer ${
                  isEntryOpen && entryMode === 'manual'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
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
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
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
        {/* Notification Toast */}
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

        {/* 2-Option Entry Drawer / Panel: Manual vs Importing */}
        {isEntryOpen && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/20 p-4 sm:p-5 space-y-4 shadow-xs">
            {/* Tab switch header */}
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
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
                        ? 'bg-blue-600 text-white shadow-2xs'
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
                        ? 'bg-blue-600 text-white shadow-2xs'
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

            {/* Option 1: Manual Entry Form */}
            {entryMode === 'manual' && (
              <form onSubmit={handleAddActivity} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <h4 className="text-sm font-bold text-slate-900">Write Down Single SEO Activity</h4>
                  </div>
                  <span className="text-[11px] text-slate-500">Saved to permanent browser log</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Activity Title / Summary <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Updated metadata and schema for https://boulderdecisions.com/"
                    value={formData.title}
                    onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                    required
                    className="bg-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value }))}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 shadow-xs focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value }))}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 shadow-xs focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Planned">Planned</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Priority / Impact</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData((f) => ({ ...f, priority: e.target.value }))}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 shadow-xs focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="High">High Impact</option>
                      <option value="Medium">Medium Impact</option>
                      <option value="Low">Low / Standard</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Date</label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))}
                      className="bg-white text-xs h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Target URL / Asset (Optional)</label>
                    <Input
                      type="url"
                      placeholder="e.g. https://boulderdecisions.com/services"
                      value={formData.targetUrl}
                      onChange={(e) => setFormData((f) => ({ ...f, targetUrl: e.target.value }))}
                      className="bg-white text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Details & Deliverables (Optional)</label>
                    <Input
                      placeholder="e.g. Added target keywords to H1 and meta tags; improved mobile score"
                      value={formData.notes}
                      onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                      className="bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEntryOpen(false)}
                    className="text-xs bg-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Save Activity</span>
                  </Button>
                </div>
              </form>
            )}

            {/* Option 2: Bulk CSV Import */}
            {entryMode === 'import' && (
              <BulkImportActivities
                onImport={handleBulkImport}
                onCancel={() => setIsEntryOpen(false)}
              />
            )}
          </div>
        )}

        {/* Filter and Search Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {['All', 'Completed', 'In Progress', 'Planned'].map((st) => (
              <Button
                key={st}
                type="button"
                variant={statusFilter === st ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(st)}
                className={`text-xs h-8 px-3 rounded-lg ${
                  statusFilter === st ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'
                }`}
              >
                {st}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-xs focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search activities..."
                value={activitiesSearch}
                onChange={(e) => setActivitiesSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-white"
              />
            </div>
          </div>
        </div>

        {/* Activities Table */}
        <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="w-12 text-center">Status</TableHead>
                <TableHead>Activity & Notes</TableHead>
                <TableHead className="w-36">Category</TableHead>
                <TableHead className="w-28">Impact</TableHead>
                <TableHead className="w-28">Date</TableHead>
                <TableHead className="w-16 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((act) => {
                const isCompleted = act.status === 'Completed';
                const isInProgress = act.status === 'In Progress';

                return (
                  <TableRow key={act.id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell className="text-center align-top pt-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(act.id)}
                        title="Click to toggle status"
                        className="cursor-pointer text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : isInProgress ? (
                          <Clock className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-300 hover:text-slate-500" />
                        )}
                      </button>
                    </TableCell>

                    <TableCell className="align-top py-3">
                      <p className={`text-sm font-semibold ${isCompleted ? 'text-slate-900' : 'text-slate-800'}`}>
                        {act.title}
                      </p>
                      {act.notes && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {act.notes}
                        </p>
                      )}
                      {act.targetUrl && (
                        <a
                          href={act.targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-600 hover:underline mt-1"
                        >
                          {act.targetUrl}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </TableCell>

                    <TableCell className="align-top py-3">
                      <Badge variant="outline" className="text-[11px] font-medium bg-slate-50">
                        {act.category}
                      </Badge>
                    </TableCell>

                    <TableCell className="align-top py-3">
                      <Badge
                        variant={
                          act.priority === 'High' ? 'success' : act.priority === 'Medium' ? 'info' : 'secondary'
                        }
                        className="text-[11px]"
                      >
                        {act.priority}
                      </Badge>
                    </TableCell>

                    <TableCell className="align-top py-3 text-xs text-slate-500 font-mono">
                      {act.date}
                    </TableCell>

                    <TableCell className="align-top py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteActivity(act.id)}
                        title="Delete activity"
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredActivities.length === 0 && activities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="h-10 w-10 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">No SEO activities recorded yet</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Get started by writing an activity manually or importing your entire team's spreadsheet via CSV.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleEntry('manual')}
                          className="gap-1.5 text-xs bg-white text-slate-700"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Manual Entry</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleToggleEntry('import')}
                          className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          <span>Bulk Import CSV</span>
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {filteredActivities.length === 0 && activities.length > 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                    <p className="text-sm">No SEO activities match your search or filter.</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => {
                        setActivitiesSearch('');
                        setStatusFilter('All');
                        setCategoryFilter('All');
                      }}
                      className="text-xs text-blue-600 mt-1 cursor-pointer"
                    >
                      Clear filters
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      {/* SECTION 3: Content Published This Month */}
      <SectionCard
        icon={ListChecks}
        title="Content Published This Month"
        subtitle={`${curLabel} - ${allPosts.length} posts across owned and off-site channels`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              exportToCsv(
                `published-content-${curLabel.replace(/\s+/g, '-').toLowerCase()}`,
                filteredPosts.map((p) => ({ URL: p.url, Type: p.type }))
              );
            }}
            className="gap-1.5 bg-white text-xs"
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
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline break-all"
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
                  No posts match "{contentSearch}".
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>

      {/* SECTION 4: Off-Page Activities Chart */}
      <SectionCard
        icon={BarChart3}
        iconClassName="bg-emerald-50 text-emerald-600"
        title="Off-Page Submissions & Citations"
        subtitle={`${curLabel} submission counts by activity category`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {offPageActivities.map((a) => (
            <div key={a.type} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-center">
              <p className="text-2xl font-bold text-slate-900">{a.count}</p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">{a.type}</p>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={offPageActivities} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="type"
              tick={{ fontSize: 11, fill: '#64748b' }}
              angle={-35}
              textAnchor="end"
              interval={0}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={32} />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {offPageActivities.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>
  );
}
