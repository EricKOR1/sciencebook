/* 물질과 에너지 1: 결정성 고체의 네 가지 분류 — 어떤 입자가 어떤 힘으로 묶여 있나 (3D) */
Sims.register('crystal-types', {
  title: '네 가지 결정 비교하기 — 입자와 힘이 성질을 정한다',
  caption: '결정을 골라 돌려 보고, "층 밀어 보기"와 "전압 걸어 보기"를 눌러 성질을 비교해 보자. 이온 결정은 층이 밀리면 같은 전하끼리 마주 보아 쪼개지고, 금속은 자유 전자가 양이온을 계속 붙잡아 펴진다. 분자 결정과 흑연의 층 사이는 약한 힘이라 쉽게 밀리지만, 다이아몬드는 공유 결합 그물이라 거의 밀리지 않는다. 입자의 크기·간격은 단순화했고, 녹는점은 1 atm에서의 대략적인 값이다.',
  init: function (api) {
    var K = {
      ion: { name: '이온 결정 (염화 나트륨)', who: 'Na⁺과 Cl⁻', force: '이온 결합(양이온–음이온 정전기적 인력)', elec: '× (이온이 제자리에 묶여 있다. 녹이거나 물에 녹이면 ○)', hard: '단단하지만 힘을 주면 쪼개진다',
        push: '같은 전하끼리 마주 보아 서로 밀어낸다 → 쪼개진다' },
      mol: { name: '분자 결정 (드라이아이스)', who: 'CO₂ 분자', force: '분자 간 상호작용(약함). 분자 안은 공유 결합', elec: '× (움직일 수 있는 전하가 없다)', hard: '무르다',
        push: '분자 사이의 힘이 약해 쉽게 밀린다' },
      dia: { name: '공유 결정 (다이아몬드)', who: 'C 원자', force: '공유 결합이 그물처럼 이어짐', elec: '× (모든 전자가 결합에 묶여 있다)', hard: '매우 단단하다',
        push: '공유 결합을 끊어야 해서 거의 밀리지 않는다' },
      gra: { name: '공유 결정 (흑연)', who: 'C 원자', force: '층 안: 공유 결합 / 층 사이: 약한 힘', elec: '○ (층을 따라 움직이는 전자가 있다)', hard: '무르다(층이 미끄러진다)',
        push: '층 사이의 힘이 약해 층이 미끄러진다' },
      met: { name: '금속 결정 (구리)', who: 'Cu 양이온과 자유 전자', force: '금속 결합(양이온–자유 전자 인력)', elec: '○ (자유 전자가 이동한다)', hard: '펴지고 늘어난다(연성·전성)',
        push: '층이 밀려도 자유 전자가 붙잡아 준다 → 펴진다' },
    };
    var ORDER = ['ion', 'mol', 'dia', 'gra', 'met'];
    var MP = [
      { k: 'mol', name: '드라이아이스', v: -78, txt: '−78 (승화)' },
      { k: 'ion', name: '염화 나트륨', v: 801, txt: '801' },
      { k: 'met', name: '구리', v: 1085, txt: '1085' },
      { k: 'dia', name: '다이아몬드', v: 3500, txt: '3500 이상' },
      { k: 'gra', name: '흑연', v: 3600, txt: '약 3600 (승화)' },
    ];
    var st = { type: 'ion', slide: 0, target: 0, elec: false, t: 0 };

    // ── 구조 만들기 ──
    function add(arr, p, kind, top) { arr.push({ p: p, kind: kind, top: !!top }); }
    var S_ = {};
    (function () { // 이온 결정
      var a = [], d = 1.1;
      for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) for (var k = 0; k < 3; k++)
        add(a, [(i - 1) * d, (j - 1) * d, (k - 1) * d], (i + j + k) % 2 === 0 ? 'na' : 'cl', j === 2);
      S_.ion = { atoms: a, bonds: near(a, d * 1.01, true), shift: [d, 0, 0], lift: 0.45, inter: true };
    })();
    (function () { // 분자 결정: CO2
      var a = [], A = 2.7, mols = [], bonds = [];
      for (var x = 0; x <= 2; x++) for (var y = 0; y <= 2; y++) for (var z = 0; z <= 2; z++) {
        var odd = (x % 2) + (y % 2) + (z % 2);
        if (odd !== 0 && odd !== 2) continue;
        var c = [(x - 1) * A / 2, (y - 1) * A / 2, (z - 1) * A / 2];
        var dir = odd === 0 ? [1, 1, 1] : x % 2 === 0 ? [-1, -1, 1] : y % 2 === 0 ? [-1, 1, -1] : [1, -1, -1];
        var L = 0.42 / Math.sqrt(3), top = c[1] > 0.1;
        var i0 = a.length;
        add(a, c, 'c', top);
        add(a, [c[0] + dir[0] * L, c[1] + dir[1] * L, c[2] + dir[2] * L], 'o', top);
        add(a, [c[0] - dir[0] * L, c[1] - dir[1] * L, c[2] - dir[2] * L], 'o', top);
        bonds.push({ a: i0, b: i0 + 1, strong: true }, { a: i0, b: i0 + 2, strong: true });
        mols.push(i0);
      }
      for (var m = 0; m < mols.length; m++) for (var n = m + 1; n < mols.length; n++) {
        var p = a[mols[m]].p, q = a[mols[n]].p;
        if (Math.abs(dist(p, q) - A / Math.SQRT2) < 0.05) bonds.push({ a: mols[m], b: mols[n], weak: true });
      }
      S_.mol = { atoms: a, bonds: bonds, shift: [0.9, 0, 0], lift: 0, inter: true };
    })();
    (function () { // 다이아몬드
      var a = [], A = 1.75, base = [[0, 0, 0], [0, .5, .5], [.5, 0, .5], [.5, .5, 0]], seen = {};
      for (var i = -2; i <= 1; i++) for (var j = -2; j <= 1; j++) for (var k = -2; k <= 1; k++)
        base.forEach(function (b) {
          [[0, 0, 0], [.25, .25, .25]].forEach(function (o) {
            var p = [(i + b[0] + o[0]) * A + 0.22, (j + b[1] + o[1]) * A + 0.22, (k + b[2] + o[2]) * A + 0.22];
            if (Math.max(Math.abs(p[0]), Math.abs(p[1]), Math.abs(p[2])) > 1.55) return;
            var key = p.map(function (v) { return v.toFixed(2); }).join(); if (seen[key]) return; seen[key] = 1;
            add(a, p, 'C', false);
          });
        });
      var bl = A * Math.sqrt(3) / 4;
      S_.dia = { atoms: a, bonds: near(a, bl * 1.02), shift: [0, 0, 0], lift: 0, inter: false };
    })();
    (function () { // 흑연: 층 3장
      var a = [], b = 0.6, gap = 1.35, bonds = [];
      [-1, 0, 1].forEach(function (lay) {
        var off = lay === 0 ? b : 0, i0 = a.length;
        for (var i = -5; i <= 5; i++) for (var j = -5; j <= 5; j++) {
          var x0 = i * b * Math.sqrt(3) + j * b * Math.sqrt(3) / 2, z0 = j * b * 1.5;
          [[0, 0], [0, b]].forEach(function (o) {
            var x = x0 + o[0], z = z0 + o[1] + off;
            if (x * x + z * z > 2.0 * 2.0) return;
            add(a, [x, lay * gap, z], 'C', lay === 1);
          });
        }
        var sub = a.slice(i0), nb = near(sub, b * 1.02);
        nb.forEach(function (e) { bonds.push({ a: e.a + i0, b: e.b + i0 }); });
      });
      S_.gra = { atoms: a, bonds: bonds, shift: [b * Math.sqrt(3), 0, 0], lift: 0, inter: false, layers: [-gap, 0, gap] };
    })();
    (function () { // 금속: 조밀하게 쌓인 양이온 층 3장 + 자유 전자
      var a = [], d = 0.95, h = d * Math.sqrt(2 / 3);
      var offs = [[0, 0], [d / 2, d / (2 * Math.sqrt(3))], [d, d / Math.sqrt(3)]];
      [-1, 0, 1].forEach(function (lay, li) {
        for (var i = -4; i <= 4; i++) for (var j = -4; j <= 4; j++) {
          var x = i * d + j * d / 2 + offs[li][0] - d / 2, z = j * d * Math.sqrt(3) / 2 + offs[li][1] - d / 4;
          if (x * x + z * z > 1.95 * 1.95) continue;
          add(a, [x, lay * h * 1.15, z], 'cu', lay === 1);
        }
      });
      S_.met = { atoms: a, bonds: [], shift: [d, 0, 0], lift: 0, inter: false };
    })();
    function dist(p, q) { return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); }
    function near(a, r, weak) {
      var out = [];
      for (var i = 0; i < a.length; i++) for (var j = i + 1; j < a.length; j++) if (dist(a[i].p, a[j].p) < r) out.push({ a: i, b: j, weak: weak });
      return out;
    }
    // 자유 전자(금속), 층 전자(흑연)
    var elecs = [];
    for (var e = 0; e < 44; e++) elecs.push({ p: [Math.random() * 4 - 2, (Math.random() * 2 - 1) * 1.1, Math.random() * 3.4 - 1.7], v: [Math.random() - .5, Math.random() - .5, Math.random() - .5], lay: e % 3 - 1 });

    var rWho = api.readout('구성 입자'), rF = api.readout('입자를 묶는 힘'), rE = api.readout('고체의 전기 전도성'), rH = api.readout('굳기'), rP = api.readout('층을 밀면');

    var S = api.scene3d({
      yaw: 0.6, pitch: 0.38, dist: 11, scale: 0.15, label: '선택한 결정의 입체 모형',
      aspect: function (w) { return w < 560 ? 0.95 : 0.56; },
      draw: function (g, T) {
        var D = S_[st.type], s = st.slide;
        var shake = st.type === 'dia' && s > 0 ? Math.sin(st.t * 40) * 0.03 * (1 - Math.abs(2 * s - 1)) : 0;
        var pos = D.atoms.map(function (at) {
          if (!at.top) return at.p;
          var k = s;
          return [at.p[0] + D.shift[0] * k + shake, at.p[1] + D.lift * Math.max(0, s - 0.6) / 0.4, at.p[2] + D.shift[2] * k];
        });
        D.bonds.forEach(function (b) {
          var A = D.atoms[b.a], B = D.atoms[b.b];
          if (s > 0 && A.top !== B.top) return; // 미끄러지는 면을 가로지르는 선은 숨김
          if (b.weak) g.line(pos[b.a], pos[b.b], st.type === 'ion' ? T.figLine : T.figMuted, { width: st.type === 'ion' ? 1.2 : 1, dash: st.type === 'ion' ? null : [3, 4], alpha: 0.75 });
          else g.line(pos[b.a], pos[b.b], T.figInk, { width: b.strong ? 4 : 3 });
        });
        if (st.type === 'gra' && s === 0) { // 층 사이 약한 힘(점선)
          D.atoms.forEach(function (at, i) {
            if (at.p[1] !== 0 || i % 3) return;
            [-1, 1].forEach(function (sg) { g.line(at.p, [at.p[0], sg * 1.35 * 0.92, at.p[2]], T.figMuted, { width: 1, dash: [2, 4], alpha: 0.6 }); });
          });
        }
        D.atoms.forEach(function (at, i) {
          var p = pos[i];
          if (at.kind === 'na') g.sphere(p, 0.26, T.figAmber, { label: '+' });
          else if (at.kind === 'cl') g.sphere(p, 0.42, T.figGreen, { label: '−' });
          else if (at.kind === 'c') g.sphere(p, 0.17, T.figMuted);
          else if (at.kind === 'o') g.sphere(p, 0.2, T.figRed);
          else if (at.kind === 'C') g.sphere(p, st.type === 'dia' ? 0.17 : 0.13, st.type === 'dia' ? T.figBlue : T.figMuted);
          else if (at.kind === 'cu') g.sphere(p, 0.34, T.figAmber, { label: '+' });
        });
        if (st.type === 'ion' && s >= 1) { // 같은 전하끼리 반발
          D.atoms.forEach(function (at, i) {
            if (!at.top || at.p[2] !== 0) return;
            var q = pos[i];
            g.arrow([q[0], q[1] - 0.2, q[2]], [q[0], q[1] + 0.35, q[2]], T.figRed, { width: 2.5 });
          });
        }
        if (st.type === 'met' || st.type === 'gra') {
          elecs.forEach(function (el, i) {
            var p = el.p, y = st.type === 'gra' ? el.lay * 1.35 + 0.18 : p[1];
            var top = st.type === 'gra' ? el.lay === 1 : p[1] > 0.55;
            var x = p[0] + (top ? S_[st.type].shift[0] * s : 0);
            if (st.type === 'gra' && x * x + p[2] * p[2] > 4) return;
            g.sphere([x, y, p[2]], 0.08, T.figBlue, { flat: true, alpha: 0.9 });
          });
        }
        if (st.elec) {
          g.text([-2.9, 0, 0], '−', { size: 22, bold: true, color: T.figBlue });
          g.text([2.9, 0, 0], '+', { size: 22, bold: true, color: T.figRed });
          var flows = st.type === 'met' || st.type === 'gra';
          g.arrow([-1.6, -2.1, 0], [1.6, -2.1, 0], flows ? T.figBlue : T.figLine, { width: 2.5 });
          g.text([0, -2.45, 0], flows ? '전자가 + 쪽으로 이동 → 전류가 흐른다' : '움직일 수 있는 전하가 없다 → 전류 ×', { size: 12, color: flows ? T.figBlue : T.figMuted });
        }
      },
    });

    var g1 = api.group();
    var tb = ORDER.map(function (k, i) { return api.button(K[k].name, function () { pick(k); }, { toggle: true, pressed: i === 0, parent: g1 }); });
    var g2 = api.group();
    var pushBtn = api.button('층 밀어 보기', function () { st.target = st.target ? 0 : 1; if (api.reduced) st.slide = st.target; pushBtn.textContent = st.target ? '처음 배열로' : '층 밀어 보기'; S.redraw(); readouts(); }, { primary: true, parent: g2 });
    var eBtn = api.button('전압 걸어 보기', function () { st.elec = !st.elec; eBtn.setAttribute('aria-pressed', st.elec ? 'true' : 'false'); S.redraw(); }, { toggle: true, parent: g2 });

    function pick(k) {
      st.type = k; st.slide = 0; st.target = 0; pushBtn.textContent = '층 밀어 보기';
      tb.forEach(function (b, i) { b.setAttribute('aria-pressed', ORDER[i] === k ? 'true' : 'false'); });
      readouts(); S.redraw(); drawBars();
    }
    function readouts() {
      var k = K[st.type];
      rWho.set(k.who); rF.set(k.force); rE.set(k.elec); rH.set(k.hard);
      rP.set(st.target ? k.push : '“층 밀어 보기”를 눌러 보자');
    }
    if (!api.reduced) {
      S.onFrame(function (dt) {
        st.t += dt;
        if (st.slide !== st.target) {
          var dir = st.target > st.slide ? 1 : -1;
          st.slide = Math.max(0, Math.min(1, st.slide + dir * dt * 0.8));
          if ((dir > 0 && st.slide >= st.target) || (dir < 0 && st.slide <= st.target)) st.slide = st.target;
        }
        var drift = st.elec ? 1.1 : 0;
        elecs.forEach(function (el) {
          if (Math.random() < 0.05) el.v = [Math.random() - .5, Math.random() - .5, Math.random() - .5];
          el.p[0] += (el.v[0] * 1.6 + drift) * dt; el.p[1] += el.v[1] * 1.6 * dt; el.p[2] += el.v[2] * 1.6 * dt;
          if (el.p[0] > 2) el.p[0] -= 4; if (el.p[0] < -2) el.p[0] += 4;
          if (Math.abs(el.p[1]) > 1.1) el.v[1] = -el.v[1];
          if (Math.abs(el.p[2]) > 1.7) el.v[2] = -el.v[2];
        });
      });
    }

    // ── 녹는점 비교 막대 ──
    var bc = api.canvas({ aspect: function (w) { return w < 560 ? 0.6 : 0.2; }, label: '네 가지 결정의 녹는점 비교 막대그래프' });
    function drawBars() {
      var T = api.tokens(), c = bc.ctx, w = bc.w, h = bc.h, narrow = w < 560;
      c.clearRect(0, 0, w, h);
      c.fillStyle = T.figInk; c.font = '600 12px ' + T.fontBody; c.textAlign = 'left';
      c.fillText('녹는점 비교 (°C, 1 atm, 약)', 4, 14);
      var top = 24, rowH = (h - top - 4) / MP.length, labW = narrow ? 92 : 120, valW = narrow ? 92 : 110;
      var x0 = labW, x1 = w - valW, sx = function (v) { return x0 + (Math.max(v, 0) / 3700) * (x1 - x0); };
      MP.forEach(function (m, i) {
        var y = top + i * rowH, cur = m.k === st.type, bh = Math.min(16, rowH * 0.6);
        c.font = (cur ? '600 ' : '') + '12px ' + T.fontBody; c.fillStyle = cur ? T.figInk : T.figMuted; c.textAlign = 'left';
        c.fillText(m.name, 4, y + rowH / 2 + 4);
        c.fillStyle = cur ? T.figAccent : T.figLine;
        c.fillRect(x0, y + (rowH - bh) / 2, Math.max(3, sx(m.v) - x0), bh);
        c.fillStyle = cur ? T.figInk : T.figMuted;
        c.fillText(m.txt, sx(m.v) + 6, y + rowH / 2 + 4);
      });
    }
    api.onResize(drawBars);
    readouts(); drawBars();
  },
});
