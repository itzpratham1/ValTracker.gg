/* ── Navbar scroll effect ── */
const nav = document.getElementById('main-nav');
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });



/* ── Hero Canvas Particles — interactive, connected, mouse-reactive ── */
(function initParticles() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], animFrame, mouse = { x: -1000, y: -1000 };

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      alpha: Math.random() * 0.5 + 0.15,
      baseAlpha: Math.random() * 0.5 + 0.15
    };
  }

  function init() {
    resize();
    const count = W < 768 ? 35 : 70;
    particles = Array.from({ length: count }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Draw connecting lines between nearby particles */
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const lineAlpha = (1 - dist / 120) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(255,70,85,${lineAlpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    /* Draw and update particles */
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      /* Mouse repulsion — particles scatter when cursor is near */
      const mdx = p.x - mouse.x;
      const mdy = p.y - mouse.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mDist < 150) {
        const force = (150 - mDist) / 150;
        p.vx += (mdx / mDist) * force * 0.6;
        p.vy += (mdy / mDist) * force * 0.6;
        p.alpha = Math.min(p.baseAlpha + force * 0.5, 1);
      } else {
        p.alpha += (p.baseAlpha - p.alpha) * 0.05;
      }

      /* Damping */
      p.vx *= 0.98;
      p.vy *= 0.98;

      /* Clamp speed */
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > 2) { p.vx = (p.vx / speed) * 2; p.vy = (p.vy / speed) * 2; }

      /* Base drift */
      p.vx += (Math.random() - 0.5) * 0.02;
      p.vy += (Math.random() - 0.5) * 0.02;

      p.x += p.vx;
      p.y += p.vy;

      /* Wrap around edges softly */
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;

      /* Glow particle */
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
      gradient.addColorStop(0, `rgba(255,70,85,${p.alpha})`);
      gradient.addColorStop(1, 'rgba(255,70,85,0)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      /* Core dot */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,70,85,${p.alpha})`;
      ctx.fill();
    }

    animFrame = requestAnimationFrame(draw);
  }

  /* Track mouse position on canvas */
  canvas.parentElement.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.parentElement.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  const resizeObs = new ResizeObserver(() => { init(); });
  resizeObs.observe(canvas.parentElement);

  init();
  draw();

  const visObs = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!animFrame) draw(); }
    else { cancelAnimationFrame(animFrame); animFrame = null; }
  }, { threshold: 0 });
  visObs.observe(canvas);
})();

/* ── Parallax scroll effects ── */
(function initParallax() {
  const heroGrid = document.querySelector('.hero-grid');
  const heroGlow = document.querySelector('.hero-glow');
  const heroGlow2 = document.querySelector('.hero-glow-2');
  const heroContent = document.querySelector('.hero-content');
  const heroMockup = document.querySelector('.hero-mockup-wrap');
  const obsMockup = document.querySelector('.obs-mockup');
  const heroBg = document.querySelector('.hero-bg');
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        if (scrollY < window.innerHeight * 1.5) {
          if (heroGrid) heroGrid.style.transform = `perspective(600px) rotateX(20deg) translateY(${scrollY * 0.15}px)`;
          if (heroGlow) heroGlow.style.transform = `translate(-50%, calc(-50% + ${scrollY * 0.25}px))`;
          if (heroGlow2) heroGlow2.style.transform = `translateY(${scrollY * -0.1}px)`;
          if (heroContent) heroContent.style.transform = `translateY(${scrollY * 0.08}px)`;
          if (heroMockup) heroMockup.style.transform = `translateY(${scrollY * -0.05}px)`;
        }
        if (obsMockup) {
          const rect = obsMockup.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
            obsMockup.style.transform = `translateY(${(progress - 0.5) * -30}px)`;
          }
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  /* Mouse move parallax for background glow */
  if (heroBg && window.innerWidth > 1024 && window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 35;
      const y = (e.clientY / window.innerHeight - 0.5) * 35;
      heroBg.style.setProperty('--mouse-x', `${x}px`);
      heroBg.style.setProperty('--mouse-y', `${y}px`);
    });
  }
})();

/* ── 3D Tilt on bento cards (classy, smooth & subtle — disabled on mobile/touchscreen) ── */
(function initTiltCards() {
  const cards = document.querySelectorAll('.bento-card');
  // Disable tilt card completely on screen widths <= 1024 or device touch screens
  if (window.innerWidth <= 1024 || !window.matchMedia('(hover: hover)').matches) {
    return;
  }
  
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      // Dynamic mobile/touchscreen safety check
      if (window.innerWidth <= 1024 || !window.matchMedia('(hover: hover)').matches) {
        return;
      }
      if (!card.classList.contains('visible')) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -3.5;
      const rotateY = ((x - centerX) / centerX) * 3.5;
      
      card.style.setProperty('--rx', rotateX + 'deg');
      card.style.setProperty('--ry', rotateY + 'deg');
      card.style.setProperty('--scale', '1.015');

      /* Move the inner glow to follow cursor */
      const glowX = (x / rect.width) * 100;
      const glowY = (y / rect.height) * 100;
      card.style.setProperty('--glow-x', glowX + '%');
      card.style.setProperty('--glow-y', glowY + '%');
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--scale', '1');
    });
  });
})();

/* ── Hero Browser Tab Switching ── */
(function initBrowserTabs() {
  const tabs = document.querySelectorAll('.browser-tab');
  const statsImg = document.getElementById('hero-stats-img');
  const aiImg = document.getElementById('hero-ai-img');
  const urlText = document.getElementById('browser-url-text');
  
  if (!tabs.length || !statsImg || !aiImg || !urlText) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.getAttribute('data-target');
      if (target === 'hero-stats-tab') {
        statsImg.style.display = 'block';
        aiImg.style.display = 'none';
        urlText.textContent = 'valtracker.live/app/stats';
      } else {
        statsImg.style.display = 'none';
        aiImg.style.display = 'block';
        urlText.textContent = 'valtracker.live/app/coach';
      }
    });
  });
})();



