function poly(points,fill,stroke=null,width=1){cx.beginPath();cx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)cx.lineTo(points[i][0],points[i][1]);cx.closePath();if(fill){cx.fillStyle=fill;cx.fill()}if(stroke){cx.strokeStyle=stroke;cx.lineWidth=width;cx.stroke()}}
function circ(x,y,r,fill,stroke=null,w=1){cx.beginPath();cx.arc(x,y,r,0,TAU);if(fill){cx.fillStyle=fill;cx.fill()}if(stroke){cx.lineWidth=w;cx.strokeStyle=stroke;cx.stroke()}}
function line(x1,y1,x2,y2,col,w=1){cx.beginPath();cx.moveTo(x1,y1);cx.lineTo(x2,y2);cx.strokeStyle=col;cx.lineWidth=w;cx.stroke()}
function glow(x,y,r,col,alpha=.36){cx.save();cx.globalAlpha=alpha;let g=cx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(.28,col+'75');g.addColorStop(1,col+'00');cx.fillStyle=g;cx.beginPath();cx.arc(x,y,r,0,TAU);cx.fill();cx.restore()}
function rect(x,y,w,h,col){cx.fillStyle=col;cx.fillRect(x,y,w,h)}
function ring(x,y,r,col,w=2){cx.beginPath();cx.arc(x,y,r,0,TAU);cx.strokeStyle=col;cx.lineWidth=w;cx.stroke()}
function seed(x,y){let n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)}
function drawBackground(camX,camY,zoom=1){rect(0,0,W,H,'#08111d');const viewW=W/zoom,viewH=H/zoom,sx=camX-viewW/2,sy=camY-viewH/2;cx.save();cx.translate(W/2-camX,H/2-camY);
 let gx=Math.floor(sx/80)*80,gy=Math.floor(sy/80)*80;cx.lineWidth=1;for(let x=gx;x<sx+viewW+80;x+=80){line(x,sy-100,x,sy+viewH+100,'#16303c',.9);if((Math.round(x/80)%4)===0)line(x,sy-100,x,sy+H+100,'#234459',1.3)}for(let y=gy;y<sy+viewH+80;y+=80){line(sx-100,y,sx+viewW+100,y,'#16303c',.9);if((Math.round(y/80)%4)===0)line(sx-100,y,sx+W+100,y,'#234459',1.3)}
 for(let x=Math.floor(sx/320)*320;x<sx+viewW+330;x+=320)for(let y=Math.floor(sy/320)*320;y<sy+viewH+330;y+=320){let v=seed(x/9,y/11);if(v<.22)continue;let px=x+seed(x,6+y)*225+20,py=y+seed(y,x)*220+30,k=seed(x+19,y+31);cx.save();cx.translate(px,py);cx.rotate(v*TAU);if(v>.75){poly([[-27,-13],[-6,-22],[25,-4],[18,9],[-17,16]],'#0e202b','#284552',1);poly([[-18,-11],[-4,-15],[12,-4],[-10,3]],'#18323b');line(-7,0,9,8,'#296273',1.4)}else{line(-17,3,3,-8,'#245061',1);line(3,-8,17,-2,'#245061',1);circ(3,-8,2.2,'#23737b')}if(k>.6){glow(28,12,25,'#21dbc7',.12);circ(28,12,2,'#207e8b')}cx.restore()}
 // Arena perimeter: contrast stripes, unmistakable boundary, and a muted outer danger zone.
  const edge=1785;
  if(sx< -edge+100 || sy< -edge+100 || sx+viewW>edge-100 || sy+viewH>edge-100){
  cx.save();
  cx.fillStyle='#03101adc';
  cx.fillRect(-edge-220,-edge-220,220,2*(edge+220));
  cx.fillRect(edge,-edge-220,220,2*(edge+220));
  cx.fillRect(-edge,-edge-220,2*edge,220);
  cx.fillRect(-edge,edge,2*edge,220);
  cx.strokeStyle='#1c8f9e';cx.lineWidth=14;cx.strokeRect(-edge,-edge,edge*2,edge*2);
  cx.strokeStyle='#8ef9ec';cx.lineWidth=3;cx.strokeRect(-edge+3,-edge+3,edge*2-6,edge*2-6);
  cx.strokeStyle='#ffcc78';cx.lineWidth=2;cx.setLineDash([18,20]);cx.strokeRect(-edge+25,-edge+25,edge*2-50,edge*2-50);cx.setLineDash([]);
  cx.fillStyle='#ffe2a0';cx.font='bold 15px Trebuchet MS';cx.textAlign='center';
  for(let k=-1600;k<=1600;k+=400){
   cx.fillText('⚠ ГРАНИЦА СЕКТОРА',k,-edge+56);
   cx.fillText('⚠ ГРАНИЦА СЕКТОРА',k,edge-42);
   cx.save();cx.translate(-edge+53,k);cx.rotate(-Math.PI/2);cx.fillText('⚠ ГРАНИЦА СЕКТОРА',0,0);cx.restore();
   cx.save();cx.translate(edge-53,k);cx.rotate(Math.PI/2);cx.fillText('⚠ ГРАНИЦА СЕКТОРА',0,0);cx.restore();
  }
  cx.restore();
  }if(trainingMode){cx.save();for(const r of [150,300,450]){ring(0,0,r,'#355f66',1.5)}for(let q=-4;q<=4;q++){line(q*80,-420,q*80,420,'#244f5633',1);line(-420,q*80,420,q*80,'#244f5633',1)}cx.font='bold 14px Trebuchet MS';cx.fillStyle='#74cfc4aa';cx.textAlign='center';cx.fillText('ИСПЫТАТЕЛЬНЫЙ СЕКТОР // 08',0,-315);cx.restore()}cx.restore()}
