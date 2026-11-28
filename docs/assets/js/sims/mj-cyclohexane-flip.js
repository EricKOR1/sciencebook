/* 유기화학 2: 일치환 사이클로헥세인 고리 뒤집힘 탐색기 — 축·적도 교환, 1,3-이축 거리, A값과 볼츠만 비율, 뒤집힘 속도 */
Sims.register('mj-cyclohexane-flip', {
  title: '일치환 사이클로헥세인의 고리 뒤집힘 — 축과 적도, A값과 온도',
  caption: 'C1의 치환기를 고르고 ‘고리 뒤집기’를 눌러 보자. 의자 형태가 보트 쪽을 거쳐 다른 의자 형태로 바뀌면서 축 결합(파랑)은 적도 결합(빨강)이, 적도 결합은 축 결합이 된다. 위를 향하던 결합은 계속 위를 향한다. ' +
    '치환기가 축에 오면 같은 쪽 C3·C5의 축 H까지의 거리(pm)를 점선으로 보여 준다. 오른쪽 막대는 A값 표의 값으로 계산한 적도 : 축 비율 K = e^(A/RT)이고, 아래 숫자는 고리 뒤집힘 속도 k ≈ (k_BT/h)·e^(−45 kJ/mol ÷ RT)이다. ' +
    '온도를 낮추면 비율이 더 한쪽으로 쏠리고 뒤집힘이 크게 느려진다. 뒤집힘 경로는 고리 원자의 높이만 바꾼 모식적 경로이고, 여러 원자로 된 치환기(CH₃, 아이소프로필, 페닐, tert-뷰틸)는 공 하나로 단순화했다.',
  init: function (api) {
    var R = 8.314e-3, kB = 1.380649e-23, hP = 6.62607e-34;
    var SUB = {
      H: { lab: 'H', A: 0, L: 1.09, r: 0.22, col: 'figPanel' },
      F: { lab: 'F', A: 1.0, L: 1.39, r: 0.32, col: 'figGreen' },
      Cl: { lab: 'Cl', A: 2.2, L: 1.78, r: 0.4, col: 'figGreen' },
      Br: { lab: 'Br', A: 2.1, L: 1.94, r: 0.44, col: 'figAmber' },
      OH: { lab: 'OH', A: 3.9, L: 1.43, r: 0.34, col: 'figRed' },
      CH3: { lab: 'CH₃', A: 7.3, L: 1.53, r: 0.42, col: 'figMuted' },
      iPr: { lab: 'iPr', A: 9.2, L: 1.53, r: 0.5, col: 'figMuted' },
      Ph: { lab: 'Ph', A: 11.7, L: 1.51, r: 0.55, col: 'figViolet' },
      tBu: { lab: 'tBu', A: 20, L: 1.54, r: 0.6, col: 'figMuted' },
    };
    var NAMES = { H: 'H', F: 'F', Cl: 'Cl', Br: 'Br', OH: 'OH', CH3: 'CH₃', iPr: 'CH(CH₃)₂', Ph: 'C₆H₅', tBu: 'C(CH₃)₃' };
    var st = { sub: 'CH3', t: 0, target: 0, T: 298 };
    // 의자 기하: 고리 반지름·높이(Å) — C–C 1.53, C–C–C 약 111°
    var rr = 1.452, hh = 0.25;
    var Z0 = [1, -1, 1, -1, 1, -1], ZB = [1.25, -0.62, -0.63, 1.25, -0.62, -0.63], Z1 = [-1, 1, -1, 1, -1, 1];
    function ringAt(t) {
      var z = [], i;
      for (i = 0; i < 6; i++) {
        var a = t < 0.5 ? Z0[i] + (ZB[i] - Z0[i]) * (t / 0.5) : ZB[i] + (Z1[i] - ZB[i]) * ((t - 0.5) / 0.5);
        z.push(a * hh);
      }
      var P = [];
      for (i = 0; i < 6; i++) { var th = i * Math.PI / 3; P.push([rr * Math.cos(th), z[i], rr * Math.sin(th)]); }   // y 가 위
      return P;
    }
    function norm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
    function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
    // 고리 원자 i 의 두 치환기 방향(사면체 보충)
    function dirs(P, i) {
      var a = P[i], b = P[(i + 5) % 6], c = P[(i + 1) % 6];
      var u = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]), v = norm([c[0] - a[0], c[1] - a[1], c[2] - a[2]]);
      var bis = norm([-(u[0] + v[0]), -(u[1] + v[1]), -(u[2] + v[2])]), n = norm(cross(u, v));
      var al = 54.75 * Math.PI / 180, ca = Math.cos(al), sa = Math.sin(al);
      return [[bis[0] * ca + n[0] * sa, bis[1] * ca + n[1] * sa, bis[2] * ca + n[2] * sa], [bis[0] * ca - n[0] * sa, bis[1] * ca - n[1] * sa, bis[2] * ca - n[2] * sa]];
    }
    // 같은 결합을 따라가도록: 시작 의자(t=0)에서 '위' 결합(y>0)을 0번으로 정하고, 연속으로 가장 가까운 방향을 고른다
    function trackedDirs(P) {
      var out = [];
      for (var i = 0; i < 6; i++) {
        var d = dirs(P, i);
        // '위 쪽' 결합 = y 성분이 큰 쪽(뒤집힘 동안 위는 위로 남는다)
        out.push(d[0][1] >= d[1][1] ? { up: d[0], dn: d[1] } : { up: d[1], dn: d[0] });
      }
      return out;
    }
    // 치환기 X 는 C1 의 '아래' 결합(시작 의자에서 적도)에 둔다 → 뒤집은 뒤에는 축(아래)
    var S = api.scene3d({
      yaw: 0.35, pitch: 0.3, dist: 10, scale: 0.105, viewButtons: true,
      aspect: function (w) { return w < 560 ? 1.4 : 0.62; },
      label: '사이클로헥세인 의자 형태의 공-막대 모형과 적도·축 비율 막대',
      draw: function (g, T, Sc) {
        var P = ringAt(st.t), D = trackedDirs(P), s = SUB[st.sub];
        var ox = Sc && Sc.w < 560 ? 0 : -1.6, oy = Sc && Sc.w < 560 ? 1.5 : 0;   // 모형을 왼쪽으로(막대 자리)
        function sh(p) { return [p[0] + ox, p[1] + oy, p[2]]; }
        var i, k;
        for (i = 0; i < 6; i++) {
          g.line(sh(P[i]), sh(P[(i + 1) % 6]), T.figInk, { width: 4 });
          g.sphere(sh(P[i]), 0.26, T.figMuted, { outline: true });
          g.text(sh([P[i][0] * 1.32, P[i][1] + (P[i][1] > 0 ? 0.32 : -0.32), P[i][2] * 1.32]), 'C' + (i + 1), { size: 11, color: T.figMuted });
          for (k = 0; k < 2; k++) {
            var d = k === 0 ? D[i].up : D[i].dn, isX = i === 0 && k === 1;
            var ax = Math.abs(d[1]) > 0.8, L = isX ? s.L : 1.09;
            var e = [P[i][0] + d[0] * L, P[i][1] + d[1] * L, P[i][2] + d[2] * L];
            g.line(sh(P[i]), sh(e), ax ? T.figBlue : T.figRed, { width: 3 });
            if (isX) g.sphere(sh(e), s.r, T[s.col], { outline: true, label: s.lab, labelColor: T.figInk });
            else g.sphere(sh(e), 0.16, T.figPanel, { outline: true });
          }
        }
        // 축 치환기 → C3·C5 같은 쪽 축 H 거리
        var dX = D[0].dn, axX = Math.abs(dX[1]) > 0.8;
        if (axX && st.sub !== 'H') {
          var X = [P[0][0] + dX[0] * s.L, P[0][1] + dX[1] * s.L, P[0][2] + dX[2] * s.L];
          [2, 4].forEach(function (j) {
            var dj = dX[1] < 0 ? D[j].dn : D[j].up;
            if (Math.abs(dj[1]) < 0.8) return;
            var H = [P[j][0] + dj[0] * 1.09, P[j][1] + dj[1] * 1.09, P[j][2] + dj[2] * 1.09];
            var dist = Math.hypot(X[0] - H[0], X[1] - H[1], X[2] - H[2]) * 100;
            g.line(sh(X), sh(H), T.figViolet, { width: 2, dash: [5, 4] });
            g.text(sh([(X[0] + H[0]) / 2, (X[1] + H[1]) / 2 - 0.25, (X[2] + H[2]) / 2]), Math.round(dist) + ' pm', { size: 12, color: T.figViolet, bold: true });
          });
        }
      },
      overlay: function (ctx, T, Sc) {
        var w = Sc.w, h = Sc.h, small = w < 560;
        var RT = R * st.T, A = SUB[st.sub].A, K = Math.exp(A / RT), fe = K / (1 + K);
        var x0 = small ? 16 : w * 0.66, y0 = small ? h * 0.62 : h * 0.18, bw = small ? w - 32 : w * 0.3;
        ctx.font = '600 13px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(NAMES[st.sub] + ': A = ' + A.toFixed(1) + ' kJ/mol, T = ' + st.T.toFixed(0) + ' K', x0, y0);
        [['적도', fe, T.figRed], ['축', 1 - fe, T.figBlue]].forEach(function (it, i) {
          var y = y0 + 18 + i * 28;
          ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.fillText(it[0], x0, y + 9);
          ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figLine; ctx.fillRect(x0 + 36, y, bw - 100, 18); ctx.strokeRect(x0 + 36, y, bw - 100, 18);
          ctx.fillStyle = it[2]; ctx.fillRect(x0 + 36, y, (bw - 100) * it[1], 18);
          ctx.fillStyle = T.figInk; ctx.fillText((it[1] * 100).toFixed(it[1] > 0.999 || it[1] < 0.001 ? 2 : 1) + ' %', x0 + bw - 58, y + 9);
        });
        var kf = kB * st.T / hP * Math.exp(-45 / RT);
        ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figInk;
        ctx.fillText('뒤집힘 속도 k ≈ ' + sci(kf) + ' s⁻¹', x0, y0 + 84);
        ctx.fillStyle = T.figMuted;
        ctx.fillText('(한 의자에 평균 ' + tau(1 / kf) + ' 머묾)', x0, y0 + 102);
        var stage = st.t < 0.04 ? '의자' : st.t > 0.96 ? '뒤집힌 의자' : Math.abs(st.t - 0.5) < 0.06 ? '보트 근처' : '뒤집히는 중';
        ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = small ? 'left' : 'left';
        ctx.fillText('지금: ' + stage + ' · 파랑 = 축, 빨강 = 적도', small ? 16 : 16, small ? h - 12 : h - 18);
      },
    });
    function sci(x) {
      if (x >= 0.01 && x < 1000) return x.toPrecision(2);
      var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e);
      var sup = String(e).split('').map(function (c) { return { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }[c]; }).join('');
      return m.toFixed(1) + '×10' + sup;
    }
    function tau(s) {
      if (s < 1e-6) return (s * 1e9).toPrecision(2) + ' ns';
      if (s < 1e-3) return (s * 1e6).toPrecision(2) + ' μs';
      if (s < 1) return (s * 1e3).toPrecision(2) + ' ms';
      if (s < 120) return s.toPrecision(2) + ' s';
      if (s < 7200) return (s / 60).toPrecision(2) + ' 분';
      return (s / 3600).toPrecision(2) + ' 시간';
    }
    // 조작
    var lab = api.el('label'); lab.setAttribute('for', 'mj-cyclohexane-flip-sub');
    var sp = api.el('span', null, 'C1의 치환기 '); lab.appendChild(sp);
    var sel = api.el('select'); sel.id = 'mj-cyclohexane-flip-sub';
    Object.keys(SUB).forEach(function (k) { var o = api.el('option', null, NAMES[k] + ' (A ' + SUB[k].A + ')'); o.value = k; if (k === st.sub) o.selected = true; sel.appendChild(o); });
    sel.addEventListener('change', function () { st.sub = sel.value; upd(); S.redraw(); });
    lab.appendChild(sel); api.controls.appendChild(lab);
    api.slider({ id: 'mj-cyclohexane-flip-t', label: '온도 T', min: 150, max: 400, step: 1, value: st.T,
      format: function (v) { return v.toFixed(0) + ' K'; }, onInput: function (v) { st.T = v; upd(); S.redraw(); } });
    var rPos = api.readout('C1 치환기 '), rK = api.readout('K = [적도]/[축] ');
    api.button('고리 뒤집기', function () {
      st.target = st.target ? 0 : 1;
      if (api.reduced) { st.t = st.target; upd(); S.redraw(); return; }
      anim = true; loop.play();
    }, { primary: true });
    var anim = false;
    var loop = api.loop(function (dt) {
      if (!anim) return;
      var dir = st.target > st.t ? 1 : -1;
      st.t = Math.min(1, Math.max(0, st.t + dir * dt / 2.4));
      if ((dir > 0 && st.t >= st.target) || (dir < 0 && st.t <= st.target)) { st.t = st.target; anim = false; loop.pause(); }
      upd(); S.redraw();
    });
    loop.pause();
    function upd() {
      var P = ringAt(st.t), D = trackedDirs(P), d = D[0].dn, ax = Math.abs(d[1]) > 0.8;
      rPos.set(st.t > 0.04 && st.t < 0.96 ? '바뀌는 중' : (ax ? '축' : '적도') + (d[1] > 0 ? '(위)' : '(아래)'));
      var K = Math.exp(SUB[st.sub].A / (R * st.T));
      rK.set(K < 1000 ? K.toPrecision(3) : sci(K));
    }
    upd(); S.redraw();
  },
});
