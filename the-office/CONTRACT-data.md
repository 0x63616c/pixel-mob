# CONTRACT-data — `src/data/company.js`

Owner: DATA agent. `import data, { calendarFor, DAYS, toMin } from './data/company.js'`.
The default export is a plain object (built deterministically at import time, no randomness at runtime).
Follows the SPEC field names, adapted to the **Severance-style white void pivot** (no walls, elevator entrance, 24/7).
The schema is also documented at the top of company.js.

## Conventions
- Coordinates are **tiles** (1 tile = 16 logical px). `x` right, `y` down. `rect = {x,y,w,h}` (inclusive start, exclusive end: covers x..x+w-1).
- `facing`: `"up" | "down" | "left" | "right"` = the direction the person looks while sitting/standing there.
- Times: `"HH:MM"` 24h sim clock, `"24:00"` allowed as an end. Items never cross midnight.
- Days: `"mon".."sun"`. It's 24/7 (nobody goes home); weekends exist but run the same base rhythm.
- Colours: hex strings.

## Top level
```
{ meta, company, orgs, teams, people, visitors, pets, layout, rooms, events, lines }
```
- `meta`: `{ tileSize:16, startTime:"07:00", startDay:"mon", days:[...7], version, panel:[{id,label,emoji}] (events to show in the event panel), buildWarnings:[] (should be empty) }`
- `company`: `{ name, tagline, mission, product, productDescription, stage, version, founded, founder:{name, title, portraitQuote}, values[], quotas:[{teamId,label,target}], rivalries:[{a,b,name}], prizes[] }`
- `orgs`: `[{ id, name, leadId }]` ids: `eng, product, design, gtm, ops, exec, support`
- `teams`: `[{ id, name, shortName, org, color, sectionId, leadId, standup:{time, roomId}, quota:{label, start (0..1)} }]`

## people  (50 staff incl. receptionist + 2 facilities + 1 floor supervisor = 53)
```
{ id, name, first, pronouns, role, teamId, org, managerId|null, deskId,
  kind: "staff"|"receptionist"|"cleaner"|"security",   // cleaner = grey "Facilities" crew, security = "Floor Supervisor" (matches CONTRACT-art kinds)
  arrive:"HH:MM"   // day-1 elevator arrival (staggered 07:30 / 09-10 / ~11). After that they never leave.
  leave: null       // 24/7 pivot: nobody leaves. (SPEC field kept; always null)
  traits:[...], needs:{energy,hunger,social,stress,focus} (0..1 baseline),
  look:{ skin, hair, hairStyle, shirt, pants, accessory, extra? },
  belongings:[ "mug","photo",... ],   // props on their desk
  quirk, task (default "current task" text), seed (int),
  calendar:[CalItem] }
```
- traits vocabulary: `early-bird, night-owl, snacker, chatty, focused, meeting-lover, pacer, caffeinated, napper, gossip, devout, rebel, anxious, dog-lover, overachiever, slacker`
- hairStyle (aligned with CONTRACT-art): `short, long, buzz, bald, bun, pony, afro, mohawk, curly, bob, hijab, sidepart`
- accessory (aligned with CONTRACT-art): `none, glasses, sunglasses, headphones, earrings, lanyard, airpods, beard, mustache`, plus headwear `cap, beanie` (art may render these as hairStyle overlays); `extra` (optional second accessory, same vocabulary); `outfit`: `tee, hoodie, blazer, vest, dress, uniform, cardigan`; `shoes` hex
- belongings: `mug, photo, cactus, figurine, stressball, plant, trophy, lamp, books, snowglobe, rubberduck, eraser, caricature, waterbottle, candle, headphones`

### CalItem
```
{ id, start, end, title, type, roomId, attendees:[personIds], organizerId?, days?:[...], eventId?, mismatch?:true, visitors?:[visitorIds] }
// id = meeting id, identical on every attendee's copy (use it to group attendees of one meeting)
```
- `type`: `standup, sync, 1on1, focus, lunch, dinner, snack, nap, allhands, interview, wellness, social, deploy, review, patrol, tidy, reception, onboarding`
- `roomId`: a `rooms[].id`, OR a `layout.poi` key (`kitchen`, `library`, `reception`, `shrine`, `elevator`, ...), OR `"desk"` (own desk), OR `"floor"` (roaming: patrol/tidy route).
- `days` omitted = every day. Otherwise only those weekdays (e.g. Taco Tuesday `["tue"]`).
- No room is double-booked on any day and capacity >= attendees, **except** items with `mismatch:true` (deliberate: 1:1 in the boardroom, 9 people in a 4-seat huddle).
- No person has overlapping items on the same day. Gaps = default work at desk.
- Helper: `calendarFor(person, day) -> CalItem[]` sorted by start (filters `days`).
- Each room booking appears on every attendee's calendar (same object shape, identical start/end/roomId).

