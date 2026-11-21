//! World events bus: scheduled / random / chained / manual events with a place and a reach.
//! Everyone in range scores join / ignore / gossip / flee from their traits + needs and reacts
//! visibly (emote, animation, bubble, plan change). Events chain; every event writes a Memo line.
use crate::agents::*;
use crate::agents::Anim;
use crate::data::*;
use crate::sim::*;
use crate::world::*;
use bevy::prelude::*;
use std::collections::{HashMap, HashSet};

#[derive(Event, Clone, Debug)]
pub struct Fire { pub id: String, pub at: Option<Vec2>, pub team: Option<String>, pub subject: Option<Entity>, pub manual: bool, pub room: Option<usize>, pub title: Option<String> }
impl Fire { pub fn new(id: &str) -> Fire { Fire { id: id.into(), at: None, team: None, subject: None, manual: false, room: None, title: None } } }

/// Visual effects / props requested from render.
#[derive(Event, Clone, Debug)]
pub struct Fx { pub kind: String, pub at: Vec2, pub secs: f32 }

#[derive(Clone, Debug)]
pub struct Active { pub serial: u32, pub def: usize, pub id: String, pub pos: Option<Vec2>, pub radius: Option<f32>, pub until: f64, pub joiners: Vec<Entity>, pub subject: Option<Entity>, pub team: Option<String>, pub knowers: usize, pub room: Option<usize> }

#[derive(Resource, Default)]
pub struct Bus { pub active: Vec<Active>, pub pending: Vec<(f64, Fire)>, pub cooldown: HashMap<String, f64>, pub serial: u32, pub fired: HashSet<(String, i64)>, pub last_t: f64, pub history: Vec<(f64, String)>, pub by_id: HashMap<String, usize>, pub url_fired: Vec<bool>, pub tension: f32 }
impl Bus { pub fn find(&self, serial: u32) -> Option<&Active> { self.active.iter().find(|a| a.serial == serial) } }

#[derive(Resource, Default)]
pub struct DelayedSay { pub q: Vec<(f32, Say)>, pub q_emote: Vec<(f32, Emote)>, pub now: f32 }

pub struct EventsPlugin;
impl Plugin for EventsPlugin {
    fn build(&self, app: &mut App) {
        app.add_event::<Fire>().add_event::<Fx>().init_resource::<Bus>().init_resource::<DelayedSay>()
            .add_systems(Startup, index_events.after(StartupSet::World))
            .add_systems(Update, (triggers, process_fire, expire, gossip, flush_delayed).chain().in_set(SimSet::Events));
    }
}

fn index_events(data: Res<Data>, mut bus: ResMut<Bus>, clock: Res<Clock>) {
    for (i, e) in data.0.events.iter().enumerate() { bus.by_id.insert(e.id.clone(), i); }
    bus.last_t = clock.t;
}

fn days_match(v: &serde_json::Value, wd: usize) -> bool {
    match v { serde_json::Value::String(s) => s == "daily" || s.eq_ignore_ascii_case(DAYS[wd]), serde_json::Value::Array(a) => a.iter().any(|x| x.as_str().map_or(false, |s| s.eq_ignore_ascii_case(DAYS[wd]))), _ => true }
}

/// god-director gate from company.json `events[].director`: returns a weight multiplier (0 = not now)
pub fn director_gate(d: &Company, e: &EventDef, t: f64, wd: usize, bus: &Bus) -> f32 {
    let Some(dr) = &e.director else { return 1.0 };
    let tod = (t % 1440.0) as f32;
    let within = |a: f32, b: f32| if a <= b { tod >= a && tod < b } else { tod >= a || tod < b };
    if let Some(w) = &dr.window { if !w.start.is_empty() && !w.end.is_empty() && !within(to_min(&w.start), to_min(&w.end)) { return 0.0; } }
    if !dr.days.is_null() && !days_match(&dr.days, wd) { return 0.0; }
    let ok = match dr.period.as_str() {
        "morning" => within(360.0, 720.0), "afternoon" => within(720.0, 1080.0), "day" => within(480.0, 1140.0),
        "night" => within(1140.0, 360.0), "meal" => within(690.0, 840.0) || within(1080.0, 1200.0), _ => true };
    if !ok { return 0.0; }
    // exclusions: never while an excluded event is running or fired in the last hour
    for x in &dr.exclusions {
        if bus.active.iter().any(|a| &a.id == x) || bus.history.iter().rev().take_while(|h| t - h.0 < 60.0).any(|h| &h.1 == x) { return 0.0; }
    }
    // preconditions: event ids must have fired today; "<thing> ok" means no event mentioning <thing> is running
    for p in &dr.preconditions {
        if let Some(thing) = p.strip_suffix(" ok") { if bus.active.iter().any(|a| a.id.contains(thing.trim())) { return 0.0; } }
        else if bus.by_id.contains_key(p) && !bus.history.iter().any(|h| &h.1 == p && h.0 >= t - tod as f64) { return 0.0; }
    }
    let _ = d;
    // tension pacing: dramatic events are rarer when the floor is already tense; calming ones likelier
    if dr.tension_delta > 0.0 { (1.4 - bus.tension * 0.5).clamp(0.2, 1.4) }
    else if dr.tension_delta < 0.0 { (0.8 + bus.tension * 0.4).clamp(0.5, 2.0) } else { 1.0 }
}

