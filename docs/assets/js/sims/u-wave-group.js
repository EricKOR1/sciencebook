/* 일반지구과학 6 해양: 분산 관계 ω² = gk·tanh(kh)와 위상 속력·군속도 — 파군 속에서 마루가 앞질러 가는 모습 */
Sims.register('u-wave-group', {
  title: '마루는 앞질러 가고 에너지는 뒤따른다 — 위상 속력과 군속도',
  caption: '주기와 수심을 바꾸어 보자. 위 그림은 파장이 조금 다른 두 파를 겹친 파군으로, 빨간 점(마루 하나)은 위상 속력 c로, 파란 점(파군의 가운데)은 군속도 c_g로 움직인다. 깊은 바다에서는 c_g = c/2라서 마루가 파군의 뒤에서 생겨나 앞으로 빠져나가 사라지고, 얕은 바다에서는 c_g ≈ c ≈ √(gh)로 함께 간다. 아래 그래프는 고른 주기에서 수심에 따른 c와 c_g이다. 분산 관계 ω² = gk·tanh(kh)를 수치로 풀었고, 움직임은 모든 주기에서 한 주기를 약 1.5초로 늦추거나 당겨 보여 준다.',
  init: function (api) {
    var G = 9.8;
    var state = { T: 10, lh: Math.log10(200), t: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.15 : 0.6; }, label: '파군의 모양과 마루·파군 중심의 이동, 수심에 따른 위상 속력과 군속도 그래프' });
    var ctx = cv.ctx;
    var rL = api.readout('파장 L');
    var rC = api.readout('위상 속력 c');
    var rG = api.readout('군속도 c_g');
    var rR = api.readout('c_g / c');
    var rK = api.readout('구분');
    api.slider({ id: 'u-wave-group-T', label: '주기 T', min: 4, max: 16, step: 1, value: 10, format: function (v) { return v + ' s'; }, onInput: function (v) { state.T = v; update(); } });
    api.slider({ id: 'u-wave-group-h', label: '수심 h', min: 0, max: 3, step: 0.02, value: state.lh, format: function (v) { var h = Math.pow(10, v); return (h < 10 ? h.toFixed(1) : Math.round(h)) + ' m'; }, onInput: function (v) { state.lh = v; update(); } });

    function kOf(om, h) { // ω² = g k tanh(kh) 풀기(뉴턴법)
      var k = Math.max(om * om / G, om / Math.sqrt(G * h));
      for (var i = 0; i < 40; i++) { var th = Math.tanh(k * h), fk = G * k * th - om * om, d = G * th + G * k * h * (1 - th * th); k -= fk / d; if (k <= 0) k = 1e-6; }
      return k;
    }
    function props(T, h) {
      var om = 2 * Math.PI / T, k = kOf(om, h), c = om / k, kh = k * h;
      var n = 0.5 * (1 + 2 * kh / Math.sinh(2 * kh));
      if (!isFinite(n)) n = 0.5;
      return { om: om, k: k, L: 2 * Math.PI / k, c: c, cg: n * c, kh: kh };
    }
    function omOf(k, h) { return Math.sqrt(G * k * Math.tanh(k * h)); }
    function update() {
      var h = Math.pow(10, state.lh), p = props(state.T, h);
      rL.set(p.L.toFixed(p.L < 100 ? 1 : 0) + ' m');
      rC.set(p.c.toFixed(2) + ' m/s'); rG.set(p.cg.toFixed(2) + ' m/s'); rR.set((p.cg / p.c).toFixed(2));
      var r = h / p.L;
      rK.set(r > 0.5 ? '심해파 (h > L/2)' : r < 0.05 ? '천해파 (h < L/20)' : '전이파');
      draw();
    }
    function layout() {
      var w = cv.w, h = cv.h;
      return { W: { x: 0, y: 0, w: w, h: h * 0.44 }, P: { x: 0, y: h * 0.5, w: w, h: h * 0.5 } };
    }
    function draw() {
      var T = api.tokens(), Lay = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      waves(T, Lay.W); plot(T, Lay.P);
    }
    function waves(T, r) {
      var h = Math.pow(10, state.lh), p = props(state.T, h);
      var dk = p.k / 8, k1 = p.k - dk / 2, k2 = p.k + dk / 2, o1 = omOf(k1, h), o2 = omOf(k2, h);
      var span = 2 * (2 * Math.PI / dk);   // 파군 두 개
      var L = r.x + 14, R = r.x + r.w - 14, mid = r.y + r.h * 0.55, amp = r.h * 0.22;
      var tt = state.t * state.T / 1.5;    // 실제 시간
      var sx = function (x) { return L + x / span * (R - L); };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('파군의 모양 (가로 폭 = ' + Math.round(span) + ' m)', L, r.y + 14);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L, mid); ctx.lineTo(R, mid); ctx.stroke();
      // 포락선
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figMuted;
      [1, -1].forEach(function (sg) {
        ctx.beginPath();
        for (var i = 0; i <= 300; i++) { var x = span * i / 300, e = Math.abs(Math.cos((dk * x - (o2 - o1) * tt) / 2)); var y = mid - sg * amp * e; if (i) ctx.lineTo(sx(x), y); else ctx.moveTo(sx(x), y); }
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2;
      for (var i = 0; i <= 900; i++) { var x = span * i / 900, y = mid - amp * 0.5 * (Math.cos(k1 * x - o1 * tt) + Math.cos(k2 * x - o2 * tt)); if (i) ctx.lineTo(sx(x), y); else ctx.moveTo(sx(x), y); }
      ctx.stroke();
      // 파군 중심(포락선 최대)과 마루 하나
      var cgEff = (o2 - o1) / (k2 - k1), cEff = (o1 + o2) / (k1 + k2), km = (k1 + k2) / 2;
      var xg = ((cgEff * tt) % (span / 2) + span / 2) % (span / 2); if (xg < span / 4) xg += span / 2;
      var xc = ((cEff * tt) % span + span) % span;
      // 가장 가까운 마루로 정렬: 위상 0 위치
      var ph = km * xc - ((o1 + o2) / 2) * tt; xc -= (ph - Math.round(ph / (2 * Math.PI)) * 2 * Math.PI) / km; xc = (xc % span + span) % span;
      var yc = mid - amp * 0.5 * (Math.cos(k1 * xc - o1 * tt) + Math.cos(k2 * xc - o2 * tt));
      ctx.beginPath(); ctx.arc(sx(xc), yc, 6, 0, Math.PI * 2); ctx.fillStyle = T.figRed; ctx.fill();
      ctx.beginPath(); ctx.arc(sx(xg), mid - amp - 10, 6, 0, Math.PI * 2); ctx.fillStyle = T.figAccent; ctx.fill();
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillStyle = T.figRed; ctx.fillText('● 마루: c', R, r.y + 14);
      ctx.fillStyle = T.figAccent; ctx.fillText('● 파군 중심: c_g', R - 80, r.y + 14);
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'left'; ctx.fillText('진행 방향 →', L, r.y + r.h - 4);
    }
    function plot(T, r) {
      var L = r.x + 50, R = r.x + r.w - 16, Tp = r.y + 18, B = r.y + r.h - 32;
      var deep = G * state.T / (2 * Math.PI), vmax = Math.max(deep * 1.15, 5);
      var sx = function (h) { return L + Math.log10(h) / 3 * (R - L); }, sy = function (v) { return B - v / vmax * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      ctx.textAlign = 'center';
      [1, 10, 100, 1000].forEach(function (h) { ctx.beginPath(); ctx.moveTo(sx(h), Tp); ctx.lineTo(sx(h), B); ctx.stroke(); ctx.fillText(h, sx(h), B + 13); });
      ctx.textAlign = 'right';
      var step = vmax > 20 ? 10 : 5;
      for (var v = 0; v <= vmax; v += step) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(v, L - 5, sy(v) + 4); }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('수심 h (m, 로그 눈금)', (L + R) / 2, B + 27);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('속력 (m/s)', 0, 0); ctx.restore();
      // √(gh)
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figMuted; ctx.beginPath();
      var first = true;
      for (var i = 0; i <= 150; i++) { var hh = Math.pow(10, 3 * i / 150), vv = Math.sqrt(G * hh); if (vv > vmax) break; if (first) { ctx.moveTo(sx(hh), sy(vv)); first = false; } else ctx.lineTo(sx(hh), sy(vv)); }
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(L, sy(deep)); ctx.lineTo(R, sy(deep)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('심해파 c = gT/2π', sx(60), sy(deep) - 5);
      ctx.textAlign = 'left'; ctx.fillText('√(gh)', sx(1.3), sy(Math.sqrt(G * 1.3)) - 14);
      [['c', T.figRed], ['cg', T.figAccent]].forEach(function (q) {
        ctx.beginPath(); ctx.strokeStyle = q[1]; ctx.lineWidth = 2.4;
        for (var j = 0; j <= 150; j++) { var h2 = Math.pow(10, 3 * j / 150), pp = props(state.T, h2), y = sy(pp[q[0]]); if (j) ctx.lineTo(sx(h2), y); else ctx.moveTo(sx(h2), y); }
        ctx.stroke();
      });
      var hNow = Math.pow(10, state.lh), pn = props(state.T, hNow);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx(hNow), Tp); ctx.lineTo(sx(hNow), B); ctx.stroke();
      [[pn.c, T.figRed], [pn.cg, T.figAccent]].forEach(function (q) { ctx.beginPath(); ctx.arc(sx(hNow), sy(q[0]), 5, 0, Math.PI * 2); ctx.fillStyle = q[1]; ctx.fill(); });
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figRed; ctx.fillText('c', sx(700), sy(props(state.T, 700).c) - 6);
      ctx.fillStyle = T.figAccent; ctx.fillText('c_g', sx(700), sy(props(state.T, 700).cg) + 15);
    }
    var loop = api.loop(function (dt) { state.t += dt; draw(); });
    if (api.reduced) loop.pause();
    api.onResize(draw);
    update();
  },
});
