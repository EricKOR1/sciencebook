/* 생명과학 1 군집 조사: 방형구법으로 밀도·빈도·피도와 중요치를 구해 우점종을 정한다 */
Sims.register('quadrat-survey', {
  title: '방형구법으로 우점종 찾기',
  caption: '10 m × 6 m 조사지에 1 m × 1 m 방형구를 놓고 종마다 개체 수, 출현한 방형구 수, 덮은 넓이를 잰다. 이 값으로 상대 밀도·상대 빈도·상대 피도를 구해 더한 중요치가 가장 큰 종이 우점종이다. "새 조사지"와 "방형구 다시 놓기"를 눌러, 개체 수가 가장 많은 종이 늘 우점종은 아니라는 것을 확인해 보자. 개체는 중심(뿌리)이 방형구 안에 있는 것만 세고, 덮은 넓이는 방형구 안을 덮은 부분만 잰다(식물을 원으로 단순화한 가상 자료).',
  init: function (api) {
    var FW = 10, FH = 6;            // 조사지 크기(m)
    var SP = [
      { name: '민들레', col: 'figAmber', soft: 'figSoftAmber' },
      { name: '질경이', col: 'figGreen', soft: 'figSoftGreen' },
      { name: '토끼풀', col: 'figTeal', soft: 'figSoftTeal' },
      { name: '강아지풀', col: 'figViolet', soft: 'figSoftViolet' },
    ];
    var seed = 17;
    function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
    function gauss() { var u = rnd() || 1e-9, v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
    var plants = [], quads = [], nQ = 10, res = null;

    function newField() {
      plants = [];
      SP.forEach(function (sp, k) {
        // 종마다 개체 수, 크기, 모여 사는 정도를 무작위로 정한다
        var n, rMin, rMax, clumps;
        if (k === 0) { n = 25 + Math.floor(rnd() * 45); rMin = 0.12; rMax = 0.18; clumps = rnd() < 0.5 ? 0 : 3; }
        else if (k === 1) { n = 40 + Math.floor(rnd() * 100); rMin = 0.07; rMax = 0.1; clumps = 1 + Math.floor(rnd() * 3); }
        else if (k === 2) { n = 6 + Math.floor(rnd() * 12); rMin = 0.32; rMax = 0.5; clumps = rnd() < 0.4 ? 0 : 2; }
        else { n = 15 + Math.floor(rnd() * 55); rMin = 0.09; rMax = 0.14; clumps = rnd() < 0.5 ? 0 : 2; }
        var centers = [];
        for (var c = 0; c < clumps; c++) centers.push([0.8 + rnd() * (FW - 1.6), 0.6 + rnd() * (FH - 1.2)]);
        var sd = 0.5 + rnd() * 0.7;
        for (var i = 0; i < n; i++) {
          var x, y;
          if (clumps) { var cc = centers[Math.floor(rnd() * clumps)]; x = cc[0] + gauss() * sd; y = cc[1] + gauss() * sd; }
          else { x = rnd() * FW; y = rnd() * FH; }
          if (x < 0.05 || x > FW - 0.05 || y < 0.05 || y > FH - 0.05) { i--; continue; }
          plants.push({ s: k, x: x, y: y, r: rMin + rnd() * (rMax - rMin) });
        }
      });
      placeQuads();
    }
    function placeQuads() {
      var cells = [];
      for (var i = 0; i < FW; i++) for (var j = 0; j < FH; j++) cells.push([i, j]);
      for (var k = cells.length - 1; k > 0; k--) { var m = Math.floor(rnd() * (k + 1)); var t = cells[k]; cells[k] = cells[m]; cells[m] = t; }
      quads = cells.slice(0, nQ).sort(function (a, b) { return a[1] - b[1] || a[0] - b[0]; });
      compute();
    }
    function compute() {
      var G = 40;   // 방형구 하나를 40×40 점으로 나누어 덮은 넓이를 잰다
      var cnt = SP.map(function () { return 0; }), occ = cnt.slice(), cov = cnt.slice();
      quads.forEach(function (q) {
        var here = SP.map(function () { return 0; });
        plants.forEach(function (p) { if (p.x >= q[0] && p.x < q[0] + 1 && p.y >= q[1] && p.y < q[1] + 1) { cnt[p.s]++; here[p.s]++; } });
        here.forEach(function (h, k) { if (h > 0) occ[k]++; });
        var near = plants.filter(function (p) { return p.x + p.r > q[0] && p.x - p.r < q[0] + 1 && p.y + p.r > q[1] && p.y - p.r < q[1] + 1; });
        for (var k = 0; k < SP.length; k++) {
          var list = near.filter(function (p) { return p.s === k; }); if (!list.length) continue;
          var hit = 0;
          for (var a = 0; a < G; a++) for (var b = 0; b < G; b++) {
            var px = q[0] + (a + 0.5) / G, py = q[1] + (b + 0.5) / G;
            for (var z = 0; z < list.length; z++) { var dx = px - list[z].x, dy = py - list[z].y; if (dx * dx + dy * dy <= list[z].r * list[z].r) { hit++; break; } }
          }
          cov[k] += hit / (G * G);
        }
      });
      var area = nQ;   // 방형구 1 m² × nQ
      var den = cnt.map(function (c) { return c / area; }), fre = occ.map(function (o) { return o / nQ; }), cv = cov.map(function (c) { return c / area; });
      function rel(a) { var s = a.reduce(function (x, y) { return x + y; }, 0); return a.map(function (v) { return s > 0 ? v / s * 100 : 0; }); }
      var rd = rel(den), rf = rel(fre), rc = rel(cv);
      var iv = rd.map(function (v, k) { return v + rf[k] + rc[k]; });
      var best = 0; iv.forEach(function (v, k) { if (v > iv[best]) best = k; });
      var most = 0; cnt.forEach(function (v, k) { if (v > cnt[most]) most = k; });
      res = { cnt: cnt, occ: occ, cov: cov, rd: rd, rf: rf, rc: rc, iv: iv, best: best, most: most };
      readouts(); draw();
    }

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.55 : 0.5; }, label: '조사지와 방형구, 종별 조사 결과 표' });
    var ctx = cv.ctx;
    var rArea = api.readout('전체 방형구 면적');
    var rBest = api.readout('우점종(중요치 최대)');
    var rMost = api.readout('개체 수가 가장 많은 종');
    api.button('새 조사지', function () { newField(); }, { primary: true });
    api.button('방형구 다시 놓기', function () { placeQuads(); });
    api.slider({ id: 'quadrat-survey-n', label: '방형구 수', min: 4, max: 16, step: 1, value: nQ, format: function (v) { return v + '개'; },
      onInput: function (v) { if (v !== nQ) { nQ = v; placeQuads(); } } });

    function readouts() {
      rArea.set(nQ + ' m²');
      rBest.set(SP[res.best].name + ' (' + res.iv[res.best].toFixed(1) + ')');
      var tops = SP.filter(function (sp, k) { return res.cnt[k] === res.cnt[res.most]; }).map(function (sp) { return sp.name; });
      rMost.set(tops.join('·') + ' (' + res.cnt[res.most] + '개체)');
    }
    function layout() {
      var w = cv.w, h = cv.h;
      if (w < 560) { var fw = w - 4; return { f: { x: 2, y: 4, w: fw, h: fw * FH / FW }, t: { x: 0, y: fw * FH / FW + 22, w: w, h: h - fw * FH / FW - 22 } }; }
      var fw2 = w * 0.48; return { f: { x: 2, y: (h - fw2 * FH / FW) / 2 - 8, w: fw2, h: fw2 * FH / FW }, t: { x: w * 0.5, y: 6, w: w * 0.5, h: h - 12 } };
    }
    function draw() {
      if (!res) return;
      var T = api.tokens(), L = layout(), f = L.f, s = f.w / FW;
      ctx.clearRect(0, 0, cv.w, cv.h);
      // 조사지
      ctx.fillStyle = T.figPaper; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      ctx.fillRect(f.x, f.y, f.w, f.h); ctx.strokeRect(f.x, f.y, f.w, f.h);
      plants.forEach(function (p) {
        ctx.globalAlpha = 0.55; ctx.fillStyle = T[SP[p.s].soft];
        ctx.beginPath(); ctx.arc(f.x + p.x * s, f.y + p.y * s, p.r * s, 0, 7); ctx.fill();
        ctx.globalAlpha = 1; ctx.strokeStyle = T[SP[p.s].col]; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(f.x + p.x * s, f.y + p.y * s, p.r * s, 0, 7); ctx.stroke();
      });
      plants.forEach(function (p) {
        ctx.fillStyle = T[SP[p.s].col];
        ctx.beginPath(); ctx.arc(f.x + p.x * s, f.y + p.y * s, Math.max(1.6, s * 0.035), 0, 7); ctx.fill();
      });
      // 방형구
      ctx.lineWidth = 2; ctx.strokeStyle = T.figInk; ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'left';
      quads.forEach(function (q, i) {
        ctx.strokeRect(f.x + q[0] * s, f.y + q[1] * s, s, s);
        ctx.fillStyle = T.figInk; ctx.fillText(String(i + 1), f.x + q[0] * s + 3, f.y + q[1] * s + 12);
      });
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('조사지 10 m × 6 m · 굵은 칸 = 방형구 1 m × 1 m', f.x, f.y + f.h + 14);
      drawTable(T, L.t);
    }
    function drawTable(T, r) {
      var narrow = cv.w < 560;
      var cols = [{ k: '종', w: 1.45 }, { k: '개체\n수', w: 1 }, { k: '출현\n방형구', w: 1 }, { k: '덮은\n넓이', w: 1.1 },
        { k: '상대\n밀도 %', w: 1.05 }, { k: '상대\n빈도 %', w: 1.05 }, { k: '상대\n피도 %', w: 1.05 }, { k: '중요치', w: 1.1 }];
      var tw = cols.reduce(function (a, c) { return a + c.w; }, 0), unit = (r.w - 4) / tw;
      var rowH = narrow ? 30 : Math.min(36, (r.h - 80) / 5), headH = 34, x0 = r.x + 2, y0 = r.y + 4;
      var fs = narrow || r.w < 380 ? 11 : 12;
      ctx.textAlign = 'center'; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.fillStyle = T.figMuted;
      var x = x0;
      cols.forEach(function (c) {
        var lines = c.k.split('\n');
        lines.forEach(function (ln, i) { ctx.fillText(ln, x + c.w * unit / 2, y0 + 14 + i * 14 - (lines.length === 1 ? -7 : 0)); });
        x += c.w * unit;
      });
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, y0 + headH); ctx.lineTo(x0 + tw * unit, y0 + headH); ctx.stroke();
      SP.forEach(function (sp, k) {
        var y = y0 + headH + k * rowH;
        if (k === res.best) { ctx.fillStyle = T.figSoftBlue; ctx.fillRect(x0, y + 2, tw * unit, rowH - 4); ctx.strokeStyle = T.figAccent; ctx.lineWidth = 1.5; ctx.strokeRect(x0, y + 2, tw * unit, rowH - 4); }
        var vals = [sp.name, String(res.cnt[k]), String(res.occ[k]), res.cov[k].toFixed(2), res.rd[k].toFixed(1), res.rf[k].toFixed(1), res.rc[k].toFixed(1), res.iv[k].toFixed(1)];
        var cx = x0, mid = y + rowH / 2 + 4;
        vals.forEach(function (v, i) {
          var cw = cols[i].w * unit;
          if (i === 0) {
            ctx.fillStyle = T[sp.col]; ctx.beginPath(); ctx.arc(cx + 8, mid - 4, 4, 0, 7); ctx.fill();
            ctx.textAlign = 'left'; ctx.fillStyle = T.figInk; ctx.font = '600 ' + fs + 'px ' + T.fontBody; ctx.fillText(v, cx + 15, mid);
          } else {
            ctx.textAlign = 'center'; ctx.fillStyle = i === 7 ? T.figInk : T.ink; ctx.font = (i === 7 ? '700 ' : '') + fs + 'px ' + T.fontMono; ctx.fillText(v, cx + cw / 2, mid);
          }
          cx += cw;
        });
      });
      var yb = y0 + headH + SP.length * rowH + 6;
      ctx.strokeStyle = T.figLine; ctx.beginPath(); ctx.moveTo(x0, yb - 4); ctx.lineTo(x0 + tw * unit, yb - 4); ctx.stroke();
      // 중요치 막대
      var maxIV = 300, bx = x0 + 60, bw = tw * unit - 70, bh = narrow ? 9 : 10;
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figMuted;
      ctx.fillText('중요치 = 상대 밀도 + 상대 빈도 + 상대 피도 (세 값의 합은 300)', x0, yb + 12);
      SP.forEach(function (sp, k) {
        var y = yb + 22 + k * (bh + 7);
        ctx.fillStyle = T.figInk; ctx.font = '11px ' + T.fontBody; ctx.fillText(sp.name, x0, y + bh - 1);
        var acc = 0;
        [[res.rd[k], 1], [res.rf[k], 0.7], [res.rc[k], 0.45]].forEach(function (seg) {
          ctx.globalAlpha = seg[1]; ctx.fillStyle = T[sp.col]; ctx.fillRect(bx + acc / maxIV * bw, y, seg[0] / maxIV * bw, bh); acc += seg[0];
        });
        ctx.globalAlpha = 1;
        if (k === res.best) { ctx.fillStyle = T.figAccent; ctx.font = '700 11px ' + T.fontBody; ctx.fillText('◀ 우점종', bx + acc / maxIV * bw + 6, y + bh - 1); }
      });
      var yl = yb + 22 + SP.length * (bh + 7) + 8;
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'left';
      ctx.fillText('덮은 넓이 단위 m² · 막대: 진한 부분부터 상대 밀도·빈도·피도', x0, yl);
    }
    api.onResize(draw);
    newField();
  },
});
