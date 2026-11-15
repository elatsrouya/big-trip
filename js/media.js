// Live images and place info from other sites: Wikimedia Commons, Wikipedia, and Google (within quota).
import { GOOGLE_KEY } from './config.js';
import { take, can, googleOn, trip } from './quota.js';
import { PH } from './store.js';
import { loadGoogle } from './maps.js';

/* ---------- small cache (localStorage, with expiry) ---------- */
const mem = new Map();
function cget(k) { if (mem.has(k)) return mem.get(k); try { const v = JSON.parse(localStorage.getItem('bt-c:' + k)); if (v && v.t > Date.now()) { mem.set(k, v.v); return v.v; } } catch {} return undefined; }
function cset(k, v, days = 14) { mem.set(k, v); try { localStorage.setItem('bt-c:' + k, JSON.stringify({ t: Date.now() + days * 864e5, v })); } catch {} }
const inflight = new Map();
async function cached(k, fn, days) { const v = cget(k); if (v !== undefined) return v; if (inflight.has(k)) return inflight.get(k); const p = fn().then(r => { cset(k, r, days); inflight.delete(k); return r; }).catch(() => { inflight.delete(k); return null; }); inflight.set(k, p); return p; }

/* ---------- Wikimedia Commons ---------- */
export const commons = (file, w = 900) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${w}`;
export const commonsPage = file => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`;
export function placePhotos(p, w) {
  return (PH[p.id] || []).map(([f, a, l]) => ({ src: commons(f, w), credit: `© ${a} · ${l}`, href: commonsPage(f) }));
}

/* ---------- Wikipedia ---------- */
const big = (u, w = 900) => u ? u.replace(/\/(\d+)px-/, `/${w}px-`) : u;
export function wiki(title, lang = 'en') {
  return cached(`w:${lang}:${title}`, async () => {
    const r = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`);
    if (!r.ok) return null; const j = await r.json();
    return { title: j.title, text: j.extract, img: big(j.thumbnail?.source), url: j.content_urls?.mobile?.page, lat: j.coordinates?.lat, lon: j.coordinates?.lon };
  }, 30);
}
// Hebrew article for an English title, when one exists.
export function wikiHe(enTitle) {
  return cached(`whe:${enTitle}`, async () => {
    const r = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=langlinks&lllang=he&titles=${encodeURIComponent(enTitle)}`);
    const j = await r.json(); const pg = Object.values(j.query?.pages || {})[0];
    const he = pg?.langlinks?.[0]?.['*']; return he ? await wiki(he, 'he') : null;
  }, 30);
}
// Notable places near a point, each with a photo.
export function nearby(lat, lon, radius = 10000, limit = 40) {
  return cached(`nb:${lat.toFixed(2)},${lon.toFixed(2)},${radius}`, async () => {
    const u = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=geosearch&ggscoord=${lat}|${lon}&ggsradius=${radius}&ggslimit=${limit}&prop=pageimages|coordinates|description&piprop=thumbnail&pithumbsize=800&pilicense=any`;
    const j = await (await fetch(u)).json();
    return Object.values(j.query?.pages || {}).filter(p => p.thumbnail && !/^(List|Districts?|Template)/.test(p.title))
      .map(p => ({ id: 'w' + p.pageid, title: p.title, desc: p.description || '', img: p.thumbnail.source, lat: p.coordinates?.[0]?.lat, lon: p.coordinates?.[0]?.lon, url: `https://en.m.wikipedia.org/?curid=${p.pageid}` }));
  }, 30);
}

/* ---------- Google Places (counted) ---------- */
export const hasGoogle = () => googleOn();
export async function gSearch(query, lat, lon, max = 12) {
  const k = `gs:${query}`;
  const hit = cget(k); if (hit !== undefined) return hit;
  if (!take('search')) return null;
  try {
    const gm = await loadGoogle(); const { Place } = await gm.importLibrary('places');
    const { places } = await Place.searchByText({
      textQuery: query, fields: ['id', 'displayName', 'location', 'photos', 'formattedAddress', 'googleMapsURI'],
      maxResultCount: max, language: 'iw', ...(lat != null ? { locationBias: { lat, lng: lon } } : {}),
    });
    // Keep the photo objects in memory only; Google's terms do not allow storing them.
    const out = places.map(p => ({ id: p.id, title: p.displayName, addr: p.formattedAddress, lat: p.location?.lat(), lon: p.location?.lng(), url: p.googleMapsURI, _photos: p.photos || [] }));
    mem.set(k, out); return out;
  } catch (e) { if (/OVER_QUERY|BILLING|REQUEST_DENIED|quota/i.test(String(e))) trip(e); return null; }
}
export function gPhoto(item, i = 0, w = 900) {
  const ph = item?._photos?.[i]; if (!ph) return null;
  if (!take('photo')) return null;
  const a = ph.authorAttributions?.[0];
  return { src: ph.getURI({ maxWidth: w }), credit: a ? `© ${a.displayName} · Google` : 'Google', href: a?.uri };
}
export const canGooglePhoto = () => can('photo');

/* ---------- links & embeds ---------- */
export const gmaps = q => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
// The Maps Embed API is free with no usage limit, so it never touches the quota.
export function embedUrl(q, lat, lon) {
  if (GOOGLE_KEY && googleOn()) return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_KEY}&q=${encodeURIComponent(q)}&language=iw&zoom=12`;
  const d = .08; return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - d},${lat - d},${lon + d},${lat + d}&layer=mapnik&marker=${lat},${lon}`;
}
