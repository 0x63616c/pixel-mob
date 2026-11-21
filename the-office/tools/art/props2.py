"""Expansion + polish props (round 2). Furniture keyed by company.json `type` (hyphenated).
Furniture convention: anchor = bottom-centre of the floor footprint, i.e. world px ((x + w/2)*16, (y + h)*16)."""
from common import *
import random, math
from props import add, P, WAL, WAL_H, WAL_S, WAL_D, WAL_G, BEI, BEI_H, BEI_S, BEI_D, SCR, GRN, GRN_D, GRN_M, STL, STL_H, STL_S, BRS, BRS_H, BRS_S, TEAL, TEAL_D, MUST, ORNG, AVO, CREAM, RED, INK, desk_surface, crt_screen
import tinyfont
SEA, MINT, DEEP, AQUA, BLUEG, MOSS = hx('#4f9a8a'), hx('#9fd6c2'), hx('#1f4a42'), hx('#cfe8e0'), hx('#6f8a96'), hx('#5d7f4a')
SHC = (34, 46, 60)
def soft_shadow(c, x, y, w, h, strength=1.0, off=(2, 2)):
    """3-step soft drop shadow (light from upper-left), rounded. draw BEFORE the object"""
    x += off[0]; y += off[1]
    for k, a in ((3, 14), (2, 22), (1, 34), (0, 48)):
        c.rrect(int(x - k), int(y - k + 1), int(w + 2 * k), int(h + 2 * k - 1), SHC + (int(a * strength),), 2 if k else 1)
def box(c, x, y, w, d, z, top, front, side=None, rim=True):
    """3/4 box: floor footprint (x,y,w,d), height z. top face drawn at y-z."""
    c.rect(x, y - z, w, d, top)
    c.rect(x, y + d - z, w, z, front)
    if rim: c.hline(x, y - z, w, shade(top, 1.12)); c.hline(x, y + d - 1, w, shade(front, 0.78))
    if side: c.vline(x + w - 1, y + d - z, z, side)