function drawPickup(o){
 const t=ambient+.25*o.x+o.y,colors={xp:TEAL,shard:AMBER,heal:'#84ffaa',magnet:'#78e9ff',rage:'#ff9e54',invuln:'#d5a6ff',core:'#ffe38e'},col=colors[o.type]||TEAL;
 cx.save();cx.translate(o.x,o.y+Math.sin(t*2)*2.4);glow(0,0,o.type==='xp'?22:o.type==='core'?56:38,col,.38);cx.rotate(t*.75);
 if(o.type==='xp'){poly([[0,-8],[7,0],[0,8],[-7,0]],'#55f2d0','#c5fff7',1.4);poly([[0,-4],[3,0],[0,4],[-3,0]],'#dffffd');}
 else if(o.type==='shard'){poly([[0,-13],[9,-3],[6,10],[-6,10],[-9,-3]],'#e59542','#ffe4a6',1.7);line(-3,0,4,5,'#ffefc8',2);}
 else{ring(0,0,14,col,3);circ(0,0,10,'#152c3b',col,2);cx.rotate(-t*.75);cx.fillStyle=col;cx.textAlign='center';cx.textBaseline='middle';cx.font='bold 19px Trebuchet MS';cx.fillText({heal:'✚',magnet:'◎',rage:'ϟ',invuln:'⬡',core:'◈'}[o.type]||'✚',0,0);}
 cx.restore();}
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
function drawHybridLinks(){}
function drawDrone(pos,d,i){const color=DRONES[d.id].color;cx.save();cx.translate(pos.x,pos.y);let e=chooseCombatTarget(pos.x,pos.y,550,d.id);
  const lockedAim=d.aimUntil>=S.t&&Number.isFinite(d.aimX)&&Number.isFinite(d.aimY);
  let a=lockedAim?Math.atan2(d.aimY-pos.y,d.aimX-pos.x)+Math.PI/2:
    e?Math.atan2(e.y-pos.y,e.x-pos.x)+Math.PI/2:ambient+i*1.5;
  cx.rotate(a);let rank=d.lvl,linked=d.id.startsWith('fusion_');if(linked)cx.scale(1.24,1.24);glow(0,0,35+Math.min(12,rank)*3+(linked?15:0),color,linked?.55:.24);if(linked){ring(0,0,31+Math.sin(ambient*7)*2,color,2.4);for(let j=0;j<4;j++){let an=j*TAU/4+ambient*1.7;circ(Math.cos(an)*29,Math.sin(an)*29,2.5,color)}}cx.save();cx.scale(1,.48);ring(0,10,16,color+'66',2);cx.restore();if(linked){ring(0,0,33+3*Math.sin(ambient*5),color,3);glow(0,0,55,color,.37);for(let z=0;z<6;z++){let a=z*TAU/6+ambient;poly([[Math.cos(a)*22,Math.sin(a)*22],[Math.cos(a-.14)*38,Math.sin(a-.14)*38],[Math.cos(a+.14)*38,Math.sin(a+.14)*38]],'#29485b',color,1.8)}glow(0,0,30,color,.6);}
 if(['saw','fusion_thermal','fusion_tesla','fusion_frostblade','fusion_magnetblade'].includes(d.id)){const thermal=d.id==='fusion_thermal',frost=d.id==='fusion_frostblade',magnet=d.id==='fusion_magnetblade';if(thermal){glow(0,0,58,'#ff681c',.58);ring(0,0,29,'#ffb54a',4);}cx.rotate(ambient*(7+Math.log1p(wm(d,'spin'))*3));for(let k=0;k<8;k++){let a=k*TAU/8;poly([[Math.cos(a)*14,Math.sin(a)*14],[Math.cos(a+.19)*27,Math.sin(a+.19)*27],[Math.cos(a+.4)*15,Math.sin(a+.4)*15]],thermal?'#ec6626':frost?'#5dbaee':magnet?'#9972c9':'#b7ad97',thermal?'#fff1a6':frost?'#ecffff':magnet?'#ebd2ff':'#ffdaa6',1.4)}circ(0,0,15,thermal?'#6f281c':'#304957',color,3);circ(0,0,7,color);if(rank>=8){ring(0,0,36,color,3.4);for(let j=0;j<5;j++){let a=j*TAU/5-ambient*5;circ(Math.cos(a)*35,Math.sin(a)*35,3.2,'#fff1b1')}}cx.restore();return}
 if(d.id==='rocket'||d.id==='fusion_starfall'){for(let s of [-1,1]){poly([[s*9,-12],[s*17,-17],[s*20,8],[s*10,14]],'#354758',color,1);rect(s*14-3,-12,6,9,'#b8a1a4')}poly([[-11,-8],[0,-20],[11,-8],[9,13],[-9,13]],'#314558','#bfccd1',1.5);poly([[0,-15],[5,-6],[0,6],[-5,-6]],'#ff918a');glow(0,13,15,RED,.24)}
 else if(d.id==='arc'){for(let s of [-1,1]){poly([[s*9,-11],[s*21,-13],[s*20,8],[s*9,5]],'#354a5d',color,1);circ(s*17,-12,3,color)}poly([[-11,-11],[0,-20],[11,-11],[12,10],[0,17],[-12,10]],'#324257',color,1.6);poly([[0,-14],[5,-2],[-1,0],[3,10],[-6,-1],[0,-3]],color)}
 else if(d.id==='rail'||d.id==='fusion_glacier'){poly([[-16,-9],[-10,-19],[10,-19],[16,-9],[13,17],[-13,17]],'#67533e','#ffe8a6',2);rect(-5,-32,10,34,'#e0d19d');rect(-2,-38,4,17,'#ffffff');for(let k=0;k<3;k++){line(-15,-9+k*10,-8,-9+k*10,'#ffe39c',2);line(8,-9+k*10,15,-9+k*10,'#ffe39c',2)}glow(0,-23,22,'#ffe49c',.4)}
 else if(d.id==='cryo'){poly([[-14,9],[-16,-12],[0,-23],[16,-12],[14,9],[0,19]],'#25445c',color,2);for(let k=0;k<6;k++){let an=k*TAU/6;poly([[Math.cos(an)*8,Math.sin(an)*8],[Math.cos(an-.23)*21,Math.sin(an-.23)*21],[Math.cos(an+.23)*21,Math.sin(an+.23)*21]],'#7bdeff','#ddffff',1)}circ(0,0,6,'#e4ffff');}
 else if(d.id==='mine'||d.id==='fusion_singularity'){poly([[-15,-12],[0,-21],[15,-12],[15,14],[0,19],[-15,14]],'#534637','#ffc36c',2);for(let k=0;k<4;k++){let an=k*TAU/4+Math.PI/4;circ(Math.cos(an)*13,Math.sin(an)*13,3,'#ffc36c')}circ(0,0,8,'#242c39','#ffe2b2',2);circ(0,0,3,'#ffc36c');}
 else if(d.id==='boomer'||d.id==='fusion_inferno'){poly([[-18,-18],[-6,-11],[0,-23],[6,-11],[18,-18],[13,11],[0,17],[-13,11]],'#244a3d',color,2);cx.rotate(ambient*2);for(let k=0;k<3;k++){let a=k*TAU/3;line(0,0,Math.cos(a)*15,Math.sin(a)*15,'#b8ffd7',4)}circ(0,0,5,'#d8ffe6');}
 else if(d.id==='gravity'){poly([[-14,-7],[-9,-20],[9,-20],[14,-7],[12,12],[0,20],[-12,12]],'#372f58',color,2);glow(0,0,27,'#c1a5ff',.5);circ(0,0,10,'#13122a','#d5beff',2);circ(0,0,5,'#02030f');for(let k=0;k<3;k++){const a=k*TAU/3+ambient*3;circ(Math.cos(a)*17,Math.sin(a)*17,3,'#e1ceff')}}
 else if(d.id==='flame'){poly([[-13,11],[-13,-14],[0,-24],[13,-14],[13,11],[0,18]],'#5c342f',color,2);poly([[-7,-23],[7,-23],[6,-9],[-6,-9]],'#ffc37c','#ffe2b3',1);glow(0,-15,27,'#ff742a',.45);circ(0,-14,5,'#ffb04a');}
 else if(d.id==='plasma'){poly([[-14,-4],[-7,-17],[8,-17],[15,-4],[9,11],[-9,11]],'#38566f',color,1.4);for(let k=0;k<3;k++){let a=ambient*1.4+k*TAU/3;circ(Math.cos(a)*13,Math.sin(a)*13,4,color)}circ(0,0,9,'#226da1',color,2);circ(0,0,4,'#c7f4ff')}
 else{poly([[-12,-12],[-3,-17],[10,-12],[13,7],[0,16],[-13,7]],'#315064','#7da9ad',1.4);poly([[-4,-23],[4,-23],[7,-8],[-7,-8]],'#a2b2b7',color,2);rect(-3,-24,6,7,color);poly([[0,-8],[8,0],[0,9],[-8,0]],color,'#c8fff7',1)}
 if(rank>=2){circ(-14,11,3,color);circ(14,11,3,color)}if(rank>=3){line(-18,9,-23,-2,color,2);line(18,9,23,-2,color,2)}if(rank>=8){ring(0,0,24,color,.9);for(let k=0;k<4;k++){let q=k*TAU/4+ambient;circ(Math.cos(q)*24,Math.sin(q)*24,2.5,color)}}
 if(linked && !['fusion_ion','fusion_thermal','fusion_tesla','fusion_starfall','fusion_predator','fusion_glacier','fusion_singularity','fusion_inferno'].includes(d.id)){cx.save();circ(0,0,11,'#132a3a',color,2);cx.textAlign='center';cx.textBaseline='middle';cx.font='bold 19px sans-serif';cx.fillStyle=color;cx.fillText(DRONES[d.id].glyph,0,0);cx.restore();}
 if(d.flash>0){const k=d.flash/.18;glow(0,-25,23,color,.38*k);circ(0,-25,3+4*k,'#dffffb');}
 cx.restore()}
