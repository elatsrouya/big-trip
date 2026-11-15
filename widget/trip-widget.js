// הטיול הגדול · ווידג'ט ל־Scriptable (גרסה 2)
// גדלים: גדול (מומלץ), בינוני, קטן
// התקנה: ב"ערוך ווידג'ט" בוחרים את הסקריפט הזה, ו־When Interacting = Run Script
// סנכרון: באתר נכנסים ל"עוד" ולוחצים "סנכרון לווידג'ט", ואז לוחצים על הווידג'ט

const SITE = "https://elatsrouya.github.io/big-trip/";
const KEY = "trip-widget-data-v2";

// ---------- colors (same as the site) ----------
// Always dark: black background, light text.
const COL = { bg: "#000000", card: "#1c1a18", ink: "#efe9de", ink2: "#aaa398", ink3: "#8a847a", line: "#2e2b27", acc: "#e0775c" };
const c = h => new Color(h);

// ---------- sync: read the clipboard when the widget is tapped ----------
let synced = false;
if (config.runsInApp) {
  try {
    const clip = Pasteboard.paste() || "";
    const m = clip.match(/^TRIPW([12]):([\s\S]+)$/);
    if (m) {
      const data = JSON.parse(m[2]);
      if (m[1] === "1") data.r = (data.r || []).map(x => [x[0], "", x[2], x[3], COL.acc]); // old app format
      Keychain.set(KEY, JSON.stringify(data));
      Pasteboard.copy("");
      synced = true;
    }
  } catch (e) { console.log("sync error: " + e); }
}

let D = { d: "", s: 0, g: 60000, b: 0, r: [], t: [] };
try { if (Keychain.contains(KEY)) D = Object.assign(D, JSON.parse(Keychain.get(KEY))); } catch (e) {}

// ---------- numbers ----------
const fmt = n => Math.round(n).toLocaleString("he-IL");
const today = new Date(); today.setHours(0, 0, 0, 0);
const start = D.d ? new Date(D.d + "T00:00:00") : null;
const left = start ? Math.round((start - today) / 864e5) : null;
const pct = D.g ? Math.min(1, D.s / D.g) : 0;
const perMonth = left > 0 ? Math.max(0, (D.g - D.s) / (left / 30.4)) : 0;
const totalDays = D.r.reduce((a, r) => a + r[2], 0);

// where am I / what's next
function stopInfo() {
  if (!D.r.length) return null;
  if (!start || left > 0) return { i: 0, r: D.r[0], label: "היעד הראשון" };
  let off = 0;
  for (let i = 0; i < D.r.length; i++) {
    const a = off, b = off + D.r[i][2];
    if (-left >= a && -left < b) return { i, r: D.r[i], label: `יום ${-left - a + 1} מתוך ${D.r[i][2]}` };
    off = b;
  }
  return null;
}
const stop = stopInfo();

// ---------- tap: open the site ----------
if (config.runsInApp && !config.runsInWidget && args.queryParameters.open !== undefined || (config.runsInApp && synced)) {
  if (synced) { const n = new Notification(); n.title = "הווידג'ט עודכן"; n.body = "המסלול, החיסכון והמשימות סונכרנו"; n.schedule(); }
  Safari.open(SITE);
  Script.complete();
  return;
}

// ---------- drawing helpers ----------
function txt(st, s, size, color, weight = "regular") {
  const t = st.addText(String(s));
  t.font = weight === "medium" ? Font.mediumSystemFont(size) : weight === "semibold" ? Font.semiboldSystemFont(size) : Font.systemFont(size);
  t.textColor = c(color);
  t.rightAlignText();
  return t;
}
function bar(st, w, p) {
  const ctx = new DrawContext(); ctx.size = new Size(w, 6); ctx.opaque = false; ctx.respectScreenScale = true;
  const bg = new Path(); bg.addRoundedRect(new Rect(0, 0, w, 6), 3, 3); ctx.addPath(bg); ctx.setFillColor(c(COL.line)); ctx.fillPath();
  if (p > 0) { const fg = new Path(); const fw = Math.max(6, w * p); fg.addRoundedRect(new Rect(w - fw, 0, fw, 6), 3, 3); ctx.addPath(fg); ctx.setFillColor(c(COL.acc)); ctx.fillPath(); }
  const img = st.addImage(ctx.getImage()); img.imageSize = new Size(w, 6);
}
// the route signature: numbered rings joined by a dashed line (right to left)
function routeLine(st, w, stops, active) {
  const n = Math.min(stops.length, 7); if (!n) return;
  const h = 26, r = 10, ctx = new DrawContext(); ctx.size = new Size(w, h); ctx.opaque = false; ctx.respectScreenScale = true;
  const xs = [...Array(n)].map((_, i) => n === 1 ? w - r - 2 : w - r - 2 - i * ((w - 2 * r - 4) / (n - 1)));
  for (let x = xs[n - 1]; x < xs[0]; x += 7) { const p = new Path(); p.addRect(new Rect(x, h / 2 - 1, 4, 2)); ctx.addPath(p); ctx.setFillColor(c(COL.acc)); ctx.fillPath(); }
  xs.forEach((x, i) => {
    const on = i === active;
    const p = new Path(); p.addEllipse(new Rect(x - r, h / 2 - r, 2 * r, 2 * r)); ctx.addPath(p); ctx.setFillColor(c(on ? COL.acc : COL.bg)); ctx.fillPath();
    ctx.addPath(p); ctx.setStrokeColor(c(COL.acc)); ctx.setLineWidth(2); ctx.strokePath();
    ctx.setFont(Font.mediumSystemFont(10)); ctx.setTextColor(c(on ? "#000000" : COL.acc)); ctx.setTextAlignedCenter();
    ctx.drawTextInRect(String(i + 1), new Rect(x - r, h / 2 - 7, 2 * r, 14));
  });
  const img = st.addImage(ctx.getImage()); img.imageSize = new Size(w, h);
}

