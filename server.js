import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const getRedirectUri = (req) => {
  if (process.env.REDIRECT_URI) return process.env.REDIRECT_URI;
  if (req && req.headers && req.headers.host) {
    const proto = req.headers['x-forwarded-proto'] || (req.headers.host.includes('localhost') ? 'http' : 'https');
    return `${proto}://${req.headers.host}/api/auth/google/callback`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/auth/google/callback`;
  }
  return 'http://localhost:5001/api/auth/google/callback';
};

const getOAuthClient = (req) => {
  const redirectUri = getRedirectUri(req);
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, redirectUri);
};

let storedTokens = null;

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    configured: Boolean(CLIENT_ID && CLIENT_SECRET),
    hasToken: Boolean(storedTokens && storedTokens.access_token),
    environment: process.env.VERCEL ? 'vercel' : 'local',
  });
});

app.get('/api/auth/google/url', (req, res) => {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(400).json({ error: 'Google OAuth Client ID or Client Secret not configured in environment' });
  }

  const oauthClient = getOAuthClient(req);
  const scopes = [
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/analytics.readonly',
  ];

  const url = oauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  res.json({ url });
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Authorization code missing');
  }

  try {
    const oauthClient = getOAuthClient(req);
    const { tokens } = await oauthClient.getToken(code);
    storedTokens = tokens;

    const host = req.headers.host || 'localhost:5173';
    const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');

    // In local dev, backend is 5001 and frontend is 5173; in Vercel both are on the same host
    const frontendBase = host.includes('localhost:5001') ? 'http://localhost:5173' : `${proto}://${host}`;

    res.redirect(`${frontendBase}/?auth=success&access_token=${tokens.access_token}`);
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.redirect(`/?auth=error&message=${encodeURIComponent(error.message)}`);
  }
});

app.post('/api/auth/set-token', (req, res) => {
  const { access_token, refresh_token } = req.body;
  if (!access_token) {
    return res.status(400).json({ error: 'access_token required' });
  }
  storedTokens = { access_token, refresh_token };
  res.json({ success: true, message: 'Tokens stored' });
});

const getAuth = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    client.setCredentials({ access_token: token });
    return client;
  }
  if (storedTokens) {
    const client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    client.setCredentials(storedTokens);
    return client;
  }
  return null;
};

app.get('/api/gsc/sites', async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Not authenticated with Google. Please click "Connect with Google".' });
    }

    const searchconsole = google.searchconsole({ version: 'v1', auth });
    const response = await searchconsole.sites.list();
    res.json({ sites: response.data.siteEntry || [] });
  } catch (error) {
    console.error('Failed to list sites:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const calcDiff = (curr, prev) => {
  if (prev === 0 || !prev) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 10000) / 100;
};

