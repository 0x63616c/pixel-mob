from common import *
from props import add, P, INK, GRN, ORNG, MUST, TEAL, CREAM, RED, BRS, text_px
# ------------------------------------------------------------ goat (24x24 cells)
GW, GH = 24, 24
GOAT_FOOT = (12, 21)
def goat_frame(anim, d, f):
    if d == 'W':
        c = goat_frame(anim, 'E', f); c.im = c.im.transpose(Image.FLIP_LEFT_RIGHT); c.px = c.im.load(); return c
    c = Cv(GW, GH)
    W_, w_, g_, k_, h_, p_ = hx('#f3f0e8'), hx('#d3cdbf'), hx('#8d877c'), hx('#3b352e'), hx('#b39a72'), hx('#e7a9a0')
    bob = [0, -1, 0, -1][f] if anim == 'walk' else 0
    chew = anim == 'idle' and f in (1, 3)
    if d == 'E':
        y0 = 11 + bob
        c.rect(4, y0, 13, 5, W_); c.hline(5, y0 + 5, 11, w_); c.hline(5, y0, 11, hx('#fbf9f4')); c.set(3, y0, w_); c.set(2, y0 - 1, W_)  # body + tail
        # legs
        st = [(1, -1), (0, 0), (-1, 1), (0, 0)][f] if anim == 'walk' else (0, 0)
        for lx, o in ((5, st[0]), (7, st[1]), (14, st[1]), (16, st[0])):
            c.vline(lx + o, y0 + 5, 4 - (1 if lx in (7, 14) else 0) + 1, w_ if lx in (7, 14) else W_)
            c.set(lx + o, 21 if lx not in (7, 14) else 20, k_)
        # neck + head
        hy = y0 - 5 + (1 if chew else 0)
        c.rect(15, y0 - 2, 3, 3, W_)
        c.rect(15, hy, 5, 4, W_); c.rect(19, hy + 1, 2, 2, W_); c.set(20, hy + 2, p_); c.set(17, hy + 1, k_)
        c.set(15, hy + 1, w_); c.set(14, hy + 1, W_)  # ear
        c.set(16, hy - 1, h_); c.set(15, hy - 2, h_); c.set(14, hy - 2, h_)  # horn
        c.vline(19, hy + 4, 2 if not chew else 1, g_)  # beard
        if chew: c.set(20, hy + 3, w_)
        c.set(16, y0 - 1, hx('#2c3e63')); c.set(17, y0, hx('#2c3e63')); c.rect(17, y0 + 1, 2, 2, hx('#f6f3ea')); c.set(18, y0 + 2, hx('#2f6f68'))
    else:
        y0 = 10 + bob
        c.rect(8, y0 + 1, 8, 6, W_ if d == 'N' else w_); c.hline(8, y0 + 6, 8, w_)
        st = [1, 0, -1, 0][f] if anim == 'walk' else 0
        for lx, o in ((8, st), (14, -st)):
            c.vline(lx + 1, y0 + 7, 4 - max(0, o), W_); c.set(lx + 1, y0 + 10 - max(0, o) + 1, k_)
        if d == 'S':
            hy = y0 - 4 + (1 if chew else 0)
            c.rect(9, hy, 6, 6, W_); c.rect(10, hy + 5, 4, 2, W_); c.hline(10, hy + 6, 4, p_)
            c.set(10, hy + 2, k_); c.set(13, hy + 2, k_); c.set(7, hy + 1, W_); c.set(16, hy + 1, W_); c.set(8, hy + 1, w_); c.set(15, hy + 1, w_)
            c.set(9, hy - 1, h_); c.set(14, hy - 1, h_); c.set(8, hy - 2, h_); c.set(15, hy - 2, h_)
            c.vline(12, hy + 7, 2, g_); c.set(11, hy + 7, g_)
            c.set(10, hy + 7, hx('#2c3e63')); c.set(14, hy + 7, hx('#2c3e63')); c.rect(13, hy + 8, 2, 2, hx('#f6f3ea')); c.set(14, hy + 9, hx('#2f6f68'))
        else:
            hy = y0 - 3
            c.rect(9, hy, 6, 5, w_); c.set(9, hy - 1, h_); c.set(14, hy - 1, h_); c.set(8, hy - 2, h_); c.set(15, hy - 2, h_); c.set(7, hy + 1, W_); c.set(16, hy + 1, W_)
            c.set(12, y0 + 7, w_); c.set(11, y0 + 6, W_)
    c.outline(0.5)
    return c
