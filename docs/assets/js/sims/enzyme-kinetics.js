/* 세포와 물질대사 2: 기질 농도와 초기 반응 속도(포화), 경쟁적·비경쟁적 저해제 비교 */
Sims.register('enzyme-kinetics', {
  title: '기질을 늘리면 반응은 계속 빨라질까? — 포화와 저해제',
  caption: '기질 농도를 높여 보자. 처음에는 반응 속도가 빠르게 늘지만, 효소의 활성 부위가 거의 다 기질로 차면(효소–기질 복합체가 가득 참) 더 빨라지지 않는다. 경쟁적 저해제는 활성 부위를 두고 기질과 경쟁하므로 기질이 충분히 많으면 최대 속도에 가까워지고, 비경쟁적 저해제는 다른 부위에 붙어 효소 모양을 바꾸므로 기질을 늘려도 최대 속도가 낮게 머문다. 효소의 양은 일정하고, 속도는 상대값이다(그래프의 값은 예제 3의 자료와 같은 조건으로 계산했다). 왼쪽 그림의 효소 12개는 어느 순간의 모습이며 계속 바뀐다.',
  init: function (api) {
    var VMAX = 100, KM = 2, N = 12, SMAX = 50;
    var SVALS = [0, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30, 50];
    var st = { si: 6, inh: 'none', enz: [], prods: [], subs: [], inhs: [] };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.5 : 0.55; }, label: '효소와 기질 입자 모형, 기질 농도–초기 반응 속도 그래프' });
    var ctx = cv.ctx;
    var rS = api.readout('기질 농도');
    var rV = api.readout('초기 반응 속도');
    var rF = api.readout('기질이 붙은 효소(ES)');
    var rI = api.readout('저해제');

    api.slider({ id: 'enzyme-kinetics-s', label: '기질 농도', min: 0, max: SVALS.length - 1, step: 1, value: st.si,
      format: function (v) { return String(SVALS[v]); }, onInput: function (v) { st.si = v; syncParticles(); update(); } });
    var g = api.group();
    var INH = [['none', '저해제 없음'], ['comp', '경쟁적 저해제'], ['non', '비경쟁적 저해제']];
    var ib = INH.map(function (it, i) {
      return api.button(it[1], function () { st.inh = it[0]; ib.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); syncParticles(); update(); }, { toggle: true, pressed: i === 0, parent: g });
    });

    function S() { return SVALS[st.si]; }
    function params(inh) {
      if (inh === 'comp') return { v: VMAX, k: 5 };      // 겉보기 Km 2 → 5
      if (inh === 'non') return { v: 50, k: KM };        // 최대 속도 100 → 50
      return { v: VMAX, k: KM };
    }
    function rate(inh, s) { var p = params(inh); return p.v * s / (p.k + s); }
    // 상태 비율: ES, EI(경쟁), E / 비경쟁 저해제가 붙은 비율 0.5
    function fractions() {
      var s = S(), es, ei = 0;
      if (st.inh === 'comp') { var den = KM * (1 + 1.5) + s; es = s / den; ei = KM * 1.5 / den; }
      else { es = s / (KM + s); }
      return { es: es, ei: ei };
    }
    /* 효소 상태: 0 빈 효소, 1 기질 결합(ES), 2 경쟁적 저해제 결합 / nonc: 비경쟁적 저해제가 다른 자리에 붙음 */
    for (var i = 0; i < N; i++) st.enz.push({ s: 0, nonc: false, t: Math.random() });
    function assign() {
      var f = fractions();
      var nES = Math.round(f.es * N), nEI = Math.round(f.ei * N);
      var idx = []; for (var i = 0; i < N; i++) idx.push(i);
      idx.sort(function () { return Math.random() - 0.5; });
      st.enz.forEach(function (e) { e.s = 0; e.nonc = false; });
      idx.forEach(function (k, j) { st.enz[k].s = j < nES ? 1 : j < nES + nEI ? 2 : 0; });
      if (st.inh === 'non') { idx.sort(function () { return Math.random() - 0.5; }); for (var m = 0; m < N / 2; m++) st.enz[idx[m]].nonc = true; }
    }
    function syncParticles() {
      assign();
      var nS = Math.round(S() * 1.4); st.subs = [];
      for (var i = 0; i < nS; i++) st.subs.push({ x: Math.random(), y: Math.random(), vx: Math.random() - 0.5, vy: Math.random() - 0.5 });
      st.inhs = [];
      if (st.inh !== 'none') for (var j = 0; j < 8; j++) st.inhs.push({ x: Math.random(), y: Math.random(), vx: Math.random() - 0.5, vy: Math.random() - 0.5 });
    }
    var shuffleT = 0;
    var loop = api.loop(function (dt) {
      [st.subs, st.inhs].forEach(function (arr) {
        arr.forEach(function (p) {
          p.vx += (Math.random() - 0.5) * 2 * dt; p.vy += (Math.random() - 0.5) * 2 * dt;
          var sp = Math.hypot(p.vx, p.vy); if (sp > 0.12) { p.vx *= 0.12 / sp; p.vy *= 0.12 / sp; }
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.x < 0 || p.x > 1) { p.vx = -p.vx; p.x = Math.max(0, Math.min(1, p.x)); }
          if (p.y < 0 || p.y > 1) { p.vy = -p.vy; p.y = Math.max(0, Math.min(1, p.y)); }
        });
      });
      // 반응: ES 효소가 생성물을 내놓는 빈도 ∝ 반응 속도
      var v = rate(st.inh, S());
      st.enz.forEach(function (e, k) {
        if (e.s === 1 && !e.nonc) {
          e.t += dt * 0.9;
          if (e.t > 1) { e.t = 0; st.prods.push({ k: k, t: 0 }); }
        }
      });
      st.prods = st.prods.filter(function (p) { p.t += dt / 1.2; return p.t < 1; });
      shuffleT += dt; if (shuffleT > 2.2) { shuffleT = 0; assign(); }
      draw();
    });

    function layout() {
      var w = cv.w, h = cv.h;
      return w < 560 ? { box: { x: 4, y: 4, w: w - 8, h: h * 0.44 }, graph: { x: 0, y: h * 0.48, w: w, h: h * 0.52 } }
        : { box: { x: 4, y: 4, w: w * 0.46, h: h - 8 }, graph: { x: w * 0.5, y: 0, w: w * 0.5, h: h } };
    }
    function draw() {
      var T = api.tokens(), Ly = layout();
      ctx.clearRect(0, 0, cv.w, cv.h);
      drawBox(T, Ly.box); drawGraph(T, Ly.graph);
    }
    function drawBox(T, r) {
      ctx.fillStyle = T.figPaper; ctx.strokeStyle = T.figLine; ctx.lineWidth = 1;
      rr(r.x, r.y, r.w, r.h, 8); ctx.fill(); ctx.stroke();
      var inner = { x: r.x + 10, y: r.y + 24, w: r.w - 20, h: r.h - 34 };
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText('효소 12개(양 일정) · 기질 ' + S(), r.x + 10, r.y + 15);
      // 자유 입자
      st.subs.forEach(function (p) { tri(inner.x + p.x * inner.w, inner.y + p.y * inner.h, 5, T.figAmber, T.figSoftAmber); });
      st.inhs.forEach(function (p) {
        var x = inner.x + p.x * inner.w, y = inner.y + p.y * inner.h;
        if (st.inh === 'comp') tri(x, y, 5, T.figRed, T.figSoftRed);
        else { ctx.fillStyle = T.figRed; ctx.fillRect(x - 4, y - 4, 8, 8); }
      });
      // 효소 격자
      var cols = 4, rows = 3, cw = inner.w / cols, ch = inner.h / rows, sz = Math.min(cw, ch) * 0.3;
      st.enz.forEach(function (e, k) {
        var cx = inner.x + cw * (k % cols + 0.5), cy = inner.y + ch * (Math.floor(k / cols) + 0.55);
        enzyme(cx, cy, sz, e, T);
      });
      st.prods.forEach(function (p) {
        var cx = inner.x + cw * (p.k % cols + 0.5), cy = inner.y + ch * (Math.floor(p.k / cols) + 0.55);
        ctx.globalAlpha = 1 - p.t;
        ctx.fillStyle = T.figGreen;
        ctx.beginPath(); ctx.arc(cx - 6 - p.t * 14, cy - sz - 6 - p.t * 16, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 6 + p.t * 14, cy - sz - 6 - p.t * 16, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });
      // 범례
      var ly = r.y + r.h - 4;
      ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
      var x = r.x + 10;
      tri(x + 4, ly - 4, 4.5, T.figAmber, T.figSoftAmber); ctx.fillStyle = T.figMuted; ctx.fillText('기질', x + 12, ly); x += 46;
      ctx.fillStyle = T.figGreen; ctx.beginPath(); ctx.arc(x + 4, ly - 4, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = T.figMuted; ctx.fillText('생성물', x + 12, ly); x += 58;
      if (st.inh !== 'none') {
        if (st.inh === 'comp') tri(x + 4, ly - 4, 4.5, T.figRed, T.figSoftRed); else { ctx.fillStyle = T.figRed; ctx.fillRect(x, ly - 8, 8, 8); }
        ctx.fillStyle = T.figMuted; ctx.fillText(st.inh === 'comp' ? '경쟁적 저해제' : '비경쟁적 저해제', x + 12, ly);
      }
    }
    function enzyme(cx, cy, s, e, T) {
      var bent = e.nonc;
      ctx.fillStyle = T.figSoftViolet; ctx.strokeStyle = T.figViolet; ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - s, cy + s * 0.6);
      ctx.lineTo(cx - s, cy - s * 0.7);
      ctx.lineTo(cx - s * 0.45, cy - s * 0.7);
      if (bent) { ctx.lineTo(cx - s * 0.1, cy - s * 0.35); ctx.lineTo(cx + s * 0.35, cy - s * 0.05); ctx.lineTo(cx + s * 0.45, cy - s * 0.7); }
      else { ctx.lineTo(cx - s * 0.2, cy - s * 0.1); ctx.lineTo(cx + s * 0.2, cy - s * 0.1); ctx.lineTo(cx + s * 0.45, cy - s * 0.7); }
      ctx.lineTo(cx + s, cy - s * 0.7);
      ctx.lineTo(cx + s, cy + s * 0.6);
      ctx.lineTo(cx + s * 0.25, cy + s * 0.6); ctx.lineTo(cx + s * 0.25, cy + s * 0.25); ctx.lineTo(cx - s * 0.25, cy + s * 0.25); ctx.lineTo(cx - s * 0.25, cy + s * 0.6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      if (e.s === 1 || e.s === 2) {
        var c = e.s === 1 ? [T.figAmber, T.figSoftAmber] : [T.figRed, T.figSoftRed];
        if (bent) tri(cx + s * 0.15, cy - s * 0.75, s * 0.32, c[0], c[1]);
        else tri(cx, cy - s * 0.5, s * 0.38, c[0], c[1]);
      }
      if (bent) { ctx.fillStyle = T.figRed; ctx.fillRect(cx - s * 0.22, cy + s * 0.27, s * 0.44, s * 0.33); }
    }
    function tri(x, y, r, stroke, fill) {
      ctx.beginPath(); ctx.moveTo(x - r, y - r * 0.8); ctx.lineTo(x + r, y - r * 0.8); ctx.lineTo(x, y + r * 0.9); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke();
    }
    function drawGraph(T, r) {
      var L = r.x + 44, R = r.x + r.w - 14, Tp = r.y + 24, B = r.y + r.h - 40;
      var sx = function (s) { return L + s / SMAX * (R - L); }, sy = function (v) { return B - v / 110 * (B - Tp); };
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono; ctx.textAlign = 'right';
      [0, 25, 50, 75, 100].forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke(); ctx.fillText(v, L - 5, sy(v) + 4); });
      ctx.textAlign = 'center';
      [0, 10, 20, 30, 40, 50].forEach(function (s) { ctx.fillText(s, sx(s), B + 14); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody;
      ctx.fillText('기질 농도 (상대값)', (L + R) / 2, B + 30);
      ctx.textAlign = 'left'; ctx.fillText('초기 반응 속도 (상대값)', L, Tp - 10);
      function curve(inh, color, lw, dash) {
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.beginPath();
        for (var i = 0; i <= 200; i++) { var s = SMAX * i / 200; if (i) ctx.lineTo(sx(s), sy(rate(inh, s))); else ctx.moveTo(sx(s), sy(rate(inh, s))); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      var cols = { none: T.figBlue, comp: T.figRed, non: T.figViolet };
      ['none', 'comp', 'non'].forEach(function (k) { if (k !== st.inh) curve(k, T.figLine, 1.3, [4, 4]); });
      curve(st.inh, cols[st.inh], 2.8);
      var pv = params(st.inh).v;
      ctx.setLineDash([3, 3]); ctx.strokeStyle = cols[st.inh]; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(L, sy(pv)); ctx.lineTo(R, sy(pv)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = cols[st.inh]; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText('최대 속도 ' + pv, R, sy(pv) - 5);
      // 이름표
      ctx.font = '600 11px ' + T.fontBody; ctx.textAlign = 'right';
      [['none', '저해제 없음', 14], ['comp', '경쟁적', 14], ['non', '비경쟁적', -6]].forEach(function (q) {
        ctx.fillStyle = q[0] === st.inh ? cols[q[0]] : T.figMuted;
        var y = q[0] === 'none' ? sy(rate('none', 30)) - 8 : q[0] === 'comp' ? sy(rate('comp', 30)) + 15 : sy(rate('non', 30)) - 8;
        ctx.fillText(q[1], sx(30), y);
      });
      var s = S(), v = rate(st.inh, s);
      ctx.fillStyle = cols[st.inh]; ctx.strokeStyle = T.figPanel; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx(s), sy(v), 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function update() {
      var s = S(), v = rate(st.inh, s), f = fractions();
      rS.set(String(s)); rV.set(Math.round(v) + (st.inh !== 'none' ? ' (저해제 없을 때 ' + Math.round(rate('none', s)) + ')' : ''));
      var es = st.inh === 'non' ? f.es : f.es;
      rF.set(Math.round(es * 100) + '%' + (st.inh === 'non' ? ' (그중 절반은 모양이 바뀌어 반응 못 함)' : ''));
      rI.set(st.inh === 'none' ? '없음' : st.inh === 'comp' ? '활성 부위를 두고 기질과 경쟁' : '다른 부위에 붙어 효소 모양을 바꿈');
      draw();
    }
    api.onResize(draw);
    syncParticles(); update();
    if (api.reduced) loop.pause();
  },
});
