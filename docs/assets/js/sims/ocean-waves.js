/* 지구시스템과학 2 해수의 운동: 심해파·전이파·천해파와 물 입자의 운동 (2D) */
Sims.register('ocean-waves', {
  title: '파도 아래 물 입자는 어떻게 움직일까 — 심해파와 천해파',
  caption: '파장과 수심을 바꾸어 보자. 수심이 파장의 1/2보다 깊으면 물 입자는 원을 그리며 깊어질수록 원이 급히 작아지고(심해파, 속력은 파장에 따라 결정), 수심이 파장의 1/20보다 얕으면 납작한 타원을 그리며 바닥에서는 앞뒤로만 움직인다(천해파, 속력은 √(gh)). 입자는 제자리에서 돌 뿐이고 파의 모양(에너지)만 앞으로 나아간다. 가로·세로 비율은 실제와 같고, 파고는 보기 좋게 정했으며(파장의 약 1/10 이하), 움직임은 늘 같은 빠르기로 재생한다. 전이 영역의 속력은 STEP 5의 관계식으로 계산한 값이다.',
  init: function (api) {
    var G = 9.8;
    var state = { L: 100, h: 60, phase: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.85 : 0.52; }, label: '해파가 지날 때 여러 깊이의 물 입자가 그리는 궤도' });
    var ctx = cv.ctx;
    var rRatio = api.readout('수심 ÷ 파장');
    var rKind = api.readout('구분');
    var rC = api.readout('파의 속력');
    var rT = api.readout('주기');

    var toLog = function (v) { return Math.log10(v); }, fromLog = function (v) { return Math.pow(10, v); };
    var sL = api.slider({ id: 'ocean-waves-L', label: '파장 L', min: 1, max: Math.log10(400), step: 0.01, value: toLog(100),
      format: function (v) { return fmtM(fromLog(v)); }, onInput: function (v) { state.L = fromLog(v); update(); } });
    var sH = api.slider({ id: 'ocean-waves-h', label: '수심 h', min: 0, max: Math.log10(300), step: 0.01, value: toLog(60),
      format: function (v) { return fmtM(fromLog(v)); }, onInput: function (v) { state.h = fromLog(v); update(); } });
    var gp = api.group();
    api.button('먼 바다', function () { sL.set(toLog(100)); sH.set(toLog(200)); }, { parent: gp });
    api.button('연안', function () { sL.set(toLog(60)); sH.set(toLog(10)); }, { parent: gp });
    api.button('해안 가까이', function () { sL.set(toLog(40)); sH.set(toLog(1.5)); }, { parent: gp });
    var playBtn = api.button(api.reduced ? '한 단계 진행' : '멈춤', function () {
      if (api.reduced) { state.phase += Math.PI / 4; draw(); return; }
      if (loop.playing) { loop.pause(); playBtn.textContent = '재생'; } else { loop.play(); playBtn.textContent = '멈춤'; }
    });

    function fmtM(v) { return v < 10 ? v.toFixed(1) + ' m' : Math.round(v) + ' m'; }
    function kind() { var r = state.h / state.L; return r > 0.5 ? 'deep' : r < 0.05 ? 'shallow' : 'mid'; }
    function speed() {
      var L = state.L, h = state.h, k = kind();
      if (k === 'deep') return Math.sqrt(G * L / (2 * Math.PI));
      if (k === 'shallow') return Math.sqrt(G * h);
      return Math.sqrt(G * L / (2 * Math.PI) * Math.tanh(2 * Math.PI * h / L));
    }
    function update() {
      var c = speed(), k = kind(), r = state.h / state.L;
      rRatio.set(r >= 1 ? r.toFixed(1) : '1/' + (1 / r).toFixed(r > 0.1 ? 1 : 0));
      rKind.set(k === 'deep' ? '심해파 (h > L/2)' : k === 'shallow' ? '천해파 (h < L/20)' : '전이파 (L/20 < h < L/2)');
      rC.set(c.toFixed(1) + ' m/s');
      rT.set((state.L / c).toFixed(1) + ' s');
      draw();
    }
    var loop = api.loop(function (dt) { state.phase += dt * 2 * Math.PI / 3; draw(); });
    if (api.reduced) loop.pause();

    // 선형 파동 이론의 물 입자 변위 배율(수평, 연직). z는 수면 아래로 음수.
    function factors(z) {
      var k = 2 * Math.PI / state.L, h = state.h;
      var e1 = Math.exp(k * z), e2 = Math.exp(-k * (z + 2 * h)), den = 1 - Math.exp(-2 * k * h);
      return [(e1 + e2) / den, (e1 - e2) / den];
    }
    function draw() {
      var T = api.tokens(), w = cv.w, hgt = cv.h, L = state.L, h = state.h, k = 2 * Math.PI / L;
      ctx.clearRect(0, 0, w, hgt);
      var A = Math.min(0.05 * L, 0.22 * h);
      var D = Math.min(h, 0.6 * L), showBed = h <= 0.6 * L;
      var top = 54, bottom = hgt - 20;
      var s = Math.min(w / (0.15 * L), (bottom - top) / (D + 2.4 * A));  // 얕을수록 확대(가로세로 비율은 같게)
      var y0 = top + 1.3 * A * s;  // 잔잔한 수면
      var Wm = w / s;  // 보이는 폭(m)
      var X = function (x) { return x * s; }, Y = function (z) { return y0 - z * s; };
      var c = speed(), kd = kind();
      // 위쪽 설명
      ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody;
      var head = kd === 'deep' ? '심해파: c = √(gL/2π) = ' : kd === 'shallow' ? '천해파: c = √(gh) = ' : '전이파: 속력이 파장과 수심 모두에 따름 ≈ ';
      ctx.fillText(head + c.toFixed(1) + ' m/s', 10, 18);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      ctx.fillText('보이는 폭: 파장의 ' + (Wm / L).toFixed(Wm / L < 1 ? 2 : 1) + '배 · 가로세로 같은 비율 · 빨간 점: 한 물 입자', 10, 36);
      ctx.textAlign = 'right'; ctx.fillStyle = T.figInk; ctx.fillText('파의 진행 →', w - 8, 18); ctx.textAlign = 'left';
      // 물
      ctx.beginPath(); ctx.moveTo(0, Y(-D) + (showBed ? 0 : 20));
      for (var px = 0; px <= w; px += 3) { var xm = px / s; ctx.lineTo(px, Y(A * Math.cos(k * xm - state.phase))); }
      ctx.lineTo(w, Y(-D) + (showBed ? 0 : 20)); ctx.closePath(); ctx.fillStyle = T.figSoftBlue; ctx.fill();
      // 수면선
      ctx.beginPath();
      for (px = 0; px <= w; px += 3) { xm = px / s; var yy = Y(A * Math.cos(k * xm - state.phase)); if (px === 0) ctx.moveTo(px, yy); else ctx.lineTo(px, yy); }
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2; ctx.stroke();
      ctx.setLineDash([3, 4]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(w, Y(0)); ctx.stroke(); ctx.setLineDash([]);
      // 바닥
      if (showBed) {
        ctx.fillStyle = T.figSoftAmber; ctx.fillRect(0, Y(-h), w, Math.max(6, bottom + 20 - Y(-h)));
        ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, Y(-h)); ctx.lineTo(w, Y(-h)); ctx.stroke();
        ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
        ctx.fillText('해저 (수심 ' + fmtM(h) + ')', w - 8, Math.min(hgt - 4, Y(-h) + 15));
      } else {
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
        ctx.fillText('↓ 해저는 더 깊다 (수심 ' + fmtM(h) + ')', w - 8, hgt - 6);
      }
      if (L / 2 <= D + 1e-6 && L / 2 < h) {
        ctx.setLineDash([6, 4]); ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, Y(-L / 2)); ctx.lineTo(w, Y(-L / 2)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figViolet; ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody;
        ctx.fillText('수심 L/2: 운동이 수면의 약 4 %', 8, Y(-L / 2) - 5);
      }
      // 물 입자
      var nz = 5, cols = w < 560 ? 4 : 6, axs = A * factors(0)[0];
      cols = Math.max(2, Math.min(cols, Math.floor(Wm / (2.3 * axs))));
      for (var j = 0; j < nz; j++) {
        var z = -D * (j / (nz - 0.4)) - 0;
        if (showBed && j === nz - 1) z = -h * 0.999;
        var f = factors(z), ax = A * f[0], az = A * f[1];
        for (var i = 0; i < cols; i++) {
          var x0 = Wm * (i + 0.5) / cols, th = k * x0 - state.phase;
          var cx = X(x0), cy = Y(z);
          // 궤도
          ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(ax * s, 0.4), Math.max(az * s, 0.01), 0, 0, Math.PI * 2);
          ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.stroke(); ctx.setLineDash([]);
          var pxp = cx - ax * s * Math.sin(th), pyp = cy - az * s * Math.cos(th);
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(pxp, pyp); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.stroke();
          ctx.beginPath(); ctx.arc(pxp, pyp, i === 1 ? 4.5 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = i === 1 ? T.figRed : T.figAccent; ctx.fill();
        }
      }
    }
    api.onResize(draw);
    update();
  },
});
