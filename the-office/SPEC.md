# Pixel Office — spec, architecture contract & acceptance checklist

Calum's ask: a little office simulator. ~50-person startup, each person a real job in a fake, funny, super-generalized startup ("building the startup", nobody knows what it is). Open-plan Stripe-style office with team sections + designated seating, multi-size meeting rooms, receptionist, schedules/calendars defined up front, staggered arrivals, accelerated day/night cycle, cleaners + security at night. World events system: everything reacts live with speech bubbles. Must be REALLY polished ("animations and stuff are killer"). Static site, deployed publicly, link sent to Calum. Mobile (iPhone) + desktop.



## >>> TECH PIVOT (Calum, 9:11 PM): BUILD IN BEVY, DEPLOY TO WEB <<<
This OVERRIDES the JS architecture below. Calum: "can u use bevy for this pls and deploy it somewhere for the web", "use multiple agents", "send photos along the way".
- Rust plus Bevy (latest stable that builds for wasm32), 2D, a WASM web build with trunk (installed at ~/.cargo/bin). Toolchain: rustup target add wasm32-unknown-unknown. Crate at /workspace/pixel-office/game/ (Cargo workspace OK). Use a CARGO_TARGET_DIR under /workspace/pixel-office/target to share builds. Also check the native build for fast iteration and screenshots (headless won't have a GPU, so prefer the wasm build plus headless Chromium with SwiftShader or WebGL2 for screenshots).
- ASSETS: game/assets/. Art is PNG sprite sheets plus atlas manifests (game/assets/art/*.png, art/atlas.ron or .json) with nearest-neighbour sampling (ImagePlugin::default_nearest()). Pixel font: an OFL pixel font (e.g. a free pixel font) in assets/fonts.
- DATA: game/assets/data/company.json (or .ron) loaded at startup into Rust structs via serde. Same contract as the data section below. The validator can be node or a Rust test.
- ENGINE: Bevy ECS. Plugins per system (World, Clock, Movement and pathfinding, Agents/AI, Calendar, Events, Reactions and gossip, Bubbles, Progress, Roles, Render and lighting, UI, Debug). Use bevy_ui or egui (bevy_egui) for UI, styled retro.
- DEPLOY: static trunk dist to a public host (here.now per Calum's saved rule, or Cloudflare Pages or Vercel, both connected). Must load on an iPhone in Safari (WebGL2), with a loading screen.
- Screenshots go to /workspace/pixel-office/shots/ for progress updates.

## >>> PIVOT (Calum, 9:07 PM): SEVERANCE-STYLE INFINITE WHITE VOID <<<
This OVERRIDES conflicting parts below. Calum: "make it like severance?? they're going into an infinite white void and the office setup, void of the rooms but furniture in all the right places and belongings but the floor and infinite white… kind fun ideas! but at night, they stay and work 24/7, meetings all through the day etc"
- WORLD: an infinite white void (soft off-white #f6f5f1 to pure white, subtle radial vignette, faint infinite floor grid or noise that fades into the horizon). NO walls or rooms. Furniture, desks, chairs, plants, monitors and personal belongings (mugs, photos, figurines, a cactus, a stress ball) sit in their exact places as islands on the white. Meeting "rooms" are just their table and chairs plus a thin floor outline, a floating name sign and a capacity tag; sizes from booth to all-hands remain. Soft contact shadows ground everything. The camera can pan endlessly, with sparse odd things far out in the void (a lone filing cabinet, a ringing desk phone, a single plant).
- The only entrance and exit is an ELEVATOR that descends from above or rises from the floor. New hires arrive through it in a calm onboarding moment. The receptionist sits at a desk floating next to the elevator.
- 24/7: nobody goes home. Work never stops; meetings run through the "night". Keep a clock and a day counter with a subtle global light cycle (the white cools to a pale blue-grey at "night", then back), but everyone keeps working: eyelids droop, coffee consumption rises, people nap at their desks, and conga-line meetings run at 3 AM. Cleaners are replaced by a quiet "Facilities" crew of silent people in grey who tidy around workers 24/7. Security becomes a "Floor Supervisor" doing endless rounds.
- Tone: a funny, eerie, corporate-cult parody HOMAGE. It's generic and must not use Lumon or show IP names or characters. The company has a calm, vague mission ("We refine. We align. We are grateful."). Work is mysterious: people sort, refine or calibrate "the numbers" or "the outputs" on CRTs, and nobody knows what the product is. Floating motivational signage ("Your Outie Loves You" → use original lines, e.g. "Alignment is its own reward.", "Please enjoy each metric equally.").
- Fun ideas to include: quota and progress per team ("Q4 Refinement: 73%"); a reward event when a team hits quota (a party with an odd prize such as "Melon Hour", "Finger-Trap Social" or "Waffle Ceremony", original names); a Wellness Session room with soothing facts; a Break Room for misbehaviour (people get escorted there); the Founder portrait shrine and a quote ticker; a perpetual all-hands "Gratitude Assembly"; someone running down an endless void corridor; a goat or office animal that appears from nowhere; a desk tchotchke economy (rewards are erasers and caricature portraits); team rivalries ("Product Refinement" vs "Output Calibration"); an "Overtime Protocol" event that wakes nappers; a ritual "Quarterly Elevator" where someone ascends (gets promoted or leaves, mysteriously); the void "flickers"; whispers of a "Department nobody has seen".
- All prior systems remain: 50 defined people with roles, teams and calendars (now 24h calendars with shift-like rhythms: everyone has meetings at all hours, plus sleep-at-desk blocks), multi-size meeting spaces, a world events bus with live reactions and speech bubbles, a ticker (rename it to an internal "Memo" feed), an inspector, controls, and mobile support. The Stripe-style warmth applies to furniture only (warm wood, plants) against the white.


## RETRO ART DIRECTION (Calum, 9:08 PM: "they used really cool retro style in severance series, make it like that")
The look is a retro-futurist 1970s corporate style (an original homage, no IP). Chunky beige and cream CRT terminals with green-phosphor or teal screens and boxy keyboards. Mid-century walnut desks in modular 4-desk pods with low dividers. Islands of sterile teal-green carpet sit under each department on the infinite white. Brushed steel, brass and avocado accents; Eames-like chairs; filing cabinets; rotary desk phones; potted snake plants. Wear muted 70s office clothes: suits in navy, brown and charcoal, cardigans, turtlenecks, ties, sensible haircuts and a few wild 70s hairdos. Palette: void white, carpet teal (#2f6f68-ish), walnut, beige plastic, CRT green (#7cf2a0 glow), and accent mustard and burnt orange. UI chrome is a retro corporate terminal (monospace, thin rules, green-on-black memo feed, a minimal serif logo). A subtle CRT scanline and phosphor glow shows only on screens and UI. People are pixel art (16x24-ish logical) with personality.

## Architecture (single static site, no build step, ES modules)
/workspace/pixel-office/
  index.html          — shell, canvas, UI overlay (ticker, panel, inspector, clock/speed)
  src/data/company.js — ALL world data (export default {company, teams, people, layout, rooms, events, lines})   [DATA agent]
  src/art/sprites.js  — procedural pixel-art: people (appearance from a seed/spec), furniture, tiles, props, emoji pops   [ART agent]
  src/art/render.js   — draw world: floor/walls/furniture layers, y-sorted actors, lighting (day/night tint, per-section lights, flashlight), bubbles, camera   [ART agent]
  src/sim/*.js        — clock, pathfinding (A* on tile grid), scheduler, agents (needs/traits/state machine), event bus, reactions, gossip, ticker   [ENGINE agent]
  src/main.js         — wiring + UI   [ENGINE agent]

Tile grid: 1 tile = 16 logical px. Office ≈ 64×40 tiles. Logical canvas scaled by integer factor, image-rendering: pixelated, camera pan/zoom (drag/pinch, wheel).

### Data contract (company.js)
- company: {name, tagline, product (vague), stage, version}
- teams: [{id, name, org, color, sectionId, leadId}]  orgs: Eng (Platform, Product Eng, Infra, Data/AI), Product, Design, GTM (Sales, Marketing), Ops (People, Finance, Workplace), Exec, Support.
- people (~50 staff + 2 cleaners + 1 security + receptionist counted in staff): {id, name, role (funny-real title), teamId, managerId, deskId, arrive "HH:MM", leave "HH:MM", traits [e.g. "early-bird","snacker","night-owl","chatty","focused","meeting-lover","pacer"], needs baseline, look {skin, hair, hairStyle, shirt, pants, accessory}, quirk (one-liner), calendar: [{start,end,title,roomId|"desk"|"kitchen"|..., attendees:[ids]}] }
- layout: {w,h, tiles: string rows legend (#wall, .floor, w wood, g glass, d door, p plant ...)} OR structured {sections:[{id,name,rect}], desks:[{id,x,y,facing,sectionId}], rooms:[...], furniture:[{type,x,y,w,h}], poi:{reception, kitchen, coffee, microwave, printer, snackbar, library, entrance, cleanerCloset, toilets}}
- rooms: [{id, name (fun, Stripe-y), size: booth|huddle|team|boardroom|allhands, capacity, rect, doorTile, seats:[{x,y,facing}]}]  ≥2 booths, ≥3 huddle (2–4), ≥3 team (6–8), 1 boardroom (12–14), 1 all-hands (≥50 standing/seated).
- events: catalog [{id, kind: scheduled|random|chained|manual, schedule?, chance?, location (poi/room/global), radius, duration, effects (needs/output deltas), chainsTo?, tickerTemplates[], reactions per trait}]
- lines: speech bubble banks keyed by context/event/trait (≥300 lines total), ticker templates.

### Engine contract
- Clock: sim time; default 1 real sec = 2 sim min (day ≈ 12 real min); speed controls 0.5×/1×/4×/16×/pause; day counter + weekday (Taco Tuesday, Friday deploy).
- Agent state machine: offsite → commuting-in (enter at entrance, greeted by receptionist) → at-desk(working/typing) ↔ meeting ↔ break(kitchen/coffee/snack/toilet) ↔ wander/chat ↔ reacting → leaving → offsite. Utility AI on needs (energy, hunger, social, stress, focus) + traits + calendar.
- Pathfinding: A* on grid, doors, local avoidance / no overlapping, queueing at coffee/microwave.
- EventBus: emit({type, at, radius, data}); subscribers = agents within radius (or global); agents score reactions; reactions → bubble/emote/animation/goal change; events chain; every event → ticker line.
- Gossip: agents passing each other propagate known events with bubble.
- Meetings: start/end from calendars; attendees walk to room, sit; overrun chance → next booking waits outside, knocks; size mismatch moments.
- Night: staff leave → section lights off progressively → cleaners (vacuum, empty bins, banter) → security rounds with flashlight cone → dawn.
- Company progress: version ticks up with output; deploys; "prod down" chain.

## ACCEPTANCE CHECKLIST (verify every box, with screenshots/video evidence)
### World & look
[ ] Stripe-style office: calm palette, warm wood, plants, long shared tables, glass meeting rooms with fun names, library nook, nice kitchen, reception at entrance
[ ] Open plan with labelled team sections and designated desks; each person sits at THEIR desk
[ ] Meeting rooms in multiple sizes: booths, huddle, team, boardroom, all-hands space
[ ] Crisp pixel art at any zoom (integer scaling, no blur), consistent style with the 404 crowd
[ ] Day/night cycle: smooth sky/window tint, interior lighting, lights off by section at night, desk lamps for night owls
### People
[ ] ~50 staff, each with name, role, team, org, manager, desk, arrival/leave time, traits, quirk, calendar — all defined in company.js
[ ] Receptionist greets arrivals, handles visitors and deliveries
[ ] Staggered arrivals (early 7:30, bulk 9–10, stragglers ~11) and staggered departures; night owl stays late
[ ] Walk cycles with bob, facing direction, shadows, no overlaps, idle fidgets/blinks, sit at desk & type
[ ] Office dog wanders, gets pets
[ ] Cleaners at night (vacuum, bins, banter); security guard rounds with flashlight
### Schedules & meetings
[ ] Calendars drive behaviour: people go to the right room at the right time and sit
[ ] Standup, 1:1s, team syncs, all-hands, lunch, focus blocks
[ ] Overruns → next group waits outside glass, knocks; size mismatch moments
### World events system
[ ] Central event bus: scheduled, random, chained, manual events
[ ] Local vs global radius; only people in range react
[ ] Trait/needs-driven reactions (join/ignore/gossip/flee) — visibly different per personality
[ ] Speech bubbles: readable, pop-in/out animation, no overlap pile-ups, startup jargon line banks (≥300 lines)
[ ] Emoji pops (❗😤🎉💀☕) and reaction animations (celebrate, facepalm, run, turn heads)
[ ] Gossip visibly ripples through the office
[ ] Event chains (coffee broken → grumpy/slow → repair → cheer; bad deploy → prod down → engineers sprint → fixed)
[ ] Events present: coffee machine breaks + queue, microwave fish, printer jam, standup overrun, "could've been an email", Friday 4:55 deploy, all-hands, funding round confetti + pizza, birthday cake, fire drill (everyone evacuates), Taco Tuesday, donut drop, prod down
[ ] Slack-style live ticker logs every event with funny lines
### Interaction & UI
[ ] Tap/click a person → inspector: name, role, team, mood/needs, current task, today's calendar (current item highlighted), quirk
[ ] Follow-cam on selected person
[ ] Clock + day + speed controls (pause, 1×, 4×, 16×), skip to night/morning
[ ] Event panel: fire donuts, prod down, fire drill, all-hands, funding, birthday, coffee break
[ ] Company HUD: name, vague product, version, "progress", headcount in office
[ ] Pan/zoom by drag/pinch/wheel; works on iPhone portrait & landscape and desktop
### Quality
[ ] 60fps on iPhone, no console errors, runs 3+ sim days without stuck agents (watchdog: nobody stuck >N min sim)
[ ] Deterministic seed option (?seed=)
[ ] Deployed to a public URL; link verified loading
### Severance pivot checks
[ ] Infinite white void, endless pan, no walls; furniture and belongings islands placed exactly; soft shadows ground them
[ ] Meeting spaces are table and chair clusters with floor outlines, floating signs and sizes from booth to all-hands
[ ] Elevator arrival and departure animation; receptionist by the elevator
[ ] 24/7 operation: no one leaves; meetings at all hours; fatigue visuals (drooping, napping, coffee); "night" is a subtle light shift only
[ ] Facilities crew tidies around workers; Floor Supervisor rounds
[ ] Original corporate-cult parody copy (no Severance or Lumon names); floating signage; Memo feed; quotas and team rivalry; reward-party event; Break Room escort; Wellness; mysterious elevator ascension; void flicker
### Playtest script (QA records each)
1. Load at 7:00 → watch early birds arrive, receptionist greets
2. 9:00–10:00 arrival rush; everyone reaches own desk
3. Standup → overrun → waiting group knocks
4. Fire "coffee breaks" → queue/grumpy bubbles → repair → cheer
5. Fire "donuts" → snackers sprint, focused dev ignores
6. Fire "prod down" → engineers sprint, gossip spreads, ticker
7. Lunch rush / microwave fish
8. All-hands (scheduled) → everyone files into big room
9. 18:00+ departures, lights off by section, night owl stays
10. Night: cleaners + security flashlight; dawn; next day starts (Taco Tuesday / Friday deploy on right weekday)
11. Inspector + follow-cam on 3 random people; calendar matches what they do
12. iPhone viewport: pinch/pan, tap person, panel usable, 60fps
