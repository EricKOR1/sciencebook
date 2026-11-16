/* 일반물리학 11 거울·렌즈 방정식: 1/p + 1/i = 1/f 와 부호 규약, 배율 */
Sims.register('u-mirror-lens', {
  title: '거울과 렌즈를 한 식으로 — 1/p + 1/i = 1/f 와 부호 규약',
  caption: '오목 거울·볼록 거울·볼록렌즈·오목렌즈를 바꾸고 물체 거리 p와 초점 거리를 움직여 보자. 연한 초록 영역은 실상이 생기는 쪽(i > 0: 거울은 앞, 렌즈는 뒤), 연한 보라 영역은 허상이 생기는 쪽(i < 0)이다. 네 경우 모두 같은 식과 m = −i/p로 상의 위치·크기·방향이 정해지고, 오른쪽 그래프에서 p가 f를 지날 때 i가 +∞에서 −∞로 건너뛰는 것을 볼 수 있다. 근축 광선만 생각해 거울·렌즈를 한 평면으로 그렸고(얇은 렌즈), 물체 높이는 8 cm로 고정했다.',
  init: function (api) {
    var KINDS = [
      { name: '오목 거울', mirror: true, sign: 1 },
      { name: '볼록 거울', mirror: true, sign: -1 },
      { name: '볼록렌즈', mirror: false, sign: 1 },
      { name: '오목렌즈', mirror: false, sign: -1 },
    ];
    var s = { kind: 0, p: 30, F: 20, h: 8 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.35 : 0.56; }, label: '거울 또는 렌즈의 광선 그림과 물체 거리에 따른 상 거리 그래프' });
    var ctx = cv.ctx;

    var rF = api.readout('f');
    var rI = api.readout('상 거리 i');
    var rM = api.readout('배율 m');
    var rK = api.readout('상');

    var g = api.group();
    var btns = KINDS.map(function (k, i) {
      return api.button(k.name, function () { s.kind = i; btns.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); update(); }, { toggle: true, pressed: i === 0, parent: g });
    });
    api.slider({ id: 'u-mirror-lens-p', label: '물체 거리 p', min: 4, max: 80, step: 1, value: 30,
      format: function (v) { return v + ' cm'; }, onInput: function (v) { s.p = v; update(); } });
    api.slider({ id: 'u-mirror-lens-f', label: '초점 거리의 크기 |f|', min: 10, max: 30, step: 1, value: 20,
      format: function (v) { return v + ' cm'; }, onInput: function (v) { s.F = v; update(); } });

    function K() { return KINDS[s.kind]; }
    function f() { return K().sign * s.F; }
    function solve(p) { var ff = f(); if (Math.abs(p - ff) < 1e-9) return Infinity; return p * ff / (p - ff); }
    function update() {
      var i = solve(s.p), ff = f();
      rF.set((ff > 0 ? '+' : '') + ff + ' cm');
      if (!isFinite(i)) { rI.set('∞ (상이 생기지 않음)'); rM.set('–'); rK.set('나란한 빛으로 나감'); draw(); return; }
      var m = -i / s.p;
      rI.set((i > 0 ? '+' : '') + i.toFixed(1) + ' cm');
      rM.set((m > 0 ? '+' : '') + m.toFixed(2));
      rK.set((i > 0 ? '실상' : '허상') + ', ' + (m > 0 ? '똑바로' : '거꾸로') + ', ' + (Math.abs(m) > 1.005 ? '확대' : Math.abs(m) < 0.995 ? '축소' : '같은 크기'));
      draw();
    }
    function layout() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { rd: { x: 0, y: 0, w: w, h: h * 0.56 }, gr: { x: 0, y: h * 0.58, w: w, h: h * 0.42 } }
        : { rd: { x: 0, y: 0, w: w * 0.64, h: h }, gr: { x: w * 0.66, y: 0, w: w * 0.34, h: h } };
    }
    function draw() {
      var T = api.tokens(), P = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawRays(T, P.rd); drawGraph(T, P.gr);
    }
    function drawRays(T, r) {
      var k = K(), ff = f(), i = solve(s.p);
      // 보이는 범위(cm): 거울은 앞 95, 뒤 65 / 렌즈는 앞 95, 뒤 115
      var xmin = -95, xmax = k.mirror ? 65 : 115;
      var sc = (r.w - 16) / (xmax - xmin);
      var X = function (x) { return r.x + 8 + (x - xmin) * sc; };
      var cy = r.y + r.h * 0.54;
      var Y = function (y) { return cy - y * sc; };
      var top = r.y + 22, bot = r.y + r.h - 6;
      // 실상 쪽 / 허상 쪽 영역
      var realLeft = k.mirror;   // 거울: 실상은 앞(왼쪽), 렌즈: 실상은 뒤(오른쪽)
      ctx.fillStyle = T.figSoftGreen;
      if (realLeft) ctx.fillRect(r.x, top, X(0) - r.x, bot - top); else ctx.fillRect(X(0), top, r.x + r.w - X(0), bot - top);
      ctx.fillStyle = T.figSoftViolet;
      if (realLeft) ctx.fillRect(X(0), top, r.x + r.w - X(0), bot - top); else ctx.fillRect(r.x, top, X(0) - r.x, bot - top);
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillStyle = T.figGreen;
      var realMid = realLeft ? (r.x + X(0)) / 2 : (X(0) + r.x + r.w) / 2, virtMid = realLeft ? (X(0) + r.x + r.w) / 2 : (r.x + X(0)) / 2;
      ctx.fillText('i > 0 : 실상 쪽', realMid, top + 13);
      ctx.fillStyle = T.figViolet; ctx.fillText('i < 0 : 허상 쪽', virtMid, top + 13);
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(k.name + (k.mirror ? ' (빛은 왼쪽에서 와서 왼쪽으로 반사)' : ' (빛은 왼쪽에서 오른쪽으로)'), r.x + 6, r.y + 14);
      // 광축
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(r.x, cy); ctx.lineTo(r.x + r.w, cy); ctx.stroke();
      // 초점 표시: 거울 F, 렌즈 F와 F'
      function mark(x, lab) {
        if (X(x) < r.x + 4 || X(x) > r.x + r.w - 4) return;
        ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(X(x), cy, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText(lab, X(x), cy + 16);
      }
      if (k.mirror) { mark(-ff, 'F'); mark(-2 * ff, 'C'); }
      else { mark(-s.F, 'F'); mark(s.F, 'F′'); mark(-2 * s.F, '2F'); mark(2 * s.F, '2F′'); }
      // 거울 / 렌즈
      var hh = Math.min(r.h * 0.38, 46 * sc);
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 3;
      if (k.mirror) {
        var bend = (k.sign > 0 ? 1 : -1) * 7;   // 오목: 가장자리가 물체 쪽(왼쪽)으로 휨
        ctx.beginPath(); ctx.moveTo(X(0) - bend, cy - hh); ctx.quadraticCurveTo(X(0) + bend, cy, X(0) - bend, cy + hh); ctx.stroke();
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
        for (var t = -hh; t < hh; t += 9) { var xb = X(0) - bend * (t / hh) * (t / hh); ctx.beginPath(); ctx.moveTo(xb + 2, cy + t); ctx.lineTo(xb + 8, cy + t + 6); ctx.stroke(); }
      } else {
        ctx.fillStyle = T.figSoftBlue; ctx.beginPath();
        var wv = k.sign > 0 ? 9 : -6, edge = k.sign > 0 ? 1 : 9;
        ctx.moveTo(X(0) - edge, cy - hh); ctx.quadraticCurveTo(X(0) - edge - wv * 2, cy, X(0) - edge, cy + hh);
        ctx.lineTo(X(0) + edge, cy + hh); ctx.quadraticCurveTo(X(0) + edge + wv * 2, cy, X(0) + edge, cy - hh); ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
      // 물체
      var ox = X(-s.p);
      arrowUp(ox, cy, Y(s.h), T.figGreen, 3);
      ctx.fillStyle = T.figGreen; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('물체', ox, cy + 30);
      // 광선
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, top, r.w, bot - top); ctx.clip();
      var O = [-s.p, s.h];
      var hits = [s.h, 0, -s.h * ff / (s.p - ff)];   // 거울·렌즈 면에 닿는 높이(평행 광선, 중심, 초점 방향)
      var cols = [T.figRed, T.figAmber, T.figTeal];
      var dirOut = k.mirror ? -1 : 1;
      var img = isFinite(i) ? [k.mirror ? -i : i, -i / s.p * s.h] : null;
      hits.forEach(function (yh, n) {
        var col = cols[n];
        line(O[0], O[1], 0, yh, col, 1.8, false);
        var dx, dy;
        if (img) {
          var real = i > 0;
          dx = real ? img[0] - 0 : 0 - img[0]; dy = real ? img[1] - yh : yh - img[1];
          if (!real) line(0, yh, img[0], img[1], col, 1.3, true);   // 허상: 연장선(점선)
        } else {
          // p = f: 모든 광선이 중심 광선의 나간 방향과 나란하게 나간다
          dx = k.mirror ? -s.p : s.p; dy = -s.h;
        }
        if (dx * dirOut < 0) { dx = -dx; dy = -dy; }
        var len = 400 / Math.hypot(dx, dy);
        line(0, yh, dx * len, yh + dy * len, col, 1.8, false);
      });
      // 상
      if (img) {
        var ix = X(img[0]);
        if (ix > r.x && ix < r.x + r.w) {
          ctx.globalAlpha = i > 0 ? 1 : 0.85;
          arrowUp(ix, cy, Y(img[1]), T.figViolet, 3, i < 0);
          ctx.globalAlpha = 1;
          ctx.fillStyle = T.figViolet; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
          ctx.fillText(i > 0 ? '실상' : '허상', ix, img[1] > 0 ? (Math.abs(ix - ox) < 44 ? cy + 44 : cy + 30) : cy - 8);
        }
      }
      ctx.restore();
      if (img && (X(img[0]) <= r.x || X(img[0]) >= r.x + r.w)) {
        ctx.fillStyle = T.figViolet; ctx.font = '12px ' + T.fontBody; ctx.textAlign = X(img[0]) <= r.x ? 'left' : 'right';
        ctx.fillText(X(img[0]) <= r.x ? '← 상이 화면 밖' : '상이 화면 밖 →', X(img[0]) <= r.x ? r.x + 6 : r.x + r.w - 6, bot - 8);
      }
      // 거리 눈금(10 cm)
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.5;
      var bx = r.x + 10, by = bot - 26;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 10 * sc, by); ctx.moveTo(bx, by - 4); ctx.lineTo(bx, by + 4); ctx.moveTo(bx + 10 * sc, by - 4); ctx.lineTo(bx + 10 * sc, by + 4); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('10 cm', bx + 10 * sc + 4, by + 4);

      function line(x1, y1, x2, y2, col, lw, dash) {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash ? [5, 4] : []);
        ctx.beginPath(); ctx.moveTo(X(x1), Y(y1)); ctx.lineTo(X(x2), Y(y2)); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    function arrowUp(x, y0, y1, col, lw, dash) {
      var d = y1 < y0 ? -1 : 1;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash ? [4, 3] : []);
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1 - d * 6); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x - 6, y1 - d * 10); ctx.lineTo(x + 6, y1 - d * 10); ctx.closePath(); ctx.fill();
    }
    function drawGraph(T, r) {
      var L = r.x + 44, R = r.x + r.w - 10, Tp = r.y + 30, B = r.y + r.h - 36, IM = 100;
      var sx = function (p) { return L + p / 80 * (R - L); }, sy = function (i) { return (Tp + B) / 2 - i / IM * (B - Tp) / 2; };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('상 거리 i 와 물체 거리 p', r.x + 6, r.y + 16);
      ctx.fillStyle = T.figSoftGreen; ctx.fillRect(L, Tp, R - L, sy(0) - Tp);
      ctx.fillStyle = T.figSoftViolet; ctx.fillRect(L, sy(0), R - L, B - sy(0));
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      [0, 20, 40, 60, 80].forEach(function (p) { ctx.beginPath(); ctx.moveTo(sx(p), Tp); ctx.lineTo(sx(p), B); ctx.stroke(); ctx.fillText(p, sx(p), B + 14); });
      ctx.textAlign = 'right';
      [-100, -50, 0, 50, 100].forEach(function (i) { ctx.beginPath(); ctx.moveTo(L, sy(i)); ctx.lineTo(R, sy(i)); ctx.stroke(); ctx.fillText((i > 0 ? '+' : '') + i, L - 4, sy(i) + 4); });
      ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('p (cm)', (L + R) / 2, B + 28);
      ctx.save(); ctx.translate(r.x + 10, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('i (cm)', 0, 0); ctx.restore();
      var ff = f();
      ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figMuted;
      ctx.beginPath(); ctx.moveTo(L, sy(ff)); ctx.lineTo(R, sy(ff)); ctx.stroke();
      if (ff > 0) { ctx.beginPath(); ctx.moveTo(sx(ff), Tp); ctx.lineTo(sx(ff), B); ctx.stroke(); }
      ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('i = f', R - 30, sy(ff) + (ff > 0 ? -4 : 13));
      if (ff > 0) ctx.fillText('p = f', sx(ff) + 3, Tp + 12);
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, R - L, B - Tp); ctx.clip();
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.2;
      ctx.beginPath(); var pen = false;
      for (var n = 0; n <= 400; n++) {
        var p = 0.5 + n / 400 * 79.5, i = solve(p);
        if (!isFinite(i) || Math.abs(i) > 400 || (ff > 0 && Math.abs(p - ff) < 0.25)) { pen = false; continue; }
        if (!pen) { ctx.moveTo(sx(p), sy(i)); pen = true; } else ctx.lineTo(sx(p), sy(i));
      }
      ctx.stroke();
      var ic = solve(s.p);
      if (isFinite(ic)) { ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(sx(s.p), sy(Math.max(-IM * 1.05, Math.min(IM * 1.05, ic))), 5, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    api.onResize(draw);
    update();
  },
});
