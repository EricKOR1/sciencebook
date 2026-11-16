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
     api.tokens()          → 현재 테마 색   /  api.onTheme(fn)  /  api.reduced(움직임 줄이기 설정)

     ── 3D 모형: api.scene3d({ aspect, yaw, pitch, dist, scale, autoRotate, label, draw(g, T, S) }) → S
     끌어서 돌려 보는 입체 장면. 좌표는 x 오른쪽, y 위, z 보는 사람 쪽(오른손 좌표계), 각도는 라디안.
     draw 안에서 g 로 도형을 추가하면 멀리 있는 것부터 자동으로 그린다(깊이 정렬).
       g.sphere([x,y,z], r, color, { label, alpha, outline, flat })   공(원자·행성 등)
       g.line(a, b, color, { width, dash, alpha })                    선분(긴 선은 자동으로 잘게 나눠 정렬)
       g.path(points, color, { width, dash, alpha, closed })          꺾은선·곡선(점 배열)
       g.poly(points, color, { alpha, stroke, strokeWidth })          평면 다각형(반투명 면)
       g.arrow(a, b, color, { width, head })                          화살표
       g.text([x,y,z], '글자', { color, size, align, bold, dy })      글자 라벨(항상 읽을 수 있게 맨 위에 그림)
       g.circle(center, radius, normal, color, { width, dash, fill, alpha })  원(궤도 등). normal 은 원이 놓인 평면의 수직 방향
     S.redraw()  다시 그리기   S.yaw / S.pitch / S.zoom  시점(바꾼 뒤 redraw)   S.resetView()
     S.setAutoRotate(true/false)   S.onFrame(fn(dt, t))  매 프레임 호출(움직이는 장면)   S.project([x,y,z]) → { x, y, depth, k }
     S.w, S.h, S.ctx : 캔버스(직접 2D로 덧그릴 때)                                                         */
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
    var tagEl = el('span', 'sim-tag', '직접 해 보기'); head.appendChild(tagEl);
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
              var dt = Math.min(Math.max((now - last) / 1000, 0), 0.05); last = now; t += dt;
              if (dt === 0) { raf = requestAnimationFrame(step); return; }
              fn(dt, t);
              raf = requestAnimationFrame(step);
            };
            raf = requestAnimationFrame(step);
          },
          _stop: function () { L.playing = false; cancelAnimationFrame(raf); },
        };
        loops.push(L); return L;
      },
      scene3d: function (opt) { return makeScene3d(api, opt || {}, tagEl, stage); },
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
  /* ───── 3D 장면(캔버스 2D 위의 간단한 입체 투영) ───── */
  function parseColor(c) {
    c = (c || '').trim();
    var m;
    if ((m = /^#([0-9a-f]{3})$/i.exec(c))) return [parseInt(m[1][0] + m[1][0], 16), parseInt(m[1][1] + m[1][1], 16), parseInt(m[1][2] + m[1][2], 16)];
    if ((m = /^#([0-9a-f]{6})/i.exec(c))) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
    if ((m = /^rgba?\(([^)]+)\)/i.exec(c))) { var p = m[1].split(/[\s,\/]+/).map(parseFloat); return [p[0], p[1], p[2]]; }
    return [128, 128, 128];
  }
  function mixColor(c, target, t) {
    var a = parseColor(c), b = target;
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')';
  }
  function makeScene3d(api, opt, tagEl, stage) {
    var cv = api.canvas({ aspect: opt.aspect || function (w) { return w < 560 ? 0.9 : 0.6; }, label: opt.label });
    var ctx = cv.ctx, c = cv.canvas;
    c.classList.add('c3d'); c.tabIndex = 0;
    if (tagEl) { tagEl.textContent = '3D · 끌어서 돌려 보기'; tagEl.classList.add('t3d'); }
    var home = { yaw: opt.yaw == null ? 0.6 : opt.yaw, pitch: opt.pitch == null ? 0.35 : opt.pitch, zoom: 1 };
    var D = opt.dist || 9, unitScale = opt.scale || 0.16, frameFns = [], items = [], pending = false;
    var S = { yaw: home.yaw, pitch: home.pitch, zoom: 1, auto: false, canvas: c, ctx: ctx, w: cv.w, h: cv.h };
    function rot(p) {
      var cy = Math.cos(S.yaw), sy = Math.sin(S.yaw), cp = Math.cos(S.pitch), sp = Math.sin(S.pitch);
      var x1 = p[0] * cy + p[2] * sy, z1 = -p[0] * sy + p[2] * cy;
      return [x1, p[1] * cp - z1 * sp, p[1] * sp + z1 * cp];
    }
    function proj(p) {
      var r = rot(p), unit = Math.min(cv.w, cv.h * 1.25) * unitScale * S.zoom, k = D / Math.max(D - r[2], 0.2);
      return { x: cv.w / 2 + r[0] * unit * k, y: cv.h / 2 - r[1] * unit * k, depth: r[2], k: unit * k };
    }
    S.project = proj;
    var g = {
      sphere: function (p, r, color, o) { var q = proj(p); items.push({ t: 's', d: q.depth, q: q, r: r * q.k, color: color, o: o || {} }); },
      line: function (a, b, color, o) {
        o = o || {};
        var len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.min(24, Math.max(1, Math.ceil(len / 0.6)));
        for (var i = 0; i < n; i++) {
          var p1 = [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n, a[2] + (b[2] - a[2]) * i / n];
          var p2 = [a[0] + (b[0] - a[0]) * (i + 1) / n, a[1] + (b[1] - a[1]) * (i + 1) / n, a[2] + (b[2] - a[2]) * (i + 1) / n];
          var q1 = proj(p1), q2 = proj(p2);
          items.push({ t: 'l', d: (q1.depth + q2.depth) / 2 - 0.02, a: q1, b: q2, color: color, o: o });
        }
      },
      path: function (pts, color, o) {
        o = o || {};
        var n = pts.length, last = o.closed ? n : n - 1;
        for (var i = 0; i < last; i++) {
          var q1 = proj(pts[i]), q2 = proj(pts[(i + 1) % n]);
          items.push({ t: 'l', d: (q1.depth + q2.depth) / 2 - 0.02, a: q1, b: q2, color: color, o: o });
        }
      },
      poly: function (pts, color, o) {
        var qs = pts.map(proj), d = 0; qs.forEach(function (q) { d += q.depth; });
        items.push({ t: 'p', d: d / qs.length - 0.05, qs: qs, color: color, o: o || {} });
      },
      arrow: function (a, b, color, o) {
        o = o || {}; g.line(a, b, color, o);
        var q1 = proj([a[0] + (b[0] - a[0]) * 0.9, a[1] + (b[1] - a[1]) * 0.9, a[2] + (b[2] - a[2]) * 0.9]), q2 = proj(b);
        items.push({ t: 'h', d: q2.depth + 0.01, a: q1, b: q2, color: color, o: o });
      },
      text: function (p, str, o) { var q = proj(p); items.push({ t: 't', d: 1e6 + q.depth, q: q, str: str, o: o || {} }); },
      circle: function (center, radius, normal, color, o) {
        o = o || {};
        var nx = normal[0], ny = normal[1], nz = normal[2], nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        var ux, uy, uz; if (Math.abs(ny) < 0.9) { ux = nz; uy = 0; uz = -nx; } else { ux = 1; uy = 0; uz = 0; }
        var ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
        var vx = ny * uz - nz * uy, vy = nz * ux - nx * uz, vz = nx * uy - ny * ux, pts = [], N = o.steps || 72;
        for (var i = 0; i < N; i++) {
          var a = i / N * Math.PI * 2, ca = Math.cos(a) * radius, sa = Math.sin(a) * radius;
          pts.push([center[0] + ux * ca + vx * sa, center[1] + uy * ca + vy * sa, center[2] + uz * ca + vz * sa]);
        }
        if (o.fill) g.poly(pts, o.fill, { alpha: o.alpha == null ? 0.25 : o.alpha });
        g.path(pts, color, { width: o.width, dash: o.dash, alpha: o.lineAlpha, closed: true });
      },
    };
    function paint() {
      pending = false;
      var T = api.tokens();
      S.w = cv.w; S.h = cv.h; items = [];
      ctx.clearRect(0, 0, cv.w, cv.h);
      if (opt.draw) opt.draw(g, T, S);
      items.sort(function (a, b) { return a.d - b.d; });
      var white = [255, 255, 255], black = [0, 0, 0];
      items.forEach(function (it) {
        var o = it.o;
        ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
        if (it.t === 's') {
          var r = Math.max(it.r, 0.5);
          if (o.flat) ctx.fillStyle = it.color;
          else {
            var gr = ctx.createRadialGradient(it.q.x - r * 0.35, it.q.y - r * 0.4, r * 0.08, it.q.x, it.q.y, r);
            gr.addColorStop(0, mixColor(it.color, white, T.dark ? 0.45 : 0.6)); gr.addColorStop(0.55, mixColor(it.color, white, 0));
            gr.addColorStop(1, mixColor(it.color, black, T.dark ? 0.45 : 0.3));
            ctx.fillStyle = gr;
          }
          ctx.beginPath(); ctx.arc(it.q.x, it.q.y, r, 0, Math.PI * 2); ctx.fill();
          if (o.outline) { ctx.lineWidth = 1.2; ctx.strokeStyle = o.outline === true ? T.figInk : o.outline; ctx.stroke(); }
          if (o.label) {
            ctx.globalAlpha = 1; ctx.fillStyle = o.labelColor || T.figInk; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.font = '600 ' + Math.max(11, Math.min(16, r * 0.9)) + 'px ' + T.fontBody; ctx.fillText(o.label, it.q.x, it.q.y);
          }
        } else if (it.t === 'l') {
          ctx.strokeStyle = it.color; ctx.lineWidth = o.width || 1.6; ctx.lineCap = 'round';
          ctx.setLineDash(o.dash || []); ctx.beginPath(); ctx.moveTo(it.a.x, it.a.y); ctx.lineTo(it.b.x, it.b.y); ctx.stroke(); ctx.setLineDash([]);
        } else if (it.t === 'p') {
          ctx.globalAlpha = o.alpha == null ? 0.35 : o.alpha; ctx.fillStyle = it.color;
          ctx.beginPath(); it.qs.forEach(function (q, i) { if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }); ctx.closePath(); ctx.fill();
          if (o.stroke) { ctx.globalAlpha = 1; ctx.strokeStyle = o.stroke; ctx.lineWidth = o.strokeWidth || 1.2; ctx.stroke(); }
        } else if (it.t === 'h') {
          var ang = Math.atan2(it.b.y - it.a.y, it.b.x - it.a.x), hs = o.head || 9;
          ctx.fillStyle = it.color; ctx.beginPath(); ctx.moveTo(it.b.x, it.b.y);
          ctx.lineTo(it.b.x - hs * Math.cos(ang - 0.4), it.b.y - hs * Math.sin(ang - 0.4));
          ctx.lineTo(it.b.x - hs * Math.cos(ang + 0.4), it.b.y - hs * Math.sin(ang + 0.4)); ctx.closePath(); ctx.fill();
        } else if (it.t === 't') {
          ctx.globalAlpha = 1; ctx.fillStyle = o.color || T.figInk; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
          ctx.font = (o.bold ? '600 ' : '') + (o.size || 12) + 'px ' + T.fontBody;
          ctx.fillText(it.str, it.q.x + (o.dx || 0), it.q.y + (o.dy || 0));
        }
      });
      ctx.globalAlpha = 1;
      if (opt.overlay) opt.overlay(ctx, T, S);
    }
    S.redraw = function () { if (!pending) { pending = true; requestAnimationFrame(paint); } };
    S.resetView = function () { S.yaw = home.yaw; S.pitch = home.pitch; S.zoom = 1; S.redraw(); };
    S.onFrame = function (f) { frameFns.push(f); loop.play(); };
    var loop = api.loop(function (dt, t) {
      if (S.auto && !drag) S.yaw += dt * (opt.autoSpeed || 0.5);
      frameFns.forEach(function (f) { f(dt, t); });
      paint();
      if (!S.auto && !frameFns.length) loop.pause();
    });
    loop.pause();
    S.loop = loop;
    S.setAutoRotate = function (on) { S.auto = !!on; if (S.auto) loop.play(); if (autoBtn) autoBtn.setAttribute('aria-pressed', S.auto ? 'true' : 'false'); };
    // 끌어서 돌리기(마우스·터치), 화살표 키
    var drag = null;
    c.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch' }; try { c.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ } });
    c.addEventListener('pointermove', function (e) {
      if (!drag) return;
      S.yaw += (e.clientX - drag.x) * 0.01;
      if (!drag.touch) S.pitch = Math.max(-1.5, Math.min(1.5, S.pitch + (e.clientY - drag.y) * 0.01));
      drag.x = e.clientX; drag.y = e.clientY; S.redraw();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { c.addEventListener(ev, function () { drag = null; }); });
    c.addEventListener('keydown', function (e) {
      var k = e.key, used = true;
      if (k === 'ArrowLeft') S.yaw -= 0.1; else if (k === 'ArrowRight') S.yaw += 0.1;
      else if (k === 'ArrowUp') S.pitch = Math.min(1.5, S.pitch + 0.1); else if (k === 'ArrowDown') S.pitch = Math.max(-1.5, S.pitch - 0.1);
      else used = false;
      if (used) { e.preventDefault(); S.redraw(); }
    });
    var autoBtn = null;
    if (opt.viewButtons !== false) {
      var grp = api.group();
      autoBtn = api.button('자동 회전', function () { S.setAutoRotate(!S.auto); }, { toggle: true, parent: grp });
      api.button('위아래로 기울이기', function () { S.pitch = S.pitch > 0.9 ? 0.05 : S.pitch + 0.45; S.redraw(); }, { parent: grp });
      api.button('처음 시점', function () { S.resetView(); }, { parent: grp });
    }
    var hint = el('p', 'sim-hint', '그림을 마우스나 손가락으로 끌면 돌아간다. (키보드: 화살표 키)');
    stage.parentNode.insertBefore(hint, stage.nextSibling);
    api.onResize(paint);
    if (opt.autoRotate && !api.reduced) S.setAutoRotate(true);
    paint();
    return S;
  }
  function mountAll() { document.querySelectorAll('figure.sim[data-sim]').forEach(mount); }

  /* ───── 학습 기록: 읽던 위치, 읽은 정도, 완료 표시 ─────
     이 기기의 이 브라우저(localStorage 'sb-progress')에만 저장한다. 서버로 보내지 않는다.
     { v: 1, last: '단원 id', lessons: { id: { t, sec, off, secTitle, ratio, max, done, title, where } } } */
  var Progress = (function () {
    var KEY = 'sb-progress', ok = false;
    try { localStorage.setItem('sb-test', '1'); localStorage.removeItem('sb-test'); ok = true; } catch (e) { ok = false; }
    function read() {
      var d = null;
      if (ok) { try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; } }
      if (!d || typeof d !== 'object' || !d.lessons || typeof d.lessons !== 'object') d = { v: 1, last: null, lessons: {} };
      return d;
    }
    function write(d) { if (!ok) return; try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* 저장 공간 부족 등 */ } }
    return {
      ok: ok,
      all: read,
      get: function (id) { return read().lessons[id] || null; },
      // 다른 탭에서 바뀐 기록을 덮어쓰지 않도록 저장 직전에 다시 읽어 합친다
      update: function (id, patch, makeLast) {
        var d = read(), e = d.lessons[id] || {};
        Object.keys(patch).forEach(function (k) { e[k] = patch[k]; });
        d.lessons[id] = e;
        if (makeLast) d.last = id;
        write(d);
        return e;
      },
      clear: function () { if (ok) { try { localStorage.removeItem(KEY); } catch (e) { /* 무시 */ } } },
    };
  })();
  function ago(t) {
    var m = Math.round((Date.now() - t) / 60000);
    if (!(m >= 0)) return '';
    if (m < 2) return '방금 전';
    if (m < 60) return m + '분 전';
    if (m < 60 * 24) return Math.round(m / 60) + '시간 전';
    if (m < 60 * 24 * 30) return Math.round(m / 1440) + '일 전';
    var d = new Date(t);
    return d.getFullYear() + '. ' + (d.getMonth() + 1) + '. ' + d.getDate() + '.';
  }
  function pct(e) { return Math.max(0, Math.min(100, Math.round((e && e.max || 0) * 100))); }
  function started(e) { return !!e && (e.done || (e.max || 0) >= 0.03); }

  // 목차(서랍·첫 화면)에 완료 ✓ / 학습 중 ◐ 표시
  function paintMarks() {
    if (!Progress.ok) return;
    var L = Progress.all().lessons;
    [].slice.call(document.querySelectorAll('.book-nav a[data-id], .toc-card a[data-id]')).forEach(function (a) {
      var e = L[a.getAttribute('data-id')], old = a.querySelector('.pg-mark');
      if (old) a.removeChild(old);
      if (!started(e)) return;
      var m = el('span', 'pg-mark' + (e.done ? '' : ' doing'), e.done ? '✓' : '◐');
      m.setAttribute('role', 'img');
      m.setAttribute('aria-label', e.done ? '학습 완료' : '학습 중');
      m.title = e.done ? '학습 완료' : '학습 중 · 약 ' + pct(e) + '% 읽음';
      a.appendChild(m);
    });
    [].slice.call(document.querySelectorAll('.toc-card')).forEach(function (card) {
      var links = card.querySelectorAll('a[data-id]'), n = 0, h = card.querySelector('h3');
      [].slice.call(links).forEach(function (a) { var e = L[a.getAttribute('data-id')]; if (e && e.done) n++; });
      var sp = card.querySelector('.part-prog');
      if (!n) { if (sp) sp.parentNode.removeChild(sp); return; }
      if (!sp && h) { sp = el('span', 'part-prog'); h.appendChild(sp); }
      if (sp) sp.textContent = '완료 ' + n + '/' + links.length;
    });
  }

  // 단원 쪽: 읽던 위치 저장·복원, 읽은 정도 막대, 완료 표시
  function initLessonProgress() {
    var id = document.body.getAttribute('data-lesson');
    if (!id || !Progress.ok) return;
    var art = document.querySelector('article.lesson') || document.getElementById('main');
    var heads = [].slice.call(art.querySelectorAll('h2[id], h3[id]'));
    var bar = document.querySelector('#read-bar i');
    var before = Progress.get(id);            // 이번에 들어오기 전의 기록
    var toast = null, hold = false, timer = 0;
    var LINE = 90;                            // 화면 위쪽 기준선(상단 막대 아래)

    function headTitle(h) {
      var one = function (x, short) {
        var b = x.querySelector('.step-badge'), t = x.querySelector('.h-text');
        return (b && t ? (short ? b.textContent : b.textContent + ' · ' + t.textContent) : x.textContent).replace(/\s+/g, ' ').trim();
      };
      var s = one(h, false);
      if (h.tagName === 'H3') {             // 작은 제목은 어느 STEP 안인지 함께 보여 준다
        for (var i = heads.indexOf(h) - 1; i >= 0; i--) { if (heads[i].tagName === 'H2') { s = one(heads[i], true) + ' › ' + s; break; } }
      }
      return s.length > 48 ? s.slice(0, 47) + '…' : s;
    }
    function ratioNow() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 1;
    }
    function snapshot() {
      var cur = null, i;
      for (i = 0; i < heads.length; i++) { if (heads[i].getBoundingClientRect().top <= LINE) cur = heads[i]; else break; }
      var r = ratioNow(), prev = Progress.get(id);
      return {
        t: Date.now(), ratio: r, max: Math.max(r, prev && prev.max || 0),
        sec: cur ? cur.id : '', secTitle: cur ? headTitle(cur) : '',
        off: cur ? Math.round(LINE - cur.getBoundingClientRect().top) : Math.round(window.scrollY),
      };
    }
    function save() { if (!hold) Progress.update(id, snapshot(), true); }
    function paintBar() { if (bar) bar.style.width = (ratioNow() * 100).toFixed(1) + '%'; }
    function targetY(e) {
      var h = e.sec ? document.getElementById(e.sec) : null;
      if (h) return h.getBoundingClientRect().top + window.scrollY - LINE + (e.off || 0);
      if (!e.sec) return e.off || 0;
      return (e.ratio || 0) * (document.documentElement.scrollHeight - window.innerHeight);
    }
    function jump(e) {
      var go = function () { window.scrollTo(0, Math.max(0, targetY(e))); };
      go();
      // 그림·글꼴이 늦게 자리 잡으며 위치가 밀릴 수 있어 한 번 더 맞춘다
      var y0 = window.scrollY;
      setTimeout(function () { if (Math.abs(window.scrollY - y0) < 4) go(); }, 350);
    }
    function closeToast() { if (toast) { toast.parentNode.removeChild(toast); toast = null; } hold = false; }
    function showToast(e) {
      hold = true;                            // 안내가 떠 있는 동안에는 예전 위치를 덮어쓰지 않는다
      toast = el('div', 'resume-toast');
      toast.setAttribute('role', 'status');
      var p = el('p');
      p.appendChild(el('small', '', '지난번에 읽던 곳 · ' + ago(e.t)));
      p.appendChild(el('b', '', e.secTitle || '단원 앞부분'));
      var btns = el('div', 'rt-btns');
      var goBtn = el('button', 'pg-btn', '이어서 보기'); goBtn.type = 'button';
      var noBtn = el('button', 'pg-btn ghost', '닫기'); noBtn.type = 'button';
      goBtn.addEventListener('click', function () { closeToast(); jump(e); });
      noBtn.addEventListener('click', function () { closeToast(); save(); });
      btns.appendChild(goBtn); btns.appendChild(noBtn);
      toast.appendChild(p); toast.appendChild(btns);
      document.body.appendChild(toast);
    }

    // 완료 표시
    var box = document.getElementById('done-box'), chk = document.getElementById('done-check');
    if (box && chk) {
      box.hidden = false;
      var paintDone = function () { var e = Progress.get(id); chk.checked = !!(e && e.done); box.classList.toggle('is-done', chk.checked); };
      chk.addEventListener('change', function () {
        Progress.update(id, { done: chk.checked, t: Date.now() }, true);
        paintDone(); paintMarks();
      });
      paintDone();
      window.addEventListener('storage', paintDone);
    }

    // 들어온 사실 기록(위치는 아직 건드리지 않는다)
    Progress.update(id, { t: Date.now(), title: document.body.getAttribute('data-title') || document.title, where: document.body.getAttribute('data-where') || '' }, true);

    window.addEventListener('scroll', function () {
      paintBar();
      if (hold && window.scrollY > Math.max(500, window.innerHeight * 0.8)) closeToast();   // 스스로 읽어 내려가면 안내를 접는다
      if (hold) return;
      clearTimeout(timer); timer = setTimeout(save, 400);
    }, { passive: true });
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') save(); });

    var start = function () {
      paintBar();
      var hash = location.hash;
      if (hash === '#resume') {
        if (before) jump(before);
        try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* 무시 */ }
        return;
      }
      // 주소에 위치가 있거나, 브라우저가 이미 위치를 되돌려 놓았으면 안내하지 않는다
      if (hash || window.scrollY > 200 || !before) return;
      if (before.sec || (before.off || 0) > 400) {
        if (targetY(before) > window.innerHeight * 0.6) showToast(before);
      }
    };
    if (document.readyState === 'complete') setTimeout(start, 0); else window.addEventListener('load', function () { setTimeout(start, 0); });
  }

  // 첫 화면: 이어서 학습하기, 전체 진행 상황, 기록 지우기
  function initCoverProgress() {
    var panel = document.getElementById('resume-panel'), admin = document.getElementById('progress-admin');
    if (!panel || !Progress.ok) return;
    var links = [].slice.call(document.querySelectorAll('.toc-card a[data-id]'));
    var order = links.map(function (a) { return a.getAttribute('data-id'); });
    var info = {};
    links.forEach(function (a) {
      var card = a.closest('.toc-card'), h = card && card.querySelector('h3'), spans = a.querySelectorAll('span');
      info[a.getAttribute('data-id')] = { href: a.getAttribute('href'), title: spans.length > 1 ? spans[1].textContent : a.textContent, where: a.getAttribute('data-where') || (h ? h.firstChild.textContent : '') };
    });
    function paint() {
      var d = Progress.all(), L = d.lessons, done = 0, doing = [];
      order.forEach(function (id) { var e = L[id]; if (!e) return; if (e.done) done++; else if (started(e)) doing.push(id); });
      panel.textContent = '';
      var last = d.last && info[d.last] && L[d.last] ? d.last : null;
      if (!last && !done && !doing.length) { panel.hidden = true; if (admin) admin.hidden = true; return; }
      panel.hidden = false; if (admin) admin.hidden = false;
      panel.appendChild(el('h2', '', '이어서 학습하기'));
      var shown = last;
      if (last) {
        var e = L[last], it = info[last], row = el('div', 'rp-main'), p = el('p');
        var nextId = order[order.indexOf(last) + 1];
        if (e.done && nextId) {
          shown = nextId;
          p.appendChild(el('small', '', '「' + it.title + '」 학습 완료 · 다음 단원'));
          p.appendChild(el('b', '', info[nextId].where + ' · ' + info[nextId].title));
          row.appendChild(p);
          var a1 = el('a', 'pg-btn', '다음 단원 시작'); a1.href = info[nextId].href + (started(L[nextId]) ? '#resume' : '');
          row.appendChild(a1);
        } else {
          p.appendChild(el('small', '', it.where + ' · ' + ago(e.t) + (e.done ? ' · 학습 완료' : ' · 약 ' + pct(e) + '% 읽음')));
          p.appendChild(el('b', '', it.title));
          if (e.secTitle) p.appendChild(el('small', '', '읽던 곳: ' + e.secTitle));
          row.appendChild(p);
          var a2 = el('a', 'pg-btn', '이어서 보기'); a2.href = it.href + '#resume';
          row.appendChild(a2);
        }
        panel.appendChild(row);
      }
      var others = doing.filter(function (id) { return id !== last && id !== shown; }).sort(function (a, b) { return (L[b].t || 0) - (L[a].t || 0); }).slice(0, 4);
      if (others.length) {
        var ul = el('ul', 'rp-more'); ul.appendChild(el('li', '', '읽다 만 단원'));
        others.forEach(function (id) { var li = el('li'), a = el('a', '', info[id].title + ' · ' + pct(L[id]) + '%'); a.href = info[id].href + '#resume'; li.appendChild(a); ul.appendChild(li); });
        panel.appendChild(ul);
      }
      panel.appendChild(el('p', 'rp-total', '전체 ' + order.length + '개 단원 중 완료 ' + done + '개 · 학습 중 ' + doing.length + '개'));
      var barBox = el('div', 'rp-bar'), fill = el('i'); fill.style.width = (order.length ? done / order.length * 100 : 0).toFixed(1) + '%';
      barBox.setAttribute('role', 'img'); barBox.setAttribute('aria-label', '전체 단원의 ' + Math.round(order.length ? done / order.length * 100 : 0) + '% 완료');
      barBox.appendChild(fill); panel.appendChild(barBox);
    }
    // 기록 지우기: 한 번 더 확인받는다
    var btns = admin && admin.querySelector('.pa-btns');
    if (btns) {
      var ask = function () {
        btns.textContent = '';
        var b = el('button', 'pg-btn ghost', '학습 기록 지우기'); b.type = 'button';
        b.addEventListener('click', function () {
          btns.textContent = '';
          btns.appendChild(el('span', '', '이 기기에 저장된 학습 기록을 모두 지울까요? 되돌릴 수 없어요.'));
          var y = el('button', 'pg-btn danger', '지우기'), n = el('button', 'pg-btn ghost', '취소'); y.type = n.type = 'button';
          y.addEventListener('click', function () { Progress.clear(); ask(); paint(); paintMarks(); });
          n.addEventListener('click', ask);
          btns.appendChild(y); btns.appendChild(n);
        });
        btns.appendChild(b);
      };
      ask();
    }
    paint();
    window.addEventListener('storage', paint);
    window.addEventListener('pageshow', function (ev) { if (ev.persisted) paint(); });
  }

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
    var drawer = document.getElementById('drawer');
    // 서랍 목차만 움직인다(본문 위치는 건드리지 않는다)
    if (cur && drawer) drawer.scrollTop += cur.getBoundingClientRect().top - drawer.getBoundingClientRect().top - drawer.clientHeight / 2;
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
    // 목차에서 단원 이름으로 찾기
    var nf = document.getElementById('nav-filter');
    if (nf) {
      var parts = [].slice.call(document.querySelectorAll('.nav-part')), wasOpen = parts.map(function (d) { return d.open; });
      nf.addEventListener('input', function () {
        var q = nf.value.trim().toLowerCase();
        parts.forEach(function (d, i) {
          var any = false;
          [].slice.call(d.querySelectorAll('li')).forEach(function (li) { var hit = !q || li.textContent.toLowerCase().indexOf(q) >= 0; li.hidden = !hit; if (hit) any = true; });
          d.hidden = !!q && !any; d.open = q ? any : wasOpen[i];
        });
      });
    }
    // 개념 연계 지도: 올리거나 한 번 누르면 연결된 단원 강조, 한 번 더 누르면 이동
    var mt = document.getElementById('map-table');
    if (mt) {
      var chips = [].slice.call(mt.querySelectorAll('.map-chip')), locked = null;
      var focus = function (chip) {
        chips.forEach(function (c) { c.classList.remove('is-focus', 'is-linked'); });
        mt.classList.toggle('has-focus', !!chip);
        if (!chip) return;
        var ids = (chip.getAttribute('data-links') || '').split(' ');
        chip.classList.add('is-focus');
        chips.forEach(function (c) { if (ids.indexOf(c.getAttribute('data-id')) >= 0) c.classList.add('is-linked'); });
      };
      chips.forEach(function (chip) {
        chip.addEventListener('mouseenter', function () { if (!locked) focus(chip); });
        chip.addEventListener('mouseleave', function () { if (!locked) focus(null); });
        chip.addEventListener('focus', function () { if (!locked) focus(chip); });
        chip.addEventListener('click', function (e) { if (locked !== chip) { e.preventDefault(); locked = chip; focus(chip); } });
      });
      document.addEventListener('click', function (e) { if (locked && !e.target.closest('.map-chip')) { locked = null; focus(null); } });
    }
    mountAll();
    // 학습 기록
    paintMarks(); initLessonProgress(); initCoverProgress();
    window.addEventListener('storage', paintMarks);
    window.addEventListener('pageshow', function (ev) { if (ev.persisted) paintMarks(); });
  });
})();
