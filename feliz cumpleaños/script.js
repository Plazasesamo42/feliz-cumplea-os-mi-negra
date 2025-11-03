// Espera a que el DOM esté listo para enlazar eventos
document.addEventListener('DOMContentLoaded', () => {
  // Elementos
  const cake = document.getElementById('cake');
  const backdrop = document.getElementById('backdrop');
  const modal = document.getElementById('modal');
  const closeBtn = document.getElementById('close');
  const replayBtn = document.getElementById('replay');

  // Música
  const bgm = document.getElementById('bgm');
  const toggleAudioBtn = document.getElementById('toggle-audio');

  let lastFocused = null;

  // Utilidad: elementos focuseables dentro del modal
  function getFocusable(container){
    return Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  // Abrir modal
  function openCard(){
    lastFocused = document.activeElement;
    document.body.classList.add('open');
    backdrop.setAttribute('aria-hidden','false');
    const focusables = getFocusable(modal);
    (focusables[0] || modal).focus({preventScroll:true});
    startConfettiBurst();
    setTimeout(() => startConfettiSideBursts(), 260);
    tryPlayBGM();
  }

  // Cerrar modal
  function closeCard(){
    document.body.classList.remove('open');
    backdrop.setAttribute('aria-hidden','true');
    if(lastFocused) lastFocused.focus({preventScroll:true});
    pauseBGM();
  }

  // Trap de foco y Escape
  modal.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){ e.preventDefault(); closeCard(); return; }
    if(e.key !== 'Tab') return;
    const focusables = getFocusable(modal);
    if(focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if(e.shiftKey && document.activeElement === first){
      e.preventDefault();
      last.focus();
    }else if(!e.shiftKey && document.activeElement === last){
      e.preventDefault();
      first.focus();
    }
  });

  // Interacciones
  cake.addEventListener('click', openCard);
  cake.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); openCard(); }});
  backdrop.addEventListener('click', closeCard);
  closeBtn?.addEventListener('click', closeCard);
  replayBtn?.addEventListener('click', startConfettiBurst);

  // ----------------------
  // Música de fondo
  // ----------------------
  function tryPlayBGM(){
    if(!bgm) return;
    bgm.volume = 0.35;
    const p = bgm.play();
    if (p && typeof p.then === 'function') {
      p.then(() => {
        toggleAudioBtn.setAttribute('aria-pressed','true');
        toggleAudioBtn.textContent = '🔇 Silenciar';
      }).catch(() => {
        toggleAudioBtn.setAttribute('aria-pressed','false');
        toggleAudioBtn.textContent = '🔊 Activar sonido';
      });
    }
  }

  function pauseBGM(){
    if(!bgm) return;
    bgm.pause();
    toggleAudioBtn.setAttribute('aria-pressed','false');
    toggleAudioBtn.textContent = '🔊 Activar sonido';
  }

  toggleAudioBtn.addEventListener('click', async () => {
    try {
      if (bgm.paused) {
        await bgm.play();
        toggleAudioBtn.setAttribute('aria-pressed','true');
        toggleAudioBtn.textContent = '🔇 Silenciar';
      } else {
        pauseBGM();
      }
    } catch (e) {
      console.warn('No se pudo reproducir:', e);
    }
  });

  // ----------------------
  // Confeti con Canvas
  // ----------------------
  let confettiCanvas = null;
  let ctx = null;
  let particles = [];
  let raf = null;

  function ensureCanvas(){
    if(confettiCanvas) return;
    confettiCanvas = document.createElement('canvas');
    confettiCanvas.id = 'confetti-canvas';
    document.body.appendChild(confettiCanvas);
    ctx = confettiCanvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  function resizeCanvas(){
    if(!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }

  function random(min,max){ return Math.random()*(max-min)+min; }

  const COLORS = ['#ff6fa3','#ffd166','#8ed1fc','#7bd389','#c792ea','#ff9f1c'];

  function spawnParticles(count, originX, originY, spread=70, velocity=8){
    ensureCanvas();
    for(let i=0;i<count;i++){
      const angle = (Math.random() * spread - spread/2) * Math.PI/180 + (Math.random()<0.5 ? Math.PI : 0);
      const speed = velocity * random(0.6,1.2);
      particles.push({
        x: originX * confettiCanvas.width,
        y: originY * confettiCanvas.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - random(2,5),
        size: random(4,8),
        rot: random(0, Math.PI*2),
        vr: random(-0.2, 0.2),
        color: COLORS[Math.floor(Math.random()*COLORS.length)],
        ttl: random(900, 1600)
      });
    }
    if(!raf) animate();
  }

  function animate(){
    raf = requestAnimationFrame(animate);
    const now = 16;
    ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);

    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.ttl -= now;
      if(p.ttl <= 0){ particles.splice(i,1); continue; }
      p.vy += 0.12;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
      ctx.restore();
    }

    if(particles.length === 0){
      cancelAnimationFrame(raf);
      raf = null;
    }
  }

  function startConfettiBurst(){
    spawnParticles(140, 0.5, 0.1, 120, 9);
  }

  function startConfettiSideBursts(){
    spawnParticles(80, 0.1, 0.2, 100, 8);
    spawnParticles(80, 0.9, 0.2, 100, 8);
  }
});
