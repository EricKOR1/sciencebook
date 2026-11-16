/* 일반생명과학 13 보전: 종–면적 관계 S = cA^z 로 서식지 감소 뒤 남을 종의 비율 어림 */
Sims.register('u-species-area', {
  title: '서식지가 줄면 종은 얼마나 줄까 — 종–면적 관계',
  caption: '남은 서식지 면적과 지수 z 를 바꾸어 보자. 로그–로그 그래프에서 종–면적 관계는 기울기가 z 인 직선이므로, 남는 종의 비율은 (남은 면적 비율)^z 이다. 면적이 90% 줄어도(z = 0.25) 종은 약 44% 줄어드는 것으로 어림된다. 이 값은 새 평형에 이른 뒤의 장기적 어림이며, 서식지가 조각나거나 고유종이 사라진 곳에 몰려 있으면 손실은 더 크다. 오른쪽 그림의 점 100개는 처음 종을 100으로 놓은 비율이다.',
  init: function (api) {
    var s = { frac: 0.1, z: 0.25 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.2 : 0.5; }, label: '종-면적 로그 그래프와 남은 서식지, 남은 종을 나타낸 그림' });
    var ctx = cv.ctx;

    var rA = api.readout('남은 면적');
    var rS = api.readout('남는 종 (S/S₀)');
    var rLoss = api.readout('사라질 종');

    api.slider({ id: 'u-species-area-a', label: '남은 서식지 면적', min: -2, max: 0, step: 0.01, value: Math.log10(s.frac),
      format: function (v) { return fmtPct(Math.pow(10, v)); }, onInput: function (v) { s.frac = Math.pow(10, v); update(); } });
    var zSl = api.slider({ id: 'u-species-area-z', label: '지수 z', min: 0.1, max: 0.4, step: 0.01, value: s.z,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { s.z = v; update(); } });
    var g = api.group();
    api.button('z = 0.15 (본토의 연속된 땅)', function () { zSl.set(0.15); }, { parent: g });
    api.button('z = 0.35 (섬·고립된 조각)', function () { zSl.set(0.35); }, { parent: g });

    function fmtPct(f) { var p = f * 100; return (p < 10 ? p.toFixed(1) : p.toFixed(0)) + '%'; }
    function ratio(f, z) { return Math.pow(f, z); }
    function update() {
      var R = ratio(s.frac, s.z);
      rA.set(fmtPct(s.frac)); rS.set(R.toFixed(3)); rLoss.set(fmtPct(1 - R));
      draw();
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, stacked = w < 560;
      ctx.clearRect(0, 0, w, h);
      var P1 = stacked ? { x: 0, y: 0, w: w, h: h * 0.55 } : { x: 0, y: 0, w: w * 0.55, h: h };
      var P2 = stacked ? { x: 0, y: h * 0.57, w: w, h: h * 0.43 } : { x: w * 0.58, y: 0, w: w * 0.42, h: h };
      graph(T, P1); pictures(T, P2);
    }

    function graph(T, r) {
      var L = r.x + 52, R = r.x + r.w - 14, Tp = r.y + 22, B = r.y + r.h - 36;
      var sx = function (lf) { return L + (lf + 2) / 2 * (R - L); };          // log10(A/A0): −2..0
      var sy = function (lr) { return B - (lr + 1) / 1 * (B - Tp); };          // log10(S/S0): −1..0
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      ctx.textAlign = 'center';
      [[0.01, '1%'], [0.03, '3%'], [0.1, '10%'], [0.3, '30%'], [1, '100%']].forEach(function (a) {
        var X = sx(Math.log10(a[0])); ctx.beginPath(); ctx.moveTo(X, Tp); ctx.lineTo(X, B); ctx.stroke(); ctx.fillText(a[1], X, B + 14);
      });
      ctx.textAlign = 'right';
      [0.1, 0.2, 0.3, 0.5, 0.7, 1].forEach(function (v) {
        var Y = sy(Math.log10(v)); ctx.beginPath(); ctx.moveTo(L, Y); ctx.lineTo(R, Y); ctx.stroke(); ctx.fillText(v.toFixed(1), L - 5, Y + 4);
      });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('남은 면적 A/A₀ (로그 눈금)', (L + R) / 2, B + 30);
      ctx.textAlign = 'left'; ctx.fillText('남는 종 S/S₀ (로그 눈금)', r.x + 4, r.y + 12);
      // z 범위 0.15~0.35 띠
      ctx.fillStyle = T.figSoftBlue; ctx.beginPath();
      ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(-2), sy(-2 * 0.15)); ctx.lineTo(sx(-2), sy(-2 * 0.35)); ctx.closePath(); ctx.fill();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('흔한 z 범위 0.15~0.35', sx(-1.95), sy(-2 * 0.35) + 16);
      // 면적 = 종 (z = 1) 기준선
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(-1), sy(-1)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
      ctx.fillText('z = 1 이라면', sx(-0.5) + 8, sy(-0.5) + 4);
      ctx.fillText('(면적만큼 감소)', sx(-0.5) + 8, sy(-0.5) + 19);
      // 현재 z 직선
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(-2), sy(-2 * s.z)); ctx.stroke();
      // 현재 점
      var lf = Math.log10(s.frac), lr = s.z * lf, X = sx(lf), Y = sy(lr);
      ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(X, B); ctx.lineTo(X, Y); ctx.lineTo(R, Y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figViolet; ctx.beginPath(); ctx.arc(X, Y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(sx(0), sy(0), 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figAccent;
      ctx.fillText('기울기 z = ' + s.z.toFixed(2), L + 6, Tp + 14);
    }

    function pictures(T, r) {
      var R = ratio(s.frac, s.z);
      var gap = 16, cw = (r.w - gap - 16) / 2, size = Math.min(cw, r.h - 50);
      var cell = size / 10;
      var x1 = r.x + 8 + (cw - size) / 2, x2 = r.x + 8 + cw + gap + (cw - size) / 2, y = r.y + 26;
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillStyle = T.figInk;
      ctx.fillText('서식지 ' + fmtPct(s.frac), x1 + size / 2, r.y + 14);
      ctx.fillText('종 ' + Math.round(R * 100) + '/100', x2 + size / 2, r.y + 14);
      var cells = Math.max(1, Math.round(s.frac * 100));
      // 남은 숲 칸: 가운데부터 채우기(한 덩어리)
      var order = [];
      for (var i = 0; i < 100; i++) order.push(i);
      order.sort(function (a, b) {
        var da = Math.pow(a % 10 - 4.5, 2) + Math.pow(Math.floor(a / 10) - 4.5, 2);
        var db = Math.pow(b % 10 - 4.5, 2) + Math.pow(Math.floor(b / 10) - 4.5, 2);
        return da - db || a - b;
      });
      var keep = {}; order.slice(0, cells).forEach(function (k) { keep[k] = true; });
      for (var k = 0; k < 100; k++) {
        var cx = x1 + (k % 10) * cell, cy = y + Math.floor(k / 10) * cell;
        ctx.fillStyle = keep[k] ? T.figGreen : T.figSoftAmber;
        ctx.fillRect(cx + 0.5, cy + 0.5, cell - 1, cell - 1);
      }
      // 종 점
      var alive = Math.round(R * 100);
      for (var m = 0; m < 100; m++) {
        var px = x2 + (m % 10 + 0.5) * cell, py = y + (Math.floor(m / 10) + 0.5) * cell;
        ctx.beginPath(); ctx.arc(px, py, Math.max(2, cell * 0.3), 0, Math.PI * 2);
        if (m < alive) { ctx.fillStyle = T.figAccent; ctx.fill(); }
        else { ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.stroke(); }
      }
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
      ctx.fillText('초록: 남은 서식지', x1 + size / 2, y + size + 16);
      ctx.fillText('빈 점: 장기적으로 사라질 종', x2 + size / 2, y + size + 16);
    }

    api.onResize(draw);
    update();
  },
});
