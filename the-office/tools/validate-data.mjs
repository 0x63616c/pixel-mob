#!/usr/bin/env node
// Validate game/assets/data/company.json (the Bevy/serde export).
// Run: node tools/validate-data.mjs [path/to/company.json]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_JSON = path.join(ROOT, "game/assets/data/company.json");
const DEFAULT_SCHEMA = path.join(ROOT, "game/assets/data/company.schema.json");
const jsonPath = path.resolve(process.argv[2] || DEFAULT_JSON);
const schemaPath = path.resolve(process.argv[3] || DEFAULT_SCHEMA);

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const toMin = (t) => {
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + (m || 0);
};
const calendarFor = (person, day) =>
  (person.calendar || [])
    .filter((it) => !it.days || it.days.includes(day))
    .sort((a, b) => toMin(a.start) - toMin(b.start));

const errors = [], warns = [];
const E = (m) => errors.push(m);
const Wn = (m) => warns.push(m);

if (!fs.existsSync(jsonPath)) {
  console.error(`✗ missing ${jsonPath}`);
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

// ---- lightweight schema (required keys / types) --------------------------------
function checkSchema(data) {
  const reqTop = ["meta", "company", "orgs", "teams", "people", "visitors", "pets", "layout", "rooms", "events", "lines"];
  for (const k of reqTop) if (!(k in data)) E(`schema: missing top-level '${k}'`);
  if (data.meta) {
    for (const k of ["tile_size", "start_time", "start_day", "days"]) if (data.meta[k] == null) E(`schema: meta.${k} required`);
    if (data.meta.key_style && data.meta.key_style !== "snake_case") E(`schema: meta.key_style should be snake_case (got ${data.meta.key_style})`);
  }
  if (data.company) for (const k of ["name", "tagline", "product", "version"]) if (!data.company[k]) E(`schema: company.${k} required`);
  if (!Array.isArray(data.people) || data.people.length < 1) E("schema: people must be a non-empty array");
  if (!Array.isArray(data.rooms)) E("schema: rooms must be an array");
  if (!Array.isArray(data.events)) E("schema: events must be an array");
  if (!data.layout || typeof data.layout !== "object") E("schema: layout must be an object");
  else for (const k of ["w", "h", "tiles", "blocked", "sections", "desks", "furniture", "poi", "elevator"]) {
    if (data.layout[k] == null) E(`schema: layout.${k} required`);
  }
  // reject leftover camelCase field names on well-known objects
  const camelRe = /(?:Id|Tile|Tiles|Name|Time|Day|Style|Key|To|Templates|Quotes|Facts|Headers|Props|Route|Spots|Seats|Spawn|Warnings|Size|Behavior|Zone|Ids)$/;
  const suspects = [];
  const walk = (obj, p, depth) => {
    if (!obj || typeof obj !== "object" || depth > 6) return;
    if (Array.isArray(obj)) { obj.slice(0, 8).forEach((v, i) => walk(v, `${p}[]`, depth + 1)); return; }
    for (const [k, v] of Object.entries(obj)) {
      if (p === "layout.legend") continue;
      if (/[A-Z]/.test(k) && camelRe.test(k)) suspects.push(`${p}.${k}`);
      walk(v, p ? `${p}.${k}` : k, depth + 1);
    }
  };
  walk(data, "", 0);
  if (suspects.length) E(`schema: leftover camelCase keys (export may have failed): ${suspects.slice(0, 8).join(", ")}`);
}
checkSchema(data);

// Optional Ajv, if installed
if (fs.existsSync(schemaPath)) {
  try {
    const { default: Ajv } = await import("ajv");
    const ajv = new Ajv({ allErrors: true, strict: false, allowUnionTypes: true });
    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
    const validate = ajv.compile(schema);
    if (!validate(data)) {
      for (const err of (validate.errors || []).slice(0, 25)) {
        E(`schema: ${err.instancePath || "/"} ${err.message}`);
      }
    }
  } catch (e) {
    if (e.code !== "ERR_MODULE_NOT_FOUND") Wn(`Ajv schema check skipped: ${e.message}`);
    // else no ajv installed — required-field checks above still run
  }
}

const { layout, rooms, people, teams, events, lines, visitors, orgs } = data;
if (!layout || !people || !rooms) {
  console.error("✗ JSON is missing core fields; cannot continue semantic checks.");
  for (const m of errors) console.log("ERROR", m);
  process.exit(1);
}
const { w, h } = layout;
const key = (x, y) => `${x},${y}`;
const inB = (x, y) => x >= 0 && y >= 0 && x < w && y < h;

// ---- furniture overlap + blocked grid ---------------------------------------
const solid = new Map(), soft = new Map();
for (const f of layout.furniture || []) {
  if (f.decal) continue;
  for (let y = f.y; y < f.y + f.h; y++) for (let x = f.x; x < f.x + f.w; x++) {
    if (!inB(x, y)) { E(`furniture ${f.id} out of bounds at ${x},${y}`); continue; }
    const k = key(x, y);
    if (f.solid) { if (solid.has(k)) E(`solid overlap ${f.id} vs ${solid.get(k)} at ${k}`); solid.set(k, f.id); }
    else { if (soft.has(k)) E(`seat/soft overlap ${f.id} vs ${soft.get(k)} at ${k}`); soft.set(k, f.id); }
  }
}
for (const [k, id] of soft) if (solid.has(k) && !String(id).startsWith("rug")) E(`non-solid ${id} sits on solid ${solid.get(k)} at ${k}`);
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const b = layout.blocked?.[y]?.[x] === "#";
  if (b !== solid.has(key(x, y))) E(`blocked grid mismatch at ${x},${y}`);
}
if (!layout.tiles || layout.tiles.length !== h || layout.tiles.some((r) => r.length !== w)) E("tiles grid wrong size");
if (!layout.blocked || layout.blocked.length !== h || layout.blocked.some((r) => r.length !== w)) E("blocked grid wrong size");

