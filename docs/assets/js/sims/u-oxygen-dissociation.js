/* 일반생명과학 11 산소 해리 곡선: 힐 식, pH·온도에 따른 곡선 이동(보어 효과), 폐와 조직 분압 사이에서 내놓는 산소, 태아 Hb·미오글로빈 비교 */
Sims.register('u-oxygen-dissociation', {
  title: '산소 해리 곡선 — 조직은 산소를 얼마나 받을까',
  caption: '조직의 pH·온도·산소 분압을 바꿔 보자. pH가 낮아지고 온도가 오르면 곡선이 오른쪽으로 옮겨 가(P50 증가) 같은 분압에서 산소를 더 내놓는다. 동맥혈의 포화도는 폐(pH 7.4, 37 °C)에서 정해진다고 보고, 내놓는 산소 = 20.1 mL/dL × (동맥혈 포화도 − 조직 포화도)로 계산했다(녹은 산소는 무시). 곡선은 힐 식 S = Pⁿ/(Pⁿ + P50ⁿ), 성인 Hb n = 2.7·P50 = 26.8 mmHg, 이동은 log P50이 pH 1당 0.48 감소·1 °C당 0.024 증가한다는 어림식을 썼다. 태아 Hb(P50 ≈ 19)와 미오글로빈(P50 ≈ 2.8, n = 1)은 비교용 곡선이다.',
  init: function (api) {
    var N = 2.7, P50STD = 26.8, CAP = 20.1;
    var st = { pH: 7.4, T: 37, pt: 40, pa: 100, fetal: false, myo: false };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.56; }, label: '헤모글로빈 산소 해리 곡선과 폐·조직의 산소 분압' });
    var ctx = cv.ctx;
    var rP50 = api.readout('조직 곡선 P50');
    var rSa = api.readout('동맥혈 포화도');
    var rSv = api.readout('조직 포화도');
    var rU = api.readout('내놓는 O₂');

    api.slider({ id: 'u-oxygen-dissociation-ph', label: '조직 pH', min: 7.0, max: 7.6, step: 0.01, value: st.pH,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.pH = v; draw(); } });
    api.slider({ id: 'u-oxygen-dissociation-t', label: '조직 온도', min: 35, max: 41, step: 0.5, value: st.T,
      format: function (v) { return v.toFixed(1) + ' °C'; }, onInput: function (v) { st.T = v; draw(); } });
    api.slider({ id: 'u-oxygen-dissociation-pt', label: '조직 Po₂', min: 5, max: 60, step: 1, value: st.pt,
      format: function (v) { return v + ' mmHg'; }, onInput: function (v) { st.pt = v; draw(); } });
    api.slider({ id: 'u-oxygen-dissociation-pa', label: '폐포 Po₂', min: 30, max: 110, step: 1, value: st.pa,
      format: function (v) { return v + ' mmHg'; }, onInput: function (v) { st.pa = v; draw(); } });
    var g = api.group();
    api.button('태아 Hb 곡선', function (b) { st.fetal = !st.fetal; b.setAttribute('aria-pressed', st.fetal); draw(); }, { toggle: true, parent: g });
    api.button('미오글로빈 곡선', function (b) { st.myo = !st.myo; b.setAttribute('aria-pressed', st.myo); draw(); }, { toggle: true, parent: g });

    function hill(P, p50, n) { return P <= 0 ? 0 : Math.pow(P, n) / (Math.pow(P, n) + Math.pow(p50, n)); }
    function p50t() { return P50STD * Math.pow(10, -0.48 * (st.pH - 7.4) + 0.024 * (st.T - 37)); }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var fs = narrow ? 11 : 13;
      var L = narrow ? 44 : 64, R = w - (narrow ? 46 : 66), Tp = 20, B = h - (narrow ? 44 : 48);
      var PMAX = 120;
      var X = function (p) { return L + p / PMAX * (R - L); };
      var Y = function (s) { return B - s * (B - Tp); };
      // 격자
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      ctx.textAlign = 'right';
      [0, 0.25, 0.5, 0.75, 1].forEach(function (s) { ctx.beginPath(); ctx.moveTo(L, Y(s)); ctx.lineTo(R, Y(s)); ctx.stroke(); ctx.fillText(Math.round(s * 100), L - 6, Y(s) + 4); });
      ctx.textAlign = 'left';
      [0, 5, 10, 15, 20].forEach(function (c) { ctx.fillText(c, R + 6, Y(c / CAP) + 4); });
      ctx.textAlign = 'center';
      for (var p = 0; p <= PMAX; p += 20) { ctx.beginPath(); ctx.moveTo(X(p), B); ctx.lineTo(X(p), B + 4); ctx.stroke(); ctx.fillText(p, X(p), B + 16); }
      ctx.fillStyle = T.figInk; ctx.font = fs + 'px ' + T.fontBody;
      ctx.fillText('산소 분압 Po₂ (mmHg)', (L + R) / 2, B + 34);
      ctx.save(); ctx.translate(narrow ? 12 : 18, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('헤모글로빈 포화도 (%)', 0, 0); ctx.restore();
      ctx.save(); ctx.translate(w - (narrow ? 8 : 14), (Tp + B) / 2); ctx.rotate(Math.PI / 2); ctx.fillText('O₂ 함량 (mL/dL)', 0, 0); ctx.restore();

      function curve(p50, n, col, lw, dash) {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []);
        ctx.beginPath();
        for (var i = 0; i <= 240; i++) { var P = PMAX * i / 240, x = X(P), y = Y(hill(P, p50, n)); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      var p50 = p50t();
      if (st.myo) curve(2.8, 1, T.figTeal, 2, [2, 3]);
      if (st.fetal) curve(19, N, T.figViolet, 2, [7, 4]);
      curve(P50STD, N, T.figLine, 2);
      curve(p50, N, T.figAccent, 3);

      // 폐·조직 분압 세로선
      function vline(p, col, label, up) {
        ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(X(p), B); ctx.lineTo(X(p), Tp); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = col; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(label, X(p), B - 6 - (up ? fs + 4 : 0));
      }
      vline(st.pa, T.figBlue, '폐', false);
      vline(st.pt, T.figRed, '조직', Math.abs(st.pa - st.pt) < 12);

      var Sa = hill(st.pa, P50STD, N), Sv = hill(st.pt, p50, N);
      var unload = Math.max(0, CAP * (Sa - Sv));
      // 점
      function dot(p, s, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(p), Y(s), 5.5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = T.figPanel; ctx.lineWidth = 1.5; ctx.stroke(); }
      // 동맥 포화도 수평선을 조직 위치까지
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(X(st.pt), Y(Sa)); ctx.lineTo(X(st.pa), Y(Sa)); ctx.stroke(); ctx.setLineDash([]);
      // 내놓는 산소 막대
      if (Sa > Sv) {
        var bx = X(st.pt) - 9;
        ctx.fillStyle = T.figSoftRed; ctx.fillRect(bx, Y(Sa), 18, Y(Sv) - Y(Sa));
        ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.5; ctx.strokeRect(bx, Y(Sa), 18, Y(Sv) - Y(Sa));
      }
      dot(st.pa, Sa, T.figBlue); dot(st.pt, Sv, T.figRed);

      // 범례
      var items = [[T.figLine, [], '기준: pH 7.4, 37 °C'], [T.figAccent, [], '조직 조건의 곡선']];
      if (st.fetal) items.push([T.figViolet, [7, 4], '태아 Hb']);
      if (st.myo) items.push([T.figTeal, [2, 3], '미오글로빈']);
      var lx = narrow ? L + (R - L) * 0.5 : L + (R - L) * 0.62, ly = B - 22 - items.length * (fs + 7) - (narrow ? 10 : 30);
      ctx.fillStyle = T.figPanel; ctx.globalAlpha = 0.9; ctx.fillRect(lx - 6, ly - fs - 2, R - lx + 2, items.length * (fs + 7) + 8); ctx.globalAlpha = 1;
      ctx.font = fs + 'px ' + T.fontBody; ctx.textAlign = 'left';
      items.forEach(function (it, i) {
        var y = ly + i * (fs + 7);
        ctx.strokeStyle = it[0]; ctx.lineWidth = 3; ctx.setLineDash(it[1]);
        ctx.beginPath(); ctx.moveTo(lx, y - fs / 3); ctx.lineTo(lx + 22, y - fs / 3); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figInk; ctx.fillText(it[2], lx + 28, y);
      });

      if (Sa > Sv) {
        ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'left';
        var ty = (Y(Sa) + Y(Sv)) / 2 + 4, tx = X(st.pt) + 15, tw = Math.max(ctx.measureText('내놓는 O₂').width, ctx.measureText(unload.toFixed(1) + ' mL/dL').width);
        if (tx + tw > R) tx = X(st.pt) - 15 - tw;
        ctx.fillStyle = T.figPanel; ctx.globalAlpha = 0.9; ctx.fillRect(tx - 3, ty - fs * 1.5 - 4, tw + 6, 2 * fs + 12); ctx.globalAlpha = 1;
        ctx.fillStyle = T.figRed;
        ctx.fillText('내놓는 O₂', tx, ty - fs / 2 - 2);
        ctx.fillText(unload.toFixed(1) + ' mL/dL', tx, ty + fs / 2 + 2);
      }

      rP50.set(p50.toFixed(1) + ' mmHg');
      rSa.set((Sa * 100).toFixed(1) + ' %');
      rSv.set((Sv * 100).toFixed(1) + ' %');
      rU.set(unload.toFixed(1) + ' mL/dL (' + (Sa > 0 ? Math.round(100 * Math.max(0, Sa - Sv) / Sa) : 0) + '%)');
    }
    api.onResize(draw);
    draw();
  },
});
