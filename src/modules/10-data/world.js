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
const HYBRIDS={

 spear:{name:'ИОННОЕ КОПЬЁ',a:'pulse',b:'rail',glyph:'⟐',color:'#f8dea0',desc:'Узкий ускоренный пробивной импульс. Дополнительные лазеры поражают цели рядом с линией.'},
 polar:{name:'ПОЛЯРНЫЙ ЛУЧ',a:'pulse',b:'cryo',glyph:'❄',color:'#a6f4ff',desc:'Лазер накладывает лёд, оставляя морозную полосу и раскалывая замороженных врагов.'},
 prism:{name:'ПРИЗМЕННАЯ СИНГУЛЯРНОСТЬ',a:'pulse',b:'gravity',glyph:'◇',color:'#8dfde9',desc:'Создаёт микросингулярность; от неё расходятся лазерные лучи к захваченным врагам.'},
 siege:{name:'ОСАДНЫЙ ДРОТИК',a:'rail',b:'rocket',glyph:'➤',color:'#ffd19a',desc:'Тяжёлый снаряд пробивает колонну врагов, затем взрывается и разбрасывает ударную волну.'},
 thunder:{name:'ГРОМОВОЕ КОПЬЁ',a:'rail',b:'arc',glyph:'ϟ',color:'#f5e19e',desc:'Пробивающий импульс порождает последовательные разряды на пути и у последней цели.'},
 overload:{name:'МАТРИЦА ПЕРЕГРУЗКИ',a:'plasma',b:'arc',glyph:'✦',color:'#bb9aff',desc:'Плазменные узлы создают зону поражения и бьют электрическими дугами по целям вокруг.'},
 frostwell:{name:'АБСОЛЮТНЫЙ НОЛЬ',a:'gravity',b:'cryo',glyph:'◈',color:'#b5dafa',desc:'Чёрная дыра втягивает врагов, замораживает их и в конце раскалывается ледяным импульсом.'},
 thermoshock:{name:'ТЕРМОШОК',a:'flame',b:'cryo',glyph:'♨',color:'#ffcd99',desc:'Попеременные струи жара и холода взрывают врагов, получивших оба статуса.'},
 napalm:{name:'НАПАЛМ-ЗАЛП',a:'rocket',b:'flame',glyph:'✹',color:'#ff9952',desc:'Ракеты разбрасывают горящий напалм, создавая длительные огненные зоны.'},
 frostblade:{name:'ГЛЯЦИАЛЬНЫЙ ВЕНЕЦ',a:'saw',b:'cryo',glyph:'❅',color:'#b8eaff',desc:'Орбитальные ледяные пилы охлаждают, замораживают и раскалывают врагов.'},
 arcdisc:{name:'ДУГОВОЙ ДИСК',a:'boomer',b:'arc',glyph:'⟲',color:'#f5d28c',desc:'Возвратные диски бьют током, выпуская цепные молнии при ударе.'},
 trapdisc:{name:'МИННЫЙ БУМЕРАНГ',a:'boomer',b:'mine',glyph:'✹',color:'#f9c572',desc:'Возвратные диски рассыпают мины по маршруту, образуя опасные коридоры.'},
 sunheart:{name:'СОЛНЕЧНОЕ ЯДРО',a:'flame',b:'gravity',glyph:'☼',color:'#ffac71',desc:'Огненный вихрь притягивает противников и прожигает их в центре.'},
 frostmine:{name:'КРИОМИНА',a:'mine',b:'cryo',glyph:'✧',color:'#9addff',desc:'Мины после взрыва формируют ледяные поля, замедляющие и замораживающие врагов.'},
 plasmamelt:{name:'КОНТУР ПЛАВЛЕНИЯ',a:'flame',b:'plasma',glyph:'♨',color:'#ffaed0',desc:'Плотная дуга сверхгорячей плазмы прожигает толпу и оставляет раскалённые зоны.'},
 railplasma:{name:'ПЛАЗМЕННЫЙ ШИП',a:'rail',b:'plasma',glyph:'✦',color:'#8bccff',desc:'Пробивной заряд по линии оставляет за каждым попаданием плазменный ожог.'},
 magnetblade:{name:'МАГНИТНЫЙ ВЕНЕЦ',a:'saw',b:'gravity',glyph:'◉',color:'#d7adff',desc:'Вращающиеся клинки втягивают врагов к орбите и режут их при сближении.'},
 glacier:{name:'КРИОРЕЛЬСОТРОН',a:'rail',b:'cryo',glyph:'❅',color:'#b8ecff',desc:'Пробивает сразу несколько врагов, замедляет и замораживает линию наступления.'},
 singularity:{name:'СИНГУЛЯРНАЯ МИНА',a:'mine',b:'gravity',glyph:'◉',color:'#c5a6ff',desc:'Каждая мина стягивает ближайших врагов и взрывается, когда они оказываются достаточно близко.'},
 inferno:{name:'ПЛАМЕННЫЙ ЦИКЛОН',a:'boomer',b:'flame',glyph:'⟲',color:'#ff9b62',desc:'Огненные диски летят к врагам и обратно, оставляя за собой пылающие зоны.'},
 ion:{name:'ИОННАЯ СЕТЬ',a:'pulse',b:'arc',glyph:'ϟ',color:'#d1a1ff',desc:'Лазер помечает цель; разряд перескакивает по соседям с усилением.'},
 thermal:{name:'ТЕРМОПИЛА',a:'saw',b:'plasma',glyph:'✹',color:'#ffbd67',desc:'Пила разливает раскалённую плазму и оставляет горящие зоны.'},
 starfall:{name:'ЗВЁЗДНЫЙ ДОЖДЬ',a:'rocket',b:'plasma',glyph:'✦',color:'#88c8ff',desc:'Рой ракет взрывается плазмой и замедляет противников.'},
 predator:{name:'СИСТЕМА «ХИЩНИК»',a:'pulse',b:'rocket',glyph:'➤',color:'#ff9390',desc:'Лазер помечает цель, ракеты атакуют её залпом.'},
 tesla:{name:'КАТУШКА ТЕСЛЫ',a:'arc',b:'saw',glyph:'ϟ',color:'#ddba78',desc:'Пила выпускает парализующие разряды по окружающим врагам.'}
};
const RARITIES=[{id:'common',name:'ОБЫЧНАЯ',steps:1,col:'#8baebd',chance:60},{id:'uncommon',name:'НЕОБЫЧНАЯ',steps:2,col:'#65d9a6',chance:27},{id:'rare',name:'РЕДКАЯ',steps:3,col:'#6baaff',chance:10},{id:'epic',name:'ЭПИЧЕСКАЯ',steps:4,col:'#c18dff',chance:3}];
const saveKey='relictSwarm_v01_save';
const RUN_DURATION=900;
const THREAT_MODES=[
 {name:'ПРОТОКОЛ I',hint:'Обычная сложность. Базовые волны и механики.',hp:1,speed:1,damage:1,score:1,reward:1},
 {name:'ПРОТОКОЛ II',hint:'Больше охотников и элиты, враги опаснее.',hp:1.18,speed:1.04,damage:1.13,score:1.3,reward:1.3},
 {name:'ПРОТОКОЛ III',hint:'Сложные смешанные группы, усиленные боссы.',hp:1.39,speed:1.08,damage:1.26,score:1.6,reward:1.6},
 {name:'ПРОТОКОЛ IV',hint:'Плотные тактические волны, опасные прорывы.',hp:1.64,speed:1.12,damage:1.42,score:2,reward:2},
 {name:'ПРОТОКОЛ V',hint:'Высшая угроза. Проверка сборки, мобильности и выживания.',hp:1.94,speed:1.17,damage:1.6,score:2.5,reward:2.5}
];
let selectedThreat=1;
const RAID_EVENTS=[
 {t:90,name:'ОХОТА: ФЛАНГОВЫЙ ЗАХВАТ',units:[['hunter',10],['scarab',6]]},
 {t:210,name:'ОСАДА: ТАРАНЫ И СТРЕЛКИ',units:[['brute',5],['sentry',8]]},
 {t:345,name:'ГНЕЗДО: МАТКИ ПОДДЕРЖКИ',units:[['hive',4],['scarab',16]]},
 {t:480,name:'ПЕРЕХВАТ: МАНЁВРЕННАЯ ГРУППА',units:[['hunter',12],['sentry',9]]},
 {t:615,name:'БРОНЕВОЙ ПРОРЫВ',units:[['brute',9],['phantom',10]]},
 {t:725,name:'ЗАСАДА: ШЕСТЬ СТОРОН',units:[['hunter',12],['phantom',12]]},
 {t:835,name:'ПОСЛЕДНИЙ РУБЕЖ РОЯ',units:[['hive',4],['brute',7],['sentry',9]]}
];
const BOSS_EVENTS=[{t:180,id:'boss1'},{t:420,id:'boss2'},{t:660,id:'boss3'},{t:900,id:'omega'}];
const SYNTH_EVENTS=[{t:365,id:'synth1'},{t:550,id:'synth2'},{t:765,id:'synth3'}];
