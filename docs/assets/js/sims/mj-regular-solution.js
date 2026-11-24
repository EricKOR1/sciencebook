/* pchem-5 혼합물과 용액의 열역학: 정규 용액 탐색기 — g(x)와 공통 접선, 압력–조성 도표와 공비점, T–x 공존 돔 */
Sims.register('mj-regular-solution', {
  title: '정규 용액 탐색기 — ξ = W/RT 하나가 정하는 벗어남·공비점·상분리',
  caption: '상호작용 매개변수 W, 온도 T, 두 순수 성분의 증기 압력 비 p_A*/p_B*를 바꿔 보자. ① g(x) = x ln x + (1−x) ln(1−x) + ξx(1−x)는 ξ > 2이면 가운데가 위로 볼록해지고, 수평 공통 접선의 접점(●)이 공존 조성, 곡률 0인 점(▢)이 스피노달이다. ② 압력–조성 도표(p_A = x_A e^{ξx_B²} p_A*, p_B = x_B e^{ξx_A²} p_B*)는 W > 0이면 라울 직선(점선) 위로, W < 0이면 아래로 벗어나며, |ξ| > |ln(p_A*/p_B*)|이면 극대·극소에서 공비점(◆)이 생긴다. 상분리 영역에서는 두 액체 상의 활동도가 같아 증기 압력이 수평이 된다. ③ W를 고정한 T–x 도표에서 공존 돔의 꼭대기가 T_c = W/2R이다. 처음 값 W = 5.00 kJ/mol, T = 250 K는 예제 18(ξ = 2.406, 공존 0.17/0.83, 스피노달 0.295/0.705)이다. 증기는 이상 기체, 순수 성분의 증기 압력은 고정, 액체의 부피 효과는 무시한다.',
  init: function (api) {
    var R = 8.314;
    var st = { W: 5.0, T: 250, r: 1.2 };
    function xi() { return st.W * 1000 / (R * st.T); }
    function g(x, k) { return x * Math.log(x) + (1 - x) * Math.log(1 - x) + k * x * (1 - x); }
    function binodal(k) {            // ln(x/(1-x)) + k(1-2x) = 0 의 작은 근 (k > 2)
      if (k <= 2) return null;
      var lo = 1e-12, hi = 0.5 - 1e-9;
      var f = function (x) { return Math.log(x / (1 - x)) + k * (1 - 2 * x); };
      // x → 0 에서 f → −∞, x = 0.5 바로 앞에서는 f > 0 (k > 2)
      hi = 0.5 - 1e-6;
      for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
      return (lo + hi) / 2;
    }
    function spinodal(k) { if (k <= 2) return null; return (1 - Math.sqrt(1 - 2 / k)) / 2; }
    // 압력: x = x_B, 단위 p_B* (r = p_A*/p_B*)
    function pres(x, k) {
      var pa = (1 - x) * Math.exp(k * x * x) * st.r, pb = x * Math.exp(k * (1 - x) * (1 - x));
      return { p: pa + pb, y: pb / (pa + pb) };
    }
    function azeo(k) {
      if (Math.abs(k) < 1e-9) return null;
      var xA = 0.5 * (1 + Math.log(st.r) / k);
      if (!(xA > 0.001 && xA < 0.999)) return null;
      return 1 - xA;   // x_B
    }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 2.45 : 0.95; }, label: '평균 몰 혼합 깁스 에너지 곡선, 압력–조성 도표, 온도–조성 공존 돔' });
    var ctx = cv.ctx;
    var rX = api.readout('ξ = W/RT ');
    var rS = api.readout('상태 ');
    var rA = api.readout('공비점 ');
    var rC = api.readout('T_c = W/2R ');

    var sW = api.slider({ id: 'mj-regular-solution-w', label: '상호작용 매개변수 W', min: -6, max: 8, step: 0.1, value: st.W,
      format: function (v) { return (v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + ' kJ/mol'; }, onInput: function (v) { st.W = v; draw(); } });
    var sT = api.slider({ id: 'mj-regular-solution-t', label: '온도 T', min: 200, max: 400, step: 1, value: st.T,
      format: function (v) { return v.toFixed(0) + ' K'; }, onInput: function (v) { st.T = v; draw(); } });
    api.slider({ id: 'mj-regular-solution-r', label: '증기 압력 비 p_A*/p_B*', min: 0.5, max: 3, step: 0.05, value: st.r,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.r = v; draw(); } });
    var gb = api.group();
    api.button('예제 18로 되돌리기', function () { sW.set(5.0); sT.set(250); draw(); }, { parent: gb });

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) {
        var ph = (h - 3 * 66) / 3;
        return [{ x: 54, y: 22, w: w - 70, h: ph }, { x: 54, y: 22 + ph + 66, w: w - 70, h: ph }, { x: 54, y: 22 + 2 * (ph + 66), w: w - 70, h: ph }];
      }
      var pw = (w - 54 * 2 - 40) / 2, ph2 = (h - 2 * 70) / 2;
      return [{ x: 54, y: 22, w: pw, h: ph2 }, { x: 54 + pw + 94, y: 22, w: pw, h: ph2 }, { x: 54, y: 22 + ph2 + 70, w: pw, h: ph2 }, { x: 54 + pw + 94, y: 22 + ph2 + 70, w: pw, h: ph2 }];
    }
    function axes(T, r, xr, yr, xt, yt, xl, yl, title, fy) {
      ctx.fillStyle = T.figPanel; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(r.x, r.y, r.w, r.h);
      var X = function (v) { return r.x + (v - xr[0]) / (xr[1] - xr[0]) * r.w; };
      var Y = function (v) { return r.y + r.h - (v - yr[0]) / (yr[1] - yr[0]) * r.h; };
      ctx.setLineDash([2, 4]); ctx.strokeStyle = T.figLine;
      xt.forEach(function (v) { ctx.beginPath(); ctx.moveTo(X(v), r.y); ctx.lineTo(X(v), r.y + r.h); ctx.stroke(); });
      yt.forEach(function (v) { ctx.beginPath(); ctx.moveTo(r.x, Y(v)); ctx.lineTo(r.x + r.w, Y(v)); ctx.stroke(); });
      ctx.setLineDash([]);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      xt.forEach(function (v) { ctx.fillText(v.toFixed(1), X(v), r.y + r.h + 3); });
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      yt.forEach(function (v) { ctx.fillText(fy(v), r.x - 4, Y(v)); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(xl, r.x + r.w / 2, r.y + r.h + 18);
      ctx.save(); ctx.translate(r.x - 40, r.y + r.h / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'middle'; ctx.fillText(yl, 0, 0); ctx.restore();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText(title, r.x, r.y - 4);
      return { X: X, Y: Y };
    }
    function clip(r) { ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); }
    function curve(f, x0, x1, n, A) {
      ctx.beginPath();
      for (var i = 0; i <= n; i++) { var x = x0 + (x1 - x0) * i / n, v = f(x); if (i) ctx.lineTo(A.X(v[0]), A.Y(v[1])); else ctx.moveTo(A.X(v[0]), A.Y(v[1])); }
      ctx.stroke();
    }
    function dot(A, x, y, col, shape) {
      var px = A.X(x), py = A.Y(y);
      ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 2;
      if (shape === 'sq') { ctx.fillStyle = api.tokens().figPanel; ctx.fillRect(px - 4, py - 4, 8, 8); ctx.strokeRect(px - 4, py - 4, 8, 8); }
      else if (shape === 'dia') { ctx.beginPath(); ctx.moveTo(px, py - 6); ctx.lineTo(px + 6, py); ctx.lineTo(px, py + 6); ctx.lineTo(px - 6, py); ctx.closePath(); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(px, py, 4.5, 0, 7); ctx.fill(); }
    }
    function text(T, s, x, y, col, align) {
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
      var w = ctx.measureText(s).width, x0 = align === 'right' ? x - w : (align === 'center' ? x - w / 2 : x);
      ctx.fillStyle = T.figPanel; ctx.fillRect(x0 - 2, y - 7, w + 4, 14);
      ctx.fillStyle = col; ctx.fillText(s, x, y);
    }
    function nice(v) { return (v < 0 ? '−' : '') + Math.abs(v).toFixed(2).replace(/\.?0+$/, function (m) { return m === '.00' ? '' : m; }); }

    function draw() {
      var T = api.tokens(), L = layout(), k = xi();
      ctx.clearRect(0, 0, cv.w, cv.h);
      var xb = binodal(k), xs = spinodal(k), xa = azeo(k);
      var xt = [0, 0.2, 0.4, 0.6, 0.8, 1];
      // ① g(x)
      var gmin = Math.min(-0.75, g(0.5, Math.min(k, 0)) - 0.05), gmax = Math.max(0.1, g(0.5, k) + 0.05);
      gmin = Math.floor(gmin * 10) / 10; gmax = Math.ceil(gmax * 10) / 10;
      var gyt = []; var stp = (gmax - gmin) > 1.2 ? 0.4 : 0.2;
      for (var v = Math.ceil(gmin / stp) * stp; v <= gmax + 1e-9; v += stp) gyt.push(+v.toFixed(2));
      var A = axes(T, L[0], [0, 1], [gmin, gmax], xt, gyt, 'B의 몰 분율 x_B', 'g = ΔmixG/nRT', '① 평균 몰 혼합 깁스 에너지', function (v) { return nice(v); });
      clip(L[0]);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(A.X(0), A.Y(0)); ctx.lineTo(A.X(1), A.Y(0)); ctx.stroke();
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]);
      curve(function (x) { return [x, g(x, 0)]; }, 1e-6, 1 - 1e-6, 200, A); ctx.setLineDash([]);
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2.6;
      curve(function (x) { return [x, g(x, k)]; }, 1e-6, 1 - 1e-6, 300, A);
      if (xb !== null) {
        var gb0 = g(xb, k);
        ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(A.X(xb), A.Y(gb0)); ctx.lineTo(A.X(1 - xb), A.Y(gb0)); ctx.stroke(); ctx.setLineDash([]);
        dot(A, xb, gb0, T.figRed); dot(A, 1 - xb, gb0, T.figRed);
        dot(A, xs, g(xs, k), T.figRed, 'sq'); dot(A, 1 - xs, g(1 - xs, k), T.figRed, 'sq');
      }
      ctx.restore();
      text(T, '점선: 이상 혼합(ξ = 0)', L[0].x + L[0].w - 4, L[0].y + L[0].h - 10, T.figMuted, 'right');
      // ② 압력–조성
      var pmaxv = Math.max(st.r, 1), i;
      for (i = 0; i <= 200; i++) { var xq = i / 200; if (xb !== null && xq > xb && xq < 1 - xb) continue; pmaxv = Math.max(pmaxv, pres(xq, k).p); }
      var pyMax = Math.ceil(pmaxv * 1.1 * 2) / 2, pyt = [];
      var ps = pyMax > 6 ? 2 : (pyMax > 3 ? 1 : 0.5);
      for (v = 0; v <= pyMax + 1e-9; v += ps) pyt.push(+v.toFixed(1));
      var B = axes(T, L[1], [0, 1], [0, pyMax], xt, pyt, 'B의 몰 분율 (액체 x_B, 증기 y_B)', 'p / p_B*', '② 압력–조성 도표(온도 T)', function (v) { return String(v); });
      clip(L[1]);
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(B.X(0), B.Y(st.r)); ctx.lineTo(B.X(1), B.Y(1)); ctx.stroke(); ctx.setLineDash([]);
      var lo = xb !== null ? xb : 0.5, hi = xb !== null ? 1 - xb : 0.5;
      // 거품점(액체)
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2.4;
      if (xb === null) curve(function (x) { return [x, pres(x, k).p]; }, 0, 1, 300, B);
      else {
        curve(function (x) { return [x, pres(x, k).p]; }, 0, lo, 150, B);
        curve(function (x) { return [x, pres(x, k).p]; }, hi, 1, 150, B);
        var p3 = pres(lo, k).p;
        ctx.beginPath(); ctx.moveTo(B.X(lo), B.Y(p3)); ctx.lineTo(B.X(hi), B.Y(p3)); ctx.stroke();
        ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
        curve(function (x) { return [x, pres(x, k).p]; }, lo, hi, 100, B); ctx.setLineDash([]);
      }
      // 이슬점(증기)
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.4;
      if (xb === null) curve(function (x) { var q = pres(x, k); return [q.y, q.p]; }, 0, 1, 300, B);
      else {
        curve(function (x) { var q = pres(x, k); return [q.y, q.p]; }, 0, lo, 150, B);
        curve(function (x) { var q = pres(x, k); return [q.y, q.p]; }, hi, 1, 150, B);
      }
      if (xa !== null && (xb === null || xa < lo || xa > hi)) dot(B, xa, pres(xa, k).p, T.figViolet, 'dia');
      ctx.restore();
      text(T, '파랑: 거품점(액체)  빨강: 이슬점(증기)', L[1].x + 4, L[1].y + 10, T.figInk, 'left');
      if (xb !== null) text(T, '수평: 두 액체 상 + 증기', B.X(0.5), B.Y(pres(lo, k).p) + 14, T.figBlue, 'center');
      // ③ T–x 공존 돔 (W 고정)
      var Tc = st.W * 1000 / (2 * R);
      var tTop = 500, tBot = 100;
      var C = axes(T, L[2], [0, 1], [tBot, tTop], xt, [100, 200, 300, 400, 500], 'B의 몰 분율 x_B', '온도 T (K)', '③ W를 고정한 T–x 도표', function (v) { return String(v); });
      clip(L[2]);
      if (st.W > 0) {
        ctx.fillStyle = T.figSoftViolet; ctx.strokeStyle = T.figViolet; ctx.lineWidth = 2.4;
        ctx.beginPath();
        var first = true;
        for (i = 1; i <= 400; i++) {
          var x = 0.5 * Math.pow(i / 400, 2.2);  // 0 → 0.5
          if (x >= 0.4999) x = 0.4999;
          var Tb = st.W * 1000 * (1 - 2 * x) / (R * Math.log((1 - x) / x));
          if (first) { ctx.moveTo(C.X(x), C.Y(Tb)); first = false; } else ctx.lineTo(C.X(x), C.Y(Tb));
        }
        for (i = 400; i >= 1; i--) {
          var x2 = 0.5 * Math.pow(i / 400, 2.2); if (x2 >= 0.4999) x2 = 0.4999;
          var Tb2 = st.W * 1000 * (1 - 2 * x2) / (R * Math.log((1 - x2) / x2));
          ctx.lineTo(C.X(1 - x2), C.Y(Tb2));
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.3; ctx.setLineDash([4, 3]);
        curve(function (x) { return [x, 2 * st.W * 1000 * x * (1 - x) / R]; }, 0, 1, 200, C); ctx.setLineDash([]);
        dot(C, 0.5, Tc, T.figRed);
      }
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(C.X(0), C.Y(st.T)); ctx.lineTo(C.X(1), C.Y(st.T)); ctx.stroke();
      if (xb !== null) { dot(C, xb, st.T, T.figRed); dot(C, 1 - xb, st.T, T.figRed); }
      ctx.restore();
      text(T, '현재 T = ' + st.T + ' K', C.X(0.02), C.Y(st.T) - 10, T.figInk, 'left');
      if (st.W > 0) {
        if (Tc < tTop - 8) text(T, 'T_c = ' + Tc.toFixed(0) + ' K', C.X(0.5), C.Y(Tc) - 12, T.figRed, 'center');
        else text(T, 'T_c = ' + Tc.toFixed(0) + ' K (위로 벗어남)', C.X(0.5), C.Y(tTop) + 12, T.figRed, 'center');
        text(T, '실선: 공존 곡선  점선: 스피노달', L[2].x + L[2].w - 4, L[2].y + L[2].h - 10, T.figMuted, 'right');
      } else text(T, 'W ≤ 0: 모든 온도에서 섞인다(돔 없음)', C.X(0.5), C.Y(450), T.figInk, 'center');
      // ④ (넓은 화면) 요약 칸
      if (L[3]) {
        var r = L[3], lines = [];
        lines.push(['ξ = W/RT = ' + nice(k), T.figInk, true]);
        if (k > 2) {
          lines.push(['ξ > 2 → 두 액체 상으로 갈라질 수 있다', T.figRed]);
          lines.push(['공존 조성 ' + xb.toFixed(3) + ' / ' + (1 - xb).toFixed(3), T.figRed]);
          lines.push(['스피노달 ' + xs.toFixed(3) + ' / ' + (1 - xs).toFixed(3), T.figRed]);
        } else if (k > 0) lines.push(['0 < ξ ≤ 2 → 양의 벗어남, 한 상', T.figBlue]);
        else if (k < 0) lines.push(['ξ < 0 → 음의 벗어남, 한 상', T.figBlue]);
        else lines.push(['ξ = 0 → 이상 용액', T.figBlue]);
        lines.push(['ln(p_A*/p_B*) = ' + nice(Math.log(st.r)), T.figInk]);
        if (xa !== null && (xb === null || xa < lo || xa > hi)) {
          var pa0 = pres(xa, k).p;
          lines.push(['공비점 x_B = ' + xa.toFixed(3) + (k > 0 ? ' (압력 극대 → 최저 끓는점)' : ' (압력 극소 → 최고 끓는점)'), T.figViolet]);
          lines.push(['  p / p_B* = ' + pa0.toFixed(3), T.figViolet]);
        } else if (xb !== null) lines.push(['공비 대신 액액 상분리', T.figViolet]);
        else lines.push(['공비점 없음: |ξ| ≤ |ln(p_A*/p_B*)|', T.figMuted]);
        ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText('④ 지금의 상태', r.x - 10, r.y - 4);
        ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.fillRect(r.x - 10, r.y, r.w + 10, r.h); ctx.strokeRect(r.x - 10, r.y, r.w + 10, r.h);
        lines.forEach(function (ln, j) {
          ctx.font = (ln[2] ? '600 ' : '') + '12px ' + T.fontBody; ctx.fillStyle = ln[1]; ctx.textBaseline = 'middle';
          ctx.fillText(ln[0], r.x, r.y + 18 + j * 21);
        });
      }
      rX.set(nice(k));
      rS.set(k > 2 ? '두 상 가능 — 공존 ' + xb.toFixed(3) + '/' + (1 - xb).toFixed(3) + ', 스피노달 ' + xs.toFixed(3) + '/' + (1 - xs).toFixed(3) : (k > 0 ? '한 상(양의 벗어남)' : (k < 0 ? '한 상(음의 벗어남)' : '이상 용액')));
      rA.set(xa !== null && (xb === null || xa < lo || xa > hi) ? 'x_B = ' + xa.toFixed(3) + (k > 0 ? ' (최저 끓는점)' : ' (최고 끓는점)') : (xb !== null ? '액액 상분리' : '없음'));
      rC.set(st.W > 0 ? Tc.toFixed(0) + ' K' : '없음(W ≤ 0)');
    }
    api.onResize(draw); api.onTheme(draw);
    draw();
  }
});
