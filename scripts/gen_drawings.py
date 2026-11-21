"""Generate the mob-sized drawing bitmaps in src/glyphs.js (between the DRAWBITS markers).
Each drawing is vector art in a 1000x1000 square; it is sampled onto the crowd's real cell grid
(cells are ~10.5 wide by 16 or 18 tall), so drawings come out square instead of stretched, and
huge gets its own native 2x bitmap instead of a blown-up copy.
python3 scripts/gen_drawings.py [--preview out.png]"""
import math, re, sys
from PIL import Image, ImageDraw
N = 1000
def P(pts): return [(x, y) for x, y in pts]
def circ(d, cx, cy, r, f): d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=f)
def line(d, pts, w, f):
    d.line(pts, fill=f, width=int(w), joint='curve')
    for x, y in (pts[0], pts[-1]): circ(d, x, y, w / 2, f)
def star(cx, cy, R, r, n=5, rot=-90):
    return [(cx + (R if i % 2 == 0 else r) * math.cos(math.radians(rot + i * 180 / n)), cy + (R if i % 2 == 0 else r) * math.sin(math.radians(rot + i * 180 / n))) for i in range(2 * n)]
# each fn(d, u): d draws with fill 1=main, 2=accent, 0=cut; u = one cell's size in this grid (for min stroke widths)
def heart(d, u):
    circ(d, 290, 330, 230, 1); circ(d, 710, 330, 230, 1); d.polygon([(75, 420), (925, 420), (500, 930)], fill=1)
    d.polygon([(110, 300), (500, 330), (890, 300), (500, 700)], fill=1)
def cake(d, u):
    d.rectangle([80, 520, 920, 960], fill=1); d.rectangle([80, 690, 920, 690 + max(70, u * .9)], fill=2)
    for x in (260, 500, 740): d.rectangle([x - max(45, u * .55), 250, x + max(45, u * .55), 500], fill=2); circ(d, x, 140, max(60, u * .6), 2)
def thumbs(d, u):
    d.rounded_rectangle([330, 420, 900, 960], 120, fill=1); d.polygon([(330, 470), (460, 60), (600, 80), (620, 470)], fill=1)
    d.rectangle([90, 450, 300, 960], fill=2)
    if u < 60:
        for y in (560, 690, 820): d.line([(560, y), (900, y)], fill=0, width=int(u * .7))
def star5(d, u): d.polygon(star(500, 540, 520, 220), fill=1)
def smile(d, u):
    circ(d, 500, 500, 490, 1); r = max(70, u * .75)
    circ(d, 330, 360, r, 2); circ(d, 670, 360, r, 2)
    d.arc([220, 300, 780, 780], 25, 155, fill=2, width=int(max(80, u * 1.05)))
def ring(d, u):
    w = max(110, u * 1.15); d.ellipse([130, 330, 870, 990], outline=1, width=int(w))
    d.polygon([(300, 110), (700, 110), (800, 230), (500, 450), (200, 230)], fill=2)
def gift(d, u):
    d.rectangle([90, 420, 910, 970], fill=1); d.rectangle([50, 300, 950, 460], fill=1)
    w = max(60, u * .6); d.rectangle([500 - w, 300, 500 + w, 970], fill=2)
    if u < 60: d.rectangle([50, 460 - w * .2, 950, 460 + w * .8], fill=0)
    d.polygon([(500, 290), (230, 60), (230, 300)], fill=2); d.polygon([(500, 290), (770, 60), (770, 300)], fill=2)
def party(d, u):
    d.polygon([(60, 960), (320, 330), (690, 690)], fill=1)
    s = max(55, u * .55)
    for x, y in ((620, 120), (880, 300), (760, 560), (430, 110), (900, 760)): d.rectangle([x - s, y - s, x + s, y + s], fill=2)
def tree(d, u):
    d.polygon([(500, 30), (760, 330), (240, 330)], fill=1); d.polygon([(500, 200), (850, 580), (150, 580)], fill=1)
    d.polygon([(500, 400), (960, 830), (40, 830)], fill=1); d.rectangle([500 - max(80, u * .6), 830, 500 + max(80, u * .6), 990], fill=2)
