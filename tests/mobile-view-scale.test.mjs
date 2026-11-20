import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=(path)=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('src/modules/20-core/state/mobile-view-scale.js');

function context(initial=null){
 const writes=[],css=new Map(),classes=new Set(),events=new Map();
 const document={
  documentElement:{
   classList:{add(value){classes.add(value)}},
   style:{setProperty(key,value){css.set(key,value)}}
  },
  querySelector:()=>null,
  querySelectorAll:()=>[]
 };
 const bridge={
  readStored:(key)=>{assert.equal(key,'relictswarm_mobile_scale_v1');return initial;},
  writeStored:(key,value)=>writes.push({key,value})
 };
 const globals={isPlaygama:true,touching:true,document,window:{RelicPlatform:bridge},
  innerWidth:1280,innerHeight:576,
  console,JSON,Math,Number,String,
  addEventListener:(name,fn)=>events.set(name,fn),
  setTimeout:fn=>{fn();return 1}
 };
 const ctx=vm.createContext(globals);
 vm.runInContext(source,ctx,{timeout:3000});
 return {ctx,writes,css,classes,events};
}
const run=(h,js)=>vm.runInContext(js,h.ctx,{timeout:3000});
test('Playgama test defaults match requested landscape world 35 and HUD 80',()=>{
 const h=context();
 assert.equal(run(h,'mobileScaleWorldZoom()'),.35);
 assert.equal(h.css.get('--rs-mobile-hud-scale'),'0.8');
 assert.ok(h.classes.has('playgama-scale-enabled'));
 const html=run(h,'mobileScaleSettingsHTML()');
 assert.ok(html.includes('35%')&&html.includes('110%'));
 assert.ok(html.includes('LANDSCAPE'));
 assert.ok(html.includes('aria-pressed="true"'));
 assert.equal((html.match(/data-view-world=/g)||[]).length,8);
 assert.equal((html.match(/data-view-hud=/g)||[]).length,6);
});
test('scale choices persist per orientation and invalid values are rejected',()=>{
 const h=context();
 assert.equal(run(h,"setMobileScale('world',45)"),true);
 assert.equal(run(h,"setMobileScale('hud',90)"),true);
 assert.equal(run(h,'mobileScaleWorldZoom()'),.45);
 assert.equal(h.css.get('--rs-mobile-hud-scale'),'0.9');
 h.ctx.innerWidth=390;h.ctx.innerHeight=844;
 run(h,'syncMobileScaleCSS()');
 assert.equal(run(h,'mobileScaleWorldZoom()'),.55,'portrait uses its own profile');
 assert.equal(h.css.get('--rs-mobile-hud-scale'),'0.8');
 run(h,"setMobileScale('world',35)");
 assert.equal(run(h,'mobileScaleWorldZoom()'),.35);
 assert.equal(run(h,"setMobileScale('world',5)"),false);
 assert.equal(run(h,"setMobileScale('hud',30)"),false);
 const stored=JSON.parse(h.writes.at(-1).value);
 assert.equal(stored.landscape.world,45);
 assert.equal(stored.landscape.hud,90);
 assert.equal(stored.portrait.world,35);
 assert.equal(stored.portrait.hud,80);
 const fresh=context(JSON.stringify(stored));
 assert.equal(run(fresh,'mobileScaleWorldZoom()'),.45);
 fresh.ctx.innerWidth=390;fresh.ctx.innerHeight=844;
 assert.equal(run(fresh,'mobileScaleWorldZoom()'),.35);
});
test('main game uses mobile preferences without affecting desktop or other editions',()=>{
 const overlays=read('src/modules/70-render/layers/overlays.js');
 const h=context();
 vm.runInContext(overlays,h.ctx);
 assert.equal(run(h,'arenaZoom()'),.35);
 h.ctx.touching=false;
 assert.equal(run(h,'arenaZoom()'),1);
 const other=vm.createContext({touching:true,W:1280,H:576,isPlaygama:false});
 vm.runInContext(overlays,other);
 assert.equal(vm.runInContext('arenaZoom()',other),.73);
});
test('HUD scale applies to both mobile orientation layouts and preserves click geometry',()=>{
 const css=read('src/styles/sections/fullscreen-portrait.css');
 assert.match(css,/html\.playgama-scale-enabled #hud \.hud-dock/);
 assert.match(css,/width:calc\(100% \/ var\(--rs-mobile-hud-scale, \.8\)\)/);
 assert.match(css,/transform-origin:top left/);
 assert.match(css,/html\.playgama-scale-enabled #touchControls \.dash/);
 const menu=read('src/modules/50-ui/pages/settings.js');
 const pause=read('src/modules/40-game/lifecycle/pause-and-notices.js');
 assert.match(menu,/\$\{mobileScaleSettingsHTML\(\)\}/);
 assert.match(menu,/bindMobileScaleSettings\(\)/);
 assert.equal((pause.match(/\$\{mobileScaleSettingsHTML\(\)\}/g)||[]).length,2);
 assert.equal((pause.match(/bindMobileScaleSettings\(\)/g)||[]).length,2);
});
