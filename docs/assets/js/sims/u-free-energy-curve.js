/* 일반화학 10 화학 열역학: 반응 진행도에 따른 G 곡선, 최솟값 = 평형, 접선의 기울기 = ΔG = RT ln(Q/K) */
Sims.register('u-free-energy-curve', {
  title: '자유 에너지 골짜기 — 반응은 G가 가장 낮은 조성에서 멈춘다',
  caption: '기체 반응 A ⇌ B(25 ℃, 전체 압력 1 bar, 처음 A 1 mol)에서 계 전체의 G를 반응 진행도 ξ(B의 몰분율)에 대해 그렸다. 점선은 A와 B가 섞이지 않았다고 할 때의 G이고, 실제 곡선은 섞임의 엔트로피 때문에 그보다 아래로 처져 양 끝 사이에 최솟값이 생긴다. 현재 조성의 접선 기울기가 ΔG = ΔG° + RT ln Q = RT ln(Q/K)이며, 기울기가 음수면 오른쪽(정반응), 양수면 왼쪽(역반응)으로 내려가 바닥(Q = K)에서 멈춘다. ΔG°를 양수로 해도 바닥이 0보다 오른쪽에 있어 생성물이 조금은 생기는 것을 확인하자. 이상 기체 혼합물로 가정했다.',
  init: function (api) {
    var RT = 8.314 * 298.15 / 1000;   // kJ/mol
    var st = { g0: 3.0, xi: 0.6, anim: false };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.05 : 0.55; }, label: '반응 진행도에 따른 자유 에너지 곡선' });
    var ctx = cv.ctx;
    var rQ = api.readout('Q = P(B)/P(A)'), rK = api.readout('K'), rG = api.readout('ΔG = RT ln(Q/K)'), rD = api.readout('진행 방향');

    api.slider({ id: 'u-free-energy-curve-g0', label: 'ΔG°', min: -10, max: 10, step: 0.1, value: st.g0,
      format: function (v) { return fmt(v, 1) + ' kJ/mol'; }, onInput: function (v) { st.g0 = v; stop(); draw(); } });
    var sXi = api.slider({ id: 'u-free-energy-curve-xi', label: '현재 조성 ξ', min: 0.01, max: 0.99, step: 0.01, value: st.xi,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { if (!syncing) { st.xi = v; stop(); } draw(); } });
    var go = api.button('평형으로 진행', function () { start(); }, { primary: true });

    var syncing = false;
    function fmt(v, d) { return (v < 0 ? '−' : '') + Math.abs(v).toFixed(d); }
    function K() { return Math.exp(-st.g0 / RT); }
    function xiEq() { var k = K(); return k / (1 + k); }
    function G(x) {
      var m = 0;
      if (x > 0) m += x * Math.log(x);
      if (x < 1) m += (1 - x) * Math.log(1 - x);
      return x * st.g0 + RT * m;
    }
    function slope(x) { return st.g0 + RT * Math.log(x / (1 - x)); }
    function sci(x) {
      if (x >= 0.01 && x < 1000) return x.toPrecision(3);
      var e = Math.floor(Math.log10(x)); return (x / Math.pow(10, e)).toFixed(2) + '×10^' + e;
    }
    function start() {
      if (api.reduced) { setXi(xiEq()); return; }
      st.anim = true; loop.play();
    }
    function stop() { st.anim = false; loop.pause(); }
    function setXi(v) { st.xi = v; syncing = true; sXi.set(Math.min(0.99, Math.max(0.01, Math.round(v * 100) / 100))); syncing = false; draw(); }
    var loop = api.loop(function (dt) {
      if (!st.anim) return;
      var target = xiEq(), d = target - st.xi;
      // 경사를 따라 내려가 바닥(평형)에 다가간다
      var nx = st.xi + d * (1 - Math.exp(-2.2 * dt));
      if (Math.abs(target - nx) < 0.002) { nx = target; st.anim = false; loop.pause(); }
      st.xi = nx; syncing = true; sXi.set(Math.min(0.99, Math.max(0.01, Math.round(nx * 100) / 100))); syncing = false;
      draw();
    });
    loop.pause();

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var L = 62, R = w - 18, Tp = 34, B = h - 84;
      var n = 200, lo = Infinity, hi = -Infinity, i, ys = [];
      for (i = 0; i <= n; i++) { var x = i / n, gg = G(x), lin = x * st.g0; ys.push(gg); lo = Math.min(lo, gg, lin); hi = Math.max(hi, gg, lin); }
      var pad = (hi - lo) * 0.12 + 0.3; lo -= pad; hi += pad;
      var sx = function (x) { return L + x * (R - L); };
      var sy = function (v) { return B - (v - lo) / (hi - lo) * (B - Tp); };
      // 축
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, Tp, R - L, B - Tp);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      [0, 0.25, 0.5, 0.75, 1].forEach(function (x) { ctx.fillText(x, sx(x), B + 15); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('반응 진행도 ξ (B의 몰분율)', (L + R) / 2, B + 31);
      if (!narrow) {
        ctx.textAlign = 'left'; ctx.fillStyle = T.figBlue; ctx.fillText('순수한 A', L + 4, B + 31);
        ctx.textAlign = 'right'; ctx.fillStyle = T.figAmber; ctx.fillText('순수한 B', R - 4, B + 31);
      }
      ctx.save(); ctx.translate(18, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillStyle = T.figInk;
      ctx.fillText('G (kJ, 처음 A 1 mol 기준)', 0, 0); ctx.restore();
      // y 눈금
      var step = (hi - lo) > 12 ? 4 : (hi - lo) > 6 ? 2 : 1;
      ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right'; ctx.fillStyle = T.figMuted; ctx.strokeStyle = T.rule;
      for (var v = Math.ceil(lo / step) * step; v <= hi; v += step) {
        ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(fmt(v, 0), L - 5, sy(v) + 4);
      }
      // 섞이지 않을 때(점선)
      ctx.setLineDash([6, 5]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(1), sy(st.g0)); ctx.stroke(); ctx.setLineDash([]);
      // 곡선
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.8; ctx.beginPath();
      ys.forEach(function (y, k) { if (k) ctx.lineTo(sx(k / n), sy(y)); else ctx.moveTo(sx(0), sy(y)); }); ctx.stroke();
      // 끝점 G°
      ctx.fillStyle = T.figBlue; ctx.beginPath(); ctx.arc(sx(0), sy(0), 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.arc(sx(1), sy(st.g0), 4.5, 0, 7); ctx.fill();
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      ctx.fillText('점선: 섞이지 않을 때 · 양 끝의 높이 차 = ΔG°', R, Tp - 10);
      // 평형(최솟값)
      var xe = xiEq();
      ctx.strokeStyle = T.figGreen; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(sx(xe), sy(G(xe))); ctx.lineTo(sx(xe), B); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figGreen; ctx.beginPath(); ctx.arc(sx(xe), sy(G(xe)), 5.5, 0, 7); ctx.fill();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = xe > 0.6 ? 'right' : 'left';
      ctx.fillText('평형: Q = K, ΔG = 0', sx(xe) + (xe > 0.6 ? -6 : 6), B - 7);
      // 현재 조성과 접선
      var xc = st.xi, gc = G(xc), sl = slope(xc), d = 0.14;
      var col = Math.abs(sl) < 0.05 ? T.figGreen : sl < 0 ? T.figBlue : T.figRed;
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx(Math.max(0, xc - d)), sy(gc - sl * Math.min(d, xc))); ctx.lineTo(sx(Math.min(1, xc + d)), sy(gc + sl * Math.min(d, 1 - xc))); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(sx(xc), sy(gc), 6, 0, 7); ctx.fill();
      ctx.fillStyle = T.figPanel; ctx.beginPath(); ctx.arc(sx(xc), sy(gc), 2.5, 0, 7); ctx.fill();
      if (Math.abs(sl) >= 0.05) {
        var dir = sl < 0 ? 1 : -1, ax = sx(xc) + dir * 16, ay = sy(gc) - 22;
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + dir * 30, ay); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax + dir * 36, ay); ctx.lineTo(ax + dir * 28, ay - 5); ctx.lineTo(ax + dir * 28, ay + 5); ctx.closePath(); ctx.fill();
      }
      // 조성 막대
      var by = h - (narrow ? 34 : 26), bh = 14;
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(L, by, (R - L) * (1 - xc), bh);
      ctx.fillStyle = T.figSoftAmber; ctx.fillRect(L + (R - L) * (1 - xc), by, (R - L) * xc, bh);
      ctx.strokeStyle = T.figLine; ctx.strokeRect(L, by, R - L, bh);
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figBlue;
      ctx.fillText('A ' + ((1 - xc) * 100).toFixed(0) + '%', L, by - 4);
      ctx.textAlign = 'right'; ctx.fillStyle = T.figAmber; ctx.fillText('B ' + (xc * 100).toFixed(0) + '%', R, by - 4);
      // 읽기
      var Q = xc / (1 - xc), k = K();
      rQ.set(sci(Q)); rK.set(sci(k)); rG.set(fmt(sl, 2) + ' kJ/mol');
      rD.set(Math.abs(sl) < 0.05 ? '평형 (움직이지 않음)' : sl < 0 ? 'Q < K → 정반응(B 생성)' : 'Q > K → 역반응(A 생성)');
      go.disabled = Math.abs(xc - xe) < 0.002;
    }
    api.onResize(draw);
    draw();
  },
});
