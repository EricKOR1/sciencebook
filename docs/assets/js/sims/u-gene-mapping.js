/* 일반생명과학 5 연관과 유전자 지도: 3점 검정 교배 — 자손 수 → 재조합 빈도 → 순서와 지도 거리, 숨는 이중 교차와 간섭 */
Sims.register('u-gene-mapping', {
  title: '3점 검정 교배로 유전자 지도 그리기',
  caption: '세 유전자에 대해 이형 접합인 개체(어버이 염색체 A C b / a c B)를 aabbcc와 검정 교배하여 자손 1000개체를 얻는다. 위쪽 "실제 지도"의 간격과 병발 계수를 바꾼 뒤 자손을 얻으면, 가장 많은 두 부류(어버이형)와 가장 적은 두 부류(이중 교차형)를 비교해 순서를 정하고, 이웃한 유전자 사이의 재조합 빈도로 거리를 추정한다. 바깥쪽 두 유전자 A와 B만 보면 이중 교차가 숨어 재조합 빈도가 두 거리의 합보다 작게 나온다. 각 구간의 교차 확률을 지도 거리(cM ÷ 100)와 같다고 두었으며(간격 25 cM 이하), 표집 오차 때문에 추정값은 얻을 때마다 조금씩 달라진다.',
  init: function (api) {
    var N = 1000;
    var s = { d1: 10, d2: 20, c: 0.6, counts: null };
    // 순서 A–C–B, 어버이 염색체 A C b / a c B. 대립유전자는 [A, B, C] 순서의 참/거짓(대문자)
    var cls = [
      { g: [1, 0, 1], k: 'P' }, { g: [0, 1, 0], k: 'P' },
      { g: [1, 1, 0], k: 'S1' }, { g: [0, 0, 1], k: 'S1' },
      { g: [1, 1, 1], k: 'S2' }, { g: [0, 0, 0], k: 'S2' },
      { g: [1, 0, 0], k: 'D' }, { g: [0, 1, 1], k: 'D' },
    ];
    var KN = { P: '어버이형', S1: '단일 교차(A–C)', S2: '단일 교차(C–B)', D: '이중 교차' };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.45 : 0.6; }, label: '3점 검정 교배 자손 수 표와 실제·추정 유전자 지도' });
    var ctx = cv.ctx;
    var rOrd = api.readout('추정 순서');
    var rD = api.readout('추정 거리');
    var rAB = api.readout('A–B 직접 재조합 빈도');
    var rCoc = api.readout('병발 계수(관찰/기대)');

    api.slider({ id: 'u-gene-mapping-d1', label: '실제 A–C 거리', min: 2, max: 25, step: 1, value: s.d1,
      format: function (v) { return v + ' cM'; }, onInput: function (v) { s.d1 = v; cross(); } });
    api.slider({ id: 'u-gene-mapping-d2', label: '실제 C–B 거리', min: 2, max: 25, step: 1, value: s.d2,
      format: function (v) { return v + ' cM'; }, onInput: function (v) { s.d2 = v; cross(); } });
    api.slider({ id: 'u-gene-mapping-c', label: '병발 계수(1 − 간섭)', min: 0, max: 1, step: 0.05, value: s.c,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { s.c = v; cross(); } });
    api.button('자손 1000개체 다시 얻기', function () { cross(); }, { primary: true });

    function cross() {
      var r1 = s.d1 / 100, r2 = s.d2 / 100, dco = s.c * r1 * r2;
      var p = { P: 1 - r1 - r2 + dco, S1: r1 - dco, S2: r2 - dco, D: dco };
      var probs = cls.map(function (c) { return p[c.k] / 2; });
      var counts = cls.map(function () { return 0; });
      for (var i = 0; i < N; i++) { var u = Math.random(), k = 0; while (k < 7 && u > probs[k]) { u -= probs[k]; k++; } counts[k]++; }
      s.counts = counts; analyse(); draw();
    }
    function name(g) { return (g[0] ? 'A' : 'a') + (g[1] ? 'B' : 'b') + (g[2] ? 'C' : 'c'); }
    function key(g) { return g.join(''); }
    var est;
    function analyse() {
      var map = {}; cls.forEach(function (c, i) { map[key(c.g)] = s.counts[i]; });
      var sorted = cls.map(function (c, i) { return { g: c.g, n: s.counts[i] }; }).sort(function (a, b) { return b.n - a.n; });
      var par = sorted[0].g;                                   // 가장 많은 부류 = 어버이형 하나(나머지는 그 상보)
      var best = null;
      [0, 1, 2].forEach(function (m) {                         // 가운데 후보 m: 어버이형에서 m만 바꾼 것이 이중 교차형
        var d = par.slice(); d[m] = 1 - d[m];
        var nd = map[key(d)] + map[key(d.map(function (x) { return 1 - x; }))];
        if (!best || nd < best.n) best = { m: m, n: nd };
      });
      function rf(i, j) {                                       // 유전자 i, j 조합이 어버이형과 다른 자손의 비율
        var n = 0; cls.forEach(function (c, k) { if ((c.g[i] === par[i]) !== (c.g[j] === par[j])) n += s.counts[k]; });
        return n / N;
      }
      var mid = best.m, ends = [0, 1, 2].filter(function (x) { return x !== mid; });
      if (ends[0] !== 0 && ends[1] === 0) ends.reverse();       // A가 끝이면 왼쪽에
      var L = 'ABC'[ends[0]], M = 'ABC'[mid], R = 'ABC'[ends[1]];
      var e1 = rf(ends[0], mid), e2 = rf(mid, ends[1]), eOut = rf(ends[0], ends[1]);
      var coc = e1 * e2 > 0 ? (best.n / N) / (e1 * e2) : 0;
      est = { L: L, M: M, R: R, e1: e1, e2: e2, eOut: eOut, dco: best.n, coc: coc, ok: mid === 2 };
      rOrd.set(L + ' – ' + M + ' – ' + R + (est.ok ? '' : ' (실제와 다름)'));
      rD.set((e1 * 100).toFixed(1) + ' + ' + (e2 * 100).toFixed(1) + ' cM');
      rAB.set((eOut * 100).toFixed(1) + '% < ' + ((e1 + e2) * 100).toFixed(1));
      rCoc.set(coc.toFixed(2));
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var A = narrow ? { x: 0, y: 0, w: w, h: h * 0.55 } : { x: 0, y: 0, w: w * 0.52, h: h };
      var M = narrow ? { x: 0, y: h * 0.57, w: w, h: h * 0.43 } : { x: w * 0.55, y: 0, w: w * 0.45, h: h };
      table(T, A); maps(T, M);
    }
    function colOf(T, k) { return { P: T.figBlue, S1: T.figGreen, S2: T.figAmber, D: T.figRed }[k]; }
    function table(T, r) {
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('자손(생식세포) 부류와 개체 수', r.x + 4, r.y + 16);
      var rowH = (r.h - 30) / 8, x0 = r.x + 4, bx = r.x + 56, bwMax = r.w - 56 - 132;
      var mx = Math.max.apply(null, s.counts);
      cls.forEach(function (c, i) {
        var y = r.y + 28 + i * rowH, cy = y + rowH / 2;
        ctx.fillStyle = T.figInk; ctx.font = '600 14px ' + T.fontMono; ctx.textAlign = 'left';
        ctx.fillText(name(c.g), x0, cy + 5);
        var bw = Math.max(1, s.counts[i] / mx * bwMax);
        ctx.fillStyle = colOf(T, c.k); ctx.fillRect(bx, cy - rowH * 0.3, bw, rowH * 0.6);
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontMono;
        ctx.fillText(s.counts[i], bx + bw + 4, cy + 4);
        ctx.fillStyle = colOf(T, c.k); ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right';
        ctx.fillText(KN[c.k], r.x + r.w - 4, cy + 4);
      });
    }
    function maps(T, r) {
      var L = r.x + 18, R = r.x + r.w - 18, scale = (R - L) / 50;    // 50 cM 를 폭 전체로
      ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody;
      var y1 = r.y + 52, y2 = r.y + r.h * 0.5 + 10;
      ctx.fillText('실제 지도', L, y1 - 30);
      chrom(T, y1, [['A', 0], ['C', s.d1], ['B', s.d1 + s.d2]], L, scale, T.figLine);
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('자손 수로 추정한 지도', L, y2 - 30);
      chrom(T, y2, [[est.L, 0], [est.M, est.e1 * 100], [est.R, (est.e1 + est.e2) * 100]], L, scale, est.ok ? T.figAccent : T.figRed);
      // 바깥 두 유전자 직접 재조합 빈도
      var yb = y2 + 46;
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(L, yb); ctx.lineTo(L + est.eOut * 100 * scale, yb); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(L, yb - 5); ctx.lineTo(L, yb + 5); ctx.moveTo(L + est.eOut * 100 * scale, yb - 5); ctx.lineTo(L + est.eOut * 100 * scale, yb + 5); ctx.stroke();
      ctx.fillStyle = T.figRed; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(est.L + '–' + est.R + '만 보면 ' + (est.eOut * 100).toFixed(1) + '%', L, yb + 20);
      ctx.fillStyle = T.figMuted;
      ctx.fillText('이중 교차 ' + est.dco + '개체가 숨어 짧게 나온다', L, yb + 36);
    }
    function chrom(T, y, genes, L, scale, col) {
      var xEnd = L + genes[2][1] * scale;
      ctx.fillStyle = T.figSoftBlue; ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.rect(L - 8, y - 6, xEnd - L + 16, 12); ctx.fill(); ctx.stroke();
      genes.forEach(function (gn, i) {
        var x = L + gn[1] * scale;
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10); ctx.stroke();
        ctx.fillStyle = T.figInk; ctx.font = '600 14px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(gn[0], x, y - 14);
        if (i > 0) {
          var xm = L + (genes[i - 1][1] + gn[1]) / 2 * scale;
          ctx.fillStyle = col; ctx.font = '12px ' + T.fontMono;
          ctx.fillText((gn[1] - genes[i - 1][1]).toFixed(1).replace('.0', ''), xm, y + 24);
        }
      });
    }

    api.onResize(draw);
    cross();
  },
});
