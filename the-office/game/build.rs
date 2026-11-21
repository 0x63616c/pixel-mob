use std::{env, fs, path::Path};
fn main() {
    let out = env::var("OUT_DIR").unwrap();
    let real = Path::new("assets/data/company.json");
    let fb = Path::new("assets/fallback/company.json");
    println!("cargo:rerun-if-changed=assets/data/company.json");
    println!("cargo:rerun-if-changed=assets/fallback/company.json");
    let (src, label) = if real.exists() { (real, "data") } else { (fb, "fallback") };
    let txt = fs::read_to_string(src).unwrap_or_else(|_| "{}".into());
    // minify + drop the pre-expanded calendar_by_day (the engine filters `calendar` by `days` itself)
    let txt = match serde_json::from_str::<serde_json::Value>(&txt) {
        Ok(mut v) => {
            strip_nulls(&mut v);
            for k in ["people", "visitors"] { if let Some(a) = v.get_mut(k).and_then(|x| x.as_array_mut()) { for p in a { if let Some(o) = p.as_object_mut() { o.remove("calendar_by_day"); } } } }
            serde_json::to_string(&v).unwrap()
        }
        Err(_) => txt,
    };
    fs::write(Path::new(&out).join("company.json"), txt).unwrap();
    fs::write(Path::new(&out).join("data_source.txt"), label).unwrap();
    println!("cargo:rerun-if-changed=assets/art/atlas.json");
    // the fallback gets the same cleaning
    let fbt = fs::read_to_string(fb).unwrap_or_else(|_| "{}".into());
    let fbt = match serde_json::from_str::<serde_json::Value>(&fbt) { Ok(mut v) => { strip_nulls(&mut v); serde_json::to_string(&v).unwrap() } Err(_) => fbt };
    fs::write(Path::new(&out).join("fallback.json"), fbt).unwrap();
    let atlas = fs::read_to_string("assets/art/atlas.json").unwrap_or_else(|_| "{}".into());
    let atlas = serde_json::from_str::<serde_json::Value>(&atlas).map(|v| serde_json::to_string(&v).unwrap()).unwrap_or_else(|_| "{}".into());
    fs::write(Path::new(&out).join("atlas.json"), atlas).unwrap();
}

/// null means "not set": drop it so serde defaults apply (strings, numbers, lists)
fn strip_nulls(v: &mut serde_json::Value) {
    match v {
        serde_json::Value::Object(m) => { m.retain(|_, x| !x.is_null()); for x in m.values_mut() { strip_nulls(x); } }
        serde_json::Value::Array(a) => { a.retain(|x| !x.is_null()); for x in a.iter_mut() { strip_nulls(x); } }
        _ => {}
    }
}
