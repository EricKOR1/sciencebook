/* 일반화학 8 화학 평형: ICE 표 계산기 — 처음 농도와 K로 Q, 반응 방향, 평형 농도(수치 해), 농도–시간 곡선 */
Sims.register('u-ice-solver', {
  title: 'ICE 표 계산기 — 처음 농도와 K만 알면 평형 농도가 나온다',
  caption: '반응을 고르고 K와 처음 농도를 바꿔 보자. 처음 농도로 Q를 계산해 K와 비교하면 반응 방향이 정해지고, ICE 표의 평형 줄을 K 식에 넣은 방정식을 수치로 정확히 풀어 평형 농도를 보여 준다. "근사 검증"은 작은 K 근사(처음 농도 − 변화량 ≈ 처음 농도)를 써도 되는지 5 % 기준으로 알려 준다. 반응물끼리, 생성물끼리는 처음 농도를 같게 두었다. 농도–시간 곡선은 반응식 그대로 한 단계로 일어난다고 가정한 모형이며 시간 눈금은 임의 단위이다.',
  init: function (api) {
    var RX = [
      { name: 'N₂O₄ ⇌ 2NO₂', r: [['N₂O₄', 1]], p: [['NO₂', 2]], logK: Math.log10(4.6e-3), r0: 0.100, p0: 0 },
      { name: 'PCl₅ ⇌ PCl₃ + Cl₂', r: [['PCl₅', 1]], p: [['PCl₃', 1], ['Cl₂', 1]], logK: Math.log10(0.0420), r0: 0.100, p0: 0 },
      { name: '2NOCl ⇌ 2NO + Cl₂', r: [['NOCl', 2]], p: [['NO', 2], ['Cl₂', 1]], logK: Math.log10(1.6e-5), r0: 0.50, p0: 0 },
      { name: 'CO + H₂O ⇌ CO₂ + H₂', r: [['CO', 1], ['H₂O', 1]], p: [['CO₂', 1], ['H₂', 1]], logK: Math.log10(4.0), r0: 0.30, p0: 0.10 },
    ];
    var st = { i: 1, logK: RX[1].logK, r0: RX[1].r0, p0: RX[1].p0 };
    var res = null;
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.95 : 0.6; }, label: 'ICE 표, Q와 K 비교, 처음·평형 농도 막대, 농도–시간 곡선' });
    var ctx = cv.ctx;
    var rQ = api.readout('처음 Q');
    var rDir = api.readout('방향');
    var rX = api.readout('평형까지 변화량 x');
    var rChk = api.readout('근사 검증');

    var g = api.group();
    var btns = RX.map(function (r, i) { return api.button(r.name, function () { choose(i); }, { toggle: true, pressed: i === st.i, parent: g }); });
    var kS = api.slider({ id: 'u-ice-solver-k', label: '평형 상수 K', min: -6, max: 4, step: 0.001, value: st.logK,
      format: function (v) { return sci(Math.pow(10, v)); }, onInput: function (v) { st.logK = v; solve(); } });
    var rS = api.slider({ id: 'u-ice-solver-r0', label: '반응물 처음 농도', min: 0, max: 1, step: 0.005, value: st.r0,
      format: function (v) { return v.toFixed(3) + ' M'; }, onInput: function (v) { st.r0 = v; solve(); } });
    var pS = api.slider({ id: 'u-ice-solver-p0', label: '생성물 처음 농도', min: 0, max: 1, step: 0.005, value: st.p0,
      format: function (v) { return v.toFixed(3) + ' M'; }, onInput: function (v) { st.p0 = v; solve(); } });

    function choose(i) {
      st.i = i;
      btns.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      kS.set(RX[i].logK); rS.set(RX[i].r0); pS.set(RX[i].p0);
    }
    function sup(n) { var m = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }; return String(n).split('').map(function (c) { return m[c]; }).join(''); }
    function sci(x) {
      if (!isFinite(x)) return '∞';
      if (x === 0) return '0';
      var ax = Math.abs(x);
      if (ax >= 0.01 && ax < 1000) return x.toPrecision(3).replace('-', '−');
      var e = Math.floor(Math.log10(ax)), m = x / Math.pow(10, e);
      if (+m.toFixed(2) >= 10) { m /= 10; e += 1; }
      return (m.toFixed(2) + '×10' + sup(e)).replace(/^-/, '−');
    }
    function species() {
      var R = RX[st.i], list = [];
      R.r.forEach(function (s) { list.push({ n: s[0], nu: -s[1], c0: st.r0 }); });
      R.p.forEach(function (s) { list.push({ n: s[0], nu: s[1], c0: st.p0 }); });
      return list;
    }
    function concAt(sp, x) { return sp.map(function (s) { return s.c0 + s.nu * x; }); }
    function lnQ(sp, c) { var q = 0; for (var i = 0; i < sp.length; i++) q += sp[i].nu * Math.log(c[i]); return q; }

    function solve() {
      var sp = species(), K = Math.pow(10, st.logK), lnK = Math.log(K);
      var xmax = Infinity, xmin = -Infinity;
      sp.forEach(function (s) { if (s.nu < 0) xmax = Math.min(xmax, s.c0 / -s.nu); else xmin = Math.max(xmin, -s.c0 / s.nu); });
      res = { sp: sp, K: K, empty: xmax - xmin < 1e-12 };
      if (res.empty) { readouts(); draw(); return; }
      var c0 = concAt(sp, 0), q0 = lnQ(sp, c0);
      res.lnQ0 = q0;
      var lo = xmin, hi = xmax;
      for (var it = 0; it < 200; it++) {
        var mid = (lo + hi) / 2, gq = lnQ(sp, concAt(sp, mid)) - lnK;
        if (isNaN(gq)) break;
        if (gq > 0) hi = mid; else lo = mid;
      }
      res.x = (lo + hi) / 2; res.ce = concAt(sp, res.x);
      res.ce = res.ce.map(function (v) { return Math.max(0, v); });
      kinetics(sp, K);
      readouts(); draw();
    }
    // 반응식대로 한 단계라고 본 질량 작용 속도: v = kf·Π[R]^ν − kr·Π[P]^ν, kf·kr 중 큰 쪽을 1로
    function kinetics(sp, K) {
      var kf = Math.min(1, K), kr = kf / K;
      function v(x) {
        var c = concAt(sp, x), f = kf, b = kr;
        sp.forEach(function (s, i) { var cc = Math.max(0, c[i]); if (s.nu < 0) f *= Math.pow(cc, -s.nu); else b *= Math.pow(cc, s.nu); });
        return f - b;
      }
      var N = 240, pts = [{ t: 0, x: 0 }], t = 0, xPrev = 0;
      if (Math.abs(res.x) < 1e-14) { res.path = [{ t: 0, x: 0 }, { t: 1, x: 0 }]; res.tEnd = 1; return; }
      for (var i = 1; i <= N; i++) {
        var u = 1 - Math.pow(0.004, i / N), x = res.x * u, vm = v((x + xPrev) / 2);
        if (!(Math.abs(vm) > 0)) break;
        t += (x - xPrev) / vm; xPrev = x;
        pts.push({ t: t, x: x });
      }
      res.path = pts; res.tEnd = t;
    }
    function readouts() {
      if (res.empty) { rQ.set('–'); rDir.set('물질이 없음'); rX.set('–'); rChk.set('–'); return; }
      var Q = Math.exp(res.lnQ0);
      rQ.set(sci(Q) + (Q < res.K * 0.9999 ? ' < K' : Q > res.K * 1.0001 ? ' > K' : ' = K'));
      rDir.set(Q < res.K * 0.9999 ? '정반응 →' : Q > res.K * 1.0001 ? '← 역반응' : '이미 평형');
      rX.set(sci(res.x) + ' M');
      // 근사 검증: 줄어드는 쪽 첫 물질의 상대 변화
      var s = null, k = -1;
      res.sp.forEach(function (sp, i) { if (k < 0 && ((res.x > 0 && sp.nu < 0) || (res.x < 0 && sp.nu > 0))) { s = sp; k = i; } });
      if (!s || s.c0 === 0) { rChk.set('–'); return; }
      var pct = Math.abs(s.nu * res.x) / s.c0 * 100;
      rChk.set(s.n + ' ' + (pct < 0.1 ? pct.toFixed(3) : pct.toFixed(1)) + ' % ' + (pct <= 5 ? '(5 % 이하 → 근사 가능)' : '(5 % 초과 → 정확히 풀기)'));
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, stacked = w < 560;
      ctx.clearRect(0, 0, w, h);
      var P;
      if (stacked) P = { ice: { x: 0, y: 0, w: w, h: h * 0.24 }, qk: { x: 0, y: h * 0.24, w: w, h: h * 0.14 }, bar: { x: 0, y: h * 0.39, w: w, h: h * 0.29 }, kin: { x: 0, y: h * 0.69, w: w, h: h * 0.31 } };
      else P = { ice: { x: 0, y: 0, w: w * 0.5, h: h * 0.56 }, qk: { x: 0, y: h * 0.58, w: w * 0.5, h: h * 0.3 }, bar: { x: w * 0.52, y: 0, w: w * 0.48, h: h * 0.48 }, kin: { x: w * 0.52, y: h * 0.5, w: w * 0.48, h: h * 0.5 } };
      if (res.empty) {
        ctx.fillStyle = T.figMuted; ctx.font = '14px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('반응물이나 생성물의 처음 농도를 0보다 크게 하자.', w / 2, h / 2); return;
      }
      ice(T, P.ice); qk(T, P.qk); bars(T, P.bar); kin(T, P.kin);
    }
    function colors(T) { return [T.figBlue, T.figTeal, T.figRed, T.figAmber]; }

    function ice(T, r) {
      var sp = res.sp, n = sp.length, x0 = r.x + 8, y0 = r.y + 26;
      var lw = 36, cw = Math.min(110, (r.w - 16 - lw) / n), rh = Math.min(34, (r.h - 54) / 4);
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('ICE 표 (M)', x0, r.y + 16);
      ctx.fillStyle = T.figSoftGreen; ctx.fillRect(x0, y0 + rh * 3, lw + cw * n, rh);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      ctx.strokeRect(x0, y0, lw + cw * n, rh * 4);
      for (var k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x0, y0 + rh * k); ctx.lineTo(x0 + lw + cw * n, y0 + rh * k); ctx.stroke(); }
      for (var j = 0; j <= n; j++) { var xx = x0 + lw + cw * j; ctx.beginPath(); ctx.moveTo(xx, y0); ctx.lineTo(xx, y0 + rh * 4); ctx.stroke(); }
      var C = colors(T), dy = rh / 2 + 5;
      ctx.textAlign = 'center'; ctx.font = '600 13px ' + T.fontBody;
      ['I', 'C', 'E'].forEach(function (lab, k) { ctx.fillStyle = T.figInk; ctx.fillText(lab, x0 + lw / 2, y0 + rh * (k + 1) + dy); });
      sp.forEach(function (s, j) {
        var cx = x0 + lw + cw * j + cw / 2;
        ctx.fillStyle = C[j]; ctx.font = '600 13px ' + T.fontBody; ctx.fillText(s.n, cx, y0 + dy);
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontMono;
        ctx.fillText(sci(s.c0), cx, y0 + rh + dy);
        var a = Math.abs(s.nu); ctx.fillText((s.nu < 0 ? '−' : '+') + (a === 1 ? '' : a) + 'x', cx, y0 + rh * 2 + dy);
        ctx.font = '600 12px ' + T.fontMono; ctx.fillText(sci(res.ce[j]), cx, y0 + rh * 3 + dy);
      });
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      var Kstr = 'x = ' + sci(res.x) + ' M,  검산: Q(평형) = ' + sci(Math.exp(lnQ(sp, res.ce)));
      ctx.fillText(Kstr, x0, y0 + rh * 4 + 18);
    }

    function qk(T, r) {
      var L = r.x + 18, R = r.x + r.w - 18, Y = r.y + r.h * 0.55, lo = -8, hi = 6;
      var sx = function (lg) { return L + (Math.max(lo, Math.min(hi, lg)) - lo) / (hi - lo) * (R - L); };
      var lK = st.logK, xk = sx(lK);
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(L, Y - 14, xk - L, 28);
      ctx.fillStyle = T.figSoftRed; ctx.fillRect(xk, Y - 14, R - xk, 28);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(L, Y); ctx.lineTo(R, Y); ctx.stroke();
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
      for (var e = lo; e <= hi; e += 2) { var xe = sx(e); ctx.beginPath(); ctx.moveTo(xe, Y - 4); ctx.lineTo(xe, Y + 4); ctx.stroke(); ctx.fillText('10' + sup(e), xe, Y + 28); }
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('Q와 K 비교 (로그 눈금)', r.x + 8, r.y + 14);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(xk, Y - 20); ctx.lineTo(xk, Y + 16); ctx.stroke();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('K', xk, Y - 24);
      var lq = res.lnQ0 / Math.LN10, xq = sx(lq), out = lq < lo ? (isFinite(lq) ? '◀' : 'Q = 0') : lq > hi ? (isFinite(lq) ? '▶' : 'Q = ∞') : '';
      ctx.fillStyle = T.figAccent; ctx.beginPath(); ctx.arc(xq, Y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = xq < L + 30 ? 'left' : xq > R - 30 ? 'right' : 'center';
      ctx.fillText(out ? out + (out.length > 1 ? '' : ' Q') : 'Q', xq, Y - 24 + (Math.abs(xq - xk) < 24 ? -14 : 0));
      if (Math.abs(xq - xk) > 14) {
        var dir = xk > xq ? 1 : -1, ya = Y + 10;
        ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xq + dir * 8, ya); ctx.lineTo(xk - dir * 6, ya); ctx.stroke();
        ctx.fillStyle = T.figAccent; ctx.beginPath(); ctx.moveTo(xk - dir * 2, ya); ctx.lineTo(xk - dir * 10, ya - 5); ctx.lineTo(xk - dir * 10, ya + 5); ctx.closePath(); ctx.fill();
      }
    }

    function bars(T, r) {
      var sp = res.sp, n = sp.length, L = r.x + 46, R = r.x + r.w - 8, Tp = r.y + 28, B = r.y + r.h - 26;
      var m = 0; sp.forEach(function (s, j) { m = Math.max(m, s.c0, res.ce[j]); });
      var step = niceStep(m, 4), ymax = Math.ceil(m / step) * step || 1;
      var sy = function (v) { return B - v / ymax * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('처음(연한 막대)과 평형(진한 막대) 농도', r.x + 8, r.y + 14);
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.textAlign = 'right';
      for (var v = 0; v <= ymax + 1e-12; v += step) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(sci(v), L - 4, sy(v) + 4); }
      var C = colors(T), gw = (R - L) / n, bw = Math.min(30, gw * 0.32);
      sp.forEach(function (s, j) {
        var cx = L + gw * (j + 0.5);
        ctx.globalAlpha = 0.35; ctx.fillStyle = C[j]; ctx.fillRect(cx - bw - 2, sy(s.c0), bw, B - sy(s.c0)); ctx.globalAlpha = 1;
        ctx.fillStyle = C[j]; ctx.fillRect(cx + 2, sy(res.ce[j]), bw, B - sy(res.ce[j]));
        ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText(s.n, cx, B + 16);
      });
      ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(L, B); ctx.lineTo(R, B); ctx.stroke();
    }

    function kin(T, r) {
      var sp = res.sp, L = r.x + 46, R = r.x + r.w - 8, Tp = r.y + 28, B = r.y + r.h - 30;
      var m = 0; sp.forEach(function (s, j) { m = Math.max(m, s.c0, res.ce[j]); });
      var step = niceStep(m, 4), ymax = Math.ceil(m / step) * step || 1, tMax = res.tEnd * 1.25 || 1;
      var sx = function (t) { return L + t / tMax * (R - L); }, sy = function (v) { return B - v / ymax * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('농도–시간 곡선', r.x + 8, r.y + 14);
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.textAlign = 'right';
      for (var v = 0; v <= ymax + 1e-12; v += step) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(sci(v), L - 4, sy(v) + 4); }
      ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(L, Tp - 4); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText('시간 (임의 단위) →', R, B + 16);
      var C = colors(T);
      sp.forEach(function (s, j) {
        ctx.strokeStyle = C[j]; ctx.lineWidth = 2.2; ctx.beginPath();
        res.path.forEach(function (p, k) { var y = sy(Math.max(0, s.c0 + s.nu * p.x)); if (k) ctx.lineTo(sx(p.t), y); else ctx.moveTo(sx(p.t), y); });
        ctx.lineTo(sx(tMax), sy(res.ce[j])); ctx.stroke();
      });
      // 범례
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      var lx = r.x + 120;
      sp.forEach(function (s, j) {
        ctx.fillStyle = C[j]; ctx.fillRect(lx, r.y + 6, 14, 3); ctx.fillStyle = T.figInk; ctx.fillText(s.n, lx + 18, r.y + 12); lx += ctx.measureText(s.n).width + 32;
      });
    }
    function niceStep(range, n) { if (!(range > 0)) return 1; var raw = range / n, e = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / e; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * e; }

    api.onResize(draw);
    solve();
  },
});
