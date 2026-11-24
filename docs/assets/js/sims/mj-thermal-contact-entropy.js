/* 물리화학 2: 단열 상자 속 두 물체의 열 접촉 — 온도와 엔트로피의 시간 변화, 엔트로피 생성, 잃어버린 일, 가역 기관 연결 */
Sims.register('mj-thermal-contact-entropy', {
  title: '두 물체의 열 접촉 — 엔트로피 생성과 가역 기관을 넣었을 때',
  caption: '두 물체의 처음 온도와 열용량, 사이 벽의 열전도도를 정하고 「처음부터 재생」을 눌러 보자. 직접 맞닿으면 두 온도는 산술(열용량 가중) 평균으로 모이고, 뜨거운 쪽의 엔트로피 감소보다 차가운 쪽의 증가가 커서 전체 엔트로피는 계속 늘다가 평형에서 평평해진다. 열전도도는 평형에 이르는 빠르기만 바꾸고 생성되는 엔트로피의 총량은 바꾸지 않는다. 「가역 기관 연결」을 고르면 두 물체 사이에서 가역 기관이 일을 뽑아내므로 전체 엔트로피는 변하지 않고, 나중 온도는 기하(가중) 평균으로 더 낮으며, 그 차이만큼의 에너지가 일로 나온다. 가정: 열용량은 온도와 무관, 상자는 단열, 열 흐름 속도는 온도 차에 비례(뉴턴 냉각), 잃어버린 일은 25 ℃(298.15 K) 환경 기준 T₀·S_생성이다. 기본값(373 K와 273 K, 각 385 J/K)은 예제 10을 1 K 단위로 맞춘 것이어서 전체 ΔS가 9.34 J/K로 나오며, 예제의 9.33 J/K(373.15 K와 273.15 K)와는 반올림만큼 다르다.',
  init: function (api) {
    var T0 = 298.15, TMAX = 1000;   // 그래프 시간 축 (s)
    var st = { T1: 373, T2: 273, C1: 385, C2: 385, K: 5, engine: false, t: 0, a: 0, b: 0, Q: 0, W: 0, hist: [] };
    var cv = api.canvas({ aspect: function (w) { return w < 560 ? 1.3 : 0.56; }, label: '두 물체의 온도와 엔트로피의 시간 변화' });
    var ctx = cv.ctx;
    var rTf = api.readout('나중 온도(예상)');
    var rQ = api.readout('누적 이동 열(뜨거운 쪽이 잃은 열)');
    var rS = api.readout('ΔS_전체 = S_생성');
    var rL = api.readout('잃어버린 일 T₀·S_생성 / 얻은 일');
    function sl(id, label, min, max, step, key, unit) {
      return api.slider({ id: 'mj-thermal-contact-entropy-' + id, label: label, min: min, max: max, step: step, value: st[key],
        format: function (v) { return v + unit; }, onInput: function (v) { st[key] = v; full(); } });
    }
    sl('t1', '물체 1 처음 온도', 250, 500, 1, 'T1', ' K');
    sl('t2', '물체 2 처음 온도', 250, 500, 1, 'T2', ' K');
    sl('c1', '물체 1 열용량', 100, 2000, 5, 'C1', ' J/K');
    sl('c2', '물체 2 열용량', 100, 2000, 5, 'C2', ' J/K');
    sl('k', '벽의 열전도도', 1, 20, 0.5, 'K', ' W/K');
    var g = api.group();
    var bDirect = api.button('직접 접촉', function () { st.engine = false; mode(); }, { toggle: true, pressed: true, parent: g });
    var bEng = api.button('가역 기관 연결', function () { st.engine = true; mode(); }, { toggle: true, pressed: false, parent: g });
    var bPlay = api.button('처음부터 재생', function () {
      if (loop.wanted) { loop.pause(); bPlay.textContent = '계속'; }
      else { if (st.t >= TMAX) reset(); loop.play(); bPlay.textContent = '멈춤'; }
    }, { primary: true });
    api.button('끝 상태 보기', function () { loop.pause(); runTo(TMAX); bPlay.textContent = '처음부터 재생'; draw(); });
    function mode() { bDirect.setAttribute('aria-pressed', st.engine ? 'false' : 'true'); bEng.setAttribute('aria-pressed', st.engine ? 'true' : 'false'); full(); }
    function full() { reset(); runTo(TMAX); bPlay.textContent = '처음부터 재생'; draw(); }

    function reset() { st.t = 0; st.a = st.T1; st.b = st.T2; st.Q = 0; st.W = 0; st.hist = [[0, st.a, st.b]]; if (loop) { loop.pause(); bPlay.textContent = '시작'; } draw(); }
    /* 한 걸음(dt 초): 뜨거운 쪽에서 나오는 열 흐름 qdot = K(Ta − Tb) */
    function step(dt) {
      var qd = st.K * (st.a - st.b);   // 물체 1 → 2 방향(음수면 반대)
      if (!st.engine) { st.a -= qd * dt / st.C1; st.b += qd * dt / st.C2; st.Q += qd * dt; }
      else {
        var hot = st.a >= st.b, Th = hot ? st.a : st.b, Tc = hot ? st.b : st.a, q = Math.abs(qd) * dt, qc = q * Tc / Th;
        /* 가역 기관: 두 물체의 엔트로피 합이 변하지 않게 차가운 쪽 온도를 정확히 맞춘다 */
        var Ch = hot ? st.C1 : st.C2, Cc = hot ? st.C2 : st.C1, Thn = Th - q / Ch, Tcn = Tc * Math.pow(Th / Thn, Ch / Cc);
        if (hot) { st.a = Thn; st.b = Tcn; } else { st.b = Thn; st.a = Tcn; }
        st.Q += hot ? q : -q; st.W += q - Cc * (Tcn - Tc);
      }
      st.t += dt;
    }
    function runTo(tEnd) {
      while (st.t < tEnd - 1e-9) {
        var tau = Math.min(st.C1, st.C2) / st.K, h = Math.min(tau / 50, 0.5, tEnd - st.t);
        step(h);
        var last = st.hist[st.hist.length - 1];
        if (st.t - last[0] >= 2 || st.t >= tEnd - 1e-9) st.hist.push([st.t, st.a, st.b]);
      }
    }
    var loop = api.loop(function (dt) {
      runTo(Math.min(TMAX, st.t + dt * 100));   // 화면 1초 = 100초
      if (st.t >= TMAX) { loop.pause(); bPlay.textContent = '처음부터 재생'; }
      draw();
    });

    function dS(a, b) { return { s1: st.C1 * Math.log(a / st.T1), s2: st.C2 * Math.log(b / st.T2) }; }
    function finals() {
      var Ta = (st.C1 * st.T1 + st.C2 * st.T2) / (st.C1 + st.C2);
      var Tg = Math.exp((st.C1 * Math.log(st.T1) + st.C2 * Math.log(st.T2)) / (st.C1 + st.C2));
      return { Ta: Ta, Tg: Tg };
    }
    function axes(T, r, ymin, ymax, yt, yl, showX) {
      var L = r.x + 56, R = r.x + r.w - 92, Tp = r.y + 24, B = r.y + r.h - (showX ? 38 : 16);
      var o = { L: L, R: R, T: Tp, B: B, X: function (v) { return L + v / TMAX * (R - L); }, Y: function (v) { return B - (v - ymin) / (ymax - ymin) * (B - Tp); } };
      ctx.lineWidth = 1; ctx.strokeStyle = T.rule; ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontMono;
      ctx.textAlign = 'right'; yt.forEach(function (v) { ctx.beginPath(); ctx.moveTo(L, o.Y(v)); ctx.lineTo(R, o.Y(v)); ctx.stroke(); ctx.fillText(String(Math.round(v)), L - 5, o.Y(v) + 4); });
      ctx.textAlign = 'center'; [0, 250, 500, 750, 1000].forEach(function (v) { ctx.beginPath(); ctx.moveTo(o.X(v), Tp); ctx.lineTo(o.X(v), B); ctx.stroke(); if (showX) ctx.fillText(String(v), o.X(v), B + 14); });
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText(yl, r.x + 4, r.y + 13);
      if (showX) { ctx.textAlign = 'center'; ctx.fillText('시간 t (s)', (L + R) / 2, B + 30); }
      return o;
    }
    function ticks(lo, hi, n) {
      var raw = (hi - lo) / n, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p, s = (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p, out = [];
      for (var v = Math.ceil(lo / s) * s; v <= hi + 1e-9; v += s) out.push(v);
      return out;
    }
    function plotLine(o, key, color, width) {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
      st.hist.forEach(function (hh, i) { var x = o.X(hh[0]), y = o.Y(key(hh)); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke();
    }
    function tag(o, txt, y, color) { ctx.fillStyle = color; ctx.font = '600 12px ' + api.tokens().fontBody; ctx.textAlign = 'left'; ctx.fillText(txt, o.R + 6, y + 4); }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, F = finals(), Tf = st.engine ? F.Tg : F.Ta;
      ctx.clearRect(0, 0, w, h);
      var top = { x: 0, y: 0, w: w, h: h * 0.47 }, bot = { x: 0, y: h * 0.49, w: w, h: h * 0.51 };
      var lo = Math.min(st.T1, st.T2) - 10, hi = Math.max(st.T1, st.T2) + 10;
      var a = axes(T, top, lo, hi, ticks(lo, hi, 4), '온도 T (K)', false);
      ctx.setLineDash([5, 4]); ctx.strokeStyle = T.figMuted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a.L, a.Y(Tf)); ctx.lineTo(a.R, a.Y(Tf)); ctx.stroke(); ctx.setLineDash([]);
      plotLine(a, function (hh) { return hh[1]; }, T.figRed, 2.6);
      plotLine(a, function (hh) { return hh[2]; }, T.figBlue, 2.6);
      var last = st.hist[st.hist.length - 1];
      var y1 = a.Y(last[1]), y2 = a.Y(last[2]); if (Math.abs(y1 - y2) < 14) { var m = (y1 + y2) / 2; y1 = m - 7 * (st.T1 >= st.T2 ? 1 : -1); y2 = m + 7 * (st.T1 >= st.T2 ? 1 : -1); }
      tag(a, '물체 1', y1, T.figRed); tag(a, '물체 2', y2, T.figBlue);
      ctx.fillStyle = T.figMuted; ctx.font = '11px ' + T.fontBody; ctx.textAlign = 'right';
      ctx.fillText((st.engine ? '기하 평균 ' : '가중 산술 평균 ') + Tf.toFixed(1) + ' K', a.R - 4, a.Y(Tf) + (st.T1 > st.T2 ? -6 : 14));
      // 엔트로피
      var e1 = st.C1 * Math.log(Tf / st.T1), e2 = st.C2 * Math.log(Tf / st.T2);
      var slo = Math.min(e1, e2, 0) * 1.1 - 2, shi = Math.max(e1, e2, 0) * 1.1 + 2;
      var b = axes(T, bot, slo, shi, ticks(slo, shi, 4), '엔트로피 변화 ΔS (J/K)', true);
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(b.L, b.Y(0)); ctx.lineTo(b.R, b.Y(0)); ctx.stroke();
      plotLine(b, function (hh) { return dS(hh[1], hh[2]).s1; }, T.figRed, 2);
      plotLine(b, function (hh) { return dS(hh[1], hh[2]).s2; }, T.figBlue, 2);
      plotLine(b, function (hh) { var d = dS(hh[1], hh[2]); return d.s1 + d.s2; }, T.figViolet, 3.2);
      var d = dS(last[1], last[2]), tot = d.s1 + d.s2;
      var ys = [[b.Y(d.s1), '물체 1', T.figRed], [b.Y(d.s2), '물체 2', T.figBlue], [b.Y(tot), '전체', T.figViolet]].sort(function (p, q) { return p[0] - q[0]; });
      for (var i = 1; i < 3; i++) if (ys[i][0] - ys[i - 1][0] < 14) ys[i][0] = ys[i - 1][0] + 14;
      ys.forEach(function (y) { tag(b, y[1], y[0], y[2]); });
      // 값
      rTf.set(Tf.toFixed(1) + ' K' + (st.engine ? ' (기하 평균)' : ' (가중 산술 평균)'));
      rQ.set((Math.abs(st.Q) / 1000).toFixed(2) + ' kJ');
      rS.set((Math.abs(tot) < 0.005 ? 0 : tot).toFixed(2) + ' J/K' + (st.engine ? ' (가역: 0)' : ''));
      rL.set(st.engine ? '얻은 일 ' + (st.W / 1000).toFixed(2) + ' kJ' : (T0 * tot / 1000).toFixed(2) + ' kJ');
    }
    function subify(root) {
      var wk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [];
      while (wk.nextNode()) list.push(wk.currentNode);
      list.forEach(function (t) {
        if (!/_[^\s]/.test(t.nodeValue)) return;
        var fr = document.createDocumentFragment();
        t.nodeValue.split(/_(생성|전체|[A-Za-z0-9]+)/).forEach(function (p, i) {
          if (i % 2) { var s = document.createElement('sub'); s.textContent = p; fr.appendChild(s); } else if (p) fr.appendChild(document.createTextNode(p));
        });
        t.parentNode.replaceChild(fr, t);
      });
    }
    api.onResize(draw);
    full();
    subify(api.readouts);
    var cap = api.root.querySelector('.sim-caption'); if (cap) subify(cap);
  },
});
