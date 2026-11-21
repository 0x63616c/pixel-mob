// ---------- pixel text (our own 5x7 font, crisp at any DPR) ----------
function pixelText(el,str,scale,color){
  const lines=str.split("\n"),rs=lines.map(l=>rasterLines([l]));
  const w=Math.max(...rs.map(r=>r.cols)),h=lines.length*9-2;
  const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.fillStyle=color;
  rs.forEach((r,li)=>{const off=Math.floor((w-r.cols)/2);r.cells.forEach(([cx,cy])=>x.fillRect(cx+off,cy+li*9,1,1));});
  c.style.width=w*scale+"px";c.style.height=h*scale+"px";c.setAttribute("aria-hidden","true");
  el.replaceChildren(c);
}
// fits pixel text to the screen width (never bigger than maxScale)
function pixelFit(el,str,maxScale,color,room){const cols=Math.max(...str.split("\n").map(l=>rasterLines([l]).cols));
  pixelText(el,str,clamp(Math.floor((room||innerWidth-72)/cols),2,maxScale),color);}
// ---------- UI ----------
const panel=$("panel"),msg=$("msg"),noteEl=$("note"),linkEl=$("link"),copyBtn=$("copyBtn"),shareBtn=$("shareBtn"),prevBtn=$("prevBtn");
const fromEl=$("from"),atEl=$("at"),scenesEl=$("scenes"),addBtn=$("addScene");
const NOTE_DEFAULT=noteEl.textContent;
let curLink="",typeT=0,noteT=0,lastFocus=null,focusIn=msg,tplOn=-1;
const ORIGIN=/(^|\.)pixelmob\.io$/.test(location.hostname)?"https://pixelmob.io":(location.origin&&location.origin!=="null"?location.origin:"https://pixelmob.io");
// anonymous usage counts: an event name and an optional fixed detail (never the message, name or code); the server adds the country
function track(e,d){if(CAPTURE||OG||!navigator.sendBeacon)return;try{navigator.sendBeacon("/api/event",JSON.stringify(d?{e,p:APP,d}:{e,p:APP}));}catch(_){}}
const draft={from:"",theme:THEME,mob:MOBC,bg:BGC,size:SIZE,at:0};
const sceneEls=()=>[...scenesEl.querySelectorAll(".msg")];
const draftMsg=()=>Object.assign({},draft,{scenes:sceneEls().map(x=>cleanText(x.value)).filter(Boolean)});
const createdFor=new Set();
function trackCreated(){const k=curLink;if(!k||createdFor.has(k))return;createdFor.add(k);track("created");}
function toast(t){const el=$("toast");el.textContent=t;el.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("on"),2100);}
function setNote(t,warn){noteEl.textContent=t;noteEl.classList.toggle("warn",!!warn);clearTimeout(noteT);
  if(warn)noteT=setTimeout(()=>{noteEl.textContent=NOTE_DEFAULT;noteEl.classList.remove("warn");},3400);}
