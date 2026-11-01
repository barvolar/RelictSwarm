/* Relict Swarm platform adapter. Self-contained: safe on GitHub Pages,
 * Yandex initializes only in the separately built Yandex Games edition.
 * Other portals can supply their own adapter behind the same API. */
(function(){
 'use strict';
 const provider=window.RELICT_PLATFORM==='yandex'?'yandex':'web';
 let sdk=null,readyForPlayers=false,sdkPaused=false,gameplayRequested=false,gameplayActive=false;
 let pauseHandler=()=>{},resumeHandler=()=>{};
 let language='ru';
 function syncGameplay(playing){
  gameplayRequested=!!playing;
  const active=gameplayRequested&&!sdkPaused&&!document.hidden;
  if(!sdk)return;
  if(active===gameplayActive)return;
  gameplayActive=active;
  try{
   if(active)sdk.features?.GameplayAPI?.start?.();
   else sdk.features?.GameplayAPI?.stop?.();
  }catch(e){console.warn('[Platform] gameplay event',e);}
 }
 function platformPause(){
  if(sdkPaused)return;
  sdkPaused=true;
  syncGameplay(gameplayRequested);
  pauseHandler();
 }
 function platformResume(){
  if(!sdkPaused)return;
  sdkPaused=false;
  resumeHandler();
  syncGameplay(gameplayRequested);
 }
 function markReady(){
  readyForPlayers=true;
  if(!sdk)return;
  try{sdk.features?.LoadingAPI?.ready?.()}catch(e){console.warn('[Platform] Game Ready',e)}
 }
 const api={
  provider,
  get language(){return language},
  get sdkAvailable(){return !!sdk},
  isPaused:()=>sdkPaused,
  ready:markReady,
  syncGameplay,
  attachGameHandlers({pause,resume}={}){
   if(typeof pause==='function')pauseHandler=pause;
   if(typeof resume==='function')resumeHandler=resume;
   if(sdkPaused)pauseHandler();
  }
 };
 window.RelicPlatform=api;
 document.addEventListener('visibilitychange',()=>syncGameplay(gameplayRequested));
 if(provider!=='yandex')return;
 if(!window.YaGames || typeof window.YaGames.init!=='function'){
  console.warn('[Platform] Yandex SDK missing. Launch this build inside Yandex Games.');
  return;
 }
 Promise.resolve().then(()=>window.YaGames.init()).then(instance=>{
  sdk=instance;
  language=instance.environment?.i18n?.lang||'ru';
  // ru is currently the only translated locale. Keep it as the UI fallback.
  try{instance.on?.('game_api_pause',platformPause);
      instance.on?.('game_api_resume',platformResume)}catch(e){console.warn('[Platform] SDK events',e)}
  if(readyForPlayers)markReady();
  syncGameplay(gameplayRequested);
 }).catch(e=>console.warn('[Platform] Yandex SDK initialization failed',e));
})();
