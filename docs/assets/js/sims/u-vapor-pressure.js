/* 일반화학 6 액체의 성질: 증기 압력과 온도 — 클라우지우스–클라페이롱 식, ln P 대 1/T 직선, 외부 압력과 끓는점 */
Sims.register('u-vapor-pressure', {
  title: '증기 압력 곡선과 ln P–1/T 직선 — 끓는점은 언제 오는가',
  caption: '액체를 고르고 온도와 바깥 압력을 바꿔 보자. 왼쪽 곡선은 온도가 오를수록 증기 압력이 지수 함수로 급하게 커지는 모습이고, 같은 자료를 ln P 대 1/T로 그리면(오른쪽) 기울기 −ΔH기화/R인 직선이 된다. 기화 엔탈피가 큰(분자 간 힘이 센) 액체일수록 직선이 가파르다. 증기 압력이 바깥 압력과 같아지는 온도가 끓는점이다. 각 액체의 기준 끓는점과 ΔH기화를 일정하다고 가정해 계산했으므로, 끓는점에서 먼 온도에서는 실제 값과 조금 다르다.',
  init: function (api) {
    var R = 8.314;
    var LIQ = [
      { name: '물', Tb: 373.15, H: 40.7, col: 'figBlue' },
      { name: '에탄올', Tb: 351.45, H: 41.7, col: 'figGreen' },
      { name: '다이에틸 에터', Tb: 307.75, H: 26.5, col: 'figAmber' },
    ];
    var state = { k: 0, tC: 60, pExt: 1.0 };
    function P(L, T) { return Math.exp(-L.H * 1000 / R * (1 / T - 1 / L.Tb)); }      // atm
    function Tboil(L, p) { return 1 / (1 / L.Tb - R / (L.H * 1000) * Math.log(p)); }   // K
    var TMIN = 0, TMAX = 120, PMAX = 3.2, XA = 2.5, XB = 3.7, YA = -6, YB = 2;

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.5; }, label: '증기 압력–온도 그래프와 ln P–1/T 그래프' });
    var ctx = cv.ctx;
    var rP = api.readout('증기 압력');
    var rB = api.readout('이 압력에서의 끓는점');
    var rS = api.readout('직선의 기울기 −ΔH/R');
    var rS2 = api.readout('상태');

    var g = api.group();
    var bs = LIQ.map(function (L, i) { return api.button(L.name, function () { pick(i); }, { toggle: true, pressed: i === 0, parent: g }); });
    function pick(i) { state.k = i; bs.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); update(); }
    api.slider({ id: 'u-vapor-pressure-t', label: '온도', min: TMIN, max: TMAX, step: 1, value: state.tC,
      format: function (v) { return v + ' °C'; }, onInput: function (v) { state.tC = v; update(); } });
    api.slider({ id: 'u-vapor-pressure-p', label: '바깥 압력', min: 0.3, max: 3, step: 0.05, value: state.pExt,
      format: function (v) { return v.toFixed(2) + ' atm'; }, onInput: function (v) { state.pExt = v; update(); } });

    function update() {
      var L = LIQ[state.k], T = state.tC + 273.15, p = P(L, T), tb = Tboil(L, state.pExt) - 273.15;
      rP.set(p.toFixed(p < 0.1 ? 3 : 2) + ' atm (' + Math.round(p * 760) + ' mmHg)');
      rB.set(tb.toFixed(1) + ' °C');
      rS.set('−' + Math.round(L.H * 1000 / R) + ' K (ΔH = ' + L.H + ' kJ/mol)');
      rS2.set(p >= state.pExt ? '끓는다 (P증기 ≥ P바깥)' : '증발만 (P증기 < P바깥)');
      draw();
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      if (narrow) { left(T, { x: 0, y: 0, w: w, h: h * 0.5 }); right(T, { x: 0, y: h * 0.5, w: w, h: h * 0.5 }); }
      else { left(T, { x: 0, y: 0, w: w * 0.5, h: h }); right(T, { x: w * 0.5, y: 0, w: w * 0.5, h: h }); }
    }
    function frame(T, r, xt, yt) {
      var Lx = r.x + 52, Rx = r.x + r.w - 14, Tp = r.y + 14, B = r.y + r.h - 40;
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(Lx, Tp); ctx.lineTo(Lx, B); ctx.lineTo(Rx, B); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(xt, (Lx + Rx) / 2, B + 32);
      ctx.save(); ctx.translate(r.x + 13, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(yt, 0, 0); ctx.restore();
      return { L: Lx, R: Rx, T: Tp, B: B };
    }
    function clipBox(f) { ctx.save(); ctx.beginPath(); ctx.rect(f.L, f.T, f.R - f.L, f.B - f.T); ctx.clip(); }
    function left(T, r) {
      var f = frame(T, r, '온도 (°C)', '증기 압력 (atm)');
      var sx = function (t) { return f.L + (t - TMIN) / (TMAX - TMIN) * (f.R - f.L); }, sy = function (p) { return f.B - p / PMAX * (f.B - f.T); };
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      ctx.textAlign = 'center'; [0, 20, 40, 60, 80, 100, 120].forEach(function (t) { ctx.fillText(t, sx(t), f.B + 15); });
      ctx.textAlign = 'right'; [0, 1, 2, 3].forEach(function (p) { ctx.beginPath(); ctx.moveTo(f.L, sy(p)); ctx.lineTo(f.R, sy(p)); ctx.stroke(); ctx.fillText(p, f.L - 6, sy(p) + 4); });
      clipBox(f);
      LIQ.forEach(function (L, i) {
        ctx.strokeStyle = T[L.col]; ctx.lineWidth = i === state.k ? 3 : 1.4; ctx.globalAlpha = i === state.k ? 1 : 0.45;
        ctx.beginPath(); for (var t = TMIN; t <= TMAX; t += 1) { var y = sy(P(L, t + 273.15)); if (t === TMIN) ctx.moveTo(sx(t), y); else ctx.lineTo(sx(t), y); } ctx.stroke();
      });
      ctx.globalAlpha = 1;
      // 바깥 압력과 끓는점
      var L = LIQ[state.k], tb = Tboil(L, state.pExt) - 273.15;
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(f.L, sy(state.pExt)); ctx.lineTo(f.R, sy(state.pExt)); ctx.stroke();
      if (tb <= TMAX && tb >= TMIN) { ctx.beginPath(); ctx.moveTo(sx(tb), sy(state.pExt)); ctx.lineTo(sx(tb), f.B); ctx.stroke(); }
      ctx.setLineDash([]);
      ctx.fillStyle = T.figRed; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('바깥 압력 ' + state.pExt.toFixed(2) + ' atm', f.L + 6, sy(state.pExt) - 5);
      if (tb <= TMAX && tb >= TMIN) { ctx.beginPath(); ctx.arc(sx(tb), sy(state.pExt), 5, 0, 7); ctx.fill(); ctx.textAlign = tb > 90 ? 'right' : 'left'; ctx.fillText('끓는점 ' + tb.toFixed(1) + ' °C', sx(tb) + (tb > 90 ? -8 : 8), f.B - 8); }
      // 현재 점
      var p = P(L, state.tC + 273.15);
      if (p <= PMAX) { ctx.fillStyle = T[L.col]; ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(sx(state.tC), sy(p), 6, 0, 7); ctx.fill(); ctx.stroke(); }
      ctx.restore();
      legend(T, f);
    }
    function legend(T, f) {
      ctx.font = '11.5px ' + T.fontBody; ctx.textAlign = 'left';
      LIQ.forEach(function (L, i) {
        var y = f.T + 14 + i * 16;
        ctx.fillStyle = T[L.col]; ctx.fillRect(f.L + 8, y - 6, 14, 4);
        ctx.fillStyle = i === state.k ? T.figInk : T.figMuted; ctx.fillText(L.name, f.L + 26, y);
      });
    }
    function right(T, r) {
      var f = frame(T, r, '1/T (×10⁻³ K⁻¹)', 'ln (P / atm)');
      var sx = function (x) { return f.L + (x - XA) / (XB - XA) * (f.R - f.L); }, sy = function (y) { return f.B - (y - YA) / (YB - YA) * (f.B - f.T); };
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      ctx.textAlign = 'center'; [2.6, 3.0, 3.4].forEach(function (x) { ctx.fillText(x.toFixed(1), sx(x), f.B + 15); });
      ctx.textAlign = 'right'; [-6, -4, -2, 0, 2].forEach(function (y) { ctx.beginPath(); ctx.moveTo(f.L, sy(y)); ctx.lineTo(f.R, sy(y)); ctx.stroke(); ctx.fillText(y, f.L - 6, sy(y) + 4); });
      clipBox(f);
      LIQ.forEach(function (L, i) {
        ctx.strokeStyle = T[L.col]; ctx.lineWidth = i === state.k ? 3 : 1.4; ctx.globalAlpha = i === state.k ? 1 : 0.45;
        ctx.beginPath(); ctx.moveTo(sx(XA), sy(Math.log(P(L, 1000 / XA)))); ctx.lineTo(sx(XB), sy(Math.log(P(L, 1000 / XB)))); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      var L = LIQ[state.k], T0 = state.tC + 273.15, x0 = 1000 / T0, y0 = Math.log(P(L, T0));
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(f.L, sy(Math.log(state.pExt))); ctx.lineTo(f.R, sy(Math.log(state.pExt))); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T[L.col]; ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(sx(x0), sy(y0), 6, 0, 7); ctx.fill(); ctx.stroke();
      // 기울기 삼각형
      var xa = 2.75, xb = 3.15, ya = Math.log(P(L, 1000 / xa)), yb = Math.log(P(L, 1000 / xb));
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(sx(xa), sy(ya)); ctx.lineTo(sx(xb), sy(ya)); ctx.lineTo(sx(xb), sy(yb)); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      var txt = '기울기 = −ΔH기화/R = −' + Math.round(L.H * 1000 / R) + ' K', wide = f.R - f.L > 300;
      ctx.font = '600 12px ' + T.fontBody; var tw = ctx.measureText(txt).width;
      ctx.globalAlpha = 0.9; ctx.fillStyle = T.figPanel; ctx.fillRect(f.R - tw - 10, f.T + 1, tw + 8, wide ? 36 : 20); ctx.globalAlpha = 1;
      ctx.fillStyle = T.figInk; ctx.textAlign = 'right';
      ctx.fillText(txt, f.R - 4, f.T + 14);
      if (wide) { ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.fillText('← 온도가 높다      온도가 낮다 →', f.R - 4, f.T + 30); }
    }
    api.onResize(draw);
    update();
  },
});
