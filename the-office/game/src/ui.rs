//! UI + camera: retro terminal HUD (clock/day, company, headcount), speed controls, Memo feed,
//! event panel, inspector with today's calendar, quota/rivalry HUD, overlays; camera pan / pinch /
//! wheel zoom (integer-snapped, pixel-snapped), fit-to-window reframing, follow-cam, picking, keys.
use crate::agents::*;
use crate::agents::Anim;
use crate::atlas::ArtAtlas;
use crate::data::*;
use crate::events::*;
use crate::meetings::Progress;
use crate::render::Selected;
use crate::sim::*;
use crate::world::*;
use bevy::input::mouse::{MouseScrollUnit, MouseWheel};
use bevy::input::touch::Touches;
use bevy::prelude::*;
use bevy::ui::FocusPolicy;

pub struct UiPlugin;
impl Plugin for UiPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<Selected>().init_resource::<UiState>().init_resource::<SafeArea>().init_resource::<Inspect>().init_resource::<Hover>().init_resource::<PanelDrag>()
            .add_systems(Startup, (setup_camera, setup_ui).chain().in_set(StartupSet::Ui).after(StartupSet::Agents))
            .add_systems(Update, ((panel_drag, camera_input, fit_on_resize, camera_apply, buttons, keyboard).chain(), (url_select, record_thoughts, hud_text, hint_fade, memo_ui, inspector_ui, panel_toggle, responsive, overlays, hover_tag, prop_outline).chain()).chain().after(SimSet::Visual));
    }
}

#[derive(Resource)]
pub struct CamCtl { pub pos: Vec2, pub zoom: f32, pub target_zoom: f32, pub follow: Option<Entity>, pub vel: Vec2, pub drag_start: Option<Vec2>, pub last_ptr: Option<Vec2>, pub dragging: bool, pub pinch: Option<(f32, f32, Vec2)>, pub moved: f32, pub last_tap: f64, pub user_zoomed: bool, pub last_size: Vec2, pub last_user: f64 }

#[derive(Resource, Default)]
pub struct UiState { pub quota_open: bool, pub events_open: bool, pub memo_collapsed: bool, pub mobile: bool, pub last_w: f32, pub last_h: f32 }
/// CSS safe-area insets (px), fed from JS on the web
#[derive(Resource, Default, Clone, Copy)]
pub struct SafeArea { pub top: f32, pub right: f32, pub bottom: f32, pub left: f32 }

#[derive(Component, Clone, PartialEq)]
pub enum Act2 { Speed(f32), Pause, Skip(f32), Fire(String), ToggleEvents, ToggleMemo, Follow, Close, ZoomIn, ZoomOut, Fit, Fullscreen }
#[derive(Component)] pub struct UiBlock;
#[derive(Component)] pub struct ClockText;
#[derive(Component)] pub struct InfoText;
#[derive(Component)] pub struct MemoBox;
#[derive(Component)] pub struct MemoPanel;
#[derive(Component)] pub struct EventDrawer;
#[derive(Component)] pub struct InspectorPanel;
#[derive(Component)] pub struct InspectorBody;
#[derive(Component)] pub struct QuotaText;
#[derive(Component)] pub struct QuotaPanel;
#[derive(Component)] pub struct QuotaFill(pub usize);
#[derive(Component)] pub struct AlarmOverlay;
#[derive(Component)] pub struct FlickerOverlay;
#[derive(Component)] pub struct SpeedBtn(pub f32);
#[derive(Component)] pub struct TopLeft;
#[derive(Component)] pub struct TopRight;
#[derive(Component)] pub struct BottomLeft;
#[derive(Component)] pub struct HintText;

pub const GREEN: Color = Color::srgb(0.486, 0.949, 0.627);
pub const DIM: Color = Color::srgb(0.30, 0.55, 0.40);
pub const PANEL: Color = Color::srgba(0.035, 0.07, 0.055, 0.86);
pub const BEIGE: Color = Color::srgb(0.85, 0.80, 0.69);

/// largest integer zoom at which the whole office fits the window (min 1)
pub fn fit_zoom(view: Vec2, d: &Company) -> f32 {
    let (w, h) = ((d.layout.w.max(16) as f32 + 4.0) * TILE, (d.layout.h.max(12) as f32 + 6.0) * TILE);
    (view.x / w).min(view.y / h).floor().clamp(1.0, 6.0)
}

fn setup_camera(mut cmd: Commands, params: Res<Params>, idx: Res<WorldIndex>, data: Res<Data>, win: Query<&Window>) {
    let start = params.cam.unwrap_or(Vec2::new(idx.center.x, idx.center.y + 1.0));
    let view = win.single().map(|w| Vec2::new(w.width(), w.height())).unwrap_or(Vec2::new(1280.0, 800.0));
    let z = params.zoom.map(|z| z.round().clamp(1.0, 6.0)).unwrap_or_else(|| crate::fx::cine_zoom(view).max(fit_zoom(view, &data.0)));
    cmd.spawn((Camera2d, Msaa::Off, Projection::from(OrthographicProjection { scale: 1.0 / z, ..OrthographicProjection::default_2d() }), Transform::from_xyz(start.x * TILE, -start.y * TILE, 1000.0)));
    cmd.insert_resource(CamCtl { pos: tile_to_world(start), zoom: z, target_zoom: z, follow: None, vel: Vec2::ZERO, drag_start: None, last_ptr: None, dragging: false, pinch: None, moved: 0.0, last_tap: -10.0, user_zoomed: params.zoom.is_some(), last_size: view, last_user: if params.zoom.is_some() || params.cam.is_some() { 1e12 } else { -1e9 } });
}

fn tf(font: &Handle<Font>, size: f32) -> TextFont { TextFont { font: font.clone(), font_size: size, font_smoothing: bevy::text::FontSmoothing::None, ..default() } }

fn button(p: &mut ChildSpawnerCommands, fonts: &Fonts, label: &str, act: Act2, w: Option<f32>) {
    let mut e = p.spawn((Button, Node { padding: UiRect::axes(Val::Px(8.0), Val::Px(4.0)), border: UiRect::all(Val::Px(1.0)), justify_content: JustifyContent::Center, align_items: AlignItems::Center, min_width: w.map(Val::Px).unwrap_or(Val::Auto), min_height: Val::Px(26.0), ..default() }, BackgroundColor(Color::srgba(0.05, 0.12, 0.09, 0.8)), BorderColor(DIM), BorderRadius::all(Val::Px(2.0)), act.clone()));
    if let Act2::Speed(s) = act { e.insert(SpeedBtn(s)); }
    if act == Act2::Pause { e.insert(SpeedBtn(0.0)); }
    e.with_children(|b| { b.spawn((Text::new(label), tf(&fonts.ui, 17.0), TextColor(GREEN))); });
}

fn panel(extra: Node) -> impl Bundle {
    (Node { padding: UiRect::all(Val::Px(8.0)), border: UiRect::all(Val::Px(2.0)), flex_direction: FlexDirection::Column, ..extra }, BackgroundColor(PANEL), BorderColor(BEIGE), BorderRadius::all(Val::Px(3.0)), Interaction::None, FocusPolicy::Block, UiBlock)
}

