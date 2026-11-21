//! Special roles: elevator + arrivals (the only way in or out), receptionist, Facilities crew,
//! Floor Supervisor rounds + Break Room escorts, the goat, the dog, visitors/couriers,
//! the Quarterly Elevator ascension and the void-corridor runner.
use crate::agents::*;
use crate::agents::Anim;
use crate::data::*;
use crate::events::*;
use crate::sim::*;
use crate::world::*;
use bevy::prelude::*;

#[derive(Clone, Copy, PartialEq, Debug, Default)]
pub enum Phase { #[default] Idle, Rise, Open, Close, Sink, Away, Ascend }
/// The elevator is the only way on or off the floor. A real queue: capacity 6, the car sinks into the
/// white floor to leave and rises back out of it to arrive; departing people line up beside the doors.
#[derive(Resource, Default)]
pub struct Elevator {
    pub phase: Phase, pub t: f32,
    /// due arrivals waiting below (in order)
    pub waiting_out: Vec<Entity>,
    /// Quarterly Elevator riders (ascend instead of sink)
    pub riders_in: Vec<Entity>,
    pub released: usize, pub carrying: usize, pub ascend_beam: bool, pub total_arrivals: usize, pub total_departures: usize,
    /// departure line (in order), people walking into the car, people aboard (hidden)
    pub queue: Vec<Entity>, pub boarding: Vec<Entity>, pub aboard: Vec<Entity>,
    pub last_release: f32,
    /// geometry (tiles): doorway foot point, step-out point in front, queue slots
    pub door: Vec2, pub front: Vec2, pub slots: Vec<Vec2>,
    /// playtest log: (sim minute, entity, true = arrived on floor / false = left the floor)
    pub log: Vec<(f64, Entity, bool)>,
}
pub const CAPACITY: usize = 6;
impl Elevator { pub fn dur(p: Phase) -> f32 { match p { Phase::Rise => 1.3, Phase::Open => 1.6, Phase::Close => 0.7, Phase::Sink => 1.3, Phase::Away => 0.8, Phase::Ascend => 2.2, Phase::Idle => 0.0 } } }

#[derive(Component)]
pub struct VisitorScript { pub vi: usize, pub leave_at: f64 }
#[derive(Resource, Default)]
pub struct RoleState { pub escort: Option<(Entity, u8)>, pub ascend: Option<(Entity, u8, f64)>, pub returns: Vec<(f64, Entity)>, pub runner: Option<(Entity, u8)>, pub goat_until: f64, pub visitors_spawned: Vec<(usize, usize)> }

pub struct RolesPlugin;
impl Plugin for RolesPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<Elevator>().init_resource::<RoleState>()
            .add_systems(Startup, (spawn_pets, setup_elevator, crate::presence::shift_init).chain().after(StartupSet::Agents).before(StartupSet::Ui))
            .add_systems(Update, (crate::presence::shift_tick, arrivals, elevator_tick, receptionist, facilities, supervisor, special_events, pets, visitors).chain().in_set(SimSet::Roles));
    }
}

fn spawn_pets(mut cmd: Commands, data: Res<Data>, idx: Res<WorldIndex>, grid: Res<Grid>) {
    for (k, p) in data.0.pets.iter().enumerate() {
        let role = if p.species == "goat" { Role::Goat } else { Role::Dog };
        let home = p.bed.map(|b| tile_center(&b)).or_else(|| idx.poi(&data.0, "dog_bed")).unwrap_or(idx.center);
        let home = grid.nearest_walkable(home.floor().as_ivec2()).as_vec2() + 0.5;
        let hidden = role == Role::Goat;
        let a = Agent { pi: None, id: p.id.clone(), name: clean(&p.name), first: clean(&p.name), role, team: String::new(), org: String::new(), traits: p.traits.clone(), needs: Needs { energy: 1.0, ..default() }, base: Needs::default(), desk: None, home, home_face: Facing::Down,
            plan: Plan { act: if hidden { Act::Hidden } else { Act::Wander }, dest: home, face: None, until: 0.0, label: clean(&p.quirk), prio: Prio::Idle, anim: Anim::Idle, run: false, look_at: None }, plan_t: 0.0, knows: vec![], punctual: 0.0, arrive_at: None, task: clean(&p.quirk), next_think: 0.0, last_say: -100.0, react_anim: None, fatigue: 0.0, greeted: true, stuck: 0, seed: 7 + k as u64 * 31 };
        cmd.spawn((a, Mover::new(home, Facing::Down), Pose { hidden, alpha: if hidden { 0.0 } else { 1.0 }, ..default() }, Cal::default(), Transform::default(), Visibility::default()));
    }
}

/// doorway point (inside the car, where people appear / vanish) and the walkable tile in front of it
pub fn elev_points(d: &Company) -> (Vec2, Vec2) {
    let e = &d.layout.elevator.rect;
    let door = Vec2::new(e.x as f32 + e.w as f32 * 0.5, (e.y + e.h) as f32 - 0.6);
    let out = Vec2::new(e.x as f32 + e.w as f32 * 0.5, (e.y + e.h) as f32 + 0.5);
    (door, out)
}

pub fn setup_elevator(mut el: ResMut<Elevator>, data: Res<Data>, grid: Res<Grid>) {
    let (door, out) = elev_points(&data.0);
    let e = data.0.layout.elevator.rect;
    let f = grid.nearest_walkable(out.floor().as_ivec2());
    el.door = door; el.front = f.as_vec2() + 0.5;
    // the line runs straight out from the doors (a column two tiles below the landing), then in parallel columns,
    // so the landing row stays free for people stepping out and walking off to either side
    let mut slots = vec![];
    for dx in [0, 2, -2, 4, -4, 6, -6] {
        for row in (f.y + 2)..(f.y + 12) {
            let x = f.x + dx;
            if grid.walkable(x, row) { slots.push(Vec2::new(x as f32 + 0.5, row as f32 + 0.5)); } else { break; }
        }
        if slots.len() >= 60 { break; }
    }
    let _ = e;
    if slots.is_empty() { slots.push(el.front + Vec2::new(1.0, 0.0)); }
    el.slots = slots;
}

