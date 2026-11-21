from common import *
import math, random
WAL, WAL_H, WAL_S, WAL_D, WAL_G = hx('#8e5b37'), hx('#a9734a'), hx('#6c4329'), hx('#4a2e1b'), hx('#7f5131')
BEI, BEI_H, BEI_S, BEI_D = hx('#d9cdaf'), hx('#ece4cd'), hx('#b8aa89'), hx('#8f8266')
SCR, GRN, GRN_D, GRN_M = hx('#0c261c'), hx('#7cf2a0'), hx('#2c8a55'), hx('#4cc47e')
STL, STL_H, STL_S = hx('#b9bec3'), hx('#dfe3e6'), hx('#858b91')
BRS, BRS_H, BRS_S = hx('#c9a03a'), hx('#e8c86a'), hx('#8f6c22')
TEAL, TEAL_D, MUST, ORNG, AVO, CREAM, RED = hx('#2f6f68'), hx('#22524d'), hx('#c9a03a'), hx('#c0622f'), hx('#7a8a3a'), hx('#efe6d0'), hx('#b8402e')
INK = hx('#1d1a22')
P = {}   # name -> dict(frames=[Cv], anchor=(x,y), meta)
def add(name, frames, anchor, **meta):
    if not isinstance(frames, list): frames = [frames]
    P[name] = dict(frames=frames, anchor=anchor, meta=meta)

# ------------------------------------------------------------ desks
def desk_surface(c, x, y, w, d, face=5, legs=True, sh=True):
    if sh: shadow_rect(c, x + 1, y + d + face - 1, w, 5)
    c.rect(x, y, w, d, WAL)
    for j in range(y + 2, y + d - 1, 3):
        for i in range(x + 1, x + w - 1):
            if (i * 7 + j * 13) % 11 < 6: c.set(i, j, WAL_G)
    c.hline(x, y, w, WAL_H); c.vline(x, y, d, WAL_H)
    c.rect(x, y + d, w, face, WAL_S); c.hline(x, y + d + face - 1, w, WAL_D)
    c.hline(x, y + d, w, shade(WAL_S, 1.1))
    if legs:
        for lx in (x + 1, x + w - 2):
            c.vline(lx, y + d + face, 3, STL_S); c.set(lx, y + d + face + 2, STL_S)
def make_desk():
    c = Cv(34, 26); desk_surface(c, 2, 2, 30, 11, 5)
    c.rect(22, 15, 6, 1, BRS)  # drawer pull
    c.outline(0.5); add('desk', c, (17, 13), sort='anchor', note='single desk, worker sits north (facing S) or south (facing N)')
