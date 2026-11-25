/* 유기화학 1: pH–화학종 분율 탐색기 — 유기 화합물의 pKa 와 헨더슨–하셀바흐 식으로 본 양성자화 분율, 두 화합물의 분리 구간 */
Sims.register('mj-acid-base-speciation', {
  title: 'pH–화학종 분율 탐색기',
  caption: '화합물을 하나 또는 둘 고르고 pH 슬라이더를 움직여 보자. 곡선은 산 형태(HA 또는 BH⁺)의 분율 f = 1/(1 + 10^(pH − pKa))이고, pH = pKa에서 정확히 50 %, pKa에서 2만큼 벗어나면 99 : 1이 된다. 아세트산·페놀·아스피린·에탄올은 산 형태가 중성(HA)이고, 메틸암모늄·피리디늄 이온은 산 형태가 양이온(BH⁺)이어서 중성 형태가 염기 B이다. 두 화합물을 고르면 한쪽이 90 % 이상 이온, 다른 쪽이 90 % 이상 중성인 pH 구간(산–염기 추출로 나눌 수 있는 구간)을 옅게 칠한다(초록: 화합물 1이 이온, 호박색: 화합물 2가 이온). 묽은 수용액, 25 ℃, 활동도 = 농도로 가정했고 각 화합물은 양성자 하나만 주고받는다고 보았다.',
  init: function (api) {
    var C = [
      { n: '아세트산', pKa: 4.76, type: 'HA', acid: 'CH₃COOH', base: 'CH₃COO⁻' },
      { n: '아스피린', pKa: 3.5, type: 'HA', acid: 'HA', base: 'A⁻' },
      { n: '피리디늄 이온', pKa: 5.2, type: 'BH', acid: 'C₅H₅NH⁺', base: 'C₅H₅N' },
      { n: '페놀', pKa: 10.0, type: 'HA', acid: 'C₆H₅OH', base: 'C₆H₅O⁻' },
      { n: '메틸암모늄 이온', pKa: 10.6, type: 'BH', acid: 'CH₃NH₃⁺', base: 'CH₃NH₂' },
      { n: '에탄올', pKa: 16, type: 'HA', acid: 'CH₃CH₂OH', base: 'CH₃CH₂O⁻' }
    ];
    var BODY = [{ n: '위액', pH: 1.5 }, { n: '소장', pH: 6.5 }, { n: '혈장', pH: 7.4 }];
    var st = { a: 0, b: -1, pH: 7.4 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.52; }, label: 'pH에 따른 산 형태 분율 곡선' });
    var ctx = cv.ctx;
    var r1 = api.readout('화합물 1  '), r2 = api.readout('화합물 2  '), rs = api.readout('분리  ');
    api.slider({ id: 'mj-acid-base-speciation-ph', label: 'pH', min: 0, max: 14, step: 0.05, value: st.pH,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.pH = v; draw(); } });
    var g1 = api.group(), g2 = api.group();
    var lab1 = document.createElement('span'); lab1.textContent = '화합물 1: '; lab1.style.fontSize = '0.9em'; g1.appendChild(lab1);
    var lab2 = document.createElement('span'); lab2.textContent = '화합물 2: '; lab2.style.fontSize = '0.9em'; g2.appendChild(lab2);
    var b1 = C.map(function (c, k) {
      return api.button(c.n, function () { st.a = k; if (st.b === k) st.b = -1; sync(); draw(); }, { toggle: true, pressed: k === st.a, parent: g1 });
    });
    var b2 = [api.button('없음', function () { st.b = -1; sync(); draw(); }, { toggle: true, pressed: true, parent: g2 })].concat(C.map(function (c, k) {
      return api.button(c.n, function () { if (k !== st.a) st.b = k; sync(); draw(); }, { toggle: true, pressed: false, parent: g2 });
    }));
    function sync() {
      b1.forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === st.a)); });
      b2.forEach(function (b, k) { b.setAttribute('aria-pressed', String(k - 1 === st.b)); b.disabled = (k - 1 === st.a); });
    }
    sync();
    function fAcid(c, pH) { return 1 / (1 + Math.pow(10, pH - c.pKa)); }
    function fIon(c, pH) { var f = fAcid(c, pH); return c.type === 'HA' ? 1 - f : f; }
    function pct(v) { v *= 100; return v >= 99.95 ? '> 99.9 %' : v < 0.05 ? '< 0.1 %' : (v >= 10 ? v.toFixed(1) : v.toFixed(2)) + ' %'; }
    function sepAt(pH) {
      if (st.b < 0) return 0;
      var A = C[st.a], B = C[st.b], ia = fIon(A, pH), ib = fIon(B, pH);
      if (ia >= 0.9 && ib <= 0.1) return 1;     // A 이온, B 중성
      if (ib >= 0.9 && ia <= 0.1) return 2;     // B 이온, A 중성
      return 0;
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var narrow = w < 560;
      var L = narrow ? 44 : 56, R = w - (narrow ? 14 : 24), Tp = 30, B = h - (narrow ? 58 : 62);
      var X = function (p) { return L + p / 14 * (R - L); }, Y = function (f) { return B - f * (B - Tp); };
      // 분리 구간
      if (st.b >= 0) {
        var col = [null, T.figSoftGreen, T.figSoftAmber];
        for (var i = 0; i < 560; i++) {
          var p0 = 14 * i / 560, s = sepAt(p0 + 14 / 1120);
          if (s) { ctx.fillStyle = col[s]; ctx.fillRect(X(p0), Tp, (R - L) / 560 + 0.6, B - Tp); }
        }
      }
      // 격자·축
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      for (var p = 0; p <= 14; p += 2) {
        ctx.beginPath(); ctx.moveTo(X(p), Tp); ctx.lineTo(X(p), B); ctx.stroke();
        ctx.textAlign = 'center'; ctx.fillText(String(p), X(p), B + 14);
      }
      [0, 0.25, 0.5, 0.75, 1].forEach(function (f) {
        ctx.beginPath(); ctx.moveTo(L, Y(f)); ctx.lineTo(R, Y(f)); ctx.stroke();
        ctx.textAlign = 'right'; ctx.fillText(String(f), L - 5, Y(f) + 4);
      });
      ctx.strokeStyle = T.figLine; ctx.strokeRect(L, Tp, R - L, B - Tp);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('pH', (L + R) / 2, B + 30);
      ctx.save(); ctx.translate(12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('산 형태(HA·BH⁺)의 분율', 0, 0); ctx.restore();
      // 체액 pH 눈금
      ctx.font = '11px ' + T.fontBody;
      BODY.forEach(function (bd, k) {
        ctx.strokeStyle = T.figTeal; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(X(bd.pH), B); ctx.lineTo(X(bd.pH), B - 8); ctx.stroke();
        ctx.fillStyle = T.figTeal; ctx.textAlign = 'center';
        ctx.fillText(bd.n + ' ' + bd.pH, X(bd.pH) + (bd.n === '소장' ? -14 : bd.n === '혈장' ? 16 : 0), B + (narrow ? 42 : 44) + (k === 1 && narrow ? 12 : 0));
      });
      // 곡선
      var list = [[C[st.a], T.figAccent]];
      if (st.b >= 0) list.push([C[st.b], T.figRed]);
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp - 2, R - L, B - Tp + 4); ctx.clip();
      list.forEach(function (it, k) {
        var c = it[0], color = it[1];
        ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath();
        for (var i = 0; i <= 280; i++) { var pp = 14 * i / 280, yy = Y(fAcid(c, pp)); if (i) ctx.lineTo(X(pp), yy); else ctx.moveTo(X(pp), yy); }
        ctx.stroke();
        if (c.pKa <= 14) {
          ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(X(c.pKa), Tp); ctx.lineTo(X(c.pKa), B); ctx.stroke(); ctx.setLineDash([]);
        }
      });
      ctx.restore();
      // pKa 이름표
      ctx.font = '600 11px ' + T.fontBody;
      list.forEach(function (it, k) {
        var c = it[0], color = it[1];
        ctx.fillStyle = color;
        if (c.pKa <= 14) {
          var right = X(c.pKa) < (L + R) / 2;
          ctx.textAlign = right ? 'left' : 'right';
          ctx.fillText(narrow ? 'pKa ' + c.pKa : 'pKa ' + c.pKa + ' (pH = pKa → 50 %)', X(c.pKa) + (right ? 5 : -5), narrow ? Tp + 30 + k * 15 : Y(0.14) + k * 15);
        } else {
          ctx.textAlign = 'right';
          ctx.fillText('pKa ' + c.pKa + ' → 범위 밖(pH 14에서도 거의 산 형태)', R - 5, Y(0.92) + k * 15);
        }
      });
      // 현재 pH
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(X(st.pH), Tp); ctx.lineTo(X(st.pH), B); ctx.stroke(); ctx.setLineDash([]);
      list.forEach(function (it) {
        ctx.fillStyle = it[1]; ctx.beginPath(); ctx.arc(X(st.pH), Y(fAcid(it[0], st.pH)), 6, 0, 7); ctx.fill();
        ctx.strokeStyle = T.figPanel; ctx.lineWidth = 1.5; ctx.stroke();
      });
      // 범례
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      list.forEach(function (it, k) {
        var c = it[0];
        var tx = c.n + (narrow ? '' : (c.type === 'HA' ? '  (HA 중성 / A⁻ 이온)' : '  (BH⁺ 이온 / B 중성)'));
        var yy = Tp + (narrow ? 0 : 0) + 14 + k * 16, xx = narrow ? L + 6 : R - 8 - ctx.measureText(tx).width - 18;
        if (!narrow) {
          ctx.fillStyle = T.figPanel; ctx.globalAlpha = 0.8; ctx.fillRect(xx - 4, yy - 11, ctx.measureText(tx).width + 26, 15); ctx.globalAlpha = 1;
        }
        if (narrow) { yy = B - 44 + k * 16; xx = R - 8 - ctx.measureText(tx).width - 18; ctx.fillStyle = T.figPanel; ctx.globalAlpha = 0.8; ctx.fillRect(xx - 4, yy - 11, ctx.measureText(tx).width + 26, 15); ctx.globalAlpha = 1; }
        ctx.fillStyle = it[1]; ctx.fillRect(xx, yy - 6, 14, 3);
        ctx.fillStyle = T.figInk; ctx.fillText(tx, xx + 18, yy);
      });
      function ro(c) {
        var f = fAcid(c, st.pH);
        return c.type === 'HA' ? 'HA ' + pct(f) + ' / A⁻ ' + pct(1 - f) : 'BH⁺ ' + pct(f) + ' / B ' + pct(1 - f);
      }
      r1.set(C[st.a].n + ' — ' + ro(C[st.a]));
      r2.set(st.b >= 0 ? C[st.b].n + ' — ' + ro(C[st.b]) : '고르지 않음');
      if (st.b < 0) rs.set('화합물 2를 고르면 분리 구간을 칠한다');
      else {
        var s = sepAt(st.pH), lo = null, hi = null, segs = [];
        for (var i = 0; i <= 1400; i++) { var pp = i / 100, on = sepAt(pp) > 0; if (on && lo === null) lo = pp; if ((!on || i === 1400) && lo !== null) { segs.push([lo, on ? pp : pp - 0.01]); lo = null; } }
        var txt = segs.length ? 'pH ' + segs.map(function (g) { return g[0].toFixed(1) + '–' + g[1].toFixed(1); }).join(', ') : '없음(pKa가 너무 가깝다)';
        rs.set((s === 1 ? '이 pH에서 분리됨: ' + C[st.a].n + ' 이온, ' + C[st.b].n + ' 중성' : s === 2 ? '이 pH에서 분리됨: ' + C[st.b].n + ' 이온, ' + C[st.a].n + ' 중성' : '이 pH에서는 분리 안 됨') + ' · 분리 구간 ' + txt);
      }
    }
    api.onResize(draw);
    draw();
  },
});