fn arrivals(clock: Res<Clock>, mut el: ResMut<Elevator>, q: Query<(Entity, &Agent)>, rs: Res<RoleState>) {
    let t = clock.t;
    let mut due: Vec<(f64, Entity)> = vec![];
    for (e, a) in &q {
        if a.plan.act != Act::Hidden || a.role == Role::Goat { continue; }
        let at = a.arrive_at.filter(|at| t >= *at).or_else(|| rs.returns.iter().find(|(at, x)| *x == e && t >= *at).map(|x| x.0));
        if let Some(at) = at { if !el.waiting_out.contains(&e) { due.push((at, e)); } }
    }
    due.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap().then(a.1.cmp(&b.1)));
    for (_, e) in due { el.waiting_out.push(e); }
}

fn ready(mv: &Mover, slot: Vec2, front: Vec2) -> bool { (mv.arrived && (mv.pos - slot).length() < 0.8) || (mv.pos - front).length() < 3.2 }

#[allow(clippy::too_many_arguments)]
fn elevator_tick(time: Res<Time>, clock: Res<Clock>, data: Res<Data>, grid: Res<Grid>, idx: Res<WorldIndex>, mut el: ResMut<Elevator>, mut rs: ResMut<RoleState>,
    mut q: Query<(Entity, &mut Agent, &mut Mover, &mut Pose, Option<&mut crate::presence::Shift>, Option<&VisitorScript>)>, mut cmd: Commands, mut memo: ResMut<Memo>, mut rng: ResMut<SimRng>, delayed: ResMut<DelayedSay>, away_q: Query<&crate::presence::Away>) {
    let delayed = delayed.into_inner();
    if clock.paused || clock.dt_min <= 0.0 { return; }
    // the car runs on sim time (a full cycle is ~12 sim minutes at any speed) so the line never backs up at 16x
    let dt = clock.dt_min / SIM_MIN_PER_SEC;
    // rush hour: with a crowd below or a long line, the car runs express between floors and people step out briskly
    let rush = el.waiting_out.len() > CAPACITY || el.queue.len() > CAPACITY;
    let travel = matches!(el.phase, Phase::Rise | Phase::Sink | Phase::Away | Phase::Close);
    // a real backlog (lunch return, shift change) runs the car faster still, doors included
    let surge = el.waiting_out.len() + el.queue.len() > CAPACITY * 2;
    el.t += dt * match (surge, rush, travel) { (true, _, true) => 2.6, (true, _, false) => 1.6, (false, true, true) => 1.7, _ => 1.0 };
    let t = clock.t;
    let (door, front) = (el.door, el.front);
    let greet = idx.poi(&data.0, "reception_greet").unwrap_or(front + Vec2::new(-2.0, -2.0));
    // ---- the line: drop anyone who stopped leaving, then (re)assign slots so the line shuffles forward
    let mut queue = std::mem::take(&mut el.queue);
    queue.retain(|e| q.get(*e).map_or(false, |x| x.1.plan.act == Act::Leaving) && !el.boarding.contains(e) && !el.aboard.contains(e));
    for (i, e) in queue.iter().enumerate() {
        let slot = el.slots[i.min(el.slots.len() - 1)];
        if let Ok((_, mut a, mut mv, _, _, _)) = q.get_mut(*e) {
            if (a.plan.dest - slot).length() > 0.1 {
                a.plan.dest = slot; a.plan.face = Some(Facing::from_vec(door - slot)); a.plan.look_at = Some(door);
                route(&mut mv, &grid, slot);
            }
        }
    }
    el.queue = queue;
    // the car is called by whoever is first in line *and actually at the landing*; a head still walking over from
    // far away doesn't hold everyone else hostage (see the boarding loop)
    let front_ready = el.queue.iter().take(4).enumerate().any(|(i, e)| q.get(*e).map_or(false, |x| ready(&x.2, el.slots[i.min(el.slots.len() - 1)], front)));
    match el.phase {
        Phase::Idle => {
            if front_ready || !el.riders_in.is_empty() { el.phase = Phase::Open; el.t = 0.0; el.carrying = 0; el.released = 0; }
            else if !el.waiting_out.is_empty() { el.phase = Phase::Sink; el.t = 0.0; } // go fetch them
        }
        Phase::Rise => if el.t >= Elevator::dur(Phase::Rise) { el.t = 0.0; el.released = 0; el.last_release = 0.0; el.phase = if el.carrying > 0 || front_ready || !el.riders_in.is_empty() { Phase::Open } else { Phase::Idle }; },
        Phase::Open => {
            // 1) arrivals step out one by one (doors need ~0.5s to open)
            let door_clear = !q.iter().any(|x| !x.3.hidden && (x.2.pos - door).length() < 0.8);
            if el.released < el.carrying && el.t >= 0.5 + el.released as f32 * if surge { 0.25 } else if rush { 0.32 } else { 0.45 } && door_clear {
                let e = el.waiting_out[el.released]; el.released += 1; el.last_release = el.t;
                if let Ok((_, mut a, mut mv, mut pose, shift, vis)) = q.get_mut(e) {
                    pose.hidden = false; mv.pos = door; mv.facing = Facing::Down; mv.vel = Vec2::ZERO;
                    let returning = rs.returns.iter().any(|(_, x)| *x == e);
                    rs.returns.retain(|(_, x)| *x != e);
                    let why = away_q.get(e).ok().map(|w| w.why);
                    cmd.entity(e).remove::<crate::presence::Away>();
                    let slot = greet + Vec2::new(((el.released as f32) - 2.0) * 0.9, rng.range(0.0, 0.8));
                    let slot = grid.nearest_walkable(slot.floor().as_ivec2()).as_vec2() + 0.5;
                    let label = match why { Some(crate::presence::Why::Lunch) => "Back from lunch".into(), Some(crate::presence::Why::Errand) => "Back from an errand".into(), _ => if vis.is_some() { "Signing in at reception".into() } else { "Arriving on the floor".to_string() } };
                    let p = Plan { act: Act::Visit { what: "arrive" }, dest: slot, face: Some(Facing::from_vec(greet - slot + Vec2::new(0.0, -0.5))), until: t + rng.range(2.5, 5.0) as f64, label, prio: Prio::Calendar, anim: Anim::Wave, run: false, look_at: None };
                    set_plan(&mut a, &mut mv, &grid, p, t);
                    a.arrive_at = None;
                    el.total_arrivals += 1;
                    el.log.push((t, e, true));
                    let name = a.first.clone();
                    let _ = shift;
                    if returning { delayed.q.push((delayed.now + 1.2, Say { who: e, text: "I don't remember anything. I feel great.".into(), secs: 3.5, prio: 2 })); memo.push(&clock, MemoKind::People, format!("{} has returned from the Quarterly Elevator. They seem refreshed. And taller?", name)); }
                    else {
                        match why {
                            Some(crate::presence::Why::Lunch) => memo.push(&clock, MemoKind::People, format!("{} is back from lunch, smelling faintly of the outside world.", name)),
                            Some(crate::presence::Why::Errand) => memo.push(&clock, MemoKind::People, format!("{} has returned from an errand. Details withheld.", name)),
                            _ => {
                                if let Some(tpl) = data.0.lines.ticker.get("arrival").and_then(|v| rng.pick(v).cloned()) { let vars = [("name", name.clone()), ("time", clock.hhmm())].into_iter().collect(); memo.push(&clock, MemoKind::People, fill_template(&tpl, &vars)); }
                                else { memo.push(&clock, MemoKind::People, format!("{} arrived via the elevator.", name)); }
                            }
                        }
                        if rng.chance(0.35) { if let Some(s) = line(&data.0, &mut rng, &["arriving", "elevator"]) { delayed.q.push((delayed.now + 1.6, Say { who: e, text: s, secs: 2.8, prio: 0 })); } }
                    }
                }
            }
            let out_clear = el.released >= el.carrying && el.t >= el.last_release + 0.9;
            // 2) once the doorway is clear, the line boards (front first) up to capacity
            if out_clear {
                let room = if el.boarding.is_empty() && door_clear { CAPACITY.saturating_sub(el.aboard.len()).min(1) } else { 0 };
                let mut take = vec![];
                for (i, e) in el.queue.iter().enumerate() {
                    if take.len() >= room { break; }
                    let slot = el.slots[i.min(el.slots.len() - 1)];
                    match q.get(*e) {
                        Ok(x) if ready(&x.2, slot, front) => take.push(*e),
                        Ok(x) if (x.2.pos - front).length() > 6.0 => continue, // still walking over: let the people waiting go first
                        _ => break, // keep the order: nobody cuts the line
                    }
                }
                for e in take {
                    el.queue.retain(|x| *x != e); el.boarding.push(e);
                    if let Ok((_, mut a, mut mv, _, _, _)) = q.get_mut(e) { a.plan.dest = door; a.plan.face = Some(Facing::Up); a.plan.label = "Stepping into the elevator".into(); route(&mut mv, &grid, door); }
                }
            }
            // 2b) keep the doorway clear for boarders: anyone loitering on the landing steps aside
            if !el.boarding.is_empty() {
                let skip: Vec<Entity> = el.boarding.iter().chain(el.queue.iter()).copied().collect();
                let mut movers: Vec<Entity> = vec![];
                for (e, a, mv, pose, _, _) in q.iter() {
                    if pose.hidden || skip.contains(&e) || !mv.arrived || a.plan.act == Act::Leaving { continue; }
                    if (mv.pos - front).length() < 1.3 || (mv.pos - door).length() < 1.3 { movers.push(e); }
                }
                for (k, e) in movers.into_iter().enumerate() {
                    if let Ok((_, mut a, mut mv, _, _, _)) = q.get_mut(e) {
                        let side = if k % 2 == 0 { -3.0 } else { 3.0 };
                        let p = grid.nearest_walkable((front + Vec2::new(side, 1.5)).floor().as_ivec2()).as_vec2() + 0.5;
                        a.plan.dest = p; route(&mut mv, &grid, p);
                    }
                }
            }
            // 3) boarders reach the doorway -> fade out inside the car
            let boarding = el.boarding.clone();
            for e in boarding {
                let inn = q.get(e).map_or(true, |x| (x.2.pos - door).length() < 0.35);
                // squeezed in the doorway behind someone stepping out: board from the threshold after a short wait
                let close = q.get(e).map_or(true, |x| (x.2.pos - door).length() < 1.4);
                if inn || el.t > 10.0 && close {
                    if let Ok((_, _, mut mv, mut pose, _, _)) = q.get_mut(e) { pose.hidden = true; mv.path.clear(); mv.arrived = true; mv.vel = Vec2::ZERO; mv.facing = Facing::Down; }
                    el.boarding.retain(|x| *x != e); el.aboard.push(e);
                }
            }
            for e in el.riders_in.clone() { if let Ok((_, _, mv, mut pose, _, _)) = q.get_mut(e) { if (mv.pos - door).length() < 0.8 { pose.hidden = true; } } }
            let riders_in = el.riders_in.iter().all(|e| q.get(*e).map_or(true, |x| x.3.hidden));
            // hold the doors for someone hurrying to the line (up to ~6s)
            let hurrying = el.queue.first().and_then(|e| q.get(*e).ok()).map_or(false, |x| (x.2.pos - front).length() < 5.0) && el.aboard.len() < CAPACITY;
            let nobody_ready = !el.queue.iter().take(4).enumerate().any(|(i, e)| q.get(*e).map_or(false, |x| ready(&x.2, el.slots[i.min(el.slots.len() - 1)], front))) || el.aboard.len() + el.boarding.len() >= CAPACITY;
            if out_clear && el.t >= Elevator::dur(Phase::Open) && el.boarding.is_empty() && riders_in && nobody_ready && (!hurrying || el.t > if surge { 3.0 } else { 6.0 }) || el.t > if surge { 10.0 } else { 16.0 } {
                let timed_out = el.t > if surge { 10.0 } else { 16.0 };
                el.phase = Phase::Close; el.t = 0.0;
                let n = el.released.min(el.waiting_out.len()); el.waiting_out.drain(..n); el.released = 0; el.carrying = 0;
                if timed_out { el.riders_in.clear(); }
            }
        }
        Phase::Close => if el.t >= Elevator::dur(Phase::Close) {
            el.t = 0.0;
            el.phase = if !el.riders_in.is_empty() { el.ascend_beam = true; Phase::Ascend } else if !el.aboard.is_empty() || !el.waiting_out.is_empty() { Phase::Sink } else { Phase::Idle };
        },
        Phase::Sink | Phase::Ascend => if el.t >= Elevator::dur(el.phase) {
            // whoever is aboard has now left the floor
            let aboard: Vec<Entity> = el.aboard.drain(..).collect();
            let n = aboard.len();
            for e in aboard {
                if let Ok((_, mut a, mut mv, mut pose, shift, vis)) = q.get_mut(e) {
                    pose.hidden = true; mv.pos = door; mv.path.clear(); mv.arrived = true;
                    el.total_departures += 1; el.log.push((t, e, false));
                    if vis.is_some() { a.plan = Plan { act: Act::Gone, dest: door, face: None, until: f64::MAX, label: "Left the building".into(), prio: Prio::Forced, anim: Anim::Idle, run: false, look_at: None }; memo.push(&clock, MemoKind::People, format!("Visitor {} has been returned to the surface.", a.first)); continue; }
                    let trip = shift.and_then(|mut s| s.current.take());
                    let (why, back) = trip.map(|tr| (tr.why, tr.back)).unwrap_or((crate::presence::Why::Home, t + 480.0));
                    a.arrive_at = Some(back);
                    a.plan = Plan { act: Act::Hidden, dest: door, face: None, until: back, label: crate::presence::away_label(why, back), prio: Prio::Idle, anim: Anim::Idle, run: false, look_at: None };
                    cmd.entity(e).insert(crate::presence::Away { why, back, since: t });
                    let msg = match why {
                        crate::presence::Why::Home => format!("{} has gone home. Their Innie will not remember the commute.", a.first),
                        crate::presence::Why::Lunch => format!("{} went out for lunch. Back {}.", a.first, fmt_min(back as f32)),
                        crate::presence::Why::Errand => format!("{} stepped out on an errand.", a.first),
                    };
                    if why != crate::presence::Why::Home || rng.chance(0.5) { memo.push(&clock, MemoKind::People, msg); }
                }
            }
            if el.phase == Phase::Ascend {
                for e in el.riders_in.drain(..) { if let Ok((_, mut a, _, _, _, _)) = q.get_mut(e) { a.plan.act = Act::Gone; } }
                el.ascend_beam = false;
            }
            if n > 1 { let _ = n; }
            el.phase = Phase::Away; el.t = 0.0;
        },
        Phase::Away => if el.t >= Elevator::dur(Phase::Away) {
            // come back up carrying whoever is due (at most a carful)
            el.carrying = el.waiting_out.len().min(CAPACITY);
            el.phase = Phase::Rise; el.t = 0.0;
        },
    }
}

