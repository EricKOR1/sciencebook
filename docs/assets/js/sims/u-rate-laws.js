/* 일반화학 7 화학 반응 속도론: 0·1·2차 적분 속도 법칙 — [A]–t, ln[A]–t, 1/[A]–t 세 그래프와 연이은 반감기 */
Sims.register('u-rate-laws', {
  title: '세 그래프 중 어느 것이 직선일까? — 적분 속도 법칙과 반감기',
  caption: '반응 차수를 고르고 속도 상수 k와 처음 농도 [A]₀을 바꿔 보자. 같은 자료(20 s마다 측정한 점)를 [A], ln[A], 1/[A]로 바꿔 그리면 차수에 맞는 그래프 하나만 직선이 되고, 그 기울기가 −k(0·1차) 또는 +k(2차)이다. 첫 그래프의 점선은 연이은 반감기로, 0차는 짧아지고 1차는 일정하며 2차는 길어진다. 반응은 A → 생성물, 속도 −d[A]/dt = k[A]ⁿ으로 두었고 역반응은 없다고 가정했다.',
  init: function (api) {
    var ORD = [
      { n: 0, name: '0차', unit: 'M/s', kmin: 1e-3, kmax: 2e-2, k: 4e-3, A0: 0.80 },
      { n: 1, name: '1차', unit: 's⁻¹', kmin: 2e-3, kmax: 0.1, k: 1.155e-2, A0: 0.80 },
      { n: 2, name: '2차', unit: 'M⁻¹·s⁻¹', kmin: 0.01, kmax: 2, k: 0.25, A0: 0.10 },
    ];
    var TMAX = 200, DT = 20;
    var st = { o: 1, k: ORD[1].k, A0: ORD[1].A0 };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.75 : 0.42; }, label: '농도, ln 농도, 농도 역수를 시간에 대해 그린 세 그래프' });
    var ctx = cv.ctx;

    var rLaw = api.readout('속도 법칙');
    var rHalf = api.readout('연이은 반감기');
    var rStraight = api.readout('직선인 그래프');

    var g = api.group();
    var btns = ORD.map(function (o, i) {
      return api.button(o.name + ' 반응', function () { choose(i); }, { toggle: true, pressed: i === st.o, parent: g });
    });
    var kS = api.slider({ id: 'u-rate-laws-k', label: '속도 상수 k', min: 0, max: 1, step: 0.0001, value: kToS(st.k),
      format: function (v) { return fmt(sToK(v)) + ' ' + ORD[st.o].unit; },
      onInput: function (v) { st.k = sToK(v); update(); } });
    var aS = api.slider({ id: 'u-rate-laws-a0', label: '처음 농도 [A]₀', min: 0.05, max: 1.0, step: 0.01, value: st.A0,
      format: function (v) { return v.toFixed(2) + ' M'; },
      onInput: function (v) { st.A0 = v; update(); } });

    function kToS(k) { var o = ORD[st.o]; return Math.log(k / o.kmin) / Math.log(o.kmax / o.kmin); }
    function sToK(s) { var o = ORD[st.o]; return o.kmin * Math.pow(o.kmax / o.kmin, s); }
    function choose(i) {
      st.o = i; st.k = ORD[i].k; st.A0 = ORD[i].A0;
      btns.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      kS.set(kToS(st.k)); aS.set(st.A0);
    }
    function conc(t) {
      var n = ORD[st.o].n, k = st.k, a0 = st.A0;
      if (n === 0) return Math.max(0, a0 - k * t);
      if (n === 1) return a0 * Math.exp(-k * t);
      return a0 / (1 + k * a0 * t);
    }
    function halfLife(a) {
      var n = ORD[st.o].n, k = st.k;
      if (n === 0) return a / (2 * k);
      if (n === 1) return Math.LN2 / k;
      return 1 / (k * a);
    }
    function fmt(x) {
      if (x === 0) return '0';
      var ax = Math.abs(x);
      if (ax >= 100) return x.toFixed(0);
      if (ax >= 10) return x.toFixed(1);
      if (ax >= 1) return x.toPrecision(3);
      if (ax >= 0.01) return x.toPrecision(3);
      var e = Math.floor(Math.log10(ax)), m = x / Math.pow(10, e);
      return m.toFixed(2) + '×10' + sup(e);
    }
    function sup(n) { var m = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }; return String(n).split('').map(function (c) { return m[c]; }).join(''); }
    function fmtT(t) { return t >= 1000 ? (t / 60).toFixed(0) + ' min' : t >= 10 ? t.toFixed(0) + ' s' : t.toFixed(1) + ' s'; }
    function niceStep(range, n) {
      var raw = range / n, e = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / e;
      return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * e;
    }

    function update() { readouts(); draw(); }
    function readouts() {
      var n = ORD[st.o].n;
      rLaw.set(n === 0 ? '−d[A]/dt = k' : n === 1 ? '−d[A]/dt = k[A]' : '−d[A]/dt = k[A]²');
      var a = st.A0, t = 0, parts = [];
      for (var i = 0; i < 3; i++) { var h = halfLife(a); parts.push(fmtT(h)); t += h; a /= 2; }
      rHalf.set(parts.join(' → '));
      rStraight.set(n === 0 ? '[A] 대 t (기울기 −k)' : n === 1 ? 'ln[A] 대 t (기울기 −k)' : '1/[A] 대 t (기울기 +k)');
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, stacked = w < 560;
      ctx.clearRect(0, 0, w, h);
      var panels = [];
      for (var i = 0; i < 3; i++) {
        panels.push(stacked ? { x: 0, y: i * h / 3, w: w, h: h / 3 } : { x: i * w / 3, y: 0, w: w / 3, h: h });
      }
      var kinds = [
        { lab: '[A] (M)', f: function (c) { return c; }, ok: function (c) { return c > 0; } },
        { lab: 'ln[A]', f: function (c) { return Math.log(c); }, ok: function (c) { return c > st.A0 * 1e-3; } },
        { lab: '1/[A] (M⁻¹)', f: function (c) { return 1 / c; }, ok: function (c) { return c > st.A0 * 0.02; } },
      ];
      kinds.forEach(function (K, i) { graph(T, panels[i], K, i, i === ORD[st.o].n); });
    }

    function graph(T, r, K, idx, straight) {
      var L = r.x + 50, R = r.x + r.w - 12, Tp = r.y + 30, B = r.y + r.h - 34;
      // 자료: 곡선 + 측정점
      var N = 200, pts = [], tEnd = TMAX;
      for (var i = 0; i <= N; i++) {
        var t = TMAX * i / N, c = conc(t);
        if (!K.ok(c)) { tEnd = t; break; }
        pts.push([t, K.f(c)]);
      }
      var ymin = Infinity, ymax = -Infinity;
      pts.forEach(function (p) { ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); });
      if (idx === 0 || idx === 2) ymin = 0;
      if (idx === 0) ymax = Math.max(ymax, 0.1);
      if (ymax - ymin < 1e-9) { ymax = ymin + 1; }
      var step = niceStep(ymax - ymin, 4);
      ymin = Math.floor(ymin / step) * step; ymax = Math.ceil(ymax / step) * step;
      var sx = function (t) { return L + t / TMAX * (R - L); };
      var sy = function (v) { return B - (v - ymin) / (ymax - ymin) * (B - Tp); };
      // 틀
      if (straight) {
        ctx.fillStyle = T.figSoftGreen; ctx.globalAlpha = 0.55;
        ctx.fillRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8); ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = T.rule; ctx.lineWidth = 1;
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      for (var v = ymin; v <= ymax + step * 0.01; v += step) {
        ctx.beginPath(); ctx.moveTo(L, sy(v)); ctx.lineTo(R, sy(v)); ctx.stroke();
        ctx.fillText(fmtTick(v, step), L - 5, sy(v) + 4);
      }
      ctx.textAlign = 'center';
      for (var tt = 0; tt <= TMAX; tt += 50) ctx.fillText(tt, sx(tt), B + 14);
      ctx.strokeStyle = T.figInk; ctx.beginPath(); ctx.moveTo(L, Tp - 4); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillText(K.lab + ' 대 t', L, r.y + 18);
      ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figMuted; ctx.textAlign = 'right';
      ctx.fillText('t (s)', R, B + 28);
      if (straight) {
        ctx.fillStyle = T.figGreen; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'right';
        ctx.fillText('직선! 기울기 ' + (idx === 2 ? '+' : '−') + 'k', R, r.y + 18);
      }
      // 반감기 표시(첫 그래프)
      var col = straight ? T.figGreen : T.figAccent;
      if (idx === 0) {
        var a = st.A0, t0 = 0;
        for (var j = 0; j < 4; j++) {
          var hl = halfLife(a); t0 += hl; a /= 2;
          if (t0 > TMAX) break;
          ctx.setLineDash([4, 3]); ctx.strokeStyle = T.figAmber; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(sx(t0), sy(a)); ctx.lineTo(sx(t0), B); ctx.moveTo(L, sy(a)); ctx.lineTo(sx(t0), sy(a)); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = T.figAmber; ctx.beginPath(); ctx.arc(sx(t0), sy(a), 3.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      // 곡선
      ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath();
      pts.forEach(function (p, i) { if (i) ctx.lineTo(sx(p[0]), sy(p[1])); else ctx.moveTo(sx(p[0]), sy(p[1])); });
      ctx.stroke();
      // 측정점
      for (var td = 0; td <= TMAX; td += DT) {
        var c = conc(td); if (!K.ok(c)) break;
        ctx.beginPath(); ctx.arc(sx(td), sy(K.f(c)), 3.2, 0, Math.PI * 2);
        ctx.fillStyle = T.figPanel; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = col; ctx.stroke();
      }
      if (tEnd < TMAX && idx > 0) {
        ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'left';
        ctx.fillText(idx === 1 && ORD[st.o].n === 0 ? '[A] → 0이면 ln[A] → −∞' : '[A]가 0에 가까워 이후 생략', L + 6, Tp + 12);
      }
    }
    function fmtTick(v, step) {
      var d = step >= 1 ? 0 : step >= 0.1 ? 1 : step >= 0.01 ? 2 : 3;
      return v.toFixed(d).replace('-', '−');
    }

    api.onResize(draw);
    update();
  },
});
