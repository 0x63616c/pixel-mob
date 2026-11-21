# DATA.md — world data for the Bevy engine

This is the contract for the **exported JSON** the engine should load. Do not edit engine files from this document; use it to derive or update Rust structs.

## Source of truth

| File | Role |
|---|---|
| `src/data/company.js` | **Source of truth.** Authoring format (camelCase, helpers `calendarFor` / `DAYS` / `toMin`). Validated by `node src/data/validate.mjs`. |
| `tools/export-data.mjs` | Converts that file to serde-friendly JSON and copies the schema. |
| `game/assets/data/company.json` | **What Bevy should load.** snake_case keys, `calendar_by_day` pre-expanded. |
| `game/assets/data/company.schema.json` | JSON Schema (draft 2020-12) for those structs. |
| `tools/validate-data.mjs` | Validates the JSON (schema, refs, calendars, coordinates, overlaps, BFS reachability, capacity). |

```bash
node tools/export-data.mjs
node tools/validate-data.mjs
```

`game/build.rs` already prefers `assets/data/company.json` over the fallback stub. Once the real file is present, do not keep using `assets/fallback/company.json`.

`game/src/data.rs` currently deserializes **camelCase** (`#[serde(rename = "startTime")]`, etc.). This JSON is **snake_case**. Please switch those structs to snake_case field names (Rust's default) and drop the camelCase renames, or add `alias` attributes during a transition. Reserved-word fields still need a rename:

- `type` → `#[serde(rename = "type")] pub kind: String` (calendar items, furniture, event `location`)
- `ref` → `#[serde(rename = "ref")] pub reference: Option<String>` (event location)

Do not otherwise change engine sources based on this note.

## Times, coords, enums

- Times are `"HH:MM"` 24h strings. `"24:00"` is a legal **end** only. Items never cross midnight. Convert with `h * 60 + m` (`24:00` = 1440).
- Coordinates are tiles (1 tile = 16 px). `x` right, `y` down. `rect = {x,y,w,h}` covers `x..x+w-1`.
- `facing`: `"up" | "down" | "left" | "right"`.
- Days: `"mon".."sun"`. The floor is 24/7; weekends use the same base rhythm with optional `days` filters (Taco Tuesday, Friday 16:55 deploy, Wednesday all-hands).

## Top-level object

```
{ meta, company, orgs, teams, people, visitors, pets, layout, rooms, events, lines }
```

`meta`: `{ tile_size, start_time, start_day, days, version, source, key_style, time_format, build_warnings, panel }`.

`company`: Plenum Industries — vague product “The Outputs™”, founder Cornelius T. Plenum (portrait shrine + quotes), quotas, rivalries, prizes (Melon Hour, Finger-Trap Social, Eraser Gala, …).

`people[].kind`: `"staff" | "receptionist" | "cleaner" | "security"`. In the void pivot, **cleaner** is the silent Facilities crew and **security** is the Floor Supervisor. `leave` is always `null` (nobody goes home). `arrive` is day-1 elevator arrival only, staggered.

## Calendars (use `calendar_by_day` in Rust)

Each person and visitor has:

- `calendar`: compact list. An item with no `days` repeats every day; otherwise only those weekdays. Shared meetings use the same `id` on every attendee.
- `calendar_by_day`: `{ mon: [...], …, sun: [...] }` — already filtered and sorted by start. **Prefer this.** You do not need to reimplement `calendarFor`.

`room_id` is a `rooms[].id`, a `layout.poi` key, `"desk"`, or `"floor"`. `mismatch: true` marks a deliberate capacity mismatch.

POI keys in this JSON are snake_case (`reception_greet`, `water_cooler`, `facilities_closet`, `dog_bed`, `void_corridor_start`).

## Layout (infinite white void — no walls)

`layout.tiles` is **visual tint only** (`.` void, `s` section carpet, `o` meeting outline, `k` kitchen, `l` library, `E` elevator shaft). There are no walls. Meeting “rooms” are a table, chairs, a floor outline, a floating sign and a capacity tag. `rooms[].door_tile` is the entry tile on that outline, not a door in a wall.

`layout.blocked` (`#` / `.`) is authoritative for A*. Also treat `furniture[].solid` as blocked. Chairs / seats are non-solid. BFS from `layout.elevator.spawn` must reach every desk, room door/seat/wait tile, and POI — the validator checks this.

`layout.void_props` sit **outside** the `0..w` / `0..h` grid (decorative odd things in the white).

### Art-contract mismatch

`CONTRACT-art.md` still says rooms get glass walls from `rect` with a door gap, and that an exterior wall + windows are drawn around `w×h`. **The void pivot removes all of that.** Do not draw glass or exterior walls. Soft contact shadows ground furniture islands on the off-white void.

## Events and lines

Events: `kind` is `"scheduled" | "random" | "chained" | "manual"`. Trait reaction weights **add** to `reactions.default`. `line_key` indexes `lines.bubbles`. Memo templates live in `ticker_templates` and `lines.ticker`. Placeholders: `{name} {other} {room} {team} {title} {version} {prize} {quota} {time} {n}`.

Speech-bubble bank keys that were camelCase in JS are snake_case here, including `one_on_one`, `gossip_reply`, `receptionist_greeting`, `receptionist_visitor`, `receptionist_delivery`, `facilities_banter`, `waiting_outside`. Ticker keys: `room_booked`, `meeting_start`, `meeting_end`. Event ids stay kebab-case (`prod-down`, `goat-appears`, …).

## Look / hair / traits

See `CONTRACT-data.md` for vocabularies. JSON field names are snake_case (`hair_style`, `team_id`, …). The art contract uses a few different hair-style spellings (`sidepart`, `pony`); map `side-part` → `sidepart`, `ponytail` → `pony` if needed.

## Regenerating

Edit `src/data/company.js` only, then re-run the export and the JSON validator. Do not hand-edit `company.json`.

## Expansion fields (v2)

The floor is a **96×64** void (original 64×40 campus is unchanged in the north-west). New islands include the Quiet Annex, extra meeting rooms, IT Help, Mail, a plant wall, a door with no wall, break/ping-pong, a wellness grove, nap pods, the Archive, the aquarium, a goat pen, The White Picnic, and The Temporary Table. Legend letters: `x i m p b n l a q g v` (see `layout.legend`).

`CONTRACT-art.md` still mentions glass/exterior walls; the void pivot removes those. Do not draw them.

### Director

Every event has `director`:

- `window.start` / `window.end` (`HH:MM`, end may be `24:00`)
- `days` (`"daily"` or a weekday array)
- `period`: `anytime | morning | day | afternoon | meal | night`
- `preconditions`, `exclusions` (event ids or short tags)
- `cooldown` (sim minutes), `weight`, `tension_delta`
- `participants` (trait/role filters, same idea as the event field)

The waffle party is afternoon-only with a multi-day `cooldown` (4320 minutes). Validators check that windows are valid and sit inside sensible hours for the period.

### Idle actions, quirks, duties

Top-level `idle_actions[]`: ambient micro-behaviours (`id`, `name`, `weight`, `duration`, `anim`, `emote`, `line_key`, `conditions`, `effects`). People may have `duties` (e.g. Martin: `fish-feeding` at 07:15), `behavior_bias` (per-action and per-event weights), and `quirk_id`.

Calendar item `type` may be `duty` (and the usual meeting types).

### Objects, fish, clicking

`objects.catalog` is keyed by atlas prop key (and extra furniture/place keys). Every `game/assets/art/atlas.json` `props` key must have an entry with `name` and 2–3 dry descriptions. `objects.instances` holds per-desk belongings with owner flavour (mug slogans, etc.).

Top-level `fish[]` names the tank: Gerald, Pamela, Steve, The Intern, Muriel, Dot (Deputy of Water). They are also clickable catalog entries.

### Lines (2000+)

`lines.bubbles` remains `Record<string, string[]>` for the current engine (`HashMap<String, Vec<String>>`). All bubble strings are **≤ 40 characters**. New lines are globally unique except for eight short legacy repeats (`…`, `Huh.`, …). Banks include:

- `person:<id>` — at least 15 lines each
- `team:<teamId>`, `role:<kind>`
- `time:morning`, `time:lunch`, `time:afternoon`, `time:evening`, `time:night`, `time:3am`, `time:dawn`
- `mood:*`, `energy:high|medium|low`
- one bank per event id, plus object/void/aquarium/goat/Biscuit, elevator, `arriving`, `departing`, `founder-memo`, idle `line_key`s

`lines.banter` is structured call-and-response (pairs and threes) with preferred `speakers`. `lines.founder_memos` are short memo readings. `lines.anti_repeat` holds `{ default_cooldown, unit: "sim_seconds", by_key, by_text }` so the engine can avoid repeating a line immediately. The engine agent must adopt these; this data pack does not edit Rust.

### Source / export

Edit `src/data/company.js` (and `expand.js` / `voice.js`), then:

```
node src/data/validate.mjs
node tools/export-data.mjs
node tools/validate-data.mjs
```

Do not hand-edit `game/assets/data/company.json`. Do not edit `game/src/*.rs` from the data workstream.
