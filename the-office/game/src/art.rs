//! Procedural pixel art (engine-side fallback until/alongside ART sheets). Everything is drawn into
//! RGBA buffers at startup; sampling is nearest so it stays crisp at any integer zoom.
use crate::data::*;
use bevy::asset::RenderAssetUsages;
use bevy::image::Image;
use bevy::prelude::*;
use bevy::render::render_resource::{Extent3d, TextureDimension, TextureFormat};
use std::collections::HashMap;

pub const FW: u32 = 16; // person frame size
pub const FH: u32 = 24;
pub const COLS: u32 = 12;
// column indices in a person sheet
pub const C_IDLE: usize = 0;
pub const C_WALK: usize = 1; // 1..=4
pub const C_SIT: usize = 5;
pub const C_TYPE: usize = 6; // 6,7
pub const C_NAP: usize = 8;
pub const C_CHEER: usize = 9;
pub const C_FACEPALM: usize = 10;
pub const C_BLINK: usize = 11;

#[derive(Clone, Copy)]
pub struct Rgba(pub [u8; 4]);
pub fn c(hexs: &str) -> Rgba { let s = hexs.trim_start_matches('#'); let p = |i: usize| u8::from_str_radix(s.get(i..i + 2).unwrap_or("80"), 16).unwrap_or(128); Rgba([p(0), p(2), p(4), 255]) }
impl Rgba {
    pub fn shade(self, f: f32) -> Rgba { let m = |v: u8| ((v as f32 * f).clamp(0.0, 255.0)) as u8; Rgba([m(self.0[0]), m(self.0[1]), m(self.0[2]), self.0[3]]) }
    pub fn mix(self, o: Rgba, t: f32) -> Rgba { let m = |a: u8, b: u8| (a as f32 + (b as f32 - a as f32) * t) as u8; Rgba([m(self.0[0], o.0[0]), m(self.0[1], o.0[1]), m(self.0[2], o.0[2]), self.0[3]]) }
    pub fn a(self, a: u8) -> Rgba { Rgba([self.0[0], self.0[1], self.0[2], a]) }
}

pub struct Canvas { pub w: u32, pub h: u32, pub px: Vec<u8> }
impl Canvas {
    pub fn new(w: u32, h: u32) -> Self { Canvas { w, h, px: vec![0; (w * h * 4) as usize] } }
    pub fn set(&mut self, x: i32, y: i32, col: Rgba) {
        if x < 0 || y < 0 || x >= self.w as i32 || y >= self.h as i32 || col.0[3] == 0 { return; }
        let i = ((y as u32 * self.w + x as u32) * 4) as usize;
        if col.0[3] == 255 { self.px[i..i + 4].copy_from_slice(&col.0); } else {
            let a = col.0[3] as f32 / 255.0;
            for k in 0..3 { self.px[i + k] = (self.px[i + k] as f32 * (1.0 - a) + col.0[k] as f32 * a) as u8; }
            self.px[i + 3] = self.px[i + 3].max(col.0[3]);
        }
    }
    pub fn get(&self, x: i32, y: i32) -> [u8; 4] { if x < 0 || y < 0 || x >= self.w as i32 || y >= self.h as i32 { return [0; 4]; } let i = ((y as u32 * self.w + x as u32) * 4) as usize; [self.px[i], self.px[i + 1], self.px[i + 2], self.px[i + 3]] }
    pub fn rect(&mut self, x: i32, y: i32, w: i32, h: i32, col: Rgba) { for j in y..y + h { for i in x..x + w { self.set(i, j, col); } } }
    pub fn hline(&mut self, x: i32, y: i32, w: i32, col: Rgba) { self.rect(x, y, w, 1, col) }
    pub fn vline(&mut self, x: i32, y: i32, h: i32, col: Rgba) { self.rect(x, y, 1, h, col) }
    pub fn frame(&mut self, x: i32, y: i32, w: i32, h: i32, col: Rgba) { self.hline(x, y, w, col); self.hline(x, y + h - 1, w, col); self.vline(x, y, h, col); self.vline(x + w - 1, y, h, col); }
    pub fn rrect(&mut self, x: i32, y: i32, w: i32, h: i32, col: Rgba) { self.rect(x + 1, y, w - 2, h, col); self.rect(x, y + 1, 1, h - 2, col); self.rect(x + w - 1, y + 1, 1, h - 2, col); }
    pub fn disc(&mut self, cx: f32, cy: f32, r: f32, col: Rgba) { for j in (cy - r) as i32 - 1..=(cy + r) as i32 + 1 { for i in (cx - r) as i32 - 1..=(cx + r) as i32 + 1 { let dx = i as f32 + 0.5 - cx; let dy = j as f32 + 0.5 - cy; if dx * dx + dy * dy <= r * r { self.set(i, j, col); } } } }
    /// dark outline around opaque pixels within a sub-rect
    pub fn outline(&mut self, x0: i32, y0: i32, w: i32, h: i32, col: Rgba) {
        let mut pts = vec![];
        for y in y0..y0 + h { for x in x0..x0 + w {
            if self.get(x, y)[3] != 0 { continue; }
            let n = [(1, 0), (-1, 0), (0, 1), (0, -1)].iter().any(|(dx, dy)| { let (nx, ny) = (x + dx, y + dy); nx >= x0 && ny >= y0 && nx < x0 + w && ny < y0 + h && self.get(nx, ny)[3] > 200 });
            if n { pts.push((x, y)); }
        } }
        for (x, y) in pts { self.set(x, y, col); }
    }
    pub fn image(self) -> Image {
        Image::new(Extent3d { width: self.w, height: self.h, depth_or_array_layers: 1 }, TextureDimension::D2, self.px, TextureFormat::Rgba8UnormSrgb, RenderAssetUsages::RENDER_WORLD | RenderAssetUsages::MAIN_WORLD)
    }
}

