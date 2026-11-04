// Dependency-free real Chromium smoke: 32 saved skins must be playable on Canvas.
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';

const skinFile=readFileSync('src/modules/20-core/state/skins.js','utf8');
const match=skinFile.match(/const SKIN_CATALOG=(\[[\s\S]*?\n\]);/);
assert.ok(match,'skin catalog not found');
const skinIds=JSON.parse(match[1]).map(x=>x.id);
assert.equal(skinIds.length,32);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const findChrome=()=>{
 for(const bin of [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser']){
  if(bin&&existsSync(bin))return bin;
 }
 const fallback=spawnSync('which',['google-chrome'],{encoding:'utf8'});
 return fallback.status===0?fallback.stdout.trim():null;
};
const chromePath=findChrome();
assert.ok(chromePath,'Chromium or Google Chrome required for browser smoke');
const browserErrors=[];
let server,chrome,socket,seq=0;
const pending=new Map();
try{
 server=spawn(process.execPath,['scripts/serve.mjs'],{stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:'43173'}});
 chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run','--disable-background-networking','--remote-debugging-port=43174','--user-data-dir=/tmp/relict-browser-smoke-'+process.pid,'--window-size=1365,900','about:blank'],{stdio:['ignore','ignore','pipe']});
 let chromeError='';chrome.stderr.on('data',chunk=>{chromeError+=chunk.toString().slice(0,1500);});chrome.on('error',error=>{chromeError+=' SPAWN '+String(error);});
 console.log('Browser executable:',chromePath);
 const waitHttp=async url=>{
  for(let i=0;i<450;i++){try{const r=await fetch(url);if(r.ok)return await r.json();}catch{}await sleep(100);}
  throw Error('Chrome debugging server not ready: '+url+'; process '+chrome?.exitCode+'; chrome log: '+chromeError.slice(-1800));
 };
 await waitHttp('http://127.0.0.1:43174/json/list');
 let target=(await waitHttp('http://127.0.0.1:43174/json/list')).find(t=>t.type==='page');
 assert.ok(target?.webSocketDebuggerUrl,'No browser target');
 socket=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 socket.addEventListener('message',event=>{
  let msg;try{msg=JSON.parse(event.data);}catch{return;}
  if(msg.id){const p=pending.get(msg.id);if(p){pending.delete(msg.id);msg.error?p.reject(Error(JSON.stringify(msg.error))):p.resolve(msg.result);}}
  if(msg.method==='Runtime.exceptionThrown')browserErrors.push(msg.params?.exceptionDetails?.text||'Unhandled JavaScript exception');
  if(msg.method==='Runtime.consoleAPICalled'&&msg.params.type==='error'){
   const line=(msg.params.args||[]).map(x=>x.value||x.description||'').join(' ');
   if(/Game-loop error|Skin preview render failed/i.test(line))browserErrors.push(line);
  }
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));
 });
 const evaluate=async code=>{
  const result=await send('Runtime.evaluate',{expression:code,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.text+' '+(result.exceptionDetails.exception?.description||''));
  return result.result?.value;
 };
 const waitFor=async(js,desc)=>{
  for(let i=0;i<120;i++){try{if(await evaluate(js))return;}catch{}await sleep(100);}
  throw Error('Timed out waiting for '+desc);
 };
 await send('Runtime.enable');await send('Page.enable');
 await send('Page.navigate',{url:'http://127.0.0.1:43173/?test=1'});
 await waitFor("!!window.__test && !!document.getElementById('mainPlay')",'game main menu');
 await evaluate("localStorage.setItem('relictswarm_ui_locale_v1','ru')"); // Regression: old mobile preferences must not re-enable Russian.
 await evaluate("localStorage.setItem('relictSwarm_v01_save',JSON.stringify({shards:5000,skins:"+JSON.stringify(skinIds)+",skin:'relict',meta:{},threatUnlocked:1}))");
 await send('Page.reload',{ignoreCache:true});
 await waitFor("!!window.__test && !!document.getElementById('mainPlay')",'saved menu');
 const expectEnglish=async stage=>{
  await sleep(100);
  const res=await evaluate("(()=>{const s=document.body.innerText;return {ru:(s.match(/[А-Яа-яЁё]+/g)||[]).slice(0,20),title:document.title,htmlLang:document.documentElement.lang}})()");
  assert.equal(res.htmlLang,'en',stage+' must use English document language');
  assert.deepEqual(res.ru,[],stage+' contains Russian UI: '+res.ru.join(', '));
 };
 await expectEnglish('main menu');
 await evaluate("document.getElementById('mainPlay').click()");
 await expectEnglish('run setup');
 const protocol=await evaluate("document.getElementById('threatMode')?.options[0]?.textContent");
 assert.ok(protocol?.includes('PROTOCOL I'),'difficulty label must not be Russian: '+protocol);
 await evaluate("document.getElementById('backHome').click()");
 await evaluate("document.getElementById('mainSettings').click()");
 await expectEnglish('settings');
 assert.equal(await evaluate("!!document.getElementById('langBtn')"),false,'English-only build must not offer RU switch');
 await expectEnglish('settings with old RU preference');
 await evaluate("document.getElementById('backHome').click()");
 await evaluate("document.getElementById('mainUpgrade').click()");
 await expectEnglish('upgrade hangar');
 await evaluate("document.getElementById('tabSkins').click()");
 await expectEnglish('skin showroom');

 const shop=await evaluate("({cards:document.querySelectorAll('.skin-card').length,previews:document.querySelectorAll('.skin-card img.skin-canvas-preview').length,unique:new Set([...document.querySelectorAll('.skin-card img.skin-canvas-preview')].map(x=>x.src)).size})");
 assert.equal(shop.cards,32,'expected every skin in shop');
 assert.equal(shop.previews,32,'all shop previews must be rendered using real robot Canvas');
 assert.equal(shop.unique,32,'shop previews should not all look identical');
 await evaluate("document.getElementById('backHome').click()");
 for(const [index,id] of skinIds.entries()){
  await waitFor("!!window.__test && !!document.getElementById('mainPlay')",'game menu before skin '+id);
  await evaluate("window.__test.chooseSkin("+JSON.stringify(id)+");document.getElementById('mainPlay').click();document.getElementById('startBtn').click()");
  await sleep(250);
  const status=await evaluate("(()=>{const c=document.getElementById('world'),ctx=c.getContext('2d'),x=Math.floor(c.width/2),y=Math.floor(c.height/2),d=ctx.getImageData(x-38,y-38,76,76).data;let bright=0;for(let i=0;i<d.length;i+=4)if(d[i]+d[i+1]+d[i+2]>290)bright++;return {mode:window.__test.mode(),skin:window.__test.skin(),frames:window.__test.frames(),bright};})()");
  assert.equal(status.skin,id,'wrong equipped skin at '+id);
  assert.equal(status.mode,'playing','game loop paused or failed with '+id);
  assert.ok(status.bright>5,'player has no visible bright pixels in center for '+id+': '+JSON.stringify(status));
  assert.equal(browserErrors.length,0,'Browser error during '+id+': '+browserErrors.join('\n'));
  if(index!==skinIds.length-1){await send('Page.reload',{ignoreCache:true});}
 }
 console.log('PASS: all 32 distinct shop previews and all 32 skins rendered in playable runs on real Chromium Canvas');
}finally{
 for(const p of pending.values())p.reject(new Error('Browser smoke shutting down'));
 try{socket?.close()}catch{}
 try{chrome?.kill('SIGKILL')}catch{}
 try{server?.kill('SIGKILL')}catch{}
}
