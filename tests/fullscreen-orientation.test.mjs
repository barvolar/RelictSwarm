import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const fullscreen=read('src/modules/20-core/input/fullscreen.js');
const overlays=read('src/modules/70-render/layers/overlays.js');
const portraitCss=read('src/styles/sections/fullscreen-portrait.css');
const template=read('src/index.template.html');

function harness(){
 const events={},buttons={},notices=[];
 for(const id of ['fullscreenBtn','mainFullscreen','fullscreenSettings','fullscreenPause']){
  buttons[id]={textContent:'',title:'',setAttribute(key,value){this[key]=value},addEventListener(type,fn){this[type]=fn}};
 }
 buttons.fullscreenStatus={textContent:'',classList:{add:v=>notices.push(v),remove:()=>{}}};
 const document={
  fullscreenElement:null,
  documentElement:{
   requestFullscreen(){document.fullscreenElement=this;return Promise.resolve()}
  },
  exitFullscreen(){document.fullscreenElement=null;return Promise.resolve()},
  addEventListener(type,fn){events[type]=fn}
 };
 let resets=0,resizes=0;
 const window={visualViewport:{addEventListener(type,fn){events['visual:'+type]=fn}}};
 const context=vm.createContext({
  document,window,locale:'en',console,
  $:id=>buttons[id]||null,
  addEventListener(type,fn){events[type]=fn},
  resetFloatingJoy:()=>resets++,
  resize:()=>resizes++,
  requestAnimationFrame:fn=>fn(),
  setTimeout:()=>1,
  clearTimeout:()=>{}
 });
 vm.runInContext(fullscreen,context);
 return {document,window,buttons,notices,events,context,get resets(){return resets},get resizes(){return resizes}};
}

test('fullscreen is an explicit reversible player action and never locks orientation',async()=>{
 const h=harness();
 assert.equal(h.buttons.fullscreenBtn.textContent,'⛶');
 assert.equal(await vm.runInContext('toggleFullscreen()',h.context),true);
 assert.equal(h.document.fullscreenElement,h.document.documentElement);
 assert.equal(h.buttons.fullscreenBtn.textContent,'⤡');
 assert.equal(h.buttons.fullscreenBtn['aria-pressed'],'true');
 assert.equal(await vm.runInContext('toggleFullscreen()',h.context),true);
 assert.equal(h.document.fullscreenElement,null);
 assert.equal(h.buttons.fullscreenBtn['aria-pressed'],'false');
 h.events.orientationchange();
 assert.equal(h.resets,1);
 assert.ok(h.resizes>=3);
 assert.doesNotMatch(fullscreen,/orientation\.lock\s*\(/);
});

test('unsupported fullscreen gives a nonblocking notice, game remains accessible',async()=>{
 const h=harness();
 h.document.documentElement.requestFullscreen=undefined;
 assert.equal(await vm.runInContext('toggleFullscreen()',h.context),false);
 assert.match(h.buttons.fullscreenStatus.textContent,/Fullscreen unavailable/);
 assert.ok(h.notices.includes('visible'));
});

test('portrait mobile camera is larger and landscape zoom is unchanged',()=>{
 const ctx=vm.createContext({touching:true,W:390,H:844});
 vm.runInContext(overlays,ctx);
 assert.equal(vm.runInContext('arenaZoom()',ctx),.72);
 vm.runInContext('W=844;H=390',ctx);
 assert.equal(vm.runInContext('arenaZoom()',ctx),.82);
 vm.runInContext('touching=false',ctx);
 assert.equal(vm.runInContext('arenaZoom()',ctx),1);
});

test('portrait layout, controls and all three release HTML files contain fullscreen',()=>{
 assert.match(template,/id="fullscreenBtn"/);
 assert.match(template,/id="fullscreenStatus"/);
 assert.match(portraitCss,/@media\(orientation:portrait\) and \(max-width:700px\)/);
 assert.match(portraitCss, /#hud \.hud-loadout/);
 assert.match(portraitCss, /#touchControls \.dash/);
 assert.match(read('src/module-order.json'),/20-core\/input\/fullscreen\.js/);
 assert.match(read('src/style-order.json'),/sections\/fullscreen-portrait\.css/);
 for(const build of ['dist/index.html','dist/crazygames/index.html','dist/yandex/index.html']){
  const html=read(build);
  assert.match(html,/id="fullscreenBtn"/);
  assert.match(html,/fullscreenStatus/);
  assert.match(html,/function toggleFullscreen\(/);
  assert.match(html,/orientationchange/);
 }
});

test('CrazyGames uses platform fullscreen and hides all custom game fullscreen controls',async()=>{
 const cg=read('dist/crazygames/index.html');
 const normal=read('dist/index.html');
 assert.match(cg,/id="crazygames-fullscreen-controls"/);
 assert.match(cg,/#fullscreenBtn,#mainFullscreen,#fullscreenSettings,#fullscreenPause/);
 assert.match(cg,/\.settings-action:has\(#fullscreenSettings\)/);
 assert.doesNotMatch(normal,/crazygames-fullscreen-controls/);
 const h=harness();
 h.window.RELICT_PLATFORM='crazygames';
 assert.equal(await vm.runInContext('toggleFullscreen()',h.context),false);
 assert.equal(h.document.fullscreenElement,null);
});
