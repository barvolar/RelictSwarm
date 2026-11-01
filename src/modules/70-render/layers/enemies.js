// Single-pass silhouette for high-pressure rendering. Gameplay state is never modified.
function drawLiteEnemy(e){
 const info=ENEMY[e.id],r=e.r,col=info.col;
 cx.save();cx.translate(e.x,e.y);
 cx.rotate(Math.atan2(S.player.y-e.y,S.player.x-e.x)+Math.PI/2);
 const spikes=e.id==='hive'?8:e.id==='sentry'?4:e.id==='brute'?5:6;
 cx.beginPath();
 for(let j=0;j<spikes;j++){
  const a=-Math.PI/2+j*TAU/spikes;
  const radius=j%2===0?r:r*.84;
  const x=Math.cos(a)*radius,y=Math.sin(a)*radius;
  if(!j)cx.moveTo(x,y);else cx.lineTo(x,y);
 }
 cx.closePath();cx.fillStyle=e.hit>0?'#a64b56':'#203746';cx.fill();cx.strokeStyle=col;cx.lineWidth=2;cx.stroke();
 cx.beginPath();cx.arc(0,0,Math.max(3,r*.23),0,TAU);cx.fillStyle=e.shock>0?'#d6faff':e.frost>0?'#a5eeff':col;cx.fill();
 if(e.burn>0||e.chill>25){cx.strokeStyle=e.burn>0?'#ffae68':'#9adfff';cx.lineWidth=2;cx.strokeRect(-r-4,-r-4,r*2+8,r*2+8);}
 if(e.hp<e.maxHp*.55){cx.fillStyle='#09141d';cx.fillRect(-r,-r-9,r*2,3);cx.fillStyle=col;cx.fillRect(-r,-r-9,r*2*clamp(e.hp/e.maxHp,0,1),3)}
 cx.restore();
}
// Reactor Refit: each type is a recognizable machine, even without glow.
// All coordinates below are visual only; hitboxes, speeds, AI and drops stay intact.
function drawMachineEnemy(e){
 const col=ENEMY[e.id].col,r=e.r||18,s=(e.t||0),anim=Math.sin(s*8+(e.seed||0));
 const sideColor=e.hit>0?'#78414a':'#465762',edge=e.hit>0?'#ff9f9b':'#8da1a8';
 cx.save();cx.translate(e.x,e.y);
 cx.rotate(Math.atan2(S.player.y-e.y,S.player.x-e.x)+Math.PI/2);
 if(e.elite)cx.scale(1.15,1.15);
 if(e.champion){ring(0,0,r+10,'#e5b668',2);glow(0,0,r*2,'#d5a05b',.18)}
 if(e.hunterWind>0||e.bruteWind>0)ring(0,0,r+11,'#ec8b5b',3);
 if(e.shock>0)ring(0,0,r+6,'#cdd8ff',2);
 if(e.frost>0||e.chill>25)ring(0,0,r+5,'#a3deea',1.8);
 if(e.burn>0)ring(0,0,r+5,'#d47b44',2);
 if(e.marked>0){ring(0,0,r+12,'#e6c078',1.6);line(-9,-r-16,9,-r-16,'#e6c078',2)}
 // Contact shadow. Kept subtle even during full particle-heavy gameplay.
 cx.save();cx.scale(1,.49);circ(0,10,r,'#010508a4');cx.restore();
 const accent=e.frost>0?'#a2e9ed':e.shock>0?'#c4caff':col;
 if(e.id==='scarab'){
  // Six-legged salvage crawler, broad shoulders and protected center.
  for(const side of [-1,1]){
   for(let i=0;i<3;i++){
    const y=-11+i*10,kick=anim*(i%2?2:-2);
    line(side*9,y,side*(r-2),y+kick,'#6e7f84',2.5);
    line(side*(r-2),y+kick,side*(r+6),y+5+kick,'#adad95',1.8);
   }
  }
  poly([[0,-r-4],[r*.67,-r*.56],[r*.72,r*.37],[0,r*.85],[-r*.72,r*.37],[-r*.67,-r*.56]],
   '#283943',edge,1.7);
  poly([[-9,-8],[0,-14],[9,-8],[7,9],[0,12],[-7,9]],'#526e70','#9db1a8',1);
  rect(-4,-7,8,12,'#122b32');rect(-2,-4,4,7,accent);
  for(const side of [-1,1])line(side*6,-r*.68,side*9,-r,'#d8cba8',1.6);
 }else if(e.id==='hunter'){
  // Interceptor with swept blades: silhouette distinguishes it at a glance.
  for(const side of [-1,1]){
   poly([[side*5,-14],[side*(r+12),-r],[side*(r+16),9],[side*16,4]],'#45525b','#b58c62',2);
   poly([[side*16,-10],[side*(r+9),-r+1],[side*(r+7),-4]],'#9a733e');
  }
  poly([[0,-r-9],[11,-6],[10,r*.8],[0,r+2],[-10,r*.8],[-11,-6]],'#343e46','#d6ad69',2);
  poly([[0,-r-5],[5,-8],[-5,-8]],'#ebd8a8');
  rect(-4,2,8,7,'#252f37');rect(-2,4,4,4,accent);
 }else if(e.id==='sentry'){
  // Twin-barrel walking gun platform.
  for(const side of [-1,1]){
   poly([[side*8,-7],[side*(r+2),-12],[side*(r+6),9],[side*9,13]],'#344d59','#82a1af',1.7);
   rect(side*13-4,11,7,6,'#627d86');
  }
  poly([[-12,-14],[12,-14],[r*.85,9],[0,18],[-r*.85,9]],'#334550','#a9c3cc',2);
  rect(-5,-r-9,10,25,'#1d2d37');
  rect(-4,-r-9,8,18,'#6b8796');
  rect(-2,-r-14,4,9,'#c8d6dc');
  circ(0,4,6,'#152832','#c3d2cc',1.5);circ(0,4,2.5,accent);
 }else if(e.id==='brute'){
  // Armored tank, two tracks and heavy triangular ram plate.
  for(const side of [-1,1]){
   rect(side*r*.64-5,-r*.7,11,r*1.45,'#1e2b34');
   for(let k=-2;k<=2;k++)rect(side*r*.64-4,k*8,9,4,'#506572');
  }
  poly([[0,-r-7],[r*.75,-r*.51],[r*.85,r*.6],[0,r],[-r*.85,r*.6],[-r*.75,-r*.51]],
   '#43505c','#b5aaa1',2.4);
  poly([[0,-r-6],[r*.48,-r*.28],[r*.42,r*.48],[0,r*.64],[-r*.42,r*.48],[-r*.48,-r*.28]],'#74716b','#a1a7a3',1.4);
  line(-r*.4,-r*.3,r*.4,-r*.3,'#252f36',3);
  rect(-5,1,10,9,'#1d2a31');rect(-3,3,6,4,accent);
 }else if(e.id==='hive'){
  // Deployable carrier: four visible cargo capsules on a central chassis.
  for(const side of [-1,1]){
   for(const yy of [-13,12]){
    poly([[side*9,yy-8],[side*(r+8),yy-8],[side*(r+11),yy+9],[side*9,yy+9]],
      '#3a4250','#a198ae',1.5);
    circ(side*(r+1),yy,3.3,side<0?'#d6ae75':'#83c0ae');
   }
  }
  poly([[-13,-r],[13,-r],[r*.78,r*.4],[0,r],[-r*.78,r*.4]],'#403d4f','#b3a3c5',2);
  poly([[0,-r+4],[10,-7],[7,14],[-7,14],[-10,-7]],'#777087','#c0b0ce',1);
  rect(-5,-5,10,13,'#1c2638');rect(-3,-3,6,8,accent);
 }else if(e.id==='phantom'){
  // Phase enemy: visibly split mechanical shell; no 'magic circle' silhouette.
  cx.save();cx.globalAlpha=.84+.11*Math.sin(s*13);
  for(const side of [-1,1]){
   poly([[side*3,-r],[side*(r+10),-8],[side*(r+4),r],[side*10,9]],'#2a4b57','#85b8c4',2);
   line(side*(r+7),2,side*(r+17),10+anim*2,'#6ab3b8',2);
  }
  poly([[0,-r-7],[8,-4],[0,r+5],[-8,-4]],'#304b5b','#a6d1d6',1.5);
  poly([[0,-12],[5,-3],[0,10],[-5,-3]],accent);
  cx.restore();
 }
 if(e.elite)ring(0,0,r+4,'#edb876',1.5);
 // Rotate back for a world-aligned, readable damage bar.
 if(e.elite||e.hp<e.maxHp*.56){
  cx.rotate(-(Math.atan2(S.player.y-e.y,S.player.x-e.x)+Math.PI/2));
  const w=e.elite?r*1.8:r*1.5;
  rect(-w/2,-r-19,w,4,'#050a0d');
  rect(-w/2,-r-19,w*clamp(e.hp/e.maxHp,0,1),4,e.elite?'#e9ba78':'#86b9a0');
 }
 cx.restore();
}
function drawReactorBoss(e){
 const R=e.r||55,col=ENEMY[e.id].col,t=e.t||0;
 cx.save();cx.translate(e.x,e.y);
 cx.rotate(Math.atan2(S.player.y-e.y,S.player.x-e.x)+Math.PI/2);
 cx.scale(R/54,R/54);
 cx.save();cx.scale(1,.48);circ(0,11,59,'#020408bb');cx.restore();
 // Radial plating has broad silhouettes and industrial teeth.
 for(let i=0;i<8;i++){
  cx.save();cx.rotate(i*TAU/8);
  const isSynth=e.id.startsWith('synth');
  poly([[-9,-49],[-16,-69],[0,-77],[16,-69],[9,-49]],
   isSynth?'#6b5842':'#3d4650',isSynth?'#dec38f':'#a6adb4',1.7);
  rect(-4,-66,8,11,i%2?col:'#b9b9ae');
  cx.restore();
 }
 ring(0,0,49,'#77868a',3);
 ring(0,0,43,'#273a47',8);
 poly([[0,-44],[34,-29],[43,7],[28,37],[0,46],[-28,37],[-43,7],[-34,-29]],
  '#263842','#a1b0b0',3);
 for(let i=0;i<4;i++){
  cx.save();cx.rotate(i*Math.PI/2);
  poly([[-17,-39],[17,-39],[20,-22],[0,-15],[-20,-22]],
   i%2?'#45515c':'#59636b','#9ba6a8',1.3);
  line(-10,-31,10,-31,col,2);
  cx.restore();
 }
 // The boss can now be identified as a reactor carrier, not a neon star.
 circ(0,0,20,'#101f28','#d4c09a',3);
 ring(0,0,14,col,3);
 poly([[0,-11],[11,0],[0,11],[-11,0]],'#7d6a54','#e6d1a4',2);
 circ(0,0,5,col);
 if(e.id==='omega'){
  ring(0,0,59,'#f2c47a',5);
  for(let i=0;i<4;i++){
   const a=i*TAU/4+t*.5;
   circ(Math.cos(a)*54,Math.sin(a)*54,4,'#f6e6ba');
  }
 }else if(e.id==='boss2'||e.id==='boss3'){
  for(let i=0;i<3;i++){
   cx.save();cx.rotate(t*.18+i*TAU/3);
   rect(-8,-62,16,7,'#bd91c7');cx.restore();
  }
 }
 if(e.shield>0)ring(0,0,60,'#aedcea',3);
 if(e.phase)ring(0,0,66,'#f3d38d',2);
 if(e.hit>0){cx.globalAlpha=.32;circ(0,0,48,'#f78f85')}
 cx.restore();
}
function drawEnemy(e){
 if(renderSimplifyEnemies()&&!e.elite&&!e.champion&&!e.trainingDummy){drawLiteEnemy(e);return;}
 if(e.trainingDummy){
  cx.save();cx.translate(e.x,e.y);
  poly([[0,-e.r],[e.r,0],[0,e.r],[-e.r,0]],'#263d48','#c1c2a0',3);
  circ(0,0,e.r*.5,'#101c25','#82c3c0',3);
  line(-e.r,0,e.r,0,'#a9c7c2',2);line(0,-e.r,0,e.r,'#a9c7c2',2);
  cx.restore();return;
 }
 if(e.id.startsWith('boss')||e.id.startsWith('synth')||e.id==='omega'){
  drawReactorBoss(e);return;
 }
 drawMachineEnemy(e);
}
