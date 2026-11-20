// End-to-end smoke check against the actual built Playgama HTML, with a mock
// external Bridge script. Run by GitHub Actions in Chrome after npm test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist/playgama');
const types={'.html':'text/html; charset=utf-8','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.join(root,name==='/'?'index.html':name.slice(1));
 if(!file.startsWith(root+path.sep)&&file!==path.join(root,'index.html')){
  res.writeHead(403);res.end();return;
 }
 try{res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(fs.readFileSync(file))}
 catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/';
const makeMock=language=>`
(function(){
 const calls=window.__bridgeCalls=[];
 const listeners={};
 window.__bridgeTrigger=(type,value)=>{listeners[type]?.forEach(cb=>cb(value));};
 window.bridge={
  EVENT_NAME:{
   PAUSE_STATE_CHANGED:'pause',
   AUDIO_STATE_CHANGED:'audio',
   REWARDED_STATE_CHANGED:'rewarded'
  },
  initialize(){calls.push(['initialize']);return Promise.resolve()},
  storage:{
   get(keys,tryParseJson=true){
    calls.push(['get',keys,tryParseJson]);
    return Promise.resolve(keys.map(key=>{
     const value=localStorage.getItem('bridge-test:'+key);
     if(value===null)return null;
     if(!tryParseJson)return value;
     try{return JSON.parse(value)}catch{return value}
    }));
   },
   set(keys,values){
    calls.push(['set',keys,values]);
    keys.forEach((key,i)=>localStorage.setItem('bridge-test:'+key,values[i]));
    return Promise.resolve();
   }
  },
  platform:{
   language:'${language}',isAudioEnabled:true,isPaused:false,
   on(event,cb){(listeners[event]??=[]).push(cb)},
   sendMessage(value){calls.push(['message',value]);return Promise.resolve()}
  },
  advertisement:{
   isRewardedSupported:true,isInterstitialSupported:true,
   on(event,cb){(listeners[event]??=[]).push(cb)},
   showInterstitial(where){calls.push(['interstitial',where])},
   showRewarded(where){calls.push(['rewarded',where])}
  }
 };
})();
`;

let browser;
try{
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 for(const [label,viewport,touch] of [
  ['desktop',{width:1280,height:720},false],
  ['portrait',{width:390,height:844},true],
  ['landscape',{width:844,height:390},true],
  ['wide-landscape',{width:1280,height:576},true],
  ['square',{width:540,height:540},true]
 ]){
  const context=await browser.newContext({viewport,isMobile:touch,hasTouch:touch});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.route('https://bridge.playgama.com/**',route=>route.fulfill({status:200,contentType:'text/javascript',body:makeMock(label==='portrait'?'ru':'en')}));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#mainPlay').waitFor({state:'visible',timeout:30000});
  let calls=await page.evaluate(()=>window.__bridgeCalls);
  assert.equal(calls[0][0],'initialize',label+' must initialize Bridge');
  assert.equal(calls[1][0],'get',label+' must restore save before showing menu');
  assert.ok(calls.some(c=>c[0]==='message'&&c[1]==='game_ready'),label+' must report ready');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),label+' page must not scroll horizontally');
  assert.equal(pageErrors.length,0,label+' errors after menu: '+pageErrors.join(' | '));
  // The screenshots reported a mixed Russian/English settings panel.
  // Check both locale directions and the manual language switch.
  await page.locator('#mainSettings').click({timeout:15000});
  await page.locator('.graphics-settings').waitFor({state:'visible',timeout:15000});
  let graphics=await page.locator('.graphics-settings').innerText();
  // Desktop must APPLY world and HUD scaling, persist settings and keep
  // phone portrait/landscape preferences separate.
  if(!touch){
   const scalePanel=page.locator('.mobile-view-settings');
   await scalePanel.waitFor({state:'visible',timeout:10000});
   assert.equal(await scalePanel.locator('[data-view-world]').count(),8);
   assert.equal(await scalePanel.locator('[data-view-hud]').count(),6);
   assert.ok((await scalePanel.innerText()).includes('DESKTOP'),'desktop profile should be selected');
   await page.locator('[data-view-world="65"]').click({timeout:10000});
   await page.locator('[data-view-hud="80"]').click({timeout:10000});
   const stored=await page.evaluate(()=>JSON.parse(window.RelicPlatform.readStored('relictswarm_mobile_scale_v1')));
   assert.equal(stored.desktop.world,65,'desktop world zoom must persist');
   assert.equal(stored.desktop.hud,80,'desktop HUD zoom must persist');
   assert.equal(stored.landscape.world,35,'desktop zoom must not overwrite phone landscape defaults');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#mainPlay').waitFor({state:'visible',timeout:30000});
   await page.locator('#mainSettings').click({timeout:10000});
   assert.equal(await page.locator('[data-view-world="65"]').getAttribute('aria-pressed'),'true','desktop world zoom restored');
   assert.equal(await page.locator('[data-view-hud="80"]').getAttribute('aria-pressed'),'true','desktop HUD zoom restored');
   console.log('PASS: Playgama desktop world/HUD scales persist independently after F5');
  }
  if(touch&&(label==='portrait'||label==='landscape'||label==='wide-landscape')){
   // Change settings in the real modal, then reload and verify Bridge restored
   // the same independent portrait/landscape scale preference.
   await page.locator('.mobile-view-settings').waitFor({state:'visible',timeout:10000});
   await page.locator('[data-view-world="45"]').click({timeout:10000});
   await page.locator('[data-view-world="35"]').click({timeout:10000});
   await page.locator('[data-view-hud="90"]').click({timeout:10000});
   await page.locator('[data-view-hud="80"]').click({timeout:10000});
   assert.equal(await page.locator('[data-view-world="35"]').getAttribute('aria-pressed'),'true',label+' 35% world selection');
   assert.equal(await page.locator('[data-view-hud="80"]').getAttribute('aria-pressed'),'true',label+' 80% HUD selection');
   const scaleStored=await page.evaluate(()=>JSON.parse(window.RelicPlatform.readStored('relictswarm_mobile_scale_v1')));
   const orientation=label==='portrait'?'portrait':'landscape';
   assert.equal(scaleStored[orientation].world,35,label+' stored world scale');
   assert.equal(scaleStored[orientation].hud,80,label+' stored HUD scale');
   assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--rs-mobile-hud-scale').trim()),'0.8');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#mainPlay').waitFor({state:'visible',timeout:30000});
   await page.locator('#mainSettings').click({timeout:10000});
   assert.equal(await page.locator('[data-view-world="35"]').getAttribute('aria-pressed'),'true',label+' scale restored after reload');
   assert.equal(await page.locator('[data-view-hud="80"]').getAttribute('aria-pressed'),'true',label+' HUD restored after reload');
   console.log('PASS: Playgama '+label+' world/HUD scale choices persist after reload');
  }

  if(label==='portrait'){
   // Portal advertises RU but brand-new users must still see English.
   assert.ok(graphics.includes('GRAPHICS QUALITY'),label+' default must be English even when host language is Russian');
   assert.equal(await page.evaluate(()=>document.documentElement.lang),'en');
   await page.locator('#languageBtn').click();
   graphics=await page.locator('.graphics-settings').innerText();
   assert.ok(graphics.includes('КАЧЕСТВО ГРАФИКИ'),label+' should switch to Russian');
   assert.ok(graphics.includes('Максимальная детализация'),label+' should display Russian preset descriptions');
   assert.ok(!graphics.includes('GRAPHICS QUALITY')&&!graphics.includes('Enemies use'),label+' settings must not mix languages');
   assert.ok((await page.locator('.privacy-policy-row').innerText()).includes('Прогресс сохраняется'),label+' privacy must be Russian');
   await page.locator('#howBtn').click();
   assert.ok((await page.locator('#modalContent').innerText()).includes('СОБЕРИ СВОЙ АРСЕНАЛ'),label+' help must be Russian');
   await page.locator('#backFromHow').click();
   assert.ok((await page.evaluate(()=>window.__bridgeCalls)).some(c=>c[0]==='set'&&c[1].includes('relictswarm_ui_locale_v1')&&c[2].includes('ru')),label+' explicit Russian selection must be saved');
   await page.locator('#languageBtn').click();
   graphics=await page.locator('.graphics-settings').innerText();
   assert.ok(graphics.includes('GRAPHICS QUALITY')&&!graphics.includes('КАЧЕСТВО ГРАФИКИ'),label+' should switch back to English');
   assert.equal(await page.evaluate(()=>document.documentElement.lang),'en');
   assert.ok((await page.locator('.privacy-policy-row').innerText()).includes('Game progress uses Playgama Bridge'));
    }else{
   assert.ok(graphics.includes('GRAPHICS QUALITY'),label+' should display English graphics heading');
   assert.ok(!graphics.includes('КАЧЕСТВО ГРАФИКИ'),label+' settings must be English');
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),label+' settings must not scroll horizontally');
  await page.locator('#backHome').click();
  await page.locator('#mainPlay').click({timeout:15000});
  await page.locator('#startBtn').waitFor({state:'visible',timeout:15000});
  await page.locator('#startBtn').click({timeout:15000});
  await page.waitForFunction(()=>window.RelicPlatform?.provider==='playgama'&&document.querySelector('#modal')?.classList.contains('hidden'),{timeout:15000});
  if(label==='landscape'||label==='wide-landscape'){
   await page.waitForFunction(()=>document.querySelectorAll('#mobileModules .mobile-weapon-slot').length===5,{timeout:12000});
   const hud=await page.evaluate(()=>{
    const panel=document.querySelector('#hud .hud-dock').getBoundingClientRect();
    const dash=document.querySelector('#dashBtn').getBoundingClientRect();
    const slots=[...document.querySelectorAll('#mobileModules .mobile-weapon-slot')].map(e=>e.getBoundingClientRect());
    const fusion=document.querySelector('#forgeBtn').getBoundingClientRect();
    return {height:panel.height,ratio:panel.height/innerHeight,dashWidth:dash.width,
     rows:[...slots.map(r=>Math.round(r.top)),Math.round(fusion.top)],
     slotCount:slots.length,
     fusionEndsWithinViewport:fusion.right<=innerWidth,
     gameWidth:document.documentElement.scrollWidth};
   });
   assert.equal(hud.slotCount,5,'all five weapon modules must be present');
   assert.equal(new Set(hud.rows).size,1,'five weapons and Fusion must fit on ONE row in landscape');
   assert.ok(hud.height<=91&&hud.ratio<.24,label+' HUD should not cover a quarter of the display: '+JSON.stringify(hud));
   assert.ok(hud.dashWidth<=85,label+' dash button should be compact: '+hud.dashWidth);
   assert.ok(hud.fusionEndsWithinViewport&&hud.gameWidth<=viewport.width+2,'mobile HUD must not overflow sideways');
   console.log('PASS: Playgama '+label+' compact landscape HUD '+Math.round(hud.height)+'px; dash '+Math.round(hud.dashWidth)+'px');
  }
  if(!touch){
   // Verify actual on-screen desktop HUD geometry, not merely the stored numbers.
   const geometry80=await page.evaluate(()=>{
    const dock=document.querySelector('#hud .hud-dock');
    return {transform:getComputedStyle(dock).transform,width:dock.getBoundingClientRect().width,
      height:document.querySelector('#hud .hud-top').getBoundingClientRect().height};
   });
   assert.ok(geometry80.transform.startsWith('matrix(0.8, 0, 0, 0.8,'),'desktop HUD must actually scale down: '+JSON.stringify(geometry80));
   assert.ok(Math.abs(geometry80.width-viewport.width)<3,'scaled desktop HUD must span full viewport');
   await page.keyboard.press('p');
   await page.locator('#resumeBtn').waitFor({state:'visible',timeout:15000});
   await page.locator('.mobile-scale-fold > summary').click({timeout:10000});
   await page.locator('.mobile-scale-fold [data-view-hud="110"]').click({timeout:10000});
   await page.locator('#resumeBtn').click();
   const geometry110=await page.evaluate(()=>{
    const dock=document.querySelector('#hud .hud-dock');
    return {transform:getComputedStyle(dock).transform,width:dock.getBoundingClientRect().width,
      height:document.querySelector('#hud .hud-top').getBoundingClientRect().height};
   });
   assert.ok(geometry110.transform.startsWith('matrix(1.1, 0, 0, 1.1,'),'desktop HUD must scale up: '+JSON.stringify(geometry110));
   assert.ok(geometry110.height>geometry80.height*1.2,'desktop HUD top panel should get visibly larger');
   assert.ok(Math.abs(geometry110.width-viewport.width)<3,'scaled HUD must still fit viewport');
   console.log('PASS: Playgama desktop HUD physically resizes 80% → 110% in a running game');
   await page.keyboard.press('Escape');
   assert.ok(await page.locator('#modal').evaluate(el=>el.classList.contains('hidden')),'Escape must be reserved for browser fullscreen');
  }
  await page.evaluate(()=>window.__bridgeTrigger('pause',true));
  await page.locator('#resumeBtn').waitFor({state:'visible',timeout:15000});
  await page.evaluate(()=>window.__bridgeTrigger('pause',false));
  await page.waitForFunction(()=>document.querySelector('#modal')?.classList.contains('hidden'),{timeout:15000});
  if(label==='portrait'){
   // Headless Chrome does not consistently grant native fullscreen in an
   // embedded portal. Simulate the standard API's state/event transitions
   // while exercising real click handlers and the actual pause modal.
   await page.evaluate(()=>{
    let fullscreen=false;
    Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>fullscreen?document.documentElement:null});
    document.documentElement.requestFullscreen=async()=>{
     fullscreen=true;document.dispatchEvent(new Event('fullscreenchange'));
    };
    document.exitFullscreen=async()=>{
     fullscreen=false;document.dispatchEvent(new Event('fullscreenchange'));
    };
   });
   await page.locator('#fullscreenBtn').click({timeout:10000});
   assert.equal(await page.locator('#fullscreenBtn').getAttribute('aria-pressed'),'true','fullscreen activates from HUD');
   await page.locator('#pauseBtn').click({timeout:10000});
   const pauseToggle=page.locator('#fullscreenPause');
   await pauseToggle.waitFor({state:'visible',timeout:10000});
   assert.equal(await pauseToggle.count(),1,'one fullscreen toggle in Pause');
   assert.equal(await page.locator('#exitFullscreenPause').count(),0,'no duplicate fullscreen exit button');
   assert.ok((await pauseToggle.innerText()).includes('EXIT FULLSCREEN'));
   // The extra scale panel should be discoverable but not crowd out Pause controls.
   assert.equal(await page.locator('.mobile-scale-fold').count(),1);
   await page.locator('.mobile-scale-fold > summary').click({timeout:10000});
   await page.locator('.mobile-scale-fold [data-view-world="45"]').click({timeout:10000});
   assert.equal(await page.locator('.mobile-scale-fold > summary').innerText(),'DISPLAY SCALE · WORLD 45% · HUD 80%');
   await pauseToggle.click({timeout:10000});
   assert.equal(await page.locator('#fullscreenBtn').getAttribute('aria-pressed'),'false','fullscreen exit must be available from Pause');
   assert.equal(await page.evaluate(()=>document.fullscreenElement),null,'fullscreen must be released after exit click');
   await page.locator('#resumeBtn').click({timeout:10000});
   assert.ok(await page.locator('#modal').evaluate(el=>el.classList.contains('hidden')),'game resumes after leaving fullscreen');
   console.log('PASS: Playgama portrait fullscreen HUD entry and Pause-menu exit');
  }
  assert.equal(pageErrors.length,0,label+' errors after gameplay: '+pageErrors.join(' | '));
  if(label==='desktop'){
   // Finish an actual game run, exercise persist(), and reopen the same game.
   await page.waitForTimeout(1300);
   await page.keyboard.press('p');
   await page.locator('#quitBtn').waitFor({state:'visible',timeout:10000});
   await page.locator('#quitBtn').click();
   await page.waitForFunction(()=>document.querySelector('#modalContent')?.textContent?.includes('Result saved.'),{timeout:10000});
   const resultText=await page.locator('#modalContent').innerText();
   assert.ok(!/[А-Яа-яЁё]/.test(resultText),'English result screen must contain no leftover Russian labels');
   await page.locator('#hangarBtn').click();
   await page.waitForFunction(()=>localStorage.getItem('bridge-test:relictSwarm_v01_save')!==null,{timeout:10000});
   const finished=await page.evaluate(()=>JSON.parse(localStorage.getItem('bridge-test:relictSwarm_v01_save')));
   assert.ok(finished.runs>=1,'actual game finish must persist run count');
   // In the mock Cloud, add representative progress so a reload regression is
   // visible even if an immediate abandoned run earned zero crystals.
   const meaningful={...finished,shards:89,best:357};
   await page.evaluate(value=>window.RelicPlatform.writeStored('relictSwarm_v01_save',JSON.stringify(value)),meaningful);
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('bridge-test:relictSwarm_v01_save')||'null')?.shards===89,{timeout:10000});
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#mainPlay').waitFor({state:'visible',timeout:30000});
   const stored=await page.evaluate(()=>JSON.parse(window.RelicPlatform.readStored('relictSwarm_v01_save')));
   assert.equal(stored.shards,89,'Bridge restore must include crystals');
   assert.equal(stored.best,357,'Bridge restore must include high score');
   assert.equal(stored.runs,finished.runs,'Bridge restore must preserve real run count');
   const home=await page.locator('#modalContent').innerText();
   assert.ok(home.includes('89 crystals'),'menu must display restored crystals');
   assert.ok(home.includes('best score 357'),'menu must display restored score');
   assert.equal(pageErrors.length,0,'reload should not cause script errors: '+pageErrors.join(' | '));
   console.log('PASS: Playgama real run finish, Bridge save and F5 restore (crystals, best score, run count)');
  }
  console.log('PASS: Playgama '+label+' ('+viewport.width+'x'+viewport.height+') interactive startup and pause');
  await context.close();
 }
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
