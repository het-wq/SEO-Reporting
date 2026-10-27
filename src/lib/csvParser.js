/**
 * CSV / TSV Parsing and Normalization Utility for SEO Activities Bulk Import
 */

export const CANONICAL_CATEGORIES = [
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
  'On-Page SEO',
  'Technical SEO',
  'Content & Blog',
  'Local SEO',
  'Link Building',
  'Conversion & UX',
  'Keyword Strategy',
  'General SEO',
];

export const CANONICAL_STATUSES = ['Completed', 'In Progress', 'Planned'];
export const CANONICAL_PRIORITIES = ['High', 'Medium', 'Low'];

const HEADER_ALIASES = {
  title: ['title', 'activity', 'activitytitle', 'task', 'name', 'summary', 'action', 'initiative', 'deliverable'],
  category: ['category', 'cat', 'type', 'tag', 'channel', 'seocategory'],
  status: ['status', 'state', 'progress', 'stage', 'completion'],
  priority: ['priority', 'impact', 'importance', 'urgency', 'level', 'severity'],
  date: ['date', 'created', 'due', 'duedate', 'timestamp', 'datecompleted', 'publisheddate', 'logdate'],
  targetUrl: ['targeturl', 'target url', 'url', 'link', 'page', 'target', 'website', 'asseturl'],
  notes: ['notes', 'note', 'details', 'description', 'deliverables', 'comment', 'comments', 'remarks'],
};

/**
 * Robust CSV/TSV Parser handling quotes, escaped quotes, multiline values, and commas/tabs/semicolons.
 */
