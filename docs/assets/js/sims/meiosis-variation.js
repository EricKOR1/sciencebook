/* 생명과학 3 감수 분열과 다양성: 상동 염색체의 독립적 분리(2ⁿ)와 교차 */
Sims.register('meiosis-variation', {
  title: '감수 1분열 중기의 배열과 생식세포의 다양성',
  caption: '파란색은 아버지, 빨간색은 어머니에게서 받은 염색체이다. 감수 1분열 중기 그림에서 상동 염색체 쌍을 누르거나 "무작위로 배열"을 누르면 쌍이 놓이는 방향이 바뀌고, 그에 따라 생식세포의 염색체 조합이 달라진다. 배열을 여러 번 바꿔 상동 염색체가 n쌍이면 조합이 2ⁿ가지임을 확인해 보자. "교차"를 켜면 가장 큰 쌍에서 상동 염색체의 염색 분체 일부가 바뀌어, 2ⁿ가지에 없던 새로운 조합의 염색체가 생긴다. 염색체 모양과 교차 위치는 모식적으로 나타냈다.',
  init: function (api) {
    var st = { n: 3, orient: [false, false, false], cross: false, seen: {} };
    var LEN = [1, 0.74, 0.5];
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.55 : 0.58; }, label: '감수 분열 단계별 염색체 배열과 생식세포의 염색체 조합' });
    var ctx = cv.ctx;
    var rN = api.readout('상동 염색체 쌍 수 n'), rA = api.readout('중기 배열 방법'), rAll = api.readout('가능한 조합 2ⁿ'), rSeen = api.readout('지금까지 나온 조합');
    var g = api.group();
    var b2 = api.button('2쌍 (2n = 4)', function () { setN(2); }, { toggle: true, parent: g });
    var b3 = api.button('3쌍 (2n = 6)', function () { setN(3); }, { toggle: true, pressed: true, parent: g });
    api.button('무작위로 배열', function () {
      var old = st.orient.join();
      do { for (var i = 0; i < st.n; i++) st.orient[i] = Math.random() < 0.5; } while (st.orient.slice(0, st.n).join() === old.split(',').slice(0, st.n).join() && st.n > 0 && Math.random() < 0.9);
      record(); draw();
    }, { primary: true });
    var bx = api.button('교차', function () { st.cross = !st.cross; bx.setAttribute('aria-pressed', st.cross ? 'true' : 'false'); draw(); }, { toggle: true });

    function setN(n) {
      st.n = n; st.seen = {}; st.orient = [false, false, false];
      b2.setAttribute('aria-pressed', n === 2 ? 'true' : 'false'); b3.setAttribute('aria-pressed', n === 3 ? 'true' : 'false');
      record(); draw();
    }
    // 생식세포 4개 계산: 각 염색체는 { src: 'P'|'M', rec: 교차로 다른 색 조각이 있는가 }
    function gametes() {
      var left = [], right = [];
      for (var i = 0; i < st.n; i++) { var L = st.orient[i] ? 'M' : 'P', R = L === 'P' ? 'M' : 'P'; left.push(L); right.push(R); }
      function g(side, inner) { return side.map(function (src, i) { return { src: src, rec: st.cross && i === 0 && inner }; }); }
      return [g(left, false), g(left, true), g(right, true), g(right, false)];
    }
    function key(gm) { return gm.map(function (c) { return c.src; }).join(''); }
    function record() { gametes().forEach(function (gm) { if (!gm.some(function (c) { return c.rec; })) st.seen[key(gm)] = 1; }); readouts(); }
    function readouts() {
      var all = Math.pow(2, st.n);
      rN.set(st.n + '쌍 (2n = ' + 2 * st.n + ')');
      rA.set('2ⁿ⁻¹ = ' + all / 2 + '가지');
      rAll.set('2' + (st.n === 2 ? '²' : '³') + ' = ' + all + '가지');
      rSeen.set(Object.keys(st.seen).length + ' / ' + all);
    }

    // ── 그리기 ──
    function chromatid(x, y, len, src, rec, T) {   // 세로 막대 하나(염색 분체), y는 중심
      var w = 7, top = y - len / 2;
      ctx.fillStyle = src === 'P' ? T.figBlue : T.figRed;
      rr(x - w / 2, top, w, len, 3.5); ctx.fill();
      if (rec) {   // 아래쪽 35%가 다른 색(교차로 바뀐 부분)
        ctx.save(); rr(x - w / 2, top, w, len, 3.5); ctx.clip();
        ctx.fillStyle = src === 'P' ? T.figRed : T.figBlue; ctx.fillRect(x - w / 2, top + len * 0.65, w, len * 0.35 + 1);
        ctx.restore();
      }
    }
    function chromosome(x, y, len, chs, T) {  // chs: [{src,rec}, …] 1개 또는 2개(염색 분체)
      var gap = 8, x0 = x - (chs.length - 1) * gap / 2;
      chs.forEach(function (c, k) { chromatid(x0 + k * gap, y, len, c.src, c.rec, T); });
      if (chs.length === 2) { ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(x, y - len * 0.12, 3, 0, 7); ctx.fill(); }
    }
    function cell(cx, cy, rx, ry, T) {
      ctx.fillStyle = T.figPaper; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.fill(); ctx.stroke();
    }
    function title(T, txt, x, y, align) { ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = align || 'center'; ctx.fillText(txt, x, y); }
    function arrowR(T, x1, x2, y) {
      ctx.strokeStyle = T.figMuted; ctx.fillStyle = T.figMuted; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2 - 8, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - 9, y - 5); ctx.lineTo(x2 - 9, y + 5); ctx.closePath(); ctx.fill();
    }
    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) {
        return { A: { x: 0, y: 0, w: w * 0.56, h: h * 0.4 }, B: { x: w * 0.6, y: 0, w: w * 0.4, h: h * 0.4 },
          C: { x: 0, y: h * 0.42, w: w, h: h * 0.22 }, D: { x: 0, y: h * 0.66, w: w, h: h * 0.34 }, cols: 4 };
      }
      return { A: { x: 0, y: 0, w: w * 0.34, h: h * 0.64 }, B: { x: w * 0.38, y: 0, w: w * 0.2, h: h * 0.64 },
        C: { x: w * 0.62, y: 0, w: w * 0.38, h: h * 0.64 }, D: { x: 0, y: h * 0.67, w: w, h: h * 0.33 }, cols: 8 };
    }
    var hit = [];
    function draw() {
      var T = api.tokens(), Lo = layout(); ctx.clearRect(0, 0, cv.w, cv.h); hit = [];
      var gms = gametes();
      // A: 감수 1분열 중기
      var A = Lo.A, acx = A.x + A.w / 2, aTop = A.y + 20, aBot = A.y + A.h - 16, acy = (aTop + aBot) / 2, ary = (aBot - aTop) / 2;
      var rowH = (aBot - aTop - 28) / st.n;
      var unit = Math.min(64, (aBot - aTop - 28) / 3 * 0.88);
      title(T, '감수 1분열 중기', acx, A.y + 13);
      cell(acx, acy, A.w / 2 - 6, ary, T);
      ctx.strokeStyle = T.figMuted; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(acx, acy - ary + 6); ctx.lineTo(acx, acy + ary - 6); ctx.stroke(); ctx.setLineDash([]);
      for (var i = 0; i < st.n; i++) {
        var y = acy - (st.n - 1) * rowH / 2 + i * rowH, len = unit * LEN[i];
        var Lsrc = st.orient[i] ? 'M' : 'P', Rsrc = Lsrc === 'P' ? 'M' : 'P', rc = st.cross && i === 0;
        chromosome(acx - 13, y, len, [{ src: Lsrc, rec: false }, { src: Lsrc, rec: rc }], T);
        chromosome(acx + 13, y, len, [{ src: Rsrc, rec: rc }, { src: Rsrc, rec: false }], T);
        hit.push({ i: i, x0: acx - 36, x1: acx + 36, y0: y - rowH / 2, y1: y + rowH / 2 });
      }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('쌍을 눌러 방향 바꾸기', acx, A.y + A.h - 2);
      // B: 감수 1분열 후
      var B = Lo.B, bcx = B.x + B.w / 2, ch = (B.h - 40) / 2, sc = 0.62;
      arrowR(T, A.x + A.w - 2, B.x + 6, acy);
      title(T, '감수 1분열 후', bcx, B.y + 13);
      [0, 1].forEach(function (k) {
        var cy = B.y + 24 + ch / 2 + k * (ch + 6);
        cell(bcx, cy, B.w / 2 - 8, ch / 2, T);
        var gm = gms[k === 0 ? 0 : 3], gmIn = gms[k === 0 ? 1 : 2], cw = (B.w - 30) / st.n;
        for (var i = 0; i < st.n; i++) {
          var x = bcx - (st.n - 1) * cw / 2 + i * cw;
          var pair = k === 0 ? [gm[i], gmIn[i]] : [gmIn[i], gm[i]];
          chromosome(x, cy, unit * LEN[i] * sc, pair, T);
        }
      });
      // C: 감수 2분열 후(생식세포)
      var C = Lo.C, narrow = cv.w < 560;
      arrowR(T, B.x + B.w - 2, C.x + 6, narrow ? -100 : acy);
      title(T, '감수 2분열 후 — 생식세포 4개', C.x + C.w / 2, C.y + 13);
      var gw = narrow ? (C.w - 10) / 4 : (C.w - 14) / 2, gh = narrow ? C.h - 24 : (C.h - 34) / 2;
      gms.forEach(function (gm, k) {
        var col = narrow ? k : k % 2, row = narrow ? 0 : Math.floor(k / 2);
        var cx = C.x + 7 + gw * col + gw / 2, cy = C.y + 22 + row * (gh + 6) + gh / 2;
        var rec = gm.some(function (c) { return c.rec; });
        cell(cx, cy, gw / 2 - 5, gh / 2 - 2, T);
        if (rec) { ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(cx, cy, gw / 2 - 5, gh / 2 - 2, 0, 0, 7); ctx.stroke(); }
        var cw = Math.min(16, (gw - 20) / st.n);
        for (var i = 0; i < st.n; i++) chromosome(cx - (st.n - 1) * cw / 2 + i * cw, cy - 4, unit * LEN[i] * 0.55, [gm[i]], T);
        ctx.fillStyle = rec ? T.figAmber : T.figMuted; ctx.font = (rec ? '600 ' : '') + '11px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(rec ? (narrow ? '새 조합' : '교차로 새 조합') : '', cx, cy + gh / 2 - 14);
      });
      // D: 가능한 조합 2ⁿ
      var D = Lo.D, all = Math.pow(2, st.n), cols = Math.min(Lo.cols, all), rows = Math.ceil(all / cols);
      title(T, '교차가 없을 때 가능한 생식세포의 조합 2ⁿ = ' + all + '가지', D.x + 4, D.y + 13, 'left');
      var made = {}; gms.forEach(function (gm) { if (!gm.some(function (c) { return c.rec; })) made[key(gm)] = 1; });
      var bw = Math.min(78, (D.w - 8) / cols), bh = Math.min(70, (D.h - 40) / rows);
      for (var c = 0; c < all; c++) {
        var srcs = []; for (var j = 0; j < st.n; j++) srcs.push((c >> (st.n - 1 - j)) & 1 ? 'M' : 'P');
        var kk = srcs.join(''), cxx = D.x + 4 + (c % cols) * bw, cyy = D.y + 22 + Math.floor(c / cols) * bh;
        var isMade = made[kk], isSeen = st.seen[kk];
        ctx.fillStyle = isMade ? T.figSoftBlue : T.figPanel; ctx.strokeStyle = isMade ? T.figAccent : T.figLine; ctx.lineWidth = isMade ? 2.2 : 1;
        rr(cxx + 3, cyy, bw - 6, bh - 6, 6); ctx.fill(); ctx.stroke();
        var cw2 = Math.min(14, (bw - 16) / st.n);
        for (var j2 = 0; j2 < st.n; j2++) chromosome(cxx + bw / 2 - (st.n - 1) * cw2 / 2 + j2 * cw2, cyy + (bh - 6) / 2 - 5, Math.min(unit * 0.5, bh - 26) * LEN[j2], [{ src: srcs[j2], rec: false }], T);
        ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillStyle = isMade ? T.figAccent : isSeen ? T.figGreen : T.figMuted;
        ctx.fillText(isMade ? '지금 생김' : isSeen ? '나온 적 있음' : '아직', cxx + bw / 2, cyy + bh - 10);
      }
    }
    function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    cv.canvas.addEventListener('click', function (e) {
      var b = cv.canvas.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
      hit.forEach(function (h) { if (x >= h.x0 && x <= h.x1 && y >= h.y0 && y <= h.y1) { st.orient[h.i] = !st.orient[h.i]; record(); draw(); } });
    });
    cv.canvas.style.cursor = 'pointer';
    api.onResize(draw);
    st.orient = [false, true, false]; record(); draw();
  },
});
