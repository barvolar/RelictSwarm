// Permanent milestones and one selectable challenge per run.
// Awards are cosmetic or research currency. No weapon stat bonuses.
const ACHIEVEMENTS=[
 {id:'first_blood',glyph:'✦',name:'Первый контакт',desc:'Уничтожить 1 врага за забег',reward:20},
 {id:'swarm_100',glyph:'⚔',name:'Охотник на рой',desc:'Уничтожить 100 врагов за забег',reward:45},
 {id:'swarm_350',glyph:'⚔',name:'Штормовая зачистка',desc:'Уничтожить 350 врагов за забег',reward:95},
 {id:'survive_5',glyph:'◷',name:'Пять минут',desc:'Продержаться 5 минут',reward:40},
 {id:'survive_10',glyph:'◷',name:'Последний рубеж',desc:'Продержаться 10 минут',reward:90},
 {id:'first_fusion',glyph:'◈',name:'Преобразование',desc:'Создать первый синтез',reward:65},
 {id:'two_fusions',glyph:'◈',name:'Арсенал архитектора',desc:'Создать 2 синтеза за забег',reward:120},
 {id:'synth_guardian',glyph:'⬡',name:'Хранитель повержен',desc:'Победить Хранителя ядра',reward:70},
 {id:'boss_hunter',glyph:'✹',name:'Истребитель гигантов',desc:'Уничтожить 3 боссов за забег',reward:110},
 {id:'first_victory',glyph:'★',name:'Омега побеждена',desc:'Завершить забег победой',reward:150},
 {id:'three_victories',glyph:'★',name:'Ветеран',desc:'Одержать 3 победы',reward:180},
 {id:'hard_victory',glyph:'◇',name:'Стальной протокол',desc:'Победить на угрозе III или выше',reward:220},
 {id:'no_hit_5',glyph:'✧',name:'Без единой царапины',desc:'Первые 5 минут без полученного урона',reward:120},
 {id:'challenge_master',glyph:'✥',name:'Испытатель',desc:'Завершить 4 разных испытания',reward:180}
];
const CHALLENGES=[
 {id:'swarm',glyph:'⚔',name:'Охота на рой',desc:'Уничтожить 350 врагов за один забег',reward:130},
 {id:'core_hunter',glyph:'◈',name:'Добытчик ядер',desc:'Подобрать 2 ядра синтеза за забег',reward:140},
 {id:'master_fuser',glyph:'✦',name:'Алхимия оружия',desc:'Создать 2 синтеза за один забег',reward:160},
 {id:'boss_hunt',glyph:'⬡',name:'Охота на титанов',desc:'Уничтожить 3 боссов за забег',reward:170},
 {id:'no_hit',glyph:'✧',name:'Чистый манёвр',desc:'Первые 5 минут без полученного урона',reward:175},
 {id:'no_repairs',glyph:'♥',name:'Без ремонта',desc:'Победить без аптечек и карточек лечения',reward:230},
 {id:'threat_three',glyph:'◇',name:'Высшая готовность',desc:'Победить на угрозе III или выше',reward:260}
];
let selectedChallengeId='';
function challengeRunDefaults(){return{damageTaken:0,hitBeforeFive:false,manualHeals:0,coresCollected:0,bossesKilled:0,bossIds:[],maxWeapons:1};}
function challengeValue(id,s=S,won=false){
 if(!s)return 0;
 const c=s.challengeStats||{};
 switch(id){
  case'swarm':return s.kills||0;
  case'core_hunter':return c.coresCollected||0;
  case'master_fuser':return s.hybrids?.length||0;
  case'boss_hunt':return c.bossesKilled||0;
  case'no_hit':return s.t>=300&&!c.hitBeforeFive?1:0;
  case'no_repairs':return won&&c.manualHeals===0?1:0;
  case'threat_three':return won&&s.threat>=3?1:0;
  default:return 0;
 }
}
function challengeTarget(id){return {swarm:350,core_hunter:2,master_fuser:2,boss_hunt:3,no_hit:1,no_repairs:1,threat_three:1}[id]||1;}
function challengeProgressLabel(id,s=S,won=false){
 const value=challengeValue(id,s,won),total=challengeTarget(id);
 if(id==='no_repairs')return (s?.challengeStats?.manualHeals||0)+' использований ремонта · победа обязательна';
 if(id==='no_hit')return s?.challengeStats?.hitBeforeFive?'Попадание до 5:00, условие нарушено':(s?.t>=300?'Выполнено':formatTime(s?.t||0)+' / 05:00');
 if(id==='threat_three')return 'Протокол '+(s?.threat||1)+' · нужна победа на III+';
 return value+' / '+total;
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
  case'challenge_master':return Object.keys(save.challenges||{}).filter(k=>save.challenges[k]).length>=4;
  default:return false;
 }
}
function evaluateRunRewards(s,won,giveup){
 const granted=[],completedChallenge=null;
 // A voluntary exit never yields achievement bonuses.
 if(giveup)return {achievements:granted,challenge:null,bonus:0,skins:[]};
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
 if(Object.values(save.challenges).filter(Boolean).length>=4&&!save.skins.includes('sentinel')){
  save.skins.push('sentinel');unlocked.push('СТРАЖ');
 }
 save.shards+=bonus;
 return {achievements:granted,challenge,bonus,skins:unlocked};
}
