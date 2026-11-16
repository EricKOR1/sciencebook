/* 전자기와 양자 3 단일 전자 이중 슬릿: 한 점씩 쌓여 간섭무늬가 드러남, 경로 측정 시 무늬 사라짐, 속력과 무늬 간격(정성적) */
Sims.register('double-slit-electron', {
  title: '전자를 하나씩 쏘는 이중 슬릿 — 점이 모여 무늬가 된다',
  caption: '‘쏘기 시작’을 누르고 전자가 하나씩 스크린에 점으로 찍히는 모습을 지켜보자. 처음에는 아무렇게나 흩어진 듯하지만 수천 개가 모이면 밝고 어두운 간섭무늬가 드러난다. 전자 하나의 확률 파동이 두 슬릿을 모두 지나 자기 자신과 간섭하기 때문이다. ‘어느 슬릿을 지났는지 측정’을 켜면 무늬가 사라지고 두 슬릿 뒤의 띠 두 개만 남는다. 전자가 빠를수록 물질파 파장이 짧아 무늬 간격이 촘촘해진다. 도착 위치는 확률 분포에 따라 컴퓨터로 무작위로 뽑았으며, 무늬 간격과 띠 모양은 정성적인 모형이다.',
  init: function (api) {
    var MAXN = 20000, NB = 400;
    var st = { speed: 2, measure: false, dots: [], hist: new Float64Array(64), running: false, acc: 0, fly: [] };
    var cdf = new Float64Array(NB + 1);
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.05 : 0.5; }, label: '전자 이중 슬릿 실험 장치와 스크린에 쌓이는 점' });
    var ctx = cv.ctx;
    var rN = api.readout('스크린에 도착한 전자');
    var rM = api.readout('경로 측정');
    var rS = api.readout('무늬 간격');

    // 스크린 좌표 y ∈ [−1, 1]
    function prob(y) {
      var c = 0.3, s = 0.22;
      var g1 = Math.exp(-Math.pow((y - c) / s, 2) / 2), g2 = Math.exp(-Math.pow((y + c) / s, 2) / 2);
      if (st.measure) return g1 + g2;
      var spacing = 0.28 / st.speed;                    // 빠를수록 파장↓ → 무늬 간격↓
      return g1 + g2 + 2 * Math.sqrt(g1 * g2) * Math.cos(2 * Math.PI * y / spacing);
    }
    function build() {
      cdf[0] = 0;
      for (var i = 0; i < NB; i++) cdf[i + 1] = cdf[i] + Math.max(0, prob(-1 + 2 * (i + 0.5) / NB));
      for (var j = 1; j <= NB; j++) cdf[j] /= cdf[NB];
    }
    function sample() {
      var u = Math.random(), lo = 0, hi = NB;
      while (hi - lo > 1) { var m = (lo + hi) >> 1; if (cdf[m] < u) lo = m; else hi = m; }
      var frac = (u - cdf[lo]) / Math.max(cdf[lo + 1] - cdf[lo], 1e-12);
      return -1 + 2 * (lo + frac) / NB;
    }
    function add(n) {
      for (var i = 0; i < n && st.dots.length < MAXN; i++) {
        var y = sample(); st.dots.push([Math.random(), y]);
        st.hist[Math.min(63, Math.max(0, Math.floor((y + 1) / 2 * 64)))]++;
      }
      if (st.dots.length >= MAXN) stop();
    }
    function clear() { st.dots = []; st.hist = new Float64Array(64); st.fly = []; st.acc = 0; }

    function layout() {
      var w = cv.w, h = cv.h, narrow = w < 560;
      var side = { x: 8, y: 26, w: w * (narrow ? 0.46 : 0.5), h: h - 40 };
      var scr = { x: side.x + side.w + 14, y: 26, w: w - side.x - side.w - 22, h: h - 40 };
      return { side: side, scr: scr };
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, Lo = layout(), s = Lo.side, r = Lo.scr;
      ctx.clearRect(0, 0, w, h);
      ctx.font = '12px ' + T.fontBody; ctx.textBaseline = 'alphabetic';
      // 옆에서 본 장치
      var cy = s.y + s.h / 2, gunX = s.x + 6, wallX = s.x + s.w * 0.45, scrX = s.x + s.w - 6, gap = s.h * 0.07, sw = s.h * 0.035;
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5;
      ctx.fillRect(gunX, cy - 12, 26, 24); ctx.strokeRect(gunX, cy - 12, 26, 24);
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'left'; ctx.fillText('전자총', gunX, cy - 18);
      ctx.fillStyle = T.figLine;
      ctx.fillRect(wallX - 3, s.y, 6, cy - gap - sw - s.y);
      ctx.fillRect(wallX - 3, cy - gap + sw, 6, 2 * (gap - sw));
      ctx.fillRect(wallX - 3, cy + gap + sw, 6, s.y + s.h - (cy + gap + sw));
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.fillText('이중 슬릿', wallX, s.y - 8);
      if (st.measure) {
        ctx.fillStyle = T.figAmber;
        [cy - gap, cy + gap].forEach(function (yy) { ctx.beginPath(); ctx.arc(wallX + 14, yy, 5, 0, Math.PI * 2); ctx.fill(); });
        ctx.font = '600 11px ' + T.fontBody; ctx.fillText('경로 측정 장치', wallX + 14, s.y + s.h + 12); ctx.font = '12px ' + T.fontBody;
      }
      // 확률 파동(측정하지 않을 때): 두 슬릿에서 함께 퍼져 나가는 물결
      ctx.save(); ctx.beginPath(); ctx.rect(wallX + 4, s.y, scrX - wallX - 6, s.h); ctx.clip();
      ctx.strokeStyle = T.figTeal; ctx.lineWidth = 1;
      var wl = (scrX - wallX) * 0.09 / st.speed * 2;
      [cy - gap, cy + gap].forEach(function (yy, idx) {
        if (st.measure) return;
        for (var rr = wl; rr < (scrX - wallX) * 1.15; rr += wl) {
          ctx.globalAlpha = 0.35 * (1 - rr / ((scrX - wallX) * 1.2));
          ctx.beginPath(); ctx.arc(wallX, yy, rr, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        }
      });
      ctx.globalAlpha = 1; ctx.restore();
      if (!st.measure) { ctx.fillStyle = T.figTeal; ctx.textAlign = 'center'; ctx.font = '11px ' + T.fontBody; ctx.fillText('확률 파동', (wallX + scrX) / 2, s.y + s.h + 12); ctx.font = '12px ' + T.fontBody; }
      ctx.fillStyle = T.figInk; ctx.fillRect(scrX - 2, s.y, 4, s.h);
      ctx.fillStyle = T.figMuted; ctx.fillText('스크린', scrX - 12, s.y - 8);
      // 날아가는 전자
      st.fly.forEach(function (f) {
        var x, y;
        if (f.p < 0.5) { x = gunX + 26 + (wallX - gunX - 26) * f.p * 2; y = cy; }
        else { var q = (f.p - 0.5) * 2; x = wallX + (scrX - wallX) * q; y = cy + (f.yy * s.h / 2) * q; }
        ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fillStyle = T.figAccent; ctx.fill();
      });
      // 스크린 정면
      ctx.fillStyle = T.figPaper; ctx.fillRect(r.x, r.y, r.w * 0.72, r.h);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(r.x, r.y, r.w * 0.72, r.h);
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'left'; ctx.fillText('스크린 정면', r.x, r.y - 8);
      var dotCol = T.figInk, sz = st.dots.length > 4000 ? 1.2 : 2;
      ctx.fillStyle = dotCol; ctx.beginPath();
      for (var i = 0; i < st.dots.length; i++) { var d = st.dots[i]; ctx.rect(r.x + 2 + d[0] * (r.w * 0.72 - 4), r.y + (d[1] + 1) / 2 * r.h, sz, sz); }
      ctx.fill();
      if (!st.dots.length) {
        ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.font = '12px ' + T.fontBody;
        ['전자가 도착한', '자리에 점이', '찍힌다'].forEach(function (t, i) { ctx.fillText(t, r.x + r.w * 0.36, r.y + r.h / 2 - 16 + i * 16); });
      }
      // 분포(막대)
      var hx = r.x + r.w * 0.74, hw = r.w * 0.26, mx = 0;
      for (var k = 0; k < 64; k++) mx = Math.max(mx, st.hist[k]);
      ctx.fillStyle = T.figAccent;
      if (mx > 0) for (var k2 = 0; k2 < 64; k2++) ctx.fillRect(hx, r.y + k2 / 64 * r.h, st.hist[k2] / mx * hw, r.h / 64 - 0.5);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx, r.y); ctx.lineTo(hx, r.y + r.h); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('개수', hx + hw / 2, r.y + r.h + 13);
      rN.set(st.dots.length.toLocaleString('ko-KR') + '개');
    }
    var loop = api.loop(function (dt) {
      if (dt <= 0) return;
      var n = st.dots.length, rate = n < 30 ? 4 : n < 200 ? 25 : n < 2000 ? 250 : 1500;
      st.acc += rate * dt;
      var k = Math.floor(st.acc); st.acc -= k;
      if (rate <= 25) {
        for (var i = 0; i < k; i++) st.fly.push({ p: 0, yy: sample() });
        st.fly.forEach(function (f) { f.p += dt * 1.6; });
        st.fly = st.fly.filter(function (f) {
          if (f.p >= 1) { st.dots.push([Math.random(), f.yy]); st.hist[Math.min(63, Math.max(0, Math.floor((f.yy + 1) / 2 * 64)))]++; return false; }
          return true;
        });
      } else { st.fly = []; add(k); }
      draw();
    });
    loop.pause();
    function start() { if (st.dots.length >= MAXN) clear(); st.running = true; bRun.textContent = '멈춤'; loop.play(); }
    function stop() { st.running = false; bRun.textContent = '쏘기 시작'; loop.pause(); }

    var g1 = api.group();
    var bRun = api.button('쏘기 시작', function () { if (st.running) stop(); else if (api.reduced) { add(st.dots.length < 30 ? 10 : st.dots.length < 300 ? 200 : 3000); draw(); } else start(); }, { primary: true, parent: g1 });
    api.button('한꺼번에 5000개', function () { st.fly = []; add(5000); draw(); }, { parent: g1 });
    api.button('지우기', function () { clear(); draw(); }, { parent: g1 });
    var bM = api.button('어느 슬릿을 지났는지 측정', function () {
      st.measure = !st.measure; bM.setAttribute('aria-pressed', st.measure ? 'true' : 'false');
      rM.set(st.measure ? '켜짐 — 간섭 사라짐' : '꺼짐'); build(); clear(); draw();
    }, { toggle: true });
    api.slider({ id: 'double-slit-electron-v', label: '전자의 속력', min: 1, max: 3, step: 0.25, value: st.speed,
      format: function (v) { return v <= 1.5 ? '느림' : v <= 2.25 ? '보통' : '빠름'; },
      onInput: function (v) { st.speed = v; rS.set(v <= 1.5 ? '넓음 (파장 김)' : v <= 2.25 ? '보통' : '촘촘함 (파장 짧음)'); build(); clear(); draw(); } });
    rM.set('꺼짐'); rS.set('보통');
    build();
    add(api.reduced ? 3000 : 40);      // 첫 화면: 흩어진 점 몇 개(움직임 줄이기: 쌓인 결과)
    api.onResize(draw);
    draw();
  },
});
