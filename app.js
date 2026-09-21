(function () {
  'use strict';

  /* ==========================================================================
     ★ CONFIGURAÇÃO — É AQUI QUE VOCÊ ADICIONA PROJETOS ★
     --------------------------------------------------------------------------
     Para publicar um projeto, basta adicionar um objeto na lista abaixo.
     Não é preciso mexer em mais nada: o card, o hover, o efeito de máscara
     na imagem e a seta são gerados automaticamente. Quantos você quiser.

       {
         title:       "Nome do projeto",
         category:    "Website",                      // ex.: Landing Page, Sistema Web, SaaS
         image:       "assets/nome-do-projeto.jpg",   // caminho ou URL da imagem
         description: "Uma frase curta sobre o projeto.",
         url:         "https://link-do-projeto.com"   // opcional: sem url o card não é clicável
       }
     ========================================================================== */
  var PROJECTS = [
    // { title: "", category: "", image: "", description: "", url: "" },
  ];

  /* Comportamento dos cards vazios ("Seu próximo projeto aqui"):
       mode: 'fill'   → completa a grade até "min" cards (padrão).
                        Ex.: com 2 projetos e min 4, sobram 2 cards vazios.
             'append' → mantém sempre 1 card vazio depois dos seus projetos.
             'never'  → some assim que existir ao menos 1 projeto.
     Sem nenhum projeto cadastrado, os cards vazios sempre aparecem.        */
  var PLACEHOLDERS = { mode: 'fill', min: 4 };

  /* ========================================================================== */

  var root = document.documentElement;
  function guard(fn) { try { fn(); } catch (e) { if (window.console && console.warn) console.warn('[zion]', e); } }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var light = !fine || window.innerWidth < 700; // modo leve: celulares e telas pequenas

  var S = { sy: 0, vh: window.innerHeight, vw: window.innerWidth, tx: 0, ty: 0, mx: 0, my: 0, cx: 0, cy: 0, px: 0, py: 0, vel: 0, speed: 0, last: 0 };

  /* ---------- Texto dividido em palavras / letras (máscara) ---------- */
  function splitText(el, mode) {
    var full = el.textContent.replace(/\s+/g, ' ').trim();
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var txt = ch.textContent;
          if (!txt.trim()) return;
          var frag = document.createDocumentFragment();
          if (mode === 'chars') {
            Array.from(txt.trim()).forEach(function (chr) {
              var s = document.createElement('span');
              s.className = 'c'; s.style.setProperty('--i', i++); s.setAttribute('aria-hidden', 'true'); s.textContent = chr;
              frag.appendChild(s);
            });
          } else {
            txt.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
              var wi = document.createElement('span'); wi.className = 'wi'; wi.style.setProperty('--i', i++); wi.textContent = part;
              w.appendChild(wi); frag.appendChild(w);
            });
          }
          ch.parentNode.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') {
          walk(ch);
        }
      });
    })(el);
    el.classList.add('split');
    if (mode === 'chars') el.classList.add('split--chars');
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = full;
    el.appendChild(sr);
  }

  /* ---------- Projetos (Selected Work) ---------- */
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-up-right"/></svg>';

  function safeUrl(u) {
    if (!u) return null;
    try {
      var url = new URL(u, window.location.href);
      return /^https?:$/.test(url.protocol) ? url.href : null;
    } catch (e) { return null; }
  }

  function cellShell(i) {
    var cell = document.createElement('div');
    cell.className = 'cell';
    cell.setAttribute('data-reveal', '');
    cell.style.setProperty('--i', i % 4);
    if (!light && i % 2 === 1) cell.setAttribute('data-parallax', '0.045');
    return cell;
  }

  function projectCell(p, i) {
    var url = safeUrl(p.url);
    var cell = cellShell(i);
    var card = document.createElement(url ? 'a' : 'article');
    card.className = 'card work';
    card.setAttribute('data-tilt', '');
    if (url) {
      card.href = url; card.target = '_blank'; card.rel = 'noopener noreferrer';
      card.setAttribute('data-cursor', 'Ver');
      card.setAttribute('aria-label', p.title + ' — abrir projeto');
    }
    var media = document.createElement('div'); media.className = 'work__media';
    if (p.image) {
      var img = document.createElement('img');
      img.src = p.image; img.alt = p.title; img.loading = 'lazy'; img.decoding = 'async';
      media.appendChild(img);
    } else {
      var fb = document.createElement('div'); fb.className = 'work__fallback'; media.appendChild(fb);
    }
    var meta = document.createElement('div'); meta.className = 'work__meta';
    if (p.category) { var c = document.createElement('span'); c.className = 'work__cat'; c.textContent = p.category; meta.appendChild(c); }
    var h = document.createElement('h3'); h.className = 'work__title'; h.textContent = p.title; meta.appendChild(h);
    if (p.description) { var d = document.createElement('p'); d.className = 'work__desc'; d.textContent = p.description; meta.appendChild(d); }
    card.appendChild(media); card.appendChild(meta);
    if (url) { var ar = document.createElement('span'); ar.className = 'arrow-btn'; ar.setAttribute('aria-hidden', 'true'); ar.innerHTML = ARROW; card.appendChild(ar); }
    cell.appendChild(card);
    return cell;
  }

  function emptyCell(i) {
    var cell = cellShell(i);
    var card = document.createElement('a');
    card.className = 'card work work--empty';
    card.href = '#contact';
    card.setAttribute('data-tilt', '');
    card.setAttribute('data-cursor', 'Iniciar');
    card.innerHTML =
      '<span class="work__pattern" aria-hidden="true"></span>' +
      '<span class="plus" aria-hidden="true"></span>' +
      '<span class="work__meta"><span class="work__cat">Em breve</span><span class="work__title">Seu próximo<br>projeto aqui</span></span>' +
      '<span class="arrow-btn" aria-hidden="true">' + ARROW + '</span>';
    cell.appendChild(card);
    return cell;
  }

  function renderWork() {
    var grid = $('#work-grid');
    if (!grid) return;
    var list = (Array.isArray(PROJECTS) ? PROJECTS : []).filter(function (p) { return p && p.title; });
    var min = (PLACEHOLDERS && +PLACEHOLDERS.min) || 4;
    var mode = PLACEHOLDERS && PLACEHOLDERS.mode;
    var empties = 0;
    if (!list.length) empties = min;
    else if (mode === 'fill') empties = Math.max(0, min - list.length);
    else if (mode === 'append') empties = 1;
    var frag = document.createDocumentFragment();
    var n = 0;
    list.forEach(function (p) { frag.appendChild(projectCell(p, n++)); });
    for (var k = 0; k < empties; k++) frag.appendChild(emptyCell(n++));
    while (grid.firstChild) grid.removeChild(grid.firstChild);
    grid.appendChild(frag);
  }

  /* ---------- O "Z" 3D em camadas (CSS puro, sem WebGL) ---------- */
  var PTS = '0,0 400,0 400,88 120,432 400,432 400,520 0,520 0,432 280,88 0,88';
  var zid = 0;
  var zs = [];

  function buildZ(el, layers) {
    var id = ++zid, html = '';
    for (var k = layers - 1; k >= 0; k--) {
      var f = layers > 1 ? k / (layers - 1) : 0; // 0 = frente, 1 = fundo
      var l1 = 13 - f * 11;
      var z = (-(0.012 + f * 0.98)).toFixed(3);
      html += '<i class="z3d__l" style="background:linear-gradient(150deg,hsl(268 72% ' + (l1 + 7).toFixed(1) + '%),hsl(258 70% ' + Math.max(l1 - 9, 2).toFixed(1) + '%));transform:translateZ(calc(var(--zd) * ' + z + '))"></i>';
    }
    var outline = function (depth, op, sw, scale) {
      return '<svg class="z3d__svg" viewBox="0 0 400 520" aria-hidden="true" style="transform:translateZ(calc(var(--zd) * ' + depth + '))"><g transform="translate(200 260) scale(' + scale + ') translate(-200 -260)"><polygon points="' + PTS + '" fill="none" stroke="#a78bfa" stroke-opacity="' + op + '" stroke-width="' + sw + '" stroke-linejoin="round"/></g></svg>';
    };
    html += outline(-1, .75, 1.8, 1);
    html += outline(-0.5, .22, 1, .93);
    html +=
      '<svg class="z3d__svg z3d__front" viewBox="0 0 400 520" aria-hidden="true" style="transform:translateZ(2px)">' +
      '<defs>' +
      '<linearGradient id="zf' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8ccff" stop-opacity=".26"/><stop offset=".5" stop-color="#5b21b6" stop-opacity=".07"/><stop offset="1" stop-color="#a78bfa" stop-opacity=".2"/></linearGradient>' +
      '<linearGradient id="zs' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3efff"/><stop offset=".5" stop-color="#8b5cf6"/><stop offset="1" stop-color="#c4b5fd"/></linearGradient>' +
      '<linearGradient id="zk' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      '<polygon points="' + PTS + '" fill="url(#zf' + id + ')"/>' +
      '<polygon points="' + PTS + '" fill="none" stroke="url(#zs' + id + ')" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<g transform="translate(200 260) scale(.925) translate(-200 -260)"><polygon points="' + PTS + '" fill="none" stroke="#c4b5fd" stroke-opacity=".3" stroke-width="1" stroke-linejoin="round"/></g>' +
      '<polygon points="320,88 352,88 72,432 40,432" fill="url(#zk' + id + ')" opacity=".55"/>' +
      '<rect x="16" y="12" width="368" height="2.2" fill="#fff" opacity=".4"/>' +
      '<rect x="16" y="506" width="368" height="1.6" fill="#fff" opacity=".14"/>' +
      '</svg>' +
      '<i class="z3d__sheen" style="transform:translateZ(3px)"></i>';

    var glow = document.createElement('div'); glow.className = 'z3d__glow';
    var stage = document.createElement('div'); stage.className = 'z3d__stage';
    var rig = document.createElement('div'); rig.className = 'z3d__rig';
    rig.innerHTML = html;
    stage.appendChild(rig);
    el.appendChild(glow); el.appendChild(stage);
    return { el: el, rig: rig, kind: el.getAttribute('data-z'), visible: true };
  }

  function initZ() {
    $$('[data-z]').forEach(function (el) {
      var n = parseInt(el.getAttribute('data-layers'), 10) || 12;
      if (light) n = Math.min(n, 8);
      zs.push(buildZ(el, n));
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          zs.forEach(function (z) { if (z.el === e.target) z.visible = e.isIntersecting; });
        });
      }, { rootMargin: '150px' });
      zs.forEach(function (z) { io.observe(z.el); });
    }
  }

  function updateZ(z, t, rect) {
    var rx, ry, ty = 0;
    var m = fine ? 1 : 0;
    var auto = reduced ? 0 : 1;
    var prog = (S.vh / 2 - (rect.top + rect.height / 2)) / S.vh; // -1..1 aproximado
    if (z.kind === 'hero') {
      ry = -21 + S.sy * 0.022 + S.mx * 10 * m + Math.sin(t * 0.00022) * 9 * auto;
      rx = 5 - S.my * 6 * m + Math.cos(t * 0.00018) * 2.5 * auto;
      ty = S.sy * 0.14;
    } else if (z.kind === 'about') {
      ry = -32 + prog * 46 + S.mx * 7 * m + Math.sin(t * 0.0002) * 7 * auto;
      rx = 6 - S.my * 5 * m + Math.cos(t * 0.00017) * 2 * auto;
    } else {
      ry = -34 + prog * 30 + S.mx * 6 * m + Math.sin(t * 0.00018) * 6 * auto;
      rx = 5 - S.my * 4 * m + Math.cos(t * 0.00015) * 2 * auto;
    }
    z.rig.style.transform = 'translate3d(0,' + ty.toFixed(1) + 'px,0) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    var st = z.el.style;
    st.setProperty('--sx', (38 + S.mx * 26 - ry * 0.4).toFixed(1) + '%');
    st.setProperty('--sy', (26 + S.my * 22 + rx * 0.6).toFixed(1) + '%');
    st.setProperty('--gx', (-S.mx * 30).toFixed(1));
    st.setProperty('--gy', (-S.my * 22).toFixed(1));
  }

  /* ---------- Partículas discretas (1 canvas leve) ---------- */
  var fx = null;
  function initParticles() {
    if (reduced) return;
    var cv = $('#fx');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d');
    var N = light ? 18 : 44, w = 0, h = 0, P = [];
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener('resize', size, { passive: true });
    for (var i = 0; i < N; i++) {
      P.push({ x: Math.random(), y: Math.random(), z: 0.2 + Math.random() * 0.8, vx: (Math.random() - 0.5) * 0.00003, vy: -(0.00002 + Math.random() * 0.00005), tw: Math.random() * 6.28 });
    }
    fx = function (t, dt) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < N; i++) {
        var p = P[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        if (p.x < -0.02) p.x = 1.02; else if (p.x > 1.02) p.x = -0.02;
        var x = p.x * w + S.mx * p.z * 26;
        var y = ((p.y * h - S.sy * 0.14 * p.z + S.my * p.z * 16) % h + h) % h;
        var a = (0.12 + 0.55 * p.z) * (0.65 + 0.35 * Math.sin(t * 0.0012 + p.tw));
        ctx.beginPath();
        ctx.fillStyle = 'rgba(196,181,253,' + a.toFixed(3) + ')';
        ctx.arc(x, y, 0.5 + p.z * 1.3, 0, 6.2832);
        ctx.fill();
      }
    };
  }

  /* ---------- Scroll suave (sem biblioteca) ---------- */
  var smooth = { on: false, target: 0, current: 0 };
  function maxScroll() { return Math.max(0, document.documentElement.scrollHeight - window.innerHeight); }
  function locked() { return root.classList.contains('is-loading') || root.classList.contains('menu-open'); }

  function initSmooth() {
    if (reduced || !fine) return;
    smooth.on = true;
    smooth.target = smooth.current = window.scrollY;
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.defaultPrevented || locked()) return;
      e.preventDefault();
      var dy = e.deltaMode === 1 ? e.deltaY * 34 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      smooth.target = clamp(smooth.target + dy, 0, maxScroll());
    }, { passive: false });
    window.addEventListener('scroll', function () {
      if (Math.abs(window.scrollY - smooth.current) > 3) { smooth.target = smooth.current = window.scrollY; }
    }, { passive: true });
  }

  function scrollToY(y) {
    y = clamp(y, 0, maxScroll());
    if (smooth.on) smooth.target = y;
    else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ---------- Parallax por scroll ---------- */
  var par = [];
  function measurePar() {
    par.forEach(function (p) {
      var r = p.el.getBoundingClientRect();
      p.top = r.top + window.scrollY - p.ty;
      p.h = r.height;
    });
  }
  function initParallax() {
    if (reduced || light) return;
    $$('[data-parallax]').forEach(function (el) {
      par.push({ el: el, k: parseFloat(el.getAttribute('data-parallax')) || 0, ty: 0, top: 0, h: 0, visible: true });
    });
    measurePar();
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { par.forEach(function (p) { if (p.el === e.target) p.visible = e.isIntersecting; }); });
      }, { rootMargin: '200px' });
      par.forEach(function (p) { io.observe(p.el); });
    }
  }

  /* ---------- Reveal ao rolar ---------- */
  function initReveal() {
    $$('[data-stagger]').forEach(function (g) {
      var n = parseInt(g.getAttribute('data-stagger'), 10) || 3;
      Array.prototype.slice.call(g.children).forEach(function (c, i) { c.style.setProperty('--i', i % n); });
    });
    var targets = $$('[data-reveal],[data-clip],[data-line],[data-split]:not([data-hero])');
    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach(function (t) { t.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -9% 0px', threshold: 0.08 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- Process: linha que acompanha o scroll ---------- */
  var steps = null, stepEls = [], lastP = -1;
  function initSteps() {
    steps = $('#steps');
    if (!steps) return;
    stepEls = $$('.step', steps);
    if (reduced) setSteps(1);
  }
  function setSteps(p) {
    lastP = p;
    steps.style.setProperty('--p', p.toFixed(4));
    stepEls.forEach(function (s, i) { s.classList.toggle('on', p >= i / 4 + 0.004); });
  }
  function updateSteps(r) {
    var p = clamp((S.vh * 0.82 - r.top) / (r.height + S.vh * 0.12), 0, 1);
    if (Math.abs(p - lastP) > 0.0006) setSteps(p);
  }

  /* ---------- Cursor, magnetic, tilt ---------- */
  var cur = null;
  function initCursor() {
    if (!fine || reduced) return;
    root.classList.add('has-cursor');
    var ring = document.createElement('div'); ring.className = 'cursor';
    var dot = document.createElement('div'); dot.className = 'cursor-dot';
    document.body.appendChild(ring); document.body.appendChild(dot);
    cur = { ring: ring, dot: dot, x: -100, y: -100, rx: -100, ry: -100 };
    window.addEventListener('pointermove', function (e) {
      cur.x = e.clientX; cur.y = e.clientY;
      dot.style.transform = 'translate3d(' + cur.x + 'px,' + cur.y + 'px,0)';
      root.classList.add('cursor-on');
    }, { passive: true });
    document.addEventListener('mouseleave', function () { root.classList.remove('cursor-on'); });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest && e.target.closest('a,button,[data-cursor]');
      if (t) { ring.classList.add('is-link'); ring.textContent = t.getAttribute('data-cursor') || ''; }
    });
    document.addEventListener('pointerout', function (e) {
      var t = e.target.closest && e.target.closest('a,button,[data-cursor]');
      if (t && !t.contains(e.relatedTarget)) { ring.classList.remove('is-link'); ring.textContent = ''; }
    });
  }

  var mags = [];
  function initMagnetic() {
    if (!fine || reduced) return;
    $$('[data-magnetic]').forEach(function (el) {
      var m = { el: el, inner: el.querySelector('.btn__in'), x: 0, y: 0, tx: 0, ty: 0, r: null };
      el.addEventListener('pointerenter', function () { m.r = el.getBoundingClientRect(); });
      el.addEventListener('pointermove', function (e) {
        if (!m.r) m.r = el.getBoundingClientRect();
        m.tx = (e.clientX - (m.r.left + m.r.width / 2)) * 0.26;
        m.ty = (e.clientY - (m.r.top + m.r.height / 2)) * 0.38;
      });
      el.addEventListener('pointerleave', function () { m.tx = m.ty = 0; m.r = null; });
      mags.push(m);
    });
  }
  function updateMagnetic() {
    for (var i = 0; i < mags.length; i++) {
      var m = mags[i];
      if (Math.abs(m.x - m.tx) < 0.05 && Math.abs(m.y - m.ty) < 0.05 && m.x === m.tx) continue;
      m.x = lerp(m.x, m.tx, 0.16); m.y = lerp(m.y, m.ty, 0.16);
      if (Math.abs(m.x - m.tx) < 0.05) m.x = m.tx;
      if (Math.abs(m.y - m.ty) < 0.05) m.y = m.ty;
      m.el.style.translate = m.x.toFixed(2) + 'px ' + m.y.toFixed(2) + 'px';
      if (m.inner) m.inner.style.translate = (m.x * 0.35).toFixed(2) + 'px ' + (m.y * 0.35).toFixed(2) + 'px';
    }
  }

  function initCards() {
    if (!fine) return;
    document.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('.card,.tile');
      if (!c) return;
      var r = c.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      c.style.setProperty('--mx', x + 'px');
      c.style.setProperty('--my', y + 'px');
      if (!reduced && c.hasAttribute('data-tilt')) {
        c.style.transform = 'rotateX(' + (((y / r.height) - 0.5) * -5).toFixed(2) + 'deg) rotateY(' + (((x / r.width) - 0.5) * 7).toFixed(2) + 'deg)';
      }
    }, { passive: true });
    document.addEventListener('pointerout', function (e) {
      var c = e.target.closest && e.target.closest('[data-tilt]');
      if (c && !c.contains(e.relatedTarget)) c.style.transform = '';
    });
  }

  /* ---------- Navegação, menu mobile, âncoras ---------- */
  var nav = null, menuOpen = false, lastNavY = 0;
  function setMenu(open) {
    menuOpen = open;
    root.classList.toggle('menu-open', open);
    var b = $('#burger'), m = $('#menu');
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    b.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    m.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) nav.classList.remove('is-hidden');
  }
  function initNav() {
    nav = $('#nav');
    $('#burger').addEventListener('click', function () { setMenu(!menuOpen); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1000 && menuOpen) setMenu(false); }, { passive: true });

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      if (menuOpen) setMenu(false);
      scrollToY(id === '#top' ? 0 : t.getBoundingClientRect().top + window.scrollY);
    });

    if ('IntersectionObserver' in window) {
      var links = $$('.nav__links a');
      var map = { work: 'work', services: 'services', process: 'services', about: 'about', technologies: 'about', contact: 'contact' };
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var key = map[e.target.id];
          links.forEach(function (l) {
            if (l.getAttribute('href') === '#' + key) l.setAttribute('aria-current', 'true');
            else l.removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $$('#work,#services,#process,#about,#technologies,#contact').forEach(function (s) { io.observe(s); });
    }
  }
  function updateNav(sy) {
    nav.classList.toggle('is-solid', sy > 30);
    var d = sy - lastNavY;
    if (Math.abs(d) > 6) {
      if (!menuOpen) nav.classList.toggle('is-hidden', d > 0 && sy > 160);
      lastNavY = sy;
    }
  }

  /* ---------- Loop principal (1 único requestAnimationFrame) ---------- */
  var heroEl = null, heroMouse = [];
  function frame(now) {
    window.requestAnimationFrame(frame);
    try { step(now); } catch (e) {}
  }
  function step(now) {
    var dt = Math.min(64, now - (S.last || now)); S.last = now;

    if (smooth.on) {
      var d = smooth.target - smooth.current;
      if (Math.abs(d) > 0.1) {
        /* interpolação por tempo (não por frame): converge igual em qualquer taxa de quadros */
        smooth.current += d * (1 - Math.pow(0.915, Math.min(dt, 100) / 16.67));
        window.scrollTo(0, smooth.current);
      }
    }
    var sy = window.scrollY || 0; S.sy = sy;

    /* ponteiro suavizado */
    S.mx = lerp(S.mx, S.tx, 0.06); S.my = lerp(S.my, S.ty, 0.06);
    S.cx = lerp(S.cx, S.px, 0.1); S.cy = lerp(S.cy, S.py, 0.1);
    S.speed = lerp(S.speed, S.vel, 0.12); S.vel *= 0.88;

    /* leituras primeiro */
    var rects = [];
    for (var i = 0; i < zs.length; i++) rects[i] = zs[i].visible ? zs[i].el.getBoundingClientRect() : null;
    var rSteps = steps ? steps.getBoundingClientRect() : null;

    /* escritas */
    for (var j = 0; j < zs.length; j++) if (rects[j]) updateZ(zs[j], now, rects[j]);
    if (rSteps && rSteps.bottom > -200 && rSteps.top < S.vh + 200 && !reduced) updateSteps(rSteps);

    if (heroEl && sy < S.vh * 1.2) {
      heroEl.style.setProperty('--lx', S.cx.toFixed(0) + 'px');
      heroEl.style.setProperty('--ly', (S.cy + sy).toFixed(0) + 'px');
      heroEl.style.setProperty('--speed', S.speed.toFixed(3));
      if (!reduced && fine) {
        heroMouse.forEach(function (el) {
          var k = parseFloat(el.getAttribute('data-mouse')) || 0;
          el.style.translate = (S.mx * k).toFixed(2) + 'px ' + (S.my * k * 0.7 - sy * 0.04).toFixed(2) + 'px';
        });
      }
    }

    for (var q = 0; q < par.length; q++) {
      var p = par[q];
      if (!p.visible) continue;
      var ty = (sy + S.vh / 2 - (p.top + p.h / 2)) * -p.k;
      p.ty = ty;
      p.el.style.translate = '0 ' + ty.toFixed(1) + 'px';
    }

    updateMagnetic();
    updateNav(sy);
    if (fx) fx(now, dt);
    if (cur) {
      cur.rx = lerp(cur.rx, cur.x, 0.18); cur.ry = lerp(cur.ry, cur.y, 0.18);
      cur.ring.style.transform = 'translate3d(' + cur.rx.toFixed(1) + 'px,' + cur.ry.toFixed(1) + 'px,0)';
    }
  }

  /* ---------- Loading cinematográfico ---------- */
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function runLoader() {
    return new Promise(function (resolve) {
      var ld = $('#loader'), bar = $('#ld-bar'), pct = $('#ld-pct');
      var dur = light ? 2200 : 2800, t0 = performance.now(), done = false;
      var ease = function (t) { return t < 0.72 ? Math.pow(t / 0.72, 0.85) * 0.8 : 0.8 + (1 - Math.pow(1 - (t - 0.72) / 0.28, 3)) * 0.2; };
      (function tick(now) {
        if (done) return;
        var t = clamp((now - t0) / dur, 0, 1), v = ease(t);
        bar.style.transform = 'scaleX(' + v.toFixed(4) + ')';
        var n = Math.round(v * 100);
        pct.textContent = (n < 10 ? '0' : '') + n + '%';
        if (t < 1) window.requestAnimationFrame(tick);
        else finish();
      })(t0);
      /* reserva: se o navegador pausar animações, termina pelo relógio */
      setTimeout(function () { bar.style.transform = 'scaleX(1)'; pct.textContent = '100%'; finish(); }, dur + 1500);

      function finish() {
        if (done) return;
        done = true;
        var fonts = (document.fonts && document.fonts.ready) ? Promise.race([document.fonts.ready, sleep(1200)]) : Promise.resolve();
        fonts.then(function () { return sleep(380); }).then(function () {
          ld.classList.add('is-out');
          try { sessionStorage.setItem('zion:loaded', '1'); } catch (e) {}
          return sleep(600);
        }).then(function () {
          resolve(); // hero começa a entrar enquanto a cortina sobe
          return sleep(1300);
        }).then(function () {
          root.classList.remove('is-loading');
          if (ld.parentNode) ld.parentNode.removeChild(ld);
        });
      }
    });
  }

  function setReady() {
    if (window.__zion) window.__zion.ready = true;
    root.classList.add('is-ready');
    $$('[data-hero]').forEach(function (e) { e.classList.add('in'); });
    /* depois da intro, devolve as transições normais (hover) aos elementos */
    setTimeout(function () {
      $$('[data-intro]').forEach(function (e) { e.removeAttribute('data-intro'); });
    }, 5200);
  }

  /* ---------- Boot ---------- */
  function boot() {
    if (window.__zion) window.__zion.booted = true;
    try {
      heroEl = $('#top');
      heroMouse = heroEl ? $$('[data-mouse]', heroEl) : [];
      var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

      /* cada bloco é isolado: se um falhar, o resto do site continua funcionando */
      guard(function () { $$('[data-split]').forEach(function (el) { splitText(el, el.getAttribute('data-split') === 'chars' ? 'chars' : 'words'); }); });
      guard(renderWork);
      guard(initZ);
      guard(initParticles);
      guard(initParallax);
      guard(initReveal);
      guard(initSteps);
      guard(initNav);
      guard(initCursor);
      guard(initMagnetic);
      guard(initCards);
      guard(initSmooth);

      guard(function () {
        window.addEventListener('pointermove', function (e) {
          if (e.pointerType === 'touch') return;
          S.px = e.clientX; S.py = e.clientY;
          S.tx = (e.clientX / S.vw - 0.5) * 2;
          S.ty = (e.clientY / S.vh - 0.5) * 2;
          S.vel = Math.min(1, S.vel + Math.hypot(e.movementX || 0, e.movementY || 0) / 60);
        }, { passive: true });
        S.px = S.cx = S.vw / 2; S.py = S.cy = S.vh * 0.46;
        window.addEventListener('resize', function () {
          S.vw = window.innerWidth; S.vh = window.innerHeight;
          guard(measurePar);
        }, { passive: true });
        window.addEventListener('load', function () { guard(measurePar); });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { guard(measurePar); });
      });

      window.requestAnimationFrame(frame);
    } catch (e) {
      if (window.__zion && window.__zion.safe) window.__zion.safe();
    }

    /* abertura (loading) e entrada do hero: independente do resto */
    try {
      var needLoader = root.classList.contains('is-loading') && !reduced && !root.classList.contains('safe');
      if (needLoader) {
        window.scrollTo(0, 0);
        runLoader().then(setReady);
      } else {
        root.classList.remove('is-loading');
        var l = $('#loader'); if (l && l.parentNode) l.parentNode.removeChild(l);
        setTimeout(setReady, 120);
      }
    } catch (e) {
      if (window.__zion && window.__zion.safe) window.__zion.safe();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
