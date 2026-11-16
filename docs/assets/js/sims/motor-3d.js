/* 중2-7 전기와 자기: 자석 사이의 코일이 받는 힘과 전동기의 회전, 정류자의 역할 (3D) */
Sims.register('motor-3d', {
  title: '전동기 속으로 — 자기장 속 코일이 받는 힘과 정류자',
  caption: '‘돌리기’를 눌러 코일이 도는 모습을 보고, ‘한 단계씩’으로 45°씩 돌리며 두 변이 받는 힘(초록 화살표)을 확인해 보자. 자기장은 N극에서 S극으로, 두 변에는 전류가 서로 반대 방향으로 흐르므로 한 변은 위로, 다른 변은 아래로 힘을 받는다(오른손: 엄지 = 전류, 네 손가락 = 자기장, 손바닥이 미는 쪽 = 힘). ‘전류 방향 바꾸기’를 누르면 힘과 회전이 반대가 되고, ‘정류자 빼기’를 누르면 코일이 자기장에 수직인 위치 근처에서 흔들리다 멈춘다. 자기장은 두 극 사이에서 고르다고 가정했고, 코일은 한 바퀴만 감은 것으로, 회전을 늦추는 마찰은 단순하게 나타냈다.',
  init: function (api) {
    var R = 1.05, H = 1.35;              // 코일 반너비, 반길이(z 방향)
    var CZ = H + 0.75, CR = 0.3, CL = 0.38; // 정류자 중심 z, 반지름, 반길이
    var K = 4, C = 1.2;                  // 회전력 크기, 마찰
    var state = { phi: 0, w: 0, dir: 1, comm: true, running: false, target: null, frameOn: false };
    var info = api.el('p', 'sim-hint');
    info.style.fontSize = '0.9rem'; info.style.lineHeight = '1.55'; info.setAttribute('aria-live', 'polite');

    var rI = api.readout('변 ①의 전류');
    var rF = api.readout('변 ①이 받는 힘');
    var rRot = api.readout('회전(앞에서 볼 때)');

    function norm(a) { a %= 2 * Math.PI; return a < 0 ? a + 2 * Math.PI : a; }
    // 변 ①에 흐르는 전류(+1: 앞쪽 +z, −1: 뒤쪽). 정류자가 있으면 오른쪽(S극 쪽)에 있는 변에 늘 앞쪽 전류가 흐른다
    function iA() { return state.comm ? state.dir * (Math.cos(state.phi) >= 0 ? 1 : -1) : state.dir; }
    function torque() { return K * iA() * Math.cos(state.phi); }

    var S = api.scene3d({
      yaw: 0.55, pitch: 0.32, dist: 13, scale: 0.12,
      aspect: function (w) { return w < 560 ? 1.0 : 0.62; },
      label: '말굽자석의 두 극 사이에 놓인 사각 코일, 정류자와 브러시, 전지로 이루어진 전동기 모형',
      draw: function (g, T) {
        // 자석: 왼쪽 N극, 오른쪽 S극
        box(g, [-3.3, -1.05, -1.6], [-2.25, 1.05, 1.6], T.figRed, T);
        box(g, [2.25, -1.05, -1.6], [3.3, 1.05, 1.6], T.figBlue, T);
        g.text([-2.78, 1.4, 0.4], 'N극', { bold: true, size: 15, color: T.figRed });
        g.text([2.78, 1.4, 0.4], 'S극', { bold: true, size: 15, color: T.figBlue });
        // 자기장(N → S)
        [-0.75, 0.75].forEach(function (y) {
          [-1.0, 0.1, 1.2].forEach(function (z) {
            g.arrow([-2.15, y, z], [2.1, y, z], T.figTeal, { width: 1.2, alpha: 0.55, head: 7 });
          });
        });
        g.text([0, -1.38, -1.3], '자기장 방향 (N → S)', { color: T.figTeal, size: 12 });
        // 코일
        var c = Math.cos(state.phi), s = Math.sin(state.phi);
        var A = [R * c, R * s], B = [-R * c, -R * s], i1 = iA();
        var coil = T.figAmber;
        g.line([A[0], A[1], -H], [A[0], A[1], H], coil, { width: 5 });
        g.line([B[0], B[1], -H], [B[0], B[1], H], coil, { width: 5 });
        g.line([A[0], A[1], -H], [B[0], B[1], -H], coil, { width: 5 });
        // 앞쪽: 각 변 끝에서 정류자 반쪽으로
        var ca = [CR * c, CR * s], cb = [-CR * c, -CR * s];
        g.path([[A[0], A[1], H], [A[0] * 0.55, A[1] * 0.55, H + 0.35], [ca[0], ca[1], CZ - CL]], coil, { width: 4 });
        g.path([[B[0], B[1], H], [B[0] * 0.55, B[1] * 0.55, H + 0.35], [cb[0], cb[1], CZ - CL]], coil, { width: 4 });
        g.text([A[0] * 1.22, A[1] * 1.22 + 0.05, 0.25], '①', { bold: true, size: 15 });
        g.text([B[0] * 1.22, B[1] * 1.22 + 0.05, 0.25], '②', { bold: true, size: 15 });
        // 회전축
        g.line([0, 0, -H - 0.6], [0, 0, -H], T.figLine, { width: 3 });
        // 정류자(갈라진 고리 두 쪽)
        if (state.comm) {
          halfRing(g, state.phi, T.figAmber, T); halfRing(g, state.phi + Math.PI, T.figViolet, T);
        } else {
          // 정류자 대신 끊기지 않은 고리 두 개(각 변에 하나씩): 전류 방향이 바뀌지 않는다
          g.circle([0, 0, CZ - 0.2], CR, [0, 0, 1], T.figAmber, { width: 4 });
          g.circle([0, 0, CZ + 0.25], CR * 0.85, [0, 0, 1], T.figViolet, { width: 4 });
        }
        // 브러시와 전지
        var plusLeft = state.dir > 0;
        var bz = state.comm ? CZ : CZ;
        g.line([-CR - 0.32, 0, bz], [-CR - 0.02, 0, bz], T.figInk, { width: 7 });
        g.line([CR + 0.02, 0, bz], [CR + 0.32, 0, bz], T.figInk, { width: 7 });
        g.path([[-CR - 0.32, 0, bz], [-1.2, 0, bz], [-1.2, -2.0, bz], [-0.35, -2.0, bz]], T.figLine, { width: 2 });
        g.path([[CR + 0.32, 0, bz], [1.2, 0, bz], [1.2, -2.0, bz], [0.35, -2.0, bz]], T.figLine, { width: 2 });
        g.poly([[-0.35, -2.25, bz], [0.35, -2.25, bz], [0.35, -1.75, bz], [-0.35, -1.75, bz]], T.figPanel, { alpha: 1, stroke: T.figInk, strokeWidth: 1.5 });
        g.text([0, -2.0, bz], '전지', { size: 11 });
        g.text([-0.62, -2.32, bz], plusLeft ? '+' : '−', { bold: true, size: 15, color: plusLeft ? T.figRed : T.figBlue });
        g.text([0.62, -2.32, bz], plusLeft ? '−' : '+', { bold: true, size: 15, color: plusLeft ? T.figBlue : T.figRed });
        g.text([0, 0.62, CZ + 0.1], state.comm ? '정류자' : '고리(정류자 없음)', { size: 11, color: T.figMuted });
        g.text([-1.2, 0.3, bz], '브러시', { size: 11, color: T.figMuted });
        // 전류(파란 화살표)와 힘(초록 화살표)
        [[A, i1], [B, -i1]].forEach(function (pr) {
          var p = pr[0], d = pr[1];
          g.arrow([p[0], p[1], -0.55 * d], [p[0], p[1], 0.75 * d], T.figAccent, { width: 3.5, head: 11 });
          g.arrow([p[0], p[1], 0.1], [p[0], p[1] + 1.05 * d, 0.1], T.figGreen, { width: 4, head: 12 });
          g.text([p[0] + (p[0] >= 0 ? 0.42 : -0.42), p[1] + 1.12 * d, 0.1], '힘', { color: T.figGreen, bold: true, size: 13 });
        });
        g.text([A[0], A[1] + 0.25, 0.95 * i1 + 0.08], '전류', { color: T.figAccent, size: 12, bold: true });
        // 회전 방향 표시(뒤쪽, 축 둘레)
        var tq = torque(), rot = Math.abs(state.w) > 0.15 ? Math.sign(state.w) : (Math.abs(tq) > 0.2 ? Math.sign(tq) : 0);
        if (rot) {
          var pts = [], z0 = -H - 0.45, a0 = state.phi + 0.5, span = 1.6;
          for (var k = 0; k <= 16; k++) { var a = a0 + rot * span * k / 16; pts.push([0.62 * Math.cos(a), 0.62 * Math.sin(a), z0]); }
          g.path(pts, T.figInk, { width: 2 });
          var aE = a0 + rot * span, aP = a0 + rot * (span - 0.25);
          g.arrow([0.62 * Math.cos(aP), 0.62 * Math.sin(aP), z0], [0.62 * Math.cos(aE), 0.62 * Math.sin(aE), z0], T.figInk, { width: 2, head: 9 });
        }
        readouts();
      },
    });
    api.stage.appendChild(info);

    function box(g, a, b, color, T) {
      var x0 = a[0], y0 = a[1], z0 = a[2], x1 = b[0], y1 = b[1], z1 = b[2];
      var f = [
        [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]],
        [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]],
        [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]],
      ];
      f.forEach(function (q) { g.poly(q, color, { alpha: 0.28, stroke: color, strokeWidth: 1 }); });
    }
    // 정류자 반쪽: 각도 a(그 반쪽에 이어진 변의 방향)를 중심으로 한 반원통. 틈은 a ± 90°에 있다
    function halfRing(g, a, color, T) {
      var n = 10, front = [], back = [];
      for (var k = 0; k <= n; k++) {
        var t = a - Math.PI / 2 + 0.16 + (Math.PI - 0.32) * k / n;
        front.push([CR * Math.cos(t), CR * Math.sin(t), CZ + CL]); back.push([CR * Math.cos(t), CR * Math.sin(t), CZ - CL]);
      }
      for (k = 0; k < n; k++) g.poly([back[k], back[k + 1], front[k + 1], front[k]], color, { alpha: 0.85 });
      g.path(front, T.figInk, { width: 1 });
    }

    function readouts() {
      var i1 = iA();
      rI.set(i1 > 0 ? '앞쪽으로(보는 쪽)' : '뒤쪽으로');
      rF.set(i1 > 0 ? '위쪽' : '아래쪽');
      var tq = torque();
      if (state.running && Math.abs(state.w) > 0.15) rRot.set(state.w > 0 ? '시계 반대 방향' : '시계 방향');
      else if (Math.abs(tq) < 0.3) rRot.set('돌리는 힘 없음');
      else rRot.set(tq > 0 ? '시계 반대 방향으로 돌리려 함' : '시계 방향으로 돌리려 함');
      var deg = Math.round(norm(state.phi) * 180 / Math.PI) % 360, ph = deg % 180;
      var t;
      if (ph < 12 || ph > 168) t = '코일 면이 자기장과 나란하다: 두 변이 받는 힘(위·아래)이 코일을 가장 세게 돌린다.';
      else if (Math.abs(ph - 90) < 12) t = '코일 면이 자기장에 수직이다: 힘이 축 쪽(위·아래)을 향해 돌리는 효과가 없다. ' + (state.comm ? '이 위치에서 정류자의 틈이 브러시를 지나며 전류 방향이 바뀐다.' : '정류자가 없으므로 이 위치를 지나면 힘이 회전을 되돌린다.');
      else if (!state.comm && tq * (state.w || 1) < 0) t = '정류자가 없어 전류 방향이 그대로이다: 지금은 힘이 회전을 되돌리는 쪽으로 작용한다.';
      else t = '오른쪽(S극 쪽) 변은 위로, 왼쪽(N극 쪽) 변은 아래로 힘을 받는 동안 코일이 계속 같은 방향으로 돈다.';
      if (state.dir < 0 && state.comm) t = t.replace('오른쪽(S극 쪽) 변은 위로, 왼쪽(N극 쪽) 변은 아래로', '전류 방향을 바꾸어 오른쪽 변은 아래로, 왼쪽 변은 위로');
      info.textContent = '코일 각도 ' + deg + '° — ' + t;
    }

    function ensureFrame() {
      if (state.frameOn) return; state.frameOn = true;
      S.onFrame(function (dt) {
        if (!(dt > 0)) return;
        if (state.target != null) {
          var d = state.target - state.phi, st = Math.sign(d) * Math.min(Math.abs(d), dt * 2.2);
          state.phi += st; if (Math.abs(state.target - state.phi) < 1e-4) { state.phi = state.target; state.target = null; }
          return;
        }
        if (!state.running) return;
        var steps = 4, h = dt / steps;
        for (var k = 0; k < steps; k++) { state.w += (torque() - C * state.w) * h; state.phi += state.w * h; }
      });
    }
    var g1 = api.group();
    var runBtn = api.button('돌리기', function () {
      state.running = !state.running; state.target = null;
      if (state.running && Math.abs(Math.cos(state.phi)) < 0.06 && Math.abs(state.w) < 0.1) state.phi += 0.1 * state.dir;
      runBtn.textContent = state.running ? '멈추기' : '돌리기';
      if (api.reduced && state.running) { /* 움직임 줄이기: 바로 돌리지 않고 한 단계씩만 보여 준다 */ state.running = false; runBtn.textContent = '돌리기'; stepOnce(); return; }
      ensureFrame(); S.redraw();
    }, { primary: true, parent: g1 });
    function stepOnce() {
      state.running = false; state.w = 0; runBtn.textContent = '돌리기';
      var dirn = state.dir;   // 정류자가 있을 때 도는 방향
      var base = Math.round(state.phi / (Math.PI / 4)) * (Math.PI / 4);
      var to = base + dirn * Math.PI / 4;
      if (api.reduced) { state.phi = to; S.redraw(); return; }
      state.target = to; ensureFrame();
    }
    api.button('한 단계씩(45°)', stepOnce, { parent: g1 });
    var g2 = api.group();
    api.button('전류 방향 바꾸기', function (b) {
      state.dir *= -1; b.setAttribute('aria-pressed', state.dir < 0 ? 'true' : 'false'); S.redraw();
    }, { toggle: true, parent: g2 });
    api.button('정류자 빼기', function (b) {
      state.comm = !state.comm; b.setAttribute('aria-pressed', state.comm ? 'false' : 'true'); b.textContent = state.comm ? '정류자 빼기' : '정류자 다시 넣기'; S.redraw();
    }, { toggle: true, parent: g2 });

    S.redraw();
  },
});
