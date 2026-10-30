function balExport(){
 const report=(mode==='menu'||(!S&&balLast))?balLast:balReport();if(!report)return;
 const json=JSON.stringify(report,null,2);
 try{const file=new Blob([json],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download='RelictSwarm_Balance_'+Date.now()+'.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),4000)}catch(err){console.warn('Balance download:',err)}
 const area=$('balReportText');if(area){area.value=json;area.hidden=false;}
}
document.addEventListener('click',e=>{if(e.target?.id==='balExport')balExport()});

