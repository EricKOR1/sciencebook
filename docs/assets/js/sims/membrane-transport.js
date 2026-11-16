/* 세포와 물질대사 1: 세포막을 통한 물질 이동 — 단순 확산(직선), 촉진 확산(포화), 능동 수송(ATP, 거슬러) */
Sims.register('membrane-transport', {
  title: '세포막을 지나는 세 가지 길 — 농도 차와 이동 속도',
  caption: '방식을 고르고 막 양쪽 농도를 바꾸어 보자. 단순 확산은 인지질 사이로 직접 지나가므로 이동 속도가 농도 차에 비례한다(직선). 촉진 확산은 운반체 단백질을 거쳐야 해서 농도 차가 커지면 운반체가 모두 바빠져 속도가 더 늘지 않는다(포화). 능동 수송은 ATP를 써서 농도가 낮은 쪽에서 높은 쪽으로도 옮기며, ATP 공급을 끊으면 멈춘다. 이동 속도는 상대값이고, 막 양쪽 농도는 일정하게 유지된다고 가정했다. 능동 수송은 나트륨–칼륨 펌프에서 K⁺만 나타냈고, 펌프 외의 새어 나감은 무시했다.',
  init: function (api) {
    var MODES = [
      { key: 'simple', name: '단순 확산', mol: 'O₂' },
      { key: 'facil', name: '촉진 확산', mol: '포도당' },
      { key: 'active', name: '능동 수송', mol: 'K⁺' },
    ];
    var K_S = 1, VF = 6, KF = 2, VA = 4, KA = 1.5, CMAX = 10;
    var st = { mode: 'simple', co: 8, ci: 2, atp: true, parts: [], movers: [], flashes: [], acc: { in: 0, out: 0 } };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.45 : 0.56; }, label: '세포막을 사이에 둔 입자의 이동과 농도 차–이동 속도 그래프' });
    var ctx = cv.ctx;

    var rMode = api.readout('방식');
    var rD = api.readout('농도 차(밖 − 안)');
    var rJ = api.readout('이동 속도(안으로 +)');
    var rE = api.readout('ATP');

    var g = api.group();
    var tabs = MODES.map(function (m, i) {
      return api.button(m.name, function () { setMode(m.key); }, { toggle: true, pressed: i === 0, parent: g });
    });
    api.slider({ id: 'membrane-transport-out', label: '세포 밖 농도', min: 0, max: CMAX, step: 1, value: st.co,
      onInput: function (v) { st.co = v; refill(); update(); } });
    api.slider({ id: 'membrane-transport-in', label: '세포 안 농도', min: 0, max: CMAX, step: 1, value: st.ci,
      onInput: function (v) { st.ci = v; refill(); update(); } });
    var atpBtn = api.button('ATP 공급 끊기', function () { st.atp = !st.atp; atpBtn.setAttribute('aria-pressed', st.atp ? 'false' : 'true'); update(); }, { toggle: true, pressed: false });

    function flux(mode, co, ci) {
      if (mode === 'simple') return K_S * (co - ci);
      if (mode === 'facil') return VF * (co / (KF + co) - ci / (KF + ci));
      return st.atp ? VA * co / (KA + co) : 0;
    }
    function inOut(mode, co, ci) {   // 양방향 이동(입자 그림용)
      if (mode === 'simple') return [K_S * co, K_S * ci];
      if (mode === 'facil') return [VF * co / (KF + co), VF * ci / (KF + ci)];
      return [st.atp ? VA * co / (KA + co) : 0, 0];
    }
    function setMode(k) {
      st.mode = k; st.movers = []; st.flashes = [];
      tabs.forEach(function (b, i) { b.setAttribute('aria-pressed', MODES[i].key === k ? 'true' : 'false'); });
      atpBtn.style.display = k === 'active' ? '' : 'none';
      update();
    }
    function modeInfo() { return MODES.filter(function (m) { return m.key === st.mode; })[0]; }

    /* ── 장면 배치 ── */
    function layout() {
      var w = cv.w, h = cv.h, stacked = w < 560;
      return stacked
        ? { scene: { x: 0, y: 0, w: w, h: h * 0.5 }, graph: { x: 0, y: h * 0.53, w: w, h: h * 0.47 } }
        : { scene: { x: 0, y: 0, w: w * 0.52, h: h }, graph: { x: w * 0.55, y: 0, w: w * 0.45, h: h } };
    }
    function geom() {
      var r = layout().scene, mid = r.y + r.h * 0.5;
      return { r: r, top: r.y + 26, mT: mid - 14, mB: mid + 14, bot: r.y + r.h - 6, prot: [0.25, 0.5, 0.75].map(function (f) { return r.x + r.w * f; }) };
    }
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function newPart(side, G) {
      return { side: side, x: rnd(G.r.x + 8, G.r.x + G.r.w - 8), y: side === 'o' ? rnd(G.top + 6, G.mT - 8) : rnd(G.mB + 8, G.bot - 8), vx: rnd(-1, 1) * 30, vy: rnd(-1, 1) * 30 };
    }
    function refill() {
      var G = geom();
      ['o', 'i'].forEach(function (s) {
        var want = Math.round((s === 'o' ? st.co : st.ci) * 3.2);
        var have = st.parts.filter(function (p) { return p.side === s; });
        while (have.length < want) { var p = newPart(s, G); st.parts.push(p); have.push(p); }
        while (have.length > want) { var q = have.pop(); st.parts.splice(st.parts.indexOf(q), 1); }
      });
    }
    function launch(dir, G) {   // dir 'in' : 밖 → 안
      var src = dir === 'in' ? 'o' : 'i';
      var pool = st.parts.filter(function (p) { return p.side === src; });
      if (!pool.length) return;
      var p = pool[Math.floor(Math.random() * pool.length)];
      st.parts.splice(st.parts.indexOf(p), 1);
      var x = st.mode === 'simple' ? Math.max(G.r.x + 10, Math.min(G.r.x + G.r.w - 10, p.x)) : G.prot[Math.floor(Math.random() * 3)];
      st.movers.push({ x0: p.x, y0: p.y, x: x, dir: dir, t: 0 });
      if (st.mode === 'active') st.flashes.push({ x: x, t: 0 });
    }
    var loop = api.loop(function (dt) {
      var G = geom();
      st.parts.forEach(function (p) {
        p.vx += rnd(-1, 1) * 160 * dt; p.vy += rnd(-1, 1) * 160 * dt;
        var sp = Math.hypot(p.vx, p.vy); if (sp > 40) { p.vx *= 40 / sp; p.vy *= 40 / sp; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        var y0 = p.side === 'o' ? G.top + 5 : G.mB + 7, y1 = p.side === 'o' ? G.mT - 7 : G.bot - 5;
        if (p.x < G.r.x + 6) { p.x = G.r.x + 6; p.vx = Math.abs(p.vx); }
        if (p.x > G.r.x + G.r.w - 6) { p.x = G.r.x + G.r.w - 6; p.vx = -Math.abs(p.vx); }
        if (p.y < y0) { p.y = y0; p.vy = Math.abs(p.vy); }
        if (p.y > y1) { p.y = y1; p.vy = -Math.abs(p.vy); }
      });
      var io = inOut(st.mode, st.co, st.ci);
      st.acc.in += io[0] * 0.45 * dt; st.acc.out += io[1] * 0.45 * dt;
      while (st.acc.in >= 1) { st.acc.in -= 1; launch('in', G); }
      while (st.acc.out >= 1) { st.acc.out -= 1; launch('out', G); }
      st.movers = st.movers.filter(function (m) {
        m.t += dt / 1.1;
        if (m.t >= 1) { refill(); return false; }
        return true;
      });
      st.flashes = st.flashes.filter(function (f) { f.t += dt / 1.2; return f.t < 1; });
      draw();
    });

    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawScene(T); drawGraph(T, L.graph);
    }
    function drawScene(T) {
      var G = geom(), r = G.r, mode = st.mode;
      ctx.fillStyle = T.figSoftBlue; ctx.globalAlpha = 0.55;
      ctx.fillRect(r.x, G.top - 4, r.w, G.mT - G.top + 4); ctx.fillRect(r.x, G.mB, r.w, G.bot - G.mB);
      ctx.globalAlpha = 1;
      ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figBlue; ctx.textAlign = 'left';
      ctx.fillText('세포 밖  (농도 ' + st.co + ')', r.x + 6, r.y + 16);
      ctx.fillText('세포 안  (농도 ' + st.ci + ')', r.x + 6, G.bot - 4 > G.mB + 20 ? G.mB + 18 : G.bot);
      // 인지질 이중층
      for (var x = r.x + 6; x < r.x + r.w; x += 11) {
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x - 1.5, G.mT + 4); ctx.lineTo(x - 1.5, G.mB - 4); ctx.moveTo(x + 1.5, G.mT + 4); ctx.lineTo(x + 1.5, G.mB - 4); ctx.stroke();
        ctx.fillStyle = T.figSoftAmber; ctx.strokeStyle = T.figAmber;
        [G.mT + 2, G.mB - 2].forEach(function (yy) { ctx.beginPath(); ctx.arc(x, yy, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
      }
      // 단백질
      if (mode !== 'simple') {
        G.prot.forEach(function (px) {
          var busy = st.movers.some(function (m) { return Math.abs(m.x - px) < 1 && m.t > 0.3 && m.t < 0.7; });
          ctx.fillStyle = mode === 'active' ? T.figSoftViolet : T.figSoftGreen;
          ctx.strokeStyle = mode === 'active' ? T.figViolet : T.figGreen; ctx.lineWidth = 2;
          rr(px - 15, G.mT - 10, 30, G.mB - G.mT + 20, 10); ctx.fill(); ctx.stroke();
          if (busy) { ctx.strokeStyle = T.figAccent; ctx.lineWidth = 3; rr(px - 17, G.mT - 12, 34, G.mB - G.mT + 24, 11); ctx.stroke(); }
        });
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText(mode === 'active' ? '펌프(운반체 단백질)' : '운반체 단백질', G.prot[1], G.mT - 14);
      }
      // 입자
      var info = modeInfo();
      var col = mode === 'simple' ? T.figRed : mode === 'facil' ? T.figGreen : T.figViolet;
      ctx.fillStyle = col;
      st.parts.forEach(function (p) { ctx.beginPath(); ctx.arc(p.x, p.y, 3.6, 0, Math.PI * 2); ctx.fill(); });
      st.movers.forEach(function (m) {
        var yS = m.dir === 'in' ? G.mT - 10 : G.mB + 10, yE = m.dir === 'in' ? G.mB + 12 : G.mT - 12;
        var x, y;
        if (m.t < 0.35) { var a = m.t / 0.35; x = m.x0 + (m.x - m.x0) * a; y = m.y0 + (yS - m.y0) * a; }
        else { var b = (m.t - 0.35) / 0.65; x = m.x; y = yS + (yE - yS) * b; }
        ctx.beginPath(); ctx.arc(x, y, 4.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.stroke();
      });
      st.flashes.forEach(function (f) {
        ctx.globalAlpha = 1 - f.t; ctx.fillStyle = T.figAmber; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText('ATP → ADP', f.x + 18, G.mB + 14 + f.t * 10); ctx.globalAlpha = 1; ctx.fillStyle = col;
      });
      // 알짜 이동 화살표
      var J = flux(mode, st.co, st.ci), ax = r.x + r.w - 26, mid = (G.mT + G.mB) / 2;
      ctx.fillStyle = T.figPanel; ctx.globalAlpha = 0.85; rr(ax - 24, mid - 40, 48, 80, 8); ctx.fill(); ctx.globalAlpha = 1;
      ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillStyle = T.figInk;
      if (Math.abs(J) < 0.05) { ctx.fillText('알짜', ax, mid - 3); ctx.fillText('이동 없음', ax, mid + 12); }
      else {
        var len = 10 + Math.min(1, Math.abs(J) / 8) * 22, dir = J > 0 ? 1 : -1;
        ctx.strokeStyle = T.figAccent; ctx.fillStyle = T.figAccent; ctx.lineWidth = 3 + Math.min(4, Math.abs(J) / 2);
        ctx.beginPath(); ctx.moveTo(ax, mid - dir * len); ctx.lineTo(ax, mid + dir * (len - 6)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax, mid + dir * (len + 4)); ctx.lineTo(ax - 8, mid + dir * (len - 8)); ctx.lineTo(ax + 8, mid + dir * (len - 8)); ctx.fill();
      }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText(info.mol, r.x + r.w - 6, r.y + 16);
    }
    function drawGraph(T, r) {
      var L = r.x + 46, R = r.x + r.w - 12, Tp = r.y + 30, B = r.y + r.h - 40;
      var sx = function (d) { return L + (d + CMAX) / (2 * CMAX) * (R - L); };
      var sy = function (j) { return (Tp + B) / 2 - j / 10 * (B - Tp) / 2; };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'right';
      [-10, -5, 0, 5, 10].forEach(function (j) { ctx.beginPath(); ctx.moveTo(L, sy(j)); ctx.lineTo(R, sy(j)); ctx.stroke(); ctx.fillText(j, L - 5, sy(j) + 4); });
      ctx.textAlign = 'center';
      [-10, -5, 0, 5, 10].forEach(function (d) { ctx.beginPath(); ctx.moveTo(sx(d), Tp); ctx.lineTo(sx(d), B); ctx.stroke(); ctx.fillText(d, sx(d), B + 14); });
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sx(0), Tp); ctx.lineTo(sx(0), B); ctx.moveTo(L, sy(0)); ctx.lineTo(R, sy(0)); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('농도 차 (세포 밖 − 세포 안)', (L + R) / 2, B + 30);
      ctx.textAlign = 'left'; ctx.fillText('이동 속도 (안으로 +)', L, Tp - 14);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody;
      ctx.fillText('세포 안 농도 ' + st.ci + '으로 두고 밖 농도를 바꿀 때', L, Tp - 1);
      function curve(mode, color, lw, dash) {
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash || []);
        ctx.beginPath();
        for (var i = 0; i <= 100; i++) {
          var co = CMAX * i / 100, d = co - st.ci, j = flux(mode, co, st.ci);
          if (i === 0) ctx.moveTo(sx(d), sy(j)); else ctx.lineTo(sx(d), sy(j));
        }
        ctx.stroke(); ctx.setLineDash([]);
      }
      var others = ['simple', 'facil', 'active'].filter(function (k) { return k !== st.mode; });
      others.forEach(function (k) { curve(k, T.figLine, 1.3, [4, 4]); });
      var col = st.mode === 'simple' ? T.figRed : st.mode === 'facil' ? T.figGreen : T.figViolet;
      curve(st.mode, col, 2.8);
      var J = flux(st.mode, st.co, st.ci), d = st.co - st.ci;
      ctx.fillStyle = col; ctx.strokeStyle = T.figPanel; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx(d), sy(J), 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // 곡선 이름표
      ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'right';
      var lab = [['simple', '단순 확산'], ['facil', '촉진 확산'], ['active', '능동 수송']];
      lab.forEach(function (p) {
        var co = CMAX, dd = co - st.ci, jj = flux(p[0], co, st.ci);
        ctx.fillStyle = p[0] === st.mode ? col : T.figMuted;
        var yy = sy(jj) + (p[0] === 'facil' ? 14 : -6);
        if (p[0] === 'active') yy = sy(jj) + (jj > flux('facil', co, st.ci) ? -6 : 14);
        ctx.fillText(p[1], Math.min(sx(dd), R), Math.max(Tp + 10, Math.min(B - 4, yy)));
      });
      if (st.mode === 'facil') {
        var plateau = VF * (1 - st.ci / (KF + st.ci));
        ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figGreen; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(L, sy(plateau)); ctx.lineTo(R, sy(plateau)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figGreen; ctx.textAlign = 'left'; ctx.font = '11px ' + T.fontBody;
        ctx.fillText('운반체가 모두 쓰이면 더 늘지 않음', L + 4, sy(plateau) - 5);
      }
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    function update() {
      var J = flux(st.mode, st.co, st.ci), d = st.co - st.ci;
      rMode.set(modeInfo().name + ' · ' + modeInfo().mol);
      rD.set((d > 0 ? '+' : '') + d);
      var txt = J.toFixed(1);
      if (st.mode === 'active' && J > 0 && d < 0) txt += ' (농도 기울기를 거슬러)';
      if (Math.abs(J) < 0.05) txt = '0 (알짜 이동 없음)';
      rJ.set(txt);
      rE.set(st.mode === 'active' ? (st.atp ? '사용함' : '공급 끊김 → 멈춤') : '쓰지 않음');
      draw();
    }
    api.onResize(function () { st.parts = []; refill(); draw(); });
    refill(); setMode('simple');
    if (api.reduced) loop.pause();
  },
});
