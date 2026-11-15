// Google Maps Platform key. Locked in Google Cloud to this site's address and to 3 APIs
// (Maps JavaScript, Places (New), Maps Embed). Empty = the app runs on free sources only.
export const GOOGLE_KEY = '';

// Per-device limits, set well under Google's free monthly caps so two devices together stay free.
// Free caps (Nov 2026): map loads 10,000 · Place Details Pro 5,000 · Text Search Pro 5,000 · Place Photos 1,000.
export const LIMITS = {
  map:    { day: 60,  month: 1500 },
  details:{ day: 40,  month: 900 },
  search: { day: 30,  month: 700 },
  photo:  { day: 15,  month: 400 },
};

// Google's free monthly caps per SKU (Nov 2026 pricing), shown on the usage screen.
export const FREE = { map: 10000, details: 5000, search: 5000, photo: 1000 };

export const SITE_NAME = 'הטיול הגדול';
