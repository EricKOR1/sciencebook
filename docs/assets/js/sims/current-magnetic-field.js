/* 물리학 2 전기와 자기: 직선 전류·원형 전류·솔레노이드 주위의 자기장을 입체로 (3D). 자기장은 비오–사바르 법칙으로 계산해 방향을 정확히 맞춘다 */
Sims.register('current-magnetic-field', {
  title: '전류가 만드는 자기장 — 직선 도선, 원형 도선, 솔레노이드',
  caption: '도선 모양을 고르고 그림을 끌어 돌려 보자. 노란 화살표는 전류, 파란 선은 자기장의 모양, 작은 나침반 바늘의 빨간 끝(N극)은 그 자리의 자기장 방향이다. 전류 방향을 바꾸면 자기장 방향도 반대가 되어 바늘이 모두 돌아선다. 오른손 엄지를 직선 전류 방향으로 하면 감아쥔 네 손가락이 자기장 방향이고, 원형 도선과 솔레노이드는 네 손가락을 전류 방향으로 감아쥐면 엄지가 가운데 자기장(솔레노이드의 N극) 방향이다. 지구 자기장은 무시했고 세기는 나타내지 않았다.',
  init: function (api) {
    var st = { mode: 'line', dir: 1, anim: 1 };   // anim: 바늘이 돌아가는 진행도(0→1)
    var rShape = api.readout('도선');
    var rRule = api.readout('자기장 방향');

    // ── 도선 모양(전류 방향 dir=+1 기준의 점 배열)
    function wirePts(mode) {
      var pts = [], i, N;
      if (mode === 'line') { for (i = 0; i <= 40; i++) pts.push([0, -2.8 + 5.6 * i / 40, 0]); }
      else if (mode === 'loop') { N = 72; for (i = 0; i <= N; i++) { var p = i / N * Math.PI * 2; pts.push([0, 1.2 * Math.cos(p), 1.2 * Math.sin(p)]); } }
      else { var turns = 7, Lh = 1.6, R = 0.85; N = turns * 40; for (i = 0; i <= N; i++) { var q = i / N * turns * Math.PI * 2; pts.push([-Lh + 2 * Lh * i / N, R * Math.cos(q), R * Math.sin(q)]); } }
      return pts;
    }
    // 비오–사바르: dB ∝ I dl × r / r³ (dir=+1 기준)
    function B(p, pts) {
      var bx = 0, by = 0, bz = 0;
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1];
        var dl = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
        var r = [p[0] - m[0], p[1] - m[1], p[2] - m[2]], r2 = r[0] * r[0] + r[1] * r[1] + r[2] * r[2] + 1e-4, r3 = r2 * Math.sqrt(r2);
        bx += (dl[1] * r[2] - dl[2] * r[1]) / r3; by += (dl[2] * r[0] - dl[0] * r[2]) / r3; bz += (dl[0] * r[1] - dl[1] * r[0]) / r3;
      }
      return [bx, by, bz];
    }
    function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
    // 자기장선 추적 (z=0 평면, 축 대칭을 이용해 y=0 평면으로 돌려 한 번 더 그린다)
    function trace(start, pts) {
      var line = [start.slice()], p = start.slice(), h = 0.05;
      for (var k = 0; k < 500; k++) {
        var d1 = norm(B(p, pts)), mid = [p[0] + d1[0] * h / 2, p[1] + d1[1] * h / 2, 0], d2 = norm(B(mid, pts));
        p = [p[0] + d2[0] * h, p[1] + d2[1] * h, 0]; line.push(p);
        if (Math.abs(p[0]) > 3.4 || Math.abs(p[1]) > 2.9) break;
        if (k > 20 && Math.hypot(p[0] - start[0], p[1] - start[1]) < h * 1.2) { line.push(start.slice()); break; }
      }
      return line;
    }
    var cache = {};
    function build(mode) {
      if (cache[mode]) return cache[mode];
      var pts = wirePts(mode), lines = [], needles = [], i, j;
      if (mode === 'line') {   // 원은 전류 +y일 때의 자기장 방향 순서로 잇는다
        [-1.6, 0, 1.6].forEach(function (y) { [0.7, 1.4, 2.1].forEach(function (r) { var c = []; for (var k = 0; k <= 60; k++) { var a = k / 60 * Math.PI * 2; c.push([r * Math.cos(a), y, -r * Math.sin(a)]); } lines.push(c); }); });
        [1.0, 1.8].forEach(function (r) { for (var k = 0; k < 8; k++) { var a = k / 8 * Math.PI * 2 + 0.2; needles.push({ p: [r * Math.cos(a), -0.8, r * Math.sin(a)], e1: [1, 0, 0], e2: [0, 0, 1] }); } });
      } else {
        var starts = mode === 'loop' ? [0.25, 0.55, 0.85, 1.6, 2.1] : [0.2, 0.45, 0.68];
        starts.forEach(function (y0) {
          [1, -1].forEach(function (sg) {
            var L = trace([0, sg * y0, 0], pts);
            if (L[L.length - 1] !== L[0] && (Math.abs(L[L.length - 1][0]) > 3.3 || Math.abs(L[L.length - 1][1]) > 2.8)) {   // 열린 선: 반대 방향으로도 추적
              var back = traceBack([0, sg * y0, 0], pts); L = back.reverse().concat(L.slice(1));
            }
            lines.push(L); lines.push(L.map(function (q) { return [q[0], 0, q[1]]; }));
          });
        });
        var axis = [], axb = [];   // 축 위의 선
        for (i = -34; i <= 34; i++) axis.push([i / 10, 0, 0]);
        lines.push(axis); void axb;
        for (i = -3; i <= 3; i++) for (j = -2; j <= 2; j++) {
          var p = [i * 0.95, j * 1.0 + 0.5 * (i % 2 ? 0.5 : 0), 0];
          if (Math.abs(p[1]) > 2.4) continue;
          var close = false; pts.forEach(function (q) { if (Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) < 0.32) close = true; });
          if (!close) needles.push({ p: p, e1: [1, 0, 0], e2: [0, 1, 0] });
        }
      }
      needles.forEach(function (nd) { var b = B(nd.p, pts); nd.ang = Math.atan2(b[0] * nd.e2[0] + b[1] * nd.e2[1] + b[2] * nd.e2[2], b[0] * nd.e1[0] + b[1] * nd.e1[1] + b[2] * nd.e1[2]); });
      cache[mode] = { pts: pts, lines: lines, needles: needles };
      return cache[mode];
    }
    function traceBack(start, pts) {
      var line = [start.slice()], p = start.slice(), h = 0.05;
      for (var k = 0; k < 500; k++) {
        var d1 = norm(B(p, pts)), mid = [p[0] - d1[0] * h / 2, p[1] - d1[1] * h / 2, 0], d2 = norm(B(mid, pts));
        p = [p[0] - d2[0] * h, p[1] - d2[1] * h, 0]; line.push(p);
        if (Math.abs(p[0]) > 3.4 || Math.abs(p[1]) > 2.9) break;
      }
      return line;
    }

    var prevDir = 1;
    var S = api.scene3d({
      yaw: 0.5, pitch: 0.38, dist: 11, scale: 0.15, label: '전류가 흐르는 도선 주위의 자기장과 나침반 바늘',
      draw: function (g, T) {
        var D = build(st.mode), dir = st.dir;
        // 자기장선 + 방향 화살표
        D.lines.forEach(function (L) {
          g.path(L, T.figBlue, { width: 1.4, alpha: 0.75 });
          var every = st.mode === 'line' ? 15 : 28;
          for (var k = every / 2 | 0; k < L.length - 1; k += every) {
            var a = L[k], b = L[k + 1], d = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]), s = 0.22 * dir;
            g.arrow([a[0] - d[0] * s / 2, a[1] - d[1] * s / 2, a[2] - d[2] * s / 2], [a[0] + d[0] * s / 2, a[1] + d[1] * s / 2, a[2] + d[2] * s / 2], T.figBlue, { width: 1.4, head: 8 });
          }
        });
        // 도선과 전류
        g.path(D.pts, T.figAmber, { width: 4 });
        var P = D.pts, n = P.length - 1, marks = st.mode === 'line' ? [6, 30] : st.mode === 'loop' ? [9, 27, 45, 63] : [];
        if (st.mode === 'sol') for (var t = 0; t < 7; t++) marks.push(t * 40 + 10);
        marks.forEach(function (k) {
          var a = P[k], b = P[Math.min(n, k + (st.mode === 'line' ? 4 : 3))];
          if (dir < 0) { var tmp = a; a = b; b = tmp; }
          var d = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]), L = 0.45;
          g.arrow(a, [a[0] + d[0] * L, a[1] + d[1] * L, a[2] + d[2] * L], T.figAmber, { width: 4, head: 12 });
        });
        var lp = st.mode === 'line' ? (dir > 0 ? [0.25, 2.5, 0] : [0.25, -2.5, 0]) : st.mode === 'loop' ? [0, 1.55, 0.6] : [0, 1.25, 0.6];
        g.text(lp, '전류 I', { color: T.figAmber, bold: true, size: 13, align: 'left' });
        if (st.mode === 'sol') {
          g.text([2.15 * dir, 0.35, 0], 'N', { color: T.figRed, bold: true, size: 16 });
          g.text([-2.15 * dir, 0.35, 0], 'S', { color: T.figBlue, bold: true, size: 16 });
        }
        // 나침반 바늘
        D.needles.forEach(function (nd) {
          var target = nd.ang + (dir < 0 ? Math.PI : 0), from = nd.ang + (prevDir < 0 ? Math.PI : 0);
          var a = from + (target - from) * st.anim;   // 반 바퀴 돌아선다
          var u = [nd.e1[0] * Math.cos(a) + nd.e2[0] * Math.sin(a), nd.e1[1] * Math.cos(a) + nd.e2[1] * Math.sin(a), nd.e1[2] * Math.cos(a) + nd.e2[2] * Math.sin(a)];
          var s = 0.2, p = nd.p;
          g.line([p[0] - u[0] * s, p[1] - u[1] * s, p[2] - u[2] * s], p, T.figMuted, { width: 3.5 });
          g.arrow(p, [p[0] + u[0] * s, p[1] + u[1] * s, p[2] + u[2] * s], T.figRed, { width: 3.5, head: 7 });
          g.sphere(p, 0.035, T.figInk, { flat: true });
        });
      },
    });

    var g1 = api.group();
    var bs = [['line', '직선 도선'], ['loop', '원형 도선'], ['sol', '솔레노이드']].map(function (m, i) {
      return api.button(m[1], function () { setMode(m[0]); }, { toggle: true, pressed: i === 0, parent: g1 });
    });
    api.button('전류 방향 바꾸기', function () { flip(); }, { primary: true, parent: g1 });
    function setMode(m) {
      st.mode = m; st.anim = 1; prevDir = st.dir;
      bs.forEach(function (b, i) { b.setAttribute('aria-pressed', ['line', 'loop', 'sol'][i] === m ? 'true' : 'false'); });
      readouts(); S.redraw();
    }
    var flipping = false;
    function flip() {
      prevDir = st.dir; st.dir = -st.dir; readouts();
      if (api.reduced) { st.anim = 1; S.redraw(); return; }
      st.anim = 0;
      if (!flipping) { flipping = true; S.onFrame(function (dt) { if (st.anim < 1) st.anim = Math.min(1, st.anim + dt / 0.8); }); }
      S.redraw();
    }
    function readouts() {
      var up = st.dir > 0;
      if (st.mode === 'line') {
        rShape.set('직선 도선, 전류 ' + (up ? '위쪽' : '아래쪽') + ' 방향');
        rRule.set('도선을 중심으로 한 동심원 — 위에서 내려다보면 ' + (up ? '시계 반대 방향' : '시계 방향'));
      } else if (st.mode === 'loop') {
        rShape.set('원형 도선 (처음 시점에서 고리는 오른쪽을 향해 놓임)');
        rRule.set('고리 중심에서 고리 면을 수직으로 꿰뚫어 ' + (up ? '오른쪽' : '왼쪽') + ' 방향');
      } else {
        rShape.set('솔레노이드 (처음 시점에서 축이 좌우로 놓임)');
        rRule.set('내부는 ' + (up ? '왼쪽 → 오른쪽' : '오른쪽 → 왼쪽') + '으로 고르게, ' + (up ? '오른쪽' : '왼쪽') + ' 끝이 N극');
      }
    }
    readouts(); S.redraw();
  },
});
