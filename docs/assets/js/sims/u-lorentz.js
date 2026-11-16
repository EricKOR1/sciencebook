/* 일반물리학 12 특수 상대성: 로런츠 인자, 시간 팽창·길이 수축, 상대론적 운동 에너지 */
Sims.register('u-lorentz', {
  title: '속력에 따른 로런츠 인자 — 시간, 길이, 운동 에너지',
  caption: '속력 β = v/c를 올리며 위의 막대와 시계, 아래 두 그래프를 함께 보자. β가 0.3쯤까지는 γ가 거의 1이고 운동 에너지도 뉴턴 역학의 ½mv²과 겹치지만, β가 1에 가까워지면 γ와 (γ − 1)mc²는 끝없이 커진다. 뉴턴 역학의 곡선은 β = 1에서 ½mc²에 그치므로, 유한한 에너지로 빛의 속력에 이를 수 있다는 틀린 예측을 한다. 시계는 땅에서 1 s가 지나는 동안 움직이는 시계가 가리키는 시간(1/γ s)이고, 막대는 고유 길이 100 m인 우주선을 땅에서 잰 길이이다. 전자의 운동 에너지는 정지 에너지 0.511 MeV로 계산했다.',
  init: function (api) {
    var s = { b: 0.6 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.45 : 0.62; }, label: '로런츠 인자와 운동 에너지 그래프, 길이 수축과 시간 팽창 그림' });
    var ctx = cv.ctx;

    var rG = api.readout('γ');
    var rT = api.readout('땅의 1 s 동안 움직이는 시계');
    var rL = api.readout('100 m 우주선의 길이');
    var rK = api.readout('전자의 K (상대론 / 뉴턴)');
    var rPc = api.readout('전자의 pc');

    var sl = api.slider({ id: 'u-lorentz-b', label: '속력 β = v/c', min: 0, max: 0.999, step: 0.001, value: 0.6,
      format: function (v) { return v.toFixed(3); }, onInput: function (v) { s.b = v; update(); } });
    var g = api.group();
    [0.1, 0.6, 0.8, 0.941, 0.995].forEach(function (b) { api.button('β = ' + b, function () { sl.set(b); }, { parent: g }); });

    function gam(b) { return 1 / Math.sqrt(1 - b * b); }
    function update() {
      var G = gam(s.b), ME = 0.511;
      rG.set(G < 10 ? G.toFixed(3) : G.toFixed(1));
      rT.set((1 / G).toFixed(3) + ' s');
      rL.set((100 / G).toFixed(1) + ' m');
      var K = (G - 1) * ME, Kn = 0.5 * s.b * s.b * ME;
      rK.set(fmtMeV(K) + ' / ' + fmtMeV(Kn));
      rPc.set(fmtMeV(G * s.b * ME));
      draw();
    }
    function fmtMeV(e) { return e < 0.001 ? (e * 1e6).toFixed(0) + ' eV' : e < 1 ? (e * 1000).toFixed(e < 0.01 ? 2 : 0) + ' keV' : e.toFixed(2) + ' MeV'; }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var topH = narrow ? h * 0.36 : h * 0.3;
      drawScene(T, { x: 0, y: 0, w: w, h: topH }, narrow);
      if (narrow) {
        drawGamma(T, { x: 0, y: topH + 4, w: w, h: (h - topH) / 2 - 4 });
        drawK(T, { x: 0, y: topH + (h - topH) / 2 + 4, w: w, h: (h - topH) / 2 - 4 });
      } else {
        drawGamma(T, { x: 0, y: topH + 6, w: w * 0.49, h: h - topH - 6 });
        drawK(T, { x: w * 0.51, y: topH + 6, w: w * 0.49, h: h - topH - 6 });
      }
    }
    function drawScene(T, r, narrow) {
      var G = gam(s.b);
      // 막대(우주선): 고유 길이와 땅에서 잰 길이
      var clockR, clockX, cy, L0, x0 = r.x + 90, y1, y2;
      if (narrow) {
        clockR = Math.min(r.h * 0.16, 30); L0 = r.w - 90 - 64;
        y1 = r.y + r.h * 0.12; y2 = r.y + r.h * 0.32;
        cy = r.y + r.h * 0.70; clockX = r.x + r.w / 2 - clockR - 30;
      } else {
        clockR = Math.min(r.h * 0.34, 34); clockX = r.x + r.w - 60 - 2 * clockR - 34;
        L0 = Math.min(clockX - clockR - x0 - 70, 380);
        y1 = r.y + r.h * 0.32; y2 = r.y + r.h * 0.72; cy = r.y + r.h * 0.5;
      }
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillStyle = T.figMuted;
      ctx.fillText('정지했을 때', x0 - 8, y1 + 4);
      ctx.fillText('땅에서 잴 때', x0 - 8, y2 + 4);
      ship(x0, y1, L0, T.figSoftBlue, T.figBlue);
      ship(x0, y2, L0 / G, T.figSoftAmber, T.figAmber);
      ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('100 m', x0 + L0 + 10, y1 + 4);
      ctx.fillText((100 / G).toFixed(1) + ' m', x0 + L0 / G + 10, y2 + 4);
      // 진행 방향
      if (s.b > 0.005) {
        ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2;
        var ax = x0, ay = y2 + 20;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + 40, ay); ctx.stroke();
        ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.moveTo(ax + 46, ay); ctx.lineTo(ax + 38, ay - 4); ctx.lineTo(ax + 38, ay + 4); ctx.closePath(); ctx.fill();
        ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('v = ' + s.b.toFixed(3) + 'c', ax + 52, ay + 4);
      }
      // 시계 두 개: 땅의 시계 1 s(한 바퀴), 움직이는 시계 1/γ s
      clock(clockX, cy, 1, '땅의 시계', T.figBlue);
      clock(clockX + clockR * 2 + 34, cy, 1 / G, '움직이는 시계', T.figAmber);
      function clock(x, y, frac, lab, col) {
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5; ctx.fillStyle = T.figPanel;
        ctx.beginPath(); ctx.arc(x, y, clockR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = col; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(x, y);
        ctx.arc(x, y, clockR - 3, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2 * 0.9999); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
        var a = -Math.PI / 2 + frac * Math.PI * 2;
        ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * (clockR - 5), y + Math.sin(a) * (clockR - 5)); ctx.stroke();
        ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(lab, x, y + clockR + 14);
        ctx.fillText(frac.toFixed(2) + ' s', x, y - clockR - 5);
      }
    }
    function ship(x, y, len, fill, stroke) {
      ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 2;
      var hh = 9, nose = Math.min(16, len * 0.2);
      ctx.beginPath(); ctx.moveTo(x, y - hh); ctx.lineTo(x + len - nose, y - hh); ctx.lineTo(x + len, y); ctx.lineTo(x + len - nose, y + hh); ctx.lineTo(x, y + hh); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    function axes(T, r, title, ymax, yticks, ylab) {
      var L = r.x + 46, R = r.x + r.w - 12, Tp = r.y + 24, B = r.y + r.h - 32;
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(title, r.x + 8, r.y + 14);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      var sx = function (b) { return L + b * (R - L); }, sy = function (v) { return B - v / ymax * (B - Tp); };
      [0, 0.2, 0.4, 0.6, 0.8, 1].forEach(function (b) { ctx.beginPath(); ctx.moveTo(sx(b), Tp); ctx.lineTo(sx(b), B); ctx.stroke(); ctx.fillText(b, sx(b), B + 14); });
      ctx.textAlign = 'right';
      yticks.forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(v, L - 5, sy(v) + 4); });
      ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('β = v/c', (L + R) / 2, B + 28);
      ctx.save(); ctx.translate(r.x + 10, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(ylab, 0, 0); ctx.restore();
      return { L: L, R: R, Tp: Tp, B: B, sx: sx, sy: sy };
    }
    function curve(A, f, col, lw, dash) {
      ctx.save(); ctx.beginPath(); ctx.rect(A.L, A.Tp, A.R - A.L, A.B - A.Tp); ctx.clip();
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.beginPath();
      for (var i = 0; i <= 400; i++) { var b = i / 400 * 0.9995, y = A.sy(f(b)); if (i === 0) ctx.moveTo(A.sx(b), y); else ctx.lineTo(A.sx(b), Math.max(A.Tp - 20, y)); }
      ctx.stroke(); ctx.restore();
    }
    function dot(A, b, v, col) {
      var y = A.sy(v);
      if (y < A.Tp) { ctx.fillStyle = col; ctx.font = '11px ' + T0().fontBody; ctx.textAlign = 'center'; ctx.fillText('↑ ' + v.toFixed(1), A.sx(b) - 14, A.Tp + 12); return; }
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(A.sx(b), y, 5, 0, Math.PI * 2); ctx.fill();
    }
    function T0() { return api.tokens(); }
    function drawGamma(T, r) {
      var A = axes(T, r, '로런츠 인자 γ = 1/√(1 − β²)', 8, [1, 2, 4, 6, 8], 'γ');
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figMuted; ctx.beginPath(); ctx.moveTo(A.sx(1), A.Tp); ctx.lineTo(A.sx(1), A.B); ctx.stroke(); ctx.setLineDash([]);
      curve(A, gam, T.figAccent, 2.4);
      dot(A, s.b, gam(s.b), T.figRed);
    }
    function drawK(T, r) {
      var A = axes(T, r, '운동 에너지 K (mc² 단위)', 3, [0, 0.5, 1, 2, 3], 'K / mc²');
      curve(A, function (b) { return gam(b) - 1; }, T.figAccent, 2.4);
      curve(A, function (b) { return 0.5 * b * b; }, T.figGreen, 2, [6, 4]);
      dot(A, s.b, gam(s.b) - 1, T.figRed);
      dot(A, s.b, 0.5 * s.b * s.b, T.figGreen);
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figAccent; ctx.fillText('상대론 (γ − 1)mc²', A.L + 6, A.Tp + 12);
      ctx.fillStyle = T.figGreen; ctx.fillText('뉴턴 ½mv²', A.L + 6, A.Tp + 26);
    }
    api.onResize(draw);
    update();
  },
});