fn receptionist(data: Res<Data>, idx: Res<WorldIndex>, grid: Res<Grid>, clock: Res<Clock>, el: Res<Elevator>, mut q: Query<(Entity, &mut Agent, &mut Mover)>, mut rng: ResMut<SimRng>, delayed: ResMut<DelayedSay>, mut local: Local<(Phase, f64)>) {
    let delayed = delayed.into_inner();
    let t = clock.t;
    let greet_now = el.phase == Phase::Open && local.0 != Phase::Open;
    local.0 = el.phase;
    for (e, mut a, mut mv) in &mut q {
        if a.role != Role::Receptionist || a.plan.act.absent() { continue; }
        if a.plan.prio >= Prio::Event && t < a.plan.until { continue; }
        let seat = idx.poi(&data.0, "reception").unwrap_or(a.home);
        let face = data.0.layout.poi.get("reception").and_then(|p| p.facing).unwrap_or(Facing::Down);
        if a.plan.act != Act::Reception || t >= a.plan.until {
            let anim = if rng.chance(0.3) { Anim::Phone } else { Anim::Sit };
            let p = Plan { act: Act::Reception, dest: seat, face: Some(face), until: t + rng.range(10.0, 30.0) as f64, label: if anim == Anim::Phone { "On a call with \"upstairs\"".into() } else { "Welcoming the floor".into() }, prio: Prio::Calendar, anim, run: false, look_at: None };
            set_plan(&mut a, &mut mv, &grid, p, t);
        }
        if greet_now && el.carrying > 0 {
            a.react_anim = Some((Anim::Wave, 2.0));
            a.plan.look_at = Some(data.0.layout.elevator.rect.center());
            if let Some(s) = line(&data.0, &mut rng, &["receptionist_greeting"]) { delayed.q.push((delayed.now + 0.8, Say { who: e, text: s, secs: 3.0, prio: 1 })); }
        }
    }
}

