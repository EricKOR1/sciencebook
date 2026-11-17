/* 일반물리학 5 강제 진동과 공명: 구동 진동수와 품질 인자에 따른 정상 상태 진폭·위상, 과도 응답 */
Sims.register('u-driven-oscillator', {
  title: '강제 감쇠 진동자 — 공명 곡선과 위상 지연',
  caption: '고유 진동수 1 Hz인 용수철 진동자에 F₀cos ω_d t를 계속 가한다. 구동 진동수 ω_d/ω₀를 바꾸어 보자. 처음의 불규칙한 흔들림(과도 응답)이 감쇠로 사라지면 물체는 외력의 진동수로 진동하고, 그 진폭과 위상 지연은 아래 두 그래프의 점과 같아진다. ω_d가 ω₀에 가까우면 진폭이 정적 변형 F₀/k의 약 Q배가 되고(공명) 변위는 외력보다 1/4주기(90°) 늦으며, 감쇠가 작을수록(Q가 클수록) 공명 봉우리가 높고 좁아지고 과도 응답이 오래 남는다. 진폭은 정적 변형 F₀/k를 1로 잡아 나타냈고, 저항력은 속도에 비례(−bv)한다고 가정했다.',
  init: function (api) {
    var W0 = 2 * Math.PI, WIN = 6;
    var st = { r: 0.6, Q: 8, t: 0, x: 0, v: 0, hist: [] };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.75 : 0.66; }, label: '용수철 진동자, 변위와 외력의 시간 그래프, 공명 곡선과 위상 그래프' });
    var ctx = cv.ctx;
    var rA = api.readout('정상 상태 진폭 A');
    var rD = api.readout('위상 지연 δ');
    var rQ = api.readout('공명 진폭 ≈ Q × F₀/k');

    api.slider({ id: 'u-driven-oscillator-w', label: '구동 진동수 ω_d / ω₀', min: 0.2, max: 2.0, step: 0.01, value: st.r,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.r = v; refresh(); } });
    api.slider({ id: 'u-driven-oscillator-q', label: '품질 인자 Q (감쇠가 작을수록 큼)', min: 1, max: 30, step: 0.5, value: st.Q,
      format: function (v) { return v.toFixed(1); }, onInput: function (v) { st.Q = v; refresh(); } });
    var g = api.group();
    api.button('정지 상태에서 다시', function () { st.t = 0; st.x = 0; st.v = 0; st.hist = []; refresh(); if (!api.reduced) loop.play(); }, { primary: true, parent: g });
    api.button('공명에 맞추기', function () { var s = api.controls.querySelector('#u-driven-oscillator-w'); s.value = 1; s.dispatchEvent(new Event('input')); }, { parent: g });

    function amp(r, Q) { return 1 / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(r / Q, 2)); }
    function lag(r, Q) { return Math.atan2(r / Q, 1 - r * r); }
    function amax(Q) { var m = 0; for (var r = 0.2; r <= 2.0001; r += 0.005) m = Math.max(m, amp(r, Q)); return m; }

    function deriv(t, x, v) {
      var wd = st.r * W0;
      return [v, W0 * W0 * (Math.cos(wd * t) - x) - (W0 / st.Q) * v];
    }
    var loop = api.loop(function (dt) {
      var n = Math.ceil(dt / 0.002), h = dt / n;
      for (var i = 0; i < n; i++) {
        var t = st.t, x = st.x, v = st.v;
        var k1 = deriv(t, x, v), k2 = deriv(t + h / 2, x + k1[0] * h / 2, v + k1[1] * h / 2);
        var k3 = deriv(t + h / 2, x + k2[0] * h / 2, v + k2[1] * h / 2), k4 = deriv(t + h, x + k3[0] * h, v + k3[1] * h);
        st.x += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
        st.v += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
        st.t += h;
      }
      st.hist.push([st.t, st.x, Math.cos(st.r * W0 * st.t)]);
      while (st.hist.length && st.hist[0][0] < st.t - WIN) st.hist.shift();
      draw();
    });

    function refresh() {
      var A = amp(st.r, st.Q), d = lag(st.r, st.Q);
      rA.set(A.toFixed(2) + ' × F₀/k');
      rD.set((d * 180 / Math.PI).toFixed(0) + '° (' + (d / (2 * Math.PI)).toFixed(2) + ' 주기)');
      rQ.set(amax(st.Q).toFixed(1) + ' × F₀/k');
      draw();
    }

    function draw() {
      var T = api.tokens(), W = cv.w, H = cv.h, narrow = W < 560;
      ctx.clearRect(0, 0, W, H);
      var Am = amax(st.Q), A = amp(st.r, st.Q), d = lag(st.r, st.Q);
      var spring, chart, ampB, phB;
      if (narrow) {
        spring = { x: 0, y: 0, w: W, h: H * 0.17 }; chart = { x: 0, y: H * 0.19, w: W, h: H * 0.27 };
        ampB = { x: 0, y: H * 0.47, w: W, h: H * 0.27 }; phB = { x: 0, y: H * 0.75, w: W, h: H * 0.25 };
      } else {
        spring = { x: 0, y: 0, w: W * 0.3, h: H * 0.44 }; chart = { x: W * 0.32, y: 0, w: W * 0.68, h: H * 0.44 };
        ampB = { x: 0, y: H * 0.48, w: W * 0.5, h: H * 0.52 }; phB = { x: W * 0.52, y: H * 0.48, w: W * 0.48, h: H * 0.52 };
      }
      // 현재 변위(감소 움직임 설정이면 정상 상태 식)
      var xNow = api.reduced ? A * Math.cos(-d) : st.x, fNow = api.reduced ? 1 : Math.cos(st.r * W0 * st.t);
      // 1) 용수철과 물체
      var wy = spring.y + spring.h * 0.55, wallX = spring.x + 10, eqX = spring.x + spring.w * 0.6;
      var pxPer = (spring.w * 0.3) / Am, mx = eqX + xNow * pxPer, bs = Math.min(26, spring.h * 0.35);
      ctx.fillStyle = T.figLine; ctx.fillRect(wallX - 6, wy - bs * 1.2, 6, bs * 2.4);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.6; ctx.beginPath();
      var n = 12, sx0 = wallX, sx1 = mx - bs / 2;
      ctx.moveTo(sx0, wy);
      for (var i = 1; i < n; i++) ctx.lineTo(sx0 + (sx1 - sx0) * i / n, wy + (i % 2 ? -7 : 7));
      ctx.lineTo(sx1, wy); ctx.stroke();
      ctx.fillStyle = T.figSoftBlue; ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2;
      ctx.fillRect(mx - bs / 2, wy - bs / 2, bs, bs); ctx.strokeRect(mx - bs / 2, wy - bs / 2, bs, bs);
      ctx.setLineDash([3, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(eqX, wy - bs); ctx.lineTo(eqX, wy + bs); ctx.stroke(); ctx.setLineDash([]);
      arrow(mx, wy - bs / 2 - 8, mx + fNow * 28, wy - bs / 2 - 8, T.figGreen);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('평형 위치', eqX, wy + bs + 14);
      ctx.fillStyle = T.figGreen; ctx.textAlign = 'left'; ctx.fillText('외력 F(t)', spring.x + 6, spring.y + 14);
      // 2) 시간 그래프
      var L = chart.x + 40, R = chart.x + chart.w - 10, Tp = chart.y + 22, B = chart.y + chart.h - 20, mid = (Tp + B) / 2;
      var ys = (B - Tp) / 2 / (Am * 1.1);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(L, mid); ctx.lineTo(R, mid); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      ctx.fillText('+' + Am.toFixed(1), L - 4, mid - Am * ys + 4); ctx.fillText('−' + Am.toFixed(1), L - 4, mid + Am * ys + 4);
      ctx.fillText('0', L - 4, mid + 4);
      ctx.setLineDash([2, 4]); ctx.strokeStyle = T.figLine;
      [A, -A].forEach(function (a) { ctx.beginPath(); ctx.moveTo(L, mid - a * ys); ctx.lineTo(R, mid - a * ys); ctx.stroke(); });
      ctx.setLineDash([]);
      var tx = function (t) { return R - (st.t - t) / WIN * (R - L); };
      var fs = (B - Tp) / 2 * 0.45;
      if (api.reduced) {
        plotFn(function (t) { return Math.cos(st.r * W0 * t); }, fs, T.figGreen, 1.6);
        plotFn(function (t) { return A * Math.cos(st.r * W0 * t - d); }, ys, T.figBlue, 2.4);
      } else {
        plotHist(2, fs, T.figGreen, 1.6); plotHist(1, ys, T.figBlue, 2.4);
      }
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figBlue; ctx.fillText('변위 x / (F₀/k)', L + 4, chart.y + 14);
      ctx.fillStyle = T.figGreen; ctx.fillText('외력 F (모양만)', L + (narrow ? 110 : 120), chart.y + 14);
      ctx.fillStyle = T.figMuted; if (narrow) { ctx.textAlign = 'left'; ctx.fillText('점선: 정상 상태 진폭 ±A', L, B + 14); } else { ctx.textAlign = 'right'; ctx.fillText('점선: 정상 상태 진폭 ±A', R, chart.y + 14); }
      ctx.textAlign = 'right';
      ctx.fillText('최근 6초', R, B + 14);
      // 3) 공명 곡선
      plotPanel(ampB, '정상 상태 진폭 A / (F₀/k)', 0, Am * 1.12, function (r) { return amp(r, st.Q); }, A, T.figBlue,
        [0, Math.round(Am / 2), Math.round(Am)].filter(function (v, i, a) { return a.indexOf(v) === i; }), function (v) { return String(v); });
      // 4) 위상 곡선
      plotPanel(phB, '위상 지연 δ (변위가 외력보다 늦는 각)', 0, Math.PI, function (r) { return lag(r, st.Q); }, d, T.figViolet,
        [0, Math.PI / 2, Math.PI], function (v) { return Math.round(v * 180 / Math.PI) + '°'; });

      function plotHist(idx, sc, col, lw) {
        if (st.hist.length < 2) return;
        ctx.beginPath();
        st.hist.forEach(function (p, i) { var X = tx(p[0]), Y = mid - p[idx] * sc; if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); });
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
      }
      function plotFn(fn, sc, col, lw) {
        ctx.beginPath();
        for (var i = 0; i <= 300; i++) { var t = st.t - WIN + WIN * i / 300, X = tx(t), Y = mid - fn(t) * sc; if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
      }
      function plotPanel(b, title, y0, y1, fn, cur, col, ticks, tfmt) {
        var L2 = b.x + 44, R2 = b.x + b.w - 10, T2 = b.y + 24, B2 = b.y + b.h - 30;
        var X = function (r) { return L2 + (r - 0) / 2.0 * (R2 - L2); }, Y = function (v) { return B2 - (v - y0) / (y1 - y0) * (B2 - T2); };
        ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText(title, b.x + 6, b.y + 12);
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(L2, T2 - 4); ctx.lineTo(L2, B2); ctx.lineTo(R2, B2); ctx.stroke();
        ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
        ticks.forEach(function (v) {
          ctx.textAlign = 'right'; ctx.fillText(tfmt(v), L2 - 4, Y(v) + 4);
          ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L2, Y(v)); ctx.lineTo(R2, Y(v)); ctx.stroke();
        });
        ctx.textAlign = 'center';
        [0, 0.5, 1, 1.5, 2].forEach(function (r) { ctx.fillText(String(r), X(r), B2 + 14); });
        ctx.font = '11px ' + T.fontBody; ctx.fillText('ω_d / ω₀', (L2 + R2) / 2, B2 + 27);
        ctx.setLineDash([3, 4]); ctx.strokeStyle = T.figMuted;
        ctx.beginPath(); ctx.moveTo(X(1), T2); ctx.lineTo(X(1), B2); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath();
        for (var r = 0; r <= 2.0001; r += 0.005) { var yy = Y(fn(r)); if (r === 0) ctx.moveTo(X(r), yy); else ctx.lineTo(X(r), yy); }
        ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.stroke();
        ctx.beginPath(); ctx.arc(X(st.r), Y(cur), 5.5, 0, Math.PI * 2); ctx.fillStyle = T.figAmber; ctx.fill();
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }
    function arrow(x1, y1, x2, y2, col) {
      var dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy); if (l < 3) return;
      var ux = dx / l, uy = dy / l, hd = Math.min(8, l * 0.5);
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hd, y2 - uy * hd); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - ux * hd - uy * hd * 0.5, y2 - uy * hd + ux * hd * 0.5);
      ctx.lineTo(x2 - ux * hd + uy * hd * 0.5, y2 - uy * hd - ux * hd * 0.5); ctx.closePath(); ctx.fill();
    }
    api.onResize(draw);
    refresh();
  },
});
