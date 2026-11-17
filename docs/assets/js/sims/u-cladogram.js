/* 일반생명과학 9 생물 다양성(탐구 활동 B): 형질 행렬로 분기도 만들기 — 공유 파생 형질을 하나씩 넣어 무리를 묶고, 조상 형질·상사 형질이 왜 쓸모없거나 충돌하는지 확인 */
Sims.register('u-cladogram', {
  title: '형질 행렬로 분기도 만들기 — 공유 파생 형질로 묶어 가기',
  caption: '식물 또는 동물을 고르고 형질 단추를 하나씩 눌러 보자. 외군에 없고 내군 일부에만 있는 형질(공유 파생 형질)은 그 형질을 가진 생물을 한 무리(분기군)로 묶어 분기점을 하나 만들고, 형질이 생긴 가지에 번호가 표시된다. 외군까지 모두 가진 형질(조상 형질)은 무리를 나누지 못하고, 한 생물에만 있는 형질은 그 끝 가지에만 표시된다. 동물의 ‘성체의 방사 대칭’은 해파리와 불가사리를 묶으려 해서 다른 형질이 만든 무리와 충돌한다 — 따로 생긴 닮음(상사)이기 때문이다. 동물에서 지렁이·메뚜기·후구동물이 한 점에서 갈라지는 것(다분기)은 이 다섯 형질만으로는 순서를 정할 수 없다는 뜻이다. 형질은 탐구 활동 B의 목록을 따른 단순화이다.',
  init: function (api) {
    var DATA = {
      plant: {
        taxa: ['차축조류', '솔이끼', '석송', '고사리', '소나무', '벼'],
        traits: [
          ['배', [0, 1, 1, 1, 1, 1]], ['관다발', [0, 0, 1, 1, 1, 1]], ['큰 잎', [0, 0, 0, 1, 1, 1]],
          ['종자', [0, 0, 0, 0, 1, 1]], ['꽃과 열매', [0, 0, 0, 0, 0, 1]], ['엽록체(광합성)', [1, 1, 1, 1, 1, 1]],
        ],
      },
      animal: {
        taxa: ['해면', '해파리', '지렁이', '메뚜기', '불가사리', '고등어'],
        traits: [
          ['진정한 조직', [0, 1, 1, 1, 1, 1]], ['좌우 대칭(배아·유생)', [0, 0, 1, 1, 1, 1]], ['탈피', [0, 0, 0, 1, 0, 0]],
          ['원구가 항문', [0, 0, 0, 0, 1, 1]], ['척삭', [0, 0, 0, 0, 0, 1]], ['성체의 방사 대칭', [0, 1, 0, 0, 1, 0]],
        ],
      },
    };
    var NUM = ['①', '②', '③', '④', '⑤', '⑥'];
    var st = { set: 'plant', on: [], msg: '형질 단추를 눌러 무리를 묶어 보자', msgKind: 'info' };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.4 : 0.5; }, label: '형질 행렬과 그것으로 만든 분기도' });
    var ctx = cv.ctx;

    var rN = api.readout('분기점 수');
    var rMsg = api.readout('판정');

    var g1 = api.group();
    var setBtns = [['plant', '식물'], ['animal', '동물']].map(function (d, i) {
      return api.button(d[1], function () { st.set = d[0]; st.on = []; st.msg = '형질 단추를 눌러 무리를 묶어 보자'; st.msgKind = 'info'; sync(); relabel(); draw(); }, { toggle: true, pressed: i === 0, parent: g1 });
    });
    var g2 = api.group();
    var trBtns = NUM.map(function (n, i) {
      return api.button(n, function () { toggle(i); }, { toggle: true, pressed: false, parent: g2 });
    });
    api.button('모두 지우기', function () { st.on = []; st.msg = '형질 단추를 눌러 무리를 묶어 보자'; st.msgKind = 'info'; sync(); draw(); });

    function D() { return DATA[st.set]; }
    function relabel() { trBtns.forEach(function (b, i) { b.textContent = NUM[i] + ' ' + D().traits[i][0]; }); }
    function sync() {
      setBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', (i === 0) === (st.set === 'plant') ? 'true' : 'false'); });
      trBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', st.on.indexOf(i) >= 0 ? 'true' : 'false'); });
    }
    function members(i) { var v = D().traits[i][1], r = []; v.forEach(function (x, k) { if (x) r.push(k); }); return r; }
    function kind(i) {
      var m = members(i), n = D().taxa.length;
      if (m.length === n) return 'anc';
      if (m.length === 1) return 'auto';
      return 'clade';
    }
    function compatible(a, b) {
      var A = members(a), B = members(b), inter = A.filter(function (x) { return B.indexOf(x) >= 0; });
      return inter.length === 0 || inter.length === A.length || inter.length === B.length;
    }
    function toggle(i) {
      var k = st.on.indexOf(i);
      if (k >= 0) { st.on.splice(k, 1); st.msg = NUM[i] + ' 형질을 뺐다'; st.msgKind = 'info'; sync(); draw(); return; }
      var tn = D().traits[i][0];
      if (kind(i) === 'anc') { st.on.push(i); st.msg = tn + ': 외군도 가진 조상 형질 → 무리를 나누지 못함'; st.msgKind = 'warn'; }
      else if (kind(i) === 'auto') { st.on.push(i); st.msg = tn + ': 한 생물에만 있음 → 끝 가지에만 표시'; st.msgKind = 'info'; }
      else {
        var bad = st.on.filter(function (j) { return kind(j) === 'clade' && !compatible(i, j); });
        if (bad.length) { st.msg = tn + '은(는) ' + bad.map(function (j) { return NUM[j]; }).join(', ') + '이 만든 무리와 충돌 → 상사 형질로 보고 넣지 않음'; st.msgKind = 'bad'; }
        else { st.on.push(i); st.msg = tn + ': ' + members(i).map(function (x) { return D().taxa[x]; }).join('·') + '을(를) 한 무리로 묶음'; st.msgKind = 'good'; }
      }
      sync(); draw();
    }
    // 나무 만들기
    function build() {
      var n = D().taxa.length, all = [];
      for (var i = 0; i < n; i++) all.push(i);
      var clades = st.on.filter(function (j) { return kind(j) === 'clade'; }).map(function (j) { return { trait: j, m: members(j) }; });
      function within(S, C) { return C.m.length < S.length && C.m.every(function (x) { return S.indexOf(x) >= 0; }); }
      function node(S, trait) {
        var inside = clades.filter(function (C) { return within(S, C); });
        var top = inside.filter(function (C) { return !inside.some(function (D2) { return D2 !== C && within(D2.m, C); }); });
        var used = []; top.forEach(function (C) { used = used.concat(C.m); });
        var kids = S.filter(function (x) { return used.indexOf(x) < 0; }).map(function (x) { return { tip: x }; });
        top.sort(function (a, b) { return Math.min.apply(null, a.m) - Math.min.apply(null, b.m); });
        top.forEach(function (C) { kids.push(node(C.m, C.trait)); });
        return { kids: kids, trait: trait, m: S };
      }
      return node(all, null);
    }
    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { mat: { x: 0, y: 0, w: w, h: h * 0.42 }, tree: { x: 0, y: h * 0.44, w: w, h: h * 0.56 } };
      return { mat: { x: 0, y: 0, w: w * 0.42, h: h }, tree: { x: w * 0.44, y: 0, w: w * 0.56, h: h } };
    }
    function draw() {
      var T = api.tokens(), P = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawMatrix(T, P.mat); var nodes = drawTree(T, P.tree);
      rN.set(nodes + '개');
      rMsg.set(st.msg);
    }
    function drawMatrix(T, r) {
      var d = D(), nT = d.taxa.length, nC = d.traits.length;
      var nameW = 70, cw = Math.min(40, (r.w - nameW - 12) / nC), rh = Math.min(30, (r.h - 40) / (nT + 1));
      var x0 = r.x + 8 + nameW, y0 = r.y + 12;
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillStyle = T.figInk;
      for (var c = 0; c < nC; c++) {
        var on = st.on.indexOf(c) >= 0;
        if (on) { ctx.fillStyle = T.figSoftBlue; ctx.fillRect(x0 + c * cw + 1, y0, cw - 2, rh * (nT + 1)); }
        ctx.fillStyle = on ? T.figAccent : T.figInk; ctx.fillText(NUM[c], x0 + c * cw + cw / 2, y0 + rh * 0.68);
      }
      for (var t = 0; t < nT; t++) {
        var y = y0 + rh * (t + 1);
        ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(r.x + 8, y); ctx.lineTo(x0 + nC * cw, y); ctx.stroke();
        ctx.textAlign = 'left'; ctx.font = (t === 0 ? '600 ' : '') + '12px ' + T.fontBody; ctx.fillStyle = t === 0 ? T.figMuted : T.figInk;
        ctx.fillText(d.taxa[t], r.x + 8, y + rh * 0.66);
        for (var c2 = 0; c2 < nC; c2++) {
          var v = d.traits[c2][1][t];
          if (v) { ctx.fillStyle = T.figSoftGreen; ctx.fillRect(x0 + c2 * cw + 5, y + 4, cw - 10, rh - 8); }
          ctx.fillStyle = v ? T.figGreen : T.figMuted; ctx.font = (v ? '600 ' : '') + '12px ' + T.fontMono; ctx.textAlign = 'center';
          ctx.fillText(v ? '1' : '0', x0 + c2 * cw + cw / 2, y + rh * 0.66);
        }
      }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('첫 줄은 외군. 1 = 있음, 0 = 없음', r.x + 8, y0 + rh * (nT + 1) + 16);
    }
    function drawTree(T, r) {
      var d = D(), root = build(), nT = d.taxa.length;
      var maxDepth = 0;
      (function dep(n, k) { n.depth = k; if (n.kids) { maxDepth = Math.max(maxDepth, k); n.kids.forEach(function (c) { dep(c, k + 1); }); } })(root, 0);
      var nameW = 100, L = r.x + 28, R = r.x + r.w - nameW - 8, Tp = r.y + 34, B = r.y + r.h - 34;
      var dx = (R - L) / (maxDepth + 1), tipY = (B - Tp) / (nT - 1), order = 0, nodes = 0;
      (function place(n) {
        if (n.tip != null) { n.x = R; n.y = Tp + tipY * order++; return; }
        nodes++;
        n.x = L + dx * n.depth;
        n.kids.forEach(place);
        n.y = (n.kids[0].y + n.kids[n.kids.length - 1].y) / 2;
      })(root);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(root.x - 18, root.y); ctx.lineTo(root.x, root.y); ctx.stroke();
      var marks = [];
      (function edges(n) {
        if (!n.kids) return;
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(n.x, n.kids[0].y); ctx.lineTo(n.x, n.kids[n.kids.length - 1].y); ctx.stroke();
        n.kids.forEach(function (c) {
          ctx.beginPath(); ctx.moveTo(n.x, c.y); ctx.lineTo(c.x, c.y); ctx.stroke();
          if (c.trait != null) marks.push({ x: (n.x + c.x) / 2, y: c.y, t: c.trait, col: T.figAccent });
          if (c.tip != null) st.on.forEach(function (j) { if (kind(j) === 'auto' && members(j)[0] === c.tip) marks.push({ x: Math.max(n.x + 16, c.x - 26), y: c.y, t: j, col: T.figViolet }); });
          edges(c);
        });
        ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(n.x, n.y, 3.5, 0, 7); ctx.fill();
      })(root);
      marks.forEach(function (m) {
        ctx.strokeStyle = m.col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(m.x, m.y - 7); ctx.lineTo(m.x, m.y + 7); ctx.stroke();
        ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = T.figPanel; ctx.lineJoin = 'round';
        ctx.strokeText(NUM[m.t], m.x, m.y - 11); ctx.fillStyle = m.col; ctx.fillText(NUM[m.t], m.x, m.y - 11);
      });
      st.on.forEach(function (j) {
        if (kind(j) !== 'anc') return;
        ctx.strokeStyle = T.figAmber; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(root.x - 9, root.y - 7); ctx.lineTo(root.x - 9, root.y + 7); ctx.stroke();
        ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillStyle = T.figAmber; ctx.fillText(NUM[j], root.x - 9, root.y - 11);
      });
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      (function names(n) { if (n.tip != null) { ctx.fillStyle = n.tip === 0 ? T.figMuted : T.figInk; ctx.fillText(d.taxa[n.tip] + (n.tip === 0 ? '(외군)' : ''), n.x + 6, n.y + 4); } else n.kids.forEach(names); })(root);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('분기도 (가지 길이는 의미 없음)', r.x + 8, r.y + 16);
      return nodes;
    }
    api.onResize(draw);
    relabel(); sync(); draw();
  },
});
