/* 지구시스템과학 3 전향력: 자전하는 지구 위에서 움직이는 물체의 경로 — 우주에서 본 경로와 지표에 남는 경로 (3D) */
Sims.register('coriolis-globe', {
  title: '자전하는 지구 위의 전향력 — 우주에서 본 경로와 지표의 경로',
  caption: '출발 위도와 방향을 고르고 \'보내기\'를 눌러 보자. 우주(관성 좌표계)에서 계산한 물체의 경로(파란 점선)는 거의 곧은 대원을 따르지만, 그동안 지구가 자전하므로 지표에 남는 경로(빨간 선)는 북반구에서 진행 방향의 오른쪽, 남반구에서 왼쪽으로 휜다. 휘는 정도는 위도가 높을수록 크고, 적도에서 동쪽으로 보내면 수평으로 휘지 않는다. 마찰 없이 지표를 따라 약 930 m/s로 1.5시간(약 5000 km) 미끄러지는 물체를 가정했고, 물체가 정지해 있으면 그대로 머물도록 지구 모양이 원심력의 수평 성분을 상쇄한다고 두었다. 우주에서 본 경로에는 자전에 따른 출발 지점의 동쪽 속도가 더해져 있다.',
  init: function (api) {
    var RE = 2.2, V = 2, TEND = 0.394, H = 0.002;   // 표시 반지름, 속력(ΩR 단위), 시간(1/Ω 단위)
    var D2R = Math.PI / 180;
    var state = { lat: 45, dir: 'N', prog: 1, data: null };
    var rLat = api.readout('출발 위도');
    var rF = api.readout('수평 전향 효과(극 = 1)');
    var rOff = api.readout('지표 경로가 벗어난 거리');

    function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    function compute() {
      var la = state.lat * D2R, P = [0, Math.sin(la), Math.cos(la)], P0 = P.slice();
      var N = [0, Math.cos(la), -Math.sin(la)], d0 = state.dir === 'N' ? N : state.dir === 'S' ? N.map(function (x) { return -x; }) : [1, 0, 0];
      // 관성 좌표계의 처음 속도 = 지표에 대한 속도 + 자전 속도(Ω × r, Ω는 +y)
      var Vv = [d0[0] * V + P[2], d0[1] * V, d0[2] * V - P[0]];
      function acc(P, Vv) {
        var rp = [P[0], 0, P[2]], k = dot(rp, P), vv = dot(Vv, Vv);
        // 지구 모양이 주는 힘(원심력 수평 성분 상쇄) + 구면을 따라 돌게 하는 힘
        return [-(rp[0] - k * P[0]) - vv * P[0], -(rp[1] - k * P[1]) - vv * P[1], -(rp[2] - k * P[2]) - vv * P[2]];
      }
      var inert = [P.slice()], rotp = [P.slice()], site = [P.slice()], t = 0;
      while (t < TEND - 1e-9) {
        var a1 = acc(P, Vv);
        var Pm = P.map(function (x, i) { return x + Vv[i] * H / 2; }), Vm = Vv.map(function (x, i) { return x + a1[i] * H / 2; });
        var a2 = acc(Pm, Vm);
        P = P.map(function (x, i) { return x + Vm[i] * H; }); Vv = Vv.map(function (x, i) { return x + a2[i] * H; });
        var n = Math.hypot(P[0], P[1], P[2]); P = P.map(function (x) { return x / n; });
        var kk = dot(Vv, P); Vv = Vv.map(function (x, i) { return x - kk * P[i]; });
        t += H;
        var c = Math.cos(-t), s = Math.sin(-t);
        inert.push(P.slice());
        rotp.push([P[0] * c + P[2] * s, P[1], -P[0] * s + P[2] * c]);   // 회전 좌표계(지표)로 옮김
        var cs = Math.cos(t), sn = Math.sin(t);
        site.push([P0[0] * cs + P0[2] * sn, P0[1], -P0[0] * sn + P0[2] * cs]);  // 자전으로 옮겨 간 출발 지점
      }
      var nrm = [P0[1] * d0[2] - P0[2] * d0[1], P0[2] * d0[0] - P0[0] * d0[2], P0[0] * d0[1] - P0[1] * d0[0]];
      var off = Math.asin(dot(rotp[rotp.length - 1], nrm)) * 6371;
      state.data = { inert: inert, rot: rotp, site: site, P0: P0, d0: d0, off: off };
      rLat.set(state.lat === 0 ? '적도 (0°)' : (state.lat > 0 ? '북위 ' : '남위 ') + Math.abs(state.lat) + '°');
      rF.set(Math.abs(Math.sin(la)).toFixed(2) + ' (sin φ에 비례)');
      rOff.set(Math.abs(off) < 20 ? '거의 없음 (곧게 감)' : Math.round(Math.abs(off) / 10) * 10 + ' km ' + (off < 0 ? '오른쪽' : '왼쪽'));
    }
    var Sc = function (p, r) { return [p[0] * RE * r, p[1] * RE * r, p[2] * RE * r]; };

    var S = api.scene3d({
      yaw: 0.35, pitch: 0.55, dist: 11, scale: 0.15, label: '자전하는 지구본 위에서 물체를 보냈을 때 우주에서 본 경로와 지표에 남는 경로',
      aspect: function (w) { return w < 560 ? 1.0 : 0.62; },
      draw: function (g, T) {
        g.sphere([0, 0, 0], RE, T.figSoftBlue, {});
        // 위선·경선
        for (var la = -60; la <= 60; la += 30) {
          var pts = [];
          for (var lo = 0; lo <= 360; lo += 6) pts.push(Sc([Math.cos(la * D2R) * Math.sin(lo * D2R), Math.sin(la * D2R), Math.cos(la * D2R) * Math.cos(lo * D2R)], 1.004));
          g.path(pts, la === 0 ? T.figTeal : T.figLine, { width: la === 0 ? 2 : 1, alpha: 0.9 });
        }
        for (var lo2 = 0; lo2 < 360; lo2 += 30) {
          var mp = [];
          for (var la2 = -90; la2 <= 90; la2 += 6) mp.push(Sc([Math.cos(la2 * D2R) * Math.sin(lo2 * D2R), Math.sin(la2 * D2R), Math.cos(la2 * D2R) * Math.cos(lo2 * D2R)], 1.004));
          g.path(mp, T.figLine, { width: 1, alpha: 0.6 });
        }
        // 자전축과 자전 방향
        g.line([0, RE, 0], [0, RE * 1.38, 0], T.figInk, { width: 2 });
        g.line([0, -RE, 0], [0, -RE * 1.25, 0], T.figInk, { width: 2 });
        g.text([0, RE * 1.48, 0], '북극 · 자전축', { size: 12, bold: true });
        var arc = [];
        for (var a = 200; a <= 470; a += 10) arc.push([0.45 * Math.sin(a * D2R), RE * 1.22, 0.45 * Math.cos(a * D2R)]);
        g.path(arc, T.figMuted, { width: 1.6 });
        var aE = 470 * D2R; g.arrow(arc[arc.length - 2], [0.45 * Math.sin(aE + 0.15), RE * 1.22, 0.45 * Math.cos(aE + 0.15)], T.figMuted, { head: 8 });
        g.text([0.75, RE * 1.12, 0], '서→동 자전', { size: 11, color: T.figMuted });
        var d = state.data; if (!d) return;
        var n = Math.max(2, Math.round(d.rot.length * state.prog));
        // 자전으로 옮겨 간 출발 지점(우주에서 본 모습)
        g.path(d.site.slice(0, n).map(function (p) { return Sc(p, 1.01); }), T.figGreen, { width: 2, dash: [2, 3] });
        // 우주에서 본 경로
        g.path(d.inert.slice(0, n).map(function (p) { return Sc(p, 1.02); }), T.figBlue, { width: 2.4, dash: [6, 4] });
        // 지표에 남는 경로
        g.path(d.rot.slice(0, n).map(function (p) { return Sc(p, 1.025); }), T.figRed, { width: 3.2 });
        // 출발 방향 화살표
        var p0 = Sc(d.P0, 1.03), tip = [p0[0] + d.d0[0] * 0.75, p0[1] + d.d0[1] * 0.75, p0[2] + d.d0[2] * 0.75];
        g.arrow(p0, tip, T.figInk, { width: 2, head: 9 });
        g.sphere(p0, 0.09, T.figAmber, { outline: true, flat: true });
        var e1 = Sc(d.rot[n - 1], 1.03), e2 = Sc(d.inert[n - 1], 1.03), e3 = Sc(d.site[n - 1], 1.02);
        g.sphere(e1, 0.08, T.figRed, { flat: true });
        g.sphere(e2, 0.08, T.figBlue, { flat: true });
        g.sphere(e3, 0.06, T.figGreen, { flat: true });
      },
      overlay: function (ctx, T, S2) {
        var rows = [[T.figRed, [], '지표에 남는 경로'], [T.figBlue, [6, 4], '우주에서 본 경로'], [T.figGreen, [2, 3], '자전으로 옮겨 간 출발 지점']];
        ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        rows.forEach(function (r, i) {
          var y = 14 + i * 18; ctx.strokeStyle = r[0]; ctx.lineWidth = 2.6; ctx.setLineDash(r[1]);
          ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(34, y); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = T.figInk; ctx.fillText(r[2], 40, y);
        });
        ctx.textBaseline = 'alphabetic';
      },
    });

    api.slider({ id: 'coriolis-globe-lat', label: '출발 위도', min: -80, max: 80, step: 5, value: 45,
      format: function (v) { return v === 0 ? '0° (적도)' : (v > 0 ? '북위 ' : '남위 ') + Math.abs(v) + '°'; },
      onInput: function (v) { state.lat = v; S.pitch = Math.max(-1.2, Math.min(1.2, v * D2R * 0.9 + 0.1)); compute(); state.prog = 1; S.redraw(); } });
    var g1 = api.group();
    var dirs = [['N', '북쪽으로'], ['S', '남쪽으로'], ['E', '동쪽으로']];
    var db = dirs.map(function (d, i) {
      return api.button(d[1], function () { state.dir = d[0]; db.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); compute(); launch(); }, { toggle: true, pressed: i === 0, parent: g1 });
    });
    api.button('보내기', function () { launch(); }, { primary: true });
    var anim = false;
    function launch() {
      if (api.reduced) { state.prog = 1; S.redraw(); return; }
      state.prog = 0; anim = true; S.loop.play();
    }
    S.onFrame(function (dt) {
      if (!anim) { if (!S.auto) S.loop.pause(); return; }
      state.prog = Math.min(1, state.prog + dt / 4);
      if (state.prog >= 1) anim = false;
    });
    compute(); S.redraw();
  },
});
