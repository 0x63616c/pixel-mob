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