#[derive(Resource, Default, Clone, PartialEq)]
pub enum Inspect { #[default] None, Agent(Entity), Prop(Entity), Room(usize), Event(u32) }
#[derive(Component)] pub struct DragHandle;
#[derive(Component)] pub struct Portrait;
#[derive(Component)] pub struct HoverTag;
#[derive(Resource, Default)] pub struct PanelDrag { pub active: bool, pub last: Vec2, pub offset: Vec2 }

fn setup_ui(mut cmd: Commands, fonts: Res<Fonts>, data: Res<Data>, at: Res<ArtAtlas>, params: Res<Params>) {
    let d = &data.0;
    cmd.spawn((ImageNode::new(at.vignette.clone()).with_color(Color::srgba(1.0, 1.0, 1.0, 0.85)), Node { position_type: PositionType::Absolute, left: Val::Px(0.0), top: Val::Px(0.0), width: Val::Percent(100.0), height: Val::Percent(100.0), ..default() }, FocusPolicy::Pass, GlobalZIndex(-5)));
    cmd.spawn((Node { position_type: PositionType::Absolute, width: Val::Percent(100.0), height: Val::Percent(100.0), ..default() }, BackgroundColor(Color::srgba(0.85, 0.1, 0.1, 0.0)), AlarmOverlay, FocusPolicy::Pass, GlobalZIndex(-4)));
    cmd.spawn((Node { position_type: PositionType::Absolute, width: Val::Percent(100.0), height: Val::Percent(100.0), ..default() }, BackgroundColor(Color::srgba(1.0, 1.0, 1.0, 0.0)), FlickerOverlay, FocusPolicy::Pass, GlobalZIndex(-3)));
    // hover name tag (RCT-style) follows the cursor
    cmd.spawn((Node { position_type: PositionType::Absolute, display: Display::None, padding: UiRect::axes(Val::Px(5.0), Val::Px(1.0)), border: UiRect::all(Val::Px(1.0)), ..default() }, BackgroundColor(PANEL), BorderColor(BEIGE), BorderRadius::all(Val::Px(2.0)), FocusPolicy::Pass, HoverTag, GlobalZIndex(5))).with_children(|p| { p.spawn((Text::new(""), tf(&fonts.ui, 17.0), TextColor(GREEN))); });
    if !params.ui { return; }
    cmd.spawn((Node { position_type: PositionType::Absolute, left: Val::Px(10.0), top: Val::Px(10.0), flex_direction: FlexDirection::Column, max_width: Val::Px(460.0), overflow: Overflow::clip(), ..default() }, TopLeft)).with_children(|c| {
        c.spawn(panel(Node::default())).with_children(|p| {
            p.spawn((Text::new("DAY 1  MON  07:00"), tf(&fonts.ui, 24.0), TextColor(GREEN), ClockText));
            p.spawn((Text::new(""), tf(&fonts.ui, 15.0), TextColor(DIM), InfoText));
        });
    });
    cmd.spawn((Node { position_type: PositionType::Absolute, right: Val::Px(10.0), top: Val::Px(10.0), flex_direction: FlexDirection::Row, column_gap: Val::Px(4.0), row_gap: Val::Px(4.0), flex_wrap: FlexWrap::Wrap, justify_content: JustifyContent::FlexEnd, max_width: Val::Px(470.0), ..default() }, Interaction::None, FocusPolicy::Block, UiBlock, TopRight)).with_children(|p| {
        button(p, &fonts, "II", Act2::Pause, Some(28.0));
        button(p, &fonts, "1x", Act2::Speed(1.0), Some(28.0));
        button(p, &fonts, "4x", Act2::Speed(4.0), Some(28.0));
        button(p, &fonts, "16x", Act2::Speed(16.0), Some(32.0));
        button(p, &fonts, "-", Act2::ZoomOut, Some(26.0));
        button(p, &fonts, "+", Act2::ZoomIn, Some(26.0));
        button(p, &fonts, "[ ]", Act2::Fullscreen, Some(28.0));
    });
    cmd.spawn((panel(Node { position_type: PositionType::Absolute, right: Val::Px(10.0), top: Val::Px(52.0), width: Val::Px(330.0), row_gap: Val::Px(2.0), ..default() }), MemoPanel)).with_children(|p| {
        p.spawn(Node { flex_direction: FlexDirection::Row, justify_content: JustifyContent::SpaceBetween, align_items: AlignItems::Center, ..default() }).with_children(|h| {
            h.spawn((Text::new(format!("MEMO - {}", clean(&d.company.name).to_uppercase())), tf(&fonts.ui, 18.0), TextColor(BEIGE)));
            button(h, &fonts, "_", Act2::ToggleMemo, Some(26.0));
        });
        p.spawn((Node { flex_direction: FlexDirection::Column, row_gap: Val::Px(3.0), ..default() }, MemoBox));
    });
    cmd.spawn((Node { position_type: PositionType::Absolute, left: Val::Px(10.0), bottom: Val::Px(10.0), flex_direction: FlexDirection::ColumnReverse, row_gap: Val::Px(6.0), max_width: Val::Px(560.0), ..default() }, Interaction::None, FocusPolicy::Block, UiBlock, BottomLeft)).with_children(|c| {
        // no manual event picking: the director decides what happens (the seed box lives in index.html)
        c.spawn((Node::default(), EventDrawer));
    });
    cmd.spawn((panel(Node { position_type: PositionType::Absolute, right: Val::Px(10.0), bottom: Val::Px(10.0), width: Val::Px(330.0), row_gap: Val::Px(3.0), ..default() }), QuotaPanel)).with_children(|p| {
        p.spawn((Text::new(""), tf(&fonts.ui, 18.0), TextColor(GREEN), QuotaText));
        for k in 0..2 { p.spawn((Node { height: Val::Px(4.0), width: Val::Percent(100.0), ..default() }, BackgroundColor(Color::srgba(0.49, 0.95, 0.63, 0.15)))).with_children(|b| { b.spawn((Node { height: Val::Percent(100.0), width: Val::Percent(50.0), ..default() }, BackgroundColor(if k == 0 { GREEN } else { Color::srgb(0.95, 0.75, 0.35) }), QuotaFill(k))); }); }
    });
    // inspector window (RCT-style): title bar = drag handle, portrait + details
    cmd.spawn((panel(Node { display: Display::None, position_type: PositionType::Absolute, left: Val::Px(10.0), top: Val::Px(110.0), width: Val::Px(340.0), max_height: Val::Percent(72.0), overflow: Overflow::clip(), row_gap: Val::Px(2.0), padding: UiRect::all(Val::Px(0.0)), ..default() }), InspectorPanel, GlobalZIndex(3))).insert(BackgroundColor(Color::srgba(0.035, 0.07, 0.055, 0.96))).with_children(|p| {
        p.spawn((Node { flex_direction: FlexDirection::Row, justify_content: JustifyContent::SpaceBetween, align_items: AlignItems::Center, padding: UiRect::axes(Val::Px(6.0), Val::Px(3.0)), ..default() }, BackgroundColor(Color::srgb(0.18, 0.43, 0.41)), Interaction::None, DragHandle)).with_children(|h| {
            h.spawn((Text::new("INSPECTOR"), tf(&fonts.px, 8.0), TextColor(Color::srgb(0.94, 0.92, 0.86))));
            h.spawn(Node { flex_direction: FlexDirection::Row, column_gap: Val::Px(4.0), ..default() }).with_children(|b| { button(b, &fonts, "FOLLOW", Act2::Follow, None); button(b, &fonts, "X", Act2::Close, Some(28.0)); });
        });
        p.spawn(Node { flex_direction: FlexDirection::Row, column_gap: Val::Px(8.0), padding: UiRect::all(Val::Px(8.0)), ..default() }).with_children(|r| {
            r.spawn((Node { width: Val::Px(48.0), height: Val::Px(64.0), flex_shrink: 0.0, border: UiRect::all(Val::Px(1.0)), ..default() }, BackgroundColor(Color::srgb(0.94, 0.92, 0.86)), BorderColor(BEIGE))).with_children(|f| { f.spawn((ImageNode::default(), Node { width: Val::Px(48.0), height: Val::Px(64.0), ..default() }, Portrait)); });
            r.spawn((Node { flex_direction: FlexDirection::Column, row_gap: Val::Px(2.0), width: Val::Px(INSPECT_TEXT_W), min_width: Val::Px(0.0), flex_shrink: 0.0, ..default() }, InspectorBody));
        });
    });
    cmd.spawn((Text::new("drag to pan - wheel to zoom - click anything - C cinema - G film"), tf(&fonts.ui, 16.0), TextColor(Color::srgba(0.25, 0.3, 0.29, 0.7)), Node { position_type: PositionType::Absolute, bottom: Val::Px(54.0), left: Val::Px(12.0), ..default() }, HintText));
}

/// Something clickable in the world that isn't a person (furniture, belongings, props).
#[derive(Component, Clone)]
pub struct Pick { pub key: String, pub owner: Option<String> }
#[derive(Component)] pub struct Outline;
#[derive(Resource, Default)] pub struct Hover { pub agent: Option<Entity>, pub prop: Option<Entity>, pub picked_prop: Option<Entity> }

/// alpha test of a sprite at a world point (pixel-accurate)
pub fn sprite_hit(images: &Assets<Image>, spr: &Sprite, gt: &GlobalTransform, wp: Vec2) -> bool {
    let Some(img) = images.get(&spr.image) else { return false };
    let size = img.size().as_vec2();
    let rect = spr.rect.unwrap_or(Rect::new(0.0, 0.0, size.x, size.y));
    let (w, h) = (rect.width(), rect.height());
    let a = spr.anchor.as_vec(); // -0.5..0.5, y up
    let p = gt.translation().truncate();
    let local = wp - p; // world px (scale 1)
    let lx = local.x + (a.x + 0.5) * w;
    let ly = (0.5 - a.y) * h - local.y; // from top
    if lx < 0.0 || ly < 0.0 || lx >= w || ly >= h { return false; }
    let (px, py) = ((rect.min.x + lx) as u32, (rect.min.y + ly) as u32);
    let Some(data) = img.data.as_ref() else { return true };
    let i = ((py * size.x as u32 + px) * 4 + 3) as usize;
    data.get(i).map_or(false, |a| *a > 40)
}

fn feet_px(m: &Mover, a: &Agent, idx: &WorldIndex) -> Vec2 {
    let mut foot = Vec2::new(m.pos.x * TILE, -m.pos.y * TILE);
    if let Some(di) = a.desk { if m.arrived && (m.pos - a.home).length() < 0.3 { let o = idx.desk_seat_off.get(di).copied().unwrap_or(Vec2::ZERO); foot += Vec2::new(o.x, -o.y); } }
    foot.round()
}

#[allow(clippy::too_many_arguments)]
fn camera_input(
    ctl: ResMut<CamCtl>, mouse: Res<ButtonInput<MouseButton>>, mut wheel: EventReader<MouseWheel>, touches: Res<Touches>, win: Query<&Window>,
    cam: Query<(&Camera, &GlobalTransform)>, (blockers, buttons_q): (Query<&Interaction, With<UiBlock>>, Query<&Interaction, With<Button>>),
    mut sel: ResMut<Selected>, mut insp: ResMut<Inspect>, q: Query<(Entity, &Mover, &Pose, &Agent)>, time: Res<Time>,
    picks: Query<(Entity, &Sprite, &GlobalTransform, &Pick)>, images: Res<Assets<Image>>, mut hover: ResMut<Hover>, (data, bus, drag, idx): (Res<Data>, Res<Bus>, Res<PanelDrag>, Res<WorldIndex>),
) {
    let ctl = ctl.into_inner();
    let zoom0 = ctl.zoom;
    let Ok(w) = win.single() else { return };
    let Ok((camera, cgt)) = cam.single() else { return };
    let over_ui = blockers.iter().any(|i| *i != Interaction::None) || buttons_q.iter().any(|i| *i != Interaction::None) || drag.active;
    let dt = time.delta_secs();
    let to_world = |p: Vec2| camera.viewport_to_world_2d(cgt, p).ok();
    // what's under a point: people > animals > props (alpha) > meeting islands > active events
    let pick_at = |wp: Vec2| -> (Option<Entity>, Option<Entity>, Option<usize>, Option<u32>) {
        let mut best: Option<(Entity, f32, bool)> = None;
        for (e, m, pose, a) in &q {
            if pose.hidden || pose.alpha < 0.5 || matches!(a.plan.act, Act::Gone) { continue; }
            let foot = feet_px(m, a, &idx);
            let animal = matches!(a.role, Role::Goat | Role::Dog);
            let (hw, top) = if animal { (11.0, 20.0) } else { (9.0, 30.0) };
            let dx = (wp.x - foot.x).abs(); let dy = wp.y - foot.y;
            let pad = 6.0 / zoom0.max(1.0);
            if dx < hw + pad && dy > -4.0 - pad && dy < top + pad {
                let score = dx + (dy - top * 0.45).abs() * 0.5 + if animal { 100.0 } else { 0.0 };
                if best.map_or(true, |b| score < b.1) { best = Some((e, score, animal)); }
            }
        }
        if let Some(b) = best { return (Some(b.0), None, None, None); }
        let mut top_prop: Option<(Entity, f32)> = None;
        for (e, spr, gt, _) in &picks { if sprite_hit(&images, spr, gt, wp) { let z = gt.translation().z; if top_prop.map_or(true, |t| z > t.1) { top_prop = Some((e, z)); } } }
        if let Some(t) = top_prop { return (None, Some(t.0), None, None); }
        let tp = world_to_tile(wp);
        if let Some(ri) = data.0.rooms.iter().position(|r| r.rect.contains(tp.x.floor() as i32, tp.y.floor() as i32)) { return (None, None, Some(ri), None); }
        if let Some(a) = bus.active.iter().find(|a| a.pos.map_or(false, |p| (p - tp).length() < 2.5)) { return (None, None, None, Some(a.serial)); }
        (None, None, None, None)
    };
    // hover (desktop)
    if touches.iter().next().is_none() {
        let hp = if over_ui { None } else { w.cursor_position().and_then(to_world) };
        let (a, p, _, _) = hp.map(&pick_at).unwrap_or((None, None, None, None));
        hover.agent = a; hover.prop = p;
    }
    for ev in wheel.read() {
        if over_ui { continue; }
        let dy = match ev.unit { MouseScrollUnit::Line => ev.y, MouseScrollUnit::Pixel => ev.y / 80.0 };
        if dy.abs() < 0.05 { continue; }
        let nz = (ctl.target_zoom + dy.signum()).clamp(1.0, 6.0);
        if let Some(wp) = w.cursor_position().and_then(to_world) { let off = wp - ctl.pos; let tz = ctl.target_zoom; ctl.pos = wp - off * (tz / nz); }
        ctl.target_zoom = nz; ctl.user_zoomed = true; ctl.last_user = time.elapsed_secs_f64();
    }
    let active: Vec<_> = touches.iter().collect();
    if active.len() >= 2 {
        let (a, b) = (active[0].position(), active[1].position());
        let dist = (a - b).length().max(1.0); let mid = (a + b) * 0.5;
        match ctl.pinch {
            None => { ctl.pinch = Some((dist, ctl.zoom, mid)); ctl.follow = None; }
            Some((d0, z0, m0)) => {
                let nz = (z0 * dist / d0).clamp(1.0, 6.0);
                if let Some(wm) = to_world(mid) { let off = wm - ctl.pos; let z = ctl.zoom; ctl.pos = wm - off * (z / nz); }
                ctl.zoom = nz; ctl.target_zoom = nz; ctl.user_zoomed = true; ctl.last_user = time.elapsed_secs_f64();
                let pan = (mid - m0) / nz; ctl.pos += Vec2::new(-pan.x, pan.y);
                ctl.pinch = Some((d0, z0, mid));
            }
        }
        ctl.drag_start = None; ctl.dragging = true;
        return;
    } else if ctl.pinch.is_some() && active.len() < 2 {
        ctl.pinch = None; ctl.target_zoom = ctl.zoom.round().clamp(1.0, 6.0); ctl.drag_start = None;
        if active.is_empty() { return; }
    }
    let (pressed, just_pressed, just_released, ptr) = if let Some(t) = active.first() {
        (true, touches.just_pressed(t.id()), false, Some(t.position()))
    } else if let Some(t) = touches.iter_just_released().next() {
        (false, false, true, Some(t.position()))
    } else {
        (mouse.pressed(MouseButton::Left), mouse.just_pressed(MouseButton::Left), mouse.just_released(MouseButton::Left), w.cursor_position())
    };
    if just_pressed && !over_ui { ctl.drag_start = ptr; ctl.last_ptr = ptr; ctl.moved = 0.0; ctl.dragging = false; ctl.vel = Vec2::ZERO; }
    if pressed && ctl.drag_start.is_some() {
        if let (Some(p), Some(lp)) = (ptr, ctl.last_ptr) {
            let d = p - lp; ctl.moved += d.length();
            if ctl.moved > 6.0 { ctl.dragging = true; ctl.follow = None; ctl.last_user = time.elapsed_secs_f64(); }
            if ctl.dragging { let z = ctl.zoom; ctl.pos += Vec2::new(-d.x, d.y) / z; ctl.vel = Vec2::new(-d.x, d.y) / z / dt.max(0.001); }
            ctl.last_ptr = Some(p);
        }
    }
    if just_released && ctl.drag_start.is_some() {
        if !ctl.dragging {
            if let Some(wp) = ptr.and_then(to_world) {
                let (a, p, r, ev) = pick_at(wp);
                sel.0 = a; hover.picked_prop = p;
                *insp = if let Some(a) = a { Inspect::Agent(a) } else if let Some(p) = p { Inspect::Prop(p) } else if let Some(r) = r { Inspect::Room(r) } else if let Some(e) = ev { Inspect::Event(e) } else { Inspect::None };
                if p.is_none() { hover.picked_prop = None; }
                ctl.follow = None;
                let now = time.elapsed_secs_f64();
                if *insp == Inspect::None && now - ctl.last_tap < 0.32 { ctl.target_zoom = (ctl.target_zoom + 1.0).min(6.0); ctl.user_zoomed = true; ctl.last_user = now; }
                ctl.last_tap = now;
            }
        }
        ctl.drag_start = None; ctl.dragging = false;
    }
    if !pressed && ctl.drag_start.is_none() { let v = ctl.vel; ctl.pos += v * dt; ctl.vel *= (1.0 - dt * 7.0).max(0.0); if ctl.vel.length() < 4.0 { ctl.vel = Vec2::ZERO; } }
}

/// Window resized / phone rotated: re-pick the largest integer zoom that fits and reframe.
fn fit_on_resize(mut ctl: ResMut<CamCtl>, win: Query<&Window>, data: Res<Data>, idx: Res<WorldIndex>) {
    let Ok(w) = win.single() else { return };
    let size = Vec2::new(w.width(), w.height());
    if (size - ctl.last_size).length() < 2.0 { return; }
    ctl.last_size = size;
    if ctl.follow.is_some() { return; }
    let z = fit_zoom(size, &data.0);
    if !ctl.user_zoomed { ctl.target_zoom = crate::fx::cine_zoom(size).max(z); } else if z > ctl.target_zoom { ctl.target_zoom = z; ctl.pos = tile_to_world(Vec2::new(idx.center.x, idx.center.y + 1.0)); }
}

fn camera_apply(mut ctl: ResMut<CamCtl>, time: Res<Time>, win: Query<&Window>, mut cam: Query<(&mut Transform, &mut Projection), With<Camera2d>>, q: Query<&GlobalTransform, With<Agent>>, sel: Res<Selected>) {
    let dt = time.delta_secs().min(0.05);
    if sel.0.is_none() && ctl.follow.is_some() { ctl.follow = None; }
    if let Some(f) = ctl.follow { if let Ok(gt) = q.get(f) { let target = gt.translation().truncate() + Vec2::new(0.0, 14.0); let p = ctl.pos; ctl.pos = p + (target - p) * (dt * 5.0).min(1.0); } else { ctl.follow = None; } }
    if ctl.pinch.is_none() { let z = ctl.zoom; let tz = ctl.target_zoom; ctl.zoom = if (tz - z).abs() < 0.004 { tz } else { z + (tz - z) * (dt * 12.0).min(1.0) }; }
    let dpr = win.single().map(|w| w.scale_factor()).unwrap_or(1.0);
    let Ok((mut tf, mut proj)) = cam.single_mut() else { return };
    if let Projection::Orthographic(o) = proj.as_mut() { o.scale = 1.0 / ctl.zoom; }
    let unit = ctl.zoom * dpr; // snap to the device pixel grid: no shimmer
    tf.translation.x = (ctl.pos.x * unit).round() / unit;
    tf.translation.y = (ctl.pos.y * unit).round() / unit;
}

#[allow(clippy::too_many_arguments)]
fn buttons(q: Query<(&Interaction, &Act2), Changed<Interaction>>, mut clock: ResMut<Clock>, mut fire: EventWriter<Fire>, mut ui: ResMut<UiState>, mut ctl: ResMut<CamCtl>, mut sel: ResMut<Selected>, mut insp: ResMut<Inspect>, mut memo: ResMut<Memo>, mut styles: Query<(&SpeedBtn, &mut BackgroundColor, &mut BorderColor)>, data: Res<Data>, (idx, time): (Res<WorldIndex>, Res<Time>), win: Query<&Window>) {
    for (i, a) in &q {
        if *i != Interaction::Pressed { continue; }
        if matches!(a, Act2::ZoomIn | Act2::ZoomOut | Act2::Fit | Act2::Follow) { ctl.last_user = time.elapsed_secs_f64(); }
        match a {
            Act2::Speed(s) => { clock.speed = *s; clock.paused = false; }
            Act2::Pause => clock.paused = !clock.paused,
            Act2::Skip(m) => { let day0 = clock.day() as f64 * 1440.0; let mut t = day0 + *m as f64; if t <= clock.t { t += 1440.0; } clock.t = t; memo.push(&clock, MemoKind::System, format!("Time skipped to {}. Nobody noticed.", clock.hhmm())); }
            Act2::Fire(id) => { let mut f = Fire::new(id); f.manual = true; fire.write(f); }
            Act2::ToggleEvents => ui.events_open = !ui.events_open,
            Act2::ToggleMemo => ui.memo_collapsed = !ui.memo_collapsed,
            Act2::Follow => ctl.follow = if ctl.follow.is_some() { None } else { sel.0 },
            Act2::Close => { sel.0 = None; ctl.follow = None; *insp = Inspect::None; }
            Act2::ZoomIn => { ctl.target_zoom = (ctl.target_zoom.round() + 1.0).min(6.0); ctl.user_zoomed = true; }
            Act2::ZoomOut => { ctl.target_zoom = (ctl.target_zoom.round() - 1.0).max(1.0); ctl.user_zoomed = true; }
            Act2::Fullscreen => crate::debug::web::toggle_fullscreen(),
            Act2::Fit => { let v = win.single().map(|w| Vec2::new(w.width(), w.height())).unwrap_or(Vec2::splat(800.0)); ctl.target_zoom = fit_zoom(v, &data.0); ctl.pos = tile_to_world(Vec2::new(idx.center.x, idx.center.y + 1.0)); ctl.follow = None; ctl.user_zoomed = false; }
        }
    }
    for (sb, mut bg, mut bc) in &mut styles {
        let on = if sb.0 == 0.0 { clock.paused } else { !clock.paused && (clock.speed - sb.0).abs() < 0.01 };
        bg.0 = if on { Color::srgba(0.2, 0.45, 0.32, 0.9) } else { Color::srgba(0.05, 0.12, 0.09, 0.8) };
        bc.0 = if on { GREEN } else { DIM };
    }
}

fn keyboard(keys: Res<ButtonInput<KeyCode>>, mut clock: ResMut<Clock>, mut ctl: ResMut<CamCtl>, mut ui: ResMut<UiState>, mut sel: ResMut<Selected>, mut insp: ResMut<Inspect>, time: Res<Time>) {
    if keys.just_pressed(KeyCode::Space) { clock.paused = !clock.paused; }
    if keys.just_pressed(KeyCode::Digit1) { clock.speed = 1.0; clock.paused = false; }
    if keys.just_pressed(KeyCode::Digit2) { clock.speed = 4.0; clock.paused = false; }
    if keys.just_pressed(KeyCode::Digit3) { clock.speed = 16.0; clock.paused = false; }
    if keys.just_pressed(KeyCode::Equal) || keys.just_pressed(KeyCode::NumpadAdd) { ctl.target_zoom = (ctl.target_zoom.round() + 1.0).min(6.0); ctl.user_zoomed = true; }
    if keys.just_pressed(KeyCode::Minus) || keys.just_pressed(KeyCode::NumpadSubtract) { ctl.target_zoom = (ctl.target_zoom.round() - 1.0).max(1.0); ctl.user_zoomed = true; }
    if keys.just_pressed(KeyCode::Escape) { sel.0 = None; ctl.follow = None; *insp = Inspect::None; }
    if keys.just_pressed(KeyCode::KeyF) && sel.0.is_some() { ctl.follow = if ctl.follow.is_some() { None } else { sel.0 }; }
    let mut pan = Vec2::ZERO;
    if keys.pressed(KeyCode::ArrowLeft) || keys.pressed(KeyCode::KeyA) { pan.x -= 1.0; }
    if keys.pressed(KeyCode::ArrowRight) || keys.pressed(KeyCode::KeyD) { pan.x += 1.0; }
    if keys.pressed(KeyCode::ArrowUp) || keys.pressed(KeyCode::KeyW) { pan.y += 1.0; }
    if keys.pressed(KeyCode::ArrowDown) || keys.pressed(KeyCode::KeyS) { pan.y -= 1.0; }
    let any = keys.get_just_pressed().any(|k| matches!(k, KeyCode::Equal | KeyCode::Minus | KeyCode::NumpadAdd | KeyCode::NumpadSubtract));
    if pan != Vec2::ZERO || any { ctl.last_user = time.elapsed_secs_f64(); }
    if keys.just_pressed(KeyCode::KeyQ) { ui.quota_open = !ui.quota_open; }
    if pan != Vec2::ZERO { ctl.follow = None; let z = ctl.zoom; ctl.pos += pan * 420.0 / z * time.delta_secs(); }
}

fn panel_toggle(ui: Res<UiState>, mut q: Query<&mut Node, With<EventDrawer>>, mut memo: Query<&mut Node, (With<MemoBox>, Without<EventDrawer>)>) {
    if !ui.is_changed() { return; }
    for mut n in &mut q { n.display = if ui.events_open { Display::Flex } else { Display::None }; }
    for mut n in &mut memo { n.display = if ui.memo_collapsed { Display::None } else { Display::Flex }; }
}

/// full-window layout with safe-area insets; phones get a compact memo strip + bottom-sheet inspector
#[allow(clippy::too_many_arguments)]
fn responsive(win: Query<&Window>, safe: Res<SafeArea>, mut ui: ResMut<UiState>, inspect: Res<Inspect>,
    mut memo: Query<&mut Node, (With<MemoPanel>, Without<InspectorPanel>, Without<TopLeft>, Without<TopRight>, Without<BottomLeft>, Without<QuotaPanel>)>,
    mut insp: Query<&mut Node, (With<InspectorPanel>, Without<MemoPanel>, Without<TopLeft>, Without<TopRight>, Without<BottomLeft>, Without<QuotaPanel>)>,
    mut tl: Query<&mut Node, (With<TopLeft>, Without<MemoPanel>, Without<InspectorPanel>, Without<TopRight>, Without<BottomLeft>, Without<QuotaPanel>)>,
    mut tr: Query<&mut Node, (With<TopRight>, Without<MemoPanel>, Without<InspectorPanel>, Without<TopLeft>, Without<BottomLeft>, Without<QuotaPanel>)>,
    mut bl: Query<&mut Node, (With<BottomLeft>, Without<MemoPanel>, Without<InspectorPanel>, Without<TopLeft>, Without<TopRight>, Without<QuotaPanel>)>,
    mut qp: Query<&mut Node, (With<QuotaPanel>, Without<MemoPanel>, Without<InspectorPanel>, Without<TopLeft>, Without<TopRight>, Without<BottomLeft>)>,
    mut hint: Query<&mut Visibility, With<HintText>>, drag: Res<PanelDrag>) {
    let Ok(w) = win.single() else { return };
    let (width, height) = (w.width(), w.height());
    if (width - ui.last_w).abs() < 1.0 && (height - ui.last_h).abs() < 1.0 && !safe.is_changed() && !drag.is_changed() && !ui.is_changed() && !inspect.is_changed() { return; }
    ui.last_w = width; ui.last_h = height;
    let was = ui.mobile;
    ui.mobile = width < 720.0;
    if ui.mobile && !was { ui.memo_collapsed = false; }
    let (t, r, b, l) = (safe.top + 8.0, safe.right + 8.0, safe.bottom + 8.0, safe.left + 8.0);
    let inner = (width - l - r).max(200.0);
    let inspecting = !matches!(*inspect, Inspect::None);
    for mut n in &mut tl { n.left = Val::Px(l); n.top = Val::Px(t); n.max_width = Val::Px(if ui.mobile { inner * 0.44 } else { 460.0 }); }
    for mut n in &mut tr {
        n.right = Val::Px(r); n.top = Val::Px(t);
        if ui.mobile { n.width = Val::Px(inner * 0.52); n.max_width = Val::Px(inner * 0.52); }
        else { n.width = Val::Auto; n.max_width = Val::Px(520.0); }
    }
    for mut n in &mut bl { n.left = Val::Px(l); n.bottom = Val::Px(b); n.max_width = Val::Px(if ui.mobile { inner } else { 560.0 }); }
    for mut n in &mut qp { n.right = Val::Px(r); n.bottom = Val::Px(b); n.width = Val::Px(if ui.mobile { (inner * 0.5).min(260.0) } else { 280.0 }); n.display = if ui.quota_open { Display::Flex } else { Display::None }; }
    for mut n in &mut memo {
        n.top = Val::Auto;
        if ui.mobile {
            n.width = Val::Px(inner); n.left = Val::Px(l); n.right = Val::Auto; n.bottom = Val::Px(b + 40.0);
            n.display = if inspecting || ui.memo_collapsed { Display::None } else { Display::Flex };
        } else {
            n.width = Val::Px(300.0); n.left = Val::Auto; n.right = Val::Px(r); n.bottom = Val::Px(b + if ui.quota_open { 70.0 } else { 0.0 });
            n.display = if ui.memo_collapsed { Display::None } else { Display::Flex };
        }
    }
    for mut n in &mut insp {
        if ui.mobile { n.left = Val::Px(l); n.right = Val::Px(r); n.width = Val::Auto; n.top = Val::Auto; n.bottom = Val::Px(b + 56.0); n.max_height = Val::Percent(48.0); }
        else { n.left = Val::Px(l + drag.offset.x); n.right = Val::Auto; n.width = Val::Px(350.0); n.top = Val::Px(t + 110.0 + drag.offset.y); n.bottom = Val::Auto; n.max_height = Val::Percent(72.0); }
    }
    for mut v in &mut hint { *v = if ui.mobile { Visibility::Hidden } else { Visibility::Inherited }; }
}

#[allow(clippy::too_many_arguments)]
fn hud_text(clock: Res<Clock>, data: Res<Data>, prog: Option<Res<Progress>>, fps: Res<crate::debug::Fps>, ui: Res<UiState>, q: Query<(&Agent, &Pose)>, mut clock_t: Query<&mut Text, (With<ClockText>, Without<InfoText>, Without<QuotaText>)>, mut info: Query<&mut Text, (With<InfoText>, Without<ClockText>, Without<QuotaText>)>, mut quota: Query<&mut Text, (With<QuotaText>, Without<ClockText>, Without<InfoText>)>, mut fills: Query<(&QuotaFill, &mut Node)>, params: Res<Params>, time: Res<Time>, mut acc: Local<f32>) {
    *acc += time.delta_secs();
    if *acc < 0.1 { return; }
    *acc = 0.0;
    let d = &data.0;
    let night = clock.night();
    for mut t in &mut clock_t {
        let suffix = if clock.paused { "  II" } else if night > 0.6 { "  NIGHT" } else { "" };
        t.0 = if ui.mobile { format!("DAY {}  {}{}", clock.day() + 1, clock.hhmm(), suffix) }
              else { format!("DAY {}  {}  {}{}", clock.day() + 1, DAYS[clock.weekday()].to_uppercase(), clock.hhmm(), suffix) };
    }
    let staffish = |a: &Agent| matches!(a.role, Role::Staff | Role::Receptionist | Role::Facilities | Role::Supervisor);
    let on_floor = q.iter().filter(|(a, p)| !p.hidden && staffish(a)).count();
    let total = q.iter().filter(|(a, _)| staffish(a)).count();
    let v = prog.as_ref().map(|p| p.version).unwrap_or((0, 1, 0));
    let _ = v;
    for mut t in &mut info {
        t.0 = if ui.mobile { format!("{} ON THE FLOOR", on_floor) }
              else { format!("{}  -  {} ON THE FLOOR{}", clean(&d.company.name).to_uppercase(), on_floor, if params.debug { format!("  FPS {:.0}  SEED {}  /{}", fps.0, params.seed, total) } else { String::new() }) };
    }
    if let Some(p) = prog {
        let riv = d.company.rivalries.first();
        let (a, b) = riv.map(|r| (r.a.clone(), r.b.clone())).unwrap_or_else(|| (d.teams.first().map(|t| t.id.clone()).unwrap_or_default(), d.teams.get(1).map(|t| t.id.clone()).unwrap_or_default()));
        let name = |id: &str| d.teams.iter().find(|t| t.id == id).map(|t| clean(if t.short_name.is_empty() { &t.name } else { &t.short_name })).unwrap_or(id.to_string()).to_uppercase();
        let qa = p.quotas.get(&a).copied().unwrap_or(0.0); let qb = p.quotas.get(&b).copied().unwrap_or(0.0);
        let label = p.labels.get(&a).cloned().unwrap_or("QUOTA".into()).to_uppercase();
        for mut t in &mut quota { t.0 = format!("{}\n{} {:.0}%  vs  {} {:.0}%", label, name(&a), qa * 100.0, name(&b), qb * 100.0); }
        for (f, mut n) in &mut fills { n.width = Val::Percent(if f.0 == 0 { qa } else { qb } * 100.0); }
    }
}

/// the controls hint says its piece, then fades away (minimal HUD)
fn hint_fade(time: Res<Time>, mut q: Query<&mut TextColor, With<HintText>>) {
    let t = time.elapsed_secs();
    if t > 40.0 { return; }
    let a = if t < 18.0 { 0.7 } else { (0.7 * (1.0 - (t - 18.0) / 4.0)).max(0.0) };
    for mut c in &mut q { c.0 = c.0.with_alpha(a); }
}

fn memo_ui(mut cmd: Commands, memo: Res<Memo>, fonts: Res<Fonts>, ui: Res<UiState>, q: Query<(Entity, Option<&Children>), With<MemoBox>>, mut panel: Query<&mut Visibility, With<MemoPanel>>, mut last: Local<(usize, bool)>) {
    // no empty memo frame: the panel appears with its first line
    for mut v in &mut panel { let want = if memo.lines.is_empty() { Visibility::Hidden } else { Visibility::Inherited }; if *v != want { *v = want; } }
    if memo.total == last.0 && ui.mobile == last.1 { return; }
    *last = (memo.total, ui.mobile);
    let n = if ui.mobile { 1 } else { 2 };
    for (e, ch) in &q {
        if let Some(ch) = ch { for c in ch.iter() { cmd.entity(c).despawn(); } }
        cmd.entity(e).with_children(|p| {
            for (i, l) in memo.lines.iter().take(n).enumerate() {
                let col = match l.kind { MemoKind::Event => GREEN, MemoKind::Meeting => Color::srgb(0.6, 0.85, 0.95), MemoKind::People => Color::srgb(0.93, 0.88, 0.72), MemoKind::Gossip => Color::srgb(0.95, 0.72, 0.45), MemoKind::System => DIM };
                let alpha = if i == 0 { 1.0 } else { (1.0 - i as f32 * 0.07).max(0.45) };
                p.spawn(Node { flex_direction: FlexDirection::Row, column_gap: Val::Px(6.0), ..default() }).with_children(|r| {
                    r.spawn((Text::new(l.time.clone()), tf(&fonts.ui, 15.0), TextColor(DIM.with_alpha(alpha)), Node { flex_shrink: 0.0, ..default() }));
                    r.spawn((Text::new(l.text.clone()), tf(&fonts.ui, 15.0), TextColor(col.with_alpha(alpha)), Node { flex_shrink: 1.0, ..default() }));
                });
            }
        });
    }
}

/// mirrored from Machines so the catalog copy can mention the empty spot in the tank
pub static GERALD_MISSING: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);

