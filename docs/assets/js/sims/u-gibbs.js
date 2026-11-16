/* 일반화학 10 화학 열역학: ΔG° = ΔH° − TΔS° 직선과 전환 온도, ΔG° = −RT ln K 로 이어지는 K의 온도 의존 */
Sims.register('u-gibbs', {
  title: 'ΔH, ΔS, T가 정하는 자발성과 평형 상수',
  caption: '반응을 고르거나 ΔH°·ΔS°를 바꾸고 온도를 옮겨 보자. 위 그래프는 ΔG° = ΔH° − TΔS°(세로축 절편 ΔH°, 기울기 −ΔS°)이고, 가로축과 만나는 점이 전환 온도 T* = ΔH°/ΔS°이다. 아래 그래프는 같은 온도에서의 log K(K = e^(−ΔG°/RT))로, ΔG°의 부호가 바뀌는 T*에서 K = 1을 지나며 흡열 반응은 온도와 함께 K가 커지고 발열 반응은 작아진다. ΔH°와 ΔS°는 온도에 따라 변하지 않는다고 가정했다.',
  init: function (api) {
    var R = 8.314;
    var presets = [
      { name: 'CaCO₃ 분해', h: 178.3, s: 160.6, T: 1000 },
      { name: 'NH₃ 합성', h: -92.2, s: -198.8, T: 700 },
      { name: 'Br₂ 증발', h: 30.9, s: 93.3, T: 298 },
      { name: '얼음 융해', h: 6.0, s: 22.0, T: 263 },
    ];
    var st = { h: 178.3, s: 160.6, T: 1000 };
    var TMAX = 1500;
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.62; }, label: 'ΔG°–T 그래프와 log K–T 그래프' });
    var ctx = cv.ctx;
    var rG = api.readout('ΔG°(T)'), rK = api.readout('K'), rTs = api.readout('전환 온도 T*'), rJ = api.readout('판정');

    var g = api.group();
    var pbtn = presets.map(function (p, i) {
      return api.button(p.name, function () { choose(i); }, { toggle: true, pressed: i === 0, parent: g });
    });
    var sH = api.slider({ id: 'u-gibbs-h', label: 'ΔH°', min: -200, max: 200, step: 0.1, value: st.h,
      format: function (v) { return fmt(v, 1) + ' kJ'; }, onInput: function (v) { st.h = v; unpress(); draw(); } });
    var sS = api.slider({ id: 'u-gibbs-s', label: 'ΔS°', min: -300, max: 300, step: 0.1, value: st.s,
      format: function (v) { return fmt(v, 1) + ' J/K'; }, onInput: function (v) { st.s = v; unpress(); draw(); } });
    var sT = api.slider({ id: 'u-gibbs-t', label: '온도 T', min: 100, max: TMAX, step: 1, value: st.T,
      format: function (v) { return v + ' K'; }, onInput: function (v) { st.T = v; draw(); } });

    var lock = false;
    function choose(i) {
      var p = presets[i]; lock = true;
      sH.set(p.h); sS.set(p.s); sT.set(p.T); lock = false;
      pbtn.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
    }
    function unpress() { if (!lock) pbtn.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); }
    function fmt(v, d) { return (v < 0 ? '−' : '') + Math.abs(v).toFixed(d); }
    function dG(T) { return st.h - T * st.s / 1000; }   // kJ
    function logK(T) { return -dG(T) * 1000 / (R * T) / Math.LN10; }
    function sci(x) {
      var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e);
      if (e >= -2 && e <= 3) return x.toPrecision(3).replace(/\.?0+$/, '');
      return m.toFixed(1) + '×10' + sup(e);
    }
    function sup(n) { var m = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }; return String(n).split('').map(function (c) { return m[c]; }).join(''); }
    function niceStep(range) { var raw = range / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / p; return (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * p; }

    function readouts() {
      var G = dG(st.T), lk = logK(st.T);
      rG.set(fmt(G, 1) + ' kJ');
      rK.set(lk > 300 ? '10³⁰⁰ 이상' : lk < -300 ? '10⁻³⁰⁰ 이하' : sci(Math.pow(10, lk)));
      var ts = st.s !== 0 ? st.h * 1000 / st.s : NaN;
      if (st.h * st.s > 0) rTs.set(Math.round(ts) + ' K (' + Math.round(ts - 273.15) + ' ℃)');
      else rTs.set('없음 (ΔH°, ΔS° 부호가 반대)');
      var j;
      if (Math.abs(G) < 0.05) j = '평형 근처 (ΔG° ≈ 0, K ≈ 1)';
      else if (G < 0) j = '자발적 (표준 상태에서 정반응)';
      else j = '비자발적 (표준 상태에서 역반응)';
      rJ.set(j);
    }

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return [{ x: 0, y: 0, w: w, h: h * 0.5 }, { x: 0, y: h * 0.5, w: w, h: h * 0.5 }];
      return [{ x: 0, y: 0, w: w * 0.5, h: h }, { x: w * 0.5, y: 0, w: w * 0.5, h: h }];
    }

    function panel(T, r, title, f, yLab, opt) {
      var L = r.x + 56, Rr = r.x + r.w - 16, Tp = r.y + 30, B = r.y + r.h - 40;
      var t0 = opt.t0, vals = [], i, n = 150;
      for (i = 0; i <= n; i++) { var tt = t0 + (TMAX - t0) * i / n; vals.push([tt, f(tt)]); }
      var lo = opt.lo, hi = opt.hi;
      var sx = function (t) { return L + t / TMAX * (Rr - L); };
      var sy = function (v) { return B - (v - lo) / (hi - lo) * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(title, L, r.y + 18);
      // 자발 영역
      ctx.fillStyle = T.figSoftGreen;
      var z = opt.goodBelow ? Math.min(Math.max(sy(0), Tp), B) : Math.min(Math.max(sy(0), Tp), B);
      if (opt.goodBelow) ctx.fillRect(L, z, Rr - L, B - z); else ctx.fillRect(L, Tp, Rr - L, z - Tp);
      // 격자
      var step = niceStep(hi - lo);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right'; ctx.fillStyle = T.figMuted;
      for (var v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) {
        ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(Rr, sy(v)); ctx.stroke();
        ctx.fillText(fmt(v, step < 1 ? 1 : 0), L - 5, sy(v) + 4);
      }
      ctx.textAlign = 'center';
      for (var tk = 0; tk <= TMAX; tk += 300) ctx.fillText(tk, sx(tk), B + 15);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('T (K)', (L + Rr) / 2, B + 31);
      ctx.save(); ctx.translate(r.x + 13, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(yLab, 0, 0); ctx.restore();
      // 0 선
      if (lo < 0 && hi > 0) { ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L, sy(0)); ctx.lineTo(Rr, sy(0)); ctx.stroke(); }
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, Tp, Rr - L, B - Tp);
      // 곡선
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, Rr - L, B - Tp); ctx.clip();
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.6; ctx.beginPath();
      vals.forEach(function (p, k) { var y = sy(Math.max(lo - (hi - lo), Math.min(hi + (hi - lo), p[1]))); if (k) ctx.lineTo(sx(p[0]), y); else ctx.moveTo(sx(p[0]), y); });
      ctx.stroke();
      // T*
      if (st.h * st.s > 0) {
        var ts = st.h * 1000 / st.s;
        if (ts > t0 && ts < TMAX) {
          ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(sx(ts), sy(0), 5, 0, 7); ctx.fill();
          ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
          ctx.fillText('T*', sx(ts), sy(0) + (f(ts + 1) > 0 === opt.goodBelow ? 18 : -9));
        }
      }
      ctx.restore();
      // 현재 온도
      var cy = f(st.T), yc = sy(cy);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figInk; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx(st.T), Tp); ctx.lineTo(sx(st.T), B); ctx.stroke(); ctx.setLineDash([]);
      if (yc >= Tp && yc <= B) { ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(sx(st.T), yc, 5.5, 0, 7); ctx.fill(); }
      // 절편 표시(ΔH)
      if (opt.intercept) {
        var yi = sy(st.h);
        if (yi >= Tp && yi <= B) {
          ctx.fillStyle = T.figAccent; ctx.beginPath(); ctx.arc(sx(0), yi, 4, 0, 7); ctx.fill();
          ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('ΔH°', sx(0) + 7, yi + (st.h >= 0 ? -6 : 14));
        }
      }
      ctx.fillStyle = T.figGreen; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText(opt.goodLabel, Rr - 6, opt.goodBelow ? B - 8 : Tp + 16);
    }

    function draw() {
      var T = api.tokens(), P = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      // ΔG 범위
      var a = dG(0), b = dG(TMAX), m = Math.max(Math.abs(a), Math.abs(b), 20) * 1.1;
      var stepG = niceStep(2 * m); m = Math.ceil(m / stepG) * stepG;
      panel(T, P[0], 'ΔG° = ΔH° − TΔS°', dG, 'ΔG° (kJ)', { t0: 0, lo: -m, hi: m, goodBelow: true, intercept: true, goodLabel: 'ΔG° < 0 : 자발적' });
      var k1 = logK(100), k2 = logK(TMAX), mk = Math.min(Math.max(Math.abs(k1), Math.abs(k2), 4) * 1.05, 60);
      var stepK = niceStep(2 * mk); mk = Math.ceil(mk / stepK) * stepK;
      panel(T, P[1], 'log K  (K = e^(−ΔG°/RT))', logK, 'log K', { t0: 100, lo: -mk, hi: mk, goodBelow: false, goodLabel: 'K > 1' });
      readouts();
    }
    api.onResize(draw);
    draw();
  },
});
