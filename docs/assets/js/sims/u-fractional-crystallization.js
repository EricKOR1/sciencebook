/* 일반지구과학 1 결정 분화: 먼저 생긴 결정이 빠져나가면 남은 마그마의 SiO2 함량이 변한다 (질량 보존) */
Sims.register('u-fractional-crystallization', {
  title: '결정이 빠져나간 마그마 — 질량 보존으로 따라가는 결정 분화',
  caption: '슬라이더나 ‘식히기’로 결정을 하나씩 빼내 보자. 빠져나간 결정의 SiO₂ 함량이 남은 마그마보다 낮으면, 질량 보존(처음 SiO₂ = 결정 속 SiO₂ + 남은 마그마 속 SiO₂)에 따라 남은 마그마의 SiO₂가 늘어난다. ‘감람석만’은 예제 5와 같은 계산(SiO₂ 41 % 감람석 30 kg → 약 53.9 %)이다. 보엔 순서에서는 결정 무리의 SiO₂를 남은 마그마보다 약 7~9 %p 낮게 가정했고(감람석 41 %, 자철석 포함), 온도는 대략값이다. 동화 작용·마그마 혼합은 넣지 않았다.',
  init: function (api) {
    var X0 = 50;   // 처음 마그마의 SiO2 (%)
    var stages = [
      { name: '감람석', short: '감람석', col: 'figGreen', to: 52, t0: 1200, t1: 1150, c: function () { return 41; } },
      { name: '휘석 + Ca가 많은 사장석', short: '휘석·Ca 사장석', col: 'figTeal', to: 56, t0: 1150, t1: 1050, c: function (x) { return x - 8; } },
      { name: '각섬석 + 중간 사장석', short: '각섬석·사장석', col: 'figBlue', to: 63, t0: 1050, t1: 900, c: function (x) { return x - 9; } },
      { name: '흑운모 + Na가 많은 사장석', short: '흑운모·Na 사장석', col: 'figViolet', to: 70, t0: 900, t1: 750, c: function (x) { return x - 7; } },
      { name: '정장석 + 석영 (+ 백운모)', short: '정장석·석영', col: 'figAmber', to: 99, t0: 750, t1: 700, c: function (x) { return x; } },
    ];
    var STEP = 0.1, MAXB = 92, MAXO = 50;
    // 보엔 순서 궤적을 미리 계산 (X: 빠져나간 결정의 질량 %)
    function makeBowen() {
      var arr = [], x = X0, F = 1, si = 0, layers = [0, 0, 0, 0, 0];
      for (var i = 0; i <= MAXB / STEP + 1e-9; i++) {
        var X = i * STEP;
        while (si < 4 && x >= stages[si].to) si++;
        arr.push({ X: X, x: x, si: si, layers: layers.slice() });
        var dF = -STEP / 100, c = stages[si].c(x);
        x += (c - x) * dF / F; F += dF; layers[si] += STEP;
      }
      return arr;
    }
    var bowen = makeBowen();
    function olivineAt(X) { var F = 1 - X / 100; return 41 + (X0 - 41) / F; }
    var state = { mode: 'bowen', X: 0, play: false };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.52; }, label: '마그마 방에 쌓이는 결정과 남은 마그마의 SiO2 변화 그래프' });
    var ctx = cv.ctx;
    var rLeft = api.readout('남은 마그마');
    var rSi = api.readout('남은 마그마의 SiO₂');
    var rType = api.readout('마그마 성질');
    var rMin = api.readout('지금 정출되는 결정');
    var rT = api.readout('대략 온도');

    var g = api.group();
    var mb = [
      api.button('보엔 순서대로', function () { setMode('bowen'); }, { toggle: true, pressed: true, parent: g }),
      api.button('감람석만 (예제 5)', function () { setMode('ol'); }, { toggle: true, parent: g }),
    ];
    var sl = api.slider({ id: 'u-fractional-crystallization-x', label: '빠져나간 결정', min: 0, max: MAXB, step: 1, value: 0,
      format: function (v) { return v + ' % (' + v + ' kg)'; },
      onInput: function (v) { state.X = Math.min(v, maxX()); if (v > maxX()) sl.input.value = maxX(); update(); } });
    var pb = api.button('식히기 ▶', function () { togglePlay(); }, { primary: true });
    api.button('처음으로', function () { stop(); sl.set(0); });

    function maxX() { return state.mode === 'ol' ? MAXO : MAXB; }
    function setMode(m) {
      state.mode = m; mb.forEach(function (b, i) { b.setAttribute('aria-pressed', (i === 0) === (m === 'bowen') ? 'true' : 'false'); });
      sl.input.max = maxX(); stop();
      sl.set(m === 'ol' ? 30 : Math.min(state.X, maxX()));
    }
    function togglePlay() {
      if (state.play) { stop(); return; }
      if (state.X >= maxX() - 0.01) sl.set(0);
      if (api.reduced) { sl.set(Math.min(maxX(), Math.floor(state.X / 10) * 10 + 10)); return; }
      state.play = true; pb.textContent = '멈추기 ❚❚'; loop.play();
    }
    function stop() { state.play = false; pb.textContent = '식히기 ▶'; loop.pause(); }
    var loop = api.loop(function (dt) {
      if (!state.play) return;
      state.X = Math.min(maxX(), state.X + dt * 9);
      sl.input.value = Math.round(state.X);
      var out = sl.input.parentNode.querySelector('output');
      if (out) out.textContent = Math.round(state.X) + ' % (' + Math.round(state.X) + ' kg)';
      if (state.X >= maxX() - 0.01) stop();
      update();
    });
    loop.pause();

    function now() {
      if (state.mode === 'ol') {
        var X = state.X; return { x: olivineAt(X), si: 0, layers: [X, 0, 0, 0, 0] };
      }
      return bowen[Math.min(bowen.length - 1, Math.round(state.X / STEP))];
    }
    function typeOf(x) { return x < 52 ? '고철질(현무암질)' : x < 63 ? '중성(안산암질)' : '규장질(유문암질)'; }
    function tempOf(p) {
      if (state.mode === 'ol') return 1200 - state.X * 2;
      var s = stages[p.si], lo = p.si ? stages[p.si - 1].to : X0;
      var f = p.si === 4 ? Math.min(1, (state.X - 80) / 12) : (p.x - lo) / (s.to - lo);
      return s.t0 + (s.t1 - s.t0) * Math.max(0, Math.min(1, f));
    }
    function update() {
      var p = now();
      rLeft.set((100 - state.X).toFixed(0) + ' kg');
      rSi.set(p.x.toFixed(1) + ' %');
      rType.set(typeOf(p.x));
      rMin.set(state.mode === 'ol' ? '감람석 (SiO₂ 41 %)' : stages[p.si].name);
      rT.set('약 ' + Math.round(tempOf(p) / 10) * 10 + ' °C');
      draw();
    }

    function hexRgb(c) {
      var m = /^#([0-9a-f]{6})/i.exec(c); if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
      m = /rgba?\(([^)]+)\)/.exec(c); if (m) return m[1].split(',').slice(0, 3).map(parseFloat);
      return [150, 150, 150];
    }
    function mix(a, b, t) { var A = hexRgb(a), B = hexRgb(b); return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(A[i] + (B[i] - A[i]) * t); }).join(',') + ')'; }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, stacked = w < 560;
      ctx.clearRect(0, 0, w, h);
      var A = stacked ? { x: 0, y: 0, w: w, h: h * 0.42 } : { x: 0, y: 0, w: w * 0.36, h: h };
      var B = stacked ? { x: 0, y: h * 0.45, w: w, h: h * 0.55 } : { x: w * 0.39, y: 0, w: w * 0.61, h: h };
      drawChamber(T, A); drawGraph(T, B);
    }
    function drawChamber(T, r) {
      var p = now(), cw = Math.min(r.w - 30, 230), ch = r.h - 64, x0 = r.x + (r.w - cw) / 2, y0 = r.y + 30, yb = y0 + ch;
      ctx.font = '600 13px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'center';
      ctx.fillText('마그마 방 (처음 100 kg)', x0 + cw / 2, r.y + 18);
      // 쌓인 결정층(질량 비율만큼, 결정과 마그마의 밀도 차이는 무시)
      var y = yb;
      ctx.save(); roundRect(x0, y0, cw, ch, 18); ctx.clip();
      ctx.fillStyle = mix(T.figRed, T.figAmber, Math.max(0, Math.min(1, (p.x - 50) / 20)));
      ctx.globalAlpha = 0.45; ctx.fillRect(x0, y0, cw, ch); ctx.globalAlpha = 1;
      for (var i = 0; i < 5; i++) {
        var m = p.layers[i]; if (m <= 0) continue;
        var hh = ch * m / 100; y -= hh;
        ctx.fillStyle = T[stages[i].col]; ctx.globalAlpha = 0.8; ctx.fillRect(x0, y, cw, hh); ctx.globalAlpha = 1;
        // 결정 무늬
        ctx.strokeStyle = T.figPanel; ctx.lineWidth = 1;
        for (var xx = x0 + 6; xx < x0 + cw; xx += 14) for (var yy = y + 5; yy < y + hh - 2; yy += 9) {
          ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 4, yy + 3); ctx.stroke();
        }
        if (hh > 16) {
          ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
          ctx.fillText((state.mode === 'ol' ? '감람석' : stages[i].short) + ' ' + m.toFixed(0) + ' kg', x0 + cw / 2, y + hh / 2 + 4);
        }
      }
      ctx.restore();
      ctx.lineWidth = 2; ctx.strokeStyle = T.figInk; roundRect(x0, y0, cw, ch, 18); ctx.stroke();
      // 남은 마그마 라벨
      var melt = ch * (100 - state.X) / 100;
      if (melt > 34) {
        ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody;
        ctx.fillText('남은 마그마 ' + (100 - state.X).toFixed(0) + ' kg', x0 + cw / 2, y0 + melt / 2 - 2);
        ctx.font = '12px ' + T.fontBody; ctx.fillText('SiO₂ ' + p.x.toFixed(1) + ' %', x0 + cw / 2, y0 + melt / 2 + 15);
      }
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('결정은 바닥에 가라앉아 마그마와 분리된다', x0 + cw / 2, yb + 22);
    }
    function drawGraph(T, r) {
      var L = r.x + 50, R = r.x + r.w - 14, Tp = r.y + 22, Bt = r.y + r.h - 40;
      var sx = function (X) { return L + X / 100 * (R - L); }, sy = function (x) { return Bt - (x - 45) / 30 * (Bt - Tp); };
      // 마그마 성질 띠
      [[45, 52, T.figSoftRed, '고철질'], [52, 63, T.figSoftViolet, '중성'], [63, 75, T.figSoftAmber, '규장질']].forEach(function (b) {
        ctx.fillStyle = b[2]; ctx.fillRect(L, sy(b[1]), R - L, sy(b[0]) - sy(b[1]));
        ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right';
        ctx.fillText(b[3], R - 6, sy(b[1]) + 15);
      });
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'right';
      [45, 50, 55, 60, 65, 70, 75].forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(v, L - 6, sy(v) + 4); });
      ctx.textAlign = 'center';
      [0, 20, 40, 60, 80, 100].forEach(function (v) { ctx.fillText(v, sx(v), Bt + 15); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('빠져나간 결정 (처음 마그마 질량의 %)', (L + R) / 2, Bt + 32);
      ctx.save(); ctx.translate(r.x + 13, (Tp + Bt) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('남은 마그마의 SiO₂ (%)', 0, 0); ctx.restore();
      // 두 경로
      function curve(fn, maxX, col, lw, dash) {
        ctx.beginPath(); for (var X = 0; X <= maxX + 1e-9; X += 0.5) { var yv = fn(X); if (X === 0) ctx.moveTo(sx(X), sy(yv)); else ctx.lineTo(sx(X), sy(yv)); }
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
      }
      var bfn = function (X) { return bowen[Math.round(X / STEP)].x; };
      var on = state.mode === 'bowen';
      curve(bfn, MAXB, on ? T.figLine : T.figLine, 1.4, on ? [] : [5, 4]);
      curve(olivineAt, MAXO, T.figLine, 1.4, on ? [5, 4] : []);
      curve(on ? bfn : olivineAt, state.X, T.figAccent, 3);
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
      ctx.fillText('감람석만', sx(MAXO) + 4, sy(olivineAt(MAXO)) + 4);
      ctx.fillText('보엔 순서', sx(70), sy(bfn(70)) + 18);
      // 예제 5 점
      if (!on) {
        ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(sx(30), sy(olivineAt(30)), 4, 0, 7); ctx.fill();
        ctx.fillText('예제 5: 30 kg → 53.9 %', sx(30) + 8, sy(olivineAt(30)) + 16);
      }
      var p = now();
      ctx.fillStyle = T.figAccent; ctx.strokeStyle = T.figPanel; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx(state.X), sy(p.x), 6, 0, 7); ctx.fill(); ctx.stroke();
    }
    function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    api.onResize(draw);
    update();
  },
});