fn facilities(data: Res<Data>, grid: Res<Grid>, clock: Res<Clock>, bus: Res<Bus>, machines: Res<Machines>, idx: Res<WorldIndex>, mut q: Query<(Entity, &mut Agent, &mut Mover)>, mut rng: ResMut<SimRng>, mut say: EventWriter<Say>, mut fx: EventWriter<Fx>) {
    let t = clock.t;
    let route: Vec<Vec2> = if data.0.layout.tidy_route.is_empty() { data.0.layout.wander_spots.iter().map(tile_center).collect() } else { data.0.layout.tidy_route.iter().map(tile_center).collect() };
    if route.is_empty() { return; }
    let walkers: Vec<Vec2> = q.iter().filter(|(_, a, _)| a.role == Role::Staff).map(|(_, _, m)| m.pos).collect();
    let fixing = machines.coffee_broken && bus.active.iter().any(|a| a.id == "coffee-machine-breaks");
    let mut fixer_assigned = false;
    for (e, mut a, mut mv) in &mut q {
        if a.role != Role::Facilities || a.plan.act.absent() { continue; }
        if fixing && !fixer_assigned {
            fixer_assigned = true;
            if let Some(c) = idx.poi(&data.0, "coffee") { if (a.plan.dest - c).length() > 1.5 || !matches!(a.plan.act, Act::Visit { what: "repair" }) {
                let dest = grid.nearest_walkable((c + Vec2::new(1.0, 1.0)).floor().as_ivec2()).as_vec2() + 0.5;
                let p = Plan { act: Act::Visit { what: "repair" }, dest, face: Some(Facing::from_vec(c - dest)), until: t + 30.0, label: "Repairing the coffee machine (silently)".into(), prio: Prio::Event, anim: Anim::Knock, run: false, look_at: Some(c) };
                set_plan(&mut a, &mut mv, &grid, p, t);
            } }
            continue;
        }
        let i = match a.plan.act { Act::Tidy { i } => i, _ => (a.seed as usize) % route.len() };
        if !matches!(a.plan.act, Act::Tidy { .. }) || (mv.arrived && t >= a.plan.until) {
            let mut ni = (i + 1) % route.len();
            // tidy *around* workers: skip spots where someone is standing
            for _ in 0..3 { if walkers.iter().any(|w| (*w - route[ni]).length() < 1.2) { ni = (ni + 1) % route.len(); } }
            let dest = grid.nearest_walkable(route[ni].floor().as_ivec2()).as_vec2() + 0.5;
            let p = Plan { act: Act::Tidy { i: ni }, dest, face: Some(Facing::Down), until: t + rng.range(3.0, 7.0) as f64, label: "Tidying (around you)".into(), prio: Prio::Calendar, anim: Anim::Knock, run: false, look_at: None };
            set_plan(&mut a, &mut mv, &grid, p, t);
            if rng.chance(0.15) { fx.write(Fx { kind: "sparkle".into(), at: mv.pos, secs: 1.2 }); }
            if rng.chance(0.03) { if let Some(s) = line(&data.0, &mut rng, &["facilities_banter"]) { say.write(Say { who: e, text: s, secs: 2.5, prio: 0 }); } }
        }
    }
}

