// Fullscreen is opt-in and initiated only by a player gesture.
// Mobile portrait and landscape are both supported; never lock orientation.
const fullscreenButtonIds=['fullscreenBtn','mainFullscreen','fullscreenSettings','fullscreenPause'];
function fullscreenButtonText(){
 const en=typeof locale==='undefined'||locale==='en';
 const active=!!document.fullscreenElement;
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
async function toggleFullscreen(){
 // The CrazyGames portal supplies fullscreen; custom game fullscreen controls are prohibited.
 if(window.RELICT_PLATFORM==='crazygames')return false;
 const en=typeof locale==='undefined'||locale==='en';
 try{
  if(document.fullscreenElement){
   if(typeof document.exitFullscreen!=='function')throw Error('exitFullscreen unavailable');
   await document.exitFullscreen();
  }else{
   const root=document.documentElement;
   if(typeof root.requestFullscreen!=='function')throw Error('Fullscreen API unavailable');
   // Some browsers and embedded game portals reject fullscreen requests;
   // keep the game playable in both orientations if they do.
   await root.requestFullscreen();
  }
  syncFullscreenButtons();
  requestAnimationFrame(()=>resize());
  return true;
 }catch(error){
  console.warn('[Relict Swarm] Fullscreen not available:',error);
  fullscreenNotice(en?'Fullscreen unavailable in this browser or embed. Use the browser fullscreen control.':'Полный экран недоступен в этом браузере или окне. Используй кнопку браузера.');
  syncFullscreenButtons();
  return false;
 }
}
$('fullscreenBtn').addEventListener('click',toggleFullscreen);
document.addEventListener('fullscreenchange',()=>{
 syncFullscreenButtons();
 requestAnimationFrame(()=>resize());
});
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
 const previous=localStorage.getItem(orientationModeKey);
 if(['auto','portrait','landscape'].includes(previous))orientationMode=previous;
}catch{}
function orientationPickerHTML(){
 const entries=[['auto','AUTO'],['portrait','PORTRAIT'],['landscape','LANDSCAPE']];
 return '<div class="orientation-picker" role="group" aria-label="Screen orientation"><div class="orientation-title">SCREEN ORIENTATION</div>'+
  '<div class="orientation-choices">'+entries.map(([id,label])=>'<button type="button" class="btn ghost orientation-choice'+(orientationMode===id?' selected':'')+'" data-orientation="'+id+'" aria-pressed="'+(orientationMode===id)+'">'+label+'</button>').join('')+'</div>'+
  '<p class="orientation-help">Auto follows your phone rotation. To force portrait or landscape, your browser may require fullscreen. If the device blocks rotation, enable Auto-rotate in phone settings.</p></div>';
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
 if(!['auto','portrait','landscape'].includes(next))return false;
 const previousMode=orientationMode;
 orientationMode=next;
 try{localStorage.setItem(orientationModeKey,next)}catch{}
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
  try{localStorage.setItem(orientationModeKey,previousMode)}catch{}
  syncOrientationChoices();
  fullscreenNotice('This browser cannot force '+next+'. Rotate the phone and enable Auto-rotate in its settings.');
  return false;
 }
}
