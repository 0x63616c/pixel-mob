import asyncio, base64, os, subprocess
from playwright.async_api import async_playwright
from PIL import Image
import io
base='http://localhost:36661/art-preview.html'; out='/workspace/pixel-office/shots'; fd='/tmp/artframes'
os.makedirs(fd, exist_ok=True); [os.remove(fd+'/'+f) for f in os.listdir(fd)]
async def run():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=await b.new_page(viewport={'width':1200,'height':900})
    await pg.goto(base); await pg.wait_for_function('window.__art && window.__art.ready')
    await pg.wait_for_timeout(500); await pg.evaluate('__art.setT(0)')
    for i in range(150):
      d=await pg.evaluate('__art.grab()'); im=Image.open(io.BytesIO(base64.b64decode(d.split(',')[1])))
      im.save(f'{fd}/f{i:04d}.png')
      if i==30: im.crop((40,70,200,170)).resize((640,400),Image.NEAREST).save(out+'/art-closeup-pods.png')
      if i==45: im.crop((230,20,400,200)).resize((510,540),Image.NEAREST).save(out+'/art-closeup-elevator-meeting.png')
      await pg.evaluate('__art.setT(%f)' % ((i+1)/12.0))
      await pg.wait_for_timeout(5)
    await b.close()
asyncio.run(run())
subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate','12','-i',fd+'/f%04d.png','-vf','scale=1200:750:flags=neighbor','-c:v','libx264','-pix_fmt','yuv420p','-crf','18','/workspace/pixel-office/art-preview.mp4'],check=True)
subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate','12','-i',fd+'/f%04d.png','-vf','scale=800:500:flags=neighbor,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=none','/workspace/pixel-office/art-preview.gif'],check=True)
print('ok')
