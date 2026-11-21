"""Round 2: furniture formerly drawn procedurally in Rust, belongings, glows, fx, islands, slim signs."""
from common import *
import random, math, json
from props import add, P, WAL, WAL_H, WAL_S, WAL_D, WAL_G, BEI, BEI_H, BEI_S, BEI_D, SCR, GRN, GRN_D, GRN_M, STL, STL_H, STL_S, BRS, BRS_H, BRS_S, TEAL, TEAL_D, MUST, ORNG, AVO, CREAM, RED, INK, desk_surface, crt_screen, CHAIR_COLS
from props2 import furn, box, soft_shadow, SEA, MINT, DEEP, AQUA, BLUEG, MOSS, SHC
import tinyfont
# ---------------------------------------------------------------- furniture
def reception(c, x, y, W, H, f):
    soft_shadow(c, x + 1, y + H - 10, W - 2, 8)
    box(c, x + 1, y + H - 2 - 9, W - 2, 9, 16, WAL_H, WAL, WAL_S)
    fy = y + H - 2 - 16
    c.hline(x + 1, fy + 9, W - 2, BRS); c.hline(x + 1, fy + 3, W - 2, BRS_S)
    for k in range(3): c.rect(x + 8 + k * 14, fy + 5, 8, 3, WAL_S)
    ty = y + H - 2 - 9 - 16
    c.rect(x + 6, ty + 2, 8, 5, CREAM); c.vline(x + 10, ty + 2, 5, hx('#c9c0a8'))  # guest book
    c.ellipse(x + 22, ty + 4, 3, 2, BRS); c.set(x + 22, ty + 2, BRS_H)  # bell
    c.rect(x + 34, ty, 6, 6, hx('#c0622f')); c.rect(x + 35, ty - 6, 4, 6, hx('#3f7a4a')); c.set(x + 34, ty - 7, hx('#6aa25a'))
def microwave(c, x, y, W, H, f):
    soft_shadow(c, x + 1, y + H - 8, W - 2, 6)
    box(c, x + 1, y + H - 2 - 7, W - 2, 7, 10, BEI_S, WAL_S)  # little cart
    my = y + H - 2 - 7 - 10
    box(c, x + 2, my + 6, W - 4, 6, 9, BEI_H, BEI, BEI_S)
    run = f >= 1
    c.rect(x + 3, my - 2, 8, 6, hx('#ffd97a') if run else hx('#2a2f36')); c.rect(x + 12, my - 2, 2, 6, BEI_D)
    if run: c.set(x + 6, my, hx('#c0622f'))
    c.set(x + 12, my - 2, GRN if run else GRN_D)
def fridge(c, x, y, W, H, f):
    soft_shadow(c, x + 1, y + H - 9, W - 2, 7)
    col = hx('#9aa65a')
    box(c, x + 1, y + H - 2 - 7, W - 2, 7, 32, shade(col, 1.15), col, shade(col, 0.8))
    fy = y + H - 2 - 32
    c.hline(x + 1, fy + 11, W - 2, shade(col, 0.7)); c.vline(x + W - 4, fy + 3, 6, STL_H); c.vline(x + W - 4, fy + 14, 9, STL_H)
    for (i, j, cc) in ((4, 4, ORNG), (7, 15, CREAM), (4, 20, MINT), (8, 6, RED)): c.rect(x + i, fy + j, 2, 2, cc)
    c.rect(x + 5, fy + 15, 5, 6, hx('#f6f3ea')); c.hline(x + 6, fy + 17, 3, INK)
def snack_bar(c, x, y, W, H, f):
    soft_shadow(c, x + 1, y + H - 10, W - 2, 8)
    box(c, x + 1, y + H - 2 - 9, W - 2, 9, 14, CREAM, WAL, WAL_S)
    ty = y + H - 2 - 23
    for k, col in enumerate((ORNG, RED, MUST, MINT)):
        jx = x + 4 + k * 10; c.rect(jx, ty - 7, 7, 8, (210, 235, 240, 200)); c.rect(jx + 1, ty - 4, 5, 5, col); c.rect(jx + 1, ty - 9, 5, 2, STL)
    c.ellipse(x + W - 8, ty + 1, 5, 2.5, WAL_S); c.set(x + W - 10, ty - 1, RED); c.set(x + W - 8, ty - 1, hx('#e8d24a')); c.set(x + W - 6, ty - 1, hx('#7aa24a'))
def toilet_door(c, x, y, W, H, f):
    soft_shadow(c, x + 2, y + H - 5, W - 4, 3, 0.7)
    c.rect(x + 2, y + H - 36, W - 4, 33, hx('#ffffff')); c.rect(x + 3, y + H - 35, W - 6, 31, hx('#f2f0ec'))
    c.vline(x + W - 4, y + H - 35, 31, hx('#dcd8d0')); c.set(x + W - 6, y + H - 20, BRS)
    c.rect(x + 6, y + H - 31, 4, 5, TEAL); c.set(x + 8, y + H - 32, TEAL)
