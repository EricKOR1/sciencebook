/* 역학과 에너지 2 열과 에너지: 피스톤 속 이상 기체의 네 가지 과정과 열역학 제1법칙 Q = ΔU + W */
Sims.register('pv-diagram', {
  title: '피스톤 속 기체 — 네 가지 과정과 열역학 제1법칙',
  caption: '과정을 고르고 끝 상태를 정한 뒤 「진행」을 누르자. P–V 그래프에 경로가 그려지고, 경로 아래 넓이(색칠한 곳)가 기체가 한 일 W이다. 같은 부피만큼 팽창해도 등압·등온·단열 과정에서 일과 열이 어떻게 다른지, 그리고 언제나 Q = ΔU + W가 맞는지 확인해 보자. 단원자 이상 기체 1 mol이 처음에 1.0×10⁵ Pa, 25 L(약 301 K)인 상태에서 출발하며, 과정은 천천히 일어난다고 가정했다.',
  init: function (api) {
    var R = 8.31, N = 1, P0 = 1.0e5, V0 = 25e-3, T0 = P0 * V0 / (N * R);
    var KINDS = [
      { id: 'isobaric', name: '등압', note: '압력 일정' },
      { id: 'isochoric', name: '등적', note: '부피 일정' },
      { id: 'isothermal', name: '등온', note: '온도 일정' },
      { id: 'adiabatic', name: '단열', note: '열 출입 없음' },
    ];
    var state = { kind: 'isobaric', vEnd: 35e-3, pEnd: 1.6e5, prog: 1, ghosts: [] };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.52; }, label: '피스톤과 압력-부피 그래프' });
    var ctx = cv.ctx;

    var rW = api.readout('기체가 한 일 W');
    var rU = api.readout('내부 에너지 변화 ΔU');
    var rQ = api.readout('흡수한 열 Q');
    var rT = api.readout('온도');

    var g = api.group();
    var btns = KINDS.map(function (k) {
      return api.button(k.name + ' 과정', function () { choose(k.id); }, { toggle: true, pressed: k.id === state.kind, parent: g });
    });
    var sV = api.slider({ id: 'pv-diagram-v', label: '나중 부피', min: 12, max: 50, step: 1, value: 35,
      format: function (v) { return v + ' L'; }, onInput: function (v) { state.vEnd = v * 1e-3; state.prog = 0; refresh(); } });
    var sP = api.slider({ id: 'pv-diagram-p', label: '나중 압력', min: 0.4, max: 2.5, step: 0.1, value: 1.6,
      format: function (v) { return v.toFixed(1) + ' ×10⁵ Pa'; }, onInput: function (v) { state.pEnd = v * 1e5; state.prog = 0; refresh(); } });
    api.button('진행', function () { start(); }, { primary: true });
    api.button('그래프 지우기', function () { state.ghosts = []; draw(); });

    function choose(id) {
      state.kind = id; state.prog = 0;
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', KINDS[i].id === id ? 'true' : 'false'); });
      refresh();
    }
    function refresh() {
      sV.input.parentNode.style.display = state.kind === 'isochoric' ? 'none' : '';
      sP.input.parentNode.style.display = state.kind === 'isochoric' ? '' : 'none';
      loop.pause(); readouts(); draw();
    }
    // 과정 위의 점: s = 0(처음) ~ 1(나중)
    function at(kind, s) {
      var V, P;
      if (kind === 'isochoric') { V = V0; P = P0 + (state.pEnd - P0) * s; }
      else {
        V = V0 + (state.vEnd - V0) * s;
        if (kind === 'isobaric') P = P0;
        else if (kind === 'isothermal') P = P0 * V0 / V;
        else P = P0 * Math.pow(V0 / V, 5 / 3);
      }
      return { V: V, P: P, T: P * V / (N * R) };
    }
    // 처음 상태에서 s까지의 W, ΔU, Q
    function energy(kind, s) {
      var a = at(kind, 0), b = at(kind, s), W;
      if (kind === 'isochoric') W = 0;
      else if (kind === 'isobaric') W = P0 * (b.V - a.V);
      else if (kind === 'isothermal') W = P0 * V0 * Math.log(b.V / a.V);
      else W = 1.5 * (a.P * a.V - b.P * b.V);
      var dU = 1.5 * N * R * (b.T - a.T);
      if (kind === 'isothermal') dU = 0;
      var Q = kind === 'adiabatic' ? 0 : dU + W;
      return { W: W, dU: dU, Q: Q, T: b.T };
    }
    function fmtJ(x) { var r = Math.round(x); if (Math.abs(r) < 0.5) r = 0; return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r) + ' J'; }
    function readouts() {
      var E = energy(state.kind, 1);
      rW.set(fmtJ(E.W)); rU.set(fmtJ(E.dU)); rQ.set(fmtJ(E.Q));
      rT.set(Math.round(T0) + ' K → ' + Math.round(E.T) + ' K');
    }
    function start() {
      state.ghosts = state.ghosts.filter(function (gh) { return !(gh.kind === state.kind && gh.v === state.vEnd && gh.p === state.pEnd); });
      if (api.reduced) { state.prog = 1; remember(); draw(); return; }
      state.prog = 0; loop.play();
    }
    function remember() {
      state.ghosts.push({ kind: state.kind, v: state.vEnd, p: state.pEnd });
      if (state.ghosts.length > 4) state.ghosts.shift();
    }
    var parts = [];
    for (var i = 0; i < 26; i++) parts.push({ x: Math.random(), y: Math.random(), a: Math.random() * Math.PI * 2 });
    var loop = api.loop(function (dt) {
      if (state.prog < 1) {
        state.prog = Math.min(1, state.prog + dt / 2.2);
        if (state.prog >= 1) { remember(); readouts(); draw(); loop.pause(); return; }
      }
      var T = at(state.kind, state.prog).T, sp = 0.35 * Math.sqrt(T / T0);
      parts.forEach(function (p) {
        p.x += Math.cos(p.a) * sp * dt; p.y += Math.sin(p.a) * sp * dt;
        if (p.x < 0) { p.x = -p.x; p.a = Math.PI - p.a; } if (p.x > 1) { p.x = 2 - p.x; p.a = Math.PI - p.a; }
        if (p.y < 0) { p.y = -p.y; p.a = -p.a; } if (p.y > 1) { p.y = 2 - p.y; p.a = -p.a; }
      });
      draw();
    });
    if (api.reduced) loop.pause();

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { cyl: { x: 0, y: 0, w: w, h: h * 0.36 }, gr: { x: 0, y: h * 0.38, w: w, h: h * 0.62 } };
      return { cyl: { x: 0, y: 0, w: w * 0.3, h: h }, gr: { x: w * 0.33, y: 0, w: w * 0.67, h: h } };
    }
    function draw() {
      var T = api.tokens(); ctx.clearRect(0, 0, cv.w, cv.h);
      var Lo = layout();
      drawCylinder(T, Lo.cyl); drawGraph(T, Lo.gr);
    }
    function heatColor(T, temp) {
      return temp > T0 * 1.08 ? T.figSoftRed : temp < T0 * 0.92 ? T.figSoftBlue : T.figSoftAmber;
    }
    function drawCylinder(T, r) {
      var st = at(state.kind, state.prog), E = energy(state.kind, state.prog), Efull = energy(state.kind, 1);
      var narrow = cv.w < 560;
      // 원통: 아래가 바닥, 위로 피스톤이 움직인다. 높이 ∝ 부피(50 L = 가득)
      var cw = narrow ? Math.min(r.w * 0.36, 110) : Math.min(r.w * 0.5, 130), cx = r.x + r.w * (narrow ? 0.64 : 0.5), base = r.y + r.h - (narrow ? 34 : 62), topMax = r.y + 40;
      var hFull = base - topMax, gasH = hFull * st.V / 52e-3, py = base - gasH;
      ctx.fillStyle = heatColor(T, st.T); ctx.fillRect(cx - cw / 2, py, cw, gasH);
      // 입자
      ctx.fillStyle = T.figInk;
      parts.forEach(function (p) { ctx.beginPath(); ctx.arc(cx - cw / 2 + 5 + p.x * (cw - 10), py + 5 + p.y * (gasH - 10), 2.6, 0, Math.PI * 2); ctx.fill(); });
      // 벽
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - cw / 2, topMax - 6); ctx.lineTo(cx - cw / 2, base); ctx.lineTo(cx + cw / 2, base); ctx.lineTo(cx + cw / 2, topMax - 6); ctx.stroke();
      // 피스톤
      ctx.fillStyle = T.figLine; ctx.fillRect(cx - cw / 2 + 2, py - 12, cw - 4, 12);
      ctx.fillRect(cx - 5, Math.max(r.y + 4, py - 40), 10, Math.min(28, py - 12 - (r.y + 4)));
      // 단열이면 벽에 단열재 표시
      if (state.kind === 'adiabatic') {
        ctx.fillStyle = T.figSoftViolet;
        ctx.fillRect(cx - cw / 2 - 12, topMax - 6, 9, base - topMax + 15); ctx.fillRect(cx + cw / 2 + 3, topMax - 6, 9, base - topMax + 15);
        ctx.fillRect(cx - cw / 2 - 12, base + 3, cw + 24, 9);
        ctx.fillStyle = T.figViolet; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('단열재(열 출입 0)', cx, base + 26);
      } else if (Math.abs(Efull.Q) > 0.5) {
        // 열의 방향 화살표(바닥 아래)
        var into = Efull.Q > 0, col = into ? T.figRed : T.figBlue, ay1 = base + (narrow ? 26 : 44), ay2 = base + 6;
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3;
        [-cw / 4, cw / 4].forEach(function (dx) {
          var a = into ? ay1 : ay2, b = into ? ay2 : ay1;
          ctx.beginPath(); ctx.moveTo(cx + dx, a); ctx.lineTo(cx + dx, b + (into ? 7 : -7)); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx + dx, b); ctx.lineTo(cx + dx - 6, b + (into ? 9 : -9)); ctx.lineTo(cx + dx + 6, b + (into ? 9 : -9)); ctx.closePath(); ctx.fill();
        });
        ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(into ? '열 흡수' : '열 방출', cx, narrow ? base + 22 : base + 30);
      }
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center';
      var kn = KINDS.filter(function (k) { return k.id === state.kind; })[0];
      ctx.fillText(kn.name + ' 과정 (' + kn.note + ')', cx, r.y + 18);
      // 상태 값
      ctx.font = '12px ' + T.fontMono; ctx.textAlign = 'left'; ctx.fillStyle = T.figMuted;
      var lx = narrow ? r.x + 8 : cx - cw / 2, ly = narrow ? r.y + 44 : base + 0;
      if (narrow) {
        ctx.fillText('P ' + (st.P / 1e5).toFixed(2) + '×10⁵ Pa', lx, ly);
        ctx.fillText('V ' + (st.V * 1e3).toFixed(1) + ' L', lx, ly + 16);
        ctx.fillText('T ' + Math.round(st.T) + ' K', lx, ly + 32);
      }
      if (!narrow) {
        ctx.textAlign = 'center';
        ctx.fillText('P ' + (st.P / 1e5).toFixed(2) + '×10⁵ Pa · V ' + (st.V * 1e3).toFixed(1) + ' L', cx, r.y + r.h - 6);
      }
    }
    function drawGraph(T, r) {
      var narrow = cv.w < 560;
      var L = r.x + 50, Rr = r.x + r.w - 12, Tp = r.y + 30, B = r.y + r.h - (narrow ? 70 : 74);
      var VMAX = 55e-3, PMAX = 4.0e5;
      var X = function (V) { return L + V / VMAX * (Rr - L); }, Y = function (P) { return B - P / PMAX * (B - Tp); };
      // 격자
      ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'center';
      for (var v = 0; v <= 50; v += 10) { ctx.strokeStyle = T.rule; ctx.beginPath(); ctx.moveTo(X(v * 1e-3), Tp); ctx.lineTo(X(v * 1e-3), B); ctx.stroke(); ctx.fillStyle = T.figMuted; ctx.fillText(v, X(v * 1e-3), B + 14); }
      ctx.textAlign = 'right';
      for (var p = 0; p <= 4; p++) { ctx.strokeStyle = T.rule; ctx.beginPath(); ctx.moveTo(L, Y(p * 1e5)); ctx.lineTo(Rr, Y(p * 1e5)); ctx.stroke(); ctx.fillStyle = T.figMuted; ctx.fillText(p, L - 6, Y(p * 1e5) + 4); }
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.lineTo(Rr, B); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText('부피 V (L)', Rr, B + 29);
      ctx.textAlign = 'left'; ctx.fillText('압력 P (×10⁵ Pa)', L - 40, Tp - 12);
      // 처음 온도의 등온선(참고)
      ctx.setLineDash([2, 4]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      ctx.beginPath();
      for (var i = 0; i <= 60; i++) { var V = 8e-3 + i / 60 * 46e-3, P = P0 * V0 / V; if (P > PMAX) continue; var sx = X(V), sy = Y(P); if (i === 0 || P0 * V0 / (8e-3 + (i - 1) / 60 * 46e-3) > PMAX) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy); }
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('점선: ' + Math.round(T0) + ' K 등온선', X(10.5e-3) + 6, Y(P0 * V0 / 10.5e-3));
      // 이전 경로
      state.ghosts.forEach(function (gh) {
        if (gh.kind === state.kind && gh.v === state.vEnd && gh.p === state.pEnd && state.prog >= 1) return;
        var sv = state.vEnd, sp = state.pEnd; state.vEnd = gh.v; state.pEnd = gh.p;
        curve(gh.kind, 1, T.figLine, 1.6);
        var e = at(gh.kind, 1);
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(KINDS.filter(function (k) { return k.id === gh.kind; })[0].name, X(e.V) + 5, Y(e.P) - 4);
        state.vEnd = sv; state.pEnd = sp;
      });
      // 넓이(일)
      var s = state.prog, E = energy(state.kind, s);
      if (state.kind !== 'isochoric' && s > 0) {
        ctx.beginPath(); ctx.moveTo(X(V0), B);
        for (var j = 0; j <= 60; j++) { var q = at(state.kind, s * j / 60); ctx.lineTo(X(q.V), Y(q.P)); }
        ctx.lineTo(X(at(state.kind, s).V), B); ctx.closePath();
        ctx.fillStyle = E.W >= 0 ? T.figSoftGreen : T.figSoftRed; ctx.fill();
      }
      // 끝 상태 예정 경로와 현재 경로
      ctx.setLineDash([5, 4]); curve(state.kind, 1, T.figAccent, 1.2); ctx.setLineDash([]);
      curve(state.kind, s, T.figAccent, 3);
      var a = at(state.kind, 0), b = at(state.kind, s);
      dot(X(a.V), Y(a.P), T.figInk, '처음', T);
      dot(X(b.V), Y(b.P), T.figAccent, s >= 1 ? '나중' : '', T);
      // 넓이 설명
      if (state.kind !== 'isochoric' && s > 0) {
        ctx.fillStyle = E.W >= 0 ? T.figGreen : T.figRed; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
        var mx = (X(V0) + X(b.V)) / 2;
        ctx.fillText('넓이 = W', mx, B - 10);
      } else if (state.kind === 'isochoric') {
        ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('부피 변화 없음 → 넓이 0, W = 0', X(V0) + 8, B - 10);
      }
      // 제1법칙 식
      var y1 = B + (narrow ? 48 : 50);
      ctx.textAlign = 'center'; ctx.font = '600 13px ' + T.fontBody; ctx.fillStyle = T.figInk;
      var cxm = (L + Rr) / 2 - (narrow ? 20 : 0);
      ctx.fillText('Q = ΔU + W   →   ' + fmtJ(E.Q) + ' = ' + fmtJ(E.dU) + ' + (' + fmtJ(E.W) + ')', cxm, y1);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      ctx.fillText('ΔU = (3/2)nRΔT,  W = 그래프 아래 넓이(팽창 +, 압축 −)', cxm, y1 + 17);
      function curve(kind, sEnd, color, lw) {
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
        for (var k = 0; k <= 60; k++) { var q = at(kind, sEnd * k / 60), x = X(q.V), y = Y(Math.min(q.P, PMAX * 1.02)); if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke();
      }
    }
    function dot(x, y, col, label, T) {
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      if (label) { ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText(label, x + 8, y - 8); }
    }

    api.onResize(draw);
    choose('isobaric'); state.prog = 1; draw();
  },
});
