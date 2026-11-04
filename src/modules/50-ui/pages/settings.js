function showSettings(){
 setMode('menu');
 $('modalContent').innerHTML=`<div class="section-top"><div><div class="label">[ СИСТЕМА ]</div><div class="panel-title">Настройки</div></div><button id="backHome" class="btn ghost small-back">◂ НАЗАД</button></div><div class="settings-action"><button id="soundBtn" class="btn">${mute?'♪ ВКЛЮЧИТЬ ЗВУК':'♫ ВЫКЛЮЧИТЬ ЗВУК'}</button><button id="howBtn" class="btn ghost">? КАК ИГРАТЬ</button></div><div class="settings-action"><button id="fullscreenSettings" type="button" class="btn ghost">${fullscreenButtonText()}</button></div>${orientationPickerHTML()}${audioMixerHTML()}${renderQualityControls()}${window.SwarmTelemetry?.settingsHTML?.()||''}`;
 $('backHome').onclick=menu;$('soundBtn').onclick=soundToggle;
 $('howBtn').onclick=showHow;$('fullscreenSettings').onclick=toggleFullscreen;bindOrientationPicker();bindAudioMixer();
}
