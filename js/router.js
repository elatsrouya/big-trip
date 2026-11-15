const routes = {};
export function route(name, fn) { routes[name] = fn; }
export function go(path) { if (location.hash.slice(1) === path) render(); else location.hash = path; }
export function current() { const h = location.hash.replace(/^#\/?/, '') || 'home'; const [name, ...rest] = h.split('/'); return { name, arg: rest.join('/') }; }
let cleanup = null;
export function render() {
  const { name, arg } = current();
  const fn = routes[name] || routes.home;
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  const el = document.getElementById('view');
  cleanup = fn(el, arg) || null;
  document.querySelectorAll('nav.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tabOf(name)));
}
const TAB = { home: 'home', route: 'route', discover: 'discover', feed: 'discover', budget: 'budget' };
function tabOf(n) { return TAB[n] || 'more'; }
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
