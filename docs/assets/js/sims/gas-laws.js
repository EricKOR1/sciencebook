/* 중1-6 기체의 성질: 피스톤 통 속 기체 입자 모형 — ① 압력과 부피(온도 일정) ② 온도와 부피(압력 일정) */
Sims.register('gas-laws', {
  title: '피스톤 속 기체 입자 — 압력·온도를 바꾸면 부피는?',
  caption: '탭 ①에서 피스톤을 누르는 압력을 키우면 부피가 줄고, 같은 수의 입자가 좁은 공간에 모여 피스톤에 더 자주 부딪힌다(입자의 빠르기는 그대로). 탭 ②에서 온도를 높이면 입자가 빨라져 더 세게 부딪히고 피스톤이 밀려 올라간다. 부피가 커진 뒤에는 같은 넓이에 부딪히는 횟수가 오히려 처음보다 줄어, 기체의 압력은 바깥 압력과 같아진다. 그래프의 흰 점은 원고의 실험값이다. 입자끼리의 충돌은 생략했고, 입자 수·크기와 막대의 값은 기준 상태와 비교한 모식적인 값이다.',
  init: function (api) {
    var NP = 26, HR = 1.55, VMAXML = 80;           // 통의 안쪽 높이(가득 = 80 mL)는 폭의 1.55배
    var REF = { P: { P: 100, T: 20 }, T: { P: 100, T: 0 } };
    var st = { tab: 'P', P: 100, T: 20, Vd: 60, flashes: [] };
    function targetV() { return st.tab === 'P' ? 6000 / st.P : 54.6 + 0.2 * st.T; }
    function curT() { return st.tab === 'P' ? 20 : st.T; }
    function vScale(T) { return Math.sqrt((T + 273) / 293); }   // 입자 빠르기 비율(온도가 높을수록 빠름)
    function H(v) { return v / VMAXML * HR; }

    var parts = [];
    function seed() {
      parts = [];
      for (var i = 0; i < NP; i++) {
        var a = Math.random() * Math.PI * 2;
        parts.push({ x: 0.05 + Math.random() * 0.9, y: 0.03 + Math.random() * (H(st.Vd) - 0.06), dx: Math.cos(a), dy: Math.sin(a), f: 0.75 + Math.random() * 0.5 });
      }
    }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.28 : 0.56; }, label: '피스톤이 달린 통 속 기체 입자와 압력·부피 또는 온도·부피 그래프' });
    var ctx = cv.ctx;
    var rP = api.readout('기체의 압력');
    var rT = api.readout('온도');
    var rV = api.readout('부피');

    var g = api.group();
    var bP = api.button('① 압력을 바꾸면 (온도 일정)', function () { setTab('P'); }, { toggle: true, pressed: true, parent: g });
    var bT = api.button('② 온도를 바꾸면 (압력 일정)', function () { setTab('T'); }, { toggle: true, parent: g });
    var sP = api.slider({ id: 'gas-laws-p', label: '피스톤을 누르는 압력', min: 100, max: 250, step: 5, value: 100,
      format: function (v) { return v + ' kPa'; }, onInput: function (v) { st.P = v; changed(); } });
    var sT = api.slider({ id: 'gas-laws-t', label: '물의 온도', min: 0, max: 80, step: 5, value: 0,
      format: function (v) { return v + ' °C'; }, onInput: function (v) { st.T = v; changed(); } });

    function setTab(t) {
      st.tab = t;
      bP.setAttribute('aria-pressed', t === 'P' ? 'true' : 'false');
      bT.setAttribute('aria-pressed', t === 'T' ? 'true' : 'false');
      sP.input.parentNode.style.display = t === 'P' ? '' : 'none';
      sT.input.parentNode.style.display = t === 'T' ? '' : 'none';
      st.P = t === 'P' ? sP.value : 100; st.T = t === 'T' ? sT.value : 20;
      st.Vd = targetV(); st.flashes = []; seed(); draw();
    }
    function changed() { if (api.reduced) { st.Vd = targetV(); seed(); } draw(); }

    // 상대값(기준 상태와 비교): 같은 넓이에 부딪히는 횟수 ∝ 빠르기 ÷ 높이, 한 번의 세기 ∝ 빠르기
    function rel() {
      var R = REF[st.tab], v0 = vScale(R.T), V0 = st.tab === 'P' ? 6000 / R.P : 54.6 + 0.2 * R.T;
      var v = vScale(curT());
      var hits = (v / st.Vd) / (v0 / V0), hard = v / v0;
      return { hits: hits, hard: hard, press: hits * hard * (R.P / 100) };
    }

    var loop = api.loop(function (dt) {
      var tv = targetV();
      st.Vd += (tv - st.Vd) * Math.min(1, dt * 1.4);
      if (Math.abs(tv - st.Vd) < 0.02) st.Vd = tv;
      var h = H(st.Vd), vb = 0.85 * vScale(curT()), r = 0.025;
      parts.forEach(function (p) {
        var sp = vb * p.f;
        p.x += p.dx * sp * dt; p.y += p.dy * sp * dt;
        if (p.x < r) { p.x = r; p.dx = Math.abs(p.dx); flash(p.x - r, p.y, 'side'); }
        if (p.x > 1 - r) { p.x = 1 - r; p.dx = -Math.abs(p.dx); flash(p.x + r, p.y, 'side'); }
        if (p.y < r) { p.y = r; p.dy = Math.abs(p.dy); flash(p.x, 0, 'side'); }
        if (p.y > h - r) { if (p.dy > 0) flash(p.x, h, 'top'); p.y = h - r; p.dy = -Math.abs(p.dy); }
      });
      st.flashes = st.flashes.filter(function (f) { f.life -= dt; return f.life > 0; });
      draw();
    });
    function flash(x, y, kind) { st.flashes.push({ x: x, y: y, kind: kind, life: 0.35 }); }

    function layout() {
      var w = cv.w, hgt = cv.h;
      if (w < 560) return { cyl: { x: 0, y: 0, w: w * 0.5, h: hgt * 0.56 }, bars: { x: w * 0.5, y: 0, w: w * 0.5, h: hgt * 0.56 }, graph: { x: 0, y: hgt * 0.58, w: w, h: hgt * 0.42 } };
      return { cyl: { x: 0, y: 0, w: w * 0.34, h: hgt }, bars: { x: w * 0.36, y: hgt * 0.6, w: w * 0.64, h: hgt * 0.4 }, graph: { x: w * 0.36, y: 0, w: w * 0.64, h: hgt * 0.58 } };
    }
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawCyl(T, L.cyl); drawBars(T, L.bars); drawGraph(T, L.graph);
      var R = rel();
      rP.set(st.tab === 'P' ? Math.round(100 * R.press) + ' kPa' : (Math.abs(R.press - 1) < 0.01 ? '일정(바깥 압력과 같음)' : '잠시 바깥보다 큼'));
      rT.set(curT() + ' °C' + (st.tab === 'P' ? ' (일정)' : ''));
      rV.set(st.Vd.toFixed(1) + ' mL');
    }
    function arrowV(x, y1, y2, c, lw) {
      var s = y2 > y1 ? 1 : -1;
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2 - s * 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y2); ctx.lineTo(x - 6, y2 - s * 11); ctx.lineTo(x + 6, y2 - s * 11); ctx.closePath(); ctx.fill();
    }
    function drawCyl(T, r) {
      var topSpace = 64, bot = r.y + r.h - 26;
      var cw = Math.min(r.w - 70, (bot - r.y - topSpace) / HR), ch = cw * HR;
      var x0 = r.x + (r.w - cw) / 2 + 8, yb = bot;                    // 통 안쪽 왼쪽 아래
      var sc = cw;
      // 물중탕(탭 ②)
      if (st.tab === 'T') {
        var wc = st.T < 30 ? T.figSoftBlue : st.T < 55 ? T.figSoftAmber : T.figSoftRed;
        ctx.fillStyle = wc; ctx.fillRect(x0 - 14, yb - ch * 0.62, cw + 28, ch * 0.62 + 10);
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.2; ctx.strokeRect(x0 - 14, yb - ch * 0.62, cw + 28, ch * 0.62 + 10);
        ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('물 ' + st.T + ' °C', x0 - 12, yb + 22);
      }
      // 눈금 (mL)
      ctx.strokeStyle = T.figMuted; ctx.fillStyle = T.figMuted; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var m = 0; m <= VMAXML; m += 10) {
        var yy = yb - m / VMAXML * ch;
        ctx.beginPath(); ctx.moveTo(x0 - 3, yy); ctx.lineTo(x0 - (m % 20 === 0 ? 10 : 6), yy); ctx.stroke();
        if (m % 20 === 0) ctx.fillText(m, x0 - 13, yy + 4);
      }
      ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody; ctx.fillText('mL', x0 - 30, yb - ch - 6);
      // 기체 영역
      var hp = st.Vd / VMAXML * ch;
      ctx.fillStyle = T.figPanel; ctx.fillRect(x0, yb - hp, cw, hp);
      // 통 벽
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x0 - 1.5, yb - ch - 8); ctx.lineTo(x0 - 1.5, yb + 1.5); ctx.lineTo(x0 + cw + 1.5, yb + 1.5); ctx.lineTo(x0 + cw + 1.5, yb - ch - 8); ctx.stroke();
      // 충돌 표시
      st.flashes.forEach(function (f) {
        var a = f.life / 0.35;
        ctx.globalAlpha = f.kind === 'top' ? a : a * 0.5; ctx.fillStyle = T.figAmber;
        ctx.beginPath(); ctx.arc(x0 + f.x * sc, yb - f.y * sc, f.kind === 'top' ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      // 입자
      var vb = vScale(curT()), rad = Math.max(3.5, sc * 0.025);
      parts.forEach(function (p) {
        var px = x0 + p.x * sc, py = yb - p.y * sc, tl = sc * 0.06 * vb * p.f;
        ctx.strokeStyle = T.figRed; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - p.dx * tl, py + p.dy * tl); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI * 2); ctx.fillStyle = T.figSoftRed; ctx.fill();
        ctx.strokeStyle = T.figRed; ctx.lineWidth = 1.3; ctx.stroke();
      });
      // 피스톤
      var py0 = yb - hp, pth = 12;
      ctx.fillStyle = T.figSoftBlue; ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2;
      ctx.fillRect(x0, py0 - pth, cw, pth); ctx.strokeRect(x0, py0 - pth, cw, pth);
      ctx.fillRect(x0 + cw / 2 - 4, py0 - pth - 22, 8, 22); ctx.strokeRect(x0 + cw / 2 - 4, py0 - pth - 22, 8, 22);
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      if (st.tab === 'P') {
        var len = 14 + (st.P - 100) / 150 * 30;
        [0.25, 0.75].forEach(function (k) { arrowV(x0 + cw * k, py0 - pth - 6 - len, py0 - pth - 3, T.figViolet, 3); });
        ctx.fillStyle = T.figViolet; ctx.fillText('누르는 압력 ' + st.P + ' kPa', x0 + cw / 2, Math.max(r.y + 12, py0 - pth - 14 - len));
      } else {
        ctx.fillStyle = T.figMuted; ctx.fillText('바깥 압력 일정', x0 + cw / 2, py0 - pth - 30);
      }
    }
    function drawBars(T, r) {
      var R = rel(), refTxt = st.tab === 'P' ? '100 kPa' : '0 °C';
      var items = [
        { k: '같은 넓이에 부딪히는 횟수', v: R.hits, c: T.figAmber },
        { k: '입자 하나의 충돌 세기', v: R.hard, c: T.figRed },
        { k: '기체가 피스톤을 미는 압력', v: R.press, c: T.figViolet },
      ];
      var narrow = cv.w < 560;
      var lx = r.x + 6, top = r.y + (narrow ? 24 : 22), rowH = Math.min(46, (r.h - 30) / 3);
      var bx = narrow ? lx : r.x + 190, bw = (narrow ? r.w - 64 : r.w - 250), VMAX = 2.6;
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('기준(' + refTxt + ')과 비교', lx, r.y + 12);
      items.forEach(function (it, i) {
        var y = top + i * rowH;
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
        var by = narrow ? y + 14 : y + 2;
        ctx.fillText(it.k, lx, narrow ? y + 6 : y + 14);
        ctx.fillStyle = T.figPaper; ctx.fillRect(bx, by, bw, 14);
        ctx.fillStyle = it.c; ctx.fillRect(bx, by, Math.min(it.v, VMAX) / VMAX * bw, 14);
        var x1 = bx + bw / VMAX;
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.setLineDash([3, 2]);
        ctx.beginPath(); ctx.moveTo(x1, by - 3); ctx.lineTo(x1, by + 17); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontMono; ctx.textAlign = 'left';
        ctx.fillText(it.v.toFixed(2) + '배', bx + bw + 6, by + 12);
      });
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('점선 = 기준 상태(1배)', lx, top + 3 * rowH + (narrow ? 4 : 0));
    }
    function drawGraph(T, r) {
      var isP = st.tab === 'P';
      var L = r.x + 46, R = r.x + r.w - 14, Tp = r.y + 22, B = r.y + r.h - 34;
      var xmin = 0, xmax = isP ? 260 : 80, ymax = 80;
      var sx = function (x) { return L + (x - xmin) / (xmax - xmin) * (R - L); }, sy = function (v) { return B - v / ymax * (B - Tp); };
      ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      [0, 20, 40, 60, 80].forEach(function (v) { ctx.strokeStyle = T.rule; ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillStyle = T.figMuted; ctx.fillText(v, L - 6, sy(v) + 4); });
      ctx.textAlign = 'center';
      (isP ? [0, 50, 100, 150, 200, 250] : [0, 20, 40, 60, 80]).forEach(function (x) { ctx.fillText(x, sx(x), B + 14); });
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('부피 (mL)', L + 4, Tp - 8);
      ctx.textAlign = 'right'; ctx.fillText(isP ? '압력 (kPa)' : '온도 (°C)', R, B + 28);
      // 경향선(점선)과 실험값
      var data = isP ? [[100, 60], [125, 48], [150, 40], [200, 30], [250, 24]] : [[0, 54.6], [20, 58.6], [40, 62.6], [60, 66.6], [80, 70.6]];
      ctx.strokeStyle = T.figLine; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5; ctx.beginPath();
      for (var i = 0; i <= 60; i++) {
        var x = isP ? 100 + i * 2.5 : i * 80 / 60, v = isP ? 6000 / x : 54.6 + 0.2 * x;
        if (i) ctx.lineTo(sx(x), sy(v)); else ctx.moveTo(sx(x), sy(v));
      }
      ctx.stroke(); ctx.setLineDash([]);
      data.forEach(function (d) { ctx.beginPath(); ctx.arc(sx(d[0]), sy(d[1]), 4.5, 0, Math.PI * 2); ctx.fillStyle = T.figPanel; ctx.fill(); ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.stroke(); });
      var cx = isP ? st.P : st.T;
      ctx.beginPath(); ctx.arc(sx(cx), sy(st.Vd), 6.5, 0, Math.PI * 2); ctx.fillStyle = T.figAccent; ctx.fill();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText(isP ? '압력↑ → 부피↓' : '온도↑ → 부피↑', R, Tp - 8);
    }

    api.onResize(draw);
    setTab('P');
    if (api.reduced) loop.pause();
  },
});
