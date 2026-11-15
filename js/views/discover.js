import { S, save, C, P, PM, REC, REC_CAT, inRoute, addToRoute, dist } from '../store.js';
import { esc, icon, ph, fillPh, paintIcons, sheet, toast, $, $$ , dot } from '../ui.js';
import { placePhotos, wiki, nearby, gSearch, gPhoto, gmaps, hasGoogle, canGooglePhoto } from '../media.js';
import { createMap } from '../maps.js';
import { openPlace, recCard, placeQuery } from './place.js';
import { go } from '../router.js';

export const CATS = [
  { k: 'all', n: 'הכול', i: 'layout-grid' },
  { k: 'see', n: 'אטרקציות', i: 'landmark', g: 'top tourist attractions in', wiki: true, rec: ['exp'] },
  { k: 'view', n: 'נופים', i: 'mountain', g: 'scenic viewpoint in' },
  { k: 'trek', n: 'טרקים', i: 'footprints', g: 'hiking trail near' },
  { k: 'food', n: 'אוכל', i: 'utensils', g: 'best local food restaurant in', rec: ['food'] },
  { k: 'stay', n: 'הוסטלים', i: 'bed-double', g: 'backpacker hostel in' },
  { k: 'night', n: 'חיי לילה', i: 'moon', g: 'bars nightlife in', rec: ['party'] },
  { k: 'gem', n: 'פנינות וטיפים', i: 'gem', rec: ['gem', 'tip', 'mz'] },
];
let st = { c: '', p: '', cat: 'all', view: 'list' };
try { Object.assign(st, JSON.parse(sessionStorage.getItem('bt-disc')) || {}); } catch {}
const keep = () => sessionStorage.setItem('bt-disc', JSON.stringify(st));

