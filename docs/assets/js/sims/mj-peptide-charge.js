/* 유기화학 14: 펩타이드 전하–pH 탐색기 — 원자단마다 독립인 분율식의 합으로 평균 전하, q = 0 인 pH(등전점), 원자단별 이온화 분율, 전기 영동 방향 */
Sims.register('mj-peptide-charge', {
  title: '펩타이드 전하–pH 탐색기',
  caption: '서열(한 글자 기호, 최대 20잔기)을 입력하거나 미리 설정을 고르고, pH와 원자단별 pKa를 바꿔 보자. 평균 전하는 원자단마다 독립이라고 보고 양이온성 원자단(N-말단, K, R, H)의 1/(1 + 10^(pH − pKa))에서 음이온성 원자단(C-말단, D, E, C, Y)의 1/(1 + 10^(pKa − pH))를 뺀 합이며, q = 0이 되는 pH가 등전점(pI)이다. 펩타이드의 pKa 기본값은 탐구 활동 B의 대략값(N-말단 8.0, C-말단 3.1, D 3.9, E 4.1, H 6.0, C 8.3, Y 10.1, K 10.5, R 12.5)이고, 아미노산 한 개만 넣으면 ⑦의 표에 있는 자유 아미노산 값을 쓴다. 원자단끼리의 상호작용(이웃 전하에 따른 pKa 이동)은 무시했다.',
  init: function (api) {
    var PEP = { N: 8.0, C: 3.1, D: 3.9, E: 4.1, H: 6.0, Cs: 8.3, Y: 10.1, K: 10.5, R: 12.5 };
    var FREE = { G: [2.34, 9.60], A: [2.34, 9.69], D: [1.88, 9.60, 3.65], E: [2.19, 9.67, 4.25], H: [1.82, 9.17, 6.00], C: [1.96, 10.28, 8.18],
      Y: [2.20, 9.11, 10.07], K: [2.18, 8.95, 10.53], R: [2.17, 9.04, 12.48] };
    var NAME = { D: 'Asp', E: 'Glu', H: 'His', C: 'Cys', Y: 'Tyr', K: 'Lys', R: 'Arg' };
    var CAT = { K: 1, R: 1, H: 1 }, AN = { D: 1, E: 1, C: 1, Y: 1 };
    var PRE = [['KAD', 'Lys-Ala-Asp'], ['GHG', 'Gly-His-Gly'], ['G', '글리신'], ['D', '아스파트산'], ['K', '라이신']];
    var st = { seq: 'KAD', pH: 7.0, groups: [] };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.35 : 0.6; }, label: 'pH에 따른 평균 전하 곡선과 등전점, 원자단별 이온화 분율 막대, 전기 영동 방향' });
    var ctx = cv.ctx;
    var rQ = api.readout('전하  '), rI = api.readout('등전점  ');
    var gIn = api.group();
    var lab = document.createElement('label'); lab.textContent = '서열(한 글자 기호) ';
    var inp = document.createElement('input'); inp.type = 'text'; inp.id = 'mj-peptide-charge-seq'; inp.value = st.seq; inp.maxLength = 20; inp.size = 14;
    inp.setAttribute('aria-label', '펩타이드 서열'); inp.style.fontFamily = 'inherit'; inp.style.fontSize = '1em'; inp.style.textTransform = 'uppercase';
    lab.appendChild(inp); gIn.appendChild(lab);
    inp.addEventListener('input', function () { setSeq(inp.value); });
    var gP = api.group();
    var pb = PRE.map(function (p) { return api.button(p[1], function () { inp.value = p[0]; setSeq(p[0]); }, { toggle: true, pressed: p[0] === st.seq, parent: gP }); });
    api.slider({ id: 'mj-peptide-charge-ph', label: 'pH', min: 0, max: 14, step: 0.05, value: st.pH,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.pH = v; draw(); } });
    var gK = api.group();

    function build(seq) {
      var g = [];
      if (seq.length === 1 && FREE[seq]) {
        var f = FREE[seq];
        g.push({ n: 'α-NH₃⁺', pk: f[1], s: 1 }, { n: 'α-COOH', pk: f[0], s: -1 });
        if (f.length > 2) g.push({ n: NAME[seq] + ' 곁사슬', pk: f[2], s: CAT[seq] ? 1 : -1 });
        return g;
      }
      g.push({ n: 'N-말단', pk: PEP.N, s: 1 }, { n: 'C-말단', pk: PEP.C, s: -1 });
      for (var i = 0; i < seq.length; i++) {
        var c = seq[i];
        if (CAT[c] || AN[c]) g.push({ n: NAME[c] + (i + 1), pk: c === 'C' ? PEP.Cs : PEP[c], s: CAT[c] ? 1 : -1 });
      }
      return g;
    }
    function setSeq(v) {
      v = (v || '').toUpperCase().replace(/[^ACDEFGHIKLMNPQRSTVWY]/g, '').slice(0, 20);
      if (!v) v = 'G';
      st.seq = v; st.groups = build(v);
      pb.forEach(function (b, i) { b.setAttribute('aria-pressed', String(PRE[i][0] === v)); });
      while (gK.firstChild) gK.removeChild(gK.firstChild);
      st.groups.forEach(function (g, i) {
        api.slider({ id: 'mj-peptide-charge-pk' + i, label: g.n + ' pKa', min: 0, max: 14, step: 0.01, value: g.pk, parent: gK,
          format: function (x) { return x.toFixed(2); }, onInput: function (x) { g.pk = x; draw(); } });
      });
      draw();
    }
    function frac(g, pH) { return g.s > 0 ? 1 / (1 + Math.pow(10, pH - g.pk)) : 1 / (1 + Math.pow(10, g.pk - pH)); }
    function q(pH) { var s = 0; st.groups.forEach(function (g) { s += g.s * frac(g, pH); }); return s; }
    function pI() {
      var a = 0, b = 14, qa = q(a), qb = q(b);
      if (qa <= 0 || qb >= 0) return null;
      for (var k = 0; k < 60; k++) { var m = (a + b) / 2; if (q(m) > 0) a = m; else b = m; }
      return (a + b) / 2;
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var narrow = w < 560;
      var nC = st.groups.filter(function (g) { return g.s > 0; }).length, nA = st.groups.length - nC;
      var qmax = Math.max(1, nC), qmin = -Math.max(1, nA);
      var L = 46, R0 = narrow ? w - 12 : w * 0.62, Tp = 18, B = narrow ? h * 0.5 : h - 42;
      var X = function (p) { return L + p / 14 * (R0 - L); }, Y = function (v) { return Tp + (qmax - v) / (qmax - qmin) * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      for (var p = 0; p <= 14; p += 2) { ctx.beginPath(); ctx.moveTo(X(p), Tp); ctx.lineTo(X(p), B); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText(String(p), X(p), B + 13); }
      for (var v = qmin; v <= qmax; v++) { ctx.beginPath(); ctx.moveTo(L, Y(v)); ctx.lineTo(R0, Y(v)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText((v > 0 ? '+' : '') + v, L - 5, Y(v) + 4); }
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(L, Y(0)); ctx.lineTo(R0, Y(0)); ctx.stroke();
      ctx.strokeStyle = T.figLine; ctx.strokeRect(L, Tp, R0 - L, B - Tp);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('pH', (L + R0) / 2, B + 28);
      ctx.save(); ctx.translate(13, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('평균 전하 q̄', 0, 0); ctx.restore();
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 3; ctx.beginPath();
      for (var i = 0; i <= 280; i++) { var pp = 14 * i / 280; if (i) ctx.lineTo(X(pp), Y(q(pp))); else ctx.moveTo(X(pp), Y(q(pp))); }
      ctx.stroke();
      var pi = pI();
      if (pi != null) {
        ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figGreen; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(pi), Tp); ctx.lineTo(X(pi), B); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figGreen; ctx.beginPath(); ctx.arc(X(pi), Y(0), 5, 0, 7); ctx.fill();
        ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = X(pi) > (L + R0) / 2 ? 'right' : 'left';
        ctx.fillText('pI = ' + pi.toFixed(2), X(pi) + (X(pi) > (L + R0) / 2 ? -7 : 7), Tp + 14);
      }
      var qn = q(st.pH);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(X(st.pH), Tp); ctx.lineTo(X(st.pH), B); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(X(st.pH), Y(qn), 5, 0, 7); ctx.fill();
      // 막대: 원자단별 이온화 분율
      var bx0, by0, bw, bh;
      if (narrow) { bx0 = 12; by0 = B + 46; bw = w - 24; bh = h - by0 - 70; } else { bx0 = R0 + 30; by0 = Tp; bw = w - bx0 - 12; bh = h - 120; }
      ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left';
      ctx.fillText('pH ' + st.pH.toFixed(2) + '에서 이온화된 분율', bx0, by0 + 10);
      var n = st.groups.length, rowH = Math.min(24, (bh - 20) / Math.max(n, 1)), lw = 78;
      st.groups.forEach(function (g, k) {
        var y = by0 + 22 + k * rowH, f = frac(g, st.pH);
        ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.fillText(g.n, bx0, y + rowH * 0.6);
        ctx.fillStyle = T.figPanel; ctx.fillRect(bx0 + lw, y + 3, bw - lw - 44, rowH - 7);
        ctx.fillStyle = g.s > 0 ? T.figBlue : T.figRed; ctx.fillRect(bx0 + lw, y + 3, (bw - lw - 44) * f, rowH - 7);
        ctx.strokeStyle = T.figLine; ctx.strokeRect(bx0 + lw, y + 3, bw - lw - 44, rowH - 7);
        ctx.fillStyle = T.figInk; ctx.textAlign = 'right'; ctx.fillText((g.s > 0 ? '+' : '−') + f.toFixed(2), bx0 + bw, y + rowH * 0.6);
      });
      // 전기 영동
      var ey = narrow ? h - 30 : h - 44, ex0 = narrow ? 30 : bx0 + 14, ex1 = narrow ? w - 30 : w - 26, ec = (ex0 + ex1) / 2;
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(ex0, ey - 12, ex1 - ex0, 24);
      ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillStyle = T.figRed; ctx.fillText('(−) 음극', ex0 + 26, ey + 30);
      ctx.fillStyle = T.figBlue; ctx.fillText('양극 (+)', ex1 - 26, ey + 30);
      var len = Math.max(-1, Math.min(1, qn / Math.max(1, Math.abs(qmin), qmax))) * (ex1 - ex0) * 0.42;
      ctx.fillStyle = T.figViolet; ctx.beginPath(); ctx.arc(ec, ey, 6, 0, 7); ctx.fill();
      if (Math.abs(qn) > 0.02) {
        var tip = ec - len;
        ctx.strokeStyle = T.figViolet; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ec, ey); ctx.lineTo(tip, ey); ctx.stroke();
        var dir = Math.sign(-len); ctx.beginPath(); ctx.moveTo(tip + dir * 9, ey); ctx.lineTo(tip, ey - 6); ctx.lineTo(tip, ey + 6); ctx.closePath(); ctx.fill();
      }
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.fillText(Math.abs(qn) <= 0.02 ? '거의 움직이지 않음' : (qn > 0 ? '음극 쪽으로' : '양극 쪽으로'), ec, ey - 17);
      rQ.set(st.seq + ' · pH ' + st.pH.toFixed(2) + ' → q̄ = ' + (qn >= 0 ? '+' : '') + qn.toFixed(2));
      rI.set(pi == null ? '0 ~ 14 안에 없음' : 'pI = ' + pi.toFixed(2) + ' (q̄ = 0)');
    }
    api.onResize(draw);
    setSeq(st.seq);
  },
});
