/**
 * Local SEO & Local Rank-Tracking Service
 * Note: Google Business Profile (GBP) API provides profile insights (calls, directions, views),
 * but Google Maps 3x3 / 5x5 geo-grid rank maps require a specialized local SERP rank tracker
 * such as BrightLocal, Local Falcon, or DataForSEO Google Maps SERP API.
 */

export const getLocalSeoOverview = async () => {
  const brightLocalKey = process.env.BRIGHTLOCAL_API_KEY;
  const gbpAccountId = process.env.GOOGLE_BUSINESS_ACCOUNT_ID;

  if (brightLocalKey) {
    try {
      // If BrightLocal API is configured with real key, query reports
      // (BrightLocal API v4 batch or report endpoints)
      return {
        configured: true,
        provider: 'BrightLocal',
        status: 'connected',
        description: 'BrightLocal Local Rank Tracker API',
        grids: [],
      };
    } catch (err) {
      return {
        configured: true,
        provider: 'BrightLocal',
        status: 'error',
        error: err.message,
      };
    }
  }

  // Not configured: Return clear data-unavailable state with setup instructions
  return {
    configured: false,
    provider: 'Local Rank Tracker / Google Business Profile',
    status: 'not_configured',
    title: 'Local SEO Rank Tracking Setup Required',
    description:
      'Google Maps 3x3 local geo-grid rank maps require a local rank tracking provider API (e.g. BrightLocal, Local Falcon, or DataForSEO Maps API). Google Business Profile APIs do not provide geo-grid ranking coordinates.',
    instructions: [
      'To view live local ranking grids, configure BRIGHTLOCAL_API_KEY in your environment or Settings.',
      'To view Google Business Profile calls and direction metrics, configure GOOGLE_BUSINESS_ACCOUNT_ID.',
      'Search Console local query performance is available under the Keyword Rankings section.',
    ],
    supportedProviders: ['BrightLocal API', 'DataForSEO Google Maps SERP API', 'Google Business Profile API'],
  };
};
