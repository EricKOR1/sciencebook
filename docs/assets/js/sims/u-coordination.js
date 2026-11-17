/* 일반화학 12 배위 화학: 착물의 입체 구조와 기하 이성질 — MA₄B₂ 시스·트랜스, MA₃B₃ fac·mer, 평면 사각형, 사면체 (3D) */
Sims.register('u-coordination', {
  title: '배위 화합물의 이성질체 — 돌려 보면 몇 가지일까?',
  caption: '구조를 고른 뒤 ‘B 자리 무작위로 바꾸기’를 여러 번 눌러 보자. 정팔면체 MA₄B₂에서 B 두 개를 놓는 방법은 15가지이지만, 돌려서 겹쳐 보면 B–M–B가 90°인 시스와 180°인 트랜스 두 가지뿐이다. MA₃B₃은 20가지 배치가 fac(B 세 개가 한 면)과 mer(B 세 개가 한 자오선) 두 가지로 묶인다. 평면 사각형 MA₂B₂에는 시스·트랜스가 있지만, 사면체 MA₂B₂는 네 꼭짓점이 모두 이웃이어서 이성질체가 없다. M은 중심 금속, A·B는 한자리 리간드(예: NH₃, Cl⁻)이고 결합 길이는 모두 같게 그렸다.',
  init: function (api) {
    var s3 = 1 / Math.sqrt(3);
    var geo = {
      oct: { name: '정팔면체 MA₄B₂', pos: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], nB: 2 },
      oct3: { name: '정팔면체 MA₃B₃', pos: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], nB: 3 },
      sq: { name: '평면 사각형 MA₂B₂', pos: [[1, 0, 0], [0, 0, -1], [-1, 0, 0], [0, 0, 1]], nB: 2 },
      tet: { name: '사면체 MA₂B₂', pos: [[s3, s3, s3], [-s3, -s3, s3], [-s3, s3, -s3], [s3, -s3, -s3]], nB: 2 },
    };
    var order = ['oct', 'oct3', 'sq', 'tet'];
    var st = { g: 'oct', B: [0, 2], tries: 0, seen: {} };
    var rG = api.readout('구조'), rP = api.readout('이 배치'), rA = api.readout('B–M–B 각'), rC = api.readout('가능한 배치 → 이성질체');

    function ang(a, b) { var d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; return Math.round(Math.acos(Math.max(-1, Math.min(1, d))) * 180 / Math.PI); }
    function classify() {
      var P = geo[st.g].pos, B = st.B, angs = [];
      for (var i = 0; i < B.length; i++) for (var j = i + 1; j < B.length; j++) angs.push(ang(P[B[i]], P[B[j]]));
      if (st.g === 'tet') return { name: '이성질체 없음 (한 가지)', angs: angs };
      if (st.g === 'oct3') return { name: angs.indexOf(180) >= 0 ? 'mer (자오선형)' : 'fac (면형)', angs: angs };
      return { name: angs[0] === 180 ? '트랜스 (맞은편)' : '시스 (이웃)', angs: angs };
    }
    var S = api.scene3d({
      yaw: 0.6, pitch: 0.38, dist: 10, scale: 0.2, label: '배위 화합물의 입체 모형',
      draw: function (g, T) {
        var P = geo[st.g].pos, L = 1.9, isB = function (i) { return st.B.indexOf(i) >= 0; };
        // 다면체 모서리(옅게)
        for (var i = 0; i < P.length; i++) for (var j = i + 1; j < P.length; j++) {
          var a = ang(P[i], P[j]);
          if ((st.g !== 'tet' && a === 90) || (st.g === 'tet')) g.line(sc(P[i], L), sc(P[j], L), T.figLine, { width: 1, dash: [3, 4], alpha: 0.7 });
        }
        // B–B 관계 강조
        var B = st.B;
        for (var p = 0; p < B.length; p++) for (var q = p + 1; q < B.length; q++) {
          if (st.g !== 'oct3') g.line(sc(P[B[p]], L * 1.0), sc(P[B[q]], L * 1.0), T.figRed, { width: 2.2, dash: [6, 4] });
        }
        if (st.g === 'oct3' && classify().name.charAt(0) === 'f') g.poly(B.map(function (k) { return sc(P[k], L); }), T.figSoftRed, { alpha: 0.45, stroke: T.figRed });
        P.forEach(function (v, k) {
          g.line([0, 0, 0], sc(v, L), T.figMuted, { width: 3 });
          g.sphere(sc(v, L), isB(k) ? 0.42 : 0.36, isB(k) ? T.figGreen : T.figBlue, { label: isB(k) ? 'B' : 'A' });
        });
        g.sphere([0, 0, 0], 0.5, T.figAmber, { label: 'M' });
      },
    });
    function sc(v, L) { return [v[0] * L, v[1] * L, v[2] * L]; }

    var g1 = api.group();
    var bs = order.map(function (k, i) { return api.button(geo[k].name, function () { pick(k); }, { toggle: true, pressed: i === 0, parent: g1 }); });
    var g2 = api.group();
    var preset = [];
    preset.push(api.button('이성질체 ①', function () { setIso(0); }, { parent: g2 }));
    preset.push(api.button('이성질체 ②', function () { setIso(1); }, { parent: g2 }));
    api.button('B 자리 무작위로 바꾸기', function () { random(); }, { primary: true, parent: g2 });

    var isoSets = { oct: [[0, 2], [0, 1]], oct3: [[0, 2, 4], [0, 1, 2]], sq: [[0, 1], [0, 2]], tet: [[0, 1], [0, 1]] };
    var isoLabel = { oct: ['시스', '트랜스'], oct3: ['fac', 'mer'], sq: ['시스', '트랜스'], tet: ['(한 가지)', '(한 가지)'] };
    function pick(k) {
      st.g = k; st.seen = {}; st.tries = 0;
      bs.forEach(function (b, i) { b.setAttribute('aria-pressed', order[i] === k ? 'true' : 'false'); });
      setIso(0);
    }
    function setIso(i) { st.B = isoSets[st.g][i].slice(); note(); S.redraw(); update(); }
    function random() {
      var n = geo[st.g].pos.length, idx = [];
      for (var i = 0; i < n; i++) idx.push(i);
      for (i = n - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
      st.B = idx.slice(0, geo[st.g].nB).sort();
      st.tries++; note(); S.redraw(); update();
    }
    function note() { var c = classify().name; st.seen[c] = (st.seen[c] || 0) + 1; }
    function comb(n, k) { var r = 1; for (var i = 0; i < k; i++) r = r * (n - i) / (i + 1); return r; }
    function update() {
      var c = classify(), gm = geo[st.g];
      preset[0].textContent = isoLabel[st.g][0] + ' 보기'; preset[1].textContent = isoLabel[st.g][1] + ' 보기';
      preset[1].style.display = st.g === 'tet' ? 'none' : '';
      rG.set(gm.name);
      rP.set(c.name);
      rA.set(c.angs.map(function (a) { return a + '°'; }).join(', '));
      var total = comb(gm.pos.length, gm.nB);
      var iso = st.g === 'tet' ? 1 : 2;
      var detail = st.g === 'oct' ? ' (시스 12, 트랜스 3)' : st.g === 'oct3' ? ' (fac 8, mer 12)' : st.g === 'sq' ? ' (시스 4, 트랜스 2)' : '';
      rC.set(total + '가지 → ' + iso + '가지' + detail);
    }
    pick('oct');
  },
});
