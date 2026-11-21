(() => {
'use strict';
// ---------- 5x7 pixel font ----------
const G = {
A:".XXX.|X...X|X...X|XXXXX|X...X|X...X|X...X",B:"XXXX.|X...X|X...X|XXXX.|X...X|X...X|XXXX.",
C:".XXX.|X...X|X....|X....|X....|X...X|.XXX.",D:"XXXX.|X...X|X...X|X...X|X...X|X...X|XXXX.",
E:"XXXXX|X....|X....|XXXX.|X....|X....|XXXXX",F:"XXXXX|X....|X....|XXXX.|X....|X....|X....",
G:".XXX.|X...X|X....|X.XXX|X...X|X...X|.XXXX",H:"X...X|X...X|X...X|XXXXX|X...X|X...X|X...X",
I:"XXX|.X.|.X.|.X.|.X.|.X.|XXX",J:"..XXX|...X.|...X.|...X.|...X.|X..X.|.XX..",
K:"X...X|X..X.|X.X..|XX...|X.X..|X..X.|X...X",L:"X....|X....|X....|X....|X....|X....|XXXXX",
M:"X...X|XX.XX|X.X.X|X.X.X|X...X|X...X|X...X",N:"X...X|X...X|XX..X|X.X.X|X..XX|X...X|X...X",
O:".XXX.|X...X|X...X|X...X|X...X|X...X|.XXX.",P:"XXXX.|X...X|X...X|XXXX.|X....|X....|X....",
Q:".XXX.|X...X|X...X|X...X|X.X.X|X..X.|.XX.X",R:"XXXX.|X...X|X...X|XXXX.|X.X..|X..X.|X...X",
S:".XXXX|X....|X....|.XXX.|....X|....X|XXXX.",T:"XXXXX|..X..|..X..|..X..|..X..|..X..|..X..",
U:"X...X|X...X|X...X|X...X|X...X|X...X|.XXX.",V:"X...X|X...X|X...X|X...X|X...X|.X.X.|..X..",
W:"X...X|X...X|X...X|X.X.X|X.X.X|X.X.X|.X.X.",X:"X...X|X...X|.X.X.|..X..|.X.X.|X...X|X...X",
Y:"X...X|X...X|.X.X.|..X..|..X..|..X..|..X..",Z:"XXXXX|....X|...X.|..X..|.X...|X....|XXXXX",
0:".XXX.|X...X|X...X|X...X|X...X|X...X|.XXX.",1:".X.|XX.|.X.|.X.|.X.|.X.|XXX",
2:".XXX.|X...X|....X|...X.|..X..|.X...|XXXXX",3:"XXXXX|...X.|..X..|...X.|....X|X...X|.XXX.",
4:"X...X|X...X|X...X|XXXXX|....X|....X|....X",5:"XXXXX|X....|XXXX.|....X|....X|X...X|.XXX.",
6:"..XX.|.X...|X....|XXXX.|X...X|X...X|.XXX.",7:"XXXXX|....X|...X.|..X..|.X...|.X...|.X...",
8:".XXX.|X...X|X...X|.XXX.|X...X|X...X|.XXX.",9:".XXX.|X...X|X...X|.XXXX|....X|...X.|.XX..",
"!":"X|X|X|X|X|.|X","?":".XXX.|X...X|....X|...X.|..X..|.....|..X..",".":".|.|.|.|.|.|X",",":"..|..|..|..|.X|.X|X.",
"-":"...|...|...|XXX|...|...|...","+":".....|..X..|..X..|XXXXX|..X..|..X..|.....",":":".|X|.|.|.|X|.",
"'":"X|X|.|.|.|.|.","#":".X.X.|.X.X.|XXXXX|.X.X.|XXXXX|.X.X.|.X.X.","&":".XX..|X..X.|X.X..|.X...|X.X.X|X..X.|.XX.X",
"@":".XXX.|X...X|X.XXX|X.X.X|X.XXX|X....|.XXXX","/":"....X|...X.|...X.|..X..|.X...|.X...|X....",
"*":"X.X.X|.XXX.|XXXXX|.XXX.|X.X.X|.....|.....","=":".....|.....|XXXX|.....|XXXX|.....|.....".replace(/XXXX/g,"XXXXX"),
"(": ".X|X.|X.|X.|X.|X.|.X",")":"X.|.X|.X|.X|.X|.X|X.","$":"..X..|.XXXX|X.X..|.XXX.|..X.X|XXXX.|..X..",
"%":"XX..X|XX.X.|...X.|..X..|.X...|.X.XX|X..XX","_":".....|.....|.....|.....|.....|.....|XXXXX"
};
G["♥"]=G["*"];G["❤"]=G["*"];
G["♥"]=".....|.X.X.|XXXXX|XXXXX|.XXX.|..X..|.....";
G["\""]="X.X|X.X|...|...|...|...|...";
// the rest of printable ASCII, plus a few everyday extras
Object.assign(G,{";":"..|..|.X|..|.X|.X|X.","<":"...X|..X.|.X..|X...|.X..|..X.|...X",">":"X...|.X..|..X.|...X|..X.|.X..|X...",
"[":"XX|X.|X.|X.|X.|X.|XX","]":"XX|.X|.X|.X|.X|.X|XX","{":"..X|.X.|.X.|X..|.X.|.X.|..X","}":"X..|.X.|.X.|..X|.X.|.X.|X..",
"\\":"X....|.X...|.X...|..X..|...X.|...X.|....X","|":"X|X|X|X|X|X|X","^":"..X..|.X.X.|X...X|.....|.....|.....|.....",
"`":"X.|.X|..|..|..|..|..","~":".....|.....|.X...|X.X.X|...X.|.....|.....","£":"..XX.|.X..X|.X...|XXXX.|.X...|.X...|XXXXX",
"€":"..XXX|.X...|XXXX.|.X...|XXXX.|.X...|..XXX","°":".X.|X.X|.X.|...|...|...|..."});
// ---------- text ----------
const glyph = ch => (G[ch]||G["?"]).split("|");
const GW = ch => ch===" "?3:glyph(ch)[0].length;
// v1 alphabet (6-bit codes; never reorder: existing links depend on it) and the v2 superset (7-bit codes)
const ALPHA=" ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?.,'\"-+:#&@/*=()$%_♥";
const ALPHA2=ALPHA+";<>[]{}\\|^`~£€°";
const MAXLEN=32;
function sanitize(raw){
  let t=String(raw||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"");
  t=t.replace(/[\u2018\u2019\u201A\u2032\u00B4]/g,"'").replace(/[\u201C\u201D\u201E\u2033]/g,'"')
     .replace(/[\u2013\u2014\u2212]/g,"-").replace(/\u2026/g,"...")
     .replace(/(?:\u2764|\u2665|\u2661|\u2763|\uD83D[\uDC93-\uDC9F]|\uD83E\uDDE1|\uD83E\uDD0D|\uD83E\uDD0E|\uD83D\uDDA4)\uFE0F?/g,"\u2665");
  t=t.toUpperCase();
  const out=[],dropped=new Set();
  for(const ch of t){
    if(/\s/.test(ch)){out.push(" ");continue;}
    if(ALPHA2.includes(ch))out.push(ch);
    else if(!/^[\uFE0F\uFE0E\u200D\u20E3]$/.test(ch)&&!/^\uD83C[\uDFFB-\uDFFF]$/.test(ch))dropped.add(ch);
  }
  return {text:out.join("").replace(/ {2,}/g," "),dropped:[...dropped]};
}
function cleanText(t){return sanitize(t).text.trim().slice(0,MAXLEN).trim();}
const lineW=s=>[...s].reduce((w,c,i)=>w+GW(c)+(i?1:0),0);
function rasterLines(lines){
  const cells=[];const widths=lines.map(lineW);const maxW=Math.max(...widths);
  lines.forEach((ln,li)=>{
    let x=Math.floor((maxW-widths[li])/2);const y0=li*9;
    [...ln].forEach((c,i)=>{ if(i)x+=1; if(c===" "){x+=3;return;}
      const g=glyph(c);g.forEach((r,ry)=>{[...r].forEach((v,rx)=>{if(v==="X")cells.push([x+rx,y0+ry]);});});x+=g[0].length;});
  });
  return {cells,cols:maxW,rows:lines.length*9-2};
}
// candidate line breaks: 1..3 balanced lines by words; long single words may be split
function lineOptions(t,maxLines){maxLines=maxLines||3;
  const opts=[[t]];const words=t.split(" ");
  const best=(n)=>{let bestL=null,bw=1e9;
    const rec=(start,k,acc)=>{
      if(k===1){const l=acc.concat([words.slice(start).join(" ")]);const w=Math.max(...l.map(lineW));if(w<bw){bw=w;bestL=l;}return;}
      for(let i=start+1;i<=words.length-k+1;i++)rec(i,k-1,acc.concat([words.slice(start,i).join(" ")]));};
    rec(0,n,[]);return bestL;};
  for(let n=2;n<=maxLines;n++)if(words.length>=n)opts.push(best(n));
  // a single long word (or very long words) can break mid-word as a last resort
  if(words.length===1&&t.length>=9){const chars=[...t.replace(/ /g,"")];
    for(let n=2;n<=3;n++){const k=Math.ceil(chars.length/n);const l=[];for(let i=0;i<chars.length;i+=k)l.push(chars.slice(i,i+k).join(""));
      // hyphenate the break so it still reads as one word (skip if the line already ends in punctuation)
      opts.push(l.map((x,j)=>j<l.length-1&&/[A-Z0-9]$/.test(x)&&/^[A-Z0-9]/.test(l[j+1])?x+"-":x));}}
  return opts.filter(Boolean).map(l=>l.map(s=>s.trim()).filter(s=>s.length));
}
// ---------- share codes: 6-bit pack -> salted XOR keystream -> base64url, 16-bit checksum ----------
const KEY=[0x6c,0x31,0x74,0x74,0x6c,0x65,0x2d,0x6d,0x33,0x6e,0x9e,0x42,0xd7,0x18,0xa5,0x5b];
const ks=(salt,i)=>(KEY[i%KEY.length]+salt*29+i*71+(i*i)%13)&255;
function fnv16(arr){let h=0x811c9dc5;for(const b of arr){h^=b;h=Math.imul(h,0x01000193)>>>0;}return (h^(h>>>16))&0xffff;}
function b64u(bytes){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");}
function unb64u(str){if(!/^[A-Za-z0-9_-]+$/.test(str))throw 0;str=str.replace(/-/g,"+").replace(/_/g,"/");while(str.length%4)str+="=";const s=atob(str);return Array.from(s,c=>c.charCodeAt(0));}
// Share codes. v1: 6-bit text. v2: flags byte + 7-bit text (+ room for future fields). The version is
// told apart by a tagged checksum, so every old link keeps working and v1 stays the shortest form.
const CS_TAG={1:null,2:0x5d};
const csum=(v,salt,packed)=>fnv16(CS_TAG[v]==null?[salt,...packed]:[salt,CS_TAG[v],...packed]);
function seal(v,packed,salt){const cs=csum(v,salt,packed);const raw=[...packed,cs&255,cs>>8];return [salt^0xa7,...raw.map((b,i)=>b^ks(salt,i))];}
function open1(r){const salt=r[0]^0xa7;const raw=r.slice(1).map((b,i)=>b^ks(salt,i));const packed=raw.slice(0,-2);
  for(const v of [1,2]){const cs=csum(v,salt,packed);if((cs&255)===raw[raw.length-2]&&(cs>>8)===raw[raw.length-1])return {v,packed};}return null;}
function pack(vals,bitsPer){const out=[];let acc=0,bits=0;for(const v of vals){acc=(acc<<bitsPer)|v;bits+=bitsPer;while(bits>=8){bits-=8;out.push((acc>>bits)&255);}acc&=(1<<bits)-1;}
  if(bits>0)out.push((acc<<(8-bits))&255);return out;}
function encodeMsg(text){
  const chars=[...text];
  const v=chars.every(c=>ALPHA.includes(c))?1:2;
  const packed=v===1?pack(chars.map(c=>ALPHA.indexOf(c)+1).filter(x=>x>0),6):[0,...pack([...chars.map(c=>ALPHA2.indexOf(c)+1).filter(x=>x>0),0],7)];
  for(let tries=0;tries<64;tries++){const salt=Math.random()*256|0;const r=seal(v,packed,salt);
    const o=open1(r);if(o&&o.v===v)return b64u(r);}  // re-salt in the 1-in-65536 case a v2 code would also pass as v1
  return b64u(seal(v,packed,0));
}
function decodeMsg(code){
  try{const r=unb64u(code);if(r.length<3||r.length>64)return null;
    const o=open1(r);if(!o)return null;
    let acc=0,bits=0,out="";
    if(o.v===1){for(const b of o.packed){acc=((acc<<8)|b)&0xffff;bits+=8;while(bits>=6){bits-=6;const v=(acc>>bits)&63;if(v===0)return out;if(v>ALPHA.length)return null;out+=ALPHA[v-1];}}return out;}
    const flags=o.packed[0];if(flags&0xfe)return null; // unknown future fields: refuse rather than guess
    for(const b of o.packed.slice(1)){acc=((acc<<8)|b)&0xffff;bits+=8;while(bits>=7){bits-=7;const v=(acc>>bits)&127;if(v===0)return out;if(v>ALPHA2.length)return null;out+=ALPHA2[v-1];}}
    return out;
  }catch(e){return null;}
}

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

// Routes (mirrors worker/index.js): /<code> share links, legacy /s/<code> and /#<code>, /new creator, / landing, else 404
const RESERVED=new Set(["new","create","make","s","api","stats","the-office","index","index.html","app"]);
const PATH=location.pathname.replace(/\/{2,}/g,"/").replace(/(.)\/+$/,"$1");
let LEGACY=false;
function shareCode(){
  let m=PATH.match(/^\/s\/([A-Za-z0-9_-]{2,90})$/);if(m){LEGACY=true;return m[1];}
  m=PATH.match(/^\/([A-Za-z0-9_-]{4,90})$/);if(m&&!RESERVED.has(m[1].toLowerCase()))return m[1];
  if(PATH!=="/")return null;
  const h=location.hash.match(/^#(?:s[=\/])?([A-Za-z0-9_-]{2,90})$/);if(h&&!/^(create|make|new|how)$/i.test(h[1])){LEGACY=true;return h[1];}
  if(params.get("s")){LEGACY=true;return params.get("s");}
  return null;
}
const LANDING_WORDS=["PIXEL MOB","HI MUM!","HAPPY BDAY!","MARRY ME?","GG WP","PIXEL MOB","SEE YOU SOON","YOU ROCK"];
let wordIx=0;
(function route(){
  if(OG){APP="og";text=OGK==="landing"?"PIXEL MOB":"HELLO THERE";return;}
  const code=shareCode();
  if(code!==null){const msg=decodeMsg(code.trim());const t=msg&&cleanText(msg);
    if(t){APP="surprise";text=t;if(LEGACY&&!CAPTURE)try{history.replaceState(null,"","/"+code.trim());}catch(_){}}
    else{APP="error";text="???";}
    return;}
  if(PATH==="/"||PATH==="/new"||PATH==="/create"){APP="home";text=cleanText(params.get("text")||"")||LANDING_WORDS[0];return;}
  APP="lost";text="404";
})();
root.dataset.app=APP;
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
  for(const lines of lineOptions(text,H>W*1.3?4:3)){
    const r=rasterLines(lines);
    // narrow screens: let neighbours stand shoulder to shoulder (outlines touch) to win a bigger crowd
    const tight=W*0.92/(r.cols*11)<rh*0.94/(r.rows*16);
    const cwU=tight?10:11;
    const sFit=Math.min(W*0.92/(r.cols*cwU),rh*0.94/(r.rows*16));
    // integer art-pixels on 1x screens; on retina, half-steps stay crisp (nearest-neighbour) and fit phones better
    const s=DPR>=2?Math.max(1,Math.min(Math.floor(sFit*2)/2,cap)):Math.max(1,Math.min(Math.floor(sFit),cap));
    const eff=Math.min(sFit,cap);
    const score=eff*(1-0.1*(lines.length-1))*(single&&lines.length>1?0.85:1)+s*0.001;
    if(!best||score>best.score)best={r,s,score,cwU};
  }
  S=best.s;
  const r=best.r,cw=best.cwU*S,ch=16*S,totW=r.cols*cw,totH=r.rows*ch;
  const ox=Math.round((W-totW)/2),oy=Math.round(top+(rh-totH)/2);
  slots=r.cells.map(([c,rr])=>({x:Math.round(ox+c*cw+cw/2),y:Math.round(oy+rr*ch+ch)}));
  box={x:ox,y:oy,w:totW,h:totH,cx:ox+totW/2,cy:oy+totH/2};
  lost.style.top=((oy+totH)/DPR+20)+"px";
  cv.setAttribute("aria-label",APP==="surprise"&&(sPhase==="intro"||sPhase==="teaser")?"A mob of tiny pixel people wandering around":`A mob of tiny pixel people spelling “${text}”`);
}
function resize(){
  const oW=W||1,oH=H||1;
  DPR=Math.min(window.devicePixelRatio||1,dprCap);
  W=Math.round(innerWidth*DPR);H=Math.round(innerHeight*DPR);
  cv.width=W;cv.height=H;
  computeLayout();render();
  for(const p of people){p.x*=W/oW;p.y*=H/oH;p.tx*=W/oW;p.ty*=H/oH;if(p.wp){p.wp.x*=W/oW;p.wp.y*=H/oH;}}
  syncCount();
  if(mode==="form"||mode==="hold")form({dramatic:false,celebrate:"none"});
}
function relayout(){const oS=S;computeLayout();if(S!==oS)people.forEach(p=>{p.z=0;p.vz=0;});syncCount();if(mode==="form"||mode==="hold")form({dramatic:false,celebrate:mode==="hold"?"none":celebrate});}

// ---------- crowd ----------
function spawn(fromEdge){
  const L=newLook();
  const p={look:L,sheet:buildSheet(L),x:0,y:0,vx:0,vy:0,z:0,vz:0,tx:0,ty:0,wp:null,state:"walk",wait:0,
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
function wanderBounds(){const m=SW*S;
  if(panelOpen){const r=region();return {x0:m,x1:W-m,y0:Math.max(SH*S+m*0.5,r.top),y1:Math.max(r.top+SH*S,r.bot)};}
  return {x0:m,x1:W-m,y0:SH*S+m*0.5,y1:H-m*0.6};}
function pickWander(p){
  const b=wanderBounds();
  let bx=0,by=0,bs=-1;
  for(let k=0;k<4;k++){const cx=b.x0+Math.random()*(b.x1-b.x0),cy=b.y0+Math.random()*(b.y1-b.y0);
    let near=1e18;for(const q of people){if(q===p)continue;const d=(q.tx-cx)**2+((q.ty-cy)*1.4)**2;if(d<near)near=d;}
    if(near>bs){bs=near;bx=cx;by=cy;}}
  p.tx=bx;p.ty=by;p.state="walk";p.slot=null;p.wp=null;p.hurry=false;
}
function syncCount(){
  const n=slots.length;let active=people.filter(p=>!p.leaving);
  while(active.length<n){const p=spawn(!(OG));people.push(p);active.push(p);}
  if(active.length>n)active.slice(n).forEach(p=>{p.leaving=true;p.slot=null;p.state="walk";p.wp=null;p.alertIn=p.goIn=-1;p.act=null;
    p.tx=p.x<W/2?-SW*S*4:W+SW*S*4;p.ty=p.y+rnd(-1,1)*S*20;});
}
function assign(dramatic){
  const act=people.filter(p=>!p.leaving);
  // random slots, freshly shuffled every formation, so the crowd criss-crosses the screen
  const as=slots.map((_,j)=>j);
  for(let i=as.length-1;i>0;i--){const j=Math.random()*(i+1)|0;const t=as[i];as[i]=as[j];as[j]=t;}
  let maxD=1;act.forEach(p=>{maxD=Math.max(maxD,Math.hypot(p.x-box.cx,p.y-box.cy));});
  act.forEach((p,i)=>{const s=slots[as[i]];p.slot=s;p.tx=s.x;p.ty=s.y;p.hurry=false;
    const d=Math.hypot(s.x-p.x,s.y-p.y);
    if(d>S*40){const mx=(p.x+s.x)/2,my=(p.y+s.y)/2,nx=-(s.y-p.y)/d,ny=(s.x-p.x)/d,k=rnd(-0.22,0.22)*d;
      p.wp={x:mx+nx*k,y:my+ny*k};} else p.wp=null;
    if(dramatic){const dc=Math.hypot(p.x-box.cx,p.y-box.cy)/maxD;
      p.alertIn=0.08+dc*0.55+rnd(0,0.12);p.goIn=p.alertIn+rnd(0.3,1.0);p.quiet=false;}
    else {p.alertIn=rnd(0,0.18);p.goIn=p.alertIn+rnd(0.02,0.3);p.quiet=true;}
    p.state="pre";p.act=null;p.turnAt=0;
  });
}
// "MOB, ASSEMBLE!": one person near the middle stops and shouts, everyone turns to look, then they all run to random spots
let leader=null,bubble=null,lastAssemble=-99;
function pickLeader(act){
  const cx=W/2,cy=(region().top+region().bot)/2,minY=(SH*S+BUB.h*bubbleScale()+S*6);let best=null,bd=1e18;
  for(const p of act){if(p.x<SW*S*2||p.x>W-SW*S*2||p.y<minY||p.y>H-S*4)continue;
    const d=(p.x-cx)**2+((p.y-cy)*1.3)**2;if(d<bd){bd=d;best=p;}}
  return best;
}
function form(o){
  mode="form";modeT=0;celebrate=o.celebrate||"full";lost.classList.remove("on");
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
}
function bubbleScale(){return Math.max(1,Math.round(Math.max(S,2*DPR)));}
function scatter(gentle){
  mode="wander";modeT=0;lost.classList.remove("on");
  if(gentle||RM){people.forEach(p=>{if(!p.leaving){pickWander(p);p.act=null;p.ox=p.oy=p.ovx=p.ovy=0;}});return;}
  const cx=box.cx,cy=box.cy;
  people.forEach(p=>{if(p.leaving)return;
    p.slot=null;p.wp=null;p.alertIn=p.goIn=-1;p.hurry=false;
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
function confetti(x,y,n){if(RM)return;for(let i=0;i<n&&parts.length<1400;i++)parts.push({k:"conf",x,y,vx:rnd(-1,1)*S*34,vy:-rnd(40,95)*S,life:rnd(1.1,1.9),t:0,c:R(CONF)});}
function onFormed(){
  const act=people.filter(p=>!p.leaving);
  act.forEach(p=>{if(p.state!=="placed"&&p.slot){p.x=p.tx;p.y=p.ty;p.state="placed";p.vx=p.vy=0;}});
  lastForm=modeT;mode="hold";modeT=0;nextRipple=7;
  if(celebrate==="none"){act.forEach(p=>{p.face="F";});return;}
  const spread=celebrate==="big"?1.0:0.75;
  act.forEach(p=>{const fx=(p.x-box.x)/Math.max(1,box.w);
    p.turnAt=0.12+fx*spread;
    p.act={k:"cheer",at:p.turnAt+0.32,dur:celebrate==="big"?0.7:0.55,conf:celebrate==="mini"?0:(celebrate==="big"?4:2),
      h:celebrate==="mini"?2.5:(celebrate==="big"?5.5:4)};});
}
function ripple(kind){const act=people.filter(p=>p.state==="placed");
  act.forEach(p=>{const fx=(p.x-box.x)/Math.max(1,box.w);if(!p.act)p.act={k:kind,at:fx*0.8,dur:kind==="wave"?0.9:0.5,conf:0,h:kind==="hop"?2:0};});}

// ---------- surprise flow ----------
function showTeaser(){$("teaser").classList.add("on");}
function reveal(){
  if(APP!=="surprise"||(sPhase!=="intro"&&sPhase!=="teaser"))return;
  sPhase="reveal";$("teaser").classList.add("out");
  computeLayout();
  form({assemble:true,celebrate:"big"});
  track("revealed");
  setTimeout(()=>{$("sr").textContent=`The mob spells: ${text}`;},1400);
}
function showEnd(){endShown=true;$("endbar").classList.add("on");if(APP==="error")lost.classList.add("on");}
function replay(){scatter(false);replayIn=1.8;track("replay");}

// ---------- simulation ----------
function update(dt){
  modeT+=dt;appT+=dt;
  const auto=AUTO_APP&&!panelOpen;
  if(mode==="wander"&&auto&&modeT>(firstRun?3.4:4.0)){
    if(APP==="home"&&!firstRun&&!params.get("text")){wordIx=(wordIx+1)%LANDING_WORDS.length;text=LANDING_WORDS[wordIx];computeLayout();syncCount();}
    firstRun=false;form({assemble:true,celebrate:"full"});}
  if(replayIn>0){replayIn-=dt;if(replayIn<=0){replayIn=-1;form({assemble:true,say:APP==="error"?"UMM...":undefined,celebrate:AUTO_APP?"full":"big"});}}
  if(APP==="surprise"&&sPhase==="intro"&&appT>2.2){sPhase="teaser";teaserT=0;showTeaser();}
  if(APP==="surprise"&&sPhase==="teaser"){teaserT+=dt;if(teaserT>(RM?4:7.5))reveal();}
  if(APP==="error"&&sPhase==="intro"&&appT>1.1){sPhase="reveal";form({assemble:true,say:"UMM...",celebrate:"mini"});}
  if(mode==="form"){
    const act=people.filter(p=>!p.leaving);
    if(modeT>9)act.forEach(p=>{if(p.state!=="placed"){p.hurry=true;if(p.state==="pre"||p.state==="alert"||p.state==="freeze")p.state="walk";}});
    if(act.every(p=>p.state==="placed")||modeT>13)onFormed();
  }else if(mode==="hold"){
    if(APP==="lost"&&!panelOpen&&modeT>0.9)lost.classList.add("on");
    if(auto&&modeT>(APP==="home"?4.6:5.2))scatter(false);
    if((APP==="surprise"||APP==="error")&&!endShown&&modeT>(APP==="error"?0.8:2.2))showEnd();
    if(!auto&&modeT>nextRipple){nextRipple=modeT+rnd(6,8);ripple(Math.random()<.5?"wave":"hop");}
  }
  const diagv=diag();
  const wanderSp=Math.max(S*18,diagv*(firstRun&&mode==="wander"&&modeT<3?0.1:0.055))*(OG?0:1);
  const formSp=Math.max(S*60,diagv*0.24)*(RM?1.4:1);
  if(bubble){bubble.t+=dt;if(bubble.t>bubble.life+0.14){bubble=null;leader=null;}}
  const pr=S*26,ptrLive=(now-ptr.t)<1.5;
  // separation via a spatial grid (people never stack up)
  const rx=S*9,ry=S*5,cell=rx,grid=new Map();
  for(const a of people){a.sx=0;a.sy=0;if(a.state==="placed")continue;
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
    if(mode==="hold"){
      if(p.turnAt>0){p.turnAt-=dt;if(p.turnAt<=0){p.turnAt=0;p.face="F";p.lookDir=0;hop(p,S*1.2);}}
      if(p.act){const a=p.act;
        if(!a.on){a.at-=dt;if(a.at<=0){a.on=true;if(a.h)hop(p,S*a.h*rnd(0.85,1.15));if(a.conf)confetti(p.x,p.y-SH*S,a.conf);
          if(a.k==="cheer"&&Math.random()<(celebrate==="big"?.5:.4))a.next={k:"wave",dur:rnd(0.9,1.6)};}}
        else{a.dur-=dt;if(a.dur<=0){const nx=a.next;p.act=nx?{k:"wave",on:true,dur:nx.dur,at:0}:null;
          if(!nx&&a.k==="cheer"&&Math.random()<(celebrate==="big"?.2:.12))p.emote={k:"heart",t:0,life:1.1};}}}
    }
    if(p.vz!==0||p.z>0){p.vz-=GRAV()*dt;p.z+=p.vz*dt;if(p.z<=0){if(p.vz<-S*30&&p.state==="placed")dust(p.x,p.y);p.z=0;p.vz=0;}}
    let px=0,py=0,pf=0;
    if(ptrLive){const dx=p.x-ptr.x,dy=(p.y-SH*S*0.5)-ptr.y,d=Math.hypot(dx,dy);
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
      p.ox+=p.ovx*dt;p.oy+=p.ovy*dt;
      continue;}
    if(st==="burst"){p.wait-=dt;const k=Math.exp(-dt*3.2);p.vx*=k;p.vy*=k;p.x+=p.vx*dt;p.y+=p.vy*dt;p.dist+=Math.hypot(p.vx,p.vy)*dt;
      if(Math.abs(p.vx)>Math.abs(p.vy)*0.6){p.face="S";p.dir=p.vx>0?1:-1;}else p.face=p.vy<0?"B":"F";
      p.x=clamp(p.x,-SW*S,W+SW*S);p.y=clamp(p.y,SH*S,H-S*2);
      if(p.wait<=0)pickWander(p);continue;}
    if(st==="idle"){p.wait-=dt;
      if(pf>0.15&&!OG){p.state="walk";p.tx=clamp(p.x+px*S*40,SW*S,W-SW*S);p.ty=clamp(p.y+py*S*30,SH*S*1.5,H-S*6);p.wp=null;
        if(Math.random()<.3)p.emote={k:"!",t:0,life:.6};hop(p,S*2);}
      p.x+=p.sx*S*20*dt;p.y+=p.sy*S*20*dt;
      if(p.wait<=0&&mode==="wander"&&!OG)pickWander(p);
      continue;}
    const sp=(p.slot||p.leaving)?formSp*(p.leaving?1.2:1)*(p.run?1.3:1):wanderSp;
    if(pf>0&&!p.slot){p.vx+=px*pf*S*500*dt;p.vy+=py*pf*S*400*dt;}
    moveToward(p,dt,sp,!!p.slot,false);
  }
  people=people.filter(p=>!(p.leaving&&(p.x<-SW*S*3||p.x>W+SW*S*3||p.y<-SH*S*2||p.y>H+SH*S*2)));
  for(const q of parts){q.t+=dt;if(q.k==="conf"){q.vy+=S*160*dt;q.vx*=Math.exp(-dt*1.5);q.vy*=Math.exp(-dt*1.2);}
    else{q.vy*=Math.exp(-dt*4);q.vx*=Math.exp(-dt*4);}q.x+=q.vx*dt;q.y+=q.vy*dt;}
  if(parts.length)parts=parts.filter(q=>q.t<q.life);
}
function moveToward(p,dt,maxSp,toSlot,pre){
  // while "pre", people keep wandering toward their old wander target
  let gx=p.tx,gy=p.ty;
  if(pre){gx=p.x+p.vx;gy=p.y+p.vy;}
  if(p.wp&&!pre){gx=p.wp.x;gy=p.wp.y;if(Math.hypot(gx-p.x,gy-p.y)<S*14){p.wp=null;gx=p.tx;gy=p.ty;}}
  const dx=gx-p.x,dy=gy-p.y,d=Math.hypot(dx,dy);
  const dT=Math.hypot(p.tx-p.x,p.ty-p.y);
  let sp=maxSp*(toSlot?p.formF:p.speedF);
  if(!p.wp&&!pre)sp*=clamp(dT/(S*(toSlot?16:10)),toSlot?0.12:0.25,1);
  let dvx=d>0?dx/d*sp:0,dvy=d>0?dy/d*sp:0;
  const sepW=p.hurry?0:(toSlot?clamp((dT-S*10)/(S*30),0,1):1);
  if(p.hurry){dvx*=1.6;dvy*=1.6;}
  dvx+=p.sx*S*55*sepW;dvy+=p.sy*S*55*sepW;
  const acc=1-Math.exp(-dt*(toSlot&&dT<S*20?14:6));
  p.vx+=(dvx-p.vx)*acc;p.vy+=(dvy-p.vy)*acc;
  if(p.look.zombie)p.vy+=Math.sin(now*6+p.phase)*S*60*dt;
  p.x+=p.vx*dt;p.y+=p.vy*dt;const v=Math.hypot(p.vx,p.vy);p.dist+=v*dt;
  if(v>S*2){if(Math.abs(p.vx)>Math.abs(p.vy)*0.55){p.face="S";p.dir=p.vx>0?1:-1;}else p.face=p.vy<0?"B":"F";}
  if(pre)return;
  if(toSlot&&dT<S*0.9&&!p.wp){
    p.x=p.tx;p.y=p.ty;p.vx=p.vy=0;p.hurry=false;p.run=false;p.state="placed";if(p.face==="B"&&Math.random()<.5)p.face="S";
    if(celebrate==="none")p.face="F";
    p.ox=p.oy=0;p.ovx=0;p.ovy=S*20;hop(p,S*2.2);p.lookDir=0;
  }else if(!toSlot&&!p.leaving&&dT<S*2&&p.state==="walk"){
    p.state="idle";p.wait=rnd(0.5,2.6);p.vx=p.vy=0;if(Math.random()<.45)p.face="F";
  }
}
// ---------- render ----------
function render(){
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle="#f4f2ee";ctx.fillRect(0,0,W,H);ctx.imageSmoothingEnabled=false;
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
      if(a==="cheer")f=FR.Fcheer;
      else if(a==="wave")f=(Math.floor(now*7+p.phase)%2)?FR.Fwave1:FR.Fwave2;
      else if(p.face==="S")f=p.dir>0?FR.Sp:FR.LSp;
      else if(p.face==="B")f=FR.Bidle;
      else if(p.blink>0)f=FR.Fblink;
      else if(p.lookDir<0)f=FR.FlookL;else if(p.lookDir>0)f=FR.FlookR;
      if(p.state==="placed"&&!a&&!RM){const k=Math.sin(now*2.6+p.phase*1.7);bob=k>0.8?-S:0;}
    }
    const x=Math.round(p.x+p.ox-dw/2),y=Math.round(p.y+p.oy-dh+bob-p.z);
    ctx.drawImage(p.sheet,f*SW,0,SW,SH,x,y,dw,dh);
    if(p.emote){const e=p.emote,tt=e.t;
      if(!(tt>e.life-0.15&&Math.floor(tt*20)%2)){
        const pop=tt<0.08?2*S:tt<0.16?-S:0,im=e.k==="heart"?HEART:BUBBLE;
        ctx.drawImage(im,Math.round(p.x+p.ox-S),Math.round(y-im.height*S+pop-S-(e.k==="heart"?Math.round(tt*8)*S:0)),im.width*S,im.height*S);}}
  }
  if(bubble&&leader&&bubble.t>=0)drawBubble();
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
  const im=bubbleImg(b.say),bw=im.width*k,bh=im.height*k,head=leader.y+leader.oy-leader.z-SH*S;
  const tx=Math.round(leader.x+leader.ox);
  let x=Math.round(tx-bw/2);x=clamp(x,Math.round(8*DPR),Math.round(W-8*DPR-bw));
  const y=Math.round(head-bh-3*k-S+dy*k);
  ctx.drawImage(im,x,y,bw,bh);
  // tail: points at the leader even when the bubble is nudged off-centre by the screen edge
  const tcx=clamp(tx,x+4*k,x+bw-5*k),ty=y+bh-2*k;
  for(let r=0;r<4;r++){const half=3-r;const x0=tcx-half*k-Math.floor(k/2),wpx=(half*2+1)*k;
    ctx.fillStyle=INK;ctx.fillRect(x0,ty+r*k,wpx,k);if(half>0){ctx.fillStyle="#fffdf8";ctx.fillRect(x0+k,ty+r*k,wpx-2*k,k);}}
}
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

// ---------- pixel text (our own 5x7 font, crisp at any DPR) ----------
function pixelText(el,str,scale,color){
  const lines=str.split("\n"),rs=lines.map(l=>rasterLines([l]));
  const w=Math.max(...rs.map(r=>r.cols)),h=lines.length*9-2;
  const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.fillStyle=color;
  rs.forEach((r,li)=>{const off=Math.floor((w-r.cols)/2);r.cells.forEach(([cx,cy])=>x.fillRect(cx+off,cy+li*9,1,1));});
  c.style.width=w*scale+"px";c.style.height=h*scale+"px";c.setAttribute("aria-hidden","true");
  el.replaceChildren(c);
}
// ---------- UI ----------
const panel=$("panel"),msg=$("msg"),countEl=$("count"),noteEl=$("note"),linkEl=$("link"),copyBtn=$("copyBtn"),shareBtn=$("shareBtn"),prevBtn=$("prevBtn");
const NOTE_DEFAULT=noteEl.textContent;
let curLink="",typeT=0,noteT=0,lastFocus=null;
const ORIGIN=/(^|\.)pixelmob\.io$/.test(location.hostname)?"https://pixelmob.io":(location.origin&&location.origin!=="null"?location.origin:"https://pixelmob.io");
// anonymous usage counts: an event name only (never the message or the code); the server adds the country
function track(e){if(CAPTURE||OG||!navigator.sendBeacon)return;try{navigator.sendBeacon("/api/event",JSON.stringify({e,p:APP}));}catch(_){}}
const createdFor=new Set();
function trackCreated(){const k=cleanText(msg.value);if(!k||createdFor.has(k))return;createdFor.add(k);track("created");}
function toast(t){const el=$("toast");el.textContent=t;el.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("on"),1900);}
function setNote(t,warn){noteEl.textContent=t;noteEl.classList.toggle("warn",!!warn);clearTimeout(noteT);
  if(warn)noteT=setTimeout(()=>{noteEl.textContent=NOTE_DEFAULT;noteEl.classList.remove("warn");},3200);}
function updateLink(t){
  const has=!!t;
  copyBtn.disabled=!has;shareBtn.disabled=!has;prevBtn.setAttribute("aria-disabled",String(!has));
  if(!has){curLink="";linkEl.textContent="Type something to get your link";linkEl.classList.add("empty");prevBtn.removeAttribute("href");return;}
  curLink=ORIGIN+"/"+encodeMsg(t);
  linkEl.textContent=curLink.replace(/^https?:\/\//,"");linkEl.classList.remove("empty");prevBtn.href=curLink;
}
function onInput(e){
  if(e&&e.isComposing)return;
  const raw=msg.value,{text:t,dropped}=sanitize(raw);
  let v=t.replace(/^ +/,"");
  if(v.length>MAXLEN){v=v.slice(0,MAXLEN);setNote(`That's the limit: ${MAXLEN} characters`,true);countEl.classList.add("bump");setTimeout(()=>countEl.classList.remove("bump"),300);}
  if(v!==raw){const atEnd=msg.selectionStart===raw.length;const pos=Math.min(v.length,msg.selectionStart||0);msg.value=v;
    try{msg.setSelectionRange(atEnd?v.length:pos,atEnd?v.length:pos);}catch(_){}}
  if(dropped.length)setNote(`The little people can't spell ${dropped.slice(0,3).join(" ")} yet, so they skipped it`,true);
  const n=v.trim().length;countEl.textContent=`${n}/${MAXLEN}`;countEl.classList.toggle("near",n>=MAXLEN-4);
  if(!dropped.length&&n<=MAXLEN&&!noteEl.classList.contains("warn"))noteEl.textContent=n>18?"Tip: shorter messages mean bigger little people":NOTE_DEFAULT;
  updateLink(v.trim());
  clearTimeout(typeT);typeT=setTimeout(()=>applyTyped(v.trim()),RM?150:380);
}
function applyTyped(t){
  updateLink(t);
  if(!t){if(mode!=="wander")scatter(true);return;}
  if(t===text&&(mode==="hold"||mode==="form"))return;
  text=t;computeLayout();syncCount();form({assemble:true,celebrate:"mini"});
}
function openPanel(){
  if(panelOpen)return;lastFocus=document.activeElement;panelOpen=true;
  root.classList.add("panel-open");panel.setAttribute("aria-hidden","false");panel.inert=false;
  lost.classList.remove("on");replayIn=-1;
  if(APP==="home"&&!CAPTURE&&PATH!=="/new")try{history.replaceState(null,"","/new");}catch(_){}
  if(APP==="home")scrollTo({top:0,behavior:RM?"auto":"smooth"});
  requestAnimationFrame(()=>{relayout();});
  setTimeout(()=>{if(!matchMedia("(pointer:coarse)").matches||panel.dataset.autofocus)msg.focus({preventScroll:true});},60);
  if(msg.value.trim())updateLink(cleanText(msg.value));else updateLink("");
}
function closePanel(){
  if(!panelOpen)return;panelOpen=false;
  root.classList.remove("panel-open");panel.setAttribute("aria-hidden","true");panel.inert=true;msg.blur();
  if(APP==="home"&&!CAPTURE&&location.pathname!=="/")try{history.replaceState(null,"","/");}catch(_){}
  if(APP==="home"){ if(mode!=="wander")modeT=Math.min(modeT,1.5); }
  else if(APP==="surprise"&&text!==surpriseText&&sPhase!=="intro"&&sPhase!=="teaser"){text=surpriseText;computeLayout();syncCount();form({dramatic:false,celebrate:"mini"});}
  requestAnimationFrame(()=>relayout());
  if(lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true});
}
const surpriseText=text;
async function copyLink(){
  if(!curLink)return;let ok=false;
  try{await navigator.clipboard.writeText(curLink);ok=true;}catch(_){
    const ta=document.createElement("textarea");ta.value=curLink;ta.setAttribute("readonly","");ta.style.cssText="position:fixed;top:0;left:0;opacity:0;font-size:16px";
    document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,ta.value.length);try{ok=document.execCommand("copy");}catch(_){}ta.remove();}
  if(ok){copyBtn.classList.add("done");copyBtn.querySelector("span").textContent="Copied!";toast("Copied. Your mob is ready to send 👀");trackCreated();
    clearTimeout(copyLink.t);copyLink.t=setTimeout(()=>{copyBtn.classList.remove("done");copyBtn.querySelector("span").textContent="Copy link";},1600);
    if(mode==="hold")ripple("hop");}
  else{toast("Couldn't copy automatically. Press and hold the link to copy it");const r=document.createRange();r.selectNodeContents(linkEl);const s=getSelection();s.removeAllRanges();s.addRange(r);}
}
async function shareLink(){
  if(!curLink)return;
  try{await navigator.share({title:"Someone sent you a Pixel Mob 👀",text:"I made you a tiny mob. Tap to reveal 👀",url:curLink});track("share_native");trackCreated();}
  catch(e){if(e&&e.name!=="AbortError")copyLink();}
}
if(navigator.share&&matchMedia("(pointer:coarse)").matches)shareBtn.hidden=false;
msg.addEventListener("input",onInput);
msg.addEventListener("compositionend",onInput);
msg.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();clearTimeout(typeT);applyTyped(cleanText(msg.value));if(curLink)copyLink();}});
copyBtn.addEventListener("click",copyLink);
shareBtn.addEventListener("click",shareLink);
prevBtn.addEventListener("click",e=>{if(!curLink)e.preventDefault();});
$("pclose").addEventListener("click",closePanel);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&panelOpen)closePanel();});
document.querySelectorAll("[data-open-panel]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();if(APP==="surprise"||APP==="error")track("make_your_own_click");openPanel();}));
$("reveal").addEventListener("click",e=>{e.stopPropagation();reveal();});
$("replay").addEventListener("click",e=>{e.stopPropagation();replay();});
$("home").addEventListener("click",e=>{e.stopPropagation();
  location.href=APP==="error"?"/new":"/";});
// iOS keyboard: keep the panel sitting just above it
if(window.visualViewport){const vv=visualViewport;let vt;
  const onVV=()=>{const kb=Math.max(0,innerHeight-(vv.height+vv.offsetTop));panel.style.setProperty("--kb",kb+"px");
    clearTimeout(vt);vt=setTimeout(()=>{if(panelOpen)relayout();},160);};
  vv.addEventListener("resize",onVV);vv.addEventListener("scroll",onVV);}
// ---------- input on the crowd ----------
function setPtr(e){const nx=e.clientX*DPR,ny=e.clientY*DPR;const dtt=Math.max(0.016,now-ptr.t);
  if(now-ptr.t<0.2){ptr.vx=(nx-ptr.x)/dtt;ptr.vy=(ny-ptr.y)/dtt;}else{ptr.vx=ptr.vy=0;}
  ptr.x=nx;ptr.y=ny;ptr.t=now;}
cv.addEventListener("pointermove",setPtr);
cv.addEventListener("pointerdown",e=>{setPtr(e);ptr.down={x:e.clientX,y:e.clientY};});
cv.addEventListener("pointerup",e=>{const d=ptr.down;ptr.down=null;if(e.pointerType!=="mouse")ptr.t=now-1.2;
  if(!d||Math.hypot(e.clientX-d.x,e.clientY-d.y)>=12)return;
  if(panelOpen&&matchMedia("(pointer:coarse)").matches){msg.blur();return;}
  if(APP==="surprise"&&(sPhase==="intro"||sPhase==="teaser")){reveal();return;}
  if(APP==="og")return;
  if(mode==="wander"&&replayIn<0)form({assemble:true,celebrate:AUTO_APP?"full":"big"});
  else if(mode==="hold"){if(AUTO_APP&&!panelOpen)scatter(false);else replay();}
});
cv.addEventListener("pointerleave",()=>{ptr.t=-9;});
cv.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();if(APP==="surprise"&&sPhase!=="reveal")reveal();else if(mode==="hold")replay();else form({assemble:true,celebrate:"full"});}});
addEventListener("hashchange",()=>{if(PATH==="/"&&/^#(?:s[=\/])?[A-Za-z0-9_-]{6,80}$/.test(location.hash)&&!/^#(how|new|create|make)$/i.test(location.hash))location.reload();});
let rz;addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(resize,120);});
// ---------- boot ----------
const ICON_LOOK={skin:"#f0c39d",hair:"#2a1c14",shirt:"#e74c3c",pants:"#2c3e70",shoes:"#2a2320",hat:"#2f6fd6",eye:"#1b1714",
  zombie:false,style:"cap",skirt:false,beard:false,stripe:false,blush:true};
pixelText($("teaserTitle"),innerWidth<520?"SOMEONE SENT\nYOU A MESSAGE":"SOMEONE SENT YOU\nA MESSAGE",innerWidth<380?3:4,INK);
pixelText($("ptitleArt"),"MAKE A MOB MESSAGE",2,INK);
if(OGK==="message")pixelText($("ogTitle"),"SOMEONE SENT YOU\nA MESSAGE",5,INK);
else{$("ogcard").classList.add("landing");$("ogTitle").remove();$("ogcard").querySelector("img").remove();$("ogEyebrow").textContent="TINY PEOPLE. BIG FEELINGS.";$("ogSub").textContent="Turn any message into a crowd · pixelmob.io";}
if(APP==="lost"){lost.querySelector("p").textContent="This page wandered off with the mob.";$("home").textContent="Back to Pixel Mob";}
if(APP==="error"){lost.querySelector("p").textContent="Hmm… this link got scrambled on the way.";$("home").textContent="Make a new message";}
bubbleImg("MOB, ASSEMBLE!");
panel.inert=true;
resize();
if(APP!=="og")people.forEach(p=>{p.state="walk";});
if(OG){people.forEach(p=>{p.state="idle";p.wait=99;p.face=R(["F","F","S","S","B"]);p.dir=Math.random()<.5?1:-1;});}
if(APP==="home"&&(PATH==="/new"||PATH==="/create"||params.has("create")||location.hash==="#create"))setTimeout(openPanel,CAPTURE?0:700);
if(APP==="surprise")track("opened");
requestAnimationFrame(()=>root.classList.add("ready"));
window.__crowd={get mode(){return mode},get app(){return APP},get phase(){return sPhase},get text(){return text},get count(){return people.length},
  get slots(){return slots.length},get cost(){return cost},get lastForm(){return lastForm},get link(){return curLink},get dpr(){return DPR},get layout(){return {x:box.x,w:box.w,y:box.y,h:box.h,S,W,H};},get states(){const m={};people.forEach(p=>{const k=p.state+(p.leaving?'-leaving':'');m[k]=(m[k]||0)+1;});return m;},
  form:()=>form({assemble:true,celebrate:"full"}),get bubble(){return bubble?{t:bubble.t,say:bubble.say,leader:!!leader}:null},scatter:()=>scatter(false),reveal,openPanel,closePanel,decode:decodeMsg,encode:encodeMsg,
  step:(ms)=>{const n=Math.max(1,Math.round(ms/16.67));for(let i=0;i<n;i++){now+=ms/1000/n;update(ms/1000/n);}render();},
  poke:(x,y)=>{ptr.x=x*DPR;ptr.y=y*DPR;ptr.t=now;ptr.vx=W;ptr.vy=0;},
  icon:(size,bg)=>{const sh=buildSheet(ICON_LOOK),c=document.createElement("canvas");c.width=c.height=size;const x=c.getContext("2d");x.imageSmoothingEnabled=false;
    if(bg){x.fillStyle=bg;x.fillRect(0,0,size,size);}
    const sc=Math.max(1,Math.floor(size*(bg?0.72:1)/16)),w=12*sc,h=16*sc;
    x.drawImage(sh,0,0,12,16,Math.round((size-w)/2),Math.round((size-h)/2),w,h);return c.toDataURL("image/png");}};
requestAnimationFrame(frame);
})();
