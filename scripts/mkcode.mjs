// usage: node scripts/mkcode.mjs '{"scenes":["HI"],"theme":"birthday"}'  -> prints a share code
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../src/glyphs.js', import.meta.url), 'utf8').replace(/^\s*\(\(\) => \{\s*'use strict';/, '');
const L = new Function(src + '\nreturn {encodePayload,cleanText};')();
const m = JSON.parse(process.argv[2]);
console.log(L.encodePayload(m));
