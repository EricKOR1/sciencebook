/* 일반화학 11 전기화학: 네른스트 식 — 이온 농도와 전지 전위, 방전하면 Q가 K에 다가가며 E → 0 */
Sims.register('u-nernst', {
  title: '네른스트 식 — 농도가 바꾸는 전지 전위와 다 닳은 전지',
  caption: '전지를 고르고 두 용액의 농도를 바꾸면 E = E° − (0.0592 V/n) log Q로 전지 전위가 바뀐다. ‘방전시키기’를 누르면 전류가 흐르며 Q가 커지고 전위가 떨어져, Q = K에서 E = 0(다 닳은 전지, 화학 평형)이 된다. 다니엘 전지는 K가 10³⁷ 정도로 커서 Cu²⁺가 거의 다 없어질 때까지 전위가 1 V 남짓으로 버티다가 끝에서 갑자기 떨어지고, 농도차 전지(E° = 0)는 두 농도가 같아지면 멈춘다. 25 ℃, 두 용액은 각각 1 L, 활동도 대신 몰 농도를 썼고 내부 저항은 무시했다.',
  init: function (api) {
    var F = 96485, k = 0.05916;
    var cells = [
      { name: '다니엘 전지', E0: 1.10, n: 2, left: 'Zn²⁺', right: 'Cu²⁺', le: 'Zn', re: 'Cu', l0: 0.001, r0: 1.0,
        note: 'Zn | Zn²⁺ ‖ Cu²⁺ | Cu' },
      { name: '농도차 전지', E0: 0, n: 2, left: 'Cu²⁺', right: 'Cu²⁺', le: 'Cu', re: 'Cu', l0: 0.01, r0: 1.0,
        note: 'Cu | Cu²⁺(왼쪽) ‖ Cu²⁺(오른쪽) | Cu' },
    ];
    var st = { c: 0, l0: 0.001, r0: 1.0, d: null, phase: 'rest' };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.45 : 0.56; }, label: '전지 그림과 방전에 따른 전지 전위 그래프' });
    var ctx = cv.ctx;
    var rE = api.readout('전지 전위 E'), rQ = api.readout('Q'), rK = api.readout('K'), rC = api.readout('흐른 전하량');

    var g = api.group();
    var cb = cells.map(function (c, i) { return api.button(c.name, function () { pick(i); }, { toggle: true, pressed: i === 0, parent: g }); });
    var sL = api.slider({ id: 'u-nernst-left', label: '왼쪽 용액', min: -3, max: 0.3, step: 0.01, value: Math.log10(st.l0),
      format: function (v) { return cells[st.c].left + ' ' + conc(Math.pow(10, v)); }, onInput: function (v) { if (lock) return; st.l0 = Math.pow(10, v); reset(); } });
    var sR = api.slider({ id: 'u-nernst-right', label: '오른쪽 용액', min: -3, max: 0.3, step: 0.01, value: Math.log10(st.r0),
      format: function (v) { return cells[st.c].right + ' ' + conc(Math.pow(10, v)); }, onInput: function (v) { if (lock) return; st.r0 = Math.pow(10, v); reset(); } });
    var g2 = api.group();
    var bGo = api.button('방전시키기', function () { discharge(); }, { primary: true, parent: g2 });
    api.button('처음으로', function () { reset(); }, { parent: g2 });

    var lock = false;
    function conc(c) { return (c >= 0.1 ? c.toFixed(2) : c >= 0.01 ? c.toFixed(3) : c.toFixed(4)) + ' M'; }
    function sup(n) { var m = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }; return String(n).split('').map(function (c) { return m[c]; }).join(''); }
    function sci(x) {
      if (x === 0) return '0';
      if (x >= 0.01 && x < 1000) return x.toPrecision(3);
      var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e); if (m >= 9.95) { m /= 10; e++; } return m.toFixed(1) + '×10' + sup(e);
    }
    function pick(i) {
      st.c = i; lock = true;
      sL.set(Math.log10(cells[i].l0)); sR.set(Math.log10(cells[i].r0)); lock = false;
      st.l0 = cells[i].l0; st.r0 = cells[i].r0;
      cb.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      reset();
    }
    // 평형 계산: L + R = S 일정(1 L씩, 계수 1:1), Q = L/R
    function eq() {
      var c = cells[st.c], K = Math.pow(10, c.n * c.E0 / k), S = st.l0 + st.r0;
      var Req = S / (K + 1), Leq = S - Req;
      var x = st.r0 - Req;              // 정반응 쪽으로 반응한 양(mol), 음수면 역반응
      return { K: K, S: S, Req: Req, Leq: S * K / (K + 1), x: x, dir: x >= 0 ? 1 : -1, span: Math.abs(x) };
    }
    function stateAt(d) {   // d: 평형까지 남은 양
      var e = eq(), R, L;
      if (e.dir > 0) { R = e.Req + d; L = e.Leq - d; } else { R = e.Req - d; L = e.Leq + d; }
      var c = cells[st.c], Q = L / R, E = c.E0 - k / c.n * Math.log10(Q);
      if (d <= 0) E = 0;
      return { L: L, R: R, Q: Q, E: E, done: (e.span - d) };
    }
    function reset() { st.d = eq().span; st.phase = 'rest'; loop.pause(); draw(); }
    function discharge() {
      if (st.phase === 'run') return;
      if (st.d <= 0) st.d = eq().span;
      if (api.reduced) { st.d = 0; st.phase = 'done'; draw(); return; }
      st.phase = 'run'; st.t = 0; loop.play();
    }
    var loop = api.loop(function (dt) {
      if (st.phase !== 'run') return;
      var e = eq(), span = e.span;
      // 남은 양을 처음엔 일정하게, 끝에서는 로그로 줄여 마지막 급강하도 보이게 한다
      st.t += dt;
      var lin = Math.min(1, st.t / 3.5);
      var d = span * (1 - 0.985 * lin);
      if (lin >= 1) {
        var tail = (st.t - 3.5) / 1.6;   // 0→1
        var floorD = Math.min(Math.max(e.Req * 1e-3, span * 1e-15, 1e-300), span * 0.015 * 1e-3);
        d = span * 0.015 * Math.pow(floorD / (span * 0.015), Math.min(1, tail));
        if (tail >= 1) { d = 0; st.phase = 'done'; loop.pause(); }
      }
      st.d = d; draw();
    });
    loop.pause();

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { cell: { x: 0, y: 0, w: w, h: h * 0.46 }, gr: { x: 0, y: h * 0.46, w: w, h: h * 0.54 } };
      return { cell: { x: 0, y: 0, w: w * 0.42, h: h }, gr: { x: w * 0.42, y: 0, w: w * 0.58, h: h } };
    }
    function shade(T, base, c) {   // 농도가 진할수록 진하게
      var a = Math.max(0.08, Math.min(0.7, (Math.log10(Math.max(c, 1e-6)) + 3.3) / 3.6 * 0.7));
      ctx.globalAlpha = a; ctx.fillStyle = base; return a;
    }
    function drawCell(T, r, s) {
      var c = cells[st.c];
      var cx = r.x + r.w / 2, bw = Math.min(118, r.w * 0.34), bh = Math.min(96, r.h * 0.38), top = r.y + r.h * 0.42;
      var lx = cx - bw - 26, rx = cx + 26;
      [[lx, s.L, c.left, c.le, st.c === 0 ? T.figTeal : T.figBlue], [rx, s.R, c.right, c.re, T.figBlue]].forEach(function (b, i) {
        ctx.save(); shade(T, b[4], b[1]); ctx.fillRect(b[0], top + 14, bw, bh - 14); ctx.restore();
        ctx.strokeStyle = T.figMuted; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b[0], top); ctx.lineTo(b[0], top + bh); ctx.lineTo(b[0] + bw, top + bh); ctx.lineTo(b[0] + bw, top); ctx.stroke();
        var ex = i === 0 ? b[0] + 18 : b[0] + bw - 32;
        ctx.fillStyle = b[3] === 'Zn' ? T.figLine : T.figAmber; ctx.fillRect(ex, top - 22, 14, bh - 6);
        ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1; ctx.strokeRect(ex, top - 22, 14, bh - 6);
        ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(b[3], ex + 7, top - 28);
        ctx.font = '12px ' + T.fontMono; ctx.fillText(b[2], b[0] + bw / 2 + (i === 0 ? 10 : -10), top + bh - 26);
        ctx.fillText(b[1] < 1e-3 ? sci(b[1]) + ' M' : conc(b[1]), b[0] + bw / 2 + (i === 0 ? 10 : -10), top + bh - 10);
      });
      // 염다리
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 10; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(lx + bw - 14, top + 40); ctx.lineTo(lx + bw - 14, top + 2); ctx.lineTo(rx + 14, top + 2); ctx.lineTo(rx + 14, top + 40); ctx.stroke();
      // 도선과 전압계
      var exL = lx + 25, exR = rx + bw - 25, wy = r.y + 46;
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(exL, top - 22); ctx.lineTo(exL, wy); ctx.lineTo(cx - 24, wy); ctx.moveTo(cx + 24, wy); ctx.lineTo(exR, wy); ctx.lineTo(exR, top - 22); ctx.stroke();
      ctx.fillStyle = T.figPanel; ctx.beginPath(); ctx.arc(cx, wy, 24, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 14px ' + T.fontMono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText((s.E < 0 ? '−' : '') + Math.abs(s.E).toFixed(3), cx, wy - 1); ctx.textBaseline = 'alphabetic';
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.fillText('V', cx, wy + 16);
      // 전자 흐름
      if (Math.abs(s.E) > 1e-4) {
        var fwd = s.E > 0, ay = wy - 12, x1 = fwd ? exL + 8 : exR - 8, x2 = fwd ? cx - 32 : cx + 32;
        var x3 = fwd ? cx + 32 : cx - 32, x4 = fwd ? exR - 8 : exL + 8;
        ctx.strokeStyle = T.figViolet; ctx.fillStyle = T.figViolet; ctx.lineWidth = 2;
        [[x1, x2], [x3, x4]].forEach(function (p) {
          ctx.beginPath(); ctx.moveTo(p[0], ay); ctx.lineTo(p[1], ay); ctx.stroke();
          var dd = p[1] > p[0] ? 1 : -1; ctx.beginPath(); ctx.moveTo(p[1] + dd * 6, ay); ctx.lineTo(p[1] - dd * 2, ay - 5); ctx.lineTo(p[1] - dd * 2, ay + 5); ctx.closePath(); ctx.fill();
        });
        ctx.font = '600 12px ' + T.fontBody; ctx.fillText('e⁻', (x1 + x2) / 2, ay - 7);
        ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figInk;
        ctx.fillText(fwd ? '(−)' : '(+)', exL - 28, top - 28);
        ctx.fillText(fwd ? '(+)' : '(−)', exR + 28, top - 28);
      }
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(c.note, cx, r.y + r.h - 10);
    }
    function drawGraph(T, r, s) {
      var c = cells[st.c], e = eq();
      var L = r.x + 54, R = r.x + r.w - 14, Tp = r.y + 26, B = r.y + r.h - 40;
      var qmax = c.n * F * e.span / 1000;   // kC
      var E0 = stateAt(e.span).E;
      var lo = Math.min(0, E0, c.E0), hi = Math.max(0, E0, c.E0);
      var pad = Math.max((hi - lo) * 0.15, 0.01); lo -= lo < 0 ? pad : 0; hi += pad;
      var sx = function (q) { return L + (qmax > 0 ? q / qmax : 0) * (R - L); };
      var sy = function (v) { return B - (v - lo) / (hi - lo) * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('방전에 따른 전지 전위', L, r.y + 16);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, Tp, R - L, B - Tp);
      // 눈금
      var span = hi - lo, st0 = span > 0.6 ? 0.2 : span > 0.3 ? 0.1 : span > 0.12 ? 0.02 : 0.01;
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right'; ctx.strokeStyle = T.rule;
      for (var v = Math.ceil(lo / st0) * st0; v <= hi + 1e-9; v += st0) {
        ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke();
        ctx.fillText((v < -1e-9 ? '−' : '') + Math.abs(v).toFixed(st0 < 0.1 ? 2 : 1), L - 4, sy(v) + 4);
      }
      ctx.textAlign = 'center';
      for (var i = 0; i <= 4; i++) ctx.fillText((qmax * i / 4).toFixed(qmax < 10 ? 1 : 0), sx(qmax * i / 4), B + 14);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('흐른 전하량 (kC)', (L + R) / 2, B + 30);
      ctx.save(); ctx.translate(r.x + 14, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('E (V)', 0, 0); ctx.restore();
      // 0 선, E° 선
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(L, sy(0)); ctx.lineTo(R, sy(0)); ctx.stroke();
      if (c.E0 !== 0) {
        ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figAmber; ctx.beginPath(); ctx.moveTo(L, sy(c.E0)); ctx.lineTo(R, sy(c.E0)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figAmber; ctx.textAlign = 'left'; ctx.font = '12px ' + T.fontBody; ctx.fillText('주황 점선: E° = ' + c.E0.toFixed(2) + ' V (Q = 1일 때)', L + 6, B - 8);
      }
      if (qmax <= 0) {
        ctx.fillStyle = T.figInk; ctx.textAlign = 'center'; ctx.fillText('이미 평형 — 전류가 흐르지 않는다', (L + R) / 2, (Tp + B) / 2);
        return;
      }
      // 전체 곡선(희미하게) + 지나온 부분(진하게)
      var pts = [], n = 120, j;
      for (j = 0; j <= n; j++) pts.push(e.span * (1 - j / n));
      for (j = 2; j <= 16; j++) pts.push(e.span / n * Math.pow(10, -j * 2.3));
      pts.push(0);
      pts.sort(function (a, b) { return b - a; });
      function path(upto) {
        ctx.beginPath(); var first = true;
        pts.forEach(function (d) {
          if (d < upto) return;
          var q = c.n * F * (e.span - d) / 1000, y = sy(stateAt(d).E);
          if (first) { ctx.moveTo(sx(q), y); first = false; } else ctx.lineTo(sx(q), y);
        });
        ctx.stroke();
      }
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); path(0); ctx.setLineDash([]);
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.8; path(st.d);
      var qn = c.n * F * s.done / 1000;
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(sx(qn), sy(s.E), 5.5, 0, 7); ctx.fill();
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillStyle = T.figGreen;
      ctx.textAlign = 'center'; ctx.fillText('Q = K이면 E = 0', L + (R - L) * 0.68, sy(0) + (E0 >= 0 ? -7 : 15));
    }
    function draw() {
      var T = api.tokens(), P = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      if (st.d == null) st.d = eq().span;
      var s = stateAt(st.d), e = eq(), c = cells[st.c];
      drawCell(T, P.cell, s); drawGraph(T, P.gr, s);
      rE.set((s.E < 0 ? '−' : '') + Math.abs(s.E).toFixed(3) + ' V');
      rQ.set(sci(s.Q)); rK.set(sci(e.K));
      rC.set((c.n * F * s.done / 1000).toFixed(1) + ' kC');
      bGo.disabled = st.phase === 'run' || e.span <= 0;
    }
    api.onResize(draw);
    reset();
  },
});
