//! Core shared sim resources: clock, RNG, URL params, nav grid + A*, memo feed, text helpers.
use crate::data::*;
use bevy::prelude::*;
use rand::{rngs::SmallRng, Rng, SeedableRng};
use std::collections::{HashMap, VecDeque};

pub const TILE: f32 = 16.0;
pub const MARGIN: i32 = 40; // void margin around the layout that the nav grid covers

pub fn tile_to_world(t: Vec2) -> Vec2 { Vec2::new(t.x * TILE, -t.y * TILE) }
pub fn world_to_tile(w: Vec2) -> Vec2 { Vec2::new(w.x / TILE, -w.y / TILE) }
pub fn ysort_z(feet_y: f32) -> f32 { 50.0 + feet_y * 0.05 }

// ------------------------------------------------------------------ params
#[derive(Resource, Clone, Debug)]
pub struct Params { pub seed: u64, pub start_min: Option<f32>, pub day: usize, pub speed: f32, pub fire: Vec<(String, f32)>, pub select: Option<String>, pub follow: bool, pub zoom: Option<f32>, pub cam: Option<Vec2>, pub debug: bool, pub ui: bool, pub autoplay: bool }
impl Params {
    pub fn from_query(q: &str) -> Params {
        let mut p = Params { seed: 1977, start_min: None, day: 0, speed: 1.0, fire: vec![], select: None, follow: false, zoom: None, cam: None, debug: false, ui: true, autoplay: false };
        for kv in q.trim_start_matches('?').split('&') {
            let mut it = kv.splitn(2, '='); let k = it.next().unwrap_or(""); let v = pct_decode(it.next().unwrap_or(""));
            match k {
                "seed" => p.seed = v.parse().unwrap_or(1977),
                "t" => p.start_min = Some(to_min(&v)),
                "day" => p.day = v.parse().unwrap_or(0),
                "speed" => p.speed = v.parse().unwrap_or(1.0),
                // fire=donuts@3,prodDown@20  (real seconds after start)
                "fire" => for e in v.split(',') { let mut s = e.splitn(2, '@'); let id = s.next().unwrap_or("").to_string(); let at = s.next().and_then(|x| x.parse().ok()).unwrap_or(2.0); if !id.is_empty() { p.fire.push((id, at)); } },
                "select" => p.select = Some(v.to_string()),
                "follow" => p.follow = v != "0",
                "zoom" => p.zoom = v.parse().ok(),
                "cam" => { let n: Vec<f32> = v.split(',').filter_map(|x| x.parse().ok()).collect(); if n.len() == 2 { p.cam = Some(Vec2::new(n[0], n[1])); } }
                "debug" => p.debug = v != "0",
                "ui" => p.ui = v != "0",
                "autoplay" => p.autoplay = v != "0",
                _ => {}
            }
        }
        p
    }
}

