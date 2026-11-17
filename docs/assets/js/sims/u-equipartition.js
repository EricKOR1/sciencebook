/* 일반물리학 7 열과 열역학: 에너지 등분배와 몰비열 — 같은 열을 넣었을 때 자유도·과정에 따라 에너지가 나뉘는 방식, C_V, C_P, γ */
Sims.register('u-equipartition', {
  title: '등분배와 몰비열 — 같은 열이 어디로 나뉘나',
  caption: '분자 종류와 가열 과정을 고르고 넣는 열 Q를 바꿔 보자. 막대는 Q가 병진 운동 에너지, 회전 운동 에너지, 외부에 한 일로 나뉘는 몫이다. 자유도 하나마다 1몰당 ½RΔT씩 같은 몫이 돌아가므로 자유도가 많은 분자일수록, 그리고 일로 빠져나가는 등압 과정일수록 온도가 덜 오른다(몰비열이 크다). C_P − C_V = R, γ = 1 + 2/f를 확인해 보자. 이상 기체 1 mol이며 상온에서 진동은 기여하지 않는다고 보았다(실제 CO₂ 등은 진동이 일부 기여해 측정값이 조금 더 크다).',
  init: function (api) {
    var R = 8.314;
    var mols = [
      { name: '단원자 (He, Ar)', f: 3, rot: 0 }, { name: '이원자 (N₂, O₂)', f: 5, rot: 2 }, { name: '비선형 다원자', f: 6, rot: 3 },
    ];
    var st = { m: 1, isoP: false, Q: 1000 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.5; }, label: '분자의 자유도 그림과 열이 나뉘는 막대, 여섯 경우의 온도 상승 비교' });
    var ctx = cv.ctx;

    var rC = api.readout('C_V, C_P');
    var rG = api.readout('γ = C_P/C_V');
    var rT = api.readout('온도 상승 ΔT');
    var rK = api.readout('자유도 하나의 몫 ½RΔT');

    var g1 = api.group();
    var mb = mols.map(function (m, i) { return api.button(m.name, function () { st.m = i; sync(); }, { toggle: true, pressed: i === st.m, parent: g1 }); });
    var g2 = api.group();
    var pv = api.button('등적 가열', function () { st.isoP = false; sync(); }, { toggle: true, pressed: true, parent: g2 });
    var pp = api.button('등압 가열', function () { st.isoP = true; sync(); }, { toggle: true, pressed: false, parent: g2 });
    api.slider({ id: 'u-equipartition-q', label: '넣는 열 Q', min: 200, max: 2000, step: 50, value: st.Q,
      format: function (v) { return v + ' J'; }, onInput: function (v) { st.Q = v; draw(); } });
    function sync() {
      mb.forEach(function (b, i) { b.setAttribute('aria-pressed', i === st.m ? 'true' : 'false'); });
      pv.setAttribute('aria-pressed', st.isoP ? 'false' : 'true'); pp.setAttribute('aria-pressed', st.isoP ? 'true' : 'false');
      draw();
    }
    function subify(root) {
      var wk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [];
      while (wk.nextNode()) list.push(wk.currentNode);
      list.forEach(function (t) {
        if (!/_[A-Z]/.test(t.nodeValue)) return;
        var fr = document.createDocumentFragment();
        t.nodeValue.split(/_([A-Z])/).forEach(function (p, i) {
          if (i % 2) { var s = document.createElement('sub'); s.textContent = p; fr.appendChild(s); } else if (p) fr.appendChild(document.createTextNode(p));
        });
        t.parentNode.replaceChild(fr, t);
      });
    }
    function calc(mi, isoP) {
      var f = mols[mi].f, Cv = f / 2 * R, C = isoP ? Cv + R : Cv, dT = st.Q / C;
      return { f: f, Cv: Cv, Cp: Cv + R, dT: dT, tr: 1.5 * R * dT, rot: mols[mi].rot / 2 * R * dT, W: isoP ? R * dT : 0 };
    }
    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { mol: { x: 0, y: 0, w: w, h: h * 0.3 }, bar: { x: 0, y: h * 0.3, w: w, h: h * 0.3 }, cmp: { x: 0, y: h * 0.6, w: w, h: h * 0.4 } };
      return { mol: { x: 0, y: 0, w: w * 0.3, h: h * 0.55 }, bar: { x: w * 0.32, y: 0, w: w * 0.68, h: h * 0.55 }, cmp: { x: 0, y: h * 0.55, w: w, h: h * 0.45 } };
    }
    function draw() {
      var T = api.tokens(), Lo = layout(), c = calc(st.m, st.isoP);
      ctx.clearRect(0, 0, cv.w, cv.h);
      molecule(T, Lo.mol); bar(T, Lo.bar, c); compare(T, Lo.cmp);
      rC.set(c.Cv.toFixed(1) + ', ' + c.Cp.toFixed(1) + ' J/(mol·K)');
      rG.set((c.Cp / c.Cv).toFixed(3) + ' (= 1 + 2/' + c.f + ')');
      rT.set(c.dT.toFixed(1) + ' K');
      rK.set((0.5 * R * c.dT).toFixed(0) + ' J');
    }
    function arrowL(x1, y1, x2, y2, col) {
      var a = Math.atan2(y2 - y1, x2 - x1);
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 8 * Math.cos(a - 0.45), y2 - 8 * Math.sin(a - 0.45)); ctx.lineTo(x2 - 8 * Math.cos(a + 0.45), y2 - 8 * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
    }
    function molecule(T, b) {
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2 + 4, m = mols[st.m];
      // 병진 3방향
      arrowL(cx, cy, cx + 52, cy, T.figBlue); arrowL(cx, cy, cx, cy - 52, T.figBlue); arrowL(cx, cy, cx - 34, cy + 30, T.figBlue);
      var atoms = st.m === 0 ? [[0, 0]] : st.m === 1 ? [[-14, 0], [14, 0]] : [[0, -6], [-17, 10], [17, 10]];
      if (st.m === 1) { ctx.strokeStyle = T.figInk; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 14, cy); ctx.stroke(); }
      if (st.m === 2) { ctx.strokeStyle = T.figInk; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 17, cy + 10); ctx.lineTo(cx, cy - 6); ctx.lineTo(cx + 17, cy + 10); ctx.stroke(); }
      atoms.forEach(function (p) { ctx.beginPath(); ctx.arc(cx + p[0], cy + p[1], 11, 0, 7); ctx.fillStyle = T.figSoftRed; ctx.fill(); ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.5; ctx.stroke(); });
      // 회전 축 표시(타원 고리)
      ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
      if (m.rot >= 2) { ctx.beginPath(); ctx.ellipse(cx, cy, 34, 12, 0, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.ellipse(cx, cy, 12, 34, 0, 0, 7); ctx.stroke(); }
      if (m.rot === 3) { ctx.beginPath(); ctx.ellipse(cx, cy, 26, 26, 0, 0, 7); ctx.stroke(); }
      ctx.setLineDash([]);
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('자유도 f = 3 + ' + m.rot + ' = ' + m.f, cx, b.y + 16);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('파랑: 병진 3, 주황 점선: 회전 ' + m.rot, cx, b.y + b.h - 4);
    }
    function bar(T, b, c) {
      var L = b.x + 16, R2 = b.x + b.w - 16, y = b.y + 50, H = 40, QMAX = 2000;
      var sx = function (v) { return (R2 - L) * v / QMAX; };
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('Q = ' + st.Q + ' J 가 나뉘는 몫 (' + (st.isoP ? '등압' : '등적') + ')', L, b.y + 22);
      var segs = [{ v: c.tr, col: T.figBlue, soft: T.figSoftBlue, n: '병진 (3/2)RΔT' }, { v: c.rot, col: T.figAmber, soft: T.figSoftAmber, n: '회전 (' + mols[st.m].rot + '/2)RΔT' }, { v: c.W, col: T.figGreen, soft: T.figSoftGreen, n: '일 W = RΔT' }];
      var x = L;
      ctx.strokeStyle = T.rule; ctx.strokeRect(L, y, R2 - L, H);
      segs.forEach(function (s) { if (s.v <= 0) return; var wd = sx(s.v); ctx.fillStyle = s.soft; ctx.fillRect(x, y, wd, H); ctx.strokeStyle = s.col; ctx.lineWidth = 2; ctx.strokeRect(x, y, wd, H); x += wd; });
      // 자유도 칸 구분선(½RΔT 단위)
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      var unit = sx(0.5 * R * c.dT), nU = Math.round((c.tr + c.rot) / (0.5 * R * c.dT));
      for (var k = 1; k < nU; k++) { ctx.beginPath(); ctx.moveTo(L + unit * k, y); ctx.lineTo(L + unit * k, y + H); ctx.stroke(); }
      ctx.setLineDash([]);
      var ly = y + H + 22;
      segs.forEach(function (s, i) {
        if (s.v <= 0) return;
        ctx.fillStyle = s.col; ctx.fillRect(L, ly - 9, 10, 10);
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(s.n + ' = ' + Math.round(s.v) + ' J', L + 16, ly); ly += 18;
      });
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.fillText('점선 칸 하나 = 자유도 하나의 몫 ½RΔT', L, ly + 2);
    }
    function compare(T, b) {
      var L = b.x + 150, R2 = b.x + b.w - 50, top = b.y + 30, rowH = (b.h - 40) / 6, DTMAX = 2000 / (1.5 * R);
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('같은 Q에서 온도 상승 ΔT 비교', b.x + 8, b.y + 18);
      var k = 0;
      for (var mi = 0; mi < 3; mi++) for (var p = 0; p < 2; p++) {
        var c = calc(mi, p === 1), y = top + k * rowH, cur = mi === st.m && (p === 1) === st.isoP;
        ctx.fillStyle = cur ? T.figInk : T.figMuted; ctx.font = (cur ? '600 ' : '') + '11px ' + T.fontBody; ctx.textAlign = 'right';
        ctx.fillText(mols[mi].name.split(' ')[0] + ' · ' + (p ? '등압' : '등적'), L - 8, y + rowH * 0.6);
        var wd = (R2 - L) * c.dT / DTMAX;
        ctx.fillStyle = cur ? T.figAccent : T.figLine; ctx.fillRect(L, y + rowH * 0.2, wd, rowH * 0.55);
        ctx.fillStyle = cur ? T.figInk : T.figMuted; ctx.textAlign = 'left'; ctx.fillText(c.dT.toFixed(1) + ' K', L + wd + 4, y + rowH * 0.6);
        k++;
      }
    }
    subify(api.root);
    api.onResize(draw);
    draw();
  },
});
