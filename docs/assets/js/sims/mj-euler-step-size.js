/* 수학 도구 4 상미분방정식: 오일러법·개선된 오일러법·RK4의 계단 크기에 따른 오차, 차수, 안정성, 에너지 */
Sims.register('mj-euler-step-size', {
  title: '계단 크기와 수치 해 — 오차의 차수와 안정성',
  caption: '방정식과 방법을 고르고 계단 크기 h를 바꾸어 보자. 왼쪽은 정확한 해(실선)와 수치 해(점), 오른쪽 위는 h에 따른 최대 오차의 로그–로그 그래프이다. 곡선의 기울기가 방법의 차수(오일러 1, 개선된 오일러 2, RK4 4)이며, 현재 h는 주황 점이다. 1차 붕괴에서 오일러법은 hk > 1이면 부호가 바뀌는 가짜 진동이, hk > 2이면 발산이 나타나고, 연속 반응에서는 더 빠른 k₂가 h를 제한한다. 진동자(ω = k₁)에서는 오른쪽 아래의 에너지가 오일러법에서 계단마다 (1 + h²ω²)배로 늘어난다. 시간과 속도 상수의 단위는 서로 맞춘 임의 단위이고, 최대 오차는 그림에 그린 시간 구간의 계단점에서 잰다.',
  init: function (api) {
    var st = { eq: 0, meth: 0, s: Math.log10(0.25), k1: 1.0, k2: 4.0 };
    var EQ = ['1차 붕괴 y′ = −ky', '연속 반응 A → B → C', '진동자 ẍ = −ω²x'];
    var ME = ['오일러', '개선된 오일러', 'RK4'];
    var TEND = [6, 8, 20];
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.6 : 0.56; }, label: '정확한 해와 수치 해, 오차와 계단 크기의 로그 그래프, 에너지 또는 오차의 시간 변화' });
    var ctx = cv.ctx;
    var rErr = api.readout('최대 오차');
    var rHK = api.readout('h × 속도 상수');
    var rN = api.readout('계단 수');

    var g1 = api.group(), eqB = [];
    EQ.forEach(function (n, i) { eqB.push(api.button(n, function () { st.eq = i; sync(); }, { toggle: true, pressed: i === 0, parent: g1 })); });
    var g2 = api.group(), meB = [];
    ME.forEach(function (n, i) { meB.push(api.button(n, function () { st.meth = i; sync(); }, { toggle: true, pressed: i === 0, parent: g2 })); });
    api.slider({ id: 'mj-euler-step-size-h', label: '계단 크기 h', min: -2, max: Math.log10(2.5), step: 0.01, value: st.s,
      format: function (v) { var h = Math.pow(10, v); return h < 0.1 ? h.toFixed(3) : h.toFixed(2); }, onInput: function (v) { st.s = v; draw(); } });
    api.slider({ id: 'mj-euler-step-size-k1', label: 'k₁ (붕괴의 k, 진동자의 ω)', min: 0.2, max: 3, step: 0.1, value: st.k1,
      format: function (v) { return v.toFixed(1); }, onInput: function (v) { st.k1 = v; draw(); } });
    api.slider({ id: 'mj-euler-step-size-k2', label: 'k₂ (연속 반응)', min: 0.2, max: 10, step: 0.1, value: st.k2,
      format: function (v) { return v.toFixed(1); }, onInput: function (v) { st.k2 = v; draw(); } });
    function sync() {
      eqB.forEach(function (b, i) { b.setAttribute('aria-pressed', i === st.eq ? 'true' : 'false'); });
      meB.forEach(function (b, i) { b.setAttribute('aria-pressed', i === st.meth ? 'true' : 'false'); });
      draw();
    }

    function rhs(eq, y) {
      var k1 = st.k1, k2 = st.k2;
      if (eq === 0) return [-k1 * y[0]];
      if (eq === 1) return [-k1 * y[0], k1 * y[0] - k2 * y[1], k2 * y[1]];
      return [y[1], -k1 * k1 * y[0]];
    }
    function y0(eq) { return eq === 0 ? [1] : eq === 1 ? [1, 0, 0] : [1, 0]; }
    function exact(eq, t) {
      var k1 = st.k1, k2 = st.k2;
      if (eq === 0) return [Math.exp(-k1 * t)];
      if (eq === 1) {
        var a = Math.exp(-k1 * t), b = Math.abs(k2 - k1) < 1e-9 ? k1 * t * Math.exp(-k1 * t) : k1 / (k2 - k1) * (Math.exp(-k1 * t) - Math.exp(-k2 * t));
        return [a, b, 1 - a - b];
      }
      return [Math.cos(k1 * t), -k1 * Math.sin(k1 * t)];
    }
    function add(y, d, h) { return y.map(function (v, i) { return v + h * d[i]; }); }
    function step(eq, m, y, h) {
      var f1 = rhs(eq, y);
      if (m === 0) return add(y, f1, h);
      if (m === 1) { var f2 = rhs(eq, add(y, f1, h)); return y.map(function (v, i) { return v + h / 2 * (f1[i] + f2[i]); }); }
      var a = rhs(eq, add(y, f1, h / 2)), b = rhs(eq, add(y, a, h / 2)), c = rhs(eq, add(y, b, h));
      return y.map(function (v, i) { return v + h / 6 * (f1[i] + 2 * a[i] + 2 * b[i] + c[i]); });
    }
    function solve(eq, m, h) {
      var T = TEND[eq], n = Math.max(1, Math.round(T / h)), y = y0(eq), out = [[0, y]];
      for (var i = 1; i <= n && i <= 4000; i++) { y = step(eq, m, y, h); out.push([i * h, y]); if (!isFinite(y[0]) || Math.abs(y[0]) > 1e8) break; }
      return out;
    }
    function comp(eq) { return eq === 1 ? 1 : 0; }   // 오차를 재는 성분: 연속 반응은 [B], 나머지는 y 또는 x
    function maxErr(eq, sol) {
      var e = 0, c = comp(eq);
      sol.forEach(function (p) { if (p[0] <= TEND[eq] + 1e-9) e = Math.max(e, Math.abs(p[1][c] - exact(eq, p[0])[c])); });
      return e;
    }

    var cache = {};
    function errCurve(eq, mm) {
      var key = eq + '|' + mm + '|' + st.k1 + '|' + (eq === 1 ? st.k2 : '');
      if (cache[key]) return cache[key];
      var out = [];
      for (var s = -2; s <= Math.log10(2.5) + 1e-9; s += 0.04) out.push([s, maxErr(eq, solve(eq, mm, Math.pow(10, s)))]);
      return (cache[key] = out);
    }
    function draw() {
      var T = api.tokens(), W = cv.w, H = cv.h, narrow = W < 560;
      ctx.clearRect(0, 0, W, H);
      var eq = st.eq, m = st.meth, h = Math.pow(10, st.s), sol = solve(eq, m, h), err = maxErr(eq, sol);
      var kmax = eq === 1 ? Math.max(st.k1, st.k2) : st.k1;
      rErr.set(isFinite(err) && err < 1e6 ? err.toExponential(2).replace('-', '−') : '발산');
      rHK.set(eq === 0 ? 'hk = ' + (h * st.k1).toFixed(2) : eq === 1 ? 'hk₁ = ' + (h * st.k1).toFixed(2) + ', hk₂ = ' + (h * st.k2).toFixed(2) : 'hω = ' + (h * st.k1).toFixed(2));
      rN.set(String(sol.length - 1));
      var A, B, C;
      if (narrow) { A = { x: 0, y: 0, w: W, h: H * 0.44 }; B = { x: 0, y: H * 0.46, w: W * 0.5, h: H * 0.54 }; C = { x: W * 0.5, y: H * 0.46, w: W * 0.5, h: H * 0.54 }; }
      else { A = { x: 0, y: 0, w: W * 0.56, h: H }; B = { x: W * 0.58, y: 0, w: W * 0.42, h: H * 0.5 }; C = { x: W * 0.58, y: H * 0.5, w: W * 0.42, h: H * 0.5 }; }

      // ── 해 그래프
      var TE = TEND[eq];
      var lo = eq === 2 ? -1.6 : -0.6, hi = eq === 2 ? 1.6 : 1.1;
      var P = panel(A, EQ[eq] + ' — ' + ME[m] + ', h = ' + (h < 0.1 ? h.toFixed(3) : h.toFixed(2)), 0, TE, lo, hi, false, false, 't');
      var cols = eq === 1 ? [T.figBlue, T.figRed, T.figGreen] : [T.figBlue];
      var ncomp = eq === 1 ? 3 : 1;
      for (var c = 0; c < ncomp; c++) {
        ctx.strokeStyle = cols[c]; ctx.lineWidth = c === 1 || eq !== 1 ? 2.4 : 1.6; ctx.globalAlpha = (eq === 1 && c !== 1) ? 0.55 : 1;
        ctx.beginPath();
        for (var i = 0; i <= 400; i++) { var t = TE * i / 400, v = exact(eq, t)[c]; if (i === 0) ctx.moveTo(P.X(t), P.Y(v)); else ctx.lineTo(P.X(t), P.Y(v)); }
        ctx.stroke(); ctx.globalAlpha = 1;
      }
      ctx.save(); ctx.beginPath(); ctx.rect(P.l, P.t - 4, P.r - P.l, P.b - P.t + 8); ctx.clip();
      for (c = 0; c < ncomp; c++) {
        var col = eq === 1 ? cols[c] : T.figRed;
        ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]); ctx.globalAlpha = (eq === 1 && c !== 1) ? 0.55 : 1;
        ctx.beginPath();
        sol.forEach(function (p, i) { var X = P.X(p[0]), Y = P.Y(clamp(p[1][c])); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); });
        ctx.stroke(); ctx.setLineDash([]);
        if (sol.length <= 160) sol.forEach(function (p) {
          ctx.beginPath(); ctx.arc(P.X(p[0]), P.Y(clamp(p[1][c])), 3.2, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      var leg = eq === 1 ? [['[A]', T.figBlue], ['[B] (오차를 재는 성분)', T.figRed], ['[C]', T.figGreen]] : [[eq === 2 ? 'x(t)' : 'y(t)', T.figBlue], ['수치 해', T.figRed]];
      leg.forEach(function (it, k) { ctx.fillStyle = it[1]; ctx.fillText(it[0], P.l + 8 + (narrow ? 0 : 0), P.t + 14 + k * 15); });
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      ctx.fillText('실선: 정확한 해, 점: 수치 해', P.r - 4, P.b - 6);
      var unstable = m === 0 && (eq !== 2) && h * kmax > 2;
      if (unstable) { ctx.fillStyle = T.figRed; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText('h × k > 2: 부호가 바뀌며 발산', P.r - 4, P.t + 14); }

      // ── 오차–h 로그 그래프
      var Q = panel(B, '최대 오차와 h (로그–로그)', -2, Math.log10(2.5), -12, 2, true, true, 'h');
      for (var mm = 0; mm < 3; mm++) {
        ctx.strokeStyle = [T.figRed, T.figViolet, T.figTeal][mm]; ctx.lineWidth = mm === m ? 2.6 : 1.2; ctx.globalAlpha = mm === m ? 1 : 0.5;
        ctx.beginPath();
        errCurve(eq, mm).forEach(function (p, i) {
          var ly = Math.log10(Math.max(Math.min(isFinite(p[1]) ? p[1] : 1e2, 1e2), 1e-12));
          if (i === 0) ctx.moveTo(Q.X(p[0]), Q.Y(ly)); else ctx.lineTo(Q.X(p[0]), Q.Y(ly));
        });
        ctx.stroke(); ctx.globalAlpha = 1;
      }
      var ce = Math.log10(Math.max(Math.min(isFinite(err) ? err : 1e2, 1e2), 1e-12));
      ctx.save(); ctx.beginPath(); ctx.rect(Q.l, Q.t - 6, Q.r - Q.l, Q.b - Q.t + 12); ctx.clip();
      ctx.beginPath(); ctx.arc(Q.X(st.s), Q.Y(ce), 5.5, 0, Math.PI * 2); ctx.fillStyle = T.figAmber; ctx.fill(); ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.restore();
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      [['오일러(기울기 1)', T.figRed], ['개선된 오일러(2)', T.figViolet], ['RK4(4)', T.figTeal]].forEach(function (it, k) {
        ctx.fillStyle = it[1]; ctx.fillText(it[0], Q.l + 6, Q.t + 12 + k * 13);
      });

      // ── 에너지 또는 오차의 시간 변화
      if (eq === 2) {
        var emax = 1;
        var en = sol.map(function (p) { var e2 = (p[1][1] * p[1][1] + st.k1 * st.k1 * p[1][0] * p[1][0]) / (st.k1 * st.k1); emax = Math.max(emax, e2); return [p[0], e2]; });
        emax = Math.min(emax, 1e6);
        var R = panel(C, '에너지 E / E₀', 0, TE, 0, Math.max(2, emax * 1.1), false, false, 't');
        ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(R.l, R.Y(1)); ctx.lineTo(R.r, R.Y(1)); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = T.figRed; ctx.lineWidth = 2; ctx.beginPath();
        en.forEach(function (p, i) { var X = R.X(p[0]), Y = R.Y(Math.min(p[1], emax * 1.1)); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); });
        ctx.stroke();
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
        ctx.fillText('점선: 정확한 해(E = E₀)', R.r - 4, R.Y(1) - 5);
      } else {
        var c2 = comp(eq), ers = sol.map(function (p) { return [p[0], p[1][c2] - exact(eq, p[0])[c2]]; });
        var am = 1e-6; ers.forEach(function (p) { if (isFinite(p[1])) am = Math.max(am, Math.abs(p[1])); });
        am = Math.min(am, 1e6) * 1.15;
        var R2 = panel(C, '수치 해 − 정확한 해' + (eq === 1 ? ' ([B])' : ''), 0, TE, -am, am, false, false, 't', true);
        ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.8; ctx.beginPath();
        ers.forEach(function (p, i) { var X = R2.X(p[0]), Y = R2.Y(Math.max(-am, Math.min(am, p[1]))); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); });
        ctx.stroke();
      }

      function clamp(v) { return isFinite(v) ? Math.max(lo - 1, Math.min(hi + 1, v)) : hi + 1; }
      function panel(b, title, x0, x1, ya, yb, logx, logy, xl, symm) {
        var l = b.x + 46, r = b.x + b.w - 10, t = b.y + 26, bt = b.y + b.h - 30;
        var o = { l: l, r: r, t: t, b: bt,
          X: function (v) { return l + (v - x0) / (x1 - x0) * (r - l); },
          Y: function (v) { return bt - (v - ya) / (yb - ya) * (bt - t); } };
        ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(title, b.x + 6, b.y + 13);
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(l, t); ctx.lineTo(l, bt); ctx.lineTo(r, bt); ctx.stroke();
        ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
        var yt = [];
        if (logy) yt = [-12, -9, -6, -3, 0];
        else if (symm) yt = [-yb, 0, yb];
        else { var tk = nice((yb - ya) / 4); for (var v = Math.ceil(ya / tk) * tk; v <= yb + 1e-9; v += tk) yt.push(v); }
        yt.forEach(function (v) {
          ctx.textAlign = 'right';
          ctx.fillText(logy ? '10' + sup(v) : num(v), l - 4, o.Y(v) + 4);
          ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(l, o.Y(v)); ctx.lineTo(r, o.Y(v)); ctx.stroke();
        });
        ctx.textAlign = 'center';
        var xt = [];
        if (logx) xt = [-2, -1, 0];
        else { var tx2 = nice((x1 - x0) / 4); for (var u = x0; u <= x1 + 1e-9; u += tx2) xt.push(u); }
        xt.forEach(function (u) { ctx.fillText(logx ? (u === -2 ? '0.01' : u === -1 ? '0.1' : '1') : num(u), o.X(u), bt + 14); });
        ctx.font = '11px ' + T.fontBody; ctx.fillText(xl, (l + r) / 2, bt + 26);
        return o;
      }
    }
    function nice(x) { var p = Math.pow(10, Math.floor(Math.log10(x))), n = x / p; return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p; }
    function num(v) {
      var a = Math.abs(v), s = a === 0 ? '0' : a >= 100 ? a.toFixed(0) : a >= 1 ? (+a.toFixed(2)).toString() : a >= 0.01 ? (+a.toFixed(3)).toString() : a.toExponential(0);
      return (v < 0 ? '−' : '') + s;
    }
    function sup(v) { var m = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '6': '⁶', '9': '⁹' }; return String(v).split('').map(function (c) { return m[c] || c; }).join(''); }
    api.onResize(draw);
    if (api.onTheme) api.onTheme(draw);
    draw();
  },
});
