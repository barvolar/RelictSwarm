// This script runs in <head> after the synchronous Playgama CDN script.
// The full game bundle is executed only after both initialization and save hydration.
window.RELICT_PLATFORM='playgama';
window.RelicPlaygamaData=Object.create(null);
window.RelicPlaygamaBoot=(async()=>{
 if(!window.bridge||typeof bridge.initialize!=='function')throw Error('Playgama Bridge SDK was not loaded');
 await bridge.initialize();
 const keys=['relictSwarm_v01_save','relictSwarm_audio_v1','relictswarm_render_quality','relictswarm_orientation_v1','relictswarm_ui_locale_v1','relictswarm_mobile_scale_v1'];
 // Keep JSON save payloads as strings. By default the SDK auto-parses
 // them into objects; the legacy game loader expects serialized JSON.
 const data=await bridge.storage.get(keys,false);
 if(!Array.isArray(data))throw Error('Bridge Storage returned an invalid save response');
 keys.forEach((key,index)=>{window.RelicPlaygamaData[key]=data[index]??null;});
})();
// .catch is attached at the game-loader boundary so failed cloud loads cannot
// accidentally overwrite existing progress with a fresh local save.
