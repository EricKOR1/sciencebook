/* 지구시스템과학 2 조석: 달의 위상에 따른 해수면 부풂과 하루 조위 곡선 (2D, 평형 조석) */
Sims.register('tides', {
  title: '달과 태양이 만드는 조석 — 사리와 조금',
  caption: '달의 위상을 바꾸어 보자. 삭·망에는 달과 태양이 일직선이라 두 부풂이 겹쳐 조차가 큰 사리가, 상현·하현에는 직각이라 서로 약화하여 조차가 작은 조금이 된다. 지구가 자전하면 한 지점은 하루에 두 부풂을 지나므로 만조와 간조가 두 번씩, 약 12시간 25분 간격으로 찾아온다. 해수 전체가 기조력에 곧바로 반응한다고 보는 평형 조석으로 그렸고, 달은 적도 위에 있다고 가정했다(일조부등 없음). 부풂의 크기, 지구·달의 크기와 거리는 크게 과장했으며 달과 태양의 기조력 비는 약 2 : 1로 두었다. 만조 간격은 태양의 영향으로 사리 무렵 조금 짧고 조금 무렵 조금 길지만 평균은 약 12시간 25분이다.',
  init: function (api) {
    var SUN = 0.46;                    // 태양 기조력 / 달 기조력
    var PH = [['삭', 0], ['상현', 90], ['망', 180], ['하현', 270]];
    var LUNAR_SYN = 29.53 * 24;        // 삭망월(시간)
    var state = { ph: 0, t: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.45 : 0.5; }, label: '지구·달·태양의 배치와 해수면의 부풂, 한 지점의 하루 조위 곡선' });
    var ctx = cv.ctx;
    var rLay = api.readout('배치');
    var rKind = api.readout('조석');
    var rRange = api.readout('조차(달만 있을 때 = 1)');
    var rInt = api.readout('만조 간격');

    var g = api.group();
    var pb = PH.map(function (p, i) {
      return api.button(p[0], function () { state.ph = i; pb.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); update(); }, { toggle: true, pressed: i === 0, parent: g });
    });
    var play = api.button(api.reduced ? '3시간 뒤로' : '멈춤', function () {
      if (api.reduced) { state.t = (state.t + 3) % 25; draw(); return; }
      if (loop.playing) { loop.pause(); play.textContent = '재생'; } else { loop.play(); play.textContent = '멈춤'; }
    });
    var loop = api.loop(function (dt) { state.t += dt * 2.5; if (state.t > 25) state.t -= 25; draw(); });
    if (api.reduced) loop.pause();

    var D2R = Math.PI / 180;
    function moonAng(t) { return PH[state.ph][1] + 360 * t / LUNAR_SYN; }
    function obsAng(t) { return 180 + 360 * t / 24; }     // t=0: 자정(태양 반대쪽)
    function height(phi, t) { return Math.cos(2 * (phi - moonAng(t)) * D2R) + SUN * Math.cos(2 * phi * D2R); }
    function hObs(t) { return height(obsAng(t), t); }
    function extremes() {
      var out = [], dt = 0.01, prev = hObs(-dt), cur = hObs(0);
      for (var t = 0; t <= 25; t += dt) {
        var nx = hObs(t + dt);
        if (cur > prev && cur >= nx) out.push({ t: t, h: cur, hi: true });
        if (cur < prev && cur <= nx) out.push({ t: t, h: cur, hi: false });
        prev = cur; cur = nx;
      }
      return out;
    }
    function fmtT(t) { var m = Math.round(t * 60), hh = Math.floor(m / 60) % 24, mm = m % 60; return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm; }
    var EX = [];
    function update() {
      EX = extremes();
      var spring = state.ph % 2 === 0;
      rLay.set(spring ? '달·지구·태양이 일직선' : '달과 태양이 직각 방향');
      rKind.set(spring ? '사리 (조차 최대)' : '조금 (조차 최소)');
      var hi = EX.filter(function (e) { return e.hi; }), lo = EX.filter(function (e) { return !e.hi; });
      if (hi.length && lo.length) rRange.set(((hi[0].h - lo[0].h) / 2).toFixed(2));
      if (hi.length >= 2) { var d = hi[1].t - hi[0].t, m = Math.round(d * 60); rInt.set(Math.floor(m / 60) + '시간 ' + (m % 60) + '분 (평균 약 12시간 25분)'); }
      draw();
    }

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { view: { x: 0, y: 0, w: w, h: h * 0.56 }, graph: { x: 0, y: h * 0.58, w: w, h: h * 0.42 } };
      return { view: { x: 0, y: 0, w: w * 0.44, h: h }, graph: { x: w * 0.47, y: 0, w: w * 0.53, h: h } };
    }
    function draw() {
      var T = api.tokens(), P = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawView(T, P.view); drawGraph(T, P.graph);
    }
    function drawView(T, r) {
      var cx = r.x + r.w * 0.44, cy = r.y + r.h / 2, re = Math.min(r.w, r.h) * 0.17, orb = Math.min(r.w * 0.4, r.h * 0.37);
      var t = state.t, mA = moonAng(t);
      // 태양 빛
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.2; ctx.fillStyle = T.figAmber;
      for (var k = -2; k <= 2; k++) {
        var yy = cy + k * re * 0.9, x1 = r.x + r.w - 6, x0 = x1 - 34;
        ctx.beginPath(); ctx.moveTo(x1, yy); ctx.lineTo(x0, yy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + 7, yy - 4); ctx.lineTo(x0 + 7, yy + 4); ctx.closePath(); ctx.fill();
      }
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText('태양 쪽 →', r.x + r.w - 6, cy - 2.6 * re - 4);
      // 달 궤도
      ctx.setLineDash([3, 4]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, orb, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      // 성분 부풂(점선)
      var E = 0.16;
      function blob(fn, col, dash, fill) {
        ctx.beginPath();
        for (var a = 0; a <= 360; a += 4) { var rr = re * (1.06 + E * fn(a)); var x = cx + rr * Math.cos(a * D2R), y = cy - rr * Math.sin(a * D2R); if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.closePath();
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        ctx.strokeStyle = col; ctx.lineWidth = dash ? 1.2 : 2; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
      }
      blob(function (a) { return height(a, t); }, T.figBlue, null, T.figSoftBlue);
      blob(function (a) { return Math.cos(2 * (a - mA) * D2R); }, T.figViolet, [4, 3]);
      blob(function (a) { return SUN * Math.cos(2 * a * D2R); }, T.figAmber, [2, 3]);
      // 지구(밤 쪽 그늘)
      ctx.beginPath(); ctx.arc(cx, cy, re, 0, Math.PI * 2); ctx.fillStyle = T.figSoftGreen; ctx.fill(); ctx.strokeStyle = T.figGreen; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, re, Math.PI / 2, Math.PI * 1.5); ctx.closePath(); ctx.fillStyle = T.figInk; ctx.globalAlpha = 0.18; ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('북극에서 본 지구', cx, cy + 4);
      // 관측 지점
      var oA = obsAng(t) * D2R, ox = cx + re * Math.cos(oA), oy = cy - re * Math.sin(oA);
      ctx.beginPath(); ctx.arc(ox, oy, 5, 0, Math.PI * 2); ctx.fillStyle = T.figRed; ctx.fill(); ctx.strokeStyle = T.figPanel; ctx.lineWidth = 1.5; ctx.stroke();
      // 자전 방향
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, re * 0.55, 0.3, -1.2, true); ctx.stroke();
      var ea = -1.2, ex = cx + re * 0.55 * Math.cos(ea), ey = cy + re * 0.55 * Math.sin(ea);
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 6, ey + 1); ctx.lineTo(ex - 1, ey + 6); ctx.closePath(); ctx.fillStyle = T.figMuted; ctx.fill();
      // 달
      var mx = cx + orb * Math.cos(mA * D2R), my = cy - orb * Math.sin(mA * D2R), mr = re * 0.32;
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fillStyle = T.figLine; ctx.fill();
      ctx.beginPath(); ctx.arc(mx, my, mr, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fillStyle = T.figPaper; ctx.fill();
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('달(' + PH[state.ph][0] + ')', mx, my + (my > cy + 5 ? -mr - 6 : mr + 15));
      // 범례
      var ly = r.y + r.h - 46, lx = r.x + 8;
      [[T.figBlue, null, '합쳐진 해수면'], [T.figViolet, [4, 3], '달에 의한 부풂'], [T.figAmber, [2, 3], '태양에 의한 부풂']].forEach(function (L, i) {
        var y = ly + i * 16; ctx.strokeStyle = L[0]; ctx.lineWidth = 2; ctx.setLineDash(L[1] || []);
        ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx + 20, y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText(L[2], lx + 26, y + 4);
      });
      ctx.fillStyle = T.figRed; ctx.fillText('● 관측 지점', lx, r.y + 14);
    }
    function drawGraph(T, r) {
      var L = r.x + 44, R = r.x + r.w - 12, Tp = r.y + 26, B = r.y + r.h - 34;
      var X = function (t) { return L + (t / 25) * (R - L); }, Y = function (v) { return (Tp + B) / 2 - v / 1.7 * (B - Tp) / 2; };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('관측 지점의 하루 조위 변화', L, r.y + 14);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
      for (var h = 0; h <= 24; h += 6) { ctx.beginPath(); ctx.moveTo(X(h), Tp); ctx.lineTo(X(h), B); ctx.stroke(); ctx.fillText(h + '시', X(h), B + 14); }
      ctx.beginPath(); ctx.moveTo(L, Y(0)); ctx.lineTo(R, Y(0)); ctx.strokeStyle = T.figLine; ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.fillText('시각', (L + R) / 2, B + 28);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('해수면 높이 (상대값)', 0, 0); ctx.restore();
      // 다른 위상의 곡선(비교용, 흐리게)
      var other = state.ph % 2 === 0 ? 1 : 0, keep = state.ph;
      state.ph = other;
      ctx.beginPath(); for (var t = 0; t <= 25; t += 0.1) { var v = hObs(t); if (t === 0) ctx.moveTo(X(t), Y(v)); else ctx.lineTo(X(t), Y(v)); }
      state.ph = keep;
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); for (t = 0; t <= 25; t += 0.1) { v = hObs(t); if (t === 0) ctx.moveTo(X(t), Y(v)); else ctx.lineTo(X(t), Y(v)); }
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillStyle = T.figMuted;
      ctx.fillText('점선: ' + (other === 1 ? '조금' : '사리') + '일 때', R, Tp - 6);
      // 만조·간조 표시
      EX.forEach(function (e) {
        var x = X(e.t), y = Y(e.h);
        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fillStyle = e.hi ? T.figBlue : T.figTeal; ctx.fill();
        ctx.fillStyle = T.figInk; ctx.textAlign = 'center'; ctx.font = '11px ' + T.fontBody;
        var showTime = r.w > 300;
        ctx.fillText((e.hi ? '만조' : '간조') + (showTime ? ' ' + fmtT(e.t) : ''), Math.min(Math.max(x, L + 24), R - 24), e.hi ? y - 8 : y + 16);
      });
      // 현재 시각
      var cx = X(state.t);
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx, Tp); ctx.lineTo(cx, B); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, Y(hObs(state.t)), 5, 0, Math.PI * 2); ctx.fillStyle = T.figRed; ctx.fill();
    }
    api.onResize(draw);
    update();
  },
});
