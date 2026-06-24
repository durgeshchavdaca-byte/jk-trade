(() => {
  'use strict';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ============================================================
     IMAGE LOADING. fade in when loaded, hide if errored
     (the [data-img-bg] gradient fallback shows in either case)
     ============================================================ */
  $$('[data-img-bg] img').forEach(img => {
    img.style.opacity = '0';
    const reveal = () => { img.style.opacity = '1'; };
    if (img.complete && img.naturalWidth > 0) reveal();
    else {
      img.addEventListener('load', reveal, { once: true });
      img.addEventListener('error', () => { img.style.display = 'none'; }, { once: true });
    }
  });

  /* ============================================================
     MOBILE NAV
     ============================================================ */
  const nav = $('#nav');
  const navMenu = $('#navMenu');
  if (nav && navMenu) {
    navMenu.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navMenu.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('.nav__links a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        navMenu.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ============================================================
     SCROLL REVEAL
     ============================================================ */
  const targets = $$(
    '.sec-head > div, .sec-head > p, ' +
    '.stat, ' +
    '.prod, .app, .brand, ' +
    '.feature__row > div, ' +
    '.about__media, .about__copy > *, ' +
    '.about__pillars li, ' +
    '.reach__copy, .reach__map, ' +
    '.ccard, .cform'
  );
  targets.forEach((el, i) => {
    el.classList.add('reveal');
    if (el.matches('.stat, .prod, .app, .brand, .ccard, .about__pillars li, .feature__row > div')) {
      const within = Array.from(el.parentElement.children).indexOf(el);
      el.dataset.d = String(Math.min(4, within % 5));
    }
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.05 });
    targets.forEach(el => io.observe(el));
  } else {
    targets.forEach(el => el.classList.add('is-in'));
  }

  /* ============================================================
     SCROLL PROGRESS BAR
     ============================================================ */
  const progressBar = $('#progressBar');
  if (progressBar) {
    let ticking = false;
    const updateProgress = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const scrolled = max > 0 ? h.scrollTop / max : 0;
      progressBar.style.transform = `scaleX(${scrolled})`;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });
    updateProgress();
  }

  /* ============================================================
     STAT COUNTERS  (covers both .stat and .rs)
     ============================================================ */
  const counters = $$('[data-count]');
  const seen = new WeakSet();
  const animate = (el) => {
    if (seen.has(el)) return;
    seen.add(el);
    const target = parseInt(el.dataset.count, 10);
    if (!Number.isFinite(target)) return;
    const dur = 1500;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(target * ease(t)).toLocaleString('en-IN');
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString('en-IN');
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) animate(e.target); });
    }, { threshold: 0.4 });
    counters.forEach(c => cio.observe(c));
  } else {
    counters.forEach(animate);
  }

  /* ============================================================
     CONTACT FORM → mailto
     ============================================================ */
  const form = $('#quoteForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = (fd.get('name') || '').toString().trim();
      const phone = (fd.get('phone') || '').toString().trim();
      const msg = (fd.get('message') || '').toString().trim();
      if (!name || !phone || !msg) {
        if (!name) form.querySelector('[name="name"]').focus();
        else if (!phone) form.querySelector('[name="phone"]').focus();
        else form.querySelector('[name="message"]').focus();
        return;
      }
      const company = (fd.get('company') || '').toString().trim();
      const email   = (fd.get('email') || '').toString().trim();
      const city    = (fd.get('city') || '').toString().trim();
      const subject = `Quote request from ${name}${company ? ' / ' + company : ''}`;
      const body = [
        `Name: ${name}`,
        company ? `Company: ${company}` : null,
        `Phone: ${phone}`,
        email ? `Email: ${email}` : null,
        city ? `City / Site: ${city}` : null,
        '', 'Requirement:', msg,
        '', 'Sent from JK Trade enquiry form'
      ].filter(Boolean).join('\n');
      window.location.href = `mailto:info.jktrade@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  /* ============================================================
     3D TILT  apps + product cards
     ============================================================ */
  const tiltCards = $$('[data-tilt]');
  const isCoarse = matchMedia('(pointer: coarse)').matches;
  if (!isCoarse) {
    tiltCards.forEach(card => {
      let raf;
      const max  = 12;          // max tilt degrees (was 7)
      const lift = 14;          // px lift on hover (was 8)
      const scale = 1.02;       // subtle scale-up on hover

      const apply = (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;   // 0..1
        const y = (e.clientY - rect.top) / rect.height;
        const rx = (0.5 - y) * (max * 2);
        const ry = (x - 0.5) * (max * 2);
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform =
            `perspective(1400px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-${lift}px) scale(${scale})`;
        });
      };

      card.addEventListener('mouseenter', () => card.classList.add('is-tilting'));
      card.addEventListener('mousemove', apply);
      card.addEventListener('mouseleave', () => {
        cancelAnimationFrame(raf);
        card.classList.remove('is-tilting');
        card.style.transform = '';
      });
    });
  }

  /* ============================================================
     YEAR
     ============================================================ */
  const yEl = $('#year');
  if (yEl) yEl.textContent = String(new Date().getFullYear());

})();
