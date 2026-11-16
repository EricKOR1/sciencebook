/* 전자기와 양자 1 전기장과 전위: 점전하 1~2개의 전기장(화살표)과 등전위선, 한 점의 E와 V (쿨롱 법칙으로 계산) */
Sims.register('field-potential', {
  title: '전기장 지도와 전위 지도 — 점 P의 E와 V 읽기',
  caption: '전하 배치를 고르고 전하량을 바꾼 뒤, 점 P를 끌어 옮기며 전기장의 세기와 전위를 읽어 보자. 화살표는 그 자리에서 (+)전하가 받는 힘의 방향(길수록 셈)이고, 선은 2×10⁴ V 간격의 등전위선이다. 등전위선이 촘촘한 곳일수록 전기장이 세고, 화살표는 언제나 등전위선에 수직으로 전위가 낮아지는 쪽을 향한다. ‘+4와 −1’에서 P가 놓인 곳은 전기장이 0이지만 전위는 0이 아니다. 값은 k = 9.0×10⁹ N·m²/C²로 계산했고, 실제 공간은 입체이지만 전하를 지나는 평면만 그렸다.',
  init: function (api) {
    var K = 9.0e9, DV = 2e4, XR = 1.2;          // 보기 범위: 가로 −1.2 ~ 1.2 m
    var presets = [
      { name: '점전하 하나', q: [2, 0], x: [0, 0], p: [0.3, 0] },
      { name: '+ 와 −', q: [2, -2], x: [-0.4, 0.4], p: [0, 0.3] },
      { name: '+ 와 +', q: [2, 2], x: [-0.4, 0.4], p: [0, 0] },
      { name: '+4 와 −1', q: [4, -1], x: [-0.6, 0], p: [0.6, 0] },
    ];
    var st = { q: [2, 0], x: [0, 0], p: [0.3, 0], preset: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.58; }, label: '점전하 주위의 전기장 화살표와 등전위선' });
    var ctx = cv.ctx;

    var rE = api.readout('점 P의 전기장 세기 E');
    var rDir = api.readout('전기장 방향');
    var rV = api.readout('점 P의 전위 V');

    var g1 = api.group();
    var pbs = presets.map(function (p, i) {
      return api.button(p.name, function () { choose(i); }, { toggle: true, pressed: i === 0, parent: g1 });
    });
    var s1 = api.slider({ id: 'field-potential-q1', label: '왼쪽(또는 가운데) 전하 q₁', min: -4, max: 4, step: 1, value: 2,
      format: fq, onInput: function (v) { st.q[0] = v; draw(); } });
    var s2 = api.slider({ id: 'field-potential-q2', label: '오른쪽 전하 q₂ (0이면 없음)', min: -4, max: 4, step: 1, value: 0,
      format: fq, onInput: function (v) { st.q[1] = v; draw(); } });
    function fq(v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + ' μC'; }
    function choose(i) {
      var p = presets[i]; st.preset = i;
      st.x = p.x.slice(); st.p = p.p.slice();
      s1.set(p.q[0]); s2.set(p.q[1]);
      pbs.forEach(function (b, j) { b.setAttribute('aria-pressed', i === j ? 'true' : 'false'); });
      draw();
    }

    function charges() {
      var out = [];
      for (var i = 0; i < 2; i++) if (st.q[i] !== 0) out.push({ q: st.q[i] * 1e-6, x: st.x[i], y: 0 });
      return out;
    }
    function fieldAt(x, y, cs) {
      var ex = 0, ey = 0, v = 0;
      cs.forEach(function (c) {
        var dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy, r = Math.sqrt(r2);
        if (r < 1e-6) return;
        ex += K * c.q * dx / (r2 * r); ey += K * c.q * dy / (r2 * r); v += K * c.q / r;
      });
      return { ex: ex, ey: ey, e: Math.hypot(ex, ey), v: v };
    }
    function sci(n, unit) {
      if (Math.abs(n) < 0.5) return '0 ' + unit;
      var s = n < 0 ? '−' : '', a = Math.abs(n), e = Math.floor(Math.log10(a)), m = a / Math.pow(10, e);
      if (m >= 9.95) { m /= 10; e += 1; }
      var sup = String(e).split('').map(function (c) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || '⁻'; }).join('');
      return s + m.toFixed(1) + ' × 10' + sup + ' ' + unit;
    }

    function view() {
      var w = cv.w, h = cv.h, sc = w / (2 * XR);
      return { sc: sc, X: function (x) { return w / 2 + x * sc; }, Y: function (y) { return h / 2 - y * sc; },
        ix: function (px) { return (px - w / 2) / sc; }, iy: function (py) { return (h / 2 - py) / sc; } };
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, V = view(), cs = charges();
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = T.figPaper; ctx.fillRect(0, 0, w, h);
      // 등전위선(마칭 스퀘어)
      var cell = Math.max(5, Math.round(w / 140)), nx = Math.ceil(w / cell) + 1, ny = Math.ceil(h / cell) + 1, grid = new Float64Array(nx * ny);
      for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) grid[j * nx + i] = fieldAt(V.ix(i * cell), V.iy(j * cell), cs).v;
      var vmax = 0; for (var q = 0; q < grid.length; q++) if (isFinite(grid[q])) vmax = Math.max(vmax, Math.abs(grid[q]));
      var lv = [], top = Math.min(vmax, 1.6e5);
      for (var L = DV; L < top; L += DV) { lv.push(L); lv.push(-L); }
      if (cs.length > 1) lv.push(0);
      lv.forEach(function (L) {
        ctx.beginPath();
        for (var j = 0; j < ny - 1; j++) for (var i = 0; i < nx - 1; i++) {
          var a = grid[j * nx + i] - L, b = grid[j * nx + i + 1] - L, c = grid[(j + 1) * nx + i + 1] - L, d = grid[(j + 1) * nx + i] - L;
          var idx = (a > 0 ? 8 : 0) | (b > 0 ? 4 : 0) | (c > 0 ? 2 : 0) | (d > 0 ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          var x0 = i * cell, y0 = j * cell;
          var pT = [x0 + cell * a / (a - b), y0], pR = [x0 + cell, y0 + cell * b / (b - c)];
          var pB = [x0 + cell * d / (d - c), y0 + cell], pL = [x0, y0 + cell * a / (a - d)];
          var segs = { 1: [pL, pB], 2: [pB, pR], 3: [pL, pR], 4: [pT, pR], 5: [pT, pL, pB, pR], 6: [pT, pB], 7: [pT, pL],
            8: [pT, pL], 9: [pT, pB], 10: [pT, pR, pL, pB], 11: [pT, pR], 12: [pL, pR], 13: [pB, pR], 14: [pL, pB] }[idx];
          for (var s = 0; s < segs.length; s += 2) { ctx.moveTo(segs[s][0], segs[s][1]); ctx.lineTo(segs[s + 1][0], segs[s + 1][1]); }
        }
        ctx.strokeStyle = L > 0 ? T.figRed : L < 0 ? T.figBlue : T.figMuted;
        ctx.globalAlpha = L === 0 ? 0.9 : 0.55; ctx.lineWidth = L === 0 ? 1.6 : 1.1;
        ctx.setLineDash(L === 0 ? [5, 4] : []); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      });
      // 전기장 화살표 격자
      var step = Math.max(26, w / 22), Eref = 5e4;
      for (var py = step / 2; py < h; py += step) for (var px = step / 2; px < w; px += step) {
        var x = V.ix(px), y = V.iy(py), near = false;
        cs.forEach(function (c) { if (Math.hypot(x - c.x, y - c.y) < 0.09) near = true; });
        if (near) continue;
        var f = fieldAt(x, y, cs); if (f.e < 1) continue;
        var len = step * 0.8 * Math.max(0.22, Math.min(1, 0.55 + 0.3 * Math.log10(f.e / Eref)));
        arrow(px, py, f.ex / f.e, -f.ey / f.e, len, T.figInk, 0.55, 1.3);
      }
      // 전하
      cs.forEach(function (c) {
        var cx = V.X(c.x), cy = V.Y(c.y), r = 9 + Math.abs(c.q * 1e6) * 1.6;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = c.q > 0 ? T.figSoftRed : T.figSoftBlue; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = c.q > 0 ? T.figRed : T.figBlue; ctx.stroke();
        label(T, fq(Math.round(c.q * 1e6)), cx, cy + r + 12, 'center', c.q > 0 ? T.figRed : T.figBlue, true);
      });
      // 점 P
      var P = fieldAt(st.p[0], st.p[1], cs), ppx = V.X(st.p[0]), ppy = V.Y(st.p[1]);
      if (P.e > 1) arrow(ppx, ppy, P.ex / P.e, -P.ey / P.e, 40, T.figAmber, 1, 3);
      ctx.beginPath(); ctx.arc(ppx, ppy, 7, 0, Math.PI * 2); ctx.fillStyle = T.figAmber; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = T.figPanel; ctx.stroke();
      label(T, 'P', ppx + 10, ppy - 13, 'left', T.figInk, true);
      // 축척과 범례
      var bar = 0.2 * V.sc;
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(12, h - 14); ctx.lineTo(12 + bar, h - 14); ctx.stroke();
      label(T, '0.2 m', 12, h - 24, 'left', T.figMuted);
      label(T, 'V > 0 등전위선', w - 10, 14, 'right', T.figRed);
      label(T, 'V < 0 등전위선', w - 10, 31, 'right', T.figBlue);
      if (cs.length > 1) label(T, '점선: V = 0', w - 10, 48, 'right', T.figMuted);
      label(T, '점 P를 끌어 옮겨 보자', 12, 14, 'left', T.figMuted);
      // 읽은 값
      var d = cs.map(function (c) { return Math.hypot(st.p[0] - c.x, st.p[1] - c.y); });
      var inside = d.some(function (r) { return r < 0.05; });
      if (inside) { rE.set('전하에 너무 가까움'); rDir.set('–'); rV.set('–'); return; }
      rE.set(P.e < 50 ? '0 N/C (전기장 없음)' : sci(P.e, 'N/C'));
      rDir.set(P.e < 50 ? '–' : dirName(P.ex, P.ey));
      rV.set(sci(P.v, 'V'));
    }
    function label(T, txt, x, y, align, color, bold) {
      ctx.font = (bold ? '600 ' : '') + (bold ? 12 : 11) + 'px ' + T.fontBody; ctx.textAlign = align; ctx.textBaseline = 'middle';
      var tw = ctx.measureText(txt).width, x0 = align === 'right' ? x - tw : align === 'center' ? x - tw / 2 : x;
      ctx.globalAlpha = 0.88; ctx.fillStyle = T.figPaper; ctx.fillRect(x0 - 3, y - 8, tw + 6, 16); ctx.globalAlpha = 1;
      ctx.fillStyle = color; ctx.fillText(txt, x, y); ctx.textBaseline = 'alphabetic';
    }
    function dirName(ex, ey) {
      var a = Math.atan2(ey, ex) * 180 / Math.PI, names = ['오른쪽', '오른쪽 위', '위', '왼쪽 위', '왼쪽', '왼쪽 아래', '아래', '오른쪽 아래'];
      return names[((Math.round(a / 45) % 8) + 8) % 8] + ' (화살표)';
    }
    function arrow(x, y, ux, uy, len, color, alpha, lw) {
      var x0 = x - ux * len / 2, y0 = y - uy * len / 2, x1 = x + ux * len / 2, y1 = y + uy * len / 2, hs = Math.min(7, len * 0.4) + lw;
      ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw;
      if (lw > 2) { x0 = x; y0 = y; x1 = x + ux * len; y1 = y + uy * len; }
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - ux * hs * 0.6, y1 - uy * hs * 0.6); ctx.stroke();
      var an = Math.atan2(uy, ux);
      ctx.beginPath(); ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - hs * Math.cos(an - 0.45), y1 - hs * Math.sin(an - 0.45));
      ctx.lineTo(x1 - hs * Math.cos(an + 0.45), y1 - hs * Math.sin(an + 0.45)); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // 점 P 끌기
    var dragging = false;
    function setP(e) {
      var r = cv.canvas.getBoundingClientRect(), V = view();
      var px = (e.clientX - r.left) * cv.w / r.width, py = (e.clientY - r.top) * cv.h / r.height;
      st.p = [Math.max(-XR, Math.min(XR, V.ix(px))), V.iy(Math.max(0, Math.min(cv.h, py)))];
      draw();
    }
    cv.canvas.style.touchAction = 'none';   // 점 P를 손가락으로 끌 수 있게
    cv.canvas.addEventListener('pointerdown', function (e) { dragging = true; try { cv.canvas.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ } setP(e); });
    cv.canvas.addEventListener('pointermove', function (e) { if (dragging) setP(e); });
    ['pointerup', 'pointercancel'].forEach(function (ev) { cv.canvas.addEventListener(ev, function () { dragging = false; }); });
    cv.canvas.style.cursor = 'crosshair';
    cv.canvas.tabIndex = 0;
    cv.canvas.addEventListener('keydown', function (e) {
      var d = 0.02, k = e.key;
      if (k === 'ArrowLeft') st.p[0] -= d; else if (k === 'ArrowRight') st.p[0] += d;
      else if (k === 'ArrowUp') st.p[1] += d; else if (k === 'ArrowDown') st.p[1] -= d; else return;
      e.preventDefault(); draw();
    });

    api.onResize(draw);
    draw();
  },
});
