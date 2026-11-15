import { DATA } from './data.js';

export const { C, P, EV, REC, CHECK, COST, INTL, HUB, PAID, RATES, PH, BLOCKED, STYLE_M, STYLE_T, REC_CAT } = DATA;
export const LAND = new Set(DATA.LAND);
export const PM = Object.fromEntries(P.map(p => [p.id, p]));
export const MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
export const MONTHS_S = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];

const KEY = 'bt-state-v2';
const DEF = { route: [], startDate: '', saved: 0, goal: 60000, style: 'mid', done: {}, likes: {}, attrOff: {}, fIn: '', fOut: '', extras: {} };
export let S = load();
function load() {
  try { return Object.assign(structuredClone(DEF), JSON.parse(localStorage.getItem(KEY)) || {}); }
  catch { return structuredClone(DEF); }
}
const subs = new Set();
export function onChange(f) { subs.add(f); return () => subs.delete(f); }
export function save(silent) {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {}
  if (!silent) subs.forEach(f => f());
}
export function replaceState(obj) { S = Object.assign(structuredClone(DEF), obj); save(); }

/* ---------- dates ---------- */
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const dstr = d => d.getDate() + '.' + (d.getMonth() + 1);
export const dlong = d => d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
export function startD() { return S.startDate ? new Date(S.startDate + 'T00:00:00') : null; }
export function daysLeft() { const s = startD(); if (!s) return null; const t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((s - t) / 864e5); }

/* ---------- route ---------- */
export function routeInfo() {
  let off = 0; const s = startD();
  return S.route.filter(r => PM[r.p]).map((r, i) => {
    const p = PM[r.p]; const a = s ? addDays(s, off) : null;
    const o = { ...r, i, place: p, off, arr: a, month: a ? a.getMonth() : null }; off += r.d; return o;
  });
}
export const totalDays = () => S.route.reduce((a, r) => a + r.d, 0);
export const routeCountries = () => [...new Set(S.route.filter(r => PM[r.p]).map(r => PM[r.p].c))];
export const inRoute = pid => S.route.some(r => r.p === pid);
export function addToRoute(pid, at) { const r = { p: pid, d: PM[pid].d }; if (at == null) S.route.push(r); else S.route.splice(at, 0, r); save(); }
export function removeStop(i) { S.route.splice(i, 1); save(); }
export function moveStop(from, to) { const [x] = S.route.splice(from, 1); S.route.splice(to, 0, x); save(); }
export function setDays(i, d) { S.route[i].d = Math.max(1, Math.min(90, d)); save(); }

export function currentStop(date = new Date()) {
  for (const r of routeInfo()) { if (!r.arr) return null; const end = addDays(r.arr, r.d); if (date >= r.arr && date < end) return r; }
  return null;
}
export function nextStop() {
  const ri = routeInfo(); if (!ri.length) return null;
  const now = new Date();
  if (!ri[0].arr || ri[0].arr > now) return ri[0];
  return ri.find(r => r.arr > now) || null;
}

