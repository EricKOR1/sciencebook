/* 물리화학 12 반응 속도론: 연속 반응 A → I → P의 정확한 해와 정류 상태 근사 — 근사의 오차와 k₂/k₁ 비 */
Sims.register('mj-consecutive-steady-state', {
  title: '정류 상태 근사는 언제 맞을까? — 연속 반응의 정확한 해와 근사',
  caption: 'k₁과 k₂를 바꾸어 보자. 첫 그래프는 정확한 해 [A], [I], [P](실선)와 정류 상태 근사 [P]ss = [A]₀(1 − e^(−k₁t)), [I]ss = k₁[A]/k₂(점선)이고, 둘째 그래프는 [I]만 크게 본 것이다. ' +
    '셋째 그래프는 t = 1/k₁에서 [P] 근사의 상대 오차를 k₂/k₁에 대해 그린 로그–로그 그래프로, 현재 값이 주황 점이다. k₂/k₁이 클수록 오차는 약 0.58k₁/k₂로 줄고(회색 점선), ' +
    'k₂/k₁이 1 근처나 그보다 작으면 근사가 크게 틀린다. 두 단계 모두 1차이고 처음에는 A만 [A]₀ = 1 있다고 두었다.',
  init: function (api) {
    var st = { l1: 0, l2: 1, lm: Math.log10(5) };
    var cv = api.canvas({ aspect: function (w) { return w < 640 ? 2.1 : 0.4; }, label: '농도–시간 곡선, 중간체 확대 그래프, 근사 오차와 속도 상수 비의 그래프' });
    var ctx = cv.ctx;
    var rR = api.readout('k₂/k₁'), rE = api.readout('t = 1/k₁에서 [P] 오차'), rT = api.readout('t_max, [I]_max');
    function fk(v) { var k = Math.pow(10, v); return (k < 0.1 ? k.toFixed(3) : k < 1 ? k.toFixed(2) : k.toFixed(1)) + ' s⁻¹'; }
    api.slider({ id: 'mj-consecutive-steady-state-k1', label: 'k₁', min: -2, max: 1, step: 0.02, value: st.l1, format: fk, onInput: function (v) { st.l1 = v; draw(); } });
    api.slider({ id: 'mj-consecutive-steady-state-k2', label: 'k₂', min: -2, max: 1, step: 0.02, value: st.l2, format: fk, onInput: function (v) { st.l2 = v; draw(); } });
    api.slider({ id: 'mj-consecutive-steady-state-t', label: '시간 범위', min: 0, max: 2, step: 0.02, value: st.lm,
      format: function (v) { return '0 ~ ' + Math.pow(10, v).toFixed(Math.pow(10, v) < 10 ? 1 : 0) + '/k₁'; }, onInput: function (v) { st.lm = v; draw(); } });

    function sol(k1, k2, t) {
      var a = Math.exp(-k1 * t), i;
      if (Math.abs(k2 - k1) < 1e-9 * k1) i = k1 * t * a;
      else i = k1 / (k2 - k1) * (a - Math.exp(-k2 * t));
      return { a: a, i: i, p: Math.max(0, 1 - a - i) };
    }
    function perr(r) {   // k₁t = 1, r = k₂/k₁ 에서 [P] 근사의 상대 오차
      var pe = sol(1, r, 1).p, ps = 1 - Math.exp(-1);
      return (ps - pe) / pe;
    }
    function fmtN(v) {
      if (v === 0) return '0';
      var a = Math.abs(v);
      if (a >= 1000 || a < 0.01) { var e = Math.floor(Math.log10(a)), m = v / Math.pow(10, e); return m.toFixed(2) + '×10' + sup(e); }
      return v.toPrecision(3);
    }
    function sup(e) { var m = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }; return String(e).split('').map(function (c) { return m[c]; }).join(''); }
    function niceStep(span) { var raw = span / 4, m = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / m; return (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * m; }

    function frame(T, r, xr, yr, o) {
      var L = r.x + 54, R = r.x + r.w - 10, Tp = r.y + 26, B = r.y + r.h - 38;
      var sx = o.xlog ? function (x) { return L + (Math.log10(x) - Math.log10(xr[0])) / (Math.log10(xr[1]) - Math.log10(xr[0])) * (R - L); } : function (x) { return L + (x - xr[0]) / (xr[1] - xr[0]) * (R - L); };
      var sy = o.ylog ? function (y) { return B - (Math.log10(y) - Math.log10(yr[0])) / (Math.log10(yr[1]) - Math.log10(yr[0])) * (B - Tp); } : function (y) { return B - (y - yr[0]) / (yr[1] - yr[0]) * (B - Tp); };
      ctx.fillStyle = T.figPanel; ctx.fillRect(L, Tp, R - L, B - Tp);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, Tp, R - L, B - Tp);
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      (o.xt || []).forEach(function (q) { ctx.textAlign = 'center'; ctx.fillText(q[1], sx(q[0]), B + 14); grid(sx(q[0]), Tp, sx(q[0]), B); });
      (o.yt || []).forEach(function (q) { ctx.textAlign = 'right'; ctx.fillStyle = T.figMuted; ctx.fillText(q[1], L - 5, sy(q[0]) + 4); grid(L, sy(q[0]), R, sy(q[0])); });
      function grid(x1, y1, x2, y2) { ctx.save(); ctx.strokeStyle = T.figLine; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(o.xlab, (L + R) / 2, B + 31);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(o.ylab, 0, 0); ctx.restore();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText(o.title, L, r.y + 15);
      return { sx: sx, sy: sy, L: L, R: R, Tp: Tp, B: B };
    }
    function plot(f, pts, col, w, dash) {
      ctx.save(); ctx.beginPath(); ctx.rect(f.L, f.Tp, f.R - f.L, f.B - f.Tp); ctx.clip();
      ctx.beginPath(); pts.forEach(function (q, k) { var X = f.sx(q[0]), Y = f.sy(q[1]); if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.stroke(); ctx.restore();
    }
    function tag(f, x, y, s, col, al) { ctx.font = '600 12px ' + T0.fontBody; ctx.fillStyle = col; ctx.textAlign = al || 'left'; ctx.fillText(s, x, y); }
    var T0;

    function draw() {
      var T = T0 = api.tokens(), w = cv.w, h = cv.h, stk = w < 640;
      ctx.clearRect(0, 0, w, h);
      var k1 = Math.pow(10, st.l1), k2 = Math.pow(10, st.l2), tend = Math.pow(10, st.lm) / k1, N = 300;
      var rs = [];
      for (var q = 0; q < 3; q++) rs.push(stk ? { x: 0, y: q * h / 3, w: w, h: h / 3 } : { x: q * w / 3, y: 0, w: w / 3, h: h });
      var A = [], I = [], P = [], Ps = [], Is = [];
      for (var j = 0; j <= N; j++) {
        // 앞부분(1/k₂ 근처의 빠른 변화)을 잘 보이게 시간 격자를 앞쪽에 촘촘히
        var t = tend * Math.pow(j / N, 1.6), s = sol(k1, k2, t);
        A.push([t, s.a]); I.push([t, s.i]); P.push([t, s.p]); Ps.push([t, 1 - s.a]); Is.push([t, k1 / k2 * s.a]);
      }
      var xs = niceStep(tend), xt = [];
      for (var x = 0; x <= tend * 1.0001; x += xs) xt.push([x, fmtN(+x.toPrecision(6))]);
      // 1) 전체
      var f1 = frame(T, rs[0], [0, tend], [0, 1.05], { title: '농도 (실선: 정확, 점선: 근사)', xlab: 't (s)', ylab: '농도 / [A]₀', xt: xt, yt: [[0, '0'], [0.5, '0.5'], [1, '1.0']] });
      plot(f1, A, T.figBlue, 2.2); plot(f1, P, T.figGreen, 2.4); plot(f1, I, T.figRed, 2.4);
      plot(f1, Ps, T.figGreen, 1.8, [6, 4]);
      var ix = f1.R - 6;
      tag(f1, f1.L + 6, f1.Tp + 14, '[A]', T.figBlue); tag(f1, f1.L + 36, f1.Tp + 14, '[I]', T.figRed); tag(f1, f1.L + 62, f1.Tp + 14, '[P]', T.figGreen);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right'; ctx.fillText('초록 점선: [P]ss', ix, f1.B - 26);
      // 2) [I] 확대
      var imax = 0; I.concat(Is).forEach(function (q) { if (q[1] > imax) imax = q[1]; });
      var ycap = Math.min(imax, Math.max.apply(null, I.map(function (q) { return q[1]; })) * 2.2) * 1.1 || 1e-6;
      var ys = niceStep(ycap), yt = [];
      for (var y = 0; y <= ycap * 1.0001; y += ys) yt.push([y, fmtN(+y.toPrecision(6))]);
      var f2 = frame(T, rs[1], [0, tend], [0, ycap], { title: '중간체 [I] 확대', xlab: 't (s)', ylab: '[I] / [A]₀', xt: xt, yt: yt });
      plot(f2, I, T.figRed, 2.6); plot(f2, Is, T.figRed, 1.8, [6, 4]);
      var tm, im;
      if (Math.abs(k2 - k1) < 1e-9 * k1) { tm = 1 / k1; im = Math.exp(-1); } else { tm = Math.log(k1 / k2) / (k1 - k2); im = sol(k1, k2, tm).i; }
      if (tm <= tend) {
        ctx.beginPath(); ctx.arc(f2.sx(tm), f2.sy(im), 4.5, 0, 7); ctx.fillStyle = T.figAccent; ctx.fill();
      }
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      ctx.fillText('점선: [I]ss', f2.R - 6, f2.Tp + 14);
      if (Is[0][1] > ycap) ctx.fillText('(t = 0에서 ' + fmtN(k1 / k2) + ', 위로 나감)', f2.R - 6, f2.Tp + 28);
      // 3) 오차 대 k₂/k₁
      var E = [], Rf = [];
      for (var g = 0; g <= 200; g++) { var rr = Math.pow(10, -2 + 5 * g / 200); E.push([rr, Math.max(perr(rr), 1e-6)]); Rf.push([rr, 0.582 / rr]); }
      var f3 = frame(T, rs[2], [0.01, 1000], [1e-3, 100], { xlog: true, ylog: true, title: 't = 1/k₁에서 [P]ss의 상대 오차', xlab: 'k₂ / k₁', ylab: '상대 오차',
        xt: [[0.01, '0.01'], [0.1, '0.1'], [1, '1'], [10, '10'], [100, '100'], [1000, '10³']], yt: [[1e-3, '0.1 %'], [1e-2, '1 %'], [0.1, '10 %'], [1, '100 %'], [10, '1000 %']] });
      plot(f3, Rf, T.figMuted, 1.4, [5, 4]); plot(f3, E, T.figViolet, 2.4);
      var r0 = k2 / k1, e0 = perr(r0);
      ctx.beginPath(); ctx.arc(f3.sx(r0), f3.sy(Math.max(e0, 1e-3)), 5, 0, 7); ctx.fillStyle = T.figAccent; ctx.fill(); ctx.strokeStyle = T.figPaper; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right'; ctx.fillText('점선: 0.58 k₁/k₂', f3.R - 6, f3.Tp + 14);
      rR.set(r0.toPrecision(3) + (r0 >= 10 ? ' (근사 성립)' : r0 >= 3 ? ' (오차 큼)' : ' (근사 실패)'));
      rE.set((e0 * 100 >= 1000 ? Math.round(e0 * 100).toLocaleString('en-US') : (e0 * 100).toPrecision(3)) + ' %');
      rT.set(fmtN(tm) + ' s, ' + im.toPrecision(3));
    }
    api.onResize(draw);
    api.onTheme(draw);
    draw();
  },
});
