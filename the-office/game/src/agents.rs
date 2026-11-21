//! People: spawning, needs, traits, utility AI, calendar following, movement (A* + string pulling,
//! steering, yielding, queues) and the arrival flow.
use crate::data::*;
use crate::sim::*;
use crate::world::*;
use bevy::prelude::*;
use std::collections::{HashMap, VecDeque};

// ------------------------------------------------------------------ messages
#[derive(Event, Clone)]
pub struct Say { pub who: Entity, pub text: String, pub secs: f32, pub prio: u8 }
#[derive(Event, Clone)]
pub struct Emote { pub who: Entity, pub icon: String }

thread_local! {
    static SAID: std::cell::RefCell<HashMap<String, f64>> = std::cell::RefCell::new(HashMap::new());
    static NOW: std::cell::Cell<f64> = const { std::cell::Cell::new(0.0) };
}
/// sim clock for anti-repeat bookkeeping (set every frame by the clock system)
pub fn set_now(t: f64) { NOW.with(|n| n.set(t)); }
pub fn sim_now() -> f64 { NOW.with(|n| n.get()) }
/// anti-repeat cooldown for a text drawn from `key`, in sim minutes.
/// company.json gives "sim_seconds" at 1x, i.e. real seconds at normal speed -> x SIM_MIN_PER_SEC sim minutes.
pub fn repeat_cd(d: &Company, key: &str, text: &str) -> f64 {
    let ar = &d.lines.anti_repeat;
    let base = if ar.default_cooldown > 0.0 { ar.default_cooldown } else { 90.0 };
    let k = ar.by_key.get(key).copied().unwrap_or(base);
    let tx = ar.by_text.get(text).copied().unwrap_or(0.0);
    (k.max(tx) * SIM_MIN_PER_SEC) as f64
}
pub fn recently_said(d: &Company, key: &str, text: &str) -> bool {
    let now = NOW.with(|n| n.get());
    SAID.with(|m| m.borrow().get(text).map_or(false, |t| now - *t < repeat_cd(d, key, text)))
}
pub fn mark_said(text: &str) { let now = NOW.with(|n| n.get()); SAID.with(|m| { m.borrow_mut().insert(text.to_string(), now); }); }
/// pick a fresh line from the first matching pool, honouring lines.anti_repeat; falls back to the stalest
pub fn line(d: &Company, rng: &mut SimRng, keys: &[&str]) -> Option<String> {
    for k in keys {
        let snake = k.replace('-', "_");
        let Some(v) = d.lines.bubbles.get(*k).filter(|v| !v.is_empty()).or_else(|| d.lines.bubbles.get(&snake).filter(|v| !v.is_empty())) else { continue };
        let fresh: Vec<&String> = v.iter().filter(|x| !recently_said(d, k, x)).collect();
        let pick = if !fresh.is_empty() { fresh[rng.idx(fresh.len())].clone() } else {
            SAID.with(|m| { let m = m.borrow(); v.iter().min_by(|a, b| m.get(*a).unwrap_or(&-1e9).partial_cmp(m.get(*b).unwrap_or(&-1e9)).unwrap()).cloned().unwrap_or_default() })
        };
        mark_said(&pick);
        return Some(clean(&pick));
    }
    None
}

// ------------------------------------------------------------------ components
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Role { Staff, Receptionist, Facilities, Supervisor, Visitor, Goat, Dog }

#[derive(Clone, Copy, PartialEq, Eq, Debug, Hash)]
pub enum Anim { Idle, Walk, Run, Talk, Type, Sleep, Celebrate, Facepalm, Sit, Drink, Tired, Phone, Knock, Wave, Clap, Flashlight, Stretch, Nod, Doze, Bow, Pet, Fidget }

