function drawRobot(p,menu=false){const skin=equippedSkin();cx.save();cx.translate(p.x,p.y);let a=Math.atan2(p.dy??-1,p.dx??0)+Math.PI/2;cx.rotate(a);const t=ambient,inv=p.inv>0;if(inv&&Math.floor(t*22)%2===0){cx.globalAlpha=.55}glow(0,0,62,S.rageTimer>0?AMBER:skin.core,.24);if(S.invulnTimer>0){ring(0,0,40+Math.sin(ambient*9)*3,'#ddc1ff',4);glow(0,0,68,'#c0b2ff',.27);}else if(S.rageTimer>0)ring(0,0,35,'#ffae51',3);cx.save();cx.scale(1,.52);ring(0,13,30,skin.core+'58',3);cx.restore();

 // Cosmetic silhouette modules; purely visual, never change collision radius.
 if(skin.variant==='ghost'){
  for(const side of [-1,1]){poly([[side*17,-4],[side*42,-27],[side*34,8],[side*26,16]],skin.back,skin.edge,2);line(side*27,-11,side*38,-22,skin.core,3)}
 }else if(skin.variant==='ember'){
  for(const side of [-1,1]){poly([[side*13,-18],[side*25,-39],[side*23,-6]],skin.back,skin.trim,2);glow(side*24,-30,13,skin.core,.29)}
 }else if(skin.variant==='void'){
  for(const side of [-1,1]){poly([[side*19,-16],[side*36,-31],[side*32,9],[side*26,18]],skin.shell,skin.edge,1.6);poly([[side*16,15],[side*30,35],[side*26,6]],skin.back,skin.trim,1.4)}
 }
 // Mechanical foot thrusters
 for(let s of [-1,1]){cx.save();cx.translate(s*19,14);cx.rotate(s*.06+Math.sin(t*10+s)*.11);poly([[-9,-9],[6,-11],[11,12],[-6,15]],'#182b40','#2e556b',2);poly([[-6,-4],[5,-6],[7,7],[-3,9]],skin.plate);glow(0,13,12,BLUE,.37);circ(0,12,3,skin.light);cx.restore()}
 for(let s of [-1,1]){cx.save();cx.translate(s*23,-6);poly([[-6,-14],[6,-12],[9,7],[0,15],[-8,9]],skin.back,'#1f263a',2);poly([[-3,-9],[4,-7],[6,4],[-1,9]],s===1?skin.plate:skin.plate);rect(-3,0,5,3,skin.core);cx.restore()}
 poly([[0,-27],[17,-19],[24,0],[18,22],[0,28],[-18,22],[-24,0],[-17,-19]],skin.body,skin.edge,2.6);poly([[0,-24],[12,-17],[16,-5],[0,-11],[-16,-5],[-12,-17]],skin.plate);poly([[0,25],[15,16],[10,9],[-10,9],[-15,16]],skin.plate,'#29475b',1);poly([[-21,-2],[-11,-16],[0,-8],[11,-16],[21,-2],[12,10],[0,15],[-12,10]],skin.shell,skin.edge,1.6);
 for(let s of [-1,1]){poly([[s*18,0],[s*13,4],[s*13,15],[s*20,9]],skin.trim);line(s*17,-11,s*17,0,skin.trim,2)}glow(0,1,34,skin.core,.33);poly([[0,-13],[13,-2],[8,12],[-8,12],[-13,-2]],skin.coreDark,skin.light,2);poly([[0,-9],[9,-1],[6,8],[-6,8],[-9,-1]],skin.core);circ(0,-1,3,'#ffffff');poly([[-15,-16],[0,-21],[15,-16],[8,-9],[-8,-9]],skin.plate,skin.edge,1);rect(-10,-17,20,3,skin.core);cx.restore()}
