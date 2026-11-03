import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const isVercel = Boolean(process.env.VERCEL);

export const KEYWORDS_DB_FILE = isVercel
  ? path.join(os.tmpdir(), 'account_keywords.json')
  : path.join(ROOT, 'data', 'account_keywords.json');

/**
 * Normalizes text for case-insensitive and punctuation-free matching
 */
export const normalizeKey = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^sc-domain:/, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '')
    .replace(/[^a-z0-9]/g, '');
};

/**
 * Initial seed dictionary for known preset accounts
 */
const INITIAL_ACCOUNT_SEEDS = [
  {
    accountId: 'default-boulder-decision',
    accountName: 'Boulder Decision',
    propertyName: 'Boulder Decision Web',
    ga4PropertyId: '516707960',
    gscSiteUrl: 'https://boulderdecisions.com/',
    brandKeywords: 'Boulder Decision, Boulder Decisions, boulderdecision, boulderdecisions, boulder decisions',
    nonBrandKeywords: '',
    updatedAt: new Date().toISOString(),
  },
  {
    accountId: 'seed-joint-injections',
    accountName: 'Joint Injections',
    propertyName: 'Joint Injections',
    ga4PropertyId: '316531761',
    gscSiteUrl: 'https://jointinjections.com/',
    brandKeywords: 'Joint Injections, Joint Injection, jointinjections, joint injections',
    nonBrandKeywords: 'knee pain injection, arthritis relief, joint pain clinic',
    updatedAt: new Date().toISOString(),
  },
  {
    accountId: 'seed-ebo2',
    accountName: 'EBO2',
    propertyName: 'EBO2 Therapy',
    ga4PropertyId: '316531762',
    gscSiteUrl: 'https://ebo2therapy.com/',
    brandKeywords: 'EBO2, EBO2 Therapy, ebo2, ebo2therapy',
    nonBrandKeywords: 'blood filtration, ozone therapy, longevity clinic',
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Reads the database of account keywords
 */
export async function readKeywordsDb() {
  try {
    const raw = await fs.readFile(KEYWORDS_DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('Could not read account_keywords.json, creating initial store:', err.message);
    }
  }

  // Initialize store with default seeds
  const initialMap = {};
  for (const seed of INITIAL_ACCOUNT_SEEDS) {
    initialMap[seed.accountId] = seed;
  }

  try {
    const dir = path.dirname(KEYWORDS_DB_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(KEYWORDS_DB_FILE, JSON.stringify(initialMap, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed writing initial account_keywords.json:', e.message);
  }

  return initialMap;
}

/**
 * Writes the database of account keywords
 */
export async function writeKeywordsDb(data) {
  try {
    const dir = path.dirname(KEYWORDS_DB_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(KEYWORDS_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to write account_keywords.json:', err.message);
    return false;
  }
}

/**
 * Derives default brand keywords for an account without leaking Boulder Decision
 */
export function deriveBrandKeywordsForAccount({ accountName, propertyName, siteUrl }) {
  const name = (accountName || '').trim();
  const prop = (propertyName || '').trim();
  const site = (siteUrl || '').trim();

  const hasNonBoulderName =
    (name && !name.toLowerCase().includes('boulder') && !/^\d+$/.test(name) && name.toLowerCase() !== 'connected account') ||
    (prop && !prop.toLowerCase().includes('boulder') && !/^\d+$/.test(prop));

  const isBoulder =
    !hasNonBoulderName &&
    (name.toLowerCase().includes('boulder') ||
      prop.toLowerCase().includes('boulder') ||
      site.toLowerCase().includes('boulder'));

  if (isBoulder) {
    return 'Boulder Decision, Boulder Decisions, boulderdecision, boulderdecisions, boulder decisions';
  }

  const terms = new Set();
  const addTerm = (t) => {
    if (!t) return;
    const clean = t.trim();
    if (clean && !/^\d+$/.test(clean) && clean.toLowerCase() !== 'default') {
      terms.add(clean);
      const parts = clean.split(/[\s\-_|:]+/).filter((p) => p.length > 2);
      if (parts.length > 1) {
        terms.add(parts.join(' '));
        terms.add(parts.join(''));
      }
    }
  };

  addTerm(name);
  addTerm(prop);

  if (site) {
    const cleanDomain = site
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^sc-domain:/, '')
      .replace(/\/.*$/, '')
      .replace(/^www\./, '');

    const domainBase = cleanDomain.split('.')[0];
    if (domainBase && domainBase.length > 2 && domainBase !== 'boulderdecisions') {
      terms.add(domainBase);
      const spaced = domainBase.replace(/[-_]/g, ' ');
      if (spaced !== domainBase) terms.add(spaced);
    }
  }

  if (terms.size === 0) {
    return name || prop || 'Brand';
  }

  return Array.from(terms).join(', ');
}

/**
 * Finds keywords for a specific account using multi-field matching
 */
export async function getAccountKeywords({ accountId, propertyId, siteUrl, accountName }) {
  const db = await readKeywordsDb();

  // 1. Exact match by accountId
  if (accountId && db[accountId]) {
    return { ...db[accountId], matchType: 'accountId' };
  }

  const accountsList = Object.values(db);

  // 2. Match by GA4 propertyId
  if (propertyId) {
    const cleanPropId = String(propertyId).trim();
    const found = accountsList.find((a) => a.ga4PropertyId && String(a.ga4PropertyId).trim() === cleanPropId);
    if (found) return { ...found, matchType: 'propertyId' };
  }

  // 3. Match by normalized site URL
  if (siteUrl) {
    const targetSiteNorm = normalizeKey(siteUrl);
    if (targetSiteNorm) {
      const found = accountsList.find((a) => a.gscSiteUrl && normalizeKey(a.gscSiteUrl) === targetSiteNorm);
      if (found) return { ...found, matchType: 'siteUrl' };
    }
  }

  // 4. Match by normalized account name
  if (accountName) {
    const targetNameNorm = normalizeKey(accountName);
    if (targetNameNorm) {
      const found = accountsList.find(
        (a) =>
          (a.accountName && normalizeKey(a.accountName) === targetNameNorm) ||
          (a.propertyName && normalizeKey(a.propertyName) === targetNameNorm)
      );
      if (found) return { ...found, matchType: 'accountName' };
    }
  }

  // 5. If not found in database, automatically derive appropriate brand keywords and save to database!
  const derivedBrand = deriveBrandKeywordsForAccount({
    accountName,
    propertyName: accountName,
    siteUrl,
  });

  const generatedId = accountId || (propertyId ? `ga4-${propertyId}` : siteUrl ? `gsc-${encodeURIComponent(siteUrl)}` : `acc-${Date.now()}`);

  const newEntry = {
    accountId: generatedId,
    accountName: accountName || 'Connected Account',
    propertyName: accountName || '',
    ga4PropertyId: propertyId || '',
    gscSiteUrl: siteUrl || '',
    brandKeywords: derivedBrand,
    nonBrandKeywords: '',
    updatedAt: new Date().toISOString(),
    isAutoGenerated: true,
  };

  db[generatedId] = newEntry;
  await writeKeywordsDb(db);

  return { ...newEntry, matchType: 'newly_generated' };
}

/**
 * Saves or updates branded and non-branded keywords in the database
 */
export async function saveAccountKeywords({
  accountId,
  accountName,
  propertyName,
  ga4PropertyId,
  gscSiteUrl,
  brandKeywords,
  nonBrandKeywords,
}) {
  const db = await readKeywordsDb();

  // Find existing key by ID, property, or site
  let targetKey = accountId;
  if (!targetKey || !db[targetKey]) {
    if (ga4PropertyId) {
      const match = Object.values(db).find((a) => a.ga4PropertyId === String(ga4PropertyId));
      if (match) targetKey = match.accountId;
    }
    if (!targetKey && gscSiteUrl) {
      const match = Object.values(db).find((a) => normalizeKey(a.gscSiteUrl) === normalizeKey(gscSiteUrl));
      if (match) targetKey = match.accountId;
    }
    if (!targetKey && accountName) {
      const match = Object.values(db).find((a) => normalizeKey(a.accountName) === normalizeKey(accountName));
      if (match) targetKey = match.accountId;
    }
  }

  if (!targetKey) {
    targetKey = accountId || (ga4PropertyId ? `ga4-${ga4PropertyId}` : `acc-${Date.now()}`);
  }

  const existing = db[targetKey] || {};

  const bStr =
    brandKeywords !== undefined
      ? Array.isArray(brandKeywords)
        ? brandKeywords.join(', ')
        : String(brandKeywords)
      : existing.brandKeywords || '';

  const nbStr =
    nonBrandKeywords !== undefined
      ? Array.isArray(nonBrandKeywords)
        ? nonBrandKeywords.join(', ')
        : String(nonBrandKeywords)
      : existing.nonBrandKeywords || '';

  const updatedEntry = {
    ...existing,
    accountId: targetKey,
    accountName: accountName || existing.accountName || 'Connected Account',
    propertyName: propertyName || existing.propertyName || '',
    ga4PropertyId: ga4PropertyId !== undefined ? ga4PropertyId : existing.ga4PropertyId || '',
    gscSiteUrl: gscSiteUrl !== undefined ? gscSiteUrl : existing.gscSiteUrl || '',
    brandKeywords: bStr,
    nonBrandKeywords: nbStr,
    updatedAt: new Date().toISOString(),
  };

  db[targetKey] = updatedEntry;
  await writeKeywordsDb(db);

  return updatedEntry;
}

/**
 * List all saved account keywords in the database
 */
export async function listAllAccountKeywords() {
  const db = await readKeywordsDb();
  return Object.values(db);
}
