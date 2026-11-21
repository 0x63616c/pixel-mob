from common import *
CW, CH = 24, 32          # cell size
FOOT = (12, 30)          # foot anchor inside cell (feet bottom row = 30)
DIRS = ['S', 'N', 'E', 'W']
ANIMS = [  # name, frames, fps, loop
    ('idle', 8, 4, True), ('walk', 4, 8, True), ('run', 4, 12, True), ('talk', 4, 6, True),
    ('type', 4, 8, True), ('sleep', 4, 2, True), ('celebrate', 4, 8, True), ('facepalm', 4, 5, False),
    ('sit', 2, 1, True), ('drink', 4, 3, True), ('tired', 4, 2, True), ('phone', 4, 4, True), ('knock', 4, 6, True),
    ('wave', 4, 6, True), ('clap', 4, 8, True), ('flashlight', 4, 7, True),
    ('stretch', 6, 5, False), ('nod', 4, 5, True), ('doze', 8, 3, True), ('bow', 4, 4, False), ('pet', 4, 5, True), ('fidget', 6, 5, True)]

SKINS = ['#f4d6ba', '#e9bc94', '#d49e70', '#b17a4c', '#8b5838', '#5f3b24']
# ---------------- hair masks (12 x 14, origin at cell (6,4); head occupies cols 2..9 rows 4..11) ----------------
E = '............'
HAIR = {
 'short': {
  'S': [E,E,E,'...HHHHHH...','..HHHHHHHH..','..HhHHHHhH..','..H......H..','..h......h..'],
  'N': [E,E,E,'...HHHHHH...','..HHHHHHHH..','..HHHHHHHH..','..HHHHHHHH..','..HHHHHHHH..','..HhHHHHhH..','..hHHHHHHh..','...hhhhhh...'],
  'E': [E,E,E,'...HHHHHH...','..HHHHHHHH..','..HHHHHHhH..','..HHHH......','..HHH.......','..HHH.......','..hH........'] },
 'sidepart': {
  'S': [E,E,E,'..HHHHHHH...','..HHHHHHHHH.','..HHHHHhHHH.','..HH.....hH.','..H......H..','..h......h..'],
  'N': [E,E,E,'..HHHHHHH...','..HHHHHHHHH.','..HHHHHHHHH.','..HHHHHHHHH.','..HHHHHHHH..','..HHHHHHHH..','..hHHHHHHh..','...hhhhhh...'],
  'E': [E,E,E,'..HHHHHHH...','..HHHHHHHHH.','..HHHHHHHhH.','..HHHH...h..','..HHH.......','..HHH.......','..hH........'] },
 'long': {
  'S': [E,E,E,'...HHHHHH...','..HHHHHHHH..','.HHhHHHHhHH.','.HH......HH.','.HH......HH.','.HH......HH.','.HH......HH.','.Hh......hH.','.hH......Hh.','..h......h..'],
  'N': [E,E,E,'...HHHHHH...','..HHHHHHHH..','.HHHHHHHHHH.','.HHHHHHHHHH.','.HHHHHHHHHH.','.HHHHHHHHHH.','.HHHHHHHHHH.','.HHhHHHHhHH.','.hHHHHHHHHh.','..hHHhhHHh..','...hh..hh...'],
  'E': [E,E,E,'...HHHHHH...','..HHHHHHHH..','.HHHHHHHhH..','.HHHHH......','.HHHH.......','.HHHH.......','.HHHH.......','.HHHh.......','.hHH........','..h.........'] },
 'bob': {
  'S': [E,E,'...HHHHHH...','..HHHHHHHH..','.HHHHHHHHHH.','.HHhhhhhhHH.','.HH......HH.','.HH......HH.','.HH......HH.','.hH......Hh.','..h......h..'],
  'N': [E,E,'...HHHHHH...','..HHHHHHHH..','.HHHHHHHHHH.','.HHHHHHHHHH.','.HHHHHHHHHH.','.HHHHHHHHHH.','.HHHHHHHHHH.','.hHHHHHHHHh.','..hhhhhhhh..'],
  'E': [E,E,'...HHHHHH...','..HHHHHHHH..','.HHHHHHHHHH.','.HHHHHHhhh..','.HHHH.......','.HHHH.......','.HHHH.......','.hHHh.......','..hh........'] },
 'afro': {
  'S': ['....HHHH....','..HHHHHHHH..','.HHHHHHHHHH.','HHHHHHHHHHHH','HHHHHHHHHHHH','HHHhHHHHhHHH','HHH......HHH','HHh......hHH','hH........Hh','.h........h.'],
  'N': ['....HHHH....','..HHHHHHHH..','.HHHHHHHHHH.','HHHHHHHHHHHH','HHHHHHHHHHHH','HHHHHHHHHHHH','HHHHHHHHHHHH','HHHHHHHHHHHH','hHHHHHHHHHHh','.hHHHHHHHHh.','..hhHHHHhh..','....hhhh....'],
  'E': ['....HHHH....','..HHHHHHHH..','.HHHHHHHHHH.','HHHHHHHHHHHH','HHHHHHHHHHH.','HHHHHHHhHH..','HHHHHH......','HHHHH.......','hHHHH.......','.hHHh.......','..hh........'] },
 'bald': {
  'S': [E,E,E,E,E,E,'..h......h..','..h......h..'],
  'N': [E,E,E,E,E,E,'..hhhhhhhh..','..HHHHHHHH..','..hHHHHHHh..'],
  'E': [E,E,E,E,E,E,'..hhh.......','..HHH.......','..hH........'] },
 'bun': {
  'S': [E,'....HHHH....','....HhhH....','...HHHHHH...','..HHHHHHHH..','..HhHHHHhH..','..H......H..','..h......h..'],
  'N': [E,'....HHHH....','....HHHH....','...HHHHHH...','..HHHHHHHH..','..HHHHHHHH..','..HHHHHHHH..','..HHHHHHHH..','..HhHHHHhH..','..hHHHHHHh..','...hhhhhh...'],
  'E': [E,'.HHH........','.HhH........','..HHHHHH....','..HHHHHHHH..','..HHHHHHhH..','..HHHH......','..HHH.......','..HHH.......','..hH........'] },
 'mullet': {
  'S': [E,E,'...HHHHHH...','..HHHHHHHH..','..HHHHHHHH..','..HhhhhhhH..','..H......H..','..H......H..','.HH......HH.','.Hh......hH.','.h........h.'],
  'N': [E,E,'...HHHHHH...','..HHHHHHHH..','..HHHHHHHH..','..HHHHHHHH..','..HHHHHHHH..','..HHHHHHHH..','.HHHHHHHHHH.','.HHHHHHHHHH.','.HHhHHHHhHH.','.hHHHHHHHHh.','..hhhhhhhh..'],
  'E': [E,E,'...HHHHHH...','..HHHHHHHH..','..HHHHHHHH..','..HHHHHhhh..','..HHHH......','..HHH.......','.HHHH.......','.HHHH.......','.HHhh.......','.hh.........'] },
 'feather': {
  'S': [E,E,'..HHHHHHH...','.HHHHHHHHHH.','.HHHHHHHHHH.','.HHhHH.hhHH.','.HH......HH.','.HH......HH.','.Hh......hH.','..h......h..'],
  'N': [E,E,'..HHHHHHH...','.HHHHHHHHHH.','.HHHHHHHHHH.','.HHHHHHHHHH.','.HHHHHHHHHH.','.HHHHHHHHHH.','.HHHHHHHHHH.','.hHHHHHHHHh.','..hhhhhhhh..'],
  'E': [E,E,'..HHHHHHH...','.HHHHHHHHHH.','.HHHHHHHHHH.','.HHHHHHhhh..','.HHHH.......','.HHHH.......','.HhHH.......','..hh........'] },
 'cap': {  # facilities cap
  'S': [E,E,E,'...CCCCCC...','..CCCCCCCC..','..cCCCCCCc..','..cccccccc..','..H......H..'],
  'N': [E,E,E,'...CCCCCC...','..CCCCCCCC..','..CCCCCCCC..','..cCCCCCCc..','..HHHHHHHH..','..HHHHHHHH..','..hHHHHHHh..'],
  'E': [E,E,E,'...CCCCCC...','..CCCCCCCC..','..CCCCCCCCcc','..HHHH......','..HHH.......','..hH........'] },
}
HAIR.update({
 'curly': {'S': [E,E,'...H.HH.H...','..HHHHHHHH..','.HHHHHHHHHH.','.HhHhHHhHhH.','.HH......HH.','.Hh......hH.','..h......h..'],
           'N': [E,E,'...H.HH.H...','..HHHHHHHH..','.HHHHHHHHHH.','.HHhHHHHhHH.','.HHHHHHHHHH.','.HhHHhHHhHH.','.HHHHHHHHHH.','.hHhHHhHHhh.','..hhhhhhhh..'],
           'E': [E,E,'...H.HH.H...','..HHHHHHHH..','.HHHHHHHHHH.','.HhHHHhHhH..','.HHHHh......','.HHHH.......','.hHHh.......','..hh........']},
 'pony': {'S': [E,E,E,'...HHHHHH...','..HHHHHHHH..','..HhHHHHhH..','..H......H..','..h......h..'],
          'N': [E,E,E,'...HHHHHH...','..HHHHHHHH..','..HHHHHHHH..','..HHHHHHHH..','..HHHhhHHH..','..HHHHHHHH..','..hHHHHHHh..','...hhHHhh...','.....HH.....','.....Hh.....','.....h......'],
          'E': [E,E,E,'...HHHHHH...','..HHHHHHHH..','.HHHHHHHhH..','HHHHHH......','HhHHH.......','.hHHH.......','..hH........']},
 'buzz': {'S': [E,E,E,E,'..hHHHHHHh..','..h......h..'], 'N': [E,E,E,E,'..hHHHHHHh..','..HHHHHHHH..','..hHHHHHHh..','..hhhhhhhh..'], 'E': [E,E,E,E,'..hHHHHHHh..','..hHH.......','..hh........']},
 'hijab': {'S': [E,E,E,'...HHHHHH...','..HHHHHHHH..','.HHHHHHHHHH.','.HH......HH.','.HH......HH.','.HH......HH.','.HH......HH.','.HHh....hHH.','.hHHHHHHHHh.','..hhhhhhhh..'],
           'N': [E,E,E,'...HHHHHH...','..HHHHHHHH..','.HHHHHHHHHH.','.HHHHHHHHHH.','.HHHHHHHHHH.','.HHHHHHHHHH.','.HHHHHHHHHH.','.HHHHHHHHHH.','.hHHHHHHHHh.','..hhhhhhhh..'],
           'E': [E,E,E,'...HHHHHH...','..HHHHHHHH..','.HHHHHHHHH..','.HHHHH......','.HHHH.......','.HHHH.......','.HHHH.......','.HHHHh......','.hHHHHH.....','..hhhh......']},
 'mohawk': {'S': [E,'.....HH.....','.....HH.....','.....HH.....','..h..HH..h..','..h..hh..h..'],
            'N': [E,'.....HH.....','.....HH.....','.....HH.....','..h..HH..h..','..h..HH..h..','..h..HH..h..','..h..Hh..h..','..hhhhhhhh..'],
            'E': [E,'....HHH.....','...HHHH.....','..HHHH......','..hHH.......','..hh........']},
 'beanie': {'S': [E,E,'...CCCCCC...','..CCCCCCCC..','..CCCCCCCC..','..cccccccc..','..H......H..'],
            'N': [E,E,'...CCCCCC...','..CCCCCCCC..','..CCCCCCCC..','..CCCCCCCC..','..cccccccc..','..HHHHHHHH..','..hHHHHHHh..'],
            'E': [E,E,'...CCCCCC...','..CCCCCCCC..','..CCCCCCCC..','..ccccccccc.','..HHH.......','..hH........']},
})

