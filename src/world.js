// ---------- app state ----------
const $=id=>document.getElementById(id);
const cv=$("c"),ctx=cv.getContext("2d",{alpha:false});
const lost=$("lost"),root=document.documentElement;
const params=new URLSearchParams(location.search);
const CAPTURE=params.has("capture"),OG=params.has("og"),OGK=params.get("og")==="message"?"message":"landing";
const RM=!CAPTURE&&matchMedia("(prefers-reduced-motion: reduce)").matches;
let W=0,H=0,DPR=1,S=3,slots=[],people=[],parts=[],mode="wander",modeT=0,now=0,box=null,firstRun=true;
let text="PIXEL MOB",APP="home",sPhase="intro",appT=0,teaserT=0,replayIn=-1,endShown=false,celebrate="full",nextRipple=0,panelOpen=false,lastForm=0;
let dprCap=3,frameEMA=16.7,slowFrames=0;
const ptr={x:-1e9,y:-1e9,vx:0,vy:0,t:-9,down:null};
const REC=CAPTURE&&params.has("rec"),DEBUG=params.has("debug");
// the look of the mob: theme, colours and size come from the link (or the creator, live)
let THEME="default",MOBC=-1,BGC=-1,SIZE="medium",BG="#f4f2ee",DARK=false,CH=16,MSG=null;
let seq=null,nextText=null,replaySay=undefined,fidgetT=1,waveAt=9,pid=0;
// NO-COLLISION: two people overlap when their ground footprints (8 x 4 art pixels) intersect
const FX=8,FY=4;
let overlaps=0,maxOverlaps=0,overlapTotal=0;

