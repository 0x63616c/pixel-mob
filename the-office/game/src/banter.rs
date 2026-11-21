//! Scripted multi-speaker exchanges from `lines.banter`, plus founder memos.
//! A banter only starts when every speaker is on the floor, free, close together and not already
//! talking; lines are queued back-to-back using the real bubble lifetime so they never overlap.
use crate::agents::*;
use crate::data::*;
use crate::events::DelayedSay;
use crate::sim::*;
use bevy::prelude::*;
use std::collections::HashMap;

#[derive(Resource, Default)]
pub struct BanterState { pub next: f64, pub last: HashMap<String, f64>, pub until: HashMap<Entity, f32>, pub count: u32, pub next_memo: f64, pub memo_i: usize }

pub struct BanterPlugin;
impl Plugin for BanterPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<BanterState>().add_systems(Update, (banter, founder_memos, ambient_voice).after(SimSet::Events).before(SimSet::Visual));
    }
}

fn free(a: &Agent) -> bool {
    a.role == Role::Staff && !a.plan.act.absent() && !matches!(a.plan.act, Act::Nap | Act::Meeting { .. } | Act::Gossip { .. })
}

#[allow(clippy::type_complexity)]
fn banter(data: Res<Data>, clock: Res<Clock>, mut st: ResMut<BanterState>, mut rng: ResMut<SimRng>, delayed: ResMut<DelayedSay>,
          mut q: Query<(Entity, &mut Agent, &mut Mover)>, bubbles: Query<&crate::bubbles::Bubble>) {
    let delayed = delayed.into_inner();
    let d = &data.0;
    let now = delayed.now;
    st.until.retain(|_, u| *u > now);
    if clock.paused || d.lines.banter.is_empty() || clock.t < st.next { return; }
    st.next = clock.t + rng.range(5.0, 12.0) as f64;
    let talking: Vec<Entity> = bubbles.iter().map(|b| b.owner).collect();
    let pos: HashMap<String, (Entity, Vec2)> = q.iter().filter(|(e, a, _)| free(a) && !talking.contains(e) && !st.until.contains_key(e)).map(|(e, a, m)| (a.id.clone(), (e, m.pos))).collect();
    let global = d.lines.anti_repeat.by_key.get("banter").copied().unwrap_or(180.0);
    let mut order: Vec<usize> = (0..d.lines.banter.len()).collect();
    for i in (1..order.len()).rev() { let j = rng.idx(i + 1); order.swap(i, j); }
    for bi in order {
        let b = &d.lines.banter[bi];
        if b.lines.is_empty() || b.speakers.is_empty() { continue; }
        let cd = (b.cooldown.max(global) * SIM_MIN_PER_SEC) as f64;
        if st.last.get(&b.id).map_or(false, |t| clock.t - t < cd) { continue; }
        let Some(cast) = b.speakers.iter().map(|s| pos.get(s).copied()).collect::<Option<Vec<_>>>() else { continue };
        let c = cast.iter().fold(Vec2::ZERO, |acc, x| acc + x.1) / cast.len() as f32;
        if cast.iter().any(|x| (x.1 - c).length() > 4.5) { continue; }
        // go: face the group, queue lines back-to-back
        let mut at = now + 0.3;
        for l in &b.lines {
            let Some(i) = b.speakers.iter().position(|s| s == &l.speaker) else { continue };
            let who = cast[i].0;
            let text = clean(&l.text);
            let secs = 3.0;
            delayed.q.push((at, Say { who, text: text.clone(), secs, prio: 3 }));
            mark_said(&text);
            at += crate::bubbles::bubble_life(&text, secs, clock.speed) + 0.35;
        }
        for (e, p) in &cast {
            st.until.insert(*e, at);
            if let Ok((_, mut a, mut mv)) = q.get_mut(*e) {
                if let Some(o) = cast.iter().find(|x| x.0 != *e) { if mv.arrived { mv.facing = Facing::from_vec(o.1 - *p); } }
                if mv.arrived && a.react_anim.is_none() { a.react_anim = Some((Anim::Talk, (at - now).min(6.0))); }
            }
        }
        st.last.insert(b.id.clone(), clock.t);
        st.count += 1;
        return;
    }
}

fn founder_memos(data: Res<Data>, clock: Res<Clock>, mut st: ResMut<BanterState>, mut rng: ResMut<SimRng>, mut memo: ResMut<Memo>) {
    let d = &data.0;
    if clock.paused || d.lines.founder_memos.is_empty() { return; }
    if st.next_memo == 0.0 { st.next_memo = clock.t + rng.range(40.0, 120.0) as f64; st.memo_i = rng.idx(d.lines.founder_memos.len()); return; }
    if clock.t < st.next_memo { return; }
    st.next_memo = clock.t + rng.range(150.0, 300.0) as f64;
    // walk the list from a random start so memos don't repeat until all have been read
    let m = &d.lines.founder_memos[st.memo_i % d.lines.founder_memos.len()];
    st.memo_i += 1;
    let body = m.lines.iter().map(|l| clean(l)).collect::<Vec<_>>().join(" ");
    memo.push(&clock, MemoKind::System, format!("{}: {}", clean(&m.title), body));
}

