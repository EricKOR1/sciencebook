/* 일반생명과학 2 2차 능동 수송: Na+ 전기 화학적 기울기(농도 항 + 전기 항)로 포도당을 얼마나 농축할 수 있나 — 평형 한계 C안/C밖 = exp(−nΔG_Na/RT) */
Sims.register('u-cotransport', {
  title: 'Na⁺ 내리막으로 포도당 오르막을 — 공동 수송의 에너지 장부',
  caption: '막전위와 세포 안 Na⁺ 농도를 바꾸고, Na⁺ 1개 또는 2개와 짝지은 수송체를 비교해 보자. Na⁺ 1개가 들어올 때의 ΔG는 농도 항 RT ln(C안/C밖)과 전기 항 FΔV의 합이고, 이 내리막 에너지를 포도당 오르막에 모두 쓰면 평형에서 포도당을 exp(−nΔG_Na/RT)배까지 농축할 수 있다. Na⁺를 2개 쓰면 농축 한계가 제곱으로 커지고, 펌프가 멈춰 기울기가 사라지면 공동 수송도 멈춘다. 37 °C, 바깥 Na⁺ 145 mM로 정했고, 포도당이 혈관 쪽으로 빠져나가지 않는다고 본 이론적 최댓값이다(실제 세포는 이 한계까지 가지 않는다).',
  init: function (api) {
    var RT = 8.314 * 310 / 1000, F = 96.485, NA_OUT = 145;   // kJ/mol, kJ/(mol·V)
    var s = { vm: -70, naIn: 12, n: 2 };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.6 : 0.52; }, label: 'Na⁺ 한 개의 자유 에너지 장부와 포도당 농축 한계 그래프' });
    var ctx = cv.ctx;

    var rG = api.readout('ΔG (Na⁺ 1개 들어옴)');
    var rN = api.readout('n × ΔG');
    var rR = api.readout('포도당 농축 한계 C안/C밖');

    var slV = api.slider({ id: 'u-cotransport-vm', label: '막전위 ΔV', min: -100, max: 0, step: 1, value: s.vm,
      format: function (v) { return v + ' mV'; }, onInput: function (v) { s.vm = v; update(); } });
    var slN = api.slider({ id: 'u-cotransport-na', label: '세포 안 [Na⁺]', min: 5, max: 145, step: 1, value: s.naIn,
      format: function (v) { return v + ' mM'; }, onInput: function (v) { s.naIn = v; update(); } });
    var g = api.group();
    var b1 = api.button('Na⁺ 1개 : 포도당 1개', function () { s.n = 1; sync(); update(); }, { toggle: true, pressed: false, parent: g });
    var b2 = api.button('Na⁺ 2개 : 포도당 1개', function () { s.n = 2; sync(); update(); }, { toggle: true, pressed: true, parent: g });
    var g2 = api.group();
    api.button('예제 6 조건 (−70 mV, 12 mM)', function () { slV.set(-70); slN.set(12); }, { parent: g2 });
    api.button('펌프가 멈춘 뒤 (0 mV, 145 mM)', function () { slV.set(0); slN.set(145); }, { parent: g2 });

    function sync() { b1.setAttribute('aria-pressed', s.n === 1 ? 'true' : 'false'); b2.setAttribute('aria-pressed', s.n === 2 ? 'true' : 'false'); }
    function terms() {
      var c = RT * Math.log(s.naIn / NA_OUT), e = F * s.vm / 1000;
      return { c: c, e: e, g: c + e };
    }
    function ratio(n) { var t = terms(); return Math.exp(-n * t.g / RT); }
    function fmtR(x) {
      if (x < 1000) return x.toFixed(x < 10 ? 2 : 0);
      var p = Math.floor(Math.log10(x)); return (x / Math.pow(10, p)).toFixed(1) + '×10' + sup(p);
    }
    function sup(p) { var m = '⁰¹²³⁴⁵⁶⁷⁸⁹'; return String(p).split('').map(function (d) { return m[+d]; }).join(''); }
    function sg(v) { return (v > 0.005 ? '+' : v < -0.005 ? '−' : '') + Math.abs(v).toFixed(1); }
    function update() {
      var t = terms();
      rG.set(sg(t.c) + ' ' + (t.e < 0 ? '− ' : '+ ') + Math.abs(t.e).toFixed(1) + ' = ' + sg(t.g) + ' kJ/mol');
      rN.set(sg(s.n * t.g) + ' kJ/mol');
      rR.set(fmtR(ratio(s.n)) + ' 배');
      draw();
    }

    function layout() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { a: { x: 0, y: 0, w: w, h: h * 0.5 }, b: { x: 0, y: h * 0.52, w: w, h: h * 0.48 } }
        : { a: { x: 0, y: 0, w: w * 0.5, h: h }, b: { x: w * 0.52, y: 0, w: w * 0.48, h: h } };
    }
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      ledger(T, L.a); limit(T, L.b);
    }
    // 왼쪽: Na⁺ 1개의 에너지 계단 (농도 항 → 전기 항 → 합 → ×n)
    function ledger(T, r) {
      var t = terms();
      var Lx = r.x + 50, Rx = r.x + r.w - 8, Tp = r.y + 30, B = r.y + r.h - 40;
      var V1 = 10, V0 = -35;
      var sy = function (v) { return Tp + (V1 - v) / (V1 - V0) * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var v = -30; v <= 10; v += 10) { ctx.beginPath(); ctx.moveTo(Lx, sy(v)); ctx.lineTo(Rx, sy(v)); ctx.stroke(); ctx.fillText(v, Lx - 6, sy(v) + 4); }
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(Lx, sy(0)); ctx.lineTo(Rx, sy(0)); ctx.stroke();
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('ΔG (kJ/mol)', 0, 0); ctx.restore();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('Na⁺이 밖 → 안으로 들어올 때', (Lx + Rx) / 2, r.y + 16);
      var cols = 4, cw = (Rx - Lx) / cols, bw = Math.min(40, cw * 0.62);
      var items = [
        { a: 0, b: t.c, f: T.figSoftBlue, s: T.figBlue, l1: '농도 항', l2: 'RT ln(C안/C밖)' },
        { a: t.c, b: t.g, f: T.figSoftRed, s: T.figRed, l1: '전기 항', l2: 'FΔV' },
        { a: 0, b: t.g, f: T.figViolet, s: T.figViolet, l1: 'Na⁺ 1개', l2: '합', solid: true },
        { a: 0, b: s.n * t.g, f: T.figSoftViolet, s: T.figViolet, l1: '× ' + s.n, l2: '수송체 1회' },
      ];
      items.forEach(function (it, i) {
        var x = Lx + cw * i + (cw - bw) / 2;
        var lo = Math.max(V0, Math.min(it.a, it.b)), hi = Math.min(V1, Math.max(it.a, it.b));
        var y0 = sy(hi), y1 = sy(lo);
        ctx.fillStyle = it.f; ctx.strokeStyle = it.s; ctx.lineWidth = 1.5; ctx.globalAlpha = it.solid ? 0.85 : 1;
        ctx.fillRect(x, y0, bw, Math.max(1, y1 - y0)); ctx.globalAlpha = 1; ctx.strokeRect(x, y0, bw, Math.max(1, y1 - y0));
        if (i < 2) { ctx.setLineDash([2, 3]); ctx.strokeStyle = T.figMuted; ctx.beginPath(); ctx.moveTo(x + bw, sy(it.b)); ctx.lineTo(x + cw, sy(it.b)); ctx.stroke(); ctx.setLineDash([]); }
        var d = it.b - it.a, ty = d < 0 ? Math.min(B - 2, sy(it.b) + 14) : sy(it.b) - 5;
        ctx.fillStyle = T.figInk; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(sg(d), x + bw / 2, ty);
        ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody;
        ctx.fillText(it.l1, x + bw / 2, B + 15);
        ctx.fillStyle = T.figMuted; ctx.fillText(it.l2, x + bw / 2, B + 29);
      });
    }
    // 오른쪽: 농축 한계(로그 눈금), n = 1과 n = 2
    function limit(T, r) {
      var Lx = r.x + 54, Rx = r.x + r.w - 12, Tp = r.y + 30, B = r.y + r.h - 40;
      var P1 = 6;
      var sy = function (lg) { return B - Math.max(0, Math.min(P1, lg)) / P1 * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var p = 0; p <= P1; p++) { ctx.beginPath(); ctx.moveTo(Lx, sy(p)); ctx.lineTo(Rx, sy(p)); ctx.stroke(); ctx.fillText(p === 0 ? '1' : '10' + sup(p), Lx - 6, sy(p) + 4); }
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('포도당 C안/C밖 한계 (로그 눈금)', 0, 0); ctx.restore();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('평형에서 농축할 수 있는 최댓값', (Lx + Rx) / 2, r.y + 16);
      var bw = Math.min(56, (Rx - Lx) * 0.26);
      [1, 2].forEach(function (n, i) {
        var x = Lx + (Rx - Lx) * (i === 0 ? 0.3 : 0.7) - bw / 2, lg = Math.log10(ratio(n)), on = n === s.n;
        var y = sy(lg);
        ctx.fillStyle = on ? T.figSoftAmber : T.figPaper; ctx.strokeStyle = on ? T.figAmber : T.figLine; ctx.lineWidth = on ? 2 : 1.2;
        ctx.fillRect(x, y, bw, Math.max(1, B - y)); ctx.strokeRect(x, y, bw, Math.max(1, B - y));
        ctx.fillStyle = on ? T.figInk : T.figMuted; ctx.font = (on ? '600 ' : '') + '12px ' + T.fontBody;
        ctx.fillText(fmtR(ratio(n)) + '배', x + bw / 2, Math.max(Tp + 12, y - 6) + (lg > P1 ? 14 : 0));
        ctx.font = '11px ' + T.fontBody; ctx.fillText('Na⁺ ' + n + '개', x + bw / 2, B + 15);
        if (lg > P1) { ctx.fillStyle = T.figAmber; ctx.fillText('▲ 눈금 밖', x + bw / 2, Tp - 2); }
      });
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('n이 1 늘면 한계는 제곱', (Lx + Rx) / 2, B + 31);
    }

    api.onResize(draw);
    update();
  },
});
