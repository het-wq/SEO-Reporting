import 'dotenv/config';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const isVercel = Boolean(process.env.VERCEL);
const TOKENS_FILE = isVercel ? path.join(os.tmpdir(), 'tokens.json') : path.join(ROOT, 'data', 'tokens.json');

export const getClientId = () => process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
export const getClientSecret = () => process.env.GOOGLE_CLIENT_SECRET;

export const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
];

// In-memory cache of tokens
let inMemoryTokens = null;

export const loadStoredTokens = () => {
  if (inMemoryTokens) return inMemoryTokens;
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const data = fs.readFileSync(TOKENS_FILE, 'utf-8');
      inMemoryTokens = JSON.parse(data);
      return inMemoryTokens;
    }
  } catch (err) {
    console.error('Error reading tokens file:', err.message);
  }
  return null;
};

export const saveStoredTokens = (tokens) => {
  inMemoryTokens = { ...(inMemoryTokens || {}), ...tokens };
  try {
    const dir = path.dirname(TOKENS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(inMemoryTokens, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing tokens file:', err.message);
  }
  return inMemoryTokens;
};

export const clearStoredTokens = () => {
  inMemoryTokens = null;
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      fs.unlinkSync(TOKENS_FILE);
    }
  } catch (err) {
    console.error('Error deleting tokens file:', err.message);
  }
};

export const getRedirectUri = (req) => {
  if (process.env.VERCEL && req?.headers?.host) {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    return `${proto}://${req.headers.host}/api/auth/google/callback`;
  }
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

export const getOAuthClient = (req) => {
  const redirectUri = getRedirectUri(req);
  const client = new google.auth.OAuth2(getClientId(), getClientSecret(), redirectUri);

  client.on('tokens', (newTokens) => {
    saveStoredTokens(newTokens);
  });

  return client;
};

/**
 * Checks for Service Account configuration (via file or env string)
 */
export const getServiceAccountAuth = () => {
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const credPath = path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)
        ? process.env.GOOGLE_APPLICATION_CREDENTIALS
        : path.join(ROOT, process.env.GOOGLE_APPLICATION_CREDENTIALS);

      if (fs.existsSync(credPath)) {
        return new google.auth.GoogleAuth({
          keyFile: credPath,
          scopes: REQUIRED_SCOPES,
        });
      }
    }

    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      let credentials;
      try {
        credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      } catch {
        const decoded = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf-8');
        credentials = JSON.parse(decoded);
      }
      return new google.auth.GoogleAuth({
        credentials,
        scopes: REQUIRED_SCOPES,
      });
    }
  } catch (err) {
    console.error('Error loading service account:', err.message);
  }
  return null;
};

export const parseCookies = (req) => {
  const list = {};
  const rc = req?.headers?.cookie;
  if (!rc) return list;
  rc.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts.shift().trim();
    const value = decodeURIComponent(parts.join('='));
    list[name] = value;
  });
  return list;
};