fn triggers(data: Res<Data>, clock: Res<Clock>, time: Res<Time>, params: Res<Params>, mut bus: ResMut<Bus>, mut rng: ResMut<SimRng>, mut fire: EventWriter<Fire>) {
    let t = clock.t; let t0 = bus.last_t; bus.last_t = t;
    // URL-driven manual fires (QA / playtest), in real seconds since start
    if bus.url_fired.len() != params.fire.len() { bus.url_fired = vec![false; params.fire.len()]; }
    for (i, (id, at)) in params.fire.iter().enumerate() { if !bus.url_fired[i] && time.elapsed_secs() >= *at { bus.url_fired[i] = true; let mut f = Fire::new(id); f.manual = true; fire.write(f); } }
    if t <= t0 { return; }
    bus.tension *= (-((t - t0) as f32) / 240.0).exp(); // drama relaxes over ~4 sim hours
    let wd = clock.weekday();
    let day = clock.day() as i64;
    for e in &data.0.events {
        // scheduled
        if let Some(s) = &e.schedule { if !s.time.is_empty() && days_match(&s.days, wd) {
            let at = day as f64 * 1440.0 + to_min(&s.time) as f64;
            if at > t0 && at <= t && bus.fired.insert((e.id.clone(), day)) { fire.write(Fire::new(&e.id)); }
        } }
        // random (chance per sim hour), respecting cooldown; only "random" kind
        // the god director owns every non-scheduled, non-chained event (old "manual" panel events included,
        // capped so a weight-1 panel event becomes "a few times a day", not "every cooldown")
        let base = if e.chance > 0.0 { e.chance } else { e.director.as_ref().map_or(0.0, |d| d.weight) };
        let base = if e.kind == "manual" { base.min(0.12) } else { base };
        if (e.kind == "random" || e.kind == "manual") && base > 0.0 {
            let cd = bus.cooldown.get(&e.id).copied().unwrap_or(-1e9);
            let m = director_gate(&data.0, e, t, wd, &bus);
            if t > cd && m > 0.0 && rng.chance(base * m * ((t - t0) as f32 / 60.0)) { fire.write(Fire::new(&e.id)); }
        }
    }
    // chains
    let due: Vec<Fire> = { let (d, keep): (Vec<_>, Vec<_>) = bus.pending.drain(..).partition(|(at, _)| *at <= t); bus.pending = keep; d.into_iter().map(|x| x.1).collect() };
    for f in due { fire.write(f); }
}

pub fn anim_of(s: &str) -> Option<Anim> {
    Some(match s { "celebrate" | "cheer" | "wake" => Anim::Celebrate, "facepalm" | "slump" => Anim::Facepalm, "clap" => Anim::Clap, "wave" => Anim::Wave, "knock" => Anim::Knock, "type" => Anim::Type, "eat" | "drink" => Anim::Drink, "sleep" => Anim::Sleep, "pet" => Anim::Pet, "bow" => Anim::Bow, "stretch" => Anim::Stretch, "nod" => Anim::Nod, "doze" => Anim::Doze, "fidget" => Anim::Fidget, "sprint" | "run" => Anim::Run, "phone" => Anim::Phone, _ => return None })
}

