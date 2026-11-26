/* 유기화학 7 구조 결정: 다중선 시뮬레이터 — 갈라짐 나무, 로렌츠 선 모양, AX→AB 지붕 효과 */
Sims.register('mj-nmr-multiplet', {
  title: '다중선 시뮬레이터 — 갈라짐 나무와 지붕 효과',
  caption: '1차 모드: 이웃 무리 세 개의 수소 수 n 과 J 를 바꾸면 큰 J 부터 갈라짐 나무를 그리고, 선마다 로렌츠 선 모양을 더한 스펙트럼과 선 위치·세기 표를 보여 준다. ' +
    '두 J 를 비슷하게(예: 6.8과 7.4) 맞추면 (n+1)(m+1) 개의 선이 겹쳐 n+m+1 무늬로 보이고, 선 너비를 줄이면 다시 갈라진다. 장비 진동수는 Hz 간격을 바꾸지 않고 ppm 눈금만 바꾼다(J 는 자기장과 무관). ' +
    '두 스핀 모드: 짝지은 두 수소(J = 7 Hz)의 Δν/J 를 바꾸며 두 스핀계의 정확한 해(선 위치 ±J/2 ± ½√(Δν²+J²), 안쪽/바깥 세기 비 (1+sin2θ)/(1−sin2θ), tan2θ = J/Δν)로 그린다. Δν/J 가 작을수록 안쪽 선이 커지는 지붕 효과가 뚜렷하다. 1차 모드는 1차 근사(Δν ≫ J)이다.',
  init: function (api) {
    var st = { mode: 1, d: 2.5, mhz: 300, lw: 1.0, g: [{ n: 2, J: 6.8 }, { n: 3, J: 7.4 }, { n: 0, J: 2.0 }], r: 3, J2: 7.0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.15 : 0.62; }, label: '갈라짐 나무와 다중선 스펙트럼' });
    var ctx = cv.ctx;
    var tbl = api.el('div'); tbl.style.fontSize = '13px'; tbl.style.marginTop = '6px'; tbl.style.overflowX = 'auto';
    api.stage.appendChild(tbl);
    var rN = api.readout('선 수 '), rC = api.readout('중심 '), rW = api.readout('전체 폭 ');
    var g0 = api.group();
    var b1 = api.button('1차 다중선', function () { st.mode = 1; sync(); }, { parent: g0, toggle: true, pressed: true });
    var b2 = api.button('두 스핀(지붕 효과)', function () { st.mode = 2; sync(); }, { parent: g0, toggle: true, pressed: false });
    var gm = api.group();
    var fb = [60, 300, 600].map(function (f) {
      return api.button(f + ' MHz', function () { st.mhz = f; sync(); }, { parent: gm, toggle: true, pressed: f === st.mhz });
    });
    var g1 = api.group(), ctrl1 = [];
    ctrl1.push(api.slider({ id: 'mj-nmr-multiplet-d', label: '관찰하는 수소의 δ', min: 0.5, max: 10, step: 0.01, value: st.d, parent: g1,
      format: function (v) { return v.toFixed(2) + ' ppm'; }, onInput: function (v) { st.d = v; draw(); } }));
    st.g.forEach(function (gr, k) {
      ctrl1.push(api.slider({ id: 'mj-nmr-multiplet-n' + k, label: '이웃 무리 ' + (k + 1) + ' 수소 수 n', min: 0, max: 6, step: 1, value: gr.n, parent: g1,
        format: function (v) { return v.toFixed(0); }, onInput: function (v) { gr.n = v; draw(); } }));
      ctrl1.push(api.slider({ id: 'mj-nmr-multiplet-j' + k, label: '무리 ' + (k + 1) + '의 J', min: 0, max: 20, step: 0.1, value: gr.J, parent: g1,
        format: function (v) { return v.toFixed(1) + ' Hz'; }, onInput: function (v) { gr.J = v; draw(); } }));
    });
    var g2 = api.group();
    api.slider({ id: 'mj-nmr-multiplet-lw', label: '선 너비', min: 0.3, max: 3, step: 0.1, value: st.lw, parent: g2,
      format: function (v) { return v.toFixed(1) + ' Hz'; }, onInput: function (v) { st.lw = v; draw(); } });
    var sr = api.slider({ id: 'mj-nmr-multiplet-r', label: 'Δν / J (두 스핀)', min: 0, max: 1, step: 0.002, value: Math.log(st.r) / Math.log(50), parent: g2,
      format: function (v) { return Math.pow(50, v).toFixed(2); }, onInput: function (v) { st.r = Math.pow(50, v); draw(); } });
    function sync() {
      b1.setAttribute('aria-pressed', st.mode === 1 ? 'true' : 'false');
      b2.setAttribute('aria-pressed', st.mode === 2 ? 'true' : 'false');
      fb.forEach(function (b, i) { b.setAttribute('aria-pressed', [60, 300, 600][i] === st.mhz ? 'true' : 'false'); });
      g1.style.display = st.mode === 1 ? '' : 'none';
      sr.input.parentNode.style.display = st.mode === 2 ? '' : 'none';
      gm.style.display = st.mode === 1 ? '' : 'none';
      draw();
    }
    function binom(n, k) { var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }
    function levels() {
      return st.g.filter(function (g) { return g.n > 0 && g.J > 0; }).slice().sort(function (a, b) { return b.J - a.J; });
    }
    function tree() {
      var rows = [[{ x: 0, w: 1, p: -1 }]];
      levels().forEach(function (g) {
        var prev = rows[rows.length - 1], nx = [];
        prev.forEach(function (l, pi) {
          for (var k = 0; k <= g.n; k++) nx.push({ x: l.x + (k - g.n / 2) * g.J, w: l.w * binom(g.n, k) / Math.pow(2, g.n), p: pi });
        });
        rows.push(nx);
      });
      return rows;
    }
    function merge(lines) {
      var s = lines.map(function (l) { return { x: l.x, w: l.w }; }).sort(function (a, b) { return a.x - b.x; }), out = [];
      s.forEach(function (l) { if (out.length && Math.abs(out[out.length - 1].x - l.x) < 0.01) out[out.length - 1].w += l.w; else out.push(l); });
      return out;
    }
    function lor(x, L, w) { var h = w / 2, s = 0; L.forEach(function (l) { s += l.w * h * h / ((x - l.x) * (x - l.x) + h * h); }); return s; }
    function ab() {
      var J = st.J2, dn = st.r * J, D = Math.sqrt(dn * dn + J * J) / 2, s2 = J / (2 * D);
      return [{ x: D + J / 2, w: 1 - s2 }, { x: D - J / 2, w: 1 + s2 }, { x: -D + J / 2, w: 1 + s2 }, { x: -D - J / 2, w: 1 - s2 }];
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      var x0 = 30, x1 = w - 20;
      var lines, rows = null;
      if (st.mode === 1) { rows = tree(); lines = merge(rows[rows.length - 1]); }
      else lines = ab();
      var span = 0; lines.forEach(function (l) { span = Math.max(span, Math.abs(l.x)); });
      var half = Math.max(span + 4 * st.lw + 3, 10);
      var X = function (hz) { return x0 + (half - hz) / (2 * half) * (x1 - x0); };   // 왼쪽이 큰 진동수
      var yTop = 22, yTreeEnd = st.mode === 1 ? h * 0.48 : 40, yb = h - 44;
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figInk;
      if (st.mode === 1) {
        var nl = rows.length - 1;
        var dy = nl ? (yTreeEnd - yTop - 10) / nl : 0;
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(X(0), yTop - 10); ctx.lineTo(X(0), yTop); ctx.stroke();
        var lv = levels();
        for (var r = 1; r <= nl; r++) {
          var ya = yTop + (r - 1) * dy, yc = ya + dy * 0.65, ye = ya + dy;
          rows[r].forEach(function (l) {
            var p = rows[r - 1][l.p];
            ctx.beginPath(); ctx.moveTo(X(p.x), ya); ctx.lineTo(X(l.x), yc); ctx.lineTo(X(l.x), ye); ctx.stroke();
          });
          ctx.fillStyle = T.figAccent; ctx.textAlign = 'right';
          ctx.fillText('n = ' + lv[r - 1].n + ', J = ' + lv[r - 1].J.toFixed(1) + ' Hz', x1, ya + dy * 0.45);
        }
        if (!nl) { ctx.fillStyle = T.figMuted; ctx.textAlign = 'center'; ctx.fillText('이웃 수소 없음 → 단일선', (x0 + x1) / 2, yTop + 20); }
      } else {
        ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
        ctx.fillText('A ← 두 스핀계(J = 7 Hz), 회색 눈금: 1차 근사의 선 위치 → B', (x0 + x1) / 2, yTop);
      }
      // 스펙트럼
      var ys0 = yTreeEnd + 18;
      var mx = 0, N = Math.round(x1 - x0) * 2, pts = [];
      for (var i = 0; i <= N; i++) { var hz = half - 2 * half * i / N, v = lor(hz, lines, st.lw); pts.push([X(hz), v]); mx = Math.max(mx, v); }
      lines.forEach(function (l) { mx = Math.max(mx, lor(l.x, lines, st.lw)); });
      if (st.mode === 2) {
        var dn = st.r * st.J2;
        [dn / 2 + st.J2 / 2, dn / 2 - st.J2 / 2, -dn / 2 + st.J2 / 2, -dn / 2 - st.J2 / 2].forEach(function (x) {
          if (Math.abs(x) <= half) { ctx.strokeStyle = T.figLine; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(x), yb); ctx.lineTo(X(x), yb - 12); ctx.stroke(); }
        });
      }
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1.6; ctx.beginPath();
      pts.forEach(function (p, i) { var y = yb - (yb - ys0) * p[1] / mx; if (i) ctx.lineTo(p[0], y); else ctx.moveTo(p[0], y); });
      ctx.stroke();
      // 축
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
      var step = half > 60 ? 20 : half > 25 ? 10 : 5;
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
      for (var t = -Math.floor(half / step) * step; t <= half; t += step) {
        ctx.beginPath(); ctx.moveTo(X(t), yb); ctx.lineTo(X(t), yb + 4); ctx.stroke();
        ctx.fillText((t > 0 ? '+' : '') + t, X(t), yb + 15);
      }
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figInk;
      var cen = st.d * st.mhz;
      ctx.fillText(st.mode === 1 ? '중심에서의 거리 (Hz)   ·   ' + (2 * half / st.mhz).toFixed(3) + ' ppm 폭 (' + st.mhz + ' MHz)' : '중심에서의 거리 (Hz)', (x0 + x1) / 2, yb + 32);
      // 읽기·표
      rN.set(st.mode === 1 ? String(lines.length) : '4');
      rC.set(st.mode === 1 ? cen.toFixed(0) + ' Hz (δ ' + st.d.toFixed(2) + ' × ' + st.mhz + ')' : 'Δν = ' + (st.r * st.J2).toFixed(1) + ' Hz');
      rW.set(st.mode === 1 ? (2 * span).toFixed(2) + ' Hz = ' + (2 * span / st.mhz).toFixed(4) + ' ppm' : '안쪽/바깥 = ' + ((1 + st.J2 / Math.sqrt(Math.pow(st.r * st.J2, 2) + st.J2 * st.J2)) / (1 - st.J2 / Math.sqrt(Math.pow(st.r * st.J2, 2) + st.J2 * st.J2))).toFixed(2));
      var wmax = 0; lines.forEach(function (l) { wmax = Math.max(wmax, l.w); });
      var show = lines.slice(0, 24);
      var html = '<table style="border-collapse:collapse"><tr><th style="text-align:left;padding:2px 6px">선 위치 (Hz)</th>' +
        show.map(function (l) { return '<td style="padding:2px 5px;text-align:center">' + (l.x > 0 ? '+' : '') + l.x.toFixed(2) + '</td>'; }).join('') +
        '</tr><tr><th style="text-align:left;padding:2px 6px">상대 세기</th>' +
        show.map(function (l) { return '<td style="padding:2px 5px;text-align:center">' + (l.w / wmax * 100).toFixed(0) + '</td>'; }).join('') + '</tr></table>' +
        (lines.length > 24 ? '<p style="margin:4px 0 0">선이 많아 앞의 24개만 보였다.</p>' : '');
      tbl.innerHTML = html;
    }
    api.onResize(draw);
    sync();
  },
});
