// ---------- sound: tiny WebAudio synth, no files. Silent until the first tap, remembers mute ----------
const SND={ctx:null,on:false,muted:false,master:null,noise:null,lastStep:0,userAt:-99};
try{SND.muted=localStorage.getItem("pm_mute")==="1";}catch(_){}
function unlockAudio(){
  if(SND.ctx||CAPTURE||OG)return;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  try{const c=new AC(),m=c.createGain();m.gain.value=SND.muted?0:0.55;m.connect(c.destination);
    const len=c.sampleRate*0.5,b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
    SND.ctx=c;SND.master=m;SND.noise=b;SND.on=true;if(c.state==="suspended")c.resume();}catch(_){}
}
function setMuted(v){SND.muted=v;try{localStorage.setItem("pm_mute",v?"1":"0");}catch(_){}
  if(SND.master)SND.master.gain.setTargetAtTime(v?0:0.55,SND.ctx.currentTime,0.03);}
function tone(type,f0,f1,t0,dur,vol){const c=SND.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;
  o.frequency.setValueAtTime(f0,t0);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t0+dur);
  g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(vol,t0+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  o.connect(g);g.connect(SND.master);o.start(t0);o.stop(t0+dur+0.02);}
function hiss(t0,dur,vol,freq,q){const c=SND.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  s.buffer=SND.noise;f.type="bandpass";f.frequency.value=freq;f.Q.value=q||1;
  g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(vol,t0+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  s.connect(f);f.connect(g);g.connect(SND.master);s.start(t0,Math.random()*0.3);s.stop(t0+dur+0.02);}
const audible=()=>SND.on&&!SND.muted&&!(APP==="home"&&!panelOpen&&now-SND.userAt>10);
function sfx(name){
  if(!audible())return;const t=SND.ctx.currentTime+0.01;
  const N=(n,i,d,v,ty)=>tone(ty||"square",440*Math.pow(2,(n-69)/12),0,t+i,d,v||0.08);
  if(name==="shout"){N(67,0,0.09);N(72,0.09,0.09);N(79,0.18,0.22,0.1);hiss(t,0.25,0.05,1800,2);}
  else if(name==="chime"){N(72,0,0.12,0.06,"triangle");N(76,0.08,0.12,0.06,"triangle");N(79,0.16,0.3,0.07,"triangle");}
  else if(name==="cheer"){[72,76,79,84].forEach((n,i)=>N(n,i*0.07,0.18,0.06,"triangle"));
    hiss(t+0.05,0.9,0.12,1400,0.7);for(let i=0;i<9;i++)tone("square",500+Math.random()*700,900+Math.random()*900,t+0.1+Math.random()*0.6,0.09,0.025);}
  else if(name==="scatter"){hiss(t,0.35,0.06,700,0.8);tone("square",520,180,t,0.18,0.04);}
  else if(name==="pop"){tone("square",660,1320,t,0.08,0.07);}
  else if(name==="love"){N(76,0,0.16,0.07,"triangle");N(84,0.14,0.32,0.07,"triangle");}
  else if(name==="haha"){for(let i=0;i<5;i++)tone("square",880-i*60,700-i*60,t+i*0.09,0.06,0.05);}
  else if(name==="wow"){tone("triangle",300,900,t,0.35,0.08);hiss(t+0.1,0.4,0.05,1600,1);}
  else if(name==="yay"){for(let i=0;i<8;i++)hiss(t+i*0.075+Math.random()*0.02,0.05,0.18,2200,1.5);N(79,0.6,0.25,0.06,"triangle");}
}
// footsteps: a soft tick per few running feet, capped so a big mob is a patter, not a roar
function steps(movers,dt){if(!audible())return;SND.lastStep-=dt;if(SND.lastStep>0)return;
  SND.lastStep=clamp(0.42/Math.sqrt(movers),0.055,0.35);
  hiss(SND.ctx.currentTime+0.005,0.035,clamp(0.02+movers*0.0006,0.02,0.07),900+Math.random()*700,1.2);}
