"""Pixel Mob brand assets: the mob mark, the wordmark, favicons, app icons and the web manifest.
Everything is drawn on one pixel grid from the same 5x7 font the crowd uses, so the brand stays crisp at any size."""
import json, re
from pathlib import Path
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'site'
INK, PAPER, CARD, CORAL, SUN, SKY = '#2d2420', '#f4f2ee', '#fffdf8', '#e2483d', '#f1c40f', '#2f6fd6'
# the font lives in src/glyphs.js; parse it so the wordmark can never drift from the in-app lettering
src = (ROOT / 'src/glyphs.js').read_text()
G = {}
for m in re.finditer(r'(?:"(.)"|\b([A-Z0-9])):"([X.|]+)"', src):
    G[m.group(1) or m.group(2)] = m.group(3).split('|')
# one mob member: cap, face, shirt, legs (5 wide x 9 tall); the leader raises an arm
def person(cap, skin, shirt, legs, arm=False):
    rows = ['.CCC.', 'CCCCC', '.SSS.', '.SSS.', 'TTTTT', 'TTTTT', '.TTT.', '.L.L.', '.L.L.']
    px = {}
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c != '.': px[(x, y)] = {'C': cap, 'S': skin, 'T': shirt, 'L': legs, 'E': '#1b1714'}[c]
    if arm:
        for y in (1, 2, 3): px[(5, y)] = skin
        px[(5, 4)] = shirt
    return px
def mark():
    px = {}
    for ox, oy, p in ((0, 1, person(SKY, '#c98b5e', SUN, INK)), (6, 0, person(CORAL, '#f0c39d', INK, INK, arm=True)), (13, 1, person(INK, '#8d5a3b', CORAL, INK))):
        for (x, y), c in p.items(): px[(x + ox, y + oy)] = c
    return px, 18, 10
def text(s, color_fn):
    px, x = {}, 0
    for i, ch in enumerate(s):
        if ch == ' ': x += 3; continue
        g = G[ch]
        for y, r in enumerate(g):
            for gx, v in enumerate(r):
                if v == 'X': px[(x + gx, y)] = color_fn(i)
        x += len(g[0]) + 1
    return px, x - 1, 7
def svg(px, w, h, title):
    rects = ''.join(f'<rect x="{x}" y="{y}" width="1" height="1" fill="{c}"/>' for (x, y), c in sorted(px.items()))
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w*3}" height="{h*3}" shape-rendering="crispEdges" role="img" aria-label="{title}"><title>{title}</title>{rects}</svg>\n'
def wordmark():
    m, mw, mh = mark()
    t, tw, th = text('PIXEL MOB', lambda i: CORAL if i >= 6 else INK)
    px = dict(m)
    for (x, y), c in t.items(): px[(x + mw + 4, y + 2)] = c
    return px, mw + 4 + tw, mh
def png(px, w, h, size, scale, bg=None, radius=0, out=None):
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if bg: d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=bg)
    ox, oy = (size - w * scale) // 2, (size - h * scale) // 2
    for (x, y), c in px.items(): d.rectangle([ox + x * scale, oy + y * scale, ox + (x + 1) * scale - 1, oy + (y + 1) * scale - 1], fill=c)
    if out: im.save(out)
    return im
if __name__ == '__main__':
    OUT.mkdir(exist_ok=True)
    m, mw, mh = mark(); w, ww, wh = wordmark()
    (OUT / 'logo.svg').write_text(svg(m, mw, mh, 'Pixel Mob'))
    (OUT / 'wordmark.svg').write_text(svg(w, ww, wh, 'Pixel Mob'))
    lead = {k: v for k, v in person(CORAL, '#f0c39d', INK, INK, arm=True).items()}
    # favicon.svg: the mob on a warm card, scales cleanly in modern browsers
    fav = {(x + 1, y + 5): c for (x, y), c in m.items()}
    rects = ''.join(f'<rect x="{x}" y="{y}" width="1" height="1" fill="{c}"/>' for (x, y), c in fav.items())
    (OUT / 'favicon.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" shape-rendering="crispEdges"><rect width="20" height="20" rx="4" fill="{PAPER}"/>{rects}</svg>\n')
    png(lead, 6, 9, 32, 3, PAPER, 6, OUT / 'favicon-32.png')
    ico = [png(lead, 6, 9, 16, 1, PAPER, 3), png(lead, 6, 9, 32, 3, PAPER, 6), png(lead, 6, 9, 48, 5, PAPER, 9)]
    ico[2].save(OUT / 'favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:2])
    png(m, mw, mh, 180, 8, PAPER, 0, OUT / 'apple-touch-icon.png')
    png(m, mw, mh, 192, 8, PAPER, 34, OUT / 'icon-192.png')
    png(m, mw, mh, 512, 22, PAPER, 90, OUT / 'icon-512.png')
    png(m, mw, mh, 512, 16, PAPER, 0, OUT / 'icon-maskable-512.png')
    (OUT / 'site.webmanifest').write_text(json.dumps({
        'name': 'Pixel Mob', 'short_name': 'Pixel Mob', 'description': 'Tiny people, big feelings. Turn any message into a pixel crowd surprise.',
        'id': '/', 'start_url': '/?source=pwa', 'scope': '/', 'display': 'standalone', 'background_color': PAPER, 'theme_color': PAPER,
        'icons': [{'src': '/icon-192.png', 'sizes': '192x192', 'type': 'image/png'}, {'src': '/icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
                  {'src': '/icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]}, indent=2) + '\n')
    print('wordmark', ww, 'x', wh, '| mark', mw, 'x', mh)
