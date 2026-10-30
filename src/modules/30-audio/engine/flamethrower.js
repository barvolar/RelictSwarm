function flameTransient(id,volume){
 if(!audio||!audioBuffers[id]||audio.state!=='running')return;
 try{
  const src=audio.createBufferSource(),gain=audio.createGain();
  src.buffer=audioBuffers[id];gain.gain.value=volume;
  src.connect(gain);gain.connect(sfxBus);
  src.onended=()=>{try{src.disconnect();gain.disconnect()}catch{}};
  src.start();
 }catch(e){console.warn('[Flame transient]',e)}
}
function stopFlameStream(withTail=true){
 const running=flameStream;flameStream=null;
 if(!running||!audio)return;
 const t=audio.currentTime;
 try{
  const vol=running.gain.gain;
  vol.cancelScheduledValues(t);vol.setValueAtTime(vol.value,t);
  vol.linearRampToValueAtTime(0,t+.23);
  running.src.stop(t+.27);
 }catch(e){console.warn('[Flame stop]',e)}
 if(withTail&&audioSettings.on&&!document.hidden&&mode==='playing')flameTransient('flame_stop',.055);
}
function flameShot(){
 if(!audioSettings.on||document.hidden)return;
 flameLastShot=performance.now()/1000;
 if(!audio||audio.state!=='running'||!audioBuffers.flame_loop){unlockAudio();return;}
 if(flameStream)return;
 try{
  const t=audio.currentTime,src=audio.createBufferSource(),gain=audio.createGain();
  src.buffer=audioBuffers.flame_loop;src.loop=true;
  gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.36,t+.32);
  src.connect(gain);gain.connect(sfxBus);flameStream={src,gain};
  src.onended=()=>{if(flameStream?.src===src)flameStream=null;try{src.disconnect();gain.disconnect()}catch{}};
  src.start(t+.045);flameTransient('flame_start',.12);
 }catch(e){console.warn('[Flame start]',e)}
}
function flameHasVictim(){
 if(!S||!S.drones||!S.enemy)return false;
 for(let i=0;i<S.drones.length;i++){
  const d=S.drones[i];if(d.id!=='flame')continue;
  const p=getDronePos(d,i),reach=205+24*Math.sqrt(wm(d,'range'));
  const e=closest(p.x,p.y,reach+100);
  if(!e)continue;
  const muzzle=weaponMuzzle(p,e,0,20);
  if(Math.hypot(e.x-muzzle.x,e.y-muzzle.y)<=reach+e.r)return true;
 }
 return false;
}
function maintainFlameStream(){
 const t=performance.now()/1000;
 if(mode==='menu'&&t<flamePreviewUntil){flameLastShot=t;if(!flameStream)flameShot();}
 if(!flameStream)return;
 const allowed=(mode==='playing'||(mode==='menu'&&t<flamePreviewUntil));
 if(mode==='playing'&&!flameHasVictim()){
  // A dead/out-of-range target cuts the jet immediately; the existing gain ramp fades audio.
  stopFlameStream(true);return;
 }
 if(!audioSettings.on||document.hidden||!allowed||t-flameLastShot>.70)stopFlameStream(true);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopFlameStream(false)});
