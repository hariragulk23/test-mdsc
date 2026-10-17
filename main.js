/* =========================================================
   Madrid Specialty Coffee — interacciones y movimiento
   Usa GSAP + ScrollTrigger + Lenis si están disponibles.
   Si no cargan, la web funciona igual, sin animaciones.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);

  /* ---------- Año del pie ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Cabecera al hacer scroll ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menú móvil ---------- */
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      document.body.classList.toggle('nav-open', !open);
    });
    document.querySelectorAll('.site-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      });
    });
  }

  /* ---------- Vídeos ---------- */
  document.querySelectorAll('video[data-autoplay]').forEach(function (v) {
    v.muted = true;
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); return; }
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  });

  /* ---------- Simulador de tueste ---------- */
  var ROAST = [
    { at: 0,   color: '#8C9A5B', name: 'Café verde', meta: 'Grano crudo', text: 'Huele a hierba y a cereal. Todavía no se puede preparar: el tueste es lo que despierta el sabor.' },
    { at: 20,  color: '#C9A45C', name: 'Secado', meta: 'El grano amarillea', text: 'Pierde humedad y cambia de color. Aparecen aromas a pan, heno y tostada suave.' },
    { at: 38,  color: '#A0683A', name: 'Primer crack', meta: 'Aprox. 196 °C', text: 'El grano se expande y cruje. A partir de aquí ya es café y empieza el desarrollo del sabor.' },
    { at: 55,  color: '#7A4A2A', name: 'Tueste claro', meta: 'Ideal para filtro', text: 'Acidez brillante y notas florales o frutales. Es donde mejor se nota el origen.' },
    { at: 75,  color: '#5A3420', name: 'Tueste medio', meta: 'Ideal para espresso', text: 'Equilibrio entre dulzor, cuerpo y acidez. Caramelo, chocolate con leche, frutos secos.' },
    { at: 100, color: '#2E1B12', name: 'Tueste oscuro', meta: 'Aprox. 224 °C, segundo crack', text: 'Cuerpo intenso y amargor. Las notas del tueste tapan las del origen.' }
  ];
  function hex(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function mix(a, b, t) {
    var A = hex(a), B = hex(b);
    return 'rgb(' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }).join(',') + ')';
  }
  var roastInput = document.querySelector('[data-roast-input]');
  if (roastInput) {
    var bean = document.querySelectorAll('[data-roast-fill]');
    var nameEl = document.querySelector('[data-roast-name]');
    var metaEl = document.querySelector('[data-roast-meta]');
    var textEl = document.querySelector('[data-roast-text]');
    var updateRoast = function () {
      var v = Number(roastInput.value);
      var i = 0;
      while (i < ROAST.length - 2 && v > ROAST[i + 1].at) i++;
      var a = ROAST[i], b = ROAST[i + 1];
      var t = Math.min(1, Math.max(0, (v - a.at) / (b.at - a.at)));
      var c = mix(a.color, b.color, t);
      bean.forEach(function (el) { el.setAttribute('fill', c); });
      var cur = ROAST.reduce(function (best, s) { return Math.abs(s.at - v) < Math.abs(best.at - v) ? s : best; });
      nameEl.textContent = cur.name;
      metaEl.textContent = cur.meta;
      textEl.textContent = cur.text;
      roastInput.setAttribute('aria-valuetext', cur.name);
    };
    roastInput.addEventListener('input', updateRoast);
    updateRoast();
  }

  /* ---------- Calculadora de preparación ---------- */
  var METHODS = {
    v60:      { name: 'V60',            ratio: 16, time: 180, grind: 'Media-fina', temp: '92-96 °C', unit: 'agua', filter: true },
    chemex:   { name: 'Chemex',         ratio: 15, time: 240, grind: 'Media-gruesa', temp: '92-96 °C', unit: 'agua', filter: true },
    aeropress:{ name: 'AeroPress',      ratio: 14, time: 120, grind: 'Media', temp: '85-92 °C', unit: 'agua', filter: true },
    prensa:   { name: 'Prensa francesa',ratio: 15, time: 240, grind: 'Gruesa', temp: '93-96 °C', unit: 'agua', filter: false },
    espresso: { name: 'Espresso',       ratio: 2,  time: 28,  grind: 'Fina', temp: '90-94 °C', unit: 'bebida', filter: false }
  };
  var brew = document.querySelector('[data-brew]');
  if (brew) {
    var current = 'v60';
    var dose = brew.querySelector('[data-brew-dose]');
    var doseOut = brew.querySelector('[data-brew-dose-out]');
    var out = {
      water: brew.querySelector('[data-out-water]'),
      waterLabel: brew.querySelector('[data-out-water-label]'),
      ratio: brew.querySelector('[data-out-ratio]'),
      time: brew.querySelector('[data-out-time]'),
      grind: brew.querySelector('[data-out-grind]'),
      temp: brew.querySelector('[data-out-temp]')
    };
    var clock = brew.querySelector('[data-timer-clock]');
    var step = brew.querySelector('[data-timer-step]');
    var startBtn = brew.querySelector('[data-timer-start]');
    var resetBtn = brew.querySelector('[data-timer-reset]');
    var timerId = null, seconds = 0;

    var fmt = function (s) { var m = Math.floor(s / 60), r = s % 60; return m + ':' + (r < 10 ? '0' : '') + r; };
    var calc = function () {
      var m = METHODS[current];
      var g = Number(dose.value);
      doseOut.textContent = g + ' g';
      out.water.textContent = Math.round(g * m.ratio) + (m.unit === 'agua' ? ' ml' : ' g');
      out.waterLabel.textContent = m.unit === 'agua' ? 'Agua' : 'Bebida en taza';
      out.ratio.textContent = '1:' + m.ratio;
      out.time.textContent = fmt(m.time);
      out.grind.textContent = m.grind;
      out.temp.textContent = m.temp;
    };
    var stepText = function () {
      var m = METHODS[current];
      var g = Number(dose.value);
      var total = Math.round(g * m.ratio);
      if (current === 'espresso') return seconds < m.time ? 'Extrayendo. Busca un chorro fino, como miel caliente.' : 'Listo. Prueba y ajusta la molienda si sabe ácido o amargo.';
      if (m.filter && seconds < 40) return 'Bloom: vierte ' + (g * 2) + ' ml y espera a que el café respire.';
      if (seconds < m.time - 30) return 'Vierte en círculos lentos hasta llegar a ' + total + ' ml.';
      if (seconds < m.time) return 'Deja que termine de filtrar.';
      return 'Listo. Sirve y disfruta.';
    };
    var stopTimer = function () { clearInterval(timerId); timerId = null; startBtn.textContent = 'Empezar'; };
    var resetTimer = function () { stopTimer(); seconds = 0; clock.textContent = '0:00'; step.textContent = 'Pulsa empezar cuando eches el primer agua.'; };

    brew.querySelectorAll('[data-method]').forEach(function (b) {
      b.addEventListener('click', function () {
        current = b.getAttribute('data-method');
        brew.querySelectorAll('[data-method]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        if (current === 'espresso' && Number(dose.value) > 22) dose.value = 18;
        calc(); resetTimer();
      });
    });
    dose.addEventListener('input', calc);
    startBtn.addEventListener('click', function () {
      if (timerId) { stopTimer(); return; }
      startBtn.textContent = 'Pausar';
      step.textContent = stepText();
      timerId = setInterval(function () {
        seconds++;
        clock.textContent = fmt(seconds);
        step.textContent = stepText();
        if (seconds >= METHODS[current].time + 30) stopTimer();
      }, 1000);
    });
    resetBtn.addEventListener('click', resetTimer);
    calc(); resetTimer();
  }

  /* ---------- Barrios: resaltar en la brújula ---------- */
  var barrioBtns = document.querySelectorAll('[data-barrio]');
  if (barrioBtns.length) {
    var setBarrio = function (id) {
      document.querySelectorAll('[data-ray]').forEach(function (g) { g.classList.toggle('is-on', g.getAttribute('data-ray') === id); });
      document.querySelectorAll('[data-label]').forEach(function (l) { l.classList.toggle('is-on', l.getAttribute('data-label') === id); });
      barrioBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-barrio') === id)); });
    };
    barrioBtns.forEach(function (b) {
      var id = b.getAttribute('data-barrio');
      b.addEventListener('mouseenter', function () { setBarrio(id); });
      b.addEventListener('focus', function () { setBarrio(id); });
      b.addEventListener('click', function () { setBarrio(id); });
    });
  }

  /* ---------- Servicios: imagen fija que cambia ---------- */
  var stickyImgs = document.querySelectorAll('.svc-sticky img');
  var stickyCap = document.querySelector('.svc-sticky figcaption');
  var svcItems = document.querySelectorAll('.svc-item');
  function setService(i) {
    stickyImgs.forEach(function (img, k) { img.classList.toggle('is-active', k === i); });
    if (stickyCap && svcItems[i]) stickyCap.textContent = svcItems[i].getAttribute('data-title');
  }
  if (stickyImgs.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) setService(Array.prototype.indexOf.call(svcItems, e.target));
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    svcItems.forEach(function (el) { io.observe(el); });
    setService(0);
  }

  /* ---------- Formulario: servicio preseleccionado por URL ---------- */
  var select = document.querySelector('select[name="servicio"]');
  if (select) {
    var q = new URLSearchParams(window.location.search).get('servicio');
    if (q) Array.prototype.forEach.call(select.options, function (o) { if (o.value === q) select.value = q; });
  }

  /* ---------- Transición entre páginas ---------- */
  var pt = document.querySelector('.pt');
  function isInternal(a) {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|https?:)/i.test(href) && a.host !== window.location.host) return false;
    if (a.pathname === window.location.pathname && a.hash) return false;
    return a.host === window.location.host;
  }
  if (pt && !reduce) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || !isInternal(a)) return;
      e.preventDefault();
      try { sessionStorage.setItem('pt', '1'); } catch (err) {}
      if (hasGSAP) {
        pt.classList.add('is-active');
        gsap.fromTo(pt, { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: 'power3.inOut', onComplete: function () { window.location.href = a.href; } });
      } else {
        window.location.href = a.href;
      }
    });
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) { root.classList.remove('pt-in'); pt.classList.remove('is-active'); if (hasGSAP) gsap.set(pt, { yPercent: 100 }); }
    });
  }
  function revealPage() {
    if (!root.classList.contains('pt-in')) return;
    if (hasGSAP) {
      pt.classList.add('is-active');
      gsap.set(pt, { yPercent: 0 });
      root.classList.remove('pt-in');
      gsap.to(pt, { yPercent: -100, duration: 0.7, ease: 'power3.inOut', delay: 0.05, onComplete: function () { gsap.set(pt, { yPercent: 100 }); pt.classList.remove('is-active'); } });
    } else {
      root.classList.remove('pt-in');
    }
  }

  /* ---------- Sin movimiento: terminar aquí ---------- */
  if (!hasGSAP || reduce) {
    root.classList.add('no-motion');
    revealPage();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Scroll suave ---------- */
  if (window.Lenis) {
    var lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -90 });
      });
    });
  }

  /* ---------- Dividir titulares en palabras ---------- */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    if (el.dataset.splitDone) return;
    el.setAttribute('aria-label', el.textContent.trim());
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true"><span class="wi">' + w + '</span></span>'; }).join(' ');
    el.dataset.splitDone = '1';
  });

  revealPage();

  /* ---------- Entrada del inicio ---------- */
  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.2 });
    tl.from(hero.querySelectorAll('[data-split] .wi'), { yPercent: 110, duration: 1.1, stagger: 0.06 })
      .from(hero.querySelectorAll('[data-fade]'), { opacity: 0, y: 24, duration: 0.9, stagger: 0.1 }, '-=0.7');
    var compass = hero.querySelector('.compass');
    if (compass) {
      tl.from(compass.querySelectorAll('.compass-ring'), { opacity: 0, scale: 0.85, transformOrigin: '50% 50%', duration: 1.2, stagger: 0.1 }, 0.2)
        .from(compass.querySelector('.compass-center'), { opacity: 0, scale: 0.6, duration: 0.9, ease: 'back.out(1.6)' }, 0.5)
        .from(compass.querySelectorAll('.compass-ray'), { strokeDashoffset: 40, duration: 1.1, stagger: 0.07, ease: 'power2.inOut' }, 0.8)
        .from(compass.querySelectorAll('.compass-dot'), { scale: 0, transformOrigin: '50% 50%', duration: 0.5, stagger: 0.07, ease: 'back.out(3)' }, 1.3)
        .from(compass.querySelectorAll('.compass-label'), { opacity: 0, y: 6, duration: 0.5, stagger: 0.07 }, 1.4);
    }
  }

  /* ---------- Titulares que aparecen al llegar ---------- */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    if (el.closest('[data-hero]')) return;
    gsap.from(el.querySelectorAll('.wi'), {
      yPercent: 110, duration: 1, stagger: 0.05, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  });

  /* ---------- Imágenes que se descubren ---------- */
  document.querySelectorAll('[data-reveal-img]').forEach(function (el) {
    var img = el.querySelector('img');
    gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
    if (img) gsap.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });

  /* ---------- Película con scroll ---------- */
  var film = document.querySelector('[data-film]');
  if (film) {
    var frame = film.querySelector('.film-frame');
    var video = film.querySelector('video');
    var copy = film.querySelector('.film-copy');
    var ftl = gsap.timeline({
      scrollTrigger: { trigger: film, start: 'top top', end: '+=140%', scrub: 0.6, pin: film.querySelector('.film-pin'), anticipatePin: 1 }
    });
    ftl.fromTo(frame, { clipPath: 'inset(16% 20% 16% 20% round 18px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', duration: 1 })
       .fromTo(video, { scale: 1.25 }, { scale: 1, ease: 'none', duration: 1 }, 0)
       .fromTo(copy, { opacity: 0, y: 60 }, { opacity: 1, y: 0, ease: 'none', duration: 0.4 }, 0.6);
  }

  /* ---------- Línea de metro ---------- */
  document.querySelectorAll('[data-metro]').forEach(function (metro) {
    var stops = metro.querySelectorAll('.metro-stop');
    ScrollTrigger.create({
      trigger: metro, start: 'top 75%', end: 'bottom 45%', scrub: true,
      onUpdate: function (self) {
        var p = self.progress;
        metro.style.setProperty('--p', p.toFixed(4));
        stops.forEach(function (s, i) { s.classList.toggle('is-passed', p >= i / (stops.length - 1) - 0.02); });
      }
    });
  });

  /* ---------- Parallax suave en cabeceras con imagen ---------- */
  document.querySelectorAll('.page-hero--media .bg img').forEach(function (img) {
    gsap.to(img, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: img.closest('.page-hero--media'), start: 'top top', end: 'bottom top', scrub: true } });
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
