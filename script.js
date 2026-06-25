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
     UNIFIED SCROLL HANDLER
     drives: progress bar, hero parallax + fade, cube rotation,
             section indicator, all from one rAF loop
     ============================================================ */
  const progressBar = $('#progressBar');
  const navBar      = $('#scrollNavBar');
  const navNum      = $('#scrollNavNum');
  const navName     = $('#scrollNavName');
  const navTotal    = $('#scrollNavTotal');
  const scrollNav   = $('#scrollNav');
  const heroEl      = $('.hero');
  const heroMedia   = $('.hero__media');
  const heroContent = $('.hero__content');
  const cubeEl      = $('.cube');
  const featureMedia = $('.feature__media');

  // Sections with IDs to track in the side indicator
  const sectionLabels = {
    'top': 'Hero',
    'products': 'Products',
    'applications': 'Applications',
    'brands': 'Brand Partners',
    'about': 'Founder',
    'reach': 'Reach',
    'contact': 'Contact'
  };
  const trackedSections = Array.from(document.querySelectorAll('section[id]'))
    .filter(s => sectionLabels[s.id]);

  if (navTotal) {
    navTotal.textContent = String(trackedSections.length).padStart(2, '0');
  }

  let scrollTicking = false;
  let lastNavIdx = -1;

  const onScroll = () => {
    const h = document.documentElement;
    const y = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    const ratio = max > 0 ? y / max : 0;

    /* progress bar */
    if (progressBar) {
      progressBar.style.transform = `scaleX(${ratio})`;
    }

    /* hero parallax + fade */
    if (heroEl && y < heroEl.offsetHeight + 200) {
      const heroRatio = Math.min(1, y / (heroEl.offsetHeight * 0.9));
      if (heroMedia) {
        heroMedia.style.transform = `translateY(${y * 0.35}px)`;
      }
      if (heroContent) {
        heroContent.style.transform = `translateY(${y * -0.15}px)`;
        heroContent.style.opacity = String(Math.max(0, 1 - heroRatio * 1.4));
      }
    }

    /* featured project parallax */
    if (featureMedia) {
      const rect = featureMedia.parentElement.getBoundingClientRect();
      if (rect.top < innerHeight && rect.bottom > 0) {
        const offset = (rect.top - innerHeight) * -0.2;
        featureMedia.style.transform = `translateY(${offset}px)`;
      }
    }

    /* cube rotation tied to scroll */
    if (cubeEl) {
      const rotY = y * 0.35;
      const rotX = -15 + Math.sin(y * 0.005) * 4;
      cubeEl.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;
    }

    /* side scroll indicator */
    if (scrollNav && trackedSections.length) {
      const probeY = y + innerHeight * 0.35;
      let curIdx = 0;
      for (let i = 0; i < trackedSections.length; i++) {
        if (trackedSections[i].offsetTop <= probeY) curIdx = i;
      }

      if (curIdx !== lastNavIdx) {
        lastNavIdx = curIdx;
        if (navNum)  navNum.textContent  = String(curIdx + 1).padStart(2, '0');
        if (navName) navName.textContent = sectionLabels[trackedSections[curIdx].id];
      }

      const sec = trackedSections[curIdx];
      const next = trackedSections[curIdx + 1];
      const secStart = sec.offsetTop;
      const secEnd = next ? next.offsetTop : max + innerHeight;
      const secRatio = Math.min(1, Math.max(0, (probeY - secStart) / (secEnd - secStart)));
      if (navBar) navBar.style.transform = `scaleX(${secRatio})`;

      /* show after scrolling past hero */
      const showThreshold = (heroEl ? heroEl.offsetHeight * 0.6 : 400);
      if (y > showThreshold) scrollNav.classList.add('is-visible');
      else scrollNav.classList.remove('is-visible');
    }

    scrollTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(onScroll);
      scrollTicking = true;
    }
  }, { passive: true });
  onScroll();

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
