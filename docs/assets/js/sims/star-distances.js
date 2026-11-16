/* 행성우주과학 2: 별자리의 별들을 실제 거리에 놓고 돌려 보기 (오리온자리, 북두칠성) */
Sims.register('star-distances', {
  title: '별자리의 별은 정말 이웃일까? — 실제 거리에 놓아 보기',
  caption: '왼쪽 위 작은 창은 지구에서 본 별자리 모양이다. 큰 그림을 돌려 보면, 오리온자리의 별들은 약 250광년부터 2000광년까지 앞뒤로 멀리 흩어져 있어 같은 방향에 겹쳐 보일 뿐임을 알 수 있다. 북두칠성은 가운데 다섯 별이 약 80광년에 모여 있지만 양 끝의 두 별은 더 멀다. 별을 골라 거리와 연주시차(p = 1/d)를 비교해 보자. 거리는 대략적인 값이고, 오리온자리는 옆(하늘 면) 방향을 4배로 늘려 그린 모식도이다(앞뒤 거리는 실제 비율).',
  init: function (api) {
    var sets = {
      orion: { name: '오리온자리', k: 4, ticks: [500, 1000, 1500, 2000], stars: [
        { n: '베텔게우스', ra: 88.79, de: 7.41, d: 640, txt: '약 550~700광년 (그림에서는 640)', m: 0.5, c: 'red' },
        { n: '벨라트릭스', ra: 81.28, de: 6.35, d: 250, m: 1.6, c: 'blue' },
        { n: '민타카', ra: 83.00, de: -0.30, d: 1200, m: 2.2, c: 'blue' },
        { n: '알닐람', ra: 84.05, de: -1.20, d: 2000, m: 1.7, c: 'blue' },
        { n: '알니탁', ra: 85.19, de: -1.94, d: 1260, m: 1.8, c: 'blue' },
        { n: '사이프', ra: 86.94, de: -9.67, d: 650, m: 2.1, c: 'blue' },
        { n: '리겔', ra: 78.63, de: -8.20, d: 860, m: 0.1, c: 'blue' },
      ], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [4, 5], [2, 6]] },
      dipper: { name: '북두칠성', k: 1, ticks: [25, 50, 75, 100, 125], stars: [
        { n: '두베', ra: 165.93, de: 61.75, d: 123, m: 1.8, c: 'amber' },
        { n: '메라크', ra: 165.46, de: 56.38, d: 79, m: 2.4, c: 'blue' },
        { n: '페크다', ra: 178.46, de: 53.69, d: 84, m: 2.4, c: 'blue' },
        { n: '메그레즈', ra: 183.86, de: 57.03, d: 81, m: 3.3, c: 'blue' },
        { n: '알리오스', ra: 193.51, de: 55.96, d: 83, m: 1.8, c: 'blue' },
        { n: '미자르', ra: 200.98, de: 54.93, d: 83, m: 2.2, c: 'blue' },
        { n: '알카이드', ra: 206.89, de: 49.31, d: 104, m: 1.9, c: 'blue' },
      ], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]] },
    };
    var st = { set: 'orion', sel: 6, sight: true };
    var ZE = 2.55, DEPTH = 5.1;

    function unit(ra, de) { var a = ra * Math.PI / 180, d = de * Math.PI / 180; return [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)]; }
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    function norm(a) { var l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; }
    function geom() {
      var C = sets[st.set], sum = [0, 0, 0];
      var us = C.stars.map(function (s) { var u = unit(s.ra, s.de); sum[0] += u[0]; sum[1] += u[1]; sum[2] += u[2]; return u; });
      var c = norm(sum), e = norm([-c[1], c[0], 0]), n = [c[1] * e[2] - c[2] * e[1], c[2] * e[0] - c[0] * e[2], c[0] * e[1] - c[1] * e[0]];
      var dmax = C.ticks[C.ticks.length - 1], s = DEPTH / dmax;
      return C.stars.map(function (st0, i) {
        var u = us[i], X = -dot(u, e), Y = dot(u, n), Z = dot(u, c);   // 하늘을 올려다볼 때 동쪽은 왼쪽
        return { sky: [X / Z, Y / Z], p: [C.k * X * st0.d * s, C.k * Y * st0.d * s, ZE - Z * st0.d * s] };
      });
    }
    function col(T, c) { return c === 'red' ? T.figRed : c === 'amber' ? T.figAmber : T.figBlue; }

    var rS = api.readout('고른 별');
    var rD = api.readout('지구에서의 거리');
    var rP = api.readout('연주시차 p = 1/d(pc)');
    var rR = api.readout('이 별자리 별들의 거리 범위');

    var S = api.scene3d({
      yaw: 1.05, pitch: 0.38, dist: 11, scale: 0.16, label: '별자리를 이루는 별들의 실제 거리 배치',
      aspect: function (w) { return w < 560 ? 1.05 : 0.62; },
      draw: function (g, T) {
        var C = sets[st.set], G = geom(), dmax = C.ticks[C.ticks.length - 1], s = DEPTH / dmax;
        var E = [0, 0, ZE];
        // 거리 눈금(시선 방향)
        g.line(E, [0, 0, ZE - DEPTH * 1.04], T.figLine, { width: 1, dash: [4, 4] });
        C.ticks.forEach(function (t) { var z = ZE - t * s; g.line([-0.08, 0, z], [0.08, 0, z], T.figMuted, { width: 1.2 }); g.text([0, -0.2, z], t + '광년', { size: 11, color: T.figMuted }); });
        g.sphere(E, 0.13, T.figTeal, {});
        g.text([0, 0.3, ZE], '지구', { size: 12, bold: true });
        // 별자리 선(실제 위치끼리)
        C.lines.forEach(function (L) { g.line(G[L[0]].p, G[L[1]].p, T.figMuted, { width: 1, alpha: 0.6 }); });
        G.forEach(function (o, i) {
          var sel = i === st.sel;
          if (st.sight || sel) g.line(E, o.p, sel ? T.figAccent : T.figLine, { width: sel ? 2 : 0.8, dash: sel ? null : [2, 4], alpha: sel ? 1 : 0.6 });
          var r = 0.07 + Math.max(0, 2.6 - C.stars[i].m) * 0.03;
          g.sphere(o.p, r, col(T, C.stars[i].c), { outline: sel ? T.figInk : false });
          g.text([o.p[0], o.p[1] + r + 0.16, o.p[2]], C.stars[i].n, { size: sel ? 13 : 11, bold: sel, color: sel ? T.figInk : T.figMuted });
        });
        var sx = C.stars[st.sel], pc = sx.d / 3.26;
        rS.set(sx.n + ' (' + C.name + ')');
        rD.set((sx.txt || '약 ' + sx.d + '광년') + ' ≈ ' + Math.round(pc) + ' pc');
        rP.set((1 / pc).toFixed(pc > 100 ? 4 : 3) + '″');
        var ds = C.stars.map(function (q) { return q.d; });
        rR.set('약 ' + Math.min.apply(null, ds) + ' ~ ' + Math.max.apply(null, ds) + '광년');
      },
      overlay: function (ctx, T, S2) {
        var C = sets[st.set], G = geom();
        var bw = Math.min(S2.w * 0.36, 210), bh = bw * 0.95, x0 = 8, y0 = 8;
        ctx.fillStyle = T.figPaper; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.rect(x0, y0, bw, bh); ctx.fill(); ctx.stroke();
        ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('지구에서 본 모습', x0 + 8, y0 + 17);
        var xs = G.map(function (o) { return o.sky[0]; }), ys = G.map(function (o) { return o.sky[1]; });
        var minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs), miny = Math.min.apply(null, ys), maxy = Math.max.apply(null, ys);
        var sc = Math.min((bw - 30) / (maxx - minx), (bh - 44) / (maxy - miny)), cx = x0 + bw / 2, cy = y0 + 24 + (bh - 30) / 2;
        var P = function (o) { return [cx + (o.sky[0] - (minx + maxx) / 2) * sc, cy - (o.sky[1] - (miny + maxy) / 2) * sc]; };
        ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1;
        C.lines.forEach(function (L) { var a = P(G[L[0]]), b = P(G[L[1]]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); });
        G.forEach(function (o, i) {
          var q = P(o), r = 2 + Math.max(0, 3 - C.stars[i].m) * 1.3;
          ctx.fillStyle = col(T, C.stars[i].c); ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, Math.PI * 2); ctx.fill();
          if (i === st.sel) { ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q[0], q[1], r + 4, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = T.figMuted; }
        });
      },
    });

    var gs = api.group();
    var bO = api.button('오리온자리', function () { pickSet('orion'); }, { toggle: true, pressed: true, parent: gs });
    var bD = api.button('북두칠성', function () { pickSet('dipper'); }, { toggle: true, parent: gs });
    function pickSet(k) {
      st.set = k; st.sel = k === 'orion' ? 6 : 0;
      bO.setAttribute('aria-pressed', k === 'orion' ? 'true' : 'false'); bD.setAttribute('aria-pressed', k === 'dipper' ? 'true' : 'false');
      S.redraw();
    }
    var g2 = api.group();
    api.button('◀ 이전 별', function () { var n = sets[st.set].stars.length; st.sel = (st.sel + n - 1) % n; S.redraw(); }, { parent: g2 });
    api.button('다음 별 ▶', function () { st.sel = (st.sel + 1) % sets[st.set].stars.length; S.redraw(); }, { parent: g2, primary: true });
    api.button('시선 보이기/숨기기', function () { st.sight = !st.sight; S.redraw(); }, { parent: g2 });
  },
});
