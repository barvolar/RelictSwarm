import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const adapter=read('src/platform/platform-bridge.js');
const flush=async()=>{for(let i=0;i<9;i++)await Promise.resolve()};

function harness(){
 const calls=[],listeners={},events={};
 const sdk={
  EVENT_NAME:{
   PAUSE_STATE_CHANGED:'pause',
   AUDIO_STATE_CHANGED:'audio',
   REWARDED_STATE_CHANGED:'rewarded'
  },
  platform:{
   language:'ru',isAudioEnabled:true,isPaused:false,
   on(event,handler){listeners[event]=handler},
   sendMessage(message){calls.push(['message',message])}
  },
  advertisement:{
   isInterstitialSupported:true,isRewardedSupported:true,
   on(event,handler){listeners[event]=handler},
   showInterstitial(slot){calls.push(['interstitial',slot])},
   showRewarded(slot){calls.push(['rewarded',slot])}
  },
  storage:{
   set(keys,values){calls.push(['storage',keys,values]);return Promise.resolve()}
  }
 };
 const window={RELICT_PLATFORM:'playgama',RelicPlaygamaData:{relictSwarm_v01_save:'{"runs":2}'},bridge:sdk};
 const document={hidden:false,addEventListener(type,handler){events[type]=handler}};
 const localStorage={getItem(){throw Error('No browser storage allowed')},setItem(){throw Error('No browser storage allowed')}};
 vm.runInNewContext(adapter,{window,document,localStorage,Promise,console},{timeout:3000});
 return {sdk,window,document,calls,listeners,api:window.RelicPlatform};
}

test('bootstrap initializes and loads all persistent keys before the game can run',async()=>{
 const calls=[];
 const keys=['relictSwarm_v01_save','relictSwarm_audio_v1','relictswarm_render_quality','relictswarm_orientation_v1'];
 const sdk={initialize:async()=>{calls.push('initialize')},storage:{get:async(items)=>{
  calls.push('get');assert.deepEqual(Array.from(items),keys);return ['{"runs":3}',null,'minimal','portrait'];
 }}};
 const window={bridge:sdk};
 vm.runInNewContext(read('src/platform/playgama-bootstrap.js'),{window,bridge:sdk,Promise,Error},{timeout:3000});
 await window.RelicPlaygamaBoot;
 assert.deepEqual(calls,['initialize','get']);
 assert.equal(window.RELICT_PLATFORM,'playgama');
 assert.equal(window.RelicPlaygamaData.relictSwarm_v01_save,'{"runs":3}');
 assert.equal(window.RelicPlaygamaData.relictswarm_render_quality,'minimal');
 assert.equal(window.RelicPlaygamaData.relictSwarm_audio_v1,null);
 assert.equal(window.RelicPlaygamaData.relictswarm_orientation_v1,'portrait');
});

test('Playgama adapter uses Bridge Storage, batches writes and sends game_ready once',async()=>{
 const h=harness();
 assert.equal(h.api.provider,'playgama');
 assert.equal(h.api.language,'ru');
 assert.equal(h.api.readStored('relictSwarm_v01_save'),'{"runs":2}');
 assert.equal(h.api.readStored('missing'),null);
 h.api.writeStored('relictSwarm_v01_save','{"runs":4}');
 h.api.writeStored('relictswarm_render_quality','low');
 await flush();
 const write=h.calls.find(e=>e[0]==='storage');
 assert.ok(write);
 assert.deepEqual(Array.from(write[1]),['relictSwarm_v01_save','relictswarm_render_quality']);
 assert.deepEqual(Array.from(write[2]),['{"runs":4}','low']);
 assert.equal(h.window.RelicPlaygamaData.relictSwarm_v01_save,'{"runs":4}');
 h.api.ready();h.api.ready();
 assert.equal(h.calls.filter(e=>e[0]==='message'&&e[1]==='game_ready').length,1);
 h.api.showInterstitial();
 assert.ok(h.calls.some(e=>e[0]==='interstitial'&&e[1]==='run_end'));
});

test('rewarded ad grants only when rewarded, not on closed or failed',()=>{
 const h=harness();
 let awarded=0;
 assert.equal(h.api.showRewarded(()=>awarded++),true);
 assert.equal(h.api.showRewarded(()=>awarded++),false,'one ad at a time');
 h.listeners.rewarded('closed');
 assert.equal(awarded,0);
 assert.equal(h.api.showRewarded(()=>awarded++),true);
 h.listeners.rewarded('rewarded');
 h.listeners.rewarded('rewarded');
 assert.equal(awarded,1);
});

test('host pause and audio states reach game handlers',()=>{
 const h=harness();
 const seen=[];
 h.api.attachGameHandlers({pause:()=>seen.push('pause'),resume:()=>seen.push('resume'),audioState:value=>seen.push(value?'audio-on':'audio-off')});
 assert.deepEqual(seen,['audio-on']);
 h.listeners.pause(true);
 h.listeners.audio(false);
 assert.equal(h.api.isPaused(),true);
 assert.equal(h.api.isAudioEnabled(),false);
 h.listeners.pause(false);
 assert.deepEqual(seen,['audio-on','pause','audio-off','resume']);
});

test('Playgama build has correct SDK order, config and no developer telemetry client',()=>{
 const html=read('dist/playgama/index.html');
 const index=html.indexOf('<script src="https://bridge.playgama.com/v2/stable/playgama-bridge.js"></script>');
 const launch=html.indexOf('window.RelicPlaygamaBoot.then(()=>{');
 assert.ok(index>0&&launch>index);
 assert.ok(index<html.indexOf('bridge.initialize()'));
 assert.ok(html.indexOf('bridge.storage.get(keys)')<launch);
 assert.ok(!html.includes('<script src="./telemetry-config.js"></script>'));
 assert.ok(!html.includes('<script src="./telemetry-client.js"></script>'));
 assert.ok(!html.includes('<script src="/sdk.js"></script>'));
 assert.ok(!html.includes('crazygames-sdk-v3.js'));
 assert.ok(fs.existsSync(new URL('dist/playgama/playgama-bridge-config.json',root)));
 const config=JSON.parse(read('dist/playgama/playgama-bridge-config.json'));
 assert.ok(config.advertisement.interstitial.placements.some(p=>p.id==='run_end'));
 assert.ok(config.advertisement.rewarded.placements.some(p=>p.id==='upgrade_reroll'));
 assert.ok(read('src/modules/40-game/lifecycle/finish.js').includes("showInterstitial?.()"));
 assert.ok(read('src/modules/40-game/upgrades/reroll.js').includes('requestRewardedReroll'));
 assert.ok(!read('src/platform/playgama-privacy.html').includes('workers.dev'));
});