def rug(w, h):
    def d(c, x, y, W, H, f):
        c.rrect(x, y, W, H, hx('#c9a03a'), 2)
        c.rrect(x + 2, y + 2, W - 4, H - 4, hx('#c0622f'), 1)
        c.rect(x + 4, y + 4, W - 8, H - 8, hx('#2f6f68'))
        for i in range(x + 6, x + W - 6, 8):
            c.rect(i, y + 6, 4, H - 12, hx('#3d7f86')); c.vline(i + 1, y + 6, H - 12, MINT)
        c.hline(x + 4, y + H // 2, W - 8, hx('#e8c86a'))
        for i in range(x + 1, x + W - 1, 2): c.set(i, y + H, hx('#e2d6b4')); c.set(i, y - 1, hx('#e2d6b4'))
    return d
def counter(c, x, y, W, H, f):
    soft_shadow(c, x + 1, y + H - 9, W - 2, 7)
    box(c, x + 1, y + H - 2 - 8, W - 2, 8, 14, hx('#d6d2c8'), WAL, WAL_S)
    ty = y + H - 2 - 22
    c.rect(x + 4, ty + 1, 8, 4, STL_S); c.rect(x + 5, ty + 2, 6, 2, hx('#8fb0c0')); c.vline(x + 8, ty - 3, 4, STL); c.set(x + 9, ty - 3, STL)
    c.rect(x + 2, ty + 9, W - 4, 1, BRS)
def bin_(c, x, y, W, H, f):
    soft_shadow(c, x + 3, y + H - 6, W - 6, 4)
    c.rect(x + 4, y + H - 15, 8, 12, STL); c.vline(x + 4, y + H - 15, 12, STL_H); c.vline(x + 11, y + H - 15, 12, STL_S)
    c.ellipse(x + 8, y + H - 15, 4, 1.5, hx('#5a5f66')); c.rect(x + 6, y + H - 17, 3, 2, hx('#f6f3ea')); c.set(x + 9, y + H - 18, hx('#e8e4d8'))
def dog_bed(c, x, y, W, H, f):
    soft_shadow(c, x + 2, y + 2, W - 4, H - 3, 0.6)
    c.ellipse(x + W / 2, y + H / 2 + 1, W / 2 - 1, H / 2 - 1, hx('#2f6f68')); c.ellipse(x + W / 2, y + H / 2, W / 2 - 4, H / 2 - 4, hx('#9fd6c2'))
    c.rect(x + W - 10, y + 6, 6, 2, CREAM); c.set(x + W - 11, y + 5, CREAM); c.set(x + W - 11, y + 8, CREAM); c.set(x + W - 4, y + 5, CREAM); c.set(x + W - 4, y + 8, CREAM)
def candle(c, x, y, W, H, f):
    soft_shadow(c, x + 4, y + H - 5, 8, 3, 0.7)
    c.rect(x + 7, y + H - 20, 2, 18, BRS_S); c.rect(x + 5, y + H - 4, 6, 2, BRS); c.hline(x + 4, y + H - 20, 8, BRS)
    for k, cx in enumerate((x + 4, x + 7, x + 10)):
        c.rect(cx, y + H - 26, 2, 6, CREAM)
        fl = (f + k) % 3
        c.set(cx + (1 if fl == 1 else 0), y + H - 28, hx('#ffd36a')); c.set(cx, y + H - 27, hx('#ff9a3a')); c.set(cx + 1, y + H - 27, hx('#ffd36a') if fl else hx('#ff9a3a'))
def screen(w):
    def d(c, x, y, W, H, f):
        soft_shadow(c, x + 6, y + H - 5, W - 12, 3, 0.6)
        top = y + H - 44
        c.rect(x + 1, top, W - 2, 30, INK); c.rect(x + 3, top + 2, W - 6, 26, SCR)
        n = (W - 12) // 7
        for k in range(n):
            b = 6 + ((k * 5 + f * (1 if k % 2 else 0)) % 14)
            c.rect(x + 6 + k * 7, top + 25 - b, 4, b, GRN_D); c.hline(x + 6 + k * 7, top + 25 - b, 4, GRN)
        for j in range(top + 3, top + 28, 2):
            for i in range(x + 3, x + W - 3):
                p = c.get(i, j); c.px[i, j] = shade(p, 0.85)
        c.vline(x + W // 2, top + 30, 10, STL_S); c.rect(x + W // 2 - 4, y + H - 4, 9, 2, STL_S)
    return d
def pod_booth(c, x, y, W, H, f):
    soft_shadow(c, x, y + H - 8, W, 6)
    c.rrect(x, y + H - 40, W, 38, hx('#2f6f68'), 2); c.rrect(x + 2, y + H - 37, W - 4, 32, hx('#1f4a42'), 1)
    c.rect(x + 3, y + H - 24, W - 6, 2, WAL); c.rect(x + 6, y + H - 33, 4, 3, hx('#ffd97a'))  # shelf + little lamp
    c.ellipse(x + 8, y + H - 8, 4, 2, MUST); c.vline(x + 8, y + H - 7, 4, STL_S)  # stool
    c.hline(x, y + H - 40, W, hx('#4f9a8a'))
def chair_sprite(c, x, y, W, H, facing, col, kind='chair'):
    hi, lo = shade(col, 1.2), shade(col, 0.75)
    cx = x + W // 2
    if kind == 'desk-chair':
        soft_shadow(c, cx - 6, y + H - 6, 12, 4, 0.8)
        for dx in (-5, -2, 2, 5): c.set(cx + dx, y + H - 3, INK)
        c.hline(cx - 5, y + H - 4, 11, STL_S); c.vline(cx, y + H - 8, 4, STL_S)
        if facing in ('up', 'down'):
            c.rrect(cx - 6, y + H - 12, 12, 4, hi if facing == 'down' else col, 1)
            if facing == 'down': c.rrect(cx - 6, y + H - 22, 12, 9, col, 2); c.hline(cx - 4, y + H - 22, 8, hi)
            else: c.rrect(cx - 6, y + H - 15, 12, 8, col, 2); c.hline(cx - 4, y + H - 15, 8, hi); c.hline(cx - 5, y + H - 8, 10, lo)
        else:
            s = 1 if facing == 'right' else -1
            c.rect(cx - 5, y + H - 11, 10, 3, col); c.hline(cx - 5, y + H - 11, 10, hi)
            bx = cx - 6 if s > 0 else cx + 4
            c.rect(bx, y + H - 21, 3, 11, col); c.vline(bx, y + H - 21, 11, hi)
        return
    if kind == 'stool':
        soft_shadow(c, cx - 5, y + H - 6, 10, 4, 0.8)
        c.vline(cx - 3, y + H - 10, 7, STL_S); c.vline(cx + 3, y + H - 10, 7, STL_S); c.hline(cx - 3, y + H - 6, 7, STL)
        c.ellipse(cx, y + H - 11, 5, 2.2, WAL); c.ellipse(cx, y + H - 12, 5, 2, WAL_H)
        return
    if kind == 'armchair':
        soft_shadow(c, x + 1, y + H - 8, W - 2, 6)
        if facing == 'down':
            c.rrect(x + 1, y + H - 22, W - 2, 10, col, 2); c.hline(x + 3, y + H - 22, W - 6, hi)
            c.rrect(x + 1, y + H - 13, W - 2, 8, hi, 1); c.rect(x + 1, y + H - 15, 3, 9, lo); c.rect(x + W - 4, y + H - 15, 3, 9, lo)
        elif facing == 'up':
            c.rrect(x + 2, y + H - 18, W - 4, 6, hi, 1); c.rrect(x + 1, y + H - 14, W - 2, 10, col, 2); c.hline(x + 3, y + H - 14, W - 6, hi)
        else:
            s = facing == 'right'
            c.rrect(x + 2, y + H - 13, W - 4, 8, hi, 1); bx = x + 1 if s else x + W - 5
            c.rrect(bx, y + H - 21, 4, 16, col, 1); c.rect(x + 3, y + H - 9, W - 6, 3, lo)
        c.vline(x + 3, y + H - 5, 2, WAL_D); c.vline(x + W - 4, y + H - 5, 2, WAL_D)
        return
def make_furniture():
    furn('reception-desk', 3, 1, 18, reception)
    furn('microwave', 1, 1, 18, microwave, frames=2, states={'ok': [0], 'running': [1]})
    furn('fridge', 1, 1, 30, fridge)
    furn('snack-bar', 3, 1, 22, snack_bar)
    furn('toilet-door', 1, 1, 26, toilet_door)
    for (w, h) in ((6, 3), (8, 3)): furn(f'rug_{w}x{h}', w, h, 1, rug(w, h), layer='floor')
    P['rug'] = P['rug_6x3']
    furn('counter', 1, 1, 18, counter)
    furn('bin', 1, 1, 6, bin_)
    furn('dog-bed', 2, 1, 2, dog_bed)
    furn('candle', 1, 1, 18, candle, frames=3, fps=6)
    for w in (3, 4): furn(f'screen_{w}x1', w, 1, 34, screen(w), frames=4, fps=2)
    P['screen'] = P['screen_4x1']
    furn('pod-booth', 1, 1, 28, pod_booth)
    P['podium'] = P['lectern']
    P['water-cooler'] = P['water_cooler']
    rng = random.Random(4)
    for nm, col in CHAIR_COLS.items():
        for fc in ('up', 'down', 'left', 'right'):
            furn(f'desk-chair_{fc}_{nm}', 1, 1, 10, lambda c, x, y, W, H, f, fc=fc, col=col: chair_sprite(c, x, y, W, H, fc, col, 'desk-chair'), pad=2)
            furn(f'armchair_{fc}_{nm}', 1, 1, 10, lambda c, x, y, W, H, f, fc=fc, col=col: chair_sprite(c, x, y, W, H, fc, col, 'armchair'), pad=2)
    furn('stool', 1, 1, 4, lambda c, x, y, W, H, f: chair_sprite(c, x, y, W, H, 'down', MUST, 'stool'), pad=2)
    def sofa(c, x, y, W, H, f):
        soft_shadow(c, x + 1, y + H - 8, W - 2, 6)
        c.rrect(x + 1, y + H - 22, W - 2, 10, TEAL, 2); c.hline(x + 3, y + H - 22, W - 6, shade(TEAL, 1.2))
        for k in range(3): c.rrect(x + 3 + k * 15, y + H - 14, 14, 8, shade(TEAL, 1.25), 1)
        c.rect(x + 1, y + H - 16, 3, 10, TEAL_D); c.rect(x + W - 4, y + H - 16, 3, 10, TEAL_D)
        c.rect(x + 8, y + H - 19, 6, 5, MUST); c.rect(x + W - 15, y + H - 19, 6, 5, ORNG)  # cushions
    furn('sofa', 3, 1, 10, sofa)
    for nm, col in (('orange', ORNG), ('teal', TEAL), ('mustard', MUST)):
        def bb(c, x, y, W, H, f, col=col):
            soft_shadow(c, x + 2, y + H - 7, W - 4, 5, 0.8)
            c.ellipse(x + W / 2, y + H - 7, 7, 5.5, col); c.ellipse(x + W / 2 - 1, y + H - 9, 4, 3, shade(col, 1.2)); c.set(x + W / 2 - 3, y + H - 11, shade(col, 1.35))
        furn(f'beanbag_{nm}', 1, 1, 4, bb, pad=2)
    P['beanbag'] = P['beanbag_orange']
    def coffee_machine(c, x, y, W, H, f):
        broken = f >= 3
        soft_shadow(c, x + 1, y + H - 9, W - 2, 7)
        box(c, x + 1, y + H - 2 - 8, W - 2, 8, 12, WAL_H, WAL, WAL_S)
        ty = y + H - 22
        c.rect(x + 4, ty - 14, 12, 15, STL); c.vline(x + 4, ty - 14, 15, STL_H); c.vline(x + 15, ty - 14, 15, STL_S); c.rect(x + 6, ty - 16, 8, 2, STL_S)
        c.rect(x + 6, ty - 10, 8, 4, INK); c.set(x + 7 + f % 3, ty - 9, RED if broken else GRN)
        c.rect(x + 8, ty - 3, 4, 3, CREAM)
        for k, col in enumerate((ORNG, TEAL, MUST)): c.rect(x + 19 + k * 4, ty - 3, 3, 3, col)
        if not broken:
            c.set(x + 10 + (f % 2), ty - 18, (255, 255, 255, 170)); c.set(x + 9 + (f % 2), ty - 20, (255, 255, 255, 110))
        else:
            c.set(x + 16 + f - 3, ty - 18 - (f - 3), (90, 90, 96, 190)); c.set(x + 17, ty - 20, (90, 90, 96, 120))
    furn('coffee-machine', 2, 1, 22, coffee_machine, frames=5, fps=4, states={'ok': [0, 1, 2], 'broken': [3, 4]})
    def printer(c, x, y, W, H, f):
        soft_shadow(c, x + 1, y + H - 10, W - 2, 8)
        box(c, x + 1, y + H - 2 - 9, W - 2, 9, 16, BEI_H, BEI, BEI_S)
        fy = y + H - 2 - 16
        c.rect(x + 3, fy - 9 + 2, W - 6, 4, BEI_S); c.rect(x + 5, fy - 8, W - 10, 2, hx('#3a3a3e'))
        c.rect(x + W - 9, fy + 2, 5, 3, INK); c.set(x + W - 8, fy + 3, RED if f == 3 else GRN)
        c.hline(x + 3, fy + 8, W - 6, BEI_D)
        if f in (1, 2):
            c.rect(x + 8, fy - 12 - f * 2, 12, 5 + f * 2, hx('#ffffff')); c.hline(x + 10, fy - 10 - f * 2, 7, BLUEG)
        if f == 3:
            c.rect(x + 9, fy - 12, 10, 4, hx('#f6f3ea')); c.set(x + 13, fy - 13, hx('#f6f3ea')); c.set(x + 15, fy - 14, hx('#e8e4d8'))
    furn('printer', 2, 1, 20, printer, frames=4, fps=4, states={'ok': [0], 'printing': [0, 1, 2], 'jam': [3]})
    def cabinet(c, x, y, W, H, f):
        soft_shadow(c, x + 1, y + H - 12, W - 2, 10)
        box(c, x + 1, y + H - 2 - 12, W - 2, 12, 22, WAL_H, WAL, WAL_S)
        fy = y + H - 2 - 22
        c.vline(x + W // 2, fy, 22, WAL_D)
        for k in range(2): c.rect(x + W // 2 - 4 + k * 6, fy + 9, 2, 4, BRS)
        c.rect(x + 4, fy - 20, 6, 8, CREAM); c.rect(x + 12, fy - 18, 8, 6, TEAL); c.ellipse(x + 25, fy - 15, 3, 3, MUST)  # things on top
    furn('cabinet', 2, 2, 20, cabinet)
    for w, h in ((10, 2), (4, 2), (5, 2), (1, 2), (1, 1)):
        def tbl(c, x, y, W, H, f):
            soft_shadow(c, x + 1, y + 3, W - 2, H - 2)
            desk_surface(c, x + 1, y + 1, W - 2, H - 7, 5, sh=False)
            c.rrect(x + 1, y + 1, W - 2, H - 7, WAL, 1); c.hline(x + 2, y + 1, W - 4, WAL_H)
            for j in range(y + 4, y + H - 7, 3):
                for i in range(x + 3, x + W - 3):
                    if (i * 7 + j * 13) % 11 < 5: c.set(i, j, WAL_G)
            if W >= 64: c.hline(x + 6, y + (H - 6) // 2, W - 12, BRS)
        furn(f'table_{w}x{h}', w, h, 2, tbl)
    # more plant varieties (engine can pick by seed)
    def plant_var(kind):
        def d(c, x, y, W, H, f):
            soft_shadow(c, x + 3, y + H - 6, W - 6, 4)
            pot = {'monstera': CREAM, 'fern': hx('#b86a40'), 'rubber': TEAL, 'succulent': MUST}[kind]
            c.rect(x + 4, y + H - 9, 8, 7, pot); c.hline(x + 3, y + H - 10, 10, shade(pot, 1.1)); c.vline(x + 11, y + H - 9, 7, shade(pot, 0.8))
            rng = random.Random(kind)
            if kind == 'monstera':
                for (lx, ly) in ((2, -22), (9, -24), (5, -16), (10, -15), (1, -14)):
                    c.ellipse(x + lx + 3, y + H + ly, 3.6, 3, hx('#2f7a4a')); c.set(x + lx + 3, y + H + ly, CREAM); c.set(x + lx + 2, y + H + ly + 1, hx('#5aa25a'))
            elif kind == 'fern':
                for k in range(9):
                    a = -2.6 + k * 0.4
                    for r in range(9):
                        c.set(int(x + 8 + math.cos(a) * r), int(y + H - 10 + math.sin(a) * r * 0.9), hx('#4f9a4a') if r % 2 else hx('#7ac05a'))
            elif kind == 'rubber':
                c.vline(x + 8, y + H - 26, 16, WAL_D)
                for (lx, ly) in ((4, -26), (11, -23), (3, -19), (12, -16), (6, -13)):
                    c.ellipse(x + lx + 1, y + H + ly, 2.6, 2, hx('#1f4a32')); c.set(x + lx, y + H + ly - 1, hx('#4f8a5a'))
            else:
                for (lx, ly, col) in ((5, -12, hx('#7ab08a')), (8, -13, hx('#9ac0a0')), (10, -11, hx('#6aa080')), (7, -11, hx('#e88fb0'))):
                    c.ellipse(x + lx, y + H + ly, 1.8, 1.6, col)
        return d
    for k in ('monstera', 'fern', 'rubber', 'succulent'): furn(f'plant_{k}', 1, 1, 20, plant_var(k), pad=3)
    P['plant'] = P['snake_plant']; P['plant-tall'] = P['plant_tall']

# ---------------------------------------------------------------- belongings
def tiny(name, w, h, draw, **m):
    c = Cv(w, h); draw(c); c.outline(0.5); add(name, c, (w // 2, h - 1), kind='belonging', **m)
def tiny_anim(name, w, h, draw, n, fps, **m):
    fr = []
    for f in range(n):
        c = Cv(w, h); draw(c, f); c.outline(0.5); fr.append(c)
    add(name, fr, (w // 2, h - 1), fps=fps, kind='belonging', **m)
def sh(c, x, y, w): c.ellipse(x + w / 2, y, w / 2 + 0.5, 1.3, SHC + (46,))
def make_belongings():
    def lava(c, f):
        sh(c, 1, 13, 6); c.rect(2, 11, 4, 2, BRS_S); c.rect(3, 2, 2, 9, (240, 140, 60, 150)); c.rect(2, 3, 4, 8, (232, 128, 72, 120))
        for k, by in enumerate(((f * 2) % 7, (f * 2 + 4) % 7)): c.rect(3, 9 - by, 2, 2, hx('#ff6a3a'))
        c.rect(3, 0, 2, 2, BRS_S)
    tiny_anim('lava_lamp', 8, 15, lava, 4, 2, note='glow: pair with glow_lamp tinted orange at night')
    def rolodex(c): sh(c, 0, 7, 9); c.rect(1, 5, 7, 2, INK); c.rect(2, 1, 5, 5, CREAM); c.vline(4, 1, 5, hx('#d8d0bc')); c.set(1, 3, STL_S); c.set(7, 3, STL_S)
    tiny('rolodex', 9, 8, rolodex)
    def fan(c, f):
        sh(c, 1, 12, 8); c.rect(3, 9, 4, 3, STL_S); c.vline(5, 6, 3, STL_S); c.ellipse(5, 4, 4, 4, STL); c.ellipse(5, 4, 3, 3, hx('#cfd6da'))
        bl = [((-2, 0), (2, 0)), ((0, -2), (0, 2))][f % 2]
        for (dx, dy) in bl: c.set(5 + dx, 4 + dy, BLUEG); c.set(5 + dx // 2, 4 + dy // 2, BLUEG)
        c.set(5, 4, INK)
    tiny_anim('desk_fan', 11, 13, fan, 2, 10)
    def pencils(c): sh(c, 0, 7, 6); c.rect(1, 3, 4, 4, TEAL); c.set(1, 1, MUST); c.set(1, 2, MUST); c.set(3, 0, RED); c.set(3, 1, RED); c.set(3, 2, RED); c.set(4, 2, hx('#3a5a9a'))
    tiny('pencil_cup', 6, 8, pencils)
    def globe(c): sh(c, 1, 11, 7); c.rect(3, 9, 3, 2, BRS_S); c.ellipse(4.5, 5, 3.6, 3.6, hx('#4a8ac0')); c.set(3, 4, hx('#7aa24a')); c.set(4, 4, hx('#7aa24a')); c.set(5, 6, hx('#7aa24a')); c.set(4, 5, hx('#7aa24a')); c.vline(8, 2, 7, BRS)
    tiny('globe', 10, 12, globe)
    def trophy(c): sh(c, 1, 10, 6); c.rect(2, 8, 4, 2, WAL_D); c.vline(4, 5, 3, BRS_S); c.rect(2, 1, 5, 4, BRS); c.set(1, 2, BRS); c.set(7, 2, BRS); c.set(3, 2, BRS_H)
    tiny('trophy', 9, 11, trophy, note='"Employee of the Hour" trophy')
    def binders(c):
        sh(c, 0, 9, 10)
        for k, col in enumerate((TEAL, MUST, SEA, ORNG)): c.rect(1 + k * 2, 1 + (k % 2), 2, 8 - (k % 2), col); c.set(1 + k * 2, 4, CREAM)
    tiny('binder_stack', 10, 10, binders)
    def snowglobe(c, f):
        sh(c, 0, 8, 7); c.rect(1, 6, 5, 2, WAL); c.ellipse(3.5, 3.5, 2.8, 2.8, (200, 230, 240, 200)); c.set(3, 4, hx('#3f7a4a'))
        c.set(2 + f % 3, 2 + (f % 2), hx('#ffffff')); c.set(4, 1 + (f + 1) % 3, hx('#ffffff'))
    tiny_anim('snow_globe', 7, 9, snowglobe, 3, 3)
    def notes(c): c.rect(0, 1, 5, 5, hx('#f0e070')); c.rect(3, 0, 5, 5, hx('#9fd6c2')); c.hline(4, 2, 3, INK); c.hline(1, 3, 2, INK)
    tiny('sticky_notes', 9, 7, notes)
    def radio(c): sh(c, 0, 8, 11); c.rrect(1, 2, 10, 6, WAL, 1); c.rect(2, 3, 5, 4, BEI_D); c.set(9, 4, BRS); c.set(9, 6, BRS); c.vline(10, 0, 2, STL_S); c.set(9, 0, STL_S)
    tiny('desk_radio', 12, 9, radio)
    def bonsai(c): sh(c, 0, 9, 10); c.rect(2, 7, 7, 2, hx('#6e2f3a')); c.vline(5, 3, 4, WAL_D); c.set(6, 4, WAL_D); c.ellipse(4, 3, 3, 1.6, hx('#3f7a4a')); c.ellipse(7.5, 4, 2, 1.2, hx('#4f8a4a'))
    tiny('bonsai', 11, 10, bonsai)
    def clipboard(c): sh(c, 0, 8, 7); c.rect(1, 1, 6, 8, WAL_H); c.rect(2, 2, 4, 6, hx('#f6f3ea')); c.rect(3, 0, 2, 2, STL); c.hline(3, 4, 2, INK); c.hline(3, 6, 2, INK)
    tiny('clipboard', 8, 10, clipboard)
    def typewriter(c):
        sh(c, 0, 9, 14); c.rrect(1, 4, 12, 5, hx('#5a6a5a'), 1); c.hline(1, 4, 12, hx('#7a8a7a')); c.rect(3, 1, 8, 3, hx('#f6f3ea'))
        for i in range(3, 11, 2): c.set(i, 6, CREAM); c.set(i + 1, 7, CREAM)
    tiny('typewriter', 14, 10, typewriter)
    def pennant(c): c.vline(1, 0, 9, WAL_D); c.rect(2, 1, 6, 3, TEAL); c.rect(2, 2, 8, 1, TEAL); c.set(4, 2, MINT); sh(c, 0, 9, 4)
    tiny('pennant', 10, 10, pennant)
    for nm, col in (('mug_green', AVO), ('mug_mint', MINT), ('mug_sea', SEA)):
        def mg(c, col=col):
            sh(c, 1, 7, 6); c.rect(1, 1, 5, 6, col); c.hline(1, 1, 5, shade(col, 1.25)); c.vline(5, 2, 5, shade(col, 0.78)); c.set(6, 3, col); c.set(6, 4, col); c.rect(2, 1, 3, 1, hx('#3a2418'))
        tiny(nm, 8, 9, mg)
    def stapler(c): sh(c, 0, 5, 9); c.rect(1, 3, 8, 2, INK); c.rect(1, 1, 7, 2, RED); c.hline(2, 1, 5, shade(RED, 1.25))
    tiny('stapler', 10, 6, stapler, note='the stapler that keeps getting lost')
    def framed_cert(c): sh(c, 0, 9, 8); c.rect(1, 0, 7, 9, WAL_D); c.rect(2, 1, 5, 7, CREAM); c.hline(3, 3, 3, INK); c.set(4, 6, BRS_H); c.set(5, 6, RED)
    tiny('certificate', 9, 11, framed_cert)
    def headphones(c): sh(c, 0, 6, 9); c.rect(1, 3, 2, 3, ORNG); c.rect(7, 3, 2, 3, ORNG); c.hline(2, 1, 6, hx('#3a3a40')); c.set(1, 2, hx('#3a3a40')); c.set(8, 2, hx('#3a3a40'))
    tiny('headphones_desk', 10, 7, headphones)

# ---------------------------------------------------------------- glows, shadows, atmosphere, particles
def glow(name, w, h, col, peak, shape='ellipse', note=''):
    c = Cv(w, h)
    for j in range(h):
        for i in range(w):
            dx, dy = (i + 0.5 - w / 2) / (w / 2), (j + 0.5 - h / 2) / (h / 2)
            if shape == 'ellipse': d = math.sqrt(dx * dx + dy * dy)
            else: d = max(abs(dx) ** 4 + abs(dy) ** 4, 0) ** 0.25
            a = max(0.0, 1 - d) ** 1.8
            # quantise to 6 steps for a pixel-art banded look
            a = round(a * 6) / 6
            if a > 0: c.px[i, j] = col + (int(a * peak),)
    add(name, c, (w // 2, h // 2), kind='light', blend='additive', note=note)
def make_fx():
    glow('glow_monitor', 40, 28, (90, 220, 150), 120, note='green CRT light pool; draw at the screen, more at night')
    glow('glow_lamp', 56, 34, (255, 206, 130), 130, note='warm desk-lamp pool on the floor/desk')
    glow('glow_fluoro', 72, 44, (225, 240, 255), 110, 'rect', note='cool fluorescent light pool under a fluoro_panel')
    glow('glow_aquarium', 168, 70, (110, 210, 230), 110, note='cool wash in front of the aquarium (night stronger)')
    glow('glow_elevator', 64, 44, (255, 220, 160), 120)
    glow('glow_candle', 20, 16, (255, 190, 100), 140)
    glow('glow_small', 16, 12, (255, 255, 255), 120, note='generic tintable sparkle glow')
    # floating fluorescent panel (Severance-style hovering light)
    for w in (32, 48):
        c = Cv(w + 4, 9); c.rrect(1, 1, w + 2, 6, STL_S, 1); c.rect(2, 2, w, 4, hx('#f6fbff')); c.hline(2, 2, w, hx('#ffffff')); c.hline(2, 5, w, hx('#d8e6f0'))
        c.outline(0.5); add(f'fluoro_panel_{w}', c, ((w + 4) // 2, 8), kind='light', float=True, note='hovers ~28px above the floor; pair with glow_fluoro below + sign_shadow-style ground shadow')
    # soft shadows (3-step) per width
    for w in (1, 2, 3, 4, 6, 8):
        W = w * 16; c = Cv(W + 8, 12)
        for k, a in ((3, 12), (2, 20), (1, 30), (0, 44)):
            c.ellipse((W + 8) / 2, 6, W / 2 + k * 1.5, 2.6 + k * 0.9, SHC + (a,))
        add(f'shadow_soft_{w}', c, ((W + 8) // 2, 6), kind='shadow', note=f'soft ellipse contact shadow for a {w}-tile wide object')
    c = Cv(18, 8)
    for k, a in ((3, 14), (2, 22), (1, 34), (0, 52)): c.ellipse(9, 4, 5.5 + k * 1.1, 1.8 + k * 0.6, SHC + (a,))
    add('shadow_person_soft', c, (9, 4), kind='shadow', note='3-step soft shadow under walking people (replaces shadow_person)')
    # atmosphere
    c = Cv(64, 64)
    rng = random.Random(11)
    for _ in range(26):
        i, j = rng.randrange(64), rng.randrange(64); c.px[i, j] = (120, 130, 140, rng.choice((8, 10, 14)))
    for i in range(0, 64, 16):
        for j in range(0, 64, 16):
            c.px[i, j] = (120, 135, 145, 40)
            for d in (1, 2): c.px[(i + d) % 64, j] = (120, 135, 145, 18); c.px[i, (j + d) % 64] = (120, 135, 145, 18); c.px[(i - d) % 64, j] = (120, 135, 145, 18); c.px[i, (j - d) % 64] = (120, 135, 145, 18)
    add('void_grid_fine', c, (0, 0), tile=True, kind='atmosphere', note='16px cross-hair grid + faint speckle; tile infinitely, fade alpha with distance from camera (0 beyond ~40 tiles)')
    fr = []
    for f in range(8):
        c = Cv(96, 96); rng = random.Random(21)
        for k in range(14):
            x0, y0, sp = rng.random() * 96, rng.random() * 96, rng.uniform(0.6, 1.6)
            x = (x0 + math.sin(f / 8 * 6.28 + k) * 3) % 96; y = (y0 - f * sp) % 96
            tw = (math.sin(f / 8 * 6.28 * 2 + k * 1.7) + 1) / 2
            c.px[int(x), int(y)] = (255, 255, 255, int(90 + 120 * tw)) if k % 3 else (200, 240, 225, int(70 + 100 * tw))
        fr.append(c)
    add('fx_motes', fr, (0, 0), fps=4, tile=True, kind='atmosphere', blend='additive', note='drifting dust motes overlay; tile over the screen at low alpha (more visible at night)')
    # particles
    def anim(name, w, h, n, fps, draw, anchor, **m):
        fr = []
        for f in range(n):
            c = Cv(w, h); draw(c, f); fr.append(c)
        add(name, fr, anchor, fps=fps, kind='fx', **m)
    def paper(c, f):
        x = 4 + [0, 2, 3, 2, 0, -1][f]; y = 2 + f * 2; w = [5, 4, 2, 4, 5, 4][f]
        c.rect(x, y, w, 3, hx('#ffffff')); c.hline(x, y + 2, w, hx('#d8d4cc')); c.set(x + 1, y + 1, BLUEG)
    anim('fx_paper', 14, 16, 6, 10, paper, (7, 15), loop=False, note='a sheet of paper fluttering down')
    def sweat(c, f):
        y = 1 + f * 2; a = 255 - f * 50
        c.set(3, y, (140, 200, 240, a)); c.set(3, y + 1, (90, 150, 220, a)); c.set(2, y + 1, (140, 200, 240, a)); c.set(4, y + 1, (90, 150, 220, a)); c.set(3, y + 2, (90, 150, 220, a))
    anim('fx_sweat', 7, 12, 4, 10, sweat, (3, 0), loop=False, note='sweat drop; spawn at the side of the head')
    def dust(c, f):
        for k in range(3):
            r = 1 + f * 0.8; x = 6 - k * 3 - f; y = 7 - (k % 2)
            c.ellipse(x, y, r, r * 0.7, (220, 214, 200, max(0, 200 - f * 50)))
    anim('fx_dust', 12, 10, 4, 12, dust, (8, 8), loop=False, note='running dust puff behind the feet (flip for direction)')
    def note(c, f):
        y = 9 - f * 2; a = 255 if f < 3 else 120
        col = (106, 74, 154, a); c.vline(4, y, 4, col); c.set(3, y + 4, col); c.set(2, y + 4, col); c.set(5, y, col); c.set(6, y + 1, col)
    anim('fx_note', 9, 16, 4, 6, note, (4, 15), loop=False, note='music note floating up (humming)')
    def heart(c, f):
        y = 8 - f * 2; col = (208, 72, 90, 255 - f * 45)
        for (i, j) in ((1, 0), (3, 0), (0, 1), (1, 1), (2, 1), (3, 1), (4, 1), (1, 2), (2, 2), (3, 2), (2, 3)): c.set(i + 2, y + j, col)
    anim('fx_heart', 9, 14, 4, 6, heart, (4, 13), loop=False)
    def bub(c, f):
        for k in range(4):
            y = 22 - ((f * 3 + k * 6) % 22); x = 3 + (1 if (y // 3 + k) % 2 else 0)
            c.set(x, y, (220, 250, 255, 220)); c.set(x + 1, y, (180, 230, 245, 160)) if k % 2 else None
    anim('fx_bubbles', 7, 24, 8, 8, bub, (3, 23), note='rising bubble column (aquarium, water cooler)')
    def steam(c, f):
        for k in range(3):
            t = (f + k * 2) % 6; y = 16 - t * 2.6; x = 5 + math.sin(t * 1.1 + k) * 1.8
            c.ellipse(x, y, 1.2 + t * 0.35, 1 + t * 0.25, (245, 246, 248, max(0, 210 - t * 34)))
    anim('fx_steam_big', 11, 20, 6, 6, steam, (5, 19), note='juicier coffee steam (6 frames)')
    def zzz(c, f):
        for k in range(3):
            t = (f + k * 2) % 6; y = int(15 - t * 2.2); x = int(2 + t * 1.4 + (k % 2)); a = max(0, 240 - t * 38); sz = 2 + (1 if t > 3 else 0)
            col = (110, 130, 180, a); c.hline(x, y - sz, sz + 1, col); c.set(x + sz - 1, y - sz + 1, col); c.hline(x, y, sz + 1, col)
    anim('fx_zzz_big', 14, 18, 6, 4, zzz, (2, 17), note='smoother Zzz (6 frames)')
    def spark(c, f):
        for k, (cx, cy) in enumerate(((4, 4), (11, 8), (6, 12))):
            s = [0, 1, 2, 1, 0, 0][(f + k * 2) % 6]
            col = (255, 236, 160, 255)
            if s: c.set(cx, cy, (255, 255, 255, 255))
            for d in range(1, s + 1): c.set(cx + d, cy, col); c.set(cx - d, cy, col); c.set(cx, cy + d, col); c.set(cx, cy - d, col)
    anim('fx_sparkles', 16, 16, 6, 10, spark, (8, 8), note='cluster of twinkles (rewards, new hire, polish)')
    rng = random.Random(8); parts = [(rng.uniform(-1, 1), rng.uniform(-1.8, -0.5), rng.choice([MUST, ORNG, TEAL, MINT, SEA, hx('#d0485a'), CREAM]), rng.choice((0, 1))) for _ in range(40)]
    def conf(c, f):
        t = f / 11
        for vx, vy, col, kind in parts:
            x = 24 + vx * 20 * t * 1.3; y = 30 + vy * 22 * t + 30 * t * t
            c.set(int(x), int(y), col)
            if kind and f % 2: c.set(int(x) + 1, int(y), shade(col, 0.75))
            elif kind: c.set(int(x), int(y) + 1, shade(col, 0.75))
    anim('fx_confetti_big', 48, 48, 12, 14, conf, (24, 32), loop=False)

# ---------------------------------------------------------------- island floor sets (per layout legend letter)
ISLES = {   # letter: (base, dark speck, light speck, rim, edge, pattern)
 'x': (hx('#3e6b54'), hx('#355e49'), hx('#4a7a60'), hx('#5a8a6e'), hx('#284a3a'), 'speck'),      # quiet annex: moss carpet
 'k': (hx('#e8e1cf'), hx('#cfc6ae'), hx('#f4efe2'), hx('#f6f2e6'), hx('#bfb59a'), 'checker'),    # kitchen: cream lino checker
 'l': (hx('#b98a3a'), hx('#a67a30'), hx('#c99a4a'), hx('#d4aa5a'), hx('#7a5a22'), 'stripe'),     # library rug: mustard
 'a': (hx('#8a6e52'), hx('#7c624a'), hx('#9a7e60'), hx('#a88c6c'), hx('#5a4430'), 'speck'),      # archive: brown
 'n': (hx('#b9d2c4'), hx('#a8c4b4'), hx('#cfe2d6'), hx('#dcebe2'), hx('#8aa898'), 'speck'),      # nap pods: pale sage
 'b': (hx('#2f6f68'), hx('#26605a'), hx('#c0622f'), hx('#43867c'), hx('#1f4a42'), 'geo'),        # break: teal + orange geometric
 'q': (hx('#9ccbc6'), hx('#8bbdb8'), hx('#b3dcd6'), hx('#c4e6e0'), hx('#5f948e'), 'wave'),       # aquarium: pale aqua terrazzo
 'g': (hx('#d9c58a'), hx('#c4ae6a'), hx('#ead8a0'), hx('#ece0b4'), hx('#a8904a'), 'straw'),      # goat pen: straw
 'm': (hx('#d6d9d6'), hx('#c4c8c4'), hx('#e6e8e6'), hx('#eceeec'), hx('#a8aca8'), 'speck'),      # mail: pale grey lino
 'i': (hx('#cfd8d4'), hx('#2f6f68'), hx('#e2e8e4'), hx('#e8eeea'), hx('#9aa8a2'), 'checker2'),   # IT: lino with teal checks
 'p': (hx('#4f7a3e'), hx('#456e36'), hx('#5d8a4a'), hx('#6a9a56'), hx('#2f5226'), 'speck'),      # plant wall: moss
 'v': (hx('#f2f1ec'), hx('#e6e4dc'), hx('#fbfaf6'), hx('#ffffff'), hx('#d6d3ca'), 'marble'),     # void offsite: white marble
 's': (hx('#2f6f68'), hx('#2b6660'), hx('#357a72'), hx('#43867c'), hx('#22524d'), 'speck'),      # team section (same as carpet_*)
}
def make_isles():
    for L, (base, d1, d2, rim, edge, pat) in ISLES.items():
        for nm, (l, r, t, b) in {'tl': (1, 0, 1, 0), 't': (0, 0, 1, 0), 'tr': (0, 1, 1, 0), 'l': (1, 0, 0, 0), 'c': (0, 0, 0, 0), 'r': (0, 1, 0, 0), 'bl': (1, 0, 0, 1), 'b': (0, 0, 0, 1), 'br': (0, 1, 0, 1)}.items():
            c = Cv(16, 16)
            for j in range(16):
                for i in range(16):
                    n = (i * 37 + j * 91 + (i * j) % 7) % 13; col = base
                    if pat == 'speck': col = d1 if n == 0 else d2 if n == 5 else base
                    elif pat == 'checker': col = base if ((i // 8) + (j // 8)) % 2 == 0 else d1
                    elif pat == 'checker2': col = base if ((i // 4) + (j // 4)) % 2 == 0 else (d2 if n % 2 else base); col = d1 if (i % 8 == 0 and j % 8 == 0) else col
                    elif pat == 'stripe': col = d1 if j % 4 == 0 else (d2 if n == 3 else base)
                    elif pat == 'geo': col = d2 if (i + j) % 16 in (0, 1) and (i // 8 + j // 8) % 2 == 0 else (d1 if n == 0 else base)
                    elif pat == 'wave': col = d2 if (j + round(math.sin(i * 0.8) * 1.5)) % 6 == 0 else (d1 if n == 0 else base)
                    elif pat == 'straw': col = d1 if (i * 3 + j * 5) % 7 == 0 else d2 if (i * 5 + j * 2) % 11 == 0 else base
                    elif pat == 'marble': col = d1 if (i + j * 2 + (i * j) % 5) % 17 == 0 else d2 if n == 2 else base
                    c.set(i, j, col)
            if t: c.hline(0, 0, 16, rim)
            if l: c.vline(0, 0, 16, rim)
            if r: c.vline(15, 0, 16, shade(base, 0.85))
            if b: c.hline(0, 14, 16, shade(base, 0.85)); c.hline(0, 15, 16, edge)
            for (cond, px, py) in ((t and l, 0, 0), (t and r, 15, 0), (b and l, 0, 15), (b and r, 15, 15)):
                if cond: c.px_clear(px, py)
            add(f'isle_{L}_{nm}', c, (0, 0), tile=True, kind='floor')
    # subtle corner-bracket meeting outline (replaces dashed outline_*)
    oc = (130, 145, 150, 170); oc2 = (130, 145, 150, 60)
    for nm, (l, r, t, b) in {'tl': (1, 0, 1, 0), 't': (0, 0, 1, 0), 'tr': (0, 1, 1, 0), 'l': (1, 0, 0, 0), 'r': (0, 1, 0, 0), 'bl': (1, 0, 0, 1), 'b': (0, 0, 0, 1), 'br': (0, 1, 0, 1)}.items():
        c = Cv(16, 16); corner = (l or r) and (t or b)
        for i in range(16):
            if t: c.set(i, 2, oc if corner and ((l and i < 7) or (r and i > 8)) else (oc2 if i % 4 == 0 else None))
            if b: c.set(i, 13, oc if corner and ((l and i < 7) or (r and i > 8)) else (oc2 if i % 4 == 0 else None))
            if l: c.set(2, i, oc if corner and ((t and i < 7) or (b and i > 8)) else (oc2 if i % 4 == 0 else None))
            if r: c.set(13, i, oc if corner and ((t and i < 7) or (b and i > 8)) else (oc2 if i % 4 == 0 else None))
        add(f'outline2_{nm}', c, (0, 0), tile=True, kind='floor', note='subtler meeting outline: crisp corner brackets + faint dotted edges')

# ---------------------------------------------------------------- slim baked signage (smaller + subtler)
def slim(text, style):
    tw = tinyfont.width(text); w = tw + 8; h = 11
    c = Cv(w + 2, h + 2)
    if style == 'cream': bg, fg, rim = hx('#f4efe2'), hx('#2f4a44'), hx('#8a7a62')
    elif style == 'dark': bg, fg, rim = hx('#12201c'), MINT, hx('#2c5a4e')
    else: bg, fg, rim = hx('#fbfaf6'), hx('#6f8a96'), hx('#d6d3ca')
    c.rect(1, 1, w, h, rim); c.rect(2, 2, w - 2, h - 2, bg)
    if style == 'dark': c.hline(2, 2, w - 2, hx('#1d3a32'))
    else: c.hline(2, 2, w - 2, shade(bg, 1.05))
    tinyfont.draw(c, 1 + (w - tw) // 2, 4, text, fg)
    c.hline(1, h + 1, w, shade(rim, 0.7) + () if False else (40, 52, 66, 50))
    return c
def make_signs(data):
    L = data['layout']
    for s_ in L.get('signs', []):
        c = slim(s_['text'], 'cream' if s_.get('kind') == 'motivational' else 'ghost')
        add(f"signtxt_{s_['id']}", c, (c.w // 2, c.h - 1), kind='sign', float=True, text=s_['text'], note='slim baked sign (3x5 font). Float 10px above sign_shadow_small')
    for sec in L.get('sections', []):
        c = slim(sec['name'], 'dark'); add(f"sectxt_{sec['id']}", c, (c.w // 2, c.h - 1), kind='sign', float=True, text=sec['name'])
    for r in data.get('rooms', []):
        t = f"{r['name']} · {r.get('capacity', '')}"
        c = slim(t, 'dark'); add(f"roomtxt_{r['id']}", c, (c.w // 2, c.h - 1), kind='sign', float=True, text=t)
    c = Cv(30, 5); c.ellipse(15, 2.5, 13, 1.6, SHC + (26,)); c.ellipse(15, 2.5, 8, 1, SHC + (40,)); add('sign_shadow_small', c, (15, 2), kind='shadow')
    # slim 9-slice for engine-rendered text (VT323/Silkscreen too big? use 3x5 baked instead)
    for nm, st in (('sign_slim_cream', 'cream'), ('sign_slim_dark', 'dark'), ('sign_slim_ghost', 'ghost')):
        c = slim('', st); add(nm, c, (0, 0), slice=3, kind='ui', note='9-slice (3px) slim plaque, 11px tall: for runtime text use the 3x5 baked glyph atlas `tiny_font`')
    # glyph atlas for the 3x5 font so the engine can render arbitrary slim text
    chars = ''.join(sorted(tinyfont.G.keys()))
    c = Cv(len(chars) * 5, 5); x = 0; gm = {}
    for ch in chars:
        w = len(tinyfont.G[ch].split('|')[0]); tinyfont.draw(c, x, 0, ch, (255, 255, 255, 255)); gm[ch] = [x, w]; x += w + 1
    c.im = c.im.crop((0, 0, max(1, x), 5)); c.w = c.im.width; c.px = c.im.load()
    add('tiny_font', c, (0, 0), kind='ui', glyphs=gm, glyph_h=5, space=2, note='white 3x5 caps glyphs: glyphs[ch] = [x, width] in this frame; tint at draw time; 1px letter spacing')
def build(data):
    make_furniture(); make_belongings(); make_fx(); make_isles(); make_signs(data)

def make_corridor():
    # endless void corridor: a pale strip with dashed centre line, slightly cooler than the void; tiles along x
    c = Cv(16, 16)
    c.rect(0, 2, 16, 12, hx('#eef0ee')); c.hline(0, 2, 16, hx('#dfe3e1')); c.hline(0, 13, 16, hx('#d6dbd9')); c.hline(0, 14, 16, hx('#e4e6e2', 140))
    for x in (2, 3, 4, 5, 10, 11, 12, 13): c.set(x, 8, hx('#c9d3cf'))
    c.set(7, 5, hx('#e2e6e4')); c.set(14, 11, hx('#e2e6e4'))
    add('corridor-strip', [c], (0, 0), tile=True, kind='floor', note='endless void corridor tile; repeat along x for the strip length (data w), y-anchor = tile top')
_ob = build
def build(data):
    _ob(data); make_corridor()
