/**
 * SEO Activities Categories and Shared Data Model
 */

export const ACTIVITIES_STORAGE_KEY = 'boulder_custom_seo_activities';

// 21 User-requested off-page submission categories + 8 Preserved Core SEO Categories
export const ACTIVITY_CATEGORIES = [
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
  // Preserved Core SEO Categories
  'On-Page SEO',
  'Technical SEO',
  'Content & Blog',
  'Local SEO',
  'Link Building',
  'Conversion & UX',
  'Keyword Strategy',
  'General SEO',
];

export const INITIAL_ACTIVITIES = [
  {
    id: 'act-1',
    title: 'Migrated Search Console property to https://boulderdecisions.com/ and audited indexing',
    category: 'Technical SEO',
    status: 'Completed',
    priority: 'High',
    date: '2026-10-21',
    targetUrl: 'https://boulderdecisions.com/',
    notes: 'Configured verified domain property, validated sitemaps, and verified clean crawl indexation.',
  },
  {
    id: 'act-2',
    title: 'Updated title tags and meta descriptions for core analytics & decision consulting pages',
    category: 'On-Page SEO',
    status: 'Completed',
    priority: 'High',
    date: '2026-10-18',
    targetUrl: 'https://boulderdecisions.com/',
    notes: 'Integrated target terms into H1 and meta title tags based on verified Search Console queries.',
  },
  {
    id: 'act-3',
    title: 'Implemented dynamic Brand vs Non-Brand keyword classification engine',
    category: 'On-Page SEO',
    status: 'Completed',
    priority: 'Medium',
    date: '2026-10-15',
    targetUrl: 'https://boulderdecisions.com/',
    notes: 'Segmented search queries to isolate brand query performance from organic discovery traffic.',
  },
  {
    id: 'act-4',
    title: 'Core Web Vitals mobile performance optimization (LCP & CLS review)',
    category: 'Technical SEO',
    status: 'In Progress',
    priority: 'High',
    date: '2026-10-22',
    targetUrl: 'https://boulderdecisions.com/',
    notes: 'Auditing third-party scripts, lazy loading assets, and optimizing delivery formats across mobile layouts.',
  },
  {
    id: 'act-5',
    title: 'Local SEO citation sync and Google Business Profile update',
    category: 'Local SEO',
    status: 'Planned',
    priority: 'Medium',
    date: '2026-10-25',
    targetUrl: 'https://boulderdecisions.com/',
    notes: 'Synchronizing NAP (Name, Address, Phone) consistency across local business directories.',
  },
  {
    id: 'act-6',
    title: 'Reddit community thread discussion and resource citation',
    category: 'Reddit Submission',
    status: 'Completed',
    priority: 'Medium',
    date: '2026-10-12',
    targetUrl: 'https://boulderdecisions.com/blog',
    notes: 'Answered analytics query with reference to decision models guide.',
  },
  {
    id: 'act-7',
    title: 'Quora authoritative answer on decision intelligence framework',
    category: 'Quora Submission',
    status: 'Completed',
    priority: 'High',
    date: '2026-10-11',
    targetUrl: 'https://boulderdecisions.com/services',
    notes: 'Verified expert answer citing Boulder Decision consulting playbook.',
  },
  {
    id: 'act-8',
    title: 'Profile creation and NAP citation on enterprise tech directories',
    category: 'Profile Creation',
    status: 'Completed',
    priority: 'Medium',
    date: '2026-10-08',
    targetUrl: 'https://boulderdecisions.com/',
    notes: 'Created and verified corporate organization profile.',
  },
  {
    id: 'act-9',
    title: 'Executive presentation deck and PDF whitepaper distribution',
    category: 'PDF Submission',
    status: 'Completed',
    priority: 'Medium',
    date: '2026-10-05',
    targetUrl: 'https://boulderdecisions.com/blog',
    notes: 'Published downloadable slide deck on document sharing hubs.',
  },
  {
    id: 'act-10',
    title: 'Decision intelligence infographic visual pin distribution',
    category: 'Pinterest Submission',
    status: 'Completed',
    priority: 'Low',
    date: '2026-10-02',
    targetUrl: 'https://boulderdecisions.com/blog',
    notes: 'Shared high-res decision framework model pin on Pinterest.',
  },
];

export function getStoredActivities() {
  if (typeof window === 'undefined') return INITIAL_ACTIVITIES;
  try {
    const raw = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(parsed.map((a) => a.id));
        const missing = INITIAL_ACTIVITIES.filter((a) => !existingIds.has(a.id));
        return [...parsed, ...missing];
      }
    }
  } catch (e) {
    console.warn('Failed to load activities from localStorage:', e);
  }
  return INITIAL_ACTIVITIES;
}

export function saveStoredActivities(activities) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities));
    window.dispatchEvent(new CustomEvent('activities-updated', { detail: activities }));
  } catch (e) {
    console.warn('Failed to save activities to localStorage:', e);
  }
}

export function calculateActivityStats(activitiesList) {
  const items = Array.isArray(activitiesList) ? activitiesList : [];
  const total = items.length;
  const completed = items.filter((a) => a.status === 'Completed').length;
  const inProgress = items.filter((a) => a.status === 'In Progress').length;
  const planned = items.filter((a) => a.status === 'Planned').length;

  const counts = {};
  items.forEach((a) => {
    const cat = a.category || 'General SEO';
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const categoryCards = ACTIVITY_CATEGORIES.map((cat) => ({
    name: cat,
    count: counts[cat] || 0,
  })).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });

  return {
    total,
    completed,
    inProgress,
    planned,
    counts,
    categoryCards,
  };
}