export function discover(el) {
  let map = null, alive = true;
  const draw = () => {
    const places = P.filter(p => !st.c || p.c === st.c);
    el.innerHTML = `<div class="view">
      <div class="vh"><div><h1>גלה</h1><div class="sub">יעדים, אטרקציות, אוכל ולינה</div></div>
        <button class="btn sm" id="dfeed">${icon('smartphone')} מצב גלילה</button></div>
      <div class="chips" id="dc"><button class="chip ${!st.c ? 'on' : ''}" data-c="">כל המדינות</button>${Object.entries(C).map(([k, c]) => `<button class="chip ${st.c === k ? 'on' : ''}" data-c="${k}">${dot(c.col)} ${esc(c.n)}</button>`).join('')}</div>
      <div class="row" style="margin-top:10px;gap:8px">
        <select id="dp" class="grow" aria-label="יעד"><option value="">כל היעדים${st.c ? ' ב' + esc(C[st.c].n) : ''}</option>${places.map(p => `<option value="${p.id}" ${st.p === p.id ? 'selected' : ''}>${esc(p.n)}</option>`).join('')}</select>
        <div class="seg" style="flex:none"><button data-v="list" class="${st.view === 'list' ? 'on' : ''}" aria-label="רשימה">${icon('list')}</button><button data-v="map" class="${st.view === 'map' ? 'on' : ''}" aria-label="מפה">${icon('map')}</button></div>
      </div>
      <div class="chips" id="dk" style="margin-top:10px">${CATS.map(c => `<button class="chip ${st.cat === c.k ? 'on' : ''}" data-k="${c.k}">${icon(c.i)} ${c.n}</button>`).join('')}</div>
      ${st.view === 'map' ? `<div class="mapwrap" style="margin-top:12px"><div class="map" id="dmap"></div><div class="src" id="dsrc"></div></div>` : ''}
      <div id="dres" style="margin-top:8px"></div>
    </div>`;
    paintIcons(el);
    $('#dfeed', el).onclick = () => go('feed');
    $$('#dc .chip', el).forEach(b => b.onclick = () => { st.c = b.dataset.c; st.p = ''; keep(); draw(); });
    $$('#dk .chip', el).forEach(b => b.onclick = () => { st.cat = b.dataset.k; keep(); draw(); });
    $$('[data-v]', el).forEach(b => b.onclick = () => { st.view = b.dataset.v; keep(); draw(); });
    $('#dp', el).onchange = e => { st.p = e.target.value; if (st.p) st.c = PM[st.p].c; keep(); draw(); };
    results($('#dres', el));
  };

  async function results(box) {
    const pts = []; // for the map: {lat,lon,label,onClick,col}
    const sections = [];
    if (!st.p) {
      // no specific destination: destination cards + curated recommendations
      const places = P.filter(p => !st.c || p.c === st.c);
      if (st.cat === 'all') sections.push({ h: st.c ? `יעדים ב${C[st.c].n}` : 'יעדים', html: `<div class="grid2">${places.map(placeCard).join('')}</div>` });
      places.forEach(p => pts.push({ lat: p.lat, lon: p.lon, label: p.n, col: C[p.c].col, on: () => openPlace(p.id) }));
      const cat = CATS.find(c => c.k === st.cat);
      const recs = REC.filter(r => (!st.c || r.c === st.c) && (st.cat === 'all' || cat.rec?.includes(r.k)));
      if (st.cat === 'see') sections.push({ h: 'לא לפספס', html: `<div class="stack">${places.flatMap(p => p.h.map(h => `<div class="card flat"><div class="xs muted">${dot(C[p.c].col)} ${esc(p.n)}</div><h3 style="margin-top:4px">${esc(h)}</h3><a class="small" href="${gmaps(h.split(':')[0] + ', ' + p.en.replace(/_/g, ' '))}" target="_blank" rel="noopener">בגוגל מפות</a></div>`)).join('')}</div>` });
      if (recs.length) sections.push({ h: 'המלצות', html: `<div class="stack">${recs.map(recCard).join('')}</div>` });
      if (!recs.length && st.cat !== 'all' && st.cat !== 'see') sections.push({ h: '', html: `<div class="card empty">בוחרים יעד למעלה כדי לראות ${esc(cat.n)} חיים מגוגל ומוויקיפדיה.</div>` });
      box.innerHTML = sections.map(s => `${s.h ? `<h2>${esc(s.h)}</h2>` : ''}${s.html}`).join('');
      paintIcons(box); fillCards(box);
    } else {
      const p = PM[st.p];
      box.innerHTML = `<div class="card next" id="dplace" style="margin-top:12px">${ph('', '1/1')}<div class="grow"><div class="xs muted">${dot(C[p.c].col)} ${esc(C[p.c].n)}</div><h3 style="font-size:19px">${esc(p.n)}</h3><div class="small muted">${esc(p.t)}</div></div>${icon('chevron-left', 'chev')}</div><div id="dsecs"></div>`;
      paintIcons(box); fillPhFor($('#dplace .ph', box), p); $('#dplace', box).onclick = () => openPlace(p.id);
      const secs = $('#dsecs', box);
      const cats = st.cat === 'all' ? CATS.slice(1) : [CATS.find(c => c.k === st.cat)];
      for (const cat of cats) {
        const s = document.createElement('section'); s.innerHTML = `<h2>${icon(cat.i)} ${cat.n}</h2><div class="sc"><div class="muted small">טוען…</div></div>`; secs.appendChild(s); paintIcons(s);
        const out = $('.sc', s); const parts = [];
        const recs = REC.filter(r => r.p === p.id && cat.rec?.includes(r.k)); if (recs.length) parts.push(`<div class="stack">${recs.map(recCard).join('')}</div>`);
        if (cat.k === 'see') parts.push(`<div class="list" style="padding:0 16px;margin-top:10px">${p.h.map(h => `<div class="hl">${icon('sparkles')}<div class="grow">${esc(h)}</div><a class="btn ghost sm" href="${gmaps(h.split(':')[0] + ', ' + p.en.replace(/_/g, ' '))}" target="_blank" rel="noopener" aria-label="בגוגל מפות">${icon('map-pin')}</a></div>`).join('')}</div>`);
        let live = [];
        if (cat.wiki || cat.k === 'view') { const nb = await nearby(p.lat, p.lon, 15000, 40); if (nb) live = live.concat(nb.filter(x => cat.k !== 'view' || /mountain|lake|waterfall|beach|bay|cave|hill|river|island|park|valley|falls|peak|canyon/i.test(x.desc + ' ' + x.title)).map(x => ({ ...x, src: 'wiki' }))); }
        if (cat.g && hasGoogle()) { const g = await gSearch(`${cat.g} ${placeQuery(p)}`, p.lat, p.lon, 12); if (g) live = g.map(x => ({ ...x, src: 'google' })).concat(live); }
        if (!alive) return;
        if (live.length) parts.push(`<div class="hscroll" style="margin-top:10px">${live.slice(0, 16).map((x, i) => liveCard(x, i)).join('')}</div>`);
        if (!parts.length) parts.push(`<div class="note small">${cat.g ? 'כאן יופיעו תוצאות מגוגל כשיחובר מפתח גוגל. בינתיים: ' : ''}<a href="${gmaps((cat.g || '') + ' ' + placeQuery(p))}" target="_blank" rel="noopener">חיפוש ${esc(cat.n)} בגוגל מפות</a></div>`);
        out.innerHTML = parts.join(''); paintIcons(out);
        // photos: Wikipedia images are free; Google photos are counted, so only the first few load automatically
        let gi = 0;
        $$('.lcard', out).forEach(card => {
          const x = live[+card.dataset.i]; const slot = $('.ph', card);
          if (x.src === 'wiki') fillPh(slot, { src: x.img, credit: 'Wikipedia', href: x.url });
          else if (gi++ < 3 && canGooglePhoto()) fillPh(slot, gPhoto(x));
          else { slot.querySelector('.skel')?.remove(); slot.innerHTML = `<button class="btn sec sm" style="position:absolute;inset:auto 8px 8px auto">${icon('image')} תמונה</button>`; paintIcons(slot); slot.querySelector('button').onclick = e => { e.preventDefault(); e.stopPropagation(); const im = gPhoto(x); if (im) { slot.innerHTML = '<div class="skel"></div>'; fillPh(slot, im); } else toast('הגעת למכסת התמונות מגוגל להיום. מחר יהיו עוד.'); }; }
          if (x.lat != null) pts.push({ lat: x.lat, lon: x.lon, label: x.title, col: x.src === 'google' ? '#1a73e8' : '#6b7280', on: () => window.open(x.url, '_blank') });
        });
        if (st.view === 'map') paintMap(pts.concat([{ lat: p.lat, lon: p.lon, label: p.n, col: C[p.c].col, on: () => openPlace(p.id), big: true }]));
      }
    }
    if (st.view === 'map' && !st.p) paintMap(pts);
  }

  async function paintMap(pts) {
    const box = $('#dmap', el); if (!box) return;
    map?.remove?.(); try { map = await createMap(box); } catch { box.innerHTML = '<div class="empty" style="padding-top:30%">המפה לא נטענה. כדאי לבדוק את החיבור לאינטרנט.</div>'; return; } if (!alive) return map.remove();
    $('#dsrc', el).textContent = map.source;
    pts.forEach(x => { const d = document.createElement('div'); d.className = 'pin' + (x.big ? '' : ' dot'); d.style.background = x.col; d.title = x.label; map.marker(x.lat, x.lon, d, x.on); });
    map.fit(pts.map(x => [x.lat, x.lon]), st.p ? 12 : 6);
  }
  function fillCards(box) { $$('[data-pc]', box).forEach(c => { fillPhFor($('.ph', c), PM[c.dataset.pc]); c.onclick = () => openPlace(c.dataset.pc); }); }

  draw();
  return () => { alive = false; map?.remove?.(); };
}

