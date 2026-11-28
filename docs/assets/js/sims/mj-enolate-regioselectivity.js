/* 유기화학 12 ③: 2-메틸사이클로헥산온 엔올레이트의 위치 선택성 — 속도론적 지배와 열역학적 지배를 반응 속도식으로 */
Sims.register('mj-enolate-regioselectivity', {
  title: '엔올레이트 위치 선택성 탐색기 — 2-메틸사이클로헥산온',
  caption: '염기, 당량, 온도, 시간, tert-뷰탄올 첨가량을 바꾸어 보자. 왼쪽 그래프는 시간(로그 눈금)에 따른 속도론적 엔올레이트(C6 쪽, 파랑)·열역학적 엔올레이트(C2 쪽, 빨강)·남은 케톤(회색)의 분율, ' +
    '가운데 막대는 마지막 시각의 비율, 오른쪽은 이때 아이오도메테인으로 가두었을 때의 생성물 비(2,6-다이메틸 : 2,2-다이메틸)이다. ' +
    'LDA·−78 ℃·1당량 넘게에서는 약 99 : 1로 C6 쪽이, 알콕사이드·실온·긴 시간이나 케톤이 남는 조건(당량 1 미만), ROH가 있을 때는 C2 쪽이 쌓인다. ' +
    '모형: 두 탈양성자화의 ΔΔG‡ = 7.5 kJ/mol(아이링 식), 두 엔올레이트의 ΔG° = 5.4 kJ/mol, 짝산 pKa로 정한 역반응, 남은 케톤·ROH를 거치는 양성자 교환. 장벽 값은 염기마다 어림한 가상의 값이며, 다중 알킬화·알돌 같은 부반응은 넣지 않았다.',
  init: function (api) {
    var BASES = [
      { n: 'LDA', pka: 36, g: 43.0 },
      { n: 'LiHMDS', pka: 26, g: 48.0 },
      { n: 'KOtBu', pka: 18, g: 62.0 },
      { n: 'NaOEt', pka: 16, g: 66.0 },
      { n: 'NaH', pka: 35, g: 84.0 },
    ];
    var st = { b: 0, eq: 1.05, T: -78, lt: Math.log10(1800), roh: 0 };
    var cv = api.canvas({ aspect: function (w) { return w < 640 ? 1.75 : 0.42; }, label: '두 엔올레이트 분율의 시간 변화, 마지막 비율 막대, 메틸화 생성물의 비' });
    var ctx = cv.ctx;
    var rB = api.readout('염기의 짝산 pKa'), rR = api.readout('C6 : C2 엔올레이트'), rP = api.readout('MeI 생성물 2,6- : 2,2-');
    var g = api.group();
    var btns = BASES.map(function (b, i) {
      return api.button(b.n, function () { st.b = i; btns.forEach(function (x, j) { x.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); draw(); }, { toggle: true, pressed: i === 0, parent: g });
    });
    api.slider({ id: 'mj-enolate-regioselectivity-eq', label: '염기 당량', min: 0.9, max: 1.2, step: 0.01, value: st.eq, format: function (v) { return v.toFixed(2); }, onInput: function (v) { st.eq = v; draw(); } });
    api.slider({ id: 'mj-enolate-regioselectivity-T', label: '온도', min: -78, max: 25, step: 1, value: st.T, format: function (v) { return v + ' ℃'; }, onInput: function (v) { st.T = v; draw(); } });
    api.slider({ id: 'mj-enolate-regioselectivity-t', label: '반응 시간', min: Math.log10(60), max: Math.log10(36000), step: 0.01, value: st.lt, format: fmtTime, onInput: function (v) { st.lt = v; draw(); } });
    api.slider({ id: 'mj-enolate-regioselectivity-roh', label: 'tBuOH 첨가', min: 0, max: 1, step: 0.05, value: st.roh, format: function (v) { return v.toFixed(2) + ' 당량'; }, onInput: function (v) { st.roh = v; draw(); } });

    function fmtTime(v) { var s = Math.pow(10, v); return s < 3600 ? Math.round(s / 60) + ' min' : (s / 3600).toFixed(s < 36000 ? 1 : 0) + ' h'; }

    var R = 8.314e-3, KB_H = 2.0837e10, C0 = 0.1;
    function simulate() {
      var b = BASES[st.b], TK = st.T + 273.15, RT = R * TK;
      var kk = KB_H * TK * Math.exp(-b.g / RT), kt = KB_H * TK * Math.exp(-(b.g + 7.5) / RT);
      var Kk = Math.pow(10, b.pka - 19), dG = 5.4, f = Math.exp(-dG / RT), Kt = Kk / f;
      var irrev = b.n === 'NaH';
      var kex = KB_H * TK * Math.exp(-60 / RT), kroh = KB_H * TK * Math.exp(-55 / RT);
      var ROH = st.roh * C0;
      function rates(y) {
        var K = y[0], B = y[1], Ek = y[2], Et = y[3], BH = irrev ? 0 : y[4];
        var r1 = kk * K * B - kk / Kk * Ek * BH, r2 = kt * K * B - kt / Kt * Et * BH;
        var r3 = kex * K * (Ek - f * Et), r4 = kroh * ROH * (Ek - f * Et);
        return [-r1 - r2, -r1 - r2, r1 - r3 - r4, r2 + r3 + r4, r1 + r2];
      }
      // 뒤쪽 오일러(음함수) — 빠른 단계와 느린 단계가 섞여도 안정하다. 시간 격자는 로그 간격.
      var y = [C0, C0 * st.eq, 0, 0, 0], tEnd = Math.pow(10, st.lt), out = [[1e-3, y.slice()]];
      var NS = 700, t = 0, lt0 = -4, lt1 = Math.log10(tEnd);
      for (var s = 1; s <= NS; s++) {
        var tn = Math.pow(10, lt0 + (lt1 - lt0) * s / NS), h = tn - t;
        var z = y.slice();
        for (var it = 0; it < 8; it++) {
          var F0 = rates(z), G = z.map(function (v, i) { return v - y[i] - h * F0[i]; });
          var J = [];
          for (var j = 0; j < 5; j++) {
            var zz = z.slice(), d = Math.max(1e-10, Math.abs(z[j]) * 1e-6); zz[j] += d;
            var Fj = rates(zz);
            for (var i = 0; i < 5; i++) { if (!J[i]) J[i] = []; J[i][j] = (i === j ? 1 : 0) - h * (Fj[i] - F0[i]) / d; }
          }
          var dz = solve(J, G.map(function (v) { return -v; }));
          var mx = 0;
          for (var q = 0; q < 5; q++) { z[q] = Math.max(0, z[q] + dz[q]); mx = Math.max(mx, Math.abs(dz[q])); }
          if (mx < 1e-13) break;
        }
        y = z; t = tn;
        out.push([t, y.slice()]);
      }
      return out;
    }
    function solve(A, b) {
      var n = b.length, M = A.map(function (r, i) { return r.slice().concat([b[i]]); });
      for (var c = 0; c < n; c++) {
        var p = c; for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
        var tmp = M[c]; M[c] = M[p]; M[p] = tmp;
        if (Math.abs(M[c][c]) < 1e-300) continue;
        for (var r2 = c + 1; r2 < n; r2++) { var fac = M[r2][c] / M[c][c]; for (var k = c; k <= n; k++) M[r2][k] -= fac * M[c][k]; }
      }
      var x = new Array(n).fill(0);
      for (var i = n - 1; i >= 0; i--) { var sum = M[i][n]; for (var j = i + 1; j < n; j++) sum -= M[i][j] * x[j]; x[i] = Math.abs(M[i][i]) < 1e-300 ? 0 : sum / M[i][i]; }
      return x;
    }

    function ring(T, cx, cy, r, mode) {   // mode: 'k26' 2,6-다이메틸, 'k22' 2,2-다이메틸
      var P = []; for (var i = 0; i < 6; i++) { var a = -Math.PI / 2 + i * Math.PI / 3; P.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1.8; ctx.beginPath();
      P.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath(); ctx.stroke();
      // C1 = P[0] (위), C=O 위로
      ctx.beginPath(); ctx.moveTo(P[0][0] - 2.5, P[0][1]); ctx.lineTo(P[0][0] - 2.5, P[0][1] - r * 0.75); ctx.moveTo(P[0][0] + 2.5, P[0][1]); ctx.lineTo(P[0][0] + 2.5, P[0][1] - r * 0.75); ctx.stroke();
      ctx.fillStyle = T.figRed; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('O', P[0][0], P[0][1] - r * 0.75 - 3);
      function me(p, ang, col) { ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + r * 0.8 * Math.cos(ang), p[1] + r * 0.8 * Math.sin(ang)); ctx.stroke(); }
      me(P[1], -Math.PI / 6, T.figInk);
      if (mode === 'k26') me(P[5], -Math.PI * 5 / 6, T.figBlue);
      else me(P[1], Math.PI / 6, T.figRed);
    }

    function draw() {
      var T = api.tokens(), w = cv.w, h = cv.h, stk = w < 640;
      ctx.clearRect(0, 0, w, h);
      var data = simulate(), last = data[data.length - 1][1];
      var tot = C0, fk = last[2] / tot, ft = last[3] / tot, fK = last[0] / tot;
      var A, Bx, Cx;
      if (stk) { A = { x: 0, y: 0, w: w, h: h * 0.5 }; Bx = { x: 0, y: h * 0.52, w: w * 0.45, h: h * 0.46 }; Cx = { x: w * 0.47, y: h * 0.52, w: w * 0.53, h: h * 0.46 }; }
      else { A = { x: 0, y: 0, w: w * 0.5, h: h }; Bx = { x: w * 0.52, y: 0, w: w * 0.18, h: h }; Cx = { x: w * 0.72, y: 0, w: w * 0.28, h: h }; }
      // 1) 시간 변화
      var L = A.x + 54, Rr = A.x + A.w - 10, Tp = A.y + 24, Bt = A.y + A.h - 36;
      var lt0 = 0, lt1 = st.lt;
      function sx(t) { return L + (Math.log10(Math.max(t, 1)) - lt0) / (lt1 - lt0) * (Rr - L); }
      function sy(v) { return Bt - v * (Bt - Tp); }
      ctx.fillStyle = T.figPanel; ctx.fillRect(L, Tp, Rr - L, Bt - Tp); ctx.strokeStyle = T.figLine; ctx.lineWidth = 1; ctx.strokeRect(L, Tp, Rr - L, Bt - Tp);
      ctx.font = '11px ' + T.fontMono; ctx.fillStyle = T.figMuted; ctx.textAlign = 'center';
      [[1, '1 s'], [10, '10 s'], [60, '1 min'], [600, '10 min'], [3600, '1 h'], [36000, '10 h']].forEach(function (q) {
        if (Math.log10(q[0]) <= lt1 + 1e-6) { var X = sx(q[0]); ctx.fillText(q[1], X, Bt + 14); ctx.save(); ctx.strokeStyle = T.figLine; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(X, Tp); ctx.lineTo(X, Bt); ctx.stroke(); ctx.restore(); }
      });
      ctx.textAlign = 'right';
      [0, 0.5, 1].forEach(function (v) { ctx.fillText(v.toFixed(1), L - 5, sy(v) + 4); });
      ctx.fillStyle = T.figInk; ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('시간 (로그 눈금)', (L + Rr) / 2, Bt + 30);
      ctx.save(); ctx.translate(A.x + 10, (Tp + Bt) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('분율', 0, 0); ctx.restore();
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left'; ctx.fillText('엔올레이트 분율의 시간 변화', L, A.y + 15);
      function curve(idx, col, wd) {
        ctx.beginPath(); var started = false;
        data.forEach(function (d) { if (d[0] < 1) return; var X = sx(d[0]), Y = sy(d[1][idx] / tot); if (started) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); started = true; } });
        ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.stroke();
      }
      curve(0, T.figMuted, 2); curve(2, T.figBlue, 2.6); curve(3, T.figRed, 2.6);
      ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = T.figPanel; ctx.fillRect(L + 2, Tp + 2, 236, 18); ctx.restore();   // 범례 뒤 바탕(곡선과 겹쳐도 읽히게)
      ctx.fillStyle = T.figBlue; ctx.fillText('C6 (속도론적)', L + 6, Tp + 15);
      ctx.fillStyle = T.figRed; ctx.fillText('C2 (열역학적)', L + 100, Tp + 15);
      ctx.fillStyle = T.figMuted; ctx.fillText('케톤', L + 194, Tp + 15);
      // 2) 막대
      var bL = Bx.x + 14, bW = Bx.w - 28, bT = Bx.y + 34, bB = Bx.y + Bx.h - 36;
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('마지막 비율', Bx.x + Bx.w / 2, Bx.y + 15);
      var segs = [[fk, T.figBlue, 'C6'], [ft, T.figRed, 'C2'], [Math.max(0, 1 - fk - ft), T.figLine, '케톤']], yy = bB;
      segs.forEach(function (sg) {
        var hh = sg[0] * (bB - bT); ctx.fillStyle = sg[1]; ctx.fillRect(bL, yy - hh, bW, hh);
        if (hh > 16) { ctx.fillStyle = sg[1] === T.figLine ? T.figInk : T.figPaper; ctx.font = '600 12px ' + T.fontBody; ctx.fillText(sg[2] + ' ' + Math.round(sg[0] * 100) + '%', bL + bW / 2, yy - hh / 2 + 4); }
        yy -= hh;
      });
      ctx.strokeStyle = T.figInk; ctx.lineWidth = 1; ctx.strokeRect(bL, bT, bW, bB - bT);
      // 3) 메틸화 생성물
      var cx0 = Cx.x + Cx.w / 2;
      ctx.fillStyle = T.figInk; ctx.font = '600 12px ' + T.fontBody; ctx.textAlign = 'center'; ctx.fillText('MeI로 가둔 생성물', cx0, Cx.y + 15);
      var rr = Math.min(Cx.w / 7, (Cx.h - 60) / 7, 22), y1 = Cx.y + Cx.h * 0.36, y2 = Cx.y + Cx.h * 0.78;
      var en = fk + ft || 1, p26 = fk / en, p22 = ft / en;
      ring(T, Cx.x + Cx.w * 0.28, y1, rr, 'k26'); ring(T, Cx.x + Cx.w * 0.28, y2, rr, 'k22');
      ctx.font = '12px ' + T.fontBody; ctx.textAlign = 'left';
      ctx.fillStyle = T.figBlue; ctx.fillText('2,6-다이메틸', Cx.x + Cx.w * 0.52, y1 - 2); ctx.font = '600 15px ' + T.fontBody; ctx.fillText((p26 * 100).toFixed(p26 > 0.995 || p26 < 0.005 ? 1 : 0) + ' %', Cx.x + Cx.w * 0.52, y1 + 16);
      ctx.font = '12px ' + T.fontBody; ctx.fillStyle = T.figRed; ctx.fillText('2,2-다이메틸', Cx.x + Cx.w * 0.52, y2 - 2); ctx.font = '600 15px ' + T.fontBody; ctx.fillText((p22 * 100).toFixed(p22 > 0.995 || p22 < 0.005 ? 1 : 0) + ' %', Cx.x + Cx.w * 0.52, y2 + 16);
      var b = BASES[st.b];
      rB.set(b.pka + (b.n === 'NaH' ? ' (H₂, 비가역)' : ''));
      rR.set(en > 1e-6 ? (p26 * 100).toFixed(1) + ' : ' + (p22 * 100).toFixed(1) + (fK > 0.01 ? ' (케톤 ' + Math.round(fK * 100) + ' % 남음)' : '') : '—');
      rP.set(en > 1e-6 ? Math.round(p26 * 100) + ' : ' + Math.round(p22 * 100) : '—');
    }
    api.onResize(draw);
    api.onTheme(draw);
    draw();
  },
});