/// one-line-ish: cut at a word boundary with an ellipsis
pub fn clip(s: &str, n: usize) -> String {
    if s.chars().count() <= n { return s.to_string(); }
    let cut: String = s.chars().take(n).collect();
    let cut = match cut.rfind(' ') { Some(i) if i > n / 2 => cut[..i].to_string(), _ => cut };
    format!("{}...", cut.trim_end_matches([',', '.', ';', ' ']))
}
const INSPECT_TEXT_W: f32 = 262.0;

pub fn pretty(key: &str) -> String {
    let base = key.trim_start_matches("emote_").replace(['_', '-'], " ");
    let base = base.trim_end_matches(" orange").trim_end_matches(" mustard").trim_end_matches(" teal").trim_end_matches(" avocado").trim_end_matches(" cream").trim_end_matches(" terracotta").to_string();
    let t: String = base.split(' ').filter(|w| !w.is_empty() && !matches!(*w, "n" | "s" | "e" | "w")).map(|w| { let mut c = w.chars(); c.next().map(|f| f.to_uppercase().collect::<String>() + c.as_str()).unwrap_or_default() }).collect::<Vec<_>>().join(" ");
    format!("The {}", t)
}
pub fn fallback_desc(key: &str) -> &'static str {
    let k = key.to_lowercase();
    if k.contains("cactus") { "A humble, water-avoiding plant. Refuses to be refined." }
    else if k.contains("plant") { "Photosynthesises quietly. Has never missed a quota." }
    else if k.contains("mug") { "Contains the residue of 400 coffees. Do not wash; it has seniority." }
    else if k.contains("chair") { "An ergonomically ambiguous seat. Swivels toward gratitude." }
    else if k.contains("crt") { "Displays the numbers. The numbers display back." }
    else if k.contains("coffee") { "The most important machine on the floor. Hums in C minor." }
    else if k.contains("cabinet") { "Drawer 3 is locked. Drawer 3 has always been locked." }
    else if k.contains("shrine") || k.contains("portrait") { "Our Founder, watching with infinite patience." }
    else if k.contains("water") { "Hydration station. Gossip hub. Burbles knowingly." }
    else if k.contains("lamp") { "Warm light for those who refine past midnight." }
    else if k.contains("photo") { "A framed photograph of someone's Outie, probably." }
    else if k.contains("stress") { "Squeezed 11,000 times. Still optimistic." }
    else if k.contains("keyboard") { "Beige, clacky, slightly sticky near the 7." }
    else if k.contains("figurine") || k.contains("trophy") { "A tchotchke awarded for exemplary refinement." }
    else if k.contains("phone") { "It rings. Nobody knows who is calling." }
    else if k.contains("lectern") { "Where gratitude is formally dispensed." }
    else if k.contains("screen") { "Shows a chart going up. Always up." }
    else if k.contains("table") || k.contains("desk") { "Mid-century walnut. Older than the company, somehow." }
    else { "Standard-issue. Catalogued, beloved, mildly mysterious." }
}
/// catalog lookup: company.json `catalog` / `objects` (map or list), else prettified atlas key
pub fn describe(d: &Company, key: &str) -> (String, String) {
    let alt = key.replace('_', "-");
    let pick = |h: &serde_json::Value| -> (String, String) {
        let n = h.get("name").and_then(|s| s.as_str()).map(clean).unwrap_or_else(|| pretty(key));
        let many: Vec<&str> = h.get("descriptions").and_then(|a| a.as_array()).map(|a| a.iter().filter_map(|x| x.as_str()).collect()).unwrap_or_default();
        // rotate through the catalog's descriptions every ~90 sim minutes so revisits reveal more lore
        let ds = if !many.is_empty() { let i = ((crate::agents::sim_now() / 90.0) as usize + key.len()) % many.len(); clean(many[i]) }
            else { h.get("description").or(h.get("desc")).and_then(|s| s.as_str()).map(clean).unwrap_or_else(|| fallback_desc(key).into()) };
        (n, ds)
    };
    // company.json objects: { catalog: {key: {...}}, instances: [{id, catalog_key, ...}] }
    if let Some(h) = d.objects.get("instances").and_then(|a| a.as_array()).and_then(|a| a.iter().find(|x| x.get("id").and_then(|s| s.as_str()) == Some(key))) { return pick(h); }
    if let Some(m) = d.objects.get("catalog").and_then(|c| c.as_object()) {
        if let Some(h) = m.get(key).or_else(|| m.get(&alt)).or_else(|| m.values().find(|v| v.get("atlas").and_then(|s| s.as_str()) == Some(key))) {
            let (n, mut ds) = pick(h);
            // the tank introduces its residents (company.json `fish`)
            if key.contains("aquarium") && !d.fish.is_empty() {
                ds.push_str(" Residents: ");
                ds.push_str(&d.fish.iter().map(|f| {
                    let n = if f.title.is_empty() { clean(&f.name) } else { format!("{} ({})", clean(&f.name), clean(&f.title)) };
                    if f.id == "gerald" && GERALD_MISSING.load(std::sync::atomic::Ordering::Relaxed) { format!("{} - MISSING. Last seen near the castle", n) } else { n }
                }).collect::<Vec<_>>().join(", "));
                ds.push('.');
            }
            return (n, ds);
        }
    }
    for v in [&d.catalog, &d.objects] {
        let hit = match v { serde_json::Value::Object(m) => m.get(key).cloned().or_else(|| m.get(&alt).cloned()), serde_json::Value::Array(a) => a.iter().find(|x| ["id", "key", "type", "sprite"].iter().any(|k| x.get(*k).and_then(|s| s.as_str()) == Some(key))).cloned(), _ => None };
        if let Some(h) = hit { return pick(&h); }
    }
    // atlas variants (colour, facing, size) share one catalog entry
    if let Some(base) = alias(key) { if base != key { let r = describe(d, base); if r.1 != fallback_desc(base) { return r; } } }
    if let Some((_, n, ds)) = EXTRA_CATALOG.iter().find(|(k, _, _)| key == *k || key.starts_with(&format!("{}_", k))) { return (n.to_string(), ds.to_string()); }
    (pretty(key), fallback_desc(key).into())
}

