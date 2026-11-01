import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const bridge=read('src/platform/platform-bridge.js');
const flush=async()=>{for(let i=0;i<3;i++)await Promise.resolve();};

function scenario(provider='yandex'){
 const calls=[],events={},documentEvents={};
 const sdk={
  features:{
   LoadingAPI:{ready(){calls.push('ready')}},
   GameplayAPI:{
    start(){calls.push('start')},
    stop(){calls.push('stop')}
   }
  },
  environment:{i18n:{lang:'en'}},
  on(name,cb){events[name]=cb}
 };
 const window={
  RELICT_PLATFORM:provider,
  YaGames:{init:()=>{calls.push('init');return Promise.resolve(sdk)}}
 };
 const document={hidden:false,addEventListener(name,cb){documentEvents[name]=cb}};
 const context=vm.createContext({window,document,console,Promise});
 vm.runInContext(bridge,context,{timeout:3000});
 return {calls,events,documentEvents,document,window,api:window.RelicPlatform,sdk};
}
test('Yandex adapter sends Game Ready only once game menu is interactive',async()=>{
 const s=scenario();
 assert.equal(s.api.provider,'yandex');
 assert.ok(!s.calls.includes('ready'));
 await flush();
 assert.ok(s.calls.includes('init'));
 assert.equal(s.api.language,'en');
 assert.ok(!s.calls.includes('ready'));
 s.api.ready();
 assert.equal(s.calls.filter(x=>x==='ready').length,1);
});
test('Yandex gameplay start/stop matches menu, modal and external pauses',async()=>{
 const s=scenario();
 const paused=[],resumed=[];
 s.api.attachGameHandlers({pause:()=>paused.push('paused'),resume:()=>resumed.push('resumed')});
 s.api.syncGameplay(true);
 await flush();
 assert.equal(s.calls.filter(x=>x==='start').length,1);
 s.api.syncGameplay(false);
 assert.equal(s.calls.filter(x=>x==='stop').length,1);
 s.api.syncGameplay(true);
 s.events.game_api_pause();
 assert.equal(s.api.isPaused(),true);
 assert.equal(s.calls.at(-1),'stop');
 assert.equal(paused.length,1);
 s.events.game_api_resume();
 assert.equal(s.api.isPaused(),false);
 assert.equal(resumed.length,1);
 assert.equal(s.calls.at(-1),'start');
 s.document.hidden=true;s.documentEvents.visibilitychange();
 assert.equal(s.calls.at(-1),'stop');
 s.document.hidden=false;s.documentEvents.visibilitychange();
 assert.equal(s.calls.at(-1),'start');
});
test('pre-initialization Game Ready and a platform pause are deferred until SDK is ready',async()=>{
 const s=scenario();
 const pauses=[];
 s.api.ready();
 s.api.syncGameplay(true);
 s.api.attachGameHandlers({pause:()=>pauses.push(1)});
 await flush();
 assert.equal(s.calls.filter(x=>x==='ready').length,1);
 assert.equal(s.calls.filter(x=>x==='start').length,1);
 s.events.game_api_pause();
 s.api.attachGameHandlers({pause:()=>pauses.push(2)});
 assert.equal(pauses.at(-1),2);
});
test('GitHub Pages web edition does not initialize SDK or call advertising',async()=>{
 const s=scenario('web');
 s.api.ready();s.api.syncGameplay(true);await flush();
 assert.deepEqual(s.calls,[]);
 assert.equal(s.api.provider,'web');
 assert.equal(s.api.sdkAvailable,false);
});
test('Yandex edition uses mandatory relative SDK path and keeps Pages edition clean',()=>{
 const web=read('dist/index.html'),yandex=read('dist/yandex/index.html');
 assert.ok(web.includes('RelicPlatform'));
 assert.ok(!web.includes('<script src="/sdk.js"></script>'));
 assert.ok(yandex.includes('<script src="/sdk.js"></script>'));
 assert.ok(yandex.includes('window.RELICT_PLATFORM="yandex"'));
 assert.ok(yandex.indexOf('<script src="/sdk.js"></script>')<yandex.indexOf("YaGames.init()"));
 assert.ok(!yandex.includes('https://sdk.games.s3.yandex.net/sdk.js'));
 for(const f of ['telemetry-client.js','telemetry-config.js'])assert.ok(fs.existsSync(new URL('dist/yandex/'+f,root)));
 assert.ok(!yandex.includes('%%RELICT_'));
});
test('game lifecycle hooks platform signals without disturbing the gameplay state',()=>{
 const state=read('src/modules/40-game/training/simulation.js');
 const startup=read('src/modules/90-bootstrap/start.js');
 const loop=read('src/modules/90-bootstrap/game-loop.js');
 assert.ok(state.includes("window.RelicPlatform?.syncGameplay(m==='playing')"));
 assert.ok(startup.includes("window.RelicPlatform?.ready()"));
 assert.ok(startup.includes("window.RelicPlatform?.attachGameHandlers"));
 assert.ok(startup.includes("audio.suspend()"));
 assert.ok(startup.includes("audio.resume()"));
 assert.ok(loop.includes("!window.RelicPlatform?.isPaused()"));
});
