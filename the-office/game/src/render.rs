//! Render & lighting: people (ART sheets, procedural fallback), shadows, y-sort, seated layering,
//! emotes, FX + party props, elevator animation, animated props / machine states, light cycle,
//! CRT + lamp glows, flashlight cones, the infinite void grid.
use crate::agents::*;
use crate::agents::Anim;
use crate::art::{self, Canvas, Rgba};
use crate::atlas::*;
use crate::data::*;
use crate::events::*;
use crate::roles::{Elevator, Phase};
use crate::sim::*;
use crate::world::*;
use bevy::prelude::*;
use crate::art::ArtCache;
use bevy::sprite::Anchor;

pub struct RenderPlugin;
impl Plugin for RenderPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<Ambient>().add_systems(Update, (attach_visuals, sync_people, emotes_spawn, emotes_tick, fx_spawn, fx_tick, elevator_anim, animate_props, bobbing, quota_bars, room_signs, ambient_light, glows, void_grid).chain().in_set(SimSet::Visual));
    }
}

#[derive(Resource)]
pub struct Ambient { pub color: Color, pub night: f32 }
impl Default for Ambient { fn default() -> Self { Ambient { color: Color::WHITE, night: 0.0 } } }

#[derive(Component)]
pub struct Body { pub owner: Entity, pub art: bool, pub sheet: SheetKind }
#[derive(Clone, Copy, PartialEq)]
pub enum SheetKind { Person, Animal, Proc }
#[derive(Component)]
pub struct ShadowOf;
#[derive(Component)]
pub struct SelectRing;
#[derive(Component)]
pub struct Zzz;
#[derive(Component)]
pub struct Cone;
#[derive(Component)]
pub struct EmoteFx { pub t: f32, pub life: f32 }
#[derive(Component)]
pub struct FxSprite { pub t: f32, pub life: f32, pub prop: String, pub fps: f32, pub looped: bool, pub rise: f32, pub base: Vec3 }
#[derive(Component)]
pub struct VoidTile;
/// marker set by the bubble system while a person is speaking (emotes wait)
#[derive(Component)]
pub struct Speaking;
#[derive(Resource, Default)]
pub struct Selected(pub Option<Entity>);

fn dir_str(f: Facing) -> &'static str { match f { Facing::Down => "S", Facing::Up => "N", Facing::Right => "E", Facing::Left => "W" } }
pub fn anim_name(a: Anim) -> &'static str { match a { Anim::Idle => "idle", Anim::Walk => "walk", Anim::Run => "run", Anim::Talk => "talk", Anim::Type => "type", Anim::Sleep => "sleep", Anim::Celebrate => "celebrate", Anim::Facepalm => "facepalm", Anim::Sit => "sit", Anim::Drink => "drink", Anim::Tired => "tired", Anim::Phone => "phone", Anim::Knock => "knock", Anim::Wave => "wave", Anim::Clap => "clap", Anim::Flashlight => "flashlight", Anim::Stretch => "stretch", Anim::Nod => "nod", Anim::Doze => "doze", Anim::Bow => "bow", Anim::Pet => "pet", Anim::Fidget => "fidget" } }
pub fn seated(a: Anim) -> bool { matches!(a, Anim::Type | Anim::Sleep | Anim::Sit | Anim::Doze | Anim::Nod) }

