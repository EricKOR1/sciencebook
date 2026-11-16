/* 물리학 2 전기와 자기: 점전하 1~2개 주위의 전기장 화살표와 시험 전하가 받는 힘 (정성적) */
Sims.register('electric-field', {
  title: '전기장 지도 — 전하 주위 공간의 힘의 방향과 세기',
  caption: '화살표는 그 자리에 (+)전하를 놓았을 때 받는 힘의 방향이고, 진하고 길수록 전기장이 세다. 전하를 끌어서 옮기고, 시험 전하(작은 원)도 끌어 보자. 전하에 가까울수록 전기장이 세고, (−) 시험 전하는 전기장과 반대 방향으로 힘을 받는다. 두 전하의 전하량 크기는 같다고 가정했고, 화살표 길이는 세기를 비교하기 쉽도록 줄여서 나타냈다.',
  init: function (api) {
    var st = { n: 2, qA: 1, qB: -1, qt: 1, A: { x: -1.5, y: 0 }, B: { x: 1.5, y: 0 }, t: { x: 0, y: 1.4 }, drag: null };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 0.95 : 0.55; }, label: '점전하 주위의 전기장 화살표와 시험 전하가 받는 힘' });
    var ctx = cv.ctx, c = cv.canvas;
    c.style.touchAction = 'none';

    var rF = api.readout('시험 전하가 받는 힘의 방향');
    var rS = api.readout('그 자리 전기장의 세기');

    var g1 = api.group();
    var b1 = api.button('전하 1개', function () { st.n = 1; sync(); }, { toggle: true, parent: g1 });
    var b2 = api.button('전하 2개', function () { st.n = 2; sync(); }, { toggle: true, pressed: true, parent: g1 });
    var g2 = api.group();
    var bA = api.button('', function () { st.qA = -st.qA; sync(); }, { parent: g2 });
    var bB = api.button('', function () { st.qB = -st.qB; sync(); }, { parent: g2 });
    var bT = api.button('', function () { st.qt = -st.qt; sync(); }, { parent: g2 });
    api.slider({ id: 'electric-field-sep', label: '두 전하 사이 거리', min: 1, max: 4.5, step: 0.25, value: 3,
      format: function (v) { return v.toFixed(2) + ' (칸)'; }, onInput: function (v) { st.A = { x: -v / 2, y: 0 }; st.B = { x: v / 2, y: 0 }; draw(); } });

    function sync() {
      b1.setAttribute('aria-pressed', st.n === 1 ? 'true' : 'false'); b2.setAttribute('aria-pressed', st.n === 2 ? 'true' : 'false');
      bA.textContent = '전하 A: ' + (st.qA > 0 ? '(+)' : '(−)') + ' 바꾸기';
      bB.textContent = '전하 B: ' + (st.qB > 0 ? '(+)' : '(−)') + ' 바꾸기';
      bB.disabled = st.n === 1;
      bT.textContent = '시험 전하: ' + (st.qt > 0 ? '(+)' : '(−)') + ' 바꾸기';
      draw();
    }
    function charges() { var a = [{ p: st.A, q: st.qA, name: 'A' }]; if (st.n === 2) a.push({ p: st.B, q: st.qB, name: 'B' }); return a; }
    function field(x, y) {
      var ex = 0, ey = 0;
      charges().forEach(function (ch) {
        var dx = x - ch.p.x, dy = y - ch.p.y, r2 = dx * dx + dy * dy, r = Math.sqrt(r2);
        if (r < 1e-4) return;
        ex += ch.q * dx / (r2 * r); ey += ch.q * dy / (r2 * r);
      });
      return { x: ex, y: ey, m: Math.hypot(ex, ey) };
    }
    // 화면 변환: 세로 범위 ±2.4 칸
    function view() { var s = cv.h / 5; return { s: s, X: function (x) { return cv.w / 2 + x * s; }, Y: function (y) { return cv.h / 2 - y * s; }, ix: function (px) { return (px - cv.w / 2) / s; }, iy: function (py) { return (cv.h / 2 - py) / s; } }; }
    var REF = 1 / (0.5 * 0.5);   // 거리 0.5 칸인 곳의 세기를 '아주 셈' 기준으로
    function level(m) { var r = m / REF; return r > 0.6 ? '아주 세다' : r > 0.18 ? '세다' : r > 0.05 ? '보통' : r > 0.012 ? '약하다' : '아주 약하다'; }
    function dirWord(x, y) {
      var ang = Math.atan2(y, x) * 180 / Math.PI;
      var names = ['오른쪽', '오른쪽 위', '위', '왼쪽 위', '왼쪽', '왼쪽 아래', '아래', '오른쪽 아래'];
      return names[((Math.round(ang / 45) % 8) + 8) % 8];
    }

    function arrow(x0, y0, x1, y1, col, lw, hs) {
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      var a = Math.atan2(y1 - y0, x1 - x0);
      ctx.beginPath(); ctx.moveTo(x1 + Math.cos(a) * hs * 0.4, y1 + Math.sin(a) * hs * 0.4);
      ctx.lineTo(x1 - hs * Math.cos(a - 0.45), y1 - hs * Math.sin(a - 0.45)); ctx.lineTo(x1 - hs * Math.cos(a + 0.45), y1 - hs * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
    }

    function draw() {
      var T = api.tokens(), V = view(), w = cv.w, h = cv.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = T.figPaper; ctx.fillRect(0, 0, w, h);
      // 격자 화살표
      var step = Math.max(26, Math.min(40, w / 22)), cell = step / V.s;
      for (var py = step / 2; py < h; py += step) for (var px = step / 2; px < w; px += step) {
        var x = V.ix(px), y = V.iy(py), near = false;
        charges().forEach(function (ch) { if (Math.hypot(x - ch.p.x, y - ch.p.y) < cell * 0.75) near = true; });
        if (near) continue;
        var E = field(x, y); if (E.m < 1e-9) continue;
        var r = Math.min(1, Math.max(0, (Math.log(E.m / REF) / Math.LN10 + 2.6) / 2.6));   // 0~1 (로그 눈금)
        var len = step * (0.25 + 0.55 * r), ux = E.x / E.m, uy = -E.y / E.m;
        ctx.globalAlpha = 0.25 + 0.75 * r;
        arrow(px - ux * len / 2, py - uy * len / 2, px + ux * len / 2, py + uy * len / 2, T.figAccent, 1.2 + 1.2 * r, 4 + 3 * r);
      }
      ctx.globalAlpha = 1;
      // 전하
      charges().forEach(function (ch) {
        var X = V.X(ch.p.x), Y = V.Y(ch.p.y), pos = ch.q > 0;
        ctx.beginPath(); ctx.arc(X, Y, 16, 0, Math.PI * 2);
        ctx.fillStyle = pos ? T.figSoftRed : T.figSoftBlue; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = pos ? T.figRed : T.figBlue; ctx.stroke();
        ctx.fillStyle = pos ? T.figRed : T.figBlue; ctx.font = '700 18px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(pos ? '+' : '−', X, Y + 1);
        ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.fillText(ch.name, X, Y - 26);
        ctx.textBaseline = 'alphabetic';
      });
      // 시험 전하와 힘
      var tx = V.X(st.t.x), ty = V.Y(st.t.y), E = field(st.t.x, st.t.y);
      if (E.m > 1e-9) {
        var r = Math.min(1, Math.max(0, (Math.log(E.m / REF) / Math.LN10 + 2.6) / 2.6));
        var L = 24 + 60 * r, fx = st.qt * E.x / E.m, fy = st.qt * E.y / E.m;
        arrow(tx + fx * 11, ty - fy * 11, tx + fx * (11 + L), ty - fy * (11 + L), T.figViolet, 3.5, 11);
        ctx.fillStyle = T.figViolet; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center';
        ctx.fillText('받는 힘', tx + fx * (11 + L + 16), ty - fy * (11 + L + 16) + 4);
        rF.set(dirWord(fx, fy) + (st.qt > 0 ? ' (전기장과 같은 방향)' : ' (전기장과 반대 방향)'));
        rS.set(level(E.m));
      } else { rF.set('힘을 받지 않는다'); rS.set('0 (두 전기장이 상쇄)'); }
      ctx.beginPath(); ctx.arc(tx, ty, 10, 0, Math.PI * 2);
      ctx.fillStyle = T.figPanel; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = T.figViolet; ctx.stroke();
      ctx.fillStyle = T.figViolet; ctx.font = '700 13px ' + T.fontBody; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(st.qt > 0 ? '+' : '−', tx, ty + 1); ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('전하와 시험 전하는 끌어서 옮길 수 있다', 8, h - 8);
    }

    // 끌기
    function pt(e) { var b = c.getBoundingClientRect(), V = view(); return { x: V.ix(e.clientX - b.left), y: V.iy(e.clientY - b.top) }; }
    function clampP(p) { var V = view(); var mx = cv.w / 2 / V.s - 0.2, my = 2.3; return { x: Math.max(-mx, Math.min(mx, p.x)), y: Math.max(-my, Math.min(my, p.y)) }; }
    c.addEventListener('pointerdown', function (e) {
      var p = pt(e), V = view(), tol = 22 / V.s;
      if (Math.hypot(p.x - st.t.x, p.y - st.t.y) < tol) st.drag = 't';
      else if (Math.hypot(p.x - st.A.x, p.y - st.A.y) < tol) st.drag = 'A';
      else if (st.n === 2 && Math.hypot(p.x - st.B.x, p.y - st.B.y) < tol) st.drag = 'B';
      else { st.drag = 't'; st.t = clampP(p); draw(); }
      try { c.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
    });
    c.addEventListener('pointermove', function (e) { if (!st.drag) return; st[st.drag] = clampP(pt(e)); draw(); });
    ['pointerup', 'pointercancel'].forEach(function (ev) { c.addEventListener(ev, function () { st.drag = null; }); });

    api.onResize(draw);
    sync();
  },
});
