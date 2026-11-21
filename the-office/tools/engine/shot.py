"""Headless Chromium (SwiftShader WebGL2) screenshots of the sim.
usage: shot.py URL OUT.png [--w 1280 --h 800 --dpr 1 --wait 8 --steps 'click:x,y;wait:2;shot:name.png']"""
import sys, asyncio, argparse, json
from playwright.async_api import async_playwright
ap=argparse.ArgumentParser(); ap.add_argument('url'); ap.add_argument('out')
ap.add_argument('--w',type=int,default=1280); ap.add_argument('--h',type=int,default=800); ap.add_argument('--dpr',type=float,default=1)
ap.add_argument('--wait',type=float,default=10); ap.add_argument('--steps',default=''); ap.add_argument('--mobile',action='store_true')
a=ap.parse_args()
ARGS=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl','--use-gl=angle']
async def run():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=ARGS)
    ctx=await b.new_context(viewport={'width':a.w,'height':a.h},device_scale_factor=a.dpr,is_mobile=a.mobile,has_touch=a.mobile)
    pg=await ctx.new_page(); errs=[]
    pg.on('console',lambda m: errs.append(m.type+': '+m.text) if m.type in('error','warning') else None)
    pg.on('pageerror',lambda e: errs.append('pageerror: '+str(e)))
    await pg.goto(a.url); await pg.wait_for_timeout(int(a.wait*1000))
    for st in [s for s in a.steps.split(';') if s]:
      k,_,v=st.partition(':')
      if k=='wait': await pg.wait_for_timeout(int(float(v)*1000))
      elif k=='click': x,y=map(float,v.split(',')); await pg.mouse.click(x,y)
      elif k=='tap': x,y=map(float,v.split(',')); await pg.touchscreen.tap(x,y)
      elif k=='drag':
        x1,y1,x2,y2=map(float,v.split(',')); await pg.mouse.move(x1,y1); await pg.mouse.down()
        for i in range(1,11): await pg.mouse.move(x1+(x2-x1)*i/10,y1+(y2-y1)*i/10); await pg.wait_for_timeout(16)
        await pg.mouse.up()
      elif k=='wheel': x,y,d=map(float,v.split(',')); await pg.mouse.move(x,y); await pg.mouse.wheel(0,d)
      elif k=='move': x,y=map(float,v.split(',')); await pg.mouse.move(x,y)
      elif k=='key': await pg.keyboard.press(v)
      elif k=='shot': await pg.screenshot(path=v); print('shot',v)
      elif k=='state': st=await pg.evaluate('window.__office||null'); print('state', st and {k:st.get(k) for k in ('clock','on_floor','events')})
      elif k=='js': print('js', await pg.evaluate(v))
    await pg.screenshot(path=a.out); print('saved',a.out)
    st=await pg.evaluate('window.__office||null')
    if st: print('state', {k:st.get(k) for k in ('clock','on_floor','events','fps','tension')}, 'audit', {k:st['audit'].get(k) for k in ('overlap_pairs','stuck_fixed','late')}, 'bubbles', st.get('bubbles'))
    print('errors:',[e for e in errs if 'GPU stall' not in e and '404' not in e][:15])
    await b.close()
asyncio.run(run())
