// Permanent research. Previously purchased levels keep their original effects.
const META=[
 {id:'hull',group:'hull',name:'Бронепластины',sub:'+15 HP до 6-го уровня, затем +7 HP',cost:15,step:14,max:30,glyph:'⬡'},
 {id:'regen',group:'hull',name:'Саморемонт',sub:'+0,12 HP/с до 5-го уровня, затем +0,04 HP/с',cost:25,step:19,max:25,glyph:'✚'},
 {id:'armor',group:'hull',name:'Композитная броня',sub:'−0,4% получаемого урона за уровень',cost:40,step:26,max:20,glyph:'▣'},
 {id:'repair',group:'hull',name:'Ремонтные наниты',sub:'+1% к лечению за уровень',cost:30,step:22,max:20,glyph:'♥'},
 {id:'power',group:'weapons',name:'Боевой процессор',sub:'+6% урона до 6-го уровня, затем +1,2%',cost:25,step:21,max:30,glyph:'ϟ'},
 {id:'haste',group:'weapons',name:'Разгон турелей',sub:'+0,5% к частоте атак за уровень',cost:40,step:31,max:20,glyph:'⌁'},
 {id:'critChance',group:'weapons',name:'Критический анализ',sub:'+0,35 п.п. к шансу критического попадания',cost:55,step:34,max:20,glyph:'⌖'},
 {id:'critDamage',group:'weapons',name:'Усиленные боеприпасы',sub:'+2 п.п. к критическому урону за уровень',cost:45,step:30,max:25,glyph:'✦'},
 {id:'speed',group:'systems',name:'Улучшенные приводы',sub:'+0,4% к скорости движения за уровень',cost:25,step:20,max:20,glyph:'➤'},
 {id:'dash',group:'systems',name:'Конденсатор рывка',sub:'−1% к перезарядке рывка за уровень',cost:40,step:24,max:20,glyph:'↝'},
 {id:'magnet',group:'systems',name:'Магнитный захват',sub:'+16 к радиусу до 6-го уровня, затем +8',cost:15,step:13,max:30,glyph:'◎'},
 {id:'duration',group:'systems',name:'Стабилизатор усилений',sub:'+1% к длительности временных бонусов',cost:35,step:26,max:20,glyph:'◷'},
 {id:'xp',group:'research',name:'Анализ данных',sub:'+1% получаемого опыта за уровень',cost:30,step:24,max:25,glyph:'◇'},
 {id:'shards',group:'research',name:'Переработка реликтов',sub:'+2% к кристаллам по итогам забега',cost:45,step:30,max:25,glyph:'✧'},
 {id:'rarity',group:'research',name:'Система поиска',sub:'Повышает шанс необычных, редких и эпических карточек',cost:65,step:41,max:15,glyph:'✥'},
 {id:'score',group:'research',name:'Боевой анализатор',sub:'+1% к итоговому счёту за уровень',cost:35,step:26,max:20,glyph:'▤'}
];
const META_GROUPS=[
 {id:'hull',name:'КОРПУС',desc:'Защита и ремонт',glyph:'⬡'},
 {id:'weapons',name:'ВООРУЖЕНИЕ',desc:'Сила и точность',glyph:'ϟ'},
 {id:'systems',name:'СИСТЕМЫ',desc:'Мобильность и сбор',glyph:'⌁'},
 {id:'research',name:'ИССЛЕДОВАНИЯ',desc:'Опыт и награды',glyph:'✧'}
];
function metaLevel(id){const m=META.find(x=>x.id===id);return m?Math.min(m.max,Math.max(0,Math.floor(Number(save?.meta?.[id])||0))):0}
function metaCost(m,n){return Math.ceil(m.cost+m.step*n+3*Math.max(0,n-8)**2)}
function metaBonus(id,n=metaLevel(id)){
 const p=Math.max(0,n);
 switch(id){
  case'hull':return 15*Math.min(p,6)+7*Math.max(0,p-6);
  case'regen':return .12*Math.min(p,5)+.04*Math.max(0,p-5);
  case'power':return .06*Math.min(p,6)+.012*Math.max(0,p-6);
  case'magnet':return 16*Math.min(p,6)+8*Math.max(0,p-6);
  case'armor':return .004*p;
  case'repair':case'duration':case'dash':case'xp':case'score':return .01*p;
  case'haste':return .005*p;
  case'critChance':return .0035*p;
  case'critDamage':case'shards':return .02*p;
  case'speed':return .004*p;
  case'rarity':return p;
  default:return 0;
 }
}
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