#[allow(clippy::too_many_arguments)]
fn attach_visuals(mut cmd: Commands, q: Query<(Entity, &Agent), Added<Agent>>, at: Res<ArtAtlas>, data: Res<Data>, mut images: ResMut<Assets<Image>>, cache: Res<ArtCache>) {
    for (e, a) in &q {
        let (sprite, art_ok, kind) = match a.role {
            Role::Goat | Role::Dog => {
                let key = if a.role == Role::Goat { "goat" } else { "dog" };
                match at.animals.get(key) {
                    Some((img, def, lay)) => (Sprite { image: img.clone(), texture_atlas: Some(TextureAtlas { layout: lay.clone(), index: 0 }), anchor: def.anchor(), ..default() }, true, SheetKind::Animal),
                    None => (Sprite { image: images.add(art::person_sheet(&Look::default(), a.seed, art::Kind::Goat)), texture_atlas: Some(TextureAtlas { layout: cache.layout.clone(), index: 0 }), anchor: Anchor::BottomCenter, ..default() }, false, SheetKind::Proc),
                }
            }
            _ => {
                let h = at.by_person.get(&a.id).cloned().or_else(|| if at.presets.is_empty() { None } else { Some(at.presets[(a.seed as usize) % at.presets.len()].clone()) });
                match h {
                    Some(img) if at.ok => (Sprite { image: img, texture_atlas: Some(TextureAtlas { layout: at.people_layout.clone(), index: 0 }), anchor: at.people.anchor(), ..default() }, true, SheetKind::Person),
                    _ => {
                        let look = a.pi.map(|i| data.0.people[i].look.clone()).unwrap_or_default();
                        let k = match a.role { Role::Facilities => art::Kind::Facilities, Role::Supervisor => art::Kind::Supervisor, _ => art::Kind::Staff };
                        (Sprite { image: images.add(art::person_sheet(&look, a.seed, k)), texture_atlas: Some(TextureAtlas { layout: cache.layout.clone(), index: 0 }), anchor: Anchor::Custom(Vec2::new(0.0, -0.5 + 1.0 / 24.0)), ..default() }, false, SheetKind::Proc)
                    }
                }
            }
        };
        cmd.entity(e).with_children(|p| {
            p.spawn((sprite, Transform::from_xyz(0.0, 0.0, 0.0), Body { owner: e, art: art_ok, sheet: kind }));
            let sh = if matches!(a.role, Role::Goat | Role::Dog) { "shadow_goat" } else if at.prop("shadow_person_soft").is_some() { "shadow_person_soft" } else { "shadow_person" };
            let sspr = at.sprite(sh, 0).unwrap_or(Sprite { image: cache.shadow.clone(), ..default() });
            p.spawn((sspr, Transform::from_xyz(0.0, 0.0, -0.002), ShadowOf));
            if let Some(mut r) = at.sprite("select_ring", 0) { r.color = Color::srgba(1.0, 1.0, 1.0, 0.0); p.spawn((r, Transform::from_xyz(0.0, 0.0, -0.001), SelectRing)); }
            if let Some(mut z) = at.sprite("fx_zzz_big", 0).or_else(|| at.sprite("fx_zzz", 0)) { z.color = Color::srgba(1.0, 1.0, 1.0, 0.0); p.spawn((z, Transform::from_xyz(4.0, 26.0, 0.01), Zzz)); }
            if a.role == Role::Supervisor { if let Some(mut c) = at.sprite("fx_flashlight_S", 0) { c.color = Color::srgba(1.0, 1.0, 1.0, 0.0); p.spawn((c, Transform::from_xyz(0.0, 12.0, 0.02), Cone)); } }
        });
    }
}