#[derive(Clone, Debug, PartialEq)]
pub enum Act {
    Hidden,               // not yet arrived (in the elevator shaft)
    Desk,                 // working at own desk
    Nap,                  // napping at desk
    Meeting { room: usize, key: String },
    Waiting { room: usize },
    Queue { q: String },
    Snack,                // eating / drinking at kitchen
    Chat { with: Entity },
    Wander,
    Visit { what: &'static str },
    React { serial: u32 },
    Gossip { serial: u32, target: Entity },
    Patrol { i: usize },
    Tidy { i: usize },
    Reception,
    Escorted,
    Gone,                 // ascended via the quarterly elevator
    Leaving,              // walking to / queueing for the elevator (going home, lunch, errand, visitor leaving)
}
impl Act { /// not available to the director, meetings or gossip
    pub fn absent(&self) -> bool { matches!(self, Act::Hidden | Act::Gone | Act::Leaving) } }

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub enum Prio { Idle = 0, Need = 1, Calendar = 2, Event = 3, Forced = 4 }

#[derive(Clone, Debug)]
pub struct Plan { pub act: Act, pub dest: Vec2, pub face: Option<Facing>, pub until: f64, pub label: String, pub prio: Prio, pub anim: Anim, pub run: bool, pub look_at: Option<Vec2> }

#[derive(Component)]
pub struct Agent {
    pub pi: Option<usize>, pub id: String, pub name: String, pub first: String, pub role: Role, pub team: String, pub org: String,
    pub traits: Vec<String>, pub needs: Needs, pub base: Needs, pub desk: Option<usize>, pub home: Vec2, pub home_face: Facing,
    pub plan: Plan, pub plan_t: f64, pub knows: Vec<u32>, pub punctual: f32, pub arrive_at: Option<f64>, pub task: String,
    pub next_think: f64, pub last_say: f64, pub react_anim: Option<(Anim, f32)>, pub fatigue: f32, pub greeted: bool, pub stuck: u32,
    pub seed: u64,
}
impl Agent {
    pub fn has(&self, t: &str) -> bool { self.traits.iter().any(|x| x == t) }
    pub fn mood(&self) -> f32 { (self.needs.energy * 0.3 + (1.0 - self.needs.hunger) * 0.2 + self.needs.social * 0.2 + (1.0 - self.needs.stress) * 0.3).clamp(0.0, 1.0) }
}

#[derive(Component)]
pub struct Mover { pub pos: Vec2, pub vel: Vec2, pub path: VecDeque<Vec2>, pub dest: Option<Vec2>, pub facing: Facing, pub speed: f32, pub yield_t: f32, pub arrived: bool, pub last_check: Vec2, pub stall: f32, pub repaths: u32, pub debug_path: Vec<Vec2>, pub blocked: f32, pub blocker: Option<Entity>, pub sidestep: f32, pub anchor: Vec2, pub wait_sim: f32 }
impl Mover {
    pub fn new(p: Vec2, f: Facing) -> Self { Mover { pos: p, vel: Vec2::ZERO, path: VecDeque::new(), dest: None, facing: f, speed: 1.0, yield_t: 0.0, arrived: true, last_check: p, stall: 0.0, repaths: 0, debug_path: vec![], blocked: 0.0, blocker: None, sidestep: 0.0, anchor: p, wait_sim: 0.0 } }
}

/// Visual state consumed by render.
#[derive(Component, Default)]
pub struct Pose { pub anim: Option<Anim>, pub t: f32, pub lift: f32, pub alpha: f32, pub look: Option<Vec2>, pub squash: f32, pub hidden: bool, pub selected: bool, pub blink: f32 }

// ------------------------------------------------------------------ calendar cache
#[derive(Clone, Debug)]
pub struct Slot { pub start: f32, pub end: f32, pub item: CalItem }
#[derive(Component, Default)]
pub struct Cal { pub day: usize, pub slots: Vec<Slot> }

#[derive(Resource, Default)]
pub struct Rooms { pub states: Vec<RoomState> }
#[derive(Clone, Default, Debug)]
pub struct RoomState { pub count: usize, pub title: String, pub key: String, pub overrun_until: f64, pub overrun_key: String, pub waiting: usize, pub last_key: String }

#[derive(Resource, Default)]
pub struct Queues { pub lines: HashMap<String, Vec<Entity>>, pub service: HashMap<String, f32> }

#[derive(Resource, Default)]
pub struct Machines { pub coffee_broken: bool, pub printer_jam: bool, pub fish: f32, pub screen: String, pub flicker: f32, pub alarm: f32, pub output_mult: f32, pub gerald_missing: bool }

pub struct AgentsPlugin;
impl Plugin for AgentsPlugin {
    fn build(&self, app: &mut App) {
        app.add_event::<Say>().add_event::<Emote>()
            .init_resource::<Rooms>().init_resource::<Queues>().insert_resource(Machines { output_mult: 1.0, ..default() })
            .add_systems(Startup, spawn_people.in_set(StartupSet::Agents).after(StartupSet::World))
            .add_systems(Update, (spread_once, refresh_calendars, needs_tick, think, idle_cues, queues_tick, reserve_dests, movement, pose_tick).chain().in_set(SimSet::Agents));
    }
}
#[derive(SystemSet, Debug, Clone, PartialEq, Eq, Hash)]
pub enum SimSet { Clock, Events, Agents, Roles, Visual }

pub fn trait_vec(p: &Person) -> Vec<String> { p.traits.clone() }

fn hash(s: &str) -> u64 { s.bytes().fold(1469598103934665603u64, |h, b| (h ^ b as u64).wrapping_mul(1099511628211)) }

pub fn spawn_people(mut cmd: Commands, data: Res<Data>, idx: Res<WorldIndex>, grid: Res<Grid>, clock: Res<Clock>, mut rng: ResMut<SimRng>) {
    let d = &data.0;
    let l = &d.layout;
    let elev = l.elevator.spawn;
    let elev_p = Vec2::new(elev.x + 0.5, elev.y + 0.5);
    for (pi, p) in d.people.iter().enumerate() {
        let role = match p.kind.as_str() { "receptionist" => Role::Receptionist, "cleaner" | "facilities" => Role::Facilities, "security" | "supervisor" => Role::Supervisor, _ => Role::Staff };
        let desk = p.desk_id.as_ref().and_then(|id| idx.desk_by_id.get(id).copied()).or_else(|| l.desks.iter().position(|dk| dk.owner_id.as_deref() == Some(&p.id)));
        let (home, home_face) = match desk {
            Some(di) => { let dk = &l.desks[di]; (Vec2::new(dk.x as f32 + 0.5, dk.y as f32 + 0.5), dk.facing) }
            None => match role {
                Role::Receptionist => { let r = idx.poi(d, "reception").unwrap_or(elev_p); (r, l.poi.get("reception").and_then(|p| p.facing).unwrap_or(Facing::Down)) }
                _ => (l.poi.get("facilities_closet").map(|p| tile_center(p)).unwrap_or(elev_p), Facing::Down),
            },
        };
        let home = { let t = home.floor().as_ivec2(); if grid.walkable(t.x, t.y) || desk.is_some() { home } else { grid.nearest_walkable(t).as_vec2() + 0.5 } };
        let seed = if p.seed != 0 { p.seed } else { hash(&p.id) };
        let mut traits = trait_vec(p);
        traits.sort();
        // punctuality bias in sim minutes (+ = early)
        let mut punct = ((seed % 7) as f32 - 3.0) * 0.6;
        if traits.iter().any(|t| t == "meeting-lover" || t == "anxious" || t == "overachiever") { punct += 3.0; }
        if traits.iter().any(|t| t == "slacker" || t == "rebel") { punct -= 4.0; }
        let base = p.needs.clone().unwrap_or(Needs { energy: 0.8, hunger: 0.3, social: 0.5, stress: 0.3, focus: 0.6 });
        // arrival (day-1 only): staggered via elevator; jitter so nobody arrives on the exact minute
        let arr = to_min(&p.arrive) as f64 + ((seed >> 8) % 9) as f64 - 4.0;
        let arrive_at = if clock.day() == 0 && !p.arrive.is_empty() && arr > clock.t { Some(arr) } else { None };
        let start_pos = if arrive_at.is_some() { elev_p } else { home };
        let plan = Plan { act: if arrive_at.is_some() { Act::Hidden } else { Act::Desk }, dest: start_pos, face: Some(home_face), until: 0.0, label: if arrive_at.is_some() { "On the way down".into() } else { p.task.clone() }, prio: Prio::Idle, anim: Anim::Sit, run: false, look_at: None };
        let a = Agent {
            pi: Some(pi), id: p.id.clone(), name: clean(&p.name), first: clean(if p.first.is_empty() { &p.name } else { &p.first }), role, team: p.team_id.clone(), org: p.org.clone(), traits,
            needs: Needs { energy: base.energy * rng.range(0.85, 1.05), hunger: base.hunger, social: base.social, stress: base.stress, focus: base.focus }, base, desk, home, home_face,
            plan, plan_t: clock.t, knows: vec![], punctual: punct, arrive_at, task: clean(&p.task), next_think: clock.t + rng.range(0.0, 3.0) as f64, last_say: -100.0, react_anim: None, fatigue: 0.0, greeted: false, stuck: 0, seed,
        };
        let hidden = a.arrive_at.is_some();
        cmd.spawn((a, Mover::new(start_pos, home_face), Pose { hidden, alpha: if hidden { 0.0 } else { 1.0 }, ..default() }, Cal::default(), Transform::default(), Visibility::default()));
    }
}

fn refresh_calendars(data: Res<Data>, clock: Res<Clock>, mut q: Query<(&Agent, &mut Cal)>) {
    let day = clock.day();
    for (a, mut cal) in &mut q {
        if cal.day == day && !cal.slots.is_empty() { continue; }
        let Some(pi) = a.pi else { continue };
        let p = &data.0.people[pi];
        cal.day = day;
        cal.slots = data.0.calendar_for(p, clock.weekday()).into_iter().map(|c| Slot { start: to_min(&c.start), end: to_min(&c.end).max(to_min(&c.start) + 1.0), item: c.clone() }).collect();
        if cal.slots.is_empty() { cal.slots.push(Slot { start: -1.0, end: -1.0, item: CalItem::default() }); }
    }
}

fn needs_tick(clock: Res<Clock>, mut q: Query<&mut Agent>) {
    let dt = clock.dt_min;
    if dt <= 0.0 { return; }
    let night = clock.night();
    for mut a in &mut q {
        if a.role != Role::Staff && a.role != Role::Visitor { a.needs.energy = 0.8; continue; }
        let napping = a.plan.act == Act::Nap;
        let drain = if a.has("night-owl") { 0.0009 * (1.0 + night * 0.2) } else { 0.0011 * (1.0 + night * 0.9) } * if a.has("caffeinated") { 1.2 } else { 1.0 };
        let snack_k = if a.traits.iter().any(|t| t == "snacker") { 1.4 } else { 1.0 };
        let n = &mut a.needs;
        if napping { n.energy += 0.009 * dt; } else { n.energy -= drain * dt; }
        n.hunger += 0.0011 * dt * snack_k;
        let social_plan = matches!(a.plan.act, Act::Meeting { .. } | Act::Chat { .. } | Act::Snack | Act::Gossip { .. });
        let n = &mut a.needs;
        if social_plan { n.social += 0.004 * dt; } else { n.social -= 0.0007 * dt; }
        let bs = a.base.stress;
        a.needs.stress += (bs - a.needs.stress) * 0.004 * dt;
        let n = &mut a.needs;
        n.energy = n.energy.clamp(0.0, 1.0); n.hunger = n.hunger.clamp(0.0, 1.0); n.social = n.social.clamp(0.0, 1.0); n.stress = n.stress.clamp(0.0, 1.0); n.focus = n.focus.clamp(0.0, 1.0);
        a.fatigue = (1.0 - a.needs.energy).clamp(0.0, 1.0);
    }
}

// ------------------------------------------------------------------ the brain
pub struct Ctx<'a> { pub d: &'a Company, pub idx: &'a WorldIndex, pub grid: &'a Grid, pub clock: &'a Clock, pub rooms: &'a Rooms, pub machines: &'a Machines }

pub fn seat_for(d: &Company, room: usize, attendees: &[String], me: &str, rng_seed: u64) -> (Vec2, Facing, bool) {
    let r = &d.rooms[room];
    let i = attendees.iter().position(|x| x == me).unwrap_or((rng_seed % 13) as usize);
    if i < r.seats.len() { let s = &r.seats[i]; return (tile_center(s), s.facing.unwrap_or(Facing::Up), true); }
    let k = i - r.seats.len();
    if k < r.stand_tiles.len() { let s = &r.stand_tiles[k]; return (tile_center(s), Facing::from_vec(r.rect.center() - tile_center(s)), false); }
    // crammed: ring around the table inside the outline
    let c = r.rect.center();
    let ang = k as f32 * 2.4;
    let p = c + Vec2::new(ang.cos() * (r.rect.w as f32 * 0.5 - 0.5), ang.sin() * (r.rect.h as f32 * 0.5 - 0.5));
    (p.floor() + 0.5, Facing::from_vec(c - p), false)
}

fn meeting_anim(kind: &str, sitting: bool) -> Anim { match kind { "nap" => Anim::Sleep, _ if !sitting => Anim::Talk, _ => Anim::Sit } }

/// Builds the plan an agent should follow for a calendar slot, if any.
fn plan_for_slot(cx: &Ctx, a: &Agent, s: &Slot, rng: &mut SimRng) -> Option<Plan> {
    let it = &s.item;
    let day0 = (cx.clock.day() as f64) * 1440.0;
    let until = day0 + s.end as f64;
    let label = clean(&it.title);
    let rid = it.room_id.as_str();
    let mk = |act: Act, dest: Vec2, face: Option<Facing>, anim: Anim| Some(Plan { act, dest, face, until, label: label.clone(), prio: Prio::Calendar, anim, run: false, look_at: None });
    match (it.kind.as_str(), rid) {
        (_, "desk") | ("focus", _) | ("nap", _) => {
            if a.desk.is_none() { return None; }
            if it.kind == "nap" { mk(Act::Nap, a.home, Some(a.home_face), Anim::Sleep) } else { mk(Act::Desk, a.home, Some(a.home_face), Anim::Type) }
        }
        ("patrol", _) | ("tidy", _) | (_, "floor") => None, // handled by roles
        ("reception", _) if a.role == Role::Receptionist => None,
        _ => {
            if let Some(&ri) = cx.idx.room_by_id.get(rid) {
                let rs = cx.rooms.states.get(ri);
                let key = if it.id.is_empty() { format!("{}@{}", rid, it.start) } else { it.id.clone() };
                if let Some(rs) = rs { if rs.overrun_until > cx.clock.t && rs.overrun_key != key && !rs.overrun_key.is_empty() {
                    let r = &cx.d.rooms[ri];
                    let w = if r.wait_tiles.is_empty() { r.door_tile } else { r.wait_tiles[(a.seed % r.wait_tiles.len() as u64) as usize] };
                    let wp = tile_center(&w);
                    return Some(Plan { act: Act::Waiting { room: ri }, dest: wp, face: Some(Facing::from_vec(r.rect.center() - wp)), until: rs.overrun_until.min(until), label: format!("Waiting for {}", clean(&r.name)), prio: Prio::Calendar, anim: Anim::Idle, run: false, look_at: Some(r.rect.center()) });
                } }
                let (p, f, sit) = seat_for(cx.d, ri, &it.attendees, &a.id, a.seed);
                return mk(Act::Meeting { room: ri, key }, p, Some(f), meeting_anim(&it.kind, sit));
            }
            // POI-based items (lunch, kitchen, library, shrine, reception...)
            let poi_key = match rid { "" => match it.kind.as_str() { "lunch" | "dinner" | "snack" => "kitchen", _ => "" }, k => k };
            if let Some(p) = cx.idx.poi(cx.d, poi_key) {
                let seats = if poi_key == "kitchen" { &cx.d.layout.kitchen_seats } else if poi_key == "library" { &cx.d.layout.library_seats } else { &cx.d.layout.wander_spots };
                let (dest, face, anim) = if !seats.is_empty() && (poi_key == "kitchen" || poi_key == "library") { let s = &seats[(a.seed as usize + rng.idx(3)) % seats.len()]; (tile_center(s), s.facing, if poi_key == "kitchen" { Anim::Drink } else { Anim::Sit }) }
                    else { let j = Vec2::new(rng.range(-1.5, 1.5), rng.range(-1.0, 1.0)); let t = (p + j).floor().as_ivec2(); (cx.grid.nearest_walkable(t).as_vec2() + 0.5, None, Anim::Talk) };
                let act = if matches!(it.kind.as_str(), "lunch" | "dinner" | "snack") { Act::Snack } else { Act::Visit { what: "poi" } };
                return Some(Plan { act, dest, face, until, label, prio: Prio::Calendar, anim, run: false, look_at: Some(p) });
            }
            None
        }
    }
}

fn travel_minutes(from: Vec2, to: Vec2) -> f32 { (from - to).length() * 1.25 / WALK_TILES_PER_MIN + 1.0 }
pub const WALK_TILES_PER_MIN: f32 = 1.5;

fn choose_need(cx: &Ctx, a: &Agent, rng: &mut SimRng) -> Plan {
    let t = cx.clock.t;
    let n = &a.needs;
    let night = cx.clock.night();
    let mut opts: Vec<(f32, &'static str)> = vec![];
    let tr = |s: &str| if a.has(s) { 1.0 } else { 0.0 };
    opts.push((0.9 + n.focus * 0.3 + tr("focused") * 0.6 + tr("overachiever") * 0.4 - tr("slacker") * 0.3, "work"));
    opts.push(((1.0 - n.energy) * 1.1 + tr("caffeinated") * 0.5 - if cx.machines.coffee_broken { 0.6 } else { 0.0 }, "coffee"));
    opts.push((n.hunger * 1.2 + tr("snacker") * 0.5 - 0.35, "snack"));
    opts.push(((1.0 - n.social) * 0.7 + tr("chatty") * 0.35 + tr("gossip") * 0.2 - 0.25, "chat"));
    opts.push((((0.35 - n.energy) * 3.0).max(0.0) + tr("napper") * 0.3 * night, "nap"));
    opts.push((tr("pacer") * 0.45 + tr("rebel") * 0.15 - 0.1, "wander"));
    opts.push((tr("devout") * 0.3 - 0.05, "shrine"));
    opts.push((0.08 + tr("dog-lover") * 0.2, "water"));
    // soft-max pick among the top 3
    opts.sort_by(|x, y| y.0.partial_cmp(&x.0).unwrap());
    let top: Vec<_> = opts.iter().take(3).map(|(s, k)| ((s * 3.0).exp(), *k)).collect();
    let sum: f32 = top.iter().map(|x| x.0).sum();
    let mut r = rng.f() * sum; let mut pick = top[0].1;
    for (w, k) in &top { if r < *w { pick = k; break; } r -= w; }
    let dur = |lo: f32, hi: f32, rng: &mut SimRng| t + rng.range(lo, hi) as f64;
    let mut plan = |act: Act, dest: Vec2, face: Option<Facing>, until: f64, label: &str, anim: Anim| Plan { act, dest, face, until, label: label.to_string(), prio: Prio::Need, anim, run: false, look_at: None };
    match pick {
        "coffee" => Plan { look_at: cx.idx.poi(cx.d, "coffee"), ..plan(Act::Queue { q: "coffee".into() }, cx.idx.poi(cx.d, "coffee").unwrap_or(a.home), None, dur(25.0, 40.0, rng), "Getting coffee", Anim::Idle) },
        "snack" => { let q = if rng.chance(0.5) { "snackbar" } else { "microwave" }; plan(Act::Queue { q: q.into() }, cx.idx.poi(cx.d, q).unwrap_or(a.home), None, dur(25.0, 45.0, rng), if q == "microwave" { "Heating something questionable" } else { "Snack run" }, Anim::Idle) }
        "nap" if a.desk.is_some() => plan(Act::Nap, a.home, Some(a.home_face), dur(30.0, 70.0, rng), "Mandatory Rest Interval (self-assigned)", Anim::Sleep),
        "wander" | "shrine" | "water" => {
            let key = match pick { "shrine" => "shrine", "water" => "water_cooler", _ => "" };
            let p = if key.is_empty() { cx.d.layout.wander_spots.get(rng.idx(cx.d.layout.wander_spots.len().max(1))).map(tile_center).unwrap_or(a.home + Vec2::new(rng.range(-6.0, 6.0), rng.range(-4.0, 4.0))) } else { cx.idx.poi(cx.d, key).unwrap_or(a.home) };
            let dest = cx.grid.nearest_walkable((p + Vec2::new(rng.range(-1.0, 1.0), rng.range(-1.0, 1.0))).floor().as_ivec2()).as_vec2() + 0.5;
            let label = match pick { "shrine" => "Quiet reflection at the Founder's portrait", "water" => "Hydrating, socially", _ => if a.has("pacer") { "Pacing (thinking)" } else { "Wandering the void" } };
            plan(Act::Wander, dest, None, dur(10.0, 22.0, rng), label, if pick == "water" { Anim::Drink } else { Anim::Idle })
        }
        _ => plan(Act::Desk, a.home, Some(a.home_face), dur(30.0, 75.0, rng), &a.task, Anim::Type),
    }
}

/// first frame: nobody starts the sim standing inside someone else (shared spawn points, night crew)
fn spread_once(mut done: Local<bool>, grid: Res<Grid>, mut q: Query<(&mut Mover, &Pose)>) {
    if *done { return; }
    *done = true;
    let mut taken: Vec<Vec2> = vec![];
    for (mut mv, pose) in &mut q {
        if pose.hidden { continue; }
        if taken.iter().any(|p| (*p - mv.pos).length() < PERSONAL) {
            let c = mv.pos.floor().as_ivec2();
            'f: for r in 1..6 { for dy in -r..=r { for dx in -r..=r {
                let t = c + IVec2::new(dx, dy);
                let p = t.as_vec2() + 0.5;
                if grid.walkable(t.x, t.y) && !taken.iter().any(|x| (*x - p).length() < PERSONAL + 0.1) { mv.pos = p; mv.path.clear(); mv.arrived = false; break 'f; }
            } } }
        }
        taken.push(mv.pos);
    }
}

