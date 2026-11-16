/* 지구시스템과학 3 바람에 작용하는 힘: 기압 경도력 + 전향력 → 지균풍, 마찰 → 지상풍 (2D) */
Sims.register('geostrophic-wind', {
  title: '정지한 공기가 지균풍이 되기까지 — 기압 경도력과 전향력',
  caption: '\'다시 출발\'을 눌러 정지한 공기 덩어리가 기압 경도력을 받아 저기압 쪽으로 움직이기 시작하고, 전향력 때문에 점점 휘어 등압선과 나란한 지균풍이 되는 과정을 보자. 남반구로 바꾸면 반대쪽으로 휘고, 등압선 간격을 좁히면 바람이 빨라지며, 지표 마찰을 켜면 바람이 약해져 등압선을 비스듬히 가로질러 저기압 쪽으로 분다. 위도 40°, 공기 밀도 1.2 kg/m³, 4 hPa 간격의 직선 등압선을 가정했다. 실제로 균형에 다가가는 과정을 보이기 위해 균형에서 벗어난 흔들림이 서서히 줄어든다고 단순화했고, 마찰은 속도에 비례한다고 두었다.',
  init: function (api) {
    var F = 9.4e-5, RHO = 1.2, DP = 400;   // 전향 인자(40°), 밀도, 등압선 간격당 기압 차(Pa)
    var KF = 0.6, DAMP = 0.12, TMAX = 18;  // 마찰 계수, 흔들림 감쇠(1/f 단위), 계산 시간(1/f 단위)
    var state = { hemi: 1, fric: false, d: 300, tau: 0, u: 0, v: 0, x: 0, y: 0, trail: [] };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.05 : 0.5; }, label: '등압선 위에서 공기 덩어리의 경로와 작용하는 힘' });
    var ctx = cv.ctx;
    var rVg = api.readout('지균풍 속력(계산)');
    var rV = api.readout('지금 풍속');
    var rA = api.readout('등압선과 바람의 각');
    var rS = api.readout('상태');

    var g = api.group();
    var hb = [api.button('북반구', function () { setH(1); }, { toggle: true, pressed: true, parent: g }),
      api.button('남반구', function () { setH(-1); }, { toggle: true, parent: g })];
    function setH(s) { state.hemi = s; hb[0].setAttribute('aria-pressed', s > 0 ? 'true' : 'false'); hb[1].setAttribute('aria-pressed', s < 0 ? 'true' : 'false'); restart(); }
    var fb = api.button('지표 마찰', function () { state.fric = !state.fric; fb.setAttribute('aria-pressed', state.fric ? 'true' : 'false'); restart(); }, { toggle: true });
    api.slider({ id: 'geostrophic-wind-d', label: '등압선 간격(4 hPa마다)', min: 200, max: 600, step: 25, value: 300,
      format: function (v) { return v + ' km'; }, onInput: function (v) { state.d = v; restart(); } });
    api.button('다시 출발', function () { restart(); }, { primary: true });

    function vg() { return DP / (RHO * F * state.d * 1000); }
    function eq() {   // 힘이 균형을 이룬 바람(지균풍 또는 지상풍)
      var k = state.fric ? KF : 0, s = state.hemi, G = vg();
      return { u: s * G / (1 + k * k), v: k * G / (1 + k * k) };
    }
    function accel(u, v) {
      var s = state.hemi, k = state.fric ? KF : 0, G = vg(), E = eq();
      var pg = [0, G], co = [s * v, -s * u], fr = [-k * u, -k * v];
      var dm = [-DAMP * (u - E.u), -DAMP * (v - E.v)];
      return { pg: pg, co: co, fr: fr, a: [pg[0] + co[0] + fr[0] + dm[0], pg[1] + co[1] + fr[1] + dm[1]] };
    }
    function step(dtau) {
      var n = Math.ceil(dtau / 0.02), h = dtau / n;
      for (var i = 0; i < n; i++) {
        var A1 = accel(state.u, state.v).a;
        var A2 = accel(state.u + A1[0] * h / 2, state.v + A1[1] * h / 2).a;
        var um = state.u + A1[0] * h / 2, vm = state.v + A1[1] * h / 2;
        state.u += A2[0] * h; state.v += A2[1] * h;
        state.x += um * h / F / 1000; state.y += vm * h / F / 1000;   // km
        state.tau += h;
      }
      state.trail.push([state.x, state.y]);
    }
    function restart() {
      state.tau = 0; state.u = 0; state.v = 0; state.x = 0; state.y = 0; state.trail = [[0, 0]];
      if (api.reduced) { while (state.tau < TMAX) step(0.1); draw(); return; }
      loop.play(); draw();
    }
    var loop = api.loop(function (dt) {
      step(dt * 2.4);
      if (state.tau >= TMAX) loop.pause();
      draw();
    });

    function arrow(x0, y0, dx, dy, col, w, label, T) {
      var L = Math.hypot(dx, dy); if (L < 3) return;
      var x1 = x0 + dx, y1 = y0 + dy, ux = dx / L, uy = dy / L;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - ux * 6, y1 - uy * 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - ux * 10 - uy * 5, y1 - uy * 10 + ux * 5); ctx.lineTo(x1 - ux * 10 + uy * 5, y1 - uy * 10 - ux * 5); ctx.closePath(); ctx.fill();
      if (label) {
        ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = ux > 0.3 ? 'left' : ux < -0.3 ? 'right' : 'center';
        ctx.fillText(label, x1 + ux * 8, y1 + uy * 8 + (uy > 0.3 ? 10 : uy < -0.3 ? -2 : 4));
      }
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var narrow = w < 560;
      var spanKm = 3.6 * 300;                    // 화면 세로가 나타내는 거리(km)
      var k = h / spanKm;                         // px/km
      var px0 = w * (narrow ? 0.62 : 0.6), py0 = h * 0.55;   // 공기 덩어리를 그리는 화면 위치
      var SX = function (x) { return px0 + (x - state.x) * k; }, SY = function (y) { return py0 - (y - state.y) * k; };
      ctx.fillStyle = T.figPaper; ctx.fillRect(0, 0, w, h);
      // 등압선(북쪽=위가 저기압)
      var d = state.d, n0 = Math.floor((state.y - spanKm) / d), n1 = Math.ceil((state.y + spanKm) / d);
      ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'left';
      for (var n = n0; n <= n1; n++) {
        var yy = SY(n * d + d / 2); if (yy < -10 || yy > h + 10) continue;
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke();
        ctx.fillStyle = T.figMuted; ctx.fillText((1008 - 4 * n) + ' hPa', 6, yy - 4);
      }
      ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillStyle = T.figRed; ctx.fillText('저기압 쪽 (L)', w - 8, 18);
      ctx.fillStyle = T.figBlue; ctx.fillText('고기압 쪽 (H)', w - 8, h - 8);
      ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody;
      ctx.fillText((state.hemi > 0 ? '북반구 · 위가 북쪽' : '남반구 · 위가 극 쪽') + ' · 1/f ≈ 3시간', 6, h - 8);
      // 경로
      ctx.beginPath();
      state.trail.forEach(function (p, i) { var X = SX(p[0]), Y = SY(p[1]); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); });
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
      var s0 = state.trail[0]; ctx.beginPath(); ctx.arc(SX(s0[0]), SY(s0[1]), 4, 0, Math.PI * 2); ctx.fillStyle = T.figMuted; ctx.fill();
      if (SX(s0[0]) > 4 && SY(s0[1]) < h - 20) { ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('출발(정지)', SX(s0[0]), SY(s0[1]) + 16); }
      // 힘
      var A = accel(state.u, state.v), sc = 3.4;
      ctx.beginPath(); ctx.arc(px0, py0, 8, 0, Math.PI * 2); ctx.fillStyle = T.figPanel; ctx.fill(); ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.stroke();
      arrow(px0, py0, A.pg[0] * sc, -A.pg[1] * sc, T.figRed, 3, '기압 경도력', T);
      arrow(px0, py0, A.co[0] * sc, -A.co[1] * sc, T.figBlue, 3, '전향력', T);
      if (state.fric) arrow(px0, py0, A.fr[0] * sc, -A.fr[1] * sc, T.figAmber, 3, '마찰력', T);
      arrow(px0, py0, state.u * sc, -state.v * sc, T.figInk, 1.6, '바람', T);
      // 수치
      var sp = Math.hypot(state.u, state.v), G = vg();
      rVg.set(G.toFixed(1) + ' m/s');
      rV.set(sp.toFixed(1) + ' m/s');
      var ang = sp < 0.05 ? null : Math.atan2(state.v, Math.abs(state.u)) * 180 / Math.PI;
      rA.set(ang === null ? '–' : Math.abs(ang) < 1 ? '나란함(0°)' : Math.round(Math.abs(ang)) + '° ' + (ang > 0 ? '저기압 쪽으로' : '고기압 쪽으로'));
      var E = eq(), off = Math.hypot(state.u - E.u, state.v - E.v);
      rS.set(off > 0.06 * G ? '균형에 다가가는 중' : state.fric ? '지상풍(세 힘의 균형)' : '지균풍(두 힘의 균형)');
    }
    api.onResize(draw);
    restart();
  },
});
