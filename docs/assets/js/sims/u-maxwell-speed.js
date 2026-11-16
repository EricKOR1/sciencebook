/* 일반물리학 7 열과 열역학: 맥스웰 속력 분포 — 온도·분자 질량에 따른 모양, 세 대표 속력, 꼬리의 넓이(비율) */
Sims.register('u-maxwell-speed', {
  title: '맥스웰 속력 분포 — 온도와 분자 질량, 그리고 분포의 꼬리',
  caption: '기체를 고르고 온도를 바꿔 보자. 곡선 f(v)는 온도가 오르면 오른쪽으로 옮겨 가며 낮고 넓어지고(곡선 아래 넓이는 늘 1), 가벼운 분자일수록 같은 온도에서 훨씬 빠르다. 기준 속력 v*를 정하면 그보다 빠른 분자의 비율 ∫f dv(색칠한 꼬리 넓이)가 나온다. 질소 300 K에서 1000 m/s보다 빠른 분자는 약 1.1 %이지만, 온도를 조금만 올려도 꼬리 넓이는 빠르게 커진다. 이상 기체(분자 사이 힘 무시)로 보고 f(v)를 정확한 식으로 계산했다. 점선은 같은 기체의 300 K 곡선이다.',
  init: function (api) {
    var R = 8.314, KB = 1.381e-23, EV = 1.602e-19;
    var gases = [
      { name: 'H₂', M: 0.00202 }, { name: 'He', M: 0.00400 }, { name: 'N₂', M: 0.0280 },
      { name: 'O₂', M: 0.0320 }, { name: 'CO₂', M: 0.0440 },
    ];
    var st = { g: 2, T: 300, vs: 1000 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.48; }, label: '맥스웰 속력 분포 곡선과 세 대표 속력, 기준 속력보다 빠른 분자의 비율' });
    var ctx = cv.ctx;

    var rVp = api.readout('최빈 속력 vₚ');
    var rVm = api.readout('평균 속력 v̄');
    var rVr = api.readout('vᵣₘₛ');
    var rK = api.readout('평균 병진 운동 에너지 (3/2)kT');
    var rF = api.readout('v*보다 빠른 비율');

    var grp = api.group();
    var btns = gases.map(function (g, i) {
      return api.button(g.name, function () { st.g = i; sync(); }, { toggle: true, pressed: i === st.g, parent: grp });
    });
    api.slider({ id: 'u-maxwell-speed-T', label: '온도 T', min: 100, max: 1500, step: 10, value: st.T,
      format: function (v) { return v + ' K'; }, onInput: function (v) { st.T = v; draw(); } });
    var sV = api.slider({ id: 'u-maxwell-speed-vs', label: '기준 속력 v*', min: 0, max: 10000, step: 50, value: st.vs,
      format: function (v) { return v + ' m/s'; }, onInput: function (v) { st.vs = v; draw(); } });

    function vp(T, M) { return Math.sqrt(2 * R * T / M); }
    function f(v, a) { /* a = v_p */ var x = v / a; return 4 / Math.sqrt(Math.PI) * x * x * Math.exp(-x * x) / a; }
    function erfc(x) {
      var t = 1 / (1 + 0.3275911 * x);
      var y = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
      return y * Math.exp(-x * x);
    }
    function tail(vs, a) { var x = vs / a; return erfc(x) + 2 * x / Math.sqrt(Math.PI) * Math.exp(-x * x); }
    function nice(v) { var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
    function sync() {
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === st.g ? 'true' : 'false'); });
      draw();
    }
    function fmtPct(p) { return p >= 0.01 ? (p * 100).toFixed(1) + ' %' : p >= 1e-4 ? (p * 100).toFixed(3) + ' %' : p > 0 ? (p * 100).toExponential(1) + ' %' : '0 %'; }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, gas = gases[st.g];
      var a = vp(st.T, gas.M), a300 = vp(300, gas.M);
      var XMAX = nice(vp(1500, gas.M) * 2.6), YMAX = 0.83 / vp(100, gas.M) * 1.05;
      if (st.vs > XMAX) { /* 기준 속력이 축 밖이면 축 끝으로 */ }
      ctx.clearRect(0, 0, w, h);
      var L = 62, Rr = w - 16, Tp = 18, B = h - 44;
      var sx = function (v) { return L + v / XMAX * (Rr - L); };
      var sy = function (y) { return B - Math.min(y / YMAX, 1.08) * (B - Tp); };
      // 눈금
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      ctx.textAlign = 'center';
      var nx = w < 560 ? 4 : 5;
      for (var i = 0; i <= nx; i++) {
        var v = XMAX * i / nx;
        ctx.beginPath(); ctx.moveTo(sx(v), Tp); ctx.lineTo(sx(v), B); ctx.stroke();
        ctx.fillText(Math.round(v), sx(v), B + 14);
      }
      var yStep = nice(YMAX / 4), scale = Math.pow(10, -Math.floor(Math.log10(yStep)));
      ctx.textAlign = 'right';
      for (var yy = 0; yy <= YMAX * 1.0001; yy += yStep) {
        ctx.beginPath(); ctx.moveTo(L, sy(yy)); ctx.lineTo(Rr, sy(yy)); ctx.stroke();
        ctx.fillText((yy * scale).toFixed(yStep * scale < 1 ? 1 : 0), L - 6, sy(yy) + 4);
      }
      var expo = -Math.round(Math.log10(scale));
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('속력 v (m/s)', (L + Rr) / 2, B + 32);
      ctx.save(); ctx.translate(14, (Tp + B) / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText('f(v)  (10' + sup(expo) + ' s/m)', 0, 0); ctx.restore();

      // 꼬리 넓이
      var vs = Math.min(st.vs, XMAX), n = 240;
      ctx.beginPath(); ctx.moveTo(sx(vs), sy(0));
      for (var j = 0; j <= n; j++) { var vv = vs + (XMAX - vs) * j / n; ctx.lineTo(sx(vv), sy(f(vv, a))); }
      ctx.lineTo(sx(XMAX), sy(0)); ctx.closePath();
      ctx.fillStyle = T.figSoftAmber; ctx.fill();
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.5; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(sx(vs), sy(0)); ctx.lineTo(sx(vs), Tp + 4); ctx.stroke();
      ctx.fillStyle = T.figAmber; ctx.font = '600 12px ' + T.fontBody;
      var right = sx(vs) > (L + Rr) * 0.62;
      ctx.textAlign = right ? 'right' : 'left';
      ctx.fillText('v* = ' + st.vs + ' m/s  →  ' + fmtPct(tail(st.vs, a)), sx(vs) + (right ? -6 : 6), Tp + 14);

      // 300 K 기준 곡선
      curve(a300, T.figLine, 1.4, [5, 4]);
      // 현재 곡선
      curve(a, T.figAccent, 2.6, []);
      function curve(av, col, lw, dash) {
        ctx.beginPath();
        for (var k = 0; k <= 400; k++) { var v2 = XMAX * k / 400, y2 = sy(f(v2, av)); if (k) ctx.lineTo(sx(v2), y2); else ctx.moveTo(sx(v2), y2); }
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
      }
      // 세 대표 속력
      var marks = [
        { v: a, lab: 'vₚ', col: T.figRed },
        { v: a * Math.sqrt(4 / Math.PI), lab: 'v̄', col: T.figGreen },
        { v: a * Math.sqrt(1.5), lab: 'vᵣₘₛ', col: T.figViolet },
      ];
      var top = sy(f(a, a));
      marks.forEach(function (m, k) {
        var x = sx(m.v);
        if (x > Rr) return;
        ctx.strokeStyle = m.col; ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(x, B); ctx.lineTo(x, Math.max(Tp, top - 10 - k * 16)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = m.col; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(m.lab, x + 4, Math.max(Tp + 10, top - 12 - k * 16));
      });
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('점선 곡선: ' + gas.name + ', 300 K', Rr - 4, B - 8);

      var vm = a * Math.sqrt(4 / Math.PI), vr = a * Math.sqrt(1.5), K = 1.5 * KB * st.T;
      rVp.set(Math.round(a) + ' m/s'); rVm.set(Math.round(vm) + ' m/s'); rVr.set(Math.round(vr) + ' m/s');
      var ke = Math.floor(Math.log10(K)); rK.set((K / Math.pow(10, ke)).toFixed(2) + '×10' + sup(ke) + ' J (' + (K / EV).toFixed(3) + ' eV)');
      rF.set(fmtPct(tail(st.vs, a)));
    }
    function sup(n) { var m = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }; return String(n).split('').map(function (c) { return m[c]; }).join(''); }
    api.onResize(draw);
    draw();
  },
});
