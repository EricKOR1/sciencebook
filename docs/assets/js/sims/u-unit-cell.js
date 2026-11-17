/* 일반화학 6 고체와 결정 구조: 입방 단위 세포 3종 — 입자 수, 배위수, 쌓임 효율, 밀도 (3D) */
Sims.register('u-unit-cell', {
  title: '입방 단위 세포 세 가지 — 몇 개가 들어 있고, 얼마나 촘촘한가',
  caption: '구조를 고르고 끌어서 돌려 보자. ‘위치만 보기’에서는 원자 자리와 한 세포에 속하는 몫(꼭짓점 1/8, 면 1/2, 중심 1)이, ‘실제 크기’에서는 원자가 서로 닿는 방향(모서리·몸 대각선·면 대각선)이 보인다. ‘배위수 보기’는 원자 하나(빨강)에 가장 가까이 닿은 이웃을 이웃 세포까지 그려 센다. 밀도는 대표 금속의 격자 상수로 d = ZM/(Nₐa³)을 계산한 값이다. 원자는 단단한 공으로 가정했다.',
  init: function (api) {
    var NA = 6.022e23;
    var CELLS = [
      { id: 'sc', name: '단순 입방', pts: corners(), Z: '8 × 1/8 = 1', z: 1, cn: 6, rel: 'a = 2r (모서리)', rf: 0.5, eff: Math.PI / 6,
        ex: { el: 'Po', a: 335, M: 209.0 }, ref: [0, 0, 0] },
      { id: 'bcc', name: '체심 입방', pts: corners().concat([[0.5, 0.5, 0.5]]), Z: '8 × 1/8 + 1 = 2', z: 2, cn: 8, rel: '√3 a = 4r (몸 대각선)', rf: Math.sqrt(3) / 4, eff: Math.PI * Math.sqrt(3) / 8,
        ex: { el: 'Fe', a: 286.6, M: 55.85 }, ref: [0.5, 0.5, 0.5] },
      { id: 'fcc', name: '면심 입방', pts: corners().concat([[0.5, 0.5, 0], [0.5, 0.5, 1], [0.5, 0, 0.5], [0.5, 1, 0.5], [0, 0.5, 0.5], [1, 0.5, 0.5]]), Z: '8 × 1/8 + 6 × 1/2 = 4', z: 4, cn: 12,
        rel: '√2 a = 4r (면 대각선)', rf: Math.sqrt(2) / 4, eff: Math.PI / (3 * Math.sqrt(2)), ex: { el: 'Cu', a: 361.5, M: 63.55 }, ref: [0.5, 0.5, 1] },
    ];
    function corners() { var c = []; for (var i = 0; i < 8; i++) c.push([i & 1, (i >> 1) & 1, (i >> 2) & 1]); return c; }
    var state = { k: 2, full: false, cn: false };
    var A = 2.4;   // 화면에서 한 변의 길이
    function P(f) { return [(f[0] - 0.5) * A, (f[2] - 0.5) * A, (f[1] - 0.5) * A]; }
    function share(f) { var n = 0; f.forEach(function (v) { if (v === 0 || v === 1) n++; }); return n === 3 ? '1/8' : n === 2 ? '1/4' : n === 1 ? '1/2' : '1'; }
    function lattice(c) {   // 넓은 범위의 격자점(분수 좌표)
      var basis = c.id === 'sc' ? [[0, 0, 0]] : c.id === 'bcc' ? [[0, 0, 0], [0.5, 0.5, 0.5]] : [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]];
      var out = [];
      for (var i = -1; i <= 2; i++) for (var j = -1; j <= 2; j++) for (var k = -1; k <= 2; k++) basis.forEach(function (b) { out.push([i + b[0], j + b[1], k + b[2]]); });
      return out;
    }
    function neighbors(c) {
      var r0 = c.ref, L = lattice(c), d2 = function (p) { return Math.pow(p[0] - r0[0], 2) + Math.pow(p[1] - r0[1], 2) + Math.pow(p[2] - r0[2], 2); };
      var m = Infinity; L.forEach(function (p) { var d = d2(p); if (d > 1e-6 && d < m) m = d; });
      return L.filter(function (p) { return Math.abs(d2(p) - m) < 1e-6; });
    }
    var rS = api.readout('세포당 원자 수');
    var rC = api.readout('배위수');
    var rR = api.readout('a와 r의 관계');
    var rE = api.readout('쌓임 효율');
    var rD = api.readout('밀도 계산 예');

    var S = api.scene3d({
      yaw: 0.62, pitch: 0.42, dist: 11, scale: 0.15, label: '입방 단위 세포의 입체 모형',
      draw: function (g, T) {
        var c = CELLS[state.k], h = A / 2;
        // 세포 모서리
        var E = [[0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3], [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7]], C = corners();
        E.forEach(function (e) { g.line(P(C[e[0]]), P(C[e[1]]), T.figLine, { width: 1.4 }); });
        var rr = c.rf * A, rSmall = 0.17;
        if (state.cn) {
          var ref = c.ref, nb = neighbors(c);
          c.pts.forEach(function (f) { g.sphere(P(f), rSmall, T.figBlue, { alpha: 0.25 }); });
          nb.forEach(function (f) {
            g.line(P(ref), P(f), T.figRed, { width: 1.6, alpha: 0.7 });
            g.sphere(P(f), 0.24, T.figAmber, { outline: T.figInk });
          });
          g.sphere(P(ref), 0.3, T.figRed, { outline: T.figInk });
          return;
        }
        if (state.full) {
          c.pts.forEach(function (f) { g.sphere(P(f), rr, T.figBlue, { alpha: 0.42 }); });
          // 원자가 닿는 방향
          var a0, b0;
          if (c.id === 'sc') { a0 = [0, 0, 1]; b0 = [1, 0, 1]; }
          else if (c.id === 'bcc') { a0 = [0, 0, 0]; b0 = [1, 1, 1]; }
          else { a0 = [0, 0, 1]; b0 = [1, 1, 1]; }
          g.line(P(a0), P(b0), T.figRed, { width: 3 });
          g.text(P([b0[0], b0[1], b0[2] + 0.12]), c.id === 'sc' ? '모서리 = 2r' : c.id === 'bcc' ? '몸 대각선 = 4r' : '면 대각선 = 4r', { color: T.figRed, size: 12, bold: true });
        } else {
          c.pts.forEach(function (f) {
            var s = share(f);
            g.sphere(P(f), 0.24, s === '1/8' ? T.figBlue : s === '1/2' ? T.figGreen : T.figAmber, { label: s });
          });
        }
        g.text([0, -h - 0.45, 0], 'a', { color: T.figMuted, size: 13 });
      },
    });

    var g1 = api.group();
    var bs = CELLS.map(function (c, i) { return api.button(c.name, function () { state.k = i; sync(); }, { toggle: true, pressed: i === state.k, parent: g1 }); });
    var g2 = api.group();
    var MODES = [['위치만 보기', 'pos'], ['실제 크기', 'full'], ['배위수 보기', 'cn']];
    var ms = MODES.map(function (m, i) { return api.button(m[0], function () { state.full = m[1] === 'full'; state.cn = m[1] === 'cn'; sync(); }, { toggle: true, pressed: i === 0, parent: g2 }); });
    function sync() {
      bs.forEach(function (b, i) { b.setAttribute('aria-pressed', i === state.k ? 'true' : 'false'); });
      var mode = state.cn ? 'cn' : state.full ? 'full' : 'pos';
      ms.forEach(function (b, i) { b.setAttribute('aria-pressed', MODES[i][1] === mode ? 'true' : 'false'); });
      var c = CELLS[state.k], ex = c.ex, aCm = ex.a * 1e-10, d = c.z * ex.M / (NA * aCm * aCm * aCm);
      rS.set(c.Z);
      rC.set(c.cn + (state.cn ? '개 (빨강 원자의 이웃, 이웃 세포 포함)' : '개'));
      rR.set(c.rel);
      rE.set((c.eff * 100).toFixed(1) + ' %');
      rD.set(ex.el + ': a = ' + ex.a + ' pm, r = ' + (c.rf * ex.a).toFixed(1) + ' pm, d = ' + c.z + '×' + ex.M + '/(Nₐa³) = ' + d.toFixed(2) + ' g/cm³');
      S.zoom = state.full ? 0.78 : 1;
      S.redraw();
    }
    sync();
  },
});