function updateLink(){
  const m=draftMsg(),has=m.scenes.length>0;
  copyBtn.disabled=!has;shareBtn.disabled=!has;prevBtn.setAttribute("aria-disabled",String(!has));
  addBtn.disabled=sceneEls().length>=MAX_SCENES;
  if(!has){curLink="";linkEl.textContent="Type something to get your link";linkEl.classList.add("empty");prevBtn.removeAttribute("href");return;}
  curLink=ORIGIN+"/"+encodePayload(m);
  linkEl.textContent=curLink.replace(/^https?:\/\//,"");linkEl.classList.remove("empty");prevBtn.href=curLink;
  summarize();
}
function summarize(){const b=[];if(draft.theme!=="default")b.push(draft.theme[0].toUpperCase()+draft.theme.slice(1));
  if(draft.from)b.push("From "+draft.from);if(draft.mob>=0||draft.bg>=0)b.push("Colours");if(draft.size!=="medium")b.push(draft.size[0].toUpperCase()+draft.size.slice(1));
  if(draft.at)b.push("Countdown");$("moreSum").textContent=b.join(" · ");}
function bump(el){el.classList.add("bump");setTimeout(()=>el.classList.remove("bump"),300);}
function onInput(e){
  if(e&&e.isComposing)return;
  const el=e&&e.target&&e.target.classList&&e.target.classList.contains("msg")?e.target:msg;
  const raw=el.value,{text:t,dropped}=sanitize(raw),cnt=el.parentNode.querySelector(".count");
  let tok=[...t.replace(/^ +/,"")];
  if(tok.length>MAXLEN){tok=tok.slice(0,MAXLEN);setNote(`That's the limit: ${MAXLEN} characters a scene`,true);bump(cnt);}
  const others=sceneEls().filter(x=>x!==el).reduce((n,x)=>n+[...cleanText(x.value)].length,0);
  if(tok.length+others>MAX_TOTAL){tok=tok.slice(0,Math.max(0,MAX_TOTAL-others));setNote(`That's the limit: ${MAX_TOTAL} characters across all scenes`,true);bump(cnt);}
  const v=toDisplay(tok.join(""));
  if(v!==raw){const atEnd=(el.selectionStart||0)>=raw.length;const pos=Math.min(v.length,el.selectionStart||0);el.value=v;
    try{el.setSelectionRange(atEnd?v.length:pos,atEnd?v.length:pos);}catch(_){}}
  if(dropped.length)setNote(`The mob can't make ${dropped.slice(0,3).join(" ")} yet, so they skipped it. Try ❤️ 🎂 ⭐ 🎉`,true);
  const n=[...cleanText(v)].length;cnt.textContent=`${n}/${MAXLEN}`;cnt.classList.toggle("near",n>=MAXLEN-4);
  if(!dropped.length&&!noteEl.classList.contains("warn"))noteEl.textContent=n>18?"Tip: shorter scenes mean bigger little people":NOTE_DEFAULT;
  if(e&&e.isTrusted)tplOn=-1,markTpl();
  updateLink();
  clearTimeout(typeT);typeT=setTimeout(()=>applyTyped(el),RM?150:380);
}
function applyTyped(el){
  updateLink();
  const t=cleanText((el||msg).value);
  if(!t){if(!draftMsg().scenes.length&&mode!=="wander")scatter(true);return;}
  seq=null;nextText=null;
  if(t===text&&(mode==="hold"||mode==="form"))return;
  text=t;computeLayout();syncCount();form({assemble:true,celebrate:"mini"});
}
function addScene(val,focus){
  const els=sceneEls();if(els.length>=MAX_SCENES)return null;
  const d=document.createElement("div");d.className="scene";const i=els.length,uid=++addScene.n;
  d.innerHTML=`<label class="sr" for="msg_${uid}">Scene ${i+1}</label><div class="field"><span class="sn" aria-hidden="true">${i+1}</span><input id="msg_${uid}" class="msg" type="text" maxlength="140" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" enterkeyhint="done" placeholder="${["","AND THEN…","ONE MORE…","THE BIG FINISH"][i]}"><span class="count">0/${MAXLEN}</span><button class="rm" type="button" aria-label="Remove scene ${i+1}">✕</button></div>`;
  scenesEl.appendChild(d);const inp=d.querySelector("input");wireScene(inp);
  d.querySelector(".rm").addEventListener("click",()=>{d.remove();renumber();updateLink();focusIn=msg;const m=draftMsg();if(m.scenes.length>1)playSeq(m.scenes);else applyTyped(msg);});
  if(val){inp.value=val;onInput({target:inp});}
  if(focus)inp.focus({preventScroll:true});
  updateLink();return inp;
}
addScene.n=0;
function renumber(){scenesEl.querySelectorAll(".scene").forEach((d,i)=>{d.querySelector(".sn").textContent=i+1;});}
function wireScene(inp){inp.addEventListener("input",onInput);inp.addEventListener("compositionend",onInput);
  inp.addEventListener("focus",()=>{focusIn=inp;const t=cleanText(inp.value);if(t&&t!==text)applyTyped(inp);});
  inp.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();clearTimeout(typeT);const m=draftMsg();
    if(m.scenes.length>1)playSeq(m.scenes);else applyTyped(inp);if(curLink)copyLink();}});}
