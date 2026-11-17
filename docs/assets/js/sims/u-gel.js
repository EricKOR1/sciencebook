/* 일반생명과학 7 DNA 기술: 아가로스 겔 전기 영동 — 띠의 이동 거리와 크기 표지로 만든 표준 곡선(로그 눈금)으로 DNA 조각 크기 읽기 */
Sims.register('u-gel', {
  title: '겔 전기 영동 — 이동 거리로 DNA 크기 읽기',
  caption: '‘전기 영동 시작’을 누르거나 시간 슬라이더를 움직여 DNA가 (+)극 쪽으로 이동하는 모습을 보고, 읽을 레인을 골라 보자. 오른쪽 그래프는 크기 표지(M)의 이동 거리와 크기로 만든 표준 곡선으로, 세로축이 로그 눈금이면 점들이 한 직선 위에 놓여 모르는 띠의 크기를 바로 읽을 수 있다. 세로축을 산술 눈금으로 바꾸면 점들이 곡선을 이루고, 이웃한 두 표지 사이를 직선으로 이어 읽으면(예제 12의 X에서 1500 bp) 크기를 크게 잘못 읽는다. 이동 거리는 예제 12처럼 d = 8.00 − 2.00 log₁₀(크기/100) cm(60분 기준)를 따르고 시간에 비례한다고 단순화했으며, 플라스미드는 잘린 직선 조각으로 보았다.',
  init: function (api) {
    var TMAX = 60, GEL = 8.6;
    var LADDER = [5000, 3000, 2000, 1000, 500];
    var lanes = [
      { key: 'M', name: 'M', full: '크기 표지', bands: LADDER },
      { key: 'X', name: 'X', full: '예제 12의 X', bands: [1412.5] },
      { key: 'E', name: 'E', full: 'EcoRI 단독', bands: [6000] },
      { key: 'B', name: 'B', full: 'BamHI 단독', bands: [4000, 2000] },
      { key: 'EB', name: 'E+B', full: 'EcoRI + BamHI', bands: [3000, 2000, 1000] },
    ];
    var st = { t: TMAX, sel: 1, logAxis: true, run: TMAX, auto: false };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.45 : 0.56; }, label: '아가로스 겔 사진과 이동 거리–크기 표준 곡선' });
    var ctx = cv.ctx;

    var rD = api.readout('이동 거리');
    var rLog = api.readout('표준 곡선(로그)으로 읽은 크기');
    var rLin = api.readout('산술 눈금 직선 보간');

    var g = api.group();
    var laneBtns = lanes.slice(1).map(function (L, i) {
      return api.button(L.full, function () { st.sel = i + 1; sync(); draw(); }, { toggle: true, pressed: i === 0, parent: g });
    });
    var sl = api.slider({ id: 'u-gel-t', label: '전기 영동 시간', min: 0, max: TMAX, step: 0.1, value: TMAX,
      format: function (v) { return Math.round(v) + '분'; }, onInput: function (v) { st.t = v; if (!st.auto && loop.playing) loop.pause(); draw(); } });
    api.button('전기 영동 시작', function () {
      if (api.reduced) { sl.set(TMAX); return; }
      st.run = 0; sl.set(0); loop.play();
    }, { primary: true });
    var axBtn = api.button('세로축: 로그 눈금', function () { st.logAxis = !st.logAxis; axBtn.textContent = '세로축: ' + (st.logAxis ? '로그 눈금' : '산술 눈금'); draw(); });

    var loop = api.loop(function (dt) {
      st.run = Math.min(TMAX, st.run + dt * 10);
      st.auto = true; sl.set(st.run); st.auto = false;
      if (st.run >= TMAX) loop.pause();
    });
    loop.pause();

    function dist(L, t) { return (t / TMAX) * (8.0 - 2.0 * Math.log10(L / 100)); }
    // 크기 표지로 직선 맞춤: log10(L) = a + b·d
    function fit(t) {
      var xs = LADDER.map(function (L) { return dist(L, t); }), ys = LADDER.map(function (L) { return Math.log10(L); });
      var n = xs.length, mx = 0, my = 0; xs.forEach(function (x, i) { mx += x; my += ys[i]; }); mx /= n; my /= n;
      var sxx = 0, sxy = 0; xs.forEach(function (x, i) { sxx += (x - mx) * (x - mx); sxy += (x - mx) * (ys[i] - my); });
      var b = sxy / sxx; return { a: my - b * mx, b: b };
    }
    function linInterp(d, t) {
      // 이웃한 두 크기 표지 사이를 산술 눈금 직선으로 잇기
      var pts = LADDER.map(function (L) { return [dist(L, t), L]; }).sort(function (p, q) { return p[0] - q[0]; });
      for (var i = 0; i < pts.length - 1; i++) {
        if (d >= pts[i][0] && d <= pts[i + 1][0]) { var f = (d - pts[i][0]) / (pts[i + 1][0] - pts[i][0]); return pts[i][1] + f * (pts[i + 1][1] - pts[i][1]); }
      }
      return null;
    }
    function fmtBp(v) { return v >= 1000 ? (Math.round(v / 10) * 10).toLocaleString('ko-KR') + ' bp' : Math.round(v) + ' bp'; }
    function sync() { laneBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', i + 1 === st.sel ? 'true' : 'false'); }); }

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { gel: { x: 8, y: 8, w: w - 16, h: h * 0.47 }, plot: { x: 0, y: h * 0.5, w: w, h: h * 0.5 } };
      return { gel: { x: 8, y: 8, w: w * 0.42, h: h - 16 }, plot: { x: w * 0.46, y: 0, w: w * 0.54, h: h } };
    }
    function draw() {
      var T = api.tokens(), P = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawGel(T, P.gel); drawPlot(T, P.plot); readouts();
    }
    function drawGel(T, r) {
      var top = r.y + 44, bot = r.y + r.h - 26, gx = r.x + 30, gw = r.w - 40;
      var sy = function (d) { return top + 14 + d / GEL * (bot - top - 18); };
      // 전극
      ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillStyle = T.figBlue;
      ctx.fillText('(−) 극', gx + gw / 2, r.y + 14);
      ctx.fillStyle = T.figRed; ctx.fillText('(+) 극', gx + gw / 2, r.y + r.h - 6);
      // 겔
      ctx.fillStyle = T.dark ? T.figSoftBlue : T.figSoftTeal; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5;
      ctx.fillRect(gx, top, gw, bot - top); ctx.strokeRect(gx, top, gw, bot - top);
      // 눈금(cm)
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var c = 0; c <= 8; c += 2) { ctx.fillText(c + '', gx - 5, sy(c) + 4); ctx.strokeStyle = T.rule; ctx.beginPath(); ctx.moveTo(gx - 3, sy(c)); ctx.lineTo(gx, sy(c)); ctx.stroke(); }
      ctx.save(); ctx.translate(r.x + 8, (top + bot) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.font = '11px ' + T.fontBody; ctx.fillText('이동 거리 (cm)', 0, 0); ctx.restore();
      var lw = gw / lanes.length;
      lanes.forEach(function (L, i) {
        var lx = gx + lw * i + lw * 0.16, bw = lw * 0.68;
        // 웰
        ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
        ctx.fillRect(lx, sy(0) - 7, bw, 7); ctx.strokeRect(lx, sy(0) - 7, bw, 7);
        if (i === st.sel || i === 0) {
          ctx.strokeStyle = i === 0 ? T.figMuted : T.figRed; ctx.lineWidth = 1.5; ctx.setLineDash(i === 0 ? [3, 3] : []);
          ctx.strokeRect(lx - 4, top + 2, bw + 8, bot - top - 4); ctx.setLineDash([]);
        }
        ctx.fillStyle = i === st.sel ? T.figRed : T.figInk; ctx.font = (i === st.sel ? '600 ' : '') + '12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(L.name, lx + bw / 2, top - 6);
        if (st.t <= 0) return;
        L.bands.forEach(function (bp) {
          var y = sy(dist(bp, st.t));
          ctx.globalAlpha = 0.55 + 0.45 * Math.min(1, bp / 4000);
          ctx.fillStyle = T.figAccent; ctx.fillRect(lx, y - 2.5, bw, 5);
          ctx.globalAlpha = 1;
        });
      });
    }
    function drawPlot(T, r) {
      var L = r.x + 62, R = r.x + r.w - 16, Tp = r.y + 22, B = r.y + r.h - 40;
      var f = Math.max(st.t, 1) / TMAX, dmin = 3.5 * f, dmax = 7.5 * f;
      var sx = function (d) { return L + (d - dmin) / (dmax - dmin) * (R - L); };
      var ylo = st.logAxis ? 2.5 : 0, yhi = st.logAxis ? 4 : 7000;
      var sy = function (bp) { var v = st.logAxis ? Math.log10(bp) : bp; return B - (v - ylo) / (yhi - ylo) * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      var ticks = st.logAxis ? [300, 500, 1000, 2000, 3000, 5000, 10000] : [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000];
      ticks.forEach(function (v) { var y = sy(v); ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y); ctx.stroke(); ctx.fillText(v.toLocaleString('ko-KR'), L - 6, y + 4); });
      ctx.textAlign = 'center';
      var stp = (dmax - dmin) / 4, e = Math.pow(10, Math.floor(Math.log10(stp))), m = stp / e;
      stp = (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * e;
      for (var d = Math.ceil(dmin / stp) * stp; d <= dmax + 1e-9; d += stp) { ctx.beginPath(); ctx.moveTo(sx(d), B); ctx.lineTo(sx(d), Tp); ctx.stroke(); ctx.fillText(stp < 1 ? d.toFixed(1) : d.toFixed(0), sx(d), B + 15); }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('이동 거리 (cm)', (L + R) / 2, B + 32);
      ctx.save(); ctx.translate(r.x + 13, (Tp + B) / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText('크기 (bp, ' + (st.logAxis ? '로그 눈금' : '산술 눈금') + ')', 0, 0); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp - 2, R - L, B - Tp + 4); ctx.clip();
      if (st.t < 5) {
        ctx.restore();
        ctx.fillStyle = T.figMuted; ctx.font = '13px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('띠가 충분히 이동한 뒤에 표준 곡선을 그린다', (L + R) / 2, (Tp + B) / 2);
        return;
      }
      var F = fit(st.t), n = 80, i, dd, bp;
      // 로그 표준 곡선(로그 눈금에서는 직선)
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2; ctx.beginPath();
      for (i = 0; i <= n; i++) { dd = dmin + (dmax - dmin) * i / n; bp = Math.pow(10, F.a + F.b * dd); if (i) ctx.lineTo(sx(dd), sy(bp)); else ctx.moveTo(sx(dd), sy(bp)); }
      ctx.stroke();
      // 산술 눈금: 이웃 점을 직선으로 잇는 잘못된 보간
      var pts = LADDER.map(function (b) { return [dist(b, st.t), b]; }).sort(function (p, q) { return p[0] - q[0]; });
      if (!st.logAxis) {
        ctx.strokeStyle = T.figAmber; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.8; ctx.beginPath();
        pts.forEach(function (p, k) { if (k) ctx.lineTo(sx(p[0]), sy(p[1])); else ctx.moveTo(sx(p[0]), sy(p[1])); }); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.restore();
      // 크기 표지 점
      pts.forEach(function (p) { ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(sx(p[0]), sy(p[1]), 4, 0, 7); ctx.fill(); });
      // 선택한 레인의 띠
      var lane = lanes[st.sel];
      lane.bands.forEach(function (b, k) {
        var dd2 = dist(b, st.t); if (dd2 < dmin || dd2 > dmax) return;
        var est = Math.pow(10, F.a + F.b * dd2), yy = sy(est), xx = sx(dd2);
        ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(xx, B); ctx.lineTo(xx, yy); ctx.lineTo(L, yy); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(xx, yy, 5, 0, 7); ctx.fill();
        ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        var lx = xx + 8; if (lx > R - 70) { lx = xx - 8; ctx.textAlign = 'right'; }
        ctx.fillText('≈ ' + fmtBp(est), lx, yy - 8);
        if (!st.logAxis) {
          var li = linInterp(dd2, st.t);
          if (li != null) { var y2 = sy(li); ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.arc(xx, y2, 4, 0, 7); ctx.fill(); }
        }
      });
      // 범례
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      var ly = Tp - 8;
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(L + 6, ly - 4, 3.5, 0, 7); ctx.fill(); ctx.fillText('크기 표지', L + 14, ly);
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(L + 78, ly - 4); ctx.lineTo(L + 98, ly - 4); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.fillText('표준 곡선', L + 102, ly);
      if (!st.logAxis && R - L > 260) {
        ctx.strokeStyle = T.figAmber; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(L + 166, ly - 4); ctx.lineTo(L + 186, ly - 4); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillText('직선 보간', L + 190, ly);
      }
    }
    function readouts() {
      var lane = lanes[st.sel];
      if (st.t <= 0) { rD.set('–'); rLog.set('–'); rLin.set('–'); return; }
      var F = fit(st.t);
      rD.set(lane.bands.map(function (b) { return dist(b, st.t).toFixed(2); }).join(', ') + ' cm');
      rLog.set(lane.bands.map(function (b) { return fmtBp(Math.pow(10, F.a + F.b * dist(b, st.t))); }).join(', '));
      rLin.set(lane.bands.map(function (b) { var v = linInterp(dist(b, st.t), st.t); return v == null ? '범위 밖' : fmtBp(v); }).join(', '));
    }
    api.onResize(draw);
    draw();
  },
});
