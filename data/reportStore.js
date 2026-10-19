import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSeedReport } from './seedReport.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

export const UPLOAD_DIR = path.join(ROOT, 'uploads');
export const PAGES_DIR = path.join(UPLOAD_DIR, 'pages');
export const REPORTS_DIR = path.join(ROOT, 'data', 'reports');

const SEED_ID = 'appliance-care-sep-2026';
const SEED_PDF_FILENAME = 'appliance-care-sep-2026.pdf';

export async function ensureDirs() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.mkdir(PAGES_DIR, { recursive: true });
  await fs.mkdir(REPORTS_DIR, { recursive: true });
}

const reportPath = (id) => path.join(REPORTS_DIR, `${id}.json`);

export async function saveReport(report) {
  await fs.writeFile(reportPath(report.id), JSON.stringify(report, null, 2), 'utf-8');
  return report;
}

export async function getReport(id) {
  try {
    const raw = await fs.readFile(reportPath(id), 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

export async function listReports() {
  await ensureDirs();
  const files = (await fs.readdir(REPORTS_DIR)).filter((f) => f.endsWith('.json'));
  const reports = await Promise.all(
    files.map(async (f) => JSON.parse(await fs.readFile(path.join(REPORTS_DIR, f), 'utf-8')))
  );
  return reports
    .map((r) => ({
      id: r.id,
      client: r.client,
      period: r.period,
      previousPeriod: r.previousPeriod,
      reportTitle: r.reportTitle,
      pdfFile: r.pdfFile,
      totalPages: r.totalPages,
      uploadedAt: r.uploadedAt,
      status: r.status,
      source: r.source,
    }))
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

export async function seedIfEmpty() {
  await ensureDirs();
  const existing = await getReport(SEED_ID);
  if (existing) return existing;

  const seedPdfPath = path.join(UPLOAD_DIR, SEED_PDF_FILENAME);
  let pdfFile = null;
  try {
    await fs.access(seedPdfPath);
    pdfFile = `/uploads/${SEED_PDF_FILENAME}`;
  } catch {
    pdfFile = null; // seed PDF not present on this machine; report still loads without a preview
  }

  const report = buildSeedReport({ pdfFile, totalPages: 47 });
  await saveReport(report);
  return report;
}
