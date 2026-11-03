import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('src/modules/30-audio/embedded-bank.js');
const playback=read('src/modules/30-audio/engine/playback.js');
function fakeContext(){
 return {
  sampleRate:4800,
  createBuffer(channels,length,rate){
   assert.ok(length>0&&length<4800*12);
   assert.equal(rate,4800);
   const data=Array.from({length:channels},()=>new Float32Array(length));
   return {numberOfChannels:channels,length,sampleRate:rate,getChannelData(c){return data[c]}};
  }
 };
}
test('commercial builds contain no embedded third-party sample bank',()=>{
 assert.ok(!/data:audio\//i.test(source+playback));
 assert.ok(!/base64,/i.test(source+playback));
 assert.ok(!/decodeAudioData\s*\(/.test(playback));
 assert.ok(!/new Audio\s*\(/.test(playback));
 assert.ok(source.includes('buildRelictProceduralSfxBank'));
 assert.ok(source.includes('buildRelictProceduralMusicBank'));
 const build=read('dist/index.html');
 assert.ok(!/base64,[A-Za-z0-9+/]{1000}/.test(build),'large embedded samples remain in release');
 assert.ok(Buffer.byteLength(build)<1024*1024,'unexpectedly large generated HTML');
});
test('synthesis implements all weapon, impact, UI and continuous-loop audio IDs',()=>{
 const c=vm.createContext({Math,Float32Array,Object});
 vm.runInContext(source,c,{timeout:5000});
 const sfx=vm.runInContext('buildRelictProceduralSfxBank',c)(fakeContext());
 const required=['laser','laserHit','arc','rail','railCharge','rocket','plasma','cryo','flame','flame_start','flame_stop','flame_loop','gravity','gravityCollapse','mine','boomer','boomerReturn','saw','sawHit','explosion','heavyExplosion','heavyExplosionDeep','hit','kill','damage','fusion','bossDown','warning','ui','sawLoop','rocketEngineLoop','plasmaFieldLoop','cryoLoop','gravityLoop','boomerLoop','burnLoop'];
 for(const id of required)assert.ok(sfx[id],'missing sound: '+id);
 for(const [id,buffer] of Object.entries(sfx)){
  const d=buffer.getChannelData(0);
  assert.ok(d.some(v=>Math.abs(v)>.001),'silent '+id);
  assert.ok(d.every(Number.isFinite),'invalid samples '+id);
  assert.ok(d.every(v=>Math.abs(v)<=1.00001),'clipping '+id);
 }
 const music=vm.runInContext('buildRelictProceduralMusicBank',c)(fakeContext());
 assert.deepEqual(Object.keys(music).sort(),['combat_theme','menu_theme']);
 for(const buffer of Object.values(music)){
  assert.equal(buffer.numberOfChannels,2);
  assert.ok(buffer.getChannelData(0).some(v=>Math.abs(v)>.001));
  assert.ok(buffer.getChannelData(1).every(Number.isFinite));
 }
});
test('audio routing still supports autoplay unlock, soundtrack switching and muting',()=>{
 class MockGain{
  constructor(){this.value=0}
  cancelScheduledValues(){}
  setValueAtTime(value){this.value=value}
  linearRampToValueAtTime(value){this.value=value}
 }
 class Node{
  constructor(){this.gain=new MockGain();this.threshold={value:0};this.knee={value:0};this.ratio={value:0};this.attack={value:0};this.release={value:0};this.loop=false}
  connect(){}
  start(){this.started=true}
 }
 class AudioContext{
  constructor(){Object.assign(this,fakeContext(),{state:'running',currentTime:5,destination:{}})}
  createDynamicsCompressor(){return new Node()}
  createGain(){return new Node()}
  createBufferSource(){return new Node()}
 }
 const c=vm.createContext({window:{AudioContext},document:{hidden:false},console,Promise,Math,Float32Array,Object,
  audioSettings:{on:true,music:.4},mode:'menu',refreshAudioControls(){},audioSettingsKey:'test'});
 vm.runInContext('let audio=null,masterBus=null,sfxBus=null,musicBus=null,audioBuffers={},audioLoaded=false,audioLoading=null,musicPlayers={},currentMusic="",musicPreviewMode=null;\n'+source+'\n'+playback,c,{timeout:5000});
 assert.equal(vm.runInContext('unlockAudio()',c),true);
 assert.equal(vm.runInContext('audioLoaded',c),true);
 assert.equal(vm.runInContext('Object.keys(musicPlayers).length',c),2);
 assert.equal(vm.runInContext('currentMusic',c),'menu_theme');
 vm.runInContext("mode='playing';syncMusic()",c);
 assert.equal(vm.runInContext('currentMusic',c),'combat_theme');
 vm.runInContext("audioSettings.on=false;syncMusic()",c);
 assert.equal(vm.runInContext('currentMusic',c),'');
});
