//! Platform + debug: sim clock, web bridge (query string, tab-away pause, safe-area insets,
//! fullscreen, loading screen hand-off, `window.__office` state export), FPS, stuck-agent watchdog,
//! path / event gizmos (?debug=1) and the live playtest audit (elevator-only entries and exits,
//! population vs. schedule).
use crate::agents::*;
use crate::events::Bus;
use crate::presence::{Away, Crew, Shift};
use crate::roles::Elevator;
use crate::sim::*;
use crate::ui::SafeArea;
use bevy::prelude::*;
use std::collections::HashMap;

#[derive(Resource, Default)] pub struct Fps(pub f32);
#[derive(Resource, Default)]
pub struct Audit { pub seen: HashMap<Entity, bool>, pub violations: Vec<String>, pub stuck_fixed: u32, pub late: usize, pub mismatched: usize, pub expected_on: usize, pub on: usize, pub max_queue: usize, pub max_aboard: usize, pub overlaps_now: usize, pub overlap_frames: u64, pub overlap_pairs_total: u64, pub frames: u64, pub worst: String, pub late_ids: Vec<String>, pub stall: HashMap<Entity, (Vec2, f32, bool)>, pub max_stuck_min: f32, pub stuck_over2: u32, pub stuck_worst: String, pub picks_total: usize, pub picks_unique: usize, pub picks_missing: Vec<String>, pub people_total: usize, pub people_profiled: usize }
#[derive(Resource, Default)] struct WebState { away_since: Option<f64>, loader_hidden: bool, export_t: f32, frames: u32 }

pub struct DebugPlugin;
impl Plugin for DebugPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<Fps>().init_resource::<Audit>().init_resource::<WebState>()
            .add_systems(Update, clock_tick.in_set(SimSet::Clock))
            .add_systems(Update, (fps, pick_audit, web_bridge, watchdog, audit).chain().after(SimSet::Visual));
            #[cfg(feature = "debug-gizmos")]
            app.add_systems(Update, gizmos.after(audit));
    }
}

pub fn clock_tick(time: Res<Time>, mut clock: ResMut<Clock>) {
    let dt = time.delta_secs().min(0.1); // a long frame (tab away, GC) never fast-forwards the office
    clock.real += dt as f64;
    if clock.paused || web::hidden() { clock.dt_min = 0.0; return; }
    clock.dt_min = dt * SIM_MIN_PER_SEC * clock.speed;
    clock.t += clock.dt_min as f64; crate::agents::set_now(clock.t);
}

fn fps(time: Res<Time>, mut f: ResMut<Fps>) { let dt = time.delta_secs(); if dt > 0.0 { f.0 = f.0 * 0.95 + (1.0 / dt) * 0.05; } }

