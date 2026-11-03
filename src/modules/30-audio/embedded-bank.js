// All sound is rendered locally with Web Audio. No sampled/encoded third-party recordings.
// These are deterministic, original synthesis presets, not redistributed sound assets.
const RELICT_SOUND_DEFS=Object.freeze({
 laser:[.18,1150,190,'zap'],laserHit:[.11,850,130,'impact'],
 arc:[.24,1050,220,'electric'],rail:[.44,150,42,'rail'],
 railCharge:[.65,90,1100,'charge'],rocket:[.38,190,55,'whoosh'],
 plasma:[.30,620,160,'plasma'],cryo:[.34,1400,450,'ice'],
 flame:[.24,220,90,'flame'],flame_start:[.28,220,70,'flame'],
 flame_stop:[.22,210,55,'flame'],flame_loop:[1.0,180,180,'flame-loop'],
 gravity:[.52,160,35,'gravity'],gravityCollapse:[.65,95,25,'impact'],
 mine:[.20,700,150,'metal'],boomer:[.24,550,210,'whoosh'],
 boomerReturn:[.20,320,780,'whoosh'],saw:[.25,140,110,'saw'],
 sawHit:[.22,170,70,'metal'],explosion:[.60,105,28,'boom'],
 heavyExplosion:[.90,85,22,'boom'],heavyExplosionDeep:[1.0,62,18,'boom'],
 hit:[.10,280,90,'impact'],kill:[.24,600,920,'chime'],
 damage:[.36,185,60,'impact'],fusion:[.90,440,880,'chime'],
 bossDown:[1.25,320,640,'chime'],warning:[.54,740,540,'warning'],
 ui:[.075,650,850,'chime'],sawLoop:[1.0,125,125,'saw-loop'],
 rocketEngineLoop:[1.0,92,92,'motor-loop'],
 plasmaFieldLoop:[1.0,190,190,'plasma-loop'],
 cryoLoop:[1.0,550,550,'ice-loop'],
 gravityLoop:[1.0,55,55,'gravity-loop'],
 boomerLoop:[1.0,320,320,'motor-loop'],
 burnLoop:[1.0,110,110,'flame-loop']
});
function relictBuffer(ctx,seconds,channels=1){
 return ctx.createBuffer(channels,Math.max(256,Math.round(ctx.sampleRate*seconds)),ctx.sampleRate);
}
function relictSfxBuffer(ctx,id,def){
 const [duration,start,end,kind]=def;
 const buffer=relictBuffer(ctx,duration),data=buffer.getChannelData(0),n=data.length,sr=ctx.sampleRate;
 let seed=(0x9e3779b9^id.split('').reduce((v,c)=>Math.imul(v,31)+c.charCodeAt(0)|0,0))>>>0;
 let low=0;
 const looping=kind.endsWith('-loop');
 for(let i=0;i<n;i++){
  const t=i/sr,p=i/(n-1);
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const noise=seed/2147483648-1;
  low=low*.86+noise*.14;
  const high=noise-low;
  const freq=start+(end-start)*p;
  const phase=2*Math.PI*(start*t+(end-start)*t*p*.5);
  const sine=Math.sin(phase),sub=Math.sin(phase*.5),harm=Math.sin(phase*2.01);
  const edge=Math.min(1,t*220,(duration-t)*180);
  const envelope=looping?Math.min(1,t*90,(duration-t)*90):
   Math.min(1,t*210)*Math.exp(-p*(kind==='boom'?4:kind==='chime'?2.4:kind==='charge'?.8:kind==='warning'?1.3:3.7));
  let sample=0;
  switch(kind){
   case 'zap':sample=.72*sine+.23*harm+.12*high;break;
   case 'electric':sample=.4*sine+.35*harm+.32*high*(Math.sin(t*1100)>0?1:.15);break;
   case 'rail':sample=.58*sub+.23*sine+.4*high*Math.exp(-p*8);break;
   case 'charge':sample=.48*sine+.20*harm+.16*high*p;break;
   case 'impact':sample=.32*sub+.62*high+.16*sine;break;
   case 'boom':sample=.55*sub+.56*low+.27*high;break;
   case 'whoosh':sample=.58*low+.22*high+.13*sine;break;
   case 'plasma':sample=.45*sine+.22*harm+.23*low;break;
   case 'ice':sample=.35*sine+.30*high+.13*harm;break;
   case 'flame':sample=.70*low+.27*high;break;
   case 'metal':sample=.52*harm+.24*sine+.28*high;break;
   case 'saw':sample=.57*(2/Math.PI)*Math.atan(7*sine)+.28*high;break;
   case 'gravity':sample=.67*sub+.13*sine+.19*low;break;
   case 'chime':sample=.64*sine+.21*Math.sin(phase*1.5)+.18*harm;break;
   case 'warning':sample=.55*sine*(Math.sin(t*16)>-.15?1:.12);break;
   case 'saw-loop':sample=.46*(2/Math.PI)*Math.atan(8*sine)+.20*high;break;
   case 'motor-loop':sample=.32*sine+.39*low+.12*high;break;
   case 'plasma-loop':sample=.29*sine+.11*harm+.15*low;break;
   case 'ice-loop':sample=.19*sine+.24*high+.13*low;break;
   case 'gravity-loop':sample=.38*sub+.13*sine+.09*low;break;
   case 'flame-loop':sample=.48*low+.25*high;break;
   default:sample=.5*sine+.2*high;
  }
  data[i]=Math.tanh(sample*1.35)*Math.max(0,envelope)*Math.max(0,edge);
 }
 return buffer;
}
function buildRelictProceduralSfxBank(ctx){
 const bank=Object.create(null);
 for(const [id,preset] of Object.entries(RELICT_SOUND_DEFS))bank[id]=relictSfxBuffer(ctx,id,preset);
 return bank;
}
function relictNoteHz(note){return 440*Math.pow(2,(note-69)/12)}
// Two original atmospheric themes. Each is an eight-second seamless repeating buffer.
function relictMusicBuffer(ctx,combat){
 const duration=8,buf=relictBuffer(ctx,duration,2),left=buf.getChannelData(0),right=buf.getChannelData(1);
 const chords=combat?[[45,52,57],[41,48,53],[43,50,55],[40,47,52]]:
                     [[45,52,57],[43,50,55],[41,48,53],[43,50,55]];
 const sr=ctx.sampleRate,n=left.length,TAU=Math.PI*2;
 const bassNotes=combat?[33,29,31,28]:[33,31,29,31];
 const arps=combat?[0,1,2,1,2,1,0,1]:[0,2,1,2,0,1,2,1];
 let seed=combat?0x711f9e23:0x12a4f853,noiseLow=0;
 for(let i=0;i<n;i++){
  const t=i/sr,bar=Math.min(3,Math.floor(t/2)),barTime=t%2;
  const chord=chords[bar],padFade=Math.min(1,barTime*3,(2-barTime)*3);
  let padL=0,padR=0;
  for(let j=0;j<3;j++){
   const hz=relictNoteHz(chord[j]);
   padL+=(Math.sin(TAU*hz*t)+.23*Math.sin(TAU*hz*2*t))*.10;
   padR+=(Math.sin(TAU*(hz*1.003)*t+.6)+.21*Math.sin(TAU*hz*2*t+.4))*.10;
  }
  const bassHz=relictNoteHz(bassNotes[bar]),bass=Math.sin(TAU*bassHz*t)*.23;
  const eighth=Math.floor(t*4),arpNote=chord[arps[eighth%8]]+12;
  const stepT=(t*4)%1,arpEnv=Math.exp(-stepT*(combat?3.6:5));
  const arp=.09*Math.sin(TAU*relictNoteHz(arpNote)*t)*arpEnv;
  let beat=0;
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const noise=seed/2147483648-1;noiseLow=noiseLow*.92+noise*.08;
  const beatT=t%.5;
  if(combat){
   const kick=Math.sin(TAU*(55*beatT+140*beatT*beatT))*Math.exp(-beatT*22)*.30;
   const snareT=(t+.5)%1;
   const snare=(noise-noiseLow)*Math.exp(-snareT*22)*.11;
   const hat=(noise-noiseLow)*Math.exp(-stepT*28)*.06;
   beat=kick+snare+hat;
  }else{
   const tick=(noise-noiseLow)*Math.exp(-stepT*24)*.016;
   beat=tick;
  }
  // Endpoint ramp prevents clicks while leaving the body of the loop continuous.
  const edge=Math.min(1,t*30,(duration-t)*30);
  const body=(padL*padFade+bass+arp+beat)*edge;
  left[i]=Math.tanh(body*1.1);
  right[i]=Math.tanh((padR*padFade+bass+arp*.85+beat)*edge*1.1);
 }
 return buf;
}
function buildRelictProceduralMusicBank(ctx){
 return {menu_theme:relictMusicBuffer(ctx,false),combat_theme:relictMusicBuffer(ctx,true)};
}
