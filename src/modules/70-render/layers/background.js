function drawBackground(camX,camY,zoom=1){rect(0,0,W,H,'#08111d');const viewW=W/zoom,viewH=H/zoom,sx=camX-viewW/2,sy=camY-viewH/2;cx.save();cx.translate(W/2-camX,H/2-camY);
 // Minimal tactical deck: smooth navy graphite, sparse fixed-world targeting marks.
 // Render the visible floor in world coordinates so camera motion never shifts the pattern.
 cx.fillStyle='#0a1723';
 cx.fillRect(sx-3,sy-3,viewW+6,viewH+6);
 const sectorSize=680;
 const firstX=Math.floor((sx-220)/sectorSize),lastX=Math.ceil((sx+viewW+220)/sectorSize);
 const firstY=Math.floor((sy-220)/sectorSize),lastY=Math.ceil((sy+viewH+220)/sectorSize);
 for(let ix=firstX;ix<=lastX;ix++)for(let iy=firstY;iy<=lastY;iy++){
  const marker=seed(ix+31,iy-19);
  if(marker<.30)continue;
  const mx=ix*sectorSize+340+(seed(ix+7,iy+13)-.5)*110;
  const my=iy*sectorSize+340+(seed(ix-17,iy+23)-.5)*110;
  const radius=132+seed(ix+51,iy-11)*38;
  cx.save();
  cx.globalAlpha=.72;
  cx.lineWidth=1.25;
  cx.strokeStyle='#1e4451';
  cx.beginPath();cx.arc(mx,my,radius,0,TAU);cx.stroke();
  // Two interrupted telemetry arcs, not a grid or a distracting neon halo.
  cx.strokeStyle='#2a6670';
  cx.lineWidth=1.8;
  cx.beginPath();cx.arc(mx,my,radius+7,.16,1.18);cx.stroke();
  cx.beginPath();cx.arc(mx,my,radius+7,3.30,3.94);cx.stroke();
  cx.strokeStyle='#234a55';
  cx.lineWidth=1;
  cx.beginPath();cx.arc(mx,my,radius*.56,0,TAU);cx.stroke();
  cx.strokeStyle='#356b73';
  cx.beginPath();cx.moveTo(mx-11,my);cx.lineTo(mx-4,my);
  cx.moveTo(mx+4,my);cx.lineTo(mx+11,my);
  cx.moveTo(mx,my-11);cx.lineTo(mx,my-4);
  cx.moveTo(mx,my+4);cx.lineTo(mx,my+11);cx.stroke();
  cx.restore();
 }
 // Low-contrast locator dashes provide direction without covering shots or enemies.
 const guideSize=370;
 for(let ix=Math.floor(sx/guideSize);ix<=Math.ceil((sx+viewW)/guideSize);ix++){
  for(let iy=Math.floor(sy/guideSize);iy<=Math.ceil((sy+viewH)/guideSize);iy++){
   if(seed(ix+109,iy-57)<.78)continue;
   const mx=ix*guideSize+guideSize*.5,my=iy*guideSize+guideSize*.5;
   cx.strokeStyle='#1c3e4a';cx.lineWidth=1;
   cx.beginPath();cx.moveTo(mx-12,my);cx.lineTo(mx-5,my);
   cx.moveTo(mx+5,my);cx.lineTo(mx+12,my);cx.stroke();
  }
 }
 // Arena perimeter: contrast stripes, unmistakable boundary, and a muted outer danger zone.
  const edge=1785;
  if(sx< -edge+100 || sy< -edge+100 || sx+viewW>edge-100 || sy+viewH>edge-100){
  cx.save();
  cx.fillStyle='#03101adc';
  cx.fillRect(-edge-220,-edge-220,220,2*(edge+220));
  cx.fillRect(edge,-edge-220,220,2*(edge+220));
  cx.fillRect(-edge,-edge-220,2*edge,220);
  cx.fillRect(-edge,edge,2*edge,220);
  cx.strokeStyle='#1c8f9e';cx.lineWidth=14;cx.strokeRect(-edge,-edge,edge*2,edge*2);
  cx.strokeStyle='#8ef9ec';cx.lineWidth=3;cx.strokeRect(-edge+3,-edge+3,edge*2-6,edge*2-6);
  cx.strokeStyle='#ffcc78';cx.lineWidth=2;cx.setLineDash([18,20]);cx.strokeRect(-edge+25,-edge+25,edge*2-50,edge*2-50);cx.setLineDash([]);
  cx.fillStyle='#ffe2a0';cx.font='bold 15px Trebuchet MS';cx.textAlign='center';
  for(let k=-1600;k<=1600;k+=400){
   cx.fillText('⚠ ГРАНИЦА СЕКТОРА',k,-edge+56);
   cx.fillText('⚠ ГРАНИЦА СЕКТОРА',k,edge-42);
   cx.save();cx.translate(-edge+53,k);cx.rotate(-Math.PI/2);cx.fillText('⚠ ГРАНИЦА СЕКТОРА',0,0);cx.restore();
   cx.save();cx.translate(edge-53,k);cx.rotate(Math.PI/2);cx.fillText('⚠ ГРАНИЦА СЕКТОРА',0,0);cx.restore();
  }
  cx.restore();
  }if(trainingMode){cx.save();for(const r of [150,300,450]){ring(0,0,r,'#355f66',1.5)}for(let q=-4;q<=4;q++){line(q*80,-420,q*80,420,'#244f5633',1);line(-420,q*80,420,q*80,'#244f5633',1)}cx.font='bold 14px Trebuchet MS';cx.fillStyle='#74cfc4aa';cx.textAlign='center';cx.fillText('ИСПЫТАТЕЛЬНЫЙ СЕКТОР // 08',0,-315);cx.restore()}cx.restore()}
