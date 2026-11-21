//! Speech bubbles: world-space 9-slice bubbles (ART) with Silkscreen text, pop-in/out easing,
//! per-person rate limiting and priority, a global cap, and collision-free stacking.
use crate::agents::*;
use crate::atlas::*;
use crate::render::Speaking;
use crate::sim::*;
use crate::world::*;
use bevy::prelude::*;
use bevy::sprite::Anchor;
use bevy::text::{FontSmoothing, TextBounds, TextLayoutInfo};

pub struct BubblesPlugin;
impl Plugin for BubblesPlugin {
    fn build(&self, app: &mut App) { app.init_resource::<BubbleAudit>().add_systems(Update, (spawn_bubbles, layout_bubbles).chain().after(SimSet::Visual)); }
}

/// on-screen life of a bubble (real seconds); banter uses it to space lines so they never overlap
pub fn bubble_life(text: &str, secs: f32, speed: f32) -> f32 {
    ((1.6 + text.chars().count() as f32 * 0.05).clamp(2.0, 5.0) * secs.max(1.0) / 3.0).clamp(1.8, 5.5) / speed.max(1.0).sqrt().min(2.0)
}

#[derive(Resource, Default)]
pub struct BubbleAudit { pub frames: u64, pub overlap_frames: u64, pub now: usize, pub max: usize }

#[derive(Component)]
pub struct Bubble { pub owner: Entity, pub t: f32, pub life: f32, pub prio: u8, pub size: Vec2, pub pos: Vec2, pub ready: bool }
#[derive(Component)]
pub struct BubbleText;
#[derive(Component)]
pub struct BubblePart(pub u8); // 0..8 nine-slice, 9 tail

const MAX_BUBBLES: usize = 9;
const WRAP: f32 = 112.0;

#[allow(clippy::too_many_arguments)]
fn spawn_bubbles(mut cmd: Commands, mut ev: EventReader<Say>, at: Res<ArtAtlas>, fonts: Res<Fonts>, clock: Res<Clock>, time: Res<Time>, mut q: Query<(&mut Agent, &Pose)>, existing: Query<(Entity, &Bubble)>, banter: Res<crate::banter::BanterState>, delayed: Res<crate::events::DelayedSay>) {
    let now = time.elapsed_secs() as f64;
    let dnow = delayed.now;
    let mut count = existing.iter().count();
    let mut taken: Vec<Entity> = vec![];
    for s in ev.read() {
        let Ok((mut a, pose)) = q.get_mut(s.who) else { continue };
        // banter owns its speakers: ambient chatter waits until the exchange is over
        if s.prio < 3 && banter.until.get(&s.who).map_or(false, |u| *u > dnow) { continue; }
        if pose.hidden || pose.alpha < 0.5 || taken.contains(&s.who) { continue; }
        let mine = existing.iter().find(|(_, b)| b.owner == s.who);
        if let Some((_, b)) = mine { if b.prio > s.prio { continue; } }
        // rate limit chatter (high-priority event lines always get through)
        let gap = match s.prio { 0 => 6.0, 1 => 2.0, _ => 0.6 };
        if now - a.last_say < gap && mine.is_none() && s.prio < 2 { continue; }
        if count >= MAX_BUBBLES && mine.is_none() { if s.prio < 2 { continue; } if let Some((e, _)) = existing.iter().filter(|(_, b)| b.prio < 2).min_by(|x, y| (x.1.life - x.1.t).partial_cmp(&(y.1.life - y.1.t)).unwrap()) { cmd.entity(e).despawn(); count -= 1; } else { continue; } }
        if let Some((e, _)) = mine { cmd.entity(e).despawn(); count -= 1; }
        let text = clean(&s.text);
        if text.is_empty() { continue; }
        a.last_say = now;
        taken.push(s.who);
        // reading time scales with length; shortened (not below readable) at high sim speeds
        let life = bubble_life(&text, s.secs, clock.speed);
        let col = if s.prio >= 2 { Color::srgb(0.16, 0.15, 0.13) } else { Color::srgb(0.16, 0.15, 0.13) };
        let bub = cmd.spawn((Transform::from_xyz(0.0, 0.0, 900.0).with_scale(Vec3::splat(0.01)), Visibility::Hidden, Bubble { owner: s.who, t: 0.0, life, prio: s.prio, size: Vec2::ZERO, pos: Vec2::ZERO, ready: false })).with_children(|p| {
            let pd = at.prop("bubble").cloned();
            for k in 0..9u8 {
                let spr = match &pd { Some(d) => { let r = d.frames[0]; let sl = d.slice.max(1.0); let (cx, cy) = (k % 3, k / 3); let xs = [r.min.x, r.min.x + sl, r.max.x - sl, r.max.x]; let ys = [r.min.y, r.min.y + sl, r.max.y - sl, r.max.y];
                    Sprite { image: at.sheet.clone(), rect: Some(Rect::new(xs[cx as usize], ys[cy as usize], xs[cx as usize + 1], ys[cy as usize + 1])), anchor: Anchor::TopLeft, ..default() } }
                    None => Sprite { color: if k == 4 { Color::srgb(0.98, 0.97, 0.94) } else { Color::srgb(0.16, 0.15, 0.13) }, anchor: Anchor::TopLeft, custom_size: Some(Vec2::ONE), ..default() } };
                p.spawn((spr, Transform::from_xyz(0.0, 0.0, 0.0), BubblePart(k)));
            }
            let tail = at.sprite("bubble_tail", 0).unwrap_or(Sprite { color: Color::srgb(0.98, 0.97, 0.94), custom_size: Some(Vec2::new(5.0, 4.0)), ..default() });
            p.spawn((tail, Transform::from_xyz(0.0, 0.0, 0.01), BubblePart(9)));
            p.spawn((Text2d::new(text.to_uppercase()), TextFont { font: fonts.px.clone(), font_size: 8.0, font_smoothing: FontSmoothing::None, ..default() }, TextColor(col), TextLayout::new_with_justify(JustifyText::Center), TextBounds::new_horizontal(WRAP), Anchor::TopCenter, Transform::from_xyz(0.0, 0.0, 0.02), BubbleText));
        }).id();
        let _ = bub;
        cmd.entity(s.who).insert(Speaking);
        count += 1;
    }
}

