/* 5-5 전자기 유도: 코일을 지나는 자기력선 수가 변할 때만 유도 전류가 흐른다 (정성적) + 발전기(회전)에서 교류 */
Sims.register('induction', {
  title: '자석과 코일 — 자기력선 수가 변할 때만 바늘이 움직인다',
  caption: '자석을 손가락이나 마우스로 끌거나 단추를 눌러 코일에 넣고 빼 보자. 코일을 지나는 자기력선의 수가 변하는 동안에만 검류계 바늘이 움직이고, 넣을 때와 뺄 때는 바늘이 반대쪽으로 가며, 빠르게 움직이거나 코일을 많이 감을수록 크게 움직인다. ‘발전기’에서는 자석 사이에서 코일이 돌 때 바늘이 좌우로 번갈아 움직이는 교류가 생긴다. 자기력선은 대표 선 몇 개로만 그렸고 바늘의 크기는 정성적으로만 나타냈다(설명을 위해 단순화).',
  init: function (api) {
    /* ── 세계 좌표(단위: 임의 길이), 자석 기준 ── */
    var A_HALF = 1.25, POLE = 1.0, MAG_H = 0.36;        // 자석 몸통 반길이, 극 위치, 반높이
    var R = 0.75, COIL_HL = 0.95, XC = -1.4;             // 코일 반지름, 반길이, 중심
    var X_IN = XC, X_FAR = 2.9;                          // 자석 중심이 갈 수 있는 범위
    var K = 6;                                           // 위쪽 반평면의 대표 자기력선 수
    var V_SLOW = 1.4, V_FAST = 4.2;                      // 천천히/빠르게 (단위/초)
    var VX0 = -3.6, VW = 8, VH = 3.3;                    // 장면 보기 범위
    var X2 = 0.4, LC = 1.05, GAP = 1.4, BLOCK_W = 1.0, BLOCK_H = 1.22; // 발전기 모드
    var WIN = 9;                                         // 기록 창(초)
    var WN = 26, ZETA = 0.85;                            // 바늘의 흔들림 감쇠

    var levels = [];
    for (var k = 0; k < K; k++) levels.push((k + 0.5) / K);

    // 자석(두 극 모형)의 자기력선 '흐름 함수' 크기: 축 대칭이라 이 값이 같은 곳을 이으면 자기력선이 된다
    function psi(x, y) {
      var cN = (x + POLE) / Math.hypot(x + POLE, y), cS = (x - POLE) / Math.hypot(x - POLE, y);
      return Math.abs(0.5 * (cS - cN));
    }
    // 코일 가운데 고리를 지나는 자기력선 양(0~1로 맞춤)
    var PHI_MAX = psi(0, R);
    function phiOf(xm) { return psi(XC - xm, R) / PHI_MAX; }
    function linesThrough(xm) {
      var p = psi(XC - xm, R), n = 0;
      levels.forEach(function (l) { if (l < p) n++; });
      return n;
    }

    /* 자기력선 미리 그려 두기(자석 기준 좌표) */
    function field(x, y) {
      var dxN = x + POLE, dxS = x - POLE;
      var rN = Math.pow(dxN * dxN + y * y, 1.5), rS = Math.pow(dxS * dxS + y * y, 1.5);
      return [dxN / rN - dxS / rS, y / rN - y / rS];
    }
    var lines = levels.map(function (lv) {
      var eps = 0.08, lo = 0.001, hi = Math.PI - 0.001;
      for (var i = 0; i < 50; i++) {
        var mid = (lo + hi) / 2;
        if (psi(-POLE + eps * Math.cos(mid), eps * Math.sin(mid)) > lv) lo = mid; else hi = mid;
      }
      var th = (lo + hi) / 2, x = -POLE + eps * Math.cos(th), y = eps * Math.sin(th), pts = [[x, y]];
      for (var s = 0; s < 6000; s++) {
        var dS = Math.hypot(x - POLE, y), dN = Math.hypot(x + POLE, y);
        if (dS < 0.07) break;
        var ds = Math.min(0.4, 0.02 + 0.03 * Math.min(dN, dS));
        var f1 = field(x, y), m1 = Math.hypot(f1[0], f1[1]);
        var xh = x + 0.5 * ds * f1[0] / m1, yh = y + 0.5 * ds * f1[1] / m1;
        var f2 = field(xh, yh), m2 = Math.hypot(f2[0], f2[1]);
        x += ds * f2[0] / m2; y += ds * f2[1] / m2;
        pts.push([x, y]);
        if (Math.abs(x) > 40 || Math.abs(y) > 40) break;
      }
      pts.push([POLE, 0]);
      var out = function (p) { return Math.abs(p[0]) > A_HALF + 0.3 || Math.abs(p[1]) > MAG_H + 0.3; };
      var ia = -1, ib = -1;
      for (var j = 0; j < pts.length - 1; j++) if (out(pts[j])) { if (ia < 0) ia = j; ib = j; }
      return { lv: lv, pts: pts, arrows: ia >= 0 ? [ia, Math.max(ia, ib - 1)] : [] };
    });

    // '빠르게 넣기'(100회)에서 바늘이 거의 끝까지 가도록 맞춘 비례 상수(정성적). 200회로 빠르게 넣으면 끝에 닿는다
    var slopeMax = 0;
    for (var xs = X_IN; xs < X_FAR; xs += 0.01) slopeMax = Math.max(slopeMax, Math.abs(phiOf(xs + 0.01) - phiOf(xs)) / 0.01);
    var G1 = 1 / (V_FAST * slopeMax * 0.5), G2 = 1 / (2 * Math.PI * 1.0 * 0.5);

    var st = {
      mode: 1, xm: X_FAR, moving: false, v: 0, dest: X_FAR, dragging: false, dragX: X_FAR, grab: 0,
      theta: 0, spinning: false, freq: 0.5, turns: 100,
      needle: 0, nVel: 0, cur: 0, dphi: 0, vel: 0, idle: 0, touched: false, hint: '',
    };
    function newTrace() { return { t: 0, samples: [], events: [], example: true, peakP: 0, peakN: 0 }; }
    var traces = { 1: newTrace(), 2: newTrace() };
    function tr() { return traces[st.mode]; }

    /* ── 캔버스 ── */
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? (0.6 * w + 290) / w : 0.66; }, label: '코일과 막대자석, 검류계, 바늘 기록 그래프' });
    var ctx = cv.ctx;
    cv.canvas.style.touchAction = 'pan-y';

    var rLines = api.readout('코일을 지나는 자기력선');
    var rChange = api.readout('자기력선 수의 변화');
    var rNeedle = api.readout('검류계 바늘');

    var tabs = api.group();
    var tab1 = api.button('자석 넣고 빼기', function () { setMode(1); }, { toggle: true, pressed: true, parent: tabs });
    var tab2 = api.button('발전기(회전)', function () { setMode(2); }, { toggle: true, pressed: false, parent: tabs });
    var g1 = api.group();
    api.button('넣기', function () { insert(V_SLOW, '넣기'); }, { parent: g1 });
    api.button('빼기', function () { removeM(); }, { parent: g1 });
    api.button('멈추기', function () { stopM(); }, { parent: g1 });
    api.button('빠르게 넣기', function () { insert(V_FAST, '빠르게 넣기'); }, { primary: true, parent: g1 });
    var g2 = api.group(); g2.style.display = 'none';
    var spinBtn = api.button(api.reduced ? '한 바퀴 돌리기' : '돌리기', function () { toggleSpin(); }, { primary: true, parent: g2 });
    var speed = api.slider({ id: 'induction-speed', label: '회전 빠르기', min: 0.2, max: 1, step: 0.1, value: 0.5, parent: g2,
      format: function (v) { return '1초에 ' + v.toFixed(1) + '바퀴'; },
      onInput: function (v) { st.freq = v; } });
    speed.input.closest('label').style.display = 'none';
    api.slider({ id: 'induction-turns', label: '코일 감은 수', min: 50, max: 200, step: 50, value: 100,
      format: function (v) { return v + '회'; },
      onInput: function (v) { st.turns = v; tr().peakP = 0; tr().peakN = 0; readouts(); draw(); } });

    function setMode(m) {
      if (st.mode === m) return;
      if (st.mode === 1) { st.moving = false; st.dragging = false; } else { st.spinning = false; spinLabel(); }
      st.mode = m; st.needle = 0; st.nVel = 0; st.cur = 0; st.dphi = 0;
      tab1.setAttribute('aria-pressed', m === 1 ? 'true' : 'false');
      tab2.setAttribute('aria-pressed', m === 2 ? 'true' : 'false');
      g1.style.display = m === 1 ? '' : 'none';
      g2.style.display = m === 2 ? '' : 'none';
      speed.input.closest('label').style.display = m === 2 ? '' : 'none';
      st.hint = ''; loop.pause(); readouts(); draw();
    }
    function spinLabel() { if (!api.reduced) spinBtn.textContent = st.spinning ? '멈추기' : '돌리기'; }

    /* ── 물리(정성적) 한 걸음 ── */
    function step(dt) {
      var T0 = tr(), dphi = 0;
      if (st.mode === 1) {
        var p0 = phiOf(st.xm), x0 = st.xm;
        if (st.dragging) st.xm = st.dragX;
        else if (st.moving) {
          st.xm += st.v * dt;
          if ((st.v < 0 && st.xm <= st.dest) || (st.v > 0 && st.xm >= st.dest)) { st.xm = st.dest; st.moving = false; st.v = 0; }
        }
        dphi = (phiOf(st.xm) - p0) / dt;
        st.vel += ((st.xm - x0) / dt - st.vel) * Math.min(1, dt / 0.06);
        var drive = G1 * (st.turns / 200) * dphi;
        st.cur += (drive - st.cur) * Math.min(1, dt / (st.dragging ? 0.05 : 0.012));
      } else {
        if (st.spinning) { st.theta += 2 * Math.PI * st.freq * dt; dphi = -2 * Math.PI * st.freq * Math.sin(st.theta); }
        st.cur = G2 * (st.turns / 200) * dphi;
      }
      st.dphi = dphi;
      // 바늘: 실제 검류계처럼 약간 늦게 따라가고, 전류가 0이면 가운데로 돌아온다
      var n = Math.ceil(dt / 0.004), h = dt / n;
      for (var i = 0; i < n; i++) {
        st.nVel += (WN * WN * (st.cur - st.needle) - 2 * ZETA * WN * st.nVel) * h;
        st.needle += st.nVel * h;
        if (st.needle > 1.12) { st.needle = 1.12; st.nVel = 0; }
        if (st.needle < -1.12) { st.needle = -1.12; st.nVel = 0; }
      }
      T0.peakP = Math.max(T0.peakP, st.needle); T0.peakN = Math.min(T0.peakN, st.needle);
      T0.t += dt;
      T0.samples.push([T0.t, st.needle]);
      while (T0.samples.length && T0.samples[0][0] < T0.t - WIN - 1) T0.samples.shift();
      while (T0.events.length && T0.events[0][0] < T0.t - WIN - 3) T0.events.shift();
    }
    function busy() { return st.mode === 1 ? (st.moving || st.dragging) : st.spinning; }
    function settled() { return !busy() && Math.abs(st.needle) < 0.003 && Math.abs(st.nVel) < 0.02; }

    var loop = api.loop(function (dt) {
      step(dt);
      if (settled()) { st.idle += dt; if (st.idle > 1.2) loop.pause(); } else st.idle = 0;
      readouts(); draw();
    });
    loop.pause();

    function simulate(sec, until) {
      var dt = 1 / 60;
      for (var t = 0; t < sec; t += dt) { step(dt); if (until && until()) break; }
    }
    function event(label) {
      var T0 = tr();
      if (T0.example) { T0.samples = []; T0.events = []; T0.example = false; }
      T0.events.push([T0.t, label]); T0.peakP = 0; T0.peakN = 0; st.touched = true;
    }
    function run() {
      st.idle = 0;
      if (api.reduced && !st.dragging) {           // 움직임 줄이기: 결과를 바로 계산해 기록으로 보여 준다
        simulate(20, function () { return settled(); });
        simulate(0.8);
        readouts(); draw(); return;
      }
      loop.play(); readouts(); draw();
    }
    function insert(v, label) {
      if (st.xm <= X_IN + 0.01) { st.hint = '이미 코일 안에 있다. 먼저 빼 보자'; draw(); return; }
      st.hint = ''; event(label); st.moving = true; st.v = -v; st.dest = X_IN; run();
    }
    function removeM() {
      if (st.xm >= X_FAR - 0.01) { st.hint = '자석이 이미 코일 밖에 있다'; draw(); return; }
      st.hint = ''; event('빼기'); st.moving = true; st.v = V_SLOW; st.dest = X_FAR; run();
    }
    function stopM() { st.hint = ''; event('멈춤'); st.moving = false; st.v = 0; run(); }
    function toggleSpin() {
      if (api.reduced) {
        event('한 바퀴'); st.spinning = true;
        var target = st.theta + 2 * Math.PI;
        simulate(10, function () { return st.theta >= target; });
        st.theta = target; st.spinning = false; event('멈춤'); run(); return;
      }
      if (st.spinning) { st.spinning = false; event('멈춤'); } else { st.spinning = true; event('돌리기'); }
      spinLabel(); run();
    }

    /* 처음 화면: 예시 기록(천천히 넣기 → 멈춤 → 빼기 / 두 바퀴 돌리기)을 미리 계산해 둔다 */
    (function () {
      st.mode = 1; var T1 = traces[1];
      T1.events.push([0, '넣기']); st.moving = true; st.v = -V_SLOW; st.dest = X_IN;
      simulate(10, function () { return !st.moving; });
      T1.events.push([T1.t, '멈춤']); simulate(1.0);
      T1.events.push([T1.t, '빼기']); st.moving = true; st.v = V_SLOW; st.dest = X_FAR;
      simulate(10, function () { return !st.moving; }); simulate(0.8);
      st.mode = 2; var T2 = traces[2];
      T2.events.push([0, '돌리기']); st.spinning = true;
      simulate(4.0); st.theta = 0; st.spinning = false; T2.events.push([T2.t, '멈춤']); simulate(0.8);
      st.mode = 1; st.needle = 0; st.nVel = 0; st.cur = 0; st.dphi = 0;
      [T1, T2].forEach(function (T0) { T0.peakP = 0; T0.peakN = 0; });
    })();

    /* ── 읽기 값 ── */
    function count() {
      if (st.mode === 1) return 2 * linesThrough(st.xm);
      var c = Math.cos(st.theta), n = 0;
      for (var j = 0; j < 9; j++) if (Math.abs(-1 + 0.25 * j) < LC * Math.abs(c) - 1e-6) n++;
      return n;
    }
    function needleText(v) {
      var a = Math.abs(v);
      if (a < 0.02) return '0 (가운데)';
      return (v > 0 ? '오른쪽으로 ' : '왼쪽으로 ') + (a < 0.3 ? '조금' : a < 0.7 ? '중간만큼' : '크게');
    }
    function readouts() {
      var n = count();
      if (st.mode === 1) {
        rLines.set(n + '개');
        rChange.set(Math.abs(st.dphi) < 0.03 ? '변화 없음' : st.dphi > 0 ? '늘어나는 중' : '줄어드는 중');
      } else {
        rLines.set(n === 0 ? '0개' : n + '개 (' + (Math.cos(st.theta) > 0 ? '앞면' : '뒷면') + '으로 들어감)');
        rChange.set(st.spinning ? '늘었다 줄었다 반복' : '변화 없음');
      }
      rNeedle.set(needleText(st.needle));
    }

    /* ── 배치 ── */
    function layout() {
      var w = cv.w, h = cv.h, narrow = w < 560, L = {};
      var hs = narrow ? Math.round(w * 0.6) : Math.round(h * 0.6);
      L.scene = { x: 0, y: 0, w: w, h: hs };
      // 보기 범위: 좁은 화면에서는 양옆을 조금 잘라 크게 보이게 한다
      var x0 = narrow ? -2.75 : VX0, vw = narrow ? 7 : VW;
      var s1 = Math.min(w / vw, hs / VH), ox1 = (w - vw * s1) / 2;
      var coilX = ox1 + (XC - x0) * s1;
      if (st.mode === 1) { L.s = s1; L.vx0 = x0; L.ox = ox1; }
      else { L.vx0 = X2 - 2.7; L.s = Math.min(w / 5.4, hs / VH); L.ox = (w - 5.4 * L.s) / 2; }
      L.oy = hs / 2;
      if (narrow) {
        var dw = Math.min(w, 200);
        L.dial = { x: Math.max(0, Math.min(w - dw, coilX - dw / 2)), y: hs + 8, w: dw, h: 124 };
        L.trace = { x: 0, y: hs + 142, w: w, h: h - hs - 146 };
      } else {
        var dw2 = Math.min(220, w * 0.32);
        L.dial = { x: Math.max(0, coilX - dw2 / 2), y: hs + 8, w: dw2, h: h - hs - 10 };
        var tx = L.dial.x + dw2 + 18;
        L.trace = { x: tx, y: hs + 8, w: w - tx, h: h - hs - 12 };
      }
      return L;
    }
    function S(L, x, y) { return [L.ox + (x - L.vx0) * L.s, L.oy - y * L.s]; }

    /* ── 그리기 ── */
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      ctx.save(); ctx.beginPath(); ctx.rect(L.scene.x, L.scene.y, L.scene.w, L.scene.h); ctx.clip();
      if (st.mode === 1) scene1(T, L); else scene2(T, L);
      ctx.restore();
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, L.scene.h + 0.5); ctx.lineTo(cv.w, L.scene.h + 0.5); ctx.stroke();
      wires(T, L); dial(T, L); trace(T, L);
    }
    function arrowHead(x, y, ang, size, color) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(size, 0); ctx.lineTo(-size * 0.7, size * 0.6); ctx.lineTo(-size * 0.7, -size * 0.6); ctx.closePath();
      ctx.fillStyle = color; ctx.fill(); ctx.restore();
    }
    function helix(T, L, front) {
      var nLoops = 3 + st.turns / 50 * 3, x0 = XC - COIL_HL, len = 2 * COIL_HL, total = nLoops * 2 * Math.PI;
      ctx.lineWidth = front ? 2.4 : 1.4; ctx.strokeStyle = front ? T.figAmber : T.figLine;
      ctx.beginPath();
      var drawing = false;
      for (var i = 0; i <= nLoops * 48; i++) {
        var ph = Math.PI + total * i / (nLoops * 48);
        var z = Math.sin(ph), x = x0 + len * i / (nLoops * 48) + 0.2 * R * z, y = R * Math.cos(ph);
        var p = S(L, x, y), isFront = z >= 0;
        if (isFront === front) { if (!drawing) { ctx.moveTo(p[0], p[1]); drawing = true; } else ctx.lineTo(p[0], p[1]); }
        else drawing = false;
      }
      ctx.stroke();
    }
    function scene1(T, L) {
      var s = L.s, pin = psi(XC - st.xm, R);
      // 자기력선(위·아래 대칭)
      [false, true].forEach(function (hi) {
        lines.forEach(function (ln) {
          var thr = ln.lv < pin;
          if (thr !== hi) return;
          var col = thr ? T.figViolet : T.figLine;
          [1, -1].forEach(function (sg) {
            ctx.beginPath();
            ln.pts.forEach(function (p, i) { var q = S(L, p[0] + st.xm, sg * p[1]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
            ctx.strokeStyle = col; ctx.lineWidth = thr ? 2 : 1.1; ctx.stroke();
            ln.arrows.forEach(function (ix) {
              var a = S(L, ln.pts[ix][0] + st.xm, sg * ln.pts[ix][1]), b = S(L, ln.pts[ix + 1][0] + st.xm, sg * ln.pts[ix + 1][1]);
              arrowHead(a[0], a[1], Math.atan2(b[1] - a[1], b[0] - a[0]), thr ? 6 : 5, col);
            });
          });
        });
      });
      helix(T, L, false);
      // 막대자석(N극이 코일 쪽)
      var tl = S(L, st.xm - A_HALF, MAG_H), mid = S(L, st.xm, 0), br = S(L, st.xm + A_HALF, -MAG_H);
      ctx.fillStyle = T.figRed; ctx.fillRect(tl[0], tl[1], mid[0] - tl[0], br[1] - tl[1]);
      ctx.fillStyle = T.figBlue; ctx.fillRect(mid[0], tl[1], br[0] - mid[0], br[1] - tl[1]);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.strokeRect(tl[0], tl[1], br[0] - tl[0], br[1] - tl[1]);
      ctx.fillStyle = T.figPanel; ctx.font = '700 ' + Math.max(12, Math.round(s * 0.34)) + 'px ' + T.fontBody;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('N', (tl[0] + mid[0]) / 2, mid[1]); ctx.fillText('S', (mid[0] + br[0]) / 2, mid[1]);
      ctx.textBaseline = 'alphabetic';
      helix(T, L, true);
      // 글자
      var fs = s < 60 ? 11 : 13;
      ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'center';
      var cl = S(L, XC, R + 0.18);
      halo(T, '코일 (' + st.turns + '회 감음)', cl[0], cl[1], T.figInk);
      halo(T, '코일을 지나는 자기력선 ' + count() + '개', cl[0], cl[1] - fs - 5, T.figViolet);
      ctx.textAlign = 'left'; ctx.font = fs + 'px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      var hint = st.hint || (st.touched ? '' : '자석을 끌어 코일에 넣고 빼 보자');
      if (hint) halo(T, hint, L.scene.x + 6, L.scene.y + fs + 4, T.figMuted);
      // 움직임 화살표
      if (st.moving || st.dragging) {
        var dir = st.dragging ? (Math.abs(st.vel) > 0.05 ? Math.sign(st.vel) : 0) : Math.sign(st.v);
        if (dir) {
          var y0 = S(L, 0, -MAG_H - 0.32)[1], x0 = mid[0];
          ctx.strokeStyle = T.figInk; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x0 - dir * 22, y0); ctx.lineTo(x0 + dir * 22, y0); ctx.stroke();
          arrowHead(x0 + dir * 22, y0, dir > 0 ? 0 : Math.PI, 6, T.figInk);
        }
      }
    }
    function scene2(T, L) {
      var s = L.s, c = Math.cos(st.theta), sn = Math.sin(st.theta);
      var xN1 = X2 - GAP, xS0 = X2 + GAP;
      // 자석 두 개(N극과 S극이 마주 봄)
      var a = S(L, xN1 - BLOCK_W, BLOCK_H), b = S(L, xN1, -BLOCK_H);
      ctx.fillStyle = T.figSoftRed; ctx.strokeStyle = T.figRed; ctx.lineWidth = 2;
      ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
      var a2 = S(L, xS0, BLOCK_H), b2 = S(L, xS0 + BLOCK_W, -BLOCK_H);
      ctx.fillStyle = T.figSoftBlue; ctx.strokeStyle = T.figBlue;
      ctx.fillRect(a2[0], a2[1], b2[0] - a2[0], b2[1] - a2[1]); ctx.strokeRect(a2[0], a2[1], b2[0] - a2[0], b2[1] - a2[1]);
      ctx.font = '700 ' + Math.max(14, Math.round(s * 0.4)) + 'px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = T.figRed; ctx.fillText('N', (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      ctx.fillStyle = T.figBlue; ctx.fillText('S', (a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2);
      ctx.textBaseline = 'alphabetic';
      // 자기력선(N → S)
      var reach = LC * Math.abs(c);
      for (var j = 0; j < 9; j++) {
        var y = -1 + 0.25 * j, thr = Math.abs(y) < reach - 1e-6, col = thr ? T.figViolet : T.figLine;
        var p = S(L, xN1, y), q = S(L, xS0, y);
        ctx.strokeStyle = col; ctx.lineWidth = thr ? 2 : 1.1;
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
        arrowHead(q[0] - 0.3 * s, q[1], 0, thr ? 6 : 5, col);
      }
      // 코일(위에서 본 모습: 막대처럼 보인다). 앞면은 바깥 법선이 (-cos, -sin)
      var e1 = S(L, X2 + LC * sn, -LC * c), e2 = S(L, X2 - LC * sn, LC * c);
      var off = 0.05 * s, mx = -c * off, my = sn * off;        // 화면 좌표의 앞면 쪽 방향(y 뒤집힘)
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(3, 0.09 * s);
      ctx.strokeStyle = T.figAmber; ctx.beginPath(); ctx.moveTo(e1[0] + mx, e1[1] + my); ctx.lineTo(e2[0] + mx, e2[1] + my); ctx.stroke();
      ctx.strokeStyle = T.figTeal; ctx.beginPath(); ctx.moveTo(e1[0] - mx, e1[1] - my); ctx.lineTo(e2[0] - mx, e2[1] - my); ctx.stroke();
      ctx.lineCap = 'butt';
      var ctr = S(L, X2, 0);
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(ctr[0], ctr[1], 3.5, 0, Math.PI * 2); ctx.fill();
      var fs = s < 60 ? 11 : 13;
      ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var fx = X2 + 0.42 * (-c) + 0.5 * sn, fy = 0.42 * (-sn) - 0.5 * c, bx = X2 + 0.42 * c + 0.5 * sn, by = 0.42 * sn - 0.5 * c;
      var pf = S(L, fx, fy), pb = S(L, bx, by);
      ctx.fillStyle = T.figAmber; ctx.fillText('앞', pf[0], pf[1]);
      ctx.fillStyle = T.figTeal; ctx.fillText('뒤', pb[0], pb[1]);
      ctx.textBaseline = 'alphabetic';
      // 회전 방향 화살표
      var rr = (LC + 0.2) * s;
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ctr[0], ctr[1], rr, -Math.PI * 0.42, -Math.PI * 0.12); ctx.stroke();
      arrowHead(ctr[0] + rr * Math.cos(-Math.PI * 0.42), ctr[1] + rr * Math.sin(-Math.PI * 0.42), -Math.PI * 0.42 - Math.PI / 2, 6, T.figMuted);
      // 글자
      ctx.textAlign = 'left'; ctx.fillStyle = T.figMuted; ctx.font = fs + 'px ' + T.fontBody;
      halo(T, '위에서 본 모습 — 코일이 가운데 축을 중심으로 돈다', L.scene.x + 6, L.scene.y + fs + 4, T.figMuted);
      ctx.textAlign = 'center'; ctx.fillStyle = T.figViolet; ctx.font = '600 ' + fs + 'px ' + T.fontBody;
      var lb = S(L, X2, -1.43);
      halo(T, '코일(' + st.turns + '회)을 지나는 자기력선 ' + count() + '개', lb[0], lb[1] + fs / 2, T.figViolet);
    }
    function dialGeom(L) {
      var d = L.dial, bw = d.w - 8, bh = Math.min(d.h - 22, bw * 0.62);
      var x = d.x + 4, y = d.y + 4, cx = x + bw / 2, py = y + bh - 14, r = Math.min(bw / 2 - 16, bh - 30);
      return { x: x, y: y, w: bw, h: bh, cx: cx, py: py, r: r, tl: [x + 18, y], tr: [x + bw - 18, y] };
    }
    function wires(T, L) {
      var D = dialGeom(L);
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.6;
      if (st.mode === 1) {
        var l = S(L, XC - COIL_HL, -R), r = S(L, XC + COIL_HL, -R);
        path([[l[0], l[1]], [l[0], L.scene.h - 8], [D.tl[0], L.scene.h - 8], [D.tl[0], D.tl[1]]]);
        path([[r[0], r[1]], [r[0], L.scene.h - 4], [D.tr[0], L.scene.h - 4], [D.tr[0], D.tr[1]]]);
      } else {
        var c = S(L, X2, 0);
        ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figMuted;
        path([[c[0] - 3, c[1]], [c[0] - 3, L.scene.h - 8], [D.tl[0], L.scene.h - 8], [D.tl[0], D.tl[1]]]);
        path([[c[0] + 3, c[1]], [c[0] + 3, L.scene.h - 4], [D.tr[0], L.scene.h - 4], [D.tr[0], D.tr[1]]]);
        ctx.setLineDash([]);
      }
      function path(pts) { ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke(); }
    }
    function dial(T, L) {
      var D = dialGeom(L), FULL = 55 * Math.PI / 180, T0 = tr();
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5;
      rr(D.x, D.y, D.w, D.h, 8); ctx.fill(); ctx.stroke();
      // 눈금
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1;
      for (var i = -5; i <= 5; i++) {
        var a = i / 5 * FULL, r1 = D.r, r2 = D.r - (i === 0 ? 12 : i % 5 === 0 ? 9 : 6);
        ctx.beginPath(); ctx.moveTo(D.cx + r1 * Math.sin(a), D.py - r1 * Math.cos(a)); ctx.lineTo(D.cx + r2 * Math.sin(a), D.py - r2 * Math.cos(a)); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(D.cx, D.py, D.r, -Math.PI / 2 - FULL, -Math.PI / 2 + FULL); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontMono; ctx.textAlign = 'center';
      ctx.fillText('0', D.cx, D.py - D.r - 5);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      ctx.textAlign = 'left'; ctx.fillText('◀ 왼쪽', D.x + 8, D.py + 12);
      ctx.textAlign = 'right'; ctx.fillText('오른쪽 ▶', D.x + D.w - 8, D.py + 12);
      // 이번 동작에서 바늘이 가장 멀리 간 곳
      [T0.peakP, T0.peakN].forEach(function (pk) {
        if (Math.abs(pk) < 0.04) return;
        var a = Math.max(-1.1, Math.min(1.1, pk)) * FULL, x = D.cx + (D.r + 5) * Math.sin(a), y = D.py - (D.r + 5) * Math.cos(a);
        arrowHead(x, y, a + Math.PI / 2, 5, T.figAccent);
      });
      // 바늘
      var an = st.needle * FULL;
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(D.cx, D.py); ctx.lineTo(D.cx + (D.r - 4) * Math.sin(an), D.py - (D.r - 4) * Math.cos(an)); ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(D.cx, D.py, 4, 0, Math.PI * 2); ctx.fill();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillStyle = T.figInk;
      ctx.fillText('검류계', D.cx, D.py + 12);
      // 단자
      [D.tl, D.tr].forEach(function (p) { ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p[0], p[1], 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
    }
    function trace(T, L) {
      var B = L.trace, T0 = tr(), top = B.y + 46, bot = B.y + B.h - 22, left = B.x + 44, right = B.x + B.w - 6;
      var mid = (top + bot) / 2, amp = (bot - top) / 2 / 1.15;
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      rr(B.x, B.y, B.w, B.h, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(T0.example ? '바늘 기록 (예시)' : '바늘 기록 (최근 ' + WIN + '초)', B.x + 8, B.y + 15);
      ctx.strokeStyle = T.rule; ctx.beginPath(); ctx.moveTo(left, mid); ctx.lineTo(right, mid); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('오른쪽', left - 4, top + 8); ctx.fillText('0', left - 4, mid + 4); ctx.fillText('왼쪽', left - 4, bot);
      ctx.textAlign = 'right'; ctx.fillText('시간 →', right, B.y + B.h - 6);
      var tx = function (t) { return right - (T0.t - t) / WIN * (right - left); };
      // 사건 표시
      var lastX = -1e9, row = 0;
      T0.events.forEach(function (e) {
        var x = tx(e[0]); if (x < left - 1) return;
        ctx.strokeStyle = T.figLine; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(x, top - 30 + row * 0); ctx.lineTo(x, bot); ctx.stroke(); ctx.setLineDash([]);
        row = x - lastX < 62 ? 1 - row : 0; lastX = x;
        ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody;
        ctx.fillText(e[1], x + 3, top - 20 + row * 12);
      });
      ctx.save(); ctx.beginPath(); ctx.rect(left, top - 2, right - left, bot - top + 4); ctx.clip();
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2; ctx.beginPath();
      var started = false;
      T0.samples.forEach(function (p) {
        var x = tx(p[0]); if (x < left - 2) return;
        var y = mid - Math.max(-1.12, Math.min(1.12, p[1])) * amp;
        if (started) ctx.lineTo(x, y); else { ctx.moveTo(x, y); started = true; }
      });
      ctx.stroke(); ctx.restore();
    }
    function halo(T, text, x, y, color) {
      ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = T.surface; ctx.strokeText(text, x, y);
      ctx.fillStyle = color; ctx.fillText(text, x, y); ctx.lineJoin = 'miter';
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    /* ── 자석 끌기 ── */
    function local(e) { var b = cv.canvas.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; }
    function onMagnet(p) {
      if (st.mode !== 1) return false;
      var L = layout(), tl = S(L, st.xm - A_HALF, MAG_H), br = S(L, st.xm + A_HALF, -MAG_H);
      return p[0] > tl[0] - 10 && p[0] < br[0] + 10 && p[1] > tl[1] - 14 && p[1] < br[1] + 14;
    }
    cv.canvas.addEventListener('pointerdown', function (e) {
      var p = local(e); if (!onMagnet(p)) return;
      var L = layout();
      st.dragging = true; st.moving = false; st.hint = '';
      st.grab = (p[0] - L.ox) / L.s + L.vx0 - st.xm; st.dragX = st.xm;
      try { cv.canvas.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
      event('끌기'); e.preventDefault(); run();
    });
    cv.canvas.addEventListener('pointermove', function (e) {
      var p = local(e);
      if (st.dragging) {
        var L = layout();
        st.dragX = Math.max(X_IN, Math.min(X_FAR, (p[0] - L.ox) / L.s + L.vx0 - st.grab));
        if (!loop.playing) loop.play();
      } else cv.canvas.style.cursor = onMagnet(p) ? 'grab' : '';
    });
    function endDrag() { if (st.dragging) { st.dragging = false; st.idle = 0; if (api.reduced) { run(); } } }
    cv.canvas.addEventListener('pointerup', endDrag);
    cv.canvas.addEventListener('pointercancel', endDrag);

    api.onResize(draw);
    readouts(); draw();
  },
});
