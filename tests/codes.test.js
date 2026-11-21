// Round-trip and compatibility tests for share codes, run against the built client and the Worker validator.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isValidCode } from '../worker/code.js';
const src = readFileSync(new URL('../src/glyphs.js', import.meta.url), 'utf8').replace(/^\s*\(\(\) => \{\s*'use strict';/, '');
const lib = new Function(src + '\nreturn {encodeMsg,decodeMsg,sanitize,cleanText,G,ALPHA2};')();
test('legacy v1 links still decode', () => {
  for (const [c, t] of [['o8RNMt_7gE3luA', 'HI GEORGE'], ['iO6oiOl7IaxSbQ', 'SURPRISE!'], ['rd__-TgI8Js29Q', 'SURPRISE!']]) { assert.equal(lib.decodeMsg(c), t); assert.ok(isValidCode(c)); }
});
test('every printable ASCII symbol round-trips and has a glyph', () => {
  const all = [...Array(95)].map((_, i) => String.fromCharCode(32 + i)).join('');
  const clean = lib.sanitize(all).text;
  assert.deepEqual(lib.sanitize(all).dropped, []);
  for (const ch of new Set(clean)) if (ch !== ' ') assert.ok(lib.G[ch], 'glyph for ' + ch);
  for (let i = 0; i < clean.length; i += 32) {
    const t = clean.slice(i, i + 32).trim(); const code = lib.encodeMsg(t);
    assert.match(code, /^[A-Za-z0-9_-]+$/); assert.equal(lib.decodeMsg(code), t); assert.ok(isValidCode(code)); assert.ok(code.length <= 90);
  }
  for (const t of ['<>=+-.*$#@%^&*1`', '100% ON #1 @ 5 & ? /\\ |', '£5 + €3 = 20° ♥', '{[(~)]} ;:^_^;']) assert.equal(lib.decodeMsg(lib.encodeMsg(lib.cleanText(t))), lib.cleanText(t));
});
test('plain messages stay on the short v1 format', () => { assert.ok(lib.encodeMsg('HI GEORGE').length <= 14); });
test('tampered codes are rejected', () => {
  const c = lib.encodeMsg('HELLO <3'); const bad = (c[3] === 'A' ? 'B' : 'A');
  assert.equal(lib.decodeMsg(c.slice(0, 3) + bad + c.slice(4)), null); assert.equal(isValidCode(c.slice(0, 3) + bad + c.slice(4)), false);
});
