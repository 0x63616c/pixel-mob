//! Presentation layer ("trailer still, not a floor plan"): cinematic director camera, sign
//! de-cluttering, atmosphere (light pools, dust motes, colour grade, film grain / scanlines,
//! fluorescent flicker), juice (coffee steam, paper flutter, confetti bursts, big-event banner with
//! everyone turning to look, meeting slides, dozing, idle fidgets).
use crate::agents::*;
use crate::agents::Anim;
use crate::data::*;
use crate::events::*;
use crate::roles::Elevator;
use crate::sim::*;
use crate::ui::CamCtl;
use crate::world::*;
use crate::world::Sign;
use bevy::asset::RenderAssetUsages;
use std::collections::HashMap;
use bevy::prelude::*;
use bevy::render::render_resource::{Extent3d, TextureDimension, TextureFormat};
use bevy::ui::FocusPolicy;

pub struct FxPlugin;
impl Plugin for FxPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<Director>().init_resource::<Grade>()
            .add_systems(Startup, setup_fx.after(StartupSet::Ui))
            .add_systems(Update, (director, signs, pools, motes, grade, steam, footsteps, puffs, big_moments, banner_anim, slides, fidgets, day_night_props, ghost_seats, nap_pods).chain().after(SimSet::Visual));
    }
}

// ------------------------------------------------------------------ images
fn img(w: u32, h: u32, f: impl Fn(u32, u32) -> [u8; 4]) -> Image {
    let mut d = Vec::with_capacity((w * h * 4) as usize);
    for y in 0..h { for x in 0..w { d.extend_from_slice(&f(x, y)); } }
    Image::new(Extent3d { width: w, height: h, depth_or_array_layers: 1 }, TextureDimension::D2, d, TextureFormat::Rgba8UnormSrgb, RenderAssetUsages::default())
}
fn smooth(mut i: Image) -> Image { i.sampler = bevy::image::ImageSampler::linear(); i }
fn hash2(x: u32, y: u32, s: u32) -> u32 { let mut h = x.wrapping_mul(374761393) ^ y.wrapping_mul(668265263) ^ s.wrapping_mul(2246822519); h = (h ^ (h >> 13)).wrapping_mul(1274126177); h ^ (h >> 16) }

#[derive(Resource)] pub struct FxImages { pub pool: Handle<Image>, pub slides: Vec<Handle<Image>> }
#[derive(Component)] pub struct Pool { pub base: f32, pub phase: f32, pub flick: f32 }
#[derive(Component)] pub struct Mote { pub vel: Vec2, pub phase: f32 }
#[derive(Component)] pub struct Puff { pub vel: Vec2, pub t: f32, pub life: f32, pub sway: f32, pub grav: f32, pub a0: f32 }
#[derive(Component)] pub struct GradeOverlay;
#[derive(Component)] pub struct GrainOverlay;
#[derive(Component)] pub struct ScanOverlay;
#[derive(Component)] pub struct DimOverlay;
/// deep night vignette (procedural, stronger than the art's day vignette)
#[derive(Component)] pub struct NightVignette;
#[derive(Component)] pub struct Banner;
#[derive(Component)] pub struct BannerText;
#[derive(Component)] pub struct BannerSub;
#[derive(Component)] pub struct Slide { pub room: usize, pub k: usize, pub t: f32 }
#[derive(Component)] pub struct SteamSource { pub t: f32 }

/// film look: 0 off, 1 subtle (default), 2 strong
#[derive(Resource)] pub struct Grade { pub film: u8, pub banner_t: f32, pub banner_on: bool, pub dim: f32, pub flick: f32, pub next_flick: f32 }
impl Default for Grade { fn default() -> Self { Grade { film: 1, banner_t: 99.0, banner_on: false, dim: 0.0, flick: 0.0, next_flick: 30.0 } } }

/// cinematic camera: drifts between interesting things until the user grabs the controls
#[derive(Resource)] pub struct Director { pub target: Vec2, pub next: f32, pub label: String, pub cue: Option<(Vec2, f32)>, pub recent: std::collections::VecDeque<String>, pub shot: u32 }
impl Default for Director { fn default() -> Self { Director { target: Vec2::ZERO, next: 0.0, label: String::new(), cue: None, recent: Default::default(), shot: 0 } } }

