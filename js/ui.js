export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const dot = col => `<span class="cdot" style="--c:${col}" aria-hidden="true"></span>`;
export const icon = (n, cls = '') => `<i data-lucide="${n}" class="${cls}"></i>`;
export function paintIcons(root = document) { window.lucide?.createIcons({ attrs: { class: 'i' }, root }); }

/* image slot: <div class="ph" data-img> filled later */
export function ph(cls = '', ratio) { return `<div class="ph ${cls}" ${ratio ? `style="aspect-ratio:${ratio}"` : ''}><div class="skel"></div></div>`; }
export function fillPh(el, img) {
  if (!el) return;
  if (!img?.src) { el.querySelector('.skel')?.remove(); el.classList.add('noimg'); return; }
  const i = new Image(); i.alt = ''; i.decoding = 'async'; i.loading = 'lazy'; i.referrerPolicy = 'no-referrer';
  i.onload = () => { i.classList.add('ld'); el.querySelector('.skel')?.remove(); };
  i.onerror = () => { el.querySelector('.skel')?.remove(); i.remove(); };
  i.src = img.src; el.prepend(i);
  if (img.credit) { const c = document.createElement(img.href ? 'a' : 'span'); c.className = 'credit'; c.textContent = img.credit; if (img.href) { c.href = img.href; c.target = '_blank'; c.rel = 'noopener'; } el.appendChild(c); }
}

/* bottom sheet */
let open = null;
export function sheet(html, { onClose } = {}) {
  closeSheet(true);
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true');
  sh.innerHTML = `<div class="grab"></div><button class="close" aria-label="סגירה">${icon('x')}</button><div class="sb">${html}</div>`;
  document.body.append(scrim, sh);
  paintIcons(sh);
  requestAnimationFrame(() => { scrim.classList.add('on'); sh.classList.add('on'); });
  const close = () => closeSheet();
  scrim.onclick = close; sh.querySelector('.close').onclick = close;
  // drag down to dismiss
  const grab = sh.querySelector('.grab'), body = sh.querySelector('.sb'); let y0 = null, t0 = 0, dy = 0;
  const start = e => { if (body.scrollTop > 0 && e.currentTarget === body) return; y0 = e.touches[0].clientY; t0 = Date.now(); dy = 0; sh.style.transition = 'none'; };
  const move = e => { if (y0 == null) return; dy = e.touches[0].clientY - y0; if (dy < 0) dy *= .2; sh.style.transform = `translateY(${dy}px)`; };
  const end = () => { if (y0 == null) return; sh.style.transition = ''; const v = dy / (Date.now() - t0); if (dy > 120 || v > .5) close(); else sh.style.transform = ''; y0 = null; };
  [grab, body].forEach(x => { x.addEventListener('touchstart', start, { passive: true }); x.addEventListener('touchmove', move, { passive: true }); x.addEventListener('touchend', end); });
  open = { scrim, sh, onClose };
  document.addEventListener('keydown', escKey);
  return body;
}
function escKey(e) { if (e.key === 'Escape') closeSheet(); }
export function closeSheet(instant) {
  if (!open) return; const { scrim, sh, onClose } = open; open = null;
  document.removeEventListener('keydown', escKey);
  if (instant) { scrim.remove(); sh.remove(); } else { scrim.classList.remove('on'); sh.classList.remove('on'); sh.style.transform = ''; setTimeout(() => { scrim.remove(); sh.remove(); }, 380); }
  onClose?.();
}

export function toast(msg) {
  $$('.toast').forEach(t => t.remove());
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2400);
}
