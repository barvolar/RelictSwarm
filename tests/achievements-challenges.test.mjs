import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const code=read('src/modules/10-data/world/challenges.js');
function fixture(){
 const save={achievements:{},challenges:{},skins:['relict','ghost'],shards:0,wins:0};
 const S={t:0,kills:0,threat:1,hybrids:[],challengeId:'',challengeStats:{
  damageTaken:0,hitBeforeFive:false,manualHeals:0,coresCollected:0,bossesKilled:0,bossIds:[],maxWeapons:1}};
 const ctx=vm.createContext({save,S,formatTime:t=>String(t)});
 vm.runInContext(code,ctx);
 const run=c=>vm.runInContext(c,ctx);
 return {ctx,run,save,S};
}
test('journal contains fourteen unique achievements and eight selectable contracts',()=>{
 const {run}=fixture();
 const achievements=run('ACHIEVEMENTS.map(x=>x.id)'),challenges=run('CHALLENGES.map(x=>x.id)');
 assert.equal(achievements.length,14);assert.equal(challenges.length,8);
 assert.equal(new Set(achievements).size,14);assert.equal(new Set(challenges).size,8);
 assert.ok(run('ACHIEVEMENTS.every(a=>a.reward>0)&&CHALLENGES.every(c=>c.reward>0)'));
});
test('run awards achievements and selected contract once, not on every subsequent run',()=>{
 const {ctx,save,S}=fixture();
 S.t=350;S.kills=400;S.hybrids=[{id:'spear'}];S.challengeId='swarm';
 S.challengeStats.bossIds=['synth1'];
 const first=ctx.evaluateRunRewards(S,false,false);
 assert.equal(first.challenge.id,'swarm');
 assert.equal(first.bonus,585);
 assert.equal(save.shards,585);
 assert.equal(first.achievements.length,7);
 assert.equal(save.challenges.swarm,true);
 assert.equal(save.achievements.no_hit_5,true);
 const second=ctx.evaluateRunRewards(S,false,false);
 assert.equal(second.bonus,0);assert.equal(save.shards,585);
 assert.equal(second.challenge,null);assert.equal(second.achievements.length,0);
});
test('voluntary exit cannot mint challenge shards or achievements',()=>{
 const {ctx,S,save}=fixture();
 S.t=800;S.kills=800;S.challengeId='swarm';
 const result=ctx.evaluateRunRewards(S,false,true);
 assert.equal(result.bonus,0);assert.equal(Object.keys(save.achievements).length,0);
 assert.equal(save.shards,0);
});
test('repairless victory forbids only chosen health refills, not natural XP regeneration',()=>{
 const {ctx,S,save}=fixture();
 S.challengeId='no_repairs';S.t=910;
 S.challengeStats.manualHeals=1;
 assert.equal(ctx.challengeValue('no_repairs',S,true),0);
 S.challengeStats.manualHeals=0;
 assert.equal(ctx.challengeValue('no_repairs',S,true),1);
 ctx.evaluateRunRewards(S,true,false);
 assert.equal(save.challenges.no_repairs,true);
 assert.ok(save.shards>=230);
});
test('three-slot contract tracks the largest arsenal even after fusion frees slots',()=>{
 const {ctx,S}=fixture();
 S.challengeId='minimalist';S.challengeStats.maxWeapons=3;
 assert.equal(ctx.challengeValue('minimalist',S,true),1);
 S.challengeStats.maxWeapons=4;
 assert.equal(ctx.challengeValue('minimalist',S,true),0);
 assert.equal(ctx.challengeValue('minimalist',S,false),0);
});
test('damage-free challenge concerns first five minutes only',()=>{
 const {ctx,S}=fixture();S.t=310;
 assert.equal(ctx.challengeValue('no_hit',S,false),1);
 S.challengeStats.hitBeforeFive=true;
 assert.equal(ctx.challengeValue('no_hit',S,false),0);
});
test('two cosmetic rewards unlock at eight achievements and four contracts',()=>{
 const {ctx,save,S}=fixture();
 for(const id of ['first_blood','swarm_100','swarm_350','survive_5','survive_10','first_fusion','two_fusions','synth_guardian']){
  save.achievements[id]=true;
 }
 for(const id of ['swarm','core_hunter','master_fuser','boss_hunt'])save.challenges[id]=true;
 const r=ctx.evaluateRunRewards(S,false,false);
 assert.ok(save.skins.includes('nova'));assert.ok(save.skins.includes('sentinel'));
 assert.deepEqual(Array.from(r.skins),['НОВА','СТРАЖ']);
 const again=ctx.evaluateRunRewards(S,false,false);
 assert.equal(again.skins.length,0);
});
test('all required event hooks and UI entrypoints are connected',()=>{
 for(const [path,fragments] of [
  ['src/modules/40-game/entities/player-progression.js',['S.challengeStats.damageTaken','hitBeforeFive=true']],
  ['src/modules/40-game/entities/fx-pickups.js',['coresCollected++','manualHeals++']],
  ['src/modules/40-game/entities/deaths.js',['bossesKilled++','bossIds.push(e.id)']],
  ['src/modules/40-game/lifecycle/finish.js',['evaluateRunRewards(S,won,giveup)','rewards.bonus']],
  ['src/modules/40-game/lifecycle/start.js',['challengeId:selectedChallengeId','challengeRunDefaults()']],
  ['src/modules/50-ui/pages/main-menu.js',['mainAchievements','showAchievementJournal']],
  ['src/modules/50-ui/pages/play-progression.js',['challengeChoiceHtml()','challengeMode']],
  ['src/modules/50-ui/pages/skins.js',['s.achievementOnly']],
 ]){
 const s=read(path);for(const frag of fragments)assert.ok(s.includes(frag),path+' missing '+frag);
 }
});
test('more enemies and +14% normal HP do not accidentally buff bosses or remove population cap',()=>{
 const spawn=read('src/modules/40-game/entities/spawn.js');
 const sim=read('src/modules/40-game/update/simulation.js');
 assert.ok(spawn.includes('factor*1.14'));
 assert.ok(spawn.includes('if(S.enemy.length>170'));
 assert.ok(sim.includes('diff*.86'));
 assert.ok(read('src/modules/40-game/lifecycle/start.js').includes("for(let i=0;i<12;i++)spawnEnemy('scarab'"));
});
