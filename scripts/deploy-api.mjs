// Builds the Cloudflare API payload for an Analytics-Engine + rate-limit Worker with embedded site/ assets.
// Output: .deploy/execute.js, an async arrow function for the Cloudflare MCP `execute` tool. Never commit .deploy/.
// Usage: node scripts/deploy-api.mjs [--with-stats-token]
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
const root = resolve(new URL('..', import.meta.url).pathname);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.json': 'application/json', '.css': 'text/css; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
async function walk(d) { const out = []; for (const f of await readdir(d)) { const p = resolve(d, f); (await stat(p)).isDirectory() ? out.push(...await walk(p)) : out.push(p); } return out; }
const files = {};
for (const f of await walk(resolve(root, 'site'))) {
  const buf = await readFile(f);
  if (buf.length > 1.5e6) throw new Error(`${f} is too big to embed; deploy it with Wrangler static assets`);
  files['/' + relative(resolve(root, 'site'), f)] = { t: TYPES[extname(f)] || 'application/octet-stream', b: buf.toString('base64'), e: '"' + createHash('sha256').update(buf).digest('hex').slice(0, 20) + '"' };
}
const embedded = `const FILES = ${JSON.stringify(files)};
const cache = new Map();
const bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
export class EmbeddedAssets {
  async fetch(input) {
    const req = input instanceof Request ? input : new Request(input);
    const path = decodeURIComponent(new URL(req.url).pathname);
    const f = FILES[path];
    if (!f) return new Response('Not found', { status: 404 });
    if (req.headers.get('If-None-Match') === f.e) return new Response(null, { status: 304, headers: { ETag: f.e } });
    if (!cache.has(path)) cache.set(path, bytes(f.b));
    return new Response(req.method === 'HEAD' ? null : cache.get(path), { headers: { 'Content-Type': f.t, ETag: f.e } });
  }
}
`;
const mod = async (p) => (await readFile(resolve(root, p), 'utf8'));
const modules = { 'deploy-entry.js': await mod('worker/deploy-entry.js'), 'index.js': await mod('worker/index.js'), 'meta.js': await mod('worker/meta.js'), 'code.js': await mod('worker/code.js'), 'embedded-assets.js': embedded };
const statsKey = (await readFile(resolve(homedir(), '.config/pixelmob/stats-key'), 'utf8')).trim();
const withToken = process.argv.includes('--with-stats-token');
const code = `async () => {
  const a = accountId, name = 'pixelmob';
  const modules = ${JSON.stringify(modules)};
  const bindings = [
    { type: 'analytics_engine', name: 'MOB_EVENTS', dataset: 'pixelmob_events' },
    { type: 'ratelimit', name: 'EVENT_LIMITER', namespace_id: '1001', simple: { limit: 30, period: 60 } },
    { type: 'plain_text', name: 'WEB_ANALYTICS_TOKEN', text: 'aae05380cc30416e8ed07b16c430bcbc' },
    { type: 'plain_text', name: 'CF_ACCOUNT_ID', text: a },
    { type: 'secret_text', name: 'STATS_KEY', text: ${JSON.stringify(statsKey)} },
  ];
  const out = {};
  ${withToken ? `
  // A read-only, account-scoped Analytics token for /stats. Its value goes straight into a Worker secret and is never returned.
  const existing = (await cloudflare.request({ method: 'GET', path: '/accounts/' + a + '/tokens', query: { per_page: 50 } })).result || [];
  for (const t of existing.filter((t) => t.name === 'pixelmob-stats-read')) await cloudflare.request({ method: 'DELETE', path: '/accounts/' + a + '/tokens/' + t.id });
  const tok = (await cloudflare.request({ method: 'POST', path: '/accounts/' + a + '/tokens', body: { name: 'pixelmob-stats-read', policies: [{ effect: 'allow', resources: { ['com.cloudflare.api.account.' + a]: '*' }, permission_groups: [{ id: 'b89a480218d04ceb98b4fe57ca29dc1f' }] }] } })).result;
  bindings.push({ type: 'secret_text', name: 'STATS_API_TOKEN', text: tok.value });
  out.statsToken = 'created ' + tok.id;` : ''}
  const metadata = { main_module: 'deploy-entry.js', compatibility_date: '2026-11-20', bindings, observability: { enabled: false }, keep_bindings: ${withToken ? "[]" : "['secret_text']"} };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  for (const [n, src] of Object.entries(modules)) form.append(n, new Blob([src], { type: 'application/javascript+module' }), n);
  const up = await cloudflare.request({ method: 'PUT', path: '/accounts/' + a + '/workers/scripts/' + name, body: form });
  out.deployed = { id: up.result.id, etag: up.result.etag, modified: up.result.modified_on };
  await cloudflare.request({ method: 'POST', path: '/accounts/' + a + '/workers/scripts/' + name + '/subdomain', body: { enabled: true, previews_enabled: false } });
  out.workersDev = 'https://' + name + '.' + (await cloudflare.request({ method: 'GET', path: '/accounts/' + a + '/workers/subdomain' })).result.subdomain + '.workers.dev';
  return out;
}`;
await mkdir(resolve(root, '.deploy'), { recursive: true });
await writeFile(resolve(root, '.deploy/execute.js'), code, { mode: 0o600 });
console.log('wrote .deploy/execute.js', code.length, 'bytes', withToken ? '(creates stats token)' : '');
