import { renderMeta, SITE } from './meta.js';
import { CODE_RE, isValidCode } from './code.js';

const EVENTS = new Set(['created', 'opened', 'revealed', 'replay', 'make_your_own_click', 'share_native', 'reaction', 'reply', 'download']);
// Optional detail, from a fixed list per event. Free text never reaches analytics.
const DETAILS = { reaction: new Set(['love', 'haha', 'wow', 'yay']), download: new Set(['gif', 'mp4', 'webm']) };
const PAGES = new Set(['home', 'surprise', 'error', 'lost']);
const SAFE_ASSETS = new Set(['/app.js', '/logo.svg', '/wordmark.svg', '/favicon.svg', '/favicon.ico', '/favicon-32.png', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png', '/og.png', '/og-message.png', '/site.webmanifest']);
const PREVIEW_HOST = 'pixelmob.worldwidewebb.workers.dev';
const POLICY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer', // never send a message code as a referrer
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  // SAMEORIGIN: the page frames itself (hidden) to record GIF/video downloads. Nobody else can frame it.
  'X-Frame-Options': 'SAMEORIGIN',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' https://static.cloudflareinsights.com 'sha256-REPLACE_JSONLD_HASH'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'self' https://cloudflareinsights.com; frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self'",
};
function reply(body, status = 200, headers = {}) {
  const h = new Headers({ ...POLICY, 'Cache-Control': 'no-store', ...headers });
  // JSON-LD is a non-executable data block; use its hash in production via the build rather than unsafe-inline.
  h.set('Content-Security-Policy', h.get('Content-Security-Policy').replace(" 'sha256-REPLACE_JSONLD_HASH'", ''));
  return new Response(body, { status, headers: h });
}
function redirect(to, status = 308) { return reply(null, status, { Location: to, 'Cache-Control': 'public,max-age=3600' }); }
function plain(body, type = 'text/plain; charset=utf-8', status = 200) { return reply(body, status, { 'Content-Type': type }); }
const methodNotAllowed = (allow) => reply(null, 405, { Allow: allow });

async function limitedBody(req, max) {
  if (!req.body) return '';
  const reader = req.body.getReader();
  let n = 0, chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      n += value.byteLength;
      if (n > max) { await reader.cancel(); return null; }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const b = new Uint8Array(n); let off = 0;
  for (const v of chunks) { b.set(v, off); off += v.length; }
  return new TextDecoder().decode(b);
}

export async function ingest(req, env) {
  if (req.method !== 'POST') return methodNotAllowed('POST');
  const url = new URL(req.url), origin = req.headers.get('Origin');
  // No CORS. Origin must match this exact host. The browser also tells us if this is cross-site.
  // Safari sends `Origin: null` for beacons from pages with Referrer-Policy: no-referrer, so a null origin
  // is accepted only when the browser doesn't say the request is cross-site.
  const site = req.headers.get('Sec-Fetch-Site');
  if ((origin && origin !== 'null' && origin !== url.origin) || ['cross-site', 'same-site'].includes(site)) return reply(null, 403);
  if (/bot|crawler|spider|headless/i.test(req.headers.get('User-Agent') || '')) return reply(null, 204);
  const ct = req.headers.get('Content-Type') || '';
  if (!/^(text\/plain|application\/json)(;|$)/i.test(ct)) return reply(null, 415);
  const len = req.headers.get('Content-Length');
  if (len && (!/^\d+$/.test(len) || Number(len) > 96)) return reply(null, 413);
  if (!env.MOB_EVENTS) return reply(null, 503, { 'Retry-After': '60' });
  // Rate-limit only. Neither the IP nor any derivative is written to analytics, logs or a database.
  const ip = req.headers.get('CF-Connecting-IP') || 'local';
  if (env.EVENT_LIMITER) {
    const result = await env.EVENT_LIMITER.limit({ key: ip });
    if (!result.success) return reply(null, 429, { 'Retry-After': '60' });
  }
  const raw = await limitedBody(req, 96);
  if (raw === null) return reply(null, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return reply(null, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((k) => !['e', 'p', 'd'].includes(k)) || !EVENTS.has(body.e) || !PAGES.has(body.p)) return reply(null, 400);
  if (body.d !== undefined && !(DETAILS[body.e] && DETAILS[body.e].has(body.d))) return reply(null, 400);
  const country = /^[A-Z]{2}$/.test(req.cf?.country || '') ? req.cf.country : 'XX';
  env.MOB_EVENTS.writeDataPoint({ indexes: ['v1'], blobs: [body.e, country, body.p, body.d || ''], doubles: [1] });
  return reply(null, 204);
}

async function html(req, env, kind, path, status = 200) {
  const u = new URL(req.url); u.pathname = '/index.html'; u.search = '';
  const asset = await env.ASSETS.fetch(new Request(u, { method: 'GET' }));
  if (!asset.ok) return plain('Pixel Mob is taking a tiny break. Please try again soon.', 'text/plain; charset=utf-8', 503);
  let body = await asset.text();
  // Cloudflare Web Analytics deliberately only runs on the landing/creator. Link paths are private,
  // so neither Web Analytics nor Workers request logs ever receive the code.
  const beacon = ['landing', 'new'].includes(kind) && !new URL(req.url).searchParams.has('capture') && /^[a-f0-9]{32}$/.test(env.WEB_ANALYTICS_TOKEN || '') ? env.WEB_ANALYTICS_TOKEN : '';
  const meta = renderMeta(kind, { path, beacon });
  body = body.replace(/<!--META-->[\s\S]*?<!--\/META-->/, `<!--META-->\n${meta}\n<!--/META-->`);
  const headers = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' };
  if (kind === 'message' || kind === 'scrambled') {
    headers['X-Robots-Tag'] = 'noindex, nofollow, noarchive';
    // Don't expose landing content to crawlers on private share pages (or flash it before JS paints).
    body = body.replace('<html lang="en" data-app="">', `<html lang="en" data-app="${kind === 'message' ? 'surprise' : 'error'}">`);
    body = body.replace(/<main id="landing">[\s\S]*?<\/main>/, '');
  } else if (kind === 'lost') {
    headers['X-Robots-Tag'] = 'noindex';
    body = body.replace('<html lang="en" data-app="">', '<html lang="en" data-app="lost">');
  }
  // CSP allow-lists only our static JSON-LD block. The interactive code lives in /app.js.
  const ld = body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  const res = reply(req.method === 'HEAD' ? null : body, status, headers);
  if (ld) {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ld));
    const digest = btoa(String.fromCharCode(...new Uint8Array(hash)));
    res.headers.set('Content-Security-Policy', res.headers.get('Content-Security-Policy').replace("script-src 'self'", `script-src 'self' 'sha256-${digest}'`));
  }
  if (u.hostname.endsWith('.workers.dev')) res.headers.set('X-Robots-Tag', 'noindex');
  return res;
}

