/* 중3-5 자극과 반응: 의식적 반응과 무조건 반사의 신호 경로·걸리는 시간 비교 */
Sims.register('reflex-arc', {
  title: '신호는 어디를 지나갈까 — 의식적 반응과 무조건 반사',
  caption: '두 버튼으로 반응을 고르고 \'신호 보내기\'를 눌러 신호가 지나가는 길을 따라가 보자. 신호등을 보고 건널 때는 신호가 대뇌까지 올라가 판단을 거친 뒤 척수를 따라 내려오지만, 뜨거운 냄비에서 손을 뗄 때는 척수에서 바로 명령이 나가 경로가 짧고 훨씬 빨리 반응한다. "뜨겁다"는 느낌은 신호가 대뇌에 도착한 뒤, 즉 손을 뗀 다음에 생긴다. 몸과 신경은 모식도이고, 시간은 대략적인 값(사람·상황마다 다름)이며 화면은 실제보다 20배 느리게 보여 준다.',
  init: function (api) {
    var SLOW = 20;
    // 몸 모식도 좌표(가로·세로 0~1). 오른쪽을 바라보고 서 있는 사람
    var P = {
      eye: [0.47, 0.125], brain: [0.385, 0.1], neck: [0.37, 0.175], cordLow: [0.355, 0.585], cordArm: [0.365, 0.285],
      hip: [0.4, 0.62], thigh: [0.435, 0.71], shoulder: [0.45, 0.25], elbow: [0.585, 0.355], hand: [0.76, 0.37], biceps: [0.53, 0.305],
    };
    function off(p, dx, dy) { return [p[0] + dx, p[1] + dy]; }
    var MODES = {
      conscious: {
        name: '의식적 반응', example: '신호등을 보고 길을 건넌다', center: '대뇌', route: '눈 → 대뇌 → 척수 → 다리 (길다)', total: 0.2,
        steps: [['자극', '초록불의 빛'], ['감각 기관', '눈 (망막의 시각 세포)'], ['감각 신경', '시각 신경: 눈 → 대뇌'], ['중추', '대뇌가 판단 → 척수로 명령'],
          ['운동 신경', '척수 → 다리'], ['반응 기관', '다리 근육'], ['반응', '길을 건넌다']],
        segs: [
          { step: 0, dur: 0.005, pts: [[0.86, 0.1], P.eye], kind: 'light' },
          { step: 1, dur: 0.005, pts: [P.eye] },
          { step: 2, dur: 0.02, pts: [P.eye, [0.43, 0.115], P.brain], kind: 'sense' },
          { step: 3, dur: 0.12, pts: [P.brain], note: '대뇌: 판단' },
          { step: 3, dur: 0.03, pts: [P.brain, P.neck, P.cordLow], kind: 'center' },
          { step: 4, dur: 0.015, pts: [P.cordLow, P.hip, P.thigh], kind: 'motor' },
          { step: 5, dur: 0.005, pts: [P.thigh] },
        ],
      },
      reflex: {
        name: '무조건 반사', example: '뜨거운 냄비에 닿아 손을 뗀다', center: '척수', route: '손 → 척수 → 팔 (짧다)', total: 0.05, feel: 0.1,
        steps: [['자극', '뜨거운 냄비의 열'], ['감각 기관', '손의 피부'], ['감각 신경', '손 → 척수'], ['중추', '척수 (대뇌를 거치지 않는다)'],
          ['운동 신경', '척수 → 팔'], ['반응 기관', '팔 근육'], ['반응', '손을 뗀다 → 그 뒤 대뇌가 "뜨겁다"']],
        segs: [
          { step: 0, dur: 0.003, pts: [[0.8, 0.43], P.hand], kind: 'heat' },
          { step: 1, dur: 0.002, pts: [P.hand] },
          { step: 2, dur: 0.018, pts: [off(P.hand, 0, 0.012), off(P.elbow, 0, 0.014), off(P.shoulder, 0, 0.02), off(P.cordArm, 0, 0.01)], kind: 'sense' },
          { step: 3, dur: 0.007, pts: [P.cordArm], note: '척수' },
          { step: 4, dur: 0.015, pts: [off(P.cordArm, 0, -0.01), off(P.shoulder, 0, -0.008), P.biceps], kind: 'motor' },
          { step: 5, dur: 0.005, pts: [P.biceps] },
        ],
        // 반사와 동시에 척수에서 대뇌로 올라가는 신호(느낌)
        up: { start: 0.03, dur: 0.07, pts: [off(P.cordArm, -0.012, 0), off(P.neck, -0.012, 0), off(P.brain, -0.01, 0.01)] },
      },
    };
    var state = { mode: 'conscious', tau: 0.2, stepN: 7 };
    MODES.conscious.end = 0.2; MODES.reflex.end = 0.11;

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.78 : 0.62; }, label: '사람 몸 모식도 위에 자극에서 반응까지 신호가 지나가는 경로' });
    var ctx = cv.ctx;
    var rKind = api.readout('반응');
    var rCenter = api.readout('중추');
    var rRoute = api.readout('경로');
    var rTime = api.readout('걸린 시간(대략)');

    var g = api.group();
    var bC = api.button('의식적 반응: 신호등 보고 건너기', function () { choose('conscious'); }, { toggle: true, pressed: true, parent: g });
    var bR = api.button('무조건 반사: 뜨거운 냄비에서 손 떼기', function () { choose('reflex'); }, { toggle: true, pressed: false, parent: g });
    var goBtn = api.button(api.reduced ? '다음 단계' : '신호 보내기', function () { go(); }, { primary: true });

    function M() { return MODES[state.mode]; }
    function stepEnd(m, k) { var t = 0; m.segs.forEach(function (s) { if (s.step <= k) t += s.dur; }); return t; }
    function choose(k) {
      state.mode = k; loop.pause();
      bC.setAttribute('aria-pressed', k === 'conscious' ? 'true' : 'false');
      bR.setAttribute('aria-pressed', k === 'reflex' ? 'true' : 'false');
      state.tau = M().end; state.stepN = 7;
      goBtn.textContent = api.reduced ? '처음 단계부터' : '신호 보내기';
      readouts(); draw();
    }
    function go() {
      var m = M();
      if (api.reduced) {
        // 한 단계씩 나아간다
        state.stepN = state.stepN >= 7 ? 1 : state.stepN + 1;
        state.tau = state.stepN >= 7 ? m.end : stepEnd(m, state.stepN - 1);
        goBtn.textContent = state.stepN >= 7 ? '처음 단계부터' : '다음 단계';
        readouts(); draw(); return;
      }
      state.tau = 0; state.stepN = 0; loop.play();
    }
    var loop = api.loop(function (dt) {
      state.tau = Math.min(M().end, state.tau + dt / SLOW);
      if (state.tau >= M().end) loop.pause();
      readouts(); draw();
    });
    loop.pause();

    function curStep() {
      var m = M(), t = 0;
      if (api.reduced) return state.stepN - 1;
      for (var i = 0; i < m.segs.length; i++) { t += m.segs[i].dur; if (state.tau < t - 1e-9) return m.segs[i].step; }
      return 6;
    }
    function readouts() {
      var m = M();
      rKind.set(m.name + ' — ' + m.example);
      rCenter.set(m.center);
      rRoute.set(m.route);
      var shown = Math.min(state.tau, m.total);
      rTime.set(curStep() >= 6 ? '약 ' + m.total + '초' : shown.toFixed(3) + '초');
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var body, side;
      if (narrow) { var s = Math.min(w, h * 0.5); body = { x: (w - s) / 2, y: 0, s: s }; side = { x: 0, y: s + 4, w: w, h: h - s - 4 }; }
      else { var s2 = Math.min(w * 0.47, h); body = { x: 0, y: (h - s2) / 2, s: s2 }; side = { x: w * 0.5, y: 0, w: w * 0.5, h: h }; }
      drawBody(T, body);
      drawSide(T, side, narrow);
    }

    function drawBody(T, b) {
      var X = function (p) { return b.x + p[0] * b.s; }, Y = function (p) { return b.y + p[1] * b.s; }, s = b.s;
      var m = M();
      function limb(pts, wd) {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        [[T.figLine, wd + 3], [T.figPanel, wd]].forEach(function (st) {
          ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(X(p), Y(p)); else ctx.moveTo(X(p), Y(p)); });
          ctx.strokeStyle = st[0]; ctx.lineWidth = st[1]; ctx.stroke();
        });
      }
      // 다리, 몸통, 팔, 머리
      limb([[0.41, 0.6], [0.455, 0.78], [0.44, 0.955], [0.52, 0.955]], s * 0.07);
      ctx.beginPath(); ctx.moveTo(X([0.33, 0.24]), Y([0.33, 0.24])); ctx.lineTo(X([0.5, 0.22]), Y([0.5, 0.22]));
      ctx.lineTo(X([0.5, 0.62]), Y([0.5, 0.62])); ctx.lineTo(X([0.335, 0.62]), Y([0.335, 0.62])); ctx.closePath();
      ctx.fillStyle = T.figPanel; ctx.fill(); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5; ctx.stroke();
      var handP = P.hand;
      var withdrawn = state.mode === 'reflex' && curStep() >= 6;
      if (withdrawn) handP = [0.72, 0.29];
      limb([P.shoulder, P.elbow, handP], s * 0.05);
      ctx.beginPath(); ctx.arc(X([0.4, 0.115]), Y([0.4, 0.115]), s * 0.085, 0, Math.PI * 2);
      ctx.fillStyle = T.figPanel; ctx.fill(); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5; ctx.stroke();
      // 뇌와 척수(중추 신경계)
      ctx.beginPath(); ctx.ellipse(X(P.brain), Y(P.brain) - s * 0.005, s * 0.058, s * 0.042, 0, 0, Math.PI * 2);
      ctx.fillStyle = T.figSoftViolet; ctx.fill(); ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(P.neck), Y([0, 0.14])); ctx.lineTo(X(P.cordLow), Y(P.cordLow));
      ctx.strokeStyle = T.figSoftViolet; ctx.lineWidth = s * 0.022; ctx.lineCap = 'round'; ctx.stroke();
      ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1; ctx.stroke();
      // 눈
      ctx.beginPath(); ctx.arc(X(P.eye), Y(P.eye), s * 0.013, 0, Math.PI * 2); ctx.fillStyle = T.figInk; ctx.fill();
      // 이름표
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figViolet; ctx.textAlign = 'right';
      ctx.fillText('대뇌', X([0.3, 0]), Y([0, 0.07]));
      ctx.fillText('척수', X([0.33, 0]), Y([0, 0.45]));
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
      // 자극 물체
      if (state.mode === 'conscious') {
        var lx = X([0.86, 0]), ly = Y([0, 0.03]);
        ctx.fillStyle = T.figInk; roundRect(lx - s * 0.03, ly, s * 0.06, s * 0.13, 4); ctx.fill();
        ctx.fillStyle = T.figMuted; ctx.beginPath(); ctx.arc(lx, ly + s * 0.032, s * 0.018, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#22b14c'; ctx.beginPath(); ctx.arc(lx, ly + s * 0.095, s * 0.018, 0, Math.PI * 2); ctx.fill();   // 초록불(실제 색)
        ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.fillText('신호등', lx, ly + s * 0.17);
      } else {
        var px = X([0.82, 0]), py = Y([0, 0.41]);
        ctx.fillStyle = T.figSoftRed; ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.5;
        roundRect(px - s * 0.09, py, s * 0.18, s * 0.09, 5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = T.figRed; ctx.textAlign = 'center'; ctx.fillText('뜨거운 냄비', px, py + s * 0.125);
      }
      // 반응 기관 이름표
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
      if (state.mode === 'conscious') ctx.fillText('다리 근육', X([0.52, 0]), Y([0, 0.72]));
      else ctx.fillText('팔 근육', X([0.5, 0]), Y([0, 0.23]));

      // 경로(희미하게 전체) + 지나간 부분(진하게)
      var COLORS = { sense: T.figBlue, center: T.figViolet, motor: T.figRed, light: T.figGreen, heat: T.figAmber };
      var t0 = 0, tau = state.tau, dot = null, note = null;
      m.segs.forEach(function (sg) {
        var t1 = t0 + sg.dur;
        if (sg.pts.length > 1) {
          var col = COLORS[sg.kind];
          path(sg.pts, col, 1.5, 0.35, sg.kind === 'light' || sg.kind === 'heat');
          var f = Math.max(0, Math.min(1, (tau - t0) / sg.dur));
          if (f > 0) { var part = partial(sg.pts, f); path(part, col, 3.5, 1, sg.kind === 'light' || sg.kind === 'heat'); if (f < 1) dot = part[part.length - 1]; }
          if (f >= 1 && sg.kind !== 'light' && sg.kind !== 'heat') arrowHead(sg.pts, col);
        } else if (tau >= t0 - 1e-9 && tau < t1 && !api.reduced) { dot = sg.pts[0]; if (sg.note) note = sg; }
        t0 = t1;
      });
      // 무조건 반사: 대뇌로 올라가는 신호(느낌)
      if (m.up) {
        path(m.up.pts, T.figBlue, 1.2, 0.35, true);
        var fu = Math.max(0, Math.min(1, (tau - m.up.start) / m.up.dur));
        if (fu > 0) { var pu = partial(m.up.pts, fu); path(pu, T.figBlue, 2.5, 0.9, true); if (fu < 1) circle(pu[pu.length - 1], 4, T.figBlue); }
        if (fu >= 1) {
          ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
          ctx.fillText('"앗, 뜨거워!"', X([0.5, 0]), Y([0, 0.04]));
          ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.fillText('손을 뗀 뒤에 느낀다', X([0.5, 0]), Y([0, 0.085]));
        }
      }
      if (dot) { circle(dot, 7, T.figAmber); circle(dot, 3.5, T.figInk); }
      if (note) {
        ctx.fillStyle = T.figViolet; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(note.note + (state.mode === 'conscious' ? ' 중…' : ''), X(note.pts[0]) + s * 0.08, Y(note.pts[0]) + (state.mode === 'conscious' ? -s * 0.03 : 4));
      }
      // 반응 표시
      if (curStep() >= 6) {
        ctx.fillStyle = T.figRed; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
        if (state.mode === 'conscious') ctx.fillText('→ 건넌다!', X([0.56, 0]), Y([0, 0.95]));
        else ctx.fillText('↑ 손을 뗀다!', X([0.66, 0]), Y([0, 0.22]));
      }

      function path(pts, col, lw, alpha, dash) {
        ctx.globalAlpha = alpha; ctx.setLineDash(dash ? [5, 4] : []);
        ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(X(p), Y(p)); else ctx.moveTo(X(p), Y(p)); });
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
      }
      function circle(p, r, col) { ctx.beginPath(); ctx.arc(X(p), Y(p), r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); }
      function arrowHead(pts, col) {
        var a = pts[pts.length - 2], z = pts[pts.length - 1];
        var ang = Math.atan2(Y(z) - Y(a), X(z) - X(a)), x = X(z), y = Y(z);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 9 * Math.cos(ang - 0.45), y - 9 * Math.sin(ang - 0.45));
        ctx.lineTo(x - 9 * Math.cos(ang + 0.45), y - 9 * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      }
    }
    function partial(pts, f) {
      var lens = [], tot = 0, i;
      for (i = 1; i < pts.length; i++) { var l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(l); tot += l; }
      var want = tot * f, out = [pts[0]];
      for (i = 1; i < pts.length; i++) {
        if (want >= lens[i - 1]) { out.push(pts[i]); want -= lens[i - 1]; continue; }
        var u = want / lens[i - 1];
        out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u]); break;
      }
      return out;
    }

    function drawSide(T, r, narrow) {
      var m = M(), cs = curStep();
      var x0 = r.x + (narrow ? 4 : 8), lh = narrow ? 19 : 23, y = r.y + 16;
      ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody;
      ctx.fillText(m.name + ': ' + m.example, x0, y);
      y += lh;
      var KC = [T.figGreen, T.figInk, T.figBlue, T.figViolet, T.figRed, T.figInk, T.figRed];
      m.steps.forEach(function (st, i) {
        var done = i <= cs, now = i === cs && cs < 6 && (loop.playing || api.reduced);
        ctx.globalAlpha = done ? 1 : 0.45;
        if (now) { ctx.fillStyle = T.figSoftAmber; ctx.fillRect(x0 - 4, y - 13, r.w - 12, lh - 3); }
        ctx.fillStyle = done ? KC[i] : T.figMuted; ctx.font = '600 12px ' + T.fontBody;
        ctx.fillText((i + 1) + '. ' + st[0], x0, y);
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
        ctx.fillText(st[1], x0 + (narrow ? 84 : 92), y);
        ctx.globalAlpha = 1;
        y += lh;
      });
      // 시간 비교 막대
      var top = y + 6, L = x0 + (narrow ? 84 : 92), R = r.x + r.w - 14, tmax = 0.25;
      var sx = function (t) { return L + t / tmax * (R - L); };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.fillText('자극에서 반응까지 걸리는 시간 (대략)', x0, top);
      var rows = [['conscious', '의식적 반응', T.figViolet], ['reflex', '무조건 반사', T.figRed]];
      rows.forEach(function (row, i) {
        var yy = top + 14 + i * 26, mm = MODES[row[0]];
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText(row[1], x0, yy + 11);
        ctx.fillStyle = T.figPaper; ctx.fillRect(L, yy, R - L, 14);
        var full = sx(mm.total) - L;
        ctx.globalAlpha = 0.3; ctx.fillStyle = row[2]; ctx.fillRect(L, yy, full, 14); ctx.globalAlpha = 1;
        var cur = row[0] === state.mode ? Math.min(state.tau, mm.total) : mm.total;
        ctx.fillStyle = row[2]; ctx.fillRect(L, yy, sx(cur) - L, 14);
        ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'left';
        ctx.fillText('약 ' + mm.total + ' s', sx(mm.total) + 4, yy + 11);
        if (mm.feel) {
          ctx.strokeStyle = T.figBlue; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(sx(mm.feel), yy - 2); ctx.lineTo(sx(mm.feel), yy + 16); ctx.stroke(); ctx.setLineDash([]);
        }
      });
      var ay = top + 14 + 2 * 26 + 2;
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L, ay); ctx.lineTo(R, ay); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      [0, 0.1, 0.2].forEach(function (t) { ctx.fillText(t + ' s', sx(t), ay + 13); });
      ctx.fillStyle = T.figBlue; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('┆ 반사 뒤 대뇌가 "뜨겁다"고 느끼는 때', x0, ay + 30);
    }
    function roundRect(x, y, w, h, rr) { ctx.beginPath(); ctx.moveTo(x + rr, y); ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr); ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath(); }

    api.onResize(draw);
    choose('conscious');
  },
});
