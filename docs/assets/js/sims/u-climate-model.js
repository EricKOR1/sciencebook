/* 일반지구과학 9 기후 모형: 0차원 에너지 수지 모형 C dT/dt = F − λT (탐구 활동 A를 그대로 계산) */
Sims.register('u-climate-model', {
  title: '0차원 에너지 수지 기후 모형 — CO₂ 경로와 기후 민감도',
  caption: 'CO₂ 시나리오를 고르고 되먹임 매개 변수 λ(평형 기후 민감도 = 3.7/λ)와 바다 혼합층 깊이를 바꿔 보자. F = 5.35 ln(C/280)에 대해 C dT/dt = F − λT를 1년 간격으로 풀면, 기온(실선)은 그때의 평형값 F/λ(점선)를 시간 상수 τ = C/λ만큼 늦게 따라가므로 CO₂ 증가를 멈춰도 한동안 더 오르고, λ의 작은 차이가 2100년 기온을 크게 바꾼다. 1850년 280 ppm(평형)에서 2020년 413 ppm까지 매년 같은 비율로 늘렸고, \'2030년부터 감소\'는 해마다 1 ppm 감소로 가정했다. 에어로졸과 심층 해양을 뺀 단순 모형이라 관측보다 높게 나온다.',
  init: function (api) {
    var Y0 = 1850, Y1 = 2100, DT = 3.16e7, RHOC = 1025 * 3990;
    var st = { sc: 0, lam: 1.2, depth: 100, volc: false };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.55; }, label: '1850~2100년 CO₂ 농도와 기온 편차 그래프' });
    var ctx = cv.ctx;
    var rE = api.readout('평형 기후 민감도 ');
    var rTau = api.readout('시간 상수 τ ');
    var r20 = api.readout('2020년 기온 편차 ');
    var r21 = api.readout('2100년 기온 편차 ');
    var names = ['증가 지속 (연 +2.5 ppm)', '2050년까지 증가율 0으로', '2030년부터 감소'];
    var g = api.group();
    var bs = names.map(function (n, i) { return api.button(n, function () { st.sc = i; sync(); update(); }, { toggle: true, pressed: i === 0, parent: g }); });
    function sync() { bs.forEach(function (b, i) { b.setAttribute('aria-pressed', i === st.sc ? 'true' : 'false'); }); }
    api.slider({ id: 'u-climate-model-lam', label: '되먹임 매개 변수 λ', min: 0.6, max: 2.0, step: 0.05, value: st.lam,
      format: function (v) { return v.toFixed(2) + ' W/(m²·K)'; }, onInput: function (v) { st.lam = v; update(); } });
    api.slider({ id: 'u-climate-model-depth', label: '바다 혼합층 깊이', min: 25, max: 400, step: 5, value: st.depth,
      format: function (v) { return v + ' m'; }, onInput: function (v) { st.depth = v; update(); } });
    var bV = api.button('1991년 화산 (−3 W/m², 1년)', function () { st.volc = !st.volc; bV.setAttribute('aria-pressed', st.volc ? 'true' : 'false'); update(); }, { toggle: true, pressed: false });

    var GROW = Math.pow(413 / 280, 1 / 170);
    function run(lam, sc) {
      var C = RHOC * st.depth, out = [], co2 = 280, T = 0;
      for (var y = Y0; y <= Y1; y++) {
        if (y > Y0) {
          if (y <= 2020) co2 *= GROW;
          else if (sc === 0) co2 += 2.5;
          else if (sc === 1) co2 += y <= 2050 ? 2.5 * (2050 - y) / 30 : 0;
          else co2 += y <= 2030 ? 2.5 : -1;
        }
        var F = 5.35 * Math.log(co2 / 280) + (st.volc && y === 1991 ? -3 : 0);
        out.push({ y: y, c: co2, F: F, T: T, eq: F / lam });
        T = T + DT / C * (F - lam * T);
      }
      return out;
    }
    var data, ref;
    function at(arr, y) { return arr[y - Y0]; }
    function update() {
      data = run(st.lam, st.sc);
      ref = st.lam !== 1.2 ? run(1.2, st.sc) : null;
      rE.set((3.7 / st.lam).toFixed(1) + ' °C');
      rTau.set((RHOC * st.depth / st.lam / DT).toFixed(0) + ' 년');
      r20.set('+' + at(data, 2020).T.toFixed(2) + ' °C');
      r21.set('+' + at(data, 2100).T.toFixed(2) + ' °C');
      draw();
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var L = 52, R = w - 16;
      var top = { y: 22, h: h * 0.28 }, bot = { y: h * 0.28 + 64, h: h - (h * 0.28 + 64) - 34 };
      var sx = function (y) { return L + (y - Y0) / (Y1 - Y0) * (R - L); };
      ctx.font = '11px ' + T.fontMono; ctx.lineWidth = 1;
      // x 격자
      ctx.strokeStyle = T.rule; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
      for (var y = 1850; y <= 2100; y += 50) {
        ctx.beginPath(); ctx.moveTo(sx(y), top.y); ctx.lineTo(sx(y), top.y + top.h); ctx.moveTo(sx(y), bot.y); ctx.lineTo(sx(y), bot.y + bot.h); ctx.stroke();
        ctx.fillText(y, sx(y), bot.y + bot.h + 15);
      }
      // 현재 표시
      ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figMuted;
      ctx.beginPath(); ctx.moveTo(sx(2020), top.y); ctx.lineTo(sx(2020), bot.y + bot.h); ctx.stroke(); ctx.setLineDash([]);
      // 위: CO2
      var cmax = Math.max(700, Math.ceil(Math.max.apply(null, data.map(function (d) { return d.c; })) / 100) * 100);
      var syc = function (c) { return top.y + top.h - (c - 250) / (cmax - 250) * top.h; };
      ctx.textAlign = 'right'; ctx.fillStyle = T.figMuted;
      for (var c = 300; c <= cmax; c += 100) { ctx.strokeStyle = T.rule; ctx.beginPath(); ctx.moveTo(L, syc(c)); ctx.lineTo(R, syc(c)); ctx.stroke(); ctx.fillText(c, L - 6, syc(c) + 4); }
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2.2; ctx.beginPath();
      data.forEach(function (d, i) { if (i) ctx.lineTo(sx(d.y), syc(d.c)); else ctx.moveTo(sx(d.y), syc(d.c)); }); ctx.stroke();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figInk;
      ctx.fillText('대기 CO₂ (ppm)', L, top.y - 8);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      ctx.fillText('2100년 ' + Math.round(at(data, 2100).c) + ' ppm', R, top.y - 8);
      // 아래: 기온
      var tmax = Math.max(2, Math.ceil(Math.max.apply(null, data.map(function (d) { return Math.max(d.T, d.eq); }).concat(ref ? ref.map(function (d) { return d.T; }) : [])) + 0.2));
      var tmin = st.volc ? -0.5 : 0;
      var syt = function (t) { return bot.y + bot.h - (t - tmin) / (tmax - tmin) * bot.h; };
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      var stp = tmax > 5 ? 2 : 1;
      for (var t = 0; t <= tmax; t += stp) { ctx.strokeStyle = T.rule; ctx.beginPath(); ctx.moveTo(L, syt(t)); ctx.lineTo(R, syt(t)); ctx.stroke(); ctx.fillText(t, L - 6, syt(t) + 4); }
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figInk;
      ctx.fillText('기온 편차 (°C, 1850년 대비)', L, bot.y - 8);
      // 평형값 F/λ
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.6; ctx.beginPath();
      data.forEach(function (d, i) { var yy = syt(Math.max(tmin, d.eq)); if (i) ctx.lineTo(sx(d.y), yy); else ctx.moveTo(sx(d.y), yy); }); ctx.stroke(); ctx.setLineDash([]);
      if (ref) {
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.4; ctx.beginPath();
        ref.forEach(function (d, i) { if (i) ctx.lineTo(sx(d.y), syt(d.T)); else ctx.moveTo(sx(d.y), syt(d.T)); }); ctx.stroke();
      }
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.6; ctx.beginPath();
      data.forEach(function (d, i) { if (i) ctx.lineTo(sx(d.y), syt(d.T)); else ctx.moveTo(sx(d.y), syt(d.T)); }); ctx.stroke();
      // 관측 약 1.1 °C (2011~2020)
      ctx.fillStyle = T.figGreen; ctx.beginPath(); ctx.arc(sx(2015), syt(1.1), 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('관측 약 1.1 °C (2011~2020)', sx(2015) - 8, syt(1.1) + 16);
      // 범례
      var items = [[T.figRed, [], '모형 기온 T'], [T.figAmber, [5, 4], '그때 강제력의 평형값 F/λ']];
      if (ref) items.push([T.figLine, [], 'λ = 1.2일 때(비교)']);
      ctx.textAlign = 'left';
      items.forEach(function (it, i) {
        var yy = bot.y + 12 + i * 15;
        ctx.strokeStyle = it[0]; ctx.lineWidth = 2.2; ctx.setLineDash(it[1]); ctx.beginPath(); ctx.moveTo(L + 8, yy - 4); ctx.lineTo(L + 28, yy - 4); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figInk; ctx.fillText(it[2], L + 34, yy);
      });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('연도', (L + R) / 2, bot.y + bot.h + 30);
    }
    api.onResize(draw);
    update();
  },
});
