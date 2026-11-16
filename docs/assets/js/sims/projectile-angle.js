/* 역학과 에너지 1 시공간과 운동: 비스듬히 던진 물체의 운동 — 속력·각도에 따른 궤적과 속도 성분 */
Sims.register('projectile-angle', {
  title: '몇 도로 던져야 가장 멀리 갈까? — 비스듬히 던진 물체의 운동',
  caption: '발사 속력과 각도를 정하고 「던지기」를 눌러 보자. 파란 화살표(수평 속도)는 끝까지 길이가 그대로이고, 빨간 화살표(연직 속도)만 줄었다가 아래로 커진다. 던질 때마다 이전 궤적이 남으므로, 45°에서 가장 멀리 가고 30°와 60°처럼 합이 90°인 두 각은 같은 곳에 떨어짐을 비교할 수 있다. 같은 높이로 떨어지는 경우이고, g = 9.8 m/s², 공기 저항은 무시했다.',
  init: function (api) {
    var G = 9.8, MAXG = 6;
    var state = { v0: 20, th: 30, t: 0, phase: 'rest', ghosts: [{ v0: 20, th: 45 }, { v0: 20, th: 60 }] };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.78 : 0.52; }, label: '포물선 궤적과 속도 성분 화살표' });
    var ctx = cv.ctx;

    var rH = api.readout('최고점 높이 H');
    var rR = api.readout('수평 도달 거리 R');
    var rT = api.readout('체공 시간');
    var rV = api.readout('처음 속도 성분 (수평, 연직)');

    api.slider({ id: 'projectile-angle-v0', label: '발사 속력', min: 5, max: 30, step: 1, value: state.v0,
      format: function (v) { return v + ' m/s'; }, onInput: function (v) { state.v0 = v; rest(); } });
    var thSlider = api.slider({ id: 'projectile-angle-th', label: '발사 각도', min: 5, max: 85, step: 1, value: state.th,
      format: function (v) { return v + '°'; }, onInput: function (v) { state.th = v; rest(); } });
    api.button('던지기', function () { start(); }, { primary: true });
    api.button('45°로 맞추기', function () { thSlider.set(45); });
    api.button('이전 궤적 지우기', function () { state.ghosts = []; draw(); });

    function rad(d) { return d * Math.PI / 180; }
    function info(v0, th) {
      var vx = v0 * Math.cos(rad(th)), vy = v0 * Math.sin(rad(th));
      var tt = 2 * vy / G;
      return { vx: vx, vy: vy, tt: tt, H: vy * vy / (2 * G), R: vx * tt };
    }
    function same(a, b) { return a.v0 === b.v0 && a.th === b.th; }
    function rest() { state.phase = 'rest'; state.t = 0; loop.pause(); readouts(); draw(); }
    function readouts() {
      var I = info(state.v0, state.th);
      rH.set(I.H.toFixed(1) + ' m'); rR.set(I.R.toFixed(1) + ' m'); rT.set(I.tt.toFixed(2) + ' s');
      rV.set(I.vx.toFixed(1) + ', ' + I.vy.toFixed(1) + ' m/s');
    }
    function remember() {
      var cur = { v0: state.v0, th: state.th };
      state.ghosts = state.ghosts.filter(function (g) { return !same(g, cur); });
      state.ghosts.push(cur);
      while (state.ghosts.length > MAXG) state.ghosts.shift();
    }
    function start() {
      var I = info(state.v0, state.th);
      if (api.reduced) { state.t = I.tt; state.phase = 'done'; remember(); draw(); return; }
      state.t = 0; state.phase = 'fly'; loop.play();
    }
    var loop = api.loop(function (dt) {
      if (state.phase !== 'fly') { loop.pause(); return; }
      var I = info(state.v0, state.th);
      state.t += dt * Math.max(1, I.tt / 2.6);   // 긴 비행은 조금 빠르게 보여 준다(최대 약 2.6초)
      if (state.t >= I.tt) { state.t = I.tt; state.phase = 'done'; remember(); loop.pause(); }
      draw();
    });
    loop.pause();

    function niceStep(range, n) {
      var raw = range / n, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
      return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
    }
    function arrow(x1, y1, x2, y2, color, lw) {
      var dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      if (len < 3) return;
      var ux = dx / len, uy = dy / len, hd = Math.min(9, len * 0.5);
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw || 2.4;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hd * 0.8, y2 - uy * hd * 0.8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - ux * hd - uy * hd * 0.5, y2 - uy * hd + ux * hd * 0.5);
      ctx.lineTo(x2 - ux * hd + uy * hd * 0.5, y2 - uy * hd - ux * hd * 0.5); ctx.closePath(); ctx.fill();
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var L = narrow ? 40 : 52, R = w - 14, Tp = 34, B = h - 40;
      // 축 범위: 지금과 남은 궤적 중 가장 큰 속력으로 정한다(가로·세로 같은 축척)
      var vmax = state.v0;
      state.ghosts.forEach(function (g) { vmax = Math.max(vmax, g.v0); });
      var xmax = vmax * vmax / G * 1.06, ymax = vmax * vmax / (2 * G) * 1.04;
      var s = Math.min((R - L) / xmax, (B - Tp) / ymax);
      var X = function (x) { return L + x * s; }, Y = function (y) { return B - y * s; };
      var xEnd = (R - L) / s, yEnd = (B - Tp) / s;
      // 격자
      var step = niceStep(Math.max(xEnd, yEnd), narrow ? 5 : 8);
      ctx.font = '11px ' + T.fontMono; ctx.lineWidth = 1;
      ctx.textAlign = 'center';
      for (var gx = 0; gx <= xEnd + 1e-9; gx += step) {
        ctx.strokeStyle = T.rule; ctx.beginPath(); ctx.moveTo(X(gx), Tp); ctx.lineTo(X(gx), B); ctx.stroke();
        ctx.fillStyle = T.figMuted; ctx.fillText(+gx.toFixed(1), X(gx), B + 15);
      }
      ctx.textAlign = 'right';
      for (var gy = 0; gy <= yEnd + 1e-9; gy += step) {
        ctx.strokeStyle = T.rule; ctx.beginPath(); ctx.moveTo(L, Y(gy)); ctx.lineTo(R, Y(gy)); ctx.stroke();
        ctx.fillStyle = T.figMuted; ctx.fillText(+gy.toFixed(1), L - 6, Y(gy) + 4);
      }
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('수평 거리 (m)', R, B + 31);
      ctx.textAlign = 'left'; ctx.fillText('높이 (m)', L + 4, Tp - 10);

      // 이전 궤적
      var cur = { v0: state.v0, th: state.th };
      state.ghosts.forEach(function (g) {
        if (same(g, cur)) return;
        var I = info(g.v0, g.th);
        var col = g.th === 45 ? T.figGreen : T.figLine;
        path(I, I.tt, col, 1.6, [6, 4]);
        ctx.fillStyle = g.th === 45 ? T.figGreen : T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(g.th + '° · ' + g.v0 + ' m/s', X(I.R / 2), Y(I.H) - 6);
        ctx.beginPath(); ctx.arc(X(I.R), B, 3, 0, Math.PI * 2); ctx.fill();
      });

      // 현재 궤적
      var I = info(state.v0, state.th);
      var tShow = state.phase === 'rest' ? I.tt : state.t;
      if (state.phase === 'fly') path(I, I.tt, T.figSoftBlue, 6, null);
      path(I, tShow, T.figAccent, 2.6, null);
      // 최고점과 도달 거리 표시
      if (state.phase !== 'fly' || state.t >= I.tt / 2) {
        ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(X(I.R / 2), Y(I.H)); ctx.lineTo(X(I.R / 2), B); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figViolet; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        var hx = X(I.R / 2) + 6, hy = Math.min(B - 8, Y(I.H / 2));
        ctx.fillText('H = ' + I.H.toFixed(1) + ' m', hx, hy);
      }
      if (state.phase !== 'fly') {
        ctx.fillStyle = T.figAccent; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = X(I.R) > R - 60 ? 'right' : 'center';
        ctx.fillText('R = ' + I.R.toFixed(1) + ' m', Math.min(X(I.R), R), B - 8);
      }

      // 공과 속도 성분 화살표
      var t = state.phase === 'rest' ? 0 : state.t;
      var px = X(I.vx * t), py = Y(I.vy * t - 0.5 * G * t * t);
      var vy = I.vy - G * t;
      var k = Math.min(w * (narrow ? 0.2 : 0.14), (B - Tp) * 0.55) / 30;   // 30 m/s를 이 길이로
      arrow(px, py, px + I.vx * k, py, T.figBlue, 2.6);
      arrow(px, py, px, py - vy * k, T.figRed, 2.6);
      ctx.globalAlpha = 0.55; arrow(px, py, px + I.vx * k, py - vy * k, T.figInk, 1.6); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fillStyle = T.figAmber; ctx.fill(); ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.stroke();
      // 화살표 이름
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figBlue; ctx.fillText('수평 ' + I.vx.toFixed(1), Math.min(px + I.vx * k + 5, R - 70), py + (vy >= 0 ? 15 : -8));
      ctx.fillStyle = T.figRed;
      var vyLabelY = py - vy * k + (vy >= 0 ? -6 : 14);
      ctx.fillText('연직 ' + vy.toFixed(1), px + 6, Math.max(Tp + 10, Math.min(B - 4, vyLabelY)));
      // 각도 표시(처음 상태)
      if (state.phase === 'rest') {
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(px, py, 26, -rad(state.th), 0); ctx.stroke();
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
        ctx.fillText(state.th + '°', px + 30, py - 6);
      }
      // 범례
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillStyle = T.figMuted;
      ctx.fillText('점선: 이전 궤적(초록 = 45°)', R, Tp - 10);
    }
    function path(I, tEnd, color, lw, dash) {
      var w = cv.w, narrow = w < 560, L = narrow ? 40 : 52, R = w - 14, Tp = 34, B = cv.h - 40;
      var vmax = state.v0; state.ghosts.forEach(function (g) { vmax = Math.max(vmax, g.v0); });
      var s = Math.min((R - L) / (vmax * vmax / G * 1.06), (B - Tp) / (vmax * vmax / (2 * G) * 1.04));
      ctx.save(); if (dash) ctx.setLineDash(dash);
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
      ctx.beginPath();
      var n = 80;
      for (var i = 0; i <= n; i++) {
        var t = tEnd * i / n, x = I.vx * t, y = I.vy * t - 0.5 * G * t * t;
        var sx = L + x * s, sy = B - Math.max(0, y) * s;
        if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke(); ctx.restore();
    }

    api.onResize(draw);
    readouts(); draw();
  },
});