// ---- BFS reachability from the elevator ---------------------------------------
const walk = (x, y) => inB(x, y) && layout.blocked[y][x] !== "#";
const start = layout.elevator?.spawn;
if (!start) E("elevator.spawn missing");
else if (!walk(start.x, start.y)) E("elevator spawn blocked");
const seen = new Set(start && walk(start.x, start.y) ? [key(start.x, start.y)] : []);
const q = start && walk(start.x, start.y) ? [{ x: start.x, y: start.y }] : [];
while (q.length) {
  const { x, y } = q.shift();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, ny = y + dy, k = key(nx, ny);
    if (walk(nx, ny) && !seen.has(k)) { seen.add(k); q.push({ x: nx, y: ny }); }
  }
}
const reach = (label, p) => {
  if (!p || !walk(p.x, p.y)) E(`${label} not walkable (${p?.x},${p?.y})`);
  else if (!seen.has(key(p.x, p.y))) E(`${label} unreachable (${p.x},${p.y})`);
};
let walkCount = 0;
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (walk(x, y)) walkCount++;
if (start && seen.size !== walkCount) Wn(`${walkCount - seen.size} walkable tiles are isolated pockets`);
for (const d of layout.desks || []) reach(`desk ${d.id}`, d);
for (const r of rooms) {
  reach(`room ${r.id} door`, r.door_tile);
  (r.seats || []).forEach((s, i) => reach(`room ${r.id} seat ${i}`, s));
  (r.stand_tiles || []).forEach((s, i) => reach(`room ${r.id} stand ${i}`, s));
  (r.wait_tiles || []).forEach((s, i) => reach(`room ${r.id} wait ${i}`, s));
  const R = r.rect, inside = (p) => p.x >= R.x && p.y >= R.y && p.x < R.x + R.w && p.y < R.y + R.h;
  if (!(r.seats || []).every(inside)) E(`room ${r.id} has seats outside its rect`);
  if (r.door_tile && !inside(r.door_tile)) E(`room ${r.id} door outside rect`);
  if ((r.wait_tiles || []).some(inside)) E(`room ${r.id} wait tile inside rect`);
  if (r.capacity < (r.seats || []).length && r.size !== "allhands") E(`room ${r.id} capacity < seats`);
}
for (const [k, p] of Object.entries(layout.poi || {})) reach(`poi ${k}`, p);
for (const [k, list] of Object.entries(layout.queues || {})) (list || []).forEach((p, i) => reach(`queue ${k}[${i}]`, p));
for (const [k, list] of Object.entries({
  patrol: layout.patrol_route || [],
  tidy: layout.tidy_route || [],
  wander: layout.wander_spots || [],
  muster: layout.muster?.tiles || [],
  library: layout.library_seats || [],
  kitchen: layout.kitchen_seats || [],
})) list.forEach((p, i) => reach(`${k}[${i}]`, p));
for (const pet of data.pets || []) if (pet.bed) reach(`pet bed ${pet.id}`, pet.bed);
for (const v of layout.void_props || []) if (inB(Math.floor(v.x), Math.floor(v.y))) E(`void prop ${v.id} is inside the office grid`);

