import { BACKEND_BASE } from '@/lib/backendBase';

export const fetchReports = async () => {
  const res = await fetch(`${BACKEND_BASE}/api/reports`);
  if (!res.ok) throw new Error('Failed to load reports list');
  const data = await res.json();
  return data.reports || [];
};

export const fetchReport = async (id) => {
  const res = await fetch(`${BACKEND_BASE}/api/reports/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to load report ${id}`);
  }
  const data = await res.json();
  return data.report;
};

export const uploadReport = async (file, meta = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  if (meta.client) formData.append('client', meta.client);
  if (meta.period) formData.append('period', meta.period);
  if (meta.previousPeriod) formData.append('previousPeriod', meta.previousPeriod);
  if (meta.reportTitle) formData.append('reportTitle', meta.reportTitle);

  const res = await fetch(`${BACKEND_BASE}/api/reports/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Upload failed');
  }
  const data = await res.json();
  return data.report;
};

export const fetchRawText = async (id) => {
  const res = await fetch(`${BACKEND_BASE}/api/reports/${encodeURIComponent(id)}/raw-text`);
  if (!res.ok) throw new Error('Failed to load extracted text');
  const data = await res.json();
  return data.pages || [];
};

export const fileUrl = (pdfFile) => {
  if (!pdfFile) return null;
  return pdfFile.startsWith('http') ? pdfFile : `${BACKEND_BASE}${pdfFile}`;
};

export const pageImageUrl = (reportId, pageNumber) =>
  `${BACKEND_BASE}/api/reports/${encodeURIComponent(reportId)}/page-image/${pageNumber}`;
