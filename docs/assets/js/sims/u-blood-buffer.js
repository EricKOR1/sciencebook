/* 일반생명과학 1 pH와 완충: 혈액의 탄산–탄산수소 완충계, 헨더슨–하셀바흐 식 pH = 6.1 + log([HCO3-]/(0.03·PCO2)) */
Sims.register('u-blood-buffer', {
  title: '두 손잡이로 지키는 혈액 pH — 탄산–탄산수소 완충계',
  caption: '이산화 탄소 분압(폐가 몇 분 안에 조절)과 탄산수소 이온 농도(콩팥이 며칠에 걸쳐 조절)를 바꾸어 보자. pH는 두 값의 비 [HCO₃⁻]/(0.03·P_CO₂)로만 정해지므로, 한 손잡이가 고장 나도 다른 손잡이로 비를 20 : 1 가까이 되돌리면 pH가 회복된다. 비가 10배 변해야 pH가 1 변한다는 것도 그래프의 간격으로 확인할 수 있다. 37 °C 혈장의 실험값(겉보기 pKₐ 6.1, CO₂ 용해도 0.03 mM/mmHg)을 쓴 헨더슨–하셀바흐 근사이며, 판정은 pH와 두 값의 정상 범위만 본 단순화이다.',
  init: function (api) {
    var PKA = 6.1, SOL = 0.03;
    var s = { pco2: 40, hco3: 24 };
    var HCO3_LINES = [12, 18, 24, 30, 36];

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.52; }, label: '이산화 탄소 분압에 따른 혈액 pH 그래프와 두 성분의 비' });
    var ctx = cv.ctx;

    var rPH = api.readout('pH');
    var rRatio = api.readout('[HCO₃⁻] : 녹은 CO₂');
    var rH = api.readout('[H⁺]');
    var rState = api.readout('판정');

    var slP = api.slider({ id: 'u-blood-buffer-pco2', label: 'P_CO₂ (폐)', min: 15, max: 90, step: 1, value: s.pco2,
      format: function (v) { return v + ' mmHg'; }, onInput: function (v) { s.pco2 = v; update(); } });
    var slH = api.slider({ id: 'u-blood-buffer-hco3', label: '[HCO₃⁻] (콩팥)', min: 8, max: 45, step: 1, value: s.hco3,
      format: function (v) { return v + ' mM'; }, onInput: function (v) { s.hco3 = v; update(); } });
    var g = api.group();
    api.button('정상 (40, 24)', function () { set(40, 24); }, { parent: g });
    api.button('호흡이 얕아짐 (60, 24)', function () { set(60, 24); }, { parent: g });
    api.button('콩팥이 보상 (60, 36)', function () { set(60, 36); }, { parent: g });
    api.button('대사성 산증 (40, 12)', function () { set(40, 12); }, { parent: g });

    function set(p, h) { slP.set(p); slH.set(h); }
    function pH(p, h) { return PKA + Math.log10(h / (SOL * p)); }
    function state(ph, p, h) {
      if (ph >= 7.35 && ph <= 7.45) return (p > 45 || p < 35 || h > 26 || h < 22) ? '정상 pH (보상됨)' : '정상';
      var acid = ph < 7.35, resp = acid ? p > 45 : p < 35, met = acid ? h < 22 : h > 26;
      var kind = resp && met ? '혼합성 ' : resp ? '호흡성 ' : met ? '대사성 ' : '';
      return kind + (acid ? '산증' : '알칼리증');
    }
    function update() {
      var ph = pH(s.pco2, s.hco3);
      rPH.set(ph.toFixed(2));
      rRatio.set((s.hco3 / (SOL * s.pco2)).toFixed(1) + ' : 1');
      rH.set((Math.pow(10, -ph) * 1e9).toFixed(0) + ' nM');
      rState.set(state(ph, s.pco2, s.hco3));
      draw();
    }

    function layout() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { g: { x: 0, y: 0, w: w, h: h * 0.62 }, b: { x: 0, y: h * 0.64, w: w, h: h * 0.36 } }
        : { g: { x: 0, y: 0, w: w * 0.62, h: h }, b: { x: w * 0.65, y: 0, w: w * 0.35, h: h } };
    }
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      graph(T, L.g); bars(T, L.b);
    }
    function graph(T, r) {
      var Lx = r.x + 50, R = r.x + r.w - 14, Tp = r.y + 14, B = r.y + r.h - 40;
      var P0 = 15, P1 = 90, H0 = 6.9, H1 = 7.9;
      var sx = function (p) { return Lx + (p - P0) / (P1 - P0) * (R - Lx); };
      var sy = function (v) { return B - (v - H0) / (H1 - H0) * (B - Tp); };
      // 정상 범위 띠
      ctx.fillStyle = T.figSoftGreen; ctx.fillRect(Lx, sy(7.45), R - Lx, sy(7.35) - sy(7.45));
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      ctx.textAlign = 'right';
      for (var v = 7.0; v <= 7.81; v += 0.1) { ctx.beginPath(); ctx.moveTo(Lx, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(v.toFixed(1), Lx - 6, sy(v) + 4); }
      ctx.textAlign = 'center';
      for (var p = 20; p <= 90; p += 10) { ctx.beginPath(); ctx.moveTo(sx(p), Tp); ctx.lineTo(sx(p), B); ctx.stroke(); ctx.fillText(p, sx(p), B + 14); }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('P_CO₂ (mmHg)', (Lx + R) / 2, B + 31);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('혈액 pH', 0, 0); ctx.restore();
      ctx.fillStyle = T.figGreen; ctx.textAlign = 'right'; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('정상 7.35~7.45', R - 4, sy(7.45) - 4);
      // 등 [HCO3-] 곡선
      ctx.save(); ctx.beginPath(); ctx.rect(Lx, Tp, R - Lx, B - Tp); ctx.clip();
      HCO3_LINES.forEach(function (hc) { curve(hc, T.figLine, 1.2); });
      curve(s.hco3, T.figAccent, 2.6);
      ctx.restore();
      HCO3_LINES.forEach(function (hc) {
        var p = 82, y = sy(pH(p, hc));
        if (y > Tp + 8 && y < B - 4) { ctx.fillStyle = T.figMuted; ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody; ctx.fillText(hc + ' mM', sx(p) + 2, y - 4); }
      });
      // 현재 점
      var ph = pH(s.pco2, s.hco3), cy = Math.max(Tp, Math.min(B, sy(ph)));
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx(s.pco2), B); ctx.lineTo(sx(s.pco2), cy); ctx.lineTo(Lx, cy); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(sx(s.pco2), cy, 7, 0, Math.PI * 2);
      var ok = ph >= 7.35 && ph <= 7.45;
      ctx.fillStyle = ok ? T.figGreen : T.figRed; ctx.fill(); ctx.strokeStyle = T.figPanel; ctx.lineWidth = 2; ctx.stroke();
      if (ph < H0 || ph > H1) { ctx.fillStyle = T.figRed; ctx.textAlign = 'center'; ctx.font = '600 12px ' + T.fontBody; ctx.fillText(ph < H0 ? '▼ 그래프 아래' : '▲ 그래프 위', sx(s.pco2), ph < H0 ? B - 12 : Tp + 14); }
      // 기준점
      ctx.beginPath(); ctx.arc(sx(40), sy(7.4), 4, 0, Math.PI * 2); ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.stroke();
      function curve(hc, col, lw) {
        ctx.beginPath();
        for (var i = 0; i <= 60; i++) { var pp = P0 + (P1 - P0) * i / 60, yy = sy(pH(pp, hc)); if (i) ctx.lineTo(sx(pp), yy); else ctx.moveTo(sx(pp), yy); }
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
      }
    }
    function bars(T, r) {
      var co2 = SOL * s.pco2, ratio = s.hco3 / co2;
      var narrow = cv.w < 560;
      var top = r.y + (narrow ? 22 : 34), bot = r.y + r.h - 36, maxV = 45;
      var bw = Math.min(54, r.w * 0.2), x1 = r.x + r.w * 0.28 - bw / 2, x2 = r.x + r.w * 0.62 - bw / 2;
      var sc = function (v) { return (bot - top) * Math.min(1, v / maxV); };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('비가 pH를 정한다', r.x + r.w * 0.45, r.y + (narrow ? 10 : 18));
      // 염기 쪽
      ctx.fillStyle = T.figSoftBlue; ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1.5;
      ctx.fillRect(x1, bot - sc(s.hco3), bw, sc(s.hco3)); ctx.strokeRect(x1, bot - sc(s.hco3), bw, sc(s.hco3));
      // 산 쪽 (녹은 CO2)
      var hA = Math.max(2, sc(co2));
      ctx.fillStyle = T.figSoftRed; ctx.strokeStyle = T.figRed;
      ctx.fillRect(x2, bot - hA, bw, hA); ctx.strokeRect(x2, bot - hA, bw, hA);
      ctx.strokeStyle = T.figLine; ctx.beginPath(); ctx.moveTo(r.x + 8, bot); ctx.lineTo(r.x + r.w - 8, bot); ctx.stroke();
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figInk;
      ctx.fillText('HCO₃⁻', x1 + bw / 2, bot + 14); ctx.fillText('녹은 CO₂', x2 + bw / 2, bot + 14);
      ctx.fillStyle = T.figMuted;
      ctx.fillText(s.hco3 + ' mM', x1 + bw / 2, bot - sc(s.hco3) - 6);
      ctx.fillText(co2.toFixed(2) + ' mM', x2 + bw / 2, bot - hA - 6);
      ctx.fillStyle = T.figAccent; ctx.font = '600 12px ' + T.fontBody;
      ctx.fillText('비 ' + ratio.toFixed(1) + ' : 1  →  log ' + Math.log10(ratio).toFixed(2), r.x + r.w * 0.45, bot + 30);
      // 오른쪽 메모
      ctx.textAlign = 'left'; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody;
      var nx = x2 + bw + 8;
      if (nx + 40 < r.x + r.w) {
        ctx.fillText('정상: 20 : 1', nx, top + 10);
        ctx.fillText('pH = 6.1', nx, top + 28);
        ctx.fillText('  + log(비)', nx, top + 44);
      }
    }

    api.onResize(draw);
    update();
  },
});
