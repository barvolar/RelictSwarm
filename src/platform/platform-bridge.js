/* Relict Swarm platform adapter. Self-contained: safe on GitHub Pages,
 * Yandex and CrazyGames each initialize only in their own distinct builds.
 * GitHub Pages needs no external gaming SDK. */
(function(){
 'use strict';
 const provider=['yandex','crazygames'].includes(window.RELICT_PLATFORM)?window.RELICT_PLATFORM:'web';
 let sdk=null,readyForPlayers=false,sdkPaused=false,gameplayRequested=false,gameplayActive=false;
 let pauseHandler=()=>{},resumeHandler=()=>{};
 let language='ru',crazyLoadingStarted=false;
 function syncGameplay(playing){
  gameplayRequested=!!playing;
  // CrazyGames tracks focus and visibility itself. Do not send stop for tab blur.
  const active=gameplayRequested&&!sdkPaused&&(provider==='crazygames'||!document.hidden);
  if(!sdk)return;
  if(active===gameplayActive)return;
  gameplayActive=active;
  try{
   if(provider==='yandex'){
    if(active)sdk.features?.GameplayAPI?.start?.();
    else sdk.features?.GameplayAPI?.stop?.();
   }else if(provider==='crazygames'){
    if(active)sdk.game?.gameplayStart?.();
    else sdk.game?.gameplayStop?.();
   }
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
  try{
   if(provider==='yandex')sdk.features?.LoadingAPI?.ready?.();
   else if(provider==='crazygames'&&crazyLoadingStarted){sdk.game?.loadingStop?.();crazyLoadingStarted=false;}
  }catch(e){console.warn('[Platform] Game Ready',e)}
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
 document.addEventListener('visibilitychange',()=>{
  if(provider==='yandex')syncGameplay(gameplayRequested);
 });
 if(provider==='crazygames'){
  const crazy=window.CrazyGames?.SDK;
  if(!crazy||typeof crazy.init!=='function'){
   console.warn('[Platform] CrazyGames SDK v3 missing; use the CrazyGames build in its preview.');
   return;
  }
  if(crazy.environment==='disabled'){
   console.warn('[Platform] CrazyGames SDK disabled on this host.');
   return;
  }
  Promise.resolve().then(()=>crazy.init()).then(()=>{
   // The CrazyGames SDK only runs in local/portal environments.
   if(crazy.environment==='disabled')return;
   sdk=crazy;
   try{sdk.game?.loadingStart?.();crazyLoadingStarted=true;}
   catch(e){console.warn('[Platform] loadingStart',e)}
   if(readyForPlayers)markReady();
   syncGameplay(gameplayRequested);
  }).catch(e=>console.warn('[Platform] CrazyGames SDK initialization failed',e));
  return;
 }
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
