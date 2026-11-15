import { S, save, startD, addDays, dlong, onChange, routeCountries, C } from '../store.js';
import { esc, icon, paintIcons, sheet, closeSheet, $, $$ } from '../ui.js';

// m = months before the flight when the task is due. Ids c1..c14 / cmz1-2 keep ticks from the previous app.
export const TASKS = [
  { id: 'c1', m: 12, t: 'לפתוח חיסכון ייעודי לטיול', x: 'חשבון או פיקדון נפרד, עם הוראת קבע חודשית. כך רואים את ההתקדמות ולא נוגעים בכסף.' },
  { id: 'c2', m: 12, t: 'לבדוק שהדרכון בתוקף 6 חודשים אחרי החזרה', x: 'רוב מדינות אסיה דורשות תוקף של 6 חודשים לפחות מיום הכניסה, ועמודים ריקים לחותמות. חידוש בתור ברשות האוכלוסין לוקח זמן.' },
  { id: 'n1', m: 9, t: 'לבחור כיוון ועונה', x: 'לפי העונות בכל מדינה ובמסלול באפליקציה. העונה קובעת את סדר המדינות.' },
  { id: 'c3', m: 6, t: 'רישיון לאופנוע + רישיון נהיגה בינלאומי', x: 'בלי רישיון מתאים, הביטוח לא יכסה תאונת קטנוע. את הרישיון הבינלאומי מוציאים בממסר.' },
  { id: 'n2', m: 6, t: 'בדיקת שיניים וטיפולים', x: 'טיפול שיניים בחו"ל יקר ולא תמיד מכוסה. עדיף לסגור הכול לפני.' },
  { id: 'c4', m: 5, t: 'תור במרפאת מטיילים (חיסונים, מלריה)', x: 'חלק מהחיסונים צריכים כמה מנות בהפרש של שבועות. מביאים את פנקס החיסונים מהצבא.' },
  { id: 'c5', m: 4, t: 'לבדוק אזהרות מסע של המל"ל', x: 'מטה לביטחון לאומי מפרסם אזהרות לפי מדינה. כדאי לבדוק שוב גם לפני הטיסה.' },
  { id: 'n3', m: 4, t: 'ויזה לסין (אם סין במסלול)', x: 'ישראלים צריכים ויזה לסין מראש, במרכז הוויזות. לבדוק דרישות ותוקף לפני שמזמינים.', when: () => routeCountries().includes('cn') },
  { id: 'cmz2', m: 3, t: 'בביטוח: הרחבה לספורט אתגרי ולאיתור וחילוץ', x: 'טרקים, צלילה וקטנוע לא תמיד בכיסוי הבסיסי. טיפ של מזרחניק.' },
  { id: 'c6', m: 3, t: 'לסגור טיסה', x: 'השוואה ב־Kayak או Google Flights. טיסה עם עצירה בדרך כלל זולה יותר.' },
  { id: 'c7', m: 3, t: 'ביטוח נסיעות כולל אופנוע וצלילה', x: 'משווים פוליסות לתרמילאים לכל משך הטיול, עם אפשרות להארכה מחו"ל.' },
  { id: 'c8', m: 2, t: 'כרטיס אשראי בלי עמלות המרה + גיבוי', x: 'שני כרטיסים מחברות שונות, שמורים במקומות שונים בתיק.' },
  { id: 'n4', m: 2, t: 'להודיע לבנק על שהות בחו"ל', x: 'כדי שהכרטיס לא ייחסם בעסקה הראשונה בחו"ל.' },
  { id: 'cmz1', m: 1, t: 'הוכחת יציאה מהמדינה הראשונה', x: 'כרטיס המשך או יציאה. בודקים את זה כבר בצ\'ק־אין בארץ. טיפ של מזרחניק.' },
  { id: 'c9', m: 1, t: 'e-Visa לווייטנאם', x: 'באתר הממשלתי בלבד. לקחת בחשבון עד שבועיים טיפול.', when: () => routeCountries().includes('vn') },
  { id: 'c10', m: 1, t: 'ויזות לשאר המדינות לפי המסלול', x: 'בדף המדינות כתוב מה צריך בכל מדינה.' },
  { id: 'c11', m: 1, t: 'ציוד: תרמיל 40-50 ליטר, נעליים, פנס ראש, מנעול', x: 'פירוט ומחירים בדף התקציב, בקטגוריית ציוד.' },
  { id: 'n5', m: 1, t: 'תרופות קבועות וערכת עזרה ראשונה', x: 'מרשם באנגלית לתרופות קבועות, וערכה בסיסית מוכנה.' },
  { id: 'c12', m: .5, t: 'eSIM ואפליקציות', x: 'Grab, Maps.me, Hostelworld, 12Go, מתרגם עם שפות להורדה.' },
  { id: 'n6', m: .5, t: 'להוריד מפות אופליין', x: 'בגוגל מפות וב־Maps.me לכל אזור במסלול.' },
  { id: 'c13', m: .5, t: 'לסרוק דרכון וביטוח לענן ולשלוח להורים', x: 'תמונה של הדרכון, הביטוח וכרטיסי האשראי (בלי המספרים המלאים) שמורה גם בענן.' },
  { id: 'c14', m: .1, t: 'למלא TDAC לתאילנד', x: 'טופס הגעה דיגיטלי, עד 72 שעות לפני הנחיתה.', when: () => routeCountries().includes('th') },
];
const PHASES = [[12, 'שנה ויותר לפני'], [6, '6-9 חודשים לפני'], [3, '3-5 חודשים לפני'], [1, 'חודש-חודשיים לפני'], [0, 'בשבועות האחרונים']];
const phaseOf = m => PHASES.find(([x]) => m >= x)[1];

