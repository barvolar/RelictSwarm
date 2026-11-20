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
const mock=`
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
   get(keys){calls.push(['get',keys]);return Promise.resolve(keys.map(()=>null))},
   set(keys,values){calls.push(['set',keys,values]);return Promise.resolve()}
  },
  platform:{
   language:'en',isAudioEnabled:true,isPaused:false,
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
  ['square',{width:540,height:540},true]
 ]){
  const context=await browser.newContext({viewport,isMobile:touch,hasTouch:touch});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.route('https://bridge.playgama.com/**',route=>route.fulfill({status:200,contentType:'text/javascript',body:mock}));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#mainPlay').waitFor({state:'visible',timeout:30000});
  let calls=await page.evaluate(()=>window.__bridgeCalls);
  assert.equal(calls[0][0],'initialize',label+' must initialize Bridge');
  assert.equal(calls[1][0],'get',label+' must restore save before showing menu');
  assert.ok(calls.some(c=>c[0]==='message'&&c[1]==='game_ready'),label+' must report ready');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),label+' page must not scroll horizontally');
  assert.equal(pageErrors.length,0,label+' errors after menu: '+pageErrors.join(' | '));
  await page.locator('#mainPlay').click({timeout:15000});
  await page.locator('#startBtn').waitFor({state:'visible',timeout:15000});
  await page.locator('#startBtn').click({timeout:15000});
  await page.waitForFunction(()=>window.RelicPlatform?.provider==='playgama'&&document.querySelector('#modal')?.classList.contains('hidden'),{timeout:15000});
  if(!touch){
   await page.keyboard.press('p');
   await page.locator('#resumeBtn').waitFor({state:'visible',timeout:15000});
   await page.locator('#resumeBtn').click();
   await page.keyboard.press('Escape');
   assert.ok(await page.locator('#modal').evaluate(el=>el.classList.contains('hidden')),'Escape must be reserved for browser fullscreen');
  }
  await page.evaluate(()=>window.__bridgeTrigger('pause',true));
  await page.locator('#resumeBtn').waitFor({state:'visible',timeout:15000});
  await page.evaluate(()=>window.__bridgeTrigger('pause',false));
  await page.waitForFunction(()=>document.querySelector('#modal')?.classList.contains('hidden'),{timeout:15000});
  assert.equal(pageErrors.length,0,label+' errors after gameplay: '+pageErrors.join(' | '));
  console.log('PASS: Playgama '+label+' ('+viewport.width+'x'+viewport.height+') interactive startup and pause');
  await context.close();
 }
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
