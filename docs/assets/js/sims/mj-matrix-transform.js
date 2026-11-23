/* 수학 도구 5 선형대수: 2×2 행렬이 평면(격자·단위원)을 바꾸는 모습과 고유벡터 */
Sims.register('mj-matrix-transform', {
  title: '2×2 행렬이 평면을 바꾸는 모습 — 고유벡터 찾기',
  caption: '네 원소 a, b, c, d를 바꾸면 격자와 단위원(점선)이 변환된 모습(파란 타원, 주황 평행사변형 = 단위 정사각형의 상)이 바로 그려진다. 단위원 위의 벡터 v(검정)를 끌거나 방향 슬라이더로 돌려 Av(빨강)와 나란해지는 방향을 찾아보자 — 그 방향이 고유벡터(보라·청록 점선)이고 길이의 비가 고유값이다. 대칭 행렬로 제한하면 고유값은 늘 실수이고 두 고유벡터는 직교한다. 회전처럼 고유값이 복소수이면 v와 Av는 끝내 나란해지지 않는다.',
  init: function (api) {
    var st = { a: 2, b: 1, c: 1, d: 2, th: 30, sym: false };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.42 : 0.62; }, label: '행렬 변환 평면: 격자, 단위원과 그 상, 벡터 v와 Av, 고유벡터 방향' });
    var ctx = cv.ctx;
    var rDet = api.readout('행렬식(넓이 배율) ');
    var rTr = api.readout('대각합 ');
    var rEig = api.readout('고유값 ');
    var rVec = api.readout('고유벡터 방향 ');
    var rAng = api.readout('v와 Av의 사잇각 ');

    function fmt(v) { var s = (Math.abs(v) < 0.005 ? 0 : v).toFixed(2); return s.replace('-', '−'); }
    var sl = {};
    ['a', 'b', 'c', 'd'].forEach(function (k) {
      sl[k] = api.slider({ id: 'mj-matrix-transform-' + k, label: k, min: -3, max: 3, step: 0.1, value: st[k], format: fmt,
        onInput: function (v) {
          st[k] = v;
          if (st.sym && (k === 'b' || k === 'c')) { var o = k === 'b' ? 'c' : 'b'; if (Math.abs(st[o] - v) > 1e-9) { st[o] = v; sl[o].set(v); } }
          draw();
        } });
    });
    var slTh = api.slider({ id: 'mj-matrix-transform-th', label: 'v의 방향 θ', min: 0, max: 360, step: 1, value: st.th,
      format: function (v) { return Math.round(v) + '°'; }, onInput: function (v) { st.th = v; draw(); } });
    var g = api.group();
    var symBtn = api.button('대칭 행렬로 제한 (c = b)', function (b) {
      st.sym = !st.sym; b.setAttribute('aria-pressed', st.sym ? 'true' : 'false');
      if (st.sym) { st.c = st.b; sl.c.set(st.b); }
      draw();
    }, { toggle: true, pressed: false, parent: g });
    var snapIdx = 0;
    api.button('v를 고유벡터에 맞추기', function () {
      var E = eig();
      if (!E.real || !E.vecs.length) { draw(); return; }
      var v = E.vecs[snapIdx % E.vecs.length]; snapIdx++;
      var ang = Math.atan2(v[1], v[0]) * 180 / Math.PI; if (ang < 0) ang += 360;
      slTh.set(Math.round(ang * 10) / 10);
    }, { primary: true, parent: g });
    var g2 = api.group();
    [['예: [[2, 1], [1, 2]]', [2, 1, 1, 2]], ['층밀리기 [[1, 1], [0, 1]]', [1, 1, 0, 1]], ['90° 회전', [0, -1, 1, 0]], ['문제 3: [[4, 1], [2, 3]]', [4, 1, 2, 3]]].forEach(function (p) {
      api.button(p[0], function () {
        if (st.sym && p[1][1] !== p[1][2]) { st.sym = false; symBtn.setAttribute('aria-pressed', 'false'); }
        ['a', 'b', 'c', 'd'].forEach(function (k, i) { st[k] = p[1][i]; sl[k].set(p[1][i]); });
        draw();
      }, { parent: g2 });
    });

    function eig() {
      var a = st.a, b = st.b, c = st.c, d = st.d, tr = a + d, det = a * d - b * c, disc = tr * tr - 4 * det;
      var R = { tr: tr, det: det, real: disc >= -1e-9, vecs: [], lams: [] };
      if (!R.real) { var re = tr / 2, im = Math.sqrt(-disc) / 2; R.re = re; R.im = im; return R; }
      var sq = Math.sqrt(Math.max(0, disc));
      var ls = sq < 1e-6 ? [tr / 2] : [(tr + sq) / 2, (tr - sq) / 2];
      R.lams = sq < 1e-6 ? [tr / 2, tr / 2] : ls;
      R.all = sq < 1e-6 && Math.abs(b) < 1e-9 && Math.abs(c) < 1e-9;   // λI: 모든 방향이 고유벡터
      if (R.all) { R.vecs = [[1, 0], [0, 1]]; return R; }
      ls.forEach(function (l) {
        var v;
        if (Math.abs(b) > 1e-9 || Math.abs(l - a) > 1e-9) v = [b, l - a];
        else v = [l - d, c];
        if (Math.hypot(v[0], v[1]) < 1e-9) v = Math.abs(c) > 1e-9 ? [l - d, c] : [1, 0];
        var n = Math.hypot(v[0], v[1]); v = [v[0] / n, v[1] / n];
        if (v[0] < -1e-9 || (Math.abs(v[0]) < 1e-9 && v[1] < 0)) v = [-v[0], -v[1]];
        R.vecs.push(v);
      });
      return R;
    }
    function mul(p) { return [st.a * p[0] + st.b * p[1], st.c * p[0] + st.d * p[1]]; }

    var view = { cx: 0, cy: 0, s: 1, R: 4.2 };
    function layout() {
      var w = cv.w, h = cv.h, narrow = w < 560;
      var side = narrow ? w : Math.min(h, w * 0.66);
      view.cx = side / 2; view.cy = side / 2; view.s = (side / 2 - 8) / view.R;
      view.narrow = narrow; view.side = side;
    }
    function X(p) { return [view.cx + p[0] * view.s, view.cy - p[1] * view.s]; }
    function line(p, q, col, lw, dash) {
      var A = X(p), B = X(q); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]);
      ctx.strokeStyle = col; ctx.lineWidth = lw || 1; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
    }
    function arrow(p, q, col, lw) {
      var A = X(p), B = X(q), L = Math.hypot(B[0] - A[0], B[1] - A[1]); if (L < 2) return;
      var ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L, hs = 10 + lw;
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0] - ux * hs * 0.8, B[1] - uy * hs * 0.8);
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(B[0], B[1]); ctx.lineTo(B[0] - ux * hs - uy * hs * 0.45, B[1] - uy * hs + ux * hs * 0.45);
      ctx.lineTo(B[0] - ux * hs + uy * hs * 0.45, B[1] - uy * hs - ux * hs * 0.45); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    }
    function label(p, txt, col, dx, dy, bold) {
      var A = X(p); ctx.font = (bold ? '600 ' : '') + '13px ' + T.fontBody; ctx.fillStyle = col; ctx.textAlign = 'left';
      var x = Math.min(Math.max(A[0] + (dx || 0), 4), view.side - ctx.measureText(txt).width - 4);
      var y = Math.min(Math.max(A[1] + (dy || 0), 14), view.side - 4);
      ctx.fillText(txt, x, y);
    }
    var T;
    function draw() {
      T = api.tokens(); layout();
      var w = cv.w, h = cv.h, R = view.R, E = eig();
      ctx.clearRect(0, 0, w, h);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, view.side, view.side); ctx.clip();
      ctx.fillStyle = T.figPaper; ctx.fillRect(0, 0, view.side, view.side);
      // 원래 격자
      for (var i = -4; i <= 4; i++) { line([i, -R], [i, R], T.figLine, i === 0 ? 1.2 : 0.5); line([-R, i], [R, i], T.figLine, i === 0 ? 1.2 : 0.5); }
      // 변환된 격자
      ctx.globalAlpha = 0.55;
      for (var j = -6; j <= 6; j++) {
        line(mul([j, -8]), mul([j, 8]), T.figAccent, 0.8); line(mul([-8, j]), mul([8, j]), T.figAccent, 0.8);
      }
      ctx.globalAlpha = 1;
      // 단위 정사각형의 상
      var q = [[0, 0], mul([1, 0]), mul([1, 1]), mul([0, 1])].map(X);
      ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (var k = 1; k < 4; k++) ctx.lineTo(q[k][0], q[k][1]); ctx.closePath();
      ctx.fillStyle = T.figSoftAmber; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1.5; ctx.stroke();
      // 단위원과 상(타원)
      ctx.beginPath();
      for (var t = 0; t <= 120; t++) { var an = t / 120 * 2 * Math.PI, P = X(mul([Math.cos(an), Math.sin(an)])); if (t) ctx.lineTo(P[0], P[1]); else ctx.moveTo(P[0], P[1]); }
      ctx.closePath(); ctx.fillStyle = T.figSoftBlue; ctx.globalAlpha = 0.6; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(view.cx, view.cy, view.s, 0, 2 * Math.PI); ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
      // 고유벡터 방향
      var ecol = [T.figViolet, T.figTeal];
      if (E.real && !E.all) {
        E.vecs.forEach(function (v, n) {
          line([-v[0] * 9, -v[1] * 9], [v[0] * 9, v[1] * 9], ecol[n], 1.8, [7, 5]);
          var lam = E.vecs.length === 1 ? E.lams[0] : E.lams[n];
          var pp = [v[0] * Math.min(3.6, Math.max(1.4, Math.abs(lam) + 0.5)), v[1] * Math.min(3.6, Math.max(1.4, Math.abs(lam) + 0.5))];
          label(pp, 'λ = ' + fmt(lam), ecol[n], 6, -6, true);
        });
      }
      // 열벡터 Ae1, Ae2
      arrow([0, 0], mul([1, 0]), T.figGreen, 2); arrow([0, 0], mul([0, 1]), T.figGreen, 2);
      label(mul([1, 0]), 'Ae₁', T.figGreen, 6, 14); label(mul([0, 1]), 'Ae₂', T.figGreen, 6, -6);
      // v 와 Av
      var th = st.th * Math.PI / 180, v = [Math.cos(th), Math.sin(th)], Av = mul(v);
      var nAv = Math.hypot(Av[0], Av[1]), cross = v[0] * Av[1] - v[1] * Av[0], dot = v[0] * Av[0] + v[1] * Av[1];
      var par = nAv > 1e-6 ? Math.abs(cross) / nAv < 0.02 : true;
      arrow([0, 0], Av, T.figRed, par ? 4 : 3);
      arrow([0, 0], v, T.figInk, 3);
      var hv = X(v); ctx.beginPath(); ctx.arc(hv[0], hv[1], 7, 0, 2 * Math.PI); ctx.fillStyle = T.figInk; ctx.fill();
      ctx.beginPath(); ctx.arc(hv[0], hv[1], 3, 0, 2 * Math.PI); ctx.fillStyle = T.figPaper; ctx.fill();
      label(Av, 'Av', T.figRed, 8, -8, true);
      label(v, 'v', T.figInk, -16, -10, true);
      ctx.restore();
      if (par) {
        var lamv = dot;   // v는 단위 벡터
        var msg = '나란하다! Av = ' + fmt(lamv) + ' v  → v는 고유벡터';
        ctx.font = '600 13px ' + T.fontBody; var tw = ctx.measureText(msg).width;
        ctx.fillStyle = T.figPanel; ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1.5;
        ctx.fillRect(8, 8, tw + 16, 26); ctx.strokeRect(8, 8, tw + 16, 26);
        ctx.fillStyle = T.figViolet; ctx.textAlign = 'left'; ctx.fillText(msg, 16, 26);
      }
      // 범례 패널
      var lx = view.narrow ? 10 : view.side + 18, ly = view.narrow ? view.side + 22 : 26;
      ctx.font = '600 14px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left';
      ctx.fillText('A = [[' + fmt(st.a) + ', ' + fmt(st.b) + '], [' + fmt(st.c) + ', ' + fmt(st.d) + ']]', lx, ly);
      var items = [[T.figInk, '단위원(점선)과 v'], [T.figRed, 'Av'], [T.figBlue, '단위원의 상(타원)'], [T.figAmber, '단위 정사각형의 상(넓이 |det A|)'],
        [T.figGreen, '열벡터 Ae₁, Ae₂'], [T.figAccent, '변환된 격자'], [T.figViolet, '고유벡터 방향(점선)']];
      ctx.font = '12px ' + T.fontBody;
      items.forEach(function (it, n) {
        var col = view.narrow ? n % 2 : 0, row = view.narrow ? Math.floor(n / 2) : n;
        var x = lx + col * (cv.w / 2), y = ly + 22 + row * (view.narrow ? 19 : 22);
        ctx.fillStyle = it[0]; ctx.fillRect(x, y - 9, 14, 9); ctx.fillStyle = T.figMuted; ctx.fillText(it[1], x + 20, y);
      });
      if (!view.narrow) {
        var y0 = 26 + 22 + items.length * 22 + 14;
        ctx.fillStyle = T.figInk; ctx.font = '13px ' + T.fontBody;
        var lines = E.real ? (E.all ? ['모든 방향이 고유벡터 (A = λI)'] : ['고유값이 실수', E.vecs.length === 2 ? '고유벡터 사잇각 ' + angBetween(E.vecs) + '°' : '고유벡터가 한 방향뿐(대각화 불가)'])
          : ['고유값이 복소수 → v와 Av는', '어떤 방향에서도 나란하지 않다'];
        lines.forEach(function (s, n) { ctx.fillText(s, lx, y0 + n * 19); });
      }
      // 읽기 값
      rDet.set(fmt(E.det)); rTr.set(fmt(E.tr));
      if (E.real) rEig.set(E.lams.length === 2 && Math.abs(E.lams[0] - E.lams[1]) < 1e-6 ? fmt(E.lams[0]) + ' (중근)' : E.lams.map(fmt).join(', '));
      else rEig.set(fmt(E.re) + ' ± ' + fmt(E.im) + 'i');
      if (!E.real) rVec.set('실수 방향 없음');
      else if (E.all) rVec.set('모든 방향');
      else rVec.set(E.vecs.map(function (v) { var a = Math.atan2(v[1], v[0]) * 180 / Math.PI; return a.toFixed(1).replace('-', '−') + '°'; }).join(', ') + (E.vecs.length === 2 ? ' (사잇각 ' + angBetween(E.vecs) + '°)' : ''));
      var ang = nAv > 1e-9 ? Math.acos(Math.max(-1, Math.min(1, dot / nAv))) * 180 / Math.PI : 0;
      rAng.set(ang.toFixed(1) + '°');
    }
    function angBetween(vs) { var c = Math.abs(vs[0][0] * vs[1][0] + vs[0][1] * vs[1][1]); return (Math.acos(Math.min(1, c)) * 180 / Math.PI).toFixed(1); }

    // 끌기: v 끝 근처에서 시작하면 단위원을 따라 돌린다
    var dragging = false, c = cv.canvas;
    c.style.touchAction = 'pan-y';
    function toAngle(e) {
      var r = c.getBoundingClientRect(), x = e.clientX - r.left - view.cx, y = view.cy - (e.clientY - r.top);
      var a = Math.atan2(y, x) * 180 / Math.PI; if (a < 0) a += 360; return a;
    }
    c.addEventListener('pointerdown', function (e) {
      var r = c.getBoundingClientRect(), th = st.th * Math.PI / 180;
      var hx = view.cx + Math.cos(th) * view.s, hy = view.cy - Math.sin(th) * view.s;
      if (Math.hypot(e.clientX - r.left - hx, e.clientY - r.top - hy) < 28) {
        dragging = true; c.setPointerCapture(e.pointerId); c.style.touchAction = 'none'; e.preventDefault();
      }
    });
    c.addEventListener('pointermove', function (e) { if (dragging) { slTh.set(Math.round(toAngle(e))); } });
    function end() { dragging = false; c.style.touchAction = 'pan-y'; }
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);

    api.onResize(draw);
    draw();
  },
});
