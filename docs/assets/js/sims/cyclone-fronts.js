/* 지구과학 1 중위도 저기압의 통과: 일기도 위 저기압·전선이 서→동으로 지나갈 때 관측소의 풍향·기온·기압·날씨 변화 */
Sims.register('cyclone-fronts', {
  title: '중위도 저기압이 지나갈 때 — 관측소의 날씨 변화',
  caption: '시간 슬라이더를 움직이거나 재생을 눌러 저기압을 동쪽으로 보내 보자. 중심의 남쪽을 지나는 관측소 A에서는 온난 전선 앞의 지속적인 비 → 온난 구역의 맑음 → 한랭 전선의 소나기와 기온 급하강이 차례로 나타나고, 풍향은 남동 → 남서 → 북서로 시계 방향으로 바뀐다. 북쪽의 관측소 B에서는 풍향이 동 → 북동 → 북으로 시계 반대 방향으로 바뀐다. 그래프의 화살표는 바람이 불어 가는 방향(위가 북쪽), 막대는 비(진할수록 소나기)이다. 지도를 눌러 관측소를 옮길 수도 있다. 북반구 기준이며, 저기압은 모양을 유지한 채 시속 40 km로 움직인다고 단순화했다(실제로는 발달·폐색하며, 수치는 어림값이다).',
  init: function (api) {
    var D = Math.PI / 180, SPEED = 40, TMAX = 75, X0 = -1500;
    var st = { t: 22, sx: 200, sy: -350, which: 'A' };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.72 : 0.62; }, label: '중위도 저기압 일기도와 관측소의 기온·기압·풍향·강수 그래프' });
    var ctx = cv.ctx;
    var rT = api.readout('시각'), rW = api.readout('풍향'), rTe = api.readout('기온'), rP = api.readout('기압'), rS = api.readout('날씨');

    var slider = api.slider({ id: 'cyclone-fronts-t', label: '시간', min: 0, max: TMAX, step: 0.5, value: st.t,
      format: function (v) { return v.toFixed(1) + ' 시간째'; },
      onInput: function (v) { st.t = v; update(); } });
    var playBtn = api.button('재생', function () {
      if (playing) { stop(); return; }
      if (st.t >= TMAX - 0.01) slider.set(0);
      if (api.reduced) { slider.set(Math.min(TMAX, Math.floor(st.t / 6) * 6 + 6)); return; }
      playing = true; playBtn.textContent = '멈춤'; loop.play();
    }, { primary: true });
    if (api.reduced) playBtn.textContent = '6시간 뒤로';
    var playing = false;
    function stop() { playing = false; loop.pause(); playBtn.textContent = '재생'; }
    var g = api.group();
    var bA = api.button('관측소 A: 중심의 남쪽', function () { setStation(200, -350, 'A'); }, { toggle: true, pressed: true, parent: g });
    var bB = api.button('관측소 B: 중심의 북쪽', function () { setStation(200, 350, 'B'); }, { toggle: true, pressed: false, parent: g });
    function setStation(x, y, w) {
      st.sx = x; st.sy = y; st.which = w;
      bA.setAttribute('aria-pressed', w === 'A' ? 'true' : 'false');
      bB.setAttribute('aria-pressed', w === 'B' ? 'true' : 'false');
      series = computeSeries(); update();
    }

    var loop = api.loop(function (dt) {
      if (!(dt > 0)) return;
      var nt = st.t + dt * 4;
      if (nt >= TMAX) { nt = TMAX; stop(); }
      slider.set(Math.round(nt * 10) / 10);
    });
    loop.pause();

    /* ── 날씨 모형(저기압 중심 기준 좌표 u 동쪽, v 북쪽, km) ── */
    function thW(r) { return -25 - 12 * Math.min(r, 1500) / 1000; }   // 온난 전선이 뻗는 방향(도)
    function thC(r) { return -100 - 18 * Math.min(r, 1500) / 1000; }  // 한랭 전선이 뻗는 방향(도)
    function sig(x) { return 1 / (1 + Math.exp(-x)); }
    function field(u, v) {
      var r = Math.hypot(u, v), th = Math.atan2(v, u) / D, tw = thW(r), tc = thC(r);
      var sW = r * Math.sin((tw - th) * D), sC = r * Math.sin((th - tc) * D);   // +: 온난 구역 쪽
      var onW = Math.cos((th - tw) * D) > 0, onC = Math.cos((th - tc) * D) > 0;
      var w = sig(sW / 60) * sig(sC / 18);                                        // 따뜻한 공기 비율
      var b; if (th <= tc || th >= 150) b = 1; else if (th > 60) b = (th - 60) / 90; else b = 0;
      if (th > tc && th < 0) b = 0;
      var T = (1 - w) * ((1 - b) * 10 + b * 6) + w * 17;
      var p = 1016 - 18 * Math.exp(-r * r / (2 * 700 * 700))
        - (onC ? 2.5 * Math.exp(-sC * sC / 9800) : 0) - (onW ? 1.5 * Math.exp(-sW * sW / 9800) : 0);
      // 바람: 저기압 중심으로 시계 반대 방향으로 불어 들어감(북반구 지상)
      var gu = r ? u / r : 0, gv = r ? v / r : 0, a = 35 * D;
      var bu = Math.cos(a) * (-gv) - Math.sin(a) * gu, bv = Math.cos(a) * gu - Math.sin(a) * gv;
      var from = (Math.atan2(-bu, -bv) / D + 360) % 360;
      // 전선에 따른 풍향 차이
      if (th >= tw && th < 60) from -= 22 * (th < 20 ? 1 : (60 - th) / 40);          // 온난 전선 앞: 남동풍 쪽으로
      from = blendAng(from, 225, w);                                                    // 온난 구역: 남서풍
      if (th <= tc && th > -180) from = blendAng(from, 315, (1 - w) * 0.75);           // 한랭 전선 뒤: 북서풍
      from = (from + 360) % 360;
      // 구름과 강수
      var strat = 0, conv = 0, cloud;
      var ahead = -sW;                                                                  // 온난 전선 앞 거리
      if (onW && th >= tw && th < 70 && ahead > 0) {
        strat = Math.max(strat, Math.max(0, 1 - ahead / 320));
      }
      if (v > 0 && r < 480 && th < 160) strat = Math.max(strat, 0.75 * (1 - r / 480));
      var behind = -sC;
      if (onC && behind > -20 && behind < 90 && th < 0) conv = 1;
      if (conv) cloud = '적란운';
      else if (w > 0.5) cloud = '구름 조금';
      else if (th <= tc || th >= 150) cloud = (onC && behind < 260) ? '구름이 걷히는 중' : '맑음';
      else {
        var de = (onW && th >= tw && th < 70) ? ahead : 1e9;
        if (v > 0) de = Math.min(de, r * 0.45);
        cloud = de < 200 ? '난층운' : de < 350 ? '고층운' : de < 500 ? '권층운' : de < 680 ? '권운' : '맑음';
      }
      return { T: T, p: p, from: from, w: w, strat: strat, conv: conv, cloud: cloud };
    }
    function blendAng(a, b, k) {
      var x = (1 - k) * Math.sin(a * D) + k * Math.sin(b * D), y = (1 - k) * Math.cos(a * D) + k * Math.cos(b * D);
      return Math.atan2(x, y) / D;
    }
    var NAMES = ['북', '북북동', '북동', '동북동', '동', '동남동', '남동', '남남동', '남', '남남서', '남서', '서남서', '서', '서북서', '북서', '북북서'];
    function dirName(f) { return NAMES[Math.round(f / 22.5) % 16]; }
    function cx(t) { return X0 + SPEED * t; }
    function at(t) { return field(st.sx - cx(t), st.sy); }
    function weatherText(f) {
      if (f.conv) return '소나기·뇌우(적란운)';
      if (f.strat > 0.05) return '지속적인 비(' + f.cloud + ')';
      return f.cloud === '맑음' ? '맑음' : f.cloud;
    }
    function computeSeries() {
      var a = [];
      for (var t = 0; t <= TMAX + 1e-9; t += 0.5) a.push({ t: t, f: at(t) });
      return a;
    }
    var series = computeSeries();

    function update() {
      var f = at(st.t);
      rT.set(st.t.toFixed(1) + ' 시간째');
      rW.set(dirName(f.from) + '풍');
      rTe.set(f.T.toFixed(1) + ' °C');
      rP.set(f.p.toFixed(0) + ' hPa');
      rS.set(weatherText(f));
      draw();
    }

    /* ── 배치 ── */
    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) {
        var mh = Math.round(w * 0.78);
        return { map: { x: 0, y: 0, w: w, h: mh }, gr: { x: 0, y: mh + 8, w: w, h: h - mh - 8 } };
      }
      var mw = Math.round(w * 0.57);
      return { map: { x: 0, y: 0, w: mw, h: h }, gr: { x: mw + 14, y: 0, w: w - mw - 14, h: h } };
    }
    var mapGeom = null;
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawMap(T, L.map); drawGraphs(T, L.gr);
    }
    function drawMap(T, r) {
      var s = r.w / 3300, kmH = r.h / s, xc = r.x + r.w / 2, yc = r.y + r.h / 2, yMid = -150;
      function X(x) { return xc + x * s; }
      function Y(y) { return yc - (y - yMid) * s; }
      mapGeom = { r: r, s: s, xc: xc, yc: yc, yMid: yMid };
      var c = cx(st.t);
      ctx.save();
      ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
      ctx.fillStyle = T.figPaper; ctx.fillRect(r.x, r.y, r.w, r.h);
      // 강수 구역
      var cell = 45, x0 = -1650, x1 = 1650, y0 = yMid - kmH / 2, y1 = yMid + kmH / 2;
      for (var gx = x0; gx < x1; gx += cell) for (var gy = y0; gy < y1; gy += cell) {
        var f = field(gx + cell / 2 - c, gy + cell / 2);
        if (f.conv) { ctx.fillStyle = T.figGreen; ctx.globalAlpha = 0.55; }
        else if (f.strat > 0.05) { ctx.fillStyle = T.figGreen; ctx.globalAlpha = 0.22 + 0.4 * f.strat; }
        else continue;
        ctx.fillRect(X(gx), Y(gy + cell), cell * s + 0.6, cell * s + 0.6);
      }
      ctx.globalAlpha = 1;
      // 등압선(마칭 스퀘어)
      var step = 40, nx = Math.ceil((x1 - x0) / step) + 1, ny = Math.ceil((y1 - y0) / step) + 1, P = [];
      for (var i = 0; i < nx; i++) { P[i] = []; for (var j = 0; j < ny; j++) P[i][j] = field(x0 + i * step - c, y0 + j * step).p; }
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.1;
      for (var lev = 988; lev <= 1016; lev += 4) {
        ctx.beginPath();
        for (i = 0; i < nx - 1; i++) for (j = 0; j < ny - 1; j++) {
          var a = P[i][j], b = P[i + 1][j], cc = P[i + 1][j + 1], d = P[i][j + 1], pts = [];
          edge(a, b, x0 + i * step, y0 + j * step, x0 + (i + 1) * step, y0 + j * step);
          edge(b, cc, x0 + (i + 1) * step, y0 + j * step, x0 + (i + 1) * step, y0 + (j + 1) * step);
          edge(cc, d, x0 + (i + 1) * step, y0 + (j + 1) * step, x0 + i * step, y0 + (j + 1) * step);
          edge(d, a, x0 + i * step, y0 + (j + 1) * step, x0 + i * step, y0 + j * step);
          for (var k = 0; k + 1 < pts.length; k += 2) { ctx.moveTo(X(pts[k][0]), Y(pts[k][1])); ctx.lineTo(X(pts[k + 1][0]), Y(pts[k + 1][1])); }
        }
        ctx.stroke();
        function edge(p1, p2, ax, ay, bx, by) {
          if ((p1 < lev) !== (p2 < lev)) { var q = (lev - p1) / (p2 - p1); pts.push([ax + (bx - ax) * q, ay + (by - ay) * q]); }
        }
      }
      // 이동 경로
      ctx.setLineDash([4, 5]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(-1650), Y(0)); ctx.lineTo(X(1650), Y(0)); ctx.stroke(); ctx.setLineDash([]);
      // 전선
      front(T, thW, 2600, T.figRed, 'warm');
      front(T, thC, 2600, T.figBlue, 'cold');
      function front(T, thf, len, col, kind) {
        var pts = [];
        for (var rr = 0; rr <= len; rr += 20) { var th = thf(rr) * D; pts.push([X(c + rr * Math.cos(th)), Y(rr * Math.sin(th))]); }
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath();
        pts.forEach(function (p, n) { if (n) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke();
        ctx.fillStyle = col;
        var sz = Math.max(5, Math.min(8, r.w / 80)), acc = 0, next = sz * 3;
        for (var n = 1; n < pts.length; n++) {
          var dx = pts[n][0] - pts[n - 1][0], dy = pts[n][1] - pts[n - 1][1], seg = Math.hypot(dx, dy);
          acc += seg;
          if (acc >= next) {
            next += sz * 4.2;
            var tx = dx / seg, ty = dy / seg, nx2 = ty, ny2 = -tx;    // 화면에서 바깥 방향의 왼쪽(시계 반대 방향 쪽) = 기호가 붙는 쪽
            var px = pts[n][0], py = pts[n][1];
            ctx.beginPath();
            if (kind === 'warm') { var ang = Math.atan2(ny2, nx2); ctx.arc(px, py, sz, ang - Math.PI / 2, ang + Math.PI / 2); }
            else { ctx.moveTo(px - tx * sz, py - ty * sz); ctx.lineTo(px + nx2 * sz * 1.5, py + ny2 * sz * 1.5); ctx.lineTo(px + tx * sz, py + ty * sz); }
            ctx.closePath(); ctx.fill();
          }
        }
      }
      // 저기압 중심
      var fs = Math.max(11, Math.min(13, r.w / 34));
      ctx.fillStyle = T.figRed; ctx.font = '700 ' + (fs + 9) + 'px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('L', X(c), Y(0) - 2);
      ctx.font = fs + 'px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textBaseline = 'alphabetic';
      ctx.fillText('저기압', X(c), Y(0) - fs - 8);
      // 이동 방향 화살표
      arrow(X(c) + 18, Y(0) - 12, X(c) + 62, Y(0) - 12, T.figInk, 2);
      ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.fillText('이동(편서풍)', X(c) + 66, Y(0) - 8);
      // 공기 이름
      var wsx = c + 820 * Math.cos(-70 * D), wsy = 820 * Math.sin(-70 * D);
      ctx.textAlign = 'center'; ctx.fillStyle = T.figRed; ctx.font = '600 ' + fs + 'px ' + T.fontBody;
      ctx.fillText('따뜻한 공기', X(wsx), Y(wsy));
      ctx.fillText('(온난 구역)', X(wsx), Y(wsy) + fs + 3);
      ctx.fillStyle = T.figBlue;
      ctx.fillText('찬 공기', X(c - 800), Y(-700));
      ctx.fillText('찬 공기', X(c - 650), Y(520));
      // 전선 이름
      ctx.font = fs + 'px ' + T.fontBody;
      var wt = thW(330) * D; ctx.fillStyle = T.figRed; ctx.textAlign = 'left';
      ctx.fillText('온난 전선', X(c + 330 * Math.cos(wt)) + 8, Y(330 * Math.sin(wt)) - 6);
      var ct = thC(600) * D; ctx.fillStyle = T.figBlue; ctx.textAlign = 'left';
      ctx.fillText('한랭 전선', X(c + 600 * Math.cos(ct)) + 14, Y(600 * Math.sin(ct)));
      // 관측소
      var f0 = at(st.t), sxp = X(st.sx), syp = Y(st.sy);
      var bto = (f0.from + 180) * D, al = 30;
      arrow(sxp - Math.sin(bto) * al / 2, syp + Math.cos(bto) * al / 2, sxp + Math.sin(bto) * al / 2, syp - Math.cos(bto) * al / 2, T.figViolet, 2.6);
      ctx.beginPath(); ctx.arc(sxp, syp, 6, 0, 2 * Math.PI); ctx.fillStyle = T.figPanel; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = T.figViolet; ctx.stroke();
      ctx.fillStyle = T.figViolet; ctx.font = '700 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('관측소 ' + (st.which || ''), sxp + 10, syp + (st.sy < 0 ? fs + 10 : -12));
      // 방위·축척·범례
      ctx.fillStyle = T.figInk; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'center';
      arrow(r.x + r.w - 20, r.y + 44, r.x + r.w - 20, r.y + 14, T.figInk, 1.6);
      ctx.fillText('N', r.x + r.w - 20, r.y + 58);
      var sb = 500 * s, bx = r.x + r.w - sb - 12, by = r.y + r.h - 14;
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + sb, by); ctx.stroke();
      ctx.font = '11px ' + T.fontBody; ctx.fillText('500 km', bx + sb / 2, by - 5);
      ctx.textAlign = 'left'; ctx.fillStyle = T.figMuted;
      ctx.fillText('회색 선: 등압선(4 hPa 간격) · 초록: 비', r.x + 8, r.y + r.h - 8 - (r.w < 420 ? 14 : 0));
      ctx.restore();
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    }
    function arrow(x1, y1, x2, y2, col, lw) {
      var a = Math.atan2(y2 - y1, x2 - x1), hl = 7 + lw;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * hl * 0.6, y2 - Math.sin(a) * hl * 0.6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - hl * Math.cos(a - 0.45), y2 - hl * Math.sin(a - 0.45));
      ctx.lineTo(x2 - hl * Math.cos(a + 0.45), y2 - hl * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
    }
    function drawGraphs(T, r) {
      var gap = 8, h3 = (r.h - 2 * gap) / 3;
      var boxes = [0, 1, 2].map(function (i) { return { x: r.x, y: r.y + i * (h3 + gap), w: r.w, h: h3 }; });
      var L = r.x + 44, R = r.x + r.w - 8;
      function tx(t) { return L + (t / TMAX) * (R - L); }
      line(boxes[0], '기온 (°C)', 4, 20, [4, 8, 12, 16, 20], function (f) { return f.T; }, T.figRed);
      line(boxes[1], '기압 (hPa)', 994, 1018, [996, 1004, 1012], function (f) { return f.p; }, T.figBlue);
      // 풍향·강수
      var b = boxes[2], top = b.y + 18, bot = b.y + b.h - 18;
      frame(b, '풍향(화살표)과 강수(막대)');
      var maxBar = (bot - top) * 0.5;
      series.forEach(function (s) {
        if (!s.f.conv && s.f.strat <= 0.05) return;
        var amt = s.f.conv ? 1 : 0.2 + 0.4 * s.f.strat;
        ctx.fillStyle = T.figGreen;
        ctx.globalAlpha = (s.f.conv ? 1 : 0.5) * (s.t <= st.t ? 1 : 0.4);
        var x = tx(s.t);
        ctx.fillRect(x - (R - L) / TMAX * 0.26, bot - amt * maxBar, (R - L) / TMAX * 0.52, amt * maxBar);
        ctx.globalAlpha = 1;
      });
      var ay = top + (bot - top) * 0.28;
      for (var t = 3; t <= TMAX; t += 6) {
        var f = at(t), x = tx(t), bto = (f.from + 180) * D, al = Math.min(18, (R - L) / 14);
        ctx.globalAlpha = t <= st.t ? 1 : 0.4;
        arrow(x - Math.sin(bto) * al / 2, ay + Math.cos(bto) * al / 2, x + Math.sin(bto) * al / 2, ay - Math.cos(bto) * al / 2, T.figViolet, 1.8);
        ctx.globalAlpha = 1;
      }
      boxes.forEach(function (bb) { now(bb); });
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.font = '11px ' + T.fontMono;
      [0, 15, 30, 45, 60, 75].forEach(function (t) { ctx.fillText(t, tx(t), b.y + b.h - 4); });

      function frame(bb, title) {
        ctx.fillStyle = T.figPaper; ctx.fillRect(L, bb.y + 16, R - L, bb.h - 34);
        ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(title, r.x, bb.y + 12);
      }
      function line(bb, title, lo, hi, ticks, get, col) {
        frame(bb, title);
        var tp = bb.y + 16, bt = bb.y + bb.h - 18;
        function ty(v) { return bt - (v - lo) / (hi - lo) * (bt - tp); }
        ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
        ticks.forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, ty(v)); ctx.lineTo(R, ty(v)); ctx.stroke(); ctx.fillText(v, L - 4, ty(v) + 4); });
        ctx.lineWidth = 1.4; ctx.strokeStyle = col; ctx.globalAlpha = 0.35; path(); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.lineWidth = 2.4; path(true); ctx.stroke();
        function path(past) {
          ctx.beginPath(); var first = true;
          series.forEach(function (s) { if (past && s.t > st.t) return; var x = tx(s.t), y = ty(get(s.f)); if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y); });
        }
      }
      function now(bb) {
        var x = tx(st.t);
        ctx.strokeStyle = T.figAccent; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(x, bb.y + 16); ctx.lineTo(x, bb.y + bb.h - 18); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('시간(h) →', R, boxes[0].y + 12);
    }

    // 지도를 눌러 관측소 옮기기
    cv.canvas.style.cursor = 'crosshair';
    cv.canvas.addEventListener('click', function (e) {
      if (!mapGeom) return;
      var rect = cv.canvas.getBoundingClientRect(), px = e.clientX - rect.left, py = e.clientY - rect.top, m = mapGeom;
      if (px < m.r.x || px > m.r.x + m.r.w || py < m.r.y || py > m.r.y + m.r.h) return;
      var x = (px - m.xc) / m.s, y = m.yMid - (py - m.yc) / m.s;
      setStation(Math.max(-1600, Math.min(1600, x)), Math.max(-1200, Math.min(1200, y)), '');
    });

    api.onResize(draw);
    update();
  },
});