fn loc_of(d: &Company, idx: &WorldIndex, ev: &EventDef, f: &Fire, rng: &mut SimRng, agents: &[(Entity, Vec2, String, String, Option<Vec2>)]) -> (Option<Vec2>, Option<Entity>, Option<String>) {
    if let Some(p) = f.at { return (Some(p), f.subject, f.team.clone()); }
    if let Some(ri) = f.room { return (Some(d.rooms[ri].rect.center()), f.subject, f.team.clone()); }
    let r = &ev.location.reference;
    let rs = r.as_str().unwrap_or("");
    match ev.location.kind.as_str() {
        "poi" => (idx.poi(d, rs).or_else(|| idx.poi(d, &rs.replace('-', "_"))), None, None),
        "room" => { let ri = idx.room_by_id.get(rs).copied().or_else(|| if d.rooms.is_empty() { None } else { Some(rng.idx(d.rooms.len())) }); (ri.map(|i| d.rooms[i].rect.center()), None, None) }
        "desk" => {
            let cand: Vec<_> = agents.iter().filter(|a| a.4.is_some()).collect();
            if let Some(s) = f.subject.and_then(|s| agents.iter().find(|a| a.0 == s)) { return (s.4.or(Some(s.1)), Some(s.0), Some(s.2.clone())); }
            match rng.pick(&cand) { Some(a) => (a.4, Some(a.0), Some(a.2.clone())), None => (None, None, None) }
        }
        "team" => {
            let teams: Vec<String> = match r { serde_json::Value::Array(a) => a.iter().filter_map(|x| x.as_str().map(String::from)).collect(), serde_json::Value::String(s) => vec![s.clone()], _ => f.team.iter().cloned().collect() };
            let team = f.team.clone().or_else(|| rng.pick(&teams).cloned()).or_else(|| rng.pick(&d.teams).map(|t| t.id.clone()));
            let sec = team.as_ref().and_then(|t| d.teams.iter().find(|x| &x.id == t)).and_then(|t| idx.section_by_id.get(&t.section_id)).map(|&i| d.layout.sections[i].rect.center());
            (sec, None, team)
        }
        "pet" => (None, None, None),
        "void" => { let a = rng.range(0.0, 6.28); (Some(idx.center + Vec2::new(a.cos() * (d.layout.w as f32 * 0.5 + 4.0), a.sin() * (d.layout.h as f32 * 0.5 + 3.0))), None, None) }
        _ => (None, None, None),
    }
}

fn fill(d: &Company, ev: &EventDef, rng: &mut SimRng, vars: &HashMap<&str, String>) -> String {
    let pool: Vec<String> = if !ev.ticker_templates.is_empty() { ev.ticker_templates.clone() } else { d.lines.ticker.get(&ev.id).cloned().unwrap_or_default() };
    let t = rng.pick(&pool).cloned().unwrap_or_else(|| format!("{}.", ev.name));
    fill_template(&t, vars)
}