pub const SKINS: [&str; 7] = ["#f6d7c3", "#eec1a0", "#d9a07a", "#c18660", "#9c6644", "#7a4b2e", "#5a3520"];
pub const OUTLINE: Rgba = Rgba([40, 34, 38, 255]);

pub fn skin_of(l: &Look, seed: u64) -> Rgba {
    match &l.skin {
        serde_json::Value::Number(n) => c(SKINS[(n.as_u64().unwrap_or(0) as usize).min(6)]),
        serde_json::Value::String(s) if s.starts_with('#') => c(s),
        _ => c(SKINS[(seed % 7) as usize]),
    }
}
fn or<'a>(s: &'a str, d: &'a str) -> &'a str { if s.starts_with('#') { s } else { d } }

#[derive(Clone, Copy, PartialEq)]
pub enum Kind { Staff, Facilities, Supervisor, Goat, Dog }

/// Draws one 16x24 person frame at (ox,oy).
fn person_frame(cv: &mut Canvas, ox: i32, oy: i32, l: &Look, seed: u64, kind: Kind, dir: Facing, col: usize) {
    let skin = skin_of(l, seed);
    let (mut shirt, mut pants) = (c(or(&l.shirt, "#3b4a6b")), c(or(&l.pants, "#3a3a3a")));
    if kind == Kind::Facilities { shirt = c("#9a9da2"); pants = c("#8a8d92"); }
    if kind == Kind::Supervisor { shirt = c("#1f2638"); pants = c("#1f2638"); }
    let hair = c(or(&l.hair, "#2b1d14"));
    let shoes = c(or(&l.shoes, "#2a2220"));
    let style = l.hair_style.as_str();
    let acc = l.accessory.as_str();
    let extra = l.extra.as_str().unwrap_or("");
    let sitting = matches!(col, C_SIT | 6 | 7 | C_NAP);
    let walk = (C_WALK..C_WALK + 4).contains(&col);
    let wf = if walk { col - C_WALK } else { 0 }; // 0..3
    let bob = if walk && (wf == 1 || wf == 3) { -1 } else { 0 };
    let sy = if sitting { 3 } else { 0 }; // sitting lowers torso
    let napdrop = if col == C_NAP { 3 } else { 0 };
    let x = |v: i32| ox + v;
    let y = |v: i32| oy + v;
    let side = matches!(dir, Facing::Left | Facing::Right);
    let flip = dir == Facing::Left;
    let fx = |v: i32| if flip { ox + 15 - v } else { ox + v };
    let shirt_d = shirt.shade(0.78);
    let skin_d = skin.shade(0.85);
    // ---- legs
    if !sitting {
        if side {
            let st = [0, 2, 0, -2][wf];
            cv.rect(fx(7 + st.min(0)), y(18 + bob), 2, 5, pants.shade(0.85));
            cv.rect(fx(7 - st.max(0) + st.max(0)), y(18 + bob), 2, 5, pants);
            cv.rect(fx(6 + st), y(18 + bob), 3, 5 - bob.abs(), pants);
            cv.rect(fx(6 + st), y(23), 3, 1, shoes);
            cv.rect(fx(7 - st), y(23), 3, 1, shoes.shade(0.8));
        } else {
            let (l1, l2) = match wf { 1 => (-1, 0), 3 => (0, -1), _ => (0, 0) };
            cv.rect(x(5), y(18 + bob), 3, 5 + l1 - bob, pants);
            cv.rect(x(8), y(18 + bob), 3, 5 + l2 - bob, pants.shade(0.9));
            cv.rect(x(5), y(23 + l1), 3, 1, shoes);
            cv.rect(x(8), y(23 + l2), 3, 1, shoes);
        }
    } else {
        // bent legs, seen from the front: knees + shoes peek out below the torso
        if dir != Facing::Up {
            if side { cv.rect(fx(7), y(19), 6, 2, pants); cv.rect(fx(11), y(21), 2, 2, pants.shade(0.85)); cv.rect(fx(11), y(23), 3, 1, shoes); }
            else { cv.rect(x(5), y(19), 6, 3, pants); cv.rect(x(5), y(22), 2, 1, shoes); cv.rect(x(9), y(22), 2, 1, shoes); }
        }
    }
    // ---- torso
    let ty = 11 + sy + bob;
    let tw = if side { 6 } else { 8 };
    let tx = if side { 5 } else { 4 };
    for j in 0..7 { for i in 0..tw { let colr = if i == 0 || i == tw - 1 || j == 6 { shirt_d } else { shirt }; cv.set(fx(tx + i), y(ty + j), colr); } }
    if !side && dir == Facing::Down {
        match l.outfit.as_str() { _ => {} }
        if acc == "tie" { cv.vline(x(7), y(ty), 5, c("#7a2b22")); cv.vline(x(8), y(ty), 4, c("#8f3a2c")); }
        if acc == "bowtie" { cv.rect(x(6), y(ty), 4, 1, c("#a33a2a")); }
        if acc == "lanyard" { cv.set(x(6), y(ty), c("#d8b34a")); cv.set(x(9), y(ty), c("#d8b34a")); cv.rect(x(7), y(ty + 3), 2, 2, c("#f4f0e6")); }
        if acc == "scarf" { cv.rect(x(4), y(ty), 8, 2, c("#c56a2c")); }
        // collar
        cv.set(x(6), y(ty), shirt.shade(1.15)); cv.set(x(9), y(ty), shirt.shade(1.15));
        if kind == Kind::Supervisor { cv.vline(x(7), y(ty), 6, c("#cfc6a8")); cv.set(x(7), y(ty + 1), c("#8a1f1f")); }
    }
    // ---- arms
    let ay = ty + 1;
    let (mut la, mut ra) = (0, 0); // vertical swing
    if walk { la = [0, 1, 0, -1][wf]; ra = -la; }
    match col {
        C_CHEER => {
            if side { cv.rect(fx(9), y(ty - 6), 2, 7, shirt_d); cv.rect(fx(9), y(ty - 8), 2, 2, skin); }
            else { cv.rect(x(2), y(ty - 6), 2, 7, shirt_d); cv.rect(x(12), y(ty - 6), 2, 7, shirt_d); cv.rect(x(2), y(ty - 8), 2, 2, skin); cv.rect(x(12), y(ty - 8), 2, 2, skin); }
        }
        6 | 7 if dir != Facing::Up => {
            // typing: forearms forward, hands alternate
            let k = if col == 6 { 0 } else { 1 };
            if side { cv.rect(fx(9), y(ay + 2), 4, 2, shirt_d); cv.set(fx(13), y(ay + 2 + k), skin); }
            else { cv.rect(x(3), y(ay), 2, 4, shirt_d); cv.rect(x(11), y(ay), 2, 4, shirt_d); cv.set(x(4), y(ay + 4 + k), skin); cv.set(x(11), y(ay + 5 - k), skin); cv.set(x(5), y(ay + 4 + k), skin); cv.set(x(10), y(ay + 5 - k), skin); }
        }
        C_FACEPALM if !side && dir == Facing::Down => {
            cv.rect(x(3), y(ay), 2, 6, shirt_d); cv.rect(x(3), y(ay + 6), 2, 1, skin);
            cv.rect(x(11), y(ay - 2), 2, 4, shirt_d); cv.rect(x(8), y(ty - 4), 4, 2, skin);
        }
        _ => {
            if side { cv.rect(fx(7 + la), y(ay + la.abs().min(1) - 0), 2, 6, shirt_d); cv.rect(fx(7 + la), y(ay + 6), 2, 1, skin); }
            else if col == C_NAP { cv.rect(x(3), y(ay), 10, 3, shirt_d); }
            else { cv.rect(x(3), y(ay + la), 1, 6, shirt_d); cv.rect(x(12), y(ay + ra), 1, 6, shirt_d); cv.set(x(3), y(ay + 6 + la), skin); cv.set(x(12), y(ay + 6 + ra), skin); }
        }
    }
    // ---- head
    let hy = 2 + sy + bob + napdrop;
    let hx0 = if side { 5 } else { 4 };
    let hw = if side { 7 } else { 8 };
    for j in 0..9 { for i in 0..hw {
        let corner = (j == 0 || j == 8) && (i == 0 || i == hw - 1);
        if !corner { cv.set(fx(hx0 + i), y(hy + j), if j == 8 { skin_d } else { skin }); }
    } }
    // ears
    if !side { cv.set(x(3), y(hy + 4), skin_d); cv.set(x(12), y(hy + 4), skin_d); } else { cv.set(fx(6), y(hy + 4), skin_d); }
    // face
    let eye = c("#2a1f24");
    let closed = col == C_NAP || col == C_BLINK;
    if dir == Facing::Down {
        if closed { cv.hline(x(5), y(hy + 5), 2, eye); cv.hline(x(9), y(hy + 5), 2, eye); }
        else { cv.rect(x(6), y(hy + 4), 1, 2, eye); cv.rect(x(9), y(hy + 4), 1, 2, eye); cv.set(x(5), y(hy + 6), skin.mix(c("#ff8a80"), 0.35)); cv.set(x(10), y(hy + 6), skin.mix(c("#ff8a80"), 0.35)); }
        if col == C_CHEER { cv.rect(x(7), y(hy + 7), 2, 1, c("#7a2b2b")); } else { cv.hline(x(7), y(hy + 7), 2, skin.shade(0.7)); }
        if extra == "beard" { cv.rect(x(4), y(hy + 6), 8, 3, hair); cv.hline(x(7), y(hy + 7), 2, skin.shade(0.6)); }
        if extra == "mustache" { cv.hline(x(6), y(hy + 6), 4, hair); }
        if extra == "freckles" { cv.set(x(5), y(hy + 5), skin.shade(0.75)); cv.set(x(10), y(hy + 5), skin.shade(0.75)); }
        match acc {
            "glasses" => { let g = c("#3a3030"); cv.frame(x(5), y(hy + 3), 3, 3, g); cv.frame(x(8), y(hy + 3), 3, 3, g); }
            "sunglasses" => { cv.rect(x(5), y(hy + 4), 6, 2, c("#151515")); }
            _ => {}
        }
    } else if side {
        if closed { cv.hline(fx(9), y(hy + 5), 2, eye); } else { cv.rect(fx(10), y(hy + 4), 1, 2, eye); }
        cv.set(fx(12), y(hy + 5), skin_d);
        if extra == "beard" { cv.rect(fx(7), y(hy + 6), 5, 3, hair); }
        if acc == "glasses" { cv.frame(fx(9), y(hy + 3), 3, 3, c("#3a3030")); }
        if acc == "sunglasses" { cv.rect(fx(9), y(hy + 4), 3, 2, c("#151515")); }
    }
    // hair
    let hd = hair.shade(0.75);
    let back = dir == Facing::Up;
    let top = |cv: &mut Canvas, rows: i32| { for j in 0..rows { for i in 0..hw { let corner = j == 0 && (i == 0 || i == hw - 1); if !corner { cv.set(fx(hx0 + i), y(hy + j), if j == rows - 1 { hd } else { hair }); } } } };
    match style {
        "bald" => { cv.hline(fx(hx0 + 2), y(hy), hw - 4, skin.shade(1.08)); }
        "buzz" => { top(cv, 2); }
        "hijab" => { cv.rect(fx(hx0 - 1), y(hy - 1), hw + 2, 10, hair); if !back { if side { cv.rect(fx(8), y(hy + 2), 4, 6, skin); cv.rect(fx(10), y(hy + 4), 1, 2, eye); } else { cv.rect(x(5), y(hy + 2), 6, 6, skin); cv.rect(x(6), y(hy + 4), 1, 2, eye); cv.rect(x(9), y(hy + 4), 1, 2, eye); } } cv.rect(fx(hx0), y(hy + 9), hw, 2, hd); }
        "afro" => { cv.disc(ox as f32 + 8.0, (oy + hy) as f32 + 2.5, 6.2, hair); if !back { cv.rect(fx(hx0 + 1), y(hy + 3), hw - 2, 5, skin); if dir == Facing::Down { cv.rect(x(6), y(hy + 4), 1, 2, eye); cv.rect(x(9), y(hy + 4), 1, 2, eye); } else { cv.rect(fx(10), y(hy + 4), 1, 2, eye); } } }
        "mohawk" => { cv.rect(fx(7), y(hy - 3), 2, 5, hair); top(cv, 1); }
        "pompadour" => { top(cv, 3); cv.rect(fx(hx0 + 1), y(hy - 2), hw - 2, 2, hair); }
        "curly" => { top(cv, 3); for i in 0..hw / 2 + 1 { cv.set(fx(hx0 - 1 + i * 2), y(hy - 1), hair); } cv.vline(fx(hx0 - 1), y(hy + 1), 4, hair); if !side { cv.vline(fx(hx0 + hw), y(hy + 1), 4, hair); } }
        "bun" => { top(cv, 3); cv.disc(ox as f32 + 8.0, (oy + hy) as f32 - 1.5, 2.5, hair); }
        "ponytail" | "pony" => { top(cv, 3); if side { cv.rect(fx(4), y(hy + 2), 2, 7, hair); } else if back { cv.rect(x(7), y(hy + 2), 2, 8, hd); } }
        "long" | "braids" => { top(cv, 3); if side { cv.rect(fx(hx0), y(hy + 2), 3, 9, hair); } else { cv.rect(x(3), y(hy + 2), 2, 10, hair); cv.rect(x(11), y(hy + 2), 2, 10, hair); } if style == "braids" { for k in 0..4 { cv.set(x(3), y(hy + 3 + k * 2), hd); cv.set(x(12), y(hy + 3 + k * 2), hd); } } }
        "bob" => { top(cv, 3); if side { cv.rect(fx(hx0), y(hy + 2), 3, 6, hair); } else { cv.rect(x(3), y(hy + 2), 2, 6, hair); cv.rect(x(11), y(hy + 2), 2, 6, hair); } }
        "mullet" => { top(cv, 3); if side { cv.rect(fx(hx0), y(hy + 2), 2, 9, hair); } else { cv.rect(x(4), y(hy + 7), 8, 3, hair); } }
        "side-part" | "sidepart" => { top(cv, 3); if !back { cv.set(fx(hx0 + 2), y(hy + 1), hd); cv.rect(fx(hx0), y(hy + 2), 2, 2, hair); } }
        _ => { top(cv, 3); if !back && !side { cv.set(x(hx0), y(hy + 3), hair); cv.set(x(hx0 + hw - 1), y(hy + 3), hair); } }
    }
    if back && !matches!(style, "bald" | "buzz" | "hijab" | "afro") { cv.rect(fx(hx0), y(hy), hw, 7, hair); cv.rect(fx(hx0 + 1), y(hy + 7), hw - 2, 1, hd); }
    match acc {
        "cap" | "visor" => { cv.rect(fx(hx0), y(hy - 1), hw, 3, c("#b5462b")); if dir == Facing::Down { cv.rect(x(4), y(hy + 2), 8, 1, c("#8c3520")); } else if side { cv.rect(fx(11), y(hy + 2), 3, 1, c("#8c3520")); } }
        "beanie" => { cv.rect(fx(hx0), y(hy - 1), hw, 4, c("#c9952f")); cv.hline(fx(hx0), y(hy + 2), hw, c("#a77a22")); }
        "headphones" => { let h = c("#2b2b2b"); cv.hline(fx(hx0), y(hy - 1), hw, h); if side { cv.rect(fx(7), y(hy + 3), 2, 3, h); } else { cv.rect(x(3), y(hy + 3), 2, 3, h); cv.rect(x(11), y(hy + 3), 2, 3, h); } }
        "earrings" if !back => { cv.set(fx(if side { 6 } else { 3 }), y(hy + 6), c("#e6c24a")); if !side { cv.set(x(12), y(hy + 6), c("#e6c24a")); } }
        _ => {}
    }
    if kind == Kind::Supervisor { cv.rect(fx(hx0 - 1), y(hy - 1), hw + 2, 2, c("#1a2030")); cv.hline(fx(hx0), y(hy + 1), hw, c("#c9a54a")); }
    if kind == Kind::Facilities && !back { cv.rect(fx(hx0), y(hy - 1), hw, 2, c("#7d8086")); }
}