def pumpkin(d, u):
    d.ellipse([30, 230, 970, 980], fill=1); d.rectangle([450, 60, 560, 300], fill=2)
    d.polygon([(190, 560), (430, 560), (310, 380)], fill=0); d.polygon([(570, 560), (810, 560), (690, 380)], fill=0)
    d.polygon([(200, 680), (800, 680), (700, 860), (300, 860)], fill=0)
    for x in (380, 620): d.rectangle([x - 45, 680, x + 45, 760], fill=1)
def ghost(d, u):
    circ(d, 500, 450, 420, 1); d.rectangle([80, 450, 920, 860], fill=1)
    for i in range(4): circ(d, 185 + i * 210, 860, 105, 1)
    r = max(75, u * .8); circ(d, 330, 420, r, 2); circ(d, 670, 420, r, 2)
def sun(d, u):
    circ(d, 500, 500, 270, 1); w = max(70, u * .85)
    for a in range(0, 360, 45):
        c, s = math.cos(math.radians(a)), math.sin(math.radians(a)); line(d, [(500 + 360 * c, 500 + 360 * s), (500 + 470 * c, 500 + 470 * s)], w, 2)
def moon(d, u): circ(d, 450, 500, 460, 1); circ(d, 700, 360, 400, 0)
def ball(d, u):
    circ(d, 500, 500, 490, 1); d.polygon(star(500, 500, 200, 200, 5)[::2], fill=2)
    for a in range(-54, 306, 72): circ(d, 500 + 390 * math.cos(math.radians(a)), 500 + 390 * math.sin(math.radians(a)), 105, 2)
def fire(d, u):
    d.polygon([(500, 20), (640, 260), (800, 330), (900, 640), (780, 900), (500, 990), (220, 900), (100, 640), (230, 380), (340, 450)], fill=1)
    d.polygon([(500, 430), (650, 680), (640, 880), (500, 950), (360, 880), (350, 680)], fill=2)
def music(d, u):
    w = max(70, u * .8); d.rectangle([380, 120, 380 + w, 790], fill=1); d.rectangle([800, 60, 800 + w, 690], fill=1)
    d.polygon([(380, 120), (870, 60), (870, 220), (380, 280)], fill=1)
    d.ellipse([100, 680, 450, 950], fill=1); d.ellipse([520, 600, 870, 870], fill=1)
def crown(d, u):
    d.polygon([(40, 230), (290, 470), (500, 130), (710, 470), (960, 230), (900, 780), (100, 780)], fill=1)
    d.rectangle([100, 820, 900, 960], fill=1); r = max(60, u * .6)
    for x in (260, 500, 740): circ(d, x, 640, r, 2)
def flower(d, u):
    w = max(70, u * .75); d.rectangle([500 - w / 2, 500, 500 + w / 2, 990], fill=2); d.ellipse([520, 700, 860, 860], fill=2)
    for a in range(-90, 270, 72): circ(d, 500 + 215 * math.cos(math.radians(a)), 380 + 215 * math.sin(math.radians(a)), 170, 1)
    if u < 60: circ(d, 500, 380, 110, 0)
def snow(d, u):
    w = max(80, u * .9)
    for a in (90, 30, 150):
        c, s = math.cos(math.radians(a)), math.sin(math.radians(a)); line(d, [(500 - 460 * c, 500 - 460 * s), (500 + 460 * c, 500 + 460 * s)], w, 1)
        if u < 60:
            for sg in (1, -1):
                bx, by = 500 + sg * 300 * c, 500 + sg * 300 * s
                for t in (40, -40):
                    cc, ss = math.cos(math.radians(a + t)), math.sin(math.radians(a + t)); line(d, [(bx, by), (bx + sg * 150 * cc, by + sg * 150 * ss)], w * .8, 1)
