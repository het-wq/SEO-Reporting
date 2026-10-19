import React, { useRef, useState } from 'react';
import { FileText, Upload, CheckCircle2, AlertCircle, Loader2, Eye, FileCheck2 } from 'lucide-react';
import SectionCard from '@/components/dashboard/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useReport } from '@/context/ReportContext';
import { uploadReport, fileUrl } from '@/services/reportsApi';

export default function PdfReportsPage() {
  const { report, reports, selectedId, setSelectedId, loading, refresh } = useReport();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [period, setPeriod] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    setUploadError('');
    setUploadSuccess('');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const newReport = await uploadReport(selectedFile, {
        client: report?.client || 'Boulder Decision',
        period: period || selectedFile.name.replace(/\.pdf$/i, ''),
        previousPeriod: report?.period || '',
      });
      setUploadSuccess(`Processed "${newReport.reportTitle || selectedFile.name}" - ${newReport.totalPages} pages extracted.`);
      setSelectedFile(null);
      setPeriod('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refresh();
      setSelectedId(newReport.id);
    } catch (e) {
      setUploadError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading && !report && !reports.length) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <SectionCard icon={Upload} title="Upload a New Monthly Report" subtitle="Replace or add a monthly SEO report PDF - text is extracted automatically">
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <div className="flex-1 w-full space-y-2.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />
            <Input
              placeholder='Period label (e.g. "October 2026") - optional'
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>
          <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="gap-2 shrink-0 w-full sm:w-auto">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Processing...' : 'Upload & Extract'}
          </Button>
        </div>

        {uploadError && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {uploadError}
          </div>
        )}
        {uploadSuccess && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {uploadSuccess}
          </div>
        )}
        <p className="mt-3 text-[11px] text-slate-400">
          Newly uploaded reports get their page text auto-extracted. Structured KPI cards and charts on other pages are
          populated from the curated September 2026 report; a new format requires mapping its sections before the full
          dashboard reflects it.
        </p>
      </SectionCard>

      <SectionCard icon={FileText} title="Processed Reports">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-center">Pages</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Source</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((r) => (
              <TableRow key={r.id} className={r.id === selectedId ? 'bg-blue-50/40' : ''}>
                <TableCell className="font-medium text-slate-900">{r.period}</TableCell>
                <TableCell className="text-slate-600">{r.client}</TableCell>
                <TableCell className="text-center text-slate-600">{r.totalPages}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={r.status === 'extracted' ? 'success' : 'secondary'} className="gap-1">
                    <FileCheck2 className="h-3 w-3" /> {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-normal capitalize">{r.source}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => setSelectedId(r.id)} className="gap-1.5 bg-white">
                    <Eye className="h-3.5 w-3.5" /> View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {reports.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No reports processed yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>

      {report?.pdfFile && (
        <SectionCard
          icon={Eye}
          title={`Preview - ${report.period}`}
          subtitle="Original PDF rendered in-browser"
          actions={
            <Button variant="outline" size="sm" asChild className="gap-1.5 bg-white">
              <a href={fileUrl(report.pdfFile)} target="_blank" rel="noreferrer">
                <Eye className="h-3.5 w-3.5" /> Open in new tab
              </a>
            </Button>
          }
        >
          <div className="rounded-lg border border-slate-200 overflow-hidden" style={{ height: '70vh' }}>
            <iframe src={fileUrl(report.pdfFile)} title="Report PDF preview" className="w-full h-full" />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            If the embedded preview does not render in your browser, use "Open in new tab" above.
          </p>
        </SectionCard>
      )}
    </div>
  );
}
