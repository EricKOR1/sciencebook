/* 유기화학 4 유기 반응의 개관: 반응 에너지 도표 탐색기 — 아이링 식으로 본 각 단계의 k, 속도 결정 단계, 해먼드 가설(폴라니 계수) */
Sims.register('mj-energy-profile', {
  title: '반응 에너지 도표 탐색기 — 장벽 높이를 속도로, 해먼드 가설을 눈으로',
  caption: '슬라이더로 중간체 I, 두 전이 상태 TS1·TS2, 생성물 P의 높이와 온도를 바꾸어 보자. 각 단계의 속도 상수는 아이링 식 k = (k_BT/h)e^(−ΔG‡/RT)(κ = 1, 모든 단계를 1차로 봄)로 계산하며, ' +
    '반응물에서 본 가장 높은 꼭대기가 빨갛게 칠해진 속도 결정 단계이다(I가 R보다 낮으면 I가 쌓이므로 TS2의 장벽은 I에서 재어 비교한다). 장벽을 5.7 kJ/mol 낮출 때마다(25 ℃) k가 10배 커지는 것을 확인할 수 있다. ' +
    '"해먼드 모드"를 켜면 TS1의 높이가 ΔG‡₁ = (고유 장벽) + α·ΔG°₁ (ΔG°₁ = I의 높이)로 I를 따라 움직이고, TS1의 가로 위치가 에너지가 더 가까운 쪽(흡열이면 I 쪽)으로 옮겨 간다. ' +
    '곡선은 정류점을 매끄럽게 이은 모식도이며, 높이는 반응물 R을 0으로 둔 깁스 에너지(kJ/mol)이다.',
  init: function (api) {
    var N = 'mj-energy-profile';
    var st = { two: true, I: 85, T1: 100, T2: 90, P: -20, T: 298, ham: false, alpha: 0.8, E0: 32 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.52; }, label: '두 단계 반응의 깁스 에너지 도표와 각 단계의 장벽' });
    var ctx = cv.ctx;
    var rK1 = api.readout('k₁ (R→I)'), rK2 = api.readout('k₂ (I→P)'), rH = api.readout('반감기'), rR = api.readout('속도 결정 단계'), rKe = api.readout('전체 K');
    var g1 = api.group();
    var bS2 = api.button('SN2(한 단계)', function () { preset(false); }, { parent: g1 });
    var bS1 = api.button('SN1(두 단계)', function () { preset(true); }, { parent: g1, primary: true });
    var bH = api.button('해먼드 모드', function () { st.ham = !st.ham; bH.setAttribute('aria-pressed', st.ham ? 'true' : 'false'); if (st.ham) st.E0 = st.T1 - st.alpha * st.I; sync(); draw(); }, { parent: g1, toggle: true });
    var sI = api.slider({ id: N + '-i', label: '중간체 I', min: -20, max: 90, step: 1, value: st.I, format: kj, onInput: function (v) { st.I = v; draw(); } });
    var sT1 = api.slider({ id: N + '-t1', label: 'TS1', min: 0, max: 130, step: 1, value: st.T1, format: kj, onInput: function (v) { if (st.ham) st.E0 = v - st.alpha * st.I; else st.T1 = v; draw(); } });
    var sT2 = api.slider({ id: N + '-t2', label: 'TS2', min: -10, max: 130, step: 1, value: st.T2, format: kj, onInput: function (v) { st.T2 = v; draw(); } });
    var sP = api.slider({ id: N + '-p', label: '생성물 P', min: -80, max: 60, step: 1, value: st.P, format: kj, onInput: function (v) { st.P = v; draw(); } });
    var sTt = api.slider({ id: N + '-temp', label: '온도', min: 250, max: 400, step: 1, value: st.T, format: function (v) { return v + ' K'; }, onInput: function (v) { st.T = v; draw(); } });
    var sA = api.slider({ id: N + '-alpha', label: '폴라니 계수 α', min: 0, max: 1, step: 0.05, value: st.alpha, format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.alpha = v; draw(); } });
    function kj(v) { return (v < 0 ? '−' + (-v) : v) + ' kJ/mol'; }
    function preset(two) {
      st.two = two;
      if (two) { st.I = 85; st.T1 = 100; st.T2 = 90; st.P = -20; }
      else { st.T1 = 90; st.P = -30; }
      st.ham = false; bH.setAttribute('aria-pressed', 'false');
      bS1.className = 'sim-btn' + (two ? ' primary' : ''); bS2.className = 'sim-btn' + (two ? '' : ' primary');
      sync(); draw();
    }
    function sync() {
      sI.input.value = st.I; sT1.input.value = st.ham ? st.E0 + st.alpha * st.I : st.T1; sT2.input.value = st.T2; sP.input.value = st.P;
      [sI, sT2].forEach(function (s) { s.input.disabled = !st.two; s.input.parentNode.style.opacity = st.two ? 1 : 0.45; });
      sA.input.disabled = !st.ham; sA.input.parentNode.style.opacity = st.ham ? 1 : 0.45;
    }
    // 정류점 계산(제약: 꼭대기는 양옆 골짜기보다 2 kJ/mol 이상 높다)
    function points() {
      var R = 0, I = st.I, P = st.P, t1, t2, x1 = 0.33, x2 = 0.62;
      if (!st.two) {
        t1 = Math.max(st.T1, Math.max(R, P) + 2);
        var f = st.ham ? clamp((t1 - R) / ((t1 - R) + (t1 - P)), 0.15, 0.85) : 0.5;
        return { two: false, pts: [[0.03, R], [0.12, R], [0.12 + 0.76 * f, t1], [0.88, P], [0.97, P]], t1: t1, xs: [0.12 + 0.76 * f] };
      }
      t1 = st.ham ? st.E0 + st.alpha * I : st.T1;
      t1 = Math.max(t1, Math.max(R, I) + 2);
      t2 = Math.max(st.T2, Math.max(I, P) + 2);
      if (st.ham) { var f1 = clamp((t1 - R) / ((t1 - R) + (t1 - I)), 0.15, 0.85); x1 = 0.08 + (0.5 - 0.08) * f1; }
      return { two: true, pts: [[0.03, R], [0.08, R], [x1, t1], [0.5, I], [x2, t2], [0.9, P], [0.97, P]], t1: t1, t2: t2, xs: [x1, x2] };
    }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function eyring(dG, T) { var kB = 1.380649e-23, h = 6.62607015e-34, R = 8.314; return kB * T / h * Math.exp(-dG * 1000 / (R * T)); }
    function fmt(v) {
      if (!isFinite(v)) return '∞';
      var a = Math.abs(v); if (a === 0) return '0';
      if (a >= 1000 || a < 0.01) { var e = Math.floor(Math.log10(a)), m = v / Math.pow(10, e); return m.toFixed(2) + '×10' + sup(e); }
      return v.toPrecision(3);
    }
    function sup(e) { var m = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }; return String(e).split('').map(function (c) { return m[c]; }).join(''); }
    function tfmt(s) {
      if (s < 1e-3) return fmt(s) + ' s';
      if (s < 60) return (+s.toPrecision(3)) + ' s';
      if (s < 3600) return (s / 60).toFixed(1) + ' min';
      if (s < 86400 * 2) return (s / 3600).toFixed(1) + ' h';
      if (s < 86400 * 365 * 2) return (s / 86400).toFixed(1) + ' 일';
      return fmt(s / (86400 * 365)) + ' 년';
    }
    function smooth(pts) {
      var out = [];
      for (var i = 0; i < pts.length - 1; i++) {
        for (var k = 0; k <= 40; k++) { var t = k / 40, s = t * t * (3 - 2 * t); out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * s]); }
      }
      return out;
    }
    function draw() {
      var T = api.tokens(), W = cv.w, H = cv.h, pp = points();
      ctx.clearRect(0, 0, W, H);
      ctx.font = '12px ' + T.fontBody;
      var L = 52, Rr = W - 14, Tp = 24, B = H - 44, gmin = -90, gmax = 140;
      function X(x) { return L + (Rr - L) * x; }
      function Y(g) { return B - (g - gmin) / (gmax - gmin) * (B - Tp); }
      // 축
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(L, Tp - 6); ctx.lineTo(L, B); ctx.lineTo(Rr, B); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      for (var g = -80; g <= 140; g += 40) { ctx.fillText(String(g).replace('-', '−'), L - 6, Y(g) + 4); ctx.strokeStyle = T.figLine; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(L, Y(g)); ctx.lineTo(Rr, Y(g)); ctx.stroke(); }
      ctx.save(); ctx.translate(14, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('G (kJ/mol)', 0, 0); ctx.restore();
      ctx.textAlign = 'right'; ctx.fillText('반응 좌표 →', Rr, B + 18);
      // 곡선
      var cur = smooth(pp.pts);
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2.6; ctx.beginPath();
      cur.forEach(function (p, i) { if (i) ctx.lineTo(X(p[0]), Y(p[1])); else ctx.moveTo(X(p[0]), Y(p[1])); }); ctx.stroke();
      // 속도 결정 단계
      var k1, k2, km1, rds, Ke = Math.exp(-st.P * 1000 / (8.314 * st.T));
      if (pp.two) {
        k1 = eyring(pp.t1, st.T); k2 = eyring(pp.t2 - st.I, st.T); km1 = eyring(pp.t1 - st.I, st.T);
        rds = pp.t1 >= pp.t2 - Math.min(0, st.I) ? 1 : 2;   // I가 R보다 낮으면 I가 쌓이므로 TS2 장벽은 I에서 잰다
      } else { k1 = eyring(pp.t1, st.T); rds = 1; }
      var peaks = pp.two ? [[pp.xs[0], pp.t1, 'TS1'], [pp.xs[1], pp.t2, 'TS2']] : [[pp.xs[0], pp.t1, 'TS']];
      peaks.forEach(function (q, i) {
        var hot = (i + 1) === rds;
        ctx.fillStyle = hot ? T.figRed : T.figInk;
        ctx.beginPath(); ctx.arc(X(q[0]), Y(q[1]), hot ? 6 : 4, 0, 7); ctx.fill();
        ctx.textAlign = 'center'; ctx.font = (hot ? 'bold ' : '') + '12px ' + T.fontBody;
        ctx.fillText(q[2] + ' ‡ (' + String(Math.round(q[1])).replace('-', '−') + ')', X(q[0]), Y(q[1]) - 12);
      });
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'center';
      ctx.fillText('R (0)', X(0.07), Y(0) + 18);
      ctx.fillText('P (' + String(st.P).replace('-', '−') + ')', X(0.93), Y(st.P) + 18);
      if (pp.two) ctx.fillText('I (' + String(st.I).replace('-', '−') + ')', X(0.5), Y(st.I) + 18);
      // 장벽 화살표
      function bar(x, g0, g1, lab, col) {
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(X(x), Y(g0)); ctx.lineTo(X(x), Y(g1)); ctx.stroke();
        var d = g1 > g0 ? 1 : -1;
        ctx.beginPath(); ctx.moveTo(X(x), Y(g1)); ctx.lineTo(X(x) - 4, Y(g1) + 7 * d); ctx.lineTo(X(x) + 4, Y(g1) + 7 * d); ctx.fill();
        ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figLine; ctx.beginPath(); ctx.moveTo(X(x) - 18, Y(g0)); ctx.lineTo(X(x) + 18, Y(g0)); ctx.stroke(); ctx.setLineDash([]);
        ctx.textAlign = 'left'; ctx.fillText(lab, X(x) + 5, Y((g0 + g1) / 2) + 4);
      }
      if (pp.two) {
        bar(Math.max(0.05, pp.xs[0] - 0.1), 0, pp.t1, 'ΔG‡₁ ' + Math.round(pp.t1), T.figViolet);
        bar(pp.xs[1] + 0.07, st.I, pp.t2, 'ΔG‡₂ ' + Math.round(pp.t2 - st.I), T.figViolet);
      } else bar(Math.max(0.05, pp.xs[0] - 0.12), 0, pp.t1, 'ΔG‡ ' + Math.round(pp.t1), T.figViolet);
      if (st.ham) { ctx.fillStyle = T.figGreen; ctx.textAlign = 'left'; ctx.fillText('해먼드: TS1 = ' + st.E0.toFixed(0) + ' + ' + st.alpha.toFixed(2) + ' × ΔG°₁', L + 8, Tp + 6); }
      // 읽기
      rK1.set(fmt(k1) + ' s⁻¹');
      rK2.set(pp.two ? fmt(k2) + ' s⁻¹' : '—');
      rH.set(pp.two ? '1단계 ' + tfmt(Math.LN2 / k1) + ', 2단계 ' + tfmt(Math.LN2 / k2) : tfmt(Math.LN2 / k1));
      rR.set(pp.two ? (rds === 1 ? '1단계(TS1이 가장 높음)' : (pp.t2 >= pp.t1 ? '2단계(TS2가 가장 높음)' : '2단계(I가 R보다 낮아 I에서 잰 ΔG‡₂가 더 큼)')) : '한 단계');
      rKe.set(fmt(Ke));
      if (st.ham) { sT1.input.value = st.E0 + st.alpha * st.I; var o = sT1.input.parentNode.querySelector('output'); if (o) o.textContent = kj(Math.round(st.E0 + st.alpha * st.I)); }
    }
    sync();
    api.onResize(draw); api.onTheme(draw);
    draw();
  },
});
