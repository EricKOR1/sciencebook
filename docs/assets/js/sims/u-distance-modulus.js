/* 일반지구과학 11 별의 거리: 거리 지수 m − M = 5 log d − 5 + A, 소광을 무시하면 거리를 멀게 계산한다 */
Sims.register('u-distance-modulus', {
  title: '거리 지수 — 겉보기 등급과 절대등급 사이',
  caption: '별을 고르거나 절대등급 M, 거리 d, 소광 A를 바꿔 보자. 파란 직선은 같은 별을 여러 거리에 놓았을 때의 겉보기 등급 m으로, 거리가 10배 멀어질 때마다 정확히 5등급 어두워진다(10 pc에서 m = M). 소광 A를 넣으면 직선이 그만큼 아래(어두운 쪽)로 내려가므로, 소광을 무시하고 m − M으로 거리를 구하면 실제보다 멀게 나온다. 등급은 한 파장대의 값으로 보았고, 별의 값은 어림값이다.',
  init: function (api) {
    var st = { M: 1.42, ld: Math.log10(2.64), A: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.05 : 0.5; }, label: '거리에 따른 겉보기 등급 그래프' });
    var ctx = cv.ctx;
    var rm = api.readout('겉보기 등급 m');
    var rDM = api.readout('m − M');
    var rFl = api.readout('10 pc에 둘 때보다');
    var rWrong = api.readout('소광을 무시하고 구한 거리');
    var stars = [
      { n: '시리우스', M: 1.42, d: 2.64 }, { n: '베텔게우스', M: -5.6, d: 168 },
      { n: '태양을 10 pc에', M: 4.83, d: 10 }, { n: 'Ⅰa형 초신성(처녀자리 은하단)', M: -19.3, d: 1.6e7 },
    ];
    var g = api.group();
    var btns = stars.map(function (s, i) {
      return api.button(s.n, function () { sM.set(s.M); sD.set(Math.log10(s.d)); sync(); }, { toggle: true, pressed: i === 0, parent: g });
    });
    var sM = api.slider({ id: 'u-distance-modulus-m', label: '절대등급 M', min: -20, max: 16, step: 0.01, value: st.M,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.M = v; sync(); update(); } });
    var sD = api.slider({ id: 'u-distance-modulus-d', label: '거리 d', min: 0, max: 9, step: 0.001, value: st.ld,
      format: function (v) { return fmtD(Math.pow(10, v)); }, onInput: function (v) { st.ld = v; sync(); update(); } });
    api.slider({ id: 'u-distance-modulus-a', label: '소광 A', min: 0, max: 5, step: 0.1, value: 0,
      format: function (v) { return v.toFixed(1) + '등급'; }, onInput: function (v) { st.A = v; update(); } });

    function sync() { btns.forEach(function (b, i) { var s = stars[i]; b.setAttribute('aria-pressed', Math.abs(s.M - st.M) < 0.006 && Math.abs(Math.log10(s.d) - st.ld) < 0.002 ? 'true' : 'false'); }); }
    function fmtD(d) {
      if (d >= 1e6) return (d / 1e6).toPrecision(3) + ' Mpc';
      if (d >= 1e3) return (d / 1e3).toPrecision(3) + ' kpc';
      return d.toPrecision(3) + ' pc';
    }
    function mOf(ld) { return st.M + 5 * ld - 5 + st.A; }
    function update() {
      var m = mOf(st.ld), dm = m - st.M;
      rm.set(m.toFixed(2) + (m <= 6 ? ' (맨눈으로 보임)' : ''));
      rDM.set(dm.toFixed(2) + ' = ' + (5 * st.ld - 5).toFixed(2) + ' + ' + st.A.toFixed(1));
      var f = Math.pow(10, 0.4 * dm);
      rFl.set(f >= 1 ? fmtBig(f) + '배 어둡다' : fmtBig(1 / f) + '배 밝다');
      var dWrong = Math.pow(10, (dm + 5) / 5);
      rWrong.set(st.A > 0 ? fmtD(dWrong) + ' (실제의 ' + (dWrong / Math.pow(10, st.ld)).toFixed(2) + '배)' : '소광 없음 → 실제 거리와 같다');
      draw();
    }
    function fmtBig(x) {
      if (x < 1000) return x < 10 ? x.toFixed(2) : x.toFixed(0);
      var e = Math.floor(Math.log10(x)), mm = x / Math.pow(10, e);
      return mm.toFixed(1) + ' × 10' + String(e).split('').map(function (c) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]; }).join('');
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var L = 52, R = w - 16, Tp = 30, B = h - 46, YMIN = -26, YMAX = 40;
      var sx = function (ld) { return L + ld / 9 * (R - L); };
      var sy = function (m) { return Tp + (m - YMIN) / (YMAX - YMIN) * (B - Tp); };   // 밝을수록(작을수록) 위
      // 격자
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      for (var mm = -20; mm <= 40; mm += 10) { ctx.beginPath(); ctx.moveTo(L, sy(mm)); ctx.lineTo(R, sy(mm)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(mm, L - 6, sy(mm) + 4); }
      var labs = ['1 pc', '10', '100', '1 kpc', '10', '100', '1 Mpc', '10', '100', '1 Gpc'];
      for (var i = 0; i <= 9; i++) {
        ctx.beginPath(); ctx.moveTo(sx(i), Tp); ctx.lineTo(sx(i), B); ctx.stroke();
        if (!narrow || i % 3 === 0 || i === 1) { ctx.textAlign = 'center'; ctx.fillText(labs[i], sx(i), B + 14); }
      }
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillStyle = T.figMuted;
      ctx.fillText('거리 d (로그 눈금)', (L + R) / 2, B + 32);
      ctx.save(); ctx.translate(14, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('겉보기 등급 m (위쪽이 밝음)', 0, 0); ctx.restore();
      // 맨눈 한계
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, R - L, B - Tp); ctx.clip();
      ctx.fillStyle = T.figSoftGreen; ctx.globalAlpha = 0.6; ctx.fillRect(L, Tp, R - L, sy(6) - Tp); ctx.globalAlpha = 1;
      ctx.strokeStyle = T.figGreen; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(L, sy(6)); ctx.lineTo(R, sy(6)); ctx.stroke(); ctx.setLineDash([]);
      // M 수평선
      ctx.strokeStyle = T.figMuted; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(L, sy(st.M)); ctx.lineTo(R, sy(st.M)); ctx.stroke(); ctx.setLineDash([]);
      // 소광 없는 선, 있는 선
      if (st.A > 0) { line(0, T.figLine, [5, 4], 1.5); }
      line(st.A, T.figBlue, [], 2.6);
      ctx.restore();
      function line(A, col, dash, lw) { ctx.beginPath(); ctx.moveTo(sx(0), sy(st.M - 5 + A)); ctx.lineTo(sx(9), sy(st.M + 40 + A)); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]); }
      ctx.fillStyle = T.figGreen; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('맨눈 한계 약 6등급', R - 4, sy(6) + 14);
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      if (sy(st.M) > Tp + 10 && sy(st.M) < B - 4) ctx.fillText('M = ' + st.M.toFixed(2) + (narrow ? ' (10 pc)' : ' (10 pc에서의 등급)'), R - 4, sy(st.M) - 5);
      // 현재 점과 분해
      var x = sx(st.ld), yM = sy(st.M), yD = sy(st.M + 5 * st.ld - 5), ym = sy(mOf(st.ld));
      var cy = function (y) { return Math.max(Tp, Math.min(B, y)); };
      ctx.lineWidth = 3;
      ctx.strokeStyle = T.figViolet; ctx.beginPath(); ctx.moveTo(x, cy(yM)); ctx.lineTo(x, cy(yD)); ctx.stroke();
      if (st.A > 0) { ctx.strokeStyle = T.figRed; ctx.beginPath(); ctx.moveTo(x, cy(yD)); ctx.lineTo(x, cy(ym)); ctx.stroke(); }
      if (ym >= Tp && ym <= B) {
        ctx.beginPath(); ctx.arc(x, ym, 6, 0, Math.PI * 2); ctx.fillStyle = T.figAccent; ctx.fill(); ctx.strokeStyle = T.figPanel; ctx.lineWidth = 2; ctx.stroke();
      }
      var right = x < (L + R) * 0.55, tx = x + (right ? 10 : -10);
      ctx.textAlign = right ? 'left' : 'right'; ctx.font = '600 12px ' + T.fontBody;
      ctx.fillStyle = T.figViolet;
      if (Math.abs(yD - yM) > 14) ctx.fillText('5 log d − 5 = ' + (5 * st.ld - 5).toFixed(2), tx, cy((yM + yD) / 2) + 4);
      if (st.A > 0) { ctx.fillStyle = T.figRed; ctx.fillText('+ A = ' + st.A.toFixed(1), tx, cy((yD + ym) / 2 + (Math.abs(ym - yD) < 14 ? 14 : 0)) + 4); }
      ctx.fillStyle = T.figAccent; ctx.textAlign = right ? 'right' : 'left';
      ctx.fillText('m = ' + mOf(st.ld).toFixed(2), x + (right ? -10 : 10), cy(ym) + 18);
    }
    api.onResize(draw);
    update();
  },
});
