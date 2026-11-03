// Procedural sound engine: decode/download of third-party audio is intentionally absent.
function unlockAudio(){try{
 if(!audio){
  const Klass=window.AudioContext||window.webkitAudioContext;if(!Klass)return false;
  audio=new Klass();
  masterBus=audio.createDynamicsCompressor();
  masterBus.threshold.value=-13;masterBus.knee.value=12;masterBus.ratio.value=5;
  masterBus.attack.value=.006;masterBus.release.value=.21;masterBus.connect(audio.destination);
  sfxBus=audio.createGain();sfxBus.connect(masterBus);
  musicBus=audio.createGain();musicBus.connect(masterBus);
  refreshAudioControls();
  audioBuffers=buildRelictProceduralSfxBank(audio);
  const tracks=buildRelictProceduralMusicBank(audio);
  for(const [id,buffer] of Object.entries(tracks)){
   const src=audio.createBufferSource(),gain=audio.createGain();
   src.buffer=buffer;src.loop=true;gain.gain.value=0;
   src.connect(gain);gain.connect(musicBus);
   src.start();
   musicPlayers[id]={src,gain};
  }
  audioLoaded=true;
  audioLoading=Promise.resolve(true);
 }
 if(audio.state==='suspended')audio.resume().then(()=>syncMusic()).catch(()=>{});
 syncMusic();return true;
 }catch(e){console.warn('[Audio]',e);return false;}
}
function desiredMusic(){
 if(document.hidden||!audioSettings.on||audioSettings.music<=0)return '';
 if(mode==='paused')return '';
 if(musicPreviewMode&&mode==='menu')return musicPreviewMode==='menu'?'menu_theme':'combat_theme';
 if(mode==='menu'||mode==='end')return 'menu_theme';
 if(mode==='playing'||mode==='upgrade'||mode==='forge')return 'combat_theme';
 return '';
}
function syncMusic(){
 if(!audio||audio.state!=='running')return;
 const target=desiredMusic(),now=audio.currentTime;
 if(currentMusic===target)return;
 currentMusic=target;
 for(const [id,player] of Object.entries(musicPlayers)){
  const gain=player.gain.gain;
  gain.cancelScheduledValues(now);
  gain.setValueAtTime(gain.value,now);
  gain.linearRampToValueAtTime(id===target?.8:0,now+.8);
 }
}
