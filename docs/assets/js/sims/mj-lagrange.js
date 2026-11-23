/* 수학 도구 1 미분과 편미분: 라그랑주 승수법 탐색기 — 제약 곡선 위에서 ∇f와 ∇g가 평행해지는 점 */
Sims.register('mj-lagrange', {
  title: '라그랑주 승수 탐색기 — 등고선이 제약 곡선에 접하는 점 찾기',
  caption: '제약 곡선(초록) 위의 점을 끌거나 "점의 위치" 슬라이더로 움직이며 ∇f(파랑)와 ∇g(초록)의 방향을 비교해 보자. 두 벡터가 평행해지는 점(빈 동그라미)이 극값 후보이고, 그때 ∇f = λ∇g의 λ가 표시된다. c를 바꾸면 오른쪽 그래프에 제약 곡선 위의 최솟값 f*(c)가 그려지고, 현재 c에서의 접선 기울기가 최솟점의 λ와 같다(λ = df*/dc). 화살표는 방향만 보이도록 일정한 길이로 그렸다(∇g는 겹쳐도 보이게 더 짧게). 원 제약은 g = √(x² + y²) = c(반지름 c)로 두어 λ가 c에 대한 변화율이 되게 했다.',
  init: function (api) {
    var FN = {
      ell: { name: 'f = x² + 2y²', f: function (x, y) { return x * x + 2 * y * y; }, gx: function (x, y) { return 2 * x; }, gy: function (x, y) { return 4 * y; }, levels: [0.5, 1, 2, 3, 4, 6] },
      pes: { name: '예제 15의 V(x, y)', f: function (x, y) { var u = x * x - 1, v = y - x / 2; return u * u + v * v; },
        gx: function (x, y) { return 4 * x * (x * x - 1) - (y - x / 2); }, gy: function (x, y) { return 2 * (y - x / 2); }, levels: [0.1, 0.3, 0.6, 1, 1.5, 2.5, 4] },
    };
    var CON = {
      line: { name: '직선 x + y = c', c: [-3, 3, 0.05, 1.7], u: [-3.2, 3.2],
        p: function (c, u) { return [c / 2 + u / Math.SQRT2, c / 2 - u / Math.SQRT2]; }, grad: function () { return [1, 1]; },
        near: function (c, x, y) { return (x - y) / Math.SQRT2; } },
      circle: { name: '원 √(x² + y²) = c', c: [0.3, 2.2, 0.05, 1.2], u: [-Math.PI, Math.PI],
        p: function (c, u) { return [c * Math.cos(u), c * Math.sin(u)]; }, grad: function (x, y) { var r = Math.hypot(x, y) || 1; return [x / r, y / r]; },
        near: function (c, x, y) { return Math.atan2(y, x); } },
    };
    var st = { fn: 'ell', con: 'line', c: 1.7, u: 0.9 };
    var X0 = -2.4, X1 = 2.4, Y0 = -1.8, Y1 = 1.8;
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.52; }, label: '등고선, 제약 곡선, 기울기 벡터와 최적값 그래프' });
    var ctx = cv.ctx;
    var rF = api.readout('f 값'), rAng = api.readout('∇f와 ∇g 사이 각'), rLam = api.readout('판정'), rFs = api.readout('f*(c), df*/dc');

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) { var ph = Math.min(w * 0.75, h * 0.6); return { plane: { x: 8, y: 8, w: w - 16, h: ph }, graph: { x: 0, y: ph + 20, w: w, h: h - ph - 20 } }; }
      var pw = Math.min(w * 0.6, (h - 16) * 4 / 3);
      return { plane: { x: 8, y: 8, w: pw, h: pw * 0.75 }, graph: { x: pw + 30, y: 0, w: w - pw - 30, h: h } };
    }
    function grads(x, y) { var F = FN[st.fn], C = CON[st.con]; return { f: [F.gx(x, y), F.gy(x, y)], g: C.grad(x, y) }; }
    function cross(u) { var C = CON[st.con], p = C.p(st.c, u), G = grads(p[0], p[1]); return G.f[0] * G.g[1] - G.f[1] * G.g[0]; }
    function urange() { return CON[st.con].u; }
    function inView(p) { return p[0] >= X0 && p[0] <= X1 && p[1] >= Y0 && p[1] <= Y1; }
    // 제약 곡선 위의 임계점(∇f ∥ ∇g)을 찾는다
    function candidates(c) {
      var save = st.c; st.c = c;
      var C = CON[st.con], ur = urange(), n = 400, out = [], prev = cross(ur[0]), pu = ur[0];
      for (var i = 1; i <= n; i++) {
        var u = ur[0] + (ur[1] - ur[0]) * i / n, cu = cross(u);
        if (prev === 0 || prev * cu < 0) {
          var a = pu, b = u, fa = prev;
          for (var k = 0; k < 40; k++) { var m = (a + b) / 2, fm = cross(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } }
          var um = (a + b) / 2, p = C.p(c, um), G = grads(p[0], p[1]);
          var lam = (G.f[0] * G.g[0] + G.f[1] * G.g[1]) / (G.g[0] * G.g[0] + G.g[1] * G.g[1]);
          if (!out.some(function (o) { return Math.abs(o.u - um) < 1e-3; })) out.push({ u: um, x: p[0], y: p[1], f: FN[st.fn].f(p[0], p[1]), lam: lam });
        }
        prev = cu; pu = u;
      }
      st.c = save; return out;
    }
    function fstar(c) { var cs = candidates(c), best = null; cs.forEach(function (o) { if (!best || o.f < best.f) best = o; }); return best; }

    function draw() {
      var T = api.tokens(), L = layout(), P = L.plane;
      ctx.clearRect(0, 0, cv.w, cv.h);
      var sx = function (x) { return P.x + (x - X0) / (X1 - X0) * P.w; }, sy = function (y) { return P.y + (Y1 - y) / (Y1 - Y0) * P.h; };
      ctx.fillStyle = T.figPanel; ctx.fillRect(P.x, P.y, P.w, P.h); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(P.x, P.y, P.w, P.h);
      ctx.save(); ctx.beginPath(); ctx.rect(P.x, P.y, P.w, P.h); ctx.clip();
      // 축
      ctx.strokeStyle = T.figLine; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(sx(X0), sy(0)); ctx.lineTo(sx(X1), sy(0)); ctx.moveTo(sx(0), sy(Y0)); ctx.lineTo(sx(0), sy(Y1)); ctx.stroke(); ctx.setLineDash([]);
      // 등고선(해석적으로)
      var F = FN[st.fn];
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      F.levels.forEach(function (lv) {
        ctx.strokeStyle = T.figBlue; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.3;
        loops(st.fn, lv).forEach(function (pts) { ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(sx(p[0]), sy(p[1])); else ctx.moveTo(sx(p[0]), sy(p[1])); }); ctx.closePath(); ctx.stroke(); });
        ctx.globalAlpha = 1;
        var lp = st.fn === 'ell' ? [Math.sqrt(lv), 0] : (lv < 1 ? [1, 0.5 + Math.sqrt(lv)] : [0, Math.sqrt(lv - 1)]);
        if (inView(lp)) { ctx.fillStyle = T.figMuted; ctx.fillText(String(lv), sx(lp[0]) + 3, sy(lp[1]) - 3); }
      });
      // 제약 곡선
      var C = CON[st.con], ur = urange();
      ctx.strokeStyle = T.figGreen; ctx.lineWidth = 3; ctx.beginPath();
      for (var i = 0; i <= 200; i++) { var q = C.p(st.c, ur[0] + (ur[1] - ur[0]) * i / 200); if (i) ctx.lineTo(sx(q[0]), sy(q[1])); else ctx.moveTo(sx(q[0]), sy(q[1])); }
      ctx.stroke();
      // 후보점
      var cands = candidates(st.c);
      cands.forEach(function (o) { if (!inView([o.x, o.y])) return; ctx.beginPath(); ctx.arc(sx(o.x), sy(o.y), 7, 0, Math.PI * 2); ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.6; ctx.stroke(); });
      // 현재 점과 벡터
      var p = C.p(st.c, st.u), G = grads(p[0], p[1]);
      var len = Math.min(P.w, P.h) * 0.16;
      function arrow(v, col, k) {
        var m = Math.hypot(v[0], v[1]); if (m < 1e-9) return;
        var ex = sx(p[0]) + v[0] / m * len * k, ey = sy(p[1]) - v[1] / m * len * k, a = Math.atan2(ey - sy(p[1]), ex - sx(p[0]));
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(sx(p[0]), sy(p[1])); ctx.lineTo(ex - 6 * Math.cos(a), ey - 6 * Math.sin(a)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 11 * Math.cos(a - 0.4), ey - 11 * Math.sin(a - 0.4)); ctx.lineTo(ex - 11 * Math.cos(a + 0.4), ey - 11 * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
      }
      arrow(G.f, T.figBlue, 1); arrow(G.g, T.figGreen, 0.6);
      ctx.beginPath(); ctx.arc(sx(p[0]), sy(p[1]), 5.5, 0, Math.PI * 2); ctx.fillStyle = T.figInk; ctx.fill();
      ctx.restore();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figBlue; ctx.fillText('∇f', P.x + 8, P.y + 18); ctx.fillStyle = T.figGreen; ctx.fillText('∇g', P.x + 34, P.y + 18);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.fillText(F.name + ',  ' + C.name.replace('c', 'c = ' + st.c.toFixed(2)), P.x + 64, P.y + 18);
      // 읽기 값
      var fv = F.f(p[0], p[1]);
      var mf = Math.hypot(G.f[0], G.f[1]), mg = Math.hypot(G.g[0], G.g[1]);
      var ang = mf < 1e-9 ? 0 : Math.acos(Math.max(-1, Math.min(1, (G.f[0] * G.g[0] + G.f[1] * G.g[1]) / (mf * mg)))) * 180 / Math.PI;
      rF.set(fv.toFixed(3) + '  (x = ' + fmt(p[0]) + ', y = ' + fmt(p[1]) + ')');
      rAng.set(ang.toFixed(1) + '°');
      var near = null; cands.forEach(function (o) { if (Math.hypot(o.x - p[0], o.y - p[1]) < 0.06) near = o; });
      if (near) rLam.set('극값 후보, λ = ' + fmt(near.lam)); else rLam.set(ang < 3 || ang > 177 ? '거의 평행' : '평행하지 않음 → 곡선을 따라 f를 바꿀 수 있다');
      drawGraph(T, L.graph);
    }
    function fmt(v) { return v.toFixed(3).replace('-', '−'); }
    function drawGraph(T, r) {
      var C = CON[st.con], cr = C.c, n = 80, xs = [], ys = [];
      for (var i = 0; i <= n; i++) { var c = cr[0] + (cr[1] - cr[0]) * i / n, b = fstar(c); if (b) { xs.push(c); ys.push(b.f); } }
      if (!ys.length) return;
      var ymin = Math.min.apply(null, ys), ymax = Math.max.apply(null, ys); if (ymax - ymin < 1e-6) ymax = ymin + 1;
      ymin = Math.min(0, ymin); ymax = ymax * 1.05;
      var Lx = r.x + 46, Rx = r.x + r.w - 12, Ty = r.y + 30, By = r.y + r.h - 40;
      var gx = function (c) { return Lx + (c - cr[0]) / (cr[1] - cr[0]) * (Rx - Lx); }, gy = function (v) { return By - (v - ymin) / (ymax - ymin) * (By - Ty); };
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(Lx, Ty); ctx.lineTo(Lx, By); ctx.lineTo(Rx, By); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      [cr[0], (cr[0] + cr[1]) / 2, cr[1]].forEach(function (c) { ctx.fillText(c.toFixed(1).replace('-', '−'), gx(c), By + 14); });
      ctx.textAlign = 'right'; [ymin, (ymin + ymax) / 2, ymax].forEach(function (v) { ctx.fillText(v.toFixed(1), Lx - 5, gy(v) + 4); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('제약값 c', (Lx + Rx) / 2, By + 30); ctx.fillText('최솟값 f*(c)', (Lx + Rx) / 2, r.y + 16);
      ctx.strokeStyle = T.figViolet; ctx.lineWidth = 2.4; ctx.beginPath();
      xs.forEach(function (c, i) { if (i) ctx.lineTo(gx(c), gy(ys[i])); else ctx.moveTo(gx(c), gy(ys[i])); }); ctx.stroke();
      var b = fstar(st.c);
      if (b) {
        var dc = (cr[1] - cr[0]) * 0.18;
        ctx.save(); ctx.beginPath(); ctx.rect(Lx, Ty - 10, Rx - Lx, By - Ty + 10); ctx.clip();
        ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.8; ctx.setLineDash([5, 4]); ctx.beginPath();
        ctx.moveTo(gx(st.c - dc), gy(b.f - b.lam * dc)); ctx.lineTo(gx(st.c + dc), gy(b.f + b.lam * dc)); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        ctx.beginPath(); ctx.arc(gx(st.c), gy(b.f), 5, 0, Math.PI * 2); ctx.fillStyle = T.figRed; ctx.fill();
        ctx.fillStyle = T.figRed; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('접선 기울기 = λ', Math.min(gx(st.c) + 8, Rx - 96), Math.max(gy(b.f) - 10, Ty + 4));
        rFs.set(b.f.toFixed(3) + ',  λ = ' + fmt(b.lam));
      } else rFs.set('–');
    }
    // 등고선 점 목록
    function loops(fn, c) {
      var out = [], i, n = 160;
      if (fn === 'ell') { var a = []; for (i = 0; i < n; i++) { var t = 2 * Math.PI * i / n; a.push([Math.sqrt(c) * Math.cos(t), Math.sqrt(c / 2) * Math.sin(t)]); } return [a]; }
      var s = Math.sqrt(c), ivs = c >= 1 ? [[-Math.sqrt(1 + s), Math.sqrt(1 + s)]] : [[Math.sqrt(1 - s), Math.sqrt(1 + s)], [-Math.sqrt(1 + s), -Math.sqrt(1 - s)]];
      ivs.forEach(function (iv) {
        var m = (iv[0] + iv[1]) / 2, hw = (iv[1] - iv[0]) / 2, pts = [];
        for (i = 0; i < n; i++) { var th = 2 * Math.PI * i / n, x = m + hw * Math.cos(th), r = Math.sqrt(Math.max(0, c - (x * x - 1) * (x * x - 1))); pts.push([x, x / 2 + (Math.sin(th) >= 0 ? r : -r)]); }
        out.push(pts);
      });
      return out;
    }

    // 끌기
    var dragging = false;
    function toWorld(e) {
      var rc = cv.canvas.getBoundingClientRect(), P = layout().plane, px = e.clientX - rc.left, py = e.clientY - rc.top;
      if (px < P.x || px > P.x + P.w || py < P.y || py > P.y + P.h) return null;
      return [X0 + (px - P.x) / P.w * (X1 - X0), Y1 - (py - P.y) / P.h * (Y1 - Y0)];
    }
    function moveTo(e) { var w = toWorld(e); if (!w) return; var ur = urange(); var u = CON[st.con].near(st.c, w[0], w[1]); sU.set(Math.max(0, Math.min(1, (u - ur[0]) / (ur[1] - ur[0])))); }
    cv.canvas.style.touchAction = 'none';
    cv.canvas.addEventListener('pointerdown', function (e) { if (toWorld(e)) { dragging = true; try { cv.canvas.setPointerCapture(e.pointerId); } catch (er) { /* 무시 */ } moveTo(e); } });
    cv.canvas.addEventListener('pointermove', function (e) { if (dragging) moveTo(e); });
    ['pointerup', 'pointercancel'].forEach(function (ev) { cv.canvas.addEventListener(ev, function () { dragging = false; }); });

    var g1 = api.group();
    var bf = [api.button('f = x² + 2y²', function () { setFn('ell'); }, { toggle: true, pressed: true, parent: g1 }),
      api.button('예제 15의 퍼텐셜', function () { setFn('pes'); }, { toggle: true, parent: g1 })];
    var g2 = api.group();
    var bc = [api.button('직선 x + y = c', function () { setCon('line'); }, { toggle: true, pressed: true, parent: g2 }),
      api.button('원 (반지름 c)', function () { setCon('circle'); }, { toggle: true, parent: g2 })];
    var sU = api.slider({ id: 'mj-lagrange-u', label: '점의 위치', min: 0, max: 1, step: 0.002, value: 0.64, format: function (v) { return Math.round(v * 100) + ' %'; },
      onInput: function (v) { var ur = urange(); st.u = ur[0] + (ur[1] - ur[0]) * v; draw(); } });
    var sC = api.slider({ id: 'mj-lagrange-c', label: '제약값 c', min: -3, max: 3, step: 0.05, value: 1.7, format: function (v) { return v.toFixed(2).replace('-', '−'); },
      onInput: function (v) { st.c = v; draw(); } });
    api.button('최솟점으로 보내기', function () { var b = fstar(st.c); if (!b) return; var ur = urange(); sU.set((b.u - ur[0]) / (ur[1] - ur[0])); }, { primary: true });
    function setFn(k) { st.fn = k; bf.forEach(function (b, i) { b.setAttribute('aria-pressed', ['ell', 'pes'][i] === k ? 'true' : 'false'); }); draw(); }
    function setCon(k) {
      st.con = k; var C = CON[k];
      bc.forEach(function (b, i) { b.setAttribute('aria-pressed', ['line', 'circle'][i] === k ? 'true' : 'false'); });
      sC.input.min = C.c[0]; sC.input.max = C.c[1]; sC.input.step = C.c[2]; sC.set(C.c[3]); sU.set(sU.value);
    }
    api.onResize(draw);
    sU.set(0.64);
  },
});