#[allow(clippy::too_many_arguments)]
fn sync_people(
    clock: Res<Clock>, (idx, el): (Res<WorldIndex>, Res<Elevator>), at: Res<ArtAtlas>, amb: Res<Ambient>, sel: Res<Selected>, time: Res<Time>,
    mut q: Query<(Entity, &Agent, &Mover, &mut Pose, &mut Transform, &Children)>,
    mut bodies: Query<(&mut Sprite, &Body, &mut Transform), (Without<Agent>, Without<ShadowOf>, Without<SelectRing>, Without<Zzz>, Without<Cone>)>,
    mut shadows: Query<(&mut Sprite, &mut Visibility), (With<ShadowOf>, Without<Body>, Without<SelectRing>, Without<Zzz>, Without<Cone>)>,
    mut rings: Query<(&mut Sprite, &mut Transform), (With<SelectRing>, Without<Body>, Without<Agent>, Without<Zzz>, Without<Cone>, Without<ShadowOf>)>,
    mut zzz: Query<(&mut Sprite, &mut Transform), (With<Zzz>, Without<Body>, Without<Agent>, Without<SelectRing>, Without<Cone>, Without<ShadowOf>)>,
    mut cones: Query<(&mut Sprite, &mut Transform), (With<Cone>, Without<Body>, Without<Agent>, Without<SelectRing>, Without<Zzz>, Without<ShadowOf>)>,
) {
    let night = clock.night();
    let tsec = time.elapsed_secs();
    for (e, a, mv, mut pose, mut tf, children) in &mut q {
        pose.selected = sel.0 == Some(e);
        let anim = pose.anim.unwrap_or(Anim::Idle);
        let is_seated = seated(anim) && mv.arrived;
        // feet position in px (down), with the desk-pod seat correction while seated at one's desk
        let mut foot = Vec2::new(mv.pos.x * TILE, mv.pos.y * TILE);
        if is_seated { if let Some(di) = a.desk { if (mv.pos - a.home).length() < 0.3 { foot += idx.desk_seat_off.get(di).copied().unwrap_or(Vec2::ZERO); } } }
        // per-frame anim (+ fps)
        let facing = if a.react_anim.is_some() && pose.look.is_some() && !is_seated { Facing::from_vec(pose.look.unwrap() - mv.pos) } else { mv.facing };
        let lift = if anim == Anim::Celebrate { 0.0 } else { 0.0 };
        // standing in the elevator doorway: drawn in front of the car (inside the lit interior)
        let in_door = (mv.pos - el.door).length() < 1.3 && mv.pos.y < el.door.y + 0.7;
        let z = if in_door { zpx((el.door.y + 0.6) * TILE - 4.0) + 0.004 } else { zpx(foot.y) + 0.001 };
        tf.translation = Vec3::new(foot.x.round(), -(foot.y.round()) + lift, z);
        tf.scale = Vec3::ONE;
        for c in children.iter() {
            if let Ok((mut spr, body, mut btf)) = bodies.get_mut(c) {
                spr.color = amb.color.with_alpha(pose.alpha.clamp(0.0, 1.0));
                // gentle landing squash when an animation starts (1px drop), sub-pixel free
                btf.translation.y = if pose.squash > 0.6 && !is_seated && anim != Anim::Walk && anim != Anim::Run { -1.0 } else { 0.0 };
                if let Some(ta) = spr.texture_atlas.as_mut() {
                    ta.index = match body.sheet {
                        SheetKind::Person => {
                            let name = anim_name(anim);
                            let def = at.people.anims.get(name).cloned().unwrap_or(AnimDef { frames: 1, fps: 1.0, looped: true });
                            let mut f = (pose.t * def.fps) as usize + if anim == Anim::Idle { (a.seed % 8) as usize } else { 0 };
                            f = if def.looped { f % def.frames.max(1) } else { f.min(def.frames.saturating_sub(1)) };
                            let row = at.people.row(name, dir_str(facing)).or_else(|| at.people.row("idle", dir_str(facing))).unwrap_or(0);
                            row * at.people.cols as usize + f
                        }
                        SheetKind::Animal => {
                            let key = if a.role == Role::Goat { "goat" } else { "dog" };
                            let def = at.animals.get(key).map(|x| x.1.clone()).unwrap_or_default();
                            let name = if matches!(anim, Anim::Walk | Anim::Run) { "walk" } else { "idle" };
                            let ad = def.anims.get(name).cloned().unwrap_or(AnimDef { frames: 4, fps: 4.0, looped: true });
                            let row = def.row(name, dir_str(facing)).unwrap_or(0);
                            row * def.cols as usize + ((pose.t * ad.fps) as usize % ad.frames.max(1))
                        }
                        SheetKind::Proc => {
                            let col = match anim { Anim::Walk | Anim::Run | Anim::Flashlight => art::C_WALK + ((pose.t * if anim == Anim::Run { 12.0 } else { 8.0 }) as usize % 4), Anim::Type => art::C_TYPE + ((pose.t * 6.0) as usize % 2), Anim::Sit | Anim::Tired => art::C_SIT, Anim::Sleep => art::C_NAP, Anim::Celebrate | Anim::Clap | Anim::Wave => if (pose.t * 6.0) as usize % 2 == 0 { art::C_CHEER } else { art::C_IDLE }, Anim::Facepalm => art::C_FACEPALM, _ => if (tsec + a.seed as f32 % 5.0) % 4.0 < 0.15 { art::C_BLINK } else { art::C_IDLE } };
                            facing.row() * art::COLS as usize + col
                        }
                    };
                }
                let _ = body.art;
            }
            if let Ok((mut s, mut vis)) = shadows.get_mut(c) { *vis = if is_seated || pose.alpha < 0.05 { Visibility::Hidden } else { Visibility::Inherited }; s.color = Color::srgba(1.0, 1.0, 1.0, pose.alpha); }
            if let Ok((mut s, mut rt)) = rings.get_mut(c) {
                let target = if pose.selected { 1.0 } else { 0.0 };
                let cur = s.color.alpha(); s.color = Color::srgba(1.0, 1.0, 1.0, cur + (target - cur) * 0.2);
                if let (Some(p), Some(r)) = (at.prop("select_ring"), s.rect.as_mut()) { let fi = ((tsec * p.fps.max(1.0)) as usize) % p.frames.len(); *r = p.frames[fi]; }
                rt.translation.y = if is_seated { 0.0 } else { 0.0 };
            }
            if let Ok((mut s, mut zt)) = zzz.get_mut(c) {
                let on = matches!(anim, Anim::Sleep | Anim::Doze) && pose.alpha > 0.5;
                let cur = s.color.alpha(); s.color = Color::srgba(1.0, 1.0, 1.0, cur + ((if on { 1.0 } else { 0.0 }) - cur) * 0.1);
                if let (Some(p), Some(r)) = (at.prop("fx_zzz_big").or(at.prop("fx_zzz")), s.rect.as_mut()) { let fi = ((tsec * p.fps.max(1.0)) as usize) % p.frames.len(); *r = p.frames[fi]; }
                zt.translation = Vec3::new(5.0, 22.0, 0.05);
            }
            if let Ok((mut s, mut ct)) = cones.get_mut(c) {
                let on = night > 0.35 && !pose.hidden;
                let name = format!("fx_flashlight_{}", dir_str(mv.facing));
                if let Some(p) = at.prop(&name) { s.rect = Some(p.frames[0]); s.anchor = p.anchor_custom(); }
                let off = match mv.facing { Facing::Down => Vec2::new(3.0, 12.0), Facing::Up => Vec2::new(-3.0, 14.0), Facing::Left => Vec2::new(-4.0, 12.0), Facing::Right => Vec2::new(4.0, 12.0) };
                ct.translation = Vec3::new(off.x, off.y, if mv.facing == Facing::Up { -0.01 } else { 0.02 });
                let cur = s.color.alpha(); s.color = Color::srgba(1.0, 1.0, 1.0, cur + ((if on { 0.85 * night } else { 0.0 }) - cur) * 0.1);
            }
        }
    }
}

