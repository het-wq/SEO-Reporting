import app from '../server.js';

export default function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-tokens');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Normalize path: If Vercel strips /api or rewrites it
  if (req.url === '/api/index.js' || req.url === '/index.js' || req.url === '/' || req.url === '/api') {
    req.url = '/api/health';
  } else if (!req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? req.url : '/' + req.url}`;
  }

  return app(req, res);
}
