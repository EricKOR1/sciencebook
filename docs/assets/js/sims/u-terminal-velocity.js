/* 일반물리학 2 뉴턴 법칙과 그 응용: 끌림힘과 종단 속도 — v(t) 그래프와 힘의 균형 */
Sims.register('u-terminal-velocity', {
  title: '끌림힘과 종단 속도 — v(t)는 어떻게 한계에 다가갈까?',
  caption: '끌림힘 모형을 고르고 질량과 끌림 상수를 바꾼 뒤 「떨어뜨리기」를 눌러 보자. 처음에는 자유 낙하(점선 v = gt)처럼 빨라지다가, 끌림힘 D가 무게 mg에 가까워질수록 가속도가 줄어 종단 속도 v_t에 다가간다. D = bv이면 v = v_t(1 − e^(−t/τ)), τ = m/b이고, D = ½CρAv²이면 v = v_t tanh(gt/v_t)이다. 질량을 2배로 하면 v_t는 bv 모형에서 2배, v² 모형에서 √2배가 된다. 정지 상태에서 떨어뜨리며 부력은 무시했고, 공기 밀도는 1.20 kg/m³로 일정하다고 보았다(g = 9.80 m/s²).',
  init: function (api) {
    var G = 9.80, RHO = 1.20;
    var st = { model: 'quad', m1: 5, b: 0.25, m2: 80, ca: 0.56, t: 1, playing: false, ghosts: [] };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.15 : 0.5; }, label: '떨어지는 물체의 힘과 속도-시간 그래프' });
    var ctx = cv.ctx;
    var rVt = api.readout('종단 속도 v_t');
    var rTau = api.readout('시간 척도');
    var r95 = api.readout('v_t의 95 %까지');
    var rNow = api.readout('지금 v / D÷mg');

    var g = api.group();
    var bLin = api.button('D = bv (기름 속 구슬)', function () { setModel('lin'); }, { toggle: true, pressed: false, parent: g });
    var bQuad = api.button('D = ½CρAv² (스카이다이버)', function () { setModel('quad'); }, { toggle: true, pressed: true, parent: g });
    var s1 = api.slider({ id: 'u-terminal-velocity-m1', label: '질량 m', min: 1, max: 20, step: 0.5, value: st.m1,
      format: function (v) { return v.toFixed(1) + ' g'; }, onInput: function (v) { st.m1 = v; changed(); } });
    var s2 = api.slider({ id: 'u-terminal-velocity-b', label: '끌림 상수 b', min: 0.05, max: 1, step: 0.01, value: st.b,
      format: function (v) { return v.toFixed(2) + ' kg/s'; }, onInput: function (v) { st.b = v; changed(); } });
    var s3 = api.slider({ id: 'u-terminal-velocity-m2', label: '질량 m', min: 40, max: 160, step: 1, value: st.m2,
      format: function (v) { return v + ' kg'; }, onInput: function (v) { st.m2 = v; changed(); } });
    var s4 = api.slider({ id: 'u-terminal-velocity-ca', label: 'C × A (끌림 계수 × 단면적)', min: Math.log10(0.2), max: Math.log10(50), step: 0.01, value: Math.log10(st.ca),
      format: function (v) { var x = Math.pow(10, v); return (x < 10 ? x.toFixed(2) : x.toFixed(0)) + ' m²' + (Math.abs(x - 0.56) < 0.03 ? ' (엎드린 자세)' : x > 40 ? ' (낙하산)' : ''); },
      onInput: function (v) { st.ca = Math.pow(10, v); changed(); } });
    api.button('떨어뜨리기', function () { drop(); }, { primary: true });

    function show(sl, on) { sl.input.parentNode.style.display = on ? '' : 'none'; }
    function setModel(m) {
      st.model = m; st.ghosts = [];
      bLin.setAttribute('aria-pressed', m === 'lin' ? 'true' : 'false'); bQuad.setAttribute('aria-pressed', m === 'quad' ? 'true' : 'false');
      show(s1, m === 'lin'); show(s2, m === 'lin'); show(s3, m === 'quad'); show(s4, m === 'quad');
      changed();
    }
    function params() {
      if (st.model === 'lin') {
        var m = st.m1 / 1000, vt = m * G / st.b, tau = m / st.b;
        return { vt: vt, sc: tau, t95: tau * Math.log(20), tmax: 5 * tau, v: function (t) { return vt * (1 - Math.exp(-t / tau)); }, unitT: 's' };
      }
      var vt2 = Math.sqrt(2 * st.m2 * G / (st.ca * RHO)), s = vt2 / G;
      return { vt: vt2, sc: s, t95: s * 1.8318, tmax: 3 * s, v: function (t) { return vt2 * Math.tanh(t / s); }, unitT: 's' };
    }
    function fmtT(t) { return t < 0.1 ? (t * 1000).toFixed(0) + ' ms' : t < 10 ? t.toFixed(2) + ' s' : t.toFixed(1) + ' s'; }
    function fmtV(v) { return v < 1 ? v.toFixed(3) : v < 10 ? v.toFixed(2) : v.toFixed(1); }
    function changed() {
      var P = params();
      rVt.set(fmtV(P.vt) + ' m/s' + (P.vt > 5 ? ' (' + Math.round(P.vt * 3.6) + ' km/h)' : ''));
      rTau.set((st.model === 'lin' ? 'τ = m/b = ' : 'v_t/g = ') + fmtT(P.sc));
      r95.set(fmtT(P.t95));
      st.t = 1; st.playing = false; loop.pause();
      draw();
    }
    function drop() {
      var P = params();
      st.ghosts.push({ P: P, label: st.model === 'lin' ? st.m1.toFixed(1) + ' g' : st.m2 + ' kg' });
      if (st.ghosts.length > 4) st.ghosts.shift();
      if (api.reduced) { st.t = 1; draw(); return; }
      st.t = 0; st.playing = true; loop.play();
    }
    var scroll = 0;
    var loop = api.loop(function (dt) {
      if (!st.playing) return;
      st.t += dt / 4;                 // 그래프 전체 시간을 화면에서 4초 동안 보여 준다
      var P = params(); scroll += dt * 40 * P.v(st.t * axes().tmax) / P.vt;
      if (st.t >= 1) { st.t = 1; st.playing = false; loop.pause(); }
      draw();
    });
    loop.pause();

    function axes() {
      var P = params(), tmax = P.tmax, vmax = P.vt;
      st.ghosts.forEach(function (gh) { tmax = Math.max(tmax, gh.P.tmax); vmax = Math.max(vmax, gh.P.vt); });
      return { tmax: tmax, vmax: vmax * 1.15 };
    }
    function arrow(x1, y1, x2, y2, col, lw) {
      var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy); if (L < 2) return;
      var ux = dx / L, uy = dy / L, hl = Math.min(10, L * 0.45);
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hl, y2 - uy * hl); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - ux * hl - uy * hl * 0.5, y2 - uy * hl + ux * hl * 0.5); ctx.lineTo(x2 - ux * hl + uy * hl * 0.5, y2 - uy * hl - ux * hl * 0.5); ctx.closePath(); ctx.fill();
    }
    function nice(v) { var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 560;
      ctx.clearRect(0, 0, w, h);
      var P = params(), X = axes(), tNow = st.t * X.tmax, vNow = P.v(Math.min(tNow, X.tmax));
      rNow.set(fmtV(vNow) + ' m/s / ' + (vNow / P.vt * (st.model === 'lin' ? 1 : vNow / P.vt)).toFixed(2));
      // 왼쪽: 낙하 물체와 힘
      var col = narrow ? { x: 0, y: 0, w: w, h: h * 0.3 } : { x: 0, y: 0, w: w * 0.24, h: h };
      var gr = narrow ? { x: 0, y: h * 0.32, w: w, h: h * 0.68 } : { x: w * 0.26, y: 0, w: w * 0.74, h: h };
      ctx.fillStyle = T.figPaper; ctx.fillRect(col.x + 6, col.y + 6, col.w - 12, col.h - 12);
      // 위로 흘러가는 공기 줄무늬(물체 기준으로 본 공기의 움직임)
      ctx.save(); ctx.beginPath(); ctx.rect(col.x + 6, col.y + 6, col.w - 12, col.h - 12); ctx.clip();
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1.5;
      var HH = col.h - 12;
      for (var i = 0; i < 10; i++) {
        var yy = col.y + 6 + (((i * HH / 10 - scroll) % HH) + HH) % HH;
        var xx = col.x + 16 + ((i * 53) % Math.max(col.w - 32, 20));
        ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + 18); ctx.stroke();
      }
      ctx.restore();
      var cx = col.x + col.w / 2, cy = col.y + col.h / 2, R = Math.min(16, col.h * 0.1);
      var fk = Math.min(col.h * 0.3, 70), ratioD = st.model === 'lin' ? vNow / P.vt : Math.pow(vNow / P.vt, 2);
      arrow(cx, cy + R, cx, cy + R + fk, T.figInk, 2.6);
      if (ratioD * fk > 3) arrow(cx, cy - R, cx, cy - R - ratioD * fk, T.figRed, 2.6);
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = T.figSoftBlue; ctx.fill(); ctx.strokeStyle = T.figBlue; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figInk; ctx.fillText('mg', cx + 8, cy + R + fk - 2);
      ctx.fillStyle = T.figRed; ctx.fillText('D', cx + 8, cy - R - Math.max(ratioD * fk, 8) + 10);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('힘(같은 축척)', cx, col.y + col.h - 14);
      // 오른쪽: v-t 그래프
      var L = gr.x + 54, Rr = gr.x + gr.w - 14, Tp = gr.y + 20, B = gr.y + gr.h - 40;
      var sx = function (t) { return L + (Rr - L) * t / X.tmax; }, sy = function (v) { return B - (B - Tp) * v / X.vmax; };
      var tstep = nice(X.tmax / 5), vstep = nice(X.vmax / 5);
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'center';
      for (var t = 0; t <= X.tmax + 1e-9; t += tstep) { ctx.beginPath(); ctx.moveTo(sx(t), Tp); ctx.lineTo(sx(t), B); ctx.stroke(); ctx.fillText(+t.toPrecision(3), sx(t), B + 14); }
      ctx.textAlign = 'right';
      for (var v = 0; v <= X.vmax + 1e-9; v += vstep) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(Rr, sy(v)); ctx.stroke(); ctx.fillText(+v.toPrecision(3), L - 5, sy(v) + 4); }
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('시간 t (s)', (L + Rr) / 2, B + 30);
      ctx.save(); ctx.translate(gr.x + 12, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('속력 v (m/s)', 0, 0); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(L, Tp, Rr - L, B - Tp); ctx.clip();
      // 자유 낙하
      ctx.setLineDash([6, 5]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(X.tmax), sy(G * X.tmax)); ctx.stroke();
      // 종단 속도
      ctx.strokeStyle = T.figRed; ctx.beginPath(); ctx.moveTo(L, sy(P.vt)); ctx.lineTo(Rr, sy(P.vt)); ctx.stroke(); ctx.setLineDash([]);
      // 이전 곡선
      st.ghosts.forEach(function (gh) { if (Math.abs(gh.P.vt - P.vt) > 1e-9 || Math.abs(gh.P.sc - P.sc) > 1e-12) curve(gh.P, 1, T.figLine, 1.6); });
      var showFrac = st.t;
      curve(P, showFrac, T.figAccent, 2.8);
      // 시간 척도 표시
      var tm = st.model === 'lin' ? P.sc : P.t95, vm = P.v(tm);
      if (st.t * X.tmax >= tm) {
        ctx.setLineDash([3, 3]); ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(sx(tm), B); ctx.lineTo(sx(tm), sy(vm)); ctx.lineTo(L, sy(vm)); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(sx(tm), sy(vm), 4.5, 0, Math.PI * 2); ctx.fillStyle = T.figViolet; ctx.fill();
        ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(st.model === 'lin' ? 't = τ 에서 63.2 %' : '95 %', sx(tm) + 6, sy(vm) + 16);
      }
      ctx.restore();
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillStyle = T.figRed; ctx.fillText('v_t = ' + fmtV(P.vt) + ' m/s', Rr - 4, sy(P.vt) - 6);
      var fx = Math.min(X.tmax, X.vmax / G) * 0.88;
      ctx.fillStyle = T.figMuted; ctx.textAlign = 'right'; ctx.fillText('v = gt (끌림힘 없음)', sx(fx) - 8, sy(G * fx) + 4);
      if (st.ghosts.some(function (gh) { return Math.abs(gh.P.vt - P.vt) > 1e-9; })) { ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right'; ctx.fillText('회색: 이전 낙하', Rr - 4, B - 8); }
      function curve(PP, frac, c, lw) {
        var tEnd = X.tmax * frac;
        ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath();
        for (var k = 0; k <= 200; k++) { var tt = tEnd * k / 200, y = sy(PP.v(tt)); if (k) ctx.lineTo(sx(tt), y); else ctx.moveTo(sx(tt), y); }
        ctx.stroke();
      }
    }
    api.onResize(draw);
    setModel('quad');
  },
});
