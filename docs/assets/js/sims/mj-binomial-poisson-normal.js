/* umath-7 확률과 통계: 이항 분포를 푸아송 분포·정규 분포와 겹쳐 보며 두 근사가 언제 잘 맞는지 확인한다 */
Sims.register('mj-binomial-poisson-normal', {
  title: '이항 → 푸아송 → 정규 — 두 근사는 언제 맞을까',
  caption: '막대는 이항 분포 P(k) = C(n,k) p^k (1−p)^(n−k)이고, 점은 같은 평균 λ = np의 푸아송 분포, 선은 같은 평균·분산(np, np(1−p))의 정규 분포이다. n을 키우고 p를 줄여 보면(예: n = 1000, p = 0.003) 푸아송 점이 막대 끝에 붙고, np(1−p)가 10을 넘도록 하면 정규 곡선이 잘 맞는다. 최대 오차는 모든 k에 대한 |이항 − 근사|의 최댓값이며, 정규 근사의 확률은 k ± 0.5 구간의 넓이(연속 보정)로 계산했다.',
  init: function (api) {
    var st = { n: 50, p: 0.1, pois: true, norm: true };
    var LF = [0];
    for (var i = 1; i <= 1000; i++) LF[i] = LF[i - 1] + Math.log(i);

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.5; }, label: '이항 분포 막대그래프와 푸아송·정규 근사' });
    var ctx = cv.ctx;
    var rMean = api.readout('평균 np = ');
    var rVar = api.readout('분산 np(1−p) = ');
    var rPo = api.readout('푸아송 최대 오차 ');
    var rNo = api.readout('정규 최대 오차 ');

    api.slider({ id: 'mj-binomial-poisson-normal-n', label: '시행 수 n', min: 0, max: 3, step: 0.01, value: Math.log10(50),
      format: function (v) { return String(Math.round(Math.pow(10, v))); },
      onInput: function (v) { st.n = Math.max(1, Math.round(Math.pow(10, v))); draw(); } });
    api.slider({ id: 'mj-binomial-poisson-normal-p', label: '성공 확률 p', min: -3, max: Math.log10(0.5), step: 0.005, value: -1,
      format: function (v) { var p = Math.pow(10, v); return p < 0.01 ? p.toFixed(4) : p < 0.1 ? p.toFixed(3) : p.toFixed(2); },
      onInput: function (v) { st.p = Math.min(0.5, Math.pow(10, v)); draw(); } });
    var g = api.group();
    var bP = api.button('푸아송 겹쳐 보기', function (b) { st.pois = !st.pois; b.setAttribute('aria-pressed', st.pois); draw(); }, { toggle: true, pressed: true, parent: g });
    var bN = api.button('정규 겹쳐 보기', function (b) { st.norm = !st.norm; b.setAttribute('aria-pressed', st.norm); draw(); }, { toggle: true, pressed: true, parent: g });

    function binom(k) { var n = st.n, p = st.p; return Math.exp(LF[n] - LF[k] - LF[n - k] + k * Math.log(p) + (n - k) * Math.log(1 - p)); }
    function pois(k, lam) { return Math.exp(k * Math.log(lam) - lam - LF[k]); }
    function erf(x) {   // Abramowitz–Stegun 7.1.26 (오차 1.5e-7)
      var s = x < 0 ? -1 : 1; x = Math.abs(x);
      var t = 1 / (1 + 0.3275911 * x);
      var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
      return s * y;
    }
    function Phi(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, n = st.n, p = st.p;
      var mu = n * p, v = n * p * (1 - p), sd = Math.sqrt(v);
      ctx.clearRect(0, 0, w, h);
      // 오차 계산(모든 k)
      var eP = 0, eN = 0, B = [], ymax = 0;
      for (var k = 0; k <= n; k++) {
        var b = binom(k); B[k] = b;
        eP = Math.max(eP, Math.abs(b - pois(k, mu)));
        eN = Math.max(eN, Math.abs(b - (Phi((k + 0.5 - mu) / sd) - Phi((k - 0.5 - mu) / sd))));
        ymax = Math.max(ymax, b);
      }
      // 보여 줄 k 범위
      var k0 = Math.max(0, Math.floor(mu - 5 * sd - 1)), k1 = Math.min(n, Math.ceil(mu + 5 * sd + 1));
      if (k1 - k0 < 8) { k1 = Math.min(n, k0 + 8); k0 = Math.max(0, k1 - 8); }
      var kpad = Math.max(k1, k0 + 8);
      for (k = k0; k <= kpad; k++) ymax = Math.max(ymax, pois(k, mu));
      ymax = Math.min(1, ymax * 1.15);
      var L = 56, R = 14, Tp = 16, Bt = 44, pw = w - L - R, ph = h - Tp - Bt;
      var X = function (x) { return L + (x - (k0 - 0.6)) / (kpad - k0 + 1.2) * pw; };
      var Y = function (y) { return Tp + ph - y / ymax * ph; };
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      // y 눈금
      var step = niceStep(ymax / 5);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (var yv = 0; yv <= ymax + 1e-9; yv += step) {
        ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(L, Y(yv)); ctx.lineTo(L + pw, Y(yv)); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillText(yv.toFixed(step < 0.01 ? 3 : 2), L - 6, Y(yv));
      }
      // x 눈금
      var xs = niceStep((kpad - k0) / 8); if (xs < 1) xs = 1;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (var xv = Math.ceil(k0 / xs) * xs; xv <= kpad; xv += xs) ctx.fillText(String(xv), X(xv), Tp + ph + 6);
      ctx.fillStyle = T.figInk; ctx.font = '13px ' + T.fontBody;
      ctx.fillText('성공 횟수 k', L + pw / 2, Tp + ph + 24);
      ctx.save(); ctx.translate(14, Tp + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'middle'; ctx.fillText('확률 P(k)', 0, 0); ctx.restore();
      // 막대
      var bw = Math.max(1, (X(1) - X(0)) * 0.8);
      ctx.fillStyle = T.figSoftBlue; ctx.strokeStyle = T.figBlue;
      for (k = k0; k <= k1; k++) {
        var x = X(k) - bw / 2, y = Y(B[k]);
        ctx.fillRect(x, y, bw, Y(0) - y); if (bw > 3) ctx.strokeRect(x, y, bw, Y(0) - y);
      }
      // 정규 곡선(밀도)
      if (st.norm && sd > 0) {
        ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.2; ctx.beginPath();
        for (var i = 0; i <= 300; i++) {
          var xx = k0 - 0.6 + i / 300 * (kpad - k0 + 1.2), yy = Math.exp(-(xx - mu) * (xx - mu) / (2 * v)) / (sd * Math.sqrt(2 * Math.PI));
          var py = Y(Math.min(yy, ymax * 1.05));
          if (i) ctx.lineTo(X(xx), py); else ctx.moveTo(X(xx), py);
        }
        ctx.stroke();
      }
      // 푸아송 점
      if (st.pois) {
        ctx.fillStyle = T.figGreen; ctx.strokeStyle = T.figPanel; ctx.lineWidth = 1;
        var r = Math.max(2, Math.min(5, bw * 0.45));
        for (k = k0; k <= kpad; k++) { var pv = pois(k, mu); ctx.beginPath(); ctx.arc(X(k), Y(Math.min(pv, ymax)), r, 0, 7); ctx.fill(); ctx.stroke(); }
      }
      // 범례
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      var lx = L + pw - 150, ly = Tp + 10;
      ctx.fillStyle = T.figSoftBlue; ctx.strokeStyle = T.figBlue; ctx.fillRect(lx, ly - 6, 14, 12); ctx.strokeRect(lx, ly - 6, 14, 12);
      ctx.fillStyle = T.figInk; ctx.fillText('이항 분포', lx + 20, ly);
      if (st.pois) { ctx.fillStyle = T.figGreen; ctx.beginPath(); ctx.arc(lx + 7, ly + 18, 4, 0, 7); ctx.fill(); ctx.fillStyle = T.figInk; ctx.fillText('푸아송 (λ = np)', lx + 20, ly + 18); }
      if (st.norm) { ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(lx, ly + 36); ctx.lineTo(lx + 14, ly + 36); ctx.stroke(); ctx.fillStyle = T.figInk; ctx.fillText('정규 (μ, σ²)', lx + 20, ly + 36); }
      rMean.set(fmt(mu)); rVar.set(fmt(v));
      rPo.set(eP.toExponential(1)); rNo.set(eN.toExponential(1));
    }
    function fmt(x) { return x >= 100 ? x.toFixed(1) : x >= 1 ? x.toFixed(2) : x.toFixed(3); }
    function niceStep(x) {
      var e = Math.pow(10, Math.floor(Math.log10(x))), f = x / e;
      return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * e;
    }
    api.onResize(draw);
    draw();
  },
});
