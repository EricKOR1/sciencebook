/* 화학 3 화학 평형: N₂O₄ ⇌ 2NO₂의 농도–시간, 정·역반응 속도, 평형 이동(Q와 K 비교) */
Sims.register('equilibrium', {
  title: 'N₂O₄ ⇌ 2NO₂ — 두 반응의 속도가 같아지는 순간과 평형의 이동',
  caption: '1 L 용기에 N₂O₄ 1.0 mol을 넣으면 정반응이 빠르다가 느려지고 역반응은 빨라져, 두 속도가 같아지면 농도가 일정한 평형(K = [NO₂]²/[N₂O₄] = 0.2, 예제 1과 같은 조건)에 이른다. 평형에서 버튼으로 조건을 바꾸면 그 순간의 Q를 K와 비교해 평형이 이동하는 방향과 새 평형 농도를 보여 준다. 농도·부피를 바꾸어도 K는 그대로이지만, 정반응이 흡열 반응이므로 온도를 높이면 K가 커진다(높인 온도의 K = 0.8은 설명을 위해 가정한 값). 시간은 상대 단위이며, 반응 속도는 정반응 k[N₂O₄], 역반응 k′[NO₂]²로 단순화했고 부피를 줄일 때 온도는 일정하다고 가정했다.',
  init: function (api) {
    var COLD = { K: 0.2, kf: 0.15 }, HOT = { K: 0.8, kf: 0.3 };
    var SEG = 9;   // 한 번의 변화 뒤 계산하는 시간(상대 단위)
    var st;
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.6 : 0.56; }, label: 'N₂O₄와 NO₂의 농도–시간 그래프, 정반응과 역반응 속도 그래프, 용기 색과 Q와 K 비교' });
    var ctx = cv.ctx;

    var rA = api.readout('[N₂O₄]');
    var rB = api.readout('[NO₂]');
    var rQ = api.readout('Q / K');
    var rS = api.readout('상태');

    var g = api.group();
    var bAdd = api.button('반응물(N₂O₄) 더 넣기', function () { perturb('add'); }, { parent: g });
    var bVol = api.button('부피 절반으로(압력 높이기)', function () { perturb('vol'); }, { parent: g });
    var bTemp = api.button('온도 높이기', function () { perturb('temp'); }, { parent: g });
    api.button('처음부터', function () { reset(true); }, { primary: true });

    function cond() { return st.hot ? HOT : COLD; }
    function eqShift(A, B, K) {   // A - x, B + 2x 가 평형이 되는 x
      var b = 4 * B + K, c = B * B - K * A;
      return (-b + Math.sqrt(b * b - 16 * c)) / 8;
    }
    function run(dur) {
      var p = st.data[st.data.length - 1], A = p.A, B = p.B, t = p.t, c = cond(), kr = c.kf / c.K, h = 0.005, n = 0;
      while (t < p.t + dur - 1e-9) {
        var r = c.kf * A - kr * B * B;
        A -= r * h; B += 2 * r * h; t += h; n++;
        if (n % 10 === 0) st.data.push({ t: t, A: A, B: B, kf: c.kf, kr: kr });
      }
      st.tEnd = t;
    }
    function reset(animate) {
      st = { hot: false, data: [], marks: [], tShown: 0, tEnd: 0, msg: null };
      st.data.push({ t: 0, A: 1.0, B: 0, kf: COLD.kf, kr: COLD.kf / COLD.K });
      run(SEG);
      st.msg = { title: '처음: N₂O₄만 있음 → 정반응 진행', q: 0, k: COLD.K, dir: 1, A: 0.8, B: 0.4 };
      bTemp.textContent = '온도 높이기';
      if (animate && !api.reduced) { st.tShown = 0; loop.play(); } else st.tShown = st.tEnd;
      refresh();
    }
    function perturb(kind) {
      if (st.tShown < st.tEnd - 1e-6) return;
      if (st.marks.length >= 5) { st.note = '변화가 너무 많아요. ‘처음부터’를 눌러 주세요.'; refresh(); return; }
      var p = st.data[st.data.length - 1], A = p.A, B = p.B, label;
      if (kind === 'add') { A += 0.5; label = 'N₂O₄ 0.5 M 추가'; }
      else if (kind === 'vol') { A *= 2; B *= 2; label = '부피 ½ (농도 2배)'; }
      else { st.hot = !st.hot; label = st.hot ? '온도 높임' : '온도 낮춤'; bTemp.textContent = st.hot ? '온도 낮추기' : '온도 높이기'; }
      var c = cond(), q = B * B / A, x = eqShift(A, B, c.K);
      st.data.push({ t: p.t, A: A, B: B, kf: c.kf, kr: c.kf / c.K });
      st.marks.push({ t: p.t, label: label });
      var dir = Math.abs(q - c.K) / c.K < 0.005 ? 0 : q < c.K ? 1 : -1;
      var why = kind === 'add' ? '반응물을 소모하는 쪽' : kind === 'vol' ? '기체 분자 수가 줄어드는 쪽(2몰 → 1몰)' : st.hot ? '열을 흡수하는 쪽(정반응이 흡열)' : '열을 방출하는 쪽(역반응이 발열)';
      st.msg = { title: label + (kind === 'temp' ? ' → K = ' + c.K : '') + ', Q = ' + q.toFixed(3) + (dir > 0 ? ' < ' : dir < 0 ? ' > ' : ' = ') + 'K = ' + c.K,
        q: q, k: c.K, dir: dir, why: why, A: A - x, B: B + 2 * x };
      run(SEG);
      if (api.reduced) st.tShown = st.tEnd; else loop.play();
      refresh();
    }
    var loop = api.loop(function (dt) {
      st.tShown = Math.min(st.tEnd, st.tShown + dt * 3);
      if (st.tShown >= st.tEnd) loop.pause();
      refresh();
    });
    loop.pause();

    function at(t) {   // t까지 보이는 마지막 점
      var d = st.data, lo = 0;
      for (var i = 0; i < d.length; i++) if (d[i].t <= t + 1e-9) lo = i;
      return d[lo];
    }
    function refresh() {
      var p = at(st.tShown), c = cond(), q = p.A > 0 ? p.B * p.B / p.A : 0, busy = st.tShown < st.tEnd - 1e-6;
      rA.set(p.A.toFixed(3) + ' M'); rB.set(p.B.toFixed(3) + ' M');
      rQ.set(q.toFixed(3) + ' / ' + c.K);
      var rf = p.kf * p.A, rr = p.kr * p.B * p.B;
      rS.set(Math.abs(rf - rr) < 0.002 ? '평형 (정반응 속도 = 역반응 속도)' : rf > rr ? '정반응 쪽으로 진행 중' : '역반응 쪽으로 진행 중');
      [bAdd, bVol, bTemp].forEach(function (b) { b.disabled = busy; });
      draw();
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var G, R, side;
      if (narrow) { G = { x: 0, y: 0, w: w, h: h * 0.4 }; R = { x: 0, y: h * 0.41, w: w, h: h * 0.24 }; side = { x: 0, y: h * 0.67, w: w, h: h * 0.33 }; }
      else { G = { x: 0, y: 0, w: w * 0.64, h: h * 0.6 }; R = { x: 0, y: h * 0.6, w: w * 0.64, h: h * 0.4 }; side = { x: w * 0.66, y: 0, w: w * 0.34, h: h }; }
      var tMax = Math.max(SEG, st.tEnd), cMax = 0;
      st.data.forEach(function (d) { cMax = Math.max(cMax, d.A, d.B); });
      cMax = Math.ceil(cMax * 2 + 0.2) / 2;
      var rMax = 0; st.data.forEach(function (d) { rMax = Math.max(rMax, d.kf * d.A, d.kr * d.B * d.B); });
      rMax = Math.max(0.05, rMax * 1.1);
      plot(T, G, tMax, cMax, '농도 (M)', [
        { f: function (d) { return d.A; }, c: T.figBlue, name: 'N₂O₄' },
        { f: function (d) { return d.B; }, c: T.figAmber, name: 'NO₂' }], true);
      plot(T, R, tMax, rMax, '반응 속도', [
        { f: function (d) { return d.kf * d.A; }, c: T.figGreen, name: '정반응' },
        { f: function (d) { return d.kr * d.B * d.B; }, c: T.figViolet, name: '역반응', dash: [6, 4] }], false);
      drawSide(T, side);
    }
    function plot(T, r, tMax, yMax, ylab, series, top) {
      var L = r.x + 48, Rr = r.x + r.w - 12, Tp = r.y + 22, B = r.y + r.h - (top ? 18 : 30);
      var sx = function (t) { return L + t / tMax * (Rr - L); }, sy = function (v) { return B - v / yMax * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      var step = yMax <= 1 ? 0.2 : yMax <= 2 ? 0.5 : 1;
      if (!top) step = yMax / 2;
      for (var v = 0; v <= yMax + 1e-9; v += step) {
        ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(Rr, sy(v)); ctx.stroke();
        if (top) ctx.fillText(v.toFixed(1), L - 6, sy(v));
      }
      ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(L, Tp - 4); ctx.lineTo(L, B); ctx.lineTo(Rr, B); ctx.stroke();
      // 변화 시점
      st.marks.forEach(function (m, i) {
        if (m.t > st.tShown + 1e-9) return;
        ctx.setLineDash([4, 4]); ctx.strokeStyle = T.figMuted; ctx.beginPath(); ctx.moveTo(sx(m.t), Tp); ctx.lineTo(sx(m.t), B); ctx.stroke(); ctx.setLineDash([]);
        if (top) { ctx.fillStyle = T.figMuted; ctx.textAlign = 'left'; ctx.font = '600 11px ' + T.fontBody; ctx.fillText('①②③④⑤'[i], sx(m.t) + 3, Tp + 2); }
      });
      series.forEach(function (s) {
        ctx.strokeStyle = s.c; ctx.lineWidth = 2.4; ctx.setLineDash(s.dash || []); ctx.beginPath();
        var first = true;
        st.data.forEach(function (d) { if (d.t > st.tShown + 1e-9) return; var X = sx(d.t), Y = sy(s.f(d)); if (first) { ctx.moveTo(X, Y); first = false; } else ctx.lineTo(X, Y); });
        ctx.stroke(); ctx.setLineDash([]);
      });
      // 범례
      ctx.textBaseline = 'alphabetic'; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      var lx = L + 6;
      ctx.fillStyle = T.figInk; ctx.fillText(ylab, r.x + 6, r.y + 13);
      lx = r.x + 6 + ctx.measureText(ylab).width + 14;
      series.forEach(function (s) {
        ctx.strokeStyle = s.c; ctx.lineWidth = 2.4; ctx.setLineDash(s.dash || []); ctx.beginPath(); ctx.moveTo(lx, r.y + 9); ctx.lineTo(lx + 18, r.y + 9); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = s.c; ctx.fillText(s.name, lx + 22, r.y + 13); lx += 30 + ctx.measureText(s.name).width;
      });
      if (!top) { ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('시간 (상대 단위) →', (L + Rr) / 2, B + 18); }
    }
    function drawSide(T, r) {
      var p = at(st.tShown), narrow = cv.w < 560;
      var vx = r.x + 10, vy = r.y + 10, vw = narrow ? r.w * 0.34 : r.w - 20, vh = narrow ? r.h - 20 : r.h * 0.34;
      // 용기: NO₂의 적갈색(실제 색) 진하기 ∝ [NO₂]
      ctx.fillStyle = T.figPanel; ctx.fillRect(vx, vy, vw, vh);
      ctx.fillStyle = 'rgba(160, 70, 20,' + Math.min(0.85, p.B / 1.6).toFixed(3) + ')'; ctx.fillRect(vx, vy, vw, vh);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5; ctx.strokeRect(vx, vy, vw, vh);
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('용기 속 색', vx + vw / 2, vy + 16);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      ctx.fillText('NO₂(적갈색)가 많을수록 진하다', vx + vw / 2, vy + vh - 8);
      // Q와 K 비교 상자
      var bx = narrow ? vx + vw + 12 : vx, by = narrow ? vy : vy + vh + 12, bw = narrow ? r.w - vw - 32 : vw, bh = narrow ? vh : r.h - vh - 32;
      ctx.fillStyle = T.figPaper; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = T.rule; ctx.strokeRect(bx, by, bw, bh);
      var m = st.msg, y = by + 20, cx = bx + bw / 2;
      ctx.fillStyle = T.figInk; ctx.font = '600 15px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('N₂O₄  ⇌  2NO₂', cx, y + 4);
      if (m) {
        // 진행 방향 화살표
        var done = st.tShown >= st.tEnd - 1e-6;
        ctx.font = '600 13px ' + T.fontBody;
        ctx.fillStyle = m.dir === 0 ? T.figMuted : m.dir > 0 ? T.figGreen : T.figViolet;
        ctx.fillText(m.dir > 0 ? '정반응 쪽으로 이동 →' : m.dir < 0 ? '← 역반응 쪽으로 이동' : '이동하지 않음', cx, y + 26);
        wrap(T, m.title, cx, y + 48, bw - 16, 12, T.figInk);
        var yy = y + 48 + 16 * lines(m.title, bw - 16, 12);
        if (m.why) { wrap(T, '변화를 줄이는 방향: ' + m.why, cx, yy, bw - 16, 11, T.figMuted); yy += 15 * lines('변화를 줄이는 방향: ' + m.why, bw - 16, 11); }
        ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = done ? T.figAccent : T.figMuted;
        ctx.fillText((done ? '새 평형: ' : '새 평형(예상): ') + '[N₂O₄] ' + m.A.toFixed(2) + ', [NO₂] ' + m.B.toFixed(2) + ' M', cx, Math.min(yy + 6, by + bh - 10));
      }
      if (st.note) { ctx.fillStyle = T.figRed; ctx.font = '11px ' + T.fontBody; ctx.fillText(st.note, cx, by + bh + 14); st.note = null; }
    }
    function lines(txt, maxW, size) { ctx.font = size + 'px ' + api.tokens().fontBody; return split(txt, maxW).length; }
    function split(txt, maxW) {
      var words = txt.split(' '), out = [], cur = '';
      words.forEach(function (wd) { var t = cur ? cur + ' ' + wd : wd; if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = wd; } else cur = t; });
      if (cur) out.push(cur); return out;
    }
    function wrap(T, txt, x, y, maxW, size, color) {
      ctx.font = size + 'px ' + T.fontBody; ctx.fillStyle = color; ctx.textAlign = 'center';
      split(txt, maxW).forEach(function (l, i) { ctx.fillText(l, x, y + i * (size + 4)); });
    }

    api.onResize(draw);
    reset(false);
  },
});