// ---------- templates, drawings and options ----------
const TPLS=[
  {k:"🎂 Birthday",scenes:["HAPPY BIRTHDAY!","🎂🎉"],theme:"birthday"},
  {k:"💌 Ask them out",scenes:["WILL YOU GO OUT WITH ME?","❤️"],bg:3},
  {k:"🏆 Congrats",scenes:["CONGRATS!","🏆"],theme:"stadium"},
  {k:"🥺 Miss you",scenes:["MISS YOU","❤️"],bg:2},
  {k:"🙏 Thank you",scenes:["THANK YOU!","⭐"]},
  {k:"💍 Marry me",scenes:["MARRY ME?","💍"],theme:"wedding"},
  {k:"🎄 Merry Xmas",scenes:["MERRY XMAS!","🎄"],theme:"christmas"},
  {k:"🎃 Boo",scenes:["BOO!","👻🎃"],theme:"halloween"},
  {k:"🍀 Good luck",scenes:["GOOD LUCK!","⭐"]},
  {k:"🌸 Get well",scenes:["GET WELL SOON","🌸"]},
  {k:"⚽ GG",scenes:["GG!","⚽🔥"],theme:"stadium"},
];
const EMOJI_BAR=["❤️","🎂","🎉","⭐","😊","👍","💍","🎁","🔥","🌸","🎄","🎃","👻","👑","🏆","⚽","🎵","☀️","🌙","❄️"];
const THEME_UI=[["default","Classic"],["birthday","🎂 Birthday"],["christmas","🎄 Xmas"],["halloween","🎃 Halloween"],["wedding","💍 Wedding"],["stadium","🏟️ Stadium"]];
const SIZE_UI=[["small","Small"],["medium","Medium"],["huge","Huge"]];
function markTpl(){$("tpls").querySelectorAll("button").forEach((b,i)=>b.setAttribute("aria-pressed",String(i===tplOn)));}
function setScenes(list){sceneEls().slice(1).forEach(x=>x.closest(".scene").remove());msg.value="";onInput({target:msg});
  list.forEach((t,i)=>{if(i===0){msg.value=t;onInput({target:msg});}else addScene(t);});}
function useTemplate(i){const t=TPLS[i];tplOn=i;markTpl();
  setLook({theme:t.theme||"default",bg:t.bg!==undefined?t.bg:-1,mob:-1},true);
  setScenes(t.scenes);clearTimeout(typeT);updateLink();
  const m=draftMsg();if(m.scenes.length>1)playSeq(m.scenes);else applyTyped(msg);}
function seg(el,items,get,set){el.replaceChildren(...items.map(([v,l])=>{const b=document.createElement("button");b.type="button";b.setAttribute("role","radio");b.textContent=l;b.dataset.v=v;
  b.addEventListener("click",()=>{set(v);mark();});return b;}));const mark=()=>el.querySelectorAll("button").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.v===String(get()))));mark();return mark;}
function swatches(el,list,get,set,label){const items=[[-1,"Auto"],...list.map((c,i)=>[i,c])];
  el.replaceChildren(...items.map(([i,c])=>{const b=document.createElement("button");b.type="button";b.setAttribute("role","radio");b.dataset.v=i;
    if(i<0){b.textContent="A";b.setAttribute("aria-label",label+": automatic");}else{b.style.background=c;b.setAttribute("aria-label",label+" colour "+(i+1));}
    b.addEventListener("click",()=>{set(i);mark();});return b;}));
  const mark=()=>el.querySelectorAll("button").forEach(b=>b.setAttribute("aria-checked",String(+b.dataset.v===get())));mark();return mark;}
