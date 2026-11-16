/* 화학 4 역동적인 화학 반응: 강산·강염기 수용액을 10배씩 묽힐 때 [H₃O⁺], [OH⁻], pH의 변화 (Kw = 1.0×10⁻¹⁴, 25 °C) */
Sims.register('ph-dilution', {
  title: '10배씩 묽히면 pH는 1씩 — 그런데 7을 넘지 않는다',
  caption: '0.10 M 염산(또는 수산화 나트륨 수용액)을 ‘10배 묽히기’로 계속 묽혀 보자. 처음에는 [H₃O⁺](또는 [OH⁻])가 10분의 1씩 줄어 pH가 1씩 변하지만, 용질의 농도가 10⁻⁷ M 가까이 작아지면 물의 자동 이온화로 생기는 이온을 무시할 수 없어 pH는 7에 가까워질 뿐 넘지 않는다(점선은 물을 무시했을 때의 잘못된 예상). 어느 단계에서든 [H₃O⁺][OH⁻] = Kw = 1.0×10⁻¹⁴이다. 25 °C, 강산·강염기는 모두 이온화한다고 가정했고, 값은 물의 자동 이온화로 생기는 이온까지 함께 계산했다.',
  init: function (api) {
    var KW = 1e-14, NMAX = 9;
    var state = { kind: 'acid', n: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.55 : 0.55; }, label: '희석 횟수에 따른 pH 그래프, pH 눈금, 수소 이온과 수산화 이온 농도 막대' });
    var ctx = cv.ctx;

    var rC = api.readout('용질의 농도');
    var rH = api.readout('[H₃O⁺]');
    var rO = api.readout('[OH⁻]');
    var rP = api.readout('pH');

    var g = api.group();
    var bA = api.button('강산: 염산 HCl', function () { setKind('acid'); }, { toggle: true, pressed: true, parent: g });
    var bB = api.button('강염기: 수산화 나트륨 NaOH', function () { setKind('base'); }, { toggle: true, parent: g });
    var slider = api.slider({ id: 'ph-dilution-n', label: '10배 희석 횟수', min: 0, max: NMAX, step: 1, value: 0,
      format: function (v) { return v + '회'; }, onInput: function (v) { state.n = v; draw(); readouts(); } });
    api.button('10배 묽히기', function () { if (state.n < NMAX) slider.set(state.n + 1); }, { primary: true });
    api.button('처음으로', function () { slider.set(0); });

    function setKind(k) {
      state.kind = k;
      bA.setAttribute('aria-pressed', k === 'acid' ? 'true' : 'false');
      bB.setAttribute('aria-pressed', k === 'base' ? 'true' : 'false');
      draw(); readouts();
    }
    function calc(n, kind) {
      var c = 0.1 * Math.pow(10, -n), main = (c + Math.sqrt(c * c + 4 * KW)) / 2;   // 용질 + 물의 자동 이온화
      var H = kind === 'acid' ? main : KW / main, O = KW / H;
      return { c: c, H: H, O: O, pH: -Math.log10(H) };
    }
    var SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
    function sci(x) {
      var e = Math.floor(Math.log10(x) + 1e-9), a = x / Math.pow(10, e);
      if (a >= 9.95) { a /= 10; e += 1; }
      return a.toFixed(1) + '×10' + String(e).split('').map(function (ch) { return SUP[ch]; }).join('');
    }
    function readouts() {
      var r = calc(state.n, state.kind);
      rC.set((state.kind === 'acid' ? 'HCl ' : 'NaOH ') + sci(r.c) + ' M');
      rH.set(sci(r.H) + ' M'); rO.set(sci(r.O) + ' M'); rP.set(r.pH.toFixed(2));
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var G, S;
      if (narrow) { G = { x: 0, y: 0, w: w, h: h * 0.5 }; S = { x: 0, y: h * 0.52, w: w, h: h * 0.48 }; }
      else { G = { x: 0, y: 0, w: w * 0.5, h: h }; S = { x: w * 0.53, y: 0, w: w * 0.47, h: h }; }
      graph(T, G); scale(T, S);
    }
    function graph(T, r) {
      var L = r.x + 40, R = r.x + r.w - 10, Tp = r.y + 28, B = r.y + r.h - 34, acid = state.kind === 'acid';
      var sx = function (n) { return L + n / NMAX * (R - L); }, sy = function (p) { return B - p / 14 * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('희석 횟수에 따른 pH', r.x + 6, r.y + 14);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      for (var p = 0; p <= 14; p += 2) { ctx.beginPath(); ctx.moveTo(L, sy(p)); ctx.lineTo(R, sy(p)); ctx.stroke(); ctx.fillText(p, L - 6, sy(p) + 4); }
      ctx.textAlign = 'center';
      for (var n = 0; n <= NMAX; n++) ctx.fillText(n, sx(n), B + 14);
      ctx.font = '11px ' + T.fontBody; ctx.fillText('10배 희석 횟수', (L + R) / 2, B + 28);
      // 중성선
      ctx.strokeStyle = T.figGreen; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L, sy(7)); ctx.lineTo(R, sy(7)); ctx.stroke();
      ctx.fillStyle = T.figGreen; ctx.textAlign = 'right'; ctx.font = '600 11px ' + T.fontBody; ctx.fillText('중성 pH 7', R, sy(7) + (acid ? 14 : -6));
      // 물을 무시한 예상(점선)
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.5; ctx.beginPath();
      for (var k = 0; k <= NMAX; k++) { var pn = acid ? 1 + k : 13 - k; var X = sx(k), Y = sy(Math.max(0, Math.min(14, pn))); if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('물을 무시한 예상(틀림)', sx(6.6), sy(acid ? 9.6 : 4.4) + (acid ? -14 : 14));
      // 실제 값
      var col = acid ? T.figRed : T.figBlue;
      ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.beginPath();
      for (var j = 0; j <= state.n; j++) { var q = calc(j, state.kind); if (j) ctx.lineTo(sx(j), sy(q.pH)); else ctx.moveTo(sx(j), sy(q.pH)); }
      ctx.stroke();
      for (var i = 0; i <= state.n; i++) {
        var c = calc(i, state.kind);
        ctx.beginPath(); ctx.arc(sx(i), sy(c.pH), i === state.n ? 6 : 4, 0, Math.PI * 2); ctx.fillStyle = i === state.n ? col : T.figPanel; ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
      }
      var cur = calc(state.n, state.kind);
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontMono; ctx.textAlign = state.n > 6 ? 'right' : 'left';
      ctx.fillText('pH ' + cur.pH.toFixed(2), sx(state.n) + (state.n > 6 ? -10 : 10), sy(cur.pH) + (acid ? -10 : 18));
    }
    function scale(T, r) {
      var cur = calc(state.n, state.kind), L = r.x + 10, R = r.x + r.w - 10, y = r.y + 34;
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('pH 눈금', L, r.y + 14);
      // pH 띠 (산성 빨강 ~ 중성 초록 ~ 염기성 파랑: 토큰 색)
      var bw = (R - L) / 14;
      for (var p = 0; p < 14; p++) {
        ctx.fillStyle = p < 6 ? T.figSoftRed : p < 8 ? T.figSoftGreen : T.figSoftBlue;
        ctx.fillRect(L + p * bw, y, bw, 20);
      }
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, y, R - L, 20);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      for (var t = 0; t <= 14; t += 2) ctx.fillText(t, L + t * bw, y + 34);
      ctx.font = '11px ' + T.fontBody;
      ctx.fillStyle = T.figRed; ctx.textAlign = 'left'; ctx.fillText('산성', L, y - 4);
      ctx.fillStyle = T.figGreen; ctx.textAlign = 'center'; ctx.fillText('중성', L + 7 * bw, y - 4);
      ctx.fillStyle = T.figBlue; ctx.textAlign = 'right'; ctx.fillText('염기성', R, y - 4);
      var mx = L + cur.pH * bw;
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.moveTo(mx, y + 20); ctx.lineTo(mx - 7, y + 32); ctx.lineTo(mx + 7, y + 32); ctx.closePath(); ctx.fill();
      ctx.fillRect(mx - 1.5, y - 2, 3, 24);
      // 농도 막대(로그 눈금): 10⁰ M ~ 10⁻¹⁴ M
      var by = y + 62, bh = Math.min(30, (r.h - (by - r.y) - 60) / 2.4), lx = L + 64, lw = R - lx - 6;
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('이온의 몰 농도 (로그 눈금)', L, by - 8);
      [['[H₃O⁺]', cur.H, T.figRed, T.figSoftRed], ['[OH⁻]', cur.O, T.figBlue, T.figSoftBlue]].forEach(function (d, i) {
        var yy = by + i * (bh + 12), len = lw * (14 + Math.log10(d[1])) / 14;
        ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText(d[0], lx - 8, yy + bh / 2 + 4);
        ctx.fillStyle = d[3]; ctx.fillRect(lx, yy, lw, bh);
        ctx.fillStyle = d[2]; ctx.fillRect(lx, yy, Math.max(1, len), bh);
        ctx.fillStyle = T.figPanel; ctx.font = '600 11px ' + T.fontMono; ctx.textAlign = 'left';
        var lab = sci(d[1]) + ' M';
        if (len > ctx.measureText(lab).width + 12) ctx.fillText(lab, lx + 6, yy + bh / 2 + 4);
        else { ctx.fillStyle = T.figInk; ctx.fillText(lab, lx + len + 6, yy + bh / 2 + 4); }
      });
      var ay = by + 2 * (bh + 12) + 4;
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      ctx.fillText('10⁻¹⁴', lx, ay + 8); ctx.fillText('10⁻⁷', lx + lw / 2, ay + 8); ctx.fillText('10⁰ M', lx + lw, ay + 8);
      ctx.fillStyle = T.figAccent; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('[H₃O⁺] × [OH⁻] = ' + sci(cur.H * cur.O) + ' = Kw (25 °C)', (L + R) / 2, ay + 30);
    }

    api.onResize(draw);
    readouts(); draw();
  },
});
