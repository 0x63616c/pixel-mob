"""Render the two 1200x630 share cards from the live app's own og mode (served by `npm run dev`)."""
import asyncio, sys
from pathlib import Path
from playwright.async_api import async_playwright
ROOT = Path(__file__).resolve().parent.parent
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8799'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width': 800, 'height': 420}, device_scale_factor=1.5)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(BASE + '/?og=landing&capture=1'); await pg.wait_for_timeout(300)
        await pg.evaluate('__crowd.form()')
        for _ in range(400):
            await pg.evaluate('__crowd.step(50)')
            if await pg.evaluate('__crowd.mode') == 'hold': break
        for _ in range(4): await pg.evaluate('__crowd.step(50)')
        await pg.screenshot(path=str(ROOT / 'site/og.png'))
        await pg.goto(BASE + '/?og=message&capture=1'); await pg.wait_for_timeout(300)
        for _ in range(10): await pg.evaluate('__crowd.step(50)')
        await pg.screenshot(path=str(ROOT / 'site/og-message.png'))
        print('og errors:', errs)
        await b.close()
asyncio.run(main())