fn goat_frame(cv: &mut Canvas, ox: i32, oy: i32, dir: Facing, col: usize) {
    let body = c("#ece6d6"); let d = c("#c9c0aa"); let horn = c("#8f7e62");
    let walk = (C_WALK..C_WALK + 4).contains(&col); let wf = if walk { col - C_WALK } else { 0 };
    let flip = dir == Facing::Left; let fx = |v: i32| if flip { ox + 15 - v } else { ox + v }; let y = |v: i32| oy + v;
    let b = if walk && wf % 2 == 1 { -1 } else { 0 };
    cv.rect(fx(2), y(14 + b), 10, 5, body); cv.hline(fx(2), y(18 + b), 10, d);
    let l = [0, 1, 0, -1][wf];
    cv.rect(fx(3 + l), y(19), 1, 4, d); cv.rect(fx(5 - l), y(19), 1, 4, d); cv.rect(fx(9 + l), y(19), 1, 4, d); cv.rect(fx(11 - l), y(19), 1, 4, d);
    let hy = if col == C_NAP { 15 } else { 10 + b };
    cv.rect(fx(11), y(hy), 4, 5, body); cv.set(fx(13), y(hy + 1), c("#2a1f24")); cv.rect(fx(11), y(hy - 2), 1, 2, horn); cv.rect(fx(13), y(hy - 2), 1, 2, horn);
    cv.rect(fx(13), y(hy + 5), 1, 2, d); cv.set(fx(1), y(14 + b), d);
}