GOAT_ANIMS = [('idle', 4, 3), ('walk', 4, 7)]
def corgi_frame(anim, d, f, look=None):
    if d == 'W':
        c = corgi_frame(anim, 'E', f, look); c.im = c.im.transpose(Image.FLIP_LEFT_RIGHT); c.px = c.im.load(); return c
    look = look or {}
    c = Cv(GW, GH); B = hx(look.get('body', '#d79a52')); Bs = shade(B, 0.8); Wt = hx(look.get('spots', '#f3e6cf')); K = hx('#2a211c'); col = hx(look.get('collar', '#c0392b'))
    bob = [0, -1, 0, -1][f] if anim == 'walk' else 0; wag = f % 2
    if d == 'E':
        y0 = 14 + bob
        c.rect(5, y0, 12, 4, B); c.hline(6, y0 + 4, 10, Wt); c.hline(6, y0, 10, shade(B, 1.12))
        st = [(1, -1), (0, 0), (-1, 1), (0, 0)][f] if anim == 'walk' else (0, 0)
        for lx, o in ((6, st[0]), (8, st[1]), (14, st[1]), (16, st[0])):
            c.vline(lx + o, y0 + 4, 2, Wt if lx in (6, 16) else shade(Wt, 0.85)); c.set(lx + o, 20, Wt)
        c.set(4, y0 - 1 - wag, B); c.set(4, y0, B)  # tail stub wag
        hy = y0 - 5 + (0 if anim == 'walk' else (1 if f == 2 else 0))
        c.rect(14, hy, 6, 5, B); c.rect(18, hy + 2, 3, 2, Wt); c.set(21, hy + 2, K); c.set(17, hy + 1, K)
        c.set(14, hy - 1, B); c.set(15, hy - 2, B); c.set(16, hy - 1, Bs); c.set(17, hy - 2, B)  # ears
        c.hline(15, hy + 5, 3, col)
        if anim == 'idle' and f in (1, 3): c.set(20, hy + 4, hx('#e88f86'))  # tongue / pant
    else:
        y0 = 13 + bob
        c.rect(8, y0, 8, 6, B if d == 'N' else Bs); c.rect(10, y0 + 1, 4, 4, Wt if d == 'S' else B)
        st = [1, 0, -1, 0][f] if anim == 'walk' else 0
        for lx, o in ((8, st), (14, -st)):
            c.rect(lx + 1, y0 + 6, 1, 2 - max(0, o), Wt); c.set(lx + 1, 20 - max(0, o), Wt)
        hy = y0 - 6
        if d == 'S':
            c.rect(9, hy, 6, 6, B); c.rect(10, hy + 3, 4, 3, Wt); c.set(11, hy + 4, K); c.set(12, hy + 4, K); c.set(10, hy + 2, K); c.set(13, hy + 2, K)
            c.set(8, hy - 1, B); c.set(8, hy - 2, B); c.set(15, hy - 1, B); c.set(15, hy - 2, B); c.set(9, hy - 1, Bs); c.set(14, hy - 1, Bs)
            c.hline(10, hy + 6, 4, col)
        else:
            c.rect(9, hy, 6, 6, B); c.set(8, hy - 1, B); c.set(8, hy - 2, B); c.set(15, hy - 1, B); c.set(15, hy - 2, B); c.hline(10, hy + 5, 4, col)
            c.set(12, y0 + 6 - wag, B)
    c.outline(0.5)
    return c
def corgi_sheet(look=None):
    rows = [(a, d) for a, n, fps in GOAT_ANIMS for d in ('S', 'N', 'E', 'W')]
    im = Image.new('RGBA', (GW * 4, GH * len(rows)), (0, 0, 0, 0))
    for r, (a, d) in enumerate(rows):
        for f in range(4): im.alpha_composite(corgi_frame(a, d, f, look).im, (f * GW, r * GH))
    return im, rows
