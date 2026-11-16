/* 일반물리학 10 교류 회로: 직렬 RLC 회로의 페이저 그림과 공명 곡선 */
Sims.register('u-rlc-resonance', {
  title: '직렬 RLC 회로 — 페이저로 더하는 전압과 공명 곡선',
  caption: '진동수를 바꾸며 왼쪽 페이저 그림(전류 방향을 가로축으로 둔 전압 화살표)과 오른쪽 공명 곡선을 함께 보자. X_L = X_C가 되는 공명 진동수에서 V_L과 V_C 화살표가 정확히 상쇄되어 임피던스가 R로 가장 작고 전류가 가장 크다. R을 줄이면 곡선이 높고 뾰족해지며(품질 인자 Q = ω₀L/R가 커짐), 이때 V_L·V_C가 전원 전압보다 훨씬 커질 수 있다. 전원은 실횻값 220 V로 고정했고, 도선과 전원의 내부 저항, 소자의 손실은 무시했다.',
  init: function (api) {
    var VRMS = 220;
    var s = { R: 30, L: 0.20, C: 50e-6, f: 60 };
    var FMIN = 5, FMAX = 500;
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.35 : 0.52; }, label: '직렬 RLC 회로의 페이저 그림과 진동수에 따른 전류 그래프' });
    var ctx = cv.ctx;

    var rX = api.readout('X_L / X_C');
    var rZ = api.readout('임피던스 Z');
    var rI = api.readout('전류 I_rms');
    var rP = api.readout('위상각 φ');
    var rW = api.readout('평균 전력');
    var rF0 = api.readout('공명 f₀ · Q');

    api.slider({ id: 'u-rlc-resonance-f', label: '진동수 f', min: Math.log10(FMIN), max: Math.log10(FMAX), step: 0.001, value: Math.log10(60),
      format: function (v) { return fmtF(Math.pow(10, v)); }, onInput: function (v) { s.f = Math.pow(10, v); update(); } });
    api.slider({ id: 'u-rlc-resonance-r', label: '저항 R', min: 5, max: 200, step: 1, value: 30,
      format: function (v) { return v + ' Ω'; }, onInput: function (v) { s.R = v; update(); } });
    api.slider({ id: 'u-rlc-resonance-l', label: '인덕턴스 L', min: 20, max: 500, step: 5, value: 200,
      format: function (v) { return v + ' mH'; }, onInput: function (v) { s.L = v / 1000; update(); } });
    api.slider({ id: 'u-rlc-resonance-c', label: '전기 용량 C', min: 5, max: 200, step: 1, value: 50,
      format: function (v) { return v + ' μF'; }, onInput: function (v) { s.C = v * 1e-6; update(); } });
    var g = api.group();
    api.button('공명 진동수로 맞추기', function () {
      var f0 = 1 / (2 * Math.PI * Math.sqrt(s.L * s.C));
      var inp = document.getElementById('u-rlc-resonance-f');
      inp.value = Math.log10(Math.min(FMAX, Math.max(FMIN, f0)));
      inp.dispatchEvent(new Event('input'));
    }, { parent: g, primary: true });
    api.button('예제 8 값으로', function () {
      setSlider('u-rlc-resonance-r', 30); setSlider('u-rlc-resonance-l', 200); setSlider('u-rlc-resonance-c', 50); setSlider('u-rlc-resonance-f', Math.log10(60));
    }, { parent: g });
    function setSlider(id, v) { var inp = document.getElementById(id); inp.value = v; inp.dispatchEvent(new Event('input')); }

    function fmtF(f) { return f < 100 ? f.toFixed(1) + ' Hz' : f.toFixed(0) + ' Hz'; }
    function fmtV(v) { return v >= 1000 ? (v / 1000).toFixed(2) + ' kV' : v.toFixed(0) + ' V'; }
    function calc(f) {
      var w = 2 * Math.PI * f, XL = w * s.L, XC = 1 / (w * s.C), X = XL - XC;
      var Z = Math.sqrt(s.R * s.R + X * X), I = VRMS / Z;
      return { XL: XL, XC: XC, Z: Z, I: I, phi: Math.atan2(X, s.R) };
    }
    function update() {
      var c = calc(s.f), f0 = 1 / (2 * Math.PI * Math.sqrt(s.L * s.C)), Q = 2 * Math.PI * f0 * s.L / s.R;
      rX.set(c.XL.toFixed(1) + ' Ω / ' + c.XC.toFixed(1) + ' Ω');
      rZ.set(c.Z.toFixed(1) + ' Ω');
      rI.set(c.I.toFixed(2) + ' A');
      var deg = c.phi * 180 / Math.PI;
      rP.set((deg >= 0 ? '+' : '') + deg.toFixed(1) + '° ' + (Math.abs(deg) < 0.5 ? '(공명)' : deg > 0 ? '(유도성)' : '(용량성)'));
      rW.set((c.I * c.I * s.R).toFixed(0) + ' W (역률 ' + Math.cos(c.phi).toFixed(2) + ')');
      rF0.set(fmtF(f0) + ' · ' + Q.toFixed(1));
      draw();
    }

    function layout() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { ph: { x: 0, y: 0, w: w, h: h * 0.5 }, gr: { x: 0, y: h * 0.52, w: w, h: h * 0.48 } }
        : { ph: { x: 0, y: 0, w: w * 0.4, h: h }, gr: { x: w * 0.42, y: 0, w: w * 0.58, h: h } };
    }
    function draw() {
      var T = api.tokens(), P = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawPhasor(T, P.ph); drawGraph(T, P.gr);
    }
    function arrow(x1, y1, x2, y2, col, lw) {
      var a = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1), hd = Math.min(10, len * 0.4);
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw || 2.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * hd * 0.8, y2 - Math.sin(a) * hd * 0.8); ctx.stroke();
      if (len < 2) return;
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - hd * Math.cos(a - 0.4), y2 - hd * Math.sin(a - 0.4));
      ctx.lineTo(x2 - hd * Math.cos(a + 0.4), y2 - hd * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
    }
    function drawPhasor(T, r) {
      var c = calc(s.f), VR = c.I * s.R, VL = c.I * c.XL, VC = c.I * c.XC;
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('페이저 그림 (실횻값, 전류 기준)', r.x + 8, r.y + 18);
      var ox = r.x + 46, oy = r.y + r.h * 0.52;
      var room = Math.min(r.w - 70, r.h * 0.40);
      var vmax = Math.max(VR, VL, VC, VRMS) * 1.02, k = room / vmax;
      // 축
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ox - 10, oy); ctx.lineTo(r.x + r.w - 8, oy); ctx.moveTo(ox, oy - room - 8); ctx.lineTo(ox, oy + room + 8); ctx.stroke();
      // 전류 기준 화살표
      arrow(ox, oy, ox + Math.min(60, room * 0.4), oy, T.figMuted, 1.5);
      // V_R, V_L, V_C (원점에서), 그리고 V_R 끝에 V_L−V_C를 이어 붙인 합
      var xr = ox + VR * k;
      arrow(ox, oy, ox, oy - VL * k, T.figRed, 2.5);
      arrow(ox, oy, ox, oy + VC * k, T.figBlue, 2.5);
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(xr, oy); ctx.lineTo(xr, oy - (VL - VC) * k); ctx.stroke();
      ctx.setLineDash([]);
      arrow(ox, oy, xr, oy, T.figGreen, 3);
      arrow(ox, oy, xr, oy - (VL - VC) * k, T.figInk, 3);
      // 위상각 호
      if (Math.abs(c.phi) > 0.02) {
        ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.5; ctx.beginPath();
        ctx.arc(ox, oy, 28, Math.min(0, -c.phi), Math.max(0, -c.phi)); ctx.stroke();
        ctx.fillStyle = T.figAmber; ctx.font = '600 12px ' + T.fontBody;
        ctx.fillText('φ', ox + 32 * Math.cos(-c.phi / 2) + 2, oy + 32 * Math.sin(-c.phi / 2) + 4);
      }
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figRed; ctx.fillText('V_L ' + fmtV(VL), ox + 6, Math.max(r.y + 34, oy - VL * k + 4));
      ctx.fillStyle = T.figBlue; ctx.fillText('V_C ' + fmtV(VC), ox + 6, Math.min(r.y + r.h - 6, oy + VC * k + 4));
      ctx.fillStyle = T.figGreen; ctx.textAlign = 'right';
      ctx.fillText('V_R ' + fmtV(VR), Math.max(xr, ox + 80), oy + (VL > VC ? 16 : -8));
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('전류 방향 →', r.x + r.w - 8, oy + (VL > VC ? -6 : 16));
      var tipY = oy - (VL - VC) * k;
      ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.font = '600 12px ' + T.fontBody;
      var lx = Math.min(xr + 6, r.x + r.w - 92);
      ctx.fillText('V = 220 V', lx, tipY + (VL > VC ? -6 : 14));
    }
    function drawGraph(T, r) {
      var L = r.x + 50, R = r.x + r.w - 14, Tp = r.y + 28, B = r.y + r.h - 40;
      var f0 = 1 / (2 * Math.PI * Math.sqrt(s.L * s.C)), Imax = VRMS / s.R;
      var top = niceCeil(Imax * 1.05);
      var lx = function (f) { return L + (Math.log10(f) - Math.log10(FMIN)) / (Math.log10(FMAX) - Math.log10(FMIN)) * (R - L); };
      var ly = function (I) { return B - I / top * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('공명 곡선: 진동수에 따른 전류', r.x + 8, r.y + 16);
      // 반전력 띠
      var df = s.R / (2 * Math.PI * s.L);
      var fa = (-df + Math.sqrt(df * df + 4 * f0 * f0)) / 2, fb = fa + df;
      ctx.fillStyle = T.figSoftAmber;
      var xa = Math.max(L, lx(Math.max(fa, FMIN))), xb = Math.min(R, lx(Math.min(fb, FMAX)));
      if (xb > xa) ctx.fillRect(xa, Tp, xb - xa, B - Tp);
      // 눈금
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'center';
      [5, 10, 20, 50, 100, 200, 500].forEach(function (f) {
        ctx.beginPath(); ctx.moveTo(lx(f), Tp); ctx.lineTo(lx(f), B); ctx.stroke(); ctx.fillText(f, lx(f), B + 14);
      });
      ctx.textAlign = 'right';
      for (var i = 0; i <= 4; i++) { var v = top * i / 4; ctx.beginPath(); ctx.moveTo(L, ly(v)); ctx.lineTo(R, ly(v)); ctx.stroke(); ctx.fillText(fmtI(v), L - 5, ly(v) + 4); }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('진동수 f (Hz, 로그 눈금)', (L + R) / 2, B + 30);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('전류 I_rms (A)', 0, 0); ctx.restore();
      // 공명 진동수 선
      if (f0 >= FMIN && f0 <= FMAX) {
        ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figAmber; ctx.beginPath(); ctx.moveTo(lx(f0), Tp); ctx.lineTo(lx(f0), B); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figAmber; ctx.font = '11px ' + T.fontBody; ctx.textAlign = lx(f0) > R - 70 ? 'right' : 'left';
        ctx.fillText('f₀ = ' + fmtF(f0), lx(f0) + (lx(f0) > R - 70 ? -4 : 4), Tp + 12);
      }
      // 곡선
      ctx.beginPath();
      for (var j = 0; j <= 300; j++) {
        var f = Math.pow(10, Math.log10(FMIN) + j / 300 * (Math.log10(FMAX) - Math.log10(FMIN)));
        var y = ly(calc(f).I); if (j === 0) ctx.moveTo(lx(f), y); else ctx.lineTo(lx(f), y);
      }
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.4; ctx.stroke();
      // 현재 점
      var cI = calc(s.f).I;
      ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(lx(s.f), ly(cI), 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('색칠한 띠: I ≥ I_max/√2', L + 4, Tp + 12);
    }
    function fmtI(v) { return v >= 10 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v.toFixed(2); }
    function niceCeil(x) {
      var p = Math.pow(10, Math.floor(Math.log10(x))), m = x / p;
      var n = m <= 1 ? 1 : m <= 2 ? 2 : m <= 4 ? 4 : m <= 5 ? 5 : m <= 8 ? 8 : 10;
      return n * p;
    }
    api.onResize(draw);
    update();
  },
});
