const audioSettingsKey='relictSwarm_audio_v1';
function loadAudioSettings(){try{const o=JSON.parse(localStorage.getItem(audioSettingsKey)||'null');if(o&&typeof o==='object')return {on:o.on!==false,sfx:Number.isFinite(+o.sfx)?clamp(+o.sfx,0,1):.65,music:Number.isFinite(+o.music)?clamp(+o.music,0,1):.38}}catch{}return {on:true,sfx:.65,music:.38}}
const audioSettings=loadAudioSettings();
let sfxBus=null,musicBus=null,masterBus=null,audioBuffers={},audioLoaded=false,audioLoading=null,activeVoices=0,musicPlayers={},currentMusic='',lastWeaponAt=-999;
let soundPlayed=Object.create(null),musicPreviewMode=null;
let flameStream=null, flameLastShot=-9999, flamePreviewUntil=0;
mute=!audioSettings.on;
