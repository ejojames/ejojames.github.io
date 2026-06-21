// ===== CURSOR SPOTLIGHT =====
(function () {
  const spotlight = document.querySelector('.spotlight');
  if (!spotlight) return;

  // Only enable on large screens (matches the lg breakpoint)
  const mediaQuery = window.matchMedia('(min-width: 1024px)');

  function handleMouseMove(e) {
    spotlight.style.background = `radial-gradient(
      650px circle at ${e.clientX}px ${e.clientY}px,
      rgba(29, 78, 216, 0.22),
      transparent 80%
    )`;
  }

  function toggleSpotlight(mq) {
    if (mq.matches) {
      document.addEventListener('mousemove', handleMouseMove);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      spotlight.style.background = '';
    }
  }

  toggleSpotlight(mediaQuery);
  mediaQuery.addEventListener('change', toggleSpotlight);
})();

// ===== SCROLL-SPY (ACTIVE NAV) =====
(function () {
  const sections = document.querySelectorAll('.section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!sections.length || !navLinks.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;

        navLinks.forEach((link) => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));
})();

// ===== FADE-IN ON SCROLL =====
(function () {
  const fadeElements = document.querySelectorAll('.fade-in');
  if (!fadeElements.length) return;

  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  fadeElements.forEach((el) => fadeObserver.observe(el));
})();

