/* 물질과 에너지 1: 이상 기체 방정식 PV = nRT — 고정할 양과 바꿀 양을 골라 관계 보기 */
Sims.register('ideal-gas', {
  title: '기체 입자 상자 — 두 양을 묶어 두고 하나를 바꾸면?',
  caption: '위 단추로 고정할 두 양을 고른 뒤 슬라이더로 한 양을 바꿔 보자. 나머지 한 양은 PV = nRT(R = 0.082 atm·L/(mol·K))로 정확히 계산되고, 그래프에 점이 찍힌다. 부피가 줄면 같은 입자가 벽에 더 자주 부딪히고, 온도가 오르면 입자가 빨라진다. 입자 크기와 입자 사이의 힘은 무시했고(이상 기체), 화면의 입자 수와 빠르기는 몰수와 √T에 비례하게 줄여 나타냈다.',
  init: function (api) {
    var R = 0.082;
    var MODES = [
      { key: 'boyle', name: '보일: n·T 일정', fixed: { n: 1, T: 300 }, x: 'V', y: 'P', min: 5, max: 50, step: 0.5, start: 24.6, xMax: 50, yMax: 5 },
      { key: 'charles', name: '샤를: n·P 일정', fixed: { n: 1, P: 1 }, x: 'T', y: 'V', min: 100, max: 600, step: 10, start: 300, xMax: 600, yMax: 50 },
      { key: 'avogadro', name: '아보가드로: P·T 일정', fixed: { P: 1, T: 300 }, x: 'n', y: 'V', min: 0.2, max: 2, step: 0.1, start: 1, xMax: 2, yMax: 50 },
      { key: 'nv', name: 'n·V 일정 (타이어)', fixed: { n: 1, V: 24.6 }, x: 'T', y: 'P', min: 100, max: 600, step: 10, start: 300, xMax: 600, yMax: 2.5 },
    ];
    var NAME = { P: '압력 P (atm)', V: '부피 V (L)', T: '절대 온도 T (K)', n: '몰수 n (mol)' };
    var st = { mode: MODES[0], s: { P: 1, V: 24.6, T: 300, n: 1 }, dots: [], parts: [], flash: [] };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.5; }, label: '피스톤이 달린 기체 상자와 그래프' });
    var ctx = cv.ctx;
    var rP = api.readout('P'), rV = api.readout('V'), rT = api.readout('T'), rN = api.readout('n'), rK = api.readout('PV ÷ nT');

    var g = api.group();
    var mbtn = MODES.map(function (m, i) {
      return api.button(m.name, function () { setMode(i); }, { toggle: true, pressed: i === 0, parent: g });
    });
    var sl = api.slider({ id: 'ideal-gas-x', label: '바꿀 양', min: 5, max: 50, step: 0.5, value: 24.6, format: fmtX, onInput: function (v) { setX(v); } });
    api.button('점 지우기', function () { st.dots = []; draw(); });
    var slLabel = sl.input.parentNode.firstChild.firstChild;

    function fmtX(v) { var k = st.mode.x; return k === 'V' ? v.toFixed(1) + ' L' : k === 'T' ? v.toFixed(0) + ' K (' + (v - 273).toFixed(0) + ' °C)' : v.toFixed(1) + ' mol'; }
    function solve() {
      var s = st.s, m = st.mode;
      Object.keys(m.fixed).forEach(function (k) { s[k] = m.fixed[k]; });
      if (m.y === 'P') s.P = s.n * R * s.T / s.V; else s.V = s.n * R * s.T / s.P;
    }
    function setMode(i) {
      st.mode = MODES[i];
      mbtn.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      var m = st.mode;
      sl.input.min = m.min; sl.input.max = m.max; sl.input.step = m.step;
      slLabel.textContent = NAME[m.x].replace(/ \(.*\)/, '') + ' ';
      st.dots = []; st.s = { P: 1, V: 24.6, T: 300, n: 1 };
      sl.set(m.start);
    }
    function setX(v) {
      st.s[st.mode.x] = v; solve(); syncParts();
      var d = { x: v, y: st.s[st.mode.y] };
      st.dots = st.dots.filter(function (p) { return Math.abs(p.x - d.x) > 1e-9; });
      st.dots.push(d); if (st.dots.length > 24) st.dots.shift();
      readouts(); draw();
    }
    function readouts() {
      var s = st.s, fx = st.mode.fixed;
      var tag = function (k) { return fx[k] != null ? ' (고정)' : k === st.mode.x ? ' (바꿈)' : ' (계산)'; };
      rP.set(s.P.toFixed(2) + ' atm' + tag('P')); rV.set(s.V.toFixed(1) + ' L' + tag('V'));
      rT.set(s.T.toFixed(0) + ' K' + tag('T')); rN.set(s.n.toFixed(1) + ' mol' + tag('n'));
      rK.set((s.P * s.V / (s.n * s.T)).toFixed(3) + ' = R');
    }

    // 입자: 상자 안 비율 좌표(0~1), 입자 수 ∝ n
    function syncParts() {
      var want = Math.round(st.s.n * 28);
      while (st.parts.length < want) { var a = Math.random() * Math.PI * 2; st.parts.push({ x: Math.random(), y: Math.random(), dx: Math.cos(a), dy: Math.sin(a), sp: 0.7 + Math.random() * 0.6 }); }
      st.parts.length = want;
    }
    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { box: { x: 14, y: 30, w: w - 28, h: h * 0.4 }, gr: { x: 0, y: h * 0.47, w: w, h: h * 0.53 } };
      return { box: { x: 14, y: 30, w: w * 0.5 - 24, h: h - 60 }, gr: { x: w * 0.52, y: 0, w: w * 0.48, h: h } };
    }
    function boxGeom(L) {
      var maxW = L.box.w - 70, wall = maxW * st.s.V / 50;
      return { x: L.box.x + 8, y: L.box.y + 18, w: wall, h: L.box.h - 30 };
    }
    var loop = api.loop(function (dt) {
      var L = layout(), B = boxGeom(L), v = 0.55 * Math.sqrt(st.s.T / 300);
      st.parts.forEach(function (p) {
        p.x += p.dx * p.sp * v * dt * 160 / Math.max(B.w, 1);
        p.y += p.dy * p.sp * v * dt * 160 / B.h;
        if (p.x < 0) { p.x = -p.x; p.dx = -p.dx; hit(0, p.y); }
        if (p.x > 1) { p.x = 2 - p.x; p.dx = -p.dx; hit(1, p.y); }
        if (p.y < 0) { p.y = -p.y; p.dy = -p.dy; }
        if (p.y > 1) { p.y = 2 - p.y; p.dy = -p.dy; }
      });
      st.flash = st.flash.filter(function (f) { f.t -= dt; return f.t > 0; });
      draw();
    });
    function hit(side, y) { if (side === 1) st.flash.push({ y: y, t: 0.25 }); }
    if (api.reduced) loop.pause();

    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawBox(T, L); drawGraph(T, L.gr);
    }
    function drawBox(T, L) {
      var B = boxGeom(L), m = st.mode, pinned = m.fixed.V != null;
      ctx.font = '600 13px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left';
      ctx.fillText(m.name, L.box.x, L.box.y + 4);
      // 실린더
      ctx.fillStyle = T.figPaper; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      ctx.fillRect(B.x, B.y, L.box.w - 40, B.h); ctx.strokeRect(B.x, B.y, L.box.w - 40, B.h);
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(B.x, B.y, B.w, B.h);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(B.x + L.box.w - 40, B.y); ctx.lineTo(B.x, B.y); ctx.lineTo(B.x, B.y + B.h); ctx.lineTo(B.x + L.box.w - 40, B.y + B.h); ctx.stroke();
      // 피스톤
      ctx.fillStyle = pinned ? T.figSoftRed : T.figLine; ctx.fillRect(B.x + B.w, B.y + 2, 10, B.h - 4);
      ctx.fillStyle = T.figLine; ctx.fillRect(B.x + B.w + 10, B.y + B.h / 2 - 3, L.box.w - 50 - B.w, 6);
      st.flash.forEach(function (f) { ctx.globalAlpha = f.t * 4; ctx.fillStyle = T.figAmber; ctx.fillRect(B.x + B.w - 3, B.y + f.y * B.h - 6, 4, 12); });
      ctx.globalAlpha = 1;
      if (pinned) { ctx.fillStyle = T.figRed; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('피스톤 고정', B.x + B.w + 5, B.y + B.h + 14); }
      // 입자
      var r = Math.max(2.5, Math.min(5, B.h / 40));
      ctx.fillStyle = T.figBlue;
      st.parts.forEach(function (p) { ctx.beginPath(); ctx.arc(B.x + r + p.x * (B.w - 2 * r), B.y + r + p.y * (B.h - 2 * r), r, 0, 7); ctx.fill(); });
      // 압력계 막대
      var gx = L.box.x + L.box.w - 22, gy = B.y, gh = B.h, frac = Math.min(1, st.s.P / 5);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(gx, gy, 14, gh);
      ctx.fillStyle = T.figRed; ctx.fillRect(gx + 1, gy + gh * (1 - frac), 12, gh * frac);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('압력', gx + 7, gy + gh + 14);
      ctx.textAlign = 'left'; ctx.fillStyle = T.figMuted;
      ctx.fillText('부피 ' + st.s.V.toFixed(1) + ' L · 입자 ' + st.parts.length + '개', B.x, B.y + B.h + 14);
    }
    function drawGraph(T, r) {
      var m = st.mode, Lx = r.x + 52, Rx = r.x + r.w - 16, Tp = r.y + 26, Bt = r.y + r.h - 38;
      var sx = function (v) { return Lx + v / m.xMax * (Rx - Lx); }, sy = function (v) { return Bt - v / m.yMax * (Bt - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      for (var i = 0; i <= 5; i++) {
        var yv = m.yMax * i / 5, xv = m.xMax * i / 5;
        ctx.beginPath(); ctx.moveTo(Lx, sy(yv)); ctx.lineTo(Rx, sy(yv)); ctx.stroke();
        ctx.textAlign = 'right'; ctx.fillText(+yv.toFixed(2), Lx - 5, sy(yv) + 4);
        ctx.textAlign = 'center'; ctx.fillText(+xv.toFixed(2), sx(xv), Bt + 14);
      }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(NAME[m.x], (Lx + Rx) / 2, Bt + 30);
      ctx.textAlign = 'left'; ctx.fillText(NAME[m.y], r.x + 6, r.y + 14);
      // 이론 곡선
      ctx.save(); ctx.beginPath(); ctx.rect(Lx, Tp - 2, Rx - Lx, Bt - Tp + 4); ctx.clip();
      var f = function (x) { var s = {}; Object.keys(m.fixed).forEach(function (k) { s[k] = m.fixed[k]; }); s[m.x] = x; return m.y === 'P' ? s.n * R * s.T / s.V : s.n * R * s.T / s.P; };
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5; ctx.beginPath();
      for (var k = 0; k <= 120; k++) { var x = m.xMax * k / 120; if (x <= 0) x = m.xMax / 240; var y = f(x); if (k) ctx.lineTo(sx(x), sy(y)); else ctx.moveTo(sx(x), sy(y)); }
      ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      st.dots.forEach(function (d) { ctx.fillStyle = T.figAccent; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(sx(d.x), sy(d.y), 4, 0, 7); ctx.fill(); });
      ctx.globalAlpha = 1;
      var cx = sx(st.s[m.x]), cy = sy(st.s[m.y]);
      ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 7); ctx.fill();
      ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figInk;
      var rel = m.y === 'P' && m.x === 'V' ? 'P ∝ 1/V (반비례)' : m.y + ' ∝ ' + m.x + ' (정비례)';
      ctx.textAlign = 'right'; ctx.fillText(rel, Rx, Tp + 4);
    }

    api.onResize(draw);
    setMode(0);
    if (!api.reduced) loop.play();
  },
});
