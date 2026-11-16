/* 생물의 유전 1 유전자와 유전물질: DNA 이중 나선을 입체로 돌려 보고, 사다리로 펴서 비교하기 (3D) */
Sims.register('dna-3d', {
  title: 'DNA 이중 나선 — 돌려 보고, 사다리로 펴 보기',
  caption: '20염기쌍(약 2회전)의 DNA 이중 나선이다. 끌어서 돌려 보며 바깥쪽의 당–인산 골격과 안쪽의 염기쌍, 두 가닥의 방향(5′→3′, 역평행)을 확인하자. 위치를 골라 염기쌍을 바꾸면 A–T(수소 결합 2개)와 G–C(수소 결합 3개)의 수가 달라지고, \'사다리로 펴 보기\'를 누르면 꼬임을 푼 모습과 비교할 수 있다. 한 바퀴에 약 10염기쌍(3.4 nm), 지름 약 2 nm 비율로 그렸고, 원자 하나하나 대신 당·인산·염기를 단순한 모양으로 나타냈다.',
  init: function (api) {
    var NBP = 20, RISE = 0.34, RAD = 1.0, TWIST = Math.PI / 5;   // 1 단위 = 1 nm, 염기쌍당 36°
    var OFFSET = 150 * Math.PI / 180;                             // 나선에서 두 가닥 골격이 마주 보는 각(실제처럼 정반대가 아니다)
    var PAIR = { A: 'T', T: 'A', G: 'C', C: 'G' };
    var CYCLE = ['A', 'T', 'G', 'C'];
    var state = { seq: 'ATGCGTACCGATTGCAAGCT'.split(''), sel: 4, u: 0, target: 0 };

    var rSeq = api.readout('가닥 ① 서열 (5′→3′)');
    var rPairs = api.readout('염기쌍');
    var rH = api.readout('수소 결합 수');
    var rLen = api.readout('길이');

    function colorOf(T, b) { return b === 'A' ? T.figRed : b === 'T' ? T.figAmber : b === 'G' ? T.figGreen : T.figBlue; }

    var S = api.scene3d({
      aspect: function (w) { return w < 560 ? 1.25 : 0.62; },
      yaw: 0.25, pitch: 0.12, dist: 16, scale: 0.12,
      label: 'DNA 이중 나선 입체 모형: 당–인산 골격 두 가닥과 수소 결합으로 이어진 염기쌍 20개',
      draw: function (g, T, S) {
        var wide = S.w >= 560;
        // 나선 축(지역 y)을 넓은 화면에서는 가로로 눕힌다
        var M = function (p) { return wide ? [p[1], -p[0], p[2]] : p; };
        var u = state.u, tw = TWIST * (1 - u), off = OFFSET + (Math.PI - OFFSET) * u;
        var y0 = -(NBP - 1) * RISE / 2, mid = (NBP - 1) / 2;
        var c1 = T.figTeal, c2 = T.figViolet;
        function pt(theta, y, r) { return M([r * Math.sin(theta), y, r * Math.cos(theta)]); }
        var bb1 = [], bb2 = [];
        for (var i = 0; i < NBP; i++) {
          var y = y0 + i * RISE;
          // 펴졌을 때(u=1) 두 가닥이 x축 양쪽(+x, −x)에 오도록 기준각을 잡는다
          var th1 = (i - mid) * tw + Math.PI / 2 - (off - Math.PI) / 2;
          var th2 = th1 + off;
          var s1 = pt(th1, y, RAD * 0.9), s2 = pt(th2, y, RAD * 0.9);
          var p1 = pt(th1 - 0.25 * (1 - u), y + RISE / 2, RAD), p2 = pt(th2 + 0.25 * (1 - u), y - RISE / 2, RAD);
          bb1.push(s1, p1); bb2.push(p2, s2);
          var b = state.seq[i], q = PAIR[b];
          var pur = function (x) { return x === 'A' || x === 'G'; };
          var f = pur(b) ? 0.54 : 0.44, gap = 0.05;
          var lerp = function (a, c, t) { return [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, a[2] + (c[2] - a[2]) * t]; };
          var e1 = lerp(s1, s2, f - gap), e2 = lerp(s1, s2, f + gap);
          var sel = i === state.sel;
          g.line(s1, e1, colorOf(T, b), { width: sel ? 9 : 7 });
          g.line(e2, s2, colorOf(T, q), { width: sel ? 9 : 7 });
          var nh = (b === 'A' || b === 'T') ? 2 : 3;
          var ax = M([0, 1, 0]);
          for (var h = 0; h < nh; h++) {
            var dy = (h - (nh - 1) / 2) * 0.09;
            var a1 = [e1[0] + ax[0] * dy, e1[1] + ax[1] * dy, e1[2] + ax[2] * dy];
            var a2 = [e2[0] + ax[0] * dy, e2[1] + ax[1] * dy, e2[2] + ax[2] * dy];
            g.line(a1, a2, T.figInk, { width: 1.4 });
          }
          g.sphere(s1, 0.13, c1, { outline: sel ? T.figInk : false });
          g.sphere(s2, 0.13, c2, { outline: sel ? T.figInk : false });
          if (sel || u > 0.95) {
            var lab1 = lerp(s1, s2, 0.2), lab2 = lerp(s1, s2, 0.8);
            g.text(lab1, b, { bold: true, size: 13, color: T.figInk });
            g.text(lab2, q, { bold: true, size: 13, color: T.figInk });
          }
        }
        g.path(bb1, c1, { width: 3 });
        g.path(bb2, c2, { width: 3 });
        bb1.forEach(function (p, k) { if (k % 2 === 1) g.sphere(p, 0.09, T.figMuted, { flat: true }); });
        bb2.forEach(function (p, k) { if (k % 2 === 0) g.sphere(p, 0.09, T.figMuted, { flat: true }); });
        // 방향 표시: 가닥 ① 아래(5′)→위(3′), 가닥 ② 위(5′)→아래(3′)
        var yb = y0 - RISE * 1.2, yt = y0 + (NBP - 1) * RISE + RISE * 1.2;
        var thA = (0 - mid) * tw + Math.PI / 2 - (off - Math.PI) / 2, thB = (NBP - 1 - mid) * tw + Math.PI / 2 - (off - Math.PI) / 2;
        g.text(pt(thA, yb, RAD * 1.15), '5′', { bold: true, size: 13, color: c1 });
        g.text(pt(thB, yt, RAD * 1.15), '3′', { bold: true, size: 13, color: c1 });
        g.text(pt(thB + off, yt, RAD * 1.15), '5′', { bold: true, size: 13, color: c2 });
        g.text(pt(thA + off, yb, RAD * 1.15), '3′', { bold: true, size: 13, color: c2 });
        var ar1a = pt(thA, y0 + RISE * 0.5, RAD * 1.45), ar1b = pt(thA, y0 + RISE * 4.5, RAD * 1.45);
        g.arrow(ar1a, ar1b, c1, { width: 2.5 });
        var yE = y0 + (NBP - 1) * RISE;
        g.arrow(pt(thB + off, yE - RISE * 0.5, RAD * 1.45), pt(thB + off, yE - RISE * 4.5, RAD * 1.45), c2, { width: 2.5 });
        // 한 바퀴 표시
        if (u < 0.05) {
          var ya = y0, yz = y0 + 10 * RISE, sidePt = function (yy) { return M([0, yy, 0]).map(function (v, k) { return v + (wide ? [0, -1, 0] : [1, 0, 0])[k] * 1.9; }); };
          g.line(sidePt(ya), sidePt(yz), T.figMuted, { width: 1.5, dash: [4, 3] });
          g.text(sidePt((ya + yz) / 2), '한 바퀴 ≈ 10염기쌍 (3.4 nm)', { size: 12, color: T.figMuted, dy: wide ? 14 : 0, align: wide ? 'center' : 'left' });
        }
      },
      overlay: function (ctx, T, S) {
        var items = [['A', T.figRed], ['T', T.figAmber], ['G', T.figGreen], ['C', T.figBlue]];
        ctx.font = '600 12px ' + T.fontBody; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        var x = 10, y = 14;
        items.forEach(function (it) { ctx.fillStyle = it[1]; ctx.fillRect(x, y - 4, 14, 8); ctx.fillStyle = T.figInk; ctx.fillText(it[0], x + 18, y); x += 36; });
        ctx.font = '12px ' + T.fontBody;
        var y2 = 32;
        ctx.fillStyle = T.figTeal; ctx.beginPath(); ctx.arc(16, y2, 5, 0, 7); ctx.fill();
        ctx.fillStyle = T.figInk; ctx.fillText('당(가닥 ①)', 26, y2);
        ctx.fillStyle = T.figViolet; ctx.beginPath(); ctx.arc(106, y2, 5, 0, 7); ctx.fill();
        ctx.fillStyle = T.figInk; ctx.fillText('당(가닥 ②)', 116, y2);
        ctx.fillStyle = T.figMuted; ctx.beginPath(); ctx.arc(16, y2 + 18, 4, 0, 7); ctx.fill();
        ctx.fillStyle = T.figInk; ctx.fillText('인산', 26, y2 + 18);
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(100, y2 + 15); ctx.lineTo(112, y2 + 15); ctx.moveTo(100, y2 + 21); ctx.lineTo(112, y2 + 21); ctx.stroke();
        ctx.fillText('수소 결합', 116, y2 + 18);
      },
    });

    // 펴기·감기 애니메이션
    var morph = api.loop(function (dt) {
      var d = state.target - state.u, step = dt / 1.2;
      if (Math.abs(d) <= step) { state.u = state.target; morph.pause(); } else state.u += d > 0 ? step : -step;
      S.redraw();
    });
    morph.pause();

    var ladderBtn = api.button('사다리로 펴 보기', function () {
      state.target = state.target ? 0 : 1;
      ladderBtn.textContent = state.target ? '이중 나선으로 감기' : '사다리로 펴 보기';
      ladderBtn.setAttribute('aria-pressed', state.target ? 'true' : 'false');
      if (api.reduced) { state.u = state.target; S.redraw(); } else morph.play();
    }, { primary: true, toggle: true });

    var g1 = api.group();
    api.slider({ id: 'dna-3d-pos', label: '고른 위치', min: 1, max: NBP, step: 1, value: state.sel + 1, parent: g1,
      format: function (v) { return v + '번째 (' + state.seq[v - 1] + '–' + PAIR[state.seq[v - 1]] + ')'; },
      onInput: function (v) { state.sel = v - 1; update(); } });
    api.button('이 자리 염기쌍 바꾸기', function () {
      var b = state.seq[state.sel];
      state.seq[state.sel] = CYCLE[(CYCLE.indexOf(b) + 1) % 4];
      posOut(); update();
    }, { parent: g1 });
    api.button('무작위 서열', function () {
      for (var i = 0; i < NBP; i++) state.seq[i] = CYCLE[Math.floor(Math.random() * 4)];
      posOut(); update();
    }, { parent: g1 });
    function posOut() {
      var out = api.root.querySelector('output[for="dna-3d-pos"]');
      if (out) out.textContent = (state.sel + 1) + '번째 (' + state.seq[state.sel] + '–' + PAIR[state.seq[state.sel]] + ')';
    }

    function update() {
      var at = 0, gc = 0;
      state.seq.forEach(function (b) { if (b === 'A' || b === 'T') at++; else gc++; });
      rSeq.set(state.seq.join(''));
      rPairs.set('A–T ' + at + '쌍, G–C ' + gc + '쌍');
      rH.set(at + '×2 + ' + gc + '×3 = ' + (at * 2 + gc * 3) + '개');
      rLen.set(NBP + ' × 0.34 nm ≈ ' + (NBP * RISE).toFixed(1) + ' nm (약 2바퀴)');
      S.redraw();
    }
    update();
  },
});
