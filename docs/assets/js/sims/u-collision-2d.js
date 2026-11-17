/* 일반물리학 3 일·에너지와 운동량: 2차원 충돌 — 성분별 운동량 보존과 운동량 벡터 삼각형 */
Sims.register('u-collision-2d', {
  title: '비스듬한 충돌 — 운동량은 벡터로 보존된다',
  caption: '두 공의 질량과 어긋난 정도 b(두 중심이 처음 진행 방향에 수직으로 떨어진 거리)를 정하고 「충돌시키기」를 눌러 보자. 오른쪽 그림처럼 충돌 전 운동량 p₁ᵢ는 언제나 충돌 후 두 운동량의 벡터 합과 같다. 탄성 충돌에서 두 공의 질량이 같으면 둘은 직각으로 갈라지고, 질량이 다르면 각이 90°에서 벗어난다. 완전 비탄성 충돌은 두 공이 붙어 한 덩어리로 움직인다고 보았다(회전은 무시). 마찰 없는 수평면 위의 매끄러운 원판이며 충돌은 순간적으로 일어나고, 공 1의 처음 속력은 2.00 m/s이다.',
  init: function (api) {
    var V = 2.0, RB = 0.15;
    var st = { m1: 1, m2: 1, b: 0.5, elastic: true, t: 0.8 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.52; }, label: '위에서 본 두 공의 충돌과 운동량 벡터 삼각형' });
    var ctx = cv.ctx;
    var r1 = api.readout('충돌 후 공 1');
    var r2 = api.readout('충돌 후 공 2');
    var rA = api.readout('두 공이 갈라진 각');
    var rK = api.readout('운동 에너지 (후 / 전)');

    api.slider({ id: 'u-collision-2d-m1', label: '공 1 질량 m₁', min: 0.5, max: 3, step: 0.1, value: st.m1,
      format: function (v) { return v.toFixed(1) + ' kg'; }, onInput: function (v) { st.m1 = v; changed(); } });
    api.slider({ id: 'u-collision-2d-m2', label: '공 2 질량 m₂', min: 0.5, max: 3, step: 0.1, value: st.m2,
      format: function (v) { return v.toFixed(1) + ' kg'; }, onInput: function (v) { st.m2 = v; changed(); } });
    api.slider({ id: 'u-collision-2d-b', label: '어긋난 정도 b / (두 반지름 합)', min: 0, max: 0.95, step: 0.01, value: st.b,
      format: function (v) { return v.toFixed(2) + (v === 0 ? ' (정면)' : ''); }, onInput: function (v) { st.b = v; changed(); } });
    var g = api.group();
    var bE = api.button('탄성 충돌', function () { setE(true); }, { toggle: true, pressed: true, parent: g });
    var bI = api.button('완전 비탄성(붙음)', function () { setE(false); }, { toggle: true, pressed: false, parent: g });
    api.button('충돌시키기', function () { go(); }, { primary: true, parent: g });
    function setE(e) { st.elastic = e; bE.setAttribute('aria-pressed', e ? 'true' : 'false'); bI.setAttribute('aria-pressed', e ? 'false' : 'true'); changed(); }

    function solve() {
      var m1 = st.m1, m2 = st.m2, s = st.b, c = Math.sqrt(1 - s * s);
      var n = [c, -s];   // 접촉 순간 공 1 → 공 2 중심 방향 (y 위쪽 +)
      var c2 = [2 * RB * c, -2 * RB * s];
      if (!st.elastic) { var Vc = m1 * V / (m1 + m2); return { v1: [Vc, 0], v2: [Vc, 0], c2: c2, n: n, stick: true }; }
      var J = 2 * m1 * m2 / (m1 + m2) * V * c;   // 법선 방향 충격량 (탄성)
      return { v1: [V - J / m1 * n[0], -J / m1 * n[1]], v2: [J / m2 * n[0], J / m2 * n[1]], c2: c2, n: n, stick: false };
    }
    function mag(v) { return Math.sqrt(v[0] * v[0] + v[1] * v[1]); }
    function ang(v) { return Math.atan2(v[1], v[0]) * 180 / Math.PI; }
    function dirText(v) {
      if (mag(v) < 1e-6) return '정지';
      var a = ang(v);
      return mag(v).toFixed(2) + ' m/s, ' + (Math.abs(a) < 0.05 ? '처음 방향' : Math.abs(Math.abs(a) - 180) < 0.05 ? '반대 방향' : (a > 0 ? '왼쪽 ' : '오른쪽 ') + Math.abs(a).toFixed(1) + '°');
    }
    var S;
    function changed() {
      S = solve();
      r1.set(dirText(S.v1)); r2.set(S.stick ? '(붙어서 함께)' : dirText(S.v2));
      if (S.stick || mag(S.v1) < 1e-6 || mag(S.v2) < 1e-6) rA.set('—');
      else { var d = Math.abs(ang(S.v1) - ang(S.v2)); if (d > 180) d = 360 - d; rA.set(d.toFixed(1) + '°'); }
      var Ki = 0.5 * st.m1 * V * V, Kf = 0.5 * st.m1 * mag(S.v1) * mag(S.v1) + (S.stick ? 0.5 * st.m2 * mag(S.v2) * mag(S.v2) : 0.5 * st.m2 * mag(S.v2) * mag(S.v2));
      rK.set(Kf.toFixed(2) + ' J / ' + Ki.toFixed(2) + ' J (' + Math.round(100 * Kf / Ki) + ' %)');
      st.t = 0.8; st.playing = false; loop.pause();
      draw();
    }
    function go() {
      if (api.reduced) { st.t = 0.8; draw(); return; }
      st.t = -0.7; st.playing = true; loop.play();
    }
    var loop = api.loop(function (dt) {
      if (!st.playing) return;
      st.t += dt * 0.5;
      if (st.t >= 0.8) { st.t = 0.8; st.playing = false; loop.pause(); }
      draw();
    });
    loop.pause();

    function arrow(x1, y1, x2, y2, col, lw) {
      var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy); if (L < 2) return;
      var ux = dx / L, uy = dy / L, hl = Math.min(11, L * 0.45);
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hl, y2 - uy * hl); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - ux * hl - uy * hl * 0.5, y2 - uy * hl + ux * hl * 0.5); ctx.lineTo(x2 - ux * hl + uy * hl * 0.5, y2 - uy * hl - ux * hl * 0.5); ctx.closePath(); ctx.fill();
    }
    function pos(t) {
      if (t < 0) return { p1: [V * t, 0], p2: S.c2 };
      return { p1: [S.v1[0] * t, S.v1[1] * t], p2: [S.c2[0] + S.v2[0] * t, S.c2[1] + S.v2[1] * t] };
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var A = narrow ? { x: 0, y: 0, w: w, h: h * 0.52 } : { x: 0, y: 0, w: w * 0.58, h: h };
      var Bx = narrow ? { x: 0, y: h * 0.54, w: w, h: h * 0.46 } : { x: w * 0.6, y: 0, w: w * 0.4, h: h };
      table(T, A); triangle(T, Bx);
    }
    function table(T, r) {
      ctx.fillStyle = T.figPaper; ctx.fillRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8);
      var xr = [-1.45, 1.75], yr = [-1.0, 1.0];
      var k = Math.min((r.w - 16) / (xr[1] - xr[0]), (r.h - 40) / (yr[1] - yr[0]));
      var cx = r.x + r.w / 2 - (xr[0] + xr[1]) / 2 * k, cy = r.y + 14 + (r.h - 40) / 2;
      var X = function (x) { return cx + x * k; }, Y = function (y) { return cy - y * k; };
      ctx.save(); ctx.beginPath(); ctx.rect(r.x + 4, r.y + 4, r.w - 8, r.h - 8); ctx.clip();
      // 처음 진행선
      ctx.setLineDash([5, 5]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(X(xr[0]), Y(0)); ctx.lineTo(X(xr[1]), Y(0)); ctx.stroke(); ctx.setLineDash([]);
      // 궤적
      var t = st.t, P = pos(t);
      ctx.lineWidth = 2;
      ctx.strokeStyle = T.figBlue; ctx.beginPath(); ctx.moveTo(X(-0.7 * V), Y(0)); ctx.lineTo(X(Math.min(P.p1[0], 0)), Y(0));
      if (t > 0) ctx.lineTo(X(P.p1[0]), Y(P.p1[1])); ctx.stroke();
      if (t > 0) { ctx.strokeStyle = T.figRed; ctx.beginPath(); ctx.moveTo(X(S.c2[0]), Y(S.c2[1])); ctx.lineTo(X(P.p2[0]), Y(P.p2[1])); ctx.stroke(); }
      // b 표시(처음)
      if (st.b > 0.02) {
        ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(X(S.c2[0] - 0.35), Y(S.c2[1])); ctx.lineTo(X(S.c2[0]), Y(S.c2[1])); ctx.stroke(); ctx.setLineDash([]);
        var bxp = X(S.c2[0] - 0.3);
        arrow(bxp, Y(0), bxp, Y(S.c2[1]), T.figMuted, 1.2);
        ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText('b', bxp - 4, (Y(0) + Y(S.c2[1])) / 2 + 4);
      }
      // 공
      var rad = RB * k;
      function ball(p, col, soft, label) {
        ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), rad, 0, Math.PI * 2); ctx.fillStyle = soft; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = T.figInk; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText(label, X(p[0]), Y(p[1]) + 4);
      }
      ball(P.p2, T.figRed, T.figSoftRed, '2');
      ball(P.p1, T.figBlue, T.figSoftBlue, '1');
      // 속도 화살표
      var vk = k * 0.22;
      var v1 = t < 0 ? [V, 0] : S.v1, v2 = t < 0 ? [0, 0] : S.v2;
      arrow(X(P.p1[0]), Y(P.p1[1]), X(P.p1[0]) + v1[0] * vk, Y(P.p1[1]) - v1[1] * vk, T.figBlue, 2.4);
      if (!S.stick) arrow(X(P.p2[0]), Y(P.p2[1]), X(P.p2[0]) + v2[0] * vk, Y(P.p2[1]) - v2[1] * vk, T.figRed, 2.4);
      ctx.restore();
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('위에서 본 모습 · 화살표는 속도', r.x + 10, r.y + r.h - 10);
    }
    function triangle(T, r) {
      var p1i = [st.m1 * V, 0], p1f = [st.m1 * S.v1[0], st.m1 * S.v1[1]], p2f = [st.m2 * S.v2[0], st.m2 * S.v2[1]];
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('운동량 벡터 (kg·m/s)', r.x + 8, r.y + 20);
      var ys = [0, p1f[1]], ymin = Math.min.apply(null, ys), ymax = Math.max.apply(null, ys);
      var xs = [0, p1i[0], p1f[0]], xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs);
      var k = Math.min((r.w - 50) / Math.max(xmax - xmin, 0.5), (r.h - 120) / Math.max(ymax - ymin, 0.5), 60);
      var ox = r.x + r.w / 2 - (xmin + xmax) / 2 * k, oy = r.y + 40 + (r.h - 120) / 2 + (ymax + ymin) / 2 * k;
      var X = function (x) { return ox + x * k; }, Y = function (y) { return oy - y * k; };
      if (S.stick) {
        arrow(X(0), Y(0), X(p1i[0]), Y(0), T.figInk, 3);
        arrow(X(0), Y(0) + 10, X(p1f[0] + p2f[0]), Y(0) + 10, T.figViolet, 3);
      } else {
        arrow(X(0), Y(0), X(p1i[0]), Y(0), T.figInk, 3.2);
        arrow(X(0), Y(0), X(p1f[0]), Y(p1f[1]), T.figBlue, 2.8);
        arrow(X(p1f[0]), Y(p1f[1]), X(p1f[0] + p2f[0]), Y(p1f[1] + p2f[1]), T.figRed, 2.8);
      }
      ctx.beginPath(); ctx.arc(X(0), Y(0), 3, 0, Math.PI * 2); ctx.fillStyle = T.figInk; ctx.fill();
      var ly = r.y + r.h - 50; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figInk; ctx.fillText('■ 충돌 전 p₁ᵢ = ' + p1i[0].toFixed(2), r.x + 8, ly);
      if (S.stick) { ctx.fillStyle = T.figViolet; ctx.fillText('■ 충돌 후 (m₁ + m₂)V = ' + (p1f[0] + p2f[0]).toFixed(2), r.x + 8, ly + 17); }
      else {
        ctx.fillStyle = T.figBlue; ctx.fillText('■ p₁f = ' + mag(p1f).toFixed(2), r.x + 8, ly + 17);
        ctx.fillStyle = T.figRed; ctx.fillText('■ p₂f = ' + mag(p2f).toFixed(2), r.x + 110, ly + 17);
        ctx.fillStyle = T.figMuted; ctx.fillText('p₁f + p₂f = p₁ᵢ (성분마다 보존)', r.x + 8, ly + 34);
      }
    }
    api.onResize(draw);
    changed();
  },
});
