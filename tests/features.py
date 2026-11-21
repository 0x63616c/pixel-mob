"""Feature e2e: scenes, themes, from-name, countdown, reactions, downloads, tap-to-dance and the NO-COLLISION counter.
Usage: python3 tests/features.py [base] [shots-dir]   (Chrome desktop + iPhone, WebKit iPhone)"""
import sys, os, json, subprocess, time
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8799'
OUT = sys.argv[2] if len(sys.argv) > 2 else '/workspace/shots/verify'
os.makedirs(OUT, exist_ok=True)
code = lambda m: subprocess.check_output(['node', 'scripts/mkcode.mjs', json.dumps(m)]).decode().strip()
SCENES = code({'scenes': ['HAPPY BIRTHDAY!', '🎂🎉', 'LOVE YOU ❤️'], 'theme': 'birthday', 'from': 'george'})
XMAS = code({'scenes': ['MERRY XMAS!', '🎄'], 'theme': 'christmas', 'size': 'huge'})
SOON = code({'scenes': ['SURPRISE!'], 'from': 'sam', 'at': int((time.time() + 86400 * 3) // 60 * 60000)})
fails = []
def wait(pg, js, timeout=30000):
    # polls with evaluate (WebKit's CSP blocks Playwright's string-eval wait_for_function)
    t = time.time()
    while time.time() - t < timeout / 1000:
        if pg.evaluate(js): return True
        pg.wait_for_timeout(200)
    raise TimeoutError(js)
def check(ok, msg):
    if not ok: fails.append(msg)
with sync_playwright() as p:
    targets = [('chrome', 'desktop', {'viewport': {'width': 1280, 'height': 800}}),
               ('chrome', 'iphone', {k: v for k, v in p.devices['iPhone 13'].items() if k != 'default_browser_type'}),
               ('webkit', 'iphone', {k: v for k, v in p.devices['iPhone 13'].items() if k != 'default_browser_type'})]
    for eng, size, opts in targets:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome') if eng == 'chrome' else p.webkit.launch()
        ctx = b.new_context(**opts, bypass_csp=True, accept_downloads=True)
        pg = ctx.new_page(); errs, events = [], []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'cloudflareinsights' not in m.text and 'Access-Control-Allow-Origin' not in m.text and 'Failed to load resource' not in m.text else None)
        pg.on('response', lambda r: events.append((r.status, r.request.post_data)) if r.url.endswith('/api/event') else None)
        tag = f'{eng}-{size}'
        # 1. multi-scene themed link with a from-name
        pg.goto(f'{BASE}/{SCENES}'); wait(pg, '__crowd.phase==="teaser"', 20000); pg.wait_for_timeout(500)
        pg.screenshot(path=f'{OUT}/{tag}-1-teaser.png')
        title = pg.get_attribute('#teaserTitle', 'aria-label')
        check(title == 'GEORGE sent you a Pixel Mob', f'{tag} teaser title {title}')
        pg.click('#reveal', force=True)
        seen = set(); shot = 0
        for i in range(240):
            pg.wait_for_timeout(250)
            st = pg.evaluate('[__crowd.scene,__crowd.mode,__crowd.maxOverlaps,__crowd.overlaps,__crowd.theme]')
            seen.add(st[0])
            if st[1] == 'hold' and st[0] == shot and shot < 3: pg.screenshot(path=f'{OUT}/{tag}-2-scene{shot + 1}.png'); shot += 1
            if pg.evaluate("document.getElementById('endbar').classList.contains('on')"): break
        ov = pg.evaluate('[__crowd.maxOverlaps,__crowd.overlapTotal]')
        print(tag, 'scenes seen', sorted(seen), 'theme', st[4], 'overlaps max/total', ov)
        check(seen == {0, 1, 2}, f'{tag} scenes {seen}'); check(ov == [0, 0], f'{tag} overlaps {ov}')
        # 2. tap a person to make them dance
        pp = pg.evaluate("__crowd.people().filter(p=>p.state==='placed')[5]")
        pg.mouse.click(pp['x'], pp['y'] - 10); pg.wait_for_timeout(120)
        check(pg.evaluate('__crowd.people().some(p=>p.dance)'), f'{tag} tap-to-dance')
        # 3. reactions + replay overlap check
        pg.click('#reacts [data-r=yay]', force=True); pg.wait_for_timeout(1200); pg.screenshot(path=f'{OUT}/{tag}-3-react.png')
        check(pg.is_visible('#replyBtn'), f'{tag} reply button')
        pg.click('#replay', force=True)
        for i in range(160):
            pg.wait_for_timeout(250)
            if pg.evaluate('__crowd.scene==2&&__crowd.mode==="hold"'): break
        check(pg.evaluate('__crowd.overlapTotal') == 0, f'{tag} replay overlaps')
        # 4. save as GIF (and video where the browser can record)
        pg.click('#saveBtn', force=True)
        fmts = pg.eval_on_selector_all('#saveMenu [data-fmt]', 'els=>els.map(e=>e.dataset.fmt)')
        for f in fmts:
            try:
                with pg.expect_download(timeout=60000) as d: pg.click(f'#saveMenu [data-fmt={f}]', force=True)
                path = f'{OUT}/{tag}-{d.value.suggested_filename}'; d.value.save_as(path); print(tag, 'saved', f, os.path.getsize(path), 'bytes')
                check(os.path.getsize(path) > 50000, f'{tag} {f} too small')
            except Exception as e:
                # Playwright's WebKit can't observe blob downloads; the encoder is checked through __crowd.save instead.
                r = pg.evaluate(f"__crowd.save('{f}').then(x=>x,e=>'fail '+e)"); print(tag, f, 'via save()', r); check(r in ('gif', 'mp4', 'webm'), f'{tag} save {f} {r}')
            pg.wait_for_timeout(300)
            if not pg.is_visible('#saveMenu'): pg.click('#saveBtn', force=True)
        # 5. reply prefills the creator
        pg.click('#replyBtn', force=True); pg.wait_for_timeout(1500); pg.screenshot(path=f'{OUT}/{tag}-4-reply.png')
        vals = pg.eval_on_selector_all('#scenes .msg', 'els=>els.map(e=>e.value)'); print(tag, 'reply prefill', vals)
        check(vals and vals[0] == 'HI GEORGE!', f'{tag} reply prefill {vals}')
        # 6. countdown link
        pg.goto(f'{BASE}/{SOON}'); pg.wait_for_timeout(3200); pg.screenshot(path=f'{OUT}/{tag}-5-countdown.png')
        check(pg.evaluate("document.getElementById('reveal').disabled&&!document.getElementById('countdown').hidden"), f'{tag} countdown')
        pg.mouse.click(40, 300); pg.wait_for_timeout(300); check(pg.evaluate('__crowd.phase') == 'teaser', f'{tag} countdown tap revealed early')
        # 7. huge Christmas mob
        pg.goto(f'{BASE}/{XMAS}'); pg.wait_for_timeout(1200); pg.evaluate('__crowd.reveal()')
        wait(pg, '__crowd.mode==="hold"', 40000); pg.wait_for_timeout(600); pg.screenshot(path=f'{OUT}/{tag}-6-xmas-huge.png')
        check(pg.evaluate('__crowd.overlapTotal') == 0, f'{tag} xmas overlaps')
        # 8. creator: template + options
        pg.goto(f'{BASE}/new'); pg.wait_for_timeout(1200); pg.click('#tpls button:nth-child(6)', force=True); pg.wait_for_timeout(600)
        pg.click('#more summary'); pg.fill('#from', 'calum'); pg.click('#sizes [data-v=small]'); pg.wait_for_timeout(4500)
        pg.screenshot(path=f'{OUT}/{tag}-7-creator.png')
        link = pg.evaluate('__crowd.link')
        print(tag, 'creator link', link, 'overlaps', pg.evaluate('__crowd.overlapTotal'))
        check(pg.evaluate('__crowd.overlapTotal') == 0, f'{tag} preview overlaps')
        bad = [e for e in events if e[0] != 204]
        print(tag, 'events', [json.loads(e[1])['e'] + ('/' + json.loads(e[1]).get('d', '') if 'd' in json.loads(e[1]) else '') for e in events], 'non-204', bad, 'errors', errs)
        check(not bad, f'{tag} rejected events {bad}'); check(not errs, f'{tag} errors {errs}')
        check(any('"reaction"' in (e[1] or '') for e in events), f'{tag} no reaction event')
        check(any('"download"' in (e[1] or '') for e in events) or eng == 'webkit', f'{tag} no download event')
        b.close()
print('FAILS:', fails or 'none')
