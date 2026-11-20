import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');

test('arena boundary renders over continuous world grid without dark perimeter rectangles',()=>{
 const fills=[],lines=[],strokes=[];
 const context=vm.createContext({
  Math,TAU:Math.PI*2,W:1200,H:800,trainingMode:false,
  cx:{
   save(){},restore(){},translate(){},rotate(){},setLineDash(){},
   strokeRect(...args){strokes.push(args)},fillText(){},
  },
  rect(...args){fills.push(args)},
  line(...args){lines.push(args)},
  seed(){return 0},poly(){},circ(){},glow(){}
 });
 vm.runInContext(read('src/modules/70-render/layers/background.js'),context);
 const zoom=.75,cam=1750,viewH=800/zoom,viewW=1200/zoom;
 vm.runInContext('drawBackground(1750,1750,.75)',context);
 assert.equal(fills.length,1,'only full background fill is allowed: dark edge bands are a regression');
 assert.equal(fills[0][4],'#08111d');
 assert.ok(strokes.length>=3,'energy wall and warning lines must still be visible');
 const sx=cam-viewW/2,sy=cam-viewH/2;
 assert.ok(lines.some(([x1,y1,x2,y2,col])=>col==='#234459'&&x1===x2&&y2>=sy+viewH),
   'accent grid must extend to bottom of zoomed viewport');
 assert.ok(lines.some(([x1,y1,x2,y2,col])=>col==='#234459'&&y1===y2&&x2>=sx+viewW),
   'accent grid must extend to right edge of zoomed viewport');
});

test('flamethrower visual stream follows the displayed nozzle while the player moves and turns',()=>{
 const drone={id:'flame',lvl:1,mods:{},flash:0};
 const position={x:30,y:40};
 const target={x:130,y:40};
 const ctx=vm.createContext({
  Math,TAU:Math.PI*2,ambient:0,S:{t:10,drones:[drone]},
  DRONES:{flame:{color:'#ff8d43'}},
  getDronePos:()=>position,chooseCombatTarget:()=>target,
  wm(){return 0},poly(){},rect(){},glow(){},circ(){},ring(){},line(){},
  cx:{save(){},restore(){},translate(){},rotate(){},scale(){}}
 });
 vm.runInContext(read('src/modules/70-render/layers/drones.js'),ctx);
 vm.runInContext(read('src/modules/70-render/layers/projectile-effects.js'),ctx);
 const fx={type:'flame',owner:drone,x:50,y:40,ang:0,length:205,half:Math.PI/9,life:.35,max:.35};
 ctx.drone=drone;ctx.position=position;ctx.fx=fx;
 vm.runInContext('drawDrone(position,drone,0)',ctx);
 let emitter=vm.runInContext('flameJetPose(fx)',ctx);
 assert.ok(Math.abs(emitter.x-50)<.001&&Math.abs(emitter.y-40)<.001);
 position.x=130;position.y=80;target.x=130;target.y=180;
 vm.runInContext('drawDrone(position,drone,0)',ctx);
 emitter=vm.runInContext('flameJetPose(fx)',ctx);
 assert.ok(Math.abs(emitter.x-130)<.001&&Math.abs(emitter.y-100)<.001,
  'emitter must follow the moving and rotated nozzle');
 assert.equal(fx.x,50,'the original effect coordinates stay unchanged: positioning happens at draw-time');
 ctx.S.drones=[];
 assert.equal(vm.runInContext('flameJetPose(fx)',ctx),null,'orphaned streams disappear when their weapon is removed');
});

test('flamethrower uses one live visual jet and preserves its existing damage cone',()=>{
 const source=read('src/modules/40-game/combat/drone-combat.js');
 assert.ok(source.includes("S.fx.find(f=>f.type==='flame'&&f.owner===d)"),
  'reuse visual jet for each flame weapon instead of accumulating detached old effects');
 assert.ok(source.includes('if(jet)Object.assign(jet,visual);else S.fx.push(visual)'));
 assert.ok(source.includes('if(rr>length+e.r)continue'));
 assert.ok(source.includes('burn:4,burnPower:igniteDps'));
 assert.ok(read('src/modules/70-render/layers/projectile-effects.js').includes('const emitter=jet||fx;'));
});
