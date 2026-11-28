/* 유기화학 14: 변광회전 따라가기 — α ⇌ β 1차 가역 반응, [α]t = 성분 비선광도의 가중 평균, ln([α]t − [α]eq) 직선, A값만으로 예측한 K 와 비교 */
Sims.register('mj-mutarotation', {
  title: '변광회전 따라가기 — α ⇌ β 평형으로 가는 비선광도',
  caption: '처음 시료(순수 α, 순수 β, 임의 비율), 정반응 속도 상수 k(α→β), 평형 상수 K = [β]/[α], 당을 바꿔 보자. α ⇌ β를 1차 가역 반응으로 보면 β 분율은 x(t) = x_eq + (x₀ − x_eq)e^(−(k정 + k역)t), x_eq = K/(1 + K), k역 = k정/K이고, 비선광도는 두 아노머 비선광도의 몰분율 가중 평균 [α]t = [α]α(1 − x) + [α]β·x이다. 그래서 ln|[α]t − [α]eq|를 시간에 대해 그리면 기울기 −(k정 + k역)인 직선이 된다. 회색 점선은 OH의 A값(3.9 kJ/mol)만으로 예측한 K ≈ 4.8의 평형값으로, 실제 평형값과의 차이가 아노머 효과의 크기를 보여 준다. 사슬형·퓨라노스(1 % 미만)는 무시했고 25 ℃ 물 기준이다.',
  init: function (api) {
    var SUG = [
      { n: '글루코스', a: 112.2, b: 18.7, K: 1.75 },
      { n: '갈락토스', a: 150.7, b: 52.8, K: 2.57 }
    ];
    var R = 8.314, TK = 298.15, KA = Math.exp(3900 / (R * TK));
    var st = { s: 0, x0: 0, k: 0.01, K: 1.75, t: 60 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.45 : 0.62; }, label: '시간에 따른 비선광도와 아노머 분율, ln(차이) 대 시간 직선' });
    var ctx = cv.ctx;
    var rEq = api.readout('평형  '), rK = api.readout('속도  '), rT = api.readout('선택한 시각  ');
    var gS = api.group();
    var sb = SUG.map(function (s, i) {
      return api.button(s.n + ' (α ' + s.a + ', β ' + s.b + ')', function () { st.s = i; skK.set(s.K); sync(); draw(); }, { toggle: true, pressed: i === 0, parent: gS });
    });
    var gX = api.group();
    var b1 = api.button('순수 α', function () { sx.set(0); }, { parent: gX });
    var b2 = api.button('순수 β', function () { sx.set(1); }, { parent: gX });
    var sx = api.slider({ id: 'mj-mutarotation-x0', label: '처음 β 분율 x₀', min: 0, max: 1, step: 0.01, value: 0,
      format: function (v) { return v.toFixed(2) + (v === 0 ? ' (순수 α)' : v === 1 ? ' (순수 β)' : ''); }, onInput: function (v) { st.x0 = v; draw(); } });
    api.slider({ id: 'mj-mutarotation-k', label: '정반응 속도 상수 k(α→β)', min: 0.001, max: 0.05, step: 0.001, value: st.k,
      format: function (v) { return v.toFixed(3) + ' min⁻¹'; }, onInput: function (v) { st.k = v; draw(); } });
    var skK = api.slider({ id: 'mj-mutarotation-K', label: '평형 상수 K = [β]/[α]', min: 0.5, max: 3, step: 0.01, value: st.K,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.K = v; draw(); } });
    api.slider({ id: 'mj-mutarotation-t', label: '읽을 시각 t', min: 0, max: 300, step: 1, value: st.t,
      format: function (v) { return v.toFixed(0) + ' min'; }, onInput: function (v) { st.t = v; draw(); } });
    function sync() { sb.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === st.s)); }); }

    function model() {
      var S = SUG[st.s], kr = st.k / st.K, ks = st.k + kr, xe = st.K / (1 + st.K);
      return { S: S, kr: kr, ks: ks, xe: xe,
        x: function (t) { return xe + (st.x0 - xe) * Math.exp(-ks * t); },
        rot: function (x) { return S.a * (1 - x) + S.b * x; } };
    }
    function axes(T, x0, y0, w, h, xr, yr, xl, yl, yt) {
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      for (var t = 0; t <= 300; t += 60) { var X = x0 + t / 300 * w; ctx.beginPath(); ctx.moveTo(X, y0); ctx.lineTo(X, y0 + h); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText(String(t), X, y0 + h + 13); }
      yt.forEach(function (v) { var Y = y0 + h - (v - yr[0]) / (yr[1] - yr[0]) * h; ctx.beginPath(); ctx.moveTo(x0, Y); ctx.lineTo(x0 + w, Y); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(String(v), x0 - 4, Y + 4); });
      ctx.strokeStyle = T.figLine; ctx.strokeRect(x0, y0, w, h);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      if (xl) ctx.fillText(xl, x0 + w / 2, y0 + h + 27);
      ctx.save(); ctx.translate(x0 - 34, y0 + h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(yl, 0, 0); ctx.restore();
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, M = model(), S = M.S;
      ctx.clearRect(0, 0, w, h);
      var narrow = w < 560;
      var L = 48, W1 = narrow ? w - L - 12 : w * 0.6 - L, H1 = narrow ? h * 0.27 : h * 0.4, T1 = 18;
      var T2 = T1 + H1 + 40, H2 = narrow ? h * 0.18 : h * 0.3;
      var X = function (t) { return L + t / 300 * W1; };
      // ① 비선광도
      var ymin = Math.floor((Math.min(S.a, S.b) - 10) / 20) * 20, ymax = Math.ceil((Math.max(S.a, S.b) + 10) / 20) * 20;
      var yt = []; for (var v = ymin; v <= ymax; v += 20) yt.push(v);
      var Y1 = function (r) { return T1 + H1 - (r - ymin) / (ymax - ymin) * H1; };
      axes(T, L, T1, W1, H1, [0, 300], [ymin, ymax], null, '비선광도 [α]t', yt);
      var req = M.rot(M.xe), rA = M.rot(KA / (1 + KA));
      ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5;
      ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(L, Y1(req)); ctx.lineTo(L + W1, Y1(req)); ctx.stroke();
      ctx.strokeStyle = T.figMuted; ctx.beginPath(); ctx.moveTo(L, Y1(rA)); ctx.lineTo(L + W1, Y1(rA)); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = T.figViolet; ctx.lineWidth = 3; ctx.beginPath();
      for (var i = 0; i <= 300; i++) { var yy = Y1(M.rot(M.x(i))); if (i) ctx.lineTo(X(i), yy); else ctx.moveTo(X(i), yy); }
      ctx.stroke();
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillStyle = T.figInk; ctx.fillText('평형 ' + req.toFixed(1), L + W1 - 4, Y1(req) + (req > rA ? -5 : 13));
      ctx.fillStyle = T.figMuted; ctx.fillText('A값만의 예측 ' + rA.toFixed(1) + ' (K ≈ ' + KA.toFixed(1) + ')', L + W1 - 4, Y1(rA) + (req > rA ? 13 : -5));
      // ② 분율
      var Y2 = function (f) { return T2 + H2 - f * H2; };
      axes(T, L, T2, W1, H2, [0, 300], [0, 1], '시간 t (min)', '분율', [0, 0.5, 1]);
      [[function (t) { return 1 - M.x(t); }, T.figRed, 'α'], [function (t) { return M.x(t); }, T.figBlue, 'β']].forEach(function (c) {
        ctx.strokeStyle = c[1]; ctx.lineWidth = 2.5; ctx.beginPath();
        for (var i = 0; i <= 300; i++) { var yy = Y2(c[0](i)); if (i) ctx.lineTo(X(i), yy); else ctx.moveTo(X(i), yy); }
        ctx.stroke(); ctx.fillStyle = c[1]; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(c[2], X(300) + 3 - 14, Y2(c[0](300)) - 5);
      });
      // 시각 커서
      [[T1, H1], [T2, H2]].forEach(function (p) { ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(st.t), p[0]); ctx.lineTo(X(st.t), p[0] + p[1]); ctx.stroke(); });
      var xt = M.x(st.t), rt = M.rot(xt);
      ctx.fillStyle = T.figViolet; ctx.beginPath(); ctx.arc(X(st.t), Y1(rt), 5, 0, 7); ctx.fill();
      // ③ ln 차이 대 t
      var L3, T3, W3, H3;
      if (narrow) { L3 = L; T3 = T2 + H2 + 52; W3 = W1; H3 = h - T3 - 34; } else { L3 = w * 0.6 + 52; T3 = T1; W3 = w - L3 - 14; H3 = T2 + H2 - T1; }
      var d0 = Math.abs(M.rot(st.x0) - req);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      if (d0 < 0.05) {
        ctx.strokeStyle = T.figLine; ctx.strokeRect(L3, T3, W3, H3);
        ctx.fillText('처음부터 평형 조성 — 변화 없음', L3 + W3 / 2, T3 + H3 / 2);
      } else {
        var lnmax = Math.ceil(Math.log(d0)), lnmin = Math.floor(Math.log(d0) - M.ks * 300);
        lnmin = Math.max(lnmin, lnmax - 12);
        var Y3 = function (v) { return T3 + H3 - (v - lnmin) / (lnmax - lnmin) * H3; };
        var X3 = function (t) { return L3 + t / 300 * W3; };
        ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
        var stp = Math.max(1, Math.round((lnmax - lnmin) / 5));
        for (var v2 = lnmin; v2 <= lnmax; v2 += stp) { ctx.beginPath(); ctx.moveTo(L3, Y3(v2)); ctx.lineTo(L3 + W3, Y3(v2)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(String(v2), L3 - 4, Y3(v2) + 4); }
        for (var t3 = 0; t3 <= 300; t3 += 100) { ctx.textAlign = 'center'; ctx.fillText(String(t3), X3(t3), T3 + H3 + 13); }
        ctx.strokeStyle = T.figLine; ctx.strokeRect(L3, T3, W3, H3);
        ctx.save(); ctx.beginPath(); ctx.rect(L3, T3, W3, H3); ctx.clip();
        ctx.strokeStyle = T.figGreen; ctx.lineWidth = 2.5; ctx.beginPath();
        for (var i3 = 0; i3 <= 300; i3 += 2) { var dd = Math.abs(M.rot(M.x(i3)) - req); var yy3 = Y3(Math.log(dd)); if (i3) ctx.lineTo(X3(i3), yy3); else ctx.moveTo(X3(i3), yy3); }
        ctx.stroke(); ctx.restore();
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('시간 t (min)', L3 + W3 / 2, T3 + H3 + 27);
        ctx.save(); ctx.translate(L3 - 32, T3 + H3 / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('ln|[α]t − [α]eq|', 0, 0); ctx.restore();
        ctx.fillStyle = T.figGreen; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right';
        ctx.fillText('기울기 = −(k정 + k역) = ' + (-M.ks).toFixed(4) + ' min⁻¹', L3 + W3 - 4, T3 + 15);
      }
      var dG = -R * TK * Math.log(st.K) / 1000, dGA = -3.9;
      rEq.set('x_β = ' + M.xe.toFixed(3) + ' (α : β = ' + Math.round(100 * (1 - M.xe)) + ' : ' + Math.round(100 * M.xe) + ') · [α]eq = ' + req.toFixed(1) +
        ' · ΔG° = ' + dG.toFixed(2) + ' kJ/mol (A값만: ' + dGA.toFixed(1) + ', 차이 ≈ ' + Math.abs(dGA - dG).toFixed(1) + ' = 아노머 효과)');
      rK.set('k정 = ' + st.k.toFixed(3) + ', k역 = k정/K = ' + M.kr.toFixed(4) + ' min⁻¹ · 반감기 ln2/(k정 + k역) = ' + (Math.LN2 / M.ks).toFixed(0) + ' min');
      rT.set('t = ' + st.t + ' min: [α]t = ' + rt.toFixed(1) + ', α ' + (100 * (1 - xt)).toFixed(1) + ' % / β ' + (100 * xt).toFixed(1) + ' %');
    }
    api.onResize(draw);
    draw();
  },
});
