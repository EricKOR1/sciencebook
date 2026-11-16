/* 일반화학 2 기체: 맥스웰–볼츠만 속력 분포 — 온도·몰질량에 따른 분포 모양, 세 가지 대표 속력, 빠른 분자의 비율 */
Sims.register('u-maxwell-boltzmann', {
  title: '맥스웰–볼츠만 속력 분포 — 온도와 몰질량이 바꾸는 것',
  caption: '기체를 고르고 온도를 바꿔 보자. 온도가 오르거나 몰질량이 작아지면 꼭대기가 빠른 쪽으로 옮겨 가며 낮고 넓게 퍼지지만, 곡선 아래 넓이는 언제나 1이다. 세 대표 속력의 비 u_mp : ū : u_rms는 늘 1 : 1.128 : 1.225이다. 기준 속력 u*를 정하면 그보다 빠른 분자의 비율(색칠한 꼬리의 넓이)을 보여 준다. 꼬리의 넓이는 온도가 조금만 올라도 크게 늘어난다. 이상 기체를 가정했고, 점선은 비교용 25 °C의 질소이다.',
  init: function (api) {
    var R = 8.314, UMAX = 4000, FMAX = 4.6e-3;
    var GASES = [
      { name: 'H₂', M: 2.016 }, { name: 'He', M: 4.003 }, { name: 'N₂', M: 28.02 },
      { name: 'O₂', M: 32.00 }, { name: 'CO₂', M: 44.01 },
    ];
    var st = { g: 2, T: 298, us: 1000 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.5; }, label: '분자 속력 분포 곡선과 세 가지 대표 속력' });
    var ctx = cv.ctx;
    var rMp = api.readout('최빈 속력 u_mp');
    var rAv = api.readout('평균 속력 ū');
    var rRms = api.readout('u_rms');
    var rE = api.readout('평균 운동 에너지 (1 mol)');
    var rF = api.readout('u*보다 빠른 분자');

    var gg = api.group();
    var gb = GASES.map(function (g, i) {
      return api.button(g.name + ' (' + g.M + ')', function () { st.g = i; gb.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); update(); }, { toggle: true, pressed: i === st.g, parent: gg });
    });
    api.slider({ id: 'u-maxwell-boltzmann-T', label: '온도 T', min: 100, max: 2000, step: 1, value: st.T,
      format: function (v) { return v + ' K (' + (v - 273.15).toFixed(0) + ' °C)'; }, onInput: function (v) { st.T = v; update(); } });
    api.slider({ id: 'u-maxwell-boltzmann-us', label: '기준 속력 u*', min: 0, max: 4000, step: 50, value: st.us,
      format: function (v) { return v + ' m/s'; }, onInput: function (v) { st.us = v; update(); } });

    function f(u, M, T) { var a = M / (2 * R * T); return 4 * Math.PI * Math.pow(a / Math.PI, 1.5) * u * u * Math.exp(-a * u * u); }
    function erfc(x) { // Abramowitz–Stegun 7.1.26
      var t = 1 / (1 + 0.3275911 * x);
      return t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-x * x);
    }
    function tail(us, ump) { var x = us / ump; return erfc(x) + 2 * x / Math.sqrt(Math.PI) * Math.exp(-x * x); }
    function speeds(M, T) { return { mp: Math.sqrt(2 * R * T / M), av: Math.sqrt(8 * R * T / (Math.PI * M)), rms: Math.sqrt(3 * R * T / M) }; }
    function pct(p) { if (p >= 0.0995) return (p * 100).toFixed(1) + ' %'; if (p >= 1e-4) return (p * 100).toFixed(2) + ' %'; if (p < 1e-12) return '거의 0'; return (p * 100).toExponential(1).replace('e', '×10^') + ' %'; }

    function update() {
      var g = GASES[st.g], M = g.M / 1000, s = speeds(M, st.T);
      rMp.set(s.mp.toFixed(0) + ' m/s'); rAv.set(s.av.toFixed(0) + ' m/s'); rRms.set(s.rms.toFixed(0) + ' m/s');
      rE.set((1.5 * R * st.T / 1000).toFixed(2) + ' kJ');
      rF.set(pct(tail(st.us, s.mp)));
      draw();
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var L = narrow ? 46 : 62, Rr = w - 14, Tp = narrow ? 64 : 30, B = h - 44;
      var sx = function (u) { return L + (u / UMAX) * (Rr - L); };
      var sy = function (y) { return B - (y / FMAX) * (B - Tp); };
      // 눈금
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'right';
      for (var k = 0; k <= 4; k++) { var yv = k * 1e-3; ctx.beginPath(); ctx.moveTo(L, sy(yv)); ctx.lineTo(Rr, sy(yv)); ctx.stroke(); ctx.fillText(String(k), L - 6, sy(yv) + 4); }
      ctx.textAlign = 'center';
      for (var u = 0; u <= UMAX; u += 500) { if (narrow && u % 1000) continue; ctx.fillText(String(u), sx(u), B + 15); }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('분자의 속력 u (m/s)', (L + Rr) / 2, B + 32);
      ctx.save(); ctx.translate(13, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('f(u)  (10⁻³ s/m)', 0, 0); ctx.restore();
      ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(L, Tp - 6); ctx.lineTo(L, B); ctx.lineTo(Rr, B); ctx.stroke();

      var g = GASES[st.g], M = g.M / 1000, s = speeds(M, st.T), n = 400;
      // 꼬리 넓이
      ctx.beginPath(); ctx.moveTo(sx(st.us), sy(0));
      for (var i = 0; i <= n; i++) { var uu = st.us + (UMAX - st.us) * i / n; ctx.lineTo(sx(uu), sy(Math.min(f(uu, M, st.T), FMAX))); }
      ctx.lineTo(sx(UMAX), sy(0)); ctx.closePath(); ctx.fillStyle = T.figSoftAmber; ctx.fill();
      // 기준 곡선(N2, 298.15 K)
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.5; ctx.beginPath();
      for (i = 0; i <= n; i++) { uu = UMAX * i / n; var y0 = sy(Math.min(f(uu, 0.02802, 298.15), FMAX)); if (i) ctx.lineTo(sx(uu), y0); else ctx.moveTo(sx(uu), y0); }
      ctx.stroke(); ctx.setLineDash([]);
      // 현재 곡선
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.6; ctx.beginPath();
      for (i = 0; i <= n; i++) { uu = UMAX * i / n; var yy = sy(Math.min(f(uu, M, st.T), FMAX)); if (i) ctx.lineTo(sx(uu), yy); else ctx.moveTo(sx(uu), yy); }
      ctx.stroke();
      // 기준 속력 선
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx(st.us), Tp); ctx.lineTo(sx(st.us), B); ctx.stroke();
      ctx.fillStyle = T.figAmber; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = sx(st.us) > Rr - 60 ? 'right' : 'left';
      ctx.fillText('u*', sx(st.us) + (ctx.textAlign === 'left' ? 4 : -4), Tp + 10);
      // 세 대표 속력
      var fm = f(s.mp, M, st.T), top = sy(Math.min(fm, FMAX));
      var marks = [{ u: s.mp, c: T.figBlue, t: 'u_mp' }, { u: s.av, c: T.figGreen, t: 'ū' }, { u: s.rms, c: T.figRed, t: 'u_rms' }];
      marks.forEach(function (m, j) {
        if (m.u > UMAX) return;
        var yt = sy(Math.min(f(m.u, M, st.T), FMAX));
        ctx.strokeStyle = m.c; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(sx(m.u), B); ctx.lineTo(sx(m.u), yt); ctx.stroke();
        ctx.fillStyle = m.c; ctx.beginPath(); ctx.arc(sx(m.u), yt, 3.5, 0, Math.PI * 2); ctx.fill();
        // 라벨은 높이를 엇갈려 겹치지 않게
        var ly = Math.max(Tp + 12, top - 10 - (2 - j) * 15);
        ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(m.t, sx(m.u) + 5 + j * 2, ly);
      });
      // 범례
      var lx = narrow ? L + 6 : Rr - 230, ly0 = narrow ? 14 : Tp + 4;
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(lx, ly0 + 6); ctx.lineTo(lx + 22, ly0 + 6); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.fillText(g.name + ', ' + st.T + ' K', lx + 28, ly0 + 10);
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx, ly0 + 24); ctx.lineTo(lx + 22, ly0 + 24); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.fillText('비교: N₂, 25 °C', lx + 28, ly0 + 28);
      ctx.fillStyle = T.figSoftAmber; ctx.fillRect(lx, ly0 + 36, 22, 10);
      ctx.fillStyle = T.figMuted; ctx.fillText('u*보다 빠른 분자의 비율 = 넓이', lx + 28, ly0 + 46);
      if (fm > FMAX) { ctx.fillStyle = T.figRed; ctx.textAlign = 'center'; ctx.fillText('꼭대기가 그래프 위로 넘침', sx(s.mp), Tp + 26); }
    }
    api.onResize(draw);
    update();
  },
});
