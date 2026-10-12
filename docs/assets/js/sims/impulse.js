/* 3-4 운동량과 충격량: 충돌 시간이 길수록 평균 힘이 작아진다 (충격량 = 그래프 넓이는 같음) */
Sims.register('impulse', {
  title: '같은 달걀, 다른 바닥 — 충돌 시간과 충격력',
  caption: '질량 0.06 kg인 달걀이 5 m/s로 떨어져 멈춘다(운동량 변화량 0.3 N·s로 항상 같다). 바닥을 바꾸면 충돌 시간이 달라지고, 힘–시간 그래프의 모양이 바뀐다. 그래프 아래 넓이(충격량)는 늘 같지만 가장 큰 힘은 크게 달라진다. 달걀이 깨지는 힘은 설명을 위해 약 30 N으로 가정했다.',
  init: function (api) {
    var M = 0.06, V = 5, DP = M * V, BREAK = 30, TMAX = 0.2, FMAX_AXIS = 250;
    var floors = [
      { name: '콘크리트', dt: 0.002 }, { name: '나무 바닥', dt: 0.01 },
      { name: '방석', dt: 0.05 }, { name: '두꺼운 이불', dt: 0.12 },
    ];
    var state = { dt: 0.002, phase: 'rest', y: 1, prog: 1, ghosts: [] };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.15 : 0.5; }, label: '달걀 낙하 장면과 힘-시간 그래프' });
    var ctx = cv.ctx;

    var rDt = api.readout('충돌 시간 Δt');
    var rP = api.readout('충격량 = Δp');
    var rAvg = api.readout('평균 힘');
    var rMax = api.readout('가장 큰 힘');

    var g = api.group();
    var btns = floors.map(function (f, i) {
      return api.button(f.name, function () { choose(f.dt); }, { toggle: true, pressed: i === 0, parent: g });
    });
    var slider = api.slider({ id: 'impulse-dt', label: '충돌 시간', min: Math.log10(0.002), max: Math.log10(0.2), step: 0.01, value: Math.log10(0.002),
      format: function (v) { return fmtT(Math.pow(10, v)); },
      onInput: function (v) { state.dt = Math.pow(10, v); syncButtons(); reset(); } });
    var drop = api.button('떨어뜨리기', function () { start(); }, { primary: true });

    function fmtT(t) { return t < 0.01 ? t.toFixed(3) + ' s' : t.toFixed(2) + ' s'; }
    function fmax(dt) { return Math.PI * DP / (2 * dt); }
    function syncButtons() { btns.forEach(function (b, i) { b.setAttribute('aria-pressed', Math.abs(floors[i].dt - state.dt) < 1e-9 ? 'true' : 'false'); }); }
    function choose(dt) { slider.set(Math.log10(dt)); state.dt = dt; syncButtons(); reset(); }
    function reset() { state.phase = 'rest'; state.y = 1; state.prog = 1; draw(); readouts(); }
    function readouts() {
      rDt.set(fmtT(state.dt)); rP.set(DP.toFixed(2) + ' N·s');
      rAvg.set((DP / state.dt).toFixed(1) + ' N'); rMax.set(fmax(state.dt).toFixed(1) + ' N');
    }
    function start() {
      if (state.ghosts.length === 0 || state.ghosts[state.ghosts.length - 1] !== state.dt) state.ghosts.push(state.dt);
      if (state.ghosts.length > 4) state.ghosts.shift();
      if (api.reduced) { state.phase = 'done'; state.y = 0; state.prog = 1; draw(); return; }
      state.phase = 'fall'; state.y = 1; state.prog = 0; loop.play();
    }
    var loop = api.loop(function (dt) {
      if (state.phase === 'fall') {
        state.y -= dt * 1.6;
        if (state.y <= 0) { state.y = 0; state.phase = 'hit'; }
      } else if (state.phase === 'hit') {
        // 충돌은 느린 화면: 실제 0.2 s를 화면 1.6 s로 늘려 보여 준다
        state.prog += dt / 1.6;
        var realT = state.prog * TMAX;
        if (realT >= state.dt) { state.phase = 'done'; loop.pause(); }
      }
      draw();
    });
    loop.pause();

    function panel() {
      var w = cv.w, h = cv.h, stacked = w < 560;
      return stacked
        ? { scene: { x: 0, y: 0, w: w, h: h * 0.42 }, graph: { x: 0, y: h * 0.45, w: w, h: h * 0.55 } }
        : { scene: { x: 0, y: 0, w: w * 0.34, h: h }, graph: { x: w * 0.38, y: 0, w: w * 0.62, h: h } };
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, P = panel();
      ctx.clearRect(0, 0, w, h);
      drawScene(T, P.scene); drawGraph(T, P.graph);
    }
    function drawScene(T, r) {
      var soft = Math.min(1, (Math.log10(state.dt) + 2.7) / 2);   // 0(딱딱함)~1(푹신함)
      var floorY = r.y + r.h - 28, cx = r.x + r.w / 2;
      // 바닥
      var thick = 6 + soft * 26;
      ctx.fillStyle = soft > 0.5 ? T.figSoftAmber : T.figSoftBlue;
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      roundRect(r.x + 12, floorY - thick, r.w - 24, thick + 14, 6); ctx.fill(); ctx.stroke();
      var name = (floors.filter(function (f) { return Math.abs(f.dt - state.dt) < 1e-9; })[0] || {}).name || '바닥';
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(name, cx, floorY + 12);
      // 달걀 위치
      var top = r.y + 52, surf = floorY - thick;
      var ey, squash = 0;
      if (state.phase === 'fall') ey = surf - 22 - state.y * (surf - top - 22);
      else if (state.phase === 'hit') { var p = Math.min(1, state.prog * TMAX / state.dt); squash = Math.sin(Math.PI * p); ey = surf - 22 + squash * soft * thick * 0.6; }
      else ey = surf - 22 + (state.phase === 'done' ? 0 : -(surf - top - 22));
      var broken = fmax(state.dt) > BREAK && (state.phase === 'done' || (state.phase === 'hit' && state.prog * TMAX > state.dt * 0.5));
      // 달걀
      ctx.save(); ctx.translate(cx, ey);
      ctx.scale(1 + squash * 0.18, 1 - squash * 0.18);
      ctx.beginPath(); ctx.ellipse(0, 0, 16, 21, 0, 0, Math.PI * 2);
      ctx.fillStyle = T.figPanel; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = broken ? T.figRed : T.figInk; ctx.stroke();
      if (broken) {
        ctx.beginPath(); ctx.moveTo(-14, -2); ctx.lineTo(-7, 4); ctx.lineTo(-1, -5); ctx.lineTo(5, 3); ctx.lineTo(10, -3); ctx.lineTo(15, 2);
        ctx.strokeStyle = T.figRed; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.restore();
      if (state.phase === 'done' || state.phase === 'rest') {
        var willBreak = fmax(state.dt) > BREAK;
        ctx.fillStyle = willBreak ? T.figRed : T.figGreen; ctx.font = '600 13px ' + T.fontBody;
        var msg = willBreak ? '깨진다' : '안 깨진다';
        ctx.fillText(state.phase === 'done' ? '결과: ' + msg : '예상: ' + msg, cx, r.y + 18);
      }
    }
    function drawGraph(T, r) {
      var L = r.x + 58, R = r.x + r.w - 22, Tp = r.y + 18, B = r.y + r.h - 34;
      var sx = function (t) { return L + (t / TMAX) * (R - L); };
      var sy = function (f) { return B - (f / FMAX_AXIS) * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      [0, 50, 100, 150, 200, 250].forEach(function (f) { ctx.beginPath(); ctx.moveTo(L, sy(f)); ctx.lineTo(R, sy(f)); ctx.stroke(); ctx.fillText(f, L - 6, sy(f) + 4); });
      ctx.textAlign = 'center';
      [0, 0.05, 0.1, 0.15, 0.2].forEach(function (t) { ctx.fillText(t.toFixed(2), sx(t), B + 15); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('시간 (s)', (L + R) / 2, B + 30);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('바닥이 달걀에 작용한 힘 (N)', 0, 0); ctx.restore();
      // 깨지는 힘
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figRed; ctx.beginPath(); ctx.moveTo(L, sy(BREAK)); ctx.lineTo(R, sy(BREAK)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figRed; ctx.textAlign = 'right'; ctx.font = '11px ' + T.fontBody; ctx.fillText('깨지는 힘(가정) 30 N', R, sy(BREAK) - 5);
      // 이전 곡선
      state.ghosts.forEach(function (gd) { if (Math.abs(gd - state.dt) > 1e-9) curve(gd, 1, T.figLine, null, 1.2); });
      // 현재 곡선 (진행 정도만큼)
      var shown = state.phase === 'fall' ? 0 : state.phase === 'hit' ? Math.min(1, state.prog * TMAX / state.dt) : 1;
      if (state.phase === 'rest') shown = 1;
      curve(state.dt, shown, T.figAccent, T.figSoftBlue, 2.4);
      function curve(dt, frac, stroke, fill, lw) {
        var fm = fmax(dt), n = 80, tEnd = dt * frac;
        ctx.beginPath(); ctx.moveTo(sx(0), sy(0));
        for (var i = 0; i <= n; i++) { var t = tEnd * i / n; ctx.lineTo(sx(t), sy(fm * Math.sin(Math.PI * t / dt))); }
        if (fill) { ctx.lineTo(sx(tEnd), sy(0)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); for (var j = 0; j <= n; j++) { var t2 = tEnd * j / n; ctx.lineTo(sx(t2), sy(fm * Math.sin(Math.PI * t2 / dt))); } }
        ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
      }
      ctx.fillStyle = T.figAccent; ctx.textAlign = 'left'; ctx.font = '600 12px ' + T.fontBody;
      var lx = sx(Math.min(state.dt, TMAX * 0.7)) + 8;
      ctx.fillText('넓이 = 충격량 0.30 N·s', Math.min(lx, R - 140), Math.max(Tp + 12, sy(Math.min(fmax(state.dt), FMAX_AXIS)) + 4));
    }
    function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    api.onResize(draw);
    readouts(); draw();
  },
});
