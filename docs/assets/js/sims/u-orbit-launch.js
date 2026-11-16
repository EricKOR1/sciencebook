/* 일반물리학 5 궤도: 같은 높이에서 수평(또는 비스듬히)으로 쏜 물체의 궤도가 역학적 에너지에 따라 충돌·타원·원·탈출로 갈린다 */
Sims.register('u-orbit-launch', {
  title: '쏘는 속력이 궤도를 정한다 — 원·타원·탈출',
  caption: '행성 반지름의 2배 거리(r₀)에서 물체를 쏜다. 속력을 원 궤도 속력 v원 = √(GM/r₀)의 배수로 바꾸고 \'발사\'를 눌러 보자. v₀ = v원이면 원, 그보다 빠르면 쏜 점을 근점으로 하는 타원, 느리면 원점으로 하는 타원(행성에 부딪힐 수도 있다)이 되고, √2·v원에서 역학적 에너지 E = ½mv² − GMm/r가 0이 되어 탈출한다. 오른쪽 그래프는 퍼텐셜 에너지 곡선과 E이다. 발사각을 바꾸면 E는 그대로이고 각운동량만 줄어, 궤도의 크기(긴반지름)는 같고 찌그러진 정도만 달라진다. 행성은 구형이고 다른 천체와 공기 저항은 무시했다.',
  init: function (api) {
    var RP = 0.5, VIEW = 3.1, PERIOD_SCREEN = 4;   // 행성 반지름(r₀ 단위), 화면 반경, 원 궤도 한 바퀴 = 4초
    var VC_KM = 7.91 / Math.SQRT2;                   // r₀ = 2R_E일 때 원 궤도 속력(km/s)
    var st = { v: 1.2, gam: 0, path: null, t: 0, flying: false, ghosts: [] };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.62 : 0.6; }, label: '행성 둘레의 궤도와 퍼텐셜 에너지 그래프' });
    var ctx = cv.ctx;
    var rType = api.readout('궤도');
    var rE = api.readout('E (GMm/r₀ 단위)');
    var rEcc = api.readout('이심률 e');
    var rA = api.readout('긴반지름 a, 주기 T');
    var rKm = api.readout('지구였다면 v₀');

    api.slider({ id: 'u-orbit-launch-v', label: '쏘는 속력 v₀ / v원', min: 0.5, max: 1.6, step: 0.01, value: st.v,
      format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.v = v; prepare(); } });
    api.slider({ id: 'u-orbit-launch-g', label: '발사각(수평에서 바깥쪽으로)', min: 0, max: 60, step: 1, value: 0,
      format: function (v) { return v + '°'; }, onInput: function (v) { st.gam = v; prepare(); } });
    var g = api.group();
    api.button('발사', function () { launch(); }, { primary: true, parent: g });
    api.button('√2 v원 (탈출)', function () { setV(Math.SQRT2); }, { parent: g });
    api.button('v원 (원)', function () { setV(1); }, { parent: g });
    var sliders = api.controls.querySelectorAll('input[type=range]');
    function setV(v) { sliders[0].value = v; sliders[0].dispatchEvent(new Event('input')); }

    function acc(x, y) { var r2 = x * x + y * y, r = Math.sqrt(r2), k = -1 / (r2 * r); return [k * x, k * y]; }
    function integrate(v, gam) {
      var gr = gam * Math.PI / 180;
      var s = [0, 1, v * Math.cos(gr), v * Math.sin(gr)];
      var E = v * v / 2 - 1, a = E < 0 ? -1 / (2 * E) : Infinity;
      var tEnd = E < 0 ? 2 * Math.PI * Math.pow(a, 1.5) : 40;
      var pts = [[0, 1, 0]], t = 0, end = 'done', n = 0;
      function f(q) { var A = acc(q[0], q[1]); return [q[2], q[3], A[0], A[1]]; }
      while (t < tEnd && n < 40000) {
        var r = Math.hypot(s[0], s[1]);
        var dt = Math.min(0.004 * Math.pow(r, 1.5), tEnd - t);
        var k1 = f(s), k2 = f(add(s, k1, dt / 2)), k3 = f(add(s, k2, dt / 2)), k4 = f(add(s, k3, dt));
        for (var i = 0; i < 4; i++) s[i] += dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
        t += dt; n++;
        r = Math.hypot(s[0], s[1]);
        if (r <= RP) { var sc = RP / r; pts.push([s[0] * sc, s[1] * sc, t]); end = 'crash'; break; }
        if (n % 2 === 0) pts.push([s[0], s[1], t]);
        if (E >= 0 && r > VIEW * 1.6) { end = 'escape'; break; }
      }
      pts.push([s[0], s[1], t]);
      return { pts: pts, end: end, T: tEnd, E: E, a: a };
    }
    function add(s, k, h) { return [s[0] + k[0] * h, s[1] + k[1] * h, s[2] + k[2] * h, s[3] + k[3] * h]; }

    function prepare() {
      if (st.path && st.path.done) { st.ghosts.push(st.path); if (st.ghosts.length > 3) st.ghosts.shift(); }
      st.path = integrate(st.v, st.gam); st.t = 0; st.flying = false; loop.pause();
      readouts(); draw();
    }
    function launch() {
      st.t = 0; st.flying = true; st.path.done = true;
      if (api.reduced) { st.t = (st.path.end === 'done' && st.path.E < 0) ? st.path.T * 0.5 : st.path.pts[st.path.pts.length - 1][2]; draw(); return; }
      loop.play();
    }
    var loop = api.loop(function (dt) {
      if (!st.flying) return;
      st.t += dt * 2 * Math.PI / PERIOD_SCREEN;
      var P = st.path, last = P.pts[P.pts.length - 1][2];
      if (P.end === 'done' && P.E < 0) { if (st.t > P.T) st.t -= P.T; }
      else if (st.t >= last) { st.t = last; loop.pause(); }
      draw();
    });
    loop.pause();

    function readouts() {
      var v = st.v, gr = st.gam * Math.PI / 180, E = v * v / 2 - 1, L = v * Math.cos(gr);
      var e = Math.sqrt(Math.max(0, 1 + 2 * E * L * L));
      var type;
      if (st.path.end === 'crash') type = '행성에 충돌';
      else if (Math.abs(E) < 0.004) type = '포물선(탈출 경계)';
      else if (E > 0) type = '쌍곡선(탈출)';
      else if (e < 0.01) type = '원 궤도';
      else type = '타원 궤도';
      rType.set(type);
      rE.set((E >= 0 ? '+' : '−') + Math.abs(E).toFixed(3));
      rEcc.set(e.toFixed(3));
      if (E < -0.004) { var a = -1 / (2 * E); rA.set(a.toFixed(2) + ' r₀, ' + Math.pow(a, 1.5).toFixed(2) + ' T원'); }
      else rA.set('묶이지 않음');
      rKm.set((v * VC_KM).toFixed(2) + ' km/s (r₀ = 2R_E)');
    }

    function posAt(P, t) {
      var p = P.pts, lo = 0, hi = p.length - 1;
      while (hi - lo > 1) { var m = (lo + hi) >> 1; if (p[m][2] <= t) lo = m; else hi = m; }
      var a = p[lo], b = p[hi], f = b[2] > a[2] ? (t - a[2]) / (b[2] - a[2]) : 0;
      f = Math.max(0, Math.min(1, f));
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }

    function draw() {
      var T = api.tokens(), W = cv.w, H = cv.h, narrow = W < 560;
      ctx.clearRect(0, 0, W, H);
      var ob = narrow ? { x: 0, y: 0, w: W, h: W } : { x: 0, y: 0, w: W * 0.55, h: H };
      var eb = narrow ? { x: 0, y: W + 6, w: W, h: H - W - 6 } : { x: W * 0.57, y: 0, w: W * 0.43, h: H };
      // 궤도 영역
      var cx = ob.x + ob.w / 2, cy = ob.y + ob.h / 2, sc = Math.min(ob.w, ob.h) / 2 / VIEW;
      function X(x) { return cx + x * sc; } function Y(y) { return cy - y * sc; }
      ctx.save(); ctx.beginPath(); ctx.rect(ob.x, ob.y, ob.w, ob.h); ctx.clip();
      // 원 궤도 기준
      ctx.setLineDash([4, 5]); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, sc, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      // 이전 궤도
      st.ghosts.forEach(function (P) { strokePath(P.pts, T.figLine, 1.2); });
      // 현재 궤도(전체 예상 경로)
      var col = st.path.end === 'crash' ? T.figRed : (st.path.E >= -0.004 ? T.figViolet : T.figBlue);
      strokePath(st.path.pts, col, 2.4);
      // 행성
      ctx.beginPath(); ctx.arc(cx, cy, RP * sc, 0, Math.PI * 2); ctx.fillStyle = T.figSoftTeal; ctx.fill();
      ctx.strokeStyle = T.figTeal; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = T.figTeal; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('행성', cx, cy + 4);
      // 발사대와 속도
      ctx.fillStyle = T.figInk; ctx.beginPath(); ctx.arc(X(0), Y(1), 3, 0, Math.PI * 2); ctx.fill();
      var gr = st.gam * Math.PI / 180, vl = 0.55 * st.v;
      arrow(X(0), Y(1), X(vl * Math.cos(gr)), Y(1 + vl * Math.sin(gr)), T.figGreen);
      ctx.fillStyle = T.figGreen; ctx.textAlign = 'left'; ctx.fillText('v₀', X(vl * Math.cos(gr)) + 4, Y(1 + vl * Math.sin(gr)) - 4);
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'right'; ctx.fillText('r₀', X(0) - 6, Y(0.55));
      ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(X(0), Y(1)); ctx.stroke();
      // 물체
      if (st.flying || st.t > 0) {
        var p = posAt(st.path, st.t);
        ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 5.5, 0, Math.PI * 2); ctx.fillStyle = T.figAmber; ctx.fill();
        ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('점선: 원 궤도(v₀ = v원)', ob.x + 6, ob.y + ob.h - 8);
      // 에너지 그래프
      var L0 = eb.x + 46, R0 = eb.x + eb.w - 12, T0 = eb.y + 30, B0 = eb.y + eb.h - 36;
      var rmax = 6, ymin = -2.1, ymax = 0.9;
      function ex(r) { return L0 + (r / rmax) * (R0 - L0); } function ey(u) { return T0 + (ymax - u) / (ymax - ymin) * (B0 - T0); }
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(L0, T0 - 6); ctx.lineTo(L0, B0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(L0, ey(0)); ctx.lineTo(R0, ey(0)); ctx.stroke();
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      [-2, -1, 0].forEach(function (u) { ctx.fillText(String(u), L0 - 6, ey(u) + 4); });
      ctx.textAlign = 'center';
      [1, 2, 4, 6].forEach(function (r) { ctx.fillText(String(r), ex(r), ey(0) + 14); });
      ctx.font = '11px ' + T.fontBody; ctx.fillText('r / r₀', (L0 + R0) / 2, B0 + 26);
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('에너지 (GMm/r₀ 단위)', eb.x + 6, eb.y + 16);
      // 행성 내부 음영
      ctx.fillStyle = T.figSoftTeal; ctx.fillRect(L0 + 1, T0, ex(RP) - L0 - 1, B0 - T0);
      // U(r)
      ctx.beginPath();
      for (var r = RP; r <= rmax; r += 0.02) { var yy = ey(Math.max(-1 / r, ymin)); if (r === RP) ctx.moveTo(ex(r), yy); else ctx.lineTo(ex(r), yy); }
      ctx.strokeStyle = T.figTeal; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.fillStyle = T.figTeal; ctx.textAlign = 'left'; ctx.fillText('U = −GMm/r', ex(2.6), ey(-1 / 2.6) + 16);
      // E 선과 K
      var E = st.path.E;
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(L0, ey(E)); ctx.lineTo(R0, ey(E)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = col; ctx.textAlign = 'right'; ctx.font = '600 12px ' + T.fontBody;
      ctx.fillText('E = ' + E.toFixed(2), R0, ey(E) - 6);
      ctx.strokeStyle = T.figGreen; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(ex(1), ey(-1)); ctx.lineTo(ex(1), ey(E)); ctx.stroke();
      ctx.fillStyle = T.figGreen; ctx.textAlign = 'left'; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('K', ex(1) + 6, (ey(-1) + ey(E)) / 2 + 4);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(E < 0 ? 'E < 0: 묶인 궤도' : 'E ≥ 0: 무한히 멀리 갈 수 있다', L0 + 6, B0 - 6);

      function strokePath(pts, c, lw) {
        ctx.beginPath(); ctx.moveTo(X(pts[0][0]), Y(pts[0][1]));
        for (var i = 1; i < pts.length; i++) ctx.lineTo(X(pts[i][0]), Y(pts[i][1]));
        ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.stroke();
      }
    }
    function arrow(x1, y1, x2, y2, col) {
      var dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy); if (l < 2) return;
      var ux = dx / l, uy = dy / l, hd = Math.min(9, l * 0.5);
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hd, y2 - uy * hd); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - ux * hd - uy * hd * 0.5, y2 - uy * hd + ux * hd * 0.5);
      ctx.lineTo(x2 - ux * hd + uy * hd * 0.5, y2 - uy * hd - ux * hd * 0.5); ctx.closePath(); ctx.fill();
    }
    api.onResize(draw);
    prepare();
  },
});