// Routes (mirrors worker/index.js): /<code> share links, legacy /s/<code> and /#<code>, /new creator, / landing, else 404
const RESERVED=new Set(["new","create","make","s","api","stats","the-office","index","index.html","app"]);
const PATH=location.pathname.replace(/\/{2,}/g,"/").replace(/(.)\/+$/,"$1");
let LEGACY=false,CODE="";
function shareCode(){
  let m=PATH.match(/^\/s\/([A-Za-z0-9_-]{2,180})$/);if(m){LEGACY=true;return m[1];}
  m=PATH.match(/^\/([A-Za-z0-9_-]{4,180})$/);if(m&&!RESERVED.has(m[1].toLowerCase()))return m[1];
  if(PATH!=="/")return null;
  const h=location.hash.match(/^#(?:s[=\/])?([A-Za-z0-9_-]{2,180})$/);if(h&&!/^(create|make|new|how)$/i.test(h[1])){LEGACY=true;return h[1];}
  if(params.get("s")){LEGACY=true;return params.get("s");}
  return null;
}
const LANDING_WORDS=["PIXEL MOB","HI MUM!","HAPPY BDAY!","MARRY ME?","GG WP","PIXEL MOB","SEE YOU SOON","YOU ROCK"];
let wordIx=0;
(function route(){
  if(OG){APP="og";text=OGK==="landing"?"PIXEL MOB":"HELLO THERE";return;}
  const code=shareCode();
  if(code!==null){const m=decodePayload(code.trim());
    if(m){APP="surprise";MSG=m;CODE=code.trim();text=m.scenes[0];THEME=m.theme;MOBC=m.mob;BGC=m.bg;SIZE=m.size;
      if(LEGACY&&!CAPTURE)try{history.replaceState(null,"","/"+code.trim());}catch(_){}}
    else{APP="error";text="???";}
    return;}
  if(PATH==="/"||PATH==="/new"||PATH==="/create"){APP="home";text=cleanText(params.get("text")||"")||LANDING_WORDS[0];
    if(THEMES.includes(params.get("theme")))THEME=params.get("theme");if(SIZES.includes(params.get("size")))SIZE=params.get("size");return;}
  APP="lost";text="404";
})();
root.dataset.app=APP;
const HAT_THEMES=new Set(["birthday","christmas","halloween","wedding"]);
function lum(hex){const n=parseInt(hex.slice(1),16);return (0.2126*(n>>16)+0.7152*(n>>8&255)+0.0722*(n&255))/255;}
function applyLook(){BG=BGC>=0?BG_COLORS[BGC]:(THEME_DEF[THEME]||THEME_DEF.default).bg;DARK=lum(BG)<0.45;
  root.dataset.theme=THEME;root.classList.toggle("dark",DARK);
  const tc=document.querySelector('meta[name="theme-color"]');if(tc&&APP!=="home")tc.content=BG;}
applyLook();
const AUTO_APP=APP==="home"||APP==="lost";

// ---------- speech bubble (pixel font, cached per phrase, drawn at whole-pixel scales only) ----------
const INK="#2d2420",BUB={h:15},bubbleCache=new Map();
function bubbleImg(str){
  if(bubbleCache.has(str))return bubbleCache.get(str);
  const r=rasterLines([str]),w=r.cols+8,h=r.rows+7,c=document.createElement("canvas");c.width=w;c.height=h+1;
  const x=c.getContext("2d");
  x.fillStyle=INK;x.fillRect(1,0,w-2,h);x.fillRect(0,1,w,h-2);x.fillRect(2,h,w-3,1);
  x.fillStyle="#fffdf8";x.fillRect(2,1,w-4,h-2);x.fillRect(1,2,w-2,h-4);
  x.fillStyle=INK;r.cells.forEach(([cx,cy])=>x.fillRect(cx+4,cy+3,1,1));
  bubbleCache.set(str,c);BUB.h=c.height+4;return c;
}
// ---------- layout ----------
const saEl=$("sa");
const safe=()=>{const cs=getComputedStyle(saEl);return {t:parseFloat(cs.paddingTop)||0,b:parseFloat(cs.paddingBottom)||0};};
function panelTopCss(){const p=$("panel");const b=parseFloat(getComputedStyle(p).bottom)||0;return innerHeight-b-p.offsetHeight;}
function region(){
  const sa=safe();let top=Math.max((sa.t+18)*DPR,H*0.06);
  let bot;
  if(APP==="home"&&!OG){const hd=$("top");top=Math.max(top,(hd.offsetTop+hd.offsetHeight+6)*DPR);}
  if(panelOpen)bot=(panelTopCss()-16)*DPR;
  else if(APP==="home"){const hero=$("hero");bot=(hero.offsetTop-10)*DPR;}
  else if(APP==="lost")bot=H-(150+sa.b)*DPR;
  else if(APP==="og"&&OGK==="landing")bot=H*0.74;
  else if(APP==="og")bot=H;
  else bot=H-(108+sa.b)*DPR;
  if(bot-top<H*0.2)bot=Math.min(H,top+H*0.2);
  return {top,bot};
}
function computeLayout(){
  const {top,bot}=region(),rh=bot-top;
  const cap=Math.max(1,Math.round((APP==="surprise"?4:3)*DPR));
  const single=!text.includes(" ");
  let best=null;
  const PU=HAT_THEMES.has(THEME)?18:16; // rows get taller when everyone wears a hat, so hats never poke into the row above
  for(const lines of lineOptions(text,H>W*1.3?4:3)){
    const hats=HAT_THEMES.has(THEME),base=rasterLines(lines,{hats});
    // Native huge art, not a nearest-neighbour blow-up. Fall back as one unit at the mob cap.
    const large=SIZE==="huge"?rasterLines(lines,{hats,huge:true}):null;
    // huge only when it still fits at one art-pixel per device pixel (a slow device may have lowered DPR)
    const fits=x=>W*0.92/(x.cols*10)>=1&&rh*0.94/(x.rows*PU)>=1;
    const r=large&&large.cells.length<=760&&fits(large)?large:sizeCells(base);
    // narrow screens: let neighbours stand shoulder to shoulder (outlines touch) to win a bigger crowd
    const tight=W*0.92/(r.cols*11)<rh*0.94/(r.rows*PU);
    const cwU=tight?10:11;
    const sFit=Math.min(W*0.92/(r.cols*cwU),rh*0.94/(r.rows*PU));
    // integer art-pixels on 1x screens; on retina, half-steps stay crisp (nearest-neighbour) and fit phones better
    const s=DPR>=2?Math.max(1,Math.min(Math.floor(sFit*2)/2,cap)):Math.max(1,Math.min(Math.floor(sFit),cap));
    const eff=Math.min(sFit,cap);
    const score=eff*(1-0.1*(lines.length-1))*(single&&lines.length>1?0.85:1)+s*0.001;
    if(!best||score>best.score)best={r,s,score,cwU};
  }
  S=best.s;
  const r=best.r,cw=best.cwU*S,ch=PU*S,totW=r.cols*cw,totH=r.rows*ch;CH=ch;
  const ox=Math.round((W-totW)/2),oy=Math.round(top+(rh-totH)/2);
  slots=r.cells.map(([c,rr,tint])=>({x:Math.round(ox+c*cw+cw/2),y:Math.round(oy+rr*ch+ch),row:rr,tint:tint||null}));
  box={x:ox,y:oy,w:totW,h:totH,cx:ox+totW/2,cy:oy+totH/2,last:slots.reduce((m,s)=>Math.max(m,s.row),0)};
  // can someone walk straight down (or up) the column into this spot without brushing anyone?
  const half=FX*S;
  for(const a of slots){a.up=true;a.down=true;for(const b of slots){if(b===a||Math.abs(b.x-a.x)>=half)continue;if(b.row<a.row)a.up=false;else if(b.row>a.row)a.down=false;}}
  lost.style.top=((oy+totH)/DPR+20)+"px";
  cv.setAttribute("aria-label",APP==="surprise"&&(sPhase==="intro"||sPhase==="teaser")?"A mob of tiny pixel people wandering around":`A mob of tiny pixel people spelling “${toDisplay(text)}”`);
}
// mob size: small thins straight strokes (ends, corners and junctions stay); huge uses native drawings, else the medium grid
function sizeCells(r){
  if(SIZE==="small"){const has=new Set(r.cells.map(([x,y])=>x+","+y)),h=(x,y)=>has.has(x+","+y);
    return {cols:r.cols,rows:r.rows,cells:r.cells.filter(([x,y,tint])=>{if(tint)return true;const st=(h(x-1,y)&&h(x+1,y)&&!h(x,y-1)&&!h(x,y+1))||(h(x,y-1)&&h(x,y+1)&&!h(x-1,y)&&!h(x+1,y));return !st||((x+y)&1)===0;})};}

  return r;
}
function resize(){
  const oW=W||1,oH=H||1;
  DPR=CAPTURE&&+params.get("dpr")?+params.get("dpr"):Math.min(window.devicePixelRatio||1,dprCap);
  W=Math.round(innerWidth*DPR);H=Math.round(innerHeight*DPR);
  cv.width=W;cv.height=H;
  computeLayout();render();
  for(const p of people){p.x*=W/oW;p.y*=H/oH;p.tx*=W/oW;p.ty*=H/oH;if(p.path)p.path.forEach(w=>{w.x*=W/oW;w.y*=H/oH;});}
  syncCount();
  if(mode==="form"||mode==="hold")form({dramatic:false,celebrate:"none"});
}
function relayout(){const oS=S;computeLayout();if(S!==oS)people.forEach(p=>{p.z=0;p.vz=0;});syncCount();if(mode==="form"||mode==="hold")form({dramatic:false,celebrate:mode==="hold"?"none":celebrate});}

// ---------- crowd ----------
function spawn(fromEdge){
  const base=newLook(),L=dressLook(Object.assign({},base),THEME,MOBC),sheet=buildSheet(L);
  const p={id:++pid,base,look:L,sheet,baseSheet:sheet,sheets:{},x:0,y:0,vx:0,vy:0,z:0,vz:0,tx:0,ty:0,path:null,state:"walk",wait:0,dance:0,danceT:0,faceT:0,
    speedF:(L.zombie?rnd(0.55,0.75):rnd(0.8,1.25)),formF:(L.zombie?rnd(0.82,0.95):rnd(0.9,1.22)),dir:1,face:"S",dist:Math.random()*50,phase:Math.random()*10,
    slot:null,leaving:false,blinkT:rnd(1,4),blink:0,lookDir:0,lookT:rnd(1,4),act:null,emote:null,
    ox:0,oy:0,ovx:0,ovy:0,alertIn:-1,goIn:-1,quiet:false,hurry:false,turnAt:0,sx:0,sy:0};
  if(fromEdge){const e=Math.random(),m=SW*S*rnd(1,2.2);
    if(e<0.3){p.x=-m;p.y=H*rnd(0.12,0.95);}
    else if(e<0.6){p.x=W+m;p.y=H*rnd(0.12,0.95);}
    else if(e<0.8){p.x=W*rnd(0.05,0.95);p.y=-S*2;}
    else {p.x=W*rnd(0.05,0.95);p.y=H+SH*S+m;}
    p.dir=p.x<W/2?1:-1;}
  else{p.x=W*rnd(0.04,0.96);p.y=H*rnd(0.1,0.97);p.dir=Math.random()<.5?1:-1;}
  pickWander(p);
  return p;
}
// people standing on a drawing wear its colours
function sheetFor(p,tint){if(!tint)return p.baseSheet;return p.sheets[tint]||(p.sheets[tint]=buildSheet(Object.assign({},p.look,{shirt:tint,stripe:false})));}
function restyle(){applyLook();
  for(const p of people){p.look=dressLook(Object.assign({},p.base),THEME,MOBC);p.baseSheet=buildSheet(p.look);p.sheets={};
    p.sheet=p.state==="placed"&&p.slot?sheetFor(p,p.slot.tint):p.baseSheet;}}
function wanderBounds(){const m=SW*S;
  if(panelOpen){const r=region();return {x0:m,x1:W-m,y0:Math.max(SH*S+m*0.5,r.top),y1:Math.max(r.top+SH*S,r.bot)};}
  return {x0:m,x1:W-m,y0:SH*S+m*0.5,y1:H-m*0.6};}
function pickWander(p){
  const b=wanderBounds();
  let bx=0,by=0,bs=-1;
  for(let k=0;k<4;k++){const cx=b.x0+Math.random()*(b.x1-b.x0),cy=b.y0+Math.random()*(b.y1-b.y0);
    let near=1e18;for(const q of people){if(q===p)continue;const d=(q.tx-cx)**2+((q.ty-cy)*1.4)**2;if(d<near)near=d;}
    if(near>bs){bs=near;bx=cx;by=cy;}}
  p.tx=bx;p.ty=by;p.state="walk";p.slot=null;p.path=null;p.hurry=false;p.sheet=p.baseSheet;
}
function syncCount(){
  const n=slots.length;let active=people.filter(p=>!p.leaving);
  while(active.length<n){const p=spawn(!(OG));people.push(p);active.push(p);}
  if(active.length>n)active.slice(n).forEach(p=>{p.leaving=true;p.slot=null;p.state="walk";p.alertIn=p.goIn=-1;p.act=null;p.sheet=p.baseSheet;
    p.tx=p.x<W/2?-SW*S*rnd(4,9):W+SW*S*rnd(4,9);p.ty=p.y+rnd(-1,1)*S*20;
    // leave along the gap between rows, never through people
    if(box&&p.y>box.y&&p.y<box.y+box.h+S*4){const ly=laneNear(p.y);p.ty=ly;p.path=[{x:p.x,y:ly}];}else p.path=null;});
}
function crossesRow(p,w){
  if(p.x<box.x-FX*S*0.5||p.x>box.x+box.w+FX*S*0.5)return false;
  const s=p.slot,y0=Math.min(p.y,w.y),y1=Math.max(p.y,w.y),m=S*0.6;
  if(w.x===p.tx&&w.y===p.ty||Math.abs(w.x-p.tx)<1){ // last leg: an empty column is fine
    if(p.y<p.ty&&s.up&&Math.abs(p.x-p.tx)<S*3)return false;if(p.y>p.ty&&s.down&&Math.abs(p.x-p.tx)<S*3)return false;}
  for(let r=0;r<=box.last;r++){const yr=box.y+CH*(r+1);if(y0<yr-FY*S-m&&y1>yr+m)return true;}
  return false;}
function laneNear(y){const k=Math.round((y-box.y-CH/2)/CH);return box.y+CH/2+clamp(k,-1,box.last+1)*CH;}
// Paths never cut through a row: people come in from above/below when their row is the outermost one,
// otherwise they run to the side of the message, along the gap above their row, then step down into place.
function routeTo(p,s){
  const lane=s.y-CH/2,top=box.y-CH*0.25,bot=box.y+box.h+CH*0.35;
  // straight down an empty column from above the message, or up one from below
  if(s.up&&p.y<top)return [{x:s.x,y:Math.min(top,p.y+S*4),tight:1}];
  if(s.down&&p.y>bot)return [{x:s.x,y:Math.max(bot,p.y-S*4),tight:1}];
  const L=box.x-S*9,R=box.x+box.w+S*9;
  const sx=Math.abs(p.x-L)+Math.abs(s.x-L)<=Math.abs(p.x-R)+Math.abs(s.x-R)?L:R;
  const pts=[];
  if(p.x>box.x-S*6&&p.x<box.x+box.w+S*6&&p.y>box.y&&p.y<box.y+box.h+S*4){const ly=laneNear(p.y);pts.push({x:p.x,y:ly},{x:sx,y:ly});}
  pts.push({x:sx,y:lane},{x:s.x,y:lane,tight:1});
  return pts;
}
function assign(dramatic){
  const act=people.filter(p=>!p.leaving);
  // smart slots: match people to spots in order along a slightly random direction (1-D optimal transport),
  // so paths hardly cross, then route every path around the rows
  const a=rnd(-0.45,0.45),c=Math.cos(a),sn=Math.sin(a),jit=Math.max(S*6,box.w*0.035);
  const ps=act.map(p=>({p,k:p.x*c+p.y*sn+rnd(-jit,jit)})).sort((u,v)=>u.k-v.k);
  const ss=slots.map(s=>({s,k:s.x*c+s.y*sn})).sort((u,v)=>u.k-v.k);
  let maxD=1;act.forEach(p=>{maxD=Math.max(maxD,Math.hypot(p.x-box.cx,p.y-box.cy));});
  ps.forEach(({p},i)=>{const s=ss[i].s;p.slot=s;p.tx=s.x;p.ty=s.y;p.hurry=false;p.sheet=p.baseSheet;p.dance=0;
    p.path=routeTo(p,s);
    if(dramatic){const dc=Math.hypot(p.x-box.cx,p.y-box.cy)/maxD;
      p.alertIn=0.08+dc*0.55+rnd(0,0.12);p.goIn=p.alertIn+rnd(0.3,1.0);p.quiet=false;}
    else {p.alertIn=rnd(0,0.18);p.goIn=p.alertIn+rnd(0.02,0.3);p.quiet=true;}
    p.state="pre";p.act=null;p.turnAt=0;
  });
}
// "MOB, ASSEMBLE!": one person near the middle stops and shouts, everyone turns to look, then they all run to random spots
let leader=null,bubble=null,lastAssemble=-99;
function pickLeader(act){
  const cx=W/2,cy=(region().top+region().bot)/2,minY=(SHB*S+BUB.h*bubbleScale()+S*6);let best=null,bd=1e18;
  for(const p of act){if(p.x<SW*S*2||p.x>W-SW*S*2||p.y<minY||p.y>H-S*4)continue;
    const d=(p.x-cx)**2+((p.y-cy)*1.3)**2;if(d<bd){bd=d;best=p;}}
  return best;
}
function form(o){
  mode="form";modeT=0;celebrate=o.celebrate||"full";lost.classList.remove("on");maxOverlaps=overlaps;
  const quickRepeat=now-lastAssemble<2.6;
  if(!o.assemble||quickRepeat){assign(!!o.dramatic&&!o.assemble);
    if(o.assemble)people.forEach(p=>{if(!p.leaving&&p.state!=="placed"){p.state="walk";p.run=true;}});
    bubble=null;leader=null;return;}
  assign(false);
  const act=people.filter(p=>!p.leaving),L=pickLeader(act);
  const beat=RM?0.5:0.95;lastAssemble=now;
  if(!L){act.forEach(p=>{p.state="walk";p.run=true;});return;}
  leader=L;bubble={t:-(RM?0.02:0.12),life:beat,say:o.say||"MOB, ASSEMBLE!"};
  act.forEach(p=>{p.act=null;p.emote=null;p.hurry=false;
    const d=Math.hypot(p.x-L.x,p.y-L.y)/Math.max(1,diag());
    p.state="freeze";p.turnIn=p===L?0:(RM?0:0.06+d*0.5+rnd(0,0.1));p.goIn=beat+(p===L?0.06:(RM?0:rnd(0,0.16)));p.run=true;});
  L.face="F";L.lookDir=0;L.vx*=0.2;L.vy*=0.2;hop(L,S*1.6);
  $("sr").textContent=bubble.say.charAt(0)+bubble.say.slice(1).toLowerCase();
  sfx("shout");
}
function bubbleScale(){return Math.max(1,Math.round(Math.max(S,2*DPR)));}
function scatter(gentle){
  mode="wander";modeT=0;lost.classList.remove("on");
  if(gentle||RM){people.forEach(p=>{if(!p.leaving){pickWander(p);p.act=null;p.dance=0;p.ox=p.oy=p.ovx=p.ovy=0;}});return;}
  sfx("scatter");
  const cx=box.cx,cy=box.cy;
  people.forEach(p=>{if(p.leaving)return;
    p.slot=null;p.path=null;p.alertIn=p.goIn=-1;p.hurry=false;p.sheet=p.baseSheet;p.dance=0;
    let dx=p.x-cx+rnd(-1,1)*S*20,dy=p.y-cy+rnd(-1,1)*S*20;const d=Math.hypot(dx,dy)||1;
    const sp=Math.max(S*120,diag()*0.5)*rnd(0.55,1.2);
    p.vx=dx/d*sp;p.vy=dy/d*sp*0.75;p.state="burst";p.wait=rnd(0.45,0.85);p.face="F";
    p.ox=p.oy=p.ovx=p.ovy=0;p.act=null;
    hop(p,S*rnd(2.5,5));
    dust(p.x,p.y);dust(p.x,p.y);
  });
}
const diag=()=>Math.hypot(W,H);
const GRAV=()=>S*520;
function hop(p,h){if(RM)return;if(p.z<=0.01)p.vz=Math.sqrt(2*GRAV()*h);}
function dust(x,y){if(RM||parts.length>900)return;parts.push({k:"dust",x:x+rnd(-3,3)*S,y:y,vx:rnd(-1,1)*S*14,vy:-rnd(2,8)*S,life:rnd(.35,.6),t:0});}
const THEME_CONF={christmas:["#e74c3c","#2ecc71","#ffffff","#f1c40f"],halloween:["#e67e22","#8e44ad","#2ecc71","#f1c40f"],
  wedding:["#ffffff","#f6c5cf","#f1c40f","#ff8fa3"],stadium:["#e74c3c","#3a7bd5","#f1c40f","#ffffff"]};
function confetti(x,y,n){if(RM)return;const pal=THEME_CONF[THEME]||CONF;for(let i=0;i<n&&parts.length<1400;i++)parts.push({k:"conf",x,y,vx:rnd(-1,1)*S*34,vy:-rnd(40,95)*S,life:rnd(1.1,1.9),t:0,c:R(pal)});}
function onFormed(){
  const act=people.filter(p=>!p.leaving);
  act.forEach(p=>{if(p.state!=="placed"&&p.slot){p.x=p.tx;p.y=p.ty;p.state="placed";p.vx=p.vy=0;}});
  act.forEach(p=>{if(p.slot)p.sheet=sheetFor(p,p.slot.tint);});
  lastForm=modeT;mode="hold";modeT=0;nextRipple=7;fidgetT=1.6;waveAt=THEME==="stadium"?3.2:rnd(9,12);
  if(celebrate==="none"){act.forEach(p=>{p.face="F";});return;}
  sfx(celebrate==="big"?"cheer":"chime");
  if(celebrate==="big"&&THEME==="wedding")act.forEach(p=>{if(Math.random()<.35)setTimeout(()=>{p.emote={k:"heart",t:0,life:1.2};},rnd(500,1600));});
  const spread=celebrate==="big"?1.0:0.75;
  act.forEach(p=>{const fx=(p.x-box.x)/Math.max(1,box.w);
    p.turnAt=0.12+fx*spread;
    p.act={k:"cheer",at:p.turnAt+0.32,dur:celebrate==="big"?0.7:0.55,conf:celebrate==="mini"?0:(celebrate==="big"?4:2),
      h:celebrate==="mini"?2.5:(celebrate==="big"?5.5:4)};});
}
function ripple(kind){const act=people.filter(p=>p.state==="placed");
  if(kind==="stadium"){act.forEach(p=>{const fx=(p.x-box.x)/Math.max(1,box.w);if(!p.act)p.act={k:"cheer",at:fx*1.1,dur:0.32,conf:0,h:1.4};});return;}
  act.forEach(p=>{const fx=(p.x-box.x)/Math.max(1,box.w);if(!p.act)p.act={k:kind,at:fx*0.8,dur:kind==="wave"?0.9:0.5,conf:0,h:kind==="hop"?2:0};});}
// after assembly the mob has a life of its own: little looks, shuffles and waves
function fidget(){const act=people.filter(p=>p.state==="placed"&&!p.act&&!p.dance);if(!act.length)return;
  const p=R(act),r=Math.random();
  if(r<.4){p.lookDir=Math.random()<.5?-1:1;p.lookT=rnd(0.5,1.2);}
  else if(r<.62){p.face="S";p.dir=Math.random()<.5?-1:1;p.faceT=rnd(0.5,1.1);}
  else if(r<.84)p.act={k:"wave",at:0,dur:rnd(0.6,1.1),conf:0,h:0};
  else hop(p,S*rnd(0.8,1.6));}
function dance(p){if(p.state==="placed"){p.dance=1.9;p.danceT=0.4;p.act=null;hop(p,S*3);}
  else{hop(p,S*2.6);p.emote={k:"!",t:0,life:.7};p.face="F";if(p.state==="idle")p.wait=Math.max(p.wait,1.2);}
  sfx("pop");}
function hitPerson(cx,cy){const X=cx*DPR,Y=cy*DPR,pad=S*3;let best=null;
  for(const p of people){if(p.leaving)continue;const x=p.x+p.ox,y=p.y+p.oy-p.z;
    if(X>x-SW*S/2-pad&&X<x+SW*S/2+pad&&Y>y-SHB*S-pad&&Y<y+pad&&(!best||p.y>best.y))best=p;}
  return best;}
// reactions from the person who received the mob
function react(kind){
  const act=people.filter(p=>!p.leaving&&p.state==="placed");if(!act.length)return;
  const fx=p=>(p.x-box.x)/Math.max(1,box.w);
  act.forEach(p=>{p.dance=0;p.act=null;
    if(kind==="love"){if(Math.random()<.55)setTimeout(()=>{p.emote={k:"heart",t:0,life:1.2};hop(p,S*1.4);},fx(p)*500+rnd(0,350));}
    else if(kind==="haha"){p.dance=rnd(0.9,1.3);p.danceT=rnd(0,0.3);}
    else if(kind==="wow"){p.act={k:"cheer",at:rnd(0,0.12),dur:0.5,conf:0,h:5};if(Math.random()<.4)p.emote={k:"!",t:0,life:.9};}
    else{p.act={k:"cheer",at:fx(p)*0.9,dur:0.45,conf:2,h:3.2};}
  });
  if(mode!=="hold"){mode="hold";modeT=0;}
  sfx(kind);
}

// ---------- surprise flow ----------
function showTeaser(){$("teaser").classList.add("on");}
function reveal(){
  if(APP!=="surprise"||(sPhase!=="intro"&&sPhase!=="teaser")||waiting())return;
  sPhase="reveal";$("teaser").classList.add("out");
  if(MSG&&MSG.scenes.length>1)seq={list:MSG.scenes.slice(),ix:0};
  computeLayout();
  form({assemble:true,celebrate:seqLast()?"big":"mini"});
  track("revealed");
  setTimeout(()=>{$("sr").textContent=`The mob spells: ${MSG?MSG.scenes.map(toDisplay).join(", then "):toDisplay(text)}`;},1400);
}
function showEnd(){endShown=true;$("endbar").classList.add("on");if(APP==="error")lost.classList.add("on");}
function replay(){if(seq){seq.ix=0;nextText=seq.list[0];}replaySay=undefined;scatter(false);replayIn=1.8;track("replay");}
// multi-scene: assemble, hold, scatter, regroup into the next scene with a new shout
function playSeq(list){seq={list:list.slice(),ix:0};nextText=list[0];replaySay=undefined;
  if(mode==="wander"&&!people.some(p=>p.slot)){replayIn=0.01;}else{scatter(false);replayIn=RM?0.8:1.3;}}
const seqLast=()=>!seq||seq.ix>=seq.list.length-1;
function nextScene(){seq.ix++;nextText=seq.list[seq.ix];const last=seqLast();
  replaySay=last&&seq.list.length>2?"FINALE!":(seq.ix===1?"NEXT!":"AND...");
  scatter(false);replayIn=RM?0.8:1.25;}

// ---------- simulation ----------
function update(dt){
  modeT+=dt;appT+=dt;
  const auto=AUTO_APP&&!panelOpen;
  if(mode==="wander"&&auto&&modeT>(firstRun?3.4:4.0)){
    if(APP==="home"&&!firstRun&&!params.get("text")){wordIx=(wordIx+1)%LANDING_WORDS.length;text=LANDING_WORDS[wordIx];computeLayout();syncCount();}
    firstRun=false;form({assemble:true,celebrate:"full"});}
  if(replayIn>0){replayIn-=dt;if(replayIn<=0){replayIn=-1;
    if(nextText!==null){text=nextText;nextText=null;computeLayout();syncCount();}
    form({assemble:true,say:APP==="error"?"UMM...":replaySay,celebrate:seq?(seqLast()?"big":"mini"):(AUTO_APP?"full":"big")});replaySay=undefined;}}
  if(REC&&sPhase==="intro"&&appT>0.45){reveal();}
  if(APP==="surprise"&&sPhase==="intro"&&appT>2.2){sPhase="teaser";teaserT=0;showTeaser();}
  if(APP==="surprise"&&sPhase==="teaser"&&!waiting()){teaserT+=dt;if(teaserT>(RM?4:7.5))reveal();}
  if(APP==="error"&&sPhase==="intro"&&appT>1.1){sPhase="reveal";form({assemble:true,say:"UMM...",celebrate:"mini"});}
  if(mode==="form"){
    const act=people.filter(p=>!p.leaving);
    if(modeT>9)act.forEach(p=>{if(p.state!=="placed"){p.hurry=true;if(p.state==="pre"||p.state==="alert"||p.state==="freeze")p.state="walk";}});
    if(act.every(p=>p.state==="placed")||modeT>13)onFormed();
  }else if(mode==="hold"){
    if(APP==="lost"&&!panelOpen&&modeT>0.9)lost.classList.add("on");
    if(auto&&modeT>(APP==="home"?4.6:5.2))scatter(false);
    if(seq&&!seqLast()&&replayIn<0&&modeT>(RM?2.8:2.4))nextScene();
    if((APP==="surprise"||APP==="error")&&!endShown&&seqLast()&&replayIn<0&&modeT>(APP==="error"?0.8:2.2))showEnd();
    if(!auto&&modeT>nextRipple){nextRipple=modeT+rnd(6,8);ripple(Math.random()<.5?"wave":"hop");}
    if(!RM&&modeT>2){fidgetT-=dt;if(fidgetT<=0){fidgetT=rnd(0.12,0.4)*clamp(120/Math.max(20,slots.length),0.3,2);fidget();}
      if(!auto&&modeT>waveAt){waveAt=modeT+(THEME==="stadium"?rnd(5,7):rnd(12,16));ripple("stadium");}}
  }
  const diagv=diag();
  const wanderSp=Math.max(S*18,diagv*(firstRun&&mode==="wander"&&modeT<3?0.1:0.055))*(OG?0:1);
  const formSp=Math.max(S*60,diagv*0.24)*(RM?1.4:1);
  if(bubble){bubble.t+=dt;if(bubble.t>bubble.life+0.14){bubble=null;leader=null;}}
  const pr=S*26,ptrLive=(now-ptr.t)<1.5;
  // separation via a spatial grid (people never stack up)
  const rx=S*9,ry=S*5,cell=rx,grid=new Map();
  for(const a of people){a.sx=0;a.sy=0;
    const k=((a.x/cell|0)+512)*4096+((a.y/cell|0)+512);let b=grid.get(k);if(!b)grid.set(k,b=[]);b.push(a);}
  for(const a of people){if(a.state==="placed")continue;const gx=(a.x/cell|0)+512,gy=(a.y/cell|0)+512;
    for(let ix=-1;ix<=1;ix++)for(let iy=-1;iy<=1;iy++){const b=grid.get((gx+ix)*4096+gy+iy);if(!b)continue;
      for(const o of b){if(o===a)continue;const dx=(a.x-o.x)/rx,dy=(a.y-o.y)/ry,e=dx*dx+dy*dy;
        if(e<1&&e>1e-6){const l=Math.sqrt(e),f=1-l;a.sx+=dx/l*f;a.sy+=dy/l*0.6*f;}}}}
  for(const p of people){
    p.blinkT-=dt;if(p.blinkT<0){p.blink=0.13;p.blinkT=rnd(1.8,5.5);if(Math.random()<.15)p.blinkT=0.25;}
    if(p.blink>0)p.blink-=dt;
    p.lookT-=dt;if(p.lookT<0){p.lookDir=Math.random()<.55?0:(Math.random()<.5?-1:1);p.lookT=rnd(0.8,3);}
    if(p.emote){p.emote.t+=dt;if(p.emote.t>p.emote.life)p.emote=null;}
    if(p.dance>0){p.dance-=dt;p.danceT-=dt;if(p.danceT<=0&&p.z===0){p.danceT=rnd(0.3,0.4);hop(p,S*rnd(1.6,3.2));if(Math.random()<.5)p.dir=-p.dir;}}
    if(p.faceT>0){p.faceT-=dt;if(p.faceT<=0&&p.state==="placed")p.face="F";}
    if(mode==="hold"){
      if(p.turnAt>0){p.turnAt-=dt;if(p.turnAt<=0){p.turnAt=0;p.face="F";p.lookDir=0;hop(p,S*1.2);}}
      if(p.act){const a=p.act;
        if(!a.on){a.at-=dt;if(a.at<=0){a.on=true;if(a.h)hop(p,S*a.h*rnd(0.85,1.15));if(a.conf)confetti(p.x,p.y-SHB*S,a.conf);
          if(a.k==="cheer"&&Math.random()<(celebrate==="big"?.5:.4))a.next={k:"wave",dur:rnd(0.9,1.6)};}}
        else{a.dur-=dt;if(a.dur<=0){const nx=a.next;p.act=nx?{k:"wave",on:true,dur:nx.dur,at:0}:null;
          if(!nx&&a.k==="cheer"&&Math.random()<(celebrate==="big"?.2:.12))p.emote={k:"heart",t:0,life:1.1};}}}
    }
    if(p.vz!==0||p.z>0){p.vz-=GRAV()*dt;p.z+=p.vz*dt;if(p.z<=0){if(p.vz<-S*30&&p.state==="placed")dust(p.x,p.y);p.z=0;p.vz=0;}}
    let px=0,py=0,pf=0;
    if(ptrLive){const dx=p.x-ptr.x,dy=(p.y-SHB*S*0.5)-ptr.y,d=Math.hypot(dx,dy);
      if(d<pr&&d>0.01){pf=1-d/pr;px=dx/d;py=dy/d;}}
    const st=p.state;
    if(st==="freeze"){
      p.goIn-=dt;const k=Math.exp(-dt*12);p.vx*=k;p.vy*=k;p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.turnIn>0){p.turnIn-=dt;if(p.turnIn<=0&&leader&&p!==leader){const dx=leader.x-p.x,dy=leader.y-p.y;
        if(Math.abs(dx)>Math.abs(dy)*0.8){p.face="S";p.dir=dx>0?1:-1;}else p.face=dy<0?"B":"F";p.lookDir=0;p.lookT=9;}}
      if(p===leader){p.face="F";p.lookDir=0;p.blink=0;}
      if(p.goIn<=0){p.state="walk";p.lookT=rnd(0.5,2);if(!RM){dust(p.x,p.y);if(Math.random()<.6)dust(p.x,p.y);hop(p,S*rnd(0.8,1.6));}}
      continue;}
    if(st==="pre"){
      p.alertIn-=dt;p.goIn-=dt;
      if(p.alertIn<=0&&p.quiet){p.state="walk";}
      else if(p.alertIn<=0){p.state="alert";p.vx*=0.2;p.vy*=0.2;p.emote={k:"!",t:0,life:0.85};hop(p,S*2.5);
        const dx=p.tx-p.x;p.face=Math.abs(dx)>S*4?"S":"F";p.dir=dx>=0?1:-1;}
      else moveToward(p,dt,wanderSp*0.8,false,true);
      continue;}
    if(st==="alert"){p.goIn-=dt;p.vx*=Math.exp(-dt*10);p.vy*=Math.exp(-dt*10);p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.goIn<=0)p.state="walk";continue;}
    if(st==="placed"){
      if(pf>0){p.ovx+=px*pf*S*1800*dt;p.ovy+=py*pf*S*1200*dt;p.lookDir=ptr.x<p.x?-1:1;p.lookT=0.6;
        if(pf>0.6&&Math.hypot(ptr.vx,ptr.vy)>W*0.6&&p.z===0)hop(p,S*2);}
      p.ovx+=(-p.ox*170-p.ovx*14)*dt;p.ovy+=(-p.oy*170-p.ovy*14)*dt;
      p.ox=clamp(p.ox+p.ovx*dt,-S*1.2,S*1.2);p.oy=clamp(p.oy+p.ovy*dt,-S,S);
      continue;}
    if(st==="burst"){p.wait-=dt;const k=Math.exp(-dt*3.2);p.vx*=k;p.vy*=k;p.x+=p.vx*dt;p.y+=p.vy*dt;p.dist+=Math.hypot(p.vx,p.vy)*dt;
      if(Math.abs(p.vx)>Math.abs(p.vy)*0.6){p.face="S";p.dir=p.vx>0?1:-1;}else p.face=p.vy<0?"B":"F";
      p.x=clamp(p.x,-SW*S,W+SW*S);p.y=clamp(p.y,SH*S,H-S*2);
      if(p.wait<=0)pickWander(p);continue;}
    if(st==="idle"){p.wait-=dt;
      if(pf>0.15&&!OG){p.state="walk";p.tx=clamp(p.x+px*S*40,SW*S,W-SW*S);p.ty=clamp(p.y+py*S*30,SH*S*1.5,H-S*6);p.path=null;
        if(Math.random()<.3)p.emote={k:"!",t:0,life:.6};hop(p,S*2);}
      p.x+=p.sx*S*20*dt;p.y+=p.sy*S*20*dt;
      if(p.wait<=0&&mode==="wander"&&!OG)pickWander(p);
      continue;}
    const sp=(p.slot||p.leaving)?formSp*(p.leaving?1.2:1)*(p.run?1.3:1):wanderSp;
    if(pf>0&&!p.slot){p.vx+=px*pf*S*500*dt;p.vy+=py*pf*S*400*dt;}
    moveToward(p,dt,sp,!!p.slot,false);
  }
  people=people.filter(p=>!(p.leaving&&(p.x<-SW*S*3||p.x>W+SW*S*3||p.y<-SH*S*2||p.y>H+SH*S*2)));
  separate();
  ambient(dt);
  if(SND.on){let mv=0;for(const p of people)if(p.state==="walk"&&Math.hypot(p.vx,p.vy)>S*20)mv++;if(mv)steps(mv,dt);}
  for(const q of parts){q.t+=dt;if(q.k==="conf"){q.vy+=S*160*dt;q.vx*=Math.exp(-dt*1.5);q.vy*=Math.exp(-dt*1.2);}
    else{q.vy*=Math.exp(-dt*4);q.vx*=Math.exp(-dt*4);}q.x+=q.vx*dt;q.y+=q.vy*dt;}
  if(parts.length)parts=parts.filter(q=>q.t<q.life);
}
// NO-COLLISION: after every simulation step, push apart any two people whose footprints intersect.
// People already standing in the message never move; two walkers share the push.
// who gives way: people standing in the message never move; someone stepping into their spot is nearly immovable
const finalStep=p=>p.slot&&p.state==="walk"&&!(p.path&&p.path.length)&&Math.abs(p.x-p.tx)<S*3&&Math.abs(p.y-p.ty)<CH*0.62;
const pushW=p=>p.state==="placed"?0:finalStep(p)?0.08:1;
function separate(){
  const fx=FX*S,fy=FY*S,cell=fx,grid=new Map(),key=(x,y)=>((x/cell|0)+512)*4096+((y/cell|0)+512);
  const pass=(fix,it)=>{let n=0;grid.clear();
    for(const a of people){const k=key(a.x,a.y);let b=grid.get(k);if(!b)grid.set(k,b=[]);b.push(a);}
    for(const a of people){const gx=(a.x/cell|0)+512,gy=(a.y/cell|0)+512;
      for(let ix=-1;ix<=1;ix++)for(let iy=-1;iy<=1;iy++){const b=grid.get((gx+ix)*4096+gy+iy);if(!b)continue;
        for(const o of b){if(o.id<=a.id)continue;const dx=a.x-o.x,dy=a.y-o.y,ax=Math.abs(dx),ay=Math.abs(dy);
          if(ax>=fx-0.01||ay>=fy-0.01)continue;
          if(!fix){if(ax<fx-S*0.25&&ay<fy-S*0.25)n++;continue;}
          const wa=pushW(a),wb=pushW(o);if(!wa&&!wb)continue;n++;const am=wa>0,om=wb>0;
          let mx=0,my=0;const px=fx-ax+0.02,py=fy-ay+0.02;
          // two walkers sidestep (push across their relative motion, so they pass instead of shoving head-on);
          // a walker against someone standing takes the least-penetration way out.
          // If a tight knot doesn't settle in 8 rounds, try the other axis for some pairs.
          let horiz=px<py*1.15;
          if(am&&om){const rx=a.vx-o.vx,ry=a.vy-o.vy;if(rx*rx+ry*ry>S*S*400)horiz=Math.abs(ry)>Math.abs(rx);}
          if(horiz!==(it>=8&&((a.id+o.id+it)&1)===1))mx=(dx>0||(dx===0&&a.id&1)?1:-1)*px;else my=(dy>0||(dy===0&&a.id&1)?1:-1)*py;
          const ka=wa/(wa+wb);a.x+=mx*ka;a.y+=my*ka;o.x-=mx*(1-ka);o.y-=my*(1-ka);}}}
    return n;};
  // keep relaxing until nobody overlaps (dense crowds need a few rounds; it converges fast)
  for(let i=0;i<40&&pass(true,i);i++);
  // On a drastic scale change (e.g. 200 tiny letters -> a few huge drawings), a dense knot can be
  // infeasible to relax locally. Pack remaining walkers into the nearest free footprint, outside-in.
  // This is a safety projection, not a hidden counter reset: the counter below measures actual positions.
  if(pass(false)){
    const fixed=people.filter(p=>p.state==="placed"),walkers=people.filter(p=>p.state!=="placed");
    const free=(x,y)=>!fixed.some(q=>Math.abs(x-q.x)<fx&&Math.abs(y-q.y)<fy);
    for(const p of walkers){if(!free(p.x,p.y)){const x=p.x,y=p.y;let found=false;
      for(let ring=1;!found;ring++)for(let k=0;k<ring*8;k++){const a=k/(ring*8)*Math.PI*2,nx=x+Math.cos(a)*ring*fx/2,ny=y+Math.sin(a)*ring*fy/2;
        if(free(nx,ny)){p.x=nx;p.y=ny;found=true;break;}}}fixed.push(p);}
  }
  overlaps=pass(false);if(overlaps>maxOverlaps)maxOverlaps=overlaps;overlapTotal+=overlaps;
}
function moveToward(p,dt,maxSp,toSlot,pre){
  // while "pre", people keep wandering toward their old wander target
  let gx=p.tx,gy=p.ty;
  if(pre){gx=p.x+p.vx;gy=p.y+p.vy;}
  let tightW=null;
  while(p.path&&p.path.length&&!pre){const w=p.path[0];const dd=Math.hypot(w.x-p.x,w.y-p.y);
    if(dd<S*(w.tight?1.6:7)){p.path.shift();continue;}gx=w.x;gy=w.y;if(w.tight)tightW=dd;break;}
  let routed=!!(p.path&&p.path.length);
  // shoved off the lane? never cut through a row to get back: re-plan from here
  if(toSlot&&!pre&&p.slot&&box&&now>(p.replanAt||0)&&crossesRow(p,routed?p.path[0]:{x:p.tx,y:p.ty})){
    p.replanAt=now+0.35;p.path=routeTo(p,p.slot);routed=p.path.length>0;
    if(routed){gx=p.path[0].x;gy=p.path[0].y;}}
  const dx=gx-p.x,dy=gy-p.y,d=Math.hypot(dx,dy);
  const dT=Math.hypot(p.tx-p.x,p.ty-p.y);
  let sp=maxSp*(toSlot?p.formF:p.speedF);
  if(!routed&&!pre)sp*=clamp(dT/(S*(toSlot?16:10)),toSlot?0.12:0.25,1);
  if(tightW!==null)sp*=clamp(tightW/(S*14),0.3,1);
  else if(routed&&toSlot)sp*=1.2; // the long way round is run a little faster
  let dvx=d>0?dx/d*sp:0,dvy=d>0?dy/d*sp:0;
  const sepW=p.hurry?0:(toSlot?clamp((dT-S*10)/(S*30),0,1):1);
  if(p.hurry){dvx*=1.6;dvy*=1.6;}
  dvx+=p.sx*S*55*sepW;dvy+=p.sy*S*55*sepW;
  const acc=1-Math.exp(-dt*((toSlot&&dT<S*20)||tightW!==null?14:6));
  p.vx+=(dvx-p.vx)*acc;p.vy+=(dvy-p.vy)*acc;
  if(p.look.zombie)p.vy+=Math.sin(now*6+p.phase)*S*60*dt;
  p.x+=p.vx*dt;p.y+=p.vy*dt;const v=Math.hypot(p.vx,p.vy);p.dist+=v*dt;
  if(v>S*2){if(Math.abs(p.vx)>Math.abs(p.vy)*0.55){p.face="S";p.dir=p.vx>0?1:-1;}else p.face=p.vy<0?"B":"F";}
  if(pre)return;
  if(toSlot&&dT<S*0.9&&!routed){
    p.x=p.tx;p.y=p.ty;p.vx=p.vy=0;p.hurry=false;p.run=false;p.state="placed";if(p.face==="B"&&Math.random()<.5)p.face="S";
    p.sheet=sheetFor(p,p.slot.tint);
    if(celebrate==="none")p.face="F";
    p.ox=p.oy=0;p.ovx=0;p.ovy=S*20;hop(p,S*2.2);p.lookDir=0;
  }else if(!toSlot&&!p.leaving&&dT<S*2&&p.state==="walk"){
    p.state="idle";p.wait=rnd(0.5,2.6);p.vx=p.vy=0;if(Math.random()<.45)p.face="F";
  }
}
// ---------- render ----------
function render(){
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=BG;ctx.fillRect(0,0,W,H);ctx.imageSmoothingEnabled=false;
  drawBackdrop();
  const dw=SW*S,dh=SH*S;
  const order=people.slice().sort((a,b)=>(a.y+a.oy)-(b.y+b.oy));
  for(const p of order){const sx=Math.round(p.x+p.ox),sy=Math.round(p.y+p.oy);
    const sh=p.z>S*2?SHADOW_S:SHADOW;ctx.drawImage(sh,Math.round(sx-sh.width*S/2),Math.round(sy-S*1.5),sh.width*S,sh.height*S);}
  for(const q of parts)if(q.k==="dust"){const a=1-q.t/q.life;ctx.fillStyle=`rgba(150,135,115,${(0.35*a).toFixed(3)})`;
    const sz=Math.max(1,Math.round(S*(1+a)));ctx.fillRect(Math.round(q.x),Math.round(q.y),sz,sz);}
  for(const p of order){
    const moving=(p.state==="walk"||p.state==="burst"||(p.state==="pre"&&Math.hypot(p.vx,p.vy)>S*3));
    let f=FR.F,bob=0;
    if(moving){
      const ph=Math.floor(p.dist/(S*(p.run?2.1:2.6)))%4;
      if(p.face==="S"){const k=["Sa","Sp","Sb","Sp"][ph];f=p.dir>0?FR[k]:FR["L"+k];}
      else if(p.face==="B")f=ph<2?FR.BwalkA:FR.BwalkB;
      else f=ph<2?FR.FwalkA:FR.FwalkB;
      bob=(ph===1||ph===3)?-S:0;
    }else{
      const a=p.act&&p.act.on?p.act.k:null;
      if(p.dance>0){const k=Math.floor(p.dance*7.5)%4;f=[FR.Fcheer,FR.Fwave1,FR.Fcheer,FR.Fwave2][k];}
      else if(a==="cheer")f=FR.Fcheer;
      else if(a==="wave")f=(Math.floor(now*7+p.phase)%2)?FR.Fwave1:FR.Fwave2;
      else if(p.face==="S")f=p.dir>0?FR.Sp:FR.LSp;
      else if(p.face==="B")f=FR.Bidle;
      else if(p.blink>0)f=FR.Fblink;
      else if(p.lookDir<0)f=FR.FlookL;else if(p.lookDir>0)f=FR.FlookR;
      if(p.state==="placed"&&!a&&!RM&&!(p.dance>0)){const k=Math.sin(now*2.6+p.phase*1.7);bob=k>0.8?-S:0;}
    }
    const x=Math.round(p.x+p.ox-dw/2),y=Math.round(p.y+p.oy-dh+bob-p.z);
    ctx.drawImage(p.sheet,f*SW,0,SW,SH,x,y,dw,dh);
    if(p.emote){const e=p.emote,tt=e.t;
      if(!(tt>e.life-0.15&&Math.floor(tt*20)%2)){
        const pop=tt<0.08?2*S:tt<0.16?-S:0,im=e.k==="heart"?HEART:BUBBLE;
        ctx.drawImage(im,Math.round(p.x+p.ox-S),Math.round(y-im.height*S+pop-S-(e.k==="heart"?Math.round(tt*8)*S:0)),im.width*S,im.height*S);}}
  }
  drawAmbient(true);
  if(bubble&&leader&&bubble.t>=0)drawBubble();
  if(DEBUG)drawDebug();
  for(const q of parts)if(q.k==="conf"){const a=1-q.t/q.life;if(a<0.25&&Math.floor(q.t*18)%2)continue;
    ctx.fillStyle=q.c;const flip=Math.floor(q.t*10+q.x)%2;
    ctx.fillRect(Math.round(q.x),Math.round(q.y),S*(flip?2:1),S*(flip?1:2));}
}
function drawBubble(){
  const b=bubble,t=b.t,end=b.life;let k=bubbleScale(),dy=0;
  if(!RM){ if(t<0.05)k=Math.max(1,k-2);else if(t<0.11)k=k+1;
    if(t>=0.11&&t<0.19)dy=-2;else if(t>=0.19&&t<0.27)dy=-1;else if(t>=0.27&&t<0.33)dy=1;
    if(t>end)k=Math.max(1,k-1);if(t>end+0.07)return;}
  else if(t>end)return;
  const im=bubbleImg(b.say),bw=im.width*k,bh=im.height*k,head=leader.y+leader.oy-leader.z-SHB*S;
  const tx=Math.round(leader.x+leader.ox);
  let x=Math.round(tx-bw/2);x=clamp(x,Math.round(8*DPR),Math.round(W-8*DPR-bw));
  const y=Math.round(head-bh-3*k-S+dy*k);
  ctx.drawImage(im,x,y,bw,bh);
  // tail: points at the leader even when the bubble is nudged off-centre by the screen edge
  const tcx=clamp(tx,x+4*k,x+bw-5*k),ty=y+bh-2*k;
  for(let r=0;r<4;r++){const half=3-r;const x0=tcx-half*k-Math.floor(k/2),wpx=(half*2+1)*k;
    ctx.fillStyle=INK;ctx.fillRect(x0,ty+r*k,wpx,k);if(half>0){ctx.fillStyle="#fffdf8";ctx.fillRect(x0+k,ty+r*k,wpx-2*k,k);}}
}
// ---------- theme ambience: snow, confetti, petals, fireflies, camera flashes ----------
let amb=[];
function waiting(){return !!(MSG&&MSG.at&&Date.now()<MSG.at&&!REC);}
function newAmb(k,anywhere){const q={k,t:0,x:Math.random()*W,y:anywhere?Math.random()*H:-S*3,ph:Math.random()*7,v:rnd(0.6,1.4)};
  if(k==="confetti")q.c=R(THEME_CONF[THEME]||CONF);else if(k==="petals")q.c=R(["#f6c5cf","#ff8fa3","#ffffff"]);
  if(k==="fireflies"){q.y=Math.random()*H;}if(k==="flashes"){q.y=Math.random()*H*0.5;q.t=-rnd(0,3);}
  return q;}
