/* 물리화학 1 기체의 성질과 열역학 제1법칙: 환산 판데르발스 등온선 — 판데르발스 고리, 불안정 구간, 맥스웰 작도 */
Sims.register('mj-vdw-maxwell', {
  title: '환산 판데르발스 등온선 탐색기 — 고리, 불안정 구간, 맥스웰 작도',
  caption: '환산 온도 Tᵣ를 1보다 낮춰 보자. 등온선에 고리가 생기고, (∂p/∂V)_T > 0인 빨간 구간은 압축하면 압력이 내려가는 불안정 상태이다. ' +
    '「맥스웰 작도」를 켜면 위아래 두 넓이가 같아지는 높이에 수평선(기체–액체 공존 압력)이 그어진다. Tᵣ = 1.00에서는 고리가 줄어 변곡점 (1, 1), 곧 임계점이 된다. ' +
    '환산 압력 pᵣ를 옮기면 그 압력에서 판데르발스 식(Vᵣ의 3차 방정식)의 실근 개수와 각 근의 Z = (3/8)pᵣVᵣ/Tᵣ가 나온다. ' +
    '환산 판데르발스 식 pᵣ = 8Tᵣ/(3Vᵣ − 1) − 3/Vᵣ²로 계산했으며, 실제 기체의 공존 압력·Z와는 정량적으로 다르다.',
  init: function (api) {
    var st = { T: 0.90, p: 0.65, maxwell: true };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.56; }, label: '환산 판데르발스 등온선 pᵣ–Vᵣ 그래프' });
    var ctx = cv.ctx;
    var VMIN = 0.4, VMAX = 5, PMIN = -0.6, PMAX = 1.6;
    api.slider({ id: 'mj-vdw-maxwell-T', label: '환산 온도 Tᵣ', min: 0.80, max: 1.50, step: 0.01, value: st.T,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.T = v; draw(); } });
    api.slider({ id: 'mj-vdw-maxwell-p', label: '환산 압력 pᵣ', min: 0.10, max: 2.00, step: 0.01, value: st.p,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.p = v; draw(); } });
    var bM = api.button('맥스웰 작도 보이기', function () {
      st.maxwell = !st.maxwell; bM.setAttribute('aria-pressed', st.maxwell ? 'true' : 'false'); draw();
    }, { toggle: true, pressed: true });
    var rN = api.readout('실근 개수 ');
    var rZ = api.readout('Z ');
    var rS = api.readout('공존 압력 pᵣ* ');

    function P(V, T) { return 8 * T / (3 * V - 1) - 3 / (V * V); }
    function dP(V, T) { return -24 * T / Math.pow(3 * V - 1, 2) + 6 / (V * V * V); }
    function intP(V, T) { return 8 * T / 3 * Math.log(3 * V - 1) + 3 / V; }
    function bisect(f, a, b) {
      var fa = f(a);
      for (var i = 0; i < 80; i++) { var m = (a + b) / 2, fm = f(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } }
      return (a + b) / 2;
    }
    // 모든 실근: pᵣ = P(V) 를 V ∈ (1/3, 60) 에서 찾는다
    function roots(p, T) {
      var out = [], f = function (V) { return P(V, T) - p; };
      var prev = 0.3334, fp = f(prev);
      for (var i = 1; i <= 3000; i++) {
        var V = 0.3334 * Math.pow(60 / 0.3334, i / 3000), fv = f(V);
        if (fp * fv <= 0) out.push(bisect(f, prev, V));
        prev = V; fp = fv;
      }
      return out;
    }
    function spinodals(T) {
      if (T >= 1) return null;
      var a = [], prev = 0.34, fp = dP(prev, T);
      for (var i = 1; i <= 2000; i++) {
        var V = 0.34 + i * (10 - 0.34) / 2000, fv = dP(V, T);
        if (fp * fv <= 0) a.push(bisect(function (x) { return dP(x, T); }, prev, V));
        prev = V; fp = fv;
      }
      return a.length === 2 ? a : null;
    }
    function maxwell(T) {
      var sp = spinodals(T); if (!sp) return null;
      var pmin = Math.max(P(sp[0], T), 1e-6), pmax = P(sp[1], T);
      function g(p) { var r = roots(p, T); if (r.length < 3) return NaN; return intP(r[2], T) - intP(r[0], T) - p * (r[2] - r[0]); }
      var a = pmin + 1e-7, b = pmax - 1e-7;
      for (var i = 0; i < 60; i++) { var m = (a + b) / 2, gm = g(m); if (gm > 0) a = m; else b = m; }
      var ps = (a + b) / 2, r = roots(ps, T);
      return { p: ps, Vl: r[0], Vm: r[1], Vg: r[2], sp: sp };
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var L = 56, R = w - 16, Tp = 16, B = h - 44;
      // 가로축은 로그 눈금이 아니라 선형(0.4~5)
      function sx(V) { return L + (V - VMIN) / (VMAX - VMIN) * (R - L); }
      function sy(p) { return B - (p - PMIN) / (PMAX - PMIN) * (B - Tp); }
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      ctx.textAlign = 'right';
      [-0.5, 0, 0.5, 1, 1.5].forEach(function (p) {
        ctx.beginPath(); ctx.moveTo(L, sy(p)); ctx.lineTo(R, sy(p)); ctx.stroke(); ctx.fillText(p.toFixed(1), L - 6, sy(p) + 4);
      });
      ctx.textAlign = 'center';
      [0.5, 1, 2, 3, 4, 5].forEach(function (V) {
        ctx.beginPath(); ctx.moveTo(sx(V), Tp); ctx.lineTo(sx(V), B); ctx.stroke(); ctx.fillText(V, sx(V), B + 15);
      });
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.strokeRect(L, Tp, R - L, B - Tp);
      ctx.beginPath(); ctx.moveTo(L, sy(0)); ctx.lineTo(R, sy(0)); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('환산 부피 Vᵣ', (L + R) / 2, B + 32);
      ctx.save(); ctx.translate(14, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('환산 압력 pᵣ', 0, 0); ctx.restore();

      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, R - L, B - Tp); ctx.clip();
      var M = st.T < 1 ? maxwell(st.T) : null;
      // 맥스웰 넓이 음영
      if (M && st.maxwell) {
        shade(M.Vl, M.Vm, T.figSoftBlue); shade(M.Vm, M.Vg, T.figSoftRed);
      }
      function shade(a, b, col) {
        ctx.beginPath(); ctx.moveTo(sx(a), sy(M.p));
        for (var i = 0; i <= 120; i++) { var V = a + (b - a) * i / 120; ctx.lineTo(sx(V), sy(P(V, st.T))); }
        ctx.lineTo(sx(b), sy(M.p)); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      }
      // 등온선: 구간별 색
      function seg(a, b, col, lw, dash) {
        ctx.beginPath();
        for (var i = 0; i <= 300; i++) {
          var V = a + (b - a) * i / 300, p = Math.max(Math.min(P(V, st.T), 50), -50);
          if (i === 0) ctx.moveTo(sx(V), sy(p)); else ctx.lineTo(sx(V), sy(p));
        }
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
      }
      var V0 = 0.36;
      if (M) {
        seg(V0, M.Vl, T.figAccent, 2.6);
        seg(M.Vl, M.sp[0], T.figAmber, 2.2, [6, 4]);
        seg(M.sp[0], M.sp[1], T.figRed, 2.8);
        seg(M.sp[1], M.Vg, T.figAmber, 2.2, [6, 4]);
        seg(M.Vg, VMAX, T.figAccent, 2.6);
        if (st.maxwell) {
          ctx.beginPath(); ctx.moveTo(sx(M.Vl), sy(M.p)); ctx.lineTo(sx(M.Vg), sy(M.p));
          ctx.strokeStyle = T.figInk; ctx.lineWidth = 2.4; ctx.stroke();
          [M.Vl, M.Vg].forEach(function (V) { ctx.beginPath(); ctx.arc(sx(V), sy(M.p), 4, 0, 7); ctx.fillStyle = T.figInk; ctx.fill(); });
        }
      } else {
        seg(V0, VMAX, T.figAccent, 2.6);
      }
      // 선택한 압력 선과 근
      var rs = roots(st.p, st.T);
      ctx.setLineDash([3, 4]); ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(L, sy(st.p)); ctx.lineTo(R, sy(st.p)); ctx.stroke(); ctx.setLineDash([]);
      rs.forEach(function (V) {
        if (V > VMAX) return;
        ctx.beginPath(); ctx.arc(sx(V), sy(st.p), 5, 0, 7); ctx.fillStyle = T.figPanel; ctx.fill();
        ctx.strokeStyle = T.figViolet; ctx.lineWidth = 2; ctx.stroke();
      });
      // 임계점
      var nearC = Math.abs(st.T - 1) < 0.005;
      ctx.beginPath(); ctx.arc(sx(1), sy(1), nearC ? 7 : 4, 0, 7);
      ctx.fillStyle = nearC ? T.figRed : T.figMuted; ctx.fill();
      ctx.restore();
      ctx.font = (nearC ? '600 ' : '') + '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = nearC ? T.figRed : T.figMuted;
      ctx.fillText(nearC ? '변곡점 (1, 1): 임계점, 기울기 0' : '임계점 (1, 1)', sx(1) + 10, sy(1) - 8);
      // 범례
      var lx = R - 196, ly = Tp + 10;
      if (w < 560) { lx = R - 194; ly = sy(-0.04); }
      ctx.fillStyle = T.figPanel; ctx.globalAlpha = 0.92; ctx.fillRect(lx, ly, 188, M ? 70 : 26); ctx.globalAlpha = 1;
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(lx, ly, 188, M ? 70 : 26);
      var items = M ? [[T.figAccent, [], '안정(기체·액체)'], [T.figAmber, [6, 4], '준안정'], [T.figRed, [], '불안정 (∂p/∂V)_T > 0']] : [[T.figAccent, [], 'Tᵣ ≥ 1: 고리 없음']];
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      items.forEach(function (it, i) {
        var y = ly + 15 + i * 21;
        ctx.beginPath(); ctx.moveTo(lx + 8, y - 4); ctx.lineTo(lx + 34, y - 4); ctx.strokeStyle = it[0]; ctx.lineWidth = 2.6; ctx.setLineDash(it[1]); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figInk; ctx.fillText(it[2], lx + 40, y);
      });
      if (M && st.maxwell) {
        ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
        var A1 = M.p * (M.Vm - M.Vl) - (intP(M.Vm, st.T) - intP(M.Vl, st.T));
        ctx.fillText('두 넓이가 같다 (각 ' + Math.abs(A1).toFixed(3) + ')', Math.max(sx(M.Vm), L + 90), Math.min(sy(Math.max(P(M.sp[0], st.T), PMIN + 0.1)) + 20, B - 6));
      }
      // 읽음값
      rN.set(rs.length + '개');
      var zs = rs.map(function (V) { return (3 / 8 * st.p * V / st.T).toFixed(3); });
      var note = '';
      if (rs.length === 3 && M) note = st.p > M.p ? ' (가장 작은 근 = 액체가 안정)' : ' (가장 큰 근 = 기체가 안정)';
      rZ.set(zs.join(', ') + note);
      rS.set(M ? M.p.toFixed(3) : 'Tᵣ ≥ 1이라 공존 없음');
    }
    api.onResize(draw);
    draw();
  },
});
