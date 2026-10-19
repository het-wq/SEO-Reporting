export const getBackendBase = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5001';
    }
    return ''; // On Vercel, use relative paths to route to serverless functions
  }
  return 'http://localhost:5001';
};

export const BACKEND_BASE = getBackendBase();
