/* pchem-5 혼합물과 용액의 열역학: 분별 증류의 계단(전환류) — 상대 휘발도와 이론단 수, 공비점의 벽 */
Sims.register('mj-distillation-stairs', {
  title: '분별 증류 계단 — 상대 휘발도 α와 이론단 수, 공비점의 벽',
  caption: 'y–x 도표에서 바닥 조성 x_W부터 평형 곡선까지 수직(한 단에서 액체와 평형인 증기), 대각선까지 수평(전환류: 그 증기가 응축해 위 단의 액체가 된다)으로 계단을 오르며 목표 조성 x_D까지 필요한 이론단 수를 센다. α를 1 쪽으로 줄여 보면 계단이 잘아져 단 수가 1/ln α에 비례해 급격히 늘어난다(오른쪽 그래프). ‘공비계’를 켜면 양의 벗어남(정규 용액, ξ = 1.8)이 더해져 평형 곡선이 대각선을 가로지르고, 계단은 공비 조성 앞에서 멈춰 그 너머의 x_D에는 도달하지 못한다. 이상 계는 y = αx/[1 + (α − 1)x](α 일정), 공비계는 같은 온도의 증기 압력 비를 α로 두고 온도 변화를 무시한 단순화이다.',
  init: function (api) {
    var XI = 1.8, MAXST = 400;
    var st = { a: 2.4, xw: 0.05, xd: 0.95, azeo: false };

    function eq(x) {
      if (!st.azeo) return st.a * x / (1 + (st.a - 1) * x);
      var gA = Math.exp(XI * (1 - x) * (1 - x)), gB = Math.exp(XI * x * x);
      var pa = x * gA * st.a, pb = (1 - x) * gB;
      return pa / (pa + pb);
    }
    function xaz() {               // 공비 조성(휘발성 성분 기준)
      if (!st.azeo) return null;
      var v = 0.5 * (1 + Math.log(st.a) / XI);
      return (v > 0 && v < 1) ? v : null;
    }
    function stairs() {
      var x = st.xw, pts = [], n = 0, reached = false;
      while (n < MAXST) {
        var y = eq(x);
        if (y <= x + 1e-7) break;                 // 더 오를 수 없음(공비점)
        pts.push([x, y]); n++;
        x = y;
        if (x >= st.xd) { reached = true; break; }
      }
      return { pts: pts, n: n, reached: reached, last: x };
    }
    function fenske(a) { return Math.log(st.xd / (1 - st.xd) * (1 - st.xw) / st.xw) / Math.log(a); }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.75 : 0.62; }, label: 'y–x 도표 위의 전환류 계단과, 상대 휘발도에 따른 필요한 이론단 수 그래프' });
    var ctx = cv.ctx;
    var rN = api.readout('필요한 이론단 수 ');
    var rF = api.readout('펜스키 식 N_min ');
    var rZ = api.readout('공비 조성 ');

    api.slider({ id: 'mj-distillation-stairs-a', label: '상대 휘발도 α', min: 1.2, max: 5, step: 0.05, value: st.a,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.a = v; draw(); } });
    api.slider({ id: 'mj-distillation-stairs-xw', label: '시작(바닥) 조성 x_W', min: 0.02, max: 0.5, step: 0.01, value: st.xw,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.xw = v; if (st.xd <= v + 0.05) { st.xd = Math.min(0.995, v + 0.05); sD.set(st.xd); } draw(); } });
    var sD = api.slider({ id: 'mj-distillation-stairs-xd', label: '목표(꼭대기) 조성 x_D', min: 0.6, max: 0.995, step: 0.005, value: st.xd,
      format: function (v) { return v.toFixed(3); }, onInput: function (v) { st.xd = v; draw(); } });
    var g = api.group();
    var bAz = api.button('공비계 보기(양의 벗어남)', function () {
      st.azeo = !st.azeo; bAz.setAttribute('aria-pressed', st.azeo ? 'true' : 'false'); draw();
    }, { toggle: true, parent: g });

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) {
        var s = Math.min(w - 70, h * 0.56);
        return { a: { x: 50, y: 12, w: s, h: s }, b: { x: 50, y: s + 74, w: w - 66, h: h - s - 124 } };
      }
      var s2 = Math.min(h - 62, w * 0.56);
      return { a: { x: 50, y: 12, w: s2, h: s2 }, b: { x: s2 + 120, y: 12, w: w - s2 - 136, h: s2 } };
    }
    function axes(T, r, xr, yr, xt, yt, xl, yl, fmtx, fmty) {
      ctx.fillStyle = T.figPanel; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      var X = function (v) { return r.x + (v - xr[0]) / (xr[1] - xr[0]) * r.w; };
      var Y = function (v) { return r.y + r.h - (v - yr[0]) / (yr[1] - yr[0]) * r.h; };
      ctx.setLineDash([2, 4]); ctx.strokeStyle = T.figLine;
      xt.forEach(function (v) { ctx.beginPath(); ctx.moveTo(X(v), r.y); ctx.lineTo(X(v), r.y + r.h); ctx.stroke(); });
      yt.forEach(function (v) { ctx.beginPath(); ctx.moveTo(r.x, Y(v)); ctx.lineTo(r.x + r.w, Y(v)); ctx.stroke(); });
      ctx.setLineDash([]);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      xt.forEach(function (v) { ctx.fillText(fmtx(v), X(v), r.y + r.h + 4); });
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      yt.forEach(function (v) { ctx.fillText(fmty(v), r.x - 5, Y(v)); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(xl, r.x + r.w / 2, r.y + r.h + 20);
      ctx.save(); ctx.translate(r.x - 36, r.y + r.h / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'middle'; ctx.fillText(yl, 0, 0); ctx.restore();
      return { X: X, Y: Y };
    }
    function label(T, s, x, y, col, align, bold) {
      ctx.font = (bold ? '600 ' : '') + '12px ' + T.fontBody; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
      var w = ctx.measureText(s).width, x0 = align === 'right' ? x - w : (align === 'center' ? x - w / 2 : x);
      ctx.fillStyle = T.figPanel; ctx.fillRect(x0 - 3, y - 8, w + 6, 16);
      ctx.fillStyle = col; ctx.fillText(s, x, y);
    }
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      var f2 = function (v) { return v.toFixed(1); };
      var A = axes(T, L.a, [0, 1], [0, 1], [0, 0.2, 0.4, 0.6, 0.8, 1], [0, 0.2, 0.4, 0.6, 0.8, 1], '액체 조성 x (휘발성 성분)', '증기 조성 y', f2, f2);
      // 대각선, 평형 곡선
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(A.X(0), A.Y(0)); ctx.lineTo(A.X(1), A.Y(1)); ctx.stroke();
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.4; ctx.beginPath();
      for (var i = 0; i <= 200; i++) { var x = i / 200; var px = A.X(x), py = A.Y(eq(x)); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.stroke();
      // x_W, x_D 선
      ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2;
      ctx.strokeStyle = T.figBlue; ctx.beginPath(); ctx.moveTo(A.X(st.xw), L.a.y); ctx.lineTo(A.X(st.xw), L.a.y + L.a.h); ctx.stroke();
      ctx.strokeStyle = T.figViolet; ctx.beginPath(); ctx.moveTo(A.X(st.xd), L.a.y); ctx.lineTo(A.X(st.xd), L.a.y + L.a.h); ctx.stroke();
      ctx.setLineDash([]);
      // 계단
      var S = stairs(), z = xaz();
      ctx.strokeStyle = T.figInk; ctx.lineWidth = S.n > 40 ? 1 : 1.8;
      ctx.beginPath();
      S.pts.forEach(function (p) {
        ctx.moveTo(A.X(p[0]), A.Y(p[0])); ctx.lineTo(A.X(p[0]), A.Y(p[1])); ctx.lineTo(A.X(p[1]), A.Y(p[1]));
      });
      ctx.stroke();
      if (S.n <= 25) {
        ctx.font = '600 11px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        S.pts.forEach(function (p, k) { ctx.fillText(String(k + 1), A.X(p[0]) - 3, A.Y(p[1]) - 1); });
      }
      if (z !== null) {
        ctx.fillStyle = T.figViolet; ctx.beginPath(); ctx.arc(A.X(z), A.Y(z), 5, 0, 7); ctx.fill();
        label(T, '공비점 ' + z.toFixed(3), A.X(z) - 8, A.Y(z) + 16, T.figViolet, 'right', true);
      }
      label(T, 'x_W', A.X(st.xw) + 4, L.a.y + 12, T.figBlue, 'left');
      label(T, 'x_D', A.X(st.xd) - 4, L.a.y + L.a.h - 12, T.figViolet, 'right');
      label(T, '평형 곡선', A.X(0.28), A.Y(eq(0.28)) - 14, T.figRed, 'right');
      // 오른쪽: 이상 계에서 α에 따른 단 수
      var nmax = Math.max(10, Math.ceil(fenske(1.2) / 10) * 10);
      var yt = []; for (var v = 0; v <= nmax; v += (nmax > 60 ? 20 : 10)) yt.push(v);
      var B = axes(T, L.b, [1, 5], [0, nmax], [1, 2, 3, 4, 5], yt, '상대 휘발도 α', '이론단 수(이상 계)', function (v) { return String(v); }, function (v) { return String(v); });
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2.2; ctx.beginPath();
      var first = true;
      for (var a = 1.02; a <= 5.0001; a += 0.02) {
        var nv = fenske(a); if (nv > nmax * 1.05) continue;
        var bx = B.X(a), by = B.Y(Math.min(nv, nmax));
        if (first) { ctx.moveTo(bx, by); first = false; } else ctx.lineTo(bx, by);
      }
      ctx.stroke();
      var nf = fenske(st.a);
      ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.arc(B.X(st.a), B.Y(Math.min(nf, nmax)), 5, 0, 7); ctx.fill();
      label(T, 'N_min = ' + nf.toFixed(1), B.X(st.a) + 8, B.Y(Math.min(nf, nmax)) - 12, T.figRed, B.X(st.a) > L.b.x + L.b.w * 0.6 ? 'right' : 'left', true);
      label(T, '펜스키 식(같은 x_W, x_D)', L.b.x + L.b.w - 6, L.b.y + 14, T.figBlue, 'right');
      // 읽기
      if (S.reached) rN.set(S.n + '단' + (st.azeo ? ' (공비계)' : ''));
      else if (z !== null && st.xd > z) rN.set('도달 불가 — 공비 조성 ' + z.toFixed(3) + '을 넘지 못함');
      else rN.set(MAXST + '단 이상');
      rF.set(st.azeo ? '(이상 계에만 해당)' : nf.toFixed(2) + ' → ' + Math.ceil(nf - 1e-9) + '단');
      rZ.set(z === null ? '없음(이상 계)' : 'x = ' + z.toFixed(3));
      if (!S.reached && z !== null && st.xd > z) {
        label(T, '계단이 공비점 앞에서 멈춘다', L.a.x + L.a.w / 2, L.a.y + L.a.h * 0.35, T.figViolet, 'center', true);
      }
    }
    api.onResize(draw); api.onTheme(draw);
    draw();
  }
});
