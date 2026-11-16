/* 물리학 3 빛과 물질: 광전 효과 — 문턱 진동수보다 낮으면 아무리 밝아도 전자가 나오지 않는다. 광자 한 개의 에너지 E = hf */
Sims.register('photoelectric', {
  title: '광전 효과 — 빛의 색(진동수)과 밝기(세기)',
  caption: '빛의 진동수와 세기를 바꾸어 금속판에 비춰 보자. 진동수가 문턱 진동수보다 낮으면 세기를 최대로 높여도 전자가 하나도 나오지 않는다. 문턱 진동수보다 높으면 아무리 어두워도 곧바로 전자가 나오고, 세기를 높이면 나오는 전자의 수가 늘어난다. 이 금속은 전자 하나를 떼어 내는 데 최소 2.5 eV가 필요하다고 가정했고(예제 7), 광자 하나가 전자 하나와만 에너지를 주고받으며, 문턱을 넘은 광자는 모두 전자를 떼어 낸다고 단순화했다.',
  init: function (api) {
    var H = 4.136e-15, NEED = 2.5;   // eV·s, eV
    var st = { f: 7.3, I: 60, photons: [], electrons: [], acc: 0, count: 0, clock: 0, seed: 1 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.15 : 0.56; }, label: '금속판에 빛을 비추는 장면과 광자 에너지 그래프' });
    var ctx = cv.ctx;

    var rE = api.readout('광자 한 개의 에너지 E = hf');
    var rTh = api.readout('문턱 진동수');
    var rN = api.readout('나오는 전자');
    api.slider({ id: 'photoelectric-f', label: '빛의 진동수', min: 4, max: 10, step: 0.1, value: st.f, format: function (v) { return v.toFixed(1) + ' × 10¹⁴ Hz (' + colName(v) + ')'; }, onInput: function (v) { st.f = v; changed(); } });
    api.slider({ id: 'photoelectric-i', label: '빛의 세기(밝기)', min: 0, max: 100, step: 5, value: st.I, format: function (v) { return v + ' %'; }, onInput: function (v) { st.I = v; changed(); } });

    function E() { return H * st.f * 1e14; }
    function lam(f) { return 3e8 / (f * 1e14) * 1e9; }
    function colName(f) { var l = lam(f); return l < 380 ? '자외선' : l < 450 ? '보라' : l < 490 ? '파랑' : l < 560 ? '초록' : l < 590 ? '노랑' : l < 620 ? '주황' : l <= 750 ? '빨강' : '적외선'; }
    function rgb(f) {
      var nm = lam(f), r = 0, g = 0, b = 0;
      if (nm < 380) return null;
      if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
      else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else { r = 1; }
      return 'rgb(' + Math.round(255 * r) + ',' + Math.round(220 * g) + ',' + Math.round(255 * b) + ')';
    }
    function photonColor(T) { return rgb(st.f) || T.figViolet; }
    var f0 = NEED / H / 1e14;
    function above() { return E() > NEED + 1e-9; }
    function rnd() { st.seed = (st.seed * 16807) % 2147483647; return st.seed / 2147483647; }
    function readouts() {
      rE.set(E().toFixed(2) + ' eV (' + (E() * 1.6e-19).toExponential(1).replace('e-', ' × 10^-') + ' J)');
      rTh.set(f0.toFixed(2) + ' × 10¹⁴ Hz (광자 에너지 2.5 eV)');
      rN.set(st.I === 0 ? '없음 (빛이 없음)' : above() ? '나온다 — 1초에 약 ' + Math.round(st.I / 100 * 14) + '개 (세기에 비례)' : '하나도 안 나온다 (세기와 상관없음)');
    }
    function changed() {
      readouts();
      if (api.reduced) { snapshot(); draw(); }
      else { loop.play(); if (!loop.playing) draw(); }
    }

    function geo() {
      var w = cv.w, h = cv.h, narrow = w < 560;
      var scene = narrow ? { x: 0, y: 0, w: w, h: h * 0.6 } : { x: 0, y: 0, w: w * 0.6, h: h };
      var graph = narrow ? { x: 0, y: h * 0.62, w: w, h: h * 0.38 } : { x: w * 0.62, y: 0, w: w * 0.38, h: h };
      var plateX = scene.x + scene.w * 0.62, lampX = scene.x + 46, lampY = scene.y + scene.h * 0.25;
      return { scene: scene, graph: graph, plateX: plateX, plateT: scene.y + scene.h * 0.3, plateB: scene.y + scene.h * 0.88, lampX: lampX, lampY: lampY };
    }
    function step(dt) {
      var G = geo();
      st.clock += dt;
      // 광자 만들기: 세기에 비례 (최대 1초에 14개)
      st.acc += dt * st.I / 100 * 14;
      while (st.acc >= 1) {
        st.acc -= 1;
        var ty = G.plateT + 10 + rnd() * (G.plateB - G.plateT - 20);
        st.photons.push({ x: G.lampX + 16, y: G.lampY, tx: G.plateX, ty: ty, p: 0 });
      }
      st.photons.forEach(function (ph) {
        ph.p += dt / 1.1;
        if (ph.p >= 1 && !ph.done) {
          ph.done = true;
          if (above()) {
            var sp = 40 + 60 * Math.sqrt(Math.max(0, E() - NEED));   // 진동수가 클수록 빠르게(정성적)
            var a = -0.9 + rnd() * 1.8;
            st.electrons.push({ x: ph.tx + 4, y: ph.ty, vx: sp * Math.cos(a), vy: sp * Math.sin(a), life: 0 });
            st.count++;
          }
        }
      });
      st.photons = st.photons.filter(function (ph) { return !ph.done; });
      st.electrons.forEach(function (e) { e.x += e.vx * dt; e.y += e.vy * dt; e.life += dt; });
      st.electrons = st.electrons.filter(function (e) { return e.x < G.scene.x + G.scene.w + 10 && e.y > -10 && e.y < cv.h + 10 && e.life < 6; });
    }
    function snapshot() { st.photons = []; st.electrons = []; st.acc = 0; st.seed = 7; for (var i = 0; i < 60; i++) step(0.05); }
    var loop = api.loop(function (dt) { step(dt); draw(); });

    function draw() {
      var T = api.tokens(), G = geo();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawScene(T, G); drawGraph(T, G.graph);
    }
    function drawScene(T, G) {
      var col = photonColor(T);
      // 빛줄기
      ctx.globalAlpha = 0.08 + 0.22 * st.I / 100; ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(G.lampX + 16, G.lampY - 8); ctx.lineTo(G.plateX, G.plateT); ctx.lineTo(G.plateX, G.plateB); ctx.lineTo(G.lampX + 16, G.lampY + 8); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      // 광원
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figInk; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(G.lampX - 26, G.lampY - 14, 42, 28); ctx.fill(); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(G.lampX + 10, G.lampY, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('광원', G.lampX - 5, G.lampY + 28);
      // 금속판
      ctx.fillStyle = T.figSoftAmber; ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(G.plateX, G.plateT, 14, G.plateB - G.plateT); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('금속판', G.plateX + 7, G.plateB + 16);
      // 광자 (작은 물결 묶음)
      st.photons.forEach(function (ph) {
        var x = ph.x + (ph.tx - ph.x) * ph.p, y = ph.y + (ph.ty - ph.y) * ph.p, a = Math.atan2(ph.ty - ph.y, ph.tx - ph.x);
        ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.strokeStyle = col; ctx.lineWidth = 2;
        var wl = 10 - (st.f - 4) * 0.9;
        ctx.beginPath(); for (var k = -12; k <= 0; k++) { var yy = Math.sin(k / wl * Math.PI * 2) * 3.5 * Math.exp(-((k + 6) * (k + 6)) / 30); if (k === -12) ctx.moveTo(k, yy); else ctx.lineTo(k, yy); } ctx.stroke();
        ctx.restore();
      });
      // 전자
      st.electrons.forEach(function (e) {
        ctx.beginPath(); ctx.arc(e.x, e.y, 6, 0, Math.PI * 2); ctx.fillStyle = T.figSoftBlue; ctx.fill(); ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = T.figBlue; ctx.font = '700 10px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('−', e.x, e.y + 0.5); ctx.textBaseline = 'alphabetic';
      });
      // 상태 문구
      var sx = G.scene.x + 12, sy = G.scene.y + G.scene.h - 10;
      ctx.textAlign = 'left'; ctx.font = '600 12px ' + T.fontBody;
      if (st.I === 0) { ctx.fillStyle = T.figMuted; ctx.fillText('빛을 비추지 않고 있다', sx, sy); }
      else if (above()) { ctx.fillStyle = T.figGreen; ctx.fillText('광자 에너지 > 2.5 eV → 전자가 튀어나온다', sx, sy); }
      else { ctx.fillStyle = T.figRed; ctx.fillText('광자 에너지 < 2.5 eV → 밝게 해도 전자가 안 나온다', sx, sy); }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody;
      ctx.fillText(colName(st.f) + ', 세기 ' + st.I + ' %', sx, G.scene.y + 16);
    }
    function drawGraph(T, r) {
      var L = r.x + 44, R = r.x + r.w - 14, Tp = r.y + 30, B = r.y + r.h - 34;
      var X = function (f) { return L + (f - 4) / 6 * (R - L); }, Y = function (e) { return B - e / 4.5 * (B - Tp); };
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('광자 한 개의 에너지 E = hf', r.x + 10, r.y + 16);
      // 가시광선 띠
      for (var f = 4; f <= 7.9; f += 0.05) { var c = rgb(f); if (!c) continue; ctx.fillStyle = c; ctx.globalAlpha = 0.5; ctx.fillRect(X(f), B + 2, X(f + 0.05) - X(f) + 0.5, 5); }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      [0, 1, 2, 3, 4].forEach(function (e) { ctx.beginPath(); ctx.moveTo(L, Y(e)); ctx.lineTo(R, Y(e)); ctx.stroke(); ctx.fillText(e, L - 5, Y(e) + 4); });
      ctx.textAlign = 'center';
      [4, 6, 8, 10].forEach(function (f) { ctx.fillText(f, X(f), B + 19); });
      ctx.font = '11px ' + T.fontBody; ctx.fillText('진동수 (× 10¹⁴ Hz)', (L + R) / 2, B + 32);
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('에너지 (eV)', 0, 0); ctx.restore();
      // 문턱
      ctx.fillStyle = T.figSoftGreen; ctx.globalAlpha = 0.7; ctx.fillRect(X(f0), Tp, R - X(f0), B - Tp); ctx.globalAlpha = 1;
      ctx.strokeStyle = T.figRed; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(L, Y(NEED)); ctx.lineTo(R, Y(NEED)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(f0), Tp); ctx.lineTo(X(f0), B); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figRed; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('전자를 떼어 내는 데 필요한 최소 에너지', L + 4, Y(NEED) - 5);
      ctx.fillText('문턱 진동수', X(f0) + 4, B - 6);
      ctx.fillStyle = T.figGreen; ctx.textAlign = 'right'; ctx.fillText('전자가 나오는 영역', R - 4, Tp + 13);
      // E = hf 직선
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(4), Y(H * 4e14)); ctx.lineTo(X(10), Y(H * 10e14)); ctx.stroke();
      var px = X(st.f), py = Y(E());
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fillStyle = photonColor(T); ctx.fill(); ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.stroke();
    }

    api.onResize(draw);
    readouts();
    if (api.reduced) snapshot();
    draw();
  },
});
