/* 6-3 기계학습(지도학습): 정답이 붙은 점으로 분류 경계를 조금씩 고쳐 가며 찾는다 (퍼셉트론과 비슷한 방식) */
Sims.register('ml-learning', {
  title: '사과일까, 배일까? — 데이터에서 경계 찾기',
  caption: '사람이 "무게가 몇 g 넘으면 배"처럼 규칙을 직접 정하지 않는다. 컴퓨터는 정답이 붙은 점(학습 데이터)을 보고, 틀린 점이 줄어들도록 경계선을 조금씩 옮겨 스스로 규칙을 찾는다. 그래프를 눌러 점을 더하거나, \'치우친 데이터\'로 바꿔 학습해 보자. 학습 데이터는 다 맞혀도 처음 보는 과일(속이 빈 모양)은 틀릴 수 있다. 과일의 무게·붉은 정도 값과 학습 방법은 설명을 위해 단순화했다.',
  init: function (api) {
    var WMIN = 150, WMAX = 750, CMAX = 10, LR = 0.03, INIT = [0.6, 0.5, -0.45];
    function rng(seed) { var s = seed; return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; }
    function gen(seed, spec) {
      var r = rng(seed), out = [];
      spec.forEach(function (g) { for (var i = 0; i < g.n; i++) out.push({ wt: g.w[0] + r() * (g.w[1] - g.w[0]), c: g.c[0] + r() * (g.c[1] - g.c[0]), y: g.y }); });
      return out;
    }
    // y = 1: 사과, y = -1: 배.  빨간 사과, 초록 사과(가벼움·덜 붉음), 배(무거움·덜 붉음)
    var DATA = {
      balanced: function () { return gen(7, [{ n: 10, w: [230, 380], c: [6, 9.5], y: 1 }, { n: 5, w: [180, 290], c: [1.5, 4.2], y: 1 }, { n: 12, w: [440, 720], c: [1, 4.8], y: -1 }]); },
      biased: function () { return gen(11, [{ n: 13, w: [240, 420], c: [6.2, 9.5], y: 1 }, { n: 13, w: [430, 560], c: [1, 4.5], y: -1 }]); },
    };
    var TEST = gen(23, [{ n: 5, w: [230, 380], c: [6, 9.5], y: 1 }, { n: 5, w: [180, 290], c: [1.5, 4.2], y: 1 }, { n: 6, w: [440, 720], c: [1, 4.8], y: -1 }]);

    var state = { mode: 'balanced', train: DATA.balanced(), W: INIT.slice(), prev: null, steps: 0, best: null, bestAcc: -1, sinceBest: 0, status: 'start', addLabel: 1 };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.2 : 0.68; }, label: '무게와 붉은 정도로 나타낸 사과와 배의 점, 그리고 컴퓨터가 찾은 분류 경계선' });
    var ctx = cv.ctx;

    var rSteps = api.readout('학습 횟수');
    var rTrain = api.readout('학습 데이터 정확도');
    var rTest = api.readout('새 과일 정확도');

    var g1 = api.group();
    api.button('학습 한 단계', function () { stopAuto(); stepOnce(); render(); }, { primary: true, parent: g1 });
    var autoBtn = api.button('자동 학습', function () { if (loop.wanted) stopAuto(); else startAuto(); }, { toggle: true, pressed: false, parent: g1 });

    var g2 = api.group();
    var dataBtns = [
      api.button('고르게 모은 데이터', function () { setMode('balanced'); }, { toggle: true, pressed: true, parent: g2 }),
      api.button('치우친 데이터(빨간 사과만)', function () { setMode('biased'); }, { toggle: true, pressed: false, parent: g2 }),
    ];

    var g3 = api.group();
    var lab = api.el('span', null, '그래프를 누르면 추가:');
    lab.style.cssText = 'align-self:center;font-size:0.82rem;color:var(--muted)';
    g3.appendChild(lab);
    var addBtns = [
      api.button('사과', function () { setAdd(1); }, { toggle: true, pressed: true, parent: g3 }),
      api.button('배', function () { setAdd(-1); }, { toggle: true, pressed: false, parent: g3 }),
    ];

    function setAdd(y) { state.addLabel = y; addBtns[0].setAttribute('aria-pressed', y === 1 ? 'true' : 'false'); addBtns[1].setAttribute('aria-pressed', y === -1 ? 'true' : 'false'); }
    function setMode(m) {
      stopAuto();
      state.mode = m; state.train = DATA[m](); state.W = INIT.slice(); state.prev = null; state.steps = 0;
      state.best = null; state.bestAcc = -1; state.sinceBest = 0; state.status = 'start';
      dataBtns[0].setAttribute('aria-pressed', m === 'balanced' ? 'true' : 'false');
      dataBtns[1].setAttribute('aria-pressed', m === 'biased' ? 'true' : 'false');
      render();
    }

    /* ── 학습: 틀린 점들이 경계를 자기 쪽으로 조금씩 끌어당긴다 ── */
    function U(p) { return [(p.wt - WMIN) / (WMAX - WMIN), p.c / CMAX]; }
    function score(W, p) { var x = U(p); return W[0] * x[0] + W[1] * x[1] + W[2]; }
    function wrong(W, p) { return (score(W, p) > 0 ? 1 : -1) !== p.y; }
    function acc(W, set) { if (!set.length) return 1; var k = 0; set.forEach(function (p) { if (!wrong(W, p)) k++; }); return k / set.length; }
    function stepOnce() {
      var g = [0, 0, 0], m = 0;
      state.train.forEach(function (p) { if (wrong(state.W, p)) { var x = U(p); m++; g[0] += p.y * x[0]; g[1] += p.y * x[1]; g[2] += p.y; } });
      if (!m) { state.status = 'done'; return false; }
      state.prev = state.W.slice();
      for (var i = 0; i < 3; i++) state.W[i] += LR * g[i];
      state.steps++;
      var a = acc(state.W, state.train);
      if (a > state.bestAcc + 1e-9) { state.bestAcc = a; state.best = state.W.slice(); state.sinceBest = 0; } else state.sinceBest++;
      if (a >= 1) { state.status = 'done'; return false; }
      if (state.sinceBest > 80) { state.W = state.best.slice(); state.prev = null; state.status = 'stuck'; return false; }
      state.status = 'learning';
      return true;
    }
    var acc_t = 0;
    var loop = api.loop(function (dt) {
      acc_t += dt;
      if (acc_t < 0.12) return;
      acc_t = 0;
      if (!stepOnce()) stopAuto();
      render();
    });
    loop.pause();
    function startAuto() {
      if (state.status === 'done' || state.status === 'stuck') { state.status = 'learning'; state.sinceBest = 0; }
      if (api.reduced) { var n = 0; while (stepOnce() && n++ < 2000) { /* 끝까지 */ } state.prev = null; render(); return; }
      autoBtn.setAttribute('aria-pressed', 'true'); autoBtn.textContent = '멈춤'; loop.play();
    }
    function stopAuto() { loop.pause(); autoBtn.setAttribute('aria-pressed', 'false'); autoBtn.textContent = '자동 학습'; }

    /* ── 그리기 ── */
    var plot = null;
    function render() { readouts(); draw(); }
    function readouts() {
      rSteps.set(state.steps + '번');
      rTrain.set(Math.round(acc(state.W, state.train) * 100) + '%');
      rTest.set(Math.round(acc(state.W, TEST) * 100) + '%');
    }
    function message() {
      if (state.status === 'start') return '처음 경계선은 아무렇게나 그은 것이다. \'학습 한 단계\'나 \'자동 학습\'을 눌러 보자.';
      if (state.status === 'learning') return '고리 친 점 = 지금 경계로는 틀리는 점. 틀린 점이 줄어들도록 경계선이 조금씩 움직인다.';
      if (state.status === 'stuck') return '직선 하나로는 모든 점을 나눌 수 없어, 가장 많이 맞혔던 경계에서 멈췄다.';
      var t = acc(state.W, TEST);
      if (t < 0.85) return '학습 데이터는 모두 맞혔지만, 학습에 없던 초록 사과·큰 배 같은 새 과일(속이 빈 모양)은 많이 틀린다. 학습 데이터가 실제 과일을 고르게 대표하지 못했기 때문이다.';
      return '학습 데이터를 모두 맞히는 경계를 데이터에서 찾았다. 처음 보는 새 과일(속이 빈 모양)도 대부분 맞힌다.';
    }
    function wrapLines(text, maxW) {
      var words = text.split(' '), lines = [], cur = '';
      words.forEach(function (wd) { var t = cur ? cur + ' ' + wd : wd; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = t; });
      if (cur) lines.push(cur);
      return lines;
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      // 위쪽: 범례 + 안내 문구
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      var items = [
        { k: 'apple', t: '사과' }, { k: 'pear', t: '배' }, { k: 'hollow', t: '새 과일(학습에 안 씀)' }, { k: 'ring', t: '틀린 학습 점' }, { k: 'cross', t: '틀린 새 과일' },
      ];
      var x = 6, y = 14;
      items.forEach(function (it) {
        var iw = 18 + ctx.measureText(it.t).width + 14;
        if (x + iw > w) { x = 6; y += 18; }
        var cx = x + 7, cy = y - 4;
        if (it.k === 'apple') marker(T, cx, cy, 1, false);
        else if (it.k === 'pear') marker(T, cx, cy, -1, false);
        else if (it.k === 'hollow') { marker(T, cx - 3, cy, 1, true); }
        else if (it.k === 'ring') ring(T, cx, cy, 7);
        else cross(T, cx - 10, cy + 10);
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(it.t, x + 18, y);
        x += iw;
      });
      ctx.font = '12px ' + T.fontBody;
      var lines = wrapLines(message(), w - 12);
      var good = state.status === 'done' && acc(state.W, TEST) >= 0.85, bad = state.status === 'done' && !good;
      ctx.fillStyle = good ? T.figGreen : bad ? T.figRed : T.figMuted;
      lines.forEach(function (ln, i) { ctx.fillText(ln, 6, y + 20 + i * 16); });
      var top = y + 20 + lines.length * 16;

      var L = 48, R = w - 10, Tp = top + 4, B = h - 36;
      plot = { L: L, R: R, Tp: Tp, B: B };
      var sx = function (wt) { return L + (wt - WMIN) / (WMAX - WMIN) * (R - L); };
      var sy = function (c) { return B - c / CMAX * (B - Tp); };

      // 판단 영역 칠하기
      region(T, state.W, true); region(T, state.W, false);
      // 눈금
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'center';
      for (var wt = 200; wt <= 700; wt += 100) { ctx.beginPath(); ctx.moveTo(sx(wt), Tp); ctx.lineTo(sx(wt), B); ctx.stroke(); ctx.fillText(wt, sx(wt), B + 14); }
      ctx.textAlign = 'right';
      for (var c = 0; c <= 10; c += 2) { ctx.beginPath(); ctx.moveTo(L, sy(c)); ctx.lineTo(R, sy(c)); ctx.stroke(); ctx.fillText(c, L - 5, sy(c) + 4); }
      ctx.strokeStyle = T.figLine; ctx.strokeRect(L, Tp, R - L, B - Tp);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('무게 (g)', (L + R) / 2, B + 30);
      ctx.save(); ctx.translate(13, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('붉은 정도 (색 지수 0~10)', 0, 0); ctx.restore();

      // 이전 경계(점선)와 지금 경계
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, R - L, B - Tp); ctx.clip();
      if (state.prev) boundary(T, state.prev, T.figMuted, 1.5, [5, 4]);
      boundary(T, state.W, T.figInk, 3, []);
      ctx.restore();

      // 영역 이름표
      label(T, state.W);

      // 점
      TEST.forEach(function (p) { marker(T, sx(p.wt), sy(p.c), p.y, true); if (state.status !== 'start' && wrong(state.W, p)) cross(T, sx(p.wt), sy(p.c)); });
      state.train.forEach(function (p) { marker(T, sx(p.wt), sy(p.c), p.y, false); if (wrong(state.W, p)) ring(T, sx(p.wt), sy(p.c)); });

      function region(T, W, apple) {
        // 직사각형을 반평면으로 잘라 칠한다
        var pts = [[WMIN, 0], [WMAX, 0], [WMAX, CMAX], [WMIN, CMAX]], out = [];
        var f = function (q) { var s = score(W, { wt: q[0], c: q[1] }); return apple ? s : -s; };
        for (var i = 0; i < 4; i++) {
          var a = pts[i], b = pts[(i + 1) % 4], fa = f(a), fb = f(b);
          if (fa >= 0) out.push(a);
          if ((fa >= 0) !== (fb >= 0)) { var t = fa / (fa - fb); out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]); }
        }
        if (out.length < 3) return;
        ctx.fillStyle = apple ? T.figSoftRed : T.figSoftAmber;
        ctx.beginPath(); out.forEach(function (q, i) { if (i) ctx.lineTo(sx(q[0]), sy(q[1])); else ctx.moveTo(sx(q[0]), sy(q[1])); }); ctx.closePath(); ctx.fill();
      }
      function boundary(T, W, color, lw, dash) {
        // W0*u + W1*v + W2 = 0 을 화면 좌표로
        var p1, p2;
        if (Math.abs(W[1]) > Math.abs(W[0])) {
          var vAt = function (u) { return -(W[0] * u + W[2]) / W[1]; };
          p1 = [WMIN, vAt(-0.2) * CMAX]; p2 = [WMAX, vAt(1.2) * CMAX];
          p1[0] = WMIN - 0.2 * (WMAX - WMIN); p2[0] = WMAX + 0.2 * (WMAX - WMIN);
        } else {
          var uAt = function (v) { return -(W[1] * v + W[2]) / W[0]; };
          p1 = [WMIN + uAt(-0.2) * (WMAX - WMIN), -0.2 * CMAX]; p2 = [WMIN + uAt(1.2) * (WMAX - WMIN), 1.2 * CMAX];
        }
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash);
        ctx.beginPath(); ctx.moveTo(sx(p1[0]), sy(p1[1])); ctx.lineTo(sx(p2[0]), sy(p2[1])); ctx.stroke(); ctx.setLineDash([]);
      }
      function label(T, W) {
        // 각 영역에서 경계와 가장 먼 모서리 근처에 이름표
        var corners = [[WMIN, CMAX, 'left', 'top'], [WMAX, CMAX, 'right', 'top'], [WMIN, 0, 'left', 'bottom'], [WMAX, 0, 'right', 'bottom']];
        [true, false].forEach(function (apple) {
          var best = null, bs = 0;
          corners.forEach(function (q) { var s = score(W, { wt: q[0], c: q[1] }) * (apple ? 1 : -1); if (s > bs) { bs = s; best = q; } });
          if (!best) return;
          var tx = best[2] === 'left' ? sx(best[0]) + 8 : sx(best[0]) - 8, ty = best[3] === 'top' ? sy(best[1]) + 18 : sy(best[1]) - 8;
          ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = best[2];
          ctx.fillStyle = apple ? T.figRed : T.figAmber;
          ctx.fillText(apple ? '사과로 판단' : '배로 판단', tx, ty);
        });
      }
    }
    function marker(T, x, y, lab, hollow) {
      ctx.lineWidth = 2;
      if (lab === 1) {
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2);
        if (hollow) { ctx.fillStyle = T.figPanel; ctx.fill(); ctx.strokeStyle = T.figRed; ctx.stroke(); }
        else { ctx.fillStyle = T.figRed; ctx.fill(); ctx.strokeStyle = T.figPanel; ctx.lineWidth = 1; ctx.stroke(); }
      } else {
        if (hollow) { ctx.fillStyle = T.figPanel; ctx.fillRect(x - 5.5, y - 5.5, 11, 11); ctx.strokeStyle = T.figAmber; ctx.strokeRect(x - 5.5, y - 5.5, 11, 11); }
        else { ctx.fillStyle = T.figAmber; ctx.fillRect(x - 6, y - 6, 12, 12); ctx.strokeStyle = T.figPanel; ctx.lineWidth = 1; ctx.strokeRect(x - 6, y - 6, 12, 12); }
      }
    }
    function ring(T, x, y, rr) { ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, rr || 10.5, 0, Math.PI * 2); ctx.stroke(); }
    function cross(T, x, y) {
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(x + 7, y - 13); ctx.lineTo(x + 13, y - 7); ctx.moveTo(x + 13, y - 13); ctx.lineTo(x + 7, y - 7); ctx.stroke();
    }

    // 그래프를 눌러 학습 데이터 추가
    cv.canvas.addEventListener('click', function (e) {
      if (!plot) return;
      var rect = cv.canvas.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top;
      if (x < plot.L || x > plot.R || y < plot.Tp || y > plot.B) return;
      var wt = WMIN + (x - plot.L) / (plot.R - plot.L) * (WMAX - WMIN), c = (plot.B - y) / (plot.B - plot.Tp) * CMAX;
      state.train.push({ wt: wt, c: c, y: state.addLabel });
      if (state.status === 'done' || state.status === 'stuck') { state.status = 'learning'; state.sinceBest = 0; state.bestAcc = acc(state.W, state.train); state.best = state.W.slice(); }
      render();
    });
    cv.canvas.style.cursor = 'crosshair';

    api.onResize(draw);
    render();
  },
});