export function taskWhen(t) {
  const s = startD(); if (!s) return { days: t.m * 30, label: phaseOf(t.m) };
  const due = addDays(s, -Math.round(t.m * 30.4)); const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.round((due - today) / 864e5);
  return { days, due, label: days < 0 ? `באיחור של ${-days} ימים` : days === 0 ? 'היום' : `עד ${dlong(due)}` };
}
const visible = () => TASKS.filter(t => !t.when || t.when());

export function prep(el) {
  const draw = () => {
    const list = visible(); const done = list.filter(t => S.done[t.id]).length;
    el.innerHTML = `<div class="view"><div class="vh"><div><h1>הכנות</h1><div class="sub">${done} מתוך ${list.length} בוצעו</div></div></div>
      <div class="bar"><i style="width:${list.length ? done / list.length * 100 : 0}%"></i></div>
      ${PHASES.map(([, name]) => { const ts = list.filter(t => phaseOf(t.m) === name); if (!ts.length) return '';
        return `<h2>${name}</h2><div class="list">${ts.map(t => { const w = taskWhen(t); const late = w.days < 0 && !S.done[t.id];
          return `<div class="li task" data-id="${t.id}"><button class="tick ${S.done[t.id] ? 'on' : ''}" aria-label="סימון">${icon('check')}</button>
          <div class="grow" data-open="${t.id}"><div style="${S.done[t.id] ? 'text-decoration:line-through;color:var(--ink-3)' : ''}">${esc(t.t)}</div>
          <div class="xs" style="color:${late ? 'var(--bad)' : 'var(--ink-3)'}">${S.done[t.id] ? 'בוצע' : esc(w.label)}</div></div>${icon('chevron-left', 'chev')}</div>`; }).join('')}</div>`; }).join('')}
    </div>`;
    paintIcons(el);
    $$('.tick', el).forEach(b => b.onclick = e => { e.stopPropagation(); const id = b.closest('.task').dataset.id; if (S.done[id]) delete S.done[id]; else S.done[id] = 1; save(); });
    $$('[data-open]', el).forEach(d => d.onclick = () => { const t = TASKS.find(x => x.id === d.dataset.open);
      const body = sheet(`<h2 style="margin-top:4px">${esc(t.t)}</h2><div class="tag" style="margin-bottom:12px">${esc(taskWhen(t).label)}</div><p>${esc(t.x)}</p>
        <button class="btn block" id="tdone">${S.done[t.id] ? 'סימון כלא בוצע' : 'סימון כבוצע'}</button>`);
      $('#tdone', body).onclick = () => { if (S.done[t.id]) delete S.done[t.id]; else S.done[t.id] = 1; save(); closeSheet(); }; });
  };
  draw(); return onChange(draw);
}
