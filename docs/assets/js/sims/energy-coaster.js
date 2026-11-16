/* 중3-4 운동과 에너지: 롤러코스터의 위치 에너지·운동 에너지 전환과 역학적 에너지 보존(마찰이 있으면 열로 전환) */
Sims.register('energy-coaster', {
  title: '롤러코스터의 에너지 — 위치 에너지 + 운동 에너지 = 일정',
  caption: '\'출발\'을 누르고 차량이 내려가고 올라갈 때 두 에너지 막대가 서로 바뀌는 모습을 보자. 마찰이 없으면 역학적 에너지(위치 에너지 + 운동 에너지)가 늘 같아서 차량은 출발 높이(20 m)까지만 올라갔다 되돌아온다. 마찰을 켜면 역학적 에너지가 점점 줄고, 줄어든 만큼 열에너지가 늘어나 두 막대를 합한 전체 에너지는 그대로이다. 공기 저항과 소리 에너지는 생략했고, 마찰력은 일정하다고 가정했으며, 화면은 실제보다 1.5배 빠르다.',
  init: function (api) {
    var G = 9.8, K = 0.06, RATE = 1.5, H0 = 20;
    // 레일: 꼭짓점(산·골)을 코사인 곡선으로 부드럽게 잇는다 (x, 높이 m)
    var PTS = [[0, 26], [25, 0], [45, 12], [60, 4], [84, 24]];
    var XMAX = PTS[PTS.length - 1][0];
    function seg(x) { for (var i = 0; i < PTS.length - 2; i++) if (x < PTS[i + 1][0]) return i; return PTS.length - 2; }
    function hAt(x) {
      var i = seg(x), a = PTS[i], b = PTS[i + 1], u = (x - a[0]) / (b[0] - a[0]);
      return b[1] + (a[1] - b[1]) * (1 + Math.cos(Math.PI * u)) / 2;
    }
    function slope(x) {
      var i = seg(x), a = PTS[i], b = PTS[i + 1], L = b[0] - a[0], u = (x - a[0]) / L;
      return -(a[1] - b[1]) * Math.PI * Math.sin(Math.PI * u) / (2 * L);
    }
    // 출발점: 첫 내리막에서 높이 20 m인 곳
    var X0 = (function () { var lo = 0, hi = 25; for (var k = 0; k < 60; k++) { var mid = (lo + hi) / 2; if (hAt(mid) > H0) lo = mid; else hi = mid; } return (lo + hi) / 2; })();

    var state = { mass: 500, friction: false, x: X0, v: 0, heat: 0, stopped: false };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.66; }, label: '롤러코스터 레일 위 차량과 위치·운동·역학적·열에너지 막대' });
    var ctx = cv.ctx;

    var rH = api.readout('높이');
    var rV = api.readout('속력');
    var rE = api.readout('역학적 에너지');
    var rQ = api.readout('열로 바뀐 에너지');

    var playBtn = api.button(api.reduced ? '1초 진행' : '출발', function () { toggle(); }, { primary: true });
    api.button('처음으로', function () { reset(); });
    var fricBtn = api.button('마찰 없음', function () {
      state.friction = !state.friction;
      fricBtn.setAttribute('aria-pressed', state.friction ? 'true' : 'false');
      fricBtn.textContent = state.friction ? '마찰 있음' : '마찰 없음';
      reset();
    }, { toggle: true, pressed: false });
    api.slider({ id: 'energy-coaster-mass', label: '차량 질량', min: 200, max: 1000, step: 100, value: state.mass,
      format: function (v) { return v + ' kg'; }, onInput: function (v) { state.mass = v; reset(); } });

    function E0() { return G * state.mass * H0; }
    function emech() { return E0() - state.heat; }
    function reset() { loop.pause(); state.x = X0; state.v = 0; state.heat = 0; state.stopped = false; if (!api.reduced) playBtn.textContent = '출발'; readouts(); draw(); }
    function toggle() {
      if (api.reduced) { advance(1); readouts(); draw(); return; }
      if (loop.wanted) { loop.pause(); playBtn.textContent = '계속'; return; }
      if (state.stopped) reset();
      loop.play(); playBtn.textContent = '멈춤';
    }

    function step(dt) {
      if (state.stopped) return;
      var s = slope(state.x), c = Math.sqrt(1 + s * s), sinT = s / c;
      var a = -G * sinT;
      if (state.friction) {
        if (Math.abs(state.v) < 0.05 && Math.abs(G * sinT) <= K * G) { state.v = 0; state.stopped = true; return; }
        var dir = state.v !== 0 ? Math.sign(state.v) : -Math.sign(sinT);
        a -= dir * K * G;
      }
      var vOld = state.v;
      state.v += a * dt;
      if (state.friction && vOld !== 0 && Math.sign(state.v) !== Math.sign(vOld)) state.v = 0;  // 마찰은 방향을 뒤집지 못한다
      var ds = state.v * dt;
      state.x += ds / c;
      if (state.friction) state.heat += K * G * state.mass * Math.abs(ds);
      // 에너지 보존을 정확히 맞춘다: 속력의 크기는 (역학적 에너지 − 위치 에너지)로 정한다
      var ke = emech() - G * state.mass * hAt(state.x);
      if (ke <= 0) state.v = 0;
      else if (state.v !== 0) state.v = Math.sign(state.v) * Math.sqrt(2 * ke / state.mass);
    }
    function advance(sec) { var n = Math.ceil(sec / 0.002); for (var i = 0; i < n; i++) step(sec / n); }

    var loop = api.loop(function (dt) {
      advance(dt * RATE);
      if (state.stopped) { loop.pause(); playBtn.textContent = '출발'; }
      readouts(); draw();
    });
    loop.pause();

    function fmtJ(e) { return Math.round(e).toLocaleString('ko-KR') + ' J'; }
    function readouts() {
      var h = hAt(state.x);
      rH.set(h.toFixed(1) + ' m');
      rV.set(Math.abs(state.v).toFixed(1) + ' m/s');
      rE.set(fmtJ(emech()));
      rQ.set(fmtJ(state.heat));
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var sceneH = narrow ? h * 0.48 : h * 0.6;
      drawTrack(T, { x: 0, y: 0, w: w, h: sceneH }, narrow);
      drawBars(T, { x: 0, y: sceneH + 6, w: w, h: h - sceneH - 6 }, narrow);
    }

    function drawTrack(T, r, narrow) {
      var L = r.x + 44, R = r.x + r.w - 10, Tp = r.y + 16, B = r.y + r.h - 18;
      var sx = function (x) { return L + x / XMAX * (R - L); };
      var sy = function (hh) { return B - hh / 26 * (B - Tp); };
      // 높이 눈금
      ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right'; ctx.lineWidth = 1;
      for (var hh = 0; hh <= 25; hh += 5) {
        ctx.strokeStyle = T.rule; ctx.beginPath(); ctx.moveTo(L, sy(hh)); ctx.lineTo(R, sy(hh)); ctx.stroke();
        ctx.fillStyle = T.figMuted; ctx.fillText(hh + ' m', L - 5, sy(hh) + 4);
      }
      // 출발 높이 선
      ctx.setLineDash([6, 4]); ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(L, sy(H0)); ctx.lineTo(R, sy(H0)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figBlue; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(narrow ? '출발 높이 20 m' : '출발 높이 20 m — 마찰이 없으면 여기까지 올라간다', sx(52), sy(H0) - 6);
      // 레일
      ctx.beginPath();
      for (var i = 0; i <= 300; i++) { var x = XMAX * i / 300; if (i) ctx.lineTo(sx(x), sy(hAt(x))); else ctx.moveTo(sx(x), sy(hAt(x))); }
      ctx.lineTo(sx(XMAX), B); ctx.lineTo(sx(0), B); ctx.closePath();
      ctx.fillStyle = T.figSoftTeal; ctx.fill();
      ctx.beginPath();
      for (i = 0; i <= 300; i++) { var x2 = XMAX * i / 300; if (i) ctx.lineTo(sx(x2), sy(hAt(x2))); else ctx.moveTo(sx(x2), sy(hAt(x2))); }
      ctx.strokeStyle = T.figTeal; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('기준면(높이 0)', sx(27), B + 13);
      // 차량 (실제 높이와 가로 거리의 비율은 같게 그리지 않은 모식도)
      var cx = sx(state.x), cy = sy(hAt(state.x));
      var ang = Math.atan2(sy(hAt(state.x + 0.5)) - sy(hAt(state.x - 0.5)), sx(state.x + 0.5) - sx(state.x - 0.5));
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
      ctx.beginPath(); roundRect(-15, -20, 30, 15, 4);
      ctx.fillStyle = T.figRed; ctx.fill();
      ctx.fillStyle = T.figInk;
      ctx.beginPath(); ctx.arc(-8, -4, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(8, -4, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      if (state.stopped) {
        ctx.fillStyle = T.figAmber; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('멈춤: 역학적 에너지가 열로 바뀌었다', cx, cy - 30);
      }
    }

    function drawBars(T, r, narrow) {
      var e0 = E0(), m = state.mass, hNow = hAt(state.x);
      var pe = G * m * hNow, ke = Math.max(0, emech() - pe);
      var rows = [
        { name: '위치 에너지', f: '9.8mh', parts: [[pe, T.figBlue]] },
        { name: '운동 에너지', f: '½mv²', parts: [[ke, T.figRed]] },
        { name: '역학적 에너지', f: '위치 + 운동', parts: [[pe, T.figBlue], [ke, T.figRed]] },
        { name: '열에너지', f: '마찰로 생김', parts: [[state.heat, T.figAmber]] },
      ];
      var labW = narrow ? 0 : 170, valW = narrow ? 0 : 84;
      var rowH = r.h / rows.length;
      var bx = r.x + 44 + labW, bw = r.x + r.w - 10 - valW - bx;
      rows.forEach(function (row, i) {
        var y = r.y + i * rowH, barY, barH = Math.min(18, rowH * 0.36);
        var total = row.parts.reduce(function (s, p) { return s + p[0]; }, 0);
        ctx.textAlign = 'left';
        if (narrow) {
          ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.fillText(row.name, bx, y + 14);
          var nw = ctx.measureText(row.name).width;
          ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.fillText(row.f, bx + nw + 6, y + 14);
          ctx.textAlign = 'right'; ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontMono; ctx.fillText(fmtJ(total), r.x + r.w - 10, y + 14);
          barY = y + 20;
        } else {
          barY = y + (rowH - barH) / 2;
          ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.fillText(row.name, r.x + 44, barY + barH / 2 - 1);
          ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.fillText(row.f, r.x + 44, barY + barH / 2 + 13);
          ctx.textAlign = 'right'; ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontMono; ctx.fillText(fmtJ(total), r.x + r.w - 10, barY + barH / 2 + 4);
        }
        ctx.fillStyle = T.figPaper; ctx.fillRect(bx, barY, bw, barH);
        var acc = 0;
        row.parts.forEach(function (p) { var pw = bw * p[0] / e0; ctx.fillStyle = p[1]; ctx.fillRect(bx + acc, barY, pw, barH); acc += pw; });
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(bx, barY, bw, barH);
      });
      // 처음 역학적 에너지 표시
      ctx.setLineDash([4, 3]); ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(bx + bw, r.y + 2); ctx.lineTo(bx + bw, r.y + r.h - 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('막대 끝 = 처음 역학적 에너지 ' + fmtJ(e0), bx + bw - 4, r.y + r.h - 2);
    }
    function roundRect(x, y, w, h, rr) { ctx.moveTo(x + rr, y); ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr); ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath(); }

    api.onResize(draw);
    readouts(); draw();
  },
});
