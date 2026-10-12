/* 통합과학 교재 공통 스크립트: 화면 테마, 목차 서랍, 단원 흐름 표시, 인터랙티브 애니메이션(Sims) 틀 */
(function () {
  'use strict';
  var root = document.documentElement;

  /* ───── 화면 테마 ───── */
  try { var saved = localStorage.getItem('sb-theme'); if (saved) root.setAttribute('data-theme', saved); } catch (e) { /* 저장소 없음 */ }
  var themeListeners = [];
  function isDark() {
    var t = root.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function fireTheme() { themeListeners.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', fireTheme);
  }
  new MutationObserver(fireTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  /* ───── 색 토큰 읽기 ───── */
  var TOKEN_NAMES = ['ink', 'muted', 'rule', 'surface', 'paper', 'accent', 'accent-soft', 'focus',
    'fig-ink', 'fig-muted', 'fig-line', 'fig-paper', 'fig-panel', 'fig-accent', 'fig-blue', 'fig-red', 'fig-green', 'fig-amber', 'fig-violet', 'fig-teal',
    'fig-soft-blue', 'fig-soft-red', 'fig-soft-green', 'fig-soft-amber', 'fig-soft-violet', 'fig-soft-teal'];
  function tokens() {
    var cs = getComputedStyle(root), t = {};
    TOKEN_NAMES.forEach(function (n) { t[n.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); })] = cs.getPropertyValue('--' + n).trim(); });
    t.fontBody = cs.getPropertyValue('--font-body').trim();
    t.fontMono = cs.getPropertyValue('--font-mono').trim();
    t.dark = isDark();
    return t;
  }

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ───── Sims: 인터랙티브 애니메이션 틀 ─────
     Sims.register('이름', { title, caption, init(api) })
     api.stage, api.controls, api.readouts : 각 영역 요소
     api.canvas({ aspect }) → { canvas, ctx, w, h }   (HiDPI, 크기 자동 조정, api.onResize로 알림)
     api.svg(viewBox)      → SVG 요소
     api.slider({ id, label, min, max, step, value, format, onInput })
     api.button(label, onClick, { primary, toggle })  /  api.group()
     api.readout(label)    → { set(text) }
     api.loop(fn(dt, t))   → { play(), pause(), playing } : 화면에 보일 때만 돈다
     api.tokens()          → 현재 테마 색   /  api.onTheme(fn)  /  api.reduced(움직임 줄이기 설정) */
  var defs = {};
  var Sims = window.Sims = {
    register: function (name, def) { defs[name] = def; if (document.readyState !== 'loading') mountAll(); },
  };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function mount(fig) {
    var name = fig.getAttribute('data-sim');
    var def = defs[name];
    if (!def || fig.getAttribute('data-mounted')) return;
    fig.setAttribute('data-mounted', '1');
    fig.innerHTML = '';
    var head = el('div', 'sim-head');
    head.appendChild(el('span', 'sim-tag', '직접 해 보기'));
    head.appendChild(el('p', 'sim-title', def.title || ''));
    var stage = el('div', 'sim-stage');
    var readouts = el('div', 'sim-readouts');
    var controls = el('div', 'sim-controls');
    fig.appendChild(head); fig.appendChild(stage); fig.appendChild(readouts); fig.appendChild(controls);
    if (def.caption) fig.appendChild(el('p', 'sim-caption', def.caption));

    var resizeFns = [], loops = [], visible = false;
    var api = {
      root: fig, stage: stage, controls: controls, readouts: readouts, reduced: reduced,
      tokens: tokens,
      onTheme: function (f) { themeListeners.push(f); },
      onResize: function (f) { resizeFns.push(f); },
      el: el,
      canvas: function (opt) {
        opt = opt || {};
        var aspect = opt.aspect || 0.55;
        var c = el('canvas'); stage.appendChild(c);
        if (opt.label) c.setAttribute('aria-label', opt.label);
        c.setAttribute('role', 'img');
        var o = { canvas: c, ctx: c.getContext('2d'), w: 0, h: 0 };
        function fit() {
          var w = stage.clientWidth - 32; if (w <= 0) w = 600;
          var h = Math.round(w * (typeof aspect === 'function' ? aspect(w) : aspect));
          var dpr = Math.min(window.devicePixelRatio || 1, 2);
          c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
          c.style.width = w + 'px'; c.style.height = h + 'px';
          o.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          o.w = w; o.h = h;
        }
        fit(); resizeFns.unshift(fit);
        return o;
      },
      svg: function (viewBox, label) {
        var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        s.setAttribute('viewBox', viewBox); s.setAttribute('role', 'img');
        if (label) s.setAttribute('aria-label', label);
        stage.appendChild(s); return s;
      },
      slider: function (o) {
        var lab = el('label'); lab.setAttribute('for', o.id);
        var top = el('span'); top.textContent = o.label + ' ';
        var out = el('output'); out.setAttribute('for', o.id);
        var inp = el('input'); inp.type = 'range'; inp.id = o.id;
        inp.min = o.min; inp.max = o.max; inp.step = o.step || 'any'; inp.value = o.value;
        var fmt = o.format || function (v) { return v; };
        function upd() { out.textContent = fmt(+inp.value); if (o.onInput) o.onInput(+inp.value); }
        inp.addEventListener('input', upd);
        top.appendChild(out); lab.appendChild(top); lab.appendChild(inp);
        (o.parent || controls).appendChild(lab);
        out.textContent = fmt(+inp.value);
        return { input: inp, get value() { return +inp.value; }, set: function (v) { inp.value = v; upd(); } };
      },
      group: function (parent) { var g = el('div', 'sim-group'); (parent || controls).appendChild(g); return g; },
      button: function (label, onClick, opt) {
        opt = opt || {};
        var b = el('button', 'sim-btn' + (opt.primary ? ' primary' : ''), label); b.type = 'button';
        if (opt.toggle) b.setAttribute('aria-pressed', opt.pressed ? 'true' : 'false');
        b.addEventListener('click', function () { onClick(b); });
        (opt.parent || controls).appendChild(b); return b;
      },
      readout: function (label) {
        var s = el('span'); s.appendChild(document.createTextNode(label));
        var b = el('b', null, '–'); s.appendChild(b); readouts.appendChild(s);
        return { set: function (t) { b.textContent = t; } };
      },
      loop: function (fn) {
        var raf = 0, last = 0, t = 0;
        var L = { playing: false, wanted: !reduced,
          play: function () { L.wanted = true; L._run(); },
          pause: function () { L.wanted = false; L._stop(); },
          _run: function () {
            if (L.playing || !L.wanted || !visible) return;
            L.playing = true; last = performance.now();
            var step = function (now) {
              if (!L.playing) return;
              var dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt;
              fn(dt, t);
              raf = requestAnimationFrame(step);
            };
            raf = requestAnimationFrame(step);
          },
          _stop: function () { L.playing = false; cancelAnimationFrame(raf); },
        };
        loops.push(L); return L;
      },
    };
    try { def.init(api); } catch (e) { console.error('애니메이션 오류:', name, e); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (ents) {
        visible = ents[0].isIntersecting;
        loops.forEach(function (L) { if (visible) L._run(); else L._stop(); });
      }, { rootMargin: '80px' }).observe(fig);
    } else { visible = true; loops.forEach(function (L) { L._run(); }); }
    var rt = 0;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { resizeFns.forEach(function (f) { f(); }); }, 120); });
    themeListeners.push(function () { resizeFns.forEach(function (f) { f(); }); });
  }
  function mountAll() { document.querySelectorAll('figure.sim[data-sim]').forEach(mount); }

  /* ───── 페이지 동작 ───── */
  document.addEventListener('DOMContentLoaded', function () {
    var mb = document.getElementById('menu-btn');
    if (mb) mb.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (document.body.classList.contains('nav-open') && !e.target.closest('#drawer') && !e.target.closest('#menu-btn')) {
        document.body.classList.remove('nav-open'); if (mb) mb.setAttribute('aria-expanded', 'false');
      }
    });
    var tb = document.getElementById('theme-btn');
    if (tb) tb.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('sb-theme', next); } catch (e) { /* 저장소 없음 */ }
    });
    var cur = document.querySelector('.book-nav [aria-current="page"]');
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'center' });
    // 단원 흐름 사다리: 지금 읽는 위치 표시
    var links = [].slice.call(document.querySelectorAll('.ladder a'));
    if (links.length && 'IntersectionObserver' in window) {
      var map = {};
      links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a.parentNode; });
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (a) { a.parentNode.classList.remove('active'); });
          var li = map[en.target.id]; if (li) li.classList.add('active');
        });
      }, { rootMargin: '0px 0px -70% 0px' });
      Object.keys(map).forEach(function (id) { var h = document.getElementById(id); if (h) io.observe(h); });
    }
    mountAll();
  });
})();
