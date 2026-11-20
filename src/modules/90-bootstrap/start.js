// Platform pausing must freeze gameplay and ALL sound (including menu music).
// Restore an automatic pause only if the SDK itself caused it.
let sdkOwnsPause=false,sdkSuspendedAudio=false;
window.RelicPlatform?.attachGameHandlers({
 pause(){
  if(mode==='playing'){sdkOwnsPause=true;pause()}
  if(audio&&audio.state==='running'){
   sdkSuspendedAudio=true;
   audio.suspend().catch(()=>{});
  }
 },
 resume(){
  if(sdkSuspendedAudio&&audio&&window.RelicPlatform?.isAudioEnabled?.()!==false){
   sdkSuspendedAudio=false;
   audio.resume().then(()=>syncMusic()).catch(()=>{});
  }
  if(sdkOwnsPause&&mode==='paused')resume();
  sdkOwnsPause=false;
  last=performance.now();
 },
 audioState(enabled){
  if(!enabled&&audio&&audio.state==='running'){sdkSuspendedAudio=true;audio.suspend().catch(()=>{});}
  else if(enabled&&!window.RelicPlatform?.isPaused?.()&&sdkSuspendedAudio&&audio){
   sdkSuspendedAudio=false;audio.resume().then(()=>syncMusic()).catch(()=>{});
  }
 }
});
setMode('menu');menu();window.RelicPlatform?.ready();requestAnimationFrame(loop);
})();



