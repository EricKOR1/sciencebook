/* 일반생명과학 1 단백질: 곁사슬의 pKa와 pH에 따른 전하(헨더슨–하셀바흐), 염다리가 극단적 pH에서 끊어지는 이유 */
Sims.register('u-amino-acid-charge', {
  title: 'pH가 바뀌면 곁사슬의 전하가 바뀐다',
  caption: 'pH를 옮기며 다섯 곁사슬의 평균 전하를 비교해 보자. 각 곁사슬은 pH가 pKₐ와 같을 때 절반만 양성자를 가지며, pH가 pKₐ보다 1 크거나 작으면 약 91 : 9로 한쪽 형태가 우세해진다(예제 6). 생리적 pH 근처에서 전하가 크게 바뀌는 것은 히스티딘뿐이고, 위액처럼 pH가 매우 낮으면 글루탐산·아스파트산의 음전하가 사라져 라이신과의 염다리가 끊어진다(극단적 pH에 의한 변성). pKₐ는 자유 아미노산 곁사슬의 대표값이며, 단백질 속에서는 주변 환경에 따라 조금씩 달라진다.',
  init: function (api) {
    var AA = [
      { k: 'D', name: '아스파트산', pKa: 3.9, acid: true, col: 'figRed' },
      { k: 'E', name: '글루탐산', pKa: 4.1, acid: true, col: 'figAmber' },
      { k: 'H', name: '히스티딘', pKa: 6.0, acid: false, col: 'figViolet' },
      { k: 'K', name: '라이신', pKa: 10.5, acid: false, col: 'figBlue' },
      { k: 'R', name: '아르지닌', pKa: 12.5, acid: false, col: 'figTeal' },
    ];
    var s = { pH: 7.4, sel: 2 };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.35 : 0.55; }, label: 'pH에 따른 곁사슬 전하 그래프와 염다리 그림' });
    var ctx = cv.ctx;

    var rPH = api.readout('pH');
    var rSel = api.readout('선택한 곁사슬');
    var rProt = api.readout('양성자가 붙은 비율');
    var rCharge = api.readout('평균 전하');

    var sl = api.slider({ id: 'u-amino-acid-charge-ph', label: 'pH', min: 0, max: 14, step: 0.1, value: s.pH,
      format: function (v) { return v.toFixed(1); }, onInput: function (v) { s.pH = v; update(); } });
    var g1 = api.group();
    var selBtns = AA.map(function (a, i) {
      return api.button(a.name + ' ' + a.pKa.toFixed(1), function () { s.sel = i; syncSel(); update(); }, { toggle: true, pressed: i === s.sel, parent: g1 });
    });
    var g2 = api.group();
    [['위액 2.0', 2.0], ['리소좀 4.8', 4.8], ['세포질 7.2', 7.2], ['혈액 7.4', 7.4]].forEach(function (p) {
      api.button(p[0], function () { sl.set(p[1]); }, { parent: g2 });
    });

    function syncSel() { selBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === s.sel ? 'true' : 'false'); }); }
    function protFrac(a, pH) { return 1 / (1 + Math.pow(10, pH - a.pKa)); }
    function charge(a, pH) { var f = protFrac(a, pH); return a.acid ? -(1 - f) : f; }
    function update() {
      var a = AA[s.sel];
      rPH.set(s.pH.toFixed(1));
      rSel.set(a.name + ' (pKₐ ' + a.pKa.toFixed(1) + ')');
      rProt.set((protFrac(a, s.pH) * 100).toFixed(protFrac(a, s.pH) > 0.995 || protFrac(a, s.pH) < 0.005 ? 1 : 0) + ' %');
      var c = charge(a, s.pH);
      rCharge.set((c >= 0 ? '+' : '−') + Math.abs(c).toFixed(2));
      draw();
    }

    function layout() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { g: { x: 0, y: 0, w: w, h: h * 0.6 }, b: { x: 0, y: h * 0.62, w: w, h: h * 0.38 } }
        : { g: { x: 0, y: 0, w: w * 0.6, h: h }, b: { x: w * 0.62, y: 0, w: w * 0.38, h: h } };
    }
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      graph(T, L.g); bridge(T, L.b);
    }
    function graph(T, r) {
      var Lx = r.x + 46, R = r.x + r.w - 12, Tp = r.y + 16, B = r.y + r.h - 40;
      var sx = function (p) { return Lx + p / 14 * (R - Lx); };
      var sy = function (c) { return Tp + (1 - c) / 2 * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      ctx.textAlign = 'right';
      [-1, -0.5, 0, 0.5, 1].forEach(function (c) { ctx.beginPath(); ctx.moveTo(Lx, sy(c)); ctx.lineTo(R, sy(c)); ctx.stroke(); ctx.fillText((c > 0 ? '+' : '') + c, Lx - 6, sy(c) + 4); });
      ctx.textAlign = 'center';
      for (var p = 0; p <= 14; p += 2) { ctx.beginPath(); ctx.moveTo(sx(p), Tp); ctx.lineTo(sx(p), B); ctx.stroke(); ctx.fillText(p, sx(p), B + 14); }
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(Lx, sy(0)); ctx.lineTo(R, sy(0)); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('pH', (Lx + R) / 2, B + 31);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('곁사슬의 평균 전하', 0, 0); ctx.restore();
      // 생리적 pH 띠
      ctx.fillStyle = T.figSoftGreen; ctx.globalAlpha = 0.6; ctx.fillRect(sx(7.0), Tp, sx(7.5) - sx(7.0), B - Tp); ctx.globalAlpha = 1;
      AA.forEach(function (a, i) {
        ctx.beginPath();
        for (var j = 0; j <= 140; j++) { var pp = 14 * j / 140, y = sy(charge(a, pp)); if (j) ctx.lineTo(sx(pp), y); else ctx.moveTo(sx(pp), y); }
        ctx.strokeStyle = T[a.col]; ctx.lineWidth = i === s.sel ? 3.2 : 1.4; ctx.globalAlpha = i === s.sel ? 1 : 0.55; ctx.stroke(); ctx.globalAlpha = 1;
        // 곡선 이름: pKa(전하 ±0.5) 지점 옆
        var dx = a.k === 'D' ? -12 : 12, hy = a.acid ? -0.5 : 0.5;
        ctx.fillStyle = T[a.col]; ctx.font = (i === s.sel ? '700 ' : '600 ') + '13px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(a.k, sx(a.pKa) + dx, sy(hy) + 4);
      });
      // 선택한 곁사슬의 pKa 표시
      var a = AA[s.sel], half = a.acid ? -0.5 : 0.5;
      ctx.setLineDash([3, 3]); ctx.strokeStyle = T[a.col]; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx(a.pKa), B); ctx.lineTo(sx(a.pKa), sy(half)); ctx.lineTo(Lx, sy(half)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T[a.col]; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.textAlign = 'right'; ctx.fillText('pKₐ에서 전하 절반', Math.max(Lx + 96, sx(a.pKa) - 18), sy(half) + (a.acid ? 16 : -8));
      // 현재 pH 선
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(sx(s.pH), Tp); ctx.lineTo(sx(s.pH), B); ctx.stroke();
      AA.forEach(function (aa, i) {
        ctx.beginPath(); ctx.arc(sx(s.pH), sy(charge(aa, s.pH)), i === s.sel ? 6 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = T[aa.col]; ctx.fill();
      });
    }
    function bridge(T, r) {
      // Glu(−)와 Lys(+) 사이의 염다리: 두 전하의 곱으로 세기를 어림
      var e = AA[1], k = AA[3];
      var qE = -charge(e, s.pH), qK = charge(k, s.pH), str = qE * qK;
      var cx = r.x + r.w / 2, narrow = cv.w < 560;
      var y0 = r.y + (narrow ? 16 : 26);
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('글루탐산 – 라이신 염다리', cx, y0);
      var by = r.y + r.h * (narrow ? 0.38 : 0.4), gap = Math.min(70, r.w * 0.26);
      // 두 주사슬
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - gap - 26, by - 40); ctx.lineTo(cx - gap - 26, by + 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + gap + 26, by - 40); ctx.lineTo(cx + gap + 26, by + 40); ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = T.figMuted;
      ctx.beginPath(); ctx.moveTo(cx - gap - 26, by); ctx.lineTo(cx - gap, by); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + gap + 26, by); ctx.lineTo(cx + gap, by); ctx.stroke();
      ctx.lineCap = 'butt';
      ion(cx - gap, by, qE, -1, T.figRed, T.figSoftRed, 'COO⁻', 'COOH');
      ion(cx + gap, by, qK, 1, T.figBlue, T.figSoftBlue, 'NH₃⁺', 'NH₂');
      // 끌림
      if (str > 0.02) {
        ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1 + 3 * str; ctx.globalAlpha = 0.3 + 0.7 * str;
        ctx.beginPath(); ctx.moveTo(cx - gap + 20, by); ctx.lineTo(cx + gap - 20, by); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      }
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      ctx.fillText('E (pKₐ 4.1)', cx - gap, by + 58); ctx.fillText('K (pKₐ 10.5)', cx + gap, by + 58);
      var msg = str > 0.8 ? '염다리 유지' : str > 0.2 ? '염다리 약해짐' : '염다리 끊어짐';
      ctx.fillStyle = str > 0.8 ? T.figGreen : str > 0.2 ? T.figAmber : T.figRed; ctx.font = '600 13px ' + T.fontBody;
      ctx.fillText(msg, cx, by + (narrow ? 78 : 84));
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('두 곁사슬이 모두 전하를 띨 확률 ' + Math.round(str * 100) + ' %', cx, by + (narrow ? 95 : 102));
      function ion(x, y, q, sign, stroke, fill, on, off) {
        var rad = 19;
        ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fillStyle = q > 0.5 ? fill : T.figPanel; ctx.fill();
        ctx.strokeStyle = stroke; ctx.lineWidth = 1 + 2 * q; ctx.setLineDash(q > 0.5 ? [] : [3, 3]); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = q > 0.5 ? stroke : T.figMuted; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(q > 0.5 ? on : off, x, y + 4);
      }
    }

    api.onResize(draw);
    update();
  },
});
