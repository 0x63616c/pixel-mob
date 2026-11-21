"""End-to-end check against a deployed Pixel Mob (default: workers.dev). Usage: python3 tests/e2e.py [base]"""
import asyncio, re, sys, urllib.request
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'https://pixelmob.worldwidewebb.workers.dev'
UAS = {'facebook': 'facebookexternalhit/1.1', 'twitter': 'Twitterbot/1.0', 'slack': 'Slackbot-LinkExpanding 1.0', 'imessage': 'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17 Safari/605.1.15 facebookexternalhit/1.1 Facebot Twitterbot/1.0', 'discord': 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)'}
def get(url, ua='Mozilla/5.0'):
    r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': ua}), timeout=15)
    return r.status, r.headers, r.read().decode('utf8', 'replace')
async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for size, opts in [('desktop', {'viewport': {'width': 1280, 'height': 800}}), ('iphone', {**p.devices['iPhone 13'], 'default_browser_type': None})]:
            opts.pop('default_browser_type', None)
            ctx = await b.new_context(**opts, bypass_csp=True); await ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=BASE)
            pg = await ctx.new_page(); errs, beacons = [], []
            pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
            pg.on('request', lambda r: beacons.append(r.post_data) if r.url.endswith('/api/event') else None)
            pg.on('response', lambda r: errs.append(f'HTTP {r.status} {r.url}') if r.status >= 400 and '/api/event' not in r.url else None)
            await pg.goto(BASE + '/new'); await pg.wait_for_timeout(1500)
            await pg.click('#msg'); await pg.keyboard.type('hi from e2e', delay=40); await pg.wait_for_timeout(1500)
            if size == 'desktop':
                await pg.click('#copyBtn'); await pg.wait_for_timeout(400)
                clip = await pg.evaluate('navigator.clipboard.readText()')
            link = await pg.evaluate('__crowd.link')
            if 'HI' in link.upper().split('/')[-1] and 'FROM' in link.upper(): fails.append('plaintext in link')
            if size == 'desktop' and clip != link: fails.append('clipboard mismatch')
            if not re.match(re.escape(BASE) + r'/[A-Za-z0-9_-]{8,60}$', link): fails.append('bad link format ' + link)
            await pg.goto(link); await pg.wait_for_timeout(2900)
            phase = await pg.evaluate('__crowd.phase')
            await pg.click('#reveal', force=True)
            await pg.wait_for_timeout(500); bub = await pg.evaluate('__crowd.bubble')
            await pg.wait_for_function('__crowd.mode==="hold"', timeout=20000); await pg.wait_for_timeout(2600)
            st = await pg.evaluate('[__crowd.app,__crowd.text,__crowd.states,getComputedStyle(document.getElementById("endbar")).visibility,document.title]')
            await pg.click('#replay'); await pg.wait_for_timeout(400)
            await pg.click('#endbar [data-open-panel]', force=True); await pg.wait_for_timeout(600)
            print(size, '| link', link, '| teaser phase', phase, '| bubble', bub, '| end', st, '| events', beacons, '| errors', errs)
            if errs: fails.append(f'{size} errors {errs}')
            if not bub or bub['say'] != 'MOB, ASSEMBLE!': fails.append('no assemble bubble')
            if st[1] != 'HI FROM E2E' or st[3] != 'visible': fails.append('reveal failed')
            await ctx.close()
        await b.close()
    code = link.rsplit('/', 1)[1]
    for name, ua in UAS.items():
        s, h, body = get(BASE + '/' + code, ua)
        og = dict(re.findall(r'<meta property="(og:[a-z:_]+)" content="([^"]*)"', body))
        leak = 'E2E' in body.upper().replace('E2E.PY', '')
        print(f'{name:9} {s} title={og.get("og:title")!r} image={og.get("og:image")} robots={h.get("X-Robots-Tag")} leak={leak}')
        if leak or 'og-message.png' not in og.get('og:image', ''): fails.append('og ' + name)
    s, h, _ = get(BASE + '/og-message.png'); print('og-message.png', s, h['Content-Type'], h['Content-Length'])
    s, h, body = get(BASE + '/'); print('landing og', re.search(r'og:image" content="([^"]+)', body).group(1), 'jsonld', 'WebApplication' in body, 'beacon', 'cloudflareinsights' in body)
    print('FAILS:', fails or 'none')
asyncio.run(main())
