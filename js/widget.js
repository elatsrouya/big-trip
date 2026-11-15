// Data package for the home-screen widget (Scriptable). Copied to the clipboard; the widget reads it on tap.
import { S, C, routeInfo, budget } from './store.js';
import { TASKS, taskWhen } from './views/prep.js';
import { toast, sheet, esc } from './ui.js';

export function widgetPayload() {
  const open = TASKS.filter(t => !S.done[t.id] && (!t.when || t.when()))
    .sort((a, b) => S.startDate ? taskWhen(a).days - taskWhen(b).days : b.m - a.m);
  return {
    v: 2, at: Date.now(), d: S.startDate || '', s: +S.saved || 0, g: +S.goal || 0, b: Math.round(budget().total),
    r: routeInfo().map(r => [r.place.n, C[r.place.c].n, r.d, r.place.t, C[r.place.c].col]),
    t: open.slice(0, 3).map(t => [t.t, taskWhen(t).label]),
  };
}
export async function syncWidget() {
  const txt = 'TRIPW2:' + JSON.stringify(widgetPayload());
  try { await navigator.clipboard.writeText(txt); toast('הועתק. עכשיו לוחצים על הווידג׳ט'); }
  catch { sheet(`<h2 style="margin-top:4px">העתקה ידנית</h2><p class="small muted">מסמנים את הכול, מעתיקים, ואז לוחצים על הווידג׳ט.</p><textarea style="min-height:140px;padding:12px" readonly>${esc(txt)}</textarea>`); }
}
