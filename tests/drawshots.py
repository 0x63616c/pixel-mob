import sys, os
from playwright.sync_api import sync_playwright
BASE = sys.argv[1]; OUT = sys.argv[2]; os.makedirs(OUT, exist_ok=True)
CODES = dict(zip(['m1','m2','m3','m4','m5','huge1','huge2','mixed','small'], ' ov2fuY_8ZUic BqkpAQLoESNr uO5b23huV2bq-TBD w8BiOGt_KL1k wfqw5gzZYui7 3iC7jV9AjJcfufo aqQXf4vGDBiksSvMRA 9bfReJB1OKOkwTi2nIu2 NfegvNwQX2uuqQ'.split()))
res = []
with sync_playwright() as p:
    dev = {k: v for k, v in p.devices['iPhone 13'].items() if k != 'default_browser_type'}
    for eng, size, opts in [('chrome','desktop',{'viewport':{'width':1280,'height':800}}),('chrome','iphone',dev),('webkit','iphone',dev)]:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome') if eng == 'chrome' else p.webkit.launch()
        pg = b.new_context(**opts).new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        for name, code in CODES.items():
            pg.goto(f'{BASE}/{code}?debug=1'); pg.wait_for_timeout(1200); pg.evaluate('__crowd.reveal()')
            for i in range(160):
                pg.wait_for_timeout(250)
                if pg.evaluate('__crowd.mode') == 'hold': break
            assert pg.evaluate('__crowd.mode') == 'hold', (eng, size, name, 'formation did not complete')
            pg.wait_for_timeout(700)
            inb = pg.evaluate("(()=>{const w=document.getElementById('c').width;return __crowd.people().filter(p=>p.state==='placed').every(p=>p.x>0&&p.x<w)})()")
            assert inb, (eng, size, name, 'mob outside the screen')
            ov = pg.evaluate('[__crowd.overlaps,__crowd.maxOverlaps,__crowd.overlapTotal]')
            pg.screenshot(path=f'{OUT}/{eng}-{size}-{name}.png'); res.append((eng, size, name, ov))
        print(eng, size, 'errors', errs, flush=True); b.close()
for r in res: print(*r)
bad = [r for r in res if r[3] != [0, 0, 0]]
print('OVERLAP FAILS:', bad or 'none')
