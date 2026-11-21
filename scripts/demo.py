"""Render docs/demo.mp4: build a mob on /new, open it as the receiver, react, dance.
Deterministic: ?capture=1 freezes the clock and each frame advances 40 ms (25 fps)."""
import os, glob, subprocess, sys
from playwright.sync_api import sync_playwright
B = sys.argv[1] if len(sys.argv) > 1 else 'https://pixelmob.io'
OUT = '/workspace/demo-frames'; os.makedirs(OUT, exist_ok=True); [os.remove(f) for f in glob.glob(OUT + '/*.png')]
n = 0
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=False, bypass_csp=True)
    ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=B)
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    def frames(k):
        global n
        for _ in range(k):
            pg.evaluate('__crowd.step(40)'); pg.screenshot(path=f'{OUT}/{n:05d}.png'); n += 1
    def typ(sel, text):
        pg.click(sel, force=True)
        for ch in text: pg.keyboard.type(ch); frames(3)
    pg.goto(B + '/new?capture=1'); pg.wait_for_timeout(400); frames(25)
    pg.click('#tpls button:nth-child(1)', force=True); frames(70)          # Birthday template
    pg.click('#addScene', force=True); frames(8)
    typ('#scenes .msg >> nth=2', 'LOVE YOU 😊'); frames(20)
    pg.click('#moreSum', force=True); frames(12)
    typ('#from', 'CALUM'); frames(15)
    pg.click('#copyBtn', force=True); frames(30)
    link = pg.evaluate('__crowd.link'); print('link', link)
    pg.goto(link + ('&' if '?' in link else '?') + 'capture=1'); pg.wait_for_timeout(400)
    for i in range(160):
        frames(1)
        if pg.evaluate('__crowd.phase') == 'teaser' and i > 60: break
    frames(60)
    pg.click('#reveal', force=True)
    for i in range(900):
        frames(1)
        if pg.evaluate("document.getElementById('endbar').classList.contains('on')"): break
    frames(25)
    pg.click('#reacts [data-r=love]', force=True); frames(45)
    for k in (4, 18, 30):
        pp = pg.evaluate(f"__crowd.people().filter(p=>p.state==='placed')[{k}]")
        pg.mouse.click(pp['x'], pp['y'] - 10); frames(6)
    frames(45)
    print('frames', n, 'errs', errs, 'maxOverlaps', pg.evaluate('__crowd.maxOverlaps'), 'total', pg.evaluate('__crowd.overlapTotal'))
    b.close()
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '25', '-i', f'{OUT}/%05d.png', '-vf', 'scale=540:-2:flags=neighbor',
                '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '26', '-preset', 'slow', '-movflags', '+faststart', 'docs/demo.mp4'], check=True)
print('wrote docs/demo.mp4', os.path.getsize('docs/demo.mp4'))
