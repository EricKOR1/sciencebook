/* 일반물리학 2 뉴턴 법칙과 그 응용: 뱅크 커브 — 기울기·마찰 계수·속력에 따라 필요한 정지 마찰력과 미끄러지는 방향 */
Sims.register('u-banked-curve', {
  title: '뱅크 커브 — 이 속력이면 미끄러질까, 어느 쪽으로?',
  caption: '기울기 θ, 정지 마찰 계수 μs, 속력 v를 바꾸어 보자. 왼쪽 단면도는 차가 미끄러지지 않으려면 필요한 정지 마찰력을, 오른쪽 그래프는 그 크기를 수직 항력으로 나눈 값 f/N을 속력에 따라 보여 준다. f/N이 초록 띠(−μs ~ +μs) 안이면 안전하고, 위로 벗어나면 바깥쪽(빗면 위)으로, 아래로 벗어나면 안쪽(빗면 아래)으로 미끄러진다. 설계 속력에서는 마찰이 0이다. 커브 반지름은 150 m(예제 9)로 고정했고, 차는 한 점으로 보았다(g = 9.80 m/s²).',
  init: function (api) {
    var G = 9.80, RAD = 150;
    var st = { deg: 23, mu: 0.3, v: 30 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.35 : 0.52; }, label: '뱅크 커브 단면의 힘과 속력에 따른 필요한 마찰 비율 그래프' });
    var ctx = cv.ctx;
    var rD = api.readout('설계 속력(마찰 0)');
    var rR = api.readout('미끄러지지 않는 속력');
    var rF = api.readout('필요한 f/N');
    var rS = api.readout('판정');

    api.slider({ id: 'u-banked-curve-th', label: '기울기 θ', min: 0, max: 40, step: 0.5, value: st.deg,
      format: function (v) { return v.toFixed(1) + '°'; }, onInput: function (v) { st.deg = v; update(); } });
    api.slider({ id: 'u-banked-curve-mu', label: '정지 마찰 계수 μs', min: 0, max: 1, step: 0.05, value: st.mu,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.mu = v; update(); } });
    api.slider({ id: 'u-banked-curve-v', label: '속력 v', min: 0, max: 50, step: 0.5, value: st.v,
      format: function (v) { return v.toFixed(1) + ' m/s (' + Math.round(v * 3.6) + ' km/h)'; }, onInput: function (v) { st.v = v; update(); } });
    var g = api.group();
    api.button('마른 도로 μs = 0.90', function () { setMu(0.9); }, { parent: g });
    api.button('빙판 μs = 0.10', function () { setMu(0.1); }, { parent: g });
    var muSlider = document.getElementById('u-banked-curve-mu');
    function setMu(m) { muSlider.value = m; muSlider.dispatchEvent(new Event('input')); }

    // 단위 질량당 힘: 수직 항력 n, 필요한 마찰 f(+ = 빗면 아래쪽)
    function forces(v, th) {
      var ac = v * v / RAD;
      return { n: G * Math.cos(th) + ac * Math.sin(th), f: ac * Math.cos(th) - G * Math.sin(th), ac: ac };
    }
    function ratio(v, th) { var F = forces(v, th); return F.f / F.n; }
    function limits(th, mu) {
      var t = Math.tan(th);
      var vmin2 = RAD * G * (t - mu) / (1 + mu * t);
      var vmax = (1 - mu * t) <= 0 ? Infinity : Math.sqrt(RAD * G * (t + mu) / (1 - mu * t));
      return { vd: Math.sqrt(RAD * G * t), vmin: vmin2 > 0 ? Math.sqrt(vmin2) : 0, vmax: vmax };
    }
    function update() {
      var th = st.deg * Math.PI / 180, Lm = limits(th, st.mu), q = ratio(st.v, th);
      rD.set(Lm.vd.toFixed(1) + ' m/s');
      rR.set(Lm.vmin.toFixed(1) + ' ~ ' + (isFinite(Lm.vmax) ? Lm.vmax.toFixed(1) : '∞') + ' m/s');
      rF.set((q >= 0 ? '+' : '−') + Math.abs(q).toFixed(2));
      rS.set(q > st.mu + 1e-9 ? '바깥쪽(위)으로 미끄러짐' : q < -st.mu - 1e-9 ? '안쪽(아래)으로 미끄러짐' : '안전');
      draw();
    }
    function arrow(x1, y1, x2, y2, col, lw, dash) {
      var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy); if (L < 2) return;
      var ux = dx / L, uy = dy / L, hl = Math.min(10, L * 0.45);
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hl, y2 - uy * hl); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - ux * hl - uy * hl * 0.5, y2 - uy * hl + ux * hl * 0.5); ctx.lineTo(x2 - ux * hl + uy * hl * 0.5, y2 - uy * hl - ux * hl * 0.5); ctx.closePath(); ctx.fill();
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var A = narrow ? { x: 0, y: 0, w: w, h: h * 0.5 } : { x: 0, y: 0, w: w * 0.44, h: h };
      var B = narrow ? { x: 0, y: h * 0.52, w: w, h: h * 0.48 } : { x: w * 0.47, y: 0, w: w * 0.53, h: h };
      scene(T, A); graph(T, B);
    }
    function scene(T, r) {
      var th = st.deg * Math.PI / 180, F = forces(st.v, th), q = F.f / F.n;
      var slip = q > st.mu + 1e-9 ? 1 : q < -st.mu - 1e-9 ? -1 : 0;
      var base = r.y + r.h - 34, x0 = r.x + 14, x1 = r.x + r.w - 10;
      var top = base - (x1 - x0) * Math.tan(th);
      ctx.fillStyle = T.figSoftAmber; ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x1, base); ctx.lineTo(x1, top); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('← 커브의 중심 쪽', r.x + 10, r.y + 18);
      ctx.textAlign = 'center'; ctx.fillText('도로 단면 (반지름 150 m)', (x0 + x1) / 2, base + 22);
      // 차
      var s = (x1 - x0) * 0.55, qx = x0 + s, qy = base - s * Math.tan(th);
      var nx = -Math.sin(th), ny = -Math.cos(th), tx = Math.cos(th), ty = -Math.sin(th);
      var cx = qx + nx * 12, cy = qy + ny * 12;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-th);
      ctx.fillStyle = T.figSoftBlue; ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(-24, -12, 48, 24); ctx.fill(); ctx.stroke(); ctx.restore();
      // 힘(단위 질량당, 1 m/s² = k px)
      var k = Math.max(2, Math.min((cy - r.y - 24) / 19, (r.y + r.h - cy - 4) / G, r.w * 0.03));
      var Nx = cx + nx * F.n * k, Ny = cy + ny * F.n * k;
      var fx = cx + (-tx) * F.f * k, fy = cy + (-ty) * F.f * k;  // + 는 빗면 아래(왼쪽 아래)
      var netx = cx - F.ac * k;
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
      arrow(cx, cy, netx, cy, T.figViolet, 3.2);
      arrow(cx, cy, Nx, Ny, T.figGreen, 2.6);
      arrow(cx, cy, cx, cy + G * k, T.figInk, 2.6);
      if (Math.abs(F.f) * k > 2) arrow(cx, cy, fx, fy, slip ? T.figRed : T.figTeal, 2.6, slip ? [5, 4] : null);
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillStyle = T.figGreen; ctx.fillText('N', Nx - 2, Ny - 8);
      ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.fillText('mg', cx + 6, cy + G * k - 2);
      if (Math.abs(F.f) * k > 2) { ctx.fillStyle = slip ? T.figRed : T.figTeal; ctx.textAlign = F.f > 0 ? 'right' : 'left'; ctx.fillText('필요한 f', fx + (F.f > 0 ? -4 : 6), fy + (F.f > 0 ? 14 : -6)); }
      ctx.fillStyle = T.figViolet; ctx.textAlign = 'center';
      if (F.ac * k > 30) ctx.fillText('mv²/r', cx - F.ac * k / 2, cy - 8);
      ctx.restore();
      // 판정
      ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = slip ? T.figRed : T.figGreen;
      ctx.fillText(slip === 1 ? '바깥쪽(빗면 위)으로 미끄러진다' : slip === -1 ? '안쪽(빗면 아래)으로 미끄러진다' : '미끄러지지 않는다', r.x + 10, r.y + 38);
      if (slip) { ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.fillText('필요한 마찰력 > 최대 정지 마찰력 μsN', r.x + 10, r.y + 54); }
    }
    function graph(T, r) {
      var th = st.deg * Math.PI / 180, Lm = limits(th, st.mu);
      var L = r.x + 46, R = r.x + r.w - 12, Tp = r.y + 24, B = r.y + r.h - 40;
      var VMAX = 50, QLO = -1, QHI = 1.2;
      var sx = function (v) { return L + (R - L) * v / VMAX; }, sy = function (q) { return B - (B - Tp) * (q - QLO) / (QHI - QLO); };
      // 안전 띠
      ctx.fillStyle = T.figSoftGreen; ctx.fillRect(L, sy(Math.min(st.mu, QHI)), R - L, sy(-st.mu) - sy(Math.min(st.mu, QHI)));
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      [-1, -0.5, 0, 0.5, 1].forEach(function (q) { ctx.beginPath(); ctx.moveTo(L, sy(q)); ctx.lineTo(R, sy(q)); ctx.stroke(); ctx.fillText(q.toFixed(1).replace('-', '−'), L - 5, sy(q) + 4); });
      ctx.textAlign = 'center';
      [0, 10, 20, 30, 40, 50].forEach(function (v) { ctx.fillText(v, sx(v), B + 14); });
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(L, sy(0)); ctx.lineTo(R, sy(0)); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('속력 v (m/s)', (L + R) / 2, B + 30);
      ctx.save(); ctx.translate(r.x + 11, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('필요한 f / N', 0, 0); ctx.restore();
      ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figGreen;
      ctx.fillText('안전 (|f/N| ≤ μs)', L + 6, sy(Math.min(st.mu, QHI)) + 13);
      ctx.fillStyle = T.figMuted;
      ctx.fillText('↑ 바깥쪽으로 미끄러짐', L + 6, Tp - 8);
      ctx.fillText('↓ 안쪽으로 미끄러짐', L + 6, B - 6);
      // 곡선
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, R - L, B - Tp); ctx.clip();
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.4; ctx.beginPath();
      for (var i = 0; i <= 200; i++) { var v = VMAX * i / 200, y = sy(ratio(v, th)); if (i) ctx.lineTo(sx(v), y); else ctx.moveTo(sx(v), y); }
      ctx.stroke(); ctx.restore();
      // 기준 속력
      function vline(v, col, lab, row) {
        if (!(v >= 0 && v <= VMAX)) return;
        ctx.setLineDash([4, 4]); ctx.strokeStyle = col; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(sx(v), Tp); ctx.lineTo(sx(v), B); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = col; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(lab, Math.min(Math.max(sx(v), L + 18), R - 18), sy(-0.62) + row * 14);
      }
      if (Lm.vmin > 0) vline(Lm.vmin, T.figRed, 'v_min', 0);
      vline(Lm.vd, T.figMuted, '설계', 1);
      if (isFinite(Lm.vmax)) vline(Lm.vmax, T.figRed, 'v_max', 2);
      // 현재 점
      var q = ratio(st.v, th), slip = Math.abs(q) > st.mu + 1e-9;
      var qy = sy(Math.max(QLO, Math.min(QHI, q)));
      ctx.beginPath(); ctx.arc(sx(st.v), qy, 6, 0, Math.PI * 2);
      ctx.fillStyle = slip ? T.figRed : T.figGreen; ctx.fill(); ctx.strokeStyle = T.figPanel; ctx.lineWidth = 2; ctx.stroke();
    }
    api.onResize(draw);
    update();
  },
});