fn setup_fx(mut cmd: Commands, mut images: ResMut<Assets<Image>>, data: Res<Data>, fonts: Res<Fonts>, params: Res<Params>) {
    let d = &data.0;
    // soft elliptical light pool
    let pool = images.add(smooth(img(64, 64, |x, y| { let dx = (x as f32 - 31.5) / 32.0; let dy = (y as f32 - 31.5) / 32.0; let r = (dx * dx + dy * dy).sqrt(); let a = ((1.0 - r).max(0.0)).powf(1.6); [255, 246, 222, (a * 255.0) as u8] })));
    // slides: chart up, bars, pie-ish, bullet text, logo
    let mk = |kind: u32| img(24, 12, move |x, y| {
        let bg = [236u8, 240, 232, 255]; let ink = [40u8, 110, 100, 255]; let acc = [226u8, 132, 74, 255];
        if y == 0 || y == 11 || x == 0 || x == 23 { return [200, 206, 196, 255]; }
        match kind {
            0 => { let h = 2 + (x * 7 / 23); if y > 10 - h.min(9) && x > 2 && x % 4 != 0 && y < 10 { if x > 18 { acc } else { ink } } else { bg } }
            1 => { let yy = 9.0 - (x as f32 - 2.0) * 0.33 - ((x as f32) * 0.9).sin() * 0.8; if (y as f32 - yy).abs() < 0.8 && x > 1 && x < 22 { acc } else if y == 10 && x > 1 { ink } else { bg } }
            2 => { let (cx, cy) = (8.0, 6.0); let (dx, dy) = (x as f32 - cx, y as f32 - cy); let r = (dx * dx + dy * dy).sqrt(); if r < 4.2 { if dy.atan2(dx) > 0.7 { acc } else { ink } } else if x > 14 && x < 22 && y % 3 == 1 { ink } else { bg } }
            3 => { if y % 3 == 1 && x > 2 && x < 4 { acc } else if y % 3 == 1 && x > 5 && x < 6 + ((hash2(y, 3, 1) % 14) as u32) { ink } else { bg } }
            _ => { let (dx, dy) = (x as f32 - 11.5, y as f32 - 5.5); if (dx * dx + dy * dy * 2.0).sqrt() < 4.0 { [124, 242, 160, 255] } else { [10, 30, 24, 255] } }
        }
    });
    let slides: Vec<Handle<Image>> = (0..5).map(|k| images.add(mk(k))).collect();
    // light pools under every island and meeting room
    let mut rects: Vec<(R, f32)> = d.layout.sections.iter().map(|s| (s.rect, 0.9)).collect();
    rects.extend(d.rooms.iter().map(|r| (r.rect, 0.7)));
    for (i, (r, k)) in rects.iter().enumerate() {
        if r.w <= 0 { continue; }
        let c = Vec2::new((r.x as f32 + r.w as f32 * 0.5) * TILE, -(r.y as f32 + r.h as f32 * 0.5) * TILE);
        let size = Vec2::new(r.w as f32 * TILE * 1.7 + 48.0, r.h as f32 * TILE * 1.9 + 40.0);
        cmd.spawn((Sprite { image: pool.clone(), custom_size: Some(size), color: Color::srgba(1.0, 0.96, 0.86, 0.0), ..default() }, Transform::from_xyz(c.x, c.y, 0.3), Pool { base: *k, phase: i as f32 * 1.7, flick: 0.0 }));
    }
    // slides on every meeting-room screen
    for f in &d.layout.furniture {
        if f.kind != "screen" { continue; }
        let Some(rid) = &f.room_id else { continue };
        let Some(ri) = d.rooms.iter().position(|r| &r.id == rid) else { continue };
        let w = (f.w.max(2) as f32 * TILE - 10.0).min(40.0);
        cmd.spawn((Sprite { image: slides[4].clone(), custom_size: Some(Vec2::new(w, (w * 0.5).round())), ..default() }, Transform::from_xyz(((f.x as f32 + f.w as f32 * 0.5) * TILE).round(), (-(f.y as f32) * TILE + 22.0).round(), ysort_z(f.y as f32 + 1.0) + 0.01), Slide { room: ri, k: 4, t: (ri as f32) * 1.3 }));
    }
    // coffee steam
    for f in &d.layout.furniture { if f.kind == "coffee-machine" { cmd.spawn((Transform::from_xyz((f.x as f32 + 0.5) * TILE, -(f.y as f32) * TILE - 2.0, 0.0), SteamSource { t: 0.0 })); } }
    // dust motes (world space, recycled around the camera)
    for k in 0..46u32 {
        let h = hash2(k, 7, 3);
        let p = Vec2::new((h % 900) as f32 - 450.0, ((h >> 10) % 600) as f32 - 300.0);
        let s = if k % 7 == 0 { 2.0 } else { 1.0 };
        cmd.spawn((Sprite::from_color(Color::srgba(0.55, 0.66, 0.64, 0.0), Vec2::splat(s)), Transform::from_xyz(p.x, p.y, 460.0), Mote { vel: Vec2::new(((h >> 3) % 100) as f32 / 100.0 - 0.5, ((h >> 5) % 100) as f32 / 100.0 * 0.6 - 0.15) * 4.0, phase: k as f32 * 0.77 }));
    }
    // screen-space colour grade, scanlines, grain, event dim
    let scan = images.add(img(1, 3, |_, y| if y == 2 { [0, 18, 14, 60] } else { [0, 0, 0, 0] }));
    let grain = images.add(img(96, 96, |x, y| { let h = hash2(x, y, 11); let v = (h % 255) as u8; [v, v, v, if h % 5 == 0 { 255 } else { 0 }] }));
    let full = || Node { position_type: PositionType::Absolute, left: Val::Px(0.0), top: Val::Px(0.0), width: Val::Percent(100.0), height: Val::Percent(100.0), ..default() };
    cmd.spawn((full(), BackgroundColor(Color::srgba(0.2, 0.5, 0.46, 0.05)), FocusPolicy::Pass, GlobalZIndex(-6), GradeOverlay));
    cmd.spawn((ImageNode::new(scan).with_mode(NodeImageMode::Tiled { tile_x: true, tile_y: true, stretch_value: 1.0 }).with_color(Color::srgba(1.0, 1.0, 1.0, 0.35)), full(), FocusPolicy::Pass, GlobalZIndex(-2), ScanOverlay));
    cmd.spawn((ImageNode::new(grain).with_mode(NodeImageMode::Tiled { tile_x: true, tile_y: true, stretch_value: 1.0 }).with_color(Color::srgba(1.0, 1.0, 1.0, 0.05)), Node { position_type: PositionType::Absolute, left: Val::Px(0.0), top: Val::Px(0.0), width: Val::Percent(110.0), height: Val::Percent(115.0), ..default() }, FocusPolicy::Pass, GlobalZIndex(-1), GrainOverlay));
    cmd.spawn((full(), BackgroundColor(Color::srgba(0.0, 0.03, 0.03, 0.0)), FocusPolicy::Pass, GlobalZIndex(1), DimOverlay));
    // night: the void falls away into deep blue at the edges, the lit islands stay warm in the middle
    let nv = images.add(smooth(img(128, 80, |x, y| { let dx = (x as f32 - 63.5) / 64.0; let dy = (y as f32 - 39.5) / 40.0; let r = (dx * dx * 0.8 + dy * dy).sqrt(); let a = ((r - 0.45) / 0.75).clamp(0.0, 1.0).powf(1.5); [10, 16, 34, (a * 235.0) as u8] })));
    let mut nvi = ImageNode::new(nv).with_color(Color::srgba(1.0, 1.0, 1.0, 0.0)); nvi.image_mode = NodeImageMode::Stretch;
    cmd.spawn((nvi, full(), FocusPolicy::Pass, GlobalZIndex(-5), NightVignette));
    // announcement banner (slides down on big moments)
    cmd.spawn((Node { position_type: PositionType::Absolute, top: Val::Px(-90.0), left: Val::Percent(50.0), margin: UiRect::left(Val::Px(-210.0)), width: Val::Px(420.0), padding: UiRect::axes(Val::Px(14.0), Val::Px(8.0)), border: UiRect::all(Val::Px(2.0)), flex_direction: FlexDirection::Column, align_items: AlignItems::Center, row_gap: Val::Px(2.0), ..default() },
        BackgroundColor(Color::srgba(0.035, 0.07, 0.055, 0.92)), BorderColor(Color::srgb(0.85, 0.80, 0.69)), BorderRadius::all(Val::Px(3.0)), FocusPolicy::Pass, GlobalZIndex(6), Banner)).with_children(|b| {
        b.spawn((Text::new("A MESSAGE FROM THE BOARD"), TextFont { font: fonts.px.clone(), font_size: 8.0, font_smoothing: bevy::text::FontSmoothing::None, ..default() }, TextColor(Color::srgb(0.36, 0.62, 0.45)), BannerSub));
        b.spawn((Text::new(""), TextFont { font: fonts.ui.clone(), font_size: 28.0, font_smoothing: bevy::text::FontSmoothing::None, ..default() }, TextColor(Color::srgb(0.49, 0.95, 0.63)), BannerText));
    });
    let _ = params;
    cmd.insert_resource(FxImages { pool, slides });
}

