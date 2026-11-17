/* 일반생명과학 3 세포호흡의 ATP 수지: 단계별 기질 수준 인산화 + NADH·FADH2의 산화적 인산화(P/O 비 = 퍼내는 H+ ÷ ATP 1개당 H+), 셔틀, 연료(포도당·팔미트산), 산소 유무 */
Sims.register('u-atp-yield', {
  title: '포도당 한 분자는 ATP 몇 개? — 단계별 ATP 장부',
  caption: '연료·셔틀·산소 조건과 ‘ATP 1개당 필요한 H⁺ 수’를 바꾸며 단계별 막대가 어떻게 달라지는지 보자. NADH 1개는 H⁺ 10개, FADH₂ 1개는 H⁺ 6개를 퍼내므로 ATP 1개당 H⁺ 4개이면 각각 2.5, 1.5 ATP가 되고, 포도당은 셔틀에 따라 32 또는 30 ATP가 된다. 대부분의 ATP는 기질 수준 인산화(주황)가 아니라 전자 운반체(파랑·청록)에서 나오므로, 산소가 없으면 포도당은 해당 과정의 2 ATP만 남고 지방산은 β 산화가 멈춘다. 퍼내는 H⁺ 수는 원고의 값으로 고정했고, 효율은 표준 조건(ATP 30.5 kJ/mol, 포도당 2870 kJ/mol)으로 계산했다.',
  init: function (api) {
    var s = { fuel: 'glc', shuttle: 'ma', hpa: 4, o2: true };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.15 : 0.5; }, label: '단계별 ATP 수를 나타낸 막대그래프' });
    var ctx = cv.ctx;

    var rTot = api.readout('합계');
    var rPO = api.readout('NADH / FADH₂ 1개');
    var rEff = api.readout('효율 / 무게당');

    var g1 = api.group();
    var bG = api.button('포도당', function () { s.fuel = 'glc'; sync(); update(); }, { toggle: true, pressed: true, parent: g1 });
    var bP = api.button('팔미트산(C₁₆)', function () { s.fuel = 'pal'; sync(); update(); }, { toggle: true, pressed: false, parent: g1 });
    var g2 = api.group();
    var bMA = api.button('말산–아스파트산 셔틀', function () { s.shuttle = 'ma'; sync(); update(); }, { toggle: true, pressed: true, parent: g2 });
    var bGP = api.button('글리세롤 인산 셔틀', function () { s.shuttle = 'gp'; sync(); update(); }, { toggle: true, pressed: false, parent: g2 });
    var bO = api.button('산소 없음', function () { s.o2 = !s.o2; sync(); update(); }, { toggle: true, pressed: false, parent: g2 });
    api.slider({ id: 'u-atp-yield-hpa', label: 'ATP 1개당 필요한 H⁺', min: 2.7, max: 5, step: 0.1, value: s.hpa,
      format: function (v) { return v.toFixed(1) + '개'; }, onInput: function (v) { s.hpa = v; update(); } });

    function sync() {
      bG.setAttribute('aria-pressed', s.fuel === 'glc' ? 'true' : 'false');
      bP.setAttribute('aria-pressed', s.fuel === 'pal' ? 'true' : 'false');
      bMA.setAttribute('aria-pressed', s.shuttle === 'ma' ? 'true' : 'false');
      bGP.setAttribute('aria-pressed', s.shuttle === 'gp' ? 'true' : 'false');
      bO.setAttribute('aria-pressed', s.o2 ? 'false' : 'true');
      bMA.disabled = bGP.disabled = s.fuel !== 'glc';
    }
    function rows() {
      // 각 단계: 기질 수준 ATP(sub), NADH, FADH2 수
      if (s.fuel === 'glc') {
        var cyto = s.shuttle === 'ma' ? { n: 2, f: 0 } : { n: 0, f: 2 };
        return [
          { name: '해당 과정', sub: 2, n: 0, f: 0 },
          { name: '해당 과정의 NADH 2', note: s.shuttle === 'ma' ? '→ 기질의 NADH' : '→ Q로 (FAD)', sub: 0, n: cyto.n, f: cyto.f, aer: true },
          { name: '피루브산 산화 ×2', sub: 0, n: 2, f: 0, aer: true },
          { name: '시트르산 회로 ×2', sub: 2, n: 6, f: 2, aer: true },
        ];
      }
      return [
        { name: '지방산 활성화', sub: -2, n: 0, f: 0, aer: true },
        { name: 'β 산화 ×7', sub: 0, n: 7, f: 7, aer: true },
        { name: '시트르산 회로 ×8', sub: 8, n: 24, f: 8, aer: true },
      ];
    }
    function vals() {
      var pn = 10 / s.hpa, pf = 6 / s.hpa;
      return rows().map(function (r) {
        var on = s.o2 || !r.aer;
        var a = on ? r.sub : 0, b = on ? r.n * pn : 0, c = on ? r.f * pf : 0;
        return { r: r, on: on, sub: a, nadh: b, fad: c, tot: a + b + c };
      });
    }
    function update() {
      var v = vals(), tot = v.reduce(function (t, x) { return t + x.tot; }, 0);
      rTot.set(tot.toFixed(1).replace(/\.0$/, '') + ' ATP');
      rPO.set((10 / s.hpa).toFixed(2) + ' / ' + (6 / s.hpa).toFixed(2) + ' ATP');
      if (s.fuel === 'glc') rEff.set(Math.round(tot * 30.5 / 2870 * 100) + ' % (표준 조건)');
      else rEff.set(tot > 0 ? '1 g당 ' + (tot / 256 * 1000).toFixed(0) + ' mmol ATP' : '—');
      draw(v, tot);
    }

    function draw(v, tot) {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var labW = narrow ? 0 : 190, Lx = labW + 14, Rx = w - 56;
      var maxV = s.fuel === 'glc' ? 34 : 110;
      var sx = function (x) { return Lx + x / maxV * (Rx - Lx); };
      var n = v.length + 1, top = 30, rowH = (h - top - 34) / n, bh = Math.min(26, rowH * (narrow ? 0.42 : 0.6));
      // 눈금
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      var step = s.fuel === 'glc' ? 5 : 20;
      for (var t = 0; t <= maxV; t += step) { ctx.beginPath(); ctx.moveTo(sx(t), top - 6); ctx.lineTo(sx(t), h - 30); ctx.stroke(); ctx.fillText(t, sx(t), h - 16); }
      ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(sx(0), top - 6); ctx.lineTo(sx(0), h - 30); ctx.stroke();
      // 범례
      var lg = [['기질 수준 인산화', T.figAmber], ['NADH에서', T.figBlue], ['FADH₂에서', T.figTeal]], lx = Lx;
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      lg.forEach(function (it) { ctx.fillStyle = it[1]; ctx.fillRect(lx, 8, 12, 12); ctx.fillStyle = T.figInk; ctx.fillText(it[0], lx + 16, 18); lx += ctx.measureText(it[0]).width + 34; });
      var cum = 0;
      v.forEach(function (it, i) {
        var yc = top + rowH * (i + 0.5) + (narrow ? 8 : 0), y = yc - bh / 2;
        label(it.r.name + (it.r.note ? ' ' + it.r.note : ''), yc, y, it.on);
        // 누적 폭포: 앞 단계 합계에서 시작
        var x0 = cum;
        if (it.sub < 0) { seg(x0 + it.sub, -it.sub, T.figSoftRed, T.figRed, y); cum += it.sub; }
        else { seg(cum, it.sub, T.figAmber, null, y); cum += it.sub; }
        seg(cum, it.nadh, T.figBlue, null, y); cum += it.nadh;
        seg(cum, it.fad, T.figTeal, null, y); cum += it.fad;
        ctx.fillStyle = it.on ? T.figInk : T.figMuted; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        var txt = it.on ? (it.tot >= 0 ? '+' : '−') + fmt(Math.abs(it.tot)) : '멈춤';
        ctx.fillText(txt, Math.max(sx(cum), sx(x0)) + 6, yc + 4);
      });
      // 합계 막대
      var yc2 = top + rowH * (v.length + 0.5) + (narrow ? 8 : 0), y2 = yc2 - bh / 2;
      label('합계', yc2, y2, true, true);
      ctx.fillStyle = T.figSoftViolet; ctx.strokeStyle = T.figViolet; ctx.lineWidth = 2;
      ctx.fillRect(sx(0), y2, Math.max(0, sx(tot) - sx(0)), bh); ctx.strokeRect(sx(0), y2, Math.max(0, sx(tot) - sx(0)), bh);
      ctx.fillStyle = T.figViolet; ctx.font = '700 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(fmt(tot) + ' ATP', sx(tot) + 6, yc2 + 5);
      if (!s.o2) {
        ctx.fillStyle = T.figRed; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right';
        ctx.fillText(s.fuel === 'glc' ? '산소 없음: NAD⁺는 발효로 재생' : '산소 없음: NAD⁺·FAD 재생이 안 됨', Rx + 50, 18);
      }
      function label(t, yc, y, on, bold) {
        ctx.fillStyle = on ? T.figInk : T.figMuted; ctx.font = (bold ? '700 ' : '') + '12px ' + T.fontBody;
        if (narrow) { ctx.textAlign = 'left'; ctx.fillText(t, Lx, y - 4); }
        else { ctx.textAlign = 'right'; ctx.fillText(t, labW, yc + 4); }
      }
      function seg(a, len, fill, stroke, y) {
        if (len <= 0) return;
        ctx.fillStyle = fill; ctx.fillRect(sx(a), y, sx(a + len) - sx(a), bh);
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.strokeRect(sx(a), y, sx(a + len) - sx(a), bh); }
      }
    }
    function fmt(x) { return (Math.round(x * 10) / 10).toString(); }

    api.onResize(update);
    sync(); update();
  },
});
