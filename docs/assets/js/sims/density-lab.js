/* 중2-1 물질의 특성: 질량과 부피를 재어 밀도를 구하고(질량–부피 그래프의 기울기), 액체에 넣어 뜨고 가라앉음을 본다 */
Sims.register('density-lab', {
  title: '밀도 실험실 — 재고, 그리고, 띄워 보기',
  caption: '물질과 부피를 고르고 ‘그래프에 점 찍기’를 눌러 질량–부피 그래프에 점을 모아 보자. 같은 물질의 점은 원점을 지나는 한 직선 위에 놓이고, 그 기울기(질량 ÷ 부피)가 밀도이다. 점선은 고른 액체의 밀도 직선으로, 이보다 기울기가 작은 물질은 그 액체에 뜨고 큰 물질은 가라앉는다. 밀도는 약 20 °C, 1기압의 값(얼음은 0 °C)이며, 얼음이 녹는 것과 눈금 읽기 오차는 생각하지 않았다.',
  init: function (api) {
    var SOLIDS = [
      { key: 'au', name: '금', rho: 19.3 }, { key: 'cu', name: '구리', rho: 8.96 }, { key: 'fe', name: '철', rho: 7.87 },
      { key: 'al', name: '알루미늄', rho: 2.70 }, { key: 'ice', name: '얼음', rho: 0.92 },
    ];
    var LIQUIDS = [
      { name: '물', rho: 1.00, color: 'figSoftBlue', line: 'figBlue' }, { name: '식용유', rho: 0.9, color: 'figSoftAmber', line: 'figAmber' },
      { name: '에탄올', rho: 0.79, color: 'figSoftTeal', line: 'figTeal' }, { name: '수은', rho: 13.6, color: 'figPanel', line: 'figMuted' },
    ];
    var COLORS = { au: 'figAmber', cu: 'figRed', fe: 'figMuted', al: 'figBlue', ice: 'figTeal' };
    var WATER0 = 30, MMAX = 200, VMAX = 20;
    var state = { s: 3, v: 20, l: 0, pts: [{ s: 3, v: 10 }, { s: 3, v: 20 }], y: 1 };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.85 : 0.5; }, label: '질량과 부피 측정, 질량–부피 그래프, 액체에 넣은 모습' });
    var ctx = cv.ctx;
    var rM = api.readout('질량'), rV = api.readout('부피'), rD = api.readout('밀도 = 질량 ÷ 부피'), rF = api.readout('액체에 넣으면');

    function mass() { return Math.round(SOLIDS[state.s].rho * state.v * 10) / 10; }
    var g1 = api.group();
    var sBtns = SOLIDS.map(function (m, i) { return api.button(m.name, function () { state.s = i; sync(); drop(); }, { toggle: true, pressed: i === state.s, parent: g1 }); });
    api.slider({ id: 'density-lab-v', label: '조각의 부피', min: 2, max: VMAX, step: 1, value: state.v,
      format: function (v) { return v + ' cm³'; }, onInput: function (v) { state.v = v; sync(); draw(); } });
    var g2 = api.group();
    var lBtns = LIQUIDS.map(function (l, i) { return api.button('액체: ' + l.name, function () { state.l = i; sync(); drop(); }, { toggle: true, pressed: i === state.l, parent: g2 }); });
    api.button('그래프에 점 찍기', function () {
      state.pts.push({ s: state.s, v: state.v }); if (state.pts.length > 30) state.pts.shift(); draw();
    }, { primary: true });

    function sync() {
      sBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === state.s ? 'true' : 'false'); });
      lBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === state.l ? 'true' : 'false'); });
      var m = mass(), d = m / state.v, L = LIQUIDS[state.l], S = SOLIDS[state.s];
      rM.set(m.toFixed(1) + ' g'); rV.set(state.v + ' cm³ (눈금 ' + WATER0 + ' → ' + (WATER0 + state.v) + ' mL)');
      rD.set(d.toFixed(2) + ' g/cm³');
      rF.set(L.name + '(' + L.rho + ')에서 ' + (S.rho < L.rho ? '뜬다' : '가라앉는다'));
    }
    var loop = api.loop(function (dt) { if (!(dt > 0)) return; state.y = Math.min(1, state.y + dt * 1.6); draw(); if (state.y >= 1) loop.pause(); });
    loop.pause();
    function drop() { if (api.reduced) { state.y = 1; draw(); return; } state.y = 0; loop.play(); }

    function panels() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { meas: { x: 0, y: 0, w: w, h: h * 0.3 }, graph: { x: 0, y: h * 0.31, w: w, h: h * 0.4 }, tank: { x: 0, y: h * 0.72, w: w, h: h * 0.28 } };
      return { meas: { x: 0, y: 0, w: w * 0.3, h: h }, graph: { x: w * 0.31, y: 0, w: w * 0.42, h: h }, tank: { x: w * 0.74, y: 0, w: w * 0.26, h: h } };
    }
    function title(T, t, x, y) { ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(t, x, y); }
    function cube(T, x, y, s, key) {   // (x, y) = 아래 가운데
      ctx.fillStyle = T[COLORS[key]]; ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2;
      ctx.fillRect(x - s / 2, y - s, s, s); ctx.strokeRect(x - s / 2, y - s, s, s);
    }
    function side() { return 10 + Math.cbrt(state.v / VMAX) * 22; }

    function draw() {
      var T = api.tokens(), P = panels();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawMeas(T, P.meas); drawGraph(T, P.graph); drawTank(T, P.tank);
    }
    function drawMeas(T, r) {
      var S = SOLIDS[state.s], narrow = cv.w < 560;
      title(T, '① 질량과 부피 재기', r.x + r.w / 2, r.y + 16);
      // 전자저울
      var bx = r.x + r.w * 0.27, by = r.y + r.h * (narrow ? 0.82 : 0.6), bw = Math.min(110, r.w * 0.44);
      cube(T, bx, by - 14, side(), S.key);
      ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5;
      ctx.fillRect(bx - bw / 2, by - 14, bw, 6); ctx.strokeRect(bx - bw / 2, by - 14, bw, 6);
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(bx - bw / 2 - 4, by - 8, bw + 8, 30); ctx.strokeRect(bx - bw / 2 - 4, by - 8, bw + 8, 30);
      ctx.fillStyle = T.figPanel; ctx.fillRect(bx - 36, by - 2, 72, 18);
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontMono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(mass().toFixed(1) + ' g', bx, by + 7);
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody; ctx.fillText('전자저울', bx, by + 36);
      // 눈금실린더 (물 30 mL + 조각 부피)
      var cx = r.x + r.w * 0.75, top = r.y + 32, bot = r.y + r.h - 48, cw = 34, vmax = 60;
      var yOf = function (mL) { return bot - (mL / vmax) * (bot - top); };
      var level = WATER0 + state.v;
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(cx - cw / 2, yOf(level), cw, bot - yOf(level));
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - cw / 2, top); ctx.lineTo(cx - cw / 2, bot); ctx.lineTo(cx + cw / 2, bot); ctx.lineTo(cx + cw / 2, top); ctx.stroke();
      ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (var m = 0; m <= vmax; m += 10) { var yy = yOf(m); ctx.beginPath(); ctx.moveTo(cx - cw / 2, yy); ctx.lineTo(cx - cw / 2 + 8, yy); ctx.stroke(); ctx.fillStyle = T.figMuted; ctx.fillText(m, cx - cw / 2 - 4, yy); }
      var s = Math.min(side(), cw - 8); cube(T, cx, bot - 2, s, S.key);
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - cw / 2, yOf(level)); ctx.lineTo(cx + cw / 2, yOf(level)); ctx.stroke();
      ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - cw / 2, yOf(WATER0)); ctx.lineTo(cx + cw / 2, yOf(WATER0)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(level + ' mL', cx + cw / 2 + 4, yOf(level)); ctx.fillStyle = T.figMuted; ctx.fillText(WATER0 + ' mL', cx + cw / 2 + 4, yOf(WATER0) + 12);
      ctx.textAlign = 'center'; ctx.fillText('눈금실린더(물)', cx, bot + 16);
      if (S.key === 'ice') { ctx.fillText('얼음은 가는 막대로 눌러 잠기게 한다', r.x + r.w / 2, bot + 34); }
    }
    function drawGraph(T, r) {
      var L = r.x + 56, R = r.x + r.w - 14, Tp = r.y + 34, B = r.y + r.h - 36;
      var sx = function (v) { return L + v / VMAX * (R - L); }, sy = function (m) { return B - m / MMAX * (B - Tp); };
      title(T, '② 질량–부피 그래프 (기울기 = 밀도)', r.x + r.w / 2, r.y + 16);
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, R - L, B - Tp); ctx.clip();
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      for (var m = 0; m <= MMAX; m += 50) { ctx.beginPath(); ctx.moveTo(L, sy(m)); ctx.lineTo(R, sy(m)); ctx.stroke(); }
      for (var v = 0; v <= VMAX; v += 5) { ctx.beginPath(); ctx.moveTo(sx(v), Tp); ctx.lineTo(sx(v), B); ctx.stroke(); }
      // 액체의 밀도 직선
      var Lq = LIQUIDS[state.l];
      ctx.setLineDash([6, 4]); ctx.strokeStyle = T[Lq.line]; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(VMAX), sy(Lq.rho * VMAX)); ctx.stroke(); ctx.setLineDash([]);
      // 점을 찍은 물질의 직선
      var used = {}; state.pts.forEach(function (p) { used[p.s] = true; });
      Object.keys(used).forEach(function (k) {
        var S = SOLIDS[k]; ctx.strokeStyle = T[COLORS[S.key]]; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(VMAX), sy(S.rho * VMAX)); ctx.stroke();
      });
      state.pts.forEach(function (p) {
        var S = SOLIDS[p.s]; ctx.fillStyle = T[COLORS[S.key]]; ctx.strokeStyle = T.figInk; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(sx(p.v), sy(S.rho * p.v), 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
      // 지금 조각(아직 안 찍은 위치)
      var cur = SOLIDS[state.s]; ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx(state.v), sy(mass()), 7, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      // 직선 이름표
      ctx.font = '600 12px ' + T.fontBody; ctx.textBaseline = 'middle';
      var labels = Object.keys(used).map(function (k) { return SOLIDS[k]; });
      labels.push({ name: Lq.name, rho: Lq.rho, liquid: true });
      labels.forEach(function (S) {
        var vEnd = Math.min(VMAX, MMAX / S.rho), x = sx(vEnd), y = sy(S.rho * vEnd);
        var txt = S.name + ' ' + S.rho;
        ctx.fillStyle = S.liquid ? T[Lq.line] : T[COLORS[S.key]];
        if (S.liquid && vEnd >= VMAX) { ctx.textAlign = 'center'; ctx.fillText(txt, sx(VMAX * 0.5), sy(S.rho * VMAX * 0.5) + 12); }
        else if (vEnd < VMAX) { ctx.textAlign = 'center'; ctx.fillText(txt, Math.min(x, R - 30), Tp - 8); }
        else { ctx.textAlign = 'right'; ctx.fillText(txt, R - 2, y - 9); }
      });
      // 축
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      for (m = 0; m <= MMAX; m += 50) ctx.fillText(m, L - 5, sy(m));
      ctx.textAlign = 'center'; for (v = 0; v <= VMAX; v += 5) ctx.fillText(v, sx(v), B + 12);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.fillText('부피 (cm³)', (L + R) / 2, B + 28);
      ctx.save(); ctx.translate(r.x + 10, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('질량 (g)', 0, 0); ctx.restore();
    }
    function drawTank(T, r) {
      var Lq = LIQUIDS[state.l], S = SOLIDS[state.s];
      title(T, '③ ' + Lq.name + '에 넣어 보기', r.x + r.w / 2, r.y + 16);
      var narrow = cv.w < 560, tw = Math.min(r.w * 0.7, 150), tx = r.x + (narrow ? r.w * 0.3 : r.w / 2), top = r.y + 30, bot = r.y + r.h - (narrow ? 30 : 48);
      var surf = top + (bot - top) * 0.3;
      ctx.fillStyle = T[Lq.color]; ctx.fillRect(tx - tw / 2, surf, tw, bot - surf);
      if (Lq.name === '수은') { ctx.fillStyle = T.figLine; ctx.globalAlpha = 0.5; ctx.fillRect(tx - tw / 2, surf, tw, bot - surf); ctx.globalAlpha = 1; }
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx - tw / 2, top); ctx.lineTo(tx - tw / 2, bot); ctx.lineTo(tx + tw / 2, bot); ctx.lineTo(tx + tw / 2, top); ctx.stroke();
      var s = side(), floats = S.rho < Lq.rho;
      // 떠 있을 때 잠기는 깊이는 (물체 밀도 ÷ 액체 밀도)만큼
      var restY = floats ? surf + s * (S.rho / Lq.rho) : bot - 2;
      var startY = top - 4, e = 1 - Math.pow(1 - state.y, 3), y = startY + (restY - startY) * e;
      cube(T, tx, y, s, S.key);
      ctx.fillStyle = floats ? T.figGreen : T.figRed; ctx.font = '600 14px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var msgX = narrow ? r.x + r.w * 0.72 : tx, msgY = narrow ? r.y + r.h * 0.45 : bot + 16;
      if (state.y >= 1) ctx.fillText(S.name + ': ' + (floats ? '뜬다' : '가라앉는다'), msgX, msgY);
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody;
      ctx.fillText(S.rho + (floats ? ' < ' : ' > ') + Lq.rho + ' g/cm³', msgX, msgY + 18);
    }

    api.onResize(draw);
    sync(); draw();
  },
});
