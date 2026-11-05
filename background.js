"use strict";
// A decorative, conceptual HHG three-step cycle: laser pulse -> ionization ->
// electron excursion -> recombination and an attosecond-like emission burst.
// The animation does not represent a numerical SFA/TDSE calculation.
(() => {
  const canvas = document.querySelector("#background-hhg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", {alpha:true});
  if (!ctx) return;

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const TAU = 2 * Math.PI;
  const cycleSeconds = 7.5;
  let width = 0, height = 0, dpr = 1, frame = null;
  let animationStart = null, elapsed = 0;
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const smooth = v => { const x = clamp(v); return x*x*(3-2*x); };
  const gauss = (x, mean, sigma) => Math.exp(-0.5*((x-mean)/sigma)**2);

  function line(points, color, thickness = 1.5, dash = []) {
    ctx.save(); ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=thickness;
    ctx.lineJoin="round";ctx.lineCap="round";ctx.setLineDash(dash);
    points.forEach((p, i) => i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1]));
    ctx.stroke();ctx.restore();
  }
  function circle(x,y,r,fill) {
    ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle=fill;ctx.fill();
  }
  function glow(x,y,r, color) {
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,color);g.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);
  }
  function render(seconds) {
    if (!width || !height) return;
    ctx.clearRect(0,0,width,height);
    const mobile=width<720;
    const cx=width*(mobile?.72:.78), cy=height*(mobile?.54:.53);
    const S=Math.min(mobile?width*.48:width*.29,height*.34,290);
    const origin=[cx-S*.40,cy+S*.32];
    const phase=((seconds/cycleSeconds)%1+1)%1;

    // A quiet carrier-envelope pulse traveling toward the molecular center.
    const progress=phase;
    const center=-1.05+2.25*progress;
    const pulse=[];
    for(let i=0;i<=160;i++){
      const u=i/160;
      const x=cx-S*1.40+u*S*2.55;
      const coordinate=-1.4+2.55*u;
      const env=gauss(coordinate,center,.48);
      pulse.push([x,cy-S*.45+S*.22*env*Math.sin(18*coordinate-1.4*seconds)]);
    }
    line(pulse,"rgba(37,101,221,.28)",2);
    const haloX=cx+center*S;
    glow(haloX,cy-S*.45,S*.34,"rgba(74,147,255,.045)");

    // Two centers and a softly illuminated electron density cloud.
    glow(origin[0],origin[1],S*.33,"rgba(59,130,246,.055)");
    line([[origin[0]-S*.095,origin[1]],[origin[0]+S*.095,origin[1]]],
      "rgba(38,100,195,.15)",2);
    circle(origin[0]-S*.095,origin[1],S*.033,"rgba(43,107,233,.22)");
    circle(origin[0]+S*.095,origin[1],S*.033,"rgba(43,107,233,.22)");

    // Three-step cycle: ionization ~0.16, excursion 0.22-0.79, recollision ~0.81.
    const launch=.16, returnTime=.81;
    const excursion=t=>{
      const s=clamp((t-launch)/(returnTime-launch));
      const x=origin[0]+S*1.24*Math.sin(Math.PI*s);
      const y=origin[1]-S*.91*Math.pow(Math.sin(Math.PI*s),1.7)
        -S*.12*Math.sin(2*Math.PI*s);
      return [x,y];
    };
    const trail=[];
    for(let i=0;i<=100;i++) trail.push(excursion(launch+(returnTime-launch)*i/100));
    line(trail,"rgba(34,101,213,.15)",1.55,[4,6]);

    if(phase>launch-.055 && phase<launch+.13){
      const ion=smooth((phase-(launch-.055))/.105)*(1-smooth((phase-(launch+.07))/.06));
      glow(origin[0],origin[1],S*.24,"rgba(83,158,249,"+(.13*ion)+")");
      const radius=S*(.055+.20*ion);
      ctx.beginPath();ctx.arc(origin[0],origin[1],radius,0,TAU);
      ctx.strokeStyle="rgba(82,155,247,"+(.21*ion)+")";
      ctx.lineWidth=2;ctx.stroke();
    }
    if(phase>=launch && phase<returnTime){
      const pos=excursion(phase);
      // Luminous tail grows and disappears as the electron returns.
      const end=(phase-launch)/(returnTime-launch);
      const tail=[];
      for(let j=0;j<=26;j++){
        const s=Math.max(0,end-.16)+(.16*j/26);
        if(s<=end)tail.push(excursion(launch+s*(returnTime-launch)));
      }
      if(tail.length>1)line(tail,"rgba(66,136,244,.23)",2.5);
      glow(pos[0],pos[1],S*.115,"rgba(66,140,248,.18)");
      circle(pos[0],pos[1],S*.019,"rgba(34,97,211,.55)");
      circle(pos[0]-S*.006,pos[1]-S*.006,S*.006,"rgba(255,255,255,.9)");
    }

    // Recombination releases a short fan of high-frequency emission.
    const burst=clamp((phase-returnTime)/.19);
    if(phase>=returnTime && phase<=.985){
      const bright=(1-smooth(burst))*.8;
      glow(origin[0],origin[1],S*.42,"rgba(255,173,66,"+(.13*bright)+")");
      for(let k=0;k<7;k++){
        const angle=-.88+k*.20;
        const length=S*(.18+.88*smooth(burst));
        const r0=S*.05;
        const p=[];
        for(let j=0;j<=36;j++){
          const s=j/36, r=r0+length*s;
          const wobble=S*.015*Math.sin(15*s*TAU-17*seconds)*(1-s);
          p.push([origin[0]+Math.cos(angle)*r-Math.sin(angle)*wobble,
                  origin[1]+Math.sin(angle)*r+Math.cos(angle)*wobble]);
        }
        line(p,"rgba(232,152,49,"+(.26*bright)+")",1.9-k*.09);
      }
      const ringR=S*(.06+.95*burst);
      ctx.beginPath();ctx.arc(origin[0],origin[1],ringR,-1.10,.30);
      ctx.strokeStyle="rgba(244,168,69,"+(.21*bright)+")";
      ctx.lineWidth=2.3;ctx.stroke();
      for(let k=0;k<9;k++){
        const angle=-1.02+k*.16;
        const dist=S*(.18+.86*burst)*(1+.07*Math.sin(k*13));
        circle(origin[0]+Math.cos(angle)*dist,origin[1]+Math.sin(angle)*dist,
          S*(.007+.003*(k%3)),"rgba(241,170,76,"+(.35*bright)+")");
      }
    }
  }
  function resize(){
    dpr=Math.min(window.devicePixelRatio||1,2);
    width=window.innerWidth;height=window.innerHeight;
    canvas.width=Math.max(1,Math.round(width*dpr));
    canvas.height=Math.max(1,Math.round(height*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
    render(motion.matches?cycleSeconds*.55:elapsed);
  }
  function loop(now){
    if(animationStart===null)animationStart=now-elapsed*1000;
    elapsed=(now-animationStart)/1000;
    render(elapsed);
    frame=requestAnimationFrame(loop);
  }
  function stop(){
    if(frame!==null)cancelAnimationFrame(frame);
    frame=null;animationStart=null;
  }
  function start(){
    if(frame===null&&!motion.matches&&!document.hidden)frame=requestAnimationFrame(loop);
  }
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden)stop();else start();
  });
  window.addEventListener("resize",resize,{passive:true});
  if(motion.addEventListener)motion.addEventListener("change",()=>{
    if(motion.matches){stop();render(cycleSeconds*.55);}else start();
  });
  resize();start();
})();