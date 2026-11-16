/* 화학 반응의 세계 2 산화·환원 반응: 두 금속 전극으로 만든 화학 전지와, 외부 전원을 건 전기 분해 비교 */
Sims.register('galvanic-cell', {
  title: '두 금속으로 전지 만들기 — 전자는 어느 쪽으로 흐를까?',
  caption: '왼쪽·오른쪽 전극의 금속을 골라 보자. 표준 환원 전위가 작은 금속이 (−)극(산화 전극), 큰 금속이 (+)극(환원 전극)이 되고, 전자는 도선을 따라 (−)극에서 (+)극으로, 염다리의 이온은 전하를 맞추는 쪽으로 움직인다. ‘전기 분해’를 누르면 외부 전원이 전지 전위보다 큰 전압을 거꾸로 걸어 전자 흐름과 전극 반응이 반대가 된다. 모든 용액은 1 M, 25 ℃의 표준 상태로 가정했고 전위 값은 본문 표를 따랐다. 수용액에서 E°가 물(−0.83 V)보다 훨씬 작은 Mg²⁺는 전기 분해 때 환원되지 않고 물이 대신 환원된다.',
  init: function (api) {
    var METALS = [
      { s: 'Mg', ion: 'Mg²⁺', n: 2, E: -2.37 },
      { s: 'Zn', ion: 'Zn²⁺', n: 2, E: -0.76 },
      { s: 'Fe', ion: 'Fe²⁺', n: 2, E: -0.44 },
      { s: 'Ni', ion: 'Ni²⁺', n: 2, E: -0.26 },
      { s: 'Pb', ion: 'Pb²⁺', n: 2, E: -0.13 },
      { s: 'Cu', ion: 'Cu²⁺', n: 2, E: 0.34 },
      { s: 'Ag', ion: 'Ag⁺', n: 1, E: 0.80 },
    ];
    var E_WATER = -0.83;
    var state = { L: METALS[1], R: METALS[5], mode: 'cell', phase: 0 };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.62 : 0.6; }, label: '두 반쪽 전지, 도선, 염다리와 표준 환원 전위 사다리' });
    var ctx = cv.ctx;

    var rAn = api.readout('산화 전극');
    var rCa = api.readout('환원 전극');
    var rRx = api.readout('전체 반응');
    var rE = api.readout('전위');

    var gM = api.group();
    var bCell = api.button('화학 전지', function () { setMode('cell'); }, { toggle: true, pressed: true, parent: gM });
    var bEl = api.button('전기 분해 (외부 전원)', function () { setMode('elec'); }, { toggle: true, pressed: false, parent: gM });
    var gL = api.group(); gL.appendChild(api.el('span', 'sim-glabel', '왼쪽 전극 '));
    var lBtns = METALS.map(function (m) { return api.button(m.s, function () { pick('L', m); }, { toggle: true, pressed: m === state.L, parent: gL }); });
    var gR = api.group(); gR.appendChild(api.el('span', 'sim-glabel', '오른쪽 전극 '));
    var rBtns = METALS.map(function (m) { return api.button(m.s, function () { pick('R', m); }, { toggle: true, pressed: m === state.R, parent: gR }); });
    [gL, gR].forEach(function (g) { var s = g.querySelector('.sim-glabel'); s.style.alignSelf = 'center'; s.style.fontSize = '0.9em'; });

    function pick(side, m) {
      state[side] = m;
      (side === 'L' ? lBtns : rBtns).forEach(function (b, i) { b.setAttribute('aria-pressed', METALS[i] === m ? 'true' : 'false'); });
      update();
    }
    function setMode(m) {
      state.mode = m;
      bCell.setAttribute('aria-pressed', m === 'cell' ? 'true' : 'false');
      bEl.setAttribute('aria-pressed', m === 'elec' ? 'true' : 'false');
      update();
    }
    function fmtE(e) { return (e > 0 ? '+' : e < 0 ? '−' : '') + Math.abs(e).toFixed(2); }
    function paren(e) { return e < 0 ? '(' + fmtE(e) + ')' : Math.abs(e).toFixed(2); }
    function co(k) { return k === 1 ? '' : String(k); }
    function eN(n) { return (n === 1 ? '' : n) + 'e⁻'; }

    // 어느 쪽이 산화 전극(anode)인가: 전지 → E°가 작은 쪽, 전기 분해 → E°가 큰 쪽(전원 (+)극 쪽)
    function roles() {
      var L = state.L, R = state.R, same = L === R;
      var hiSide = same ? 'R' : (L.E > R.E ? 'L' : 'R'), loSide = hiSide === 'L' ? 'R' : 'L';
      var anSide = state.mode === 'cell' ? loSide : hiSide;
      var caSide = anSide === 'L' ? 'R' : 'L';
      var an = state[anSide], ca = state[caSide];
      var water = state.mode === 'elec' && ca.E < E_WATER - 0.5;
      return { same: same, hiSide: hiSide, anSide: anSide, caSide: caSide, an: an, ca: ca, water: water,
        flow: !(same && state.mode === 'cell'), Ecell: Math.abs(L.E - R.E) };
    }
    function halfAn(r) { return r.an.s + ' → ' + r.an.ion + ' + ' + eN(r.an.n); }
    function halfCa(r) { return r.water ? '2H₂O + 2e⁻ → H₂ + 2OH⁻' : r.ca.ion + ' + ' + eN(r.ca.n) + ' → ' + r.ca.s; }
    function overall(r) {
      if (r.same) return state.mode === 'cell' ? '반응 없음' : r.an.s + '(산화 전극)이 녹고 같은 양이 환원 전극에 석출';
      var na = r.an.n, nc = r.water ? 2 : r.ca.n, l = na * nc / gcd(na, nc), ka = l / na, kc = l / nc;
      if (r.water) return co(ka) + r.an.s + ' + ' + co(2 * kc) + 'H₂O → ' + co(ka) + r.an.ion + ' + ' + co(kc) + 'H₂ + ' + co(2 * kc) + 'OH⁻';
      return co(ka) + r.an.s + ' + ' + co(kc) + r.ca.ion + ' → ' + co(ka) + r.an.ion + ' + ' + co(kc) + r.ca.s;
    }
    function gcd(a, b) { return b ? gcd(b, a % b) : a; }

    function readouts() {
      var r = roles();
      if (!r.flow) { rAn.set('없음'); rCa.set('없음'); rRx.set('반응 없음'); rE.set('E°전지 = 0 V (같은 금속)'); return; }
      var sideName = function (s) { return s === 'L' ? '왼쪽' : '오른쪽'; };
      rAn.set(sideName(r.anSide) + ' ' + r.an.s + (state.mode === 'cell' ? ' · (−)극' : ' · 전원 (+)극 쪽'));
      rCa.set(sideName(r.caSide) + ' ' + r.ca.s + (state.mode === 'cell' ? ' · (+)극' : ' · 전원 (−)극 쪽'));
      rRx.set(overall(r));
      if (state.mode === 'cell') {
        rE.set('E°전지 = ' + Math.max(r.ca.E, r.an.E).toFixed(2) + ' − ' + paren(Math.min(r.ca.E, r.an.E)) + ' = ' + r.Ecell.toFixed(2) + ' V');
      } else {
        var need = r.water ? r.an.E - E_WATER : r.Ecell;
        rE.set('외부 전압 > ' + need.toFixed(2) + ' V 필요 (이론값)');
      }
    }

    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { narrow: true, cell: { x: 0, y: 0, w: w, h: h * 0.64 }, lad: { x: 0, y: h * 0.66, w: w, h: h * 0.34 } };
      return { narrow: false, cell: { x: 0, y: 0, w: w * 0.7, h: h }, lad: { x: w * 0.72, y: 0, w: w * 0.28, h: h } };
    }

    function draw() {
      var T = api.tokens(), P = layout(), r = roles();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawCell(T, P.cell, r, P.narrow);
      drawLadder(T, P.lad, r, P.narrow);
    }

    function solColor(T, m) { return m.s === 'Cu' ? T.figSoftBlue : m.s === 'Ni' ? T.figSoftGreen : m.s === 'Fe' ? T.figSoftAmber : T.figSoftTeal; }

    function drawCell(T, c, r, narrow) {
      var fs = narrow ? 11 : 12;
      var bw = Math.min(c.w * 0.36, 190), bh = Math.min(c.h * 0.36, 150);
      var cx = { L: c.x + c.w * 0.24, R: c.x + c.w * 0.76 };
      var textH = narrow ? 82 : 86;
      var bBot = c.y + c.h - textH, bTop = bBot - bh, solTop = bTop + bh * 0.28;
      var wireY = c.y + (narrow ? 26 : 32), elTop = bTop - 34, elW = 22;
      ctx.lineJoin = 'round';

      // 비커와 용액
      ['L', 'R'].forEach(function (s) {
        var m = state[s], x0 = cx[s] - bw / 2;
        ctx.fillStyle = solColor(T, m); ctx.fillRect(x0, solTop, bw, bBot - solTop);
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0, bTop); ctx.lineTo(x0, bBot); ctx.lineTo(x0 + bw, bBot); ctx.lineTo(x0 + bw, bTop); ctx.stroke();
        ctx.fillStyle = T.figInk; ctx.font = fs + 'px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        var ex = s === 'L' ? cx[s] - bw * 0.2 : cx[s] + bw * 0.2;
        ctx.fillText(m.ion + '(aq) 1 M', s === 'L' ? x0 + bw * 0.62 : x0 + bw * 0.38, bBot - 8);
        // 전극
        var elX = s === 'L' ? cx[s] - bw * 0.2 : cx[s] + bw * 0.2;
        ctx.fillStyle = T.figMuted; ctx.fillRect(elX - elW / 2, elTop, elW, bBot - 14 - elTop);
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.strokeRect(elX - elW / 2, elTop, elW, bBot - 14 - elTop);
        ctx.fillStyle = T.figPanel; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textBaseline = 'middle';
        ctx.fillText(m.s, elX, elTop + 14);
        cx[s + 'el'] = elX; void ex;
      });
      // 물이 환원될 때 기포
      if (r.flow && r.water) {
        var bx = cx[r.caSide + 'el'];
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1;
        [[-16, -10], [15, -26], [-14, -44], [17, -60], [-15, -76]].forEach(function (q) { ctx.beginPath(); ctx.arc(bx + q[0], bBot - 20 + q[1], 3.5, 0, Math.PI * 2); ctx.stroke(); });
        ctx.fillStyle = T.figInk; ctx.font = fs + 'px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('H₂', bx + (r.caSide === 'L' ? -30 : 30), bBot - 80);
      }
      // 염다리
      var tL = cx.L + bw * 0.24, tR = cx.R - bw * 0.24, tTop = bTop - 18, tBot = solTop + 26, tw = 14;
      ctx.strokeStyle = T.figLine; ctx.lineWidth = tw + 3; ctx.lineCap = 'butt';
      tube(); ctx.strokeStyle = T.figSoftViolet; ctx.lineWidth = tw; tube();
      function tube() { ctx.beginPath(); ctx.moveTo(tL, tBot); ctx.lineTo(tL, tTop); ctx.lineTo(tR, tTop); ctx.lineTo(tR, tBot); ctx.stroke(); }
      ctx.fillStyle = T.figViolet; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('염다리 (KNO₃)', (tL + tR) / 2, tTop + 12);
      // 염다리 속 이온 방향
      if (r.flow) {
        var anX = r.anSide === 'L' ? tL : tR, caX = r.anSide === 'L' ? tR : tL, midX = (tL + tR) / 2, yy = tTop + 12 + fs + 8;
        ctx.font = fs + 'px ' + T.fontBody; ctx.textBaseline = 'middle';
        arrowText(midX, yy, anX, 'NO₃⁻', T.figBlue);
        arrowText(midX, yy + fs + 8, caX, 'K⁺', T.figRed);
        // 움직이는 이온(관 위쪽 가로 부분)
        for (var i = 0; i < 4; i++) {
          var f = (state.phase * 0.6 + i / 4) % 1;
          var xa = midX + (anX - midX) * f, xc = midX + (caX - midX) * f;
          ion(xa, tTop, T.figBlue); ion(xc, tTop, T.figRed);
        }
      }
      function arrowText(x0, y0, toX, label, col) {
        var dir = toX < x0 ? -1 : 1, len = Math.min(56, Math.abs(toX - x0) - 6);
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0 + dir * 4, y0); ctx.lineTo(x0 + dir * len, y0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x0 + dir * (len + 6), y0); ctx.lineTo(x0 + dir * len, y0 - 4); ctx.lineTo(x0 + dir * len, y0 + 4); ctx.fill();
        ctx.textAlign = dir < 0 ? 'left' : 'right';
        ctx.fillText(label, x0 - dir * 6, y0);
      }
      function ion(x, y, col) { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); }

      // 도선과 장치
      var dX = c.x + c.w / 2, dW = narrow ? 84 : 104, dH = narrow ? 30 : 36;
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx.Lel, elTop); ctx.lineTo(cx.Lel, wireY); ctx.lineTo(dX - dW / 2, wireY);
      ctx.moveTo(dX + dW / 2, wireY); ctx.lineTo(cx.Rel, wireY); ctx.lineTo(cx.Rel, elTop); ctx.stroke();
      ctx.fillStyle = state.mode === 'cell' ? T.figPanel : T.figSoftAmber; ctx.strokeStyle = state.mode === 'cell' ? T.figInk : T.figAmber;
      ctx.lineWidth = 2; ctx.fillRect(dX - dW / 2, wireY - dH / 2, dW, dH); ctx.strokeRect(dX - dW / 2, wireY - dH / 2, dW, dH);
      ctx.fillStyle = T.figInk; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '600 ' + (fs + 1) + 'px ' + T.fontBody;
      if (state.mode === 'cell') ctx.fillText((r.flow ? r.Ecell.toFixed(2) : '0.00') + ' V', dX, wireY);
      else {
        ctx.fillText('외부 전원', dX, wireY);
        var plusX = r.hiSide === 'L' ? dX - dW / 2 + 9 : dX + dW / 2 - 9, minusX = r.hiSide === 'L' ? dX + dW / 2 - 9 : dX - dW / 2 + 9;
        ctx.font = '700 ' + (fs + 2) + 'px ' + T.fontBody; ctx.fillStyle = T.figRed; ctx.fillText('+', plusX, wireY); ctx.fillStyle = T.figBlue; ctx.fillText('−', minusX, wireY);
      }
      ctx.fillStyle = T.figMuted; ctx.font = fs + 'px ' + T.fontBody; ctx.textBaseline = 'bottom';
      ctx.fillText(state.mode === 'cell' ? '전압계' : '', dX, wireY - dH / 2 - 2);

      // 전자 흐름 (산화 전극 → 도선 → 환원 전극)
      if (r.flow) {
        var aX = cx[r.anSide + 'el'], kX = cx[r.caSide + 'el'];
        var path = [[aX, elTop], [aX, wireY], [kX, wireY], [kX, elTop]];
        var lens = [], tot = 0;
        for (var k = 0; k < 3; k++) { var d = Math.hypot(path[k + 1][0] - path[k][0], path[k + 1][1] - path[k][1]); lens.push(d); tot += d; }
        var N = 12;
        for (var j = 0; j < N; j++) {
          var sPos = ((state.phase * 0.35 + j / N) % 1) * tot, seg = 0;
          while (seg < 2 && sPos > lens[seg]) { sPos -= lens[seg]; seg++; }
          var ff = Math.min(1, sPos / lens[seg]), px = path[seg][0] + (path[seg + 1][0] - path[seg][0]) * ff, py = path[seg][1] + (path[seg + 1][1] - path[seg][1]) * ff;
          if (Math.abs(px - dX) < dW / 2 + 3 && Math.abs(py - wireY) < 4) continue;
          ctx.beginPath(); ctx.arc(px, py, 3.6, 0, Math.PI * 2); ctx.fillStyle = T.figAmber; ctx.fill();
        }
        // 방향 화살표와 글자 (도선 위)
        var dir = kX > aX ? 1 : -1, ax0 = (aX + dX - dir * dW / 2) / 2;
        ctx.fillStyle = T.figAmber; ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(ax0 - dir * 18, wireY - 12); ctx.lineTo(ax0 + dir * 14, wireY - 12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax0 + dir * 22, wireY - 12); ctx.lineTo(ax0 + dir * 13, wireY - 17); ctx.lineTo(ax0 + dir * 13, wireY - 7); ctx.fill();
        ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textBaseline = 'bottom'; ctx.textAlign = 'center';
        ctx.fillText('전자 e⁻', ax0, wireY - 18);
      }

      // 아래 글자: 전극 역할과 반쪽 반응
      ['L', 'R'].forEach(function (s) {
        var x = cx[s], y = bBot + 6;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        if (!r.flow) { ctx.fillStyle = T.figMuted; ctx.font = fs + 'px ' + T.fontBody; ctx.fillText('반응 없음', x, y); return; }
        var isAn = s === r.anSide, col = isAn ? T.figBlue : T.figRed;
        ctx.fillStyle = col; ctx.font = '600 ' + (fs + 1) + 'px ' + T.fontBody;
        var sign = state.mode === 'cell' ? (isAn ? '(−)극 · ' : '(+)극 · ') : '';
        ctx.fillText(sign + (isAn ? '산화 전극' : '환원 전극'), x, y);
        ctx.font = fs + 'px ' + T.fontBody; ctx.fillStyle = T.figMuted;
        if (state.mode === 'elec') ctx.fillText(isAn ? '전원 (+)극에 연결' : '전원 (−)극에 연결', x, y + fs + 5);
        ctx.fillStyle = T.figInk; ctx.font = fs + 'px ' + T.fontBody;
        ctx.fillText(isAn ? halfAn(r) : halfCa(r), x, y + (state.mode === 'elec' ? 2 : 1) * (fs + 5));
      });
      // 맨 아래: 전위 계산
      ctx.fillStyle = T.figInk; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      var msg;
      if (!r.flow) msg = '두 전극이 같으면 전위차가 0 V → 전류가 흐르지 않는다';
      else if (state.mode === 'cell') msg = 'E°전지 = E°(+극) − E°(−극) = ' + Math.max(state.L.E, state.R.E).toFixed(2) + ' − ' + paren(Math.min(state.L.E, state.R.E)) + ' = ' + r.Ecell.toFixed(2) + ' V';
      else if (r.water) msg = r.ca.ion + ' 대신 물이 환원 → 외부 전압 > ' + (r.an.E - E_WATER).toFixed(2) + ' V';
      else msg = '전지 전위(' + r.Ecell.toFixed(2) + ' V)보다 큰 전압을 거꾸로 걸어 반응을 되돌린다';
      wrap(msg, c.x + c.w / 2, c.y + c.h - 4, c.w - 12, fs + 4);
    }
    function wrap(t, x, yBottom, maxW, lh) {
      var words = t.split(' '), lines = [], cur = '';
      words.forEach(function (wd) { var test = cur ? cur + ' ' + wd : wd; if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = test; });
      lines.push(cur);
      lines.forEach(function (ln, i) { ctx.fillText(ln, x, yBottom - (lines.length - 1 - i) * lh); });
    }

    function drawLadder(T, lr, r, narrow) {
      var fs = narrow ? 11 : 12, top = lr.y + (narrow ? 22 : 40), bot = lr.y + lr.h - (narrow ? 8 : 30);
      var EMAX = 1.0, EMIN = -2.5, ax = lr.x + (narrow ? lr.w * 0.36 : 56);
      var sy = function (e) { return top + (EMAX - e) / (EMAX - EMIN) * (bot - top); };
      ctx.fillStyle = T.figInk; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.textAlign = narrow ? 'center' : 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('표준 환원 전위 E° (V)', narrow ? lr.x + lr.w / 2 : lr.x + 4, top - (narrow ? 6 : 22));
      if (!narrow) { ctx.font = fs + 'px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.fillText('↑ 환원되기 쉬움', lr.x + 4, top - 6); ctx.textBaseline = 'top'; ctx.fillText('↓ 산화되기 쉬움', lr.x + 4, bot + 8); }
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax, top); ctx.lineTo(ax, bot); ctx.stroke();
      var items = METALS.map(function (m) { return { t: m.ion + '/' + m.s + '  ' + fmtE(m.E), E: m.E, m: m }; });
      items.push({ t: '2H⁺/H₂  0 (기준)', E: 0, m: null });
      items.sort(function (a, b) { return b.E - a.E; });
      // 글자 자리 겹침 풀기
      var gap = fs + 3;
      items.forEach(function (it) { it.y = sy(it.E); });
      for (var it = 0; it < 30; it++) {
        for (var i = 1; i < items.length; i++) { var d = items[i].y - items[i - 1].y; if (d < gap) { var push = (gap - d) / 2; items[i].y += push; items[i - 1].y -= push; } }
      }
      var lx = ax + 26;
      items.forEach(function (it) {
        var chosen = it.m && (it.m === state.L || it.m === state.R);
        var col = !it.m ? T.figMuted : chosen ? (r.flow && it.m === r.an ? T.figBlue : r.flow && it.m === r.ca ? T.figRed : T.figInk) : T.figMuted;
        ctx.strokeStyle = col; ctx.lineWidth = chosen ? 2 : 1;
        ctx.beginPath(); ctx.moveTo(ax - 5, sy(it.E)); ctx.lineTo(ax + 5, sy(it.E)); ctx.lineTo(lx - 4, it.y); ctx.stroke();
        ctx.fillStyle = chosen ? col : T.figMuted; ctx.font = (chosen ? '600 ' : '') + fs + 'px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(it.t, lx, it.y);
        if (chosen) { ctx.beginPath(); ctx.arc(ax, sy(it.E), 4.5, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); }
      });
      // 두 전극 사이의 전위차
      if (state.L !== state.R) {
        var y1 = sy(Math.max(state.L.E, state.R.E)), y2 = sy(Math.min(state.L.E, state.R.E)), bx = ax - 16;
        ctx.strokeStyle = T.figAccent; ctx.fillStyle = T.figAccent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx, y1 + 2); ctx.lineTo(bx, y2 - 2); ctx.stroke();
        [[y1, 1], [y2, -1]].forEach(function (q) { ctx.beginPath(); ctx.moveTo(bx, q[0]); ctx.lineTo(bx - 4, q[0] + q[1] * 7); ctx.lineTo(bx + 4, q[0] + q[1] * 7); ctx.fill(); });
        ctx.save(); ctx.translate(bx - 9, (y1 + y2) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.fillText(Math.abs(state.L.E - state.R.E).toFixed(2) + ' V', 0, 0); ctx.restore();
      }
    }

    var loop = api.loop(function (dt) { state.phase += dt; draw(); });
    function update() { readouts(); draw(); if (!api.reduced) loop.play(); }
    api.onResize(draw);
    update();
  },
});