let marks=[];
// live look changes for the mob behind the creator
function setLook(o,quiet){const oT=THEME,oS=SIZE;
  if(o.theme!==undefined){draft.theme=o.theme;THEME=o.theme;}
  if(o.mob!==undefined){draft.mob=o.mob;MOBC=o.mob;}
  if(o.bg!==undefined){draft.bg=o.bg;BGC=o.bg;}
  if(o.size!==undefined){draft.size=o.size;SIZE=o.size;}
  restyle();marks.forEach(m=>m());updateLink();
  if(!quiet&&(THEME!==oT||SIZE!==oS)){computeLayout();syncCount();if(mode==="form"||mode==="hold")form({dramatic:false,celebrate:"mini"});}
  else if(!quiet&&mode==="hold")ripple("hop");}
function buildCreator(){
  $("tpls").replaceChildren(...TPLS.map((t,i)=>{const b=document.createElement("button");b.type="button";b.textContent=t.k;b.setAttribute("aria-pressed","false");b.addEventListener("click",()=>useTemplate(i));return b;}));
  $("emojis").replaceChildren(...EMOJI_BAR.map(e=>{const b=document.createElement("button");b.type="button";b.textContent=e;b.setAttribute("aria-label","Add "+DRAW[DRAW_EMOJI.get(e).charCodeAt(0)-0xE000][0]);
    b.addEventListener("pointerdown",ev=>ev.preventDefault());
    b.addEventListener("click",()=>{const el=focusIn&&focusIn.isConnected?focusIn:msg;const st=el.selectionStart??el.value.length,en=el.selectionEnd??st;
      el.setRangeText(e,st,en,"end");onInput({target:el});if(!matchMedia("(pointer:coarse)").matches)el.focus({preventScroll:true});});return b;}));
  marks=[seg($("themes"),THEME_UI,()=>draft.theme,v=>setLook({theme:v})),
    swatches($("mobSw"),MOB_COLORS,()=>draft.mob,v=>setLook({mob:v}),"Mob"),
    swatches($("bgSw"),BG_COLORS,()=>draft.bg,v=>setLook({bg:v}),"Background"),
    seg($("sizes"),SIZE_UI,()=>draft.size,v=>setLook({size:v}))];
  wireScene(msg);
  addBtn.addEventListener("click",()=>{addScene("",true);});
  fromEl.addEventListener("input",()=>{const t=[...cleanText(fromEl.value)].filter(c=>!DRAW_INFO(c)).slice(0,MAX_FROM).join("");draft.from=t.trim();
    const v=toDisplay(t);if(fromEl.value.toUpperCase()!==v)fromEl.value=v;updateLink();});
  atEl.min=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
  atEl.addEventListener("change",()=>{const v=atEl.value?new Date(atEl.value).getTime():0;
    if(v&&v<Date.now()+60000){setNote("Pick a time in the future for the countdown",true);atEl.value="";draft.at=0;}else draft.at=v||0;
    $("atClear").hidden=!draft.at;updateLink();if(draft.at)toast("Countdown set. They can open it "+fmtWhen(draft.at));});
  $("atClear").addEventListener("click",()=>{atEl.value="";draft.at=0;$("atClear").hidden=true;updateLink();});
}
const fmtWhen=t=>new Date(t).toLocaleString(undefined,{weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"});
const homeLook={theme:THEME,mob:MOBC,bg:BGC,size:SIZE};
function openPanel(prefill){
  if(panelOpen)return;lastFocus=document.activeElement;panelOpen=true;
  root.classList.add("panel-open");panel.setAttribute("aria-hidden","false");panel.inert=false;
  lost.classList.remove("on");replayIn=-1;seq=null;nextText=null;
  if(prefill){setLook(prefill.look||{theme:"default",mob:-1,bg:-1,size:"medium"},true);setScenes(prefill.scenes);}
  else setLook({theme:draft.theme,mob:draft.mob,bg:draft.bg,size:draft.size},true);
  if(APP==="home"&&!CAPTURE&&PATH!=="/new")try{history.replaceState(null,"","/new");}catch(_){}
  if(APP==="home")scrollTo({top:0,behavior:RM?"auto":"smooth"});
  requestAnimationFrame(()=>{relayout();if(prefill)applyTyped(msg);});
  setTimeout(()=>{if(!matchMedia("(pointer:coarse)").matches||panel.dataset.autofocus)msg.focus({preventScroll:true});},60);
  updateLink();
}
function closePanel(){
  if(!panelOpen)return;panelOpen=false;
  root.classList.remove("panel-open");panel.setAttribute("aria-hidden","true");panel.inert=true;document.activeElement&&document.activeElement.blur&&document.activeElement.blur();
  if(APP==="home"&&!CAPTURE&&location.pathname!=="/")try{history.replaceState(null,"","/");}catch(_){}
  seq=null;nextText=null;
  if(APP==="home"){THEME=homeLook.theme;MOBC=homeLook.mob;BGC=homeLook.bg;SIZE=homeLook.size;restyle();computeLayout();syncCount();if(mode!=="wander")modeT=Math.min(modeT,1.5);}
  else if(APP==="surprise"&&sPhase!=="intro"&&sPhase!=="teaser"){THEME=MSG.theme;MOBC=MSG.mob;BGC=MSG.bg;SIZE=MSG.size;restyle();
    if(MSG.scenes.length>1)seq={list:MSG.scenes.slice(),ix:MSG.scenes.length-1};
    text=MSG.scenes[MSG.scenes.length-1];computeLayout();syncCount();form({dramatic:false,celebrate:"mini"});}
  requestAnimationFrame(()=>relayout());
  if(lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true});
}
async function copyLink(){
  if(!curLink)return;let ok=false;
  try{await navigator.clipboard.writeText(curLink);ok=true;}catch(_){
    const ta=document.createElement("textarea");ta.value=curLink;ta.setAttribute("readonly","");ta.style.cssText="position:fixed;top:0;left:0;opacity:0;font-size:16px";
    document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,ta.value.length);try{ok=document.execCommand("copy");}catch(_){}ta.remove();}
  if(ok){copyBtn.classList.add("done");copyBtn.querySelector("span").textContent="Copied!";toast(draft.at?"Copied. The countdown starts now ⏳":"Copied. Your mob is ready to send 👀");trackCreated();
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
buildCreator();
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
// ---------- receiver: reactions, reply, save ----------
const REPLY={love:"AWW ❤️",haha:"HAHA 😊",wow:"WOW!",yay:"YOU'RE THE BEST ⭐"};
let reacted=null;
$("reacts").querySelectorAll("button").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();const k=b.dataset.r;
  react(k);if(reacted!==k)track("reaction",k);reacted=k;
  $("reacts").querySelectorAll("button").forEach(x=>x.classList.toggle("picked",x===b));
  $("replyBtn").hidden=false;$("makeBtn").hidden=true;}));
