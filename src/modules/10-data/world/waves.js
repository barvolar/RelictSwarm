const RAID_EVENTS=[
 {t:90,name:'ОХОТА: ФЛАНГОВЫЙ ЗАХВАТ',units:[['hunter',10],['scarab',6]]},
 {t:210,name:'ОСАДА: ТАРАНЫ И СТРЕЛКИ',units:[['brute',5],['sentry',8]]},
 {t:345,name:'ГНЕЗДО: МАТКИ ПОДДЕРЖКИ',units:[['hive',4],['scarab',16]]},
 {t:480,name:'ПЕРЕХВАТ: МАНЁВРЕННАЯ ГРУППА',units:[['hunter',12],['sentry',9]]},
 {t:615,name:'БРОНЕВОЙ ПРОРЫВ',units:[['brute',9],['phantom',10]]},
 {t:725,name:'ЗАСАДА: ШЕСТЬ СТОРОН',units:[['hunter',12],['phantom',12]]},
 {t:835,name:'ПОСЛЕДНИЙ РУБЕЖ РОЯ',units:[['hive',4],['brute',7],['sentry',9]]}
];
const BOSS_POOLS={boss:['boss1','boss2','boss3'],synth:['synth1','synth2','synth3']};
function shuffledBosses(kind){const ids=BOSS_POOLS[kind].slice();for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}return ids;}
const BOSS_EVENTS=[{t:180,id:'boss1'},{t:420,id:'boss2'},{t:660,id:'boss3'},{t:900,id:'omega'}];
const SYNTH_EVENTS=[{t:365,id:'synth1'},{t:550,id:'synth2'},{t:765,id:'synth3'}];