/* ── Unified scroll reveal (single observer for all) ── */
(function initScrollReveal() {
  const allEls = document.querySelectorAll('.bento-card, .reveal, .step-item');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        if (el.classList.contains('bento-card')) {
          const cards = document.querySelectorAll('.bento-card');
          const idx = Array.from(cards).indexOf(el);
          setTimeout(() => el.classList.add('visible'), idx * 80);
        } else if (el.classList.contains('step-item')) {
          const steps = document.querySelectorAll('.step-item');
          const idx = Array.from(steps).indexOf(el);
          setTimeout(() => el.classList.add('visible'), idx * 150);
        } else {
          el.classList.add('visible');
        }
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
  allEls.forEach(el => obs.observe(el));
})();

/* ── Counter animation ── */
(function initCounters() {
  const counters = [
    { el: document.getElementById('counter-matches'),  target: 530, suffix: '+' },
    { el: document.getElementById('counter-features'), target: 6,   suffix: '' },
    { el: document.getElementById('counter-free'),     target: 100, suffix: '%' }
  ];

  /* Fetch real match count from API */
  fetch('/api/landing-stats')
    .then(r => r.json())
    .then(data => {
      if (data && data.matches_analysed) {
        counters[0].target = data.matches_analysed;
      }
      if (data && data.features_count) {
        counters[1].target = data.features_count;
      }
    })
    .catch(() => {});

  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  function animateCounter(counter) {
    if (!counter.el) return;
    const duration = 1800;
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      counter.el.textContent = Math.round(easeOutQuart(progress) * counter.target) + counter.suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const statsBar = document.getElementById('stats-bar');
  const obs = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      counters.forEach(c => animateCounter(c));
      obs.unobserve(statsBar);
    }
  }, { threshold: 0.4 });
  obs.observe(statsBar);
})();

/* ── Lightbox Image Zoom (Interactive Zoom & Pan System) ── */
(function initLightbox() {
  const lightbox = document.getElementById('image-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const viewer = document.getElementById('lightbox-viewer');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const images = document.querySelectorAll('.card-img-frame img, #hero-stats-img, #hero-ai-img');
  
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');
  const zoomResetBtn = document.getElementById('zoom-reset-btn');
  const zoomLevelSpan = document.getElementById('zoom-level');

  if (!lightbox || !lightboxImg || !viewer) return;

  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  const updateTransform = () => {
    lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    if (zoomLevelSpan) {
      zoomLevelSpan.textContent = Math.round(scale * 100) + '%';
    }
  };

  const zoomIn = () => {
    scale = Math.min(scale + 0.25, 4.0);
    updateTransform();
  };

  const zoomOut = () => {
    scale = Math.max(scale - 0.25, 0.5);
    if (scale <= 1) {
      translateX = 0;
      translateY = 0;
    }
    updateTransform();
  };

  const resetZoom = () => {
    scale = 1;
    translateX = 0;
    translateY = 0;
    updateTransform();
  };

  // Open Lightbox
  images.forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      resetZoom();
      lightbox.style.display = 'flex';
      lightbox.offsetHeight; // force reflow
      lightbox.style.opacity = '1';
      lightbox.setAttribute('aria-hidden', 'false');
    });
  });

  // Toggle Zoom on click (Zoom to 2.5x or Reset)
  lightboxImg.addEventListener('click', (e) => {
    e.stopPropagation();
    if (scale > 1) {
      resetZoom();
    } else {
      scale = 2.5;
      translateX = 0;
      translateY = 0;
      updateTransform();
    }
  });

  // Zoom Button Listeners
  if (zoomInBtn) zoomInBtn.addEventListener('click', (e) => { e.stopPropagation(); zoomIn(); });
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', (e) => { e.stopPropagation(); zoomOut(); });
  if (zoomResetBtn) zoomResetBtn.addEventListener('click', (e) => { e.stopPropagation(); resetZoom(); });

  // Panning Event Listeners (Mouse)
  viewer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    viewer.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    updateTransform();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    if (viewer) viewer.style.cursor = 'grab';
  });

  // Panning Event Listeners (Touch)
  viewer.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX - translateX;
      startY = e.touches[0].clientY - translateY;
    }
  }, { passive: true });

  viewer.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    translateX = e.touches[0].clientX - startX;
    translateY = e.touches[0].clientY - startY;
    updateTransform();
  }, { passive: true });

  viewer.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Mouse Wheel Zoom
  viewer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomIntensity = 0.08;
    const delta = e.deltaY < 0 ? 1 : -1;
    scale = Math.max(0.5, Math.min(4.0, scale + delta * zoomIntensity));
    if (scale <= 1) {
      translateX = 0;
      translateY = 0;
    }
    updateTransform();
  }, { passive: false });

  function closeLightbox() {
    lightbox.style.opacity = '0';
    lightbox.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      lightbox.style.display = 'none';
      lightboxImg.src = '';
      resetZoom();
    }, 300);
  }

  // Close when clicking outside viewer
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox')) {
      closeLightbox();
    }
  });
  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.style.display === 'flex') {
      closeLightbox();
    }
  });
})();

/* ── Reduce motion support ── */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.bento-card, .reveal, .step-item, .njt-card, .njt-table-container, .njt-cta').forEach(el => {
    el.style.transition = 'none';
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.classList.add('visible');
  });
  const canvas = document.getElementById('hero-canvas');
  if (canvas) canvas.style.display = 'none';
}