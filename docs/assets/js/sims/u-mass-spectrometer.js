/* 일반물리학 9 전류·회로와 자기장: 속도 선택기(교차한 E, B)와 질량 분석기(B′에서 반원 운동) — 탄소 동위 원소 이온 */
Sims.register('u-mass-spectrometer', {
  title: '속도 선택기와 질량 분석기 — 탄소 동위 원소 가르기',
  caption: '위에서 여러 속력(약 1.5×10⁵~2.5×10⁵ m/s)의 1가 탄소 이온이 들어온다. 속도 선택기(전기장 E와 자기장 B가 교차)에서는 qE = qvB인 v = E/B의 이온만 곧게 지나 좁은 틈을 통과하고, 더 빠르거나 느린 이온은 휘어 판에 부딪힌다. 아래 자기장 B′에서는 반지름 r = mv/(qB′)인 반원을 그려 검출판의 2r 위치에 닿으므로 무거운 동위 원소일수록 멀리 떨어진다. E, B, B′를 바꿔 위치와 간격을 비교해 보자(예제 10: E = 2.0×10⁴ V/m, B = 0.10 T, B′ = 0.20 T). 선택기 안의 옆 방향 휘어짐은 8배로 과장했고, 나머지는 실제 비율이며 중력은 무시했다.',
  init: function (api) {
    var U = 1.661e-27, QE = 1.602e-19, LS = 0.10, GAP = 0.005, SLIT = 0.0005, EXX = 8, DET = 0.46;
    var species = [{ n: '¹²C⁺', A: 12, on: true }, { n: '¹³C⁺', A: 13, on: true }, { n: '¹⁴C⁺', A: 14, on: false }];
    var st = { E: 2.0e4, B: 0.10, B2: 0.20 };
    var parts = [], hits = [], spawnT = 0;
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.62; }, label: '속도 선택기와 질량 분석기에서 이온의 궤적' });
    var ctx = cv.ctx;

    var rV = api.readout('통과하는 속력 v = E/B');
    var rR = api.readout('반지름 r = mv/(qB′)');
    var rD = api.readout('¹²C⁺–¹³C⁺ 검출 위치 차');

    api.slider({ id: 'u-mass-spectrometer-e', label: '선택기 전기장 E', min: 1.0, max: 3.0, step: 0.1, value: 2.0,
      format: function (v) { return v.toFixed(1) + '×10⁴ V/m'; }, onInput: function (v) { st.E = v * 1e4; changed(); } });
    api.slider({ id: 'u-mass-spectrometer-b', label: '선택기 자기장 B', min: 0.05, max: 0.20, step: 0.005, value: 0.10,
      format: function (v) { return v.toFixed(3) + ' T'; }, onInput: function (v) { st.B = v; changed(); } });
    api.slider({ id: 'u-mass-spectrometer-b2', label: '분석기 자기장 B′', min: 0.10, max: 0.40, step: 0.01, value: 0.20,
      format: function (v) { return v.toFixed(2) + ' T'; }, onInput: function (v) { st.B2 = v; changed(); } });
    var g = api.group();
    var btns = species.map(function (s, i) {
      return api.button(s.n, function (b) { s.on = !s.on; if (!species.some(function (x) { return x.on; })) s.on = true; b.setAttribute('aria-pressed', s.on ? 'true' : 'false'); changed(); }, { toggle: true, pressed: s.on, parent: g });
    });
    function changed() { parts = []; hits = []; draw(); }

    // 한 이온의 궤적(실제 좌표, m)을 미리 계산한다. 선택기: y 0.12 → 0.02(아래로), 틈: y = 0, 분석기: y < 0
    function trajectory(A, v) {
      var m = A * U, qm = QE / m, x = 0, y = LS + 0.02, vx = 0, vy = -v, pts = [[x, y]], n = 160, dt = LS / v / n, fate = 'pass';
      for (var i = 0; i < n; i++) {
        var ax = qm * (-st.E - vy * st.B), ay = qm * (vx * st.B);
        vx += ax * dt; vy += ay * dt; x += vx * dt; y += vy * dt;
        if (Math.abs(x) > GAP) { fate = 'plate'; x = Math.sign(x) * GAP; pts.push([x, y]); return { pts: pts, fate: fate }; }
        if (i % 4 === 3) pts.push([x, y]);
      }
      // 판 끝(y = 0.02)에서 틈(y = 0)까지 직진
      var tt = (y - 0) / -vy; x += vx * tt; y = 0; pts.push([x, y]);
      if (Math.abs(x) > SLIT) return { pts: pts, fate: 'slit' };
      var w = QE * st.B2 / m, cx = x - vy / w, cy = y + vx / w, r = Math.hypot(x - cx, y - cy), a0 = Math.atan2(y - cy, x - cx);
      for (var k = 1; k <= 90; k++) { var a = a0 + Math.PI * k / 90; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
      var land = pts[pts.length - 1][0];
      return { pts: pts, fate: land > DET ? 'miss' : 'hit', land: land, r: r };
    }
    var loop = api.loop(function (dt) {
      spawnT += dt;
      var on = species.filter(function (s) { return s.on; });
      while (spawnT > 0.09) {
        spawnT -= 0.09;
        var s = on[Math.floor(Math.random() * on.length)], v = 2.0e5 * (0.75 + 0.5 * Math.random());
        var tr = trajectory(s.A, v); tr.sp = species.indexOf(s); tr.p = 0; parts.push(tr);
      }
      parts.forEach(function (p) {
        p.p += dt * 95;   // 점 개수/초
        if (p.p >= p.pts.length - 1 && !p.done) { p.done = true; if (p.fate === 'hit') { hits.push([p.land, p.sp]); if (hits.length > 150) hits.shift(); } }
      });
      parts = parts.filter(function (p) { return !p.done || p.p < p.pts.length + 25; });
      parts.forEach(function (p) { if (p.done) p.p += 0; });
      draw();
    });

    function view() {
      var w = cv.w, h = cv.h, x0 = -0.05, x1 = DET + 0.02, y0 = -0.25, y1 = 0.15;
      var s = Math.min((w - 20) / (x1 - x0), (h - 16) / (y1 - y0)), ox = (w - s * (x1 - x0)) / 2 - s * x0, oy = 8 + s * y1;
      return { s: s, X: function (x, yy) { return ox + s * (yy > 0 ? x * EXX : x); }, Y: function (y) { return oy - s * y; } };
    }
    var COL = function (T) { return [T.figBlue, T.figRed, T.figGreen]; };
    function draw() {
      var T = api.tokens(), V = view(), cols = COL(T), vsel = st.E / st.B;
      ctx.clearRect(0, 0, cv.w, cv.h);
      // 분석기 영역(B′, 종이 면으로 들어감)
      var ax0 = V.X(-0.03, -1), ax1 = V.X(DET, -1), ay0 = V.Y(0), ay1 = V.Y(-0.24);
      ctx.fillStyle = T.figSoftViolet; ctx.globalAlpha = 0.55; ctx.fillRect(ax0, ay0, ax1 - ax0, ay1 - ay0); ctx.globalAlpha = 1;
      ctx.fillStyle = T.figViolet; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      for (var gx = 0; gx < 8; gx++) for (var gy = 0; gy < 3; gy++) ctx.fillText('×', ax0 + (gx + 0.5) * (ax1 - ax0) / 8, ay0 + (gy + 0.6) * (ay1 - ay0) / 3);
      ctx.textAlign = 'left'; ctx.font = '600 12px ' + T.fontBody; ctx.fillText('B′ (종이 면으로 들어감)', ax0 + 6, ay1 - 8);
      // 선택기
      var sx0 = V.X(-GAP, 1), sx1 = V.X(GAP, 1), sy0 = V.Y(LS + 0.02), sy1 = V.Y(0.02);
      ctx.fillStyle = T.figSoftAmber; ctx.globalAlpha = 0.6; ctx.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0); ctx.globalAlpha = 1;
      ctx.fillStyle = T.figBlue; ctx.fillRect(sx0 - 6, sy0, 6, sy1 - sy0); ctx.fillStyle = T.figRed; ctx.fillRect(sx1, sy0, 6, sy1 - sy0);
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillStyle = T.figBlue; ctx.fillText('−', sx0 - 9, (sy0 + sy1) / 2);
      ctx.textAlign = 'left'; ctx.fillStyle = T.figRed; ctx.fillText('+', sx1 + 9, (sy0 + sy1) / 2);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('속도 선택기: E ←, B ⊗', sx1 + 22, sy0 + 12);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('(옆 방향 8배 과장)', sx1 + 22, sy0 + 28);
      ctx.fillText('이온원 ↓', sx1 + 22, V.Y(LS + 0.03));
      // 검출판(y = 0)과 틈
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(V.X(-0.04, -1), V.Y(0)); ctx.lineTo(V.X(-0.003, -1), V.Y(0)); ctx.moveTo(V.X(0.003, -1), V.Y(0)); ctx.lineTo(V.X(DET, -1), V.Y(0)); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText('검출판', V.X(DET, -1), V.Y(0) - 8);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      for (var cm = 10; cm <= 40; cm += 10) { var tx = V.X(cm / 100, -1); ctx.fillRect(tx - 0.5, V.Y(0) + 2, 1, 6); ctx.fillText(cm + ' cm', tx, V.Y(0) + 19); }
      // 선택 속력 이온의 예상 경로(점선)
      species.forEach(function (s, i) {
        if (!s.on) return;
        var tr = trajectory(s.A, vsel);
        ctx.setLineDash([5, 4]); ctx.strokeStyle = cols[i]; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.8;
        path(tr.pts); ctx.setLineDash([]); ctx.globalAlpha = 1;
        if (tr.fate === 'hit') { ctx.fillStyle = cols[i]; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText(s.n, V.X(tr.land, -1), V.Y(0) - 10 - i * 14); }
      });
      // 검출 기록
      hits.forEach(function (hh) { ctx.fillStyle = cols[hh[1]]; ctx.globalAlpha = 0.5; ctx.fillRect(V.X(hh[0], -1) - 1, V.Y(0) - 7, 2, 7); });
      ctx.globalAlpha = 1;
      // 움직이는 이온
      parts.forEach(function (p) {
        var k = Math.min(p.pts.length - 1, Math.floor(p.p)), k0 = Math.max(0, k - 10);
        if (p.done) return;
        ctx.strokeStyle = cols[p.sp]; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.6; path(p.pts.slice(k0, k + 1)); ctx.globalAlpha = 1;
        var q = p.pts[k]; ctx.beginPath(); ctx.arc(V.X(q[0], q[1]), V.Y(q[1]), 3.2, 0, 7); ctx.fillStyle = cols[p.sp]; ctx.fill();
      });
      function path(pts) { ctx.beginPath(); pts.forEach(function (q, j) { var X = V.X(q[0], q[1]), Y = V.Y(q[1]); if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke(); }
      if (vsel < 1.5e5 || vsel > 2.5e5) {
        ctx.fillStyle = T.figRed; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('이온원에 v = E/B인 이온이 없다 → 아무것도 통과하지 못함', V.X(0.06, -1), V.Y(0.05));
      }
      // 읽기
      rV.set((vsel / 1e5).toFixed(2) + '×10⁵ m/s');
      var rs = species.map(function (s, i) { return s.on ? s.n + ' ' + (s.A * U * vsel / (QE * st.B2) * 100).toFixed(1) + ' cm' : null; }).filter(Boolean);
      rR.set(rs.join(', '));
      rD.set((2 * U * vsel / (QE * st.B2) * 100).toFixed(2) + ' cm');
    }
    api.onResize(function () { draw(); });
    if (api.reduced) {
      // 움직임 줄이기: 여러 속력의 궤적을 한 번에 그린다
      var oldDraw = draw;
      draw = function () {
        parts = [];
        species.forEach(function (s, i) { if (!s.on) return; for (var j = 0; j <= 8; j++) { var tr = trajectory(s.A, 2.0e5 * (0.76 + 0.06 * j)); tr.sp = i; tr.p = tr.pts.length - 1; parts.push(tr); } });
        oldDraw();
        var T = api.tokens(), V = view(), cols = COL(T);
        parts.forEach(function (p) { ctx.strokeStyle = cols[p.sp]; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.5; ctx.beginPath(); p.pts.forEach(function (q, j) { var X = V.X(q[0], q[1]), Y = V.Y(q[1]); if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke(); });
        ctx.globalAlpha = 1;
      };
    }
    draw();
  },
});
