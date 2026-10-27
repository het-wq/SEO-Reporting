export const getBackendBase = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';

    // If running in browser on production (e.g. *.vercel.app or custom domain):
    if (!isLocal) {
      const envBase = import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_BACKEND_URL;
      // If an explicit external HTTPS backend URL is configured (and NOT localhost), use it
      if (
        envBase &&
        typeof envBase === 'string' &&
        envBase.startsWith('https://') &&
        !envBase.includes('localhost') &&
        !envBase.includes('127.0.0.1')
      ) {
        return envBase.replace(/\/+$/, '');
      }
      // Otherwise in production on Vercel, use relative paths to route to serverless /api
      return '';
    }

    // Local development
    const envBase = import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_BACKEND_URL;
    if (envBase) {
      return envBase.replace(/\/+$/, '');
    }
    return 'http://localhost:5001';
  }
  return '';
};

export const BACKEND_BASE = getBackendBase();