/// atlas key -> catalog key for furniture that comes in colours / facings / sizes
fn alias(key: &str) -> Option<&'static str> {
    let k = key;
    Some(if k.starts_with("armchair") { "armchair" } else if k.starts_with("bookshelf") { "archive-shelf" } else if k == "cabinet" || k.starts_with("cabinet_") { "filing_cabinet" }
        else if k.starts_with("crt_down") || k == "crt" { "crt_front" } else if k.starts_with("crt_up") { "crt_back" } else if k.starts_with("goat-fence") { "goat-fence" } else if k == "lamp" || k.starts_with("lamp_") { "desk_lamp" }
        else if k == "photo" || k.starts_with("photo_") { "photo_frame" } else if k == "plant-tall" || k == "plant" { "plant_tall" } else if k.starts_with("rug_") { "rug" } else if k.starts_with("screen_") { "screen" }
        else if k == "table_1x1" || k == "table_1x2" || k == "table_2x2" { "table_huddle" } else if k.starts_with("table_") { let w: u32 = k[6..].split('x').next().and_then(|s| s.parse().ok()).unwrap_or(0); if w >= 6 { "table_boardroom" } else { "table_team" } }
        else if k.starts_with("whiteboard") { "whiteboard" } else if k.starts_with("water_cooler") { "water_cooler" } else if k.starts_with("mug") { "mug_cream" } else if k.starts_with("chair_") { "chair_s_cream" } else { return None })
}

