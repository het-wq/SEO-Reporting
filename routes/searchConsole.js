import express from 'express';
import { getAuth, classifyGoogleError } from '../services/googleAuth.js';
import {
  getGscPerformance,
  getGscQueries,
  getGscDevices,
  getGscPages,
  listGscSites,
} from '../services/gscService.js';
import { getBrandAnalysis } from '../services/brandAnalysisService.js';

const router = express.Router();

const parseParams = (req) => {
  const q = req.method === 'POST' ? req.body : req.query;
  return {
    siteUrl: q.siteUrl || process.env.GSC_SITE_URL || 'https://boulderdecisions.com/',
    startDate: q.startDate,
    endDate: q.endDate,
    prevStartDate: q.prevStartDate,
    prevEndDate: q.prevEndDate,
    limit: parseInt(q.limit || q.rowLimit || '250', 10),
    brandTerms: q.brandTerms,
    nonBrandTerms: q.nonBrandTerms,
  };
};

// GET & POST /api/search-console/performance
const handlePerformance = async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Not authenticated with Google', status: 'unauthenticated' });

    const { siteUrl, startDate, endDate, prevStartDate, prevEndDate } = parseParams(req);
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

    const data = await getGscPerformance({
      auth,
      siteUrl,
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
    });

    res.json(data);
  } catch (err) {
    const classified = classifyGoogleError(err, 'Google Search Console');
    res.status(classified.code || 500).json(classified);
  }
};

router.get('/performance', handlePerformance);
router.post('/performance', handlePerformance);

// GET & POST /api/search-console/queries
const handleQueries = async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Not authenticated with Google', status: 'unauthenticated' });

    const { siteUrl, startDate, endDate, limit } = parseParams(req);
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

    const queries = await getGscQueries({ auth, siteUrl, startDate, endDate, rowLimit: limit });
    res.json({ queries });
  } catch (err) {
    const classified = classifyGoogleError(err, 'Google Search Console');
    res.status(classified.code || 500).json(classified);
  }
};

router.get('/queries', handleQueries);
router.post('/queries', handleQueries);

// GET & POST /api/search-console/devices
const handleDevices = async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Not authenticated with Google', status: 'unauthenticated' });

    const { siteUrl, startDate, endDate, prevStartDate, prevEndDate } = parseParams(req);
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

    const devices = await getGscDevices({ auth, siteUrl, startDate, endDate, prevStartDate, prevEndDate });
    res.json({ devices });
  } catch (err) {
    const classified = classifyGoogleError(err, 'Google Search Console');
    res.status(classified.code || 500).json(classified);
  }
};

router.get('/devices', handleDevices);
router.post('/devices', handleDevices);

// GET & POST /api/search-console/pages
const handlePages = async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Not authenticated with Google', status: 'unauthenticated' });

    const { siteUrl, startDate, endDate, limit } = parseParams(req);
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

    const pages = await getGscPages({ auth, siteUrl, startDate, endDate, rowLimit: limit });
    res.json({ pages });
  } catch (err) {
    const classified = classifyGoogleError(err, 'Google Search Console');
    res.status(classified.code || 500).json(classified);
  }
};

router.get('/pages', handlePages);
router.post('/pages', handlePages);

// GET & POST /api/search-console/brand
const handleBrand = async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Not authenticated with Google', status: 'unauthenticated' });

    const { siteUrl, startDate, endDate, prevStartDate, prevEndDate, brandTerms, nonBrandTerms } = parseParams(req);
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

    const brand = await getBrandAnalysis({
      auth,
      siteUrl,
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
      brandTerms,
      nonBrandTerms,
    });

    res.json(brand);
  } catch (err) {
    const classified = classifyGoogleError(err, 'Google Search Console');
    res.status(classified.code || 500).json(classified);
  }
};

router.get('/brand', handleBrand);
router.post('/brand', handleBrand);

// GET /api/search-console/sites
router.get('/sites', async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Not authenticated with Google', status: 'unauthenticated' });
    const sites = await listGscSites(auth);
    res.json({ sites });
  } catch (err) {
    const classified = classifyGoogleError(err, 'Google Search Console');
    res.status(classified.code || 500).json(classified);
  }
});

export default router;
