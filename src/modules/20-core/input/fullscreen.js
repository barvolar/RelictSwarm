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