/// minimal %XX / '+' decoding (the page's seed script re-serialises the query with URLSearchParams)
fn pct_decode(s: &str) -> String {
    let b = s.as_bytes(); let mut out = Vec::with_capacity(b.len()); let mut i = 0;
    while i < b.len() {
        if b[i] == b'%' && i + 2 < b.len() { if let Some(x) = std::str::from_utf8(&b[i + 1..i + 3]).ok().and_then(|h| u8::from_str_radix(h, 16).ok()) { out.push(x); i += 3; continue; } }
        out.push(if b[i] == b'+' { b' ' } else { b[i] }); i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

// ------------------------------------------------------------------ clock
#[derive(Resource)]
pub struct Clock { pub t: f64, pub speed: f32, pub paused: bool, pub dt_min: f32, pub start_day: usize, pub real: f64 }
pub const SIM_MIN_PER_SEC: f32 = 2.0; // 1x: 1 real second = 2 sim minutes
impl Clock {
    pub fn day(&self) -> usize { (self.t / 1440.0).floor() as usize }
    pub fn weekday(&self) -> usize { (self.start_day + self.day()) % 7 }
    pub fn mod_min(&self) -> f32 { (self.t % 1440.0) as f32 }
    pub fn hhmm(&self) -> String { let m = self.mod_min() as i32; format!("{:02}:{:02}", m / 60, m % 60) }
    /// 0 = full day, 1 = deep night
    pub fn night(&self) -> f32 {
        let h = self.mod_min() / 60.0;
        let s = |a: f32, b: f32, x: f32| ((x - a) / (b - a)).clamp(0.0, 1.0);
        let up = s(18.0, 22.0, h); let down = 1.0 - s(5.0, 8.0, h);
        let v = if h >= 12.0 { up } else { down };
        v * v * (3.0 - 2.0 * v)
    }
}
pub fn fmt_min(m: f32) -> String { let m = (m.rem_euclid(1440.0)) as i32; format!("{:02}:{:02}", m / 60, m % 60) }

#[derive(Resource)]
pub struct SimRng(pub SmallRng);
impl SimRng {
    pub fn new(seed: u64) -> Self { SimRng(SmallRng::seed_from_u64(seed)) }
    pub fn f(&mut self) -> f32 { self.0.gen::<f32>() }
    pub fn range(&mut self, a: f32, b: f32) -> f32 { a + (b - a) * self.f() }
    pub fn idx(&mut self, n: usize) -> usize { if n == 0 { 0 } else { self.0.gen_range(0..n) } }
    pub fn chance(&mut self, p: f32) -> bool { self.f() < p }
    pub fn pick<'a, T>(&mut self, v: &'a [T]) -> Option<&'a T> { if v.is_empty() { None } else { Some(&v[self.idx(v.len())]) } }
}

// ------------------------------------------------------------------ nav grid
#[derive(Resource, Clone)]
pub struct Grid { pub x0: i32, pub y0: i32, pub w: i32, pub h: i32, pub blocked: Vec<bool>, pub soft: Vec<bool>, pub lw: i32, pub lh: i32 }
impl Grid {
    pub fn from_layout(l: &Layout, furniture: &[Furniture]) -> Grid {
        let (lw, lh) = (l.w.max(32), l.h.max(24));
        let (x0, y0) = (-MARGIN, -MARGIN);
        let (w, h) = (lw + MARGIN * 2, lh + MARGIN * 2);
        let mut g = Grid { x0, y0, w, h, blocked: vec![false; (w * h) as usize], soft: vec![false; (w * h) as usize], lw, lh };
        if !l.blocked.is_empty() {
            for (y, row) in l.blocked.iter().enumerate() { for (x, ch) in row.chars().enumerate() { if ch == '#' { g.set(x as i32, y as i32, true); } } }
        }
        for f in furniture { if !f.solid && (f.kind.contains("chair") || f.kind == "stool" || f.kind == "beanbag") { if let Some(i) = g.idx(f.x, f.y) { g.soft[i] = true; } } }
        for f in furniture { if f.solid { for j in f.y..f.y + f.h.max(1) { for i in f.x..f.x + f.w.max(1) { g.set(i, j, true); } } } }
        let e = &l.elevator.rect; for j in e.y..e.y + e.h { for i in e.x..e.x + e.w { g.set(i, j, true); } }
        g
    }
    fn idx(&self, x: i32, y: i32) -> Option<usize> { let (i, j) = (x - self.x0, y - self.y0); if i < 0 || j < 0 || i >= self.w || j >= self.h { None } else { Some((j * self.w + i) as usize) } }
    pub fn set(&mut self, x: i32, y: i32, b: bool) { if let Some(i) = self.idx(x, y) { self.blocked[i] = b; } }
    pub fn is_soft(&self, x: i32, y: i32) -> bool { self.idx(x, y).map_or(false, |i| self.soft[i]) }
    pub fn walkable(&self, x: i32, y: i32) -> bool { self.idx(x, y).map_or(false, |i| !self.blocked[i]) }
    pub fn nearest_walkable(&self, p: IVec2) -> IVec2 {
        if self.walkable(p.x, p.y) { return p; }
        for r in 1i32..12 { for dy in -r..=r { for dx in -r..=r { if dx.abs() != r && dy.abs() != r { continue; } let q = p + IVec2::new(dx, dy); if self.walkable(q.x, q.y) { return q; } } } }
        p
    }
    /// A* (8-dir, no corner cutting). `allow_end`: the goal tile may be blocked (e.g. a seat on furniture).
    pub fn path(&self, from: IVec2, to: IVec2) -> Option<Vec<IVec2>> {
        let start = self.nearest_walkable(from);
        let goal_ok = self.walkable(to.x, to.y);
        let goal = if goal_ok { to } else { self.nearest_walkable(to) };
        let res = pathfinding::prelude::astar(
            &start,
            |p| {
                let p = *p; let mut v = Vec::with_capacity(8);
                for (dx, dy) in [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)] {
                    let q = IVec2::new(p.x + dx, p.y + dy);
                    if !self.walkable(q.x, q.y) { continue; }
                    if dx != 0 && dy != 0 && (!self.walkable(p.x + dx, p.y) || !self.walkable(p.x, p.y + dy)) { continue; }
                    let base = if dx != 0 && dy != 0 { 14 } else { 10 }; let soft = self.idx(q.x, q.y).map_or(false, |i| self.soft[i]); v.push((q, if soft && q != goal { base * 4 } else { base }));
                }
                v
            },
            |p| { let d = (*p - goal).abs(); (d.x.max(d.y) * 10 + d.x.min(d.y) * 4) as u32 },
            |p| *p == goal,
        );
        res.map(|(mut v, _)| { if !goal_ok && to != goal { v.push(to); } v })
    }
}

