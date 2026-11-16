/* 중2-5 식물과 에너지: 검정말 실험 — 빛의 세기, 이산화 탄소 농도, 온도에 따른 광합성량(기포 수) */
Sims.register('photosynthesis-lab', {
  title: '검정말 실험실 — 환경 요인과 광합성량',
  caption: '전등과의 거리, 탄산수소 나트륨(이산화 탄소 공급)의 양, 수온 가운데 하나를 바꾸며 1분 동안 나오는 기포 수를 기록해 보자. 바꾼 요인이 그래프의 가로축이 되고, 나머지 두 조건은 그대로 둔 채 결과가 점으로 쌓인다. 빛과 이산화 탄소는 어느 정도 이상에서 광합성량이 더 늘지 않고, 온도는 알맞은 온도에서 가장 많았다가 그보다 높으면 빠르게 줄어든다. 수치는 경향을 보여 주기 위한 예시 모형으로, 기포 수를 광합성량으로 보았고 전등의 열은 막았다고 가정했다(기포는 3배 빠르게 그렸다).',
  init: function (api) {
    var PMAX = 63;
    var state = { d: 10, g: 1, t: 25, axis: 'light', rec: [], bubbles: [], acc: 0 };
    function I(d) { return Math.pow(10 / d, 2); }               // 빛의 세기: 전등 거리 10 cm일 때를 1로
    function fL(i) { return i / (i + 0.4); }
    function fC(g) { return 1 - Math.exp(-(0.1 + g) / 0.45); }   // 탄산수소 나트륨이 없어도 물에 녹은 이산화 탄소가 조금 있다
    function fT(t) { var o = 32; return Math.exp(-Math.pow((t - o) / (t <= o ? 14 : 6), 2)); }
    function P(d, g, t) { return PMAX * fL(I(d)) * fC(g) * fT(t); }
    var AX = {
      light: { name: '빛의 세기', unit: '(전등 거리 10 cm일 때 = 1)', min: 0, max: 4, ticks: [0, 1, 2, 3, 4], x: function () { return I(state.d); },
        curve: function (v) { return PMAX * fL(v) * fC(state.g) * fT(state.t); } },
      co2: { name: '탄산수소 나트륨의 양', unit: '(g, 이산화 탄소 공급)', min: 0, max: 2, ticks: [0, 0.5, 1, 1.5, 2], x: function () { return state.g; },
        curve: function (v) { return PMAX * fL(I(state.d)) * fC(v) * fT(state.t); } },
      temp: { name: '수온', unit: '(℃)', min: 5, max: 45, ticks: [5, 15, 25, 35, 45], x: function () { return state.t; },
        curve: function (v) { return PMAX * fL(I(state.d)) * fC(state.g) * fT(v); } },
    };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.52; }, label: '검정말 실험 장치와 요인-광합성량 그래프' });
    var ctx = cv.ctx;
    var rB = api.readout('1분 동안 기포 수');
    var rL = api.readout('빛의 세기(상대값)');
    var rLim = api.readout('가장 부족한 조건');

    api.slider({ id: 'photosynthesis-lab-dist', label: '전등과의 거리', min: 5, max: 40, step: 1, value: state.d,
      format: function (v) { return v + ' cm'; }, onInput: function (v) { state.d = v; touched('light'); } });
    api.slider({ id: 'photosynthesis-lab-co2', label: '탄산수소 나트륨', min: 0, max: 2, step: 0.25, value: state.g,
      format: function (v) { return v.toFixed(2) + ' g'; }, onInput: function (v) { state.g = v; touched('co2'); } });
    api.slider({ id: 'photosynthesis-lab-temp', label: '수온', min: 5, max: 45, step: 1, value: state.t,
      format: function (v) { return v + ' ℃'; }, onInput: function (v) { state.t = v; touched('temp'); } });
    api.button('기록 지우기', function () { state.rec = []; record(); draw(); });

    function touched(ax) {
      if (state.axis !== ax) { state.axis = ax; state.rec = []; }
      record(); readouts(); draw();
    }
    function record() {
      var x = AX[state.axis].x(), p = P(state.d, state.g, state.t);
      state.rec = state.rec.filter(function (r) { return Math.abs(r.x - x) > 1e-9; });
      state.rec.push({ x: x, p: p });
    }
    function readouts() {
      var p = P(state.d, state.g, state.t);
      rB.set(Math.round(p) + '개');
      rL.set(I(state.d).toFixed(2));
      var f = [{ n: '빛', v: fL(I(state.d)) }, { n: '이산화 탄소', v: fC(state.g) }, { n: state.t > 32 ? '온도(너무 높음)' : '온도(낮음)', v: fT(state.t) }];
      f.sort(function (a, b) { return a.v - b.v; });
      rLim.set(f[0].v > 0.85 ? '모두 충분한 편' : f[0].n);
    }

    var loop = api.loop(function (dt) {
      if (!(dt > 0)) return;
      var p = P(state.d, state.g, state.t);
      state.acc += dt * p / 60 * 3;
      while (state.acc >= 1) { state.acc -= 1; state.bubbles.push({ y: 0, x: Math.random() * 2 - 1, r: 2.5 + Math.random() * 2 }); }
      state.bubbles.forEach(function (b) { b.y += dt * 0.35; });
      state.bubbles = state.bubbles.filter(function (b) { return b.y < 1; });
      draw();
    });
    if (api.reduced) loop.pause();

    function panels() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { scene: { x: 0, y: 0, w: w, h: h * 0.42 }, graph: { x: 0, y: h * 0.45, w: w, h: h * 0.55 } }
        : { scene: { x: 0, y: 0, w: w * 0.4, h: h }, graph: { x: w * 0.43, y: 0, w: w * 0.57, h: h } };
    }
    function draw() {
      var T = api.tokens(), Pn = panels();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawScene(T, Pn.scene); drawGraph(T, Pn.graph);
    }
    function drawScene(T, r) {
      var fs = 12;
      var tubeW = 46, tubeX = r.x + r.w - tubeW - 18, top = r.y + 26, bot = r.y + r.h - 34;
      var span = tubeX - (r.x + 40);   // 40 cm까지 들어가는 폭
      var lampX = tubeX - 8 - (state.d / 40) * (span - 8), lampY = (top + bot) / 2 + 6;
      // 빛
      var inten = Math.min(1, I(state.d) / 2.5);
      ctx.fillStyle = T.figSoftAmber; ctx.globalAlpha = 0.35 + 0.65 * inten;
      ctx.beginPath(); ctx.moveTo(lampX + 12, lampY - 8); ctx.lineTo(tubeX, top + 30); ctx.lineTo(tubeX, bot - 6); ctx.lineTo(lampX + 12, lampY + 8); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      // 전등
      ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.arc(lampX, lampY, 13, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.fillRect(lampX - 4, lampY + 13, 8, bot - lampY - 13);
      ctx.fillRect(lampX - 16, bot, 32, 5);
      ctx.fillStyle = T.figInk; ctx.font = fs + 'px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('전등', lampX, lampY - 20);
      // 거리
      var yd = bot + 20;
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(lampX, yd - 4); ctx.lineTo(lampX, yd + 4); ctx.moveTo(lampX, yd); ctx.lineTo(tubeX + tubeW / 2, yd); ctx.moveTo(tubeX + tubeW / 2, yd - 4); ctx.lineTo(tubeX + tubeW / 2, yd + 4); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.fillText(state.d + ' cm', (lampX + tubeX + tubeW / 2) / 2, yd - 5);
      // 시험관과 물
      var wTop = top + 22;
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(tubeX, wTop, tubeW, bot - wTop);
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(tubeX, top); ctx.lineTo(tubeX, bot); ctx.lineTo(tubeX + tubeW, bot); ctx.lineTo(tubeX + tubeW, top); ctx.stroke();
      // 검정말
      var px = tubeX + tubeW / 2, pTop = wTop + (bot - wTop) * 0.35;
      ctx.strokeStyle = T.figGreen; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, bot - 2); ctx.lineTo(px, pTop); ctx.stroke();
      ctx.lineWidth = 2;
      for (var k = 0; k < 6; k++) {
        var yy = bot - 10 - k * (bot - pTop - 10) / 6, s = k % 2 ? 1 : -1;
        ctx.beginPath(); ctx.moveTo(px, yy); ctx.quadraticCurveTo(px + s * 12, yy - 2, px + s * 16, yy - 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px, yy); ctx.quadraticCurveTo(px - s * 8, yy - 3, px - s * 11, yy - 9); ctx.stroke();
      }
      // 기포
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.fillStyle = T.figPanel;
      var bubs = state.bubbles;
      if (api.reduced || !loop.playing) {   // 움직임 없이: 기포 수에 비례한 정지 그림
        var n = Math.round(P(state.d, state.g, state.t) / 5); bubs = [];
        for (var j = 0; j < n; j++) bubs.push({ y: (j + 0.5) / n, x: Math.sin(j * 2.3), r: 3 + (j % 3) * 0.8 });
      }
      bubs.forEach(function (b) {
        var y = pTop - 4 - b.y * (pTop - 4 - wTop - 4);
        ctx.beginPath(); ctx.arc(px + b.x * 9, y, b.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.font = fs + 'px ' + T.fontBody;
      ctx.fillText('검정말', px, bot + 14 > yd - 16 ? r.y + 14 : bot + 14);
      // 조건 표시
      ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.font = fs + 'px ' + T.fontBody;
      ctx.fillText('수온 ' + state.t + ' ℃', r.x + 8, r.y + 16);
      ctx.fillText('탄산수소 나트륨 ' + state.g.toFixed(2) + ' g', r.x + 8, r.y + 32);
    }
    function drawGraph(T, r) {
      var ax = AX[state.axis], L = r.x + 46, R = r.x + r.w - 14, Tp = r.y + 34, B = r.y + r.h - 42, YM = 70;
      var sx = function (v) { return L + (v - ax.min) / (ax.max - ax.min) * (R - L); };
      var sy = function (p) { return B - p / YM * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(ax.name + ' – 광합성량', L, r.y + 16);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      [0, 10, 20, 30, 40, 50, 60, 70].forEach(function (p) { ctx.beginPath(); ctx.moveTo(L, sy(p)); ctx.lineTo(R, sy(p)); ctx.stroke(); ctx.fillText(p, L - 6, sy(p) + 4); });
      ctx.textAlign = 'center';
      ax.ticks.forEach(function (v) { ctx.fillText(v, sx(v), B + 14); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText(ax.name + ' ' + ax.unit, (L + R) / 2, B + 31);
      ctx.save(); ctx.translate(r.x + 11, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('1분 동안 기포 수(개)', 0, 0); ctx.restore();
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      // 모형 곡선(다른 두 조건이 지금 그대로일 때)
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.6; ctx.beginPath();
      for (var k = 0; k <= 120; k++) {
        var v = ax.min + (ax.max - ax.min) * k / 120, p = ax.curve(state.axis === 'light' ? Math.max(v, 1e-6) : v);
        if (k) ctx.lineTo(sx(v), sy(p)); else ctx.moveTo(sx(v), sy(p));
      }
      ctx.stroke(); ctx.setLineDash([]);
      // 기록한 점
      var pts = state.rec.slice().sort(function (a, b) { return a.x - b.x; });
      if (pts.length > 1) {
        ctx.strokeStyle = T.figGreen; ctx.lineWidth = 2; ctx.beginPath();
        pts.forEach(function (q, i) { if (i) ctx.lineTo(sx(q.x), sy(q.p)); else ctx.moveTo(sx(q.x), sy(q.p)); }); ctx.stroke();
      }
      pts.forEach(function (q) { ctx.fillStyle = T.figGreen; ctx.beginPath(); ctx.arc(sx(q.x), sy(q.p), 3.5, 0, Math.PI * 2); ctx.fill(); });
      var cx = sx(ax.x()), cp = P(state.d, state.g, state.t);
      ctx.fillStyle = T.figAccent; ctx.strokeStyle = T.figPanel; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, sy(cp), 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figAccent;
      ctx.textAlign = cx > (L + R) / 2 ? 'right' : 'left';
      ctx.fillText(Math.round(cp) + '개', cx + (cx > (L + R) / 2 ? -10 : 10), sy(cp) - 10);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      ctx.fillText('점선: 다른 두 조건이 지금과 같을 때의 경향', R, Tp - 8);
    }

    api.onResize(draw);
    record(); readouts(); draw();
  },
});
