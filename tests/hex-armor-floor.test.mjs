import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../src/modules/70-render/layers/background.js',import.meta.url),'utf8');

function drawSample(camX=0,camY=0,zoom=1){
 const fills=[],strokes=[],calls={path:0};
 const cx={
  save(){},restore(){},translate(){},
  beginPath(){calls.path++;},moveTo(){},lineTo(){},closePath(){},
  fill(){fills.push(this.fillStyle);},stroke(){strokes.push(this.strokeStyle);},
  fillRect(){},strokeRect(){},setLineDash(){},fillText(){}
 };
 const ctx=vm.createContext({
  W:960,H:540,cx,Math,trainingMode:false,
  rect(){},line(){},ring(){},
  seed(x,y){const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);}
 });
 vm.runInContext(source+';drawBackground('+camX+','+camY+','+zoom+');',ctx);
 return {fills,strokes,calls};
}

test('classic arena floor consists of dark graphite hex armor plates with cyan seams',()=>{
 const result=drawSample();
 assert.ok(result.fills.length>24,'hex plates should fill the visible arena');
 assert.ok(result.fills.every(color=>['#0b1824','#0d1c29','#10212f'].includes(color)));
 assert.ok(result.strokes.includes('#28616c'),'turquoise hex seams should remain visible');
 assert.ok(result.strokes.includes('#193440'),'each armor tile should have a recessed bevel');
 assert.equal(result.calls.path>=result.fills.length*2,true);
 assert.ok(!source.includes('let gx=Math.floor(sx/80)'),'old rectangular grid must be removed');
});

test('floor rendering covers zoomed/mobile camera and preserves classic sector perimeter',()=>{
 const result=drawSample(-1000,920,.52);
 assert.ok(result.fills.length>50,'zoomed camera still sees enough tiles');
 assert.ok(source.includes('⚠ ГРАНИЦА СЕКТОРА'));
 assert.ok(source.includes('if(trainingMode)'),'training markings must remain untouched');
});
