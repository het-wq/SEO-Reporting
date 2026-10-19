import express from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import {
  UPLOAD_DIR,
  PAGES_DIR,
  listReports,
  getReport,
  saveReport,
} from '../data/reportStore.js';
// Dynamically load pdfExtract only if PDF processing is invoked
const getPdfExtract = async () => import('../services/pdfExtract.js');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${randomUUID()}.pdf`),
});

const upload = multer({
  storage,
  limits: { fileSize: 60 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are accepted'));
    }
    cb(null, true);
  },
});

router.get('/', async (req, res) => {
  try {
    const reports = await listReports();
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const report = await getReport(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/raw-text', async (req, res) => {
  try {
    const report = await getReport(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json({ pages: report.rawTextPages || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serves (and lazily caches) a PNG render of one original PDF page, used to
// show maps, screenshots, and tables that aren't reliable as extracted text.
router.get('/:id/page-image/:page', async (req, res) => {
  try {
    const report = await getReport(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (!report.pdfFile) return res.status(404).json({ error: 'No source PDF stored for this report' });

    const pageNum = parseInt(req.params.page, 10);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Invalid page number' });
    }

    const reportPagesDir = path.join(PAGES_DIR, report.id);
    const fileName = `page-${String(pageNum).padStart(2, '0')}.png`;
    const cachedPath = path.join(reportPagesDir, fileName);

    try {
      const cached = await fs.readFile(cachedPath);
      res.set('Content-Type', 'image/png');
      return res.send(cached);
    } catch {
      // not cached yet, render below
    }

    const pdfAbsPath = path.join(UPLOAD_DIR, report.pdfFile.replace(/^\/uploads\//, ''));
    const pdfBuffer = await fs.readFile(pdfAbsPath);
    const { renderPdfPages } = await getPdfExtract();
    const rendered = await renderPdfPages(pdfBuffer, [pageNum], 1.3);
    if (!rendered.length) return res.status(404).json({ error: 'Page could not be rendered' });

    await fs.mkdir(reportPagesDir, { recursive: true });
    await fs.writeFile(cachedPath, rendered[0].data);

    res.set('Content-Type', 'image/png');
    res.send(rendered[0].data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded (expected field "file")' });

    const pdfBuffer = await fs.readFile(req.file.path);
    const { extractPdfText, parseComparisonRows } = await getPdfExtract();
    const { pageCount, pages } = await extractPdfText(pdfBuffer);

    const autoDetected = {};
    for (const p of pages) {
      const rows = parseComparisonRows(p.text);
      if (rows.length) autoDetected[p.page] = rows;
    }

    const id = path.basename(req.file.filename, '.pdf');
    const report = {
      id,
      client: req.body.client || 'Unknown Client',
      period: req.body.period || 'Unlabeled Period',
      previousPeriod: req.body.previousPeriod || '',
      reportTitle: req.body.reportTitle || req.file.originalname,
      pdfFile: `/uploads/${req.file.filename}`,
      totalPages: pageCount,
      uploadedAt: new Date().toISOString(),
      status: 'extracted',
      source: 'upload',
      rawTextPages: pages,
      autoDetectedRows: autoDetected,
      meta: {
        pdfPagesExtracted: pageCount,
        note: 'Uploaded report: only raw page text and best-effort comparison-row detection have been extracted automatically. Structured KPI/chart sections are not auto-populated and require manual mapping, same as any new report format would.',
      },
    };

    await saveReport(report);
    res.status(201).json({ report: { id: report.id, client: report.client, period: report.period, totalPages: report.totalPages, status: report.status } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
