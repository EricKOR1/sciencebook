/* 물리학 1 힘과 에너지: 수레 두 대의 일직선 충돌 — 운동량 합은 보존, 붙는 충돌에서는 운동 에너지 합이 줄어든다 */
Sims.register('collision-1d', {
  title: '수레 두 대의 충돌 — 운동량과 운동 에너지 비교하기',
  caption: '두 수레의 질량과 처음 속도를 정하고, 튕기는 충돌(탄성 충돌)과 붙는 충돌(완전 비탄성 충돌)을 골라 충돌시켜 보자. 어느 경우에도 운동량의 합은 충돌 전과 후가 같지만, 붙는 충돌에서는 운동 에너지의 합이 줄어든다(줄어든 만큼 열·소리·변형으로 바뀐다). 오른쪽을 (+) 방향으로 정했고, 레일의 마찰과 공기 저항은 없다고 가정했다.',
  init: function (api) {
    var W = 0.9;                      // 수레 길이(m, 그림용)
    var state = { mA: 2, mB: 1, vA: 3, vB: 0, type: 'stick', t: 0, playing: false, done: false };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.5 : 0.62; }, label: '레일 위 두 수레와 충돌 전후 속도·운동량·운동 에너지 막대그래프' });
    var ctx = cv.ctx;

    var rV = api.readout('충돌 후 속도 A, B');
    var rP = api.readout('운동량 합 (전 → 후)');
    var rK = api.readout('운동 에너지 합 (전 → 후)');

    var g1 = api.group();
    var bStick = api.button('붙음: 완전 비탄성 충돌', function () { setType('stick'); }, { toggle: true, pressed: true, parent: g1 });
    var bBounce = api.button('튕김: 탄성 충돌', function () { setType('bounce'); }, { toggle: true, parent: g1 });
    api.button('충돌시키기', function () { start(); }, { primary: true, parent: g1 });
    api.slider({ id: 'collision-1d-ma', label: '수레 A 질량', min: 0.5, max: 4, step: 0.5, value: state.mA, format: function (v) { return v.toFixed(1) + ' kg'; }, onInput: function (v) { state.mA = v; reset(); } });
    api.slider({ id: 'collision-1d-va', label: '수레 A 처음 속도', min: -3, max: 4, step: 0.5, value: state.vA, format: fmtV, onInput: function (v) { state.vA = v; reset(); } });
    api.slider({ id: 'collision-1d-mb', label: '수레 B 질량', min: 0.5, max: 4, step: 0.5, value: state.mB, format: function (v) { return v.toFixed(1) + ' kg'; }, onInput: function (v) { state.mB = v; reset(); } });
    api.slider({ id: 'collision-1d-vb', label: '수레 B 처음 속도', min: -4, max: 3, step: 0.5, value: state.vB, format: fmtV, onInput: function (v) { state.vB = v; reset(); } });

    function fmtV(v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + ' m/s'; }
    function fmtS(v, u) { var r = Math.round(v * 100) / 100; if (Math.abs(r) < 0.005) r = 0; return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r).toFixed(2).replace(/\.?0+$/, '') + ' ' + u; }
    function fmtE(v) { var r = Math.round(v * 100) / 100; return r.toFixed(2).replace(/\.?0+$/, '') + ' J'; }
    function setType(t) {
      state.type = t;
      bStick.setAttribute('aria-pressed', t === 'stick' ? 'true' : 'false');
      bBounce.setAttribute('aria-pressed', t === 'bounce' ? 'true' : 'false');
      reset();
    }

    // 충돌 결과 계산
    function result() {
      var mA = state.mA, mB = state.mB, vA = state.vA, vB = state.vB, M = mA + mB;
      var meet = vA > vB + 1e-9;      // A가 왼쪽에 있으므로 A가 B보다 빨라야(오른쪽으로) 만난다
      var a = vA, b = vB;
      if (meet) {
        if (state.type === 'stick') { a = b = (mA * vA + mB * vB) / M; }
        else { a = ((mA - mB) * vA + 2 * mB * vB) / M; b = ((mB - mA) * vB + 2 * mA * vA) / M; }
      }
      return {
        meet: meet, a: a, b: b,
        p0: mA * vA + mB * vB, p1: mA * a + mB * b,
        kA0: 0.5 * mA * vA * vA, kB0: 0.5 * mB * vB * vB, kA1: 0.5 * mA * a * a, kB1: 0.5 * mB * b * b,
      };
    }
    // 시간 계획: 충돌 시각 tc에 두 수레가 x = 0에서 맞닿도록 처음 위치를 정한다
    function plan() {
      var R = result(), vmax = Math.max(Math.abs(state.vA), Math.abs(state.vB), 0.01);
      var tc = Math.min(1.4, (3.4 - W / 2) / vmax);
      if (!R.meet) return { R: R, tc: 1e9, xA0: -1.4, xB0: 1.4 };
      return { R: R, tc: tc, xA0: -W / 2 - state.vA * tc, xB0: W / 2 - state.vB * tc };
    }
    function positions(t) {
      var P = plan(), R = P.R;
      if (!R.meet || t <= P.tc) return { xA: P.xA0 + state.vA * t, xB: P.xB0 + state.vB * t, after: false, P: P };
      var dt = t - P.tc;
      return { xA: -W / 2 + R.a * dt, xB: W / 2 + R.b * dt, after: true, P: P };
    }
    function endTime() { var P = plan(); return P.R.meet ? P.tc + 1.8 : 2.2; }

    function reset() { state.t = 0; state.done = false; state.playing = false; loop.pause(); readouts(); draw(); }
    function start() {
      if (api.reduced) { state.t = endTime(); state.done = true; draw(); return; }
      state.t = 0; state.done = false; state.playing = true; loop.play();
    }
    var loop = api.loop(function (dt) {
      if (!state.playing) return;
      state.t += dt;
      if (state.t >= endTime()) { state.t = endTime(); state.playing = false; state.done = true; loop.pause(); }
      draw();
    });
    loop.pause();

    function readouts() {
      var R = result();
      if (!R.meet) { rV.set('만나지 않음 (A가 B보다 빨라야 부딪친다)'); }
      else rV.set('A ' + fmtS(R.a, 'm/s') + ', B ' + fmtS(R.b, 'm/s'));
      rP.set(fmtS(R.p0, 'kg·m/s') + ' → ' + fmtS(R.p1, 'kg·m/s') + ' (보존)');
      var k0 = R.kA0 + R.kB0, k1 = R.kA1 + R.kB1, lost = k0 - k1;
      rK.set(fmtE(k0) + ' → ' + fmtE(k1) + (lost > 0.005 ? ' (' + fmtE(lost) + ' 줄어듦)' : ' (그대로)'));
    }

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) {
        return { scene: { x: 0, y: 0, w: w, h: h * 0.26 },
          v: { x: 0, y: h * 0.28, w: w, h: h * 0.34 },
          p: { x: 0, y: h * 0.64, w: w * 0.5, h: h * 0.36 }, k: { x: w * 0.5, y: h * 0.64, w: w * 0.5, h: h * 0.36 } };
      }
      return { scene: { x: 0, y: 0, w: w, h: h * 0.36 },
        v: { x: 0, y: h * 0.4, w: w * 0.4, h: h * 0.6 },
        p: { x: w * 0.4, y: h * 0.4, w: w * 0.3, h: h * 0.6 }, k: { x: w * 0.7, y: h * 0.4, w: w * 0.3, h: h * 0.6 } };
    }

    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawScene(T, L.scene);
      drawBars(T);
    }

    function drawScene(T, r) {
      var pos = positions(state.t), P = pos.P, R = P.R;
      var X0 = r.x + 16, X1 = r.x + r.w - 16, sx = function (x) { return (X0 + X1) / 2 + x * (X1 - X0) / 8; };
      var railY = r.y + r.h - 22;
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X0, railY); ctx.lineTo(X1, railY); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('(+) 방향 →', X0, r.y + 14);
      ctx.textAlign = 'right';
      var msg = !R.meet ? '두 수레가 만나지 않는다' : pos.after ? (state.type === 'stick' ? '충돌 후: 붙어서 함께 운동' : '충돌 후: 튕겨 나감') : '충돌 전';
      ctx.fillText(msg, X1, r.y + 14);
      cart(T, sx(pos.xA), railY, state.mA, 'A', T.figBlue, T.figSoftBlue, pos.after ? R.a : state.vA, sx);
      cart(T, sx(pos.xB), railY, state.mB, 'B', T.figRed, T.figSoftRed, pos.after ? R.b : state.vB, sx);
      if (pos.after && state.type === 'stick') {   // 찍찍이로 붙은 자리
        ctx.fillStyle = T.figAmber; ctx.fillRect(sx((pos.xA + pos.xB) / 2) - 2, railY - 30, 4, 18);
      }
      ctx.restore();
    }
    function cart(T, cx, railY, m, name, stroke, fill, v, sx) {
      var bw = sx(W / 2) - sx(0), half = bw, hgt = 16 + m * 7;
      var top = railY - 8 - hgt;
      ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(cx - half + 2, top, 2 * half - 4, hgt); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.figInk;
      [cx - half * 0.55, cx + half * 0.55].forEach(function (wx) { ctx.beginPath(); ctx.arc(wx, railY - 5, 5, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(name, cx, top + hgt / 2);
      ctx.textBaseline = 'alphabetic';
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.fillText(m.toFixed(1) + ' kg', cx, railY + 15);
      // 속도 화살표
      if (Math.abs(v) > 0.01) {
        var len = v * 16, ay = top - 10;
        ctx.strokeStyle = stroke; ctx.fillStyle = stroke; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(cx, ay); ctx.lineTo(cx + len, ay); ctx.stroke();
        var d = len > 0 ? 1 : -1;
        ctx.beginPath(); ctx.moveTo(cx + len + d * 6, ay); ctx.lineTo(cx + len - d * 2, ay - 5); ctx.lineTo(cx + len - d * 2, ay + 5); ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('정지', cx, top - 6);
      }
    }

    function niceMax(v) { var c = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100]; for (var i = 0; i < c.length; i++) if (v <= c[i]) return c[i]; return Math.ceil(v / 50) * 50; }

    function drawBars(T) {
      var L = layout(), R = result();
      // 1) 속도
      var vmax = niceMax(Math.max(Math.abs(state.vA), Math.abs(state.vB), Math.abs(R.a), Math.abs(R.b), 1));
      signedPanel(T, L.v, '속도 (m/s)', vmax, [
        { lab: 'A 전', v: state.vA, c: T.figBlue, f: T.figSoftBlue }, { lab: 'B 전', v: state.vB, c: T.figRed, f: T.figSoftRed },
        { lab: 'A 후', v: R.a, c: T.figBlue, f: T.figSoftBlue, after: true }, { lab: 'B 후', v: R.b, c: T.figRed, f: T.figSoftRed, after: true }]);
      // 2) 운동량 합
      var pmax = niceMax(Math.max(Math.abs(state.mA * state.vA), Math.abs(state.mB * state.vB), Math.abs(state.mA * R.a), Math.abs(state.mB * R.b), Math.abs(R.p0), 1));
      signedPanel(T, L.p, '운동량 합 (kg·m/s)', pmax, [
        { lab: '전', v: R.p0, c: T.figViolet, f: T.figSoftViolet }, { lab: '후', v: R.p1, c: T.figViolet, f: T.figSoftViolet, after: true }], true);
      // 3) 운동 에너지 합 (A, B 쌓기)
      kePanel(T, L.k, R);
    }
    function panelFrame(T, r, title) {
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(title, r.x + r.w / 2, r.y + 14);
      return { L: r.x + 38, R: r.x + r.w - 10, T: r.y + 26, B: r.y + r.h - 36 };
    }
    function signedPanel(T, r, title, vmax, bars, sum) {
      var f = panelFrame(T, r, title), mid = (f.T + f.B) / 2, sy = function (v) { return mid - v / vmax * (f.B - f.T) / 2; };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      [-vmax, 0, vmax].forEach(function (v) { ctx.beginPath(); ctx.moveTo(f.L, sy(v)); ctx.lineTo(f.R, sy(v)); ctx.stroke(); ctx.fillText((v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v), f.L - 4, sy(v) + 4); });
      ctx.strokeStyle = T.figLine; ctx.beginPath(); ctx.moveTo(f.L, mid); ctx.lineTo(f.R, mid); ctx.stroke();
      var n = bars.length, slot = (f.R - f.L) / n, bw = Math.min(34, slot * 0.55);
      bars.forEach(function (b, i) {
        var cx = f.L + slot * (i + 0.5), y = sy(b.v);
        ctx.fillStyle = b.f; ctx.strokeStyle = b.c; ctx.lineWidth = 2;
        if (b.after) ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.rect(cx - bw / 2, Math.min(y, mid), bw, Math.max(Math.abs(y - mid), 1)); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(b.lab, cx, f.B + 15);
        var val = Math.round(b.v * 100) / 100; if (Math.abs(val) < 0.005) val = 0;
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
        ctx.fillText((val > 0 ? '+' : val < 0 ? '−' : '') + Math.abs(val).toFixed(2).replace(/\.?0+$/, ''), cx, b.v >= 0 ? Math.min(y, mid) - 4 : Math.max(y, mid) + 12);
      });
      if (sum) {
        ctx.fillStyle = T.figGreen; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('전과 후가 같다 = 보존', (f.L + f.R) / 2, f.B + 31);
      }
      if (bars.length === 4) { // 전/후 사이 구분선
        ctx.strokeStyle = T.figLine; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo((f.L + f.R) / 2, f.T); ctx.lineTo((f.L + f.R) / 2, f.B + 4); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    function kePanel(T, r, R) {
      var f = panelFrame(T, r, '운동 에너지 합 (J)');
      var k0 = R.kA0 + R.kB0, k1 = R.kA1 + R.kB1, kmax = niceMax(Math.max(k0, 1));
      var sy = function (v) { return f.B - v / kmax * (f.B - f.T); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      [0, kmax / 2, kmax].forEach(function (v) { ctx.beginPath(); ctx.moveTo(f.L, sy(v)); ctx.lineTo(f.R, sy(v)); ctx.stroke(); ctx.fillText(+v.toFixed(1), f.L - 4, sy(v) + 4); });
      var slot = (f.R - f.L) / 2, bw = Math.min(34, slot * 0.55);
      [[R.kA0, R.kB0, '전', false], [R.kA1, R.kB1, '후', true]].forEach(function (s, i) {
        var cx = f.L + slot * (i + 0.5);
        if (s[3]) ctx.setLineDash([4, 3]);
        ctx.lineWidth = 2;
        ctx.fillStyle = T.figSoftBlue; ctx.strokeStyle = T.figBlue; ctx.beginPath(); ctx.rect(cx - bw / 2, sy(s[0]), bw, f.B - sy(s[0])); ctx.fill(); if (s[0] > 1e-6) ctx.stroke();
        ctx.fillStyle = T.figSoftRed; ctx.strokeStyle = T.figRed; ctx.beginPath(); ctx.rect(cx - bw / 2, sy(s[0] + s[1]), bw, sy(s[0]) - sy(s[0] + s[1])); ctx.fill(); if (s[1] > 1e-6) ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText(s[2], cx, f.B + 15);
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.fillText(+(s[0] + s[1]).toFixed(2), cx, sy(s[0] + s[1]) - 4);
        if (i === 1 && k0 - k1 > 0.005) {   // 줄어든 운동 에너지
          ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
          ctx.strokeRect(cx - bw / 2, sy(k0), bw, sy(k1) - sy(k0)); ctx.setLineDash([]);
          ctx.fillStyle = T.figAmber; ctx.font = '600 11px ' + T.fontBody;
          var ly = (sy(k0) + sy(k1)) / 2 + 4;
          ctx.textAlign = 'right'; ctx.fillText('열·소리로', cx - bw / 2 - 3, ly - 6); ctx.fillText(+(k0 - k1).toFixed(2) + ' J', cx - bw / 2 - 3, ly + 7);
        }
      });
      // 범례
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      var lx = (f.L + f.R) / 2 - 42, ly = f.B + 31;
      ctx.fillStyle = T.figBlue; ctx.fillRect(lx, ly - 9, 9, 9); ctx.fillStyle = T.figInk; ctx.fillText('수레 A', lx + 12, ly);
      ctx.fillStyle = T.figRed; ctx.fillRect(lx + 50, ly - 9, 9, 9); ctx.fillStyle = T.figInk; ctx.fillText('B', lx + 62, ly);
    }

    api.onResize(draw);
    readouts(); draw();
  },
});
