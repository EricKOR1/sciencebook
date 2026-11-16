/* 생명과학 2 활동 전위: 자극 세기와 실무율, 막전위 변화와 Na⁺·K⁺ 통로 */
Sims.register('action-potential', {
  title: '활동 전위 — 막전위 그래프와 이온 통로',
  caption: '자극 세기를 정하고 "자극 주기"를 누르면, 축삭 한 지점의 막전위 변화(분극 −70 mV → 탈분극 +30 mV → 재분극 → 과분극 −80 mV → 회복)와 그 순간의 Na⁺·K⁺ 통로 상태가 함께 보인다. 역치(−55 mV)에 못 미치는 자극에서는 활동 전위가 생기지 않고, 역치를 넘으면 자극이 세도 활동 전위의 크기는 같다(실무율). "시각" 슬라이더로 원하는 순간을 멈춰 볼 수 있다. 시간 값은 본문 예제 2에 맞춘 모형이며, 통로와 이온 수는 모식적으로 나타냈다.',
  init: function (api) {
    var REST = -70, TH = -55;
    // 활동 전위 기준점(본문 예제 2: 0 ms −70, 1 ms +30, 2 ms −80, 3 ms −70)
    var KT = [-0.5, 0, 0.25, 0.55, 0.8, 1.0, 1.25, 1.55, 1.8, 2.0, 2.5, 3.0, 4.0];
    var KV = [-70, -70, -55, -30, 15, 30, 10, -40, -70, -80, -76, -70, -70];
    var mono = monotone(KT, KV);
    var st = { s: 6, t: 4, playing: false, ghosts: [], phaseClock: 0 };

    function strengthV(s) { return REST + s * 3; }        // 자극으로 올라가는 막전위(국소 탈분극)
    function fires(s) { return strengthV(s) >= TH; }
    function V(t, s) {
      if (t <= 0) return REST;
      if (fires(s)) return mono(t);
      var peak = strengthV(s);
      if (t < 0.25) return REST + (peak - REST) * Math.sin(t / 0.25 * Math.PI / 2);
      return REST + (peak - REST) * Math.exp(-(t - 0.25) / 0.45);
    }
    function naOpen(t, s) { return fires(s) && t >= 0.25 && t < 1.0; }
    function kOpen(t, s) { return fires(s) && t >= 1.0 && t < 2.35; }
    function phase(t, s) {
      if (t <= 0) return '분극(휴지 상태)';
      if (!fires(s)) return t < 1.6 ? '역치 미만 — 활동 전위 없음' : '분극(휴지 상태)';
      if (t < 0.25) return '자극으로 막전위 상승';
      if (t < 1.0) return '탈분극';
      if (t < 1.8) return '재분극';
      if (t < 2.35) return '과분극';
      if (t < 3.0) return '회복';
      return '분극(휴지 상태)';
    }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.7 : 0.56; }, label: '자극 지점의 세포막 확대 그림과 막전위 그래프' });
    var ctx = cv.ctx;
    var rV = api.readout('막전위'), rP = api.readout('단계'), rNa = api.readout('Na⁺ 통로'), rK = api.readout('K⁺ 통로');
    var sS = api.slider({ id: 'action-potential-s', label: '자극 세기', min: 1, max: 10, step: 1, value: st.s,
      format: function (v) { return v + ' (→ −' + Math.abs(strengthV(v)) + ' mV)'; },
      onInput: function (v) { st.s = v; } });
    api.button('자극 주기', function () { stimulate(); }, { primary: true });
    var busy = false;
    var sT = api.slider({ id: 'action-potential-t', label: '시각', min: -0.5, max: 4, step: 0.05, value: st.t,
      format: function (v) { return (v < 0 ? '자극 전' : v.toFixed(2) + ' ms'); },
      onInput: function (v) { if (busy) return; st.t = v; loop.pause(); st.playing = false; update(); } });

    function stimulate() {
      var prev = st.cur;
      if (prev != null && st.ghosts.indexOf(prev) < 0) { st.ghosts.push(prev); if (st.ghosts.length > 3) st.ghosts.shift(); }
      st.cur = st.s;
      if (api.reduced) { setT(0.7); return; }
      st.t = -0.5; st.playing = true; loop.play();
    }
    function setT(t) { st.t = t; busy = true; sT.set(Math.round(t * 20) / 20); busy = false; update(); }
    var loop = api.loop(function (dt) {
      st.phaseClock += dt;
      if (st.playing) {
        st.t += dt * 0.9;               // 화면 1초 ≈ 0.9 ms
        if (st.t >= 4) { st.t = 4; st.playing = false; }
        setT(st.t);
      } else update();
      if (!st.playing && !(naOpen(st.t, st.cur) || kOpen(st.t, st.cur))) loop.pause();
    });
    loop.pause();

    function update() {
      var s = st.cur, v = V(st.t, s);
      rV.set((v > 0 ? '+' : '') + v.toFixed(0) + ' mV');
      rP.set(phase(st.t, s));
      rNa.set(naOpen(st.t, s) ? '열림 (Na⁺ 유입)' : '닫힘');
      rK.set(kOpen(st.t, s) ? '열림 (K⁺ 유출)' : '닫힘');
      draw();
      if (!st.playing && (naOpen(st.t, s) || kOpen(st.t, s)) && !api.reduced) loop.play();
    }

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { m: { x: 0, y: 0, w: w, h: h * 0.47 }, g: { x: 0, y: h * 0.49, w: w, h: h * 0.51 } };
      return { m: { x: 0, y: 0, w: w * 0.42, h: h }, g: { x: w * 0.45, y: 0, w: w * 0.55, h: h } };
    }
    function draw() {
      var T = api.tokens(); ctx.clearRect(0, 0, cv.w, cv.h);
      var L = layout(); drawMembrane(T, L.m); drawGraph(T, L.g);
    }
    function ion(T, x, y, kind) {
      var na = kind === 'na';
      ctx.fillStyle = na ? T.figAmber : T.figViolet;
      ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill();
      ctx.fillStyle = T.figPanel; ctx.font = '700 9px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(na ? 'Na' : 'K', x, y + 3);
    }
    function drawMembrane(T, r) {
      var s = st.cur, t = st.t, v = V(t, s), nOpen = naOpen(t, s), kO = kOpen(t, s);
      var top = r.y + 28, bot = r.y + r.h - 8, mid = (top + bot) / 2, mh = 34;
      var x0 = r.x + 8, x1 = r.x + r.w - 8;
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('자극 지점의 세포막 (확대 모식도)', x0, r.y + 14);
      // 막(인지질 이중층)
      ctx.fillStyle = T.figSoftAmber; ctx.fillRect(x0, mid - mh / 2, x1 - x0, mh);
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x0, mid - mh / 2); ctx.lineTo(x1, mid - mh / 2); ctx.moveTo(x0, mid + mh / 2); ctx.lineTo(x1, mid + mh / 2); ctx.stroke();
      // 통로 위치
      var W = x1 - x0, cNa = x0 + W * 0.3, cK = x0 + W * 0.68;
      channel(T, cNa, mid, mh, nOpen, T.figAmber, 'Na⁺ 통로');
      channel(T, cK, mid, mh, kO, T.figViolet, 'K⁺ 통로');
      // 막 양쪽 전하(분극: 밖 +, 안 −  / 막전위 > 0: 뒤집힘)
      var flip = v > 0;
      ctx.font = '700 13px ' + T.fontBody; ctx.textAlign = 'center';
      [0.06, 0.49].forEach(function (f) {
        var x = x0 + W * f;
        ctx.fillStyle = flip ? T.figBlue : T.figRed; ctx.fillText(flip ? '−' : '+', x, mid - mh / 2 - 5);
        ctx.fillStyle = flip ? T.figRed : T.figBlue; ctx.fillText(flip ? '+' : '−', x, mid + mh / 2 + 14);
      });
      // 바탕 이온(농도 차: Na⁺ 밖에 많음, K⁺ 안에 많음)
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('세포 밖', x1, mid - mh / 2 - 6); ctx.fillText('세포 안', x1, mid + mh / 2 + 15);
      var outY = Math.max(top + 14, mid - mh / 2 - 70), inY = Math.min(bot - 14, mid + mh / 2 + 62);
      var naOut = [0.12, 0.2, 0.42, 0.55, 0.82, 0.93], kOut = [0.6], naIn = [0.58], kIn = [0.1, 0.22, 0.4, 0.5, 0.8, 0.92];
      naOut.forEach(function (f, i) { ion(T, x0 + W * f, outY + (i % 2) * 14 - 6, 'na'); });
      kOut.forEach(function (f) { ion(T, x0 + W * f, outY + 4, 'k'); });
      naIn.forEach(function (f) { ion(T, x0 + W * f, inY - 4, 'na'); });
      kIn.forEach(function (f, i) { ion(T, x0 + W * f, inY + (i % 2) * 14 - 6, 'k'); });
      // 이동하는 이온과 화살표
      var ph = (st.phaseClock * 0.8) % 1;
      if (nOpen) {
        arrow(T, cNa + 24, mid - mh / 2 - 22, cNa + 24, mid + mh / 2 + 22, T.figAmber);
        for (var i = 0; i < 2; i++) { var q = (ph + i / 2) % 1; ion(T, cNa, mid - mh / 2 - 18 + q * (mh + 36), 'na'); }
        label(T, '확산으로 Na⁺ 유입', cNa, mid + mh / 2 + 38, T.figAmber);
      }
      if (kO) {
        arrow(T, cK + 24, mid + mh / 2 + 22, cK + 24, mid - mh / 2 - 22, T.figViolet);
        for (var j = 0; j < 2; j++) { var q2 = (ph + j / 2) % 1; ion(T, cK, mid + mh / 2 + 18 - q2 * (mh + 36), 'k'); }
        label(T, '확산으로 K⁺ 유출', cK, mid - mh / 2 - 46, T.figViolet);
      }
      if (!fires(s) && t > 0 && t < 1.6) label(T, '역치 미만: 전압 개폐 통로가 열리지 않음', (x0 + x1) / 2, mid + mh / 2 + 38, T.figMuted);
    }
    function label(T, txt, x, y, col) { ctx.fillStyle = col; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText(txt, x, y); }
    function channel(T, cx, mid, mh, open, col, name) {
      var gap = open ? 12 : 3, pw = 13;
      ctx.fillStyle = T.figPanel; ctx.fillRect(cx - gap - pw - 2, mid - mh / 2 - 1, 2 * (gap + pw) + 4, mh + 2);
      ctx.fillStyle = col; ctx.globalAlpha = 0.85;
      roundRect(cx - gap - pw, mid - mh / 2 - 4, pw, mh + 8, 5); ctx.fill();
      roundRect(cx + gap, mid - mh / 2 - 4, pw, mh + 8, 5); ctx.fill();
      ctx.globalAlpha = 1;
      if (!open) { ctx.fillStyle = col; ctx.fillRect(cx - gap - 1, mid - 4, 2 * gap + 2, 8); }
      ctx.fillStyle = T.figInk; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(name + (open ? ' 열림' : ' 닫힘'), cx, mid - mh / 2 - 30);
    }
    function arrow(T, x1, y1, x2, y2, col) {
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2 - Math.sign(y2 - y1) * 8); ctx.stroke();
      var d = Math.sign(y2 - y1);
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 5, y2 - d * 9); ctx.lineTo(x2 + 5, y2 - d * 9); ctx.closePath(); ctx.fill();
    }
    function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    function drawGraph(T, r) {
      var Lx = r.x + 48, R = r.x + r.w - 14, Tp = r.y + 22, B = r.y + r.h - 38;
      var tmin = -0.5, tmax = 4, vmin = -90, vmax = 50;
      var sx = function (t) { return Lx + (t - tmin) / (tmax - tmin) * (R - Lx); };
      var sy = function (v) { return B - (v - vmin) / (vmax - vmin) * (B - Tp); };
      ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      [-80, -70, -55, 0, 30].forEach(function (v) {
        ctx.strokeStyle = T.rule; ctx.beginPath(); ctx.moveTo(Lx, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke();
        ctx.fillStyle = T.figMuted; ctx.fillText((v > 0 ? '+' : '') + v, Lx - 5, sy(v) + 4);
      });
      ctx.textAlign = 'center';
      [0, 1, 2, 3, 4].forEach(function (t) { ctx.fillText(t, sx(t), B + 15); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('자극 후 시간 (ms)', (Lx + R) / 2, B + 31);
      ctx.save(); ctx.translate(r.x + 10, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('막전위 (mV)', 0, 0); ctx.restore();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('막전위 변화', Lx, r.y + 12);
      // 역치
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figRed; ctx.beginPath(); ctx.moveTo(Lx, sy(TH)); ctx.lineTo(R, sy(TH)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figRed; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText('역치 약 −55', R, sy(TH) - 4);
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'right'; ctx.fillText('휴지 전위 −70', R, sy(-70) + 13);
      // 이전 곡선
      st.ghosts.forEach(function (gs) { curve(gs, tmax, T.figLine, 1.3); });
      // 현재 곡선(시각까지)
      if (st.cur != null) { curve(st.cur, tmax, T.figSoftBlue, 2.6); curve(st.cur, st.t, T.figAccent, 2.6); }
      // 단계 이름(활동 전위가 그려졌을 때)
      if (st.cur != null && fires(st.cur) && st.t > 1.2) {
        ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
        ctx.fillText('탈분극', sx(0.45), sy(10)); if (st.t > 1.6) ctx.fillText('재분극', sx(1.75), sy(10));
        if (st.t > 2.2) ctx.fillText('과분극', sx(2.1), sy(-80) + 14);
      }
      // 현재 시각 표시
      var tt = Math.max(tmin, st.t), vv = V(tt, st.cur);
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(sx(tt), Tp); ctx.lineTo(sx(tt), B); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figAccent; ctx.beginPath(); ctx.arc(sx(tt), sy(vv), 4.5, 0, 7); ctx.fill();
      // 자극 표시
      ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.beginPath(); ctx.moveTo(sx(0), B - 2); ctx.lineTo(sx(0) - 5, B + 4 - 10); ctx.lineTo(sx(0) + 5, B + 4 - 10); ctx.closePath(); ctx.fill();
      ctx.fillText('자극', sx(0) - 14, sy(-85) + 2);
      function curve(s, tEnd, col, lw) {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
        for (var i = 0; i <= 300; i++) { var t = tmin + (tmax - tmin) * i / 300; if (t > tEnd) break; var y = sy(V(t, s)); if (i === 0) ctx.moveTo(sx(t), y); else ctx.lineTo(sx(t), y); }
        ctx.stroke();
      }
    }
    // 단조 3차 보간(Fritsch–Carlson): 기준점 사이에서 넘치지 않는 매끈한 곡선
    function monotone(xs, ys) {
      var n = xs.length, d = [], m = [];
      for (var i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
      m[0] = d[0]; m[n - 1] = d[n - 2];
      for (var k = 1; k < n - 1; k++) m[k] = d[k - 1] * d[k] <= 0 ? 0 : (d[k - 1] + d[k]) / 2;
      for (var j = 0; j < n - 1; j++) {
        if (d[j] === 0) { m[j] = 0; m[j + 1] = 0; continue; }
        var a = m[j] / d[j], b = m[j + 1] / d[j], h = a * a + b * b;
        if (h > 9) { var tau = 3 / Math.sqrt(h); m[j] = tau * a * d[j]; m[j + 1] = tau * b * d[j]; }
      }
      return function (x) {
        if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
        var i = 0; while (x > xs[i + 1]) i++;
        var hh = xs[i + 1] - xs[i], t = (x - xs[i]) / hh, t2 = t * t, t3 = t2 * t;
        return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * hh * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * hh * m[i + 1];
      };
    }
    api.onResize(draw);
    // 첫 화면: 역치 미만(자극 3) 곡선을 흐리게, 역치 이상(자극 6) 곡선을 끝까지 그려 둔다
    st.ghosts = [3]; st.cur = 6; setT(0.7);
  },
});