// ===== STARRY SKY + RED NEBULA (CANVAS) =====
(function () {
  const canvas = document.getElementById('curvesCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let width, height;
  let animId = null;
  let lastFrame = 0;
  const FPS = 30;
  const FRAME_INTERVAL = 1000 / FPS;

  // ── Star config ──────────────────────────────────────────
  const STAR_COUNT = 280;
  const SHOOTING_STAR_INTERVAL = 6000;
  let lastShootingStarTime = 0;
  let stars = [];
  let shootingStars = [];

  const SIZES = [
    { min: 0.3, max: 0.7, weight: 55 },
    { min: 0.7, max: 1.2, weight: 30 },
    { min: 1.2, max: 1.8, weight: 10 },
    { min: 1.8, max: 2.5, weight: 5  },
  ];

  function pickSize() {
    const roll = Math.random() * 100;
    let acc = 0;
    for (const s of SIZES) {
      acc += s.weight;
      if (roll < acc) return s.min + Math.random() * (s.max - s.min);
    }
    return 1;
  }

  // ── Nebula config ─────────────────────────────────────────
  // 110 independent blobs — spanning the full left half + beyond.
  const NEBULA_BLOB_COUNT = 110;
  let nebulaBlobs = [];
  let nebulaCx = 0;
  let nebulaCy = 0;

  function buildNebula() {
    const nameEl = document.querySelector('.header-name');
    if (!nameEl) return;

    const rect    = nameEl.getBoundingClientRect();
    const scrollY = window.scrollY || 0;

    nebulaCx = rect.left + rect.width  * 0.45;
    nebulaCy = rect.top  + scrollY + rect.height * 0.55;

    nebulaBlobs = [];

    for (let i = 0; i < NEBULA_BLOB_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;

      // Very wide semi-axes — nebula fans out like a real galactic cloud
      const rx = 200 + Math.random() * 1200;  // horizontal reach: 200–1400 px
      const ry = 100 + Math.random() *  700;  // vertical reach:   100–800 px
      // Exponent 0.35 → blobs distributed heavily toward outer edges
      const t  = Math.pow(Math.random(), 0.35);

      const blobR = 130 + Math.random() * 420; // blobs: 130–550 px radius

      const hue = 338 + Math.random() * 28;    // deep crimson → rose
      const sat =  78 + Math.random() * 18;
      const lit =  30 + Math.random() * 24;

      nebulaBlobs.push({
        ox: Math.cos(angle) * rx * t,
        oy: Math.sin(angle) * ry * t,
        r:  blobR,
        baseAlpha:  0.025 + Math.random() * 0.045,  // 0.025 – 0.07 per blob
        phase:      Math.random() * Math.PI * 2,
        driftSpeed: 0.018 + Math.random() * 0.05,
        driftAmp:   { x: 10 + Math.random() * 32, y: 5 + Math.random() * 18 },
        hue, sat, lit,
      });
    }
  }

  function drawNebula(t) {
    for (const b of nebulaBlobs) {
      // Slow sinusoidal drift — each blob moves independently
      const x = nebulaCx + b.ox + Math.sin(t * b.driftSpeed + b.phase)           * b.driftAmp.x;
      const y = nebulaCy + b.oy + Math.cos(t * b.driftSpeed * 0.65 + b.phase + 1) * b.driftAmp.y;

      // Breathing alpha — gentle pulse per blob
      const pulse = 0.75 + 0.25 * Math.sin(t * b.driftSpeed * 1.3 + b.phase * 2);
      const alpha = b.baseAlpha * pulse;

      const grd = ctx.createRadialGradient(x, y, 0, x, y, b.r);
      grd.addColorStop(0,    `hsla(${b.hue}, ${b.sat}%, ${b.lit}%, ${alpha})`);
      grd.addColorStop(0.45, `hsla(${b.hue}, ${b.sat - 10}%, ${b.lit - 10}%, ${alpha * 0.55})`);
      grd.addColorStop(1,    `hsla(${b.hue}, 60%, 15%, 0)`);

      ctx.beginPath();
      ctx.arc(x, y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }
  }

  // ── Canvas resize ─────────────────────────────────────────
  function resize() {
    width  = window.innerWidth;
    height = document.body.scrollHeight;
    canvas.width  = width  * DPR;
    canvas.height = height * DPR;
    canvas.style.width  = width  + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  // ── Star helpers ──────────────────────────────────────────
  function createStar() {
    const r = pickSize();
    const baseAlpha = 0.08 + Math.random() * 0.28;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r,
      hue: Math.random() < 0.15 ? 200 + Math.random() * 40 : 0,
      sat: Math.random() < 0.15 ? 60 : 0,
      baseAlpha,
      alpha: baseAlpha,
      twinkleSpeed: 0.3 + Math.random() * 1.2,
      twinkleDepth: 0.4 + Math.random() * 0.55,
      phase: Math.random() * Math.PI * 2,
    };
  }

  function initStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) stars.push(createStar());
  }

  function createShootingStar() {
    return {
      x: Math.random() * width * 0.8,
      y: Math.random() * height * 0.4,
      vx: 4 + Math.random() * 6,
      vy: 2 + Math.random() * 3,
      length: 80 + Math.random() * 80,
      alpha: 0.6,
      life: 1.0,
    };
  }

  function drawStar(s, t) {
    const osc = Math.sin(t * s.twinkleSpeed * Math.PI * 2 + s.phase);
    s.alpha = s.baseAlpha * (1 - s.twinkleDepth * 0.5 + s.twinkleDepth * 0.5 * osc);
    s.alpha = Math.max(0.02, Math.min(0.55, s.alpha));

    if (s.r > 1.4) {
      const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
      grd.addColorStop(0, `hsla(${s.hue},${s.sat}%,100%,${s.alpha * 0.5})`);
      grd.addColorStop(1, `hsla(${s.hue},${s.sat}%,100%,0)`);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${s.hue},${s.sat}%,100%,${s.alpha})`;
    ctx.fill();
  }

  function drawShootingStar(ss) {
    const len = Math.hypot(ss.vx, ss.vy);
    const tailX = ss.x - ss.vx * (ss.length / len);
    const tailY = ss.y - ss.vy * (ss.length / len);
    const grd = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
    grd.addColorStop(0, `rgba(255,255,255,0)`);
    grd.addColorStop(1, `rgba(255,255,255,${ss.alpha * 0.45})`);
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(ss.x, ss.y);
    ctx.strokeStyle = grd;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // ── Render loop ───────────────────────────────────────────
  function render(timestamp) {
    animId = requestAnimationFrame(render);
    if (timestamp - lastFrame < FRAME_INTERVAL) return;
    const dt = (timestamp - lastFrame) / 1000;
    lastFrame = timestamp;
    const t = timestamp / 1000;

    ctx.clearRect(0, 0, width, height);

    // 1. Nebula first — sits behind stars
    drawNebula(t);

    // 2. Stars with twinkle
    for (const s of stars) drawStar(s, t);

    // 3. Shooting stars
    if (timestamp - lastShootingStarTime > SHOOTING_STAR_INTERVAL) {
      shootingStars.push(createShootingStar());
      lastShootingStarTime = timestamp;
    }
    shootingStars = shootingStars.filter(ss => ss.life > 0);
    for (const ss of shootingStars) {
      ss.x += ss.vx;
      ss.y += ss.vy;
      ss.life -= dt * 1.2;
      ss.alpha = ss.life * 0.6;
      drawShootingStar(ss);
    }
  }

  // ── Events ─────────────────────────────────────────────────
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animId); animId = null;
    } else {
      lastFrame = performance.now();
      animId = requestAnimationFrame(render);
    }
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); initStars(); buildNebula(); }, 200);
  });

  // ── Boot ───────────────────────────────────────────────────
  resize();
  initStars();
  // Defer nebula build until layout is painted so getBoundingClientRect is accurate
  requestAnimationFrame(() => { buildNebula(); });
  animId = requestAnimationFrame(render);
})();

// ===== CREDENTIALS DRAG-TO-SCROLL =====
(function () {
  const strip = document.getElementById('credentials-container');
  if (!strip) return;

  let isDown   = false;
  let startX   = 0;
  let scrollLeft = 0;
  let moved    = false;

  strip.addEventListener('mousedown', (e) => {
    isDown = true;
    moved  = false;
    startX = e.pageX - strip.offsetLeft;
    scrollLeft = strip.scrollLeft;
    strip.style.userSelect = 'none';
  });

  document.addEventListener('mouseup', (e) => {
    if (!isDown) return;
    isDown = false;
    strip.style.userSelect = '';

    // If the user dragged more than 5px, swallow the click so the badge link
    // doesn't open when they were just scrolling
    if (moved) {
      strip.querySelectorAll('a').forEach(a => {
        const guard = (ev) => { ev.preventDefault(); a.removeEventListener('click', guard); };
        a.addEventListener('click', guard);
      });
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x    = e.pageX - strip.offsetLeft;
    const walk = (x - startX) * 1.4;    // 1.4× multiplier for snappy feel
      strip.scrollLeft = scrollLeft - walk;
    if (Math.abs(walk) > 5) moved = true;
  });
})();


// ===== STAGGER ENTRANCE ENGINE =====
(function () {
  // ── 1. Auto-assign stagger classes + --si index to element groups ──────────
  // Each group gets its own class and is indexed independently.
  // stagger-up  → transform-only (safe inside fade-in parents, no opacity conflict)
  // stagger-pop → spring-scale (for badges)
  const groups = [
    { sel: '.about-content p',  cls: 'stagger-up'  },
    { sel: '.currently-card',   cls: 'stagger-up'  },
    { sel: '.project-item',     cls: 'stagger-up'  },
    { sel: '.badge-link',       cls: 'stagger-pop' },
  ];

  groups.forEach(({ sel, cls }) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add(cls);
      el.style.setProperty('--si', i);
    });
  });

  // ── 2. Single observer fires .revealed when element enters viewport ─────────
  // Because all elements in a group are often visible at the same time,
  // the observer fires for all of them simultaneously — the CSS --si delay
  // creates the visual stagger (first card 0ms, second 110ms, third 220ms …).
  const staggerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          staggerObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.06, rootMargin: '0px 0px -30px 0px' }
  );

  document.querySelectorAll('.stagger-up, .stagger-pop').forEach((el) => {
    staggerObserver.observe(el);
  });

  // ── 3. Section-level observer: when a section becomes visible,
  //       immediately reveal any stagger children not yet intersecting ─────────
  // This prevents elements visible on first load from never getting .revealed
  // because they entered the viewport before the observer was attached.
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target
          .querySelectorAll('.stagger-up, .stagger-pop')
          .forEach((el) => el.classList.add('revealed'));
        sectionObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.01 }
  );

  document.querySelectorAll('.section').forEach((sec) => {
    sectionObserver.observe(sec);
  });
})();