export function parseCsvText(text) {
  if (!text || typeof text !== 'string') return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Detect delimiter from first non-empty line
  const firstLine = trimmed.split(/\r?\n/)[0];
  let delimiter = ',';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  if (tabCount > commaCount && tabCount > semiCount) {
    delimiter = '\t';
  } else if (semiCount > commaCount && semiCount > tabCount) {
    delimiter = ';';
  }

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some((val) => val.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((val) => val.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes category string to one of the canonical 8 categories
 */
export function normalizeCategory(val) {
  if (!val) return 'General SEO';
  const clean = String(val).toLowerCase().trim();

  // Direct match
  const direct = CANONICAL_CATEGORIES.find((c) => c.toLowerCase() === clean);
  if (direct) return direct;

  // Specific submission categories
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
  if (clean.includes('business list') || clean.includes('directory') || clean.includes('citation')) return 'Business Listing';
  if (clean.includes('profile')) return 'Profile Creation';
  if (clean.includes('off-page blog') || clean.includes('offpage blog') || clean.includes('web 2.0') || clean.includes('web2.0')) return 'Off-page Blogs Posting';
  if (clean.includes('blog promo') || clean.includes('promotion')) return 'Blog Promotion';
  if (clean.includes('article')) return 'Article Submission';
  if (clean.includes('pr') || clean.includes('press release') || clean.includes('wire')) return 'PR Submission';
  if (clean.includes('forum')) return 'Forum Submission';
  if (clean.includes('guest post') || clean.includes('guest')) return 'Guest Posting';

  // Core SEO categories
  if (clean.includes('on-page') || clean.includes('onpage') || clean.includes('metadata') || clean.includes('meta')) {
    return 'On-Page SEO';
  }
  if (clean.includes('tech') || clean.includes('crawl') || clean.includes('speed') || clean.includes('index') || clean.includes('vitals') || clean.includes('schema')) {
    return 'Technical SEO';
  }
  if (clean.includes('content') || clean.includes('blog') || clean.includes('copy') || clean.includes('post')) {
    return 'Content & Blog';
  }
  if (clean.includes('local') || clean.includes('nap') || clean.includes('map')) {
    return 'Local SEO';
  }
  if (clean.includes('link') || clean.includes('backlink') || clean.includes('outreach')) {
    return 'Link Building';
  }
  if (clean.includes('conversion') || clean.includes('cro') || clean.includes('ux') || clean.includes('ui')) {
    return 'Conversion & UX';
  }
  if (clean.includes('keyword') || clean.includes('query') || clean.includes('intent') || clean.includes('rank')) {
    return 'Keyword Strategy';
  }

  return 'General SEO';
}

/**
 * Normalizes status string to Completed, In Progress, or Planned
 */
export function normalizeStatus(val) {
  if (!val) return 'Completed';
  const clean = val.toLowerCase().trim();
  if (clean.includes('comp') || clean.includes('done') || clean.includes('finish') || clean.includes('ship') || clean.includes('live')) {
    return 'Completed';
  }
  if (clean.includes('prog') || clean.includes('doing') || clean.includes('active') || clean.includes('wip') || clean.includes('ongoing')) {
    return 'In Progress';
  }
  if (clean.includes('plan') || clean.includes('todo') || clean.includes('pending') || clean.includes('backlog') || clean.includes('queue')) {
    return 'Planned';
  }
  return 'Completed';
}

/**
 * Normalizes priority string to High, Medium, or Low
 */
export function normalizePriority(val) {
  if (!val) return 'High';
  const clean = val.toLowerCase().trim();
  if (clean.includes('high') || clean.includes('urgent') || clean.includes('crit') || clean.includes('p1')) {
    return 'High';
  }
  if (clean.includes('low') || clean.includes('minor') || clean.includes('p3')) {
    return 'Low';
  }
  if (clean.includes('med') || clean.includes('normal') || clean.includes('p2') || clean.includes('standard')) {
    return 'Medium';
  }
  return 'Medium';
}

/**
 * Normalizes date string into YYYY-MM-DD
 */
export function normalizeDate(val) {
  if (!val || typeof val !== 'string') {
    return new Date().toISOString().split('T')[0];
  }
  const clean = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Normalizes URL string
 */
export function normalizeUrl(val) {
  if (!val || typeof val !== 'string') return '';
  const clean = val.trim();
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;
  if (/^www\./i.test(clean)) return `https://${clean}`;
  return clean;
}

/**
 * Normalizes parsed rows into structured SEO activity objects
 */
export function normalizeActivitiesFromRows(rawRows) {
  if (!rawRows || !rawRows.length) {
    return { activities: [], errors: ['No data rows found in CSV.'] };
  }

  const firstRow = rawRows[0].map((cell) => cell.toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Detect which index maps to which field
  const colMap = {};
  let isFirstRowHeader = false;

  firstRow.forEach((cell, idx) => {
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some((alias) => alias.replace(/[^a-z0-9]/g, '') === cell)) {
        colMap[field] = idx;
        isFirstRowHeader = true;
        break;
      }
    }
  });

  // Fallback positional mapping if no headers detected
  if (!isFirstRowHeader) {
    colMap.title = 0;
    colMap.category = 1;
    colMap.status = 2;
    colMap.priority = 3;
    colMap.date = 4;
    colMap.targetUrl = 5;
    colMap.notes = 6;
  }

  const dataRows = isFirstRowHeader ? rawRows.slice(1) : rawRows;
  const activities = [];
  const errors = [];
  const timestamp = Date.now();

  dataRows.forEach((row, rowIndex) => {
    const rawTitle = colMap.title !== undefined ? row[colMap.title] : row[0];
    const title = (rawTitle || '').trim();

    // Skip empty lines
    if (!title && row.every((c) => !c || !c.trim())) {
      return;
    }

    if (!title) {
      errors.push(`Row ${rowIndex + (isFirstRowHeader ? 2 : 1)} skipped: Missing activity title.`);
      return;
    }

    const rawCategory = colMap.category !== undefined ? row[colMap.category] : '';
    const rawStatus = colMap.status !== undefined ? row[colMap.status] : '';
    const rawPriority = colMap.priority !== undefined ? row[colMap.priority] : '';
    const rawDate = colMap.date !== undefined ? row[colMap.date] : '';
    const rawUrl = colMap.targetUrl !== undefined ? row[colMap.targetUrl] : '';
    const rawNotes = colMap.notes !== undefined ? row[colMap.notes] : '';

    activities.push({
      id: `act-import-${timestamp}-${rowIndex}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      category: normalizeCategory(rawCategory),
      status: normalizeStatus(rawStatus),
      priority: normalizePriority(rawPriority),
      date: normalizeDate(rawDate),
      targetUrl: normalizeUrl(rawUrl),
      notes: (rawNotes || '').trim(),
    });
  });

  return { activities, errors };
}

/**
 * Downloads a pre-formatted sample CSV template for team members to fill out
 */
export function downloadSampleActivityTemplate() {
  const headers = ['Title', 'Category', 'Status', 'Priority', 'Date', 'TargetURL', 'Notes'];
  const sampleRows = [
    [
      'Optimized meta descriptions and H1 tags for core services pages',
      'On-Page SEO',
      'Completed',
      'High',
      '2026-10-24',
      'https://boulderdecisions.com/services',
      'Targeted high-intent consulting search queries and improved SERP CTR',
    ],
    [
      'Resolved 404 crawl errors and updated canonical tags from site audit',
      'Technical SEO',
      'In Progress',
      'High',
      '2026-10-24',
      'https://boulderdecisions.com/',
      'Implemented clean 301 redirects for legacy URLs discovered in Search Console',
    ],
    [
      'Published in-depth executive decision analytics playbook',
      'Content & Blog',
      'Completed',
      'Medium',
      '2026-10-22',
      'https://boulderdecisions.com/blog/decision-analytics',
      '2,200-word comprehensive guide targeting enterprise data strategy terms',
    ],
    [
      'Synchronized Google Business Profile NAP citations across top directories',
      'Local SEO',
      'Planned',
      'Medium',
      '2026-10-28',
      'https://boulderdecisions.com/',
      'Updating directory listings and phone/address consistency',
    ],
    [
      'Audited mobile Core Web Vitals and optimized LCP asset delivery',
      'Technical SEO',
      'Completed',
      'High',
      '2026-10-20',
      'https://boulderdecisions.com/',
      'Deferred non-critical JavaScript and converted hero banners to modern formats',
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
  a.download = 'seo_activities_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