// ------------------------------------------------------------------ director camera
pub const BIG: [&str; 21] = ["all-hands", "gratitude-assembly", "friday-deploy", "deploy-success", "prod-down", "prod-fixed", "funding-round", "pizza-arrives", "fire-drill", "quota-reached", "reward-party", "overtime-protocol", "quarterly-elevator", "void-flicker", "goat-appears", "taco-tuesday", "donut-drop", "night-shift", "dawn", "birthday-cake", "coffee-machine-breaks"];

#[allow(clippy::too_many_arguments)]
fn director(mut first: Local<bool>, mut dir: ResMut<Director>, mut ctl: ResMut<CamCtl>, time: Res<Time>, q: Query<(&Mover, &Pose, &Agent, Option<&crate::render::Speaking>)>, rooms: Res<Rooms>, data: Res<Data>, idx: Res<WorldIndex>, el: Res<Elevator>, bus: Res<Bus>, win: Query<&Window>, keys: Res<ButtonInput<KeyCode>>) {
    let now = time.elapsed_secs_f64();
    if keys.just_pressed(KeyCode::KeyC) { ctl.last_user = -1e9; ctl.follow = None; dir.next = 0.0; }
    let idle = now - ctl.last_user;
    if ctl.follow.is_some() || idle < 40.0 { return; }
    let dt = time.delta_secs().min(0.05);
    dir.next -= dt;
    // a director cue (big event) jumps the queue
    if let Some((p, until)) = dir.cue { if (now as f32) < until { dir.target = p; } else { dir.cue = None; } }
    if dir.next <= 0.0 && dir.cue.is_none() {
        dir.next = 9.0 + (now as f32 * 1.37).sin().abs() * 5.0;
        dir.shot += 1;
        let pts: Vec<(Vec2, bool)> = q.iter().filter(|(_, p, a, _)| !p.hidden && !matches!(a.role, Role::Goat | Role::Dog)).map(|(m, _, _, sp)| (m.pos, sp.is_some())).collect();
        let mut cands: Vec<(f32, Vec2, String)> = vec![];
        // running events with a place: newest first
        for (k, a) in bus.active.iter().rev().filter(|a| a.pos.is_some()).take(3).enumerate() { cands.push((9.0 - k as f32 * 2.0, a.pos.unwrap(), a.id.clone())); }
        // busiest meeting room
        if let Some((ri, st)) = rooms.states.iter().enumerate().max_by_key(|(_, s)| s.count) { if st.count >= 3 { cands.push((st.count as f32 * 0.8, data.0.rooms[ri].rect.center(), format!("room{ri}"))); } }
        // elevator rush
        let rush = el.queue.len() + el.aboard.len() + el.waiting_out.len();
        if rush >= 3 { cands.push((rush as f32 * 1.2, el.door + Vec2::new(1.5, -1.0), "elevator".into())); }
        // where the conversation is: most people talking inside a 12x8 window
        let mut best = (0.0f32, Vec2::ZERO);
        for (p, _) in &pts { let n: f32 = pts.iter().filter(|(o, _)| (o.x - p.x).abs() < 6.0 && (o.y - p.y).abs() < 4.0).map(|(_, sp)| if *sp { 1.6 } else { 0.35 }).sum(); if n > best.0 { best = (n, *p); } }
        if best.0 > 0.0 { cands.push((best.0.min(8.0), best.1, format!("talk{}", (best.1.x / 8.0) as i32 * 100 + (best.1.y / 6.0) as i32))); }
        // a slow tour of the floor's odd corners (tank, goat, nap pods, ping-pong, the mystery door...)
        const TOUR: [&str; 10] = ["aquarium", "goat_pen", "kitchen", "nap_pods", "pingpong", "reception", "shrine", "mystery_door", "plant_wall", "water_cooler"];
        let stop = TOUR[(dir.shot as usize * 7 + 3) % TOUR.len()];
        if let Some(p) = idx.poi(&data.0, stop) { let near = pts.iter().filter(|(o, _)| (*o - p).length() < 5.0).count() as f32; cands.push((1.6 + near * 0.9, p, stop.to_string())); }
        // don't sit on the same thing twice in a short while
        let recent = dir.recent.clone();
        cands.iter_mut().for_each(|c| if let Some(k) = recent.iter().rev().position(|r| *r == c.2) { c.0 *= 0.15 + 0.2 * k as f32; });
        if let Some(c) = cands.into_iter().max_by(|a, b| a.0.partial_cmp(&b.0).unwrap()) { dir.target = c.1; dir.recent.push_back(c.2.clone()); if dir.recent.len() > 4 { dir.recent.pop_front(); } dir.label = c.2; }
    }
    if dir.target == Vec2::ZERO { return; }
    let view = win.single().map(|w| Vec2::new(w.width(), w.height())).unwrap_or(Vec2::new(1280.0, 800.0));
    let want_zoom = cine_zoom(view);
    if !ctl.user_zoomed { ctl.target_zoom = want_zoom; }
    // slow, eased drift + a little breathing
    let t = now as f32;
    let tgt = tile_to_world(dir.target) + Vec2::new((t * 0.13).sin() * 10.0, (t * 0.09).cos() * 6.0 + 8.0);
    let p = ctl.pos;
    // far jumps are cuts (no long pans across empty void); near ones are a slow drift
    let far = (tgt - p).length() > 380.0;
    let k = if !*first || far { *first = true; 1.0 } else { (dt * 0.6).min(1.0) };
    ctl.pos = p + (tgt - p) * k;
}