// ------------------------------------------------------------------ emotes
fn emote_prop(icon: &str) -> &'static str {
    match icon {
        "❗" | "!" | "exclaim" | "‼️" => "emote_exclaim", "❓" | "?" | "question" => "emote_question", "💤" | "zzz" => "emote_zzz", "❤️" | "❤" | "💕" | "heart" | "🙏" => "emote_heart",
        "☕" | "coffee" => "emote_coffee", "🎉" | "🥳" | "party" | "🎂" | "🎈" => "emote_party", "💀" | "skull" => "emote_skull", "😤" | "😠" | "angry" | "🐟" | "🤢" => "emote_angry", "😅" | "😰" | "sweat" => "emote_sweat",
        "💡" | "idea" | "🚀" => "emote_idea", "👀" | "eyes" => "emote_eyes", "🎵" | "🎶" | "music" => "emote_music", "🔢" | "numbers" | "💸" | "📈" | "📊" => "emote_numbers", "✅" | "check" => "emote_check", "…" | "dots" | "💬" => "emote_dots",
        "✨" | "sparkle" | "🌟" => "emote_sparkle", "🐐" | "goat" => "emote_goat", "🍈" | "melon" | "🍉" => "emote_melon", "🧇" | "waffle" | "🍩" | "🍕" | "🌮" | "😋" | "🍪" => "emote_waffle", "🚨" | "🔥" | "alarm" | "😱" | "⏰" => "emote_alarm",
        _ => "emote_exclaim",
    }
}

fn emotes_spawn(mut cmd: Commands, mut ev: EventReader<Emote>, at: Res<ArtAtlas>, q: Query<(Option<&Speaking>, &Pose, Option<&Children>)>, old: Query<(), With<EmoteFx>>) {
    for e in ev.read() {
        let Ok((speaking, pose, children)) = q.get(e.who) else { continue };
        if speaking.is_some() || pose.hidden { continue; } // never overlap a speech bubble
        if let Some(ch) = children { for c in ch.iter() { if old.get(c).is_ok() { cmd.entity(c).despawn(); } } }
        let name = emote_prop(e.icon.as_str());
        let Some(spr) = at.sprite(name, 0) else { continue };
        let child = cmd.spawn((spr, Transform::from_xyz(0.0, 26.0, 0.2).with_scale(Vec3::splat(0.01)), EmoteFx { t: 0.0, life: 1.7 })).id();
        cmd.entity(e.who).add_child(child);
    }
}
fn emotes_tick(mut cmd: Commands, time: Res<Time>, mut q: Query<(Entity, &mut EmoteFx, &mut Transform, &mut Sprite, &ChildOf)>, speaking: Query<(), With<Speaking>>) {
    let dt = time.delta_secs();
    for (e, mut fx, mut tf, mut s, parent) in &mut q {
        fx.t += dt;
        if speaking.get(parent.parent()).is_ok() && fx.t < fx.life - 0.2 { fx.t = fx.life - 0.2; }
        let t = fx.t;
        let pop = if t < 0.18 { ease_out_back(t / 0.18) } else if t > fx.life - 0.18 { (fx.life - t) / 0.18 } else { 1.0 };
        tf.scale = Vec3::splat(pop.max(0.01));
        tf.translation.y = (26.0 + (t / fx.life).min(1.0) * 3.0).round();
        s.color = Color::srgba(1.0, 1.0, 1.0, if t > fx.life - 0.18 { ((fx.life - t) / 0.18).clamp(0.0, 1.0) } else { 1.0 });
        if t >= fx.life { cmd.entity(e).despawn(); }
    }
}