function ambient(dt){const T=THEME_DEF[THEME],k=T&&T.ambient;
  if(!k||RM||OG){if(amb.length)amb=[];return;}
  if(amb.length&&amb[0].k!==k)amb=[];
  const n=Math.round(clamp(W*H/(S*S*1500),18,80)*(k==="flashes"?0.3:k==="fireflies"?0.45:1));
  while(amb.length<n)amb.push(newAmb(k,true));if(amb.length>n)amb.length=n;
  for(let i=0;i<amb.length;i++){const q=amb[i];q.t+=dt;
    if(k==="fireflies"){q.x+=Math.sin(q.t*0.7+q.ph)*S*6*dt;q.y+=Math.cos(q.t*0.5+q.ph*2)*S*5*dt;}
    else if(k==="flashes"){if(q.t>0.22)amb[i]=newAmb(k,true);}
    else{const fall=k==="snow"?12:k==="petals"?9:16;q.y+=S*fall*q.v*dt;q.x+=(Math.sin(q.t*1.3+q.ph)*S*7+(k==="petals"?S*6:0))*dt;
      if(q.y>H+S*3||q.x>W+S*4)amb[i]=newAmb(k,false);}}
}
function drawBackdrop(){
  if(THEME==="stadium"&&BGC<0){ctx.fillStyle="rgba(255,255,255,0.045)";const b=Math.max(8,Math.round(S*26));for(let y=0;y<H;y+=b*2)ctx.fillRect(0,y,W,b);}
  drawAmbient(false);}