def trophy(d, u):
    d.pieslice([170, -250, 830, 600], 0, 180, fill=1); d.rectangle([170, 40, 830, 175], fill=1)
    w = max(70, u * .75); d.arc([20, 80, 300, 420], 90, 270, fill=1, width=int(w)); d.arc([700, 80, 980, 420], 270, 90, fill=1, width=int(w))
    d.rectangle([450, 560, 550, 760], fill=1); d.rectangle([250, 760, 750, 960], fill=2)
SHAPES = dict(heart=heart, cake=cake, thumbs=thumbs, star=star5, smile=smile, ring=ring, gift=gift, party=party, tree=tree, pumpkin=pumpkin,
              ghost=ghost, sun=sun, moon=moon, ball=ball, fire=fire, music=music, crown=crown, flower=flower, snow=snow, trophy=trophy)
# grids: key -> (cols, rows). rows match the glyph height (7, or 14 when huge); cols make each drawing square on screen
GRIDS = {'h': (22, 14), 'hh': (24, 14)}  # medium (11x7) is hand-drawn in DRAW; 12x7 under hats widens its middle column
def bitmap(fn, cols, rows):
    im = Image.new('L', (N, N), 0); d = ImageDraw.Draw(im); fn(d, N / cols); px = im.load()
    out = []
    for j in range(rows):
        row = ''
        for i in range(cols):
            x0, x1, y0, y1 = int(i * N / cols), int((i + 1) * N / cols), int(j * N / rows), int((j + 1) * N / rows)
            tot = on = acc = 0
            for y in range(y0, y1, 6):
                for x in range(x0, x1, 6):
                    v = px[x, y]; tot += 1; on += v > 0; acc += v == 2
            row += '.' if on < tot * 0.42 else ('o' if acc >= on * 0.4 else 'X')
        out.append(row)
    return out
def main():
    names = [m.group(1) for m in re.finditer(r'^ \["(\w+)"', open('src/glyphs.js').read(), re.M)]
    assert names == list(SHAPES), names
    bits = {k: [bitmap(SHAPES[n], c, r) for n in names] for k, (c, r) in GRIDS.items()}
    js = '// generated by scripts/gen_drawings.py: mob-sized drawings, square on screen (huge: h=22x14, hh=24x14 under hats)\nconst DRAWBITS={' + ','.join(
        f'{k}:[' + ','.join('"' + '|'.join(b) + '"' for b in v) + ']' for k, v in bits.items()) + '};\n'
    src = open('src/glyphs.js').read()
    if '//DRAWBITS' in src: src = re.sub(r'//DRAWBITS\n.*?//\/DRAWBITS\n', '//DRAWBITS\n' + js + '//' + '/DRAWBITS\n', src, flags=re.S)
    else: src = src.replace('const DRAW_CH=', '//DRAWBITS\n' + js + '//' + '/DRAWBITS\nconst DRAW_CH=', 1)
    open('src/glyphs.js', 'w').write(src)
    if '--preview' in sys.argv:  # cells drawn at the real on-screen aspect (10.5 x 16)
        out = sys.argv[sys.argv.index('--preview') + 1]; cols = {'m': 0, 'h': 0}
        sheet = Image.new('RGB', (20 * 150, 2 * 150), '#f4f2ee'); dd = ImageDraw.Draw(sheet)
        med = [m.group(1) for m in re.finditer(r'^ \[.*,"([.Xo|]{83})"\],?$', open('src/glyphs.js').read(), re.M)]
        bits['m'] = [b.split('|') for b in med]; GRIDS['m'] = (11, 7)
        for r, k in enumerate(('m', 'h')):
            c, rw = GRIDS[k]; cw, ch = 10.5 * 11 / c * 1.15, 16 * 7 / rw * 1.15
            for n, b in enumerate(bits[k]):
                for j, row in enumerate(b):
                    for i, v in enumerate(row):
                        if v != '.': x, y = 10 + n * 150 + i * cw, 10 + r * 150 + j * ch; dd.rectangle([x + 1, y + 1, x + cw - 2, y + ch - 2], fill='#c0392b' if v == 'X' else '#2d6cdf')
        sheet.save(out)
main()
