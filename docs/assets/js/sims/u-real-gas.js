/* 일반화학 2 기체: 실제 기체와 판데르발스 방정식 — a·b 보정, P–V 등온선, 압축 인자 Z–P 곡선 */
Sims.register('u-real-gas', {
  title: '실제 기체 — 판데르발스 식의 두 보정과 압축 인자',
  caption: '기체와 온도를 고르고 몰 부피 Vₘ을 줄여 기체를 압축해 보자. 왼쪽 위 그래프는 같은 Vₘ에서 이상 기체(점선)와 판데르발스 식(실선)의 압력을, 오른쪽 위는 압축 인자 Z = PVₘ/RT를 압력에 대해 보여 준다. 아래 막대는 압력이 이상 기체 값에서 부피 보정(+)과 인력 보정(−)으로 어떻게 바뀌는지 나눠 보여 준다. a가 큰 CO₂는 중간 압력에서 Z < 1로 크게 내려가고, a가 아주 작은 He는 처음부터 Z > 1이다. 온도를 높이면 곡선이 1에 가까워진다. 기체 1 mol, 판데르발스 식으로 계산한 값이며, 액화가 일어나지 않도록 온도는 CO₂의 임계 온도(약 31 °C)보다 높게만 고르게 했다.',
  init: function (api) {
    var R = 0.08206, PMAX = 500, VMAX = 1.2, ZMAX = 2.0;
    var GASES = [
      { name: 'He', a: 0.0341, b: 0.0237 }, { name: 'H₂', a: 0.244, b: 0.0266 }, { name: 'N₂', a: 1.39, b: 0.0391 },
      { name: 'CH₄', a: 2.25, b: 0.0428 }, { name: 'CO₂', a: 3.59, b: 0.0427 },
    ];
    var st = { g: 4, T: 310, V: 1.0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.75 : 0.66; }, label: 'P–V 등온선, Z–P 곡선, 압력 보정 막대' });
    var ctx = cv.ctx;
    var rPi = api.readout('이상 기체 P');
    var rPv = api.readout('판데르발스 P');
    var rZ = api.readout('압축 인자 Z');
    var rD = api.readout('우세한 효과');

    var gg = api.group();
    var gb = GASES.map(function (g, i) {
      return api.button(g.name, function () { st.g = i; gb.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); update(); }, { toggle: true, pressed: i === st.g, parent: gg });
    });
    api.slider({ id: 'u-real-gas-T', label: '온도 T', min: 310, max: 1000, step: 5, value: st.T,
      format: function (v) { return v + ' K'; }, onInput: function (v) { st.T = v; update(); } });
    var LMIN = Math.log(0.06), LMAX = Math.log(VMAX);
    api.slider({ id: 'u-real-gas-V', label: '몰 부피 Vₘ', min: 0, max: 1, step: 0.0005, value: (Math.log(st.V) - LMIN) / (LMAX - LMIN),
      format: function (x) { return Math.exp(LMIN + x * (LMAX - LMIN)).toFixed(3) + ' L/mol'; },
      onInput: function (x) { st.V = Math.exp(LMIN + x * (LMAX - LMIN)); update(); } });

    function G() { return GASES[st.g]; }
    function pv(V) { var g = G(); return R * st.T / (V - g.b) - g.a / (V * V); }
    function vals() {
      var g = G(), V = st.V, pid = R * st.T / V, prep = R * st.T / (V - g.b), pvdw = prep - g.a / (V * V);
      return { pid: pid, prep: prep, attr: g.a / (V * V), pvdw: pvdw, Z: pvdw * V / (R * st.T) };
    }
    function update() {
      var v = vals();
      rPi.set(v.pid.toFixed(1) + ' atm'); rPv.set(v.pvdw.toFixed(1) + ' atm'); rZ.set(v.Z.toFixed(3));
      rD.set(Math.abs(v.Z - 1) < 0.005 ? '거의 이상 기체' : v.Z < 1 ? '인력 우세 (Z < 1)' : '분자 부피 우세 (Z > 1)');
      draw();
    }
    function panels() {
      var w = cv.w, h = cv.h;
      if (w < 560) { var ph = (h - 30) / 3; return [{ x: 0, y: 0, w: w, h: ph }, { x: 0, y: ph + 10, w: w, h: ph }, { x: 0, y: 2 * ph + 24, w: w, h: ph - 4 }]; }
      var th = h * 0.64;
      return [{ x: 0, y: 0, w: w * 0.5 - 6, h: th }, { x: w * 0.5 + 6, y: 0, w: w * 0.5 - 6, h: th }, { x: 0, y: th + 14, w: w, h: h - th - 14 }];
    }
    function axes(T, r, xmax, ymax, xt, yt, xlab, ylab, xfmt, yfmt) {
      var L = r.x + 50, Rr = r.x + r.w - 10, Tp = r.y + 12, B = r.y + r.h - 36;
      var sx = function (x) { return L + (x / xmax) * (Rr - L); }, sy = function (y) { return B - (y / ymax) * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'right';
      yt.forEach(function (y) { ctx.beginPath(); ctx.moveTo(L, sy(y)); ctx.lineTo(Rr, sy(y)); ctx.stroke(); ctx.fillText(yfmt(y), L - 5, sy(y) + 4); });
      ctx.textAlign = 'center';
      xt.forEach(function (x) { ctx.fillText(xfmt(x), sx(x), B + 14); });
      ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.lineTo(Rr, B); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.fillText(xlab, (L + Rr) / 2, B + 30);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(ylab, 0, 0); ctx.restore();
      return { sx: sx, sy: sy, L: L, R: Rr, T: Tp, B: B };
    }
    function clipTo(A) { ctx.save(); ctx.beginPath(); ctx.rect(A.L, A.T - 2, A.R - A.L, A.B - A.T + 2); ctx.clip(); }
    function draw() {
      var T = api.tokens(), P = panels(), v = vals(), g = G();
      ctx.clearRect(0, 0, cv.w, cv.h);
      // ① P–V
      var A = axes(T, P[0], VMAX, PMAX, [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2], [0, 100, 200, 300, 400, 500], '몰 부피 Vₘ (L/mol)', '압력 P (atm)',
        function (x) { return x.toFixed(1); }, function (y) { return String(y); });
      clipTo(A);
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.6; ctx.beginPath();
      for (var i = 0; i <= 300; i++) { var V = 0.02 + (VMAX - 0.02) * i / 300, y = A.sy(R * st.T / V); if (i) ctx.lineTo(A.sx(V), y); else ctx.moveTo(A.sx(V), y); }
      ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.4; ctx.beginPath();
      var started = false;
      for (i = 0; i <= 400; i++) { V = g.b * 1.05 + (VMAX - g.b * 1.05) * Math.pow(i / 400, 1.6); var p = pv(V); if (p > PMAX * 1.5) continue; if (started) ctx.lineTo(A.sx(V), A.sy(p)); else { ctx.moveTo(A.sx(V), A.sy(p)); started = true; } }
      ctx.stroke();
      // 배제 부피 b
      ctx.fillStyle = T.figSoftRed; ctx.fillRect(A.sx(0), A.T, A.sx(g.b) - A.sx(0), A.B - A.T);
      ctx.restore();
      ctx.fillStyle = T.figRed; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('b', A.sx(g.b) + 2, A.B - 6);
      // 표시점
      dot(A.sx(st.V), A.sy(Math.min(v.pid, PMAX)), T.figMuted, v.pid <= PMAX);
      dot(A.sx(st.V), A.sy(Math.min(v.pvdw, PMAX)), T.figAccent, v.pvdw <= PMAX);
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(A.sx(st.V), A.T); ctx.lineTo(A.sx(st.V), A.B); ctx.stroke(); ctx.setLineDash([]);
      legend(T, A.R - 150, A.T + 6, [['이상 기체', T.figMuted, true], ['판데르발스', T.figAccent, false]]);
      // ② Z–P
      var B2 = axes(T, P[1], PMAX, ZMAX, [0, 100, 200, 300, 400, 500], [0, 0.5, 1.0, 1.5, 2.0], '압력 P (atm)', '압축 인자 Z',
        function (x) { return String(x); }, function (y) { return y.toFixed(1); });
      clipTo(B2);
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(B2.sx(0), B2.sy(1)); ctx.lineTo(B2.sx(PMAX), B2.sy(1)); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.4; ctx.beginPath(); started = false;
      for (i = 0; i <= 600; i++) {
        V = Math.exp(Math.log(60) - (Math.log(60) - Math.log(g.b * 1.03)) * i / 600);
        p = pv(V); if (p > PMAX * 1.05) break;
        var z = p * V / (R * st.T);
        if (started) ctx.lineTo(B2.sx(p), B2.sy(z)); else { ctx.moveTo(B2.sx(p), B2.sy(z)); started = true; }
      }
      ctx.stroke(); ctx.restore();
      dot(B2.sx(Math.min(v.pvdw, PMAX)), B2.sy(v.Z), T.figAccent, v.pvdw <= PMAX);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.textAlign = 'center'; ctx.fillText('이상 기체 Z = 1', B2.sx(250), B2.sy(1) - 6); ctx.textAlign = 'right';
      ctx.fillText('Z > 1: 분자 부피', B2.R - 4, B2.sy(1.85));
      ctx.fillText('Z < 1: 분자 사이 인력', B2.R - 4, B2.sy(0.12));
      // ③ 보정 막대
      bars(T, P[2], v);
    }
    function dot(x, y, c, on) { if (!on) return; ctx.fillStyle = c; ctx.strokeStyle = api.tokens().figPanel; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    function legend(T, x, y, items) {
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      items.forEach(function (it, i) {
        ctx.strokeStyle = it[1]; ctx.lineWidth = it[2] ? 1.6 : 2.4; ctx.setLineDash(it[2] ? [5, 4] : []);
        ctx.beginPath(); ctx.moveTo(x, y + i * 17 + 5); ctx.lineTo(x + 22, y + i * 17 + 5); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figInk; ctx.fillText(it[0], x + 28, y + i * 17 + 9);
      });
    }
    function bars(T, r, v) {
      var narrow = cv.w < 560;
      var items = [
        { t: '이상 기체 RT/Vₘ', val: v.pid, c: T.figMuted },
        { t: '부피 보정 +(RT/(Vₘ−b) − RT/Vₘ)', s: '부피 보정', val: v.prep - v.pid, c: T.figRed },
        { t: '인력 보정 −a/Vₘ²', s: '인력 보정', val: -v.attr, c: T.figBlue },
        { t: '판데르발스 P', val: v.pvdw, c: T.figAccent },
      ];
      var top = r.y + 18, rowH = Math.min(26, (r.h - 26) / 4), labW = narrow ? 92 : 220, L = r.x + labW + 8, Rr = r.x + r.w - 70;
      var mx = Math.max(v.pid, v.prep, 1);
      var sx = function (p) { return L + (p / mx) * (Rr - L); };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('Vₘ = ' + st.V.toFixed(3) + ' L/mol에서 압력을 나누어 보면 (atm)', r.x + 4, r.y + 8);
      var cum = 0;
      items.forEach(function (it, i) {
        var y = top + i * rowH, x0, x1;
        if (i === 0) { x0 = sx(0); x1 = sx(it.val); cum = it.val; }
        else if (i === 3) { x0 = sx(0); x1 = sx(it.val); }
        else { x0 = sx(cum); x1 = sx(cum + it.val); cum += it.val; }
        ctx.fillStyle = it.c; ctx.globalAlpha = i === 0 ? 0.5 : 0.85;
        ctx.fillRect(Math.min(x0, x1), y + 3, Math.max(1.5, Math.abs(x1 - x0)), rowH - 8);
        ctx.globalAlpha = 1;
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(narrow && it.s ? it.s : it.t, r.x + 4, y + rowH / 2 + 3);
        ctx.font = '12px ' + T.fontMono; ctx.fillStyle = it.c;
        ctx.fillText((it.val > 0 && (i === 1) ? '+' : '') + it.val.toFixed(1), Math.max(x0, x1) + 6, y + rowH / 2 + 3);
      });
    }
    api.onResize(draw);
    update();
  },
});