/// a pending idle-action line, spoken on arrival
#[derive(Component)]
pub struct IdleCue(pub String);

/// company.json `idle_actions`: weighted little bits of business, gated by their conditions
fn choose_idle(cx: &Ctx, a: &Agent, pos: Vec2, rng: &mut SimRng) -> Option<(Plan, String)> {
    let t = cx.clock.t;
    let hour = cx.clock.mod_min() / 60.0;
    let mut opts: Vec<(f32, &IdleAction, Vec2, Option<Facing>, bool)> = vec![];
    for ia in &cx.d.idle_actions {
        let c = &ia.conditions;
        let s = |k: &str| c.get(k).and_then(|v| v.as_str());
        let list = |k: &str| c.get(k).and_then(|v| v.as_array()).map(|a| a.iter().filter_map(|x| x.as_str().map(String::from)).collect::<Vec<_>>());
        if c.get("kinds").is_some() || c.get("duties").is_some() || c.get("near").is_some() || c.get("near_pet").is_some() { continue; }
        if let Some(h) = c.get("hour").and_then(|v| v.as_array()) { let (lo, hi) = (h.first().and_then(|x| x.as_f64()).unwrap_or(0.0) as f32, h.get(1).and_then(|x| x.as_f64()).unwrap_or(24.0) as f32); if hour < lo || hour >= hi { continue; } }
        if let Some(tl) = list("traits_any") { if !tl.iter().any(|x| a.has(x)) { continue; } }
        if let Some(tm) = s("team") { if a.team != tm && a.org != tm { continue; } }
        if let Some(e) = c.get("energy_min").and_then(|v| v.as_f64()) { if a.needs.energy < e as f32 { continue; } }
        let mut w = ia.weight.max(0.05);
        if let Some(tl) = list("traits_boost") { if tl.iter().any(|x| a.has(x)) { w *= 2.5; } }
        let (dest, face, desk) = if s("at") == Some("desk") {
            if a.desk.is_none() { continue; } (a.home, Some(a.home_face), true)
        } else if let Some(k) = s("poi") {
            let Some(p) = cx.idx.poi(cx.d, k) else { continue };
            if (p - pos).length() > 40.0 { w *= 0.4; }
            (cx.grid.nearest_walkable((p + Vec2::new(rng.range(-1.2, 1.2), rng.range(-1.2, 1.2))).floor().as_ivec2()).as_vec2() + 0.5, Some(Facing::from_vec(p - pos)), false)
        } else if c.get("away_from_carpet").is_some() || ia.anim == "walk" {
            let spots = &cx.d.layout.wander_spots; if spots.is_empty() { continue; }
            (cx.grid.nearest_walkable(tile_center(&spots[rng.idx(spots.len())]).floor().as_ivec2()).as_vec2() + 0.5, None, false)
        } else { (pos, None, false) };
        opts.push((w, ia, dest, face, desk));
    }
    let sum: f32 = opts.iter().map(|o| o.0).sum();
    if sum <= 0.0 { return None; }
    let mut r = rng.f() * sum;
    let pick = opts.iter().find(|o| { let hit = r < o.0; r -= o.0; hit }).or(opts.last())?;
    let (_, ia, dest, face, desk) = pick;
    let anim = match ia.anim.as_str() { "walk" | "idle" => Anim::Idle, "talk" => Anim::Talk, "sleep" => Anim::Sleep, x => crate::events::anim_of(x).unwrap_or(Anim::Idle) };
    let anim = if *desk && anim == Anim::Idle { Anim::Sit } else { anim };
    let until = t + (ia.duration.max(2.0) * 3.0 + rng.range(0.0, 4.0)) as f64;
    let act = if *desk { Act::Desk } else { Act::Wander };
    Some((Plan { act, dest: *dest, face: *face, until, label: clean(&ia.name), prio: Prio::Need, anim, run: false, look_at: None }, ia.line_key.clone()))
}

