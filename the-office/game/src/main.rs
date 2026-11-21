//! The Floor: a Severance-style pixel office simulator (Bevy, WebGL2).
mod agents; mod art; mod banter; mod atlas; mod bubbles; mod data; mod debug; mod events; mod fx; mod meetings; mod presence; mod render; mod roles; mod sim; mod ui; mod world;
use bevy::prelude::*;
use bevy::window::WindowResolution;

fn main() {
    let params = sim::Params::from_query(&debug::web::query());
    let (mut company, load_err) = data::Company::load();
    company.amphitheatre();
    let mut memo = sim::Memo::default();
    if let Some(e) = &load_err { debug::web::report_error(e); memo.lines.push_front(sim::MemoLine { time: "--:--".into(), text: format!("DATA ERROR (using fallback): {}", e.chars().take(140).collect::<String>()), kind: sim::MemoKind::System, age: 0.0 }); memo.total += 1; }
    let start = params.start_min.unwrap_or(7.0 * 60.0) as f64 + params.day as f64 * 1440.0;
    let clock = sim::Clock { t: start, speed: params.speed.clamp(0.0, 64.0), paused: false, dt_min: 0.0, start_day: 0, real: 0.0 };
    let rng = sim::SimRng::new(params.seed);
    App::new()
        .add_plugins(DefaultPlugins.set(ImagePlugin::default_nearest()).set(WindowPlugin {
            primary_window: Some(Window { title: "The Floor".into(), canvas: Some("#bevy".into()), fit_canvas_to_parent: true, prevent_default_event_handling: true, resolution: WindowResolution::new(1280.0, 800.0), ..default() }),
            ..default()
        }).set(bevy::log::LogPlugin { level: bevy::log::Level::WARN, ..default() }).set(AssetPlugin { meta_check: bevy::asset::AssetMetaCheck::Never, ..default() }))
        .insert_resource(ClearColor(Color::srgb(0.965, 0.96, 0.945)))
        .insert_resource(data::Data(company)).insert_resource(params).insert_resource(clock).insert_resource(rng).insert_resource(memo)
        .configure_sets(Update, (agents::SimSet::Clock, agents::SimSet::Events, agents::SimSet::Agents, agents::SimSet::Roles, agents::SimSet::Visual).chain())
        .configure_sets(Startup, (world::StartupSet::World, world::StartupSet::Agents, world::StartupSet::Ui).chain())
        .add_plugins((world::WorldPlugin, banter::BanterPlugin, agents::AgentsPlugin, events::EventsPlugin, meetings::MeetingsPlugin, roles::RolesPlugin, render::RenderPlugin, bubbles::BubblesPlugin, ui::UiPlugin, debug::DebugPlugin, fx::FxPlugin))
        .run();
}
