//! Calendar-level orchestration: room bookings per weekday, meeting start/end memos, overruns
//! (the next group waits outside and knocks), size-mismatch moments, plus company progress/quotas.
use crate::agents::*;
use crate::agents::Anim;
use crate::data::*;
use crate::events::*;
use crate::sim::*;
use crate::world::*;
use bevy::prelude::*;
use std::collections::HashMap;

#[derive(Clone, Debug)]
pub struct Booking { pub room: usize, pub start: f32, pub end: f32, pub title: String, pub kind: String, pub key: String, pub attendees: usize, pub mismatch: bool }

#[derive(Resource, Default)]
pub struct Bookings { pub weekday: usize, pub list: Vec<Booking>, pub last_t: f64, pub knocked: HashMap<usize, String> }

#[derive(Resource)]
pub struct Progress { pub quotas: HashMap<String, f32>, pub labels: HashMap<String, String>, pub version: (u32, u32, u32), pub output: f32, pub shipped: u32 }

pub struct MeetingsPlugin;
impl Plugin for MeetingsPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<Bookings>()
            .add_systems(Startup, init_progress.after(StartupSet::World))
            .add_systems(Update, (bookings_tick, room_counts, progress_tick).chain().in_set(SimSet::Roles));
    }
}

fn init_progress(mut cmd: Commands, data: Res<Data>, mut rooms: ResMut<Rooms>) {
    let d = &data.0;
    let mut quotas = HashMap::new(); let mut labels = HashMap::new();
    for t in &d.teams { quotas.insert(t.id.clone(), t.quota.start.clamp(0.0, 0.95)); labels.insert(t.id.clone(), if t.quota.label.is_empty() { "Quota".into() } else { clean(&t.quota.label) }); }
    for q in &d.company.quotas { if q.start > 0.0 { quotas.insert(q.team_id.clone(), q.start.clamp(0.0, 0.95)); } if !q.label.is_empty() { labels.insert(q.team_id.clone(), clean(&q.label)); } }
    let v: Vec<u32> = d.company.version.split('.').filter_map(|x| x.trim_start_matches('v').parse().ok()).collect();
    cmd.insert_resource(Progress { quotas, labels, version: (v.first().copied().unwrap_or(0), v.get(1).copied().unwrap_or(1), v.get(2).copied().unwrap_or(0)), output: 0.0, shipped: 0 });
    rooms.states = vec![RoomState::default(); d.rooms.len()];
}

fn rebuild(d: &Company, idx: &WorldIndex, wd: usize) -> Vec<Booking> {
    let mut map: HashMap<String, Booking> = HashMap::new();
    for p in &d.people {
        for it in d.calendar_for(p, wd) {
            let Some(&ri) = idx.room_by_id.get(&it.room_id) else { continue };
            let key = if it.id.is_empty() { format!("{}@{}", it.room_id, it.start) } else { it.id.clone() };
            map.entry(key.clone()).or_insert(Booking { room: ri, start: to_min(&it.start), end: to_min(&it.end), title: clean(&it.title), kind: it.kind.clone(), key, attendees: it.attendees.len().max(1), mismatch: it.mismatch });
        }
    }
    let mut v: Vec<Booking> = map.into_values().collect();
    v.sort_by(|a, b| a.start.partial_cmp(&b.start).unwrap());
    v
}

