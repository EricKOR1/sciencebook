/* 역학과 에너지 3 탄성파와 소리: 줄과 관(열린 관·닫힌 관)의 정상파 — 마디·배, 파장, 진동수 */
Sims.register('standing-wave', {
  title: '줄과 관의 정상파 — 마디와 배, 그리고 배음',
  caption: '줄이나 관을 고르고 모드 번호와 길이를 바꿔 보자. 줄의 양 끝과 닫힌 끝은 늘 마디(N), 열린 끝은 늘 배(A)가 되도록 파장이 정해지고, 진동수는 기본 진동수의 정수배(닫힌 관은 홀수배만)가 된다. 관에서는 공기 입자가 관을 따라 앞뒤로 움직이는데(종파), 그 변위의 크기를 곡선으로 옆으로 눕혀 그렸다. 줄의 파동 속력은 143 m/s, 공기 속 음속은 340 m/s로 두었고, 관 끝의 보정은 무시했으며 진동은 눈으로 볼 수 있게 느리게 나타냈다.',
  init: function (api) {
    var KINDS = [
      { id: 'string', name: '양 끝 고정 줄', v: 143 },
      { id: 'open', name: '열린 관', v: 340 },
      { id: 'closed', name: '닫힌 관(한쪽 막힘)', v: 340 },
    ];
    var state = { kind: 'string', n: 2, L: 0.65, t: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.9 : 0.44; }, label: '정상파의 마디와 배' });
    var ctx = cv.ctx;

    var rL = api.readout('파장 λ');
    var rF = api.readout('진동수 f');
    var rK = api.readout('기본 진동수의');
    var rNA = api.readout('마디 · 배의 수');

    var g = api.group();
    var btns = KINDS.map(function (k) {
      return api.button(k.name, function () { choose(k.id); }, { toggle: true, pressed: k.id === state.kind, parent: g });
    });
    api.slider({ id: 'standing-wave-n', label: '모드 번호 n', min: 1, max: 5, step: 1, value: state.n,
      format: function (v) { return String(v); }, onInput: function (v) { state.n = v; readouts(); draw(); } });
    api.slider({ id: 'standing-wave-l', label: '길이 L', min: 0.3, max: 1.2, step: 0.05, value: state.L,
      format: function (v) { return v.toFixed(2) + ' m'; }, onInput: function (v) { state.L = v; readouts(); draw(); } });

    function kind() { return KINDS.filter(function (k) { return k.id === state.kind; })[0]; }
    function choose(id) {
      state.kind = id;
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', KINDS[i].id === id ? 'true' : 'false'); });
      readouts(); draw();
    }
    // 배수 m: 줄·열린 관은 n, 닫힌 관은 2n−1
    function mult() { return state.kind === 'closed' ? 2 * state.n - 1 : state.n; }
    function lambda() { return state.kind === 'closed' ? 4 * state.L / (2 * state.n - 1) : 2 * state.L / state.n; }
    function f1() { return kind().v / (state.kind === 'closed' ? 4 * state.L : 2 * state.L); }
    // 위치 u(0~1)에서의 진폭 모양(부호 포함)
    function shape(u) {
      var m = mult();
      if (state.kind === 'string') return Math.sin(m * Math.PI * u);
      if (state.kind === 'open') return Math.cos(m * Math.PI * u);
      return Math.sin(m * Math.PI * u / 2);   // 닫힌 끝(u=0)은 마디, 열린 끝(u=1)은 배
    }
    function points() {
      var m = mult(), nodes = [], anti = [];
      if (state.kind === 'string') { for (var i = 0; i <= m; i++) nodes.push(i / m); for (var j = 0; j < m; j++) anti.push((j + 0.5) / m); }
      else if (state.kind === 'open') { for (var a = 0; a <= m; a++) anti.push(a / m); for (var b = 0; b < m; b++) nodes.push((b + 0.5) / m); }
      else { for (var c = 0; c < state.n; c++) nodes.push(2 * c / m); for (var d = 0; d < state.n; d++) anti.push((2 * d + 1) / m); }
      return { nodes: nodes, anti: anti };
    }
    function readouts() {
      var lam = lambda(), m = mult();
      rL.set(lam.toFixed(2) + ' m');
      rF.set(Math.round(m * f1()) + ' Hz');
      rK.set(m + '배 (f₁ = ' + Math.round(f1()) + ' Hz)');
      var P = points();
      rNA.set(P.nodes.length + ' · ' + P.anti.length);
    }
    var loop = api.loop(function (dt) { state.t += dt; draw(); });
    if (api.reduced) loop.pause();

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      // 길이 1.2 m를 화면 폭에 맞춘다(길이를 바꾸면 그림도 길어진다)
      var x0 = narrow ? 24 : 40, full = w - x0 - (narrow ? 24 : 40), len = full * state.L / 1.2;
      var cy = h * 0.47, A = Math.min(h * 0.26, 70);
      var m = mult(), phase = api.reduced ? 1 : Math.cos(2 * Math.PI * 0.45 * m * state.t);
      var X = function (u) { return x0 + u * len; };
      var isPipe = state.kind !== 'string';
      if (isPipe) {
        // 관
        ctx.fillStyle = T.figSoftTeal; ctx.fillRect(X(0), cy - A - 12, len, 2 * A + 24);
        ctx.strokeStyle = T.figTeal; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(X(0), cy - A - 12); ctx.lineTo(X(1), cy - A - 12); ctx.moveTo(X(0), cy + A + 12); ctx.lineTo(X(1), cy + A + 12); ctx.stroke();
        if (state.kind === 'closed') { ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(X(0), cy - A - 13); ctx.lineTo(X(0), cy + A + 13); ctx.stroke(); }
        // 공기 입자(종파): 관을 따라 앞뒤로 흔들린다
        var cols = Math.max(16, Math.round(len / 13)), rows = 5;
        ctx.fillStyle = T.figMuted;
        for (var i = 0; i <= cols; i++) {
          var u = i / cols, dx = shape(u) * phase * Math.min(7, len / cols * 0.6);
          for (var r = 0; r < rows; r++) {
            var yy = cy - A + 2 + r * (2 * A - 4) / (rows - 1);
            var xx = Math.max(X(0) + 3, Math.min(X(1) - 3, X(u) + dx));
            ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.arc(xx, yy, 2.2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
          }
        }
        ctx.fillStyle = T.figTeal; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(state.kind === 'closed' ? '막힌 끝' : '열린 끝', X(0), cy + A + 30);
        ctx.fillText('열린 끝', X(1), cy + A + 30);
      } else {
        // 줄을 묶은 기둥
        ctx.fillStyle = T.figLine;
        ctx.fillRect(X(0) - 8, cy - A - 14, 8, 2 * A + 28); ctx.fillRect(X(1), cy - A - 14, 8, 2 * A + 28);
      }
      // 진폭 테두리(포락선)
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.2;
      [1, -1].forEach(function (sg) {
        ctx.beginPath();
        for (var k = 0; k <= 200; k++) { var u2 = k / 200, y = cy - sg * A * Math.abs(shape(u2)); if (k === 0) ctx.moveTo(X(u2), y); else ctx.lineTo(X(u2), y); }
        ctx.stroke();
      });
      ctx.setLineDash([]);
      // 지금 모양
      ctx.strokeStyle = isPipe ? T.figAccent : T.figRed; ctx.lineWidth = 3;
      ctx.beginPath();
      for (var k2 = 0; k2 <= 240; k2++) { var u3 = k2 / 240, y3 = cy - A * shape(u3) * phase; if (k2 === 0) ctx.moveTo(X(u3), y3); else ctx.lineTo(X(u3), y3); }
      ctx.stroke();
      // 마디·배 표시
      var P = points();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      P.nodes.forEach(function (u4) {
        ctx.beginPath(); ctx.arc(X(u4), cy, 5, 0, Math.PI * 2); ctx.fillStyle = T.figInk; ctx.fill();
        ctx.fillText('N', X(u4), cy - A - (isPipe ? 18 : 20));
      });
      P.anti.forEach(function (u5) {
        ctx.fillStyle = T.figAmber;
        ctx.beginPath(); ctx.moveTo(X(u5), cy - A - 2); ctx.lineTo(X(u5) - 5, cy - A - 9); ctx.lineTo(X(u5) + 5, cy - A - 9); ctx.closePath(); ctx.fill();
        ctx.fillText('A', X(u5), cy + A + (isPipe ? 46 : 26));
      });
      // λ/2 표시(이웃 마디 또는 이웃 배 사이)
      var ref = P.nodes.length >= 2 ? P.nodes : P.anti;
      var by = h - (narrow ? 14 : 16);
      if (ref.length >= 2) {
        var a1 = X(ref[0]), a2 = X(ref[1]);
        ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(a1, by - 6); ctx.lineTo(a1, by + 2); ctx.moveTo(a1, by - 2); ctx.lineTo(a2, by - 2); ctx.moveTo(a2, by - 6); ctx.lineTo(a2, by + 2); ctx.stroke();
        ctx.fillStyle = T.figViolet; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('λ/2 = ' + (lambda() / 2).toFixed(2) + ' m', a2 + 6, by + 2);
      } else {
        // 닫힌 관 n=1: 마디 하나, 배 하나 → λ/4
        var b1 = X(P.nodes[0]), b2 = X(P.anti[0]);
        ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(b1, by - 6); ctx.lineTo(b1, by + 2); ctx.moveTo(b1, by - 2); ctx.lineTo(b2, by - 2); ctx.moveTo(b2, by - 6); ctx.lineTo(b2, by + 2); ctx.stroke();
        ctx.fillStyle = T.figViolet; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right';
        ctx.fillText('L = λ/4', b2 - 6, by - 6);
      }
      // 범례
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('N 마디 · A 배' + (isPipe ? ' · 곡선: 공기 입자 변위' : ''), x0, 16);
      ctx.textAlign = 'right';
      ctx.fillText('L = ' + state.L.toFixed(2) + ' m', w - 12, 16);
    }

    api.onResize(draw);
    readouts(); draw();
  },
});
