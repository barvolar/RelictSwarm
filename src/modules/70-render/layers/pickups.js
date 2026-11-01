// Industrial loot language: chips = XP; cassettes = shards; reactor = synthesis.
function drawPickup(o){
 const t=ambient+o.x*.13+o.y*.19;
 const colors={xp:'#79c9d2',shard:'#e7ba6b',heal:'#9de5b9',magnet:'#9dcbef',rage:'#f0a96a',invuln:'#c9b6ee',core:'#f6d178'};
 const col=colors[o.type]||'#89bcc9',bob=Math.sin(t*2)*2;
 cx.save();cx.translate(o.x,o.y+bob);
 if(o.type==='xp'){
  cx.rotate(Math.PI/4);
  rect(-4.5,-4.5,9,9,'#234657');
  cx.strokeStyle='#8ccad6';cx.lineWidth=1.3;cx.strokeRect(-4.5,-4.5,9,9);
  rect(-2,-2,4,4,'#dcf2db');
 }else if(o.type==='shard'){
  cx.rotate(Math.sin(t*.4)*.2);
  poly([[-8,-10],[5,-12],[11,-4],[7,11],[-6,11],[-11,1]],'#795e35','#f2c982',1.8);
  rect(-4,-4,8,7,'#e4bd76');
  line(-9,-7,-4,-12,'#f5df9e',1.5);
 }else if(o.type==='core'){
  glow(0,0,52,col,.32);
  cx.rotate(t*.5);
  for(let n=0;n<4;n++){
   cx.save();cx.rotate(n*TAU/4);
   poly([[-7,-25],[7,-25],[11,-13],[-11,-13]],'#48525b','#f2c46d',2);
   cx.restore();
  }
  poly([[0,-18],[16,0],[0,18],[-16,0]],'#b16c2c','#f5dea1',2);
  poly([[0,-9],[9,0],[0,9],[-9,0]],'#fff2bc');
 }else{
  glow(0,0,30,col,.2);
  poly([[-13,-11],[8,-11],[14,-5],[14,11],[-8,11],[-14,5]],'#1e333e',col,2);
  cx.fillStyle=col;cx.font='bold 19px monospace';cx.textAlign='center';cx.textBaseline='middle';
  cx.fillText({heal:'+',magnet:'◎',rage:'ϟ',invuln:'⬡'}[o.type]||'+',0,0);
  rect(-12,-14,8,3,'#647e89');
 }
 cx.restore();
}
