/* 유기화학 8 콘주게이션계: 뷰타다이엔 + HBr의 1,2-/1,4-첨가 — 속도론적 지배와 열역학적 지배 탐색기
   모형: 공통 중간체 I ⇌ P12, I ⇌ P14. 아이링 식(κ = 1) k = (k_B T/h) e^(−ΔG‡/RT).
   I에서 두 생성물로 가는 장벽(약 20 kJ/mol)은 역반응 장벽보다 훨씬 낮아 I는 곧바로 소비된다(정류 상태).
   그러면 처음 비는 f12 = k12/(k12 + k14), 이후 두 생성물은 I를 거쳐 1차 반응처럼 바뀐다:
   x(t) = x_eq + (x0 − x_eq) e^(−(ka + kb)t),  ka = k(P12→I)·f14,  kb = k(P14→I)·f12,  x_eq = kb/(ka + kb) = 1/(1 + K). */
Sims.register('mj-kinetic-thermo-control', {
  title: '속도론적 지배와 열역학적 지배 — 온도와 시간이 바꾸는 1,2 : 1,4 비',
  caption: '온도를 −80 ℃에서 +40 ℃로 올려 보자. 처음에는 꼭대기 높이 차(ΔΔG‡)가 정한 속도론적 비(파란 점선)로 생성물이 생기고, 역반응이 일어날 만큼 시간이 흐르면 골짜기 깊이 차(ΔG°)가 정한 평형 비(빨간 점선)로 옮겨 간다. ' +
    '온도가 높을수록, 역반응 장벽이 낮을수록 이 넘어감이 일찍 일어난다. 기본값(ΔΔG‡ 2.2, ΔG° 3.6, 역반응 장벽 88 kJ/mol)은 −80 ℃에서 약 80 : 20, 40 ℃·1시간에서 약 20 : 80을 준다. ' +
    '중간체는 정류 상태로 두었고, 장벽 값은 온도와 무관하다고 가정한 모형이다.',
  init: function (api) {
    var R = 8.314, KBH = 2.0837e10;
    var st = { T: 40, lt: Math.log10(3600), dd: 2.2, dg: 3.6, er: 88 };
    var cv = api.canvas({ aspect: function (w) { return w < 640 ? 1.25 : 0.46; }, label: '1,2-생성물과 1,4-생성물의 분율–시간 그래프와 에너지 도표' });
    var ctx = cv.ctx;
    var rK = api.readout('속도론적 비 1,2 : 1,4'), rE = api.readout('평형 비 1,2 : 1,4'), rH = api.readout('평형까지 반감기'), rN = api.readout('선택한 시간의 비');
    function ft(v) { var s = Math.pow(10, v); return s < 60 ? s.toFixed(s < 10 ? 1 : 0) + ' s' : s < 3600 ? (s / 60).toFixed(s < 600 ? 1 : 0) + ' 분' : (s / 3600).toFixed(1) + ' 시간'; }
    api.slider({ id: 'mj-kinetic-thermo-control-T', label: '온도', min: -100, max: 80, step: 1, value: st.T, format: function (v) { return v + ' ℃'; }, onInput: function (v) { st.T = v; draw(); } });
    api.slider({ id: 'mj-kinetic-thermo-control-t', label: '반응 시간', min: 0, max: Math.log10(36000), step: 0.01, value: st.lt, format: ft, onInput: function (v) { st.lt = v; draw(); } });
    api.slider({ id: 'mj-kinetic-thermo-control-dd', label: 'ΔΔG‡', min: 0, max: 10, step: 0.1, value: st.dd, format: function (v) { return v.toFixed(1) + ' kJ/mol'; }, onInput: function (v) { st.dd = v; draw(); } });
    api.slider({ id: 'mj-kinetic-thermo-control-dg', label: '생성물 G 차 (ΔG°)', min: 0, max: 10, step: 0.1, value: st.dg, format: function (v) { return v.toFixed(1) + ' kJ/mol'; }, onInput: function (v) { st.dg = v; draw(); } });
    api.slider({ id: 'mj-kinetic-thermo-control-er', label: '역반응 장벽', min: 60, max: 100, step: 0.5, value: st.er, format: function (v) { return v.toFixed(1) + ' kJ/mol'; }, onInput: function (v) { st.er = v; draw(); } });

    function model(Tc) {
      var T = Tc + 273.15, RT = R * T / 1000, pre = KBH * T;
      var g12T = 20, g14T = 20 + st.dd;                       // 중간체 I = 0 기준(kJ/mol)
      var G12 = g12T - st.er, G14 = G12 - st.dg;
      var k12 = pre * Math.exp(-g12T / RT), k14 = pre * Math.exp(-g14T / RT);
      var kr12 = pre * Math.exp(-(g12T - G12) / RT), kr14 = pre * Math.exp(-(g14T - G14) / RT);
      var f12 = k12 / (k12 + k14), f14 = 1 - f12;
      var ka = kr12 * f14, kb = kr14 * f12, s = ka + kb;
      return { f12: f12, xeq: kb / s, s: s, x: function (t) { return kb / s + (f12 - kb / s) * Math.exp(-s * t); } };
    }
    function pct(x) { return Math.round(x * 100) + ' : ' + Math.round((1 - x) * 100); }
    function fsec(s) {
      if (!isFinite(s) || s > 3.15e9) return '100년 이상(사실상 멈춤)';
      if (s < 1e-3) return '1 ms 미만';
      if (s < 60) return s.toPrecision(2) + ' s';
      if (s < 3600) return (s / 60).toPrecision(2) + ' 분';
      if (s < 86400 * 2) return (s / 3600).toPrecision(2) + ' 시간';
      if (s < 3.15e7) return (s / 86400).toPrecision(2) + ' 일';
      return (s / 3.15e7).toPrecision(2) + ' 년';
    }
    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, narrow = w < 640;
      ctx.clearRect(0, 0, w, h);
      var m = model(st.T), tsel = Math.pow(10, st.lt);
      var eR = narrow ? { x: 0, y: 0, w: w, h: h * 0.36 } : { x: 0, y: 0, w: w * 0.34, h: h };
      var pR = narrow ? { x: 0, y: h * 0.38, w: w, h: h * 0.62 } : { x: w * 0.36, y: 0, w: w * 0.64, h: h };
      // ── 에너지 도표(모식, 세로 배율 고정)
      (function () {
        var x0 = eR.x + 14, x1 = eR.x + eR.w - 10, top = eR.y + 26, bot = eR.y + eR.h - 18;
        var span = 120;                       // kJ/mol 범위: +25 ~ −95
        var Y = function (g) { return top + (25 - g) / span * (bot - top); };
        var g12T = 20, g14T = 20 + st.dd, G12 = g12T - st.er, G14 = G12 - st.dg;
        ctx.font = '600 12px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left';
        ctx.fillText('에너지 도표 (중간체 I = 0)', x0, eR.y + 15);
        var xi = x0 + (x1 - x0) * 0.12, xt = x0 + (x1 - x0) * 0.45, xp = x0 + (x1 - x0) * 0.8;
        function curve(gT, gP, col) {
          ctx.beginPath();
          for (var j = 0; j <= 40; j++) {
            var u = j / 40, X, G;
            if (u < 0.45) { var a = u / 0.45; X = xi + (xt - xi) * a; G = gT * (1 - Math.cos(Math.PI * a)) / 2; }
            else { var b = (u - 0.45) / 0.55; X = xt + (xp - xt) * b; G = gT + (gP - gT) * (1 - Math.cos(Math.PI * b)) / 2; }
            if (j) ctx.lineTo(X, Y(G)); else ctx.moveTo(X, Y(G));
          }
          ctx.lineTo(x1 - 4, Y(gP));
          ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.stroke();
        }
        curve(g12T, G12, T.figBlue); curve(g14T, G14, T.figRed);
        ctx.font = '11px ' + T.fontBody; ctx.fillStyle = T.figInk; ctx.textAlign = 'left';
        ctx.fillText('I', xi - 10, Y(0) + 4);
        ctx.fillStyle = T.figBlue; ctx.fillText('1,2', x1 - 22, Y(G12) - 5);
        ctx.fillStyle = T.figRed; ctx.fillText('1,4', x1 - 22, Y(G14) + 14);
        ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
        ctx.fillText('ΔΔG‡ ' + st.dd.toFixed(1), xt, Y(g14T) - 6);
        ctx.fillText('역반응 장벽 ' + st.er.toFixed(0), (xt + xp) / 2 + 6, Y((g12T + G12) / 2));
      })();
      // ── 분율–시간
      var L = pR.x + 60, Rr = pR.x + pR.w - 12, Tp = pR.y + 26, B = pR.y + pR.h - 40;
      var lt0 = 0, lt1 = Math.log10(36000);
      var sx = function (lt) { return L + (lt - lt0) / (lt1 - lt0) * (Rr - L); }, sy = function (y) { return B - y * (B - Tp); };
      ctx.fillStyle = T.figPanel; ctx.fillRect(L, Tp, Rr - L, B - Tp);
      ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, Tp, Rr - L, B - Tp);
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted;
      [[0, '1 s'], [1, '10 s'], [Math.log10(60), '1분'], [Math.log10(600), '10분'], [Math.log10(3600), '1시간'], [Math.log10(36000), '10시간']].forEach(function (q, i, a) {
        ctx.textAlign = i === 0 ? 'left' : i === a.length - 1 ? 'right' : 'center'; ctx.fillText(q[1], sx(q[0]), B + 14);
        ctx.save(); ctx.strokeStyle = T.figLine; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(sx(q[0]), Tp); ctx.lineTo(sx(q[0]), B); ctx.stroke(); ctx.restore();
      });
      [0, 0.25, 0.5, 0.75, 1].forEach(function (y) { ctx.textAlign = 'right'; ctx.fillText(Math.round(y * 100) + '%', L - 5, sy(y) + 4); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center';
      ctx.fillText('반응 시간 (로그 눈금)', (L + Rr) / 2, B + 31);
      ctx.save(); ctx.translate(pR.x + 10, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('생성물 분율', 0, 0); ctx.restore();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('생성물 분율 (' + st.T + ' ℃)', L, pR.y + 15);
      function hline(y, col, lab, below) {
        ctx.save(); ctx.strokeStyle = col; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(L, sy(y)); ctx.lineTo(Rr, sy(y)); ctx.stroke(); ctx.restore();
        ctx.font = '11px ' + T.fontBody; ctx.fillStyle = col; ctx.textAlign = 'right'; ctx.fillText(lab, Rr - 4, sy(y) + (below ? 13 : -4));
      }
      hline(m.f12, T.figBlue, '속도론적 한계 (1,2 분율 = k12/(k12+k14))', m.f12 < m.xeq);
      hline(m.xeq, T.figRed, '평형 (1,2 분율 = 1/(1+K))', m.xeq <= m.f12);
      function plot(fn, col) {
        ctx.beginPath();
        for (var j = 0; j <= 240; j++) { var lt = lt0 + (lt1 - lt0) * j / 240, X = sx(lt), Yv = sy(fn(Math.pow(10, lt))); if (j) ctx.lineTo(X, Yv); else ctx.moveTo(X, Yv); }
        ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.setLineDash([]); ctx.stroke();
      }
      plot(m.x, T.figBlue); plot(function (t) { return 1 - m.x(t); }, T.figRed);
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figBlue; ctx.fillText('1,2-생성물', L + 6, Tp + 14); ctx.fillStyle = T.figRed; ctx.fillText('1,4-생성물', L + 80, Tp + 14);
      var xs = sx(st.lt);
      ctx.strokeStyle = T.figAccent; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(xs, Tp); ctx.lineTo(xs, B); ctx.stroke();
      var xn = m.x(tsel);
      [[xn, T.figBlue], [1 - xn, T.figRed]].forEach(function (q) { ctx.beginPath(); ctx.arc(xs, sy(q[0]), 4.5, 0, 7); ctx.fillStyle = q[1]; ctx.fill(); ctx.strokeStyle = T.figPaper; ctx.lineWidth = 1.5; ctx.stroke(); });
      rK.set(pct(m.f12)); rE.set(pct(m.xeq)); rH.set(fsec(Math.LN2 / m.s));
      var tag = Math.abs(xn - m.f12) < 0.02 ? ' (속도론적)' : Math.abs(xn - m.xeq) < 0.02 ? ' (평형, 열역학적)' : ' (넘어가는 중)';
      rN.set(pct(xn) + tag);
    }
    api.onResize(draw);
    api.onTheme(draw);
    draw();
  },
});
