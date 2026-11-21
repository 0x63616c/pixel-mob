# Tiny placeholder company.json (ENGINE fallback only; the DATA agent owns the real one).
import json, random, re
random.seed(7)
W,H=64,40
blocked=[['.']*W for _ in range(H)]
tiles=[['.']*W for _ in range(H)]
furn=[]; desks=[]; sections=[]; rooms=[]; tables=[]
def solid(x,y,w,h):
    for j in range(y,y+h):
        for i in range(x,x+w): blocked[j][i]='#'
def F(t,x,y,w=1,h=1,s=True,**k):
    furn.append(dict(id=f"f{len(furn)}",type=t,x=x,y=y,w=w,h=h,solid=s,**k));
    if s: solid(x,y,w,h)
teams=[("refine","Macrodata Refinement","eng","#2f6f68"),("calib","Output Calibration","eng","#3d7f8f"),("align","Alignment & Gratitude","gtm","#8a6d3b"),("ops","Optics & Design","design","#7a5a8c")]
secs=[(4,8),(20,8),(4,22),(20,22)]
people=[]
names="Ada Bram Cyd Dina Emil Faye Gus Hana Ivo Juno Kit Lev Mara Nico Opal Pim Quin Rhea Sol Tova Uri Vera Wes Yara".split()
hairs=["#2b1d14","#5a3a22","#c9a15a","#1a1a1a","#8a3b1e","#d9d0c0"]; shirts=["#3b4a6b","#6b4a3b","#4a4a4a","#2f5f5a","#8a6d3b","#7a3b2e","#cfc6a8"]
styles=["short","side-part","curly","bun","long","bob","afro","pompadour","mullet","buzz"]
traitsall=["early-bird","night-owl","snacker","chatty","focused","meeting-lover","pacer","caffeinated","napper","gossip","devout","rebel","anxious","dog-lover"]
pi=0
for si,(tid,tn,org,col) in enumerate(teams):
    sx,sy=secs[si]; r=dict(x=sx,y=sy,w=14,h=10)
    sections.append(dict(id="s_"+tid,name=tn,sign=tn.upper(),teamIds=[tid],rect=r,label=dict(x=sx+7,y=sy)))
    for j in range(sy+1,sy+9):
        for i in range(sx,sx+14): tiles[j][i]='s'
    # two pods of 4: desks at rows sy+3 (facing down to desk at sy+4?) -> chair row sy+2 facing down, desk row sy+3..4, chair row sy+5 facing up
    for pod in range(2):
        px=sx+2+pod*6
        tables.append(dict(id=f"t{si}{pod}",sectionId="s_"+tid,x=px,y=sy+4,w=4,h=2))
        F("desk",px,sy+4,4,2,True)
        for k in range(2):
            for (cy,fac,my) in ((sy+3,"down",sy+4),(sy+6,"up",sy+5)):
                did=f"d{si}{pod}{k}{fac[0]}"
                x=px+1+k*2-1
                desks.append(dict(id=did,x=x+0,y=cy,facing=fac,sectionId="s_"+tid,tableId=f"t{si}{pod}",monitor=dict(x=x,y=my),ownerId=None,kind="desk"))
    for d in [d for d in desks if d["sectionId"]=="s_"+tid][:6]:
        n=names[pi]; pi+=1
        pid=n.lower(); d["ownerId"]=pid
        tr=random.sample(traitsall,2)
        people.append(dict(id=pid,name=n+" "+random.choice(["Lark","Moss","Penn","Quill","Reed","Stroud","Tate","Vane"]),first=n,role=random.choice(["Senior Refiner","Numbers Whisperer","Lead Calibrator","Gratitude Associate","Staff Aligner","Principal Sorter"]),
          teamId=tid,org=org,managerId=None,deskId=d["id"],kind="staff",arrive=random.choice(["07:30","09:00","09:20","09:45","10:10","11:00"]),leave=None,
          traits=tr,needs=dict(energy=.8,hunger=.3,social=.5,stress=.3,focus=.6),
          look=dict(skin=random.randint(0,6),hair=random.choice(hairs),hairStyle=random.choice(styles),shirt=random.choice(shirts),pants="#3a3a3a",accessory=random.choice(["none","glasses","tie","headphones","none"])),
          belongings=random.sample(["mug","photo","cactus","figurine","stressball","plant","rubberduck","snowglobe"],2),quirk="Alphabetises the numbers by feel.",task="Refining file 'Cold Harbor-ish'",seed=random.randint(1,9999),calendar=[]))
