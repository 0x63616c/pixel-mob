import json, os, sys
from PIL import Image
import people, props, fx, props2, props3
OUT = '/workspace/pixel-office/game/assets/art'
os.makedirs(OUT + '/people', exist_ok=True)
LOOKS = {
 # 70s office fashion presets. top: shirt|suit|cardigan|turtleneck|sweater|blouse|dress|jumpsuit
 'p00': dict(skin=1, hair='#5a3a22', hairStyle='feather', top='suit', topColor='#6b4a2f', pants='#4a3a2c', acc=['tie', 'glasses'], tieColor='#c9a03a'),
 'p01': dict(skin=4, hair='#1e1612', hairStyle='afro', top='turtleneck', topColor='#c9a03a', pants='#3a3a40'),
 'p02': dict(skin=0, hair='#c98a3a', hairStyle='bob', top='cardigan', topColor='#7a8a3a', innerColor='#efe6d0', pants='#6b4a2f', acc=['earrings']),
 'p03': dict(skin=2, hair='#2a1d16', hairStyle='sidepart', top='suit', topColor='#2c3a57', pants='#2c3a57', acc=['tie', 'badge'], tieColor='#8f3f26'),
 'p04': dict(skin=0, hair='#d9c08a', hairStyle='long', top='blouse', topColor='#c0622f', pants='#5a4632', acc=['badge']),
 'p05': dict(skin=3, hair='#1e1612', hairStyle='short', top='sweater', topColor='#8f3f26', innerColor='#efe6d0', pants='#3a3a40', acc=['mustache']),
 'p06': dict(skin=1, hair='#8a8680', hairStyle='bald', top='suit', topColor='#3a3a40', pants='#3a3a40', acc=['tie', 'glasses'], tieColor='#2f6f68'),
 'p07': dict(skin=5, hair='#141010', hairStyle='bun', top='turtleneck', topColor='#2f6f68', pants='#2a2a30', acc=['earrings']),
 'p08': dict(skin=0, hair='#7a4a26', hairStyle='mullet', top='shirt', topColor='#c7d6e0', pants='#6b4a2f', acc=['tie', 'mustache'], tieColor='#6e2f3a'),
 'p09': dict(skin=2, hair='#3a2418', hairStyle='feather', top='dress', topColor='#6e2f3a', pants='#6e2f3a', shoes='#3a2418'),
 'p10': dict(skin=1, hair='#b0602a', hairStyle='short', top='cardigan', topColor='#b08850', innerColor='#c7d6e0', pants='#3a3a40', acc=['glasses', 'tie'], tieColor='#2c3a57'),
 'p11': dict(skin=4, hair='#2a1d16', hairStyle='sidepart', top='suit', topColor='#6b4a2f', pants='#6b4a2f', acc=['tie', 'beard'], tieColor='#c0622f'),
 'p12': dict(skin=0, hair='#3a2a1e', hairStyle='bob', top='turtleneck', topColor='#efe6d0', pants='#2c3a57', acc=['glasses']),
 'p13': dict(skin=3, hair='#1e1612', hairStyle='afro', top='suit', topColor='#7a8a3a', pants='#4a3a2c', acc=['tie'], tieColor='#c9a03a'),
 'p14': dict(skin=1, hair='#e0c890', hairStyle='feather', top='sweater', topColor='#2f6f68', innerColor='#efe6d0', pants='#b08850'),
 'p15': dict(skin=2, hair='#5a3a22', hairStyle='long', top='cardigan', topColor='#c0622f', innerColor='#efe6d0', pants='#4a3a2c', acc=['glasses']),
 'p16': dict(skin=0, hair='#c0c0bc', hairStyle='sidepart', top='suit', topColor='#8a7a62', pants='#8a7a62', acc=['tie', 'mustache', 'glasses'], tieColor='#8f3f26'),
 'p17': dict(skin=5, hair='#141010', hairStyle='short', top='shirt', topColor='#efe6d0', pants='#2c3a57', acc=['tie', 'badge'], tieColor='#2f6f68'),
 'p18': dict(skin=1, hair='#2a1d16', hairStyle='bun', top='blouse', topColor='#c9a03a', pants='#3a3a40', acc=['glasses']),
 'p19': dict(skin=4, hair='#2a1d16', hairStyle='mullet', top='turtleneck', topColor='#6e2f3a', pants='#3a3a40', acc=['beard']),
 'p20': dict(skin=2, hair='#7a4a26', hairStyle='short', top='sweater', topColor='#c9a03a', innerColor='#c7d6e0', pants='#2c3a57', acc=['tie'], tieColor='#2c3a57'),
 'p21': dict(skin=0, hair='#a0522d', hairStyle='bob', top='dress', topColor='#2f6f68', pants='#2f6f68', shoes='#3a2418', acc=['earrings']),
 # special roles
 'receptionist': dict(skin=1, hair='#3a2418', hairStyle='bun', top='blouse', topColor='#efe6d0', pants='#2c3a57', acc=['headset', 'earrings', 'badge']),
 'facilities_a': dict(skin=2, hair='#3a3a3a', hairStyle='cap', top='jumpsuit', topColor='#9a9ea3', pants='#9a9ea3', capColor='#7d8287', shoes='#3a3a40'),
 'facilities_b': dict(skin=4, hair='#1e1612', hairStyle='cap', top='jumpsuit', topColor='#8e9297', pants='#8e9297', capColor='#6f747a', shoes='#3a3a40'),
 'supervisor': dict(skin=0, hair='#2a2420', hairStyle='sidepart', top='suit', topColor='#1f2430', pants='#1f2430', acc=['tie', 'badge'], tieColor='#1f2430', shoes='#111111'),
}
# curated 70s retro-corporate palette: every data colour snaps to its nearest entry so the floor stays cohesive
PAL70 = ['#2c3a57', '#3b4a6b', '#1f2430', '#3a3a40', '#55565c', '#6b4a2f', '#8a5a3a', '#4a3a2c', '#b08850', '#c9a03a', '#c0622f', '#8f3f26',
         '#7a8a3a', '#5a6a32', '#2f6f68', '#3d7f86', '#6e2f3a', '#9a4a52', '#efe6d0', '#d9cdaf', '#c7d6e0', '#9fb3c0', '#8a7a62', '#a7a9ac', '#b8a0b8', '#7a6a8a']