/// default close-up zoom (2-3x), never smaller than "fit"
pub fn cine_zoom(view: Vec2) -> f32 { if view.x >= 1000.0 && view.y >= 600.0 { 3.0 } else { 2.0 } }

// ------------------------------------------------------------------ signs: hidden until hover / zoom
#[allow(clippy::too_many_arguments)]
fn signs(time: Res<Time>, ctl: Res<CamCtl>, win: Query<&Window>, cam: Query<(&Camera, &GlobalTransform)>, data: Res<Data>, mut q: Query<(Entity, &mut Sign, &mut Transform, &mut Visibility)>, mut shadows: Query<&mut Sprite>, mut culled_once: Local<bool>) {
    if !*culled_once {
        // de-duplicate: slogans that overlap anything, then room boards that overlap each other
        let all: Vec<(Entity, Vec2, Vec2, bool)> = q.iter().map(|(e, s, tf, _)| (e, tf.translation.truncate(), s.half, s.slogan)).collect();
        if all.is_empty() { return; }
        let mut cull = std::collections::HashSet::new();
        for (i, a) in all.iter().enumerate() { for (j, b) in all.iter().enumerate() {
            if i == j || cull.contains(&b.0) { continue; }
            let ov = (a.1.x - b.1.x).abs() < a.2.x + b.2.x + 2.0 && (a.1.y - b.1.y).abs() < a.2.y + b.2.y + 2.0;
            if ov && (a.3 && !b.3 || (a.3 == b.3 && i > j)) { cull.insert(a.0); }
        } }
        for (e, mut s, _, _) in &mut q { if cull.contains(&e) { s.culled = true; } }
        *culled_once = true;
    }
    let dt = time.delta_secs();
    let cursor = win.single().ok().and_then(|w| w.cursor_position()).and_then(|c| cam.single().ok().and_then(|(cm, gt)| cm.viewport_to_world_2d(gt, c).ok()));
    let ct = cursor.map(world_to_tile);
    for (_, mut s, mut tf, mut vis) in &mut q {
        let p = tf.translation.truncate();
        let near = cursor.map_or(false, |c| (c - p).length() < 70.0);
        let in_room = match (s.room, ct) { (Some(r), Some(t)) => data.0.rooms.get(r).map_or(false, |r| r.rect.contains(t.x.floor() as i32, t.y.floor() as i32)), _ => false };
        let want = !s.culled && (near || in_room || (!s.slogan && ctl.zoom >= 4.5));
        let target = if want { 1.0 } else { 0.0 };
        s.shown += (target - s.shown) * (dt * 9.0).min(1.0);
        if (s.shown - target).abs() < 0.01 { s.shown = target; }
        let k = s.shown;
        let sc = if k <= 0.0 { 0.01 } else { ease_out_back(k) };
        tf.scale = Vec3::new(sc * (1.0 + (1.0 - k) * 0.25), sc, 1.0);
        *vis = if k < 0.02 { Visibility::Hidden } else { Visibility::Inherited };
        if let Some(sh) = s.shadow { if let Ok(mut sp) = shadows.get_mut(sh) { sp.color = sp.color.with_alpha(0.13 * k); } }
    }
}

