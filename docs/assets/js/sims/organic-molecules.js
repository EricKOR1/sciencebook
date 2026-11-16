/* 화학 반응의 세계 3 탄소 화합물과 반응: 메테인·에탄올·에탄알·에탄산의 공-막대 모형과 에탄올의 단계적 산화 (3D) */
Sims.register('organic-molecules', {
  title: '작용기를 돌려 보기 — 에탄올이 산화되면 무엇이 바뀔까?',
  caption: '분자를 골라 끌어서 돌려 보자. 노란 테두리가 작용기이다. ‘산화 한 단계’를 누르면 에탄올이 수소 2개를 잃어 에탄알이 되고, 에탄알이 산소 1개를 얻어 에탄산이 된다. 탄소는 언제나 결합 4개(이중 결합은 2개로 센다)를 이루고, 단일 결합만 한 탄소 주위는 정사면체, C=O 이중 결합을 가진 탄소 주위는 평면(옅은 삼각형)이다. 결합 길이·각도는 실제 값에 가깝게 그렸고 원자 크기는 줄였다. 산화 단계는 원자의 들고 남(조성 변화)만 보여 주며 실제 반응 경로는 아니다.',
  init: function (api) {
    // 좌표 단위: Å (C–H 1.09, C–C 1.53, C–O 1.43, C=O 1.21, O–H 0.96)
    var TET = 0.9428, CT = -0.3333;   // sin, cos 109.5°
    function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
    function mul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
    function pol(deg, len) { var t = deg * Math.PI / 180; return [Math.cos(t) * len, Math.sin(t) * len, 0]; }
    var SH = [0.45, -0.4, 0];
    function P(v) { return add(v, SH); }
    var C2 = [0, 0, 0], C1 = [-1.53, 0, 0];
    // 메틸기 H (C1에 붙음, 엇갈린 배치)
    function methylH(phi) { var t = phi * Math.PI / 180; return add(C1, mul([CT, TET * Math.cos(t), TET * Math.sin(t)], 1.09)); }
    var H1 = methylH(60), H2 = methylH(180), H3 = methylH(300);
    // 에탄올
    var eO1 = pol(70.5, 1.43), eHx = add(eO1, pol(-1, 0.96));
    var eHy = mul([0.333, -0.471, -0.816], 1.09), eHz = mul([0.333, -0.471, 0.816], 1.09);
    // 에탄알 (C2 평면 삼각형)
    var aO1 = pol(56, 1.21), aHz = pol(295, 1.10);
    // 에탄산
    var cO1 = pol(54, 1.21), cO2 = pol(291, 1.34), cHz = add(cO2, pol(5, 0.97));

    var BASE = { C1: C1, H1: H1, H2: H2, H3: H3, C2: C2 };
    function mol(extra) { var o = {}; for (var k in BASE) o[k] = BASE[k]; for (var e in extra) o[e] = extra[e]; return o; }
    var MOLS = {
      ethanol: { name: '에탄올', formula: 'C₂H₅OH', fg: '−OH 하이드록시기', fgAtoms: ['O1', 'Hx'], ox: '−1', shape: '정사면체 (단일 결합 4개)', planar: false,
        atoms: mol({ O1: eO1, Hx: eHx, Hy: eHy, Hz: eHz }),
        bonds: [['C1', 'C2'], ['C1', 'H1'], ['C1', 'H2'], ['C1', 'H3'], ['C2', 'O1'], ['C2', 'Hy'], ['C2', 'Hz'], ['O1', 'Hx']], dbl: [] },
      ethanal: { name: '에탄알 (아세트알데하이드)', formula: 'CH₃CHO', fg: '−CHO 폼일기', fgAtoms: ['C2', 'O1', 'Hz'], ox: '+1', shape: '평면 삼각형 (C=O 이중 결합)', planar: ['C1', 'O1', 'Hz'],
        atoms: mol({ O1: aO1, Hz: aHz }),
        bonds: [['C1', 'C2'], ['C1', 'H1'], ['C1', 'H2'], ['C1', 'H3'], ['C2', 'O1'], ['C2', 'Hz']], dbl: [['C2', 'O1']] },
      acid: { name: '에탄산 (아세트산)', formula: 'CH₃COOH', fg: '−COOH 카복실기', fgAtoms: ['C2', 'O1', 'O2', 'Hz'], ox: '+3', shape: '평면 삼각형 (C=O 이중 결합)', planar: ['C1', 'O1', 'O2'],
        atoms: mol({ O1: cO1, O2: cO2, Hz: cHz }),
        bonds: [['C1', 'C2'], ['C1', 'H1'], ['C1', 'H2'], ['C1', 'H3'], ['C2', 'O1'], ['C2', 'O2'], ['O2', 'Hz']], dbl: [['C2', 'O1']] },
      methane: { name: '메테인', formula: 'CH₄', fg: '없음 (탄화수소)', fgAtoms: [], ox: '−4', shape: '정사면체 (단일 결합 4개)', planar: false,
        atoms: (function () {
          var d = 1.09 / Math.sqrt(3), o = { C2: [0, 0, 0] };
          [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].forEach(function (v, i) { o['M' + i] = mul(v, d); });
          return o;
        })(),
        bonds: [['C2', 'M0'], ['C2', 'M1'], ['C2', 'M2'], ['C2', 'M3']], dbl: [], noShift: true },
    };
    var ORDER = ['ethanol', 'ethanal', 'acid'];
    var state = { cur: 'ethanol', anim: null, note: '' };

    var rF = api.readout('분자 (시성식)');
    var rG = api.readout('작용기');
    var rO = api.readout('작용기 탄소의 산화수');
    var rS = api.readout('그 탄소 주위 모양');

    function el(id) { return id.charAt(0); }
    function rad(id) { return el(id) === 'C' ? 0.36 : el(id) === 'O' ? 0.34 : 0.22; }
    function color(T, id) { return el(id) === 'C' ? T.figMuted : el(id) === 'O' ? T.figRed : T.figPanel; }
    function pos(m, id) { var p = MOLS[m].atoms[id]; return MOLS[m].noShift ? p : P(p); }

    var S = api.scene3d({
      yaw: -0.55, pitch: 0.3, dist: 10, scale: 0.165, label: '탄소 화합물의 공-막대 모형',
      draw: function (g, T) {
        var a = state.anim, m = state.cur;
        if (!a) { drawMol(g, T, m, null); }
        else {
          var t = a.t, from = MOLS[a.from], to = MOLS[a.to], e = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
          var ids = {}; Object.keys(from.atoms).forEach(function (k) { ids[k] = 1; }); Object.keys(to.atoms).forEach(function (k) { ids[k] = 1; });
          var cur = {}, alpha = {};
          Object.keys(ids).forEach(function (k) {
            var pf = from.atoms[k], pt = to.atoms[k];
            if (pf && pt) { cur[k] = add(pf, mul(add(pt, mul(pf, -1)), e)); alpha[k] = 1; }
            else if (pf) { var out = mul(pf, 1 + 1.6 * e); cur[k] = add(pf, mul(add(out, mul(pf, -1)), 1)); alpha[k] = 1 - e; }
            else { var start = mul(pt, 2.4); cur[k] = add(start, mul(add(pt, mul(start, -1)), e)); alpha[k] = e; }
          });
          var useTo = t >= 0.5, M = useTo ? to : from;
          M.bonds.forEach(function (b) {
            if (!cur[b[0]] || !cur[b[1]]) return;
            var al = Math.min(alpha[b[0]], alpha[b[1]]);
            bond(g, T, P(cur[b[0]]), P(cur[b[1]]), M.dbl.some(function (d) { return d[0] === b[0] && d[1] === b[1]; }), al, null);
          });
          Object.keys(cur).forEach(function (k) {
            if (alpha[k] < 0.03) return;
            g.sphere(P(cur[k]), rad(k), color(T, k), { label: el(k), labelColor: el(k) === 'H' ? T.figInk : T.figPanel, alpha: alpha[k], outline: el(k) === 'H' ? T.figLine : false });
          });
        }
        if (state.note) g.text([0.2, -2.3, 0], state.note, { size: 13, bold: true, color: T.figAccent });
      },
    });

    function bond(g, T, p, q, dbl, alpha, nrm) {
      var o = { width: 4, alpha: alpha == null ? 1 : alpha };
      if (!dbl) { g.line(p, q, T.figLine, o); return; }
      var n = nrm || [0, 0.09, 0];
      // 분자 평면(xy) 안에서 결합에 수직인 방향으로 두 줄
      var d = [q[0] - p[0], q[1] - p[1]], L = Math.hypot(d[0], d[1]) || 1;
      n = [-d[1] / L * 0.09, d[0] / L * 0.09, 0];
      o.width = 3;
      g.line(add(p, n), add(q, n), T.figLine, o); g.line(add(p, mul(n, -1)), add(q, mul(n, -1)), T.figLine, o);
    }
    function drawMol(g, T, m) {
      var M = MOLS[m];
      M.bonds.forEach(function (b) {
        bond(g, T, pos(m, b[0]), pos(m, b[1]), M.dbl.some(function (d) { return d[0] === b[0] && d[1] === b[1]; }), 1);
      });
      if (M.planar) g.poly(M.planar.map(function (k) { return pos(m, k); }), T.figSoftBlue, { alpha: 0.35, stroke: T.figBlue, strokeWidth: 1 });
      Object.keys(M.atoms).forEach(function (k) {
        var fg = M.fgAtoms.indexOf(k) >= 0;
        if (fg) g.sphere(pos(m, k), rad(k) + 0.2, T.figAmber, { alpha: 0.28, flat: true });
        g.sphere(pos(m, k), rad(k), color(T, k), { label: el(k), labelColor: el(k) === 'H' ? T.figInk : T.figPanel, outline: fg ? T.figAmber : el(k) === 'H' ? T.figLine : false });
      });
      if (M.fgAtoms.length) {
        var c = [0, 0, 0]; M.fgAtoms.forEach(function (k) { c = add(c, pos(m, k)); }); c = mul(c, 1 / M.fgAtoms.length);
        g.text([c[0], 1.95, c[2]], '작용기 ' + M.fg, { size: 13, bold: true, color: T.figInk });
      }
    }

    var gM = api.group();
    var keys = ['methane', 'ethanol', 'ethanal', 'acid'], labels = ['메테인', '에탄올', '에탄알', '에탄산'];
    var mBtns = keys.map(function (k, i) { return api.button(labels[i], function () { choose(k); }, { toggle: true, pressed: k === state.cur, parent: gM }); });
    var gO = api.group();
    var oxBtn = api.button('산화 한 단계 →', function () { oxidize(); }, { primary: true, parent: gO });
    api.button('에탄올로 되돌리기', function () { choose('ethanol'); }, { parent: gO });

    function choose(k) { state.anim = null; state.cur = k; state.note = ''; sync(); S.redraw(); }
    function sync() {
      mBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', keys[i] === state.cur ? 'true' : 'false'); });
      var M = MOLS[state.cur];
      rF.set(M.name + ' ' + M.formula); rG.set(M.fg); rO.set(M.ox); rS.set(M.shape);
      var i = ORDER.indexOf(state.cur);
      oxBtn.disabled = i < 0 || i >= ORDER.length - 1;
      oxBtn.textContent = state.cur === 'ethanol' ? '산화: 에탄올 → 에탄알' : state.cur === 'ethanal' ? '산화: 에탄알 → 에탄산' : state.cur === 'acid' ? '더 산화되지 않음(이 단계까지)' : '산화 단계는 에탄올부터';
    }
    function oxidize() {
      var i = ORDER.indexOf(state.cur);
      if (i < 0 || i >= ORDER.length - 1 || state.anim) return;
      var to = ORDER[i + 1];
      var note = to === 'ethanal' ? '수소 2개를 잃음 (−2H) · C 산화수 −1 → +1' : '산소 1개를 얻음 (+O) · C 산화수 +1 → +3';
      if (api.reduced) { state.cur = to; state.note = note; sync(); S.redraw(); return; }
      state.anim = { from: state.cur, to: to, t: 0 }; state.note = note; S.loop.play();
    }
    S.onFrame(function (dt) {
      if (!state.anim || !(dt > 0)) return;
      state.anim.t += dt / 1.8;
      if (state.anim.t >= 1) { state.cur = state.anim.to; state.anim = null; sync(); if (!S.auto) S.loop.pause(); }
    });
    S.loop.pause();
    sync(); S.redraw();
  },
});
