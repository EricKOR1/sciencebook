/* 중1-5 힘의 작용: 한 직선 위 두 힘의 합력(알짜힘)과 운동 상태의 변화(정지 유지·빨라짐·느려짐) */
Sims.register('force-balance', {
  title: '양쪽에서 당기는 힘과 알짜힘 — 물체는 어떻게 움직일까?',
  caption: '양쪽 힘의 크기를 바꾼 뒤 ‘출발’을 눌러 보자. 두 힘이 같으면 알짜힘이 0이어서 정지한 물체는 계속 정지하고, 움직이던 물체는 같은 빠르기로 계속 간다. 알짜힘이 운동 방향과 같으면 빨라지고, 반대면 느려지다가 멈춘 뒤 반대쪽으로 움직인다. 마찰과 공기 저항이 없는 바닥이라고 가정했고, 아래 줄의 점은 0.5초마다 찍은 물체의 위치이다(간격이 넓을수록 빠르다).',
  init: function (api) {
    var K = 0.08, V0 = 1.0, XMAX = 6, TEND = 8, STROBE = 0.5;
    var st = { FL: 3, FR: 5, moving: false, t: 0, x: 0, v: 0, trail: [], hist: [], running: false, done: false };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.56; }, label: '두 힘과 알짜힘의 화살표, 속력 그래프, 물체의 운동' });
    var ctx = cv.ctx;
    var rNet = api.readout('알짜힘');
    var rState = api.readout('운동 상태');
    var rV = api.readout('속력');

    api.slider({ id: 'force-balance-left', label: '왼쪽으로 당기는 힘', min: 0, max: 10, step: 1, value: st.FL,
      format: function (v) { return v + ' N'; }, onInput: function (v) { st.FL = v; changed(); } });
    api.slider({ id: 'force-balance-right', label: '오른쪽으로 당기는 힘', min: 0, max: 10, step: 1, value: st.FR,
      format: function (v) { return v + ' N'; }, onInput: function (v) { st.FR = v; changed(); } });
    var g = api.group();
    var bRest = api.button('정지해 있던 물체', function () { st.moving = false; sync(); reset(); }, { toggle: true, pressed: true, parent: g });
    var bMove = api.button('오른쪽으로 움직이던 물체', function () { st.moving = true; sync(); reset(); }, { toggle: true, parent: g });
    api.button('출발', function () { start(); }, { primary: true });

    function sync() { bRest.setAttribute('aria-pressed', st.moving ? 'false' : 'true'); bMove.setAttribute('aria-pressed', st.moving ? 'true' : 'false'); }
    function net() { return st.FR - st.FL; }
    function reset() {
      loop.pause(); st.running = false; st.done = false; st.t = 0;
      st.x = st.moving ? -3 : 0; st.v = st.moving ? V0 : 0;
      st.trail = [{ x: st.x, v: st.v }]; st.hist = [{ t: 0, v: st.v }];
      draw();
    }
    function changed() { if (!st.running) reset(); else draw(); }
    function start() {
      reset();
      if (api.reduced) { while (!st.done) step(1 / 60); draw(); return; }
      st.running = true; loop.play();
    }
    function step(h) {
      var a = K * net();
      var t0 = st.t;
      st.v += a * h; st.x += st.v * h; st.t += h;
      if (Math.abs(st.v) < 1e-9) st.v = 0;
      if (Math.floor(st.t / STROBE + 1e-9) > Math.floor(t0 / STROBE + 1e-9)) st.trail.push({ x: st.x, v: st.v });
      st.hist.push({ t: st.t, v: st.v });
      if (st.t >= TEND - 1e-9 || Math.abs(st.x) >= XMAX - 0.5) {
        st.x = Math.max(-XMAX + 0.5, Math.min(XMAX - 0.5, st.x));
        st.done = true; st.running = false;
      }
    }
    var loop = api.loop(function (dt) {
      if (!st.running) { loop.pause(); return; }
      var n = Math.max(1, Math.round(dt / (1 / 120)));
      for (var i = 0; i < n && st.running; i++) step(dt / n);
      if (!st.running) loop.pause();
      draw();
    });
    loop.pause();

    function stateText() {
      var F = net(), v = st.v;
      if (st.t === 0 && !st.running) {
        if (F === 0) return st.moving ? '같은 빠르기로 계속 운동할 것' : '계속 정지해 있을 것';
        if (!st.moving) return (F > 0 ? '오른쪽' : '왼쪽') + '으로 움직이기 시작할 것';
        return F > 0 ? '점점 빨라질 것' : '점점 느려질 것';
      }
      if (F === 0) return v === 0 ? '정지 상태 유지' : '같은 빠르기로 운동(운동 상태 유지)';
      if (Math.abs(v) < 0.02) return '멈춤 → 방향이 바뀐다';
      var dirTxt = v > 0 ? '오른쪽' : '왼쪽';
      return (v * F > 0 ? '빨라짐' : '느려짐') + ' (' + dirTxt + '으로 운동 중)';
    }
    function readouts() {
      var F = net();
      rNet.set(F === 0 ? '0 N (힘의 평형)' : (F > 0 ? '오른쪽 ' : '왼쪽 ') + Math.abs(F) + ' N');
      rState.set((st.t === 0 && !st.running ? '예상: ' : '') + stateText());
      rV.set(Math.abs(st.v).toFixed(2) + ' m/s');
    }

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { force: { x: 0, y: 0, w: w, h: h * 0.36 }, graph: { x: 0, y: h * 0.37, w: w, h: h * 0.33 }, track: { x: 0, y: h * 0.72, w: w, h: h * 0.28 } };
      return { force: { x: 0, y: 0, w: w * 0.56, h: h * 0.6 }, graph: { x: w * 0.6, y: 0, w: w * 0.4, h: h * 0.6 }, track: { x: 0, y: h * 0.64, w: w, h: h * 0.36 } };
    }
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawForces(T, L.force); drawGraph(T, L.graph); drawTrack(T, L.track);
      readouts();
    }
    function arrow(x1, y, x2, color, lw, label, labelBelow) {
      if (Math.abs(x2 - x1) < 1) return;
      var s = x2 > x1 ? 1 : -1, hd = Math.min(12, Math.abs(x2 - x1));
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2 - s * hd, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - s * hd, y - 6); ctx.lineTo(x2 - s * hd, y + 6); ctx.closePath(); ctx.fill();
    }
    function drawForces(T, r) {
      var cx = r.x + r.w / 2, bw = Math.min(70, r.w * 0.16), bh = bw * 0.7;
      var unit = (r.w / 2 - bw / 2 - 14) / 10;    // 1 N 당 화살표 길이
      var by = r.y + 34;
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('물체에 작용하는 힘', r.x + 4, r.y + 16);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('눈금 1칸 = 1 N', r.x + r.w - 4, r.y + 16);
      // 눈금
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      for (var i = -10; i <= 10; i++) {
        var gx = i < 0 ? cx - bw / 2 + i * unit : i > 0 ? cx + bw / 2 + i * unit : null;
        if (gx === null) continue;
        ctx.beginPath(); ctx.moveTo(gx, by - 4); ctx.lineTo(gx, by + bh + 4); ctx.stroke();
      }
      // 상자
      ctx.fillStyle = T.figSoftAmber; ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2;
      ctx.fillRect(cx - bw / 2, by, bw, bh); ctx.strokeRect(cx - bw / 2, by, bw, bh);
      var ay = by + bh / 2;
      arrow(cx - bw / 2, ay, cx - bw / 2 - st.FL * unit, T.figBlue, 4);
      arrow(cx + bw / 2, ay, cx + bw / 2 + st.FR * unit, T.figRed, 4);
      ctx.font = '600 12px ' + T.fontBody;
      ctx.fillStyle = T.figBlue; ctx.textAlign = 'right'; ctx.fillText(st.FL + ' N', cx - bw / 2 - 4, by - 8);
      ctx.fillStyle = T.figRed; ctx.textAlign = 'left'; ctx.fillText(st.FR + ' N', cx + bw / 2 + 4, by - 8);
      // 알짜힘
      var ny = by + bh + 34, F = net();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.beginPath(); ctx.arc(cx, ny, 4, 0, Math.PI * 2); ctx.fill();
      if (F !== 0) {
        var sgn = F > 0 ? 1 : -1;
        arrow(cx, ny, cx + sgn * (bw / 2 + Math.abs(F) * unit), T.figViolet, 5);
        ctx.fillStyle = T.figViolet; ctx.textAlign = sgn > 0 ? 'left' : 'right';
        ctx.fillText('알짜힘 ' + Math.abs(F) + ' N', cx + sgn * 8, ny + 22);
      } else {
        ctx.fillStyle = T.figViolet; ctx.fillText('알짜힘 0 — 두 힘이 평형', cx, ny + 22);
      }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      if (F !== 0) ctx.fillText('(큰 힘 − 작은 힘, 큰 힘의 방향)', cx, ny + 38);
    }
    function drawGraph(T, r) {
      var L = r.x + 40, R = r.x + r.w - 10, Tp = r.y + 24, B = r.y + r.h - 30, VMAX = 3.5;
      var sx = function (t) { return L + t / TEND * (R - L); }, sy = function (v) { return B - Math.min(v, VMAX) / VMAX * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('속력 (m/s)', r.x + 4, r.y + 14);
      ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right'; ctx.lineWidth = 1;
      [0, 1, 2, 3].forEach(function (v) { ctx.strokeStyle = T.rule; ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillStyle = T.figMuted; ctx.fillText(v, L - 6, sy(v) + 4); });
      ctx.textAlign = 'center';
      [0, 2, 4, 6, 8].forEach(function (t) { ctx.fillText(t, sx(t), B + 14); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('시간 (s)', R, B + 28);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.strokeStyle = T.figGreen; ctx.lineWidth = 2.6; ctx.beginPath();
      st.hist.forEach(function (p, i) { var X = sx(p.t), Y = sy(Math.abs(p.v)); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
      ctx.stroke();
      var last = st.hist[st.hist.length - 1];
      ctx.beginPath(); ctx.arc(sx(last.t), sy(Math.abs(last.v)), 4.5, 0, Math.PI * 2); ctx.fillStyle = T.figPanel; ctx.fill();
      ctx.strokeStyle = T.figGreen; ctx.lineWidth = 2; ctx.stroke();
    }
    function drawTrack(T, r) {
      var L = r.x + 14, R = r.x + r.w - 14, gy = r.y + r.h - 22;
      var sx = function (x) { return L + (x + XMAX) / (2 * XMAX) * (R - L); };
      var bw = Math.max(18, (R - L) / (2 * XMAX) * 0.8), bh = Math.min(bw * 0.7, r.h * 0.4);
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('물체의 운동 (마찰 없는 바닥)', L, r.y + 14);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(L, gy); ctx.lineTo(R, gy); ctx.stroke();
      ctx.lineWidth = 1;
      for (var m = -XMAX; m <= XMAX; m++) { ctx.beginPath(); ctx.moveTo(sx(m), gy); ctx.lineTo(sx(m), gy + (m % 2 === 0 ? 7 : 4)); ctx.stroke(); }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('눈금 간격 1 m', (L + R) / 2, gy + 18);
      // 0.5초마다의 위치: 오른쪽으로 갈 때와 왼쪽으로 갈 때를 다른 줄에 찍는다
      var rowR = gy - bh - 34, rowL = gy - bh - 50;
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figMuted;
      st.trail.forEach(function (p) {
        var yy = p.v < 0 ? rowL : rowR;
        ctx.beginPath(); ctx.arc(sx(p.x), yy, 3.5, 0, Math.PI * 2); ctx.fillStyle = T.figAmber; ctx.fill();
      });
      if (st.trail.length > 1) {
        ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
        ctx.fillText('점: 0.5초마다의 위치', R, r.y + 14);
        if (st.trail.some(function (p) { return p.v < 0; })) { ctx.textAlign = 'left'; ctx.fillText('←', L, rowL + 4); ctx.fillText('→', L, rowR + 4); }
      }
      ctx.fillStyle = T.figSoftAmber; ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2;
      ctx.fillRect(sx(st.x) - bw / 2, gy - bh, bw, bh); ctx.strokeRect(sx(st.x) - bw / 2, gy - bh, bw, bh);
      // 운동 방향·빠르기 화살표
      if (Math.abs(st.v) > 0.02) {
        var len = Math.min(90, 12 + Math.abs(st.v) * 26), x0 = sx(st.x), s = st.v > 0 ? 1 : -1, ay = gy - bh - 10;
        arrow(x0, ay, x0 + s * len, T.figGreen, 3);
        ctx.fillStyle = T.figGreen; ctx.font = '11px ' + T.fontBody; ctx.textAlign = s > 0 ? 'left' : 'right';
        ctx.fillText('운동 방향', x0 + s * (len + 6), ay + 4);
      }
    }

    api.onResize(draw);
    reset();
  },
});
