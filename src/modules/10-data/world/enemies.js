const META=[
 {id:'hull',name:'Бронепластины',sub:'+15 к максимальной прочности корпуса',cost:15,step:14,max:6,glyph:'⬡'},
 {id:'power',name:'Боевой процессор',sub:'+6% к урону всех дронов',cost:25,step:21,max:6,glyph:'ϟ'},
 {id:'magnet',name:'Магнитный захват',sub:'+16 к радиусу сбора данных',cost:15,step:13,max:6,glyph:'◎'},
 {id:'regen',name:'Саморемонт',sub:'+0.12 прочности в секунду',cost:25,step:19,max:5,glyph:'✚'}
];
const ENEMY={
 scarab:{name:'Скарабей',hp:21,spd:84,rad:16,dmg:10,xp:3,col:'#79f3a4',value:7},
 hunter:{name:'Охотник',hp:34,spd:122,rad:15,dmg:8,xp:4,col:'#ffca69',value:11},
 brute:{name:'Таран',hp:125,spd:48,rad:25,dmg:19,xp:9,col:'#eb7785',value:25},
 sentry:{name:'Стрелок',hp:92,spd:77,rad:19,dmg:16,xp:6,col:'#91b9ff',value:17},
 hive:{name:'Матка',hp:135,spd:73,rad:23,dmg:12,xp:9,col:'#bc92ff',value:23},
 phantom:{name:'Фантом',hp:74,spd:110,rad:17,dmg:17,xp:7,col:'#6ff4f0',value:20},
 synth1:{name:'СИНТЕЗ-АЛЬФА // ХРАНИТЕЛЬ ЯДРА',hp:15500,spd:67,rad:62,dmg:39,xp:95,col:'#f1b75d',value:1900},
 synth2:{name:'СИНТЕЗ-БЕТА // КУЗНЕЦ ХАОСА',hp:36000,spd:78,rad:72,dmg:48,xp:155,col:'#65e8ff',value:2600},
  synth3:{name:'СИНТЕЗ-ГАММА // СБОЙ РЕАКТОРА',hp:34000,spd:75,rad:70,dmg:54,xp:185,col:'#fe9fb6',value:3400},
 boss1:{name:'ЖНЕЦ-01 // РАЗРЫВАТЕЛЬ',hp:9300,spd:80,rad:54,dmg:26,xp:60,col:'#fb8d64',value:1100},
 boss2:{name:'АРХОНТ // ПРИЗЫВАТЕЛЬ',hp:19500,spd:54,rad:61,dmg:31,xp:100,col:'#ba81ff',value:1700},
  boss3:{name:'КАРАТЕЛЬ // ЛОВУШКИ ПЕРИМЕТРА',hp:28500,spd:66,rad:66,dmg:38,xp:135,col:'#ff779e',value:2400},
 omega:{name:'ОМЕГА // ПРОБУЖДЕНИЕ',hp:34500,spd:68,rad:74,dmg:36,xp:150,col:'#ffbc68',value:3200},
};