/// Build a person sheet image (COLS x 4 frames).
pub fn person_sheet(l: &Look, seed: u64, kind: Kind) -> Image {
    let mut cv = Canvas::new(FW * COLS, FH * 4);
    for (r, dir) in [Facing::Down, Facing::Up, Facing::Left, Facing::Right].into_iter().enumerate() {
        for col in 0..COLS as usize {
            let (ox, oy) = ((col as u32 * FW) as i32, (r as u32 * FH) as i32);
            if kind == Kind::Goat { goat_frame(&mut cv, ox, oy, dir, col); } else { person_frame(&mut cv, ox, oy, l, seed, kind, dir, col); }
            cv.outline(ox, oy, FW as i32, FH as i32, OUTLINE.a(210));
        }
    }
    cv.image()
}

// ---------------------------------------------------------------- furniture & props
pub const WALNUT: &str = "#8e5b37";
pub fn furniture_image(kind: &str, w: i32, h: i32, facing: Facing, seed: u64) -> (Image, Vec2) {
    // returns image and its anchor offset in tiles (sprite extends upward for tall things)
    let tw = (w.max(1) * 16) as u32;
    let lift: i32 = match kind { "plant-tall" | "bookshelf" | "fridge" | "cabinet" | "water-cooler" | "elevator" | "toilet-door" | "portrait" | "screen" | "whiteboard" | "banner" | "lamp" | "coffee-machine" | "snack-bar" | "pod-booth" => 12, "crt" | "monitor" | "plant" | "printer" | "microwave" | "podium" => 6, _ => 2 };
    let th = (h.max(1) * 16 + lift) as u32;
    let mut cv = Canvas::new(tw, th);
    let (wi, hi, l) = (tw as i32, th as i32, lift);
    let walnut = c(WALNUT); let wd = c("#6c4329"); let wl = c("#a9734a");
    let beige = c("#ddd3b8"); let bd = c("#b9ad8e"); let steel = c("#a9adb3");
    match kind {
        "desk" | "table" | "counter" | "reception-desk" | "stage" => {
            let (top, side) = match kind { "counter" => (c("#e9e5da"), c("#b8b2a2")), "stage" => (c("#5c4a3a"), c("#3e3128")), "reception-desk" => (c("#8a5a33"), c("#5e3c22")), _ => (walnut, wd) };
            cv.rrect(0, l, wi, hi - l - 4, top);
            cv.rect(1, hi - 5, wi - 2, 4, side);
            for i in (3..wi).step_by(7) { cv.hline(i, l + 3 + (i / 7 % 3), 4, top.shade(1.08)); }
            cv.hline(1, l, wi - 2, wl);
            if kind == "desk" && h >= 2 { cv.rect(1, l + (hi - l - 4) / 2 - 1, wi - 2, 2, c("#d6cbb0")); cv.hline(1, l + (hi - l - 4) / 2 - 2, wi - 2, c("#efe6cf")); }
            if kind == "reception-desk" { cv.rect(2, hi - 5, wi - 4, 1, c("#c9a54a")); }
            if kind == "counter" { cv.rect(0, l, wi, 2, c("#f7f4ec")); }
            cv.rect(2, hi - 1, 2, 1, wd); cv.rect(wi - 4, hi - 1, 2, 1, wd);
        }
        "chair" | "desk-chair" | "stool" => {
            let seat = if kind == "stool" { c("#c9952f") } else { c(["#c56a2c", "#2f6f68", "#b8862e", "#4a4a52"][(seed % 4) as usize]) };
            match facing {
                Facing::Up => { cv.rrect(3, l + 6, 10, 7, seat); cv.rrect(3, l + 9, 10, 6, seat.shade(0.8)); }
                Facing::Down => { cv.rrect(3, l + 3, 10, 5, seat.shade(0.85)); cv.rrect(3, l + 7, 10, 6, seat); }
                _ => { cv.rrect(3, l + 5, 10, 8, seat); let bx = if facing == Facing::Right { 2 } else { 11 }; cv.rect(bx, l + 2, 3, 10, seat.shade(0.8)); }
            }
            cv.rect(7, hi - 3, 2, 2, steel.shade(0.7)); cv.hline(4, hi - 1, 8, steel.shade(0.6));
        }
        "crt" | "monitor" => {
            let bx = wi / 2 - 6;
            cv.rrect(bx, 1, 12, 11, beige); cv.rect(bx, 10, 12, 2, bd);
            cv.rect(bx + 2, 3, 8, 6, c("#0e2a1c")); cv.rect(bx + 3, 4, 6, 4, c("#1f6b44"));
            cv.hline(bx + 3, 5, 4, c("#7cf2a0")); cv.hline(bx + 3, 7, 5, c("#7cf2a0").shade(0.8));
            cv.rect(bx + 3, 12, 6, 2, bd); cv.rect(bx + 1, 15, 10, 3, c("#cfc5a8")); cv.hline(bx + 2, 16, 8, bd);
        }
        "plant" | "plant-tall" => {
            let pot = c("#c56a2c"); let leaf = c("#4f8a4a"); let ld = c("#33623a");
            let cx = wi as f32 / 2.0;
            cv.rrect(wi / 2 - 4, hi - 8, 8, 7, pot); cv.hline(wi / 2 - 4, hi - 8, 8, pot.shade(1.2));
            let n = if kind == "plant-tall" { 7 } else { 5 };
            for k in 0..n { let a = (k as f32 / (n - 1) as f32 - 0.5) * 1.6; let len = if kind == "plant-tall" { 20.0 } else { 11.0 } - (a.abs() * 4.0);
                for t in 0..len as i32 { let px = cx + a * t as f32 * 0.55; let py = (hi - 8) as f32 - t as f32; cv.set(px as i32, py as i32, if t % 3 == 0 { ld } else { leaf }); cv.set(px as i32 + 1, py as i32, leaf.shade(1.1)); } }
        }
        "sofa" | "armchair" | "beanbag" => {
            let col = c(if kind == "beanbag" { "#c9952f" } else { "#2f6f68" });
            if kind == "beanbag" { cv.disc(wi as f32 / 2.0, hi as f32 - 7.0, 7.0, col); cv.disc(wi as f32 / 2.0 - 1.0, hi as f32 - 9.0, 3.0, col.shade(1.15)); }
            else { cv.rrect(0, l + 2, wi, hi - l - 3, col.shade(0.8)); cv.rrect(2, l + 7, wi - 4, hi - l - 9, col); cv.rect(0, l + 6, 3, hi - l - 8, col.shade(0.7)); cv.rect(wi - 3, l + 6, 3, hi - l - 8, col.shade(0.7)); }
        }
        "bookshelf" | "cabinet" => {
            let body = if kind == "cabinet" { c("#9aa0a6") } else { walnut };
            cv.rect(0, 0, wi, hi - 1, body.shade(0.8)); cv.rect(1, 1, wi - 2, hi - 3, body);
            if kind == "cabinet" { for k in 0..3 { let yy = 3 + k * ((hi - 4) / 3); cv.hline(1, yy - 1, wi - 2, body.shade(0.7)); cv.rect(wi / 2 - 2, yy + 2, 4, 1, c("#e2e4e6")); } }
            else { let cols = ["#c56a2c", "#2f6f68", "#d8b34a", "#6b4a3b", "#cfc6a8", "#3b4a6b"]; let mut s = seed; for sh in 0..3 { let yy = 2 + sh * ((hi - 4) / 3); cv.hline(1, yy + 7, wi - 2, wd); let mut xx = 2; while xx < wi - 3 { s = s.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407); let bw = 1 + (s >> 60) as i32 % 3; cv.rect(xx, yy + 1 + ((s >> 50) % 2) as i32, bw, 6, c(cols[(s >> 40) as usize % 6])); xx += bw + 1; } } }
        }
        "coffee-machine" => { cv.rect(2, 2, wi - 4, hi - 4, c("#3a3a3e")); cv.rect(3, 4, wi - 6, 5, c("#a9adb3")); cv.rect(5, 10, wi - 10, 3, c("#1c1c1c")); cv.rect(6, hi - 7, 4, 4, c("#f4f0e6")); cv.set(wi - 5, 5, c("#7cf2a0")); }
        "microwave" => { cv.rrect(1, 4, wi - 2, 11, c("#e7e2d4")); cv.rect(2, 6, wi - 8, 7, c("#2a2f2e")); cv.rect(wi - 5, 6, 3, 7, c("#c9c2ae")); cv.set(wi - 4, 8, c("#d64a3a")); cv.rect(2, 15, wi - 4, 2, c("#b6ae99")); }
        "fridge" => { cv.rrect(1, 0, wi - 2, hi - 1, c("#e9e7e0")); cv.hline(1, hi / 3, wi - 2, c("#c7c4ba")); cv.vline(wi - 4, 3, 5, c("#9aa0a6")); cv.vline(wi - 4, hi / 3 + 3, 8, c("#9aa0a6")); cv.rect(4, hi / 3 + 4, 3, 3, c("#d8b34a")); }
        "snack-bar" => { cv.rect(0, 0, wi, hi - 1, c("#c56a2c")); cv.rect(2, 2, wi - 4, hi - 10, c("#f4efe0")); for k in 0..(wi - 6) / 4 { for r in 0..3 { cv.rect(3 + k * 4, 4 + r * 6, 3, 4, c(["#d8b34a", "#c55a4a", "#4f8a4a", "#6b4a3b"][((k + r) % 4) as usize])); } } }
        "printer" => { cv.rrect(0, 4, wi, hi - 5, c("#d8d2c0")); cv.rect(2, 6, wi - 4, 3, c("#3a3a3e")); cv.rect(3, 2, wi - 6, 4, c("#f8f6f0")); cv.set(wi - 3, hi - 6, c("#7cf2a0")); }
        "elevator" => {
            cv.rect(0, 0, wi, hi, c("#b8bcc2")); cv.rect(2, 2, wi - 4, hi - 4, c("#d4d8dd"));
            cv.rect(wi / 2 - 12, 8, 24, hi - 10, c("#9ea3aa")); cv.vline(wi / 2, 8, hi - 10, c("#7d828a"));
            cv.rect(wi / 2 - 6, 3, 12, 3, c("#1a1a1a")); cv.hline(wi / 2 - 4, 4, 8, c("#e8a23a"));
            cv.rect(wi - 6, hi / 2, 2, 4, c("#c9a54a"));
        }
        "screen" | "whiteboard" => { let sc = kind == "screen"; cv.rect(0, 0, wi, hi - 6, c(if sc { "#1a1d1c" } else { "#c9c2ae" })); cv.rect(2, 2, wi - 4, hi - 10, c(if sc { "#1f5a40" } else { "#fbfaf6" })); if sc { cv.hline(4, 5, wi / 2, c("#7cf2a0")); cv.hline(4, 8, wi / 3, c("#7cf2a0").shade(0.7)); } else { cv.hline(4, 6, wi / 3, c("#3a6fb0")); cv.hline(6, 9, wi / 2, c("#c55a4a")); } cv.rect(wi / 2 - 1, hi - 6, 2, 5, steel); }
        "podium" => { cv.rect(3, 6, wi - 6, hi - 7, walnut); cv.rect(2, 4, wi - 4, 3, wl); cv.rect(wi / 2 - 1, 0, 1, 4, steel); }
        "portrait" | "banner" => { cv.rect(1, 0, wi - 2, hi - 8, c("#c9a54a")); cv.rect(3, 2, wi - 6, hi - 12, c("#5c4a3a")); if kind == "portrait" { cv.disc(wi as f32 / 2.0, 9.0, 4.0, c("#eec1a0")); cv.rect(wi / 2 - 6, 13, 12, hi - 25, c("#2a2a32")); cv.rect(wi / 2 - 4, 4, 8, 3, c("#cfcfcf")); } cv.rect(wi / 2 - 4, hi - 6, 8, 5, c("#e8e2d0")); }
        "candle" => { cv.rect(6, hi - 8, 4, 7, c("#f4efe0")); cv.set(7, hi - 10, c("#f2b33a")); cv.set(8, hi - 11, c("#ffd86a")); }
        "lamp" => { cv.rect(wi / 2 - 4, 0, 8, 6, c("#d8b34a")); cv.vline(wi / 2, 6, hi - 9, c("#5c4a3a")); cv.rect(wi / 2 - 3, hi - 3, 6, 2, c("#5c4a3a")); }
        "water-cooler" => { cv.rect(4, 8, 8, hi - 9, c("#e9e7e0")); cv.rrect(4, 0, 8, 9, c("#9ad1e8").a(220)); cv.set(6, hi - 10, c("#3a6fb0")); }
        "bin" => { cv.rect(4, hi - 10, 8, 9, c("#6d7378")); cv.hline(3, hi - 10, 10, c("#8a9096")); }
        "dog-bed" => { cv.disc(wi as f32 / 2.0, hi as f32 / 2.0 + 1.0, wi as f32 / 2.0 - 1.0, c("#8a5a33")); cv.disc(wi as f32 / 2.0, hi as f32 / 2.0 + 1.0, wi as f32 / 2.0 - 3.0, c("#e8dcc0")); }
        "pod-booth" => { cv.rect(0, 0, wi, hi - 1, c("#2f6f68")); cv.rect(2, 3, wi - 4, hi - 5, c("#3f8a80")); cv.rect(3, hi - 10, wi - 6, 4, c("#c9952f")); }
        "toilet-door" => { cv.rect(1, 0, wi - 2, hi - 1, c("#d4d8dd")); cv.rect(wi - 5, hi / 2, 2, 2, c("#c9a54a")); }
        "rug" => { cv.rrect(0, l, wi, hi - l, c("#c9952f").a(200)); cv.frame(2, l + 2, wi - 4, hi - l - 4, c("#a3311f").a(220)); }
        _ => { cv.rrect(0, l, wi, hi - l - 1, beige); cv.rect(0, hi - 4, wi, 3, bd); }
    }
    let anchor_up = lift as f32 / 16.0;
    (cv.image(), Vec2::new(0.0, anchor_up))
}

