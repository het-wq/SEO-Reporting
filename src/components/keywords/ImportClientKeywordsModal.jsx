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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { parseCsvText } from '@/lib/csvParser';

const KEYWORD_ALIASES = ['keyword', 'searchquery', 'query', 'term', 'keywordphrase', 'searchterm', 'clientkeyword', 'targetkeyword'];
const POSITION_ALIASES = ['position', 'avgposition', 'rank', 'ranking', 'averageposition'];
const CLICKS_ALIASES = ['clicks', 'click', 'visits', 'traffic'];
const IMPRESSIONS_ALIASES = ['impressions', 'impression', 'views', 'impr'];
const CTR_ALIASES = ['ctr', 'clickthroughrate', 'clickrate'];
const TIER_ALIASES = ['tier', 'status', 'tierstatus', 'ranktier'];
const URL_ALIASES = ['url', 'targeturl', 'page', 'landingpage', 'link'];

export function parseClientKeywordsCsv(text) {
  if (!text || typeof text !== 'string') return [];
  const rawRows = parseCsvText(text);
  if (!rawRows || !rawRows.length) return [];

  const firstRow = rawRows[0].map((cell) => cell.toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Detect column indices
  let keywordIdx = -1;
  let posIdx = -1;
  let clicksIdx = -1;
  let imprIdx = -1;
  let ctrIdx = -1;
  let tierIdx = -1;
  let urlIdx = -1;
  let hasHeader = false;

  firstRow.forEach((col, idx) => {
    if (KEYWORD_ALIASES.includes(col)) { keywordIdx = idx; hasHeader = true; }
    else if (POSITION_ALIASES.includes(col)) { posIdx = idx; hasHeader = true; }
    else if (CLICKS_ALIASES.includes(col)) { clicksIdx = idx; hasHeader = true; }
    else if (IMPRESSIONS_ALIASES.includes(col)) { imprIdx = idx; hasHeader = true; }
    else if (CTR_ALIASES.includes(col)) { ctrIdx = idx; hasHeader = true; }
    else if (TIER_ALIASES.includes(col)) { tierIdx = idx; hasHeader = true; }
    else if (URL_ALIASES.includes(col)) { urlIdx = idx; hasHeader = true; }
  });

  // If no explicit header recognized, treat first column as keyword
  if (!hasHeader) {
    keywordIdx = 0;
  }

  const dataRows = hasHeader ? rawRows.slice(1) : rawRows;
  const parsed = [];
  const seen = new Set();

  dataRows.forEach((row, idx) => {
    const rawKw = keywordIdx !== -1 && row[keywordIdx] !== undefined ? row[keywordIdx] : row[0];
    const cleanKw = (rawKw || '').trim();
    if (!cleanKw) return;

    const lower = cleanKw.toLowerCase();
    if (seen.has(lower)) return;
    seen.add(lower);

    const rawPos = posIdx !== -1 && row[posIdx] !== undefined ? parseFloat(row[posIdx]) : null;
    const rawClicks = clicksIdx !== -1 && row[clicksIdx] !== undefined ? parseInt(String(row[clicksIdx]).replace(/,/g, ''), 10) : null;
    const rawImpr = imprIdx !== -1 && row[imprIdx] !== undefined ? parseInt(String(row[imprIdx]).replace(/,/g, ''), 10) : null;
    const rawCtr = ctrIdx !== -1 && row[ctrIdx] !== undefined ? String(row[ctrIdx]).trim() : null;
    const rawTier = tierIdx !== -1 && row[tierIdx] !== undefined ? String(row[tierIdx]).trim() : null;
    const rawUrl = urlIdx !== -1 && row[urlIdx] !== undefined ? String(row[urlIdx]).trim() : '';

    parsed.push({
      id: `kw-imported-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      keyword: cleanKw,
      position: !isNaN(rawPos) && rawPos !== null ? rawPos : null,
      clicks: !isNaN(rawClicks) && rawClicks !== null ? rawClicks : null,
      impressions: !isNaN(rawImpr) && rawImpr !== null ? rawImpr : null,
      ctr: rawCtr || null,
      tier: rawTier || null,
      targetUrl: rawUrl || '',
      source: 'csv_import',
    });
  });

  return parsed;
}

export function downloadSampleKeywordsTemplate() {
  const headers = ['Search Query / Keyword', 'Avg Position', 'Clicks', 'Impressions', 'CTR', 'Tier', 'Target URL'];
  const sampleRows = [
    ['ux ui optimization atlanta', '2.1', '2', '33', '6.06%', 'Top 3', 'https://boulderdecisions.com/services'],
    ['ai consultants atlanta', '24.6', '1', '19', '5.26%', 'Position 21+', 'https://boulderdecisions.com/ai-consulting'],
    ['google search console date picker bug', '4.5', '1', '104', '0.96%', 'Top 10', 'https://boulderdecisions.com/blog'],
    ['boulder decision', '1.0', '12', '150', '8.00%', 'Top 3', 'https://boulderdecisions.com/'],
    ['decision intelligence consulting', '8.4', '0', '45', '0.00%', 'Top 10', 'https://boulderdecisions.com/services'],
    ['enterprise analytics strategy', '14.2', '0', '60', '0.00%', 'Position 21+', 'https://boulderdecisions.com/analytics'],
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
  a.download = 'client_keywords_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ImportClientKeywordsModal({ open, onClose, onImport }) {
  const [tab, setTab] = useState('upload'); // 'upload' | 'paste'
  const [fileName, setFileName] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [parsedKeywords, setParsedKeywords] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [importMode, setImportMode] = useState('append'); // 'append' | 'replace'
  const fileInputRef = useRef(null);

  const handleProcessText = (text, name = '') => {
    setErrorMsg('');
    if (!text || !text.trim()) {
      setParsedKeywords([]);
      setErrorMsg('No text or rows found in file.');
      return;
    }

    try {
      const items = parseClientKeywordsCsv(text);
      if (!items.length) {
        setErrorMsg('Could not find valid keywords in the provided CSV.');
        setParsedKeywords([]);
      } else {
        setParsedKeywords(items);
        if (name) setFileName(name);
      }
    } catch (err) {
      setErrorMsg(`Failed to parse CSV: ${err.message}`);
      setParsedKeywords([]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      handleProcessText(text, file.name);
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
      const text = evt.target?.result;
      handleProcessText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (e) => {
    const text = e.target.value;
    setPasteContent(text);
    handleProcessText(text, 'Pasted Content');
  };

  const handleSubmit = () => {
    if (!parsedKeywords.length) return;
    onImport(parsedKeywords, importMode);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFileName('');
    setPasteContent('');
    setParsedKeywords([]);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[#14532D]" />
                Import Client Keywords
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload or paste a CSV of client target keywords. Matching queries will automatically sync with live Search Console metrics.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadSampleKeywordsTemplate}
              className="gap-1.5 text-xs text-slate-700 hover:text-[#14532D] bg-white"
            >
              <Download className="h-3.5 w-3.5" /> Sample Template
            </Button>
          </div>
        </DialogHeader>

        {/* Tab switch: Upload vs Paste */}
        <div className="flex items-center gap-2 pt-3">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'upload'
                ? 'bg-[#14532D] text-white shadow-sm'
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
                ? 'bg-[#14532D] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ClipboardPaste className="h-3.5 w-3.5" /> Paste CSV / Text
          </button>
        </div>

        {/* Upload Mode */}
        {tab === 'upload' && (
          <div className="mt-3">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#14532D] bg-emerald-50/50'
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
              <p className="text-sm font-semibold text-slate-800">
                {fileName ? fileName : 'Click to browse or drag and drop your CSV file'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports standard comma-separated or tab-delimited files (.csv, .tsv, .txt)
              </p>
            </div>
          </div>
        )}

        {/* Paste Mode */}
        {tab === 'paste' && (
          <div className="mt-3">
            <textarea
              rows={5}
              placeholder={`Search Query / Keyword, Avg Position, Clicks, Impressions\nux ui optimization atlanta, 2.1, 2, 33\nai consultants atlanta, 24.6, 1, 19\nboulder decision, 1.0, 12, 150`}
              value={pasteContent}
              onChange={handlePasteChange}
              className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#14532D] focus:border-[#14532D]"
            />
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedKeywords.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Parsed {parsedKeywords.length} client keywords ready to import
              </span>
              <div className="flex items-center gap-2 text-xs">
                <label className="text-slate-600">Import Mode:</label>
                <select
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded text-xs bg-white font-medium"
                >
                  <option value="append">Append (keep existing)</option>
                  <option value="replace">Replace all existing</option>
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 max-h-48 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 text-[11px]">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Keyword</TableHead>
                    <TableHead className="text-right">Position</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedKeywords.slice(0, 8).map((k, idx) => (
                    <TableRow key={k.id || idx} className="text-xs">
                      <TableCell className="text-slate-400">{idx + 1}</TableCell>
                      <TableCell className="font-semibold text-slate-800">{k.keyword}</TableCell>
                      <TableCell className="text-right font-medium text-slate-700">
                        {k.position !== null ? k.position : 'Sync GSC'}
                      </TableCell>
                      <TableCell className="text-right text-slate-600">
                        {k.clicks !== null ? k.clicks.toLocaleString() : 'Sync GSC'}
                      </TableCell>
                      <TableCell className="text-right text-slate-600">
                        {k.impressions !== null ? k.impressions.toLocaleString() : 'Sync GSC'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {parsedKeywords.length > 8 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-slate-400 py-2">
                        + {parsedKeywords.length - 8} more keywords...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between sm:justify-between w-full">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!parsedKeywords.length}
            onClick={handleSubmit}
            className="gap-1.5 text-xs font-semibold bg-[#14532D] hover:bg-[#1B6B45] text-white"
          >
            Import {parsedKeywords.length > 0 ? `${parsedKeywords.length} Keywords` : ''}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