#[allow(clippy::too_many_arguments)]
fn supervisor(data: Res<Data>, grid: Res<Grid>, clock: Res<Clock>, idx: Res<WorldIndex>, mut rs: ResMut<RoleState>, mut q: Query<(Entity, &mut Agent, &mut Mover)>, mut rng: ResMut<SimRng>, mut say: EventWriter<Say>, mut memo: ResMut<Memo>, mut fire: EventWriter<Fire>) {
    let t = clock.t;
    let route: Vec<Vec2> = data.0.layout.patrol_route.iter().map(tile_center).collect();
    let night = clock.night() > 0.5;
    let snap: Vec<(Entity, Vec2, bool)> = q.iter().filter(|(_, a, _)| a.role == Role::Staff).map(|(e, a, m)| (e, m.pos, a.plan.act == Act::Nap || a.has("slacker"))).collect();
    // escort state machine
    if let Some((subj, stage)) = rs.escort {
        let sup = q.iter().find(|(_, a, _)| a.role == Role::Supervisor).map(|(e, _, m)| (e, m.pos));
        let sp = q.get(subj).map(|x| x.2.pos).ok();
        if let (Some((se, spos)), Some(subj_pos)) = (sup, sp) {
            let br = data.0.rooms.iter().find(|r| r.id == "breakroom").map(|r| r.seats.first().map(tile_center).unwrap_or(r.rect.center())).or_else(|| idx.poi(&data.0, "breakroom")).unwrap_or(idx.center);
            match stage {
                0 => { if let Ok((_, mut a, mut mv)) = q.get_mut(se) { if (mv.dest.unwrap_or(Vec2::ZERO) - subj_pos).length() > 1.2 { let p = Plan { act: Act::Visit { what: "escort" }, dest: subj_pos + Vec2::new(0.9, 0.0), face: None, until: t + 60.0, label: "Escorting someone to the Break Room".into(), prio: Prio::Forced, anim: Anim::Idle, run: false, look_at: Some(subj_pos) }; set_plan(&mut a, &mut mv, &grid, p, t); } }
                    if (spos - subj_pos).length() < 1.6 { rs.escort = Some((subj, 1)); if let Some(s) = line(&data.0, &mut rng, &["breakroom-escort", "supervisor"]) { say.write(Say { who: se, text: s, secs: 3.0, prio: 2 }); } } }
                1 => {
                    if let Ok((_, mut a, mut mv)) = q.get_mut(subj) { let p = Plan { act: Act::Escorted, dest: br, face: Some(Facing::Down), until: t + 40.0, label: "In the Break Room (reflecting)".into(), prio: Prio::Forced, anim: Anim::Tired, run: false, look_at: None }; set_plan(&mut a, &mut mv, &grid, p, t); }
                    if let Ok((_, mut a, mut mv)) = q.get_mut(se) { let p = Plan { act: Act::Visit { what: "escort" }, dest: br + Vec2::new(1.2, 1.0), face: Some(Facing::Left), until: t + 40.0, label: "Escorting".into(), prio: Prio::Forced, anim: Anim::Idle, run: false, look_at: Some(br) }; set_plan(&mut a, &mut mv, &grid, p, t); }
                    rs.escort = Some((subj, 2));
                }
                _ => { if let Ok((_, a, _)) = q.get(subj) { if t >= a.plan.until || a.plan.act != Act::Escorted { rs.escort = None; if let Ok((_, mut s, _)) = q.get_mut(se) { s.plan.until = t; s.plan.prio = Prio::Idle; } let mut f = Fire::new("breakroom-return"); f.subject = Some(subj); fire.write(f); } } }
            }
        } else { rs.escort = None; }
    }
    for (e, mut a, mut mv) in &mut q {
        if a.role != Role::Supervisor || a.plan.act.absent() { continue; }
        if a.plan.prio >= Prio::Forced && t < a.plan.until { continue; }
        if route.is_empty() { continue; }
        let i = match a.plan.act { Act::Patrol { i } => i, _ => 0 };
        if !matches!(a.plan.act, Act::Patrol { .. }) || (mv.arrived && t >= a.plan.until) {
            let ni = (i + 1) % route.len();
            let dest = grid.nearest_walkable(route[ni].floor().as_ivec2()).as_vec2() + 0.5;
            let p = Plan { act: Act::Patrol { i: ni }, dest, face: None, until: t + rng.range(1.0, 4.0) as f64, label: "Rounds (eternal)".into(), prio: Prio::Calendar, anim: if night { Anim::Flashlight } else { Anim::Idle }, run: false, look_at: None };
            set_plan(&mut a, &mut mv, &grid, p, t);
            // notice a napper / slacker nearby
            if let Some(n) = snap.iter().find(|s| s.2 && (s.1 - mv.pos).length() < 5.0) { if rng.chance(0.5) { a.plan.look_at = Some(n.1); if let Some(s) = line(&data.0, &mut rng, &["supervisor"]) { say.write(Say { who: e, text: s, secs: 3.0, prio: 1 }); } } }
        }
    }
    let _ = &mut memo;
}

