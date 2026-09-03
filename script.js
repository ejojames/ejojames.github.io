var spotlight = document.querySelector('.spotlight');

if (spotlight) {
  var mediaQuery = window.matchMedia('(min-width: 1024px)');

  function handleMouseMove(e) {
    spotlight.style.background = 'radial-gradient(650px circle at ' + e.clientX + 'px ' + e.clientY + 'px, rgba(29, 78, 216, 0.22), transparent 80%)';
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
}

var sections = document.querySelectorAll('.section[id]');
var navLinks = document.querySelectorAll('.nav-link');

if (sections.length > 0 && navLinks.length > 0) {
  var observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  };

  var spyObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var id = entry.target.id;
        navLinks.forEach(function(link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(function(section) {
    spyObserver.observe(section);
  });
}

var fadeElements = document.querySelectorAll('.fade-in');

if (fadeElements.length > 0) {
  var fadeObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  fadeElements.forEach(function(el) {
    fadeObserver.observe(el);
  });
}

var canvas = document.getElementById('curvesCanvas');

if (canvas) {
  var ctx = canvas.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var width = 0;
  var height = 0;
  var animId = null;
  var lastFrame = 0;
  var FPS = 30;
  var FRAME_INTERVAL = 1000 / FPS;

  var STAR_COUNT = 120;
  var SHOOTING_STAR_INTERVAL = 6000;
  var lastShootingStarTime = 0;
  var stars = [];
  var shootingStars = [];

  var SIZES = [
    { min: 0.3, max: 0.7, weight: 55 },
    { min: 0.7, max: 1.2, weight: 30 },
    { min: 1.2, max: 1.8, weight: 10 },
    { min: 1.8, max: 2.5, weight: 5 }
  ];

  function pickSize() {
    var roll = Math.random() * 100;
    var acc = 0;
    for (var i = 0; i < SIZES.length; i++) {
      acc += SIZES[i].weight;
      if (roll < acc) {
        return SIZES[i].min + Math.random() * (SIZES[i].max - SIZES[i].min);
      }
    }
    return 1;
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * DPR;
    canvas.height = height * DPR;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function createStar() {
    var r = pickSize();
    var baseAlpha = 0.08 + Math.random() * 0.28;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: r,
      hue: Math.random() < 0.15 ? 200 + Math.random() * 40 : 0,
      sat: Math.random() < 0.15 ? 60 : 0,
      baseAlpha: baseAlpha,
      alpha: baseAlpha,
      twinkleSpeed: 0.3 + Math.random() * 1.2,
      twinkleDepth: 0.4 + Math.random() * 0.55,
      phase: Math.random() * Math.PI * 2
    };
  }

  function initStars() {
    stars = [];
    for (var i = 0; i < STAR_COUNT; i++) {
      stars.push(createStar());
    }
  }

  function createShootingStar() {
    return {
      x: Math.random() * width * 0.8,
      y: Math.random() * height * 0.4,
      vx: 4 + Math.random() * 6,
      vy: 2 + Math.random() * 3,
      length: 80 + Math.random() * 80,
      alpha: 0.6,
      life: 1.0
    };
  }

  function drawStar(s, t) {
    var osc = Math.sin(t * s.twinkleSpeed * Math.PI * 2 + s.phase);
    s.alpha = s.baseAlpha * (1 - s.twinkleDepth * 0.5 + s.twinkleDepth * 0.5 * osc);
    s.alpha = Math.max(0.02, Math.min(0.55, s.alpha));

    if (s.r > 1.4) {
      var grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
      grd.addColorStop(0, 'hsla(' + s.hue + ',' + s.sat + '%,100%,' + (s.alpha * 0.5) + ')');
      grd.addColorStop(1, 'hsla(' + s.hue + ',' + s.sat + '%,100%,0)');
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = 'hsla(' + s.hue + ',' + s.sat + '%,100%,' + s.alpha + ')';
    ctx.fill();
  }

  function drawShootingStar(ss) {
    var len = Math.hypot(ss.vx, ss.vy);
    var tailX = ss.x - ss.vx * (ss.length / len);
    var tailY = ss.y - ss.vy * (ss.length / len);
    var grd = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
    grd.addColorStop(0, 'rgba(255,255,255,0)');
    grd.addColorStop(1, 'rgba(255,255,255,' + (ss.alpha * 0.45) + ')');
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(ss.x, ss.y);
    ctx.strokeStyle = grd;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function render(timestamp) {
    animId = requestAnimationFrame(render);
    if (timestamp - lastFrame < FRAME_INTERVAL) return;
    var dt = (timestamp - lastFrame) / 1000;
    lastFrame = timestamp;
    var t = timestamp / 1000;

    ctx.clearRect(0, 0, width, height);

    for (var i = 0; i < stars.length; i++) {
      drawStar(stars[i], t);
    }

    if (timestamp - lastShootingStarTime > SHOOTING_STAR_INTERVAL) {
      shootingStars.push(createShootingStar());
      lastShootingStarTime = timestamp;
    }

    var activeShootingStars = [];
    for (var j = 0; j < shootingStars.length; j++) {
      var ss = shootingStars[j];
      ss.x += ss.vx;
      ss.y += ss.vy;
      ss.life -= dt * 1.2;
      ss.alpha = ss.life * 0.6;
      if (ss.life > 0) {
        drawShootingStar(ss);
        activeShootingStars.push(ss);
      }
    }
    shootingStars = activeShootingStars;
  }

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      cancelAnimationFrame(animId);
      animId = null;
    } else {
      lastFrame = performance.now();
      animId = requestAnimationFrame(render);
    }
  });

  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      resize();
      initStars();
    }, 200);
  });

  resize();
  initStars();
  animId = requestAnimationFrame(render);
}