def furn(name, w, h, lift, draw, frames=1, states=None, pad=3, **meta):
    W, H = w * 16, h * 16
    fr = []
    for f in range(frames):
        c = Cv(W + pad * 2 + 2, H + lift + pad * 2 + 2)
        draw(c, pad, lift + pad, W, H, f)
        c.outline(0.5)
        fr.append(c)
    m = dict(footprint=[w, h], kind='furniture'); m.update(meta)
    if states: m['states'] = states
    add(name, fr, (pad + W // 2, lift + pad + H), **m)

# ================================================================ NEEDS-ART
def ping_pong(c, x, y, W, H, f):
    soft_shadow(c, x + 2, y + 6, W - 4, H - 8)
    tx, ty, tw, td, z = x + 2, y + 6, W - 4, H - 14, 8
    for lx in (tx + 4, tx + tw - 6): c.rect(lx, ty + td - 2, 2, z + 2, STL_S)
    c.rect(tx + tw // 2 - 8, ty + td - 2, 16, 2, STL_S)
    box(c, tx, ty + z, tw, td, z, hx('#2f6a52'), hx('#21493a'))
    top = ty
    c.hline(tx + 1, top + 1, tw - 2, hx('#e9efe8')); c.hline(tx + 1, top + td - 2, tw - 2, hx('#e9efe8'))
    c.vline(tx + 1, top + 1, td - 2, hx('#e9efe8')); c.vline(tx + tw - 2, top + 1, td - 2, hx('#e9efe8'))
    c.hline(tx + 2, top + td // 2, tw - 4, hx('#9cc4b0'))
    nx = tx + tw // 2
    c.vline(nx, top - 3, td + 3, hx('#f6f3ea')); c.vline(nx + 1, top - 2, td + 2, hx('#bfc6c0'))
    c.rect(nx - 1, top - 4, 3, 2, STL_S); c.rect(nx - 1, top + td - 2, 3, 2, STL_S)
    # paddles + ball
    for (px, py, col) in ((tx + 12, top + 6, RED), (tx + tw - 18, top + td - 10, INK)):
        c.ellipse(px + 3, py + 3, 3.2, 2.8, col); c.rect(px + 5, py + 5, 3, 2, WAL)
    bx = tx + 30 + (f * 9) % 36; by = top + 6 + abs((f % 4) - 2) * 3
    c.set(bx, by, hx('#ffffff')); c.set(bx + 1, by, hx('#ffffff')); c.set(bx, by + 1, hx('#e8e4d8'))
def vending(c, x, y, W, H, f):
    soft_shadow(c, x + 1, y + H - 18, W - 2, 16)
    mx, my, mw = x + 1, y + H - 4, W - 2
    z = 46; d = 12
    box(c, mx, my - d, mw, d, z, shade(DEEP, 1.25), DEEP, shade(DEEP, 0.8))
    fx0, fy0 = mx, my - z
    c.rect(fx0 + 3, fy0 + 4, 18, 26, hx('#0f2a26'))  # coil window
    cols = [ORNG, MUST, RED, MINT, CREAM, SEA, hx('#d0485a'), AVO]
    for r in range(4):
        c.hline(fx0 + 3, fy0 + 10 + r * 6, 18, STL_S)
        for k in range(4): c.rect(fx0 + 4 + k * 4, fy0 + 6 + r * 6, 3, 4, cols[(r * 3 + k) % 8])
    c.vline(fx0 + 4, fy0 + 5, 24, (255, 255, 255, 60))
    for k in range(5):
        lit = (k + f) % 5 == 0
        c.rect(fx0 + 23, fy0 + 6 + k * 4, 5, 2, GRN if lit else GRN_D)
    c.rect(fx0 + 23, fy0 + 27, 5, 3, INK); c.set(fx0 + 25, fy0 + 28, BRS)
    c.rect(fx0 + 3, fy0 + 33, 18, 5, INK); c.hline(fx0 + 4, fy0 + 34, 16, hx('#2a2f36'))
    c.rect(fx0, fy0 + 1, mw, 2, MUST); tinyfont.draw(c, fx0 + 4, fy0 - 5, 'SNACK', MINT) if False else None
FISH = {  # id: (body, accent, len, height)
    'gerald': (hx('#7d8a9a'), hx('#4a5566'), 8, 5), 'pamela': (hx('#f08a3a'), hx('#ffd27a'), 7, 5), 'steve': (hx('#e8d24a'), INK, 6, 4),
    'the-intern': (hx('#4ae0d0'), hx('#e04a7a'), 4, 2), 'muriel': (hx('#8a6a4a'), hx('#c9a77a'), 7, 3), 'dot': (hx('#f6f3ea'), RED, 3, 2)}
def fish_px(c, x, y, fid, f, flip=False):
    b, a, L, Hh = FISH[fid]
    pts = []
    for i in range(L):
        t = i / max(1, L - 1); hh = max(1, round(Hh * math.sin(math.pi * (0.15 + 0.85 * t)) ** 0.7))
        for j in range(hh): pts.append((i, j - hh // 2, b if not (fid == 'steve' and i % 3 == 1) else a))
    tail = [(-1, -1), (-1, 1), (-2, -2 if f % 2 else -1), (-2, 2 if f % 2 else 1), (-1, 0)]
    for (i, j) in tail: pts.append((i, j, a))
    pts.append((L - 2, -1 if Hh > 2 else 0, INK))
    if fid == 'pamela': pts += [(L // 2, -Hh // 2 - 1, a)]
    if fid == 'gerald': pts += [(L - 1, 1, hx('#b9c0c9'))]
    for (i, j, col) in pts:
        c.set(x + (-i if flip else i), y + j, col)
def aquarium(c, x, y, W, H, f, night=False):
    soft_shadow(c, x + 2, y + H - 14, W - 4, 12)
    sx, sw = x + 2, W - 4
    standz, d = 12, 10
    box(c, sx, y + H - 2 - d, sw, d, standz, WAL_H, WAL, WAL_S)
    for k in range(3): c.rect(sx + 10 + k * 40, y + H - 2 - standz + 3, 20, 1, BRS)
    tz = 40; tb = y + H - 2 - d - standz  # tank floor line (front bottom)
    tt = tb - tz
    c.rect(sx + 1, tt - 3, sw - 2, 3, INK); c.hline(sx + 1, tt - 3, sw - 2, hx('#3a3f46'))  # lid
    water_top, water_bot = (hx('#3d8f9a'), hx('#1b4f5c')) if not night else (hx('#5ac0c8'), hx('#1f5f70'))
    for j in range(tz):
        c.hline(sx + 1, tt + j, sw - 2, lerp(water_top, water_bot, j / tz))
    c.hline(sx + 1, tt, sw - 2, (230, 250, 250, 160))
    c.rect(sx + 1, tb - 5, sw - 2, 5, hx('#d9c9a0')); c.hline(sx + 1, tb - 5, sw - 2, hx('#e8dcb8'))
    for i in range(sx + 2, sx + sw - 2, 3): c.set(i, tb - 3 + (i % 2), hx('#b8a67a'))
    # castle
    cx = sx + 86
    c.rect(cx, tb - 18, 14, 13, hx('#8a8f96')); c.rect(cx + 4, tb - 24, 6, 6, hx('#8a8f96'))
    for k in range(4): c.set(cx + k * 4, tb - 19, hx('#8a8f96')); c.set(cx + 4 + k * 2, tb - 25, hx('#8a8f96')) if k < 3 else None
    c.rect(cx + 5, tb - 10, 4, 5, hx('#2a3038')); c.set(cx + 6, tb - 21, hx('#2a3038')); c.vline(cx + 13, tb - 18, 13, hx('#6a6f76'))
    # plants sway
    for px, hgt in ((sx + 8, 22), (sx + 14, 15), (sx + 50, 18), (sx + 110, 24), (sx + 116, 14)):
        for j in range(hgt):
            sw_ = round(math.sin(j * 0.5 + f * 0.8 + px) * (j / hgt) * 1.6)
            c.set(px + sw_, tb - 5 - j, hx('#3f8a4a') if j % 3 else hx('#5aaa5a'))
    # fish (baked loop)
    order = ['gerald', 'pamela', 'steve', 'the-intern', 'muriel', 'dot']
    for k, fid in enumerate(order):
        speed = [0.6, 1.0, 1.4, 2.0, 0.4, 1.7][k]; span = sw - 16
        pos = (f * speed * 4 + k * 37) % (2 * span); flip = pos > span
        fx_ = sx + 8 + (span - (pos - span) if flip else pos)
        fy_ = tt + 8 + k * 5 + round(math.sin(f * 0.8 + k) * 1)
        if fid == 'muriel': fy_ = tb - 8
        fish_px(c, int(fx_), int(fy_), fid, f, flip)
    # bubbles
    for k, bx in enumerate((sx + 92, sx + 93, sx + 30)):
        for b in range(3):
            by = tb - 8 - ((f * 3 + b * 11 + k * 5) % (tz - 8))
            c.set(bx + (b % 2), by, (220, 250, 255, 230 if night else 190))
    # glass highlights & frame
    c.vline(sx + 1, tt, tz, (255, 255, 255, 90)); c.vline(sx + 4, tt + 2, 10, (255, 255, 255, 120)); c.vline(sx + 5, tt + 2, 6, (255, 255, 255, 80))
    c.vline(sx, tt - 1, tz + 1, STL_S); c.vline(sx + sw - 1, tt - 1, tz + 1, STL_S); c.hline(sx, tb, sw, STL_S)
    c.rect(sx + 4, tt - 3, 18, 1, (180, 255, 230, 255) if night else hx('#c9d6d0'))
def fish_food_shelf(c, x, y, W, H, f):
    soft_shadow(c, x + 2, y + H - 12, W - 4, 10)
    box(c, x + 2, y + H - 10, W - 4, 8, 22, WAL_H, WAL, WAL_S)
    sy = y + H - 2 - 22
    c.hline(x + 3, sy + 11, W - 6, WAL_D)
    c.rect(x + 6, sy - 6, 8, 9, MUST); c.rect(x + 6, sy - 7, 8, 2, STL); c.rect(x + 7, sy - 3, 6, 3, CREAM); tinyfont.draw(c, x + 7, sy - 3, '', INK)
    c.set(x + 8, sy - 2, INK); c.set(x + 10, sy - 2, INK); c.set(x + 12, sy - 2, INK)
    c.rect(x + 17, sy - 2, 6, 3, STL); c.hline(x + 22, sy - 3, 5, STL_S)  # scoop
    for k, col in enumerate((TEAL, SEA, ORNG, MUST)): c.rect(x + 5 + k * 3, sy + 3, 2, 7, col)
    c.rect(x + 20, sy + 5, 6, 5, CREAM); c.hline(x + 20, sy + 5, 6, shade(CREAM, 1.1))
def nap_pod(c, x, y, W, H, f, occupied=False):
    soft_shadow(c, x + 1, y + 6, W - 2, H - 6)
    shell, shell_s, inner = hx('#f2efe8'), hx('#cfcac0'), hx('#2f6f68')
    c.ellipse(x + W / 2, y + 16, W / 2 - 1, 14, shell_s); c.ellipse(x + W / 2, y + 15, W / 2 - 1, 14, shell)
    c.ellipse(x + W / 2, y + 17, W / 2 - 5, 10, inner); c.ellipse(x + W / 2, y + 15, W / 2 - 6, 8, shade(inner, 1.2))
    c.ellipse(x + W / 2, y + 20, W / 2 - 7, 5, hx('#e9e4d8'))  # mattress
    c.rect(x + 6, y + 12, 8, 4, CREAM); c.hline(x + 6, y + 12, 8, hx('#ffffff'))  # pillow
    if occupied:
        c.ellipse(x + W / 2 + 3, y + 20, 9, 4, hx('#4f9a8a')); c.hline(x + 8, y + 18, 18, hx('#6ab0a0'))  # blanket
        c.ellipse(x + 10, y + 15, 3, 3, hx('#3a2a1e')); c.set(x + 11, y + 16, hx('#e9bc94')); c.set(x + 12, y + 16, hx('#e9bc94'))
    c.rect(x + 2, y + 26, W - 4, 3, shell_s); c.hline(x + 2, y + 26, W - 4, shell)
    c.set(x + W - 5, y + 9, GRN if not occupied else hx('#ffb067'))
def mystery_door(c, x, y, W, H, f):
    soft_shadow(c, x + 6, y + H - 6, W - 10, 5, 0.8)
    dx, dw, top = x + 7, W - 14, y + H - 4 - 40
    c.rect(dx - 2, top - 2, dw + 4, 42, hx('#ffffff')); c.vline(dx + dw + 1, top - 2, 42, hx('#ecebe8'))
    c.rect(dx, top, dw, 38, hx('#fdfdfc'))
    gap = 2 + f
    c.rect(dx + dw - gap, top, gap, 38, hx('#0b0d10'))
    c.vline(dx + dw - gap - 1, top, 38, hx('#e4e3df'))
    c.set(dx + dw - gap - 3, top + 20, hx('#d8d4cc')); c.set(dx + dw - gap - 3, top + 21, hx('#b8b4ac'))
    c.hline(dx - 2, y + H - 4, dw + 4, hx('#e9e8e4'))
def fence(kind):
    def d(c, x, y, W, H, f):
        wood, wood_s, wood_h = hx('#c9b48a'), hx('#9a845a'), hx('#e2d2aa')
        if kind in ('h', 'post'):
            soft_shadow(c, x, y + H - 6, W, 3, 0.7)
        if kind == 'h':
            for py in (y + H - 14, y + H - 8): c.rect(x, py, W, 2, wood); c.hline(x, py, W, wood_h)
            for px in (x, x + W - 2): c.rect(px, y + H - 18, 2, 16, wood_s); c.set(px, y + H - 18, wood_h)
        elif kind == 'v':
            soft_shadow(c, x + 6, y, 4, H, 0.7)
            c.rect(x + 7, y - 10, 2, H + 6, wood); c.vline(x + 7, y - 10, H + 6, wood_h); c.rect(x + 9, y - 6, 1, H + 2, wood_s)
            for py in (y - 12, y + H - 18): c.rect(x + 6, py, 4, 4, wood_s)
        else:
            c.rect(x + 6, y + H - 20, 4, 18, wood_s); c.rect(x + 6, y + H - 20, 4, 2, wood_h); c.set(x + 7, y + H - 21, wood_h)
    return d
def hay(c, x, y, W, H, f):
    soft_shadow(c, x + 1, y + H - 10, W - 2, 8)
    z = 9; bx, bw, bd = x + 1, W - 2, 8
    box(c, bx, y + H - 2 - bd, bw, bd, z, hx('#e3c46a'), hx('#c9a54a'), hx('#a8873a'))
    rng = random.Random(W)
    for _ in range(W * 3):
        i = rng.randrange(bx, bx + bw); j = rng.randrange(y + H - 2 - bd - z, y + H - 2)
        c.set(i, j, hx('#f0d88a') if rng.random() < .5 else hx('#b8933a'))
    for k in range(1, 3): c.vline(bx + bw * k // 3, y + H - 2 - bd - z, bd + z, hx('#8a6a2a'))
def goat_bed(c, x, y, W, H, f):
    soft_shadow(c, x + 2, y + 8, W - 4, H - 10, 0.6)
    c.ellipse(x + W / 2, y + H / 2 + 2, W / 2 - 2, H / 2 - 4, hx('#c9a54a'))
    c.ellipse(x + W / 2, y + H / 2 + 1, W / 2 - 4, H / 2 - 6, hx('#e3c46a'))
    rng = random.Random(5)
    for _ in range(60):
        a = rng.random() * 6.28; r = rng.random()
        c.set(int(x + W / 2 + math.cos(a) * r * (W / 2 - 4)), int(y + H / 2 + 1 + math.sin(a) * r * (H / 2 - 6)), hx('#f0d88a') if rng.random() < .5 else hx('#a8873a'))
    c.rect(x + W - 12, y + H / 2 - 2, 5, 3, hx('#d0485a')); c.set(x + W - 10, y + H / 2 - 3, hx('#ffffff'))  # chew toy
def plant_wall(hgt):
    def d(c, x, y, W, H, f):
        soft_shadow(c, x, y + H - 6, W, 4, 0.8)
        top = y + H - 4 - hgt
        c.rect(x, top, W, hgt + 2, hx('#2c5a3a'))
        rng = random.Random(hgt)
        cols = [hx('#3f7a4a'), hx('#4f8a4a'), hx('#2f6a42'), hx('#6aa25a'), hx('#9ac06a')]
        for _ in range(W * hgt // 5):
            lx = rng.randrange(x, x + W); ly = rng.randrange(top, top + hgt + 2); col = rng.choice(cols)
            c.set(lx, ly, col); c.set(lx + 1, ly, col); c.set(lx, ly + 1, shade(col, 0.85))
        for i in range(x, x + W, 3): c.set(i, top - 1, rng.choice(cols)); c.set(i + 1, top - 2, cols[3]) if rng.random() < .4 else None
        c.rect(x, y + H - 4, W, 3, WAL_S); c.hline(x, y + H - 4, W, WAL)
        if hgt > 30 and True: c.set(x + 5, top + 8, hx('#e8506a')); c.set(x + 11, top + 20, hx('#f0d070'))
    return d
def mail_slot(c, x, y, W, H, f):
    soft_shadow(c, x + 1, y + H - 10, W - 2, 8)
    z = 26; d = 8
    box(c, x + 1, y + H - 2 - d, W - 2, d, z, WAL_H, WAL, WAL_S)
    fy = y + H - 2 - z
    rng = random.Random(9)
    for r in range(3):
        for k in range(12):
            hx0 = x + 3 + k * 7.6; hy0 = fy + 2 + r * 7
            c.rect(int(hx0), hy0, 6, 6, WAL_D)
            if rng.random() < 0.55:
                col = rng.choice([CREAM, hx('#f6f3ea'), AQUA, hx('#f0d8a0')])
                c.rect(int(hx0) + 1, hy0 + 2, 4, 4, col); c.set(int(hx0) + 1, hy0 + 2, shade(col, 0.85))
    c.rect(x + W // 2 - 10, fy - 4, 20, 3, BRS); c.hline(x + W // 2 - 10, fy - 4, 20, BRS_H)
def mail_counter(c, x, y, W, H, f):
    soft_shadow(c, x + 1, y + H - 10, W - 2, 8)
    box(c, x + 1, y + H - 2 - 9, W - 2, 9, 14, hx('#ece4cd'), WAL, WAL_S)
    ty = y + H - 2 - 9 - 14
    c.rect(x + 10, ty + 1, 12, 6, hx('#f6f3ea')); c.rect(x + 11, ty, 12, 6, hx('#ffffff')); c.hline(x + 12, ty + 2, 8, BLUEG)
    c.rect(x + 30, ty + 1, 8, 5, STL); c.rect(x + 31, ty - 1, 6, 2, STL_H); c.set(x + 34, ty + 3, RED)  # scale
    c.rect(x + 46, ty + 2, 4, 3, RED); c.rect(x + 47, ty, 2, 2, WAL_D)  # stamp
    c.rect(x + 60, ty, 10, 7, hx('#c8a070')); c.hline(x + 60, ty + 3, 10, hx('#8a6a3a'))  # parcel
    for k in range(5): c.rect(x + 76 + k * 2, ty + 2 - k % 2, 6, 5, hx('#f6f3ea') if k % 2 else AQUA)
def package(typo):
    def d(c, x, y, W, H, f):
        soft_shadow(c, x + 2, y + H - 9, W - 4, 7)
        box(c, x + 2, y + H - 2 - 8, W - 4, 8, 7, hx('#d9b07a'), hx('#b88a52'), hx('#9a7040'))
        c.vline(x + W // 2, y + H - 2 - 15, 15, hx('#8a6030'))
        c.rect(x + 4, y + H - 9, 7, 5, hx('#f6f3ea'))
        if typo: c.set(x + 5, y + H - 8, RED); c.set(x + 7, y + H - 8, RED); c.set(x + 9, y + H - 7, RED)
        else: c.hline(x + 5, y + H - 8, 4, INK)
    return d
def it_desk(c, x, y, W, H, f):
    soft_shadow(c, x + 1, y + H - 8, W - 2, 6)
    desk_surface(c, x + 1, y + H - 2 - 16, W - 2, 10, 6, sh=False)
    ty = y + H - 18
    # open CRT chassis + parts
    c.rect(x + 8, ty - 9, 14, 11, BEI_S); c.rect(x + 9, ty - 8, 12, 8, hx('#2a3a30'))
    for k in range(4): c.set(x + 10 + k * 3, ty - 6, GRN if (k + f) % 2 else GRN_D); c.set(x + 11 + k * 2, ty - 3, MUST)
    c.rect(x + 28, ty - 2, 14, 4, BEI); c.hline(x + 28, ty - 2, 14, BEI_H)
    c.rect(x + 46, ty - 4, 9, 6, RED); c.hline(x + 46, ty - 4, 9, shade(RED, 1.2)); c.rect(x + 49, ty - 6, 3, 2, INK)  # toolbox
    for k in range(10): c.set(x + 2 + (k * 7) % 60, y + H - 2 - (k % 3), INK if k % 2 else hx('#4a7ab8'))  # cable pile on floor
    c.ellipse(x + W - 8, y + H - 3, 5, 2, INK); c.ellipse(x + W - 8, y + H - 3, 3, 1, hx('#3a3f46'))
    c.rect(x + 58, ty - 3, 4, 5, CREAM); c.set(x + 59, ty - 2, INK)  # mug
def bookshelf(w, archive=False):
    def d(c, x, y, W, H, f):
        soft_shadow(c, x + 1, y + H - 9, W - 2, 7)
        z = 28; dd = 7
        box(c, x + 1, y + H - 2 - dd, W - 2, dd, z, WAL_H, WAL_D, WAL_S)
        fy = y + H - 2 - z
        rng = random.Random(w * 7 + archive)
        for r in range(3):
            sy = fy + 2 + r * 9; c.hline(x + 2, sy + 7, W - 4, WAL)
            i = x + 3
            while i < x + W - 4:
                if archive:
                    bw = 7; col = rng.choice([hx('#d9c9a0'), hx('#cbb98a'), hx('#e2d6b4')])
                    c.rect(i, sy + 1, bw, 6, col); c.rect(i + 2, sy + 3, 3, 1, INK if rng.random() < .3 else shade(col, 0.7)); i += bw + 1
                else:
                    bw = rng.choice([2, 2, 3]); hgt = rng.choice([5, 6, 6, 7])
                    year_one = rng.random() < 0.18
                    col = TEAL if year_one else rng.choice([MUST, ORNG, SEA, CREAM, hx('#6e2f3a'), DEEP, AVO, BLUEG, hx('#8a5a3a')])
                    c.rect(i, sy + 7 - hgt, bw, hgt, col); c.set(i, sy + 8 - hgt, shade(col, 1.2))
                    if year_one: c.set(i + bw // 2, sy + 4, BRS_H)
                    i += bw + (1 if rng.random() < .15 else 0)
                    if rng.random() < 0.05: c.set(i, sy + 6, col); c.set(i + 1, sy + 5, col); i += 3
    return d
def whiteboard(full):
    def d(c, x, y, W, H, f):
        soft_shadow(c, x + 4, y + H - 6, W - 8, 4, 0.8)
        bx, bw, top = x + 2, W - 4, y + H - 40
        for lx in (bx + 6, bx + bw - 7): c.vline(lx, top + 26, 13, STL_S)
        c.hline(bx + 4, y + H - 3, bw - 8, STL_S)
        c.rect(bx, top, bw, 26, STL); c.rect(bx + 1, top + 1, bw - 2, 24, hx('#fbfbf8')); c.hline(bx, top + 25, bw, STL_S)
        rng = random.Random(3 if full else 1)
        n = 26 if full else 6
        cols = [hx('#3a5a9a'), hx('#c0402e'), hx('#2f6f68'), INK]
        for _ in range(n):
            col = rng.choice(cols); x0 = rng.randrange(bx + 3, bx + bw - 10); y0 = rng.randrange(top + 3, top + 20)
            t = rng.random()
            if t < .4:
                c.rect(x0, y0, 6, 4, col); c.rect(x0 + 1, y0 + 1, 4, 2, hx('#fbfbf8'))
            elif t < .8:
                L = rng.randrange(3, 9)
                for k in range(L): c.set(x0 + k, y0 + (k // 3 if rng.random() < .5 else 0), col)
                c.set(x0 + L, y0, col); c.set(x0 + L - 1, y0 - 1, col); c.set(x0 + L - 1, y0 + 1, col)
            else:
                for k in range(rng.randrange(3, 8)): c.set(x0 + k, y0, col) if k % 2 == 0 else None
        c.rect(bx + bw - 14, top + 22, 10, 2, STL_S); c.set(bx + bw - 12, top + 22, RED); c.set(bx + bw - 9, top + 22, hx('#3a5a9a'))
    return d
def intercom(c, x, y, W, H, f):
    soft_shadow(c, x + 4, y + H - 6, 8, 4, 0.8)
    c.rect(x + 7, y + H - 26, 2, 22, STL_S); c.rect(x + 5, y + H - 4, 6, 2, STL_S)
    c.ellipse(x + 8, y + H - 30, 6, 6, BEI); c.ellipse(x + 8, y + H - 30, 4.5, 4.5, BEI_S)
    for j in range(-3, 4, 2): c.hline(x + 5, y + H - 30 + j, 7, BEI_D)
    on = f % 2 == 1
    c.set(x + 8, y + H - 37, hx('#ffb84a') if on else BRS_S)
    if on:
        for k in (1, 2):
            c.set(x + 8 + 6 + k * 2, y + H - 32, (255, 200, 120, 200 - k * 60)); c.set(x + 8 + 6 + k * 2, y + H - 28, (255, 200, 120, 200 - k * 60)); c.set(x + 8 + 7 + k * 2, y + H - 30, (255, 200, 120, 200 - k * 60))
def make_needs():
    furn('ping-pong-table', 6, 3, 6, ping_pong, frames=8, fps=8)
    furn('vending-machine', 2, 3, 6, vending, frames=5, fps=3)
    order = ['gerald', 'pamela', 'steve', 'the-intern', 'muriel', 'dot']
    furn('aquarium-tank', 8, 4, 8, lambda c, x, y, W, H, f: aquarium(c, x, y, W, H, f % 8, night=f >= 8), frames=16, fps=6,
         states={'day': list(range(8)), 'night': list(range(8, 16))}, fish=order,
         note='fish swim baked in; use state night (brighter bubbles, cool glow) and add glow_aquarium additively')
    for fid in order:
        fr = []
        for f in range(2):
            c = Cv(12, 9); fish_px(c, 3 if True else 0, 4, fid, f); c.outline(0.5); fr.append(c)
        add('fish_' + fid, fr, (6, 4), fps=4, note=f'loose fish sprite for {fid} (faces right, flip for left)')
    furn('fish-food-shelf', 2, 2, 8, fish_food_shelf)
    furn('nap-pod', 2, 2, 4, lambda c, x, y, W, H, f: nap_pod(c, x, y, W, H, f, f == 1), frames=2, states={'open': [0], 'occupied': [1]})
    furn('mystery-door', 2, 2, 28, mystery_door, frames=3, states={'closed': [0], 'ajar': [1, 2]}, note='free-standing, slightly too white')
    furn('goat-fence', 1, 1, 6, fence('h'), note='E-W rail segment; use goat-fence_v for N-S runs, goat-fence_post at corners')
    furn('goat-fence_v', 1, 1, 14, fence('v')); furn('goat-fence_post', 1, 1, 8, fence('post'))
    furn('hay-bale', 2, 1, 6, hay); furn('hay-bale_1x1', 1, 1, 6, hay)
    furn('goat-bed', 2, 2, 2, goat_bed)
    furn('plant-wall', 1, 1, 22, plant_wall(30), note='tiles horizontally into a hedge'); furn('plant-wall_1x2', 1, 2, 30, plant_wall(40))
    furn('mail-slot', 6, 1, 20, mail_slot); furn('mail-counter', 6, 1, 14, mail_counter)
    furn('package', 1, 1, 6, package(False)); furn('package_typo', 1, 1, 6, package(True), note='label misspelt (red marks)')
    furn('it-desk', 4, 1, 14, it_desk, frames=2, fps=2)
    furn('archive-shelf', 12, 1, 24, bookshelf(12, True)); furn('bookshelf-wide', 6, 1, 24, bookshelf(6))
    for w in (6, 7, 12): furn(f'bookshelf_{w}x1', w, 1, 24, bookshelf(w))
    P['bookshelf'] = P['bookshelf_6x1']
    furn('whiteboard', 4, 1, 28, whiteboard(False)); furn('whiteboard-full', 4, 1, 28, whiteboard(True))
    furn('intercom', 1, 1, 26, intercom, frames=2, states={'idle': [0], 'thinking': [0, 1]}, fps=3, note='"the intercom is thinking": play state thinking')
    c = Cv(10, 6)
    for (i, j, col) in [(1, 1, ORNG), (3, 2, MUST), (5, 1, hx('#d0485a')), (7, 3, ORNG), (2, 4, MUST), (6, 4, hx('#e8c86a')), (4, 3, ORNG)]: c.set(i, j, col)
    add('fish-food-flake', c, (5, 3), note='decal floating on the aquarium water surface')
    # CRT glitch + portrait blink
    fr = []
    for f in range(2):
        c = Cv(20, 22); soft_shadow(c, 3, 15, 14, 4, 0.8)
        c.rect(7, 16, 6, 2, BEI_S); c.rect(5, 18, 10, 1, BEI_D); c.rrect(2, 1, 16, 15, BEI, 2); c.hline(3, 1, 14, BEI_H)
        crt_screen(c, 4, 3, 12, 9, 3 + f)
        for j in ((5, 8) if f == 0 else (4, 10)): c.hline(4, j, 12, hx('#d8ffe6')); c.hline(4 + f * 3, j + 1, 8, SCR)
        if f == 1: c.rect(4, 6, 12, 2, hx('#e04a7a'))
        c.outline(0.5); fr.append(c)
    add('crt_glitch', fr, (10, 18), fps=12, note='1-2 frame flicker overlay/state for crt_front')
make_props = make_needs
