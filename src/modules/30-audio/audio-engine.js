const audioSettingsKey='relictSwarm_audio_v1';
function loadAudioSettings(){try{const o=JSON.parse(localStorage.getItem(audioSettingsKey)||'null');if(o&&typeof o==='object')return {on:o.on!==false,sfx:Number.isFinite(+o.sfx)?clamp(+o.sfx,0,1):.65,music:Number.isFinite(+o.music)?clamp(+o.music,0,1):.38}}catch{}return {on:true,sfx:.65,music:.38}}
const audioSettings=loadAudioSettings();
let sfxBus=null,musicBus=null,masterBus=null,audioBuffers={},audioLoaded=false,audioLoading=null,activeVoices=0,musicPlayers={},currentMusic='',lastWeaponAt=-999;
let soundPlayed=Object.create(null),musicPreviewMode=null;
let flameStream=null, flameLastShot=-9999, flamePreviewUntil=0;
mute=!audioSettings.on;
function saveAudioSettings(){try{localStorage.setItem(audioSettingsKey,JSON.stringify(audioSettings))}catch{}}
function refreshAudioControls(){
 const b=$('soundBtn'),h=$('audioHudBtn');if(b)b.textContent=audioSettings.on?'♫ Звук: вкл.':'♪ Звук: выкл.';
 if(h){h.textContent=audioSettings.on?'♫':'♪';h.title=audioSettings.on?'Выключить звук':'Включить звук';h.setAttribute('aria-label',h.title)}
 for(const [id,v] of [['sfxVolume',audioSettings.sfx],['musicVolume',audioSettings.music]]){const el=$(id);if(el){el.value=String(Math.round(v*100));const label=$(id+'Value');if(label)label.textContent=Math.round(v*100)+'%'}}
 if(sfxBus)sfxBus.gain.value=audioSettings.on?audioSettings.sfx:0;
 if(musicBus)musicBus.gain.value=audioSettings.on?audioSettings.music:0;
}
function soundToggle(){if(audioSettings.on)stopFlameStream(false);audioSettings.on=!audioSettings.on;mute=!audioSettings.on;saveAudioSettings();if(audioSettings.on)unlockAudio();refreshAudioControls();syncMusic()}
function bindAudioMixer(){refreshAudioControls();for(const [id,key] of [['sfxVolume','sfx'],['musicVolume','music']]){
 const el=$(id);if(el)el.addEventListener('input',()=>{audioSettings[key]=clamp(Number(el.value)/100,0,1);saveAudioSettings();refreshAudioControls();if(audioSettings.on)unlockAudio();syncMusic()});
 }
 const flameDemo=$('flamePreview');if(flameDemo)flameDemo.onclick=()=>{unlockAudio();const go=()=>{if(mode!=='menu')return;flamePreviewUntil=performance.now()/1000+4.5;flameShot()};if(audioBuffers.flame_loop)go();else audioLoading?.then(go)};
 const demo=$('audioPreview');if(demo)demo.onclick=()=>{unlockAudio();const play=()=>{sfx('rail',1,true);setTimeout(()=>sfx('heavyExplosion',.85,true),650)};if(audioLoaded)play();else audioLoading?.then(play)};
 const menuPreview=$('musicMenuPreview');if(menuPreview)menuPreview.onclick=()=>{musicPreviewMode='menu';unlockAudio();syncMusic()};
 const combatPreview=$('musicCombatPreview');if(combatPreview)combatPreview.onclick=()=>{musicPreviewMode='combat';unlockAudio();syncMusic()};
 document.querySelectorAll('[data-sound-test]').forEach(btn=>btn.onclick=()=>{
  const id=btn.dataset.soundTest;
  unlockAudio();
  const play=()=>{
   if(mode!=='menu')return;
   flamePreviewUntil=0;stopFlameStream(false);
   if(id==='flame'){flamePreviewUntil=performance.now()/1000+3.1;flameShot();return;}
   if(id==='rail'){sfx('railCharge',.7,true);setTimeout(()=>{if(mode==='menu')sfx('rail',.9,true)},700);return;}
    if(id==='rocket'||id==='mine'){
    sfx(id,1,true);setTimeout(()=>{if(mode==='menu')sfx('explosion',.95,true)},id==='rocket'?480:390);
   }else if(id==='saw'){sfx('sawLoop',.90,true);setTimeout(()=>{if(mode==='menu')sfx('sawHit',.9,true)},260)}
   else sfx(id==='pulse'?'laser':id==='arc'?'arc':id,1,true);
  };
  if(audioLoaded)play();else audioLoading?.then(play);
 });
}
function audioMixerHTML(){return `<div class="audio-mixer" id="audioMixerPanel"><div class="audio-mixer-head"><span>♫ ЗВУКОВОЙ ПУЛЬТ // 0.9.7</span><span style="font-size:9px;color:#789eb0">АУДИОФАЙЛЫ</span></div><label class="audio-mixer-row">Эффекты <input type="range" min="0" max="100" step="1" id="sfxVolume" value="${Math.round(audioSettings.sfx*100)}"/><b id="sfxVolumeValue">${Math.round(audioSettings.sfx*100)}%</b></label><label class="audio-mixer-row">Музыка <input type="range" min="0" max="100" step="1" id="musicVolume" value="${Math.round(audioSettings.music*100)}"/><b id="musicVolumeValue">${Math.round(audioSettings.music*100)}%</b></label><div style="display:flex;gap:7px;flex-wrap:wrap"><button class="btn" type="button" id="musicMenuPreview">♪ МУЗЫКА МЕНЮ</button><button class="btn" type="button" id="musicCombatPreview">♫ МУЗЫКА БОЯ</button><button class="btn" type="button" id="audioPreview">◉ ВЫСТРЕЛ + ВЗРЫВ</button><button class="btn" type="button" id="flamePreview">♨ ОГНЕМЁТ: ПРОВЕРКА</button></div><div class="audio-mixer-head"><span>СЛУШАТЬ ПО ОДНОМУ ОРУЖИЮ</span><span>11 ОБРАЗЦОВ</span></div><div class="sound-test-grid">${BASE_WEAPONS.map(id=>`<button type="button" data-sound-test="${id}">${DRONES[id].glyph} ${DRONES[id].name}</button>`).join('')}</div><small>Огнемёт работает только при доступной цели. Сравни звуки по кнопкам: каждый воспроизводится отдельно. Остальное аудио v0.9.2 сохранено. Звук запускается после нажатия в браузере.</small></div>`}
function audioSrc(id){return 'data:'+(RELICT_WAV_IDS.has(id)?'audio/wav':'audio/mpeg')+';base64,'+AUDIO_BANK[id]}
function unlockAudio(){try{
 if(!audio){const Klass=window.AudioContext||window.webkitAudioContext;if(!Klass)return false;audio=new Klass();masterBus=audio.createDynamicsCompressor();masterBus.threshold.value=-13;masterBus.knee.value=12;masterBus.ratio.value=5;masterBus.attack.value=.006;masterBus.release.value=.21;masterBus.connect(audio.destination);
 sfxBus=audio.createGain();sfxBus.connect(masterBus);musicBus=audio.createGain();musicBus.connect(masterBus);refreshAudioControls();
 for(const key of ['menu_theme','combat_theme']){const el=new Audio(audioSrc(key));el.loop=true;el.preload='auto';const node=audio.createMediaElementSource(el);const gain=audio.createGain();gain.gain.value=0;node.connect(gain);gain.connect(musicBus);musicPlayers[key]={el,gain};}
 audioLoading=Promise.all(Object.entries(AUDIO_BANK).filter(([name])=>!name.endsWith('_theme')).map(async([name,base64])=>{
  try{const binary=atob(base64);const raw=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)raw[i]=binary.charCodeAt(i);audioBuffers[name]=await audio.decodeAudioData(raw.buffer);}catch(e){console.warn('Audio decode '+name,e)}
 })).then(()=>{audioLoaded=true;return true});
 }
 if(audio.state==='suspended')audio.resume().then(()=>syncMusic()).catch(()=>{});
 syncMusic();return true;
 }catch(e){console.warn('[Audio]',e);return false;}}
