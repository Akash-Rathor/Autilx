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
  { id: 'github', title: 'GitHub', url: 'https://github.com' },
  { id: 'youtube', title: 'YouTube', url: 'https://www.youtube.com' },
  { id: 'twitter', title: 'X (Twitter)', url: 'https://x.com' },
  { id: 'wikipedia', title: 'Wikipedia', url: 'https://www.wikipedia.org' },
];
