/* 물리화학 7 양자역학의 기초: 플랑크 분포와 레일리–진스 식 비교 — 가로축(λ ↔ ν)에 따라 다른 봉우리, 모드당 평균 에너지의 '얼어붙음', 적분으로 구한 σT⁴ */
Sims.register('mj-planck-rayleigh-jeans', {
  title: '플랑크 대 레일리–진스 — 양자화가 자외선 파탄을 막는다',
  caption: '온도를 바꾸고 가로축을 파장 λ와 진동수 ν 사이에서 바꿔 보자. 위 그래프는 플랑크 분포(실선)와 레일리–진스 식(점선)이고, 아래 그래프는 같은 가로축에서 모드 하나의 평균 에너지 ⟨E⟩/k_BT = x/(eˣ − 1)(x = hν/k_BT)이다. 고전 이론은 모든 모드에 k_BT를 주지만(아래 점선 1), 양자화된 모드는 hν가 k_BT보다 크면 얼어붙어 짧은 파장에서 곡선이 0으로 떨어진다. 봉우리는 λ축에서 x = 4.965(λmaxT = 2.898 mm·K), ν축에서 x = 2.821로 서로 다른 자리에 생기며, 곡선 아래 넓이를 수치 적분한 M = (c/4)∫ρ는 σT⁴와 같다. 공동 복사(흑체)를 가정했고, 원의 색은 플랑크 스펙트럼을 CIE 1931 등색 함수의 근사식으로 sRGB로 바꾼 뒤 가장 밝은 채널을 1로 맞춘 것이다.',
  init: function (api) {
    var H = 6.62607e-34, C = 2.99792458e8, K = 1.380649e-23, SIG = 5.670374e-8;
    var st = { T: 5800, nu: false, rj: true };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.35 : 0.62; }, label: '플랑크 분포와 레일리–진스 곡선, 모드당 평균 에너지 그래프' });
    var ctx = cv.ctx;
    var rPk = api.readout('봉우리 위치');
    var rX = api.readout('봉우리의 x = hν/k_BT');
    var rM = api.readout('M = (c/4)∫ρ (수치 적분)');
    var rRJ = api.readout('레일리–진스/플랑크 (봉우리에서)');

    api.slider({ id: 'mj-planck-rayleigh-jeans-t', label: '온도 T', min: Math.log10(300), max: 4, step: 0.001, value: Math.log10(st.T),
      format: function (v) { return Math.round(Math.pow(10, v)).toLocaleString('en-US').replace(/,/g, ' ') + ' K'; },
      onInput: function (v) { st.T = Math.pow(10, v); draw(); } });
    var g = api.group();
    var bL = api.button('가로축: 파장 λ', function () { setAxis(false); }, { toggle: true, pressed: true, parent: g });
    var bN = api.button('가로축: 진동수 ν', function () { setAxis(true); }, { toggle: true, pressed: false, parent: g });
    var bR = api.button('레일리–진스 보이기', function () { st.rj = !st.rj; bR.setAttribute('aria-pressed', st.rj ? 'true' : 'false'); draw(); }, { toggle: true, pressed: true });
    function setAxis(nu) { st.nu = nu; bL.setAttribute('aria-pressed', nu ? 'false' : 'true'); bN.setAttribute('aria-pressed', nu ? 'true' : 'false'); draw(); }

    // ρ(λ) [J m⁻⁴], ρ(ν) [J s m⁻³]
    function rhoL(l, T) { var x = H * C / (l * K * T); if (x > 700) return 0; return 8 * Math.PI * H * C / Math.pow(l, 5) / Math.expm1(x); }
    function rhoN(n, T) { var x = H * n / (K * T); if (x > 700) return 0; return 8 * Math.PI * H * n * n * n / (C * C * C) / Math.expm1(x); }
    function rjL(l, T) { return 8 * Math.PI * K * T / Math.pow(l, 4); }
    function rjN(n, T) { return 8 * Math.PI * n * n * K * T / (C * C * C); }
    function nice(v) { var e = Math.pow(10, Math.floor(Math.log10(v))), m = v / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 3 ? 3 : m <= 5 ? 5 : 10) * e; }
    function sup(n) { var map = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }; return String(n).split('').map(function (c) { return map[c]; }).join(''); }
    function sci(x, d) { var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e); return m.toFixed(d) + ' × 10' + sup(e); }
    function fmtL(m) { return m >= 1e-6 ? (m * 1e6).toPrecision(3) + ' μm' : (m * 1e9).toPrecision(3) + ' nm'; }
    function wlColor(l) {
      var r = 0, g2 = 0, b = 0;
      if (l < 440) { r = (440 - l) / 60; b = 1; } else if (l < 490) { g2 = (l - 440) / 50; b = 1; }
      else if (l < 510) { g2 = 1; b = (510 - l) / 20; } else if (l < 580) { r = (l - 510) / 70; g2 = 1; }
      else if (l < 645) { r = 1; g2 = (645 - l) / 65; } else { r = 1; }
      return 'rgb(' + Math.round(r * 255) + ',' + Math.round(g2 * 255) + ',' + Math.round(b * 255) + ')';
    }
    // CIE 1931 등색 함수 근사(Wyman·Sloan·Shirley 2013)
    function gs(x, mu, s1, s2) { var t = (x - mu) / (x < mu ? s1 : s2); return Math.exp(-0.5 * t * t); }
    function cie(l) {
      return [1.056 * gs(l, 599.8, 37.9, 31.0) + 0.362 * gs(l, 442.0, 16.0, 26.7) - 0.065 * gs(l, 501.1, 20.4, 26.2),
        0.821 * gs(l, 568.8, 46.9, 40.5) + 0.286 * gs(l, 530.9, 16.3, 31.1),
        1.217 * gs(l, 437.0, 11.8, 36.0) + 0.681 * gs(l, 459.0, 26.0, 13.8)];
    }
    function bbRGB(T) {
      var X = 0, Y = 0, Z = 0;
      for (var l = 380; l <= 780; l += 5) { var p = rhoL(l * 1e-9, T), c = cie(l); X += p * c[0]; Y += p * c[1]; Z += p * c[2]; }
      var r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z, gg = -0.9689 * X + 1.8758 * Y + 0.0415 * Z, b = 0.0557 * X - 0.2040 * Y + 1.0570 * Z;
      r = Math.max(r, 0); gg = Math.max(gg, 0); b = Math.max(b, 0);
      var m = Math.max(r, gg, b) || 1;
      var gam = function (v) { v /= m; v = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; return Math.round(255 * Math.min(1, v)); };
      return 'rgb(' + gam(r) + ',' + gam(gg) + ',' + gam(b) + ')';
    }
    function integralM(T) {   // (c/4)∫ρ(λ)dλ, 심프슨
      var lm = 2.897772e-3 / T, a = lm * 0.05, b = lm * 80, n = 4000, hh = (b - a) / n, s = rhoL(a, T) + rhoL(b, T);
      for (var i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * rhoL(a + i * hh, T);
      return C / 4 * s * hh / 3;
    }

    function draw() {
      var Tk = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560, T = st.T;
      ctx.clearRect(0, 0, w, h);
      var L = narrow ? 50 : 66, R = w - (narrow ? 12 : 120), top = narrow ? 70 : 22;
      var B1 = top + (h - top) * 0.58, T2 = B1 + 46, B2 = h - 36;
      var lmW = 2.897772e-3 / T, nmW = 2.821439 * K * T / H;
      var xmax = st.nu ? nice(4.2 * nmW) : nice(5 * lmW);
      var f = st.nu ? function (v) { return rhoN(v, T); } : function (v) { return rhoL(v, T); };
      var fr = st.nu ? function (v) { return rjN(v, T); } : function (v) { return rjL(v, T); };
      var pkX = st.nu ? nmW : lmW, pkY = f(pkX);
      var ymax = pkY * 1.25;
      var sx = function (v) { return L + v / xmax * (R - L); };
      var sy = function (v) { return B1 - v / ymax * (B1 - top); };
      var unitX = st.nu ? 1e14 : (xmax >= 2e-6 ? 1e-6 : 1e-9);
      var unitName = st.nu ? '10¹⁴ Hz' : (unitX === 1e-6 ? 'μm' : 'nm');
      // 가시광선 띠
      ctx.save(); ctx.globalAlpha = Tk.dark ? 0.28 : 0.22;
      for (var lv = 380; lv < 750; lv += 4) {
        var a1 = st.nu ? C / ((lv + 4) * 1e-9) : lv * 1e-9, a2 = st.nu ? C / (lv * 1e-9) : (lv + 4) * 1e-9;
        if (a1 > xmax) continue;
        ctx.fillStyle = wlColor(lv + 2); ctx.fillRect(sx(a1), top, Math.max(1, sx(Math.min(a2, xmax)) - sx(a1)) + 0.5, B1 - top);
      }
      ctx.restore();
      // 축
      ctx.strokeStyle = Tk.rule; ctx.lineWidth = 1; ctx.fillStyle = Tk.figMuted; ctx.font = '11px ' + Tk.fontMono;
      ctx.textAlign = 'center';
      var nt = narrow ? 4 : 5;
      [[top, B1], [T2, B2]].forEach(function (pr) {
        for (var i = 0; i <= nt; i++) { var v = xmax * i / nt, X = sx(v); ctx.beginPath(); ctx.moveTo(X, pr[0]); ctx.lineTo(X, pr[1]); ctx.stroke(); ctx.fillText((v / unitX).toPrecision(3).replace(/\.?0+$/, ''), X, pr[1] + 14); }
      });
      var ex = Math.floor(Math.log10(ymax)), ys = Math.pow(10, ex), ystep = nice(ymax / 4);
      ctx.textAlign = 'right';
      for (var yv = 0; yv <= ymax * 1.0001; yv += ystep) { ctx.beginPath(); ctx.moveTo(L, sy(yv)); ctx.lineTo(R, sy(yv)); ctx.stroke(); ctx.fillText((yv / ys).toPrecision(2).replace(/\.?0+$/, ''), L - 5, sy(yv) + 4); }
      ctx.strokeStyle = Tk.figLine; ctx.strokeRect(L, top, R - L, B1 - top); ctx.strokeRect(L, T2, R - L, B2 - T2);
      ctx.fillStyle = Tk.figInk; ctx.font = '12px ' + Tk.fontBody; ctx.textAlign = 'center';
      ctx.fillText((st.nu ? '진동수 ν' : '파장 λ') + ' / ' + unitName, (L + R) / 2, B2 + 29);
      ctx.textAlign = 'left';
      ctx.fillText((st.nu ? 'ρ(ν) / (10' + sup(ex) + ' J s m⁻³)' : 'ρ(λ) / (10' + sup(ex) + ' J m⁻⁴)'), L + 4, top - 6 > 12 ? top - 6 : top + 14);
      // 곡선
      ctx.save(); ctx.beginPath(); ctx.rect(L, top, R - L, B1 - top); ctx.clip();
      var N = 500;
      if (st.rj) {
        ctx.strokeStyle = Tk.figMuted; ctx.lineWidth = 2.2; ctx.setLineDash([7, 5]); ctx.beginPath();
        var started = false;
        for (var i2 = 1; i2 <= N; i2++) { var v2 = xmax * i2 / N, y2 = fr(v2); if (y2 > ymax * 3) { started = false; continue; } if (!started) { ctx.moveTo(sx(v2), sy(y2)); started = true; } else ctx.lineTo(sx(v2), sy(y2)); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.fillStyle = Tk.figSoftBlue; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.moveTo(sx(0), sy(0));
      for (var i3 = 1; i3 <= N; i3++) { var v3 = xmax * i3 / N; ctx.lineTo(sx(v3), sy(f(v3))); }
      ctx.lineTo(sx(xmax), sy(0)); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = Tk.figBlue; ctx.lineWidth = 2.6; ctx.beginPath();
      for (var i4 = 1; i4 <= N; i4++) { var v4 = xmax * i4 / N; if (i4 === 1) ctx.moveTo(sx(v4), sy(f(v4))); else ctx.lineTo(sx(v4), sy(f(v4))); }
      ctx.stroke();
      // 다른 변수의 봉우리 자리
      var other = st.nu ? C / lmW : C / nmW;
      if (other < xmax) {
        ctx.strokeStyle = Tk.figViolet; ctx.lineWidth = 1.4; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(sx(other), top); ctx.lineTo(sx(other), B1); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.restore();
      ctx.fillStyle = Tk.figRed; ctx.beginPath(); ctx.arc(sx(pkX), sy(pkY), 5, 0, 7); ctx.fill();
      ctx.font = '600 12px ' + Tk.fontBody; ctx.textAlign = 'left';
      var pkLab = st.nu ? 'ν_max = ' + (nmW / 1e14).toPrecision(3) + ' × 10¹⁴ Hz' : 'λ_max = ' + fmtL(lmW);
      ctx.fillText(pkLab, Math.min(sx(pkX) + 8, R - 160), sy(pkY) - 8);
      if (other < xmax) {
        ctx.fillStyle = Tk.figViolet; ctx.font = '11px ' + Tk.fontBody;
        ctx.fillText(st.nu ? 'c/λ_max (λ축 봉우리)' : 'c/ν_max (ν축 봉우리)', Math.min(sx(other) + 5, R - 120), top + 16);
      }
      if (st.rj) {
        ctx.fillStyle = Tk.figMuted; ctx.font = '600 12px ' + Tk.fontBody; ctx.textAlign = 'center';
        var xr = st.nu ? xmax * 0.85 : xmax * 0.12;
        ctx.fillText('레일리–진스 → ∞', Math.max(L + 70, Math.min(sx(xr), R - 70)), top + (narrow ? 34 : 30));
      }
      // 아래: 모드당 평균 에너지
      var sy2 = function (v) { return B2 - v / 1.15 * (B2 - T2); };
      ctx.strokeStyle = Tk.rule; ctx.fillStyle = Tk.figMuted; ctx.font = '11px ' + Tk.fontMono; ctx.textAlign = 'right';
      [0, 0.5, 1].forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, sy2(v)); ctx.lineTo(R, sy2(v)); ctx.stroke(); ctx.fillText(v.toFixed(1), L - 5, sy2(v) + 4); });
      ctx.save(); ctx.beginPath(); ctx.rect(L, T2, R - L, B2 - T2); ctx.clip();
      ctx.strokeStyle = Tk.figMuted; ctx.setLineDash([7, 5]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(L, sy2(1)); ctx.lineTo(R, sy2(1)); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = Tk.figGreen; ctx.lineWidth = 2.4; ctx.beginPath();
      for (var j = 1; j <= N; j++) {
        var v5 = xmax * j / N, x5 = st.nu ? H * v5 / (K * T) : H * C / (v5 * K * T), e5 = x5 > 700 ? 0 : x5 / Math.expm1(x5);
        if (j === 1) ctx.moveTo(sx(v5), sy2(e5)); else ctx.lineTo(sx(v5), sy2(e5));
      }
      ctx.stroke(); ctx.restore();
      ctx.fillStyle = Tk.figInk; ctx.font = '600 12px ' + Tk.fontBody; ctx.textAlign = 'left';
      ctx.fillText('모드당 평균 에너지 ⟨E⟩/k_BT', L + 4, T2 - 8);
      ctx.fillStyle = Tk.figMuted; ctx.font = '11px ' + Tk.fontBody; ctx.textAlign = 'right';
      ctx.fillText('고전(등분배) = 1', R - 4, sy2(1) - 5);
      ctx.fillStyle = Tk.figGreen; ctx.textAlign = st.nu ? 'right' : 'left';
      ctx.fillText('hν ≫ k_BT: 얼어붙음', st.nu ? R - 4 : L + 6, sy2(0.12));
      // 색 견본
      var cx = narrow ? w - 34 : w - 58, cy = narrow ? 34 : 70, rr = narrow ? 22 : 34;
      ctx.fillStyle = bbRGB(T); ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.fill();
      ctx.strokeStyle = Tk.figLine; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = Tk.figInk; ctx.font = '11px ' + Tk.fontBody; ctx.textAlign = 'center';
      ctx.fillText('눈에 보이는 색', cx - (narrow ? 50 : 0), narrow ? cy + 4 : cy + rr + 16);
      if (narrow) { ctx.textAlign = 'right'; }
      // 읽은 값
      rPk.set(st.nu ? 'ν_max = ' + (nmW / 1e14).toPrecision(4) + ' × 10¹⁴ Hz (c/ν_max = ' + fmtL(C / nmW) + ')' : 'λ_max = ' + fmtL(lmW) + ' (λ_max·T = 2.898 mm·K)');
      rX.set(st.nu ? '2.821 (ν축)' : '4.965 (λ축) — c/λ_max와 ν_max는 1.76배 다르다');
      var M = integralM(T);
      rM.set(sci(M, 3) + ' W/m², σT⁴ = ' + sci(SIG * Math.pow(T, 4), 3) + ' W/m² (레일리–진스: ∞)');
      rRJ.set((fr(pkX) / pkY).toFixed(2) + '배');
    }
    api.onResize(draw);
    draw();
  },
});