// ---- org integrity ---------------------------------------------------------------
const P = Object.fromEntries(people.map((p) => [p.id, p]));
const deskById = Object.fromEntries((layout.desks || []).map((d) => [d.id, d]));
const roomById = Object.fromEntries(rooms.map((r) => [r.id, r]));
const teamIds = new Set((teams || []).map((t) => t.id));
const secIds = new Set((layout.sections || []).map((s) => s.id));
if (new Set(people.map((p) => p.id)).size !== people.length) E("duplicate person ids");
for (const p of people) {
  if (!teamIds.has(p.team_id)) E(`${p.id} bad team`);
  if (p.manager_id && !P[p.manager_id]) E(`${p.id} manager ${p.manager_id} missing`);
  for (const f of ["name", "role", "arrive", "quirk", "task"]) if (!p[f]) E(`${p.id} missing ${f}`);
  for (const f of ["skin", "hair", "hair_style", "shirt", "pants", "accessory"]) if (!p.look?.[f] && p.look?.[f] !== 0) E(`${p.id} look.${f} missing`);
  if (p.kind === "staff" || p.kind === "receptionist") {
    const d = deskById[p.desk_id];
    if (!d) E(`${p.id} desk ${p.desk_id} does not exist`);
    else if (d.owner_id !== p.id) E(`${p.id} desk owner mismatch`);
    else if (d.section_id) {
      const sec = (layout.sections || []).find((s) => s.id === d.section_id);
      if (sec && !(sec.team_ids || []).includes(p.team_id)) E(`${p.id} sits outside their team's section`);
    }
  }
  if (!p.traits?.length) E(`${p.id} no traits`);
  if (p.leave != null) E(`${p.id} leave should be null (24/7)`);
}
for (const p of people) {
  let c = p, n = 0;
  while (c?.manager_id && n < 20) { c = P[c.manager_id]; n++; }
  if (n >= 20) E(`manager cycle at ${p.id}`);
}
for (const t of teams || []) {
  if (!P[t.lead_id]) E(`team ${t.id} lead missing`);
  if (!secIds.has(t.section_id)) E(`team ${t.id} section missing`);
  const sec = (layout.sections || []).find((s) => s.id === t.section_id);
  if (sec && !(sec.team_ids || []).includes(t.id)) E(`team ${t.id} not in its section`);
}
for (const o of orgs || []) if (o.lead_id && !P[o.lead_id]) E(`org ${o.id} lead missing`);
const owners = (layout.desks || []).filter((d) => d.owner_id).map((d) => d.owner_id);
if (new Set(owners).size !== owners.length) E("desk with duplicate owners");

