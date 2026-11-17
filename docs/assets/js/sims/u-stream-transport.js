/* 일반지구과학 4 지표를 바꾸는 작용: 유속과 입자 크기에 따른 침식·운반·퇴적(휼스트룀 도표) */
Sims.register('u-stream-transport', {
  title: '물살이 빨라지면 무엇이 움직일까 — 유속과 입자 크기',
  caption: '유속을 바꾸어 보자. 그래프의 가로선이 지금 유속이고, 선 위 입자 크기마다 위쪽 곡선(침식 유속)을 넘으면 바닥에서 떼어 내고, 두 곡선 사이면 이미 떠 있는 입자를 계속 나르며, 아래 곡선(퇴적 유속)보다 느리면 가라앉는다. 모래(약 0.1~0.5 mm)가 가장 느린 물살에도 깎이고, 점토는 점착력 때문에 깎기 어렵지만 한번 뜨면 거의 멈춘 물에서야 가라앉는다. 곡선은 바닥에서 약 1 m 위의 평균 유속에 대한 휼스트룀 도표를 어림한 것으로, 실제 경계는 입자 모양·밀도·수심·다짐 정도에 따라 넓은 띠를 이룬다.',
  init: function (api) {
    // (지름 mm, 유속 cm/s) — 휼스트룀 도표의 대략값
    var ERO = [[0.001, 160], [0.004, 95], [0.01, 60], [0.05, 30], [0.2, 20], [0.5, 22], [1, 30], [2, 42], [10, 105], [100, 330], [1000, 1000]];
    var DEP = [[0.004, 0.1], [0.01, 0.13], [0.05, 0.5], [0.1, 1.2], [0.5, 5], [1, 10], [10, 70], [100, 250], [1000, 800]];
    var GRAINS = [
      { n: '점토', d: 0.002, r: 1.6 }, { n: '실트', d: 0.03, r: 2.4 }, { n: '고운 모래', d: 0.15, r: 3.4 },
      { n: '굵은 모래', d: 1, r: 4.6 }, { n: '잔자갈', d: 8, r: 6.5 }, { n: '자갈', d: 60, r: 9.5 },
    ];
    var state = { v: 20, pick: 2, t: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.35 : 0.56; }, label: '휼스트룀 도표와 하천 바닥의 입자 모습' });
    var ctx = cv.ctx;
    var rV = api.readout('유속');
    var rG = api.readout('고른 입자');
    var rE = api.readout('침식 시작 유속');
    var rD = api.readout('퇴적 유속');
    var rS = api.readout('지금 상태');

    api.slider({ id: 'u-stream-transport-v', label: '유속', min: -1, max: 3, step: 0.01, value: Math.log10(20),
      format: function (x) { return fmtV(Math.pow(10, x)); }, onInput: function (x) { state.v = Math.pow(10, x); update(); } });
    api.slider({ id: 'u-stream-transport-g', label: '입자 고르기', min: 0, max: GRAINS.length - 1, step: 1, value: 2,
      format: function (i) { return GRAINS[i].n + ' (' + fmtD(GRAINS[i].d) + ')'; }, onInput: function (i) { state.pick = i; update(); } });
    var g = api.group();
    [['잔잔한 하구', 0.5], ['평상시 하천', 30], ['홍수', 300]].forEach(function (p) {
      api.button(p[0], function () { setV(p[1]); }, { parent: g });
    });
    function setV(v) { var s = document.getElementById('u-stream-transport-v'); s.value = Math.log10(v); s.dispatchEvent(new Event('input')); }

    function interp(tab, d) {
      var x = Math.log10(d);
      if (d <= tab[0][0]) { var a0 = tab[0], b0 = tab[1]; return Math.pow(10, Math.log10(a0[1]) + (Math.log10(b0[1]) - Math.log10(a0[1])) * (x - Math.log10(a0[0])) / (Math.log10(b0[0]) - Math.log10(a0[0]))); }
      for (var i = 0; i < tab.length - 1; i++) {
        var a = tab[i], b = tab[i + 1];
        if (d <= b[0]) { var u = (x - Math.log10(a[0])) / (Math.log10(b[0]) - Math.log10(a[0])); return Math.pow(10, Math.log10(a[1]) + u * (Math.log10(b[1]) - Math.log10(a[1]))); }
      }
      return tab[tab.length - 1][1];
    }
    function ero(d) { return interp(ERO, d); }
    function dep(d) { return d < 0.004 ? 0 : interp(DEP, d); }
    function status(d, v) { return v >= ero(d) ? 'ero' : v >= dep(d) ? 'tr' : 'dep'; }
    function fmtV(v) { return v < 1 ? v.toFixed(2) + ' cm/s' : v < 10 ? v.toFixed(1) + ' cm/s' : Math.round(v) + ' cm/s'; }
    function fmtD(d) { return d < 0.01 ? d.toFixed(3) + ' mm' : d < 1 ? (+d.toPrecision(2)) + ' mm' : d + ' mm'; }
    var NAME = { ero: '침식(바닥에서 떼어 냄)', tr: '운반(떠 있으면 계속 나름)', dep: '퇴적(가라앉아 쌓임)' };

    function layout() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { G: { x: 0, y: 0, w: w, h: h * 0.62 }, C: { x: 0, y: h * 0.65, w: w, h: h * 0.35 } }
        : { G: { x: 0, y: 0, w: w * 0.57, h: h }, C: { x: w * 0.59, y: 0, w: w * 0.41, h: h } };
    }
    function draw() {
      var T = api.tokens(), Lay = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      graph(T, Lay.G); channel(T, Lay.C);
    }
    function graph(T, r) {
      var L = r.x + 52, R = r.x + r.w - 12, Tp = r.y + 14, B = r.y + r.h - 40;
      var sx = function (d) { return L + (Math.log10(d) + 3) / 6 * (R - L); };
      var sy = function (v) { return B - (Math.log10(v) + 1) / 4 * (B - Tp); };
      // 영역 채우기
      var N = 120, i, d;
      ctx.beginPath(); ctx.moveTo(sx(0.001), Tp);
      for (i = 0; i <= N; i++) { d = Math.pow(10, -3 + 6 * i / N); ctx.lineTo(sx(d), Math.max(Tp, sy(ero(d)))); }
      ctx.lineTo(R, Tp); ctx.closePath(); ctx.fillStyle = T.figSoftRed; ctx.fill();
      ctx.beginPath(); ctx.moveTo(sx(0.001), B);
      for (i = 0; i <= N; i++) { d = Math.pow(10, -3 + 6 * i / N); var dv = dep(d); ctx.lineTo(sx(d), dv <= 0.1 ? B : Math.max(Tp, sy(dv))); }
      ctx.lineTo(R, B); ctx.closePath(); ctx.fillStyle = T.figSoftAmber; ctx.fill();
      // 격자·축
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      ctx.textAlign = 'right';
      [0.1, 1, 10, 100, 1000].forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(v, L - 5, sy(v) + 4); });
      ctx.textAlign = 'center';
      [0.001, 0.01, 0.1, 1, 10, 100, 1000].forEach(function (dd) { ctx.beginPath(); ctx.moveTo(sx(dd), Tp); ctx.lineTo(sx(dd), B); ctx.stroke(); ctx.fillText(dd, sx(dd), B + 13); });
      // 입자 이름 띠
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      [[0.001, 1 / 256, '점토'], [1 / 256, 1 / 16, '실트'], [1 / 16, 2, '모래'], [2, 1000, '자갈']].forEach(function (b) {
        ctx.fillText(b[2], (sx(b[0]) + sx(b[1])) / 2, B + 26);
        ctx.beginPath(); ctx.moveTo(sx(b[1]), B + 17); ctx.lineTo(sx(b[1]), B + 29); ctx.stroke();
      });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('입자 지름 (mm, 로그 눈금)', (L + R) / 2, B + 39);
      ctx.save(); ctx.translate(r.x + 13, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('유속 (cm/s, 로그 눈금)', 0, 0); ctx.restore();
      // 곡선
      ctx.lineWidth = 2.4; ctx.strokeStyle = T.figRed; ctx.beginPath();
      for (i = 0; i <= N; i++) { d = Math.pow(10, -3 + 6 * i / N); var y = sy(ero(d)); if (i === 0) ctx.moveTo(sx(d), y); else ctx.lineTo(sx(d), y); }
      ctx.stroke();
      ctx.strokeStyle = T.figAmber; ctx.beginPath(); var started = false;
      for (i = 0; i <= N; i++) { d = Math.pow(10, -3 + 6 * i / N); var v2 = dep(d); if (v2 < 0.1) continue; var y2 = sy(v2); if (!started) { ctx.moveTo(sx(d), y2); started = true; } else ctx.lineTo(sx(d), y2); }
      ctx.stroke();
      // 영역 글자
      ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillStyle = T.figRed; ctx.fillText('침식', sx(0.08), sy(300));
      ctx.fillStyle = T.figInk; ctx.fillText('운반', sx(0.03), sy(4));
      ctx.fillStyle = T.figAmber; ctx.fillText('퇴적', sx(20), sy(1));
      // 지금 유속 선
      var yv = sy(state.v);
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(L, yv); ctx.lineTo(R, yv); ctx.stroke(); ctx.setLineDash([]);
      // 고른 입자
      var gd = GRAINS[state.pick].d, gx = sx(gd);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(gx, Tp); ctx.lineTo(gx, B); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(gx, yv, 6, 0, Math.PI * 2); ctx.fillStyle = T.figAccent; ctx.fill();
      ctx.strokeStyle = T.figPanel; ctx.lineWidth = 2; ctx.stroke();
      // 다른 입자들(작은 점)
      GRAINS.forEach(function (gr, k) {
        if (k === state.pick) return;
        var st = status(gr.d, state.v);
        ctx.beginPath(); ctx.arc(sx(gr.d), yv, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = st === 'ero' ? T.figRed : st === 'tr' ? T.figInk : T.figAmber; ctx.fill();
      });
    }
    // 하천 바닥 단면: 입자마다 상태를 보여 준다
    var parts = [];
    GRAINS.forEach(function (gr, k) { for (var j = 0; j < 3; j++) parts.push({ k: k, ph: Math.random() * 6.28, x: Math.random() }); });
    function channel(T, r) {
      var x0 = r.x + 8, x1 = r.x + r.w - 8, top = r.y + 30, bed = r.y + r.h - 34;
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(x0, top, x1 - x0, bed - top);
      ctx.fillStyle = T.figSoftAmber; ctx.fillRect(x0, bed, x1 - x0, 14);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(x0, top, x1 - x0, bed - top + 14);
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('하천 바닥 가까이 (흐름 →)', x0, top - 10);
      // 흐름 화살표 길이 ∝ log v
      var al = Math.max(8, Math.min(60, (Math.log10(state.v) + 1) * 15));
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1 - 10 - al, top + 12); ctx.lineTo(x1 - 10, top + 12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1 - 10, top + 12); ctx.lineTo(x1 - 17, top + 8); ctx.lineTo(x1 - 17, top + 16); ctx.closePath(); ctx.fillStyle = T.figAccent; ctx.fill();
      var lanes = GRAINS.length, wl = (x1 - x0) / lanes;
      parts.forEach(function (p) {
        var gr = GRAINS[p.k], st = status(gr.d, state.v);
        var xx, yy, lane = x0 + wl * p.k;
        var depth = bed - top;
        if (st === 'dep') { xx = lane + wl * (0.2 + 0.6 * p.x); yy = bed - gr.r; }
        else if (st === 'ero') {
          var spd = gr.d < 0.06 ? 0.25 : 0.4; var u = (p.x + state.t * spd) % 1;
          xx = lane + wl * (0.1 + 0.8 * u);
          var lift = gr.d < 0.06 ? 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(p.ph + state.t * 2)) : 0.08 + 0.18 * Math.abs(Math.sin(p.ph + state.t * 5));
          yy = bed - gr.r - lift * depth;
        } else {
          var u2 = (p.x + state.t * 0.12) % 1; xx = lane + wl * (0.1 + 0.8 * u2);
          yy = gr.d < 0.06 ? bed - depth * (0.3 + 0.35 * (0.5 + 0.5 * Math.sin(p.ph + state.t))) : bed - gr.r - 2;
        }
        ctx.beginPath(); ctx.arc(xx, yy, gr.r, 0, Math.PI * 2);
        ctx.fillStyle = st === 'ero' ? T.figRed : st === 'tr' ? T.figInk : T.figAmber;
        ctx.fill();
        if (p.k === state.pick) { ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2; ctx.stroke(); }
      });
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillStyle = T.figMuted;
      GRAINS.forEach(function (gr, k) { var nm = gr.n.split(' '); nm.forEach(function (t, j) { ctx.fillText(t, x0 + wl * (k + 0.5), bed + 26 + j * 12 - (nm.length - 1) * 6); }); });
    }
    var loop = api.loop(function (dt) { state.t += dt; draw(); });
    if (api.reduced) loop.pause();
    function update() {
      var gr = GRAINS[state.pick];
      rV.set(fmtV(state.v)); rG.set(gr.n + ' ' + fmtD(gr.d));
      rE.set('약 ' + fmtV(ero(gr.d)));
      rD.set(dep(gr.d) <= 0 ? '거의 멈춘 물에서만' : '약 ' + fmtV(dep(gr.d)));
      rS.set(NAME[status(gr.d, state.v)]);
      draw();
    }
    api.onResize(draw);
    update();
  },
});
