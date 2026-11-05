"use strict";
(() => {
  const canvas = document.querySelector("#background-hhg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let w = 0, h = 0, ratio = 1, raf = null, tickStart = 0;
  const twoPi = Math.PI * 2;
  const resize = () => {
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    render(reducedMotion.matches ? 0.3 : performance.now() / 1000);
  };
  const render = time => {
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    // Conceptual three-step HHG artwork, not calculated SFA trajectories.
    const wide = w >= 720;
    const cx = wide ? w * .78 : w * .75;
    const cy = h * .49;
    const scale = Math.min(wide ? w * .30 : w * .48, h * .38, 310);
    const pulse = t => Math.sin(11 * Math.PI * t - time * 1.25) * Math.pow(Math.sin(Math.PI * t),2);
    ctx.strokeStyle = "rgba(43,107,233,.10)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= 240; i++) {
      const t = i / 240, x = cx - scale + t * 2 * scale;
      const y = cy - scale * .23 + pulse(t) * scale * .22;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
    // Recollision arc anchored at the molecular center.
    const originX = cx - scale * .13, originY = cy + scale * .34;
    const phase = reducedMotion.matches ? .56 : (time * .11) % 1;
    ctx.strokeStyle = "rgba(43,107,233,.13)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4,7]);
    ctx.beginPath();
    for(let i = 0; i <= 100; i++){
      const s=i/100, x=originX+scale*.92*Math.sin(Math.PI*s);
      const y=originY-scale*.62*Math.sin(Math.PI*s)*Math.sin(Math.PI*s);
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    const px = originX + scale * .92 * Math.sin(Math.PI * phase);
    const py = originY - scale * .62 * Math.pow(Math.sin(Math.PI * phase), 2);
    ctx.beginPath();ctx.arc(originX,originY,6,0,twoPi);ctx.fillStyle="rgba(43,107,233,.17)";ctx.fill();
    ctx.beginPath();ctx.arc(px,py,4.5,0,twoPi);ctx.fillStyle="rgba(43,107,233,.30)";ctx.fill();
    // Brief stylized emission near recollision, kept intentionally low contrast.
    const flare = Math.max(0, 1 - Math.abs(phase - .94) * 16);
    if(flare > 0){
      ctx.strokeStyle = "rgba(232,153,53," + (.21*flare) + ")";
      for(let j=0;j<5;j++){
        const ang=-.7+j*.35;
        ctx.beginPath();ctx.moveTo(originX,originY);
        ctx.lineTo(originX+Math.cos(ang)*scale*.27,originY+Math.sin(ang)*scale*.27);
        ctx.stroke();
      }
    }
    // Faint molecular two-center motif.
    ctx.strokeStyle="rgba(43,107,233,.09)";
    ctx.beginPath();ctx.arc(originX-14,originY,11,0,twoPi);ctx.arc(originX+14,originY,11,0,twoPi);ctx.stroke();
  };
  const animate = time => {
    render(time / 1000);
    raf = requestAnimationFrame(animate);
  };
  const start = () => {
    if (raf !== null || reducedMotion.matches || document.hidden) return;
    raf = requestAnimationFrame(animate);
  };
  const stop = () => {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
  };
  document.addEventListener("visibilitychange", () => {
    if(document.hidden) stop(); else start();
  });
  window.addEventListener("resize", resize, {passive:true});
  if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches){stop();render(.3);} else start();
  });
  resize();start();
})();