function updateDrops(dt){
 let p=S.player;
 for(const o of S.pickups){
  o.life-=dt;const dx=p.x-o.x,dy=p.y-o.y,di=hypot(dx,dy);
  const drawn=S.magnetTimer>0&&o.type==='xp',reach=drawn?10000:S.magnet;
  if(di<reach){const m=drawn?1:Math.max(0,1-di/reach);const sp=drawn?1600:170+800*m;
   o.x+=dx/di*Math.min(di/dt,sp)*dt;o.y+=dy/di*Math.min(di/dt,sp)*dt;
  }
  if(di<22){o.life=-1;
   if(o.type==='xp'){gainXP(o.xp);if(Math.random()<.07)clickSound(760,.035,'triangle',.012)}
   else if(o.type==='shard'){S.shards+=o.xp;clickSound(1090,.13,'sine',.045)}
   else applyPowerup(o);
   burst(o.x,o.y,o.type==='xp'?TEAL:o.type==='shard'?AMBER:'#80fdab',3,45);
  }
 }
 S.pickups=S.pickups.filter(o=>o.life>0);
 for(const o of S.parts){o.life-=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.vx*=.975;o.vy*=.975}
 S.parts=S.parts.filter(o=>o.life>0);
 for(const f of S.floaters){f.t-=dt;f.y-=dt*45}S.floaters=S.floaters.filter(x=>x.t>0)
}
