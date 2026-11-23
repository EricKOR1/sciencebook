/* 물리화학 3 자유 에너지와 화학 퍼텐셜: 깁스 에너지 지형 — G_m(T)의 기울기 −S_m, G_m(p)의 기울기 V_m */
Sims.register('mj-gibbs-landscape', {
  title: '깁스 에너지 지형 탐색기 — 온도 기울기는 −Sₘ, 압력 기울기는 Vₘ',
  caption: '물질을 고르고 온도 T와 압력 p를 옮겨 보자. 왼쪽은 현재 압력에서 Gₘ(T) − Gₘ(298 K)이고, 오른쪽은 현재 온도에서 Gₘ(p) − Gₘ(1 bar)이며, 현재 점의 접선 기울기가 각각 −Sₘ과 Vₘ이다. ' +
    '"세 물질 겹쳐 보기"를 켜면 같은 눈금에서 비교된다. 기체는 압력에 훨씬 민감하고(Vₘ이 1000배쯤 크다) 온도에 따라 더 가파르게 내려가며, 압력이 높은 기체일수록 엔트로피가 작아 G–T 곡선이 덜 가파르다. ' +
    'Cp,m을 일정하게 두고 Sₘ(T) = S°ₘ + Cp,m ln(T/298 K)로 계산했고, 응축상의 Vₘ과 Sₘ은 압력에 무관하다고 보았다. 상전이(물의 끓음·얾)는 무시하고 한 상의 곡선만 이어 그렸다.',
  init: function (api) {
    var R = 8.314, T0 = 298.15;
    var subs = [
      { key: 'gas', name: '이상 기체(N₂)', S0: 191.6, Cp: 29.1, V: null, col: 'figRed' },
      { key: 'liq', name: '액체 물', S0: 69.9, Cp: 75.3, V: 18.07, col: 'figBlue' },
      { key: 'sol', name: '고체 구리', S0: 33.15, Cp: 24.4, V: 7.11, col: 'figAmber' },
    ];
    var st = { i: 0, T: 400, p: 100, all: false };

    // 몰 엔트로피 (J/(mol·K)), 몰 부피 (cm³/mol)
    function S(s, T, p) { return s.S0 + s.Cp * Math.log(T / T0) - (s.V === null ? R * Math.log(p) : 0); }
    function V(s, T, p) { return s.V === null ? R * T / (p * 1e5) * 1e6 : s.V; }
    // Gₘ(T) − Gₘ(298 K) at p (kJ/mol)
    function GT(s, T, p) { var S0p = S(s, T0, p); return (s.Cp * ((T - T0) - T * Math.log(T / T0)) - S0p * (T - T0)) / 1000; }
    // Gₘ(p) − Gₘ(1 bar) at T (kJ/mol)
    function Gp(s, T, p) { return s.V === null ? R * T * Math.log(p) / 1000 : s.V * 0.1 * (p - 1) / 1000; }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.45 : 0.5; }, label: '몰 깁스 에너지의 온도 의존과 압력 의존 그래프' });
    var ctx = cv.ctx;
    var rS = api.readout('Sₘ(T, p)'), rV = api.readout('Vₘ(T, p)'), rT = api.readout('(∂G/∂T)ₚ = −Sₘ'), rP = api.readout('(∂G/∂p)_T = Vₘ');

    var g = api.group();
    var btns = subs.map(function (s, k) {
      return api.button(s.name, function () { st.i = k; sync(); draw(); }, { toggle: true, pressed: k === 0, parent: g });
    });
    var allBtn = api.button('세 물질 겹쳐 보기', function () { st.all = !st.all; allBtn.setAttribute('aria-pressed', st.all ? 'true' : 'false'); draw(); }, { toggle: true, pressed: false });
    api.slider({ id: 'mj-gibbs-landscape-T', label: '온도 T', min: 250, max: 600, step: 1, value: st.T,
      format: function (v) { return v.toFixed(0) + ' K'; }, onInput: function (v) { st.T = v; draw(); } });
    api.slider({ id: 'mj-gibbs-landscape-p', label: '압력 p', min: 1, max: 1000, step: 1, value: st.p,
      format: function (v) { return v.toFixed(0) + ' bar'; }, onInput: function (v) { st.p = v; draw(); } });

    function sync() { btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === st.i ? 'true' : 'false'); }); }

    function niceStep(span) {
      var raw = span / 5, m = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / m;
      return (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * m;
    }
    function fmt(v) {
      var a = Math.abs(v), s = a >= 10 ? v.toFixed(0) : a >= 1 ? v.toFixed(1) : a >= 0.1 ? v.toFixed(2) : v.toFixed(3);
      if (+s === 0) s = '0';
      return s.replace('-', '−');
    }

    function plot(T, r, o) {
      // o: { xr, yr, xlab, ylab, curves: [{f, col, bold}], pt: {x, y, slope, col}, slopeLab }
      var L = r.x + 56, Rr = r.x + r.w - 12, Tp = r.y + 26, B = r.y + r.h - 40;
      var sx = function (x) { return L + (x - o.xr[0]) / (o.xr[1] - o.xr[0]) * (Rr - L); };
      var sy = function (y) { return B - (y - o.yr[0]) / (o.yr[1] - o.yr[0]) * (B - Tp); };
      ctx.fillStyle = T.figPanel; ctx.fillRect(L, Tp, Rr - L, B - Tp);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, Tp, Rr - L, B - Tp);
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      var ys = niceStep(o.yr[1] - o.yr[0]);
      ctx.textAlign = 'right';
      for (var y = Math.ceil(o.yr[0] / ys) * ys; y <= o.yr[1] + 1e-9; y += ys) {
        ctx.strokeStyle = T.figLine; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(L, sy(y)); ctx.lineTo(Rr, sy(y)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillText(fmt(y), L - 5, sy(y) + 4);
      }
      ctx.textAlign = 'center';
      o.xt.forEach(function (x) { ctx.fillText(String(x), sx(x), B + 15); });
      if (o.yr[0] < 0 && o.yr[1] > 0) { ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(L, sy(0)); ctx.lineTo(Rr, sy(0)); ctx.stroke(); }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText(o.xlab, (L + Rr) / 2, B + 32);
      ctx.save(); ctx.translate(r.x + 13, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(o.ylab, 0, 0); ctx.restore();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText(o.title, L, r.y + 16);
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, Rr - L, B - Tp); ctx.clip();
      o.curves.forEach(function (c) {
        ctx.beginPath();
        for (var k = 0; k <= 200; k++) { var x = o.xr[0] + (o.xr[1] - o.xr[0]) * k / 200, yy = c.f(x); if (k === 0) ctx.moveTo(sx(x), sy(yy)); else ctx.lineTo(sx(x), sy(yy)); }
        ctx.strokeStyle = c.col; ctx.lineWidth = c.bold ? 3 : 1.8; ctx.stroke();
      });
      o.pts.forEach(function (P) {
        // 접선: 화면에서 일정한 길이
        var dx = (o.xr[1] - o.xr[0]) * 0.14;
        ctx.setLineDash([6, 4]); ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(sx(P.x - dx), sy(P.y - P.slope * dx)); ctx.lineTo(sx(P.x + dx), sy(P.y + P.slope * dx)); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(sx(P.x), sy(P.y), 5, 0, 2 * Math.PI); ctx.fillStyle = P.col; ctx.fill();
        ctx.strokeStyle = T.figPaper; ctx.lineWidth = 1.5; ctx.stroke();
      });
      ctx.restore();
      // 범례(겹쳐 보기)
      if (o.legend) {
        ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
        o.legend.forEach(function (lg, k) {
          var yy = Tp + 14 + k * 15, xx = o.legendRight ? Rr - 104 : L + 8;
          ctx.fillStyle = lg.col; ctx.fillRect(xx, yy - 4, 14, 3); ctx.fillStyle = T.figInk; ctx.fillText(lg.name, xx + 18, yy);
        });
      }
      if (o.note) { ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = o.noteAlign || 'left'; ctx.fillText(o.note, o.noteAlign === 'right' ? Rr - 6 : L + 8, o.noteTop ? Tp + 16 : B - 10); }
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, stacked = w < 560;
      ctx.clearRect(0, 0, w, h);
      var r1 = stacked ? { x: 0, y: 0, w: w, h: h / 2 } : { x: 0, y: 0, w: w / 2 - 6, h: h };
      var r2 = stacked ? { x: 0, y: h / 2, w: w, h: h / 2 } : { x: w / 2 + 6, y: 0, w: w / 2 - 6, h: h };
      var shown = st.all ? subs : [subs[st.i]];
      var cur = subs[st.i];
      // 왼쪽: G(T)
      var yl = [0, 0];
      shown.forEach(function (s) { [250, 600].forEach(function (t) { var v = GT(s, t, st.p); yl[0] = Math.min(yl[0], v); yl[1] = Math.max(yl[1], v); }); });
      var padL = (yl[1] - yl[0]) * 0.08; yl = [yl[0] - padL, yl[1] + padL];
      plot(T, r1, {
        title: '일정 압력 p = ' + st.p.toFixed(0) + ' bar', xr: [250, 600], yr: yl, xt: [250, 300, 350, 400, 450, 500, 550, 600],
        xlab: '온도 T (K)', ylab: 'Gₘ(T) − Gₘ(298 K) (kJ/mol)',
        curves: shown.map(function (s) { return { f: function (t) { return GT(s, t, st.p); }, col: T[s.col], bold: s === cur || st.all }; }),
        pts: shown.map(function (s) { return { x: st.T, y: GT(s, st.T, st.p), slope: -S(s, st.T, st.p) / 1000, col: T[s.col] }; }),
        legend: st.all ? subs.map(function (s) { return { name: s.name, col: T[s.col] }; }) : null, legendRight: true,
        note: st.all ? null : '기울기 = −Sₘ = ' + (-S(cur, st.T, st.p)).toFixed(1).replace('-', '−') + ' J/(mol·K)', noteAlign: 'left',
      });
      // 오른쪽: G(p)
      var yr = [0, 0];
      shown.forEach(function (s) { yr[1] = Math.max(yr[1], Gp(s, st.T, 1000)); });
      yr[1] *= 1.08;
      var vcur = V(cur, st.T, st.p);
      plot(T, r2, {
        title: '일정 온도 T = ' + st.T.toFixed(0) + ' K', xr: [1, 1000], yr: yr, xt: [1, 200, 400, 600, 800, 1000],
        xlab: '압력 p (bar)', ylab: 'Gₘ(p) − Gₘ(1 bar) (kJ/mol)',
        curves: shown.map(function (s) { return { f: function (pp) { return Gp(s, st.T, pp); }, col: T[s.col], bold: s === cur || st.all }; }),
        pts: shown.map(function (s) { return { x: st.p, y: Gp(s, st.T, st.p), slope: V(s, st.T, st.p) * 1e-4, col: T[s.col] }; }),
        legend: st.all ? subs.map(function (s) { return { name: s.name, col: T[s.col] }; }) : null, legendRight: true,
        note: st.all ? null : '기울기 = Vₘ = ' + (vcur >= 100 ? vcur.toFixed(0) : vcur.toFixed(2)) + ' cm³/mol', noteAlign: 'right', noteTop: false,
      });
      var Sc = S(cur, st.T, st.p);
      rS.set(cur.name + ' ' + Sc.toFixed(1) + ' J/(mol·K)');
      rV.set((vcur >= 100 ? vcur.toFixed(0) : vcur.toFixed(2)) + ' cm³/mol');
      rT.set((-Sc).toFixed(1).replace('-', '−') + ' J/(mol·K)');
      rP.set((vcur * 0.1).toFixed(vcur >= 100 ? 1 : 3) + ' J/(mol·bar)');
    }
    api.onResize(draw);
    api.onTheme(draw);
    draw();
  },
});
