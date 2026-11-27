/* 유기화학 3 입체화학: 편광계 가상 실험 (3D)
   관찰 회전각 α = [α]·l·c·(ee/100). 관찰자는 광원 쪽(−x)을 바라본다. 관찰자에게 시계 방향 = (+).
   좌표: 빛은 +x 로 진행, 진동 방향은 yz 평면. 관찰자의 오른쪽 = −z 이므로 회전각 α 의 진동 방향 = (0, cos α, −sin α). */
Sims.register('mj-polarimeter', {
  title: '편광계 — 거울상 초과량·농도·관 길이와 회전각',
  caption: '화합물과 거울상 초과량(ee), 농도, 관 길이를 바꾸며 시료관을 지나는 동안 진동면이 얼마나 도는지 보자. 관찰 회전각은 α = [α]·l·c·(ee/100)으로 ee, 농도, 관 길이에 비례하고, 라세미(ee 0)이면 0이다. 검광자는 α와 α ± 180°를 구별하지 못하므로, ‘묽히기’로 농도를 반으로 줄여 각이 반으로 줄어드는지 보아야 실제 값이 정해진다. 그림의 회전은 진동면만 보이도록 단순화했고(빛의 파장과 분자 크기는 실제 비율이 아니다), 수크로스의 거울상(L형)은 비교를 위한 가상의 물질이다.',
  init: function (api) {
    var CMP = [
      { n: '(S)-뷰탄-2-올', a: 13.5, e: '(S)', o: '(R)' },
      { n: '수크로스', a: 66.5, e: '천연(D)', o: 'L형(가상)' },
      { n: '(R)-카르본', a: -61, e: '(R)', o: '(S)' },
    ];
    var st = { k: 1, ee: 100, c: 0.10, l: 2, phase: 0, diluted: false };
    var rA = api.readout('관찰 회전각 α'), rMix = api.readout('조성'), rSp = api.readout('관찰 비선광도'), rAmb = api.readout('검광자로 보면');
    var g1 = api.group();
    var bk = CMP.map(function (c, k) {
      return api.button(c.n + ' [α] ' + (c.a > 0 ? '+' : '−') + Math.abs(c.a), function () { st.k = k; st.diluted = false; sync(); }, { toggle: true, pressed: k === st.k, parent: g1 });
    });
    var sEe = api.slider({ id: 'mj-polarimeter-ee', label: '거울상 초과량 ee (+: 위 화합물 쪽 과량)', min: -100, max: 100, step: 1, value: st.ee,
      format: function (v) { return (v > 0 ? '+' : '') + v + ' %'; }, onInput: function (v) { st.ee = v; st.diluted = false; sync(); } });
    var sC = api.slider({ id: 'mj-polarimeter-c', label: '농도 c (g/mL)', min: 0, max: 0.20, step: 0.005, value: st.c,
      format: function (v) { return v.toFixed(3); }, onInput: function (v) { st.c = v; st.diluted = false; sync(); } });
    var g2 = api.group();
    var LS = [0.5, 1, 2];
    var bl = LS.map(function (L) {
      return api.button('관 ' + L + ' dm', function () { st.l = L; st.diluted = false; sync(); }, { toggle: true, pressed: L === st.l, parent: g2 });
    });
    var bd = api.button('묽히기(농도 ½)', function () { if (st.c <= 0) return; st.before = alpha(); st.c = Math.round(st.c / 2 * 1000) / 1000; sC.set(st.c); st.diluted = true; sync(); }, { parent: g2 });
    // 시료관 안 분자 자리(고정 난수)
    var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var MOL = []; for (var i = 0; i < 80; i++) MOL.push([rnd(), rnd() * 2 * Math.PI, Math.sqrt(rnd()), rnd()]);
    function alpha() { return CMP[st.k].a * st.l * st.c * st.ee / 100; }
    function tubeLen() { return 1.8 * st.l; }
    var S = api.scene3d({
      yaw: -0.42, pitch: 0.28, dist: 16, scale: 0.135, label: '편광자, 시료관, 검광자를 지나는 빛의 진동면',
      aspect: function (w) { return w < 560 ? 0.85 : 0.52; },
      draw: function (g, T, SS) {
        SS.zoom = SS.w < 560 ? 0.66 : 1;
        var A = alpha() * Math.PI / 180, L = tubeLen(), x0 = -L / 2, x1 = L / 2;
        var xs = -5.2, xp = x0 - 0.9, xa = x1 + 0.9, xe = x1 + 2.2;
        // 광원
        g.sphere([xs, 0, 0], 0.45, T.figAmber, { outline: T.figAmber });
        g.text([xs, -0.95, 0], 'Na 램프 589 nm', { size: 12 });
        g.line([xs, 0, 0], [xe - 0.3, 0, 0], T.figAmber, { width: 1.4, dash: [4, 4] });
        // 편광되지 않은 빛(여러 방향)
        for (var q = 0; q < 6; q++) {
          var t = q * Math.PI / 6, dy = Math.cos(t) * 0.55, dz = Math.sin(t) * 0.55, xx = (xs + xp) / 2;
          g.line([xx, -dy, -dz], [xx, dy, dz], T.figMuted, { width: 1.4 });
        }
        // 편광자: 세로 틈
        g.poly([[xp, -1.2, -1.2], [xp, 1.2, -1.2], [xp, 1.2, 1.2], [xp, -1.2, 1.2]], T.figMuted, { alpha: 0.18, stroke: T.figInk, strokeWidth: 1.2 });
        for (var s = -2; s <= 2; s++) g.line([xp, -1.1, s * 0.35], [xp, 1.1, s * 0.35], T.figMuted, { width: 1 });
        g.text([xp, 1.55, 0], '편광자', { size: 12, bold: true });
        // 시료관
        var R = 0.85, N = 28;
        for (var k = 0; k < N; k++) {
          var a1 = k / N * 2 * Math.PI, a2 = (k + 1) / N * 2 * Math.PI;
          g.poly([[x0, R * Math.cos(a1), R * Math.sin(a1)], [x1, R * Math.cos(a1), R * Math.sin(a1)], [x1, R * Math.cos(a2), R * Math.sin(a2)], [x0, R * Math.cos(a2), R * Math.sin(a2)]], T.figSoftBlue, { alpha: 0.12 });
        }
        g.circle([x0, 0, 0], R, [1, 0, 0], T.figBlue, { width: 1.2 });
        g.circle([x1, 0, 0], R, [1, 0, 0], T.figBlue, { width: 1.2 });
        g.line([x0, -R, 0], [x1, -R, 0], T.figBlue, { width: 1 }); g.line([x0, R, 0], [x1, R, 0], T.figBlue, { width: 1 });
        g.text([0, R + 0.5, 0], '시료관 l = ' + st.l + ' dm', { size: 12, bold: true });
        // 분자: 점 수는 농도에, 색 비율은 조성에 비례
        var n = Math.round(80 * st.c / 0.20), fMain = (1 + st.ee / 100) / 2;
        for (var m = 0; m < n; m++) {
          var M = MOL[m], px = x0 + 0.1 + M[0] * (L - 0.2), r = M[2] * R * 0.85;
          g.sphere([px, r * Math.cos(M[1]), r * Math.sin(M[1])], 0.07, M[3] < fMain ? T.figBlue : T.figAmber, { flat: true });
        }
        // 진동 방향(전기장): 관 앞 0, 관 안에서 선형으로 회전, 관 뒤 A
        var pts = [], ph = st.phase;
        for (var x = xp + 0.05; x <= xa - 0.05; x += 0.06) {
          var th = x < x0 ? 0 : (x > x1 ? A : A * (x - x0) / L), amp = 0.75 * Math.cos(5.0 * x - ph);
          pts.push([x, amp * Math.cos(th), -amp * Math.sin(th)]);
        }
        g.path(pts, T.figRed, { width: 2 });
        // 관 앞·뒤 진동면 표시(양쪽 화살표)
        function vib(x, th, col) {
          var a = [x, 0.95 * Math.cos(th), -0.95 * Math.sin(th)], b = [x, -0.95 * Math.cos(th), 0.95 * Math.sin(th)];
          g.arrow([x, 0, 0], a, col, { width: 2 }); g.arrow([x, 0, 0], b, col, { width: 2 });
        }
        vib(xp + 0.35, 0, T.figInk); vib(x1 + 0.4, A, T.figRed);
        // 검광자: 눈금 원판과 투과축
        g.circle([xa, 0, 0], 1.25, [1, 0, 0], T.figInk, { width: 1.4, fill: T.figPanel, alpha: 0.5 });
        for (var d = -90; d <= 90; d += 10) {
          var rr = d % 30 === 0 ? 1.05 : 1.13, ang = d * Math.PI / 180;
          g.line([xa, 1.25 * Math.cos(ang), -1.25 * Math.sin(ang)], [xa, rr * Math.cos(ang), -rr * Math.sin(ang)], T.figMuted, { width: 1 });
        }
        g.line([xa, -1.2 * Math.cos(A), 1.2 * Math.sin(A)], [xa, 1.2 * Math.cos(A), -1.2 * Math.sin(A)], T.figRed, { width: 2.4 });
        g.line([xa, -1.25, 0], [xa, 1.25, 0], T.figMuted, { width: 1, dash: [3, 3] });
        g.text([xa, 1.65, 0], '검광자', { size: 12, bold: true });
        g.text([xe, 0.45, 0], '관찰자 →', { size: 12 });
        g.text([xe, -0.2, 0], '(광원 쪽을 봄)', { size: 11, color: T.figMuted });
      },
    });
    function sync() {
      bk.forEach(function (b, k) { b.setAttribute('aria-pressed', k === st.k ? 'true' : 'false'); });
      bl.forEach(function (b, k) { b.setAttribute('aria-pressed', LS[k] === st.l ? 'true' : 'false'); });
      var c = CMP[st.k], a = alpha(), main = (1 + st.ee / 100) / 2 * 100;
      rA.set((a >= 0 ? '+' : '−') + Math.abs(a).toFixed(2) + '° ' + (Math.abs(a) < 0.005 ? '(회전 없음)' : (a > 0 ? '(시계 방향, 우선성)' : '(반시계 방향, 좌선성)')));
      rMix.set(c.e + ' ' + main.toFixed(0) + ' % : ' + c.o + ' ' + (100 - main).toFixed(0) + ' %  (파랑 : 주황)');
      rSp.set(st.c > 0 ? ((c.a * st.ee / 100 >= 0 ? '+' : '−') + Math.abs(c.a * st.ee / 100).toFixed(1)) : '–');
      var f = function (v) { return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + '°'; };
      var alt = function (v) { return v >= 0 ? v - 180 : v + 180; };
      var txt = '눈금 ' + f(a) + ' 또는 ' + f(alt(a));
      // 묽히기 직후: 묽히기 전 값 b 가 실제라면 b/2, b ± 180° 가 실제라면 (b ± 180°)/2 로 바뀐다. 측정이 b/2 와 맞으니 b 가 실제 값
      if (st.diluted && st.before !== undefined) txt = '묽히기 전 ' + f(st.before) + ' → 뒤 ' + f(a) + ': 반으로 줄었으니 ' + f(st.before) + '가 실제 값(' + f(alt(st.before)) + '였다면 ' + f(alt(st.before) / 2) + '가 되었을 것)';
      rAmb.set(txt);
      S.redraw();
    }
    if (!api.reduced) S.onFrame(function (dt) { if (dt > 0) st.phase += dt * 3; });
    sync();
  },
});
