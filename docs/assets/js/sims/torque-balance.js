/* 물리학 1 힘과 에너지: 받침점이 하나인 시소 — 양쪽 돌림힘(무게 × 받침점까지 거리)을 비교해 평형과 기울어지는 방향을 찾는다 */
Sims.register('torque-balance', {
  title: '시소의 평형 — 돌림힘 = 무게 × 받침점까지 거리',
  caption: '양쪽 물체의 무게와 받침점까지의 거리를 바꾸어 보자. 왼쪽 물체는 시소를 시계 반대 방향으로, 오른쪽 물체는 시계 방향으로 돌리려 한다. 두 돌림힘의 크기가 같으면 평형을 이루고, 다르면 돌림힘이 큰 쪽으로 기운다. 회전축은 받침점 한 곳이며, 시소 판의 무게중심은 받침점에 있어 판의 무게는 돌림힘을 만들지 않는다고 가정했다. 거리는 판이 수평일 때 잰 값이다.',
  init: function (api) {
    var HALF = 2.0;   // 판 반쪽 길이 (m)
    var state = { wL: 300, dL: 1.5, wR: 450, dR: 1.5, ang: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.5; }, label: '받침점 위의 시소와 양쪽 돌림힘 비교' });
    var ctx = cv.ctx;

    var rL = api.readout('왼쪽 돌림힘 (시계 반대 방향)');
    var rR = api.readout('오른쪽 돌림힘 (시계 방향)');
    var rS = api.readout('결과');

    var sWL = api.slider({ id: 'torque-balance-wl', label: '왼쪽 물체 무게', min: 100, max: 800, step: 50, value: state.wL, format: function (v) { return v + ' N'; }, onInput: function (v) { state.wL = v; update(); } });
    var sDL = api.slider({ id: 'torque-balance-dl', label: '왼쪽 물체 거리', min: 0.25, max: 2, step: 0.25, value: state.dL, format: function (v) { return v.toFixed(2) + ' m'; }, onInput: function (v) { state.dL = v; update(); } });
    var sWR = api.slider({ id: 'torque-balance-wr', label: '오른쪽 물체 무게', min: 100, max: 800, step: 50, value: state.wR, format: function (v) { return v + ' N'; }, onInput: function (v) { state.wR = v; update(); } });
    var sDR = api.slider({ id: 'torque-balance-dr', label: '오른쪽 물체 거리', min: 0.25, max: 2, step: 0.25, value: state.dR, format: function (v) { return v.toFixed(2) + ' m'; }, onInput: function (v) { state.dR = v; update(); } });
    api.button('예제 1 상황(300 N·1.5 m, 450 N)으로', function () { sWL.set(300); sDL.set(1.5); sWR.set(450); sDR.set(1.5); });

    var MAXANG = 0.12;   // 판 끝이 바닥에 닿는 각(라디안): 그릴 때 받침점 높이로 다시 계산
    function torques() { return { L: state.wL * state.dL, R: state.wR * state.dR }; }
    function target() { var t = torques(); return Math.abs(t.L - t.R) < 1e-6 ? 0 : (t.L > t.R ? 1 : -1) * MAXANG; }   // + : 시계 반대 방향(왼쪽이 내려감)
    function update() {
      var t = torques();
      rL.set(state.wL + ' N × ' + state.dL.toFixed(2) + ' m = ' + fmt(t.L) + ' N·m');
      rR.set(state.wR + ' N × ' + state.dR.toFixed(2) + ' m = ' + fmt(t.R) + ' N·m');
      rS.set(Math.abs(t.L - t.R) < 1e-6 ? '평형 (수평 유지)' : t.L > t.R ? '왼쪽으로 기운다 (시계 반대 방향 회전)' : '오른쪽으로 기운다 (시계 방향 회전)');
      if (api.reduced) { state.ang = target(); draw(); } else loop.play();
    }
    function fmt(v) { return (Math.round(v * 10) / 10).toString(); }
    var loop = api.loop(function (dt) {
      var tg = target(), d = tg - state.ang, step = dt * 0.5;
      if (Math.abs(d) <= step) { state.ang = tg; draw(); loop.pause(); return; }
      state.ang += Math.sign(d) * step; draw();
    });
    loop.pause();

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var sceneH = narrow ? h * 0.7 : h * 0.74;
      var cx = w / 2, pivotY = sceneH - 62, scale = Math.min((w - 40) / (2 * HALF + 0.4), 150);
      var groundY = pivotY + 46;
      MAXANG = Math.asin(Math.min(0.5, (groundY - pivotY - 6) / ((HALF + 0.1) * scale)));
      // 바닥과 받침점
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, groundY); ctx.lineTo(w - 10, groundY); ctx.stroke();
      ctx.fillStyle = T.figSoftAmber; ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, pivotY); ctx.lineTo(cx - 30, groundY); ctx.lineTo(cx + 30, groundY); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('받침점(회전축)', cx, groundY + 15);
      // 판 좌표계: 회전 (화면에서 시계 반대 방향 = 왼쪽 끝이 내려감)
      var a = state.ang;   // + 이면 왼쪽이 내려감
      // 판 좌표(x: 오른쪽 m, y: 판에 수직 위쪽 px) → 화면. a > 0 이면 시계 반대 방향 회전(오른쪽 끝이 올라감)
      var P = function (x, y) {
        var X = x * scale, c = Math.cos(a), s = Math.sin(a);
        return { x: cx + X * c - y * s, y: pivotY - (X * s + y * c) };
      };
      var thick = 10;
      var p1 = P(-HALF - 0.1, 0), p2 = P(HALF + 0.1, 0), p3 = P(HALF + 0.1, thick), p4 = P(-HALF - 0.1, thick);
      ctx.fillStyle = T.figSoftBlue; ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 눈금(0.5 m 간격)
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1;
      for (var x = -HALF; x <= HALF + 1e-9; x += 0.5) { var q1 = P(x, 0), q2 = P(x, thick * 0.5); ctx.beginPath(); ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.stroke(); }
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(cx, pivotY, 3.5, 0, Math.PI * 2); ctx.fill();
      // 물체
      box(T, P, -state.dL, state.wL, T.figRed, T.figSoftRed, '왼쪽');
      box(T, P, state.dR, state.wR, T.figGreen, T.figSoftGreen, '오른쪽');
      // 거리 표시 (판 아래, 판과 함께 기울어짐)
      dim(T, P, -state.dL, 0, state.dL.toFixed(2) + ' m', -16);
      dim(T, P, 0, state.dR, state.dR.toFixed(2) + ' m', -16);
      // 회전 방향 표시
      var t = torques(), diff = t.L - t.R;
      if (Math.abs(diff) > 1e-6) {
        var ccw = diff > 0, rr = 34;
        ctx.strokeStyle = T.figViolet; ctx.fillStyle = T.figViolet; ctx.lineWidth = 2.5;
        var a0 = -Math.PI / 2 - 0.9, a1 = -Math.PI / 2 + 0.9;
        ctx.beginPath(); ctx.arc(cx, pivotY, rr + 24, a0, a1); ctx.stroke();
        var ae = ccw ? a0 : a1, dir = ccw ? -1 : 1;
        var hx = cx + (rr + 24) * Math.cos(ae), hy = pivotY + (rr + 24) * Math.sin(ae);
        var tx = -Math.sin(ae) * dir, ty = Math.cos(ae) * dir;
        ctx.beginPath(); ctx.moveTo(hx + tx * 8, hy + ty * 8); ctx.lineTo(hx - ty * 5, hy + tx * 5); ctx.lineTo(hx + ty * 5, hy - tx * 5); ctx.closePath(); ctx.fill();
        ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(ccw ? '시계 반대 방향으로 회전' : '시계 방향으로 회전', cx, pivotY - rr - 34);
      } else {
        ctx.fillStyle = T.figGreen; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('돌림힘의 평형 → 수평 유지', cx, pivotY - 70);
      }
      // 돌림힘 막대 비교
      drawTorqueBars(T, { x: 0, y: sceneH + 6, w: w, h: h - sceneH - 6 }, t);
    }
    function box(T, P, x, wN, stroke, fill, name) {
      var s = 18 + wN / 800 * 26;   // 무게에 따라 크기
      // 상자 네 꼭짓점 (판 좌표에서 위로 쌓기)
      var sc = Math.min((cv.w - 40) / (2 * HALF + 0.4), 150), hw = s / 2 / sc;
      var c1 = P(x - hw, 10), c2 = P(x + hw, 10), c3 = P(x + hw, 10 + s), c4 = P(x - hw, 10 + s);
      ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(c3.x, c3.y); ctx.lineTo(c4.x, c4.y); ctx.closePath(); ctx.fill(); ctx.stroke();
      var cc = P(x, 10 + s / 2);
      // 무게 화살표 (연직 아래)
      var len = 8 + wN / 800 * 30;
      ctx.strokeStyle = stroke; ctx.fillStyle = stroke; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cc.x, cc.y); ctx.lineTo(cc.x, cc.y + s / 2 + 10 + len); ctx.stroke();
      var ey = cc.y + s / 2 + 10 + len;
      ctx.beginPath(); ctx.moveTo(cc.x, ey + 7); ctx.lineTo(cc.x - 5, ey - 1); ctx.lineTo(cc.x + 5, ey - 1); ctx.closePath(); ctx.fill();
      var top = P(x, 10 + s);
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(wN + ' N', top.x, top.y - 6);
      void name;
    }
    function dim(T, P, x0, x1, label, off) {
      var a = P(x0, off), b = P(x1, off);
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      [a, b].forEach(function (p) { ctx.beginPath(); ctx.moveTo(p.x, p.y - 4); ctx.lineTo(p.x, p.y + 4); ctx.stroke(); });
      var m = P((x0 + x1) / 2, off - 12);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(label, m.x, m.y + 4);
    }
    function drawTorqueBars(T, r, t) {
      var max = 1600, L = r.x + 132, R = r.x + r.w - 70;
      if (r.w < 560) { L = r.x + 118; R = r.x + r.w - 62; }
      var rows = [{ lab: '왼쪽 (시계 반대)', v: t.L, c: T.figRed, f: T.figSoftRed }, { lab: '오른쪽 (시계)', v: t.R, c: T.figGreen, f: T.figSoftGreen }];
      var rowH = Math.min(26, (r.h - 18) / 2);
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('돌림힘의 크기 비교 (N·m)', r.x + 12, r.y + 12);
      rows.forEach(function (row, i) {
        var y = r.y + 20 + i * (rowH + 4);
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right';
        ctx.fillText(row.lab, L - 8, y + rowH / 2 + 4);
        ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillRect(L, y, R - L, rowH - 4); ctx.strokeRect(L, y, R - L, rowH - 4);
        var bw = Math.min(1, row.v / max) * (R - L);
        ctx.fillStyle = row.f; ctx.strokeStyle = row.c; ctx.lineWidth = 2; ctx.fillRect(L, y, bw, rowH - 4); ctx.strokeRect(L, y, bw, rowH - 4);
        ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'left';
        ctx.fillText(fmt(row.v), Math.min(L + bw + 6, R + 6), y + rowH / 2 + 2);
      });
    }

    api.onResize(draw);
    draw();   // 받침점 높이에 맞춘 MAXANG 계산
    state.ang = target();
    update(); draw();
  },
});
