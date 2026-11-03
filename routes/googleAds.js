import express from 'express';
import { getGoogleAdsOverview, testGoogleAdsConnection } from '../services/googleAdsService.js';

const router = express.Router();

/**
 * GET /api/google-ads/overview
 * Fetches Google Ads performance metrics, campaigns, keywords, and trends
 */
router.get('/overview', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
      customerId,
      developerToken,
      accountName,
    } = req.query;

    const data = await getGoogleAdsOverview({
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
      customerId,
      developerToken,
      accountName,
      req,
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/google-ads/test
 * Tests Google Ads connection with specified Customer ID / Developer Token
 */
router.post('/test', async (req, res) => {
  try {
    const result = await testGoogleAdsConnection(req);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
