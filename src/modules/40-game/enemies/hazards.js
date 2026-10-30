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
  if(h.hit)continue;const k=clamp(1-h.delay/1.5,0,1);
  cx.save();cx.globalAlpha=.3+.4*k;
  if(h.type==='slash'){
   let x1=h.x+Math.cos(h.ang)*h.len,y1=h.y+Math.sin(h.ang)*h.len;
   cx.strokeStyle=h.col;cx.lineWidth=h.r*2;cx.lineCap='round';cx.setLineDash([12,12]);
   cx.beginPath();cx.moveTo(h.x,h.y);cx.lineTo(x1,y1);cx.stroke();cx.setLineDash([]);
   line(h.x,h.y,x1,y1,'#ffe0c0',3);
  }else{
   cx.fillStyle=h.col+'32';cx.strokeStyle=h.col;cx.lineWidth=3+k*2;
   cx.beginPath();cx.arc(h.x,h.y,h.r,0,TAU);cx.fill();cx.stroke();
   cx.beginPath();cx.arc(h.x,h.y,h.r*(1-k),0,TAU);cx.stroke();
  }
  cx.restore();
 }
}

