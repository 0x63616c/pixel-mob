//! Who is on the floor. Everyone enters and leaves through the elevator: staggered arrivals and
//! shift-end departures, lunch / errand trips out and back, and a day crew / night crew swap so the
//! office runs 24/7 while the population changes. The director (events), meetings and gossip only
//! see people who are present (`Act::absent`).
use crate::agents::*;
use crate::agents::Anim;
use crate::data::*;
use crate::roles::Elevator;
use crate::sim::*;
use bevy::prelude::*;
use std::collections::VecDeque;

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Why { Home, Lunch, Errand }
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Crew { Day, Night, Always }
#[derive(Clone, Debug)]
pub struct Trip { pub leave: f64, pub back: f64, pub why: Why, pub what: &'static str }

#[derive(Component)]
pub struct Shift { pub crew: Crew, pub arrive: f32, pub trips: VecDeque<Trip>, pub through_day: i64, pub current: Option<Trip>, pub waited: f64 }
/// present on an absent person: why they are off the floor and when they are due back
#[derive(Component, Clone, Copy)]
pub struct Away { pub why: Why, pub back: f64, pub since: f64 }

pub fn away_label(why: Why, back: f64) -> String {
    match why { Why::Home => format!("Gone home - back {}", fmt_min(back as f32)), Why::Lunch => format!("Off-site (lunch) - back {}", fmt_min(back as f32)), Why::Errand => format!("Off-site (errand) - back {}", fmt_min(back as f32)) }
}

fn h(seed: u64, day: i64, k: u64) -> f32 {
    let mut x = seed ^ (day as u64).wrapping_mul(0x9E37_79B9_7F4A_7C15) ^ k.wrapping_mul(0xBF58_476D_1CE4_E5B9);
    x ^= x >> 31; x = x.wrapping_mul(0x94D0_49BB_1331_11EB); x ^= x >> 29;
    (x % 10_000) as f32 / 10_000.0
}

const ERRANDS: [&str; 6] = ["dry cleaning", "the dentist", "the bank", "a parcel pickup", "the pharmacy", "an \"appointment\""];

/// one day's trips (absolute sim minutes), in order
fn trips_for(crew: Crew, arrive: f32, seed: u64, d: i64, traits: &[String]) -> Vec<Trip> {
    let day0 = d as f64 * 1440.0;
    let arr = |dd: i64| dd as f64 * 1440.0 + arrive as f64 + (h(seed, dd, 1) * 25.0 - 10.0) as f64;
    let mut v = vec![];
    match crew {
        Crew::Always => {}
        Crew::Day => {
            let back_prev = arr(d);
            let stay = 10.5 * 60.0 + h(seed, d, 2) as f64 * 120.0 + if traits.iter().any(|t| t == "overachiever") { 60.0 } else { 0.0 } - if traits.iter().any(|t| t == "slacker") { 50.0 } else { 0.0 };
            let leave = back_prev + stay;
            if h(seed, d, 3) < 0.3 { let l = day0 + 11.0 * 60.0 + 50.0 + h(seed, d, 4) as f64 * 90.0; if l > back_prev + 45.0 { v.push(Trip { leave: l, back: l + 35.0 + h(seed, d, 5) as f64 * 25.0, why: Why::Lunch, what: "lunch" }); } }
            if h(seed, d, 6) < 0.12 { let span = (leave - back_prev - 240.0).max(0.0); let l = back_prev + 90.0 + h(seed, d, 7) as f64 * span; v.push(Trip { leave: l, back: l + 20.0 + h(seed, d, 8) as f64 * 25.0, why: Why::Errand, what: ERRANDS[(h(seed, d, 9) * 6.0) as usize % 6] }); }
            v.push(Trip { leave, back: arr(d + 1), why: Why::Home, what: "home" });
        }
        Crew::Night => {
            // night crew: on the floor ~15:00 -> ~07:30 (they hand over to the day crew at breakfast)
            if h(seed, d, 3) < 0.3 { let l = day0 + 30.0 + h(seed, d, 4) as f64 * 90.0; v.push(Trip { leave: l, back: l + 30.0 + h(seed, d, 5) as f64 * 25.0, why: Why::Lunch, what: "midnight burritos" }); }
            let leave = day0 + 7.0 * 60.0 + 20.0 + h(seed, d, 2) as f64 * 110.0;
            let back = leave + 6.5 * 60.0 + h(seed, d, 6) as f64 * 90.0;
            v.push(Trip { leave, back, why: Why::Home, what: "home" });
            if h(seed, d, 7) < 0.1 { let l = back + 120.0 + h(seed, d, 8) as f64 * 300.0; v.push(Trip { leave: l, back: l + 20.0 + h(seed, d, 9) as f64 * 25.0, why: Why::Errand, what: ERRANDS[(h(seed, d, 10) * 6.0) as usize % 6] }); }
        }
    }
    v.sort_by(|a, b| a.leave.partial_cmp(&b.leave).unwrap());
    v
}

fn crew_for(a: &Agent, p: &Person) -> Crew {
    match a.role {
        Role::Supervisor => Crew::Always, // the Floor Supervisor has never been seen leaving
        Role::Receptionist => Crew::Day,
        Role::Facilities => if a.seed % 3 == 0 { Crew::Day } else { Crew::Night }, // cleaners come in at night
        Role::Staff => {
            if a.has("lives-here") || (a.has("overachiever") && a.seed % 5 == 0) { return Crew::Always; }
            let night_bias = if a.has("night-owl") { 0.75 } else { 0.22 };
            let late = to_min(&p.arrive) >= 10.0 * 60.0;
            if h(a.seed, 0, 99) < night_bias + if late { 0.1 } else { 0.0 } { Crew::Night } else { Crew::Day }
        }
        _ => Crew::Always,
    }
}

fn extend(sh: &mut Shift, a: &Agent, to_day: i64) {
    while sh.through_day < to_day {
        let d = sh.through_day + 1;
        for tr in trips_for(sh.crew, sh.arrive, a.seed, d, &a.traits) {
            let last_back = sh.trips.back().map(|x| x.back).unwrap_or(f64::MIN);
            if tr.leave >= last_back + 25.0 { sh.trips.push_back(tr); }
        }
        sh.through_day = d;
    }
}

/// Startup: give every person a shift; anyone whose off-site window covers the start time begins
/// off the floor (they will arrive through the elevator).
pub fn shift_init(mut cmd: Commands, data: Res<Data>, clock: Res<Clock>, el: Res<Elevator>, mut q: Query<(Entity, &mut Agent, &mut Mover, &mut Pose)>) {
    let t = clock.t;
    let door = el.door;
    for (e, mut a, mut mv, mut pose) in &mut q {
        let Some(pi) = a.pi else { continue };
        let p = &data.0.people[pi];
        let crew = crew_for(&a, p);
        let arrive = if p.arrive.is_empty() { 9.0 * 60.0 } else { to_min(&p.arrive) };
        let mut sh = Shift { crew, arrive, trips: VecDeque::new(), through_day: clock.day() as i64 - 2, current: None, waited: 0.0 };
        extend(&mut sh, &a, clock.day() as i64 + 1);
        // currently inside an off-site window?
        let cur = sh.trips.iter().find(|tr| tr.leave <= t && t < tr.back).cloned();
        while sh.trips.front().map_or(false, |tr| tr.leave <= t) { sh.trips.pop_front(); }
        // night crew are already on the floor at the morning start (they worked the night)
        let first_morning = crew == Crew::Day && clock.day() == 0 && a.arrive_at.is_some();
        if let Some(tr) = cur.or_else(|| if first_morning { Some(Trip { leave: t - 600.0, back: a.arrive_at.unwrap(), why: Why::Home, what: "home" }) } else { None }) {
            a.arrive_at = Some(tr.back);
            a.plan = Plan { act: Act::Hidden, dest: door, face: None, until: tr.back, label: away_label(tr.why, tr.back), prio: Prio::Idle, anim: Anim::Idle, run: false, look_at: None };
            mv.pos = door; mv.path.clear(); mv.arrived = true;
            pose.hidden = true; pose.alpha = 0.0;
            cmd.entity(e).insert(Away { why: tr.why, back: tr.back, since: t });
        } else if a.plan.act == Act::Hidden {
            // spawned hidden but on shift now: they are simply here already
            a.arrive_at = None; a.plan.act = Act::Desk; a.plan.until = t; mv.pos = a.home; pose.hidden = false; pose.alpha = 1.0;
        }
        cmd.entity(e).insert(sh);
    }
}

/// Each tick: present people whose next trip is due walk to the elevator and join the line.
/// They finish the meeting they are in first (up to an hour), and never bail out of a forced plan.
#[allow(clippy::too_many_arguments)]
/// people only join the elevator line while it is shorter than this (up to 50 sim-minutes of lingering)
pub const LINE_SOFT_CAP: usize = 9;

pub fn shift_tick(clock: Res<Clock>, grid: Res<Grid>, data: Res<Data>, mut el: ResMut<Elevator>, mut rng: ResMut<SimRng>, mut q: Query<(Entity, &mut Agent, &mut Mover, &mut Shift, &Pose)>, mut say: EventWriter<Say>) {
    let t = clock.t;
    let day = clock.day() as i64;
    for (e, mut a, mut mv, mut sh, pose) in &mut q {
        if sh.through_day < day + 1 { let a2 = &*a; extend(&mut sh, a2, day + 1); }
        if a.plan.act.absent() || pose.hidden || sh.current.is_some() { continue; }
        let Some(next) = sh.trips.front().cloned() else { continue };
        if t < next.leave { continue; }
        // missed it entirely (e.g. stuck in a long event): skip this trip
        if t >= next.back - 10.0 { sh.trips.pop_front(); continue; }
        let in_meeting = matches!(a.plan.act, Act::Meeting { .. } | Act::Waiting { .. }) && t < a.plan.until;
        let forced = a.plan.prio >= Prio::Event && t < a.plan.until && !matches!(a.plan.act, Act::Visit { what: "arrive" });
        if (in_meeting && t - next.leave < 60.0) || (forced && t - next.leave < 90.0) { continue; }
        // a long line at the elevator: finish one more thing at the desk and try again (keeps the line short, staggers rush hour)
        if el.queue.len() + el.boarding.len() >= LINE_SOFT_CAP && t - next.leave < 50.0 { continue; }
        sh.trips.pop_front();
        let why = next.why;
        let label = match why { Why::Home => "Heading home (waiting for the elevator)".to_string(), Why::Lunch => format!("Popping out for {}", next.what), Why::Errand => format!("Off to {}", next.what) };
        sh.current = Some(next);
        let dest = el.slots.get(el.queue.len()).copied().unwrap_or(el.front);
        let p = Plan { act: Act::Leaving, dest, face: Some(Facing::from_vec(el.door - dest)), until: t + 720.0, label, prio: Prio::Forced, anim: if rng.chance(0.25) { Anim::Phone } else { Anim::Idle }, run: false, look_at: Some(el.door) };
        set_plan(&mut a, &mut mv, &grid, p, t);
        if !el.queue.contains(&e) { el.queue.push(e); }
        if rng.chance(0.3) {
            let keys: &[&str] = match why { Why::Home => &["leaving", "goodbye", "shift_end"], _ => &["lunch", "leaving"] };
            if let Some(s) = line(&data.0, &mut rng, keys) { say.write(Say { who: e, text: s, secs: 2.6, prio: 0 }); }
            else if why == Why::Home { say.write(Say { who: e, text: ["See you tomorrow.", "Clocking out.", "Goodnight, desk.", "My Outie has plans."][rng.idx(4)].into(), secs: 2.6, prio: 0 }); }
        }
    }
}
