/* 일반지구과학 10 행성의 대기: 탈출 속도와 기체 분자의 열속력(v_rms) 비교로 대기 유지 판단 */
Sims.register('u-atmosphere-escape', {
  title: '어떤 기체가 남을까? — 탈출 속도와 분자의 열속력',
  caption: '천체를 고르거나 외기권 온도와 탈출 속도를 바꿔 보자. 위 그래프의 막대 끝은 각 기체의 6 v_rms(v_rms = √(3kT/m))이고, 세로선은 탈출 속도이다. 막대가 선에 못 미치면(v_esc ≳ 6 v_rms) 그 기체를 태양계 나이 동안 붙잡아 둘 수 있다고 본다. 아래 그래프는 고른 기체의 속력 분포(맥스웰 분포)로, 평균이 탈출 속도보다 훨씬 작아도 빠른 꼬리의 분자는 늘 조금씩 달아난다는 것을 보여 준다. 온도는 대기 꼭대기(외기권) 값을 쓰며, 태양풍에 의한 깎임·화학 반응 같은 열적 탈출 밖의 과정은 넣지 않았다.',
  init: function (api) {
    var k = 1.381e-23, u = 1.6605e-27;
    var bodies = [
      { n: '지구', v: 11.2, T: 1000 }, { n: '화성', v: 5.0, T: 210 }, { n: '달', v: 2.4, T: 390 },
      { n: '목성', v: 60, T: 165 }, { n: '타이탄', v: 2.64, T: 155 },
    ];
    var gases = [
      { n: 'H₂', m: 2.016 }, { n: 'He', m: 4.003 }, { n: 'H₂O', m: 18.02 },
      { n: 'N₂', m: 28.01 }, { n: 'O₂', m: 32.00 }, { n: 'CO₂', m: 44.01 },
    ];
    var st = { v: 11.2, T: 1000, gas: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.62; }, label: '기체별 6배 열속력과 탈출 속도 비교, 고른 기체의 속력 분포' });
    var ctx = cv.ctx;
    var rEsc = api.readout('탈출 속도');
    var rRms = api.readout('고른 기체 v_rms');
    var rRatio = api.readout('v_esc / v_rms');
    var rTail = api.readout('탈출 속도보다 빠른 분자 비율');

    var gB = api.group();
    var bBtns = bodies.map(function (b, i) {
      return api.button(b.n, function () { sV.set(Math.log10(b.v)); sT.set(b.T); syncB(); }, { toggle: true, pressed: i === 0, parent: gB });
    });
    var gG = api.group();
    var gBtns = gases.map(function (g, i) {
      return api.button(g.n, function () { st.gas = i; syncG(); update(); }, { toggle: true, pressed: i === 0, parent: gG });
    });
    var sT = api.slider({ id: 'u-atmosphere-escape-t', label: '외기권 온도', min: 50, max: 2000, step: 5, value: st.T,
      format: function (v) { return v + ' K'; }, onInput: function (v) { st.T = v; syncB(); update(); } });
    var sV = api.slider({ id: 'u-atmosphere-escape-v', label: '탈출 속도', min: 0, max: Math.log10(70), step: 0.005, value: Math.log10(st.v),
      format: function (v) { return fmtV(Math.pow(10, v)); }, onInput: function (v) { st.v = Math.pow(10, v); syncB(); update(); } });

    function fmtV(v) { return (v < 10 ? v.toFixed(2) : v.toFixed(1)) + ' km/s'; }
    function syncB() { bBtns.forEach(function (b, i) { var B = bodies[i]; b.setAttribute('aria-pressed', Math.abs(B.v - st.v) < 0.02 * B.v && B.T === st.T ? 'true' : 'false'); }); }
    function syncG() { gBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === st.gas ? 'true' : 'false'); }); }
    function vrms(g) { return Math.sqrt(3 * k * st.T / (g.m * u)) / 1000; }        // km/s
    function vp(g) { return Math.sqrt(2 * k * st.T / (g.m * u)) / 1000; }          // 가장 흔한 속력
    // 상보 오차 함수(상대 오차 1.2e-7)
    function erfc(x) {
      var z = Math.abs(x), t = 1 / (1 + 0.5 * z);
      var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
      return x >= 0 ? r : 2 - r;
    }
    function tail(g) { var x = st.v / vp(g); return erfc(x) + 2 * x / Math.sqrt(Math.PI) * Math.exp(-x * x); }
    function fmtFrac(f) {
      if (f > 0.01) return (f * 100).toFixed(1) + ' %';
      if (f < 1e-300 || !isFinite(Math.log10(f))) return '10⁻³⁰⁰ 보다 작다';
      var e = Math.floor(Math.log10(f)), m = f / Math.pow(10, e);
      return m.toFixed(1) + ' × 10' + sup(e);
    }
    function sup(n) { var map = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }; return String(n).split('').map(function (c) { return map[c]; }).join(''); }

    function update() {
      var g = gases[st.gas];
      rEsc.set(fmtV(st.v));
      rRms.set(g.n + ' ' + vrms(g).toFixed(2) + ' km/s');
      var ratio = st.v / vrms(g);
      rRatio.set(ratio.toFixed(1) + (ratio >= 6 ? ' (≥ 6 → 유지)' : ' (< 6 → 잃음)'));
      rTail.set(fmtFrac(tail(g)));
      draw();
    }
    function layout() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { a: { x: 0, y: 0, w: w, h: h * 0.52 }, b: { x: 0, y: h * 0.54, w: w, h: h * 0.46 } }
        : { a: { x: 0, y: 0, w: w * 0.56, h: h }, b: { x: w * 0.59, y: 0, w: w * 0.41, h: h } };
    }
    function draw() {
      var T = api.tokens(), P = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawBars(T, P.a); drawDist(T, P.b);
    }
    function drawBars(T, r) {
      var L = r.x + 54, R = r.x + r.w - 16, Tp = r.y + 40, B = r.y + r.h - 40;
      var lo = Math.log10(0.1), hi = Math.log10(200);
      var sx = function (v) { return L + (Math.log10(v) - lo) / (hi - lo) * (R - L); };
      ctx.font = '600 13px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left';
      ctx.fillText('기체별 6 v_rms 와 탈출 속도', r.x + 8, r.y + 18);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
      [0.1, 0.3, 1, 3, 10, 30, 100].forEach(function (v) {
        ctx.beginPath(); ctx.moveTo(sx(v), Tp - 6); ctx.lineTo(sx(v), B); ctx.stroke(); ctx.fillText(v, sx(v), B + 14);
      });
      ctx.font = '12px ' + T.fontBody; ctx.fillText('속력 (km/s, 로그 눈금)', (L + R) / 2, B + 30);
      var rowH = (B - Tp) / gases.length;
      gases.forEach(function (g, i) {
        var y = Tp + rowH * (i + 0.5), v6 = 6 * vrms(g), keep = v6 <= st.v, sel = i === st.gas;
        var bh = Math.min(16, rowH * 0.5);
        ctx.fillStyle = keep ? T.figSoftGreen : T.figSoftRed;
        ctx.fillRect(L, y - bh / 2, Math.min(R, sx(v6)) - L, bh);
        ctx.strokeStyle = keep ? T.figGreen : T.figRed; ctx.lineWidth = sel ? 2.5 : 1.2;
        ctx.strokeRect(L, y - bh / 2, Math.min(R, sx(v6)) - L, bh);
        // v_rms 점
        ctx.beginPath(); ctx.arc(sx(vrms(g)), y, 4, 0, Math.PI * 2); ctx.fillStyle = T.figInk; ctx.fill();
        ctx.fillStyle = sel ? T.figAccent : T.figInk; ctx.font = (sel ? '600 ' : '') + '12px ' + T.fontBody; ctx.textAlign = 'right';
        ctx.fillText(g.n, L - 8, y + 4);
        ctx.font = '600 11px ' + T.fontBody; ctx.fillStyle = keep ? T.figGreen : T.figRed;
        var tx = sx(v6) + 6, txt = keep ? '유지' : '잃음';
        ctx.textAlign = 'left';
        if (tx + 28 > R) { tx = Math.min(R, sx(v6)) - 6; ctx.textAlign = 'right'; ctx.fillStyle = keep ? T.figGreen : T.figRed; }
        if (Math.abs(tx - sx(st.v)) < 30 && ctx.textAlign === 'left') tx = Math.max(tx, sx(st.v) + 6);
        ctx.fillText(txt, tx, y + 4);
      });
      // 탈출 속도 선
      var xv = sx(st.v);
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(xv, Tp - 10); ctx.lineTo(xv, B); ctx.stroke();
      ctx.fillStyle = T.figAccent; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = xv > (L + R) * 0.6 ? 'right' : 'left';
      ctx.fillText('탈출 속도 ' + fmtV(st.v), xv + (ctx.textAlign === 'right' ? -5 : 5), Tp - 12);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('● v_rms   막대 끝 = 6 v_rms', R, r.y + 18);
    }
    function drawDist(T, r) {
      var g = gases[st.gas], vP = vp(g);
      var vmax = Math.max(st.v * 1.25, vP * 3.2);
      var L = r.x + 16, R = r.x + r.w - 12, Tp = r.y + 44, B = r.y + r.h - 40;
      var sx = function (v) { return L + v / vmax * (R - L); };
      var f = function (v) { var x = v / vP; return x * x * Math.exp(-x * x); };     // 최댓값 1/e (x=1)
      var sy = function (y) { return B - y / Math.exp(-1) * (B - Tp); };
      ctx.font = '600 13px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left';
      ctx.fillText(g.n + ' 분자의 속력 분포', r.x + 8, r.y + 18);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      // 탈출 속도보다 빠른 꼬리
      var n = 160, i, v;
      ctx.beginPath(); ctx.moveTo(sx(Math.min(st.v, vmax)), B);
      for (i = 0; i <= n; i++) { v = st.v + (vmax - st.v) * i / n; if (v <= vmax) ctx.lineTo(sx(v), sy(f(v))); }
      ctx.lineTo(sx(vmax), B); ctx.closePath(); ctx.fillStyle = T.figSoftRed; ctx.fill();
      ctx.beginPath();
      for (i = 0; i <= n; i++) { v = vmax * i / n; if (i === 0) ctx.moveTo(sx(v), sy(f(v))); else ctx.lineTo(sx(v), sy(f(v))); }
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2.2; ctx.stroke();
      // 눈금
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      var step = niceStep(vmax / 4);
      for (v = 0; v <= vmax + 1e-9; v += step) ctx.fillText(+v.toFixed(2), sx(v), B + 14);
      ctx.font = '12px ' + T.fontBody; ctx.fillText('속력 (km/s)', (L + R) / 2, B + 30);
      // v_rms, v_esc 선
      vline(vrms(g), T.figInk, 'v_rms', 0);
      vline(st.v, T.figAccent, 'v_esc', 1);
      function vline(vv, col, lab, row) {
        if (vv > vmax) return;
        var x = sx(vv);
        ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.setLineDash(row ? [] : [4, 3]);
        ctx.beginPath(); ctx.moveTo(x, Tp - 6); ctx.lineTo(x, B); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = col; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = x > (L + R) / 2 ? 'right' : 'left';
        ctx.fillText(lab, x + (x > (L + R) / 2 ? -4 : 4), Tp - 10 + row * 14);
      }
      ctx.fillStyle = T.figRed; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('색칠한 꼬리 = 탈출 가능한 분자', R, r.y + 34);
    }
    function niceStep(x) { var p = Math.pow(10, Math.floor(Math.log10(x))), m = x / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }

    api.onResize(draw);
    update();
  },
});
