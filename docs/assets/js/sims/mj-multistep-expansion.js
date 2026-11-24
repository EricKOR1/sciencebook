/* 물리화학 1 기체의 성질과 열역학 제1법칙: 다단계 등온 팽창·압축과 가역 일 */
Sims.register('mj-multistep-expansion', {
  title: '다단계 등온 팽창과 가역 일 — 단계를 늘리면 가역 일에 다가간다',
  caption: '단계 수 n을 1부터 늘려 보자. 외부 압력을 처음 압력에서 나중 압력까지 등비로 n번 바꾸면 p–V 도표에 계단이 생기고, 계단 아래 넓이가 계가 한 일 |w|이다. ' +
    'n이 커질수록 계단이 등온선에 붙어 |w|가 가역 일 nRT ln(p₁/p₂)에 다가간다. 「압축」으로 바꾸면 계단이 등온선 위에 생겨 계가 받는 일이 가역 일보다 크고, n이 커질수록 위에서 가역 일로 내려온다. ' +
    '단계 압력이 등비이므로 2단계의 중간 압력은 √(p₁p₂)(10 → 1 bar이면 3.16 bar, |w| = 3.39 kJ)이어서, 중간 압력을 5.00 bar로 둔 예제 5 (3)과 그림의 3.22 kJ와는 다르다(1단계 2.23 kJ, 10단계 5.10 kJ, 가역 5.71 kJ는 예제 5와 같다). ' +
    '이상 기체 1 mol, 298.15 K, 각 단계가 끝날 때마다 열을 주고받아 처음 온도로 돌아온다고 가정했다.',
  init: function (api) {
    var R = 0.08314462618, TK = 298.15, RT = R * TK;   // L·bar/mol
    var st = { n: 2, p1: 10, p2: 1, comp: false };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.6 : 0.56; }, label: '다단계 등온 과정의 p–V 도표와 일 비교 막대' });
    var ctx = cv.ctx;
    api.slider({ id: 'mj-multistep-expansion-n', label: '단계 수 n', min: 1, max: 50, step: 1, value: st.n,
      format: function (v) { return v + '단계'; }, onInput: function (v) { st.n = v; draw(); } });
    api.slider({ id: 'mj-multistep-expansion-p1', label: '높은 압력 p₁', min: 2, max: 20, step: 0.5, value: st.p1,
      format: function (v) { return v.toFixed(1) + ' bar'; }, onInput: function (v) { st.p1 = Math.max(v, st.p2 * 1.5); draw(); } });
    api.slider({ id: 'mj-multistep-expansion-p2', label: '낮은 압력 p₂', min: 0.5, max: 5, step: 0.1, value: st.p2,
      format: function (v) { return v.toFixed(1) + ' bar'; }, onInput: function (v) { st.p2 = Math.min(v, st.p1 / 1.5); draw(); } });
    var bC = api.button('압축으로 바꾸기', function () {
      st.comp = !st.comp; bC.textContent = st.comp ? '팽창으로 바꾸기' : '압축으로 바꾸기';
      bC.setAttribute('aria-pressed', st.comp ? 'true' : 'false'); draw();
    }, { toggle: true, pressed: false });
    var rW = api.readout(''), rRev = api.readout('가역 일 nRT ln(p₁/p₂) '), rRatio = api.readout('비 ');

    // 외부 압력 단계: 팽창 p₁(p₂/p₁)^(k/n), k = 1..n / 압축 k = n-1..0
    function steps(n, comp) {
      var out = [], r = st.p2 / st.p1;
      if (!comp) {
        for (var k = 1; k <= n; k++) {
          var pa = st.p1 * Math.pow(r, (k - 1) / n), pb = st.p1 * Math.pow(r, k / n);
          out.push({ pext: pb, Va: RT / pa, Vb: RT / pb });
        }
      } else {
        for (var j = n - 1; j >= 0; j--) {
          var pa2 = st.p1 * Math.pow(r, (j + 1) / n), pb2 = st.p1 * Math.pow(r, j / n);
          out.push({ pext: pb2, Va: RT / pa2, Vb: RT / pb2 });
        }
      }
      return out;
    }
    function work(n, comp) {   // 일의 크기, kJ (1 L·bar = 100 J)
      return steps(n, comp).reduce(function (s, d) { return s + d.pext * Math.abs(d.Vb - d.Va); }, 0) * 0.1;
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var G = narrow ? { x: 0, y: 0, w: w, h: h * 0.52 } : { x: 0, y: 0, w: w * 0.6, h: h };
      var Q = narrow ? { x: 0, y: h * 0.54, w: w, h: h * 0.46 } : { x: w * 0.62, y: 0, w: w * 0.38, h: h };
      var V1 = RT / st.p1, V2 = RT / st.p2, VMAX = V2 * 1.08, PMAX = st.p1 * 1.12;
      var L = G.x + 52, Rr = G.x + G.w - 12, Tp = G.y + 14, B = G.y + G.h - 42;
      function sx(V) { return L + V / VMAX * (Rr - L); }
      function sy(p) { return B - p / PMAX * (B - Tp); }
      // 축
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      var pt = nice(PMAX), vt = nice(VMAX);
      ctx.textAlign = 'right';
      for (var p = 0; p <= PMAX + 1e-9; p += pt) { ctx.beginPath(); ctx.moveTo(L, sy(p)); ctx.lineTo(Rr, sy(p)); ctx.stroke(); ctx.fillText(+p.toFixed(1), L - 6, sy(p) + 4); }
      ctx.textAlign = 'center';
      for (var V = 0; V <= VMAX + 1e-9; V += vt) { ctx.beginPath(); ctx.moveTo(sx(V), Tp); ctx.lineTo(sx(V), B); ctx.stroke(); ctx.fillText(+V.toFixed(1), sx(V), B + 15); }
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.strokeRect(L, Tp, Rr - L, B - Tp);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('부피 V (L)', (L + Rr) / 2, B + 32);
      ctx.save(); ctx.translate(G.x + 13, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('압력 (bar)', 0, 0); ctx.restore();
      // 계단 음영
      var S = steps(st.n, st.comp);
      ctx.fillStyle = st.comp ? T.figSoftRed : T.figSoftBlue;
      S.forEach(function (d) { var a = Math.min(d.Va, d.Vb), b = Math.max(d.Va, d.Vb); ctx.fillRect(sx(a), sy(d.pext), sx(b) - sx(a), sy(0) - sy(d.pext)); });
      // 등온선
      ctx.beginPath();
      for (var i = 0; i <= 200; i++) { var v = V1 * 0.85 + (VMAX - V1 * 0.85) * i / 200; var y = sy(RT / v); if (i === 0) ctx.moveTo(sx(v), y); else ctx.lineTo(sx(v), y); }
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.8; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
      // 계단 선(외부 압력)
      ctx.beginPath();
      S.forEach(function (d, k) {
        var pPrev = RT / d.Va;
        if (k === 0) ctx.moveTo(sx(d.Va), sy(pPrev));
        ctx.lineTo(sx(d.Va), sy(d.pext)); ctx.lineTo(sx(d.Vb), sy(d.pext));
      });
      ctx.strokeStyle = st.comp ? T.figRed : T.figBlue; ctx.lineWidth = 2.2; ctx.stroke();
      [[V1, st.p1], [V2, st.p2]].forEach(function (q) { ctx.beginPath(); ctx.arc(sx(q[0]), sy(q[1]), 4, 0, 7); ctx.fillStyle = T.figInk; ctx.fill(); });
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
      ctx.fillText('등온선 p = nRT/V', sx(V1 + (V2 - V1) * 0.25) + 4, sy(RT / (V1 + (V2 - V1) * 0.25)) - 10);
      ctx.fillStyle = st.comp ? T.figRed : T.figBlue; ctx.font = '600 12px ' + T.fontBody;
      ctx.fillText(st.comp ? '압축: 계단이 등온선 위' : '팽창: 계단이 등온선 아래', L + 10, Tp + 16);
      // 오른쪽: 막대 두 개 + n에 따른 비
      var wn = work(st.n, st.comp), wr = RT * Math.log(st.p1 / st.p2) * 0.1;
      var bx = Q.x + 14, bw = Q.w - 28, bTop = Q.y + 22, bH = Q.h * 0.42;
      var wmaxAll = Math.max(work(1, true), wr) * 1.05;
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left';
      ctx.fillText('일의 크기 (kJ)', bx, Q.y + 14);
      var bars = [[st.comp ? '받은 일' : '한 일', wn, st.comp ? T.figRed : T.figBlue], ['가역 일', wr, T.figGreen]];
      bars.forEach(function (b, i) {
        var y = bTop + 10 + i * (bH / 2), hh = bH / 2 - 14, len = b[1] / wmaxAll * (bw - 70);
        ctx.fillStyle = b[2]; ctx.fillRect(bx + 60, y, len, hh);
        ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.fillText(b[0], bx, y + hh / 2 + 4);
        ctx.fillText(b[1].toFixed(2), bx + 64 + len, y + hh / 2 + 4);
      });
      // 비 |w|/w_rev 대 n
      var cL = bx + 34, cR = Q.x + Q.w - 10, cT = bTop + bH + 30, cB = Q.y + Q.h - 30;
      var r1 = work(1, st.comp) / wr, rmin, rmax;
      if (st.comp) { rmin = 1.0; rmax = Math.ceil(r1 * 10) / 10; } else { rmin = Math.floor(r1 * 10) / 10; rmax = 1.0; }
      function cx(n) { return cL + (n - 1) / 49 * (cR - cL); }
      function cy(r) { return cB - (r - rmin) / (rmax - rmin) * (cB - cT); }
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.strokeRect(cL, cT, cR - cL, cB - cT);
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      [rmin, rmax].forEach(function (r) { ctx.fillText(r.toFixed(1), cL - 4, cy(r) + 4); });
      ctx.textAlign = 'left'; ctx.fillStyle = T.figGreen; ctx.fillText('= 가역 일', cR - 52, cy(1) + (st.comp ? -5 : 14));
      ctx.textAlign = 'center'; [1, 10, 20, 30, 40, 50].forEach(function (n) { ctx.fillText(n, cx(n), cB + 13); });
      ctx.setLineDash([4, 3]); ctx.strokeStyle = T.figGreen; ctx.beginPath(); ctx.moveTo(cL, cy(1)); ctx.lineTo(cR, cy(1)); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath();
      for (var n = 1; n <= 50; n++) { var yy = cy(work(n, st.comp) / wr); if (n === 1) ctx.moveTo(cx(n), yy); else ctx.lineTo(cx(n), yy); }
      ctx.strokeStyle = st.comp ? T.figRed : T.figBlue; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx(st.n), cy(wn / wr), 4.5, 0, 7); ctx.fillStyle = st.comp ? T.figRed : T.figBlue; ctx.fill();
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'center';
      ctx.fillText('|w| ÷ 가역 일, 단계 수 n에 따라', (cL + cR) / 2, cT - 6);
      ctx.fillText('단계 수 n', (cL + cR) / 2, cB + 27);
      rW.set((st.comp ? '받은 일 ' : '한 일 |w| ') + wn.toFixed(2) + ' kJ');
      rRev.set(wr.toFixed(2) + ' kJ');
      rRatio.set((wn / wr).toFixed(3));
    }
    function nice(x) { var s = x / 5, m = Math.pow(10, Math.floor(Math.log10(s))), r = s / m; return (r < 1.5 ? 1 : r < 3.5 ? 2 : 5) * m; }
    api.onResize(draw);
    draw();
  },
});
