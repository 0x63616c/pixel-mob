#!/usr/bin/env bash
# Build the web bundle into <root>/dist.  Usage: tools/build.sh [release|fast]
set -euo pipefail
PROFILE=${1:-release}
ROOT=$(cd "$(dirname "$0")/.." && pwd)
export CARGO_TARGET_DIR=$ROOT/target
export PATH=$HOME/.cargo/bin:$PATH
unset NO_COLOR
cd $ROOT/game
cargo build --profile "$PROFILE" --target wasm32-unknown-unknown
WASM=$CARGO_TARGET_DIR/wasm32-unknown-unknown/$PROFILE/pixel-office.wasm
OUT=$ROOT/dist
rm -rf "$OUT.tmp" && mkdir -p "$OUT.tmp"
wasm-bindgen --target web --no-typescript --out-dir "$OUT.tmp" --out-name pixel_office "$WASM"
WOPT=$(ls -d $HOME/.cache/trunk/wasm-opt-*/bin/wasm-opt 2>/dev/null | head -1 || true)
if [[ "$PROFILE" == "release" && -n "$WOPT" ]]; then
  "$WOPT" -Oz --all-features --strip-debug --strip-producers "$OUT.tmp/pixel_office_bg.wasm" -o "$OUT.tmp/opt.wasm" && mv "$OUT.tmp/opt.wasm" "$OUT.tmp/pixel_office_bg.wasm"
fi
cp -r assets "$OUT.tmp/assets"
# swap trunk's rust link for a plain module loader (cache-busted)
V=$(date +%s)
python3 - "$OUT.tmp" "$V" <<'PY'
import sys,re
out,v=sys.argv[1],sys.argv[2]
h=open('index.html').read()
h=re.sub(r'<link data-trunk rel="rust"[^>]*>\n','',h)
h=re.sub(r'<link data-trunk rel="copy-dir"[^>]*>\n','',h)
loader=f'''<script type="module">
import init from './pixel_office.js?v={v}';
init({{module_or_path: './pixel_office_bg.wasm?v={v}'}}).catch(e => {{ if (!String(e).includes('Using exceptions for control flow')) {{ console.error(e); const l=document.getElementById('l3'); if(l){{l.className='line err'; l.textContent='> failed to start: '+String(e).slice(0,60);}} }} }});
</script>
</body>'''
h=h.replace('</body>',loader)
open(out+'/index.html','w').write(h)
PY
cat > "$OUT.tmp/_headers" <<'H'
/*.wasm
  Content-Type: application/wasm
  Cache-Control: public, max-age=3600
H
rm -rf "$OUT" && mv "$OUT.tmp" "$OUT"
ls -la "$OUT" | grep -E 'wasm|js|html'
