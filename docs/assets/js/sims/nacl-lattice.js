/* 통합과학 2-4 이온 결합: 염화 나트륨 결정을 입체로 돌려 보기 (3D 견본) */
Sims.register('nacl-lattice', {
  title: '소금 결정 속으로 — 이온이 쌓인 모습을 돌려 보기',
  caption: '염화 나트륨 결정에서는 나트륨 이온(Na⁺)과 염화 이온(Cl⁻)이 번갈아 가며 규칙적으로 쌓여 있다. 그림을 끌어서 돌려 보고, 한 이온을 골라 가장 가까운 이웃을 확인해 보자. 어느 이온이든 반대 전하를 띤 이온 6개에 둘러싸여 있어, 특정한 짝 하나와만 결합한 것이 아니다. 이온의 크기와 간격은 설명을 위해 단순화했다.',
  init: function (api) {
    var state = { n: 3, focus: 'none', bonds: true };
    var rIon = api.readout('가운데 이온');
    var rNear = api.readout('가장 가까운 이웃');
    var rCount = api.readout('그려진 이온 수');

    var S = api.scene3d({
      yaw: 0.55, pitch: 0.4, dist: 11, scale: 0.15, label: '염화 나트륨 결정의 입체 모형',
      draw: function (g, T) {
        var n = state.n, off = (n - 1) / 2, d = 1.25, c = Math.floor(n / 2);
        // 이온을 고르면 결정 한가운데(이웃 6개가 모두 보이는 자리)에 그 이온이 오도록 배열을 맞춘다
        var center = state.focus === 'none' || n < 3 ? null : [c, c, c];
        var flip = center ? ((3 * c) % 2 === 0) !== (state.focus === 'na') : false;
        var isNa = function (i, j, k) { return ((i + j + k) % 2 === 0) !== flip; };
        var P = function (i, j, k) { return [(i - off) * d, (j - off) * d, (k - off) * d]; };
        var near = function (i, j, k) { return center && Math.abs(i - center[0]) + Math.abs(j - center[1]) + Math.abs(k - center[2]) === 1; };
        var isC = function (i, j, k) { return center && i === center[0] && j === center[1] && k === center[2]; };
        for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) for (var k = 0; k < n; k++) {
          var na = isNa(i, j, k), hi = !center || isC(i, j, k) || near(i, j, k);
          g.sphere(P(i, j, k), na ? 0.3 : 0.46, na ? T.figAmber : T.figGreen,
            { alpha: hi ? 1 : 0.18, label: hi && n <= 3 ? (na ? 'Na⁺' : 'Cl⁻') : '', outline: isC(i, j, k) ? T.figInk : false });
          if (!state.bonds) continue;
          [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(function (v) {
            var a = i + v[0], b = j + v[1], e = k + v[2];
            if (a >= n || b >= n || e >= n) return;
            var strong = center && ((isC(i, j, k) && near(a, b, e)) || (isC(a, b, e) && near(i, j, k)));
            g.line(P(i, j, k), P(a, b, e), strong ? T.figRed : T.figLine, { width: strong ? 3 : 1, alpha: center && !strong ? 0.2 : 0.9 });
          });
        }
        var na = 0; for (var x = 0; x < n; x++) for (var y = 0; y < n; y++) for (var z = 0; z < n; z++) if (isNa(x, y, z)) na++;
        rCount.set(n * n * n + '개 (Na⁺ ' + na + ', Cl⁻ ' + (n * n * n - na) + ')');
        if (!center) { rIon.set('고르지 않음'); rNear.set('아래에서 이온을 골라 보자'); }
        else if (state.focus === 'na') { rIon.set('Na⁺ (양이온)'); rNear.set('Cl⁻ 6개'); }
        else { rIon.set('Cl⁻ (음이온)'); rNear.set('Na⁺ 6개'); }
      },
    });

    var g1 = api.group();
    var bs = [
      api.button('전체 보기', function () { pick('none'); }, { toggle: true, pressed: true, parent: g1 }),
      api.button('가운데 Na⁺의 이웃', function () { pick('na'); }, { toggle: true, parent: g1 }),
      api.button('가운데 Cl⁻의 이웃', function () { pick('cl'); }, { toggle: true, parent: g1 }),
    ];
    function pick(f) {
      state.focus = f;
      if (f !== 'none' && state.n < 3) size.set(3);
      bs.forEach(function (b, i) { b.setAttribute('aria-pressed', ['none', 'na', 'cl'][i] === f ? 'true' : 'false'); });
      S.redraw();
    }
    var size = api.slider({ id: 'nacl-lattice-n', label: '한 변에 놓인 이온 수', min: 2, max: 5, step: 1, value: 3,
      format: function (v) { return v + '개'; }, onInput: function (v) { state.n = v; if (v < 3 && state.focus !== 'none') pick('none'); else S.redraw(); } });
    api.button('이온 사이 선 보이기/숨기기', function () { state.bonds = !state.bonds; S.redraw(); });
  },
});
