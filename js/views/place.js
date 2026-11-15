import { C, PM, REC, REC_CAT, EV, PAID, MONTHS, MONTHS_S, S, inRoute, addToRoute, save } from '../store.js';
import { esc, icon, ph, fillPh, sheet, paintIcons, toast, $, $$ , dot } from '../ui.js';
import { placePhotos, wikiHe, wiki, nearby, gSearch, gPhoto, embedUrl, gmaps, hasGoogle } from '../media.js';
import { go } from '../router.js';

export const placeQuery = p => `${p.en.replace(/_/g, ' ')}, ${C[p.c].geo.replace('Lao PDR', 'Laos')}`;

export function seasonBar(s, mark) {
  return `<div class="season" role="img" aria-label="עונות">${s.map((v, i) => `<span class="s${v}${i === mark ? ' now' : ''}" title="${MONTHS[i]}"><i></i><em>${MONTHS_S[i].replace('׳', '')}</em></span>`).join('')}</div>`;
}

export function openPlace(pid) {
  const p = PM[pid]; if (!p) return;
  const c = C[p.c]; const m = new Date().getMonth();
  const photos = placePhotos(p);
  const recs = REC.filter(r => r.p === pid);
  const evs = EV.filter(e => e.p === pid);
  const paid = PAID[pid] || [];
  const q = placeQuery(p);
  const body = sheet(`
    <div class="gal" id="pgal">${ph('', '4/3')}${photos.map(() => ph('', '4/3')).join('')}</div>
    <div class="row between" style="align-items:flex-start">
      <div class="grow"><h1 style="font-size:26px;margin:0;line-height:1.15">${esc(p.n)}</h1>
        <div class="muted small">${dot(c.col)} ${esc(c.n)} · ${esc(p.t)}</div></div>
    </div>
    <div class="row wrap" style="gap:6px;margin:12px 0">
      <span class="tag">${icon('calendar-days')} מומלץ ${p.d} ימים</span>
      <span class="tag ${['bad', 'warn', 'ok'][c.s[m]]}">עכשיו: ${['לא עונה', 'עונה סבירה', 'עונה מעולה'][c.s[m]]}</span>
    </div>
    <div class="row" style="gap:8px;margin-bottom:16px">
      <button class="btn grow" id="padd">${inRoute(pid) ? icon('check') + ' במסלול שלי' : icon('plus') + ' הוספה למסלול'}</button>
      <button class="btn sec icon" id="plike" aria-label="שמירה">${icon('heart')}</button>
      <a class="btn sec" href="${gmaps(q)}" target="_blank" rel="noopener">${icon('map')} גוגל מפות</a>
    </div>
    <p id="ptext" style="margin:0 0 6px">${esc(p.x)}</p>
    <div id="pwiki" dir="auto" class="small muted"></div>

    <h2>על המפה</h2>
    <iframe class="gframe" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${embedUrl(q, p.lat, p.lon)}" title="מפה של ${esc(p.n)}"></iframe>

    <h2>לא לפספס</h2>
    <div class="list" style="padding:0 16px">${p.h.map(x => `<div class="hl">${icon('sparkles')}<div class="grow">${esc(x)}</div><a class="btn ghost sm" href="${gmaps(x.split(':')[0].split('(')[0].trim() + ', ' + p.en.replace(/_/g, ' '))}" target="_blank" rel="noopener" aria-label="בגוגל מפות">${icon('map-pin')}</a></div>`).join('')}</div>

    ${recs.length ? `<h2>המלצות</h2><div class="stack">${recs.map(recCard).join('')}</div>` : ''}
    ${evs.length ? `<h2>אירועים</h2><div class="list">${evs.map(e => `<div class="li">${icon('party-popper')}<div class="grow"><b>${esc(e.n)}</b><div class="xs muted">${esc(e.w)} · ${esc(e.d)}</div></div></div>`).join('')}</div>` : ''}
    ${paid.length ? `<h2>כמה זה עולה</h2><div class="list">${paid.map(x => `<div class="li"><div class="grow">${esc(x[0])}</div><b class="num">$${x[1]}</b></div>`).join('')}</div>` : ''}

    <h2>עוד בסביבה</h2>
    <div class="hscroll" id="pnear"><div class="muted small">טוען…</div></div>

    <h2>${dot(c.col)} ${esc(c.n)}</h2>
    <div class="note small" style="margin-bottom:10px">${icon('stamp')} ${esc(c.visa)}</div>
    ${seasonBar(c.s, m)}
    <div class="xs muted" style="margin-top:6px">${esc(c.sn)}</div>
    <button class="btn sec block" style="margin-top:14px" id="pcountry">כל המידע על ${esc(c.n)}</button>
  `);
  paintIcons(body);
  // gallery: Google photo first (counted), then Commons photos
  const slots = $$('#pgal .ph', body);
  photos.forEach((im, i) => fillPh(slots[i + 1], im));
  (async () => {
    let g = null;
    if (hasGoogle()) { const r = await gSearch(q, p.lat, p.lon, 1); if (r?.[0]) g = gPhoto(r[0]); }
    if (!g) { const w = await wiki(p.en); if (w?.img) g = { src: w.img, credit: 'Wikipedia', href: w.url }; }
    fillPh(slots[0], g); if (!g && photos.length) slots[0].remove();
  })();
  wikiHe(p.en).then(w => { if (w?.text) $('#pwiki', body).innerHTML = `${esc(w.text.slice(0, 420))}${w.text.length > 420 ? '…' : ''} <a href="${w.url}" target="_blank" rel="noopener">ויקיפדיה</a>`; });
  nearby(p.lat, p.lon, 10000, 30).then(list => {
    const el = $('#pnear', body); if (!el) return;
    if (!list?.length) { el.innerHTML = '<div class="muted small">לא נמצאו מקומות בסביבה</div>'; return; }
    el.innerHTML = list.slice(0, 14).map((x, i) => `<a class="pcard" href="${x.url}" target="_blank" rel="noopener" style="width:46%">${ph('', '1/1')}<h3 class="small" style="margin-top:6px">${esc(x.title)}</h3><div class="xs muted">${esc(x.desc)}</div></a>`).join('');
    $$('.ph', el).forEach((s, i) => fillPh(s, { src: list[i].img }));
  });
  $('#padd', body).onclick = () => { if (!inRoute(pid)) { addToRoute(pid); toast(`${p.n} נוסף למסלול`); } $('#padd', body).innerHTML = icon('check') + ' במסלול שלי'; paintIcons($('#padd', body)); };
  const like = $('#plike', body); const sync = () => like.classList.toggle('liked', !!S.likes['p:' + pid]); sync();
  like.onclick = () => { if (S.likes['p:' + pid]) delete S.likes['p:' + pid]; else S.likes['p:' + pid] = Date.now(); save(); sync(); toast(S.likes['p:' + pid] ? 'נשמר' : 'הוסר מהשמורים'); };
  $('#pcountry', body).onclick = () => go('countries/' + p.c);
}

export function recCard(r) {
  const cat = REC_CAT[r.k] || ['', ''];
  const p = r.p ? PM[r.p] : null;
  return `<div class="card flat"><div class="row between"><span class="tag acc">${esc(cat[1])}</span>${p ? `<span class="xs muted">${esc(p.n)}</span>` : ''}</div>
    <h3 style="margin-top:8px">${esc(r.t)}</h3><div class="small muted">${esc(r.x)}</div>
    <div class="row wrap" style="gap:12px;margin-top:8px">${p ? `<a class="small" href="${gmaps(r.t.split(':')[0] + ', ' + p.en.replace(/_/g, ' '))}" target="_blank" rel="noopener">בגוגל מפות</a>` : ''}${r.u ? `<a class="small" href="${r.u}" target="_blank" rel="noopener">לפוסט של מזרחניק (${esc(r.d)})</a>` : ''}</div></div>`;
}
