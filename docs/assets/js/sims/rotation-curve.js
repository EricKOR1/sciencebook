/* 행성우주과학 3: 은하 회전 곡선 — 보이는 물질만으로 한 예측과 관측, 그리고 암흑 물질 */
Sims.register('rotation-curve', {
  title: '은하의 회전 곡선 — 보이지 않는 질량 찾기',
  caption: '점선은 별과 기체(보이는 물질, 30 kpc 안에 약 6×10¹⁰ M☉)만 있을 때 예측되는 회전 속도로, 바깥으로 갈수록 느려진다. 그러나 관측된 회전 속도(점)는 약 220 km/s로 거의 평탄하다. 암흑 물질 슬라이더를 올리면 예측 곡선이 관측에 가까워지는데, 30 kpc 안에 보이는 물질의 4~5배쯤 되는 질량이 더 있어야 맞는다. 우리은하를 단순화한 모형으로, 질량이 공 모양으로 분포한다고 보고 v = √(GM(r)/r)로 계산했으며 관측 점도 실제 자료를 단순화한 값이다.',
  init: function (api) {
    var G = 4.30091e-6;   // kpc·(km/s)²/M☉
    var RC = 3.7, TRUE_DM = 2.8e11;
    function mVis(r) { return 1.5e10 * r * r / ((r + 0.6) * (r + 0.6)) + 4.5e10 * (1 - (1 + r / 3) * Math.exp(-r / 3)); }
    function fH(r) { return r - RC * Math.atan(r / RC); }
    function mDM(r, m30) { return m30 * fH(r) / fH(30); }
    function v(r, m30) { return Math.sqrt(G * (mVis(r) + mDM(r, m30)) / r); }
    var obs = []; var noise = [4, -6, 3, -2, 5, -4, 2, -3, 4, -5, 1, 3, -2, 4];
    for (var i = 0; i < 14; i++) { var r = 2 + i * 2.15; obs.push({ r: r, v: v(r, TRUE_DM) + noise[i] }); }
    var st = { m: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.52; }, label: '은하 회전 속도 곡선과 30 kpc 안의 질량 비교' });
    var ctx = cv.ctx;
    var rDM = api.readout('암흑 물질 (30 kpc 안)');
    var rSun = api.readout('태양 자리(8 kpc) 예측 / 관측');
    var rOut = api.readout('30 kpc 예측 / 관측');
    var rFrac = api.readout('보이는 물질의 비율');
    api.slider({ id: 'rotation-curve-dm', label: '암흑 물질의 양 (30 kpc 안)', min: 0, max: 4.5, step: 0.05, value: 0,
      format: function (x) { return x.toFixed(2) + ' × 10¹¹ M☉'; }, onInput: function (x) { st.m = x * 1e11; upd(); } });
    var g = api.group();
    api.button('보이는 물질만', function () { setM(0); }, { parent: g });
    api.button('관측에 맞추기', function () { setM(2.8); }, { parent: g, primary: true });
    function setM(x) { var inp = document.getElementById('rotation-curve-dm'); inp.value = x; inp.dispatchEvent(new Event('input')); }

    function upd() {
      var m = st.m, v8 = v(8, m), v30 = v(30, m);
      rDM.set(m === 0 ? '없음' : (m / 1e11).toFixed(2) + '×10¹¹ M☉');
      rSun.set(Math.round(v8) + ' / 약 220 km/s');
      rOut.set(Math.round(v30) + ' / 약 ' + Math.round(obs[obs.length - 1].v) + ' km/s');
      var tot = mVis(30) + m; rFrac.set(Math.round(mVis(30) / tot * 100) + ' %');
      draw();
    }
    function txt(T, s, x, y, o) { o = o || {}; ctx.fillStyle = o.color || T.figInk; ctx.textAlign = o.align || 'left'; ctx.font = (o.bold ? '600 ' : '') + (o.size || 12) + 'px ' + T.fontBody; ctx.fillText(s, x, y); }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, stack = w < 560;
      ctx.clearRect(0, 0, w, h);
      var gr = stack ? { x: 0, y: 0, w: w, h: h * 0.62 } : { x: 0, y: 0, w: w * 0.64, h: h };
      var br = stack ? { x: 0, y: h * 0.64, w: w, h: h * 0.36 } : { x: w * 0.66, y: 0, w: w * 0.34, h: h };
      // 회전 곡선
      var L = gr.x + 50, R = gr.x + gr.w - 12, Tp = gr.y + 30, B = gr.y + gr.h - 38;
      var sx = function (r) { return L + r / 30 * (R - L); }, sy = function (vv) { return B - vv / 300 * (B - Tp); };
      txt(T, '회전 속도 곡선', gr.x + 6, gr.y + 16, { bold: true });
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      [0, 100, 200, 300].forEach(function (vv) { ctx.beginPath(); ctx.moveTo(L, sy(vv)); ctx.lineTo(R, sy(vv)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(vv, L - 5, sy(vv) + 4); });
      [0, 5, 10, 15, 20, 25, 30].forEach(function (r) { ctx.textAlign = 'center'; ctx.fillText(r, sx(r), B + 14); });
      txt(T, '은하 중심에서의 거리 (kpc)', (L + R) / 2, B + 30, { size: 11, align: 'center' });
      ctx.save(); ctx.translate(gr.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); txt(T, '회전 속도 (km/s)', 0, 0, { size: 11, align: 'center' }); ctx.restore();
      // 태양 위치
      ctx.strokeStyle = T.figAmber; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(sx(8), Tp); ctx.lineTo(sx(8), B); ctx.stroke(); ctx.setLineDash([]);
      txt(T, '태양', sx(8) + 4, B - 6, { size: 11, color: T.figAmber, bold: true });
      function curve(m, color, dash, width) {
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.beginPath();
        for (var i = 0; i <= 150; i++) { var r = 0.3 + 29.7 * i / 150, y = sy(v(r, m)); if (i) ctx.lineTo(sx(r), y); else ctx.moveTo(sx(r), y); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      curve(0, T.figMuted, [6, 4], 2);
      if (st.m > 0) curve(st.m, T.figAccent, [], 2.6);
      obs.forEach(function (o) {
        ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sx(o.r), sy(o.v - 12)); ctx.lineTo(sx(o.r), sy(o.v + 12)); ctx.stroke();
        ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(sx(o.r), sy(o.v), 3.6, 0, Math.PI * 2); ctx.fill();
      });
      // 범례
      var lx = L + 8, ly = sy(100);
      ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(lx + 8, ly, 3.6, 0, Math.PI * 2); ctx.fill(); txt(T, '관측 (단순화한 값)', lx + 20, ly + 4, { size: 11 });
      ctx.strokeStyle = T.figMuted; ctx.setLineDash([6, 4]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, ly + 18); ctx.lineTo(lx + 16, ly + 18); ctx.stroke(); ctx.setLineDash([]); txt(T, '보이는 물질만으로 한 예측', lx + 20, ly + 22, { size: 11 });
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(lx, ly + 36); ctx.lineTo(lx + 16, ly + 36); ctx.stroke(); txt(T, '보이는 물질 + 암흑 물질', lx + 20, ly + 40, { size: 11 });
      // 질량 막대 (30 kpc 안)
      txt(T, '30 kpc 안의 질량', br.x + 6, br.y + 16, { bold: true });
      var mObs = obs[obs.length - 1].v * obs[obs.length - 1].v * 30 / G;
      var bars = [
        { n: '보이는 물질', m: mVis(30), c: T.figBlue },
        { n: '+ 암흑 물질', m: st.m, c: T.figViolet },
        { n: '회전으로 잰 질량', m: mObs, c: T.figRed },
      ];
      var bx = br.x + 10, bw = br.w - 20, top = br.y + 30, rowH = Math.min(46, (br.h - 50) / 3), MAX = 5.5e11;
      bars.forEach(function (b, i) {
        var y = top + i * rowH;
        txt(T, b.n, bx, y + 12, { size: 11, color: T.figMuted });
        var x0 = bx, len = b.m / MAX * bw;
        if (i === 1) { x0 = bx + mVis(30) / MAX * bw; ctx.fillStyle = T.figBlue; ctx.globalAlpha = 0.35; ctx.fillRect(bx, y + 17, x0 - bx, 12); ctx.globalAlpha = 1; }
        ctx.fillStyle = b.c; ctx.fillRect(x0, y + 17, Math.max(len, b.m > 0 ? 1 : 0), 12);
        var lab = (b.m / 1e11).toFixed(1) + '×10¹¹';
        if (i === 1) lab = '합 ' + ((mVis(30) + b.m) / 1e11).toFixed(1) + '×10¹¹';
        txt(T, lab, Math.min(x0 + len + 4, bx + bw - 60), y + 27, { size: 11 });
      });
      txt(T, '단위: 태양 질량 M☉', bx, top + 3 * rowH + 8, { size: 11, color: T.figMuted });
    }
    api.onResize(draw);
    upd();
  },
});