#[allow(clippy::too_many_arguments)]
fn web_bridge(mut st: ResMut<WebState>, mut clock: ResMut<Clock>, mut memo: ResMut<Memo>, mut safe: ResMut<SafeArea>, time: Res<Time>, el: Res<Elevator>, audit: Res<Audit>, fps: Res<Fps>, bus: Res<Bus>, bt: Res<crate::banter::BanterState>, ba: Res<crate::bubbles::BubbleAudit>,
    q: Query<(&Agent, &Pose, &Mover, Option<&Away>, Option<&Shift>)>) {
    st.frames += 1;
    if !st.loader_hidden && st.frames > 3 { st.loader_hidden = true; web::hide_loader(); }
    // tab-away: the clock does not advance while hidden; say hello when they return
    if web::hidden() { if st.away_since.is_none() { st.away_since = Some(clock.real); } }
    else if let Some(s) = st.away_since.take() { if web::away_secs().max(clock.real - s) > 3.0 { memo.push(&clock, MemoKind::System, "Welcome back. The floor waited for you."); } }
    if st.frames % 30 == 1 { let s = web::safe_area(); let n = SafeArea { top: s[0], right: s[1], bottom: s[2], left: s[3] }; if (n.top - safe.top).abs() + (n.bottom - safe.bottom).abs() + (n.left - safe.left).abs() + (n.right - safe.right).abs() > 0.5 { *safe = n; } }
    if let Some(cmd) = web::take_command() { match cmd.as_str() { "pause" => clock.paused = true, "play" => clock.paused = false, c if c.starts_with("speed:") => clock.speed = c[6..].parse().unwrap_or(1.0), c if c.starts_with("t:") => clock.t = c[2..].parse().unwrap_or(clock.t), _ => {} } }
    st.export_t += time.delta_secs();
    if st.export_t < 0.5 { return; }
    st.export_t = 0.0;
    let staff = |a: &Agent| a.pi.is_some();
    let on = q.iter().filter(|(a, p, ..)| staff(a) && !p.hidden).count();
    let total = q.iter().filter(|(a, ..)| staff(a)).count();
    let away: Vec<String> = q.iter().filter_map(|(a, _, _, w, _)| w.map(|w| format!("{}:{:?}", a.id, w.why))).collect();
    let crews = |c: Crew| q.iter().filter(|(_, p, _, _, s)| !p.hidden && s.map_or(false, |s| s.crew == c)).count();
    let people: Vec<serde_json::Value> = q.iter().filter(|(a, ..)| staff(a) || a.role == Role::Visitor).map(|(a, p, m, w, _)| serde_json::json!({ "id": a.id, "x": (m.pos.x * 10.0).round() / 10.0, "y": (m.pos.y * 10.0).round() / 10.0, "hidden": p.hidden, "dx": (a.plan.dest.x * 10.0).round() / 10.0, "dy": (a.plan.dest.y * 10.0).round() / 10.0, "arr": m.arrived, "blk": (m.blocked * 10.0).round() / 10.0, "pl": m.path.len(), "rp": m.repaths, "anim": format!("{:?}", a.plan.anim), "act": format!("{:?}", a.plan.act).split(|c| c == ' ' || c == '{' || c == '(').next().unwrap_or(""), "label": a.plan.label, "away": w.map(|w| format!("{:?}", w.why)), "back": w.map(|w| fmt_min(w.back as f32)) })).collect();
    // hidden staff already due back (in the car, or not yet queued while it is mid-cycle)
    let inbound = q.iter().filter(|(a, p, _, w, _)| staff(a) && p.hidden && w.map_or(false, |w| clock.t >= w.back)).count();
    let v = serde_json::json!({
        "t": clock.t, "day": clock.day(), "clock": clock.hhmm(), "speed": clock.speed, "paused": clock.paused, "fps": fps.0.round(),
        "on_floor": on, "staff": total, "day_crew_on": crews(Crew::Day), "night_crew_on": crews(Crew::Night), "always_on": crews(Crew::Always), "away": away.len(),
        "elevator": { "phase": format!("{:?}", el.phase), "queue": el.queue.len(), "boarding": el.boarding.len(), "aboard": el.aboard.len(), "waiting_below": el.waiting_out.len(), "inbound": inbound, "carrying": el.carrying, "arrivals": el.total_arrivals, "departures": el.total_departures, "max_queue": audit.max_queue, "max_aboard": audit.max_aboard },
        "audit": { "violations": audit.violations, "late": audit.late, "late_ids": audit.late_ids, "mismatched": audit.mismatched, "expected_on": audit.expected_on, "stuck_fixed": audit.stuck_fixed, "overlaps_now": audit.overlaps_now, "overlap_frames": audit.overlap_frames, "overlap_pairs": audit.overlap_pairs_total, "frames": audit.frames, "overlap_example": audit.worst, "max_stuck_min": audit.max_stuck_min, "stuck_over2": audit.stuck_over2, "stuck_example": audit.stuck_worst, "picks": { "total": audit.picks_total, "unique": audit.picks_unique, "missing": audit.picks_missing }, "people": { "total": audit.people_total, "profiled": audit.people_profiled } },
        "events": bus.active.iter().map(|a| a.id.clone()).collect::<Vec<_>>(), "fired": bus.history.len(), "tension": bus.tension, "banter": bt.count, "bubbles": { "overlap_frames": ba.overlap_frames, "frames": ba.frames, "max_on_screen": ba.max },
        "people": people,
    });
    web::export(&v.to_string());
}