/// props the art pass added after the catalog was written (engine-side copy, same voice)
const EXTRA_CATALOG: &[(&str, &str, &str)] = &[
    ("beanbag", "The Beanbag", "Installed for Wellness. Exhales audibly when sat upon, which is considered a form of feedback."),
    ("printer", "The Printer", "Prints in grey, greyer and PC LOAD LETTER. Has jammed on every quarterly report since launch."),
    ("corridor-strip", "The Corridor Carpet", "A runner of regulation teal. Walking on it briskly counts toward your Step Quota."),
    ("plant_fern", "The Fern", "Prehistoric, unbothered, slightly damp. Outlived three reorganisations."),
    ("plant_monstera", "The Monstera", "Its leaves have holes in them on purpose. Facilities has stopped filing tickets about it."),
    ("plant_rubber", "The Rubber Plant", "Glossy, upright, and polished every Tuesday. The most promotable thing on the floor."),
    ("plant_succulent", "The Succulent", "Requires almost nothing. Has been named Employee of the Month twice."),
    ("plant", "The Office Plant", "Photosynthesises quietly. Has never missed a quota."),
];

#[derive(Component, Default)]
pub struct Thoughts(pub std::collections::VecDeque<(String, String)>);

#[allow(clippy::too_many_arguments)]
fn inspector_ui(
    mut cmd: Commands, insp: Res<Inspect>, data: Res<Data>, clock: Res<Clock>, (fonts, at): (Res<Fonts>, Res<ArtAtlas>), (rooms, bus): (Res<Rooms>, Res<Bus>),
    q: Query<(&Agent, &Cal, &Mover, &Pose, Option<&Thoughts>, Option<&crate::presence::Away>, Option<&crate::presence::Shift>)>, picks: Query<(&Pick, &Sprite)>, people_sprites: Query<(&crate::render::Body, &Sprite)>,
    mut panel: Query<&mut Node, With<InspectorPanel>>, body: Query<(Entity, Option<&Children>), With<InspectorBody>>, mut portrait: Query<(&mut ImageNode, &mut Node), (With<Portrait>, Without<InspectorPanel>)>,
    time: Res<Time>, mut acc: Local<(f32, Option<Inspect>)>, people_in: Query<(&Agent, &Mover)>,
) {
    acc.0 += time.delta_secs();
    let visible = !matches!(*insp, Inspect::None) && match *insp { Inspect::Agent(e) => q.get(e).is_ok(), Inspect::Prop(e) => picks.get(e).is_ok(), _ => true };
    for mut n in &mut panel { n.display = if visible { Display::Flex } else { Display::None }; }
    if !visible { acc.1 = None; return; }
    if acc.0 < 0.25 && acc.1.as_ref() == Some(&*insp) { return; }
    acc.0 = 0.0; acc.1 = Some(insp.clone());
    let d = &data.0;
    let tod = clock.mod_min();
    let bar = |v: f32| { let n = (v.clamp(0.0, 1.0) * 10.0).round() as usize; format!("{}{}", "|".repeat(n), ".".repeat(10 - n)) };
    let mut lines: Vec<(String, f32, Color, Handle<Font>)> = vec![];
    let (ui_f, px_f) = (&fonts.ui.clone(), &fonts.px.clone());
    let mut push = |s: String, size: f32, col: Color, f: &Handle<Font>| lines.push((s, size, col, f.clone()));
    // portrait
    let mut port: Option<(Handle<Image>, Option<TextureAtlas>, Option<Rect>, Vec2)> = None;
    match insp.clone() {
        Inspect::Agent(e) => {
            let (a, cal, mv, pose, th, away, shift) = q.get(e).unwrap();
            if let Some((b, s)) = people_sprites.iter().find(|(b, _)| b.owner == e) {
                let mut ta = s.texture_atlas.clone();
                if let (Some(ta), crate::render::SheetKind::Person) = (ta.as_mut(), b.sheet) { ta.index = at.people.row("idle", "S").unwrap_or(0) * at.people.cols as usize; }
                if let (Some(ta), crate::render::SheetKind::Animal) = (ta.as_mut(), b.sheet) { ta.index = 0; }
                let size = if b.sheet == crate::render::SheetKind::Animal { Vec2::new(48.0, 48.0) } else { Vec2::new(48.0, 64.0) };
                port = Some((s.image.clone(), ta, None, size));
            }
            let p = a.pi.map(|i| &d.people[i]);
            push(a.name.to_uppercase(), 8.0, GREEN, px_f);
            let role = p.map(|p| clean(&p.role)).unwrap_or_else(|| match a.role { Role::Goat => "Goat. Not on the org chart.".into(), Role::Dog => "Corgi. Employee of the Hour.".into(), Role::Visitor => a.task.clone(), _ => String::new() });
            push(role, 17.0, BEIGE, ui_f);
            let team = d.teams.iter().find(|t| t.id == a.team).map(|t| clean(&t.name)).unwrap_or_default();
            if !team.is_empty() { let mgr = p.and_then(|p| p.manager_id.as_ref()).and_then(|m| d.people.iter().find(|x| &x.id == m)).map(|m| clean(&m.first)).unwrap_or("-".into()); push(format!("{} - reports to {}", team, mgr), 16.0, DIM, ui_f); }
            let quirk = p.map(|p| clean(&p.quirk)).unwrap_or_else(|| a.task.clone());
            if !quirk.is_empty() { push(format!("\"{}\"", clip(&quirk, 84)), 15.0, Color::srgb(0.82, 0.8, 0.72), ui_f); }
            if !a.traits.is_empty() { push(format!("traits: {}", a.traits.iter().take(3).cloned().collect::<Vec<_>>().join(", ")), 15.0, DIM, ui_f); }
            // live action line
            let action = if let Some(w) = away {
                    let due = w.back - clock.t;
                    match w.why { crate::presence::Why::Home if due < 50.0 && due > 0.0 => format!("On the way in - due {}", fmt_min(w.back as f32)), crate::presence::Why::Home => format!("Gone home - back {}", fmt_min(w.back as f32)), crate::presence::Why::Lunch => format!("Off-site (lunch) - back {}", fmt_min(w.back as f32)), crate::presence::Why::Errand => format!("Off-site (errand) - back {}", fmt_min(w.back as f32)) }
                }
                else if pose.hidden { match a.plan.act { Act::Gone => if a.role == Role::Visitor { "Left the building".to_string() } else { "Ascended (Quarterly Elevator)".to_string() }, Act::Hidden if a.role == Role::Visitor => "Descending in the elevator".to_string(), _ => a.plan.label.clone() } }
                else if a.plan.act == Act::Leaving { a.plan.label.clone() }
                else if !mv.arrived && mv.vel.length_squared() > 0.0 { let to = match &a.plan.act { Act::Meeting { room, .. } | Act::Waiting { room } => clean(&d.rooms[*room].name), Act::Desk | Act::Nap => "their desk".into(), Act::Queue { q } => format!("the {} line", q), _ => clean(&a.plan.label) }; format!("{} to {}", if a.plan.run { "Running" } else { "Walking" }, to) }
                else { clean(&a.plan.label) };
            push(format!("> {}", action), 18.0, GREEN, ui_f);
            if let Some(sh) = shift { push(match sh.crew { crate::presence::Crew::Day => "shift: day crew".to_string(), crate::presence::Crew::Night => "shift: night crew".to_string(), crate::presence::Crew::Always => "shift: has never been seen leaving".to_string() }, 16.0, DIM, ui_f); }
            if a.role == Role::Staff && away.is_none() {
                push(format!("MOOD   {} {:>3.0}%", bar(a.mood()), a.mood() * 100.0), 16.0, GREEN, ui_f);
                push(format!("ENERGY {}", bar(a.needs.energy)), 16.0, GREEN, ui_f);
                push(format!("FOCUS  {}", bar(a.needs.focus)), 16.0, GREEN, ui_f);
                push(format!("STRESS {}", bar(a.needs.stress)), 16.0, Color::srgb(0.95, 0.72, 0.45), ui_f);
            }
            if let Some(di) = a.desk { let dk = &d.layout.desks[di]; let sec = d.layout.sections.iter().find(|s| s.id == dk.section_id).map(|s| clean(&s.name)).unwrap_or_default(); push(format!("desk: {} ({})", dk.id, sec), 16.0, DIM, ui_f); }
            if let Some(th) = th { if !th.0.is_empty() { push("RECENT THOUGHTS".into(), 8.0, BEIGE, px_f); for (t, s) in th.0.iter().rev().take(2) { push(format!("{} \"{}\"", t, clip(s, 60)), 15.0, Color::srgb(0.75, 0.82, 0.78), ui_f); } } }
            if cal.slots.iter().any(|s| s.end > 0.0) {
                push(format!("TODAY - {}", DAYS[clock.weekday()].to_uppercase()), 8.0, BEIGE, px_f);
                let cur = cal.slots.iter().position(|s| tod >= s.start && tod < s.end).or_else(|| cal.slots.iter().position(|s| s.start > tod)).unwrap_or(0);
                for s in cal.slots.iter().skip(cur).take(4) {
                    if s.end <= 0.0 { continue; }
                    let now = tod >= s.start && tod < s.end;
                    let room = d.rooms.iter().find(|r| r.id == s.item.room_id).map(|r| clean(&r.name)).unwrap_or_else(|| s.item.room_id.replace('_', " "));
                    push(if now { format!("> {} {} @ {}", fmt_min(s.start), clip(&clean(&s.item.title), 26), clip(&room, 18)) } else { format!("  {} {}", fmt_min(s.start), clip(&clean(&s.item.title), 30)) }, 15.0, if now { GREEN } else if s.end < tod { Color::srgba(0.45, 0.55, 0.5, 0.6) } else { Color::srgb(0.75, 0.82, 0.78) }, ui_f);
                }
            }
        }
        Inspect::Prop(e) => {
            let (pk, s) = picks.get(e).unwrap();
            let (name, desc) = describe(d, &pk.key);
            port = Some((s.image.clone(), None, s.rect, s.rect.map(|r| (r.size() * 2.0).min(Vec2::new(96.0, 96.0))).unwrap_or(Vec2::splat(48.0))));
            push(name.to_uppercase(), 8.0, GREEN, px_f);
            push(desc, 17.0, BEIGE, ui_f);
            if let Some(o) = &pk.owner { let n = d.people.iter().find(|p| &p.id == o).map(|p| clean(&p.name)).unwrap_or(o.clone()); push(format!("Belongs to {}", n), 16.0, DIM, ui_f); }
        }
        Inspect::Room(ri) => {
            let r = &d.rooms[ri];
            push(clean(&r.name).to_uppercase(), 8.0, GREEN, px_f);
            push(format!("{} - seats {}", r.size, r.capacity), 16.0, BEIGE, ui_f);
            if !r.purpose.is_empty() { push(clean(&r.purpose), 16.0, DIM, ui_f); }
            let st = rooms.states.get(ri).cloned().unwrap_or_default();
            push(if st.count > 0 && !st.title.is_empty() { format!("NOW: {}", st.title) } else { "NOW: (empty)".into() }, 18.0, GREEN, ui_f);
            if st.overrun_until > clock.t { push(format!("OVERRUNNING - {} waiting outside", st.waiting), 16.0, Color::srgb(0.95, 0.62, 0.35), ui_f); }
            let occ: Vec<String> = people_in.iter().filter(|(a, m)| m.arrived && matches!(a.plan.act, Act::Meeting { room, .. } if room == ri)).map(|(a, _)| a.first.clone()).collect();
            if !occ.is_empty() { push(format!("in the room: {}", occ.join(", ")), 16.0, DIM, ui_f); }
            push("AGENDA (TODAY)".into(), 8.0, BEIGE, px_f);
            let mut seen = std::collections::HashSet::new();
            let mut items: Vec<(f32, f32, String, usize)> = vec![];
            for p in &d.people { for it in d.calendar_for(p, clock.weekday()) { if it.room_id == r.id && seen.insert(format!("{}{}", it.start, it.title)) { items.push((to_min(&it.start), to_min(&it.end), clean(&it.title), it.attendees.len())); } } }
            items.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());
            let cur = items.iter().position(|x| x.1 > tod).unwrap_or(0);
            for (s, e, t, n) in items.iter().skip(cur).take(6) { let now = tod >= *s && tod < *e; push(format!("{}{}-{} {} ({})", if now { "> " } else { "  " }, fmt_min(*s), fmt_min(*e), t, n), 16.0, if now { GREEN } else { Color::srgb(0.75, 0.82, 0.78) }, ui_f); }
        }
        Inspect::Event(serial) => {
            if let Some(a) = bus.find(serial) { let ev = &d.events[a.def]; push(clean(&ev.name).to_uppercase(), 8.0, GREEN, px_f); push(format!("{} event - ends {}", ev.kind, fmt_min(a.until as f32)), 16.0, BEIGE, ui_f); push(format!("{} people involved, {} have heard", a.joiners.len(), a.knowers), 16.0, DIM, ui_f); }
            else { push("This moment has passed.".into(), 16.0, DIM, ui_f); }
        }
        Inspect::None => {}
    }
    for (mut img, mut n) in &mut portrait {
        match &port { Some((h, ta, rect, size)) => { img.image = h.clone(); img.texture_atlas = ta.clone(); img.rect = *rect; n.width = Val::Px(size.x.min(48.0)); n.height = Val::Px(size.y.min(64.0)); n.display = Display::Flex; } None => { n.display = Display::None; } }
    }
    for (e, ch) in &body {
        if let Some(ch) = ch { for c in ch.iter() { cmd.entity(c).despawn(); } }
        cmd.entity(e).with_children(|b| { for (s, size, col, f) in &lines { b.spawn((Text::new(s.clone()), tf(f, *size), TextColor(*col), Node { max_width: Val::Px(INSPECT_TEXT_W), ..default() })); } });
    }
}

