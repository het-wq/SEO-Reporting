import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import reportsRouter from './routes/reports.js';
import analyticsRouter from './routes/analytics.js';
import searchConsoleRouter from './routes/searchConsole.js';
import rankingsRouter from './routes/rankings.js';
import localSeoRouter from './routes/localSeo.js';
import backlinksRouter from './routes/backlinks.js';
import aiVisibilityRouter from './routes/aiVisibility.js';
import integrationsRouter from './routes/integrations.js';
import dashboardRouter from './routes/dashboard.js';

import {
  getOAuthClient,
  getAuth,
  getAuthStatus,
  loadStoredTokens,
  saveStoredTokens,
  clearStoredTokens,
  buildAuthCookie,
  clearAuthCookie,
  parseCookies,
  getTokensFromRequest,
  REQUIRED_SCOPES,
  classifyGoogleError,
} from './services/googleAuth.js';
import { seedIfEmpty, UPLOAD_DIR } from './data/reportStore.js';
import { getGA4Overview } from './services/ga4Service.js';
import { getGscPerformance, getGscQueries, getGscDevices } from './services/gscService.js';

const app = express();
const port = process.env.PORT || 5001;

// Allow CORS with credentials for persistent cookie sessions
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

// Seed PDF reports storage for historical document viewer (local only, read-only on Vercel)
if (!process.env.VERCEL) {
  seedIfEmpty().catch((err) => console.error('Failed to seed initial report:', err));
}

// -----------------------------------------------------------------------------
// Modular REST APIs
// -----------------------------------------------------------------------------
app.use('/api/analytics', analyticsRouter);
app.use('/api/search-console', searchConsoleRouter);
app.use('/api/rankings', rankingsRouter);
app.use('/api/local-seo', localSeoRouter);
app.use('/api/backlinks', backlinksRouter);
app.use('/api/ai-visibility', aiVisibilityRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);

// -----------------------------------------------------------------------------
// Health & Authentication Endpoints
// -----------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  const authStatus = getAuthStatus(req);
  const cookies = parseCookies(req);
  const proto = req.headers['x-forwarded-proto'] || (req.headers.host?.includes('localhost') ? 'http' : 'https');

  // If authenticated from disk tokens and client lacks cookie, automatically attach persistent cookie
  if (!cookies.seo_auth_tokens) {
    const tokens = getTokensFromRequest(req);
    if (tokens && (tokens.access_token || tokens.refresh_token)) {
      res.setHeader('Set-Cookie', buildAuthCookie(tokens, proto === 'https'));
    }
  }

  res.json({
    status: 'ok',
    configured: authStatus.configured,
    hasToken: authStatus.authenticated,
    authType: authStatus.authType,
    environment: process.env.VERCEL ? 'vercel' : 'local',
    ga4PropertyId: process.env.GA4_PROPERTY_ID || '',
    gscSiteUrl: process.env.GSC_SITE_URL || 'https://boulderdecisions.com/',
  });
});

app.get('/api/auth/google/url', (req, res) => {
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(400).json({
      error: 'Google OAuth Client ID or Client Secret not configured in environment',
      status: 'missing_credentials',
    });
  }

  const oauthClient = getOAuthClient(req);
  const url = oauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: REQUIRED_SCOPES,
    prompt: 'consent',
  });

  res.json({ url });
});

app.get('/api/auth/google/login', (req, res) => {
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(400).send('Google OAuth Client ID or Client Secret not configured in environment');
  }

  const oauthClient = getOAuthClient(req);
  const url = oauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: REQUIRED_SCOPES,
    prompt: 'consent',
  });

  res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Authorization code missing');
  }

  try {
    const oauthClient = getOAuthClient(req);
    const { tokens } = await oauthClient.getToken(code);
    saveStoredTokens(tokens);

    const host = req.headers.host || 'localhost:5173';
    const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
    const isHttps = proto === 'https';
    const frontendBase = host.includes('localhost:5001') ? 'http://localhost:5173' : `${proto}://${host}`;

    // Enable one-time login: Save credentials in 1-year persistent cookie
    res.setHeader('Set-Cookie', buildAuthCookie(tokens, isHttps));

    const queryParams = new URLSearchParams({
      auth: 'success',
      access_token: tokens.access_token || '',
      refresh_token: tokens.refresh_token || '',
      expiry_date: String(tokens.expiry_date || ''),
    });

    res.redirect(`${frontendBase}/?${queryParams.toString()}`);
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.redirect(`/?auth=error&message=${encodeURIComponent(error.message)}`);
  }
});

