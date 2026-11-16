/* 일반화학 7 화학 반응 속도론: 아레니우스 식 k = A·exp(−Ea/RT) — ln k 대 1/T 직선과 온도에 따른 k의 지수적 증가 */
Sims.register('u-arrhenius', {
  title: '아레니우스 그래프 — 기울기는 −Eₐ/R, 절편은 ln A',
  caption: '활성화 에너지 Eₐ와 빈도 인자 A를 바꿔 보자. ln k를 1/T에 대해 그리면 기울기 −Eₐ/R인 직선이 되고, A는 직선을 위아래로만 옮긴다. 오른쪽 그래프는 25 ℃의 k를 1로 둔 상대 속도로, Eₐ가 클수록 온도에 더 민감하다(회색 점선은 "10 ℃에 2배" 규칙에 해당하는 Eₐ ≈ 53 kJ/mol). 촉매를 켜면 A는 그대로 두고 Eₐ만 20 kJ/mol 낮춘 직선이 함께 그려진다. A와 Eₐ는 온도에 무관하다고 가정했다.',
  init: function (api) {
    var R = 8.314;
    var st = { Ea: 75, logA: 12, cat: false, data: false };
    var DATA = [[300, 4.76e-4], [310, 1.48e-3], [320, 4.31e-3], [330, 1.18e-2], [340, 3.02e-2]];
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.35 : 0.48; }, label: '아레니우스 그래프와 온도에 따른 상대 속도' });
    var ctx = cv.ctx;
    var rK = api.readout('k (298 K)');
    var rSlope = api.readout('기울기 −Eₐ/R');
    var rRatio = api.readout('k(308 K) / k(298 K)');
    var rCat = api.readout('촉매로 빨라진 배율 (298 K)');

    var eaS = api.slider({ id: 'u-arrhenius-ea', label: '활성화 에너지 Eₐ', min: 20, max: 150, step: 0.5, value: st.Ea,
      format: function (v) { return v.toFixed(1) + ' kJ/mol'; }, onInput: function (v) { st.Ea = v; update(); } });
    var aS = api.slider({ id: 'u-arrhenius-a', label: '빈도 인자 A', min: 8, max: 16, step: 0.1, value: st.logA,
      format: function (v) { return sci(Math.pow(10, v)) + ' s⁻¹'; }, onInput: function (v) { st.logA = v; update(); } });
    var g = api.group();
    var catB = api.button('촉매 (Eₐ − 20 kJ/mol)', function () { st.cat = !st.cat; catB.setAttribute('aria-pressed', st.cat ? 'true' : 'false'); update(); }, { toggle: true, parent: g });
    api.button('예제 12 자료 보기', function () { st.data = true; eaS.set(88.0); aS.set(12.0); }, { parent: g });

    function sci(x) { var e = Math.floor(Math.log10(x) + 1e-9), m = x / Math.pow(10, e); return (m.toFixed(1) === '1.0' ? '' : m.toFixed(1) + '×') + '10' + sup(e); }
    function sup(n) { var m = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }; return String(n).split('').map(function (c) { return m[c]; }).join(''); }
    function sciK(x) { var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e); return m.toFixed(2) + ' × 10' + sup(e); }
    function lnk(T, Ea) { return st.logA * Math.LN10 - Ea * 1000 / (R * T); }
    function update() {
      rK.set(sciK(Math.exp(lnk(298.15, st.Ea))) + ' s⁻¹');
      rSlope.set('−' + Math.round(st.Ea * 1000 / R).toLocaleString('en-US') + ' K');
      rRatio.set(Math.exp(lnk(308.15, st.Ea) - lnk(298.15, st.Ea)).toFixed(2) + ' 배');
      var ec = Math.max(1, st.Ea - 20);
      rCat.set(st.cat ? sciK(Math.exp((st.Ea - ec) * 1000 / (R * 298.15))) + ' 배' : '촉매 꺼짐');
      draw();
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, stacked = w < 560;
      ctx.clearRect(0, 0, w, h);
      var p1 = stacked ? { x: 0, y: 0, w: w, h: h * 0.52 } : { x: 0, y: 0, w: w * 0.56, h: h };
      var p2 = stacked ? { x: 0, y: h * 0.54, w: w, h: h * 0.46 } : { x: w * 0.58, y: 0, w: w * 0.42, h: h };
      arrPlot(T, p1); relPlot(T, p2);
    }

    function arrPlot(T, r) {
      var L = r.x + 50, Rr = r.x + r.w - 14, Tp = r.y + 34, B = r.y + r.h - 40;
      var x0 = 2.5e-3, x1 = 4.0e-3, y0 = -60, y1 = 35;
      var sx = function (v) { return L + (v - x0) / (x1 - x0) * (Rr - L); };
      var sy = function (v) { return B - (v - y0) / (y1 - y0) * (B - Tp); };
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.textAlign = 'right';
      for (var v = -60; v <= 30; v += 15) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(Rr, sy(v)); ctx.stroke(); ctx.fillText(String(v).replace('-', '−'), L - 5, sy(v) + 4); }
      ctx.textAlign = 'center';
      [2.5, 3.0, 3.5, 4.0].forEach(function (u) { ctx.fillText(u.toFixed(1), sx(u * 1e-3), B + 14); });
      // 위쪽 온도 눈금
      [400, 350, 300, 250].forEach(function (Tk) {
        var x = sx(1 / Tk); ctx.beginPath(); ctx.moveTo(x, Tp); ctx.lineTo(x, Tp - 4); ctx.stroke();
        ctx.fillText(Tk + ' K', x, Tp - 7);
      });
      ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.lineTo(Rr, B); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(Rr, Tp); ctx.strokeStyle = T.figLine; ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('1/T (10⁻³ K⁻¹)', (L + Rr) / 2, B + 30);
      ctx.textAlign = 'left'; ctx.font = '600 12px ' + T.fontBody;
      ctx.fillText('ln k (k: s⁻¹)', r.x + 6, r.y + 13);
      // 직선
      function lineFor(Ea, color, dash) {
        ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, Rr - L, B - Tp); ctx.clip();
        ctx.setLineDash(dash || []); ctx.strokeStyle = color; ctx.lineWidth = 2.6; ctx.beginPath();
        ctx.moveTo(sx(x0), sy(lnk(1 / x0, Ea))); ctx.lineTo(sx(x1), sy(lnk(1 / x1, Ea))); ctx.stroke(); ctx.restore();
      }
      if (st.cat) lineFor(Math.max(1, st.Ea - 20), T.figGreen, [7, 4]);
      lineFor(st.Ea, T.figAccent);
      // 25 ℃ 표시점
      var xm = sx(1 / 298.15), ym = sy(lnk(298.15, st.Ea));
      if (ym > Tp && ym < B) { ctx.fillStyle = T.figAccent; ctx.beginPath(); ctx.arc(xm, ym, 4.5, 0, Math.PI * 2); ctx.fill(); }
      // 자료점
      if (st.data) {
        DATA.forEach(function (d) {
          ctx.beginPath(); ctx.arc(sx(1 / d[0]), sy(Math.log(d[1])), 5, 0, Math.PI * 2);
          ctx.fillStyle = T.figPanel; ctx.fill(); ctx.strokeStyle = T.figRed; ctx.lineWidth = 2; ctx.stroke();
        });
        ctx.fillStyle = T.figRed; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('○ 예제 12 측정값(300~340 K)', L + 8, B - 10);
      }
      // 기울기 설명
      ctx.fillStyle = T.figAccent; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('기울기 = −Eₐ/R', Rr - 4, Tp + 16);
      if (st.cat) { ctx.fillStyle = T.figGreen; ctx.fillText('촉매: 덜 가파름', Rr - 4, Tp + 32); }
    }

    function relPlot(T, r) {
      var L = r.x + 50, Rr = r.x + r.w - 14, Tp = r.y + 34, B = r.y + r.h - 40;
      var t0 = 280, t1 = 340;
      var rel = function (Tk, Ea) { return Math.exp(lnk(Tk, Ea) - lnk(298.15, Ea)); };
      var ymax = Math.max(rel(t1, st.Ea), rel(t1, 53), st.cat ? 1 : 1);
      var step = niceStep(ymax, 4); ymax = Math.ceil(ymax / step) * step;
      var sx = function (v) { return L + (v - t0) / (t1 - t0) * (Rr - L); };
      var sy = function (v) { return B - v / ymax * (B - Tp); };
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.textAlign = 'right';
      for (var v = 0; v <= ymax + 1e-9; v += step) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(Rr, sy(v)); ctx.stroke(); ctx.fillText(fmtN(v), L - 5, sy(v) + 4); }
      ctx.textAlign = 'center';
      for (var tk = 280; tk <= 340; tk += 20) ctx.fillText(tk, sx(tk), B + 14);
      ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(L, Tp - 4); ctx.lineTo(L, B); ctx.lineTo(Rr, B); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.fillText('T (K)', (L + Rr) / 2, B + 30);
      ctx.textAlign = 'left'; ctx.font = '600 12px ' + T.fontBody;
      ctx.fillText('k(T) / k(298 K)', r.x + 6, r.y + 13);
      function curve(Ea, color, dash, lw) {
        ctx.setLineDash(dash || []); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
        for (var i = 0; i <= 120; i++) { var Tk = t0 + (t1 - t0) * i / 120, y = sy(rel(Tk, Ea)); if (i) ctx.lineTo(sx(Tk), y); else ctx.moveTo(sx(Tk), y); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      curve(53, T.figMuted, [5, 4], 1.6);
      curve(st.Ea, T.figAccent, null, 2.6);
      // 298, 308 표시
      [298.15, 308.15].forEach(function (Tk, i) {
        var y = sy(rel(Tk, st.Ea));
        ctx.strokeStyle = T.figAmber; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sx(Tk), B); ctx.lineTo(sx(Tk), y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.arc(sx(Tk), y, 4, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = T.figAmber; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('25 ℃ → 35 ℃', sx(298.15) - 30, Tp + 10);
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      var yr = sy(rel(t1, 53));
      ctx.fillText('Eₐ = 53 kJ/mol', Rr - 2, Math.max(Tp + 26, yr - 6));
    }
    function niceStep(range, n) { var raw = range / n, e = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / e; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * e; }
    function fmtN(v) { return v >= 10 ? String(Math.round(v)) : v >= 1 ? String(Math.round(v * 100) / 100) : v.toFixed(1); }

    api.onResize(draw);
    update();
  },
});
