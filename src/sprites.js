// ---------- sprites ----------
const SW=12,SH=16;            // frame size incl. 1px outline (10x14 art)
const R=a=>a[Math.random()*a.length|0], rnd=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>v<a?a:v>b?b:v;
const SKINS=["#f7d7bd","#f0c39d","#e2a878","#c58a5c","#a1683f","#7a4b2c","#5b3720"];
const ZSKIN=["#8cc152","#7fb85c","#9ccc65","#a3c46b"];
const HAIRS=["#2a1c14","#4b2e1b","#6d4426","#9a5b2e","#d7a43e","#ecc76b","#b8382c","#e07a35","#efefe8","#77736e","#6b46c1","#2f6fd6","#1f1f1f","#d6458d"];
const SHIRTS=["#e74c3c","#3a7bd5","#2ecc71","#f1c40f","#9b59b6","#e67e22","#1abc9c","#ff6b9d","#34495e","#f4f4f4","#d35400","#16a085","#5d6dbe","#c0392b","#f39c12","#7f8c8d","#4ca3dd","#8e44ad"];
const PANTS=["#2c3e70","#3b4a5a","#24324a","#5b4636","#2d2d2d","#6b7a8f","#7a5230","#1f4e5f","#554466"];
const SHOES=["#2a2320","#4a3020","#f4f4f4","#8b2d1e","#222831"];
const HATS=["#e74c3c","#2f6fd6","#2ecc71","#f1c40f","#2a2a2a","#ff8c42","#8e44ad"];
const OUT="#2d2420";
function shade(hex,f){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;
  r=clamp(Math.round(r*f),0,255);g=clamp(Math.round(g*f),0,255);b=clamp(Math.round(b*f),0,255);
  return "#"+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);}