function drawEnemy(e){if(e.trainingDummy){cx.save();cx.translate(e.x,e.y);glow(0,0,63,'#60e2df',.23);ring(0,0,e.r+8,'#499aab',3);circ(0,0,e.r,'#132b38','#65dfd9',3);ring(0,0,e.r*.58,'#8df6f1',2);ring(0,0,e.r*.25,'#e6c67d',2);line(-e.r*1.4,0,e.r*1.4,0,'#b5f8f2',1.2);line(0,-e.r*1.4,0,e.r*1.4,'#b5f8f2',1.2);cx.font='bold 10px Trebuchet MS';cx.textAlign='center';cx.fillStyle='#b5f8f2';cx.fillText('ЦЕЛЬ',0,e.r+24);cx.restore();return;}const info=ENEMY[e.id],big=e.elite,motion=Math.sin(e.t*9+e.seed)*2;cx.save();cx.translate(e.x,e.y);cx.rotate(Math.atan2(S.player.y-e.y,S.player.x-e.x)+Math.PI/2);cx.scale(big?1.15:1, big?1.15:1);if(e.hunterWind>0||e.bruteWind>0){ring(0,0,e.r+10+Math.sin(e.t*15)*3,'#ffb480',3)}if(e.boosted>0){ring(0,0,e.r+5,'#b5a3ff',2)}if(e.champion){glow(0,0,e.r*2.6,'#ffb257',.25);ring(0,0,e.r+7,'#ffc16d',2.2)}if(e.hit>0)glow(0,0,e.r*2,RED,.43);if(e.shock>0){glow(0,0,e.r*2.4,'#b8faff',.45);ring(0,0,e.r+6,'#a8ebff',1.8)}
 if(e.burn>0){glow(0,0,e.r*1.9,'#ff792e',.32);for(let f=0;f<3;f++){let aa=ambient*3+f*TAU/3;circ(Math.cos(aa)*e.r*.6,Math.sin(aa)*e.r*.7,3+Math.sin(ambient*9+f)*1.7,f%2?'#ffb84f':'#f45a32')}}
 if(e.frost>0||e.chill>25){glow(0,0,e.r*1.8,'#8defff',.26);ring(0,0,e.r*.9,'#91eaff',1.3);}if(e.marked>0){ring(0,0,e.r+11,AMBER,2);line(-9,-e.r-17,9,-e.r-17,AMBER,2);}cx.save();cx.scale(1,.54);circ(0,8,e.r*1.05,'#020b12a8');cx.restore();const c=info.col;
 if(e.id==='scarab'||e.id==='hunter'){for(let s of [-1,1])for(let k=0;k<3;k++){let y=-10+k*11,ext=e.r+(e.id==='hunter'?12:8),knee=motion*(k%2===0?1:-1);line(s*9,y,s*(ext*.8),y+7+knee,'#354957',3.5);line(s*(ext*.8),y+7+knee,s*ext,y+13+knee,'#72909b',2.4)}poly([[-13,-12],[0,-21],[13,-12],[16,8],[0,20],[-16,8]],'#213545',c,2);poly([[-10,-8],[0,-16],[10,-8],[8,8],[0,13],[-8,8]],e.id==='hunter'?'#664d37':'#3b6570','#94cdd3',1);circ(0,0,5,c);for(let s of [-1,1]){circ(s*8,-9,2.5,AMBER);line(s*5,-16,s*8,-24,c,2)}}
 else if(e.id==='brute'||e.id.startsWith('boss')||e.id.startsWith('synth')){let R=e.r;for(let s of [-1,1]){poly([[s*11,-R*.5],[s*(R*.92),-R*.7],[s*(R*1.2),R*.05],[s*(R*.94),R*.55],[s*18,R*.32]],'#2b3548',c,2);poly([[s*13,R*.3],[s*(R*.7),R*.72],[s*(R*.45),R]],'#36495b','#7b93a1',1.5)}poly([[0,-R*.95],[R*.55,-R*.64],[R*.85,.1*R],[R*.42,R*.82],[0,R],[-R*.42,R*.82],[-R*.85,.1*R],[-R*.55,-R*.64]],'#273746',c,2.7);poly([[0,-R*.68],[R*.36,-R*.36],[R*.43,R*.27],[0,R*.58],[-R*.43,R*.27],[-R*.36,-R*.36]],'#667889','#a0a2a1',1.1);for(let s of [-1,1]){poly([[s*R*.31,-R*.5],[s*R*.65,-R*.9],[s*R*.45,-R*.25]],c,'#ffe1bd',.8);circ(s*R*.25,-R*.15,3.8,'#ffe9e0')}glow(0,0,R,c,.18);circ(0,0,R*.2,c);circ(0,0,R*.09,'#fff');if(big){ring(0,0,R*.9,c,3);
 if(e.id.startsWith('synth')){for(let k=0;k<8;k++){const a=k*TAU/8+e.t*.5;poly([[Math.cos(a)*R*.92,Math.sin(a)*R*.92],[Math.cos(a-.16)*R*1.5,Math.sin(a-.16)*R*1.5],[Math.cos(a+.16)*R*1.5,Math.sin(a+.16)*R*1.5]],e.id==='synth1'?'#f8a65a':e.id==='synth2'?'#34bcdd':'#fa91bf','#fff8c5',2)}ring(0,0,R*1.06,'#fcf7d2',5);circ(0,0,R*.3,e.id==='synth1'?'#ffb83e':'#b1fcff','#ffffff',3);}
 else if(e.id==='boss1'){for(let k=0;k<5;k++){let a=k*TAU/5;line(Math.cos(a)*R*.7,Math.sin(a)*R*.7,Math.cos(a)*R*1.35,Math.sin(a)*R*1.35,c,5)}
 poly([[-R*.65,-R*.25],[0,-R*1.45],[R*.65,-R*.25],[0,-R*.4]],'#782c2e','#ffc0ac',2)}
 else if(e.id==='boss2'){for(let k=0;k<6;k++){let a=k*TAU/6+e.t*.4;circ(Math.cos(a)*R*1.22,Math.sin(a)*R*1.22,6,'#c7acff');line(0,0,Math.cos(a)*R*1.22,Math.sin(a)*R*1.22,c,1.2)}}
 else if(e.id==='boss3'){for(let k=0;k<6;k++){const a=k*TAU/6-e.t*.2;poly([[Math.cos(a)*R*.83,Math.sin(a)*R*.83],[Math.cos(a-.12)*R*1.15,Math.sin(a-.12)*R*1.15],[Math.cos(a+.12)*R*1.15,Math.sin(a+.12)*R*1.15]],'#5e273e','#ff9dae',2)}}
  else if(e.id==='omega'){for(let k=0;k<8;k++){let a=k*TAU/8-e.t*.5;poly([[Math.cos(a)*R,Math.sin(a)*R],[Math.cos(a-.14)*R*1.32,Math.sin(a-.14)*R*1.32],[Math.cos(a+.14)*R*1.32,Math.sin(a+.14)*R*1.32]],'#94622c','#ffdf9e',1)}}
 if(e.phase){ring(0,0,R*1.28,'#fffbcb',3+Math.sin(e.t*10)*1.5);glow(0,0,R*2,c,.2)}
 if(e.shield>0){ring(0,0,R*1.15,'#baf9ff',5);glow(0,0,R*1.4,BLUE,.2)}
 }}
 else if(e.id==='sentry'){for(let s of [-1,1]){poly([[s*8,-6],[s*21,-12],[s*22,8],[s*10,14]],'#263d4f','#628e9c',2);line(s*18,0,s*18,16,c,2)}poly([[-15,-9],[0,-21],[15,-9],[14,11],[0,20],[-14,11]],'#264155',c,2);poly([[-6,-23],[6,-23],[5,-6],[-5,-6]],'#9baeb7',c,1.5);circ(0,0,7,c);rect(-5,-24,10,3,'#d0efff')}
 else if(e.id==='hive'){for(let k=0;k<8;k++){let a=k*TAU/8+motion*.018;line(Math.cos(a)*9,Math.sin(a)*9,Math.cos(a)*(e.r+12),Math.sin(a)*(e.r+12),c,3)}poly([[0,-29],[19,-18],[23,5],[12,20],[-12,20],[-23,5],[-19,-18]],'#4d3762',c,2.5);poly([[0,-20],[12,-9],[9,13],[-9,13],[-12,-9]],'#a17bc2');for(let s of [-1,1])circ(s*9,-8,4,TEAL)}
 else if(e.id==='phantom'){glow(0,0,39,TEAL,.24);for(let s of [-1,1]){poly([[s*7,-15],[s*23,-4],[s*18,11],[s*11,2]],'#31596a',c,2);line(s*16,5,s*23,19,c,2)}poly([[0,-23],[16,-11],[12,15],[0,24],[-12,15],[-16,-11]],'#204252',c,2);poly([[0,-13],[7,-3],[0,10],[-7,-3]],c);circ(0,-3,3,'#fff')}
 if(e.elite||e.hp<e.maxHp*.55){cx.rotate(-(Math.atan2(S.player.y-e.y,S.player.x-e.x)+Math.PI/2));let rr=e.elite?50:21;rect(-rr,-e.r-23,rr*2,5,'#070e17');rect(-rr,-e.r-23,rr*2*clamp(e.hp/e.maxHp,0,1),5,c)}cx.restore()}
