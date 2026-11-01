import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../src/modules/70-render/layers/background.js',import.meta.url),'utf8');

function drawSample(camX=0,camY=0,zoom=1,trainingMode=false){
 const painted=[],arcs=[],strokes=[],borders=[],labels=[];
 const cx={
  save(){},restore(){},translate(){},rotate(){},
  beginPath(){},moveTo(){},lineTo(){},closePath(){},
  arc(x,y,r,start,end){arcs.push({x,y,r,start,end});},
  fill(){},stroke(){strokes.push(this.strokeStyle);},
  fillRect(x,y,w,h){painted.push({color:this.fillStyle,x,y,w,h});},
  strokeRect(...args){borders.push(args);},setLineDash(){},
  fillText(text){labels.push(text);}
 };
 const ctx=vm.createContext({
  W:960,H:540,cx,Math,TAU:Math.PI*2,trainingMode,
  rect(){},line(){},ring(){},
  seed(x,y){const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);}
 });
 vm.runInContext(source+';drawBackground('+camX+','+camY+','+zoom+');',ctx);
 return {painted,arcs,strokes,borders,labels};
}

test('minimal tactical floor is opaque navy and contains sparse low-contrast circular markings',()=>{
 const scene=drawSample();
 assert.ok(scene.painted.some(p=>p.color==='#0a1723'),'floor should fill the entire camera viewport');
 assert.ok(scene.arcs.length>0,'world-anchored tactical marks should be present');
 assert.ok(scene.strokes.includes('#1e4451'),'thin dark cyan guide circles should appear');
 assert.ok(scene.strokes.includes('#2a6670'),'subtle partial cyan arcs should appear');
 assert.ok(scene.arcs.length<100,'minimalistic floor must remain sparse');
 assert.ok(!source.includes('tileRadius'),'old hex tiles must be gone');
 assert.ok(!source.includes('let gx=Math.floor(sx/80)'),'original square grid must remain gone');
});

test('mobile zoom and camera translation keep a covered floor',()=>{
 for(const [camX,camY,zoom] of [[0,0,1],[-1250,820,.52],[1450,-1400,.82]]){
  const scene=drawSample(camX,camY,zoom);
  const floor=scene.painted.find(p=>p.color==='#0a1723');
  assert.ok(floor,'floor is drawn for all viewports');
  assert.ok(floor.w>=960/zoom && floor.h>=540/zoom,'floor covers the full zoomed viewport');
 }
});

test('original perimeter and training marks are untouched',()=>{
 const nearEdge=drawSample(1690,0,.52);
 assert.equal(nearEdge.borders.length,3,'arena border keeps three warning strokes');
 assert.ok(nearEdge.labels.some(text=>text.includes('ГРАНИЦА СЕКТОРА')));
 assert.ok(source.includes('if(trainingMode)'),'training overlay must remain');
 assert.ok(source.includes('ИСПЫТАТЕЛЬНЫЙ СЕКТОР // 08'));
});