def cell(): return Cv(CW, CH)

def pose_for(anim, d, f):
    p = dict(bob=0, liftL=0, liftR=0, stride=0, armL='down', armR='down', eyes='open', mouth=None,
             sit=False, hdy=0, hdx=0, top=False, lean=0)
    side = d in 'EW'
    if anim == 'idle':
        p['eyes'] = ['open', 'open', 'open', 'open', 'open', 'closed', 'open', 'side'][f]
        p['breath'] = 1 if f in (2, 3, 4) else 0
    elif anim in ('walk', 'run'):
        big = anim == 'run'
        p['bob'] = [0, -1, 0, -1][f] * (2 if big else 1)
        if side:
            p['stride'] = [2, 0, -2, 0][f] * (2 if big else 1) // (1 if big else 1)
            if big: p['stride'] = [3, 0, -3, 0][f]
            p['armL'] = ['fwd', 'down', 'back', 'down'][f]
            p['armR'] = ['back', 'down', 'fwd', 'down'][f]
            if big: p['lean'] = 1
        else:
            p['liftL'] = [1, 0, 0, 0][f] * (2 if big else 1)
            p['liftR'] = [0, 0, 1, 0][f] * (2 if big else 1)
            p['armL'] = ['back', 'down', 'fwd', 'down'][f]
            p['armR'] = ['fwd', 'down', 'back', 'down'][f]
            if big:
                p['armL'] = ['runback', 'run', 'runfwd', 'run'][f]; p['armR'] = ['runfwd', 'run', 'runback', 'run'][f]
        if big: p['mouth'] = 'open' if f % 2 else None
    elif anim == 'talk':
        p['mouth'] = ['open', None, 'open', 'o'][f]
        p['armR'] = ['down', 'gesture', 'gesture', 'down'][f]
        p['hdy'] = [0, 0, 0, 0][f]
    elif anim == 'type':
        p['sit'] = True; p['armL'] = 'type'; p['armR'] = 'type'
        p['typeL'] = [0, 1, 0, 0][f]; p['typeR'] = [0, 0, 0, 1][f]; p['hdy'] = [0, 1, 0, 1][f]
        p['eyes'] = 'open' if f != 2 else 'open'
    elif anim == 'sit':
        p['sit'] = True; p['armL'] = 'rest'; p['armR'] = 'rest'; p['eyes'] = ['open', 'closed'][f]
    elif anim == 'sleep':
        p['sit'] = True; p['armL'] = 'fold'; p['armR'] = 'fold'; p['top'] = True
        p['hdy'] = 4 + (1 if f in (1, 2) else 0); p['eyes'] = 'closed'
        if side: p['hdx'] = 2; p['hdy'] = 3 + (1 if f in (1, 2) else 0)
    elif anim == 'celebrate':
        p['bob'] = [0, -2, -3, -1][f]; p['armL'] = 'up'; p['armR'] = 'up'; p['mouth'] = 'open'
        if f == 0: p['armL'] = 'half'; p['armR'] = 'half'; p['eyes'] = 'closed'
        if f == 2: p['eyes'] = 'happy'
    elif anim == 'facepalm':
        p['armR'] = ['gesture', 'face', 'face', 'face'][f]; p['hdy'] = [0, 1, 1, 1][f]
        p['hdx'] = [0, 0, -1, 1][f] if not side else 0; p['eyes'] = 'closed'
    elif anim == 'stretch':
        p['armL'] = p['armR'] = ['half', 'up', 'up', 'up', 'half', 'down'][f]; p['eyes'] = ['open', 'closed', 'closed', 'closed', 'open', 'open'][f]
        p['mouth'] = [None, 'o', 'open', 'o', None, None][f]; p['bob'] = [0, -1, -1, -1, 0, 0][f]
    elif anim == 'nod':
        p['hdy'] = [0, 1, 0, 1][f]; p['eyes'] = ['open', 'closed', 'open', 'closed'][f]; p['mouth'] = 'o' if f == 2 else None
    elif anim == 'doze':
        p['sit'] = True; p['armL'] = p['armR'] = 'rest'
        p['hdy'] = [0, 1, 1, 2, 3, 3, 0, 0][f]; p['eyes'] = ['droop', 'droop', 'closed', 'closed', 'closed', 'closed', 'open', 'droop'][f]
        if f == 6: p['bob'] = -1   # jolts awake
    elif anim == 'bow':
        p['hdy'] = [0, 2, 3, 1][f]; p['top'] = f in (1, 2); p['bob'] = [0, 1, 1, 0][f]
    elif anim == 'pet':
        p['sit'] = True; p['armR'] = ['petA', 'petB', 'petA', 'petB'][f]; p['eyes'] = 'happy' if f % 2 else 'open'; p['hdy'] = 1
    elif anim == 'fidget':
        p['liftR'] = [0, 1, 0, 1, 0, 0][f]; p['armL'] = ['down', 'down', 'down', 'watch', 'watch', 'down'][f]; p['eyes'] = ['open', 'side', 'open', 'open', 'open', 'side'][f]
        p['hdy'] = 1 if f in (3, 4) else 0
    elif anim == 'tired':
        p['eyes'] = ['droop', 'droop', 'closed', 'droop'][f]; p['hdy'] = [0, 1, 1, 0][f]; p['bob'] = [0, 0, 1, 0][f]
    elif anim == 'phone':
        p['armR'] = 'phone'; p['mouth'] = ['open', None, 'o', None][f]; p['eyes'] = 'side' if f == 2 else 'open'
    elif anim == 'knock':
        p['armR'] = ['knockup', 'knock', 'knockup', 'knock'][f]
    elif anim == 'wave':
        p['armR'] = ['wave0', 'wave1', 'wave0', 'wave1'][f]; p['mouth'] = 'o' if f % 2 else None
    elif anim == 'clap':
        p['armL'] = p['armR'] = ['clapopen', 'clap', 'clapopen', 'clap'][f]; p['mouth'] = 'open'; p['eyes'] = 'happy' if f % 2 else 'open'
    elif anim == 'flashlight':
        p.update(pose_for('walk', d, f)); p['armR'] = 'torch'; p['eyes'] = 'side' if d == 'S' and f == 3 else 'open'
    elif anim == 'drink':
        p['armR'] = ['cup', 'sip', 'sip', 'cup'][f]; p['eyes'] = ['open', 'closed', 'closed', 'open'][f]
    return p

