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
