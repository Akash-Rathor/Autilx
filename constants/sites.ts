/**
 * Configurable list of website links shown as buttons on the home screen.
 * Add, remove, or edit entries to change the app's quick links.
 */
export type SiteEntry = {
  id: string;
  title: string;
  url: string;
};

export const SITES: SiteEntry[] = [
  { id: 'google', title: 'Google', url: 'https://www.google.com' },
  { id: 'google-analytics', title: 'Google Analytics', url: 'https://analytics.google.com' },
  { id: 'google-search-console', title: 'Google Search Console', url: 'https://search.google.com/search-console' },
  { id: 'google-trends', title: 'Google Trends', url: 'https://trends.google.com' },
  { id: 'google-adsense', title: 'Google AdSense', url: 'https://www.google.com/adsense' },
  { id: 'youtube', title: 'YouTube', url: 'https://www.youtube.com' }
];
