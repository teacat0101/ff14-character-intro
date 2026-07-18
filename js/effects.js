/* Particle effects. Depends on globals from main.js:
   reduceMotion, dustParticleLimit, photos, lbImg, current (load main.js first). */

/* floating moon dust */
const dustfield = document.getElementById('dustfield');
const dustCount = 80;
for(let i = 0; i < dustCount; i++){
  const d = document.createElement('span');
  d.className = 'dust';
  const size = (Math.random() * 3 + 1.5).toFixed(1);
  const duration = (Math.random() * 14 + 14).toFixed(1);
  d.style.width = size + 'px';
  d.style.height = size + 'px';
  d.style.left = (Math.random() * 100) + '%';
  d.style.opacity = (Math.random() * 0.4 + 0.3).toFixed(2);
  d.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px');
  d.style.animationDuration = duration + 's';
  d.style.animationDelay = (Math.random() * -duration).toFixed(1) + 's';
  dustfield.appendChild(d);
}

/* crumble the open photo into dust and pull it back toward its thumbnail in the grid */
function disintegratePhoto(onDone){
  const imgRect = lbImg.getBoundingClientRect();
  const thumb = document.querySelectorAll('.polaroid')[current];
  const thumbRect = thumb ? thumb.getBoundingClientRect() : imgRect;
  const targetX = thumbRect.left + thumbRect.width / 2;
  const targetY = thumbRect.top + thumbRect.height / 2;

  const sampleCols = 96, sampleRows = 60;
  const canvas = document.createElement('canvas');
  canvas.width = sampleCols; canvas.height = sampleRows;
  const ctx = canvas.getContext('2d');

  let data = null;
  try{
    ctx.drawImage(lbImg, 0, 0, sampleCols, sampleRows);
    data = ctx.getImageData(0, 0, sampleCols, sampleRows).data;
  }catch(err){ data = null; }

  if(!data){
    gsap.to(lbImg, {
      x: targetX - (imgRect.left + imgRect.width / 2),
      y: targetY - (imgRect.top + imgRect.height / 2),
      scale:.05, opacity:0, duration:.6, ease:'power2.in',
      onComplete: () => { gsap.set(lbImg, {x:0, y:0, clearProps:'transform'}); onDone && onDone(); }
    });
    return;
  }

  lbImg.style.visibility = 'hidden';

  /* one canvas draws every grain — hundreds of separate DOM elements would each
     get their own compositor layer and tank frame rate (esp. on Safari) */
  const dpr = window.devicePixelRatio || 1;
  const dustCanvas = document.createElement('canvas');
  dustCanvas.width = window.innerWidth * dpr;
  dustCanvas.height = window.innerHeight * dpr;
  dustCanvas.style.position = 'fixed';
  dustCanvas.style.inset = '0';
  dustCanvas.style.width = window.innerWidth + 'px';
  dustCanvas.style.height = window.innerHeight + 'px';
  dustCanvas.style.zIndex = '200';
  dustCanvas.style.pointerEvents = 'none';
  document.body.appendChild(dustCanvas);
  const dctx = dustCanvas.getContext('2d');
  dctx.scale(dpr, dpr);

  const particleCount = dustParticleLimit;
  const particles = [];
  for(let i = 0; i < particleCount; i++){
    const relX = Math.random() * imgRect.width;
    const relY = Math.random() * imgRect.height;
    const sx = Math.min(sampleCols - 1, Math.floor((relX / imgRect.width) * sampleCols));
    const sy = Math.min(sampleRows - 1, Math.floor((relY / imgRect.height) * sampleRows));
    const idx = (sy * sampleCols + sx) * 4;
    if(data[idx + 3] < 10) continue;
    const x0 = imgRect.left + relX, y0 = imgRect.top + relY;
    const tx = targetX + (Math.random() * 30 - 15), ty = targetY + (Math.random() * 30 - 15);
    /* bow the path off the straight line and lift it, so grains arc up like
       drifting light motes instead of beelining to the thumbnail */
    const dx = tx - x0, dy = ty - y0;
    const dist = Math.hypot(dx, dy) || 1;
    const bow = (Math.random() - 0.5) * dist * 0.6;
    particles.push({
      x0, y0, tx, ty,
      cx: (x0 + tx) / 2 - (dy / dist) * bow,
      cy: (y0 + ty) / 2 + (dx / dist) * bow - (Math.random() * 80 + 30),
      size: Math.random() * 1.6 + .5,
      color: `rgb(${data[idx]},${data[idx + 1]},${data[idx + 2]})`,
      delay: Math.random() * .4,
      flicker: Math.random() * Math.PI * 2
    });
  }

  /* position along each particle's bezier arc at normalized time tt (0..1) */
  function bezierPos(pt, tt){
    const mt = 1 - tt;
    return {
      x: mt * mt * pt.x0 + 2 * mt * tt * pt.cx + tt * tt * pt.tx,
      y: mt * mt * pt.y0 + 2 * mt * tt * pt.cy + tt * tt * pt.ty
    };
  }

  const state = {p:0};
  dctx.globalCompositeOperation = 'lighter';
  dctx.lineCap = 'round';
  gsap.to(state, {
    p:1, duration:1.3, ease:'none',
    onUpdate: () => {
      dctx.clearRect(0, 0, dustCanvas.width, dustCanvas.height);
      particles.forEach(pt => {
        let t = (state.p - pt.delay) / (1 - pt.delay);
        t = t < 0 ? 0 : (t > 1 ? 1 : t);
        const eased = 1 - Math.pow(1 - t, 3);
        const fade = 1 - eased;
        if(fade <= 0) return;
        const trailT = Math.max(0, eased - 0.06);
        const head = bezierPos(pt, eased);
        const tail = bezierPos(pt, trailT);
        const twinkle = .65 + .35 * Math.sin(pt.flicker + state.p * 20);
        dctx.globalAlpha = fade * twinkle;
        dctx.strokeStyle = pt.color;
        dctx.lineWidth = pt.size * (fade * .7 + .3) * twinkle;
        dctx.beginPath();
        dctx.moveTo(tail.x, tail.y);
        dctx.lineTo(head.x, head.y);
        dctx.stroke();
      });
    },
    onComplete: () => {
      dctx.globalCompositeOperation = 'source-over';
      dustCanvas.remove();
      lbImg.style.visibility = '';
      onDone && onDone();
    }
  });
}
