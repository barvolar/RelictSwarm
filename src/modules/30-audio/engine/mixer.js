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