function drawAmbient(front){if(!amb.length)return;const k=amb[0].k,fr=k==="snow"||k==="confetti"||k==="petals";if(fr!==front)return;
  for(const q of amb){
    if(k==="snow"){ctx.fillStyle=q.v>1.1?"#ffffff":"rgba(255,255,255,0.7)";const z=q.v>1.1?S*2:S;ctx.fillRect(Math.round(q.x),Math.round(q.y),z,z);}
    else if(k==="confetti"||k==="petals"){ctx.fillStyle=q.c;const f=Math.floor(q.t*4+q.ph)%2;ctx.fillRect(Math.round(q.x),Math.round(q.y),S*(f?2:1),S*(f?1:2));}
    else if(k==="fireflies"){const a=0.5+0.5*Math.sin(q.t*3+q.ph*3);if(a<0.25)continue;ctx.fillStyle=`rgba(232,255,138,${a.toFixed(2)})`;ctx.fillRect(Math.round(q.x),Math.round(q.y),S,S);}
    else if(k==="flashes"&&q.t>0){ctx.fillStyle="rgba(255,255,255,0.85)";const x=Math.round(q.x),y=Math.round(q.y);ctx.fillRect(x-S,y,S*3,S);ctx.fillRect(x,y-S,S,S*3);}
  }}