// ---------- widget ----------
const fam = config.widgetFamily || "large";
const w = new ListWidget();
w.backgroundColor = c(COL.bg);
w.setPadding(16, 16, 16, 16);
w.url = URLScheme.forRunningScript() + "?open=1";
w.refreshAfterDate = new Date(Date.now() + 3 * 3600e3);
const W = fam === "small" ? 130 : 300;

// countdown
const top = w.addStack(); top.layoutHorizontally(); top.centerAlignContent();
const tl = top.addStack(); tl.layoutVertically();
if (left == null) { txt(tl, "מתי טסים?", fam === "small" ? 18 : 22, COL.ink, "medium"); txt(tl, "קובעים תאריך באתר", 12, COL.ink3); }
else if (left > 0) { txt(tl, fmt(left), fam === "small" ? 40 : 48, COL.ink, "medium"); txt(tl, "ימים לטיסה", 13, COL.ink2); }
else { txt(tl, "בדרכים", fam === "small" ? 26 : 32, COL.ink, "medium"); if (stop) txt(tl, stop.label, 13, COL.ink2); }
top.addSpacer();

if (fam !== "small") {
  const tr = top.addStack(); tr.layoutVertically();
  txt(tr, "הטיול הגדול", 12, COL.ink3);
  if (totalDays) txt(tr, `${totalDays} ימים · ${D.r.length} יעדים`, 12, COL.ink3);
}

w.addSpacer(fam === "small" ? 8 : 12);

// next destination
if (stop) {
  txt(w, fam === "small" ? stop.r[0] : `${left > 0 ? "היעד הראשון" : "עכשיו"}: ${stop.r[0]}`, fam === "small" ? 13 : 15, COL.ink, "medium").lineLimit = 1;
  if (fam !== "small") { const s = txt(w, `${stop.r[1] ? stop.r[1] + " · " : ""}${stop.r[3] || ""}`, 12, COL.ink2); s.lineLimit = 1; }
  if (fam === "large") { w.addSpacer(10); routeLine(w, W, D.r, left > 0 ? -1 : stop.i); }
}

w.addSpacer(fam === "small" ? 8 : 12);

// savings
const sv = w.addStack(); sv.layoutHorizontally();
const svl = sv.addStack(); svl.layoutVertically();
txt(svl, `₪${fmt(D.s)}`, fam === "small" ? 13 : 15, COL.ink, "medium");
txt(svl, fam === "small" ? `מתוך ${fmt(D.g)}` : `חסכתי מתוך ₪${fmt(D.g)}`, 11, COL.ink3);
sv.addSpacer();
if (fam !== "small" && perMonth) { const r = sv.addStack(); r.layoutVertically(); txt(r, `₪${fmt(perMonth)}`, 15, COL.ink, "medium"); txt(r, "צריך לחסוך בחודש", 11, COL.ink3); }
w.addSpacer(6);
bar(w, W, pct);

// next tasks
if (fam === "large" && D.t.length) {
  w.addSpacer(14);
  txt(w, "המשימות הבאות", 12, COL.ink3);
  w.addSpacer(4);
  D.t.slice(0, 3).forEach(t => {
    const row = w.addStack(); row.layoutHorizontally(); row.centerAlignContent();
    const a = txt(row, t[0], 13, COL.ink); a.lineLimit = 1;
    row.addSpacer();
    txt(row, t[1], 11, COL.ink3);
    w.addSpacer(4);
  });
}

if (!D.r.length && fam !== "small") { w.addSpacer(8); txt(w, "כדי לראות כאן את המסלול: באתר, עוד ← סנכרון לווידג'ט", 11, COL.ink3); }

w.addSpacer();

if (config.runsInWidget) Script.setWidget(w);
else if (fam === "small") await w.presentSmall();
else if (fam === "medium") await w.presentMedium();
else await w.presentLarge();
Script.complete();
