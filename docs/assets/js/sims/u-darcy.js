/* 일반지구과학 4 지표를 바꾸는 작용: 다르시 법칙 — 수두 차·거리·투수 계수·유효 공극률로 지하수 유량과 실제 유속 구하기 */
Sims.register('u-darcy', {
  title: '지하수는 얼마나 빨리 흐를까 — 다르시 법칙',
  caption: '두 관측정의 수위 차, 거리, 대수층의 투수 계수와 유효 공극률을 바꾸어 보자. 다르시 유속 q = K·Δh/L 은 단면 전체로 나눈 값이고, 물은 연결된 빈틈으로만 흐르므로 실제 유속은 v = q/nₑ 로 그보다 빠르다. 투수 계수만 바꾸어도 속도가 열 자릿수 넘게 달라져, 자갈층에서는 하루 수십 m를 가는 물이 점토층에서는 수백만 년이 걸린다. 처음 값은 본문 예제 5와 같다. 대수층은 균질하고 흐름은 한 방향(정상 상태)이라고 가정했으며, 유량은 폭 100 m·두께 20 m 단면에 대한 값이다. 그림 속 점의 빠르기는 실제 유속을 로그 눈금으로 줄여 보여 준다.',
  init: function (api) {
    var A = 100 * 20;
    var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    var state = { dh: 5, L: 1000, lk: -4, n: 0.25, t: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.05 : 0.5; }, label: '두 관측정 사이 대수층의 단면과 유속 비교 눈금' });
    var ctx = cv.ctx;
    var rI = api.readout('수리 경사 i');
    var rQ = api.readout('다르시 유속 q');
    var rV = api.readout('실제 유속 v');
    var rT = api.readout('두 우물 사이를 가는 시간');
    var rF = api.readout('유량 Q');

    api.slider({ id: 'u-darcy-dh', label: '수위(수두) 차 Δh', min: 0.5, max: 20, step: 0.5, value: 5, format: function (v) { return v + ' m'; }, onInput: function (v) { state.dh = v; update(); } });
    api.slider({ id: 'u-darcy-L', label: '두 우물 사이 거리 L', min: 100, max: 3000, step: 50, value: 1000, format: function (v) { return v + ' m'; }, onInput: function (v) { state.L = v; update(); } });
    api.slider({ id: 'u-darcy-k', label: '투수 계수 K', min: -11, max: -1, step: 0.5, value: -4, format: function (v) { return sci(Math.pow(10, v)) + ' m/s · ' + medium(v); }, onInput: function (v) { state.lk = v; update(); } });
    api.slider({ id: 'u-darcy-n', label: '유효 공극률 nₑ', min: 0.02, max: 0.45, step: 0.01, value: 0.25, format: function (v) { return v.toFixed(2); }, onInput: function (v) { state.n = v; update(); } });

    function medium(lk) { return lk >= -3 ? '자갈 수준' : lk >= -5 ? '깨끗한 모래 수준' : lk >= -9 ? '실트 수준' : '점토 수준'; }
    function sci(x) {
      if (x === 0) return '0';
      var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e);
      if (m >= 9.95) { m = 1; e++; }
      if (e >= -2 && e <= 3) return (+x.toPrecision(2)).toString();
      return m.toFixed(1) + '×10' + String(e).split('').map(function (c) { return SUP[c]; }).join('');
    }
    function fmtTime(sec) {
      var day = sec / 86400, yr = day / 365.25;
      if (sec < 3600) return Math.round(sec / 60) + '분';
      if (day < 2) return (sec / 3600).toFixed(1) + '시간';
      if (day < 365) return Math.round(day) + '일';
      if (yr < 1e4) return (yr < 100 ? yr.toFixed(1) : Math.round(yr).toLocaleString('ko-KR')) + '년';
      if (yr < 1e8) return (+(yr / 1e4).toPrecision(2)).toLocaleString('ko-KR') + '만 년';
      return (+(yr / 1e8).toPrecision(2)) + '억 년';
    }
    function calc() {
      var K = Math.pow(10, state.lk), i = state.dh / state.L, q = K * i, v = q / state.n;
      return { K: K, i: i, q: q, v: v, Q: q * A };
    }
    function update() {
      var c = calc();
      rI.set(sci(c.i));
      rQ.set(sci(c.q) + ' m/s');
      rV.set(sci(c.v) + ' m/s ≈ ' + sci(c.v * 86400) + ' m/일');
      rT.set(fmtTime(state.L / c.v));
      rF.set(sci(c.Q * 86400) + ' m³/일');
      draw();
    }

    var dots = []; for (var k = 0; k < 46; k++) dots.push({ x: Math.random(), y: Math.random() });
    function layout() {
      var w = cv.w, h = cv.h;
      return w < 560 ? { S: { x: 0, y: 0, w: w, h: h * 0.66 }, B: { x: 0, y: h * 0.7, w: w, h: h * 0.3 } }
                     : { S: { x: 0, y: 0, w: w, h: h * 0.68 }, B: { x: 0, y: h * 0.72, w: w, h: h * 0.28 } };
    }
    function draw() {
      var T = api.tokens(), Ly = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      section(T, Ly.S); strip(T, Ly.B);
    }
    function section(T, r) {
      var x0 = r.x + 40, x1 = r.x + r.w - 40, ground = r.y + 36;
      var aqT = r.y + r.h * 0.58, aqB = r.y + r.h - 18;
      var hiY = ground + 18, span = (aqT - 14) - hiY;
      var h1 = hiY, h2 = hiY + span * (state.dh / 20);
      // 지층
      ctx.fillStyle = T.figSoftAmber; ctx.fillRect(r.x + 8, ground, r.w - 16, aqT - ground);
      ctx.fillStyle = T.figSoftTeal; ctx.fillRect(r.x + 8, aqT, r.w - 16, aqB - aqT);
      ctx.fillStyle = T.figSoftViolet; ctx.fillRect(r.x + 8, aqT - 10, r.w - 16, 10); ctx.fillRect(r.x + 8, aqB, r.w - 16, 8);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r.x + 8, ground); ctx.lineTo(r.x + r.w - 8, ground); ctx.stroke();
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
      ctx.fillText('피압 대수층 (K = ' + sci(Math.pow(10, state.lk)) + ' m/s, nₑ = ' + state.n.toFixed(2) + ')', (x0 + x1) / 2, aqB - 6);
      ctx.fillText('점토층(물이 거의 통하지 않음)', (x0 + x1) / 2, aqT - 14);
      // 점(물 입자) — 빈틈 사이로 이동
      dots.forEach(function (d) {
        var px = x0 + 14 + d.x * (x1 - x0 - 28), py = aqT + 6 + d.y * (aqB - aqT - 26);
        ctx.beginPath(); ctx.arc(px, py, 2.6, 0, Math.PI * 2); ctx.fillStyle = T.figBlue; ctx.fill();
      });
      // 수두선
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.6; ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.moveTo(x0, h1); ctx.lineTo(x1, h2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figRed; ctx.textAlign = 'center'; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('수두선 (기울기 = 수리 경사 i)', (x0 + x1) / 2, (h1 + h2) / 2 - 8);
      // 우물
      [[x0, h1, '관측정 1'], [x1, h2, '관측정 2']].forEach(function (wl) {
        var wx = wl[0];
        ctx.fillStyle = T.figPanel; ctx.fillRect(wx - 7, ground - 12, 14, aqB - ground + 12);
        ctx.fillStyle = T.figSoftBlue; ctx.fillRect(wx - 7, wl[1], 14, aqB - wl[1]);
        ctx.fillStyle = T.figBlue; ctx.fillRect(wx - 7, wl[1], 14, 3);
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.strokeRect(wx - 7, ground - 12, 14, aqB - ground + 12);
        ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.fillText(wl[2], wx, ground - 18);
      });
      // Δh, L 표시
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(x1 + 14, h1); ctx.lineTo(x1 + 30, h1); ctx.moveTo(x1 + 14, h2); ctx.lineTo(x1 + 30, h2);
      ctx.moveTo(x1 + 24, h1); ctx.lineTo(x1 + 24, h2); ctx.stroke();
      ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x0, h1); ctx.lineTo(x1 + 30, h1); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.translate(x1 + 36, (h1 + h2) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figInk;
      ctx.fillText('Δh ' + state.dh + ' m', 0, 0); ctx.restore();
      ctx.fillStyle = T.figInk; ctx.textAlign = 'center'; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('← L = ' + state.L + ' m →', (x0 + x1) / 2, ground + 14);
      // 흐름 화살표
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2;
      var ay = (aqT + aqB) / 2 - 6, ax = x1 - 60;
      ctx.beginPath(); ctx.moveTo(ax - 40, ay); ctx.lineTo(ax, ay); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax + 2, ay); ctx.lineTo(ax - 7, ay - 5); ctx.lineTo(ax - 7, ay + 5); ctx.closePath(); ctx.fillStyle = T.figBlue; ctx.fill();
    }
    function strip(T, r) {
      var L = r.x + 20, R = r.x + r.w - 20, y = r.y + r.h * 0.45;
      var lo = -9, hi = 5;
      var sx = function (v) { return L + (Math.log10(v) - lo) / (hi - lo) * (R - L); };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('하루에 가는 거리 (m/일, 로그 눈금)', L, r.y + 10);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y); ctx.stroke();
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.lineWidth = 1;
      var narrow = cv.w < 560;
      for (var e = lo; e <= hi; e += (narrow ? 2 : 1)) {
        var xx = sx(Math.pow(10, e)); ctx.beginPath(); ctx.moveTo(xx, y - 4); ctx.lineTo(xx, y + 4); ctx.stroke();
        ctx.fillText(e === 0 ? '1' : '10' + String(e).split('').map(function (ch) { return SUP[ch]; }).join(''), xx, y + 16);
      }
      // 비교 기준
      ctx.font = '11px ' + T.fontBody;
      [[1e-4, '손톱이 자라는 빠르기'], [86, '달팽이'], [86400, '하천(1 m/s)']].forEach(function (m) {
        var xx = sx(m[0]); ctx.fillStyle = T.figMuted;
        ctx.beginPath(); ctx.moveTo(xx, y + 20); ctx.lineTo(xx, y + 24); ctx.stroke();
        ctx.textAlign = xx > R - 50 ? 'right' : 'center';
        ctx.fillText(m[1], Math.min(xx, R), y + 34);
      });
      var c = calc();
      var vq = c.q * 86400, vv = c.v * 86400;
      [[vq, T.figAmber, 'q'], [vv, T.figBlue, 'v']].forEach(function (m, idx) {
        var xx = Math.max(L, Math.min(R, sx(m[0])));
        ctx.beginPath(); ctx.moveTo(xx, y - 3); ctx.lineTo(xx - 6, y - 14); ctx.lineTo(xx + 6, y - 14); ctx.closePath();
        ctx.fillStyle = m[1]; ctx.fill();
        ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(m[2], xx + (idx === 0 ? -9 : 9), y - 18);
      });
    }
    var loop = api.loop(function (dt) {
      var c = calc(), vd = c.v * 86400;
      var frac = Math.max(0, Math.min(1, (Math.log10(vd) + 9) / 14));
      var spd = (0.004 + 0.25 * frac * frac);
      dots.forEach(function (d) { d.x += spd * dt; if (d.x > 1) { d.x -= 1; d.y = Math.random(); } d.y += (Math.random() - 0.5) * 0.02 * frac; d.y = Math.max(0, Math.min(1, d.y)); });
      draw();
    });
    if (api.reduced) loop.pause();
    api.onResize(draw);
    update();
  },
});