$("replyBtn").addEventListener("click",e=>{e.stopPropagation();track("reply");
  const name=MSG&&MSG.from,sc=[];if(name)sc.push(toDisplay(`HI ${name}!`).slice(0,MAXLEN));sc.push(REPLY[reacted||"love"]);
  openPanel({scenes:sc,look:{theme:MSG?MSG.theme:"default",mob:-1,bg:-1,size:"medium"}});});
const saveMenu=$("saveMenu"),saveBtn=$("saveBtn");
saveBtn.addEventListener("click",e=>{e.stopPropagation();saveMenu.hidden=!saveMenu.hidden;saveBtn.setAttribute("aria-expanded",String(!saveMenu.hidden));});
saveMenu.querySelectorAll("button").forEach(b=>b.addEventListener("click",async e=>{e.stopPropagation();if(capturing)return;
  const prog=$("saveProg");saveMenu.querySelectorAll("button").forEach(x=>x.disabled=true);prog.textContent="0%";
  toast(b.dataset.fmt==="gif"?"Making your GIF… keep this tab open":"Recording your video… about 10 seconds");
  try{const ext=await saveMob(b.dataset.fmt,f=>{prog.textContent=Math.round(f*100)+"%";});if(ext)toast(`Saved your mob as ${ext.toUpperCase()} 🎉`);}
  catch(err){toast(err&&err.message==="novideo"?"Video isn't supported in this browser. Try GIF":"Couldn't save that one. Please try again");}
  finally{prog.textContent="";saveMenu.querySelectorAll("button").forEach(x=>x.disabled=false);saveMenu.hidden=true;saveBtn.setAttribute("aria-expanded","false");}}));
