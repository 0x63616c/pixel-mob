import asyncio, base64, os, subprocess, io
from playwright.async_api import async_playwright
from PIL import Image
fd='/tmp/artframes2'; os.makedirs(fd, exist_ok=True); [os.remove(fd+'/'+f) for f in os.listdir(fd)]
STOPS=['TANK','DESKS','BREAK','GOAT PEN','KITCHEN','ARCHIVE']
async def run():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=await b.new_page(viewport={'width':1200,'height':900})
    await pg.goto('http://localhost:36661/art-preview.html'); await pg.wait_for_function('window.__art && window.__art.ready'); await pg.wait_for_timeout(500)
    i=0
    for si,s in enumerate(STOPS):
      await pg.evaluate(f'__art.focus({s!r}); __art.night({1 if si==1 else 0})')
      for k in range(36):
        await pg.evaluate('__art.setT(%f)' % (i/12.0)); await pg.wait_for_timeout(5)
        d=await pg.evaluate('__art.grabMap()'); Image.open(io.BytesIO(base64.b64decode(d.split(',')[1]))).save(f'{fd}/f{i:04d}.png'); i+=1
    await b.close()
asyncio.run(run())
subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate','12','-i',fd+'/f%04d.png','-vf','scale=1440:810:flags=neighbor','-c:v','libx264','-pix_fmt','yuv420p','-crf','18','/workspace/pixel-office/shots/art2-tour.mp4'],check=True)
subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate','12','-i',fd+'/f%04d.png','-vf','scale=960:540:flags=neighbor,split[a][b];[a]palettegen=max_colors=160[p];[b][p]paletteuse=dither=none','/workspace/pixel-office/shots/art2-tour.gif'],check=True)
