function perfDownload(){
 const report=JSON.stringify(perfReport(),null,2);
 try{const blob=new Blob([report],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='RelictSwarm_FPS_Report_'+Date.now()+'.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}catch(err){console.warn('FPS report download:',err)}
 const ta=$('perfReportText');if(ta){ta.value=report;ta.hidden=false;}
}
