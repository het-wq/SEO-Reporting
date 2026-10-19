import { PDFParse } from 'pdf-parse';

// Extracts per-page text from a PDF buffer. Returns raw text only - no
// numeric interpretation happens here, so callers can decide what is
// reliably structured data vs. what needs manual review or image inspection.
export async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return {
      pageCount: result.pages.length,
      pages: result.pages.map((p) => ({ page: p.num, text: p.text || '' })),
      fullText: result.text || '',
    };
  } finally {
    await parser.destroy();
  }
}

// Renders specific PDF pages to PNG buffers (no native canvas dependency;
// pdf-parse bundles its own pdfjs-based renderer). Used to let the
// dashboard show the original page - maps, screenshots, charts - exactly
// as printed, for content that can't be reliably read as text.
export async function renderPdfPages(buffer, pageNumbers, scale = 1.3) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getScreenshot({ partial: pageNumbers, scale });
    return result.pages.map((p) => ({ pageNumber: p.pageNumber, data: p.data }));
  } finally {
    await parser.destroy();
  }
}

// Very conservative best-effort parse of "Label \t Aug \t Sep \t Diff" style
// rows, as printed on the Overview/GSC/Device/Brand-query pages of this
// report family. Only returns rows it is confident about; everything else
// is left for manual review rather than guessed.
const ROW_PATTERN = /^([A-Za-z][A-Za-z0-9 /()]+?)\s*\t\s*([\d,.%ms]+)\s*\t\s*([\d,.%ms]+)\s*\t\s*(-?[\d.]+%)$/;

export function parseComparisonRows(pageText) {
  const rows = [];
  for (const line of pageText.split('\n')) {
    const match = line.match(ROW_PATTERN);
    if (match) {
      const [, label, previous, current, diff] = match;
      rows.push({ label: label.trim(), previous: previous.trim(), current: current.trim(), diff: diff.trim() });
    }
  }
  return rows;
}
