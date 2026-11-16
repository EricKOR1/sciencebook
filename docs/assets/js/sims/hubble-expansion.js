/* 행성우주과학 3: 허블 법칙 — 어느 은하에서 보아도 거리에 비례하는 속도로 멀어진다 */
Sims.register('hubble-expansion', {
  title: '팽창하는 우주 — 중심이 없는 허블 법칙',
  caption: '왼쪽 장면에서 은하를 누르거나 버튼을 눌러 기준 은하를 바꿔 보자. 어느 은하에 서도 다른 은하들은 멀수록 빠르게 멀어지고, 오른쪽 그래프의 점들은 늘 같은 기울기 H₀의 직선 위에 놓인다. 우주에는 팽창의 중심이 없다. 허블 상수를 바꾸면 기울기와 우주 나이의 어림값 1/H₀이 달라진다(팽창 속도가 늘 일정했다고 가정한 어림). 은하 배치는 설명을 위해 만든 가상의 2차원 분포이고, 은하마다 수백 km/s 이하의 작은 고유 운동을 더했다.',
  init: function (api) {
    var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var gal = [];
    for (var i = 0; i < 230; i++) gal.push({ x: (rnd() - 0.5) * 520, y: (rnd() - 0.5) * 520, pv: (rnd() - 0.5) * 300, s: 0.6 + rnd() * 0.8, rot: rnd() * Math.PI });
    gal[0] = { x: 0, y: 0, pv: 0, s: 1.2, rot: 0.6, name: '우리은하' };
    var named = [0];
    ['A', 'B', 'C'].forEach(function (nm, j) {
      var best = -1, bd = 1e9, tx = [55, -40, 20][j], ty = [30, -50, -70][j];
      gal.forEach(function (g, k) { var d = Math.hypot(g.x - tx, g.y - ty); if (k && d < bd && named.indexOf(k) < 0) { bd = d; best = k; } });
      gal[best].name = '은하 ' + nm; gal[best].pv = 0; named.push(best);
    });
    var st = { ref: 0, H: 70, tau: 0, playing: !api.reduced };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.55 : 0.56; }, label: '팽창하는 우주의 은하들과 거리-후퇴 속도 그래프' });
    var ctx = cv.ctx;
    var rRef = api.readout('기준 은하');
    var rH = api.readout('허블 상수 H₀');
    var rAge = api.readout('우주 나이 어림 1/H₀');
    var rEx = api.readout('100 Mpc 떨어진 은하');

    var g1 = api.group();
    api.button('다른 은하를 기준으로', function () { st.ref = named[(named.indexOf(st.ref) + 1) % named.length]; upd(); }, { parent: g1, primary: true });
    api.button('우리은하로 돌아오기', function () { st.ref = 0; upd(); }, { parent: g1 });
    api.slider({ id: 'hubble-expansion-h0', label: '허블 상수 H₀', min: 50, max: 100, step: 1, value: 70,
      format: function (v) { return v + ' km/s/Mpc'; }, onInput: function (v) { st.H = v; upd(); } });
    var playBtn = api.button(st.playing ? '멈춤' : '팽창 보기', function () { st.playing = !st.playing; playBtn.textContent = st.playing ? '멈춤' : '팽창 보기'; if (st.playing) loop.play(); else loop.pause(); });

    function upd() {
      var R = gal[st.ref];
      rRef.set(R.name || '이름 없는 은하');
      rH.set(st.H + ' km/s/Mpc');
      rAge.set('약 ' + Math.round(9778 / st.H) + '억 년');
      rEx.set('후퇴 속도 약 ' + (st.H * 100).toLocaleString('ko-KR') + ' km/s');
      draw();
    }
    var loop = api.loop(function (dt) {
      if (!st.playing || !(dt > 0)) return;
      st.tau += dt / 4; if (st.tau > 1) st.tau = 0; draw();
    });
    if (!st.playing) { st.tau = 1; loop.pause(); }

    function lay() {
      var w = cv.w, h = cv.h;
      return w < 560 ? { sc: { x: 0, y: 0, w: w, h: h * 0.55 }, gr: { x: 0, y: h * 0.56, w: w, h: h * 0.44 } }
        : { sc: { x: 0, y: 0, w: w * 0.48, h: h }, gr: { x: w * 0.5, y: 0, w: w * 0.5, h: h } };
    }
    var VIEW = 110;   // 장면 반폭(Mpc)
    function scenePt(g, r, a) { var R = gal[st.ref], k = Math.min(r.w, r.h - 30) / 2 / VIEW; return [r.x + r.w / 2 + (g.x - R.x) * a * k, r.y + 24 + (r.h - 30) / 2 - (g.y - R.y) * a * k]; }
    function txt(T, s, x, y, o) { o = o || {}; ctx.fillStyle = o.color || T.figInk; ctx.textAlign = o.align || 'left'; ctx.font = (o.bold ? '600 ' : '') + (o.size || 12) + 'px ' + T.fontBody; ctx.fillText(s, x, y); }
    function draw() {
      var T = api.tokens(), L = lay(), r = L.sc;
      ctx.clearRect(0, 0, cv.w, cv.h);
      txt(T, '기준 은하에서 본 우주 (모식도)', r.x + 6, r.y + 16, { bold: true });
      var amp = 0.18 * st.H / 70, a = 1 + amp * st.tau;
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y + 24, r.w, r.h - 30); ctx.clip();
      gal.forEach(function (g, i) {
        var p0 = scenePt(g, r, 1), p = scenePt(g, r, a), isRef = i === st.ref;
        if (!isRef && st.tau > 0.02) {
          ctx.strokeStyle = T.figRed; ctx.globalAlpha = 0.75; ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
          var ang = Math.atan2(p[1] - p0[1], p[0] - p0[0]), len = Math.hypot(p[0] - p0[0], p[1] - p0[1]);
          if (len > 5) { ctx.fillStyle = T.figRed; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] - 6 * Math.cos(ang - 0.45), p[1] - 6 * Math.sin(ang - 0.45)); ctx.lineTo(p[0] - 6 * Math.cos(ang + 0.45), p[1] - 6 * Math.sin(ang + 0.45)); ctx.fill(); }
          ctx.globalAlpha = 1;
        }
        ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(g.rot);
        ctx.fillStyle = isRef ? T.figAccent : g.name ? T.figViolet : T.figBlue;
        ctx.globalAlpha = isRef || g.name ? 1 : 0.75;
        ctx.beginPath(); ctx.ellipse(0, 0, (isRef ? 7 : 4.5) * g.s, (isRef ? 3.5 : 2.2) * g.s, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore(); ctx.globalAlpha = 1;
        if (g.name) txt(T, g.name, p[0] + 8, p[1] - 6, { size: 11, bold: isRef, color: isRef ? T.figAccent : T.figViolet });
      });
      ctx.restore();
      txt(T, '빨간 화살표: 같은 시간 동안 멀어진 거리', r.x + 6, r.y + r.h - 2, { size: 11, color: T.figMuted });
      graph(T, L.gr);
    }
    function graph(T, r) {
      var L = r.x + 62, R = r.x + r.w - 14, Tp = r.y + 28, B = r.y + r.h - 38, DM = 120, VM = 12000;
      var sx = function (d) { return L + d / DM * (R - L); }, sy = function (v) { return B - v / VM * (B - Tp); };
      txt(T, '거리–후퇴 속도 (기준 은하에서 잼)', r.x + 6, r.y + 16, { bold: true });
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      [0, 3000, 6000, 9000, 12000].forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(v.toLocaleString('ko-KR'), L - 5, sy(v) + 4); });
      [0, 30, 60, 90, 120].forEach(function (d) { ctx.textAlign = 'center'; ctx.fillText(d, sx(d), B + 14); });
      txt(T, '거리 (Mpc)', (L + R) / 2, B + 30, { size: 11, align: 'center' });
      ctx.save(); ctx.translate(r.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); txt(T, '후퇴 속도 (km/s)', 0, 0, { size: 11, align: 'center' }); ctx.restore();
      var Rf = gal[st.ref];
      gal.forEach(function (g, i) {
        if (i === st.ref) return;
        var d = Math.hypot(g.x - Rf.x, g.y - Rf.y); if (d > DM) return;
        var v = st.H * d + g.pv;   // 고유 운동은 작은 흩어짐
        if (v < 0 || v > VM) return;
        ctx.fillStyle = g.name ? T.figViolet : T.figBlue; ctx.beginPath(); ctx.arc(sx(d), sy(v), g.name ? 4 : 2.6, 0, Math.PI * 2); ctx.fill();
      });
      var dEnd = Math.min(DM, VM / st.H);
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(dEnd), sy(st.H * dEnd)); ctx.stroke();
      txt(T, 'v = H₀ d (기울기 ' + st.H + ')', sx(dEnd * 0.42) - 6, sy(st.H * dEnd * 0.42) - 10, { size: 12, color: T.figAccent, bold: true, align: 'right' });
    }
    cv.canvas.addEventListener('click', function (e) {
      var L = lay(), rect = cv.canvas.getBoundingClientRect(), mx = e.clientX - rect.left, my = e.clientY - rect.top;
      if (mx > L.sc.x + L.sc.w || my > L.sc.y + L.sc.h) return;
      var a = 1 + 0.18 * st.H / 70 * st.tau, best = -1, bd = 14;
      gal.forEach(function (g, i) { var p = scenePt(g, L.sc, a), d = Math.hypot(p[0] - mx, p[1] - my); if (d < bd) { bd = d; best = i; } });
      if (best >= 0) { st.ref = best; upd(); }
    });
    api.onResize(draw);
    upd();
  },
});