function drawLightning(fx){
 const from=fx.a,to=fx.b,dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy)||1;
 const nx=-dy/length,ny=dx/length,segments=Math.min(14,Math.max(5,Math.floor(length/22))),fade=clamp(fx.life/fx.max,0,1);
 const pts=[[from.x,from.y]];
 for(let i=1;i<segments;i++){let t=i/segments,osc=Math.sin(i*127.3+fx.seed*7.13)*Math.cos(i*89.1+fx.seed),power=Math.min(23,length*.095)*(Math.sin(Math.PI*t));pts.push([from.x+dx*t+nx*osc*power,from.y+dy*t+ny*osc*power]);}
 pts.push([to.x,to.y]);
 cx.save();cx.globalAlpha=fade;
 cx.lineCap='round';cx.lineJoin='miter';
 for(const [width,color,blur] of (touching?[[10,fx.col,0],[4,fx.col,0],[1.5,'#eaffff',0]]:[[14,fx.col,24],[6,fx.col,11],[2.2,'#eaffff',3]])){
  cx.shadowColor=fx.col;cx.shadowBlur=blur;cx.strokeStyle=color;cx.lineWidth=width;cx.beginPath();cx.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)cx.lineTo(...pts[i]);cx.stroke();
 }
 cx.shadowBlur=0;cx.lineWidth=1.5;cx.strokeStyle='#aaf8ff';
 for(let i=2;i<pts.length-2;i+=3){const [x,y]=pts[i],t=Math.sin(i+fx.seed)*15;line(x,y,x+nx*t+dx*.07,y+ny*t+dy*.07,'#d8ffff',1.3);}
 glow(to.x,to.y,35,fx.col,.35);circ(to.x,to.y,4,'#eaffff');cx.restore();
}
function drawBullets(){
 for(const g of S.gravityWells){cx.save();cx.globalAlpha=clamp(g.life/1.5,.25,.9);glow(g.x,g.y,g.r,'#8262ef',.20);ring(g.x,g.y,g.r,'#b99aff',1.8);for(let k=0;k<4;k++){const a=ambient*(k%2?-.9:1.2)+k*TAU/4,r=g.r*(.46+.05*Math.sin(ambient*3+k));cx.beginPath();cx.arc(g.x,g.y,r,a,a+1.9);cx.strokeStyle='#b7a4f9';cx.lineWidth=2.5;cx.stroke()}circ(g.x,g.y,10,'#06051e','#ded0ff',2);
  for(let j=0;j<13;j++){const a=ambient*.7+j*2.39996,rr=g.r*(.18+((j*.173+ambient*.14)%1)*.78);
   const xx=g.x+Math.cos(a)*rr,yy=g.y+Math.sin(a)*rr;circ(xx,yy,1.7,'#d3b4ff');}
  cx.restore()}
 for(const m of S.mines){cx.save();cx.translate(m.x,m.y);glow(0,0,m.gravityMine?50:26,m.col,.35);if(m.gravityMine){ring(0,0,m.gravRadius*.38,m.col,1.8);for(let j=0;j<3;j++){let a=j*TAU/3-ambient*.8;circ(Math.cos(a)*25,Math.sin(a)*25,3,m.col)}}cx.rotate(ambient*.9);for(let k=0;k<8;k++){let a=k*TAU/8;poly([[Math.cos(a)*10,Math.sin(a)*10],[Math.cos(a-.2)*17,Math.sin(a-.2)*17],[Math.cos(a+.2)*17,Math.sin(a+.2)*17]],'#9a643b','#ffd29b',1)}circ(0,0,9,m.gravityMine?'#28213e':'#493b32',m.col,2);circ(0,0,3,m.arm>0?'#6b737a':m.col);cx.restore()}
 for(const e of S.effects){const k=Math.max(0,e.life/3);glow(e.x,e.y,e.r*1.25,e.fire?'#ff853f':BLUE,e.fire?.10:.12+Math.sin(ambient*6)*.05);cx.save();cx.globalAlpha=clamp(e.life/2,0,e.fire?.22:.6);circ(e.x,e.y,e.r,e.fire?'#ef621538':'#2c80ad1c',e.fire?'#ffad52':BLUE,e.fire?3:2);if(e.fire){for(let f=0;f<5;f++){let q=ambient*1.8+f*TAU/5;circ(e.x+Math.cos(q)*e.r*.65,e.y+Math.sin(q)*e.r*.65,4+Math.sin(ambient*10+f)*2,'#ff9a37')}}for(let k=0;k<6;k++){let a=TAU*k/6+ambient*.5;let x=e.x+Math.cos(a)*e.r,y=e.y+Math.sin(a)*e.r;circ(x,y,3,e.fire?'#ffb453':BLUE)}cx.restore()}
 for(const b of S.bullets){glow(b.x,b.y,b.type==='rocket'?26:17,b.col,.3);cx.save();cx.translate(b.x,b.y);cx.rotate(Math.atan2(b.vy,b.vx)+Math.PI/2);if(b.type==='gravitySeed'){glow(0,0,28,'#b79aff',.4);ring(0,0,9,'#a88cff',2);circ(0,0,5,'#080514','#dbc7ff',2)}else if(b.type==='boomer'){cx.rotate(ambient*12);for(let k=0;k<5;k++){const a=k*TAU/5;poly([[Math.cos(a)*8,Math.sin(a)*8],[Math.cos(a-.19)*17,Math.sin(a-.19)*17],[Math.cos(a+.19)*17,Math.sin(a+.19)*17]],b.fireDisc?'#7b3f32':'#426f58',b.fireDisc?'#ffb46d':'#8affb2',1)}circ(0,0,7,b.fireDisc?'#fff0be':'#e8fff0',b.col,2)}else if(b.type==='rocket'){poly([[0,-11],[7,-2],[5,9],[-5,9],[-7,-2]],'#bcb3ac','#ffad92',2);glow(0,11,19,AMBER,.4);poly([[0,6],[5,14],[0,18],[-5,14]],AMBER)}else{line(0,8,0,-13,'#adfff8',4);circ(0,-4,3,b.col)}cx.restore()}
 for(const b of S.enemyBullets){glow(b.x,b.y,19,RED,.25);circ(b.x,b.y,b.r,b.col||RED,'#ffd5d2',1.5)}
 for(const fx of S.fx){cx.save();cx.globalAlpha=clamp(fx.life/fx.max,0,1);if(fx.type==='rail'){cx.lineCap='round';line(fx.a.x,fx.a.y,fx.b.x,fx.b.y,'#8b5e2b',fx.width*3);line(fx.a.x,fx.a.y,fx.b.x,fx.b.y,'#ffe39b',fx.width);line(fx.a.x,fx.a.y,fx.b.x,fx.b.y,'#ffffff',Math.max(2,fx.width*.3));glow(fx.a.x,fx.a.y,55,'#ffdb86',.6)}else if(fx.type==='cryo'||fx.type==='flame'){
   const ice=fx.type==='cryo',life=clamp(fx.life/fx.max,0,1),v=ice?27:35;
   // No opaque triangle: visible jet consists of fast, layered, uneven particles and tapered streaks.
   cx.save();cx.lineCap='round';
   for(let j=0;j<v;j++){
    const u=(j*.61803398875+ambient*(ice?.70:1.25))%1;
    const transverse=Math.sin(j*78.233+(fx.seed||0))*.90;
    const sweep=fx.ang+transverse*fx.half*(.4+.6*u);
    const dist=fx.length*(.09+.90*u),jx=fx.x+Math.cos(sweep)*dist,jy=fx.y+Math.sin(sweep)*dist;
    const flow=8+dist*.075,xx=jx-Math.cos(sweep)*flow,yy=jy-Math.sin(sweep)*flow;
    const col=ice?(j%3?'#9cf1ff':'#e5ffff'):(j%3?'#ff852f':'#fff1a4');
    cx.globalAlpha=(.27+.63*life)*(1-.26*u);
    cx.strokeStyle=col;cx.lineWidth=(ice?1.6:3.7)*(1-.52*u)+Math.sin(j*42)*.35;
    cx.shadowBlur=ice?5:13;cx.shadowColor=ice?'#51c3fa':'#ff7027';
    cx.beginPath();cx.moveTo(xx,yy);cx.lineTo(jx,jy);cx.stroke();
    if(j%4===0){cx.fillStyle=col;cx.beginPath();cx.arc(jx,jy,(ice?2:4)*(1-.5*u),0,TAU);cx.fill();}
   }
   cx.shadowBlur=0;cx.restore();
  }else if(fx.type==='ring'){ring(fx.x,fx.y,fx.r*(1.65-fx.life/fx.max*.65),fx.col,2.8)}else if(fx.type==='lightning'){drawLightning(fx)}else if(fx.type==='beam'){line(fx.a.x,fx.a.y,fx.b.x,fx.b.y,fx.col,fx.width*3.5);line(fx.a.x,fx.a.y,fx.b.x,fx.b.y,'#f2ffff',Math.max(.5,fx.width*.55));glow(fx.b.x,fx.b.y,24,fx.col,.23)}cx.restore()}
 for(const p of S.parts){cx.save();cx.globalAlpha=clamp(p.life/p.max,0,1);cx.translate(p.x,p.y);cx.rotate(p.vx*.01);rect(-p.size/2,-p.size/2,p.size,p.size*1.7,p.col);cx.restore()}
 for(const p of S.floaters){cx.save();cx.globalAlpha=clamp(p.t/.7,0,1);cx.textAlign='center';cx.font='bold 15px Trebuchet MS';cx.shadowBlur=8;cx.shadowColor=p.col;cx.fillStyle=p.col;cx.fillText(p.val,p.x,p.y);cx.restore()}}