fn idle_cues(mut cmd: Commands, data: Res<Data>, mut rng: ResMut<SimRng>, q: Query<(Entity, &Mover, &Agent, &IdleCue)>, mut say: EventWriter<Say>) {
    for (e, mv, a, cue) in &q {
        if a.plan.act.absent() || !matches!(a.plan.act, Act::Desk | Act::Wander) { cmd.entity(e).remove::<IdleCue>(); continue; }
        if !mv.arrived { continue; }
        cmd.entity(e).remove::<IdleCue>();
        if rng.chance(0.6) { if let Some(s) = line(&data.0, &mut rng, &[cue.0.as_str()]) { say.write(Say { who: e, text: s, secs: 2.6, prio: 0 }); } }
    }
}

#[allow(clippy::too_many_arguments)]
fn think(
    data: Res<Data>, idx: Res<WorldIndex>, grid: Res<Grid>, clock: Res<Clock>, rooms: Res<Rooms>, machines: Res<Machines>, mut rng: ResMut<SimRng>,
    mut q: Query<(Entity, &mut Agent, &mut Mover, &Cal, &mut Pose)>, mut say: EventWriter<Say>, mut memo: ResMut<Memo>, mut cmd: Commands,
    mut claims: Local<HashMap<Entity, (usize, usize)>>,
) {
    // big-room seat claims (the amphitheatre): first come, front row first; a claim lapses when its owner moves on
    { let live: HashMap<Entity, usize> = q.iter().filter_map(|(e, a, ..)| if let Act::Meeting { room, .. } = a.plan.act { Some((e, room)) } else { None }).collect();
      claims.retain(|e, (r, _)| live.get(e) == Some(r) || (q.get(*e).map_or(false, |x| x.1.plan_t > clock.t - 2.0))); }
    let cx = Ctx { d: &data.0, idx: &idx, grid: &grid, clock: &clock, rooms: &rooms, machines: &machines };
    let t = clock.t;
    let tod = clock.mod_min();
    let day0 = clock.day() as f64 * 1440.0;
    for (e, mut a, mut mv, cal, mut pose) in &mut q {
        if matches!(a.role, Role::Goat | Role::Dog | Role::Visitor) { continue; }
        if a.plan.act == Act::Gone { continue; }
        if a.plan.act.absent() { continue; } // the elevator releases them / presence.rs walks them out
        if a.role == Role::Facilities || a.role == Role::Supervisor { continue; } // roles.rs drives them
        if t < a.next_think && a.plan.prio >= Prio::Calendar && t < a.plan.until { continue; }
        if t < a.next_think { continue; }
        a.next_think = t + 0.5 + (e.index() % 5) as f64 * 0.1;
        // 1) the calendar (leave early enough to be on time, personalised punctuality)
        let mut cal_plan: Option<Plan> = None;
        if a.role == Role::Staff {
            for s in &cal.slots {
                if s.item.room_id.is_empty() && s.item.kind.is_empty() { continue; }
                let lead = travel_minutes(mv.pos, a.home).min(25.0).max(1.0) * 0.0 + if let Some(&ri) = idx.room_by_id.get(&s.item.room_id) { travel_minutes(mv.pos, data.0.rooms[ri].rect.center()) } else { 1.0 };
                let leave_at = s.start - lead - a.punctual - ((a.seed as f32 * 0.37 + s.start).sin() * 1.5);
                if tod >= leave_at && tod < s.end { cal_plan = plan_for_slot(&cx, &a, s, &mut rng); if cal_plan.is_some() { break; } }
            }
            // overrun: stay seated while our previous booking runs long
            if let Act::Meeting { room, key } = &a.plan.act {
                if let Some(rs) = rooms.states.get(*room) { if rs.overrun_key == *key && rs.overrun_until > t {
                    if cal_plan.as_ref().map_or(true, |p| p.act != a.plan.act) { a.plan.until = rs.overrun_until; continue; }
                } }
            }
        }
        let busy_event = a.plan.prio >= Prio::Event && t < a.plan.until;
        if busy_event { continue; }
        if let Some(mut p) = cal_plan {
            if let Act::Meeting { room, .. } = p.act { if data.0.rooms.get(room).map_or(false, |r| r.seats.len() >= 24) {
                let seat = match claims.get(&e) { Some((r, k)) if *r == room => Some(*k), _ => {
                    let taken: std::collections::HashSet<usize> = claims.iter().filter(|(o, (r, _))| **o != e && *r == room).map(|(_, (_, k))| *k).collect();
                    (0..data.0.rooms[room].seats.len()).find(|k| !taken.contains(k)) } };
                if let Some(k) = seat { claims.insert(e, (room, k)); let st = &data.0.rooms[room].seats[k]; p.dest = tile_center(st); p.face = st.facing.or(Some(Facing::Up)); p.anim = Anim::Sit; }
            } }
            let same = p.act == a.plan.act && (p.dest - a.plan.dest).length() < 0.1;
            if !same {
                let entering_meeting = matches!(p.act, Act::Meeting { .. });
                let was_waiting = matches!(a.plan.act, Act::Waiting { .. });
                if was_waiting && entering_meeting && rng.chance(0.35) { if let Some(s) = line(&data.0, &mut rng, &["could-have-been-email", "meeting"]) { say.write(Say { who: e, text: s, secs: 3.5, prio: 1 }); } }
                if let Act::Waiting { .. } = p.act { if rng.chance(0.5) { if let Some(s) = line(&data.0, &mut rng, &["waiting_outside", "knock"]) { say.write(Say { who: e, text: s, secs: 3.0, prio: 1 }); } } }
                if let Act::Nap = p.act { if rng.chance(0.08) { memo.push(&clock, MemoKind::People, format!("{} is taking a Mandatory Rest Interval at their desk.", a.first)); } }
                set_plan(&mut a, &mut mv, &grid, p, t);
            } else { a.plan.until = p.until; }
            continue;
        }
        // 2) plan finished (or idle) -> needs-driven utility choice
        if t >= a.plan.until || a.plan.prio == Prio::Calendar && t >= a.plan.until {
            let woke = a.plan.act == Act::Nap;
            let mut p = choose_need(&cx, &a, &mut rng);
            if !woke && p.act != Act::Nap && rng.chance(0.24) {
                if let Some((ip, key)) = choose_idle(&cx, &a, mv.pos, &mut rng) { p = ip; cmd.entity(e).insert(IdleCue(key)); }
            }
            if woke && p.act != Act::Nap { if let Some(s) = line(&data.0, &mut rng, &["waking"]) { if rng.chance(0.4) { say.write(Say { who: e, text: s, secs: 2.5, prio: 0 }); } } }
            set_plan(&mut a, &mut mv, &grid, p, t);
        }
        let _ = (&mut pose, day0);
    }
}

