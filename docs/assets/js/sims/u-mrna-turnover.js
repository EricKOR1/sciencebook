/* 일반생명과학 7 전사 후 조절: mRNA의 합성과 분해 — dM/dt = ks − kd·M, 정상 상태 M = ks/kd, 반감기가 바꾸는 반응 속도 */
Sims.register('u-mrna-turnover', {
  title: 'mRNA는 들어오고 나가는 물탱크 — 합성과 분해의 균형',
  caption: '합성 속도 ks와 mRNA 반감기를 바꿔 보자(처음 값은 예제 4: 분당 12분자, 20분). 0~120분에는 전사가 일어나고 120분에 자극이 끊겨 합성이 멈춘다. 들어오는 양(ks)과 나가는 양(kd·M)이 같아지면 양이 더는 변하지 않는 정상 상태 M = ks/kd = ks·t½/ln2가 되므로, 반감기를 2배로 하면 정상 상태 양도 2배가 된다. 정상 상태의 절반에 이르는 시간과 합성이 멈춘 뒤 절반이 사라지는 시간이 모두 반감기와 같아서, 수명이 짧은 mRNA일수록 신호에 빨리 반응하고 빨리 꺼진다. 합성 속도와 분해 속도 상수가 일정하다고 단순화한 모형이다.',
  init: function (api) {
    var TOFF = 120, TEND = 240, LN2 = Math.LN2;
    var st = { ks: 12, th: 20, t: 0, ghost: null };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.5; }, label: 'mRNA 분자 수의 시간 변화 그래프와 물탱크 모형' });
    var ctx = cv.ctx;

    var rSS = api.readout('정상 상태 M = ks/kd');
    var rKd = api.readout('kd = ln2 / t½');
    var rNow = api.readout('지금 M');
    var rRate = api.readout('dM/dt = 합성 − 분해');

    api.slider({ id: 'u-mrna-turnover-ks', label: '합성 속도 ks', min: 2, max: 30, step: 1, value: st.ks,
      format: function (v) { return v + ' 분자/분'; }, onInput: function (v) { st.ks = v; draw(); } });
    api.slider({ id: 'u-mrna-turnover-th', label: 'mRNA 반감기 t½', min: 5, max: 60, step: 1, value: st.th,
      format: function (v) { return v + '분'; }, onInput: function (v) { st.th = v; draw(); } });
    var playBtn = api.button(api.reduced ? '20분 진행' : '멈춤', function () {
      if (api.reduced) { st.t = (st.t + 20) % (TEND + 20); draw(); return; }
      if (loop.playing) { loop.pause(); playBtn.textContent = '재생'; } else { loop.play(); playBtn.textContent = '멈춤'; }
    }, { primary: true });
    api.button('지금 곡선 남겨 비교', function () { st.ghost = { ks: st.ks, th: st.th }; draw(); });

    var loop = api.loop(function (dt) { st.t += dt * 30; if (st.t > TEND + 30) st.t = 0; draw(); });
    if (api.reduced) { st.t = TOFF; loop.pause(); }

    function kd(th) { return LN2 / th; }
    function M(t, ks, th) {
      var k = kd(th), ms = ks / k;
      if (t <= TOFF) return ms * (1 - Math.exp(-k * t));
      return ms * (1 - Math.exp(-k * TOFF)) * Math.exp(-k * (t - TOFF));
    }
    function nice(v) { var e = Math.pow(10, Math.floor(Math.log10(v))), m = v / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * e; }

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { tank: { x: 0, y: 0, w: w, h: h * 0.36 }, plot: { x: 0, y: h * 0.38, w: w, h: h * 0.62 } };
      return { tank: { x: 0, y: 0, w: w * 0.27, h: h }, plot: { x: w * 0.29, y: 0, w: w * 0.71, h: h } };
    }
    function draw() {
      var T = api.tokens(), P = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      var ms = st.ks / kd(st.th), gms = st.ghost ? st.ghost.ks / kd(st.ghost.th) : 0;
      var ymax = nice(Math.max(ms, gms, 50) * 1.15);
      drawPlot(T, P.plot, ymax, ms);
      drawTank(T, P.tank, ymax);
      var tc = Math.min(st.t, TEND), m = M(tc, st.ks, st.th), syn = tc <= TOFF ? st.ks : 0, deg = kd(st.th) * m;
      rSS.set(Math.round(ms) + ' 분자');
      rKd.set(kd(st.th).toFixed(4) + ' /분');
      rNow.set(Math.round(m) + ' 분자 (' + Math.round(tc) + '분)');
      rRate.set(syn.toFixed(1) + ' − ' + deg.toFixed(1) + ' = ' + (syn - deg).toFixed(1) + ' 분자/분');
    }
    function drawPlot(T, r, ymax, ms) {
      var L = r.x + 56, R = r.x + r.w - 14, Tp = r.y + 30, B = r.y + r.h - 40;
      var sx = function (t) { return L + t / TEND * (R - L); }, sy = function (v) { return B - v / ymax * (B - Tp); };
      // 구간 배경
      ctx.fillStyle = T.figSoftGreen; ctx.fillRect(sx(0), Tp, sx(TOFF) - sx(0), B - Tp);
      ctx.fillStyle = T.figSoftRed; ctx.fillRect(sx(TOFF), Tp, sx(TEND) - sx(TOFF), B - Tp);
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillStyle = T.figGreen; ctx.fillText('전사 중 (합성 ks)', sx(TOFF / 2), Tp - 8);
      ctx.fillStyle = T.figRed; ctx.fillText('자극 끊김 (합성 0)', sx((TOFF + TEND) / 2), Tp - 8);
      // 눈금
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var i = 0; i <= 5; i++) { var v = ymax * i / 5; ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(Math.round(v), L - 6, sy(v) + 4); }
      ctx.textAlign = 'center';
      for (var t = 0; t <= TEND; t += 40) ctx.fillText(t, sx(t), B + 15);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('시간 (분)', (L + R) / 2, B + 32);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('mRNA 분자 수 M', 0, 0); ctx.restore();
      function curve(ks, th, col, lw, dash) {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.beginPath();
        for (var k = 0; k <= 240; k++) { var tt = TEND * k / 240, y = sy(M(tt, ks, th)); if (k) ctx.lineTo(sx(tt), y); else ctx.moveTo(sx(tt), y); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      if (st.ghost) curve(st.ghost.ks, st.ghost.th, T.figLine, 2, [6, 4]);
      // 정상 상태 선
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(L, sy(ms)); ctx.lineTo(R, sy(ms)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figAccent; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('정상 상태 ' + Math.round(ms), R - 4, sy(ms) - 6);
      curve(st.ks, st.th, T.figAccent, 2.6);
      // 반감기 표시
      var k1 = st.th, m1 = M(k1, st.ks, st.th);
      dot(sx(k1), sy(m1), T.figGreen); label('t½ 뒤 정상의 50%', sx(k1) + 7, sy(m1) + 15, T.figGreen, 'left');
      var m0 = M(TOFF, st.ks, st.th), k2 = TOFF + st.th;
      if (k2 <= TEND) { dot(sx(k2), sy(m0 / 2), T.figRed); label('t½ 뒤 절반', sx(k2) + 7, sy(m0 / 2) - 7, T.figRed, 'left'); }
      // 진행 표시
      var tc = Math.min(st.t, TEND);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx(tc), Tp); ctx.lineTo(sx(tc), B); ctx.stroke();
      dot(sx(tc), sy(M(tc, st.ks, st.th)), T.figInk);
      function dot(x, y, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.fill(); }
      function label(s, x, y, c, al) { ctx.font = '12px ' + T.fontBody; ctx.textAlign = al; if (x + ctx.measureText(s).width > R) { ctx.textAlign = 'right'; x -= 14; } ctx.lineWidth = 4; ctx.strokeStyle = T.figPanel; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); ctx.fillStyle = c; ctx.fillText(s, x, y); }
    }
    function drawTank(T, r, ymax) {
      var tc = Math.min(st.t, TEND), m = M(tc, st.ks, st.th), syn = tc <= TOFF ? st.ks : 0, deg = kd(st.th) * m;
      var cx = r.x + r.w / 2, tw = Math.min(r.w * 0.5, 120), th = Math.min(r.h * 0.5, 150);
      var tx = cx - tw / 2, ty = r.y + (r.h - th) / 2 + 4;
      var level = Math.min(1, m / ymax);
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(tx, ty + th * (1 - level), tw, th * level);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, ty + th); ctx.lineTo(tx + tw, ty + th); ctx.lineTo(tx + tw, ty); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('M = ' + Math.round(m), cx, ty + th - 8);
      var scale = 0.55;
      // 들어오는 화살표(합성)
      var wIn = Math.max(1.5, syn * scale);
      if (syn > 0) arrow(tx + tw * 0.3, ty - 34, tx + tw * 0.3, ty + th * 0.15, wIn, T.figGreen);
      ctx.fillStyle = T.figGreen; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('합성 ' + syn.toFixed(1) + '/분', tx + tw * 0.3 + 10, ty - 22);
      // 나가는 화살표(분해)
      var wOut = Math.max(1.5, deg * scale);
      if (deg > 0.05) arrow(tx + tw, ty + th - 14, tx + tw + 40, ty + th - 14, Math.min(wOut, 26), T.figRed);
      ctx.fillStyle = T.figRed; ctx.textAlign = 'right';
      ctx.fillText('분해 ' + deg.toFixed(1) + '/분', tx + tw + 44, ty + th + 18);
      function arrow(x1, y1, x2, y2, w, c) {
        var a = Math.atan2(y2 - y1, x2 - x1), hl = Math.max(8, w * 0.9);
        ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - hl * Math.cos(a), y2 - hl * Math.sin(a)); ctx.stroke();
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - hl * Math.cos(a) + (w / 2 + 4) * Math.sin(a), y2 - hl * Math.sin(a) - (w / 2 + 4) * Math.cos(a));
        ctx.lineTo(x2 - hl * Math.cos(a) - (w / 2 + 4) * Math.sin(a), y2 - hl * Math.sin(a) + (w / 2 + 4) * Math.cos(a)); ctx.closePath(); ctx.fill();
      }
    }
    api.onResize(draw);
    draw();
  },
});