pub fn belonging_image(kind: &str) -> Image {
    let mut cv = Canvas::new(6, 7);
    match kind {
        "mug" => { cv.rect(0, 2, 4, 5, c("#f4f0e6")); cv.set(4, 3, c("#f4f0e6")); cv.set(4, 4, c("#f4f0e6")); cv.hline(0, 2, 4, c("#6b4a3b")); cv.set(1, 4, c("#c56a2c")); }
        "photo" | "caricature" => { cv.rect(0, 1, 5, 5, c("#c9a54a")); cv.rect(1, 2, 3, 3, c("#9ad1e8")); cv.set(2, 3, c("#eec1a0")); }
        "cactus" => { cv.rect(1, 4, 4, 3, c("#c56a2c")); cv.rect(2, 0, 2, 4, c("#4f8a4a")); cv.set(1, 1, c("#4f8a4a")); cv.set(4, 2, c("#4f8a4a")); }
        "plant" => { cv.rect(1, 4, 4, 3, c("#e8e2d0")); cv.rect(0, 1, 6, 3, c("#4f8a4a")); }
        "figurine" | "trophy" => { let g = c(if kind == "trophy" { "#e6c24a" } else { "#5a8fd0" }); cv.rect(2, 0, 2, 2, g); cv.rect(1, 2, 4, 3, g); cv.rect(1, 5, 4, 2, c("#5c4a3a")); }
        "stressball" => { cv.disc(3.0, 4.0, 2.6, c("#e8a23a")); cv.set(2, 3, c("#ffd07a")); }
        "rubberduck" => { cv.rect(0, 3, 5, 3, c("#ffd84a")); cv.rect(2, 1, 3, 3, c("#ffd84a")); cv.set(5, 2, c("#e8822a")); cv.set(3, 2, c("#1a1a1a")); }
        "snowglobe" => { cv.disc(3.0, 3.0, 2.6, c("#bfe3f2")); cv.rect(1, 5, 4, 2, c("#6b4a3b")); cv.set(3, 3, c("#ffffff")); }
        "lamp" => { cv.rect(1, 0, 4, 2, c("#d8b34a")); cv.vline(3, 2, 4, c("#3a3a3e")); cv.hline(1, 6, 4, c("#3a3a3e")); }
        "books" => { cv.rect(0, 2, 6, 2, c("#c55a4a")); cv.rect(1, 4, 5, 2, c("#2f6f68")); cv.rect(0, 6, 6, 1, c("#d8b34a")); }
        "candle" => { cv.rect(2, 3, 2, 4, c("#f4efe0")); cv.set(2, 1, c("#ffb43a")); cv.set(3, 2, c("#ffd86a")); }
        "eraser" => { cv.rect(0, 3, 6, 3, c("#f2a0b0")); cv.rect(0, 3, 2, 3, c("#5a8fd0")); }
        "waterbottle" => { cv.rect(2, 1, 2, 6, c("#5a8fd0")); cv.set(2, 0, c("#2a2a2a")); }
        "headphones" => { cv.hline(1, 1, 4, c("#2b2b2b")); cv.rect(0, 2, 2, 3, c("#2b2b2b")); cv.rect(4, 2, 2, 3, c("#2b2b2b")); }
        _ => { cv.rect(1, 2, 4, 4, c("#c56a2c")); }
    }
    cv.image()
}

