// Reactor Refit player: compact, armored drone with readable nose direction.
function drawRobot(p,menu=false){
 const skin=equippedSkin(),t=ambient;
 cx.save();cx.translate(p.x,p.y);
 cx.rotate(Math.atan2(p.dy??-1,p.dx??0)+Math.PI/2);
 if(p.inv>0&&Math.floor(t*18)%3===0)cx.globalAlpha=.6;
 if(S.invulnTimer>0){
  ring(0,0,38+Math.sin(t*8)*2,'#b8bdff',3);
  glow(0,0,56,'#acb8ff',.18);
 }else if(S.rageTimer>0)ring(0,0,34,'#e9a24f',3);
 // Dark contact shadow makes the drone read as hovering above a physical deck.
 cx.save();cx.scale(1,.49);circ(0,15,32,'#020609ae');cx.restore();
 // Rear thrusters and armored wings. No gameplay collision change.
 for(const side of [-1,1]){
  cx.save();cx.translate(side*21,13);
  poly([[-8,-10],[9,-11],[12,11],[1,16],[-8,10]],'#283a45','#6c8291',1.8);
  poly([[-3,-6],[6,-6],[6,4],[-3,5]],'#4c626f');
  const flick=3+Math.sin(t*17+side)*2;
  poly([[-5,12],[6,12],[3,19+flick],[-2,19+flick]],'#60a9bf');
  cx.restore();
  poly([[side*18,-14],[side*32,-21],[side*32,-4],[side*19,12]],skin.back,'#8198a5',1.7);
  poly([[side*22,-12],[side*28,-14],[side*26,-5],[side*20,-1]],skin.plate);
  line(side*30,3,side*24,12,skin.core,1.5);
 }
 // Distinct plate and four segmented corner armour modules.
 poly([[0,-29],[18,-18],[22,8],[10,24],[-10,24],[-22,8],[-18,-18]],
  '#1a2834','#b5c5cb',2.8);
 for(const side of [-1,1]){
  poly([[side*6,-23],[side*18,-15],[side*18,-1],[side*9,-5]],skin.plate,'#97adba',1.4);
  poly([[side*12,5],[side*19,10],[side*9,19],[side*5,13]],'#455765',skin.trim,1.2);
  circ(side*14,-12,2.4,'#c9d6d8');
 }
 poly([[0,-24],[9,-12],[7,14],[0,20],[-7,14],[-9,-12]],skin.shell,skin.edge,1.5);
 // Rear mechanical docking hinge and directional sensor array.
 rect(-8,19,16,4,'#637582');
 poly([[0,-33],[-8,-20],[8,-20]],'#d7e0e0','#f9d19b',1.6);
 rect(-5,-24,10,3,'#e4ba6e');
 // Core is light surrounded by steel, never a giant glowing polygon.
 circ(0,1,13,'#0b1720','#9fb6bd',2.5);
 circ(0,1,8,skin.coreDark,skin.light,1.4);
 circ(0,1,5,skin.core);
 circ(-1,-1,1.8,'#f5fcff');
 for(const side of [-1,1])line(side*11,-1,side*18,-3,skin.core,2);
 cx.restore();
}
