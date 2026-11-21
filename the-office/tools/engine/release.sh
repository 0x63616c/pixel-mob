#!/usr/bin/env bash
# Release web build for pixelmob.io/the-office/ -> <root>/dist-release
# (fat LTO, opt-level z, no debug gizmos, trunk's wasm-opt -Oz). Fails if any file >= 25 MiB.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
export CARGO_TARGET_DIR=$ROOT/target PATH=$HOME/.cargo/bin:$PATH
unset NO_COLOR
cd $ROOT/game
rm -rf $ROOT/dist-release.tmp
trunk build --release --public-url /the-office/ --dist $ROOT/dist-release.tmp
rm -rf $ROOT/dist-release.tmp/assets/data   # data is embedded in the wasm at build time
cat > $ROOT/dist-release.tmp/_headers <<'H'
/the-office/*.wasm
  Content-Type: application/wasm
  Cache-Control: public, max-age=31536000, immutable
H
big=$(find $ROOT/dist-release.tmp -type f -size +25M)
[[ -z "$big" ]] || { echo "TOO BIG: $big"; exit 1; }
rm -rf $ROOT/dist-release && mv $ROOT/dist-release.tmp $ROOT/dist-release
find $ROOT/dist-release -maxdepth 1 -type f -exec ls -la {} \; | awk '{print $5, $9}'
du -sh $ROOT/dist-release
