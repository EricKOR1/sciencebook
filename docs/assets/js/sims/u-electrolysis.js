/* 일반화학 11 전기화학: 전기 분해와 패러데이 법칙 — 전류 × 시간 = 전하량 → 전자 몰수 → 석출량 m = ItM/(zF) */
Sims.register('u-electrolysis', {
  title: '패러데이 법칙 — 전류와 시간으로 석출량 계산하기',
  caption: '석출시킬 금속을 고르고 전류와 시간을 정한 뒤 ‘전류 흘리기’를 눌러 보자. 흐른 전하량 Q = It를 패러데이 상수로 나누면 전자의 몰수가 되고, 이를 이온의 전하 수 z로 나누면 석출된 금속의 몰수, 몰질량을 곱하면 질량이 된다. 그래프의 직선 기울기는 IM/(zF)이어서 같은 전하량에서도 M/z가 큰 은이 가장 많이, 알루미늄이 가장 적게 석출된다. 전류 효율은 100 %(부반응 없음)로 가정했고, 알루미늄은 용융염 전기 분해이다.',
  init: function (api) {
    var F = 96485;
    var metals = [
      { sym: 'Cu', ion: 'Cu²⁺', z: 2, M: 63.55, col: 'figAmber' },
      { sym: 'Ag', ion: 'Ag⁺', z: 1, M: 107.87, col: 'figBlue' },
      { sym: 'Ni', ion: 'Ni²⁺', z: 2, M: 58.69, col: 'figTeal' },
      { sym: 'Al', ion: 'Al³⁺', z: 3, M: 26.98, col: 'figViolet' },
    ];
    var TMAX = 120;   // 분
    var st = { m: 0, I: 2.0, tSet: 60, t: 60, run: false };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.55; }, label: '전기 분해 장치와 석출 질량–시간 그래프' });
    var ctx = cv.ctx;
    var rQ = api.readout('전하량 Q = It'), rN = api.readout('전자 n = Q/F'), rM = api.readout('석출 금속'), rG = api.readout('질량 m');

    var g = api.group();
    var mb = metals.map(function (m, i) { return api.button(m.sym + ' (' + m.ion + ')', function () { pick(i); }, { toggle: true, pressed: i === 0, parent: g }); });
    api.slider({ id: 'u-electrolysis-i', label: '전류 I', min: 0.1, max: 5, step: 0.1, value: st.I,
      format: function (v) { return v.toFixed(1) + ' A'; }, onInput: function (v) { st.I = v; draw(); } });
    api.slider({ id: 'u-electrolysis-t', label: '시간 t', min: 1, max: TMAX, step: 1, value: st.tSet,
      format: function (v) { return v + '분'; }, onInput: function (v) { st.tSet = v; st.t = v; st.run = false; loop.pause(); draw(); } });
    var go = api.button('전류 흘리기', function () { start(); }, { primary: true });

    function pick(i) { st.m = i; mb.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); draw(); }
    function start() {
      if (api.reduced) { st.t = st.tSet; draw(); return; }
      st.t = 0; st.run = true; loop.play();
    }
    var loop = api.loop(function (dt) {
      if (!st.run) return;
      st.t += dt * st.tSet / 3;    // 3초 동안 재생
      if (st.t >= st.tSet) { st.t = st.tSet; st.run = false; loop.pause(); }
      draw();
    });
    loop.pause();
    function mass(mi, tmin) { var m = metals[mi]; return st.I * tmin * 60 * m.M / (m.z * F); }

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { cell: { x: 0, y: 0, w: w, h: h * 0.48 }, gr: { x: 0, y: h * 0.48, w: w, h: h * 0.52 } };
      return { cell: { x: 0, y: 0, w: w * 0.4, h: h }, gr: { x: w * 0.4, y: 0, w: w * 0.6, h: h } };
    }
    function drawCell(T, r) {
      var m = metals[st.m], cx = r.x + r.w / 2;
      var bw = Math.min(220, r.w * 0.78), bh = Math.min(120, r.h - 122), bx = cx - bw / 2, by = r.y + r.h - bh - 44;
      ctx.fillStyle = st.m === 3 ? T.figSoftAmber : T.figSoftBlue; ctx.fillRect(bx, by + 18, bw, bh - 18);
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(st.m === 3 ? '녹은 Al₂O₃ (용융염)' : m.ion + ' 수용액', cx, by + 38);
      // 전극
      var ax = bx + 30, kx = bx + bw - 44, ey = by - 22, eh = bh;
      ctx.fillStyle = T.figInk; ctx.fillRect(ax, ey, 14, eh);
      ctx.fillStyle = T.figLine; ctx.fillRect(kx, ey, 14, eh);
      // 석출층: 질량에 비례한 두께(그림용 배율)
      var frac = Math.min(1, mass(st.m, st.t) / mass(1, TMAX));
      var th = 1 + frac * 14;
      ctx.fillStyle = T[m.col];
      ctx.fillRect(kx - th, by + 20, th, ey + eh - by - 20); ctx.fillRect(kx + 14, by + 20, th, ey + eh - by - 20);
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody;
      ctx.fillText('산화 전극 (+)', ax + 7, by + bh + 16); ctx.fillText('환원 전극 (−)', kx + 7, by + bh + 16);
      ctx.font = '12px ' + T.fontBody;
      ctx.fillText('환원 전극: ' + m.ion + ' + ' + (m.z > 1 ? m.z : '') + 'e⁻ → ' + m.sym, cx, by + bh + 34);
      // 도선, 전원
      var wy = r.y + 30;
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ax + 7, ey); ctx.lineTo(ax + 7, wy); ctx.lineTo(cx - 6, wy);
      ctx.moveTo(cx + 6, wy); ctx.lineTo(kx + 7, wy); ctx.lineTo(kx + 7, ey); ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 6, wy - 13); ctx.lineTo(cx - 6, wy + 13); ctx.stroke();
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx + 6, wy - 7); ctx.lineTo(cx + 6, wy + 7); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.fillText('+', cx - 6, wy + 28); ctx.fillText('−', cx + 6, wy + 28);
      ctx.fillText('전원', cx, wy - 18);
      // 전자 흐름(움직이는 점): 전원 (−)극 → 환원 전극, 산화 전극 → 전원 (+)극
      var phase = (st.t / Math.max(st.tSet, 1)) * 6 % 1;
      ctx.fillStyle = T.figViolet;
      for (var i = 0; i < 3; i++) {
        var p = (i / 3 + phase) % 1;
        ctx.beginPath(); ctx.arc(cx + 14 + p * (kx + 7 - cx - 14), wy, 3.2, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(ax + 7 + p * (cx - 14 - ax - 7), wy, 3.2, 0, 7); ctx.fill();
      }
      ctx.font = '600 12px ' + T.fontBody; ctx.fillText('e⁻ →', kx + 7 - 0.3 * (kx + 7 - cx), wy - 9); ctx.fillText('e⁻ →', ax + 7 + 0.3 * (cx - ax - 7), wy - 9);
    }
    function drawGraph(T, r) {
      var L = r.x + 54, R = r.x + r.w - 16, Tp = r.y + 28, B = r.y + r.h - 40;
      var ymax = Math.max(mass(1, TMAX), 0.01), step = niceStep(ymax);
      ymax = Math.ceil(ymax / step) * step;
      var sx = function (t) { return L + t / TMAX * (R - L); };
      var sy = function (v) { return B - v / ymax * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('석출 질량 m = ItM / (zF)', L, r.y + 16);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, Tp, R - L, B - Tp);
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right'; ctx.strokeStyle = T.rule;
      for (var v = 0; v <= ymax + 1e-9; v += step) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(v.toFixed(step < 1 ? 1 : 0), L - 4, sy(v) + 4); }
      ctx.textAlign = 'center';
      for (var t = 0; t <= TMAX; t += 30) ctx.fillText(t, sx(t), B + 14);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.fillText('시간 t (분)', (L + R) / 2, B + 30);
      ctx.save(); ctx.translate(r.x + 14, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('m (g)', 0, 0); ctx.restore();
      metals.forEach(function (m, i) {
        var sel = i === st.m;
        ctx.strokeStyle = T[m.col]; ctx.lineWidth = sel ? 3 : 1.4; ctx.globalAlpha = sel ? 1 : 0.55;
        ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(TMAX), sy(mass(i, TMAX))); ctx.stroke();
        ctx.globalAlpha = 1; ctx.fillStyle = T[m.col]; ctx.font = (sel ? '600 ' : '') + '12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillRect(L + 8, Tp + 10 + i * 17, 14, 3);
        ctx.fillText(m.sym + '  M/z = ' + (m.M / m.z).toFixed(1) + ' g/mol', L + 28, Tp + 16 + i * 17);
      });
      // 현재 점
      var mt = mass(st.m, st.t);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figInk; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx(st.t), B); ctx.lineTo(sx(st.t), sy(mt)); ctx.lineTo(L, sy(mt)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(sx(st.t), sy(mt), 5.5, 0, 7); ctx.fill();
    }
    function niceStep(x) { var raw = x / 5, p = Math.pow(10, Math.floor(Math.log10(raw))), q = raw / p; return (q < 1.5 ? 1 : q < 3 ? 2 : q < 7 ? 5 : 10) * p; }
    function draw() {
      var T = api.tokens(), P = layout(), m = metals[st.m];
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawCell(T, P.cell); drawGraph(T, P.gr);
      var Q = st.I * st.t * 60, ne = Q / F;
      rQ.set(Math.round(Q).toLocaleString('ko-KR') + ' C');
      rN.set(ne.toFixed(4) + ' mol');
      rM.set((ne / m.z).toFixed(4) + ' mol ' + m.sym);
      rG.set(mass(st.m, st.t).toFixed(3) + ' g');
      go.disabled = st.run;
    }
    api.onResize(draw);
    draw();
  },
});
