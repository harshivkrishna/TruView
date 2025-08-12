// Utility to generate and store anonymous user IDs for consistent view tracking

const ANONYMOUS_ID_KEY = 'truview_anonymous_id';

export const getAnonymousId = (): string => {
  let anonymousId = localStorage.getItem(ANONYMOUS_ID_KEY);
  
  if (!anonymousId) {
    // Generate a new anonymous ID
    anonymousId = 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId);
  }
  
  return anonymousId;
};

export const clearAnonymousId = (): void => {
  localStorage.removeItem(ANONYMOUS_ID_KEY);
}; 