// ---- rooms per SPEC ----------------------------------------------------------------
const bySize = (s) => rooms.filter((r) => r.size === s);
if (bySize("booth").length < 2) E("need ≥2 booths");
if (bySize("huddle").filter((r) => r.capacity >= 2 && r.capacity <= 4).length < 3) E("need ≥3 huddles (2–4)");
if (bySize("team").filter((r) => r.capacity >= 6 && r.capacity <= 8).length < 3) E("need ≥3 team rooms (6–8)");
if (bySize("boardroom").filter((r) => r.capacity >= 12 && r.capacity <= 14).length !== 1) E("need 1 boardroom (12–14)");
if (bySize("allhands").filter((r) => r.capacity >= 50).length !== 1) E("need 1 all-hands (≥50)");

// ---- calendars ------------------------------------------------------------------------
const poiKeys = new Set([...Object.keys(layout.poi || {}), "desk", "floor"]);
const roomBookings = {};
let items = 0; const mismatchIds = new Set();
const types = new Set();
const allCal = [
  ...people.map((p) => ({ who: p.id, cal: p.calendar || [], isV: false, person: p })),
  ...(visitors || []).map((v) => ({ who: v.id, cal: v.calendar || [], isV: true, person: v })),
];
for (const { who, cal, isV, person } of allCal) {
  for (const d of DAYS) {
    const list = cal.filter((it) => !it.days || it.days.includes(d))
      .map((it) => ({ ...it, s: toMin(it.start), e: toMin(it.end) }))
      .sort((a, b) => a.s - b.s);
    for (let i = 1; i < list.length; i++) {
      if (list[i].s < list[i - 1].e) E(`${who} double-booked on ${d}: "${list[i - 1].title}" ${list[i - 1].start}-${list[i - 1].end} vs "${list[i].title}" ${list[i].start}`);
    }
    if (person.calendar_by_day) {
      const exp = person.calendar_by_day[d] || [];
      const compact = list.map((it) => `${it.start}|${it.end}|${it.title}|${it.room_id}`);
      const got = exp.map((it) => `${it.start}|${it.end}|${it.title}|${it.room_id}`);
      if (compact.join("||") !== got.join("||")) E(`${who} calendar_by_day.${d} does not match compact calendar`);
    }
  }
  for (const it of cal) {
    items++; types.add(it.type);
    const s = toMin(it.start), e = toMin(it.end);
    if (!(e > s) || e > 1440) E(`${who} bad time ${it.start}-${it.end} "${it.title}"`);
    if (!roomById[it.room_id] && !poiKeys.has(it.room_id)) E(`${who} unknown room_id ${it.room_id}`);
    if (it.days && it.days.some((d) => !DAYS.includes(d))) E(`${who} bad days`);
    for (const a of it.attendees || []) if (!P[a] && !(visitors || []).some((v) => v.id === a)) E(`${who} "${it.title}" unknown attendee ${a}`);
    if (!isV && !(it.attendees || []).includes(who)) E(`${who} not in own item "${it.title}"`);
    if (roomById[it.room_id] && !isV) {
      const n = (it.attendees?.length || 0) + (it.visitors?.length || 0);
      if (n > roomById[it.room_id].capacity && !it.mismatch) E(`"${it.title}" ${n} people > ${it.room_id} cap ${roomById[it.room_id].capacity}`);
      for (const d of it.days || DAYS) {
        const arr = ((roomBookings[it.room_id] ||= {})[d] ||= []);
        if (!arr.find((b) => b.id === it.id)) arr.push({ s, e, id: it.id, title: it.title });
      }
    }
  }
}
for (const p of people) for (const it of p.calendar || []) {
  if (it.mismatch) mismatchIds.add(it.id);
  for (const a of it.attendees || []) {
    if (P[a] && !P[a].calendar.find((x) => x.id === it.id)) E(`${a} missing shared meeting "${it.title}"`);
  }
}
for (const [rid, days] of Object.entries(roomBookings)) for (const [d, arr] of Object.entries(days)) {
  arr.sort((a, b) => a.s - b.s);
  for (let i = 1; i < arr.length; i++) {
    if (arr[i].s < arr[i - 1].e) E(`room ${rid} double-booked on ${d}: "${arr[i - 1].title}" vs "${arr[i].title}"`);
  }
}
for (const t of ["standup", "1on1", "sync", "focus", "lunch", "allhands", "interview", "nap", "wellness", "deploy"]) {
  if (!types.has(t)) E(`no calendar items of type ${t}`);
}
for (const p of people.filter((p) => p.kind === "staff")) {
  const c = (p.calendar || []).map((i) => i.type);
  for (const t of ["standup", "lunch", "nap", "focus"]) if (!c.includes(t)) E(`${p.id} has no ${t}`);
  if (!(p.calendar || []).some((i) => i.type === "1on1") && p.manager_id) E(`${p.id} has no 1:1`);
}
if (!people.some((p) => calendarFor(p, "tue").some((i) => i.event_id === "taco-tuesday"))) E("no Taco Tuesday");
if (!people.some((p) => calendarFor(p, "fri").some((i) => i.event_id === "friday-deploy" && i.start === "16:55"))) E("no Friday 4:55 deploy");
if (!people.some((p) => calendarFor(p, "wed").some((i) => i.event_id === "all-hands"))) E("no Wed all-hands");
const mismatches = mismatchIds.size;
if (mismatches === 0) E("no deliberate size mismatches");