if(APP==="error"){$("reacts").remove();saveBtn.remove();}
if(!(window.MediaRecorder&&HTMLCanvasElement.prototype.captureStream))saveMenu.querySelector('[data-fmt="video"]').remove();
// ---------- sound toggle ----------
const sndBtn=$("sndBtn");
function markSnd(){sndBtn.setAttribute("aria-pressed",String(SND.muted));sndBtn.setAttribute("aria-label",SND.muted?"Turn sound on":"Mute sound");sndBtn.firstChild.textContent=SND.muted?"🔇":"🔊";}
sndBtn.addEventListener("click",e=>{e.stopPropagation();unlockAudio();setMuted(!SND.muted);markSnd();if(!SND.muted)sfx("pop");});
markSnd();
addEventListener("pointerdown",()=>{unlockAudio();SND.userAt=now;},true);
addEventListener("keydown",()=>{unlockAudio();SND.userAt=now;},true);
// ---------- teaser: who it's from, and the countdown ----------
function teaserTitle(){const name=MSG&&MSG.from,narrow=innerWidth<520,el=$("teaserTitle");
  const t=name?(([...name].length<=7&&!narrow)?`${name} SENT YOU\nA PIXEL MOB`:`${name}\nSENT YOU A\nPIXEL MOB`):(narrow?"SOMEONE SENT\nYOU A MESSAGE":"SOMEONE SENT YOU\nA MESSAGE");
  pixelFit(el,t,4,INK,Math.min(innerWidth-80,560));el.setAttribute("aria-label",name?`${toDisplay(name)} sent you a Pixel Mob`:"Someone sent you a message");}