function newLook(){
  const zombie=Math.random()<0.12;
  const L={skin:zombie?R(ZSKIN):R(SKINS),hair:R(HAIRS),shirt:R(SHIRTS),pants:R(PANTS),shoes:R(SHOES),
    hat:R(HATS),eye:"#1b1714",zombie,
    style:R(["short","short","short","long","long","buzz","cap","cap","mohawk","bun","bald","beanie","afro","pony"]),
    skirt:Math.random()<0.15,beard:Math.random()<0.1,stripe:Math.random()<0.2,blush:Math.random()<0.25};
  if(zombie){ if(Math.random()<.6)L.shirt=R(["#5f8f3a","#6aa84f","#4e7d36",L.shirt]); L.hair=R(["#3d5a26","#2a1c14","#6b46c1",L.hair]); L.blush=false;}
  return L;
}
// kinds: F,Fblink,FlookL,FlookR,Fwave1,Fwave2,Fcheer,FwalkA,FwalkB,Bidle,BwalkA,BwalkB,Sa,Sp,Sb
function frameGrid(L,kind){
  const g=Array.from({length:14},()=>Array(10).fill(null));
  const put=(r,c,v)=>{c+=1;if(r>=0&&r<14&&c>=0&&c<10)g[r][c]=v;};
  const del=(r,c)=>{c+=1;if(r>=0&&r<14&&c>=0&&c<10)g[r][c]=null;};
  const M={S:L.skin,s:shade(L.skin,.85),H:L.hair,h:shade(L.hair,.8),E:L.eye,T:L.shirt,t:shade(L.shirt,.82),P:L.pants,
    B:L.shoes,C:L.hat,c:shade(L.hat,.75),K:L.pants,W:"#ffffff",Q:"#f09a9a"};
  const row=(r,str)=>{[...str].forEach((ch,c)=>{if(ch!==".")put(r,c,M[ch]);});};
  const side=kind[0]==="S", back=kind[0]==="B", front=kind[0]==="F";
  const st=L.style;
  // ---- head
  row(1,"..SSSS..");row(2,".SSSSSS.");row(3,".SSSSSS.");row(4,".SSSSSS.");row(5,"..ssss..");
  if(side){put(4,7,M.S);}
  if(front){
    let e1=2,e2=5;
    if(kind==="FlookL"){e1=1;e2=4;} if(kind==="FlookR"){e1=3;e2=6;}
    if(kind==="Fblink"){put(3,e1,M.s);put(3,e2,M.s);} else {put(3,e1,M.E);put(3,e2,M.E);}
    if(L.blush&&kind!=="FlookL"&&kind!=="FlookR"){put(4,1,M.Q);put(4,6,M.Q);}
    if(kind==="Fcheer"){put(4,3,M.E);put(4,4,M.E);} // open mouth
  }
  if(side){put(3,6,M.E);}
  const hairTop=()=>{row(0,"..HHHH..");row(1,".HHHHHH.");};
  if(front){
    if(st==="short"){hairTop();put(2,1,M.H);put(2,6,M.H);put(1,5,M.h);}
    if(st==="long"){hairTop();for(let r=2;r<=6;r++){put(r,1,M.H);put(r,6,M.H);}put(2,2,M.H);put(6,1,M.h);put(6,6,M.h);}
    if(st==="pony"){hairTop();put(2,1,M.H);put(2,6,M.H);put(1,7,M.H);put(2,7,M.H);put(3,7,M.h);}
    if(st==="buzz"){row(1,".hhhhhh.");}
    if(st==="cap"){row(0,"..CCCC..");row(1,".CCCCCC.");row(2,"cccccccc");}
    if(st==="beanie"){row(0,"..CCCC..");row(1,".CCCCCC.");row(2,".cccccc.");put(-1,3,M.W);}
    if(st==="mohawk"){row(0,"...HH...");put(1,3,M.H);put(1,4,M.H);}
    if(st==="bun"){row(0,"...HH...");row(1,".HHHHHH.");put(2,1,M.H);put(2,6,M.H);}
    if(st==="afro"){row(0,".HHHHHH.");row(1,"HHHHHHHH");put(2,0,M.H);put(2,7,M.H);put(3,0,M.h);put(3,7,M.h);put(2,1,M.H);put(2,6,M.H);}
    if(L.beard){row(5,"..HHHH..");put(4,1,M.H);put(4,6,M.H);}
  }else if(side){
    if(st==="short"){hairTop();put(2,1,M.H);put(2,2,M.H);put(3,1,M.H);}
    if(st==="long"){hairTop();for(let r=2;r<=6;r++){put(r,1,M.H);put(r,2,M.H);}put(6,1,M.h);}
    if(st==="pony"){hairTop();put(2,1,M.H);put(2,2,M.H);put(2,0,M.H);put(3,0,M.H);put(4,0,M.h);}
    if(st==="buzz"){row(1,".hhhhhh.");put(2,1,M.h);}
    if(st==="cap"){row(0,"..CCCC..");row(1,".CCCCCC.");row(2,".HCCCCcc");put(2,8,M.c);}
    if(st==="beanie"){row(0,"..CCCC..");row(1,".CCCCCC.");row(2,".cccccc.");put(-1,2,M.W);}
    if(st==="mohawk"){row(0,"..HHH...");put(1,2,M.H);put(1,3,M.H);}
    if(st==="bun"){row(0,".HH.....");row(1,".HHHHHH.");put(2,1,M.H);put(2,2,M.H);}
    if(st==="afro"){row(0,".HHHHH..");row(1,"HHHHHHH.");for(let r=2;r<=4;r++){put(r,0,M.H);put(r,1,M.H);}put(2,2,M.H);}
    if(L.beard){row(5,"..HHHH..");put(4,5,M.H);put(4,4,M.H);}
  }else{ // back
    const skinBack=(st==="bald"||st==="buzz"||st==="mohawk");
    if(!skinBack){row(1,".HHHHHH.");row(2,".HHHHHH.");row(3,".HHHHHH.");row(4,".hHHHHh.");row(0,"..HHHH..");}
    if(st==="long"){row(5,".HHHHHH.");row(6,".hHHHHh.");}
    if(st==="pony"){put(5,3,M.H);put(5,4,M.H);put(6,3,M.h);put(6,4,M.h);}
    if(st==="afro"){row(1,"HHHHHHHH");row(2,"HHHHHHHH");row(3,"hHHHHHHh");}
    if(st==="buzz")row(1,".hhhhhh.");
    if(st==="mohawk"){row(0,"...HH...");for(let r=1;r<=3;r++){put(r,3,M.H);put(r,4,M.H);}}
    if(st==="cap"||st==="beanie"){row(0,"..CCCC..");row(1,".CCCCCC.");row(2,".cccccc.");}
    if(st==="bun"){put(-1,3,M.H);put(-1,4,M.H);row(0,"..HHHH..");}
  }
  // ---- body
  if(!side){
    row(6,".TTTTTT.");row(7,"TTTTTTTT");row(8,"TTTTTTTT");row(9,"STTTTTTS");
    if(L.stripe)row(8,"TttttttT");
    put(7,0,M.t);put(8,0,M.t);put(7,7,M.t);put(8,7,M.t);
    if(L.zombie&&front&&kind!=="Fcheer"&&!kind.startsWith("Fwave")){row(7,"STTTTTTS");row(9,".TTTTTT.");}
    if(kind==="Fwave1"||kind==="Fwave2"){del(8,7);del(9,7);put(7,7,M.t);
      if(kind==="Fwave1"){put(6,8,M.T);put(5,8,M.T);put(4,8,M.S);}
      else {put(6,8,M.T);put(5,8,M.T);put(4,9,M.S);put(5,9,M.T);del(5,8);put(6,8,M.T);put(5,9,M.T);}}
    if(kind==="Fcheer"){del(8,0);del(9,0);del(8,7);del(9,7);put(7,0,M.t);put(7,7,M.t);
      put(6,-1,M.T);put(5,-1,M.T);put(4,-1,M.S);put(6,8,M.T);put(5,8,M.T);put(4,8,M.S);}
    if(L.skirt){row(10,".KKKKKK.");row(11,"KKKKKKKK");}
    else {row(10,".PPPPPP.");row(11,".PP..PP.");}
    const lg=L.skirt?"S":"P";
    if(kind==="FwalkA"||kind==="BwalkA"){row(12,".BB.."+lg+lg+".");row(13,".....BB.");}
    else if(kind==="FwalkB"||kind==="BwalkB"){row(12,"."+lg+lg+"..BB.");row(13,".BB.....");}
    else {row(12,"."+lg+lg+".."+lg+lg+".");row(13,".BB..BB.");}
  }else{
    row(6,"..TTTT..");row(7,"..TTTT..");row(8,"..TTTT..");row(9,"..tTTT..");
    if(L.stripe)row(8,"..tttt..");
    if(L.zombie){row(7,"..TTTTSS");}
    else if(kind==="Sa"){put(8,6,M.S);put(7,5,M.t);}
    else if(kind==="Sb"){put(9,1,M.S);put(8,2,M.t);}
    else {put(9,3,M.S);}
    if(L.skirt){row(10,".KKKKK..");row(11,"KKKKKKK.");}
    else row(10,"..PPPP..");
    if(kind==="Sp"){ if(!L.skirt)row(11,"..PPP..."); row(12,L.skirt?"..SS....":"..PPP...");row(13,"..BBBB..");}
    else { if(!L.skirt)row(11,".PP..PP."); row(12,L.skirt?".S...S..":"PP....PP");row(13,"BB....BBB".slice(0,8));}
  }
  return g;
}
const KINDS=["F","Fblink","FlookL","FlookR","Fwave1","Fwave2","Fcheer","FwalkA","FwalkB","Bidle","BwalkA","BwalkB","Sa","Sp","Sb"];
const FR={}; // frame index lookup
KINDS.forEach((k,i)=>FR[k]=i);
["Sa","Sp","Sb"].forEach((k,i)=>FR["L"+k]=KINDS.length+i);
const RGB=new Map();
function rgbOf(c){let v=RGB.get(c);if(!v){const n=parseInt(c.slice(1),16);v=[n>>16,n>>8&255,n&255];RGB.set(c,v);}return v;}
function buildSheet(L){
  const list=KINDS.map(k=>[frameGrid(L,k),false]).concat(["Sa","Sp","Sb"].map(k=>[frameGrid(L,k),true]));
  const n=list.length,TW=SW*n;
  const cv=document.createElement("canvas");cv.width=TW;cv.height=SH;const x=cv.getContext("2d");
  const img=x.createImageData(TW,SH),d=img.data,out=rgbOf(OUT);
  const set=(px,py,c)=>{const o=(py*TW+px)*4;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255;};
  list.forEach(([g,flip],fi)=>{
    const ox=fi*SW,Wd=10;
    const at=(r,c)=>{if(r<0||r>=14||c<0||c>=Wd)return null;return g[r][flip?Wd-1-c:c];};
    for(let r=-1;r<=14;r++)for(let c=-1;c<=Wd;c++){
      const v=at(r,c);
      if(v)set(ox+c+1,r+1,rgbOf(v));
      else if(at(r-1,c)||at(r+1,c)||at(r,c-1)||at(r,c+1))set(ox+c+1,r+1,out);
    }
  });
  x.putImageData(img,0,0);
  return cv;
}
function pixCanvas(rows,map){const h=rows.length,w=rows[0].length;const cv=document.createElement("canvas");cv.width=w;cv.height=h;
  const x=cv.getContext("2d");rows.forEach((r,y)=>[...r].forEach((ch,c)=>{if(map[ch]){x.fillStyle=map[ch];x.fillRect(c,y,1,1);}}));return cv;}
const BUBBLE=pixCanvas([".XXXXX.","XWWRWWX","XWWRWWX","XWWRWWX","XWWWWWX","XWWRWWX",".XXXXX.","..XX...","..X...."],{X:OUT,W:"#fff",R:"#e2483d"});
const HEART=pixCanvas([".XX.XX.","XRRXRRX","XRRRRRX",".XRRRX.","..XRX..","...X..."],{X:OUT,R:"#ff5a7a"});
const SHADOW=pixCanvas(["..XXXXXX..","XXXXXXXXXX","..XXXXXX.."],{X:"rgba(70,52,36,0.16)"});
const SHADOW_S=pixCanvas(["..XXXX..","XXXXXXXX","..XXXX.."],{X:"rgba(70,52,36,0.10)"});
const CONF=["#e74c3c","#f1c40f","#2ecc71","#3a7bd5","#ff6b9d","#9b59b6","#ff8c42"];