function drawScreenTint(){let g=cx.createRadialGradient(W*.5,H*.45,Math.min(W,H)*.17,W*.5,H*.55,Math.max(W,H)*.83);g.addColorStop(0,'#06151b00');g.addColorStop(.75,'#02050b35');g.addColorStop(1,'#010208be');cx.fillStyle=g;cx.fillRect(0,0,W,H)}
function drawMenuVisual(){drawBackground(ambient*8,ambient*4);cx.save();cx.translate(W*.5,H*.5);cx.rotate(ambient*.042);for(let i=0;i<3;i++){cx.strokeStyle=['#22425e','#164b50','#20384c'][i];cx.lineWidth=2;cx.setLineDash([8,13]);cx.beginPath();cx.arc(0,0,120+i*95,0,TAU);cx.stroke();cx.setLineDash([])}cx.restore();glow(W*.5,H*.48,Math.min(350,W*.42),TEAL,.12);cx.save();cx.translate(W*.5,H*.5);cx.rotate(ambient*.2);for(let i=0;i<6;i++){let a=i*TAU/6;cx.save();cx.translate(Math.cos(a)*150,Math.sin(a)*150);poly([[0,-10],[8,-3],[9,8],[0,14],[-9,8],[-8,-3]],'#25435a','#4fd1c5',2);circ(0,0,3,i%2?AMBER:TEAL);cx.restore()}cx.restore();drawScreenTint()}
function arenaZoom(){if(!touching)return 1;if(W<=390)return .52;if(W<=430)return .56;if(W<=650)return .62;return .82;}
function draw(){cx.setTransform(scale,0,0,scale,0,0);if(!S||mode==='menu' || (mode==='paused'&&!S)){drawMenuVisual();return}const zoom=arenaZoom();rect(0,0,W,H,'#08111d');cx.save();cx.translate(W/2,H/2);cx.scale(zoom,zoom);cx.translate(-W/2,-H/2);drawBackground(S.cam.x,S.cam.y,zoom);cx.save();let sx=shake?rand(-shake,shake):0,sy=shake?rand(-shake,shake):0;cx.translate(W/2-S.cam.x+sx,H/2-S.cam.y+sy);
 drawHazards();for(let o of S.pickups)drawPickup(o);for(let e of S.enemy){if(Math.abs(e.x-S.cam.x)<W/(2*zoom)+140&&Math.abs(e.y-S.cam.y)<H/(2*zoom)+140)drawEnemy(e)}drawRobot(S.player);drawHybridLinks();S.drones.forEach((d,i)=>{if(['saw','fusion_thermal','fusion_tesla','fusion_frostblade','fusion_magnetblade'].includes(d.id))sawPositions(d,i).forEach((sp,k)=>drawDrone(sp,d,i+k));else drawDrone(getDronePos(d,i),d,i)});drawBullets();cx.restore();cx.restore();drawScreenTint();if(S.player.hit>0){cx.save();cx.globalAlpha=S.player.hit*.35;rect(0,0,W,H,RED);cx.restore()}if(S.player.dashCd<=0&&mode==='playing'&&touching){$('dashBtn').style.borderColor=TEAL}}

// v0.10.12: diagnostics never touch enemy spawn, damage, or frame simulation.
// JS timings include only CPU work. Canvas rendering may take additional GPU/browser time.