## visitors (interview candidates, couriers)
`{ id, name, kind:"visitor"|"courier", purpose:"candidate"|"delivery"|"vendor", day, arrive, leave, hostId, look, calendar:[CalItem] }` — they come and go via the elevator; receptionist greets.

## pets
`{ id, name, species:"dog"|"goat", look:{body,spots,collar}, bed:{x,y}|null, traits, quirk, appearsFromNowhere?:true }`

## layout (infinite white void, no walls)
```
{ w:64, h:40, tileSize:16,
  legend:{ ".":"void floor (walkable)", "o":"meeting-space floor outline (walkable)", "s":"section floor tint (walkable)", "E":"elevator shaft (not walkable)", "k":"kitchen floor tint", "l":"library rug" },
  tiles:[64-char strings x40],      // visual floor tint only; walls do not exist
  blocked:[64-char strings x40],    // "#" = blocked by solid furniture / elevator, "." = walkable  (precomputed for A*)
  sections:[{ id, name, sign, teamIds, rect, label:{x,y}, lightZone }],
  tables:[{ id, sectionId, x,y,w,h }],
  desks:[{ id, x,y, facing, sectionId, tableId, monitor:{x,y}, ownerId|null, kind:"desk"|"hotdesk"|"reception" }],
  furniture:[{ id, type, x,y,w,h, solid, facing?, roomId?, sectionId?, label? }],
  poi:{ elevator, entrance, reception, receptionGreet, kitchen, coffee, microwave, fridge, snackbar, library,
        printer, toilets, facilitiesCloset, dogBed, shrine, muster, breakroom, wellness, voidCorridorStart: {x,y,facing} },
  queues:{ coffee:[{x,y}], microwave:[{x,y}], printer:[{x,y}], snackbar:[{x,y}], reception:[{x,y}] },   // ordered queue tiles, [0] = front
  elevator:{ rect, doorTiles:[{x,y}], spawn:{x,y} },
  signs:[{ id, x,y, text, kind:"motivational"|"section"|"room"|"wayfinding" }],  // floating signage
  voidProps:[{ id, type, x,y, note }],   // far outside the 0..w/0..h grid, decorative only
  patrolRoute:[{x,y}], tidyRoute:[{x,y}], wanderSpots:[{x,y}] }
```
- furniture `type` vocabulary: `table, chair, desk-chair, monitor, crt, plant, plant-tall, sofa, beanbag, bookshelf, armchair, coffee-machine, microwave, fridge, snack-bar, counter, stool, printer, podium, stage, screen, whiteboard, reception-desk, elevator, portrait, candle, toilet-door, cabinet, dog-bed, pod-booth, rug, water-cooler, bin, lamp, banner`
- Solid furniture never overlaps other furniture. Seats/chairs are non-solid (people sit on that tile).

## rooms (meeting spaces = table + chairs + floor outline + floating sign)
```
{ id, name, size:"booth"|"huddle"|"team"|"boardroom"|"allhands"|"special", capacity, rect, interior(=rect),
  doorTile:{x,y}  // the entry tile on the outline (no walls; it's where people enter/exit)
  waitTiles:[{x,y}] // just outside the outline: where the next booking waits / "knocks" on an overrun
  seats:[{x,y,facing}], standTiles?:[{x,y}], sign:{x,y,text}, purpose? }
```
2+ booths, 3+ huddles (2-4), 3+ team (6-8), 1 boardroom (14), 1 all-hands (65 seats), plus `special` spaces: `wellness`, `breakroom`.

## events (catalog)
```
{ id, name, kind:"scheduled"|"random"|"chained"|"manual", manual:bool (show in panel), panel?:{label, emoji},
  schedule?:{ days:[..]|"daily", time:"HH:MM" }, chance?: probability per sim hour, cooldown: sim min,
  location:{ type:"poi"|"room"|"global"|"desk"|"team"|"void", ref? }, radius: tiles | null (null = global),
  duration: sim min, participants?:{ all?, orgs?, teams?, traits? },
  effects:{ needs:{energy?,hunger?,social?,stress?,focus?} (delta applied to people who react/join), output: multiplier while active, progress?: delta to company progress, version?: "patch"|"minor" },
  joinBehavior:"queue"|"swarm"|"gather"|"evacuate"|"sit"|"sprint"|"watch"|"escort"|"none",
  anim:{ join, react }  // walk|run|sprint|celebrate|facepalm|turn-head|cheer|slump|wake|clap|bow
  emotes:[emoji], lineKey (key into lines.bubbles), gossipable:bool,
  reactions:{ default:{join,ignore,gossip,flee}, <trait>:{join?,ignore?,gossip?,flee?} },  // weights; trait entries ADD to default
  chainsTo:[{ id, delay (sim min), chance (0..1) }],
  tickerTemplates:[ "..." ]   // also mirrored in lines.ticker[id]
}
```

