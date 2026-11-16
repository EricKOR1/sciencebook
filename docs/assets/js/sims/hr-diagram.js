/* 지구과학 3 H-R도와 별의 진화: 질량에 따라 주계열 위치, 진화 경로, 최후, 수명이 달라진다 */
Sims.register('hr-diagram', {
  title: 'H-R도 위의 별의 일생 — 질량이 정하는 길',
  caption: '별의 처음 질량을 바꿔 보자. 질량이 클수록 주계열에서 왼쪽 위(뜨겁고 밝음)에 자리하고 수명은 크게 짧아진다. 태양의 약 8배보다 가벼운 별은 적색 거성을 거쳐 백색 왜성으로, 무거운 별은 초거성을 거쳐 초신성 폭발 후 중성자별이나 블랙홀로 끝난다. 주계열의 온도·광도·수명은 원고의 표를 이어 붙인 어림값이고, 진화 경로는 모양만 나타낸 모식적인 선이다.',
  init: function (api) {
    // 원고 표의 값(처음 질량, 표면 온도 K, 광도, 주계열 수명 년)
    var TAB = [[0.5, 3800, 0.05, 1e11], [1, 5800, 1, 1e10], [2, 9000, 15, 1e9], [10, 25000, 7000, 2.5e7], [20, 33000, 50000, 8e6]];
    var STARS = [
      { n: '태양', T: 5800, L: 1, g: 'ms' }, { n: '시리우스 A', T: 9900, L: 25, g: 'ms' }, { n: '스피카', T: 24000, L: 20000, g: 'ms' },
      { n: '프로키온', T: 6500, L: 7, g: 'ms' }, { n: '아크투루스', T: 4300, L: 170, g: 'giant' }, { n: '알데바란', T: 3900, L: 440, g: 'giant' },
      { n: '베텔게우스', T: 3500, L: 100000, g: 'sg' }, { n: '리겔', T: 12000, L: 120000, g: 'sg' }, { n: '안타레스', T: 3400, L: 75000, g: 'sg' },
      { n: '시리우스 B', T: 25000, L: 0.056, g: 'wd' }, { n: '프록시마 센타우리', T: 3000, L: 0.0017, g: 'ms' },
    ];
    var st = { lm: 0 };   // log10(질량)
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.25 : 0.7; }, label: 'H-R도: 가로축 표면 온도, 세로축 광도' });
    var ctx = cv.ctx;
    var rM = api.readout('처음 질량'), rS = api.readout('주계열의 분광형·온도'), rL = api.readout('광도'), rLife = api.readout('주계열 수명(약)'), rEnd = api.readout('최후');
    var g = api.group();
    var presets = [0.5, 1, 2, 10, 20];
    var pbtn = presets.map(function (m) {
      return api.button('태양의 ' + m + '배', function () { slider.set(Math.log10(m)); }, { toggle: true, pressed: m === 1, parent: g });
    });
    var slider = api.slider({ id: 'hr-diagram-mass', label: '별의 처음 질량', min: Math.log10(0.5), max: Math.log10(20), step: 0.005, value: 0,
      format: function (v) { return '태양의 ' + fmtM(Math.pow(10, v)) + '배'; },
      onInput: function (v) { st.lm = v; pbtn.forEach(function (b, i) { b.setAttribute('aria-pressed', Math.abs(Math.log10(presets[i]) - v) < 0.004 ? 'true' : 'false'); }); update(); } });

    function fmtM(m) { return m < 10 ? m.toFixed(1).replace(/\.0$/, '') : Math.round(m).toString(); }
    function interp(col, lm) {
      for (var i = 0; i < TAB.length - 1; i++) {
        var a = Math.log10(TAB[i][0]), b = Math.log10(TAB[i + 1][0]);
        if (lm <= b + 1e-9 || i === TAB.length - 2) { var k = (lm - a) / (b - a); return Math.pow(10, Math.log10(TAB[i][col]) + k * (Math.log10(TAB[i + 1][col]) - Math.log10(TAB[i][col]))); }
      }
    }
    function sptype(T) { return T >= 30000 ? 'O' : T >= 10000 ? 'B' : T >= 7500 ? 'A' : T >= 6000 ? 'F' : T >= 5200 ? 'G' : T >= 3700 ? 'K' : 'M'; }
    function fmtLife(y) {
      if (y >= 1e8) { var e = y / 1e8; return '약 ' + (e >= 100 ? Math.round(e / 10) * 10 : e >= 10 ? Math.round(e) : e.toFixed(1)) + '억 년'; }
      var m = y / 1e4; return '약 ' + (m >= 1000 ? Math.round(m / 100) * 100 : Math.round(m / 10) * 10) + '만 년';
    }
    function fmtL(L) { return L >= 100 ? Number(L.toPrecision(2)).toLocaleString('ko-KR') : L >= 0.995 ? L.toFixed(1) : L.toFixed(2); }
    function state() {
      var m = Math.pow(10, st.lm), T = interp(1, st.lm), L = interp(2, st.lm), life = interp(3, st.lm);
      return { m: m, T: T, L: L, life: life, big: m >= 8 };
    }
    function update() {
      var s = state();
      rM.set('태양의 ' + fmtM(s.m) + '배');
      rS.set(sptype(s.T) + '형, 약 ' + (Math.round(s.T / 100) * 100).toLocaleString('ko-KR') + ' K');
      rL.set('태양의 약 ' + fmtL(s.L) + '배');
      rLife.set(fmtLife(s.life) + (s.life > 1.38e10 ? ' (우주 나이보다 김)' : ''));
      rEnd.set(s.big ? '초신성 폭발 → 중성자별 또는 블랙홀' : '행성상 성운 + 백색 왜성');
      draw();
    }

    var lgTmax = Math.log10(45000), lgTmin = Math.log10(2400), lgLmin = -4.3, lgLmax = 6.3;
    function geo() {
      var w = cv.w, h = cv.h, nar = w < 560;
      return { L: nar ? 52 : 64, R: w - (nar ? 34 : 48), T: 26, B: h - 78 };
    }
    function X(T, G) { return G.L + (lgTmax - Math.log10(T)) / (lgTmax - lgTmin) * (G.R - G.L); }
    function Y(L, G) { return G.B - (Math.log10(L) - lgLmin) / (lgLmax - lgLmin) * (G.B - G.T); }

    function draw() {
      var T = api.tokens(), G = geo(), w = cv.w, fs = w < 560 ? 11 : 12;
      ctx.clearRect(0, 0, w, cv.h);
      ctx.fillStyle = T.figPaper; ctx.fillRect(G.L, G.T, G.R - G.L, G.B - G.T);
      // 축
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      ctx.textAlign = 'right';
      for (var e = -4; e <= 6; e += 2) { var y = Y(Math.pow(10, e), G); ctx.beginPath(); ctx.moveTo(G.L, y); ctx.lineTo(G.R, y); ctx.stroke(); ctx.fillText(e === 0 ? '1' : '10' + sup(e), G.L - 5, y + 4); }
      ctx.textAlign = 'left';
      for (e = -4; e <= 6; e += 2) { var mag = 4.8 - 2.5 * e; ctx.fillText((mag > 0 ? '+' : '') + mag.toFixed(0), G.R + 4, Y(Math.pow(10, e), G) + 4); }
      ctx.textAlign = 'center';
      [40000, 20000, 10000, 5000, 3000].forEach(function (t) { var x = X(t, G); ctx.beginPath(); ctx.moveTo(x, G.T); ctx.lineTo(x, G.B); ctx.stroke(); ctx.fillText(t.toLocaleString('ko-KR'), x, G.B + 13); });
      ctx.fillStyle = T.figInk; ctx.font = fs + 'px ' + T.fontBody;
      ctx.fillText('표면 온도 (K)  ← 높음 · 낮음 →', (G.L + G.R) / 2, G.B + 40);
      ['O', 'B', 'A', 'F', 'G', 'K', 'M'].forEach(function (sp, i) {
        var mid = [37000, 17000, 8700, 6700, 5600, 4400, 3000][i];
        ctx.fillStyle = T.figMuted; ctx.font = '600 11px ' + T.fontBody; ctx.fillText(sp, X(mid, G), G.B + 26);
      });
      ctx.save(); ctx.translate(14, (G.T + G.B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillStyle = T.figInk; ctx.font = fs + 'px ' + T.fontBody;
      ctx.fillText('광도 (태양 = 1)', 0, 0); ctx.restore();
      ctx.save(); ctx.translate(w - 6, (G.T + G.B) / 2); ctx.rotate(Math.PI / 2); ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('절대 등급', 0, 0); ctx.restore();
      // 영역
      ctx.save(); ctx.beginPath(); ctx.rect(G.L, G.T, G.R - G.L, G.B - G.T); ctx.clip();
      band([[42000, 4e5], [30000, 6e4], [20000, 8000], [9000, 15], [5800, 1], [3800, 0.05], [2600, 0.0006]], 0.32, T.figSoftBlue);
      blob(4300, 300, 0.25, 0.6, T.figSoftAmber);
      blob(7000, 2.5e5, 0.5, 0.42, T.figSoftRed);
      blob(15000, 0.006, 0.17, 0.75, T.figSoftViolet);
      ctx.restore();
      ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillStyle = T.figBlue; ctx.fillText('주계열성', X(4600, G), Y(0.04, G));
      ctx.fillStyle = T.figAmber; ctx.fillText('거성', X(4600, G), Y(2500, G));
      ctx.fillStyle = T.figRed; ctx.fillText('초거성', X(7000, G), Y(1.4e6, G));
      ctx.fillStyle = T.figViolet; ctx.fillText('백색 왜성', X(26000, G), Y(0.00015, G));
      // 대표 별
      ctx.font = '11px ' + T.fontBody;
      STARS.forEach(function (s) {
        var x = X(s.T, G), y = Y(s.L, G);
        ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 2 * Math.PI); ctx.fillStyle = T.figMuted; ctx.fill();
        if (w < 420 && (s.n === '프로키온' || s.n === '안타레스' || s.n === '알데바란')) return;
        ctx.fillStyle = T.figMuted; ctx.textAlign = s.T < 4000 ? 'right' : 'left';
        var dy = s.n === '안타레스' ? 12 : s.n === '아크투루스' ? 15 : -5;
        ctx.fillText(s.n, x + (s.T < 4000 ? -6 : 6), y + dy);
      });
      // 진화 경로
      var s = state(), x0 = X(s.T, G), y0 = Y(s.L, G);
      var pts;
      if (!s.big) {
        var Lrg = Math.min(3000, 400 * Math.pow(s.m, 1.6)), Lpn = Lrg * 1.2;
        pts = [[s.T, s.L], [s.T * 0.85, s.L * 2.2], [4600, s.L * 3.5], [3600, Lrg], [8000, Lpn], [30000, Lpn * 0.8], [38000, 30], [25000, 0.05], [12000, 0.0015]];
        var ms = 1;
      } else {
        pts = [[s.T, s.L], [s.T * 0.85, s.L * 1.4], [3500, s.L * 1.6]];
      }
      // 전주계열(점선)
      var pre = s.m < 3 ? [[3500, s.L * 40], [3700, s.L * 3], [s.T * 0.92, s.L * 0.9], [s.T, s.L]] : [[3600, s.L * 0.45], [s.T * 0.9, s.L * 0.6], [s.T, s.L]];
      ctx.strokeStyle = T.figTeal; ctx.lineWidth = 1.8; ctx.setLineDash([4, 4]); poly(pre); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = s.big ? T.figRed : T.figAmber; ctx.lineWidth = 2.8; poly(pts, true); ctx.stroke();
      arrowAlong(pts, s.big ? T.figRed : T.figAmber);
      var end = pts[pts.length - 1], ex = X(end[0], G), ey = Y(end[1], G);
      ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.fillStyle = T.figInk;
      if (s.big) {
        star(ex, ey, T.figRed);
        ctx.textAlign = 'right'; ctx.fillText('초신성 폭발', ex + 8, ey + 30);
        ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
        ctx.fillText('→ 중성자별 또는 블랙홀', ex + 8, ey + 45);
        ctx.fillText('(빛을 거의 내지 않아 이 그림 밖)', ex + 8, ey + 59);
      } else {
        ctx.beginPath(); ctx.arc(ex, ey, 5, 0, 2 * Math.PI); ctx.fillStyle = T.figViolet; ctx.fill();
        ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.fillText('백색 왜성으로 식어 감', ex + 6, ey + 18);
        var rg = pts[3]; ctx.textAlign = 'center'; ctx.fillText('적색 거성', X(rg[0], G), Y(rg[1], G) - 10);
        ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
        ctx.fillText('행성상 성운(바깥층 방출)', X(14000, G), Y(Lpn, G) - 9);
      }
      ctx.beginPath(); ctx.arc(x0, y0, 7, 0, 2 * Math.PI); ctx.fillStyle = T.figAccent; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = T.figPanel; ctx.stroke();
      ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.fillStyle = T.figAccent; ctx.textAlign = 'left';
      ctx.fillText('주계열', x0 + 10, y0 + 16);
      // 범례
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figTeal; ctx.fillText('점선: 원시별 → 주계열(전주계열)', G.L, cv.h - 18);
      ctx.fillStyle = s.big ? T.figRed : T.figAmber; ctx.fillText('실선: 주계열 이후의 경로(모식)', G.L, cv.h - 4);

      function sup(e) { var m = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶' }; return String(e).split('').map(function (c) { return m[c]; }).join(''); }
      function band(arr, wdex, col) {
        ctx.beginPath();
        arr.forEach(function (p, i) { var px = X(p[0], G), py = Y(p[1] * Math.pow(10, wdex), G); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
        arr.slice().reverse().forEach(function (p) { ctx.lineTo(X(p[0], G), Y(p[1] / Math.pow(10, wdex), G)); });
        ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      }
      function blob(t, l, rx, ry, col) {
        var cx = X(t, G), cy = Y(l, G), sx = (G.R - G.L) / (lgTmax - lgTmin) * rx, sy = (G.B - G.T) / (lgLmax - lgLmin) * ry * 2;
        ctx.beginPath(); ctx.ellipse(cx, cy, sx, sy, 0, 0, 2 * Math.PI); ctx.fillStyle = col; ctx.fill();
      }
      function poly(a, smooth) {
        ctx.beginPath();
        a.forEach(function (p, i) { var px = X(p[0], G), py = Y(p[1], G); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
      }
      function arrowAlong(a, col) {
        for (var i = 1; i < a.length; i += 2) {
          var x1 = X(a[i - 1][0], G), y1 = Y(a[i - 1][1], G), x2 = X(a[i][0], G), y2 = Y(a[i][1], G);
          if (Math.hypot(x2 - x1, y2 - y1) < 24) continue;
          var mx = (x1 + x2) / 2, my = (y1 + y2) / 2, an = Math.atan2(y2 - y1, x2 - x1);
          ctx.beginPath(); ctx.moveTo(mx + 7 * Math.cos(an), my + 7 * Math.sin(an));
          ctx.lineTo(mx + 7 * Math.cos(an + 2.5), my + 7 * Math.sin(an + 2.5)); ctx.lineTo(mx + 7 * Math.cos(an - 2.5), my + 7 * Math.sin(an - 2.5));
          ctx.closePath(); ctx.fillStyle = col; ctx.fill();
        }
      }
      function star(x, y, col) {
        ctx.beginPath();
        for (var i = 0; i < 16; i++) { var rr = i % 2 ? 4 : 11, a = i * Math.PI / 8; ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); }
        ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      }
    }

    api.onResize(draw);
    update();
  },
});
