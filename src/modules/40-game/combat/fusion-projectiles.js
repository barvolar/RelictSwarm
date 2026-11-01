function fusionLine(pos,target,width,damage,length,opts={}){
 const a=aimGeometry(pos,target),origin=weaponMuzzle(pos,target,opts.offset||0,25),end={x:origin.x+a.dx*length,y:origin.y+a.dy*length};
 let hits=[];
 for(const e of S.enemy)if(e.hp>0&&pointSegmentDist(e.x,e.y,origin.x,origin.y,end.x,end.y)<e.r+width/2){hurtEnemy(e,damage,opts);hits.push(e)}
 S.fx.push({type:'rail',a:origin,b:end,life:.38,max:.38,col:opts.color||'#bde8ff',width});
 return {origin,end,hits,a};
}
function fusionField(x,y,r,damage,life,col,opts={}){
 if(S.effects.length>64)S.effects.shift();
 S.effects.push({x,y,r,life,clock:0,damage,col,fire:!!opts.fire,ice:!!opts.ice,chill:opts.chill||0,chain:opts.chain||0});
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
  S.bullets.push({type:'boomer',x:source.x,y:source.y,vx:Math.cos(angle)*505,vy:Math.sin(angle)*505,spd:505,travel:0,range:Math.min(800,260+wm(d,'range')*35),returning:false,owner:d,damage,life:3.7,col,r:15,hitIds:new Set(),pierce:999,fireDisc:variant==='fire',trailClock:0,specialDisc:variant,mineBlast:58+wm(d,'blast')*16});
 }
}
function fusionMine(x,y,damage,col,r,variant,freezeStrength=0){
 S.mines.push({x,y,r:13,blast:r,damage,life:17,arm:.35,col,gravityMine:false,specialMine:variant,freezeStrength});
 if(S.mines.length>48)S.mines.splice(0,S.mines.length-48);
}

// Shattering adds a short-range explosion to an already frozen target.
// A lock stops overlapping beams and orbit blades from triggering it every frame.
function shatterFrozen(e,damage,r=62){
 if(!e||e.hp<=0||e.frost<=0||(e.shatterLock||0)>S.t)return false;
 e.frost=0;e.shatterLock=S.t+1.15;
 damageArea(e.x,e.y,r,damage,{color:'#b9edff',slow:.55});
 burst(e.x,e.y,'#cbf7ff',12,85);
 return true;
}
