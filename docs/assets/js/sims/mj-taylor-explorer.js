/* 수학 도구 2 ⑥ 테일러 급수: 함수와 n차 테일러 다항식을 겹쳐 그리고, 고른 x에서 실제 오차와 버린 첫 항을 비교한다 */
Sims.register('mj-taylor-explorer', {
  title: '테일러 다항식 탐색기 — 차수, 전개점, 수렴 범위',
  caption: '함수를 고르고 전개점 a와 차수 n을 바꿔 보자. 그래프를 누르거나 끌면(또는 그래프를 선택하고 ←/→ 키) 그 x에서의 실제 오차 |f − Pₙ|와 버린 첫 항(0이 아닌 첫 항)의 크기가 나란히 나온다. 수렴 범위 안에서는 두 값이 비슷하고 차수를 올릴수록 줄지만, ln(1 + x)와 이항 전개는 |x − a| ≥ 1 + a인 회색 영역에서 차수를 올릴수록 더 크게 벗어난다(α가 0 이상의 정수이면 다항식이라 유한 항에서 정확해진다). 계산은 모두 정확한 도함수 공식으로 한다.',
  init: function (api) {
    var st = { fn: 'ln', a: 0, n: 3, alpha: 0.5, x0: 0.6 };
    function binomInt() { return st.alpha >= 0 && Math.abs(st.alpha - Math.round(st.alpha)) < 1e-9; }
    var F = {
      exp: { name: 'eˣ', xr: [-4, 4], yr: [-2, 10],
        f: function (x) { return Math.exp(x); },
        c: function (k, a) { var v = Math.exp(a); for (var j = 2; j <= k; j++) v /= j; return v; },
        R: function () { return Infinity; }, ok: function () { return true; } },
      sin: { name: 'sin x', xr: [-7, 7], yr: [-2.5, 2.5],
        f: function (x) { return Math.sin(x); },
        c: function (k, a) { var v = Math.sin(a + k * Math.PI / 2); for (var j = 2; j <= k; j++) v /= j; return v; },
        R: function () { return Infinity; }, ok: function () { return true; } },
      ln: { name: 'ln(1 + x)', xr: [-1.2, 3.2], yr: [-3, 2.5],
        f: function (x) { return Math.log(1 + x); },
        c: function (k, a) { return k === 0 ? Math.log(1 + a) : (k % 2 ? 1 : -1) / (k * Math.pow(1 + a, k)); },
        R: function (a) { return 1 + a; }, ok: function (x) { return x > -1; } },
      binom: { name: '(1 + x)^α', xr: [-1.2, 3.2], yr: [-2, 6],
        f: function (x) { return Math.pow(1 + x, st.alpha); },
        c: function (k, a) { var v = Math.pow(1 + a, st.alpha - k); for (var j = 0; j < k; j++) v *= (st.alpha - j) / (j + 1); return v; },
        R: function (a) { return binomInt() ? Infinity : 1 + a; },
        ok: function (x) { return binomInt() ? true : x > -1; } },
    };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.9 : 0.52; }, label: '함수와 테일러 다항식 그래프' });
    var ctx = cv.ctx; cv.canvas.tabIndex = 0; cv.canvas.style.touchAction = 'none'; cv.canvas.style.cursor = 'crosshair';
    var rX = api.readout('x = '), rF = api.readout('f(x) '), rP = api.readout('Pₙ(x) '), rE = api.readout('오차 |f − Pₙ| '), rD = api.readout('버린 첫 항 ');

    var g = api.group();
    var keys = ['exp', 'sin', 'ln', 'binom'];
    var btns = keys.map(function (k) {
      return api.button(F[k].name, function () { setFn(k); }, { toggle: true, pressed: k === st.fn, parent: g });
    });
    var sA = api.slider({ id: 'mj-taylor-explorer-a', label: '전개점 a', min: -0.5, max: 2, step: 0.1, value: st.a,
      format: function (v) { return v.toFixed(1); }, onInput: function (v) { st.a = v; update(); } });
    var sN = api.slider({ id: 'mj-taylor-explorer-n', label: '차수 n', min: 0, max: 12, step: 1, value: st.n,
      format: function (v) { return String(v); }, onInput: function (v) { st.n = v; update(); } });
    var sAl = api.slider({ id: 'mj-taylor-explorer-alpha', label: '이항 전개의 α', min: -2, max: 3, step: 0.5, value: st.alpha,
      format: function (v) { return v.toFixed(1).replace('-', '−'); }, onInput: function (v) { st.alpha = v; update(); } });

    function setFn(k) {
      st.fn = k;
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', keys[i] === k ? 'true' : 'false'); });
      sAl.input.disabled = k !== 'binom';
      var xr = F[k].xr; if (st.x0 < xr[0] || st.x0 > xr[1]) st.x0 = 0.6;
      update();
    }
    function coefs() { var c = [], fo = F[st.fn]; for (var k = 0; k <= st.n + 6; k++) c.push(fo.c(k, st.a)); return c; }
    function P(c, x) { var s = 0, d = x - st.a; for (var k = st.n; k >= 0; k--) s = s * d + c[k]; return s; }
    function fmt(v) {
      if (!isFinite(v)) return '정의 안 됨';
      var a = Math.abs(v);
      if (a !== 0 && (a < 1e-3 || a >= 1e4)) return v.toExponential(2).replace('e', '×10^').replace(/-/g, '−');
      return v.toPrecision(4).replace(/-/g, '−');
    }
    function L() {
      var w = cv.w, h = cv.h;
      return { l: 46, r: w - 14, t: 16, b: h - 34 };
    }
    function update() { draw(); readouts(); }
    function readouts() {
      var fo = F[st.fn], c = coefs(), x = st.x0;
      rX.set(x.toFixed(2).replace('-', '−'));
      var fx = fo.ok(x) ? fo.f(x) : NaN, px = P(c, x);
      rF.set(fmt(fx)); rP.set(fmt(px));
      rE.set(isFinite(fx) ? fmt(Math.abs(fx - px)) : '–');
      var d = '0 (남은 항 없음)';
      for (var k = st.n + 1; k <= st.n + 6; k++) { if (Math.abs(c[k]) > 1e-14) { d = fmt(Math.abs(c[k] * Math.pow(x - st.a, k))) + ' (' + k + '차 항)'; break; } }
      rD.set(d);
    }
    function draw() {
      var T = api.tokens(), fo = F[st.fn], lay = L(), w = cv.w, h = cv.h;
      var xr = fo.xr, yr = fo.yr;
      var X = function (x) { return lay.l + (x - xr[0]) / (xr[1] - xr[0]) * (lay.r - lay.l); };
      var Y = function (y) { return lay.b - (y - yr[0]) / (yr[1] - yr[0]) * (lay.b - lay.t); };
      ctx.clearRect(0, 0, w, h);
      // 수렴 범위 밖(회색)
      var R = fo.R(st.a);
      ctx.fillStyle = T.figLine; ctx.globalAlpha = 0.22;
      if (isFinite(R)) {
        var lo = st.a - R, hi = st.a + R;
        if (lo > xr[0]) ctx.fillRect(X(xr[0]), lay.t, X(lo) - X(xr[0]), lay.b - lay.t);
        if (hi < xr[1]) ctx.fillRect(X(hi), lay.t, X(xr[1]) - X(hi), lay.b - lay.t);
      }
      ctx.globalAlpha = 1;
      // 격자와 축
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      var step = (xr[1] - xr[0]) > 8 ? 2 : (xr[1] - xr[0]) > 5 ? 1 : 0.5; if (w < 560) step *= 2;
      ctx.textAlign = 'center';
      for (var gx = Math.ceil(xr[0] / step) * step; gx <= xr[1] + 1e-9; gx += step) {
        ctx.beginPath(); ctx.moveTo(X(gx), lay.t); ctx.lineTo(X(gx), lay.b); ctx.stroke();
        ctx.fillText(String(Math.round(gx * 10) / 10).replace('-', '−'), X(gx), lay.b + 14);
      }
      var ys = (yr[1] - yr[0]) > 8 ? 2 : 1;
      ctx.textAlign = 'right';
      for (var gy = Math.ceil(yr[0] / ys) * ys; gy <= yr[1] + 1e-9; gy += ys) {
        ctx.beginPath(); ctx.moveTo(lay.l, Y(gy)); ctx.lineTo(lay.r, Y(gy)); ctx.stroke();
        ctx.fillText(String(gy).replace('-', '−'), lay.l - 5, Y(gy) + 4);
      }
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(lay.l, Y(0)); ctx.lineTo(lay.r, Y(0)); ctx.moveTo(X(0), lay.t); ctx.lineTo(X(0), lay.b); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('x', (lay.l + lay.r) / 2, lay.b + 29);
      if (isFinite(R)) {
        ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
        var hx = st.a + R;
        if (hx < xr[1] - 0.3) ctx.fillText('수렴 범위 밖', X(hx) + 6, lay.t + 14);
        if (st.fn !== 'exp' && st.fn !== 'sin' && -1 > xr[0]) { ctx.textAlign = 'right'; }
      }
      // 곡선
      ctx.save(); ctx.beginPath(); ctx.rect(lay.l, lay.t, lay.r - lay.l, lay.b - lay.t); ctx.clip();
      var c = coefs(), N = 500, i, x, y, pen;
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2.6; ctx.beginPath(); pen = false;
      for (i = 0; i <= N; i++) {
        x = xr[0] + (xr[1] - xr[0]) * i / N;
        if (!fo.ok(x)) { pen = false; continue; }
        y = fo.f(x); if (!isFinite(y)) { pen = false; continue; }
        y = Math.max(yr[0] - 5, Math.min(yr[1] + 5, y));
        if (pen) ctx.lineTo(X(x), Y(y)); else { ctx.moveTo(X(x), Y(y)); pen = true; }
      }
      ctx.stroke();
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.2; ctx.setLineDash([7, 4]); ctx.beginPath();
      for (i = 0; i <= N; i++) {
        x = xr[0] + (xr[1] - xr[0]) * i / N; y = Math.max(yr[0] - 5, Math.min(yr[1] + 5, P(c, x)));
        if (i) ctx.lineTo(X(x), Y(y)); else ctx.moveTo(X(x), Y(y));
      }
      ctx.stroke(); ctx.setLineDash([]);
      // 고른 x
      var fx = fo.ok(st.x0) ? fo.f(st.x0) : NaN, px = P(c, st.x0);
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(X(st.x0), lay.t); ctx.lineTo(X(st.x0), lay.b); ctx.stroke(); ctx.setLineDash([]);
      if (isFinite(fx)) {
        ctx.strokeStyle = T.figAmber; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(X(st.x0), Y(fx)); ctx.lineTo(X(st.x0), Y(px)); ctx.stroke();
        dot(X(st.x0), Y(fx), T.figInk);
      }
      dot(X(st.x0), Y(px), T.figRed);
      ctx.restore();
      // 전개점
      if (fo.ok(st.a)) { dot(X(st.a), Y(fo.f(st.a)), T.figGreen); ctx.fillStyle = T.figGreen; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('a', X(st.a) + 6, Y(fo.f(st.a)) + 16); }
      // 범례
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      var lx = lay.l + 10, ly = lay.t + 14;
      ctx.fillStyle = T.figPanel; ctx.globalAlpha = 0.85; ctx.fillRect(lx - 4, ly - 12, 168, 40); ctx.globalAlpha = 1;
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(lx, ly - 4); ctx.lineTo(lx + 24, ly - 4); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.fillText('f(x) = ' + fo.name.replace('α', String(st.alpha)), lx + 30, ly);
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.2; ctx.setLineDash([7, 4]); ctx.beginPath(); ctx.moveTo(lx, ly + 15); ctx.lineTo(lx + 24, ly + 15); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figRed; ctx.fillText(st.n + '차 테일러 다항식 Pₙ', lx + 30, ly + 19);
      function dot(px1, py1, col) { ctx.beginPath(); ctx.arc(px1, py1, 4.5, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); }
    }
    function pick(ev) {
      var r = cv.canvas.getBoundingClientRect(), lay = L(), xr = F[st.fn].xr;
      var px = ev.clientX - r.left;
      var x = xr[0] + (px - lay.l) / (lay.r - lay.l) * (xr[1] - xr[0]);
      st.x0 = Math.max(xr[0], Math.min(xr[1], Math.round(x * 100) / 100)); update();
    }
    var dragging = false;
    cv.canvas.addEventListener('pointerdown', function (e) { dragging = true; try { cv.canvas.setPointerCapture(e.pointerId); } catch (er) {} pick(e); });
    cv.canvas.addEventListener('pointermove', function (e) { if (dragging) pick(e); });
    cv.canvas.addEventListener('pointerup', function () { dragging = false; });
    cv.canvas.addEventListener('keydown', function (e) {
      var xr = F[st.fn].xr, d = (xr[1] - xr[0]) / 100;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        st.x0 = Math.max(xr[0], Math.min(xr[1], st.x0 + (e.key === 'ArrowLeft' ? -d : d))); update(); e.preventDefault();
      }
    });
    api.onResize(draw); api.onTheme(draw);
    setFn(st.fn);
  },
});
