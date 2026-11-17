/* 일반생명과학 8 진화의 요인: 대립유전자 빈도의 변화 — 유전적 부동(집단 크기), 자연 선택(aa의 선택 계수), 유전자 흐름(이주율)을 함께 조절해 여러 집단을 100세대 동안 추적 */
Sims.register('u-allele-frequency', {
  title: '대립유전자 빈도는 어떻게 변하는가 — 부동·선택·이주',
  caption: '똑같이 a의 빈도 q = 0.5로 출발한 집단 12개를 100세대 동안 따라가 본다. 집단 크기 N을 줄이면 집단마다 우연히 다른 길을 가다가 a가 고정(q = 1)되거나 소실(q = 0)되고, 이형 접합도가 기댓값 H₀(1 − 1/2N)ᵗ처럼 줄어든다. aa의 선택 계수 s를 키우면 모든 집단이 함께 q가 줄어드는 쪽으로 움직이지만, q가 작아질수록 a가 대부분 이형 접합자 속에 숨어 감소가 느려진다(예제 4·5). 이주율 m을 올리면 q = 0.5인 본토에서 개체가 들어와 집단들이 서로 가까워진다. 매 세대 선택 → 이주 → 생식 세포 2N개의 무작위 추출(부동) 순서로 계산하며, A는 a에 대해 완전 우성(AA와 Aa의 적합도 1)이고 세대가 겹치지 않는다고 가정했다. 굵은 점선은 부동이 없을 때의 예측이다.',
  init: function (api) {
    var GEN = 100, REPS = 12, Q0 = 0.5, QM = 0.5;
    var NS = [10, 20, 50, 100, 200, 500, 1000];
    var st = { Ni: 2, s: 0, m: 0, runs: [], det: [], shown: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.56; }, label: '세대에 따른 대립유전자 a의 빈도와 이형 접합도 그래프' });
    var ctx = cv.ctx;

    var rFix = api.readout('a 고정 · a 소실');
    var rQ = api.readout('100세대 뒤 평균 q');
    var rH = api.readout('평균 이형 접합도 H');
    var rHe = api.readout('부동만의 기댓값 H₀(1 − 1/2N)ᵗ');

    api.slider({ id: 'u-allele-frequency-n', label: '집단 크기 N', min: 0, max: NS.length - 1, step: 1, value: st.Ni,
      format: function (v) { return NS[v] + '개체'; }, onInput: function (v) { st.Ni = v; run(); } });
    api.slider({ id: 'u-allele-frequency-s', label: 'aa의 선택 계수 s', min: 0, max: 1, step: 0.05, value: st.s,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.s = v; run(); } });
    api.slider({ id: 'u-allele-frequency-m', label: '이주율 m', min: 0, max: 0.1, step: 0.01, value: st.m,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.m = v; run(); } });
    api.button('다시 실행(새 우연)', function () { run(); }, { primary: true });

    var loop = api.loop(function (dt) {
      st.shown = Math.min(GEN, st.shown + dt * 45);
      draw();
      if (st.shown >= GEN) loop.pause();
    });
    loop.pause();

    function binom(n, p) {
      if (p <= 0) return 0; if (p >= 1) return n;
      var k = 0; for (var i = 0; i < n; i++) if (Math.random() < p) k++; return k;
    }
    function step(q) {
      var p = 1 - q, s = st.s;
      var wbar = 1 - s * q * q;
      var qs = (p * q + q * q * (1 - s)) / wbar;
      return (1 - st.m) * qs + st.m * QM;
    }
    function run() {
      var N = NS[st.Ni], twoN = 2 * N;
      st.runs = [];
      for (var r = 0; r < REPS; r++) {
        var q = Q0, arr = [q];
        for (var g = 1; g <= GEN; g++) { q = binom(twoN, step(q)) / twoN; arr.push(q); }
        st.runs.push(arr);
      }
      st.det = [Q0]; var qd = Q0;
      for (var g2 = 1; g2 <= GEN; g2++) { qd = step(qd); st.det.push(qd); }
      readouts();
      if (api.reduced) { st.shown = GEN; draw(); }
      else { st.shown = 0; draw(); loop.play(); }
    }
    function Hmean(g) { var h = 0; st.runs.forEach(function (a) { h += 2 * a[g] * (1 - a[g]); }); return h / REPS; }
    function readouts() {
      var fix = 0, lost = 0, sum = 0;
      st.runs.forEach(function (a) { var q = a[GEN]; if (q >= 1) fix++; else if (q <= 0) lost++; sum += q; });
      rFix.set(fix + ' · ' + lost + ' (집단 ' + REPS + '개 중)');
      rQ.set((sum / REPS).toFixed(2) + ' (예측 ' + st.det[GEN].toFixed(2) + ')');
      rH.set(Hmean(0).toFixed(2) + ' → ' + Hmean(GEN).toFixed(2));
      var N = NS[st.Ni];
      rHe.set(st.s === 0 && st.m === 0 ? (0.5 * Math.pow(1 - 1 / (2 * N), GEN)).toFixed(2) : '선택·이주가 있으면 해당 없음');
    }
    var COLS = ['figBlue', 'figTeal', 'figViolet', 'figAmber', 'figGreen', 'figRed'];
    function layout() {
      var w = cv.w, h = cv.h;
      return { a: { x: 0, y: 0, w: w, h: h * 0.64 }, b: { x: 0, y: h * 0.66, w: w, h: h * 0.34 } };
    }
    function axes(T, r, ymax, yt, ylab, fmt) {
      var L = r.x + 56, R = r.x + r.w - 14, Tp = r.y + 14, B = r.y + r.h - 34;
      var sx = function (g) { return L + g / GEN * (R - L); }, sy = function (v) { return B - v / ymax * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      yt.forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(fmt(v), L - 6, sy(v) + 4); });
      ctx.textAlign = 'center';
      for (var g = 0; g <= GEN; g += 20) ctx.fillText(g, sx(g), B + 14);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.fillText('세대', (L + R) / 2, B + 29);
      ctx.save(); ctx.translate(r.x + 13, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(ylab, 0, 0); ctx.restore();
      return { sx: sx, sy: sy, L: L, R: R, Tp: Tp, B: B };
    }
    function draw() {
      var T = api.tokens(), P = layout(), n = Math.floor(st.shown);
      ctx.clearRect(0, 0, cv.w, cv.h);
      var A = axes(T, P.a, 1, [0, 0.25, 0.5, 0.75, 1], 'a의 빈도 q', function (v) { return v.toFixed(2); });
      ctx.lineWidth = 1.6; ctx.globalAlpha = 0.85;
      st.runs.forEach(function (arr, i) {
        ctx.strokeStyle = T[COLS[i % COLS.length]]; ctx.beginPath();
        for (var g = 0; g <= n; g++) { var x = A.sx(g), y = A.sy(arr[g]); if (g) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 3; ctx.setLineDash([7, 5]); ctx.beginPath();
      for (var g = 0; g <= GEN; g++) { var x = A.sx(g), y = A.sy(st.det[g]); if (g) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillStyle = T.figMuted;
      ctx.fillText('N = ' + NS[st.Ni] + ', s = ' + st.s.toFixed(2) + ', m = ' + st.m.toFixed(2) + ' · 점선: 부동 없는 예측', A.R - 4, A.Tp + 14);
      // 이형 접합도
      var Bx = axes(T, P.b, 0.6, [0, 0.25, 0.5], '이형 접합도 H', function (v) { return v.toFixed(2); });
      if (st.s === 0 && st.m === 0) {
        var N = NS[st.Ni];
        ctx.strokeStyle = T.figMuted; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath();
        for (var g2 = 0; g2 <= GEN; g2++) { var y2 = Bx.sy(0.5 * Math.pow(1 - 1 / (2 * N), g2)); if (g2) ctx.lineTo(Bx.sx(g2), y2); else ctx.moveTo(Bx.sx(g2), y2); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.4; ctx.beginPath();
      for (var g3 = 0; g3 <= n; g3++) { var y3 = Bx.sy(Hmean(g3)); if (g3) ctx.lineTo(Bx.sx(g3), y3); else ctx.moveTo(Bx.sx(g3), y3); }
      ctx.stroke();
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillStyle = T.figAccent;
      ctx.fillText('12개 집단의 평균 H' + (st.s === 0 && st.m === 0 ? ' (점선: 기댓값)' : ''), Bx.R - 4, Bx.Tp + 10);
    }
    api.onResize(draw);
    run();
  },
});
