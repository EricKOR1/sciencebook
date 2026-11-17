/* 일반지구과학 1 규산염 광물: Si–O 사면체가 산소를 공유하는 방식 다섯 가지 (3D) */
Sims.register('u-silicate-structures', {
  title: '규산염 광물의 뼈대 — 사면체가 산소를 나눠 갖는 다섯 가지 방식',
  caption: '구조를 골라 돌려 보자. 빨간 공은 이웃 사면체와 함께 쓰는 산소, 주황 공은 한 사면체만 쓰는 산소, 파란 작은 공은 규소이다. 공유하는 산소가 0→2→2.5→3→4개로 늘수록 Si:O 비가 1:4에서 1:2로 줄고, 규소 1개당 남는 음전하(양이온이 채워야 할 몫)도 4에서 0으로 줄어든다. 사면체만 그렸고 양이온·실제 결정의 비틀림은 생략했으며, 모형 가장자리의 산소는 실제 결정에서는 다음 사면체와 공유된다.',
  init: function (api) {
    var SIO = 1, A = 2 * Math.sqrt(2 / 3) * SIO;           // Si–O 거리, 사면체 모서리
    var HAP = A * Math.sqrt(2 / 3), HSI = HAP / 4;            // 밑면에서 위 꼭짓점·규소까지의 높이
    var info = {
      iso: { name: '독립형', share: '0개', ratio: '1 : 4', unit: '(SiO₄)⁴⁻', charge: '4', ex: '감람석, 석류석' },
      single: { name: '단사슬', share: '2개', ratio: '1 : 3', unit: '(SiO₃)²⁻', charge: '2', ex: '휘석' },
      double: { name: '복사슬', share: '2개와 3개 번갈아(평균 2.5)', ratio: '1 : 2.75', unit: '(Si₄O₁₁)⁶⁻', charge: '1.5', ex: '각섬석' },
      sheet: { name: '판상', share: '3개', ratio: '1 : 2.5', unit: '(Si₂O₅)²⁻', charge: '1', ex: '운모, 점토 광물' },
      frame: { name: '망상(3차원)', share: '4개', ratio: '1 : 2', unit: 'SiO₂', charge: '0', ex: '석영, 장석(Al 치환)' },
    };
    var state = { kind: 'single', faces: true };
    var model = null;

    // ── 평면 사면체 배열(밑면 산소가 한 평면, 위 꼭짓점이 모두 위쪽) ──
    function flatModel(sites2d) {
      var tris = [], n = sites2d.length, i, j, k;
      function d(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
        if (Math.abs(d(sites2d[i], sites2d[j]) - 1) > 1e-6) continue;
        for (k = j + 1; k < n; k++) if (Math.abs(d(sites2d[i], sites2d[k]) - 1) < 1e-6 && Math.abs(d(sites2d[j], sites2d[k]) - 1) < 1e-6) tris.push([i, j, k]);
      }
      var O = sites2d.map(function (p) { return { p: [p[0] * A, 0, p[1] * A], n: 0 }; });
      var tets = [];
      tris.forEach(function (t) {
        t.forEach(function (ix) { O[ix].n++; });
        var cx = 0, cz = 0; t.forEach(function (ix) { cx += O[ix].p[0]; cz += O[ix].p[2]; }); cx /= 3; cz /= 3;
        var ap = O.length; O.push({ p: [cx, HAP, cz], n: 1 });
        tets.push({ si: [cx, HSI, cz], o: [t[0], t[1], t[2], ap] });
      });
      return { O: O, tets: tets };
    }
    function kagome(rows, cols) {
      var s = [], h = Math.sqrt(3) / 2;
      rows.forEach(function (r) {
        if (r % 2 === 0) for (var k = 0; k <= cols; k++) s.push([k, r * h]);
        else { var off = ((r % 4) + 4) % 4 === 1 ? 0.5 : 1.5; for (var x = off; x <= cols + 1e-9; x += 2) s.push([x, r * h]); }
      });
      return s;
    }
    function build(kind) {
      var m, h = Math.sqrt(3) / 2;
      if (kind === 'iso') {
        m = { O: [], tets: [] };
        [[-1.6, -1.6, 1], [1.6, -1.6, -1], [-1.6, 1.6, -1], [1.6, 1.6, 1]].forEach(function (c) {
          var up = c[2], base = up > 0 ? 0 : HAP, apex = up > 0 ? HAP : 0, idx = [];
          for (var q = 0; q < 3; q++) {
            var a = q * 2 * Math.PI / 3 + (up > 0 ? 0 : Math.PI / 3), R = A / Math.sqrt(3);
            idx.push(m.O.length); m.O.push({ p: [c[0] + R * Math.cos(a), base - HAP / 2, c[1] + R * Math.sin(a)], n: 1 });
          }
          idx.push(m.O.length); m.O.push({ p: [c[0], apex - HAP / 2, c[1]], n: 1 });
          m.tets.push({ si: [c[0], (up > 0 ? HSI : HAP - HSI) - HAP / 2, c[1]], o: idx });
        });
      } else if (kind === 'single') {
        var s1 = []; for (var k = 0; k <= 6; k++) s1.push([k, 0]);
        for (k = 0; k < 6; k++) s1.push([k + 0.5, k % 2 ? h : -h]);
        m = flatModel(s1);
      } else if (kind === 'double') {
        var s2 = []; for (k = 0; k <= 6; k++) { s2.push([k, 0]); s2.push([k, 2 * h]); }
        for (k = 0; k < 6; k++) { if (k % 2 === 0) { s2.push([k + 0.5, -h]); s2.push([k + 0.5, 3 * h]); } else s2.push([k + 0.5, h]); }
        m = flatModel(s2);
      } else if (kind === 'sheet') {
        m = flatModel(kagome([-1, 0, 1, 2, 3, 4], 6));
      } else {
        m = frameModel();
      }
      // 가운데로 옮기고 크기 맞추기
      var c = [0, 0, 0]; m.O.forEach(function (o) { c[0] += o.p[0]; c[1] += o.p[1]; c[2] += o.p[2]; });
      c = c.map(function (v) { return v / m.O.length; });
      var R = 0; m.O.forEach(function (o) { R = Math.max(R, Math.hypot(o.p[0] - c[0], o.p[1] - c[1], o.p[2] - c[2])); });
      var f = Math.min(1, (kind === 'frame' ? 2.4 : 2.8) / R);
      function T(p) { return [(p[0] - c[0]) * f, (p[1] - c[1]) * f, (p[2] - c[2]) * f]; }
      m.O.forEach(function (o) { o.q = T(o.p); });
      m.tets.forEach(function (t) { t.q = T(t.si); });
      m.f = f;
      return m;
    }
    // 망상: 다이아몬드 격자 위치의 규소, 규소 사이 가운데에 산소(이상화한 크리스토발석 모형)
    function frameModel() {
      var d = 2 * SIO / Math.sqrt(3), dirsA = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
      var si = [{ p: [0, 0, 0], a: true }], seen = { '0,0,0': true }, frontier = [si[0]];
      for (var shell = 0; shell < 2; shell++) {
        var next = [];
        frontier.forEach(function (s) {
          dirsA.forEach(function (v) {
            var sg = s.a ? 1 : -1, p = [s.p[0] + sg * v[0] * d, s.p[1] + sg * v[1] * d, s.p[2] + sg * v[2] * d];
            var key = p.map(function (x) { return Math.round(x * 100); }).join(',');
            if (seen[key]) return; seen[key] = true;
            var ns = { p: p, a: !s.a }; si.push(ns); next.push(ns);
          });
        });
        frontier = next;
      }
      var O = [], okey = {}, tets = [];
      si.forEach(function (s) {
        var idx = [];
        dirsA.forEach(function (v) {
          var sg = s.a ? 1 : -1, p = [s.p[0] + sg * v[0] * d / 2, s.p[1] + sg * v[1] * d / 2, s.p[2] + sg * v[2] * d / 2];
          var key = p.map(function (x) { return Math.round(x * 100); }).join(',');
          if (okey[key] == null) { okey[key] = O.length; O.push({ p: p, n: 0 }); }
          O[okey[key]].n++; idx.push(okey[key]);
        });
        tets.push({ si: s.p, o: idx });
      });
      // 보기 좋게 [1,1,1] 축이 위를 향하도록 돌린다
      var ax = [1, 1, 1].map(function (v) { return v / Math.sqrt(3); });
      function rotUp(p) {   // ax → y축 회전(로드리게스)
        var k = [-ax[2], 0, ax[0]], kl = Math.hypot(k[0], k[1], k[2]); k = k.map(function (v) { return v / kl; });
        var th = Math.acos(ax[1]), c = Math.cos(th), s = Math.sin(th);
        var kxp = [k[1] * p[2] - k[2] * p[1], k[2] * p[0] - k[0] * p[2], k[0] * p[1] - k[1] * p[0]], kd = k[0] * p[0] + k[1] * p[1] + k[2] * p[2];
        return [0, 1, 2].map(function (i) { return p[i] * c + kxp[i] * s + k[i] * kd * (1 - c); });
      }
      O.forEach(function (o) { o.p = rotUp(o.p); });
      tets.forEach(function (t) { t.si = rotUp(t.si); });
      return { O: O, tets: tets };
    }

    var rKind = api.readout('구조');
    var rShare = api.readout('사면체당 공유 산소');
    var rRatio = api.readout('Si : O');
    var rUnit = api.readout('기본 단위');
    var rCharge = api.readout('Si 1개당 음전하');
    var rEx = api.readout('대표 광물');

    var S = api.scene3d({
      yaw: 0.5, pitch: 0.55, dist: 16, scale: 0.15, label: 'Si–O 사면체가 연결된 입체 모형',
      draw: function (g, T) {
        if (!model) return;
        var rO = 0.3 * model.f, rS = 0.17 * model.f;
        model.tets.forEach(function (t) {
          var P = t.o.map(function (i) { return model.O[i].q; });
          if (state.faces) {
            [[0, 1, 2], [0, 1, 3], [1, 2, 3], [0, 2, 3]].forEach(function (f) { g.poly([P[f[0]], P[f[1]], P[f[2]]], T.figSoftBlue, { alpha: 0.32 }); });
          }
          for (var a = 0; a < 4; a++) for (var b = a + 1; b < 4; b++) g.line(P[a], P[b], T.figBlue, { width: 1.3, alpha: 0.85 });
          g.sphere(t.q, rS, T.figBlue);
        });
        model.O.forEach(function (o) { g.sphere(o.q, rO, o.n > 1 ? T.figRed : T.figAmber); });
      },
    });

    var grp = api.group();
    var order = ['iso', 'single', 'double', 'sheet', 'frame'];
    var btns = order.map(function (k) {
      return api.button(info[k].name, function () { pick(k); }, { toggle: true, pressed: k === state.kind, parent: grp });
    });
    var fb = api.button('사면체 면 보이기', function () { state.faces = !state.faces; fb.setAttribute('aria-pressed', state.faces ? 'true' : 'false'); S.redraw(); }, { toggle: true, pressed: true });

    function pick(k) {
      state.kind = k; model = build(k);
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', order[i] === k ? 'true' : 'false'); });
      var I = info[k];
      rKind.set(I.name); rShare.set(I.share); rRatio.set(I.ratio); rUnit.set(I.unit); rCharge.set(I.charge); rEx.set(I.ex);
      S.redraw();
    }
    pick(state.kind);
  },
});
