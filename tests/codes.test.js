// Share-code tests: legacy compatibility, every symbol, drawings, scenes and extras, tamper rejection.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isValidCode } from '../worker/code.js';
const src = readFileSync(new URL('../src/glyphs.js', import.meta.url), 'utf8').replace(/^\s*\(\(\) => \{\s*'use strict';/, '');
const L = new Function(src + '\nreturn {encodeMsg,decodeMsg,encodePayload,decodePayload,sanitize,cleanText,G,ALPHA2,DRAW,toDisplay};')();
test('legacy v1 links still decode', () => {
  for (const [c, t] of [['o8RNMt_7gE3luA', 'HI GEORGE'], ['iO6oiOl7IaxSbQ', 'SURPRISE!'], ['rd__-TgI8Js29Q', 'SURPRISE!']]) { assert.equal(L.decodeMsg(c), t); assert.ok(isValidCode(c)); }
});
test('every printable ASCII symbol round-trips and has a glyph', () => {
  const all = [...Array(95)].map((_, i) => String.fromCharCode(32 + i)).join('');
  const { text, dropped } = L.sanitize(all);
  assert.deepEqual(dropped, []);
  for (const ch of new Set(text)) if (ch !== ' ') assert.ok(L.G[ch], 'glyph for ' + ch);
  for (let i = 0; i < text.length; i += 32) {
    const t = text.slice(i, i + 32).trim(), code = L.encodeMsg(t);
    assert.match(code, /^[A-Za-z0-9_-]+$/); assert.equal(L.decodeMsg(code), t); assert.ok(isValidCode(code));
  }
  for (const t of ['<>=+-.*$#@%^&*1`', '100% ON #1 @ 5 & ? /\\ |', '£5 + €3 = 20° ♥', '{[(~)]} ;:^_^;']) assert.equal(L.decodeMsg(L.encodeMsg(L.cleanText(t))), L.cleanText(t));
});
test('plain messages stay on the short v1 format', () => { assert.ok(L.encodeMsg('HI GEORGE').length <= 14); });
test('emoji become drawings and round-trip', () => {
  const t = L.cleanText('happy bday 🎂🎉 ❤️ 👍🏽');
  assert.equal(L.toDisplay(t), 'HAPPY BDAY 🎂🎉 ❤️ 👍');
  assert.equal(L.decodeMsg(L.encodeMsg(t)), t);
  for (const d of L.DRAW) assert.equal(d[4].split('|').length, 7);
});
test('scenes and extras round-trip, with the longest link under 180 chars', () => {
  const m = { scenes: ['HAPPY', 'BIRTHDAY', '🎂', 'LOVE YOU ❤️'], from: 'george', theme: 'birthday', mob: 3, bg: 1, size: 'huge', at: Date.UTC(2026, 11, 25, 8, 0) };
  const code = L.encodePayload(m), back = L.decodePayload(code);
  assert.deepEqual(back.scenes, ['HAPPY', 'BIRTHDAY', L.cleanText('🎂'), L.cleanText('LOVE YOU ❤️')]);
  assert.equal(back.from, 'GEORGE'); assert.equal(back.theme, 'birthday'); assert.equal(back.mob, 3); assert.equal(back.bg, 1); assert.equal(back.size, 'huge'); assert.equal(back.at, m.at);
  assert.ok(isValidCode(code));
  const big = L.encodePayload({ scenes: ['W'.repeat(32), '#'.repeat(32), '@'.repeat(32), 'Q'.repeat(32)], from: 'X'.repeat(30), theme: 'stadium', mob: 1, bg: 7, size: 'small', at: Date.now() + 864e5 });
  assert.ok(big.length < 180, 'max link length ' + big.length); assert.ok(isValidCode(big));
  assert.equal(L.decodePayload(big).scenes.join('').length, 80);
});
test('tampered codes are rejected', () => {
  const c = L.encodeMsg('HELLO <3'); const bad = c[3] === 'A' ? 'B' : 'A';
  assert.equal(L.decodeMsg(c.slice(0, 3) + bad + c.slice(4)), null); assert.equal(isValidCode(c.slice(0, 3) + bad + c.slice(4)), false);
});
