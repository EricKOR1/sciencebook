/* 일반물리학 12 무한 퍼텐셜 우물: 파동 함수, 확률 밀도, 에너지 준위 E_n = n²h²/8mL² (전자) */
Sims.register('u-infinite-well', {
  title: '상자 속 전자 — 파동 함수, 확률 밀도, 에너지 준위',
  caption: '양자수 n과 우물 폭 L을 바꾸어 보자. 왼쪽은 우물(폭을 실제 비율로 그림)과 에너지 준위로, 세로축을 0~30 eV로 고정해 두었으므로 L을 줄이면 준위가 1/L²로 벌어져 위로 올라가는 것이 보인다. 오른쪽은 고른 상태의 파동 함수 ψ_n과 확률 밀도 |ψ_n|²이고, 색칠한 가운데 1/3 영역에서 전자를 발견할 확률을 함께 계산한다(고전적인 입자라면 늘 1/3). n이 커질수록 마디가 늘고 확률이 1/3에 가까워진다. 전자 한 개가 벽이 무한히 높은 1차원 상자에 갇힌 이상적인 모형이다.',
  init: function (api) {
    var E1C = 0.3760;   // h²/(8 m_e) 를 eV·nm² 로 나타낸 값
    var EMAX = 30;
    var s = { n: 1, L: 0.5, view: 'both' };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.4 : 0.55; }, label: '무한 퍼텐셜 우물의 에너지 준위와 파동 함수 그래프' });
    var ctx = cv.ctx;

    var rE = api.readout('E_n');
    var rE1 = api.readout('E₁ (바닥상태)');
    var rDE = api.readout('n → n−1 광자');
    var rP = api.readout('가운데 1/3 확률');
    var rNode = api.readout('마디(벽 제외)');

    api.slider({ id: 'u-infinite-well-n', label: '양자수 n', min: 1, max: 6, step: 1, value: 1,
      format: function (v) { return v; }, onInput: function (v) { s.n = v; update(); } });
    api.slider({ id: 'u-infinite-well-l', label: '우물 폭 L', min: 0.2, max: 2.0, step: 0.05, value: 0.5,
      format: function (v) { return v.toFixed(2) + ' nm'; }, onInput: function (v) { s.L = v; update(); } });
    var g = api.group();
    var views = [['both', 'ψ와 |ψ|² 함께'], ['psi', 'ψ만'], ['prob', '|ψ|²만']];
    var vb = views.map(function (v, i) {
      return api.button(v[1], function () { s.view = v[0]; vb.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); draw(); }, { toggle: true, pressed: i === 0, parent: g });
    });

    function En(n) { return n * n * E1C / (s.L * s.L); }
    function pMid(n) { return 1 / 3 - (Math.sin(4 * n * Math.PI / 3) - Math.sin(2 * n * Math.PI / 3)) / (2 * n * Math.PI); }
    function fmtE(e) { return e >= 100 ? e.toFixed(0) : e >= 10 ? e.toFixed(1) : e >= 1 ? e.toFixed(2) : e.toFixed(3); }
    function update() {
      rE.set(fmtE(En(s.n)) + ' eV (= ' + s.n * s.n + ' E₁)');
      rE1.set(fmtE(En(1)) + ' eV');
      if (s.n > 1) { var dE = En(s.n) - En(s.n - 1), lam = 1240 / dE; rDE.set(fmtE(dE) + ' eV, λ ≈ ' + (lam >= 1000 ? (lam / 1000).toFixed(2) + ' μm' : lam.toFixed(0) + ' nm')); }
      else rDE.set('– (바닥상태)');
      rP.set(pMid(s.n).toFixed(3) + ' (고전 0.333)');
      rNode.set((s.n - 1) + '개');
      draw();
    }
    function layout() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { lv: { x: 0, y: 0, w: w, h: h * 0.46 }, wf: { x: 0, y: h * 0.48, w: w, h: h * 0.52 } }
        : { lv: { x: 0, y: 0, w: w * 0.4, h: h }, wf: { x: w * 0.42, y: 0, w: w * 0.58, h: h } };
    }
    function draw() {
      var T = api.tokens(), P = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawLevels(T, P.lv); drawWave(T, P.wf);
    }
    function drawLevels(T, r) {
      var L = r.x + 50, R = r.x + r.w - 10, Tp = r.y + 26, B = r.y + r.h - 30;
      var sy = function (e) { return B - e / EMAX * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('에너지 준위 (세로축 고정)', r.x + 8, r.y + 16);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var e = 0; e <= EMAX; e += 5) { ctx.beginPath(); ctx.moveTo(L - 4, sy(e)); ctx.lineTo(L, sy(e)); ctx.stroke(); ctx.fillText(e, L - 6, sy(e) + 4); }
      ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.stroke();
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('에너지 (eV)', 0, 0); ctx.restore();
      // 우물: 폭 2.0 nm 를 가용 폭으로
      var avail = R - L - 70, ww = Math.max(14, avail * s.L / 2.0), cx = L + 16 + avail / 2, x0 = cx - ww / 2, x1 = cx + ww / 2;
      ctx.fillStyle = T.figSoftAmber;
      ctx.fillRect(x0 - 12, Tp, 12, B - Tp); ctx.fillRect(x1, Tp, 12, B - Tp);
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, Tp); ctx.lineTo(x0, B); ctx.lineTo(x1, B); ctx.lineTo(x1, Tp); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('L = ' + s.L.toFixed(2) + ' nm', cx, B + 14);
      // 준위
      var shown = 0, n = 1;
      while (En(n) <= EMAX && n < 60) {
        var y = sy(En(n)), sel = n === s.n;
        ctx.strokeStyle = sel ? T.figRed : T.figAccent; ctx.lineWidth = sel ? 3 : 1.3;
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
        if (n <= 6 && (sel || En(n) - (n > 1 ? En(n - 1) : -99) > EMAX * 0.035)) {
          ctx.fillStyle = sel ? T.figRed : T.figInk; ctx.font = (sel ? '600 ' : '') + '11px ' + T.fontBody; ctx.textAlign = 'left';
          ctx.fillText('n=' + n, x1 + 16, y + 4);
        }
        shown++; n++;
      }
      if (En(s.n) > EMAX) {
        ctx.fillStyle = T.figRed; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('↑ n=' + s.n + ' 은 ' + fmtE(En(s.n)) + ' eV (축 위)', cx, Tp - 4 > r.y + 20 ? Tp + 12 : Tp + 12);
      }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('30 eV 아래 준위 ' + shown + '개', L + 6, Tp + 12 + (En(s.n) > EMAX ? 16 : 0));
    }
    function drawWave(T, r) {
      var L = r.x + 40, R = r.x + r.w - 14, Tp = r.y + 34, B = r.y + r.h - 34;
      var sx = function (u) { return L + u * (R - L); };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('n = ' + s.n + ' 상태 (가로축: 우물 속 위치 x/L)', r.x + 8, r.y + 16);
      // 가운데 1/3
      ctx.fillStyle = T.figSoftGreen; ctx.fillRect(sx(1 / 3), Tp, sx(2 / 3) - sx(1 / 3), B - Tp);
      ctx.fillStyle = T.figGreen; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('P = ' + pMid(s.n).toFixed(3), sx(0.5), Tp - 6);
      // 벽
      ctx.fillStyle = T.figSoftAmber; ctx.fillRect(L - 10, Tp, 10, B - Tp); ctx.fillRect(R, Tp, 10, B - Tp);
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.moveTo(R, Tp); ctx.lineTo(R, B); ctx.stroke();
      var mid = (Tp + B) / 2, amp = (B - Tp) / 2 - 6;
      var both = s.view === 'both';
      var base = s.view === 'prob' ? B - 4 : mid;
      // 축
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(L, base); ctx.lineTo(R, base); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      ['0', '1/3', '2/3', '1'].forEach(function (t, i) { ctx.fillText(t, sx(i / 3), B + 14); });
      // |ψ|² (최댓값 2/L 을 칸 높이에 맞춤)
      if (s.view !== 'psi') {
        var pAmp = s.view === 'prob' ? (B - Tp) - 12 : amp;
        var pBase = s.view === 'prob' ? B - 4 : mid;
        ctx.beginPath(); ctx.moveTo(sx(0), pBase);
        for (var i = 0; i <= 300; i++) { var u = i / 300, v = Math.pow(Math.sin(s.n * Math.PI * u), 2); ctx.lineTo(sx(u), pBase - v * pAmp); }
        ctx.lineTo(sx(1), pBase); ctx.closePath();
        ctx.fillStyle = T.figSoftViolet; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = T.figViolet; ctx.lineWidth = 2; ctx.stroke();
      }
      if (s.view !== 'prob') {
        ctx.beginPath();
        for (var j = 0; j <= 300; j++) { var u2 = j / 300, v2 = Math.sin(s.n * Math.PI * u2); if (j === 0) ctx.moveTo(sx(u2), mid - v2 * amp); else ctx.lineTo(sx(u2), mid - v2 * amp); }
        ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.4; ctx.stroke();
        // 마디
        ctx.fillStyle = T.figRed;
        for (var k = 1; k < s.n; k++) { ctx.beginPath(); ctx.arc(sx(k / s.n), mid, 4, 0, Math.PI * 2); ctx.fill(); }
      }
      // 범례
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      var ly = B - 6;
      if (s.view !== 'prob') { ctx.fillStyle = T.figAccent; ctx.fillText('ψ_n = √(2/L) sin(nπx/L)', R - 4, Tp + 12); }
      if (s.view !== 'psi') { ctx.fillStyle = T.figViolet; ctx.fillText('|ψ_n|² (넓이 = 1)', R - 4, s.view === 'prob' ? Tp + 12 : Tp + 26); }
      if (s.view !== 'prob' && s.n > 1) { ctx.fillStyle = T.figRed; ctx.textAlign = 'left'; ctx.fillText('● 마디', L + 4, ly); }
    }
    api.onResize(draw);
    update();
  },
});
