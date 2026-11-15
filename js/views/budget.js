import { S, save, C, PM, INTL, HUB, STYLE_T, budget, dayCost, fmt, routeInfo, EXTRA_DEF, onChange } from '../store.js';
import { esc, icon, paintIcons, sheet, closeSheet, toast, $, $$ } from '../ui.js';

const GEAR = [['תרמיל 40-50 ליטר', 650], ['נעלי הליכה', 550], ['סנדלים', 200], ['שק שינה קל', 350], ['מעיל גשם / פונצ\'ו', 200], ['פליז', 180], ['פנס ראש', 90], ['מנעול + כבל', 70], ['מגבת מיקרופייבר', 70], ['ערכת עזרה ראשונה', 150], ['סוללה ניידת', 150], ['מתאם חשמל אוניברסלי', 60], ['תיק יום קטן', 150], ['שקיות אריזה', 90], ['בקבוק עם פילטר', 150]];
const sumGear = () => GEAR.reduce((a, g) => a + g[1], 0);

export function budgetView(el) {
  const draw = () => {
    const b = budget(); const ri = routeInfo();
    const max = Math.max(1, ...Object.values(b.cats).map(c => c.v));
    el.innerHTML = `<div class="view">
      <div class="vh"><div><h1>תקציב</h1><div class="sub">הערכה לפי המסלול והסגנון שלך</div></div></div>
      <div class="card"><div class="xs muted">סה"כ משוער</div><b class="num" style="font-size:34px;display:block;line-height:1.1">₪${fmt(b.total)}</b>
        <div class="row between small" style="margin-top:8px"><span class="muted">יעד חיסכון ₪${fmt(S.goal)} · חסכת ₪${fmt(S.saved)}</span><span class="tag ${b.total > S.goal ? 'warn' : 'ok'}">${b.total > S.goal ? 'חסרים ₪' + fmt(b.total - S.goal) : 'בתוך היעד'}</span></div>
        <div class="seg" style="margin-top:14px">${['low', 'mid', 'high'].map(k => `<button data-s="${k}" class="${S.style === k ? 'on' : ''}">${{ low: 'חסכוני', mid: 'רגיל', high: 'מפנק' }[k]}</button>`).join('')}</div>
        <div class="xs muted" style="margin-top:6px">${esc(STYLE_T[S.style])}</div></div>
      ${!ri.length ? '<div class="note" style="margin-top:12px">המסלול ריק, לכן רוב הסעיפים על אפס. מוסיפים יעדים בדף המסלול.</div>' : ''}
      <h2>לפי סעיף</h2>
      <div class="list">${Object.entries(b.cats).map(([k, c]) => `<button class="li" data-k="${k}">${icon(c.icon)}<div class="grow"><div class="row between"><span>${c.n}</span><b class="num">₪${fmt(c.v)}</b></div>
        <div class="bar" style="height:5px;margin-top:6px"><i style="width:${c.v / max * 100}%"></i></div></div>${icon('chevron-left', 'chev')}</button>`).join('')}</div>
      ${ri.length ? `<h2>לפי מדינה</h2><div class="list">${Object.values(b.per).map(o => `<div class="li"><span style="font-size:20px">${C[o.c].f}</span><div class="grow"><b>${esc(C[o.c].n)}</b><div class="xs muted">${o.days} ימים · כ־₪${fmt((o.h + o.f + o.l) / o.days * b.ils)} ליום</div></div><b class="num">₪${fmt((o.h + o.f + o.l + o.attr + o.visa) * b.ils)}</b></div>`).join('')}</div>` : ''}
      <p class="xs muted" style="margin-top:14px">מחירי הטיסות הם הערכה לפי חיפושים בנובמבר 2026. שאר המחירים ממוצעים לתרמילאים. כדאי לבדוק מחירים אמיתיים לפני שמזמינים.</p>
    </div>`;
    paintIcons(el);
    $$('[data-s]', el).forEach(x => x.onclick = () => { S.style = x.dataset.s; save(); });
    $$('[data-k]', el).forEach(x => x.onclick = () => detail(x.dataset.k));
  };
  draw(); return onChange(draw);
}