pub fn set_plan(a: &mut Agent, mv: &mut Mover, grid: &Grid, p: Plan, t: f64) {
    let dest = p.dest;
    a.plan = p; a.plan_t = t; a.react_anim = None;
    route(mv, grid, dest);
}

/// A* then string-pull: keep only the waypoints we can't see past (grid line-of-sight), so people
/// walk in natural straight lines instead of tile staircases.
pub fn route_avoiding(mv: &mut Mover, grid: &Grid, dest: Vec2, extra: &std::collections::HashSet<IVec2>) {
    let mut g2 = grid.clone();
    for t in extra { if t.as_vec2() + 0.5 != dest { g2.set(t.x, t.y, true); } }
    let from = mv.pos.floor().as_ivec2();
    if g2.path(from, dest.floor().as_ivec2()).is_some() { route(mv, &g2, dest); } else { route(mv, grid, dest); }
}

pub fn route(mv: &mut Mover, grid: &Grid, dest: Vec2) {
    mv.dest = Some(dest);
    mv.arrived = false;
    mv.path.clear();
    mv.stall = 0.0;
    let from = mv.pos.floor().as_ivec2();
    let to = dest.floor().as_ivec2();
    if from == to { mv.path.push_back(dest); mv.debug_path = vec![mv.pos, dest]; return; }
    match grid.path(from, to) {
        Some(tiles) => {
            let pts: Vec<Vec2> = tiles.iter().map(|t| t.as_vec2() + 0.5).collect();
            let mut out = vec![];
            let mut anchor = mv.pos;
            let mut i = 1;
            while i < pts.len() {
                // advance as far as line-of-sight holds
                let mut j = i;
                while j + 1 < pts.len() && los(grid, anchor, pts[j + 1]) { j += 1; }
                out.push(pts[j]);
                anchor = pts[j];
                i = j + 1;
            }
            if let Some(last) = out.last_mut() { if (*last - dest).length() < 0.75 { *last = dest; } else { out.push(dest); } } else { out.push(dest); }
            mv.debug_path = std::iter::once(mv.pos).chain(out.iter().copied()).collect();
            mv.path = out.into();
        }
        None => { mv.path.push_back(dest); mv.debug_path = vec![mv.pos, dest]; }
    }
}