function desiredMusic(){if(document.hidden||!audioSettings.on||audioSettings.music<=0)return '';
 if(mode==='paused')return '';
 if(musicPreviewMode&&mode==='menu')return musicPreviewMode==='menu'?'menu_theme':'combat_theme';
 if(mode==='menu'||mode==='end')return 'menu_theme';
 if(mode==='playing'||mode==='upgrade'||mode==='forge')return 'combat_theme';
 return '';
}
function syncMusic(){if(!audio||audio.state!=='running')return;const target=desiredMusic(),now=audio.currentTime;
 if(currentMusic===target)return;currentMusic=target;
 for(const [id,player] of Object.entries(musicPlayers)){
  const gain=player.gain.gain;gain.cancelScheduledValues(now);gain.setValueAtTime(gain.value,now);gain.linearRampToValueAtTime(id===target?0.8:0,now+.8);
  if(id===target){const promise=player.el.play();if(promise?.catch)promise.catch(()=>{});}else if(!player.el.paused){
   // Fade down first; stopping the element does not alter the next loop start.
   setTimeout(()=>{if(currentMusic!==id){player.el.pause();player.el.currentTime=0;}},900);
  }
 }
}

// v0.9.7: remove excessive ignition/stopping hiss and old generic hit during burning; lower plasma shot + field.
// v0.9.6: balanced sound levels; saw/burning foreground; cryo retains approved Ice Squall; shortened railgun recordings.
// Approved sound design: one shared loop per sound family, smoothly ducked on inactivity / pause.
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
function sfx(id,amount=1,force=false,playRate=1){
 if(mute||document.hidden)return false;
 const limits={hit:.13,kill:.28,sawHit:.12,ui:.04,laser:.13,laserHit:.11,arc:.095,rail:.26,railCharge:.25,rocket:.20,plasma:.28,cryo:.20,flame:.24,gravity:.26,gravityCollapse:.29,mine:.12,boomer:.17,boomerReturn:.17,saw:.22,explosion:.20,heavyExplosion:.45,bossDown:.65};
 const now=performance.now()/1000;
 if(!force&&now-(soundPlayed[id]??-100)<(limits[id]??.10))return false;
 if(!force&&['laser','arc','rail','rocket','plasma','cryo','flame','gravity','mine','boomer','saw'].includes(id)){
  if(now-lastWeaponAt<.048)return false;lastWeaponAt=now;
 }
 soundPlayed[id]=now;
 if(!audio||!audioBuffers[id]){unlockAudio();return false;}
 if(audio.state!=='running'||activeVoices>=24)return false;
 try{
  const src=audio.createBufferSource(),g=audio.createGain();src.buffer=audioBuffers[id];src.playbackRate.value=playRate*(force?1:.97+Math.random()*.06);
  const vol={explosion:.37,heavyExplosion:.60,heavyExplosionDeep:.60,rail:.36,railCharge:.19,rocket:.23,mine:.30,hit:.10,laserHit:.13,kill:.13,flame:.30,cryo:.20,gravity:.37,gravityCollapse:.42,laser:.18,arc:.23,sawHit:.34,saw:.23,plasma:.15,boomer:.28,boomerReturn:.24,damage:.5,warning:.55,fusion:.78,bossDown:.80,ui:.22}[id]??.39;
  g.gain.value=clamp(amount,.08,1.4)*vol;
  src.connect(g);g.connect(sfxBus);activeVoices++;src.onended=()=>{activeVoices--;src.disconnect();g.disconnect()};src.start();return true;
 }catch(e){console.warn('[Sfx]',id,e);return false;}
}
function sfxWeapon(id){
 if(id==='flame'){flameShot();return}
 if(id==='saw'||id==='fusion_thermal'||id==='fusion_tesla'||id==='fusion_frostblade'||id==='fusion_magnetblade')return;
 const m={pulse:'laser',arc:'arc',rail:'rail',rocket:'rocket',plasma:'plasma',cryo:'cryo',flame:'flame',gravity:'gravity',mine:'mine',boomer:'boomer'};
 if(m[id]){if(id==='arc')return;if(id==='cryo')cryoAudibleUntil=performance.now()/1000+1.25;if(id!=='cryo')sfx(m[id],.90);return;}
 if(!id.startsWith('fusion_'))return;
 const recipe=HYBRIDS[id.slice(7)];if(!recipe)return;
 const sounds=[m[recipe.a],m[recipe.b]].filter(Boolean);
 // Layer only one primary shot, with quieter secondary modulation; loops follow living game objects.
 const primary=sounds.includes('rail')?'rail':sounds.includes('rocket')?'rocket':sounds.includes('laser')?'laser':sounds[0];
 if(primary&&primary!=='flame'&&primary!=='cryo')sfx(primary,.86);
 if(sounds.includes('cryo'))cryoAudibleUntil=performance.now()/1000+1.25;
 if(sounds.includes('arc')&&primary!=='arc')sfx('arc',.21);
 if(sounds.includes('plasma')&&primary!=='plasma')sfx('plasma',.20);
 if(sounds.includes('gravity')&&primary!=='gravity')sfx('gravity',.20);
}

function clickSound(){sfx('ui',.68)}