var strip = document.getElementById('credentials-container');

if (strip) {
  var isDown = false;
  var startX = 0;
  var scrollLeft = 0;
  var moved = false;

  strip.addEventListener('mousedown', function(e) {
    isDown = true;
    moved = false;
    startX = e.pageX - strip.offsetLeft;
    scrollLeft = strip.scrollLeft;
    strip.style.userSelect = 'none';
  });

  document.addEventListener('mouseup', function() {
    if (!isDown) return;
    isDown = false;
    strip.style.userSelect = '';

    if (moved) {
      var links = strip.querySelectorAll('a');
      links.forEach(function(a) {
        function guard(ev) {
          ev.preventDefault();
          a.removeEventListener('click', guard);
        }
        a.addEventListener('click', guard);
      });
    }
  });

  document.addEventListener('mousemove', function(e) {
    if (!isDown) return;
    e.preventDefault();
    var x = e.pageX - strip.offsetLeft;
    var walk = (x - startX) * 1.4;
    strip.scrollLeft = scrollLeft - walk;
    if (Math.abs(walk) > 5) {
      moved = true;
    }
  });
}

var groups = [
  { sel: '.about-content p', cls: 'stagger-up' },
  { sel: '.currently-card', cls: 'stagger-up' },
  { sel: '.project-item', cls: 'stagger-up' },
  { sel: '.badge-link', cls: 'stagger-pop' }
];

groups.forEach(function(group) {
  var elements = document.querySelectorAll(group.sel);
  elements.forEach(function(el, i) {
    el.classList.add(group.cls);
    el.style.setProperty('--si', i);
  });
});

var staggerObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      staggerObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0,
  rootMargin: '50px 0px 50px 0px'
});

var staggerElements = document.querySelectorAll('.stagger-up, .stagger-pop');
staggerElements.forEach(function(el) {
  staggerObserver.observe(el);
});

var sectionObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (!entry.isIntersecting) return;
    var children = entry.target.querySelectorAll('.stagger-up, .stagger-pop');
    children.forEach(function(el) {
      el.classList.add('revealed');
    });
    sectionObserver.unobserve(entry.target);
  });
}, {
  threshold: 0,
  rootMargin: '100px 0px 100px 0px'
});

var sectionsList = document.querySelectorAll('.section');
sectionsList.forEach(function(sec) {
  sectionObserver.observe(sec);
});
