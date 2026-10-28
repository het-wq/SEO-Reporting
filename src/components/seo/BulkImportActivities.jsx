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
  RefreshCw,
  X,
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
import {
  parseCsvText,
  normalizeActivitiesFromRows,
  downloadSampleActivityTemplate,
} from '@/lib/csvParser';

export default function BulkImportActivities({ onImport, onCancel }) {
  const [inputMethod, setInputMethod] = useState('upload'); // 'upload' | 'paste'
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedActivities, setParsedActivities] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [importMode, setImportMode] = useState('append'); // 'append' | 'replace'
  const [hasParsed, setHasParsed] = useState(false);

  const fileInputRef = useRef(null);

  // Process text from either file or textarea
  const processRawText = (rawContent, originName = '') => {
    if (!rawContent || !rawContent.trim()) {
      setParsedActivities([]);
      setParseErrors(['No content found. Please provide CSV data or upload a file.']);
      setHasParsed(true);
      return;
    }

    try {
      const rawRows = parseCsvText(rawContent);
      const { activities, errors } = normalizeActivitiesFromRows(rawRows);

      setParsedActivities(activities);
      setParseErrors(errors || []);
      setHasParsed(true);
      if (originName) setFileName(originName);
    } catch (err) {
      console.error('Failed to parse CSV:', err);
      setParsedActivities([]);
      setParseErrors([`Failed to parse CSV file: ${err.message || 'Unknown syntax error'}`]);
      setHasParsed(true);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      processRawText(text, file.name);
    };
    reader.readAsText(file);
  };

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      processRawText(text, file.name);
    };
    reader.readAsText(file);
  };

  // Handle manual paste parse
  const handleParsePasted = () => {
    processRawText(csvText, 'pasted-data.csv');
  };

  // Remove individual row from preview before importing
  const handleRemoveRow = (indexToRemove) => {
    setParsedActivities((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Reset all
  const handleReset = () => {
    setParsedActivities([]);
    setParseErrors([]);
    setCsvText('');
    setFileName('');
    setFileSize(0);
    setHasParsed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Commit Import
  const handleExecuteImport = () => {
    if (!parsedActivities.length) return;
    onImport(parsedActivities, importMode);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Instructions & Download Template */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-slate-800">
        <div className="flex items-start gap-2.5">
          <FileSpreadsheet className="h-5 w-5 text-[#14532D] mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-emerald-950">Bulk CSV Importer for SEO Activities</p>
            <p className="text-[11px] text-emerald-800/80 mt-0.5">
              Upload your team's spreadsheet (.csv) or copy-paste directly from Google Sheets / Excel.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={downloadSampleActivityTemplate}
          className="gap-1.5 text-xs bg-white text-[#14532D] border-emerald-200 hover:bg-emerald-50/80 hover:text-[#1B6B45] shrink-0 shadow-2xs"
        >
          <Download className="h-3.5 w-3.5 text-[#14532D]" />
          <span>Download Sample CSV Template</span>
        </Button>
      </div>

      {/* Input Mode Selector: Upload File vs Paste Data */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setInputMethod('upload')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              inputMethod === 'upload'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="h-3.5 w-3.5 text-[#14532D]" />
            <span>Upload CSV File</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMethod('paste')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              inputMethod === 'paste'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardPaste className="h-3.5 w-3.5 text-[#14532D]" />
            <span>Paste Spreadsheet Data</span>
          </button>
        </div>

        {hasParsed && parsedActivities.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-slate-800 gap-1 h-8"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Method 1: File Upload / Drag & Drop */}
      {inputMethod === 'upload' && !hasParsed && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all ${
            isDragging
              ? 'border-[#14532D] bg-emerald-50/50 scale-[0.99]'
              : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={handleFileChange}
            className="hidden"
            id="csv-file-input"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-[#14532D] flex items-center justify-center shadow-xs">
              <Upload className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">
                Drag and drop your SEO activities CSV here
              </p>
              <p className="text-xs text-slate-500">
                Supports UTF-8 CSV files with headers: Title, Category, Status, Priority, Date, TargetURL, Notes
              </p>
            </div>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 bg-[#14532D] hover:bg-[#1B6B45] text-white text-xs font-semibold px-4 cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Browse CSV File</span>
            </Button>
          </div>
        </div>
      )}

      {/* Method 2: Paste Raw CSV / Tab-separated text */}
      {inputMethod === 'paste' && !hasParsed && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              Paste CSV or Tabular Data (from Excel / Google Sheets)
            </label>
            <span className="text-[11px] text-slate-400">Comma, Tab, or Semicolon separated</span>
          </div>
          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Title,Category,Status,Priority,Date,TargetURL,Notes
"Optimized core metadata & schema","On-Page SEO","Completed","High","2026-10-24","https://boulderdecisions.com/","Updated meta tags"
"Fixed crawl 404 errors","Technical SEO","In Progress","High","2026-10-24","https://boulderdecisions.com/","Redirected broken links"`}
            className="w-full rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800 shadow-2xs focus:ring-1 focus:ring-[#14532D] outline-none"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              disabled={!csvText.trim()}
              onClick={handleParsePasted}
              className="gap-1.5 bg-[#14532D] hover:bg-[#1B6B45] text-white text-xs font-semibold cursor-pointer"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Preview & Parse Data</span>
            </Button>
          </div>
        </div>
      )}

      {/* Loaded File Info Card (if file was loaded) */}
      {hasParsed && fileName && (
        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-emerald-50 text-[#14532D]">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">{fileName}</p>
              <p className="text-[11px] text-slate-400">
                {fileSize > 0 ? `${formatBytes(fileSize)} • ` : ''}
                {parsedActivities.length} {parsedActivities.length === 1 ? 'activity' : 'activities'} detected
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs h-7 px-2.5 text-slate-600 hover:text-slate-900"
          >
            Change File
          </Button>
        </div>
      )}

      {/* Validation / Parsing Errors Banner */}
      {parseErrors.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-amber-950">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>CSV Import Notices ({parseErrors.length}):</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800/90 pl-1">
            {parseErrors.slice(0, 5).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
            {parseErrors.length > 5 && (
              <li>...and {parseErrors.length - 5} more skipped rows.</li>
            )}
          </ul>
        </div>
      )}

      {/* Parsed Activities Live Preview */}
      {hasParsed && parsedActivities.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900">
                Ready to Import: {parsedActivities.length} {parsedActivities.length === 1 ? 'Activity' : 'Activities'}
              </span>
              <span className="text-[11px] text-slate-500">
                (Review and remove any unwanted items before committing)
              </span>
            </div>

            {/* Import Mode: Append vs Replace */}
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
              <span className="font-medium text-slate-700">Mode:</span>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="append"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="text-[#14532D] focus:ring-[#14532D] h-3.5 w-3.5"
                />
                <span>Append to Existing</span>
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer ml-1.5">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="text-[#14532D] focus:ring-[#14532D] h-3.5 w-3.5"
                />
                <span>Replace All</span>
              </label>
            </div>
          </div>

          {/* Interactive Preview Table */}
          <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/90 sticky top-0 z-10 text-xs">
                  <TableHead className="w-8 text-center">#</TableHead>
                  <TableHead>Activity & Deliverable</TableHead>
                  <TableHead className="w-32">Category</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-20">Priority</TableHead>
                  <TableHead className="w-24">Date</TableHead>
                  <TableHead className="w-12 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedActivities.map((act, idx) => (
                  <TableRow key={act.id || idx} className="text-xs hover:bg-slate-50/60">
                    <TableCell className="text-center font-mono text-[11px] text-slate-400">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <p className="font-semibold text-slate-900">{act.title}</p>
                      {act.notes && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{act.notes}</p>
                      )}
                      {act.targetUrl && (
                        <p className="text-[10px] font-mono text-[#14532D] truncate mt-0.5 max-w-sm">
                          {act.targetUrl}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="outline" className="text-[10px] bg-slate-50 font-normal">
                        {act.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge
                        variant={
                          act.status === 'Completed'
                            ? 'success'
                            : act.status === 'In Progress'
                            ? 'info'
                            : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {act.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge
                        variant={
                          act.priority === 'High'
                            ? 'destructive'
                            : act.priority === 'Medium'
                            ? 'warning'
                            : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {act.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {act.date}
                    </TableCell>
                    <TableCell className="text-center py-2.5">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        title="Remove from import"
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="text-xs bg-white text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!hasParsed || parsedActivities.length === 0}
          onClick={handleExecuteImport}
          className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs disabled:opacity-50"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>
            {parsedActivities.length > 0
              ? `Confirm & Import ${parsedActivities.length} Activities`
              : 'Import Activities'}
          </span>
        </Button>
      </div>
    </div>
  );
}