app.post('/api/auth/set-token', (req, res) => {
  const { access_token, refresh_token, expiry_date } = req.body;
  if (!access_token) {
    return res.status(400).json({ error: 'access_token required' });
  }
  const tokens = { access_token, refresh_token, expiry_date };
  saveStoredTokens(tokens);
  const proto = req.headers['x-forwarded-proto'] || (req.headers.host?.includes('localhost') ? 'http' : 'https');
  res.setHeader('Set-Cookie', buildAuthCookie(tokens, proto === 'https'));
  res.json({ success: true, message: 'Tokens stored in memory and cookie successfully' });
});

app.post('/api/auth/disconnect', (req, res) => {
  clearStoredTokens();
  const proto = req.headers['x-forwarded-proto'] || (req.headers.host?.includes('localhost') ? 'http' : 'https');
  res.setHeader('Set-Cookie', clearAuthCookie(proto === 'https'));
  res.json({ success: true, message: 'Disconnected Google account and cleared cookies' });
});

// Backward-compatible GSC endpoints
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
    const classified = classifyGoogleError(error, 'Google Search Console');
    res.status(classified.code || 500).json(classified);
  }
});

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

    const [perf, queries, devices] = await Promise.all([
      getGscPerformance({ auth, siteUrl, startDate, endDate, prevStartDate, prevEndDate }),
      getGscQueries({ auth, siteUrl, startDate, endDate, rowLimit: 50 }),
      getGscDevices({ auth, siteUrl, startDate, endDate, prevStartDate, prevEndDate }),
    ]);

    const deviceTraffic = [
      { device: 'Desktop', current: devices.desktop.current, impressions: devices.desktop.impressions, previous: devices.desktop.previous, diff: devices.desktop.diffPct },
      { device: 'Mobile', current: devices.mobile.current, impressions: devices.mobile.impressions, previous: devices.mobile.previous, diff: devices.mobile.diffPct },
      { device: 'Tablet', current: devices.tablet.current, impressions: devices.tablet.impressions, previous: devices.tablet.previous, diff: devices.tablet.diffPct },
    ];

    res.json({
      clicks: perf.clicks.current,
      prevClicks: perf.clicks.previous,
      diffClicks: perf.clicks.diffPct,
      impressions: perf.impressions.current,
      prevImpressions: perf.impressions.previous,
      diffImpressions: perf.impressions.diffPct,
      ctr: perf.avgCtr.currentText,
      prevCtr: perf.avgCtr.previousText,
      diffCtr: perf.avgCtr.diffPct,
      position: perf.avgPosition.currentText,
      prevPosition: perf.avgPosition.previousText,
      diffPosition: perf.avgPosition.diffPct,
      topKeywords: queries,
      deviceTraffic,
    });
  } catch (error) {
    const classified = classifyGoogleError(error, 'Google Search Console');
    res.status(classified.code || 500).json(classified);
  }
});

// Backward-compatible GA4 endpoint
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

    const data = await getGA4Overview({ auth, propertyId, startDate, endDate, prevStartDate, prevEndDate });

    res.json({
      overall: data.overall.current,
      prevOverall: data.overall.previous,
      diffOverall: data.overall.diffPct,
      organic: data.organic.current,
      prevOrganic: data.organic.previous,
      diffOrganic: data.organic.diffPct,
      direct: data.direct.current,
      prevDirect: data.direct.previous,
      diffDirect: data.direct.diffPct,
      organicNewUsers: data.organicNewUsers.current,
      prevOrganicNewUsers: data.organicNewUsers.previous,
      diffOrganicNewUsers: data.organicNewUsers.diffPct,
      timeOnSite: data.timeOnSiteOrganic.current,
      prevTimeOnSite: data.timeOnSiteOrganic.previous,
      diffTimeOnSite: data.timeOnSiteOrganic.diffPct,
    });
  } catch (error) {
    const classified = classifyGoogleError(error, 'Google Analytics 4');
    res.status(classified.code || 500).json(classified);
  }
});

// Catch-all handler so serverless function invocations never hang or time out
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    requestedUrl: req.originalUrl || req.url,
    method: req.method,
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

export default app;

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`SEO Reporting Backend API listening on http://localhost:${port}`);
  });
}
