// Client-side guard for Google Maps Platform usage. Every Google call asks take(sku) first;
// when a daily or monthly limit is reached the app falls back to free sources.
import { GOOGLE_KEY, LIMITS } from './config.js';

const K = 'bt-quota-v1';
const today = () => new Date().toISOString().slice(0, 10);
const month = () => today().slice(0, 7);

function read() {
  let q;
  try { q = JSON.parse(localStorage.getItem(K)) || {}; } catch { q = {}; }
  if (q.day !== today()) { q.day = today(); q.d = {}; }
  if (q.month !== month()) { q.month = month(); q.m = {}; }
  q.d ||= {}; q.m ||= {};
  return q;
}
function write(q) { try { localStorage.setItem(K, JSON.stringify(q)); } catch {} }

export function googleOn() {
  if (!GOOGLE_KEY) return false;
  const q = read();
  return !(q.offUntil && Date.now() < q.offUntil);
}

export function can(sku, n = 1) {
  if (!googleOn()) return false;
  const q = read(), L = LIMITS[sku];
  return (q.d[sku] || 0) + n <= L.day && (q.m[sku] || 0) + n <= L.month;
}

export function take(sku, n = 1) {
  if (!can(sku, n)) return false;
  const q = read();
  q.d[sku] = (q.d[sku] || 0) + n;
  q.m[sku] = (q.m[sku] || 0) + n;
  write(q);
  return true;
}

// Any sign of a billing/quota problem from Google turns Google off on this device for a day.
export function trip(reason) {
  const q = read();
  q.offUntil = Date.now() + 24 * 3600e3;
  q.offReason = String(reason || '').slice(0, 120);
  write(q);
}

export function usage() {
  const q = read();
  return Object.keys(LIMITS).map(k => ({ sku: k, day: q.d[k] || 0, month: q.m[k] || 0 }));
}
export function offInfo() { const q = read(); return q.offUntil && Date.now() < q.offUntil ? q.offReason || 'off' : null; }
