/* 일반물리학 11 회절 격자: 단일 슬릿 회절 봉투 × N개 슬릿 간섭 */
Sims.register('u-diffraction-grating', {
  title: '슬릿 N개의 세기 분포 — 회절 봉투 안의 간섭무늬',
  caption: '슬릿 수 N을 1, 2, 5, 20으로 늘려 보자. 밝은 무늬(주 극대)의 위치 d sinθ = mλ는 그대로인데, N이 클수록 주 극대가 가늘어지고(반폭 λ/Nd) 그 사이에 작은 극대 N − 2개가 생긴다. 슬릿 폭 a를 바꾸면 점선의 회절 봉투 (sinα/α)²가 넓어지거나 좁아지고, d/a가 정수가 되면 봉투의 어두운 곳에 걸린 차수가 사라진다(빠진 차수). 세로축은 가운데 세기를 1로 맞춘 값으로, 실제 가운데 세기는 슬릿 하나일 때의 N²배이다. 아주 먼 스크린(프라운호퍼 회절)과 단색광을 가정했다.',
  init: function (api) {
    var s = { N: 2, a: 1.0, d: 4.0, lam: 550 };
    var XM = 0.6;   // 가로축 범위: −0.6 < sinθ < 0.6
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.15 : 0.56; }, label: '슬릿 배열, 스크린 무늬, 세기 그래프' });
    var ctx = cv.ctx;

    var rOrd = api.readout('주 극대 sinθ = mλ/d');
    var rMax = api.readout('최고 차수');
    var rHw = api.readout('반폭 λ/Nd');
    var rMiss = api.readout('빠진 차수');
    var rI0 = api.readout('가운데 세기');

    var sN = api.slider({ id: 'u-diffraction-grating-n', label: '슬릿 수 N', min: 1, max: 20, step: 1, value: 2,
      format: function (v) { return v + '개'; }, onInput: function (v) { s.N = v; update(); } });
    var sD = api.slider({ id: 'u-diffraction-grating-d', label: '슬릿 간격 d', min: 2, max: 8, step: 0.1, value: 4,
      format: function (v) { return v.toFixed(1) + ' μm'; }, onInput: function (v) { s.d = v; if (s.a > s.d) sA.set(s.d); update(); } });
    var sA = api.slider({ id: 'u-diffraction-grating-a', label: '슬릿 폭 a', min: 0.4, max: 2.0, step: 0.05, value: 1.0,
      format: function (v) { return v.toFixed(2) + ' μm'; }, onInput: function (v) { s.a = Math.min(v, s.d); update(); } });
    api.slider({ id: 'u-diffraction-grating-l', label: '파장 λ', min: 400, max: 700, step: 5, value: 550,
      format: function (v) { return v + ' nm'; }, onInput: function (v) { s.lam = v; update(); } });
    var g = api.group();
    [1, 2, 5, 20].forEach(function (n) { api.button('N = ' + n, function () { sN.set(n); }, { parent: g }); });

    function I(x) {   // x = sinθ, 가운데 1로 정규화
      var lam = s.lam / 1000, al = Math.PI * s.a * x / lam, be = Math.PI * s.d * x / lam;
      var env = Math.abs(al) < 1e-9 ? 1 : Math.pow(Math.sin(al) / al, 2);
      var sb = Math.sin(be), arr;
      if (Math.abs(sb) < 1e-7) arr = 1; else arr = Math.pow(Math.sin(s.N * be) / (s.N * sb), 2);
      return env * arr;
    }
    function env(x) { var lam = s.lam / 1000, al = Math.PI * s.a * x / lam; return Math.abs(al) < 1e-9 ? 1 : Math.pow(Math.sin(al) / al, 2); }
    function update() {
      var lam = s.lam / 1000, mmax = Math.floor(s.d / lam - 1e-9);
      var list = []; for (var m = 1; m <= Math.min(mmax, 3); m++) list.push('±' + (m * lam / s.d).toFixed(3));
      rOrd.set(s.N === 1 ? '(슬릿 1개: 간섭 없음)' : '0' + (list.length ? ', ' + list.join(', ') : '') + (mmax > 3 ? ' …' : ''));
      rMax.set(s.N === 1 ? '–' : mmax + '차');
      rHw.set(s.N === 1 ? '–' : (lam / (s.N * s.d)).toFixed(4) + ' (sinθ)');
      var miss = [];
      for (var m2 = 1; m2 <= mmax; m2++) { var q = m2 * s.a / s.d; if (Math.abs(q - Math.round(q)) < 0.02 && Math.round(q) >= 1) miss.push(m2); }
      rMiss.set(s.N === 1 || !miss.length ? '없음' : miss.slice(0, 4).join(', ') + '차');
      rI0.set('슬릿 1개의 ' + s.N * s.N + '배');
      draw();
    }
    function wlColor(nm) {
      var r = 0, g2 = 0, b = 0;
      if (nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g2 = (nm - 440) / 50; b = 1; }
      else if (nm < 510) { g2 = 1; b = -(nm - 510) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g2 = 1; }
      else if (nm < 645) { r = 1; g2 = -(nm - 645) / 65; } else r = 1;
      return [Math.round(255 * r), Math.round(255 * g2), Math.round(255 * b)];
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var narrow = w < 560;
      var L = 46, R = w - 14;
      // 1) 슬릿 배열(모식도)
      var sy0 = 6, sh = narrow ? 34 : 30;
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('슬릿 배열 (간격 d, 폭 a의 비율을 맞춘 모식도)', 6, sy0 + 12);
      var cw = Math.min(R - L, 520), unit = Math.min(cw / (s.N * s.d + 1), 30), cx0 = (L + R) / 2;
      var total = (s.N - 1) * s.d * unit + s.a * unit, start = cx0 - total / 2;
      ctx.fillStyle = T.figLine; ctx.fillRect(L, sy0 + 18, R - L, 10);
      ctx.fillStyle = T.figAccent;
      for (var k = 0; k < s.N; k++) { var xx = start + k * s.d * unit; ctx.clearRect(xx, sy0 + 18, Math.max(1.5, s.a * unit), 10); ctx.fillStyle = T.figSoftBlue; ctx.fillRect(xx, sy0 + 18, Math.max(1.5, s.a * unit), 10); }
      // 2) 스크린 무늬
      var scY = sy0 + sh + 14, scH = 26;
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('스크린에 보이는 무늬', 6, scY - 3);
      var col = wlColor(s.lam);
      ctx.fillStyle = '#000'; ctx.fillRect(L, scY + 2, R - L, scH);   // 스크린의 어두운 바탕(실제 무늬의 모습)
      for (var px = L; px < R; px++) {
        var mx = 0; for (var sub = 0; sub < 6; sub++) { var x = -XM + ((px - L + sub / 6) / (R - L)) * 2 * XM; mx = Math.max(mx, I(x)); }
        var b = Math.pow(mx, 0.5);
        ctx.fillStyle = 'rgb(' + Math.round(col[0] * b) + ',' + Math.round(col[1] * b) + ',' + Math.round(col[2] * b) + ')';
        ctx.fillRect(px, scY + 2, 1.2, scH);
      }
      // 3) 세기 그래프
      var Tp = scY + scH + 22, B = h - 36;
      var sx = function (x) { return L + (x + XM) / (2 * XM) * (R - L); }, syy = function (v) { return B - v * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      [-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6].forEach(function (x) { ctx.beginPath(); ctx.moveTo(sx(x), Tp); ctx.lineTo(sx(x), B); ctx.stroke(); ctx.fillText(x.toFixed(1), sx(x), B + 14); });
      ctx.textAlign = 'right';
      [0, 0.5, 1].forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, syy(v)); ctx.lineTo(R, syy(v)); ctx.stroke(); ctx.fillText(v.toFixed(1), L - 5, syy(v) + 4); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('sin θ', (L + R) / 2, B + 30);
      ctx.save(); ctx.translate(12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('상대 세기', 0, 0); ctx.restore();
      // 주 극대 위치 표시
      var lam = s.lam / 1000;
      if (s.N > 1) {
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
        for (var m = -10; m <= 10; m++) { var xm = m * lam / s.d; if (Math.abs(xm) < XM * 0.98 && Math.abs(xm) < 1) ctx.fillText(m === 0 ? '0' : (m > 0 ? '+' : '') + m, sx(xm), Tp - 4); }
      }
      // 곡선(픽셀마다 최댓값으로 그려 가는 극대도 놓치지 않게)
      ctx.beginPath();
      for (var p2 = 0; p2 <= R - L; p2++) {
        var mxv = 0; for (var sb = 0; sb < 8; sb++) { var x2 = -XM + ((p2 + sb / 8) / (R - L)) * 2 * XM; mxv = Math.max(mxv, I(x2)); }
        if (p2 === 0) ctx.moveTo(L + p2, syy(mxv)); else ctx.lineTo(L + p2, syy(mxv));
      }
      ctx.lineTo(R, B); ctx.lineTo(L, B); ctx.closePath();
      ctx.fillStyle = T.figSoftBlue; ctx.fill();
      ctx.beginPath();
      for (var p3 = 0; p3 <= R - L; p3++) {
        var mv = 0; for (var sc2 = 0; sc2 < 8; sc2++) { var x3 = -XM + ((p3 + sc2 / 8) / (R - L)) * 2 * XM; mv = Math.max(mv, I(x3)); }
        if (p3 === 0) ctx.moveTo(L + p3, syy(mv)); else ctx.lineTo(L + p3, syy(mv));
      }
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 1.8; ctx.stroke();
      // 회절 봉투
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.6; ctx.beginPath();
      for (var p4 = 0; p4 <= R - L; p4 += 2) { var x4 = -XM + p4 / (R - L) * 2 * XM; if (p4 === 0) ctx.moveTo(L + p4, syy(env(x4))); else ctx.lineTo(L + p4, syy(env(x4))); }
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figRed; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      var ez = lam / s.a;
      ctx.fillText('점선: 회절 봉투 (첫 어두운 곳 sinθ = λ/a = ' + (ez < 1 ? ez.toFixed(2) : '>1') + ')', R, Tp + 14);
    }
    api.onResize(draw);
    update();
  },
});
