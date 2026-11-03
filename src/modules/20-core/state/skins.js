// Approved 32-skin catalog; the core collision silhouette never changes.
const SKIN_CATALOG=[
 {
  "id": "relict",
  "name": "РЕЛИКТ",
  "rarity": "common",
  "core": "#50f2db",
  "metal": "#4b6c78",
  "detail": "Исходная оболочка",
  "cost": 0,
  "index": 1
 },
 {
  "id": "patrol",
  "name": "ПАТРУЛЬ",
  "rarity": "common",
  "core": "#8cdbff",
  "metal": "#5c8fa2",
  "detail": "Служебная голубая окраска",
  "cost": 80,
  "index": 2
 },
 {
  "id": "border",
  "name": "ПОГРАНИЧНИК",
  "rarity": "common",
  "core": "#e7c27d",
  "metal": "#4f6b62",
  "detail": "Сигнальные жёлтые панели",
  "cost": 80,
  "index": 3
 },
 {
  "id": "watch",
  "name": "ДОЗОР",
  "rarity": "common",
  "core": "#8effc6",
  "metal": "#36605a",
  "detail": "Тёмно-зелёная охранная окраска",
  "cost": 95,
  "index": 4
 },
 {
  "id": "arctic",
  "name": "АРКТИК",
  "rarity": "common",
  "core": "#d8f7ff",
  "metal": "#698293",
  "detail": "Серебристо-синяя броня",
  "cost": 95,
  "index": 5
 },
 {
  "id": "reserve",
  "name": "РЕЗЕРВ",
  "rarity": "common",
  "core": "#ffb98f",
  "metal": "#73524d",
  "detail": "Оранжевые заводские отметки",
  "cost": 95,
  "index": 6
 },
 {
  "id": "graphite",
  "name": "ГРАФИТ",
  "rarity": "common",
  "core": "#a4b8c7",
  "metal": "#404f63",
  "detail": "Матовый графитовый сплав",
  "cost": 110,
  "index": 7
 },
 {
  "id": "sand",
  "name": "ПЕСОЧНЫЙ КОРПУС",
  "rarity": "common",
  "core": "#ffd69a",
  "metal": "#88735b",
  "detail": "Пустынная окраска",
  "cost": 110,
  "index": 8
 },
 {
  "id": "black_sand",
  "name": "ЧЁРНЫЙ ПЕСОК",
  "rarity": "uncommon",
  "core": "#ffac68",
  "metal": "#4a4154",
  "detail": "Песочные боковые крылья",
  "cost": 180,
  "index": 9
 },
 {
  "id": "ember",
  "name": "ПЕПЕЛЬНЫЙ ОХОТНИК",
  "rarity": "uncommon",
  "core": "#ff773d",
  "metal": "#bd583e",
  "detail": "Огненные крылья и наконечники",
  "cost": 100,
  "index": 10
 },
 {
  "id": "voltage",
  "name": "ВОЛЬТАЖ",
  "rarity": "uncommon",
  "core": "#83bfff",
  "metal": "#345990",
  "detail": "Электрические лопасти",
  "cost": 220,
  "index": 11
 },
 {
  "id": "acidstorm",
  "name": "КИСЛОТНЫЙ ШТОРМ",
  "rarity": "uncommon",
  "core": "#91ff67",
  "metal": "#347b52",
  "detail": "Химические дефлекторы",
  "cost": 230,
  "index": 12
 },
 {
  "id": "critical",
  "name": "КРИТИЧЕСКИЙ",
  "rarity": "uncommon",
  "core": "#ff6074",
  "metal": "#873b50",
  "detail": "Аварийные красные крылья",
  "cost": 230,
  "index": 13
 },
 {
  "id": "steelzero",
  "name": "СТАЛЬНОЙ НОЛЬ",
  "rarity": "uncommon",
  "core": "#e8f4ff",
  "metal": "#597085",
  "detail": "Стальные стабилизаторы",
  "cost": 240,
  "index": 14
 },
 {
  "id": "fog",
  "name": "ТУМАН",
  "rarity": "uncommon",
  "core": "#a7dbff",
  "metal": "#506f90",
  "detail": "Серые лёгкие крылья",
  "cost": 240,
  "index": 15
 },
 {
  "id": "kestrel",
  "name": "ПУСТЫННЫЙ КОРШУН",
  "rarity": "uncommon",
  "core": "#ffce76",
  "metal": "#96704d",
  "detail": "Стреловидные крылья",
  "cost": 250,
  "index": 16
 },
 {
  "id": "spectrum",
  "name": "СПЕКТР",
  "rarity": "rare",
  "core": "#e69aff",
  "metal": "#66548d",
  "detail": "Фазовые крылья и свечение",
  "cost": 520,
  "index": 17
 },
 {
  "id": "phantom",
  "name": "ФАНТОМ",
  "rarity": "rare",
  "core": "#b7b0ff",
  "metal": "#505a8c",
  "detail": "Многослойные призрачные крылья",
  "cost": 540,
  "index": 18
 },
 {
  "id": "iceghost",
  "name": "ЛЕДЯНОЙ ПРИЗРАК",
  "rarity": "rare",
  "core": "#a4f4ff",
  "metal": "#5b88a6",
  "detail": "Кристаллические крылья",
  "cost": 560,
  "index": 19
 },
 {
  "id": "ghost",
  "name": "КОБАЛЬТОВЫЙ ПРИЗРАК",
  "rarity": "rare",
  "core": "#5caaff",
  "metal": "#264775",
  "detail": "Синие эмиттеры и разветвлённые крылья",
  "cost": 0,
  "index": 20
 },
 {
  "id": "void",
  "name": "ТЁМНЫЙ ПРОТОКОЛ",
  "rarity": "rare",
  "core": "#bd7aff",
  "metal": "#3f345b",
  "detail": "Теневые крылья",
  "cost": 250,
  "index": 21
 },
 {
  "id": "stahunter",
  "name": "ЗВЁЗДНЫЙ ОХОТНИК",
  "rarity": "rare",
  "core": "#f9e2a6",
  "metal": "#766e91",
  "detail": "Золотые крылья",
  "cost": 590,
  "index": 22
 },
 {
  "id": "helios",
  "name": "ГЕЛИОС",
  "rarity": "rare",
  "core": "#ffba64",
  "metal": "#99604e",
  "detail": "Солнечные крылья",
  "cost": 620,
  "index": 23
 },
 {
  "id": "quantum",
  "name": "КВАНТОВЫЙ СТРАЖ",
  "rarity": "rare",
  "core": "#78f8ed",
  "metal": "#447c83",
  "detail": "Энергетические сегменты",
  "cost": 640,
  "index": 24
 },
 {
  "id": "pulsar",
  "name": "ПУЛЬСАР",
  "rarity": "epic",
  "core": "#ffe8a5",
  "metal": "#7368a2",
  "detail": "Вращающийся энергетический диск",
  "cost": 1150,
  "index": 25
 },
 {
  "id": "nova",
  "name": "НОВА",
  "rarity": "epic",
  "core": "#b6fff1",
  "metal": "#285d70",
  "detail": "Световые орбиты и излучатели",
  "cost": 1250,
  "index": 26
 },
 {
  "id": "sentinel",
  "name": "СТРАЖ РОЯ",
  "rarity": "epic",
  "core": "#ffca6c",
  "metal": "#554351",
  "detail": "Вращающиеся бронещиты",
  "cost": 1350,
  "index": 27
 },
 {
  "id": "astral",
  "name": "АСТРАЛЬНАЯ МАШИНА",
  "rarity": "epic",
  "core": "#f1c3ff",
  "metal": "#6f4e99",
  "detail": "Руническая карусель",
  "cost": 1450,
  "index": 28
 },
 {
  "id": "singularity",
  "name": "СИНГУЛЯРНОСТЬ",
  "rarity": "legendary",
  "core": "#65f5ff",
  "metal": "#316b81",
  "detail": "Гравитационные орбиты и парящие крылья",
  "cost": 2600,
  "index": 29
 },
 {
  "id": "chronos",
  "name": "ХРОНОС",
  "rarity": "legendary",
  "core": "#80e9ff",
  "metal": "#374a78",
  "detail": "Часовой венец и временные орбиты",
  "cost": 2850,
  "index": 30
 },
 {
  "id": "omega_skin",
  "name": "ОМЕГА",
  "rarity": "legendary",
  "core": "#ff5874",
  "metal": "#74394f",
  "detail": "Коронные лезвия",
  "cost": 3150,
  "index": 31
 },
 {
  "id": "archonzero",
  "name": "АРХОНТ НУЛЯ",
  "rarity": "legendary",
  "core": "#fff0ae",
  "metal": "#8072b5",
  "detail": "Тройные венцы и парящие крылья",
  "cost": 3600,
  "index": 32
 }
];
function skinMix(a,b,t){
 const rgb=h=>[1,3,5].map(p=>parseInt(h.slice(p,p+2),16));
 const x=rgb(a),y=rgb(b);
 return '#'+x.map((n,i)=>Math.round(n*(1-t)+y[i]*t).toString(16).padStart(2,'0')).join('');
}
// Preserve the six original production palettes from Skin Lab; only rarity adds attachments.
const SKIN_ORIGINAL_PALETTES={
 "ghost": {
  "body": "#10274c",
  "plate": "#79aaf0",
  "edge": "#a1d9ff",
  "shell": "#1e3d63",
  "back": "#264775",
  "trim": "#bddaff",
  "core": "#5caaff",
  "coreDark": "#3364c6",
  "light": "#e8f7ff"
 },
 "ember": {
  "body": "#432524",
  "plate": "#c86d48",
  "edge": "#ffae76",
  "shell": "#512c28",
  "back": "#67392d",
  "trim": "#ffd187",
  "core": "#ff773d",
  "coreDark": "#bc4428",
  "light": "#fff0c2"
 },
 "void": {
  "body": "#1b172d",
  "plate": "#72608e",
  "edge": "#bda6ff",
  "shell": "#2a2448",
  "back": "#3f345b",
  "trim": "#e1c6ff",
  "core": "#bd7aff",
  "coreDark": "#7640ae",
  "light": "#f8eaff"
 },
 "nova": {
  "body": "#172a42",
  "plate": "#95dbec",
  "edge": "#b0ffff",
  "shell": "#285d70",
  "back": "#184966",
  "trim": "#f3e6ba",
  "core": "#b6fff1",
  "coreDark": "#54bdc2",
  "light": "#ffffff"
 },
 "chronos": {
  "body": "#20223b",
  "plate": "#67b0d1",
  "edge": "#c6fcff",
  "shell": "#253c65",
  "back": "#374a78",
  "trim": "#c6a8ff",
  "core": "#80e9ff",
  "coreDark": "#657dce",
  "light": "#f0ffff"
 },
 "sentinel": {
  "body": "#252336",
  "plate": "#a58a74",
  "edge": "#ffe1a0",
  "shell": "#453f56",
  "back": "#554351",
  "trim": "#ffdc93",
  "core": "#ffca6c",
  "coreDark": "#b7823b",
  "light": "#fff3de"
 }
};
const SKINS=Object.fromEntries(SKIN_CATALOG.map(item=>{
 const {id,name,rarity,core,metal,detail,cost,index}=item;
 const common={body:skinMix(metal,'#020918',.66),plate:skinMix(metal,'#dbf6ff',.49),
  edge:skinMix(core,'#dcfaff',.42),shell:skinMix(metal,'#091927',.36),
  back:skinMix(metal,'#0a2337',.34),trim:rarity==='legendary'?'#ffe1a0':rarity==='epic'?'#edc7ff':'#c9e0ef',
  core,coreDark:skinMix(core,'#020717',.46),light:'#ecfeff',variant:'classic'};
 if(id==='relict')Object.assign(common,{body:'#12263a',plate:'#7a9fac',edge:'#5c94a3',shell:'#21394f',back:'#2f5366',trim:'#d59a54',core:'#50f2db',coreDark:'#1b9a9e',light:'#d8ffff'});
 if(SKIN_ORIGINAL_PALETTES[id])Object.assign(common,SKIN_ORIGINAL_PALETTES[id]);
 return [id,{name,detail,cost,rarity,skinIndex:index,free:id==='relict'||id==='ghost',
 ...common}];
}));
