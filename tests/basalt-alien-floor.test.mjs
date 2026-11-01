import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../src/modules/70-render/layers/background.js',import.meta.url),'utf8');

function drawSample(camX=0,camY=0,zoom=1){
 const fills=[],strokes=[],rects=[],borders=[],labels=[],paths=[];
 const cx={
  save(){},restore(){},translate(){},rotate(){},
  beginPath(){paths.push([]);},moveTo(x,y){paths.at(-1)?.push([x,y]);},
  lineTo(x,y){paths.at(-1)?.push([x,y]);},closePath(){},
  fill(){fills.push(this.fillStyle);},stroke(){strokes.push({color:this.strokeStyle,width:this.lineWidth});},
  fillRect(x,y,w,h){rects.push({color:this.fillStyle,x,y,w,h});},
  strokeRect(...p){borders.push(p);},setLineDash(){},
  fillText(text){labels.push(text);}
 };
 const ctx=vm.createContext({
  W:960,H:540,cx,Math,TAU:Math.PI*2,trainingMode:false,
  rect(){},line(){},ring(){},
  seed(x,y){const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);}
 });
 vm.runInContext(source+';drawBackground('+camX+','+camY+','+zoom+');',ctx);
 return {fills,strokes,rects,borders,labels,paths};
}

test('basalt arena has varied irregular rocks and subtle cracks, not a regular grid',()=>{
 const scene=drawSample();
 const rockColors=['#131b26','#171e29','#1b222d','#121a24'];
 assert.ok(scene.rects.some(r=>r.color==='#0e141e'),'basalt ground must fully cover the viewport');
 assert.ok(scene.fills.length>20,'rock fragments should cover the visible arena');
 assert.ok(scene.fills.every(color=>rockColors.includes(color)),'rock shades remain restrained');
 assert.ok(new Set(scene.fills).size>=3,'rock patches vary instead of repeating a flat tile');
 assert.ok(scene.paths.some(p=>p.length>=7),'stone outlines should be irregular polygons');
 assert.ok(scene.strokes.some(s=>s.color==='#2b313c'),'dark fissure lines should be present');
 assert.ok(scene.strokes.some(s=>s.color==='#865aa7'),'rare violet fissures should be present');
 assert.ok(scene.strokes.length<600,'floor path budget remains bounded on desktop');
 assert.ok(!source.includes('const sectorSize=680'),'old sparse tactical circle pattern must be gone');
 assert.ok(!source.includes('tileRadius'),'old hex plate geometry must be gone');
});

test('basalt floor stays covered during camera movement and mobile zoom',()=>{
 for(const [camX,camY,zoom] of [[0,0,1],[-1250,820,.52],[1450,-1400,.82]]){
  const scene=drawSample(camX,camY,zoom);
  const floor=scene.rects.find(r=>r.color==='#0e141e');
  assert.ok(floor,'dark continuous ground must exist');
  assert.ok(floor.w>=960/zoom && floor.h>=540/zoom);
  assert.ok(scene.fills.length<300,'mobile floor does not expand into an unbounded draw budget');
 }
});

test('perimeter and old training sector remain unchanged',()=>{
 const scene=drawSample(1690,0,.52);
 assert.equal(scene.borders.length,3);
 assert.ok(scene.labels.some(label=>label.includes('ГРАНИЦА СЕКТОРА')));
 assert.ok(source.includes('if(trainingMode)'));
 assert.ok(source.includes('ИСПЫТАТЕЛЬНЫЙ СЕКТОР // 08'));
});
