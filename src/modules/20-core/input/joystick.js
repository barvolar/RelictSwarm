const joyEl=$('joystick'),joyKnob=$('joyKnob'),arenaEl=$('world');
let joyOriginX=0,joyOriginY=0;
function resetFloatingJoy(){
  joy.pid=null;joy.x=0;joy.y=0;
  joyKnob.style.transform='translate(0,0)';
  joyEl.classList.remove('is-active');
}
function syncJoy(e){
  const radius=Math.max(25,joyEl.offsetWidth*.35);
  const x=(e.clientX-joyOriginX)/radius,y=(e.clientY-joyOriginY)/radius;
  const m=Math.max(1,hypot(x,y));
  joy.x=x/m;joy.y=y/m;
  const travel=joyEl.offsetWidth*.29;
  joyKnob.style.transform=`translate(${joy.x*travel}px,${joy.y*travel}px)`;
}
arenaEl.addEventListener('pointerdown',e=>{
  if(!touching||mode!=='playing'||joy.pid!==null||e.pointerType==='mouse')return;
  // The HUD, dialogs and right-side dash keep their normal touch behavior.
  const hudBottom=$('hud').querySelector('.hud-dock')?.getBoundingClientRect().bottom||0;
  if(e.clientY<hudBottom+6||e.clientX>W*.60)return;
  e.preventDefault();
  joy.pid=e.pointerId;
  joyOriginX=e.clientX;joyOriginY=e.clientY;
  const diameter=joyEl.offsetWidth;
  const cx=Math.min(W-diameter/2-4,Math.max(diameter/2+4,e.clientX));
  const cy=Math.min(H-diameter/2-4,Math.max(diameter/2+4,e.clientY));
  joyEl.style.left=`${cx-diameter/2}px`;
  joyEl.style.top=`${cy-diameter/2}px`;
  joyEl.classList.add('is-active');
  joy.x=joy.y=0;
  joyKnob.style.transform='translate(0,0)';
  arenaEl.setPointerCapture(e.pointerId);
});
arenaEl.addEventListener('pointermove',e=>{if(e.pointerId===joy.pid)syncJoy(e)});
