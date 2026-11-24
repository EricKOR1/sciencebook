/* 물리화학 3 자유 에너지와 화학 퍼텐셜: 판데르발스 기체의 퓨가시티 — ln φ = ∫₀ᵖ (Z − 1)/p dp 를 넓이로 */
Sims.register('mj-vdw-fugacity', {
  title: '판데르발스 기체의 퓨가시티 계산기 — ln φ는 (Z − 1)/p 곡선 아래 넓이',
  caption: '기체와 온도를 고르고 압력 p를 옮겨 보자. 위(왼쪽)는 압축 인자 Z, 가운데는 (Z − 1)/p이며 0부터 현재 p까지 색칠한 넓이가 ln φ이다(가로축 위는 +, 아래는 −). 아래(오른쪽)는 퓨가시티 f = φp와 이상 기체의 f = p(점선)이다. ' +
    '보일 온도 T_B = a/Rb보다 낮으면 낮은 압력에서 (Z − 1)/p가 음수라 φ < 1이고, T_B보다 높이면 처음부터 양수라 φ > 1이 된다. 압력이 높으면 반발력이 살아나 Z가 1을 넘어가지만, φ는 그때까지 쌓인 넓이로 정해진다. ' +
    '"낮은 압력 근사"를 켜면 ln φ ≈ Bp/RT(B = b − a/RT) 곡선이 겹쳐진다. 판데르발스 식의 계산이며, 온도는 액화가 없도록 그 식의 임계 온도 Tc = 8a/27Rb의 1.1배부터 고른다(보일 온도는 Tc의 3.375배라 5배까지 열어 두었다).',
  init: function (api) {
    var Rb = 0.08314;   // bar·L/(mol·K)
    var gases = [
      { name: 'N₂', a: 1.370, b: 0.0387 },
      { name: 'CH₄', a: 2.283, b: 0.04278 },
      { name: 'CO₂', a: 3.640, b: 0.04267 },
      { name: 'H₂', a: 0.2476, b: 0.02661 },
      { name: 'He', a: 0.0346, b: 0.0238 },
    ];
    gases.forEach(function (g) { g.Tc = 8 * g.a / (27 * Rb * g.b); g.TB = g.a / (Rb * g.b); });
    var PMAX = 500, N = 250;
    var st = { gi: 1, T: 300, p: 100, approx: false };

    function solveV(p, T, g) {
      var RT = Rb * T, lo = g.b * (1 + 1e-12), hi = RT / p + g.b;
      for (var k = 0; k < 80; k++) {
        var m = 0.5 * (lo + hi), f = RT / (m - g.b) - g.a / (m * m) - p;
        if (f > 0) lo = m; else hi = m;
      }
      return 0.5 * (lo + hi);
    }
    function state(p, T, g) {
      var RT = Rb * T, B = g.b - g.a / RT;
      if (p < 1e-6) return { Z: 1, zp: B / RT, lnphi: 0 };
      var V = solveV(p, T, g), Z = p * V / RT;
      return { Z: Z, zp: (Z - 1) / p, lnphi: Z - 1 - Math.log(Z * (1 - g.b / V)) - g.a / (RT * V) };
    }

    var cv = api.canvas({ aspect: function (w) { return w < 640 ? 1.9 : 0.42; }, label: '압축 인자, (Z−1)/p와 넓이, 퓨가시티 그래프' });
    var ctx = cv.ctx;
    var rT = api.readout('T / T_B'), rZ = api.readout('Z'), rL = api.readout('ln φ (넓이)'), rF = api.readout('φ, f');

    var g0 = api.group();
    var btns = gases.map(function (g, k) {
      return api.button(g.name, function () { var ratio = st.T / gases[st.gi].Tc; st.gi = k; setTrange(ratio); sync(); draw(); }, { toggle: true, pressed: k === st.gi, parent: g0 });
    });
    var sT = api.slider({ id: 'mj-vdw-fugacity-T', label: '온도 T', min: 200, max: 950, step: 1, value: st.T,
      format: function (v) { return (v < 100 ? v.toFixed(1) : v.toFixed(0)) + ' K'; }, onInput: function (v) { st.T = v; draw(); } });
    api.slider({ id: 'mj-vdw-fugacity-p', label: '압력 p', min: 1, max: PMAX, step: 1, value: st.p,
      format: function (v) { return v.toFixed(0) + ' bar'; }, onInput: function (v) { st.p = v; draw(); } });
    var apBtn = api.button('낮은 압력 근사 겹쳐 보기', function () { st.approx = !st.approx; apBtn.setAttribute('aria-pressed', st.approx ? 'true' : 'false'); draw(); }, { toggle: true, pressed: false });

    function sync() { btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === st.gi ? 'true' : 'false'); }); }
    function setTrange(ratio) {
      var g = gases[st.gi], lo = 1.1 * g.Tc, hi = 5 * g.Tc, step = hi < 100 ? 0.1 : 1;
      sT.input.min = (Math.ceil(lo / step) * step).toFixed(1); sT.input.max = (Math.floor(hi / step) * step).toFixed(1); sT.input.step = step;
      var T = Math.min(Math.max(ratio * g.Tc, lo), hi);
      sT.set(Math.round(T / step) * step);
    }
    setTrange(300 / gases[1].Tc);

    function niceStep(span) {
      var raw = span / 4, m = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / m;
      return (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * m;
    }
    function fmt(v, step) {
      var d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
      var s = v.toFixed(Math.min(d, 6)); if (+s === 0) s = '0';
      return s.replace('-', '−');
    }
    function panel(T, r, o) {
      var L = r.x + 58, Rr = r.x + r.w - 12, Tp = r.y + 28, B = r.y + r.h - 40;
      var sx = function (x) { return L + x / PMAX * (Rr - L); };
      var sy = function (y) { return B - (y - o.yr[0]) / (o.yr[1] - o.yr[0]) * (B - Tp); };
      ctx.fillStyle = T.figPanel; ctx.fillRect(L, Tp, Rr - L, B - Tp);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, Tp, Rr - L, B - Tp);
      var ys = o.ystep || niceStep(o.yr[1] - o.yr[0]);
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      for (var y = Math.ceil(o.yr[0] / ys - 1e-9) * ys; y <= o.yr[1] + 1e-12; y += ys) {
        ctx.strokeStyle = T.figLine; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(L, sy(y)); ctx.lineTo(Rr, sy(y)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillText(o.yfmt ? o.yfmt(y) : fmt(y, ys), L - 5, sy(y) + 4);
      }
      ctx.textAlign = 'center';
      [0, 100, 200, 300, 400, 500].forEach(function (x) { ctx.fillText(String(x), sx(x), B + 15); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('압력 p (bar)', (L + Rr) / 2, B + 32);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(o.ylab, 0, 0); ctx.restore();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText(o.title, L, r.y + 16);
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, Rr - L, B - Tp); ctx.clip();
      if (o.under) o.under(sx, sy);
      (o.refs || []).forEach(function (c) { line(c.pts, sx, sy, c.col, 1.6, [6, 5]); });
      (o.curves || []).forEach(function (c) { line(c.pts, sx, sy, c.col, c.w || 2.6, c.dash); });
      if (o.pt) {
        ctx.strokeStyle = T.figMuted; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx(o.pt[0]), Tp); ctx.lineTo(sx(o.pt[0]), B); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(sx(o.pt[0]), sy(o.pt[1]), 5, 0, 2 * Math.PI); ctx.fillStyle = T.figAccent; ctx.fill(); ctx.strokeStyle = T.figPaper; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.restore();
      if (o.labels) o.labels(sx, sy, L, Rr, Tp, B);
    }
    function line(pts, sx, sy, col, w, dash) {
      ctx.beginPath(); pts.forEach(function (q, k) { if (k === 0) ctx.moveTo(sx(q[0]), sy(q[1])); else ctx.lineTo(sx(q[0]), sy(q[1])); });
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
    }
    function range(vals, incl, pad) {
      var lo = Math.min.apply(null, vals.concat(incl)), hi = Math.max.apply(null, vals.concat(incl)), d = (hi - lo) || 1;
      return [lo - d * pad, hi + d * pad];
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, stacked = w < 640, g = gases[st.gi], Tk = st.T, RT = Rb * Tk, Bv = g.b - g.a / RT;
      ctx.clearRect(0, 0, w, h);
      var rs = [];
      for (var k = 0; k < 3; k++) rs.push(stacked ? { x: 0, y: k * h / 3, w: w, h: h / 3 } : { x: k * w / 3, y: 0, w: w / 3, h: h });
      var P = [], Zs = [], ZP = [], F = [], Za = [], ZPa = [], Fa = [];
      for (var i = 0; i <= N; i++) {
        var p = PMAX * i / N, s = state(p, Tk, g);
        P.push(p); Zs.push([p, s.Z]); ZP.push([p, s.zp]); F.push([p, p * Math.exp(s.lnphi)]);
        Za.push([p, 1 + Bv * p / RT]); ZPa.push([p, Bv / RT]); Fa.push([p, p * Math.exp(Bv * p / RT)]);
      }
      var cur = state(st.p, Tk, g), phi = Math.exp(cur.lnphi);
      // 1) Z
      var zr = range(Zs.map(function (q) { return q[1]; }), [1], 0.1);
      panel(T, rs[0], { title: '압축 인자 Z = pVₘ/RT', ylab: 'Z', yr: zr,
        refs: [{ pts: [[0, 1], [PMAX, 1]], col: T.figMuted }], curves: [{ pts: Zs, col: T.figBlue }].concat(st.approx ? [{ pts: Za, col: T.figAmber, w: 1.8, dash: [3, 3] }] : []),
        pt: [st.p, cur.Z],
        labels: function (sx, sy, L, Rr) { ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'left'; ctx.fillText('Z = 1 (이상 기체)', L + 8, sy(1) + (zr[1] - 1 > (zr[1] - zr[0]) * 0.15 ? -5 : 14)); } });
      // 2) (Z−1)/p 와 넓이
      var yv = ZP.map(function (q) { return q[1] * 1e3; });
      if (st.approx) yv.push(Bv / RT * 1e3);
      var pr = range(yv, [0], 0.12);
      var ZPs = ZP.map(function (q) { return [q[0], q[1] * 1e3]; }), ZPas = ZPa.map(function (q) { return [q[0], q[1] * 1e3]; });
      panel(T, rs[1], { title: '(Z − 1)/p, 색칠한 넓이 = ln φ', ylab: '(Z − 1)/p (10⁻³ bar⁻¹)', yr: pr,
        under: function (sx, sy) {
          var n = Math.round(st.p / PMAX * N);
          // 양수·음수 부분을 따로 칠한다
          [[1, T.figSoftBlue], [-1, T.figSoftRed]].forEach(function (sg) {
            ctx.beginPath(); ctx.moveTo(sx(0), sy(0));
            for (var j = 0; j <= n; j++) { var q = ZPs[j]; ctx.lineTo(sx(q[0]), sy(sg[0] > 0 ? Math.max(q[1], 0) : Math.min(q[1], 0))); }
            ctx.lineTo(sx(st.p), sy(sg[0] > 0 ? Math.max(cur.zp * 1e3, 0) : Math.min(cur.zp * 1e3, 0)));
            ctx.lineTo(sx(st.p), sy(0)); ctx.closePath(); ctx.fillStyle = sg[1]; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
          });
        },
        refs: [{ pts: [[0, 0], [PMAX, 0]], col: T.figMuted }],
        curves: [{ pts: ZPs, col: T.figAccent }].concat(st.approx ? [{ pts: ZPas, col: T.figAmber, w: 1.8, dash: [3, 3] }] : []),
        pt: [st.p, cur.zp * 1e3],
        labels: function (sx, sy, L, Rr, Tp, B) {
          ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillStyle = T.figInk;
          ctx.fillText('ln φ = ' + cur.lnphi.toFixed(3).replace('-', '−'), Rr - 6, cur.zp < 0 ? Tp + 16 : B - 8);
        } });
      // 3) f
      var fr = [0, Math.max(PMAX, F[N][1], st.approx ? Fa[N][1] : 0) * 1.05];
      panel(T, rs[2], { title: '퓨가시티 f = φp', ylab: 'f (bar)', yr: fr,
        refs: [{ pts: [[0, 0], [PMAX, PMAX]], col: T.figMuted }], curves: [{ pts: F, col: T.figRed }].concat(st.approx ? [{ pts: Fa, col: T.figAmber, w: 1.8, dash: [3, 3] }] : []),
        pt: [st.p, st.p * phi],
        labels: function (sx, sy, L, Rr, Tp) {
          ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figMuted;
          ctx.fillText('점선: f = p (이상 기체)', L + 6, Tp + 14);
          if (st.approx) { ctx.fillStyle = T.figAmber; ctx.fillText('주황 점선: 낮은 압력 근사', L + 6, Tp + 29); }
        } });
      rT.set(Tk.toFixed(Tk < 100 ? 1 : 0) + ' K / ' + g.TB.toFixed(g.TB < 100 ? 1 : 0) + ' K = ' + (Tk / g.TB).toFixed(2));
      rZ.set(cur.Z.toFixed(3));
      rL.set(cur.lnphi.toFixed(3).replace('-', '−') + '  (근사 ' + (Bv * st.p / RT).toFixed(3).replace('-', '−') + ')');
      rF.set('φ = ' + phi.toFixed(3) + ', f = ' + (st.p * phi).toFixed(1) + ' bar');
    }
    api.onResize(draw);
    api.onTheme(draw);
    draw();
  },
});
