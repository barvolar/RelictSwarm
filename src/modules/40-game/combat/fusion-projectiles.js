function fusionLine(pos,target,width,damage,length,opts={}){
 const a=aimGeometry(pos,target),origin=weaponMuzzle(pos,target,0,25),end={x:origin.x+a.dx*length,y:origin.y+a.dy*length};
 let hits=[];
 for(const e of S.enemy)if(e.hp>0&&pointSegmentDist(e.x,e.y,origin.x,origin.y,end.x,end.y)<e.r+width/2){hurtEnemy(e,damage,opts);hits.push(e)}
 S.fx.push({type:'rail',a:origin,b:end,life:.38,max:.38,col:opts.color||'#bde8ff',width});
 return {origin,end,hits,a};
}
function fusionField(x,y,r,damage,life,col,opts={}){
 if(S.effects.length>64)S.effects.shift();
 S.effects.push({x,y,r,life,clock:0,damage,col,fire:!!opts.fire});
 S.fx.push({type:'ring',x,y,r,life:.48,max:.48,col});
}
function fusionRocket(pos,target,dmg,col,variant,blast,n=1){
 for(let k=0;k<Math.min(7,n);k++){
  const angle=k*TAU/Math.max(1,n)+S.t;
  S.bullets.push({type:'rocket',x:pos.x+Math.cos(angle)*15,y:pos.y+Math.sin(angle)*15,vx:Math.cos(angle)*75,vy:Math.sin(angle)*75,target,spd:360,life:3.6,r:7,dmg,col,blast,hybrid:variant});
 }
}
function fusionBoomer(pos,target,d,damage,col,n,variant){
 const a=aimGeometry(pos,target);
 for(let k=0;k<Math.min(6,n);k++){
  const angle=Math.atan2(a.dy,a.dx)+(k-(n-1)/2)*.15,source=weaponMuzzle(pos,target,(k-(n-1)/2)*8,20);
  S.bullets.push({type:'boomer',x:source.x,y:source.y,vx:Math.cos(angle)*505,vy:Math.sin(angle)*505,spd:505,travel:0,range:Math.min(800,260+wm(d,'range')*35),returning:false,owner:d,damage,life:3.7,col,r:15,hitIds:new Set(),pierce:999,fireDisc:variant==='fire',trailClock:0,specialDisc:variant});
 }
}
function fusionMine(x,y,damage,col,r,variant){
 S.mines.push({x,y,r:13,blast:r,damage,life:17,arm:.35,col,gravityMine:false,specialMine:variant});
 if(S.mines.length>48)S.mines.splice(0,S.mines.length-48);
}