def goat_sheet():
    rows = [(a, d) for a, n, fps in GOAT_ANIMS for d in ('S', 'N', 'E', 'W')]
    im = Image.new('RGBA', (GW * 4, GH * len(rows)), (0, 0, 0, 0))
    for r, (a, d) in enumerate(rows):
        for f in range(4): im.alpha_composite(goat_frame(a, d, f).im, (f * GW, r * GH))
    return im, rows
# ------------------------------------------------------------ emotes (13x13 badges)
EM = {
 'exclaim': (RED, ['....X....', '....X....', '....X....', '....X....', '....X....', '.........', '....X....']),
 'question': (hx('#2f6f68'), ['..XXXX...', '.X....X..', '......X..', '....XX...', '....X....', '.........', '....X....']),
 'zzz': (hx('#5a6fa0'), ['..XXXX...', '....X....', '...X.....', '..XXXX...', '......XXX', '.......X.', '......XXX']),
 'heart': (hx('#d0485a'), ['.XX.XX...', 'XXXXXXX..', 'XXXXXXX..', '.XXXXX...', '..XXX....', '...X.....']),
 'coffee': (hx('#7a4a2a'), ['..X.X....', '.X.X.....', '.........', 'XXXXXX...', 'XXXXX.X..', 'XXXXXX...', '.XXXX....']),
 'party': (MUST, ['X..X..X..', '.X.X.X...', '..XXX....', 'XXXXXXX..', '..XXX....', '.X.X.X...', 'X..X..X..']),
 'skull': (hx('#3a3540'), ['.XXXXX...', 'XXXXXXX..', 'X..X..X..', 'XXXXXXX..', '.XX.XX...', '.X.X.X...']),
 'angry': (RED, ['X.....X..', '.X...X...', '.........', '..XXX....', '.X...X...', 'X.....X..']),
 'sweat': (hx('#4a8ac0'), ['...X.....', '..XXX....', '.XXXXX...', '.XXXXX...', '..XXX....']),
 'idea': (MUST, ['..XXX....', '.XXXXX...', '.XXXXX...', '..XXX....', '..X.X....', '..XXX....']),
 'eyes': (INK, ['.XX..XX..', 'X..XX..X.', 'X.XXX.XX.', '.XX..XX..']),
 'music': (hx('#6a4a9a'), ['..XXXX...', '..X..X...', '..X..X...', '..X..X...', 'XX.XX....', 'XX.XX....']),
 'numbers': (hx('#2c8a55'), ['X.XX.XXX.', 'X...X..X.', 'X.XX..X..', 'X.X...X..', 'X.XXX.X..']),
 'check': (hx('#2c8a55'), ['.......X.', '......X..', '.....X...', 'X...X....', '.X.X.....', '..X......']),
 'dots': (INK, ['.........', '.........', 'X..X..X..']),
 'sparkle': (MUST, ['...X.....', '...X.....', '.XXXXX...', '...X.....', '...X.....']),
 'goat': (hx('#8d877c'), ['X.....X..', '.X...X...', '.XXXXX...', '.X.X.X...', '.XXXXX...', '..XXX....', '...X.....']),
 'melon': (hx('#d0485a'), ['XXXXXXX..', '.X.X.XX..', '..XXXX...', '...XX....']),
 'waffle': (hx('#b07a2a'), ['XXXXXXX..', 'X.X.X.X..', 'XXXXXXX..', 'X.X.X.X..', 'XXXXXXX..']),
 'alarm': (RED, ['..XXX....', '.XXXXX...', '.XX.XX...', '.XXXXX...', 'XXXXXXX..']),
}
def make_emotes():
    names = list(EM.keys())
    for nm in names:
        col, rows = EM[nm]
        fr = []
        c = Cv(15, 17)
        c.rrect(1, 1, 13, 12, hx('#fbf8ef'), 2); c.hline(3, 12, 9, hx('#e6e0d0'))
        c.set(5, 13, hx('#fbf8ef')); c.set(6, 13, hx('#fbf8ef')); c.set(5, 14, hx('#fbf8ef'))  # tail
        h = len(rows); w = max(len(r) for r in rows)
        oy = 1 + (12 - h) // 2; ox = 1 + (13 - 7) // 2
        c.mask(ox, oy, rows, {'X': col})
        c.outline(tint=hx('#2a2622'))
        add('emote_' + nm, c, (5, 16), note='emote badge, pop above head (anchor = tail tip)')
    return names
