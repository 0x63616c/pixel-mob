// Share-code validation: same format as src/glyphs.js (salted XOR stream + 16-bit checksum, base64url).
// The Worker only checks that a code is well formed; it never decodes, stores or logs the message.
const KEY = [0x6c, 0x31, 0x74, 0x74, 0x6c, 0x65, 0x2d, 0x6d, 0x33, 0x6e, 0x9e, 0x42, 0xd7, 0x18, 0xa5, 0x5b];
const ks = (salt, i) => (KEY[i % KEY.length] + salt * 29 + i * 71 + ((i * i) % 13)) & 255;
function fnv16(arr) { let h = 0x811c9dc5; for (const b of arr) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; } return (h ^ (h >>> 16)) & 0xffff; }
export const CODE_RE = /^[A-Za-z0-9_-]{6,90}$/;
export function isValidCode(code) {
  if (!CODE_RE.test(code)) return false;
  let s = code.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  let bin;
  try { bin = atob(s); } catch { return false; }
  const r = Array.from(bin, (c) => c.charCodeAt(0));
  if (r.length < 4 || r.length > 64) return false;
  const salt = r[0] ^ 0xa7;
  const raw = r.slice(1).map((b, i) => b ^ ks(salt, i));
  const packed = raw.slice(0, -2);
  // v1 checksum, or v2's tagged checksum (see src/glyphs.js)
  return [fnv16([salt, ...packed]), fnv16([salt, 0x5d, ...packed])].some((cs) => (cs & 255) === raw[raw.length - 2] && cs >> 8 === raw[raw.length - 1]);
}
