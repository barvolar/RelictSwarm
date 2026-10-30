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
