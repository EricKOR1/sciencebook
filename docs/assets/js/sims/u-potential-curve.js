/* 일반물리학 3 일·에너지와 운동량: 퍼텐셜 에너지 곡선 위의 운동 — 역학적 에너지 E, 되돌이점, 속력 */
Sims.register('u-potential-curve', {
  title: '퍼텐셜 에너지 곡선 위의 운동 — E를 바꾸면 갈 수 있는 곳이 달라진다',
  caption: '퍼텐셜 에너지 U(x)를 고르고 역학적 에너지 E를 정한 뒤 「움직이기」를 눌러 보자. 입자는 U(x) ≤ E인 구간(굵은 선)에서만 움직이고, U(x) = E인 되돌이점에서 멈췄다가 방향을 바꾼다. 초록 막대의 길이 E − U(x)가 운동 에너지이므로 골짜기 바닥에서 가장 빠르다. 빨간 화살표는 힘 F = −dU/dx이다. 이중 우물에서 E < 0이면 가운데 언덕을 넘지 못한다. 질량은 0.500 kg이고 보존력만 작용한다고 보았다(입자는 x축 위에서만 움직이며, 곡선은 높이가 아니라 에너지를 나타낸다).',
  init: function (api) {
    var M = 0.5;
    var POTS = {
      dw: { name: '이중 우물 2x⁴ − 4x²', U: function (x) { return 2 * x * x * x * x - 4 * x * x; }, dU: function (x) { return 8 * x * x * x - 8 * x; }, xr: [-1.75, 1.75], er: [-1.9, 3], e0: -1, ur: [-2.6, 3.6] },
      tilt: { name: '기울어진 우물 2x⁴ − 4x² + x', U: function (x) { return 2 * x * x * x * x - 4 * x * x + x; }, dU: function (x) { return 8 * x * x * x - 8 * x + 1; }, xr: [-1.75, 1.75], er: [-2.9, 3], e0: -0.5, ur: [-3.4, 3.6] },
      sp: { name: '용수철 2.0x²', U: function (x) { return 2 * x * x; }, dU: function (x) { return 4 * x; }, xr: [-1.75, 1.75], er: [0.1, 5], e0: 2, ur: [-0.6, 6] },
    };
    var st = { key: 'dw', E: -1, side: 1, x: 0, v: 0, playing: false };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.5; }, label: '퍼텐셜 에너지 곡선과 그 위를 움직이는 입자' });
    var ctx = cv.ctx;
    var rTP = api.readout('되돌이점');
    var rX = api.readout('위치 x');
    var rKU = api.readout('K / U');
    var rV = api.readout('속력 v');

    var g = api.group();
    var keys = ['dw', 'tilt', 'sp'];
    var btns = keys.map(function (k) { return api.button(POTS[k].name, function () { choose(k); }, { toggle: true, pressed: k === 'dw', parent: g }); });
    var sE = api.slider({ id: 'u-potential-curve-e', label: '역학적 에너지 E', min: -1.9, max: 3, step: 0.05, value: st.E,
      format: function (v) { return (v < 0 ? '−' : '') + Math.abs(v).toFixed(2) + ' J'; }, onInput: function (v) { st.E = v; reset(); } });
    var g2 = api.group();
    api.button('출발점 바꾸기(왼쪽↔오른쪽)', function () { st.side = -st.side; reset(); }, { parent: g2 });
    var bPlay = api.button('움직이기', function () {
      if (api.reduced) { advance(0.08); draw(); return; }
      if (st.playing) { st.playing = false; loop.pause(); bPlay.textContent = '움직이기'; }
      else { st.playing = true; loop.play(); bPlay.textContent = '멈추기'; }
    }, { primary: true, parent: g2 });
    if (api.reduced) bPlay.textContent = '0.08초 진행';

    function P() { return POTS[st.key]; }
    function choose(k) {
      st.key = k;
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', keys[i] === k ? 'true' : 'false'); });
      var p = P(); sE.input.min = p.er[0]; sE.input.max = p.er[1]; sE.set(p.e0);
    }
    // 출발점(st.side 쪽의 가장 바깥 되돌이점)과 그 점을 포함하는 허용 구간
    function region() {
      var p = P(), n = 1400, a = p.xr[0], b = p.xr[1], xs = [];
      for (var i = 0; i <= n; i++) xs.push(a + (b - a) * i / n);
      var ok = xs.map(function (x) { return p.U(x) <= st.E; });
      // 출발 쪽 끝에서부터 처음 허용되는 점
      var idx = -1;
      if (st.side > 0) { for (i = n; i >= 0; i--) if (ok[i]) { idx = i; break; } }
      else { for (i = 0; i <= n; i++) if (ok[i]) { idx = i; break; } }
      if (idx < 0) return null;
      var lo = idx, hi = idx;
      while (lo > 0 && ok[lo - 1]) lo--;
      while (hi < n && ok[hi + 1]) hi++;
      function root(i0, i1) { var x0 = xs[i0], x1 = xs[i1], f0 = p.U(x0) - st.E; for (var k = 0; k < 40; k++) { var xm = (x0 + x1) / 2, fm = p.U(xm) - st.E; if ((fm > 0) === (f0 > 0)) { x0 = xm; f0 = fm; } else x1 = xm; } return (x0 + x1) / 2; }
      var L = lo > 0 ? root(lo - 1, lo) : a, R = hi < n ? root(hi, hi + 1) : b;
      // 모든 허용 구간(표시용)
      var segs = [], s0 = null;
      for (i = 0; i <= n; i++) { if (ok[i] && s0 === null) s0 = i; if ((!ok[i] || i === n) && s0 !== null) { segs.push([xs[s0], xs[ok[i] ? i : i - 1]]); s0 = null; } }
      return { L: L, R: R, segs: segs, open: lo === 0 || hi === n };
    }
    var reg;
    function reset() {
      st.playing = false; loop.pause(); bPlay.textContent = api.reduced ? '0.08초 진행' : '움직이기';
      reg = region();
      if (reg) { st.x = st.side > 0 ? reg.R : reg.L; st.v = 0; }
      readouts(); draw();
    }
    function advance(T) {
      var p = P(), h = 0.0005, n = Math.round(T / h);
      for (var i = 0; i < n; i++) {
        var a = -p.dU(st.x) / M;
        st.v += a * h / 2; st.x += st.v * h; st.v += -p.dU(st.x) / M * h / 2;
      }
      // 수치 오차로 E가 새지 않게 속력을 에너지에서 다시 맞춘다
      var K = st.E - p.U(st.x);
      if (K > 0) st.v = (st.v >= 0 ? 1 : -1) * Math.sqrt(2 * K / M);
      readouts();
    }
    var loop = api.loop(function (dt) { if (!st.playing || !reg) return; advance(dt * 0.6); draw(); });
    loop.pause();
    function fx(x) { return (Math.abs(x) < 0.0005 ? 0 : x).toFixed(2); }
    function readouts() {
      var p = P();
      if (!reg) { rTP.set('없음(E가 U의 최솟값보다 작다)'); rX.set('–'); rKU.set('–'); rV.set('–'); return; }
      rTP.set(fx(reg.L) + ' m ~ ' + fx(reg.R) + ' m');
      var U = p.U(st.x), K = Math.max(0, st.E - U);
      rX.set(fx(st.x) + ' m');
      rKU.set(K.toFixed(2) + ' J / ' + (U < 0 ? '−' : '') + Math.abs(U).toFixed(2) + ' J');
      rV.set(Math.sqrt(2 * K / M).toFixed(2) + ' m/s');
    }
    function arrow(x1, y1, x2, y2, col, lw) {
      var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy); if (L < 3) return;
      var ux = dx / L, uy = dy / L, hl = Math.min(10, L * 0.45);
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hl, y2 - uy * hl); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - ux * hl - uy * hl * 0.5, y2 - uy * hl + ux * hl * 0.5); ctx.lineTo(x2 - ux * hl + uy * hl * 0.5, y2 - uy * hl - ux * hl * 0.5); ctx.closePath(); ctx.fill();
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, p = P();
      ctx.clearRect(0, 0, w, h);
      var L = 52, R = w - 14, Tp = 18, B = h - 72;
      var sx = function (x) { return L + (R - L) * (x - p.xr[0]) / (p.xr[1] - p.xr[0]); };
      var sy = function (u) { return B - (B - Tp) * (u - p.ur[0]) / (p.ur[1] - p.ur[0]); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var u = Math.ceil(p.ur[0]); u <= p.ur[1]; u++) { ctx.beginPath(); ctx.moveTo(L, sy(u)); ctx.lineTo(R, sy(u)); ctx.stroke(); ctx.fillText(String(u).replace('-', '−'), L - 6, sy(u) + 4); }
      ctx.textAlign = 'center';
      for (var x = -1.5; x <= 1.51; x += 0.5) { ctx.beginPath(); ctx.moveTo(sx(x), Tp); ctx.lineTo(sx(x), B); ctx.stroke(); ctx.fillText(String(x).replace('-', '−'), sx(x), B + 14); }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('위치 x (m)', (L + R) / 2, B + 30);
      ctx.save(); ctx.translate(13, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('에너지 (J)', 0, 0); ctx.restore();
      // 금지 구역(U > E) 옅게
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, R - L, B - Tp); ctx.clip();
      ctx.fillStyle = T.figSoftRed; ctx.globalAlpha = 0.55;
      var n = 300, xa = p.xr[0], xb = p.xr[1];
      for (var i = 0; i < n; i++) { var x0 = xa + (xb - xa) * i / n, x1 = xa + (xb - xa) * (i + 1) / n; if (p.U((x0 + x1) / 2) > st.E) ctx.fillRect(sx(x0), Tp, sx(x1) - sx(x0) + 0.6, B - Tp); }
      ctx.globalAlpha = 1;
      // U 곡선
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2.6; ctx.beginPath();
      for (i = 0; i <= n; i++) { var xx = xa + (xb - xa) * i / n; if (i) ctx.lineTo(sx(xx), sy(p.U(xx))); else ctx.moveTo(sx(xx), sy(p.U(xx))); }
      ctx.stroke();
      // E 선: 전체는 점선, 허용 구간은 굵게
      ctx.setLineDash([5, 5]); ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(L, sy(st.E)); ctx.lineTo(R, sy(st.E)); ctx.stroke(); ctx.setLineDash([]);
      if (reg) {
        ctx.lineWidth = 3.5;
        reg.segs.forEach(function (s) { ctx.strokeStyle = T.figLine; ctx.beginPath(); ctx.moveTo(sx(s[0]), sy(st.E)); ctx.lineTo(sx(s[1]), sy(st.E)); ctx.stroke(); });
        ctx.strokeStyle = T.figViolet; ctx.beginPath(); ctx.moveTo(sx(reg.L), sy(st.E)); ctx.lineTo(sx(reg.R), sy(st.E)); ctx.stroke();
        [reg.L, reg.R].forEach(function (xt) { if (xt > p.xr[0] + 0.01 && xt < p.xr[1] - 0.01) { ctx.beginPath(); ctx.arc(sx(xt), sy(st.E), 5, 0, Math.PI * 2); ctx.fillStyle = T.figViolet; ctx.fill(); } });
        // 입자
        var bx = sx(st.x), Ux = p.U(st.x);
        ctx.strokeStyle = T.figGreen; ctx.lineWidth = 6; ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.moveTo(bx, sy(Ux)); ctx.lineTo(bx, sy(st.E)); ctx.stroke(); ctx.globalAlpha = 1;
        var F = -p.dU(st.x), fl = Math.max(-80, Math.min(80, F * 9));
        arrow(bx, sy(st.E) - 14, bx + fl, sy(st.E) - 14, T.figRed, 2.6);
        ctx.beginPath(); ctx.arc(bx, sy(st.E), 7, 0, Math.PI * 2); ctx.fillStyle = T.figInk; ctx.fill();
        ctx.beginPath(); ctx.arc(bx, sy(Ux), 4, 0, Math.PI * 2); ctx.fillStyle = T.figBlue; ctx.fill();
        if (sy(Ux) - sy(st.E) > 18) { ctx.fillStyle = T.figGreen; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('K', bx + 8, (sy(Ux) + sy(st.E)) / 2 + 4); }
      }
      ctx.restore();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillStyle = T.figViolet;
      ctx.fillText('E', R - 4, sy(st.E) - 6);
      ctx.fillStyle = T.figBlue; ctx.textAlign = 'left'; ctx.fillText('U(x)', sx(p.xr[1] - 0.32) - 22, sy(p.U(p.xr[1] - 0.32)) + 4);
      // 아래 범례
      var ly = h - 22; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      var items = [[T.figViolet, '갈 수 있는 구간'], [T.figGreen, 'K = E − U'], [T.figRed, '힘 F = −dU/dx'], [T.figSoftRed, 'U > E (못 감)']];
      var lx = L, row = 0;
      items.forEach(function (it) {
        var tw = ctx.measureText(it[1]).width + 30;
        if (lx + tw > R) { lx = L; row++; }
        ctx.fillStyle = it[0]; ctx.fillRect(lx, ly - 9 + row * 16 - 8 * (w < 560 ? 1 : 0), 14, 8);
        ctx.fillStyle = T.figInk; ctx.fillText(it[1], lx + 19, ly + row * 16 - 8 * (w < 560 ? 1 : 0)); lx += tw;
      });
    }
    api.onResize(draw);
    reset();
  },
});