// ------------------------------------------------------------------ fx & party props
fn prop_image(kind: &str) -> Option<Image> {
    let mut cv = Canvas::new(20, 14);
    match kind {
        "donutBox" => { cv.rect(0, 4, 20, 9, art::c("#f2e6cc")); cv.frame(0, 4, 20, 9, art::c("#b59a6a")); for k in 0..3 { cv.disc(4.0 + k as f32 * 6.0, 8.5, 2.6, art::c(["#e98aa3", "#7a4a2a", "#f2d27a"][k])); cv.set(4 + k as i32 * 6, 8, art::c("#f2e6cc")); } cv.rect(0, 2, 20, 2, art::c("#e0cfa8")); }
        "pizza" => { cv.rect(0, 5, 20, 8, art::c("#d8c39a")); cv.disc(10.0, 8.5, 4.6, art::c("#e9b44c")); cv.disc(10.0, 8.5, 3.6, art::c("#d0503a")); for (x, y) in [(8, 7), (12, 9), (10, 10), (11, 6)] { cv.set(x, y, art::c("#f4e2a0")); } }
        "cake" => { cv.rect(5, 6, 10, 7, art::c("#f4ecdc")); cv.rect(5, 6, 10, 2, art::c("#e98aa3")); cv.vline(10, 2, 4, art::c("#7cc0e8")); cv.set(10, 1, art::c("#ffd84a")); cv.rect(3, 12, 14, 1, art::c("#c9c2ae")); }
        "tacoBar" => { cv.rect(0, 6, 20, 7, art::c("#c0622f")); for k in 0..3 { cv.disc(4.0 + k as f32 * 6.0, 6.0, 2.8, art::c("#e9c46a")); cv.rect(2 + k * 6, 5, 4, 1, art::c("#4f8a4a")); } }
        "balloons" => { for (k, col) in ["#c0622f", "#c9a03a", "#2f6f68"].iter().enumerate() { cv.disc(5.0 + k as f32 * 5.0, 3.5 + (k % 2) as f32, 3.0, art::c(col)); cv.vline(5 + k as i32 * 5, 7, 7, art::c("#8a8680")); } }
        _ => return None,
    }
    let _ = Rgba([0; 4]);
    Some(cv.image())
}

