/* 일반화학 4 원자의 전자 구조: 수소 원자 오비탈을 확률 밀도 점구름으로 돌려 보기 (3D) */
Sims.register('u-orbitals', {
  title: '수소 원자 오비탈 — 점구름으로 보는 확률 밀도와 마디',
  caption: '오비탈을 골라 끌어서 돌려 보자. 점 200개는 수소 원자의 파동 함수에서 계산한 확률 밀도 |ψ|²를 따라 뿌린 것이라, 점이 빽빽한 곳이 전자가 발견되기 쉬운 곳이다(가장 바깥 3 %는 생략). 점의 색은 ψ의 부호(파랑 +, 빨강 −)이고, 회색 면·구는 ψ = 0인 마디이다. ‘점 다시 뿌리기’를 눌러도 모양은 같다. 지름 마디는 n − l − 1개, 각 마디는 l개이다. 오비탈마다 화면 배율이 다르므로 실제 크기는 ‘크기’ 값으로 비교한다.',
  init: function (api) {
    var A0 = 52.9;               // 보어 반지름(pm)
    var NPTS = 200, CUT = 0.97;   // 점 개수, 뿌릴 확률 범위
    var SQ3 = Math.sqrt(3);
    // 화학 좌표 (x, y, z) → 화면 좌표: x → x, z → 위(y), y → 화면 안쪽(−z)
    var ORBS = [
      { id: '1s', n: 1, l: 0, R: function (r) { return Math.exp(-r); }, A: function () { return 1; }, Amax: 1, rad: [], ang: 'none' },
      { id: '2s', n: 2, l: 0, R: function (r) { return (2 - r) * Math.exp(-r / 2); }, A: function () { return 1; }, Amax: 1, rad: [2], ang: 'none' },
      { id: '2pz', n: 2, l: 1, R: function (r) { return r * Math.exp(-r / 2); }, A: function (c) { return c[2]; }, Amax: 1, rad: [], ang: 'xy' },
      { id: '3s', n: 3, l: 0, R: function (r) { return (27 - 18 * r + 2 * r * r) * Math.exp(-r / 3); }, A: function () { return 1; }, Amax: 1, rad: [(9 - 3 * SQ3) / 2, (9 + 3 * SQ3) / 2], ang: 'none' },
      { id: '3pz', n: 3, l: 1, R: function (r) { return r * (6 - r) * Math.exp(-r / 3); }, A: function (c) { return c[2]; }, Amax: 1, rad: [6], ang: 'xy' },
      { id: '3dxz', n: 3, l: 2, R: function (r) { return r * r * Math.exp(-r / 3); }, A: function (c) { return c[0] * c[2]; }, Amax: 0.5, rad: [], ang: 'xy-yz' },
      { id: '3dz²', n: 3, l: 2, R: function (r) { return r * r * Math.exp(-r / 3); }, A: function (c) { return 3 * c[2] * c[2] - 1; }, Amax: 2, rad: [], ang: 'cone' },
    ];
    var LNAME = ['s', 'p', 'd'];
    var state = { k: 0, seed: 7, nodes: true, pts: [], scale: 1, r90: 1 };

    function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function prepare() {
      var o = ORBS[state.k], rmax = 12 * o.n * o.n + 10, N = 3000, dr = rmax / N, cdf = [0], s = 0, i;
      for (i = 1; i <= N; i++) { var r = i * dr, v = r * o.R(r); s += v * v * dr; cdf.push(s); }
      for (i = 0; i <= N; i++) cdf[i] /= s;
      function rAt(u) { var lo = 0, hi = N; while (hi - lo > 1) { var m = (lo + hi) >> 1; if (cdf[m] < u) lo = m; else hi = m; } return (lo + (u - cdf[lo]) / Math.max(cdf[hi] - cdf[lo], 1e-12)) * dr; }
      state.r90 = rAt(0.9); var r95 = rAt(0.95);
      state.scale = 2.5 / r95;
      var rand = rng(state.seed * 131 + state.k * 17), pts = [], guard = 0;
      while (pts.length < NPTS && guard++ < 200000) {
        // 방향: 고르게 뽑은 뒤 각 부분 |A|²에 비례해 받아들임
        var z = 2 * rand() - 1, ph = 2 * Math.PI * rand(), q = Math.sqrt(1 - z * z);
        var c = [q * Math.cos(ph), q * Math.sin(ph), z], a = o.A(c);
        if (rand() > (a * a) / (o.Amax * o.Amax)) continue;
        var rr = rAt(rand() * CUT), sign = o.R(rr) * a >= 0 ? 1 : -1;
        pts.push({ p: toScene([c[0] * rr, c[1] * rr, c[2] * rr]), s: sign });
      }
      state.pts = pts;
    }
    function toScene(c) { var k = state.scale; return [c[0] * k, c[2] * k, -c[1] * k]; }

    var rName = api.readout('오비탈');
    var rQ = api.readout('양자수');
    var rNode = api.readout('마디 수');
    var rSize = api.readout('크기(90 % 경계 반지름)');

    var S = api.scene3d({
      yaw: 0.5, pitch: 0.32, dist: 10, scale: 0.14, label: '수소 원자 오비탈의 확률 밀도 점구름과 마디면',
      draw: function (g, T) {
        var o = ORBS[state.k], L = 2.7;
        // 좌표축(화학 좌표 이름)
        g.line([-L, 0, 0], [L, 0, 0], T.figLine, { width: 1, alpha: 0.7 });
        g.line([0, -L, 0], [0, L, 0], T.figLine, { width: 1, alpha: 0.7 });
        g.line([0, 0, L], [0, 0, -L], T.figLine, { width: 1, alpha: 0.7 });
        g.text([L + 0.25, 0, 0], 'x', { color: T.figMuted, size: 13 });
        g.text([0, L + 0.25, 0], 'z', { color: T.figMuted, size: 13 });
        g.text([0, 0, -L - 0.3], 'y', { color: T.figMuted, size: 13 });
        if (state.nodes) drawNodes(g, T, o);
        state.pts.forEach(function (q) {
          g.sphere(q.p, 0.06, q.s > 0 ? T.figBlue : T.figRed, { flat: true, alpha: 0.9 });
        });
        g.sphere([0, 0, 0], 0.08, T.figInk, { flat: true });
      },
      overlay: function (ctx, T, S) {
        ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        var x = 12, y = 16;
        ctx.fillStyle = T.figBlue; ctx.beginPath(); ctx.arc(x + 4, y, 4, 0, 7); ctx.fill();
        ctx.fillStyle = T.figInk; ctx.fillText('ψ > 0', x + 13, y);
        ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(x + 64, y, 4, 0, 7); ctx.fill();
        ctx.fillStyle = T.figInk; ctx.fillText('ψ < 0', x + 73, y);
        if (state.nodes) { ctx.fillStyle = T.figMuted; if (S.w < 480) ctx.fillText('회색 = 마디(ψ = 0)', x, y + 18); else ctx.fillText('회색 = 마디(ψ = 0)', x + 124, y); }
        ctx.fillStyle = T.figInk; ctx.font = '600 15px ' + T.fontBody;
        ctx.fillText(label(ORBS[state.k]), x, S.h - 16);
      },
    });

    function label(o) { return o.id; }
    function drawNodes(g, T, o) {
      var k = state.scale, P = 2.3;
      o.rad.forEach(function (r0) {
        var rs = r0 * k;
        g.sphere([0, 0, 0], rs, T.figMuted, { flat: true, alpha: 0.13 });
        g.circle([0, 0, 0], rs, [0, 1, 0], T.figMuted, { width: 1, dash: [3, 3] });
      });
      if (o.rad.length) {
        var ro = o.rad[o.rad.length - 1] * k;
        g.text([-ro * 0.72, -ro * 0.72, 0], '지름 마디 r = ' + o.rad.map(function (r0) { return Math.round(r0 * A0); }).join(', ') + ' pm', { color: T.figMuted, size: 11, align: 'right', dx: -4 });
      }
      function plane(axis) {   // axis: 화면 좌표에서 평면에 수직인 축 번호
        var n = 6, step = 2 * P / n;
        for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
          var u0 = -P + i * step, v0 = -P + j * step, quad = [[u0, v0], [u0 + step, v0], [u0 + step, v0 + step], [u0, v0 + step]];
          g.poly(quad.map(function (q) { return axis === 1 ? [q[0], 0, q[1]] : axis === 0 ? [0, q[0], q[1]] : [q[0], q[1], 0]; }), T.figMuted, { alpha: 0.1 });
        }
        var c = [[-P, -P], [P, -P], [P, P], [-P, P]].map(function (q) { return axis === 1 ? [q[0], 0, q[1]] : axis === 0 ? [0, q[0], q[1]] : [q[0], q[1], 0]; });
        g.path(c, T.figMuted, { width: 1, closed: true, dash: [4, 3] });
      }
      if (o.ang === 'xy') { plane(1); g.text([P, 0, P], 'xy 평면(각 마디)', { color: T.figMuted, size: 11 }); }
      if (o.ang === 'xy-yz') {
        plane(1); plane(0);
        g.text([P, 0, P], 'xy 평면', { color: T.figMuted, size: 11 });
        g.text([0, P + 0.2, -P], 'yz 평면', { color: T.figMuted, size: 11 });
      }
      if (o.ang === 'cone') {   // 3cos²θ − 1 = 0 인 두 원뿔(θ ≈ 54.7°)
        var t = Math.tan(Math.acos(1 / SQ3));
        [-1, 1].forEach(function (sg) {
          [0.6, 1.2, 1.8].forEach(function (h) { g.circle([0, sg * h, 0], h * t, [0, 1, 0], T.figMuted, { width: 1, dash: [3, 3], fill: T.figMuted, alpha: 0.06 }); });
          for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; g.line([0, 0, 0], [1.8 * t * Math.cos(a), sg * 1.8, 1.8 * t * Math.sin(a)], T.figMuted, { width: 1, alpha: 0.5 }); }
        });
        g.text([1.8 * t, 1.95, 0], '원뿔 마디(θ ≈ 54.7°)', { color: T.figMuted, size: 11, align: 'left' });
      }
    }

    function readouts() {
      var o = ORBS[state.k];
      rName.set(label(o));
      rQ.set('n = ' + o.n + ', l = ' + o.l + ' (' + LNAME[o.l] + ')');
      rNode.set('지름 ' + (o.n - o.l - 1) + ' + 각 ' + o.l + ' = ' + (o.n - 1) + '개');
      rSize.set('약 ' + Math.round(state.r90 * A0) + ' pm');
    }

    var grp = api.group(), btns = ORBS.map(function (o, i) {
      return api.button(label(o), function () { pick(i); }, { toggle: true, pressed: i === 0, parent: grp });
    });
    function pick(i) {
      state.k = i; btns.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      prepare(); readouts(); S.redraw();
    }
    var nodeBtn = api.button('마디 보이기', function () {
      state.nodes = !state.nodes; nodeBtn.setAttribute('aria-pressed', state.nodes ? 'true' : 'false'); S.redraw();
    }, { toggle: true, pressed: true });
    api.button('점 다시 뿌리기', function () { state.seed++; prepare(); S.redraw(); });

    prepare(); readouts(); S.redraw();
  },
});
