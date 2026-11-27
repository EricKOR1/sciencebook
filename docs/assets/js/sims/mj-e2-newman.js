/* 유기화학 4 E2: 뉴먼 투영식 회전기 — C–C 결합을 돌려 H–C–C–Br 안티 준평면을 찾고, 그 형태에서 생길 알켄의 E/Z를 읽는다 (3D + 2D) */
Sims.register('mj-e2-newman', {
  title: 'E2 뉴먼 투영식 회전기 — 안티 준평면이 정하는 알켄의 E/Z',
  caption: '기질을 고르고 슬라이더로 뒤 탄소를 돌려 보자. 위는 공-막대 모형(에틸·페닐은 공 하나로 줄여 그림), 아래 왼쪽은 앞 탄소(점)에서 뒤 탄소(원)로 내려다본 뉴먼 투영식, 오른쪽은 회전각에 따른 형태 에너지 어림 곡선이다. ' +
    'H–C–C–Br 이면각이 175~185°가 되면 "안티 준평면 — E2 가능" 신호가 켜지고, 그 형태에서 남은 원자단의 배치 그대로 생길 알켄(E 또는 Z)이 나타난다. ' +
    '(2S,3S)-2-브로모-3-메틸펜테인은 (E)-3-메틸펜트-2-엔, (1R,2R)-1-브로모-1,2-다이페닐프로페인은 (Z)-1,2-다이페닐프로프-1-엔을 준다. ' +
    '뉴먼 각도는 RDKit으로 만든 3차원 구조에서 얻었고, 에너지 곡선은 비틀림(엇갈림 0, 가려짐 12 kJ/mol)과 큰 원자단 사이의 입체 반발을 가우스 함수로 더한 어림값이다.',
  init: function (api) {
    var N = 'mj-e2-newman';
    // 앞 탄소: [이탈기 Br, 원자단 A, H], 뒤 탄소: [β-H, 원자단 B, 원자단 C] (θ = 0 에서 H–C–C–Br 이면각 0°)
    var SUB = {
      pent: { name: '(2S,3S)-2-브로모-3-메틸펜테인', fC: 'C2', bC: 'C3',
        front: [['Br', 270, 0.8], ['CH₃', 30, 1.0], ['H', 150, 0]], back: [['H', 270, 0], ['CH₃', 150, 1.0], ['C₂H₅', 30, 1.15]],
        // 알켄 CIP: 앞 탄소 CH₃ > H, 뒤 탄소 C₂H₅ > CH₃
        hiF: 1, hiB: 2, prodE: '(E)-3-메틸펜트-2-엔', prodZ: '(Z)-3-메틸펜트-2-엔' },
      diph: { name: '(1R,2R)-1-브로모-1,2-다이페닐프로페인', fC: 'C1', bC: 'C2',
        front: [['Br', 270, 0.8], ['C₆H₅', 30, 1.3], ['H', 150, 0]], back: [['H', 270, 0], ['CH₃', 30, 1.0], ['C₆H₅', 150, 1.3]],
        hiF: 1, hiB: 2, prodE: '(E)-1,2-다이페닐프로프-1-엔', prodZ: '(Z)-1,2-다이페닐프로프-1-엔' },
    };
    var st = { s: 'pent', th: 60 };
    var rD = api.readout('H–C–C–Br 이면각'), rE = api.readout('형태 에너지(어림)'), rS = api.readout('상태'), rP = api.readout('생길 알켄');
    var g = api.group();
    var bA = api.button('2-브로모-3-메틸펜테인', function () { pick('pent'); }, { parent: g, primary: true });
    var bB = api.button('1-브로모-1,2-다이페닐프로페인', function () { pick('diph'); }, { parent: g });
    var sl = api.slider({ id: N + '-rot', label: '뒤 탄소 회전각', min: 0, max: 360, step: 1, value: st.th, format: function (v) { return v + '°'; }, onInput: function (v) { st.th = v; redraw(); } });
    api.button('안티로 맞추기', function () { sl.set(180); }, { parent: g });
    function pick(k) { st.s = k; bA.className = 'sim-btn' + (k === 'pent' ? ' primary' : ''); bB.className = 'sim-btn' + (k === 'diph' ? ' primary' : ''); redraw(); }
    function S() { return SUB[st.s]; }
    function rad(d) { return d * Math.PI / 180; }
    function norm(a) { a = ((a % 360) + 360) % 360; return a; }
    function backAng(i) { return norm(S().back[i][1] + st.th); }
    function dih(a, b) { var d = Math.abs(norm(a - b)); return d > 180 ? 360 - d : d; }
    function energy(th) {
      var s = S(), E = 6 * (1 + Math.cos(rad(3 * (s.back[0][1] + th - s.front[0][1]))));
      s.front.forEach(function (f) { s.back.forEach(function (b) { var d = dih(f[1], b[1] + th); E += 9 * f[2] * b[2] * Math.exp(-Math.pow(d / 64.7, 2)); }); });
      return E;
    }
    var COL = function (T, lab) { return lab === 'Br' ? T.figGreen : lab === 'H' ? T.figPanel : lab.indexOf('C₆') === 0 ? T.figViolet : T.figMuted; };
    var RAD = { 'Br': 0.42, 'H': 0.2, 'CH₃': 0.34, 'C₂H₅': 0.4, 'C₆H₅': 0.46 };
    var sc = api.scene3d({
      yaw: 0.9, pitch: 0.3, dist: 10, scale: 0.17, label: '두 탄소와 치환기의 공-막대 모형',
      aspect: function (w) { return w < 560 ? 0.75 : 0.42; },
      draw: function (g3, T) {
        var s = S(), L = 1.55, bl = 1.25, sb = 0.943, cb = 0.333;
        var cf = [0, 0, L / 2], cbk = [0, 0, -L / 2];
        var anti = Math.abs(dih(s.front[0][1], backAng(0)) - 180) <= 5;
        g3.line(cf, cbk, T.figInk, { width: 4 });
        g3.sphere(cf, 0.3, T.figInk, { label: s.fC });
        g3.sphere(cbk, 0.3, T.figInk, { label: s.bC });
        function sub(c, a, lab, sgn, hl) {
          var p = [c[0] + bl * sb * Math.cos(rad(a)), c[1] + bl * sb * Math.sin(rad(a)), c[2] + sgn * bl * cb];
          g3.line(c, p, T.figInk, { width: 3 });
          g3.sphere(p, RAD[lab], hl ? T.figRed : COL(T, lab), { label: lab, outline: true });
          return p;
        }
        var pf = s.front.map(function (f, i) { return sub(cf, f[1], f[0], 1, anti && i === 0); });
        var pb = s.back.map(function (b, i) { return sub(cbk, backAng(i), b[0], -1, anti && i === 0); });
        if (anti) g3.line(pf[0], pb[0], T.figRed, { width: 1.5, dash: [5, 4] });
      },
    });
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.85 : 0.42; }, label: '뉴먼 투영식, 형태 에너지 곡선, 생길 알켄' });
    var ctx = cv.ctx;
    function txt(t, x, y, al, col, bold, size) { ctx.fillStyle = col; ctx.textAlign = al || 'center'; ctx.font = (bold ? 'bold ' : '') + (size || 13) + 'px ' + api.tokens().fontBody; ctx.fillText(t, x, y); }
    function draw2d() {
      var T = api.tokens(), W = cv.w, H = cv.h, s = S();
      ctx.clearRect(0, 0, W, H);
      var narrow = W < 560;
      var nx = narrow ? W * 0.3 : W * 0.15, ny = narrow ? 110 : H * 0.5, R = 26, Lb = 62;
      var dhb = dih(s.front[0][1], backAng(0)), anti = Math.abs(dhb - 180) <= 5;
      // 뉴먼
      txt('뉴먼 투영식', nx, 18, 'center', T.figInk, true);
      function lab(a, l, col, bold) { var x = nx + (Lb + 14) * Math.cos(rad(a)), y = ny - (Lb + 14) * Math.sin(rad(a)); txt(l, x, y + 5, 'center', col, bold, 13); }
      ctx.lineWidth = 2; ctx.strokeStyle = T.figInk;
      s.back.forEach(function (b, i) {
        var a = backAng(i);
        ctx.beginPath(); ctx.moveTo(nx + R * Math.cos(rad(a)), ny - R * Math.sin(rad(a))); ctx.lineTo(nx + Lb * Math.cos(rad(a)), ny - Lb * Math.sin(rad(a))); ctx.stroke();
        lab(a, b[0], i === 0 && anti ? T.figRed : (b[0] === 'H' ? T.figMuted : T.figInk), i === 0);
      });
      ctx.fillStyle = T.figPanel; ctx.beginPath(); ctx.arc(nx, ny, R, 0, 7); ctx.fill(); ctx.stroke();
      s.front.forEach(function (f, i) {
        var a = f[1];
        ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(nx + Lb * Math.cos(rad(a)), ny - Lb * Math.sin(rad(a))); ctx.stroke();
        lab(a, f[0], i === 0 ? (anti ? T.figRed : T.figGreen) : (f[0] === 'H' ? T.figMuted : T.figInk), i === 0);
      });
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(nx, ny, 2.6, 0, 7); ctx.fill();
      txt('앞 ' + s.fC + '(점) · 뒤 ' + s.bC + '(원)', nx, ny + Lb + 38, 'center', T.figMuted, false, 12);
      // 에너지 곡선
      var ex0 = narrow ? 50 : W * 0.33, ex1 = narrow ? W - 14 : W * 0.66, ey0 = narrow ? 250 : 30, ey1 = narrow ? 390 : H - 34;
      var Es = [], Emax = 0;
      for (var t = 0; t <= 360; t += 3) { var e = energy(t); Es.push([t, e]); Emax = Math.max(Emax, e); }
      Emax = Math.ceil(Emax / 5) * 5;
      function EX(t) { return ex0 + (ex1 - ex0) * t / 360; }
      function EY(e) { return ey1 - (ey1 - ey0) * e / Emax; }
      ctx.fillStyle = T.figSoftGreen;
      var t175 = norm(s.front[0][1] + 175 - s.back[0][1]), t185 = norm(s.front[0][1] + 185 - s.back[0][1]);
      [[t175, t185], [norm(s.front[0][1] - 185 - s.back[0][1]), norm(s.front[0][1] - 175 - s.back[0][1])]].forEach(function (w) { if (w[1] > w[0]) ctx.fillRect(EX(w[0]), ey0, EX(w[1]) - EX(w[0]), ey1 - ey0); });
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ex0, ey0 - 4); ctx.lineTo(ex0, ey1); ctx.lineTo(ex1, ey1); ctx.stroke();
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2.2; ctx.beginPath();
      Es.forEach(function (p, i) { if (i) ctx.lineTo(EX(p[0]), EY(p[1])); else ctx.moveTo(EX(p[0]), EY(p[1])); }); ctx.stroke();
      var ec = energy(st.th);
      ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.arc(EX(st.th), EY(ec), 5.5, 0, 7); ctx.fill();
      txt('0', ex0 - 6, ey1 + 4, 'right', T.figMuted, false, 11); txt(String(Emax), ex0 - 6, ey0 + 8, 'right', T.figMuted, false, 11);
      [0, 90, 180, 270, 360].forEach(function (t) { txt(t + '°', EX(t), ey1 + 15, 'center', T.figMuted, false, 11); });
      txt('형태 에너지 (kJ/mol, 어림)', (ex0 + ex1) / 2, ey0 - 10, 'center', T.figInk, true, 12);
      txt('초록 띠: 안티 준평면(175~185°)', (ex0 + ex1) / 2, ey1 + 30, 'center', T.figGreen, false, 11);
      // 생성물
      var px = narrow ? W / 2 : W * 0.84, py = narrow ? 500 : H * 0.5;
      txt('생길 알켄', px, narrow ? 440 : 22, 'center', T.figInk, true);
      if (!anti) {
        txt('안티 준평면이 아니다', px, py - 6, 'center', T.figMuted, false, 13);
        txt('뒤 탄소를 돌려 보자', px, py + 14, 'center', T.figMuted, false, 13);
      } else {
        // 앞 탄소 = 왼쪽 C, 뒤 탄소 = 오른쪽 C. 원자단의 화면 x 부호(왼/오른쪽)가 같으면 이중 결합의 같은 쪽
        var c1 = [px - 22, py], c2 = [px + 22, py];
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(c1[0], c1[1] - 3); ctx.lineTo(c2[0], c2[1] - 3); ctx.moveTo(c1[0], c1[1] + 3); ctx.lineTo(c2[0], c2[1] + 3); ctx.stroke();
        function side(a) { return Math.cos(rad(a)) > 0 ? -1 : 1; }   // 화면 오른쪽(x > 0) → 위쪽에 그림
        var fr = [s.front[1], s.front[2]], bk = [[s.back[1][0], backAng(1)], [s.back[2][0], backAng(2)]];
        fr.forEach(function (f) { var sd = side(f[1]); var q = [c1[0] - 26, c1[1] + sd * 30]; ctx.beginPath(); ctx.moveTo(c1[0], c1[1]); ctx.lineTo(q[0] + 6, q[1] - sd * 6); ctx.stroke(); txt(f[0], q[0] - 6, q[1] + 5, 'center', f === s.front[s.hiF] ? T.figRed : T.figInk, f === s.front[s.hiF], 13); });
        bk.forEach(function (b, i) { var sd = side(b[1]); var q = [c2[0] + 26, c2[1] + sd * 30]; ctx.beginPath(); ctx.moveTo(c2[0], c2[1]); ctx.lineTo(q[0] - 6, q[1] - sd * 6); ctx.stroke(); txt(b[0], q[0] + 8, q[1] + 5, 'center', i + 1 === s.hiB ? T.figRed : T.figInk, i + 1 === s.hiB, 13); });
        var same = side(s.front[s.hiF][1]) === side(backAng(s.hiB));
        txt(same ? s.prodZ : s.prodE, px, py + 62, 'center', T.figInk, true, 13);
        txt('빨강: 각 탄소의 우선순위 높은 원자단', px, py + 80, 'center', T.figMuted, false, 11);
      }
      // 읽기
      rD.set(Math.round(dhb) + '°');
      rE.set(ec.toFixed(1) + ' kJ/mol');
      rS.set(anti ? '안티 준평면 — E2 가능' : (dhb < 5 ? '신 준평면(가려진 형태, 드묾)' : '제거 불가(준평면 아님)'));
      var sameS = side0(s.front[s.hiF][1]) === side0(backAng(s.hiB));
      rP.set(anti ? (sameS ? s.prodZ : s.prodE) : '—');
    }
    function side0(a) { return Math.cos(rad(a)) > 0 ? -1 : 1; }
    function redraw() { sc.redraw(); draw2d(); }
    api.onResize(draw2d); api.onTheme(draw2d);
    redraw();
  },
});
