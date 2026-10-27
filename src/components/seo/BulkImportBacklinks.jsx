import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Trash2,
  FileText,
  ClipboardPaste,
  HelpCircle,
  ArrowRight,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { parseCsvText } from '@/lib/csvParser';

export const BACKLINK_CATEGORIES = [
  'Reddit Submission',
  'Quora Submission',
  'Forum Submission',
  'PDF Submission',
  'Infographics Submission',
  'Image Submission',
  'Video Submission',
  'Pinterest Submission',
  'YouTube Submission',
  'Instagram Submission',
  'Off-page Blogs Posting',
  'Profile Creation',
  'Business Listing',
  'Blog Promotion',
  'Social Bookmarking',
  'Article Submission',
  'Classified Submission',
  'GMB Link Promotion',
  'PR Submission',
  'Micro Blogging',
  'Guest Posting',
  // Old categories (preserved)
  'Guest Post',
  'Directory & Citation',
  'Editorial Link',
  'Press Release',
  'Profile & Social',
  'Resource Link',
  'Forum & Community',
  'General Backlink',
];

export const BACKLINK_STATUSES = ['Live / Indexed', 'In Progress', 'Planned'];

const HEADER_ALIASES = {
  sourceUrl: ['sourceurl', 'source url', 'backlinkurl', 'linkurl', 'referringpage', 'referringurl', 'url', 'site', 'website'],
  targetUrl: ['targeturl', 'target url', 'targetpage', 'landingpage', 'desturl', 'destinationurl', 'page'],
  anchorText: ['anchortext', 'anchor text', 'anchor', 'keyword', 'text', 'linktext'],
  category: ['category', 'type', 'cat', 'channel', 'backlinktype'],
  da: ['da', 'domainauthority', 'dr', 'domainrating', 'authority', 'score', 'pagerank'],
  status: ['status', 'state', 'stage', 'progress'],
  date: ['date', 'created', 'acquired', 'published', 'placeddate', 'submissiondate'],
  notes: ['notes', 'note', 'details', 'comment', 'description'],
};

export function normalizeBacklinkCategory(val) {
  if (!val) return 'General Backlink';
  const clean = String(val).toLowerCase().trim();

  // 1. Exact case-insensitive match against all known categories
  const exact = BACKLINK_CATEGORIES.find((c) => c.toLowerCase() === clean);
  if (exact) return exact;

  // 2. Smart alias & keyword mapping
  if (clean.includes('reddit')) return 'Reddit Submission';
  if (clean.includes('quora')) return 'Quora Submission';
  if (clean.includes('pinterest') || clean.includes('pin')) return 'Pinterest Submission';
  if (clean.includes('youtube') || clean.includes('yt')) return 'YouTube Submission';
  if (clean.includes('instagram') || clean.includes('insta')) return 'Instagram Submission';
  if (clean.includes('video') || clean.includes('vimeo')) return 'Video Submission';
  if (clean.includes('infographic')) return 'Infographics Submission';
  if (clean.includes('image') || clean.includes('photo') || clean.includes('graphic')) return 'Image Submission';
  if (clean.includes('pdf') || clean.includes('doc') || clean.includes('slideshare')) return 'PDF Submission';
  if (clean.includes('classified') || clean.includes('ad')) return 'Classified Submission';
  if (clean.includes('bookmark')) return 'Social Bookmarking';
  if (clean.includes('gmb') || clean.includes('google my business') || clean.includes('google map')) return 'GMB Link Promotion';
  if (clean.includes('micro') || clean.includes('threads')) return 'Micro Blogging';
  if (clean.includes('business list') || clean.includes('citation') || clean.includes('nap')) return 'Business Listing';
  if (clean.includes('profile')) return 'Profile Creation';
  if (clean.includes('off-page blog') || clean.includes('offpage blog') || clean.includes('web 2.0') || clean.includes('web2.0')) return 'Off-page Blogs Posting';
  if (clean.includes('blog promo') || clean.includes('promotion')) return 'Blog Promotion';
  if (clean.includes('article')) return 'Article Submission';
  if (clean.includes('pr') || clean.includes('press release') || clean.includes('wire')) return 'PR Submission';
  if (clean.includes('forum')) return 'Forum Submission';
  if (clean.includes('guest post') || clean.includes('guest')) return 'Guest Posting';
  if (clean.includes('direct') || clean.includes('cit') || clean.includes('local')) return 'Directory & Citation';
  if (clean.includes('edit') || clean.includes('mention') || clean.includes('brand')) return 'Editorial Link';
  if (clean.includes('resource') || clean.includes('partner') || clean.includes('roundup')) return 'Resource Link';
  if (clean.includes('social') || clean.includes('linkedin') || clean.includes('twitter')) return 'Profile & Social';
  if (clean.includes('community')) return 'Forum & Community';

  return 'General Backlink';
}

