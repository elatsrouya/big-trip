import { S, save, C, P, PM, REC, routeInfo, totalDays, routeCountries, legs, setDays, removeStop, moveStop, suggestOrder, addToRoute, inRoute, dstr, fmt, ILS, warnings, onChange } from '../store.js';
import { esc, icon, ph, fillPh, paintIcons, sheet, closeSheet, toast, $, $$ , dot } from '../ui.js';
import { createMap } from '../maps.js';
import { placePhotos, wiki } from '../media.js';
import { openPlace } from './place.js';

let mode = sessionStorage.getItem('bt-rmode') || 'mine';
let editing = false;

export function routeView(el) {
  let map = null, alive = true;
  const draw = () => {
    const ri = routeInfo(), td = totalDays(), cs = routeCountries(), L = legs(), w = warnings();
    const end = ri.length && ri[0].arr ? ri[ri.length - 1].arr : null;
    el.innerHTML = `<div class="view">
      <div class="vh"><div><h1>המסלול</h1><div class="sub">${ri.length ? `${td} ימים · ${cs.length} מדינות${ri[0].arr ? ` · ${dstr(ri[0].arr)}–${dstr(new Date(end.getTime() + ri[ri.length - 1].d * 864e5))}` : ''}` : 'עוד אין יעדים'}</div></div>
        <button class="btn sm" id="radd">${icon('plus')} יעד</button></div>
      <div class="seg" style="margin-bottom:12px"><button data-m="mine" class="${mode === 'mine' ? 'on' : ''}">המסלול שלי</button><button data-m="all" class="${mode === 'all' ? 'on' : ''}">כל היעדים וההמלצות</button></div>
      <div class="mapwrap"><div class="map" id="rmap"></div><div class="src" id="rsrc"></div></div>

      <div class="row between" style="margin:24px 0 12px"><h2 style="margin:0">${editing ? 'סידור המסלול' : 'פירוט המסלול'}</h2>
        ${ri.length > 1 ? (editing ? `<div class="row" style="gap:6px"><button class="btn sec sm" id="rsug">${icon('wand-sparkles')} הצעת סדר</button><button class="btn sm" id="redit">סיום</button></div>`
          : `<button class="btn sec sm" id="redit">${icon('arrow-up-down')} סידור</button>`) : ''}</div>
      ${editing ? '<div class="note small" style="margin-bottom:10px">גוררים את היעדים מהידית, או משתמשים בחיצים. "הצעת סדר" מסדרת לפי מרחקים ומשאירה את היעד הראשון במקומו.</div>' : ''}
      ${ri.length ? `<div class="list" id="rlist">${ri.map((r, i) => stopRow(r, i, L[i - 1])).join('')}</div>` : `<div class="card empty">${icon('map-pin-plus')}<p>מוסיפים יעדים מהמפה, מדף "גלה" או מהכפתור למעלה</p><button class="btn" id="radd2">הוספת יעד</button></div>`}
      ${L.length ? `<div class="note small" style="margin-top:10px">${icon('route')} תחבורה בין היעדים: כ־₪${fmt(L.reduce((a, x) => a + x.usd, 0) * ILS())} (הערכה)</div>` : ''}
      ${w.length ? `<div class="stack" style="margin-top:12px">${w.map(x => `<div class="note warn small">${esc(x)}</div>`).join('')}</div>` : ''}
    </div>`;
    paintIcons(el);
    $$('.seg button', el).forEach(b => b.onclick = () => { mode = b.dataset.m; sessionStorage.setItem('bt-rmode', mode); draw(); });
    $('#radd', el).onclick = picker; $('#radd2', el) && ($('#radd2', el).onclick = picker);
    $('#redit', el) && ($('#redit', el).onclick = () => { editing = !editing; draw(); });
    $('#rsug', el) && ($('#rsug', el).onclick = () => { S.route = suggestOrder(); save(); toast('הסדר עודכן לפי מרחקים'); });
    $$('.stop', el).forEach(row => {
      const i = +row.dataset.i;
      row.querySelector('[data-open]')?.addEventListener('click', () => openPlace(row.dataset.p));
      row.querySelector('.dminus')?.addEventListener('click', () => setDays(i, S.route[i].d - 1));
      row.querySelector('.dplus')?.addEventListener('click', () => setDays(i, S.route[i].d + 1));
      row.querySelector('.up')?.addEventListener('click', () => i > 0 && moveStop(i, i - 1));
      row.querySelector('.down')?.addEventListener('click', () => i < S.route.length - 1 && moveStop(i, i + 1));
      row.querySelector('.rm')?.addEventListener('click', () => { const n = PM[S.route[i].p].n; removeStop(i); toast(`${n} הוסר מהמסלול`); });
      const im = placePhotos(PM[row.dataset.p], 200)[0];
      if (im) fillPh(row.querySelector('.ph'), { src: im.src }); else wiki(PM[row.dataset.p].en).then(w => fillPh(row.querySelector('.ph'), w?.img ? { src: w.img } : null));
    });
    if (editing) enableDrag($('#rlist', el));
    drawMap();
  };
  async function drawMap() {
    const box = $('#rmap', el); if (!box) return;
    map?.remove?.(); try { map = await createMap(box, { center: [18, 100], zoom: 4 }); } catch { box.innerHTML = '<div class="empty" style="padding-top:30%">המפה לא נטענה. כדאי לבדוק את החיבור לאינטרנט.</div>'; return; } if (!alive) { map.remove(); return; }
    $('#rsrc', el).textContent = map.source;
    const ri = routeInfo(); const pts = [];
    if (mode === 'all') {
      const recBy = {}; REC.forEach(r => { if (r.p) (recBy[r.p] ||= []).push(r); });
      P.forEach(p => {
        const n = recBy[p.id]?.length || 0; const on = inRoute(p.id);
        const d = document.createElement('div'); d.className = 'pin' + (n || on ? '' : ' dot'); d.style.background = C[p.c].col; d.title = p.n;
        if (n || on) d.textContent = n || '';
        if (on) d.style.outline = '3px solid var(--ink)';
        map.marker(p.lat, p.lon, d, () => openPlace(p.id)); pts.push([p.lat, p.lon]);
      });
    } else {
      ri.forEach((r, i) => { const d = document.createElement('div'); d.className = 'pin'; d.style.background = C[r.place.c].col; d.textContent = i + 1; d.title = r.place.n; map.marker(r.place.lat, r.place.lon, d, () => openPlace(r.place.id)); pts.push([r.place.lat, r.place.lon]); });
      if (pts.length > 1) map.line(pts, getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#0d7a64');
    }
    if (pts.length) map.fit(pts, mode === 'all' ? 6 : 7);
  }
  draw();
  const off = onChange(draw);
  return () => { alive = false; off(); map?.remove?.(); };
}

function stopRow(r, i, leg) {
  const c = C[r.place.c]; const sc = r.month != null ? c.s[r.month] : null;
  return `${leg ? `<div class="leg">${icon(leg.mode === 'fly' ? 'plane' : 'bus', 'sm')} ${leg.mode === 'fly' ? 'טיסה' : 'נסיעה'} · ${fmt(leg.km)} ק"מ · כ־₪${fmt(leg.usd * ILS())}</div>` : ''}
  <div class="stop" data-i="${i}" data-p="${r.p}">
    ${editing ? `<span class="handle" aria-label="גרירה">${icon('grip-vertical')}</span>` : `<span class="n" style="background:${c.col}">${i + 1}</span>`}
    ${ph('th', '1/1')}
    <div class="grow" data-open style="cursor:pointer"><b>${esc(r.place.n)}</b>
      <div class="xs muted">${dot(c.col)} ${esc(c.n)}${r.arr ? ' · ' + dstr(r.arr) : ''}${sc != null ? ` · <span class="s${sc}t">${['לא עונה', 'עונה סבירה', 'עונה מעולה'][sc]}</span>` : ''}</div></div>
    ${editing ? `<div class="dd"><button class="up" aria-label="למעלה">${icon('chevron-up')}</button><button class="down" aria-label="למטה">${icon('chevron-down')}</button><button class="rm" aria-label="הסרה">${icon('trash-2')}</button></div>`
      : `<div class="dd"><button class="dplus" aria-label="יום נוסף">${icon('plus')}</button><b class="num" style="min-width:22px;text-align:center">${r.d}</b><button class="dminus" aria-label="יום פחות">${icon('minus')}</button></div>`}
  </div>`;
}

function enableDrag(list) {
  if (!list) return;
  $$('.handle', list).forEach(h => h.addEventListener('pointerdown', e => {
    const row = h.closest('.stop'); const from = +row.dataset.i; let to = from;
    const rows = $$('.stop', list); const rects = rows.map(r => r.getBoundingClientRect()); const y0 = e.clientY;
    h.setPointerCapture(e.pointerId); row.classList.add('dragging');
    const move = ev => {
      const dy = ev.clientY - y0; row.style.transform = `translateY(${dy}px) scale(1.02)`;
      const mid = rects[from].top + rects[from].height / 2 + dy;
      to = rects.findIndex(r => mid < r.top + r.height / 2); if (to < 0) to = rects.length - 1; else if (to > from) to = Math.max(from, to - 1);
      rows.forEach((r, k) => { if (r === row) return; const shift = from < to && k > from && k <= to ? -rects[from].height : from > to && k >= to && k < from ? rects[from].height : 0; r.style.transition = 'transform .2s var(--ease-out)'; r.style.transform = shift ? `translateY(${shift}px)` : ''; });
    };
    const up = () => { h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up); rows.forEach(r => { r.style.transform = ''; r.style.transition = ''; }); row.classList.remove('dragging'); if (to !== from) moveStop(from, to); };
    h.addEventListener('pointermove', move); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
  }));
}

export function picker() {
  let cf = '', q = '';
  const body = sheet(`<h2 style="margin-top:4px">הוספת יעד</h2>
    <input id="pq" type="search" placeholder="חיפוש יעד" autocomplete="off">
    <div class="chips" style="margin-top:10px" id="pc"><button class="chip on" data-c="">הכול</button>${Object.entries(C).map(([k, c]) => `<button class="chip" data-c="${k}">${dot(c.col)} ${esc(c.n)}</button>`).join('')}</div>
    <div class="list" id="pl" style="margin-top:10px"></div>`);
  const list = () => {
    const items = P.filter(p => (!cf || p.c === cf) && (!q || (p.n + ' ' + p.en + ' ' + p.t).toLowerCase().includes(q)));
    $('#pl', body).innerHTML = items.map(p => `<div class="li" data-p="${p.id}"><div class="grow"><b>${esc(p.n)}</b><div class="xs muted">${dot(C[p.c].col)} ${esc(C[p.c].n)} · ${esc(p.t)}</div></div>
      <button class="btn sm ${inRoute(p.id) ? 'sec' : ''}" data-add="${p.id}">${inRoute(p.id) ? 'שוב' : 'הוספה'}</button></div>`).join('') || '<div class="empty">לא נמצא</div>';
    $$('[data-add]', body).forEach(b => b.onclick = e => { e.stopPropagation(); addToRoute(b.dataset.add); toast(`${PM[b.dataset.add].n} נוסף למסלול`); list(); });
    $$('.li[data-p]', body).forEach(r => r.onclick = () => { closeSheet(); setTimeout(() => openPlace(r.dataset.p), 350); });
  };
  $('#pq', body).oninput = e => { q = e.target.value.trim().toLowerCase(); list(); };
  $$('#pc .chip', body).forEach(b => b.onclick = () => { cf = b.dataset.c; $$('#pc .chip', body).forEach(x => x.classList.toggle('on', x === b)); list(); });
  list();
}