#[allow(clippy::too_many_arguments)]
fn process_fire(
    mut ev_in: EventReader<Fire>, data: Res<Data>, idx: Res<WorldIndex>, grid: Res<Grid>, clock: Res<Clock>, mut bus: ResMut<Bus>, mut rng: ResMut<SimRng>,
    mut memo: ResMut<Memo>, mut machines: ResMut<Machines>, mut q: Query<(Entity, &mut Agent, &mut Mover)>, mut fx: EventWriter<Fx>, delayed: ResMut<DelayedSay>,
) {
    let delayed = delayed.into_inner();
    let d = &data.0;
    let fires: Vec<Fire> = ev_in.read().cloned().collect();
    for f in fires {
        let Some(&di) = bus.by_id.get(&f.id) else { warn!("unknown event {}", f.id); continue };
        let ev = &d.events[di];
        // don't stack the same event (except chained bookkeeping / manual spam protection)
        if bus.active.iter().any(|a| a.id == f.id && a.room == f.room) && !f.manual { continue; }
        if f.manual { bus.active.retain(|a| a.id != f.id); }
        let t = clock.t;
        let dcd = ev.director.as_ref().map_or(0.0, |dr| dr.cooldown);
        bus.cooldown.insert(f.id.clone(), t + ev.cooldown.max(dcd).max(30.0) as f64);
        if let Some(dr) = &ev.director { bus.tension = (bus.tension + dr.tension_delta).clamp(-2.0, 3.0); }
        let snapshot: Vec<(Entity, Vec2, String, String, Option<Vec2>)> = q.iter().filter(|(_, a, _)| a.role == Role::Staff && !a.plan.act.absent()).map(|(e, a, m)| (e, m.pos, a.team.clone(), a.first.clone(), a.desk.map(|_| a.home))).collect();
        let (pos, subject, team) = loc_of(d, &idx, ev, &f, &mut rng, &snapshot);
        bus.serial += 1;
        let serial = bus.serial;
        let radius = ev.radius.filter(|r| *r > 0.0);
        let until = t + ev.duration.max(1.0) as f64;
        // ---- machine / world state side effects
        match ev.id.as_str() {
            "coffee-machine-breaks" => machines.coffee_broken = true,
            "coffee-repair" | "coffee-cheer" => machines.coffee_broken = false,
            "printer-jam" => machines.printer_jam = true,
            "printer-fixed" => machines.printer_jam = false,
            "microwave-fish" => machines.fish = ev.duration,
            "prod-down" => machines.screen = "prodDown".into(),
            "prod-fixed" | "deploy-success" => machines.screen = "".into(),
            "friday-deploy" => machines.screen = "deploy".into(),
            "funding-round" => machines.screen = "funding".into(),
            "fire-drill" => machines.alarm = ev.duration,
            "fire-drill-allclear" => machines.alarm = 0.0,
            "void-flicker" => machines.flicker = 1.0,
            "gerald-missing" => { machines.gerald_missing = true; crate::ui::GERALD_MISSING.store(true, std::sync::atomic::Ordering::Relaxed); }
            "gerald-returns" => { machines.gerald_missing = false; crate::ui::GERALD_MISSING.store(false, std::sync::atomic::Ordering::Relaxed); }
            _ => {}
        }
        // ---- props & effects
        let p = pos.unwrap_or(idx.center);
        let props: &[(&str, &str)] = &[("donut", "donutBox"), ("pizza", "pizza"), ("birthday", "cake"), ("taco", "tacoBar"), ("reward-party", "balloons"), ("funding", "confetti"), ("quota-reached", "confetti"), ("deploy-success", "confetti"), ("coffee-machine-breaks", "smoke"), ("microwave-fish", "stink"), ("printer-jam", "sparks"), ("coffee-cheer", "sparkle"), ("prod-fixed", "sparkle"), ("tchotchke", "sparkle"), ("void-flicker", "flicker"), ("fire-drill", "alarm"), ("goat", "sparkle")];
        for (k, kind) in props { if ev.id.contains(k) { fx.write(Fx { kind: kind.to_string(), at: p, secs: ev.duration.max(4.0) * 60.0 / SIM_MIN_PER_SEC / clock.speed.max(1.0) }); } }
        if ev.id == "funding-round" || ev.id == "reward-party" || ev.id == "deploy-success" { for k in 0..5 { let a = k as f32 * 1.256; fx.write(Fx { kind: "confetti".into(), at: idx.center + Vec2::new(a.cos() * 14.0, a.sin() * 8.0), secs: 6.0 }); } }
        // ---- memo
        let mut vars: HashMap<&str, String> = HashMap::new();
        let subj_name = subject.and_then(|s| snapshot.iter().find(|x| x.0 == s)).map(|x| x.3.clone()).or_else(|| rng.pick(&snapshot).map(|x| x.3.clone())).unwrap_or("Someone".into());
        let other = rng.pick(&snapshot).map(|x| x.3.clone()).unwrap_or("Someone".into());
        vars.insert("name", subj_name.clone()); vars.insert("other", other); vars.insert("time", clock.hhmm());
        vars.insert("room", f.room.map(|r| clean(&d.rooms[r].name)).unwrap_or_else(|| ev.location.reference.as_str().and_then(|r| idx.room_by_id.get(r)).map(|&r| clean(&d.rooms[r].name)).unwrap_or("the void".into())));
        let tname = team.as_ref().and_then(|t| d.teams.iter().find(|x| &x.id == t)).map(|t| clean(&t.name)).unwrap_or("the floor".into());
        vars.insert("team", tname.clone());
        vars.insert("title", f.title.clone().unwrap_or_default());
        vars.insert("version", d.company.version.clone());
        let prize = d.company.prizes.get(rng.idx(d.company.prizes.len().max(1))).map(|p| p.get("name").and_then(|n| n.as_str()).or(p.as_str()).unwrap_or("Melon Hour").to_string()).unwrap_or("Melon Hour".into());
        vars.insert("prize", prize);
        vars.insert("quota", d.company.quotas.iter().find(|x| Some(&x.team_id) == team.as_ref()).map(|q| q.label.clone()).unwrap_or("quota".into()));
        let in_range = snapshot.iter().filter(|a| match (pos, radius) { (Some(p), Some(r)) => (a.1 - p).length() <= r, _ => true }).count();
        vars.insert("n", format!("{}", in_range.max(2)));
        let kind = match ev.id.as_str() { "standup" | "interview" | "wellness-session" | "size-mismatch" | "meeting-overrun" | "standup-overrun" | "meeting-knock" | "could-have-been-email" => MemoKind::Meeting, _ => MemoKind::Event };
        let quiet = matches!(ev.id.as_str(), "founder-quote") && rng.chance(0.4);
        if !quiet { memo.push(&clock, kind, fill(d, ev, &mut rng, &vars)); }
        if ev.id == "founder-quote" && !d.lines.founder_quotes.is_empty() { memo.push(&clock, MemoKind::System, format!("\"{}\" - {}", clean(&d.lines.founder_quotes[rng.idx(d.lines.founder_quotes.len())]), clean(&d.company.founder.name))); }
        bus.history.push((t, ev.id.clone()));
        // ---- chains
        for c in &ev.chains_to { if rng.chance(if c.chance <= 0.0 { 1.0 } else { c.chance }) {
            let mut nf = Fire::new(&c.id); nf.at = if ev.location.kind == "global" { None } else { pos }; nf.team = team.clone(); nf.subject = subject; nf.room = f.room;
            // mutually exclusive outcomes (deploy-success vs prod-down): keep the first that rolls
            // Gerald always comes back (an hour or three later, looking unbothered)
        if ev.id == "gerald-missing" && !bus.pending.iter().any(|(_, pf)| pf.id == "gerald-returns") { let back = t + rng.range(60.0, 200.0) as f64; bus.pending.push((back, Fire::new("gerald-returns"))); }
        if ev.id == "friday-deploy" && bus.pending.iter().any(|(_, pf)| pf.id == "deploy-success" || pf.id == "prod-down") { continue; }
            bus.pending.push((t + c.delay.max(0.5) as f64, nf));
        } }
        if ev.id == "friday-deploy" && !bus.pending.iter().any(|(_, pf)| pf.id == "deploy-success" || pf.id == "prod-down") { bus.pending.push((t + 10.0, Fire::new("deploy-success"))); }
        // ---- reactions
        let parts = ev.participants.clone().unwrap_or(serde_json::Value::Null);
        let p_orgs: Vec<String> = parts.get("orgs").and_then(|v| v.as_array()).map(|a| a.iter().filter_map(|x| x.as_str().map(String::from)).collect()).unwrap_or_default();
        let p_traits: Vec<String> = parts.get("traits").and_then(|v| v.as_array()).map(|a| a.iter().filter_map(|x| x.as_str().map(String::from)).collect()).unwrap_or_default();
        let p_teams_trig = parts.get("teams").and_then(|v| v.as_str()) == Some("triggering");
        let p_max = parts.get("max").and_then(|v| v.as_u64()).map(|m| m as usize);
        let all = parts.get("all").and_then(|v| v.as_bool()).unwrap_or(false);
        let mut joiners = vec![];
        let mut speakers = 0;
        let mut order: Vec<(Entity, f32)> = q.iter().filter(|(_, a, _)| a.role == Role::Staff && !a.plan.act.absent()).map(|(e, _, m)| (e, pos.map_or(rng.f() * 50.0, |p| (m.pos - p).length()))).collect();
        order.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap());
        let defw = ev.reactions.get("default").copied().unwrap_or(Weights { join: 0.4, ignore: 0.4, gossip: 0.2, flee: 0.0 });
        let mut nth = 0usize;
        let behavior = ev.join_behavior.as_str();
        for (e, dist) in order {
            let Ok((_, mut a, mut mv)) = q.get_mut(e) else { continue };
            if let Some(r) = radius { if pos.is_some() && dist > r { continue; } }
            let eligible = (p_orgs.is_empty() || p_orgs.contains(&a.org)) && (p_traits.is_empty() || p_traits.iter().any(|t| a.has(t))) && (!p_teams_trig || team.as_ref() == Some(&a.team));
            // weights = default + Σ traits, nudged by needs
            let mut w = defw;
            for tr in &a.traits { if let Some(x) = ev.reactions.get(tr) { w.join += x.join; w.ignore += x.ignore; w.gossip += x.gossip; w.flee += x.flee; } }
            if ev.effects.needs.hunger < 0.0 { w.join += a.needs.hunger * 0.8; }
            if ev.effects.needs.stress > 0.1 { w.flee += a.needs.stress * 0.2; }
            if !eligible { w.join = 0.0; }
            if all && eligible { w.join += 3.0; }
            if let Some(m) = p_max { if joiners.len() >= m { w.join = 0.0; } }
            if behavior == "none" { w.gossip += w.join * 0.5; w.join = 0.0; }
            if subject == Some(e) { w.join += 5.0; }
            let sum = w.join.max(0.0) + w.ignore.max(0.0) + w.gossip.max(0.0) + w.flee.max(0.0);
            if sum <= 0.0 { continue; }
            let mut r = rng.f() * sum;
            let choice = if r < w.join.max(0.0) { 0 } else { r -= w.join.max(0.0); if r < w.ignore.max(0.0) { 1 } else { r -= w.ignore.max(0.0); if r < w.gossip.max(0.0) { 2 } else { 3 } } };
            // needs effects apply to anyone who notices
            if choice != 1 { let n = &ev.effects.needs; a.needs.energy = (a.needs.energy + n.energy).clamp(0.0, 1.0); a.needs.hunger = (a.needs.hunger + n.hunger).clamp(0.0, 1.0); a.needs.social = (a.needs.social + n.social).clamp(0.0, 1.0); a.needs.stress = (a.needs.stress + n.stress).clamp(0.0, 1.0); a.needs.focus = (a.needs.focus + n.focus).clamp(0.0, 1.0); }
            let delay = 0.15 + (dist.min(30.0)) * 0.05 + rng.range(0.0, 0.5); // the reaction ripples outward from the source
            if choice != 1 {
                a.knows.push(serial);
                if !ev.emotes.is_empty() { delayed.q_emote.push((delayed.now + delay, Emote { who: e, icon: ev.emotes[rng.idx(ev.emotes.len())].clone() })); }
                if let Some(an) = anim_of(&ev.anim.react) { if a.plan.act != Act::Nap || ev.id == "overtime-protocol" { a.react_anim = Some((an, rng.range(1.2, 2.4))); } }
                if speakers < 4 && rng.chance(0.65) {
                    let key = if ev.line_key.is_empty() { ev.id.clone() } else { ev.line_key.clone() };
                    if let Some(s) = line(d, &mut rng, &[&key, &ev.id]) { delayed.q.push((delayed.now + delay + 0.3 * speakers as f32, Say { who: e, text: s, secs: 3.2, prio: 2 })); speakers += 1; }
                }
            } else if a.has("focused") && rng.chance(0.4) { delayed.q_emote.push((delayed.now + delay, Emote { who: e, icon: "dots".into() })); }
            if a.plan.act == Act::Nap && ev.id != "overtime-protocol" && choice != 0 { continue; } // nappers sleep through most things
            let mut plan = |act: Act, dest: Vec2, face: Option<Facing>, anim: Anim, run: bool, label: String| Plan { act, dest, face, until, label, prio: Prio::Event, anim, run, look_at: pos };
            let label = clean(&ev.name);
            let new_plan: Option<Plan> = match choice {
                0 => {
                    let run = matches!(ev.anim.join.as_str(), "run" | "sprint");
                    let k = nth; nth += 1;
                    let ring = |center: Vec2, k: usize, rng: &mut SimRng| { let ang = k as f32 * 2.399 + rng.range(-0.2, 0.2); let rr = 1.6 + (k / 7) as f32 * 1.0; let tgt = center + Vec2::new(ang.cos() * rr, ang.sin() * rr * 0.8); grid.nearest_walkable(tgt.floor().as_ivec2()).as_vec2() + 0.5 };
                    match behavior {
                        "queue" => { let qn = ev.location.reference.as_str().unwrap_or("coffee").to_string(); let qn = if d.layout.queues.contains_key(&qn) { qn } else if ev.id.contains("taco") { "snackbar".into() } else { "coffee".into() }; Some(Plan { until: until.max(t + 20.0), ..plan(Act::Queue { q: qn }, p, None, Anim::Idle, run, label) }) }
                        "swarm" | "gather" if ev.location.kind != "room" || ev.location.reference.is_null() => { let dest = ring(p, k, &mut rng); Some(plan(Act::React { serial }, dest, Some(Facing::from_vec(p - dest)), match ev.anim.react.as_str() { "eat" => Anim::Drink, "clap" => Anim::Clap, _ => Anim::Celebrate }, run, label)) }
                        "sit" | "gather" | "swarm" => {
                            let ri = f.room.or_else(|| ev.location.reference.as_str().and_then(|r| idx.room_by_id.get(r).copied()));
                            // already booked into this very room by the calendar (e.g. the nightly assembly): keep that seat
                            if let (Some(r0), Act::Meeting { room, .. }) = (ri, &a.plan.act) { if *room == r0 { a.knows.push(serial); continue; } }
                            match ri { Some(ri) => { let pseudo: Vec<String> = vec![]; let (sp, sf, sitting) = seat_for(d, ri, &pseudo, &format!("#{k}"), k as u64); let sp = if d.rooms[ri].seats.len() > k { tile_center(&d.rooms[ri].seats[k]) } else { sp }; let sf = if d.rooms[ri].seats.len() > k { d.rooms[ri].seats[k].facing.unwrap_or(sf) } else { sf };
                                Some(plan(Act::React { serial }, sp, Some(sf), if sitting || d.rooms[ri].seats.len() > k { Anim::Sit } else { Anim::Clap }, run, label)) }
                                None => { let dest = ring(p, k, &mut rng); Some(plan(Act::React { serial }, dest, Some(Facing::from_vec(p - dest)), Anim::Celebrate, run, label)) } }
                        }
                        "evacuate" => { let m = d.layout.muster_tiles(); let dest = if m.is_empty() { idx.poi(d, "muster").map(|c| ring(c, k, &mut rng)).unwrap_or(a.home + Vec2::new(0.0, 30.0)) } else { m[k % m.len()] }; Some(plan(Act::React { serial }, dest, Some(Facing::Up), Anim::Idle, true, label)) }
                        "sprint" => if a.desk.is_some() && (a.org == "eng" || ev.location.kind == "desk") { let (h, hf) = (a.home, a.home_face); Some(plan(Act::React { serial }, h, Some(hf), Anim::Type, true, label)) } else { None },
                        "watch" => { let toward = pos.map(|pp| { let v = pp - mv.pos; if v.length() > 4.0 { mv.pos + v.normalize() * (v.length() - 3.5).min(2.5) } else { mv.pos } }).unwrap_or(mv.pos); let dest = grid.nearest_walkable(toward.floor().as_ivec2()).as_vec2() + 0.5; Some(Plan { until: t + (ev.duration as f64).min(12.0), ..plan(Act::React { serial }, dest, pos.map(|pp| Facing::from_vec(pp - dest)), Anim::Idle, false, label) }) }
                        "escort" => None, // roles.rs (supervisor + subject)
                        _ => None,
                    }
                }
                2 if ev.gossipable => { Some(Plan { until: t + 25.0, ..plan(Act::Gossip { serial, target: e }, mv.pos, None, Anim::Talk, false, "Spreading the news".into()) }) }
                3 => { let from = pos.unwrap_or(mv.pos); let away = (mv.pos - from).normalize_or(Vec2::X); let r = radius.unwrap_or(6.0); let dest = grid.nearest_walkable((from + away * (r + 3.0)).floor().as_ivec2()).as_vec2() + 0.5; Some(Plan { until: t + 15.0, ..plan(Act::React { serial }, dest, Some(Facing::from_vec(from - dest)), Anim::Facepalm, true, "Fleeing (politely)".into()) }) }
                _ => None,
            };
            if let Some(np) = new_plan {
                if np.prio >= a.plan.prio || t >= a.plan.until || a.plan.prio < Prio::Event {
                    if matches!(np.act, Act::React { .. } | Act::Queue { .. }) { joiners.push(e); }
                    set_plan(&mut a, &mut mv, &grid, np, t);
                }
            }
            if ev.id == "overtime-protocol" && a.plan.act == Act::Nap { a.plan.until = t; a.needs.energy = (a.needs.energy + 0.2).min(1.0); }
        }
        bus.active.push(Active { serial, def: di, id: ev.id.clone(), pos, radius, until, joiners, subject, team, knowers: in_range, room: f.room });
    }
}