#[allow(clippy::too_many_arguments)]
fn layout_bubbles(
    mut cmd: Commands, time: Res<Time>, win: Query<&Window>, at: Res<ArtAtlas>,
    mut bubs: Query<(Entity, &mut Bubble, &mut Transform, &mut Visibility, &Children)>,
    owners: Query<(&GlobalTransform, &Pose), With<Agent>>,
    texts: Query<&TextLayoutInfo, With<BubbleText>>,
    mut parts: Query<(&BubblePart, &mut Sprite, &mut Transform), Without<Bubble>>,
    mut text_tf: Query<&mut Transform, (With<BubbleText>, Without<Bubble>, Without<BubblePart>)>, mut baud: ResMut<BubbleAudit>,
    cam: Query<(&Camera, &GlobalTransform), With<Camera2d>>, grade: Res<crate::fx::Grade>, emotes: Query<&GlobalTransform, With<crate::render::EmoteFx>>,
) {
    let view = win.single().map(|w| Vec2::new(w.width(), w.height())).unwrap_or(Vec2::new(1280.0, 800.0));
    let camq = cam.single().ok();
    // HUD keep-out zones (screen px): clock top-left, controls top-right, the banner while it is down
    let zones: Vec<Rect> = { let mut z = vec![Rect::new(0.0, 0.0, 240.0, 70.0), Rect::new(view.x - 250.0, 0.0, view.x, 46.0), Rect::new(0.0, view.y - 44.0, 190.0, view.y)]; if view.x < 720.0 { z.push(Rect::new(0.0, view.y - 120.0, view.x, view.y)); } else { z.push(Rect::new(view.x - 320.0, view.y - 112.0, view.x, view.y)); } if grade.banner_on { z.push(Rect::new(view.x * 0.5 - 230.0, 0.0, view.x * 0.5 + 230.0, 130.0)); } z };
    let dt = time.delta_secs();
    let sf = win.single().map(|w| w.scale_factor()).unwrap_or(1.0);
    let slice = at.prop("bubble").map(|d| d.slice).unwrap_or(5.0);
    let tail_h = at.prop("bubble_tail").map(|d| d.size().y).unwrap_or(4.0);
    // 1) measure + desired positions
    let mut items: Vec<(Entity, Vec2, Vec2)> = vec![];
    for (e, mut b, _, _, children) in &mut bubs {
        b.t += dt;
        let Ok((gt, pose)) = owners.get(b.owner) else { cmd.entity(e).despawn(); continue };
        if b.t >= b.life || pose.hidden { cmd.entity(e).despawn(); cmd.entity(b.owner).remove::<Speaking>(); continue; }
        for c in children.iter() { if let Ok(info) = texts.get(c) { let s = info.size / sf; if s.x > 0.0 { b.size = Vec2::new((s.x + 10.0).round().max(16.0), (s.y + 6.0).round().max(13.0)); b.ready = true; } } }
        if !b.ready { continue; }
        let head = gt.translation().truncate() + Vec2::new(0.0, 33.0);
        items.push((e, head, b.size));
    }
    // 2) resolve overlaps: process bottom-up, push later bubbles upward until clear
    items.sort_by(|a, b| a.1.y.partial_cmp(&b.1.y).unwrap());
    // emote icons are obstacles too: a bubble never lands on someone else's emote
    let mut placed: Vec<(Vec2, Vec2)> = emotes.iter().map(|g| { let c = g.translation().truncate(); (Vec2::new(c.x, c.y - 9.0), Vec2::new(16.0, 18.0)) }).collect(); // (bottom-centre, size)
    let n_fixed = placed.len();
    let mut targets: Vec<(Entity, Vec2, f32)> = vec![];
    for (e, head, size) in items {
        let mut p = Vec2::new(head.x, head.y + tail_h);
        if let Some((c, g)) = camq { if let (Ok(l), Ok(r)) = (c.viewport_to_world_2d(g, Vec2::new(6.0, 0.0)), c.viewport_to_world_2d(g, Vec2::new(view.x - 6.0, 0.0))) {
            let (lo, hi) = (l.x + size.x * 0.5, r.x - size.x * 0.5); if lo < hi { p.x = p.x.clamp(lo, hi); } } }
        for _ in 0..12 {
            let mut moved = false;
            for (q, qs) in &placed {
                let ox = (p.x - q.x).abs() < (size.x + qs.x) * 0.5 + 2.0;
                let oy = p.y < q.y + qs.y + 2.0 && p.y + size.y + 2.0 > q.y;
                if ox && oy { p.y = q.y + qs.y + 3.0; moved = true; }
            }
            if !moved { break; }
        }
        placed.push((p, size));
        targets.push((e, p, head.x));
    }
    // audit: resolved bubble rects must never overlap (exported to window.__office for the soak test)
    let mut n = 0;
    for i in 0..placed.len() { for j in (i + 1).max(n_fixed)..placed.len() {
        let ((a, asz), (b, bsz)) = (placed[i], placed[j]);
        if (a.x - b.x).abs() < (asz.x + bsz.x) * 0.5 && a.y < b.y + bsz.y && b.y < a.y + asz.y { n += 1; }
    } }
    baud.frames += 1; baud.now = n; if n > 0 { baud.overlap_frames += 1; } baud.max = baud.max.max(placed.len() - n_fixed);
    // 3) apply (smoothly), pop animation, nine-slice sizing
    for (e, p, hx) in targets {
        let Ok((_, mut b, mut tf, mut vis, children)) = bubs.get_mut(e) else { continue };
        if b.pos == Vec2::ZERO { b.pos = p; } else { let bp = b.pos; b.pos = bp + (p - bp) * (dt * 14.0).min(1.0); }
        let t = b.t;
        let pop = if t < 0.18 { ease_out_back(t / 0.18) } else if t > b.life - 0.18 { ((b.life - t) / 0.18).max(0.0) } else { 1.0 };
        let bottom = Vec2::new(b.pos.x.round(), b.pos.y.round());
        tf.translation = Vec3::new(bottom.x, bottom.y, 900.0 + (1000.0 - bottom.y) * 0.0001);
        // squash & stretch on pop-in
        let wob = if t < 0.5 { (t * 30.0).sin() * (-t * 8.0).exp() * 0.14 } else { 0.0 };
        tf.scale = Vec3::new((pop * (1.0 + wob)).max(0.01), (pop * (1.0 - wob)).max(0.01), 1.0);
        let (w, h) = (b.size.x, b.size.y);
        // never draw a bubble under the HUD / banner: it waits (hidden) until the camera or the banner moves
        let blocked = camq.map_or(false, |(c, g)| {
            let a = c.world_to_viewport(g, Vec3::new(bottom.x - w * 0.5, bottom.y + h, 0.0)).ok();
            let z = c.world_to_viewport(g, Vec3::new(bottom.x + w * 0.5, bottom.y, 0.0)).ok();
            match (a, z) { (Some(a), Some(z)) => { let r = Rect::from_corners(a, z); zones.iter().any(|k| !k.intersect(r).is_empty()) } _ => false }
        });
        *vis = if blocked { Visibility::Hidden } else { Visibility::Inherited };
        let sl = slice;
        for c in children.iter() {
            if let Ok((part, mut s, mut ptf)) = parts.get_mut(c) {
                if part.0 == 9 { let lim = (w * 0.5 - sl - 2.0).max(0.0); ptf.translation = Vec3::new((hx - bottom.x).clamp(-lim, lim).round(), 1.0 - tail_h * 0.5 + 0.5, 0.01); continue; }
                let (cx, cy) = (part.0 % 3, part.0 / 3);
                let xs = [-w / 2.0, -w / 2.0 + sl, w / 2.0 - sl]; let ws = [sl, w - 2.0 * sl, sl];
                let ys = [h, h - sl, sl]; let hs = [sl, h - 2.0 * sl, sl];
                ptf.translation = Vec3::new(xs[cx as usize].round(), ys[cy as usize].round(), 0.0);
                s.custom_size = Some(Vec2::new(ws[cx as usize].max(0.0), hs[cy as usize].max(0.0)));
            }
            if let Ok(mut ttf) = text_tf.get_mut(c) { ttf.translation = Vec3::new(0.0, (h - 3.0).round(), 0.02); }
        }
    }
}
