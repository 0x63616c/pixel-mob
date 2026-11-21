
let away0 = null, awaySecs = 0;
document.addEventListener('visibilitychange', () => { if (document.hidden) away0 = performance.now(); else if (away0 !== null) { awaySecs = (performance.now() - away0) / 1000; away0 = null; } });
export function js_report_error(s) { console.error('[office] ' + s); window.__officeError = s; }
export function js_query() { return location.search || ''; }
export function js_hidden() { return !!document.hidden; }
export function js_away_secs() { const s = awaySecs; awaySecs = 0; return s; }
export function js_hide_loader() { if (window.__hideLoader) window.__hideLoader(); }
export function js_export(s) { try { window.__office = JSON.parse(s); } catch (e) {} }
export function js_take_command() { const c = window.__officeCmd || ''; window.__officeCmd = ''; return c; }
export function js_safe_area() {
  let p = document.getElementById('__safe');
  if (!p) { p = document.createElement('div'); p.id = '__safe'; p.style.cssText = 'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'; document.body.appendChild(p); }
  const cs = getComputedStyle(p); return [parseFloat(cs.paddingTop)||0, parseFloat(cs.paddingRight)||0, parseFloat(cs.paddingBottom)||0, parseFloat(cs.paddingLeft)||0];
}
export function js_toggle_fullscreen() {
  const d = document, el = d.documentElement;
  const fs = d.fullscreenElement || d.webkitFullscreenElement;
  try {
    if (fs) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); }
    else if (el.requestFullscreen) { el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); }
    else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
  } catch (e) {}
}
export function js_is_fullscreen() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