// ---- arrivals ----------------------------------------------------------------------------
const arr = people.map((p) => toMin(p.arrive));
const early = arr.filter((m) => m <= toMin("08:00")).length;
const bulk = arr.filter((m) => m >= toMin("09:00") && m <= toMin("10:00")).length;
const late = arr.filter((m) => m >= toMin("10:45")).length;
if (!early || bulk < 20 || !late) E(`arrivals not staggered (early ${early}, bulk ${bulk}, late ${late})`);

// ---- events + lines --------------------------------------------------------------------------
const evIds = new Set((events || []).map((e) => e.id));
if (evIds.size !== (events || []).length) E("duplicate event ids");
for (const e of events || []) {
  for (const c of e.chains_to || []) if (!evIds.has(c.id)) E(`event ${e.id} chains to missing ${c.id}`);
  if (!(e.ticker_templates || []).length) E(`event ${e.id} has no ticker templates`);
  if (!lines?.bubbles?.[e.line_key]) Wn(`event ${e.id} line_key ${e.line_key} has no bubbles`);
  if (!["scheduled", "random", "chained", "manual"].includes(e.kind)) E(`event ${e.id} bad kind`);
  if (!e.reactions?.default) E(`event ${e.id} no default reactions`);
  if (e.location?.type === "poi" && !layout.poi?.[e.location.ref]) E(`event ${e.id} bad poi ${e.location.ref}`);
  if (e.location?.type === "room" && e.location.ref && !roomById[e.location.ref]) E(`event ${e.id} bad room ${e.location.ref}`);
}
const REQUIRED = ["coffee-machine-breaks", "coffee-grumpy", "coffee-repair", "coffee-cheer", "microwave-fish", "printer-jam", "standup-overrun", "meeting-knock", "size-mismatch", "could-have-been-email",
  "friday-deploy", "prod-down", "engineers-sprint", "prod-fixed", "all-hands", "funding-round", "pizza-arrives", "birthday-cake", "fire-drill", "taco-tuesday", "donut-drop", "coffee-break",
  "quota-reached", "reward-party", "wellness-session", "breakroom-escort", "overtime-protocol", "quarterly-elevator", "void-flicker", "corridor-runner", "goat-appears", "tchotchke-award",
  "team-rivalry", "gratitude-assembly", "conga-meeting", "department-whisper", "dog-pets", "new-hire-onboarding", "visitor-arrives", "delivery-arrives"];
