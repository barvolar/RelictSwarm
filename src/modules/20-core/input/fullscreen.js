// Fullscreen is opt-in and initiated only by a player gesture.
// iOS browsers cannot use our Fullscreen and Orientation Lock API controls;
// physical rotation remains fully supported via resize/orientationchange.
const isAppleTouchDevice=(()=>{
 if(typeof navigator==='undefined')return false;
 const ua=navigator.userAgent||'',platform=navigator.platform||'';
 return /iPhone|iPad|iPod/i.test(ua)||
  (platform==='MacIntel'&&Number(navigator.maxTouchPoints||0)>1);
})();
if(isAppleTouchDevice)document.documentElement.classList?.add('ios-device');
const fullscreenButtonIds=['fullscreenBtn','mainFullscreen','fullscreenSettings','fullscreenPause','exitFullscreenPause'];
function activeFullscreenElement(){return document.fullscreenElement||document.webkitFullscreenElement||null;}
function fullscreenButtonText(){
 const en=typeof locale==='undefined'||locale==='en';
 const active=!!activeFullscreenElement();
 return active?(en?'⤡ EXIT FULLSCREEN':'⤡ ВЫЙТИ ИЗ ПОЛНОГО ЭКРАНА'):(en?'⛶ FULLSCREEN':'⛶ ПОЛНЫЙ ЭКРАН');
}
function syncFullscreenButtons(){
 const active=!!document.fullscreenElement;
 for(const id of fullscreenButtonIds){
  const button=$(id);
  if(!button)continue;
  button.textContent=id==='fullscreenBtn'?(active?'⤡':'⛶'):fullscreenButtonText();
  button.setAttribute('aria-label',fullscreenButtonText());
  button.setAttribute('aria-pressed',String(active));
  button.title=fullscreenButtonText();
 }
}
let fullscreenNoticeTimer=0;
function fullscreenNotice(message){
 const element=$('fullscreenStatus');
 if(!element)return;
 element.textContent=message;
 element.classList.add('visible');
 clearTimeout(fullscreenNoticeTimer);
 fullscreenNoticeTimer=setTimeout(()=>element.classList.remove('visible'),4200);
}
async function exitGameFullscreen(){
 // On Android, release a previously requested rotation lock BEFORE leaving
 // fullscreen. This avoids a stuck orientation or a failed second toggle.
 if(!activeFullscreenElement())return false;
 try{if(typeof screen!=='undefined')screen.orientation?.unlock?.()}catch(error){
  console.warn('[Relict Swarm] Fullscreen orientation unlock:',error);
 }
 if(typeof document.exitFullscreen==='function')await document.exitFullscreen();
 else if(typeof document.webkitExitFullscreen==='function')await document.webkitExitFullscreen();
 else throw Error('Fullscreen exit API unavailable');
 syncFullscreenButtons();
 resetFloatingJoy();
 requestAnimationFrame(()=>resize());
 return true;
}
async function toggleFullscreen(){
 // The CrazyGames portal supplies fullscreen; custom game fullscreen controls are prohibited.
 if(window.RELICT_PLATFORM==='crazygames'||isAppleTouchDevice)return false;
 const en=typeof locale==='undefined'||locale==='en';
 try{
  if(activeFullscreenElement())return await exitGameFullscreen();
  const root=document.documentElement;
  if(typeof root.requestFullscreen!=='function')throw Error('Fullscreen API unavailable');
  // Fullscreen is reversible by the HUD and the dedicated exit in Pause.
  // Do not lock screen orientation during a plain fullscreen toggle.
  await root.requestFullscreen();
  syncFullscreenButtons();
  requestAnimationFrame(()=>resize());
  return true;
 }catch(error){
  console.warn('[Relict Swarm] Fullscreen not available:',error);
  fullscreenNotice(en?'Fullscreen unavailable here. Use the browser or Playgama fullscreen button.':'Здесь полный экран недоступен. Используй кнопку браузера или Playgama.');
  syncFullscreenButtons();
  return false;
 }
}
function fullscreenExitPauseHTML(){
 if(window.RELICT_PLATFORM!=='playgama'||isAppleTouchDevice||!activeFullscreenElement())return '';
 return '<div class="button-row"><button id="exitFullscreenPause" class="btn ghost" type="button">⤡ EXIT FULLSCREEN</button></div>';
}
function bindFullscreenExitPause(){
 const button=$('exitFullscreenPause');
 if(button)button.onclick=()=>toggleFullscreen();
}
$('fullscreenBtn').addEventListener('click',toggleFullscreen);
function onGameFullscreenChange(){
 syncFullscreenButtons();
 resetFloatingJoy();
 requestAnimationFrame(()=>resize());
}
document.addEventListener('fullscreenchange',onGameFullscreenChange);
document.addEventListener('webkitfullscreenchange',onGameFullscreenChange);
addEventListener('orientationchange',()=>{
 resetFloatingJoy();
 requestAnimationFrame(()=>resize());
});
if(window.visualViewport){
 window.visualViewport.addEventListener('resize',()=>requestAnimationFrame(()=>resize()),{passive:true});
}
syncFullscreenButtons();

