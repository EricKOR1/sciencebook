/* 수학 도구 6 불확정 관계: 펄스 모양·폭·반송 진동수를 바꾸며 시간 신호와 파워 스펙트럼 |F(ν)|²의 폭을 비교 — Δt·Δν 는 모양마다 정해진 상수 */
Sims.register('mj-time-freq-uncertainty', {
  title: '짧은 펄스, 넓은 스펙트럼 — 시간–진동수 불확정성 탐색기',
  caption: '펄스 모양을 고르고 폭 슬라이더를 움직여 보자. 위는 시간 신호 Re f(t)(파랑)와 포락선(점선), 아래는 파워 스펙트럼 |F(ν)|²(높이를 1로 맞춤)이다. 폭을 줄이면 스펙트럼이 그만큼 넓어지고, 두 폭의 곱은 모양마다 정해진 상수로 변하지 않는다: 가우스 0.441(가장 작다), 사각 펄스 0.886. 지수 감쇠는 진폭 감쇠 시간 T₂와 로렌츠 반치 전폭 1/(πT₂)의 곱 1/π ≈ 0.318을 보인다(반치 전폭으로 정의한 폭은 모양마다 상수가 다르므로 표준 편차로 정의한 Δt·Δω ≥ 1/2와 직접 비교하지 않는다). 반송 진동수는 스펙트럼의 중심만 옮기고 폭은 바꾸지 않는다. 스펙트럼은 복소 신호 exp(2πiν₀t)×포락선의 것으로, 음의 진동수 쪽 거울상은 생략했다.',
  init: function (api) {
    var LN2 = Math.log(2);
    var state = { shape: 'gauss', w: 1.0, nu0: 3.0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.2 : 0.62; }, label: '시간 신호와 파워 스펙트럼' });
    var ctx = cv.ctx;
    var rT = api.readout('Δt');
    var rN = api.readout('Δν (|F|² 반치 전폭)');
    var rP = api.readout('곱');
    var shapes = {
      gauss: { name: '가우스', wl: 'Δt (|f|² 반치 전폭)',
        env: function (t, w) { return Math.exp(-2 * LN2 * t * t / (w * w)); },
        dnu: function (w) { return 2 * LN2 / (Math.PI * w); },
        spec: function (d, w) { var D = 2 * LN2 / (Math.PI * w); return Math.exp(-4 * LN2 * d * d / (D * D)); } },
      rect: { name: '사각', wl: 'τ (펄스 폭 = |f|² 반치 전폭)',
        env: function (t, w) { return Math.abs(t) <= w / 2 ? 1 : 0; },
        dnu: function (w) { return 0.88589 / w; },
        spec: function (d, w) { var u = Math.PI * d * w; return u === 0 ? 1 : Math.pow(Math.sin(u) / u, 2); } },
      exp: { name: '지수 감쇠', wl: 'T₂ (진폭 감쇠 시간)',
        env: function (t, w) { return t < 0 ? 0 : Math.exp(-t / w); },
        dnu: function (w) { return 1 / (Math.PI * w); },
        spec: function (d, w) { var u = 2 * Math.PI * d * w; return 1 / (1 + u * u); } },
    };
    var keys = ['gauss', 'rect', 'exp'];
    var g = api.group();
    var btns = keys.map(function (k) {
      return api.button(shapes[k].name, function () { state.shape = k; sync(); draw(); }, { toggle: true, pressed: k === state.shape, parent: g });
    });
    var sW = api.slider({ id: 'mj-time-freq-uncertainty-w', label: '펄스 폭', min: Math.log10(0.1), max: Math.log10(4), step: 0.01, value: 0,
      format: function (v) { return Math.pow(10, v).toFixed(2) + ' ms'; }, onInput: function (v) { state.w = Math.pow(10, v); draw(); } });
    var sN = api.slider({ id: 'mj-time-freq-uncertainty-nu', label: '반송 진동수 ν₀', min: 0.5, max: 5, step: 0.1, value: state.nu0,
      format: function (v) { return v.toFixed(1) + ' kHz'; }, onInput: function (v) { state.nu0 = v; draw(); } });
    var sweeping = false, dir = -1;
    var bS = api.button('폭을 자동으로 바꾸기', function () {
      if (api.reduced) { sW.set(Math.max(Math.log10(0.1), sW.value - 0.15)); return; }
      sweeping = !sweeping; if (sweeping) loop.play(); else loop.pause();
      bS.textContent = sweeping ? '멈추기' : '폭을 자동으로 바꾸기';
    }, { primary: true });
    if (api.reduced) bS.textContent = '폭 줄이기';
    var loop = api.loop(function (dt) {
      if (!(dt > 0) || !sweeping) return;
      var v = sW.value + dir * dt * 0.35;
      if (v < Math.log10(0.1)) { v = Math.log10(0.1); dir = 1; }
      if (v > Math.log10(4)) { v = Math.log10(4); dir = -1; }
      sW.set(v);
    });
    loop.pause();
    function sync() { btns.forEach(function (b, i) { b.setAttribute('aria-pressed', keys[i] === state.shape ? 'true' : 'false'); }); }

    function axes(T, r, xl, ticks, fmt) {
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h); ctx.lineTo(r.x + r.w, r.y + r.h); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      ticks.forEach(function (v) { var x = fmt(v); ctx.beginPath(); ctx.moveTo(x, r.y + r.h); ctx.lineTo(x, r.y + r.h + 4); ctx.stroke(); ctx.fillText(String(v).replace('-', '−'), x, r.y + r.h + 15); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText(xl, r.x + r.w, r.y + r.h + 30);
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, sh = shapes[state.shape], W = state.w;
      ctx.clearRect(0, 0, w, h);
      var top = { x: 14, y: 26, w: w - 28, h: h * 0.36 };
      var bot = { x: 14, y: top.y + top.h + 62, w: w - 28, h: h - top.h - 26 - 62 - 40 };
      // 시간
      var t0 = -6, t1 = 10;
      var X = function (t) { return top.x + (t - t0) / (t1 - t0) * top.w; };
      var Y = function (y) { return top.y + top.h / 2 - y * top.h * 0.46; };
      axes(T, { x: top.x, y: top.y, w: top.w, h: top.h }, '시간 t (ms)', [-6, -4, -2, 0, 2, 4, 6, 8, 10], X);
      ctx.strokeStyle = T.figLine; ctx.beginPath(); ctx.moveTo(top.x, Y(0)); ctx.lineTo(top.x + top.w, Y(0)); ctx.stroke();
      // 폭 표시 띠
      var a0, a1;
      if (state.shape === 'gauss') { a0 = -W / 2; a1 = W / 2; }
      else if (state.shape === 'rect') { a0 = -W / 2; a1 = W / 2; }
      else { a0 = 0; a1 = W; }
      ctx.fillStyle = T.figSoftAmber; ctx.fillRect(X(a0), top.y, Math.max(1, X(a1) - X(a0)), top.h);
      var M = Math.round(top.w * 3), i, t, e;
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 1.4; ctx.beginPath();
      for (i = 0; i <= M; i++) { t = t0 + (t1 - t0) * i / M; e = sh.env(t, W); var y = Y(e * Math.cos(2 * Math.PI * state.nu0 * t)); if (i === 0) ctx.moveTo(X(t), y); else ctx.lineTo(X(t), y); }
      ctx.stroke();
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.4;
      [1, -1].forEach(function (sg) { ctx.beginPath(); for (i = 0; i <= M; i++) { t = t0 + (t1 - t0) * i / M; e = sh.env(t, W); if (i === 0) ctx.moveTo(X(t), Y(sg * e)); else ctx.lineTo(X(t), Y(sg * e)); } ctx.stroke(); });
      ctx.setLineDash([]);
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('시간 신호 Re f(t)와 포락선', top.x, top.y - 10);
      ctx.fillStyle = T.figAmber; ctx.textAlign = 'right';
      ctx.fillText('주황 띠: ' + (state.shape === 'exp' ? 'T₂' : 'Δt'), top.x + top.w, top.y - 10);
      // 스펙트럼
      var n0 = 0, n1 = 12;
      var BX = function (n) { return bot.x + (n - n0) / (n1 - n0) * bot.w; };
      var BY = function (y) { return bot.y + bot.h - y * bot.h * 0.92; };
      axes(T, bot, '진동수 ν (kHz)', [0, 2, 4, 6, 8, 10, 12], BX);
      var dn = sh.dnu(W);
      ctx.fillStyle = T.figSoftAmber; ctx.fillRect(BX(state.nu0 - dn / 2), bot.y, Math.max(1, BX(state.nu0 + dn / 2) - BX(state.nu0 - dn / 2)), bot.h);
      var M2 = Math.round(bot.w * 3);
      ctx.beginPath(); ctx.moveTo(BX(n0), BY(0));
      for (i = 0; i <= M2; i++) { var nu = n0 + (n1 - n0) * i / M2; ctx.lineTo(BX(nu), BY(sh.spec(nu - state.nu0, W))); }
      ctx.lineTo(BX(n1), BY(0)); ctx.closePath();
      ctx.fillStyle = T.figSoftBlue; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2; ctx.beginPath();
      for (i = 0; i <= M2; i++) { nu = n0 + (n1 - n0) * i / M2; var yy = BY(sh.spec(nu - state.nu0, W)); if (i === 0) ctx.moveTo(BX(nu), yy); else ctx.lineTo(BX(nu), yy); }
      ctx.stroke();
      // 반치선
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(BX(state.nu0 - dn / 2), BY(0.5)); ctx.lineTo(BX(state.nu0 + dn / 2), BY(0.5)); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(w < 560 ? '|F(ν)|² (높이 1)' : '파워 스펙트럼 |F(ν)|² (높이 1로 맞춤)', bot.x, bot.y - 10);
      ctx.fillStyle = T.figRed; ctx.textAlign = 'right';
      ctx.fillText(w < 560 ? '빨간 선: Δν' : '빨간 선: 반치 전폭 Δν', bot.x + bot.w, bot.y - 10);
      // readouts
      rT.set((state.shape === 'exp' ? 'T₂ = ' : state.shape === 'rect' ? 'τ = ' : '') + W.toFixed(2) + ' ms');
      rN.set(dn.toFixed(3) + ' kHz');
      rP.set((state.shape === 'exp' ? 'T₂·Δν = ' : 'Δt·Δν = ') + (W * dn).toFixed(3));
    }
    api.onResize(draw);
    sync(); draw();
  },
});
