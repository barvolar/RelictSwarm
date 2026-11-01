// Reactor Refit: world-anchored industrial deck. No texture downloads or gameplay edits.
// Objects are deterministic in world space so movement cannot make panels shimmer.
function deckPlate(x,y,s){
 const n=seed(x*.17+7,y*.19+31),b=seed(x*.23-9,y*.29+19);
 rect(x+3,y+3,s-6,s-6,n>.54?'#14212a':'#111d26');
 cx.strokeStyle=n>.5?'#2b3d47':'#26333e';cx.lineWidth=1;
 cx.strokeRect(x+5.5,y+5.5,s-11,s-11);
 // Recessed maintenance channels replace the former bright global grid.
 if(n>.38){
  rect(x+17,y+17,s-34,3,'#1d313e');
  rect(x+17,y+20,s-34,1,'#09131b');
 }
 if(n>.73){
  rect(x+16,y+s-33,s-32,14,'#0a141d');
  for(let k=0;k<5;k++)rect(x+23+k*(s-48)/5,y+s-30,(s-48)/8,7,'#2f4651');
 }
 if(b>.78){
  // Static amber warning paint, separated from actual red attack telegraphs.
  rect(x+s-25,y+13,5,44,'#ae793d');
  rect(x+s-18,y+13,2,44,'#5a4832');
 }
 circ(x+10,y+10,1.7,'#41525b');
 circ(x+s-11,y+s-11,1.7,'#41525b');
}
function drawReactorSeal(x,y,r,index){
 cx.save();cx.translate(x,y);
 circ(0,0,r,'#0c1821','#39505d',3);
 ring(0,0,r-9,'#2a4c57',2);
 ring(0,0,r*.6,'#253f4d',3);
 cx.setLineDash([7,13]);ring(0,0,r*.79,'#7b7460',2);cx.setLineDash([]);
 for(let k=0;k<8;k++){
  const a=k*TAU/8;
  cx.save();cx.rotate(a);
  rect(-5,-r+14,10,22,k%2?'#805a34':'#a16d34');
  line(0,-r+40,0,-r+55,'#496679',2);
  cx.restore();
 }
 poly([[-24,-6],[0,-28],[24,-6],[17,22],[-17,22]],'#22343d','#72818b',2);
 circ(0,0,11,'#1d4e54','#8dc7b7',2);
 circ(0,0,4,'#d6c58b');
 cx.font='bold 10px monospace';cx.textAlign='center';cx.fillStyle='#8b9a94';
 cx.fillText('RX-'+String(index).padStart(2,'0'),0,r+19);
 cx.restore();
}
function drawBackground(camX,camY,zoom=1){
 rect(0,0,W,H,'#080e14');
 const viewW=W/zoom,viewH=H/zoom,sx=camX-viewW/2,sy=camY-viewH/2;
 const tile=192;
 cx.save();cx.translate(W/2-camX,H/2-camY);
 rect(sx-16,sy-16,viewW+32,viewH+32,'#0b141c');
 const minX=Math.floor((sx-10)/tile),maxX=Math.ceil((sx+viewW+10)/tile);
 const minY=Math.floor((sy-10)/tile),maxY=Math.ceil((sy+viewH+10)/tile);
 for(let ix=minX;ix<=maxX;ix++)for(let iy=minY;iy<=maxY;iy++){
  const x=ix*tile,y=iy*tile;
  deckPlate(x,y,tile);
  // Maintenance numbering forms a stable world scale, not a floating HUD.
  if((ix+iy*3)%5===0){
   cx.fillStyle='#3c5967';cx.font='bold 10px monospace';cx.textAlign='left';
   cx.fillText('S'+String(Math.abs(ix*17+iy*7)%100).padStart(2,'0')+' / REACTOR',x+22,y+tile-15);
  }
 }
 // Power bus lanes connect tiles into long industrial pathways.
 const cable=tile*3;
 for(let ix=Math.floor(sx/cable);ix<=Math.ceil((sx+viewW)/cable);ix++){
  const x=ix*cable+tile*.4;
  rect(x,sy-20,12,viewH+40,'#07121a');
  rect(x+4,sy-20,3,viewH+40,ix%2?'#365362':'#73643e');
 }
 // Seal stations are sparse and large: one unmistakable landmark per sector.
 const step=tile*6;
 for(let ix=Math.floor(sx/step);ix<=Math.ceil((sx+viewW)/step);ix++)
  for(let iy=Math.floor(sy/step);iy<=Math.ceil((sy+viewH)/step);iy++){
   if((ix+iy)%2!==0)continue;
   drawReactorSeal(ix*step+tile*2.5,iy*step+tile*2.5,86,Math.abs(ix*5+iy*9)%99);
  }
 // World perimeter is a solid, high-contrast physical bulkhead.
 const edge=1785;
 if(sx<-edge+100||sy<-edge+100||sx+viewW>edge-100||sy+viewH>edge-100){
  cx.save();
  rect(-edge-240,-edge-240,240,2*(edge+240),'#050a0d');
  rect(edge,-edge-240,240,2*(edge+240),'#050a0d');
  rect(-edge,-edge-240,edge*2,240,'#050a0d');
  rect(-edge,edge,edge*2,240,'#050a0d');
  cx.lineWidth=20;cx.strokeStyle='#293c47';cx.strokeRect(-edge,-edge,2*edge,2*edge);
  cx.lineWidth=7;cx.strokeStyle='#c28d45';cx.strokeRect(-edge+15,-edge+15,2*edge-30,2*edge-30);
  cx.lineWidth=3;cx.strokeStyle='#edf0ce';cx.setLineDash([25,26]);
  cx.strokeRect(-edge+26,-edge+26,2*edge-52,2*edge-52);cx.setLineDash([]);
  cx.fillStyle='#efcb8c';cx.font='bold 16px monospace';cx.textAlign='center';
  for(let k=-1500;k<=1500;k+=450){
   cx.fillText('⚠  СЕКТОР ЗАКРЫТ',k,-edge+66);
   cx.fillText('⚠  СЕКТОР ЗАКРЫТ',k,edge-46);
  }
  cx.restore();
 }
 if(trainingMode){
  ring(0,0,150,'#65858c',2);ring(0,0,300,'#466575',2);
  cx.font='bold 13px monospace';cx.fillStyle='#b9a775';cx.textAlign='center';
  cx.fillText('TEST BAY / REACTOR 07',0,-310);
 }
 cx.restore();
}