// Player-facing orientation preference. Chrome Android can lock orientation
// during fullscreen. iOS Safari and embedded portals may refuse the request:
// keep native auto-rotation playable, and explain the device setting instead.
const orientationModeKey='relictswarm_orientation_v1';
let orientationMode='auto';
try{
 const previous=window.RelicPlatform?.readStored?window.RelicPlatform.readStored(orientationModeKey):localStorage.getItem(orientationModeKey);
 if(['auto','portrait','landscape'].includes(previous))orientationMode=previous;
}catch{}
function orientationPickerHTML(){
 if(isAppleTouchDevice)return '';
 const ru=typeof locale!=='undefined'&&locale==='ru';
 const entries=ru?[['auto','АВТО'],['portrait','ВЕРТИКАЛЬНО'],['landscape','ГОРИЗОНТАЛЬНО']]:[['auto','AUTO'],['portrait','PORTRAIT'],['landscape','LANDSCAPE']];
 const title=ru?'ОРИЕНТАЦИЯ ЭКРАНА':'SCREEN ORIENTATION';
 const help=ru?'Автоматический режим следует повороту телефона. Для принудительной ориентации браузер может потребовать полноэкранный режим. Если поворот заблокирован, включи автоповорот в настройках устройства.':'Auto follows your phone rotation. To force portrait or landscape, your browser may require fullscreen. If the device blocks rotation, enable Auto-rotate in phone settings.';
 return '<div class="orientation-picker" role="group" aria-label="'+title+'"><div class="orientation-title">'+title+'</div>'+
  '<div class="orientation-choices">'+entries.map(([id,label])=>'<button type="button" class="btn ghost orientation-choice'+(orientationMode===id?' selected':'')+'" data-orientation="'+id+'" aria-pressed="'+(orientationMode===id)+'">'+label+'</button>').join('')+'</div>'+
  '<p class="orientation-help">'+help+'</p></div>';
}
function syncOrientationChoices(){
 for(const button of document.querySelectorAll?.('[data-orientation]')||[]){
  const selected=button.getAttribute('data-orientation')===orientationMode;
  button.setAttribute('aria-pressed',String(selected));
  button.classList.toggle('selected',selected);
 }
}
function bindOrientationPicker(){
 for(const button of document.querySelectorAll?.('[data-orientation]')||[]){
  button.addEventListener('click',()=>setOrientationMode(button.getAttribute('data-orientation')));
 }
 syncOrientationChoices();
}
async function setOrientationMode(next){
 if(isAppleTouchDevice)return false;
 if(!['auto','portrait','landscape'].includes(next))return false;
 const previousMode=orientationMode;
 orientationMode=next;
 try{if(window.RelicPlatform?.writeStored)window.RelicPlatform.writeStored(orientationModeKey,next);else localStorage.setItem(orientationModeKey,next)}catch{}
 syncOrientationChoices();
 // CrazyGames manages orientation based on the submission configuration.
 if(window.RELICT_PLATFORM==='crazygames')return false;
 if(next==='auto'){
  try{
   if(typeof screen!=='undefined')screen.orientation?.unlock?.();
  }catch(error){console.warn('[Relict Swarm] Orientation unlock:',error)}
  fullscreenNotice('AUTO: turn on Auto-rotate on your phone, then rotate the device.');
  resetFloatingJoy();requestAnimationFrame(()=>resize());
  return true;
 }
 try{
  if(typeof screen==='undefined'||typeof screen.orientation?.lock!=='function')throw Error('Orientation Lock API unavailable');
  // Must start fullscreen inside the direct click gesture on most Android browsers.
  if(!document.fullscreenElement&&typeof document.documentElement.requestFullscreen==='function'){
   await document.documentElement.requestFullscreen();
   syncFullscreenButtons();
  }
  await screen.orientation.lock(next);
  resetFloatingJoy();requestAnimationFrame(()=>resize());
  fullscreenNotice(next==='portrait'?'PORTRAIT mode enabled.':'LANDSCAPE mode enabled.');
  return true;
 }catch(error){
  console.warn('[Relict Swarm] Screen orientation lock unavailable:',error);
  orientationMode=previousMode;
  try{if(window.RelicPlatform?.writeStored)window.RelicPlatform.writeStored(orientationModeKey,previousMode);else localStorage.setItem(orientationModeKey,previousMode)}catch{}
  syncOrientationChoices();
  fullscreenNotice('This browser cannot force '+next+'. Rotate the phone and enable Auto-rotate in its settings.');
  return false;
 }
}
