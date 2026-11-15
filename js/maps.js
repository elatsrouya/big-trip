// One map API over two engines: Google Maps (when the key and quota allow) or MapLibre + OpenFreeMap (free).
import { GOOGLE_KEY } from './config.js';
import { take, googleOn, trip } from './quota.js';

const loaded = {};
function script(src) {
  return loaded[src] ||= new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
}
function css(href) { if (document.querySelector(`link[href="${href}"]`)) return; const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }

let gPromise;
export function loadGoogle() {
  if (!googleOn()) return Promise.reject('off');
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
  return gPromise ||= new Promise((res, rej) => {
    window.__gmReady = () => res(window.google.maps);
    window.gm_authFailure = () => { trip('auth'); rej('auth'); };
    script(`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&v=weekly&language=en&region=IL&loading=async&callback=__gmReady`).catch(rej);
  });
}
const ML = 'vendor/maplibre-gl';
async function loadLibre() { css(ML + '.css'); await script(ML + '.js'); return window.maplibregl; }

export async function createMap(el, { center = [16, 102], zoom = 4 } = {}) {
  el.innerHTML = '';
  if (googleOn() && take('map')) {
    try {
      const gm = await loadGoogle();
      const { Map } = await gm.importLibrary('maps');
      const { AdvancedMarkerElement } = await gm.importLibrary('marker');
      const map = new Map(el, { center: { lat: center[0], lng: center[1] }, zoom, mapId: 'DEMO_MAP_ID', disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy', clickableIcons: true });
      const items = [];
      return {
        kind: 'google',
        marker(lat, lon, node, onClick) { const m = new AdvancedMarkerElement({ map, position: { lat, lng: lon }, content: node }); if (onClick) m.addListener('click', onClick); items.push(m); return m; },
        line(pts, color) { const l = new gm.Polyline({ map, path: pts.map(([a, b]) => ({ lat: a, lng: b })), strokeColor: color, strokeOpacity: 0, icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: .9, strokeWeight: 3, scale: 3 }, offset: '0', repeat: '14px' }] }); items.push(l); return l; },
        fit(pts, maxZoom = 8) { if (!pts.length) return; if (pts.length === 1) { map.setCenter({ lat: pts[0][0], lng: pts[0][1] }); map.setZoom(Math.min(maxZoom, 9)); return; } const b = new gm.LatLngBounds(); pts.forEach(([a, c]) => b.extend({ lat: a, lng: c })); map.fitBounds(b, 40); gm.event.addListenerOnce(map, 'idle', () => { if (map.getZoom() > maxZoom) map.setZoom(maxZoom); }); },
        clear() { items.splice(0).forEach(x => { if (x.setMap) x.setMap(null); else x.map = null; }); },
        remove() { this.clear(); el.innerHTML = ''; },
        source: 'Google Maps',
      };
    } catch (e) { /* fall through to free map */ }
  }
  const ml = await loadLibre();
  const map = new ml.Map({ container: el, style: 'https://tiles.openfreemap.org/styles/liberty', center: [center[1], center[0]], zoom: zoom - 1, attributionControl: false, dragRotate: false, pitchWithRotate: false });
  map.touchZoomRotate.disableRotation();
  map.addControl(new ml.NavigationControl({ showCompass: false }), 'bottom-left');
  map.addControl(new ml.AttributionControl({ compact: true }), 'bottom-right');
  // English labels: MapLibre draws Hebrew mirrored without an extra RTL plugin.
  map.on('styledata', () => {
    for (const l of map.getStyle().layers) if (l.type === 'symbol' && l.layout?.['text-field']) {
      try { map.setLayoutProperty(l.id, 'text-field', ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name:latin'], ['get', 'name']]); } catch {}
    }
  });
  const ready = new Promise(r => map.on('load', r));
  const items = []; let lineN = 0;
  return {
    kind: 'free',
    marker(lat, lon, node, onClick) { const m = new ml.Marker({ element: node }).setLngLat([lon, lat]).addTo(map); if (onClick) node.addEventListener('click', e => { e.stopPropagation(); onClick(); }); items.push(m); return m; },
    async line(pts, color) {
      await ready; const id = 'ln' + (++lineN);
      map.addSource(id, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: pts.map(([a, b]) => [b, a]) } } });
      map.addLayer({ id, type: 'line', source: id, paint: { 'line-color': color, 'line-width': 3, 'line-dasharray': [2, 1.5] } });
      items.push({ remove: () => { map.removeLayer(id); map.removeSource(id); } });
    },
    fit(pts, maxZoom = 8) { if (!pts.length) return; if (pts.length === 1) { map.jumpTo({ center: [pts[0][1], pts[0][0]], zoom: Math.min(maxZoom, 9) - 1 }); return; } const b = new ml.LngLatBounds(); pts.forEach(([a, c]) => b.extend([c, a])); map.fitBounds(b, { padding: 40, maxZoom: maxZoom - 1, duration: 0 }); },
    clear() { items.splice(0).forEach(x => x.remove()); },
    remove() { map.remove(); },
    source: '© OpenStreetMap · OpenFreeMap',
  };
}
