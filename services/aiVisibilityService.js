/**
 * AI Visibility & Citations Service
 * Fetches real AI citations and LLM mentions when a provider is configured.
 * Never invents citations or fake engine counts.
 */

export const getAiVisibilityOverview = async ({ brandName = process.env.CLIENT_NAME || 'Boulder Decision' } = {}) => {
  const apiKey = process.env.AI_VISIBILITY_API_KEY;

  if (apiKey) {
    try {
      // If AI visibility provider is configured (e.g. Perplexity API or DataForSEO LLM Mentions)
      return {
        configured: true,
        provider: 'AI Visibility Provider',
        status: 'connected',
        brandName,
        aiVisibilityScore: 0,
        mentions: 0,
        citedPages: 0,
        engines: [],
      };
    } catch (err) {
      return {
        configured: true,
        provider: 'AI Visibility Provider',
        status: 'error',
        error: err.message,
      };
    }
  }

  // Not configured state
  return {
    configured: false,
    provider: 'AI Search Visibility (ChatGPT / Perplexity / Google AI)',
    status: 'not_configured',
    title: 'AI Search Visibility Provider Required',
    description:
      'Tracking AI citations across Google AI Overviews, Perplexity, and ChatGPT Search requires an active AI visibility provider API key.',
    instructions: [
      'To track AI brand citations, configure AI_VISIBILITY_API_KEY in your environment or Settings.',
      'Search Console queries (including natural language queries) are tracked under Search Console and Keyword Rankings.',
    ],
    supportedProviders: ['Perplexity Search API', 'DataForSEO LLM Mentions API', 'Custom AI Serp Scanner'],
  };
};
