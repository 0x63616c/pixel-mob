// ---------- save the reveal as a GIF or video, made entirely on this device ----------
// A hidden same-origin copy of the page (?capture=1&rec=1) renders the reveal frame by frame at story size (9:16).
function gifEncoder(w,h){
  const parts=[],pal=new Map(),cols=[],near=new Map();
  const seed=["#f4f2ee","#2d2420","#fffdf8","#ffffff","#000000",...CONF,...Object.values(THEME_CONF).flat(),...BG_COLORS,...MOB_COLORS];
  const add=n=>{if(!pal.has(n)&&cols.length<256){pal.set(n,cols.length);cols.push(n);}};
  seed.forEach(h=>add(parseInt(h.slice(1),16)));
  const index=n=>{let i=pal.get(n);if(i!==undefined)return i;if(cols.length<256){add(n);return cols.length-1;}
    i=near.get(n);if(i!==undefined)return i;let bd=1e9;const r=n>>16,g=n>>8&255,b=n&255;
    for(let j=0;j<cols.length;j++){const c=cols[j],d=(r-(c>>16))**2*2+(g-(c>>8&255))**2*4+(b-(c&255))**2*3;if(d<bd){bd=d;i=j;}}
    near.set(n,i);return i;};
  const u16=v=>[v&255,v>>8&255];
  const frames=[];
  return {
    add(rgba,delayCs){const px=new Uint8Array(w*h);let last=-1,li=0;
      for(let i=0,j=0;i<px.length;i++,j+=4){const n=(rgba[j]<<16)|(rgba[j+1]<<8)|rgba[j+2];if(n!==last){last=n;li=index(n);}px[i]=li;}
      frames.push([lzw(px,8),delayCs]);},
    blob(){const p=new Uint8Array(768);cols.forEach((c,i)=>{p[i*3]=c>>16;p[i*3+1]=c>>8&255;p[i*3+2]=c&255;});
      parts.push(new Uint8Array([71,73,70,56,57,97,...u16(w),...u16(h),0xF7,0,0]),p,
        new Uint8Array([0x21,0xFF,11,...[..."NETSCAPE2.0"].map(c=>c.charCodeAt(0)),3,1,0,0,0]));
      for(const [data,d] of frames){parts.push(new Uint8Array([0x21,0xF9,4,0,...u16(d),0,0,0x2C,0,0,0,0,...u16(w),...u16(h),0,8]));
        for(let i=0;i<data.length;i+=255){const n=Math.min(255,data.length-i);const b=new Uint8Array(n+1);b[0]=n;b.set(data.subarray(i,i+n),1);parts.push(b);}
        parts.push(new Uint8Array([0]));}
      parts.push(new Uint8Array([0x3B]));return new Blob(parts,{type:"image/gif"});}
  };
}
function lzw(ix,min){
  const clear=1<<min,eoi=clear+1,out=new Uint8Array(ix.length*2+64);let o=0,cur=0,bits=0,size=min+1,next=eoi+1;const dict=new Map();
  const emit=c=>{cur|=c<<bits;bits+=size;while(bits>=8){out[o++]=cur&255;cur>>>=8;bits-=8;}};
  emit(clear);let prefix=ix[0];
  for(let i=1;i<ix.length;i++){const k=ix[i],key=(prefix<<8)|k,v=dict.get(key);
    if(v!==undefined){prefix=v;continue;}
    emit(prefix);
    if(next===4096){emit(clear);dict.clear();size=min+1;next=eoi+1;}
    else{if(next>=(1<<size))size++;dict.set(key,next++);}
    prefix=k;}
  emit(prefix);emit(eoi);if(bits>0)out[o++]=cur&255;
  return out.subarray(0,o);
}
function watermark(x,w,h,k){
  const r=rasterLines(["PIXELMOB.IO"]),pw=(r.cols+8)*k,ph=(r.rows+6)*k,px=Math.round((w-pw)/2),py=Math.round(h-ph-14*k);
  x.fillStyle="rgba(45,36,32,0.78)";x.fillRect(px+k,py,pw-2*k,ph);x.fillRect(px,py+k,pw,ph-2*k);
  x.fillStyle="#fffdf8";r.cells.forEach(([cx,cy])=>x.fillRect(px+(cx+4)*k,py+(cy+3)*k,k,k));
}
async function recorderFrame(dpr){
  const f=document.createElement("iframe");
  f.src=`/${CODE}?capture=1&rec=1&dpr=${dpr}`;f.title="Recording";f.tabIndex=-1;f.setAttribute("aria-hidden","true");
  f.style.cssText="position:fixed;left:-10000px;top:0;width:360px;height:640px;border:0;opacity:0;pointer-events:none";
  document.body.appendChild(f);
  const t0=Date.now();
  while(!(f.contentWindow&&f.contentWindow.__crowd&&f.contentWindow.__crowd.count)){if(Date.now()-t0>8000){f.remove();throw new Error("timeout");}await new Promise(r=>setTimeout(r,60));}
  return f;
}
let capturing=false;
async function saveMob(fmt,onProgress){
  if(capturing||!CODE)return;capturing=true;
  const isGif=fmt==="gif",dpr=isGif?1:1.5,w=360*dpr,h=640*dpr,k=Math.max(1,Math.round(1.5*dpr));
  let f;
  try{
    f=await recorderFrame(dpr);
    const C=f.contentWindow.__crowd,src=f.contentWindow.document.getElementById("c");
    const out=document.createElement("canvas");out.width=w;out.height=h;const x=out.getContext("2d",{willReadFrequently:isGif});x.imageSmoothingEnabled=false;
    const draw=()=>{x.drawImage(src,0,0,w,h);watermark(x,w,h,k);};
    const MAX=26000;let t=0,tail=-1;
    let blob,ext;
    if(isGif){
      const enc=gifEncoder(w,h),dtMs=80;
      while(t<MAX){C.step(dtMs);t+=dtMs;draw();enc.add(x.getImageData(0,0,w,h).data,dtMs/10);
        if(tail<0&&C.done)tail=t+1600;if(tail>0&&t>=tail)break;
        onProgress(Math.min(0.97,t/(C.estimate||9000)));if((t/dtMs)%3===0)await new Promise(r=>setTimeout(r,0));}
      blob=enc.blob();ext="gif";
    }else{
      const types=["video/mp4;codecs=avc1.42E01E","video/mp4","video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"];
      const mime=window.MediaRecorder&&types.find(m=>MediaRecorder.isTypeSupported(m));
      if(!mime||!out.captureStream)throw new Error("novideo");
      const stream=out.captureStream(30),rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5e6}),chunks=[];
      rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
      const stopped=new Promise(r=>{rec.onstop=r;});
      draw();rec.start(250);
      await new Promise(res=>{let last=performance.now();
        const tick=n=>{const dt=Math.min(100,n-last);last=n;C.step(dt);t+=dt;draw();onProgress(Math.min(0.97,t/(C.estimate||9000)));
          if(tail<0&&C.done)tail=t+1600;if((tail>0&&t>=tail)||t>MAX){res();return;}requestAnimationFrame(tick);};
        requestAnimationFrame(tick);});
      rec.stop();await stopped;stream.getTracks().forEach(s=>s.stop());
      ext=mime.includes("mp4")?"mp4":"webm";blob=new Blob(chunks,{type:mime.split(";")[0]});
    }
    onProgress(1);
    await deliver(blob,`pixelmob-${CODE.slice(0,8)}.${ext}`);
    track("download",ext);
    return ext;
  }finally{capturing=false;if(f)f.remove();}
}
async function deliver(blob,name){
  const file=new File([blob],name,{type:blob.type});
  if(matchMedia("(pointer:coarse)").matches&&navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:"Pixel Mob"});return;}catch(e){if(e&&e.name==="AbortError")return;}}
  const a=document.createElement("a"),u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),30000);
}
