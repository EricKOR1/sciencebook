/* 화학 1 화학의 언어: 몰을 중심으로 입자 수·질량·기체 부피를 함께 바꾸는 몰 변환기 + 2H₂ + O₂ → 2H₂O의 한계 반응물 */
Sims.register('mole-converter', {
  title: '몰 변환기 — 몰수 하나로 입자 수·질량·부피가 함께 정해진다',
  caption: '‘몰 변환기’에서 물질을 고르고 몰수를 바꾸어 보자. 입자 수(몰수 × 6.02×10²³), 질량(몰수 × 몰질량), 기체 부피(몰수 × 22.4 L)가 모두 몰수에 비례해 함께 변한다. 같은 몰수라도 질량은 물질마다 다르지만, 기체의 부피는 종류와 관계없이 같다. ‘한계 반응물’에서는 2H₂ + O₂ → 2H₂O에서 두 반응물의 몰수를 바꾸면, 먼저 다 쓰이는 반응물이 생성되는 물의 양을 정한다. 원자량은 H = 1, C = 12, O = 16의 어림값, 기체 부피는 0 °C, 1 atm 기준이며, 입자 그림의 분자 하나는 실제로는 엄청나게 많은 분자의 묶음(몰 변환기 0.1 mol, 한계 반응물 0.25 mol)을 뜻한다.',
  init: function (api) {
    var NA = 6.02;   // ×10²³
    var subs = [
      { key: 'h2o', name: '물', f: 'H₂O', M: 18, gas: false, atoms: ['O', 'H', 'H'] },
      { key: 'co2', name: '이산화 탄소', f: 'CO₂', M: 44, gas: true, atoms: ['C', 'O', 'O'] },
      { key: 'o2', name: '산소', f: 'O₂', M: 32, gas: true, atoms: ['O', 'O'] },
      { key: 'ch4', name: '메테인', f: 'CH₄', M: 16, gas: true, atoms: ['C', 'H', 'H', 'H', 'H'] },
      { key: 'h2', name: '수소', f: 'H₂', M: 2, gas: true, atoms: ['H', 'H'] },
    ];
    var NMAX = 3, MMAX = NMAX * 44, VMAX = NMAX * 22.4;
    var state = { tab: 'conv', sub: subs[1], n: 1, h2: 3, o2: 1 };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.75 : 0.52; }, label: '몰수에 따른 입자 수, 질량, 기체 부피 그림과 한계 반응물 입자 모형' });
    var ctx = cv.ctx;

    // 읽음값: 탭마다 따로 만들고 보이기/숨기기
    function ro(label) { var r = api.readout(label); r.el = api.readouts.lastChild; return r; }
    var rConv = { n: ro('몰수'), p: ro('입자 수'), m: ro('질량'), v: ro('기체 부피 (0 °C, 1 atm)') };
    var rLim = { lim: ro('한계 반응물'), w: ro('생성된 H₂O'), left: ro('남는 반응물'), mass: ro('질량 보존') };

    var tabs = api.group();
    var bConv = api.button('몰 변환기', function () { setTab('conv'); }, { toggle: true, pressed: true, parent: tabs });
    var bLim = api.button('한계 반응물', function () { setTab('lim'); }, { toggle: true, parent: tabs });

    var gConv = api.group();
    var gSub = api.group(gConv);
    var subBtns = subs.map(function (s) {
      return api.button(s.name + ' ' + s.f, function () { state.sub = s; syncSub(); update(); }, { toggle: true, pressed: s === state.sub, parent: gSub });
    });
    api.slider({ id: 'mole-converter-n', label: '몰수', min: 0.1, max: NMAX, step: 0.1, value: state.n, parent: gConv,
      format: function (v) { return v.toFixed(1) + ' mol'; }, onInput: function (v) { state.n = Math.round(v * 10) / 10; update(); } });

    var gLim = api.group();
    api.slider({ id: 'mole-converter-h2', label: '수소 H₂', min: 0, max: 4, step: 0.5, value: state.h2, parent: gLim,
      format: function (v) { return v.toFixed(1) + ' mol'; }, onInput: function (v) { state.h2 = v; update(); } });
    api.slider({ id: 'mole-converter-o2', label: '산소 O₂', min: 0, max: 3, step: 0.5, value: state.o2, parent: gLim,
      format: function (v) { return v.toFixed(1) + ' mol'; }, onInput: function (v) { state.o2 = v; update(); } });

    function setTab(t) {
      state.tab = t;
      bConv.setAttribute('aria-pressed', t === 'conv' ? 'true' : 'false');
      bLim.setAttribute('aria-pressed', t === 'lim' ? 'true' : 'false');
      gConv.style.display = t === 'conv' ? '' : 'none';
      gLim.style.display = t === 'lim' ? '' : 'none';
      Object.keys(rConv).forEach(function (k) { rConv[k].el.style.display = t === 'conv' ? '' : 'none'; });
      Object.keys(rLim).forEach(function (k) { rLim[k].el.style.display = t === 'lim' ? '' : 'none'; });
      update();
    }
    function syncSub() { subBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', subs[i] === state.sub ? 'true' : 'false'); }); }

    var SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
    function sci(x) {   // x를 a.bc×10ⁿ 꼴로
      if (x === 0) return '0';
      var e = Math.floor(Math.log10(x)), a = x / Math.pow(10, e);
      if (a >= 9.995) { a /= 10; e += 1; }
      return a.toFixed(2) + '×10' + String(e).split('').map(function (c) { return SUP[c]; }).join('');
    }
    function num(x, d) { return (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toString(); }
    function lim() {
      var h = state.h2, o = state.o2, ext = Math.min(h / 2, o);   // 반응 진행 정도(mol): O₂가 ext만큼 반응
      return { ext: ext, h2Left: h - 2 * ext, o2Left: o - ext, w: 2 * ext };
    }

    function update() {
      if (state.tab === 'conv') {
        var s = state.sub, n = state.n;
        rConv.n.set(n.toFixed(1) + ' mol');
        rConv.p.set(sci(n * NA * 1e23) + '개');
        rConv.m.set(num(n * s.M, 1) + ' g');
        rConv.v.set(s.gas ? num(n * 22.4, 2) + ' L' : '기체가 아님 (액체 약 ' + num(n * 18, 1) + ' mL)');
      } else {
        var L = lim();
        var who = state.h2 === 0 || state.o2 === 0 ? '반응물이 하나뿐 — 반응 없음'
          : Math.abs(state.h2 / 2 - state.o2) < 1e-9 ? '없음 (계수비 2 : 1로 딱 맞음)'
          : state.h2 / 2 < state.o2 ? '수소 H₂' : '산소 O₂';
        rLim.lim.set(who);
        rLim.w.set(num(L.w, 2) + ' mol = ' + num(L.w * 18, 1) + ' g');
        rLim.left.set(L.h2Left > 1e-9 ? 'H₂ ' + num(L.h2Left, 2) + ' mol (' + num(L.h2Left * 2, 1) + ' g)'
          : L.o2Left > 1e-9 ? 'O₂ ' + num(L.o2Left, 2) + ' mol (' + num(L.o2Left * 32, 1) + ' g)' : '없음');
        var before = state.h2 * 2 + state.o2 * 32;
        rLim.mass.set('반응 전 ' + num(before, 1) + ' g = 반응 후 ' + num(L.w * 18 + L.h2Left * 2 + L.o2Left * 32, 1) + ' g');
      }
      draw();
    }

    function atomColor(T, a) { return a === 'H' ? T.figPanel : a === 'O' ? T.figRed : T.figInk; }
    function atomStroke(T, a) { return a === 'H' ? T.figMuted : a === 'O' ? T.figRed : T.figInk; }
    // 분자 아이콘(모식). fit: 아이콘이 들어갈 폭(px)
    function molecule(T, atoms, x, y, fit, alpha) {
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      var wf = atoms.length === 2 ? (atoms[0] === 'H' ? 1.0 : 1.36) : atoms[0] === 'C' && atoms.length === 3 ? 1.85 : atoms[0] === 'O' ? 1.3 : 1.25;
      var s = fit / wf;
      var big = s * 0.42, small = s * 0.28, pts = [];
      var c = atoms[0], rest = atoms.slice(1);
      if (atoms.length === 2) pts = [[-big * 0.62, 0, atoms[0]], [big * 0.62, 0, atoms[1]]];
      else if (c === 'C' && rest.length === 2) pts = [[-big * 1.15, 0, 'O'], [big * 1.15, 0, 'O'], [0, 0, 'C']];
      else if (c === 'O') pts = [[-small * 1.3, small * 0.95, 'H'], [small * 1.3, small * 0.95, 'H'], [0, -small * 0.15, 'O']];
      else pts = [[-small * 1.25, -small * 1.0, 'H'], [small * 1.25, -small * 1.0, 'H'], [-small * 1.25, small * 1.0, 'H'], [small * 1.25, small * 1.0, 'H'], [0, 0, 'C']];
      pts.forEach(function (p) {
        var r = p[2] === 'H' ? small : big * (p[2] === 'C' && atoms.length === 3 ? 0.95 : 1);
        ctx.beginPath(); ctx.arc(x + p[0], y + p[1], r, 0, Math.PI * 2);
        ctx.fillStyle = atomColor(T, p[2]); ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = atomStroke(T, p[2]); ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
    function label(T, txt, x, y, o) {
      o = o || {};
      ctx.fillStyle = o.color || T.figInk; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'alphabetic';
      ctx.font = (o.bold ? '600 ' : '') + (o.size || 12) + 'px ' + (o.mono ? T.fontMono : T.fontBody);
      ctx.fillText(txt, x, y);
    }
    function box(T, x, y, w, h, fill, stroke) {
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fillStyle = fill; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = stroke || T.figLine; ctx.stroke();
    }

    function draw() {
      var T = api.tokens();
      ctx.clearRect(0, 0, cv.w, cv.h);
      if (state.tab === 'conv') drawConv(T); else drawLim(T);
    }

    function drawConv(T) {
      var w = cv.w, h = cv.h, narrow = w < 560, s = state.sub, n = state.n;
      var top = 34;
      label(T, s.name + ' ' + s.f + '  ' + n.toFixed(1) + ' mol', w / 2, 20, { bold: true, size: 14 });
      var P;
      if (narrow) {
        var ph = (h - top) / 3;
        P = [{ x: 0, y: top, w: w, h: ph }, { x: 0, y: top + ph, w: w, h: ph }, { x: 0, y: top + 2 * ph, w: w, h: ph }];
      } else {
        var pw = w / 3;
        P = [{ x: 0, y: top, w: pw, h: h - top }, { x: pw, y: top, w: pw, h: h - top }, { x: 2 * pw, y: top, w: pw, h: h - top }];
      }
      P.forEach(function (r) { box(T, r.x + 6, r.y + 4, r.w - 12, r.h - 10, T.figPaper, T.rule); });
      // ① 입자 수: 분자 아이콘 1개 = 0.1 mol
      var r = P[0], k = Math.round(n * 10), cols = narrow ? 10 : 6, rows = narrow ? 3 : 5;
      label(T, '입자 수 = 몰수 × 6.02×10²³', r.x + r.w / 2, r.y + 24, { bold: true, color: T.figAccent });
      var gx = r.x + 18, gy = r.y + 36, gw = r.w - 36, gh = r.h - 36 - 46;
      var cell = Math.min(gw / cols, gh / rows), ox = r.x + (r.w - cell * cols) / 2;
      for (var i = 0; i < cols * rows; i++) {
        var cx = ox + (i % cols + 0.5) * cell, cy = gy + (Math.floor(i / cols) + 0.5) * cell;
        if (i < k) molecule(T, s.atoms, cx, cy, cell * 0.86);
        else { ctx.beginPath(); ctx.arc(cx, cy, cell * 0.08, 0, Math.PI * 2); ctx.fillStyle = T.figLine; ctx.fill(); }
      }
      label(T, sci(n * NA * 1e23) + '개', r.x + r.w / 2, r.y + r.h - 28, { bold: true, size: 14 });
      label(T, '그림 1개 = 0.1 mol = 6.02×10²²개', r.x + r.w / 2, r.y + r.h - 12, { size: 11, color: T.figMuted });

      // ② 질량: 막대(같은 몰수에서 물질별 질량 비교)
      r = P[1];
      label(T, '질량 = 몰수 × 몰질량(' + s.M + ' g/mol)', r.x + r.w / 2, r.y + 24, { bold: true, color: T.figAccent });
      var bx = r.x + 30, bw = r.w - 60, by = r.y + 40, bh = r.h - 40 - 46;
      var rowH = bh / subs.length;
      subs.forEach(function (o, j) {
        var yy = by + j * rowH, me = o === s, len = (n * o.M / MMAX) * (bw - 70);
        label(T, o.f, bx + 22, yy + rowH * 0.62, { align: 'right', size: 12, color: me ? T.figInk : T.figMuted, bold: me });
        box(T, bx + 28, yy + rowH * 0.2, Math.max(len, 1), rowH * 0.6, me ? T.figAmber : T.figSoftAmber, me ? T.figAmber : T.figLine);
        label(T, num(n * o.M, 1) + ' g', bx + 32 + Math.max(len, 1), yy + rowH * 0.62, { align: 'left', size: 11, color: me ? T.figInk : T.figMuted, mono: true });
      });
      label(T, num(n * s.M, 1) + ' g', r.x + r.w / 2, r.y + r.h - 28, { bold: true, size: 14 });
      label(T, '같은 몰수라도 몰질량에 따라 다르다', r.x + r.w / 2, r.y + r.h - 12, { size: 11, color: T.figMuted });

      // ③ 기체 부피: 22.4 L 상자 단위로 채우기
      r = P[2];
      label(T, '기체 부피 = 몰수 × 22.4 L', r.x + r.w / 2, r.y + 24, { bold: true, color: T.figAccent });
      var vy = r.y + 40, vh = r.h - 40 - 46;
      var side = Math.min((r.w - 48) / 3.4, vh * 0.72), gap = side * 0.2;
      var x0 = r.x + (r.w - (3 * side + 2 * gap)) / 2, y0 = vy + (vh - side - 16) / 2;
      for (var b = 0; b < 3; b++) {
        var xb = x0 + b * (side + gap), fill = Math.max(0, Math.min(1, n - b));
        box(T, xb, y0, side, side, T.figPanel, T.figLine);
        if (s.gas && fill > 0) {
          ctx.globalAlpha = 0.9; ctx.fillStyle = T.figSoftBlue; ctx.fillRect(xb + 1, y0 + side * (1 - fill), side - 2, side * fill - 1); ctx.globalAlpha = 1;
          ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1.5; ctx.strokeRect(xb + 1, y0 + side * (1 - fill), side - 2, side * fill - 1);
        }
        label(T, '22.4 L', xb + side / 2, y0 + side + 14, { size: 11, color: T.figMuted });
      }
      if (s.gas) {
        label(T, num(n * 22.4, 2) + ' L', r.x + r.w / 2, r.y + r.h - 28, { bold: true, size: 14 });
        label(T, '기체라면 종류와 관계없이 같다', r.x + r.w / 2, r.y + r.h - 12, { size: 11, color: T.figMuted });
      } else {
        // 물: 기체가 아니다 — 작은 물방울 크기로 비교
        var dropV = n * 18 / 22400, dropSide = side * Math.cbrt(dropV);
        ctx.fillStyle = T.figBlue; ctx.fillRect(x0 + side / 2 - dropSide / 2, y0 + side - dropSide - 2, Math.max(dropSide, 2), Math.max(dropSide, 2));
        label(T, '액체 약 ' + num(n * 18, 1) + ' mL', r.x + r.w / 2, r.y + r.h - 28, { bold: true, size: 14, color: T.figRed });
        label(T, '22.4 L/mol은 기체에만 쓴다', r.x + r.w / 2, r.y + r.h - 12, { size: 11, color: T.figMuted });
      }
    }

    function drawLim(T) {
      var w = cv.w, h = cv.h, narrow = w < 560, L = lim();
      var UNIT = 0.25;   // 그림 분자 1개 = 0.25 mol
      label(T, '2H₂ + O₂ → 2H₂O   (계수비 = 몰수비 2 : 1 : 2)', w / 2, 20, { bold: true, size: 14 });
      var top = 32, pic, bars;
      if (narrow) { var hh = (h - top) * 0.62; pic = { x: 0, y: top, w: w, h: hh }; bars = { x: 0, y: top + hh, w: w, h: h - top - hh }; }
      else { pic = { x: 0, y: top, w: w * 0.6, h: h - top }; bars = { x: w * 0.6, y: top, w: w * 0.4, h: h - top }; }
      // 반응 전·후 상자
      var two = narrow ? [{ x: pic.x + 6, y: pic.y + 4, w: pic.w - 12, h: pic.h / 2 - 8 }, { x: pic.x + 6, y: pic.y + pic.h / 2 + 2, w: pic.w - 12, h: pic.h / 2 - 8 }]
        : [{ x: pic.x + 6, y: pic.y + 4, w: pic.w / 2 - 22, h: pic.h - 10 }, { x: pic.x + pic.w / 2 + 16, y: pic.y + 4, w: pic.w / 2 - 22, h: pic.h - 10 }];
      var lists = [
        { title: '반응 전', items: [{ a: ['H', 'H'], n: Math.round(state.h2 / UNIT) }, { a: ['O', 'O'], n: Math.round(state.o2 / UNIT) }] },
        { title: '반응 후', items: [{ a: ['O', 'H', 'H'], n: Math.round(L.w / UNIT) }, { a: ['H', 'H'], n: Math.round(L.h2Left / UNIT), left: true }, { a: ['O', 'O'], n: Math.round(L.o2Left / UNIT), left: true }] },
      ];
      two.forEach(function (r, bi) {
        box(T, r.x, r.y, r.w, r.h, T.figPaper, T.figLine);
        label(T, lists[bi].title, r.x + 10, r.y + 18, { align: 'left', bold: true });
        var all = [];
        lists[bi].items.forEach(function (it) { for (var i = 0; i < it.n; i++) all.push(it); });
        var cols = narrow ? 11 : 6, cell = Math.min((r.w - 20) / cols, (r.h - 34) / Math.max(1, Math.ceil(28 / cols)));
        cell = Math.min(cell, 30);
        cols = Math.max(1, Math.floor((r.w - 20) / cell));
        all.forEach(function (it, i) {
          var cx = r.x + 10 + (i % cols + 0.5) * cell, cy = r.y + 30 + (Math.floor(i / cols) + 0.5) * cell;
          if (it.left) { ctx.beginPath(); ctx.arc(cx, cy, cell * 0.46, 0, Math.PI * 2); ctx.fillStyle = T.figSoftAmber; ctx.fill(); }
          molecule(T, it.a, cx, cy, cell * 0.84);
        });
        if (!all.length) label(T, '(없음)', r.x + r.w / 2, r.y + r.h / 2, { color: T.figMuted });
      });
      if (!narrow) {
        var ax = pic.x + pic.w / 2 - 12, ay = pic.y + pic.h / 2;
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + 22, ay); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax + 26, ay); ctx.lineTo(ax + 18, ay - 5); ctx.lineTo(ax + 18, ay + 5); ctx.closePath(); ctx.fillStyle = T.figInk; ctx.fill();
      }
      // 막대: 반응 전·후 몰수
      var r = bars, bx = r.x + 16, bw = r.w - 32;
      var data = [
        { f: 'H₂', b: state.h2, a: L.h2Left, c: T.figBlue, sc: T.figSoftBlue },
        { f: 'O₂', b: state.o2, a: L.o2Left, c: T.figRed, sc: T.figSoftRed },
        { f: 'H₂O', b: 0, a: L.w, c: T.figGreen, sc: T.figSoftGreen },
      ];
      label(T, '몰수 막대 (옅은 색: 반응 전, 진한 색: 반응 후)', r.x + r.w / 2, r.y + 18, { size: 11, color: T.figMuted });
      var maxN = 4, lx = bx + 40, lw = bw - 40 - 46, rowH = Math.min(46, (r.h - 70) / 3);
      data.forEach(function (d, i) {
        var y = r.y + 32 + i * rowH;
        label(T, d.f, lx - 8, y + rowH * 0.55, { align: 'right', bold: true });
        box(T, lx, y + rowH * 0.1, Math.max(1, lw * d.b / maxN), rowH * 0.36, d.sc, d.c);
        box(T, lx, y + rowH * 0.5, Math.max(1, lw * d.a / maxN), rowH * 0.36, d.c, d.c);
        label(T, num(d.b, 2) + ' → ' + num(d.a, 2), lx + lw + 44, y + rowH * 0.6, { align: 'right', size: 11, mono: true });
      });
      var y2 = r.y + 32 + 3 * rowH + 18;
      var ratio = state.h2 === 0 || state.o2 === 0 ? '' : '몰수 ÷ 계수: H₂ ' + num(state.h2 / 2, 2) + ', O₂ ' + num(state.o2, 2) + ' → 작은 쪽이 한계';
      label(T, ratio, r.x + r.w / 2, y2, { size: 11, color: T.figAccent, bold: true });
      label(T, '노란 바탕: 남은 반응물 · 그림 1개 = 0.25 mol', r.x + r.w / 2, y2 + 16, { size: 11, color: T.figMuted });
    }

    api.onResize(draw);
    setTab('conv');
  },
});
