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