fn expire(clock: Res<Clock>, mut bus: ResMut<Bus>, mut machines: ResMut<Machines>, mut q: Query<&mut Agent>, data: Res<Data>, time: Res<Time>) {
    let t = clock.t;
    let mut done = vec![];
    bus.active.retain(|a| { if t >= a.until { done.push(a.clone()); false } else { true } });
    for a in done {
        for e in a.joiners { if let Ok(mut ag) = q.get_mut(e) { if matches!(ag.plan.act, Act::React { serial } if serial == a.serial) || matches!(&ag.plan.act, Act::Queue { .. }) { ag.plan.until = t; ag.plan.prio = Prio::Idle; } } }
        match a.id.as_str() { "prod-down" | "friday-deploy" | "funding-round" => if machines.screen != "prodDown" || a.id == "prod-down" { machines.screen.clear(); }, _ => {} }
    }
    // output multiplier = product over active events
    let mut m = 1.0;
    for a in &bus.active { if let Some(o) = data.0.events[a.def].effects.output { m *= o; } }
    machines.output_mult = m;
    let dt = time.delta_secs();
    machines.flicker = (machines.flicker - dt * 0.8).max(0.0);
    if machines.fish > 0.0 { machines.fish = (machines.fish - clock.dt_min).max(0.0); }
    if machines.alarm > 0.0 { machines.alarm = (machines.alarm - clock.dt_min).max(0.0); }
}