#[allow(clippy::too_many_arguments)]
fn special_events(mut ev: EventReader<Fire>, data: Res<Data>, grid: Res<Grid>, clock: Res<Clock>, idx: Res<WorldIndex>, mut rs: ResMut<RoleState>, mut el: ResMut<Elevator>, mut q: Query<(Entity, &mut Agent, &mut Mover, &mut Pose)>, mut rng: ResMut<SimRng>, mut memo: ResMut<Memo>, delayed: ResMut<DelayedSay>, mut fx: EventWriter<Fx>) {
    let delayed = delayed.into_inner();
    let t = clock.t;
    let (inside, _out) = elev_points(&data.0);
    for f in ev.read() {
        match f.id.as_str() {
            "breakroom-escort" if rs.escort.is_none() => {
                let cand: Vec<Entity> = q.iter().filter(|(_, a, _, p)| a.role == Role::Staff && !p.hidden && !a.plan.act.absent() && (a.has("rebel") || a.has("slacker")) && !matches!(a.plan.act, Act::Meeting { .. } | Act::Gone | Act::Hidden)).map(|x| x.0).collect();
                let pick = f.subject.filter(|s| cand.contains(s)).or_else(|| rng.pick(&cand).copied()).or_else(|| q.iter().filter(|(_, a, _, p)| a.role == Role::Staff && !p.hidden).map(|x| x.0).next());
                if let Some(s) = pick { rs.escort = Some((s, 0)); if let Ok((_, mut a, _, _)) = q.get_mut(s) { a.plan.prio = Prio::Forced; a.plan.until = t + 60.0; a.react_anim = Some((Anim::Facepalm, 2.0)); } }
            }
            "breakroom-return" => if let Some(s) = f.subject { if let Ok((e, mut a, mut mv, _)) = q.get_mut(s) { a.plan.prio = Prio::Idle; a.plan.until = t; let (h, hf) = (a.home, a.home_face); let p = Plan { act: Act::Desk, dest: h, face: Some(hf), until: t + 40.0, label: "Back at desk. Grateful.".into(), prio: Prio::Need, anim: Anim::Type, run: false, look_at: None }; set_plan(&mut a, &mut mv, &grid, p, t); if let Some(l) = line(&data.0, &mut rng, &["breakroom-return", "breakroom"]) { delayed.q.push((delayed.now + 0.5, Say { who: e, text: l, secs: 3.0, prio: 1 })); } } },
            "quarterly-elevator" if rs.ascend.is_none() => {
                let cand: Vec<Entity> = q.iter().filter(|(_, a, _, p)| a.role == Role::Staff && !p.hidden && !a.plan.act.absent()).map(|x| x.0).collect();
                if let Some(&s) = rng.pick(&cand) { rs.ascend = Some((s, 0, t)); if let Ok((_, mut a, mut mv, _)) = q.get_mut(s) { let p = Plan { act: Act::Visit { what: "ascend" }, dest: inside, face: Some(Facing::Down), until: t + 120.0, label: "Selected for the Quarterly Elevator".into(), prio: Prio::Forced, anim: Anim::Wave, run: false, look_at: None }; set_plan(&mut a, &mut mv, &grid, p, t); memo.push(&clock, MemoKind::Event, format!("{} has been selected for the Quarterly Elevator. Please applaud at a respectful volume.", a.first)); } }
            }
            "goat-appears" => {
                let at = f.at.unwrap_or(idx.center + Vec2::new(30.0, 0.0));
                for (_, mut a, mut mv, mut pose) in &mut q { if a.role == Role::Goat {
                    let spot = grid.nearest_walkable(at.floor().as_ivec2()).as_vec2() + 0.5;
                    mv.pos = spot; pose.hidden = false; rs.goat_until = t + 40.0;
                    let dest = grid.nearest_walkable((spot + (idx.center - spot).normalize_or_zero() * 8.0).floor().as_ivec2()).as_vec2() + 0.5;
                    let p = Plan { act: Act::Wander, dest, face: None, until: t + 6.0, label: "Being a goat".into(), prio: Prio::Event, anim: Anim::Idle, run: false, look_at: None }; let tt = t; set_plan(&mut a, &mut mv, &grid, p, tt);
                    fx.write(Fx { kind: "sparkle".into(), at: spot, secs: 2.0 });
                } }
            }
            "corridor-runner" if rs.runner.is_none() => {
                let cand: Vec<Entity> = q.iter().filter(|(_, a, _, p)| a.role == Role::Staff && !p.hidden && !a.plan.act.absent() && (a.has("rebel") || a.has("pacer")) && a.plan.prio < Prio::Calendar).map(|x| x.0).collect();
                if let Some(&s) = rng.pick(&cand) { if let Ok((e, mut a, mut mv, _)) = q.get_mut(s) {
                    let start = data.0.layout.poi.get("void_corridor_start").map(tile_center).unwrap_or(Vec2::new(-6.0, 20.0));
                    let dir = data.0.layout.poi.get("void_corridor_start").and_then(|p| p.facing).unwrap_or(Facing::Left).vec();
                    let far = grid.nearest_walkable((start + dir * 22.0).floor().as_ivec2()).as_vec2() + 0.5;
                    let p = Plan { act: Act::Visit { what: "corridor" }, dest: far, face: None, until: t + 30.0, label: "Running down the endless corridor".into(), prio: Prio::Forced, anim: Anim::Run, run: true, look_at: None }; set_plan(&mut a, &mut mv, &grid, p, t);
                    rs.runner = Some((e, 0));
                } }
            }
            _ => {}
        }
    }
    // ascension sequence: walk in -> doors close -> car lifts off with a beam -> gone; returns later
    if let Some((s, stage, t0)) = rs.ascend {
        if let Ok((_, mut a, mv, _)) = q.get_mut(s) {
            if stage == 0 && (mv.pos - inside).length() < 0.8 { if !el.riders_in.contains(&s) { el.riders_in.push(s); } rs.ascend = Some((s, 1, t0)); }
            else if stage == 1 && a.plan.act == Act::Gone { rs.ascend = None; rs.returns.push((t + 180.0, s)); a.plan.act = Act::Hidden; a.arrive_at = None; memo.push(&clock, MemoKind::Event, format!("The Quarterly Elevator has ascended with {}. Their desk plant is being cared for.", a.first)); }
            else if t - t0 > 90.0 { rs.ascend = None; a.plan.until = t; a.plan.prio = Prio::Idle; }
        } else { rs.ascend = None; }
    }
    if let Some((s, stage)) = rs.runner { if let Ok((_, mut a, mut mv, _)) = q.get_mut(s) {
        if mv.arrived && stage == 0 { let h = a.home; let p = Plan { act: Act::Visit { what: "corridor" }, dest: h, face: Some(a.home_face), until: t + 30.0, label: "Returning from the corridor (it ends nowhere)".into(), prio: Prio::Forced, anim: Anim::Run, run: true, look_at: None }; set_plan(&mut a, &mut mv, &grid, p, t); rs.runner = Some((s, 1)); }
        else if mv.arrived && stage == 1 { a.plan.prio = Prio::Idle; a.plan.until = t; rs.runner = None; }
    } else { rs.runner = None; } }
}

