import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const bridge=read('src/platform/platform-bridge.js');
const microtasks=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
function harness(environment='local',available=true){
 const calls=[],events={};
 const SDK={
  environment,
  init(){calls.push('init');return Promise.resolve();},
  game:{
   loadingStart(){calls.push('loadingStart');},
   loadingStop(){calls.push('loadingStop');},
   gameplayStart(){calls.push('gameplayStart');},
   gameplayStop(){calls.push('gameplayStop');}
  }
 };
 const document={hidden:false,addEventListener(name,cb){events[name]=cb}};
 const window={RELICT_PLATFORM:'crazygames',CrazyGames:available?{SDK}:undefined};
 vm.runInNewContext(bridge,{window,document,console,Promise},{timeout:3000});
 return {SDK,calls,document,window,events,api:window.RelicPlatform};
}
test('SDK v3 initializes asynchronously, loading ends when the game menu becomes ready',async()=>{
 const h=harness();
 assert.equal(h.api.provider,'crazygames');
 assert.equal(h.api.sdkAvailable,false);
 h.api.ready();
 h.api.syncGameplay(true);
 await microtasks();
 assert.deepEqual(h.calls,['init','loadingStart','loadingStop','gameplayStart']);
 assert.equal(h.api.sdkAvailable,true);
 h.api.ready();
 assert.equal(h.calls.filter(c=>c==='loadingStop').length,1);
 h.api.syncGameplay(false);
 assert.equal(h.calls.at(-1),'gameplayStop');
 h.api.syncGameplay(true);
 assert.equal(h.calls.at(-1),'gameplayStart');
});
test('menu loading and active gameplay are independent of tab focus as CrazyGames requires',async()=>{
 const h=harness();
 await microtasks();
 assert.deepEqual(h.calls,['init','loadingStart']);
 h.api.syncGameplay(true);
 assert.equal(h.calls.at(-1),'gameplayStart');
 h.document.hidden=true;
 h.events.visibilitychange();
 assert.equal(h.calls.at(-1),'gameplayStart','CrazyGames handles window focus itself');
 h.api.ready();
 assert.equal(h.calls.at(-1),'loadingStop');
 h.api.syncGameplay(false);
 assert.equal(h.calls.at(-1),'gameplayStop');
});
test('SDK disabled off CrazyGames never triggers SDK calls or halts the game',async()=>{
 const h=harness('disabled');
 h.api.ready();h.api.syncGameplay(true);
 await microtasks();
 assert.deepEqual(h.calls,[]);
 assert.equal(h.api.sdkAvailable,false);
 const absent=harness('local',false);
 absent.api.ready();
 await microtasks();
 assert.equal(absent.api.sdkAvailable,false);
});
test('CrazyGames bundle contains only the v3 SDK; other platform builds stay independent',()=>{
 const cg=read('dist/crazygames/index.html');
 const ya=read('dist/yandex/index.html');
 const web=read('dist/index.html');
 const sdk='https://sdk.crazygames.com/crazygames-sdk-v3.js';
 assert.ok(cg.includes('<script src="'+sdk+'"></script>'));
 assert.ok(cg.includes('window.RELICT_PLATFORM="crazygames"'));
 assert.ok(cg.indexOf('<script src="'+sdk+'"></script>')<cg.indexOf("crazy.init()"));
 assert.ok(!cg.includes('<script src="/sdk.js"></script>'));
 assert.ok(!cg.includes('[ 10.15: ONLINE TEST ]'));
 assert.ok(!cg.includes('%%RELICT_'));
 assert.ok(!web.includes(sdk),'GitHub Pages must not download platform SDK');
 assert.ok(!ya.includes(sdk),'Yandex edition must not depend on CrazyGames');
 assert.ok(ya.includes('<script src="/sdk.js"></script>'));
 for(const p of ['telemetry-client.js','telemetry-config.js'])assert.ok(fs.existsSync(new URL('dist/crazygames/'+p,root)));
 const size=['index.html','telemetry-client.js','telemetry-config.js']
   .reduce((total,p)=>total+fs.statSync(new URL('dist/crazygames/'+p,root)).size,0);
 assert.ok(size<=20*1024*1024,'CrazyGames mobile initial download must stay <=20MB');
});
test('platform calls are wired to the real game mode, without adding monetization for Basic Launch',()=>{
 const code=read('src/modules/40-game/training/simulation.js');
 assert.ok(code.includes("window.RelicPlatform?.syncGameplay(m==='playing')"));
 assert.ok(!bridge.includes('.requestAd('),'Basic Launch has ads disabled');
});
