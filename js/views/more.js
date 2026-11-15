import { S, save, replaceState, PM, C, onChange } from '../store.js';
import { esc, icon, paintIcons, sheet, closeSheet, toast, $, $$, dot } from '../ui.js';
import { usage, offInfo } from '../quota.js';
import { GOOGLE_KEY, LIMITS } from '../config.js';
import { openPlace } from './place.js';
import { go } from '../router.js';

const NAMES = { map: 'טעינות מפה', details: 'פרטי מקום', search: 'חיפושים', photo: 'תמונות' };

export function more(el) {
  const draw = () => {
    const likes = Object.entries(S.likes || {});
    el.innerHTML = `<div class="view"><div class="vh"><h1>עוד</h1></div>
      <div class="list">
        <a class="li" href="#calendar">${icon('calendar-days')}<div class="grow">לוח שנה</div>${icon('chevron-left', 'chev')}</a>
        <a class="li" href="#countries">${icon('globe-2')}<div class="grow">מדינות</div>${icon('chevron-left', 'chev')}</a>
        <a class="li" href="#prep">${icon('list-checks')}<div class="grow">הכנות</div>${icon('chevron-left', 'chev')}</a>
        <button class="li" id="msaved">${icon('heart')}<div class="grow">שמורים</div><span class="tag">${likes.length}</span>${icon('chevron-left', 'chev')}</button>
      </div>
      <h2>שימוש בגוגל היום</h2>
      <div class="card" id="mq">${!GOOGLE_KEY ? '<div class="small muted">גוגל לא מחובר עדיין. המפה והתמונות מגיעות מ־OpenStreetMap ומוויקיפדיה, בחינם.</div>' : ''}
      </div>
      <h2>גיבוי והעברה</h2>
      <div class="list">
        <button class="li" id="mexp">${icon('download')}<div class="grow">העתקת קוד גיבוי<div class="xs muted">המסלול, החיסכון והמשימות</div></div></button>
        <button class="li" id="mimp">${icon('upload')}<div class="grow">שחזור מקוד גיבוי<div class="xs muted">גם מהאפליקציה הקודמת</div></div></button>
      </div>
      <p class="xs muted" style="margin-top:18px">תמונות: ויקישיתוף (הקרדיט על כל תמונה), ויקיפדיה וגוגל. מפה: Google Maps או OpenStreetMap. טיפים מסומנים של מזרחניק (@mizrahnik) עם קישור לפוסט.</p>
    </div>`;
    paintIcons(el);
    if (GOOGLE_KEY) meters($('#mq', el));
    $('#msaved', el).onclick = saved;
    $('#mexp', el).onclick = async () => { const code = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); try { await navigator.clipboard.writeText(code); toast('קוד הגיבוי הועתק'); } catch { sheet(`<h2>קוד גיבוי</h2><textarea style="min-height:160px;padding:10px" readonly>${code}</textarea>`); } };
    $('#mimp', el).onclick = () => { const body = sheet(`<h2 style="margin-top:4px">שחזור מקוד גיבוי</h2><p class="small muted">מדביקים את הקוד שהועתק מהאפליקציה. המצב הנוכחי יוחלף.</p><textarea id="ic" style="min-height:140px;padding:10px"></textarea><button class="btn block" id="iok" style="margin-top:12px">שחזור</button>`);
      $('#iok', body).onclick = () => { try { const obj = JSON.parse(decodeURIComponent(escape(atob($('#ic', body).value.trim())))); replaceState(migrate(obj)); closeSheet(); toast('השחזור הושלם'); } catch { toast('הקוד לא תקין'); } }; };
  };
  draw(); return onChange(draw);
}
function meters(card) {
  card.innerHTML = (offInfo() ? '<div class="note warn small" style="margin-bottom:10px">גוגל כבוי במכשיר הזה ל־24 שעות כי התקבלה שגיאה מגוגל. האפליקציה עובדת על מקורות חינמיים.</div>' : '')
    + usage().map(u => `<div style="margin-bottom:12px"><div class="row between small"><span>${NAMES[u.sku]}</span><span class="num muted">היום ${u.day} מתוך ${u.day >= 0 ? LIMITS[u.sku].day : ''} · החודש ${u.month} מתוך ${LIMITS[u.sku].month}</span></div><div class="bar" style="height:6px;margin-top:6px"><i style="width:${Math.min(100, u.day / LIMITS[u.sku].day * 100)}%"></i></div></div>`).join('')
    + '<div class="xs muted">המגבלות נמוכות מהמכסה החינמית של גוגל. כשמגיעים אליהן, האפליקציה עוברת למקורות חינמיים עד מחר.</div>';
}

// Old app state (artifact) → new: same field names, so only drop what no longer exists.
function migrate(o) { const n = { ...o }; n.route = (o.route || []).filter(r => PM[r.p]).map(r => ({ p: r.p, d: +r.d || 1 })); n.likes ||= {}; return n; }

function saved() {
  const items = Object.entries(S.likes || {});
  const body = sheet(`<h2 style="margin-top:4px">שמורים</h2>${items.length ? `<div class="list">${items.map(([k, v]) => { const isP = k.startsWith('p:'); const p = isP ? PM[k.slice(2)] : PM[v.p];
    return `<div class="li"><div class="grow" data-k="${esc(k)}" style="cursor:pointer"><b>${esc(isP ? p?.n : v.title)}</b><div class="xs muted">${p ? dot(C[p.c].col) + ' ' + esc(isP ? p.t : 'ליד ' + p.n) : ''}</div></div><button class="btn ghost sm" data-rm="${esc(k)}" aria-label="הסרה">${icon('x')}</button></div>`; }).join('')}</div>` : '<div class="empty">עוד לא שמרת כלום. שומרים עם הלב במצב הגלילה ובדפי היעדים.</div>'}`);
  paintIcons(body);
  $$('[data-rm]', body).forEach(b => b.onclick = () => { delete S.likes[b.dataset.rm]; save(); b.closest('.li').remove(); });
  $$('[data-k]', body).forEach(d => d.onclick = () => { const k = d.dataset.k; const v = S.likes[k]; closeSheet(); setTimeout(() => k.startsWith('p:') ? openPlace(k.slice(2)) : v.url ? window.open(v.url, '_blank') : openPlace(v.p), 350); });
}