async function office(req, env) {
  const url = new URL(req.url), path = url.pathname;
  if (path === '/the-office') return redirect(url.origin + '/the-office/' + url.search);
  const au = new URL(req.url);
  if (au.pathname.endsWith('/')) au.pathname += 'index.html';
  const res = await env.ASSETS.fetch(new Request(au, { method: 'GET' }));
  if (res.status === 404) return html(req, env, 'lost', path, 404);
  const h = new Headers(res.headers);
  if (/\.wasm$/.test(path)) h.set('Content-Type', 'application/wasm');
  if (/\.js$/.test(path)) h.set('Content-Type', 'text/javascript; charset=utf-8');
  if (/\.html$/.test(path) || path.endsWith('/')) h.set('Cache-Control', 'no-cache');
  else if (/[.-][a-f0-9]{8,}\./i.test(path)) h.set('Cache-Control', 'public,max-age=31536000,immutable');
  else h.set('Cache-Control', 'public,max-age=3600');
  h.set('X-Content-Type-Options', 'nosniff'); h.set('Referrer-Policy', 'no-referrer');
  // Bevy can require WASM compilation; keep these headers scoped to the game, not share links.
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  h.set('Cross-Origin-Embedder-Policy', 'require-corp');
  h.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
  return new Response(req.method === 'HEAD' ? null : res.body, { status: res.status, headers: h });
}

