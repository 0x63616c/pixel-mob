import asyncio
from playwright.async_api import async_playwright
async def run():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=await b.new_context(viewport={'width':1200,'height':900}); pg=await ctx.new_page(); errs=[]
    pg.on('console',lambda m: errs.append(m.text) if m.type in('error','warning') else None); pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.on('response',lambda r: errs.append('404 '+r.url) if r.status==404 else None)
    await pg.goto('http://localhost:36661/art-preview.html'); await pg.wait_for_function('window.__art && window.__art.ready',timeout=20000); await pg.wait_for_timeout(2500)
    await pg.locator('#props2').screenshot(path='/workspace/pixel-office/shots/art2-gallery.png')
    await pg.locator('#sheet').screenshot(path='/workspace/pixel-office/shots/art2-sheet.png')
    m=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=3,is_mobile=True); q=await m.new_page()
    await q.goto('http://localhost:36661/art-preview.html'); await q.wait_for_function('window.__art && window.__art.ready',timeout=20000); await q.wait_for_timeout(2500)
    await q.screenshot(path='/workspace/pixel-office/shots/art2-iphone.png')
    print(errs[:8]); await b.close()
asyncio.run(run())
