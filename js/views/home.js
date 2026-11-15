import { S, save, C, routeInfo, totalDays, routeCountries, daysLeft, startD, dlong, nextStop, currentStop, budget, fmt, warnings, dstr, onChange } from '../store.js';
import { esc, icon, ph, fillPh, paintIcons, sheet, closeSheet, $, toast } from '../ui.js';
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
        : `<div class="big" style="font-size:40px">מתי טסים?</div><div class="lbl">קובעים תאריך משוער, וכל השאר מתעדכן לפיו</div>
           <button class="btn" id="hdate" style="margin-top:14px;align-self:flex-start">${icon('calendar-plus')} לבחור תאריך</button>`}
      </section>

      <div class="stats">
        <div class="stat"><b class="num">${td}</b><span>ימי טיול</span></div>
        <div class="stat"><b class="num">${cs.length}</b><span>מדינות</span><div class="xs" style="margin-top:2px">${cs.map(c => C[c].f).join(' ')}</div></div>
        <div class="stat"><b class="num">${ri.length}</b><span>יעדים</span></div>
      </div>

      ${nx ? `<h2>${cur ? 'איפה אני עכשיו' : 'היעד הקרוב'}</h2>
      <div class="card next" id="hnext">${ph('', '1/1')}<div class="grow">
        <div class="xs muted">${C[nx.place.c].f} ${esc(C[nx.place.c].n)}${nx.arr ? ' · ' + dstr(nx.arr) : ''} · ${nx.d} ימים</div>
        <h3 style="font-size:19px;margin:2px 0">${esc(nx.place.n)}</h3><div class="small muted">${esc(nx.place.t)}</div></div>${icon('chevron-left', 'chev')}</div>`
      : `<h2>היעד הקרוב</h2><div class="card empty">המסלול עוד ריק.<br><button class="btn" style="margin-top:12px" id="hstart">${icon('map')} לבנות מסלול</button></div>`}

      <h2>חיסכון</h2>
      <div class="card" id="hsave" style="cursor:pointer">
        <div class="row between"><div><div class="xs muted">חסכתי</div><b style="font-size:26px" class="num">₪${fmt(S.saved)}</b></div>
          <div style="text-align:left"><div class="xs muted">היעד</div><b style="font-size:18px" class="num">₪${fmt(S.goal)}</b></div></div>
        <div class="bar" style="margin:12px 0 10px"><i style="width:${pct}%"></i></div>
        <div class="row between small"><span class="muted">${Math.round(pct)}% מהיעד</span>${perMonth ? `<span>צריך לחסוך <b class="num">₪${fmt(perMonth)}</b> בחודש</span>` : ''}</div>
        ${td ? `<div class="note ${b.total > S.goal ? 'warn' : 'ok'}" style="margin-top:12px">התקציב המשוער למסלול: <b class="num">₪${fmt(b.total)}</b>. ${b.total > S.goal ? 'יותר מהיעד ב־₪' + fmt(b.total - S.goal) + '.' : 'בתוך היעד, עם רזרבה של ₪' + fmt(S.goal - b.total) + '.'}</div>` : ''}
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
    if (nx) { const im = placePhotos(nx.place, 300)[0]; if (im) fillPh($('#hnext .ph', el), { src: im.src }); else wiki(nx.place.en).then(w => fillPh($('#hnext .ph', el), w?.img ? { src: w.img } : null)); $('#hnext', el).onclick = () => openPlace(nx.place.id); }
    $('#hstart', el) && ($('#hstart', el).onclick = () => go('route'));
    $('#hdate', el) && ($('#hdate', el).onclick = editTrip);
    $('#hset', el).onclick = editTrip;
    $('#hsave', el).onclick = editTrip;
    $('#htask', el) && ($('#htask', el).onclick = () => go('prep'));
  };
  draw();
  return onChange(draw);
}

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
