/* 유기화학 8 콘주게이션계: 전자 고리화 반응의 동방향·역방향 회전 (3D)
   사슬 N(4 또는 6)의 휘켈 계수 c_r ∝ sin(rkπ/(N+1)). 열 = 바닥 상태 HOMO(k = N/2), 빛 = 들뜬 상태의 HOMO(k = N/2 + 1).
   양 끝 탄소를 그 이웃과의 결합 축 둘레로 θ만큼 돌린다. 두 축은 서로 거울상이므로
   동방향 = 두 끝을 같은 회전(C2 대칭), 역방향 = 거울상 회전. 서로를 향한 엽의 부호가 같으면 결합 형성. */
Sims.register('mj-electrocyclic-rotation', {
  title: '전자 고리화 반응 — 동방향·역방향 회전과 오비탈 위상',
  caption: '사슬(4 π 또는 6 π)과 조건(열 = HOMO, 빛 = 들뜬 상태의 HOMO)을 고른 뒤 회전 각도를 0°에서 90°로 올려 보자. 양 끝 탄소가 결합 축 둘레로 돌면서 서로를 향하는 엽의 색이 같으면 초록(결합 형성), 다르면 빨강(반결합 · 금지)이다. ' +
    '4 π 열은 동방향, 6 π 열은 역방향에서만 초록이 되고, 빛에서는 반대가 된다(우드워드–호프만 규칙). 양 끝 치환기를 바꾸면 고리가 닫힌 생성물에서 두 메틸기가 cis인지 trans인지 보여 준다. ' +
    '파랑 = + 위상, 호박색 = − 위상. 결합 길이·각도는 단순화한 모형이다.',
  init: function (api) {
    var st = { N: 6, light: false, con: false, th: 70, sub: [1, 1] };   // sub: 0 = H, 1 = CH₃ 바깥쪽, 2 = CH₃ 안쪽
    var SUBN = ['H', 'CH₃ 바깥쪽', 'CH₃ 안쪽'];
    function geom() {
      var C = [];
      if (st.N === 6) {
        [120, 180, 240, 300, 0, 60].forEach(function (d) { var a = d * Math.PI / 180; C.push([1.45 * Math.cos(a), 0, 1.45 * Math.sin(a)]); });
      } else {
        C = [[-0.78, 0, 0.78], [-0.78, 0, -0.78], [0.78, 0, -0.78], [0.78, 0, 0.78]];
      }
      return C;
    }
    function coef() {
      var N = st.N, k = N / 2 + (st.light ? 1 : 0), c = [];
      for (var r = 1; r <= N; r++) c.push(Math.sin(r * k * Math.PI / (N + 1)));
      return { c: c, k: k };
    }
    function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
    function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
    function mul(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
    function unit(a) { var l = Math.sqrt(dot(a, a)); return mul(a, 1 / l); }
    function rot(v, ax, t) {   // 로드리게스 회전
      var c = Math.cos(t), s = Math.sin(t);
      return add(add(mul(v, c), mul(cross(ax, v), s)), mul(ax, dot(ax, v) * (1 - c)));
    }
    function rotPlane(v, d) { var a = d * Math.PI / 180; return [v[0] * Math.cos(a) - v[2] * Math.sin(a), 0, v[0] * Math.sin(a) + v[2] * Math.cos(a)]; }
    // 양 끝(0: C1, 1: CN)의 회전된 p 방향과 치환기 방향
    function ends(thDeg) {
      var C = geom(), N = st.N, out = [];
      [[0, 1, N - 1], [N - 1, N - 2, 0]].forEach(function (e, j) {
        var Ct = C[e[0]], Cn = C[e[1]], Co = C[e[2]];
        var ax = unit(sub(Ct, Cn));
        var t = thDeg * Math.PI / 180 * (j === 0 ? 1 : (st.con ? 1 : -1));
        var p = rot([0, 1, 0], ax, t);
        var d1 = unit(rotPlane(ax, 60)), d2 = unit(rotPlane(ax, -60));
        var toO = unit(sub(Co, Ct));
        var inside = dot(d1, toO) > dot(d2, toO) ? d1 : d2, outside = inside === d1 ? d2 : d1;
        out.push({ C: Ct, ax: ax, p: p, toO: toO, ins: rot(inside, ax, t), outs: rot(outside, ax, t) });
      });
      return out;
    }
    function verdict() {
      var cf = coef(), E = ends(90), c = cf.c;
      var s1 = c[0] * dot(E[0].p, E[0].toO), s2 = c[st.N - 1] * dot(E[1].p, E[1].toO);
      return { ok: s1 * s2 > 0, k: cf.k, endsSame: c[0] * c[st.N - 1] > 0 };
    }
    var rS = api.readout('오비탈'), rE = api.readout('양 끝 위쪽 엽'), rV = api.readout('이 회전에서'), rP = api.readout('생성물(두 메틸기)');
    var g1 = api.group();
    var b4 = api.button('4 π (뷰타다이엔)', function () { st.N = 4; sync(); }, { toggle: true, parent: g1 });
    var b6 = api.button('6 π (헥사트라이엔)', function () { st.N = 6; sync(); }, { toggle: true, parent: g1 });
    var g2 = api.group();
    var bT = api.button('열 (HOMO)', function () { st.light = false; sync(); }, { toggle: true, parent: g2 });
    var bL = api.button('빛 (들뜬 상태 HOMO)', function () { st.light = true; sync(); }, { toggle: true, parent: g2 });
    var g3 = api.group();
    var bC = api.button('동방향', function () { st.con = true; sync(); }, { toggle: true, parent: g3 });
    var bD = api.button('역방향', function () { st.con = false; sync(); }, { toggle: true, parent: g3 });
    api.slider({ id: 'mj-electrocyclic-rotation-th', label: '양 끝 회전 각도', min: 0, max: 90, step: 1, value: st.th, format: function (v) { return v + '°'; }, onInput: function (v) { st.th = v; sync(); } });
    var g4 = api.group();
    var bA = api.button('왼쪽 끝: ' + SUBN[st.sub[0]], function () { st.sub[0] = (st.sub[0] + 1) % 3; sync(); }, { parent: g4 });
    var bB = api.button('오른쪽 끝: ' + SUBN[st.sub[1]], function () { st.sub[1] = (st.sub[1] + 1) % 3; sync(); }, { parent: g4 });
    function press(b, on) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); }

    var S = api.scene3d({
      yaw: 0.35, pitch: 0.42, dist: 9, scale: 0.17, label: '폴리엔 사슬과 양 끝 p 오비탈의 회전',
      draw: function (g, T) {
        var C = geom(), N = st.N, cf = coef(), c = cf.c, cmax = 0;
        c.forEach(function (v) { cmax = Math.max(cmax, Math.abs(v)); });
        var E = ends(st.th);
        // 결합
        for (var i = 0; i < N - 1; i++) {
          g.line(C[i], C[i + 1], T.figInk, { width: 3 });
          if (i % 2 === 0) g.line(add(C[i], [0, -0.12, 0]), add(C[i + 1], [0, -0.12, 0]), T.figInk, { width: 2 });
        }
        // p 오비탈(엽 = 공 두 개)
        for (var r = 0; r < N; r++) {
          var p = r === 0 ? E[0].p : r === N - 1 ? E[1].p : [0, 1, 0];
          var s = Math.abs(c[r]) / cmax, sg = c[r] >= 0 ? 1 : -1;
          if (s < 1e-6) continue;
          [1, -1].forEach(function (dir) {
            var col = sg * dir > 0 ? T.figBlue : T.figAmber;
            [0.32, 0.62].forEach(function (f, q) {
              g.sphere(add(C[r], mul(p, dir * f * (0.5 + 0.7 * s))), (q ? 0.16 : 0.2) * (0.55 + 0.6 * s), col, { alpha: 0.75 });
            });
          });
        }
        // 원자와 치환기
        for (var a = 0; a < N; a++) g.sphere(C[a], 0.09, T.figInk);
        [0, 1].forEach(function (j) {
          var e = E[j], kind = st.sub[j];
          var me = kind === 1 ? e.outs : kind === 2 ? e.ins : null;
          var hh = kind === 1 ? e.ins : e.outs;
          if (me) { var m = add(e.C, mul(me, 0.85)); g.line(e.C, m, T.figInk, { width: 2.5 }); g.sphere(m, 0.17, T.figMuted, { label: 'CH₃' }); }
          var h = add(e.C, mul(hh, 0.6)); g.line(e.C, h, T.figMuted, { width: 1.5 }); g.sphere(h, 0.08, T.figPaper, { outline: T.figMuted });
          if (kind === 0) { var h2 = add(e.C, mul(e.outs === hh ? e.ins : e.outs, 0.6)); g.line(e.C, h2, T.figMuted, { width: 1.5 }); g.sphere(h2, 0.08, T.figPaper, { outline: T.figMuted }); }
          // 회전 방향 표시(축 둘레 원호)
          var arc = [], ax = e.ax, u = [0, 1, 0], sgn = j === 0 ? 1 : (st.con ? 1 : -1);
          for (var q = 0; q <= 12; q++) arc.push(add(add(e.C, mul(ax, 0.35)), mul(rot(u, ax, sgn * q / 12 * Math.PI * 0.8), 0.55)));
          g.path(arc, T.figViolet, { width: 2 });
          g.arrow(arc[11], arc[12], T.figViolet, { width: 2, head: 8 });
        });
        // 양 끝 사이: 겹침 판정
        var c1 = c[0] * dot(E[0].p, E[0].toO), c2 = c[N - 1] * dot(E[1].p, E[1].toO);
        if (st.th >= 20) {
          var ok = c1 * c2 > 0, col = ok ? T.figGreen : T.figRed;
          g.line(E[0].C, E[1].C, col, { width: 3, dash: [6, 5] });
          g.text(mul(add(E[0].C, E[1].C), 0.5), ok ? '같은 위상 → 결합 형성' : '반대 위상 → 반결합 · 금지', { color: col, size: 13, bold: true, dy: 26 });
        }
      },
    });
    function sync() {
      press(b4, st.N === 4); press(b6, st.N === 6); press(bT, !st.light); press(bL, st.light); press(bC, st.con); press(bD, !st.con);
      bA.textContent = '왼쪽 끝: ' + SUBN[st.sub[0]]; bB.textContent = '오른쪽 끝: ' + SUBN[st.sub[1]];
      var v = verdict();
      rS.set('ψ' + v.k + (st.light ? ' (빛)' : ' (열, HOMO)'));
      rE.set(v.endsSame ? '같은 부호 → 역방향 허용' : '반대 부호 → 동방향 허용');
      rV.set((st.con ? '동방향: ' : '역방향: ') + (v.ok ? '허용' : '금지'));
      if (st.sub[0] && st.sub[1]) {
        var E = ends(90);
        var m1 = st.sub[0] === 1 ? E[0].outs : E[0].ins, m2 = st.sub[1] === 1 ? E[1].outs : E[1].ins;
        var cis = m1[1] * m2[1] > 0;
        var warn = (st.sub[0] === 2 && st.sub[1] === 2) ? ' (안쪽 둘은 입체적으로 매우 불리)' : '';
        rP.set((cis ? 'cis' : 'trans') + warn + (v.ok ? '' : ' — 이 조건에서는 금지된 경로'));
      } else rP.set('메틸기가 둘이 아니면 cis/trans 없음');
      S.redraw();
    }
    sync();
  },
});