/// News ripples: carriers walk to people who haven't heard, tell them, the listener replies, and
/// gossipy listeners pass it on. Also passive: carriers passing someone in a corridor whisper it.
fn gossip(data: Res<Data>, clock: Res<Clock>, grid: Res<Grid>, mut bus: ResMut<Bus>, mut rng: ResMut<SimRng>, mut q: Query<(Entity, &mut Agent, &mut Mover)>, delayed: ResMut<DelayedSay>, mut memo: ResMut<Memo>) {
    let delayed = delayed.into_inner();
    if clock.paused { return; }
    let t = clock.t;
    let snap: Vec<(Entity, Vec2, Vec<u32>, bool)> = q.iter().map(|(e, a, m)| (e, m.pos, a.knows.clone(), a.role == Role::Staff && !a.plan.act.absent() && !matches!(a.plan.act, Act::Nap | Act::Meeting { .. }))).collect();
    let mut learned: Vec<(Entity, u32, Entity)> = vec![];
    for (e, mut a, mut mv) in &mut q {
        let Act::Gossip { serial, target } = a.plan.act.clone() else { continue };
        if bus.find(serial).is_none() && t > a.plan.until { continue; }
        // pick / refresh target: nearest person who doesn't know
        let tgt_ok = target != e && snap.iter().any(|s| s.0 == target && !s.2.contains(&serial) && s.3);
        let target = if tgt_ok { target } else {
            match snap.iter().filter(|s| s.0 != e && s.3 && !s.2.contains(&serial)).min_by(|x, y| (x.1 - mv.pos).length().partial_cmp(&(y.1 - mv.pos).length()).unwrap()) {
                Some(s) if (s.1 - mv.pos).length() < 16.0 => s.0,
                _ => { a.plan.until = t; continue; }
            }
        };
        a.plan.act = Act::Gossip { serial, target };
        let Some(tp) = snap.iter().find(|s| s.0 == target).map(|s| s.1) else { continue };
        let d = (tp - mv.pos).length();
        if d < 1.4 {
            learned.push((target, serial, e));
            a.plan.act = Act::Gossip { serial, target: e }; // retarget next frame
            mv.facing = Facing::from_vec(tp - mv.pos);
            if let Some(s) = line(&data.0, &mut rng, &["gossip"]) { delayed.q.push((delayed.now, Say { who: e, text: s, secs: 2.6, prio: 1 })); }
            if rng.chance(0.35) { a.plan.until = t; }
        } else if mv.dest.map_or(true, |dd| (dd - tp).length() > 1.5) {
            let near = grid.nearest_walkable(tp.floor().as_ivec2()).as_vec2() + 0.5; let mp = mv.pos; route(&mut mv, &grid, near + (mp - near).normalize_or_zero() * 0.9);
        }
    }
    for (who, serial, from) in learned {
        if let Ok((_, mut a, mut mv)) = q.get_mut(who) {
            if a.knows.contains(&serial) { continue; }
            a.knows.push(serial);
            if let Some(ac) = bus.active.iter_mut().find(|x| x.serial == serial) {
                ac.knowers += 1;
                if ac.knowers % 8 == 0 { let name = data.0.events[ac.def].name.clone(); memo.push(&clock, MemoKind::Gossip, format!("Word of \"{}\" has now reached {} people.", clean(&name), ac.knowers)); }
            }
            if let Some(s) = line(&data.0, &mut rng, &["gossip_reply", "gossipReply"]) { delayed.q.push((delayed.now + 0.9, Say { who, text: s, secs: 2.4, prio: 1 })); }
            delayed.q_emote.push((delayed.now + 0.5, Emote { who, icon: "exclaim".into() }));
            let _ = from;
            // pass it on if gossipy or chatty
            if (a.has("gossip") || a.has("chatty") || rng.chance(0.25)) && a.plan.prio < Prio::Calendar && a.plan.act != Act::Nap {
                let p = Plan { act: Act::Gossip { serial, target: who }, dest: mv.pos, face: None, until: t + 20.0, label: "Spreading the news".into(), prio: Prio::Event, anim: Anim::Talk, run: false, look_at: None };
                a.plan = p; a.plan_t = t; mv.arrived = true; mv.path.clear();
            }
        }
    }
}

fn flush_delayed(time: Res<Time>, delayed: ResMut<DelayedSay>, mut say: EventWriter<Say>, mut emote: EventWriter<Emote>) {
    let delayed = delayed.into_inner();
    delayed.now += time.delta_secs();
    let now = delayed.now;
    let (due, keep): (Vec<_>, Vec<_>) = delayed.q.drain(..).partition(|(t, _)| *t <= now); delayed.q = keep;
    for (_, s) in due { say.write(s); }
    let (due, keep): (Vec<_>, Vec<_>) = delayed.q_emote.drain(..).partition(|(t, _)| *t <= now); delayed.q_emote = keep;
    for (_, s) in due { emote.write(s); }
}