export const getTokensFromRequest = (req) => {
  // 1. From cookie (seo_auth_tokens)
  try {
    const cookies = parseCookies(req);
    if (cookies.seo_auth_tokens) {
      const parsed = JSON.parse(cookies.seo_auth_tokens);
      if (parsed && (parsed.access_token || parsed.refresh_token)) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore parse error
  }

  // 2. From custom x-auth-tokens header
  try {
    const header = req?.headers?.['x-auth-tokens'];
    if (header) {
      const parsed = JSON.parse(decodeURIComponent(header));
      if (parsed && (parsed.access_token || parsed.refresh_token)) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  // 3. Fallback to stored tokens on disk
  return loadStoredTokens();
};

export const buildAuthCookie = (tokens, isHttps = false) => {
  const payload = encodeURIComponent(JSON.stringify(tokens));
  return [
    `seo_auth_tokens=${payload}; Path=/; Max-Age=31536000; SameSite=Lax; ${isHttps ? 'Secure;' : ''}`,
    `seo_logged_in=true; Path=/; Max-Age=31536000; SameSite=Lax; ${isHttps ? 'Secure;' : ''}`,
  ];
};

export const clearAuthCookie = (isHttps = false) => {
  return [
    `seo_auth_tokens=; Path=/; Max-Age=0; SameSite=Lax; ${isHttps ? 'Secure;' : ''}`,
    `seo_logged_in=; Path=/; Max-Age=0; SameSite=Lax; ${isHttps ? 'Secure;' : ''}`,
  ];
};

/**
 * Retrieve authenticated client for calling Google APIs
 */
export const getAuth = (req) => {
  const requestTokens = getTokensFromRequest(req);

  // 1. Bearer Token passed from client in Authorization header
  const authHeader = req?.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token && token !== 'undefined' && token !== 'null') {
      const client = getOAuthClient(req);
      client.setCredentials({
        access_token: token,
        refresh_token: requestTokens?.refresh_token,
      });
      return client;
    }
  }

  // 2. Cookie or Stored OAuth tokens
  if (requestTokens && (requestTokens.access_token || requestTokens.refresh_token)) {
    const client = getOAuthClient(req);
    client.setCredentials(requestTokens);
    return client;
  }

  // 3. Service Account auth
  const sa = getServiceAccountAuth();
  if (sa) {
    return sa;
  }

  return null;
};

/**
 * Get unified connection status
 */
export const getAuthStatus = (req) => {
  const clientId = getClientId();
  const clientSecret = getClientSecret();
  const isOauthConfigured = Boolean(clientId && clientSecret);
  const requestTokens = getTokensFromRequest(req);
  const hasOAuthToken = Boolean(requestTokens && (requestTokens.access_token || requestTokens.refresh_token));
  const hasServiceAccount = Boolean(
    (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  );

  let authType = 'none';
  let isAuthenticated = false;

  if (hasOAuthToken) {
    authType = 'oauth';
    isAuthenticated = true;
  } else if (hasServiceAccount) {
    authType = 'service_account';
    isAuthenticated = true;
  }

  return {
    configured: isOauthConfigured || hasServiceAccount,
    authenticated: isAuthenticated,
    authType,
    hasOAuthToken,
    hasServiceAccount,
    scopes: REQUIRED_SCOPES,
    clientId: clientId ? `${clientId.substring(0, 16)}...` : null,
  };
};

/**
 * Parses Google API errors into user-friendly status and actionable messages
 */
export const classifyGoogleError = (error, provider = 'Google API') => {
  const msg = error?.message || String(error);
  const code = error?.code || error?.status || 500;

  if (msg.includes('has not been used in project') || msg.includes('disabled')) {
    const projectMatch = msg.match(/project[ =](\d+)/i) || msg.match(/(\d{8,})/);
    const projectId = projectMatch ? projectMatch[1] : 'your project';
    const isGsc = msg.includes('searchconsole');
    const apiName = isGsc ? 'Google Search Console API' : 'Google Analytics Data API';
    const actionUrl = isGsc
      ? `https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=${projectId}`
      : `https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview?project=${projectId}`;

    return {
      status: 'api_not_enabled',
      code: 403,
      message: `${apiName} is not enabled in your Google Cloud Project (${projectId}).`,
      actionUrl,
      actionLabel: `Enable ${apiName} in Google Cloud Console`,
      originalError: msg,
    };
  }

  if (code === 401 || msg.includes('invalid_grant') || msg.includes('unauthenticated') || msg.includes('token expired')) {
    return {
      status: 'unauthenticated',
      code: 401,
      message: 'Google authorization expired or invalid. Please click "Connect with Google" to re-authenticate.',
      actionLabel: 'Connect with Google',
      originalError: msg,
    };
  }

  if (code === 403 || msg.includes('User does not have sufficient permissions') || msg.includes('permission')) {
    return {
      status: 'permission_denied',
      code: 403,
      message: `Permission denied for ${provider}. Ensure your authenticated Google account is added with Viewer or Analyst access to the property.`,
      actionLabel: 'Verify Permissions',
      originalError: msg,
    };
  }

  if (code === 429 || msg.includes('quota') || msg.includes('rate limit')) {
    return {
      status: 'quota_exceeded',
      code: 429,
      message: `${provider} request quota or rate limit exceeded. Please wait a moment and try again.`,
      originalError: msg,
    };
  }

  if (code === 404 || msg.includes('not found') || msg.includes('Property not found')) {
    return {
      status: 'not_found',
      code: 404,
      message: `${provider} property was not found. Please verify the Property ID or Site URL in Settings.`,
      originalError: msg,
    };
  }

  return {
    status: 'error',
    code,
    message: msg || `Failed to fetch data from ${provider}`,
    originalError: msg,
  };
};
