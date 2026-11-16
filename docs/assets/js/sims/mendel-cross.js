/* 중3-6 생식과 유전: 완두 교배 — 어버이 유전자형을 고르면 퍼넷 사각형과 이론 비가 나오고, 씨 100개를 뿌려 무작위 결과를 비교한다 */
Sims.register('mendel-cross', {
  title: '완두 교배 실험 — 퍼넷 사각형과 씨 100개',
  caption: '두 어버이의 유전자형을 고른 뒤 \'씨 100개 뿌리기\'를 여러 번 눌러 보자. 퍼넷 사각형의 칸은 모두 확률이 같고, 여기서 계산한 비는 많이 조사했을 때의 비율이다. 씨 100개의 실제 결과는 뿌릴 때마다 이론값(점선) 근처에서 흩어지며, 점들은 지금까지 뿌린 결과를 모은 것이다. \'두 쌍\'에서는 모양(R, r)과 색(Y, y) 유전자가 서로 다른 염색체에 있어 따로 분리된다고 가정한다(독립의 법칙).',
  init: function (api) {
    var MODES = {
      one: {
        opts: ['RR', 'Rr', 'rr'],
        gametes: function (g) { return [g[0], g[1]]; },
        phen: function (gt) { return gt.indexOf('R') >= 0 ? 0 : 1; },
        names: ['둥근 씨', '주름진 씨'],
        looks: [{ round: true, yellow: true }, { round: false, yellow: true }],
      },
      two: {
        opts: ['RRYY', 'RrYy', 'rryy'],
        gametes: function (g) { var a = [g[0], g[1]], b = [g[2], g[3]], o = []; a.forEach(function (x) { b.forEach(function (y) { o.push(x + y); }); }); return o; },
        phen: function (gt) { var r = gt.indexOf('R') >= 0, y = gt.indexOf('Y') >= 0; return r ? (y ? 0 : 1) : (y ? 2 : 3); },
        names: ['둥글고 노란색', '둥글고 초록색', '주름지고 노란색', '주름지고 초록색'],
        looks: [{ round: true, yellow: true }, { round: true, yellow: false }, { round: false, yellow: true }, { round: false, yellow: false }],
      },
    };
    var state = { mode: 'one', p1: 'Rr', p2: 'Rr', seeds: [], hist: [], shown: 100 };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 2.05 + 210 / w : Math.min(0.44, 300 / w) + 214 / w; }, label: '퍼넷 사각형, 표현형 비율, 씨 100개의 결과' });
    var ctx = cv.ctx;
    var rG = api.readout('유전자형 비');
    var rP = api.readout('표현형 비(이론)');
    var rN = api.readout('이번 씨 100개');

    var gm = api.group();
    var modeBtns = [['one', '한 쌍 (씨 모양)'], ['two', '두 쌍 (모양·색)']].map(function (m) {
      return api.button(m[1], function () { setMode(m[0]); }, { toggle: true, pressed: m[0] === state.mode, parent: gm });
    });
    var g1 = api.group(); g1.appendChild(api.el('span', 'sim-glabel', '어버이 1'));
    var g2 = api.group(); g2.appendChild(api.el('span', 'sim-glabel', '어버이 2'));
    var b1 = [0, 1, 2].map(function (i) { return api.button('', function () { pick(1, i); }, { toggle: true, parent: g1 }); });
    var b2 = [0, 1, 2].map(function (i) { return api.button('', function () { pick(2, i); }, { toggle: true, parent: g2 }); });
    var g3 = api.group();
    api.button('씨 100개 뿌리기', function () { sow(); }, { primary: true, parent: g3 });
    api.button('기록 지우기', function () { state.hist = []; state.seeds = []; sync(); draw(); }, { parent: g3 });

    function M() { return MODES[state.mode]; }
    function setMode(m) {
      state.mode = m; state.p1 = MODES[m].opts[1]; state.p2 = MODES[m].opts[1];
      modeBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', ['one', 'two'][i] === m ? 'true' : 'false'); });
      reset();
    }
    function pick(which, i) { if (which === 1) state.p1 = M().opts[i]; else state.p2 = M().opts[i]; reset(); }
    function reset() { state.hist = []; state.seeds = []; syncBtns(); sow(true); }
    function syncBtns() {
      var o = M().opts;
      b1.forEach(function (b, i) { b.textContent = o[i]; b.setAttribute('aria-pressed', o[i] === state.p1 ? 'true' : 'false'); });
      b2.forEach(function (b, i) { b.textContent = o[i]; b.setAttribute('aria-pressed', o[i] === state.p2 ? 'true' : 'false'); });
    }

    /* ── 유전 계산 ── */
    function norm(gt) {   // 각 유전자 쌍에서 대문자를 앞에: rR → Rr
      var out = '';
      for (var i = 0; i < gt.length; i += 2) {
        var a = gt[i], b = gt[i + 1];
        out += (a === a.toLowerCase() && b !== b.toLowerCase()) ? b + a : a + b;
      }
      return out;
    }
    function child(ga, gb) {   // 생식세포 두 개 → 유전자형 (유전자 위치별로 짝지음)
      var s = '';
      for (var i = 0; i < ga.length; i++) s += ga[i] + gb[i];
      return norm(s);
    }
    function grid() {
      var top = M().gametes(state.p1), left = M().gametes(state.p2), cells = [];
      left.forEach(function (l) { top.forEach(function (t) { cells.push(child(t, l)); }); });
      return { top: top, left: left, cells: cells };
    }
    function gcd(a, b) { return b ? gcd(b, a % b) : a; }
    function ratio(arr) { var g = arr.filter(function (x) { return x > 0; }).reduce(gcd); return arr.map(function (x) { return x / g; }); }
    function theory() {
      var G = grid(), n = G.cells.length, ph = M().names.map(function () { return 0; }), gt = {};
      G.cells.forEach(function (c) { ph[M().phen(c)]++; gt[c] = (gt[c] || 0) + 1; });
      return { G: G, n: n, ph: ph, gt: gt };
    }
    function genoOrder(a, b) {   // 우성 대립유전자가 많은 것부터
      var ua = a.replace(/[a-z]/g, '').length, ub = b.replace(/[a-z]/g, '').length;
      return ub - ua || (a < b ? -1 : 1);
    }

    function sow(quiet) {
      var A = M().gametes(state.p1), B = M().gametes(state.p2), s = [];
      for (var i = 0; i < 100; i++) {
        var gt = child(A[Math.floor(Math.random() * A.length)], B[Math.floor(Math.random() * B.length)]);
        s.push(M().phen(gt));
      }
      state.seeds = s;
      var cnt = M().names.map(function () { return 0; }); s.forEach(function (p) { cnt[p]++; });
      state.hist.push(cnt); if (state.hist.length > 40) state.hist.shift();
      sync();
      if (quiet || api.reduced) { state.shown = 100; draw(); return; }
      state.shown = 0; loop.play();
    }
    var loop = api.loop(function (dt) {
      if (!(dt > 0)) return;
      state.shown = Math.min(100, state.shown + dt * 160);
      draw();
      if (state.shown >= 100) loop.pause();
    });
    loop.pause();

    function sync() {
      var th = theory();
      var keys = Object.keys(th.gt).sort(genoOrder), r = ratio(keys.map(function (k) { return th.gt[k]; }));
      rG.set(keys.length <= 4 ? keys.join(' : ') + ' = ' + r.join(' : ') : keys.length + '가지 (퍼넷 사각형 참고)');
      var idx = [], vals = [];
      th.ph.forEach(function (v, i) { if (v > 0) { idx.push(i); vals.push(v); } });
      var pr = ratio(vals);
      rP.set(idx.length === 1 ? '모두 ' + M().names[idx[0]] : idx.map(function (i) { return M().names[i]; }).join(' : ') + ' = ' + pr.join(' : '));
      var last = state.hist[state.hist.length - 1];
      rN.set(last ? last.map(function (c, i) { return c ? M().names[i] + ' ' + c : null; }).filter(Boolean).join(', ') : '–');
    }

    /* ── 그리기 ── */
    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) {
        var pw = Math.min(w, 330);
        return { pun: { x: (w - pw) / 2, y: 0, w: pw, h: pw * 0.92 }, bars: { x: 0, y: pw * 0.92 + 10, w: w, h: 244 },
          seeds: { x: 0, y: pw * 0.92 + 278, w: w, h: h - (pw * 0.92 + 278) }, cols: 10 };
      }
      var top = Math.min(w * 0.44, 300);
      return { pun: { x: 0, y: 0, w: w * 0.44, h: top }, bars: { x: w * 0.47, y: 0, w: w * 0.53, h: top },
        seeds: { x: 0, y: top + 12, w: w, h: h - top - 12 }, cols: 20 };
    }
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      var th = theory();
      drawPunnett(T, L.pun, th.G);
      drawBars(T, L.bars, th);
      drawSeeds(T, L.seeds, L.cols);
    }
    function seed(T, x, y, r, look) {
      ctx.beginPath();
      if (look.round) ctx.arc(x, y, r, 0, Math.PI * 2);
      else {
        for (var i = 0; i <= 48; i++) {
          var a = i / 48 * Math.PI * 2, rr = r * (0.86 + 0.12 * Math.cos(a * 7));
          var px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.9;
          if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.closePath();
      }
      ctx.fillStyle = look.yellow ? T.figAmber : T.figGreen; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = T.figInk; ctx.stroke();
      if (!look.round) {   // 주름 표시
        ctx.beginPath(); ctx.moveTo(x - r * 0.45, y - r * 0.15); ctx.quadraticCurveTo(x, y + r * 0.25, x + r * 0.45, y - r * 0.15);
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.stroke();
      }
    }
    function drawPunnett(T, R, G) {
      var nT = G.top.length, nL = G.left.length;
      var head = 52, cell = Math.min((R.w - head - 8) / nT, (R.h - head - 8) / nL, 92);
      var gw = head + cell * nT, ox = R.x + (R.w - gw) / 2 + head, oy = R.y + head;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = T.figMuted; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('어버이 1의 생식세포 →', ox + cell * nT / 2, R.y + 12);
      ctx.save(); ctx.translate(ox - head + 10, oy + cell * nL / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('어버이 2의 생식세포 →', 0, 0); ctx.restore();
      ctx.font = '600 14px ' + T.fontMono; ctx.fillStyle = T.figAccent;
      G.top.forEach(function (g, i) { ctx.fillText(g, ox + cell * (i + 0.5), oy - 14); });
      G.left.forEach(function (g, j) { ctx.fillText(g, ox - 24, oy + cell * (j + 0.5)); });
      var big = cell > 60;
      G.cells.forEach(function (c, k) {
        var i = k % nT, j = Math.floor(k / nT), x = ox + i * cell, y = oy + j * cell;
        var p = M().phen(c);
        ctx.fillStyle = p === 0 ? T.figSoftAmber : T.figPanel; ctx.fillRect(x, y, cell, cell);
        ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
        ctx.fillStyle = T.figInk; ctx.font = (big ? '600 15px ' : '600 12px ') + T.fontMono;
        ctx.fillText(c, x + cell / 2, y + cell * 0.32);
        seed(T, x + cell / 2, y + cell * 0.68, Math.min(cell * 0.17, 12), M().looks[p]);
      });
      ctx.textBaseline = 'alphabetic';
    }
    function drawBars(T, R, th) {
      var names = M().names, nP = names.length, labW = state.mode === 'one' ? 78 : 112;
      var x0 = R.x + labW, x1 = R.x + R.w - 14, top = R.y + 30, rowH = Math.min(46, (R.h - 64) / nP);
      var X = function (v) { return x0 + (x1 - x0) * v / 100; };
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('씨 100개 중 개수', R.x + 4, R.y + 16);
      // 눈금
      ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'center';
      var axisY = top + rowH * nP + 6;
      [0, 25, 50, 75, 100].forEach(function (v) {
        ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(v), top - 4); ctx.lineTo(X(v), axisY); ctx.stroke();
        ctx.fillStyle = T.figMuted; ctx.fillText(v, X(v), axisY + 14);
      });
      var last = state.hist[state.hist.length - 1];
      var shownCnt = names.map(function () { return 0; });
      for (var i = 0; i < Math.floor(state.shown) && i < state.seeds.length; i++) shownCnt[state.seeds[i]]++;
      names.forEach(function (nm, i) {
        var y = top + rowH * i, cy = y + rowH / 2;
        ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        seed(T, R.x + 10, cy, 7, M().looks[i]);
        ctx.fillStyle = T.figInk; ctx.fillText(nm, R.x + 22, cy);
        // 지난 결과 점
        state.hist.forEach(function (hc, k) {
          if (hc === last) return;
          ctx.globalAlpha = 0.35; ctx.fillStyle = T.figMuted;
          var jitter = ((k * 7) % 5 - 2) * 2.2;
          ctx.beginPath(); ctx.arc(X(hc[i]), cy + rowH * 0.28 + jitter * 0.4, 3, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        });
        // 이번 결과 막대
        var bh = Math.min(14, rowH * 0.32);
        ctx.fillStyle = T.figSoftBlue; ctx.fillRect(x0, cy - bh, X(shownCnt[i]) - x0, bh);
        ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1.5; ctx.strokeRect(x0, cy - bh, X(shownCnt[i]) - x0, bh);
        // 이론값
        var tv = 100 * th.ph[i] / th.n;
        ctx.setLineDash([4, 3]); ctx.strokeStyle = T.figRed; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(X(tv), y + 3); ctx.lineTo(X(tv), y + rowH - 3); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontMono; ctx.textAlign = X(shownCnt[i]) > x1 - 30 ? 'right' : 'left';
        ctx.fillText(String(shownCnt[i]), ctx.textAlign === 'right' ? X(shownCnt[i]) - 4 : X(shownCnt[i]) + 4, cy - bh / 2);
      });
      ctx.textBaseline = 'alphabetic';
      // 범례
      var ly = axisY + 34; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.setLineDash([4, 3]); ctx.strokeStyle = T.figRed; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(R.x + 4, ly - 4); ctx.lineTo(R.x + 18, ly - 4); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.figMuted; ctx.fillText('이론값', R.x + 22, ly);
      ctx.fillStyle = T.figSoftBlue; ctx.fillRect(R.x + 66, ly - 10, 14, 10); ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1; ctx.strokeRect(R.x + 66, ly - 10, 14, 10);
      ctx.fillStyle = T.figMuted; ctx.fillText('이번 결과', R.x + 84, ly);
      ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(R.x + 148, ly - 4, 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillText('지난 결과 (' + Math.max(0, state.hist.length - 1) + '번)', R.x + 156, ly);
    }
    function drawSeeds(T, R, cols) {
      var rows = 100 / cols, cell = Math.min((R.w - 8) / cols, (R.h - 24) / rows), gw = cell * cols, ox = R.x + (R.w - gw) / 2, oy = R.y + 22;
      ctx.fillStyle = T.figInk; ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('뿌린 씨 100개에서 얻은 완두', ox, R.y + 12);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.strokeRect(ox - 2.5, oy - 2.5, gw + 5, cell * rows + 5);
      for (var i = 0; i < Math.floor(state.shown) && i < state.seeds.length; i++) {
        var c = i % cols, r = Math.floor(i / cols);
        seed(T, ox + cell * (c + 0.5), oy + cell * (r + 0.5), cell * 0.36, M().looks[state.seeds[i]]);
      }
    }

    api.onResize(draw);
    syncBtns(); sow(true);
  },
});
