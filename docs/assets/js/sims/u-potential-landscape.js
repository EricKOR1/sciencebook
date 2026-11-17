/* 일반물리학 8 전기장과 전위: 전위 지도(등전위선)와 한 줄을 따라 자른 V(x) 단면에서 E = −∇V 읽기 */
Sims.register('u-potential-landscape', {
  title: '전위 지형에서 전기장 읽기 — E = −∇V',
  caption: '전위 분포를 고르고 점 P를 끌거나 슬라이더로 옮겨 보자. 왼쪽(위) 지도의 선은 등전위선(빨강 +, 파랑 −, 회색 0 V)이고 초록 화살표는 P의 전기장 방향이다. 오른쪽(아래)은 P를 지나는 가로줄을 따라 자른 V(x) 그래프로, P에서 그은 접선의 기울기 ∂V/∂x에 −를 붙인 것이 Eₓ이다. 쌍극자의 수직이등분선 위에서는 V = 0인데도 E는 0이 아니고, 도체 구 안에서는 V가 0이 아닌데도 E = 0이다. 전위는 무한히 먼 곳을 0으로 잡았다(예제 11의 함수는 식 그대로).',
  init: function (api) {
    var K = 8.99e9;
    var cfgs = [
      { name: '쌍극자 (예제 3)', unit: 'cm', u: 0.01, X: 10, Y: 6, step: 0.1, p: [0, 3], vclip: 6000,
        levels: [-4000, -2000, -1000, -500, -200, 0, 200, 500, 1000, 2000, 4000],
        V: function (x, y) { return K * 5e-9 * (1 / Math.max(Math.hypot(x + 0.04, y), 1e-3) - 1 / Math.max(Math.hypot(x - 0.04, y), 1e-3)); },
        E: function (x, y) {
          var a = pc(x, y, -0.04, 5e-9), b = pc(x, y, 0.04, -5e-9); return [a[0] + b[0], a[1] + b[1]];
        },
        charges: [[-4, 0, '+'], [4, 0, '−']] },
      { name: '대전된 도체 구', unit: 'm', u: 1, X: 0.4, Y: 0.24, step: 0.005, p: [0.05, 0], vclip: 100,
        levels: [20, 30, 40, 50, 60, 70, 80],
        V: function (x, y) { var r = Math.hypot(x, y); return K * 1e-9 / Math.max(r, 0.1); },
        E: function (x, y) { var r = Math.hypot(x, y); if (r < 0.1) return [0, 0]; var e = K * 1e-9 / (r * r * r); return [e * x, e * y]; },
        sphere: 0.1 },
      { name: '예제 11: V = 3x²y − y³', unit: 'm', u: 1, X: 4, Y: 2.4, step: 0.05, p: [1, 2], vclip: 80,
        levels: [-60, -48, -36, -24, -12, -6, 0, 6, 12, 24, 36, 48, 60],
        V: function (x, y) { return 3 * x * x * y - y * y * y; },
        E: function (x, y) { return [-6 * x * y, -(3 * x * x - 3 * y * y)]; } },
    ];
    function pc(x, y, x0, q) { var dx = x - x0, r = Math.max(Math.hypot(dx, y), 1e-3), e = K * q / (r * r * r); return [e * dx, e * y]; }
    var st = { c: 0, px: 0, py: 3 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.2 : 0.44; }, label: '등전위선 지도와 점 P를 지나는 가로줄의 전위 그래프' });
    var ctx = cv.ctx;
    cv.canvas.style.touchAction = 'none';

    var rV = api.readout('P의 전위 V');
    var rG = api.readout('∂V/∂x, ∂V/∂y');
    var rE = api.readout('E = −∇V');

    var g = api.group();
    var btns = cfgs.map(function (c, i) { return api.button(c.name, function () { choose(i); }, { toggle: true, pressed: i === 0, parent: g }); });
    var sx = api.slider({ id: 'u-potential-landscape-x', label: 'P의 x', min: -10, max: 10, step: 0.1, value: 0,
      format: function (v) { return v.toFixed(2) + ' ' + cfgs[st.c].unit; }, onInput: function (v) { st.px = v; draw(); } });
    var sy = api.slider({ id: 'u-potential-landscape-y', label: 'P의 y', min: -6, max: 6, step: 0.1, value: 3,
      format: function (v) { return v.toFixed(2) + ' ' + cfgs[st.c].unit; }, onInput: function (v) { st.py = v; draw(); } });
    function choose(i) {
      st.c = i; var c = cfgs[i];
      btns.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      sx.input.min = -c.X; sx.input.max = c.X; sx.input.step = c.step; sy.input.min = -c.Y; sy.input.max = c.Y; sy.input.step = c.step;
      sx.set(c.p[0]); sy.set(c.p[1]);
    }

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) { var mh = (w - 16) * 0.6; return { map: { x: 8, y: 22, w: w - 16, h: mh }, pr: { x: 0, y: mh + 34, w: w, h: h - mh - 34 } }; }
      var mw = w * 0.58 - 16; return { map: { x: 8, y: 22, w: mw, h: mw * 0.6 }, pr: { x: w * 0.6, y: 0, w: w * 0.4, h: h } };
    }
    function toPx(m, x, y) { var c = cfgs[st.c]; return [m.x + (x / c.X + 1) / 2 * m.w, m.y + (1 - (y / c.Y + 1) / 2) * m.h]; }
    function fromPx(m, X, Y) { var c = cfgs[st.c]; return [((X - m.x) / m.w * 2 - 1) * c.X, (1 - (Y - m.y) / m.h) * 2 * c.Y - c.Y]; }

    function draw() {
      var T = api.tokens(), c = cfgs[st.c], Lo = layout(), m = Lo.map;
      ctx.clearRect(0, 0, cv.w, cv.h);
      // 색 지도
      var NX = 90, NY = 54, cw = m.w / NX, ch = m.h / NY;
      for (var i = 0; i < NX; i++) for (var j = 0; j < NY; j++) {
        var x = ((i + 0.5) / NX * 2 - 1) * c.X, y = (1 - (j + 0.5) / NY * 2) * c.Y, v = c.V(x * c.u, y * c.u);
        var t = Math.min(1, Math.abs(v) / c.vclip);
        if (t < 0.02) continue;
        ctx.globalAlpha = 0.15 + 0.6 * Math.sqrt(t); ctx.fillStyle = v > 0 ? T.figSoftRed : T.figSoftBlue;
        ctx.fillRect(m.x + i * cw, m.y + j * ch, cw + 0.6, ch + 0.6);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(m.x, m.y, m.w, m.h);
      contours(T, c, m);
      // 전하·구
      if (c.charges) c.charges.forEach(function (q) {
        var p = toPx(m, q[0], q[1]); ctx.beginPath(); ctx.arc(p[0], p[1], 9, 0, 7); ctx.fillStyle = q[2] === '+' ? T.figRed : T.figBlue; ctx.fill();
        ctx.fillStyle = T.figPanel; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText(q[2], p[0], p[1] + 4.5);
      });
      if (c.sphere) { var o = toPx(m, 0, 0); ctx.beginPath(); ctx.arc(o[0], o[1], c.sphere / c.X * m.w / 2, 0, 7); ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.stroke(); }
      // 가로줄
      var pp = toPx(m, st.px, st.py);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(m.x, pp[1]); ctx.lineTo(m.x + m.w, pp[1]); ctx.stroke(); ctx.setLineDash([]);
      // E 화살표
      var E = c.E(st.px * c.u, st.py * c.u), Em = Math.hypot(E[0], E[1]);
      if (Em > 1e-9) { var L = 34; arrow(pp[0], pp[1], pp[0] + E[0] / Em * L, pp[1] - E[1] / Em * L, T.figGreen); }
      ctx.beginPath(); ctx.arc(pp[0], pp[1], 6, 0, 7); ctx.fillStyle = T.figPanel; ctx.fill(); ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('P', pp[0] + 8, pp[1] - 8);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.fillText('등전위선 지도 (가로 ±' + c.X + ' ' + c.unit + ')', m.x, m.y - 7);
      profile(T, c, Lo.pr, E);

      var V = c.V(st.px * c.u, st.py * c.u);
      rV.set(fmt(V) + ' V');
      rG.set(fmt(-E[0]) + ', ' + fmt(-E[1]) + ' V/m');
      rE.set('(' + fmt(E[0]) + ', ' + fmt(E[1]) + ') V/m, 크기 ' + fmt(Em) + ' V/m');
    }
    function fmt(v) {
      if (Math.abs(v) < 1e-6) return '0';
      var a = Math.abs(v);
      if (a >= 1e4) { var e = Math.floor(Math.log10(a)); return (v / Math.pow(10, e)).toFixed(2) + '×10' + String(e).split('').map(function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]; }).join(''); }
      return a >= 100 ? v.toFixed(0) : a >= 10 ? v.toFixed(1) : v.toFixed(2);
    }
    function contours(T, c, m) {
      var NX = 141, NY = 85, grid = [];
      for (var j = 0; j <= NY; j++) { var row = []; for (var i = 0; i <= NX; i++) { var x = (i / NX * 2 - 1) * c.X, y = (1 - j / NY * 2) * c.Y; row.push(c.V(x * c.u, y * c.u)); } grid.push(row); }
      var cw = m.w / NX, ch = m.h / NY;
      c.levels.forEach(function (lv) {
        ctx.beginPath();
        for (var j = 0; j < NY; j++) for (var i = 0; i < NX; i++) {
          var a = grid[j][i], b = grid[j][i + 1], d = grid[j + 1][i], e = grid[j + 1][i + 1], pts = [];
          if ((a - lv) * (b - lv) < 0) pts.push([i + (lv - a) / (b - a), j]);
          if ((b - lv) * (e - lv) < 0) pts.push([i + 1, j + (lv - b) / (e - b)]);
          if ((d - lv) * (e - lv) < 0) pts.push([i + (lv - d) / (e - d), j + 1]);
          if ((a - lv) * (d - lv) < 0) pts.push([i, j + (lv - a) / (d - a)]);
          if (pts.length >= 2) {
            // 점전하 바로 옆 아주 가파른 칸은 건너뛴다
            if (Math.abs(a - e) > 3 * c.vclip) continue;
            ctx.moveTo(m.x + pts[0][0] * cw, m.y + pts[0][1] * ch); ctx.lineTo(m.x + pts[1][0] * cw, m.y + pts[1][1] * ch);
            if (pts.length === 4) { ctx.moveTo(m.x + pts[2][0] * cw, m.y + pts[2][1] * ch); ctx.lineTo(m.x + pts[3][0] * cw, m.y + pts[3][1] * ch); }
          }
        }
        ctx.strokeStyle = lv > 0 ? T.figRed : lv < 0 ? T.figBlue : T.figMuted; ctx.lineWidth = lv === 0 ? 1.8 : 1.3; ctx.stroke();
      });
    }
    function profile(T, c, b, E) {
      var L = b.x + 54, R = b.x + b.w - 10, Tp = b.y + 52, B = b.y + b.h - 46;
      var lo = Infinity, hi = -Infinity, N = 200, vals = [];
      for (var i = 0; i <= N; i++) { var x = (i / N * 2 - 1) * c.X, v = Math.max(-c.vclip, Math.min(c.vclip, c.V(x * c.u, st.py * c.u))); vals.push([x, v]); lo = Math.min(lo, v); hi = Math.max(hi, v); }
      if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
      if (lo > 0) lo = 0; if (hi < 0) hi = 0;
      var stp = niceStep((hi - lo) / 4); lo = Math.floor(lo / stp - 0.05) * stp; hi = Math.ceil(hi / stp + 0.05) * stp;
      var X = function (x) { return L + (x / c.X + 1) / 2 * (R - L); }, Y = function (v) { return B - (v - lo) / (hi - lo) * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'center';
      [-1, -0.5, 0, 0.5, 1].forEach(function (f) { var x = f * c.X; ctx.beginPath(); ctx.moveTo(X(x), Tp); ctx.lineTo(X(x), B); ctx.stroke(); ctx.fillText(+x.toFixed(2), X(x), B + 13); });
      ctx.textAlign = 'right';
      for (var tv = lo; tv <= hi + stp * 0.01; tv += stp) { ctx.beginPath(); ctx.moveTo(L, Y(tv)); ctx.lineTo(R, Y(tv)); ctx.stroke(); ctx.fillText(fmt(Math.abs(tv) < stp * 1e-6 ? 0 : tv), L - 4, Y(tv) + 4); }
      ctx.strokeStyle = T.figMuted; ctx.beginPath(); ctx.moveTo(L, Y(0)); ctx.lineTo(R, Y(0)); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('가로줄(y = ' + (+st.py.toFixed(2)) + ' ' + c.unit + ') 위의 V(x) (V)', b.x + 6, b.y + 16);
      ctx.textAlign = 'right'; ctx.fillText('x (' + c.unit + ')', R, B + 26);
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp - 4, R - L, B - Tp + 8); ctx.clip();
      ctx.beginPath(); vals.forEach(function (p, i) { if (i) ctx.lineTo(X(p[0]), Y(p[1])); else ctx.moveTo(X(p[0]), Y(p[1])); });
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2.4; ctx.stroke();
      // 접선: 기울기 dV/dx = −E_x (단위: V per 화면 단위 길이)
      var v0 = c.V(st.px * c.u, st.py * c.u), slope = -E[0] * c.u, dx = c.X * 0.25;
      ctx.beginPath(); ctx.moveTo(X(st.px - dx), Y(v0 - slope * dx)); ctx.lineTo(X(st.px + dx), Y(v0 + slope * dx));
      ctx.strokeStyle = T.figGreen; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.arc(X(st.px), Y(Math.max(lo, Math.min(hi, v0))), 5.5, 0, 7); ctx.fillStyle = T.figPanel; ctx.fill(); ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = T.figGreen; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('접선 기울기 ∂V/∂x = ' + fmt(-E[0]) + ' V/m', b.x + 6, b.y + 36);
      ctx.fillText('→ Eₓ = −∂V/∂x = ' + fmt(E[0]) + ' V/m', b.x + 6, b.y + b.h - 4);
    }
    function niceStep(v) { var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
    function arrow(x1, y1, x2, y2, col) {
      var a = Math.atan2(y2 - y1, x2 - x1), hs = 9;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * hs * 0.7, y2 - Math.sin(a) * hs * 0.7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - hs * Math.cos(a - 0.45), y2 - hs * Math.sin(a - 0.45)); ctx.lineTo(x2 - hs * Math.cos(a + 0.45), y2 - hs * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
    }
    // 지도 위에서 끌기
    var dragging = false;
    function setFromEvent(ev) {
      var r = cv.canvas.getBoundingClientRect(), m = layout().map, c = cfgs[st.c];
      var p = fromPx(m, ev.clientX - r.left, ev.clientY - r.top);
      sx.set(Math.max(-c.X, Math.min(c.X, Math.round(p[0] / c.step) * c.step))); sy.set(Math.max(-c.Y, Math.min(c.Y, Math.round(p[1] / c.step) * c.step)));
    }
    cv.canvas.addEventListener('pointerdown', function (ev) {
      var r = cv.canvas.getBoundingClientRect(), m = layout().map, X = ev.clientX - r.left, Y = ev.clientY - r.top;
      if (X < m.x || X > m.x + m.w || Y < m.y || Y > m.y + m.h) return;
      dragging = true; cv.canvas.setPointerCapture(ev.pointerId); setFromEvent(ev);
    });
    cv.canvas.addEventListener('pointermove', function (ev) { if (dragging) setFromEvent(ev); });
    cv.canvas.addEventListener('pointerup', function () { dragging = false; });
    cv.canvas.addEventListener('pointercancel', function () { dragging = false; });

    api.onResize(draw);
    choose(0);
  },
});
