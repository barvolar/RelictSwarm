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
function drawEnemy(e){if(renderIsLite()&&!e.elite&&!e.champion&&!e.trainingDummy){drawLiteEnemy(e);return;}if(e.trainingDummy){cx.save();cx.translate(e.x,e.y);glow(0,0,63,'#60e2df',.23);ring(0,0,e.r+8,'#499aab',3);circ(0,0,e.r,'#132b38','#65dfd9',3);ring(0,0,e.r*.58,'#8df6f1',2);ring(0,0,e.r*.25,'#e6c67d',2);line(-e.r*1.4,0,e.r*1.4,0,'#b5f8f2',1.2);line(0,-e.r*1.4,0,e.r*1.4,'#b5f8f2',1.2);cx.font='bold 10px Trebuchet MS';cx.textAlign='center';cx.fillStyle='#b5f8f2';cx.fillText('ЦЕЛЬ',0,e.r+24);cx.restore();return;}const info=ENEMY[e.id],big=e.elite,motion=Math.sin(e.t*9+e.seed)*2;cx.save();cx.translate(e.x,e.y);cx.rotate(Math.atan2(S.player.y-e.y,S.player.x-e.x)+Math.PI/2);cx.scale(big?1.15:1, big?1.15:1);if(e.hunterWind>0||e.bruteWind>0){ring(0,0,e.r+10+Math.sin(e.t*15)*3,'#ffb480',3)}if(e.boosted>0){ring(0,0,e.r+5,'#b5a3ff',2)}if(e.champion){glow(0,0,e.r*2.6,'#ffb257',.25);ring(0,0,e.r+7,'#ffc16d',2.2)}if(e.hit>0)glow(0,0,e.r*2,RED,.43);if(e.shock>0){glow(0,0,e.r*2.4,'#b8faff',.45);ring(0,0,e.r+6,'#a8ebff',1.8)}
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
