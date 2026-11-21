import sys, asyncio
from playwright.async_api import async_playwright
base='http://localhost:36661/art-preview.html'; out='/workspace/pixel-office/shots'
stops=sys.argv[1].split(',') if len(sys.argv)>1 else ['TANK','NAP PODS','BREAK','GOAT PEN','DESKS','KITCHEN','MAIL & IT','ARCHIVE','ALLHANDS']
async def run():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=await b.new_context(viewport={'width':1200,'height':900},device_scale_factor=1)
    pg=await ctx.new_page(); errs=[]
    pg.on('console',lambda m: errs.append(m.text) if m.type in('error','warning') else None)
    pg.on('pageerror',lambda e: errs.append(str(e)))
    await pg.goto(base); await pg.wait_for_function('window.__art && window.__art.ready',timeout=20000)
    for s in stops:
      await pg.evaluate(f'__art.focus({s!r})'); await pg.wait_for_timeout(700)
      await pg.locator('#map').screenshot(path=f"{out}/art2-{s.lower().replace(' & ','-').replace(' ','-')}.png")
    await pg.evaluate('__art.night(1)'); 
    for s in ['TANK','DESKS']:
      await pg.evaluate(f'__art.focus({s!r})'); await pg.wait_for_timeout(700)
      await pg.locator('#map').screenshot(path=f"{out}/art2-night-{s.lower()}.png")
    print('errors:',errs[:10])
    await b.close()
asyncio.run(run())