/// Smooth a tile path into waypoints (tile centres), removing collinear points.
pub fn waypoints(path: &[IVec2], dest: Vec2) -> VecDeque<Vec2> {
    let mut out: VecDeque<Vec2> = VecDeque::new();
    if path.len() <= 1 { out.push_back(dest); return out; }
    let mut prev_dir = IVec2::ZERO;
    for i in 1..path.len() {
        let d = path[i] - path[i - 1];
        if d != prev_dir && i > 1 { out.push_back(path[i - 1].as_vec2() + 0.5); }
        prev_dir = d;
    }
    out.push_back(dest);
    out
}

// ------------------------------------------------------------------ memo feed
#[derive(Clone)]
pub struct MemoLine { pub time: String, pub text: String, pub kind: MemoKind, pub age: f32 }
#[derive(Clone, Copy, PartialEq)]
pub enum MemoKind { Event, Meeting, People, System, Gossip }
#[derive(Resource, Default)]
pub struct Memo { pub lines: VecDeque<MemoLine>, pub total: usize }
impl Memo {
    pub fn push(&mut self, clock: &Clock, kind: MemoKind, text: impl Into<String>) {
        let text = clean(&text.into());
        if self.lines.front().map_or(false, |l| l.text == text) { return; }
        self.lines.push_front(MemoLine { time: clock.hhmm(), text, kind, age: 0.0 });
        self.total += 1;
        while self.lines.len() > 40 { self.lines.pop_back(); }
    }
}

/// Map typographic characters to what the pixel fonts can render and drop emoji.
pub fn clean(s: &str) -> String {
    let mut o = String::with_capacity(s.len());
    for ch in s.chars() {
        match ch {
            '\u{2018}' | '\u{2019}' | '\u{02BC}' => o.push('\''),
            '\u{201C}' | '\u{201D}' => o.push('"'),
            '\u{2014}' | '\u{2013}' => o.push('-'),
            '\u{2026}' => o.push_str("..."),
            '\u{00D7}' => o.push('x'),
            '\u{2192}' => o.push_str("->"),
            c if (c as u32) < 0x250 => o.push(c),
            _ => {}
        }
    }
    let t = o.trim().replace("  ", " ");
    t
}

pub fn fill_template(t: &str, vars: &HashMap<&str, String>) -> String {
    let mut s = t.to_string();
    for (k, v) in vars { s = s.replace(&format!("{{{}}}", k), v); }
    // unknown placeholders -> generic
    while let (Some(a), Some(b)) = (s.find('{'), s.find('}')) { if b > a { s.replace_range(a..=b, "someone"); } else { break; } }
    s
}

pub fn ease_out_back(t: f32) -> f32 { let c1 = 1.70158; let c3 = c1 + 1.0; let t = t.clamp(0.0, 1.0); 1.0 + c3 * (t - 1.0).powi(3) + c1 * (t - 1.0).powi(2) }
pub fn ease_out_cubic(t: f32) -> f32 { 1.0 - (1.0 - t.clamp(0.0, 1.0)).powi(3) }
pub fn ease_in_out(t: f32) -> f32 { let t = t.clamp(0.0, 1.0); t * t * (3.0 - 2.0 * t) }
