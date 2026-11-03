import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const src=['src/modules/20-core/state/skins.js','src/modules/70-render/layers/skin-cosmetics.js','src/modules/70-render/layers/robot.js','src/modules/50-ui/pages/main-menu.js'].map(read).join('\n');
const drawNames=['poly','circ','line','glow','rect','ring'];
function makeContext(){
 const calls={rotate:0};
 const canvas={save(){},restore(){},translate(){},scale(...args){assert.equal(args.length,2,'CanvasRenderingContext2D.scale requires scaleX and scaleY');assert.ok(args.every(Number.isFinite),'Canvas scale arguments must be finite');},rotate(){calls.rotate++;},
  beginPath(){},arc(){},stroke(){},fill(){},moveTo(){},lineTo(){},closePath(){},fillRect(){},setLineDash(){}};
 const context=vm.createContext({Math,TAU:Math.PI*2,BLUE:'#6dbbff',AMBER:'#ffbf70',cx:canvas,
  S:{rageTimer:0,invulnTimer:0},
  ambient:1.3,
  ...Object.fromEntries(drawNames.map(key=>[key,()=>{}]))});
 vm.runInContext(src+';globalThis.testSkinIds=Object.keys(SKINS)',context);
 return {context,calls};
}
test('all 32 real gameplay skins render at several angles without throwing',()=>{
 const {context}=makeContext();
 assert.equal(context.testSkinIds.length,32);
 for(const skinId of context.testSkinIds){
  for(const dir of [[0,-1],[0,1],[1,0],[-1,0]]){
   vm.runInContext('skinVisualOverride=SKINS['+JSON.stringify(skinId)+'];drawRobot({x:0,y:0,dx:'+dir[0]+',dy:'+dir[1]+',inv:0});',context);
  }
 }
});
test('all 32 skins produce valid distinct shop previews, including animated rings',()=>{
 const {context}=makeContext();
 const outputs=context.testSkinIds.map(id=>vm.runInContext('skinSvg('+JSON.stringify(id)+')',context));
 assert.equal(outputs.length,32);
 for(const s of outputs)assert.ok(s.includes('<svg')&&s.includes('</svg>'));
 const base=outputs[0],rare=outputs[16],epic=outputs[24],legend=outputs[31];
 assert.ok(!base.includes('skin-rotator'));
 assert.ok(!rare.includes('skin-rotator'));
 assert.ok(epic.includes('skin-rotator'));
 assert.ok(legend.includes('skin-rotator'));
});