// ------------------------------------------------------------------ atmosphere
fn pools(clock: Res<Clock>, time: Res<Time>, machines: Res<Machines>, mut q: Query<(&mut Pool, &mut Sprite)>, at: Res<crate::atlas::ArtAtlas>) {
    let n = clock.night();
    // with round-2 art the fluoro / monitor pools carry the light; the big soft island pool just warms the edges
    let soft = if at.prop("glow_fluoro").is_some() { 0.3 } else { 1.0 };
    let t = time.elapsed_secs();
    for (mut p, mut s) in &mut q {
        // rare fluorescent stutter per island (more at night / during void-flicker)
        if p.flick <= 0.0 && ((t * 0.7 + p.phase * 13.0).sin() > 0.9995 || machines.flicker > 0.0 && (t * 9.0 + p.phase).sin() > 0.97) { p.flick = 0.35; }
        let mut f = 1.0;
        if p.flick > 0.0 { p.flick -= time.delta_secs(); f = if (p.flick * 40.0).sin() > 0.0 { 0.35 } else { 1.0 }; }
        let a = soft * (0.10 + 0.42 * n) * p.base * (0.96 + 0.04 * (t * 1.3 + p.phase).sin()) * f;
        s.color = Color::srgba(1.0, 0.95 - 0.04 * n, 0.84 - 0.06 * n, a);
    }
}

fn motes(time: Res<Time>, clock: Res<Clock>, ctl: Res<CamCtl>, win: Query<&Window>, mut q: Query<(&mut Mote, &mut Transform, &mut Sprite)>) {
    let dt = time.delta_secs().min(0.05);
    let t = time.elapsed_secs();
    let view = win.single().map(|w| Vec2::new(w.width(), w.height())).unwrap_or(Vec2::new(1280.0, 800.0)) / ctl.zoom.max(1.0);
    let half = view * 0.5 + 8.0;
    let n = clock.night();
    for (m, mut tf, mut s) in &mut q {
        let wob = Vec2::new((t * 0.7 + m.phase).sin(), (t * 0.5 + m.phase * 1.3).cos()) * 1.5;
        tf.translation.x += (m.vel.x + wob.x) * dt; tf.translation.y += (m.vel.y + wob.y) * dt;
        // wrap around the camera so there are always motes in view
        let mut rel = tf.translation.truncate() - ctl.pos;
        if rel.x > half.x { rel.x -= half.x * 2.0; } if rel.x < -half.x { rel.x += half.x * 2.0; }
        if rel.y > half.y { rel.y -= half.y * 2.0; } if rel.y < -half.y { rel.y += half.y * 2.0; }
        tf.translation.x = (ctl.pos.x + rel.x).round(); tf.translation.y = (ctl.pos.y + rel.y).round();
        let tw = 0.5 + 0.5 * (t * 0.9 + m.phase * 3.1).sin();
        s.color = if n > 0.4 { Color::srgba(1.0, 0.95, 0.8, (0.18 + 0.4 * tw) * n) } else { Color::srgba(0.45, 0.58, 0.56, 0.10 + 0.22 * tw) };
    }
}

#[allow(clippy::too_many_arguments)]
fn grade(mut g: ResMut<Grade>, clock: Res<Clock>, time: Res<Time>, keys: Res<ButtonInput<KeyCode>>, mut grade_q: Query<&mut BackgroundColor, (With<GradeOverlay>, Without<DimOverlay>)>, mut dim_q: Query<&mut BackgroundColor, (With<DimOverlay>, Without<GradeOverlay>)>,
    mut scan: Query<(&mut ImageNode, &mut Visibility), (With<ScanOverlay>, Without<GrainOverlay>, Without<NightVignette>)>, mut grain: Query<(&mut ImageNode, &mut Node, &mut Visibility), (With<GrainOverlay>, Without<ScanOverlay>, Without<NightVignette>)>, mut nvig: Query<&mut ImageNode, (With<NightVignette>, Without<ScanOverlay>, Without<GrainOverlay>)>, mut frame: Local<u32>) {
    if keys.just_pressed(KeyCode::KeyG) { g.film = (g.film + 1) % 3; }
    let n = clock.night();
    let dt = time.delta_secs();
    // global fluorescent hiccup every minute or so
    g.next_flick -= dt;
    if g.next_flick <= 0.0 { g.flick = 0.22; g.next_flick = 45.0 + (time.elapsed_secs() * 7.3).sin().abs() * 60.0; }
    let hic = if g.flick > 0.0 { g.flick -= dt; if (g.flick * 55.0).sin() > 0.2 { 0.05 } else { 0.0 } } else { 0.0 };
    // Severance grade: cool teal by day, deep green-teal by night
    for mut b in &mut grade_q { b.0 = Color::srgba(0.18 - 0.12 * n, 0.50 - 0.28 * n, 0.46 - 0.22 * n, 0.045 + 0.10 * n + hic); }
    g.dim += ((if g.banner_on { 0.22 } else { 0.0 }) - g.dim) * (dt * 5.0).min(1.0);
    for mut b in &mut dim_q { b.0 = Color::srgba(0.0, 0.03, 0.03, g.dim); }
    // a soft edge falloff even by day (focus on the islands), deep at night, deeper during a big moment
    for mut i in &mut nvig { i.color = Color::srgba(1.0, 1.0, 1.0, (0.22 + 0.78 * n + g.dim * 1.5).min(1.0)); }
    let (sa, ga) = match g.film { 0 => (0.0, 0.0), 1 => (0.28, 0.045), _ => (0.7, 0.10) };
    for (mut i, mut v) in &mut scan { i.color = Color::srgba(1.0, 1.0, 1.0, sa); *v = if sa > 0.0 { Visibility::Inherited } else { Visibility::Hidden }; }
    *frame += 1;
    for (mut i, mut nd, mut v) in &mut grain {
        i.color = Color::srgba(1.0, 1.0, 1.0, ga); *v = if ga > 0.0 { Visibility::Inherited } else { Visibility::Hidden };
        if *frame % 3 == 0 { let h = hash2(*frame, 1, 9); nd.left = Val::Px(-((h % 64) as f32)); nd.top = Val::Px(-(((h >> 8) % 64) as f32)); }
    }
}

