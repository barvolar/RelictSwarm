const BAL_STORE='relictSwarm_last_balance_report_v1';
let bal=null,balLast=null;
if(typeof window==='undefined'||window.RelicPlatform?.provider!=='playgama')try{balLast=JSON.parse(localStorage.getItem(BAL_STORE)||'null')}catch{}
const balR=v=>Math.round((Number(v)||0)*10)/10;
