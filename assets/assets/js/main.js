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

  /* ---------- Contact form → opens the visitor's email client ---------- */
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fields = {
        name: form.elements.name,
        email: form.elements.email,
        message: form.elements.message,
      };
      let valid = true;
      Object.values(fields).forEach((input) => {
        const ok = input.value.trim() !== '' && input.checkValidity();
        input.closest('.field').classList.toggle('has-error', !ok);
        if (!ok) valid = false;
      });

      if (!valid) {
        note.textContent = 'Please fill in all fields with a valid email.';
        note.className = 'form-note is-error';
        return;
      }

      const to = form.dataset.email;
      const subject = `Project enquiry from ${fields.name.value.trim()}`;
      const body = `${fields.message.value.trim()}\n\n— ${fields.name.value.trim()}\n${fields.email.value.trim()}`;
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      note.textContent = 'Opening your email app… thanks for reaching out!';
      note.className = 'form-note is-ok';
      form.reset();
    });

    form.querySelectorAll('input, textarea').forEach((input) => {
      input.addEventListener('input', () => input.closest('.field').classList.remove('has-error'));
    });
  }

  /* ---------- Footer year ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