// ------------------------------------------------------------------ particles
fn spawn_puff(cmd: &mut Commands, at: Vec2, col: Color, size: Vec2, vel: Vec2, life: f32, sway: f32, grav: f32, z: f32) {
    cmd.spawn((Sprite::from_color(col, size), Transform::from_xyz(at.x, at.y, z), Puff { vel, t: 0.0, life, sway, grav, a0: col.alpha() }));
}

fn steam(mut cmd: Commands, time: Res<Time>, machines: Res<Machines>, mut q: Query<(&mut SteamSource, &Transform)>, data: Res<Data>, mut printer_t: Local<f32>) {
    let dt = time.delta_secs();
    for (mut s, tf) in &mut q {
        s.t += dt;
        let every = if machines.coffee_broken { 0.12 } else { 0.55 };
        if s.t > every {
            s.t = 0.0;
            let h = hash2((time.elapsed_secs() * 100.0) as u32, 3, 5);
            let col = if machines.coffee_broken { Color::srgba(0.35, 0.33, 0.32, 0.55) } else { Color::srgba(1.0, 1.0, 1.0, 0.75) };
            spawn_puff(&mut cmd, tf.translation.truncate() + Vec2::new((h % 5) as f32 - 2.0, 4.0), col, Vec2::splat(if h % 3 == 0 { 2.0 } else { 1.0 }), Vec2::new(0.0, 9.0), 1.4, 2.0, 0.0, 470.0);
        }
    }
    // paper flutter around a jammed printer
    if machines.printer_jam {
        *printer_t += dt;
        if *printer_t > 0.35 { *printer_t = 0.0; if let Some(f) = data.0.layout.furniture.iter().find(|f| f.kind == "printer") {
            let h = hash2((time.elapsed_secs() * 50.0) as u32, 9, 2);
            let p = Vec2::new((f.x as f32 + 0.5) * TILE, -(f.y as f32) * TILE + 6.0);
            spawn_puff(&mut cmd, p, Color::srgb(0.98, 0.97, 0.94), Vec2::new(3.0, 2.0), Vec2::new((h % 30) as f32 - 15.0, 22.0), 1.8, 10.0, 26.0, 470.0);
        } }
    }
}

/// little scuffs of carpet dust behind walkers (more when running), only near the camera and capped
fn footsteps(mut cmd: Commands, time: Res<Time>, clock: Res<Clock>, ctl: Res<CamCtl>, win: Query<&Window>, q: Query<(Entity, &Agent, &Mover, &Pose)>, live: Query<(), With<Puff>>, mut acc: Local<HashMap<Entity, f32>>) {
    if clock.paused { return; }
    let dt = time.delta_secs().min(0.05);
    if live.iter().count() > 140 { return; }
    let view = win.single().map(|w| Vec2::new(w.width(), w.height())).unwrap_or(Vec2::new(1280.0, 800.0)) / ctl.zoom.max(1.0);
    let n = clock.night();
    for (e, a, m, p) in &q {
        if p.hidden || m.arrived || m.vel.length_squared() < 0.01 { continue; }
        let w = Vec2::new(m.pos.x * TILE, -m.pos.y * TILE);
        if (w - ctl.pos).abs().cmpgt(view * 0.6).any() { continue; }
        let run = a.plan.run;
        let t = acc.entry(e).or_insert((a.seed % 7) as f32 * 0.05);
        *t += dt;
        let every = if run { 0.09 } else { 0.42 };
        if *t < every { continue; }
        *t = 0.0;
        let h = hash2(e.index(), (time.elapsed_secs() * 60.0) as u32, 17);
        let back = -m.vel.normalize_or_zero();
        let side = Vec2::new(-back.y, back.x) * (((h % 5) as f32 - 2.0) * 0.8);
        let pos = w + Vec2::new(back.x * 3.0, -back.y * 3.0) + side + Vec2::new(0.0, 1.0);
        let col = if n > 0.5 { Color::srgba(0.75, 0.82, 0.9, if run { 0.35 } else { 0.18 }) } else { Color::srgba(0.80, 0.78, 0.70, if run { 0.55 } else { 0.3 }) };
        let sz = if run && h % 2 == 0 { 2.0 } else { 1.0 };
        let v = Vec2::new(back.x * 6.0 + ((h >> 4) % 7) as f32 - 3.0, 4.0 + ((h >> 8) % 5) as f32);
        spawn_puff(&mut cmd, pos, col, Vec2::splat(sz), v, if run { 0.55 } else { 0.4 }, 1.0, 10.0, crate::sim::ysort_z(-w.y) - 0.03);
    }
    if acc.len() > 400 { acc.clear(); }
}

