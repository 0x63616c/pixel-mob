//! World & layout: builds the static white-void office from data + the ART atlas (carpet islands,
//! desk pods, CRTs, belongings, chairs, meeting tables + dashed outlines, floating signage, void oddities).
use crate::art::{self, *};
use crate::atlas::*;
use crate::data::*;
use crate::sim::*;
use bevy::prelude::*;
use bevy::sprite::Anchor;
use bevy::text::FontSmoothing;
use std::collections::HashMap;

pub struct WorldPlugin;
impl Plugin for WorldPlugin {
    fn build(&self, app: &mut App) { app.add_systems(Startup, (load_atlas, build_world).chain().in_set(StartupSet::World)); }
}

#[derive(SystemSet, Debug, Clone, PartialEq, Eq, Hash)]
pub enum StartupSet { World, Agents, Ui }

#[derive(Component)]
pub struct Lit;
#[derive(Component)]
pub struct LitBase(pub Color);
#[derive(Component)]
pub struct Glow { pub base_alpha: f32, pub phase: f32 }
#[derive(Component)]
pub struct NapPod { pub at: Vec2 }
/// NB glow sprites use alpha > 1 on purpose: the round-2 light art peaks at ~0.47 alpha (it was drawn for additive
/// blending); scaling the sprite alpha restores its intensity while keeping the falloff.
/// all-hands seating: only materialises when the hall is in use (or someone sits there)
#[derive(Component)]
pub struct GhostSeat { pub room: usize, pub at: Vec2 }
#[derive(Component)]
pub struct DeskLamp { pub desk: usize, pub on: bool }
#[derive(Component)]
pub struct RoomSign { pub room: usize }
/// floating signboard: hidden by default, pops in on hover / zoom (fx.rs)
#[derive(Component)]
pub struct Sign { pub room: Option<usize>, pub slogan: bool, pub half: Vec2, pub shadow: Option<Entity>, pub shown: f32, pub culled: bool }
#[derive(Component)]
pub struct Bob { pub amp: f32, pub speed: f32, pub base_y: f32, pub phase: f32 }
#[derive(Component)]
pub struct QuotaBar { pub team: Vec<String>, pub width: f32 }
#[derive(Component)]
pub struct Animated { pub prop: String, pub fps: f32, pub frames: Vec<usize>, pub t: f32, pub state: &'static str }
#[derive(Component)]
pub struct MachineSprite(pub &'static str);
#[derive(Component)]
pub struct ElevatorSprite;

#[derive(Resource, Default)]
pub struct Fonts { pub ui: Handle<Font>, pub px: Handle<Font> }

#[derive(Resource, Default)]
pub struct WorldIndex {
    pub desk_by_id: HashMap<String, usize>,
    pub room_by_id: HashMap<String, usize>,
    pub person_by_id: HashMap<String, usize>,
    pub team_by_id: HashMap<String, usize>,
    pub section_by_id: HashMap<String, usize>,
    pub center: Vec2,
    /// world-px offset applied to a seated person's feet at each desk (to match the pod art)
    pub desk_seat_off: Vec<Vec2>,
    pub desk_chair: Vec<Option<Entity>>,
}
impl WorldIndex {
    pub fn poi(&self, d: &Company, key: &str) -> Option<Vec2> {
        let k2 = key.replace('-', "_");
        d.layout.poi.get(key).or_else(|| d.layout.poi.get(&k2)).map(tile_center).or_else(|| match key {
            "reception" => d.layout.poi.get("reception_greet").map(tile_center),
            "coffee" | "microwave" | "snackbar" | "fridge" => d.layout.poi.get("kitchen").map(tile_center),
            _ => None,
        })
    }
}

/// data gives integer tile coords for spots; the centre of that tile is +0.5
pub fn tile_center(p: &P) -> Vec2 {
    let fx = if p.x.fract() == 0.0 { p.x + 0.5 } else { p.x };
    let fy = if p.y.fract() == 0.0 { p.y + 0.5 } else { p.y };
    Vec2::new(fx, fy)
}
pub fn zpx(down_px: f32) -> f32 { ysort_z(down_px / TILE) }
/// world translation for a point given in "down" pixel space (x right, y down)
pub fn wpx(x: f32, y_down: f32, z: f32) -> Transform { Transform::from_xyz(x.round(), -y_down.round(), z) }

pub const CHAIR_COLORS: [&str; 5] = ["orange", "mustard", "teal", "avocado", "cream"];

pub fn spawn_prop(cmd: &mut Commands, at: &ArtAtlas, name: &str, x_px: f32, y_px: f32, z: f32) -> Option<Entity> {
    let p = at.prop(name)?;
    let spr = at.sprite(name, 0)?;
    let mut e = cmd.spawn((spr, wpx(x_px, y_px, z), Lit));
    if !(["carpet", "fx_", "emote", "bubble", "shadow", "outline", "vignette", "floor", "void"].iter().any(|k| name.starts_with(k))) { e.insert(crate::ui::Pick { key: name.into(), owner: None }); }
    if p.frames.len() > 1 && p.fps > 0.0 {
        let frames = p.states.get("ok").or(p.states.get("closed")).or(p.states.get("day")).cloned().unwrap_or_else(|| (0..p.frames.len()).collect());
        e.insert(Animated { prop: name.into(), fps: p.fps, frames, t: (x_px * 0.37).fract(), state: "ok" });
    }
    Some(e.id())
}

fn spawn_proc(cmd: &mut Commands, images: &mut Assets<Image>, cache: &mut ArtCache, kind: &str, x: f32, y: f32, w: i32, h: i32, facing: Facing, seed: u64) -> Entity {
    let key = format!("{kind}:{w}x{h}:{:?}:{}", facing, seed % 4);
    let (img, _) = cache.furniture.entry(key).or_insert_with(|| { let (i, a) = art::furniture_image(kind, w, h, facing, seed); (images.add(i), a) }).clone();
    let bottom = y + h.max(1) as f32;
    let wp = tile_to_world(Vec2::new(x, bottom));
    let flat = matches!(kind, "rug" | "dog-bed");
    let z = if flat { 0.5 } else { ysort_z(bottom - 0.05) };
    let e = cmd.spawn((Sprite { image: img, anchor: Anchor::BottomLeft, ..default() }, Transform::from_xyz(wp.x, wp.y, z), Lit)).id();
    cmd.entity(e).insert(crate::ui::Pick { key: kind.replace('-', "_"), owner: None });
    if !flat {
        cmd.spawn((Sprite { image: cache.shadow_big.clone(), custom_size: Some(Vec2::new(w.max(1) as f32 * TILE + 4.0, 8.0)), color: Color::srgba(1.0, 1.0, 1.0, 0.7), ..default() }, Transform::from_xyz(wp.x + w.max(1) as f32 * TILE * 0.5, wp.y + 1.0, 0.9), Lit));
    }
    e
}

fn text2d(t: &str, font: &Handle<Font>, size: f32, col: Color) -> (Text2d, TextFont, TextColor) {
    (Text2d::new(clean(t)), TextFont { font: font.clone(), font_size: size, font_smoothing: FontSmoothing::None, ..default() }, TextColor(col))
}

/// floating dark terminal board (section / room signage) with optional quota bar
fn terminal_board(cmd: &mut Commands, fonts: &Fonts, at_px: Vec2, line1: &str, line2: Option<&str>, quota: Option<Vec<String>>, phase: f32, room: Option<usize>) {
    let l1 = clean(line1).to_uppercase();
    let w = ((l1.len().max(line2.map_or(0, |s| s.len())) as f32) * 6.0 + 14.0).max(48.0).round();
    let h = if line2.is_some() || quota.is_some() { 21.0 } else { 15.0 };
    let base_y = -(at_px.y - 16.0).round();
    let shadow = cmd.spawn((Sprite::from_color(Color::srgba(0.35, 0.34, 0.4, 0.13), Vec2::new((w * 0.6).round(), 2.0)), Transform::from_xyz(at_px.x.round(), base_y - h / 2.0 - 12.0, 0.95), Lit)).id();
    let mut ent = cmd.spawn((Transform::from_xyz(at_px.x.round(), base_y, 400.0).with_scale(Vec3::splat(0.01)), Visibility::Hidden, Bob { amp: 1.0, speed: 1.6, base_y, phase }, Sign { room, slogan: false, half: Vec2::new(w / 2.0 + 2.0, h / 2.0 + 2.0), shadow: Some(shadow), shown: 0.0, culled: false }));
    ent.with_children(|p| {
        p.spawn((Sprite::from_color(Color::srgb(0.85, 0.80, 0.69), Vec2::new(w + 4.0, h + 4.0)), Transform::from_xyz(0.0, 0.0, 0.0)));
        p.spawn((Sprite::from_color(Color::srgb(0.17, 0.15, 0.13), Vec2::new(w + 2.0, h + 2.0)), Transform::from_xyz(0.0, 0.0, 0.01)));
        p.spawn((Sprite::from_color(Color::srgb(0.047, 0.15, 0.11), Vec2::new(w, h)), Transform::from_xyz(0.0, 0.0, 0.02)));
        let ty = if h > 16.0 { 4.0 } else { 0.0 };
        let mut t = p.spawn((text2d(&l1, &fonts.px, 8.0, Color::srgb(0.49, 0.95, 0.63)), Transform::from_xyz(0.0, ty, 0.03)));
        if let Some(r) = room { t.insert(RoomSign { room: r }); }
        if let Some(l2) = line2 { p.spawn((text2d(l2, &fonts.px, 8.0, Color::srgb(0.36, 0.62, 0.45)), Transform::from_xyz(0.0, -5.0, 0.03))); }
        if let Some(team) = quota {
            let bw = w - 10.0;
            p.spawn((Sprite::from_color(Color::srgba(0.49, 0.95, 0.63, 0.2), Vec2::new(bw, 2.0)), Transform::from_xyz(0.0, -6.0, 0.03)));
            p.spawn((Sprite { color: Color::srgb(0.49, 0.95, 0.63), custom_size: Some(Vec2::new(1.0, 2.0)), anchor: Anchor::CenterLeft, ..default() }, Transform::from_xyz(-bw / 2.0, -6.0, 0.04), QuotaBar { team, width: bw }));
        }
    });
}

/// a pre-baked plaque sprite, floating 12 px over a small ground shadow (hidden until hover / zoom like the boards)
fn plaque(cmd: &mut Commands, at: &ArtAtlas, key: &str, at_px: Vec2, phase: f32, room: Option<usize>, slogan: bool) {
    let Some(spr) = at.sprite(key, 0) else { return };
    let sz = at.prop(key).map(|p| p.frames[0].size()).unwrap_or(Vec2::new(40.0, 11.0));
    let base_y = -(at_px.y - 12.0).round();
    let sh = at.sprite("sign_shadow_small", 0).unwrap_or(Sprite::from_color(Color::srgba(0.35, 0.34, 0.4, 0.12), Vec2::new((sz.x * 0.55).round(), 2.0)));
    let shadow = cmd.spawn((sh, Transform::from_xyz(at_px.x.round(), -at_px.y.round(), 0.95), Lit)).id();
    let mut spr = spr; spr.anchor = Anchor::Center;
    cmd.spawn((Transform::from_xyz(at_px.x.round(), base_y, 400.0).with_scale(Vec3::splat(0.01)), Visibility::Hidden, Bob { amp: 1.0, speed: 1.5, base_y, phase },
        Sign { room, slogan, half: sz / 2.0 + 1.0, shadow: Some(shadow), shown: 0.0, culled: false }))
        .with_children(|p| { p.spawn((spr, Transform::default())); });
}

fn cream_board(cmd: &mut Commands, at: &ArtAtlas, fonts: &Fonts, at_px: Vec2, text: &str, phase: f32) {
    let t = clean(text).to_uppercase();
    let w = (t.len() as f32 * 6.0 + 12.0).round();
    let base_y = -(at_px.y - 14.0).round();
    let shadow = cmd.spawn((Sprite::from_color(Color::srgba(0.35, 0.34, 0.4, 0.12), Vec2::new((w * 0.55).round(), 2.0)), Transform::from_xyz(at_px.x.round(), base_y - 20.0, 0.95), Lit)).id();
    cmd.spawn((Transform::from_xyz(at_px.x.round(), base_y, 399.0).with_scale(Vec3::splat(0.01)), Visibility::Hidden, Bob { amp: 1.0, speed: 1.5, base_y, phase }, Sign { room: None, slogan: true, half: Vec2::new(w / 2.0 + 1.0, 8.0), shadow: Some(shadow), shown: 0.0, culled: false })).with_children(|p| {
        p.spawn((Sprite::from_color(Color::srgb(0.62, 0.58, 0.5), Vec2::new(w + 2.0, 15.0)), Transform::from_xyz(0.0, 0.0, 0.0)));
        p.spawn((Sprite::from_color(Color::srgb(0.94, 0.92, 0.86), Vec2::new(w, 13.0)), Transform::from_xyz(0.0, 0.0, 0.01)));
        p.spawn((Sprite::from_color(Color::srgb(0.85, 0.82, 0.74), Vec2::new(w, 1.0)), Transform::from_xyz(0.0, -6.0, 0.02)));
        p.spawn((text2d(&t, &fonts.px, 8.0, Color::srgb(0.165, 0.23, 0.21)), Transform::from_xyz(0.0, 0.5, 0.03)));
    });
    let _ = at;
}

pub fn build_world(mut cmd: Commands, data: Res<Data>, mut images: ResMut<Assets<Image>>, mut layouts: ResMut<Assets<TextureAtlasLayout>>, assets: Res<AssetServer>, at: Res<ArtAtlas>) {
    let d = &data.0;
    let l = &d.layout;
    let fonts = Fonts { ui: assets.load("fonts/VT323-Regular.ttf"), px: assets.load("fonts/Silkscreen-Regular.ttf") };
    let mut cache = ArtCache::default();
    cache.shadow = images.add(art::shadow_image(12, 5));
    cache.shadow_big = images.add(art::shadow_image(32, 9));
    cache.glow = images.add(art::soft_disc(64, [255, 255, 255], 1.8));
    cache.white = images.add({ let mut c = Canvas::new(1, 1); c.set(0, 0, Rgba([255, 255, 255, 255])); c.image() });
    cache.layout = layouts.add(TextureAtlasLayout::from_grid(UVec2::new(FW, FH), COLS, 4, None, None));

    let mut idx = WorldIndex::default();
    for (i, x) in l.desks.iter().enumerate() { idx.desk_by_id.insert(x.id.clone(), i); }
    for (i, x) in d.rooms.iter().enumerate() { idx.room_by_id.insert(x.id.clone(), i); }
    for (i, x) in d.people.iter().enumerate() { idx.person_by_id.insert(x.id.clone(), i); }
    for (i, x) in d.teams.iter().enumerate() { idx.team_by_id.insert(x.id.clone(), i); }
    for (i, x) in l.sections.iter().enumerate() { idx.section_by_id.insert(x.id.clone(), i); }
    idx.center = Vec2::new(l.w.max(1) as f32 * 0.5, l.h.max(1) as f32 * 0.5);
    idx.desk_seat_off = vec![Vec2::ZERO; l.desks.len()];
    idx.desk_chair = vec![None; l.desks.len()];

    // ---- island floors from the tile legend (ART-API 7.2): isle_<L>_{tl..br} picked from same-letter neighbours
    let isles = at.prop("isle_s_c").is_some();
    if isles {
        let ch = |x: i32, y: i32| -> char { if x < 0 || y < 0 { return '.'; } l.tiles.get(y as usize).and_then(|r| r.chars().nth(x as usize)).unwrap_or('.') };
        for (y, row) in l.tiles.iter().enumerate() { for (x, c) in row.chars().enumerate() {
            if !"xklanbqgmipvs".contains(c) { continue; }
            let (x, y) = (x as i32, y as i32);
            let (u, dn, lf, rt) = (ch(x, y - 1) == c, ch(x, y + 1) == c, ch(x - 1, y) == c, ch(x + 1, y) == c);
            let piece = match (u, dn, lf, rt) { (false, _, false, _) => "tl", (false, _, _, false) => "tr", (_, false, false, _) => "bl", (_, false, _, false) => "br", (false, _, _, _) => "t", (_, false, _, _) => "b", (_, _, false, _) => "l", (_, _, _, false) => "r", _ => "c" };
            let k = format!("isle_{c}_{piece}");
            if let Some(mut spr) = at.sprite(&k, 0) { spr.anchor = Anchor::TopLeft; cmd.spawn((spr, wpx(x as f32 * TILE, y as f32 * TILE, 0.2), Lit)); }
        } }
    }
    // ---- carpet islands (9-slice tiles) + shadow row (round-1 art)
    for s in l.sections.iter().filter(|_| !isles) {
        let r = s.rect; if r.w <= 0 || r.h <= 0 { continue; }
        for j in 0..r.h { for i in 0..r.w {
            let k = match (i == 0, i == r.w - 1, j == 0, j == r.h - 1) { (true, _, true, _) => "carpet_tl", (_, true, true, _) => "carpet_tr", (true, _, _, true) => "carpet_bl", (_, true, _, true) => "carpet_br", (_, _, true, _) => "carpet_t", (_, _, _, true) => "carpet_b", (true, _, _, _) => "carpet_l", (_, true, _, _) => "carpet_r", _ => "carpet_c" };
            let (x, y) = ((r.x + i) as f32 * TILE, (r.y + j) as f32 * TILE);
            if let Some(mut spr) = at.sprite(k, 0) { spr.anchor = Anchor::TopLeft; cmd.spawn((spr, wpx(x, y, 0.2), Lit)); }
            else { cmd.spawn((Sprite { color: Color::srgb(0.18, 0.43, 0.41), custom_size: Some(Vec2::splat(TILE)), anchor: Anchor::TopLeft, ..default() }, wpx(x, y, 0.2), Lit)); }
        } }
        for i in 0..r.w { if let Some(mut spr) = at.sprite("carpet_shadow", 0) { spr.anchor = Anchor::TopLeft; cmd.spawn((spr, wpx((r.x + i) as f32 * TILE, (r.y + r.h) as f32 * TILE, 0.2), Lit)); } }
    }
    // tinted floor (kitchen / library) from tiles
    for (y, row) in l.tiles.iter().enumerate().filter(|_| !isles) {
        let chars: Vec<char> = row.chars().collect();
        let mut x = 0;
        while x < chars.len() {
            let ch = chars[x];
            let col = match ch { 'k' => Some(Color::srgba(0.85, 0.80, 0.69, 0.45)), 'l' => Some(Color::srgba(0.66, 0.45, 0.29, 0.32)), _ => None };
            if let Some(colr) = col { let s = x; while x < chars.len() && chars[x] == ch { x += 1; }
                cmd.spawn((Sprite { color: colr, custom_size: Some(Vec2::new((x - s) as f32 * TILE, TILE)), anchor: Anchor::TopLeft, ..default() }, wpx(s as f32 * TILE, y as f32 * TILE, 0.15), Lit));
            } else { x += 1; }
        }
    }
    // ---- meeting-space dashed outlines (border tiles only)
    for r in d.rooms.iter() {
        let rc = r.rect; if rc.w <= 0 || rc.h <= 0 { continue; }
        for j in 0..rc.h { for i in 0..rc.w {
            let border = i == 0 || j == 0 || i == rc.w - 1 || j == rc.h - 1; if !border { continue; }
            let k = match (i == 0, i == rc.w - 1, j == 0, j == rc.h - 1) { (true, _, true, _) => "outline_tl", (_, true, true, _) => "outline_tr", (true, _, _, true) => "outline_bl", (_, true, _, true) => "outline_br", (_, _, true, _) => "outline_t", (_, _, _, true) => "outline_b", (true, _, _, _) => "outline_l", _ => "outline_r" };
            let k2 = k.replace("outline_", "outline2_");
            let k = if at.prop(&k2).is_some() { k2.as_str() } else { k };
            if let Some(mut spr) = at.sprite(k, 0) { spr.anchor = Anchor::TopLeft; cmd.spawn((spr, wpx((rc.x + i) as f32 * TILE, (rc.y + j) as f32 * TILE, 0.3), Lit)); }
        } }
    }
    // ---- desk tables -> per-column slices of the pod art; CRTs, keyboards, belongings, chairs
    let pod = at.prop("desk_pod4").cloned();
    let mut desk_tables: std::collections::HashSet<(i32, i32)> = Default::default();
    for t in &l.tables {
        let cols: Vec<&Desk> = { let mut v: Vec<&Desk> = l.desks.iter().filter(|dk| dk.facing == Facing::Down && dk.y == t.y - 1 && dk.x >= t.x && dk.x < t.x + t.w).collect(); v.sort_by_key(|d| d.x); v };
        let xs: Vec<i32> = { let mut v: Vec<i32> = l.desks.iter().filter(|dk| (dk.y == t.y - 1 || dk.y == t.y + t.h) && dk.x >= t.x && dk.x < t.x + t.w).map(|d| d.x).collect(); v.sort(); v.dedup(); v };
        if xs.is_empty() { continue; }
        desk_tables.insert((t.x, t.y));
        let cy = (t.y as f32 + t.h as f32 * 0.5) * TILE + 1.0; // pod anchor y (px, down)
        for (ci, &x) in xs.iter().enumerate() {
            let cx = x as f32 * TILE + 8.0;
            if let Some(p) = &pod {
                let fr = p.frames[0];
                let n = xs.len();
                let (sx0, sx1, left) = if n == 1 { (fr.min.x, fr.max.x, cx - fr.width() / 2.0) }
                    else if ci == 0 { (fr.min.x, fr.min.x + 33.0, cx - 17.0) }
                    else if ci == n - 1 { (fr.min.x + 37.0, fr.max.x, cx - 16.0) }
                    else { (fr.min.x + 1.0, fr.min.x + 33.0, cx - 16.0) };
                let top = cy - p.anchor.y;
                cmd.spawn((Sprite { image: at.sheet.clone(), rect: Some(Rect::new(sx0, fr.min.y, sx1, fr.max.y)), anchor: Anchor::TopLeft, ..default() }, wpx(left, top, zpx(cy)), Lit));
            } else {
                spawn_proc(&mut cmd, &mut images, &mut cache, "desk", x as f32, t.y as f32, 2, t.h, Facing::Down, 0);
            }
            // monitors: north desk (worker faces S) sees the back; south desk shows the screen
            for (name, dy, glow_dy) in [("crt_back", -12.0, -14.0), ("crt_front", 2.0, -2.0)] {
                let has_worker = l.desks.iter().any(|dk| dk.x == x && if name == "crt_back" { dk.y == t.y - 1 } else { dk.y == t.y + t.h });
                if !has_worker { continue; }
                if spawn_prop(&mut cmd, &at, name, cx, cy + dy, zpx(cy) + 0.004).is_none() { spawn_proc(&mut cmd, &mut images, &mut cache, "crt", x as f32, t.y as f32 + if dy < 0.0 { -0.3 } else { 0.4 }, 1, 1, Facing::Down, 0); }
                let g = at.sprite("glow_monitor", 0).map(|mut g| { g.color = g.color.with_alpha(0.0); g }).unwrap_or(Sprite { image: cache.glow.clone(), custom_size: Some(Vec2::splat(44.0)), color: Color::srgba(0.31, 0.78, 0.51, 0.0), ..default() });
                cmd.spawn((g, wpx(cx, cy + glow_dy, zpx(cy) + 0.006), Glow { base_alpha: if at.prop("glow_monitor").is_some() { 1.7 } else { 0.22 }, phase: x as f32 * 0.7 + dy }));
            }
            for ky in [-17.0, 6.0] { spawn_prop(&mut cmd, &at, "keyboard", cx, cy + ky, zpx(cy) + 0.005); }
        }
        let _ = cols;
    }
    // per-desk seated offsets (match pod seats at -19 / +17 px from the pod centre), chairs, belongings, lamps
    let night_owls: std::collections::HashSet<&str> = d.people.iter().filter(|p| p.traits.iter().any(|t| t == "night-owl")).map(|p| p.id.as_str()).collect();
    for (di, dk) in l.desks.iter().enumerate() {
        if dk.kind == "reception" { continue; }
        let table = l.tables.iter().find(|t| dk.x >= t.x && dk.x < t.x + t.w && (dk.y == t.y - 1 || dk.y == t.y + t.h));
        let foot = Vec2::new(dk.x as f32 * TILE + 8.0, dk.y as f32 * TILE + 8.0);
        let mut seat = foot;
        if let Some(t) = table { let cy = (t.y as f32 + t.h as f32 * 0.5) * TILE + 1.0; seat.y = if dk.facing == Facing::Down { cy - 19.0 } else { cy + 17.0 }; }
        idx.desk_seat_off[di] = seat - foot;
        let col = CHAIR_COLORS[(di * 7 + dk.x as usize) % 5];
        let (cname, dz) = match dk.facing { Facing::Down => (format!("chair_s_{col}"), -0.003), Facing::Up => (format!("chair_n_{col}"), 0.003), Facing::Left => (format!("chair_w_{col}"), -0.003), Facing::Right => (format!("chair_e_{col}"), -0.003) };
        if let Some(e) = spawn_prop(&mut cmd, &at, &cname, seat.x, seat.y + 1.0, zpx(seat.y) + dz) { idx.desk_chair[di] = Some(e); }
        else { spawn_proc(&mut cmd, &mut images, &mut cache, "desk-chair", dk.x as f32, dk.y as f32, 1, 1, dk.facing, di as u64); }
        // belongings on the owner's desk surface
        if let (Some(owner), Some(t)) = (dk.owner_id.as_ref().and_then(|o| d.people.iter().find(|p| &p.id == o)), table) {
            let cy = (t.y as f32 + t.h as f32 * 0.5) * TILE + 1.0;
            let iy = if dk.facing == Facing::Down { cy - 15.0 } else { cy + 4.0 };
            // ART-API 7.5: prefer the owner's catalogued belongings that are small enough for a desk (<= 16 px wide)
            let small: Vec<String> = d.objects.get("instances").and_then(|a| a.as_array()).map(|a| a.iter()
                .filter(|x| x.get("owner_id").and_then(|s| s.as_str()) == Some(owner.id.as_str()))
                .filter_map(|x| x.get("catalog_key").and_then(|s| s.as_str()).map(String::from))
                .filter(|k| at.prop(k).map_or(false, |p| p.frames[0].width() <= 16.0 && p.frames[0].height() <= 20.0)).collect()).unwrap_or_default();
            let list: Vec<String> = if small.is_empty() { owner.belongings.clone() } else { small };
            for (k, b) in list.iter().take(2).enumerate() {
                let ix = foot.x + if k == 0 { -11.0 } else { 9.0 };
                let name = match b.as_str() { "mug" => format!("mug_{}", ["orange", "mustard", "teal", "cream"][(owner.seed % 4) as usize]), "photo" => "photo_frame".into(), "stressball" => "stress_ball".into(), "lamp" => "desk_lamp".into(), o => o.to_string() };
                if b == "lamp" { continue; }
                if spawn_prop(&mut cmd, &at, &name, ix, iy, zpx(cy) + 0.007).is_none() {
                    let h = cache.belongings.entry(b.clone()).or_insert_with(|| images.add(art::belonging_image(b))).clone();
                    cmd.spawn((Sprite { image: h, anchor: Anchor::BottomCenter, ..default() }, wpx(ix, iy, zpx(cy) + 0.007), Lit));
                }
            }
            // night owls (and lamp owners) get a desk lamp that turns on at night
            if night_owls.contains(owner.id.as_str()) || owner.belongings.iter().any(|b| b == "lamp") {
                let lx = foot.x + if dk.facing == Facing::Down { 12.0 } else { -12.0 };
                if let Some(e) = spawn_prop(&mut cmd, &at, "desk_lamp", lx, iy, zpx(cy) + 0.008) { cmd.entity(e).insert(DeskLamp { desk: di, on: false }); }
                cmd.spawn((Sprite { image: cache.glow.clone(), custom_size: Some(Vec2::splat(44.0)), color: Color::srgba(1.0, 0.8, 0.47, 0.0), ..default() }, wpx(lx, iy - 6.0, zpx(cy) + 0.009), Glow { base_alpha: 0.28, phase: -1.0 }, DeskLamp { desk: di, on: false }));
            }
        }
    }
    // ---- furniture
    for (i, f) in l.furniture.iter().enumerate() {
        if f.kind == "elevator" || f.kind == "desk-chair" { continue; }
        if f.kind == "table" && desk_tables.contains(&(f.x, f.y)) { continue; }
        let (x0, y0, w, h) = (f.x as f32 * TILE, f.y as f32 * TILE, f.w.max(1) as f32 * TILE, f.h.max(1) as f32 * TILE);
        let foot = Vec2::new(x0 + w * 0.5, y0 + h - 2.0);
        let facing = f.facing.unwrap_or(Facing::Down);
        let col = CHAIR_COLORS[(i * 3 + f.x as usize) % 5];
        // one colour per room / area / label so islands look curated, not confetti
        let group = f.room_id.clone().or(f.area.clone()).or(f.label.clone()).unwrap_or_else(|| format!("{}:{}", f.x / 8, f.y / 8));
        let gh = group.bytes().fold(7u32, |h, b| h.wrapping_mul(31).wrapping_add(b as u32)) as usize;
        let col = CHAIR_COLORS[gh % 5];
        let fdir = match facing { Facing::Down => "down", Facing::Up => "up", Facing::Left => "left", Facing::Right => "right" };
        let bc = Vec2::new(x0 + w * 0.5, y0 + h); // ART-API 7.1: bottom-centre of the footprint
        let first = |keys: &[String]| keys.iter().find(|k| at.prop(k).is_some()).cloned();
        let resolved = first(&[format!("{}_{}x{}", f.kind, f.w.max(1), f.h.max(1)), format!("{}_{}", f.kind, fdir), f.kind.clone()]);
        let mapped: Option<(String, Vec2, f32)> = match f.kind.as_str() {
            "chair" | "stool" => { let (n, dz) = match facing { Facing::Down => ("s", -0.003), Facing::Up => ("n", 0.003), Facing::Left => ("w", -0.003), Facing::Right => ("e", -0.003) }; Some((format!("chair_{n}_{col}"), Vec2::new(x0 + 8.0, y0 + 9.0), zpx(y0 + 8.0) + dz)) }
            "armchair" if at.prop(&format!("armchair_{fdir}_{col}")).is_some() => Some((format!("armchair_{fdir}_{col}"), bc, zpx(bc.y))),
            "beanbag" => { let b = ["orange", "teal", "mustard"][gh % 3]; Some((if at.prop(&format!("beanbag_{b}")).is_some() { format!("beanbag_{b}") } else { resolved.clone().unwrap_or_else(|| "beanbag".into()) }, bc, zpx(bc.y))) }
            "plant" => { let v = ["plant_monstera", "plant_fern", "plant_rubber", "plant_succulent"][(i * 7 + f.x as usize) % 4]; Some((if at.prop(v).is_some() { v.to_string() } else if i % 2 == 0 { "snake_plant".into() } else { "snake_plant_terracotta".into() }, foot, zpx(foot.y))) }
            "cabinet" if resolved.as_deref() == Some("cabinet") => Some(("cabinet".into(), bc, zpx(bc.y))),
            "cabinet" => Some((if i % 2 == 0 { "filing_cabinet" } else { "filing_cabinet_avocado" }.into(), foot, zpx(foot.y))),
            "coffee-machine" => Some(("coffee_station".into(), foot, zpx(foot.y))),
            "bookshelf" => Some((if f.label.as_deref().unwrap_or("").contains("Archive") && at.prop("archive-shelf").is_some() { "archive-shelf" } else if f.w >= 10 && at.prop("bookshelf_12x1").is_some() { "bookshelf_12x1" } else { "bookshelf_6x1" }.into(), bc, zpx(bc.y))),
            "whiteboard" => Some((if i % 2 == 1 && at.prop("whiteboard-full").is_some() { "whiteboard-full" } else { "whiteboard" }.into(), bc, zpx(bc.y))),
            "goat-fence" => {
                let has = |dx: i32, dy: i32| l.furniture.iter().any(|g| g.kind == "goat-fence" && g.x == f.x + dx && g.y == f.y + dy);
                let (hz, vt) = (has(-1, 0) || has(1, 0), has(0, -1) || has(0, 1));
                Some((if hz && vt { "goat-fence_post" } else if vt { "goat-fence_v" } else { "goat-fence" }.into(), bc, zpx(bc.y)))
            }
            k if k.starts_with("rug") || k == "dog-bed" || k == "corridor-strip" => resolved.clone().map(|r| (r, bc, 0.25)),
            // ART-API 7.1 resolver: type_WxH, type_facing, type
            _ if resolved.is_some() => Some((resolved.clone().unwrap(), bc, zpx(bc.y))),
            "plant-tall" => Some(("plant_tall".into(), foot, zpx(foot.y))),
            "water-cooler" => Some(("water_cooler".into(), foot, zpx(foot.y))),
            "podium" => Some(("lectern".into(), foot, zpx(foot.y))),
            "screen" => Some(("projector_screen".into(), Vec2::new(foot.x, y0 + h - 4.0), zpx(y0))),
            "portrait" => Some(("founder_shrine".into(), foot, zpx(foot.y))),
            _ => None,
        };
        let spawned = mapped.and_then(|(name, p, z)| spawn_prop(&mut cmd, &at, &name, p.x, p.y, z).map(|e| (e, name)));
        // ART-API 7.3 light pools for glowing props
        let glow = match f.kind.as_str() { "aquarium-tank" => Some(("glow_aquarium", 1.8, 22.0)), "vending-machine" => Some(("glow_small", 1.6, -14.0)), "candle" => Some(("glow_candle", 1.8, -4.0)), "portrait" => Some(("glow_candle", 1.2, -2.0)), _ => None };
        if let Some((gk, ga, dy)) = glow { if let Some(mut spr) = at.sprite(gk, 0) { spr.color = spr.color.with_alpha(0.0); cmd.spawn((spr, wpx(x0 + w * 0.5, y0 + h + dy, 0.34), Glow { base_alpha: ga, phase: i as f32 * 0.9 })); } } // a pool on the floor, under everything
        let e = match spawned { Some((e, name)) => { if name == "coffee_station" { cmd.entity(e).insert(MachineSprite("coffee")); } e }
            None => spawn_proc(&mut cmd, &mut images, &mut cache, &f.kind, f.x as f32, f.y as f32, f.w.max(1), f.h.max(1), facing, i as u64) };
        if f.kind == "nap-pod" {
            // pod variety: a gentle per-pod tint (sage, peach, sky, cream...)
            let tints = [Color::srgb(1.0, 1.0, 1.0), Color::srgb(1.0, 0.92, 0.84), Color::srgb(0.88, 0.96, 1.0), Color::srgb(0.93, 1.0, 0.9), Color::srgb(1.0, 0.97, 0.86), Color::srgb(0.96, 0.9, 1.0)];
            let tint = tints[(f.x as usize * 7 + f.y as usize * 3) % tints.len()];
            cmd.entity(e).insert((NapPod { at: Vec2::new(f.x as f32 + f.w.max(1) as f32 * 0.5, f.y as f32 + f.h.max(1) as f32 * 0.5) }, Sprite { color: tint, ..at.sprite("nap-pod", 0).unwrap_or_default() }));
        }
        if f.id.starts_with("amph-chair") { if let Some(&ri) = f.room_id.as_ref().and_then(|r| idx.room_by_id.get(r)) { cmd.entity(e).insert(GhostSeat { room: ri, at: Vec2::new(f.x as f32 + 0.5, f.y as f32 + 0.5) }); } }
        match f.kind.as_str() { "microwave" => { cmd.entity(e).insert(MachineSprite("microwave")); } "printer" => { cmd.entity(e).insert(MachineSprite("printer")); } _ => {} }
    }
    // ---- cool fluorescent pools: one per ~6 tiles of each section, plus the tank, archive and board-visit rooms
    if at.prop("glow_fluoro").is_some() {
        let mut rects: Vec<R> = l.sections.iter().map(|s| s.rect).collect();
        rects.extend(d.rooms.iter().filter(|r| ["aquarium", "archive", "board-visit"].iter().any(|k| r.id.contains(k))).map(|r| r.rect));
        for (k, r) in rects.iter().enumerate() {
            let (nx, ny) = (((r.w as f32) / 6.0).round().max(1.0) as i32, ((r.h as f32) / 6.0).round().max(1.0) as i32);
            for j in 0..ny { for i in 0..nx {
                let p = Vec2::new((r.x as f32 + (i as f32 + 0.5) * r.w as f32 / nx as f32) * TILE, (r.y as f32 + (j as f32 + 0.5) * r.h as f32 / ny as f32) * TILE);
                if let Some(mut spr) = at.sprite("glow_fluoro", 0) { spr.color = spr.color.with_alpha(0.0); cmd.spawn((spr, wpx(p.x, p.y, 0.32), Glow { base_alpha: 0.85, phase: (k * 7 + i as usize * 3 + j as usize) as f32 })); }
            } }
        }
    }
    // ---- floating signage (sections + rooms are generated with live data; others from data)
    // ART-API 7.6: small pre-baked plaques (sectxt_/roomtxt_/signtxt_) when the art has them; skip duplicate text,
    // keep plaques off solid furniture (e.g. the Gerald sign vs the tank) and nudge overlaps apart by 14 px.
    let mut placed: Vec<Rect> = vec![];
    let mut texts: std::collections::HashSet<String> = Default::default();
    let solid_px: Vec<Rect> = l.furniture.iter().filter(|f| f.solid && f.w * f.h >= 4).map(|f| Rect::new(f.x as f32 * TILE - 6.0, f.y as f32 * TILE - 30.0, (f.x + f.w) as f32 * TILE + 6.0, (f.y + f.h) as f32 * TILE + 2.0)).collect();
    let mut place = |key: &str, mut p: Vec2, avoid_solid: bool| -> Option<Vec2> {
        let pd = at.prop(key)?;
        let sz = pd.frames[0].size();
        if avoid_solid { if let Some(r) = solid_px.iter().find(|r| r.contains(p) || r.contains(p - Vec2::new(0.0, 16.0))) { p.y = r.max.y + 24.0; } }
        let mut k = 0;
        loop {
            let rect = Rect::from_center_size(p, sz + Vec2::new(4.0, 2.0));
            if !placed.iter().any(|o| !o.intersect(rect).is_empty()) || k > 6 { placed.push(rect); return Some(p); }
            k += 1; p.y += if k % 2 == 1 { 14.0 * k as f32 } else { -14.0 * k as f32 };
        }
    };
    for (si, s) in l.sections.iter().enumerate() {
        let lp = s.label.map(|p| Vec2::new(p.x, p.y)).unwrap_or(Vec2::new(s.rect.x as f32 + s.rect.w as f32 * 0.5, s.rect.y as f32));
        texts.insert(clean(&s.name).to_lowercase());
        let key = format!("sectxt_{}", s.id);
        match place(&key, Vec2::new(lp.x * TILE, lp.y * TILE - 6.0), false) {
            Some(p) => plaque(&mut cmd, &at, &key, p, si as f32 * 1.3, None, false),
            None => terminal_board(&mut cmd, &fonts, Vec2::new(lp.x * TILE, lp.y * TILE - 6.0), &s.name, None, Some(s.team_ids.clone()), si as f32 * 1.3, None),
        }
    }
    for (ri, r) in d.rooms.iter().enumerate() {
        let sp = r.sign.as_ref().map(|s| Vec2::new(s.x, s.y)).unwrap_or(Vec2::new(r.rect.x as f32 + r.rect.w as f32 * 0.5, r.rect.y as f32 - 0.6));
        texts.insert(clean(&r.name).to_lowercase());
        if let Some(st) = r.sign.as_ref().map(|s| s.text.clone()) { texts.insert(clean(&st).to_lowercase()); }
        let key = format!("roomtxt_{}", r.id);
        match place(&key, Vec2::new(sp.x * TILE, sp.y * TILE + 4.0), true) {
            Some(p) => plaque(&mut cmd, &at, &key, p, ri as f32 * 0.9 + 0.4, Some(ri), false),
            None => { let cap = format!("{} - SEATS {}", r.size.to_uppercase(), r.capacity); terminal_board(&mut cmd, &fonts, Vec2::new(sp.x * TILE, sp.y * TILE + 4.0), &r.name, Some(&cap), None, ri as f32 * 0.9 + 0.4, Some(ri)) }
        }
    }
    for (i, s) in l.signs.iter().enumerate() {
        if s.kind == "section" || s.kind == "room" { continue; }
        let tl = clean(&s.text).to_lowercase();
        if !texts.insert(tl) { continue; } // duplicate of a room/section name or another sign
        let key = format!("signtxt_{}", s.id);
        match place(&key, Vec2::new(s.x * TILE, s.y * TILE), true) {
            Some(p) => plaque(&mut cmd, &at, &key, p, i as f32 * 2.1, None, true),
            None => cream_board(&mut cmd, &at, &fonts, Vec2::new(s.x * TILE, s.y * TILE), &s.text, i as f32 * 2.1),
        }
    }
    // ---- elevator (animated doors; car rise/sink handled by render)
    let er = l.elevator.rect;
    if er.w > 0 {
        let foot = Vec2::new((er.x as f32 + er.w as f32 * 0.5) * TILE, (er.y + er.h) as f32 * TILE - 4.0);
        if let Some(e) = spawn_prop(&mut cmd, &at, "elevator", foot.x, foot.y, zpx(foot.y)) { cmd.entity(e).remove::<Animated>().insert(ElevatorSprite); }
        else { let e = spawn_proc(&mut cmd, &mut images, &mut cache, "elevator", er.x as f32, er.y as f32, er.w, er.h, Facing::Down, 0); cmd.entity(e).insert(ElevatorSprite); }
        let eg = at.sprite("glow_elevator", 0).map(|mut g| { g.color = g.color.with_alpha(0.0); g }).unwrap_or(Sprite { image: cache.glow.clone(), custom_size: Some(Vec2::splat(80.0)), color: Color::srgba(1.0, 0.85, 0.55, 0.0), ..default() });
        cmd.spawn((eg, wpx(foot.x, foot.y - 6.0, zpx(foot.y) + 0.01), Glow { base_alpha: 0.3, phase: -2.0 }));
    }
    // ---- void oddities (data + a few deterministic extras far out)
    let mut vprops: Vec<(String, f32, f32)> = l.void_props.iter().map(|v| (v.kind.clone(), v.x, v.y)).collect();
    let extras = ["cabinet", "plant", "chair", "lamp", "water-cooler", "phone"];
    for k in 0..8 { let a = k as f32 * 2.399 + 0.7; let r = 55.0 + (k * 37 % 45) as f32; vprops.push((extras[k % extras.len()].to_string(), idx.center.x + a.cos() * r * 1.4, idx.center.y + a.sin() * r)); }
    for (k, (kind, x, y)) in vprops.iter().enumerate() {
        let foot = Vec2::new(x * TILE + 8.0, y * TILE + 14.0);
        let name = match kind.as_str() { "phone" | "desk-phone" | "ringing-phone" | "telephone" => "phone_ring", "cabinet" | "filing-cabinet" => "filing_cabinet", "plant" => "snake_plant", "plant-tall" => "plant_tall", "chair" | "desk-chair" => "chair_s_mustard", "water-cooler" => "water_cooler", "crt" | "monitor" => "crt_front", s => s };
        if spawn_prop(&mut cmd, &at, name, foot.x, foot.y, zpx(foot.y)).is_none() { spawn_proc(&mut cmd, &mut images, &mut cache, kind, *x, *y, 1, 1, Facing::Down, k as u64 + 300); }
    }
    let grid = Grid::from_layout(l, &l.furniture);
    cmd.insert_resource(grid);
    cmd.insert_resource(idx);
    cmd.insert_resource(cache);
    cmd.insert_resource(fonts);
}
