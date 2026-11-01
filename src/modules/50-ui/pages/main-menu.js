function skinSvg(id){
 const s=SKINS[id]||SKINS.relict;
 const fins=s.variant==='ghost'?'<path d="M28 60 5 41 10 81 31 88M92 60 115 41 110 81 89 88" fill="#285581" stroke="'+s.edge+'" stroke-width="3"/>':s.variant==='ember'?'<path d="M31 53 18 16 39 36M89 53 102 16 81 36" fill="'+s.back+'" stroke="'+s.trim+'" stroke-width="3"/>':s.variant==='void'?'<path d="M30 49 12 20 17 68 8 84 34 81M90 49 108 20 103 68 112 84 86 81" fill="'+s.back+'" stroke="'+s.edge+'" stroke-width="3"/>':'';
 return `<svg viewBox="0 0 120 150" class="skin-art" role="img" aria-label="Облик ${s.name}"><ellipse cx="60" cy="127" rx="42" ry="11" fill="${s.core}" opacity=".16"/><g stroke-linejoin="round">${fins}<path d="M32 80 21 90 23 118 39 119 45 91M88 80 99 90 97 118 81 119 75 91" fill="${s.back}" stroke="${s.edge}" stroke-width="2.5"/><path d="M26 63 16 51 17 81 32 94 42 77M94 63 104 51 103 81 88 94 78 77" fill="${s.back}" stroke="${s.plate}" stroke-width="3"/><path d="M60 13 88 26 96 66 82 104 60 116 38 104 24 66 32 26Z" fill="${s.body}" stroke="${s.edge}" stroke-width="3"/><path d="M60 20 78 30 80 46 60 39 40 46 42 30Z" fill="${s.plate}"/><path d="M31 66 48 50 60 59 72 50 89 66 77 85 60 92 43 85Z" fill="${s.shell}" stroke="${s.plate}" stroke-width="2"/><path d="M43 66 60 50 77 66 71 86 49 86Z" fill="${s.coreDark}" stroke="${s.light}" stroke-width="2.5"/><path d="M60 55 71 66 67 79 53 79 49 66Z" fill="${s.core}"/><path d="M37 78 29 88M83 78 91 88" stroke="${s.trim}" stroke-width="5"/><path d="M48 32 60 26 72 32" fill="none" stroke="${s.light}" stroke-width="3"/></g></svg>`;
}
function menu(){
 setMode('menu');
 const skin=equippedSkin();
 $('modalContent').innerHTML=`<div class="main-home"><div class="home-unit">${skinSvg(save.skin)}<div><span class="label">АКТИВНАЯ ОБОЛОЧКА</span><strong>${skin.name}</strong><small>✧ ${save.shards} кристаллов · лучший счёт ${save.best.toLocaleString('ru')}</small></div></div><div class="home-actions"><button id="mainPlay" class="btn primary home-btn">▶ ИГРАТЬ</button><button id="mainUpgrade" class="btn home-btn">⬡ ПРОКАЧКА</button><button id="mainSettings" class="btn home-btn">⚙ НАСТРОЙКИ</button></div></div>`;
 $('mainPlay').onclick=showPlayMenu;
 $('mainUpgrade').onclick=()=>showProgression('upgrades');
 $('mainSettings').onclick=showSettings;
}
