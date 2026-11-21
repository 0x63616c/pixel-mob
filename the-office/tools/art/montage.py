import json, sys
from PIL import Image, ImageDraw
A='/workspace/pixel-office/game/assets/art/'
a=json.load(open(A+'atlas.json')); S=Image.open(A+'props.png')
def mont(names, out, W=900, Z=2, frame=0):
    tiles=[]
    for n in names:
        p=a['props'][n]; fr=p['frames'][min(frame,len(p['frames'])-1)]; tiles.append((n,S.crop((fr[0],fr[1],fr[0]+fr[2],fr[1]+fr[3]))))
    x=y=rh=0; pos=[]
    for n,im in tiles:
        w,h=im.width*Z,im.height*Z+10
        if x+w>W: x=0;y+=rh+6;rh=0
        pos.append((n,im,x,y)); x+=max(w,60)+8; rh=max(rh,h)
    bg=Image.new('RGB',(W,y+rh+6),(246,245,241)); d=ImageDraw.Draw(bg)
    for n,im,x,y in pos:
        bg.paste(im.resize((im.width*Z,im.height*Z),Image.NEAREST),(x,y),im.resize((im.width*Z,im.height*Z),Image.NEAREST)); d.text((x,y+im.height*Z+1),n[:16],fill=(120,130,128))
    bg.save(out)
groups={
 'needs':['ping-pong-table','vending-machine','aquarium-tank','fish-food-shelf','nap-pod','mystery-door','goat-fence','goat-fence_v','goat-fence_post','hay-bale','goat-bed','plant-wall','plant-wall_1x2','mail-slot','mail-counter','package','package_typo','it-desk','archive-shelf','bookshelf-wide','whiteboard','whiteboard-full','intercom','fish-food-flake','crt_glitch','portrait']+['fish_'+f for f in ['gerald','pamela','steve','the-intern','muriel','dot']],
 'furn':['reception-desk','microwave','fridge','snack-bar','toilet-door','rug_6x3','counter','bin','dog-bed','candle','screen_4x1','pod-booth','desk-chair_down_teal','desk-chair_up_orange','desk-chair_left_mustard','armchair_down_teal','armchair_up_mustard','armchair_right_orange','stool','sofa','beanbag_orange','beanbag_teal','coffee-machine','printer','cabinet','table_10x2','table_4x2','table_1x2','plant_monstera','plant_fern','plant_rubber','plant_succulent'],
 'small':['lava_lamp','rolodex','desk_fan','pencil_cup','globe','trophy','binder_stack','snow_globe','sticky_notes','desk_radio','bonsai','clipboard','typewriter','pennant','mug_green','mug_mint','mug_sea','stapler','certificate','headphones_desk','fx_paper','fx_sweat','fx_dust','fx_note','fx_heart','fx_bubbles','fx_steam_big','fx_zzz_big','fx_sparkles','fx_confetti_big','fluoro_panel_48','shadow_soft_2','shadow_person_soft','glow_monitor','glow_lamp','glow_fluoro','signtxt_sign-1','sectxt_sec-shelf','roomtxt_'+[k for k in a['props'] if k.startswith('roomtxt_')][0][8:],'tiny_font']+[f'isle_{L}_c' for L in 'xklanbqgmipvs'],
}
for g,n in groups.items(): mont(n,f'/tmp/m_{g}.png',Z=3 if g=='small' else 2, frame=int(sys.argv[1]) if len(sys.argv)>1 else 3)
