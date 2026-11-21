# Pixel Mob art checklist

- Style: tiny pixel people form pixel-art messages and recognisable emoji silhouettes.
- References: `docs/drawings/draw-compare-*.png` (before above, after below).
- Palette: theme clothing; each drawing keeps its main and accent colours; cream default background.
- Light: the existing left-down shadows. Do not change.
- Composition: people stand on integer slot coordinates. Drawings are authored for the crowd's real cell pitch (about 10.5 wide by 16 tall), so they read square on screen.
- Medium: hand-drawn 11x7 drawing bitmaps; 12x7 under hat themes (taller rows).
- Huge: native 22x14 / 24x14 bitmaps from `scripts/gen_drawings.py`, never a 2x blow-up.
- Small: thin text strokes only; drawings keep every cell.
- Zero footprint overlaps during assemble, preview and replay (`?debug=1` counter).

## Never-again list

- 2026-11-20, Calum: emoji drawings "looking stretched vertically and less crisp at huge size".
