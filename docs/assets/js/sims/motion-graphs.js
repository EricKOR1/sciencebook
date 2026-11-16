/* 중3-4 운동과 에너지: 다중 섬광 기록과 시간–이동 거리·시간–속력 그래프 (등속, 속력 증가·감소, 자유 낙하) */
Sims.register('motion-graphs', {
  title: '다중 섬광 기록과 두 그래프 — 운동마다 그래프 모양이 다르다',
  caption: '운동을 고르고 \'처음부터 보기\'를 누르면 같은 시간 간격으로 찍힌 물체의 위치와 두 그래프가 함께 그려진다. 시간–이동 거리 그래프의 기울기는 속력, 시간–속력 그래프의 기울기는 1초 동안의 속력 변화량, 색칠한 넓이는 이동 거리이다. 자유 낙하에서 질량을 바꿔도 두 공은 나란히 떨어지고 속력은 1초마다 9.8 m/s씩 커진다. 공기 저항은 무시했고, 값은 본문의 자료(자전거 4 m/s, 출발하는 자동차, 브레이크를 잡은 자전거)를 따랐다.',
  init: function (api) {
    var MODES = {
      uniform: { name: '등속 운동', T: 4, tStep: 1, strobe: 1, vMax: 10, vStep: 2, dMax: 20, dStep: 4,
        v: function () { return 4; }, d: function (t) { return 4 * t; },
        dNote: ['기울어진 직선', '기울기 = 속력 = 4 m/s'], dPos: 'tl',
        vNote: ['수평선: 속력이 변하지 않는다', '1초마다 속력 변화 0'], vPos: 'tl', change: '0 m/s' },
      speedup: { name: '속력 증가', T: 4, tStep: 1, strobe: 1, vMax: 10, vStep: 2, dMax: 20, dStep: 4,
        v: function (t) { return 2 * t; }, d: function (t) { return t * t; },
        dNote: ['점점 가팔라지는 곡선', '같은 시간에 점점 더 많이 간다'], dPos: 'tl',
        vNote: ['오른쪽 위로 올라가는 직선', '기울기: 1초마다 2 m/s 증가'], vPos: 'tl', change: '+2 m/s' },
      slowdown: { name: '속력 감소', T: 6, tStep: 1, strobe: 1, vMax: 10, vStep: 2, dMax: 30, dStep: 5,
        v: function (t) { return Math.max(0, 10 - 2 * t); }, d: function (t) { return t < 5 ? 10 * t - t * t : 25; },
        dNote: ['점점 완만해지는 곡선', '멈춘 뒤(5초~)에는 수평'], dPos: 'br',
        vNote: ['오른쪽 아래로 내려가는 직선', '기울기: 1초마다 2 m/s 감소'], vPos: 'tr', change: '−2 m/s' },
      freefall: { name: '자유 낙하', T: 2, tStep: 0.5, strobe: 0.2, vMax: 20, vStep: 4, dMax: 20, dStep: 4, vertical: true,
        v: function (t) { return 9.8 * t; }, d: function (t) { return 4.9 * t * t; },
        dNote: ['점점 가팔라지는 곡선', '두 공의 그래프가 겹친다'], dPos: 'tl',
        vNote: ['1초마다 9.8 m/s씩 증가', '질량과 상관없이 같은 직선'], vPos: 'tl', change: '+9.8 m/s' },
    };
    var ORDER = ['uniform', 'speedup', 'slowdown', 'freefall'];
    var state = { mode: 'uniform', t: MODES.uniform.T, mass: 5 };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.7 : 0.62; }, label: '물체의 다중 섬광 기록과 시간-이동 거리, 시간-속력 그래프' });
    var ctx = cv.ctx;

    var rT = api.readout('시간');
    var rV = api.readout('속력');
    var rD = api.readout('이동 거리');
    var rC = api.readout('1초마다 속력 변화');
    var rW = api.readout('무게(중력)');

    var g = api.group();
    var btns = ORDER.map(function (k) {
      return api.button(MODES[k].name, function () { choose(k); }, { toggle: true, pressed: k === state.mode, parent: g });
    });
    var massSlider = api.slider({ id: 'motion-graphs-mass', label: '오른쪽 공의 질량', min: 0.5, max: 10, step: 0.5, value: state.mass,
      format: function (v) { return v.toFixed(1) + ' kg'; },
      onInput: function (v) { state.mass = v; readouts(); draw(); } });
    var massLabel = massSlider.input.parentNode;
    api.button('처음부터 보기', function () { start(); }, { primary: true });

    function M() { return MODES[state.mode]; }
    function choose(k) {
      state.mode = k; state.t = MODES[k].T; loop.pause();
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', ORDER[i] === k ? 'true' : 'false'); });
      massLabel.style.display = k === 'freefall' ? '' : 'none';
      readouts(); draw();
    }
    function start() {
      if (api.reduced) { state.t = M().T; readouts(); draw(); return; }
      state.t = 0; readouts(); draw(); loop.play();
    }
    var loop = api.loop(function (dt) {
      // 자유 낙하(2초)는 실제 시간의 절반 빠르기로, 나머지는 실제 빠르기로 보여 준다
      var rate = state.mode === 'freefall' ? 0.5 : 1;
      state.t = Math.min(M().T, state.t + dt * rate);
      if (state.t >= M().T) loop.pause();
      readouts(); draw();
    });
    loop.pause();

    function num(x, n) { return x.toFixed(n == null ? 1 : n); }
    function readouts() {
      var m = M(), t = state.t;
      rT.set(num(t, 1) + ' s');
      rV.set(num(m.v(t), 1) + ' m/s');
      rD.set(num(m.d(t), 1) + ' m');
      rC.set(state.mode === 'slowdown' && t >= 5 ? '0 m/s (멈춤)' : m.change);
      rW.set(state.mode === 'freefall' ? '1 kg: 9.8 N · ' + num(state.mass) + ' kg: ' + num(9.8 * state.mass, 1) + ' N' : '—');
    }

    function layout() {
      var w = cv.w, h = cv.h, m = M();
      if (w < 560) {
        var sh = h * 0.32;
        return { scene: { x: 0, y: 0, w: w, h: sh }, gd: { x: 0, y: sh + 6, w: w, h: (h - sh - 6) / 2 }, gv: { x: 0, y: sh + 6 + (h - sh - 6) / 2, w: w, h: (h - sh - 6) / 2 } };
      }
      if (m.vertical) {
        var sw = w * 0.3;
        return { scene: { x: 0, y: 0, w: sw, h: h }, gd: { x: sw + 10, y: 0, w: w - sw - 10, h: h / 2 }, gv: { x: sw + 10, y: h / 2, w: w - sw - 10, h: h / 2 } };
      }
      var bh = h * 0.3;
      return { scene: { x: 0, y: 0, w: w, h: bh }, gd: { x: 0, y: bh + 8, w: w / 2 - 6, h: h - bh - 8 }, gv: { x: w / 2 + 6, y: bh + 8, w: w / 2 - 6, h: h - bh - 8 } };
    }

    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      if (M().vertical) drawFall(T, L.scene); else drawTrack(T, L.scene);
      graph(T, L.gd, 'd'); graph(T, L.gv, 'v');
    }

    function strobeTimes(m) {
      var out = [], n = Math.round(m.T / m.strobe);
      for (var i = 0; i <= n; i++) { var tt = i * m.strobe; if (tt <= state.t + 1e-9) out.push(tt); }
      return out;
    }
    function ball(x, y, r, fill, stroke, alpha) {
      ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = stroke; ctx.stroke(); ctx.globalAlpha = 1;
    }

    function drawTrack(T, r) {
      var m = M(), left = r.x + 24, right = r.x + r.w - 24, y = r.y + r.h * 0.56;
      var sx = function (d) { return left + d / m.dMax * (right - left); };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('다중 섬광 기록 (' + m.strobe + '초 간격) — ' + m.name, left - 8, r.y + 16);
      // 바닥과 눈금
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(left - 8, y + 12); ctx.lineTo(right + 8, y + 12); ctx.stroke();
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
      for (var d = 0; d <= m.dMax + 1e-9; d += m.dStep) {
        ctx.beginPath(); ctx.moveTo(sx(d), y + 12); ctx.lineTo(sx(d), y + 18); ctx.stroke();
        ctx.fillText(d + (d === m.dMax ? ' m' : ''), sx(d), y + 30);
      }
      // 섬광 모습
      var ts = strobeTimes(m), lastLabel = -1e9;
      ts.forEach(function (tt, i) {
        var x = sx(m.d(tt)), cur = i === ts.length - 1;
        ball(x, y, 7, cur ? T.figSoftBlue : T.figPanel, T.figBlue, cur ? 1 : 0.75);
        if (x - lastLabel > 30 || (cur && x - lastLabel > 22)) {
          ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.fillText(num(tt, 0) + 's', x, y - 14); lastLabel = x;
        }
      });
      // 현재 위치(애니메이션 중)
      var xc = sx(m.d(state.t));
      ball(xc, y, 7, T.figBlue, T.figBlue, 1);
      var nar = cv.w < 560;
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = nar ? 'left' : 'right';
      var gapNote = { uniform: '간격이 모두 같다 → 속력 일정', speedup: '간격이 점점 넓어진다 → 빨라진다', slowdown: '간격이 점점 좁아진다 → 느려진다' }[state.mode];
      ctx.fillText(gapNote, nar ? left - 8 : right + 8, nar ? r.y + 33 : r.y + 16);
    }

    function drawFall(T, r) {
      var m = M(), top = r.y + 44, bot = r.y + r.h - 16;
      var narrow = cv.w < 560;
      var axisX = narrow ? r.x + r.w * 0.2 : r.x + 40;
      var c1 = narrow ? r.x + r.w * 0.42 : r.x + r.w * 0.5, c2 = narrow ? r.x + r.w * 0.62 : r.x + r.w * 0.8;
      var sy = function (d) { return top + d / m.dMax * (bot - top); };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = narrow ? 'left' : 'center';
      ctx.fillText('다중 섬광 기록 (0.2초 간격)', narrow ? r.x + 8 : r.x + r.w / 2, r.y + 14);
      // 눈금(떨어진 거리)
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(axisX, top); ctx.lineTo(axisX, bot); ctx.stroke();
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      for (var d = 0; d <= m.dMax + 1e-9; d += m.dStep) {
        ctx.beginPath(); ctx.moveTo(axisX - 4, sy(d)); ctx.lineTo(axisX, sy(d)); ctx.stroke();
        ctx.fillText(d + ' m', axisX - 6, sy(d) + 4);
      }
      var r1 = 7, r2 = Math.max(4, Math.min(12, 7 * Math.cbrt(state.mass)));
      ctx.textAlign = 'center'; ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('1 kg', c1, r.y + 32); ctx.fillText(num(state.mass) + ' kg', c2, r.y + 32);
      var ts = strobeTimes(m);
      ts.forEach(function (tt, i) {
        var yy = sy(m.d(tt)), cur = i === ts.length - 1;
        ball(c1, yy, r1, cur ? T.figSoftBlue : T.figPanel, T.figBlue, cur ? 1 : 0.7);
        ball(c2, yy, r2, cur ? T.figSoftRed : T.figPanel, T.figRed, cur ? 1 : 0.7);
      });
      var yc = sy(m.d(state.t));
      ball(c1, yc, r1, T.figBlue, T.figBlue, 1);
      ball(c2, yc, r2, T.figRed, T.figRed, 1);
      // 시간 표시(1초 간격만)
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      [0, 1, 2].forEach(function (tt) { if (tt <= state.t + 1e-9) ctx.fillText(tt + '초', c2 + 16, sy(m.d(tt)) + 4); });
      if (narrow) {
        ctx.textAlign = 'left'; ctx.fillStyle = T.figMuted;
        ctx.fillText('두 공이', r.x + r.w * 0.76, top + 30);
        ctx.fillText('나란히', r.x + r.w * 0.76, top + 46);
        ctx.fillText('떨어진다', r.x + r.w * 0.76, top + 62);
      }
    }

    function graph(T, r, kind) {
      var m = M(), isV = kind === 'v';
      var yMax = isV ? m.vMax : m.dMax, yStep = isV ? m.vStep : m.dStep, f = isV ? m.v : m.d;
      var L = r.x + 46, R = r.x + r.w - 12, Tp = r.y + 24, B = r.y + r.h - 34;
      var sx = function (t) { return L + t / m.T * (R - L); };
      var sy = function (y) { return B - y / yMax * (B - Tp); };
      // 제목
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(isV ? '시간–속력 그래프' : '시간–이동 거리 그래프', L, r.y + 13);
      // 격자
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      for (var y = 0; y <= yMax + 1e-9; y += yStep) { ctx.beginPath(); ctx.moveTo(L, sy(y)); ctx.lineTo(R, sy(y)); ctx.stroke(); ctx.fillText(y, L - 5, sy(y) + 4); }
      ctx.textAlign = 'center';
      for (var t = 0; t <= m.T + 1e-9; t += m.tStep) { ctx.beginPath(); ctx.moveTo(sx(t), B); ctx.lineTo(sx(t), B + 4); ctx.stroke(); ctx.fillText(t % 1 ? t.toFixed(1) : t, sx(t), B + 15); }
      ctx.strokeStyle = T.figLine; ctx.beginPath(); ctx.moveTo(L, Tp - 4); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('시간 (s)', (L + R) / 2, B + 29);
      ctx.save(); ctx.translate(r.x + 11, (Tp + B) / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText(isV ? '속력 (m/s)' : '이동 거리 (m)', 0, 0); ctx.restore();
      var tc = state.t, n = 80, i;
      // 넓이(속력 그래프)
      if (isV && tc > 0) {
        ctx.beginPath(); ctx.moveTo(sx(0), sy(0));
        for (i = 0; i <= n; i++) { var ta = tc * i / n; ctx.lineTo(sx(ta), sy(f(ta))); }
        ctx.lineTo(sx(tc), sy(0)); ctx.closePath(); ctx.fillStyle = T.figSoftAmber; ctx.fill();
      }
      // 곡선
      var col = isV ? T.figAccent : T.figGreen;
      ctx.beginPath();
      for (i = 0; i <= n; i++) { var tb = tc * i / n; if (i) ctx.lineTo(sx(tb), sy(f(tb))); else ctx.moveTo(sx(tb), sy(f(tb))); }
      ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.stroke();
      // 섬광 시각의 점
      strobeTimes(m).forEach(function (ts) {
        if (Math.abs(ts / m.tStep - Math.round(ts / m.tStep)) > 1e-6) return;
        ctx.beginPath(); ctx.arc(sx(ts), sy(f(ts)), 3.5, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      });
      // 설명
      var note = (isV ? m.vNote : m.dNote).slice(), pos = isV ? m.vPos : m.dPos;
      if (isV) note.push('색칠한 넓이 = 이동 거리 ' + num(m.d(tc)) + ' m');
      ctx.font = '12px ' + T.fontBody;
      var right = pos.charAt(1) === 'r', bottom = pos.charAt(0) === 'b';
      ctx.textAlign = right ? 'right' : 'left';
      var nx = right ? R - 6 : L + 8, ny = bottom ? B - 10 - (note.length - 1) * 16 : Tp + 14;
      note.forEach(function (s, k) {
        ctx.fillStyle = k === 0 ? col : (isV && k === 2 ? T.figAmber : T.figMuted);
        if (k === 0) ctx.font = '600 12px ' + T.fontBody; else ctx.font = '12px ' + T.fontBody;
        ctx.fillText(s, nx, ny + k * 16);
      });
    }

    api.onResize(draw);
    choose('uniform');
  },
});
