const maintainedLoops=new Map();let cryoAudibleUntil=-100, lastRailCharge=-100, lastLaserImpact=-100;
const loopVolumes={sawLoop:.24,rocketEngineLoop:.115,plasmaFieldLoop:.038,cryoLoop:.22,gravityLoop:.20,boomerLoop:.09,burnLoop:.15};
function setAudibleLoop(id,needed){
 if(!audio||audio.state!=='running'||!audioBuffers[id])return;
 let o=maintainedLoops.get(id);const t=audio.currentTime,target=needed&&audioSettings.on&&!document.hidden&&mode==='playing'?(loopVolumes[id]||.12):0;
 if(!o){if(!target)return;try{
  let src=audio.createBufferSource(),gain=audio.createGain();src.buffer=audioBuffers[id];src.loop=true;
  gain.gain.value=0;src.connect(gain);gain.connect(sfxBus);src.start();
  o={src,gain,target:-1};maintainedLoops.set(id,o);
 }catch(e){console.warn('[SFX loop]',e);return}}
 if(o.target===target)return;o.target=target;let g=o.gain.gain;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(target,t+.20);
}
function silenceMaintainedLoops(){for(const id of maintainedLoops.keys())setAudibleLoop(id,false)}
function updateMaintainedLoops(){
 if(!S||mode!=='playing'||!audioSettings.on||document.hidden){silenceMaintainedLoops();return;}
 const near=(x,y,r)=>S.enemy.some(e=>e.hp>0&&Math.hypot(e.x-x,e.y-y)<r+e.r);
 const saw=S.drones.some((d,i)=>['saw','fusion_thermal','fusion_tesla','fusion_frostblade','fusion_magnetblade'].includes(d.id)&&near(S.player.x,S.player.y,250+26*Math.sqrt(wm(d,'radius'))));
 const boomer=S.bullets.some(b=>b.type==='boomer'&&b.life>0);
 const rocket=S.bullets.some(b=>b.type==='rocket'&&b.life>0);
 const plasma=S.effects.some(e=>e.life>0&&!e.thermalTrail&&(e.col==='#7baeff'||e.col==='#84bff4'||e.col===BLUE));
 const gravity=S.gravityWells.some(g=>g.life>0);
 const burn=S.enemy.some(e=>e.hp>0&&e.burn>.15);
 for(const [id,live] of Object.entries({sawLoop:saw,boomerLoop:boomer,rocketEngineLoop:rocket,plasmaFieldLoop:plasma,gravityLoop:gravity,cryoLoop:performance.now()/1000<cryoAudibleUntil&&S.enemy.some(e=>e.hp>0),burnLoop:burn}))setAudibleLoop(id,live);
}

function updateSoundtrack(){updateMaintainedLoops();maintainFlameStream();if(audio&&audio.state==='running'&&desiredMusic()!==currentMusic)syncMusic()}

// v0.9.3: gapless Web Audio flame stream. This is NOT a repeating sound per hit.
// Loop is a PCM WAV asset from the user-approved flamethrower sample.
