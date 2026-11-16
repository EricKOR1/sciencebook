/* 중3-6 생식과 유전: 염색체 2쌍(4개)인 세포로 체세포분열과 생식세포 형성(감수 분열)을 단계별로 나란히 비교한다 */
Sims.register('cell-division', {
  title: '체세포분열과 생식세포 형성 — 염색체의 행동 비교',
  caption: '\'다음 단계\'를 눌러 두 분열을 나란히 진행해 보자. 길이가 같은 두 염색체가 상동 염색체 한 쌍이고, 색은 어머니(빨강)와 아버지(파랑)에게서 온 것을 나타낸다. 체세포분열은 복제 → 배열 → 분리를 한 번 하여 염색체 수가 같은 딸세포 2개를, 생식세포 형성은 상동 염색체가 갈라지는 첫 번째 분열과 두 가닥이 갈라지는 두 번째 분열을 거쳐 염색체 수가 절반인 생식세포 4개를 만든다. \'처음부터\'를 누르면 첫 번째 분열에서 상동 염색체가 늘어서는 방향이 무작위로 바뀌어 생식세포의 조합이 달라질 수 있다(세포 모양과 크기는 단순화한 모식도).',
  init: function (api) {
    var LONG = 0.13, SHORT = 0.08, D = 0.017;   // 염색체 길이, 두 가닥 사이 반간격(패널 크기 대비)
    var CHR = [
      { id: 'Am', len: LONG, col: 'm' }, { id: 'Ap', len: LONG, col: 'p' },
      { id: 'Bm', len: SHORT, col: 'm' }, { id: 'Bp', len: SHORT, col: 'p' },
    ];
    var STEPS = [
      { name: '분열 전', so: '세포 1개, 염색체 4개(2쌍). 아직 DNA가 복제되기 전이다.', me: '세포 1개, 염색체 4개(2쌍). 아직 DNA가 복제되기 전이다.' },
      { name: '복제', so: 'DNA가 복제되어 염색체마다 똑같은 두 가닥(염색 분체)이 붙어 있다.', me: 'DNA가 복제되어 염색체마다 똑같은 두 가닥(염색 분체)이 붙어 있다.' },
      { name: '배열', so: '염색체 4개가 세포 가운데에 한 줄로 늘어선다.', me: '첫 번째 분열: 상동 염색체끼리 짝을 지어 세포 가운데에 늘어선다.' },
      { name: '분리', so: '각 염색체의 두 가닥이 갈라져 양쪽 끝으로 끌려간다.', me: '첫 번째 분열: 짝을 지었던 상동 염색체가 서로 갈라져 양쪽으로 간다.' },
      { name: '세포질 분열', so: '딸세포 2개, 각각 염색체 4개 — 모세포와 같다. 분열은 1회로 끝난다.', me: '세포 2개, 각각 염색체 2개(쌍마다 1개씩) — 염색체 수가 절반이 되었다. 아직 두 가닥이다.' },
      { name: '두 번째 분열: 배열', so: '체세포분열은 이미 끝났다(딸세포 2개, 염색체 4개씩).', me: '두 번째 분열: 각 세포에서 염색체가 가운데에 늘어선다(복제는 다시 일어나지 않는다).' },
      { name: '두 번째 분열: 분리', so: '체세포분열은 이미 끝났다(딸세포 2개, 염색체 4개씩).', me: '두 번째 분열: 각 염색체의 두 가닥이 갈라진다. 염색체 수는 그대로이다.' },
      { name: '결과', so: '결과: 모세포와 염색체 수·유전 정보가 같은 딸세포 2개.', me: '결과: 염색체 수가 모세포의 절반(2개)인 생식세포 4개. 쌍마다 한 개씩 들어 있다.' },
    ];
    var N = STEPS.length;
    var state = { step: 0, from: 0, t: 1, flipA: false, flipB: true };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.56 + 230 / w : 0.5 + 118 / w; }, label: '체세포분열과 생식세포 형성 과정을 나란히 보여 주는 그림' });
    var ctx = cv.ctx;
    var rStep = api.readout('단계');
    var rSo = api.readout('체세포분열');
    var rMe = api.readout('생식세포 형성');
    var g = api.group();
    api.button('처음부터', function () { shuffle(); go(0, true); }, { parent: g });
    var prevBtn = api.button('◀ 이전 단계', function () { go(state.step - 1); }, { parent: g });
    var nextBtn = api.button('다음 단계 ▶', function () { go(state.step + 1); }, { primary: true, parent: g });

    function shuffle() { state.flipA = Math.random() < 0.5; state.flipB = Math.random() < 0.5; }

    /* ── 장면 열쇠 그림(keyframe): 염색 분체 8개 {x,y,a(0=세로),al}, 세포 목록 {x,y,rx,ry,nuc} ── */
    function dup(out, id, x, y, a, alpha2) {
      var px = Math.cos(a) * D, py = -Math.sin(a) * D;
      out[id + '0'] = { x: x - px, y: y - py, a: a, al: 1 };
      out[id + '1'] = { x: x + px, y: y + py, a: a, al: alpha2 == null ? 1 : alpha2 };
    }
    function single(out, id, x, y, a) {   // 복제 전: 두 번째 가닥은 숨긴다
      out[id + '0'] = { x: x, y: y, a: a, al: 1 };
      out[id + '1'] = { x: x, y: y, a: a, al: 0 };
    }
    var NUC0 = { Am: [-0.07, -0.05, 0.5], Ap: [0.08, 0.04, -0.4], Bm: [-0.05, 0.10, 1.1], Bp: [0.07, -0.10, 0.2] };
    function early(out, s) {
      CHR.forEach(function (c) {
        var p = NUC0[c.id];
        if (s === 0) single(out, c.id, 0.5 + p[0], 0.5 + p[1], p[2]); else dup(out, c.id, 0.5 + p[0], 0.5 + p[1], p[2]);
      });
    }
    function one(r, nuc) { return { x: 0.5, y: 0.5, rx: r, ry: r, nuc: nuc }; }
    function keySo(s) {
      var ch = {}, cells;
      if (s <= 1) { early(ch, s); cells = [one(0.36, 1), one(0.36, 1)]; }
      else if (s === 2) {
        var ys = { Am: 0.29, Bm: 0.43, Ap: 0.58, Bp: 0.72 };
        CHR.forEach(function (c) { dup(ch, c.id, 0.5, ys[c.id], 0); });
        cells = [one(0.36, 0), one(0.36, 0)];
      } else if (s === 3) {
        var ys3 = { Am: 0.33, Bm: 0.45, Ap: 0.58, Bp: 0.69 };
        CHR.forEach(function (c) {
          ch[c.id + '0'] = { x: 0.24, y: ys3[c.id], a: 0, al: 1 };
          ch[c.id + '1'] = { x: 0.76, y: ys3[c.id], a: 0, al: 1 };
        });
        cells = [{ x: 0.5, y: 0.5, rx: 0.45, ry: 0.3, nuc: 0 }, { x: 0.5, y: 0.5, rx: 0.45, ry: 0.3, nuc: 0 }];
      } else {
        var dx = { Am: -0.09, Ap: -0.03, Bm: 0.04, Bp: 0.10 };
        CHR.forEach(function (c) {
          ch[c.id + '0'] = { x: 0.25 + dx[c.id], y: 0.5, a: 0, al: 1 };
          ch[c.id + '1'] = { x: 0.75 + dx[c.id], y: 0.5, a: 0, al: 1 };
        });
        cells = [{ x: 0.25, y: 0.5, rx: 0.22, ry: 0.22, nuc: 1 }, { x: 0.75, y: 0.5, rx: 0.22, ry: 0.22, nuc: 1 }];
      }
      return { ch: ch, cells: cells };
    }
    function keyMe(s) {
      var ch = {}, cells;
      // 첫 번째 분열에서 왼쪽으로 가는 상동 염색체
      var leftA = state.flipA ? 'Ap' : 'Am', rightA = state.flipA ? 'Am' : 'Ap';
      var leftB = state.flipB ? 'Bp' : 'Bm', rightB = state.flipB ? 'Bm' : 'Bp';
      var side = {}; side[leftA] = 0; side[rightA] = 1; side[leftB] = 0; side[rightB] = 1;
      var cx = [0.25, 0.75];
      if (s <= 1) { early(ch, s); cells = [one(0.36, 1), one(0.36, 1), one(0.36, 1), one(0.36, 1)]; }
      else if (s === 2) {
        CHR.forEach(function (c) {
          var y = c.len === LONG ? 0.38 : 0.62;
          dup(ch, c.id, side[c.id] === 0 ? 0.455 : 0.545, y, 0);
        });
        cells = [one(0.36, 0), one(0.36, 0), one(0.36, 0), one(0.36, 0)];
      } else if (s === 3) {
        CHR.forEach(function (c) {
          var y = c.len === LONG ? 0.42 : 0.6;
          dup(ch, c.id, side[c.id] === 0 ? 0.24 : 0.76, y, 0);
        });
        var e = { x: 0.5, y: 0.5, rx: 0.45, ry: 0.3, nuc: 0 };
        cells = [e, e, e, e];
      } else if (s === 4) {
        CHR.forEach(function (c) { dup(ch, c.id, cx[side[c.id]] + (c.len === LONG ? -0.05 : 0.06), 0.5, 0); });
        cells = [0, 0, 1, 1].map(function (k) { return { x: cx[k], y: 0.5, rx: 0.22, ry: 0.22, nuc: 1 }; });
      } else if (s === 5) {
        CHR.forEach(function (c) { dup(ch, c.id, cx[side[c.id]] + (c.len === LONG ? -0.07 : 0.07), 0.5, Math.PI / 2); });
        cells = [0, 0, 1, 1].map(function (k) { return { x: cx[k], y: 0.5, rx: 0.22, ry: 0.22, nuc: 0 }; });
      } else {
        var sep = s === 6 ? 0.13 : 0.21;
        CHR.forEach(function (c) {
          var x = cx[side[c.id]] + (c.len === LONG ? -0.07 : 0.07);
          ch[c.id + '0'] = { x: x, y: 0.5 - sep, a: Math.PI / 2, al: 1 };
          ch[c.id + '1'] = { x: x, y: 0.5 + sep, a: Math.PI / 2, al: 1 };
        });
        if (s === 6) cells = [0, 0, 1, 1].map(function (k) { return { x: cx[k], y: 0.5, rx: 0.2, ry: 0.36, nuc: 0 }; });
        else cells = [[0, -1], [0, 1], [1, -1], [1, 1]].map(function (q) { return { x: cx[q[0]], y: 0.5 + q[1] * 0.21, rx: 0.19, ry: 0.19, nuc: 1 }; });
      }
      return { ch: ch, cells: cells };
    }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function mix(k0, k1, t) {
      var ch = {}, cells = [];
      Object.keys(k1.ch).forEach(function (id) {
        var p = k0.ch[id], q = k1.ch[id];
        ch[id] = { x: lerp(p.x, q.x, t), y: lerp(p.y, q.y, t), a: lerp(p.a, q.a, t), al: lerp(p.al, q.al, t) };
      });
      k1.cells.forEach(function (q, i) {
        var p = k0.cells[i];
        cells.push({ x: lerp(p.x, q.x, t), y: lerp(p.y, q.y, t), rx: lerp(p.rx, q.rx, t), ry: lerp(p.ry, q.ry, t), nuc: lerp(p.nuc, q.nuc, t) });
      });
      return { ch: ch, cells: cells };
    }

    /* ── 진행 ── */
    var loop = api.loop(function (dt) {
      if (!(dt > 0)) return;
      state.t = Math.min(1, state.t + dt / 0.9);
      draw();
      if (state.t >= 1) loop.pause();
    });
    loop.pause();
    function go(s, instant) {
      s = Math.max(0, Math.min(N - 1, s));
      state.from = instant ? s : state.step; state.step = s;
      state.t = (instant || api.reduced || state.from === s) ? 1 : 0;
      ui(); draw();
      if (state.t < 1) loop.play();
    }
    function ui() {
      var s = state.step;
      prevBtn.disabled = s === 0; nextBtn.disabled = s === N - 1;
      rStep.set((s + 1) + ' / ' + N + ' ' + STEPS[s].name);
      rSo.set(s < 3 ? '세포 1개 · 염색체 4개' : s === 3 ? '세포 1개 → 2개로 나뉘는 중' : '딸세포 2개 · 각 염색체 4개');
      rMe.set(s < 3 ? '세포 1개 · 염색체 4개' : s === 3 ? '세포 1개 → 2개로 나뉘는 중' : s < 6 ? '세포 2개 · 각 염색체 2개' : s === 6 ? '세포 2개 → 4개로 나뉘는 중' : '생식세포 4개 · 각 염색체 2개');
    }

    /* ── 그리기 ── */
    function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function layout() {
      var w = cv.w, h = cv.h, stacked = w < 560;
      if (stacked) {
        var ph = (h - 30) / 2;
        return { legendY: h - 14, panels: [{ x: 0, y: 0, w: w, h: ph }, { x: 0, y: ph, w: w, h: ph }] };
      }
      return { legendY: h - 14, panels: [{ x: 0, y: 0, w: w / 2 - 6, h: h - 30 }, { x: w / 2 + 6, y: 0, w: w / 2 - 6, h: h - 30 }] };
    }
    function draw() {
      var T = api.tokens(), L = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      var t = ease(state.t);
      var so = mix(keySo(state.from), keySo(state.step), t);
      var me = mix(keyMe(state.from), keyMe(state.step), t);
      panel(T, L.panels[0], '체세포분열', so, STEPS[state.step].so, state.step === 5 || state.step === 6);
      panel(T, L.panels[1], '생식세포 형성 (감수 분열)', me, STEPS[state.step].me, false);
      // 범례
      ctx.font = '12px ' + T.fontBody; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      var items = [[T.figRed, '어머니에게서 온 염색체'], [T.figBlue, '아버지에게서 온 염색체']];
      var tw = 0; items.forEach(function (it) { tw += 22 + ctx.measureText(it[1]).width + 18; });
      var x = Math.max(4, (cv.w - tw) / 2);
      items.forEach(function (it) {
        ctx.fillStyle = it[0]; rr(x, L.legendY - 5, 16, 10, 5); ctx.fill();
        ctx.fillStyle = T.figInk; ctx.fillText(it[1], x + 22, L.legendY);
        x += 22 + ctx.measureText(it[1]).width + 18;
      });
      ctx.textBaseline = 'alphabetic';
    }
    function panel(T, P, title, K, text, done) {
      ctx.save();
      ctx.fillStyle = T.figPaper; ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      rr(P.x + 0.5, P.y + 0.5, P.w - 1, P.h - 1, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 14px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText(title, P.x + P.w / 2, P.y + 22);
      var textH = 58, s = Math.min(P.w - 16, P.h - 32 - textH - 6);
      var ox = P.x + (P.w - s) / 2, oy = P.y + 30;
      var X = function (u) { return ox + u * s; }, Y = function (v) { return oy + v * s; };
      ctx.globalAlpha = done ? 0.55 : 1;
      // 세포
      K.cells.forEach(function (c) {
        ctx.beginPath(); ctx.ellipse(X(c.x), Y(c.y), c.rx * s, c.ry * s, 0, 0, Math.PI * 2);
        ctx.fillStyle = T.figSoftTeal; ctx.fill(); ctx.strokeStyle = T.figTeal; ctx.lineWidth = 2; ctx.stroke();
      });
      K.cells.forEach(function (c) {
        if (c.nuc < 0.02) return;
        ctx.save(); ctx.globalAlpha = (done ? 0.55 : 1) * c.nuc;
        ctx.beginPath(); ctx.ellipse(X(c.x), Y(c.y), c.rx * s * 0.68, c.ry * s * 0.68, 0, 0, Math.PI * 2);
        ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.3; ctx.stroke(); ctx.setLineDash([]);
        ctx.restore();
      });
      // 염색 분체
      var lw = Math.max(5, 0.03 * s);
      CHR.forEach(function (c) {
        [0, 1].forEach(function (k) {
          var q = K.ch[c.id + k];
          if (q.al < 0.02) return;
          var hl = c.len * s / 2, dx = Math.sin(q.a) * hl, dy = Math.cos(q.a) * hl;
          ctx.save(); ctx.globalAlpha = (done ? 0.55 : 1) * q.al;
          ctx.strokeStyle = c.col === 'm' ? T.figRed : T.figBlue; ctx.lineWidth = lw; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(X(q.x) - dx, Y(q.y) - dy); ctx.lineTo(X(q.x) + dx, Y(q.y) + dy); ctx.stroke();
          ctx.restore();
        });
      });
      ctx.globalAlpha = 1;
      // 설명
      ctx.fillStyle = T.figInk; ctx.font = '13px ' + T.fontBody; ctx.textAlign = 'left';
      wrap(text, P.x + 12, oy + s + 22, P.w - 24, 18, 3);
      ctx.restore();
    }
    function wrap(str, x, y, maxW, lh, maxLines) {
      var words = str.split(' '), line = '', n = 0;
      for (var i = 0; i < words.length; i++) {
        var test = line ? line + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line, x, y + n * lh); n++; line = words[i];
          if (n >= maxLines) return;
        } else line = test;
      }
      if (line) ctx.fillText(line, x, y + n * lh);
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    api.onResize(draw);
    ui(); draw();
  },
});
