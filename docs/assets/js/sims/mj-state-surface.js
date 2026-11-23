/* 수학 도구 1 미분과 편미분: 상태 곡면 P(V, T) 위에서 편미분과 전미분 보기 (3D) */
Sims.register('mj-state-surface', {
  title: '상태 곡면 위를 걸어 보기 — 편미분 두 개와 전미분',
  caption: '슬라이더로 곡면 위의 점 A(V, T)를 고르면 그 점을 지나는 등온선(파랑, T 고정)과 등적선(빨강, V 고정), 두 접선의 기울기가 나타난다. dV, dT로 걸음을 주면 접평면(초록) 위의 dP = (∂P/∂V, T 고정)·dV + (∂P/∂T, V 고정)·dT(초록 점)와 곡면 위의 실제 ΔP(주황 점)를 비교할 수 있다. 걸음을 절반으로 줄이면 차이는 약 4분의 1로 줄어든다(2차 오차). 기체 1 mol, CO₂는 판데르발스 식(a = 3.640 L²·bar/mol², b = 0.04267 L/mol)으로 계산했고, 압력 축 범위를 벗어난 곡면은 그리지 않는다.',
  init: function (api) {
    var R = 0.08314, A = 3.640, B = 0.04267;
    var GAS = {
      ideal: { name: '이상 기체', V: [5, 40], T: [200, 500], Pmax: 8.5, Pticks: [0, 2, 4, 6, 8], Vticks: [5, 15, 25, 35], Tticks: [300, 400, 500],
        V0: 24.9, T0: 300, dV: [-10, 10, 0.5, 4], dT: [-100, 100, 5, 60], vStep: 0.1,
        P: function (V, T) { return R * T / V; }, PV: function (V, T) { return -R * T / (V * V); }, PT: function (V) { return R / V; } },
      vdw: { name: 'CO₂ 판데르발스', V: [0.08, 0.6], T: [260, 340], Pmax: 140, Pticks: [0, 50, 100], Vticks: [0.1, 0.3, 0.5], Tticks: [280, 310, 340],
        V0: 0.5, T0: 300, dV: [-0.15, 0.15, 0.005, 0.05], dT: [-30, 30, 1, 10], vStep: 0.005,
        P: function (V, T) { return R * T / (V - B) - A / (V * V); }, PV: function (V, T) { return -R * T / ((V - B) * (V - B)) + 2 * A / (V * V * V); }, PT: function (V) { return R / (V - B); } },
    };
    var st = { gas: 'ideal', V0: 24.9, T0: 300, dV: 4, dT: 60 };
    function G() { return GAS[st.gas]; }
    function sx(V) { var g = G(); return -2.2 + 4.4 * (V - g.V[0]) / (g.V[1] - g.V[0]); }
    function sz(T) { var g = G(); return 1.6 - 3.2 * (T - g.T[0]) / (g.T[1] - g.T[0]); }
    function sy(P) { return -1.2 + 2.8 * P / G().Pmax; }
    function pt(V, T, P, lift) { return [sx(V), sy(P) + (lift || 0), sz(T)]; }
    function inP(P) { return P >= 0 && P <= G().Pmax; }
    function num(v, d) { var s = Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 1 ? v.toPrecision(3) : v.toPrecision(2); if (d != null) s = v.toFixed(d); return s.replace('-', '−'); }
    function sig(v) { return (Math.abs(v) < 1e-3 && v !== 0 ? v.toExponential(2).replace('e', '×10^') : Number(v.toPrecision(3)).toString()).replace(/-/g, '−'); }

    var rP = api.readout('A의 압력 P');
    var rPV = api.readout('∂P/∂V (T 고정)');
    var rPT = api.readout('∂P/∂T (V 고정)');
    var rdP = api.readout('접평면 dP');
    var rDP = api.readout('곡면 ΔP');
    var rErr = api.readout('차이 ΔP − dP');

    // 곡선을 압력 범위 안의 조각으로 나눠 그린다
    function curve(g, f, n, color, o, lift) {
      var seg = [];
      for (var i = 0; i <= n; i++) {
        var q = f(i / n);
        if (q && inP(q[2])) seg.push(pt(q[0], q[1], q[2], lift));
        else { if (seg.length > 1) g.path(seg, color, o); seg = []; }
      }
      if (seg.length > 1) g.path(seg, color, o);
    }

    var S = api.scene3d({
      yaw: -0.55, pitch: 0.42, dist: 11, scale: 0.15, label: '기체 1 mol의 상태 곡면 P(V, T)와 점 A에서의 등온선·등적선·접평면',
      draw: function (g, T) {
        var gs = G(), i, k;
        var V0 = st.V0, T0 = st.T0, P0 = gs.P(V0, T0), PV = gs.PV(V0, T0), PT = gs.PT(V0);
        // 바닥 상자와 눈금
        var c = [pt(gs.V[0], gs.T[0], 0), pt(gs.V[1], gs.T[0], 0), pt(gs.V[1], gs.T[1], 0), pt(gs.V[0], gs.T[1], 0)];
        g.path(c, T.figLine, { width: 1, closed: true });
        g.line(pt(gs.V[0], gs.T[1], 0), pt(gs.V[0], gs.T[1], gs.Pmax), T.figLine, { width: 1 });
        gs.Vticks.forEach(function (v) { g.text(pt(v, gs.T[0], 0), String(v), { color: T.figMuted, size: 11, dy: 14 }); });
        gs.Tticks.forEach(function (t) { g.text(pt(gs.V[1], t, 0), String(t), { color: T.figMuted, size: 11, dx: 18 }); });
        gs.Pticks.forEach(function (p) { g.text(pt(gs.V[0], gs.T[1], p), String(p), { color: T.figMuted, size: 11, dx: -14 }); });
        g.text(pt((gs.V[0] + gs.V[1]) / 2, gs.T[0], 0), 'V (L)', { size: 12, dy: 30, bold: true });
        g.text(pt(gs.V[1], (gs.T[0] + gs.T[1]) / 2, 0), 'T (K)', { size: 12, dx: 38, bold: true });
        g.text(pt(gs.V[0], gs.T[1], gs.Pmax), 'P (bar)', { size: 12, dy: -12, bold: true });
        // 그물 곡면
        var NV = 12, NT = 8;
        for (i = 0; i < NV; i++) for (k = 0; k < NT; k++) {
          var va = gs.V[0] + (gs.V[1] - gs.V[0]) * i / NV, vb = gs.V[0] + (gs.V[1] - gs.V[0]) * (i + 1) / NV;
          var ta = gs.T[0] + (gs.T[1] - gs.T[0]) * k / NT, tb = gs.T[0] + (gs.T[1] - gs.T[0]) * (k + 1) / NT;
          var ps = [[va, ta], [vb, ta], [vb, tb], [va, tb]], ok = true;
          var q = ps.map(function (p) { var P = gs.P(p[0], p[1]); if (!inP(P)) ok = false; return pt(p[0], p[1], P); });
          if (ok) g.poly(q, T.figSoftBlue, { alpha: 0.55 });
        }
        for (k = 0; k <= NT; k++) (function (t) { curve(g, function (u) { var v = gs.V[0] + (gs.V[1] - gs.V[0]) * u; return [v, t, gs.P(v, t)]; }, 60, T.figLine, { width: 0.8 }); })(gs.T[0] + (gs.T[1] - gs.T[0]) * k / NT);
        for (i = 0; i <= NV; i++) (function (v) { curve(g, function (u) { var t = gs.T[0] + (gs.T[1] - gs.T[0]) * u; return [v, t, gs.P(v, t)]; }, 20, T.figLine, { width: 0.8 }); })(gs.V[0] + (gs.V[1] - gs.V[0]) * i / NV);
        // 등온선, 등적선
        curve(g, function (u) { var v = gs.V[0] + (gs.V[1] - gs.V[0]) * u; return [v, T0, gs.P(v, T0)]; }, 160, T.figBlue, { width: 3.2 }, 0.04);
        curve(g, function (u) { var t = gs.T[0] + (gs.T[1] - gs.T[0]) * u; return [V0, t, gs.P(V0, t)]; }, 60, T.figRed, { width: 3.2 }, 0.04);
        // 접평면 조각
        var hv = (gs.V[1] - gs.V[0]) * 0.16, ht = (gs.T[1] - gs.T[0]) * 0.2;
        var tp = function (v, t) { return P0 + PV * (v - V0) + PT * (t - T0); };
        g.poly([[V0 - hv, T0 - ht], [V0 + hv, T0 - ht], [V0 + hv, T0 + ht], [V0 - hv, T0 + ht]].map(function (p) { return pt(p[0], p[1], Math.max(0, Math.min(gs.Pmax, tp(p[0], p[1])))); }), T.figGreen, { alpha: 0.22, stroke: T.figGreen, strokeWidth: 1 });
        // 접선 화살표(압력 범위 안에 들도록 길이 조절)
        var lv = (gs.V[1] - gs.V[0]) * 0.2, lt = (gs.T[1] - gs.T[0]) * 0.28;
        while (!inP(P0 + PV * lv) && lv > 1e-4) lv *= 0.7;
        while (!inP(P0 + PT * lt) && lt > 1e-3) lt *= 0.7;
        g.arrow(pt(V0, T0, P0, 0.06), pt(V0 + lv, T0, P0 + PV * lv, 0.06), T.figBlue, { width: 2.6 });
        g.arrow(pt(V0, T0, P0, 0.06), pt(V0, T0 + lt, P0 + PT * lt, 0.06), T.figRed, { width: 2.6 });
        // 걸음
        var V1 = V0 + st.dV, T1 = T0 + st.dT, dP = PV * st.dV + PT * st.dT, P1 = gs.P(V1, T1);
        var Pl = P0 + dP;
        g.line(pt(V0, T0, 0), pt(V1, T0, 0), T.figBlue, { width: 1.6, dash: [4, 3] });
        g.line(pt(V1, T0, 0), pt(V1, T1, 0), T.figRed, { width: 1.6, dash: [4, 3] });
        if (inP(Pl)) { g.line(pt(V0, T0, P0), pt(V1, T1, Pl), T.figGreen, { width: 2 }); g.sphere(pt(V1, T1, Pl, 0.05), 0.09, T.figGreen, { flat: true, outline: T.figInk }); }
        if (inP(P1)) { g.sphere(pt(V1, T1, P1, 0.05), 0.09, T.figAmber, { flat: true, outline: T.figInk }); g.line(pt(V1, T1, 0), pt(V1, T1, P1), T.figMuted, { width: 1, dash: [2, 3] }); }
        if (inP(Pl) && inP(P1)) g.line(pt(V1, T1, Pl), pt(V1, T1, P1), T.figInk, { width: 2.4 });
        g.line(pt(V0, T0, 0), pt(V0, T0, P0), T.figMuted, { width: 1, dash: [2, 3] });
        g.sphere(pt(V0, T0, P0, 0.06), 0.1, T.figInk, { flat: true });
        g.text(pt(V0, T0, P0), 'A', { bold: true, size: 13, dx: -12, dy: -12 });
        // 읽기 값
        var uV = st.gas === 'ideal' ? ' bar/L' : ' bar/L';
        rP.set(num(P0, P0 < 10 ? 3 : 1) + ' bar');
        rPV.set(sig(PV) + uV);
        rPT.set(sig(PT) + ' bar/K');
        rdP.set(num(dP, Math.abs(dP) < 10 ? 3 : 1) + ' bar');
        var DP = P1 - P0, e = DP - dP;
        rDP.set(num(DP, Math.abs(DP) < 10 ? 3 : 1) + ' bar');
        rErr.set(num(e, Math.abs(e) < 10 ? 3 : 1) + ' bar' + (Math.abs(DP) > 1e-9 ? ' (' + (100 * e / DP).toFixed(1).replace('-', '−') + ' %)' : ''));
      },
    });

    var gb = api.group();
    var bI = api.button('이상 기체 (5~40 L)', function () { setGas('ideal'); }, { toggle: true, pressed: true, parent: gb });
    var bW = api.button('CO₂ 판데르발스 (0.08~0.6 L)', function () { setGas('vdw'); }, { toggle: true, parent: gb });
    function fmtV(v) { return (st.gas === 'ideal' ? v.toFixed(1) : v.toFixed(3)) + ' L'; }
    var sV = api.slider({ id: 'mj-state-surface-v', label: '점 A의 부피 V', min: 5, max: 40, step: 0.1, value: 24.9, format: fmtV, onInput: function (v) { st.V0 = v; clampStep(); S.redraw(); } });
    var sT = api.slider({ id: 'mj-state-surface-t', label: '점 A의 온도 T', min: 200, max: 500, step: 1, value: 300, format: function (v) { return v.toFixed(0) + ' K'; }, onInput: function (v) { st.T0 = v; clampStep(); S.redraw(); } });
    var sdV = api.slider({ id: 'mj-state-surface-dv', label: '걸음 dV', min: -10, max: 10, step: 0.5, value: 4, format: function (v) { return (v >= 0 ? '+' : '−') + fmtV(Math.abs(v)); }, onInput: function (v) { st.dV = v; S.redraw(); } });
    var sdT = api.slider({ id: 'mj-state-surface-dt', label: '걸음 dT', min: -100, max: 100, step: 5, value: 60, format: function (v) { return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(0) + ' K'; }, onInput: function (v) { st.dT = v; S.redraw(); } });
    api.button('걸음 절반으로', function () { sdV.set(snap(st.dV / 2, G().dV[2])); sdT.set(snap(st.dT / 2, G().dT[2])); });
    function snap(v, s) { return Math.round(v / s) * s; }
    function clampStep() { /* 걸음 끝이 범위를 넘지 않게 */
      var g = G();
      if (st.V0 + st.dV < g.V[0]) sdV.set(snap(g.V[0] - st.V0, g.dV[2]) + g.dV[2]);
      if (st.V0 + st.dV > g.V[1]) sdV.set(snap(g.V[1] - st.V0, g.dV[2]) - g.dV[2]);
      if (st.T0 + st.dT < g.T[0]) sdT.set(snap(g.T[0] - st.T0, g.dT[2]) + g.dT[2]);
      if (st.T0 + st.dT > g.T[1]) sdT.set(snap(g.T[1] - st.T0, g.dT[2]) - g.dT[2]);
    }
    function setRange(s, min, max, step) { s.input.min = min; s.input.max = max; s.input.step = step; }
    function setGas(k) {
      st.gas = k; var g = G();
      bI.setAttribute('aria-pressed', k === 'ideal' ? 'true' : 'false'); bW.setAttribute('aria-pressed', k === 'vdw' ? 'true' : 'false');
      setRange(sV, g.V[0] + 0.05 * (g.V[1] - g.V[0]), g.V[1] - 0.05 * (g.V[1] - g.V[0]), g.vStep);
      setRange(sT, g.T[0], g.T[1], 1);
      setRange(sdV, g.dV[0], g.dV[1], g.dV[2]); setRange(sdT, g.dT[0], g.dT[1], g.dT[2]);
      st.V0 = g.V0; st.T0 = g.T0; st.dV = g.dV[3]; st.dT = g.dT[3];
      sV.set(g.V0); sT.set(g.T0); sdV.set(g.dV[3]); sdT.set(g.dT[3]);
      S.redraw();
    }
    S.redraw();
  },
});