for (const id of REQUIRED) if (!evIds.has(id)) E(`missing required event ${id}`);
for (const id of ["donut-drop", "prod-down", "fire-drill", "all-hands", "funding-round", "birthday-cake", "coffee-break"]) {
  if (!events.find((e) => e.id === id)?.manual) E(`panel event ${id} not manual`);
}
const nLines = Object.values(lines?.bubbles || {}).reduce((a, b) => a + b.length, 0);
if (nLines < 2000) E(`only ${nLines} bubble lines (need >= 2000)`);
const banned = /lumon|severance|innie|outie|kier|macrodata|mdr\b/i;
const allText = JSON.stringify({
  c: data.company,
  l: lines,
  e: (events || []).map((e) => e.ticker_templates),
  r: rooms.map((r) => r.name),
  s: layout.signs,
  p: people.map((p) => [p.role, p.quirk]),
});
if (banned.test(allText)) E(`banned IP term found: ${allText.match(banned)[0]}`);
const tooLong = Object.entries(lines?.bubbles || {}).flatMap(([k, v]) => v.filter((s) => s.length > 40).map((s) => `${k} (${s.length}): ${s}`));
if (tooLong.length) E(`${tooLong.length} bubble lines > 40 chars: ${tooLong.slice(0, 8).join(" | ")}`);

const LEGACY_DUP_ALLOW = new Set(["…", "zzz…", "Huh.", "Back to it.", "Biscuit!!", "*knock knock*", "I'm on it!", "Where are they going?"]);
const seenText = new Map();
for (const [k, arr] of Object.entries(lines?.bubbles || {})) {
  const inBank = new Set();
  for (const s of arr) {
    if (inBank.has(s)) E(`duplicate bubble in bank ${k}: ${s}`);
    inBank.add(s);
    if (!seenText.has(s)) seenText.set(s, k);
    else if (seenText.get(s) !== k && !LEGACY_DUP_ALLOW.has(s)) E(`duplicate bubble "${s}" in ${seenText.get(s)} and ${k}`);
  }
}
for (const ppl of people) {
  const key = `person:${ppl.id}`;
  const n = lines?.bubbles?.[key]?.length || 0;
  if (n < 15) E(`person ${ppl.id} has ${n} lines in ${key} (need >= 15)`);
}
if (!lines?.anti_repeat || typeof lines.anti_repeat.default_cooldown !== "number") E("lines.anti_repeat.default_cooldown required");
if (!Array.isArray(lines?.banter) || lines.banter.length < 10) E("lines.banter should include conversation pairs/threes");
else {
  for (const b of lines.banter) {
    if (!b.id || !Array.isArray(b.lines) || b.lines.length < 2) E(`banter ${b.id || "?"} needs 2+ lines`);
    for (const ln of b.lines || []) if (ln.text && ln.text.length > 40) E(`banter ${b.id} line > 40: ${ln.text}`);
  }
}

