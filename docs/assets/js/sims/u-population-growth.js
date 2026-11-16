/* 일반생명과학 13 개체군 생장: 지수 생장 N0·e^(rt) 와 로지스트 생장, 그리고 dN/dt–N 그래프 */
Sims.register('u-population-growth', {
  title: '지수 생장과 로지스트 생장 — r 과 K 바꾸어 보기',
  caption: 'r, K, N₀ 를 바꾸고 "시간 흐르게 하기"를 눌러 보자. 왼쪽은 시간에 따른 개체 수(점선: 지수 생장, 실선: 로지스트 생장), 오른쪽은 개체 수에 따른 증가 속도 dN/dt 이다. 로지스트 곡선은 N = K/2 에서 가장 가파르고(증가 속도 rK/4), K 에 가까워지면 멈춘다. N₀ 를 K 보다 크게 하면 개체 수가 K 로 줄어든다. 처음 값(r = 0.5/년, K = 1000톤, N₀ = 100톤)은 본문 예제 5와 같다. 나이 구조, 시간 지연, 이입·이출은 없다고 가정한 연속 모형이다.',
  init: function (api) {
    var TMAX = 30, NMAX = 2500, GMIN = -250, GMAX = 600;
    var s = { r: 0.5, K: 1000, N0: 100, t: 5 };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.5; }, label: '개체 수-시간 그래프와 증가 속도-개체 수 그래프' });
    var ctx = cv.ctx;

    var rT = api.readout('시각 t');
    var rLog = api.readout('로지스트 N');
    var rExp = api.readout('지수 N');
    var rTd = api.readout('배가 시간 ln2/r');
    var rMax = api.readout('최대 증가 속도 rK/4');

    api.slider({ id: 'u-population-growth-r', label: '내적 증가율 r', min: 0.1, max: 1.0, step: 0.01, value: s.r,
      format: function (v) { return v.toFixed(2) + ' /년'; }, onInput: function (v) { s.r = v; update(); } });
    api.slider({ id: 'u-population-growth-k', label: '환경 수용력 K', min: 200, max: 2000, step: 50, value: s.K,
      format: function (v) { return v.toFixed(0); }, onInput: function (v) { s.K = v; update(); } });
    api.slider({ id: 'u-population-growth-n0', label: '처음 개체 수 N₀', min: 5, max: 2400, step: 5, value: s.N0,
      format: function (v) { return v.toFixed(0); }, onInput: function (v) { s.N0 = v; update(); } });
    var tSl = api.slider({ id: 'u-population-growth-t', label: '시각 t', min: 0, max: TMAX, step: 0.1, value: s.t,
      format: function (v) { return v.toFixed(1) + ' 년'; }, onInput: function (v) { s.t = v; update(); } });
    var play = api.button('시간 흐르게 하기', function () {
      if (loop.playing) { loop.pause(); play.textContent = '시간 흐르게 하기'; return; }
      if (s.t >= TMAX - 0.01) tSl.set(0);
      if (api.reduced) { tSl.set(TMAX); return; }
      play.textContent = '멈추기'; loop.play();
    }, { primary: true });

    var loop = api.loop(function (dt) {
      if (!(dt > 0)) return;
      var t = Math.min(TMAX, s.t + dt * 3);   // 화면 1초 = 3년
      tSl.set(t);
      if (t >= TMAX) { loop.pause(); play.textContent = '시간 흐르게 하기'; }
    });
    loop.pause();

    function logi(t) { return s.K / (1 + (s.K - s.N0) / s.N0 * Math.exp(-s.r * t)); }
    function expo(t) { return s.N0 * Math.exp(s.r * t); }
    function gLog(N) { return s.r * N * (1 - N / s.K); }
    function fmtN(N) { return N >= 1e5 ? N.toExponential(2) : N.toFixed(0); }
    function update() {
      rT.set(s.t.toFixed(1) + ' 년'); rLog.set(fmtN(logi(s.t))); rExp.set(fmtN(expo(s.t)));
      rTd.set((Math.LN2 / s.r).toFixed(2) + ' 년'); rMax.set((s.r * s.K / 4).toFixed(0) + ' /년');
      draw();
    }

    function axes(T, r, xlab, ylab, xmax, ymin, ymax, xt, yt) {
      var L = r.x + 50, R = r.x + r.w - 12, Tp = r.y + 24, B = r.y + r.h - 34;
      var sx = function (x) { return L + x / xmax * (R - L); };
      var sy = function (y) { return B - (y - ymin) / (ymax - ymin) * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'right';
      yt.forEach(function (y) { ctx.beginPath(); ctx.moveTo(L, sy(y)); ctx.lineTo(R, sy(y)); ctx.stroke(); ctx.fillText(y, L - 5, sy(y) + 4); });
      ctx.textAlign = 'center';
      xt.forEach(function (x) { ctx.fillText(x, sx(x), B + 14); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText(xlab, (L + R) / 2, B + 29);
      ctx.textAlign = 'left'; ctx.fillText(ylab, r.x + 4, r.y + 12);
      return { L: L, R: R, Tp: Tp, B: B, sx: sx, sy: sy };
    }
    function clipPath(A, pts, col, lw, dash) {
      ctx.save(); ctx.beginPath(); ctx.rect(A.L, A.Tp - 2, A.R - A.L, A.B - A.Tp + 4); ctx.clip();
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []);
      ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke();
      ctx.restore();
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, stacked = w < 560;
      ctx.clearRect(0, 0, w, h);
      var P1 = stacked ? { x: 0, y: 0, w: w, h: h * 0.5 } : { x: 0, y: 0, w: w * 0.54, h: h };
      var P2 = stacked ? { x: 0, y: h * 0.5, w: w, h: h * 0.5 } : { x: w * 0.56, y: 0, w: w * 0.44, h: h };

      // ① N–t
      var A = axes(T, P1, '시간 t (년)', '개체 수 N', TMAX, 0, NMAX, [0, 5, 10, 15, 20, 25, 30], [0, 500, 1000, 1500, 2000, 2500]);
      ctx.setLineDash([6, 4]); ctx.strokeStyle = T.figGreen; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(A.L, A.sy(s.K)); ctx.lineTo(A.R, A.sy(s.K)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figGreen; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('K = ' + s.K, A.R - 2, A.sy(s.K) - 5);
      var pe = [], pl = [];
      for (var i = 0; i <= 200; i++) {
        var t = TMAX * i / 200;
        pe.push([A.sx(t), A.sy(Math.min(expo(t), NMAX * 3))]);
        pl.push([A.sx(t), A.sy(logi(t))]);
      }
      clipPath(A, pe, T.figRed, 2, [6, 4]);
      clipPath(A, pl, T.figAccent, 2.6);
      // K/2 위치(로지스트 곡선이 가장 가파른 곳)
      if (s.N0 < s.K / 2) {
        var tHalf = Math.log((s.K - s.N0) / s.N0) / s.r;
        if (tHalf <= TMAX) {
          ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.arc(A.sx(tHalf), A.sy(s.K / 2), 4.5, 0, Math.PI * 2); ctx.fill();
          ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
          ctx.fillText('K/2: 가장 가파름', A.sx(tHalf) + 7, A.sy(s.K / 2) + 14);
        }
      }
      // 범례
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figRed; ctx.fillText('- - 지수 생장', A.L + 8, A.Tp + 10);
      ctx.fillStyle = T.figAccent; ctx.fillText('── 로지스트 생장', A.L + 8, A.Tp + 26);
      // 시각 표시
      var NL = logi(s.t), NE = expo(s.t);
      ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(A.sx(s.t), A.Tp); ctx.lineTo(A.sx(s.t), A.B); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figAccent; ctx.beginPath(); ctx.arc(A.sx(s.t), A.sy(NL), 5.5, 0, Math.PI * 2); ctx.fill();
      if (NE <= NMAX) { ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(A.sx(s.t), A.sy(NE), 4.5, 0, Math.PI * 2); ctx.fill(); }

      // ② dN/dt – N
      var Bx = axes(T, P2, '개체 수 N', '증가 속도 dN/dt (/년)', NMAX, GMIN, GMAX, [0, 1000, 2000], [-200, 0, 200, 400, 600]);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(Bx.L, Bx.sy(0)); ctx.lineTo(Bx.R, Bx.sy(0)); ctx.stroke();
      var qe = [], ql = [];
      for (var j = 0; j <= 200; j++) {
        var N = NMAX * j / 200;
        qe.push([Bx.sx(N), Bx.sy(Math.min(s.r * N, GMAX * 2))]);
        ql.push([Bx.sx(N), Bx.sy(Math.max(gLog(N), GMIN * 2))]);
      }
      clipPath(Bx, qe, T.figRed, 2, [6, 4]);
      clipPath(Bx, ql, T.figAccent, 2.6);
      // 꼭짓점 rK/4
      var vx = Bx.sx(s.K / 2), vy = Bx.sy(s.r * s.K / 4);
      ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.arc(vx, vy, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('rK/4 = ' + (s.r * s.K / 4).toFixed(0), vx, vy - 9);
      // K 표시
      ctx.fillStyle = T.figGreen; ctx.fillText('K', Bx.sx(s.K), Bx.sy(0) + 14);
      // 현재 점
      var g = gLog(NL);
      ctx.fillStyle = T.figAccent; ctx.beginPath(); ctx.arc(Bx.sx(Math.min(NL, NMAX)), Bx.sy(Math.max(GMIN, g)), 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
      ctx.fillText('1인당 증가율 r(1 − N/K) = ' + (s.r * (1 - NL / s.K)).toFixed(3), Bx.L + 4, Bx.B - 6);
    }

    api.onResize(draw);
    update();
  },
});
