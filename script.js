"use strict";
(() => {
  const menu = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#main-nav");
  if (menu && nav) {
    menu.addEventListener("click", () => {
      const expanded = menu.getAttribute("aria-expanded") === "true";
      menu.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("open", !expanded);
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("open");
      menu.setAttribute("aria-expanded", "false");
    }));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        nav.classList.remove("open");
        menu.setAttribute("aria-expanded", "false");
      }
    });
  }
  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());
  const canvas = document.querySelector("#hhg-canvas");
  const toggle = document.querySelector("#motion-toggle");
  if (!canvas || !toggle) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  let running = !media.matches;
  let phase = 0;
  let lastTime = 0;
  let frame = null;
  let width = 0, height = 0, dpr = 1;
  const setButton = () => {
    toggle.textContent = running ? "Pause motion" : "Play motion";
    toggle.setAttribute("aria-pressed", String(!running));
  };
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  };
  const draw = () => {
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2, cy = height / 2;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#dce5f0";
    for (let i = 1; i < 6; i++) {
      const y = i * height / 6;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    for (let i = 1; i < 9; i++) {
      const x = i * width / 9;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    ctx.strokeStyle = "#b8c9df";
    ctx.setLineDash([4, 5]);
    ctx.beginPath();ctx.moveTo(0, cy);ctx.lineTo(width, cy);ctx.stroke();
    ctx.setLineDash([]);
    const amp = height * .24;
    const cycles = 3.4;
    const envelope = u => Math.pow(Math.sin(Math.PI * u), 2);
    const wave = (u, shift) => Math.sin(u * cycles * 2 * Math.PI + shift) * envelope(u);
    // The waveforms below are deliberately illustrative, not a solution of the Lewenstein model.
    const path = (color, alpha, lineWidth, fn) => {
      ctx.beginPath();
      for(let i = 0; i <= 320; i++) {
        const u = i / 320;
        const x = u * width, y = cy - fn(u) * amp;
        if (i === 0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.strokeStyle = color;ctx.globalAlpha = alpha;ctx.lineWidth = lineWidth;ctx.stroke();ctx.globalAlpha = 1;
    };
    path("#2b6be9", .95, 2.6, u => wave(u, phase));
    // Stylized high-frequency signal; amplitude does NOT encode HHG yield.
    path("#e8a04e", .9, 1.8, u => .42 * Math.sin(u * cycles * 2 * Math.PI * 7 + phase * 1.9) * envelope(u));
    const markerU = .68;
    const x = markerU * width, y = cy - wave(markerU,phase) * amp;
    ctx.beginPath();ctx.arc(x,y,4,0,Math.PI * 2);ctx.fillStyle = "#2b6be9";ctx.fill();
    ctx.beginPath();ctx.arc(x,y,9,0,Math.PI * 2);ctx.strokeStyle = "rgba(43,107,233,.24)";ctx.lineWidth = 2;ctx.stroke();
  };
  const tick = t => {
    if (!running) { frame = null; return; }
    if (lastTime) phase += Math.min((t-lastTime)/1000, .05) * .85;
    lastTime = t;
    draw();
    frame = requestAnimationFrame(tick);
  };
  const begin = () => { if (frame === null && running) {lastTime=0;frame=requestAnimationFrame(tick);} };
  const stop = () => { if (frame !== null) cancelAnimationFrame(frame);frame=null;lastTime=0; };
  toggle.addEventListener("click", () => {running=!running;setButton();if(running)begin();else stop();});
  document.addEventListener("visibilitychange", () => {
    if(document.hidden) stop(); else begin();
  });
  if(typeof ResizeObserver !== "undefined") new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);
  if(media.addEventListener) media.addEventListener("change", event => {
    if(event.matches){running=false;stop();setButton();draw();}
  });
  setButton();resize();begin();
})();