# ------------------------------------------------------------ bubbles (9-slice) + UI bits
def make_ui():
    # speech bubble 9-slice: 15x15 source, slice=5px
    for nm, bg, line in [('bubble', hx('#fbf8ef'), hx('#2a2622')), ('bubble_memo', hx('#0e1a16'), GRN), ('bubble_whisper', hx('#e9eef0'), hx('#7d8a90'))]:
        c = Cv(15, 15); c.rrect(0, 0, 15, 15, line, 2); c.rrect(1, 1, 13, 13, bg, 2)
        c.set(1, 1, line); c.set(13, 1, line); c.set(1, 13, line); c.set(13, 13, line)
        c.hline(2, 13, 11, shade(bg, 0.9) if nm != 'bubble_memo' else bg)
        add(nm, c, (0, 0), slice=5, note='9-slice: 5px border on all sides. Text Silkscreen 8px (or VT323 16px) colour = border colour.')
        t = Cv(7, 5)
        t.mask(0, 0, ['XBBBBBX', '.XBBBX.', '..XBX..', '...X...'], {'X': line, 'B': bg})
        if nm == 'bubble_whisper': t = Cv(7, 7); t.ellipse(2.5, 2, 1.8, 1.6, line); t.ellipse(2.5, 2, 1.0, 0.8, bg); t.set(5, 5, line)
        add(nm + '_tail', t, (3, 4), note='draw centred under the bubble, overlapping its bottom border by 1px')
    # thought-dot / ellipsis typing indicator (3 frames)
    fr = []
    for f in range(3):
        c = Cv(17, 9); c.rrect(0, 0, 17, 9, hx('#2a2622'), 2); c.rrect(1, 1, 15, 7, hx('#fbf8ef'), 2)
        for k in range(3): c.rect(4 + k * 4, 4 - (1 if k == f else 0), 2, 2, hx('#2a2622'))
        fr.append(c)
    add('bubble_typing', fr, (8, 9), fps=6)
    # shadows for actors
    c = Cv(14, 5); c.ellipse(7, 2.5, 6.5, 2.2, (40, 52, 66, 30)); c.ellipse(7, 2.5, 5, 1.6, (40, 52, 66, 62)); add('shadow_person', c, (7, 2), note='draw at the foot point under every walking person (not when seated)')
    c = Cv(16, 5); c.ellipse(8, 2.5, 7.5, 2.2, (40, 52, 66, 30)); c.ellipse(8, 2.5, 6, 1.6, (40, 52, 66, 60)); add('shadow_goat', c, (8, 2))
    c = Cv(10, 4); c.ellipse(5, 2, 4.5, 1.8, (40, 52, 66, 50)); add('shadow_small', c, (5, 2))
    # selection ring (2 frames)
    fr = []
    for f in range(2):
        c = Cv(20, 9)
        for a in range(0, 360, 12):
            if (a // 24 + f) % 2 == 0:
                import math
                x = 10 + 8.8 * math.cos(math.radians(a)); y = 4.5 + 3.4 * math.sin(math.radians(a))
                c.set(int(x), int(y), GRN)
        fr.append(c)
    add('select_ring', fr, (10, 4), fps=4)
    # zzz effect
    fr = []
    for f in range(4):
        c = Cv(12, 14)
        for k in range(3):
            t = (f + k * 1.33) % 4
            y = int(12 - t * 3); x = int(2 + t * 2 + (k % 2)); a = int(230 - t * 50)
            sz = 2 + (1 if t > 2 else 0)
            col = (90, 111, 160, max(60, a))
            c.hline(x, y - sz, sz + 1, col); c.set(x + sz - 1, y - sz + 1, col); c.hline(x, y, sz + 1, col)
        fr.append(c)
    add('fx_zzz', fr, (2, 13), fps=3)
    # confetti burst (6 frames, 32x32)
    import random
    rng = random.Random(3); parts = [(rng.uniform(-1, 1), rng.uniform(-1.6, -0.4), rng.choice([MUST, ORNG, TEAL, hx('#d0485a'), hx('#7cc4b0'), hx('#6a4a9a')])) for _ in range(26)]
    fr = []
    for f in range(8):
        c = Cv(40, 40)
        for vx, vy, col in parts:
            t = f / 7 * 1.0; x = 20 + vx * 16 * t * 1.4; y = 26 + vy * 18 * t + 26 * t * t
            c.set(int(x), int(y), col)
            if f % 2 == 0: c.set(int(x) + 1, int(y), shade(col, 0.8))
        fr.append(c)
    add('fx_confetti', fr, (20, 28), fps=12, loop=False)
    fr = []
    for f in range(4):  # sparkle
        c = Cv(9, 9); s = [1, 3, 2, 0][f]; col = (255, 230, 140, 255)
        c.set(4, 4, (255, 255, 255, 255))
        for k in range(1, s + 1): c.set(4 + k, 4, col); c.set(4 - k, 4, col); c.set(4, 4 + k, col); c.set(4, 4 - k, col)
        fr.append(c)
    add('fx_sparkle', fr, (4, 4), fps=10)
    fr = []
    for f in range(4):  # steam / smoke puff
        c = Cv(10, 14)
        for k in range(3):
            t = (f + k) % 4; c.ellipse(5 + (1 if (t + k) % 2 else -1), 12 - t * 3, 1.4 + t * 0.4, 1.2 + t * 0.3, (230, 232, 236, 200 - t * 45))
        fr.append(c)
    add('fx_steam', fr, (5, 13), fps=5)
    # vignette (256x256 radial, alpha only) - stretch to screen
    c = Cv(256, 256)
    for j in range(256):
        for i in range(256):
            d = (((i - 127.5) / 128) ** 2 + ((j - 127.5) / 128) ** 2) ** 0.5
            a = max(0, min(1, (d - 0.55) / 0.6)) ** 1.6
            c.px[i, j] = (150, 160, 170, int(a * 70))
    c.im.save('/workspace/pixel-office/game/assets/art/vignette.png')
    # flashlight cone (pointing E, 48x24); other dirs rotated. anchor = hand point
    import math
    c = Cv(48, 25)
    for j in range(25):
        for i in range(48):
            dy = abs(j - 12); spread = 2 + i * 0.22
            if dy <= spread:
                a = (1 - i / 48) * (1 - (dy / spread) ** 2)
                c.px[i, j] = (255, 236, 160, int(min(1, a) * 90))
    add('fx_flashlight_E', c, (0, 12), note='additive-ish warm cone, draw over the floor in front of the Floor Supervisor at night')
    w = Cv(48, 25); w.im = c.im.transpose(Image.FLIP_LEFT_RIGHT); w.px = w.im.load(); add('fx_flashlight_W', w, (47, 12))
    sC = Cv(25, 48); sC.im = c.im.transpose(Image.ROTATE_270); sC.px = sC.im.load(); add('fx_flashlight_S', sC, (12, 0))
    n = Cv(25, 48); n.im = c.im.transpose(Image.ROTATE_90); n.px = n.im.load(); add('fx_flashlight_N', n, (12, 47))
    c = Cv(4, 4); c.hline(0, 1, 4, (0, 0, 0, 60)); c.hline(0, 3, 4, (0, 0, 0, 60)); add('scanlines', c, (0, 0), tile=True, note='tile over CRT/memo UI panels only')
    # memo panel 9-slice (green on black terminal)
    c = Cv(15, 15); c.rect(0, 0, 15, 15, hx('#0b1511')); c.rect(1, 1, 13, 13, hx('#0e1a16'))
    c.hline(2, 2, 11, hx('#2c8a55')); c.hline(2, 12, 11, hx('#2c8a55')); c.vline(2, 2, 11, hx('#2c8a55')); c.vline(12, 2, 11, hx('#2c8a55'))
    add('panel_memo', c, (0, 0), slice=5, note='9-slice panel, green hairline inset. Use with VT323 text #7cf2a0')
    c = Cv(15, 15); c.rect(0, 0, 15, 15, hx('#8f8266')); c.rect(1, 1, 13, 13, hx('#d9cdaf')); c.hline(1, 1, 13, hx('#ece4cd')); c.vline(1, 1, 13, hx('#ece4cd')); c.hline(1, 13, 13, hx('#b8aa89')); c.vline(13, 1, 13, hx('#b8aa89'))
    add('panel_beige', c, (0, 0), slice=5, note='9-slice beige plastic panel (buttons, inspector frame)')
def build():
    make_emotes(); make_ui()
