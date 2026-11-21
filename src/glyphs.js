
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