def _rgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def snap(h):
    r, g, b = _rgb(h)
    def d(p):
        R, G, B = _rgb(p); rm = (r + R) / 2
        return (2 + rm / 256) * (r - R) ** 2 + 4 * (g - G) ** 2 + (2 + (255 - rm) / 256) * (b - B) ** 2
    return min(PAL70, key=d)
TIES = ['#8f3f26', '#c9a03a', '#2f6f68', '#6e2f3a', '#2c3a57', '#c0622f']
def from_data(person):
    L = person['look']; kind = person.get('kind', 'staff'); h = sum(map(ord, person['id']))
    shirt = snap(L.get('shirt', '#2c3a57')); light = shirt.lower() in ('#f4ead2', '#efe6d0', '#ffffff', '#f6f3ea')
    top = {'tee': 'shirt', 'cardigan': 'cardigan', 'blazer': 'suit', 'hoodie': 'turtleneck', 'vest': 'vest', 'dress': 'dress', 'uniform': 'jumpsuit'}.get(L.get('outfit'), 'shirt')
    acc = []
    a = L.get('accessory', 'none')
    acc += {'glasses': ['glasses'], 'earrings': ['earrings'], 'headphones': ['headphones'], 'airpods': ['airpods'], 'lanyard': ['badge'], 'sunglasses': ['sunglasses']}.get(a, [])
    if L.get('extra') in ('beard', 'mustache'): acc.append(L['extra'])
    style = {'side-part': 'sidepart', 'ponytail': 'pony'}.get(L.get('hair_style'), L.get('hair_style', 'short'))
    look = dict(skin=L.get('skin'), hair=L.get('hair', '#3a2a1e'), hairStyle=style, top=top, topColor=shirt, pants=snap(L.get('pants', '#3a3a40')), shoes=min(['#2a211c', '#3a2418', '#1e2a44', '#4a2e1b', '#5a2a22'], key=lambda p: sum((a - b) ** 2 for a, b in zip(_rgb(p), _rgb(L.get('shoes', '#2a211c'))))),
                innerColor='#c7d6e0' if light else '#efe6d0')
    if look['pants'] == look['topColor'] and top in ('shirt', 'cardigan', 'turtleneck', 'vest'):
        look['pants'] = '#3a3a40' if look['topColor'] != '#3a3a40' else '#6b4a2f'
    if top == 'suit' or (top in ('shirt', 'vest') and h % 3 == 0): acc.append('tie'); look['tieColor'] = TIES[h % len(TIES)]
    if a == 'beanie': look['hairStyle'] = 'beanie'; look['capColor'] = '#c9a03a'
    if kind == 'cleaner': look['hairStyle'] = 'cap'; look['capColor'] = '#7d8287'; look['top'] = 'jumpsuit'
    if kind == 'security': look.update(top='suit', topColor='#1f2430', pants='#1f2430'); acc += ['tie', 'badge']; look['tieColor'] = '#1f2430'
    if kind == 'receptionist': acc += ['headset']
    look['acc'] = sorted(set(acc)); return look
def pack(items, width=1024):
    items = sorted(items, key=lambda t: -t[1].height); x = y = rowh = 0; pos = {}
    for key, im in items:
        if x + im.width > width: x = 0; y += rowh + 1; rowh = 0
        pos[key] = (x, y); x += im.width + 1; rowh = max(rowh, im.height)
    return pos, y + rowh
