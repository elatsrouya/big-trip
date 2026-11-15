import { S, save, C, routeInfo, totalDays, routeCountries, daysLeft, startD, dlong, nextStop, currentStop, budget, fmt, warnings, dstr, onChange } from '../store.js';
import { esc, icon, ph, fillPh, paintIcons, sheet, closeSheet, $, toast , dot } from '../ui.js';
import { placePhotos, wiki } from '../media.js';
import { openPlace } from './place.js';
import { go } from '../router.js';
import { taskWhen, TASKS } from './prep.js';

export function home(el) {
  const draw = () => {
    const left = daysLeft(), s = startD();
    const ri = routeInfo(), td = totalDays(), cs = routeCountries();
    const nx = currentStop() || nextStop();
    const b = budget(); const pct = Math.min(100, S.goal ? S.saved / S.goal * 100 : 0);
    const monthsToGo = left > 0 ? left / 30.4 : 0; const perMonth = monthsToGo > 0 ? Math.max(0, (S.goal - S.saved) / monthsToGo) : 0;
    const w = warnings();
    const openTasks = TASKS.filter(t => !S.done[t.id] && (!t.when || t.when()));
    const due = openTasks.map(t => ({ t, w: taskWhen(t) })).sort((a, b) => a.w.days - b.w.days)[0];
    const cur = currentStop();
    el.innerHTML = `<div class="view">
      <div class="vh"><div><h1>הטיול הגדול</h1><div class="sub">${s ? 'טיסה ב־' + dlong(s) : 'עוד לא נקבע תאריך'}</div></div>
        <button class="btn sec icon" id="hset" aria-label="הגדרות">${icon('settings-2')}</button></div>

      <section class="hero" id="hhero">
        <div class="bg" id="hbg"></div>
        ${s ? (left > 0 ? `<div class="lbl">עוד</div><div class="big num">${fmt(left)}</div><div class="lbl">ימים לטיסה</div>`
          : cur ? `<div class="lbl">יום ${Math.round((new Date() - cur.arr) / 864e5) + 1} ב${esc(cur.place.n)}</div><div class="big">בדרכים</div>` : `<div class="big">בדרכים</div>`)
        : `<div class="big" style="font-size:44px">מתי טסים?</div><div class="lbl">תאריך משוער מספיק. הספירה, העונות והמשימות יתעדכנו לפיו</div>
           <button class="btn" id="hdate" style="margin-top:14px;align-self:flex-start">${icon('calendar-plus')} לבחור תאריך</button>`}
      </section>

      ${ri.length ? `<div class="summary"><span><b class="num">${td}</b> ימים</span><span><b class="num">${cs.length}</b> מדינות</span><span><b class="num">${ri.length}</b> יעדים</span></div>
      <div class="strip" id="hstrip">${ri.map((r, i) => `<button class="st" data-p="${r.p}">${ph('', '1/1')}<div class="k"><b class="num">${i + 1}</b></div><div class="nm">${esc(r.place.n)}</div><div class="dt">${r.arr ? dstr(r.arr) + ' · ' : ''}${r.d} ימים</div></button>`).join('')}</div>` : ''}

      ${nx ? `<h2>${cur ? 'איפה אני עכשיו' : 'היעד הקרוב'}</h2>
      <button class="rowlink" id="hnext" style="border-top:0;padding-top:0">${ph('', '1/1').replace('class="ph ', 'class="ph th ')}<div class="grow">
        <div class="xs muted">${dot(C[nx.place.c].col)} ${esc(C[nx.place.c].n)}${nx.arr ? ' · ' + dlong(nx.arr) : ''} · ${nx.d} ימים</div>
        <h3 style="font-size:18px;margin:4px 0">${esc(nx.place.n)}</h3><div class="small muted">${esc(nx.place.t)}</div></div>${icon('chevron-left', 'chev')}</button>`
      : `<div class="card empty" style="margin-top:16px">המסלול עוד ריק<br><button class="btn" style="margin-top:12px" id="hstart">${icon('map')} לבנות מסלול</button></div>`}

      <h2>חיסכון</h2>
      <div class="card" id="hsave" style="cursor:pointer">
        <div class="row between"><div><div class="xs muted">חסכתי</div><b style="font-size:28px;font-weight:500" class="num">₪${fmt(S.saved)}</b></div>
          <div style="text-align:left"><div class="xs muted">היעד</div><b style="font-size:16px;font-weight:500" class="num">₪${fmt(S.goal)}</b></div></div>
        <div class="bar" style="margin:12px 0 10px"><i style="width:${pct}%"></i></div>
        <div class="row between small"><span class="muted">${Math.round(pct)}% מהיעד</span>${perMonth ? `<span>צריך לחסוך <b class="num">₪${fmt(perMonth)}</b> בחודש</span>` : ''}</div>
        ${td ? `<div class="row between small" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)"><span class="muted">תקציב משוער למסלול</span><span><b class="num">₪${fmt(b.total)}</b> <span class="tag ${b.total > S.goal ? 'warn' : 'ok'}">${b.total > S.goal ? 'חסרים ₪' + fmt(b.total - S.goal) : 'רזרבה ₪' + fmt(S.goal - b.total)}</span></span></div>` : ''}
      </div>

      ${due ? `<h2>המשימה הבאה</h2><button class="li card" id="htask" style="border-radius:var(--r)">${icon('list-checks')}<div class="grow"><b>${esc(due.t.t)}</b><div class="xs ${due.w.days < 0 ? '' : 'muted'}" style="${due.w.days < 0 ? 'color:var(--bad)' : ''}">${esc(due.w.label)}</div></div>${icon('chevron-left', 'chev')}</button>` : ''}

      ${w.length ? `<h2>שווה לבדוק</h2><div class="stack">${w.slice(0, 4).map(x => `<div class="note warn small">${esc(x)}</div>`).join('')}</div>` : ''}
    </div>`;
    paintIcons(el);
    // hero photo: next stop, or a default destination
    const hp = nx?.place || { id: 'lpq', en: 'Luang_Prabang' };
    const photos = placePhotos(hp, 1200);
    const putHero = img => { if (!img) return; const bg = $('#hbg', el); if (!bg) return; bg.innerHTML = `<img src="${img.src}" alt="" referrerpolicy="no-referrer">`; if (img.credit) { const c = document.createElement('span'); c.className = 'credit'; c.textContent = img.credit; $('#hhero', el).appendChild(c); } };
    if (photos[0]) putHero(photos[0]); else wiki(hp.en).then(w => w?.img && putHero({ src: w.img, credit: 'Wikipedia' }));
    if (nx) { thumb($('#hnext .ph', el), nx.place); $('#hnext', el).onclick = () => openPlace(nx.place.id); }
    el.querySelectorAll('#hstrip .st').forEach(b => { const p = ri.find(r => r.p === b.dataset.p).place; thumb(b.querySelector('.ph'), p); b.onclick = () => openPlace(p.id); });
    $('#hstart', el) && ($('#hstart', el).onclick = () => go('route'));
    $('#hdate', el) && ($('#hdate', el).onclick = editTrip);
    $('#hset', el).onclick = editTrip;
    $('#hsave', el).onclick = editTrip;
    $('#htask', el) && ($('#htask', el).onclick = () => go('prep'));
  };
  draw();
  return onChange(draw);
}

function thumb(slot, p) { const im = placePhotos(p, 300)[0]; if (im) fillPh(slot, { src: im.src }); else wiki(p.en).then(w => fillPh(slot, w?.img ? { src: w.img } : null)); }

export function editTrip() {
  const body = sheet(`<h2 style="margin-top:4px">פרטי הטיול</h2>
    <label class="f" for="fd">תאריך טיסה (משוער)</label><input type="date" id="fd" value="${S.startDate}">
    <div class="grid2" style="margin-top:14px">
      <div><label class="f" for="fs">כמה חסכתי (₪)</label><input id="fs" type="number" inputmode="numeric" value="${S.saved}"></div>
      <div><label class="f" for="fg">יעד חיסכון (₪)</label><input id="fg" type="number" inputmode="numeric" value="${S.goal}"></div>
    </div>
    <button class="btn block" id="fok" style="margin-top:18px">שמירה</button>`);
  $('#fok', body).onclick = () => { S.startDate = $('#fd', body).value; S.saved = Math.max(0, +$('#fs', body).value || 0); S.goal = Math.max(0, +$('#fg', body).value || 0); save(); closeSheet(); toast('נשמר'); };
}
