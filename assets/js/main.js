/* =========================================================
   Portfolio interactions
   ========================================================= */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;

  const nav = document.getElementById('nav');
  const toggle = document.querySelector('.nav__toggle');
  const links = document.getElementById('navLinks');
  /* ---------- Nav background on scroll (rAF-throttled) ---------- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 16);
      ticking = false;
    });
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const setMenu = (open) => {
    links.classList.toggle('open', open);
    toggle.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    document.body.classList.toggle('no-scroll', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 1025px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Light / dark theme switch ---------- */
  const root = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  const syncThemeButton = () => {
    const label = root.dataset.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
    themeBtn.setAttribute('aria-label', label);
    themeBtn.title = label;
  };

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    themeMeta.setAttribute('content', theme === 'light' ? '#f6f6fa' : '#07080d');
    try { localStorage.setItem('theme', theme); } catch (e) { /* private mode: just don't persist */ }
    syncThemeButton();
  };

  if (themeBtn) {
    syncThemeButton();
    themeBtn.addEventListener('click', () => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      if (!document.startViewTransition || reduceMotion) { applyTheme(next); return; }

      // new theme grows out of the button as a circle
      const r = themeBtn.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const transition = document.startViewTransition(() => applyTheme(next));
      transition.ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 650, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(() => {});
    });
  }

  /* ---------- Sliding nav indicator + scroll spy ---------- */
  const navLinks = [...links.querySelectorAll('a[href^="#"]')];
  const indicator = document.createElement('span');
  indicator.className = 'nav__indicator';
  indicator.setAttribute('aria-hidden', 'true');
  links.prepend(indicator);

  let activeLink = null;
  const moveIndicator = () => {
    if (!activeLink) { indicator.style.opacity = '0'; return; }
    indicator.style.width = `${activeLink.offsetWidth}px`;
    indicator.style.transform = `translateX(${activeLink.offsetLeft}px)`;
    indicator.style.opacity = '1';
  };
  const setActive = (link) => {
    activeLink = link;
    navLinks.forEach((a) => a.classList.toggle('is-active', a === link));
    moveIndicator();
  };
  window.addEventListener('resize', moveIndicator);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);

  if (hasIO) {
    const sections = navLinks
      .map((a) => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);
    const spyIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        setActive(navLinks.find((a) => a.getAttribute('href') === id) || null);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spyIO.observe(s));

    const heroIO = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setActive(null);
    }, { rootMargin: '-45% 0px -50% 0px' });
    heroIO.observe(document.getElementById('top'));
  }

  /* ---------- Reveal on scroll ---------- */
  // index skill chips so they can glide in one after another
  document.querySelectorAll('.skill').forEach((card) => {
    card.querySelectorAll('.chip').forEach((chip, i) => chip.style.setProperty('--ci', i));
  });

  const revealEls = document.querySelectorAll('.reveal');
  if (hasIO && !reduceMotion) {
    const revealIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach((el) => revealIO.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const runCounter = (el) => {
    const target = Number(el.dataset.count);
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (hasIO && !reduceMotion) {
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          countIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => { el.textContent = '0'; countIO.observe(el); });
  }

  /* ---------- Typing effect ---------- */
  const typedEl = document.getElementById('typed');
  const phrases = [
    'RAG Pipelines',
    'AI Agents & Chatbots',
    'FastAPI & Django APIs',
    'LangChain & CrewAI',
    'Scalable Backends',
    'Real-time Systems',
  ];
  if (typedEl && !reduceMotion) {
    let phraseIdx = 0;
    let charIdx = phrases[0].length;
    let deleting = true;

    const step = () => {
      const phrase = phrases[phraseIdx];
      if (deleting) {
        charIdx -= 1;
        typedEl.textContent = phrase.slice(0, charIdx);
        if (charIdx === 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          return setTimeout(step, 350);
        }
        return setTimeout(step, 35);
      }
      const next = phrases[phraseIdx];
      charIdx += 1;
      typedEl.textContent = next.slice(0, charIdx);
      if (charIdx === next.length) {
        deleting = true;
        return setTimeout(step, 1900);
      }
      return setTimeout(step, 70);
    };
    setTimeout(step, 2200);
  }

  /* ---------- Card spotlight follows cursor ---------- */
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Footer year ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Floating arrow agents ---------- */
  const canvas = document.getElementById('agentsCanvas');
  if (!canvas || reduceMotion) return;

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const palette = ['#8b5cf6', '#22d3ee', '#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#a78bfa', '#fb7185'];
  let w = 0;
  let h = 0;
  const mouse = { x: -9999, y: -9999 };
  const COUNT = window.matchMedia('(max-width: 820px)').matches ? 10 : 18;

  const resize = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });
  window.addEventListener('pointerleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  const agents = Array.from({ length: COUNT }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: Math.cos(angle) * (0.25 + Math.random() * 0.55),
      vy: Math.sin(angle) * (0.25 + Math.random() * 0.55),
      color: palette[i % palette.length],
      size: 7 + Math.random() * 5,
      wander: Math.random() * Math.PI * 2,
      lag: 0.012 + Math.random() * 0.03,
    };
  });

  const drawCursor = (a) => {
    const ang = Math.atan2(a.vy, a.vx);
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(ang + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -a.size);
    ctx.lineTo(a.size * 0.62, a.size * 0.78);
    ctx.lineTo(0, a.size * 0.38);
    ctx.lineTo(-a.size * 0.62, a.size * 0.78);
    ctx.closePath();
    ctx.fillStyle = a.color;
    ctx.globalAlpha = 0.55;
    ctx.shadowColor = a.color;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  };

  const step = () => {
    ctx.clearRect(0, 0, w, h);
    const attracted = mouse.x > 0 && mouse.y > 0;
    for (const a of agents) {
      a.wander += 0.01 + Math.random() * 0.02;
      a.vx += Math.cos(a.wander) * 0.02;
      a.vy += Math.sin(a.wander) * 0.02;
      if (attracted) {
        a.vx += (mouse.x - a.x) * a.lag * 0.08;
        a.vy += (mouse.y - a.y) * a.lag * 0.08;
      }
      const speed = Math.hypot(a.vx, a.vy) || 1;
      const max = 1.8;
      if (speed > max) {
        a.vx = (a.vx / speed) * max;
        a.vy = (a.vy / speed) * max;
      }
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < -20) a.x = w + 20;
      if (a.x > w + 20) a.x = -20;
      if (a.y < -20) a.y = h + 20;
      if (a.y > h + 20) a.y = -20;
      drawCursor(a);
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
})();
