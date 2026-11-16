/* 중1-4 물질의 상태 변화: 열을 가하거나 빼앗으면 입자 모형과 가열(냉각) 곡선이 함께 변한다. 상태 변화 중에는 온도가 일정하다 */
Sims.register('state-change', {
  title: '얼음에 열을 가하면 — 입자 모형과 가열 곡선',
  caption: '‘열 가하기’를 누르고 −20 °C 얼음이 수증기가 될 때까지 지켜본 뒤, ‘열 빼앗기’로 거꾸로 식혀 보자. 녹는 동안(0 °C)과 끓는 동안(100 °C)에는 열이 계속 들어가는데도 온도가 일정하다. 이때 열은 입자 배열을 바꾸는 데 쓰이고, 식힐 때는 같은 온도에서 열이 나온다. 1기압에서 같은 세기로 가열한다고 가정했으며, 입자 수·크기와 구간 길이는 모식적이다(실제 끓는 구간은 물을 0 °C에서 100 °C로 데우는 구간보다 5배쯤 길다. 물이 얼 때 부피가 조금 커지는 것은 나타내지 않았다).',
  init: function (api) {
    // ── 에너지(가한 열의 양, 임의 단위)와 온도의 관계: 구간 길이는 모식적 ──
    var E1 = 0.5, E2 = 3.5, E3 = 7.5, E4 = 16.5, EMAX = 17, RATE = 0.6;
    function tempOf(E) {
      if (E < E1) return -20 + 40 * E;
      if (E < E2) return 0;
      if (E < E3) return (E - E2) * 25;
      if (E < E4) return 100;
      return 100 + (E - E4) * 40;
    }
    function phaseOf(E) {   // 0 고체, 1 고체+액체, 2 액체, 3 액체+기체, 4 기체
      if (E < E1) return 0;
      if (E < E2) return E <= E1 + 1e-9 ? 0 : 1;
      if (E < E3) return 2;
      if (E < E4) return E <= E3 + 1e-9 ? 2 : 3;
      return 4;
    }
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

    // ── 입자 상자(단위: 입자 지름 = 1) ──
    var BW = 10, BH = 13, COLS = 6, ROWS = 5, N = COLS * ROWS;
    var sites = [];
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++)
      sites.push({ x: BW / 2 - (COLS - 1) / 2 + c, y: BH - 0.5 - r });   // 아래 줄부터
    var P = [];
    function resetParticles() {
      P = sites.map(function (s, i) {
        return { x: s.x, y: s.y, vx: 0, vy: 0, mode: 'S', site: i, ph1: Math.random() * 6.28, ph2: Math.random() * 6.28 };
      });
    }

    var st = { E: 0, dir: 0, t: 0, simT: 0, hist: [{ t: 0, T: -20, ph: 0 }], sampleAcc: 0 };
    resetParticles();

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.32 : 0.5; }, label: '물 입자 모형과 시간에 따른 온도 그래프' });
    var ctx = cv.ctx;

    var rT = api.readout('온도');
    var rS = api.readout('상태');
    var rQ = api.readout('열에너지');
    var rW = api.readout('열이 하는 일');

    var g = api.group();
    var bHeat = api.button('열 가하기', function () { setDir(1); }, { toggle: true, parent: g, primary: true });
    var bStop = api.button('멈추기', function () { setDir(0); }, { toggle: true, pressed: true, parent: g });
    var bCool = api.button('열 빼앗기', function () { setDir(-1); }, { toggle: true, parent: g });
    api.button('처음으로 (−20 °C 얼음)', function () {
      st.E = 0; st.t = 0; st.hist = [{ t: 0, T: -20, ph: 0 }]; resetParticles(); setDir(0);
    });

    function syncBtns() {
      bHeat.setAttribute('aria-pressed', st.dir === 1 ? 'true' : 'false');
      bStop.setAttribute('aria-pressed', st.dir === 0 ? 'true' : 'false');
      bCool.setAttribute('aria-pressed', st.dir === -1 ? 'true' : 'false');
    }
    function setDir(d) {
      if (api.reduced && d !== 0) {
        // 움직임 줄이기: 한 번 누를 때마다 한 단계씩 진행하고 바로 결과를 그린다
        var target = clamp(st.E + d * 1, 0, EMAX), steps = 20;
        var dE = (target - st.E) / steps;
        for (var i = 0; i < steps; i++) { st.E += dE; st.t += Math.abs(dE) / RATE; record(true); }
        st.dir = d; assign(); for (var k = 0; k < 240; k++) physics(1 / 120);
        st.lastDir = d; st.dir = 0; syncBtns(); draw(); return;
      }
      st.dir = d; syncBtns();
      if (d !== 0 && ((d > 0 && st.E >= EMAX) || (d < 0 && st.E <= 0))) { st.dir = 0; syncBtns(); }
      draw();
    }
    function record(force) {
      var T = tempOf(st.E), ph = phaseOf(st.E), last = st.hist[st.hist.length - 1];
      if (force || st.t - last.t >= 0.1) st.hist.push({ t: st.t, T: T, ph: ph });
      if (st.hist.length > 4000) st.hist = st.hist.filter(function (h, i) { return i % 2 === 0 || i === st.hist.length - 1; });
    }

    // ── 상태(모드) 배정: 녹는 비율·기화 비율에 맞춰 입자 몇 개를 고체/액체/기체로 둘지 정한다 ──
    function counts() {
      var fm = clamp((st.E - E1) / (E2 - E1), 0, 1), fv = clamp((st.E - E3) / (E4 - E3), 0, 1);
      var nG = Math.round(fv * N), nS = st.E <= E3 ? Math.round((1 - fm) * N) : 0;
      return { nS: nS, nG: nG };
    }
    function assign() {
      var want = counts(), T = tempOf(st.E), vg = gasSpeed(T);
      var nS = P.filter(function (p) { return p.mode === 'S'; }).length;
      var nG = P.filter(function (p) { return p.mode === 'G'; }).length;
      var guard = 0;
      while (nS > want.nS && guard++ < 100) {          // 녹기: 맨 위 줄부터
        var top = P.filter(function (p) { return p.mode === 'S' && p.site === nS - 1; })[0];
        top.mode = 'L'; top.vx = (Math.random() - 0.5); top.vy = -0.5; nS--;
      }
      while (nS < want.nS && guard++ < 200) {          // 얼기: 맨 아래 빈자리부터, 가장 가까운 액체 입자가 들어간다
        var s = sites[nS], best = null, bd = 1e9;
        P.forEach(function (p) { if (p.mode === 'L') { var d = (p.x - s.x) * (p.x - s.x) + (p.y - s.y) * (p.y - s.y); if (d < bd) { bd = d; best = p; } } });
        if (!best) P.forEach(function (p) { if (p.mode === 'G' && !best) best = p; });
        if (!best) break;
        if (best.mode === 'G') nG--;
        best.mode = 'S'; best.site = nS; best.vx = 0; best.vy = 0; nS++;
      }
      while (nG < want.nG && guard++ < 300) {          // 기화: 액체 표면(가장 위)의 입자부터
        var up = null;
        P.forEach(function (p) { if (p.mode === 'L' && (!up || p.y < up.y)) up = p; });
        if (!up) break;
        up.mode = 'G'; var a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
        up.vx = Math.cos(a) * vg; up.vy = Math.sin(a) * vg; nG++;
      }
      while (nG > want.nG && guard++ < 400) {          // 액화: 액체에 가장 가까운(가장 아래) 기체 입자부터
        var low = null;
        P.forEach(function (p) { if (p.mode === 'G' && (!low || p.y > low.y)) low = p; });
        if (!low) break;
        low.mode = 'L'; low.vx *= 0.15; low.vy = Math.abs(low.vy) * 0.15; nG--;
      }
    }
    function gasSpeed(T) { return 7.5 * Math.sqrt((T + 273) / 373); }

    // ── 입자 운동 ──
    function physics(h) {
      st.simT += h;
      var T = tempOf(st.E), vg = gasSpeed(T);
      var amp = 0.05 + 0.1 * clamp((T + 20) / 20, 0, 1);
      var sig = 5 + 3 * clamp(T / 100, 0, 1), damp = Math.exp(-3 * h);
      for (var i = 0; i < N; i++) {
        var p = P[i];
        if (p.mode === 'S') {
          var s = sites[p.site];
          var tx = s.x + amp * Math.sin(17 * st.simT + p.ph1), ty = s.y + amp * Math.cos(19 * st.simT + p.ph2);
          var k = Math.min(1, h * 9);
          p.x += (tx - p.x) * k; p.y += (ty - p.y) * k;
        } else if (p.mode === 'L') {
          p.vy += 20 * h;
          p.vx += (Math.random() - 0.5) * sig * Math.sqrt(h) * 2.2;
          p.vy += (Math.random() - 0.5) * sig * Math.sqrt(h) * 2.2;
          p.vx *= damp; p.vy *= damp;
          p.x += p.vx * h; p.y += p.vy * h;
        } else {
          var sp = Math.hypot(p.vx, p.vy) || 1, f = Math.pow(vg / sp, Math.min(1, h * 3));
          p.vx *= f; p.vy *= f;
          p.x += p.vx * h; p.y += p.vy * h;
        }
      }
      // 겹침 풀기: 액체끼리, 액체–고체, 기체–(고체·액체)
      for (var a = 0; a < N; a++) {
        var A = P[a];
        for (var b = a + 1; b < N; b++) {
          var B = P[b];
          if (A.mode === 'S' && B.mode === 'S') continue;
          var dx = B.x - A.x, dy = B.y - A.y, d2 = dx * dx + dy * dy;
          if (d2 >= 1 || d2 === 0) continue;
          var d = Math.sqrt(d2), nx = dx / d, ny = dy / d, ov = 1 - d;
          var gA = A.mode === 'G', gB = B.mode === 'G';
          if (gA && gB) {                     // 기체끼리: 탄성 충돌(같은 질량)
            A.x -= nx * ov / 2; A.y -= ny * ov / 2; B.x += nx * ov / 2; B.y += ny * ov / 2;
            var rv = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
            if (rv < 0) { A.vx += rv * nx; A.vy += rv * ny; B.vx -= rv * nx; B.vy -= rv * ny; }
            continue;
          }
          if (gA || gB) {                     // 기체 입자는 튕겨 나간다
            var G = gA ? A : B, sgn = gA ? -1 : 1;
            G.x += sgn * nx * ov; G.y += sgn * ny * ov;
            var vn = G.vx * nx + G.vy * ny;
            if (vn * sgn < 0) { G.vx -= 2 * vn * nx; G.vy -= 2 * vn * ny; }
            continue;
          }
          var wA = A.mode === 'S' ? 0 : (B.mode === 'S' ? 1 : 0.5), wB = 1 - wA;
          if (A.mode === 'S') { wA = 0; wB = 1; }
          A.x -= nx * ov * wA; A.y -= ny * ov * wA; B.x += nx * ov * wB; B.y += ny * ov * wB;
          var rel = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
          if (rel < 0) {
            A.vx += nx * rel * wA; A.vy += ny * rel * wA; B.vx -= nx * rel * wB; B.vy -= ny * rel * wB;
          }
        }
      }
      for (var j = 0; j < N; j++) {
        var q = P[j]; if (q.mode === 'S') continue;
        if (q.x < 0.5) { q.x = 0.5; q.vx = Math.abs(q.vx); }
        if (q.x > BW - 0.5) { q.x = BW - 0.5; q.vx = -Math.abs(q.vx); }
        if (q.y < 0.5) { q.y = 0.5; q.vy = Math.abs(q.vy); }
        if (q.y > BH - 0.5) { q.y = BH - 0.5; q.vy = q.mode === 'G' ? -Math.abs(q.vy) : -Math.abs(q.vy) * 0.3; }
      }
    }

    var loop = api.loop(function (dt) {
      if (st.dir !== 0) {
        st.E = clamp(st.E + st.dir * RATE * dt, 0, EMAX);
        st.t += dt; record(false);
        if (st.E <= 0 || st.E >= EMAX) { record(true); st.lastDir = st.dir; st.dir = 0; syncBtns(); }
        else st.lastDir = st.dir;
      }
      assign();
      var n = Math.max(1, Math.round(dt / (1 / 120)));
      for (var i = 0; i < n; i++) physics(dt / n);
      draw();
    });

    // ── 그리기 ──
    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { box: { x: 0, y: 0, w: w, h: h * 0.47 }, graph: { x: 0, y: h * 0.49, w: w, h: h * 0.51 }, narrow: true };
      return { box: { x: 0, y: 0, w: w * 0.36, h: h }, graph: { x: w * 0.38, y: 0, w: w * 0.62, h: h }, narrow: false };
    }
    function stateText(E, dir) {
      var ph = phaseOf(E);
      if (ph === 0) return '얼음(고체)';
      if (ph === 2) return '물(액체)';
      if (ph === 4) return '수증기(기체)';
      if (ph === 1) return dir < 0 ? '얼음 + 물 · 응고 중' : dir > 0 ? '얼음 + 물 · 융해 중' : '얼음 + 물';
      return dir < 0 ? '물 + 수증기 · 액화 중' : dir > 0 ? '물 + 수증기 · 기화(끓음) 중' : '물 + 수증기';
    }
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawBox(T, L.box, L.narrow);
      drawGraph(T, L.graph);
      readouts();
    }
    function drawBox(T, r, narrow) {
      var top = r.y + 26, bottom = r.y + r.h - 34;
      var sc = Math.min((bottom - top) / BH, (r.w - 24) / BW);
      var bw = BW * sc, bh = BH * sc, x0 = r.x + (r.w - bw) / 2, y0 = top;
      var dir = st.dir !== 0 ? st.dir : 0;
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(stateText(st.E, dir), r.x + r.w / 2, r.y + 16);
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.rect(x0, y0, bw, bh); ctx.fill(); ctx.stroke();
      var rad = Math.max(3, sc * 0.42);
      var col = { S: [T.figSoftBlue, T.figBlue], L: [T.figSoftTeal, T.figTeal], G: [T.figSoftRed, T.figRed] };
      P.forEach(function (p) {
        var px = x0 + p.x * sc, py = y0 + p.y * sc;
        if (p.mode === 'G') {   // 빠르기를 보여 주는 꼬리
          var sp = Math.hypot(p.vx, p.vy) || 1;
          ctx.strokeStyle = T.figRed; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - p.vx / sp * sc * 1.1, py - p.vy / sp * sc * 1.1); ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fillStyle = col[p.mode][0]; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = col[p.mode][1]; ctx.stroke();
      });
      // 열의 출입 표시
      var ay = y0 + bh + 6, cx = x0 + bw / 2;
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      if (st.dir > 0) {
        [-0.3, 0, 0.3].forEach(function (k) { arrow(cx + k * bw, ay + 20, cx + k * bw, ay + 2, T.figRed); });
        ctx.fillStyle = T.figRed; ctx.textAlign = 'left'; ctx.fillText('열 흡수', cx + 0.3 * bw + 10, ay + 16);
      } else if (st.dir < 0) {
        [-0.3, 0, 0.3].forEach(function (k) { arrow(cx + k * bw, ay + 2, cx + k * bw, ay + 20, T.figBlue); });
        ctx.fillStyle = T.figBlue; ctx.textAlign = 'left'; ctx.fillText('열 방출', cx + 0.3 * bw + 10, ay + 16);
      } else {
        ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.fillText('열의 출입 없음', cx, ay + 16);
      }
    }
    function arrow(x1, y1, x2, y2, c) {
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2 + (y2 < y1 ? 6 : -6)); ctx.stroke();
      var s = y2 < y1 ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 5, y2 + 8 * s); ctx.lineTo(x2 + 5, y2 + 8 * s); ctx.closePath(); ctx.fill();
    }
    function drawGraph(T, r) {
      var Lx = r.x + 46, R = r.x + r.w - 12, Tp = r.y + 14, B = r.y + r.h - 44;
      var tmax = Math.max(32, Math.ceil((st.t + 2) / 8) * 8);
      var sx = function (t) { return Lx + (t / tmax) * (R - Lx); };
      var sy = function (v) { return B - ((v + 20) / 140) * (B - Tp); };
      ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      [-20, 0, 20, 40, 60, 80, 100, 120].forEach(function (v) {
        ctx.strokeStyle = T.rule; ctx.setLineDash([]);
        if (v === 0 || v === 100) { ctx.strokeStyle = T.figLine; ctx.setLineDash([5, 4]); }
        ctx.beginPath(); ctx.moveTo(Lx, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke();
        ctx.fillStyle = T.figMuted; ctx.fillText(v, Lx - 6, sy(v) + 4);
      });
      ctx.setLineDash([]);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(Lx, Tp); ctx.lineTo(Lx, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('시간 →', R, B + 18);
      ctx.textAlign = 'left'; ctx.fillText('온도 (°C)', Lx + 4, Tp + 4);
      // 곡선: 온도가 변하는 구간은 파란색, 상태 변화 중(온도 일정)은 굵은 빨간색
      var H = st.hist;
      for (var i = 1; i < H.length; i++) {
        var a = H[i - 1], b = H[i], plat = (b.ph === 1 || b.ph === 3) && a.T === b.T;
        ctx.strokeStyle = plat ? T.figRed : T.figAccent; ctx.lineWidth = plat ? 4.5 : 2.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sx(a.t), sy(a.T)); ctx.lineTo(sx(b.t), sy(b.T)); ctx.stroke();
      }
      ctx.lineCap = 'butt';
      var last = H[H.length - 1];
      ctx.beginPath(); ctx.arc(sx(last.t), sy(last.T), 5, 0, Math.PI * 2);
      ctx.fillStyle = T.figPanel; ctx.fill(); ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.stroke();
      // 범례·안내
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      var ly = B + 18;
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(Lx, ly - 4); ctx.lineTo(Lx + 18, ly - 4); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.fillText('상태 변화 중(온도 일정)', Lx + 24, ly);
      ctx.fillText('0 °C 융해·응고 · 100 °C 기화(끓음)·액화', Lx, ly + 16);
      if (H.length < 2) {
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('‘열 가하기’를 누르면 그래프가 그려진다', (Lx + R) / 2, sy(50));
      }
    }
    function readouts() {
      var T = tempOf(st.E), ph = phaseOf(st.E), plat = ph === 1 || ph === 3;
      rT.set((Math.round(T * 10) / 10).toFixed(0) + ' °C');
      rS.set(stateText(st.E, st.dir));
      var d = st.dir !== 0 ? st.dir : (api.reduced ? st.lastDir || 0 : 0);
      rQ.set(d > 0 ? '흡수' : d < 0 ? '방출' : '출입 없음');
      if (d > 0) rW.set(plat ? '입자 배열을 바꾼다 → 온도 일정' : '입자 운동을 활발하게 → 온도 상승');
      else if (d < 0) rW.set(plat ? '입자가 모이며 열을 내놓는다 → 온도 일정' : '입자 운동이 둔해진다 → 온도 하강');
      else rW.set('–');
    }

    api.onResize(draw);
    if (api.reduced) { for (var k = 0; k < 60; k++) physics(1 / 120); }
    draw();
  },
});
