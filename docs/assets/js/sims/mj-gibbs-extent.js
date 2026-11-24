/* 물리화학 6: A ⇌ B 반응의 G(ξ) 곡선 — 직선 항 + 혼합 항, 바닥과 접선 기울기 */
Sims.register('mj-gibbs-extent', {
  title: 'G(ξ) 곡선의 바닥과 기울기 — 반응은 왜 중간에서 멈추는가',
  caption: 'ΔrG°와 온도를 바꾸고, 그래프를 누르거나 아래 슬라이더로 ξ를 골라 보자. 이상 기체 반응 A ⇌ B(전체 압력 1 bar, A 1 mol에서 출발)의 G − μ°A = ξΔrG° + RT[(1−ξ)ln(1−ξ) + ξ ln ξ]는 순수 성분의 직선(파란 점선)과 혼합 깁스 에너지(주황 점선)의 합이고, 고른 ξ에서 그은 접선의 기울기가 ΔrG = ΔrG° + RT ln[ξ/(1−ξ)]이다. 바닥(기울기 0)의 위치가 ξ평형 = K/(1+K), K = e^(−ΔrG°/RT)이다. ‘혼합 항 넣기’를 끄면 G가 직선이 되어 최솟값이 양 끝으로 간다. 이상 기체와 ΔrG°가 온도에 무관하다고 가정했다.',
  init: function (api) {
    var R = 8.314e-3;   // kJ/(mol·K)
    var st = { g0: -2.0, T: 298.15, xi: 0.2, showLin: true, showMix: true, mixOn: true };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.56; }, label: 'A ⇌ B 반응 혼합물의 깁스 에너지를 반응 진행도에 대해 그린 그래프' });
    var ctx = cv.ctx;
    var rEq = api.readout('바닥 ξ평형'), rK = api.readout('K = ξ평형/(1−ξ평형)'), rG = api.readout('고른 ξ의 ΔrG'), rDir = api.readout('방향');

    api.slider({ id: 'mj-gibbs-extent-g0', label: 'ΔrG°', min: -10, max: 10, step: 0.1, value: st.g0,
      format: function (v) { return fmt(v, 1) + ' kJ/mol'; }, onInput: function (v) { st.g0 = v; draw(); } });
    api.slider({ id: 'mj-gibbs-extent-t', label: '온도 T', min: 200, max: 1000, step: 0.05, value: st.T,
      format: function (v) { return (Math.abs(v - Math.round(v)) < 1e-6 ? v.toFixed(0) : v.toFixed(2)) + ' K'; }, onInput: function (v) { st.T = v; draw(); } });
    var sXi = api.slider({ id: 'mj-gibbs-extent-xi', label: '고른 ξ', min: 0.01, max: 0.99, step: 0.01, value: st.xi,
      format: function (v) { return v.toFixed(2) + ' mol'; }, onInput: function (v) { st.xi = v; draw(); } });
    var g = api.group();
    var bLin = api.button('직선 항 보이기', function () { st.showLin = !st.showLin; bLin.setAttribute('aria-pressed', String(st.showLin)); draw(); }, { toggle: true, pressed: true, parent: g });
    var bMix = api.button('혼합 항 보이기', function () { st.showMix = !st.showMix; bMix.setAttribute('aria-pressed', String(st.showMix)); draw(); }, { toggle: true, pressed: true, parent: g });
    var bOn = api.button('혼합 항 넣기', function () { st.mixOn = !st.mixOn; bOn.setAttribute('aria-pressed', String(st.mixOn)); draw(); }, { toggle: true, pressed: true, parent: g });

    function fmt(v, d) { var s = Math.abs(v).toFixed(d); return (v < 0 && Number(s) !== 0 ? '−' : (v > 0 ? '+' : '')) + s; }
    function sup(n) { var m = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }; return String(n).split('').map(function (c) { return m[c]; }).join(''); }
    function sci(x) {
      if (x >= 0.01 && x < 1000) return x.toPrecision(3);
      var e = Math.floor(Math.log10(x)); return (x / Math.pow(10, e)).toFixed(2) + '×10' + sup(e);
    }
    function lin(x) { return x * st.g0; }
    function mix(x) { var RT = R * st.T; if (x <= 0 || x >= 1) return 0; return RT * ((1 - x) * Math.log(1 - x) + x * Math.log(x)); }
    function G(x) { return lin(x) + (st.mixOn ? mix(x) : 0); }
    function slope(x) { return st.g0 + (st.mixOn ? R * st.T * Math.log(x / (1 - x)) : 0); }
    function niceStep(range) { var raw = range / 5, p = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / p; return (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * p; }

    var box = null;
    function pick(e) {
      if (!box) return;
      var rc = cv.canvas.getBoundingClientRect(), x = e.clientX - rc.left;
      var xi = (x - box.L) / (box.R - box.L);
      xi = Math.round(Math.min(0.99, Math.max(0.01, xi)) * 100) / 100;
      sXi.set(xi);
    }
    cv.canvas.addEventListener('pointerdown', function (e) { pick(e); });
    cv.canvas.addEventListener('pointermove', function (e) { if (e.buttons || e.pointerType === 'mouse') pick(e); });

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, small = w < 560;
      ctx.clearRect(0, 0, w, h);
      var L = small ? 54 : 70, Rr = w - 16, Tp = small ? 56 : 36, B = h - 44;
      box = { L: L, R: Rr };
      var RT = R * st.T, K = Math.exp(-st.g0 / RT), xe = K / (1 + K);
      // 세로 범위
      var lo = 0, hi = 0, n = 200, i, x;
      for (i = 0; i <= n; i++) {
        x = i / n;
        var vals = [G(x)];
        if (st.showLin) vals.push(lin(x));
        if (st.showMix) vals.push(mix(x));
        vals.forEach(function (v) { lo = Math.min(lo, v); hi = Math.max(hi, v); });
      }
      var pad = (hi - lo) * 0.08 + 0.2; lo -= pad; hi += pad;
      var step = niceStep(hi - lo);
      var sx = function (v) { return L + v * (Rr - L); };
      var sy = function (v) { return B - (v - lo) / (hi - lo) * (B - Tp); };
      // 격자
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) {
        ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(Rr, sy(v)); ctx.stroke();
        ctx.fillText(fmt(v, step < 1 ? 1 : 0).replace('+', ''), L - 5, sy(v) + 4);
      }
      ctx.textAlign = 'center';
      for (i = 0; i <= 5; i++) { ctx.fillText((i / 5).toFixed(1), sx(i / 5), B + 15); }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('ξ / mol', (L + Rr) / 2, B + 33);
      ctx.save(); ctx.translate(13, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('(G − μ°A) / (kJ/mol)', 0, 0); ctx.restore();
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(L, sy(0)); ctx.lineTo(Rr, sy(0)); ctx.stroke();
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, Tp, Rr - L, B - Tp);
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, Rr - L, B - Tp); ctx.clip();
      function curve(f, color, width, dash) {
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash || []); ctx.beginPath();
        for (var k = 0; k <= 300; k++) { var xx = k / 300, yy = sy(f(Math.min(1 - 1e-9, Math.max(1e-9, xx)))); if (k) ctx.lineTo(sx(xx), yy); else ctx.moveTo(sx(xx), yy); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      if (st.showLin) curve(lin, T.figBlue, 2, [7, 5]);
      if (st.showMix) curve(mix, T.figAmber, 2, [3, 4]);
      curve(G, T.figAccent, 3.2);
      // 접선
      var xs = st.xi, gs = G(xs), sl = slope(xs), hw = 0.12;
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(sx(xs - hw), sy(gs - hw * sl)); ctx.lineTo(sx(xs + hw), sy(gs + hw * sl)); ctx.stroke();
      ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(sx(xs), sy(gs), 5, 0, 7); ctx.fill();
      // 바닥
      var xm, gm;
      if (st.mixOn) { xm = xe; } else { xm = st.g0 < 0 ? 1 : st.g0 > 0 ? 0 : 0.5; }
      gm = G(Math.min(1 - 1e-9, Math.max(1e-9, xm)));
      ctx.fillStyle = T.figAccent; ctx.strokeStyle = T.figPanel; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx(xm), sy(gm), 7, 0, 7); ctx.fill(); ctx.stroke();
      ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figAccent; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx(xm), sy(gm)); ctx.lineTo(sx(xm), B); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      // 이름표
      ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figAccent;
      var lx = sx(xm), ly = sy(gm) - 14;
      ctx.textAlign = lx < L + 60 ? 'left' : lx > Rr - 60 ? 'right' : 'center';
      if (ly < Tp + 14) ly = sy(gm) + 22;
      ctx.fillText(st.mixOn ? '바닥(평형)' : '최솟값이 끝에', lx, ly);
      // 범례(그래프 위 한두 줄)
      ctx.textAlign = 'left'; ctx.font = '12px ' + T.fontBody;
      var items = [];
      if (st.showLin) items.push([T.figBlue, '직선 항 ξΔrG°', [7, 5]]);
      if (st.showMix) items.push([T.figAmber, '혼합 항', [3, 4]]);
      items.push([T.figAccent, st.mixOn ? 'G = 두 항의 합' : 'G (혼합 항 없음)', []]);
      items.push([T.figRed, '고른 ξ의 접선', []]);
      var lgx = L, lgy = 16;
      items.forEach(function (it) {
        var tw = 30 + ctx.measureText(it[1]).width + 16;
        if (lgx + tw > Rr && lgx > L) { lgx = L; lgy += 18; }
        ctx.strokeStyle = it[0]; ctx.lineWidth = 2.4; ctx.setLineDash(it[2]);
        ctx.beginPath(); ctx.moveTo(lgx, lgy - 4); ctx.lineTo(lgx + 24, lgy - 4); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figInk; ctx.fillText(it[1], lgx + 30, lgy);
        lgx += tw;
      });
      // 읽기 값
      if (st.mixOn) {
        rEq.set(xe.toFixed(3) + ' mol');
        rK.set(sci(K) + '  (= e^(−ΔrG°/RT))');
      } else {
        rEq.set(st.g0 < 0 ? 'ξ = 1 (끝까지 감)' : st.g0 > 0 ? 'ξ = 0 (전혀 안 감)' : '어디서나 같음');
        rK.set('혼합 항이 없으면 안쪽 바닥이 없다');
      }
      rG.set(fmt(sl, 2) + ' kJ/mol (ξ = ' + xs.toFixed(2) + ')');
      rDir.set(Math.abs(sl) < 0.02 ? '평형 (기울기 0)' : sl < 0 ? 'ΔrG < 0 → 정반응 (ξ 증가)' : 'ΔrG > 0 → 역반응 (ξ 감소)');
    }
    api.onResize(draw);
    draw();
  },
});
