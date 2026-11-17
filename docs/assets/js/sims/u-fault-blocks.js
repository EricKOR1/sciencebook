/* 일반지구과학 3 단층: 주향·경사가 정해진 단층면을 따라 상반이 움직이는 블록 모형 (3D) */
Sims.register('u-fault-blocks', {
  title: '단층 블록 돌려 보기 — 주향, 경사, 상반과 하반',
  caption: '단층의 종류를 고르고 ‘미끄러뜨리기’를 눌러 보자. 정단층은 상반이 단층면을 따라 내려가고, 역단층은 올라가며, 주향 이동 단층은 수평으로 어긋난다. 주향·경사 슬라이더로 단층면의 방향을 바꿔 보고 ‘응력 보기’로 최대 주응력 σ₁(굵은 빨강)과 최소 주응력 σ₃(파랑)의 방향을 확인하자(앤더슨 이론: 정단층은 σ₁ 연직, 역단층은 σ₃ 연직, 주향 이동 단층은 σ₂ 연직). 지층은 처음에 수평이었다고 가정했고, 미끄러진 양은 보기 쉽게 크게 그렸다.',
  init: function (api) {
    var BX = 3, BZ = 2, BY = 2, LAYER = 0.4;
    var types = {
      normal: { name: '정단층', dip: 60, sense: '상반이 아래로' },
      reverse: { name: '역단층', dip: 30, sense: '상반이 위로' },
      right: { name: '주향 이동 단층(오른쪽 어긋남)', dip: 90, sense: '수평으로 어긋남' },
      left: { name: '주향 이동 단층(왼쪽 어긋남)', dip: 90, sense: '수평으로 어긋남' },
    };
    var state = { type: 'normal', strike: 0, dip: 60, slip: 0.7, stress: false, anim: false };

    var rType = api.readout('단층');
    var rStrike = api.readout('주향');
    var rDip = api.readout('경사');
    var rComp = api.readout('미끄러짐 s의 성분');

    function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
    function mul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    function geom() {
      var f = state.strike * Math.PI / 180, d = state.dip * Math.PI / 180;
      var s = [Math.sin(f), 0, -Math.cos(f)];                 // 주향 방향(북 = −z, 동 = +x)
      var dh = [Math.cos(f), 0, Math.sin(f)];                  // 경사 방향(수평)
      var dd = add(mul(dh, Math.cos(d)), [0, -Math.sin(d), 0]); // 경사 아래 방향
      var n = add(mul(dh, Math.sin(d)), [0, Math.cos(d), 0]);   // 상반 쪽 법선
      var u;
      if (state.type === 'normal') u = dd; else if (state.type === 'reverse') u = mul(dd, -1);
      else if (state.type === 'right') u = mul(s, -1); else u = s;
      return { s: s, dh: dh, dd: dd, n: n, u: mul(u, state.slip), f: f, d: d };
    }
    function clip(poly, nrm, c) {   // nrm·p >= c 쪽만 남김
      var out = [];
      for (var i = 0; i < poly.length; i++) {
        var a = poly[i], b = poly[(i + 1) % poly.length], da = dot(nrm, a) - c, db = dot(nrm, b) - c;
        if (da >= 0) out.push(a);
        if ((da >= 0) !== (db >= 0)) { var t = da / (da - db); out.push(add(a, mul(add(b, mul(a, -1)), t))); }
      }
      return out;
    }
    var FACES = [
      { n: [0, 1, 0], p: [[-BX, 0, -BZ], [BX, 0, -BZ], [BX, 0, BZ], [-BX, 0, BZ]], top: true },
      { n: [0, -1, 0], p: [[-BX, -BY, -BZ], [BX, -BY, -BZ], [BX, -BY, BZ], [-BX, -BY, BZ]] },
      { n: [1, 0, 0], p: [[BX, 0, -BZ], [BX, 0, BZ], [BX, -BY, BZ], [BX, -BY, -BZ]] },
      { n: [-1, 0, 0], p: [[-BX, 0, -BZ], [-BX, 0, BZ], [-BX, -BY, BZ], [-BX, -BY, -BZ]] },
      { n: [0, 0, 1], p: [[-BX, 0, BZ], [BX, 0, BZ], [BX, -BY, BZ], [-BX, -BY, BZ]] },
      { n: [0, 0, -1], p: [[-BX, 0, -BZ], [BX, 0, -BZ], [BX, -BY, -BZ], [-BX, -BY, -BZ]] },
    ];
    function capPoly(G) {
      var big = 20, P = [add(mul(G.s, -big), mul(G.dd, -big)), add(mul(G.s, big), mul(G.dd, -big)), add(mul(G.s, big), mul(G.dd, big)), add(mul(G.s, -big), mul(G.dd, big))];
      P = clip(P, [0, -1, 0], 0); P = clip(P, [0, 1, 0], -BY); P = clip(P, [-1, 0, 0], -BX); P = clip(P, [1, 0, 0], -BX); P = clip(P, [0, 0, -1], -BZ); P = clip(P, [0, 0, 1], -BZ);
      return P;
    }
    function rotv(S, p) {
      var cy = Math.cos(S.yaw), sy = Math.sin(S.yaw), cp = Math.cos(S.pitch), sp = Math.sin(S.pitch);
      var x1 = p[0] * cy + p[2] * sy, z1 = -p[0] * sy + p[2] * cy;
      return [x1, p[1] * cp - z1 * sp, p[1] * sp + z1 * cp];
    }
    function visible(S, poly, nrm) {
      var c = [0, 0, 0]; poly.forEach(function (p) { c = add(c, p); }); c = mul(c, 1 / poly.length);
      var rc = rotv(S, c), rn = rotv(S, nrm);
      return dot(rn, [-rc[0], -rc[1], 16 - rc[2]]) > 0;
    }
    var OFF = [0, BY / 2, 0];
    function W(p) { return add(p, OFF); }
    function wrap(g0) {
      return {
        poly: function (P, c, o) { g0.poly(P.map(W), c, o); },
        line: function (a, b, c, o) { g0.line(W(a), W(b), c, o); },
        arrow: function (a, b, c, o) { g0.arrow(W(a), W(b), c, o); },
        text: function (a, t, o) { g0.text(W(a), t, o); },
      };
    }
    function inPlanePoly(p, poly, G) {   // 단층면 위 점이 볼록 다각형 안에 있는가(면 좌표로)
      var P2 = poly.map(function (q) { return [dot(q, G.s), dot(q, G.dd)]; }), x = dot(p, G.s), y = dot(p, G.dd), sgn = 0;
      for (var i = 0; i < P2.length; i++) {
        var a = P2[i], b = P2[(i + 1) % P2.length], cr = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
        if (Math.abs(cr) < 1e-9) continue;
        if (!sgn) sgn = cr > 0 ? 1 : -1; else if ((cr > 0 ? 1 : -1) !== sgn) return false;
      }
      return true;
    }
    function area(poly) { var a = [0, 0, 0]; for (var i = 1; i + 1 < poly.length; i++) { var u = add(poly[i], mul(poly[0], -1)), v = add(poly[i + 1], mul(poly[0], -1)); a = add(a, [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]); } return Math.hypot(a[0], a[1], a[2]) / 2; }

    var S = api.scene3d({
      yaw: -0.55, pitch: 0.5, dist: 16, scale: 0.11, label: '단층으로 나뉜 두 지각 블록의 입체 모형',
      aspect: function (w) { return w < 560 ? 0.95 : 0.6; },
      draw: function (g0, T, S) {
        var g = wrap(g0);
        var G = geom(), cols = [T.figSoftAmber, T.figSoftGreen, T.figSoftViolet, T.figSoftTeal, T.figSoftRed];
        [-1, 1].forEach(function (side) {
          var nrm = mul(G.n, side), shift = side > 0 ? G.u : [0, 0, 0];
          var polys = FACES.map(function (F) { return { p: clip(F.p, nrm, 0), n: F.n, top: F.top }; });
          polys.push({ p: capPoly(G), n: mul(G.n, -side), cap: true });
          var other = capPoly(G).map(function (q) { return add(q, side > 0 ? [0, 0, 0] : G.u); });   // 맞닿은 상대 블록의 단층면
          polys.forEach(function (F) {
            if (F.p.length < 3 || area(F.p) < 1e-4) return;
            if (!visible(S, F.p.map(function (q) { return W(add(q, shift)); }), F.n)) return;
            // 깊이 정렬이 맞도록 작은 조각으로 나누어 그린다(x·z 방향 0.75, 지층 두께 단위)
            for (var k = 0; k < BY / LAYER; k++) {
              var y0 = -BY + k * LAYER, B = clip(clip(F.p, [0, 1, 0], y0 - 1e-6), [0, -1, 0], -(y0 + LAYER + 1e-6));
              if (F.top) { if (k) break; B = F.p; }
              if (B.length < 3) continue;
              for (var ix = -BX; ix < BX - 1e-9; ix += 0.75) for (var iz = -BZ; iz < BZ - 1e-9; iz += 1) {
                var C = clip(clip(clip(clip(B, [1, 0, 0], ix - 1e-6), [-1, 0, 0], -(ix + 0.75 + 1e-6)), [0, 0, 1], iz - 1e-6), [0, 0, -1], -(iz + 1 + 1e-6));
                if (C.length < 3 || area(C) < 1e-4) continue;
                var Q = C.map(function (q) { return add(q, shift); });
                if (F.cap) {   // 상대 블록과 맞닿아 가려진 단층면 조각은 건너뜀
                  var cc = [0, 0, 0]; Q.forEach(function (q) { cc = add(cc, q); }); cc = mul(cc, 1 / Q.length);
                  if (inPlanePoly(cc, other, G)) continue;
                  g.poly(Q, T.figRed, { alpha: 0.3 });
                } else if (F.top) g.poly(Q, T.figGreen, { alpha: 0.55 });
                else g.poly(Q, cols[k % cols.length], { alpha: 0.95 });
              }
            }
          });
        });
        // 주향선과 북쪽 표시
        g.line(mul(G.s, -2.2), mul(G.s, 2.2), T.figRed, { width: 2.5 });
        g.arrow([-BX + 0.4, 0.05, BZ - 0.3], [-BX + 0.4, 0.05, BZ - 1.3], T.figInk, { width: 2 });
        g.text([-BX + 0.4, 0.1, BZ - 1.6], 'N', { bold: true, size: 13 });
        var hwC = add(add(mul(G.dh, 1.8), [0, 0.05, 0]), G.u), fwC = add(mul(G.dh, -1.8), [0, 0.05, 0]);
        if (state.dip < 89.5) { g.text(add(hwC, [0, 0.35, 0]), '상반', { bold: true, size: 13 }); g.text(add(fwC, [0, 0.35, 0]), '하반', { bold: true, size: 13 }); }
        // 미끄러짐 방향 화살표(상반 위)
        if (state.slip > 0.05) {
          var a0 = add(hwC, [0, 0.2, 0]), du = mul(G.u, 0.9 / state.slip);
          g.arrow(a0, add(a0, du), T.figInk, { width: 2.5 });
        }
        g.text(add(mul(G.s, 2.5), [0, 0.25, 0]), '주향', { size: 12, color: T.figRed });
        if (state.stress) drawStress(g, T, G);
      },
    });
    function drawStress(g, T, G) {
      var big = { width: 6, head: 14 }, small = { width: 2.5, head: 9 };
      function pair(dir, c, len, col, o, r0) {
        [1, -1].forEach(function (sg) { var a = add(c, mul(dir, sg * (r0 + len))), b = add(c, mul(dir, sg * r0)); g.arrow(a, b, col, o); });
      }
      var c = [0, -1, 0];
      if (state.type === 'normal') { pair([0, 1, 0], c, 1.3, T.figRed, big, 1.25); pair(G.dh, c, 0.7, T.figBlue, small, 3.4); }
      else if (state.type === 'reverse') { pair(G.dh, c, 1.3, T.figRed, big, 3.4); pair([0, 1, 0], c, 0.6, T.figBlue, small, 1.25); }
      else {
        var a = (state.type === 'right' ? -30 : 30) * Math.PI / 180;   // σ1은 주향에서 30° 돌아간 방향(지도에서)
        var sE = G.s[0], sN = -G.s[2], ca = Math.cos(a), sa = Math.sin(a);
        var e1 = sE * ca - sN * sa, n1 = sE * sa + sN * ca, d1 = [e1, 0, -n1], d3 = [n1, 0, e1];
        pair(d1, [0, -0.6, 0], 1.3, T.figRed, big, 3.1); pair(d3, [0, -0.6, 0], 0.6, T.figBlue, small, 2.6);
      }
      g.text([0, 2.2, 0], 'σ₁: 굵은 빨강 · σ₃: 파랑', { size: 12 });
    }

    var grp = api.group();
    var order = ['normal', 'reverse', 'right', 'left'];
    var lab = { normal: '정단층', reverse: '역단층', right: '주향 이동(오른쪽)', left: '주향 이동(왼쪽)' };
    var tb = order.map(function (k) { return api.button(lab[k], function () { pick(k); }, { toggle: true, pressed: k === state.type, parent: grp }); });
    var sStrike = api.slider({ id: 'u-fault-blocks-strike', label: '주향', min: 0, max: 175, step: 5, value: 0,
      format: fmtStrike, onInput: function (v) { state.strike = v; upd(); } });
    var sDip = api.slider({ id: 'u-fault-blocks-dip', label: '경사', min: 15, max: 90, step: 5, value: 60,
      format: function (v) { return v + '°'; }, onInput: function (v) { state.dip = v; upd(); } });
    var sSlip = api.slider({ id: 'u-fault-blocks-slip', label: '미끄러진 거리', min: 0, max: 1.2, step: 0.05, value: 0.7,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { state.slip = v; upd(); } });
    api.button('미끄러뜨리기 ▶', function () {
      if (api.reduced) { sSlip.set(1); return; }
      sSlip.set(0); state.anim = true; loop.play();
    }, { primary: true });
    var stb = api.button('응력 보기', function () { state.stress = !state.stress; stb.setAttribute('aria-pressed', state.stress ? 'true' : 'false'); S.redraw(); }, { toggle: true });
    var loop = api.loop(function (dt) {
      if (!state.anim) { loop.pause(); return; }
      var v = Math.min(1, state.slip + dt * 0.6); sSlip.set(v);
      if (v >= 1) { state.anim = false; loop.pause(); }
    });
    loop.pause();

    function fmtStrike(v) { return v === 0 ? 'N–S (N0°E)' : v <= 90 ? 'N' + v + '°E' : 'N' + (180 - v) + '°W'; }
    function dirName(az) {
      var names = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      return names[Math.round(((az % 360) + 360) % 360 / 45) % 8];
    }
    function pick(k) {
      state.type = k; tb.forEach(function (b, i) { b.setAttribute('aria-pressed', order[i] === k ? 'true' : 'false'); });
      sDip.set(types[k].dip);
    }
    function upd() {
      var d = state.dip * Math.PI / 180;
      rType.set(types[state.type].name + ' · ' + types[state.type].sense);
      rStrike.set(fmtStrike(state.strike));
      rDip.set(state.dip >= 90 ? '90° (수직)' : state.dip + '° ' + dirName(state.strike + 90));
      if (state.type === 'normal' || state.type === 'reverse') rComp.set('수직 ' + Math.sin(d).toFixed(2) + 's, 수평 ' + Math.cos(d).toFixed(2) + 's');
      else rComp.set('주향 방향으로 s (수직 0)');
      S.redraw();
    }
    upd();
  },
});
