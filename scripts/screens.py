import asyncio
from playwright.async_api import async_playwright
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
B='http://127.0.0.1:8799'
async def main():
  async with async_playwright() as p:
    for br in ['chromium','webkit']:
      browser=await getattr(p,br).launch(**({'executable_path':'/usr/bin/google-chrome','args':['--no-sandbox']} if br=='chromium' else {}))
      for size in ['desktop','iphone']:
        ctx=await browser.new_context(**({'viewport':{'width':1280,'height':800},'device_scale_factor':1} if size=='desktop' else p.devices['iPhone 13']))
        pg=await ctx.new_page(); errors=[]
        pg.on('pageerror',lambda e:errors.append(str(e)));pg.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
        pre=f'{ROOT}/brand/after/{br}-{size}'
        await pg.goto(B+'/');await pg.wait_for_timeout(10000);await pg.screenshot(path=pre+'-landing.png');await pg.screenshot(path=pre+'-landing-full.png',full_page=True)
        await pg.goto(B+'/new');await pg.wait_for_timeout(1500);await pg.click('#msg');await pg.keyboard.type('hi george',delay=50);await pg.wait_for_timeout(4500);await pg.screenshot(path=pre+'-creator.png')
        link=await pg.evaluate('__crowd.link');print(br,size,'link',link, 'errors',errors)
        await pg.goto(link+'?capture=1');await pg.wait_for_timeout(200);await pg.evaluate('__crowd.step(2600)');await pg.screenshot(path=pre+'-reveal-card.png')
        await pg.evaluate('__crowd.reveal()');await pg.evaluate('__crowd.step(370)');await pg.screenshot(path=pre+'-assemble.png');print('bubble',await pg.evaluate('__crowd.bubble'))
        await pg.evaluate('__crowd.step(9500)');await pg.screenshot(path=pre+'-reveal.png');print('final',await pg.evaluate('[__crowd.mode,__crowd.text,__crowd.states]'))
        await ctx.close()
      await browser.close()
asyncio.run(main())
