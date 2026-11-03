// Permanent milestones and one selectable challenge per run.
// Awards are cosmetic or research currency. No weapon stat bonuses.
const ACHIEVEMENTS=[
 {id:'first_blood',glyph:'✦',name:'Первый контакт',desc:'Уничтожить 1 врага за забег',reward:120},
 {id:'swarm_100',glyph:'⚔',name:'Охотник на рой',desc:'Уничтожить 100 врагов за забег',reward:240},
 {id:'swarm_350',glyph:'⚔',name:'Штормовая зачистка',desc:'Уничтожить 350 врагов за забег',reward:440},
 {id:'survive_5',glyph:'◷',name:'Пять минут',desc:'Продержаться 5 минут',reward:200},
 {id:'survive_10',glyph:'◷',name:'Последний рубеж',desc:'Продержаться 10 минут',reward:450},
 {id:'first_fusion',glyph:'◈',name:'Преобразование',desc:'Создать первый синтез',reward:360},
 {id:'two_fusions',glyph:'◈',name:'Арсенал архитектора',desc:'Создать 2 синтеза за забег',reward:650},
 {id:'synth_guardian',glyph:'⬡',name:'Хранитель повержен',desc:'Победить Хранителя ядра',reward:380},
 {id:'boss_hunter',glyph:'✹',name:'Истребитель гигантов',desc:'Уничтожить 3 боссов за забег',reward:660},
 {id:'first_victory',glyph:'★',name:'Омега побеждена',desc:'Завершить забег победой',reward:950},
 {id:'three_victories',glyph:'★',name:'Ветеран',desc:'Одержать 3 победы',reward:1150},
 {id:'hard_victory',glyph:'◇',name:'Стальной протокол',desc:'Победить на угрозе III или выше',reward:1350},
 {id:'no_hit_5',glyph:'✧',name:'Без единой царапины',desc:'Первые 5 минут без полученного урона',reward:650},
 {id:'challenge_master',glyph:'✥',name:'Испытатель',desc:'Завершить 4 разных испытания',reward:1100}
];
const CHALLENGES=[
 {id:'no_hit',glyph:'✧',name:'Чистый манёвр',desc:'Первые 5 минут без единого попадания',reward:550},
 {id:'iron_soul',glyph:'◈',name:'Железная воля',desc:'Победить на угрозе II+ с не более чем 3 попаданиями за весь забег',reward:1600},
 {id:'minimalist_v2',glyph:'◇',name:'Тесный арсенал',desc:'Победить на угрозе II+, ни разу не заняв более 3 слотов оружия',reward:1400},
 {id:'no_repairs_v2',glyph:'♥',name:'Сухая сборка',desc:'Победить на угрозе III+ без аптечек и карточек ремонта',reward:1600},
 {id:'double_fusion_v2',glyph:'✦',name:'Двойной синтез',desc:'Победить на угрозе II+ с двумя разными синтезами',reward:1250},
 {id:'gauntlet_v2',glyph:'⬡',name:'Турнир титанов',desc:'На угрозе III+ победить всех 3 боссов синтеза и Омегу за один забег',reward:1700},
 {id:'rapid_omega_v2',glyph:'ϟ',name:'Молниеносная Омега',desc:'Победить на угрозе II+, уничтожив Омегу за 90 секунд с её появления',reward:2100},
 {id:'no_powerups_v2',glyph:'◉',name:'Один против роя',desc:'Победить на угрозе II+ без подбора временных бонусов',reward:1500}
];
let selectedChallengeId='';
function completedChallengeCount(){return CHALLENGES.filter(c=>save.challenges?.[c.id]).length;}
function challengeBonusRerolls(){const n=completedChallengeCount();return n>=8?2:n>=4?1:0;}
function challengeRunDefaults(){return{
 damageTaken:0,hitsTaken:0,hitBeforeFive:false,manualHeals:0,powerupsTaken:0,
 coresCollected:0,bossesKilled:0,bossIds:[],maxWeapons:1,omegaSpawnAt:null
};}
function challengeValue(id,s=S,won=false){
 if(!s)return 0;
 const c=s.challengeStats||{},bosses=c.bossIds||[];
 switch(id){
  case'no_hit':return s.t>=300&&!c.hitBeforeFive?1:0;
  case'iron_soul':return won&&s.threat>=2&&(c.hitsTaken||0)<=3?1:0;
  case'minimalist_v2':return won&&s.threat>=2&&(c.maxWeapons||1)<=3?1:0;
  case'no_repairs_v2':return won&&s.threat>=3&&(c.manualHeals||0)===0?1:0;
  case'double_fusion_v2':return won&&s.threat>=2&&new Set((s.hybrids||[]).map(h=>h.id)).size>=2?1:0;
  case'gauntlet_v2':return won&&s.threat>=3&&['synth1','synth2','synth3','omega'].every(id=>bosses.includes(id))?1:0;
  case'rapid_omega_v2':return won&&s.threat>=2&&Number.isFinite(c.omegaSpawnAt)&&s.t-c.omegaSpawnAt<=90?1:0;
  case'no_powerups_v2':return won&&s.threat>=2&&(c.powerupsTaken||0)===0?1:0;
  default:return 0;
 }
}
function challengeTarget(id){return 1;}
function challengeProgressLabel(id,s=S,won=false){
 const c=s?.challengeStats||{},n=challengeValue(id,s,won);
 const tier=' · нужен протокол '+((id==='no_repairs_v2'||id==='gauntlet_v2')?'III+':'II+');
 switch(id){
  case'no_hit':return c.hitBeforeFive?'ПРОВАЛЕНО: попадание до 5:00':s.t>=300?'ВЫПОЛНЕНО':formatTime(s.t)+' / 05:00 · без попаданий';
  case'iron_soul':return (c.hitsTaken||0)+'/3 попадания'+tier+((c.hitsTaken||0)>3?' · ПРОВАЛЕНО':'');
  case'minimalist_v2':return (c.maxWeapons||1)+'/3 максимальных слота'+tier+((c.maxWeapons||1)>3?' · ПРОВАЛЕНО':'');
  case'no_repairs_v2':return (c.manualHeals||0)+' ремонтов'+tier+((c.manualHeals||0)>0?' · ПРОВАЛЕНО':'');
  case'double_fusion_v2':return new Set((s.hybrids||[]).map(h=>h.id)).size+'/2 синтеза'+tier;
  case'gauntlet_v2':return ['synth1','synth2','synth3','omega'].filter(id=>(c.bossIds||[]).includes(id)).length+'/4 босса'+tier;
  case'rapid_omega_v2':return c.omegaSpawnAt==null?'Ожидание Омеги'+tier:Math.floor(Math.max(0,s.t-c.omegaSpawnAt))+'/90 сек. до победы'+tier;
  case'no_powerups_v2':return (c.powerupsTaken||0)+' бонусов подобрано'+tier+((c.powerupsTaken||0)>0?' · ПРОВАЛЕНО':'');
  default:return n?'Выполнено':'Не выполнено';
 }
}
function achievementCompleted(id,s,won){
 const c=s.challengeStats||{},bosses=c.bossIds||[];
 switch(id){
  case'first_blood':return s.kills>=1;
  case'swarm_100':return s.kills>=100;
  case'swarm_350':return s.kills>=350;
  case'survive_5':return s.t>=300;
  case'survive_10':return s.t>=600;
  case'first_fusion':return s.hybrids.length>=1;
  case'two_fusions':return s.hybrids.length>=2;
  case'synth_guardian':return bosses.includes('synth1');
  case'boss_hunter':return c.bossesKilled>=3;
  case'first_victory':return won;
  case'three_victories':return save.wins>=3;
  case'hard_victory':return won&&s.threat>=3;
  case'no_hit_5':return s.t>=300&&!c.hitBeforeFive;
  case'challenge_master':return completedChallengeCount()>=4;
  default:return false;
 }
}
function evaluateRunRewards(s,won,giveup){
 const granted=[],completedChallenge=null;
 // A voluntary exit never yields achievement bonuses.
 if(giveup||s.qaModified)return {achievements:granted,challenge:null,bonus:0,skins:[]};
 let bonus=0;
 const chosen=CHALLENGES.find(c=>c.id===s.challengeId);
 let challenge=null;
 if(chosen&&!save.challenges[chosen.id]&&challengeValue(chosen.id,s,won)>=challengeTarget(chosen.id)){
  save.challenges[chosen.id]=true;bonus+=chosen.reward;challenge=chosen;
 }
 for(const a of ACHIEVEMENTS){
  if(!save.achievements[a.id]&&achievementCompleted(a.id,s,won)){
   save.achievements[a.id]=true;granted.push(a);bonus+=a.reward;
  }
 }
 const unlocked=[];
 if(Object.values(save.achievements).filter(Boolean).length>=8&&!save.skins.includes('nova')){
  save.skins.push('nova');unlocked.push('НОВА');
 }
 if(completedChallengeCount()>=4&&!save.skins.includes('sentinel')){
  save.skins.push('sentinel');unlocked.push('СТРАЖ');
 }
 if(completedChallengeCount()>=8&&!save.skins.includes('chronos')){
  save.skins.push('chronos');unlocked.push('ХРОНОС');
 }
  save.shards+=bonus;
 return {achievements:granted,challenge,bonus,skins:unlocked};
}
