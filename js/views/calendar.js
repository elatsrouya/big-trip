import { S, C, EV, PM, MONTHS, routeInfo, startD, addDays, totalDays, onChange } from '../store.js';
import { esc, icon, paintIcons, $, $$ } from '../ui.js';
import { openPlace } from './place.js';
import { editTrip } from './home.js';

export function calendar(el) {
  let off = 0;
  const draw = () => {
    const s = startD(); const ri = routeInfo();
    if (!s) { el.innerHTML = `<div class="view"><div class="vh"><h1>לוח שנה</h1></div><div class="card empty">${icon('calendar-plus')}<p>כדי לראות את הטיול על לוח השנה, קובעים תאריך טיסה.</p><button class="btn" id="cd">לבחור תאריך</button></div></div>`; paintIcons(el); $('#cd', el).onclick = editTrip; return; }
    const base = new Date(s.getFullYear(), s.getMonth() + off, 1);
    const days = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    const lead = base.getDay(); // Sunday first, like the Israeli calendar
    const stopAt = d => ri.find(r => d >= r.arr && d < addDays(r.arr, r.d));
    const evs = EV.filter(e => e.m.includes(base.getMonth()) && ri.some(r => r.place.c === e.c));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let cells = ''; for (let i = 0; i < lead; i++) cells += '<span></span>';
    for (let d = 1; d <= days; d++) {
      const dt = new Date(base.getFullYear(), base.getMonth(), d); const st = stopAt(dt);
      const first = st && +dt === +st.arr;
      cells += `<button class="cday${st ? ' in' : ''}${+dt === +today ? ' today' : ''}" ${st ? `data-p="${st.p}" style="--c:${C[st.place.c].col}"` : 'disabled'}><b>${d}</b>${first ? `<em>${esc(st.place.n)}</em>` : ''}</button>`;
    }
    const inMonth = ri.filter(r => r.arr < new Date(base.getFullYear(), base.getMonth() + 1, 1) && addDays(r.arr, r.d) > base);
    el.innerHTML = `<div class="view">
      <div class="vh"><div><h1>לוח שנה</h1><div class="sub">${totalDays()} ימים מ־${s.toLocaleDateString('he-IL')}</div></div></div>
      <div class="card">
        <div class="row between" style="margin-bottom:10px"><button class="btn sec icon" id="cp" aria-label="חודש קודם">${icon('chevron-right')}</button><b style="font-size:18px">${MONTHS[base.getMonth()]} ${base.getFullYear()}</b><button class="btn sec icon" id="cn" aria-label="חודש הבא">${icon('chevron-left')}</button></div>
        <div class="cal"><i>א</i><i>ב</i><i>ג</i><i>ד</i><i>ה</i><i>ו</i><i>ש</i>${cells}</div>
      </div>
      ${inMonth.length ? `<h2>החודש במסלול</h2><div class="list">${inMonth.map(r => `<button class="li" data-p="${r.p}"><span class="dot" style="background:${C[r.place.c].col}"></span><div class="grow"><b>${esc(r.place.n)}</b><div class="xs muted">${r.arr.getDate()}.${r.arr.getMonth() + 1} · ${r.d} ימים</div></div>${icon('chevron-left', 'chev')}</button>`).join('')}</div>` : '<div class="note" style="margin-top:12px">אין יעדים במסלול בחודש הזה.</div>'}
      ${evs.length ? `<h2>אירועים ופסטיבלים</h2><div class="list">${evs.map(e => `<div class="li">${icon('party-popper')}<div class="grow"><b>${esc(e.n)}</b> <span class="xs muted">${C[e.c].f} ${esc(e.w)}</span><div class="xs muted">${esc(e.d)}</div></div></div>`).join('')}</div>` : ''}
    </div>`;
    paintIcons(el);
    $('#cn', el).onclick = () => { off++; draw(); }; $('#cp', el).onclick = () => { off--; draw(); };
    $$('[data-p]', el).forEach(b => b.onclick = () => openPlace(b.dataset.p));
  };
  draw(); return onChange(draw);
}
