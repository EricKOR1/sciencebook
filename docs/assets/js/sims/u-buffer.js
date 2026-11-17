/* 일반화학 9 산·염기와 수용액 평형: 완충 용액에 강산·강염기를 넣을 때의 pH(전하 균형으로 정확히 계산), 물과 비교, 완충 용량 */
Sims.register('u-buffer', {
  title: '완충 용액에 산·염기 넣기 — 물과 무엇이 다를까?',
  caption: '완충 쌍과 총농도, 짝염기/약산 비를 정한 뒤 넣는 강산(HCl)·강염기(NaOH)의 양을 바꿔 보자. 실선은 완충 용액, 점선은 같은 양을 순수한 물에 넣었을 때의 pH이다. 완충 용액은 pKₐ ± 1(색칠한 띠) 안에서 pH가 거의 변하지 않다가, 한 성분이 바닥나면 물처럼 급변한다. 총농도가 클수록, 비가 1에 가까울수록 완충 용량(pH를 1 낮추는 데 드는 강산의 양)이 크다. 용액 1.00 L, 25 ℃, 넣는 산·염기의 부피 변화와 활동도는 무시하고 전하 균형식으로 계산했다.',
  init: function (api) {
    var KW = 1e-14, AMAX = 0.2;
    var PAIRS = [
      { name: '아세트산', ha: 'CH₃COOH', a: 'CH₃COO⁻', pk: [4.74], z0: 0, j: 0, ct: 0.20, lr: 0 },
      { name: '인산(H₂PO₄⁻/HPO₄²⁻)', ha: 'H₂PO₄⁻', a: 'HPO₄²⁻', pk: [2.12, 7.21, 12.32], z0: 0, j: 1, ct: 0.20, lr: Math.log10(1.6) },
      { name: '암모니아(NH₄⁺/NH₃)', ha: 'NH₄⁺', a: 'NH₃', pk: [9.26], z0: 1, j: 0, ct: 0.65, lr: Math.log10(0.25 / 0.40) },
    ];
    // z0: 가장 양성자가 많은 형태의 전하, j: 완충 쌍의 산 형태 번호(양성자를 j개 잃은 형태)
    var st = { p: 0, ct: PAIRS[0].ct, lr: PAIRS[0].lr, add: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.5; }, label: '넣은 강산·강염기 양에 따른 pH 곡선과 완충 성분의 양' });
    var ctx = cv.ctx;
    var rPh0 = api.readout('처음 pH');
    var rPh = api.readout('넣은 뒤 pH (변화)');
    var rW = api.readout('물에 넣으면');
    var rCap = api.readout('완충 용량 (pH 1 낮추기)');

    var g = api.group();
    var btns = PAIRS.map(function (p, i) { return api.button(p.name, function () { choose(i); }, { toggle: true, pressed: i === 0, parent: g }); });
    var cS = api.slider({ id: 'u-buffer-ct', label: '총농도 [HA] + [A⁻]', min: -2, max: 0, step: 0.01, value: Math.log10(st.ct),
      format: function (v) { return Math.pow(10, v).toFixed(Math.pow(10, v) < 0.1 ? 3 : 2) + ' M'; }, onInput: function (v) { st.ct = Math.pow(10, v); update(); } });
    var rS = api.slider({ id: 'u-buffer-ratio', label: '비 [A⁻]/[HA]', min: -1.3, max: 1.3, step: 0.01, value: st.lr,
      format: function (v) { var r = Math.pow(10, v); return r.toFixed(r < 1 ? 2 : 1); }, onInput: function (v) { st.lr = v; update(); } });
    var aS = api.slider({ id: 'u-buffer-add', label: '넣은 양 (−: HCl, +: NaOH)', min: -AMAX, max: AMAX, step: 0.002, value: st.add,
      format: function (v) { return v === 0 ? '0 mol' : (v < 0 ? 'HCl ' : 'NaOH ') + Math.abs(v).toFixed(3) + ' mol'; }, onInput: function (v) { st.add = v; update(); } });

    function choose(i) {
      st.p = i; btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      cS.set(Math.log10(PAIRS[i].ct)); rS.set(PAIRS[i].lr);
    }
    function comp() {
      var P = PAIRS[st.p], r = Math.pow(10, st.lr), cA = st.ct * r / (1 + r), cHA = st.ct / (1 + r);
      var zHA = P.z0 - P.j, zA = zHA - 1;
      // 염을 만들 때 들어온 반대 이온(Na⁺ 양전하, Cl⁻ 음전하): 전체를 전기적으로 중성으로
      var counter = -(cHA * zHA + cA * zA);
      return { P: P, cA: cA, cHA: cHA, counter: counter };
    }
    // 전하 균형: h − Kw/h + (반대 이온) + (NaOH) − (HCl) + Ct·Σ αᵢzᵢ = 0  → h를 이분법으로
    function pH(c, add, ct) {
      var P = c.P, Ka = P.pk.map(function (p) { return Math.pow(10, -p); });
      function f(lh) {
        var h = Math.pow(10, lh), terms = [], t = 1, n = Ka.length;
        for (var i = 0; i <= n; i++) { terms.push(t); if (i < n) t *= Ka[i] / h; }
        var D = 0, zs = 0; terms.forEach(function (x) { D += x; });
        terms.forEach(function (x, i) { zs += x / D * (P.z0 - i); });
        return h - KW / h + c.counter + add + ct * zs;
      }
      var lo = -15.5, hi = 1.5;
      for (var it = 0; it < 80; it++) { var m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
      return -(lo + hi) / 2;
    }
    var water = { P: { pk: [7], z0: 0 }, counter: 0 };
    function bufPH(add) { var c = comp(); return pH(c, add, st.ct); }
    function watPH(add) { return pH(water, add, 0); }
    function capacity() {
      var p0 = bufPH(0), lo = 0, hi = 5;
      if (bufPH(-hi) > p0 - 1) return null;
      for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (bufPH(-m) > p0 - 1) lo = m; else hi = m; }
      return (lo + hi) / 2;
    }
    function update() {
      var p0 = bufPH(0), p1 = bufPH(st.add), w1 = watPH(st.add);
      rPh0.set(p0.toFixed(2));
      rPh.set(p1.toFixed(2) + ' (' + (p1 - p0 >= 0 ? '+' : '−') + Math.abs(p1 - p0).toFixed(2) + ')');
      rW.set(w1.toFixed(2) + ' (' + (w1 - 7 >= 0 ? '+' : '−') + Math.abs(w1 - 7).toFixed(2) + ')');
      var cap = capacity(); rCap.set(cap == null ? '–' : 'HCl ' + cap.toFixed(3) + ' mol');
      draw();
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, stacked = w < 560;
      ctx.clearRect(0, 0, w, h);
      var p1 = stacked ? { x: 0, y: 0, w: w, h: h * 0.64 } : { x: 0, y: 0, w: w * 0.66, h: h };
      var p2 = stacked ? { x: 0, y: h * 0.66, w: w, h: h * 0.34 } : { x: w * 0.68, y: 0, w: w * 0.32, h: h };
      curve(T, p1); amounts(T, p2);
    }
    function curve(T, r) {
      var L = r.x + 40, R = r.x + r.w - 12, Tp = r.y + 26, B = r.y + r.h - 40;
      var sx = function (a) { return L + (a + AMAX) / (2 * AMAX) * (R - L); };
      var sy = function (p) { return B - p / 14 * (B - Tp); };
      var P = PAIRS[st.p], pka = P.pk[P.j];
      ctx.fillStyle = T.figSoftAmber; ctx.fillRect(L, sy(pka + 1), R - L, sy(pka - 1) - sy(pka + 1));
      ctx.fillStyle = T.figAmber; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('pKₐ ± 1 = ' + (pka - 1).toFixed(2) + '~' + (pka + 1).toFixed(2), R - 4, sy(pka + 1) - 4);
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      for (var p = 0; p <= 14; p += 2) { ctx.beginPath(); ctx.moveTo(L, sy(p)); ctx.lineTo(R, sy(p)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(p, L - 5, sy(p) + 4); }
      ctx.textAlign = 'center';
      [-0.2, -0.1, 0, 0.1, 0.2].forEach(function (a) { ctx.fillText(a === 0 ? '0' : Math.abs(a).toFixed(1), sx(a), B + 14); });
      ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(L, Tp - 4); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx(0), B); ctx.lineTo(sx(0), B + 4); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.textAlign = 'left'; ctx.fillText('← HCl (mol)', L, B + 30);
      ctx.textAlign = 'right'; ctx.fillText('NaOH (mol) →', R, B + 30);
      ctx.textAlign = 'left'; ctx.font = '600 12px ' + T.fontBody; ctx.fillText('pH', r.x + 6, r.y + 14);
      function plot(fn, color, dash, lw) {
        ctx.setLineDash(dash || []); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
        for (var i = 0; i <= 200; i++) { var a = -AMAX + 2 * AMAX * i / 200, y = sy(fn(a)); if (i) ctx.lineTo(sx(a), y); else ctx.moveTo(sx(a), y); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      plot(watPH, T.figMuted, [6, 4], 1.8);
      plot(bufPH, T.figAccent, null, 2.8);
      // 현재 점
      var pb = bufPH(st.add), pw = watPH(st.add);
      ctx.strokeStyle = T.figInk; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx(st.add), Tp); ctx.lineTo(sx(st.add), B); ctx.stroke(); ctx.setLineDash([]);
      [[pw, T.figMuted], [pb, T.figAccent]].forEach(function (q) { ctx.beginPath(); ctx.arc(sx(st.add), sy(q[0]), 5.5, 0, Math.PI * 2); ctx.fillStyle = q[1]; ctx.fill(); ctx.strokeStyle = T.figPanel; ctx.lineWidth = 1.5; ctx.stroke(); });
      // 범례
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      var lx = L + 40, ly = r.y + 14;
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.8; ctx.beginPath(); ctx.moveTo(lx, ly - 4); ctx.lineTo(lx + 20, ly - 4); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.fillText('완충 용액', lx + 26, ly);
      lx += 100; ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.8; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(lx, ly - 4); ctx.lineTo(lx + 20, ly - 4); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillText('순수한 물', lx + 26, ly);
    }
    function amounts(T, r) {
      var c = comp(), P = c.P, nHA = c.cHA, nA = c.cA, a = st.add;
      // 양적 관계(1단계): OH⁻는 HA와, H₃O⁺는 A⁻와 완전히 반응
      var excess = '';
      if (a > 0) { var u = Math.min(a, nHA); nHA -= u; nA += u; if (a > u + 1e-12) excess = 'OH⁻ ' + (a - u).toFixed(3) + ' mol 남음'; }
      if (a < 0) { var v = Math.min(-a, nA); nA -= v; nHA += v; if (-a > v + 1e-12) excess = 'H₃O⁺ ' + (-a - v).toFixed(3) + ' mol 남음'; }
      var L = r.x + 46, R = r.x + r.w - 10, Tp = r.y + 46, B = r.y + r.h - 26;
      var m = Math.max(c.cHA + c.cA, 0.01), raw = m / 4, e10 = Math.pow(10, Math.floor(Math.log10(raw))), fr = raw / e10, step = (fr < 1.5 ? 1 : fr < 3 ? 2 : fr < 7 ? 5 : 10) * e10, ymax = Math.ceil(m / step - 1e-9) * step;
      var sy = function (v) { return B - v / ymax * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('완충 성분의 양 (mol)', r.x + 8, r.y + 14);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('연한 막대: 넣기 전', r.x + 8, r.y + 32);
      ctx.font = '11px ' + T.fontMono; ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.textAlign = 'right';
      for (var v2 = 0; v2 <= ymax + 1e-9; v2 += step) { ctx.beginPath(); ctx.moveTo(L, sy(v2)); ctx.lineTo(R, sy(v2)); ctx.stroke(); ctx.fillStyle = T.figMuted; ctx.fillText(v2.toFixed(step < 0.01 ? 3 : step < 0.1 ? 2 : 1), L - 4, sy(v2) + 4); }
      var items = [[P.ha, c.cHA, nHA, T.figBlue], [P.a, c.cA, nA, T.figAmber]], gw = (R - L) / 2, bw = Math.min(30, gw * 0.3);
      items.forEach(function (it, k) {
        var cx = L + gw * (k + 0.5);
        ctx.globalAlpha = 0.3; ctx.fillStyle = it[3]; ctx.fillRect(cx - bw - 2, sy(it[1]), bw, B - sy(it[1])); ctx.globalAlpha = 1;
        ctx.fillStyle = it[3]; ctx.fillRect(cx + 2, sy(it[2]), bw, B - sy(it[2]));
        ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText(it[0], cx, B + 16);
      });
      ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      if (excess) { ctx.fillStyle = T.figRed; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText('성분 소진! ' + excess, R, Tp - 4); }
    }

    api.onResize(draw);
    update();
  },
});