export function dist(a, b) {
  const R = 6371, t = x => x * Math.PI / 180, dLa = t(b.lat - a.lat), dLo = t(b.lon - a.lon);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export function legs() {
  const ri = routeInfo(); const L = [];
  for (let i = 1; i < ri.length; i++) {
    const a = ri[i - 1].place, b = ri[i].place, km = Math.round(dist(a, b));
    const key = [a.c, b.c].sort().join('-');
    let mode = a.c === b.c ? (km < 1100 ? 'bus' : 'fly') : (LAND.has(key) && km < 900 ? 'bus' : 'fly');
    let usd; if (km < 5) { mode = 'bus'; usd = 0; } else if (mode === 'bus') usd = Math.max(5, km * .035) + (a.c !== b.c ? 10 : 0); else usd = 55 + km * .05;
    L.push({ a, b, km, mode, usd });
  }
  return L;
}

// Suggest an order: start from the first stop, then nearest neighbour, keeping countries together.
export function suggestOrder() {
  if (S.route.length < 3) return S.route.slice();
  const rest = S.route.slice(1), out = [S.route[0]];
  while (rest.length) {
    const cur = PM[out[out.length - 1].p];
    let best = 0, bs = Infinity;
    rest.forEach((r, i) => { const p = PM[r.p]; const s = dist(cur, p) * (p.c === cur.c ? .6 : 1); if (s < bs) { bs = s; best = i; } });
    out.push(rest.splice(best, 1)[0]);
  }
  return out;
}

export function warnings() {
  const w = []; const ri = routeInfo(); let i = 0;
  while (i < ri.length) {
    const c = ri[i].place.c; let d = 0, j = i; while (j < ri.length && ri[j].place.c === c) { d += ri[j].d; j++; }
    const lim = C[c].visaDays; if (lim && d > lim) w.push(`${C[c].n}: ${d} ימים ברצף, יותר מ־${lim} הימים שהוויזה מאפשרת.`); i = j;
  }
  if (S.startDate) ri.forEach(r => { if (C[r.place.c].s[r.month] === 0) w.push(`${r.place.n}: מגיעים ב${MONTHS[r.month]}, לא עונה מומלצת.`); });
  return w;
}

/* ---------- money ---------- */
export const ILS = () => RATES.usd.ils;
export const fmt = n => Math.round(n).toLocaleString('he-IL');
export function dayCost(c) { const k = COST[c], m = STYLE_M[S.style]; return { h: k[0] * m[0], f: k[1] * m[1], l: k[2] * m[2] }; }
function segments() { const ri = routeInfo(); const out = []; let i = 0; while (i < ri.length) { const c = ri[i].place.c; let d = 0, j = i; while (j < ri.length && ri[j].place.c === c) { d += ri[j].d; j++; } out.push({ c, d }); i = j; } return out; }
function visaUSD(c, d) { switch (c) { case 'th': return d > 30 ? 55 : 0; case 'la': return 40; case 'kh': return 30; case 'np': return d <= 15 ? 30 : d <= 30 ? 50 : 125; case 'in': return d <= 30 ? 25 : 80; case 'lk': return 50; case 'cn': return 60; default: return 0; } }

export const EXTRA_DEF = { insurance: 750, gear: 3500, vaccines: 1200, sim: 40 }; // insurance & sim per month, ₪
export function budget() {
  const ils = ILS(); const ri = routeInfo(); const per = {};
  ri.forEach(r => { const c = r.place.c, d = dayCost(c); const o = per[c] ||= { c, days: 0, h: 0, f: 0, l: 0, attr: 0, visa: 0 }; o.days += r.d; o.h += d.h * r.d; o.f += d.f * r.d; o.l += d.l * r.d; });
  const seen = new Set(); const attrs = [];
  ri.forEach(r => { if (seen.has(r.p)) return; seen.add(r.p); (PAID[r.p] || []).forEach((x, i) => { const on = !S.attrOff[r.p + '|' + i]; attrs.push({ pid: r.p, i, n: x[0], usd: x[1], on }); if (on) per[r.place.c].attr += x[1]; }); });
  segments().forEach(s => per[s.c].visa += visaUSD(s.c, s.d));
  const L = legs(); const legsILS = L.reduce((a, x) => a + x.usd, 0) * ils;
  const first = ri[0]?.place.c, last = ri[ri.length - 1]?.place.c;
  const inbound = first ? (+S.fIn || INTL[first]) : 0, outbound = last ? (+S.fOut || INTL[last]) : 0;
  const sum = k => Object.values(per).reduce((a, o) => a + o[k], 0) * ils;
  const months = Math.max(1, totalDays() / 30);
  const ex = { ...EXTRA_DEF, ...S.extras };
  const cats = {
    flights: { n: 'טיסות', icon: 'plane', v: inbound + outbound + legsILS, inbound, outbound, legs: L, legsILS },
    lodging: { n: 'לינה', icon: 'bed-double', v: sum('h') },
    food: { n: 'אוכל', icon: 'utensils', v: sum('f') },
    local: { n: 'תחבורה מקומית', icon: 'bus', v: sum('l') },
    attr: { n: 'אטרקציות', icon: 'ticket', v: sum('attr'), items: attrs },
    visa: { n: 'ויזות', icon: 'stamp', v: sum('visa') },
    insurance: { n: 'ביטוח נסיעות', icon: 'shield-check', v: totalDays() ? ex.insurance * months : 0 },
    gear: { n: 'ציוד', icon: 'backpack', v: ex.gear },
    health: { n: 'חיסונים ותרופות', icon: 'syringe', v: ex.vaccines },
    sim: { n: 'סים ואינטרנט', icon: 'smartphone', v: totalDays() ? ex.sim * months : 0 },
  };
  const total = Object.values(cats).reduce((a, c) => a + c.v, 0);
  return { per, cats, total, ils, months };
}