fn fx_spawn(mut cmd: Commands, mut ev: EventReader<Fx>, at: Res<ArtAtlas>, mut images: ResMut<Assets<Image>>, mut rng: ResMut<SimRng>) {
    for f in ev.read() {
        let base = Vec2::new(f.at.x * TILE, f.at.y * TILE);
        let mut spawn = |prop: &str, off: Vec2, life: f32, rise: f32, tint: Color, cmd: &mut Commands| {
            if let Some(p) = at.prop(prop) { let mut s = at.sprite(prop, 0).unwrap(); s.color = tint; let pos = base + off; let tr = wpx(pos.x, pos.y, zpx(pos.y) + 0.3); cmd.spawn((s, tr, FxSprite { t: 0.0, life, prop: prop.into(), fps: p.fps.max(6.0), looped: p.looped, rise, base: tr.translation })); }
        };
        match f.kind.as_str() {
            "confetti" => { let big = at.prop("fx_confetti_big").is_some(); for k in 0..if big { 2 } else { 4 } { spawn(if big { "fx_confetti_big" } else { "fx_confetti" }, Vec2::new(rng.range(-20.0, 20.0), rng.range(-10.0, 10.0)), 1.2 + k as f32 * 0.25, 0.0, Color::WHITE, &mut cmd); } }
            "sparkle" => for _ in 0..2 { spawn(if at.prop("fx_sparkles").is_some() { "fx_sparkles" } else { "fx_sparkle" }, Vec2::new(rng.range(-8.0, 8.0), rng.range(-14.0, 0.0)), 1.2, 6.0, Color::WHITE, &mut cmd); },
            "sparks" => for _ in 0..3 { spawn("fx_sparkle", Vec2::new(rng.range(-6.0, 6.0), rng.range(-14.0, -4.0)), 0.8, 4.0, Color::srgb(1.0, 0.85, 0.4), &mut cmd); },
            "smoke" => for k in 0..3 { spawn(if at.prop("fx_steam_big").is_some() { "fx_steam_big" } else { "fx_steam" }, Vec2::new(rng.range(-4.0, 4.0), -18.0), 2.5 + k as f32 * 0.6, 14.0, Color::srgba(0.5, 0.5, 0.5, 0.9), &mut cmd); },
            "stink" => for k in 0..4 { spawn("fx_steam", Vec2::new(rng.range(-10.0, 10.0), -10.0), 2.0 + k as f32 * 0.7, 12.0, Color::srgba(0.55, 0.75, 0.3, 0.9), &mut cmd); },
            "hearts" => for k in 0..2 { spawn(if at.prop("fx_heart").is_some() { "fx_heart" } else { "emote_heart" }, Vec2::new(rng.range(-6.0, 6.0), -14.0 - k as f32 * 4.0), 1.3, 10.0, Color::WHITE, &mut cmd); },
            "zzz" => spawn(if at.prop("fx_zzz_big").is_some() { "fx_zzz_big" } else { "fx_zzz" }, Vec2::new(0.0, -24.0), 2.0, 6.0, Color::WHITE, &mut cmd),
            "paper" | "sweat" | "dust" | "bubbles" | "note" if at.prop(&format!("fx_{}", f.kind)).is_some() => spawn(&format!("fx_{}", f.kind), Vec2::new(rng.range(-4.0, 4.0), -12.0), 1.4, 6.0, Color::WHITE, &mut cmd),
            other => if let Some(img) = prop_image(other) {
                let h = images.add(img);
                let tr = wpx(base.x, base.y, zpx(base.y) + 0.2);
                cmd.spawn((Sprite { image: h, anchor: Anchor::BottomCenter, ..default() }, tr, FxSprite { t: 0.0, life: f.secs.clamp(4.0, 60.0), prop: String::new(), fps: 0.0, looped: true, rise: 0.0, base: tr.translation }, Lit));
            },
        }
    }
}
fn fx_tick(mut cmd: Commands, time: Res<Time>, at: Res<ArtAtlas>, mut q: Query<(Entity, &mut FxSprite, &mut Sprite, &mut Transform)>) {
    let dt = time.delta_secs();
    for (e, mut fx, mut s, mut tf) in &mut q {
        fx.t += dt;
        if let Some(p) = at.prop(&fx.prop) { if p.frames.len() > 1 { let n = p.frames.len(); let i = (fx.t * fx.fps) as usize; let i = if fx.looped { i % n } else { i.min(n - 1) }; s.rect = Some(p.frames[i]); } }
        let k = (fx.t / fx.life).clamp(0.0, 1.0);
        tf.translation.y = (fx.base.y + fx.rise * ease_out_cubic(k)).round();
        let a = if k > 0.75 { (1.0 - k) / 0.25 } else if fx.prop.is_empty() && fx.t < 0.25 { fx.t / 0.25 } else { 1.0 };
        s.color = s.color.with_alpha(a.clamp(0.0, 1.0));
        if fx.prop.is_empty() { tf.scale = Vec3::splat(if fx.t < 0.2 { ease_out_back(fx.t / 0.2).max(0.01) } else { 1.0 }); }
        if fx.t >= fx.life { cmd.entity(e).despawn(); }
    }
}

// ------------------------------------------------------------------ elevator
fn elevator_anim(el: Res<Elevator>, at: Res<ArtAtlas>, mut q: Query<(&mut Sprite, &mut Transform), With<ElevatorSprite>>, mut base: Local<Option<f32>>) {
    for (mut s, mut tf) in &mut q {
        let b = *base.get_or_insert(tf.translation.y);
        let k = |p: Phase| (el.t / Elevator::dur(p)).clamp(0.0, 1.0);
        let (name, frame, dy, alpha): (&str, usize, f32, f32) = match el.phase {
            Phase::Idle => ("elevator", 0, 0.0, 1.0),
            // the car rises out of / sinks into the white floor
            Phase::Rise => ("elevator_rise", (ease_in_out(k(Phase::Rise)) * 8.0).round() as usize, 0.0, 1.0),
            Phase::Sink => ("elevator_rise", 8 - (ease_in_out(k(Phase::Sink)) * 8.0).round() as usize, 0.0, 1.0),
            Phase::Away => ("elevator_rise", 0, 0.0, 1.0),
            Phase::Open => ("elevator", ((el.t / 0.5).clamp(0.0, 1.0) * 5.0).round() as usize, 0.0, 1.0),
            Phase::Close => ("elevator", 5 - (k(Phase::Close) * 5.0).round() as usize, 0.0, 1.0),
            Phase::Ascend => { let k = k(Phase::Ascend); if k < 0.5 { ("elevator", 0, ease_in_out(k * 2.0) * 6.0, 1.0) } else { ("elevator", 0, 6.0 + ease_in_out((k - 0.5) * 2.0) * 160.0, 1.0 - (k - 0.5) * 2.0) } }
        };
        if let Some(p) = at.prop(name) { s.rect = Some(p.frames[frame.min(p.frames.len() - 1)]); s.anchor = p.anchor_custom(); }
        tf.translation.y = (b + dy).round();
        s.color = s.color.with_alpha(alpha.max(if el.phase == Phase::Ascend { 0.0 } else { 1.0 }));
        // after ascending, the car slowly rises back out of the floor
        if el.phase == Phase::Idle && s.color.alpha() < 1.0 { s.color = s.color.with_alpha(1.0); }
    }
}

