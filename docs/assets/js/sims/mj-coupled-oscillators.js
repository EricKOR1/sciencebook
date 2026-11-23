/* 수학 도구 5 선형대수: 용수철로 묶인 두 물체(벽–k–m1–k12–m2–k–벽)의 기준 진동 분해 */
Sims.register('mj-coupled-oscillators', {
  title: '용수철로 묶인 두 물체 — 기준 진동으로 나누기',
  caption: '두 질량, 가운데 용수철, 처음 변위를 정하고 재생해 보자. 처음 상태는 두 기준 진동(고유벡터)의 겹침으로 분해되고(오른쪽 막대), 각 성분은 자기 진동수로만 흔들린다. 한 물체만 당기면 두 모드가 섞여 에너지가 두 물체 사이를 오가는 맥놀이가 생기고, "모드에 맞추기"로 처음 변위를 고유벡터에 맞추면 맥놀이 없이 한 진동수로만 흔들린다. 바깥 두 용수철의 힘상수 k = 1, 질량은 m 단위, 진동수는 √(k/m) 단위이며, 마찰이 없고 처음에 정지해 있다고 가정했다.',
  init: function (api) {
    var st = { m1: 1, m2: 1, k12: 1, x1: 1, x2: 0, t: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.62; }, label: '두 물체와 용수철, 변위-시간 그래프, 기준 진동 성분 막대' });
    var ctx = cv.ctx;
    var rW = api.readout('기준 진동수 ω₁, ω₂ ');
    var rC = api.readout('모드 성분 c₁, c₂ ');
    var rB = api.readout('맥놀이 주기 ');
    function f2(v) { return (Math.abs(v) < 0.005 ? 0 : v).toFixed(2).replace('-', '−'); }
    function mk(id, label, min, max, step, key, unit) {
      return api.slider({ id: 'mj-coupled-oscillators-' + id, label: label, min: min, max: max, step: step, value: st[key],
        format: function (v) { return f2(v) + (unit || ''); }, onInput: function (v) { st[key] = v; reset(); } });
    }
    var sM1 = mk('m1', '질량 m₁', 0.5, 3, 0.1, 'm1', ' m'), sM2 = mk('m2', '질량 m₂', 0.5, 3, 0.1, 'm2', ' m');
    var sK = mk('k12', '가운데 용수철 k₁₂', 0.1, 3, 0.1, 'k12', ' k');
    var sX1 = mk('x1', '처음 변위 x₁(0)', -1, 1, 0.05, 'x1'), sX2 = mk('x2', '처음 변위 x₂(0)', -1, 1, 0.05, 'x2');
    var g = api.group();
    var playBtn = api.button('재생', function () { if (running) stop(); else start(); }, { primary: true, parent: g });
    api.button('처음으로', function () { stop(); st.t = 0; draw(); }, { parent: g });
    api.button('느린 모드에 맞추기', function () { fit(0); }, { parent: g });
    api.button('빠른 모드에 맞추기', function () { fit(1); }, { parent: g });
    var running = false;

    function modes() {
      var m1 = st.m1, m2 = st.m2, k = st.k12;
      var K = [[1 + k, -k], [-k, 1 + k]];
      var s1 = 1 / Math.sqrt(m1), s2 = 1 / Math.sqrt(m2);
      var A = K[0][0] * s1 * s1, B = K[0][1] * s1 * s2, D = K[1][1] * s2 * s2;   // 대칭 M^-1/2 K M^-1/2
      var tr = A + D, disc = Math.sqrt((A - D) * (A - D) + 4 * B * B);
      var l = [(tr - disc) / 2, (tr + disc) / 2];
      var out = l.map(function (lam) {
        var q = Math.abs(B) > 1e-12 ? [B, lam - A] : (Math.abs(lam - A) < 1e-12 ? [1, 0] : [0, 1]);
        var n = Math.hypot(q[0], q[1]); q = [q[0] / n, q[1] / n];
        var a = [q[0] * s1, q[1] * s2];     // 실제 변위 모양
        if (a[0] < 0 || (Math.abs(a[0]) < 1e-12 && a[1] < 0)) { q = [-q[0], -q[1]]; a = [-a[0], -a[1]]; }
        return { w: Math.sqrt(lam), q: q, a: a };
      });
      // 처음 상태 분해: c_i = q_i · M^1/2 x0
      var y0 = [Math.sqrt(m1) * st.x1, Math.sqrt(m2) * st.x2];
      out.forEach(function (o) { o.c = o.q[0] * y0[0] + o.q[1] * y0[1]; });
      return out;
    }
    var MD = modes();
    function pos(t) {
      var x = [0, 0];
      MD.forEach(function (o) { var f = o.c * Math.cos(o.w * t); x[0] += f * o.a[0]; x[1] += f * o.a[1]; });
      return x;
    }
    function fit(i) {
      MD = modes();
      var a = MD[i].a, s = 0.8 / Math.max(Math.abs(a[0]), Math.abs(a[1]));
      var v1 = Math.round(a[0] * s * 20) / 20, v2 = Math.round(a[1] * s * 20) / 20;
      st.x1 = v1; st.x2 = v2; sX1.set(v1); sX2.set(v2);
      // 반올림 없이 정확한 모드로 맞춘다(슬라이더 표시는 0.05 단위)
      st.x1 = a[0] * s; st.x2 = a[1] * s; reset();
    }
    function reset() { MD = modes(); st.t = 0; stop(); readouts(); draw(); }
    function start() { running = true; playBtn.textContent = '멈춤'; if (api.reduced) { st.t += 6; draw(); running = false; playBtn.textContent = '재생 (6만큼 앞으로)'; return; } loop.play(); }
    function stop() { running = false; loop.pause(); playBtn.textContent = api.reduced ? '재생 (6만큼 앞으로)' : '재생'; }
    var loop = api.loop(function (dt) { if (dt <= 0) return; st.t += dt * 2.5; draw(); });
    loop.pause();
    if (api.reduced) playBtn.textContent = '재생 (6만큼 앞으로)';

    function readouts() {
      rW.set(f2(MD[0].w) + ', ' + f2(MD[1].w));
      rC.set(f2(MD[0].c) + ', ' + f2(MD[1].c));
      var both = Math.abs(MD[0].c) > 0.02 && Math.abs(MD[1].c) > 0.02;
      rB.set(both ? f2(2 * Math.PI / (MD[1].w - MD[0].w)) + ' (√(m/k) 단위)' : '없음 (한 모드만)');
    }

    var WIN = 30;
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var sc = { x: 0, y: 0, w: w, h: narrow ? h * 0.27 : h * 0.34 };
      var gr = narrow ? { x: 0, y: h * 0.29, w: w, h: h * 0.42 } : { x: 0, y: h * 0.37, w: w * 0.7, h: h * 0.63 };
      var br = narrow ? { x: 0, y: h * 0.73, w: w, h: h * 0.27 } : { x: w * 0.72, y: h * 0.37, w: w * 0.28, h: h * 0.63 };
      scene(T, sc); graph(T, gr); bars(T, br);
    }
    function spring(x1, x2, y, col) {
      var n = 10, L = x2 - x1; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 + L * 0.1, y);
      for (var i = 1; i < 2 * n; i++) ctx.lineTo(x1 + L * 0.1 + L * 0.8 * i / (2 * n), y + (i % 2 ? 8 : -8));
      ctx.lineTo(x1 + L * 0.9, y); ctx.lineTo(x2, y); ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.stroke();
    }
    function scene(T, r) {
      var x = pos(st.t), wl = r.x + 24, wr = r.x + r.w - 24, yc = r.y + r.h * 0.55;
      var span = wr - wl, e1 = wl + span / 3, e2 = wl + 2 * span / 3, amp = span * 0.11;
      ctx.fillStyle = T.figSoftAmber; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      ctx.fillRect(wl - 12, yc - 34, 12, 68); ctx.strokeRect(wl - 12, yc - 34, 12, 68);
      ctx.fillRect(wr, yc - 34, 12, 68); ctx.strokeRect(wr, yc - 34, 12, 68);
      var p1 = e1 + x[0] * amp, p2 = e2 + x[1] * amp;
      var b1 = 22 + 8 * Math.sqrt(st.m1), b2 = 22 + 8 * Math.sqrt(st.m2);
      ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figMuted;
      [e1, e2].forEach(function (e) { ctx.beginPath(); ctx.moveTo(e, yc - 36); ctx.lineTo(e, yc + 36); ctx.stroke(); });
      ctx.setLineDash([]);
      spring(wl, p1 - b1 / 2, yc, T.figInk); spring(p1 + b1 / 2, p2 - b2 / 2, yc, T.figViolet); spring(p2 + b2 / 2, wr, yc, T.figInk);
      [[p1, b1, 'm₁', T.figBlue, T.figSoftBlue], [p2, b2, 'm₂', T.figRed, T.figSoftRed]].forEach(function (o) {
        ctx.fillStyle = o[4]; ctx.strokeStyle = o[3]; ctx.lineWidth = 2;
        ctx.fillRect(o[0] - o[1] / 2, yc - o[1] / 2, o[1], o[1]); ctx.strokeRect(o[0] - o[1] / 2, yc - o[1] / 2, o[1], o[1]);
        ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText(o[2], o[0], yc + 5);
      });
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('k', (wl + e1) / 2, yc - 14); ctx.fillText('k₁₂', (e1 + e2) / 2, yc - 14); ctx.fillText('k', (e2 + wr) / 2, yc - 14);
      ctx.textAlign = 'left'; ctx.fillText('t = ' + st.t.toFixed(1) + ' √(m/k)   (점선: 평형 위치)', r.x + 10, r.y + 16);
    }
    function graph(T, r) {
      var L = r.x + 44, R = r.x + r.w - 12, Tp = r.y + 14, B = r.y + r.h - 30;
      var t0 = Math.max(0, st.t - WIN), t1 = t0 + WIN;
      var sx = function (t) { return L + (t - t0) / WIN * (R - L); }, sy = function (v) { return (Tp + B) / 2 - v / 1.6 * (B - Tp) / 2; };
      ctx.strokeStyle = T.rule || T.figLine; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      [-1, 0, 1].forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(String(v).replace('-', '−'), L - 6, sy(v) + 4); });
      ctx.textAlign = 'center';
      for (var tt = Math.ceil(t0 / 5) * 5; tt <= t1; tt += 5) ctx.fillText(tt, sx(tt), B + 14);
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.fillText('시간 t (√(m/k) 단위)', (L + R) / 2, B + 28);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('변위', 0, 0); ctx.restore();
      [[0, T.figBlue, []], [1, T.figRed, [6, 4]]].forEach(function (o) {
        // 앞으로의 예측(흐리게)과 지나온 부분(진하게)
        [[st.t, t1, 0.3, 1.4], [t0, st.t, 1, 2.2]].forEach(function (seg) {
          if (seg[1] - seg[0] < 1e-6) return;
          ctx.beginPath();
          for (var i = 0; i <= 300; i++) { var t = seg[0] + (seg[1] - seg[0]) * i / 300, y = sy(pos(t)[o[0]]); if (i) ctx.lineTo(sx(t), y); else ctx.moveTo(sx(t), y); }
          ctx.globalAlpha = seg[2]; ctx.strokeStyle = o[1]; ctx.lineWidth = seg[3]; ctx.setLineDash(o[2]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        });
      });
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figBlue; ctx.fillText('— x₁', L + 6, Tp + 4); ctx.fillStyle = T.figRed; ctx.fillText('- - x₂', L + 50, Tp + 4);
    }
    function bars(T, r) {
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('처음 상태 = c₁·(모드 1) + c₂·(모드 2)', r.x + 10, r.y + 16);
      var E = MD.map(function (o) { return o.c * o.c * o.w * o.w; }), Et = E[0] + E[1] || 1;
      var maxc = Math.max(1, Math.abs(MD[0].c), Math.abs(MD[1].c));
      MD.forEach(function (o, i) {
        var narrowRow = r.w > 300;
        var bx = narrowRow ? r.x + 10 + i * (r.w / 2) : r.x + 10, by = narrowRow ? r.y + 30 : r.y + 30 + i * (r.h - 30) / 2;
        var bw = narrowRow ? r.w / 2 - 20 : r.w - 20, bh = narrowRow ? r.h - 36 : (r.h - 30) / 2 - 10;
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
        ctx.fillText((i ? '빠른' : '느린') + ' 모드 ω' + (i ? '₂' : '₁') + ' = ' + f2(o.w), bx, by + 12);
        // 모양: 화살표 두 개
        var ay = by + 30;
        [[o.a[0], T.figBlue], [o.a[1], T.figRed]].forEach(function (p, j) {
          var cx = bx + 30 + j * 50, len = 18 * p[0] / Math.max(Math.abs(o.a[0]), Math.abs(o.a[1]));
          ctx.fillStyle = j ? T.figSoftRed : T.figSoftBlue; ctx.fillRect(cx - 8, ay - 8, 16, 16);
          ctx.strokeStyle = p[1]; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(cx, ay); ctx.lineTo(cx + len, ay); ctx.stroke();
          if (Math.abs(len) > 3) { var s = Math.sign(len); ctx.beginPath(); ctx.moveTo(cx + len, ay); ctx.lineTo(cx + len - s * 6, ay - 4); ctx.lineTo(cx + len - s * 6, ay + 4); ctx.closePath(); ctx.fillStyle = p[1]; ctx.fill(); }
        });
        // 막대
        var zx = bx + bw / 2, yb = ay + 22, hb = 14, len2 = (bw / 2 - 4) * o.c / maxc;
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(bx, yb, bw, hb);
        ctx.beginPath(); ctx.moveTo(zx, yb - 3); ctx.lineTo(zx, yb + hb + 3); ctx.stroke();
        ctx.fillStyle = i ? T.figTeal : T.figViolet; ctx.fillRect(Math.min(zx, zx + len2), yb, Math.abs(len2), hb);
        ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody;
        ctx.fillText('c' + (i ? '₂' : '₁') + ' = ' + f2(o.c) + ' · 에너지 ' + Math.round(100 * E[i] / Et) + ' %', bx, yb + hb + 16);
      });
    }
    api.onResize(draw);
    readouts(); draw();
  },
});