## lines
```
{ bubbles:{ <context or eventId>: [string] },   // >=300 total
  ticker:{ <eventId or context>: [template] },   // Memo feed; placeholders {name} {other} {room} {team} {version} {prize} {quota} {time} {n}
  signs:[...], founderQuotes:[...], wellnessFacts:[...], tasks:{ <teamId>|default:[...] }, memoHeaders:[...] }
```
Bubble contexts: `working, focus, meeting, standup, sync, oneOnOne, interview, coffee, kitchen, lunch, snack, nap, waking, tired3am, gossip, gossipReply, arriving, elevator, receptionistGreeting, receptionistVisitor, receptionistDelivery, facilitiesBanter, supervisor, dog, petting, waitingOutside, knock, mismatch, void, idle, wellness, breakroom, shrine, rivalry` + every event id.

## Deviations from SPEC
- `leave` is always `null` (24/7 pivot). `arrive` = day-1 elevator arrival only.
- Cleaners keep `kind:"cleaner"` but are the grey "Facilities" crew (role says so, look.outfit=uniform grey); security keeps `kind:"security"` but is the "Floor Supervisor".
- `rooms[].doorTile` is an entry tile on a floor outline, not a real door (there are no walls). `layout.tiles` is visual tint only; use `layout.blocked` (or furniture.solid) for walkability.
- Calendars are a 24h repeating cycle with optional `days` filter instead of separate base/override objects.

## Extra details (v1 as built)
- Counts: 53 people (50 staff incl. receptionist `bea`, cleaners `ines` + `walter`, security `harlan`), 4 candidates + 4 couriers in `visitors`, pets `biscuit` (corgi, bed at 22,30) + `goat` (appearsFromNowhere).
- 13 teams in 6 sections; 61 desks (60 on six 10-seat long tables + `desk-reception`). Unowned desks have `kind:"hotdesk"` (use for new hires / visitors).
- 13 rooms: allhands (65 seats + standTiles), boardroom (14), team-1/2/3 (8/6/8), huddle-1/2/3 (4/3/4), booth-1/2/3 (1), special `wellness` (6 beanbags), `breakroom` (1 chair + escort standTile).
- `layout.librarySeats`, `layout.kitchenSeats`: extra seat tiles `{x,y,facing}` (armchairs / stools).
- `layout.elevator.spawn` (arrivals appear) and `exitSpawn`; `layout.poi.elevator` = same tile. `layout.muster.tiles` = 81 tiles for the fire drill.
- furniture with `decal:true` (the library rug) is a floor decal; anything may sit on it.
- Facilities/security have `deskId:null`; their calendars are 24h `tidy`/`patrol` blocks with `roomId:"floor"` (walk `layout.tidyRoute` / `layout.patrolRoute`), plus `facilitiesCloset`/`shrine` stops.
- Receptionist calendar is mostly `type:"reception", roomId:"reception"` (her desk). She should greet everyone spawning from the elevator.
- Visitors: candidates have `day`, `arrive`, `leave` and a calendar of interviews (`visitors:[id]` on the item; interviewer in `attendees`). Couriers: one 10-min reception item.
- Day 1: people appear at `arrive` via the elevator; skip calendar items before arrival on day 1. From then on calendars repeat daily (filter by `days`). Gaps = work at desk (`person.task`).
- Events extra fields: `window:{from,to}` (random only fires inside), `trigger` (engine hook hints: `{calendarType}`, `{nextBookingWaiting}`, `{quota:1}`, `{arrival:true}`), `participants:{all|orgs|teams|traits, max}`,
  `schedule.fromCalendar:"standup"|"mismatch"|"wellness"|"interview"` (fire when such calendar items start), `schedule.fromVisitors:true`, `location.type:"pet"` (ref = pet id).
- Placeholders also include `{quote}` (pick from `lines.founderQuotes`) and `{prize}` (pick from `company.prizes[].name`).
- `lines.bubbles` has 590 lines over ~95 keys (every event id has a bank; `founder-quote` uses `shrine`).
- Validator: `node src/data/validate.mjs [--map]` (BFS reachability from the elevator, furniture overlap, blocked grid, desks/owners, calendars: room capacity, room double-booking per day, person overlaps, shared meeting consistency, required events, ≥300 lines, banned IP words).