let cdLast="";
function tickCountdown(){if(!(MSG&&MSG.at)||REC)return;const left=MSG.at-Date.now(),cd=$("countdown"),btn=$("reveal");
  if(left>0){cd.hidden=false;const s=Math.ceil(left/1000),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),ss=s%60,z=n=>String(n).padStart(2,"0");
    const str=(d?d+"D ":"")+`${z(h)}:${z(m)}:${z(ss)}`;if(str!==cdLast){cdLast=str;pixelFit($("cdArt"),str,4,"#e2483d",Math.min(innerWidth-80,420));$("cdArt").setAttribute("aria-label",`Opens in ${d?d+" days ":""}${h} hours ${m} minutes`);}
    btn.disabled=true;btn.textContent="Not yet ⏳";$("teaserSub").textContent=`Your mob opens ${fmtWhen(MSG.at)}. Come back then!`;
    setTimeout(tickCountdown,250);return;}
  if(cdLast!=="done"){cdLast="done";pixelFit($("cdArt"),"IT'S TIME!",4,"#e2483d",Math.min(innerWidth-80,420));$("countdown").querySelector(".cl").textContent="READY";
    btn.disabled=false;btn.textContent="Open it 🎉";$("teaserSub").textContent="The wait is over.";people.forEach(p=>hop(p,S*rnd(1.5,3)));sfx("chime");}}
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
  const hp=hitPerson(e.clientX,e.clientY);if(hp){dance(hp);return;}
  if(mode==="wander"&&replayIn<0)form({assemble:true,celebrate:AUTO_APP?"full":"big"});
  else if(mode==="hold"){if(AUTO_APP&&!panelOpen)scatter(false);else replay();}
});
cv.addEventListener("pointerleave",()=>{ptr.t=-9;});
cv.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();if(APP==="surprise"&&sPhase!=="reveal")reveal();else if(mode==="hold")replay();else form({assemble:true,celebrate:"full"});}});
addEventListener("hashchange",()=>{if(PATH==="/"&&/^#(?:s[=\/])?[A-Za-z0-9_-]{6,180}$/.test(location.hash)&&!/^#(how|new|create|make)$/i.test(location.hash))location.reload();});
let rz;addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(()=>{resize();if(APP==="surprise")teaserTitle();},120);});
// ---------- boot ----------
const ICON_LOOK={skin:"#f0c39d",hair:"#2a1c14",shirt:"#e74c3c",pants:"#2c3e70",shoes:"#2a2320",hat:"#2f6fd6",eye:"#1b1714",
  zombie:false,style:"cap",skirt:false,beard:false,stripe:false,blush:true};
if(REC)root.classList.add("rec");
teaserTitle();tickCountdown();
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
window.__crowd={get overlaps(){return overlaps},get maxOverlaps(){return maxOverlaps},get overlapTotal(){return overlapTotal},
  get done(){return APP==="surprise"&&sPhase==="reveal"&&seqLast()&&mode==="hold"&&replayIn<0&&modeT>2.2},get estimate(){return 900+(MSG?MSG.scenes.length:1)*5600},
  get theme(){return THEME},get size(){return SIZE},get scene(){return seq?seq.ix:0},get msg(){return MSG},react,setLook,playSeq,useTemplate,addScene,save:fmt=>saveMob(fmt,()=>{}),
  people:()=>people.map(p=>({x:p.x/DPR,y:p.y/DPR,state:p.state,dance:p.dance>0})),
  stuck:()=>people.filter(p=>p.slot&&p.state!=="placed").map(p=>({id:p.id,x:Math.round(p.x),y:Math.round(p.y),tx:p.tx,ty:p.ty,st:p.state,path:(p.path||[]).map(w=>[Math.round(w.x),Math.round(w.y),w.tight|0]),v:Math.round(Math.hypot(p.vx,p.vy)),S,CH,box:[box.x,box.y,box.w,box.h]})),
  near:(id)=>{const a=people.find(p=>p.id===id);if(!a)return null;return people.filter(p=>p!==a&&Math.abs(p.x-a.x)<S*14&&Math.abs(p.y-a.y)<S*10).map(p=>({id:p.id,x:Math.round(p.x),y:Math.round(p.y),st:p.state,tx:p.tx,ty:p.ty,vx:Math.round(p.vx),vy:Math.round(p.vy)})).concat([{self:1,x:a.x,y:a.y,vx:a.vx,vy:a.vy,sx:a.sx,sy:a.sy,hurry:a.hurry,slot:a.slot&&[a.slot.x,a.slot.y,a.slot.up,a.slot.down]}]);},
  pairs:()=>{const o=[];for(const a of people)for(const b of people){if(b.id<=a.id)continue;if(Math.abs(a.x-b.x)<FX*S-S*0.25&&Math.abs(a.y-b.y)<FY*S-S*0.25)o.push([a.state,b.state,a.leaving,b.leaving,Math.round(a.x),Math.round(a.y)]);}return o;},tap:(x,y)=>{const p=hitPerson(x,y);if(p)dance(p);return !!p;},
  get mode(){return mode},get app(){return APP},get phase(){return sPhase},get text(){return text},get count(){return people.length},
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
