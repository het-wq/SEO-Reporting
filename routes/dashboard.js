import express from 'express';
import { getLiveDashboardReport } from '../services/dashboardService.js';

const router = express.Router();

const handleLiveReport = async (req, res) => {
  try {
    const q = req.method === 'POST' ? req.body : req.query;
    const {
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
      propertyId,
      siteUrl,
      brandTerms,
      periodLabel,
      previousPeriodLabel,
      forceRefresh,
    } = q;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate are required query parameters (format: YYYY-MM-DD)',
      });
    }

    const report = await getLiveDashboardReport({
      req,
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
      propertyId,
      siteUrl,
      brandTerms: brandTerms ? (Array.isArray(brandTerms) ? brandTerms : String(brandTerms).split(',')) : undefined,
      periodLabel,
      previousPeriodLabel,
      forceRefresh: forceRefresh === 'true' || forceRefresh === true,
    });

    res.json(report);
  } catch (err) {
    console.error('Live dashboard report error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate live dashboard report' });
  }
};

router.get('/live-report', handleLiveReport);
router.post('/live-report', handleLiveReport);

export default router;
