/* 물리화학 9: H₂⁺의 LCAO 분자 오비탈 — 핵간 거리 R, 오비탈 지수 ζ, 결합성/반결합성 */
Sims.register('mj-h2plus-lcao', {
  title: 'H₂⁺의 LCAO 분자 오비탈 — 겹침이 만드는 결합',
  caption: 'R 슬라이더로 두 핵을 붙였다 떼어 보고, 결합성·반결합성을 바꾸어 보자. 왼쪽 위는 결합 축을 포함한 평면의 |ψ|² 등고선(색: 파랑 ψ > 0, 빨강 ψ < 0), 오른쪽 위는 축 위의 ψ(실선)와 |ψ|²(칠한 곡선)이다. 결합성 ψ₊는 두 핵 사이에 전자 밀도를 쌓고, 반결합성 ψ₋는 가운데에 마디가 생긴다. 아래 그래프는 E₊(R) 곡선과 현재 R의 점이다. 오비탈 지수 ζ를 1에서 1.24 쪽으로 올리면 최솟값이 정확한 값(106 pm, 2.79 eV, 회색 점)에 다가간다(ζ = 1.24에서 106 pm, 2.35 eV). ζ ≠ 1이면 수소 원자 하나에는 최적이 아니므로 R이 큰 쪽의 곡선이 0보다 조금 높게 남는다. 시험 함수 A = (ζ³/π)^½e^(−ζr_A), B도 같은 꼴이며, 에너지는 E = ζ²T₁(ζR) + ζV₁(ζR) + 1/R로 계산해 수소 원자 바닥 상태(−½ E_h)를 0으로 잡았다. S, j′ = ∫A²/r_B dτ, k′ = ∫AB/r_A dτ는 원자 단위이다.',
  init: function (api) {
    var EH = 27.211, A0 = 52.918;
    var st = { R: 2.0, z: 1.0, bond: true };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.75 : 0.66; }, label: 'H2+ 분자 오비탈의 등고선, 축 위의 파동 함수, 퍼텐셜 에너지 곡선' });
    var ctx = cv.ctx;
    var rS = api.readout('S, j′, k′'), rE = api.readout('E₊ / E₋ (eV)'), rMin = api.readout('이 ζ에서 E₊ 최솟값');
    api.slider({ id: 'mj-h2plus-lcao-r', label: '핵간 거리 R', min: 0.5, max: 8, step: 0.01, value: st.R,
      format: function (v) { return v.toFixed(2) + ' a₀ (' + (v * A0).toFixed(0) + ' pm)'; }, onInput: function (v) { st.R = v; draw(); } });
    api.slider({ id: 'mj-h2plus-lcao-z', label: '오비탈 지수 ζ', min: 1.0, max: 1.5, step: 0.01, value: st.z,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.z = v; minCache = null; draw(); } });
    var g = api.group();
    var bB = api.button('결합성 ψ₊ (1σg)', function () { st.bond = true; bB.setAttribute('aria-pressed', 'true'); bA.setAttribute('aria-pressed', 'false'); draw(); }, { toggle: true, pressed: true, parent: g });
    var bA = api.button('반결합성 ψ₋ (1σu*)', function () { st.bond = false; bB.setAttribute('aria-pressed', 'false'); bA.setAttribute('aria-pressed', 'true'); draw(); }, { toggle: true, pressed: false, parent: g });

    function ints(x) { var e = Math.exp(-x); return { S: e * (1 + x + x * x / 3), j: 1 / x - Math.exp(-2 * x) * (1 + 1 / x), k: e * (1 + x) }; }
    // E − E(H) (E_h), sign = +1 결합성, −1 반결합성
    function energy(R, z, sg) {
      var I = ints(z * R), T, V;
      if (sg > 0) { T = (0.5 - 0.5 * I.S + I.k) / (1 + I.S); V = (-1 - I.j - 2 * I.k) / (1 + I.S); }
      else { T = (0.5 + 0.5 * I.S - I.k) / (1 - I.S); V = (-1 - I.j + 2 * I.k) / (1 - I.S); }
      return z * z * T + z * V + 1 / R + 0.5;
    }
    var minCache = null;
    function minimum(z) {
      if (minCache && minCache.z === z) return minCache;
      var best = { R: 0, E: 1e9 };
      for (var R = 0.8; R <= 5; R += 0.002) { var E = energy(R, z, 1); if (E < best.E) best = { R: R, E: E }; }
      minCache = { z: z, R: best.R, E: best.E }; return minCache;
    }
    function psi(zc, xc) {   // zc: 축 방향, xc: 수직 방향 (a₀), 분자 중심이 원점
      var z = st.z, I = ints(z * st.R), sg = st.bond ? 1 : -1;
      var rA = Math.hypot(zc + st.R / 2, xc), rB = Math.hypot(zc - st.R / 2, xc), n = Math.sqrt(z * z * z / Math.PI);
      return n * (Math.exp(-z * rA) + sg * Math.exp(-z * rB)) / Math.sqrt(2 * (1 + sg * I.S));
    }
    function fmt(v, d) { return (v < 0 ? '−' : v > 0 ? '+' : '') + Math.abs(v).toFixed(d); }

    function panelMap(T, x0, y0, w, h) {
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('|ψ|² 등고선 (결합 축 포함 평면)', x0 + 8, y0 + 18);
      var L = x0 + 8, Rr = x0 + w - 8, Tp = y0 + 28, B = y0 + h - 8, cxp = (L + Rr) / 2, cyp = (Tp + B) / 2;
      var half = 4.5, sc = Math.min((Rr - L) / (2 * half), (B - Tp) / (2 * 2.9));   // px per a₀
      ctx.fillStyle = T.figPanel; ctx.fillRect(L, Tp, Rr - L, B - Tp);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, Tp, Rr - L, B - Tp);
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, Rr - L, B - Tp); ctx.clip();
      var step = 4, nx = Math.ceil((Rr - L) / step) + 1, ny = Math.ceil((B - Tp) / step) + 1, vals = [], i, j, mx = 0;
      for (j = 0; j < ny; j++) { vals.push([]); for (i = 0; i < nx; i++) { var p = psi((L + i * step - cxp) / sc, (cyp - (Tp + j * step)) / sc); vals[j].push(p); mx = Math.max(mx, p * p); } }
      for (j = 0; j < ny - 1; j++) for (i = 0; i < nx - 1; i++) {
        var v = vals[j][i], d = v * v;
        if (d < 2e-4) continue;
        ctx.globalAlpha = Math.min(0.6, 0.75 * Math.sqrt(d / 0.15));
        ctx.fillStyle = v > 0 ? T.figBlue : T.figRed; ctx.fillRect(L + i * step, Tp + j * step, step, step);
      }
      ctx.globalAlpha = 1;
      // 등고선 (marching squares, |ψ|²의 절댓값 높이)
      var levels = [0.4, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005];
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1;
      levels.forEach(function (lv) {
        ctx.beginPath();
        for (j = 0; j < ny - 1; j++) for (i = 0; i < nx - 1; i++) {
          var c = [vals[j][i], vals[j][i + 1], vals[j + 1][i + 1], vals[j + 1][i]].map(function (q) { return q * q - lv; });
          var px = [L + i * step, L + (i + 1) * step, L + (i + 1) * step, L + i * step], py = [Tp + j * step, Tp + j * step, Tp + (j + 1) * step, Tp + (j + 1) * step];
          var pts = [];
          for (var k = 0; k < 4; k++) { var a = k, b = (k + 1) % 4; if (c[a] * c[b] < 0) { var t = c[a] / (c[a] - c[b]); pts.push([px[a] + t * (px[b] - px[a]), py[a] + t * (py[b] - py[a])]); } }
          if (pts.length >= 2) { ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); }
          if (pts.length === 4) { ctx.moveTo(pts[2][0], pts[2][1]); ctx.lineTo(pts[3][0], pts[3][1]); }
        }
        ctx.stroke();
      });
      if (!st.bond) { ctx.strokeStyle = T.figInk; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cxp, Tp); ctx.lineTo(cxp, B); ctx.stroke(); ctx.setLineDash([]); }
      [-1, 1].forEach(function (s) { ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(cxp + s * st.R / 2 * sc, cyp, 3.5, 0, 7); ctx.fill(); });
      ctx.restore();
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      ctx.fillText('가로 ±4.5 a₀' + (st.bond ? '' : ' · 점선: 마디면'), Rr - 4, B - 6);
    }

    function panelLine(T, x0, y0, w, h) {
      var L = x0 + 44, Rr = x0 + w - 10, Tp = y0 + 30, B = y0 + h - 34;
      var half = 4.5, mx = 0, zz, k, N = 300, ps = [];
      for (k = 0; k <= N; k++) { zz = -half + 2 * half * k / N; var p = psi(zz, 0); ps.push(p); mx = Math.max(mx, Math.abs(p)); }
      var ym = Math.ceil(mx * 1.1 * 5) / 5;
      var sx = function (z) { return L + (z + half) / (2 * half) * (Rr - L); }, sy = function (v) { return (Tp + B) / 2 - v / ym * (B - Tp) / 2; };
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('결합 축 위의 ψ와 |ψ|²', x0 + 8, y0 + 18);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      [-ym, 0, ym].forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(Rr, sy(v)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(fmt(v, 1).replace('+0.0', '0').replace('−0.0', '0'), L - 4, sy(v) + 4); });
      [-4, -2, 0, 2, 4].forEach(function (z) { ctx.textAlign = 'center'; ctx.fillText(String(z).replace('-', '−'), sx(z), B + 14); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.fillText('축 위치 / a₀', (L + Rr) / 2, B + 29);
      ctx.strokeStyle = T.figLine; ctx.strokeRect(L, Tp, Rr - L, B - Tp);
      // |ψ|² (같은 눈금, a₀⁻³)
      ctx.fillStyle = T.figSoftAmber; ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx(-half), sy(0));
      for (k = 0; k <= N; k++) ctx.lineTo(sx(-half + 2 * half * k / N), sy(ps[k] * ps[k]));
      ctx.lineTo(sx(half), sy(0)); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = st.bond ? T.figBlue : T.figRed; ctx.lineWidth = 2.4; ctx.beginPath();
      for (k = 0; k <= N; k++) { var X = sx(-half + 2 * half * k / N), Y = sy(ps[k]); if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
      ctx.stroke();
      [-1, 1].forEach(function (s) { var X = sx(s * st.R / 2); if (X < L || X > Rr) return; ctx.strokeStyle = T.figInk; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X, Tp); ctx.lineTo(X, B); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText(s < 0 ? '핵 A' : '핵 B', X, Tp - 3); });
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = st.bond ? T.figBlue : T.figRed; ctx.fillText('실선 ψ' + (st.bond ? '₊' : '₋'), L + 5, B - 20);
      ctx.fillStyle = T.figAmber; ctx.fillText('칠한 곡선 |ψ|²', L + 5, B - 6);
    }

    function panelE(T, x0, y0, w, h) {
      var L = x0 + 50, Rr = x0 + w - 12, Tp = y0 + 30, B = y0 + h - 38, lo = -3.5, hi = 6;
      var sx = function (R) { return L + (R - 0.5) / 7.5 * (Rr - L); }, sy = function (e) { return B - (e - lo) / (hi - lo) * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('퍼텐셜 에너지 곡선 E − E(H) / eV', x0 + 8, y0 + 18);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      [-2, 0, 2, 4, 6].forEach(function (e) { ctx.beginPath(); ctx.moveTo(L, sy(e)); ctx.lineTo(Rr, sy(e)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(e > 0 ? '+' + e : String(e).replace('-', '−'), L - 5, sy(e) + 4); });
      [1, 2, 3, 4, 5, 6, 7, 8].forEach(function (R) { ctx.beginPath(); ctx.moveTo(sx(R), Tp); ctx.lineTo(sx(R), B); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText(String(R), sx(R), B + 15); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('R / a₀', (L + Rr) / 2, B + 31);
      ctx.strokeStyle = T.figLine; ctx.strokeRect(L, Tp, Rr - L, B - Tp);
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, Rr - L, B - Tp); ctx.clip();
      function curve(z, sg, color, width, dash) {
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.beginPath();
        for (var k = 0; k <= 300; k++) { var R = 0.5 + 7.5 * k / 300, Y = sy(energy(R, z, sg) * EH); if (k) ctx.lineTo(sx(R), Y); else ctx.moveTo(sx(R), Y); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      if (st.z !== 1) curve(1, 1, T.figMuted, 1.6, [6, 4]);
      curve(st.z, -1, T.figRed, 2, [7, 4]);
      curve(st.z, 1, T.figBlue, 3, []);
      var m = minimum(st.z);
      ctx.fillStyle = T.figBlue; ctx.beginPath(); ctx.arc(sx(m.R), sy(m.E * EH), 4, 0, 7); ctx.fill();
      ctx.fillStyle = T.figMuted; ctx.beginPath(); ctx.arc(sx(2.0), sy(-2.79), 5, 0, 7); ctx.fill();
      var e = energy(st.R, st.z, st.bond ? 1 : -1) * EH;
      ctx.strokeStyle = T.figInk; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx(st.R), Tp); ctx.lineTo(sx(st.R), B); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = st.bond ? T.figBlue : T.figRed; ctx.strokeStyle = T.figPanel; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx(st.R), sy(e), 7, 0, 7); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillStyle = T.figBlue; ctx.fillText('실선 E₊ (ζ = ' + st.z.toFixed(2) + ')', Rr - 6, Tp + 14);
      ctx.fillStyle = T.figRed; ctx.fillText('파선 E₋', Rr - 6, Tp + 28);
      if (st.z !== 1) { ctx.fillStyle = T.figMuted; ctx.fillText('회색 파선 E₊ (ζ = 1)', Rr - 6, Tp + 42); }
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'left'; ctx.fillText('정확한 값 (2.00 a₀, −2.79 eV)', sx(2.0) + 9, sy(-2.79) + 4);
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      if (w < 560) { panelMap(T, 0, 0, w, h * 0.32); panelLine(T, 0, h * 0.32, w, h * 0.32); panelE(T, 0, h * 0.64, w, h * 0.36); }
      else { panelMap(T, 0, 0, w * 0.5, h * 0.5); panelLine(T, w * 0.5, 0, w * 0.5, h * 0.5); panelE(T, 0, h * 0.5, w, h * 0.5); }
      var I = ints(st.z * st.R);
      rS.set(I.S.toFixed(3) + ', ' + (st.z * I.j).toFixed(3) + ', ' + (st.z * I.k).toFixed(3));
      rE.set(fmt(energy(st.R, st.z, 1) * EH, 2) + ' / ' + fmt(energy(st.R, st.z, -1) * EH, 2));
      var m = minimum(st.z);
      rMin.set('R = ' + m.R.toFixed(2) + ' a₀ (' + (m.R * A0).toFixed(0) + ' pm), Dₑ = ' + (-m.E * EH).toFixed(2) + ' eV');
    }
    api.onResize(draw);
    draw();
  },
});
