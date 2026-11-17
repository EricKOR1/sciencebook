/* 일반지구과학 6 해양: 에크만 나선과 에크만 수송(바람 세기·풍향·위도 → 층별 흐름, 알짜 수송, 연안 용승) */
Sims.register('u-ekman', {
  title: '바람이 미는 바다 — 에크만 나선과 에크만 수송',
  caption: '풍속·풍향·위도를 바꾸고 끌어서 돌려 보자. 초록 화살표는 바람, 파란 화살표는 깊이별 흐름(에크만 나선), 빨간 화살표는 층 전체의 알짜 수송이다. 알짜 수송은 북반구에서 바람의 오른쪽 90°, 남반구에서 왼쪽 90°이고 크기 U_E = τ/(ρf)는 풍속의 제곱에 비례하고 위도가 낮을수록 크다. 해안을 놓으면 수송이 먼바다로 향할 때 연안 용승이, 해안으로 향할 때 침강이 일어난다. 나선은 와점성이 일정한 고전적 에크만 해로 그린 모식이며 깊이는 에크만 층 두께로 맞추어 그렸다(화살표 길이는 상대적). τ = ρₐC_DU²(ρₐ = 1.2 kg/m³, C_D = 1.3×10⁻³), ρ = 1025 kg/m³을 썼다.',
  init: function (api) {
    var OM = 7.29e-5, RHO = 1025;
    var NAMES = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
    var state = { U: 10, from: 0, lat: 35, coast: true };
    var rF = api.readout('전향 인자 f');
    var rT = api.readout('바람 응력 τ');
    var rU = api.readout('에크만 수송 U_E');
    var rS = api.readout('해안 1000 km당');
    var rD = api.readout('알짜 수송 방향');
    var rC = api.readout('동쪽 해안에서');

    function calc() {
      var f = 2 * OM * Math.sin(state.lat * Math.PI / 180), tau = 1.2 * 1.3e-3 * state.U * state.U;
      var eq = Math.abs(state.lat) < 3;
      var UE = eq ? NaN : tau / (RHO * Math.abs(f));
      var toward = (state.from + 180) % 360, sign = state.lat >= 0 ? 1 : -1;
      var tb = (toward + 90 * sign + 360) % 360;
      return { f: f, tau: tau, UE: UE, toward: toward, tb: tb, sign: sign, eq: eq };
    }
    function vec(b, L, y) { var r = b * Math.PI / 180; return [L * Math.sin(r), y, -L * Math.cos(r)]; }
    function dirName(b) { return NAMES[Math.round(((b % 360) + 360) % 360 / 45) % 8] + '쪽'; }

    var S = api.scene3d({
      yaw: 0.5, pitch: 0.42, dist: 11, scale: 0.15, label: '바다 표면 아래 깊이별 흐름 화살표와 바람, 알짜 수송',
      draw: function (g, T) {
        var c = calc(), D = 2.4, N = 9;
        // 해수면
        g.poly([[-2.4, 0, -2.4], [2.4, 0, -2.4], [2.4, 0, 2.4], [-2.4, 0, 2.4]], T.figSoftBlue, { alpha: 0.35, stroke: T.figBlue, strokeWidth: 1 });
        g.line([0, 0.05, 0], [0, -D - 0.2, 0], T.figLine, { width: 1, dash: [4, 4] });
        g.text([0, -D - 0.45, 0], '에크만 층 바닥', { color: T.figMuted, size: 12 });
        // 방위
        g.text(vec(0, 2.75, 0), '북', { color: T.figMuted, size: 12, bold: true });
        g.text(vec(90, 2.75, 0), '동', { color: T.figMuted, size: 12, bold: true });
        g.text(vec(180, 2.75, 0), '남', { color: T.figMuted, size: 12 });
        g.text(vec(270, 2.75, 0), '서', { color: T.figMuted, size: 12 });
        // 바람
        var wl = 0.6 + state.U / 20 * 1.6, wa = vec(c.toward, -wl / 2, 0.9), wb = vec(c.toward, wl / 2, 0.9);
        g.arrow(wa, wb, T.figGreen, { width: 4 });
        g.text([wb[0], 1.25, wb[2]], '바람', { color: T.figGreen, size: 12, bold: true });
        // 해안
        if (state.coast) {
          g.poly([[2.4, 0.5, -2.4], [2.4, 0.5, 2.4], [2.4, -D - 0.2, 2.4], [2.4, -D - 0.2, -2.4]], T.figSoftAmber, { alpha: 0.75, stroke: T.figAmber, strokeWidth: 1.5 });
          g.text([2.4, 0.75, 0], '해안(육지는 동쪽)', { color: T.figAmber, size: 12, bold: true });
        }
        if (c.eq) { g.text([0, -1.2, 0], '적도 부근: f ≈ 0', { color: T.figRed, size: 13, bold: true }); return; }
        // 나선
        var prev = null;
        for (var j = 0; j <= N; j++) {
          var zr = j / N, a = 45 + 180 * zr, sp = Math.exp(-Math.PI * zr);
          var b = c.toward + c.sign * a, y = -D * zr;
          var tip = vec(b, 1.6 * sp, y);
          if (sp > 0.06) g.arrow([0, y, 0], tip, j === 0 ? T.figAccent : T.figBlue, { width: j === 0 ? 3 : 2 });
          if (prev) g.line(prev, tip, T.figBlue, { width: 1, alpha: 0.6 });
          prev = tip;
        }
        g.text(vec(c.toward + c.sign * 45, 1.85, 0.15), '표층 45°', { color: T.figAccent, size: 12 });
        // 알짜 수송
        var L = Math.min(2.4, 0.4 + c.UE / 2.1 * 1.3);
        g.arrow([0, -D * 0.45, 0], vec(c.tb, L, -D * 0.45), T.figRed, { width: 6 });
        var tt = vec(c.tb, L + 0.35, -D * 0.45);
        g.text(tt, '알짜 수송', { color: T.figRed, size: 13, bold: true });
        // 용승·침강
        if (state.coast) {
          var ex = Math.sin(c.tb * Math.PI / 180);
          if (Math.abs(ex) > 0.3) {
            var up = ex < 0;
            [-1.2, 0, 1.2].forEach(function (zz) {
              g.arrow([2.0, up ? -D + 0.2 : -0.2, zz], [2.0, up ? -0.35 : -D + 0.35, zz], up ? T.figTeal : T.figViolet, { width: 3 });
            });
            g.text([2.0, -D - 0.1, 1.9], up ? '용승' : '침강', { color: up ? T.figTeal : T.figViolet, size: 13, bold: true });
          }
        }
      },
    });
    api.slider({ id: 'u-ekman-U', label: '풍속', min: 2, max: 20, step: 1, value: 10, format: function (v) { return v + ' m/s'; }, onInput: function (v) { state.U = v; update(); } });
    api.slider({ id: 'u-ekman-dir', label: '풍향(불어오는 쪽)', min: 0, max: 315, step: 45, value: 0, format: function (v) { return NAMES[v / 45] + '풍'; }, onInput: function (v) { state.from = v; update(); } });
    api.slider({ id: 'u-ekman-lat', label: '위도', min: -70, max: 70, step: 1, value: 35, format: function (v) { return v === 0 ? '적도' : Math.abs(v) + '°' + (v > 0 ? 'N' : 'S'); }, onInput: function (v) { state.lat = v; update(); } });
    var cb = api.button('해안 놓기/치우기', function () { state.coast = !state.coast; cb.setAttribute('aria-pressed', state.coast ? 'true' : 'false'); update(); }, { toggle: true, pressed: true });

    function sci(x) { var e = Math.floor(Math.log10(Math.abs(x))), m = x / Math.pow(10, e); return m.toFixed(2) + '×10' + ({ '-5': '⁻⁵', '-4': '⁻⁴', '-6': '⁻⁶' }[e] || e); }
    function update() {
      var c = calc();
      rF.set(sci(c.f) + ' s⁻¹');
      rT.set(c.tau.toFixed(3) + ' N/m²');
      if (c.eq) { rU.set('계산할 수 없음(f ≈ 0)'); rS.set('–'); rD.set('–'); rC.set('–'); }
      else {
        rU.set(c.UE.toFixed(2) + ' m²/s');
        rS.set((c.UE * 1e6 / 1e6).toFixed(2) + ' Sv');
        rD.set(dirName(c.tb) + ' (바람의 ' + (c.sign > 0 ? '오른쪽' : '왼쪽') + ' 90°)');
        var ex = Math.sin(c.tb * Math.PI / 180);
        rC.set(ex < -0.3 ? '먼바다로 → 연안 용승' : ex > 0.3 ? '해안 쪽으로 → 연안 침강' : '해안과 나란함');
      }
      S.redraw();
    }
    update();
  },
});
