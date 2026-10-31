function burst(x,y,col,n=11,power=100){if(!S)return;for(let i=0;i<n&&S.parts.length<650;i++){let a=rand(0,TAU),v=rand(power*.15,power),life=rand(.25,.75);S.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life,max:life,size:rand(1.5,4),col})}}
function floatNum(x,y,val,col){if(S.floaters.length>70)S.floaters.shift();S.floaters.push({x,y,t:.7,val:Math.round(val),col})}
function heal(n){let p=S.player;p.hp=Math.min(p.maxHp,p.hp+n*(1+(S.healBonus||0)))}
function spawnPowerup(x=null,y=null,type=null){if(!S)return;const types=['magnet','rage','invuln','heal'],choice=type||types[Math.floor(Math.random()*types.length)];
 const a=rand(0,TAU),r=rand(125,240),px=x??S.player.x+Math.cos(a)*r,py=y??S.player.y+Math.sin(a)*r;
 S.pickups.push({x:clamp(px,-1750,1750),y:clamp(py,-1750,1750),xp:38,r:14,life:28,type:choice});}
function applyPowerup(o){
 switch(o.type){
 case 'core':S.fusionCores++;banner('◈ ЯДРО СИНТЕЗА ПОДОБРАНО!',4);break;
 case 'magnet':S.magnetTimer=4.5*(S.buffDuration||1);toast('◎ МАГНИТ: ВЕСЬ ОПЫТ НА КАРТЕ!',3);break;
 case 'rage':S.rageTimer=13*(S.buffDuration||1);toast('ϟ ЯРОСТЬ: УРОН ×2.1 НА 13 СЕКУНД',3);break;
 case 'invuln':S.invulnTimer=8*(S.buffDuration||1);S.player.inv=Math.max(S.player.inv,S.invulnTimer);toast('⬡ НЕУЯЗВИМОСТЬ: 8 СЕКУНД',3);break;
 case 'heal':heal(38);toast('✚ РЕМОНТ КОРПУСА',2);break;
 }
 sfx('pickup');burst(S.player.x,S.player.y,o.type==='rage'?AMBER:o.type==='invuln'?BLUE:TEAL,35,150);
}
