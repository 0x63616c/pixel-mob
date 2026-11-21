> **SUPERSEDED (23:25 HST):** SPEC.md's TECH PIVOT (Bevy + wasm) replaced the JS architecture. This JS renderer API (src/art/*.js) is NOT being built further.
> Bevy art = PNG sheets + `game/assets/art/atlas.json`, produced by tools/art/*.py (another agent). Engine: read atlas.json, not this file.
> Leftover JS prototype (people generator with 60+ poses, furniture, emotes) lives in src/art/ for reference only.

# Art API contract (src/art/) — v2 (ART agent) — updated for the Severance-style white-void + retro-70s pivot and CONTRACT-data.md

```js
import { createRenderer } from './art/render.js';      // from src/main.js
const R = createRenderer(canvas, data, { seed: 1 });    // data = default export of src/data/company.js
```
The renderer owns canvas sizing (devicePixelRatio aware, listens to resize). It never mutates `data` or `worldState`.

## Renderer methods
| method | notes |
|---|---|
| `R.render(world, simTime, dt)` | call every rAF. `simTime` = sim minutes since start (float; minute-of-day = simTime % 1440). `dt` = real seconds since last frame (for bubble/emote/effect animation). |
| `R.setCamera({x, y, zoom})` | x,y = tile coords of the view centre; zoom = integer-ish pixel scale (clamped 1..8, fractional allowed while pinching, snapped to integer when `R.settleZoom()`). Smoothly eases toward target. Pass `{..., instant:true}` to jump. |
| `R.getCamera()` | `{x, y, zoom}` current target |
| `R.panBy(dxCss, dyCss)` | drag pan in CSS px (cancels follow) |
| `R.zoomAt(factor, sxCss, syCss)` | wheel/pinch zoom around a screen point |
| `R.follow(actorId \| null)` | camera smoothly follows that actor |
| `R.screenToTile(sxCss, syCss)` | → `{x, y}` tile floats (CSS px relative to canvas top-left) |
| `R.tileToScreen(tx, ty)` | → `{x, y}` CSS px |
| `R.pickActorAt(sxCss, syCss)` | → actor id or `null` (uses the last rendered frame's sprite boxes, generous hitbox for touch) |
| `R.fitToView()` | zoom/centre so the whole office fits |
| `R.resize()` | force re-measure (auto on window resize) |
| `R.debug` | `{fps, drawCalls}` |

## worldState (all fields optional except actors)
```js
{
  actors: [{
    id, kind: 'staff'|'receptionist'|'facilities'|'supervisor'|'visitor'|'courier'|'dog'|'goat',   // = person.kind / pet.species
    personId?: same as id (used to look up person.look/seed/name from data if look omitted),
    name?: label shown on the selection tag (defaults to data person.first||name)
    x, y,                 // tile floats; (x,y) = the FEET position (centre of the tile the person stands on = ix+0.5, iy+0.5)
    facing: 'N'|'S'|'E'|'W',   // also accepts 'up'|'down'|'left'|'right'
    anim: 'idle'|'walk'|'run'|'sit'|'type'|'nap'|'celebrate'|'clap'|'facepalm'|'wave'|'talk'|'phone'|'knock'|'drink'|'eat'|'tidy'|'vacuum'|'flashlight'|'slump'|'bow'|'pet',
    // aliases accepted: sprint→run, cheer→celebrate, sleep→nap, turn-head→idle+lookAt, wake→celebrate(short), patrol→walk (+flashlight at night for supervisor)
    // sit/type/nap: the actor is drawn seated on the chair at its tile; pass seated facing in `facing`.
    fatigue?: 0..1,           // >0.55 droopy eyelids, >0.85 slow blinks + yawns; nap shows head-down + zzz automatically
    z?: px lift (logical) for jumps/ascension; hidden?: bool; alpha?: 0..1
    lookAt: {x,y} | null,     // optional head-turn target (tile coords) for 'turn heads'
    look: { skin, hair, hairStyle, shirt, pants, shoes?, accessory? },  // from company.js (see below); missing → derived from id seed
    emote: '❗'|'😤'|'🎉'|'💀'|'☕'|'🍕'|'❤️'|'💤'|'😱'|'🔥'|'❓'|'🍩'|'🎂'|'🌮'|'💸'|'🐟'|'😋'|'👀'|... | null,
    bubble: { text } | null,  // keep the SAME text object/string while showing; set null to dismiss. Renderer animates pop-in/out, wrapping, stacking itself.
    selected: bool,           // draws a selection ring + name tag
    carrying: 'coffee'|'laptop'|'pizza'|'donut'|'taco'|'cake'|'box'|'papers'|'phone'|null,
    seatedFacing?: same as facing (optional; when anim is sit/type the chair is assumed under the actor)
  }],
  props:   [{ id, type: 'donutBox'|'pizza'|'cake'|'tacoBar'|'waffles'|'melons'|'package'|'balloons'|'wetFloor'|'trashBag'|'trophy'|'eraser', x, y }],
  effects: [{ id, type: 'confetti'|'smoke'|'alarm'|'sparkle'|'stink'|'hearts'|'zzz'|'sparks'|'flicker'|'beam', x, y, radius?, t? /*age s; omitted → renderer tracks age from first sight*/, duration? }],
  // 'alarm' with no x/y = full-screen red pulse (fire drill). 'smoke' = burnt popcorn plume. 'stink' = fish wiggle lines.
  roomStates: { [roomId]: { occupied: bool, count?: n, title?: 'Quick Sync', overrun?: bool } },  // nameplate shows title; occupied → warm interior light
  lights:  { [sectionId]: 0..1 | bool },   // interior lights per section (renderer fades smoothly). Missing → auto from time of day.
  elevator:{ phase:'idle'|'descend'|'open'|'close'|'ascend'|'rise', t /*seconds into phase*/ },
      // durations the renderer animates: descend 1.6s (car comes down from above, shadow grows), open 0.7s, close 0.7s,
      // ascend 2.2s (car lifts off into the void with a light beam — 'Quarterly Elevator'), rise 1.6s (car comes UP out of the floor).
      // exported as ELEVATOR_DUR. 'idle' = car present, doors shut. Actors standing inside the elevator rect are clipped by the doors.
  flicker?: 0..1,            // 'the void flickers' — global flicker/scanline glitch strength (or use effect type 'flicker')
  quotas?: { [teamId]: 0..1 } // drawn on each section's floating sign as a progress bar
  machines:{ coffee: 'ok'|'broken'|'brewing', printer: 'ok'|'jam'|'printing', microwave: 'ok'|'running'|'fish' , screen: 'off'|'slides'|'deploy'|'prodDown'|'funding' },
  tv: { text } // optional text on the all-hands screen
}
```

## look spec (renderer accepts any of these)
- `skin`: hex or index 0..6 (light→deep)
- `hair`: hex colour; `hairStyle`: 'short'|'long'|'buzz'|'bald'|'bun'|'pony'|'afro'|'mohawk'|'curly'|'bob'|'cap'|'beanie'|'hijab'|'sidepart'
- `shirt`, `pants`, `shoes`: hex; `outfit?`: 'tee'|'hoodie'|'blazer'|'vest'|'dress'|'uniform' (fleece vests for GTM welcome)
- `accessory`: 'glasses'|'sunglasses'|'headphones'|'beard'|'mustache'|'earrings'|'lanyard'|'airpods'|'none'
- kind 'cleaner' → teal uniform + vacuum cart when anim 'vacuum'; 'security' → navy uniform + cap, flashlight cone at night when anim 'flashlight' (or any anim at night); 'dog' → corgi sprite (look.coat optional).

## Layout (reads CONTRACT-data.md schema directly)
`layout.tiles` (tints: s section carpet, k kitchen, l library rug, o outline), `sections` (teal carpet island + floating section sign + quota bar),
`tables`, `desks` (+`monitor` → CRT; chair drawn on the desk tile), `furniture` (all types in the data vocabulary), `rooms` (outline + floating sign + capacity tag; seats → chairs),
`elevator.rect`, `signs` (floating motivational/wayfinding), `voidProps` (far-out oddities; renderer also scatters a few extra deterministic ones), `people[].belongings` (drawn on their desk).
No walls anywhere: infinite white void, endless pan (camera unclamped).

## Also exported
- `src/art/sprites.js`: `getPersonSheet(look, kind)`, `drawEmoji(ctx, ...)` etc. (internal; engine shouldn't need them)
- `src/art/render.js`: `createRenderer`, `ANIMS` (list of supported anim names), `EMOTES`.
