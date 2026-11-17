/* 일반지구과학 3 진앙 결정: 세 관측소의 PS시 → 진원 거리 원 → 공통 현이 만나는 점이 진앙, 겹침으로 진원 깊이 */
Sims.register('u-epicenter', {
  title: '세 관측소로 진앙 찾기 — PS시, 원, 그리고 공통 현',
  caption: '지도 위를 눌러(끌어) 진앙을 옮기고 진원 깊이를 바꿔 보자. 각 관측소는 PS시 Δt로 진원 거리 d = kΔt(k = 8.0 km/s)만 알 수 있어 원을 그린다. 진원이 얕으면 세 원이 한 점(진앙)에서 만나고, 깊으면 원이 커져 서로 겹치는데 두 원씩의 공통 현(점선) 세 개는 여전히 진앙 한 점에서 만난다. 그 점과 원의 반지름으로 깊이 h = √(d² − 진앙 거리²)를 구한다. P파 6.0 km/s, S파 약 3.43 km/s인 균질한 지각과 평평한 지표를 가정했다.',
  init: function (api) {
    var VP = 6.0, VS = 6.0 / 1.75, K = VP * VS / (VP - VS);   // K = 8.0 km/s
    var ST = [{ n: 'A', x: 0, y: 0 }, { n: 'B', x: 72, y: 0 }, { n: 'C', x: 0, y: 112 }];
    var X0 = -25, X1 = 135, Y0 = -25, Y1 = 135;
    var state = { ex: 30, ey: 40, h: 0, chords: true };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.72 : 0.58; }, label: '관측소 세 곳의 지도와 지진 기록' });
    var ctx = cv.ctx, canvas = cv.canvas;
    canvas.style.touchAction = 'none';
    var rPS = api.readout('PS시 (A, B, C)');
    var rD = api.readout('진원 거리 d = kΔt');
    var rE = api.readout('공통 현으로 구한 진앙');
    var rH = api.readout('구한 진원 깊이');

    api.slider({ id: 'u-epicenter-h', label: '진원 깊이', min: 0, max: 40, step: 1, value: 0,
      format: function (v) { return v + ' km'; }, onInput: function (v) { state.h = v; draw(); } });
    var cb = api.button('공통 현 보이기', function () { state.chords = !state.chords; cb.setAttribute('aria-pressed', state.chords ? 'true' : 'false'); draw(); }, { toggle: true, pressed: true });
    api.button('예제 2 (30, 40)', function () { state.ex = 30; state.ey = 40; draw(); });
    api.button('새 지진', function () { state.ex = Math.round(-5 + Math.random() * 100); state.ey = Math.round(-5 + Math.random() * 110); draw(); }, { primary: true });

    function layout() {
      var w = cv.w, h = cv.h, mob = w < 560;
      var ms = mob ? Math.min(w, h * 0.58) : Math.min(h, w * 0.56);
      var map = { x: mob ? (w - ms) / 2 : 0, y: 0, s: ms };
      var seis = mob ? { x: 0, y: ms + 10, w: w, h: h - ms - 10 } : { x: ms + 16, y: 0, w: w - ms - 16, h: h };
      return { map: map, seis: seis };
    }
    function toPx(m, x, y) { var pad = 26, s = m.s - 2 * pad; return [m.x + pad + (x - X0) / (X1 - X0) * s, m.y + pad + (Y1 - y) / (Y1 - Y0) * s]; }
    function fromPx(m, px, py) { var pad = 26, s = m.s - 2 * pad; return [X0 + (px - m.x - pad) / s * (X1 - X0), Y1 - (py - m.y - pad) / s * (Y1 - Y0)]; }
    function kmPx(m) { return (m.s - 52) / (X1 - X0); }

    var dragging = false;
    function setFromEvent(e) {
      var r = canvas.getBoundingClientRect(), L = layout(), q = fromPx(L.map, e.clientX - r.left, e.clientY - r.top);
      if (q[0] < X0 || q[0] > X1 || q[1] < Y0 || q[1] > Y1) return false;
      state.ex = Math.round(q[0]); state.ey = Math.round(q[1]); draw(); return true;
    }
    canvas.addEventListener('pointerdown', function (e) { if (setFromEvent(e)) { dragging = true; try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ } } });
    canvas.addEventListener('pointermove', function (e) { if (dragging) setFromEvent(e); });
    ['pointerup', 'pointercancel'].forEach(function (ev) { canvas.addEventListener(ev, function () { dragging = false; }); });

    function compute() {
      return ST.map(function (s) {
        var de = Math.hypot(state.ex - s.x, state.ey - s.y), D = Math.hypot(de, state.h);
        var ps = Math.round(D / K * 100) / 100;   // 0.01 s까지 읽은 PS시
        return { s: s, de: de, D: K * ps, ps: ps, tp: D / VP, ts: D / VS };
      });
    }
    // 공통 현(근축)들의 교점: 두 원 방정식의 차는 일차식
    function radical(c) {
      var a = c[0], b = c[1], d = c[2];
      function line(p, q) { return [2 * (q.s.x - p.s.x), 2 * (q.s.y - p.s.y), p.D * p.D - q.D * q.D + q.s.x * q.s.x - p.s.x * p.s.x + q.s.y * q.s.y - p.s.y * p.s.y]; }
      var l1 = line(a, b), l2 = line(a, d), det = l1[0] * l2[1] - l1[1] * l2[0];
      var x = (l1[2] * l2[1] - l1[1] * l2[2]) / det, y = (l1[0] * l2[2] - l1[2] * l2[0]) / det;
      return [x, y];
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, L = layout(), m = L.map;
      ctx.clearRect(0, 0, w, h);
      var c = compute(), E = radical(c), kp = kmPx(m);
      var hEst = Math.sqrt(Math.max(0, c[0].D * c[0].D - Math.pow(E[0] - ST[0].x, 2) - Math.pow(E[1] - ST[0].y, 2)));
      // 지도 바탕과 격자
      var p0 = toPx(m, X0, Y1), p1 = toPx(m, X1, Y0);
      ctx.fillStyle = T.figPaper; ctx.fillRect(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1]);
      ctx.save(); ctx.beginPath(); ctx.rect(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1]); ctx.clip();
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      for (var g = -20; g <= 130; g += 20) {
        var a1 = toPx(m, g, Y0), a2 = toPx(m, g, Y1); ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke();
        var b1 = toPx(m, X0, g), b2 = toPx(m, X1, g); ctx.beginPath(); ctx.moveTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke();
      }
      var cols = [T.figBlue, T.figGreen, T.figViolet];
      // 원
      c.forEach(function (o, i) {
        var q = toPx(m, o.s.x, o.s.y);
        ctx.beginPath(); ctx.arc(q[0], q[1], o.D * kp, 0, Math.PI * 2);
        ctx.fillStyle = cols[i]; ctx.globalAlpha = 0.07; ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = cols[i]; ctx.lineWidth = 2; ctx.stroke();
      });
      // 공통 현
      if (state.chords) {
        [[0, 1], [0, 2], [1, 2]].forEach(function (pr) {
          var A = c[pr[0]], B = c[pr[1]], dx = B.s.x - A.s.x, dy = B.s.y - A.s.y, dd = Math.hypot(dx, dy);
          var t = (A.D * A.D - B.D * B.D + dd * dd) / (2 * dd), hh2 = A.D * A.D - t * t;
          var mx = A.s.x + dx / dd * t, my = A.s.y + dy / dd * t, ux = -dy / dd, uy = dx / dd;
          var half = hh2 > 0 ? Math.sqrt(hh2) : 0;
          // 현(두 원의 교점 사이)은 실선, 연장선은 점선
          var e1 = toPx(m, mx - ux * 300, my - uy * 300), e2 = toPx(m, mx + ux * 300, my + uy * 300);
          ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.stroke(); ctx.setLineDash([]);
          if (half > 0) {
            var c1 = toPx(m, mx - ux * half, my - uy * half), c2 = toPx(m, mx + ux * half, my + uy * half);
            ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c1[0], c1[1]); ctx.lineTo(c2[0], c2[1]); ctx.stroke();
          }
        });
      }
      ctx.restore();
      ctx.strokeStyle = T.figLine; ctx.strokeRect(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1]);
      // 눈금
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      [0, 40, 80, 120].forEach(function (v) { var q = toPx(m, v, Y0); ctx.fillText(v, q[0], q[1] + 13); });
      ctx.textAlign = 'right';
      [0, 40, 80, 120].forEach(function (v) { var q = toPx(m, X0, v); ctx.fillText(v, q[0] - 4, q[1] + 4); });
      ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody; ctx.fillText('km', p1[0] - 18, p1[1] + 13);
      // 관측소
      c.forEach(function (o, i) {
        var q = toPx(m, o.s.x, o.s.y);
        ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.moveTo(q[0], q[1] - 9); ctx.lineTo(q[0] - 8, q[1] + 6); ctx.lineTo(q[0] + 8, q[1] + 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText(o.s.n, q[0] + 9, q[1] - 6);
      });
      // 진앙(별)과 구한 진앙(+)
      var ep = toPx(m, state.ex, state.ey);
      star(ep[0], ep[1], 9, T.figRed, T);
      var ee = toPx(m, E[0], E[1]);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ee[0], ee[1], 13, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('진앙', ee[0] + 15, ee[1] + 4);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('지도를 누르거나 끌어 진앙 옮기기', m.x + m.s / 2, m.y + 14);
      drawSeis(T, L.seis, c, cols);
      rPS.set(c.map(function (o) { return o.ps.toFixed(2); }).join(', ') + ' s');
      rD.set(c.map(function (o) { return o.D.toFixed(0); }).join(', ') + ' km');
      rE.set('(' + E[0].toFixed(0) + ', ' + E[1].toFixed(0) + ') km');
      rH.set(hEst < 0.5 ? '약 0 km (세 원이 한 점에서 만남)' : '약 ' + hEst.toFixed(0) + ' km');
    }
    function drawSeis(T, r, c, cols) {
      var tmax = 32, L = r.x + 14, R = r.x + r.w - 8, top = r.y + 22, rowH = (r.h - 54) / 3;
      var sx = function (t) { return L + t / tmax * (R - L); };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('지진 기록 (지진 발생 시각 = 0)', L, r.y + 12);
      c.forEach(function (o, i) {
        var y0 = top + rowH * i + rowH * 0.55, amp = rowH * 0.36;
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.beginPath();
        for (var px = L; px <= R; px += 1) {
          var t = (px - L) / (R - L) * tmax, v = 0.03 * Math.sin(t * 37.1) * Math.sin(t * 5.3);
          if (t > o.tp) v += 0.32 * Math.exp(-(t - o.tp) * 0.9) * Math.sin((t - o.tp) * 2 * Math.PI * 5);
          if (t > o.ts) v += 0.95 * Math.exp(-(t - o.ts) * 0.45) * Math.sin((t - o.ts) * 2 * Math.PI * 2.3);
          if (px === L) ctx.moveTo(px, y0 - v * amp); else ctx.lineTo(px, y0 - v * amp);
        }
        ctx.stroke();
        ctx.fillStyle = cols[i]; ctx.font = '600 13px ' + T.fontBody; ctx.fillText(o.s.n, L - 12, y0 - amp * 0.6);
        // P, S 표시와 PS시
        [[o.tp, 'P'], [o.ts, 'S']].forEach(function (q) {
          if (q[0] > tmax) return;
          ctx.strokeStyle = q[1] === 'P' ? T.figBlue : T.figRed; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(sx(q[0]), y0 - amp); ctx.lineTo(sx(q[0]), y0 + amp); ctx.stroke();
          ctx.fillStyle = ctx.strokeStyle; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText(q[1], sx(q[0]), y0 - amp - 3);
        });
        if (o.ts <= tmax) {
          var yb = y0 + amp + 4; ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(sx(o.tp), yb); ctx.lineTo(sx(o.ts), yb); ctx.stroke();
          ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
          var lx = sx(o.ts) + 6; if (lx > R - 70) { lx = sx(o.tp) - 6; ctx.textAlign = 'right'; }
          ctx.fillText('Δt ' + o.ps.toFixed(2) + ' s', lx, yb + 4);
        }
      });
      var yA = top + rowH * 3;
      ctx.strokeStyle = T.figLine; ctx.beginPath(); ctx.moveTo(L, yA); ctx.lineTo(R, yA); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      for (var t = 0; t <= 30; t += 10) ctx.fillText(t, sx(t), yA + 14);
      ctx.font = '11px ' + T.fontBody; ctx.fillText('시간 (s)', (L + R) / 2, yA + 28);
    }
    function star(x, y, r, col, T) {
      ctx.beginPath();
      for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = T.figPanel; ctx.lineWidth = 1; ctx.stroke();
    }
    api.onResize(draw);
    draw();
  },
});
