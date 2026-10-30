// Internal performance aggregates; never shown inside the game.
function perfSummary(){
 const samples=perf.samples||[];
 if(!samples.length)return null;
 const fps=samples.map(s=>s.fps).filter(Number.isFinite),p95=samples.map(s=>s.frameP95ms).filter(Number.isFinite);
 return {samples:samples.length,avgFps:+perfAvg(fps).toFixed(1),minFps:fps.length?Math.min(...fps):null,
  worstP95ms:p95.length?Math.max(...p95):null,
  slowFrames33:samples.reduce((v,s)=>v+(s.slowFrames33||0),0),
  avgUpdateMs:+perfAvg(samples.map(s=>s.cpuUpdateMs)).toFixed(2),
  avgDrawMs:+perfAvg(samples.map(s=>s.cpuDrawMs)).toFixed(2)};
}
