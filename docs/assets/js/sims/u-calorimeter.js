/* 일반화학 3 열화학: 커피컵 열량계 가상 실험 — 시간–온도 곡선, 냉각선 외삽으로 ΔT 구하기, 반응 엔탈피 계산 */
Sims.register('u-calorimeter', {
  title: '커피컵 열량계 — 시간–온도 곡선을 외삽해 ΔT 구하기',
  caption: '시료를 고르고 「측정 다시 하기」를 눌러 보자. 2분 동안 처음 온도를 재고, 2분에 시료를 넣은 뒤 30초마다 온도를 기록한다. 컵에서 열이 조금씩 새므로 가장 높은(흡열이면 가장 낮은) 온도만 읽으면 ΔT가 작게 나온다. 나중 구간의 온도 변화를 직선으로 이어 섞은 순간까지 거꾸로 연장(외삽)하면 열이 새지 않았을 때의 ΔT에 가까워진다. 「열 손실」을 키워 두 ΔH의 차이를 비교해 보자. 용액의 비열은 4.184 J/(g·K), 열량계의 열용량은 무시했고, 열 손실은 뉴턴 냉각(주위와의 온도 차에 비례)으로 가정했다.',
  init: function (api) {
    var C = 4.184, TROOM = 22.50, TMIX = 120, TEND = 420, STEP = 30;
    var SAMPLES = [
      { name: 'Mg + HCl', label: 'Mg 0.250 g + 1.0 M 염산', g: 0.250, M: 24.31, dH: -466.9, sol: 100.0, tau: 25 },
      { name: 'MgO + HCl', label: 'MgO 0.500 g + 1.0 M 염산', g: 0.500, M: 40.30, dH: -151.1, sol: 100.0, tau: 20 },
      { name: 'CaCl₂ 용해', label: 'CaCl₂ 5.00 g + 물 100.0 g', g: 5.00, M: 110.98, dH: -81.4, sol: 105.0, tau: 15 },
      { name: 'NH₄NO₃ 용해', label: 'NH₄NO₃ 5.00 g + 물 100.0 g', g: 5.00, M: 80.04, dH: 25.7, sol: 105.0, tau: 15 },
    ];
    var st = { s: 0, leak: 3, t: TEND, run: null };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.35 : 0.5; }, label: '커피컵 열량계와 시간–온도 그래프' });
    var ctx = cv.ctx;
    var rMax = api.readout('ΔT (최고·최저 읽기)');
    var rExt = api.readout('ΔT (외삽)');
    var rH1 = api.readout('ΔH (최고·최저 읽기로)');
    var rH2 = api.readout('ΔH (외삽으로)');

    var gs = api.group();
    var sb = SAMPLES.map(function (s, i) {
      return api.button(s.name, function () { st.s = i; sb.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); simulate(); finish(); }, { toggle: true, pressed: i === 0, parent: gs });
    });
    api.slider({ id: 'u-calorimeter-leak', label: '컵의 열 손실', min: 0, max: 10, step: 1, value: st.leak,
      format: function (v) { return v === 0 ? '없음(이상적)' : v <= 3 ? '작음 (' + v + ')' : v <= 6 ? '보통 (' + v + ')' : '큼 (' + v + ')'; },
      onInput: function (v) { st.leak = v; simulate(); finish(); } });
    api.button('측정 다시 하기', function () { start(); }, { primary: true });

    function S() { return SAMPLES[st.s]; }
    // 시간에 따른 온도(0.5 s 간격 수치 적분)
    function simulate() {
      var s = S(), n = s.g / s.M, dTad = -s.dH * 1000 * n / (s.sol * C), k = st.leak * 0.0006;
      var T = TROOM, out = [], dt = 0.5;
      for (var t = 0; t <= TEND + 1e-9; t += dt) {
        out.push(T);
        var src = t >= TMIX ? (dTad / s.tau) * Math.exp(-(t - TMIX) / s.tau) : 0;
        T += (src - k * (T - TROOM)) * dt;
      }
      st.curve = out; st.dTad = dTad; st.n = n;
      // 30초 간격 읽기(0.01 °C 자리)
      st.reads = [];
      for (var r = 0; r <= TEND; r += STEP) st.reads.push({ t: r, T: Math.round(out[Math.round(r / dt)] * 100) / 100 });
      // 처음 온도: 섞기 전 읽기의 평균
      var pre = st.reads.filter(function (p) { return p.t < TMIX; });
      st.T0 = pre.reduce(function (a, p) { return a + p.T; }, 0) / pre.length;
      // 나중 구간(섞은 뒤 2분 이후) 직선 맞춤
      var post = st.reads.filter(function (p) { return p.t >= TMIX + 120; });
      var mx = 0, my = 0; post.forEach(function (p) { mx += p.t; my += p.T; }); mx /= post.length; my /= post.length;
      var sxy = 0, sxx = 0; post.forEach(function (p) { sxy += (p.t - mx) * (p.T - my); sxx += (p.t - mx) * (p.t - mx); });
      st.slope = sxy / sxx; st.icpt = my - st.slope * mx;
      st.Text = st.icpt + st.slope * TMIX;
      var after = st.reads.filter(function (p) { return p.t > TMIX; });
      var ext = dTad > 0 ? Math.max.apply(null, after.map(function (p) { return p.T; })) : Math.min.apply(null, after.map(function (p) { return p.T; }));
      st.dTmax = ext - st.T0; st.dText = st.Text - st.T0;
    }
    function dH(dT) { return -(S().sol * C * dT) / 1000 / st.n; }
    function fmtH(v) { return (v > 0 ? '+' : '') + v.toFixed(1) + ' kJ/mol'; }
    function readouts(done) {
      if (!done) { rMax.set('측정 중…'); rExt.set('–'); rH1.set('–'); rH2.set('–'); return; }
      rMax.set(sgn(st.dTmax) + ' K'); rExt.set(sgn(st.dText) + ' K');
      rH1.set(fmtH(dH(st.dTmax))); rH2.set(fmtH(dH(st.dText)));
    }
    function sgn(v) { return (v > 0 ? '+' : '') + v.toFixed(2); }
    function start() {
      if (api.reduced) { finish(); return; }
      st.t = 0; readouts(false); loop.play();
    }
    function finish() { st.t = TEND; loop.pause(); readouts(true); draw(); }
    var loop = api.loop(function (dt) {
      st.t += dt * 40;
      if (st.t >= TEND) { finish(); return; }
      draw();
    });
    loop.pause();

    function curT() { return st.curve[Math.min(st.curve.length - 1, Math.round(st.t / 0.5))]; }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var cup = narrow ? { x: 0, y: 0, w: w, h: h * 0.3 } : { x: 0, y: 0, w: w * 0.26, h: h };
      var gr = narrow ? { x: 0, y: h * 0.32, w: w, h: h * 0.68 } : { x: w * 0.28, y: 0, w: w * 0.72, h: h };
      drawCup(T, cup, narrow); drawGraph(T, gr);
    }
    function drawCup(T, r, narrow) {
      var cx = narrow ? r.x + r.w * 0.3 : r.x + r.w / 2, sc = Math.min(1, r.h / 260, r.w / 170);
      var top = r.y + (narrow ? 40 : 70) * sc + 10, H = 120 * sc, wt = 56 * sc, wb = 40 * sc;
      ctx.lineWidth = 1.6;
      // 바깥 컵, 안쪽 컵
      [[wt + 8 * sc, wb + 7 * sc, 6 * sc], [wt, wb, 0]].forEach(function (c, i) {
        ctx.beginPath(); ctx.moveTo(cx - c[0], top + c[2] - 4); ctx.lineTo(cx - c[1], top + H + c[2]); ctx.lineTo(cx + c[1], top + H + c[2]); ctx.lineTo(cx + c[0], top + c[2] - 4); ctx.closePath();
        ctx.fillStyle = i === 0 ? T.figSoftAmber : T.figPanel; ctx.fill(); ctx.strokeStyle = T.figInk; ctx.stroke();
      });
      // 용액
      var ly = top + H * 0.3, f = (ly - top) / H, lw = wt - (wt - wb) * f;
      ctx.beginPath(); ctx.moveTo(cx - lw, ly); ctx.lineTo(cx - wb, top + H); ctx.lineTo(cx + wb, top + H); ctx.lineTo(cx + lw, ly); ctx.closePath();
      ctx.fillStyle = T.figSoftBlue; ctx.fill();
      // 뚜껑
      ctx.fillStyle = T.figLine; ctx.fillRect(cx - wt - 12 * sc, top - 14 * sc, 2 * wt + 24 * sc, 8 * sc);
      // 온도 센서와 젓개
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + 14 * sc, top - 40 * sc); ctx.lineTo(cx + 14 * sc, top + H - 16 * sc); ctx.stroke();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 18 * sc, top - 30 * sc); ctx.lineTo(cx - 18 * sc, top + H - 12 * sc); ctx.moveTo(cx - 30 * sc, top + H - 12 * sc); ctx.lineTo(cx - 6 * sc, top + H - 12 * sc); ctx.stroke();
      // 시료 넣는 표시
      var mixed = st.t >= TMIX;
      if (mixed) { ctx.fillStyle = T.figMuted; for (var i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(cx - 26 * sc + i * 10 * sc, top + H - 22 * sc - (i % 2) * 8 * sc, 2.2, 0, Math.PI * 2); ctx.fill(); } }
      // 디지털 온도계
      var dx = narrow ? cx + 70 : cx - 52, dy = narrow ? top - 4 : r.y + 14, dw = 104, dh = 36;
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.fillRect(dx, dy, dw, dh); ctx.strokeRect(dx, dy, dw, dh);
      ctx.fillStyle = T.figRed; ctx.font = '600 17px ' + T.fontMono; ctx.textAlign = 'center';
      ctx.fillText(curT().toFixed(2) + ' °C', dx + dw / 2, dy + 24);
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody;
      var tt = Math.min(st.t, TEND);
      ctx.fillText('t = ' + Math.floor(tt / 60) + '분 ' + String(Math.floor(tt % 60)).padStart(2, '0') + '초', dx + dw / 2, dy + dh + 16);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      if (narrow) { ctx.textAlign = 'left'; ctx.fillText(S().label, dx, dy + dh + 36); ctx.fillText(mixed ? '시료를 넣었다' : '시료 넣기 전', dx, dy + dh + 54); }
      else { ctx.fillText(S().label, cx, top + H + 30 * sc + 10); ctx.fillStyle = T.figMuted; ctx.fillText(mixed ? '시료를 넣었다' : '시료 넣기 전', cx, top + H + 30 * sc + 28); }
    }
    function drawGraph(T, r) {
      var L = r.x + 52, R = r.x + r.w - 14, Tp = r.y + 46, B = r.y + r.h - 40;
      var vals = st.reads.map(function (p) { return p.T; }).concat([st.Text, st.T0]);
      var lo = Math.floor(Math.min.apply(null, vals) - 0.4), hi = Math.ceil(Math.max.apply(null, vals) + 0.4);
      var span = hi - lo, ystep = span <= 6 ? 1 : span <= 12 ? 2 : 4;
      var sx = function (t) { return L + (t / TEND) * (R - L); }, sy = function (y) { return B - ((y - lo) / span) * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var y = lo; y <= hi + 1e-9; y += ystep) { ctx.beginPath(); ctx.moveTo(L, sy(y)); ctx.lineTo(R, sy(y)); ctx.stroke(); ctx.fillText(y.toFixed(0), L - 5, sy(y) + 4); }
      ctx.textAlign = 'center';
      for (var m = 0; m <= 7; m++) ctx.fillText(String(m), sx(m * 60), B + 14);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.fillText('시간 (분)', (L + R) / 2, B + 30);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('온도 (°C)', 0, 0); ctx.restore();
      ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(L, Tp - 4); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      // 섞은 순간
      ctx.strokeStyle = T.figMuted; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(sx(TMIX), Tp - 4); ctx.lineTo(sx(TMIX), B); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('시료를 넣음', sx(TMIX), Tp - 8);
      // 연속 기록(얇게)
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.2; ctx.beginPath();
      var nmax = Math.round(Math.min(st.t, TEND) / 0.5);
      for (var i = 0; i <= nmax; i += 2) { var xx = sx(i * 0.5), yy = sy(st.curve[i]); if (i) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); }
      ctx.stroke();
      // 30초 읽기
      st.reads.forEach(function (p) {
        if (p.t > st.t + 1e-6) return;
        ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(sx(p.t), sy(p.T), 3.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
      var done = st.t >= TEND;
      // 계산식
      var s = S();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('ΔH = −m·c·ΔT ÷ n = −(' + s.sol.toFixed(1) + ' g)(4.184 J/(g·K))·ΔT ÷ ' + st.n.toFixed(4) + ' mol', r.x + 8, r.y + 14);
      if (!done) return;
      // 외삽선
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath();
      ctx.moveTo(sx(TMIX), sy(st.Text)); ctx.lineTo(sx(TEND), sy(st.icpt + st.slope * TEND)); ctx.stroke(); ctx.setLineDash([]);
      // 처음 온도선
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx(0), sy(st.T0)); ctx.lineTo(sx(TMIX + 20), sy(st.T0)); ctx.stroke();
      // ΔT 화살표: 외삽
      arrowV(sx(TMIX) - 10, sy(st.T0), sy(st.Text), T.figGreen);
      // 최고(최저) 온도 읽기
      var ext = st.T0 + st.dTmax, pk = st.reads.filter(function (p) { return p.t > TMIX && Math.abs(p.T - ext) < 1e-9; })[0];
      ctx.strokeStyle = T.figMuted; ctx.setLineDash([2, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx(TMIX) + 10, sy(ext)); ctx.lineTo(sx(pk.t), sy(ext)); ctx.stroke(); ctx.setLineDash([]);
      arrowV(sx(TMIX) + 10, sy(st.T0), sy(ext), T.figMuted);
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillStyle = T.figGreen;
      var up = st.dTad > 0, mid = (sy(st.T0) + sy(st.Text)) / 2;
      ctx.fillText('외삽한 ΔT', sx(TMIX) - 16, mid);
      ctx.textAlign = 'left'; ctx.fillStyle = T.figAmber;
      var ey = sy(st.icpt + st.slope * TEND);
      ctx.fillText('나중 구간을 이은 직선', Math.min(sx(TMIX + 140), R - 140), up ? Math.min(B - 6, ey + 28) : Math.max(Tp + 12, ey - 18));
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody;
      ctx.fillText(up ? '가장 높은 온도로 읽은 ΔT' : '가장 낮은 온도로 읽은 ΔT', sx(pk.t) + 8, sy(ext) + (up ? -8 : 16));
    }
    function arrowV(x, y0, y1, c) {
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
      var d = y1 < y0 ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x - 5, y1 + 9 * d); ctx.lineTo(x + 5, y1 + 9 * d); ctx.closePath(); ctx.fill();
    }
    api.onResize(draw);
    simulate(); finish();
  },
});
