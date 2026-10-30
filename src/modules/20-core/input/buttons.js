function joyStop(e){if(e.pointerId===joy.pid)resetFloatingJoy()}
arenaEl.addEventListener('pointerup',joyStop);
arenaEl.addEventListener('pointercancel',joyStop);
arenaEl.addEventListener('lostpointercapture',joyStop);
$('dashBtn').addEventListener('pointerdown',e=>{e.preventDefault();if(mode==='playing')dash()});$('pauseBtn').addEventListener('click',pause);$('audioHudBtn').addEventListener('click',soundToggle);$('forgeBtn').addEventListener('click',()=>{if(mode==='playing'){if(trainingMode)renderTrainingPanel(true);else openForge()}});
