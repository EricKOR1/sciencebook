/* 수학 도구 4 상미분방정식: 특성근의 복소 평면 위치와 해의 모양, 강제 진동의 과도·정상 응답 분해 */
Sims.register('mj-ode-roots-forced', {
  title: '특성근의 위치로 읽는 감쇠·강제 진동 — x = xₕ + xₚ',
  caption: '감쇠 γ/ω₀를 0에서 2까지 움직이며 왼쪽 복소 평면의 두 특성근(파란 점)이 반지름 ω₀인 원을 따라 실수축 쪽으로 움직여 −ω₀에서 만난 뒤 실수축 위에서 갈라지는 모습과, 오른쪽 해의 모양(진동 → 임계 → 느린 복귀)을 함께 보자. 구동 진폭을 올리면 해가 과도 응답 xₕ(주황 점선)와 정상 상태 xₚ(보라 점선)의 합으로 나뉜다. 복소 평면의 초록 점 iω는 구동 각진동수이며, 정상 상태 진폭은 iω에서 두 근까지의 거리의 곱에 반비례한다(|X| = f/(d₁d₂)). 그래서 감쇠가 작아 근이 허수축에 가까울 때 ω ≈ ω₀이면 공명이 크다. γ = 0, ω = ω₀이면 진폭이 t에 비례해 커지고, ω가 ω₀에 가까우면 맥놀이가 생긴다. ω₀ = 2π rad/s(1 Hz)로 고정했고, 구동력은 f cos ωt이고, 정상 상태 진폭 |X|는 정적 변형 f/ω₀²을 단위로 나타냈다(x와 f/ω₀²은 x(0)과 같은 길이 단위).',
  init: function (api) {
    var W0 = 2 * Math.PI, TMAX = 10;
    var st = { z: 0.1, F: 0.5, r: 1.5, x0: 1 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.45 : 0.56; }, label: '복소 평면의 특성근과 구동 진동수, 시간에 따른 해 x(t), 과도 응답, 정상 상태 응답' });
    var ctx = cv.ctx;
    var rRoot = api.readout('특성근 λ (s⁻¹)');
    var rCase = api.readout('경우');
    var rAmp = api.readout('정상 상태 진폭 |X| / (f/ω₀²)');
    var rLag = api.readout('위상 지연 δ');

    var sZ = api.slider({ id: 'mj-ode-roots-forced-z', label: '감쇠 γ / ω₀', min: 0, max: 2, step: 0.01, value: st.z,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.z = v; draw(); } });
    var sF = api.slider({ id: 'mj-ode-roots-forced-f', label: '구동 진폭 f / ω₀² (0 = 자유 진동)', min: 0, max: 1, step: 0.05, value: st.F,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.F = v; draw(); } });
    var sR = api.slider({ id: 'mj-ode-roots-forced-w', label: '구동 각진동수 ω / ω₀', min: 0.2, max: 2, step: 0.01, value: st.r,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.r = v; draw(); } });
    var sX = api.slider({ id: 'mj-ode-roots-forced-x0', label: '처음 변위 x(0) (처음 속도 0)', min: -1, max: 1, step: 0.05, value: st.x0,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.x0 = v; draw(); } });
    var g = api.group();
    api.button('자유 감쇠 진동', function () { sF.set(0); sZ.set(0.15); sX.set(1); }, { parent: g });
    api.button('강제 진동(과도 + 정상)', function () { sZ.set(0.1); sF.set(0.5); sR.set(1.5); sX.set(1); }, { parent: g });
    api.button('맥놀이(γ = 0, ω = 0.9ω₀)', function () { sZ.set(0); sF.set(0.2); sR.set(0.9); sX.set(0); }, { parent: g });
    api.button('공명 성장(γ = 0, ω = ω₀)', function () { sZ.set(0); sF.set(0.2); sR.set(1); sX.set(0); }, { parent: g });

    /* 해 계산: x'' + 2γx' + ω₀²x = f cos ωt, x(0) = x0, x'(0) = 0 */
    function model() {
      var gam = st.z * W0, w = st.r * W0, f = st.F * W0 * W0;
      var m = {};
      var re = W0 * W0 - w * w, im = 2 * gam * w, den = re * re + im * im;
      m.res = st.F > 0 && st.z === 0 && Math.abs(st.r - 1) < 1e-9;
      if (m.res) {
        var c = f / (2 * W0);
        m.xp = function (t) { return c * t * Math.sin(W0 * t); };
        m.xp0 = 0; m.vp0 = 0; m.amp = Infinity; m.lag = Math.PI / 2;
      } else {
        var Xr = f * re / den, Xi = -f * im / den; // X = f/(re + i im)
        m.xp = function (t) { return Xr * Math.cos(w * t) - Xi * Math.sin(w * t); };
        m.xp0 = Xr; m.vp0 = -Xi * w;
        m.amp = W0 * W0 / Math.sqrt(den); m.lag = Math.atan2(im, re);
      }
      var xh0 = st.x0 - m.xp0, vh0 = -m.vp0;
      var disc = gam * gam - W0 * W0;
      if (Math.abs(st.z - 1) < 1e-9) {
        var C2 = vh0 + gam * xh0;
        m.xh = function (t) { return (xh0 + C2 * t) * Math.exp(-gam * t); };
        m.roots = [[-gam, 0], [-gam, 0]]; m.kind = '임계 감쇠 (중근)';
      } else if (disc < 0) {
        var wd = Math.sqrt(-disc), B = (vh0 + gam * xh0) / wd;
        m.xh = function (t) { return Math.exp(-gam * t) * (xh0 * Math.cos(wd * t) + B * Math.sin(wd * t)); };
        m.roots = [[-gam, wd], [-gam, -wd]]; m.kind = st.z === 0 ? '감쇠 없음 (순허수 근)' : '과소 감쇠 (복소근)';
      } else {
        var s = Math.sqrt(disc), l1 = -gam + s, l2 = -gam - s;
        var C1 = (vh0 - l2 * xh0) / (l1 - l2), Cb = xh0 - C1;
        m.xh = function (t) { return C1 * Math.exp(l1 * t) + Cb * Math.exp(l2 * t); };
        m.roots = [[l1, 0], [l2, 0]]; m.kind = '과다 감쇠 (서로 다른 두 실근)';
      }
      m.w = w;
      return m;
    }

    function fmt(v) { return (v < 0 ? '−' : '') + Math.abs(v).toFixed(2); }

    function draw() {
      var T = api.tokens(), W = cv.w, H = cv.h, narrow = W < 560;
      ctx.clearRect(0, 0, W, H);
      var m = model();
      // 수치 읽기
      var r0 = m.roots[0], r1 = m.roots[1];
      if (r0[1] !== 0) rRoot.set(fmt(r0[0]) + ' ± ' + Math.abs(r0[1]).toFixed(2) + 'i');
      else if (m.kind.indexOf('중근') >= 0) rRoot.set(fmt(r0[0]) + ' (중근)');
      else rRoot.set(fmt(r0[0]) + ', ' + fmt(r1[0]));
      rCase.set(m.kind);
      if (st.F === 0) { rAmp.set('구동 없음'); rLag.set('–'); }
      else if (m.res) { rAmp.set('한없이 커짐 (∝ t)'); rLag.set('90°'); }
      else { rAmp.set(m.amp.toFixed(2)); rLag.set((m.lag * 180 / Math.PI).toFixed(0) + '°'); }

      var P, G;
      if (narrow) { P = { x: 0, y: 0, w: W, h: H * 0.42 }; G = { x: 0, y: H * 0.45, w: W, h: H * 0.55 }; }
      else { P = { x: 0, y: 0, w: W * 0.46, h: H }; G = { x: W * 0.47, y: 0, w: W * 0.53, h: H }; }

      // ── 복소 평면 (단위: ω₀)
      var reMin = -4.0, reMax = 0.55, imMax = 2.15;   // 구동점 iω(ω ≤ 2ω₀)가 좁은 화면에서도 안에 들어오게
      var pl = P.x + 8, pr = P.x + P.w - 8, pt = P.y + 26, pb = P.y + P.h - 26;
      var sc = Math.min((pr - pl) / (reMax - reMin), (pb - pt) / (2 * imMax));
      var ox = pr - reMax * sc, oy = (pt + pb) / 2;
      var X = function (re) { return ox + re / W0 * sc; }, Y = function (im) { return oy - im / W0 * sc; };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('복소 평면의 특성근 λ', P.x + 8, P.y + 14);
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ox + reMin * sc, oy); ctx.lineTo(ox + reMax * sc, oy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, oy - imMax * sc); ctx.lineTo(ox, oy + imMax * sc); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody;
      ctx.textAlign = 'right'; ctx.fillText('Re λ', ox + reMax * sc, oy + 14);
      ctx.textAlign = 'right'; ctx.fillText('Im λ', ox - 4, oy + imMax * sc - 2);
      ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      [-3, -2, -1].forEach(function (k) {
        ctx.beginPath(); ctx.moveTo(ox + k * sc, oy - 3); ctx.lineTo(ox + k * sc, oy + 3); ctx.stroke();
        ctx.fillText((k < 0 ? '−' : '') + Math.abs(k) + 'ω₀', ox + k * sc, oy + 14);
      });
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figLine;
      ctx.beginPath(); ctx.arc(ox, oy, sc, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      // 구동 iω와 거리 선분
      if (st.F > 0) {
        var wy = Y(m.w);
        ctx.strokeStyle = T.figGreen; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
        m.roots.forEach(function (r) { ctx.beginPath(); ctx.moveTo(ox, wy); ctx.lineTo(X(r[0]), Y(r[1])); ctx.stroke(); });
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(ox, wy, 5.5, 0, Math.PI * 2); ctx.fillStyle = T.figGreen; ctx.fill();
        ctx.fillStyle = T.figGreen; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right';
        ctx.fillText('iω (구동)', ox - 9, wy - 4);
      }
      // 근
      m.roots.forEach(function (r, i) {
        var px = X(r[0]), py = Y(r[1]);
        ctx.beginPath(); ctx.arc(px, py, 6.5, 0, Math.PI * 2);
        ctx.fillStyle = T.figBlue; ctx.fill(); ctx.strokeStyle = T.figPaper; ctx.lineWidth = 1.5; ctx.stroke();
      });
      if (m.kind.indexOf('중근') >= 0) {
        ctx.fillStyle = T.figBlue; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('중근', X(r0[0]), oy - 12);
      }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('점선 원: 반지름 ω₀', P.x + 8, pb + 18);

      // ── 시간 그래프
      var gl = G.x + 44, gr = G.x + G.w - 8, gt = G.y + (narrow ? 62 : 40), gb = G.y + G.h - 28;
      var N = 1200, xs = [], xh = [], xp = [], ymax = 1;
      for (var i = 0; i <= N; i++) {
        var t = TMAX * i / N, a = m.xh(t), b = st.F > 0 ? m.xp(t) : 0;
        xh.push(a); xp.push(b); xs.push(a + b);
        ymax = Math.max(ymax, Math.abs(a + b), Math.abs(a), Math.abs(b));
      }
      ymax *= 1.08;
      var tx = function (t) { return gl + t / TMAX * (gr - gl); }, ty = function (v) { return (gt + gb) / 2 - v / ymax * (gb - gt) / 2; };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gl, ty(0)); ctx.lineTo(gr, ty(0)); ctx.stroke();
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(gl, gt); ctx.lineTo(gl, gb); ctx.lineTo(gr, gb); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      var tk = niceTick(ymax);
      for (var v = -Math.floor(ymax / tk) * tk; v <= ymax + 1e-9; v += tk) {
        ctx.fillText((v < -1e-9 ? '−' : '') + fmtTick(Math.abs(v), tk), gl - 4, ty(v) + 4);
      }
      ctx.textAlign = 'center';
      for (var s2 = 0; s2 <= TMAX; s2 += 2) ctx.fillText(String(s2), tx(s2), gb + 14);
      ctx.font = '11px ' + T.fontBody; ctx.fillText('t (s)', (gl + gr) / 2, gb + 26);
      if (st.F > 0) {
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.globalAlpha = 0.8;
        line(function (t) { return Math.cos(m.w * t) * ymax * 0.25; }); ctx.globalAlpha = 1;
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.8; arr(xh);
        ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1.8; arr(xp);
        ctx.setLineDash([]);
      }
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2.4; arr(xs);
      // 범례
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      var items = [['x(t)', T.figBlue, []]];
      if (st.F > 0) items.push(['xₕ 과도', T.figAmber, [6, 4]], ['xₚ 정상', T.figViolet, [6, 4]], ['구동력(모양)', T.figLine, []]);
      var lx = G.x + 8, ly = G.y + 14;
      items.forEach(function (it, k) {
        var cx = lx + (narrow ? (k % 2) * 140 : k * (G.w - 16) / 4), cy = ly + (narrow ? Math.floor(k / 2) * 16 : 0);
        ctx.strokeStyle = it[1]; ctx.lineWidth = 2; ctx.setLineDash(it[2]);
        ctx.beginPath(); ctx.moveTo(cx, cy - 4); ctx.lineTo(cx + 20, cy - 4); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figInk; ctx.fillText(it[0], cx + 25, cy);
      });
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'right'; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('세로: x(t), x(0) = ' + st.x0.toFixed(2), gr, gt - (narrow ? 10 : 6));

      function arr(a) {
        ctx.beginPath();
        a.forEach(function (v, i) { var X2 = tx(TMAX * i / N), Y2 = ty(v); if (i === 0) ctx.moveTo(X2, Y2); else ctx.lineTo(X2, Y2); });
        ctx.stroke();
      }
      function line(fn) {
        ctx.beginPath();
        for (var i = 0; i <= N; i++) { var t = TMAX * i / N; if (i === 0) ctx.moveTo(tx(t), ty(fn(t))); else ctx.lineTo(tx(t), ty(fn(t))); }
        ctx.stroke();
      }
    }
    function niceTick(m) {
      var raw = m / 2, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
      return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
    }
    function fmtTick(v, tk) { return tk >= 1 ? v.toFixed(0) : v.toFixed(Math.max(0, -Math.floor(Math.log10(tk)))); }
    api.onResize(draw);
    if (api.onTheme) api.onTheme(draw);
    draw();
  },
});
