/* 수학 도구 6 푸리에 급수: 사각파·삼각파·톱니파·펄스 열을 N배음까지 더해 본다 — 부분합, 깁스 넘침, |cₙ| 스펙트럼, 파스발 누적 파워 */
Sims.register('mj-fourier-synth', {
  title: '푸리에 급수 합성기 — 배음을 하나씩 더하면',
  caption: '파형을 고르고 더하는 배음의 수 N을 바꾸어 보자. 위 그래프의 회색은 목표 파형(주기 2π), 파란 곡선은 N배음까지 더한 부분합이다. 사각파·톱니파·펄스 열처럼 불연속이 있으면 계수가 1/n로 느리게 줄고, N을 아무리 늘려도 불연속점 옆의 넘침(점프의 약 9 %, 깁스 현상)이 좁아질 뿐 사라지지 않는다. 꺾임만 있는 삼각파는 계수가 1/n²로 빨리 줄어 몇 항만으로도 거의 맞는다. 아래 막대는 |cₙ|(n ≥ 0, 음의 n은 같은 크기)이고, 누적 파워 비율은 파스발 정리 c₀² + 2Σ|cₙ|²를 신호의 평균 제곱으로 나눈 값이다.',
  init: function (api) {
    var shapes = {
      square: { name: '사각파', ms: 1, jump: 2,
        f: function (x) { var u = mod(x); return u < Math.PI ? 1 : -1; },
        c: function (n) { return n % 2 ? 2 / (n * Math.PI) : 0; } },
      triangle: { name: '삼각파', ms: 1 / 3, jump: 0,
        f: function (x) { var u = mod(x + Math.PI) - Math.PI; return 1 - 2 * Math.abs(u) / Math.PI; },
        c: function (n) { return n % 2 ? 4 / (Math.PI * Math.PI * n * n) : 0; } },
      saw: { name: '톱니파', ms: 1 / 3, jump: 2,
        f: function (x) { var u = mod(x + Math.PI) - Math.PI; return u / Math.PI; },
        c: function (n) { return 1 / (n * Math.PI); } },
      pulse: { name: '펄스 열', ms: null, jump: 1,
        f: function (x) { var u = mod(x + Math.PI) - Math.PI; return Math.abs(u) < Math.PI * state.duty ? 1 : 0; },
        c: function (n) { return Math.abs(Math.sin(n * Math.PI * state.duty) / (n * Math.PI)); } },
    };
    // 부분합 계산용 실제 계수 (sin/cos 형태)
    function term(shape, n, x) {
      if (shape === 'square') return n % 2 ? 4 / (n * Math.PI) * Math.sin(n * x) : 0;
      if (shape === 'triangle') return n % 2 ? 8 / (Math.PI * Math.PI * n * n) * Math.cos(n * x) : 0;
      if (shape === 'saw') return 2 * (n % 2 ? 1 : -1) / (n * Math.PI) * Math.sin(n * x);
      return 2 * Math.sin(n * Math.PI * state.duty) / (n * Math.PI) * Math.cos(n * x);
    }
    function dc() { return state.shape === 'pulse' ? state.duty : 0; }
    function mod(x) { var p = 2 * Math.PI; return ((x % p) + p) % p; }

    var state = { shape: 'square', N: 5, duty: 0.25 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.15 : 0.62; }, label: '목표 파형과 푸리에 부분합, 아래에 계수 스펙트럼' });
    var ctx = cv.ctx;
    var rN = api.readout('더한 배음 N');
    var rMax = api.readout('부분합 최댓값');
    var rOver = api.readout('넘침(점프 대비)');
    var rP = api.readout('누적 파워 비율');

    var g = api.group();
    var keys = ['square', 'triangle', 'saw', 'pulse'];
    var btns = keys.map(function (k) {
      return api.button(shapes[k].name, function () { state.shape = k; sync(); draw(); }, { toggle: true, pressed: k === state.shape, parent: g });
    });
    var sN = api.slider({ id: 'mj-fourier-synth-n', label: '배음의 수 N', min: 1, max: 100, step: 1, value: state.N,
      format: function (v) { return String(v); }, onInput: function (v) { state.N = Math.round(v); draw(); } });
    var sD = api.slider({ id: 'mj-fourier-synth-duty', label: '펄스 폭 비율 τ/T', min: 0.05, max: 0.5, step: 0.01, value: state.duty,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { state.duty = v; draw(); } });
    var playing = false, acc = 0;
    var bPlay = api.button('N = 1부터 차례로 더하기', function () {
      if (api.reduced) { sN.set(Math.min(100, state.N + 1)); return; }
      playing = !playing; if (playing) { if (state.N >= 60) sN.set(1); loop.play(); } else loop.pause();
      bPlay.textContent = playing ? '멈추기' : 'N = 1부터 차례로 더하기';
    }, { primary: true });
    if (api.reduced) bPlay.textContent = 'N 하나 늘리기';
    var loop = api.loop(function (dt) {
      if (!(dt > 0) || !playing) return;
      acc += dt;
      var step = state.N < 15 ? 0.45 : 0.12;
      if (acc >= step) {
        acc = 0;
        if (state.N >= 60) { playing = false; loop.pause(); bPlay.textContent = 'N = 1부터 차례로 더하기'; return; }
        sN.set(state.N + 1);
      }
    });
    loop.pause();

    function sync() {
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', keys[i] === state.shape ? 'true' : 'false'); });
      sD.input.disabled = state.shape !== 'pulse';
      sD.input.parentNode.style.opacity = state.shape === 'pulse' ? '1' : '0.45';
    }
    function partial(x) {
      var s = dc();
      for (var n = 1; n <= state.N; n++) s += term(state.shape, n, x);
      return s;
    }
    function meanSquare() { return state.shape === 'pulse' ? state.duty : shapes[state.shape].ms; }
    function power() {
      var p = dc() * dc();
      for (var n = 1; n <= state.N; n++) { var c = shapes[state.shape].c(n); p += 2 * c * c; }
      return p / meanSquare();
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var narrow = w < 560;
      var top = { x: 46, y: 14, w: w - 60, h: h * (narrow ? 0.5 : 0.56) };
      var bot = { x: 46, y: top.y + top.h + 46, w: w - 60, h: h - top.h - 46 - 14 - 40 };
      var sh = shapes[state.shape];
      var ylo = state.shape === 'pulse' ? -0.4 : -1.45, yhi = state.shape === 'pulse' ? 1.35 : 1.45;
      var X = function (x) { return top.x + (x + Math.PI) / (3 * Math.PI) * top.w; };   // x: −π ~ 2π
      var Y = function (y) { return top.y + (yhi - y) / (yhi - ylo) * top.h; };
      // 격자·축
      ctx.lineWidth = 1; ctx.strokeStyle = T.rule; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'right';
      (state.shape === 'pulse' ? [0, 0.5, 1] : [-1, 0, 1]).forEach(function (v) {
        ctx.beginPath(); ctx.moveTo(top.x, Y(v)); ctx.lineTo(top.x + top.w, Y(v)); ctx.stroke(); ctx.fillText(String(v).replace('-', '−'), top.x - 6, Y(v) + 4);
      });
      ctx.textAlign = 'center';
      [[-Math.PI, '−π'], [0, '0'], [Math.PI, 'π'], [2 * Math.PI, '2π']].forEach(function (p) { ctx.fillText(p[1], X(p[0]), top.y + top.h + 15); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.fillText('x', top.x + top.w - 6, top.y + top.h + 15);
      // 목표 파형
      var M = Math.max(600, Math.round(top.w * 2)), i, x;
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 4; ctx.globalAlpha = 0.7; ctx.beginPath();
      var prev = null;
      for (i = 0; i <= M; i++) {
        x = -Math.PI + 3 * Math.PI * i / M; var v = sh.f(x);
        if (i === 0) ctx.moveTo(X(x), Y(v)); else { if (prev !== null && Math.abs(v - prev) > 0.5) ctx.lineTo(X(x), Y(prev)); ctx.lineTo(X(x), Y(v)); }
        prev = v;
      }
      ctx.stroke(); ctx.globalAlpha = 1;
      // 부분합 (N이 크면 촘촘히)
      var M2 = Math.max(M, state.N * 12);
      var mx = -1e9, ys = [];
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2; ctx.beginPath();
      for (i = 0; i <= M2; i++) {
        x = -Math.PI + 3 * Math.PI * i / M2;
        var s = partial(x); if (s > mx) mx = s;
        var yy = Y(Math.max(ylo, Math.min(yhi, s)));
        if (i === 0) ctx.moveTo(X(x), yy); else ctx.lineTo(X(x), yy);
      }
      ctx.stroke();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figAccent;
      ctx.fillText('부분합 (N = ' + state.N + '배음까지)', top.x + 6, top.y + 12);
      ctx.fillStyle = T.figMuted; ctx.fillText('목표: ' + sh.name + (state.shape === 'pulse' ? ' (τ/T = ' + state.duty.toFixed(2) + ')' : ''), top.x + 6, top.y + 28);
      // 스펙트럼
      var nMax = Math.max(20, Math.min(100, state.N + 5));
      var cmax = state.shape === 'pulse' ? Math.max(state.duty, 2 / Math.PI * 0.5) : (state.shape === 'triangle' ? 4 / (Math.PI * Math.PI) : 2 / Math.PI);
      cmax *= 1.12;
      var BX = function (n) { return bot.x + (n + 0.5) / (nMax + 1) * bot.w; };
      var BY = function (c) { return bot.y + bot.h - c / cmax * bot.h; };
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bot.x, bot.y + bot.h); ctx.lineTo(bot.x + bot.w, bot.y + bot.h); ctx.moveTo(bot.x, bot.y); ctx.lineTo(bot.x, bot.y + bot.h); ctx.stroke();
      var bw = Math.max(1.5, Math.min(10, bot.w / (nMax + 1) * 0.6));
      for (var n = 0; n <= nMax; n++) {
        var c = n === 0 ? Math.abs(dc()) : sh.c(n);
        if (c < 1e-12) continue;
        ctx.fillStyle = n <= state.N ? T.figAccent : T.figLine;
        ctx.fillRect(BX(n) - bw / 2, BY(c), bw, bot.y + bot.h - BY(c));
      }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      var stepT = nMax > 60 ? 20 : (nMax > 30 ? 10 : 5);
      for (n = 0; n <= nMax; n += stepT) ctx.fillText(String(n), BX(n), bot.y + bot.h + 14);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('|cₙ| (파랑: 더한 항, 회색: 아직 안 더한 항)', bot.x + 6, bot.y - 8);
      ctx.textAlign = 'right'; ctx.fillText('n', bot.x + bot.w, bot.y + bot.h + 28);
      // 누적 파워 막대
      var pw = power();
      var gx = bot.x + bot.w * 0.55, gy = bot.y + 6, gw = bot.w * 0.42, gh = 12;
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(gx, gy, gw, gh);
      ctx.fillStyle = T.figGreen; ctx.fillRect(gx, gy, gw * Math.min(1, pw), gh);
      ctx.strokeStyle = T.figLine; ctx.strokeRect(gx, gy, gw, gh);
      ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('누적 파워 ' + (pw * 100).toFixed(1) + ' %', gx, gy + gh + 13);
      // readouts
      rN.set(String(state.N));
      rMax.set(mx.toFixed(3));
      if (sh.jump > 0) {
        var top1 = state.shape === 'pulse' ? 1 : 1;
        rOver.set(((mx - top1) / sh.jump * 100).toFixed(1) + ' %');
      } else rOver.set('없음(연속 함수)');
      rP.set((pw * 100).toFixed(2) + ' %');
    }
    api.onResize(draw);
    sync(); draw();
  },
});
