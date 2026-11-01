function pointSegmentDist(px,py,x0,y0,x1,y1){let dx=x1-x0,dy=y1-y0,t=clamp(((px-x0)*dx+(py-y0)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(px-(x0+dx*t),py-(y0+dy*t))}
function updateHazards(dt){
 for(const h of S.hazards){h.delay-=dt;h.life-=dt;
  if(h.delay>0||h.hit)continue;
  h.hit=true;
  if(h.type==='slash'){
   let x1=h.x+Math.cos(h.ang)*h.len,y1=h.y+Math.sin(h.ang)*h.len;
   if(pointSegmentDist(S.player.x,S.player.y,h.x,h.y,x1,y1)<h.r+S.player.rad)hitPlayer(h.dmg,h.x,h.y);
   S.fx.push({type:'beam',a:{x:h.x,y:h.y},b:{x:x1,y:y1},life:.25,max:.25,col:h.col,width:12});
   shake=Math.max(8,shake);
  }else{
   if(Math.hypot(S.player.x-h.x,S.player.y-h.y)<h.r+S.player.rad)hitPlayer(h.dmg,h.x,h.y);
   S.fx.push({type:'ring',x:h.x,y:h.y,r:h.r,life:.4,max:.4,col:h.col});
   burst(h.x,h.y,h.col,16,160);
  }
 }
 S.hazards=S.hazards.filter(h=>h.life>-.3);
}
function drawHazards(){
 for(const h of S.hazards){
  if(h.hit)continue;
  // Red = ENEMY damage telegraph, regardless of the boss's theme colour.
  // The shrinking inner ring reaches zero at impact. Damage/timing unchanged.
  const k=clamp(1-h.delay/1.7,0,1),imminent=h.delay<.32;
  cx.save();
  cx.globalAlpha=.58+.35*k;
  if(h.type==='slash'){
   const x1=h.x+Math.cos(h.ang)*h.len,y1=h.y+Math.sin(h.ang)*h.len;
   cx.strokeStyle=imminent?'#ffe4be':'#ff6475';
   cx.lineWidth=h.r*2;cx.lineCap='round';cx.setLineDash([12,12]);
   cx.beginPath();cx.moveTo(h.x,h.y);cx.lineTo(x1,y1);cx.stroke();
   cx.setLineDash([]);
   line(h.x,h.y,x1,y1,imminent?'#fff4d7':'#ffb9a4',3);
  }else{
   cx.fillStyle=imminent?'#ff495436':'#ff364324';
   cx.strokeStyle=imminent?'#ffe1b1':'#ff6779';
   cx.lineWidth=imminent?5:3.5;
   cx.beginPath();cx.arc(h.x,h.y,h.r,0,TAU);cx.fill();cx.stroke();
   cx.setLineDash([8,8]);
   cx.strokeStyle='#ff9a9c';cx.lineWidth=1.5;
   cx.beginPath();cx.arc(h.x,h.y,h.r+6,0,TAU);cx.stroke();
   cx.setLineDash([]);
   cx.strokeStyle=imminent?'#fff5d9':'#ffccd0';cx.lineWidth=2.8;
   cx.beginPath();cx.arc(h.x,h.y,Math.max(2,h.r*(1-k)),0,TAU);cx.stroke();
   cx.fillStyle=imminent?'#fff5d9':'#ffb2b8';
   cx.beginPath();cx.moveTo(h.x-6,h.y-6);cx.lineTo(h.x+6,h.y+6);
   cx.moveTo(h.x+6,h.y-6);cx.lineTo(h.x-6,h.y+6);cx.lineWidth=2;cx.strokeStyle=cx.fillStyle;cx.stroke();
  }
  cx.restore();
 }
}

