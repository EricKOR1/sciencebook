/* 일반생명과학 8 하디–바인베르크 평형: 생식 세포 넓이 그림(p², 2pq, q²), 유전자형 빈도 막대, p에 따른 세 곡선, 무작위 교배 한 세대로 평형 도달 */
Sims.register('u-hardy-weinberg', {
  title: '하디–바인베르크 평형 — p 하나로 정해지는 유전자형 빈도',
  caption: 'A의 빈도 p를 움직이면 정사각형(정자 × 난자의 무작위 만남)의 네 칸 넓이가 p², pq, pq, q²로 바뀌고, 오른쪽 곡선 위의 점이 함께 움직인다. 이형 접합자(2pq)는 p = 0.5일 때 가장 많고, q가 작으면 aa(q²)보다 Aa가 훨씬 많아 a 대부분이 보인자 속에 숨는다(예제 2). ‘이형 접합자 없는 집단 만들기’로 평형에서 벗어난 집단을 만든 뒤 ‘무작위 교배 한 세대’를 누르면, 대립유전자 빈도는 그대로인 채 유전자형 빈도가 단 한 세대 만에 p² : 2pq : q²가 된다. 집단이 매우 크고, 무작위 교배를 하며, 돌연변이·선택·이주가 없다고 가정한다.',
  init: function (api) {
    var st = { p: 0.6, AA: 0.36, Aa: 0.48, aa: 0.16, gen: 0, eq: true };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.35 : 0.46; }, label: '하디–바인베르크 넓이 그림, 유전자형 빈도 막대, p에 따른 곡선' });
    var ctx = cv.ctx;

    var rPQ = api.readout('p (A) · q (a)');
    var rG = api.readout('AA : Aa : aa');
    var rHid = api.readout('a 가운데 Aa 속에 있는 비율');
    var rState = api.readout('상태');

    var sl = api.slider({ id: 'u-hardy-weinberg-p', label: 'A의 빈도 p', min: 0, max: 1, step: 0.01, value: st.p,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.p = v; toHW(); st.gen = 0; draw(); } });
    api.button('이형 접합자 없는 집단 만들기', function () { st.AA = st.p; st.Aa = 0; st.aa = 1 - st.p; st.eq = false; st.gen = 0; draw(); });
    api.button('무작위 교배 한 세대', function () { toHW(); st.gen++; draw(); }, { primary: true });

    function toHW() { var p = st.p, q = 1 - p; st.AA = p * p; st.Aa = 2 * p * q; st.aa = q * q; st.eq = true; }
    function pct(v) { return (v * 100).toFixed(1) + '%'; }

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { sq: { x: 0, y: 0, w: w * 0.5, h: h * 0.46 }, bar: { x: w * 0.5, y: 0, w: w * 0.5, h: h * 0.46 }, cur: { x: 0, y: h * 0.48, w: w, h: h * 0.52 } };
      return { sq: { x: 0, y: 0, w: w * 0.29, h: h }, bar: { x: w * 0.29, y: 0, w: w * 0.27, h: h }, cur: { x: w * 0.56, y: 0, w: w * 0.44, h: h } };
    }
    function draw() {
      var T = api.tokens(), P = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawSquare(T, P.sq); drawBars(T, P.bar); drawCurves(T, P.cur);
      var p = st.p, q = 1 - p;
      rPQ.set(p.toFixed(2) + ' · ' + q.toFixed(2));
      rG.set(pct(st.AA) + ' : ' + pct(st.Aa) + ' : ' + pct(st.aa));
      var aTot = st.Aa / 2 + st.aa;
      rHid.set(aTot > 0 ? pct(st.Aa / 2 / aTot) : '–');
      rState.set(st.eq ? '평형' + (st.gen ? ' (' + st.gen + '세대 무작위 교배 뒤)' : '') : '평형 아님 — Aa 부족');
    }
    function drawSquare(T, r) {
      var S = Math.min(r.w - 44, r.h - 66), x0 = r.x + 30, y0 = r.y + 40, p = st.p;
      var cells = [
        { x: 0, y: 0, w: p, h: p, c: T.figSoftBlue, s: T.figBlue, t: 'AA', v: p * p },
        { x: p, y: 0, w: 1 - p, h: p, c: T.figSoftViolet, s: T.figViolet, t: 'Aa', v: p * (1 - p) },
        { x: 0, y: p, w: p, h: 1 - p, c: T.figSoftViolet, s: T.figViolet, t: 'Aa', v: p * (1 - p) },
        { x: p, y: p, w: 1 - p, h: 1 - p, c: T.figSoftAmber, s: T.figAmber, t: 'aa', v: (1 - p) * (1 - p) },
      ];
      cells.forEach(function (c) {
        var X = x0 + c.x * S, Y = y0 + c.y * S, W = c.w * S, H = c.h * S;
        ctx.fillStyle = c.c; ctx.fillRect(X, Y, W, H);
        ctx.strokeStyle = c.s; ctx.lineWidth = 1.5; ctx.strokeRect(X, Y, W, H);
        if (W > 26 && H > 26) {
          ctx.fillStyle = T.figInk; ctx.textAlign = 'center'; ctx.font = '600 13px ' + T.fontBody;
          ctx.fillText(c.t, X + W / 2, Y + H / 2 - (H > 40 ? 4 : -4));
          if (H > 40 && W > 38) { ctx.font = '11px ' + T.fontMono; ctx.fillText(c.v.toFixed(2), X + W / 2, Y + H / 2 + 12); }
        }
      });
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('정자', x0 + S / 2, r.y + 14);
      if (p > 0.08) ctx.fillText('A ' + p.toFixed(2), x0 + p * S / 2, y0 - 8);
      if (p < 0.92) ctx.fillText('a ' + (1 - p).toFixed(2), x0 + (p + (1 - p) / 2) * S, y0 - 8);
      ctx.save(); ctx.translate(x0 - 10, y0 + S / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText('난자', 0, -6); ctx.restore();
      ctx.textAlign = 'right';
      if (p > 0.08) { ctx.save(); ctx.translate(x0 - 4, y0 + p * S / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('A', 0, 0); ctx.restore(); }
      if (p < 0.92) { ctx.save(); ctx.translate(x0 - 4, y0 + (p + (1 - p) / 2) * S); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('a', 0, 0); ctx.restore(); }
      ctx.fillStyle = T.figInk; ctx.textAlign = 'center'; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('자손 세대(무작위 교배)', x0 + S / 2, y0 + S + 20);
    }
    function drawBars(T, r) {
      var L = r.x + 40, R = r.x + r.w - 10, Tp = r.y + 30, B = r.y + r.h - 40, p = st.p, q = 1 - p;
      var sy = function (v) { return B - v * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(v.toFixed(2), L - 4, sy(v) + 4); });
      var items = [['AA', st.AA, p * p, T.figBlue, T.figSoftBlue], ['Aa', st.Aa, 2 * p * q, T.figViolet, T.figSoftViolet], ['aa', st.aa, q * q, T.figAmber, T.figSoftAmber]];
      var bw = (R - L) / 3;
      items.forEach(function (it, i) {
        var x = L + bw * i + bw * 0.18, w = bw * 0.64;
        ctx.fillStyle = it[4]; ctx.fillRect(x, sy(it[1]), w, B - sy(it[1]));
        ctx.strokeStyle = it[3]; ctx.lineWidth = 2; ctx.strokeRect(x, sy(it[1]), w, B - sy(it[1]));
        if (!st.eq) { ctx.setLineDash([4, 3]); ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.strokeRect(x, sy(it[2]), w, B - sy(it[2])); ctx.setLineDash([]); }
        ctx.fillStyle = T.figInk; ctx.textAlign = 'center'; ctx.font = '600 12px ' + T.fontBody;
        ctx.fillText(it[0], x + w / 2, B + 15);
        ctx.font = '11px ' + T.fontMono; ctx.fillText(it[1].toFixed(2), x + w / 2, sy(it[1]) - 5);
      });
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('유전자형 빈도', (L + R) / 2, r.y + 16);
      if (!st.eq) { ctx.fillStyle = T.figInk; ctx.fillText('점선: 평형 기댓값', (L + R) / 2, B + 32); }
    }
    function drawCurves(T, r) {
      var L = r.x + 46, R = r.x + r.w - 14, Tp = r.y + 30, B = r.y + r.h - 40, p0 = st.p;
      var sx = function (p) { return L + p * (R - L); }, sy = function (v) { return B - v * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(v.toFixed(2), L - 4, sy(v) + 4); });
      ctx.textAlign = 'center';
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) { ctx.fillText(v.toFixed(2), sx(v), B + 14); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.fillText('A의 빈도 p', (L + R) / 2, B + 30);
      var fs = [[function (p) { return p * p; }, T.figBlue, 'AA = p²'], [function (p) { return 2 * p * (1 - p); }, T.figViolet, 'Aa = 2pq'], [function (p) { return (1 - p) * (1 - p); }, T.figAmber, 'aa = q²']];
      fs.forEach(function (f) {
        ctx.strokeStyle = f[1]; ctx.lineWidth = 2.4; ctx.beginPath();
        for (var i = 0; i <= 100; i++) { var p = i / 100; if (i) ctx.lineTo(sx(p), sy(f[0](p))); else ctx.moveTo(sx(p), sy(f[0](p))); }
        ctx.stroke();
      });
      ctx.font = '600 12px ' + T.fontBody;
      function lab(t, c, al, x, y) { ctx.textAlign = al; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = T.figPanel; ctx.strokeText(t, x, y); ctx.fillStyle = c; ctx.fillText(t, x, y); }
      lab('AA = p²', T.figBlue, 'left', sx(0.84) + 8, sy(0.62));
      lab('aa = q²', T.figAmber, 'right', sx(0.16) - 8, sy(0.62));
      lab('Aa = 2pq', T.figViolet, 'center', sx(0.5), sy(0.5) - 8);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(sx(p0), Tp); ctx.lineTo(sx(p0), B); ctx.stroke(); ctx.setLineDash([]);
      fs.forEach(function (f) { ctx.fillStyle = f[1]; ctx.beginPath(); ctx.arc(sx(p0), sy(f[0](p0)), 5, 0, 7); ctx.fill(); ctx.strokeStyle = T.figPanel; ctx.lineWidth = 1.5; ctx.stroke(); });
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('평형에서의 유전자형 빈도', (L + R) / 2, r.y + 16);
    }
    api.onResize(draw);
    draw();
  },
});