fn overlays(m: Res<Machines>, clock: Res<Clock>, mut a: Query<&mut BackgroundColor, (With<AlarmOverlay>, Without<FlickerOverlay>)>, mut f: Query<&mut BackgroundColor, (With<FlickerOverlay>, Without<AlarmOverlay>)>, time: Res<Time>) {
    let t = time.elapsed_secs();
    for mut b in &mut a { let v = if m.alarm > 0.0 { ((t * 6.0).sin() * 0.5 + 0.5) * 0.16 * m.alarm.min(1.0) } else { 0.0 }; b.0 = Color::srgba(0.85, 0.1, 0.1, v); }
    for mut b in &mut f { let v = if m.flicker > 0.0 && !clock.paused { let n = ((t * 37.0).sin() * (t * 11.3).cos()).abs(); if n > 0.8 { 0.22 } else { 0.0 } } else { 0.0 }; b.0 = Color::srgba(0.02, 0.03, 0.03, v); }
}

/// RCT-style name tag that follows the cursor over anyone / anything
#[allow(clippy::too_many_arguments)]
fn hover_tag(hover: Res<Hover>, win: Query<&Window>, q: Query<(&Agent, &Pose)>, picks: Query<&Pick>, data: Res<Data>, mut tag: Query<(&mut Node, &Children), With<HoverTag>>, mut texts: Query<&mut Text>, ui: Res<UiState>) {
    let Ok(w) = win.single() else { return };
    let label = if let Some(e) = hover.agent { q.get(e).ok().map(|(a, _)| { let role = a.pi.map(|i| clean(&data.0.people[i].role)).unwrap_or_default(); if role.is_empty() { a.name.clone() } else { format!("{} - {}", a.name, role) } }) } else if let Some(e) = hover.prop { picks.get(e).ok().map(|p| describe(&data.0, &p.key).0) } else { None };
    for (mut n, ch) in &mut tag {
        match (&label, w.cursor_position()) {
            (Some(l), Some(c)) if !ui.mobile => { n.display = Display::Flex; n.left = Val::Px(c.x + 14.0); n.top = Val::Px(c.y + 16.0); if let Some(t) = ch.first() { if let Ok(mut t) = texts.get_mut(*t) { if t.0 != *l { t.0 = l.clone(); } } } }
            _ => n.display = Display::None,
        }
    }
}

