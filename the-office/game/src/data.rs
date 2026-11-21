//! Company data contract (CONTRACT-data.md) -> Rust structs. Lenient: every field has a default.
use bevy::prelude::*;
use serde::{Deserialize, Deserializer};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct R { pub x: i32, pub y: i32, pub w: i32, pub h: i32 }
impl R {
    pub fn contains(&self, x: i32, y: i32) -> bool { x >= self.x && y >= self.y && x < self.x + self.w && y < self.y + self.h }
    pub fn center(&self) -> Vec2 { Vec2::new(self.x as f32 + self.w as f32 * 0.5, self.y as f32 + self.h as f32 * 0.5) }
}
impl<'de> Deserialize<'de> for R {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        let v = Value::deserialize(d)?;
        let g = |k: &str, i: usize| -> i32 {
            v.get(k).or_else(|| v.get(i)).and_then(|n| n.as_f64()).unwrap_or(0.0) as i32
        };
        Ok(R { x: g("x", 0), y: g("y", 1), w: g("w", 2), h: g("h", 3) })
    }
}

#[derive(Clone, Copy, Debug, Default, Deserialize, PartialEq)]
#[serde(default)]
pub struct P { pub x: f32, pub y: f32, pub facing: Option<Facing> }
impl P { pub fn tile(&self) -> IVec2 { IVec2::new(self.x.floor() as i32, self.y.floor() as i32) } }

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub enum Facing { #[default] Down, Up, Left, Right }
impl<'de> Deserialize<'de> for Facing {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        let s = String::deserialize(d).unwrap_or_default();
        Ok(match s.to_lowercase().as_str() { "up" | "n" | "north" => Facing::Up, "left" | "w" | "west" => Facing::Left, "right" | "e" | "east" => Facing::Right, _ => Facing::Down })
    }
}
impl Facing {
    pub fn row(self) -> usize { match self { Facing::Down => 0, Facing::Up => 1, Facing::Left => 2, Facing::Right => 3 } }
    pub fn vec(self) -> Vec2 { match self { Facing::Down => Vec2::Y, Facing::Up => -Vec2::Y, Facing::Left => -Vec2::X, Facing::Right => Vec2::X } }
    pub fn from_vec(v: Vec2) -> Facing { if v.x.abs() > v.y.abs() { if v.x > 0.0 { Facing::Right } else { Facing::Left } } else if v.y > 0.0 { Facing::Down } else { Facing::Up } }
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Company {
    pub meta: Meta, pub company: CompanyInfo, pub orgs: Vec<Org>, pub teams: Vec<Team>, pub people: Vec<Person>,
    pub visitors: Vec<Visitor>, pub pets: Vec<Pet>, pub layout: Layout, pub rooms: Vec<Room>, pub events: Vec<EventDef>, pub lines: Lines, pub catalog: Value, pub objects: Value,
    pub idle_actions: Vec<IdleAction>, pub fish: Vec<Fish>,
}
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Meta { pub start_time: String, pub start_day: String, pub version: Value, pub panel: Vec<PanelItem> }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct PanelItem { pub id: String, pub label: String, pub emoji: String }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct CompanyInfo {
    pub name: String, pub tagline: String, pub mission: String, pub product: String,
    pub product_description: String, pub stage: String, pub version: String,
    pub founder: Founder, pub values: Vec<String>, pub quotas: Vec<Quota>, pub rivalries: Vec<Rivalry>, pub prizes: Vec<Value>,
}
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Founder { pub name: String, pub title: String }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Quota { pub team_id: String, pub label: String, #[serde(deserialize_with = "nf32")] pub target: f32, #[serde(deserialize_with = "nf32")] pub start: f32 }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Rivalry { pub a: String, pub b: String, pub name: String }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Org { pub id: String, pub name: String }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Team {
    pub id: String, pub name: String, pub short_name: String, pub org: String, pub color: String,
    pub section_id: String, pub lead_id: String, pub quota: TeamQuota,
}
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct TeamQuota { pub label: String, #[serde(deserialize_with = "nf32")] pub start: f32 }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Look {
    pub skin: Value, #[serde(deserialize_with = "nstr")] pub hair: String, pub hair_style: String, pub shirt: String, pub pants: String,
    pub shoes: String, pub accessory: String, pub extra: Value, pub outfit: String,
    pub body: String, pub spots: String, pub collar: String,
}
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Needs { pub energy: f32, pub hunger: f32, pub social: f32, pub stress: f32, pub focus: f32 }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Person {
    pub id: String, pub name: String, pub first: String, pub role: String, pub team_id: String, pub org: String,
    pub manager_id: Option<String>, pub desk_id: Option<String>, pub kind: String,
    pub arrive: String, pub traits: Vec<String>, pub needs: Option<Needs>, pub look: Look, pub belongings: Vec<String>,
    pub quirk: String, pub task: String, pub seed: u64, pub calendar: Vec<CalItem>, pub pronouns: String,
}
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct CalItem {
    pub id: String, pub start: String, pub end: String, pub title: String, #[serde(rename = "type")] pub kind: String, pub room_id: String,
    pub attendees: Vec<String>, pub organizer_id: Option<String>, pub days: Option<Vec<String>>,
    pub event_id: Option<String>, pub mismatch: bool,
}
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Visitor { pub purpose: String, pub role: String, pub id: String, pub name: String, pub kind: String, pub day: String, pub arrive: String, pub leave: String, pub host_id: String, pub look: Look, pub calendar: Vec<CalItem> }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Pet { pub owner_id: Option<String>, pub id: String, pub name: String, pub species: String, pub look: Look, pub bed: Option<P>, pub traits: Vec<String>, pub quirk: String, pub appears_from_nowhere: bool }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Layout {
    pub w: i32, pub h: i32, pub tiles: Vec<String>, pub blocked: Vec<String>, pub sections: Vec<Section>, pub tables: Vec<Table>, pub desks: Vec<Desk>,
    pub furniture: Vec<Furniture>, pub poi: HashMap<String, P>, pub queues: HashMap<String, Vec<P>>, pub elevator: Elevator, pub signs: Vec<Sign>,
    pub void_props: Vec<VoidProp>, pub patrol_route: Vec<P>, pub tidy_route: Vec<P>,
    pub wander_spots: Vec<P>, pub muster: Value, pub library_seats: Vec<P>, pub kitchen_seats: Vec<P>,
}
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Section { pub id: String, pub name: String, pub sign: String, pub team_ids: Vec<String>, pub rect: R, pub label: Option<P> }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Table { pub id: String, pub section_id: String, pub x: i32, pub y: i32, pub w: i32, pub h: i32 }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Desk { pub id: String, pub x: i32, pub y: i32, pub facing: Facing, pub section_id: String, pub monitor: Option<P>, pub owner_id: Option<String>, pub kind: String }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Furniture { pub id: String, #[serde(rename = "type")] pub kind: String, pub x: i32, pub y: i32, pub w: i32, pub h: i32, pub solid: bool, pub facing: Option<Facing>, pub room_id: Option<String>, pub label: Option<String>, pub area: Option<String> }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Elevator { pub rect: R, pub door_tiles: Vec<P>, pub spawn: P, pub exit_spawn: Option<P> }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Sign { pub id: String, pub x: f32, pub y: f32, pub text: String, pub kind: String }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct VoidProp { pub id: String, #[serde(rename = "type")] pub kind: String, pub x: f32, pub y: f32, pub note: String }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Room {
    pub id: String, pub name: String, pub size: String, pub capacity: i32, pub rect: R, pub door_tile: P,
    pub wait_tiles: Vec<P>, pub seats: Vec<P>, pub stand_tiles: Vec<P>, pub sign: Option<Sign>, pub purpose: String,
}
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct EventDef {
    pub id: String, pub name: String, pub kind: String, pub manual: bool, pub panel: Option<Panel>, pub schedule: Option<Schedule>,
    #[serde(deserialize_with = "nf32")] pub chance: f32, #[serde(deserialize_with = "nf32")] pub cooldown: f32, pub location: Location, pub radius: Option<f32>, #[serde(deserialize_with = "nf32")] pub duration: f32,
    pub participants: Option<Value>, pub effects: Effects, pub join_behavior: String, pub anim: EvAnim,
    pub emotes: Vec<String>, pub line_key: String, pub gossipable: bool,
    pub reactions: HashMap<String, Weights>, pub chains_to: Vec<Chain>, pub ticker_templates: Vec<String>,
    pub director: Option<Director>,
}
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Panel { pub label: String, pub emoji: String }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Schedule { pub days: Value, pub time: String }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Location { #[serde(rename = "type")] pub kind: String, #[serde(rename = "ref")] pub reference: Value }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Effects { pub needs: Needs, pub output: Option<f32>, pub progress: Option<f32>, pub version: Option<String> }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct EvAnim { pub join: String, pub react: String }
#[derive(Clone, Copy, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Weights { pub join: f32, pub ignore: f32, pub gossip: f32, pub flee: f32 }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Chain { pub id: String, #[serde(deserialize_with = "nf32")] pub delay: f32, #[serde(deserialize_with = "nf32")] pub chance: f32 }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Lines {
    pub bubbles: HashMap<String, Vec<String>>, pub ticker: HashMap<String, Vec<String>>, pub signs: Vec<String>,
    pub founder_quotes: Vec<String>, pub wellness_facts: Vec<String>,
    pub tasks: HashMap<String, Vec<String>>, pub memo_headers: Vec<String>,
    pub banter: Vec<Banter>, pub founder_memos: Vec<FounderMemo>, pub anti_repeat: AntiRepeat,
}
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Banter { pub id: String, pub speakers: Vec<String>, #[serde(deserialize_with = "nf32")] pub cooldown: f32, pub lines: Vec<BanterLine> }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct BanterLine { pub role: String, pub speaker: String, pub text: String }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct FounderMemo { pub id: String, pub title: String, pub lines: Vec<String> }
/// cooldowns are "seconds" at 1x speed (1 real second = SIM_MIN_PER_SEC sim minutes)
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct AntiRepeat { #[serde(deserialize_with = "nf32")] pub default_cooldown: f32, pub by_key: HashMap<String, f32>, pub by_text: HashMap<String, f32> }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct IdleAction { pub id: String, pub name: String, #[serde(deserialize_with = "nf32")] pub weight: f32, #[serde(deserialize_with = "nf32")] pub duration: f32, pub anim: String, pub emote: String, pub line_key: String, pub conditions: Value, pub effects: Value }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Fish { pub id: String, pub name: String, pub species: String, pub tank: String, pub quirk: String, pub title: String }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Director { pub window: Option<Window2>, pub days: Value, pub preconditions: Vec<String>, pub exclusions: Vec<String>, #[serde(deserialize_with = "nf32")] pub cooldown: f32, #[serde(deserialize_with = "nf32")] pub weight: f32, #[serde(deserialize_with = "nf32")] pub tension_delta: f32, pub participants: Value, pub period: String }
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Window2 { pub start: String, pub end: String }

pub const DAYS: [&str; 7] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
pub fn nf32<'de, D: Deserializer<'de>>(d: D) -> Result<f32, D::Error> { Ok(Value::deserialize(d)?.as_f64().unwrap_or(0.0) as f32) }
pub fn nstr<'de, D: Deserializer<'de>>(d: D) -> Result<String, D::Error> { Ok(Value::deserialize(d)?.as_str().unwrap_or("").to_string()) }
pub fn to_min(s: &str) -> f32 {
    let mut it = s.split(':');
    let h: f32 = it.next().and_then(|v| v.trim().parse().ok()).unwrap_or(0.0);
    let m: f32 = it.next().and_then(|v| v.trim().parse().ok()).unwrap_or(0.0);
    h * 60.0 + m
}
pub fn hex(s: &str) -> Color {
    let s = s.trim_start_matches('#');
    if s.len() >= 6 {
        if let (Ok(r), Ok(g), Ok(b)) = (u8::from_str_radix(&s[0..2], 16), u8::from_str_radix(&s[2..4], 16), u8::from_str_radix(&s[4..6], 16)) {
            return Color::srgb_u8(r, g, b);
        }
    }
    Color::srgb(0.5, 0.5, 0.5)
}

// The data file is chosen at build time (build.rs): the DATA agent's company.json if present, else the fallback.
pub const COMPANY_JSON: &str = include_str!(concat!(env!("OUT_DIR"), "/company.json"));
pub const FALLBACK_JSON: &str = include_str!(concat!(env!("OUT_DIR"), "/fallback.json"));
pub const DATA_SOURCE: &str = include_str!(concat!(env!("OUT_DIR"), "/data_source.txt"));

#[derive(Resource)]
pub struct Data(pub Company);

impl Company {
    /// never panics: bad data falls back to the bundled sample company, and the reason is reported
    pub fn load() -> (Company, Option<String>) {
        match serde_json::from_str::<Company>(COMPANY_JSON) {
            Ok(c) if !c.people.is_empty() => (c, None),
            r => {
                let why = match r { Err(e) => format!("company.json: {e}"), Ok(_) => "company.json has no people".into() };
                match serde_json::from_str::<Company>(FALLBACK_JSON) { Ok(c) => (c, Some(why)), Err(e) => (Company::default(), Some(format!("{why}; fallback: {e}"))) }
            }
        }
    }
    pub fn calendar_for<'a>(&'a self, p: &'a Person, day: usize) -> Vec<&'a CalItem> {
        let d = DAYS[day % 7];
        let mut v: Vec<&CalItem> = p.calendar.iter().filter(|c| c.days.as_ref().map_or(true, |ds| ds.iter().any(|x| x.eq_ignore_ascii_case(d)))).collect();
        v.sort_by(|a, b| to_min(&a.start).partial_cmp(&to_min(&b.start)).unwrap());
        v
    }
}
impl Company {
    /// The big all-hands room as a curved amphitheatre facing the podium instead of a spreadsheet of
    /// chairs: concentric arcs, smaller footprint, aisles between the wings.
    pub fn amphitheatre(&mut self) {
        let Some(ri) = self.rooms.iter().position(|r| r.seats.len() >= 24) else { return };
        let r = self.rooms[ri].rect;
        let rid = self.rooms[ri].id.clone();
        let stage = self.layout.furniture.iter().find(|f| f.room_id.as_deref() == Some(rid.as_str()) && (f.kind == "podium" || f.kind == "lectern")).map(|f| Vec2::new(f.x as f32 + 0.5, f.y as f32 + 0.5)).unwrap_or(Vec2::new(r.x as f32 + r.w as f32 * 0.5, r.y as f32 + 1.5));
        let inside = |x: i32, y: i32| x > r.x && x < r.x + r.w - 1 && y > r.y + 1 && y < r.y + r.h - 1;
        let taken: std::collections::HashSet<(i32, i32)> = self.layout.furniture.iter().filter(|f| !f.kind.contains("chair") && f.room_id.as_deref() == Some(rid.as_str())).flat_map(|f| { let (x, y, w, h) = (f.x, f.y, f.w.max(1), f.h.max(1)); (0..w).flat_map(move |i| (0..h).map(move |j| (x + i, y + j))) }).collect();
        let mut seats: Vec<P> = vec![];
        let mut used = std::collections::HashSet::new();
        // compact straight rows facing the podium, filled front-to-back and centre-out, with walkable aisles
        // (centre + every 5th column) and a two-tile walkway between rows, so nobody squeezes past a seated row
        let sx = stage.x.floor() as i32;
        let free = |x: i32, y: i32| self.layout.blocked.get(y as usize).and_then(|row| row.as_bytes().get(x as usize)).map_or(true, |c| *c != b'#');
        let cols: [i32; 12] = [-1, 1, -2, 2, -3, 3, -4, 4, -6, 6, -7, 7];
        for i in 0..6i32 {
            let y = stage.y.floor() as i32 + 3 + i * 3; // two free tiles between rows: walkers can pass each other
            for dx in cols {
                let x = sx + dx;
                if !inside(x, y) || taken.contains(&(x, y)) || !free(x, y) || !used.insert((x, y)) { continue; }
                seats.push(P { x: x as f32, y: y as f32, facing: Some(Facing::Up) });
            }
            if seats.len() >= 56 { break; }
        }
        if seats.len() < 16 { return; }
        self.layout.furniture.retain(|f| !(f.kind == "chair" && f.room_id.as_deref() == Some(rid.as_str()) || f.kind == "chair" && f.room_id.is_none() && r.contains(f.x, f.y)));
        for (i, s) in seats.iter().enumerate() { self.layout.furniture.push(Furniture { id: format!("amph-chair-{i}"), area: None, kind: "chair".into(), x: s.x as i32, y: s.y as i32, w: 1, h: 1, solid: false, facing: s.facing, room_id: Some(rid.clone()), label: None }); }
        self.rooms[ri].seats = seats;
    }
}
impl Layout {
    pub fn muster_tiles(&self) -> Vec<Vec2> {
        let arr = self.muster.get("tiles").cloned().or_else(|| if self.muster.is_array() { Some(self.muster.clone()) } else { None });
        arr.and_then(|a| serde_json::from_value::<Vec<P>>(a).ok()).unwrap_or_default().iter().map(|p| Vec2::new(p.x + 0.5, p.y + 0.5)).collect()
    }
}