/// conservative line of sight: sample the segment with a body radius
pub fn los(grid: &Grid, a: Vec2, b: Vec2) -> bool {
    let d = b - a; let n = (d.length() * 4.0).ceil().max(1.0) as i32;
    for k in 0..=n {
        let p = a + d * (k as f32 / n as f32);
        for off in [Vec2::ZERO, Vec2::new(0.28, 0.0), Vec2::new(-0.28, 0.0), Vec2::new(0.0, 0.28), Vec2::new(0.0, -0.28)] {
            let q = (p + off).floor().as_ivec2();
            if !grid.walkable(q.x, q.y) {
                // the destination tile itself may be a seat on furniture; allow the last stretch
                if (p - b).length() < 0.8 { continue; }
                return false;
            }
        }
        // seats (chairs, stools) also break line of sight: shortcuts never cut through a row of chairs,
        // so A*'s detour around them (soft cost) survives smoothing. Start / end seats are fine.
        let q = p.floor().as_ivec2();
        if grid.is_soft(q.x, q.y) && (p - b).length() > 0.8 && (p - a).length() > 0.8 { return false; }
    }
    true
}

fn queues_tick(data: Res<Data>, clock: Res<Clock>, grid: Res<Grid>, machines: Res<Machines>, mut queues: ResMut<Queues>, mut q: Query<(Entity, &mut Agent, &mut Mover)>, mut say: EventWriter<Say>, mut rng: ResMut<SimRng>) {
    // rebuild membership from plans (robust to plan changes)
    let mut lines: HashMap<String, Vec<(Entity, f64)>> = HashMap::new();
    for (e, a, _) in q.iter() { if let Act::Queue { q } = &a.plan.act { lines.entry(q.clone()).or_default().push((e, a.plan_t)); } }
    let dt = clock.dt_min;
    for (name, mut members) in lines {
        members.sort_by(|x, y| x.1.partial_cmp(&y.1).unwrap().then(x.0.cmp(&y.0)));
        let tiles: Vec<Vec2> = data.0.layout.queues.get(&name).map(|v| v.iter().map(tile_center).collect()).unwrap_or_default();
        let poi = data.0.layout.poi.get(&name).map(tile_center);
        let broken = (name == "coffee" && machines.coffee_broken) || (name == "printer" && machines.printer_jam);
        let svc = queues.service.entry(name.clone()).or_insert(0.0);
        for (k, (e, _)) in members.iter().enumerate() {
            let Ok((_, mut a, mut mv)) = q.get_mut(*e) else { continue };
            let slot = if tiles.is_empty() { poi.unwrap_or(a.home) + Vec2::new(0.0, k as f32) } else if k < tiles.len() { tiles[k] } else { tiles[tiles.len() - 1] + (tiles[tiles.len() - 1] - tiles[tiles.len().saturating_sub(2).min(tiles.len() - 1)]).normalize_or_zero() * (k + 1 - tiles.len()) as f32 };
            if (mv.dest.unwrap_or(Vec2::ZERO) - slot).length() > 0.3 { route(&mut mv, &grid, slot); }
            mv.facing = if k == 0 { poi.map(|p| Facing::from_vec(p - slot)).unwrap_or(mv.facing) } else { Facing::from_vec(tiles.get(k - 1).copied().unwrap_or(slot) - slot) };
            a.plan.face = Some(mv.facing);
            a.plan.until = a.plan.until.max(clock.t + 2.0); // queues hold you until served
            if k == 0 && mv.arrived {
                if broken { if rng.chance(0.004 * dt.max(0.1)) { if let Some(s) = line(&data.0, &mut rng, &["coffee-grumpy", "coffee-machine-breaks"]) { say.write(Say { who: *e, text: s, secs: 3.0, prio: 1 }); } } continue; }
                *svc += dt;
                if *svc > 3.0 {
                    *svc = 0.0;
                    // served: carry the thing back and enjoy it
                    let n = &mut a.needs; if name == "coffee" { n.energy = (n.energy + 0.35).min(1.0); } else { n.hunger = (n.hunger - 0.45).max(0.0); }
                    if rng.chance(0.3) { if let Some(s) = line(&data.0, &mut rng, &[if name == "coffee" { "coffee" } else { "snack" }, "kitchen"]) { say.write(Say { who: *e, text: s, secs: 2.5, prio: 0 }); } }
                    let seats = &data.0.layout.kitchen_seats;
                    let (dest, face) = if !seats.is_empty() && rng.chance(0.5) { let s = &seats[rng.idx(seats.len())]; (tile_center(s), s.facing) } else { (a.home, Some(a.home_face)) };
                    let p = Plan { act: Act::Snack, dest, face, until: clock.t + rng.range(8.0, 18.0) as f64, label: if name == "coffee" { "Coffee (finally)".into() } else { "Eating at the desk, technically".into() }, prio: Prio::Need, anim: Anim::Drink, run: false, look_at: None };
                    let t = clock.t; set_plan(&mut a, &mut mv, &grid, p, t);
                }
            }
        }
    }
    let _ = &mut queues.lines;
}

// ------------------------------------------------------------------ movement
/// personal space (tiles): nobody's feet ever come closer than this to anyone else's
pub const PERSONAL: f32 = 0.66;

