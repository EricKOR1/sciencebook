/* 수학 도구 8 편미분방정식: 양 끝 0 ℃ 막대의 열 방정식을 사인 모드로 풀어 높은 모드가 먼저 사라지는 모습 보기 */
Sims.register('mj-heat-modes', {
  title: '막대가 식는 과정 — 모드마다 다른 감쇠 빠르기',
  caption: '처음 온도 분포를 고르고 ‘재생’을 눌러 보자. 위 그래프는 u(x, t) = Σ bₙ sin(nπx/L) e^(−t/τₙ)의 부분합(앞의 N개 항), 아래 막대는 각 모드의 크기 |bₙ e^(−t/τₙ)|이다. τₙ = L²/(n²π²α)이므로 n이 큰 모드가 n²배 빨리 사라지고, 결국 sin(πx/L) 하나만 남는다. 직사각형 분포에서 N을 작게 하면 t = 0 근처에 깁스 물결이 보인다. 막대 길이 L = 0.50 m, 양 끝은 0 ℃로 고정, 옆면으로는 열이 빠지지 않는다고 가정했다.',
  init: function (api) {
    var L = 0.5, U0 = 40, NMAX = 15, NX = 241;
    var shapes = [
      { name: '균일(직사각형)', f: function (x) { return x > 0 && x < L ? U0 : 0; } },
      { name: '삼각형', f: function (x) { return U0 * (1 - Math.abs(2 * x / L - 1)); } },
      { name: '한쪽 봉우리', f: function (x) { var s = 0.04, c = 0.13; return U0 * Math.exp(-(x - c) * (x - c) / (2 * s * s)); } },
      { name: '사인 하나', f: function (x) { return U0 * Math.sin(Math.PI * x / L); } },
    ];
    var st = { k: 0, alpha: 1.1e-4, N: 15, speed: 40, t: 0, b: [] };
    function coeffs() {
      // bₙ = (2/L)∫ f sin(nπx/L) dx, 심프슨 적분(직사각형은 해석값 4U₀/nπ와 같다)
      var f = shapes[st.k].f, M = 2000, h = L / M, b = [];
      for (var n = 1; n <= NMAX; n++) {
        var s = 0;
        for (var i = 0; i <= M; i++) {
          var x = i * h, w = (i === 0 || i === M) ? 1 : (i % 2 ? 4 : 2);
          var fx = st.k === 0 ? U0 : f(x);
          s += w * fx * Math.sin(n * Math.PI * x / L);
        }
        b.push(2 / L * s * h / 3);
      }
      st.b = b;
    }
    function tau(n) { return L * L / (n * n * Math.PI * Math.PI * st.alpha); }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.62; }, label: '막대 온도 분포와 모드 크기 막대그래프' });
    var ctx = cv.ctx;
    var rT = api.readout('시각 t'), rTau = api.readout('τ₁'), rMid = api.readout('가운데 온도'), rRat = api.readout('|b₃ 항| / |b₁ 항|');

    var g = api.group();
    var btns = shapes.map(function (s, i) {
      return api.button(s.name, function () { st.k = i; btns.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); coeffs(); reset(); }, { toggle: true, pressed: i === 0, parent: g });
    });
    api.slider({ id: 'mj-heat-modes-alpha', label: '열 확산율 α', min: 2e-5, max: 1.2e-4, step: 1e-6, value: st.alpha,
      format: function (v) { return (v * 1e5).toFixed(1) + '×10⁻⁵ m²/s'; }, onInput: function (v) { st.alpha = v; draw(); } });
    api.slider({ id: 'mj-heat-modes-n', label: '더할 모드 수 N', min: 1, max: NMAX, step: 1, value: st.N,
      format: function (v) { return v + '개'; }, onInput: function (v) { st.N = v; draw(); } });
    api.slider({ id: 'mj-heat-modes-speed', label: '재생 속도', min: 5, max: 150, step: 5, value: st.speed,
      format: function (v) { return '1초에 ' + v + ' s'; }, onInput: function (v) { st.speed = v; } });
    var g2 = api.group();
    var playBtn = api.button(api.reduced ? '한 단계 (+τ₁/5)' : '재생', function () {
      if (api.reduced) { st.t += tau(1) / 5; draw(); return; }
      if (loop.playing) { loop.pause(); playBtn.textContent = '재생'; } else { loop.play(); playBtn.textContent = '멈춤'; }
    }, { primary: true, parent: g2 });
    api.button('처음으로', function () { reset(); }, { parent: g2 });

    var loop = api.loop(function (dt) {
      if (dt <= 0) return;
      st.t += dt * st.speed;
      if (st.t > 3 * tau(1)) { st.t = 3 * tau(1); loop.pause(); playBtn.textContent = '재생'; }
      draw();
    });
    loop.pause();

    function reset() { st.t = 0; loop.pause(); if (!api.reduced) playBtn.textContent = '재생'; draw(); }
    function u(x) {
      var s = 0;
      for (var n = 1; n <= st.N; n++) s += st.b[n - 1] * Math.sin(n * Math.PI * x / L) * Math.exp(-st.t / tau(n));
      return s;
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var top = { x: 52, y: 14, w: w - 66, h: h * 0.52 - 40 };
      var bot = { x: 52, y: h * 0.52 + 14, w: w - 66, h: h * 0.48 - 50 };
      // 위: 온도 분포
      var UMAX = 55, UMIN = -10;
      var sx = function (x) { return top.x + x / L * top.w; }, sy = function (v) { return top.y + (UMAX - v) / (UMAX - UMIN) * top.h; };
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right'; ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      [-10, 0, 10, 20, 30, 40, 50].forEach(function (v) { ctx.beginPath(); ctx.moveTo(top.x, sy(v)); ctx.lineTo(top.x + top.w, sy(v)); ctx.stroke(); ctx.fillText(String(v).replace('-', '−'), top.x - 6, sy(v) + 4); });
      ctx.textAlign = 'center';
      [0, 0.1, 0.2, 0.3, 0.4, 0.5].forEach(function (x) { ctx.fillText(x.toFixed(1), sx(x), top.y + top.h + 14); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('위치 x (m)', top.x + top.w / 2, top.y + top.h + 30);
      ctx.save(); ctx.translate(14, top.y + top.h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('온도 u (℃)', 0, 0); ctx.restore();
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(top.x, sy(0)); ctx.lineTo(top.x + top.w, sy(0)); ctx.stroke();
      // 처음 분포(참값)
      var f = shapes[st.k].f;
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.4; ctx.beginPath();
      var i, x, v;
      if (st.k === 0) { ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(0), sy(U0)); ctx.lineTo(sx(L), sy(U0)); ctx.lineTo(sx(L), sy(0)); }
      else for (i = 0; i < NX; i++) { x = i / (NX - 1) * L; v = f(x); if (i) ctx.lineTo(sx(x), sy(v)); else ctx.moveTo(sx(x), sy(v)); }
      ctx.stroke(); ctx.setLineDash([]);
      // 부분합
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.4; ctx.beginPath();
      for (i = 0; i < NX; i++) { x = i / (NX - 1) * L; v = u(x); if (i) ctx.lineTo(sx(x), sy(v)); else ctx.moveTo(sx(x), sy(v)); }
      ctx.stroke();
      ctx.textAlign = 'right'; ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figRed;
      ctx.fillText('u(x, t), 앞의 ' + st.N + '개 항', top.x + top.w - 4, top.y + 12);
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('점선: 처음 분포', top.x + top.w - 4, top.y + 28);
      // 아래: 모드 막대
      var bmax = 0; st.b.forEach(function (bb) { bmax = Math.max(bmax, Math.abs(bb)); });
      var bw = bot.w / NMAX;
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(bot.x, bot.y); ctx.lineTo(bot.x, bot.y + bot.h); ctx.lineTo(bot.x + bot.w, bot.y + bot.h); ctx.stroke();
      for (var n = 1; n <= NMAX; n++) {
        var a0 = Math.abs(st.b[n - 1]), a = a0 * Math.exp(-st.t / tau(n));
        var x0 = bot.x + (n - 1) * bw + bw * 0.18, ww = bw * 0.64;
        ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
        var h0 = a0 / bmax * bot.h, h1 = a / bmax * bot.h;
        if (h0 > 0.5) { ctx.strokeRect(x0, bot.y + bot.h - h0, ww, h0); }
        ctx.fillStyle = n <= st.N ? T.figBlue : T.figLine;
        ctx.fillRect(x0, bot.y + bot.h - h1, ww, h1);
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
        ctx.fillText(n, x0 + ww / 2, bot.y + bot.h + 13);
      }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      if (w < 560) {
        ctx.fillText('모드 번호 n', bot.x + bot.w / 2, bot.y + bot.h + 28);
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody;
        ctx.fillText('테두리: 처음 크기, 채움: 지금 크기, 회색: 뺀 항', bot.x + bot.w / 2, bot.y + bot.h + 43);
      } else ctx.fillText('모드 번호 n  (테두리: 처음 크기 |bₙ|, 채움: 지금 크기, 회색: 부분합에서 뺀 항)', bot.x + bot.w / 2, bot.y + bot.h + 30);
      ctx.save(); ctx.translate(14, bot.y + bot.h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('|bₙ e^(−t/τₙ)|', 0, 0); ctx.restore();
      // 읽음값
      rT.set(st.t.toFixed(0) + ' s  (' + (st.t / tau(1)).toFixed(2) + ' τ₁)');
      rTau.set(tau(1).toFixed(0) + ' s');
      rMid.set(u(L / 2).toFixed(1) + ' ℃');
      var r1 = Math.abs(st.b[0]) * Math.exp(-st.t / tau(1)), r3 = Math.abs(st.b[2]) * Math.exp(-st.t / tau(3));
      rRat.set(r1 > 1e-9 ? (r3 / r1 < 1e-4 ? '< 0.0001' : (r3 / r1).toFixed(4)) : '–');
    }
    coeffs();
    api.onResize(draw);
    draw();
  },
});
