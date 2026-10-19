import express from 'express';
import { getAuth, classifyGoogleError } from '../services/googleAuth.js';
import { getGA4Overview, getGA4TrafficTrends, getGA4LandingPages } from '../services/ga4Service.js';

const router = express.Router();

const parseParams = (req) => {
  const q = req.method === 'POST' ? req.body : req.query;
  return {
    propertyId: q.propertyId || process.env.GA4_PROPERTY_ID || '516707960',
    startDate: q.startDate,
    endDate: q.endDate,
    prevStartDate: q.prevStartDate,
    prevEndDate: q.prevEndDate,
    limit: parseInt(q.limit || '25', 10),
  };
};

// GET & POST /api/analytics/overview
const handleOverview = async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth) {
      return res.status(401).json({
        error: 'Not authenticated with Google. Please click "Connect with Google".',
        status: 'unauthenticated',
      });
    }

    const { propertyId, startDate, endDate, prevStartDate, prevEndDate } = parseParams(req);
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const data = await getGA4Overview({
      auth,
      propertyId,
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
    });

    res.json(data);
  } catch (err) {
    const classified = classifyGoogleError(err, 'Google Analytics 4');
    res.status(classified.code || 500).json(classified);
  }
};

router.get('/overview', handleOverview);
router.post('/overview', handleOverview);

// GET & POST /api/analytics/traffic
const handleTraffic = async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Not authenticated with Google', status: 'unauthenticated' });

    const { propertyId, startDate, endDate } = parseParams(req);
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

    const trends = await getGA4TrafficTrends({ auth, propertyId, startDate, endDate });
    res.json({ trends });
  } catch (err) {
    const classified = classifyGoogleError(err, 'Google Analytics 4');
    res.status(classified.code || 500).json(classified);
  }
};

router.get('/traffic', handleTraffic);
router.post('/traffic', handleTraffic);

// GET & POST /api/analytics/channels
const handleChannels = async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Not authenticated with Google', status: 'unauthenticated' });

    const { propertyId, startDate, endDate, prevStartDate, prevEndDate } = parseParams(req);
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

    const overview = await getGA4Overview({ auth, propertyId, startDate, endDate, prevStartDate, prevEndDate });
    res.json({ channels: overview.channelAcquisition });
  } catch (err) {
    const classified = classifyGoogleError(err, 'Google Analytics 4');
    res.status(classified.code || 500).json(classified);
  }
};

router.get('/channels', handleChannels);
router.post('/channels', handleChannels);

// GET & POST /api/analytics/landing-pages
const handleLandingPages = async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Not authenticated with Google', status: 'unauthenticated' });

    const { propertyId, startDate, endDate, limit } = parseParams(req);
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

    const pages = await getGA4LandingPages({ auth, propertyId, startDate, endDate, limit });
    res.json({ pages });
  } catch (err) {
    const classified = classifyGoogleError(err, 'Google Analytics 4');
    res.status(classified.code || 500).json(classified);
  }
};

router.get('/landing-pages', handleLandingPages);
router.post('/landing-pages', handleLandingPages);

export default router;