const PERIODS = { anytime: null, morning: [6 * 60, 12 * 60], day: [7 * 60, 20 * 60], afternoon: [12 * 60, 18 * 60], meal: [11 * 60, 14 * 60], night: "wrap" };
const okTime = (tm) => typeof tm === "string" && (/^\d{2}:\d{2}$/.test(tm) || tm === "24:00") && (tm === "24:00" || (toMin(tm) >= 0 && toMin(tm) <= 1440));
for (const e of events || []) {
  const d = e.director;
  if (!d) { E(`event ${e.id} missing director metadata`); continue; }
  if (!Object.prototype.hasOwnProperty.call(PERIODS, d.period)) E(`event ${e.id} director.period invalid: ${d.period}`);
  const win = d.window || (e.window && { start: e.window.from || e.window.start, end: e.window.to || e.window.end });
  if (win) {
    if (!okTime(win.start) || !okTime(win.end)) E(`event ${e.id} director window invalid ${win.start}–${win.end}`);
    else if (win.end !== "24:00" && toMin(win.end) < toMin(win.start) && d.period !== "night") E(`event ${e.id} window wraps but period is ${d.period}`);
    const bounds = PERIODS[d.period];
    if (bounds && Array.isArray(bounds) && win.start && win.end && win.end !== "24:00") {
      const slop = 60;
      if (toMin(win.start) < bounds[0] - slop || toMin(win.end) > bounds[1] + slop) E(`event ${e.id} window ${win.start}–${win.end} outside sensible ${d.period} hours`);
    }
  }
  const schedTime = e.schedule?.time;
  if (schedTime && win?.start && win?.end && win.end !== "24:00" && okTime(schedTime) && okTime(win.start) && okTime(win.end)) {
    const tm = toMin(schedTime);
    if (tm < toMin(win.start) || tm > toMin(win.end)) E(`event ${e.id} schedule time ${schedTime} outside director window`);
  }
}
if ((events || []).length < 90) Wn(`only ${events.length} events (target ~100)`);

const objects = data.objects;
if (!objects?.catalog || typeof objects.catalog !== "object") E("objects.catalog missing");
else {
  const atlasPath = path.join(ROOT, "game/assets/art/atlas.json");
  if (fs.existsSync(atlasPath)) {
    const atlas = JSON.parse(fs.readFileSync(atlasPath, "utf8"));
    const props = Object.keys(atlas.props || {});
    const missing = props.filter((k) => !objects.catalog[k]);
    if (missing.length) E(`objects.catalog missing ${missing.length} atlas props: ${missing.slice(0, 12).join(", ")}`);
  } else Wn("atlas.json not found; skipped catalog coverage");
}
if (!Array.isArray(data.fish) || data.fish.length < 1) E("fish catalog missing");
if (!Array.isArray(data.idle_actions) || data.idle_actions.length < 1) E("idle_actions missing");

// ---- report ---------------------------------------------------------------------------------------
const ppl = people.filter((p) => p.kind === "staff" || p.kind === "receptionist").length;
const cleaners = people.filter((p) => p.kind === "cleaner" || p.kind === "facilities").length;
const security = people.filter((p) => p.kind === "security" || p.kind === "supervisor").length;
console.log(`file: ${path.relative(ROOT, jsonPath)}`);
console.log(`people: ${people.length} (staff ${ppl}, facilities/cleaners ${cleaners}, supervisor/security ${security}) · visitors ${(visitors || []).length} · pets ${(data.pets || []).length}`);
console.log(`teams ${(teams || []).length} · sections ${(layout.sections || []).length} · desks ${(layout.desks || []).length} · rooms ${rooms.length} (${["booth", "huddle", "team", "boardroom", "allhands", "special"].map((s) => `${s} ${bySize(s).length}`).join(", ")})`);
console.log(`furniture ${(layout.furniture || []).length} · walkable ${walkCount} · reachable ${seen.size} · calendar items ${items} · deliberate mismatches ${mismatches}`);
console.log(`events ${(events || []).length} (manual/panel ${(events || []).filter((e) => e.manual).length}) · bubble lines ${nLines} · ticker templates ${Object.values(lines?.ticker || {}).reduce((a, b) => a + b.length, 0)}`);
for (const m of warns) console.log("WARN", m);
for (const m of data.meta?.build_warnings || []) console.log("BUILD", m);
if (errors.length) {
  for (const m of errors.slice(0, 80)) console.log("ERROR", m);
  if (errors.length > 80) console.log(`… and ${errors.length - 80} more`);
  console.log(`✗ ${errors.length} errors`);
  process.exit(1);
}
console.log("✓ company.json valid");
