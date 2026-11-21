import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMeta } from '../worker/meta.js';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (p) => readFile(resolve(root, p), 'utf8');
const out = (p, v) => writeFile(resolve(root, p), v);
await mkdir(resolve(root, 'site'), { recursive: true });
const parts = await Promise.all(['glyphs', 'sprites', 'sound', 'world', 'capture', 'ui'].map((s) => read(`src/${s}.js`)));
const glyphs = parts[0].replace(/^\s*\(\(\) => \{\s*'use strict';\s*/, '');
const script = `(() => {\n'use strict';\n${[glyphs, ...parts.slice(1)].join('\n')}`;
new Function(script); // fail the build on any syntax error
await out('site/app.js', script);
const head = (await read('src/head.html')).replace(/<script>\s*\(\(\) => \{\s*'use strict';\s*$/, '');
const html = head.replace(/<!--META-->[\s\S]*?<!--\/META-->/, '<!--META-->\n' + renderMeta('landing') + '\n<!--/META-->') + '\n<noscript><div style="position:relative;z-index:10;padding:20px;background:#fffdf8">Pixel Mob needs JavaScript to bring the crowd to life. Please enable it, then reload.</div></noscript>\n<script defer src="/app.js"></script>\n</body>\n</html>\n';
await out('site/index.html', html);
console.log('Pixel Mob build:', html.length, 'bytes HTML,', script.length, 'bytes JS');
