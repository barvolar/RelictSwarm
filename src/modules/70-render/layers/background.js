function drawBackground(camX,camY,zoom=1){rect(0,0,W,H,'#08111d');const viewW=W/zoom,viewH=H/zoom,sx=camX-viewW/2,sy=camY-viewH/2;cx.save();cx.translate(W/2-camX,H/2-camY);
 let gx=Math.floor(sx/80)*80,gy=Math.floor(sy/80)*80;cx.lineWidth=1;for(let x=gx;x<sx+viewW+80;x+=80){line(x,sy-100,x,sy+viewH+100,'#16303c',.9);if((Math.round(x/80)%4)===0)line(x,sy-100,x,sy+H+100,'#234459',1.3)}for(let y=gy;y<sy+viewH+80;y+=80){line(sx-100,y,sx+viewW+100,y,'#16303c',.9);if((Math.round(y/80)%4)===0)line(sx-100,y,sx+W+100,y,'#234459',1.3)}
 for(let x=Math.floor(sx/320)*320;x<sx+viewW+330;x+=320)for(let y=Math.floor(sy/320)*320;y<sy+viewH+330;y+=320){let v=seed(x/9,y/11);if(v<.22)continue;let px=x+seed(x,6+y)*225+20,py=y+seed(y,x)*220+30,k=seed(x+19,y+31);cx.save();cx.translate(px,py);cx.rotate(v*TAU);if(v>.75){poly([[-27,-13],[-6,-22],[25,-4],[18,9],[-17,16]],'#0e202b','#284552',1);poly([[-18,-11],[-4,-15],[12,-4],[-10,3]],'#18323b');line(-7,0,9,8,'#296273',1.4)}else{line(-17,3,3,-8,'#245061',1);line(3,-8,17,-2,'#245061',1);circ(3,-8,2.2,'#23737b')}if(k>.6){glow(28,12,25,'#21dbc7',.12);circ(28,12,2,'#207e8b')}cx.restore()}
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
