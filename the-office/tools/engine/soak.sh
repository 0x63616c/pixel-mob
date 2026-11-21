#!/usr/bin/env bash
# long fast-forward soak across seeds: elevator-only presence + zero collisions
for seed in ${SEEDS:-1977 7 42}; do
  echo "=== seed $seed"
  timeout 600 python3 /workspace/pixel-office/tools/engine/playtest_presence.py "http://localhost:8787/?seed=$seed&t=06:30&speed=16&ui=0" --secs ${SECS:-120} --every 3 | tail -8
done
