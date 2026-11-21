//! ART agent's atlas.json (compiled in) + runtime-loaded PNG handles. Every lookup is optional so a
//! missing frame silently falls back to procedural art.
use bevy::image::{ImageLoaderSettings, ImageSampler};
use bevy::prelude::*;
use bevy::sprite::Anchor;
use serde_json::Value;
use std::collections::HashMap;

pub const ATLAS_JSON: &str = include_str!(concat!(env!("OUT_DIR"), "/atlas.json"));

#[derive(Clone, Debug, Default)]
pub struct PropDef { pub frames: Vec<Rect>, pub anchor: Vec2, pub fps: f32, pub states: HashMap<String, Vec<usize>>, pub float: bool, pub text_rect: Option<Rect>, pub slice: f32, pub seats: Vec<(Vec2, String)>, pub tile: bool, pub looped: bool }
impl PropDef {
    pub fn size(&self) -> Vec2 { self.frames.first().map(|r| r.size()).unwrap_or(Vec2::ONE) }
    pub fn anchor_custom(&self) -> Anchor { let s = self.size(); Anchor::Custom(Vec2::new(self.anchor.x / s.x - 0.5, 0.5 - self.anchor.y / s.y)) }
}
#[derive(Clone, Debug, Default)]
pub struct AnimDef { pub frames: usize, pub fps: f32, pub looped: bool }
#[derive(Clone, Debug, Default)]
pub struct SheetDef { pub cell: UVec2, pub foot: Vec2, pub cols: u32, pub rows: Vec<String>, pub anims: HashMap<String, AnimDef> }
impl SheetDef {
    pub fn anchor(&self) -> Anchor { Anchor::Custom(Vec2::new(self.foot.x / self.cell.x as f32 - 0.5, 0.5 - self.foot.y / self.cell.y as f32)) }
    pub fn row(&self, anim: &str, dir: &str) -> Option<usize> { let k = format!("{anim}_{dir}"); self.rows.iter().position(|r| *r == k) }
}

#[derive(Resource, Default)]
pub struct ArtAtlas {
    pub ok: bool,
    pub props: HashMap<String, PropDef>,
    pub sheet: Handle<Image>,
    pub people: SheetDef,
    pub people_layout: Handle<TextureAtlasLayout>,
    pub by_person: HashMap<String, Handle<Image>>,
    pub presets: Vec<Handle<Image>>,
    pub animals: HashMap<String, (Handle<Image>, SheetDef, Handle<TextureAtlasLayout>)>,
    pub vignette: Handle<Image>,
}
impl ArtAtlas {
    pub fn prop(&self, name: &str) -> Option<&PropDef> { if self.ok { self.props.get(name) } else { None } }
    pub fn sprite(&self, name: &str, frame: usize) -> Option<Sprite> {
        let p = self.prop(name)?;
        let r = *p.frames.get(frame % p.frames.len().max(1))?;
        Some(Sprite { image: self.sheet.clone(), rect: Some(r), anchor: p.anchor_custom(), ..default() })
    }
}

fn rect(v: &Value) -> Option<Rect> { let a = v.as_array()?; let f = |i: usize| a.get(i).and_then(|x| x.as_f64()).unwrap_or(0.0) as f32; Some(Rect::new(f(0), f(1), f(0) + f(2), f(1) + f(3))) }
fn v2(v: &Value) -> Vec2 { let a = v.as_array(); Vec2::new(a.and_then(|a| a.first()).and_then(|x| x.as_f64()).unwrap_or(0.0) as f32, a.and_then(|a| a.get(1)).and_then(|x| x.as_f64()).unwrap_or(0.0) as f32) }
fn sheet_def(v: &Value) -> SheetDef {
    let mut s = SheetDef { cell: { let c = v2(&v["cell"]); UVec2::new(c.x.max(1.0) as u32, c.y.max(1.0) as u32) }, foot: v2(&v["foot_anchor"]), cols: v["cols"].as_u64().unwrap_or(4) as u32, rows: vec![], anims: HashMap::new() };
    if let Some(r) = v["rows"].as_array() { s.rows = r.iter().filter_map(|x| x.as_str().map(String::from)).collect(); }
    if let Some(m) = v["anims"].as_object() { for (k, a) in m { s.anims.insert(k.clone(), AnimDef { frames: a["frames"].as_u64().unwrap_or(1) as usize, fps: a["fps"].as_f64().unwrap_or(4.0) as f32, looped: a["loop"].as_bool().unwrap_or(true) }); } }
    s
}