#[allow(clippy::too_many_arguments)]
fn bookings_tick(data: Res<Data>, idx: Res<WorldIndex>, clock: Res<Clock>, mut b: ResMut<Bookings>, mut rooms: ResMut<Rooms>, mut rng: ResMut<SimRng>, mut memo: ResMut<Memo>, mut fire: EventWriter<Fire>, bus: Res<Bus>) {
    let d = &data.0;
    if b.list.is_empty() || b.weekday != clock.weekday() { b.weekday = clock.weekday(); b.list = rebuild(d, &idx, b.weekday); }
    let t = clock.t; let t0 = b.last_t; b.last_t = t;
    if t <= t0 || t - t0 > 60.0 { return; }
    let day0 = clock.day() as f64 * 1440.0;
    let list = b.list.clone();
    for bk in &list {
        let s = day0 + bk.start as f64; let e = day0 + bk.end as f64;
        if s > t0 && s <= t {
            if let Some(rs) = rooms.states.get_mut(bk.room) { rs.title = bk.title.clone(); rs.key = bk.key.clone(); }
            let rname = clean(&d.rooms[bk.room].name);
            let vars: HashMap<&str, String> = [("title", bk.title.clone()), ("room", rname.clone()), ("n", bk.attendees.to_string()), ("name", "Someone".into())].into_iter().collect();
            if bk.attendees >= 3 && rng.chance(0.4) { if let Some(tpl) = d.lines.ticker.get("meeting_start").and_then(|v| rng.pick(v).cloned()) { memo.push(&clock, MemoKind::Meeting, fill_template(&tpl, &vars)); } }
            let ev = match bk.kind.as_str() { "standup" => Some("standup"), "interview" => Some("interview"), "wellness" => Some("wellness-session"), _ => None };
            let ev = if bk.mismatch { Some("size-mismatch") } else { ev };
            if let Some(id) = ev { if bus.by_id.contains_key(id) { let mut f = Fire::new(id); f.room = Some(bk.room); f.title = Some(bk.title.clone()); fire.write(f); } }
        }
        if e > t0 && e <= t {
            // overrun? standups love to run long; more likely if someone is booked right after
            let next_soon = list.iter().any(|n| n.room == bk.room && n.key != bk.key && n.start >= bk.end && n.start - bk.end < 25.0);
            let p = match bk.kind.as_str() { "standup" => 0.45, "sync" | "review" => 0.3, "allhands" => 0.2, _ => 0.15 } * if next_soon { 1.4 } else { 0.6 };
            if bk.attendees >= 2 && rng.chance(p) {
                let extra = rng.range(6.0, 16.0) as f64;
                if let Some(rs) = rooms.states.get_mut(bk.room) { rs.overrun_until = t + extra; rs.overrun_key = bk.key.clone(); }
                let id = if bk.kind == "standup" { "standup-overrun" } else { "meeting-overrun" };
                if bus.by_id.contains_key(id) { let mut f = Fire::new(id); f.room = Some(bk.room); f.title = Some(bk.title.clone()); fire.write(f); }
            } else if let Some(rs) = rooms.states.get_mut(bk.room) { if rs.key == bk.key { rs.title.clear(); } if rng.chance(0.12) && bus.by_id.contains_key("could-have-been-email") { let mut f = Fire::new("could-have-been-email"); f.room = Some(bk.room); fire.write(f); } }
        }
    }
    // the waiting group knocks once per overrun
    for (ri, rs) in rooms.states.iter_mut().enumerate() {
        if rs.overrun_until > t && rs.waiting > 0 && b.knocked.get(&ri) != Some(&rs.overrun_key) {
            b.knocked.insert(ri, rs.overrun_key.clone());
            if bus.by_id.contains_key("meeting-knock") { let mut f = Fire::new("meeting-knock"); f.room = Some(ri); fire.write(f); }
        }
        if rs.overrun_until <= t && !rs.overrun_key.is_empty() { rs.overrun_key.clear(); }
    }
}

fn room_counts(mut rooms: ResMut<Rooms>, q: Query<(&Agent, &Mover)>) {
    for rs in rooms.states.iter_mut() { rs.count = 0; rs.waiting = 0; }
    for (a, m) in &q {
        match a.plan.act { Act::Meeting { room, .. } if m.arrived => { if let Some(r) = rooms.states.get_mut(room) { r.count += 1; } }
            Act::Waiting { room } if m.arrived => { if let Some(r) = rooms.states.get_mut(room) { r.waiting += 1; } }
            _ => {} }
    }
}

fn progress_tick(data: Res<Data>, clock: Res<Clock>, machines: Res<Machines>, mut prog: ResMut<Progress>, q: Query<(&Agent, &Mover)>, mut fire: EventWriter<Fire>, mut memo: ResMut<Memo>, bus: Res<Bus>) {
    let dt = clock.dt_min; if dt <= 0.0 { return; }
    let mut add: HashMap<String, f32> = HashMap::new();
    for (a, m) in &q {
        if a.role != Role::Staff || !m.arrived { continue; }
        let w = match a.plan.act { Act::Desk => 1.0, Act::React { .. } if a.plan.anim == Anim::Type => 1.6, Act::Meeting { .. } => 0.25, _ => 0.0 };
        if w == 0.0 { continue; }
        *add.entry(a.team.clone()).or_default() += w * (0.5 + a.needs.focus * 0.5) * (0.6 + a.needs.energy * 0.4) * machines.output_mult * 0.00022 * dt;
    }
    let mut hit = vec![];
    for (team, v) in add { let prog = &mut *prog; let q = prog.quotas.entry(team.clone()).or_insert(0.3); *q += v; prog.output += v; if *q >= 1.0 { *q = 0.12; hit.push(team); } }
    for team in hit {
        if bus.by_id.contains_key("quota-reached") { let mut f = Fire::new("quota-reached"); f.team = Some(team.clone()); fire.write(f); }
        else { memo.push(&clock, MemoKind::Event, format!("{} hit quota.", team)); }
    }
    // the vague product ships patch versions as output accumulates
    while prog.output > 0.6 { prog.output -= 0.6; prog.version.2 += 1; prog.shipped += 1; if prog.shipped % 3 == 0 { let v = prog.version; memo.push(&clock, MemoKind::System, format!("The Outputs v{}.{}.{} shipped. Nobody knows what changed. Everyone is grateful.", v.0, v.1, v.2)); } }
    let _ = data;
}