/// stuck walkers: re-route; if still stuck, hop to the next waypoint (never across the void)
fn watchdog(time: Res<Time>, clock: Res<Clock>, grid: Res<Grid>, mut q: Query<(&mut Mover, &Pose)>, mut audit: ResMut<Audit>, mut acc: Local<f32>, mut last: Local<HashMap<Entity, (Vec2, f32)>>, ents: Query<Entity, With<Mover>>) {
    *acc += time.delta_secs();
    if *acc < 1.0 || clock.paused { return; }
    let step = *acc; *acc = 0.0;
    for e in &ents {
        let Ok((mut mv, pose)) = q.get_mut(e) else { continue };
        if mv.arrived || pose.hidden || mv.dest.is_none() { last.remove(&e); continue; }
        let ent = last.entry(e).or_insert((mv.pos, 0.0));
        if (mv.pos - ent.0).length() < 0.15 { ent.1 += step; } else { *ent = (mv.pos, 0.0); }
        if ent.1 > 6.0 {
            let d = mv.dest.unwrap();
            if ent.1 > 12.0 { route(&mut mv, &grid, d); ent.1 = 0.0; audit.stuck_fixed += 1; }
            else if (ent.1 - 6.0) < step { route(&mut mv, &grid, d); }
        }
    }
}

/// playtest audit: nobody appears or disappears except at the elevator doors; population follows the schedule
#[allow(clippy::too_many_arguments)]
fn audit(mut a: ResMut<Audit>, el: Res<Elevator>, lines: Res<Queues>, clock: Res<Clock>, q: Query<(Entity, &Agent, &Mover, &Pose, Option<&Away>, Option<&Shift>)>, mut acc: Local<f32>, time: Res<Time>) {
    // collision check: pairs of visible people/pets closer than half a tile, every frame
    let vis: Vec<(Entity, Vec2, &str)> = q.iter().filter(|(_, ag, _, p, _, _)| !p.hidden && !matches!(ag.plan.act, Act::Hidden | Act::Gone)).map(|(e, ag, m, _, _, _)| (e, m.pos, ag.id.as_str())).collect();
    let mut n = 0;
    for i in 0..vis.len() { for j in i + 1..vis.len() { let d = (vis[i].1 - vis[j].1).length(); if d < 0.5 { n += 1; if a.worst.is_empty() || a.overlap_pairs_total < 5 { a.worst = format!("{} {}/{} d={:.2} at ({:.1},{:.1})", fmt_min(clock.mod_min()), vis[i].2, vis[j].2, d, vis[i].1.x, vis[i].1.y); warn!("PLAYTEST overlap: {}", a.worst); } } } }
    // stuck check in sim minutes: a walker with somewhere to go that hasn't moved 0.15 tiles
    let dtm = clock.dt_min;
    if dtm > 0.0 {
        let walkers: Vec<(Entity, Vec2, String, bool)> = q.iter().map(|(e, ag, m, p, _, _)| (e, m.pos, format!("{} [{}]", ag.id, ag.plan.label), !p.hidden && !m.arrived && m.dest.is_some() && !matches!(ag.plan.act, Act::Hidden | Act::Gone))).collect();
        for (e, pos, id, walking) in walkers {
            // standing in a line (elevator, coffee, microwave...) is waiting, not stuck
            let queued = el.queue.contains(&e) || el.boarding.contains(&e) || el.waiting_out.contains(&e) || lines.lines.values().any(|l| l.contains(&e));
            if !walking || queued { a.stall.remove(&e); continue; }
            let now = fmt_min(clock.mod_min());
            let st = a.stall.entry(e).or_insert((pos, 0.0, false));
            if (pos - st.0).length() > 0.15 { *st = (pos, 0.0, false); continue; }
            st.1 += dtm; let m = st.1;
            if m > 2.0 && !st.2 { st.2 = true; a.stuck_over2 += 1; warn!("PLAYTEST stuck: {} {} at ({:.1},{:.1})", now, id, pos.x, pos.y); }
            if m > a.max_stuck_min { a.max_stuck_min = m; a.stuck_worst = format!("{} {} {:.1}min at ({:.1},{:.1})", now, id, m, pos.x, pos.y); }
        }
    }
    a.frames += 1; a.overlaps_now = n; if n > 0 { a.overlap_frames += 1; a.overlap_pairs_total += n as u64; }
    a.max_queue = a.max_queue.max(el.queue.len());
    a.max_aboard = a.max_aboard.max(el.aboard.len());
    for (e, ag, mv, pose, _, _) in &q {
        if matches!(ag.role, Role::Goat | Role::Dog) { continue; }
        let vis = !pose.hidden;
        if let Some(prev) = a.seen.insert(e, vis) {
            if prev != vis && (mv.pos - el.door).length() > 1.5 { // the car is 2 tiles wide: the threshold counts
                let msg = format!("{} {} at ({:.1},{:.1}) {} - not at the elevator", fmt_min(clock.mod_min()), ag.id, mv.pos.x, mv.pos.y, if vis { "appeared" } else { "vanished" });
                if a.violations.len() < 50 { warn!("PLAYTEST: {msg}"); a.violations.push(msg); }
            }
        }
    }
    *acc += time.delta_secs();
    if *acc < 1.0 { return; }
    *acc = 0.0;
    let t = clock.t;
    let (mut late, mut mism, mut exp, mut on) = (0, 0, 0, 0);
    for (_, ag, _, pose, away, shift) in &q {
        let Some(sh) = shift else { continue };
        let _ = ag;
        let should_be_away = away.map_or(false, |w| t < w.back) || sh.current.as_ref().map_or(false, |c| t >= c.leave + 90.0);
        if !should_be_away { exp += 1; }
        if !pose.hidden { on += 1; }
        if let Some(w) = away { if t > w.back + 120.0 { late += 1; if a.late_ids.len() < 20 { let s = format!("{} {} back {} act {:?} arrive_at {:?} q {}", fmt_min(clock.mod_min()), ag.id, fmt_min((w.back % 1440.0) as f32), ag.plan.act, ag.arrive_at.map(|x| fmt_min((x % 1440.0) as f32)), el.waiting_out.len()); if !a.late_ids.iter().any(|x| x.contains(&format!(" {} ", ag.id))) { a.late_ids.push(s); } } } }
        if pose.hidden && away.is_none() && !ag.plan.act.absent() { mism += 1; }
    }
    a.late = late; a.mismatched = mism; a.expected_on = exp; a.on = on;
}

