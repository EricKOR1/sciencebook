/* 수학 도구 3 벡터와 벡터 미적분: 2차원 벡터장 탐색기 — 고리의 선속·순환과 발산·회전 */
Sims.register('mj-vector-field', {
  title: '2차원 벡터장 탐색기 — 작은 고리의 선속과 순환',
  caption: '장을 고르고, 화면을 눌러(끌어) 빨간 고리를 옮겨 보자. 고리를 지나 바깥으로 나가는 선속 Φ와 고리를 시계 반대 방향으로 도는 순환 Γ를 수치 적분으로 계산하고, 고리를 작게 할수록 Φ/넓이는 그 점의 발산 ∇·F에, Γ/넓이는 회전 (∇×F)_z에 가까워진다. 고리 중심의 바람개비는 회전이 양이면 시계 반대 방향, 음이면 시계 방향으로 돈다(각속도 = 회전/2). 자유 와류에서 원점을 감싼 고리의 순환은 2π, 감싸지 않은 고리는 0이다. 화살표 길이는 크기에 비례하되 칸보다 긴 것은 칸 길이로 줄였고, 쌍극자는 (0, ±0.6)에 놓인 크기가 같고 부호가 반대인 2차원(선)전하로 계산했다.',
  init: function (api) {
    var FIELDS = [
      { id: 'uniform', name: '균일장', tex: 'F = (1, 0.5)', f: function (x, y) { return [1, 0.5]; } },
      { id: 'source', name: '원천', tex: 'F = (x, y)', f: function (x, y) { return [x, y]; } },
      { id: 'rigid', name: '강체 회전', tex: 'F = (−y, x)', f: function (x, y) { return [-y, x]; } },
      { id: 'shear', name: '전단류', tex: 'F = (y, 0)', f: function (x, y) { return [y, 0]; } },
      { id: 'vortex', name: '자유 와류', tex: 'F = (−y, x)/(x² + y²)', f: function (x, y) { var q = x * x + y * y; return [-y / q, x / q]; } },
      { id: 'dipole', name: '쌍극자', tex: '+ 전하 (0, 0.6), − 전하 (0, −0.6)', f: function (x, y) {
        var a = x, b = y - 0.6, c = x, d = y + 0.6, q1 = a * a + b * b, q2 = c * c + d * d;
        return [a / q1 - c / q2, b / q1 - d / q2]; } },
      { id: 'custom', name: '직접 입력', tex: '', f: null },
    ];
    var st = { field: FIELDS[2], shape: 'circle', size: 0.6, cx: 1.2, cy: 0.6, lines: true, angle: 0, custom: null, err: '' };

    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.0 : 0.62; }, label: '벡터장 화살표와 유선, 옮길 수 있는 고리' });
    var ctx = cv.ctx, c = cv.canvas;
    c.style.cursor = 'crosshair';

    var rPhi = api.readout('선속 Φ ');
    var rGam = api.readout('순환 Γ ');
    var rPA = api.readout('Φ/넓이 ');
    var rGA = api.readout('Γ/넓이 ');
    var rDiv = api.readout('중심의 ∇·F ');
    var rCurl = api.readout('중심의 (∇×F)z ');

    var g1 = api.group();
    var fbtn = FIELDS.map(function (F, i) {
      return api.button(F.name, function () { choose(F); }, { toggle: true, pressed: F === st.field, parent: g1 });
    });
    // 직접 입력 줄
    var crow = api.group();
    crow.style.display = 'none';
    function mkInput(lab, val, id) {
      var l = api.el('label'); l.setAttribute('for', id); l.textContent = lab + ' ';
      var inp = api.el('input'); inp.type = 'text'; inp.id = id; inp.value = val; inp.size = 12;
      inp.setAttribute('autocomplete', 'off'); inp.setAttribute('spellcheck', 'false');
      inp.style.font = 'inherit'; inp.style.padding = '0.2rem 0.4rem'; inp.style.maxWidth = '9rem';
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') applyCustom(); });
      l.appendChild(inp); crow.appendChild(l); return inp;
    }
    var inFx = mkInput('Fx =', 'x - y', 'mj-vector-field-fx');
    var inFy = mkInput('Fy =', 'x + y', 'mj-vector-field-fy');
    api.button('적용', function () { applyCustom(); }, { parent: crow, primary: true });

    var g2 = api.group();
    var bCirc = api.button('원 고리', function () { st.shape = 'circle'; sync(); draw(); }, { toggle: true, pressed: true, parent: g2 });
    var bSq = api.button('정사각형 고리', function () { st.shape = 'square'; sync(); draw(); }, { toggle: true, pressed: false, parent: g2 });
    var bLines = api.button('유선 보이기', function () { st.lines = !st.lines; sync(); draw(); }, { toggle: true, pressed: true, parent: g2 });
    api.button('고리를 원점으로', function () { st.cx = 0; st.cy = 0; draw(); }, { parent: g2 });
    api.slider({ id: 'mj-vector-field-size', label: '고리 크기(반지름·반변)', min: 0.05, max: 1.5, step: 0.01, value: st.size,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.size = v; draw(); } });

    function sync() {
      fbtn.forEach(function (b, i) { b.setAttribute('aria-pressed', FIELDS[i] === st.field ? 'true' : 'false'); });
      bCirc.setAttribute('aria-pressed', st.shape === 'circle' ? 'true' : 'false');
      bSq.setAttribute('aria-pressed', st.shape === 'square' ? 'true' : 'false');
      bLines.setAttribute('aria-pressed', st.lines ? 'true' : 'false');
      crow.style.display = st.field.id === 'custom' ? '' : 'none';
    }
    function choose(F) {
      st.field = F;
      if (F.id === 'custom' && !F.f) applyCustom();
      sync(); draw();
    }

    /* ── 식 해석기 (eval 없이) ── */
    function compile(src) {
      var s = src.replace(/−/g, '-').replace(/×/g, '*').replace(/·/g, '*').replace(/\s+/g, '');
      var i = 0;
      function peek() { return s[i]; }
      function err(m) { throw new Error(m); }
      function expr() { var a = term(); while (peek() === '+' || peek() === '-') { var op = s[i++]; var b = term(); a = (function (a, b, op) { return op === '+' ? function (x, y) { return a(x, y) + b(x, y); } : function (x, y) { return a(x, y) - b(x, y); }; })(a, b, op); } return a; }
      function term() { var a = unary(); while (peek() === '*' || peek() === '/') { var op = s[i++]; var b = unary(); a = (function (a, b, op) { return op === '*' ? function (x, y) { return a(x, y) * b(x, y); } : function (x, y) { return a(x, y) / b(x, y); }; })(a, b, op); } return a; }
      function unary() { if (peek() === '-') { i++; var a = unary(); return function (x, y) { return -a(x, y); }; } if (peek() === '+') { i++; return unary(); } return power(); }
      function power() { var a = primary(); if (peek() === '^') { i++; var b = unary(); return function (x, y) { return Math.pow(a(x, y), b(x, y)); }; } return a; }
      var FN = { sin: Math.sin, cos: Math.cos, tan: Math.tan, exp: Math.exp, sqrt: Math.sqrt, ln: Math.log, log: Math.log, abs: Math.abs, atan: Math.atan };
      function primary() {
        var ch = peek();
        if (ch === undefined) err('식이 끝났습니다');
        if (ch === '(') { i++; var a = expr(); if (s[i] !== ')') err('괄호가 닫히지 않았습니다'); i++; return a; }
        var m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i));
        if (m) { i += m[0].length; var v = parseFloat(m[0]); return function () { return v; }; }
        m = /^[a-z]+/i.exec(s.slice(i));
        if (m) {
          var id = m[0].toLowerCase(); i += m[0].length;
          if (id === 'x') return function (x) { return x; };
          if (id === 'y') return function (x, y) { return y; };
          if (id === 'pi') return function () { return Math.PI; };
          if (id === 'e') return function () { return Math.E; };
          if (FN[id]) { if (s[i] !== '(') err(id + ' 뒤에 ( 가 필요합니다'); i++; var a2 = expr(); if (s[i] !== ')') err('괄호가 닫히지 않았습니다'); i++; var fn = FN[id]; return function (x, y) { return fn(a2(x, y)); }; }
          err('모르는 이름: ' + id);
        }
        err('읽을 수 없는 글자: ' + ch);
      }
      var out = expr();
      if (i < s.length) err('읽을 수 없는 글자: ' + s[i]);
      return out;
    }
    function applyCustom() {
      var F = FIELDS[6];
      try {
        var fx = compile(inFx.value), fy = compile(inFy.value);
        F.f = function (x, y) { return [fx(x, y), fy(x, y)]; };
        F.tex = 'F = (' + inFx.value + ', ' + inFy.value + ')';
        st.err = '';
      } catch (e) {
        st.err = '식 오류: ' + e.message;
        if (!F.f) { F.f = function () { return [0, 0]; }; F.tex = ''; }
      }
      st.field = F; sync(); draw();
    }

    /* ── 좌표 ── */
    function view() {
      var w = cv.w, h = cv.h, half = 3.0;
      var s = w / (2 * half);
      return { s: s, w: w, h: h, X: function (x) { return w / 2 + x * s; }, Y: function (y) { return h / 2 - y * s; },
        ix: function (px) { return (px - w / 2) / s; }, iy: function (py) { return (h / 2 - py) / s; }, xm: half, ym: h / (2 * s) };
    }
    function F(x, y) { var v = st.field.f(x, y); return v; }
    function ok(v) { return isFinite(v[0]) && isFinite(v[1]); }

    /* ── 고리 적분 ── */
    function loopIntegrals() {
      var n = 1440, phi = 0, gam = 0, s = st.size, cx = st.cx, cy = st.cy, i, v, area;
      if (st.shape === 'circle') {
        var dth = 2 * Math.PI / n;
        for (i = 0; i < n; i++) {
          var t = (i + 0.5) * dth, ct = Math.cos(t), sn = Math.sin(t);
          v = F(cx + s * ct, cy + s * sn);
          phi += (v[0] * ct + v[1] * sn) * s * dth;
          gam += (-v[0] * sn + v[1] * ct) * s * dth;
        }
        area = Math.PI * s * s;
      } else {
        var m = n / 4, L = 2 * s, ds = L / m;
        var sides = [ // 시작점, 진행 방향(시계 반대), 바깥 법선
          [cx - s, cy - s, 1, 0, 0, -1], [cx + s, cy - s, 0, 1, 1, 0], [cx + s, cy + s, -1, 0, 0, 1], [cx - s, cy + s, 0, -1, -1, 0]];
        sides.forEach(function (sd) {
          for (var k = 0; k < m; k++) {
            var u = (k + 0.5) * ds, px = sd[0] + sd[2] * u, py = sd[1] + sd[3] * u;
            var w = F(px, py);
            phi += (w[0] * sd[4] + w[1] * sd[5]) * ds;
            gam += (w[0] * sd[2] + w[1] * sd[3]) * ds;
          }
        });
        area = L * L;
      }
      return { phi: phi, gam: gam, area: area };
    }
    function localDerivs(x, y) {
      var h = 1e-4;
      var a = F(x + h, y), b = F(x - h, y), c2 = F(x, y + h), d = F(x, y - h);
      return { div: (a[0] - b[0]) / (2 * h) + (c2[1] - d[1]) / (2 * h), curl: (a[1] - b[1]) / (2 * h) - (c2[0] - d[0]) / (2 * h) };
    }
    function fmt(v) {
      if (!isFinite(v)) return '정의 안 됨';
      if (Math.abs(v) < 5e-4) return '0.000';
      var a = Math.abs(v);
      return (a >= 1000 || a < 0.01) ? v.toExponential(2).replace('-', '−') : v.toFixed(3).replace('-', '−');
    }

    /* ── 그리기 ── */
    function draw() {
      var T = api.tokens(), V = view(), w = V.w, h = V.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = T.figPanel; ctx.fillRect(0, 0, w, h);
      // 축과 눈금
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.moveTo(0, V.Y(0)); ctx.lineTo(w, V.Y(0)); ctx.moveTo(V.X(0), 0); ctx.lineTo(V.X(0), h); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      for (var k = -3; k <= 3; k++) { if (k) { ctx.fillText(String(k).replace('-', '−'), V.X(k), V.Y(0) + 14); } }
      for (k = -Math.floor(V.ym); k <= Math.floor(V.ym); k++) { if (k) { ctx.textAlign = 'right'; ctx.fillText(String(k).replace('-', '−'), V.X(0) - 4, V.Y(k) + 4); } }
      // 유선
      if (st.lines) drawStreamlines(T, V);
      // 화살표
      var sp = 0.5, pts = [], mags = [];
      for (var x = -V.xm + sp / 2; x < V.xm; x += sp) {
        for (var y = -Math.floor(V.ym / sp) * sp; y <= V.ym; y += sp) {
          var v = F(x, y), m = Math.hypot(v[0], v[1]);
          if (!ok(v)) continue;
          pts.push([x, y, v, m]); if (m > 0) mags.push(m);
        }
      }
      mags.sort(function (a, b) { return a - b; });
      var ref = mags.length ? mags[Math.floor(mags.length * 0.85)] : 1;
      var kk = ref > 0 ? 0.4 / ref : 1;
      pts.forEach(function (p) {
        var m = p[3];
        if (m < 1e-9) { ctx.fillStyle = T.figBlue; ctx.beginPath(); ctx.arc(V.X(p[0]), V.Y(p[1]), 1.6, 0, 7); ctx.fill(); return; }
        var L = Math.min(0.46, kk * m) * V.s;
        var ux = p[2][0] / m, uy = p[2][1] / m;
        arrow(V.X(p[0]) - ux * L / 2, V.Y(p[1]) + uy * L / 2, V.X(p[0]) + ux * L / 2, V.Y(p[1]) - uy * L / 2, T.figBlue, 1.6);
      });
      // 쌍극자 전하 표시
      if (st.field.id === 'dipole') {
        [[0, 0.6, '+', T.figRed], [0, -0.6, '−', T.figBlue]].forEach(function (q) {
          ctx.beginPath(); ctx.arc(V.X(q[0]), V.Y(q[1]), 9, 0, 7); ctx.fillStyle = T.figPanel; ctx.fill(); ctx.strokeStyle = q[3]; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = q[3]; ctx.font = '600 14px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText(q[2], V.X(q[0]), V.Y(q[1]) + 5);
        });
      }
      if (st.field.id === 'vortex') { ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(V.X(0), V.Y(0), 3, 0, 7); ctx.fill(); }
      // 고리
      var res = loopIntegrals();
      ctx.beginPath();
      if (st.shape === 'circle') ctx.arc(V.X(st.cx), V.Y(st.cy), st.size * V.s, 0, 2 * Math.PI);
      else ctx.rect(V.X(st.cx - st.size), V.Y(st.cy + st.size), 2 * st.size * V.s, 2 * st.size * V.s);
      ctx.fillStyle = T.figSoftRed; ctx.globalAlpha = 0.45; ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = T.figRed; ctx.lineWidth = 2.5; ctx.stroke();
      // 고리 방향(시계 반대) 화살촉
      var hx, hy, ha;
      if (st.shape === 'circle') { hx = V.X(st.cx); hy = V.Y(st.cy + st.size); ha = Math.PI; }
      else { hx = V.X(st.cx); hy = V.Y(st.cy + st.size); ha = Math.PI; }
      head(hx - 5, hy, ha, T.figRed, 10);
      // 바람개비
      var d = localDerivs(st.cx, st.cy);
      pinwheel(T, V.X(st.cx), V.Y(st.cy), Math.max(9, Math.min(16, st.size * V.s * 0.6)), d.curl);
      // 식
      ctx.font = '600 13px ' + T.fontBody; ctx.textAlign = 'left';
      var label = st.field.name + (st.field.tex ? '  ' + st.field.tex : '');
      var tw = ctx.measureText(label).width;
      ctx.fillStyle = T.figPanel; ctx.globalAlpha = 0.88; ctx.fillRect(6, 6, tw + 14, st.err ? 42 : 24); ctx.globalAlpha = 1;
      ctx.fillStyle = T.figInk; ctx.fillText(label, 13, 23);
      if (st.err) { ctx.fillStyle = T.figRed; ctx.font = '12px ' + T.fontBody; ctx.fillText(st.err, 13, 41); }
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('화면을 눌러 고리를 옮긴다', w - 8, h - 8);
      // 값
      rPhi.set(fmt(res.phi)); rGam.set(fmt(res.gam));
      rPA.set(fmt(res.phi / res.area)); rGA.set(fmt(res.gam / res.area));
      rDiv.set(fmt(d.div)); rCurl.set(fmt(d.curl));
      st.omega = isFinite(d.curl) ? Math.max(-6, Math.min(6, d.curl / 2)) : 0;
      if (!api.reduced) { if (Math.abs(st.omega) > 1e-4) loop.play(); else loop.pause(); }
    }
    function arrow(x1, y1, x2, y2, col, lw) {
      var L = Math.hypot(x2 - x1, y2 - y1); if (L < 1) return;
      var a = Math.atan2(y2 - y1, x2 - x1), hs = Math.min(7, 2.5 + L * 0.3);
      ctx.strokeStyle = col; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * hs * 0.7, y2 - Math.sin(a) * hs * 0.7); ctx.stroke();
      head(x2, y2, a, col, hs);
    }
    function head(x, y, a, col, hs) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x - hs * Math.cos(a) + hs * 0.5 * Math.sin(a), y - hs * Math.sin(a) - hs * 0.5 * Math.cos(a));
      ctx.lineTo(x - hs * Math.cos(a) - hs * 0.5 * Math.sin(a), y - hs * Math.sin(a) + hs * 0.5 * Math.cos(a));
      ctx.closePath(); ctx.fill();
    }
    function pinwheel(T, x, y, r, curl) {
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r + 3, 0, 7); ctx.fillStyle = T.figPanel; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
      for (var k = 0; k < 4; k++) {
        var a = st.angle + k * Math.PI / 2;   // 수학 방향 각(시계 반대가 +)
        var ex = x + r * Math.cos(a), ey = y - r * Math.sin(a);
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
        var b = a + 0.5;
        ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.moveTo(ex, ey);
        ctx.lineTo(x + 0.7 * r * Math.cos(b), y - 0.7 * r * Math.sin(b)); ctx.lineTo(x + 0.45 * r * Math.cos(a), y - 0.45 * r * Math.sin(a)); ctx.closePath(); ctx.fill();
      }
      if (isFinite(curl) && Math.abs(curl) > 1e-3) {
        var R = r + 7, t0 = 0.5, t1 = 0.5 + 4.2, n = 30, sgn = curl > 0 ? 1 : -1;
        ctx.strokeStyle = T.figViolet; ctx.lineWidth = 2; ctx.beginPath();
        var px, py, qx, qy;
        for (var i = 0; i <= n; i++) {
          var t = sgn > 0 ? t0 + (t1 - t0) * i / n : t1 - (t1 - t0) * i / n;
          px = x + R * Math.cos(t); py = y - R * Math.sin(t);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          if (i === n - 1) { qx = px; qy = py; }
        }
        ctx.stroke();
        head(px, py, Math.atan2(py - qy, px - qx), T.figViolet, 8);
      }
      ctx.restore();
    }
    function drawStreamlines(T, V) {
      ctx.strokeStyle = T.figTeal; ctx.lineWidth = 1.1; ctx.globalAlpha = 0.55;
      var step = 0.03;
      for (var sx = -V.xm + 0.5; sx < V.xm; sx += 1.0) {
        for (var sy = -Math.floor(V.ym) + 0.5; sy < V.ym; sy += 1.0) {
          [1, -1].forEach(function (dir) {
            var x = sx, y = sy;
            ctx.beginPath(); ctx.moveTo(V.X(x), V.Y(y));
            for (var i = 0; i < 160; i++) {
              var v = F(x, y), m = Math.hypot(v[0], v[1]);
              if (!ok(v) || m < 1e-6 || m > 1e4) break;
              var mx = x + dir * step * 0.5 * v[0] / m, my = y + dir * step * 0.5 * v[1] / m;
              var v2 = F(mx, my), m2 = Math.hypot(v2[0], v2[1]);
              if (!ok(v2) || m2 < 1e-6 || m2 > 1e4) break;
              x += dir * step * v2[0] / m2; y += dir * step * v2[1] / m2;
              if (Math.abs(x) > V.xm + 0.2 || Math.abs(y) > V.ym + 0.2) break;
              ctx.lineTo(V.X(x), V.Y(y));
            }
            ctx.stroke();
          });
        }
      }
      ctx.globalAlpha = 1;
    }

    var loop = api.loop(function (dt) {
      if (dt <= 0) return;
      st.angle += st.omega * dt;
      drawWheelOnly();
    });
    loop.pause();
    function drawWheelOnly() { draw(); }

    /* ── 끌기 ── */
    var dragging = false;
    function toLocal(e) { var r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    function moveTo(e) {
      var V = view(), p = toLocal(e);
      st.cx = Math.max(-V.xm, Math.min(V.xm, V.ix(p[0])));
      st.cy = Math.max(-V.ym, Math.min(V.ym, V.iy(p[1])));
      st.cx = Math.round(st.cx * 100) / 100; st.cy = Math.round(st.cy * 100) / 100;
      draw();
    }
    function insideLoop(clientX, clientY) {
      var V = view(), r = c.getBoundingClientRect(), x = V.ix(clientX - r.left), y = V.iy(clientY - r.top);
      return Math.hypot(x - st.cx, y - st.cy) < st.size * 1.5 + 0.2;
    }
    // 터치는 고리 위에서 시작할 때만 화면 스크롤을 막는다
    c.addEventListener('touchstart', function (e) { if (e.touches.length === 1 && insideLoop(e.touches[0].clientX, e.touches[0].clientY)) e.preventDefault(); }, { passive: false });
    c.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch' && !insideLoop(e.clientX, e.clientY)) { moveTo(e); return; }
      dragging = true; try { c.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ } moveTo(e);
    });
    c.addEventListener('pointermove', function (e) { if (dragging) moveTo(e); });
    ['pointerup', 'pointercancel'].forEach(function (ev) { c.addEventListener(ev, function () { dragging = false; }); });

    api.onResize(draw);
    sync(); draw();
  },
});