export function fillPhFor(slot, p) { const im = placePhotos(p, 500)[0]; if (im) fillPh(slot, im); else wiki(p.en).then(w => fillPh(slot, w?.img ? { src: w.img, credit: 'Wikipedia' } : null)); }
const placeCard = p => `<a class="pcard" style="width:auto;max-width:none" data-pc="${p.id}">${ph('', '1/1')}<h3 style="margin-top:8px">${esc(p.n)}${inRoute(p.id) ? ` ${icon('check', 'ok')}` : ''}</h3><div class="xs muted">${dot(C[p.c].col)} ${esc(p.t)}</div></a>`;
const liveCard = (x, i) => `<a class="pcard lcard" data-i="${i}" href="${x.url}" target="_blank" rel="noopener" style="width:58%">${ph('', '4/3')}<h3 class="small" style="margin-top:6px">${esc(x.title)}</h3><div class="xs muted">${esc(x.src === 'google' ? (x.addr || '').split(',').slice(0, 2).join(',') : x.desc)} · ${x.src === 'google' ? 'Google' : 'Wikipedia'}</div></a>`;

/* ---------- TikTok-style feed ---------- */
export function feed(el) {
  let alive = true;
  el.innerHTML = `<div class="feed" id="feed"><button class="feedx" aria-label="חזרה">${icon('x')}</button></div>`;
  paintIcons(el);
  const box = $('#feed', el); $('.feedx', el).onclick = () => history.length > 1 ? history.back() : go('discover');
  document.body.classList.add('immersive');
  const order = P.slice().sort(() => Math.random() - .5);
  let k = 0, loading = false;
  async function more() {
    if (loading || !alive) return; loading = true;
    for (let n = 0; n < 3 && k < order.length; n++, k++) {
      const p = order[k];
      addSlide({ kind: 'place', p, title: p.n, sub: `${dot(C[p.c].col)} ${C[p.c].n}`, text: p.t + '. ' + p.x, img: placePhotos(p, 1200)[0] || null, wikiTitle: p.en });
      const nb = await nearby(p.lat, p.lon, 12000, 20); if (!alive) return;
      (nb || []).filter(x => x.img).sort(() => Math.random() - .5).slice(0, 2).forEach(x => addSlide({ kind: 'spot', p, title: x.title, sub: `ליד ${p.n} · ${dot(C[p.c].col)}`, text: x.desc, img: { src: x.img.replace(/\/\d+px-/, '/1200px-'), credit: 'Wikipedia', href: x.url }, url: x.url }));
    }
    loading = false;
  }
  function addSlide(s) {
    const d = document.createElement('section'); d.className = 'slide';
    const likeKey = s.kind === 'place' ? 'p:' + s.p.id : 'w:' + s.title;
    d.innerHTML = `${ph('fill')}<div class="sc"><div class="xs">${esc(s.sub)}</div><h2>${esc(s.title)}</h2><p>${esc((s.text || '').slice(0, 180))}</p>
      <div class="row" style="gap:8px"><button class="btn sm" data-a="open">פרטים</button><a class="btn sec sm" href="${gmaps(s.title + ', ' + s.p.en.replace(/_/g, ' '))}" target="_blank" rel="noopener">${icon('map')} גוגל מפות</a></div></div>
      <div class="side"><button data-a="like" class="${S.likes[likeKey] ? 'liked' : ''}" aria-label="שמירה">${icon('heart')}<span>שמירה</span></button>
      <button data-a="add" aria-label="הוספה למסלול">${icon(inRoute(s.p.id) ? 'check' : 'plus')}<span>${inRoute(s.p.id) ? 'במסלול' : 'למסלול'}</span></button></div>`;
    box.appendChild(d); paintIcons(d);
    if (s.img) fillPh($('.ph', d), s.img); else wiki(s.wikiTitle).then(w => fillPh($('.ph', d), w?.img ? { src: w.img.replace(/\/\d+px-/, '/1200px-'), credit: 'Wikipedia' } : null));
    $('[data-a=open]', d).onclick = () => s.kind === 'place' ? openPlace(s.p.id) : window.open(s.url, '_blank');
    $('[data-a=like]', d).onclick = e => { const b = e.currentTarget; if (S.likes[likeKey]) delete S.likes[likeKey]; else S.likes[likeKey] = { t: Date.now(), title: s.title, p: s.p.id, url: s.url || '' }; save(true); b.classList.toggle('liked', !!S.likes[likeKey]); toast(S.likes[likeKey] ? 'נשמר' : 'הוסר מהשמורים'); };
    $('[data-a=add]', d).onclick = e => { if (!inRoute(s.p.id)) { addToRoute(s.p.id); toast(`${s.p.n} נוסף למסלול`); } e.currentTarget.innerHTML = icon('check') + '<span>במסלול</span>'; paintIcons(e.currentTarget); };
  }
  box.addEventListener('scroll', () => { if (box.scrollTop + box.clientHeight * 3 > box.scrollHeight) more(); }, { passive: true });
  more();
  return () => { alive = false; document.body.classList.remove('immersive'); };
}
