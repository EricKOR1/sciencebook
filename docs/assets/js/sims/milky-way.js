/* 중2-8 별과 우주: 우리은하의 구조(막대 모양 중심부, 나선팔, 원반, 헤일로의 구상 성단)와 태양계의 위치 (3D) */
Sims.register('milky-way', {
  title: '우리은하를 밖에서 본다면 — 막대 나선 은하와 태양계의 위치',
  caption: '그림을 끌어서 돌려 보고 ‘위에서 본 모습’과 ‘옆에서 본 모습’을 비교해 보자. 위에서 보면 막대 모양 중심부의 끝에서 나선팔이 휘감겨 나오고, 옆에서 보면 중심부가 볼록한 얇은 원반이며, 그 둘레를 구상 성단이 흩어진 헤일로가 둥글게 감싼다. 태양계는 지름 약 10만 광년인 원반의 중심에서 약 2만 6천~3만 광년 떨어진 나선팔 부근에 있다. 나선팔의 수와 모양, 별의 수는 단순화했고, 원반의 두께는 보이도록 실제보다 두껍게 그렸다.',
  init: function (api) {
    // 단위: 1 = 1만 광년. 원반 반지름 5(지름 10만 광년), 태양계 2.75(2만 7천 5백 광년)
    var RD = 5, RSUN = 2.75, BAR = 1.35, BARANG = 0.45;
    var state = { labels: true };
    var rand = (function () { var s = 7; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
    var B = Math.tan(13 * Math.PI / 180);       // 나선팔이 감기는 정도
    function arm(r0, a0, rMax) {
      var pts = [], th = 0;
      for (;;) { var r = r0 * Math.exp(B * th); if (r > rMax) break; pts.push([r * Math.cos(a0 + th), 0, r * Math.sin(a0 + th)]); th += 0.08; }
      return pts;
    }
    var ARMS = [arm(BAR, BARANG, RD * 0.98), arm(BAR, BARANG + Math.PI, RD * 0.98), arm(2.0, BARANG + Math.PI / 2, RD * 0.9), arm(2.0, BARANG + 1.5 * Math.PI, RD * 0.9)];
    // 원반의 별: 나선팔 근처에 많이
    var STARS = [];
    for (var i = 0; i < 110; i++) {
      var a = ARMS[i % 4], k = Math.floor(rand() * a.length), q = a[k], j = 0.35;
      STARS.push([q[0] + (rand() - 0.5) * j * 2, (rand() - 0.5) * 0.16, q[2] + (rand() - 0.5) * j * 2]);
    }
    // 헤일로의 구상 성단: 중심 쪽에 더 많고 공 모양으로 분포
    var GC = [];
    for (i = 0; i < 32; i++) {
      var u = rand() * 2 - 1, ph = rand() * Math.PI * 2, rr = 1.2 + Math.pow(rand(), 1.6) * 5.2, sq = Math.sqrt(1 - u * u);
      GC.push([rr * sq * Math.cos(ph), rr * u, rr * sq * Math.sin(ph)]);
    }
    // 태양계: 두 큰 팔 사이의 작은 팔(나선팔 부근)
    var SUN = (function () { var a = ARMS[2], best = a[0]; a.forEach(function (p) { if (Math.abs(Math.hypot(p[0], p[2]) - RSUN) < Math.abs(Math.hypot(best[0], best[2]) - RSUN)) best = p; }); return [best[0], 0, best[2]]; })();

    var rView = api.readout('보는 방향');
    api.readout('지름').set('약 10만 광년');
    api.readout('태양계 ~ 중심').set('약 2만 6천~3만 광년');

    var S = api.scene3d({
      yaw: 0.4, pitch: 0.55, dist: 22, scale: 0.082,
      label: '우리은하의 입체 모형: 막대 모양 중심부, 나선팔, 원반, 헤일로와 구상 성단, 태양계의 위치',
      draw: function (g, T) {
        // 헤일로(투명한 공의 테두리)
        g.circle([0, 0, 0], 6.2, [0, 1, 0], T.figViolet, { width: 1, dash: [3, 5], lineAlpha: 0.5 });
        g.circle([0, 0, 0], 6.2, [1, 0, 0], T.figViolet, { width: 1, dash: [3, 5], lineAlpha: 0.5 });
        g.circle([0, 0, 0], 6.2, [0, 0, 1], T.figViolet, { width: 1, dash: [3, 5], lineAlpha: 0.5 });
        // 원반
        g.circle([0, 0, 0], RD, [0, 1, 0], T.figLine, { width: 1, fill: T.figSoftBlue, alpha: 0.35 });
        // 나선팔
        ARMS.forEach(function (a, n) { g.path(a, T.figBlue, { width: n < 2 ? 9 : 6, alpha: n < 2 ? 0.32 : 0.22 }); });
        ARMS.forEach(function (a, n) { g.path(a, T.figBlue, { width: n < 2 ? 2.4 : 1.6, alpha: 0.8 }); });
        STARS.forEach(function (p) { g.sphere(p, 0.05, T.figBlue, { flat: true, alpha: 0.85 }); });
        // 막대 모양 중심부와 팽대부
        var c = Math.cos(BARANG), s = Math.sin(BARANG), bw = 0.42;
        g.poly([[BAR * c - bw * s, 0, BAR * s + bw * c], [-BAR * c - bw * s, 0, -BAR * s + bw * c], [-BAR * c + bw * s, 0, -BAR * s - bw * c], [BAR * c + bw * s, 0, BAR * s - bw * c]], T.figAmber, { alpha: 0.6 });
        g.sphere([0, 0, 0], 0.75, T.figAmber, { alpha: 0.85 });
        // 구상 성단
        GC.forEach(function (p) { g.sphere(p, 0.09, T.figRed, { alpha: 0.95 }); });
        // 태양계
        g.line([0, 0, 0], SUN, T.figInk, { width: 1.5, dash: [4, 3] });
        g.sphere(SUN, 0.17, T.figAmber, { outline: T.figInk });
        // 지름 표시
        g.line([-RD, 0, RD * 0.02], [RD, 0, RD * 0.02], T.figMuted, { width: 1, dash: [2, 4], alpha: 0.7 });
        if (state.labels) {
          g.text([SUN[0], 0.55, SUN[2]], '태양계', { bold: true, size: 13 });
          g.text([SUN[0] / 2, -0.35, SUN[2] / 2], '약 2만 6천~3만 광년', { size: 11, color: T.figInk });
          g.text([0, 1.15, 0], '막대 모양 중심부(팽대부)', { size: 12, color: T.figAmber, bold: true });
          g.text([RD * 0.72, -0.3, -RD * 0.15], '지름 약 10만 광년', { size: 11, color: T.figMuted });
          var am = ARMS[0][Math.floor(ARMS[0].length * 0.72)];
          g.text([am[0], 0.4, am[2]], '나선팔', { size: 12, color: T.figBlue, bold: true });
          g.text([-RD * 0.62, 0.25, RD * 0.62], '원반', { size: 12, color: T.figInk });
          g.text([0, 6.6, 0], '헤일로', { size: 12, color: T.figViolet, bold: true });
          var gc = GC.reduce(function (b, p) { return p[1] > b[1] ? b : (p[1] > 2.2 ? p : b); }, [0, -99, 0]);
          if (gc[1] < 0) gc = GC[0];
          g.text([gc[0], gc[1] + 0.4, gc[2]], '구상 성단', { size: 11, color: T.figRed });
        }
      },
    });
    var gv = api.group();
    var vb = [
      api.button('위에서 본 모습', function () { setView(1.5, 0.4, 0); }, { toggle: true, parent: gv }),
      api.button('옆에서 본 모습', function () { setView(0.0, 0.4, 1); }, { toggle: true, parent: gv }),
    ];
    function setView(pitch, yaw, k) {
      S.pitch = pitch; S.yaw = yaw; S.setAutoRotate(false);
      vb.forEach(function (b, i) { b.setAttribute('aria-pressed', i === k ? 'true' : 'false'); });
      rView.set(k === 0 ? '위에서(막대 나선 모양)' : '옆에서(볼록한 얇은 원반)');
      S.redraw();
    }
    api.button('이름표 보이기/숨기기', function () { state.labels = !state.labels; S.redraw(); });
    rView.set('비스듬히');
    S.canvas.addEventListener('pointerdown', function () { vb.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); rView.set('돌려 보는 중'); });
  },
});