// ---------- /stats: private, password-less, unguessable key in ?k= (Worker secret STATS_KEY) ----------
async function sameSecret(a, b) {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  return crypto.subtle.timingSafeEqual(x, y);
}
const LABEL = { created: 'Links created', opened: 'Links opened', revealed: 'Reveals', replay: 'Replays', reaction: 'Reactions', reply: 'Replies started', download: 'Downloads', make_your_own_click: '“Make your own” taps', share_native: 'Native shares' };
const DETAIL_LABEL = { love: '❤️ Love', haha: '😂 Haha', wow: '😮 Wow', yay: '🙌 Yay', gif: 'GIF', mp4: 'MP4 video', webm: 'WebM video' };
async function aeQuery(env, sql) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`, {
    method: 'POST', headers: { Authorization: `Bearer ${env.STATS_API_TOKEN}`, 'Content-Type': 'text/plain' }, body: sql });
  if (!r.ok) throw new Error(`Analytics Engine responded ${r.status}`);
  return (await r.json()).data || [];
}
async function stats(req, env) {
  const url = new URL(req.url), k = url.searchParams.get('k') || '';
  const nf = () => html(req, env, 'lost', '/stats', 404);
  if (!env.STATS_KEY || env.STATS_KEY.length < 32 || !(await sameSecret(k, env.STATS_KEY))) return nf();
  const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get('d') || '7', 10) || 7));
  let rows = [], countries = [], daily = [], details = [], err = '';
  if (env.STATS_API_TOKEN && env.CF_ACCOUNT_ID) {
    try {
      const w = `timestamp > NOW() - INTERVAL '${days}' DAY`;
      [rows, countries, daily, details] = await Promise.all([
        aeQuery(env, `SELECT blob1 AS event, SUM(_sample_interval) AS n FROM pixelmob_events WHERE ${w} GROUP BY event ORDER BY n DESC FORMAT JSON`),
        aeQuery(env, `SELECT blob2 AS country, SUM(_sample_interval) AS n FROM pixelmob_events WHERE ${w} AND blob1 = 'opened' GROUP BY country ORDER BY n DESC LIMIT 15 FORMAT JSON`),
        aeQuery(env, `SELECT toStartOfDay(timestamp) AS day, blob1 AS event, SUM(_sample_interval) AS n FROM pixelmob_events WHERE ${w} GROUP BY day, event ORDER BY day FORMAT JSON`),
        aeQuery(env, `SELECT blob1 AS event, blob4 AS detail, SUM(_sample_interval) AS n FROM pixelmob_events WHERE ${w} AND blob1 IN ('reaction', 'download') GROUP BY event, detail ORDER BY n DESC FORMAT JSON`),
      ]);
    } catch (e) { err = 'Couldn’t reach Analytics Engine right now. Try again in a minute.'; }
  } else err = 'Stats storage is connected, but the read-only query token hasn’t been added yet.';
  const by = Object.fromEntries(rows.map((r) => [r.event, Number(r.n)]));
  const e = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const opened = by.opened || 0, revealed = by.revealed || 0;
  const rate = opened ? Math.round((revealed / opened) * 100) + '%' : '—';
  const dayMap = new Map();
  for (const r of daily) { const d = String(r.day).slice(0, 10); if (!dayMap.has(d)) dayMap.set(d, {}); dayMap.get(d)[r.event] = Number(r.n); }
  const maxDay = Math.max(1, ...[...dayMap.values()].map((v) => v.opened || 0));
  const flag = (cc) => /^[A-Z]{2}$/.test(cc) && cc !== 'XX' ? String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0))) : '🌐';
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Stats · Pixel Mob</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><style>
:root{--ink:#2d2420;--paper:#f4f2ee;--card:#fffdf8;--muted:#746c62;--accent:#e2483d;--sh-card:-6px 6px 0}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.5 -apple-system,BlinkMacSystemFont,Inter,"Segoe UI",sans-serif;padding:max(24px,env(safe-area-inset-top)) 20px 48px}
main{max-width:920px;margin:auto}header{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:28px}h1{font-size:28px;letter-spacing:-.04em;margin:18px 0 4px}p{color:var(--muted);margin:0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin:24px 0}.card{background:var(--card);border:2px solid var(--ink);border-radius:14px;box-shadow:var(--sh-card) var(--ink);padding:16px}
.n{font:800 34px/1.1 ui-monospace,SFMono-Regular,monospace;letter-spacing:-.04em}.l{font-size:13px;color:var(--muted)}nav a{color:var(--ink);font-weight:650;text-decoration:none;border:2px solid var(--ink);border-radius:9px;padding:7px 10px;margin-left:6px;background:var(--card);box-shadow:-3px 3px 0 var(--ink)}nav a[aria-current]{background:var(--ink);color:#fff}
table{width:100%;border-collapse:collapse}td{padding:8px 0;border-top:1px solid #e1d9ce}td:last-child{text-align:right;font-family:ui-monospace,monospace}.bar{height:8px;background:#efe6da;border-radius:4px;overflow:hidden}.bar i{display:block;height:100%;background:var(--accent)}
.err{border-color:var(--accent);margin-top:20px}.foot{font-size:12px;margin-top:28px}</style></head><body><main>
<header><img src="/wordmark.svg" width="210" height="30" alt="Pixel Mob"><nav aria-label="Range">${[1, 7, 30, 90].map((d) => `<a href="?k=${encodeURIComponent(k)}&d=${d}"${d === days ? ' aria-current="page"' : ''}>${d}d</a>`).join('')}</nav></header>
<h1>How the mob is doing</h1><p>Last ${days} day${days > 1 ? 's' : ''}. Anonymous event counts only: no messages, link codes or IP addresses are stored.</p>
${err ? `<div class="card err">${e(err)}</div>` : ''}
<div class="grid">${Object.keys(LABEL).map((ev) => `<div class="card"><div class="n">${(by[ev] || 0).toLocaleString('en-US')}</div><div class="l">${LABEL[ev]}</div></div>`).join('')}<div class="card"><div class="n">${rate}</div><div class="l">Opened → revealed</div></div></div>
<div class="grid"><div class="card"><strong>Opens by day</strong><table>${[...dayMap].map(([d, v]) => `<tr><td>${d}</td><td style="width:50%"><div class="bar"><i style="width:${Math.round(((v.opened || 0) / maxDay) * 100)}%"></i></div></td><td>${v.opened || 0}</td></tr>`).join('') || '<tr><td>No opens yet</td><td></td></tr>'}</table></div>
<div class="card"><strong>Opens by country</strong><table>${countries.map((c) => `<tr><td>${flag(c.country)} ${e(c.country === 'XX' ? 'Unknown' : c.country)}</td><td>${Number(c.n).toLocaleString('en-US')}</td></tr>`).join('') || '<tr><td>No opens yet</td><td></td></tr>'}</table></div></div>
<div class="grid">${['reaction', 'download'].map((ev) => `<div class="card"><strong>${ev === 'reaction' ? 'Reactions' : 'Downloads'} by type</strong><table>${details.filter((r) => r.event === ev).map((r) => `<tr><td>${e(DETAIL_LABEL[r.detail] || 'Other')}</td><td>${Number(r.n).toLocaleString('en-US')}</td></tr>`).join('') || `<tr><td>No ${ev === 'reaction' ? 'reactions' : 'downloads'} yet</td><td></td></tr>`}</table></div>`).join('')}</div>
<p class="foot">Counts can be sampled at very high volume, so we weight them by Analytics Engine’s sample interval. Keep this URL private.</p></main></body></html>`;
  return reply(body, 200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'" });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), path = url.pathname;
    if (url.hostname === 'www.pixelmob.io') return redirect(SITE + path + url.search);
    if (req.method !== 'GET' && req.method !== 'HEAD' && path !== '/api/event') return methodNotAllowed('GET, HEAD');
    if (path === '/api/event') return ingest(req, env);
    if (path === '/stats') return stats(req, env);
    if (path === '/the-office' || path.startsWith('/the-office/')) return office(req, env);
    if (path === '/robots.txt') return plain(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /stats\nDisallow: /s/\nDisallow: /the-office/\n\nSitemap: ${SITE}/sitemap.xml\n`);
    if (path === '/sitemap.xml') return plain(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE}/</loc></url><url><loc>${SITE}/new</loc></url></urlset>`, 'application/xml; charset=utf-8');
    if (path === '/create' || path === '/new/' || (path === '/' && url.searchParams.has('create'))) return redirect(url.origin + '/new');
    if (path === '/index.html') return redirect(url.origin + '/');
    if (path === '/') {
      const legacy = url.searchParams.get('s');
      if (legacy && isValidCode(legacy)) return redirect(url.origin + '/' + legacy);
      return html(req, env, 'landing', '/');
    }
    if (path === '/new') return html(req, env, 'new', '/new');
    const legacy = path.match(/^\/s\/([A-Za-z0-9_-]{6,180})\/?$/);
    if (legacy) return isValidCode(legacy[1]) ? redirect(url.origin + '/' + legacy[1]) : html(req, env, 'scrambled', path, 404);
    if (SAFE_ASSETS.has(path)) {
      const res = await env.ASSETS.fetch(req);
      const h = new Headers(res.headers);
      h.set('X-Content-Type-Options', 'nosniff');
      h.set('Cache-Control', path === '/app.js' || path.endsWith('.webmanifest') ? 'public,max-age=0,must-revalidate' : 'public,max-age=3600');
      if (path.endsWith('.webmanifest')) h.set('Content-Type', 'application/manifest+json');
      return new Response(req.method === 'HEAD' ? null : res.body, { status: res.status, headers: h });
    }
    // Reserved namespaces always win over the code matcher.
    if (/^\/(api|stats|s|new|create|the-office)(\/|$)/.test(path)) return html(req, env, 'lost', path, 404);
    const code = path.match(/^\/([A-Za-z0-9_-]{6,180})\/?$/)?.[1];
    if (code && isValidCode(code)) {
      if (path.endsWith('/')) return redirect(url.origin + '/' + code);
      return html(req, env, 'message', '/' + code);
    }
    if (code && CODE_RE.test(code)) return html(req, env, 'scrambled', path, 404);
    return html(req, env, 'lost', path, 404);
  },
};