/// mood word for the `mood:*` banks, from needs (matches the inspector's mood bar)
pub fn mood_word(a: &Agent, night: bool) -> &'static str {
    let n = &a.needs;
    if n.stress > 0.72 { "stressed" } else if n.energy < 0.22 { "tired" } else if n.stress > 0.55 { "anxious" } else if n.focus > 0.78 { "focused" }
    else if n.social < 0.22 { "lonely" } else if n.energy > 0.85 && a.has("caffeinated") { "wired" } else if n.focus < 0.3 { "bored" }
    else if night { "calm" } else if a.has("devout") { "grateful" } else if n.stress < 0.3 { "happy" } else { "calm" }
}

/// Ambient voice: people mutter their own lines (`person:<id>`), their team's, their role's, the hour's,
/// their mood's and their energy's - 3,000+ lines with lines.anti_repeat honoured by `line()`.
/// Paced in real time and biased to whoever is on screen, so the view always has a little life in it
/// without ever flooding (max ~5 bubbles at once, nobody talks over themselves).
#[allow(clippy::too_many_arguments)]
fn ambient_voice(data: Res<Data>, clock: Res<Clock>, time: Res<Time>, mut rng: ResMut<SimRng>, mut say: EventWriter<Say>, ctl: Option<Res<crate::ui::CamCtl>>, win: Query<&Window>,
    q: Query<(Entity, &Agent, &Mover, &Pose), Without<crate::render::Speaking>>, talking: Query<(), With<crate::render::Speaking>>, mut next: Local<f32>, st: Res<BanterState>) {
    if clock.paused { return; }
    *next -= time.delta_secs();
    if *next > 0.0 { return; }
    *next = rng.range(0.9, 2.2);
    if talking.iter().count() >= 5 { return; }
    let d = &data.0;
    let view = win.single().map(|w| Vec2::new(w.width(), w.height())).unwrap_or(Vec2::new(1280.0, 800.0));
    let (cpos, z) = ctl.map(|c| (c.pos, c.zoom.max(1.0))).unwrap_or((Vec2::ZERO, 1.0));
    let half = view / z * 0.5 / TILE;
    let ct = Vec2::new(cpos.x / TILE, -cpos.y / TILE);
    let cands: Vec<(Entity, &Agent, bool)> = q.iter().filter(|(e, a, m, p)| !p.hidden && m.arrived && !a.plan.act.absent() && !matches!(a.plan.act, Act::Nap) && !st.until.contains_key(e) && !matches!(a.role, Role::Goat | Role::Dog))
        .map(|(e, a, m, _)| (e, a, (m.pos.x - ct.x).abs() < half.x * 0.9 && (m.pos.y - ct.y).abs() < half.y * 0.85)).collect();
    if cands.is_empty() { return; }
    let on_screen: Vec<&(Entity, &Agent, bool)> = cands.iter().filter(|c| c.2).collect();
    let pick = if !on_screen.is_empty() && rng.chance(0.85) { on_screen[rng.idx(on_screen.len())] } else { &cands[rng.idx(cands.len())] };
    let (e, a, _) = (pick.0, pick.1, pick.2);
    let h = clock.mod_min() / 60.0;
    let tkey = if h < 3.0 || h >= 22.0 { "time:night" } else if h < 5.0 { "time:3am" } else if h < 7.0 { "time:dawn" } else if h < 11.0 { "time:morning" } else if h < 14.0 { "time:lunch" } else if h < 18.0 { "time:afternoon" } else { "time:evening" };
    let role = match a.role { Role::Facilities => "role:cleaner", Role::Supervisor => "role:security", Role::Receptionist => "role:receptionist", Role::Visitor => "role:visitor",
        _ => if a.team == "exec" { "role:executive" } else if a.org == "eng" { "role:engineer" } else { "role:staff" } };
    let pk = format!("person:{}", a.id); let tk = format!("team:{}", a.team);
    let mk = format!("mood:{}", mood_word(a, clock.night() > 0.5));
    let ek = if a.needs.energy > 0.7 { "energy:high" } else if a.needs.energy < 0.35 { "energy:low" } else { "energy:medium" };
    let r = rng.f();
    let first: &str = if r < 0.42 { &pk } else if r < 0.55 { &tk } else if r < 0.64 { role } else if r < 0.78 { tkey } else if r < 0.91 { &mk } else { ek };
    if let Some(s) = line(d, &mut rng, &[first, &pk, tkey]) { say.write(Say { who: e, text: s, secs: 2.8, prio: 0 }); }
}