export function normalizeBacklinkStatus(val) {
  if (!val) return 'Live / Indexed';
  const clean = String(val).toLowerCase().trim();
  if (clean.includes('live') || clean.includes('index') || clean.includes('comp') || clean.includes('done') || clean.includes('active') || clean.includes('verified')) {
    return 'Live / Indexed';
  }
  if (clean.includes('prog') || clean.includes('review') || clean.includes('outreach') || clean.includes('pend') || clean.includes('submit')) {
    return 'In Progress';
  }
  if (clean.includes('plan') || clean.includes('todo') || clean.includes('target') || clean.includes('draft') || clean.includes('queue')) {
    return 'Planned';
  }
  return 'Live / Indexed';
}

export function parseBacklinksCsv(text) {
  if (!text || typeof text !== 'string') return { backlinks: [], errors: [] };
  const rawRows = parseCsvText(text);
  if (!rawRows || !rawRows.length) return { backlinks: [], errors: ['No data found in CSV file.'] };

  const firstRow = rawRows[0].map((c) => String(c).toLowerCase().replace(/[^a-z0-9]/g, ''));
  const colMap = {};
  let hasHeader = false;

  firstRow.forEach((cell, idx) => {
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some((a) => a.replace(/[^a-z0-9]/g, '') === cell)) {
        colMap[field] = idx;
        hasHeader = true;
        break;
      }
    }
  });

  if (!hasHeader) {
    colMap.sourceUrl = 0;
    colMap.targetUrl = 1;
    colMap.anchorText = 2;
    colMap.category = 3;
    colMap.da = 4;
    colMap.status = 5;
    colMap.date = 6;
    colMap.notes = 7;
  }

  const dataRows = hasHeader ? rawRows.slice(1) : rawRows;
  const backlinks = [];
  const errors = [];
  const timestamp = Date.now();

  dataRows.forEach((row, rowIndex) => {
    const rawSource = colMap.sourceUrl !== undefined ? row[colMap.sourceUrl] : row[0];
    const sourceUrl = (rawSource || '').trim();

    if (!sourceUrl && row.every((c) => !c || !c.trim())) {
      return; // Skip empty rows
    }

    if (!sourceUrl) {
      errors.push(`Row ${rowIndex + (hasHeader ? 2 : 1)} skipped: Missing backlink source URL.`);
      return;
    }

    const rawTarget = colMap.targetUrl !== undefined ? row[colMap.targetUrl] : '';
    const rawAnchor = colMap.anchorText !== undefined ? row[colMap.anchorText] : '';
    const rawCategory = colMap.category !== undefined ? row[colMap.category] : '';
    const rawDa = colMap.da !== undefined ? row[colMap.da] : '';
    const rawStatus = colMap.status !== undefined ? row[colMap.status] : '';
    const rawDate = colMap.date !== undefined ? row[colMap.date] : '';
    const rawNotes = colMap.notes !== undefined ? row[colMap.notes] : '';

    const parsedDa = parseInt(String(rawDa).replace(/[^0-9]/g, ''), 10);

    backlinks.push({
      id: `bl-import-${timestamp}-${rowIndex}-${Math.random().toString(36).slice(2, 7)}`,
      sourceUrl,
      targetUrl: (rawTarget || 'https://boulderdecisions.com/').trim(),
      anchorText: (rawAnchor || 'Boulder Decision').trim(),
      category: normalizeBacklinkCategory(rawCategory),
      da: !isNaN(parsedDa) ? parsedDa : null,
      status: normalizeBacklinkStatus(rawStatus),
      date: (rawDate || new Date().toISOString().split('T')[0]).trim(),
      notes: (rawNotes || '').trim(),
    });
  });

  return { backlinks, errors };
}

