from PIL import Image
def hx(s, a=255):
    s = s.lstrip('#'); return (int(s[0:2],16), int(s[2:4],16), int(s[4:6],16), a)
def shade(c, f):
    r,g,b,a = c
    if f < 1:  # darken, cool shift toward blue-purple
        return (int(r*f), int(g*f), int(min(255, b*f + (1-f)*22)), a)
    return (min(255,int(r+(255-r)*(f-1))), min(255,int(g+(255-g)*(f-1))), min(255,int(b+(255-b)*(f-1))), a)
def lerp(c1, c2, t):
    return tuple(int(c1[i]+(c2[i]-c1[i])*t) for i in range(4))

class Cv:
    def __init__(s, w, h):
        s.w, s.h = w, h; s.im = Image.new('RGBA', (w, h), (0,0,0,0)); s.px = s.im.load()
    def set(s, x, y, c):
        if c is None: return
        x, y = int(x), int(y)
        if 0 <= x < s.w and 0 <= y < s.h:
            if len(c) == 4 and c[3] < 255:
                o = s.px[x, y]
                if o[3] == 0: s.px[x, y] = c
                else:
                    a = c[3]/255
                    s.px[x, y] = (int(o[0]*(1-a)+c[0]*a), int(o[1]*(1-a)+c[1]*a), int(o[2]*(1-a)+c[2]*a), max(o[3], c[3]))
            else: s.px[x, y] = c
    def get(s, x, y):
        if 0 <= x < s.w and 0 <= y < s.h: return s.px[x, y]
        return (0,0,0,0)
    def rect(s, x, y, w, h, c):
        for j in range(int(y), int(y+h)):
            for i in range(int(x), int(x+w)): s.set(i, j, c)
    def hline(s, x, y, w, c): s.rect(x, y, w, 1, c)
    def vline(s, x, y, h, c): s.rect(x, y, 1, h, c)
    def rrect(s, x, y, w, h, c, r=1):
        s.rect(x, y, w, h, c)
        if r >= 1:
            for (i, j) in [(x, y), (x+w-1, y), (x, y+h-1), (x+w-1, y+h-1)]: s.px_clear(i, j)
        if r >= 2:
            for (i, j) in [(x+1, y), (x, y+1), (x+w-2, y), (x+w-1, y+1), (x, y+h-2), (x+1, y+h-1), (x+w-1, y+h-2), (x+w-2, y+h-1)]: s.px_clear(i, j)
    def px_clear(s, x, y):
        if 0 <= x < s.w and 0 <= y < s.h: s.px[x, y] = (0,0,0,0)
    def ellipse(s, cx, cy, rx, ry, c):
        for j in range(int(cy-ry-1), int(cy+ry+2)):
            for i in range(int(cx-rx-1), int(cx+rx+2)):
                if ((i+0.5-cx)/rx)**2 + ((j+0.5-cy)/ry)**2 <= 1: s.set(i, j, c)
    def mask(s, ox, oy, rows, cmap):
        for j, row in enumerate(rows):
            for i, ch in enumerate(row):
                if ch in cmap and cmap[ch] is not None: s.set(ox+i, oy+j, cmap[ch])
    def blit(s, other, x, y):
        im = other.im if isinstance(other, Cv) else other
        s.im.alpha_composite(im, (int(x), int(y))); s.px = s.im.load()
    def outline(s, f=0.42, only_empty=True, tint=None):
        """selective outline: transparent px touching opaque gets a darkened neighbour colour"""
        src = s.im.copy(); sp = src.load(); out = []
        for y in range(s.h):
            for x in range(s.w):
                if sp[x, y][3] != 0: continue
                for dx, dy in ((0,1),(0,-1),(1,0),(-1,0)):
                    nx, ny = x+dx, y+dy
                    if 0 <= nx < s.w and 0 <= ny < s.h and sp[nx, ny][3] > 200:
                        c = sp[nx, ny]; o = shade(c, f) if tint is None else tint
                        out.append((x, y, (o[0], o[1], o[2], 255))); break
        for x, y, c in out: s.px[x, y] = c

def shadow(cv, x, y, w, h, a1=58, a2=26, col=(40,52,66)):
    """two-tone crisp soft contact shadow (rounded) — call BEFORE drawing the object"""
    cv.ellipse(x + w/2, y + h/2, w/2 + 1.2, h/2 + 0.9, col + (a2,))
    cv.ellipse(x + w/2, y + h/2, w/2, h/2, col + (a1,))
def shadow_rect(cv, x, y, w, h, a1=56, a2=24, col=(40,52,66)):
    cv.rrect(x-1, y-1, w+2, h+2, col+(a2,), 2)
    cv.rrect(x, y, w, h, col+(a1,), 1)
