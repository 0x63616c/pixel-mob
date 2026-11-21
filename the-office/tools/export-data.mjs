#!/usr/bin/env node
// Export src/data/company.js (the world-data source of truth) to a serde-friendly
// snake_case JSON file for the Bevy engine, plus a JSON Schema.
//
//   node tools/export-data.mjs
//
// Writes:
//   game/assets/data/company.json
//   game/assets/data/company.schema.json  (copied from tools/lib/company.schema.json if present,
//                                         otherwise writes the bundled schema path)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import data, { calendarFor, DAYS } from "../src/data/company.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "game/assets/data");
const SCHEMA_SRC = path.join(ROOT, "tools/lib/company.schema.json");
const SCHEMA_DST = path.join(OUT_DIR, "company.schema.json");
const JSON_DST = path.join(OUT_DIR, "company.json");

function camelToSnake(s) {
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Convert camelCase KEYS to snake_case. Leave legend keys and already-snake keys (e.g. atlas ids like fx_flashlight_E) alone. */
function convertKeys(value, path = "") {
  if (Array.isArray(value)) return value.map((v) => convertKeys(v, `${path}[]`));
  if (!isPlainObject(value)) return value;
  const isLegend = path === "layout.legend" || path.endsWith(".legend");
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    const nk = !isLegend && /[a-z][A-Z]/.test(k) ? camelToSnake(k) : k;
    out[nk] = convertKeys(v, path ? `${path}.${nk}` : nk);
  }
  return out;
}

function collectRenames(value, path, map) {
  if (Array.isArray(value)) {
    value.forEach((v) => collectRenames(v, `${path}[]`, map));
    return;
  }
  if (!isPlainObject(value)) return;
  const isLegend = path === "layout.legend" || path.endsWith(".legend");
  for (const k of Object.keys(value)) {
    if (!isLegend && /[a-z][A-Z]/.test(k)) map[k] = camelToSnake(k);
    collectRenames(value[k], path ? `${path}.${k}` : k, map);
  }
}

/** Rewrite string VALUES that are renamed keys (poi refs, line-bank keys). */
function remapStringValues(value, rename) {
  if (typeof value === "string") return rename[value] ?? value;
  if (Array.isArray(value)) return value.map((v) => remapStringValues(v, rename));
  if (!isPlainObject(value)) return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = remapStringValues(v, rename);
  return out;
}

function expandCalendars(exported, valueRename) {
  const days = exported.meta?.days ?? DAYS;
  // Expand from the ORIGINAL camelCase data, then convert each day's items.
  const byId = Object.fromEntries(data.people.map((p) => [p.id, p]));
  const visById = Object.fromEntries((data.visitors || []).map((v) => [v.id, v]));

  const convertItem = (it) => remapStringValues(convertKeys(it, "calendar[]"), valueRename);

  for (const ep of exported.people) {
    const src = byId[ep.id];
    ep.calendar_by_day = {};
    for (const d of days) {
      ep.calendar_by_day[d] = calendarFor(src, d).map(convertItem);
    }
  }
  for (const ev of exported.visitors || []) {
    const src = visById[ev.id];
    ev.calendar_by_day = {};
    for (const d of days) {
      ev.calendar_by_day[d] = calendarFor(src, d).map(convertItem);
    }
  }
}

const rename = {};
collectRenames(data, "", rename);
// Only keep renames that matter as *values* (poi keys, line-bank keys, ticker keys).
const valueRename = {};
for (const k of [
  ...Object.keys(data.layout.poi),
  ...Object.keys(data.lines.bubbles),
  ...Object.keys(data.lines.ticker),
  ...Object.keys(data.lines.tasks),
]) {
  if (rename[k]) valueRename[k] = rename[k];
}

const exported = remapStringValues(convertKeys(data), valueRename);
exported.meta = {
  ...exported.meta,
  source: "src/data/company.js",
  key_style: "snake_case",
  time_format: "HH:MM",
};
expandCalendars(exported, valueRename);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(JSON_DST, JSON.stringify(exported, null, 2) + "\n");

if (fs.existsSync(SCHEMA_SRC)) {
  fs.copyFileSync(SCHEMA_SRC, SCHEMA_DST);
} else {
  console.warn("WARN: schema source missing at", SCHEMA_SRC);
}

const nPeople = exported.people.length;
const nEvents = exported.events.length;
const nLines = Object.values(exported.lines.bubbles).reduce((a, b) => a + b.length, 0);
const nRooms = exported.rooms.length;
console.log(`wrote ${path.relative(ROOT, JSON_DST)} (${(fs.statSync(JSON_DST).size / 1024).toFixed(1)} KB)`);
if (fs.existsSync(SCHEMA_DST)) console.log(`wrote ${path.relative(ROOT, SCHEMA_DST)}`);
console.log(`people ${nPeople} · events ${nEvents} · rooms ${nRooms} · bubble lines ${nLines}`);
console.log(`renamed keys (values remapped): ${Object.entries(valueRename).map(([a, b]) => `${a}→${b}`).join(", ") || "(none)"}`);
