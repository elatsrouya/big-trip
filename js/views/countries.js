import { C, P, EV, BLOCKED, COST, STYLE_M, S, ILS, fmt, routeCountries, MONTHS } from '../store.js';
import { esc, icon, ph, fillPh, paintIcons, $, $$ , dot } from '../ui.js';
import { wiki, wikiHe } from '../media.js';
import { openPlace, seasonBar } from './place.js';
import { fillPhFor } from './discover.js';
import { go } from '../router.js';

const wname = c => ({ la: 'Laos' }[c] || C[c].geo);
const withThe = c => (c === 'ph' ? 'the Philippines' : wname(c));
const perDay = c => (COST[c][0] * STYLE_M[S.style][0] + COST[c][1] * STYLE_M[S.style][1] + COST[c][2] * STYLE_M[S.style][2]) * ILS();

export function countries(el, arg) {
  if (arg && C[arg]) return country(el, arg);
  const mine = routeCountries(); const m = new Date().getMonth();
  const keys = Object.keys(C).sort((a, b) => mine.includes(b) - mine.includes(a));
  el.innerHTML = `<div class="view"><div class="vh"><div><h1>מדינות</h1><div class="sub">${Object.keys(C).length} מדינות · ${mine.length} במסלול שלך</div></div></div>
    <div class="stack">${keys.map(k => { const c = C[k]; return `<button class="card ccard" data-c="${k}">
      ${ph('', '16/7')}
      <div class="row between" style="margin-top:12px"><h3 style="font-size:19px;margin:0">${dot(c.col)} ${esc(c.n)}</h3>${mine.includes(k) ? '<span class="tag acc">במסלול</span>' : ''}</div>
      <div class="xs muted" style="margin:2px 0 10px">כ־₪${fmt(perDay(k))} ליום · ${c.visaDays ? `${c.visaDays} יום בלי ויזה` : 'צריך ויזה מראש'} · עכשיו: ${['לא עונה', 'עונה סבירה', 'עונה מעולה'][c.s[m]]}</div>
      ${seasonBar(c.s, m)}</button>`; }).join('')}</div>
    <h2>לא נכנסים עם דרכון ישראלי</h2><div class="list">${BLOCKED.map(b => `<div class="li">${dot('var(--ink-3)')}<div class="grow"><b>${esc(b[1])}</b><div class="xs muted">${esc(b[2])}</div></div></div>`).join('')}</div>
  </div>`;
  paintIcons(el);
  $$('.ccard', el).forEach(b => { b.onclick = () => go('countries/' + b.dataset.c); wiki(wname(b.dataset.c)).then(w => fillPh($('.ph', b), w?.img ? { src: w.img, credit: 'Wikipedia' } : null)); });
}

function country(el, k) {
  const c = C[k]; const m = new Date().getMonth(); const ps = P.filter(p => p.c === k); const evs = EV.filter(e => e.c === k);
  el.innerHTML = `<div class="view">
    <div class="vh"><button class="btn sec icon" id="cb" aria-label="חזרה">${icon('arrow-right')}</button><div class="grow"><h1>${dot(c.col)} ${esc(c.n)}</h1></div></div>
    ${ph('', '16/9')}
    <p id="ov" dir="auto" class="muted" style="margin-top:14px">טוען סקירה…</p>
    <div class="facts" style="margin:14px 0">
      <div class="fact"><b>${c.visaDays ? c.visaDays + ' יום' : 'ויזה מראש'}</b><span>כניסה בדרכון ישראלי</span></div>
      <div class="fact"><b class="num">₪${fmt(perDay(k))}</b><span>ליום, בסגנון שלך</span></div>
      <div class="fact"><b>${esc(c.cur[1])} ${esc(c.cur[2])}</b><span>מטבע</span></div>
      <div class="fact"><b>${ps.length}</b><span>יעדים באפליקציה</span></div>
    </div>
    <div class="note small">${icon('stamp')} ${esc(c.visa)}</div>
    <h2>מתי לטוס</h2>${seasonBar(c.s, m)}<p class="small muted">${esc(c.sn)}</p>
    <h2>יעדים</h2><div class="grid2">${ps.map(p => `<a class="pcard" style="width:auto;max-width:none" data-pc="${p.id}">${ph('', '1/1')}<h3 style="margin-top:8px">${esc(p.n)}</h3><div class="xs muted">${esc(p.t)}</div></a>`).join('')}</div>
    <h2>אנשים ותרבות</h2><p id="cu" dir="auto" class="small">טוען…</p>
    <h2>קצת היסטוריה</h2><p id="hi" dir="auto" class="small">טוען…</p>
    ${evs.length ? `<h2>אירועים ופסטיבלים</h2><div class="list">${evs.map(e => `<div class="li">${icon('party-popper')}<div class="grow"><b>${esc(e.n)}</b> <span class="xs muted">${esc(e.w)}</span><div class="xs muted">${esc(e.d)}</div></div></div>`).join('')}</div>` : ''}
    <h2>מחירים לדוגמה</h2><div class="list">${c.p.map(x => `<div class="li small"><div class="grow">${esc(x[0])}</div><span class="num">${esc(x[1])}</span></div>`).join('')}</div>
    ${c.tips?.length ? `<h2>טיפים</h2><div class="stack">${c.tips.map(t => `<div class="note small">${esc(t)}</div>`).join('')}</div>` : ''}
    <p class="xs muted" style="margin-top:16px">הסקירה, התרבות וההיסטוריה נטענות מוויקיפדיה בעברית, ובהיעדר ערך עברי מוויקיפדיה באנגלית.</p>
  </div>`;
  paintIcons(el);
  $('#cb', el).onclick = () => go('countries');
  $$('[data-pc]', el).forEach(a => { fillPhFor($('.ph', a), P.find(p => p.id === a.dataset.pc)); a.onclick = () => openPlace(a.dataset.pc); });
  const put = (id, w, n = 700) => { const e = $('#' + id, el); if (!e) return; e.innerHTML = w?.text ? `${esc(w.text.slice(0, n))}${w.text.length > n ? '…' : ''} <a href="${w.url}" target="_blank" rel="noopener">להמשך</a>` : 'לא נמצא מידע'; };
  const heOr = async t => (await wikiHe(t)) || (await wiki(t));
  wiki(wname(k)).then(w => fillPh($('.view > .ph', el), w?.img ? { src: w.img, credit: 'Wikipedia', href: w.url } : null));
  heOr(wname(k)).then(w => put('ov', w, 600));
  heOr('Culture of ' + withThe(k)).then(w => put('cu', w));
  heOr('History of ' + withThe(k)).then(w => put('hi', w));
}
