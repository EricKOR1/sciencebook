/* 물리화학 10 분자 분광학: 이원자 분자의 진동–회전 스펙트럼 만들기 — P·R 가지, 온도와 B₁/B₀ */
Sims.register('mj-rovib-spectrum', {
  title: '진동–회전 스펙트럼 만들기 — P 가지와 R 가지',
  caption: '온도, 회전 상수 B₀, B₁/B₀ 비를 바꾸며 기본음 띠(ν̃₀ = 2886 cm⁻¹ 고정)의 모양을 보자. 아래 막대에 마우스를 올리거나(손가락으로 누르면) 그 선의 전이가 위 사다리에 화살표로 강조된다. ' +
    '온도를 올리면 세기 봉우리가 바깥쪽(높은 J)으로 옮겨 가고, B₁/B₀ = 1이면 선이 등간격이 되며, B₁ < B₀이면 R 가지는 좁아지고 P 가지는 넓어진다. 띠 중심에는 ΔJ = 0이 금지되어 선이 없다. ' +
    '선 세기는 아래 준위의 개체 수 (2J+1)exp(−hcB₀J(J+1)/kT)에만 비례한다고 단순화했고(전이 모멘트의 J 의존성, 원심력 뒤틀림은 무시), 동위 원소 쌍은 H³⁷Cl처럼 존재비 1/3, 중심 −2.1 cm⁻¹, B를 환산 질량 비만큼 줄여 그렸다.',
  init: function (api) {
    var NU0 = 2886, C2 = 1.4388;
    var st = { T: 300, B0: 10.44, r: 0.971, iso: false, hover: null };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.62; }, label: '진동–회전 준위 사다리와 막대 스펙트럼' });
    var ctx = cv.ctx;
    var rJ = api.readout('가장 센 R 선'), rGap = api.readout('R(0) − P(1)'), rSel = api.readout('강조한 선');
    api.slider({ id: 'mj-rovib-spectrum-T', label: '온도 T', min: 50, max: 1500, step: 10, value: st.T,
      format: function (v) { return v.toFixed(0) + ' K'; }, onInput: function (v) { st.T = v; draw(); } });
    api.slider({ id: 'mj-rovib-spectrum-B', label: '회전 상수 B₀', min: 1, max: 20, step: 0.01, value: st.B0,
      format: function (v) { return v.toFixed(2) + ' cm⁻¹'; }, onInput: function (v) { st.B0 = v; st.hover = null; draw(); } });
    api.slider({ id: 'mj-rovib-spectrum-r', label: 'B₁/B₀', min: 0.95, max: 1.0, step: 0.001, value: st.r,
      format: function (v) { return v.toFixed(3); }, onInput: function (v) { st.r = v; draw(); } });
    var isoBtn = api.button('동위 원소 쌍(³⁷Cl) 보이기', function () { st.iso = !st.iso; isoBtn.setAttribute('aria-pressed', st.iso ? 'true' : 'false'); draw(); }, { toggle: true, pressed: false });

    function pop(J) { return (2 * J + 1) * Math.exp(-C2 * st.B0 * J * (J + 1) / st.T); }
    function lines() {
      var B0 = st.B0, B1 = st.B0 * st.r, out = [], pmax = 0, J;
      for (J = 0; J < 200; J++) pmax = Math.max(pmax, pop(J));
      for (J = 0; J < 200; J++) {
        var p = pop(J) / pmax;
        if (p < 0.004 && C2 * B0 * J * (J + 1) / st.T > 1) break;
        out.push({ br: 'R', J: J, nu: NU0 + B1 * (J + 1) * (J + 2) - B0 * J * (J + 1), I: p });
        if (J >= 1) out.push({ br: 'P', J: J, nu: NU0 + B1 * (J - 1) * J - B0 * J * (J + 1), I: p });
      }
      return out;
    }
    function isoLines(L) {
      var q = 0.99848, B0 = st.B0 * q, B1 = st.B0 * st.r * q;
      return L.map(function (l) {
        var J = l.J, nu = l.br === 'R' ? NU0 - 2.1 + B1 * (J + 1) * (J + 2) - B0 * J * (J + 1) : NU0 - 2.1 + B1 * (J - 1) * J - B0 * J * (J + 1);
        return { nu: nu, I: l.I / 3 };
      });
    }
    var geo = null;
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var L = lines(), lo = Infinity, hi = -Infinity;
      L.forEach(function (l) { lo = Math.min(lo, l.nu); hi = Math.max(hi, l.nu); });
      var pad = Math.max(4 * st.B0, (hi - lo) * 0.04);
      lo -= pad; hi += pad;
      var top = { y0: 8, y1: h * 0.46 }, sp = { x0: 46, x1: w - 14, y0: h * 0.54, y1: h - 40 };
      var sx = function (nu) { return sp.x0 + (nu - lo) / (hi - lo) * (sp.x1 - sp.x0); };
      var sy = function (I) { return sp.y1 - I * (sp.y1 - sp.y0) * 0.88; };
      geo = { L: L, sx: sx, sp: sp };
      // 강조할 선
      var sel = st.hover;
      if (!sel || !L.some(function (l) { return l.br === sel.br && l.J === sel.J; })) {
        var best = null; L.forEach(function (l) { if (l.br === 'R' && (!best || l.I > best.I)) best = l; }); sel = best;
      }
      // 축
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sp.x0, sp.y1); ctx.lineTo(sp.x1, sp.y1); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      var step = niceStep((hi - lo) / 6);
      for (var t = Math.ceil(lo / step) * step; t <= hi; t += step) {
        ctx.beginPath(); ctx.moveTo(sx(t), sp.y1); ctx.lineTo(sx(t), sp.y1 + 4); ctx.stroke();
        ctx.fillText(t.toFixed(0), sx(t), sp.y1 + 16);
      }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.fillText('파수 ν̃ / cm⁻¹', (sp.x0 + sp.x1) / 2, sp.y1 + 32);
      // 띠 중심
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figLine; ctx.beginPath(); ctx.moveTo(sx(NU0), sp.y0 - 4); ctx.lineTo(sx(NU0), sp.y1); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.fillText('ν̃₀ (선 없음)', sx(NU0), sp.y0 - 8);
      ctx.textAlign = 'left'; ctx.fillStyle = T.figAccent; ctx.fillText('← P 가지', sp.x0 + 2, sp.y0 + 4);
      ctx.textAlign = 'right'; ctx.fillText('R 가지 →', sp.x1 - 2, sp.y0 + 4);
      if (st.iso) isoLines(L).forEach(function (l) { bar(sx(l.nu), sy(l.I), T.figAmber, 1.6); });
      L.forEach(function (l) {
        var on = sel && l.br === sel.br && l.J === sel.J;
        bar(sx(l.nu), sy(l.I), on ? T.figRed : T.figAccent, on ? 3.4 : 2.2);
      });
      function bar(x, y, col, lw) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x, sp.y1); ctx.lineTo(x, y); ctx.stroke(); }
      if (sel) { ctx.fillStyle = T.figRed; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText(sel.br + '(' + sel.J + ')', sx(sel.nu), sy(sel.I) - 6); }
      drawLadder(T, top, w, sel);
      // 읽기
      var bestR = null; L.forEach(function (l) { if (l.br === 'R' && (!bestR || l.I > bestR.I)) bestR = l; });
      rJ.set('R(' + bestR.J + ')');
      var r0 = L.filter(function (l) { return l.br === 'R' && l.J === 0; })[0], p1 = L.filter(function (l) { return l.br === 'P' && l.J === 1; })[0];
      rGap.set(r0 && p1 ? (r0.nu - p1.nu).toFixed(1) + ' cm⁻¹ ≈ 4B' : '–');
      rSel.set(sel ? sel.br + '(' + sel.J + ') ' + sel.nu.toFixed(1) + ' cm⁻¹' : '–');
    }
    function drawLadder(T, r, w, sel) {
      var JM = 6, B0 = st.B0, B1 = B0 * st.r;
      var x0 = 70, x1 = w - 90, hh = (r.y1 - r.y0);
      var lowBase = r.y1 - 6, upBase = r.y0 + hh * 0.42, span = hh * 0.36;
      var kk = span / (B0 * JM * (JM + 1));
      function yl(J) { return lowBase - kk * B0 * J * (J + 1); }
      function yu(J) { return upBase - kk * B1 * J * (J + 1); }
      ctx.font = '11px ' + T.fontBody;
      for (var J = 0; J <= JM; J++) {
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x0, yl(J)); ctx.lineTo(x1, yl(J)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x0, yu(J)); ctx.lineTo(x1, yu(J)); ctx.stroke();
        ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
        if (J % 2 === 0 && J > 0) { ctx.fillText('J=' + J, x1 + 4, yl(J) + 4); ctx.fillText('J=' + J, x1 + 4, yu(J) + 4); }
      }
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('v = 0', x0 - 6, yl(0) + 4); ctx.fillText('v = 1', x0 - 6, yu(0) + 4);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
      ctx.fillText('(간격 ν̃₀는 줄여 그림)', x0, (yl(JM) + yu(0)) / 2 + 4);
      if (!sel) return;
      var Jl = sel.J, Ju = sel.br === 'R' ? sel.J + 1 : sel.J - 1;
      var xa = x0 + (x1 - x0) * (sel.br === 'R' ? 0.62 : 0.38);
      if (Jl > JM || Ju > JM) {
        ctx.fillStyle = T.figRed; ctx.textAlign = 'center'; ctx.fillText(sel.br + '(' + sel.J + '): J > ' + JM + '라 사다리 밖', xa, upBase - span - 2 < r.y0 + 12 ? r.y0 + 12 : upBase - span - 2);
        return;
      }
      ctx.strokeStyle = T.figRed; ctx.fillStyle = T.figRed; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(xa, yl(Jl)); ctx.lineTo(xa, yu(Ju) + 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xa, yu(Ju)); ctx.lineTo(xa - 5, yu(Ju) + 9); ctx.lineTo(xa + 5, yu(Ju) + 9); ctx.closePath(); ctx.fill();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('J ' + Jl + ' → ' + Ju, xa + 8, (yl(Jl) + yu(Ju)) / 2 + 14);
    }
    function niceStep(x) { var p = Math.pow(10, Math.floor(Math.log10(x))), m = x / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }
    function pick(ev) {
      if (!geo) return;
      var rect = cv.canvas.getBoundingClientRect(), x = ev.clientX - rect.left, y = ev.clientY - rect.top;
      if (y < geo.sp.y0 - 20) return;
      var best = null, bd = 1e9;
      geo.L.forEach(function (l) { var d = Math.abs(geo.sx(l.nu) - x); if (d < bd) { bd = d; best = l; } });
      if (best && bd < 20) { st.hover = { br: best.br, J: best.J }; draw(); }
    }
    cv.canvas.addEventListener('mousemove', pick);
    cv.canvas.addEventListener('click', pick);
    api.onResize(draw);
    draw();
  },
});
