
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
// ---------- tiny pixel drawings (the mob forms these too). APPEND ONLY: their order is part of the link format ----------
// X = main colour, o = accent colour (people standing there wear that colour)
const DRAW=[
 ["heart","❤️ ❤ 💖 💗 💓 💕 💘 💝 😍 🥰 💞","#e74c3c","#ff8fa3",".XX.XX.|XXXXXXX|XXXXXXX|XXXXXXX|.XXXXX.|..XXX..|...X..."],
 ["cake","🎂 🍰 🧁","#ff6b9d","#f1c40f",".o.o.o.|.X.X.X.|XXXXXXX|X.X.X.X|XXXXXXX|X.....X|XXXXXXX"],
 ["thumbs","👍","#f1c40f","#e67e22","...X...|..XX...|..XX...|XXXXXX.|oXXXXXX|oXXXXX.|oXXXX.."],
 ["star","⭐ 🌟 ✨ ★ ☆ 💫","#f1c40f","#f39c12","...X...|...X...|XXXXXXX|.XXXXX.|..XXX..|.XX.XX.|XX...XX"],
 ["smile","😊 🙂 😀 😃 😄 😁 ☺️ ☺ 😂 🤣 😆","#f1c40f","#2d2420",".XXXXX.|X.....X|X.o.o.X|X.....X|Xo...oX|X.ooo.X|.XXXXX."],
 ["ring","💍 💎","#f1c40f","#4ca3dd","..ooo..|...o...|.XXXXX.|X.....X|X.....X|X.....X|.XXXXX."],
 ["gift","🎁","#9b59b6","#f1c40f",".oo.oo.|...o...|XXXoXXX|X..o..X|XXXoXXX|X..o..X|XXXoXXX"],
 ["party","🎉 🎊 🥳","#ff8c42","#3a7bd5","....o.o|..o.o..|.XX..o.|.XXX...|XXXXX..|XXXX...|XX....."],
 ["tree","🎄 🌲","#2ecc71","#8b5a2b","...X...|..XXX..|.XXXXX.|..XXX..|.XXXXX.|XXXXXXX|...o..."],
 ["pumpkin","🎃","#e67e22","#2ecc71","...o...|.XXXXX.|XX.X.XX|XXXXXXX|XX...XX|XXXXXXX|.XXXXX."],
 ["ghost","👻","#f4f4f4","#2d2420",".XXXXX.|XXXXXXX|XoXXXoX|XXXXXXX|XXXXXXX|XXXXXXX|X.X.X.X"],
 ["sun","☀️ ☀ 🌞 🌤️","#f39c12","#f1c40f","X..o..X|.X.o.X.|..XXX..|ooXXXoo|..XXX..|.X.o.X.|X..o..X"],
 ["moon","🌙 🌛 🌜 🌝","#f1c40f","#f39c12","..XXX..|.XX....|XX.....|XX.....|XX.....|.XX....|..XXX.."],
 ["ball","⚽ 🏀 🏈 ⚾","#f4f4f4","#2d2420",".XXXXX.|XXoXoXX|XooooXX|XXoooXX|XooooXX|XXoXoXX|.XXXXX."],
 ["fire","🔥","#e74c3c","#f1c40f","...X...|..XX...|..XXX.X|.XXXXXX|XXXoXXX|XXoooXX|.XXXXX."],
 ["music","🎵 🎶","#3a7bd5","#2d2420","...XXXX|...X..X|...X..X|...X..X|.XXX.XX|XXXX.XX|.XX...."],
 ["crown","👑","#f1c40f","#e74c3c","X..X..X|XX.X.XX|XXXXXXX|XoXoXoX|XXXXXXX|.......|......."],
 ["flower","🌸 🌹 🌷 🌼 🌺 💐","#ff6b9d","#2ecc71",".X.X.X.|XXXXXXX|.XXXXX.|XXXXXXX|.X.o.X.|...o...|..ooo.."],
 ["snow","❄️ ❄ ☃️ ☃ ⛄","#4ca3dd","#f4f4f4","...X...|X..X..X|.X.X.X.|..XXX..|.X.X.X.|X..X..X|...X..."],
 ["trophy","🏆 🥇","#f39c12","#8b5a2b","XXXXXXX|XXXXXXX|.XXXXX.|..XXX..|...X...|..ooo..|.ooooo."],
];
const DRAW_CH=DRAW.map((_,i)=>String.fromCharCode(0xE000+i));
const DRAW_EMOJI=new Map();
DRAW.forEach((d,i)=>{G[DRAW_CH[i]]=d[4];d[1].split(" ").forEach(e=>DRAW_EMOJI.set(e,DRAW_CH[i]));});
const DRAW_INFO=ch=>{const i=ch.charCodeAt(0)-0xE000;return i>=0&&i<DRAW.length?DRAW[i]:null;};
// how a drawing token shows in the text box: its first emoji
const toDisplay=t=>[...String(t)].map(c=>{const d=DRAW_INFO(c);return d?d[1].split(" ")[0]:c;}).join("");
const EMOJI_RE=new RegExp([...DRAW_EMOJI.keys()].sort((a,b)=>b.length-a.length).map(e=>e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|"),"g");
// ---------- text ----------
const glyph = ch => (G[ch]||G["?"]).split("|");
const GW = ch => ch===" "?3:glyph(ch)[0].length;
// v1 alphabet (6-bit codes; never reorder: existing links depend on it) and the v2 superset (7-bit codes)
const ALPHA=" ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?.,'\"-+:#&@/*=()$%_♥";
const ALPHA2=ALPHA+";<>[]{}\\|^`~£€°"+DRAW_CH.join("");
const MAXLEN=32;
function sanitize(raw){
  let t=String(raw||"").replace(/[\u{1F3FB}-\u{1F3FF}]/gu,"").replace(EMOJI_RE,m=>DRAW_EMOJI.get(m)).normalize("NFKD").replace(/[\u0300-\u036f]/g,"");
  t=t.replace(/[\u2018\u2019\u201A\u2032\u00B4]/g,"'").replace(/[\u201C\u201D\u201E\u2033]/g,'"')
     .replace(/[\u2013\u2014\u2212]/g,"-").replace(/\u2026/g,"...")
     .replace(/(?:\u2665|\u2661|\u2763)\uFE0F?/g,"\u2665");
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
      const g=glyph(c),d=DRAW_INFO(c);
      g.forEach((r,ry)=>{[...r].forEach((v,rx)=>{if(v==="X"||v==="o")cells.push([x+rx,y0+ry,d?(v==="o"?d[3]:d[2]):null]);});});x+=g[0].length;});
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
// A message: up to 4 scenes plus optional extras. Extras ride in v2's flags byte + TLV fields, so v1 links
// and simple v2 links keep decoding exactly as before, and unknown future fields are skipped, not fatal.
const THEMES=["default","birthday","christmas","halloween","wedding","stadium"];           // append only
const MOB_COLORS=["#e74c3c","#3a7bd5","#2ecc71","#f1c40f","#9b59b6","#ff6b9d","#2d2420","#f4f4f4","#ff8c42","#1abc9c"]; // append only
const BG_COLORS=["#f4f2ee","#fff6e8","#eaf4fb","#fbf1f3","#eef7ea","#1f2a44","#2a1f33","#3f7d3a","#2d2420","#ffe9a8"];   // append only
const SIZES=["small","medium","huge"];
const MAX_SCENES=4,MAX_TOTAL=80,MAX_FROM=16,SCENE_BREAK=127;
const T_FROM=1,T_THEME=2,T_MOB=3,T_BG=4,T_SIZE=5,T_AT=6;
function blankMsg(){return {scenes:[""],from:"",theme:"default",mob:-1,bg:-1,size:"medium",at:0};}
function normMsg(m){
  const o=Object.assign(blankMsg(),m||{});
  let total=0;
  o.scenes=(o.scenes||[]).map(cleanText).filter(Boolean).slice(0,MAX_SCENES).map(t=>{const k=[...t].slice(0,Math.max(0,MAX_TOTAL-total)).join("").trim();total+=[...k].length;return k;}).filter(Boolean);
  o.from=[...cleanText(o.from||"")].filter(c=>!DRAW_INFO(c)).slice(0,MAX_FROM).join("").trim();
  if(!THEMES.includes(o.theme))o.theme="default";
  if(!(o.mob>=0&&o.mob<MOB_COLORS.length))o.mob=-1;
  if(!(o.bg>=0&&o.bg<BG_COLORS.length))o.bg=-1;
  if(!SIZES.includes(o.size))o.size="medium";
  o.at=Math.max(0,Math.floor(+o.at||0));
  return o;
}
const isPlain=m=>m.scenes.length===1&&!m.from&&m.theme==="default"&&m.mob<0&&m.bg<0&&m.size==="medium"&&!m.at;
function encodePayload(input){
  const m=normMsg(input);if(!m.scenes.length)return "";
  const chars=[...m.scenes[0]];
  let v,packed;
  if(isPlain(m)&&chars.every(c=>ALPHA.includes(c))){v=1;packed=pack(chars.map(c=>ALPHA.indexOf(c)+1),6);}
  else{
    v=2;const vals=[];m.scenes.forEach((sc,i)=>{if(i)vals.push(SCENE_BREAK);for(const c of sc)vals.push(ALPHA2.indexOf(c)+1);});vals.push(0);
    const f=[];
    if(m.from)f.push(T_FROM,[...m.from].length,...[...m.from].map(c=>ALPHA2.indexOf(c)+1));
    if(m.theme!=="default")f.push(T_THEME,1,THEMES.indexOf(m.theme));
    if(m.mob>=0)f.push(T_MOB,1,m.mob);
    if(m.bg>=0)f.push(T_BG,1,m.bg);
    if(m.size!=="medium")f.push(T_SIZE,1,SIZES.indexOf(m.size));
    if(m.at){const t=Math.floor(m.at/60000);f.push(T_AT,4,(t>>>24)&255,(t>>>16)&255,(t>>>8)&255,t&255);}
    packed=[f.length?1:0,...pack(vals,7),...f];
  }
  for(let tries=0;tries<64;tries++){const salt=Math.random()*256|0;const r=seal(v,packed,salt);
    const o=open1(r);if(o&&o.v===v)return b64u(r);}  // re-salt in the 1-in-65536 case a v2 code would also pass as v1
  return b64u(seal(v,packed,0));
}
function decodePayload(code){
  try{const r=unb64u(String(code||""));if(r.length<3||r.length>128)return null;
    const o=open1(r);if(!o)return null;
    const m=blankMsg();let acc=0,bits=0,cur="",i=0;
    if(o.v===1){for(const b of o.packed){acc=((acc<<8)|b)&0xffff;bits+=8;while(bits>=6){bits-=6;const v=(acc>>bits)&63;if(v===0)break;if(v>ALPHA.length)return null;cur+=ALPHA[v-1];}}
      m.scenes=[cur];return m;}
    const flags=o.packed[0],p=o.packed;m.scenes=[];
    let done=false;
    for(i=1;i<p.length&&!done;i++){acc=((acc<<8)|p[i])&0xffff;bits+=8;
      while(bits>=7){bits-=7;const v=(acc>>bits)&127;
        if(v===0){done=true;break;}
        if(v===SCENE_BREAK){m.scenes.push(cur);cur="";continue;}
        if(v>ALPHA2.length)return null;cur+=ALPHA2[v-1];}}
    m.scenes.push(cur);
    if(flags&1)while(i+1<p.length){const t=p[i],n=p[i+1],d=p.slice(i+2,i+2+n);i+=2+n;if(d.length<n)break;
      if(t===T_FROM)m.from=d.map(x=>ALPHA2[x-1]||"").join("");
      else if(t===T_THEME)m.theme=THEMES[d[0]]||"default";
      else if(t===T_MOB)m.mob=d[0];
      else if(t===T_BG)m.bg=d[0];
      else if(t===T_SIZE)m.size=SIZES[d[0]]||"medium";
      else if(t===T_AT&&n===4)m.at=(((d[0]<<24)>>>0)+(d[1]<<16)+(d[2]<<8)+d[3])*60000;
      // unknown field types are skipped so older apps can still open newer links
    }
    const n=normMsg(m);return n.scenes.length?n:null;
  }catch(e){return null;}
}
const encodeMsg=t=>encodePayload({scenes:[t]});
function decodeMsg(code){const m=decodePayload(code);return m?m.scenes.join(" / "):null;}
