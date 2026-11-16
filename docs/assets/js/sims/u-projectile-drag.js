/* 일반물리학 1 운동의 기술: 공기 저항이 있는 포물선 운동 — 해석해(저항 없음)와 수치해(저항 있음) 비교 */
Sims.register('u-projectile-drag', {
  title: '공기 저항을 켜면 포물선이 어떻게 바뀔까? — 해석해와 수치해',
  caption: '처음 속력, 발사각, 저항 계수 k를 정하고 「던지기」를 눌러 보자. 점선은 공기 저항이 없을 때의 해석해(포물선), 실선은 저항을 넣고 시간을 0.002초씩 잘게 나누어 계산한 수치해이다. 저항이 있으면 궤적이 최고점을 지난 뒤 더 가파르게 떨어지고, 가장 멀리 가는 각이 45°보다 작아진다. 공기 저항은 속력의 제곱에 비례한다고 보았고(가속도 −k|v|v, k = CρA/2m), 바람과 공의 회전은 무시했다. g = 9.80 m/s²',
  init: function (api) {
    var G = 9.80;
    var st = { v0: 25, deg: 35, k: 0.010, drag: true, path: [], ideal: [], t: 0, playing: false, best: 45 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.85 : 0.4; }, label: '공기 저항이 있을 때와 없을 때의 궤적 비교' });
    var ctx = cv.ctx;

    var rR = api.readout('도달 거리');
    var rR0 = api.readout('저항 없을 때');
    var rH = api.readout('최고 높이');
    var rT = api.readout('체공 시간');
    var rBest = api.readout('가장 멀리 가는 각');

    api.slider({ id: 'u-projectile-drag-v', label: '처음 속력', min: 10, max: 40, step: 1, value: st.v0,
      format: function (v) { return v + ' m/s'; }, onInput: function (v) { st.v0 = v; recompute(true); } });
    api.slider({ id: 'u-projectile-drag-a', label: '발사각', min: 10, max: 80, step: 1, value: st.deg,
      format: function (v) { return v + '°'; }, onInput: function (v) { st.deg = v; recompute(false); } });
    api.slider({ id: 'u-projectile-drag-k', label: '저항 계수 k', min: 0.001, max: 0.03, step: 0.001, value: st.k,
      format: function (v) { return v.toFixed(3) + ' /m'; }, onInput: function (v) { st.k = v; recompute(true); } });
    var g = api.group();
    var bDrag = api.button('공기 저항 켬', function () {
      st.drag = !st.drag; bDrag.textContent = st.drag ? '공기 저항 켬' : '공기 저항 끔';
      bDrag.setAttribute('aria-pressed', st.drag ? 'true' : 'false'); recompute(true);
    }, { toggle: true, pressed: true, parent: g });
    api.button('던지기', function () { launch(); }, { primary: true, parent: g });

    // 한 번의 비행을 계산(RK4). 저항 없으면 해석해를 그대로 쓴다.
    function fly(v0, deg, k, dt, keep) {
      var th = deg * Math.PI / 180, x = 0, y = 0, vx = v0 * Math.cos(th), vy = v0 * Math.sin(th), t = 0, H = 0;
      var pts = keep ? [{ t: 0, x: 0, y: 0, vx: vx, vy: vy }] : null, n = 0;
      function acc(vx, vy) { var s = Math.sqrt(vx * vx + vy * vy); return [-k * s * vx, -G - k * s * vy]; }
      while (t < 60) {
        var a1 = acc(vx, vy);
        var a2 = acc(vx + a1[0] * dt / 2, vy + a1[1] * dt / 2);
        var a3 = acc(vx + a2[0] * dt / 2, vy + a2[1] * dt / 2);
        var a4 = acc(vx + a3[0] * dt, vy + a3[1] * dt);
        var nx = x + dt * (vx + (dt / 6) * (a1[0] + a2[0] + a3[0])); // 위치: v + (dt/6)(...) 꼴의 RK4
        var ny = y + dt * (vy + (dt / 6) * (a1[1] + a2[1] + a3[1]));
        var nvx = vx + dt / 6 * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]);
        var nvy = vy + dt / 6 * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]);
        if (ny < 0) {
          var f = y / (y - ny);
          x = x + (nx - x) * f; t = t + dt * f; vx = vx + (nvx - vx) * f; vy = vy + (nvy - vy) * f; y = 0;
          if (keep) pts.push({ t: t, x: x, y: 0, vx: vx, vy: vy });
          break;
        }
        x = nx; y = ny; vx = nvx; vy = nvy; t += dt; n++;
        if (y > H) H = y;
        if (keep && n % 5 === 0) pts.push({ t: t, x: x, y: y, vx: vx, vy: vy });
      }
      return { R: x, H: H, T: t, pts: pts };
    }
    function idealPts(v0, deg) {
      var th = deg * Math.PI / 180, vx = v0 * Math.cos(th), vy = v0 * Math.sin(th), T = 2 * vy / G, pts = [];
      for (var i = 0; i <= 120; i++) { var t = T * i / 120; pts.push({ t: t, x: vx * t, y: vy * t - 0.5 * G * t * t, vx: vx, vy: vy - G * t }); }
      return { R: vx * T, H: vy * vy / (2 * G), T: T, pts: pts };
    }
    var cur, ide;
    function recompute(bestToo) {
      ide = idealPts(st.v0, st.deg);
      cur = st.drag ? fly(st.v0, st.deg, st.k, 0.002, true) : ide;
      if (bestToo) {
        if (!st.drag) st.best = 45;
        else {
          var bestR = -1, bestA = 45;
          for (var a = 15; a <= 60; a += 0.5) { var r = fly(st.v0, a, st.k, 0.01, false).R; if (r > bestR) { bestR = r; bestA = a; } }
          st.best = bestA;
        }
      }
      st.t = cur.T; st.playing = false; loop.pause();
      readouts(); draw();
    }
    function readouts() {
      rR.set(cur.R.toFixed(1) + ' m' + (st.drag ? ' (' + Math.round(100 * cur.R / ide.R) + ' %)' : ''));
      rR0.set(ide.R.toFixed(1) + ' m');
      rH.set(cur.H.toFixed(1) + ' m');
      rT.set(cur.T.toFixed(2) + ' s');
      rBest.set((st.drag ? '약 ' : '') + st.best.toFixed(st.best % 1 ? 1 : 0) + '°');
    }
    function launch() {
      if (api.reduced) { st.t = cur.T; draw(); return; }
      st.t = 0; st.playing = true; loop.play();
    }
    var loop = api.loop(function (dt) {
      if (!st.playing) return;
      st.t += dt * 1.2;
      if (st.t >= cur.T) { st.t = cur.T; st.playing = false; loop.pause(); }
      draw();
    });
    loop.pause();

    function nice(v) {
      var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p;
      return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
    }
    function stateAt(t) {
      var p = cur.pts;
      if (t >= p[p.length - 1].t) return p[p.length - 1];
      for (var i = 1; i < p.length; i++) if (p[i].t >= t) {
        var a = p[i - 1], b = p[i], f = (t - a.t) / (b.t - a.t || 1);
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, vx: a.vx + (b.vx - a.vx) * f, vy: a.vy + (b.vy - a.vy) * f };
      }
      return p[0];
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var narrow = w < 560, L = 50, R = w - 16, Tp = narrow ? 50 : 30, B = h - 46;
      var xmax = Math.max(ide.R, cur.R) * 1.06, ymax = Math.max(ide.H, cur.H) * 1.18;
      var s = Math.min((R - L) / xmax, (B - Tp) / ymax);      // 가로·세로 같은 축척
      var sx = function (x) { return L + x * s; }, sy = function (y) { return B - y * s; };
      // 눈금
      var step = nice(Math.max(xmax, ymax * 1.4) / 6);
      ctx.font = '11px ' + T.fontMono; ctx.lineWidth = 1; ctx.strokeStyle = T.rule; ctx.fillStyle = T.figMuted;
      ctx.textAlign = 'center';
      for (var gx = 0; sx(gx) <= R + 0.5; gx += step) { ctx.beginPath(); ctx.moveTo(sx(gx), Tp - 10); ctx.lineTo(sx(gx), B); ctx.stroke(); ctx.fillText(gx, sx(gx), B + 14); }
      ctx.textAlign = 'right';
      for (var gy = step; sy(gy) >= Tp - 10; gy += step) { ctx.beginPath(); ctx.moveTo(L, sy(gy)); ctx.lineTo(R, sy(gy)); ctx.stroke(); ctx.fillText(gy, L - 6, sy(gy) + 4); }
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.textAlign = 'left'; ctx.fillText('x (m) · 가로·세로 같은 축척', L, B + 34);
      ctx.save(); ctx.translate(13, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('높이 y (m)', 0, 0); ctx.restore();
      // 해석해(점선)
      ctx.setLineDash([6, 5]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 2; ctx.beginPath();
      ide.pts.forEach(function (p, i) { if (i) ctx.lineTo(sx(p.x), sy(p.y)); else ctx.moveTo(sx(p.x), sy(p.y)); });
      ctx.stroke(); ctx.setLineDash([]);
      // 수치해(실선) — 진행한 만큼
      if (st.drag) {
        ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.8; ctx.beginPath();
        var started = false;
        cur.pts.forEach(function (p) { if (p.t > st.t + 1e-9) return; if (started) ctx.lineTo(sx(p.x), sy(p.y)); else { ctx.moveTo(sx(p.x), sy(p.y)); started = true; } });
        var q = stateAt(st.t); ctx.lineTo(sx(q.x), sy(q.y)); ctx.stroke();
      }
      // 낙하 지점 표시
      // 낙하 지점: 축 아래 표식과 글자(저항 있음은 왼쪽, 없음은 오른쪽으로 써서 겹치지 않게)
      function tri(x, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(sx(x), B + 2); ctx.lineTo(sx(x) - 5, B + 10); ctx.lineTo(sx(x) + 5, B + 10); ctx.fill(); }
      ctx.font = '600 11px ' + T.fontBody;
      tri(ide.R, T.figMuted);
      var t0 = '저항 없음 ' + ide.R.toFixed(1) + ' m', w0 = ctx.measureText(t0).width;
      var x0l = Math.min(sx(ide.R) - 4, R - w0);
      ctx.textAlign = 'left'; ctx.fillText(t0, x0l, B + 34);
      if (st.drag && st.t >= cur.T) {
        tri(cur.R, T.figAccent);
        var t1 = '저항 있음 ' + cur.R.toFixed(1) + ' m';
        ctx.fillStyle = T.figAccent; ctx.textAlign = 'right';
        if (sx(cur.R) + 4 < x0l - 6) ctx.fillText(t1, sx(cur.R) + 4, B + 34);
      }
      // 공과 벡터
      var b = st.drag ? stateAt(st.t) : (function () { var th = st.deg * Math.PI / 180, t = Math.min(st.t, ide.T); return { x: st.v0 * Math.cos(th) * t, y: st.v0 * Math.sin(th) * t - 0.5 * G * t * t, vx: st.v0 * Math.cos(th), vy: st.v0 * Math.sin(th) - G * t }; })();
      if (!st.drag && st.t > 0) {
        ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.8; ctx.beginPath(); ctx.moveTo(sx(0), sy(0));
        ide.pts.forEach(function (p) { if (p.t <= st.t) ctx.lineTo(sx(p.x), sy(p.y)); }); ctx.lineTo(sx(b.x), sy(b.y)); ctx.stroke();
      }
      var bx = sx(b.x), by = sy(b.y);
      var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy), kk = st.drag ? st.k : 0;
      var ax = -kk * sp * b.vx, ay = -G - kk * sp * b.vy;
      var vs = 2.2, as = 4.2;
      arrow(bx, by, bx + b.vx * vs, by - b.vy * vs, T.figBlue, 2.2);
      arrow(bx, by, bx + ax * as, by - ay * as, T.figRed, 2.6);
      ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI * 2); ctx.fillStyle = T.figInk; ctx.fill();
      // 범례
      ctx.textAlign = 'left'; ctx.font = '12px ' + T.fontBody;
      var lx = L + 8, ly = 16;
      legend(lx, ly, T.figMuted, true, '해석해(저항 없음)');
      legend(lx + 128, ly, T.figAccent, false, st.drag ? '수치해(저항 있음)' : '실제 경로');
      var vx0 = narrow ? lx : lx + 262, vy0 = narrow ? ly + 20 : ly;
      ctx.fillStyle = T.figBlue; ctx.fillText('→ 속도', vx0, vy0 + 4);
      ctx.fillStyle = T.figRed; ctx.fillText('→ 가속도(중력 + 저항)', vx0 + 56, vy0 + 4);
    }
    function legend(x, y, col, dash, text) {
      var T = api.tokens();
      ctx.strokeStyle = col; ctx.lineWidth = 2.4; if (dash) ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20, y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figInk; ctx.fillText(text, x + 25, y + 4);
    }
    function arrow(x1, y1, x2, y2, col, lw) {
      var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy); if (L < 3) return;
      var ux = dx / L, uy = dy / L, hl = Math.min(9, L * 0.5);
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hl, y2 - uy * hl); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - ux * hl - uy * hl * 0.5, y2 - uy * hl + ux * hl * 0.5); ctx.lineTo(x2 - ux * hl + uy * hl * 0.5, y2 - uy * hl - ux * hl * 0.5); ctx.closePath(); ctx.fill();
    }
    api.onResize(draw);
    recompute(true);
  },
});