fn animate_props(time: Res<Time>, at: Res<ArtAtlas>, machines: Res<Machines>, mut q: Query<(&mut Animated, &mut Sprite, Option<&MachineSprite>, Option<&DeskLamp>)>) {
    let dt = time.delta_secs();
    for (mut a, mut s, m, lamp) in &mut q {
        if lamp.is_some() { continue; }
        a.t += dt;
        let Some(p) = at.prop(&a.prop) else { continue };
        let frames: Vec<usize> = if m.map(|m| m.0) == Some("coffee") { p.states.get(if machines.coffee_broken { "broken" } else { "ok" }).cloned().unwrap_or_else(|| a.frames.clone()) } else { a.frames.clone() };
        if frames.is_empty() { continue; }
        let i = frames[(a.t * a.fps.max(1.0)) as usize % frames.len()];
        s.rect = Some(p.frames[i.min(p.frames.len() - 1)]);
    }
}

fn bobbing(time: Res<Time>, mut q: Query<(&Bob, &mut Transform)>) {
    let t = time.elapsed_secs();
    for (b, mut tf) in &mut q { tf.translation.y = (b.base_y + (t * 6.283 / b.speed.max(0.1) * 0.25 + b.phase).sin() * b.amp).round(); }
}

fn quota_bars(prog: Option<Res<crate::meetings::Progress>>, mut q: Query<(&QuotaBar, &mut Sprite)>) {
    let Some(prog) = prog else { return };
    for (qb, mut s) in &mut q {
        let v = qb.team.iter().filter_map(|t| prog.quotas.get(t)).fold(0.0f32, |a, b| a.max(*b));
        let w = (qb.width * v.clamp(0.0, 1.0)).round().max(1.0);
        s.custom_size = Some(Vec2::new(w, 2.0));
    }
}

fn room_signs(data: Res<Data>, rooms: Res<Rooms>, clock: Res<Clock>, mut q: Query<(&RoomSign, &mut Text2d, &mut TextColor)>) {
    for (rs, mut t, mut c) in &mut q {
        let Some(st) = rooms.states.get(rs.room) else { continue };
        let name = clean(&data.0.rooms[rs.room].name).to_uppercase();
        let overrun = st.overrun_until > clock.t;
        let label = if st.count > 0 && !st.title.is_empty() { let mut tt = clean(&st.title).to_uppercase(); if tt.len() > 22 { tt.truncate(21); tt.push('.'); } if overrun { format!("{tt} (OVERRUN)") } else { tt } } else { name };
        if t.0 != label { t.0 = label; }
        c.0 = if overrun { Color::srgb(0.95, 0.62, 0.35) } else if st.count > 0 { Color::srgb(0.49, 0.95, 0.63) } else { Color::srgb(0.36, 0.62, 0.45) };
    }
}

// ------------------------------------------------------------------ lighting
fn ambient_light(clock: Res<Clock>, machines: Res<Machines>, time: Res<Time>, mut amb: ResMut<Ambient>, mut clear: ResMut<ClearColor>, mut cmd: Commands, newlit: Query<(Entity, &Sprite), (With<Lit>, Without<LitBase>)>, mut lit: Query<(&mut Sprite, &LitBase)>) {
    for (e, s) in &newlit { cmd.entity(e).insert(LitBase(s.color)); }
    let n = clock.night();
    let flick = if machines.flicker > 0.0 && (time.elapsed_secs() * 23.0).sin() > 0.3 { 0.12 } else { 0.0 };
    // deeper than the ART-API baseline (70/52/28) so the light pools read as real contrast at night
    // night: a deep blue-teal hush (not a grey wash), so lamp / monitor / tank light carries the scene
    let c = Color::srgb((1.0 - 150.0 * n / 255.0 + flick).min(1.0), (1.0 - 128.0 * n / 255.0 + flick).min(1.0), (1.0 - 88.0 * n / 255.0 + flick).min(1.0));
    let changed = (amb.night - n).abs() > 0.002 || flick > 0.0 || machines.flicker > 0.0;
    amb.night = n; amb.color = c;
    let void_day = Vec3::new(0.984, 0.98, 0.969);
    let cc = c.to_srgba();
    let vk = 1.0 - 0.45 * n; // the void falls away further than the lit islands
    clear.0 = Color::srgb(void_day.x * cc.red * vk, void_day.y * cc.green * vk, void_day.z * cc.blue * vk);
    if changed || !newlit.is_empty() {
        for (mut s, b) in &mut lit { let bb = b.0.to_srgba(); s.color = Color::srgba(bb.red * cc.red, bb.green * cc.green, bb.blue * cc.blue, s.color.alpha()); }
    }
}