fn pets(clock: Res<Clock>, grid: Res<Grid>, data: Res<Data>, mut rs: ResMut<RoleState>, mut q: Query<(Entity, &mut Agent, &mut Mover, &mut Pose)>, mut rng: ResMut<SimRng>, mut fx: EventWriter<Fx>, delayed: ResMut<DelayedSay>) {
    let delayed = delayed.into_inner();
    let t = clock.t;
    let staff: Vec<(Entity, Vec2, bool)> = q.iter().filter(|(_, a, _, p)| a.role == Role::Staff && !p.hidden).map(|(e, a, m, _)| (e, m.pos, a.has("dog-lover"))).collect();
    let mut pet_events: Vec<(Entity, Vec2)> = vec![];
    for (e, mut a, mut mv, mut pose) in &mut q {
        if !matches!(a.role, Role::Goat | Role::Dog) || pose.hidden { continue; }
        if a.role == Role::Goat && t > rs.goat_until { pose.hidden = true; fx.write(Fx { kind: "sparkle".into(), at: mv.pos, secs: 1.5 }); a.plan.act = Act::Hidden; continue; }
        if mv.arrived && t >= a.plan.until {
            let near: Vec<&(Entity, Vec2, bool)> = staff.iter().filter(|s| (s.1 - mv.pos).length() < 14.0).collect();
            let dest = if rng.chance(0.55) && !near.is_empty() { let s = near[rng.idx(near.len())]; s.1 + Vec2::new(rng.range(-1.0, 1.0), 1.0) } else if a.role == Role::Dog && rng.chance(0.3) { a.home } else { mv.pos + Vec2::new(rng.range(-6.0, 6.0), rng.range(-4.0, 4.0)) };
            let dest = grid.nearest_walkable(dest.floor().as_ivec2()).as_vec2() + 0.5;
            let p = Plan { act: Act::Wander, dest, face: None, until: t + rng.range(4.0, 12.0) as f64, label: a.task.clone(), prio: Prio::Idle, anim: if a.role == Role::Dog && dest == a.home { Anim::Sleep } else { Anim::Idle }, run: false, look_at: None };
            set_plan(&mut a, &mut mv, &grid, p, t);
            pet_events.push((e, mv.pos));
        }
    }
    // dog-lovers nearby come for pets (hearts)
    for (pe, pp) in pet_events {
        if let Some(s) = staff.iter().find(|s| s.2 && (s.1 - pp).length() < 4.0) { if rng.chance(0.4) {
            fx.write(Fx { kind: "hearts".into(), at: pp, secs: 1.8 });
            if let Ok((_, mut a, _, _)) = q.get_mut(s.0) { if a.plan.prio < Prio::Calendar { a.react_anim = Some((Anim::Wave, 1.5)); a.plan.look_at = Some(pp); } }
            if let Some(l) = line(&data.0, &mut rng, &["petting", "dog"]) { delayed.q.push((delayed.now + 0.3, Say { who: s.0, text: l, secs: 2.5, prio: 0 })); }
        } }
        let _ = pe;
    }
}