function drawDebug(){
  ctx.strokeStyle="rgba(231,76,60,0.6)";ctx.lineWidth=1;
  for(const p of people)ctx.strokeRect(Math.round(p.x-FX*S/2)+0.5,Math.round(p.y-FY*S/2)+0.5,FX*S,FY*S);
  const r=rasterLines([`OVERLAPS ${overlaps} MAX ${maxOverlaps}`]),k=Math.max(1,Math.round(2*DPR));
  ctx.fillStyle="rgba(255,253,248,0.9)";ctx.fillRect(6*DPR,6*DPR,(r.cols+4)*k,(r.rows+4)*k);
  ctx.fillStyle=overlaps?"#e74c3c":"#1e8449";r.cells.forEach(([x,y])=>ctx.fillRect(6*DPR+(x+2)*k,6*DPR+(y+2)*k,k,k));}
// ---------- loop ----------
let last=performance.now(),cost=0;
function frame(t){
  if(CAPTURE)return;
  const t0=performance.now();
  let dt=(t-last)/1000;last=t;
  // adaptive quality: if the device can't keep up, drop canvas resolution a notch
  if(dt>0&&dt<0.25){frameEMA=frameEMA*0.95+dt*1000*0.05;
    if(frameEMA>24&&DPR>1.5){if(++slowFrames>90){slowFrames=0;dprCap=Math.max(1.5,DPR-0.75);frameEMA=16.7;resize();}}else slowFrames=0;}
  if(dt>0.1)dt=0.1;
  const steps=Math.max(1,Math.ceil(dt/0.0167)),h=dt/steps;
  for(let i=0;i<steps;i++){now+=h;update(h);}
  render();cost=cost*0.95+(performance.now()-t0)*0.05;
  requestAnimationFrame(frame);
}
