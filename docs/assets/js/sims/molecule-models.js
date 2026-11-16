/* 중2-4 물질의 구성: 분자 모형(공-막대 모형)을 돌려 보며 원자의 종류와 개수, 분자의 모양을 확인한다 (3D) */
Sims.register('molecule-models', {
  title: '분자 모형 돌려 보기 — 원자의 종류와 개수',
  caption: '버튼으로 분자를 고르고 끌어서 돌려 보자. 화학식의 원소 기호는 원자의 종류를, 오른쪽 아래 숫자는 분자 1개 속 그 원자의 개수를 나타낸다. 물은 굽은 모양, 이산화 탄소는 직선, 암모니아는 삼각뿔, 메테인은 정사면체 모양으로, 같은 원소로 이루어져도 원자의 개수와 배열이 다르면 다른 분자가 된다. 공의 크기와 막대 길이는 실제 비율을 바탕으로 보기 좋게 조절했고, 막대는 원자가 서로 결합해 있음만 나타낸다(결합의 종류는 구분하지 않았다).',
  init: function (api) {
    var EL = {
      H: { name: '수소', r: 0.3 }, C: { name: '탄소', r: 0.5 },
      N: { name: '질소', r: 0.47 }, O: { name: '산소', r: 0.45 },
    };
    var K = 1.45;   // 결합 길이(Å)를 장면 단위로 늘리는 배율
    function dir(theta, phi) { return [Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)]; }
    function add(a, b, s) { return [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s]; }
    function deg(d) { return d * Math.PI / 180; }
    function bent(center, side, len, angle) {   // 가운데 원자와 양쪽 원자가 굽은 모양
      var h = deg(angle / 2);
      return [[center, [0, 0, 0]], [side, [-Math.sin(h) * len * K, -Math.cos(h) * len * K, 0]], [side, [Math.sin(h) * len * K, -Math.cos(h) * len * K, 0]]];
    }
    var MOL = [
      { id: 'h2', name: '수소', f: 'H₂', kind: '원소', shape: '원자 2개가 나란히 붙은 모양',
        atoms: [['H', [-0.37 * K, 0, 0]], ['H', [0.37 * K, 0, 0]]], bonds: [[0, 1]] },
      { id: 'o2', name: '산소', f: 'O₂', kind: '원소', shape: '원자 2개가 나란히 붙은 모양',
        atoms: [['O', [-0.6 * K, 0, 0]], ['O', [0.6 * K, 0, 0]]], bonds: [[0, 1]] },
      { id: 'o3', name: '오존', f: 'O₃', kind: '원소', shape: '굽은 모양',
        atoms: bent('O', 'O', 1.28, 116.8), bonds: [[0, 1], [0, 2]] },
      { id: 'h2o', name: '물', f: 'H₂O', kind: '화합물', shape: '굽은 모양',
        atoms: bent('O', 'H', 0.96, 104.5), bonds: [[0, 1], [0, 2]] },
      { id: 'co2', name: '이산화 탄소', f: 'CO₂', kind: '화합물', shape: '일직선 모양',
        atoms: [['C', [0, 0, 0]], ['O', [-1.16 * K, 0, 0]], ['O', [1.16 * K, 0, 0]]], bonds: [[0, 1], [0, 2]] },
      { id: 'nh3', name: '암모니아', f: 'NH₃', kind: '화합물', shape: '삼각뿔 모양',
        atoms: (function () {
          var a = Math.acos(0.372), out = [['N', [0, 0, 0]]];
          for (var k = 0; k < 3; k++) out.push(['H', add([0, 0, 0], dir(Math.PI - a, deg(90 + 120 * k)), 1.01 * K)]);
          return out;
        })(), bonds: [[0, 1], [0, 2], [0, 3]] },
      { id: 'ch4', name: '메테인', f: 'CH₄', kind: '화합물', shape: '정사면체 모양',
        atoms: (function () {
          var v = [[0, 1, 0]], a = Math.acos(-1 / 3), out = [['C', [0, 0, 0]]];
          for (var k = 0; k < 3; k++) v.push(dir(a, deg(90 + 120 * k)));
          v.forEach(function (d) { out.push(['H', add([0, 0, 0], d, 1.09 * K)]); });
          return out;
        })(), bonds: [[0, 1], [0, 2], [0, 3], [0, 4]] },
      { id: 'h2o2', name: '과산화 수소', f: 'H₂O₂', kind: '화합물', shape: '두 O에 H가 하나씩, 비틀린 모양',
        atoms: (function () {
          var oo = 1.47 * K / 2, oh = 0.95 * K, t = deg(94.8), p = deg(111.5 / 2);
          return [['O', [-oo, 0, 0]], ['O', [oo, 0, 0]],
            ['H', [-oo + oh * Math.cos(t), oh * Math.sin(t) * Math.cos(-p), oh * Math.sin(t) * Math.sin(-p)]],
            ['H', [oo - oh * Math.cos(t), oh * Math.sin(t) * Math.cos(p), oh * Math.sin(t) * Math.sin(p)]]];
        })(), bonds: [[0, 1], [0, 2], [1, 3]] },
    ];
    // 무게중심을 원점에
    MOL.forEach(function (m) {
      var c = [0, 0, 0]; m.atoms.forEach(function (a) { c = add(c, a[1], 1 / m.atoms.length); });
      m.atoms = m.atoms.map(function (a) { return [a[0], add(a[1], c, -1)]; });
    });
    var state = { m: 3 };

    var rF = api.readout('화학식');
    var rA = api.readout('분자 1개를 이루는 원자');
    var rK = api.readout('원소/화합물');
    var rS = api.readout('모양');

    function colors(T) {   // 관례적인 원자 색(수소 흰색, 탄소 검은색, 질소 파란색, 산소 빨간색)을 화면 테마에 맞춰
      return {
        H: { fill: T.dark ? T.figInk : T.figPanel, text: T.dark ? T.figPaper : T.figInk },
        C: { fill: T.dark ? T.figLine : T.figInk, text: T.dark ? T.figInk : T.figPanel },
        N: { fill: T.figBlue, text: T.figPanel },
        O: { fill: T.figRed, text: T.figPanel },
      };
    }
    var S = api.scene3d({
      yaw: 0.5, pitch: 0.3, dist: 10, scale: 0.17, label: '분자의 공-막대 모형',
      draw: function (g, T) {
        var m = MOL[state.m], C = colors(T);
        m.bonds.forEach(function (b) { g.line(m.atoms[b[0]][1], m.atoms[b[1]][1], T.figMuted, { width: 7 }); });
        m.atoms.forEach(function (a) {
          var e = a[0], c = C[e];
          g.sphere(a[1], EL[e].r, c.fill, { label: e, labelColor: c.text, outline: T.figMuted });
        });
      },
      overlay: function (ctx, T, S) {
        var m = MOL[state.m], C = colors(T), narrow = S.w < 560;
        ctx.textBaseline = 'alphabetic';
        // 분자 이름과 화학식
        ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.font = '600 ' + (narrow ? 20 : 24) + 'px ' + T.fontBody;
        ctx.fillText(m.f, 14, narrow ? 30 : 36);
        var fw = ctx.measureText(m.f).width;
        ctx.font = (narrow ? 13 : 14) + 'px ' + T.fontBody; ctx.fillStyle = T.figMuted;
        ctx.fillText(m.name + ' 분자', 22 + fw, narrow ? 30 : 36);
        // 범례
        var used = ['H', 'C', 'N', 'O'], x = 14, y = S.h - 14, fs = narrow ? 12 : 13;
        ctx.font = fs + 'px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.fillText('원자의 색', x, y - 22);
        used.forEach(function (e) {
          var on = m.atoms.some(function (a) { return a[0] === e; });
          ctx.globalAlpha = on ? 1 : 0.4;
          ctx.beginPath(); ctx.arc(x + 7, y - 4, 7, 0, Math.PI * 2); ctx.fillStyle = C[e].fill; ctx.fill();
          ctx.lineWidth = 1; ctx.strokeStyle = T.figMuted; ctx.stroke();
          ctx.fillStyle = T.figInk; ctx.font = fs + 'px ' + T.fontBody;
          var t = EL[e].name + '(' + e + ')'; ctx.fillText(t, x + 18, y);
          x += 18 + ctx.measureText(t).width + 12;
          ctx.globalAlpha = 1;
        });
      },
    });

    var grp = api.group();
    var bs = MOL.map(function (m, i) {
      return api.button(m.name + ' ' + m.f, function () { pick(i); }, { toggle: true, pressed: i === state.m, parent: grp });
    });
    function pick(i) {
      state.m = i;
      bs.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      readouts(); S.redraw();
    }
    function readouts() {
      var m = MOL[state.m], cnt = {}, order = m.f.match(/[A-Z][a-z]?/g);   // 화학식에 쓴 순서대로
      m.atoms.forEach(function (a) { cnt[a[0]] = (cnt[a[0]] || 0) + 1; });
      rF.set(m.f);
      rA.set(order.map(function (e) { return EL[e].name + '(' + e + ') ' + cnt[e] + '개'; }).join(', ') + ' — 모두 ' + m.atoms.length + '개');
      rK.set(m.kind + ' (원소 ' + order.length + '가지)');
      rS.set(m.shape);
    }
    readouts();
  },
});