pub fn soft_disc(size: u32, rgb: [u8; 3], power: f32) -> Image {
    let mut cv = Canvas::new(size, size);
    let r = size as f32 / 2.0;
    for y in 0..size { for x in 0..size {
        let d = ((x as f32 + 0.5 - r).powi(2) + (y as f32 + 0.5 - r).powi(2)).sqrt() / r;
        let a = (1.0 - d).clamp(0.0, 1.0).powf(power);
        let i = ((y * size + x) * 4) as usize; cv.px[i] = rgb[0]; cv.px[i + 1] = rgb[1]; cv.px[i + 2] = rgb[2]; cv.px[i + 3] = (a * 255.0) as u8;
    } }
    cv.image()
}
/// pixelated ellipse shadow (crisp edge, low alpha)
pub fn shadow_image(w: u32, h: u32) -> Image {
    let mut cv = Canvas::new(w, h);
    let (rx, ry) = (w as f32 / 2.0, h as f32 / 2.0);
    for y in 0..h { for x in 0..w { let dx = (x as f32 + 0.5 - rx) / rx; let dy = (y as f32 + 0.5 - ry) / ry; let d = dx * dx + dy * dy; if d <= 1.0 { cv.set(x as i32, y as i32, Rgba([60, 56, 70, if d < 0.45 { 70 } else { 40 }])); } } }
    cv.image()
}
pub fn carpet_image(w: i32, h: i32, base: Rgba, seed: u64) -> Image {
    let (pw, ph) = ((w * 16) as u32, (h * 16) as u32);
    let mut cv = Canvas::new(pw, ph);
    let mut s = seed | 1;
    for y in 0..ph as i32 { for x in 0..pw as i32 {
        let edge = x < 2 || y < 2 || x >= pw as i32 - 2 || y >= ph as i32 - 2;
        let corner = (x < 3 || x >= pw as i32 - 3) && (y < 3 || y >= ph as i32 - 3);
        if corner && (x == 0 || x == pw as i32 - 1 || y == 0 || y == ph as i32 - 1) { continue; }
        s ^= s << 13; s ^= s >> 7; s ^= s << 17;
        let n = (s % 100) as f32 / 100.0;
        let mut col = base.shade(0.97 + n * 0.06);
        if (x + y) % 4 == 0 { col = col.shade(0.97); }
        if edge { col = base.shade(0.8); }
        cv.set(x, y, col);
    } }
    cv.image()
}
pub fn outline_rect_image(w: i32, h: i32, col: Rgba) -> Image {
    let (pw, ph) = ((w * 16) as u32, (h * 16) as u32);
    let mut cv = Canvas::new(pw, ph);
    // dashed thin outline + faint fill
    cv.rect(0, 0, pw as i32, ph as i32, col.a(18));
    for i in 0..pw as i32 { if (i / 3) % 2 == 0 { cv.set(i, 0, col); cv.set(i, ph as i32 - 1, col); } }
    for j in 0..ph as i32 { if (j / 3) % 2 == 0 { cv.set(0, j, col); cv.set(pw as i32 - 1, j, col); } }
    cv.image()
}

#[derive(Resource, Default)]
pub struct ArtCache {
    pub furniture: HashMap<String, (Handle<Image>, Vec2)>,
    pub belongings: HashMap<String, Handle<Image>>,
    pub shadow: Handle<Image>,
    pub shadow_big: Handle<Image>,
    pub glow: Handle<Image>,
    pub dot: Handle<Image>,
    pub layout: Handle<TextureAtlasLayout>,
    pub white: Handle<Image>,
}