def make_pod():
    W, H = 70, 50
    c = Cv(W, H)
    shadow_rect(c, 3, 40, 64, 5)
    # north desks (workers sit above, facing S); their front face is hidden behind divider
    for dx in (3, 35): desk_surface(c, dx, 4, 31, 12, 2, legs=False, sh=False)
    # divider: low fabric panel, teal-green with walnut cap
    c.rect(3, 15, 63, 1, WAL_H); c.rect(3, 16, 63, 5, hx('#3d6b5f')); c.hline(3, 20, 63, hx('#2c5248'))
    for i in range(4, 66, 2): c.set(i, 17 + (i // 2) % 2, hx('#477a6c'))
    c.vline(34, 16, 5, WAL_S)
    for dx in (3, 35): desk_surface(c, dx, 21, 31, 12, 5, sh=False)
    for dx in (3, 35): c.rect(dx + 21, 35, 6, 1, BRS)
    c.outline(0.5)
    add('desk_pod4', c, (35, 25), sort='anchor',
        seats=[dict(x=-17, y=-19, facing='S'), dict(x=15, y=-19, facing='S'), dict(x=-17, y=17, facing='N'), dict(x=15, y=17, facing='N')],
        crt=[dict(x=-17, y=-12, sprite='crt_back'), dict(x=15, y=-12, sprite='crt_back'), dict(x=-17, y=2, sprite='crt_front'), dict(x=15, y=2, sprite='crt_front')],
        keyboard=[dict(x=-17, y=-17), dict(x=15, y=-17), dict(x=-17, y=6), dict(x=15, y=6)],
        items=[dict(x=-28, y=-15), dict(x=4, y=-15), dict(x=-6, y=4), dict(x=26, y=4)],
        note='Seats/crt are offsets from the anchor (= pod centre). Seat (x,y) is where the seated person\'s FOOT anchor goes. North seats face S and are drawn BEFORE the pod; south seats face N and are drawn AFTER it.')

# ------------------------------------------------------------ CRTs
random.seed(7)
def crt_screen(c, x, y, w, h, f, mode='numbers'):
    c.rect(x, y, w, h, SCR)
    for (i, j) in [(x, y), (x + w - 1, y), (x, y + h - 1), (x + w - 1, y + h - 1)]: c.set(i, j, hx('#1a3a2c'))
    rng = random.Random(f * 31 + w)
    if mode == 'numbers':
        for j in range(y + 1, y + h - 1, 2):
            for i in range(x + 1, x + w - 1):
                v = rng.random()
                if v < 0.55: c.set(i, j, GRN_D if v < 0.4 else GRN)
        # a "scary" bright cluster wandering
        cx = x + 2 + (f * 3) % max(1, w - 4); cy = y + 2 + (f // 2) % max(1, h - 4)
        c.set(cx, cy, hx('#d8ffe6')); c.set(cx + 1, cy, GRN)
    elif mode == 'cursor':
        for k, j in enumerate(range(y + 1, y + h - 2, 2)):
            ln = (k * 5 + f * 2) % (w - 2)
            c.hline(x + 1, j, ln, GRN_D)
        if f % 2 == 0: c.rect(x + 1, y + h - 3, 2, 1, GRN)
    for j in range(y + 1, y + h, 2):  # scanlines
        for i in range(x, x + w):
            p = c.get(i, j)
            if p[3]: c.px[i, j] = shade(p, 0.82)
    c.set(x + 1, y + 1, hx('#3c6a55')); c.set(x + 2, y + 1, hx('#2a5442'))
def make_crt():
    fr = []
    for f in range(6):
        c = Cv(20, 22)
        shadow(c, 3, 17, 14, 4)
        c.rect(7, 16, 6, 2, BEI_S); c.rect(5, 18, 10, 1, BEI_D)  # stand
        c.rrect(2, 1, 16, 15, BEI, 2); c.hline(3, 1, 14, BEI_H); c.vline(2, 3, 11, BEI_H)
        c.vline(17, 3, 11, BEI_S); c.hline(3, 15, 14, BEI_S)
        crt_screen(c, 4, 3, 12, 9, f)
        c.hline(5, 13, 3, BEI_S); c.set(14, 13, hx('#e0772f') if f % 3 else hx('#ffb067'))
        c.outline(0.5); fr.append(c)
    add('crt_front', fr, (10, 18), fps=4, note='screen faces camera (desk south of a worker facing N... i.e. south-row pod desks). Animated numbers.')
    fr = []
    for f in range(2):
        c = Cv(20, 22)
        shadow(c, 3, 17, 14, 4)
        c.rect(7, 16, 6, 2, BEI_S)
        c.rrect(2, 1, 16, 15, BEI_S, 2); c.hline(3, 1, 14, BEI); c.rrect(5, 4, 10, 10, BEI, 1)
        for j in range(6, 12, 2): c.hline(7, j, 6, BEI_D)
        c.hline(3, 0, 14, GRN_M + ()) if False else None
        c.outline(0.5)
        # phosphor spill on top edge (glow seen over the case)
        for i in range(4, 16): c.set(i, 0, (124, 242, 160, 70 if f == 0 else 110))
        fr.append(c)
    add('crt_back', fr, (10, 18), fps=1, note='back of a CRT (screen faces away from camera)')
    c = Cv(16, 7); c.rrect(1, 1, 14, 5, BEI, 1); c.hline(1, 1, 14, BEI_H); c.hline(1, 5, 14, BEI_S)
    for i in range(2, 14, 2): c.set(i, 2, BEI_D); c.set(i + 1, 3, BEI_D)
    c.hline(4, 4, 7, BEI_S); c.outline(0.5); add('keyboard', c, (8, 4))
# ------------------------------------------------------------ phone & belongings
def make_phone():
    fr = []
    for f in range(3):
        c = Cv(14, 12); shadow(c, 1, 8, 12, 3)
        dy = -1 if f == 1 else 0; dx = [0, -1, 1][f]
        c.rrect(2, 4, 10, 6, MUST, 1); c.hline(2, 4, 10, shade(MUST, 1.2)); c.hline(2, 9, 10, shade(MUST, 0.75))
        c.ellipse(7, 7, 2.4, 1.8, CREAM); c.set(7, 7, INK) if True else None
        c.rrect(1 + dx, 2 + dy, 12, 3, shade(MUST, 0.85), 1); c.hline(2 + dx, 2 + dy, 10, MUST)
        c.outline(0.5)
        if f:
            for (x, y) in [(0, 1), (13, 1), (0, 3), (13, 3)]: c.set(x, y + (f - 1), hx('#e05a3a'))
        fr.append(c)
    add('phone', fr[:1], (7, 9)); add('phone_ring', fr[1:], (7, 9), fps=12, note='ringing desk phone (lone one in the void)')
def tiny(name, w, h, draw, anchor=None, **m):
    c = Cv(w, h); draw(c); c.outline(0.5); add(name, c, anchor or (w // 2, h - 1), **m)
def mug(col):
    def d(c):
        shadow(c, 1, 6, 6, 2); c.rect(1, 1, 5, 6, col); c.hline(1, 1, 5, shade(col, 1.25)); c.vline(5, 2, 5, shade(col, 0.78))
        c.set(6, 3, col); c.set(6, 4, col); c.rect(2, 1, 3, 1, hx('#3a2418'))
    return d
for n, col in [('mug_orange', ORNG), ('mug_mustard', MUST), ('mug_teal', TEAL), ('mug_cream', CREAM)]:
    tiny(n, 8, 9, mug(col))
def photo(c):
    shadow(c, 0, 7, 7, 2); c.rect(1, 0, 6, 8, BRS); c.rect(2, 1, 4, 5, hx('#9fc2c9')); c.rect(2, 4, 4, 2, hx('#7a9a5a')); c.set(4, 3, hx('#e9bc94')); c.set(4, 2, hx('#5a3a22')); c.vline(6, 1, 7, BRS_S)
tiny('photo_frame', 8, 10, photo)
def figurine(c):
    shadow(c, 1, 7, 5, 2); c.rect(2, 7, 4, 1, WAL_D); c.rect(3, 4, 2, 3, ORNG); c.rect(3, 1, 2, 3, hx('#f4d6ba')); c.set(3, 0, INK); c.set(4, 0, INK); c.set(3, 2, INK)
tiny('figurine', 8, 9, figurine)
def ball(c): shadow(c, 0, 3, 5, 2); c.ellipse(2.5, 2.5, 2.2, 2.2, ORNG); c.set(1, 1, hx('#f0a070'))
tiny('stress_ball', 6, 6, ball)
def cactus(c):
    shadow(c, 0, 9, 7, 2); c.rect(1, 7, 5, 3, hx('#c0622f')); c.hline(1, 7, 5, hx('#d77e4e'))
    c.rect(2, 1, 3, 6, hx('#4f7d3e')); c.vline(4, 2, 5, hx('#3a6230')); c.set(1, 3, hx('#4f7d3e')); c.set(0, 2, hx('#4f7d3e')); c.set(5, 4, hx('#4f7d3e')); c.set(6, 3, hx('#4f7d3e')); c.set(3, 0, hx('#e88fb0'))
tiny('cactus', 8, 11, cactus)
def nameplate(c): shadow(c, 0, 3, 12, 2); c.rect(1, 0, 10, 3, WAL_D); c.rect(2, 1, 8, 1, BRS_H); c.hline(1, 3, 10, BRS_S)
tiny('nameplate', 12, 5, nameplate)
def papers(c): shadow(c, 0, 4, 9, 2); c.rect(1, 2, 7, 3, hx('#e8e4d8')); c.rect(0, 1, 7, 3, hx('#f6f3ea')); c.hline(1, 2, 4, hx('#9aa0a6'))
tiny('papers', 10, 7, papers)
def eraser(c): shadow(c, 0, 3, 6, 2); c.rect(1, 1, 5, 3, hx('#e88fb0')); c.hline(1, 1, 5, hx('#f4b4cc'))
tiny('eraser', 7, 5, eraser, note='desk-tchotchke reward')
def caricature(c):
    shadow(c, 0, 9, 9, 2); c.rect(1, 0, 8, 10, WAL_D); c.rect(2, 1, 6, 7, CREAM); c.ellipse(5, 4, 2.5, 2.6, hx('#e9bc94')); c.hline(3, 2, 4, hx('#5a3a22')); c.set(4, 4, INK); c.set(6, 4, INK); c.hline(4, 6, 3, hx('#b8402e'))
tiny('caricature', 10, 12, caricature, note='reward: caricature portrait')
def melon(c): shadow(c, 0, 5, 9, 2); c.rect(1, 3, 7, 2, hx('#4f7d3e')); c.rect(1, 1, 7, 2, hx('#e8506a')); c.hline(2, 0, 5, hx('#e8506a')); c.set(3, 2, INK); c.set(5, 1, INK); c.hline(1, 3, 7, hx('#eef0c0'))
tiny('melon', 9, 7, melon)
def waffle(c):
    shadow(c, 0, 6, 9, 2); c.rect(1, 1, 7, 6, hx('#d9a24a')); [c.set(i, j, hx('#b07a2a')) for i in range(2, 8, 2) for j in range(2, 7, 2)]
tiny('waffle', 9, 8, waffle)
# ------------------------------------------------------------ chairs
CHAIR_COLS = {'orange': ORNG, 'mustard': MUST, 'teal': TEAL, 'avocado': AVO, 'cream': hx('#e2d6bc')}
def make_chairs():
    for cn, col in CHAIR_COLS.items():
        hi, lo = shade(col, 1.2), shade(col, 0.75)
        c = Cv(16, 20); shadow(c, 2, 15, 12, 4)       # chair_s: seat faces camera, back behind
        c.rrect(2, 1, 12, 8, col, 2); c.hline(4, 1, 8, hi); c.hline(3, 8, 10, lo)
        c.rrect(2, 9, 12, 4, hi, 1); c.hline(3, 12, 10, lo)
        for x in (4, 11): c.vline(x, 13, 4, STL_S)
        c.vline(7, 13, 3, STL); c.outline(0.5); s = c
        c = Cv(16, 20); shadow(c, 2, 15, 12, 4)       # chair_n: back faces camera
        c.rrect(3, 5, 10, 3, hi, 1)
        c.rrect(2, 7, 12, 7, col, 2); c.hline(4, 7, 8, hi); c.hline(3, 13, 10, lo); c.vline(13, 9, 4, lo)
        for x in (4, 11): c.vline(x, 14, 3, STL_S)
        c.outline(0.5); n = c
        c = Cv(16, 20); shadow(c, 2, 15, 12, 4)       # chair_e: side, facing right
        c.rect(3, 3, 3, 8, col); c.vline(3, 3, 8, hi); c.rect(4, 10, 9, 3, col); c.hline(4, 10, 9, hi); c.hline(4, 12, 9, lo)
        c.vline(5, 13, 4, STL_S); c.vline(11, 13, 4, STL_S); c.outline(0.5); e = c
        w = Cv(16, 20); w.im = e.im.transpose(Image.FLIP_LEFT_RIGHT); w.px = w.im.load()
        add(f'chair_s_{cn}', s, (8, 16), note='worker faces S; draw BEFORE the person')
        add(f'chair_n_{cn}', n, (8, 16), note='worker faces N; draw AFTER the person (covers their lower back)')
        add(f'chair_e_{cn}', e, (8, 16)); add(f'chair_w_{cn}', w, (8, 16))
# ------------------------------------------------------------ cabinets & plants
def make_cabinet():
    for nm, col in [('filing_cabinet', hx('#c8c1aa')), ('filing_cabinet_avocado', hx('#8a9450'))]:
        c = Cv(18, 30); shadow_rect(c, 2, 25, 15, 4)
        c.rect(2, 1, 14, 4, shade(col, 1.15)); c.rect(2, 5, 14, 22, col); c.vline(15, 5, 22, shade(col, 0.8))
        for k in range(3):
            y = 6 + k * 7; c.hline(3, y + 6, 12, shade(col, 0.72)); c.rect(7, y + 2, 4, 1, BRS); c.rect(6, y + 1, 2, 1, hx('#f2efe6'))
        c.outline(0.5); add(nm, c, (9, 27))
def make_plants():
    for nm, pot, ph in [('snake_plant', CREAM, shade(CREAM, 0.82)), ('snake_plant_terracotta', hx('#b86a40'), hx('#8f4e2c'))]:
        c = Cv(16, 30); shadow(c, 2, 25, 12, 4)
        c.rect(3, 19, 10, 8, pot); c.vline(12, 19, 8, ph); c.hline(3, 19, 10, shade(pot, 1.1)); c.hline(2, 18, 12, shade(pot, 1.05)); c.hline(4, 26, 8, ph)
        DG, MG, YG = hx('#2c5a3a'), hx('#3f7a4a'), hx('#b8c25a')
        blades = [(4, 7, 10), (6, 2, 16), (8, 0, 18), (10, 4, 14), (12, 9, 9), (7, 6, 12), (9, 8, 10)]
        for bx, top, ln in blades:
            for j in range(top, 19):
                c.set(bx, j, DG if (j + bx) % 4 else MG); c.set(bx + 1, j, MG if j > top + 1 else None)
            c.set(bx, top, YG); c.vline(bx + 1, top + 2, 3, YG)
        c.outline(0.5); add(nm, c, (8, 27))
    c = Cv(22, 34); shadow(c, 4, 29, 14, 4)   # tall fiddle-leaf-ish plant
    c.rect(6, 24, 10, 7, CREAM); c.vline(15, 24, 7, shade(CREAM, 0.82)); c.vline(11, 10, 14, WAL_D)
    for (lx, ly) in [(5, 3), (12, 1), (3, 10), (14, 8), (7, 15), (15, 15), (9, 7)]:
        c.ellipse(lx + 2, ly + 3, 3.2, 2.6, hx('#3f7a4a')); c.set(lx + 1, ly + 2, hx('#6aa25a')); c.set(lx + 2, ly + 4, hx('#2c5a3a'))
    c.outline(0.5); add('plant_tall', c, (11, 30))
# ------------------------------------------------------------ meeting tables
def oval_table(w, h, name, seats, brass=False, pedestal=True):
    c = Cv(w + 6, h + 12)
    c.ellipse((w + 6) / 2, h + 6, w / 2 - 2, 3.5, (40, 52, 66, 50))
    c.ellipse((w + 6) / 2 + 1, h * 0.55 + 5, w / 2 + 0.5, h / 2 + 0.5, (40, 52, 66, 26))
    cx, cy = (w + 6) / 2, h / 2 + 2
    c.ellipse(cx, cy + 2, w / 2, h / 2, WAL_S)
    c.ellipse(cx, cy, w / 2, h / 2, WAL)
    c.ellipse(cx - 1, cy - 1, w / 2 - 2, h / 2 - 2, shade(WAL, 1.06))
    for j in range(int(cy - h / 2) + 2, int(cy + h / 2), 3):
        for i in range(2, w + 4):
            p = c.get(i, j)
            if p[3] and p[:3] != WAL_S[:3] and (i * 5 + j * 3) % 7 < 3: c.px[i, j] = WAL_G
    if brass:
        for i in range(int(cx - w / 2 + 6), int(cx + w / 2 - 6)): c.set(i, int(cy), BRS)
    if pedestal: c.rect(cx - 2, cy + h / 2 + 2, 4, 3, STL_S)
    c.outline(0.5); add(name, c, (int(cx), int(cy)), seats=seats, note='seats = offsets from anchor (table centre) where seated FOOT anchors go')
def rect_table(w, h, name, seats, brass=False):
    c = Cv(w + 6, h + 14)
    shadow_rect(c, 3, h + 6, w, 5)
    desk_surface(c, 3, 2, w, h, 4, legs=False, sh=False)
    c.rrect(3, 2, w, h, WAL, 2); c.hline(5, 2, w - 4, WAL_H)
    for j in range(5, h, 3):
        for i in range(5, w + 1):
            if (i * 7 + j * 13) % 11 < 5: c.set(i, j, WAL_G)
    if brass: c.hline(10, 2 + h // 2, w - 14, BRS)
    for lx in (6, w): c.vline(lx, h + 6, 3, STL_S)
    c.outline(0.5); add(name, c, (3 + w // 2, 2 + h // 2), seats=seats, note='seats = offsets from anchor (table centre)')
def make_tables():
    oval_table(18, 12, 'table_booth', [dict(x=0, y=-5, facing='S')])
    oval_table(30, 20, 'table_huddle', [dict(x=-9, y=-9, facing='S'), dict(x=9, y=-9, facing='S'), dict(x=-9, y=15, facing='N'), dict(x=9, y=15, facing='N')])
    rect_table(60, 22, 'table_team', [dict(x=x, y=-10, facing='S') for x in (-21, -7, 7, 21)] + [dict(x=x, y=18, facing='N') for x in (-21, -7, 7, 21)])
    rect_table(124, 28, 'table_boardroom', [dict(x=x, y=-13, facing='S') for x in range(-50, 51, 17)] + [dict(x=x, y=21, facing='N') for x in range(-50, 51, 17)], brass=True)
    # all-hands kit
    c = Cv(18, 28); shadow_rect(c, 2, 23, 14, 4)
    c.rect(3, 8, 12, 16, WAL); c.vline(14, 8, 16, WAL_S); c.rect(2, 5, 14, 4, WAL_H); c.hline(2, 8, 14, WAL_S)
    c.rect(7, 13, 4, 4, BRS); c.vline(9, 1, 5, STL_S); c.rect(8, 0, 3, 2, INK)
    c.outline(0.5); add('lectern', c, (9, 25))
    c = Cv(60, 16); shadow_rect(c, 2, 11, 56, 4)
    c.rect(2, 3, 56, 4, WAL); c.hline(2, 3, 56, WAL_H); c.rect(2, 7, 56, 3, WAL_S)
    for lx in (4, 30, 55): c.vline(lx, 10, 3, STL_S)
    c.outline(0.5); add('bench', c, (30, 7), seats=[dict(x=x, y=2, facing='N') for x in (-21, -7, 7, 21)], note='all-hands bench; seated people face N toward the stage (draw after bench)')
    fr = []
    for f in range(4):
        c = Cv(84, 58)
        c.ellipse(42, 54, 30, 3, (40, 52, 66, 40))
        c.rect(2, 2, 80, 44, INK); c.rect(4, 4, 76, 40, SCR)
        bars = [12, 18, 15, 24, 21, 30, 27]
        for k, b in enumerate(bars):
            bb = b + (1 if (k + f) % 3 == 0 else 0)
            c.rect(10 + k * 9, 40 - bb, 6, bb, GRN_D); c.hline(10 + k * 9, 40 - bb, 6, GRN)
        c.hline(8, 41, 68, GRN_M)
        for j in range(5, 44, 2):
            for i in range(4, 80):
                p = c.get(i, j); c.px[i, j] = shade(p, 0.85)
        c.rect(40, 46, 4, 4, STL_S)
        fr.append(c)
    add('projector_screen', fr, (42, 54), fps=2, float=True, note='floating screen; hovers (bob 1px slowly)')
# ------------------------------------------------------------ coffee & cooler
def make_coffee():
    fr = []
    for f in range(5):
        broken = f >= 3
        c = Cv(48, 40)
        shadow_rect(c, 3, 34, 42, 4)
        desk_surface(c, 2, 14, 44, 10, 10, legs=False, sh=False)
        for k in range(2): c.rect(6 + k * 18, 26, 16, 6, WAL_S); c.rect(12 + k * 18, 28, 4, 1, BRS)
        # percolator
        c.rect(8, 4, 12, 13, STL); c.vline(8, 4, 13, STL_H); c.vline(19, 4, 13, STL_S); c.rect(10, 2, 8, 2, STL_S); c.rect(12, 0, 4, 2, INK)
        c.rect(10, 8, 8, 4, INK); c.set(11 + (f % 3), 9, GRN if not broken else RED)
        c.set(17, 13, RED if broken else hx('#e0a23a'))
        # mugs + sugar
        for k, col in enumerate([ORNG, MUST, TEAL]): c.rect(26 + k * 5, 11, 4, 4, col); c.hline(26 + k * 5, 11, 4, shade(col, 1.2))
        c.rect(40, 9, 4, 6, CREAM); c.rect(40, 8, 4, 1, BRS)
        c.outline(0.5)
        if not broken:
            for k in range(3):
                sy = 0 - k * 0; sx = 14 + ((f + k) % 3) - 1
                c.set(sx, max(0, 1 - k), (255, 255, 255, 170))
        else:
            for (dx, dy) in [(0, 0), (1, -1), (-1, -1), (2, -2)]:
                c.set(22 + dx + (f - 3) * 2, 4 + dy - (f - 3), (90, 90, 96, 180))
        fr.append(c)
    add('coffee_station', fr[:3], (24, 30), fps=4, states={'ok': [0, 1, 2], 'broken': [3, 4]})
    P['coffee_station']['frames'] = fr
    fr = []
    for f in range(3):
        c = Cv(16, 32); shadow(c, 2, 27, 12, 4)
        c.rect(3, 13, 10, 15, hx('#eceae4')); c.vline(12, 13, 15, hx('#c9c5bb')); c.rect(5, 17, 6, 2, STL_S); c.set(6, 19, hx('#4a7ab8')); c.set(9, 19, RED)
        c.rrect(4, 2, 8, 11, hx('#8fc0e0'), 2); c.vline(5, 3, 8, hx('#c8e2f2')); c.vline(11, 3, 8, hx('#5c94bd'))
        for k in range(2): c.set(7 + (k * 2), 10 - ((f * 3 + k * 4) % 8), (255, 255, 255, 220))
        c.outline(0.5); fr.append(c)
    add('water_cooler', fr, (8, 29), fps=3)
# ------------------------------------------------------------ elevator
def elevator_cab(open_t):
    c = Cv(40, 56)
    c.rect(2, 4, 36, 46, STL_S); c.rect(3, 5, 34, 44, STL); c.hline(3, 5, 34, STL_H)
    c.rect(4, 0, 32, 6, BRS); c.hline(4, 0, 32, BRS_H); c.hline(4, 5, 32, BRS_S)
    # dial indicator (semicircle) on the brass header
    c.ellipse(20, 6, 6, 4, CREAM); c.rect(13, 6, 14, 4, BRS)
    c.rect(6, 9, 28, 40, hx('#f3e3bd'))  # warm interior
    c.rect(6, 9, 28, 3, hx('#fff4d6')); c.rect(6, 44, 28, 5, hx('#d9c08a'))
    gap = int(open_t * 13)
    for side in (0, 1):
        x0 = 6 if side == 0 else 20 + gap
        w = 14 - gap
        if w > 0:
            c.rect(x0, 9, w, 40, hx('#c7ccd1')); c.vline(x0, 9, 40, STL_H); c.vline(x0 + w - 1, 9, 40, STL_S)
            for j in range(12, 48, 6): c.hline(x0 + 1, j, max(0, w - 2), hx('#bcc1c6'))
    c.vline(20, 9, 40, STL_S) if gap == 0 else None
    c.rect(35, 24, 2, 4, BRS); c.set(35, 25, hx('#ffb84a'))
    return c
def make_elevator():
    fr = []
    for k in range(6):
        c = Cv(44, 62); shadow_rect(c, 3, 50, 38, 6)
        cab = elevator_cab(k / 5); c.blit(cab, 2, 2)
        c.set(22, 6 + 2, INK); c.set(22 - 2 + k // 2, 5 + 2, INK)
        c.outline(0.5); fr.append(c)
    add('elevator', fr, (22, 53), fps=8, states={'closed': [0], 'opening': [0, 1, 2, 3, 4, 5], 'open': [5], 'closing': [5, 4, 3, 2, 1, 0]},
        note='door frames 0(closed)..5(open). Interior is warm-lit; people step into the doorway at anchor y-6.')
    fr = []
    for k in range(9):  # rise from the white: k=0 fully sunk, 8 fully risen
        c = Cv(44, 62)
        depth = int((8 - k) / 8 * 52)
        slot = 2 + (1 if 0 < k < 8 else 0)
        if k < 8:
            c.ellipse(22, 53, 20, slot + 1, (40, 52, 66, 60)); c.rect(3, 51, 38, 4, hx('#2a2f36')); c.hline(3, 51, 38, hx('#11151a'))
        else:
            shadow_rect(c, 3, 50, 38, 6)
        cab = elevator_cab(0); tmp = Cv(44, 62); tmp.blit(cab, 2, 2 + depth)
        crop = tmp.im.crop((0, 0, 44, 52)); c.im.alpha_composite(crop, (0, 0)); c.px = c.im.load()
        if 0 < k < 8:
            for i in range(4, 40, 3): c.set(i, 50, (255, 255, 255, 200))
        c.outline(0.5); fr.append(c)
    add('elevator_rise', fr, (22, 53), fps=10, note='frames 0 (sunk into the floor) .. 8 (risen). Play reversed to sink.')
# ------------------------------------------------------------ signage & shrine
from PIL import ImageFont, ImageDraw
FONT = '/workspace/pixel-office/game/assets/fonts/Silkscreen-Regular.ttf'
def text_px(c, x, y, s, col, size=8):
    f = ImageFont.truetype(FONT, size); tmp = Image.new('L', (len(s) * size + 8, size + 6), 0)
    ImageDraw.Draw(tmp).text((0, 0), s, fill=255, font=f)
    w = tmp.getbbox()[2] if tmp.getbbox() else 0
    px = tmp.load()
    for j in range(tmp.height):
        for i in range(tmp.width):
            if px[i, j] > 127: c.set(x + i, y + j, col)
    return w
def text_w(s, size=8):
    f = ImageFont.truetype(FONT, size); tmp = Image.new('L', (len(s) * size + 8, size + 6), 0)
    ImageDraw.Draw(tmp).text((0, 0), s, fill=255, font=f); b = tmp.getbbox(); return b[2] if b else 0
def sign(text, name, dark=False, w=None):
    tw = text_w(text); w = w or tw + 14; h = 15
    c = Cv(w + 2, h + 6)
    bg, fg, rim = (CREAM, hx('#2a3a36'), WAL_D) if not dark else (hx('#14201c'), GRN, BRS)
    c.rect(1, 1, w, h, rim); c.rect(2, 2, w - 2, h - 2, bg); c.hline(2, 2, w - 2, shade(bg, 1.1) if not dark else shade(bg, 1.4))
    c.hline(1, h + 1, w, shade(rim, 0.7))
    text_px(c, 1 + (w - tw) // 2, 2, text, fg)
    c.outline(0.5)
    add(name, c, ((w + 2) // 2, h + 5), float=True, note='floating sign: draw ~10-14px above its ground shadow (sign_shadow), bob 1px')
def make_signs():
    for i, t in enumerate(['ALIGNMENT IS ITS OWN REWARD', 'PLEASE ENJOY EACH METRIC EQUALLY', 'WE REFINE. WE ALIGN. WE ARE GRATEFUL.', 'THE NUMBERS ARE GRATEFUL FOR YOU', 'WELLNESS SESSION', 'BREAK ROOM', 'GRATITUDE ASSEMBLY']):
        sign(t, f'sign_{i}')
    sign('OUTPUT CALIBRATION', 'sign_dept_a', dark=True); sign('PRODUCT REFINEMENT', 'sign_dept_b', dark=True)
    for w in (40, 64, 96):
        c = Cv(w + 2, 21); c.rect(1, 1, w, 15, WAL_D); c.rect(2, 2, w - 2, 13, CREAM); c.hline(2, 2, w - 2, shade(CREAM, 1.1)); c.hline(1, 16, w, shade(WAL_D, 0.7)); c.outline(0.5)
        add(f'sign_blank_{w}', c, ((w + 2) // 2, 20), float=True, text_rect=[3, 3, w - 4, 11], note='blank floating sign; overlay Bevy text (Silkscreen 8px, #2a3a36) in text_rect')
    c = Cv(40, 6); c.ellipse(20, 3, 18, 2.2, (40, 52, 66, 34)); c.ellipse(20, 3, 13, 1.4, (40, 52, 66, 50)); add('sign_shadow', c, (20, 3))
    c = Cv(34, 13); c.rect(1, 1, 32, 10, INK); c.rect(2, 2, 30, 8, hx('#14201c')); c.outline(0.5); add('room_tag', c, (17, 12), float=True, text_rect=[3, 2, 28, 8], note='small dark floating room/capacity tag; overlay green text')
def make_shrine():
    fr = []
    for f in range(3):
        c = Cv(48, 60)
        shadow_rect(c, 4, 54, 40, 5)
        c.rect(6, 34, 36, 20, WAL); c.vline(41, 34, 20, WAL_S); c.rect(5, 31, 38, 4, WAL_H); c.hline(5, 34, 38, WAL_S)
        c.rect(18, 40, 12, 4, BRS); c.hline(19, 41, 10, BRS_S)
        # portrait in gilt frame
        c.rect(10, 1, 28, 30, BRS); c.rect(11, 2, 26, 28, BRS_H); c.rect(12, 3, 24, 26, BRS_S); c.rect(13, 4, 22, 24, hx('#2f4a44'))
        c.rect(15, 20, 18, 8, hx('#33343c')); c.rect(22, 20, 4, 4, CREAM); c.rect(23, 21, 2, 4, RED)  # suit, shirt, tie
        c.rect(18, 8, 12, 12, hx('#e9c29e')); c.vline(29, 9, 10, hx('#cfa680'))
        c.rect(17, 6, 14, 3, hx('#d8d4cc')); c.vline(17, 6, 7, hx('#d8d4cc')); c.vline(30, 6, 7, hx('#d8d4cc'))  # silver hair
        c.set(21, 13, INK); c.set(26, 13, INK); c.hline(20, 12, 3, hx('#8a8680')); c.hline(25, 12, 3, hx('#8a8680')); c.hline(22, 17, 4, hx('#9a5a4a'))
        c.rect(23, 14, 2, 2, hx('#d4a984'))
        # candles
        for cx in (8, 38):
            c.rect(cx, 24, 3, 8, CREAM); c.vline(cx + 2, 24, 8, shade(CREAM, 0.85))
            fl = [(0, 0), (1, 0), (0, -1)][f]
            c.set(cx + 1, 22 + fl[1], hx('#ffd36a')); c.set(cx + 1 + fl[0] - 0, 23, hx('#ff9a3a'))
        # lilies
        for (lx, ly) in [(5, 28), (40, 27)]:
            c.set(lx, ly, hx('#f6f3ea')); c.set(lx + 1, ly - 1, hx('#f6f3ea')); c.set(lx + 2, ly, hx('#f6f3ea')); c.set(lx + 1, ly + 1, hx('#3f7a4a'))
        c.outline(0.5)
        fr.append(c)
    blink = Cv(48, 60); blink.blit(fr[0], 0, 0)
    for (ex, ey) in ((21, 13), (26, 13)): blink.set(ex, ey, hx('#cfa680')); blink.set(ex - 1, ey, hx('#8a6a50')); blink.set(ex + 1, ey, hx('#8a6a50'))
    fr.append(blink)
    add('founder_shrine', fr, (24, 55), fps=6, states={'idle': [0, 1, 2], 'blink': [3]}, note='original generic founder portrait, candles flicker; frame 3 = portrait blink (show ~0.15 s, rarely)')
    # stand-alone portrait (data type 'portrait', 3x1): easel-free floating gilt frame on a brass stand
    pf = []
    for f in range(2):
        c = Cv(54, 52); shadow_rect(c, 10, 46, 34, 4)
        c.vline(26, 32, 14, BRS_S); c.vline(27, 32, 14, BRS); c.rect(20, 45, 14, 2, BRS_S)
        c.blit(fr[0 if f == 0 else 3].im.crop((10, 1, 38, 31)), 13, 2)
        c.outline(0.5); pf.append(c)
    add('portrait', pf, (27, 47), states={'idle': [0], 'blink': [1]}, footprint=[3, 1], kind='furniture', note='founder portrait on a brass stand; frame 1 = blink')
# ------------------------------------------------------------ carpet & floor
def make_tiles():
    T = {}
    base, d1, d2, rim, edge = TEAL, hx('#2b6660'), hx('#357a72'), hx('#43867c'), TEAL_D
    def tile(name, l, r, t, b):
        c = Cv(16, 16)
        for j in range(16):
            for i in range(16):
                n = (i * 37 + j * 91 + (i * j) % 7) % 13
                c.set(i, j, d1 if n == 0 else d2 if n == 5 else base)
        if t: c.hline(0, 0, 16, rim)
        if l: c.vline(0, 0, 16, rim)
        if r: c.vline(15, 0, 16, shade(base, 0.85))
        if b: c.hline(0, 14, 16, shade(base, 0.85)); c.hline(0, 15, 16, edge)
        if t and l: c.px_clear(0, 0)
        if t and r: c.px_clear(15, 0)
        if b and l: c.px_clear(0, 15)
        if b and r: c.px_clear(15, 15)
        add(name, c, (0, 0), tile=True)
    for nm, (l, r, t, b) in {'carpet_tl': (1, 0, 1, 0), 'carpet_t': (0, 0, 1, 0), 'carpet_tr': (0, 1, 1, 0), 'carpet_l': (1, 0, 0, 0), 'carpet_c': (0, 0, 0, 0),
                             'carpet_r': (0, 1, 0, 0), 'carpet_bl': (1, 0, 0, 1), 'carpet_b': (0, 0, 0, 1), 'carpet_br': (0, 1, 0, 1)}.items():
        tile(nm, l, r, t, b)
    # carpet drop shadow strip (draw under the bottom row, 1 tile lower) — subtle lift off the white
    c = Cv(16, 4); c.hline(0, 0, 16, (40, 52, 66, 46)); c.hline(0, 1, 16, (40, 52, 66, 22)); add('carpet_shadow', c, (0, 0), tile=True)
    # meeting area outline 9-slice (thin dashed hairline on white)
    oc = (150, 158, 160, 150)
    for nm, (l, r, t, b) in {'outline_tl': (1, 0, 1, 0), 'outline_t': (0, 0, 1, 0), 'outline_tr': (0, 1, 1, 0), 'outline_l': (1, 0, 0, 0), 'outline_c': (0, 0, 0, 0),
                             'outline_r': (0, 1, 0, 0), 'outline_bl': (1, 0, 0, 1), 'outline_b': (0, 0, 0, 1), 'outline_br': (0, 1, 0, 1)}.items():
        c = Cv(16, 16)
        for i in range(16):
            if i % 4 != 3:
                if t: c.set(i, 1, oc)
                if b: c.set(i, 14, oc)
                if l: c.set(1, i, oc)
                if r: c.set(14, i, oc)
        add(nm, c, (0, 0), tile=True)
    c = Cv(64, 64)
    for i in range(64): c.set(i, 0, (120, 130, 140, 16)); c.set(0, i, (120, 130, 140, 16))
    for i in range(0, 64, 16):
        for j in range(0, 64, 16): c.set(i, j, (120, 130, 140, 34))
    add('void_grid', c, (0, 0), tile=True, note='tile infinitely with alpha fading by distance from camera')
def make_lamp_cart():
    fr = []
    for on in (0, 1):
        c = Cv(12, 18); shadow(c, 2, 14, 7, 2)
        c.rect(3, 15, 6, 2, BRS_S); c.hline(3, 15, 6, BRS); c.vline(5, 6, 9, BRS); c.set(6, 5, BRS); c.set(7, 4, BRS)
        c.rect(6, 1, 5, 4, AVO); c.hline(6, 1, 5, shade(AVO, 1.25)); c.hline(7, 4, 3, hx('#fff2b0') if on else shade(AVO, 0.7))
        c.outline(0.5); fr.append(c)
    add('desk_lamp', fr, (6, 16), states={'off': [0], 'on': [1]}, note='avocado arc lamp; switch to "on" at night and add a warm additive glow (#ffd68c) under it')
    c = Cv(26, 24); shadow_rect(c, 3, 19, 21, 4)
    G1, G2 = hx('#9a9ea3'), hx('#7d8287')
    c.rect(3, 8, 18, 10, G1); c.hline(3, 8, 18, shade(G1, 1.15)); c.vline(20, 8, 10, G2); c.hline(3, 13, 18, G2)
    c.rect(5, 3, 7, 6, hx('#c7ccd1')); c.hline(5, 3, 7, hx('#e2e5e8')); c.rect(6, 4, 5, 1, hx('#8fc0e0'))  # bucket
    c.vline(15, 0, 9, WAL_S); c.rect(14, 0, 3, 1, WAL_D)  # mop handle
    c.rect(19, 4, 3, 5, hx('#f2efe6'))  # paper towels
    c.vline(22, 6, 6, STL_S); c.hline(21, 6, 3, STL_S)  # push handle
    for wx in (5, 18): c.rect(wx, 18, 2, 2, INK)
    c.outline(0.5); add('facilities_cart', c, (12, 20), note='Facilities crew push this while tidying (walk beside it)')
def build():
    make_desk(); make_pod(); make_crt(); make_phone(); make_chairs(); make_cabinet(); make_plants(); make_tables(); make_coffee(); make_elevator(); make_signs(); make_shrine(); make_tiles(); make_lamp_cart()
    return P