/// highlight: hovered / picked prop gets a 1px teal outline (4 offset tinted copies behind it) and a soft pulse
fn prop_outline(mut cmd: Commands, hover: Res<Hover>, insp: Res<Inspect>, picks: Query<(Entity, &Sprite, &Transform), With<Pick>>, outlines: Query<Entity, With<Outline>>, mut last: Local<(Option<Entity>, Option<Entity>)>, time: Res<Time>, mut tint: Query<&mut Sprite, (With<Outline>, Without<Pick>)>) {
    let picked = if let Inspect::Prop(e) = *insp { Some(e) } else { None };
    let cur = (picked, hover.prop.filter(|h| Some(*h) != picked));
    if cur != *last {
        *last = cur;
        for e in &outlines { cmd.entity(e).despawn(); }
        for (target, strong) in [(cur.0, true), (cur.1, false)] {
            let Some(t) = target else { continue };
            let Ok((_, s, tf)) = picks.get(t) else { continue };
            for off in [Vec2::X, -Vec2::X, Vec2::Y, -Vec2::Y] {
                let mut o = s.clone();
                o.color = if strong { Color::srgba(0.05, 0.25, 0.22, 1.0) } else { Color::srgba(0.05, 0.25, 0.22, 0.55) };
                cmd.spawn((o, Transform::from_translation(tf.translation + off.extend(-0.002)).with_scale(tf.scale), Outline));
            }
        }
    }
    let k = 0.75 + 0.25 * (time.elapsed_secs() * 4.0).sin();
    for mut s in &mut tint { let a = s.color.alpha(); s.color = Color::srgba(0.05 * k, 0.32 * k, 0.28 * k, a); }
}

