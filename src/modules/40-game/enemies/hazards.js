function pointSegmentDist(px,py,x0,y0,x1,y1){let dx=x1-x0,dy=y1-y0,t=clamp(((px-x0)*dx+(py-y0)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(px-(x0+dx*t),py-(y0+dy*t))}
function updateHazards(dt){
 for(const h of S.hazards){
  h.delay-=dt;h.life-=dt;
  if(h.owner&&h.owner.hp<=0){h.hit=true;h.life=-1;continue;}
  // The telegraphed sweep visibly rotates before the actual strike.
  if(h.type==='sweep'&&h.delay>0)h.ang+=(h.turnSpeed||0)*dt;
  if(h.delay>0||h.hit)continue;
  h.hit=true;
  if(h.type==='slash'||h.type==='dash'||h.type==='sweep'){
   const x1=h.x+Math.cos(h.ang)*h.len,y1=h.y+Math.sin(h.ang)*h.len;
   if(pointSegmentDist(S.player.x,S.player.y,h.x,h.y,x1,y1)<h.r+S.player.rad)hitPlayer(h.dmg,h.x,h.y);
   S.fx.push({type:'beam',a:{x:h.x,y:h.y},b:{x:x1,y:y1},life:.26,max:.26,col:h.col,width:h.type==='dash'?15:12});
   if(h.type==='dash'&&h.owner&&h.owner.hp>0){
    // The Reaper now really moves along the warned path; no invisible teleport.
    const oldX=h.owner.x,oldY=h.owner.y;
    h.owner.x=clamp(x1,-1700,1700);h.owner.y=clamp(y1,-1700,1700);
    h.owner.attack=Math.max(h.owner.attack||0,.38);
    burst(oldX,oldY,h.col,10,80);burst(h.owner.x,h.owner.y,h.col,16,110);
   }
   shake=Math.max(8,shake);
  }else if(h.type==='annulus'){
   const d=Math.hypot(S.player.x-h.x,S.player.y-h.y);
   if(d+S.player.rad>=h.inner&&d-S.player.rad<=h.r)hitPlayer(h.dmg,h.x,h.y);
   S.fx.push({type:'ring',x:h.x,y:h.y,r:h.r,life:.38,max:.38,col:h.col});
   burst(h.x,h.y,h.col,10,100);
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
  // Red/amber indicates incoming enemy damage. Cyan in annuli marks safe centers.
  const k=clamp(1-h.delay/1.7,0,1),imminent=h.delay<.32;
  cx.save();cx.globalAlpha=.58+.35*k;
  if(h.type==='slash'||h.type==='dash'||h.type==='sweep'){
   const x1=h.x+Math.cos(h.ang)*h.len,y1=h.y+Math.sin(h.ang)*h.len;
   cx.strokeStyle=imminent?'#ffe4be':'#ff6475';
   cx.lineWidth=h.r*2;cx.lineCap='round';cx.setLineDash([12,12]);
   cx.beginPath();cx.moveTo(h.x,h.y);cx.lineTo(x1,y1);cx.stroke();
   cx.setLineDash([]);
   line(h.x,h.y,x1,y1,imminent?'#fff4d7':'#ffb9a4',3);
   if(h.type==='dash'){circ(x1,y1,6,'#fff0c8');ring(x1,y1,h.r,'#ffb8a1',2);}
   if(h.type==='sweep'){circ(h.x,h.y,6,'#fff0c8');}
  }else if(h.type==='annulus'){
   cx.fillStyle=imminent?'#ff495436':'#ff364324';
   cx.strokeStyle=imminent?'#ffe1b1':'#ff6779';cx.lineWidth=imminent?5:3.5;
   cx.beginPath();cx.arc(h.x,h.y,h.r,0,TAU);
   cx.arc(h.x,h.y,h.inner,0,TAU,true);cx.fill('evenodd');cx.stroke();
   ring(h.x,h.y,h.inner,'#76e2d1',3.2);
   ring(h.x,h.y,h.r,'#ff8598',imminent?4:2.5);
   cx.strokeStyle=imminent?'#fff5d9':'#ffccd0';cx.lineWidth=2.8;
   cx.beginPath();cx.arc(h.x,h.y,Math.max(h.inner+2,h.r*(1-k)),0,TAU);cx.stroke();
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