/// Collision-free walking. Every step is checked against everyone else's *current* position
/// (updated as we go): a step may not end inside someone's personal space unless it moves away
/// from them. Blocked walkers steer around (right-hand rule, so two people facing each other both
/// sidestep the same way and pass), then wait, then repath around standing people, and finally the
/// lower-priority one backs off. Stalls feed the stuck detector.
fn movement(time: Res<Time>, clock: Res<Clock>, grid: Res<Grid>, queues: Res<Queues>, mut q: Query<(Entity, &mut Mover, &mut Agent, &Pose)>) {
    let real_dt = time.delta_secs().min(0.1); // same cap as the clock, so walkers keep up with sim time
    let sim_scale = if clock.paused { 0.0 } else { clock.speed };
    if sim_scale == 0.0 { return; }
    // live table of everyone visible: (entity, pos, vel, arrived)
    let mut live: Vec<(Entity, Vec2, Vec2, bool)> = q.iter().filter(|(_, _, a, p)| !p.hidden && !matches!(a.plan.act, Act::Hidden | Act::Gone)).map(|(e, m, _, _)| (e, m.pos, m.vel, m.arrived)).collect();
    let tiles_per_sec_1x = WALK_TILES_PER_MIN * SIM_MIN_PER_SEC; // 3 tiles/s at 1x
    let wait_dt = real_dt * sim_scale.min(6.0);
    let order: Vec<Entity> = live.iter().map(|x| x.0).collect();
    for e in order {
        let Ok((_, mut mv, mut a, pose)) = q.get_mut(e) else { continue };
        if pose.hidden { continue; }
        let me = live.iter().position(|x| x.0 == e).unwrap();
        if mv.arrived || mv.path.is_empty() { mv.vel = Vec2::ZERO; mv.arrived = true; mv.blocked = 0.0; if let Some(f) = a.plan.face { if (mv.pos - a.plan.dest).length() < 0.2 { mv.facing = f; } } live[me].2 = Vec2::ZERO; live[me].3 = true; continue; }
        let run = a.plan.run;
        let base = tiles_per_sec_1x * if run { 2.0 } else { 1.0 } * (0.8 + (a.seed % 23) as f32 * 0.02 + if a.has("caffeinated") || a.has("anxious") { 0.12 } else { 0.0 } - if a.has("slacker") { 0.1 } else { 0.0 }) * if a.role == Role::Goat { 0.7 } else { 1.0 };
        let total = base * sim_scale * real_dt;
        let steps = (total / 0.2).ceil().max(1.0) as i32;
        let step_len = total / steps as f32;
        let mut moved = false;
        let mut blocked_by: Option<Entity> = None;
        // after ~1 sim-minute of no progress, squeeze past people who are standing still (closer, but never touching)
        let squeeze = mv.wait_sim > 0.9;
        for _ in 0..steps {
            let Some(&target) = mv.path.front() else { break };
            let to = target - mv.pos;
            let dist = to.length();
            if dist < 0.05 || (dist < step_len && mv.path.len() > 1) { mv.path.pop_front(); if mv.path.is_empty() { if clear_of(&live, e, target, mv.pos) { mv.pos = target; } mv.arrived = true; break; } continue; }
            let dir = to / dist;
            let step = step_len.min(dist);
            let near_goal = mv.path.len() == 1 && dist < 1.2;
            // gentle anticipation: bias away from walkers coming at us (keeps passing smooth, no jitter)
            let mut bias = Vec2::ZERO;
            for (oe, op, ov, _) in &live { if *oe == e { continue; } let d = *op - mv.pos; let dd = d.length(); if dd < 1.6 && dd > 0.01 && d.dot(dir) > 0.0 && ov.dot(dir) < 0.0 { bias += Vec2::new(-dir.y, dir.x) * (1.6 - dd) * 0.35; } }
            let want = (dir + bias).normalize_or(dir);
            // candidate headings: straight, then right-hand sidesteps first
            let mut chosen: Option<Vec2> = None;
            for ang in [0.0f32, 0.6, -0.6, 1.2, -1.2, 1.75] {
                let (sn, cs) = ang.sin_cos();
                let d = Vec2::new(want.x * cs - want.y * sn, want.x * sn + want.y * cs);
                let cand = mv.pos + d * step;
                let ct = cand.floor().as_ivec2();
                // stepping out of a blocked tile (the elevator doorway, a seat) is always allowed straight ahead
                let escaping = { let here = mv.pos.floor().as_ivec2(); !grid.walkable(here.x, here.y) };
                if !(grid.walkable(ct.x, ct.y) || (near_goal || escaping) && ang == 0.0) { continue; }
                match first_conflict_sq(&live, e, cand, mv.pos, squeeze) { None => { chosen = Some(d); break; } Some(b) => { if blocked_by.is_none() { blocked_by = Some(b); } } }
            }
            let Some(d) = chosen else { break };
            mv.pos += d * step;
            moved = true;
            live[me].1 = mv.pos;
            let cur = mv.facing.vec();
            if dir.dot(cur) < 0.55 { mv.facing = Facing::from_vec(dir); }
            mv.vel = d * base;
        }
        live[me].2 = mv.vel;
        if moved { mv.blocked = (mv.blocked - wait_dt * 2.0).max(0.0); }
        else if !mv.arrived {
            // waiting for someone: patience, then smarter options
            mv.vel = Vec2::ZERO; live[me].2 = Vec2::ZERO;
            mv.blocked += wait_dt; mv.blocker = blocked_by.or(mv.blocker);
            let dest = mv.dest.unwrap_or(a.home);
            let blocker = mv.blocker.and_then(|b| live.iter().find(|x| x.0 == b).copied());
            if mv.blocked > 1.0 {
                if let Some((_, bp, _, barr)) = blocker {
                    // someone is standing on (or next to) where we wanted to go: this is close enough
                    if barr && (bp - dest).length() < 1.0 && (mv.pos - dest).length() < 2.0 { mv.path.clear(); mv.arrived = true; mv.blocked = 0.0; continue; }
                }
            }
            if mv.blocked > 2.0 && mv.blocked - wait_dt <= 2.0 {
                // repath treating standing people as furniture
                let extra: std::collections::HashSet<IVec2> = live.iter().filter(|x| x.0 != e && x.3 && (x.1 - mv.pos).length() < 6.0 && (x.1 - dest).length() > 0.8).map(|x| x.1.floor().as_ivec2()).collect();
                route_avoiding(&mut mv, &grid, dest, &extra);
                a.stuck += 1;
            }
            if mv.blocked > 3.5 {
                // deadlock breaker: the lower-priority walker backs off a step
                if let Some((be, bp, _, _)) = blocker { if e.index() > be.index() {
                    let away = (mv.pos - bp).normalize_or(Vec2::X);
                    for ang in [0.0f32, 0.8, -0.8, 1.6, -1.6] {
                        let (sn, cs) = ang.sin_cos();
                        let p = mv.pos + Vec2::new(away.x * cs - away.y * sn, away.x * sn + away.y * cs) * 0.9;
                        let t = p.floor().as_ivec2();
                        if grid.walkable(t.x, t.y) && first_conflict(&live, e, p, mv.pos).is_none() { mv.path.push_front(p); break; }
                    }
                } }
                mv.blocked = 0.0; mv.blocker = None; mv.repaths += 1;
            }
        }
        // stall detection -> repath (watchdog in debug escalates)
        mv.stall += real_dt * sim_scale;
        if mv.stall > 8.0 {
            if (mv.pos - mv.last_check).length() < 0.4 && !mv.arrived && mv.blocked < 0.5 {
                mv.repaths += 1; a.stuck += 1;
                let d = mv.dest.unwrap_or(a.home);
                if mv.repaths > 3 { let t = grid.nearest_walkable(mv.pos.floor().as_ivec2()); let p = t.as_vec2() + 0.5; if first_conflict(&live, e, p, mv.pos).is_none() { mv.pos = p; live[me].1 = p; } mv.repaths = 0; }
                route(&mut mv, &grid, d);
            }
            mv.last_check = mv.pos; mv.stall = 0.0;
        }
        // no-progress escalation in sim minutes (nobody stands frozen for more than ~2 sim-minutes):
        // close to the goal -> wait right here; then repath around everyone nearby; then give up on the errand
        if mv.arrived || (mv.pos - mv.anchor).length() > 0.3 { mv.anchor = mv.pos; mv.wait_sim = 0.0; }
        else {
            mv.wait_sim += clock.dt_min;
            let dest = mv.dest.unwrap_or(a.plan.dest);
            // a machine line is only 'managed' once you're actually in it; walking up to it can still jam
            let in_line = matches!(&a.plan.act, Act::Queue { q } if queues.lines.get(q).map_or(false, |l| l.contains(&e)));
            let managed = in_line || matches!(a.plan.act, Act::Leaving | Act::Hidden | Act::Escorted | Act::Gone);
            let near = (mv.pos - dest).length() < 2.5;
            if mv.wait_sim > 0.5 && near && !managed {
                mv.path.clear(); mv.arrived = true; mv.vel = Vec2::ZERO; live[me].2 = Vec2::ZERO; live[me].3 = true;
                mv.facing = Facing::from_vec(dest - mv.pos); a.plan.face = None; a.plan.anim = Anim::Idle;
                a.plan.label = format!("{} (waiting for a gap)", a.plan.label.trim_end_matches(" (waiting for a gap)"));
                a.plan.until = a.plan.until.min(clock.t + 4.0); a.next_think = a.next_think.min(clock.t + 4.0);
            } else if mv.wait_sim > 0.75 && mv.wait_sim - clock.dt_min <= 0.75 {
                let extra: std::collections::HashSet<IVec2> = live.iter().filter(|x| x.0 != e && (x.1 - mv.pos).length() < 6.0 && (x.1 - dest).length() > 0.8).map(|x| x.1.floor().as_ivec2()).collect();
                route_avoiding(&mut mv, &grid, dest, &extra); mv.repaths += 1;
            } else if mv.wait_sim > 1.05 {
                // a free neighbouring tile, if any, so a jam can dissolve even when the next plan is the same
                let mut aside = None;
                'ring: for r in [1.0f32, 1.5, 2.0] { for k in 0..8 { let ang = k as f32 * std::f32::consts::FRAC_PI_4 + (a.seed % 8) as f32 * 0.4;
                    let p = mv.pos + Vec2::new(ang.cos(), ang.sin()) * r; let t = p.floor().as_ivec2();
                    if grid.walkable(t.x, t.y) && live.iter().all(|x| x.0 == e || (x.1 - p).length() > PERSONAL + 0.1) && los(&grid, mv.pos, p) { aside = Some(p); break 'ring; } } }
                if !managed {
                    // snap aside (don't walk — a walk can jam again) and idle so the stuck audit clears
                    if let Some(p) = aside { mv.pos = p; live[me].1 = p; a.plan.label = "Stepping aside".into(); }
                    else { a.plan.label = "Gave up on getting past".into(); }
                    mv.path.clear(); mv.arrived = true; mv.vel = Vec2::ZERO; live[me].2 = Vec2::ZERO; live[me].3 = true;
                    a.plan.dest = mv.pos; mv.dest = Some(mv.pos); a.plan.face = None; a.plan.anim = Anim::Idle; a.plan.prio = Prio::Idle;
                    // backoff so think() does not immediately retry the blocked errand
                    a.plan.until = clock.t + 3.0; a.next_think = clock.t + 3.0;
                } else {
                    // still committed (leaving for the elevator, etc.): sidestep if we can, then repath
                    if let Some(p) = aside { mv.pos = p; live[me].1 = p; }
                    let extra: std::collections::HashSet<IVec2> = live.iter().filter(|x| x.0 != e && (x.1 - mv.pos).length() < 6.0 && (x.1 - dest).length() > 0.8).map(|x| x.1.floor().as_ivec2()).collect();
                    route_avoiding(&mut mv, &grid, dest, &extra); mv.repaths += 1;
                }
                mv.anchor = mv.pos; mv.wait_sim = 0.0;
            }
        }
        if mv.arrived { mv.vel = Vec2::ZERO; live[me].3 = true; if let Some(f) = a.plan.face { mv.facing = f; } }
    }
}

/// who (if anyone) would we bump into by standing at `cand`? Moving *away* from someone is always allowed.
pub fn first_conflict(live: &[(Entity, Vec2, Vec2, bool)], me: Entity, cand: Vec2, from: Vec2) -> Option<Entity> {
    for (oe, op, _, _) in live { if *oe == me { continue; } let dn = (cand - *op).length(); if dn < PERSONAL && dn < (from - *op).length() - 0.001 { return Some(*oe); } }
    None
}
pub fn first_conflict_sq(live: &[(Entity, Vec2, Vec2, bool)], me: Entity, cand: Vec2, from: Vec2, squeeze: bool) -> Option<Entity> {
    if !squeeze { return first_conflict(live, me, cand, from); }
    for (oe, op, _, standing) in live { if *oe == me { continue; } let r = if *standing { SQUEEZE } else { PERSONAL }; let dn = (cand - *op).length(); if dn < r && dn < (from - *op).length() - 0.001 { return Some(*oe); } }
    None
}
pub const SQUEEZE: f32 = 0.56;
fn clear_of(live: &[(Entity, Vec2, Vec2, bool)], me: Entity, p: Vec2, from: Vec2) -> bool { first_conflict(live, me, p, from).is_none() }

/// keep destinations apart: if two people are headed for the same spot (or someone already stands
/// there), the later one is given the nearest free spot instead. Desks and the elevator doorway are exempt.
fn reserve_dests(time: Res<Time>, grid: Res<Grid>, el: Res<crate::roles::Elevator>, mut q: Query<(Entity, &mut Mover, &mut Agent, &Pose)>, mut acc: Local<f32>) {
    *acc += time.delta_secs();
    if *acc < 0.2 { return; }
    *acc = 0.0;
    let door = el.door;
    let mut claims: Vec<(Entity, Vec2, f64)> = q.iter().filter(|(_, _, a, p)| !p.hidden && !matches!(a.plan.act, Act::Hidden | Act::Gone)).map(|(e, m, a, _)| (e, if m.arrived { m.pos } else { m.dest.unwrap_or(m.pos) }, if m.arrived { -1.0 } else { a.plan_t })).collect();
    claims.sort_by(|a, b| a.2.partial_cmp(&b.2).unwrap().then(a.0.cmp(&b.0)));
    let mut taken: Vec<Vec2> = vec![];
    for (e, spot, _) in claims {
        if (spot - door).length() < 0.8 { continue; }
        let clash = taken.iter().any(|t| (*t - spot).length() < PERSONAL + 0.05);
        if !clash { taken.push(spot); continue; }
        let Ok((_, mut mv, mut a, _)) = q.get_mut(e) else { continue };
        if mv.arrived { taken.push(spot); continue; } // already standing: movement keeps them apart
        if a.desk.is_some() && (spot - a.home).length() < 0.2 { taken.push(spot); continue; }
        // nearest free spot in rings of half tiles
        let mut best = None;
        'outer: for r in 1..7 { for k in 0..(r * 8) {
            let ang = k as f32 / (r * 8) as f32 * std::f32::consts::TAU;
            let p = spot + Vec2::new(ang.cos(), ang.sin()) * r as f32 * 0.5;
            let t = p.floor().as_ivec2();
            if grid.walkable(t.x, t.y) && !taken.iter().any(|x| (*x - p).length() < PERSONAL + 0.1) { best = Some(p); break 'outer; }
        } }
        if let Some(p) = best { taken.push(p); a.plan.dest = p; route(&mut mv, &grid, p); }
        else { taken.push(spot); }
    }
}