fn glows(clock: Res<Clock>, time: Res<Time>, el: Res<Elevator>, q_agents: Query<(&Agent, &Mover)>, mut q: Query<(&Glow, &mut Sprite, Option<&DeskLamp>)>, mut lamps: Query<(&DeskLamp, &mut Sprite), (Without<Glow>, With<Animated>)>, at: Res<ArtAtlas>) {
    let n = clock.night();
    let t = time.elapsed_secs();
    // which desks have their owner sitting at them right now
    let mut occupied = std::collections::HashSet::new();
    for (a, m) in &q_agents { if let Some(di) = a.desk { if m.arrived && (m.pos - a.home).length() < 0.4 { occupied.insert(di); } } }
    for (g, mut s, lamp) in &mut q {
        let a = if let Some(l) = lamp { if occupied.contains(&l.desk) && n > 0.3 { g.base_alpha * n } else { 0.0 } }
            else if g.phase == -2.0 { let open = matches!(el.phase, crate::roles::Phase::Open | crate::roles::Phase::Rise); (if open { 0.35 } else { 0.08 }) * (0.4 + n) }
            else { g.base_alpha * (0.2 + n * 0.8) * (0.92 + 0.08 * (t * 3.0 + g.phase).sin()) }; // ART-API 7.3: ~0.35 by day, full at night
        let cur = s.color.alpha();
        s.color = s.color.with_alpha(cur + (a - cur) * 0.08);
    }
    for (l, mut s) in &mut lamps {
        let on = occupied.contains(&l.desk) && n > 0.3;
        if let Some(p) = at.prop("desk_lamp") { let st = p.states.get(if on { "on" } else { "off" }).and_then(|v| v.first().copied()).unwrap_or(0); s.rect = Some(p.frames[st.min(p.frames.len() - 1)]); }
    }
}

fn void_grid(mut cmd: Commands, cam: Query<(&Transform, &Projection), With<Camera2d>>, win: Query<&Window>, at: Res<ArtAtlas>, amb: Res<Ambient>, mut tiles: Query<(&mut Transform, &mut Sprite, &mut Visibility), (With<VoidTile>, Without<Camera2d>)>) {
    let gk = if at.prop("void_grid_fine").is_some() { "void_grid_fine" } else { "void_grid" };
    let Some(p) = at.prop(gk) else { return };
    let (Ok((ct, proj)), Ok(w)) = (cam.single(), win.single()) else { return };
    let scale = if let Projection::Orthographic(o) = proj { o.scale } else { 1.0 };
    let (vw, vh) = (w.width() * scale, w.height() * scale);
    let ts = 64.0;
    let nx = (vw / ts).ceil() as i32 + 2; let ny = (vh / ts).ceil() as i32 + 2;
    let need = (nx * ny) as usize;
    let have = tiles.iter().count();
    if have < need.min(900) {
        for _ in have..need.min(900) { let mut s = at.sprite(gk, 0).unwrap(); s.anchor = Anchor::TopLeft; cmd.spawn((s, Transform::from_xyz(0.0, 0.0, 0.05), VoidTile, Visibility::Hidden)); }
        return;
    }
    let x0 = ((ct.translation.x - vw / 2.0) / ts).floor() as i32 - 0;
    let y0 = ((ct.translation.y + vh / 2.0) / ts).ceil() as i32 + 0;
    let cc = amb.color.to_srgba();
    let maxd = (vw.max(vh)) * 0.6;
    for (i, (mut tf, mut s, mut vis)) in tiles.iter_mut().enumerate() {
        if i >= need { *vis = Visibility::Hidden; continue; }
        let gx = x0 + (i as i32 % nx); let gy = y0 - (i as i32 / nx);
        tf.translation = Vec3::new(gx as f32 * ts, gy as f32 * ts, 0.05);
        let c = Vec2::new(gx as f32 * ts + 32.0, gy as f32 * ts - 32.0) - ct.translation.truncate();
        let a = (1.0 - c.length() / maxd).clamp(0.0, 1.0);
        s.color = Color::srgba(cc.red, cc.green, cc.blue, a * 0.9);
        *vis = Visibility::Inherited;
        let _ = p;
    }
}
