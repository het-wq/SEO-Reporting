export const getBackendBase = () => {
  if (typeof window !== 'undefined') {
    const envBase = import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_BACKEND_URL;
    if (envBase) {
      return envBase.replace(/\/+$/, '');
    }
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5001';
    }
    return ''; // On Vercel, use relative paths to route to serverless functions
  }
  return 'http://localhost:5001';
};

export const BACKEND_BASE = getBackendBase();
