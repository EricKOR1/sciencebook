/* 물리화학 4 순물질의 상평형: μ–T 그래프 조작기 — 압력·몰 부피·몰 엔트로피를 바꾸면 녹는점·끓는점·승화점과 삼중점이 어떻게 움직이는가 */
Sims.register('mj-mu-temperature', {
  title: 'μ–T 그래프 조작기 — 가장 낮은 선이 안정한 상이다',
  caption: '물질(물·이산화 탄소)을 고르고 압력을 바꿔 보자. 기체의 μ는 RT ln(P/P°)만큼 크게, 고체·액체의 μ는 V_m(P − P°)만큼 조금 움직여 교점(녹는점 T_f, 끓는점 T_b)이 옮겨 간다. 압력을 삼중점 압력 아래로 낮추면 액체가 가장 낮은 구간이 사라지고 고체 선과 기체 선이 바로 만난다(승화). V_m(s)를 V_m(l)보다 크게 하면(물) 압력을 높일 때 녹는점이 내려간다. 각 상의 몰 엔트로피를 온도에 무관한 상수로, 응축상을 압축되지 않는 것으로, 기체를 이상 기체로 둔 모형이므로 실제 값과 몇 K 다를 수 있다.',
  init: function (api) {
    var R = 8.314;
    // H: 기준 몰 엔탈피(J/mol, 고체 = 0), S: J/(mol·K), V: cm3/mol, T 범위(K)
    var PRESETS = [
      { name: '물', H: [0, 6010, 51010], S: [41, 63, 185.4], V: [19.65, 18.02], T: [190, 420] },
      { name: '이산화 탄소', H: [0, 8600, 26100], S: [52, 91.9, 186.2], V: [29.1, 37.4], T: [150, 300] },
    ];
    var st = { k: 0, logP: 0, S: PRESETS[0].S.slice(), V: PRESETS[0].V.slice() };
    var COLS = ['figBlue', 'figGreen', 'figRed'], NAMES = ['고체', '액체', '기체'];

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.05 : 0.56; }, label: '고체·액체·기체의 화학 퍼텐셜을 온도에 대해 그린 그래프' });
    var ctx = cv.ctx;
    var rSeq = api.readout('안정한 상의 순서');
    var rF = api.readout('녹는점 T_f');
    var rB = api.readout('끓는점 T_b / 승화점');
    var rT = api.readout('삼중점(모형)');

    var g = api.group();
    var pb = PRESETS.map(function (p, i) { return api.button(p.name, function () { pick(i); }, { toggle: true, pressed: i === 0, parent: g }); });
    var sP = api.slider({ id: 'mj-mu-temperature-p', label: '압력 P', min: -3, max: 2, step: 0.01, value: 0,
      format: fmtP, onInput: function (v) { st.logP = v; draw(); } });
    var sl = [];
    sl.push(api.slider({ id: 'mj-mu-temperature-vs', label: 'V_m(s)', min: 10, max: 50, step: 0.1, value: st.V[0],
      format: function (v) { return v.toFixed(1) + ' cm³/mol'; }, onInput: function (v) { st.V[0] = v; draw(); } }));
    sl.push(api.slider({ id: 'mj-mu-temperature-vl', label: 'V_m(l)', min: 10, max: 50, step: 0.1, value: st.V[1],
      format: function (v) { return v.toFixed(1) + ' cm³/mol'; }, onInput: function (v) { st.V[1] = v; draw(); } }));
    sl.push(api.slider({ id: 'mj-mu-temperature-ss', label: 'S_m(s)', min: 20, max: 100, step: 0.5, value: st.S[0],
      format: function (v) { return v.toFixed(1) + ' J/(mol·K)'; }, onInput: function (v) { st.S[0] = v; draw(); } }));
    sl.push(api.slider({ id: 'mj-mu-temperature-sl', label: 'S_m(l)', min: 30, max: 140, step: 0.5, value: st.S[1],
      format: function (v) { return v.toFixed(1) + ' J/(mol·K)'; }, onInput: function (v) { st.S[1] = v; draw(); } }));
    sl.push(api.slider({ id: 'mj-mu-temperature-sg', label: 'S_m(g) (1 bar)', min: 120, max: 260, step: 0.5, value: st.S[2],
      format: function (v) { return v.toFixed(1) + ' J/(mol·K)'; }, onInput: function (v) { st.S[2] = v; draw(); } }));

    function fmtP(v) {
      var p = Math.pow(10, v);
      return p >= 10 ? p.toFixed(0) + ' bar' : p >= 1 ? p.toFixed(2) + ' bar' : p >= 0.01 ? p.toFixed(3) + ' bar' : (p * 1e5).toFixed(0) + ' Pa';
    }
    function pick(i) {
      st.k = i; var p = PRESETS[i];
      pb.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      st.S = p.S.slice(); st.V = p.V.slice();
      sl[0].set(st.V[0]); sl[1].set(st.V[1]); sl[2].set(st.S[0]); sl[3].set(st.S[1]); sl[4].set(st.S[2]);
      draw();
    }
    // 화학 퍼텐셜(kJ/mol)
    function mu(i, T, P) {
      var p = PRESETS[st.k];
      if (i === 2) return (p.H[2] - T * st.S[2] + R * T * Math.log(P)) / 1000;
      return (p.H[i] - T * st.S[i] + st.V[i] * (P - 1) * 0.1) / 1000;   // cm3·bar = 0.1 J
    }
    function cross(i, j, P) {   // mu_i = mu_j 인 T (직선이므로 바로 푼다)
      var a = mu(i, 0, P) - mu(j, 0, P), b = (mu(i, 1, P) - mu(i, 0, P)) - (mu(j, 1, P) - mu(j, 0, P));
      if (i === 2 || j === 2) {   // 기체 항 RT lnP 는 T에 비례하므로 역시 직선
        a = mu(i, 0, P) - mu(j, 0, P); b = (mu(i, 1, P) - mu(i, 0, P)) - (mu(j, 1, P) - mu(j, 0, P));
      }
      if (Math.abs(b) < 1e-12) return NaN;
      return -a / b;
    }
    function triple() {
      var f = function (lp) { var P = Math.pow(10, lp); return cross(0, 1, P) - cross(1, 2, P); };
      var lo = -9, hi = 4, flo = f(lo), fhi = f(hi);
      if (!isFinite(flo) || !isFinite(fhi) || (flo > 0) === (fhi > 0)) return null;
      for (var n = 0; n < 80; n++) { var m = (lo + hi) / 2, fm = f(m); if ((fm > 0) === (flo > 0)) { lo = m; flo = fm; } else hi = m; }
      var P = Math.pow(10, (lo + hi) / 2);
      return { P: P, T: cross(0, 1, P) };
    }
    function stableAt(T, P) { var b = 0, v = mu(0, T, P); for (var i = 1; i < 3; i++) { var w = mu(i, T, P); if (w < v) { v = w; b = i; } } return b; }

    function draw() {
      var T0 = PRESETS[st.k].T[0], T1 = PRESETS[st.k].T[1], P = Math.pow(10, st.logP);
      var Tk = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var L = narrow ? 46 : 62, Rr = w - 16, Tp = 34, B = h - (narrow ? 70 : 64);
      // 세로 범위: 그 압력에서 전체 선의 범위
      var ymin = Infinity, ymax = -Infinity;
      for (var i = 0; i < 3; i++) [T0, T1].forEach(function (T) { var v = mu(i, T, P); if (i !== 2 || true) { ymin = Math.min(ymin, v); } });
      // 위쪽은 가장 낮은 선의 최댓값에 여유를 둔다
      var envTop = -Infinity;
      for (var n = 0; n <= 40; n++) { var T = T0 + (T1 - T0) * n / 40; envTop = Math.max(envTop, mu(stableAt(T, P), T, P)); }
      ymax = envTop + (envTop - ymin) * 0.35 + 0.5;
      var sx = function (T) { return L + (T - T0) / (T1 - T0) * (Rr - L); };
      var sy = function (v) { return B - (v - ymin) / (ymax - ymin) * (B - Tp); };
      // 축
      ctx.strokeStyle = Tk.rule; ctx.lineWidth = 1; ctx.font = '11px ' + Tk.fontMono; ctx.fillStyle = Tk.figMuted;
      ctx.textAlign = 'center';
      var stepT = (T1 - T0) > 200 ? 50 : 25;
      for (var t = Math.ceil(T0 / stepT) * stepT; t <= T1; t += stepT) { ctx.beginPath(); ctx.moveTo(sx(t), Tp); ctx.lineTo(sx(t), B); ctx.stroke(); ctx.fillText(t, sx(t), B + 14); }
      ctx.textAlign = 'right';
      var span = ymax - ymin, stepY = span > 40 ? 10 : span > 20 ? 5 : span > 8 ? 2 : 1;
      for (var y = Math.ceil(ymin / stepY) * stepY; y <= ymax; y += stepY) { ctx.beginPath(); ctx.moveTo(L, sy(y)); ctx.lineTo(Rr, sy(y)); ctx.stroke(); ctx.fillText(y.toFixed(0), L - 5, sy(y) + 4); }
      ctx.strokeStyle = Tk.figLine; ctx.strokeRect(L, Tp, Rr - L, B - Tp);
      ctx.fillStyle = Tk.figInk; ctx.font = '12px ' + Tk.fontBody; ctx.textAlign = 'center';
      ctx.fillText('온도 T (K)', (L + Rr) / 2, B + 30);
      ctx.save(); ctx.translate(12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('μ (kJ/mol, 고체의 H = 0 기준)', 0, 0); ctx.restore();
      // 선
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, Rr - L, B - Tp); ctx.clip();
      for (i = 0; i < 3; i++) {
        ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5; ctx.strokeStyle = Tk[COLS[i]];
        ctx.beginPath(); ctx.moveTo(sx(T0), sy(mu(i, T0, P))); ctx.lineTo(sx(T1), sy(mu(i, T1, P))); ctx.stroke();
      }
      ctx.setLineDash([]);
      // 가장 낮은 선(굵게)
      var N = 400, segs = [], prev = -1;
      for (n = 0; n <= N; n++) {
        T = T0 + (T1 - T0) * n / N; var s = stableAt(T, P);
        if (s !== prev) { segs.push({ i: s, a: T }); prev = s; }
        segs[segs.length - 1].b = T;
      }
      segs.forEach(function (sg) {
        ctx.strokeStyle = Tk[COLS[sg.i]]; ctx.lineWidth = 4.5;
        ctx.beginPath(); ctx.moveTo(sx(sg.a), sy(mu(sg.i, sg.a, P))); ctx.lineTo(sx(sg.b), sy(mu(sg.i, sg.b, P))); ctx.stroke();
      });
      ctx.restore();
      // 선 이름
      ctx.font = '600 12px ' + Tk.fontBody; ctx.textAlign = 'left';
      for (i = 0; i < 3; i++) {
        var Tl = T0 + (T1 - T0) * (i === 2 ? 0.62 : 0.04 + 0.0 * i), v = mu(i, Tl, P);
        if (i === 1) { Tl = T0 + (T1 - T0) * 0.04; v = mu(1, Tl, P); }
        var yy = sy(v) + (i === 0 ? 16 : -8);
        if (yy > Tp + 12 && yy < B - 4) { ctx.fillStyle = Tk[COLS[i]]; ctx.fillText(NAMES[i], sx(Tl) + 2, yy); }
      }
      // 교점 표시
      var seq = segs.map(function (sg) { return NAMES[sg.i]; }).join(' → ');
      var tf = null, tb = null, tsub = null;
      for (var k = 1; k < segs.length; k++) {
        var a = segs[k - 1].i, b = segs[k].i, Tx = cross(a, b, P), lab;
        if (a === 0 && b === 1) { tf = Tx; lab = 'T_f'; } else if (a === 1 && b === 2) { tb = Tx; lab = 'T_b'; } else if (a === 0 && b === 2) { tsub = Tx; lab = '승화'; } else lab = '';
        var X = sx(Tx), Y = sy(mu(a, Tx, P));
        ctx.setLineDash([3, 4]); ctx.strokeStyle = Tk.figMuted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X, B); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = Tk.figInk; ctx.beginPath(); ctx.arc(X, Y, 4.5, 0, 7); ctx.fill();
        ctx.font = '600 12px ' + Tk.fontBody; ctx.textAlign = 'center';
        ctx.fillText(lab + ' ' + Tx.toFixed(1) + ' K', Math.min(Math.max(X, L + 50), Rr - 50), Y - 12);
      }
      // 안정한 상 띠
      var bandY = B + (narrow ? 40 : 38), bandH = 12;
      segs.forEach(function (sg) {
        ctx.fillStyle = Tk[COLS[sg.i]]; ctx.globalAlpha = 0.85; ctx.fillRect(sx(sg.a), bandY, sx(sg.b) - sx(sg.a), bandH); ctx.globalAlpha = 1;
        if (sx(sg.b) - sx(sg.a) > 40) { ctx.fillStyle = Tk.figPanel; ctx.font = '600 11px ' + Tk.fontBody; ctx.textAlign = 'center'; ctx.fillText(NAMES[sg.i] + ' 안정', (sx(sg.a) + sx(sg.b)) / 2, bandY + 10); }
      });
      // 삼중점 강조
      var tp = triple(), msg = '', col = Tk.figMuted;
      if (tp) {
        var d = st.logP - Math.log10(tp.P);
        if (Math.abs(d) < 0.03) { msg = '지금 압력 ≈ 삼중점 압력: 세 선이 한 점에서 만난다'; col = Tk.figAccent; }
        else if (d < 0) { msg = 'P < 삼중점 압력: 액체가 가장 낮은 구간이 없다 → 고체가 바로 기체로(승화)'; col = Tk.figRed; }
        else { msg = 'P > 삼중점 압력: 고체 → 액체 → 기체'; col = Tk.figMuted; }
      }
      ctx.fillStyle = col; ctx.font = '600 12px ' + Tk.fontBody; ctx.textAlign = 'left';
      ctx.fillText(msg, L, 20);
      rSeq.set(seq);
      rF.set(tf != null ? tf.toFixed(1) + ' K' : '없음');
      rB.set(tb != null ? 'T_b ' + tb.toFixed(1) + ' K' : tsub != null ? '승화 ' + tsub.toFixed(1) + ' K' : '–');
      rT.set(tp ? tp.T.toFixed(1) + ' K, ' + fmtP(Math.log10(tp.P)) : '없음');
    }
    api.onResize(draw);
    draw();
  },
});
