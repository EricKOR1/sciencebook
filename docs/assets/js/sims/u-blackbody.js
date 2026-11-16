/* 일반지구과학 11 흑체 복사: 온도에 따른 플랑크 곡선, 빈 변위 법칙, 슈테판–볼츠만 법칙, 별의 색 */
Sims.register('u-blackbody', {
  title: '온도를 바꾸면 별빛이 바뀐다 — 플랑크 곡선',
  caption: '온도 슬라이더나 별 단추로 흑체의 온도를 바꿔 보자. 온도가 오르면 모든 파장에서 세기가 커지고(태양 곡선을 넘어선다), 봉우리 λmax = b/T가 짧은 파장 쪽으로 옮겨 가며, 곡선 아래 넓이(단위 넓이당 복사 에너지 F = σT⁴)가 T⁴로 늘어난다. 세로축은 두 곡선 가운데 큰 쪽의 봉우리에 맞춰 자동으로 바뀐다. 별을 흑체로 본 모형이며 흡수선은 넣지 않았고, 원반의 색은 흑체 빛을 사람 눈이 보는 색으로 어림한 것이다.',
  init: function (api) {
    var H = 6.626e-34, C = 2.998e8, K = 1.381e-23, SIG = 5.670e-8, WB = 2.898e-3, TSUN = 5772;
    var st = { T: 5772 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.05 : 0.5; }, label: '플랑크 곡선과 별의 색' });
    var ctx = cv.ctx;
    var rPeak = api.readout('최대 복사 파장 λmax');
    var rF = api.readout('F = σT⁴');
    var rRel = api.readout('태양 대비 F');
    var rBR = api.readout('세기 비 B(450 nm)/B(650 nm)');
    var stars = [{ n: '베텔게우스', T: 3500 }, { n: '태양', T: 5772 }, { n: '시리우스', T: 9940 }, { n: '리겔', T: 12000 }];
    var g = api.group();
    var btns = stars.map(function (s) {
      return api.button(s.n, function () { sl.set(Math.log10(s.T)); }, { toggle: true, pressed: s.T === st.T, parent: g });
    });
    var sl = api.slider({ id: 'u-blackbody-t', label: '표면 온도', min: Math.log10(2000), max: Math.log10(30000), step: 0.001, value: Math.log10(st.T),
      format: function (v) { return Math.round(Math.pow(10, v) / 10) * 10 + ' K'; },
      onInput: function (v) {
        st.T = Math.pow(10, v);
        stars.forEach(function (s, i) { if (Math.abs(s.T - st.T) < 0.002 * s.T) st.T = s.T; btns[i].setAttribute('aria-pressed', Math.abs(s.T - st.T) < 0.002 * s.T ? 'true' : 'false'); });
        update();
      } });

    function B(lamNm, T) { var l = lamNm * 1e-9; var x = H * C / (l * K * T); if (x > 700) return 0; return 2 * H * C * C / Math.pow(l, 5) / (Math.exp(x) - 1); }
    function peak(T) { return WB / T * 1e9; }
    function sci(x) { var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e); return m.toFixed(2) + ' × 10' + sup(e); }
    function sup(n) { var map = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }; return String(n).split('').map(function (c) { return map[c]; }).join(''); }
    // 흑체 색 어림(Tanner Helland 근사): 실제 색이 내용이므로 고정 색 사용
    function bbColor(T) {
      var t = T / 100, r, gg, b;
      if (t <= 66) { r = 255; gg = 99.4708025861 * Math.log(t) - 161.1195681661; b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307; }
      else { r = 329.698727446 * Math.pow(t - 60, -0.1332047592); gg = 288.1221695283 * Math.pow(t - 60, -0.0755148492); b = 255; }
      var cl = function (v) { return Math.max(0, Math.min(255, Math.round(v))); };
      return 'rgb(' + cl(r) + ',' + cl(gg) + ',' + cl(b) + ')';
    }
    // 가시광 띠 색(실제 색)
    function wlColor(l) {
      var r = 0, g2 = 0, b = 0;
      if (l < 440) { r = (440 - l) / 60; b = 1; } else if (l < 490) { g2 = (l - 440) / 50; b = 1; }
      else if (l < 510) { g2 = 1; b = (510 - l) / 20; } else if (l < 580) { r = (l - 510) / 70; g2 = 1; }
      else if (l < 645) { r = 1; g2 = (645 - l) / 65; } else { r = 1; }
      return 'rgb(' + Math.round(r * 255) + ',' + Math.round(g2 * 255) + ',' + Math.round(b * 255) + ')';
    }
    function update() {
      var T = st.T;
      rPeak.set(Math.round(peak(T)) + ' nm');
      rF.set(sci(SIG * Math.pow(T, 4)) + ' W/m²');
      var rel = Math.pow(T / TSUN, 4);
      rRel.set((rel < 10 ? rel.toFixed(2) : rel.toFixed(0)) + '배');
      rBR.set((B(450, T) / B(650, T)).toFixed(2));
      draw();
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var disc = narrow ? { x: w - 46, y: 40, r: 26 } : { x: w - 70, y: 58, r: 36 };
      var L = 64, R = w - (narrow ? 14 : 22), Tp = narrow ? 84 : 40, Bt = h - 44;
      var LMAX = 3000;
      var sx = function (l) { return L + l / LMAX * (R - L); };
      var ymax = Math.max(B(peak(st.T), st.T), B(peak(TSUN), TSUN)) * 1.08;
      var sy = function (v) { return Bt - v / ymax * (Bt - Tp); };
      // 가시광 띠
      for (var l = 380; l < 750; l += 2) { ctx.fillStyle = wlColor(l); ctx.globalAlpha = T.dark ? 0.35 : 0.28; ctx.fillRect(sx(l), Tp, sx(l + 2) - sx(l) + 0.5, Bt - Tp); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('가시광선', sx(565), Tp + 14);
      ctx.fillText('자외선', sx(190), Tp + 14); ctx.fillText('적외선 →', sx(1150), Tp + 14);
      // 축
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, Bt); ctx.lineTo(R, Bt); ctx.stroke();
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      for (var t = 0; t <= LMAX; t += 500) { ctx.fillText(t, sx(t), Bt + 14); }
      ctx.font = '12px ' + T.fontBody; ctx.fillText('파장 (nm)', (L + R) / 2, Bt + 32);
      ctx.save(); ctx.translate(18, (Tp + Bt) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('복사 세기 B_λ (상댓값)', 0, 0); ctx.restore();
      // 태양 곡선(기준)
      curve(TSUN, T.figLine, null, 1.5, [5, 4]);
      // 현재 곡선 + 넓이
      curve(st.T, T.figAccent, T.figSoftBlue, 2.6, []);
      if (st.T !== TSUN) {
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('태양(5772 K)', Math.min(sx(peak(TSUN)) + 6, R - 80), Math.max(Tp + 30, sy(B(peak(TSUN), TSUN)) - 6));
      }
      // λmax 표시
      var pk = peak(st.T), px = sx(Math.min(pk, LMAX)), py = sy(B(pk, st.T));
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, Bt); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figRed; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = px > (L + R) * 0.6 ? 'right' : 'left';
      ctx.fillText('λmax = ' + Math.round(pk) + ' nm', px + (px > (L + R) * 0.6 ? -6 : 6), Math.max(Tp + 30, py + 2) + (py < Tp + 40 ? 14 : -6));
      ctx.fillStyle = T.figAccent; ctx.textAlign = 'left'; ctx.font = '600 13px ' + T.fontBody;
      ctx.fillText(Math.round(st.T / 10) * 10 + ' K 흑체 — 색칠한 넓이 ∝ σT⁴', L + 8, narrow ? 24 : Tp - 14 < 14 ? 14 : 22);
      // 별 원반 색
      var grd = ctx.createRadialGradient(disc.x, disc.y, disc.r * 0.2, disc.x, disc.y, disc.r * 1.5);
      var col = bbColor(st.T);
      grd.addColorStop(0, col); grd.addColorStop(0.65, col); grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(disc.x, disc.y, disc.r * 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(disc.x, disc.y, disc.r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('보이는 색', disc.x, disc.y + disc.r * 1.5 + 10);

      function curve(Tk, stroke, fill, lw, dash) {
        var n = 300, i, lam;
        ctx.beginPath(); ctx.moveTo(sx(1), sy(0));
        for (i = 1; i <= n; i++) { lam = LMAX * i / n; ctx.lineTo(sx(lam), sy(B(lam, Tk))); }
        if (fill) { ctx.lineTo(sx(LMAX), sy(0)); ctx.closePath(); ctx.globalAlpha = 0.5; ctx.fillStyle = fill; ctx.fill(); ctx.globalAlpha = 1;
          ctx.beginPath(); ctx.moveTo(sx(1), sy(0)); for (i = 1; i <= n; i++) { lam = LMAX * i / n; ctx.lineTo(sx(lam), sy(B(lam, Tk))); } }
        ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    api.onResize(draw);
    update();
  },
});
