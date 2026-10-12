/* 4-2 자연선택: 회색가지나방 모의실험 — 새가 눈에 띄는 나방을 더 많이 잡아먹고, 살아남은 나방이 같은 색 자손을 남긴다 */
Sims.register('natural-selection', {
  title: '회색가지나방 모의실험 — 나무껍질 색이 나방 집단을 바꾼다',
  caption: '나무껍질 색을 고르고 \'한 세대 진행\'을 눌러 보자. 새는 나무껍질과 대비가 큰(눈에 띄는) 나방의 50%만, 잘 숨는 나방은 75%를 살려 두고, 살아남은 나방은 같은 색 자손을 남긴다(예제 2와 같은 규칙, 집단 크기는 먹이·공간 때문에 늘 80마리로 둠). 나방 한 마리의 색은 바뀌지 않고 집단 속 비율만 바뀌며, 처음 비율을 0%로 두면 검은 나방은 생기지 않는다 — 변이가 먼저 있어야 환경이 고를 수 있다. 누가 먹힐지는 확률로 정하므로 \'다시 하기\'마다 결과가 조금씩 다르고, 점선은 무작위가 없을 때의 계산값이다(몸 색이 그대로 유전된다고 보는 등 설명을 위해 단순화).',
  init: function (api) {
    var K = 80, S_HIDE = 0.75, S_SEEN = 0.5, GMAX = 60;
    var BARK = {
      light: { base: '#d6d0c0', streak: '#c2bba9', spot: '#e9e5d8', lichen: '#bcc4a8', name: '깨끗한 나무껍질' },
      dark: { base: '#3a3632', streak: '#2a2724', spot: '#46413c', lichen: '#2f2c29', name: '그을음 낀 나무껍질' },
    };
    var MOTH = { light: { wing: '#ebe6d8', mark: '#a59e8f' }, dark: { wing: '#24211e', mark: '#3e3a35' } };
    var state = { bark: 'dark', init: 20, pop: [], hist: [], phase: 'rest', t: 0, victims: null, next: null, last: null, auto: false };
    var nextId = 1;

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.32 : 0.56; }, label: '나무줄기 위의 나방 집단과 세대별 검은 나방 비율 그래프' });
    var ctx = cv.ctx;

    var rGen = api.readout('세대');
    var rDark = api.readout('검은 나방 (모의실험)');
    var rExp = api.readout('계산값 (무작위 없을 때)');
    var rEat = api.readout('이번 세대에 먹힌 나방');

    var g = api.group();
    var barkBtns = ['light', 'dark'].map(function (k) {
      return api.button(BARK[k].name, function () { setBark(k); }, { toggle: true, pressed: k === state.bark, parent: g });
    });
    var g2 = api.group();
    var stepBtn = api.button('한 세대 진행', function () { stopAuto(); step(); }, { primary: true, parent: g2 });
    var autoBtn = api.button(api.reduced ? '10세대 한꺼번에' : '자동 진행', function () { toggleAuto(); }, { toggle: !api.reduced, parent: g2 });
    api.button('다시 하기', function () { reset(); }, { parent: g2 });
    var mutBtn = api.button('돌연변이 1마리', function () { mutate(); }, { parent: g2 });
    mutBtn.title = '수가 적은 쪽 색의 자손이 돌연변이로 1마리 태어난다';
    api.slider({ id: 'natural-selection-init', label: '처음 검은 나방 비율', min: 0, max: 100, step: 5, value: state.init,
      format: function (v) { return v + '% (' + Math.round(K * v / 100) + '마리)'; },
      onInput: function (v) { state.init = v; reset(); } });

    /* ── 모형 ── */
    function survive(dark) { return (dark === (state.bark === 'dark')) ? S_HIDE : S_SEEN; }
    function place(list) {
      var cols = 10, rows = 9, cells = [];
      for (var i = 0; i < cols * rows; i++) cells.push(i);
      shuffle(cells);
      list.forEach(function (m, i) {
        var c = cells[i % cells.length];
        m.u = ((c % cols) + 0.5 + (Math.random() - 0.5) * 0.45) / cols;
        m.v = (Math.floor(c / cols) + 0.5 + (Math.random() - 0.5) * 0.4) / rows;
        m.rot = (Math.random() - 0.5) * 0.7;
      });
      return list;
    }
    function moth(dark) { return { id: nextId++, dark: dark, u: 0, v: 0, rot: 0, seed: Math.random() }; }
    function countDark(p) { return p.filter(function (m) { return m.dark; }).length; }
    function frac(p) { return p.length ? countDark(p) / p.length : 0; }
    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function expNext(e) { var d = e * survive(true), l = (1 - e) * survive(false); return d + l > 0 ? d / (d + l) : e; }

    function reset() {
      stopAuto();
      var nd = Math.round(K * state.init / 100), pop = [];
      for (var i = 0; i < K; i++) pop.push(moth(i < nd));
      state.pop = place(pop);
      state.hist = [{ f: frac(pop), e: frac(pop), bark: state.bark }];
      state.phase = 'rest'; state.victims = null; state.next = null; state.last = null;
      readouts(); draw();
    }
    function setBark(k) {
      state.bark = k;
      barkBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', ['light', 'dark'][i] === k ? 'true' : 'false'); });
      state.hist[state.hist.length - 1].bark = k;
      draw();
    }
    function mutate() {
      if (state.phase !== 'rest' || !state.pop.length) return;
      var nd = countDark(state.pop), wantDark = nd <= state.pop.length - nd;
      var others = state.pop.filter(function (m) { return m.dark !== wantDark; });
      var gone = others[Math.floor(Math.random() * others.length)];
      var nm = moth(wantDark); nm.u = gone.u; nm.v = gone.v; nm.rot = gone.rot; nm.mutant = true;
      state.pop[state.pop.indexOf(gone)] = nm;
      var h = state.hist[state.hist.length - 1]; h.f = frac(state.pop); h.e = h.f;
      readouts(); draw();
    }
    /* 한 세대: ① 새의 포식(확률) ② 살아남은 나방이 같은 색 자손 2마리 ③ 먹이·공간 한계로 집단은 K마리로 유지(넘치면 무작위로 덜어 내고, 모자라면 살아남은 나방의 자손을 무작위로 더함) */
    function compute() {
      var victims = {}, surv = [], eatL = 0, eatD = 0;
      state.pop.forEach(function (m) {
        if (Math.random() < survive(m.dark)) surv.push(m);
        else { victims[m.id] = 0.1 + Math.random() * 0.9; if (m.dark) eatD++; else eatL++; }
      });
      var kids = [];
      surv.forEach(function (m) { kids.push(moth(m.dark), moth(m.dark)); });
      shuffle(kids);
      if (kids.length > K) kids = kids.slice(0, K);
      while (kids.length && kids.length < K) kids.push(moth(surv[Math.floor(Math.random() * surv.length)].dark));
      var prev = state.hist[state.hist.length - 1];
      return { victims: victims, kids: place(kids), eatL: eatL, eatD: eatD, e: expNext(prev.e) };
    }
    function commit(r) {
      state.hist[state.hist.length - 1].bark = state.bark;
      state.pop = r.kids;
      state.hist.push({ f: frac(r.kids), e: r.e, bark: state.bark });
      state.last = r; state.victims = null; state.next = null; state.phase = 'rest';
      readouts();
    }
    function step() {
      if (state.phase !== 'rest' || state.hist.length > GMAX || !state.pop.length) return false;
      var r = compute();
      if (api.reduced) { commit(r); draw(); return true; }
      state.victims = r.victims; state.next = r; state.phase = 'hunt'; state.t = 0;
      loop.play();
      return true;
    }
    function toggleAuto() {
      if (api.reduced) { for (var i = 0; i < 10; i++) step(); return; }
      state.auto = !state.auto;
      autoBtn.setAttribute('aria-pressed', state.auto ? 'true' : 'false');
      if (state.auto && state.phase === 'rest') { if (!step()) stopAuto(); }
    }
    function stopAuto() { state.auto = false; if (!api.reduced) autoBtn.setAttribute('aria-pressed', 'false'); }

    var HUNT = 1.5, BREED = 0.8;
    var loop = api.loop(function (dt) {
      state.t += dt * (state.auto ? 1.6 : 1);
      if (state.phase === 'hunt' && state.t >= HUNT) { state.phase = 'breed'; state.t = 0; }
      else if (state.phase === 'breed' && state.t >= BREED) {
        commit(state.next);
        if (state.auto) { if (!step()) { stopAuto(); loop.pause(); } }
        else loop.pause();
      }
      draw();
    });
    loop.pause();

    function readouts() {
      var h = state.hist[state.hist.length - 1], n = state.pop.length, nd = countDark(state.pop);
      rGen.set((state.hist.length - 1) + '세대');
      rDark.set(nd + ' / ' + n + '마리 (' + (h.f * 100).toFixed(1) + '%)');
      rExp.set((h.e * 100).toFixed(1) + '%');
      rEat.set(state.last ? '밝은 ' + state.last.eatL + ' · 검은 ' + state.last.eatD : '–');
    }

    /* ── 그리기 ── */
    function panel() {
      var w = cv.w, h = cv.h;
      return w < 560
        ? { scene: { x: 0, y: 0, w: w, h: h * 0.46 }, graph: { x: 0, y: h * 0.49, w: w, h: h * 0.51 } }
        : { scene: { x: 0, y: 0, w: w * 0.47, h: h }, graph: { x: w * 0.51, y: 0, w: w * 0.49, h: h } };
    }
    function draw() {
      var T = api.tokens(), P = panel();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawScene(T, P.scene); drawGraph(T, P.graph);
    }
    function rng(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
    function drawScene(T, r) {
      var B = BARK[state.bark];
      var msg = state.phase === 'hunt' ? '① 새가 눈에 띄는 나방을 잡아먹는 중…'
        : state.phase === 'breed' ? '② 살아남은 나방이 같은 색 자손을 남긴다'
        : (state.hist.length - 1) + '세대 · ' + B.name;
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(msg, r.x + 2, r.y + 15);
      var tx = r.x + 2, ty = r.y + 26, tw = r.w - 4, th = r.h - 30;
      // 나무껍질 (실제 밝기를 보여 주어야 하므로 고정 색)
      ctx.save();
      roundRect(tx, ty, tw, th, 10); ctx.fillStyle = B.base; ctx.fill(); ctx.clip();
      var R = rng(state.bark === 'dark' ? 7 : 3);
      for (var i = 0; i < 46; i++) {
        var x = tx + R() * tw, wdt = 2 + R() * 5;
        ctx.fillStyle = R() < 0.6 ? B.streak : B.spot;
        ctx.fillRect(x, ty, wdt, th);
      }
      for (var j = 0; j < 22; j++) {
        ctx.beginPath(); ctx.ellipse(tx + R() * tw, ty + R() * th, 6 + R() * 14, 4 + R() * 8, R() * 3, 0, Math.PI * 2);
        ctx.fillStyle = j % 2 ? B.lichen : B.spot; ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; roundRect(tx, ty, tw, th, 10); ctx.stroke();
      // 나방
      var pad = 8, iw = tw - pad * 2, ih = th - pad * 2;
      var s = Math.max(6, Math.min(iw / 10 * 0.42, ih / 9 * 0.62, 14));
      var showOld = state.phase !== 'breed' || state.t < BREED * 0.5;
      var a = state.phase === 'breed' ? Math.abs(1 - state.t / (BREED * 0.5)) : 1;
      if (showOld) {
        state.pop.forEach(function (m) {
          var x = tx + pad + m.u * iw, y = ty + pad + m.v * ih;
          var vt = state.victims && state.victims[m.id];
          if (vt != null) {
            var k = (state.phase === 'hunt' ? state.t / HUNT : 1) - vt * 0.7;
            if (k > 0) {
              var ring = Math.min(1, k / 0.12);
              if (k < 0.3) drawMoth(x, y, s, m, 1 - k / 0.3);
              ctx.strokeStyle = T.figRed; ctx.lineWidth = 2; ctx.globalAlpha = state.phase === 'breed' ? a : 1;
              ctx.beginPath(); ctx.arc(x, y, s * (0.8 + 0.5 * ring), 0, Math.PI * 2); ctx.stroke();
              ctx.beginPath(); ctx.moveTo(x - s * 0.45, y - s * 0.45); ctx.lineTo(x + s * 0.45, y + s * 0.45);
              ctx.moveTo(x + s * 0.45, y - s * 0.45); ctx.lineTo(x - s * 0.45, y + s * 0.45); ctx.stroke();
              ctx.globalAlpha = 1;
              return;
            }
          }
          drawMoth(x, y, s, m, state.phase === 'breed' ? a : 1);
          if (m.mutant && state.phase === 'rest') { ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, s * 1.25, 0, Math.PI * 2); ctx.stroke(); }
        });
      } else {
        state.next.kids.forEach(function (m) { drawMoth(tx + pad + m.u * iw, ty + pad + m.v * ih, s, m, a); });
      }
      if (!state.pop.length) {
        ctx.fillStyle = T.figRed; ctx.font = '600 14px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('나방이 모두 사라졌다', tx + tw / 2, ty + th / 2);
      }
    }
    function drawMoth(x, y, s, m, alpha) {
      var C = m.dark ? MOTH.dark : MOTH.light;
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(m.rot);
      ctx.fillStyle = C.wing; ctx.strokeStyle = m.dark ? 'rgba(255,255,255,0.10)' : 'rgba(60,50,40,0.22)'; ctx.lineWidth = 0.8;
      // 앞날개 두 장(쉬는 자세: 넓은 삼각형으로 펼침)
      ctx.beginPath(); ctx.moveTo(0, -s * 0.5); ctx.lineTo(-s * 1.05, s * 0.2); ctx.quadraticCurveTo(-s * 0.7, s * 0.62, -s * 0.05, s * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -s * 0.5); ctx.lineTo(s * 1.05, s * 0.2); ctx.quadraticCurveTo(s * 0.7, s * 0.62, s * 0.05, s * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 날개 점무늬
      var R = rng(Math.floor(m.seed * 1e6) + 1);
      ctx.fillStyle = C.mark;
      for (var i = 0; i < 4; i++) { var sx = (R() - 0.5) * s * 1.2, sy = (R() - 0.1) * s * 0.5; ctx.beginPath(); ctx.arc(sx, sy, s * 0.08, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = m.dark ? '#1a1816' : '#8f887a';
      ctx.beginPath(); ctx.ellipse(0, -s * 0.05, s * 0.12, s * 0.42, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    function drawGraph(T, r) {
      var L = r.x + 46, Rr = r.x + r.w - 10, Tp = r.y + 40, Bt = r.y + r.h - 46;
      var n = state.hist.length - 1, G = Math.max(10, Math.ceil(n / 10) * 10);
      var sx = function (gn) { return L + (gn / G) * (Rr - L); };
      var sy = function (f) { return Bt - f * (Bt - Tp); };
      // 범례
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figAccent; ctx.beginPath(); ctx.arc(L + 4, r.y + 12, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('모의실험', L + 13, r.y + 16);
      var lx = L + 13 + ctx.measureText('모의실험').width + 16;
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(lx, r.y + 12); ctx.lineTo(lx + 20, r.y + 12); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.fillText('계산값', lx + 26, r.y + 16);
      // 격자
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      [0, 25, 50, 75, 100].forEach(function (p) { ctx.beginPath(); ctx.moveTo(L, sy(p / 100)); ctx.lineTo(Rr, sy(p / 100)); ctx.stroke(); ctx.fillText(p, L - 6, sy(p / 100) + 4); });
      ctx.textAlign = 'center';
      var stepT = G <= 10 ? 1 : G <= 20 ? 5 : 10;
      for (var k = 0; k <= G; k += stepT) ctx.fillText(k, sx(k), Bt + 24);
      // 세대별 나무껍질 색 띠
      for (var i = 0; i < G; i++) {
        var bk = i < n ? state.hist[i].bark : state.bark;
        ctx.fillStyle = BARK[bk].base; ctx.fillRect(sx(i), Bt + 3, sx(i + 1) - sx(i) + 0.5, 7);
      }
      ctx.strokeStyle = T.figLine; ctx.strokeRect(L, Bt + 3, Rr - L, 7);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('세대  (아래 띠: 그 세대의 나무껍질 색)', (L + Rr) / 2, Bt + 40);
      ctx.save(); ctx.translate(r.x + 12, (Tp + Bt) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('검은 나방 비율 (%)', 0, 0); ctx.restore();
      // 계산값(점선): 지나온 세대 + 지금 나무껍질이 계속될 때의 앞으로
      var ex = state.hist.map(function (h) { return h.e; }), e = ex[ex.length - 1];
      for (var gn = n + 1; gn <= G; gn++) { e = expNext(e); ex.push(e); }
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.8; ctx.setLineDash([5, 4]); ctx.beginPath();
      ex.forEach(function (v, i) { if (i === 0) ctx.moveTo(sx(i), sy(v)); else ctx.lineTo(sx(i), sy(v)); });
      ctx.stroke(); ctx.setLineDash([]);
      if (n === 0) {
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
        for (var q = 1; q <= 4; q++) {
          var up = ex[q] >= ex[q - 1];
          ctx.fillText((ex[q] * 100).toFixed(1), sx(q) - 3, sy(ex[q]) + (up ? -7 : 15));
        }
      }
      // 모의실험(실선과 점)
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.4; ctx.beginPath();
      state.hist.forEach(function (h, i) { if (i === 0) ctx.moveTo(sx(i), sy(h.f)); else ctx.lineTo(sx(i), sy(h.f)); });
      ctx.stroke();
      var rad = G > 20 ? 2.5 : 4;
      ctx.fillStyle = T.figAccent;
      state.hist.forEach(function (h, i) { ctx.beginPath(); ctx.arc(sx(i), sy(h.f), rad, 0, Math.PI * 2); ctx.fill(); });
      var lh = state.hist[n];
      ctx.font = '600 12px ' + T.fontMono; ctx.textAlign = sx(n) > Rr - 50 ? 'right' : 'left';
      var below = n === 0 ? lh.f < 0.9 : lh.f > 0.85;
      ctx.fillText((lh.f * 100).toFixed(1) + '%', sx(n) + (sx(n) > Rr - 50 ? -8 : 8), sy(lh.f) + (below ? 17 : -8));
    }
    function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    api.onResize(draw);
    reset();
  },
});