/// drag the inspector by its title bar (desktop)
fn panel_drag(mut drag: ResMut<PanelDrag>, handle: Query<&Interaction, With<DragHandle>>, mouse: Res<ButtonInput<MouseButton>>, win: Query<&Window>, ui: Res<UiState>) {
    let Ok(w) = win.single() else { return };
    let Some(c) = w.cursor_position() else { return };
    if ui.mobile { if drag.active { drag.active = false; } return; }
    if mouse.just_pressed(MouseButton::Left) && handle.iter().any(|i| *i == Interaction::Pressed || *i == Interaction::Hovered) { drag.active = true; drag.last = c; }
    if drag.active {
        if !mouse.pressed(MouseButton::Left) { drag.active = false; return; }
        let d = c - drag.last; drag.last = c;
        if d != Vec2::ZERO { drag.offset = (drag.offset + d).clamp(Vec2::new(-10.0, -100.0), Vec2::new(w.width() - 360.0, w.height() - 160.0)); }
    }
}

/// every line someone says goes into their inspector thought log (last 6)
fn record_thoughts(mut cmd: Commands, mut ev: EventReader<Say>, clock: Res<Clock>, mut q: Query<Option<&mut Thoughts>, With<Agent>>) {
    for s in ev.read() {
        let Ok(th) = q.get_mut(s.who) else { continue };
        let line = (clock.hhmm(), clean(&s.text));
        match th { Some(mut th) => { th.0.push_back(line); while th.0.len() > 6 { th.0.pop_front(); } } None => { cmd.entity(s.who).insert(Thoughts(std::collections::VecDeque::from([line]))); } }
    }
}

/// ?select=<person id>[&follow=1]: open their inspector at startup (also used by the playtest shots)
fn url_select(params: Res<Params>, q: Query<(Entity, &Agent)>, mut sel: ResMut<Selected>, mut insp: ResMut<Inspect>, mut ctl: ResMut<CamCtl>, mut done: Local<u32>) {
    if *done > 3 { return; }
    *done += 1;
    let Some(id) = params.select.as_ref() else { *done = 99; return };
    if let Some((e, _)) = q.iter().find(|(_, a)| a.id == *id) { sel.0 = Some(e); *insp = Inspect::Agent(e); if params.follow { ctl.follow = Some(e); } *done = 99; }
}
