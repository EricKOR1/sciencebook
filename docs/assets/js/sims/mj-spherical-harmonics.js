/* 수학 도구 8 특수 함수: 구면 조화 함수 Yₗᵐ을 극좌표 표면으로 돌려 보기 (3D)
   복소 Yₗᵐ: 콘던–쇼틀리 규약, Yₗᵐ = (−1)ᵐ Nₗₘ Pₗᵐ(cosθ) e^(imφ) (m > 0), Yₗ⁻ᵐ = (−1)ᵐ Yₗᵐ*
   실수 조합: m > 0 → √2 Nₗₘ Pₗᵐ cos mφ, m < 0 → √2 Nₗ|ₘ| Pₗ|ₘ| sin|m|φ (원고 ⑦: pₓ = (Y₁⁻¹ − Y₁¹)/√2 ∝ +sinθ cosφ) */
Sims.register('mj-spherical-harmonics', {
  title: '구면 조화 함수 Yₗᵐ — 크기와 위상, 실수 오비탈과 마디',
  caption: 'l과 m을 고르고 끌어서 돌려 보자. 표면까지의 거리가 그 방향의 |Y|이다. ‘복소 Yₗᵐ’ 보기에서는 색이 위상(arg Y)을 나타내며, |Yₗᵐ|은 z축 둘레로 대칭이고 위상만 φ 둘레로 m번 돈다. ‘실수 조합’ 보기는 화학에서 그리는 오비탈(빨강 +, 파랑 −)로, 각 마디가 모두 l개(마디 원뿔 l − |m|개 + z축을 지나는 마디면 |m|개)이다. |m| > l이면 연관 르장드르 함수가 0이 되어 함수가 없다. 화면 크기는 모양을 비교하도록 맞춘 것이다.',
  init: function (api) {
    var st = { l: 2, m: 0, view: 'real', nodes: true };
    var NT = 30, NP = 48;
    function fact(n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; }
    // 콘던–쇼틀리 위상이 없는 연관 르장드르 함수 Pₗᵐ(x), m ≥ 0
    function plm(l, m, x) {
      var pmm = 1, s = Math.sqrt(Math.max(0, 1 - x * x));
      for (var i = 1; i <= m; i++) pmm *= (2 * i - 1) * s;
      if (l === m) return pmm;
      var p1 = x * (2 * m + 1) * pmm;
      if (l === m + 1) return p1;
      var p0 = pmm, pl = 0;
      for (var ll = m + 2; ll <= l; ll++) { pl = ((2 * ll - 1) * x * p1 - (ll + m - 1) * p0) / (ll - m); p0 = p1; p1 = pl; }
      return pl;
    }
    function norm(l, am) { return Math.sqrt((2 * l + 1) / (4 * Math.PI) * fact(l - am) / fact(l + am)); }
    // 방향 (θ, φ)의 함숫값: 실수 보기 → {v}, 복소 보기 → {re, im}
    function value(th, ph) {
      var l = st.l, m = st.m, am = Math.abs(m), base = norm(l, am) * plm(l, am, Math.cos(th));
      if (st.view === 'real') {
        if (m === 0) return { re: base, im: 0 };
        return { re: Math.SQRT2 * base * (m > 0 ? Math.cos(am * ph) : Math.sin(am * ph)), im: 0 };
      }
      var sgn = (m > 0 && am % 2 === 1) ? -1 : 1;   // (−1)ᵐ는 m > 0에만
      return { re: sgn * base * Math.cos(m * ph), im: sgn * base * Math.sin(m * ph) };
    }
    function thetaNodes() {
      var l = st.l, am = Math.abs(st.m), out = [], N = 2000, prev = plm(l, am, 1 - 1e-9);
      for (var i = 1; i < N; i++) {
        var x = 1 - 2 * i / N, v = plm(l, am, x);
        if (v === 0 || (v > 0) !== (prev > 0)) {
          var a = x + 2 / N, b = x;
          for (var k = 0; k < 40; k++) { var c = (a + b) / 2; if ((plm(l, am, c) > 0) === (plm(l, am, a) > 0)) a = c; else b = c; }
          out.push(Math.acos((a + b) / 2));
        }
        prev = v;
      }
      return out;
    }
    function hex(c) {
      c = (c || '').trim(); var m = /^#([0-9a-f]{6})/i.exec(c);
      if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
      m = /^rgba?\(([^)]+)\)/i.exec(c); if (m) { var p = m[1].split(/[\s,\/]+/).map(parseFloat); return [p[0], p[1], p[2]]; }
      return [128, 128, 128];
    }
    function shade(rgb, k) { return 'rgb(' + rgb.map(function (v) { return Math.round(Math.min(255, v * k)); }).join(',') + ')'; }
    function hsl(h, s, l) {
      var a = s * Math.min(l, 1 - l), f = function (n) { var k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
      return [255 * f(0), 255 * f(8), 255 * f(4)];
    }
    // 화학 좌표 (x, y, z) → 화면 좌표 [x, z, −y]
    function P(x, y, z) { return [x, z, -y]; }

    var rL = api.readout('l, m'), rTot = api.readout('각 마디 총수'), rCone = api.readout('마디 원뿔'), rPlane = api.readout('마디면');

    var S = api.scene3d({
      yaw: 0.5, pitch: 0.38, dist: 10, scale: 0.15, label: '구면 조화 함수의 극좌표 표면',
      draw: function (g, T, S) {
        var axLen = 2.7;
        [[[axLen, 0, 0], 'x'], [[0, axLen, 0], 'y'], [[0, 0, axLen], 'z']].forEach(function (a) {
          var e = P(a[0][0], a[0][1], a[0][2]);
          g.line([0, 0, 0], e, T.figMuted, { width: 1.2 });
          g.arrow([e[0] * 0.92, e[1] * 0.92, e[2] * 0.92], e, T.figMuted, { width: 1.2, head: 8 });
          g.text([e[0] * 1.08, e[1] * 1.08, e[2] * 1.08], a[1], { color: T.figMuted, size: 13 });
        });
        if (Math.abs(st.m) > st.l) {
          g.text([0, 0.3, 0], '|m| > l: 함수가 0이다', { color: T.figRed, size: 15, bold: true });
          g.text([0, -0.3, 0], '(Pₗᵐ은 Pₗ을 |m|번 미분 → 0)', { color: T.figMuted, size: 12 });
          return;
        }
        // 격자 값과 최댓값
        var grid = [], vmax = 0, i, j;
        for (i = 0; i <= NT; i++) {
          var row = [], th = Math.PI * i / NT;
          for (j = 0; j <= NP; j++) {
            var ph = 2 * Math.PI * j / NP, v = value(th, ph), r = Math.hypot(v.re, v.im);
            vmax = Math.max(vmax, r); row.push({ th: th, ph: ph, v: v, r: r });
          }
          grid.push(row);
        }
        var R = 2.1 / vmax;
        function pt(c) { var r = c.r * R; return P(r * Math.sin(c.th) * Math.cos(c.ph), r * Math.sin(c.th) * Math.sin(c.ph), r * Math.cos(c.th)); }
        // 보는 방향(밝기 계산용): book.js 의 회전과 같은 식
        var cy = Math.cos(S.yaw), sy = Math.sin(S.yaw), cp = Math.cos(S.pitch), sp = Math.sin(S.pitch);
        function depthDir(p) { var z1 = -p[0] * sy + p[2] * cy; return p[1] * sp + z1 * cp; }
        var red = hex(T.figRed), blue = hex(T.figBlue);
        for (i = 0; i < NT; i++) for (j = 0; j < NP; j++) {
          var c00 = grid[i][j], c10 = grid[i + 1][j], c11 = grid[i + 1][j + 1], c01 = grid[i][j + 1];
          var q = [pt(c00), pt(c10), pt(c11), pt(c01)];
          var u1 = [q[2][0] - q[0][0], q[2][1] - q[0][1], q[2][2] - q[0][2]], u2 = [q[3][0] - q[1][0], q[3][1] - q[1][1], q[3][2] - q[1][2]];
          var n = [u1[1] * u2[2] - u1[2] * u2[1], u1[2] * u2[0] - u1[0] * u2[2], u1[0] * u2[1] - u1[1] * u2[0]];
          var nl = Math.hypot(n[0], n[1], n[2]); if (nl < 1e-12) continue;
          var lam = Math.abs(depthDir([n[0] / nl, n[1] / nl, n[2] / nl]));
          var k = 0.55 + 0.5 * lam;
          var tc = (c00.th + c11.th) / 2, pc = (c00.ph + c11.ph) / 2, vc = value(tc, pc), col;
          if (st.view === 'real') col = shade(vc.re >= 0 ? red : blue, k);
          else {
            var ang = Math.atan2(vc.im, vc.re) * 180 / Math.PI; if (ang < 0) ang += 360;
            col = shade(hsl(ang, 0.75, T.dark ? 0.55 : 0.5), k);
          }
          g.poly(q, col, { alpha: 1 });
        }
        // 마디 표시
        if (st.nodes && st.view === 'real') {
          var Rn = 2.45;
          thetaNodes().forEach(function (t) {
            var cz = Rn * Math.cos(t), rr = Rn * Math.sin(t);
            g.circle(P(0, 0, cz), rr, [0, 1, 0], T.figInk, { dash: [4, 4], width: 1.3 });
            [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].forEach(function (a) { g.line([0, 0, 0], P(rr * Math.cos(a), rr * Math.sin(a), cz), T.figInk, { dash: [3, 4], width: 1, alpha: 0.6 }); });
          });
          var am = Math.abs(st.m);
          for (var kk = 0; kk < am; kk++) {
            // cos mφ = 0 → φ = (2k+1)π/2m,  sin mφ = 0 → φ = kπ/m
            var phn = st.m > 0 ? (2 * kk + 1) * Math.PI / (2 * am) : kk * Math.PI / am;
            var ex = Math.cos(phn) * 2.3, ey = Math.sin(phn) * 2.3, hz = 1.9;
            g.poly([P(ex, ey, hz), P(-ex, -ey, hz), P(-ex, -ey, -hz), P(ex, ey, -hz)], T.figLine, { alpha: 0.12, stroke: T.figMuted, strokeWidth: 1 });
          }
        }
      },
      overlay: function (ctx, T, S) {
        ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        if (Math.abs(st.m) > st.l) return;
        if (st.view === 'real') {
          ctx.fillStyle = T.figRed; ctx.fillRect(12, 12, 14, 12); ctx.fillStyle = T.figInk; ctx.fillText('+ (양)', 32, 18);
          ctx.fillStyle = T.figBlue; ctx.fillRect(12, 32, 14, 12); ctx.fillStyle = T.figInk; ctx.fillText('− (음)', 32, 38);
          ctx.fillStyle = T.figMuted; ctx.fillText(name(), 12, 60);
        } else {
          var cx = 34, cy = 40, r = 20;
          for (var a = 0; a < 360; a += 6) {
            ctx.beginPath(); ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, -(a) * Math.PI / 180, -(a + 7) * Math.PI / 180, true); ctx.closePath();
            var c = hsl(a + 3, 0.75, T.dark ? 0.55 : 0.5); ctx.fillStyle = 'rgb(' + c.map(Math.round).join(',') + ')'; ctx.fill();
          }
          ctx.fillStyle = T.figInk;
          ctx.fillText('0', cx + r + 4, cy); ctx.fillText('π/2', cx - 8, cy - r - 8); ctx.fillText('π', cx - r - 14, cy);
          ctx.fillStyle = T.figMuted; ctx.fillText('색 = 위상 arg Y', 12, cy + r + 16);
        }
      },
    });
    function name() {
      var l = st.l, m = st.m;
      var nm = { '0,0': 's', '1,0': 'pz', '1,1': 'px', '1,-1': 'py', '2,0': 'dz²', '2,1': 'dxz', '2,-1': 'dyz', '2,2': 'dx²−y²', '2,-2': 'dxy' }[l + ',' + m];
      if (nm) return '오비탈: ' + nm;
      return m === 0 ? '실수 조합: Pₗ(cosθ)' : (m > 0 ? '실수 조합: cos ' + m + 'φ' : '실수 조합: sin ' + (-m) + 'φ');
    }
    function readouts() {
      var l = st.l, m = st.m, am = Math.abs(m);
      rL.set('l = ' + l + ', m = ' + (m < 0 ? '−' + am : m));
      if (am > l) { rTot.set('없음 (함수 = 0)'); rCone.set('–'); rPlane.set('–'); return; }
      rTot.set(l + '개');
      rCone.set((l - am) + '개 (θ = 일정)');
      if (st.view === 'real') rPlane.set(am + '개 (φ = 일정)');
      else rPlane.set(am ? '없음: 대신 위상이 φ 둘레로 ' + am + '번 돈다' : '0개');
    }
    var sl = api.slider({ id: 'mj-spherical-harmonics-l', label: 'l', min: 0, max: 4, step: 1, value: st.l, onInput: function (v) { st.l = v; readouts(); S.redraw(); } });
    api.slider({ id: 'mj-spherical-harmonics-m', label: 'm', min: -4, max: 4, step: 1, value: st.m,
      format: function (v) { return v < 0 ? '−' + (-v) : String(v); }, onInput: function (v) { st.m = v; readouts(); S.redraw(); } });
    var gv = api.group();
    var vb = [
      api.button('실수 조합 (부호)', function () { setView('real'); }, { toggle: true, pressed: true, parent: gv }),
      api.button('복소 Yₗᵐ (크기·위상)', function () { setView('complex'); }, { toggle: true, parent: gv }),
    ];
    function setView(v) { st.view = v; vb[0].setAttribute('aria-pressed', v === 'real' ? 'true' : 'false'); vb[1].setAttribute('aria-pressed', v === 'complex' ? 'true' : 'false'); readouts(); S.redraw(); }
    api.button('마디 보이기/숨기기', function () { st.nodes = !st.nodes; S.redraw(); });
    readouts(); S.redraw();
  },
});