function detail(k) {
  const b = budget(); const c = b.cats[k]; const ri = routeInfo(); let html = '';
  const ex = { ...EXTRA_DEF, ...S.extras };
  const head = `<h2 style="margin-top:4px">${icon(c.icon)} ${c.n}</h2><b class="num" style="font-size:28px">₪${fmt(c.v)}</b>`;
  if (k === 'flights') {
    const f = ri[0]?.place.c, l = ri[ri.length - 1]?.place.c;
    html = `${head}<p class="small muted">טיסה לכיוון אחד מתל אביב. אפשר להכניס מחיר אמיתי כשמוצאים.</p>
      ${f ? `<label class="f">הלוך: תל אביב ← ${esc(HUB[f][0])} (הערכה ₪${fmt(INTL[f])})</label><input id="fi" type="number" inputmode="numeric" placeholder="${INTL[f]}" value="${S.fIn}">
      <label class="f" style="margin-top:10px">חזור: ${esc(HUB[l][0])} ← תל אביב (הערכה ₪${fmt(INTL[l])})</label><input id="fo" type="number" inputmode="numeric" placeholder="${INTL[l]}" value="${S.fOut}">
      <div class="row" style="gap:8px;margin-top:10px"><a class="btn sec sm" target="_blank" rel="noopener" href="https://www.google.com/travel/flights?q=${encodeURIComponent('Tel Aviv to ' + HUB[f][1])}">Google Flights</a><a class="btn sec sm" target="_blank" rel="noopener" href="https://www.kayak.com/flights/TLV-${encodeURIComponent(HUB[f][1])}">Kayak</a></div>` : '<div class="note">המסלול ריק.</div>'}
      ${c.legs.length ? `<h2>בין היעדים</h2><div class="list">${c.legs.map(x => `<div class="li">${icon(x.mode === 'fly' ? 'plane' : 'bus')}<div class="grow small">${esc(x.a.n)} ← ${esc(x.b.n)}<div class="xs muted">${fmt(x.km)} ק"מ</div></div><b class="num">₪${fmt(x.usd * b.ils)}</b></div>`).join('')}</div>` : ''}
      <button class="btn block" id="bok" style="margin-top:16px">שמירה</button>`;
  } else if (['lodging', 'food', 'local'].includes(k)) {
    const key = { lodging: 'h', food: 'f', local: 'l' }[k];
    html = `${head}<p class="small muted">לפי מחיר יומי ממוצע לתרמילאי בסגנון "${{ low: 'חסכוני', mid: 'רגיל', high: 'מפנק' }[S.style]}".</p>
      <div class="list">${Object.values(b.per).map(o => `<div class="li"><span style="font-size:20px">${C[o.c].f}</span><div class="grow">${esc(C[o.c].n)}<div class="xs muted">${o.days} ימים × ₪${fmt(dayCost(o.c)[key] * b.ils)}</div></div><b class="num">₪${fmt(o[key] * b.ils)}</b></div>`).join('') || '<div class="empty">המסלול ריק</div>'}</div>
      ${Object.keys(b.per).length ? `<h2>מחירים לדוגמה</h2>${Object.keys(b.per).map(cc => `<div class="small" style="margin-bottom:10px"><b>${C[cc].f} ${esc(C[cc].n)}</b>${C[cc].p.map(x => `<div class="row between"><span class="muted">${esc(x[0])}</span><span class="num">${esc(x[1])}</span></div>`).join('')}</div>`).join('')}` : ''}`;
  } else if (k === 'attr') {
    html = `${head}<p class="small muted">אטרקציות בתשלום ביעדים במסלול. מכבים את מה שלא מתכננים לעשות.</p>
      <div class="list">${c.items.map(x => `<label class="li"><input type="checkbox" data-a="${x.pid}|${x.i}" ${x.on ? 'checked' : ''} style="width:22px;min-height:22px"><div class="grow small">${esc(x.n)}<div class="xs muted">${esc(PM[x.pid].n)}</div></div><b class="num">$${x.usd}</b></label>`).join('') || '<div class="empty">אין אטרקציות בתשלום במסלול</div>'}</div>`;
  } else if (k === 'visa') {
    html = `${head}<div class="list">${Object.values(b.per).map(o => `<div class="li"><span style="font-size:20px">${C[o.c].f}</span><div class="grow small">${esc(C[o.c].visa)}</div><b class="num">₪${fmt(o.visa * b.ils)}</b></div>`).join('') || '<div class="empty">המסלול ריק</div>'}</div>`;
  } else if (k === 'gear') {
    html = `${head}<p class="small muted">רשימת ציוד בסיסית עם מחירים משוערים בישראל. אפשר לשנות את הסכום הכולל.</p>
      <div class="list">${GEAR.map(g => `<div class="li small"><div class="grow">${esc(g[0])}</div><span class="num">₪${g[1]}</span></div>`).join('')}</div>
      <label class="f" style="margin-top:12px">הסכום שלי לציוד (₪, ברשימה: ${fmt(sumGear())})</label><input id="xv" type="number" inputmode="numeric" value="${ex.gear}"><button class="btn block" id="bok" style="margin-top:12px">שמירה</button>`;
  } else {
    const info = { insurance: ['ביטוח לתרמילאים לחודש (₪)', 'כולל כיסוי רפואי, ספורט אתגרי, קטנוע וצלילה. כדאי להשוות כמה פוליסות.'], health: ['חיסונים ותרופות (₪)', 'מרפאת מטיילים: חיסונים לפי היעדים, ותרופות למלריה אם צריך.'], sim: ['סים או eSIM לחודש (₪)', 'eSIM אזורי לאסיה, או סים מקומי בכל מדינה, שבדרך כלל זול יותר.'] }[k];
    html = `${head}<p class="small muted">${info[1]}</p><label class="f">${info[0]}</label><input id="xv" type="number" inputmode="numeric" value="${ex[{ insurance: 'insurance', health: 'vaccines', sim: 'sim' }[k]]}"><button class="btn block" id="bok" style="margin-top:12px">שמירה</button>`;
  }
  const body = sheet(html); paintIcons(body);
  $$('[data-a]', body).forEach(x => x.onchange = () => { if (x.checked) delete S.attrOff[x.dataset.a]; else S.attrOff[x.dataset.a] = 1; save(); });
  const ok = $('#bok', body); if (ok) ok.onclick = () => {
    if (k === 'flights') { S.fIn = $('#fi', body)?.value || ''; S.fOut = $('#fo', body)?.value || ''; }
    else { const f = { gear: 'gear', insurance: 'insurance', health: 'vaccines', sim: 'sim' }[k]; S.extras[f] = Math.max(0, +$('#xv', body).value || 0); }
    save(); closeSheet(); toast('נשמר');
  };
}
