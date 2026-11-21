import sys, asyncio
from playwright.async_api import async_playwright
base='http://localhost:36661/art-preview.html'; out='/workspace/pixel-office/shots'
async def run():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=await b.new_context(viewport={'width':1200,'height':900},device_scale_factor=1)
    pg=await ctx.new_page(); errs=[]
    pg.on('console',lambda m: errs.append(m.text) if m.type in('error','warning') else None)
    pg.on('pageerror',lambda e: errs.append(str(e)))
    await pg.goto(base); await pg.wait_for_function('window.__art && window.__art.ready',timeout=15000)
    await pg.evaluate('__art.setMode("day")'); await pg.wait_for_timeout(3200)
    await pg.locator('#hero').screenshot(path=f'{out}/art-hero-day.png')
    await pg.evaluate('__art.setMode("night")'); await pg.wait_for_timeout(1500)
    await pg.locator('#hero').screenshot(path=f'{out}/art-hero-night.png')
    await pg.locator('#sheet').screenshot(path=f'{out}/art-sheet.png')
    await pg.locator('#props').screenshot(path=f'{out}/art-props.png')
    await pg.locator('#ui').screenshot(path=f'{out}/art-ui.png')
    await pg.screenshot(path=f'{out}/art-full.png',full_page=True)
    print('errors:',errs)
    await b.close()
asyncio.run(run())