pub fn load_atlas(mut cmd: Commands, assets: Res<AssetServer>, mut layouts: ResMut<Assets<TextureAtlasLayout>>) {
    let mut at = ArtAtlas::default();
    let v: Value = serde_json::from_str(ATLAS_JSON).unwrap_or(Value::Null);
    if let Some(props) = v["props"].as_object() {
        for (k, p) in props {
            let frames: Vec<Rect> = p["frames"].as_array().map(|a| a.iter().filter_map(rect).collect()).unwrap_or_default();
            if frames.is_empty() { continue; }
            let mut states = HashMap::new();
            if let Some(s) = p["states"].as_object() { for (sk, sv) in s { states.insert(sk.clone(), sv.as_array().map(|a| a.iter().filter_map(|x| x.as_u64().map(|n| n as usize)).collect()).unwrap_or_default()); } }
            let seats = p["seats"].as_array().map(|a| a.iter().map(|s| (Vec2::new(s["x"].as_f64().unwrap_or(0.0) as f32, s["y"].as_f64().unwrap_or(0.0) as f32), s["facing"].as_str().unwrap_or("S").to_string())).collect()).unwrap_or_default();
            at.props.insert(k.clone(), PropDef { frames, anchor: v2(&p["anchor"]), fps: p["fps"].as_f64().unwrap_or(0.0) as f32, states, float: p["float"].as_bool().unwrap_or(false), text_rect: p.get("text_rect").and_then(rect), slice: p["slice"].as_f64().unwrap_or(0.0) as f32, seats, tile: p["tile"].as_bool().unwrap_or(false), looped: p["loop"].as_bool().unwrap_or(true) });
        }
        at.sheet = assets.load(format!("art/{}", v["props_sheet"].as_str().unwrap_or("props.png")));
        at.ok = true;
    }
    if v["people"].is_object() {
        at.people = sheet_def(&v["people"]);
        let rows = at.people.rows.len().max(1) as u32;
        at.people_layout = layouts.add(TextureAtlasLayout::from_grid(at.people.cell, at.people.cols, rows, None, None));
        if let Some(m) = v["people"]["by_person"].as_object() { for (id, path) in m { if let Some(p) = path.as_str() { at.by_person.insert(id.clone(), assets.load(format!("art/{p}"))); } } }
        if let Some(a) = v["people"]["presets"].as_array() { for p in a { let path = p.as_str().map(String::from).or_else(|| p["sheet"].as_str().map(String::from)).or_else(|| p.as_str().map(|id| format!("people/{id}.png"))); if let Some(path) = path { let path = if path.ends_with(".png") { path } else { format!("people/{path}.png") }; at.presets.push(assets.load(format!("art/{path}"))); } } }
    }
    for key in ["goat", "dog"] {
        if v[key].is_object() {
            let s = sheet_def(&v[key]);
            let l = layouts.add(TextureAtlasLayout::from_grid(s.cell, s.cols, s.rows.len().max(1) as u32, None, None));
            let name = v[key]["pet_id"].as_str().unwrap_or(key).to_string();
            at.animals.insert(if key == "dog" { "dog".into() } else { "goat".into() }, (assets.load(format!("art/{}", v[key]["sheet"].as_str().unwrap_or("goat.png"))), s, l));
            let _ = name;
        }
    }
    at.vignette = assets.load_with_settings("art/vignette.png", |s: &mut ImageLoaderSettings| s.sampler = ImageSampler::linear());
    cmd.insert_resource(at);
}
