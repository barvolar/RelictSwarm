/* Relict Swarm platform adapter. Self-contained: safe on GitHub Pages,
 * Yandex, CrazyGames and Playgama initialize only in their own distinct builds.
 * GitHub Pages needs no external gaming SDK. */
(function(){
 'use strict';
 const provider=['yandex','crazygames','playgama'].includes(window.RELICT_PLATFORM)?window.RELICT_PLATFORM:'web';
 let sdk=null,readyForPlayers=false,sdkPaused=false,gameplayRequested=false,gameplayActive=false;
 let pauseHandler=()=>{},resumeHandler=()=>{};
 let language='ru',crazyLoadingStarted=false,gameReadySent=false,audioEnabled=true,audioStateHandler=()=>{},rewardedCallback=null;
 const pendingStorage=new Map();let storageFlushScheduled=false,storageQueue=Promise.resolve();
 function readStored(key){if(provider==='playgama')return window.RelicPlaygamaData?.[key]??null;try{return localStorage.getItem(key)}catch{return null}}
 function writeStored(key,value){
  if(provider!=='playgama'){try{localStorage.setItem(key,value)}catch{}return}
  window.RelicPlaygamaData[key]=value;
  pendingStorage.set(key,value);
  if(storageFlushScheduled)return;
  storageFlushScheduled=true;
  Promise.resolve().then(()=>{
   storageFlushScheduled=false;
   const entries=[...pendingStorage];pendingStorage.clear();
   const keys=entries.map(([key])=>key),values=entries.map(([,value])=>value);
   storageQueue=storageQueue.catch(()=>{}).then(()=>sdk.storage.set(keys,values)).catch(error=>console.error('[Playgama] Save failed',error));
  });
 }
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
   else if(provider==='playgama'&&!gameReadySent){sdk.platform.sendMessage('game_ready');gameReadySent=true;}
  }catch(e){console.warn('[Platform] Game Ready',e)}
 }
 const api={
  provider,
  get language(){return language},
  get sdkAvailable(){return !!sdk},
  isPaused:()=>sdkPaused,
  isAudioEnabled:()=>audioEnabled,
  readStored,writeStored,
  canReward:()=>provider==='playgama'&&!!sdk?.advertisement?.isRewardedSupported,
  showInterstitial(){if(provider!=='playgama'||!sdk?.advertisement?.isInterstitialSupported)return false;try{sdk.advertisement.showInterstitial('run_end');return true}catch(error){console.warn('[Playgama] Interstitial',error);return false}},
  showRewarded(callback){
   if(provider!=='playgama'||!sdk?.advertisement?.isRewardedSupported||rewardedCallback||typeof callback!=='function')return false;
   rewardedCallback=callback;
   try{sdk.advertisement.showRewarded('upgrade_reroll');return true}
   catch(error){rewardedCallback=null;console.warn('[Playgama] Rewarded ad',error);return false}
  },
  ready:markReady,
  syncGameplay,
  attachGameHandlers({pause,resume,audioState}={}){
   if(typeof pause==='function')pauseHandler=pause;
   if(typeof resume==='function')resumeHandler=resume;
   if(typeof audioState==='function')audioStateHandler=audioState;
   audioStateHandler(audioEnabled);
   if(sdkPaused)pauseHandler();
  }
 };
 window.RelicPlatform=api;
 document.addEventListener('visibilitychange',()=>{
  if(provider==='yandex')syncGameplay(gameplayRequested);
 });
 if(provider==='playgama'){
  if(!window.bridge)throw Error('Playgama Bridge must initialize before the game');
  sdk=window.bridge;
  language=String(sdk.platform?.language||'en');
  audioEnabled=sdk.platform?.isAudioEnabled!==false;
  sdk.platform.on(sdk.EVENT_NAME.PAUSE_STATE_CHANGED,paused=>paused?platformPause():platformResume());
  sdk.platform.on(sdk.EVENT_NAME.AUDIO_STATE_CHANGED,enabled=>{audioEnabled=!!enabled;audioStateHandler(audioEnabled)});
  sdk.advertisement.on(sdk.EVENT_NAME.REWARDED_STATE_CHANGED,state=>{
   if(state==='rewarded'&&rewardedCallback){const cb=rewardedCallback;rewardedCallback=null;cb()}
   else if(state==='closed'||state==='failed')rewardedCallback=null;
  });
  if(sdk.platform.isPaused)platformPause();
  return;
 }
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
   language=String(sdk.user?.systemInfo?.locale||'en');
   window.RelicOnPlatformLocale?.(language);
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
  language=instance.environment?.i18n?.lang||'ru';window.RelicOnPlatformLocale?.(language);
  // ru is currently the only translated locale. Keep it as the UI fallback.
  try{instance.on?.('game_api_pause',platformPause);
      instance.on?.('game_api_resume',platformResume)}catch(e){console.warn('[Platform] SDK events',e)}
  if(readyForPlayers)markReady();
  syncGameplay(gameplayRequested);
 }).catch(e=>console.warn('[Platform] Yandex SDK initialization failed',e));
})();