/// Interview candidates & couriers: come down the elevator, check in with reception, follow their
/// calendar, then ride back up.
#[allow(clippy::too_many_arguments)]
fn visitors(mut cmd: Commands, data: Res<Data>, clock: Res<Clock>, grid: Res<Grid>, idx: Res<WorldIndex>, mut rs: ResMut<RoleState>, mut el: ResMut<Elevator>, mut q: Query<(Entity, &mut Agent, &mut Mover, &VisitorScript)>, mut memo: ResMut<Memo>, mut rng: ResMut<SimRng>) {
    let t = clock.t; let tod = clock.mod_min(); let day = clock.day();
    let wd = DAYS[clock.weekday()];
    let (inside, _) = elev_points(&data.0);
    for (vi, v) in data.0.visitors.iter().enumerate() {
        if !v.day.is_empty() && !v.day.eq_ignore_ascii_case(wd) { continue; }
        let arr = to_min(&v.arrive); let leave = to_min(&v.leave).max(arr + 30.0);
        if tod >= arr && tod < leave && !rs.visitors_spawned.contains(&(vi, day)) {
            rs.visitors_spawned.push((vi, day));
            let a = Agent { pi: None, id: v.id.clone(), name: clean(&v.name), first: clean(v.name.split(' ').next().unwrap_or(&v.name)), role: Role::Visitor, team: String::new(), org: String::new(), traits: vec![], needs: Needs { energy: 0.9, ..default() }, base: Needs::default(), desk: None, home: inside, home_face: Facing::Down,
                plan: Plan { act: Act::Hidden, dest: inside, face: None, until: 0.0, label: if v.purpose.is_empty() { clean(&v.kind) } else { format!("Visitor ({})", clean(&v.purpose)) }, prio: Prio::Idle, anim: Anim::Idle, run: false, look_at: None }, plan_t: t, knows: vec![], punctual: 0.0, arrive_at: Some(t), task: clean(&v.role), next_think: 0.0, last_say: -100.0, react_anim: None, fatigue: 0.0, greeted: false, stuck: 0, seed: 1000 + vi as u64 };
            cmd.spawn((a, Mover::new(inside, Facing::Down), Pose { hidden: true, alpha: 0.0, ..default() }, Cal::default(), VisitorScript { vi, leave_at: day as f64 * 1440.0 + leave as f64 }, Transform::default(), Visibility::default()));
            memo.push(&clock, MemoKind::People, format!("Visitor {} is descending. Reception has been notified.", clean(&v.name)));
        }
    }
    for (e, mut a, mut mv, vs) in &mut q {
        if a.plan.act.absent() { continue; }
        let v = &data.0.visitors[vs.vi];
        if t >= vs.leave_at { if a.plan.act != Act::Leaving { let p = Plan { act: Act::Leaving, dest: el.front, face: None, until: t + 600.0, label: "Leaving (waiting for the elevator)".into(), prio: Prio::Forced, anim: Anim::Wave, run: false, look_at: None }; set_plan(&mut a, &mut mv, &grid, p, t); if !el.queue.contains(&e) { el.queue.push(e); } } continue; }
        if !mv.arrived || t < a.plan.until { continue; }
        let cur = v.calendar.iter().find(|c| (c.days.as_ref().map_or(true, |d| d.iter().any(|x| x.eq_ignore_ascii_case(wd)))) && tod >= to_min(&c.start) - 3.0 && tod < to_min(&c.end));
        let (dest, face, label, anim) = match cur.and_then(|c| idx.room_by_id.get(&c.room_id).map(|&r| (r, c))) {
            Some((ri, c)) => { let r = &data.0.rooms[ri]; let s = r.seats.last().map(|s| (tile_center(s), s.facing)).unwrap_or((r.rect.center(), None)); (s.0, s.1, clean(&c.title), Anim::Sit) }
            None => { let g = idx.poi(&data.0, "reception_greet").unwrap_or(inside); (grid.nearest_walkable((g + Vec2::new(rng.range(-1.5, 1.5), 1.0)).floor().as_ivec2()).as_vec2() + 0.5, Some(Facing::Up), "Waiting at reception (calmly)".into(), Anim::Idle) }
        };
        let p = Plan { act: Act::Visit { what: "visitor" }, dest, face, until: t + 5.0, label, prio: Prio::Calendar, anim, run: false, look_at: None };
        if (p.dest - a.plan.dest).length() > 0.3 { set_plan(&mut a, &mut mv, &grid, p, t); } else { a.plan.until = t + 5.0; }
    }
}
