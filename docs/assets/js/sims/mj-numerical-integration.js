/* 수학 도구 2 ⑨ 수치 적분: 사다리꼴·심프슨 조각을 그리고, 오차 대 간격 h 를 log–log 로 찍어 기울기 2·4 와 비교한다 */
Sims.register('mj-numerical-integration', {
  title: '수치 적분 비교기 — 사다리꼴 공식과 심프슨 공식',
  caption: '함수를 고르고 구간 수 n을 바꿔 보자. 왼쪽에는 사다리꼴(파란 직선)과 심프슨(주황 포물선, n이 짝수일 때만) 조각이, 오른쪽 log–log 그래프에는 지금까지 고른 n마다 오차 |근삿값 − 참값|이 점으로 찍힌다. 점들은 기울기 2(사다리꼴, h² 비례)와 4(심프슨, h⁴ 비례) 기준선과 나란하다. ‘자료표’에서는 등간격 자료(처음 값은 예제 16의 Cₚ/T)를 직접 고쳐 넣을 수 있고, 참값이 없으므로 간격 h와 2h의 사다리꼴 값으로 오차를 (T₂ₕ − Tₕ)/3로 어림한다.',
  init: function (api) {
    var FN = {
      gauss: { name: 'e^(−x²)', a: 0, b: 1, exact: 0.7468241328124270, f: function (x) { return Math.exp(-x * x); } },
      sin: { name: 'sin x', a: 0, b: Math.PI, exact: 2, f: function (x) { return Math.sin(x); } },
      inv: { name: '1/x', a: 1, b: 2, exact: Math.LN2, f: function (x) { return 1 / x; } },
      data: { name: '자료표' },
    };
    var st = { fn: 'gauss', n: 4, pts: {}, data: null };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.35 : 0.5; }, label: '수치 적분 조각과 오차–간격 log–log 그래프' });
    var ctx = cv.ctx;
    var rH = api.readout('h = '), rT = api.readout('사다리꼴 '), rS = api.readout('심프슨 '), rX = api.readout('참값 ');
    var g = api.group();
    var keys = ['gauss', 'sin', 'inv', 'data'];
    var btns = keys.map(function (k) { return api.button(FN[k].name, function () { setFn(k); }, { toggle: true, pressed: k === st.fn, parent: g }); });
    var sN = api.slider({ id: 'mj-numerical-integration-n', label: '구간 수 n', min: 2, max: 64, step: 1, value: st.n,
      format: function (v) { return String(v); }, onInput: function (v) { st.n = v; record(); update(); } });
    var all = api.button('n = 2, 4, …, 64 모두 찍기', function () { [2, 4, 8, 16, 32, 64].forEach(function (n) { record(n); }); update(); });
    // 자료표 입력
    var lab = api.el('label'); lab.setAttribute('for', 'mj-numerical-integration-data');
    lab.appendChild(document.createTextNode('자료 (x:y, 등간격) '));
    var inp = api.el('input'); inp.id = 'mj-numerical-integration-data'; inp.type = 'text';
    inp.value = '100:0.1600, 150:0.1360, 200:0.1130, 250:0.0944, 300:0.0813';
    inp.style.width = '100%'; inp.style.minWidth = '0'; inp.style.font = 'inherit'; inp.style.fontSize = '0.85rem';
    lab.style.flex = '1 1 100%'; lab.appendChild(inp); api.controls.appendChild(lab);
    inp.addEventListener('input', function () { update(); });

    function parseData() {
      var parts = inp.value.split(/[,;\n]+/), xs = [], ys = [];
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i].trim(); if (!p) continue;
        var m = p.split(':'); if (m.length !== 2) return { err: '“x:y” 꼴로 쓰시오' };
        var x = parseFloat(m[0]), y = parseFloat(m[1]);
        if (!isFinite(x) || !isFinite(y)) return { err: '숫자가 아닌 값이 있다' };
        xs.push(x); ys.push(y);
      }
      if (xs.length < 2) return { err: '점이 2개 이상 필요하다' };
      var h = xs[1] - xs[0];
      if (!(h > 0)) return { err: 'x는 커지는 순서로' };
      for (var j = 2; j < xs.length; j++) if (Math.abs(xs[j] - xs[j - 1] - h) > 1e-6 * Math.abs(h)) return { err: '간격이 같지 않다' };
      return { xs: xs, ys: ys, h: h, n: xs.length - 1 };
    }
    function trap(y, h) { var s = (y[0] + y[y.length - 1]) / 2; for (var i = 1; i < y.length - 1; i++) s += y[i]; return s * h; }
    function simp(y, h) { var n = y.length - 1; if (n % 2) return NaN; var s = y[0] + y[n]; for (var i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * y[i]; return s * h / 3; }
    function sample(fo, n) { var h = (fo.b - fo.a) / n, y = []; for (var i = 0; i <= n; i++) y.push(fo.f(fo.a + i * h)); return { y: y, h: h }; }
    function record(n) {
      if (st.fn === 'data') return; n = n || st.n;
      var fo = FN[st.fn], s = sample(fo, n), key = st.fn;
      st.pts[key] = st.pts[key] || {};
      st.pts[key][n] = { h: s.h, et: Math.abs(trap(s.y, s.h) - fo.exact), es: n % 2 ? NaN : Math.abs(simp(s.y, s.h) - fo.exact) };
    }
    function setFn(k) {
      st.fn = k;
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', keys[i] === k ? 'true' : 'false'); });
      sN.input.disabled = k === 'data'; all.disabled = k === 'data';
      lab.style.display = k === 'data' ? '' : 'none';
      record(); update();
    }
    function e(v) { return v === 0 ? '0' : v.toExponential(1).replace('e', '×10^').replace('-', '−').replace('^+', '^'); }
    function update() { draw(); readouts(); }
    function readouts() {
      if (st.fn === 'data') {
        var d = parseData();
        if (d.err) { rH.set('–'); rT.set(d.err); rS.set('–'); rX.set('없음(측정 자료)'); return; }
        var T1 = trap(d.ys, d.h), S1 = simp(d.ys, d.h);
        rH.set(String(+d.h.toPrecision(4)) + ' (n = ' + d.n + ')');
        if (d.n % 2 === 0) {
          var y2 = d.ys.filter(function (_, i) { return i % 2 === 0; }), T2 = trap(y2, 2 * d.h);
          var est = (T2 - T1) / 3; rT.set(T1.toPrecision(5) + ' (오차 어림 ' + (est >= 0 ? '+' : '−') + Math.abs(est).toPrecision(2) + ')');
        } else rT.set(T1.toPrecision(5));
        rS.set(isNaN(S1) ? 'n이 홀수라 쓸 수 없음' : S1.toPrecision(5)); rX.set('없음(측정 자료)');
        return;
      }
      var fo = FN[st.fn], s = sample(fo, st.n), T = trap(s.y, s.h), S = simp(s.y, s.h);
      rH.set(s.h.toPrecision(3));
      rT.set(T.toFixed(6) + ' (오차 ' + e(Math.abs(T - fo.exact)) + ')');
      rS.set(isNaN(S) ? 'n이 홀수라 쓸 수 없음' : S.toFixed(6) + ' (오차 ' + e(Math.abs(S - fo.exact)) + ')');
      rX.set(fo.exact.toFixed(6));
    }
    function panels() {
      var w = cv.w, h = cv.h;
      if (w < 560) return { A: { x: 44, y: 14, w: w - 58, h: h * 0.42 }, B: { x: 54, y: h * 0.53, w: w - 68, h: h * 0.38 } };
      return { A: { x: 44, y: 14, w: w * 0.48 - 50, h: h - 50 }, B: { x: w * 0.56, y: 14, w: w * 0.44 - 18, h: h - 50 } };
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, P = panels();
      ctx.clearRect(0, 0, w, h);
      var xs, ys, a, b, f, n;
      if (st.fn === 'data') {
        var d = parseData();
        if (d.err) { ctx.fillStyle = T.figRed; ctx.font = '13px ' + T.fontBody; ctx.fillText('자료 오류: ' + d.err, P.A.x, P.A.y + 30); return; }
        xs = d.xs; ys = d.ys; a = xs[0]; b = xs[xs.length - 1]; n = d.n; f = null;
      } else {
        var fo = FN[st.fn]; a = fo.a; b = fo.b; n = st.n; f = fo.f; xs = []; ys = [];
        for (var i = 0; i <= n; i++) { xs.push(a + (b - a) * i / n); ys.push(f(xs[i])); }
      }
      // 왼쪽: 조각
      var A = P.A, ymax = 0, ymin = 0;
      ys.forEach(function (v) { ymax = Math.max(ymax, v); ymin = Math.min(ymin, v); });
      if (f) for (var k = 0; k <= 200; k++) { var vv = f(a + (b - a) * k / 200); ymax = Math.max(ymax, vv); }
      ymax *= 1.4; if (ymax <= 0) ymax = 1;
      var X = function (x) { return A.x + (x - a) / (b - a) * A.w; };
      var Y = function (y) { return A.y + A.h - (y - ymin) / (ymax - ymin) * A.h; };
      ctx.fillStyle = T.figSoftBlue; ctx.beginPath(); ctx.moveTo(X(a), Y(0));
      for (k = 0; k <= n; k++) ctx.lineTo(X(xs[k]), Y(ys[k]));
      ctx.lineTo(X(b), Y(0)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = T.figBlue; ctx.lineWidth = 1;
      for (k = 0; k <= n; k++) { ctx.beginPath(); ctx.moveTo(X(xs[k]), Y(0)); ctx.lineTo(X(xs[k]), Y(ys[k])); ctx.stroke(); }
      ctx.lineWidth = 1.8; ctx.beginPath(); for (k = 0; k <= n; k++) { if (k) ctx.lineTo(X(xs[k]), Y(ys[k])); else ctx.moveTo(X(xs[k]), Y(ys[k])); } ctx.stroke();
      if (f) {
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 2.4; ctx.beginPath();
        for (k = 0; k <= 300; k++) { var xx = a + (b - a) * k / 300; if (k) ctx.lineTo(X(xx), Y(f(xx))); else ctx.moveTo(X(xx), Y(f(xx))); }
        ctx.stroke();
      }
      if (n % 2 === 0) {
        ctx.strokeStyle = T.figAmber; ctx.lineWidth = 2.2; ctx.setLineDash([6, 4]); ctx.beginPath();
        for (var j = 0; j < n; j += 2) {
          var x0 = xs[j], x1 = xs[j + 1], x2 = xs[j + 2], y0 = ys[j], y1 = ys[j + 1], y2 = ys[j + 2];
          for (k = 0; k <= 30; k++) {
            var x = x0 + (x2 - x0) * k / 30;
            var y = y0 * (x - x1) * (x - x2) / ((x0 - x1) * (x0 - x2)) + y1 * (x - x0) * (x - x2) / ((x1 - x0) * (x1 - x2)) + y2 * (x - x0) * (x - x1) / ((x2 - x0) * (x2 - x1));
            if (k === 0 && j === 0) ctx.moveTo(X(x), Y(y)); else ctx.lineTo(X(x), Y(y));
          }
        }
        ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.fillStyle = T.figInk; for (k = 0; k <= n; k++) { if (n <= 32 || !f) { ctx.beginPath(); ctx.arc(X(xs[k]), Y(ys[k]), n > 16 ? 2 : 3.2, 0, Math.PI * 2); ctx.fill(); } }
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(A.x, Y(0)); ctx.lineTo(A.x + A.w, Y(0)); ctx.moveTo(A.x, A.y); ctx.lineTo(A.x, A.y + A.h); ctx.stroke();
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
      var lb = function (v) { return st.fn === 'sin' && v > 3 ? 'π' : String(+v.toPrecision(3)); };
      ctx.fillText(lb(a), X(a), Y(0) + 14); ctx.fillText(lb(b), X(b), Y(0) + 14);
      ctx.textAlign = 'right'; ctx.fillText((+ymax.toPrecision(2)).toString(), A.x - 4, A.y + 8); ctx.fillText('0', A.x - 4, Y(0) + 4);
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillStyle = T.figInk;
      ctx.fillText((f ? 'f(x) = ' + FN[st.fn].name : '자료점') + ',  n = ' + n, A.x + 8, A.y + 12);
      ctx.fillStyle = T.figBlue; ctx.fillText('— 사다리꼴', A.x + 8, A.y + 28);
      ctx.fillStyle = T.figAmber; ctx.fillText(n % 2 === 0 ? '- - 심프슨 포물선' : '심프슨: n이 홀수라 없음', A.x + 8, A.y + 44);
      // 오른쪽: log–log
      var B = P.B, lx0 = -2.2, lx1 = 0.4, ly0 = -13, ly1 = 0;
      var LX = function (v) { return B.x + (v - lx0) / (lx1 - lx0) * B.w; };
      var LY = function (v) { return B.y + B.h - (v - ly0) / (ly1 - ly0) * B.h; };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      for (var gx = -2; gx <= 0; gx++) { ctx.beginPath(); ctx.moveTo(LX(gx), B.y); ctx.lineTo(LX(gx), B.y + B.h); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText('10^' + String(gx).replace('-', '−'), LX(gx), B.y + B.h + 14); }
      for (var gy = -12; gy <= 0; gy += 3) { ctx.beginPath(); ctx.moveTo(B.x, LY(gy)); ctx.lineTo(B.x + B.w, LY(gy)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText('10^' + String(gy).replace('-', '−'), B.x - 4, LY(gy) + 4); }
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2; ctx.strokeRect(B.x, B.y, B.w, B.h);
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('간격 h (로그 눈금)', B.x + B.w / 2, B.y + B.h + 29);
      ctx.save(); ctx.translate(B.x - 40, B.y + B.h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('오차 (로그 눈금)', 0, 0); ctx.restore();
      if (st.fn === 'data') {
        ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
        ctx.fillText('자료 모드: 참값이 없어', B.x + B.w / 2, B.y + B.h / 2 - 8);
        ctx.fillText('오차 그래프 대신 (T₂ₕ − Tₕ)/3로 어림', B.x + B.w / 2, B.y + B.h / 2 + 10);
        return;
      }
      ctx.save(); ctx.beginPath(); ctx.rect(B.x, B.y, B.w, B.h); ctx.clip();
      var pts = st.pts[st.fn] || {}, fo2 = FN[st.fn];
      // 기준선: n = 2 의 값을 지나는 기울기 2, 4
      var s2 = sample(fo2, 2), h2 = Math.log10(s2.h);
      var t2 = Math.log10(Math.abs(trap(s2.y, s2.h) - fo2.exact)), q2 = Math.log10(Math.abs(simp(s2.y, s2.h) - fo2.exact));
      [[t2, 2, T.figBlue], [q2, 4, T.figAmber]].forEach(function (r) {
        ctx.strokeStyle = r[2]; ctx.globalAlpha = 0.6; ctx.lineWidth = 1.3; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(LX(lx0), LY(r[0] + r[1] * (lx0 - h2))); ctx.lineTo(LX(lx1), LY(r[0] + r[1] * (lx1 - h2))); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
      });
      Object.keys(pts).forEach(function (kk) {
        var p = pts[kk], cur = +kk === st.n, hx = Math.log10(p.h);
        if (p.et > 0) { ctx.fillStyle = T.figBlue; ctx.beginPath(); ctx.arc(LX(hx), LY(Math.max(ly0, Math.log10(p.et))), cur ? 6 : 3.5, 0, Math.PI * 2); ctx.fill(); }
        if (p.es > 0) { ctx.fillStyle = T.figAmber; var sz = cur ? 11 : 7; ctx.fillRect(LX(hx) - sz / 2, LY(Math.max(ly0, Math.log10(p.es))) - sz / 2, sz, sz); }
      });
      ctx.restore();
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figBlue; ctx.fillText('● 사다리꼴, 점선 기울기 2', B.x + 8, B.y + B.h - 24);
      ctx.fillStyle = T.figAmber; ctx.fillText('■ 심프슨, 점선 기울기 4', B.x + 8, B.y + B.h - 8);
    }
    api.onResize(draw); api.onTheme(draw);
    setFn(st.fn);
  },
});