fn puffs(mut cmd: Commands, time: Res<Time>, mut q: Query<(Entity, &mut Puff, &mut Transform, &mut Sprite)>) {
    let dt = time.delta_secs().min(0.05);
    for (e, mut p, mut tf, mut s) in &mut q {
        p.t += dt;
        if p.t >= p.life { cmd.entity(e).despawn(); continue; }
        p.vel.y -= p.grav * dt;
        let sw = (p.t * 6.0 + tf.translation.x * 0.1).sin() * p.sway;
        tf.translation.x += (p.vel.x + sw) * dt; tf.translation.y += p.vel.y * dt;
        let k = p.t / p.life;
        s.color = s.color.with_alpha(p.a0 * (1.0 - k * k));
    }
}

// ------------------------------------------------------------------ big moments: banner, dim, everyone turns to look, confetti
#[allow(clippy::too_many_arguments)]
fn big_moments(mut cmd: Commands, bus: Res<Bus>, data: Res<Data>, mut g: ResMut<Grade>, mut dir: ResMut<Director>, time: Res<Time>, mut last: Local<u32>, mut q: Query<(Entity, &Agent, &mut Mover, &Pose)>, mut emote: EventWriter<Emote>,
    mut text: Query<&mut Text, (With<BannerText>, Without<BannerSub>)>, mut sub: Query<&mut Text, (With<BannerSub>, Without<BannerText>)>) {
    let newest = bus.active.iter().map(|a| a.serial).max().unwrap_or(*last);
    if newest <= *last { return; }
    for a in bus.active.iter().filter(|a| a.serial > *last) {
        let ev = &data.0.events[a.def];
        if !BIG.contains(&a.id.as_str()) && !(ev.manual && ev.radius.is_none()) { continue; }
        g.banner_t = 0.0; g.banner_on = true;
        for mut t in &mut text { t.0 = clean(&ev.name).to_uppercase(); }
        for mut t in &mut sub { t.0 = match a.id.as_str() { "prod-down" | "fire-drill" | "overtime-protocol" => "ATTENTION - ALL REFINERS".into(), "funding-round" | "quota-reached" | "reward-party" | "deploy-success" => "A CELEBRATION HAS BEEN SANCTIONED".into(), "night-shift" | "dawn" => "SHIFT NOTICE".into(), _ => "A MESSAGE FROM THE BOARD".into() }; }
        let now = time.elapsed_secs();
        if let Some(p) = a.pos { dir.cue = Some((p, now + 7.0)); }
        // everyone on the floor turns to look; a few react
        let mut k = 0u32;
        for (e, ag, mut mv, pose) in &mut q {
            if pose.hidden || ag.plan.act.absent() || matches!(ag.role, Role::Goat | Role::Dog) { continue; }
            if mv.arrived { let look = a.pos.unwrap_or(mv.pos + Vec2::new(0.0, 3.0)); if (look - mv.pos).length() > 0.3 { mv.facing = Facing::from_vec(look - mv.pos); } }
            k += 1;
            if hash2(e.index(), a.serial, 4) % 4 == 0 { emote.write(Emote { who: e, icon: if matches!(a.id.as_str(), "prod-down" | "fire-drill" | "coffee-machine-breaks") { "!".into() } else { "?".into() } }); }
        }
        let _ = k;
        // confetti burst for celebrations
        if matches!(a.id.as_str(), "funding-round" | "quota-reached" | "reward-party" | "deploy-success" | "birthday-cake" | "pizza-arrives" | "donut-drop" | "taco-tuesday") {
            let c = tile_to_world(a.pos.unwrap_or(Vec2::new(data.0.layout.w as f32 * 0.5, data.0.layout.h as f32 * 0.5)));
            let cols = [Color::srgb(0.89, 0.52, 0.29), Color::srgb(0.49, 0.95, 0.63), Color::srgb(0.95, 0.82, 0.45), Color::srgb(0.6, 0.85, 0.95), Color::srgb(0.93, 0.55, 0.64)];
            for i in 0..70u32 {
                let h = hash2(i, a.serial, 77);
                let ang = (h % 628) as f32 / 100.0; let sp = 30.0 + ((h >> 9) % 60) as f32;
                spawn_puff(&mut cmd, c + Vec2::new(0.0, 10.0), cols[(h % 5) as usize], Vec2::new(if h % 2 == 0 { 2.0 } else { 1.0 }, 2.0), Vec2::new(ang.cos() * sp, ang.sin().abs() * sp + 40.0), 2.6, 8.0, 70.0, 480.0);
            }
        }
    }
    *last = newest;
}

fn banner_anim(mut g: ResMut<Grade>, time: Res<Time>, mut q: Query<&mut Node, With<Banner>>) {
    g.banner_t += time.delta_secs();
    let t = g.banner_t;
    let y = if t < 0.45 { -90.0 + 160.0 * ease_out_back(t / 0.45) } else if t < 4.2 { 70.0 } else if t < 4.7 { 70.0 - 160.0 * ease_in_out((t - 4.2) / 0.5) } else { -90.0 };
    if t > 4.2 { g.banner_on = false; }
    for mut n in &mut q { n.top = Val::Px(y.round()); }
}

