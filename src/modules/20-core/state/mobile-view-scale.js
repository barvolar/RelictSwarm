// Playgama mobile display scaling. No effect on other distribution builds.
// World and HUD scales are independent and persist per phone orientation.
// 35% world / 80% HUD is the requested landscape test preset. Portrait starts
// at a safer 55% world / 80% HUD; both can be changed by the player.
const mobileScaleKey='relictswarm_mobile_scale_v1';
const mobileWorldSteps=[35,45,55,65,75,85,95,100];
const mobileHudSteps=[70,80,85,90,100,110];
const mobileScaleDefaults={portrait:{world:55,hud:80},landscape:{world:35,hud:80}};
const mobileScaleValues={
 portrait:{...mobileScaleDefaults.portrait},
 landscape:{...mobileScaleDefaults.landscape}
};
if(isPlaygama){
 try{
  const raw=window.RelicPlatform?.readStored?.(mobileScaleKey);
  const saved=typeof raw==='string'?JSON.parse(raw):raw;
  if(saved&&typeof saved==='object'){
   for(const mode of ['portrait','landscape']){
    if(mobileWorldSteps.includes(saved[mode]?.world))mobileScaleValues[mode].world=saved[mode].world;
    if(mobileHudSteps.includes(saved[mode]?.hud))mobileScaleValues[mode].hud=saved[mode].hud;
   }
  }
 }catch(error){console.warn('[Relict Swarm] Invalid stored mobile scale:',error);}
 document.documentElement.classList.add('playgama-scale-enabled');
}
function mobileScaleOrientation(){return innerWidth<innerHeight?'portrait':'landscape';}
function mobileScaleCurrent(){return mobileScaleValues[mobileScaleOrientation()];}
function mobileScaleWorldZoom(){return mobileScaleCurrent().world/100;}
function syncMobileScaleCSS(){
 if(!isPlaygama)return;
 const current=mobileScaleCurrent();
 document.documentElement.style.setProperty('--rs-mobile-hud-scale',String(current.hud/100));
 const summary=document.querySelector('.mobile-scale-fold > summary');
 if(summary){
  const isRu=typeof locale!=='undefined'&&locale==='ru';
  summary.textContent=isRu
   ?'МАСШТАБ · МИР '+current.world+'% · HUD '+current.hud+'%'
   :'DISPLAY SCALE · WORLD '+current.world+'% · HUD '+current.hud+'%';
 }
 const section=document.querySelector('.mobile-view-settings');
 if(section){
  const label=section.querySelector('.mobile-view-orientation');
  if(label)label.textContent=mobileScaleOrientation()==='landscape'?'LANDSCAPE':'PORTRAIT';
  for(const button of section.querySelectorAll('[data-view-world],[data-view-hud]')){
   const selected=button.hasAttribute('data-view-world')
    ?Number(button.getAttribute('data-view-world'))===current.world
    :Number(button.getAttribute('data-view-hud'))===current.hud;
   button.setAttribute('aria-pressed',String(selected));
   button.classList.toggle('selected',selected);
  }
 }
}
function setMobileScale(which,value){
 if(!isPlaygama||!['world','hud'].includes(which))return false;
 const permitted=which==='world'?mobileWorldSteps:mobileHudSteps;
 if(!permitted.includes(value))return false;
 mobileScaleCurrent()[which]=value;
 try{window.RelicPlatform.writeStored(mobileScaleKey,JSON.stringify(mobileScaleValues));}
 catch(error){console.warn('[Relict Swarm] Could not persist display scale:',error);}
 syncMobileScaleCSS();
 return true;
}
function mobileScaleSettingsHTML(){
 if(!isPlaygama)return '';
 const data=mobileScaleCurrent();
 const buttons=(steps,key)=>steps.map(n=>`<button type="button" class="mobile-scale-option ${data[key]===n?'selected':''}" data-view-${key}="${n}" aria-pressed="${data[key]===n}">${n}%</button>`).join('');
 return `<section class="mobile-view-settings">
  <div class="mobile-view-head"><b>DISPLAY SCALE</b><span class="mobile-view-orientation">${mobileScaleOrientation()==='landscape'?'LANDSCAPE':'PORTRAIT'}</span></div>
  <p class="mobile-scale-label">WORLD SCALE</p><div class="mobile-scale-options" role="group" aria-label="World scale">${buttons(mobileWorldSteps,'world')}</div>
  <p class="mobile-scale-label">HUD SCALE</p><div class="mobile-scale-options" role="group" aria-label="HUD scale">${buttons(mobileHudSteps,'hud')}</div>
  <p class="mobile-scale-hint">Settings are saved separately for portrait and landscape. Smaller world scale shows more of the arena; HUD scale changes the information panel. On a desktop PC these controls edit the mobile presets but do not scale desktop gameplay.</p>
 </section>`;
}
// Keep the main Pause menu usable: the presets expand on demand, while
// Settings shows them directly even in desktop QA preview mode.
function mobileScalePauseHTML(){
 if(!isPlaygama)return '';
 return `<details class="mobile-scale-fold">
  <summary>DISPLAY SCALE · WORLD ${mobileScaleCurrent().world}% · HUD ${mobileScaleCurrent().hud}%</summary>
  ${mobileScaleSettingsHTML()}
 </details>`;
}
function bindMobileScaleSettings(){
 for(const button of document.querySelectorAll('[data-view-world]')){
  button.addEventListener('click',()=>setMobileScale('world',Number(button.getAttribute('data-view-world'))));
 }
 for(const button of document.querySelectorAll('[data-view-hud]')){
  button.addEventListener('click',()=>setMobileScale('hud',Number(button.getAttribute('data-view-hud'))));
 }
 syncMobileScaleCSS();
}
if(isPlaygama){
 syncMobileScaleCSS();
 addEventListener('resize',syncMobileScaleCSS,{passive:true});
 addEventListener('orientationchange',()=>setTimeout(syncMobileScaleCSS,120),{passive:true});
}
