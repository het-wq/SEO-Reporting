/**
 * Backlink and Off-Page Submission Categories and Shared Data Model
 */

export const BACKLINKS_STORAGE_KEY = 'boulder_custom_backlinks';

// 21 User-requested off-page submission categories
export const SUBMISSION_CATEGORIES = [
  'Reddit Submission',
  'Quora Submission',
  'Forum Submission',
  'PDF Submission',
  'Infographics Submission',
  'Image Submission',
  'Video Submission',
  'Pinterest Submission',
  'YouTube Submission',
  'Instagram Submission',
  'Off-page Blogs Posting',
  'Profile Creation',
  'Business Listing',
  'Blog Promotion',
  'Social Bookmarking',
  'Article Submission',
  'Classified Submission',
  'GMB Link Promotion',
  'PR Submission',
  'Micro Blogging',
  'Guest Posting',
];

// Preserved old categories
export const OLD_BACKLINK_CATEGORIES = [
  'Guest Post',
  'Directory & Citation',
  'Editorial Link',
  'Press Release',
  'Profile & Social',
  'Resource Link',
  'Forum & Community',
  'General Backlink',
];

// Combined canonical list of all backlink categories (new submission + preserved old)
export const BACKLINK_CATEGORIES = [
  ...SUBMISSION_CATEGORIES,
  ...OLD_BACKLINK_CATEGORIES,
];

export const BACKLINK_STATUSES = ['Live / Indexed', 'In Progress', 'Planned'];

export const DEFAULT_BACKLINKS = [
  {
    id: 'bl-1',
    sourceUrl: 'https://clutch.co/profile/boulder-decision',
    targetUrl: 'https://boulderdecisions.com/',
    anchorText: 'Boulder Decision Analytics',
    category: 'Business Listing',
    da: 88,
    status: 'Live / Indexed',
    date: '2026-10-18',
    notes: 'Verified corporate B2B directory listing with dofollow backlink',
  },
  {
    id: 'bl-2',
    sourceUrl: 'https://medium.com/@analytics/decision-models',
    targetUrl: 'https://boulderdecisions.com/blog',
    anchorText: 'executive decision framework',
    category: 'Guest Posting',
    da: 92,
    status: 'Live / Indexed',
    date: '2026-10-14',
    notes: 'Editorial link in 2,200-word enterprise analytics guide',
  },
  {
    id: 'bl-3',
    sourceUrl: 'https://reddit.com/r/analytics/comments/decision_frameworks',
    targetUrl: 'https://boulderdecisions.com/blog',
    anchorText: 'decision analytics guide',
    category: 'Reddit Submission',
    da: 91,
    status: 'Live / Indexed',
    date: '2026-10-12',
    notes: 'Helpful answer in community discussion thread with guide link',
  },
  {
    id: 'bl-4',
    sourceUrl: 'https://quora.com/What-is-the-best-decision-intelligence-playbook',
    targetUrl: 'https://boulderdecisions.com/services',
    anchorText: 'Boulder Decision framework',
    category: 'Quora Submission',
    da: 93,
    status: 'Live / Indexed',
    date: '2026-10-11',
    notes: 'Top-voted expert answer with verified brand attribution',
  },
  {
    id: 'bl-5',
    sourceUrl: 'https://businesswire.com/news/boulder-expansion',
    targetUrl: 'https://boulderdecisions.com/',
    anchorText: 'Boulder Decision',
    category: 'PR Submission',
    da: 90,
    status: 'Live / Indexed',
    date: '2026-10-10',
    notes: 'Q4 regional decision consulting services announcement',
  },
  {
    id: 'bl-6',
    sourceUrl: 'https://crunchbase.com/organization/boulder-decision',
    targetUrl: 'https://boulderdecisions.com/',
    anchorText: 'boulderdecisions.com',
    category: 'Profile Creation',
    da: 91,
    status: 'Live / Indexed',
    date: '2026-10-08',
    notes: 'Verified organization company profile citation',
  },
  {
    id: 'bl-7',
    sourceUrl: 'https://slideshare.net/boulder-decision-q3-playbook',
    targetUrl: 'https://boulderdecisions.com/blog',
    anchorText: 'Q3 Enterprise Decision Deck',
    category: 'PDF Submission',
    da: 86,
    status: 'Live / Indexed',
    date: '2026-10-05',
    notes: 'Executive presentation and whitepaper document upload',
  },
  {
    id: 'bl-8',
    sourceUrl: 'https://pinterest.com/pin/boulder-infographic',
    targetUrl: 'https://boulderdecisions.com/blog',
    anchorText: 'analytics model diagram',
    category: 'Pinterest Submission',
    da: 84,
    status: 'Live / Indexed',
    date: '2026-10-02',
    notes: 'Decision tree infographic visual pin placement',
  },
  {
    id: 'bl-9',
    sourceUrl: 'https://techbullion.com/data-analytics-leaders/',
    targetUrl: 'https://boulderdecisions.com/services',
    anchorText: 'decision intelligence consulting',
    category: 'Editorial Link',
    da: 64,
    status: 'In Progress',
    date: '2026-10-24',
    notes: 'Editorial placement in data intelligence industry roundup',
  },
  {
    id: 'bl-10',
    sourceUrl: 'https://youtube.com/watch?v=boulder-decision-framework',
    targetUrl: 'https://boulderdecisions.com/services',
    anchorText: 'Decision Analytics Engine',
    category: 'YouTube Submission',
    da: 98,
    status: 'Live / Indexed',
    date: '2026-10-01',
    notes: 'Video description link and pin comment',
  },
  {
    id: 'bl-11',
    sourceUrl: 'https://google.com/maps/place/Boulder+Decision',
    targetUrl: 'https://boulderdecisions.com/',
    anchorText: 'Boulder Decision Consulting',
    category: 'GMB Link Promotion',
    da: 95,
    status: 'Live / Indexed',
    date: '2026-09-28',
    notes: 'Google Business Profile primary website attribution',
  },
];

export function getStoredBacklinks() {
  if (typeof window === 'undefined') return DEFAULT_BACKLINKS;
  try {
    const raw = localStorage.getItem(BACKLINKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load backlinks from localStorage:', e);
  }
  return DEFAULT_BACKLINKS;
}

export function saveStoredBacklinks(backlinks) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BACKLINKS_STORAGE_KEY, JSON.stringify(backlinks));
    window.dispatchEvent(new CustomEvent('backlinks-updated', { detail: backlinks }));
  } catch (e) {
    console.warn('Failed to save backlinks to localStorage:', e);
  }
}

export function calculateBacklinkStats(backlinksList) {
  const items = Array.isArray(backlinksList) ? backlinksList : [];
  const total = items.length;
  const live = items.filter((b) => b.status === 'Live / Indexed').length;
  const inProgress = items.filter((b) => b.status === 'In Progress').length;
  const planned = items.filter((b) => b.status === 'Planned').length;

  const rankedDa = items.filter((b) => b.da !== null && b.da !== undefined && !isNaN(b.da));
  const avgDa = rankedDa.length
    ? (rankedDa.reduce((acc, b) => acc + Number(b.da), 0) / rankedDa.length).toFixed(1)
    : '—';

  const counts = {};
  items.forEach((b) => {
    const cat = b.category || 'General Backlink';
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const categoryCards = BACKLINK_CATEGORIES.map((cat) => ({
    name: cat,
    count: counts[cat] || 0,
  })).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });

  return {
    total,
    live,
    inProgress,
    planned,
    avgDa,
    counts,
    categoryCards,
  };
}