export function downloadSampleBacklinksTemplate() {
  const headers = ['Source URL', 'Target Page URL', 'Anchor Text', 'Category', 'DA', 'Status', 'Date', 'Notes'];
  const sampleRows = [
    [
      'https://clutch.co/profile/boulder-decision',
      'https://boulderdecisions.com/',
      'Boulder Decision Analytics',
      'Directory & Citation',
      '88',
      'Live / Indexed',
      '2026-10-18',
      'Verified corporate directory citation with high authority',
    ],
    [
      'https://medium.com/@analytics/decision-intelligence',
      'https://boulderdecisions.com/blog',
      'decision intelligence playbook',
      'Guest Post',
      '92',
      'Live / Indexed',
      '2026-10-14',
      'In-depth 2,200-word guest guide on enterprise decision modeling',
    ],
    [
      'https://businesswire.com/news/boulder-expansion',
      'https://boulderdecisions.com/',
      'Boulder Decision',
      'Press Release',
      '90',
      'Live / Indexed',
      '2026-10-10',
      'Q4 expansion and strategic services release',
    ],
    [
      'https://crunchbase.com/organization/boulder-decision',
      'https://boulderdecisions.com/',
      'boulderdecisions.com',
      'Profile & Social',
      '91',
      'Live / Indexed',
      '2026-10-08',
      'Verified Crunchbase organization profile link',
    ],
    [
      'https://techbullion.com/data-analytics-leaders/',
      'https://boulderdecisions.com/services',
      'decision analytics consulting',
      'Editorial Link',
      '64',
      'In Progress',
      '2026-10-24',
      'Editorial link placement under editor review',
    ],
  ];

  const escapeCsv = (val) => {
    const s = String(val ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [
    headers.join(','),
    ...sampleRows.map((r) => r.map(escapeCsv).join(',')),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'backlinks_submissions_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function BulkImportBacklinks({ onImport, onCancel }) {
  const [tab, setTab] = useState('upload'); // 'upload' | 'paste'
  const [fileName, setFileName] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [parsedBacklinks, setParsedBacklinks] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [importMode, setImportMode] = useState('append'); // 'append' | 'replace'
  const fileInputRef = useRef(null);

  const processContent = (text, name = '') => {
    if (!text || !text.trim()) {
      setParsedBacklinks([]);
      setParseErrors(['No content found. Please provide CSV data or upload a file.']);
      return;
    }

    try {
      const { backlinks, errors } = parseBacklinksCsv(text);
      setParsedBacklinks(backlinks);
      setParseErrors(errors || []);
      if (name) setFileName(name);
    } catch (err) {
      setParsedBacklinks([]);
      setParseErrors([`Failed to parse CSV: ${err.message}`]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      processContent(evt.target?.result, file.name);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      processContent(evt.target?.result, file.name);
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (e) => {
    const val = e.target.value;
    setPasteContent(val);
    processContent(val, 'Pasted Content');
  };

  const handleSubmit = () => {
    if (!parsedBacklinks.length) return;
    onImport(parsedBacklinks, importMode);
  };

  return (
    <div className="rounded-xl border border-blue-200 bg-white p-4 sm:p-6 space-y-4 shadow-sm animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Bulk Import Backlinks &amp; Off-Page Submissions
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Import guest posts, directory citations, press releases, and editorial backlinks from a CSV/TSV file.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadSampleBacklinksTemplate}
            className="gap-1.5 text-xs text-slate-700 hover:text-blue-600 bg-white"
          >
            <Download className="h-3.5 w-3.5" /> Sample Template
          </Button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            tab === 'upload'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Upload className="h-3.5 w-3.5" /> Upload File (.csv)
        </button>
        <button
          type="button"
          onClick={() => setTab('paste')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            tab === 'paste'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ClipboardPaste className="h-3.5 w-3.5" /> Paste CSV / Text
        </button>
      </div>

      {/* Upload Zone */}
      {tab === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
          <p className="text-xs sm:text-sm font-semibold text-slate-800">
            {fileName ? fileName : 'Click to select or drag and drop your backlinks CSV file'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Expected headers: Source URL, Target Page URL, Anchor Text, Category, DA, Status, Date, Notes
          </p>
        </div>
      )}

      {/* Paste Area */}
      {tab === 'paste' && (
        <div>
          <textarea
            rows={5}
            placeholder={`Source URL, Target Page URL, Anchor Text, Category, DA, Status, Date\nhttps://clutch.co/profile/boulder-decision, https://boulderdecisions.com/, Boulder Decision, Directory & Citation, 88, Live / Indexed, 2026-10-18\nhttps://medium.com/@analytics/guide, https://boulderdecisions.com/blog, decision framework, Guest Post, 92, Live / Indexed, 2026-10-14`}
            value={pasteContent}
            onChange={handlePasteChange}
            className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>
      )}

      {/* Errors */}
      {parseErrors.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-amber-900">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Parsing Warnings ({parseErrors.length})</span>
          </div>
          <ul className="list-disc list-inside text-[11px] space-y-0.5">
            {parseErrors.slice(0, 3).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Table */}
      {parsedBacklinks.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Parsed {parsedBacklinks.length} backlinks ready to import
            </span>
            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-600 font-medium">Import Mode:</label>
              <select
                value={importMode}
                onChange={(e) => setImportMode(e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded text-xs bg-white font-medium cursor-pointer"
              >
                <option value="append">Append (Keep existing backlinks)</option>
                <option value="replace">Replace (Overwrite all backlinks)</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 max-h-48 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 text-[11px]">
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Source URL</TableHead>
                  <TableHead>Anchor Text</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">DA</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedBacklinks.slice(0, 6).map((b, idx) => (
                  <TableRow key={b.id || idx} className="text-xs">
                    <TableCell className="text-slate-400 font-mono text-[11px]">{idx + 1}</TableCell>
                    <TableCell className="font-semibold text-slate-800 max-w-[200px] truncate" title={b.sourceUrl}>
                      {b.sourceUrl}
                    </TableCell>
                    <TableCell className="text-slate-600 truncate max-w-[120px]">{b.anchorText}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{b.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-800">
                      {b.da !== null ? b.da : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={b.status === 'Live / Indexed' ? 'success' : b.status === 'In Progress' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {b.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {parsedBacklinks.length > 6 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-xs text-slate-400 py-2">
                      + {parsedBacklinks.length - 6} more backlinks...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel} className="text-xs">
            Cancel
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={!parsedBacklinks.length}
            onClick={handleSubmit}
            className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
          >
            Import {parsedBacklinks.length > 0 ? `${parsedBacklinks.length} Backlinks` : 'Backlinks'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
