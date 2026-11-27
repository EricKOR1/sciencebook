/* 유기화학 5 알켄과 알카인: 중합의 천장 온도
   ΔG_p = ΔH_p − T(ΔS_p° + R ln[M])   (단위체 농도 [M]/1 M 기준)
   T_c = ΔH_p / (ΔS_p° + R ln[M]),   평형 단위체 농도 [M]_eq = exp(ΔH_p/RT − ΔS_p°/R) */
Sims.register('mj-ceiling-temperature', {
  title: '중합의 천장 온도 — ΔG_p = 0 이 되는 온도',
  caption: '중합 엔탈피 ΔH_p, 중합 엔트로피 ΔS_p°, 단위체 농도를 바꾸며 ΔG_p 직선이 0을 지나는 온도(천장 온도 T_c)가 어떻게 움직이는지 보자. 위 그래프에서 T_c보다 낮으면 중합, 높으면 해중합이 우세하고, 아래 그래프는 그 온도에서 사슬과 평형을 이루는 단위체 농도(로그 눈금)이다. '
    + 'ΔH_p가 작을수록(α-메틸스타이렌) 천장 온도가 낮아 조금만 가열해도 단위체로 돌아가고, 단위체가 묽을수록 R ln[M] 항 때문에 T_c가 낮아진다. ΔH_p·ΔS_p°는 온도에 무관하다고 보았고, 미리 설정의 값은 어림값이다(에텐은 고압 기체 중합이라 엔트로피 감소가 특히 크다).',
  init: function (api) {
    var R = 8.314;
    var PRE = [['에텐', -93, -155], ['스타이렌', -70, -104], ['메타크릴산 메틸', -56, -117], ['α-메틸스타이렌', -35, -104]];
    var st = { H: -70, S: -104, lgM: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.5 : 0.78; }, label: '온도에 따른 중합 자유 에너지 직선과 평형 단위체 농도' });
    var ctx = cv.ctx;
    var rTc = api.readout('천장 온도 T_c '), rG = api.readout('298 K의 ΔG_p '), rM = api.readout('298 K의 [M]_eq ');
    var sH = api.slider({ id: 'mj-ceiling-temperature-h', label: '중합 엔탈피 ΔH_p', min: -110, max: -20, step: 1, value: st.H,
      format: function (v) { return '−' + Math.abs(v) + ' kJ/mol'; }, onInput: function (v) { st.H = v; draw(); } });
    var sS = api.slider({ id: 'mj-ceiling-temperature-s', label: '중합 엔트로피 ΔS_p°', min: -160, max: -80, step: 1, value: st.S,
      format: function (v) { return '−' + Math.abs(v) + ' J/(mol·K)'; }, onInput: function (v) { st.S = v; draw(); } });
    var sM = api.slider({ id: 'mj-ceiling-temperature-m', label: '단위체 농도 [M]', min: -2, max: 1, step: 0.05, value: st.lgM,
      format: function (v) { var c = Math.pow(10, v); return (c < 0.1 ? c.toFixed(3) : c < 1 ? c.toFixed(2) : c.toFixed(1)) + ' M'; }, onInput: function (v) { st.lgM = v; draw(); } });
    var g = api.group();
    PRE.forEach(function (p) { api.button(p[0], function () { sH.set(p[1]); sS.set(p[2]); st.H = p[1]; st.S = p[2]; draw(); }, { parent: g }); });
    api.button('[M] = 1 M', function () { sM.set(0); st.lgM = 0; draw(); }, { parent: g });
    var T0 = 250, T1 = 750;
    function Seff() { return st.S + R * Math.log(Math.pow(10, st.lgM)); }      // J/(mol·K)
    function dG(T) { return st.H - T * Seff() / 1000; }                          // kJ/mol
    function Tc() { return st.H * 1000 / Seff(); }
    function lgMeq(T) { return (st.H * 1000 / (R * T) - st.S / R) / Math.LN10; }
    function num(v, d) { return (v < 0 ? '−' : '') + Math.abs(v).toFixed(d); }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var fs = 12; ctx.font = fs + 'px ' + T.fontBody;
      var L = 58, Rr = 16, top = 20, gap = 52, ph = (h - top - gap - 40) / 2;
      var P1 = { x: L, y: top, w: w - L - Rr, h: ph }, P2 = { x: L, y: top + ph + gap, w: w - L - Rr, h: ph };
      function X(t) { return P1.x + (t - T0) / (T1 - T0) * P1.w; }
      var tc = Tc();
      // ① ΔG_p
      var g0 = -80, g1 = 60;
      function Y1(v) { return P1.y + (g1 - v) / (g1 - g0) * P1.h; }
      ctx.fillStyle = T.figPanel; ctx.fillRect(P1.x, P1.y, P1.w, P1.h);
      if (tc > T0) { ctx.fillStyle = T.figSoftGreen; ctx.fillRect(P1.x, P1.y, Math.min(X(tc), P1.x + P1.w) - P1.x, P1.h); }
      if (tc < T1) { var xs = Math.max(X(tc), P1.x); ctx.fillStyle = T.figSoftRed; ctx.fillRect(xs, P1.y, P1.x + P1.w - xs, P1.h); }
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(P1.x, P1.y, P1.w, P1.h);
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      for (var v = g0; v <= g1; v += 20) { ctx.fillText(num(v, 0), P1.x - 6, Y1(v) + 4); ctx.strokeStyle = T.figLine; ctx.beginPath(); ctx.moveTo(P1.x, Y1(v)); ctx.lineTo(P1.x + 4, Y1(v)); ctx.stroke(); }
      ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(P1.x, Y1(0)); ctx.lineTo(P1.x + P1.w, Y1(0)); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.rect(P1.x, P1.y, P1.w, P1.h); ctx.clip();
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(X(T0), Y1(dG(T0))); ctx.lineTo(X(T1), Y1(dG(T1))); ctx.stroke();
      ctx.restore();
      ctx.textAlign = 'left'; ctx.fillStyle = T.figInk;
      ctx.save(); ctx.translate(14, P1.y + P1.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('ΔG_p (kJ/mol)', 0, 0); ctx.restore();
      ctx.textAlign = 'left';
      if (tc > T0 + 30) { ctx.fillStyle = T.figGreen; ctx.fillText('중합 우세', P1.x + 8, P1.y + 16); }
      if (tc < T1 - 70) { ctx.fillStyle = T.figRed; ctx.textAlign = 'right'; ctx.fillText('해중합 우세', P1.x + P1.w - 8, P1.y + 16); }
      // ② log [M]eq
      var m0 = -6, m1 = 2;
      function Y2(v) { return P2.y + (m1 - v) / (m1 - m0) * P2.h; }
      ctx.fillStyle = T.figPanel; ctx.fillRect(P2.x, P2.y, P2.w, P2.h);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(P2.x, P2.y, P2.w, P2.h);
      ctx.textAlign = 'right';
      for (v = m0; v <= m1; v += 2) { ctx.fillStyle = T.figMuted; ctx.fillText('10' + (v === 0 ? '⁰' : sup(v)), P2.x - 6, Y2(v) + 4); }
      ctx.save(); ctx.beginPath(); ctx.rect(P2.x, P2.y, P2.w, P2.h); ctx.clip();
      ctx.strokeStyle = T.figMuted; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(P2.x, Y2(st.lgM)); ctx.lineTo(P2.x + P2.w, Y2(st.lgM)); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = T.figViolet; ctx.lineWidth = 2.4; ctx.beginPath();
      for (var i = 0; i <= 200; i++) { var t = T0 + (T1 - T0) * i / 200; if (i) ctx.lineTo(X(t), Y2(lgMeq(t))); else ctx.moveTo(X(t), Y2(lgMeq(t))); }
      ctx.stroke(); ctx.restore();
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'left'; ctx.fillText('점선: 지금 단위체 농도', P2.x + 6, Math.min(Math.max(Y2(st.lgM) - 6, P2.y + 14), P2.y + P2.h - 6));
      ctx.fillStyle = T.figInk;
      ctx.save(); ctx.translate(14, P2.y + P2.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('[M]_eq (M)', 0, 0); ctx.restore();
      // 온도축
      ctx.textAlign = 'center'; ctx.fillStyle = T.figMuted;
      for (t = T0; t <= T1; t += 100) {
        ctx.fillText(t, X(t), P1.y + P1.h + 16); ctx.fillText(t, X(t), P2.y + P2.h + 16);
      }
      ctx.fillStyle = T.figInk; ctx.fillText('온도 T (K)', P2.x + P2.w / 2, P2.y + P2.h + 34);
      // T_c 세로선
      if (tc > T0 && tc < T1) {
        ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.6; ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(X(tc), P1.y); ctx.lineTo(X(tc), P2.y + P2.h); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figRed; ctx.font = 'bold ' + fs + 'px ' + T.fontBody;
        ctx.textAlign = X(tc) > P1.x + P1.w - 90 ? 'right' : 'left';
        ctx.fillText('T_c = ' + tc.toFixed(0) + ' K', X(tc) + (ctx.textAlign === 'left' ? 6 : -6), Y1(0) - 8);
      }
      rTc.set(tc > 0 ? tc.toFixed(0) + ' K (' + (tc - 273.15).toFixed(0) + ' ℃)' + (tc < T0 || tc > T1 ? ' — 그래프 범위 밖' : '') : '없음');
      rG.set(num(dG(298.15), 1) + ' kJ/mol');
      var mq = lgMeq(298.15); rM.set(mq < -3 ? '10^' + mq.toFixed(1) + ' M' : Math.pow(10, mq).toPrecision(2) + ' M');
    }
    function sup(n) { var m = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }; return String(n).split('').map(function (c) { return m[c]; }).join(''); }
    api.onResize(draw); api.onTheme(draw);
    draw();
  },
});