fn pose_tick(time: Res<Time>, clock: Res<Clock>, mut q: Query<(&Agent, &Mover, &mut Pose)>) {
    let dt = time.delta_secs();
    for (a, mv, mut p) in &mut q {
        p.t += dt * if clock.paused { 0.0 } else { clock.speed.min(3.0).max(1.0) };
        let moving = !mv.arrived && mv.vel.length_squared() > 0.0;
        let at_dest = mv.arrived && (mv.pos - a.plan.dest).length() < 0.4;
        let anim = if let Some((an, _)) = a.react_anim { an } else if moving { if a.plan.run { Anim::Run } else { Anim::Walk } } else if at_dest {
            match a.plan.act { Act::Desk => if a.fatigue > 0.88 { Anim::Doze } else if a.fatigue > 0.75 { Anim::Tired } else { Anim::Type }, _ => a.plan.anim }
        } else { Anim::Idle };
        if p.anim != Some(anim) { p.anim = Some(anim); p.t = 0.0; p.squash = 1.0; }
        p.squash = (p.squash - dt * 5.0).max(0.0);
        p.look = a.plan.look_at;
        let target_alpha = if p.hidden { 0.0 } else { 1.0 };
        p.alpha += (target_alpha - p.alpha) * (dt * 6.0).min(1.0);
    }
}
