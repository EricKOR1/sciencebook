/* 물질과 에너지 2: 묽은 용액의 총괄성 — 증기 압력 내림, 끓는점 오름, 어는점 내림, 삼투압 */
Sims.register('colligative', {
  title: '녹아 있는 입자 수가 바꾸는 것 — 총괄성',
  caption: '물 1 kg에 녹이는 용질의 양(몰랄 농도)을 바꾸고, 설탕과 염화 나트륨을 비교해 보자. 같은 몰랄 농도라도 NaCl은 Na⁺과 Cl⁻으로 나뉘어 입자 수가 2배이므로 효과도 2배이다. 값은 ΔTb = 0.51m, ΔTf = 1.86m, 라울 법칙(25 °C 물 23.8 mmHg), π = CRT로 계산했고, NaCl은 완전히 이온화한다고 가정했다. 그래프는 끓는점·어는점 근처를 확대한 것이며, 입자 그림의 용질 수는 실제 몰 분율에 비례한다.',
  init: function (api) {
    var KB = 0.51, KF = 1.86, P25 = 23.8, MW = 1000 / 18, R = 0.082;
    var st = { tab: 'bp', m: 0.5, salt: false, C: 0.10, tC: 27 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.55 : 0.52; }, label: '용액의 입자 그림과 증기 압력 곡선' });
    var ctx = cv.ctx;
    var r1 = api.readout('입자의 몰랄 농도'), r2 = api.readout('증기 압력(25 °C)'), r3 = api.readout('끓는점'), r4 = api.readout('어는점');

    var gt = api.group();
    var tabs = [api.button('증기 압력·끓는점·어는점', function () { setTab('bp'); }, { toggle: true, pressed: true, parent: gt }),
      api.button('삼투압', function () { setTab('os'); }, { toggle: true, parent: gt })];
    var gs = api.group();
    var sb = [api.button('설탕 (비전해질)', function () { setSalt(false); }, { toggle: true, pressed: true, parent: gs }),
      api.button('염화 나트륨 (전해질)', function () { setSalt(true); }, { toggle: true, parent: gs })];
    var sm = api.slider({ id: 'colligative-m', label: '몰랄 농도', min: 0, max: 2, step: 0.05, value: st.m, format: function (v) { return v.toFixed(2) + ' mol/kg'; }, onInput: function (v) { st.m = v; update(); } });
    var sc = api.slider({ id: 'colligative-c', label: '몰 농도', min: 0, max: 0.5, step: 0.002, value: st.C, format: function (v) { return v.toFixed(3) + ' M'; }, onInput: function (v) { st.C = v; update(); } });
    var stp = api.slider({ id: 'colligative-t', label: '온도', min: 0, max: 40, step: 1, value: st.tC, format: function (v) { return v + ' °C (' + (v + 273) + ' K)'; }, onInput: function (v) { st.tC = v; update(); } });
    var gp = api.group();
    api.button('예제 8: 포도당 0.10 M, 27 °C', function () { setSalt(false); sc.set(0.10); stp.set(27); }, { parent: gp });
    api.button('예제 10: 생리식염수 0.154 M NaCl, 37 °C', function () { setSalt(true); sc.set(0.154); stp.set(37); }, { parent: gp });
    var lab = function (s) { return s.input.parentNode; };

    function setTab(t) {
      st.tab = t;
      tabs.forEach(function (b, i) { b.setAttribute('aria-pressed', (i === 0) === (t === 'bp') ? 'true' : 'false'); });
      lab(sm).style.display = t === 'bp' ? '' : 'none';
      lab(sc).style.display = lab(stp).style.display = gp.style.display = t === 'os' ? '' : 'none';
      update();
    }
    function setSalt(s) { st.salt = s; sb.forEach(function (b, i) { b.setAttribute('aria-pressed', (i === 1) === s ? 'true' : 'false'); }); update(); }
    function iF() { return st.salt ? 2 : 1; }
    function calc() {
      var im = iF() * st.m, X = MW / (MW + im);
      return { im: im, X: X, P: X * P25, dP: (1 - X) * P25, dTb: KB * im, dTf: KF * im };
    }
    function osm() { var T = st.tC + 273, iC = iF() * st.C, pi = iC * R * T; return { T: T, iC: iC, pi: pi, h: pi * 10.3 }; }
    function rl(i, t) { var e = api.readouts.children[i]; if (e) e.firstChild.textContent = t; }
    function update() {
      if (st.tab === 'bp') {
        rl(0, '입자의 몰랄 농도'); rl(1, '증기 압력(25 °C)'); rl(2, '끓는점'); rl(3, '어는점');
        var c = calc();
        r1.set(c.im.toFixed(2) + ' mol/kg' + (st.salt ? ' (이온 Na⁺+Cl⁻)' : ''));
        r2.set(c.P.toFixed(2) + ' mmHg (ΔP ' + c.dP.toFixed(2) + ')');
        r3.set((100 + c.dTb).toFixed(2) + ' °C (ΔTb ' + c.dTb.toFixed(2) + ')');
        r4.set((-c.dTf).toFixed(2).replace('-', '−') + ' °C (ΔTf ' + c.dTf.toFixed(2) + ')');
      } else {
        var o = osm();
        rl(0, '입자의 몰 농도'); rl(1, '삼투압'); rl(2, '물기둥 높이로'); rl(3, '절대 온도');
        r1.set(o.iC.toFixed(3) + ' M' + (st.salt ? ' (이온 총농도)' : ''));
        r2.set('π = ' + o.pi.toFixed(2) + ' atm');
        r3.set('약 ' + o.h.toFixed(1) + ' m');
        r4.set(o.T + ' K');
      }
      draw();
    }

    // 입자 그림의 배치(고정 무작위)
    var seed = 5; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var COLS = 20, ROWS = 8, order = [];
    for (var i = 0; i < COLS * ROWS; i++) order.push(i);
    for (var j = order.length - 1; j > 0; j--) { var k = Math.floor(rnd() * (j + 1)), t = order[j]; order[j] = order[k]; order[k] = t; }

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { a: { x: 0, y: 0, w: w, h: h * 0.36 }, b: { x: 0, y: h * 0.38, w: w, h: h * 0.31 }, c: { x: 0, y: h * 0.69, w: w, h: h * 0.31 } };
      return { a: { x: 0, y: 0, w: w * 0.4, h: h }, b: { x: w * 0.42, y: 0, w: w * 0.29, h: h }, c: { x: w * 0.71, y: 0, w: w * 0.29, h: h } };
    }
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      if (st.tab === 'bp') { drawParticles(T, L.a); drawFreeze(T, L.b); drawBoil(T, L.c); }
      else drawOsmosis(T);
    }
    function drawParticles(T, r) {
      var c = calc(), n = COLS * ROWS, nSol = Math.round(n * (1 - c.X));
      if (st.salt && nSol % 2) nSol += (n * (1 - c.X) > nSol ? 1 : -1);
      var bx = r.x + 10, bw = r.w - 20, top = r.y + r.h * 0.42, bh = r.h * 0.5;
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('용액 표면 가까이 (입자 ' + n + '개 중 용질 ' + nSol + '개)', bx, r.y + 16);
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(bx, top, bw, bh);
      ctx.strokeStyle = T.figLine; ctx.strokeRect(bx, top, bw, bh);
      var dx = bw / COLS, dy = bh / ROWS, rad = Math.max(2.2, Math.min(dx, dy) * 0.36);
      var solute = {};
      for (var i = 0; i < nSol; i++) solute[order[i]] = i;
      var surfaceSolvent = 0;
      for (var q = 0; q < n; q++) {
        var cx = bx + dx * (q % COLS + 0.5), cy = top + dy * (Math.floor(q / COLS) + 0.5);
        if (solute[q] != null) {
          var cl = st.salt && solute[q] % 2 === 1;
          ctx.fillStyle = cl ? T.figGreen : T.figAmber;
          ctx.beginPath(); ctx.arc(cx, cy, rad * 1.25, 0, 7); ctx.fill();
        } else {
          ctx.fillStyle = T.figBlue; ctx.beginPath(); ctx.arc(cx, cy, rad * 0.8, 0, 7); ctx.fill();
          if (q < COLS) surfaceSolvent++;
        }
      }
      // 표면에서 튀어 나가는 물 분자(표면의 물 분자 비율에 비례)
      var esc = Math.round(10 * c.X * surfaceSolvent / COLS);
      ctx.strokeStyle = T.figBlue; ctx.fillStyle = T.figBlue; ctx.lineWidth = 1.4;
      for (var e = 0; e < esc; e++) {
        var ex = bx + bw * (e + 0.5) / 10, ey = top - 10 - (e % 3) * 12;
        ctx.beginPath(); ctx.arc(ex, ey - 8, rad * 0.8, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.moveTo(ex, ey + 4); ctx.lineTo(ex, ey - 2); ctx.stroke();
      }
      var ly = top + bh + 18, items = [[T.figBlue, '물']].concat(st.salt ? [[T.figAmber, 'Na⁺'], [T.figGreen, 'Cl⁻']] : [[T.figAmber, '설탕 분자']]), lx = bx;
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      items.forEach(function (it) { ctx.fillStyle = it[0]; ctx.beginPath(); ctx.arc(lx + 5, ly - 4, 4.5, 0, 7); ctx.fill(); ctx.fillStyle = T.figMuted; ctx.fillText(it[1], lx + 13, ly); lx += 26 + ctx.measureText(it[1]).width; });
    }
    // 증기 압력 곡선(국소적으로 ln P가 온도에 정비례한다고 근사)
    function plot(T, r, o) {
      var L = r.x + 48, Rr = r.x + r.w - 10, Tp = r.y + 34, B = r.y + r.h - 34;
      var sx = function (t) { return L + (t - o.x0) / (o.x1 - o.x0) * (Rr - L); }, sy = function (p) { return B - (p - o.y0) / (o.y1 - o.y0) * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText(o.title, r.x + 4, r.y + 16);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      o.xt.forEach(function (t) { ctx.beginPath(); ctx.moveTo(sx(t), Tp); ctx.lineTo(sx(t), B); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText(String(t).replace('-', '−'), sx(t), B + 13); });
      o.yt.forEach(function (p) { ctx.beginPath(); ctx.moveTo(L, sy(p)); ctx.lineTo(Rr, sy(p)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(p, L - 4, sy(p) + 4); });
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('온도 (°C)', (L + Rr) / 2, B + 27);
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, Rr - L, B - Tp); ctx.clip();
      o.curves.forEach(function (cu) {
        ctx.strokeStyle = cu.color; ctx.lineWidth = cu.w || 2.2; ctx.setLineDash(cu.dash || []); ctx.beginPath();
        for (var i = 0; i <= 80; i++) { var t = o.x0 + (o.x1 - o.x0) * i / 80, p = cu.f(t); if (i) ctx.lineTo(sx(t), sy(p)); else ctx.moveTo(sx(t), sy(p)); }
        ctx.stroke(); ctx.setLineDash([]);
      });
      ctx.restore();
      return { sx: sx, sy: sy, L: L, R: Rr, T: Tp, B: B };
    }
    function drawBoil(T, r) {
      var c = calc(), k = 0.0352, Ps = function (t) { return 760 * Math.exp(k * (t - 100)); }, f = Math.exp(-k * c.dTb);
      var A = plot(T, r, { title: '끓는점 근처 (확대, mmHg)', x0: 99, x1: 103, y0: 700, y1: 840, xt: [99, 100, 101, 102, 103], yt: [720, 760, 800],
        curves: [{ f: function () { return 760; }, color: T.figMuted, w: 1.2, dash: [5, 4] }, { f: Ps, color: T.figBlue }, { f: function (t) { return Ps(t) * f; }, color: T.figRed }] });
      var bx = A.sx(100 + c.dTb);
      ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(bx, A.sy(760), 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = T.figBlue; ctx.beginPath(); ctx.arc(A.sx(100), A.sy(760), 4.5, 0, 7); ctx.fill();
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figMuted; ctx.fillText('1 atm (760)', A.L + 3, A.sy(760) - 5);
      ctx.fillStyle = T.figBlue; ctx.fillText('물', A.sx(99.3), A.sy(Ps(99.3)) - 8);
      ctx.fillStyle = T.figRed; ctx.textAlign = 'right'; ctx.fillText('용액', A.R - 4, A.sy(Ps(102.8) * f) + 14);
      if (c.dTb > 0) { ctx.fillStyle = T.figRed; ctx.textAlign = 'center'; ctx.font = '600 11px ' + T.fontBody; ctx.fillText('+' + c.dTb.toFixed(2) + ' °C', (A.sx(100) + bx) / 2 + 10, A.sy(760) + 18); }
    }
    function drawFreeze(T, r) {
      var c = calc(), kl = 0.0726, ks = 0.0823, P0 = 4.58;
      var Pl = function (t) { return P0 * Math.exp(kl * t); }, Pi = function (t) { return P0 * Math.exp(ks * t); }, f = Math.exp(-(ks - kl) * c.dTf);
      var A = plot(T, r, { title: '어는점 근처 (확대, mmHg)', x0: -8, x1: 1, y0: 2, y1: 5.2, xt: [-8, -6, -4, -2, 0], yt: [2, 3, 4, 5],
        curves: [{ f: Pi, color: T.figViolet, w: 2 }, { f: Pl, color: T.figBlue }, { f: function (t) { return Pl(t) * f; }, color: T.figRed }] });
      var fx = A.sx(-c.dTf);
      ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(fx, A.sy(Pi(-c.dTf)), 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = T.figBlue; ctx.beginPath(); ctx.arc(A.sx(0), A.sy(P0), 4.5, 0, 7); ctx.fill();
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figViolet; ctx.fillText('얼음', A.sx(-7.6), A.sy(Pi(-7.6)) + 14);
      ctx.fillStyle = T.figBlue; ctx.fillText('물', A.sx(-3), A.sy(Pl(-3)) - 8);
      ctx.fillStyle = T.figRed; ctx.fillText('용액', A.sx(-3), A.sy(Pl(-3) * f) + 15);
    }
    function drawOsmosis(T) {
      var o = osm(), w = cv.w, h = cv.h, narrow = w < 560;
      var r1 = narrow ? { x: 0, y: 0, w: w, h: h * 0.5 } : { x: 0, y: 0, w: w * 0.45, h: h };
      var r2 = narrow ? { x: 0, y: h * 0.52, w: w, h: h * 0.48 } : { x: w * 0.48, y: 0, w: w * 0.52, h: h };
      // U자관
      var cx = r1.x + r1.w / 2, aw = Math.min(46, r1.w * 0.13), gap = aw * 1.6, base = r1.y + r1.h - aw * 0.8 - 26, topY = r1.y + 50;
      var Lx = cx - gap / 2 - aw, Rx = cx + gap / 2, dh = Math.min(1, o.pi / 10) * (base - topY - 60);
      var mid = (base + topY) / 2 + 20, lv = mid + dh / 2, rv = mid - dh / 2;
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('삼투 평형 (모식도)', r1.x + 6, r1.y + 16);
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(Lx, lv, aw, base - lv); ctx.fillRect(Lx, base, cx - Lx, aw * 0.8);
      ctx.fillStyle = T.figSoftAmber; ctx.fillRect(Rx, rv, aw, base - rv); ctx.fillRect(cx, base, Rx + aw - cx, aw * 0.8);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(Lx, topY); ctx.lineTo(Lx, base + aw * 0.8); ctx.lineTo(Rx + aw, base + aw * 0.8); ctx.lineTo(Rx + aw, topY);
      ctx.moveTo(Lx + aw, topY); ctx.lineTo(Lx + aw, base); ctx.lineTo(Rx, base); ctx.lineTo(Rx, topY); ctx.stroke();
      ctx.strokeStyle = T.figViolet; ctx.lineWidth = 3; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(cx, base); ctx.lineTo(cx, base + aw * 0.8); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('물', Lx + aw / 2, base + aw * 0.8 + 16); ctx.fillText(st.salt ? 'NaCl 수용액' : '포도당 수용액', Rx + aw / 2, base + aw * 0.8 + 16);
      if (dh > 2) {
        var ax = Rx + aw + 14;
        ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ax, rv); ctx.lineTo(ax, lv); ctx.stroke();
        ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(Lx + aw, lv); ctx.lineTo(ax + 4, lv); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figRed; ctx.textAlign = 'left'; ctx.font = '600 12px ' + T.fontBody;
        ctx.fillText('h ≈ ' + o.h.toFixed(1) + ' m', Math.min(ax + 6, r1.x + r1.w - 70), (rv + lv) / 2 + 4);
      }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('수면 차는 실제 높이의 축소', cx, r1.y + 34);
      // π–C 그래프
      var L = r2.x + 50, Rr = r2.x + r2.w - 14, Tp = r2.y + 34, B = r2.y + r2.h - 36, cMax = 0.5, pMax = 30;
      var sx = function (cc) { return L + cc / cMax * (Rr - L); }, sy = function (p) { return B - p / pMax * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('삼투압 π (atm) — 몰 농도에 정비례', r2.x + 4, r2.y + 16);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      [0, 10, 20, 30].forEach(function (p) { ctx.beginPath(); ctx.moveTo(L, sy(p)); ctx.lineTo(Rr, sy(p)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(p, L - 4, sy(p) + 4); });
      [0, 0.1, 0.2, 0.3, 0.4, 0.5].forEach(function (cc) { ctx.textAlign = 'center'; ctx.fillText(cc.toFixed(1), sx(cc), B + 13); });
      ctx.font = '11px ' + T.fontBody; ctx.fillText('녹인 물질의 몰 농도 C (M)', (L + Rr) / 2, B + 28);
      var line = function (i, col, dash) {
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash(dash || []); ctx.beginPath(); ctx.moveTo(sx(0), sy(0));
        var ce = Math.min(cMax, pMax / (i * R * o.T)); ctx.lineTo(sx(ce), sy(i * ce * R * o.T)); ctx.stroke(); ctx.setLineDash([]);
      };
      line(1, st.salt ? T.figLine : T.figAccent, st.salt ? [5, 4] : null);
      line(2, st.salt ? T.figAccent : T.figLine, st.salt ? null : [5, 4]);
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
      var cn = Math.min(0.42, 24 / (2 * R * o.T));
      ctx.textAlign = 'right'; ctx.fillText('NaCl (입자 2배)', sx(cn) - 8, sy(2 * cn * R * o.T));
      ctx.textAlign = 'left'; ctx.fillText('비전해질', sx(0.42) + 4, sy(0.42 * R * o.T) + 16);
      ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(sx(st.C), sy(Math.min(pMax, o.pi)), 5.5, 0, 7); ctx.fill();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = sx(st.C) > (L + Rr) / 2 ? 'right' : 'left';
      ctx.fillText(o.pi.toFixed(2) + ' atm', sx(st.C) + (ctx.textAlign === 'right' ? -10 : 10), sy(Math.min(pMax, o.pi)) - 8);
    }

    api.onResize(draw);
    setTab('bp');
  },
});
