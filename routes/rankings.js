import express from 'express';
import { getAuth, classifyGoogleError } from '../services/googleAuth.js';
import { getGscQueries } from '../services/gscService.js';

const router = express.Router();

// GET & POST /api/rankings/keywords
const handleKeywords = async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Not authenticated with Google', status: 'unauthenticated' });

    const q = req.method === 'POST' ? req.body : req.query;
    const siteUrl = q.siteUrl || process.env.GSC_SITE_URL || 'sc-domain:boulderdecision.com';
    const startDate = q.startDate;
    const endDate = q.endDate;
    const limit = parseInt(q.limit || '500', 10);

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const keywords = await getGscQueries({ auth, siteUrl, startDate, endDate, rowLimit: limit });

    res.json({
      source: 'Google Search Console Search Analytics API',
      siteUrl,
      dateRange: { startDate, endDate },
      totalKeywords: keywords.length,
      note: 'Ranking reflects average position across all search impressions for the period. For exact daily localized geo-coordinate rank tracking, a specialized ranking provider API can be connected.',
      keywords,
    });
  } catch (err) {
    const classified = classifyGoogleError(err, 'Keyword Rankings');
    res.status(classified.code || 500).json(classified);
  }
};

router.get('/keywords', handleKeywords);
router.post('/keywords', handleKeywords);

export default router;
