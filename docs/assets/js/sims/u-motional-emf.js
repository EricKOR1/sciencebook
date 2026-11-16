/* 일반물리학 10 운동 기전력: 수직 레일을 떨어지는 막대의 자기 제동과 종단 속도 (예제 3) */
Sims.register('u-motional-emf', {
  title: '수직 레일을 떨어지는 막대 — 운동 기전력과 종단 속도',
  caption: '‘놓기’를 누르면 막대가 정지 상태에서 떨어진다. 속력이 커질수록 기전력 BLv와 전류가 커지고, 위로 받는 자기력 B²L²v/R가 커져 결국 중력과 같아진다(종단 속도 v_t = mgR/B²L²). B·R·m을 바꾸어 v(t) = v_t(1 − e^(−t/τ)), τ = mR/B²L²가 어떻게 달라지는지 확인하고, 종단 속도에서 중력의 일률 mgv와 저항의 열 발생률 I²R가 같아지는 것을 보자. 레일 간격 L = 0.25 m, 마찰·공기 저항·회로의 자체 인덕턴스는 무시했고, 애니메이션은 τ에 맞춰 시간을 늘이거나 줄여 보여 준다.',
  init: function (api) {
    var LEN = 0.25, G = 9.8;
    var s = { B: 0.8, R: 0.5, m: 0.020, t: 0, v: 0, y: 0, running: false, done: false, hist: [] };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.5; }, label: '수직 레일 위 막대와 속력-시간 그래프' });
    var ctx = cv.ctx;

    var rV = api.readout('속력 v');
    var rE = api.readout('기전력 · 전류');
    var rF = api.readout('자기력 / 중력');
    var rT = api.readout('v_t · τ');
    var rPw = api.readout('mgv / I²R');

    api.slider({ id: 'u-motional-emf-b', label: '자기장 B', min: 0.4, max: 1.2, step: 0.05, value: 0.8,
      format: function (v) { return v.toFixed(2) + ' T'; }, onInput: function (v) { s.B = v; reset(); } });
    api.slider({ id: 'u-motional-emf-r', label: '회로 저항 R', min: 0.2, max: 1.0, step: 0.05, value: 0.5,
      format: function (v) { return v.toFixed(2) + ' Ω'; }, onInput: function (v) { s.R = v; reset(); } });
    api.slider({ id: 'u-motional-emf-m', label: '막대 질량 m', min: 10, max: 40, step: 1, value: 20,
      format: function (v) { return v + ' g'; }, onInput: function (v) { s.m = v / 1000; reset(); } });
    var g = api.group();
    api.button('놓기', function () { start(); }, { primary: true, parent: g });
    api.button('처음으로', function () { reset(); }, { parent: g });

    function k() { return s.B * s.B * LEN * LEN / s.R; }
    function vt() { return s.m * G / k(); }
    function tau() { return s.m / k(); }
    function tEnd() { return 5 * tau(); }
    function reset() { s.t = 0; s.v = 0; s.y = 0; s.running = false; s.done = false; s.hist = []; loop.pause(); readouts(); draw(); }
    function start() {
      reset();
      if (api.reduced) {
        // 움직임 줄이기: 해석해로 끝까지 바로 그린다
        var n = 120;
        for (var i = 0; i <= n; i++) { var t = tEnd() * i / n; s.hist.push([t, vt() * (1 - Math.exp(-t / tau()))]); }
        s.t = tEnd(); s.v = vt() * (1 - Math.exp(-5)); s.done = true; readouts(); draw(); return;
      }
      s.running = true; s.hist.push([0, 0]); loop.play();
    }
    var loop = api.loop(function (dt) {
      if (!s.running) return;
      var rate = tEnd() / 4;            // 화면 4초 동안 5τ를 보여 준다
      var h = dt * rate, steps = 20;
      for (var i = 0; i < steps; i++) {
        var a = G - k() * s.v / s.m;
        s.v += a * h / steps; s.y += s.v * h / steps; s.t += h / steps;
      }
      s.hist.push([s.t, s.v]);
      if (s.t >= tEnd()) { s.running = false; s.done = true; loop.pause(); }
      readouts(); draw();
    });
    loop.pause();

    function readouts() {
      var emf = s.B * LEN * s.v, I = emf / s.R, Fm = I * LEN * s.B, W = s.m * G;
      rV.set(s.v.toFixed(2) + ' m/s');
      rE.set(emf.toFixed(2) + ' V · ' + I.toFixed(2) + ' A');
      rF.set(Fm.toFixed(3) + ' N / ' + W.toFixed(3) + ' N');
      rT.set(vt().toFixed(2) + ' m/s · ' + tau().toFixed(2) + ' s');
      rPw.set((W * s.v).toFixed(2) + ' W / ' + (I * I * s.R).toFixed(2) + ' W');
    }
    function layout() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { sc: { x: 0, y: 0, w: w, h: h * 0.5 }, gr: { x: 0, y: h * 0.52, w: w, h: h * 0.48 } }
        : { sc: { x: 0, y: 0, w: w * 0.4, h: h }, gr: { x: w * 0.42, y: 0, w: w * 0.58, h: h } };
    }
    function draw() {
      var T = api.tokens(), P = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawScene(T, P.sc); drawGraph(T, P.gr);
    }
    function arrowV(x, y1, y2, col, lw) {
      var d = y2 > y1 ? 1 : -1;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2 - d * 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y2); ctx.lineTo(x - 5, y2 - d * 9); ctx.lineTo(x + 5, y2 - d * 9); ctx.closePath(); ctx.fill();
    }
    function drawScene(T, r) {
      var cx = r.x + r.w / 2, half = Math.min(r.w * 0.32, 90);
      var xl = cx - half, xr = cx + half;
      var topY = r.y + 34, botY = r.y + r.h - 26;
      // 자기장 표시 (종이에 들어가는 방향 ⊗)
      ctx.strokeStyle = T.figTeal; ctx.lineWidth = 1.2;
      var sp = 26, off = (s.y * 60) % sp;      // 레일을 따라 장면이 위로 흐르는 느낌
      for (var yy = topY + 30 - off; yy < botY; yy += sp) {
        for (var xx = xl - 2 * sp + 13; xx < xr + 2 * sp; xx += sp) {
          if (xx < r.x + 8 || xx > r.x + r.w - 8 || yy < topY + 24) continue;
          ctx.beginPath(); ctx.arc(xx, yy, 5, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(xx - 3.2, yy - 3.2); ctx.lineTo(xx + 3.2, yy + 3.2); ctx.moveTo(xx + 3.2, yy - 3.2); ctx.lineTo(xx - 3.2, yy + 3.2); ctx.stroke();
        }
      }
      // 저항(위)
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(xl, botY); ctx.lineTo(xl, topY); ctx.lineTo(cx - 24, topY);
      for (var i = 0; i < 6; i++) ctx.lineTo(cx - 24 + 8 * i + 4, topY + (i % 2 ? 6 : -6));
      ctx.lineTo(cx + 24, topY); ctx.lineTo(xr, topY); ctx.lineTo(xr, botY); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('R', cx, topY - 10);
      // 레일 눈금(움직임이 보이도록)
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      var off2 = (s.y * 120) % 18;
      for (var ty = topY + 20 - off2; ty < botY; ty += 18) {
        if (ty < topY + 14) continue;
        ctx.beginPath(); ctx.moveTo(xl - 6, ty); ctx.lineTo(xl, ty); ctx.moveTo(xr, ty); ctx.lineTo(xr + 6, ty); ctx.stroke();
      }
      // 막대(화면에서는 가운데쯤에 두고 레일이 흐르게 보인다)
      var rodY = topY + (botY - topY) * (s.t === 0 ? 0.35 : 0.6);
      ctx.fillStyle = T.figAmber; ctx.fillRect(xl - 8, rodY - 5, 2 * half + 16, 10);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.strokeRect(xl - 8, rodY - 5, 2 * half + 16, 10);
      // 전류 방향(시계 반대 방향: 막대에서 오른쪽, 오른쪽 레일 위로, 저항을 지나 왼쪽 레일 아래로)
      var I = s.B * LEN * s.v / s.R;
      if (I > 0.01) {
        ctx.fillStyle = T.figRed; ctx.strokeStyle = T.figRed; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - 20, rodY + 18); ctx.lineTo(cx + 20, rodY + 18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 26, rodY + 18); ctx.lineTo(cx + 17, rodY + 13); ctx.lineTo(cx + 17, rodY + 23); ctx.closePath(); ctx.fill();
        ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('I', cx, rodY + 34);
        arrowV(xr + 14, rodY - 10, rodY - 46, T.figRed, 2);
        arrowV(xl - 14, topY + 30, topY + 66, T.figRed, 2);
      }
      // 힘 화살표: 중력(아래), 자기력(위)
      var W = s.m * G, Fm = I * LEN * s.B, fk = 60 / (0.04 * G);
      var fx = cx + half * 0.55;
      arrowV(fx, rodY + 6, rodY + 6 + W * fk, T.figBlue, 3);
      if (Fm * fk > 3) arrowV(fx - 18, rodY - 6, rodY - 6 - Fm * fk, T.figGreen, 3);
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figBlue; ctx.fillText('mg', fx + 6, rodY + 6 + W * fk);
      if (Fm * fk > 3) { ctx.fillStyle = T.figGreen; ctx.textAlign = 'right'; ctx.fillText('ILB', fx - 24, rodY - 2 - Fm * fk + 10); }
      ctx.fillStyle = T.figTeal; ctx.textAlign = 'center'; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('⊗ 자기장 B (종이에 들어가는 방향)', cx, r.y + r.h - 8);
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
      ctx.fillText('L = 0.25 m', cx, rodY - 12);
    }
    function drawGraph(T, r) {
      var L = r.x + 48, R = r.x + r.w - 14, Tp = r.y + 26, B = r.y + r.h - 40;
      var te = tEnd(), vmax = 40;
      var top = vt() * 1.25; top = top < 5 ? Math.ceil(top) : Math.ceil(top / 5) * 5; if (top > vmax) top = vmax;
      var sx = function (t) { return L + t / te * (R - L); }, sy = function (v) { return B - v / top * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('속력–시간 그래프', r.x + 8, r.y + 16);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'center';
      for (var i = 0; i <= 5; i++) {
        ctx.beginPath(); ctx.moveTo(sx(i * tau()), Tp); ctx.lineTo(sx(i * tau()), B); ctx.stroke();
        ctx.fillText(i === 0 ? '0' : i + 'τ', sx(i * tau()), B + 14);
      }
      ctx.textAlign = 'right';
      for (var j = 0; j <= 4; j++) { var v = top * j / 4; ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(v.toFixed(top < 8 ? 1 : 0), L - 5, sy(v) + 4); }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('시간 (τ = ' + tau().toFixed(2) + ' s)', (L + R) / 2, B + 30);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('속력 v (m/s)', 0, 0); ctx.restore();
      // 종단 속도 선과 63% 표시
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(L, sy(vt())); ctx.lineTo(R, sy(vt())); ctx.stroke();
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx(tau()), sy(0.632 * vt())); ctx.lineTo(L, sy(0.632 * vt())); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = T.figRed; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('종단 속도 v_t = ' + vt().toFixed(2) + ' m/s', R, sy(vt()) - 5);
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
      ctx.fillText('63%', L + 3, sy(0.632 * vt()) - 4);
      // 자유 낙하(자기장 없을 때) 비교선
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.2; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); var tf = Math.min(te, top / G); ctx.lineTo(sx(tf), sy(G * tf)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
      ctx.fillText('자유 낙하', sx(tf * 0.5) + 6, sy(G * tf * 0.5) + 2);
      // 해석해(옅게)와 진행 곡선
      ctx.strokeStyle = T.figSoftBlue; ctx.lineWidth = 6; ctx.beginPath();
      for (var n = 0; n <= 100; n++) { var t = te * n / 100, y = sy(vt() * (1 - Math.exp(-t / tau()))); if (n === 0) ctx.moveTo(sx(t), y); else ctx.lineTo(sx(t), y); }
      ctx.stroke();
      if (s.hist.length > 1) {
        ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.4; ctx.beginPath();
        s.hist.forEach(function (p, i) { if (i === 0) ctx.moveTo(sx(p[0]), sy(p[1])); else ctx.lineTo(sx(p[0]), sy(p[1])); });
        ctx.stroke();
        var last = s.hist[s.hist.length - 1];
        ctx.fillStyle = T.figAccent; ctx.beginPath(); ctx.arc(sx(last[0]), sy(last[1]), 4.5, 0, Math.PI * 2); ctx.fill();
      }
      if (!s.running && !s.done) {
        ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('굵은 옅은 선: 예상 v(t) — ‘놓기’를 눌러 확인', L + 8, B - 10);
      }
    }
    api.onResize(draw);
    readouts(); draw();
  },
});
