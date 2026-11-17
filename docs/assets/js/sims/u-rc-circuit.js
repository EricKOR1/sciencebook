/* 일반물리학 9 전류·회로와 자기장: RC 회로의 충전과 방전 — q(t), I(t), 시간 상수 τ = RC, 에너지의 행방 */
Sims.register('u-rc-circuit', {
  title: 'RC 회로의 충전과 방전 — 시간 상수 τ = RC',
  caption: '저항 R, 전기 용량 C, 기전력 ε를 정하고 「충전」 또는 「방전」을 눌러 보자(실제 시간으로 진행). 전하 q(t)는 τ = RC마다 남은 차이의 63 %씩 다가가고, 전류 I(t)는 처음 ε/R에서 지수적으로 준다. R이나 C를 키우면 곡선이 느려지고, 점선은 바로 전 실험의 곡선이다. 충전이 끝나면 전지가 한 일 Cε²의 정확히 절반은 축전기에, 절반은 저항의 열로 간다(R과 무관). 도선·전지의 내부 저항은 R에 포함했다고 보았다.',
  init: function (api) {
    var TMAX = 10;
    var st = { R: 10, C: 100, emf: 9, mode: 'charge', t: 0, q0: 0, ghost: null, running: false };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.45 : 0.5; }, label: 'RC 회로도와 전하·전류의 시간 그래프' });
    var ctx = cv.ctx;

    var rTau = api.readout('시간 상수 τ = RC');
    var rT = api.readout('시간 t');
    var rQ = api.readout('전하 q');
    var rI = api.readout('전류 I');
    var rU = api.readout('축전기 에너지 / 저항의 열');

    api.slider({ id: 'u-rc-circuit-r', label: '저항 R', min: 1, max: 20, step: 0.5, value: st.R,
      format: function (v) { return v + ' kΩ'; }, onInput: function (v) { st.R = v; reset(); } });
    api.slider({ id: 'u-rc-circuit-c', label: '전기 용량 C', min: 20, max: 500, step: 10, value: st.C,
      format: function (v) { return v + ' μF'; }, onInput: function (v) { st.C = v; reset(); } });
    api.slider({ id: 'u-rc-circuit-e', label: '기전력 ε', min: 1, max: 12, step: 0.5, value: st.emf,
      format: function (v) { return v + ' V'; }, onInput: function (v) { st.emf = v; reset(); } });
    var g = api.group();
    api.button('충전', function () { start('charge'); }, { primary: true, parent: g });
    api.button('방전', function () { start('discharge'); }, { parent: g });

    function tau() { return st.R * 1e3 * st.C * 1e-6; }
    function qf() { return st.C * 1e-6 * st.emf; }
    // 지금 실험(mode, q0)에서 시각 t의 q, I
    function qAt(t) { var e = Math.exp(-t / tau()); return st.mode === 'charge' ? qf() + (st.q0 - qf()) * e : st.q0 * e; }
    function iAt(t) { var e = Math.exp(-t / tau()); return st.mode === 'charge' ? (qf() - st.q0) / tau() * e : -st.q0 / tau() * e; }
    function reset() { st.running = false; loop.pause(); st.t = 0; st.q0 = st.mode === 'charge' ? 0 : qf(); draw(); }
    function start(mode) {
      if (st.t > 0) st.ghost = { mode: st.mode, tau: tau(), qf: qf(), q0: st.q0, R: st.R * 1e3, emf: st.emf, C: st.C * 1e-6 };
      var qNow = st.t > 0 ? qAt(st.t) : (mode === 'charge' ? 0 : qf());
      if (mode === 'charge' && st.mode === 'charge' && st.t >= TMAX) qNow = 0; // 다시 충전하면 빈 축전기부터
      if (mode === 'discharge' && qNow < qf() * 0.05) qNow = qf();             // 비어 있으면 가득 찬 상태에서 방전
      st.mode = mode; st.q0 = qNow; st.t = 0;
      if (api.reduced) { st.t = TMAX; draw(); return; }
      st.running = true; loop.play();
    }
    var loop = api.loop(function (dt) {
      st.t = Math.min(TMAX, st.t + dt);
      if (st.t >= TMAX) { st.running = false; loop.pause(); }
      draw();
    });
    loop.pause();

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { c: { x: 0, y: 0, w: w, h: h * 0.3 }, q: { x: 0, y: h * 0.31, w: w, h: h * 0.345 }, i: { x: 0, y: h * 0.655, w: w, h: h * 0.345 } };
      return { c: { x: 0, y: 0, w: w * 0.32, h: h }, q: { x: w * 0.34, y: 0, w: w * 0.66, h: h * 0.5 }, i: { x: w * 0.34, y: h * 0.5, w: w * 0.66, h: h * 0.5 } };
    }
    function draw() {
      var T = api.tokens(), Lo = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      circuit(T, Lo.c);
      var qScale = niceMax(Math.max(qf(), st.ghost ? st.ghost.qf : 0) * 1.1);
      graph(T, Lo.q, '전하 q (mC)', 0, qScale, 1e3, function (t, m) { return m.q(t); }, T.figAccent, true);
      var imax = niceMax(Math.max(st.emf / (st.R * 1e3), st.ghost ? st.ghost.emf / st.ghost.R : 0) * 1.1);
      graph(T, Lo.i, '전류 I (mA)', -imax, imax, 1e3, function (t, m) { return m.i(t); }, T.figRed, false);
      var q = qAt(st.t), I = iAt(st.t), C = st.C * 1e-6;
      rTau.set(tau().toFixed(2) + ' s'); rT.set(st.t.toFixed(2) + ' s (' + (st.t / tau()).toFixed(1) + 'τ)');
      rQ.set((q * 1e3).toFixed(3) + ' mC (' + (q / qf() * 100).toFixed(0) + ' %)');
      rI.set((I * 1e3).toFixed(3) + ' mA');
      var Uc = q * q / (2 * C), heat;
      if (st.mode === 'charge') { var Wb = st.emf * (q - st.q0); heat = Wb - (Uc - st.q0 * st.q0 / (2 * C)); }
      else heat = st.q0 * st.q0 / (2 * C) - Uc;
      rU.set((Uc * 1e3).toFixed(2) + ' mJ / ' + (heat * 1e3).toFixed(2) + ' mJ');
    }
    function niceMax(v) { var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
    function model(gh) {
      if (!gh) return { q: qAt, i: iAt, tau: tau() };
      return { tau: gh.tau,
        q: function (t) { var e = Math.exp(-t / gh.tau); return gh.mode === 'charge' ? gh.qf + (gh.q0 - gh.qf) * e : gh.q0 * e; },
        i: function (t) { var e = Math.exp(-t / gh.tau); return gh.mode === 'charge' ? (gh.qf - gh.q0) / gh.tau * e : -gh.q0 / gh.tau * e; } };
    }
    function graph(T, b, ylab, ymin, ymax, k, fn, col, isQ) {
      var L = b.x + 52, R = b.x + b.w - 10, Tp = b.y + 22, B = b.y + b.h - 28;
      var sx = function (t) { return L + t / TMAX * (R - L); }, sy = function (v) { return B - (v - ymin) / (ymax - ymin) * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      for (var t = 0; t <= TMAX; t += 2) { ctx.beginPath(); ctx.moveTo(sx(t), Tp); ctx.lineTo(sx(t), B); ctx.stroke(); ctx.fillText(t, sx(t), B + 13); }
      ctx.textAlign = 'right';
      var ticks = ymin < 0 ? [ymin, ymin / 2, 0, ymax / 2, ymax] : [0, ymax / 2, ymax];
      ticks.forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(+(v * k).toPrecision(3), L - 5, sy(v) + 4); });
      ctx.strokeStyle = T.figMuted; ctx.beginPath(); ctx.moveTo(L, sy(0)); ctx.lineTo(R, sy(0)); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText(ylab, b.x + 6, b.y + 13);
      ctx.textAlign = 'right'; if (!isQ || cv.w < 560) ctx.fillText('t (s)', R, B + 26);
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp - 2, R - L, B - Tp + 4); ctx.clip();
      if (st.ghost) curve(model(st.ghost), TMAX, T.figLine, [5, 4], 1.4);
      var m = model(null), done = st.t > 0 || !st.running ? st.t : 0;
      if (st.t === 0 && !st.running) curve(m, TMAX, T.figLine, [2, 4], 1.2);
      curve(m, done, col, [], 2.6);
      ctx.restore();
      function curve(md, tEnd, c2, dash, lw) {
        if (tEnd <= 0) return;
        ctx.beginPath();
        for (var j = 0; j <= 200; j++) { var tt = tEnd * j / 200, y = sy(fn(tt, md)); if (j) ctx.lineTo(sx(tt), y); else ctx.moveTo(sx(tt), y); }
        ctx.strokeStyle = c2; ctx.setLineDash(dash); ctx.lineWidth = lw; ctx.stroke(); ctx.setLineDash([]);
      }
      // τ 표시
      var ta = tau();
      if (ta <= TMAX) {
        ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figGreen; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(sx(ta), Tp); ctx.lineTo(sx(ta), B); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figGreen; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('τ', sx(ta) + 3, Tp + 10);
        if (isQ) {
          var lv = st.mode === 'charge' ? st.q0 + (qf() - st.q0) * 0.632 : st.q0 * 0.368;
          if (st.t >= ta) { ctx.beginPath(); ctx.arc(sx(ta), sy(lv), 4, 0, 7); ctx.fill(); ctx.fillText(st.mode === 'charge' ? '63 %' : '37 %', sx(ta) + 6, sy(lv) + (st.mode === 'charge' ? 14 : -6)); }
        }
      }
      if (st.t > 0) { ctx.beginPath(); ctx.arc(sx(st.t), sy(fn(st.t, model(null))), 5, 0, 7); ctx.fillStyle = col; ctx.fill(); }
      if (isQ) { ctx.setLineDash([2, 3]); ctx.strokeStyle = T.figAccent; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L, sy(qf())); ctx.lineTo(R, sy(qf())); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figAccent; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText('Cε', R - 2, sy(qf()) - 4); }
    }
    function circuit(T, b) {
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2, W = Math.min(b.w - 40, 190), H = Math.min(b.h - 50, 150);
      var x0 = cx - W / 2, x1 = cx + W / 2, y0 = cy - H / 2 + 6, y1 = cy + H / 2 + 6;
      var charging = st.mode === 'charge';
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.fillStyle = T.figInk;
      // 왼쪽: 전지(충전 때만 연결) / 방전 때는 도선
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + W * 0.3, y0); ctx.stroke();           // 위 도선 왼쪽 → 스위치
      // 스위치: 왼쪽 위에서 회로를 고름
      // 저항(위 가운데)
      var rx0 = cx - 26, rx1 = cx + 26;
      ctx.beginPath(); ctx.moveTo(x0 + W * 0.3 + 18, y0); ctx.lineTo(rx0, y0);
      for (var i = 0; i < 6; i++) ctx.lineTo(rx0 + (i + 0.5) * 52 / 6, y0 + (i % 2 ? 7 : -7));
      ctx.lineTo(rx1, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, cy - 4); ctx.stroke();
      // 축전기(오른쪽)
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x1 - 14, cy - 4); ctx.lineTo(x1 + 14, cy - 4); ctx.moveTo(x1 - 14, cy + 6); ctx.lineTo(x1 + 14, cy + 6); ctx.stroke();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, cy + 6); ctx.lineTo(x1, y1); ctx.lineTo(x0, y1); ctx.stroke();
      // 왼쪽 두 가지: 전지 가지(x0) / 방전 가지(x0 + W*0.3, 도선)
      ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, cy + 8); ctx.moveTo(x0, cy - 2); ctx.lineTo(x0, y0); ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 - 13, cy - 2); ctx.lineTo(x0 + 13, cy - 2); ctx.stroke();
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0 - 6, cy + 8); ctx.lineTo(x0 + 6, cy + 8); ctx.stroke();
      var xb = x0 + W * 0.3;
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xb, y1); ctx.lineTo(xb, y0 + 22); ctx.stroke();
      // 스위치 날
      ctx.lineWidth = 2.5; ctx.strokeStyle = T.figAmber; ctx.beginPath();
      ctx.moveTo(x0 + W * 0.3 + 18, y0);
      if (charging) ctx.lineTo(x0 + W * 0.3 - 2, y0 - 2); else ctx.lineTo(xb, y0 + 22);
      ctx.stroke();
      [[x0 + W * 0.3 + 18, y0], [x0 + W * 0.3, y0], [xb, y0 + 22]].forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, 7); ctx.fillStyle = T.figInk; ctx.fill(); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('R', cx, y0 - 12);
      ctx.textAlign = 'left'; ctx.fillText('C', x1 + 18, cy + 5);
      ctx.textAlign = 'right'; ctx.fillText('ε', x0 - 16, cy + 5);
      ctx.fillStyle = T.figRed; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('+', x0 + 15, cy - 6);
      // 축전기 전하 표시
      var frac = Math.max(0, Math.min(1, qAt(st.t) / qf()));
      ctx.fillStyle = T.figRed; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center';
      var nPlus = Math.round(frac * 4);
      for (var k = 0; k < nPlus; k++) { ctx.fillStyle = T.figRed; ctx.fillText('+', x1 - 9 + k * 6, cy - 9); ctx.fillStyle = T.figBlue; ctx.fillText('−', x1 - 9 + k * 6, cy + 19); }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(charging ? '스위치: 전지 쪽(충전)' : '스위치: 도선 쪽(방전)', cx, y1 + 20);
      // 전류 방향 화살표
      var I = iAt(st.t);
      if (Math.abs(I) > 1e-3 * st.emf / (st.R * 1e3) && (st.t > 0)) {
        var dir = I > 0 ? -1 : 1, ax = cx, ay = y1;
        ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.moveTo(ax - dir * 8, ay - 6); ctx.lineTo(ax + dir * 6, ay); ctx.lineTo(ax - dir * 8, ay + 6); ctx.closePath(); ctx.fill();
      }
    }
    api.onResize(draw);
    reset();
  },
});