// ------------------------------------------------------------------ meetings: slides; dozing; idle fidgets
fn slides(time: Res<Time>, rooms: Res<Rooms>, imgs: Option<Res<FxImages>>, mut q: Query<(&mut Slide, &mut Sprite)>) {
    let Some(imgs) = imgs else { return };
    let dt = time.delta_secs();
    for (mut s, mut sp) in &mut q {
        let busy = rooms.states.get(s.room).map_or(false, |r| r.count > 0);
        s.t += dt;
        let want = if busy { if s.t > 5.5 { s.t = 0.0; (s.k + 1 + (s.room % 2)) % 4 } else if s.k == 4 { 0 } else { s.k } } else { 4 };
        if want != s.k { s.k = want; sp.image = imgs.slides[want].clone(); }
        // quick "next slide" flash
        let f = if busy && s.t < 0.12 { 0.75 } else { 1.0 };
        sp.color = Color::srgba(f, f, f, if busy { 1.0 } else { 0.85 });
    }
}

/// idle people glance around; bored meeting attendees doze off; standing listeners nod
fn fidgets(time: Res<Time>, clock: Res<Clock>, mut q: Query<(Entity, &mut Agent, &mut Mover, &mut Pose)>) {
    if clock.paused { return; }
    let t = time.elapsed_secs();
    let slot = (t * 0.5) as u32;
    for (e, mut a, mut mv, mut pose) in &mut q {
        if pose.hidden || !mv.arrived || a.react_anim.is_some() { continue; }
        let h = hash2(e.index(), slot, 21);
        match a.plan.act {
            Act::Meeting { .. } => {
                if a.needs.energy < 0.4 && h % 97 == 0 && a.plan.anim == Anim::Sit { a.react_anim = Some((Anim::Doze, 5.0)); }
                else if h % 37 == 0 && a.plan.anim == Anim::Sit { a.react_anim = Some((Anim::Nod, 1.6)); }
                else if h % 61 == 0 && !matches!(a.plan.anim, Anim::Sit | Anim::Type) { pose.squash = 1.0; }
            }
            Act::Desk | Act::Snack | Act::Visit { .. } | Act::Wander | Act::Queue { .. } | Act::Leaving | Act::Waiting { .. } => {
                if h % 211 == 0 && matches!(a.plan.act, Act::Desk) { a.react_anim = Some((Anim::Stretch, 1.3)); continue; }
                if h % 173 == 0 && !matches!(a.plan.anim, Anim::Type | Anim::Sit | Anim::Sleep) { a.react_anim = Some((Anim::Fidget, 2.0)); continue; }
                if h % 53 == 0 && !matches!(a.plan.anim, Anim::Type | Anim::Sit | Anim::Sleep) {
                    let f = mv.facing; mv.facing = match (f, h % 2) { (Facing::Down, 0) | (Facing::Up, 0) => Facing::Left, (Facing::Down, _) | (Facing::Up, _) => Facing::Right, _ => Facing::Down };
                }
            }
            _ => {}
        }
    }
}

/// props with day/night states in the atlas (the aquarium's night glow) follow the light cycle
fn day_night_props(clock: Res<Clock>, at: Res<crate::atlas::ArtAtlas>, machines: Res<Machines>, mut q: Query<&mut Animated>) {
    let night = clock.night() > 0.5;
    for mut a in &mut q {
        let Some(p) = at.prop(&a.prop) else { continue };
        let (Some(day), Some(nt)) = (p.states.get("day"), p.states.get("night")) else { continue };
        // the tank without Gerald while he is missing
        let (day, nt) = if machines.gerald_missing { (p.states.get("day_nogerald").unwrap_or(day), p.states.get("night_nogerald").unwrap_or(nt)) } else { (day, nt) };
        let want = if night { nt } else { day };
        if &a.frames != want { a.frames = want.clone(); }
    }
}

/// the amphitheatre's rows fade in as people gather for an assembly and vanish again afterwards
fn ghost_seats(people: Query<(&Agent, &Mover)>, mut seats: Query<(&GhostSeat, &mut Sprite)>, mut counts: Local<Vec<usize>>) {
    counts.clear();
    let mut pos: Vec<Vec2> = vec![];
    for (a, m) in &people {
        if let Act::Meeting { room, .. } = a.plan.act { if counts.len() <= room { counts.resize(room + 1, 0); } counts[room] += 1; }
        if m.arrived && matches!(a.plan.anim, Anim::Sit) { pos.push(m.pos); }
    }
    for (g, mut s) in &mut seats {
        // a chair only materialises under someone actually taking it: no empty rows, ever
        let near = pos.iter().any(|p| (*p - g.at).length() < 0.6);
        let target = if near { 1.0 } else { 0.0 };
        let a = s.color.alpha();
        s.color = s.color.with_alpha(a + (target - a) * 0.06);
    }
}

/// a pod shows its sleeper (atlas state `occupied`) while someone naps beside / in it
fn nap_pods(at: Res<crate::atlas::ArtAtlas>, people: Query<(&Agent, &Mover, &Pose)>, mut pods: Query<(&NapPod, &mut Sprite)>) {
    let Some(p) = at.prop("nap-pod") else { return };
    let (Some(open), Some(occ)) = (p.states.get("open").and_then(|v| v.first().copied()), p.states.get("occupied").and_then(|v| v.first().copied())) else { return };
    let sleepers: Vec<Vec2> = people.iter().filter(|(a, m, ps)| !ps.hidden && m.arrived && (a.plan.act == Act::Nap || a.plan.anim == Anim::Sleep)).map(|(_, m, _)| m.pos).collect();
    for (pod, mut s) in &mut pods {
        let busy = sleepers.iter().any(|q| (*q - pod.at).length() < 1.8);
        let fi = if busy { occ } else { open };
        if fi < p.frames.len() { s.rect = Some(p.frames[fi]); }
    }
}