#[cfg(feature = "debug-gizmos")]
fn gizmos(params: Res<Params>, mut g: Gizmos, q: Query<(&Mover, &Pose)>, bus: Res<Bus>, el: Res<Elevator>) {
    if !params.debug { return; }
    for (m, p) in &q {
        if p.hidden || m.debug_path.len() < 2 { continue; }
        for w in m.debug_path.windows(2) { g.line_2d(tile_to_world(w[0]), tile_to_world(w[1]), Color::srgba(0.2, 0.6, 0.9, 0.5)); }
    }
    for a in &bus.active { if let (Some(p), Some(r)) = (a.pos, a.radius) { g.circle_2d(tile_to_world(p), r * TILE, Color::srgba(0.95, 0.5, 0.2, 0.6)); } }
    for s in &el.slots { g.rect_2d(tile_to_world(*s), Vec2::splat(TILE * 0.6), Color::srgba(0.2, 0.8, 0.4, 0.5)); }
}

#[cfg(target_arch = "wasm32")]
pub mod web {
    use wasm_bindgen::prelude::*;
    #[wasm_bindgen(inline_js = r#"
let away0 = null, awaySecs = 0;
document.addEventListener('visibilitychange', () => { if (document.hidden) away0 = performance.now(); else if (away0 !== null) { awaySecs = (performance.now() - away0) / 1000; away0 = null; } });
export function js_report_error(s) { console.error('[office] ' + s); window.__officeError = s; }
export function js_query() { return location.search || ''; }
export function js_hidden() { return !!document.hidden; }
export function js_away_secs() { const s = awaySecs; awaySecs = 0; return s; }
export function js_hide_loader() { if (window.__hideLoader) window.__hideLoader(); }
export function js_export(s) { try { window.__office = JSON.parse(s); } catch (e) {} }
export function js_take_command() { const c = window.__officeCmd || ''; window.__officeCmd = ''; return c; }
export function js_safe_area() {
  let p = document.getElementById('__safe');
  if (!p) { p = document.createElement('div'); p.id = '__safe'; p.style.cssText = 'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'; document.body.appendChild(p); }
  const cs = getComputedStyle(p); return [parseFloat(cs.paddingTop)||0, parseFloat(cs.paddingRight)||0, parseFloat(cs.paddingBottom)||0, parseFloat(cs.paddingLeft)||0];
}
export function js_toggle_fullscreen() {
  const d = document, el = d.documentElement;
  const fs = d.fullscreenElement || d.webkitFullscreenElement;
  try {
    if (fs) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); }
    else if (el.requestFullscreen) { el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); }
    else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
  } catch (e) {}
}
export function js_is_fullscreen() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
"#)]
    extern "C" {
        fn js_report_error(s: &str); fn js_query() -> String; fn js_hidden() -> bool; fn js_away_secs() -> f64; fn js_hide_loader(); fn js_export(s: &str); fn js_take_command() -> String;
        fn js_safe_area() -> Vec<f32>; fn js_toggle_fullscreen(); fn js_is_fullscreen() -> bool;
    }
    pub fn query() -> String { js_query() }
    pub fn report_error(s: &str) { js_report_error(s) }
    pub fn hidden() -> bool { js_hidden() }
    pub fn away_secs() -> f64 { js_away_secs() }
    pub fn hide_loader() { js_hide_loader() }
    pub fn export(s: &str) { js_export(s) }
    pub fn take_command() -> Option<String> { let c = js_take_command(); if c.is_empty() { None } else { Some(c) } }
    pub fn safe_area() -> [f32; 4] { let v = js_safe_area(); [v.first().copied().unwrap_or(0.0), v.get(1).copied().unwrap_or(0.0), v.get(2).copied().unwrap_or(0.0), v.get(3).copied().unwrap_or(0.0)] }
    pub fn toggle_fullscreen() { js_toggle_fullscreen() }
    pub fn is_fullscreen() -> bool { js_is_fullscreen() }
}
#[cfg(not(target_arch = "wasm32"))]
pub mod web {
    pub fn query() -> String { std::env::args().nth(1).unwrap_or_default() }
    pub fn report_error(s: &str) { eprintln!("{s}"); }
    pub fn hidden() -> bool { false }
    pub fn away_secs() -> f64 { 0.0 }
    pub fn hide_loader() {}
    pub fn export(_s: &str) {}
    pub fn take_command() -> Option<String> { None }
    pub fn safe_area() -> [f32; 4] { [0.0; 4] }
    pub fn toggle_fullscreen() {}
    pub fn is_fullscreen() -> bool { false }
}

/// every clickable object must resolve to a catalog description (not the generic fallback); every person to a profile
fn pick_audit(mut a: ResMut<Audit>, data: Res<crate::data::Data>, picks: Query<&crate::ui::Pick>, people: Query<&Agent>, time: Res<Time>, mut acc: Local<f32>) {
    *acc -= time.delta_secs();
    if *acc > 0.0 { return; }
    *acc = 3.0;
    let mut keys: Vec<String> = picks.iter().map(|p| p.key.clone()).collect();
    a.picks_total = keys.len();
    keys.sort(); keys.dedup();
    a.picks_unique = keys.len();
    a.picks_missing = keys.into_iter().filter(|k| crate::ui::describe(&data.0, k).1 == crate::ui::fallback_desc(k)).collect();
    a.people_total = people.iter().count();
    a.people_profiled = people.iter().filter(|g| g.pi.is_some() || matches!(g.role, Role::Goat | Role::Dog | Role::Visitor)).count();
}
