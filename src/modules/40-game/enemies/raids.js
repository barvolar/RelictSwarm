function executeRaid(evt){
 const bossUnderAttack=S.bosses.some(b=>b.hp>0);const mult=(S.threat>=4?1.35:S.threat>=2?1.15:1)*(bossUnderAttack?.55:1);
 const nEnemy=S.enemy.filter(e=>e.hp>0).length;
 if(nEnemy>145){banner('⚠ '+evt.name+' // ПОДКРЕПЛЕНИЕ ПРИБЛИЖАЕТСЯ',3);return;}
 for(let block=0;block<evt.units.length;block++){
  const [type,baseCount]=evt.units[block],count=Math.round(baseCount*mult);
  const center=rand(0,TAU);
  for(let k=0;k<count;k++){
   const a=center+(k-(count-1)/2)*(.15/(1+(block*.1)))+rand(-.05,.05);
   const e=spawnEnemy(type,a,440+rand(-28,30));
   if(e&&S.threat>=3&&Math.random()<.12&&!e.champion){e.champion=true;e.hp*=2;e.maxHp=e.hp;e.dmg*=1.25;e.value*=2;}
  }
 }
 banner('⚠ '+evt.name+' // ПРИОРИТЕТ ЦЕЛЕЙ!',3.4);sfx('warning',.6);
}