# rooms
def room(id,name,size,cap,x,y,w,h):
    seats=[]
    tx,ty,tw,th=x+1,y+1,w-2,h-2
    if size=="booth": F("pod-booth",x,y,1,1,False); seats=[dict(x=x+1,y=y+1,facing="left")]
    elif size=="allhands":
        F("stage",x+2,y+1,w-4,1,True); F("screen",x+w//2-1,y,2,1,True)
        for j in range(y+3,y+h-1,2):
            for i in range(x+1,x+w-1): seats.append(dict(x=i,y=j,facing="up")); F("chair",i,j,1,1,False)
    else:
        F("table",tx+1,ty+1,tw-2,th-2,True)
        for i in range(tx+1,tx+tw-1): seats+= [dict(x=i,y=ty,facing="down"),dict(x=i,y=ty+th-1,facing="up")]
        for j in range(ty+1,ty+th-1): seats+= [dict(x=tx,y=j,facing="right"),dict(x=tx+tw-1,y=j,facing="left")]
        for s in seats: F("chair",s["x"],s["y"],1,1,False)
    for j in range(y,y+h):
        for i in range(x,x+w):
            if i in(x,x+w-1) or j in(y,y+h-1): tiles[j][i]='o'
    rooms.append(dict(id=id,name=name,size=size,capacity=cap,rect=dict(x=x,y=y,w=w,h=h),interior=dict(x=x,y=y,w=w,h=h),doorTile=dict(x=x+w//2,y=y+h-1),
       waitTiles=[dict(x=x+w//2+k,y=y+h+1) for k in range(-1,2)],seats=seats[:max(cap,len(seats))],sign=dict(x=x+w/2,y=y-0.6,text=name)))
room("r_booth1","Quiet Contemplation","booth",1,38,8,3,3)
room("r_booth2","Phone Nook","booth",1,38,12,3,3)
room("r_hud1","Huddle Harmony","huddle",4,43,8,5,5)
room("r_hud2","Small Mercies","huddle",4,49,8,5,5)
room("r_team1","Team Accord","team",8,43,15,7,6)
room("r_board","The Boardroom of Plenty","boardroom",14,38,22,10,7)
room("r_all","Gratitude Assembly","allhands",48,50,22,13,12)
# kitchen / poi
F("counter",36,32,6,1); F("coffee-machine",36,31,1,1); F("microwave",38,31,1,1); F("fridge",40,31,1,1); F("snack-bar",44,31,2,1)
F("reception-desk",34,3,3,1); F("elevator",29,0,4,3)
F("plant-tall",3,7); F("plant",18,7); F("plant-tall",34,20); F("bookshelf",4,34,3,1); F("sofa",5,36,3,1); F("printer",18,20)
F("portrait",24,34,2,1); F("cabinet",60,2); F("water-cooler",36,20)
for j in range(31,36):
    for i in range(35,47): tiles[j][i]='k'
pointsofinterest=dict(elevator=dict(x=30.5,y=3.5),entrance=dict(x=30.5,y=4.5),reception=dict(x=35.5,y=4.5),receptionGreet=dict(x=32.5,y=5.5),kitchen=dict(x=40.5,y=34),coffee=dict(x=36.5,y=33.5),
  microwave=dict(x=38.5,y=33.5),snackbar=dict(x=44.5,y=32.5),library=dict(x=6.5,y=35.5),printer=dict(x=18.5,y=21.5),muster=dict(x=30,y=-6),shrine=dict(x=25,y=35.5),
  breakroom=dict(x=12,y=37),wellness=dict(x=17,y=37),dogBed=dict(x=28,y=30),voidCorridorStart=dict(x=-10,y=20,facing="left"))
queues=dict(coffee=[dict(x=36,y=33+k) for k in range(5)],microwave=[dict(x=38,y=33+k) for k in range(5)],snackbar=[dict(x=44,y=33+k) for k in range(5)],reception=[dict(x=33,y=5+k) for k in range(3)])
rec=dict(id="petra",name="Petra Gale",first="Petra",role="Receptionist of First Impressions",teamId="align",org="ops",kind="receptionist",deskId=None,arrive="07:00",traits=["chatty","devout"],
   look=dict(skin=2,hair="#c9a15a",hairStyle="bun",shirt="#8a6d3b",pants="#3a3a3a",accessory="glasses"),belongings=["candle"],quirk="Greets the elevator even when it's empty.",task="Welcoming",seed=11,calendar=[dict(start="00:00",end="24:00",title="Reception",type="reception",roomId="reception",attendees=["petra"])])
fac=[dict(id=f"fac{i}",name=f"Facilities {i}",first=["Gray","Ash"][i],role="Facilities",teamId="ops",org="ops",kind="facilities",arrive="07:00",traits=[],look=dict(skin=i*3,hair="#555",hairStyle="buzz",shirt="#8f9296",pants="#8f9296",accessory="none"),
  quirk="Silent.",task="Tidying",seed=40+i,calendar=[dict(start="00:00",end="24:00",title="Tidy",type="tidy",roomId="floor",attendees=[f"fac{i}"])]) for i in range(2)]
sup=dict(id="sup",name="Mr. Hollis",first="Hollis",role="Floor Supervisor",teamId="ops",org="ops",kind="supervisor",arrive="07:00",traits=["devout"],look=dict(skin=1,hair="#1a1a1a",hairStyle="side-part",shirt="#232b3b",pants="#232b3b",accessory="tie"),quirk="Never blinks.",task="Rounds",seed=50,
  calendar=[dict(start="00:00",end="24:00",title="Rounds",type="patrol",roomId="floor",attendees=["sup"])])
# calendars
staff=[p for p in people]
for t,_,_,_ in teams:
    mem=[p["id"] for p in staff if p["teamId"]==t]
    for (s,e,title,ty,rid) in [("09:30","09:45","Standup","standup",{"refine":"r_hud1","calib":"r_hud2","align":"r_team1","ops":"r_board"}[t]),("12:00","12:40","Lunch","lunch","kitchen"),("03:00","03:30","Night Sync","sync",{"refine":"r_team1","calib":"r_board","align":"r_hud1","ops":"r_hud2"}[t])]:
        for p in staff:
            if p["teamId"]==t: p["calendar"].append(dict(start=s,end=e,title=title,type=ty,roomId=rid,attendees=mem))
for p in staff:
    p["calendar"].append(dict(start="01:00",end="02:00",title="Desk Nap",type="nap",roomId="desk",attendees=[p["id"]]))
    p["calendar"].append(dict(start="15:00",end="15:30",title="Gratitude Assembly",type="allhands",roomId="r_all",attendees=[q["id"] for q in staff]))
a,b=staff[0],staff[1]
for p in (a,b): p["calendar"].append(dict(start="11:00",end="11:30",title="1:1 (boardroom, why)",type="1on1",roomId="r_board",attendees=[a["id"],b["id"]],mismatch=True))
def ev(id,name,kind,loc,radius,dur,join,emotes,manual=True,chance=0,schedule=None,chains=[],effects={},reactions=None,label=None,emoji="!"):
    return dict(id=id,name=name,kind=kind,manual=manual,panel=dict(label=label or name,emoji=emoji),schedule=schedule,chance=chance,cooldown=120,location=loc,radius=radius,duration=dur,
      effects=effects,joinBehavior=join,anim=dict(join="run",react="turn-head"),emotes=emotes,lineKey=id,gossipable=True,
      reactions=reactions or dict(default=dict(join=.5,ignore=.3,gossip=.3,flee=0),snacker=dict(join=2),focused=dict(ignore=2),gossip=dict(gossip=2)),chainsTo=chains,tickerTemplates=[f"{name}. {{name}} noticed first."])
events=[
 ev("coffeeBroken","The coffee machine is broken","random",dict(type="poi",ref="coffee"),10,60,"queue",["😤","☕"],chance=.02,chains=[dict(id="coffeeFixed",delay=45,chance=1)],emoji="☕",effects=dict(needs=dict(stress=.1))),
 ev("coffeeFixed","Coffee machine repaired","chained",dict(type="poi",ref="coffee"),12,10,"watch",["🎉"],manual=False,emoji="🎉"),
 ev("donuts","Donut drop in the kitchen","manual",dict(type="poi",ref="kitchen"),None,30,"swarm",["🍩","❗"],emoji="🍩",effects=dict(needs=dict(hunger=-.4))),
 ev("prodDown","The Numbers Are Wrong","manual",dict(type="global"),None,40,"sprint",["😱","💀"],emoji="💀",chains=[dict(id="prodFixed",delay=35,chance=1)],reactions=dict(default=dict(join=.2,ignore=.2,gossip=.8),focused=dict(join=1),anxious=dict(flee=1))),
 ev("prodFixed","The Numbers are right again","chained",dict(type="global"),None,10,"none",["🎉"],manual=False),
 ev("fireDrill","Fire drill","manual",dict(type="global"),None,25,"evacuate",["😱","❗"],emoji="🔥"),
 ev("fish","Someone microwaved fish","random",dict(type="poi",ref="microwave"),8,20,"none",["🐟","😤"],chance=.03,emoji="🐟",reactions=dict(default=dict(join=0,ignore=.3,gossip=.4,flee=.8))),
 ev("funding","Funding round closed!","manual",dict(type="global"),None,30,"gather",["🎉","💸"],emoji="💸"),
 ev("birthday","Surprise birthday cake","manual",dict(type="poi",ref="kitchen"),None,25,"swarm",["🎂","🎉"],emoji="🎂"),
 ev("tacoTuesday","Taco Tuesday","scheduled",dict(type="poi",ref="kitchen"),None,60,"swarm",["🌮"],manual=True,schedule=dict(days=["tue"],time="12:15"),emoji="🌮"),
 ev("fridayDeploy","Friday 4:55 deploy","scheduled",dict(type="global"),None,20,"watch",["😱","🎉"],schedule=dict(days=["fri"],time="16:55"),chains=[dict(id="prodDown",delay=10,chance=.5)],emoji="🚀"),
]
lines=dict(bubbles=dict(working=["Refining.","These numbers feel scary.","Per my last memo...","Is this scalable?","Aligning the outputs."],coffee=["Coffee first.","Bean me up."],gossip=["Did you hear?","You won't believe this."],gossipReply=["No way.","Wait, what?"],
  coffeeBroken=["NO COFFEE?","This is a crisis.","I can't refine like this."],coffeeFixed=["IT LIVES!","Praise the beans."],donuts=["DONUTS!","Mine!","Is that a cruller?"],prodDown=["Who broke the numbers?","It was like that when I got here.","Rolling back!"],
  prodFixed=["Numbers restored.","Ship it."],fireDrill=["Is this real?","Single file, people!"],fish=["Who did this.","Ugh, the fish."],funding=["We're rich!","Series Q!"],birthday=["Happy birthday!","Cake!"],tacoTuesday=["Tacos!","Taco o'clock."],fridayDeploy=["Deploying at 4:55?!","Bold."],
  meeting=["Let's circle back.","Can everyone see my screen?","This could've been a memo."],nap=["zzz..."],waking=["I'm up! I'm up!"],tired3am=["What day is it?","3 AM sync, love it."],waitingOutside=["Are they done yet?"],knock=["*knock knock*"],
  receptionistGreeting=["Welcome back.","The elevator loves you."],supervisor=["Keep refining.","Eyes on your numbers."],arriving=["Morning!","Is it morning?"],mismatch=["Bit roomy for two."],idle=["Hmm."]),
  ticker=dict(), founderQuotes=["We refine. We align. We are grateful."], tasks=dict(default=["Refining file 7","Calibrating outputs","Aligning the numbers"]))
data=dict(meta=dict(tileSize=16,startTime="07:00",startDay="mon",version="fallback"),
  company=dict(name="Placeholder Co.",tagline="We refine. We align. We are grateful.",mission="Refinement.",product="The Numbers",stage="Series ?",version="0.1.0",founder=dict(name="The Founder",title="Founder"),values=["Gratitude"],
    quotas=[dict(teamId=t[0],label="Q4 Refinement",target=1) for t in teams],rivalries=[dict(a="refine",b="calib",name="Refinement vs Calibration")],prizes=["Melon Hour","Waffle Ceremony"]),
  orgs=[dict(id=o,name=o) for o in ["eng","gtm","design","ops"]],teams=[dict(id=t,name=n,shortName=n.split()[0],org=o,color=c,sectionId="s_"+t,leadId=None,quota=dict(label="Q4 Refinement",start=random.random()*.5)) for t,n,o,c in teams],
  people=people+[rec]+fac+[sup],visitors=[],pets=[dict(id="goat",name="Gerald",species="goat",look=dict(body="#e8e2d4"),bed=None,traits=[],quirk="Appears.",appearsFromNowhere=True)],
  layout=dict(w=W,h=H,tileSize=16,tiles=["".join(r) for r in tiles],blocked=["".join(r) for r in blocked],sections=sections,tables=tables,desks=desks,furniture=furn,poi=pointsofinterest,queues=queues,
    elevator=dict(rect=dict(x=29,y=0,w=4,h=3),doorTiles=[dict(x=30,y=3),dict(x=31,y=3)],spawn=dict(x=30.5,y=1.5)),signs=[dict(id="sg1",x=30,y=-2,text="Alignment is its own reward.",kind="motivational")],
    voidProps=[dict(id="v1",type="cabinet",x=-20,y=10,note="lone filing cabinet"),dict(id="v2",type="plant",x=90,y=30,note="a single plant")],
    patrolRoute=[dict(x=3,y=6),dict(x=36,y=6),dict(x=36,y=20),dict(x=3,y=20),dict(x=3,y=38),dict(x=48,y=38)],tidyRoute=[dict(x=10,y=19),dict(x=30,y=19),dict(x=30,y=30),dict(x=10,y=30)],wanderSpots=[dict(x=20,y=19),dict(x=34,y=26)]),
  rooms=rooms,events=events,lines=lines)

def snake(k): return re.sub(r'([a-z0-9])([A-Z])',r'\1_\2',k).lower()
ren={"coffeeBroken":"coffee-machine-breaks","coffeeFixed":"coffee-repair","donuts":"donut-drop","prodDown":"prod-down","prodFixed":"prod-fixed","fireDrill":"fire-drill","fish":"microwave-fish","funding":"funding-round","birthday":"birthday-cake","tacoTuesday":"taco-tuesday","fridayDeploy":"friday-deploy"}
def conv(o,parent=None):
    if isinstance(o,dict): return {(k if parent in('bubbles','ticker') else snake(k)):conv(v,k) for k,v in o.items()}
    if isinstance(o,list): return [conv(v,parent) for v in o]
    if isinstance(o,str) and o in ren: return ren[o]
    return o
data=conv(data)
for k,v in list(data['lines']['bubbles'].items()):
    if k in ren: data['lines']['bubbles'][ren[k]]=data['lines']['bubbles'].pop(k)
json.dump(data,open("/workspace/pixel-office/game/assets/fallback/company.json","w"))
print(len(people),"staff",len(furn),"furniture")
