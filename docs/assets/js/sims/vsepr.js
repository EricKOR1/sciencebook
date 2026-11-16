/* 화학 2 물질의 구조와 성질: 전자쌍 반발 이론으로 분자 모양 정하기, 결합의 쌍극자와 분자의 극성 (3D) */
Sims.register('vsepr', {
  title: '전자쌍 반발 이론 — 전자쌍이 멀리 떨어지면 분자 모양이 정해진다',
  caption: '분자를 고르고 끌어서 돌려 보자. 중심 원자 주위의 전자쌍(공유 전자쌍은 결합, 비공유 전자쌍은 보라색 구름)은 서로 밀어내 가장 멀리 떨어지도록 배치된다. ‘전자쌍 배치 틀’을 켜면 NH₃와 H₂O도 CH₄처럼 사면체 배치인데, 분자 모양은 원자의 위치만 보고 정한다는 것을 알 수 있다. ‘쌍극자 보기’를 켜면 각 결합의 쌍극자(δ+ → δ−, 길이는 전기 음성도 차이에 비례)와 그 합으로 분자의 극성을 판정한다. 중심 원자 주변의 전자쌍만 그렸고(바깥 원자의 비공유 전자쌍은 생략), 다중 결합은 전자쌍 1개처럼 취급했다. 원자 크기와 결합 길이는 모식적이며, 전기 음성도는 폴링 값(Be 1.5, B 2.0, C 2.5, N 3.0, O 3.5, F 4.0, Cl 3.0, H 2.1)을 썼다.',
  init: function (api) {
    var EN = { H: 2.1, Be: 1.5, B: 2.0, C: 2.5, N: 3.0, O: 3.5, F: 4.0, Cl: 3.0 };
    var BL = 1.75;   // 결합 길이(모식)
    function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
    function sc(v, k) { return [v[0] * k, v[1] * k, v[2] * k]; }
    function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
    function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    var D2R = Math.PI / 180;
    // 아래(−y)를 축으로 대칭인 결합 3개 (결합 사이 각 th)
    function pyramid(th) {
      var s2 = (1 - Math.cos(th * D2R)) / 1.5, sa = Math.sqrt(s2), ca = Math.sqrt(1 - s2);
      return [90, 210, 330].map(function (p) { return [sa * Math.cos(p * D2R), -ca, sa * Math.sin(p * D2R)]; });
    }
    var TET = pyramid(109.47);
    var mols = {
      BeCl2: { f: 'BeCl₂', c: 'Be', o: 'Cl', bonds: [[1, 0, 0], [-1, 0, 0]], order: 1, lp: [], domain: '직선', shape: '직선형', angle: '180°', angleTxt: '180°' },
      CO2: { f: 'CO₂', c: 'C', o: 'O', bonds: [[1, 0, 0], [-1, 0, 0]], order: 2, lp: [], domain: '직선', shape: '직선형', angle: '180°', angleTxt: '180°' },
      BF3: { f: 'BF₃', c: 'B', o: 'F', bonds: [90, 210, 330].map(function (p) { return [Math.cos(p * D2R), Math.sin(p * D2R), 0]; }), order: 1, lp: [], domain: '평면 삼각형', shape: '평면 삼각형', angleTxt: '120°' },
      CH4: { f: 'CH₄', c: 'C', o: 'H', bonds: [[0, 1, 0]].concat(TET), order: 1, lp: [], domain: '사면체', shape: '정사면체', angleTxt: '109.5°' },
      NH3: { f: 'NH₃', c: 'N', o: 'H', bonds: pyramid(107), order: 1, lp: [[0, 1, 0]], domain: '사면체', shape: '삼각뿔', angleTxt: '약 107°' },
      H2O: { f: 'H₂O', c: 'O', o: 'H', bonds: [[-Math.sin(52.25 * D2R), -Math.cos(52.25 * D2R), 0], [Math.sin(52.25 * D2R), -Math.cos(52.25 * D2R), 0]], order: 1,
        lp: [norm([0, Math.cos(57 * D2R), Math.sin(57 * D2R)]), norm([0, Math.cos(57 * D2R), -Math.sin(57 * D2R)])], domain: '사면체', shape: '굽은 형', angleTxt: '약 104.5°' },
    };
    var order = ['BeCl2', 'CO2', 'BF3', 'CH4', 'NH3', 'H2O'];
    var state = { m: 'CH4', dip: false, frame: false };

    var rM = api.readout('중심 원자 주위 전자쌍');
    var rS = api.readout('분자 모양 · 결합각');
    var rP = api.readout('분자의 극성');

    function col(T, a) {
      return { H: T.figPanel, Be: T.figAmber, B: T.figAmber, C: T.figMuted, N: T.figBlue, O: T.figRed, F: T.figTeal, Cl: T.figGreen }[a];
    }
    function rad(a) { return a === 'H' ? 0.3 : a === 'Be' || a === 'B' || a === 'C' || a === 'N' || a === 'O' ? 0.46 : 0.42; }

    var S = api.scene3d({
      yaw: 0.45, pitch: 0.3, dist: 10, scale: 0.19, label: '중심 원자 주위의 전자쌍 배치와 분자 모양을 보여 주는 입체 모형',
      aspect: function (w) { return w < 560 ? 1.0 : 0.58; },
      draw: function (g, T) {
        var M = mols[state.m], dirs = M.bonds;
        // 전자쌍 배치 틀(모든 전자쌍 방향의 끝을 잇는 반투명 면)
        if (state.frame) {
          var all = dirs.concat(M.lp).map(function (d) { return sc(d, BL); });
          if (all.length === 4) {
            [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]].forEach(function (f) {
              g.poly([all[f[0]], all[f[1]], all[f[2]]], T.figSoftBlue, { alpha: 0.28, stroke: T.figLine, strokeWidth: 1 });
            });
          } else if (all.length === 3) g.poly(all, T.figSoftBlue, { alpha: 0.3, stroke: T.figLine });
          else g.line(all[0], all[1], T.figLine, { width: 1, dash: [4, 4] });
        }
        // 중심 원자
        g.sphere([0, 0, 0], rad(M.c), col(T, M.c), { label: M.c, outline: T.figInk });
        // 결합(공유 전자쌍)과 바깥 원자
        dirs.forEach(function (d) {
          var end = sc(d, BL);
          if (M.order === 2) {
            var perp = norm(cross(d, Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]));
            [-1, 1].forEach(function (k) { var o = sc(perp, 0.09 * k); g.line(add(sc(d, 0.3), o), add(end, o), T.figInk, { width: 3 }); });
          } else g.line(sc(d, 0.3), end, T.figInk, { width: 3.5 });
          // 공유 전자쌍 표시(점 2개)
          var mid = sc(d, BL * 0.55), q = norm(cross(d, Math.abs(d[2]) > 0.9 ? [0, 1, 0] : [0, 0, 1]));
          for (var e = 0; e < M.order; e++) {
            var c0 = add(mid, sc(d, (e - (M.order - 1) / 2) * 0.32));
            g.sphere(add(c0, sc(q, 0.13)), 0.06, T.figAccent, { flat: true });
            g.sphere(add(c0, sc(q, -0.13)), 0.06, T.figAccent, { flat: true });
          }
          g.sphere(end, rad(M.o), col(T, M.o), { label: M.o, outline: M.o === 'H' ? T.figMuted : T.figInk });
        });
        // 비공유 전자쌍: 반투명 구름 + 전자 2개
        M.lp.forEach(function (d) {
          [[0.55, 0.3], [0.85, 0.42], [1.12, 0.46], [1.35, 0.36]].forEach(function (p) { g.sphere(sc(d, p[0]), p[1], T.figViolet, { alpha: 0.2, flat: true }); });
          var q = norm(cross(d, Math.abs(d[0]) > 0.9 ? [0, 1, 0] : [1, 0, 0]));
          g.sphere(add(sc(d, 1.0), sc(q, 0.14)), 0.07, T.figViolet, { flat: true });
          g.sphere(add(sc(d, 1.0), sc(q, -0.14)), 0.07, T.figViolet, { flat: true });
          g.text(sc(d, 1.85), '비공유 전자쌍', { color: T.figViolet, size: 12, bold: true });
        });
        // 결합각 호
        if (dirs.length >= 2) {
          var a = dirs[0], b = dirs[1];
          if (state.m === 'CH4') { a = dirs[1]; b = dirs[2]; }
          if (state.m === 'BeCl2' || state.m === 'CO2') {
            var pts = []; for (var i = 0; i <= 24; i++) { var t = Math.PI * i / 24; pts.push([0.8 * Math.cos(t), 0.8 * Math.sin(t), 0]); }
            g.path(pts, T.figAmber, { width: 2 });
            g.text([0, 1.05, 0], M.angleTxt, { color: T.figAmber, bold: true, size: 13 });
          } else {
            var th = Math.acos(Math.max(-1, Math.min(1, dot(a, b)))), arc = [];
            for (var j = 0; j <= 16; j++) {
              var u = j / 16, s1 = Math.sin((1 - u) * th) / Math.sin(th), s2 = Math.sin(u * th) / Math.sin(th);
              arc.push(sc(add(sc(a, s1), sc(b, s2)), 0.85));
            }
            g.path(arc, T.figAmber, { width: 2 });
            g.text(sc(norm(add(a, b)), 1.2), M.angleTxt, { color: T.figAmber, bold: true, size: 13 });
          }
        }
        // 쌍극자
        if (state.dip) {
          var diff = EN[M.o] - EN[M.c], net = [0, 0, 0];   // diff > 0이면 바깥 원자가 δ−
          dirs.forEach(function (d) {
            var mag = Math.abs(diff) * 0.55, toward = diff > 0 ? d : sc(d, -1);   // δ+ → δ− 방향
            var perp = norm(cross(d, Math.abs(d[2]) > 0.9 ? [0, 1, 0] : [0, 0, 1]));
            var center = add(sc(d, BL * 0.5), sc(perp, 0.32));
            var from = add(center, sc(toward, -mag / 2)), to = add(center, sc(toward, mag / 2));
            g.arrow(from, to, T.figRed, { width: 2.2, head: 8 });
            g.line(add(from, sc(perp, -0.08)), add(from, sc(perp, 0.08)), T.figRed, { width: 2.2 });
            net = add(net, sc(toward, mag));
            g.text(add(sc(d, BL), sc(perp, -0.55)), diff > 0 ? 'δ−' : 'δ+', { color: T.figRed, size: 12, bold: true });
          });
          g.text([-0.62, 0.2, 0.55], diff > 0 ? 'δ+' : 'δ−', { color: T.figRed, size: 12, bold: true });
          var nl = Math.hypot(net[0], net[1], net[2]);
          if (nl > 0.05) {
            var nd = norm(net), tail = sc(nd, -0.2), head = sc(nd, 0.2 + Math.min(2.2, nl * 1.1) + 0.6);
            g.arrow(tail, head, T.figGreen, { width: 4, head: 12 });
            g.text(add(head, sc(nd, 0.3)), '쌍극자의 합', { color: T.figGreen, size: 12, bold: true });
          }
          state.net = nl;
        }
      },
    });

    var gm = api.group();
    var mb = order.map(function (k) {
      return api.button(mols[k].f, function () { state.m = k; sync(); }, { toggle: true, pressed: k === state.m, parent: gm });
    });
    var gt = api.group();
    var bFrame = api.button('전자쌍 배치 틀', function () { state.frame = !state.frame; sync(); }, { toggle: true, parent: gt });
    var bDip = api.button('쌍극자 보기 · 극성 판정', function () { state.dip = !state.dip; sync(); }, { toggle: true, parent: gt });

    function sync() {
      mb.forEach(function (b, i) { b.setAttribute('aria-pressed', order[i] === state.m ? 'true' : 'false'); });
      bFrame.setAttribute('aria-pressed', state.frame ? 'true' : 'false');
      bDip.setAttribute('aria-pressed', state.dip ? 'true' : 'false');
      var M = mols[state.m];
      var n = M.bonds.length + M.lp.length;
      rM.set(M.f + ': ' + n + '쌍 (공유 ' + M.bonds.length + (M.order === 2 ? ', 이중 결합은 1쌍 취급' : '') + ' / 비공유 ' + M.lp.length + ') → ' + M.domain + ' 배치');
      rS.set(M.shape + ' · ' + M.angleTxt);
      if (!state.dip) rP.set('‘쌍극자 보기’를 눌러 확인');
      else {
        var polar = M.lp.length > 0;
        rP.set(polar ? '극성 분자 — 쌍극자의 합이 0이 아니다' : '무극성 분자 — 극성 결합이지만 대칭이라 합이 0');
      }
      S.redraw();
    }
    sync();
  },
});