def main():
    atlas = {'version': 1, 'pixel_tile': 16, 'people': {}, 'goat': {}, 'props': {}}
    rows_meta = None
    data = json.load(open('/workspace/pixel-office/game/assets/data/company.json'))
    by_id = {}
    for person in data['people']:
        by_id[person['id']] = from_data(person)
    roles = {person['id']: person.get('kind', 'staff') for person in data['people']}
    LOOKS.update(by_id)
    for k, look in LOOKS.items():
        sheet, rows = people.person_sheet(look); sheet.save(f'{OUT}/people/{k}.png')
        rows_meta = rows
    atlas['people'] = {
        'cell': [people.CW, people.CH], 'foot_anchor': list(people.FOOT), 'cols': max(n for _, n, _, _ in people.ANIMS),
        'by_person': {k: f'people/{k}.png' for k in by_id}, 'kinds': roles,
        'presets': [k for k in LOOKS if k not in by_id],
        'rows': [f'{a}_{d}' for a, d in rows_meta],
        'anims': {a: {'frames': n, 'fps': fps, 'loop': lp} for a, n, fps, lp in people.ANIMS},
        'dirs': people.DIRS, 'sheets': {k: f'people/{k}.png' for k in LOOKS}, 'looks': LOOKS,
    }
    g, grows = fx.goat_sheet(); g.save(f'{OUT}/goat.png')
    atlas['goat'] = {'sheet': 'goat.png', 'cell': [fx.GW, fx.GH], 'foot_anchor': list(fx.GOAT_FOOT), 'cols': 4,
                     'rows': [f'{a}_{d}' for a, d in grows], 'anims': {a: {'frames': n, 'fps': fps, 'loop': True} for a, n, fps in fx.GOAT_ANIMS}}
    for pet in data.get('pets', []):
        if pet.get('species') == 'dog':
            dimg, drows = fx.corgi_sheet(pet.get('look')); dimg.save(f'{OUT}/{pet["id"]}.png')
            atlas['dog'] = {'sheet': f'{pet["id"]}.png', 'pet_id': pet['id'], 'cell': [fx.GW, fx.GH], 'foot_anchor': [12, 21], 'cols': 4,
                            'rows': [f'{a}_{d}' for a, d in drows], 'anims': {a: {'frames': n, 'fps': fps, 'loop': True} for a, n, fps in fx.GOAT_ANIMS}}
    props.build(); fx.build(); props2.make_props(); props3.build(data)
    # engine-lookup aliases: `${type}_${w}x${h}` -> `${type}_${facing}` -> `${type}` (all point at one packed sprite)
    P = props.P; F = {'up': 'n', 'down': 's', 'left': 'w', 'right': 'e'}
    for f, c in F.items():
        P.setdefault(f'chair_{f}', P[f'chair_{c}_orange'])
        P.setdefault(f'desk-chair_{f}', P[f'desk-chair_{f}_teal'])
        P.setdefault(f'armchair_{f}', P[f'armchair_{f}_mustard'])
    P.setdefault('chair', P['chair_s_orange']); P.setdefault('desk-chair', P['desk-chair_down_teal']); P.setdefault('armchair', P['armchair_down_mustard'])
    P.setdefault('crt', P['crt_front']); P.setdefault('crt_up', P['crt_front']); P.setdefault('crt_down', P['crt_back'])
    P.setdefault('desk-phone', P['phone']); P.setdefault('photo', P['photo_frame'])
    # coverage check against the data
    L = data['layout']; miss = set()
    for f in L['furniture'] + L['void_props']:
        t = f['type']; ks = [f"{t}_{f.get('w',1)}x{f.get('h',1)}", f"{t}_{f.get('facing')}", t]
        if not any(k in P for k in ks): miss.add(t)
    for o in data['objects']['instances']:
        if o.get('catalog_key') and o['catalog_key'] not in P: miss.add(o['catalog_key'])
    print('UNRESOLVED types:', sorted(miss))
    items = []; canon = {}; aliases = {}
    for name, d in props.P.items():
        if id(d) in canon: aliases[name] = canon[id(d)]; continue
        canon[id(d)] = name
        for i, fr in enumerate(d['frames']): items.append(((name, i), fr.im))
    pos, h = pack(items, 1024)
    sheet = Image.new('RGBA', (1024, h), (0, 0, 0, 0))
    for (name, i), im in items: sheet.alpha_composite(im, pos[(name, i)])
    sheet.save(f'{OUT}/props.png')
    for name, d in props.P.items():
        fr = d['frames']; src = aliases.get(name, name)
        e = {'frames': [[*pos[(src, i)], f.w, f.h] for i, f in enumerate(fr)], 'anchor': list(d['anchor'])}
        if name in aliases: e['alias_of'] = aliases[name]
        e.update(d['meta']); atlas['props'][name] = e
    atlas['props_sheet'] = 'props.png'
    json.dump(atlas, open(f'{OUT}/atlas.json', 'w'), indent=1)
    print('props', len(props.P), 'sheet', sheet.size)
main()
