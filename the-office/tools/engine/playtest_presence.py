"""Playtest: everyone enters/leaves only via the elevator, and the population follows the schedule.
usage: playtest_presence.py URL [--secs 120] [--every 2]
Samples window.__office; fails on: any appear/vanish away from the elevator doors, a car over capacity (6),
anyone >2h overdue (stuck below), or on-floor count drifting from the schedule by more than the people
currently in transit (line + boarding + aboard + waiting below)."""
import asyncio, argparse, json, sys
from playwright.async_api import async_playwright
ap = argparse.ArgumentParser(); ap.add_argument('url'); ap.add_argument('--secs', type=float, default=120); ap.add_argument('--every', type=float, default=2.0); ap.add_argument('--shot', default='')
a = ap.parse_args()
ARGS = ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--use-gl=angle']
async def run():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=ARGS)
        pg = await (await b.new_context(viewport={'width': 1024, 'height': 640})).new_page()
        await pg.goto(a.url); await pg.wait_for_timeout(8000)
        rows, fails, n = [], [], int(a.secs / a.every)
        for i in range(n):
            s = await pg.evaluate('window.__office||null')
            if s:
                el, au = s['elevator'], s['audit']
                transit = el['queue'] + el['boarding'] + el['aboard'] + max(el['waiting_below'], el.get('inbound') or 0)
                drift = abs(au['expected_on'] - s['on_floor'])
                rows.append((s['day'], s['clock'], s['on_floor'], s['day_crew_on'], s['night_crew_on'], s['always_on'], s['away'], el['phase'], el['queue'], el['aboard'], el['arrivals'], el['departures'], au['expected_on'], transit, au['late'], s['fps']))
                if drift > transit + 4: fails.append(f"{s['clock']}: on floor {s['on_floor']} vs schedule {au['expected_on']} (in transit {transit})")
                if au['late'] > 0: fails.append(f"{s['clock']}: {au['late']} people >2h overdue")
                if el['max_aboard'] > 6: fails.append(f"car over capacity: {el['max_aboard']}")
            await pg.wait_for_timeout(int(a.every * 1000))
        s = await pg.evaluate('window.__office||null')
        if a.shot: await pg.screenshot(path=a.shot)
        await b.close()
    print('day clock  on  day night always away phase  queue aboard  arr  dep  sched transit late fps')
    for r in rows[::max(1, len(rows)//40)]: print(' %d  %s  %3d  %3d  %3d  %3d  %3d  %-6s %3d  %3d  %4d %4d  %3d  %3d  %d  %s' % r)
    v = s['audit']['violations'] if s else ['no state']
    print('\nelevator: arrivals', s['elevator']['arrivals'], 'departures', s['elevator']['departures'], 'max line', s['elevator']['max_queue'], 'max aboard', s['elevator']['max_aboard'])
    print('appear/vanish violations:', len(v)); [print('  ', x) for x in v[:10]]
    fails = sorted(set(fails))
    print('schedule failures:', len(fails)); [print('  ', x) for x in fails[:10]]
    au = s['audit'] if s else {}
    print('collisions: overlap frames', au.get('overlap_frames'), 'of', au.get('frames'), 'pairs', au.get('overlap_pairs'), 'example', au.get('overlap_example'), 'stuck re-routes', au.get('stuck_fixed'))
    print('stuck: max', round(au.get('max_stuck_min') or 0, 2), 'sim-min; episodes >2min', au.get('stuck_over2'), 'example', au.get('stuck_example'))
    print('end: day', s.get('day') if s else None, 'clock', s.get('clock') if s else None, '| picks', au.get('picks'), '| people', au.get('people'))
    bb = s.get('bubbles', {}) if s else {}
    print('bubbles: overlap frames', bb.get('overlap_frames'), 'of', bb.get('frames'), 'max on screen', bb.get('max_on_screen'), 'banter exchanges', s.get('banter') if s else None)
    ok = not v and not fails and au.get('overlap_pairs', 1) == 0 and (au.get('stuck_over2') or 0) == 0 and bb.get('overlap_frames', 0) == 0
    print('PASS' if ok else 'FAIL')
asyncio.run(run())