app.post('/api/gsc/report', async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Not authenticated with Google' });
    }

    const { siteUrl, startDate, endDate, prevStartDate, prevEndDate } = req.body;
    if (!siteUrl) {
      return res.status(400).json({ error: 'siteUrl is required' });
    }

    const searchconsole = google.searchconsole({ version: 'v1', auth });

    const currentRes = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate, dimensions: ['date'] },
    });

    let prevRes = { data: { rows: [] } };
    if (prevStartDate && prevEndDate) {
      try {
        prevRes = await searchconsole.searchanalytics.query({
          siteUrl,
          requestBody: { startDate: prevStartDate, endDate: prevEndDate, dimensions: ['date'] },
        });
      } catch (e) {
        console.warn('Could not fetch previous GSC period:', e.message);
      }
    }

    const queriesRes = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate, dimensions: ['query'], rowLimit: 50 },
    });

    const devicesRes = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate, dimensions: ['device'] },
    });

    const cRows = currentRes.data.rows || [];
    const clicks = cRows.reduce((acc, r) => acc + (r.clicks || 0), 0);
    const impressions = cRows.reduce((acc, r) => acc + (r.impressions || 0), 0);
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const position = cRows.length > 0 ? cRows.reduce((acc, r) => acc + (r.position || 0), 0) / cRows.length : 0;

    const pRows = prevRes.data.rows || [];
    const prevClicks = pRows.reduce((acc, r) => acc + (r.clicks || 0), 0);
    const prevImpressions = pRows.reduce((acc, r) => acc + (r.impressions || 0), 0);
    const prevCtr = prevImpressions > 0 ? (prevClicks / prevImpressions) * 100 : 0;
    const prevPosition = pRows.length > 0 ? pRows.reduce((acc, r) => acc + (r.position || 0), 0) / pRows.length : 0;

    const topKeywords = (queriesRes.data.rows || []).map((row) => ({
      keyword: row.keys[0],
      ranking: Math.round(row.position * 10) / 10,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: (row.ctr * 100).toFixed(2) + '%',
      status: row.position <= 5 ? 'Top 5' : row.position <= 10 ? 'Top 10' : row.position <= 20 ? 'Top 20' : 'Page 3+',
      change: '0',
    }));

    const deviceRows = devicesRes.data.rows || [];
    const deviceTraffic = deviceRows.map((d) => ({
      device: d.keys[0].charAt(0).toUpperCase() + d.keys[0].slice(1).toLowerCase(),
      current: d.clicks || 0,
      impressions: d.impressions || 0,
      previous: 0,
      diff: 0,
    }));

    res.json({
      clicks,
      prevClicks,
      diffClicks: calcDiff(clicks, prevClicks),
      impressions,
      prevImpressions,
      diffImpressions: calcDiff(impressions, prevImpressions),
      ctr: ctr.toFixed(2) + '%',
      prevCtr: prevCtr.toFixed(2) + '%',
      diffCtr: Math.round((ctr - prevCtr) * 100) / 100,
      position: position > 0 ? position.toFixed(1) : '0.0',
      prevPosition: prevPosition > 0 ? prevPosition.toFixed(1) : '0.0',
      diffPosition: Math.round((prevPosition - position) * 10) / 10,
      topKeywords,
      deviceTraffic,
    });
  } catch (error) {
    console.error('GSC Report Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ga4/report', async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Not authenticated with Google' });
    }

    const { propertyId, startDate, endDate, prevStartDate, prevEndDate } = req.body;
    if (!propertyId) {
      return res.status(400).json({ error: 'GA4 Property ID is required' });
    }

    const cleanPropId = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
    const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });

    const dateRanges = [{ startDate, endDate }];
    if (prevStartDate && prevEndDate) {
      dateRanges.push({ startDate: prevStartDate, endDate: prevEndDate });
    }

    const response = await analyticsdata.properties.runReport({
      property: cleanPropId,
      requestBody: {
        dateRanges,
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'averageSessionDuration' },
        ],
      },
    });

    const rows = response.data.rows || [];
    let totalSessions = 0;
    let organicSessions = 0;
    let directSessions = 0;
    let newUsers = 0;
    let totalDuration = 0;

    let prevTotalSessions = 0;
    let prevOrganicSessions = 0;
    let prevDirectSessions = 0;
    let prevNewUsers = 0;

    rows.forEach((r) => {
      const channel = r.dimensionValues?.[0]?.value || '';
      const sessions = parseInt(r.metricValues?.[0]?.value || '0', 10);
      const active = parseInt(r.metricValues?.[1]?.value || '0', 10);
      const nu = parseInt(r.metricValues?.[2]?.value || '0', 10);
      const duration = parseFloat(r.metricValues?.[3]?.value || '0');

      totalSessions += sessions;
      newUsers += nu;
      totalDuration += duration * sessions;

      if (channel.toLowerCase().includes('organic')) {
        organicSessions += sessions;
      } else if (channel.toLowerCase().includes('direct')) {
        directSessions += sessions;
      }
    });

    const avgDurationSec = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;
    const mins = Math.floor(avgDurationSec / 60);
    const secs = avgDurationSec % 60;
    const timeOnSite = `${mins}m ${secs}s`;

    res.json({
      overall: totalSessions,
      prevOverall: prevTotalSessions,
      diffOverall: calcDiff(totalSessions, prevTotalSessions),
      organic: organicSessions,
      prevOrganic: prevOrganicSessions,
      diffOrganic: calcDiff(organicSessions, prevOrganicSessions),
      direct: directSessions,
      prevDirect: prevDirectSessions,
      diffDirect: calcDiff(directSessions, prevDirectSessions),
      organicNewUsers: newUsers,
      prevOrganicNewUsers: prevNewUsers,
      diffOrganicNewUsers: calcDiff(newUsers, prevNewUsers),
      timeOnSite,
      prevTimeOnSite: '0m 0s',
      diffTimeOnSite: 0,
    });
  } catch (error) {
    console.error('GA4 Report Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default app;

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`SEO Reporting Backend API listening on http://localhost:${port}`);
  });
}
