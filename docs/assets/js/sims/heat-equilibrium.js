/* 중1-3 열: 온도가 다른 두 물체가 접촉하면 입자 운동과 온도가 변해 열평형에 이른다 */
Sims.register('heat-equilibrium', {
  title: '뜨거운 물체와 차가운 물체가 만나면 — 열평형',
  caption: '처음 온도와 질량 비를 정하고 \'접촉시키기\'를 눌러 보자. 열은 온도가 높은 물체에서 낮은 물체로 이동하고, 온도 차이가 줄어들수록 천천히 이동하다가 두 온도가 같아지면(열평형) 겉보기에 더 이상 이동하지 않는다. 질량이 큰 물체일수록 온도가 덜 변하므로 열평형 온도는 질량이 큰 물체의 처음 온도에 더 가깝다. 두 물체는 같은 물질이고 열은 두 물체 사이에서만 이동한다고 가정했으며, 입자 움직임의 크기는 차이가 잘 보이도록 과장했다.',
  init: function (api) {
    var RATIOS = [[1, 3], [1, 2], [2, 3], [1, 1], [3, 2], [2, 1], [3, 1]];
    var TMAX = 10, K = 0.65;         // 그래프 시간 축(분), 열이 이동하는 빠르기(단순화)
    var st = { TA0: 80, TB0: 20, ri: 2, t: 0, run: false, phA: 0, phB: 0 };
    var parts = { A: [], B: [] };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.32 : 0.5; }, label: '접촉한 두 물체의 입자 운동과 시간-온도 그래프' });
    var ctx = cv.ctx;

    var rA = api.readout('A의 온도');
    var rB = api.readout('B의 온도');
    var rD = api.readout('온도 차이');
    var rT = api.readout('경과 시간');

    api.slider({ id: 'heat-equilibrium-ta', label: 'A의 처음 온도', min: 0, max: 100, step: 5, value: st.TA0,
      format: function (v) { return v + ' °C'; }, onInput: function (v) { st.TA0 = v; reset(); } });
    api.slider({ id: 'heat-equilibrium-tb', label: 'B의 처음 온도', min: 0, max: 100, step: 5, value: st.TB0,
      format: function (v) { return v + ' °C'; }, onInput: function (v) { st.TB0 = v; reset(); } });
    api.slider({ id: 'heat-equilibrium-ratio', label: '질량 비 A : B', min: 0, max: RATIOS.length - 1, step: 1, value: st.ri,
      format: function (v) { return RATIOS[v][0] + ' : ' + RATIOS[v][1]; }, onInput: function (v) { st.ri = v; makeParticles(); reset(); } });
    var btn = api.button(api.reduced ? '접촉시키기 (2분씩)' : '접촉시키기', function () { toggle(); }, { primary: true });

    function masses() { var r = RATIOS[st.ri], s = r[0] + r[1]; return [4 * r[0] / s, 4 * r[1] / s]; }
    function temps(t) {
      var m = masses(), mA = m[0], mB = m[1];
      var Teq = (mA * st.TA0 + mB * st.TB0) / (mA + mB);
      var f = Math.exp(-K * (1 / mA + 1 / mB) * t);
      return { A: Teq + (st.TA0 - Teq) * f, B: Teq + (st.TB0 - Teq) * f, eq: Teq };
    }
    function makeParticles() {
      var m = masses();
      ['A', 'B'].forEach(function (key, i) {
        var cols = Math.max(2, Math.round(m[i] * 2.5)), arr = [];
        for (var c = 0; c < cols; c++) for (var r = 0; r < 5; r++) arr.push({ c: c, r: r, cols: cols, p1: Math.random() * 6.28, p2: Math.random() * 6.28, w1: 0.8 + Math.random() * 0.6, w2: 0.8 + Math.random() * 0.6 });
        parts[key] = arr;
      });
    }
    function reset() { st.t = 0; st.run = false; btn.textContent = api.reduced ? '접촉시키기 (2분씩)' : '접촉시키기'; readouts(); draw(); }
    function toggle() {
      if (st.t >= TMAX) { st.t = 0; }
      if (api.reduced) {
        st.t = Math.min(TMAX, st.t + 2);
        btn.textContent = st.t >= TMAX ? '처음부터 다시' : '2분 더 진행';
        readouts(); draw(); return;
      }
      st.run = !st.run;
      btn.textContent = st.run ? '일시정지' : (st.t > 0 ? '계속' : '접촉시키기');
      loop.play();
    }
    function readouts() {
      var T = temps(st.t);
      rA.set(T.A.toFixed(1) + ' °C'); rB.set(T.B.toFixed(1) + ' °C');
      var d = Math.abs(T.A - T.B);
      rD.set(st.t === 0 ? d.toFixed(1) + ' °C' : (d < 0.5 ? '거의 0 → 열평형' : d.toFixed(1) + ' °C'));
      rT.set(st.t.toFixed(1) + '분');
    }
    var loop = api.loop(function (dt) {
      if (!(dt > 0)) return;
      var T = temps(st.t);
      st.phA += dt * (1.5 + 7 * T.A / 100);
      st.phB += dt * (1.5 + 7 * T.B / 100);
      if (st.run) {
        st.t = Math.min(TMAX, st.t + dt);        // 화면 1초 = 1분
        if (st.t >= TMAX) { st.run = false; btn.textContent = '처음부터 다시'; }
        readouts();
      }
      draw();
    });

    function mix(c1, c2, f) {
      function rgb(c) { c = c.replace('#', ''); if (c.length === 3) c = c.replace(/./g, '$&$&'); var n = parseInt(c, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
      try { var a = rgb(c1), b = rgb(c2); return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * f); }).join(',') + ')'; } catch (e) { return c1; }
    }
    function arrowH(x1, x2, y, col, lw) {
      var dir = x2 > x1 ? 1 : -1;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2 - dir * 10, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - dir * 12, y - 7); ctx.lineTo(x2 - dir * 12, y + 7); ctx.closePath(); ctx.fill();
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var scene = narrow ? { x: 0, y: 0, w: w, h: h * 0.44 } : { x: 0, y: 0, w: w * 0.44, h: h };
      var graph = narrow ? { x: 0, y: h * 0.47, w: w, h: h * 0.53 } : { x: w * 0.48, y: 0, w: w * 0.52, h: h };
      drawScene(T, scene); drawGraph(T, graph);
    }

    function drawScene(T, r) {
      var tp = temps(st.t), m = masses();
      var contact = st.t > 0 || st.run;
      var gap = contact ? 0 : 18;
      var top = r.y + 52, bh = Math.min(r.h - 104, 150), unit = (r.w - 30 - gap) / 4;
      var wA = unit * m[0], wB = unit * m[1];
      var xA = r.x + 15, xB = xA + wA + gap;
      var blocks = [{ k: 'A', x: xA, w: wA, T: tp.A, ph: st.phA, col: T.figViolet }, { k: 'B', x: xB, w: wB, T: tp.B, ph: st.phB, col: T.figTeal }];
      blocks.forEach(function (b) {
        ctx.fillStyle = T.figPanel; ctx.strokeStyle = b.col; ctx.lineWidth = 2.5;
        ctx.fillRect(b.x, top, b.w, bh); ctx.strokeRect(b.x, top, b.w, bh);
        var arr = parts[b.k], sp = Math.min(b.w / arr[0].cols, bh / 5);
        var amp = sp * (0.06 + 0.22 * b.T / 100), rad = Math.max(3, Math.min(6, sp * 0.24));
        var fill = mix(T.figBlue, T.figRed, b.T / 100);
        arr.forEach(function (q) {
          var cx = b.x + (q.c + 0.5) * (b.w / q.cols), cy = top + (q.r + 0.5) * (bh / 5);
          var dx = amp * Math.sin(b.ph * 6 * q.w1 + q.p1), dy = amp * Math.cos(b.ph * 6 * q.w2 + q.p2);
          if (api.reduced) { dx = amp * Math.sin(q.p1); dy = amp * Math.cos(q.p2); }
          ctx.beginPath(); ctx.arc(cx + dx, cy + dy, rad, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
        });
        ctx.fillStyle = b.col; ctx.font = '700 14px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(b.k, b.x + b.w / 2, top - 26);
        ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontMono;
        ctx.fillText(b.T.toFixed(1) + ' °C', b.x + b.w / 2, top - 9);
      });
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('질량 비 ' + RATIOS[st.ri][0] + ' : ' + RATIOS[st.ri][1] + ' (같은 물질)', r.x + r.w / 2, top + bh + 18);
      // 열의 이동 화살표
      var d = tp.A - tp.B, ax = xA + wA + gap / 2, ay = top + bh + 50;
      ctx.font = '600 13px ' + T.fontBody;
      if (!contact) {
        ctx.fillStyle = T.figMuted; ctx.fillText('접촉 전 — 아직 열이 이동하지 않는다', r.x + r.w / 2, ay + 4);
      } else if (Math.abs(d) < 0.5) {
        ctx.fillStyle = T.figGreen; ctx.fillText('열평형 — 두 물체의 입자 운동이 같아졌다', r.x + r.w / 2, ay + 4);
      } else {
        var len = 16 + 50 * Math.min(1, Math.abs(d) / 60);
        var s = d > 0 ? 1 : -1;
        arrowH(ax - s * len, ax + s * len, ay, T.figRed, 2 + 3 * Math.min(1, Math.abs(d) / 60));
        ctx.fillStyle = T.figRed; ctx.textAlign = 'center';
        ctx.fillText('열', ax, ay - 12);
      }
    }

    function drawGraph(T, r) {
      var L = r.x + 46, R = r.x + r.w - 14, Tp = r.y + 22, B = r.y + r.h - 40;
      var sx = function (t) { return L + t / TMAX * (R - L); }, sy = function (v) { return B - v / 100 * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var v = 0; v <= 100; v += 20) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(v, L - 6, sy(v) + 4); }
      ctx.textAlign = 'center';
      for (var t = 0; t <= TMAX; t += 2) ctx.fillText(t, sx(t), B + 15);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('시간 (분)', (L + R) / 2, B + 32);
      ctx.save(); ctx.translate(r.x + 11, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('온도 (°C)', 0, 0); ctx.restore();
      var tp = temps(st.t);
      [['A', T.figViolet], ['B', T.figTeal]].forEach(function (o) {
        ctx.strokeStyle = o[1]; ctx.lineWidth = 2.6; ctx.beginPath();
        var n = 120;
        for (var i = 0; i <= n; i++) { var tt = st.t * i / n, y = temps(tt)[o[0]]; if (i === 0) ctx.moveTo(sx(tt), sy(y)); else ctx.lineTo(sx(tt), sy(y)); }
        ctx.stroke();
        ctx.beginPath(); ctx.arc(sx(st.t), sy(tp[o[0]]), 4.5, 0, Math.PI * 2); ctx.fillStyle = o[1]; ctx.fill();
      });
      // 이름표
      ctx.font = '700 13px ' + T.fontBody; ctx.textAlign = 'left';
      var la = sy(tp.A), lb = sy(tp.B);
      if (Math.abs(la - lb) < 16) { if (tp.A >= tp.B) { la -= 8; lb += 8; } else { la += 8; lb -= 8; } }
      var lx = Math.min(sx(st.t) + 8, R - 14);
      if (Math.abs(tp.A - tp.B) >= 0.5) {
        ctx.fillStyle = T.figViolet; ctx.fillText('A', lx, la + 4);
        ctx.fillStyle = T.figTeal; ctx.fillText('B', lx, lb + 4);
      }
      if (st.t > 0 && Math.abs(tp.A - tp.B) < 0.5) {
        var te = 0; while (te < TMAX && Math.abs(temps(te).A - temps(te).B) >= 0.5) te += 0.05;
        ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figGreen; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(sx(te), Tp); ctx.lineTo(sx(te), B); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figGreen; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        var lab = '열평형 ' + tp.eq.toFixed(1) + ' °C';
        var tx = Math.min(sx(te) + 6, R - ctx.measureText(lab).width);
        var ty = tp.eq > 80 ? sy(tp.eq) + 20 : sy(tp.eq) - 10;
        ctx.fillText(lab, tx, ty);
      }
      if (st.t === 0) {
        ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('접촉시키면 두 온도가 어떻게 변할까?', (L + R) / 2, Tp + 14);
      }
    }

    makeParticles();
    api.onResize(draw);
    readouts(); draw();
    if (api.reduced) loop.pause();
  },
});