def palette(look):
    sk = look.get('skin', 0)
    skin = hx(SKINS[sk] if isinstance(sk, int) else sk)
    L = {
      'skin': skin, 'skin_s': shade(skin, 0.82), 'skin_h': shade(skin, 1.08),
      'hair': hx(look.get('hair', '#3a2a1e')),
      'top': hx(look.get('topColor', '#2c3a57')), 'inner': hx(look.get('innerColor', '#efe6d0')),
      'pants': hx(look.get('pants', '#3a3a40')), 'shoes': hx(look.get('shoes', '#2a211c')),
      'tie': hx(look.get('tieColor', '#8f3f26')), 'cap': hx(look.get('capColor', '#7d8287')),
    }
    L['hair_s'] = shade(L['hair'], 0.72); L['top_s'] = shade(L['top'], 0.78); L['top_h'] = shade(L['top'], 1.12)
    L['inner_s'] = shade(L['inner'], 0.85); L['pants_s'] = shade(L['pants'], 0.75); L['eye'] = hx('#1d1a22')
    L['mouth'] = hx('#7a2e2e')
    return L

def draw_person(look, anim, d, f):
    """Returns a 24x32 Cv for one frame. W is mirrored E."""
    if d == 'W':
        c = draw_person(look, anim, 'E', f); c.im = c.im.transpose(Image.FLIP_LEFT_RIGHT); c.px = c.im.load(); return c
    c = cell(); P = palette(look); p = pose_for(anim, d, f)
    top = look.get('top', 'shirt'); acc = set(look.get('acc', []))
    sitdy = 3 if p['sit'] else 0
    U = p['bob'] + sitdy - p.get('breath', 0)
    HY = 8 + U + p['hdy']; HX = 8 + p['hdx'] + (p['lean'] if d == 'E' else 0)
    TY = 16 + U
    side = d == 'E'
    sleeve = P['inner'] if top == 'vest' else P['top'] if top in ('suit', 'cardigan', 'turtleneck', 'jumpsuit', 'sweater', 'blouse', 'dress') else P['top']
    sleeve_s = shade(sleeve, 0.8)
    pants = P['top'] if top in ('jumpsuit', 'dress') else P['pants']
    pants_s = shade(pants, 0.75)
    if top == 'dress': pants = P['top']
    # ---------- legs ----------
    legtop = TY + 7
    if not p['sit']:
        if not side:
            for lx, lift in ((9, p['liftL']), (12, p['liftR'])):
                bottom = 28 - lift
                if top == 'dress':
                    c.rect(lx+1, max(legtop, 26), 2, bottom - max(legtop, 26) + 1, P['skin_s'])
                else:
                    c.rect(lx, legtop, 3, bottom - legtop + 1, pants)
                    c.vline(lx + (2 if lx == 12 else 0), legtop, bottom - legtop + 1, pants_s)
                c.rect(lx, bottom + 1, 3, 2, P['shoes']); c.set(lx + (0 if lx == 9 else 2), bottom + 2, shade(P['shoes'], 0.7))
                if d == 'S': c.set(lx + 1, bottom + 1, shade(P['shoes'], 1.35))
        else:
            s = p['stride']; L = 28 - legtop + 1
            for which, col, base, sgn in (('back', pants_s, 10, -1), ('front', pants, 11, 1)):
                for r in range(L):
                    off = round(sgn * s * (r + 1) / L)
                    if top == 'dress' and legtop + r < 26:
                        continue
                    cc = col if top != 'dress' else (P['skin_s'] if which == 'back' else P['skin'])
                    c.rect(base + off, legtop + r, 2 if top == 'dress' else 3, 1, cc)
                off = round(sgn * s)
                sh = P['shoes'] if which == 'front' else shade(P['shoes'], 0.75)
                c.rect(base + off, 29, 4, 2, sh); c.set(base + off + 3, 29, None)
                if which == 'front': c.set(base + off + 1, 29, shade(P['shoes'], 1.35))
    else:
        if d == 'S':
            c.rect(8, legtop, 8, 2, pants); c.rect(8, legtop + 1, 8, 1, pants_s)
            c.rect(9, legtop + 2, 2, 28 - legtop - 1, pants); c.rect(13, legtop + 2, 2, 28 - legtop - 1, pants)
            c.rect(9, 29, 3, 2, P['shoes']); c.rect(12, 29, 3, 2, P['shoes'])
        elif d == 'N':
            c.rect(8, legtop, 8, 2, pants_s)
        else:
            c.rect(10, legtop, 6, 2, pants); c.hline(10, legtop + 1, 6, pants_s)
            c.rect(14, legtop + 2, 2, 28 - legtop - 1, pants); c.rect(14, 29, 4, 2, P['shoes'])
    # ---------- torso ----------
    tx, tw = (8, 8) if not side else (9, 6)
    tx += (p['lean'] if side else 0)
    c.rect(tx, TY, tw, 7, P['top'])
    c.vline(tx + tw - 1, TY, 7, P['top_s']); c.hline(tx, TY + 6, tw, P['top_s'])
    c.set(tx, TY, None); c.set(tx + tw - 1, TY, None)  # round shoulders
    c.vline(tx, TY + 1, 4, P['top_h']) if not side else None
    if top == 'dress':
        c.rect(tx - 1, TY + 6, tw + 2, 3, P['top']); c.hline(tx - 1, TY + 8, tw + 2, P['top_s'])
    if d == 'S':
        if top in ('shirt', 'blouse'):
            c.set(10, TY, P['top_h']); c.set(13, TY, P['top_h'])
            c.hline(tx, TY + 6, tw, shade(P['pants'], 0.6))  # belt
            c.set(12, TY + 6, hx('#c9a03a'))
        if top == 'suit':
            c.rect(10, TY, 4, 2, P['inner']); c.rect(11, TY + 2, 2, 1, P['inner'])
            c.set(10, TY + 1, P['top_s']); c.set(13, TY + 1, P['top_s'])
            c.set(12, TY + 4, shade(P['top'], 0.6))
        if top == 'cardigan':
            c.rect(10, TY, 4, 6, P['inner']); c.vline(13, TY, 6, P['inner_s'])
            c.set(10, TY + 2, shade(P['top'], 0.7)); c.set(10, TY + 4, shade(P['top'], 0.7))
            c.hline(tx, TY + 6, tw, P['top_s'])
        if top == 'turtleneck':
            c.rect(10, TY - 1, 4, 2, P['top_h']); c.hline(10, TY, 4, P['top'])
        if top == 'vest':
            c.rect(10, TY, 4, 2, P['inner']); c.rect(11, TY + 2, 2, 1, P['inner']); c.hline(tx, TY + 6, tw, shade(P['pants'], 0.6))
            c.set(9, TY + 3, P['top_h']); c.set(14, TY + 3, P['top_s'])
        if top == 'sweater':
            c.hline(tx + 1, TY + 6, tw - 2, P['top_s']); c.rect(10, TY, 4, 1, P['inner'])
            c.hline(tx, TY + 3, tw, shade(P['top'], 1.25))
        if top == 'jumpsuit':
            c.rect(10, TY, 4, 1, P['top_h']); c.set(9, TY + 2, hx('#f2efe6')); c.set(10, TY + 2, hx('#f2efe6'))
            c.hline(tx, TY + 5, tw, P['top_s'])
        if 'tie' in acc and top in ('suit', 'shirt', 'cardigan', 'sweater'):
            c.vline(11, TY, 1, P['tie']); c.vline(12, TY, 1, P['tie'])
            c.rect(11, TY + 1, 2, 4, P['tie']); c.set(12, TY + 1, shade(P['tie'], 0.75)); c.set(11, TY + 5, P['tie'])
        if 'badge' in acc:
            c.set(14, TY + 2, hx('#f2efe6')); c.set(14, TY + 3, hx('#7cc4b0'))
    elif d == 'N':
        if top == 'suit': c.vline(11, TY + 3, 3, P['top_s'])
        if top in ('shirt', 'blouse'): c.hline(tx, TY + 6, tw, shade(P['pants'], 0.6))
        if top == 'turtleneck': c.rect(10, TY - 1, 4, 2, P['top'])
        if top == 'jumpsuit': c.rect(10, TY + 1, 4, 2, hx('#8a8f94'))
    else:
        if top == 'suit': c.set(tx + tw - 2, TY, P['inner']); c.set(tx + tw - 1, TY + 1, P['inner'])
        if top in ('shirt', 'blouse'): c.hline(tx, TY + 6, tw, shade(P['pants'], 0.6))
        if top == 'turtleneck': c.rect(tx + 2, TY - 1, 3, 2, P['top'])
        if 'tie' in acc and top in ('suit', 'shirt', 'cardigan', 'sweater'): c.vline(tx + tw - 1, TY + 1, 4, P['tie'])
    # neck
    if top != 'turtleneck':
        if not side: c.rect(11, TY - 1, 2, 1, P['skin_s'])
        else: c.rect(tx + 2, TY - 1, 2, 1, P['skin_s'])
    # ---------- arms (behind-head ones first) ----------
    def arm_front(mode, left, tt=0):
        x = 7 if left else 16; sgn = -1 if left else 1; ix = 8 if left else 15
        if mode in ('down', 'fwd', 'back', 'rest'):
            ln = {'down': 5, 'fwd': 5, 'back': 4, 'rest': 4}[mode]; dy = 1 if mode == 'fwd' else 0
            c.rect(x, TY + 1 + dy, 1, ln, sleeve); c.set(x, TY + 1 + ln + dy, P['skin'])
            if mode == 'rest': c.set(x - sgn, TY + 5, P['skin'])
        elif mode in ('run', 'runfwd', 'runback'):
            dy = {'run': 0, 'runfwd': -1, 'runback': 1}[mode]
            c.rect(x, TY + 1, 1, 3, sleeve); c.set(x, TY + 4 + dy, sleeve); c.set(x - sgn * 0, TY + 4 + dy, sleeve)
            c.set(ix if mode == 'runfwd' else x, TY + 4 + dy, P['skin'])
        elif mode == 'up':
            c.rect(x, TY - 4, 1, 5, sleeve); c.set(x, TY - 5, P['skin']); c.set(x + sgn, TY - 5, P['skin'])
        elif mode == 'half':
            c.rect(x, TY, 1, 3, sleeve); c.set(x + sgn, TY - 1, sleeve); c.set(x + sgn, TY - 2, P['skin'])
        elif mode == 'type':
            c.rect(x, TY + 1, 1, 3, sleeve)
            hx_ = 9 if left else 14
            if d == 'S':
                c.set(x, TY + 4, sleeve); c.set(ix, TY + 5, sleeve)
                c.rect(hx_ if left else hx_ - 1, TY + 6 - tt, 2, 1, P['skin'])
        elif mode == 'fold':
            c.rect(x, TY + 1, 1, 3, sleeve)
        elif mode == 'gesture':
            c.rect(x, TY + 1, 1, 3, sleeve); c.set(x + sgn, TY + 1, sleeve); c.set(x + sgn, TY, P['skin'])
        elif mode in ('face', 'cup', 'sip', 'phone', 'clap', 'clapopen', 'torch'):
            c.rect(x, TY + 1, 1, 2, sleeve)
        elif mode in ('petA', 'petB'):
            o = 0 if mode == 'petA' else 1
            c.rect(x, TY + 1, 1, 4, sleeve); c.set(x - sgn * o, TY + 5, sleeve); c.set(x - sgn * o, TY + 6, P['skin']); c.set(x - sgn * (o + 1), TY + 6, P['skin'])
        elif mode == 'watch':
            c.rect(x, TY + 1, 1, 3, sleeve); c.set(x + 1 if left else x - 1, TY + 3, sleeve); c.set(x + 2 if left else x - 2, TY + 3, P['skin']); c.set(x + 1 if left else x - 1, TY + 4, hx('#c9a03a'))
        elif mode in ('knock', 'knockup'):
            dy = -1 if mode == 'knockup' else 0
            c.rect(x, TY + 1, 1, 2, sleeve); c.set(x, TY + dy, sleeve); c.set(x + sgn, TY - 1 + dy, sleeve); c.set(x + sgn, TY - 2 + dy, P['skin'])
        elif mode in ('wave0', 'wave1'):
            o = 0 if mode == 'wave0' else 1
            c.rect(x, TY - 3, 1, 4, sleeve); c.set(x + sgn * o, TY - 4, sleeve); c.set(x + sgn * o, TY - 5, P['skin']); c.set(x + sgn * (o + 1), TY - 5, P['skin'])
    def arm_overlay(mode, left, tt=0):
        if d == 'S' and mode == 'face':
            c.set(15, TY, sleeve); c.set(14, TY - 1, sleeve); c.rect(12, HY + 4, 3, 2, P['skin']); c.set(12, HY + 4, P['skin_s'])
        if d == 'S' and mode in ('cup', 'sip'):
            yy = TY + 3 if mode == 'cup' else HY + 6
            c.set(15, TY + 3, sleeve); c.set(14, TY + 3 if mode == 'cup' else TY + 1, sleeve)
            c.rect(13, yy - 1, 2, 3, hx('#f2efe6')); c.set(15, yy, hx('#f2efe6')); c.set(13, yy - 1, hx('#c0622f')); c.set(14, yy - 1, hx('#c0622f'))
            c.set(12, yy + 1, P['skin'])
        if d == 'S' and mode == 'phone':
            c.set(15, TY, sleeve); c.rect(14, HY + 6, 1, 2, sleeve); c.set(15, HY + 4, P['skin'])
            c.rect(HX + 7, HY + 2, 2, 5, hx('#2a2a2e')); c.set(HX + 8, HY + 2, hx('#c0622f'))
        if mode in ('clap', 'clapopen') and d in 'SN' and left:
            g = 1 if mode == 'clapopen' else 0
            c.rect(8, TY + 3, 2, 1, sleeve); c.rect(14, TY + 3, 2, 1, sleeve)
            if d == 'S': c.set(11 - g, TY + 3, P['skin']); c.set(12 + g, TY + 3, P['skin']); c.set(10 - g, TY + 3, sleeve); c.set(13 + g, TY + 3, sleeve)
        if mode == 'torch' and d == 'S':
            c.set(15, TY + 3, sleeve); c.rect(13, TY + 4, 2, 1, P['skin']); c.rect(13, TY + 5, 2, 2, hx('#3a3a40')); c.set(13, TY + 6, hx('#fff2a0')); c.set(14, TY + 6, hx('#fff2a0'))
        if mode == 'torch' and d == 'N':
            c.set(16, TY + 3, P['skin'])
        if d == 'S' and mode == 'fold':
            c.rect(8, TY + 4, 8, 2, sleeve); c.hline(8, TY + 5, 8, sleeve_s); c.set(8, TY + 4, P['skin']); c.set(15, TY + 4, P['skin'])
    if not side:
        arm_front(p['armL'], True, p.get('typeL', 0)); arm_front(p['armR'], False, p.get('typeR', 0))
    # ---------- head ----------
    hc = P['skin']
    c.rect(HX, HY, 8, 8, hc); c.vline(HX + 7, HY + 1, 6, P['skin_s']); c.hline(HX + 1, HY + 7, 6, P['skin_s'])
    for (i, j) in [(HX, HY), (HX + 7, HY), (HX, HY + 7), (HX + 7, HY + 7)]: c.px_clear(i, j)
    style = look.get('hairStyle', 'short')
    hm = HAIR.get(style, HAIR['short'])
    hmap = {'H': P['hair'], 'h': P['hair_s'], 'C': P['cap'], 'c': shade(P['cap'], 0.75)}
    if d == 'S' and not p['top']:
        # face
        ey = HY + 4
        if p['eyes'] == 'open': c.set(HX + 2, ey, P['eye']); c.set(HX + 5, ey, P['eye'])
        elif p['eyes'] == 'side': c.set(HX + 3, ey, P['eye']); c.set(HX + 6, ey, P['eye'])
        elif p['eyes'] == 'happy':
            c.set(HX + 2, ey, P['eye']); c.set(HX + 5, ey, P['eye']); c.set(HX + 1, ey + 1, P['eye']); c.set(HX + 6, ey + 1, P['eye'])
        elif p['eyes'] == 'droop':
            c.set(HX + 2, ey, P['eye']); c.set(HX + 5, ey, P['eye']); c.hline(HX + 1, ey - 1, 2, P['skin_s']); c.hline(HX + 5, ey - 1, 2, P['skin_s'])
            c.set(HX + 2, ey + 1, hx('#b89aa8')); c.set(HX + 5, ey + 1, hx('#b89aa8'))
        else: c.hline(HX + 1, ey, 2, P['skin_s']); c.hline(HX + 5, ey, 2, P['skin_s'])
        c.set(HX + 1, ey + 2, shade(hx('#e88f86'), 1.0) if look.get('blush') else None)
        if p['mouth'] == 'open': c.rect(HX + 3, HY + 6, 2, 1, P['mouth'])
        elif p['mouth'] == 'o': c.set(HX + 4, HY + 6, P['mouth'])
        if 'mustache' in acc: c.rect(HX + 2, HY + 5, 4, 1, P['hair_s'])
        if 'beard' in acc: c.rect(HX + 1, HY + 5, 6, 3, P['hair']); c.rect(HX + 3, HY + 5, 2, 1, P['skin_s']) if p['mouth'] else None; c.hline(HX + 2, HY + 8, 4, P['hair_s'])
        c.mask(HX - 2, HY - 4, hm['S'], hmap)
        if 'glasses' in acc:
            gc = hx('#3a2a20'); ln = hx('#d9ece6')
            c.hline(HX + 1, ey - 1, 6, gc)
            for gx in (HX + 1, HX + 3, HX + 4, HX + 6): c.set(gx, ey, ln)
            c.set(HX + 1, ey, gc); c.set(HX + 6, ey, gc)
            if p['eyes'] in ('open', 'happy', 'side'): c.set(HX + 2, ey, P['eye']); c.set(HX + 5, ey, P['eye'])
            else: c.set(HX + 2, ey, ln); c.set(HX + 5, ey, ln)
        if 'sunglasses' in acc:
            gc = hx('#2a2420'); c.hline(HX + 1, ey - 1, 6, gc); c.rect(HX + 1, ey, 2, 1, hx('#3a4a52')); c.rect(HX + 5, ey, 2, 1, hx('#3a4a52')); c.set(HX + 1, ey, hx('#8fb0b8')); c.set(HX + 5, ey, hx('#8fb0b8'))
        if 'headphones' in acc:
            c.hline(HX, HY - 1, 8, hx('#3a3a40')); c.rect(HX - 1, HY + 3, 2, 3, hx('#c0622f')); c.rect(HX + 7, HY + 3, 2, 3, hx('#c0622f'))
        if 'airpods' in acc: c.set(HX - 1, HY + 4, hx('#f6f3ea')); c.set(HX + 8, HY + 4, hx('#f6f3ea'))
        if 'earrings' in acc: c.set(HX - 1, HY + 6, hx('#d8b24a')); c.set(HX + 8, HY + 6, hx('#d8b24a'))
        if 'headset' in acc: c.rect(HX - 1, HY + 3, 1, 3, hx('#2a2a2e')); c.set(HX, HY + 6, hx('#2a2a2e')); c.set(HX + 1, HY + 7, hx('#2a2a2e')); c.hline(HX, HY - 1, 8, hx('#2a2a2e'))
    elif d == 'N' or p['top']:
        c.mask(HX - 2, HY - 4, hm['N'], hmap)
        if 'headset' in acc: c.hline(HX, HY - 1, 8, hx('#2a2a2e'))
        if 'headphones' in acc: c.hline(HX, HY - 1, 8, hx('#3a3a40')); c.rect(HX - 1, HY + 3, 2, 3, hx('#c0622f')); c.rect(HX + 7, HY + 3, 2, 3, hx('#c0622f'))
    else:
        ey = HY + 4
        c.set(HX + 8, HY + 4, hc); c.set(HX + 8, HY + 5, P['skin_s'])  # nose
        if p['eyes'] in ('open', 'side', 'happy', 'droop'): c.set(HX + 6, ey, P['eye'])
        if p['eyes'] == 'droop': c.set(HX + 6, ey - 1, P['skin_s'])
        else: c.set(HX + 6, ey, P['skin_s'])
        if p['mouth'] in ('open', 'o'): c.set(HX + 6, HY + 6, P['mouth'])
        if 'mustache' in acc: c.rect(HX + 6, HY + 5, 2, 1, P['hair_s'])
        if 'beard' in acc: c.rect(HX + 3, HY + 5, 5, 3, P['hair']); c.hline(HX + 4, HY + 8, 3, P['hair_s'])
        c.set(HX + 2, HY + 4, P['skin_s'])  # ear
        c.mask(HX - 2, HY - 4, hm['E'], hmap)
        if 'glasses' in acc: c.hline(HX + 4, ey - 1, 4, hx('#2a2420')); c.set(HX + 5, ey, hx('#2a2420')); c.set(HX + 7, ey, hx('#2a2420'))
        if 'headset' in acc: c.rect(HX + 2, HY + 3, 2, 2, hx('#2a2a2e'))
        if 'headphones' in acc: c.rect(HX + 1, HY + 3, 3, 3, hx('#c0622f')); c.hline(HX + 1, HY - 1, 4, hx('#3a3a40'))
        if 'sunglasses' in acc: c.hline(HX + 4, ey - 1, 4, hx('#2a2420')); c.rect(HX + 5, ey, 3, 1, hx('#3a4a52'))
        if 'airpods' in acc: c.set(HX + 2, HY + 4, hx('#f6f3ea'))
    if not side:
        arm_overlay(p['armL'], True); arm_overlay(p['armR'], False)
    else:
        # side arm, drawn over torso
        ax = tx + 2; m = p['armL']
        if p['sit'] and m == 'type':
            c.rect(ax, TY + 1, 2, 3, sleeve); c.rect(ax + 2, TY + 3, 3, 1, sleeve); c.set(ax + 5, TY + 3 - p.get('typeR', 0), P['skin'])
        elif m == 'rest':
            c.rect(ax, TY + 1, 2, 3, sleeve); c.rect(ax + 2, TY + 3, 2, 1, sleeve); c.set(ax + 4, TY + 3, P['skin'])
        elif m == 'fold':
            c.rect(ax, TY + 1, 2, 2, sleeve); c.rect(ax + 1, TY + 3, 6, 2, sleeve); c.set(ax + 7, TY + 3, P['skin'])
        elif m == 'up' or p['armR'] == 'up':
            c.rect(ax, TY - 4, 2, 5, sleeve); c.rect(ax, TY - 5, 2, 1, P['skin'])
        elif m == 'half':
            c.rect(ax, TY, 2, 2, sleeve); c.rect(ax + 1, TY - 2, 2, 2, sleeve); c.set(ax + 2, TY - 3, P['skin'])
        elif p['armR'] in ('face',):
            c.rect(ax, TY + 1, 2, 2, sleeve); c.rect(ax + 2, TY - 1, 2, 2, sleeve); c.rect(HX + 6, HY + 4, 2, 2, P['skin'])
        elif p['armR'] == 'phone':
            c.rect(ax, TY + 1, 2, 2, sleeve); c.rect(ax + 1, TY - 1, 2, 2, sleeve); c.set(HX + 3, HY + 5, P['skin']); c.rect(HX + 2, HY + 3, 2, 4, hx('#2a2a2e'))
        elif p['armR'] in ('petA', 'petB'):
            o = 0 if p['armR'] == 'petA' else 1
            c.rect(ax, TY + 1, 2, 3, sleeve); c.rect(ax + 2, TY + 4, 2, 1, sleeve); c.rect(ax + 4 + o, TY + 5, 2, 1, P['skin'])
        elif m == 'watch':
            c.rect(ax, TY + 1, 2, 2, sleeve); c.rect(ax + 2, TY + 2, 2, 1, sleeve); c.set(ax + 4, TY + 2, P['skin']); c.set(ax + 3, TY + 2, hx('#c9a03a'))
        elif p['armR'] in ('knock', 'knockup'):
            dy = -1 if p['armR'] == 'knockup' else 0; dx = 1 if p['armR'] == 'knock' else 0
            c.rect(ax, TY + 1, 2, 2, sleeve); c.rect(ax + 2, TY + dy, 2, 2, sleeve); c.set(ax + 4 + dx, TY - 1 + dy, P['skin'])
        elif p['armR'] in ('wave0', 'wave1'):
            o = 0 if p['armR'] == 'wave0' else 1
            c.rect(ax, TY - 3, 2, 4, sleeve); c.rect(ax + o, TY - 5, 2, 2, P['skin'])
        elif p['armR'] in ('clap', 'clapopen'):
            c.rect(ax, TY + 1, 2, 2, sleeve); c.rect(ax + 2, TY + 2, 2, 1, sleeve); c.set(ax + 4 + (1 if p['armR'] == 'clapopen' else 0), TY + 2, P['skin'])
        elif p['armR'] == 'torch':
            c.rect(ax, TY + 1, 2, 3, sleeve); c.rect(ax + 2, TY + 3, 2, 1, sleeve); c.rect(ax + 4, TY + 3, 3, 1, hx('#3a3a40')); c.set(ax + 7, TY + 3, hx('#fff2a0'))
        elif p['armR'] == 'gesture':
            c.rect(ax, TY + 1, 2, 3, sleeve); c.rect(ax + 2, TY + 2, 2, 1, sleeve); c.set(ax + 4, TY + 1, P['skin'])
        elif p['armR'] in ('cup', 'sip'):
            yy = TY + 3 if p['armR'] == 'cup' else HY + 6
            c.rect(ax, TY + 1, 2, 3, sleeve); c.rect(ax + 2, yy, 2, TY + 4 - yy, sleeve)
            c.rect(ax + 3, yy - 2, 2, 3, hx('#f2efe6')); c.hline(ax + 3, yy - 2, 2, hx('#c0622f'))
        else:
            sw = {'down': 0, 'fwd': 2, 'back': -2, 'run': 1, 'runfwd': 3, 'runback': -2}.get(m, 0)
            if m.startswith('run'):
                c.rect(ax, TY + 1, 2, 2, sleeve); c.rect(ax + sw // 2, TY + 3, 2, 2, sleeve); c.set(ax + sw // 2 + (1 if sw > 0 else 0), TY + 5, P['skin'])
            else:
                for r in range(5): c.rect(ax + round(sw * r / 5), TY + 1 + r, 2, 1, sleeve)
                c.rect(ax + sw, TY + 6, 2, 1, P['skin'])
    c.outline(0.5)
    return c

def person_sheet(look):
    rows = [(a, d) for a, n, fps, lp in ANIMS for d in DIRS]
    maxf = max(n for _, n, _, _ in ANIMS)
    sheet = Image.new('RGBA', (CW * maxf, CH * len(rows)), (0, 0, 0, 0))
    for r, (a, d) in enumerate(rows):
        n = [x[1] for x in ANIMS if x[0] == a][0]
        for fr in range(n):
            sheet.alpha_composite(draw_person(look, a, d, fr).im, (fr * CW, r * CH))
    return sheet, rows
